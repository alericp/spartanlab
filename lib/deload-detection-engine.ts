// Deload Detection Engine
// Identifies when athletes need recovery periods based on tracked signals

import { getSkillSessions, getRecentSkillSessions } from './skill-session-service'
import { calculateRecoverySignal, type RecoveryLevel } from './recovery-engine'
import { calculateWeeklyVolume, getWorkoutsLastNDays } from './volume-analyzer'
import { getRecordsByExercise, type StrengthRecord } from './strength-service'
import { calculateStrengthTrend, type TrendDirection } from './strength-trend-engine'
import { analyzeDensityTrend, analyzeHoldTrend } from './skill-density-engine'

// =============================================================================
// TYPES
// =============================================================================

export type DeloadStatus = 
  | 'no_deload_needed'
  | 'watch_recovery'
  | 'lighten_next_session'
  | 'deload_recommended'

export interface DeloadSignal {
  type: string
  weight: number // 0-10
  description: string
  present: boolean
}

export interface DeloadAssessment {
  status: DeloadStatus
  label: string
  confidence: 'high' | 'medium' | 'low'
  score: number // 0-100, higher = more need for deload
  signals: DeloadSignal[]
  activeSignalCount: number
  explanation: string
  recommendation: string
  suggestedDuration?: string
  suggestedApproach?: string[]
}

// =============================================================================
// SIGNAL DETECTION
// =============================================================================

function detectPerformanceStall(): DeloadSignal {
  // Check strength trends
  const pullRecords = getRecordsByExercise('weighted_pull_up')
  const dipRecords = getRecordsByExercise('weighted_dip')
  
  const pullTrend = calculateStrengthTrend(pullRecords, 'weighted_pull_up')
  const dipTrend = calculateStrengthTrend(dipRecords, 'weighted_dip')
  
  const hasStall = (pullTrend.direction === 'stable' && pullTrend.recordCount >= 4) ||
                   (dipTrend.direction === 'stable' && dipTrend.recordCount >= 4)
  
  return {
    type: 'performance_stall',
    weight: hasStall ? 6 : 0,
    description: 'Strength numbers plateaued over multiple sessions',
    present: hasStall,
  }
}

function detectPerformanceRegression(): DeloadSignal {
  const pullRecords = getRecordsByExercise('weighted_pull_up')
  const dipRecords = getRecordsByExercise('weighted_dip')
  
  const pullTrend = calculateStrengthTrend(pullRecords, 'weighted_pull_up')
  const dipTrend = calculateStrengthTrend(dipRecords, 'weighted_dip')
  
  const hasRegression = pullTrend.direction === 'regressing' || dipTrend.direction === 'regressing'
  
  return {
    type: 'performance_regression',
    weight: hasRegression ? 8 : 0,
    description: 'Strength numbers declining from recent highs',
    present: hasRegression,
  }
}

function detectSkillHoldDecline(): DeloadSignal {
  const sessions = getRecentSkillSessions(14) // Last 2 weeks
  
  if (sessions.length < 3) {
    return {
      type: 'skill_hold_decline',
      weight: 0,
      description: 'Skill hold times decreasing',
      present: false,
    }
  }
  
  // Check hold trends across the most common skill in recent sessions
  const skillCounts: Record<string, number> = {}
  sessions.forEach(s => {
    skillCounts[s.skillName] = (skillCounts[s.skillName] || 0) + 1
  })
  const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]
  
  if (!topSkill) {
    return {
      type: 'skill_hold_decline',
      weight: 0,
      description: 'Skill hold times decreasing',
      present: false,
    }
  }
  
  const skillSessions = sessions.filter(s => s.skillName === topSkill[0])
  const level = skillSessions[0]?.level ?? 0
  
  const holdTrend = analyzeHoldTrend(sessions, topSkill[0], level)
  const hasDecline = holdTrend === 'declining'
  
  return {
    type: 'skill_hold_decline',
    weight: hasDecline ? 7 : 0,
    description: 'Skill hold times decreasing compared to recent sessions',
    present: hasDecline,
  }
}

