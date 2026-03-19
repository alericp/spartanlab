// Progress & Streak Engine
// Tracks training streaks, skill progress, and strength improvements
// Designed to be motivating but not gamified

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getSkillSessions } from './skill-session-service'
import { getStrengthRecords } from './strength-service'

// =============================================================================
// TYPES
// =============================================================================

export interface TrainingStreak {
  currentStreak: number
  bestStreak: number
  lastTrainingDate: string | null
  streakActive: boolean
  hasData: boolean
}

export interface SkillProgressData {
  skillName: string
  displayName: string
  currentLevel: string
  progressPercent: number
  nextMilestone: string
  trend: 'improving' | 'stable' | 'needs_focus'
  lastSessionDate: string | null
  sessionsThisMonth: number
}

export interface StrengthProgressData {
  exerciseName: string
  displayName: string
  previousBest: number
  currentBest: number
  improvement: number
  unit: string
  trend: 'improving' | 'stable' | 'declining'
  lastRecordDate: string | null
}

export interface MilestoneNotification {
  id: string
  type: 'skill' | 'strength' | 'streak'
  title: string
  description: string
  achievedAt: string
  seen: boolean
}

export interface WeeklyProgress {
  completedSessions: number
  targetSessions: number
  progressPercent: number
  daysRemaining: number
  onTrack: boolean
  message: string
}

export interface ProgressOverview {
  streak: TrainingStreak
  weeklyProgress: WeeklyProgress
  skills: SkillProgressData[]
  strength: StrengthProgressData[]
  recentMilestones: MilestoneNotification[]
}

// =============================================================================
// STORAGE
// =============================================================================

const STREAK_STORAGE_KEY = 'spartanlab_training_streak'
const MILESTONES_STORAGE_KEY = 'spartanlab_milestones'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

interface StoredStreakData {
  currentStreak: number
  bestStreak: number
  lastTrainingDate: string | null
  streakDates: string[] // Track unique training dates
}

function getStoredStreakData(): StoredStreakData {
  if (!isBrowser()) {
    return { currentStreak: 0, bestStreak: 0, lastTrainingDate: null, streakDates: [] }
  }
  
  const stored = localStorage.getItem(STREAK_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { currentStreak: 0, bestStreak: 0, lastTrainingDate: null, streakDates: [] }
    }
  }
  return { currentStreak: 0, bestStreak: 0, lastTrainingDate: null, streakDates: [] }
}

function saveStreakData(data: StoredStreakData): void {
  if (!isBrowser()) return
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data))
}

// =============================================================================
// STREAK CALCULATION
// =============================================================================

function getUniqueDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function calculateDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Filter to only trusted workouts - excludes demo/seed/untrusted data
function getTrustedWorkouts() {
  return getWorkoutLogs().filter(log => {
    // Reject demo workouts
    if (log.sourceRoute === 'demo' || (log as any).isDemo === true) return false
    // Only include explicitly trusted logs or logs without the flag (legacy data)
    return log.trusted !== false
  })
}

/**
* Calculate training streak from workout logs
* A streak continues if you train on consecutive days
*/
export function calculateTrainingStreak(): TrainingStreak {
  const logs = getTrustedWorkouts()
  const storedData = getStoredStreakData()
  
  if (logs.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: storedData.bestStreak,
      lastTrainingDate: null,
      streakActive: false,
      hasData: false,
    }
  }
  
  // Get unique training dates sorted descending
  const uniqueDates = [...new Set(
    logs.map(log => getUniqueDateString(new Date(log.sessionDate)))
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  const today = getUniqueDateString(new Date())
  const yesterday = getUniqueDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))
  
  // Check if streak is still active (trained today or yesterday)
  const mostRecentDate = uniqueDates[0]
  const streakActive = mostRecentDate === today || mostRecentDate === yesterday
  
  // Calculate current streak
  let currentStreak = 0
  if (streakActive) {
    let checkDate = mostRecentDate
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === checkDate) {
        currentStreak++
        // Move to previous day
        const prevDay = new Date(new Date(checkDate).getTime() - 24 * 60 * 60 * 1000)
        checkDate = getUniqueDateString(prevDay)
      } else {
        break
      }
    }
  }
  
  // Update best streak if current is higher
  const bestStreak = Math.max(currentStreak, storedData.bestStreak)
  
  // Save updated data
  saveStreakData({
    currentStreak,
    bestStreak,
    lastTrainingDate: mostRecentDate,
    streakDates: uniqueDates.slice(0, 30), // Keep last 30 dates
  })
  
  return {
    currentStreak,
    bestStreak,
    lastTrainingDate: mostRecentDate,
    streakActive,
    hasData: true,
  }
}

// =============================================================================
// WEEKLY PROGRESS
// =============================================================================

/**
 * Calculate weekly training progress based on workout logs and target
 */
