// Challenge Definitions
// Centralized challenge system for SpartanLab
// Supports weekly, monthly, seasonal, skill, strength, time, and head-to-head challenges
// Design philosophy: realistic goals that reward consistency and skill, not absurd volume

export type ChallengeCategory = 'weekly' | 'monthly' | 'seasonal' | 'special' | 'skill' | 'strength' | 'time' | 'h2h'
export type ChallengeGoalType = 
  | 'workout_count' 
  | 'rep_total' 
  | 'streak_days' 
  | 'skill_sessions' 
  | 'training_minutes' 
  | 'exercise_count'
  | 'skill_milestone'      // Achieve specific skill level
  | 'strength_reps'        // Achieve X consecutive reps
  | 'weighted_strength'    // Achieve X added weight
  | 'timed_max_reps'       // Max reps in time limit
  | 'hold_time'            // Hold for X seconds
  | 'h2h_challenge'        // Head-to-head competition
export type ChallengeRewardType = 'badge' | 'score_boost' | 'achievement_unlock'
export type SeasonId = 'season_1' | 'season_2' | 'season_3' | 'season_4'
export type SkillType = 'front_lever' | 'planche' | 'muscle_up' | 'handstand_pushup' | 'hspu'
export type StrengthExercise = 'pull_ups' | 'dips' | 'push_ups' | 'weighted_pull_up' | 'weighted_dip'

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
  icon: 'flame' | 'target' | 'trophy' | 'star' | 'dumbbell' | 'lightning' | 'medal' | 'crown' | 'zap' | 'clock'
  // Optional skill/exercise specification
  skillType?: SkillType
  exerciseType?: StrengthExercise
  // Time limit for timed challenges (in seconds)
  timeLimit?: number
  // For one-time challenges that don't repeat
  oneTime?: boolean
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
  icon: 'flame' | 'target' | 'trophy' | 'star' | 'dumbbell' | 'lightning' | 'medal' | 'crown' | 'zap' | 'clock'
  tier?: number
  maxTier?: number
  baseId?: string
  // Optional skill/exercise specification
  skillType?: SkillType
  exerciseType?: StrengthExercise
  // Time limit for timed challenges
  timeLimit?: number
  // For one-time challenges
  oneTime?: boolean
}

export interface ChallengeProgress {
  challengeId: string
  currentValue: number
  completed: boolean
  completedAt?: string
  startedAt: string
  // [baseline-vs-earned] ISSUE E: Track source for UI labeling
  progressSource?: 'earned' | 'baseline' | 'mixed'
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
// SKILL CHALLENGES
// =============================================================================
// Milestone-based skill progressions - one-time achievements

const SKILL_CHALLENGES: ChallengeDefinition[] = [
  // Front Lever Progression
  {
    baseId: 'fl_tuck_hold',
    name: 'Tuck Front Lever',
    descriptionTemplate: 'Hold a Tuck Front Lever for {goal} seconds',
    category: 'skill',
    goalType: 'hold_time',
    skillType: 'front_lever',
    icon: 'star',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 5, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 2, goalValue: 10, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 3, goalValue: 15, reward: { type: 'score_boost', value: 40, label: '+40 Spartan Score' } },
    ],
  },
  {
    baseId: 'fl_straddle_hold',
    name: 'Straddle Front Lever',
    descriptionTemplate: 'Hold a Straddle Front Lever for {goal} seconds',
    category: 'skill',
    goalType: 'hold_time',
    skillType: 'front_lever',
    icon: 'star',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 3, reward: { type: 'score_boost', value: 30, label: '+30 Spartan Score' } },
      { tier: 2, goalValue: 8, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
      { tier: 3, goalValue: 12, reward: { type: 'badge', value: 20, label: 'Front Lever Badge' } },
    ],
  },
  // Planche Progression
  {
    baseId: 'planche_tuck_hold',
    name: 'Tuck Planche',
    descriptionTemplate: 'Hold a Tuck Planche for {goal} seconds',
    category: 'skill',
    goalType: 'hold_time',
    skillType: 'planche',
    icon: 'star',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 5, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 2, goalValue: 10, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 3, goalValue: 15, reward: { type: 'score_boost', value: 40, label: '+40 Spartan Score' } },
    ],
  },
  {
    baseId: 'planche_straddle_hold',
    name: 'Straddle Planche',
    descriptionTemplate: 'Hold a Straddle Planche for {goal} seconds',
    category: 'skill',
    goalType: 'hold_time',
    skillType: 'planche',
    icon: 'star',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 3, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 2, goalValue: 8, reward: { type: 'score_boost', value: 60, label: '+60 Spartan Score' } },
      { tier: 3, goalValue: 12, reward: { type: 'badge', value: 21, label: 'Planche Badge' } },
    ],
  },
  // Muscle-Up
  {
    baseId: 'first_muscle_up',
    name: 'First Muscle-Up',
    descriptionTemplate: 'Complete {goal} muscle-up(s)',
    category: 'skill',
    goalType: 'skill_milestone',
    skillType: 'muscle_up',
    icon: 'lightning',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 1, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
      { tier: 2, goalValue: 3, reward: { type: 'score_boost', value: 30, label: '+30 Spartan Score' } },
      { tier: 3, goalValue: 5, reward: { type: 'badge', value: 22, label: 'Muscle-Up Master Badge' } },
    ],
  },
  // HSPU
  {
    baseId: 'wall_hspu',
    name: 'Wall HSPU',
    descriptionTemplate: 'Complete {goal} wall handstand push-ups',
    category: 'skill',
    goalType: 'strength_reps',
    skillType: 'hspu',
    icon: 'zap',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 1, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 2, goalValue: 5, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 3, goalValue: 10, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
    ],
  },
  {
    baseId: 'freestanding_hspu',
    name: 'Freestanding HSPU',
    descriptionTemplate: 'Complete {goal} freestanding HSPU(s)',
    category: 'skill',
    goalType: 'skill_milestone',
    skillType: 'handstand_pushup',
    icon: 'crown',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 1, reward: { type: 'score_boost', value: 60, label: '+60 Spartan Score' } },
      { tier: 2, goalValue: 3, reward: { type: 'badge', value: 23, label: 'HSPU Elite Badge' } },
    ],
  },
]

