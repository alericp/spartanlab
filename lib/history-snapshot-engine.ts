// History Snapshot Engine
// Provides concise historical summaries for skills, strength, and training

import { getSkillSessions, getSkillSessionStats, getRecentSessions } from './skill-session-service'
import { getStrengthRecords, getRecordsByExercise, type ExerciseType } from './strength-service'
import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getSkillProgressions, getAthleteProfile } from './data-service'
import { SKILL_DEFINITIONS } from './skills'
import { getStrengthRecords as getAllStrengthRecords } from './strength-service'
import { calculateStrengthTrend, type TrendDirection } from './strength-trend-engine'

// =============================================================================
// TYPES
// =============================================================================

export interface SkillHistorySnapshot {
  skillName: string
  skillLabel: string
  currentLevel: number
  currentLevelName: string
  bestHoldSeconds: number
  previousBestHold: number
  holdTrend: TrendDirection
  totalSessions: number
  lastSessionDate: string | null
  hasData: boolean
}

export interface StrengthHistorySnapshot {
  exercise: ExerciseType
  exerciseLabel: string
  bestRecentSet: { weight: number; reps: number } | null
  allTimeBestSet: { weight: number; reps: number } | null
  estimatedOneRM: number
  previousOneRM: number
  relativeStrength: number | null
  trend: TrendDirection
  totalRecords: number
  hasData: boolean
}

export interface TrainingHistorySnapshot {
  recentWeeklyWorkouts: number
  averageSessionDuration: number
  totalWorkouts: number
  frequencyTrend: TrendDirection
  pullVolumeWeekly: number
  pushVolumeWeekly: number
  coreVolumeWeekly: number
  consistencyScore: number // 0-100
  hasData: boolean
}

export interface HistoryOverview {
  skillSnapshots: SkillHistorySnapshot[]
  strengthSnapshots: StrengthHistorySnapshot[]
  trainingSnapshot: TrainingHistorySnapshot
  lastUpdated: string
}

// =============================================================================
// SKILL HISTORY
// =============================================================================

