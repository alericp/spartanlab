// Session Compression Engine
// Intelligently compresses or expands sessions based on available time

import type { ExerciseSelection, SelectedExercise } from './program-exercise-selector'

export interface CompressionResult {
  original: ExerciseSelection
  compressed: ExerciseSelection
  compressionApplied: boolean
  compressionLevel: 'none' | 'light' | 'moderate' | 'heavy'
  removedExercises: string[]
  adjustedSets: string[]
  explanation: string
}

interface CompressionInputs {
  selection: ExerciseSelection
  targetMinutes: number
  originalMinutes: number
  preserveSkillWork: boolean
}

// =============================================================================
// MAIN COMPRESSION FUNCTION
// =============================================================================

export function compressSession(inputs: CompressionInputs): CompressionResult {
  const { selection, targetMinutes, originalMinutes, preserveSkillWork } = inputs
  
  // No compression needed
  if (targetMinutes >= originalMinutes) {
    return {
      original: selection,
      compressed: selection,
      compressionApplied: false,
      compressionLevel: 'none',
      removedExercises: [],
      adjustedSets: [],
      explanation: 'Session fits within available time.',
    }
  }
  
  // Calculate compression ratio
  const ratio = targetMinutes / originalMinutes
  
  let compressionLevel: 'light' | 'moderate' | 'heavy'
  if (ratio >= 0.75) {
    compressionLevel = 'light'
  } else if (ratio >= 0.5) {
    compressionLevel = 'moderate'
  } else {
    compressionLevel = 'heavy'
  }
  
  // Create compressed version
  const compressed = compressSelection(selection, compressionLevel, preserveSkillWork)
  
  // Track what was removed/adjusted
  const removedExercises = findRemovedExercises(selection.main, compressed.main)
  const adjustedSets = findAdjustedSets(selection.main, compressed.main)
  
  const explanation = generateCompressionExplanation(
    compressionLevel,
    removedExercises,
    adjustedSets
  )
  
  return {
    original: selection,
    compressed,
    compressionApplied: true,
    compressionLevel,
    removedExercises,
    adjustedSets,
    explanation,
  }
}

// =============================================================================
// COMPRESSION LOGIC
// =============================================================================

function compressSelection(
  selection: ExerciseSelection,
  level: 'light' | 'moderate' | 'heavy',
  preserveSkillWork: boolean
): ExerciseSelection {
  return {
    warmup: compressWarmup(selection.warmup, level),
    main: compressMain(selection.main, level, preserveSkillWork),
    cooldown: compressCooldown(selection.cooldown, level),
    totalEstimatedTime: 0, // Recalculated after compression
  }
}

function compressWarmup(
  warmup: SelectedExercise[],
  level: 'light' | 'moderate' | 'heavy'
): SelectedExercise[] {
  if (level === 'light') {
    // Keep all warmup, maybe reduce sets
    return warmup.map(e => ({
      ...e,
      sets: Math.max(1, e.sets),
    }))
  }
  
  if (level === 'moderate') {
    // Keep essential warmup only (first 3)
    return warmup.slice(0, 3).map(e => ({
      ...e,
      sets: 1,
    }))
  }
  
  // Heavy compression - minimal warmup
  return warmup.slice(0, 2).map(e => ({
    ...e,
    sets: 1,
    repsOrTime: reduceRepsOrTime(e.repsOrTime),
  }))
}

