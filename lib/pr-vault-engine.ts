// PR Vault Engine
// Surfaces the athlete's most meaningful personal records across skills and strength
// Extended to support hybrid strength (deadlift, barbell work, streetlifting)

import { getSkillSessions, getSkillSessionStats } from './skill-session-service'
import { 
  getStrengthRecords, 
  getPersonalRecords, 
  getPersonalRecordsByCategory,
  getBestDeadliftPR,
  getStreetliftingTotal,
  type ExerciseType, 
  type StrengthRecord,
  type StrengthExerciseCategory,
  EXERCISE_DEFINITIONS,
  isBarbellExercise,
  isDeadliftVariant,
} from './strength-service'
import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getSkillProgressions } from './data-service'
import { getAthleteProfile } from './data-service'
import { SKILL_DEFINITIONS } from './skills'

// =============================================================================
// TYPES
// =============================================================================

export interface SkillPR {
  skillName: string
  skillLabel: string
  bestHoldSeconds: number
  bestLevel: number
  bestLevelName: string
  dateAchieved: string | null
  hasData: boolean
}

export interface StrengthPR {
  exercise: ExerciseType
  exerciseLabel: string
  category: StrengthExerciseCategory
  isBarbell: boolean
  bestWeightAdded: number
  bestReps: number
  bestOneRM: number
  relativeStrength: number | null // ratio to bodyweight
  dateAchieved: string
  hasData: boolean
}

/**
 * Barbell-specific PR for deadlift, squat, bench
 */
export interface BarbellPR {
  exercise: ExerciseType
  exerciseLabel: string
  variant: string  // e.g., "conventional", "sumo"
  bestWeight: number
  bestReps: number
  estimated1RM: number
  relativeStrength: number | null
  dateAchieved: string
  hasData: boolean
}

/**
 * Streetlifting total PR
 */
export interface StreetliftingTotalPR {
  total: number
  weightedPullUp1RM: number | null
  weightedDip1RM: number | null
  deadlift1RM: number | null
  dateComputed: string
  hasData: boolean
}

export interface TrainingPR {
  type: 'weekly_pull_volume' | 'weekly_push_volume' | 'skill_density' | 'consistency_streak'
  label: string
  value: number
  unit: string
  dateAchieved: string | null
  hasData: boolean
}

export interface PRVault {
  // Calisthenics PRs
  skillPRs: SkillPR[]
  strengthPRs: StrengthPR[]  // Weighted calisthenics
  trainingPRs: TrainingPR[]
  
  // Hybrid/Barbell PRs
  barbellPRs: BarbellPR[]
  streetliftingTotal: StreetliftingTotalPR | null
  
  // Aggregates
  totalPRs: number
  hasHybridData: boolean
  lastUpdated: string
}

// =============================================================================
// SKILL PRS
// =============================================================================

function getSkillPRs(): SkillPR[] {
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
        bestHoldSeconds: 0,
        bestLevel: 0,
        bestLevelName: skillDef?.levels[0] || 'Tuck',
        dateAchieved: null,
        hasData: false,
      }
    }
    
    // Find best hold across all sessions
    let bestHold = 0
    let bestHoldDate: string | null = null
    
    skillSessions.forEach(session => {
      session.sets.forEach(set => {
        if (set.holdSeconds > bestHold) {
          bestHold = set.holdSeconds
          bestHoldDate = session.sessionDate
        }
      })
    })
    
    // Find highest level achieved
    const bestLevel = progression?.currentLevel ?? 0
    const bestLevelName = skillDef?.levels[bestLevel] || 'Tuck'
    
    return {
      skillName: skillKey,
      skillLabel: skillDef?.name || skillKey,
      bestHoldSeconds: bestHold,
      bestLevel,
      bestLevelName,
      dateAchieved: bestHoldDate,
      hasData: skillSessions.length > 0 || !!progression,
    }
  })
}

// =============================================================================
// STRENGTH PRS (Weighted Calisthenics)
// =============================================================================