function detectHighFatigueFrequency(): DeloadSignal {
  const recovery = calculateRecoverySignal()
  const recentWorkouts = getWorkoutsLastNDays(14)
  
  // Check if recovery has been low multiple times
  const isCurrentlyLow = recovery.level === 'LOW'
  const highTrainingDensity = recentWorkouts.length >= 8 // 8+ workouts in 2 weeks
  
  const present = isCurrentlyLow && highTrainingDensity
  
  return {
    type: 'high_fatigue_frequency',
    weight: present ? 7 : 0,
    description: 'Repeated low recovery signals with high training density',
    present,
  }
}

function detectVolumeWithoutProgress(): DeloadSignal {
  const weeklyVolume = calculateWeeklyVolume()
  const pullTrend = calculateStrengthTrend(
    getRecordsByExercise('weighted_pull_up'),
    'weighted_pull_up'
  )
  
  // High volume (60+ sets/week) without improvement
  const highVolume = weeklyVolume.totalSets >= 60
  const noProgress = pullTrend.direction === 'stable' || pullTrend.direction === 'regressing'
  const present = highVolume && noProgress && pullTrend.recordCount >= 3
  
  return {
    type: 'volume_without_progress',
    weight: present ? 6 : 0,
    description: 'High training volume without corresponding strength gains',
    present,
  }
}

function detectDensityDecline(): DeloadSignal {
  const sessions = getRecentSkillSessions(21) // Last 3 weeks
  
  if (sessions.length < 4) {
    return {
      type: 'density_decline',
      weight: 0,
      description: 'Training density declining',
      present: false,
    }
  }
  
  // Find most common skill
  const skillCounts: Record<string, number> = {}
  sessions.forEach(s => {
    skillCounts[s.skillName] = (skillCounts[s.skillName] || 0) + 1
  })
  const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]
  
  if (!topSkill) {
    return {
      type: 'density_decline',
      weight: 0,
      description: 'Training density declining',
      present: false,
    }
  }
  
  const skillSessions = sessions.filter(s => s.skillName === topSkill[0])
  const level = skillSessions[0]?.level ?? 0
  
  const densityTrend = analyzeDensityTrend(sessions, topSkill[0], level)
  const present = densityTrend === 'declining'
  
  return {
    type: 'density_decline',
    weight: present ? 5 : 0,
    description: 'Session density and work capacity declining',
    present,
  }
}

