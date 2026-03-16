// Exercise Override Service
// Manages session-scoped exercise replacements, skips, and progression adjustments

import { 
  getAllExercises, 
  getExerciseById,
  type Exercise,
  type MovementPattern,
  type DifficultyLevel,
} from './exercises'
import type { AdaptiveExercise } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export type OverrideType = 'replaced' | 'skipped' | 'progression_adjusted'

export interface ExerciseOverride {
  originalExerciseId: string
  originalExerciseName: string
  overrideType: OverrideType
  newExerciseId?: string
  newExerciseName?: string
  newProgression?: string
  reason?: string
  timestamp: number
}

export interface SessionOverrides {
  sessionId: string
  overrides: ExerciseOverride[]
  createdAt: number
}

export interface ReplacementOption {
  id: string
  name: string
  category: string
  difficulty: DifficultyLevel
  isRecommended: boolean
  reason: string
}

export interface ProgressionOption {
  id: string
  name: string
  direction: 'easier' | 'harder'
  difficultyLevel: DifficultyLevel
}

// =============================================================================
// MOVEMENT PATTERN MAPPING
// =============================================================================

const MOVEMENT_PATTERN_GROUPS: Record<string, string[]> = {
  // Pull movements
  'horizontal_pull': ['horizontal_pull', 'vertical_pull'],
  'vertical_pull': ['vertical_pull', 'horizontal_pull'],
  // Push movements  
  'horizontal_push': ['horizontal_push', 'vertical_push'],
  'vertical_push': ['vertical_push', 'horizontal_push'],
  // Core/Compression
  'core': ['core', 'compression'],
  'compression': ['compression', 'core'],
  // Skills share patterns
  'skill': ['skill', 'horizontal_push', 'horizontal_pull'],
  // Mobility
  'mobility': ['mobility', 'core'],
  // Transition
  'transition': ['transition', 'skill'],
}