function getStrengthPRs(): StrengthPR[] {
  const prs = getPersonalRecords()
  const profile = getAthleteProfile()
  const bodyweight = profile.bodyweight
  
  // Only include weighted calisthenics here
  const exercises = EXERCISE_DEFINITIONS.filter(e => e.category === 'weighted_calisthenics')
  
  return exercises.map(exercise => {
    const pr = prs[exercise.id]
    
    if (!pr) {
      return {
        exercise: exercise.id,
        exerciseLabel: exercise.name,
        category: exercise.category,
        isBarbell: false,
        bestWeightAdded: 0,
        bestReps: 0,
        bestOneRM: 0,
        relativeStrength: null,
        dateAchieved: '',
        hasData: false,
      }
    }
    
    const relativeStrength = bodyweight 
      ? Math.round((pr.estimatedOneRM / bodyweight) * 100) / 100
      : null
    
    return {
      exercise: exercise.id,
      exerciseLabel: exercise.name,
      category: exercise.category,
      isBarbell: false,
      bestWeightAdded: pr.weightAdded,
      bestReps: pr.reps,
      bestOneRM: pr.estimatedOneRM,
      relativeStrength,
      dateAchieved: pr.dateLogged,
      hasData: true,
    }
  })
}

// =============================================================================
// BARBELL PRS (Hybrid Strength)
// =============================================================================

function getBarbellPRs(): BarbellPR[] {
  const prs = getPersonalRecords()
  const profile = getAthleteProfile()
  const bodyweight = profile.bodyweight
  
  // Get all barbell exercises
  const barbellExercises = EXERCISE_DEFINITIONS.filter(e => e.isBarbell)
  
  const results: BarbellPR[] = []
  
  for (const exercise of barbellExercises) {
    const pr = prs[exercise.id]
    
    if (pr) {
      const relativeStrength = bodyweight && exercise.trackRelativeStrength
        ? Math.round((pr.estimatedOneRM / bodyweight) * 100) / 100
        : null
      
      results.push({
        exercise: exercise.id,
        exerciseLabel: exercise.name,
        variant: getVariantName(exercise.id),
        bestWeight: pr.weightAdded,
        bestReps: pr.reps,
        estimated1RM: pr.estimatedOneRM,
        relativeStrength,
        dateAchieved: pr.dateLogged,
        hasData: true,
      })
    }
  }
  
  return results
}

function getVariantName(exerciseId: ExerciseType): string {
  const variantMap: Partial<Record<ExerciseType, string>> = {
    conventional_deadlift: 'Conventional',
    sumo_deadlift: 'Sumo',
    romanian_deadlift: 'Romanian',
    trap_bar_deadlift: 'Trap Bar',
    back_squat: 'Back',
    front_squat: 'Front',
    bench_press: 'Flat',
    overhead_press: 'Standing',
  }
  return variantMap[exerciseId] ?? 'Standard'
}

// =============================================================================
// STREETLIFTING TOTAL
// =============================================================================

function getStreetliftingTotalPR(): StreetliftingTotalPR | null {
  const profile = getAthleteProfile()
  const bodyweight = profile.bodyweight
  
  const streetTotal = getStreetliftingTotal(bodyweight)
  
  // Only return if we have at least one component
  const hasData = !!(streetTotal.weightedPullUp || streetTotal.weightedDip || streetTotal.deadlift)
  
  if (!hasData) return null
  
  return {
    total: streetTotal.total,
    weightedPullUp1RM: streetTotal.weightedPullUp?.estimatedOneRM ?? null,
    weightedDip1RM: streetTotal.weightedDip?.estimatedOneRM ?? null,
    deadlift1RM: streetTotal.deadlift?.estimatedOneRM ?? null,
    dateComputed: new Date().toISOString(),
    hasData: true,
  }
}

// =============================================================================
// TRAINING PRS
// =============================================================================

function getTrainingPRs(): TrainingPR[] {
  const logs = getWorkoutLogs()
  const sessions = getSkillSessions()
  
  const prs: TrainingPR[] = []
  
  // Weekly pull volume PR
  const weeklyPullVolume = calculateBestWeeklyVolume(logs, 'pull')
  prs.push({
    type: 'weekly_pull_volume',
    label: 'Best Weekly Pull Sets',
    value: weeklyPullVolume.value,
    unit: 'sets',
    dateAchieved: weeklyPullVolume.weekStart,
    hasData: weeklyPullVolume.value > 0,
  })
  
  // Weekly push volume PR
  const weeklyPushVolume = calculateBestWeeklyVolume(logs, 'push')
  prs.push({
    type: 'weekly_push_volume',
    label: 'Best Weekly Push Sets',
    value: weeklyPushVolume.value,
    unit: 'sets',
    dateAchieved: weeklyPushVolume.weekStart,
    hasData: weeklyPushVolume.value > 0,
  })
  
  // Skill density PR (most hold seconds in a single session)
  const bestDensity = calculateBestSkillDensity(sessions)
  prs.push({
    type: 'skill_density',
    label: 'Best Session Density',
    value: bestDensity.value,
    unit: 'seconds total',
    dateAchieved: bestDensity.date,
    hasData: bestDensity.value > 0,
  })
  
  // Consistency streak
  const streak = calculateConsistencyStreak(logs)
  prs.push({
    type: 'consistency_streak',
    label: 'Best Training Streak',
    value: streak.value,
    unit: 'weeks',
    dateAchieved: streak.endDate,
    hasData: streak.value > 0,
  })
  
  return prs
}

