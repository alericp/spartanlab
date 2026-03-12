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
  const parts: string[] = []
  
  if (level === 'light') {
    parts.push('Slightly reduced volume on accessory work.')
  } else if (level === 'moderate') {
    parts.push('Removed lower-priority exercises to preserve core training effect.')
  } else {
    parts.push('Significant compression applied — only essential movements retained.')
  }
  
  if (removed.length > 0) {
    parts.push(`Removed: ${removed.join(', ')}.`)
  }
  
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
  const variants: SessionVariant[] = [
    {
      duration: originalMinutes,
      label: 'Full Session',
      selection: fullSelection,
      compressionLevel: 'none',
    },
  ]
  
  // 45 min variant
  if (originalMinutes > 45) {
    const compressed45 = compressSession({
      selection: fullSelection,
      targetMinutes: 45,
      originalMinutes,
      preserveSkillWork: true,
    })
    variants.push({
      duration: 45,
      label: '45 Min',
      selection: compressed45.compressed,
      compressionLevel: compressed45.compressionLevel,
    })
  }
  
  // 30 min variant
  if (originalMinutes > 30) {
    const compressed30 = compressSession({
      selection: fullSelection,
      targetMinutes: 30,
      originalMinutes,
      preserveSkillWork: true,
    })
    variants.push({
      duration: 30,
      label: '30 Min',
      selection: compressed30.compressed,
      compressionLevel: compressed30.compressionLevel,
    })
  }
  
  return variants
}
