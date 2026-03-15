/**
 * SpartanLab Achievement System
 * 
 * A lightweight achievement framework for training milestones.
 * Designed to be modular for future leaderboard integration.
 */

// Definitions and types
export {
  type AchievementCategory,
  type AchievementTier,
  type AchievementCondition,
  type AchievementConditionType,
  type AchievementDefinition,
  type UnlockedAchievement,
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  getTotalPossiblePoints,
  calculateEarnedPoints,
  getCategoryDisplayName,
  getTierColors,
} from './achievement-definitions'

// Engine and evaluation
export {
  type AchievementCheckResult,
  type AchievementWithProgress,
  type AchievementSummary,
  getUnlockedAchievements,
  isAchievementUnlocked,
  checkAchievements,
  getAchievementsWithProgress,
  getAchievementSummary,
  onTrainingEvent,
  gatherTrainingMetrics,
} from './achievement-engine'
