// =============================================================================
// REST TIME INTELLIGENCE
// Provides smart rest suggestions based on exercise type, RPE, and fatigue
// =============================================================================

import type { AdaptiveExercise } from '@/lib/adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface RestRecommendation {
  baseSeconds: number
  adjustedSeconds: number
  adjustment: {
    delta: number
    reason: string
    type: 'increase' | 'decrease' | 'none'
  }
  category: ExerciseRestCategory
}

export type ExerciseRestCategory = 
  | 'heavy_strength'
  | 'skill_work' 
  | 'accessory'
  | 'core'
  | 'density_circuit'
  | 'flexibility'

// =============================================================================
// REST TIME DEFAULTS BY CATEGORY
// =============================================================================

export const REST_TIMES_BY_CATEGORY: Record<ExerciseRestCategory, { min: number; default: number; max: number }> = {
  heavy_strength: { min: 120, default: 180, max: 240 },  // 2-4 minutes
  skill_work: { min: 90, default: 120, max: 180 },       // 1.5-3 minutes
  accessory: { min: 60, default: 90, max: 120 },         // 1-2 minutes
  core: { min: 30, default: 60, max: 90 },               // 30s-1.5 minutes
  density_circuit: { min: 15, default: 30, max: 45 },    // 15-45 seconds
  flexibility: { min: 30, default: 45, max: 60 },        // 30s-1 minute
}

// =============================================================================
// CATEGORY MAPPING
// =============================================================================

/**
 * Map exercise category/type to rest category
 */
export function getRestCategory(exercise: AdaptiveExercise): ExerciseRestCategory {
  const category = exercise.category?.toLowerCase() || ''
  const name = exercise.name?.toLowerCase() || ''
  const repsOrTime = exercise.repsOrTime?.toLowerCase() || ''
  
  // Check for density/circuit indicators
  if (category.includes('density') || category.includes('circuit') || category.includes('finisher')) {
    return 'density_circuit'
  }
  
  // Check for flexibility
  if (category.includes('flex') || category.includes('stretch') || category.includes('mobility')) {
    return 'flexibility'
  }
  
  // Check for core work
  if (category.includes('core') || category.includes('abs')) {
    return 'core'
  }
  
  // Check for skill work (isometric holds, progressions)
  if (category.includes('skill') || 
      name.includes('lever') || 
      name.includes('planche') || 
      name.includes('handstand') ||
      name.includes('l-sit') ||
      name.includes('v-sit') ||
      repsOrTime.includes('hold') ||
      repsOrTime.includes('sec')) {
    return 'skill_work'
  }
  
  // Check for heavy strength (pull, push with low reps)
  if (category.includes('strength') || 
      category.includes('pull') || 
      category.includes('push') ||
      category.includes('legs')) {
    // Check rep range - lower reps = more rest needed
    const repMatch = repsOrTime.match(/(\d+)/)
    const reps = repMatch ? parseInt(repMatch[1], 10) : 8
    if (reps <= 6) {
      return 'heavy_strength'
    }
    return 'accessory'
  }
  
  // Default to accessory
  return 'accessory'
}

// =============================================================================
// RPE-BASED ADJUSTMENTS
// =============================================================================

/**
 * Calculate rest adjustment based on previous set's RPE
 */
export function getRPERestAdjustment(
  rpe: number, 
  baseRestSeconds: number
): { delta: number; reason: string; type: 'increase' | 'decrease' | 'none' } {
  // High RPE (9-10): Significantly more rest needed
  if (rpe >= 9.5) {
    return {
      delta: 60,
      reason: 'Very high effort (RPE 9.5-10) - extra recovery recommended',
      type: 'increase',
    }
  }
  
  if (rpe >= 9) {
    return {
      delta: 45,
      reason: 'High effort (RPE 9) - additional rest for recovery',
      type: 'increase',
    }
  }
  
  if (rpe >= 8.5) {
    return {
      delta: 30,
      reason: 'Solid effort (RPE 8.5) - slight rest increase',
      type: 'increase',
    }
  }
  
  // Target RPE (7-8): Normal rest
  if (rpe >= 7) {
    return {
      delta: 0,
      reason: '',
      type: 'none',
    }
  }
  
  // Low RPE (under 7): Could reduce rest slightly
  if (rpe <= 6) {
    return {
      delta: -15,
      reason: 'Lower effort - slightly reduced rest',
      type: 'decrease',
    }
  }
  
  return { delta: 0, reason: '', type: 'none' }
}

// =============================================================================
// FATIGUE-BASED ADJUSTMENTS
// =============================================================================

