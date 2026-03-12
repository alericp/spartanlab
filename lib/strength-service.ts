// Strength tracking service layer for preview mode
// Uses localStorage for persistence, easy to swap to Prisma later

export type ExerciseType = 'weighted_pull_up' | 'weighted_dip' | 'weighted_muscle_up'

export interface StrengthRecord {
  id: string
  exercise: ExerciseType
  weightAdded: number
  reps: number
  estimatedOneRM: number
  dateLogged: string
}

export interface ExerciseDefinition {
  id: ExerciseType
  name: string
  description: string
}

export const EXERCISE_DEFINITIONS: ExerciseDefinition[] = [
  {
    id: 'weighted_pull_up',
    name: 'Weighted Pull Up',
    description: 'Pull up with additional weight attached',
  },
  {
    id: 'weighted_dip',
    name: 'Weighted Dip',
    description: 'Dip with additional weight attached',
  },
  {
    id: 'weighted_muscle_up',
    name: 'Weighted Muscle Up',
    description: 'Muscle up with additional weight attached',
  },
]

const STORAGE_KEY = 'spartanlab_strength_records'

// Check if we're in browser
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Calculate estimated 1RM using Epley formula
export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

// Get all strength records
export function getStrengthRecords(): StrengthRecord[] {
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

// Get records for a specific exercise
export function getRecordsByExercise(exercise: ExerciseType): StrengthRecord[] {
  const records = getStrengthRecords()
  return records
    .filter(r => r.exercise === exercise)
    .sort((a, b) => new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime())
}

// Get latest record for each exercise
export function getLatestRecords(): Record<ExerciseType, StrengthRecord | null> {
  const records = getStrengthRecords()
  
  const result: Record<ExerciseType, StrengthRecord | null> = {
    weighted_pull_up: null,
    weighted_dip: null,
    weighted_muscle_up: null,
  }
  
  for (const exercise of EXERCISE_DEFINITIONS) {
    const exerciseRecords = records
      .filter(r => r.exercise === exercise.id)
      .sort((a, b) => new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime())
    
    result[exercise.id] = exerciseRecords[0] || null
  }
  
  return result
}

// Save a new strength record
export function saveStrengthRecord(
  exercise: ExerciseType,
  weightAdded: number,
  reps: number,
  dateLogged?: string
): StrengthRecord {
  const estimatedOneRM = calculateOneRM(weightAdded, reps)
  
  const record: StrengthRecord = {
    id: `str-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    exercise,
    weightAdded,
    reps,
    estimatedOneRM,
    dateLogged: dateLogged || new Date().toISOString().split('T')[0],
  }
  
  if (!isBrowser()) return record
  
  const records = getStrengthRecords()
  records.push(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  
  return record
}

// Delete a strength record
export function deleteStrengthRecord(id: string): boolean {
  if (!isBrowser()) return false
  
  const records = getStrengthRecords()
  const filtered = records.filter(r => r.id !== id)
  
  if (filtered.length === records.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Get exercise definition by ID
export function getExerciseDefinition(id: ExerciseType): ExerciseDefinition | undefined {
  return EXERCISE_DEFINITIONS.find(e => e.id === id)
}

// Get personal records (best 1RM for each exercise)
export function getPersonalRecords(): Record<ExerciseType, StrengthRecord | null> {
  const records = getStrengthRecords()
  
  const result: Record<ExerciseType, StrengthRecord | null> = {
    weighted_pull_up: null,
    weighted_dip: null,
    weighted_muscle_up: null,
  }
  
  for (const exercise of EXERCISE_DEFINITIONS) {
    const exerciseRecords = records
      .filter(r => r.exercise === exercise.id)
      .sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)
    
    result[exercise.id] = exerciseRecords[0] || null
  }
  
  return result
}