function compressMain(
  main: SelectedExercise[],
  level: 'light' | 'moderate' | 'heavy',
  preserveSkillWork: boolean
): SelectedExercise[] {
  // Sort by priority: skill > strength > accessory > core
  const prioritized = [...main].sort((a, b) => {
    const priorityOrder = { skill: 0, strength: 1, accessory: 2, core: 3 }
    return (priorityOrder[a.exercise.category] ?? 4) - (priorityOrder[b.exercise.category] ?? 4)
  })
  
  if (level === 'light') {
    // Keep all exercises, reduce sets on lower priority ones
    return prioritized.map((e, idx) => {
      if (idx < 2) return e // Keep top 2 unchanged
      return {
        ...e,
        sets: Math.max(2, e.sets - 1),
      }
    })
  }
  
  if (level === 'moderate') {
    // Keep top 4-5 exercises, reduce sets
    const kept = prioritized.slice(0, 5)
    return kept.map((e, idx) => {
      if (preserveSkillWork && e.exercise.category === 'skill') return e
      if (idx < 2) return { ...e, sets: Math.max(3, e.sets) }
      return { ...e, sets: Math.max(2, e.sets - 1) }
    })
  }
  
  // Heavy compression - essential only
  const essential = prioritized.filter(e => 
    e.exercise.category === 'skill' || 
    e.exercise.category === 'strength'
  ).slice(0, 3)
  
  // Always include at least one core movement if we have room
  if (essential.length < 4) {
    const coreExercise = prioritized.find(e => e.exercise.category === 'core')
    if (coreExercise) {
      essential.push({
        ...coreExercise,
        sets: 2,
      })
    }
  }
  
  return essential.map(e => ({
    ...e,
    sets: Math.max(2, e.sets - 1),
  }))
}

function compressCooldown(
  cooldown: SelectedExercise[],
  level: 'light' | 'moderate' | 'heavy'
): SelectedExercise[] {
  if (level === 'light') {
    return cooldown
  }
  
  if (level === 'moderate') {
    return cooldown.slice(0, 2)
  }
  
  // Heavy - minimal stretch
  return cooldown.slice(0, 1)
}

// =============================================================================
// EXPANSION (BONUS TIME)
// =============================================================================

export interface ExpansionResult {
  expanded: ExerciseSelection
  addedExercises: string[]
  addedSets: string[]
  explanation: string
}

