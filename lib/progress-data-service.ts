// Progress Data Service
// Generates time-series data for progress visualization charts

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getStrengthRecords, type StrengthRecord, type ExerciseType } from './strength-service'
import { getSkillSessions, type SkillSession } from './skill-session-service'
import { calculateSpartanScore } from './strength-score-engine'

// =============================================================================
// TYPES
// =============================================================================

export interface TimeSeriesDataPoint {
  date: string
  value: number
  label?: string
}

export interface StrengthProgressData {
  exercise: ExerciseType
  exerciseLabel: string
  dataPoints: TimeSeriesDataPoint[]
  currentValue: number
  startValue: number
  change: number
  changePercent: number
  hasData: boolean
}

export interface SkillProgressData {
  skillName: string
  skillLabel: string
  dataPoints: TimeSeriesDataPoint[]
  currentLevel: number
  currentLevelName: string
  hasData: boolean
}

export interface ConsistencyProgressData {
  weeklyData: { week: string; workouts: number; targetMet: boolean }[]
  monthlyData: { month: string; workouts: number }[]
  totalWorkouts: number
  averagePerWeek: number
  hasData: boolean
}

export interface SpartanScoreProgressData {
  dataPoints: TimeSeriesDataPoint[]
  currentScore: number
  peakScore: number
  trend: 'improving' | 'stable' | 'declining'
  hasData: boolean
}

export interface ProgressDashboardData {
  strength: StrengthProgressData[]
  skills: SkillProgressData[]
  consistency: ConsistencyProgressData
  spartanScore: SpartanScoreProgressData
  lastUpdated: string
}

// =============================================================================
// STRENGTH PROGRESS
// =============================================================================

const STRENGTH_LABELS: Record<ExerciseType, string> = {
  weighted_pull_up: 'Weighted Pull-Up',
  weighted_dip: 'Weighted Dip',
  weighted_muscle_up: 'Weighted Muscle-Up',
}

export function getStrengthProgressData(): StrengthProgressData[] {
  const records = getStrengthRecords()
  const exercises: ExerciseType[] = ['weighted_pull_up', 'weighted_dip', 'weighted_muscle_up']
  
  return exercises.map(exercise => {
    const exerciseRecords = records
      .filter(r => r.exercise === exercise)
      .sort((a, b) => new Date(a.dateLogged).getTime() - new Date(b.dateLogged).getTime())
    
    if (exerciseRecords.length === 0) {
      return {
        exercise,
        exerciseLabel: STRENGTH_LABELS[exercise],
        dataPoints: [],
        currentValue: 0,
        startValue: 0,
        change: 0,
        changePercent: 0,
        hasData: false,
      }
    }
    
    // Group by date and take best 1RM per day
    const byDate = new Map<string, number>()
    exerciseRecords.forEach(r => {
      const dateKey = r.dateLogged.split('T')[0]
      const existing = byDate.get(dateKey) || 0
      if (r.estimatedOneRM > existing) {
        byDate.set(dateKey, r.estimatedOneRM)
      }
    })
    
    const dataPoints: TimeSeriesDataPoint[] = Array.from(byDate.entries())
      .map(([date, value]) => ({
        date,
        value: Math.round(value),
        label: `+${Math.round(value)} lbs`,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const currentValue = dataPoints[dataPoints.length - 1]?.value || 0
    const startValue = dataPoints[0]?.value || 0
    const change = currentValue - startValue
    const changePercent = startValue > 0 ? Math.round((change / startValue) * 100) : 0
    
    return {
      exercise,
      exerciseLabel: STRENGTH_LABELS[exercise],
      dataPoints,
      currentValue,
      startValue,
      change,
      changePercent,
      hasData: dataPoints.length >= 1,
    }
  })
}

// =============================================================================
// SKILL PROGRESS
// =============================================================================

const SKILL_LABELS: Record<string, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'HSPU',
}

const SKILL_LEVEL_NAMES: Record<string, string[]> = {
  planche: ['Tuck', 'Advanced Tuck', 'Straddle', 'Half Lay', 'Full'],
  front_lever: ['Tuck', 'Advanced Tuck', 'Straddle', 'Half Lay', 'Full'],
  muscle_up: ['Kipping', 'Strict', 'Weighted', 'Slow', 'One Arm'],
  handstand_pushup: ['Pike', 'Wall', 'Freestanding', 'Deficit', '90deg'],
}

export function getSkillProgressData(): SkillProgressData[] {
  const sessions = getSkillSessions()
  const skillNames = ['planche', 'front_lever', 'muscle_up', 'handstand_pushup']
  
  return skillNames.map(skillName => {
    const skillSessions = sessions
      .filter(s => s.skillName === skillName)
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    
    if (skillSessions.length === 0) {
      return {
        skillName,
        skillLabel: SKILL_LABELS[skillName] || skillName,
        dataPoints: [],
        currentLevel: 0,
        currentLevelName: SKILL_LEVEL_NAMES[skillName]?.[0] || 'Beginner',
        hasData: false,
      }
    }
    
    // Track level changes over time
    const levelByDate = new Map<string, number>()
    skillSessions.forEach(s => {
      const dateKey = s.sessionDate.split('T')[0]
      const existing = levelByDate.get(dateKey) || 0
      if (s.level > existing) {
        levelByDate.set(dateKey, s.level)
      }
    })
    
    // Create cumulative level progression
    let maxLevel = 0
    const dataPoints: TimeSeriesDataPoint[] = Array.from(levelByDate.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, level]) => {
        if (level > maxLevel) maxLevel = level
        const levelName = SKILL_LEVEL_NAMES[skillName]?.[maxLevel] || `Level ${maxLevel}`
        return {
          date,
          value: maxLevel,
          label: levelName,
        }
      })
    
    const currentLevel = maxLevel
    const currentLevelName = SKILL_LEVEL_NAMES[skillName]?.[currentLevel] || `Level ${currentLevel}`
    
    return {
      skillName,
      skillLabel: SKILL_LABELS[skillName] || skillName,
      dataPoints,
      currentLevel,
      currentLevelName,
      hasData: dataPoints.length >= 1,
    }
  })
}

