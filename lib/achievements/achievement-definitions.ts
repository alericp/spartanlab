// Achievement Definitions
// Centralized achievement system for SpartanLab
// Tracks training milestones, strength progress, skill achievements, and consistency
// Philosophy: Realistic goals that reward consistency, not absurd volume requirements

export type AchievementCategory = 'training' | 'strength' | 'skill' | 'consistency' | 'volume' | 'challenge' | 'h2h'
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'elite'

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  icon: 'trophy' | 'medal' | 'star' | 'flame' | 'target' | 'dumbbell' | 'crown' | 'lightning' | 'swords'
  requirement: {
    type: 'workout_count' | 'streak_days' | 'total_reps' | 'strength_milestone' | 'skill_level' | 'hold_time' | 'challenge_count' | 'weeks_active' | 'h2h_wins' | 'h2h_battles' | 'h2h_pool_wins'
    value: number
    exercise?: string
    skill?: string
  }
  // Point value for Spartan Score contribution
  pointValue: number
  // Optional unlock message
  unlockMessage?: string
}

// Export alias for backwards compatibility
export type AchievementDefinition = Achievement

export interface UnlockedAchievement {
  achievementId: string
  unlockedAt: string
  seen: boolean
}

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================
// Philosophy: Tiered progression that rewards realistic athlete behavior
// - Achievable by athletes training 2-5 days/week
// - No meaningless grinding requirements
// - Every milestone represents real progress