export function expandSession(
  selection: ExerciseSelection,
  extraMinutes: number
): ExpansionResult {
  const addedExercises: string[] = []
  const addedSets: string[] = []
  
  // Clone selection
  const expanded: ExerciseSelection = {
    warmup: selection.warmup.map(e => ({ ...e })),
    main: selection.main.map(e => ({ ...e })),
    cooldown: selection.cooldown.map(e => ({ ...e })),
    totalEstimatedTime: selection.totalEstimatedTime + extraMinutes,
  }
  
  // Add sets to key exercises (skill and strength)
  if (extraMinutes >= 5) {
    expanded.main = expanded.main.map(e => {
      if (e.exercise.category === 'skill' || e.exercise.category === 'strength') {
        if (e.sets < 5) {
          addedSets.push(e.exercise.name)
          return { ...e, sets: e.sets + 1 }
        }
      }
      return e
    })
  }
  
  // Could add accessory work if significant extra time
  if (extraMinutes >= 15) {
    // Add to warmup
    expanded.warmup = expanded.warmup.map(e => ({
      ...e,
      sets: Math.min(3, e.sets + 1),
    }))
    
    // Add to cooldown
    expanded.cooldown = expanded.cooldown.map(e => ({
      ...e,
      repsOrTime: expandRepsOrTime(e.repsOrTime),
    }))
  }
  
  const explanation = addedSets.length > 0
    ? `Added volume to key exercises: ${addedSets.join(', ')}.`
    : 'Extra time available for additional rest between sets.'
  
  return {
    expanded,
    addedExercises,
    addedSets,
    explanation,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function reduceRepsOrTime(repsOrTime: string): string {
  // Reduce time-based (e.g., "30s" -> "20s")
  const timeMatch = repsOrTime.match(/(\d+)s/)
  if (timeMatch) {
    const reduced = Math.max(10, parseInt(timeMatch[1]) - 10)
    return `${reduced}s`
  }
  
  // Reduce rep ranges (e.g., "10-12" -> "8-10")
  const rangeMatch = repsOrTime.match(/(\d+)-(\d+)/)
  if (rangeMatch) {
    const low = Math.max(5, parseInt(rangeMatch[1]) - 2)
    const high = Math.max(8, parseInt(rangeMatch[2]) - 2)
    return `${low}-${high}`
  }
  
  // Single number
  const singleMatch = repsOrTime.match(/^(\d+)$/)
  if (singleMatch) {
    return String(Math.max(5, parseInt(singleMatch[1]) - 2))
  }
  
  return repsOrTime
}

function expandRepsOrTime(repsOrTime: string): string {
  // Expand time-based
  const timeMatch = repsOrTime.match(/(\d+)s/)
  if (timeMatch) {
    const expanded = parseInt(timeMatch[1]) + 15
    return `${expanded}s`
  }
  
  return repsOrTime
}

function findRemovedExercises(
  original: SelectedExercise[],
  compressed: SelectedExercise[]
): string[] {
  const compressedIds = new Set(compressed.map(e => e.exercise.id))
  return original
    .filter(e => !compressedIds.has(e.exercise.id))
    .map(e => e.exercise.name)
}

function findAdjustedSets(
  original: SelectedExercise[],
  compressed: SelectedExercise[]
): string[] {
  const adjusted: string[] = []
  
  compressed.forEach(comp => {
    const orig = original.find(o => o.exercise.id === comp.exercise.id)
    if (orig && orig.sets !== comp.sets) {
      adjusted.push(`${comp.exercise.name}: ${orig.sets} → ${comp.sets} sets`)
    }
  })
  
  return adjusted
}

function generateCompressionExplanation(
  level: 'light' | 'moderate' | 'heavy',
  removed: string[],
  adjusted: string[]
): string {
  // [trust-polish] ISSUE A: Session compression mechanics are internal optimizations
  // Suppress detailed removal lists - users just need to know their session was adjusted
  const parts: string[] = []
  
  if (level === 'light') {
    parts.push('Session adjusted to fit your available time.')
  } else if (level === 'moderate') {
    parts.push('Session adjusted to focus on essential movements.')
  } else {
    parts.push('Session focused on core training.')
  }
  
  // Don't list removed exercises - that's implementation detail
  
  return parts.join(' ')
}

// =============================================================================
// TIME-BASED SESSION VARIANTS
// =============================================================================

export interface SessionVariant {
  duration: number
  label: string
  selection: ExerciseSelection
  compressionLevel: 'none' | 'light' | 'moderate' | 'heavy'
}

export function generateSessionVariants(
  fullSelection: ExerciseSelection,
  originalMinutes: number
): SessionVariant[] {
  // ==========================================================================
  // [TASK 1-5] SESSION VARIANT GENERATION WITH TRUTH GUARDS
  // - originalMinutes should now be the ACTUAL canonical full session duration
  // - Only generate variants that are meaningfully different from full
  // - Enforce monotonicity: Full >= 45 >= 30
  // ==========================================================================
  
  // STEP C: Validate inputs to prevent downstream failures
  // Ensure originalMinutes is a valid number
  let safeOriginalMinutes = originalMinutes
  if (typeof originalMinutes !== 'number' || !Number.isFinite(originalMinutes) || originalMinutes <= 0) {
    console.warn('[session-variants] Invalid originalMinutes, using default:', { originalMinutes, usingDefault: 45 })
    safeOriginalMinutes = 45
  }
  
  // Ensure selection has required structure
  const safeSelection: ExerciseSelection = {
    warmup: Array.isArray(fullSelection?.warmup) ? fullSelection.warmup : [],
    main: Array.isArray(fullSelection?.main) ? fullSelection.main : [],
    cooldown: Array.isArray(fullSelection?.cooldown) ? fullSelection.cooldown : [],
    totalEstimatedTime: Number.isFinite(fullSelection?.totalEstimatedTime) ? fullSelection.totalEstimatedTime : safeOriginalMinutes,
  }
  
  const fullExerciseCount = safeSelection.main.length
  
  const variants: SessionVariant[] = [
    {
      duration: safeOriginalMinutes,
      label: 'Full Session',
      selection: safeSelection,
      compressionLevel: 'none',
    },
  ]
  
  let variant45: SessionVariant | null = null
  let variant30: SessionVariant | null = null
  
  // [TASK 5] Only generate 45 min variant if full session is meaningfully longer than 45
  // Adding 5-minute buffer to prevent near-identical variants
  const MEANINGFUL_DIFFERENCE_THRESHOLD = 5
  
  if (safeOriginalMinutes > 45 + MEANINGFUL_DIFFERENCE_THRESHOLD) {
    try {
      const compressed45 = compressSession({
        selection: safeSelection,
        targetMinutes: 45,
        originalMinutes: safeOriginalMinutes,
        preserveSkillWork: true,
      })
      
      // [TASK 4] Monotonicity guard - 45 min must not be fuller than Full
      const count45 = compressed45.compressed.main.length
      if (count45 <= fullExerciseCount) {
        variant45 = {
          duration: 45,
          label: '45 Min',
          selection: compressed45.compressed,
          compressionLevel: compressed45.compressionLevel,
        }
        variants.push(variant45)
      } else {
        console.warn('[session-variants] Skipping 45min variant - would be fuller than full session', {
          fullCount: fullExerciseCount,
          variant45Count: count45,
        })
      }
    } catch (err) {
      console.warn('[session-variants] Failed to generate 45min variant:', err instanceof Error ? err.message : String(err))
    }
  } else if (safeOriginalMinutes > 45) {
    // [TASK 5] Session is between 45-50 min - don't show misleading 45 min button
    console.log('[session-variants] Skipping 45min variant - full session already near 45 min', {
      fullDuration: safeOriginalMinutes,
      threshold: 45 + MEANINGFUL_DIFFERENCE_THRESHOLD,
    })
  }
  
  // [TASK 5] Only generate 30 min variant if full session is meaningfully longer than 30
  if (safeOriginalMinutes > 30 + MEANINGFUL_DIFFERENCE_THRESHOLD) {
    try {
      const compressed30 = compressSession({
        selection: safeSelection,
        targetMinutes: 30,
        originalMinutes: safeOriginalMinutes,
        preserveSkillWork: true,
      })
      
      const count30 = compressed30.compressed.main.length
      const count45ForComparison = variant45?.selection.main.length ?? fullExerciseCount
      
      // [TASK 4] Monotonicity guard - 30 min must not be fuller than 45 min (or Full if no 45)
      if (count30 <= count45ForComparison && count30 <= fullExerciseCount) {
        variant30 = {
          duration: 30,
          label: '30 Min',
          selection: compressed30.compressed,
          compressionLevel: compressed30.compressionLevel,
        }
        variants.push(variant30)
      } else {
        console.warn('[session-variants] Skipping 30min variant - would be fuller than 45/full', {
          fullCount: fullExerciseCount,
          count45: count45ForComparison,
          count30,
        })
      }
    } catch (err) {
      console.warn('[session-variants] Failed to generate 30min variant:', err instanceof Error ? err.message : String(err))
    }
  } else if (safeOriginalMinutes > 30) {
    // [TASK 5] Session is between 30-35 min - don't show misleading 30 min button
    console.log('[session-variants] Skipping 30min variant - full session already near 30 min', {
      fullDuration: safeOriginalMinutes,
      threshold: 30 + MEANINGFUL_DIFFERENCE_THRESHOLD,
    })
  }
  
  // ==========================================================================
  // [TASK 4] VARIANT MONOTONICITY AUDIT
  // ==========================================================================
  const duration45 = variant45?.duration ?? null
  const duration30 = variant30?.duration ?? null
  const count45 = variant45?.selection.main.length ?? null
  const count30 = variant30?.selection.main.length ?? null
  
  const monotonicityPassed = 
    (duration45 === null || safeOriginalMinutes >= duration45) &&
    (duration30 === null || (duration45 ?? safeOriginalMinutes) >= duration30) &&
    (count45 === null || fullExerciseCount >= count45) &&
    (count30 === null || (count45 ?? fullExerciseCount) >= count30)
  
  let violationReason = ''
  if (!monotonicityPassed) {
    if (duration45 !== null && safeOriginalMinutes < duration45) violationReason = 'full_duration_less_than_45'
    else if (duration30 !== null && (duration45 ?? safeOriginalMinutes) < duration30) violationReason = '45_duration_less_than_30'
    else if (count45 !== null && fullExerciseCount < count45) violationReason = 'full_count_less_than_45'
    else if (count30 !== null && (count45 ?? fullExerciseCount) < count30) violationReason = '45_count_less_than_30'
  }
  
  console.log('[variant-monotonicity-audit]', {
    fullDuration: safeOriginalMinutes,
    duration45,
    duration30,
    fullExerciseCount,
    count45,
    count30,
    monotonicityPassed,
    violationReason: violationReason || null,
    variantsGenerated: variants.length,
  })
  
  return variants
}