// Category-based groupings for replacement logic
const CATEGORY_REPLACEMENTS: Record<string, string[]> = {
  'pull': ['Pull-Ups', 'Chin-Ups', 'Neutral Grip Pull-Ups', 'Ring Rows', 'Bodyweight Rows', 'Archer Pull-Ups', 'Band Assisted Pull-Ups', 'Scap Pull-Ups', 'Lat Pulldown'],
  'push': ['Dips', 'Push-Ups', 'Diamond Push-Ups', 'Pike Push-Ups', 'Ring Dips', 'Pseudo Planche Push-Ups', 'Wall HSPU', 'Band Assisted Dips'],
  'skill': ['Planche Lean', 'Tuck Planche Hold', 'Front Lever Tuck Hold', 'L-Sit Hold', 'Handstand Hold', 'Back Lever Tuck'],
  'core': ['Hollow Body Hold', 'L-Sit Hold', 'Hanging Knee Raises', 'Dragon Flags', 'Ab Wheel Rollouts', 'Plank', 'Dead Bug'],
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_session_overrides'

function getStoredOverrides(): SessionOverrides | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const data = JSON.parse(stored)
    // Only use if less than 4 hours old (session scope)
    if (Date.now() - data.createdAt > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function saveOverrides(overrides: SessionOverrides): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {}
}

export function clearSessionOverrides(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get current session overrides
 */
export function getSessionOverrides(sessionId: string): ExerciseOverride[] {
  const stored = getStoredOverrides()
  if (!stored || stored.sessionId !== sessionId) return []
  return stored.overrides
}

/**
 * Add an override to the current session
 */
export function addOverride(sessionId: string, override: ExerciseOverride): void {
  const stored = getStoredOverrides()
  const currentOverrides = stored?.sessionId === sessionId ? stored.overrides : []
  
  // Remove any existing override for this exercise
  const filtered = currentOverrides.filter(o => o.originalExerciseId !== override.originalExerciseId)
  
  const newOverrides: SessionOverrides = {
    sessionId,
    overrides: [...filtered, override],
    createdAt: stored?.createdAt || Date.now(),
  }
  
  saveOverrides(newOverrides)
}

/**
 * Remove an override (undo)
 */
export function removeOverride(sessionId: string, originalExerciseId: string): void {
  const stored = getStoredOverrides()
  if (!stored || stored.sessionId !== sessionId) return
  
  const filtered = stored.overrides.filter(o => o.originalExerciseId !== originalExerciseId)
  
  saveOverrides({
    ...stored,
    overrides: filtered,
  })
}

/**
 * Check if an exercise has been overridden
 */
export function getOverrideForExercise(sessionId: string, exerciseId: string): ExerciseOverride | null {
  const overrides = getSessionOverrides(sessionId)
  return overrides.find(o => o.originalExerciseId === exerciseId) || null
}

// =============================================================================
// REPLACEMENT LOGIC
// =============================================================================

/**
 * Get replacement options for an exercise
 */
export function getReplacementOptions(
  exercise: AdaptiveExercise,
  availableEquipment: string[] = ['pull_bar', 'dip_bars', 'floor', 'bands']
): ReplacementOption[] {
  const allExercises = getAllExercises()
  const exerciseName = exercise.name.toLowerCase()
  const exerciseCategory = exercise.category.toLowerCase()
  
  // Determine movement pattern from category or name
  let targetPatterns: string[] = []
  
  if (exerciseCategory === 'pull' || exerciseName.includes('pull') || exerciseName.includes('row') || exerciseName.includes('lever')) {
    targetPatterns = ['horizontal_pull', 'vertical_pull']
  } else if (exerciseCategory === 'push' || exerciseName.includes('push') || exerciseName.includes('dip') || exerciseName.includes('planche')) {
    targetPatterns = ['horizontal_push', 'vertical_push']
  } else if (exerciseCategory === 'skill') {
    // For skills, match based on the specific skill type
    if (exerciseName.includes('planche')) {
      targetPatterns = ['horizontal_push']
    } else if (exerciseName.includes('lever')) {
      targetPatterns = ['horizontal_pull']
    } else if (exerciseName.includes('l-sit') || exerciseName.includes('v-sit')) {
      targetPatterns = ['compression', 'core']
    } else {
      targetPatterns = ['skill']
    }
  } else if (exerciseCategory === 'core') {
    targetPatterns = ['core', 'compression']
  } else {
    targetPatterns = [exerciseCategory]
  }
  
  // Filter exercises that match movement pattern and have compatible equipment
  const options: ReplacementOption[] = []
  
  for (const ex of allExercises) {
    // Skip same exercise
    if (ex.name.toLowerCase() === exerciseName) continue
    
    // Check movement pattern match
    const patternMatch = targetPatterns.includes(ex.movementPattern)
    if (!patternMatch) continue
    
    // Check equipment compatibility
    const equipmentMatch = ex.equipment.some(eq => 
      availableEquipment.includes(eq) || eq === 'floor'
    )
    if (!equipmentMatch) continue
    
    // Determine if this is a recommended replacement
    const isRecommended = ex.category === exercise.category || 
      (ex.transferTo && ex.transferTo.some(t => exercise.name.toLowerCase().includes(t)))
    
    // Determine reason
    let reason = 'Similar movement pattern'
    if (ex.alternatives?.includes(exercise.id || '')) {
      reason = 'Direct alternative'
    } else if (ex.transferTo?.some(t => exercise.name.toLowerCase().includes(t))) {
      reason = 'Transfers to same skill'
    } else if (ex.category === exercise.category) {
      reason = 'Same category'
    }
    
    options.push({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      difficulty: ex.difficultyLevel || 'intermediate',
      isRecommended,
      reason,
    })
  }
  
  // Sort: recommended first, then by difficulty match
  const exerciseDifficulty = inferDifficulty(exercise.name)
  options.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    
    // Then by difficulty closeness
    const diffOrder: Record<DifficultyLevel, number> = { beginner: 1, intermediate: 2, advanced: 3, elite: 4 }
    const targetDiff = diffOrder[exerciseDifficulty]
    const diffA = Math.abs(diffOrder[a.difficulty] - targetDiff)
    const diffB = Math.abs(diffOrder[b.difficulty] - targetDiff)
    return diffA - diffB
  })
  
  return options.slice(0, 10) // Limit to 10 options
}

/**
 * Get progression options (easier/harder) for an exercise
 */
