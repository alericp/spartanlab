/**
 * SpartanLab Achievement Definitions
 * 
 * Centralized achievement registry for training milestones.
 * Each achievement has a unique ID, display info, and unlock criteria.
 */

// =============================================================================
// TYPES
// =============================================================================

export type AchievementCategory = 
  | 'training_progress'
  | 'strength_milestone'
  | 'skill_progress'
  | 'consistency'
  | 'volume'

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type AchievementConditionType = 
  | 'workout_count'
  | 'streak_days'
  | 'total_reps'
  | 'bodyweight_reps'
  | 'weighted_load'
  | 'skill_level'
  | 'first_action'

export interface AchievementCondition {
  type: AchievementConditionType
  /** Specific exercise or skill name if applicable */
  target?: string
  /** Threshold value to meet (e.g., 10 workouts, 7 days) */
  threshold: number
  /** For weighted achievements, unit context */
  unit?: 'reps' | 'days' | 'lbs' | 'kg' | 'level'
}

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  /** Icon identifier for the badge component */
  icon: 'trophy' | 'flame' | 'target' | 'zap' | 'star' | 'medal' | 'crown' | 'dumbbell'
  /** Unlock condition */
  condition: AchievementCondition
  /** Short celebration message shown on unlock */
  unlockMessage?: string
  /** For future leaderboard scoring */
  pointValue: number
}

export interface UnlockedAchievement {
  achievementId: string
  unlockedAt: string
  /** Snapshot of the value that triggered the unlock */
  triggerValue?: number
}

