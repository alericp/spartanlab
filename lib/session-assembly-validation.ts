/**
 * SESSION ASSEMBLY VALIDATION
 * 
 * =============================================================================
 * REGRESSION GUARD: WARM-UP / SESSION ASSEMBLY QUALITY
 * =============================================================================
 * 
 * This module provides validation and cleanup passes for generated sessions.
 * It ensures:
 * - No accidental duplicate exercises (OBJECTIVE 8)
 * - Sensible exercise ordering
 * - Proper skill-first placement
 * - Core/compression logical placement
 * - Progression-aware warm-up logic
 * 
 * DO NOT REMOVE OR WEAKEN:
 * - dedupeExerciseArray() - prevents duplicate warm-up items
 * - checkCrossSectionDuplicates() - prevents warmup/main overlap
 * - validateAndFixOrdering() - ensures skill-first and logical placement
 * 
 * If warm-up duplicates start appearing, CHECK THIS FILE FIRST.
 * 
 * [trust-polish] ISSUE A: Internal cleanup messages are suppressed from user-facing
 * surfaces - deduplication is expected backend behavior, not a user-relevant "fix".
 * See validateSession() for suppressed messages.
 * 
 * TASK 5: Dedupe + Order Validation
 */

import type { AdaptiveExercise } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  fixesApplied: string[]
}

export interface ValidationIssue {
  type: 'duplicate' | 'ordering' | 'overload' | 'missing'
  severity: 'error' | 'warning' | 'info'
  description: string
  exerciseId?: string
  exerciseName?: string
}

export interface ValidatedSession {
  exercises: AdaptiveExercise[]
  warmup: AdaptiveExercise[]
  cooldown: AdaptiveExercise[]
  validation: ValidationResult
}

// =============================================================================
// EXERCISE ORDERING PRIORITIES
// =============================================================================

/**
 * Exercise category ordering for main work.
 * Lower number = earlier in session.
 */
const CATEGORY_ORDER: Record<string, number> = {
  'skill': 1,           // Skills first (highest neural demand)
  'skill_strength': 2,  // Skill-strength hybrids
  'strength': 3,        // Compound strength
  'push': 4,
  'pull': 4,
  'accessory': 5,       // Accessories after main work
  'core': 6,            // Core toward end
  'compression': 6,     // Compression with core
  'mobility': 7,        // Mobility last in main work
}

/**
 * Get sort priority for an exercise based on category and skill type.
 */
function getExerciseSortPriority(exercise: AdaptiveExercise): number {
  const basePriority = CATEGORY_ORDER[exercise.category] || 5
  
  // Boost priority for skill-specific exercises
  const name = exercise.name.toLowerCase()
  if (name.includes('planche') || name.includes('front lever') || 
      name.includes('muscle up') || name.includes('hspu')) {
    return Math.min(basePriority, 1)
  }
  
  // Boost for weighted compound movements
  if (name.includes('weighted') && (name.includes('pull') || name.includes('dip'))) {
    return Math.min(basePriority, 2)
  }
  
  return basePriority
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Normalize exercise name for comparison.
 * Handles variations like "Light Planche Leans" vs "Planche Lean Activation".
 */
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/light|activation|warmup|prep|hold|s$/g, '')
    .trim()
}

/**
 * Check if two exercises are effectively the same.
 */
function areExercisesDuplicates(a: AdaptiveExercise, b: AdaptiveExercise): boolean {
  // Same ID is definitely a duplicate
  if (a.id === b.id) return true
  
  // Check normalized names
  const normalizedA = normalizeExerciseName(a.name)
  const normalizedB = normalizeExerciseName(b.name)
  
  // Exact match after normalization
  if (normalizedA === normalizedB) return true
  
  // Check for common duplicates
  const duplicatePairs = [
    ['planchelean', 'plancheleanlean'],
    ['scappushup', 'scappushupspecific'],
    ['scappull', 'scappullupwarmup'],
    ['hollowbody', 'hollowbodyhold'],
    ['archbody', 'archbodyhold'],
    ['lsit', 'lightlsit'],
    ['tucklever', 'tuckfront'],
  ]
  
  for (const [patternA, patternB] of duplicatePairs) {
    if ((normalizedA.includes(patternA) && normalizedB.includes(patternB)) ||
        (normalizedA.includes(patternB) && normalizedB.includes(patternA))) {
      return true
    }
  }
  
  return false
}

/**
 * Remove duplicate exercises from an array.
 * Keeps the first occurrence.
 */