export function getProgressionOptions(exercise: AdaptiveExercise): ProgressionOption[] {
  const allExercises = getAllExercises()
  const options: ProgressionOption[] = []
  
  // Find the exercise in the pool
  const poolExercise = allExercises.find(ex => 
    ex.name.toLowerCase() === exercise.name.toLowerCase() ||
    ex.id === exercise.id
  )
  
  if (poolExercise) {
    // Check for explicit progression ladder
    if (poolExercise.progressionUp) {
      const harder = getExerciseById(poolExercise.progressionUp)
      if (harder) {
        options.push({
          id: harder.id,
          name: harder.name,
          direction: 'harder',
          difficultyLevel: harder.difficultyLevel || 'advanced',
        })
      }
    }
    
    if (poolExercise.progressionDown) {
      const easier = getExerciseById(poolExercise.progressionDown)
      if (easier) {
        options.push({
          id: easier.id,
          name: easier.name,
          direction: 'easier',
          difficultyLevel: easier.difficultyLevel || 'beginner',
        })
      }
    }
    
    // If no explicit progressions, find exercises in same ladder
    if (options.length === 0 && poolExercise.progressionLadder) {
      const sameladder = allExercises.filter(ex => 
        ex.progressionLadder === poolExercise.progressionLadder && 
        ex.id !== poolExercise.id
      )
      
      const diffOrder: Record<DifficultyLevel, number> = { beginner: 1, intermediate: 2, advanced: 3, elite: 4 }
      const currentDiff = diffOrder[poolExercise.difficultyLevel || 'intermediate']
      
      for (const ex of sameladder) {
        const exDiff = diffOrder[ex.difficultyLevel || 'intermediate']
        if (exDiff < currentDiff) {
          options.push({
            id: ex.id,
            name: ex.name,
            direction: 'easier',
            difficultyLevel: ex.difficultyLevel || 'beginner',
          })
        } else if (exDiff > currentDiff) {
          options.push({
            id: ex.id,
            name: ex.name,
            direction: 'harder',
            difficultyLevel: ex.difficultyLevel || 'advanced',
          })
        }
      }
    }
  }
  
  // If still no options, infer from name patterns
  if (options.length === 0) {
    const name = exercise.name.toLowerCase()
    
    // Common progression patterns
    const progressionPatterns = [
      { pattern: 'tuck', easier: null, harder: 'advanced tuck' },
      { pattern: 'advanced tuck', easier: 'tuck', harder: 'straddle' },
      { pattern: 'straddle', easier: 'advanced tuck', harder: 'full' },
      { pattern: 'band assisted', easier: null, harder: 'bodyweight' },
      { pattern: 'bodyweight', easier: 'band assisted', harder: 'weighted' },
    ]
    
    for (const prog of progressionPatterns) {
      if (name.includes(prog.pattern)) {
        if (prog.easier) {
          const easierName = name.replace(prog.pattern, prog.easier)
          options.push({
            id: `inferred-easier-${Date.now()}`,
            name: easierName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            direction: 'easier',
            difficultyLevel: 'beginner',
          })
        }
        if (prog.harder) {
          const harderName = name.replace(prog.pattern, prog.harder)
          options.push({
            id: `inferred-harder-${Date.now()}`,
            name: harderName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            direction: 'harder',
            difficultyLevel: 'advanced',
          })
        }
      }
    }
  }
  
  // Sort: easier first, then harder
  options.sort((a, b) => {
    if (a.direction === 'easier' && b.direction === 'harder') return -1
    if (a.direction === 'harder' && b.direction === 'easier') return 1
    return 0
  })
  
  return options
}

// =============================================================================
// HELPERS
// =============================================================================

function inferDifficulty(name: string): DifficultyLevel {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('band assisted') || nameLower.includes('beginner') || nameLower.includes('incline')) {
    return 'beginner'
  }
  if (nameLower.includes('straddle') || nameLower.includes('full') || nameLower.includes('one arm')) {
    return 'elite'
  }
  if (nameLower.includes('advanced') || nameLower.includes('weighted') || nameLower.includes('archer')) {
    return 'advanced'
  }
  return 'intermediate'
}

/**
 * Apply overrides to a session's exercises
 */
export function applyOverridesToSession(
  sessionId: string,
  exercises: AdaptiveExercise[]
): AdaptiveExercise[] {
  const overrides = getSessionOverrides(sessionId)
  if (overrides.length === 0) return exercises
  
  return exercises.map(exercise => {
    const override = overrides.find(o => 
      o.originalExerciseId === exercise.id || 
      o.originalExerciseName.toLowerCase() === exercise.name.toLowerCase()
    )
    
    if (!override) return exercise
    
    if (override.overrideType === 'skipped') {
      return { ...exercise, isSkipped: true }
    }
    
    if (override.overrideType === 'replaced' && override.newExerciseName) {
      return {
        ...exercise,
        originalName: exercise.name,
        name: override.newExerciseName,
        id: override.newExerciseId || exercise.id,
        isReplaced: true,
      }
    }
    
    if (override.overrideType === 'progression_adjusted' && override.newProgression) {
      return {
        ...exercise,
        originalName: exercise.name,
        name: override.newProgression,
        isProgressionAdjusted: true,
      }
    }
    
    return exercise
  })
}

/**
 * Get override summary for adaptive engine logging
 */
export function getOverrideSummary(sessionId: string): {
  totalOverrides: number
  skipped: number
  replaced: number
  progressionAdjusted: number
  details: ExerciseOverride[]
} {
  const overrides = getSessionOverrides(sessionId)
  
  return {
    totalOverrides: overrides.length,
    skipped: overrides.filter(o => o.overrideType === 'skipped').length,
    replaced: overrides.filter(o => o.overrideType === 'replaced').length,
    progressionAdjusted: overrides.filter(o => o.overrideType === 'progression_adjusted').length,
    details: overrides,
  }
}
