// Strength tracking service layer for preview mode
// Uses localStorage for persistence, easy to swap to Prisma later

// Core weighted calisthenics
export type WeightedCalisthenicsType = 'weighted_pull_up' | 'weighted_dip' | 'weighted_muscle_up'

// Barbell exercises (hybrid strength)
export type BarbellExerciseType = 
  | 'conventional_deadlift' 
  | 'sumo_deadlift' 
  | 'romanian_deadlift'
  | 'trap_bar_deadlift'
  // Future extensibility
  | 'back_squat'
  | 'front_squat'
  | 'bench_press'
  | 'overhead_press'

// Combined exercise type for unified tracking
export type ExerciseType = WeightedCalisthenicsType | BarbellExerciseType

// Exercise category for grouping
export type StrengthExerciseCategory = 
  | 'weighted_calisthenics' 
  | 'barbell_hinge' 
  | 'barbell_squat' 
  | 'barbell_press'

export interface StrengthRecord {
  id: string
  exercise: ExerciseType
  category: StrengthExerciseCategory
  weightAdded: number  // For weighted calisthenics: added weight; For barbell: total weight
  bodyweight?: number  // Relevant for relative strength calculations
  reps: number
  estimatedOneRM: number
  relativeStrength?: number  // Ratio to bodyweight (e.g., 1.5 = 1.5x BW)
  dateLogged: string
  notes?: string
}

export interface ExerciseDefinition {
  id: ExerciseType
  name: string
  description: string
  category: StrengthExerciseCategory
  isBarbell: boolean
  trackRelativeStrength: boolean  // Should we calculate BW ratio?
}

export const EXERCISE_DEFINITIONS: ExerciseDefinition[] = [
  // Weighted Calisthenics
  {
    id: 'weighted_pull_up',
    name: 'Weighted Pull-Up',
    description: 'Pull-up with additional weight attached',
    category: 'weighted_calisthenics',
    isBarbell: false,
    trackRelativeStrength: true,
  },
  {
    id: 'weighted_dip',
    name: 'Weighted Dip',
    description: 'Dip with additional weight attached',
    category: 'weighted_calisthenics',
    isBarbell: false,
    trackRelativeStrength: true,
  },
  {
    id: 'weighted_muscle_up',
    name: 'Weighted Muscle-Up',
    description: 'Muscle-up with additional weight attached',
    category: 'weighted_calisthenics',
    isBarbell: false,
    trackRelativeStrength: true,
  },
  // Barbell Hinge (Deadlift family)
  {
    id: 'conventional_deadlift',
    name: 'Conventional Deadlift',
    description: 'Standard barbell deadlift with conventional stance',
    category: 'barbell_hinge',
    isBarbell: true,
    trackRelativeStrength: true,
  },
  {
    id: 'sumo_deadlift',
    name: 'Sumo Deadlift',
    description: 'Wide-stance barbell deadlift',
    category: 'barbell_hinge',
    isBarbell: true,
    trackRelativeStrength: true,
  },
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    description: 'Hip hinge deadlift emphasizing hamstrings',
    category: 'barbell_hinge',
    isBarbell: true,
    trackRelativeStrength: false,  // RDL not typically tracked as relative
  },
  {
    id: 'trap_bar_deadlift',
    name: 'Trap Bar Deadlift',
    description: 'Deadlift using hex/trap bar',
    category: 'barbell_hinge',
    isBarbell: true,
    trackRelativeStrength: true,
  },
  // Future: Squat family
  {
    id: 'back_squat',
    name: 'Back Squat',
    description: 'Barbell back squat',
    category: 'barbell_squat',
    isBarbell: true,
    trackRelativeStrength: true,
  },
  {
    id: 'front_squat',
    name: 'Front Squat',
    description: 'Barbell front squat',
    category: 'barbell_squat',
    isBarbell: true,
    trackRelativeStrength: true,
  },
  // Future: Press family
  {
    id: 'bench_press',
    name: 'Bench Press',
    description: 'Barbell bench press',
    category: 'barbell_press',
    isBarbell: true,
    trackRelativeStrength: true,
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    description: 'Standing barbell overhead press',
    category: 'barbell_press',
    isBarbell: true,
    trackRelativeStrength: true,
  },
]

/**
 * Get exercise definition with category awareness
 */
export function getExerciseDefinition(id: ExerciseType): ExerciseDefinition | undefined {
  return EXERCISE_DEFINITIONS.find(e => e.id === id)
}

/**
 * Get exercises by category
 */
export function getExercisesByCategory(category: StrengthExerciseCategory): ExerciseDefinition[] {
  return EXERCISE_DEFINITIONS.filter(e => e.category === category)
}

/**
 * Check if exercise is a barbell movement
 */
export function isBarbellExercise(id: ExerciseType): boolean {
  const def = getExerciseDefinition(id)
  return def?.isBarbell ?? false
}