// =============================================================================
// ACHIEVEMENT REGISTRY
// =============================================================================

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // =========================================
  // TRAINING PROGRESS
  // =========================================
  {
    id: 'first_workout',
    name: 'First Step',
    description: 'Complete your first recorded workout',
    category: 'training_progress',
    tier: 'bronze',
    icon: 'trophy',
    condition: { type: 'workout_count', threshold: 1 },
    unlockMessage: 'Your journey begins!',
    pointValue: 10,
  },
  {
    id: 'workouts_10',
    name: 'Getting Consistent',
    description: 'Complete 10 workouts',
    category: 'training_progress',
    tier: 'bronze',
    icon: 'trophy',
    condition: { type: 'workout_count', threshold: 10 },
    unlockMessage: 'Building momentum!',
    pointValue: 25,
  },
  {
    id: 'workouts_50',
    name: 'Dedicated Athlete',
    description: 'Complete 50 workouts',
    category: 'training_progress',
    tier: 'silver',
    icon: 'medal',
    condition: { type: 'workout_count', threshold: 50 },
    unlockMessage: 'True dedication!',
    pointValue: 100,
  },
  {
    id: 'workouts_100',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    category: 'training_progress',
    tier: 'gold',
    icon: 'crown',
    condition: { type: 'workout_count', threshold: 100 },
    unlockMessage: 'Elite consistency!',
    pointValue: 250,
  },

  // =========================================
  // CONSISTENCY STREAKS
  // =========================================
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Train for 7 consecutive days',
    category: 'consistency',
    tier: 'bronze',
    icon: 'flame',
    condition: { type: 'streak_days', threshold: 7, unit: 'days' },
    unlockMessage: 'One week strong!',
    pointValue: 50,
  },
  {
    id: 'streak_30',
    name: 'Month of Iron',
    description: 'Train for 30 consecutive days',
    category: 'consistency',
    tier: 'silver',
    icon: 'flame',
    condition: { type: 'streak_days', threshold: 30, unit: 'days' },
    unlockMessage: 'A full month of dedication!',
    pointValue: 150,
  },
  {
    id: 'streak_90',
    name: 'Relentless',
    description: 'Train for 90 consecutive days',
    category: 'consistency',
    tier: 'gold',
    icon: 'flame',
    condition: { type: 'streak_days', threshold: 90, unit: 'days' },
    unlockMessage: 'Unstoppable discipline!',
    pointValue: 400,
  },

  // =========================================
  // STRENGTH MILESTONES
  // =========================================
  {
    id: 'pullup_10',
    name: 'Pull-Up Power',
    description: 'Achieve 10 bodyweight pull-ups',
    category: 'strength_milestone',
    tier: 'bronze',
    icon: 'dumbbell',
    condition: { type: 'bodyweight_reps', target: 'pull_up', threshold: 10, unit: 'reps' },
    unlockMessage: 'Solid pulling strength!',
    pointValue: 50,
  },
  {
    id: 'pullup_20',
    name: 'Pull-Up Master',
    description: 'Achieve 20 bodyweight pull-ups',
    category: 'strength_milestone',
    tier: 'silver',
    icon: 'medal',
    condition: { type: 'bodyweight_reps', target: 'pull_up', threshold: 20, unit: 'reps' },
    unlockMessage: 'Impressive pulling endurance!',
    pointValue: 100,
  },
  {
    id: 'weighted_pullup_25',
    name: 'Heavy Puller',
    description: 'Weighted pull-up with +25lbs/11kg',
    category: 'strength_milestone',
    tier: 'silver',
    icon: 'dumbbell',
    condition: { type: 'weighted_load', target: 'weighted_pull_up', threshold: 25, unit: 'lbs' },
    unlockMessage: 'Serious strength!',
    pointValue: 100,
  },
  {
    id: 'weighted_pullup_50',
    name: 'Elite Puller',
    description: 'Weighted pull-up with +50lbs/23kg',
    category: 'strength_milestone',
    tier: 'gold',
    icon: 'crown',
    condition: { type: 'weighted_load', target: 'weighted_pull_up', threshold: 50, unit: 'lbs' },
    unlockMessage: 'Elite level achieved!',
    pointValue: 200,
  },
  {
    id: 'dip_20',
    name: 'Dip Specialist',
    description: 'Achieve 20 bodyweight dips',
    category: 'strength_milestone',
    tier: 'bronze',
    icon: 'dumbbell',
    condition: { type: 'bodyweight_reps', target: 'dip', threshold: 20, unit: 'reps' },
    unlockMessage: 'Strong pushing foundation!',
    pointValue: 50,
  },
  {
    id: 'weighted_dip_45',
    name: 'Heavy Dipper',
    description: 'Weighted dip with +45lbs/20kg',
    category: 'strength_milestone',
    tier: 'silver',
    icon: 'medal',
    condition: { type: 'weighted_load', target: 'weighted_dip', threshold: 45, unit: 'lbs' },
    unlockMessage: 'Impressive pressing power!',
    pointValue: 150,
  },

  // =========================================
  // SKILL PROGRESS
  // =========================================
  {
    id: 'front_lever_tuck',
    name: 'Lever Learner',
    description: 'Achieve Tuck Front Lever hold',
    category: 'skill_progress',
    tier: 'bronze',
    icon: 'star',
    condition: { type: 'skill_level', target: 'front_lever', threshold: 2, unit: 'level' },
    unlockMessage: 'Skill journey started!',
    pointValue: 75,
  },
  {
    id: 'front_lever_advanced',
    name: 'Lever Master',
    description: 'Achieve Advanced Tuck Front Lever',
    category: 'skill_progress',
    tier: 'silver',
    icon: 'medal',
    condition: { type: 'skill_level', target: 'front_lever', threshold: 4, unit: 'level' },
    unlockMessage: 'Mastering the lever!',
    pointValue: 150,
  },
  {
    id: 'planche_tuck',
    name: 'Planche Pioneer',
    description: 'Achieve Tuck Planche hold',
    category: 'skill_progress',
    tier: 'silver',
    icon: 'star',
    condition: { type: 'skill_level', target: 'planche', threshold: 2, unit: 'level' },
    unlockMessage: 'The planche journey begins!',
    pointValue: 100,
  },
  {
    id: 'muscle_up_first',
    name: 'First Muscle-Up',
    description: 'Complete your first muscle-up',
    category: 'skill_progress',
    tier: 'gold',
    icon: 'crown',
    condition: { type: 'skill_level', target: 'muscle_up', threshold: 1, unit: 'level' },
    unlockMessage: 'A major milestone!',
    pointValue: 200,
  },

  // =========================================
  // VOLUME
  // =========================================
  {
    id: 'reps_1000',
    name: 'Thousand Reps',
    description: 'Log 1,000 total reps',
    category: 'volume',
    tier: 'bronze',
    icon: 'target',
    condition: { type: 'total_reps', threshold: 1000 },
    unlockMessage: 'Volume is building!',
    pointValue: 50,
  },
  {
    id: 'reps_5000',
    name: 'Five Thousand Strong',
    description: 'Log 5,000 total reps',
    category: 'volume',
    tier: 'silver',
    icon: 'target',
    condition: { type: 'total_reps', threshold: 5000 },
    unlockMessage: 'Serious work capacity!',
    pointValue: 150,
  },
  {
    id: 'reps_10000',
    name: 'Ten Thousand Club',
    description: 'Log 10,000 total reps',
    category: 'volume',
    tier: 'gold',
    icon: 'medal',
    condition: { type: 'total_reps', threshold: 10000 },
    unlockMessage: 'Legendary volume!',
    pointValue: 300,
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get achievement definition by ID
 */
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

/**
 * Get all achievements in a category
 */
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category)
}

/**
 * Get total possible points from all achievements
 */
export function getTotalPossiblePoints(): number {
  return ACHIEVEMENTS.reduce((sum, a) => sum + a.pointValue, 0)
}

/**
 * Calculate total earned points from unlocked achievements
 */
export function calculateEarnedPoints(unlockedIds: string[]): number {
  return unlockedIds.reduce((sum, id) => {
    const achievement = getAchievementById(id)
    return sum + (achievement?.pointValue || 0)
  }, 0)
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: AchievementCategory): string {
  const names: Record<AchievementCategory, string> = {
    training_progress: 'Training Progress',
    strength_milestone: 'Strength Milestones',
    skill_progress: 'Skill Progress',
    consistency: 'Consistency',
    volume: 'Volume',
  }
  return names[category]
}

/**
 * Get tier display colors
 */
export function getTierColors(tier: AchievementTier): { bg: string; text: string; border: string } {
  const colors: Record<AchievementTier, { bg: string; text: string; border: string }> = {
    bronze: { bg: 'bg-amber-900/30', text: 'text-amber-600', border: 'border-amber-700/50' },
    silver: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-500/50' },
    gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    platinum: { bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-400/50' },
  }
  return colors[tier]
}