export const ACHIEVEMENTS: Achievement[] = [
  // ==========================================================================
  // TRAINING PROGRESS - Workout Count (tiered)
  // ==========================================================================
  {
    id: 'first_workout',
    name: 'First Step',
    description: 'Complete your first recorded workout',
    category: 'training',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'workout_count', value: 1 },
    pointValue: 5,
    unlockMessage: 'Your journey begins now.',
  },
  {
    id: 'workouts_3',
    name: 'Getting Started',
    description: 'Complete 3 workouts',
    category: 'training',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'workout_count', value: 3 },
    pointValue: 10,
  },
  {
    id: 'workouts_5',
    name: 'First Week Done',
    description: 'Complete 5 workouts',
    category: 'training',
    tier: 'bronze',
    icon: 'medal',
    requirement: { type: 'workout_count', value: 5 },
    pointValue: 15,
  },
  {
    id: 'workouts_10',
    name: 'Building Momentum',
    description: 'Complete 10 workouts',
    category: 'training',
    tier: 'bronze',
    icon: 'medal',
    requirement: { type: 'workout_count', value: 10 },
    pointValue: 20,
    unlockMessage: 'Momentum is building.',
  },
  {
    id: 'workouts_25',
    name: 'Committed Athlete',
    description: 'Complete 25 workouts',
    category: 'training',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'workout_count', value: 25 },
    pointValue: 35,
    unlockMessage: 'Real commitment showing.',
  },
  {
    id: 'workouts_50',
    name: 'Consistent Fighter',
    description: 'Complete 50 workouts',
    category: 'training',
    tier: 'silver',
    icon: 'trophy',
    requirement: { type: 'workout_count', value: 50 },
    pointValue: 50,
    unlockMessage: 'Half a century of work.',
  },
  {
    id: 'workouts_100',
    name: 'Centurion',
    description: 'Complete 100 workouts',
    category: 'training',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'workout_count', value: 100 },
    pointValue: 75,
    unlockMessage: 'A true centurion of training.',
  },
  {
    id: 'workouts_250',
    name: 'Spartan Warrior',
    description: 'Complete 250 workouts',
    category: 'training',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'workout_count', value: 250 },
    pointValue: 150,
    unlockMessage: 'You have proven your dedication.',
  },

  // ==========================================================================
  // CONSISTENCY - Streak Days (tiered)
  // ==========================================================================
  {
    id: 'streak_2',
    name: 'Back to Back',
    description: 'Train 2 days in a row',
    category: 'consistency',
    tier: 'bronze',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 2 },
    pointValue: 5,
  },
  {
    id: 'streak_3',
    name: 'Three Day Push',
    description: 'Train 3 days in a row',
    category: 'consistency',
    tier: 'bronze',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 3 },
    pointValue: 10,
  },
  {
    id: 'streak_5',
    name: 'Five Day Focus',
    description: 'Train 5 days in a row',
    category: 'consistency',
    tier: 'bronze',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 5 },
    pointValue: 15,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Train 7 days in a row',
    category: 'consistency',
    tier: 'silver',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 7 },
    pointValue: 25,
    unlockMessage: 'A full week of dedication.',
  },
  {
    id: 'streak_14',
    name: 'Two Week Streak',
    description: 'Train 14 days in a row',
    category: 'consistency',
    tier: 'silver',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 14 },
    pointValue: 40,
    unlockMessage: 'Two weeks without missing.',
  },
  {
    id: 'streak_30',
    name: 'Monthly Dedication',
    description: 'Train 30 days in a row',
    category: 'consistency',
    tier: 'gold',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 30 },
    pointValue: 75,
    unlockMessage: 'A month of pure dedication.',
  },
  {
    id: 'streak_90',
    name: 'Unbreakable',
    description: 'Train 90 days in a row',
    category: 'consistency',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'streak_days', value: 90 },
    pointValue: 200,
    unlockMessage: 'Your discipline is legendary.',
  },

  // ==========================================================================
  // CONSISTENCY - Weeks Active (schedule-friendly)
  // ==========================================================================
  {
    id: 'weeks_active_4',
    name: 'Month of Training',
    description: 'Train at least once per week for 4 weeks',
    category: 'consistency',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'weeks_active', value: 4 },
    pointValue: 20,
    unlockMessage: 'Consistency over intensity.',
  },
  {
    id: 'weeks_active_8',
    name: 'Two Month Commitment',
    description: 'Train at least once per week for 8 weeks',
    category: 'consistency',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'weeks_active', value: 8 },
    pointValue: 40,
  },
  {
    id: 'weeks_active_12',
    name: 'Quarter Year',
    description: 'Train at least once per week for 12 weeks',
    category: 'consistency',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'weeks_active', value: 12 },
    pointValue: 65,
    unlockMessage: 'Three months of sustained effort.',
  },
  {
    id: 'weeks_active_24',
    name: 'Half Year Strong',
    description: 'Train at least once per week for 24 weeks',
    category: 'consistency',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'weeks_active', value: 24 },
    pointValue: 125,
    unlockMessage: 'Six months of dedication.',
  },

  // ==========================================================================
  // STRENGTH MILESTONES - Weighted Pull-Up (tiered)
  // ==========================================================================
  {
    id: 'pullup_10',
    name: 'Added Weight',
    description: 'Weighted pull-up with +10 lbs',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 10, exercise: 'weighted_pull_up' },
    pointValue: 15,
  },
  {
    id: 'pullup_25',
    name: 'Pull-Up Power',
    description: 'Weighted pull-up with +25 lbs',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 25, exercise: 'weighted_pull_up' },
    pointValue: 25,
  },
  {
    id: 'pullup_45',
    name: 'Serious Puller',
    description: 'Weighted pull-up with +45 lbs',
    category: 'strength',
    tier: 'silver',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 45, exercise: 'weighted_pull_up' },
    pointValue: 45,
    unlockMessage: 'A plate added to your pull.',
  },
  {
    id: 'pullup_70',
    name: 'Heavy Puller',
    description: 'Weighted pull-up with +70 lbs',
    category: 'strength',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'strength_milestone', value: 70, exercise: 'weighted_pull_up' },
    pointValue: 70,
  },
  {
    id: 'pullup_90',
    name: 'Elite Pull Strength',
    description: 'Weighted pull-up with +90 lbs',
    category: 'strength',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'strength_milestone', value: 90, exercise: 'weighted_pull_up' },
    pointValue: 100,
    unlockMessage: 'World-class pulling strength.',
  },

  // ==========================================================================
  // STRENGTH MILESTONES - Weighted Dip (tiered)
  // ==========================================================================
  {
    id: 'dip_25',
    name: 'Dip Weight Added',
    description: 'Weighted dip with +25 lbs',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 25, exercise: 'weighted_dip' },
    pointValue: 15,
  },
  {
    id: 'dip_45',
    name: 'Dip Foundation',
    description: 'Weighted dip with +45 lbs',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 45, exercise: 'weighted_dip' },
    pointValue: 25,
  },
  {
    id: 'dip_70',
    name: 'Strong Pusher',
    description: 'Weighted dip with +70 lbs',
    category: 'strength',
    tier: 'silver',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 70, exercise: 'weighted_dip' },
    pointValue: 40,
  },
  {
    id: 'dip_90',
    name: 'Push Powerhouse',
    description: 'Weighted dip with +90 lbs',
    category: 'strength',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'strength_milestone', value: 90, exercise: 'weighted_dip' },
    pointValue: 65,
    unlockMessage: 'Pushing power unlocked.',
  },
  {
    id: 'dip_135',
    name: 'Elite Dip Strength',
    description: 'Weighted dip with +135 lbs',
    category: 'strength',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'strength_milestone', value: 135, exercise: 'weighted_dip' },
    pointValue: 100,
    unlockMessage: 'Three plates on dips. Elite.',
  },

  // ==========================================================================
  // STRENGTH MILESTONES - Bodyweight Reps
  // ==========================================================================
  {
    id: 'pullup_reps_10',
    name: 'Double Digits',
    description: 'Achieve 10 consecutive pull-ups',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 10, exercise: 'max_pull_ups' },
    pointValue: 20,
  },
  {
    id: 'pullup_reps_15',
    name: 'Solid Endurance',
    description: 'Achieve 15 consecutive pull-ups',
    category: 'strength',
    tier: 'silver',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 15, exercise: 'max_pull_ups' },
    pointValue: 35,
  },
  {
    id: 'pullup_reps_20',
    name: 'Twenty Strong',
    description: 'Achieve 20 consecutive pull-ups',
    category: 'strength',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'strength_milestone', value: 20, exercise: 'max_pull_ups' },
    pointValue: 55,
  },
  {
    id: 'dip_reps_15',
    name: 'Dip Endurance',
    description: 'Achieve 15 consecutive dips',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 15, exercise: 'max_dips' },
    pointValue: 20,
  },
  {
    id: 'dip_reps_25',
    name: 'Dip Master',
    description: 'Achieve 25 consecutive dips',
    category: 'strength',
    tier: 'silver',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 25, exercise: 'max_dips' },
    pointValue: 40,
  },

  // ==========================================================================
  // SKILL ACHIEVEMENTS - Front Lever (tiered)
  // ==========================================================================
  {
    id: 'fl_tuck',
    name: 'Front Lever Started',
    description: 'Achieve Tuck Front Lever',
    category: 'skill',
    tier: 'bronze',
    icon: 'target',
    requirement: { type: 'skill_level', value: 1, skill: 'front_lever' },
    pointValue: 25,
    unlockMessage: 'Front lever journey begins.',
  },
  {
    id: 'fl_advanced',
    name: 'Front Lever Progress',
    description: 'Achieve Advanced Tuck Front Lever',
    category: 'skill',
    tier: 'silver',
    icon: 'target',
    requirement: { type: 'skill_level', value: 2, skill: 'front_lever' },
    pointValue: 50,
  },
  {
    id: 'fl_straddle',
    name: 'Front Lever Straddle',
    description: 'Achieve Straddle Front Lever',
    category: 'skill',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'skill_level', value: 3, skill: 'front_lever' },
    pointValue: 85,
  },
  {
    id: 'fl_full',
    name: 'Front Lever Mastery',
    description: 'Achieve Full Front Lever',
    category: 'skill',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'skill_level', value: 4, skill: 'front_lever' },
    pointValue: 150,
    unlockMessage: 'Full front lever achieved. Exceptional.',
  },

  // ==========================================================================
  // SKILL ACHIEVEMENTS - Planche (tiered)
  // ==========================================================================
  {
    id: 'planche_tuck',
    name: 'Planche Started',
    description: 'Achieve Tuck Planche',
    category: 'skill',
    tier: 'bronze',
    icon: 'target',
    requirement: { type: 'skill_level', value: 1, skill: 'planche' },
    pointValue: 25,
    unlockMessage: 'Planche journey begins.',
  },
  {
    id: 'planche_advanced',
    name: 'Planche Progress',
    description: 'Achieve Advanced Tuck Planche',
    category: 'skill',
    tier: 'silver',
    icon: 'target',
    requirement: { type: 'skill_level', value: 2, skill: 'planche' },
    pointValue: 55,
  },
  {
    id: 'planche_straddle',
    name: 'Planche Straddle',
    description: 'Achieve Straddle Planche',
    category: 'skill',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'skill_level', value: 3, skill: 'planche' },
    pointValue: 100,
  },
  {
    id: 'planche_full',
    name: 'Planche Mastery',
    description: 'Achieve Full Planche',
    category: 'skill',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'skill_level', value: 5, skill: 'planche' },
    pointValue: 200,
    unlockMessage: 'Full planche achieved. World-class.',
  },

  // ==========================================================================
  // SKILL ACHIEVEMENTS - Muscle-Up
  // ==========================================================================
  {
    id: 'muscle_up_first',
    name: 'First Muscle-Up',
    description: 'Complete your first muscle-up',
    category: 'skill',
    tier: 'gold',
    icon: 'lightning',
    requirement: { type: 'skill_level', value: 1, skill: 'muscle_up' },
    pointValue: 75,
    unlockMessage: 'Muscle-up unlocked.',
  },
  {
    id: 'muscle_up_strict',
    name: 'Strict Muscle-Up',
    description: 'Achieve strict muscle-up form',
    category: 'skill',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'skill_level', value: 2, skill: 'muscle_up' },
    pointValue: 120,
  },

  // ==========================================================================
  // SKILL ACHIEVEMENTS - HSPU
  // ==========================================================================
  {
    id: 'hspu_wall',
    name: 'HSPU Started',
    description: 'Achieve Wall Handstand Push-Up',
    category: 'skill',
    tier: 'bronze',
    icon: 'target',
    requirement: { type: 'skill_level', value: 1, skill: 'handstand_pushup' },
    pointValue: 25,
  },
  {
    id: 'hspu_freestanding',
    name: 'Freestanding HSPU',
    description: 'Achieve Freestanding Handstand Push-Up',
    category: 'skill',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'skill_level', value: 3, skill: 'handstand_pushup' },
    pointValue: 80,
    unlockMessage: 'Freestanding HSPU achieved.',
  },

  // ==========================================================================
  // CHALLENGE ACHIEVEMENTS
  // ==========================================================================
  {
    id: 'challenge_first',
    name: 'Challenge Accepted',
    description: 'Complete your first challenge',
    category: 'challenge',
    tier: 'bronze',
    icon: 'target',
    requirement: { type: 'challenge_count', value: 1 },
    pointValue: 15,
    unlockMessage: 'First challenge conquered.',
  },
  {
    id: 'challenge_5',
    name: 'Challenge Hunter',
    description: 'Complete 5 challenges',
    category: 'challenge',
    tier: 'bronze',
    icon: 'medal',
    requirement: { type: 'challenge_count', value: 5 },
    pointValue: 30,
  },
  {
    id: 'challenge_10',
    name: 'Challenge Crusher',
    description: 'Complete 10 challenges',
    category: 'challenge',
    tier: 'silver',
    icon: 'trophy',
    requirement: { type: 'challenge_count', value: 10 },
    pointValue: 50,
    unlockMessage: 'Ten challenges down.',
  },
  {
    id: 'challenge_25',
    name: 'Challenge Champion',
    description: 'Complete 25 challenges',
    category: 'challenge',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'challenge_count', value: 25 },
    pointValue: 85,
  },
  {
    id: 'challenge_50',
    name: 'Challenge Legend',
    description: 'Complete 50 challenges',
    category: 'challenge',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'challenge_count', value: 50 },
    pointValue: 150,
    unlockMessage: 'A legend of challenges.',
  },

  // ==========================================================================
  // VOLUME ACHIEVEMENTS (sensible thresholds)
  // ==========================================================================
  {
    id: 'reps_500',
    name: 'First 500',
    description: 'Log 500 total reps',
    category: 'volume',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'total_reps', value: 500 },
    pointValue: 10,
  },
  {
    id: 'reps_1000',
    name: 'Rep Builder',
    description: 'Log 1,000 total reps',
    category: 'volume',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'total_reps', value: 1000 },
    pointValue: 15,
  },
  {
    id: 'reps_2500',
    name: 'Volume Rising',
    description: 'Log 2,500 total reps',
    category: 'volume',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'total_reps', value: 2500 },
    pointValue: 25,
  },
  {
    id: 'reps_5000',
    name: 'Volume Machine',
    description: 'Log 5,000 total reps',
    category: 'volume',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'total_reps', value: 5000 },
    pointValue: 40,
    unlockMessage: 'Five thousand reps logged.',
  },
  {
    id: 'reps_10000',
    name: 'Ten Thousand Strong',
    description: 'Log 10,000 total reps',
    category: 'volume',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'total_reps', value: 10000 },
    pointValue: 65,
    unlockMessage: 'Ten thousand reps. Incredible volume.',
  },
  {
    id: 'reps_25000',
    name: 'Volume Legend',
    description: 'Log 25,000 total reps',
    category: 'volume',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'total_reps', value: 25000 },
    pointValue: 100,
  },

  // ==========================================================================
  // HEAD-TO-HEAD ACHIEVEMENTS
  // ==========================================================================
  {
    id: 'h2h_first_battle',
    name: 'First Battle',
    description: 'Complete your first H2H competition',
    category: 'h2h',
    tier: 'bronze',
    icon: 'swords',
    requirement: { type: 'h2h_battles', value: 1 },
    pointValue: 15,
    unlockMessage: 'You entered the arena.',
  },
  {
    id: 'h2h_first_win',
    name: 'First Victory',
    description: 'Win your first H2H competition',
    category: 'h2h',
    tier: 'bronze',
    icon: 'swords',
    requirement: { type: 'h2h_wins', value: 1 },
    pointValue: 20,
    unlockMessage: 'Victory is yours.',
  },
  {
    id: 'h2h_wins_5',
    name: 'Warrior Rising',
    description: 'Win 5 H2H competitions',
    category: 'h2h',
    tier: 'silver',
    icon: 'swords',
    requirement: { type: 'h2h_wins', value: 5 },
    pointValue: 40,
  },
  {
    id: 'h2h_wins_10',
    name: 'Proven Competitor',
    description: 'Win 10 H2H competitions',
    category: 'h2h',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'h2h_wins', value: 10 },
    pointValue: 65,
    unlockMessage: 'A proven warrior.',
  },
  {
    id: 'h2h_wins_25',
    name: 'Arena Champion',
    description: 'Win 25 H2H competitions',
    category: 'h2h',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'h2h_wins', value: 25 },
    pointValue: 100,
    unlockMessage: 'Arena champion. Feared by all.',
  },
  {
    id: 'h2h_pool_first',
    name: 'Pool Victor',
    description: 'Win your first weekly pool competition',
    category: 'h2h',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'h2h_pool_wins', value: 1 },
    pointValue: 35,
    unlockMessage: 'Top of the pool.',
  },
  {
    id: 'h2h_pool_5',
    name: 'Pool Dominator',
    description: 'Win 5 weekly pool competitions',
    category: 'h2h',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'h2h_pool_wins', value: 5 },
    pointValue: 75,
  },
  {
    id: 'h2h_battles_10',
    name: 'Battle Hardened',
    description: 'Complete 10 H2H competitions',
    category: 'h2h',
    tier: 'silver',
    icon: 'swords',
    requirement: { type: 'h2h_battles', value: 10 },
    pointValue: 30,
  },
  {
    id: 'h2h_battles_25',
    name: 'Arena Veteran',
    description: 'Complete 25 H2H competitions',
    category: 'h2h',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'h2h_battles', value: 25 },
    pointValue: 60,
    unlockMessage: 'A veteran of many battles.',
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
  challenge: 'Challenge Mastery',
  h2h: 'Head-to-Head',
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: AchievementCategory): string {
  return CATEGORY_LABELS[category] || category
}

/**
 * Get color classes for a tier
 */
export function getTierColors(tier: AchievementTier): { bg: string; text: string; border: string; glow: string } {
  return TIER_COLORS[tier] || TIER_COLORS.bronze
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