function detectConsecutiveHardWeeks(): DeloadSignal {
  const recentWorkouts = getWorkoutsLastNDays(21) // 3 weeks
  
  // Count workouts per week
  const now = new Date()
  let week1Count = 0
  let week2Count = 0
  let week3Count = 0
  
  recentWorkouts.forEach(w => {
    const daysDiff = Math.floor((now.getTime() - new Date(w.sessionDate).getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 7) week1Count++
    else if (daysDiff <= 14) week2Count++
    else week3Count++
  })
  
  // Three consecutive high-volume weeks (5+ sessions each)
  const present = week1Count >= 5 && week2Count >= 5 && week3Count >= 5
  
  return {
    type: 'consecutive_hard_weeks',
    weight: present ? 5 : 0,
    description: 'Three or more consecutive high-frequency training weeks',
    present,
  }
}

// =============================================================================
// MAIN ASSESSMENT FUNCTION
// =============================================================================

export function assessDeloadNeed(): DeloadAssessment {
  // Gather all signals
  const signals: DeloadSignal[] = [
    detectPerformanceStall(),
    detectPerformanceRegression(),
    detectSkillHoldDecline(),
    detectHighFatigueFrequency(),
    detectVolumeWithoutProgress(),
    detectDensityDecline(),
    detectConsecutiveHardWeeks(),
  ]
  
  // Calculate total score
  const activeSignals = signals.filter(s => s.present)
  const totalWeight = activeSignals.reduce((sum, s) => sum + s.weight, 0)
  
  // Normalize to 0-100 score
  const maxPossibleWeight = signals.reduce((sum, s) => sum + 10, 0) // Max 10 per signal
  const score = Math.min(100, Math.round((totalWeight / maxPossibleWeight) * 100 * 2)) // Scale up
  
  // Determine status
  let status: DeloadStatus
  let label: string
  let confidence: 'high' | 'medium' | 'low'
  let explanation: string
  let recommendation: string
  let suggestedDuration: string | undefined
  let suggestedApproach: string[] | undefined
  
  if (activeSignals.length === 0 || score < 15) {
    status = 'no_deload_needed'
    label = 'No Deload Needed'
    confidence = activeSignals.length >= 2 ? 'medium' : 'high'
    explanation = 'Training load and recovery indicators are within normal ranges.'
    recommendation = 'Continue with planned training. Monitor performance and fatigue as usual.'
  } else if (score < 30) {
    status = 'watch_recovery'
    label = 'Watch Recovery'
    confidence = 'medium'
    explanation = generateExplanationFromSignals(activeSignals, 'mild')
    recommendation = 'Monitor the next 1-2 sessions closely. Consider lighter accessory work.'
  } else if (score < 55) {
    status = 'lighten_next_session'
    label = 'Lighten Next Session'
    confidence = 'medium'
    explanation = generateExplanationFromSignals(activeSignals, 'moderate')
    recommendation = 'Reduce volume by 30-40% in your next session while maintaining movement patterns.'
    suggestedApproach = [
      'Reduce total sets by 30-40%',
      'Maintain skill work quality over quantity',
      'Skip lowest-priority accessories',
      'Prioritize sleep and nutrition',
    ]
  } else {
    status = 'deload_recommended'
    label = 'Deload Recommended'
    confidence = activeSignals.length >= 3 ? 'high' : 'medium'
    explanation = generateExplanationFromSignals(activeSignals, 'significant')
    recommendation = 'A planned deload week is recommended to restore training capacity.'
    suggestedDuration = '5-7 days'
    suggestedApproach = [
      'Reduce volume by 40-50%',
      'Maintain movement patterns at lower intensity',
      'Focus on technique and quality over output',
      'Emphasize mobility and recovery work',
      'Prioritize sleep (8+ hours)',
    ]
  }
  
  return {
    status,
    label,
    confidence,
    score,
    signals,
    activeSignalCount: activeSignals.length,
    explanation,
    recommendation,
    suggestedDuration,
    suggestedApproach,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function generateExplanationFromSignals(
  activeSignals: DeloadSignal[],
  severity: 'mild' | 'moderate' | 'significant'
): string {
  if (activeSignals.length === 0) {
    return 'All recovery indicators are normal.'
  }
  
  const topSignals = activeSignals
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map(s => s.description.toLowerCase())
  
  const severityText = {
    mild: 'Mild warning signs detected:',
    moderate: 'Multiple fatigue indicators present:',
    significant: 'Significant recovery need indicated:',
  }
  
  return `${severityText[severity]} ${topSignals.join('; ')}.`
}

// =============================================================================
// QUICK DELOAD CHECK
// =============================================================================

export function getQuickDeloadStatus(): {
  needsAttention: boolean
  status: DeloadStatus
  label: string
  shortMessage: string
} {
  const assessment = assessDeloadNeed()
  
  return {
    needsAttention: assessment.status !== 'no_deload_needed',
    status: assessment.status,
    label: assessment.label,
    shortMessage: assessment.status === 'no_deload_needed'
      ? 'Recovery looks good'
      : assessment.status === 'watch_recovery'
        ? 'Monitor fatigue'
        : assessment.status === 'lighten_next_session'
          ? 'Consider lighter session'
          : 'Deload recommended',
  }
}