// =============================================================================
// STRENGTH CHALLENGES
// =============================================================================
// Rep-based and weighted strength progressions

const STRENGTH_CHALLENGES: ChallengeDefinition[] = [
  // Pull-Up Progression
  {
    baseId: 'pullup_reps',
    name: 'Pull-Up Strength',
    descriptionTemplate: 'Complete {goal} consecutive pull-ups',
    category: 'strength',
    goalType: 'strength_reps',
    exerciseType: 'pull_ups',
    icon: 'dumbbell',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 5, reward: { type: 'score_boost', value: 10, label: '+10 Spartan Score' } },
      { tier: 2, goalValue: 10, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 3, goalValue: 15, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 4, goalValue: 20, reward: { type: 'badge', value: 30, label: 'Pull-Up Master Badge' } },
    ],
  },
  // Dip Progression
  {
    baseId: 'dip_reps',
    name: 'Dip Strength',
    descriptionTemplate: 'Complete {goal} consecutive dips',
    category: 'strength',
    goalType: 'strength_reps',
    exerciseType: 'dips',
    icon: 'dumbbell',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 10, reward: { type: 'score_boost', value: 10, label: '+10 Spartan Score' } },
      { tier: 2, goalValue: 15, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 3, goalValue: 20, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 4, goalValue: 30, reward: { type: 'badge', value: 31, label: 'Dip Master Badge' } },
    ],
  },
  // Push-Up Progression
  {
    baseId: 'pushup_reps',
    name: 'Push-Up Endurance',
    descriptionTemplate: 'Complete {goal} consecutive push-ups',
    category: 'strength',
    goalType: 'strength_reps',
    exerciseType: 'push_ups',
    icon: 'dumbbell',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 20, reward: { type: 'score_boost', value: 8, label: '+8 Spartan Score' } },
      { tier: 2, goalValue: 35, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 3, goalValue: 50, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 4, goalValue: 75, reward: { type: 'badge', value: 32, label: 'Push-Up Master Badge' } },
    ],
  },
  // Weighted Pull-Up
  {
    baseId: 'weighted_pullup',
    name: 'Weighted Pull-Up',
    descriptionTemplate: 'Complete a pull-up with +{goal} lbs added',
    category: 'strength',
    goalType: 'weighted_strength',
    exerciseType: 'weighted_pull_up',
    icon: 'trophy',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 25, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 2, goalValue: 45, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 3, goalValue: 70, reward: { type: 'score_boost', value: 55, label: '+55 Spartan Score' } },
      { tier: 4, goalValue: 90, reward: { type: 'badge', value: 33, label: 'Elite Pull Strength Badge' } },
    ],
  },
  // Weighted Dip
  {
    baseId: 'weighted_dip',
    name: 'Weighted Dip',
    descriptionTemplate: 'Complete a dip with +{goal} lbs added',
    category: 'strength',
    goalType: 'weighted_strength',
    exerciseType: 'weighted_dip',
    icon: 'trophy',
    oneTime: true,
    tiers: [
      { tier: 1, goalValue: 45, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 2, goalValue: 70, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 3, goalValue: 90, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
      { tier: 4, goalValue: 135, reward: { type: 'badge', value: 34, label: 'Elite Dip Strength Badge' } },
    ],
  },
]

