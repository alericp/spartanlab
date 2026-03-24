// Session Compression Engine
// Intelligently compresses or expands sessions based on available time
// [PHASE 6A] Preserves session identity and exercise metadata through compression

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

// =============================================================================
// [PHASE 6A TASK 1] SESSION IDENTITY SNAPSHOT
// Captures the truth of the full session BEFORE compression
// =============================================================================
interface SessionIdentitySnapshot {
  sessionId?: string
  dayFocus?: string
  primarySkillExpressions: string[]
  secondarySkillExpressions: string[]
  broaderSkillExpressions: string[]
  mainProgressionExercises: string[]
  strengthSupportExercises: string[]
  genericSupportCount: number
  exercisesWithRationale: number
  totalExercises: number
}

function captureSessionIdentity(selection: ExerciseSelection, dayFocus?: string): SessionIdentitySnapshot {
  const main = selection.main || []
  
  // Identify skill expressions (category === 'skill' or selectionReason mentions skill)
  const primarySkillExpressions = main
    .filter(e => e.exercise.category === 'skill' || 
                 e.selectionReason?.toLowerCase().includes('skill progression') ||
                 e.selectionReason?.toLowerCase().includes('primary goal'))
    .map(e => e.exercise.name)
  
  // Identify secondary/broader skill expressions
  const secondarySkillExpressions = main
    .filter(e => e.selectionReason?.toLowerCase().includes('secondary') ||
                 e.selectionReason?.toLowerCase().includes('selected skill'))
    .map(e => e.exercise.name)
  
  const broaderSkillExpressions = main
    .filter(e => e.selectionReason?.toLowerCase().includes('hybrid') ||
                 e.selectionReason?.toLowerCase().includes('advanced') ||
                 e.selectionReason?.toLowerCase().includes('expression'))
    .map(e => e.exercise.name)
  
  // Identify main progression exercises
  const mainProgressionExercises = main
    .filter(e => e.exercise.category === 'skill' || 
                 e.selectionReason?.toLowerCase().includes('progression'))
    .map(e => e.exercise.name)
  
  // Identify strength support (not generic accessory)
  const strengthSupportExercises = main
    .filter(e => e.exercise.category === 'strength' &&
                 (e.selectionReason?.toLowerCase().includes('support') ||
                  e.selectionReason?.toLowerCase().includes('strength')))
    .map(e => e.exercise.name)
  
  // Count generic support (accessory/core without specific purpose)
  const genericSupportCount = main.filter(e => 
    (e.exercise.category === 'accessory' || e.exercise.category === 'core') &&
    !e.selectionReason?.toLowerCase().includes('skill') &&
    !e.selectionReason?.toLowerCase().includes('progression')
  ).length
  
  // Count exercises with meaningful rationale
  const exercisesWithRationale = main.filter(e => 
    e.selectionReason && 
    e.selectionReason.length > 10 &&
    !e.selectionReason.toLowerCase().includes('fallback')
  ).length
  
  return {
    dayFocus,
    primarySkillExpressions,
    secondarySkillExpressions,
    broaderSkillExpressions,
    mainProgressionExercises,
    strengthSupportExercises,
    genericSupportCount,
    exercisesWithRationale,
    totalExercises: main.length,
  }
}

interface CompressionInputs {
  selection: ExerciseSelection
  targetMinutes: number
  originalMinutes: number
  preserveSkillWork: boolean
  dayFocus?: string // [PHASE 6A] Session identity context
}

// =============================================================================
// MAIN COMPRESSION FUNCTION
// =============================================================================