/**
 * Calculate rest adjustment based on accumulated fatigue in session
 */
export function getFatigueRestAdjustment(
  setNumber: number,
  totalSetsCompleted: number,
  averageRPE: number | null
): { delta: number; reason: string; type: 'increase' | 'decrease' | 'none' } {
  // Later sets in a workout may need more rest
  if (totalSetsCompleted >= 15 && setNumber > 3) {
    return {
      delta: 15,
      reason: 'Extended session fatigue',
      type: 'increase',
    }
  }
  
  // High average RPE across session indicates accumulated fatigue
  if (averageRPE && averageRPE >= 8.5 && totalSetsCompleted >= 6) {
    return {
      delta: 20,
      reason: 'High session intensity',
      type: 'increase',
    }
  }
  
  return { delta: 0, reason: '', type: 'none' }
}

// =============================================================================
// MAIN REST RECOMMENDATION FUNCTION
// =============================================================================

/**
 * Get intelligent rest recommendation based on exercise, RPE, and session fatigue
 */
export function getRestRecommendation(
  exercise: AdaptiveExercise,
  lastSetRPE?: number,
  sessionContext?: {
    setNumber: number
    totalSetsCompleted: number
    averageRPE: number | null
  }
): RestRecommendation {
  const category = getRestCategory(exercise)
  const baseSeconds = REST_TIMES_BY_CATEGORY[category].default
  
  // Start with base rest
  let adjustedSeconds = baseSeconds
  let totalDelta = 0
  const adjustmentReasons: string[] = []
  let adjustmentType: 'increase' | 'decrease' | 'none' = 'none'
  
  // Apply RPE-based adjustment
  if (lastSetRPE !== undefined) {
    const rpeAdjustment = getRPERestAdjustment(lastSetRPE, baseSeconds)
    if (rpeAdjustment.delta !== 0) {
      adjustedSeconds += rpeAdjustment.delta
      totalDelta += rpeAdjustment.delta
      if (rpeAdjustment.reason) {
        adjustmentReasons.push(rpeAdjustment.reason)
      }
      adjustmentType = rpeAdjustment.type
    }
  }
  
  // Apply fatigue-based adjustment
  if (sessionContext) {
    const fatigueAdjustment = getFatigueRestAdjustment(
      sessionContext.setNumber,
      sessionContext.totalSetsCompleted,
      sessionContext.averageRPE
    )
    if (fatigueAdjustment.delta !== 0) {
      adjustedSeconds += fatigueAdjustment.delta
      totalDelta += fatigueAdjustment.delta
      if (fatigueAdjustment.reason) {
        adjustmentReasons.push(fatigueAdjustment.reason)
      }
      if (adjustmentType === 'none') {
        adjustmentType = fatigueAdjustment.type
      }
    }
  }
  
  // Clamp to category bounds
  const bounds = REST_TIMES_BY_CATEGORY[category]
  adjustedSeconds = Math.max(bounds.min, Math.min(bounds.max, adjustedSeconds))
  
  return {
    baseSeconds,
    adjustedSeconds,
    adjustment: {
      delta: totalDelta,
      reason: adjustmentReasons.join('. '),
      type: adjustmentType,
    },
    category,
  }
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export const REST_CATEGORY_LABELS: Record<ExerciseRestCategory, string> = {
  heavy_strength: 'Heavy Strength',
  skill_work: 'Skill Work',
  accessory: 'Accessory',
  core: 'Core Work',
  density_circuit: 'Circuit',
  flexibility: 'Flexibility',
}

export function formatRestDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) {
    return `${secs}s`
  }
  if (secs === 0) {
    return `${mins}:00`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// =============================================================================
// SESSION REST TIMER PERSISTENCE
// =============================================================================

const REST_TIMER_STORAGE_KEY = 'spartanlab_rest_timer'

export interface RestTimerState {
  remainingSeconds: number
  totalSeconds: number
  startedAt: number
  isPaused: boolean
  exerciseIndex: number
  setNumber: number
}

export function saveRestTimerState(state: RestTimerState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function loadRestTimerState(): RestTimerState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(REST_TIMER_STORAGE_KEY)
    if (!saved) return null
    const state = JSON.parse(saved) as RestTimerState
    // Only restore if less than 10 minutes old
    if (Date.now() - state.startedAt > 10 * 60 * 1000) {
      clearRestTimerState()
      return null
    }
    return state
  } catch {
    return null
  }
}

export function clearRestTimerState(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(REST_TIMER_STORAGE_KEY)
  } catch {}
}