export function calculateWeeklyProgress(): WeeklyProgress {
  const logs = getWorkoutLogs()
  
  // Get target from athlete profile or default to 4
  let targetSessions = 4
  if (typeof window !== 'undefined') {
    const profileStr = localStorage.getItem('athlete_profile')
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr)
        const weeklyDays = profile.weeklyTrainingDays || profile.trainingDaysPerWeek
        if (weeklyDays === '2') targetSessions = 2
        else if (weeklyDays === '3') targetSessions = 3
        else if (weeklyDays === '4') targetSessions = 4
        else if (weeklyDays === '5_plus' || weeklyDays === '5' || weeklyDays === '6') targetSessions = 5
      } catch {
        // Use default
      }
    }
  }
  
  // Get start of current week (Monday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  
  // Count unique training days this week
  const weekDates = new Set<string>()
  logs.forEach(log => {
    const logDate = new Date(log.sessionDate)
    if (logDate >= monday && logDate <= today) {
      weekDates.add(logDate.toISOString().split('T')[0])
    }
  })
  
  const completedSessions = weekDates.size
  const progressPercent = Math.min(Math.round((completedSessions / targetSessions) * 100), 100)
  
  // Calculate days remaining in week
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const daysRemaining = Math.max(0, Math.ceil((sunday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Determine if on track
  const sessionsNeeded = targetSessions - completedSessions
  const onTrack = sessionsNeeded <= daysRemaining
  
  // Generate encouraging message
  let message = ''
  if (completedSessions >= targetSessions) {
    message = "Week complete. Great consistency!"
  } else if (completedSessions === 0) {
    message = "Start your week strong."
  } else if (onTrack) {
    const remaining = targetSessions - completedSessions
    message = `${remaining} more ${remaining === 1 ? 'session' : 'sessions'} to complete your week.`
  } else {
    message = "You can still make progress this week."
  }
  
  return {
    completedSessions,
    targetSessions,
    progressPercent,
    daysRemaining,
    onTrack,
    message,
  }
}

// =============================================================================
// SKILL PROGRESS
// =============================================================================

const SKILL_DEFINITIONS = {
  front_lever: {
    displayName: 'Front Lever',
    levels: [
      { name: 'Tuck', percent: 0 },
      { name: 'Advanced Tuck', percent: 25 },
      { name: 'Straddle', percent: 60 },
      { name: 'Half Lay', percent: 80 },
      { name: 'Full', percent: 100 },
    ],
  },
  planche: {
    displayName: 'Planche',
    levels: [
      { name: 'Lean', percent: 0 },
      { name: 'Tuck', percent: 20 },
      { name: 'Advanced Tuck', percent: 40 },
      { name: 'Straddle', percent: 70 },
      { name: 'Full', percent: 100 },
    ],
  },
  muscle_up: {
    displayName: 'Muscle-Up',
    levels: [
      { name: 'Pull-Up Foundation', percent: 0 },
      { name: 'High Pull-Up', percent: 25 },
      { name: 'Transition Practice', percent: 50 },
      { name: 'Kipping Muscle-Up', percent: 75 },
      { name: 'Strict Muscle-Up', percent: 100 },
    ],
  },
  handstand_pushup: {
    displayName: 'HSPU',
    levels: [
      { name: 'Pike Push-Up', percent: 0 },
      { name: 'Wall HSPU', percent: 30 },
      { name: 'Deficit Wall HSPU', percent: 60 },
      { name: 'Freestanding HSPU', percent: 100 },
    ],
  },
}

type SkillKey = keyof typeof SKILL_DEFINITIONS

export function calculateSkillProgress(): SkillProgressData[] {
  const sessions = getSkillSessions()
  const results: SkillProgressData[] = []
  
  // Group sessions by skill
  const sessionsBySkill = new Map<string, typeof sessions>()
  sessions.forEach(session => {
    const existing = sessionsBySkill.get(session.skillName) || []
    existing.push(session)
    sessionsBySkill.set(session.skillName, existing)
  })
  
  // Calculate progress for each defined skill
  for (const [skillKey, definition] of Object.entries(SKILL_DEFINITIONS)) {
    const skillSessions = sessionsBySkill.get(skillKey) || []
    
    // Get current level (highest achieved)
    let currentLevelIndex = 0
    let maxHoldTime = 0
    
    skillSessions.forEach(session => {
      if (session.level > currentLevelIndex) {
        currentLevelIndex = session.level
      }
      session.sets.forEach(set => {
        if (set.holdSeconds > maxHoldTime) {
          maxHoldTime = set.holdSeconds
        }
      })
    })
    
    const currentLevel = definition.levels[Math.min(currentLevelIndex, definition.levels.length - 1)]
    const nextLevelIndex = Math.min(currentLevelIndex + 1, definition.levels.length - 1)
    const nextLevel = definition.levels[nextLevelIndex]
    
    // Calculate progress percentage
    let progressPercent = currentLevel.percent
    if (currentLevelIndex < definition.levels.length - 1) {
      // Add partial progress based on hold time (5s base, 15s for next level)
      const holdProgress = Math.min(maxHoldTime / 15, 1)
      const levelRange = nextLevel.percent - currentLevel.percent
      progressPercent += holdProgress * levelRange * 0.5 // 50% weight to hold time
    }
    
    // Determine trend
    const recentSessions = skillSessions.filter(s => {
      const sessionDate = new Date(s.sessionDate)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return sessionDate >= thirtyDaysAgo
    })
    
    let trend: 'improving' | 'stable' | 'needs_focus' = 'stable'
    if (recentSessions.length >= 4) {
      trend = 'improving'
    } else if (recentSessions.length === 0 && skillSessions.length > 0) {
      trend = 'needs_focus'
    }
    
    const sortedSessions = [...skillSessions].sort(
      (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    )
    
    results.push({
      skillName: skillKey,
      displayName: definition.displayName,
      currentLevel: currentLevel.name,
      progressPercent: Math.round(progressPercent),
      nextMilestone: currentLevelIndex < definition.levels.length - 1 ? nextLevel.name : 'Mastered',
      trend,
      lastSessionDate: sortedSessions[0]?.sessionDate || null,
      sessionsThisMonth: recentSessions.length,
    })
  }
  
  return results
}

// =============================================================================
// STRENGTH PROGRESS
// =============================================================================

const STRENGTH_EXERCISES = [
  { key: 'weighted_pullup', displayName: 'Weighted Pull-Up', unit: 'lb' },
  { key: 'weighted_dip', displayName: 'Weighted Dip', unit: 'lb' },
  { key: 'front_lever_row', displayName: 'Front Lever Row', unit: 'reps' },
]

export function calculateStrengthProgress(): StrengthProgressData[] {
  const records = getStrengthRecords()
  const results: StrengthProgressData[] = []
  
  for (const exercise of STRENGTH_EXERCISES) {
    const exerciseRecords = records.filter(r => 
      r.exerciseType.toLowerCase().replace(/\s+/g, '_') === exercise.key ||
      r.exerciseType.toLowerCase().includes(exercise.key.replace(/_/g, ' '))
    )
    
    if (exerciseRecords.length === 0) {
      results.push({
        exerciseName: exercise.key,
        displayName: exercise.displayName,
        previousBest: 0,
        currentBest: 0,
        improvement: 0,
        unit: exercise.unit,
        trend: 'stable',
        lastRecordDate: null,
      })
      continue
    }
    
    // Sort by date
    const sorted = [...exerciseRecords].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )
    
    const currentBest = sorted[0]?.addedWeight || sorted[0]?.reps || 0
    const previousRecords = sorted.slice(1)
    const previousBest = previousRecords.length > 0 
      ? Math.max(...previousRecords.map(r => r.addedWeight || r.reps || 0))
      : currentBest
    
    const improvement = currentBest - previousBest
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (improvement > 0) trend = 'improving'
    else if (improvement < 0) trend = 'declining'
    
    results.push({
      exerciseName: exercise.key,
      displayName: exercise.displayName,
      previousBest,
      currentBest,
      improvement,
      unit: exercise.unit,
      trend,
      lastRecordDate: sorted[0]?.recordedAt || null,
    })
  }
  
  return results
}

// =============================================================================
// MILESTONES
// =============================================================================

export function getMilestones(): MilestoneNotification[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(MILESTONES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function addMilestone(milestone: Omit<MilestoneNotification, 'id' | 'achievedAt' | 'seen'>): void {
  if (!isBrowser()) return
  
  const milestones = getMilestones()
  const newMilestone: MilestoneNotification = {
    ...milestone,
    id: `milestone-${Date.now()}`,
    achievedAt: new Date().toISOString(),
    seen: false,
  }
  
  milestones.unshift(newMilestone)
  localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(milestones.slice(0, 20)))
}

export function markMilestoneSeen(id: string): void {
  if (!isBrowser()) return
  
  const milestones = getMilestones()
  const updated = milestones.map(m => 
    m.id === id ? { ...m, seen: true } : m
  )
  localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(updated))
}

export function getUnseenMilestones(): MilestoneNotification[] {
  return getMilestones().filter(m => !m.seen)
}

// =============================================================================
// COMBINED OVERVIEW
// =============================================================================

export function getProgressOverview(): ProgressOverview {
  return {
    streak: calculateTrainingStreak(),
    weeklyProgress: calculateWeeklyProgress(),
    skills: calculateSkillProgress(),
    strength: calculateStrengthProgress(),
    recentMilestones: getMilestones().slice(0, 5),
  }
}

// =============================================================================
// HELPERS
// =============================================================================

export function getStreakColor(streak: number): string {
  if (streak >= 14) return '#22C55E' // Green - very strong
  if (streak >= 7) return '#C1121F' // Red - strong
  if (streak >= 3) return '#4F6D8A' // Blue-gray - developing
  return '#6B7280' // Gray - starting
}

export function getProgressColor(percent: number): string {
  if (percent >= 80) return '#22C55E'
  if (percent >= 50) return '#C1121F'
  if (percent >= 25) return '#4F6D8A'
  return '#6B7280'
}

export function getTrendColor(trend: 'improving' | 'stable' | 'declining' | 'needs_focus'): string {
  switch (trend) {
    case 'improving': return '#22C55E'
    case 'stable': return '#4F6D8A'
    case 'declining': return '#EF4444'
    case 'needs_focus': return '#F59E0B'
    default: return '#6B7280'
  }
}
