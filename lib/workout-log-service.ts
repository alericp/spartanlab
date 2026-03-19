// Workout Log service layer for preview mode
// Uses localStorage for persistence, easy to swap to Prisma later

/**
 * Workout Log Service
 * 
 * DO NOT DRIFT: This is the CANONICAL WORKOUT LOGGING entrypoint.
 * All session completion MUST call saveWorkoutLog() with trusted=true ONLY for real user completions.
 * The trusted flag determines whether data feeds back into next generation.
 * Demo workouts (isDemo=true) are NEVER trusted and never affect adaptive logic.
 */

import { saveSessionFeedback } from './session-feedback'

export type SessionType = 'skill' | 'strength' | 'mixed' | 'recovery'
export type FocusArea = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup' | 'weighted_strength' | 'general'
export type ExerciseCategory = 'skill' | 'push' | 'pull' | 'core' | 'legs' | 'mobility'
export type PerceivedDifficulty = 'easy' | 'normal' | 'hard'

export type ResistanceBandColor = 'yellow' | 'red' | 'black' | 'purple' | 'green' | 'blue'

export interface BandUsage {
  bandColor?: ResistanceBandColor
  assisted: boolean
}

export interface WorkoutExercise {
  id: string
  name: string
  category: ExerciseCategory
  sets: number
  reps?: number
  load?: number
  holdSeconds?: number
  completed: boolean
  band?: BandUsage // Optional band assistance tracking
  supportsBandAssistance?: boolean // Whether this exercise can use bands
}

export interface WorkoutLog {
  id: string
  createdAt: string
  sessionName: string
  sessionType: SessionType
  sessionDate: string
  durationMinutes: number
  focusArea: FocusArea
  notes?: string
  exercises: WorkoutExercise[]
  // Perceived difficulty for adaptive progression
  perceivedDifficulty?: PerceivedDifficulty
  // Quick log metadata
  isQuickLog?: boolean
  generatedWorkoutId?: string
  // Key performance metrics (best reps in session)
  keyPerformance?: {
    pullUps?: number
    dips?: number
    pushUps?: number
    skillHoldSeconds?: number
    skillName?: string
  }
  // Time optimization tracking
  timeOptimization?: {
    wasOptimized: boolean
    originalMinutes: number
    targetMinutes: number
    actualMinutes: number
    removedExerciseCount: number
    reducedExerciseCount: number
  }
  // FEEDBACK LOOP: Completion status for adaptive engine
  completionStatus?: 'completed' | 'partial' | 'skipped'
  // FEEDBACK LOOP: Whether this log is trusted for adaptive decisions
  // Only true for real user-completed workouts, not demo/debug
  trusted?: boolean
  // FEEDBACK LOOP: Source route for tracking
  sourceRoute?: 'workout_session' | 'first_session' | 'quick_log' | 'demo'
}