export function compressSession(inputs: CompressionInputs): CompressionResult {
  const { selection, targetMinutes, originalMinutes, preserveSkillWork, dayFocus } = inputs
  
  // ==========================================================================
  // [PHASE 6A TASK 1] CAPTURE SESSION IDENTITY BEFORE COMPRESSION
  // ==========================================================================
  const sessionIdentity = captureSessionIdentity(selection, dayFocus)
  
  console.log('[session-identity-before-compression-audit]', {
    sessionId: dayFocus || 'unknown',
    dayFocus,
    primaryGoal: 'from_context', // Not directly available here
    sessionPrimarySkillExpressions: sessionIdentity.primarySkillExpressions,
    sessionSecondarySkillExpressions: sessionIdentity.secondarySkillExpressions,
    sessionBroaderSkillExpressions: sessionIdentity.broaderSkillExpressions,
    mainExerciseNames: selection.main.map(e => e.exercise.name),
    genericSupportCount: sessionIdentity.genericSupportCount,
    rationaleCoverage: `${sessionIdentity.exercisesWithRationale}/${sessionIdentity.totalExercises}`,
    verdict: sessionIdentity.primarySkillExpressions.length > 0 
      ? 'has_priority_skill_identity' 
      : 'generic_session_identity',
  })
  
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
  
  // Create compressed version with session identity preservation
  const compressed = compressSelection(selection, compressionLevel, preserveSkillWork, sessionIdentity)
  
  // Track what was removed/adjusted
  const removedExercises = findRemovedExercises(selection.main, compressed.main)
  const adjustedSets = findAdjustedSets(selection.main, compressed.main)
  
  const explanation = generateCompressionExplanation(
    compressionLevel,
    removedExercises,
    adjustedSets
  )
  
  // ==========================================================================
  // [PHASE 6A TASK 2] COMPRESSED SESSION IDENTITY PRESERVATION AUDIT
  // ==========================================================================
  const preservedPrimarySkill = sessionIdentity.primarySkillExpressions.some(skill =>
    compressed.main.some(e => e.exercise.name === skill)
  )
  const preservedSecondaryOrBroader = 
    sessionIdentity.secondarySkillExpressions.some(skill =>
      compressed.main.some(e => e.exercise.name === skill)
    ) ||
    sessionIdentity.broaderSkillExpressions.some(skill =>
      compressed.main.some(e => e.exercise.name === skill)
    )
  
  const compressedGenericCount = compressed.main.filter(e => 
    (e.exercise.category === 'accessory' || e.exercise.category === 'core') &&
    !e.selectionReason?.toLowerCase().includes('skill')
  ).length
  
  const genericDominates = compressedGenericCount > compressed.main.length / 2
  
  const droppedIdentityElements = [
    ...sessionIdentity.primarySkillExpressions.filter(skill =>
      !compressed.main.some(e => e.exercise.name === skill)
    ).map(s => `${s} (primary skill)`),
    ...sessionIdentity.strengthSupportExercises.filter(skill =>
      !compressed.main.some(e => e.exercise.name === skill)
    ).map(s => `${s} (strength support)`),
  ]
  
  console.log('[compressed-session-identity-preservation-audit]', {
    sessionId: dayFocus || 'unknown',
    targetMinutes,
    fullSessionIdentity: {
      primarySkills: sessionIdentity.primarySkillExpressions.length,
      secondarySkills: sessionIdentity.secondarySkillExpressions.length,
      totalExercises: sessionIdentity.totalExercises,
    },
    compressedExerciseNames: compressed.main.map(e => e.exercise.name),
    preservedPrimarySkillExpression: preservedPrimarySkill,
    preservedSecondaryOrBroaderExpression: preservedSecondaryOrBroader,
    genericSupportDominated: genericDominates,
    exactDroppedIdentityElements: droppedIdentityElements,
    verdict: genericDominates 
      ? 'WARNING_generic_collapse' 
      : preservedPrimarySkill 
        ? 'identity_preserved' 
        : 'identity_partially_lost',
  })
  
  // ==========================================================================
  // [PHASE 6A TASK 6] VARIANT DERIVED FROM FULL SESSION TRUTH AUDIT
  // ==========================================================================
  const inheritedDirectly = compressed.main.filter(e =>
    selection.main.some(orig => orig.exercise.id === e.exercise.id)
  ).length
  
  const genericFallbackLike = compressed.main.filter(e =>
    !selection.main.some(orig => orig.exercise.id === e.exercise.id) ||
    (e.selectionReason?.toLowerCase().includes('fallback') ||
     e.selectionReason?.toLowerCase().includes('rescue'))
  ).length
  
  console.log('[variant-derived-from-full-session-truth-audit]', {
    sessionId: dayFocus || 'unknown',
    fullExerciseNames: selection.main.map(e => e.exercise.name),
    shortVariantExerciseNames: compressed.main.map(e => e.exercise.name),
    inheritedDirectlyCount: inheritedDirectly,
    adaptedFromFullCount: 0, // No adaptation in compression, just selection
    genericFallbackLikeCount: genericFallbackLike,
    verdict: inheritedDirectly === compressed.main.length 
      ? 'derived_from_full_session' 
      : genericFallbackLike > 0 
        ? 'WARNING_fallback_like_exercises_present'
        : 'derived_with_adaptations',
  })
  
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
  preserveSkillWork: boolean,
  sessionIdentity?: SessionIdentitySnapshot
): ExerciseSelection {
  // ==========================================================================
  // [PHASE 6A TASK 4] PRESERVE EXERCISE METADATA THROUGH COMPRESSION
  // Ensure selectionReason, selectionTrace, and other fields survive
  // ==========================================================================
  const compressedMain = compressMain(selection.main, level, preserveSkillWork, sessionIdentity)
  
  // [PHASE 6A TASK 4-5] Audit rationale and role preservation
  const mainWithRationale = selection.main.filter(e => e.selectionReason && e.selectionReason.length > 5).length
  const compressedWithRationale = compressedMain.filter(e => e.selectionReason && e.selectionReason.length > 5).length
  const missingRationale = compressedMain
    .filter(e => !e.selectionReason || e.selectionReason.length < 5)
    .map(e => e.exercise.name)
  
  console.log('[compressed-rationale-preservation-audit]', {
    fullMainExerciseCount: selection.main.length,
    compressedMainExerciseCount: compressedMain.length,
    rationaleCountBefore: mainWithRationale,
    rationaleCountAfter: compressedWithRationale,
    exercisesMissingRationaleAfterCompression: missingRationale,
    adaptedExercisesNeedingRemap: compressedMain.filter(e => e.wasSubstituted).map(e => e.exercise.name),
    verdict: missingRationale.length === 0 ? 'all_rationale_preserved' : 'some_rationale_missing',
  })
  
  // [PHASE 6A TASK 5] Audit role label preservation
  const mainWithRole = selection.main.filter(e => e.exercise.category).length
  const compressedWithRole = compressedMain.filter(e => e.exercise.category).length
  const missingRoleLabels = compressedMain
    .filter(e => !e.exercise.category)
    .map(e => e.exercise.name)
  
  console.log('[compressed-role-label-truth-audit]', {
    exercisesWithRoleBefore: mainWithRole,
    exercisesWithRoleAfter: compressedWithRole,
    missingRoleLabels,
    changedRoleLabels: [], // Roles don't change in compression, just preserved
    unjustifiedRoleLoss: missingRoleLabels.length > 0,
    verdict: missingRoleLabels.length === 0 ? 'all_roles_preserved' : 'role_labels_missing',
  })
  
  return {
    warmup: compressWarmup(selection.warmup, level),
    main: compressedMain,
    cooldown: compressCooldown(selection.cooldown, level),
    totalEstimatedTime: 0, // Recalculated after compression
  }
}

