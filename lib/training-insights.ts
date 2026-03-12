// Training Insights service for automated training observations
// Generates useful insights from workout data

import {
  calculateWeeklyVolume,
  calculateVolumeDistribution,
  calculateMovementBalance,
  getWeekOverWeekComparison,
} from './volume-analyzer'
import { calculateRecoverySignal } from './recovery-engine'
import { getWorkoutLogs } from './workout-log-service'

export interface TrainingInsight {
  id: string
  type: 'volume' | 'balance' | 'consistency' | 'recovery' | 'info'
  message: string
  priority: 'high' | 'medium' | 'low'
}

// Generate training insights from available data
export function generateTrainingInsights(): TrainingInsight[] {
  const insights: TrainingInsight[] = []
  const allLogs = getWorkoutLogs()
  
  // Check if we have enough data
  if (allLogs.length < 2) {
    insights.push({
      id: 'need-data',
      type: 'info',
      message: 'Log more workouts to unlock personalized training insights.',
      priority: 'low',
    })
    return insights
  }
  
  const weeklyVolume = calculateWeeklyVolume()
  const volumeDistribution = calculateVolumeDistribution()
  const movementBalance = calculateMovementBalance()
  const weekComparison = getWeekOverWeekComparison()
  const recovery = calculateRecoverySignal()
  
  // Week over week volume change insight
  if (weekComparison.previous > 0) {
    if (weekComparison.change > 20) {
      insights.push({
        id: 'volume-increase',
        type: 'volume',
        message: `Training volume increased ${weekComparison.change}% compared to last week. Monitor recovery.`,
        priority: 'medium',
      })
    } else if (weekComparison.change < -20) {
      insights.push({
        id: 'volume-decrease',
        type: 'volume',
        message: `Training volume decreased ${Math.abs(weekComparison.change)}% compared to last week.`,
        priority: 'low',
      })
    } else if (weekComparison.change >= -10 && weekComparison.change <= 10) {
      insights.push({
        id: 'volume-stable',
        type: 'volume',
        message: 'Training volume is consistent week over week. Good adherence.',
        priority: 'low',
      })
    }
  }
  
  // Push/pull balance insight
  if (movementBalance.pushSets > 0 || movementBalance.pullSets > 0) {
    if (movementBalance.ratio > 1.5) {
      insights.push({
        id: 'push-heavy',
        type: 'balance',
        message: 'Push volume significantly exceeds pull volume. Add more pulling work for shoulder health.',
        priority: 'high',
      })
    } else if (movementBalance.ratio < 0.6) {
      insights.push({
        id: 'pull-heavy',
        type: 'balance',
        message: 'Pull volume exceeds push volume. Consider balancing with more pressing work.',
        priority: 'medium',
      })
    }
  }
  
  // Category-specific insights
  const skillVolume = volumeDistribution.find(v => v.category === 'skill')
  const coreVolume = volumeDistribution.find(v => v.category === 'core')
  const mobilityVolume = volumeDistribution.find(v => v.category === 'mobility')
  
  if (skillVolume && skillVolume.sets === 0 && weeklyVolume.workoutsThisWeek >= 2) {
    insights.push({
      id: 'no-skill-work',
      type: 'consistency',
      message: 'No skill practice logged this week. Dedicate time to skill progressions.',
      priority: 'medium',
    })
  }
  
  if (coreVolume && coreVolume.sets === 0 && weeklyVolume.totalSets > 20) {
    insights.push({
      id: 'no-core-work',
      type: 'balance',
      message: 'Core training missing this week. Core strength supports all calisthenics skills.',
      priority: 'low',
    })
  }
  
  if (mobilityVolume && mobilityVolume.sets === 0 && weeklyVolume.workoutsThisWeek >= 3) {
    insights.push({
      id: 'no-mobility',
      type: 'balance',
      message: 'No mobility work logged. Regular mobility supports long-term progress.',
      priority: 'low',
    })
  }
  
  // Recovery insight
  if (recovery.level === 'LOW') {
    insights.push({
      id: 'recovery-low',
      type: 'recovery',
      message: 'High training load detected. Schedule a rest day or deload session.',
      priority: 'high',
    })
  } else if (recovery.level === 'HIGH' && weeklyVolume.workoutsThisWeek === 0) {
    insights.push({
      id: 'ready-to-train',
      type: 'recovery',
      message: 'Fully recovered and ready to train. Start your next session.',
      priority: 'medium',
    })
  }
  
  // Training frequency insight
  if (weeklyVolume.workoutsThisWeek >= 5) {
    insights.push({
      id: 'high-frequency',
      type: 'consistency',
      message: 'High training frequency this week. Ensure adequate sleep and nutrition.',
      priority: 'medium',
    })
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  // Limit to top 5 insights
  return insights.slice(0, 5)
}

// Get insight icon based on type
export function getInsightIcon(type: TrainingInsight['type']): string {
  switch (type) {
    case 'volume':
      return '📊'
    case 'balance':
      return '⚖️'
    case 'consistency':
      return '📅'
    case 'recovery':
      return '🔋'
    case 'info':
      return 'ℹ️'
  }
}
