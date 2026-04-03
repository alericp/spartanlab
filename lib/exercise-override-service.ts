// Exercise Override Service
// Manages session-scoped exercise replacements, skips, and progression adjustments
// Enhanced with Prerequisite Gate Engine integration

import { 
  getAllExercises, 
  getExerciseById,
  type Exercise,
  type MovementPattern,
  type DifficultyLevel,
} from './exercises'
import {
  checkExercisePrerequisite,
  buildPrerequisiteContext,
  isGatedExercise,
  getExerciseKnowledgeBubble,
  getProgressionLadder,
  type AthletePrerequisiteContext,
  type GateCheckResult,
} from './prerequisite-gate-engine'
import type { AdaptiveExercise } from './adaptive-program-builder'
import {
  getSmartSubstitutions,
  getBestSubstitution,
  mapEquipmentArray,
  type SmartSubstitution,
  type EquipmentTag,
  type SkillCarryover,
} from './exercise-family-integration'
import { getExerciseClassification } from './exercise-classification-registry'
import { 
  safeString,
  safeExerciseId,
  safeExerciseName,
  safeExerciseCategory,
  safeContains,
  safeArrayContains,
} from './utils/safe-string'

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
  // Prerequisite Gate fields
  wasGateOverride?: boolean
  gateRiskLevel?: 'moderate' | 'high' | 'very_high'
  failedPrerequisites?: string[]
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
  // Prerequisite Gate fields
  gateCheckResult?: GateCheckResult
  requiresGateOverride?: boolean
  knowledgeBubble?: string
}

export interface ProgressionOption {
  id: string
  name: string
  direction: 'easier' | 'harder'
  difficultyLevel: DifficultyLevel
  // [EXECUTION-TRUTH-FIX] Optional description for fallback options
  description?: string
  isFallback?: boolean
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
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const exerciseName = safeExerciseName(exercise)
  const exerciseCategory = safeExerciseCategory(exercise)
  
  // Early return if exercise has no valid identifiers
  if (!exerciseName && !exerciseCategory) {
    console.warn('[exercise-override-service] Skipping malformed exercise with no name/category')
    return []
  }
  
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
    // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
    if (safeExerciseName(ex) === exerciseName) continue
    
    // Check movement pattern match
    const patternMatch = targetPatterns.includes(ex.movementPattern)
    if (!patternMatch) continue
    
    // Check equipment compatibility
    const equipmentMatch = ex.equipment.some(eq => 
      availableEquipment.includes(eq) || eq === 'floor'
    )
    if (!equipmentMatch) continue
    
    // Determine if this is a recommended replacement
    // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
    const isRecommended = ex.category === exercise.category || 
      safeArrayContains(ex.transferTo, exercise.name)
    