function calculateBestWeeklyVolume(
  logs: WorkoutLog[], 
  category: 'pull' | 'push'
): { value: number; weekStart: string | null } {
  if (logs.length === 0) return { value: 0, weekStart: null }
  
  // Group logs by week
  const weeklyVolumes: Map<string, number> = new Map()
  
  logs.forEach(log => {
    const weekStart = getWeekStart(new Date(log.sessionDate))
    const weekKey = weekStart.toISOString().split('T')[0]
    
    const categoryExercises = log.exercises.filter(e => e.category === category)
    const sets = categoryExercises.reduce((sum, e) => sum + e.sets, 0)
    
    weeklyVolumes.set(weekKey, (weeklyVolumes.get(weekKey) || 0) + sets)
  })
  
  let bestWeek = { value: 0, weekStart: null as string | null }
  
  weeklyVolumes.forEach((volume, weekStart) => {
    if (volume > bestWeek.value) {
      bestWeek = { value: volume, weekStart }
    }
  })
  
  return bestWeek
}

function calculateBestSkillDensity(
  sessions: ReturnType<typeof getSkillSessions>
): { value: number; date: string | null } {
  if (sessions.length === 0) return { value: 0, date: null }
  
  let best = { value: 0, date: null as string | null }
  
  sessions.forEach(session => {
    const totalSeconds = session.sets.reduce((sum, set) => sum + set.holdSeconds, 0)
    if (totalSeconds > best.value) {
      best = { value: totalSeconds, date: session.sessionDate }
    }
  })
  
  return best
}

function calculateConsistencyStreak(logs: WorkoutLog[]): { value: number; endDate: string | null } {
  if (logs.length === 0) return { value: 0, endDate: null }
  
  // Sort logs by date
  const sorted = [...logs].sort(
    (a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
  )
  
  // Track weeks with workouts
  const weeksWithWorkouts = new Set<string>()
  sorted.forEach(log => {
    const weekStart = getWeekStart(new Date(log.sessionDate))
    weeksWithWorkouts.set(weekStart.toISOString().split('T')[0])
  })
  
  // Find longest consecutive week streak
  const weekKeys = Array.from(weeksWithWorkouts).sort()
  let longestStreak = 0
  let currentStreak = 0
  let streakEnd: string | null = null
  
  for (let i = 0; i < weekKeys.length; i++) {
    if (i === 0) {
      currentStreak = 1
    } else {
      const prevWeek = new Date(weekKeys[i - 1])
      const currWeek = new Date(weekKeys[i])
      const diffDays = (currWeek.getTime() - prevWeek.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays <= 7) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    }
    
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak
      streakEnd = weekKeys[i]
    }
  }
  
  return { value: longestStreak, endDate: streakEnd }
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

export function getPRVault(): PRVault {
  const skillPRs = getSkillPRs()
  const strengthPRs = getStrengthPRs()
  const trainingPRs = getTrainingPRs()
  const barbellPRs = getBarbellPRs()
  const streetliftingTotal = getStreetliftingTotalPR()
  
  const totalPRs = [
    ...skillPRs.filter(p => p.hasData),
    ...strengthPRs.filter(p => p.hasData),
    ...trainingPRs.filter(p => p.hasData),
    ...barbellPRs.filter(p => p.hasData),
  ].length
  
  const hasHybridData = barbellPRs.length > 0 || (streetliftingTotal?.hasData ?? false)
  
  return {
    skillPRs,
    strengthPRs,
    trainingPRs,
    barbellPRs,
    streetliftingTotal,
    totalPRs,
    hasHybridData,
    lastUpdated: new Date().toISOString(),
  }
}