// =============================================================================
// TIME CHALLENGES
// =============================================================================
// Max reps in time or endurance holds

const TIME_CHALLENGES: ChallengeDefinition[] = [
  {
    baseId: 'pushups_2min',
    name: '2-Minute Push-Up Test',
    descriptionTemplate: 'Complete {goal} push-ups in 2 minutes',
    category: 'time',
    goalType: 'timed_max_reps',
    exerciseType: 'push_ups',
    timeLimit: 120,
    icon: 'clock',
    tiers: [
      { tier: 1, goalValue: 30, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 2, goalValue: 45, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 3, goalValue: 60, reward: { type: 'score_boost', value: 40, label: '+40 Spartan Score' } },
      { tier: 4, goalValue: 80, reward: { type: 'badge', value: 40, label: 'Endurance Elite Badge' } },
    ],
  },
  {
    baseId: 'pullups_1min',
    name: '1-Minute Pull-Up Test',
    descriptionTemplate: 'Complete {goal} pull-ups in 60 seconds',
    category: 'time',
    goalType: 'timed_max_reps',
    exerciseType: 'pull_ups',
    timeLimit: 60,
    icon: 'clock',
    tiers: [
      { tier: 1, goalValue: 8, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 2, goalValue: 12, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 3, goalValue: 18, reward: { type: 'score_boost', value: 40, label: '+40 Spartan Score' } },
      { tier: 4, goalValue: 25, reward: { type: 'badge', value: 41, label: 'Speed Pull Badge' } },
    ],
  },
  {
    baseId: 'lsit_hold',
    name: 'L-Sit Hold',
    descriptionTemplate: 'Hold an L-Sit for {goal} seconds',
    category: 'time',
    goalType: 'hold_time',
    icon: 'clock',
    tiers: [
      { tier: 1, goalValue: 10, reward: { type: 'score_boost', value: 10, label: '+10 Spartan Score' } },
      { tier: 2, goalValue: 20, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 3, goalValue: 30, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 4, goalValue: 45, reward: { type: 'badge', value: 42, label: 'L-Sit Master Badge' } },
    ],
  },
  {
    baseId: 'dead_hang',
    name: 'Dead Hang',
    descriptionTemplate: 'Hold a dead hang for {goal} seconds',
    category: 'time',
    goalType: 'hold_time',
    icon: 'clock',
    tiers: [
      { tier: 1, goalValue: 30, reward: { type: 'score_boost', value: 8, label: '+8 Spartan Score' } },
      { tier: 2, goalValue: 60, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 3, goalValue: 90, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 4, goalValue: 120, reward: { type: 'badge', value: 43, label: 'Grip Legend Badge' } },
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
  
  // Skill challenges (one-time, no period key)
  const skillPeriodKey = 'skill_lifetime'
  SKILL_CHALLENGES.forEach(def => {
    const completedTier = getCurrentTierForChallenge(def.baseId, skillPeriodKey)
    const nextTier = def.tiers.find(t => t.tier > completedTier)
    
    if (nextTier) {
      challenges.push({
        id: `${def.baseId}_t${nextTier.tier}`,
        name: def.name,
        description: def.descriptionTemplate.replace('{goal}', nextTier.goalValue.toLocaleString()),
        category: 'skill',
        startDate: '2020-01-01', // Always available
        endDate: '2099-12-31',
        goalType: def.goalType,
        goalValue: nextTier.goalValue,
        reward: nextTier.reward,
        icon: def.icon,
        tier: nextTier.tier,
        maxTier: def.tiers.length,
        baseId: def.baseId,
        skillType: def.skillType,
        oneTime: true,
      })
    }
  })
  
  // Strength challenges (one-time, no period key)
  const strengthPeriodKey = 'strength_lifetime'
  STRENGTH_CHALLENGES.forEach(def => {
    const completedTier = getCurrentTierForChallenge(def.baseId, strengthPeriodKey)
    const nextTier = def.tiers.find(t => t.tier > completedTier)
    
    if (nextTier) {
      challenges.push({
        id: `${def.baseId}_t${nextTier.tier}`,
        name: def.name,
        description: def.descriptionTemplate.replace('{goal}', nextTier.goalValue.toLocaleString()),
        category: 'strength',
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        goalType: def.goalType,
        goalValue: nextTier.goalValue,
        reward: nextTier.reward,
        icon: def.icon,
        tier: nextTier.tier,
        maxTier: def.tiers.length,
        baseId: def.baseId,
        exerciseType: def.exerciseType,
        oneTime: true,
      })
    }
  })
  
  // Time challenges (repeatable monthly)
  TIME_CHALLENGES.forEach(def => {
    const completedTier = getCurrentTierForChallenge(def.baseId, monthlyPeriodKey)
    const nextTier = def.tiers.find(t => t.tier > completedTier)
    
    if (nextTier) {
      challenges.push({
        id: `${def.baseId}_t${nextTier.tier}_${month.start}`,
        name: def.name,
        description: def.descriptionTemplate.replace('{goal}', nextTier.goalValue.toLocaleString()),
        category: 'time',
        startDate: month.start,
        endDate: month.end,
        goalType: def.goalType,
        goalValue: nextTier.goalValue,
        reward: nextTier.reward,
        icon: def.icon,
        tier: nextTier.tier,
        maxTier: def.tiers.length,
        baseId: def.baseId,
        exerciseType: def.exerciseType,
        timeLimit: def.timeLimit,
      })
    }
  })
  
  return challenges
}

/**
  * Get total number of challenges available (including all tiers)
  */
  export function getTotalChallengeCount(): number {
  let count = 0
  TIERED_CHALLENGES.forEach(c => count += c.tiers.length)
  SEASONAL_CHALLENGES.forEach(c => count += c.tiers.length)
  SKILL_CHALLENGES.forEach(c => count += c.tiers.length)
  STRENGTH_CHALLENGES.forEach(c => count += c.tiers.length)
  TIME_CHALLENGES.forEach(c => count += c.tiers.length)
  return count
  }

/**
  * Get period key for a challenge (used for tier tracking)
  */
  export function getPeriodKeyForChallenge(challenge: Challenge): string {
  if (challenge.category === 'seasonal' && challenge.seasonId) {
    return `seasonal_${challenge.seasonId}`
  }
  if (challenge.category === 'skill') {
    return 'skill_lifetime'
  }
  if (challenge.category === 'strength') {
    return 'strength_lifetime'
  }
  if (challenge.category === 'time') {
    return `time_${challenge.startDate}`
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
  export function getPeriodDisplayName(period: string): string {
    const names: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      seasonal: 'Seasonal',
      skill: 'Skill',
      strength: 'Strength',
      time: 'Timed',
      h2h: 'Head-to-Head',
    }
    return names[period] || period.charAt(0).toUpperCase() + period.slice(1)
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

// =============================================================================
// HEAD-TO-HEAD CHALLENGE TYPES
// =============================================================================
// For optional competitive challenges between users

export interface HeadToHeadChallenge {
  id: string
  challengerId: string
  challengerName: string
  opponentId?: string
  opponentName?: string
  challengeType: 'pushups_2min' | 'pullups_1min' | 'lsit_hold' | 'max_pullups' | 'max_dips'
  status: 'open' | 'accepted' | 'completed' | 'expired'
  challengerScore?: number
  opponentScore?: number
  winnerId?: string
  reward: ChallengeReward
  createdAt: string
  expiresAt: string
  completedAt?: string
}

export const H2H_CHALLENGE_TYPES = {
  pushups_2min: {
    name: '2-Min Push-Up Battle',
    description: 'Most push-ups in 2 minutes wins',
    timeLimit: 120,
    reward: { type: 'score_boost' as const, value: 25, label: '+25 Spartan Score' },
  },
  pullups_1min: {
    name: '1-Min Pull-Up Battle',
    description: 'Most pull-ups in 60 seconds wins',
    timeLimit: 60,
    reward: { type: 'score_boost' as const, value: 25, label: '+25 Spartan Score' },
  },
  lsit_hold: {
    name: 'L-Sit Hold Challenge',
    description: 'Longest L-Sit hold wins',
    timeLimit: null,
    reward: { type: 'score_boost' as const, value: 20, label: '+20 Spartan Score' },
  },
  max_pullups: {
    name: 'Max Pull-Ups',
    description: 'Most consecutive pull-ups wins',
    timeLimit: null,
    reward: { type: 'score_boost' as const, value: 20, label: '+20 Spartan Score' },
  },
  max_dips: {
    name: 'Max Dips',
    description: 'Most consecutive dips wins',
    timeLimit: null,
    reward: { type: 'score_boost' as const, value: 20, label: '+20 Spartan Score' },
  },
}

// H2H Storage
const H2H_STORAGE_KEY = 'spartanlab_h2h_challenges'

export function getHeadToHeadChallenges(): HeadToHeadChallenge[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(H2H_STORAGE_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

export function saveHeadToHeadChallenges(challenges: HeadToHeadChallenge[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(H2H_STORAGE_KEY, JSON.stringify(challenges))
}

export function createHeadToHeadChallenge(
  challengerId: string,
  challengerName: string,
  challengeType: keyof typeof H2H_CHALLENGE_TYPES
): HeadToHeadChallenge {
  const config = H2H_CHALLENGE_TYPES[challengeType]
  const now = new Date()
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const challenge: HeadToHeadChallenge = {
    id: `h2h_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    challengerId,
    challengerName,
    challengeType,
    status: 'open',
    reward: config.reward,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }
  
  const challenges = getHeadToHeadChallenges()
  challenges.push(challenge)
  saveHeadToHeadChallenges(challenges)
  
  return challenge
}

export function acceptHeadToHeadChallenge(
  challengeId: string,
  opponentId: string,
  opponentName: string
): HeadToHeadChallenge | null {
  const challenges = getHeadToHeadChallenges()
  const idx = challenges.findIndex(c => c.id === challengeId)
  if (idx === -1) return null
  
  challenges[idx].opponentId = opponentId
  challenges[idx].opponentName = opponentName
  challenges[idx].status = 'accepted'
  saveHeadToHeadChallenges(challenges)
  
  return challenges[idx]
}

export function submitHeadToHeadResult(
  challengeId: string,
  userId: string,
  score: number
): HeadToHeadChallenge | null {
  const challenges = getHeadToHeadChallenges()
  const idx = challenges.findIndex(c => c.id === challengeId)
  if (idx === -1) return null
  
  const challenge = challenges[idx]
  
  if (userId === challenge.challengerId) {
    challenge.challengerScore = score
  } else if (userId === challenge.opponentId) {
    challenge.opponentScore = score
  }
  
  // Check if both have submitted
  if (challenge.challengerScore !== undefined && challenge.opponentScore !== undefined) {
    challenge.status = 'completed'
    challenge.completedAt = new Date().toISOString()
    
    if (challenge.challengerScore > challenge.opponentScore) {
      challenge.winnerId = challenge.challengerId
    } else if (challenge.opponentScore > challenge.challengerScore) {
      challenge.winnerId = challenge.opponentId
    }
    // Tie = no winner
  }
  
  saveHeadToHeadChallenges(challenges)
  return challenges[idx]
}

export function getOpenHeadToHeadChallenges(): HeadToHeadChallenge[] {
  const now = new Date().toISOString()
  return getHeadToHeadChallenges().filter(
    c => c.status === 'open' && c.expiresAt > now
  )
}

export function getMyHeadToHeadChallenges(userId: string): HeadToHeadChallenge[] {
  return getHeadToHeadChallenges().filter(
    c => c.challengerId === userId || c.opponentId === userId
  )
}

// Category labels for display
export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  seasonal: 'Seasonal',
  special: 'Special Event',
  skill: 'Skill Milestone',
  strength: 'Strength',
  time: 'Timed Challenge',
  h2h: 'Head-to-Head',
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
