// Workout Log service layer for preview mode
// Uses localStorage for persistence, easy to swap to Prisma later

export type SessionType = 'skill' | 'strength' | 'mixed' | 'recovery'
export type FocusArea = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup' | 'weighted_strength' | 'general'
export type ExerciseCategory = 'skill' | 'push' | 'pull' | 'core' | 'legs' | 'mobility'

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