export function getSkillHistorySnapshots(): SkillHistorySnapshot[] {
  const sessions = getSkillSessions()
  const progressions = getSkillProgressions()
  const skillKeys = ['planche', 'front_lever', 'muscle_up', 'handstand_pushup'] as const
  
  return skillKeys.map(skillKey => {
    const skillSessions = sessions.filter(s => s.skillName === skillKey)
    const skillDef = SKILL_DEFINITIONS[skillKey]
    const progression = progressions.find(p => p.skillName === skillKey)
    
    if (skillSessions.length === 0 && !progression) {
      return {
        skillName: skillKey,
        skillLabel: skillDef?.name || skillKey,
        currentLevel: 0,
        currentLevelName: skillDef?.levels[0] || 'Tuck',
        bestHoldSeconds: 0,
        previousBestHold: 0,
        holdTrend: 'stable' as TrendDirection,
        totalSessions: 0,
        lastSessionDate: null,
        hasData: false,
      }
    }
    
    const currentLevel = progression?.currentLevel ?? 0
    const currentLevelName = skillDef?.levels[currentLevel] || 'Tuck'
    
    // Calculate hold trends
    const recentSessions = skillSessions.slice(0, 5)
    const olderSessions = skillSessions.slice(5, 10)
    
    let bestHold = 0
    let previousBestHold = 0
    
    recentSessions.forEach(session => {
      session.sets.forEach(set => {
        if (set.holdSeconds > bestHold) bestHold = set.holdSeconds
      })
    })
    
    olderSessions.forEach(session => {
      session.sets.forEach(set => {
        if (set.holdSeconds > previousBestHold) previousBestHold = set.holdSeconds
      })
    })
    
    // Determine trend (using 'regressing' to match TrendDirection type)
    let holdTrend: TrendDirection = 'stable'
    if (bestHold > previousBestHold + 1) holdTrend = 'improving'
    else if (bestHold < previousBestHold - 1) holdTrend = 'regressing'
    
    const sorted = skillSessions.sort(
      (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    )
    
    return {
      skillName: skillKey,
      skillLabel: skillDef?.name || skillKey,
      currentLevel,
      currentLevelName,
      bestHoldSeconds: bestHold || previousBestHold,
      previousBestHold,
      holdTrend,
      totalSessions: skillSessions.length,
      lastSessionDate: sorted[0]?.sessionDate || null,
      hasData: true,
    }
  })
}

// =============================================================================
// STRENGTH HISTORY
// =============================================================================

export function getStrengthHistorySnapshots(): StrengthHistorySnapshot[] {
  const profile = getAthleteProfile()
  // [PHASE 16L] FIX: Handle null profile in server context
  const bodyweight = profile?.bodyweight ?? null
  
  const exercises: { id: ExerciseType; label: string }[] = [
    { id: 'weighted_pull_up', label: 'Weighted Pull-Up' },
    { id: 'weighted_dip', label: 'Weighted Dip' },
    { id: 'weighted_muscle_up', label: 'Weighted Muscle-Up' },
  ]
  
  return exercises.map(exercise => {
    const records = getRecordsByExercise(exercise.id)
    
    if (records.length === 0) {
      return {
        exercise: exercise.id,
        exerciseLabel: exercise.label,
        bestRecentSet: null,
        allTimeBestSet: null,
        estimatedOneRM: 0,
        previousOneRM: 0,
        relativeStrength: null,
        trend: 'stable' as TrendDirection,
        totalRecords: 0,
        hasData: false,
      }
    }
    
    // Best recent set (from last 14 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    
    const recentRecords = records.filter(
      r => new Date(r.dateLogged) >= fourteenDaysAgo
    )
    
    const bestRecent = recentRecords.length > 0
      ? recentRecords.reduce((best, r) => 
          r.estimatedOneRM > best.estimatedOneRM ? r : best
        )
      : null
    
    // All-time best
    const allTimeBest = records.reduce((best, r) => 
      r.estimatedOneRM > best.estimatedOneRM ? r : best
    )
    
    // Previous 1RM (from older records)
    const olderRecords = records.filter(
      r => new Date(r.dateLogged) < fourteenDaysAgo
    )
    const previousBest = olderRecords.length > 0
      ? olderRecords.reduce((best, r) => 
          r.estimatedOneRM > best.estimatedOneRM ? r : best
        )
      : null
    
    // Calculate trend
    const allRecords = getAllStrengthRecords()
    const trendResult = calculateStrengthTrend(allRecords, exercise.id)
    
    const relativeStrength = bodyweight 
      ? Math.round((allTimeBest.estimatedOneRM / bodyweight) * 100) / 100
      : null
    
    return {
      exercise: exercise.id,
      exerciseLabel: exercise.label,
      bestRecentSet: bestRecent 
        ? { weight: bestRecent.weightAdded, reps: bestRecent.reps }
        : null,
      allTimeBestSet: { weight: allTimeBest.weightAdded, reps: allTimeBest.reps },
      estimatedOneRM: allTimeBest.estimatedOneRM,
      previousOneRM: previousBest?.estimatedOneRM || 0,
      relativeStrength,
      trend: trendResult.direction,
      totalRecords: records.length,
      hasData: true,
    }
  })
}

// =============================================================================
// TRAINING HISTORY
// =============================================================================

export function getTrainingHistorySnapshot(): TrainingHistorySnapshot {
  const logs = getWorkoutLogs()
  
  if (logs.length === 0) {
    return {
      recentWeeklyWorkouts: 0,
      averageSessionDuration: 0,
      totalWorkouts: 0,
      frequencyTrend: 'stable',
      pullVolumeWeekly: 0,
      pushVolumeWeekly: 0,
      coreVolumeWeekly: 0,
      consistencyScore: 0,
      hasData: false,
    }
  }
  
  // Recent weekly workouts (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentLogs = logs.filter(l => new Date(l.sessionDate) >= sevenDaysAgo)
  
  // Previous week
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  
  const previousWeekLogs = logs.filter(l => {
    const date = new Date(l.sessionDate)
    return date >= fourteenDaysAgo && date < sevenDaysAgo
  })
  
  // Calculate frequency trend
  let frequencyTrend: TrendDirection = 'stable'
  if (recentLogs.length > previousWeekLogs.length + 1) frequencyTrend = 'improving'
  else if (recentLogs.length < previousWeekLogs.length - 1) frequencyTrend = 'declining'
  
  // Average session duration
  const avgDuration = logs.reduce((sum, l) => sum + l.durationMinutes, 0) / logs.length
  
  // Weekly volume by category
  const pullVolume = recentLogs.reduce((sum, log) => {
    return sum + log.exercises
      .filter(e => e.category === 'pull')
      .reduce((s, e) => s + e.sets, 0)
  }, 0)
  
  const pushVolume = recentLogs.reduce((sum, log) => {
    return sum + log.exercises
      .filter(e => e.category === 'push')
      .reduce((s, e) => s + e.sets, 0)
  }, 0)
  
  const coreVolume = recentLogs.reduce((sum, log) => {
    return sum + log.exercises
      .filter(e => e.category === 'core')
      .reduce((s, e) => s + e.sets, 0)
  }, 0)
  
  // Consistency score
  const consistencyScore = calculateConsistencyScore(logs)
  
  return {
    recentWeeklyWorkouts: recentLogs.length,
    averageSessionDuration: Math.round(avgDuration),
    totalWorkouts: logs.length,
    frequencyTrend,
    pullVolumeWeekly: pullVolume,
    pushVolumeWeekly: pushVolume,
    coreVolumeWeekly: coreVolume,
    consistencyScore,
    hasData: true,
  }
}

function calculateConsistencyScore(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0
  
  // Count weeks with at least one workout in the last 8 weeks
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
  
  const recentLogs = logs.filter(l => new Date(l.sessionDate) >= eightWeeksAgo)
  
  const weeksWithWorkouts = new Set<string>()
  recentLogs.forEach(log => {
    const weekStart = getWeekStart(new Date(log.sessionDate))
    weeksWithWorkouts.add(weekStart.toISOString().split('T')[0])
  })
  
  // Score based on how many of the last 8 weeks had workouts
  return Math.round((weeksWithWorkouts.size / 8) * 100)
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function getHistoryOverview(): HistoryOverview {
  return {
    skillSnapshots: getSkillHistorySnapshots(),
    strengthSnapshots: getStrengthHistorySnapshots(),
    trainingSnapshot: getTrainingHistorySnapshot(),
    lastUpdated: new Date().toISOString(),
  }
}