    // Determine reason
    let reason = 'Similar movement pattern'
    if (ex.alternatives?.includes(exercise.id || '')) {
      reason = 'Direct alternative'
    } else if (safeArrayContains(ex.transferTo, exercise.name)) {
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
 * Get intelligent replacement options using the Movement Family Registry
 * This is the enhanced version that preserves training intent and skill carryover
 */
export function getIntelligentReplacements(
  exercise: AdaptiveExercise,
  availableEquipment: string[] = ['pull_bar', 'dip_bars', 'floor', 'bands'],
  targetSkill?: SkillCarryover
): ReplacementOption[] {
  // Try to find classification for this exercise
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const exerciseKey = exercise.id || safeExerciseName(exercise).replace(/\s+/g, '_')
  const classification = getExerciseClassification(exerciseKey || 'unknown')
  
  if (classification) {
    // Use the smart substitution system
    const equipmentTags = mapEquipmentArray(availableEquipment)
    const smartSubs = getSmartSubstitutions(classification.id, equipmentTags, targetSkill)
    
    return smartSubs.map(sub => ({
      id: sub.substitutionId,
      name: sub.substitutionName,
      category: classification.primaryFamily,
      difficulty: getExerciseClassification(sub.substitutionId)?.difficulty || 'intermediate',
      isRecommended: sub.familyPreserved && sub.intentPreserved,
      reason: sub.reason,
    })).slice(0, 10)
  }
  
  // Fall back to original logic if no classification found
  return getReplacementOptions(exercise, availableEquipment)
}

/**
 * Get progression options (easier/harder) for an exercise
 */
export function getProgressionOptions(exercise: AdaptiveExercise): ProgressionOption[] {
  const allExercises = getAllExercises()
  const options: ProgressionOption[] = []
  
  // Find the exercise in the pool
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const poolExercise = allExercises.find(ex => 
    safeExerciseName(ex) === safeExerciseName(exercise) ||
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
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  if (options.length === 0) {
    const name = safeExerciseName(exercise)
    
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
  
  // [EXECUTION-TRUTH-FIX] If still no options, add category-specific adjustment fallbacks
  // This ensures the progression sheet is never empty for adjustable exercises
  if (options.length === 0) {
    const category = (exercise.category ?? '').toLowerCase()
    const name = (exercise.name ?? '').toLowerCase()
    
    // Add fallback adjustment options based on category
    const fallbackOptions = getCategoryFallbackProgressions(name, category)
    options.push(...fallbackOptions)
  }
  
  // Sort: easier first, then harder
  options.sort((a, b) => {
    if (a.direction === 'easier' && b.direction === 'harder') return -1
    if (a.direction === 'harder' && b.direction === 'easier') return 1
    return 0
  })
  
  return options
}

/**
 * [EXECUTION-TRUTH-FIX] Get category-specific fallback progressions
 * These ensure the progression sheet is never empty for adjustable exercises
 */
function getCategoryFallbackProgressions(name: string, category: string): ProgressionOption[] {
  const fallbacks: ProgressionOption[] = []
  const timestamp = Date.now()
  
  // Core exercises (hanging leg raises, hollow holds, planks, etc.)
  if (category === 'core' || name.includes('leg raise') || name.includes('hollow') || name.includes('plank') || name.includes('dragon')) {
    fallbacks.push(
      { id: `fallback-shorter-hold-${timestamp}`, name: 'Shorter Hold / Fewer Reps', direction: 'easier', difficultyLevel: 'beginner', description: 'Reduce target by ~25% to build quality', isFallback: true },
      { id: `fallback-tucked-${timestamp}`, name: 'Tucked Variation', direction: 'easier', difficultyLevel: 'beginner', description: 'Use tucked legs to reduce lever arm', isFallback: true },
      { id: `fallback-cluster-${timestamp}`, name: 'Clustered Sets', direction: 'easier', difficultyLevel: 'beginner', description: 'Split hold into mini-clusters with brief rest', isFallback: true },
      { id: `fallback-longer-hold-${timestamp}`, name: 'Longer Hold / More Reps', direction: 'harder', difficultyLevel: 'advanced', description: 'Increase target by ~25%', isFallback: true },
    )
  }
  
  // Skill exercises (levers, planches, l-sits, etc.)
  else if (category === 'skill' || name.includes('lever') || name.includes('planche') || name.includes('l-sit') || name.includes('handstand')) {
    fallbacks.push(
      { id: `fallback-band-assist-${timestamp}`, name: 'Band-Assisted', direction: 'easier', difficultyLevel: 'beginner', description: 'Add band support for quality reps', isFallback: true },
      { id: `fallback-shorter-${timestamp}`, name: 'Shorter Hold Target', direction: 'easier', difficultyLevel: 'beginner', description: 'Reduce hold duration by ~25%', isFallback: true },
      { id: `fallback-tuck-${timestamp}`, name: 'More Tucked Position', direction: 'easier', difficultyLevel: 'beginner', description: 'Regress to tighter tuck for stability', isFallback: true },
      { id: `fallback-longer-${timestamp}`, name: 'Longer Hold Target', direction: 'harder', difficultyLevel: 'advanced', description: 'Increase hold duration', isFallback: true },
      { id: `fallback-less-tuck-${timestamp}`, name: 'Less Tucked / More Open', direction: 'harder', difficultyLevel: 'advanced', description: 'Progress to more open position', isFallback: true },
    )
  }
  
  // Pull exercises
  else if (category === 'pull' || name.includes('pull') || name.includes('row') || name.includes('chin')) {
    fallbacks.push(
      { id: `fallback-band-pull-${timestamp}`, name: 'Band-Assisted', direction: 'easier', difficultyLevel: 'beginner', description: 'Add band support for full ROM reps', isFallback: true },
      { id: `fallback-partial-pull-${timestamp}`, name: 'Partial Range of Motion', direction: 'easier', difficultyLevel: 'beginner', description: 'Use half reps to build strength', isFallback: true },
      { id: `fallback-eccentric-${timestamp}`, name: 'Eccentric Focus (Slow Negatives)', direction: 'easier', difficultyLevel: 'beginner', description: 'Focus on 3-5s lowering phase', isFallback: true },
      { id: `fallback-weighted-pull-${timestamp}`, name: 'Add Weight', direction: 'harder', difficultyLevel: 'advanced', description: 'Add external load', isFallback: true },
      { id: `fallback-wider-pull-${timestamp}`, name: 'Wider Grip / Harder Variation', direction: 'harder', difficultyLevel: 'advanced', description: 'Progress to more challenging variation', isFallback: true },
    )
  }
  
  // Push exercises
  else if (category === 'push' || name.includes('push') || name.includes('dip') || name.includes('press')) {
    fallbacks.push(
      { id: `fallback-band-push-${timestamp}`, name: 'Band-Assisted', direction: 'easier', difficultyLevel: 'beginner', description: 'Add band support for full ROM reps', isFallback: true },
      { id: `fallback-incline-${timestamp}`, name: 'Incline / Elevated', direction: 'easier', difficultyLevel: 'beginner', description: 'Use elevation to reduce load', isFallback: true },
      { id: `fallback-partial-push-${timestamp}`, name: 'Partial Range of Motion', direction: 'easier', difficultyLevel: 'beginner', description: 'Use partial range to build strength', isFallback: true },
      { id: `fallback-weighted-push-${timestamp}`, name: 'Add Weight', direction: 'harder', difficultyLevel: 'advanced', description: 'Add external load', isFallback: true },
      { id: `fallback-decline-${timestamp}`, name: 'Decline / More Challenging Angle', direction: 'harder', difficultyLevel: 'advanced', description: 'Progress to harder angle', isFallback: true },
    )
  }
  
  // Default fallbacks for any other category
  else {
    fallbacks.push(
      { id: `fallback-reduce-intensity-${timestamp}`, name: 'Reduce Intensity', direction: 'easier', difficultyLevel: 'beginner', description: 'Lower difficulty by ~25%', isFallback: true },
      { id: `fallback-reduce-volume-${timestamp}`, name: 'Reduce Volume', direction: 'easier', difficultyLevel: 'beginner', description: 'Do fewer reps or sets', isFallback: true },
      { id: `fallback-increase-intensity-${timestamp}`, name: 'Increase Intensity', direction: 'harder', difficultyLevel: 'advanced', description: 'Increase difficulty by ~25%', isFallback: true },
    )
  }
  
  return fallbacks
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
  
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  return exercises.map(exercise => {
    const override = overrides.find(o => 
      o.originalExerciseId === exercise.id || 
      safeString(o.originalExerciseName) === safeExerciseName(exercise)
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
// =============================================================================
// PREREQUISITE GATE INTEGRATION
// =============================================================================

/**
 * Get replacement options with prerequisite gate checks
 * Marks options that require gate override
 */
export function getGatedReplacementOptions(
  exercise: AdaptiveExercise,
  availableEquipment: string[] = ['pull_bar', 'dip_bars', 'floor', 'bands'],
  prerequisiteContext?: AthletePrerequisiteContext
): ReplacementOption[] {
  // Get base replacement options
  const baseOptions = getReplacementOptions(exercise, availableEquipment)
  
  // Build context if not provided
  const context = prerequisiteContext || buildPrerequisiteContext({
    experienceLevel: 'intermediate', // Default
  })
  
  // Enhance with gate check results
  return baseOptions.map(option => {
    const gateResult = checkExercisePrerequisite(option.id, context)
    const knowledgeBubble = getExerciseKnowledgeBubble(option.id)
    
    return {
      ...option,
      gateCheckResult: gateResult,
      requiresGateOverride: !gateResult.allowed,
      knowledgeBubble: knowledgeBubble || undefined,
      // Demote non-allowed exercises in recommendation
      isRecommended: option.isRecommended && gateResult.allowed,
    }
  }).sort((a, b) => {
    // Sort: allowed first, then recommended, then by original order
    if (a.gateCheckResult?.allowed && !b.gateCheckResult?.allowed) return -1
    if (!a.gateCheckResult?.allowed && b.gateCheckResult?.allowed) return 1
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    return 0
  })
}

/**
 * Check if a replacement exercise requires gate override
 */
export function requiresGateOverride(
  exerciseId: string,
  prerequisiteContext?: AthletePrerequisiteContext
): GateCheckResult {
  const context = prerequisiteContext || buildPrerequisiteContext({
    experienceLevel: 'intermediate',
  })
  
  return checkExercisePrerequisite(exerciseId, context)
}

/**
 * Add an override with gate tracking
 */
export function addGatedOverride(
  sessionId: string,
  override: ExerciseOverride,
  gateResult?: GateCheckResult
): void {
  const enhancedOverride: ExerciseOverride = {
    ...override,
    wasGateOverride: gateResult ? !gateResult.allowed : false,
    gateRiskLevel: gateResult?.overrideRiskLevel,
    failedPrerequisites: gateResult?.failedPrerequisites?.map(p => p.description),
  }
  
  addOverride(sessionId, enhancedOverride)
}

/**
 * Get safe progression ladder for an exercise
 */
export function getExerciseProgressionLadder(exerciseId: string): string[] | null {
  return getProgressionLadder(exerciseId)
}

/**
 * Check if exercise is gated
 */
export function checkIsGatedExercise(exerciseId: string): boolean {
  return isGatedExercise(exerciseId)
}

export function getOverrideSummary(sessionId: string): {
  totalOverrides: number
  skipped: number
  replaced: number
  progressionAdjusted: number
  gateOverrides: number
  highRiskGateOverrides: number
  details: ExerciseOverride[]
} {
  const overrides = getSessionOverrides(sessionId)
  
  return {
    totalOverrides: overrides.length,
    skipped: overrides.filter(o => o.overrideType === 'skipped').length,
    replaced: overrides.filter(o => o.overrideType === 'replaced').length,
    progressionAdjusted: overrides.filter(o => o.overrideType === 'progression_adjusted').length,
    gateOverrides: overrides.filter(o => o.wasGateOverride).length,
    highRiskGateOverrides: overrides.filter(o => 
      o.wasGateOverride && (o.gateRiskLevel === 'high' || o.gateRiskLevel === 'very_high')
    ).length,
    details: overrides,
  }
}