function compressWarmup(
  warmup: SelectedExercise[],
  level: 'light' | 'moderate' | 'heavy'
): SelectedExercise[] {
  // [PHASE 6A TASK 4-5] Preserve all metadata through compression
  if (level === 'light') {
    // Keep all warmup, maybe reduce sets - preserve all metadata
    return warmup.map(e => ({
      ...e, // Preserve selectionReason, selectionTrace, etc.
      sets: Math.max(1, e.sets),
    }))
  }
  
  if (level === 'moderate') {
    // Keep essential warmup only (first 3) - preserve all metadata
    return warmup.slice(0, 3).map(e => ({
      ...e, // Preserve selectionReason, selectionTrace, etc.
      sets: 1,
    }))
  }
  
  // Heavy compression - minimal warmup but preserve metadata
  return warmup.slice(0, 2).map(e => ({
    ...e, // Preserve selectionReason, selectionTrace, etc.
    sets: 1,
    repsOrTime: reduceRepsOrTime(e.repsOrTime),
  }))
}

function compressMain(
  main: SelectedExercise[],
  level: 'light' | 'moderate' | 'heavy',
  preserveSkillWork: boolean,
  sessionIdentity?: SessionIdentitySnapshot
): SelectedExercise[] {
  // ==========================================================================
  // [PHASE 6A TASK 2] IDENTITY-PRESERVING COMPRESSION
  // The 30-min variant must preserve session identity, not just category sort
  // Priority: 1) Priority skill expression, 2) Session-specific strength support
  //           3) Secondary/broader skill support, 4) Generic accessory/core
  // ==========================================================================
  
  // Compute exercise identity scores based on session context
  const scoredExercises = main.map(e => {
    let identityScore = 0
    const reason = e.selectionReason?.toLowerCase() || ''
    const name = e.exercise.name.toLowerCase()
    
    // Primary skill expressions get highest priority
    if (e.exercise.category === 'skill') identityScore += 100
    if (reason.includes('skill progression') || reason.includes('primary goal')) identityScore += 80
    if (sessionIdentity?.primarySkillExpressions.some(s => s.toLowerCase() === name)) identityScore += 70
    
    // Session-specific support gets second priority
    if (reason.includes('support') && reason.includes('skill')) identityScore += 50
    if (reason.includes('hybrid') || reason.includes('advanced')) identityScore += 45
    if (sessionIdentity?.strengthSupportExercises.some(s => s.toLowerCase() === name)) identityScore += 40
    
    // Secondary/broader skill expressions
    if (sessionIdentity?.secondarySkillExpressions.some(s => s.toLowerCase() === name)) identityScore += 35
    if (sessionIdentity?.broaderSkillExpressions.some(s => s.toLowerCase() === name)) identityScore += 30
    if (reason.includes('secondary') || reason.includes('selected skill')) identityScore += 25
    
    // Strength category gets moderate priority
    if (e.exercise.category === 'strength') identityScore += 20
    
    // Generic support/accessory gets lowest priority
    if (e.exercise.category === 'accessory') identityScore += 5
    if (e.exercise.category === 'core') identityScore += 10
    
    // Penalize exercises with weak/fallback rationale
    if (reason.includes('fallback') || reason.includes('rescue')) identityScore -= 10
    if (!e.selectionReason || e.selectionReason.length < 10) identityScore -= 5
    
    return { exercise: e, identityScore }
  })
  
  // Sort by identity score (highest first)
  const prioritized = scoredExercises
    .sort((a, b) => b.identityScore - a.identityScore)
    .map(s => s.exercise)
  
  // Log identity-aware sorting
  console.log('[compression-identity-sort]', {
    level,
    originalOrder: main.map(e => e.exercise.name).slice(0, 5),
    identitySortedOrder: prioritized.map(e => e.exercise.name).slice(0, 5),
    topScores: scoredExercises.sort((a, b) => b.identityScore - a.identityScore).slice(0, 5).map(s => ({
      name: s.exercise.exercise.name,
      score: s.identityScore,
    })),
  })
  
  if (level === 'light') {
    // Keep all exercises, reduce sets on lower priority ones
    // [PHASE 6A] Preserve all metadata from original exercises
    return prioritized.map((e, idx) => {
      if (idx < 2) return { ...e } // Keep top 2 unchanged with all metadata
      return {
        ...e, // Preserve selectionReason, selectionTrace, etc.
        sets: Math.max(2, e.sets - 1),
      }
    })
  }
  
  if (level === 'moderate') {
    // Keep top 4-5 exercises, reduce sets
    // [PHASE 6A] Preserve session identity - keep skill expressions first
    const kept = prioritized.slice(0, 5)
    return kept.map((e, idx) => {
      if (preserveSkillWork && e.exercise.category === 'skill') {
        return { ...e } // Preserve full metadata
      }
      if (idx < 2) return { ...e, sets: Math.max(3, e.sets) }
      return { ...e, sets: Math.max(2, e.sets - 1) }
    })
  }
  
  // ==========================================================================
  // [PHASE 6A TASK 2-3] HEAVY COMPRESSION - IDENTITY PRESERVATION
  // For 30-min variants: Keep at least one true priority skill expression
  // Don't let generic support dominate the short session
  // ==========================================================================
  
  const result: SelectedExercise[] = []
  const droppedIdentityElements: string[] = []
  
  // STEP 1: Preserve at least one priority skill expression if it existed
  const prioritySkillExercise = prioritized.find(e => 
    e.exercise.category === 'skill' ||
    e.selectionReason?.toLowerCase().includes('skill progression') ||
    e.selectionReason?.toLowerCase().includes('primary goal')
  )
  
  if (prioritySkillExercise) {
    result.push({ ...prioritySkillExercise }) // Preserve all metadata
  }
  
  // STEP 2: Add session-specific strength support if it supports the skill
  const specificStrengthSupport = prioritized.find(e => 
    e.exercise.category === 'strength' &&
    !result.some(r => r.exercise.id === e.exercise.id) &&
    (e.selectionReason?.toLowerCase().includes('support') ||
     e.selectionReason?.toLowerCase().includes('hybrid') ||
     e.selectionReason?.toLowerCase().includes('advanced'))
  )
  
  if (specificStrengthSupport && result.length < 3) {
    result.push({ ...specificStrengthSupport, sets: Math.max(2, specificStrengthSupport.sets - 1) })
  }
  
  // STEP 3: Add secondary/broader skill expression if time allows
  const secondaryExpression = prioritized.find(e => 
    !result.some(r => r.exercise.id === e.exercise.id) &&
    (e.selectionReason?.toLowerCase().includes('secondary') ||
     e.selectionReason?.toLowerCase().includes('selected skill') ||
     e.selectionReason?.toLowerCase().includes('broader'))
  )
  
  if (secondaryExpression && result.length < 3) {
    result.push({ ...secondaryExpression, sets: Math.max(2, secondaryExpression.sets - 1) })
  }
  
  // STEP 4: Fill remaining slots with strength/accessory (not letting generic dominate)
  let genericCount = 0
  const maxGeneric = Math.max(1, 4 - result.length) // At least 4 exercises total
  
  for (const e of prioritized) {
    if (result.length >= 4) break
    if (result.some(r => r.exercise.id === e.exercise.id)) continue
    
    const isGeneric = (e.exercise.category === 'accessory' || e.exercise.category === 'core') &&
                      !e.selectionReason?.toLowerCase().includes('skill')
    
    if (isGeneric) {
      if (genericCount >= maxGeneric) {
        droppedIdentityElements.push(`${e.exercise.name} (generic support capped)`)
        continue
      }
      genericCount++
    }
    
    result.push({ ...e, sets: Math.max(2, e.sets - 1) })
  }
  
  // STEP 5: Always include at least one core movement if we have room
  if (result.length < 4 && !result.some(e => e.exercise.category === 'core')) {
    const coreExercise = prioritized.find(e => 
      e.exercise.category === 'core' &&
      !result.some(r => r.exercise.id === e.exercise.id)
    )
    if (coreExercise) {
      result.push({ ...coreExercise, sets: 2 })
    }
  }
  
  // ==========================================================================
  // [PHASE 6A TASK 3] GENERIC COLLAPSE GUARD AUDIT
  // ==========================================================================
  const fullHadPrioritySkill = prioritized.some(e => 
    e.exercise.category === 'skill' ||
    e.selectionReason?.toLowerCase().includes('skill progression')
  )
  const fullHadHybridSupport = prioritized.some(e => 
    e.selectionReason?.toLowerCase().includes('hybrid') ||
    e.selectionReason?.toLowerCase().includes('advanced')
  )
  const shortPreservedSkill = result.some(e => 
    e.exercise.category === 'skill' ||
    e.selectionReason?.toLowerCase().includes('skill progression')
  )
  const shortPreservedHybrid = result.some(e => 
    e.selectionReason?.toLowerCase().includes('hybrid') ||
    e.selectionReason?.toLowerCase().includes('advanced')
  )
  
  const genericDominates = result.filter(e => 
    (e.exercise.category === 'accessory' || e.exercise.category === 'core') &&
    !e.selectionReason?.toLowerCase().includes('skill')
  ).length > result.length / 2
  
  console.log('[short-variant-generic-collapse-guard-audit]', {
    fullSessionHadPrioritySkill: fullHadPrioritySkill,
    fullSessionHadHybridSpecificSupport: fullHadHybridSupport,
    shortVariantPreservedThem: shortPreservedSkill || shortPreservedHybrid,
    collapseWasForced: !shortPreservedSkill && fullHadPrioritySkill,
    exactForcedReason: !shortPreservedSkill && fullHadPrioritySkill 
      ? 'no_skill_exercise_available_after_filtering' 
      : null,
    genericDominated: genericDominates,
    droppedIdentityElements,
    verdict: genericDominates ? 'WARNING_generic_support_dominates' : 'identity_preserved',
  })
  
  return result
}

function compressCooldown(
  cooldown: SelectedExercise[],
  level: 'light' | 'moderate' | 'heavy'
): SelectedExercise[] {
  // [PHASE 6A TASK 4-5] Preserve all metadata through compression
  if (level === 'light') {
    // Preserve all metadata by spreading each exercise
    return cooldown.map(e => ({ ...e }))
  }
  
  if (level === 'moderate') {
    // Keep first 2 with all metadata preserved
    return cooldown.slice(0, 2).map(e => ({ ...e }))
  }
  
  // Heavy - minimal stretch but preserve metadata
  return cooldown.slice(0, 1).map(e => ({ ...e }))
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
  
  // Clone selection - [PHASE 6A] Preserve all metadata through spread
  const expanded: ExerciseSelection = {
    warmup: selection.warmup.map(e => ({ ...e })), // Preserve selectionReason, etc.
    main: selection.main.map(e => ({ ...e })), // Preserve selectionReason, etc.
    cooldown: selection.cooldown.map(e => ({ ...e })), // Preserve selectionReason, etc.
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