const STORAGE_KEY = 'spartanlab_workout_logs'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Get all workout logs
export function getWorkoutLogs(): WorkoutLog[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// Save a workout log
export function saveWorkoutLog(log: Omit<WorkoutLog, 'id' | 'createdAt'>): WorkoutLog {
  if (!isBrowser()) {
    return {
      ...log,
      id: `workout-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
  }
  
  const logs = getWorkoutLogs()
  
  const newLog: WorkoutLog = {
    ...log,
    id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  
  logs.push(newLog)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  
  // Auto-save session feedback for fatigue tracking
  // Uses perceived difficulty from the workout log
  // FEEDBACK LOOP: Pass trusted flag so only real workouts affect adaptation
  try {
    saveSessionFeedback(newLog.id, {
      difficulty: newLog.perceivedDifficulty || 'normal',
      completed: newLog.exercises.every(e => e.completed),
      trusted: newLog.trusted !== false && newLog.sourceRoute !== 'demo',
      // Regional soreness can be added via separate UI - default to undefined
    })
    console.log('[fatigue-loop] Session feedback saved:', {
      sessionId: newLog.id,
      difficulty: newLog.perceivedDifficulty || 'normal',
      trusted: newLog.trusted !== false && newLog.sourceRoute !== 'demo',
    })
  } catch {
    // Non-blocking - don't fail the save if feedback capture fails
  }
  
  return newLog
}

// Delete a workout log
export function deleteWorkoutLog(id: string): boolean {
  if (!isBrowser()) return false
  
  const logs = getWorkoutLogs()
  const filtered = logs.filter(l => l.id !== id)
  
  if (filtered.length === logs.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Get recent workout logs (sorted by date descending)
export function getRecentWorkoutLogs(limit: number = 10): WorkoutLog[] {
  const logs = getWorkoutLogs()
  return logs
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, limit)
}

// Get latest workout
export function getLatestWorkout(): WorkoutLog | null {
  const logs = getRecentWorkoutLogs(1)
  return logs[0] || null
}

// Session type labels
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  skill: 'Skill',
  strength: 'Strength',
  mixed: 'Mixed',
  recovery: 'Recovery',
}

// Focus area labels
export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  muscle_up: 'Muscle Up',
  handstand_pushup: 'Handstand Pushup',
  weighted_strength: 'Weighted Strength',
  general: 'General',
}

// Exercise category labels
export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  skill: 'Skill',
  push: 'Push',
  pull: 'Pull',
  core: 'Core',
  legs: 'Legs',
  mobility: 'Mobility',
}

// =============================================================================
// QUICK WORKOUT LOGGING
// =============================================================================

interface QuickLogInput {
  sessionName: string
  sessionType: SessionType
  focusArea: FocusArea
  durationMinutes: number
  perceivedDifficulty: PerceivedDifficulty
  generatedWorkoutId?: string
  keyPerformance?: WorkoutLog['keyPerformance']
  notes?: string
  // FEEDBACK LOOP: Exercise-level outcomes for progression engine
  exercises?: WorkoutExercise[]
  // FEEDBACK LOOP: Mark as demo/debug to exclude from adaptive logic
  isDemo?: boolean
  // FEEDBACK LOOP: Completion quality
  completionStatus?: 'completed' | 'partial' | 'skipped'
  sourceRoute?: 'workout_session' | 'first_session' | 'quick_log' | 'demo'
}

/**
 * Quick log a completed workout with minimal input
 * Used for fast logging of generated workouts
 * 
 * FEEDBACK LOOP: This is the canonical entry point for workout logging.
 * All completed sessions should flow through here for adaptive decisions.
 */
export function quickLogWorkout(input: QuickLogInput): WorkoutLog {
  // Demo workouts are never trusted for adaptive logic
  const isDemo = input.isDemo === true
  const trusted = !isDemo
  
  console.log('[workout-log] Saving workout:', {
    sessionName: input.sessionName,
    isDemo,
    trusted,
    completionStatus: input.completionStatus || 'completed',
    exerciseCount: input.exercises?.length || 0,
    sourceRoute: input.sourceRoute || (isDemo ? 'demo' : 'workout_session'),
  })
  
  return saveWorkoutLog({
    sessionName: input.sessionName,
    sessionType: input.sessionType,
    sessionDate: new Date().toISOString().split('T')[0],
    durationMinutes: input.durationMinutes,
    focusArea: input.focusArea,
    perceivedDifficulty: input.perceivedDifficulty,
    isQuickLog: true,
    generatedWorkoutId: input.generatedWorkoutId,
    keyPerformance: input.keyPerformance,
    notes: input.notes,
    exercises: input.exercises || [], // Include exercise-level outcomes
    // FEEDBACK LOOP fields
    completionStatus: input.completionStatus || 'completed',
    trusted,
    sourceRoute: input.sourceRoute || (isDemo ? 'demo' : 'workout_session'),
  })
}

/**
 * Get perceived difficulty distribution for adaptive adjustments
 */
export function getDifficultyDistribution(days: number = 14): {
  easy: number
  normal: number
  hard: number
  trend: 'getting_easier' | 'stable' | 'getting_harder'
} {
  const logs = getRecentWorkoutLogs(30)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const recentLogs = logs.filter(log => 
    new Date(log.sessionDate) >= cutoffDate && log.perceivedDifficulty
  )
  
  const counts = {
    easy: recentLogs.filter(l => l.perceivedDifficulty === 'easy').length,
    normal: recentLogs.filter(l => l.perceivedDifficulty === 'normal').length,
    hard: recentLogs.filter(l => l.perceivedDifficulty === 'hard').length,
  }
  
  // Determine trend based on recent vs older logs
  const midpoint = Math.floor(recentLogs.length / 2)
  const recentHalf = recentLogs.slice(0, midpoint)
  const olderHalf = recentLogs.slice(midpoint)
  
  const recentHardRate = recentHalf.filter(l => l.perceivedDifficulty === 'hard').length / (recentHalf.length || 1)
  const olderHardRate = olderHalf.filter(l => l.perceivedDifficulty === 'hard').length / (olderHalf.length || 1)
  
  let trend: 'getting_easier' | 'stable' | 'getting_harder' = 'stable'
  if (recentHardRate > olderHardRate + 0.2) trend = 'getting_harder'
  else if (recentHardRate < olderHardRate - 0.2) trend = 'getting_easier'
  
  return { ...counts, trend }
}

/**
 * Get workout completion stats for a period
 */
export function getCompletionStats(days: number = 30): {
  totalWorkouts: number
  avgDuration: number
  avgDifficultyScore: number // 1=easy, 2=normal, 3=hard
  workoutsPerWeek: number
} {
  const logs = getRecentWorkoutLogs(100)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const recentLogs = logs.filter(log => new Date(log.sessionDate) >= cutoffDate)
  
  const totalWorkouts = recentLogs.length
  const avgDuration = totalWorkouts > 0
    ? recentLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / totalWorkouts
    : 0
  
  const difficultyScores = recentLogs
    .filter(l => l.perceivedDifficulty)
    .map(l => l.perceivedDifficulty === 'easy' ? 1 : l.perceivedDifficulty === 'normal' ? 2 : 3)
  
  const avgDifficultyScore = difficultyScores.length > 0
    ? difficultyScores.reduce((a, b) => a + b, 0) / difficultyScores.length
    : 2
  
  const weeks = days / 7
  const workoutsPerWeek = totalWorkouts / weeks
  
  return { totalWorkouts, avgDuration, avgDifficultyScore, workoutsPerWeek }
}

// Perceived difficulty labels
export const DIFFICULTY_LABELS: Record<PerceivedDifficulty, string> = {
  easy: 'Easy - Could do more',
  normal: 'Normal - Just right',
  hard: 'Hard - Pushed my limits',
}

// Common exercise templates for quick selection
export const EXERCISE_TEMPLATES: { name: string; category: ExerciseCategory }[] = [
  // Skills
  { name: 'Planche Lean', category: 'skill' },
  { name: 'Tuck Planche Hold', category: 'skill' },
  { name: 'Advanced Tuck Planche', category: 'skill' },
  { name: 'Front Lever Tuck Hold', category: 'skill' },
  { name: 'Front Lever Raises', category: 'skill' },
  { name: 'Handstand Hold', category: 'skill' },
  { name: 'Muscle-Up', category: 'skill' },
  // Push
  { name: 'Weighted Dips', category: 'push' },
  { name: 'Dips', category: 'push' },
  { name: 'Push-Ups', category: 'push' },
  { name: 'Pseudo Planche Push-Ups', category: 'push' },
  { name: 'Pike Push-Ups', category: 'push' },
  { name: 'Wall HSPU', category: 'push' },
  // Pull
  { name: 'Weighted Pull-Ups', category: 'pull' },
  { name: 'Pull-Ups', category: 'pull' },
  { name: 'Chin-Ups', category: 'pull' },
  { name: 'Bodyweight Rows', category: 'pull' },
  { name: 'Scap Pull-Ups', category: 'pull' },
  { name: 'Archer Pull-Ups', category: 'pull' },
  // Core
  { name: 'Hollow Body Hold', category: 'core' },
  { name: 'L-Sit Hold', category: 'core' },
  { name: 'Hanging Knee Raises', category: 'core' },
  { name: 'Dragon Flags', category: 'core' },
  { name: 'Ab Wheel Rollouts', category: 'core' },
  // Legs
  { name: 'Pistol Squats', category: 'legs' },
  { name: 'Bulgarian Split Squats', category: 'legs' },
  { name: 'Nordic Curls', category: 'legs' },
  // Mobility
  { name: 'Shoulder Dislocates', category: 'mobility' },
  { name: 'Wrist Circles', category: 'mobility' },
  { name: 'Hip Flexor Stretch', category: 'mobility' },
]