// =============================================================================
// CONSISTENCY PROGRESS
// =============================================================================

export function getConsistencyProgressData(): ConsistencyProgressData {
  const logs = getWorkoutLogs()
  
  if (logs.length === 0) {
    return {
      weeklyData: [],
      monthlyData: [],
      totalWorkouts: 0,
      averagePerWeek: 0,
      hasData: false,
    }
  }
  
  // Get last 12 weeks of data
  const now = new Date()
  const weeklyData: { week: string; workouts: number; targetMet: boolean }[] = []
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.sessionDate)
      return logDate >= weekStart && logDate < weekEnd
    })
    
    const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeklyData.push({
      week: weekLabel,
      workouts: weekLogs.length,
      targetMet: weekLogs.length >= 3, // Target: 3+ workouts per week
    })
  }
  
  // Get last 6 months of data
  const monthlyData: { month: string; workouts: number }[] = []
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.sessionDate)
      return logDate >= monthStart && logDate <= monthEnd
    })
    
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short' })
    monthlyData.push({
      month: monthLabel,
      workouts: monthLogs.length,
    })
  }
  
  const totalWorkouts = logs.length
  const weeksWithData = weeklyData.filter(w => w.workouts > 0).length
  const averagePerWeek = weeksWithData > 0 
    ? Math.round((weeklyData.reduce((sum, w) => sum + w.workouts, 0) / Math.max(weeksWithData, 1)) * 10) / 10
    : 0
  
  return {
    weeklyData,
    monthlyData,
    totalWorkouts,
    averagePerWeek,
    hasData: totalWorkouts > 0,
  }
}

// =============================================================================
// SPARTAN SCORE PROGRESS
// =============================================================================

const SCORE_HISTORY_KEY = 'spartanlab-score-history'

interface StoredScoreEntry {
  date: string
  score: number
}

function getStoredScoreHistory(): StoredScoreEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(SCORE_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveScoreToHistory(score: number): void {
  if (typeof window === 'undefined') return
  
  const today = new Date().toISOString().split('T')[0]
  const history = getStoredScoreHistory()
  
  // Update or add today's score
  const todayIndex = history.findIndex(e => e.date === today)
  if (todayIndex >= 0) {
    history[todayIndex].score = score
  } else {
    history.push({ date: today, score })
  }
  
  // Keep last 90 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const filtered = history.filter(e => new Date(e.date) >= cutoff)
  
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(filtered))
}

export function getSpartanScoreProgressData(): SpartanScoreProgressData {
  // Calculate current score
  let currentScore = 0
  try {
    const scoreData = calculateSpartanScore()
    currentScore = scoreData.totalScore
    // Save current score to history
    saveScoreToHistory(currentScore)
  } catch {
    currentScore = 0
  }
  
  const history = getStoredScoreHistory()
  
  if (history.length === 0) {
    return {
      dataPoints: currentScore > 0 ? [{
        date: new Date().toISOString().split('T')[0],
        value: currentScore,
        label: `${currentScore}`,
      }] : [],
      currentScore,
      peakScore: currentScore,
      trend: 'stable',
      hasData: currentScore > 0,
    }
  }
  
  const dataPoints: TimeSeriesDataPoint[] = history
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      date: entry.date,
      value: entry.score,
      label: `${entry.score}`,
    }))
  
  const peakScore = Math.max(...history.map(e => e.score), currentScore)
  
  // Determine trend from last 7 entries
  const recent = history.slice(-7)
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  
  if (recent.length >= 3) {
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
    const secondHalf = recent.slice(Math.floor(recent.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.score, 0) / secondHalf.length
    
    if (secondAvg > firstAvg + 10) trend = 'improving'
    else if (secondAvg < firstAvg - 10) trend = 'declining'
  }
  
  return {
    dataPoints,
    currentScore,
    peakScore,
    trend,
    hasData: true,
  }
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function getProgressDashboardData(): ProgressDashboardData {
  return {
    strength: getStrengthProgressData(),
    skills: getSkillProgressData(),
    consistency: getConsistencyProgressData(),
    spartanScore: getSpartanScoreProgressData(),
    lastUpdated: new Date().toISOString(),
  }
}