/**
 * Check if exercise is a deadlift variant
 */
export function isDeadliftVariant(id: ExerciseType): boolean {
  return ['conventional_deadlift', 'sumo_deadlift', 'romanian_deadlift', 'trap_bar_deadlift'].includes(id)
}

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
export function getLatestRecords(): Partial<Record<ExerciseType, StrengthRecord | null>> {
  const records = getStrengthRecords()
  
  const result: Partial<Record<ExerciseType, StrengthRecord | null>> = {}
  
  for (const exercise of EXERCISE_DEFINITIONS) {
    const exerciseRecords = records
      .filter(r => r.exercise === exercise.id)
      .sort((a, b) => new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime())
    
    result[exercise.id] = exerciseRecords[0] || null
  }
  
  return result
}

// Save a new strength record with hybrid support
export function saveStrengthRecord(
  exercise: ExerciseType,
  weight: number,  // For barbell: total weight; For weighted calisthenics: added weight
  reps: number,
  options?: {
    bodyweight?: number
    dateLogged?: string
    notes?: string
  }
): StrengthRecord {
  const def = getExerciseDefinition(exercise)
  const isBarbell = def?.isBarbell ?? false
  
  // Calculate 1RM
  // For barbell: use total weight
  // For weighted calisthenics: use bodyweight + added weight for true 1RM
  const effectiveWeight = isBarbell 
    ? weight 
    : (options?.bodyweight ? options.bodyweight + weight : weight)
  
  const estimatedOneRM = calculateOneRM(effectiveWeight, reps)
  
  // Calculate relative strength if applicable
  let relativeStrength: number | undefined
  if (def?.trackRelativeStrength && options?.bodyweight && options.bodyweight > 0) {
    relativeStrength = Math.round((estimatedOneRM / options.bodyweight) * 100) / 100
  }
  
  const record: StrengthRecord = {
    id: `str-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    exercise,
    category: def?.category ?? 'weighted_calisthenics',
    weightAdded: weight,
    bodyweight: options?.bodyweight,
    reps,
    estimatedOneRM,
    relativeStrength,
    dateLogged: options?.dateLogged || new Date().toISOString().split('T')[0],
    notes: options?.notes,
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

// Get personal records (best 1RM for each exercise)
export function getPersonalRecords(): Partial<Record<ExerciseType, StrengthRecord | null>> {
  const records = getStrengthRecords()
  
  const result: Partial<Record<ExerciseType, StrengthRecord | null>> = {}
  
  for (const exercise of EXERCISE_DEFINITIONS) {
    const exerciseRecords = records
      .filter(r => r.exercise === exercise.id)
      .sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)
    
    result[exercise.id] = exerciseRecords[0] || null
  }
  
  return result
}

/**
 * Get PRs grouped by category
 */
export function getPersonalRecordsByCategory(): Record<StrengthExerciseCategory, StrengthRecord[]> {
  const records = getStrengthRecords()
  
  const result: Record<StrengthExerciseCategory, StrengthRecord[]> = {
    weighted_calisthenics: [],
    barbell_hinge: [],
    barbell_squat: [],
    barbell_press: [],
  }
  
  // Group by category and find best for each exercise
  for (const def of EXERCISE_DEFINITIONS) {
    const exerciseRecords = records
      .filter(r => r.exercise === def.id)
      .sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)
    
    if (exerciseRecords[0]) {
      result[def.category].push(exerciseRecords[0])
    }
  }
  
  return result
}

/**
 * Get best deadlift PR across all variants
 */
export function getBestDeadliftPR(): StrengthRecord | null {
  const records = getStrengthRecords()
  
  const deadliftRecords = records
    .filter(r => isDeadliftVariant(r.exercise))
    .sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)
  
  return deadliftRecords[0] || null
}

/**
 * Get streetlifting total (best weighted pull-up + best weighted dip + best deadlift)
 */
export function getStreetliftingTotal(bodyweight?: number): {
  total: number
  weightedPullUp: StrengthRecord | null
  weightedDip: StrengthRecord | null
  deadlift: StrengthRecord | null
} {
  const prs = getPersonalRecords()
  
  const weightedPullUp = prs.weighted_pull_up || null
  const weightedDip = prs.weighted_dip || null
  const deadlift = getBestDeadliftPR()
  
  // Calculate total (all should be in comparable units)
  let total = 0
  
  if (weightedPullUp) {
    // For weighted calisthenics, total = bodyweight + added weight
    total += bodyweight ? bodyweight + weightedPullUp.weightAdded : weightedPullUp.estimatedOneRM
  }
  if (weightedDip) {
    total += bodyweight ? bodyweight + weightedDip.weightAdded : weightedDip.estimatedOneRM
  }
  if (deadlift) {
    total += deadlift.weightAdded  // For deadlift, weightAdded is total bar weight
  }
  
  return {
    total,
    weightedPullUp,
    weightedDip,
    deadlift,
  }
}