export function dedupeExerciseArray(
  exercises: AdaptiveExercise[],
  context: 'warmup' | 'main' | 'cooldown'
): { deduped: AdaptiveExercise[]; removed: string[] } {
  const seen = new Set<string>()
  const removed: string[] = []
  
  const deduped = exercises.filter((exercise, index) => {
    // Check against all previously seen exercises
    for (let i = 0; i < index; i++) {
      if (areExercisesDuplicates(exercise, exercises[i])) {
        removed.push(exercise.name)
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[session-validation] Dedupe (${context}): Removed "${exercise.name}" (duplicate of "${exercises[i].name}")`)
        }
        return false
      }
    }
    
    // Check by normalized name
    const normalizedName = normalizeExerciseName(exercise.name)
    if (seen.has(normalizedName)) {
      removed.push(exercise.name)
      return false
    }
    
    seen.add(normalizedName)
    return true
  })
  
  return { deduped, removed }
}

// =============================================================================
// ORDERING VALIDATION
// =============================================================================

/**
 * Validate and fix exercise ordering.
 * Ensures skill work comes first, accessories last, etc.
 */
export function validateAndFixOrdering(
  exercises: AdaptiveExercise[],
  isSkillFirstDay: boolean
): { ordered: AdaptiveExercise[]; wasReordered: boolean; changes: string[] } {
  const changes: string[] = []
  
  // Create a copy with sort priorities
  const withPriorities = exercises.map((ex, originalIndex) => ({
    exercise: ex,
    priority: getExerciseSortPriority(ex),
    originalIndex,
  }))
  
  // Sort by priority (stable sort to preserve relative order within same priority)
  withPriorities.sort((a, b) => {
    // Primary sort by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    // Secondary sort preserves original order
    return a.originalIndex - b.originalIndex
  })
  
  // Check if order changed
  const wasReordered = withPriorities.some((item, index) => item.originalIndex !== index)
  
  if (wasReordered && process.env.NODE_ENV !== 'production') {
    const reorderDescription = withPriorities
      .filter((item, index) => item.originalIndex !== index)
      .map(item => item.exercise.name)
      .slice(0, 3)
      .join(', ')
    changes.push(`Reordered exercises for optimal sequencing: ${reorderDescription}`)
    console.log('[session-validation] Reordered exercises:', changes[0])
  }
  
  return {
    ordered: withPriorities.map(item => item.exercise),
    wasReordered,
    changes,
  }
}

// =============================================================================
// CROSS-SECTION DUPLICATE CHECK
// =============================================================================

/**
 * Check for duplicates between warmup and main exercises.
 * Warm-up activation exercises should not repeat in main work.
 */
export function checkCrossSectionDuplicates(
  warmup: AdaptiveExercise[],
  main: AdaptiveExercise[]
): { issues: ValidationIssue[]; mainFiltered: AdaptiveExercise[] } {
  const issues: ValidationIssue[] = []
  
  const mainFiltered = main.filter(mainEx => {
    const warmupDuplicate = warmup.find(warmupEx => areExercisesDuplicates(mainEx, warmupEx))
    
    if (warmupDuplicate) {
      // Only flag if it's not intentional (same category suggests intent)
      if (warmupDuplicate.category !== mainEx.category) {
        issues.push({
          type: 'duplicate',
          severity: 'warning',
          description: `"${mainEx.name}" appears in both warmup and main work`,
          exerciseId: mainEx.id,
          exerciseName: mainEx.name,
        })
        return false // Remove from main
      }
    }
    
    return true
  })
  
  return { issues, mainFiltered }
}

// =============================================================================
// FULL SESSION VALIDATION
// =============================================================================

/**
 * Validate and clean up a complete session.
 * This is the main entry point for session validation.
 */
export function validateSession(
  exercises: AdaptiveExercise[],
  warmup: AdaptiveExercise[],
  cooldown: AdaptiveExercise[],
  options: {
    isSkillFirstDay?: boolean
    maxMainExercises?: number
    maxWarmupExercises?: number
  } = {}
): ValidatedSession {
  const issues: ValidationIssue[] = []
  const fixesApplied: string[] = []
  
  const {
    isSkillFirstDay = true,
    maxMainExercises = 8,
    maxWarmupExercises = 8,
  } = options
  
  // Step 1: Dedupe warmup
  const warmupResult = dedupeExerciseArray(warmup, 'warmup')
  // [trust-polish] ISSUE A: Suppress internal duplicate removal messages
  // Deduplication is expected backend behavior, not user-relevant
  if (warmupResult.removed.length > 0 && process.env.NODE_ENV !== 'production') {
    console.log('[session-validation] Deduplicated warmup:', {
      removed: warmupResult.removed.length,
      exerciseNames: warmupResult.removed,
    })
  }
  
  // Step 2: Dedupe main exercises
  const mainResult = dedupeExerciseArray(exercises, 'main')
  // [trust-polish] ISSUE A: Suppress internal duplicate removal messages
  if (mainResult.removed.length > 0 && process.env.NODE_ENV !== 'production') {
    console.log('[session-validation] Deduplicated main:', {
      removed: mainResult.removed.length,
      exerciseNames: mainResult.removed,
    })
  }
  
  // Step 3: Dedupe cooldown
  const cooldownResult = dedupeExerciseArray(cooldown, 'cooldown')
  // [trust-polish] ISSUE A: Suppress internal duplicate removal messages
  if (cooldownResult.removed.length > 0 && process.env.NODE_ENV !== 'production') {
    console.log('[session-validation] Deduplicated cooldown:', {
      removed: cooldownResult.removed.length,
      exerciseNames: cooldownResult.removed,
    })
  }
  
  // Step 4: Check cross-section duplicates (warmup vs main)
  const crossCheck = checkCrossSectionDuplicates(warmupResult.deduped, mainResult.deduped)
  issues.push(...crossCheck.issues)
  
  // Step 5: Validate and fix main exercise ordering
  const orderResult = validateAndFixOrdering(crossCheck.mainFiltered, isSkillFirstDay)
  if (orderResult.wasReordered) {
    fixesApplied.push(...orderResult.changes)
  }
  
  // Step 6: Check for overload
  if (orderResult.ordered.length > maxMainExercises) {
    issues.push({
      type: 'overload',
      severity: 'warning',
      description: `Session has ${orderResult.ordered.length} exercises (max recommended: ${maxMainExercises})`,
    })
  }
  
  if (warmupResult.deduped.length > maxWarmupExercises) {
    issues.push({
      type: 'overload',
      severity: 'info',
      description: `Warmup has ${warmupResult.deduped.length} exercises (max recommended: ${maxWarmupExercises})`,
    })
  }
  
  // Log validation summary in dev
  if (process.env.NODE_ENV !== 'production') {
    console.log('[session-validation] Summary:', {
      warmupDeduped: warmupResult.removed.length,
      mainDeduped: mainResult.removed.length,
      crossSectionFiltered: crossCheck.issues.length,
      wasReordered: orderResult.wasReordered,
      finalMainCount: orderResult.ordered.length,
      issues: issues.length,
    })
  }
  
  return {
    exercises: orderResult.ordered,
    warmup: warmupResult.deduped,
    cooldown: cooldownResult.deduped,
    validation: {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      fixesApplied,
    },
  }
}

// =============================================================================
// WARMUP-SPECIFIC VALIDATION
// =============================================================================

/**
 * Validate warmup specifically for skill-first sessions.
 * Ensures progression ramp is intact.
 */
export function validateWarmupForSkill(
  warmup: AdaptiveExercise[],
  firstSkillType: 'planche' | 'front_lever' | 'hspu' | 'muscle_up' | 'handstand' | 'l_sit' | 'other'
): { isValid: boolean; missingPrereqs: string[] } {
  const missingPrereqs: string[] = []
  
  const warmupNames = warmup.map(e => normalizeExerciseName(e.name))
  
  // Check skill-specific prerequisites
  if (firstSkillType === 'planche') {
    if (!warmupNames.some(n => n.includes('wrist'))) {
      missingPrereqs.push('Wrist prep recommended before planche work')
    }
    if (!warmupNames.some(n => n.includes('scap') && n.includes('push'))) {
      missingPrereqs.push('Scap push-ups recommended before planche')
    }
  }
  
  if (firstSkillType === 'front_lever') {
    if (!warmupNames.some(n => n.includes('lat') || n.includes('hang'))) {
      missingPrereqs.push('Lat stretch or dead hang recommended before front lever')
    }
    if (!warmupNames.some(n => n.includes('scap') && n.includes('pull'))) {
      missingPrereqs.push('Scap pull-ups recommended before front lever')
    }
  }
  
  if (firstSkillType === 'hspu' || firstSkillType === 'handstand') {
    if (!warmupNames.some(n => n.includes('wrist'))) {
      missingPrereqs.push('Wrist prep recommended before handstand/HSPU work')
    }
  }
  
  return {
    isValid: missingPrereqs.length === 0,
    missingPrereqs,
  }
}
