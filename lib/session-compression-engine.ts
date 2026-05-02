// Session Compression Engine
// Intelligently compresses or expands sessions based on available time
// [PHASE 6A] Preserves session identity and exercise metadata through compression

import type { ExerciseSelection, SelectedExercise } from './program-exercise-selector'
// [STEP-5C-CANONICAL-GRAMMAR] Compression's reduce/expand helpers do
// fixed-delta arithmetic (e.g. 9-14 -> 7-12) which produces blocked
// non-canonical bands. Snap their outputs through the canonical grammar
// so 30/45-minute compressed sessions never display weird ranges.
import { normalizeRepsOrTimeString } from './program/canonical-range-grammar'

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
  
  // ==========================================================================
  // [VARIANT-DISTINCTNESS-AUTHORITY]
  // Root-cause fix: prior light/moderate/heavy branches only dropped 0-1
  // exercise and cut ~1 set, so Full/45/30 produced nearly identical set
  // totals. This is the exact stage where variant truth diverged from
  // declared minutes. We now enforce explicit target EXERCISE counts per
  // level AND meaningful SET cuts per level, and we treat grouped blocks
  // (superset/circuit/density/cluster) as atomic units so a variant never
  // emits a half-pair (which downstream group adapters drop to flat rows).
  // ==========================================================================
  const fullCount = main.length
  let targetCount: number
  let setCut: number              // subtracted from non-top-2 exercises
  let topTwoSetCut: number        // subtracted from top-2 spine exercises
  let setFloor: number            // minimum sets after cut
  let topTwoSetFloor: number      // minimum sets for top-2 spine
  if (level === 'light') {
    // 45-min from ~55-60 Full: keep ~65% of exercises, trim one set off
    // non-spine rows. Top-2 spine stays full at 3.
    // Target-burden: ~65-70% of Full's total sets. User should see 1-2
    // fewer exercises AND smaller non-spine set counts.
    targetCount = Math.max(4, Math.ceil(fullCount * 0.65))
    setCut = 1
    topTwoSetCut = 0
    setFloor = 2
    topTwoSetFloor = 3
  } else if (level === 'moderate') {
    // 30-min from ~55-60 Full: keep ~50% of exercises, cut two sets off
    // non-spine rows, AND drop the spine to 2 sets. Prior behavior held
    // the top-2 spine at 3 sets (topTwoSetFloor=3) -- which kept 30-min's
    // spine identical to Full's spine, so the user read both modes as
    // "the same heavy work with a couple fewer accessories" -- the exact
    // "feels too similar" symptom. Dropping spine to 2 sets produces a
    // visible ~45-55% burden delta vs Full.
    targetCount = Math.max(3, Math.ceil(fullCount * 0.50))
    setCut = 2
    topTwoSetCut = 1
    setFloor = 2
    topTwoSetFloor = 2
  } else {
    // Heavy (20-25 min or short Full >= 60): keep ~40%, drop spine to 2
    // sets as well, cut two sets off everything else. This path ALSO uses
    // the grouped-atomic unit selection below (prior code bypassed it).
    targetCount = Math.max(3, Math.ceil(fullCount * 0.40))
    setCut = 2
    topTwoSetCut = 1
    setFloor = 2
    topTwoSetFloor = 2
  }
  // Safety: never inflate target above original count
  if (targetCount > fullCount) targetCount = fullCount
  // Always drop at least one exercise when compressing so the user can
  // feel the difference from Full.
  if (targetCount === fullCount && fullCount > 3) targetCount = fullCount - 1

  // ==========================================================================
  // GROUPED-BLOCK AWARE UNIT SELECTION
  // Build "units": each straight exercise = 1 unit; each grouped block
  // (same blockId with non-straight method) = 1 atomic unit (all members
  // kept together, or all dropped together). This prevents half-pair
  // supersets from appearing in 45/30 variants.
  // ==========================================================================
  type Unit = {
    id: string
    members: SelectedExercise[]
    score: number
    isGroup: boolean
  }
  const blockIdOf = (e: SelectedExercise): string | null => {
    const ex = e.exercise as unknown as { blockId?: string; method?: string }
    if (ex.blockId && ex.method && ex.method !== 'straight') return ex.blockId
    return null
  }
  const scoreById = new Map(
    scoredExercises.map(s => [s.exercise.exercise.id, s.identityScore])
  )
  const blockMap = new Map<string, SelectedExercise[]>()
  for (const e of main) {
    const bid = blockIdOf(e)
    if (bid) {
      const arr = blockMap.get(bid) || []
      arr.push(e)
      blockMap.set(bid, arr)
    }
  }
  const units: Unit[] = []
  const seen = new Set<string>()
  for (const e of main) {
    if (seen.has(e.exercise.id)) continue
    const bid = blockIdOf(e)
    if (bid && blockMap.has(bid)) {
      const members = blockMap.get(bid)!
      const score = Math.max(...members.map(m => scoreById.get(m.exercise.id) ?? 0))
      units.push({ id: bid, members, score, isGroup: true })
      members.forEach(m => seen.add(m.exercise.id))
    } else {
      units.push({
        id: e.exercise.id,
        members: [e],
        score: scoreById.get(e.exercise.id) ?? 0,
        isGroup: false,
      })
      seen.add(e.exercise.id)
    }
  }

  // Greedy pick by score until we hit targetCount exercises. Groups are
  // kept whole when they fit; skipped otherwise so an individual exercise
  // can take their slot (this is the honest-degrade rule -- a group either
  // survives intact or doesn't survive at all).
  units.sort((a, b) => b.score - a.score)
  const keptExerciseIds = new Set<string>()
  let kept = 0
  for (const unit of units) {
    if (kept >= targetCount) break
    const remaining = targetCount - kept
    if (unit.isGroup) {
      // Only admit the group if ALL members fit. Partial groups are banned.
      if (unit.members.length <= remaining) {
        unit.members.forEach(m => keptExerciseIds.add(m.exercise.id))
        kept += unit.members.length
      }
      // else: skip this group, try next unit
    } else {
      keptExerciseIds.add(unit.id)
      kept += 1
    }
  }
  // Safety net: if greedy under-filled (rare: big groups + tiny targetCount),
  // force the highest-score remaining units in until we reach the floor of 3.
  if (kept < Math.min(3, fullCount)) {
    for (const unit of units) {
      if (kept >= Math.min(3, fullCount)) break
      const allIn = unit.members.every(m => keptExerciseIds.has(m.exercise.id))
      if (allIn) continue
      unit.members.forEach(m => keptExerciseIds.add(m.exercise.id))
      kept += unit.members.filter(m => !keptExerciseIds.has(m.exercise.id)).length
      // Re-count keptExerciseIds truthfully
      kept = keptExerciseIds.size
    }
  }

  // Top-2 spine IDs by raw identity score (not by unit score). Both spine
  // exercises might be in a single kept group, or split across units.
  const topTwoIds = new Set(
    scoredExercises
      .slice()
      .sort((a, b) => b.identityScore - a.identityScore)
      .slice(0, 2)
      .map(s => s.exercise.exercise.id)
  )

  // Emit result in ORIGINAL session order (variant-realism: the shorter
  // mode reads as the same workout, trimmed -- not re-sorted).
  // [HEAVY-UNIFIED] Heavy now follows the same emission path as light/moderate
  // so grouped-atomic unit selection applies to ALL compression levels
  // (prior heavy branch used a separate Phase 6A loop that could half-break
  // a superset pair and ignored the targetCount contract entirely).
  const result: SelectedExercise[] = []
  for (const e of main) {
    if (!keptExerciseIds.has(e.exercise.id)) continue
    // Skill preservation still applies: skill work keeps its full set
    // count because the whole point of preserveSkillWork is to protect
    // neural-demand quality even in shorter sessions.
    if (preserveSkillWork && e.exercise.category === 'skill') {
      result.push({ ...e })
      continue
    }
    if (topTwoIds.has(e.exercise.id)) {
      const newSets = Math.max(topTwoSetFloor, e.sets - topTwoSetCut)
      result.push({ ...e, sets: newSets })
    } else {
      const newSets = Math.max(setFloor, e.sets - setCut)
      result.push({ ...e, sets: newSets })
    }
  }
  console.log('[variant-distinctness-authority]', {
    level,
    fullCount,
    targetCount,
    keptCount: result.length,
    droppedNames: main
      .filter(e => !keptExerciseIds.has(e.exercise.id))
      .map(e => e.exercise.name),
    originalTotalSets: main.reduce((sum, e) => sum + (e.sets || 0), 0),
    compressedTotalSets: result.reduce((sum, e) => sum + (e.sets || 0), 0),
    setCutNonSpine: setCut,
    setCutSpine: topTwoSetCut,
    topTwoSetFloor,
    setFloor,
    groupedUnitsKept: units
      .filter(u => u.isGroup && u.members.every(m => keptExerciseIds.has(m.exercise.id)))
      .map(u => u.id),
    groupedUnitsDropped: units
      .filter(u => u.isGroup && !u.members.every(m => keptExerciseIds.has(m.exercise.id)))
      .map(u => u.id),
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
    // [STEP-5C-CANONICAL-GRAMMAR] Snap reduced hold to canonical band.
    return normalizeRepsOrTimeString(`${reduced}s`, 'unknown', 'compressed').repsOrTime
  }

  // Reduce rep ranges (e.g., "10-12" -> "8-10")
  const rangeMatch = repsOrTime.match(/(\d+)-(\d+)/)
  if (rangeMatch) {
    const low = Math.max(5, parseInt(rangeMatch[1]) - 2)
    const high = Math.max(8, parseInt(rangeMatch[2]) - 2)
    // [STEP-5C-CANONICAL-GRAMMAR] Compression subtracts a fixed delta
    // which can produce 7-12 / 6-13 / 5-11. Snap to canonical for the
    // compressed-session intent (technique-bias bands).
    return normalizeRepsOrTimeString(`${low}-${high}`, 'unknown', 'compressed').repsOrTime
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

// =============================================================================
// [VARIANT-LAUNCHABILITY-CONTRACT] CANONICAL VARIANT VALIDITY HELPER
// =============================================================================
// A variant is "launchable" iff it can honestly materialize a real session
// body. This is the ONE authoritative truth for variant validity; every
// upstream emit site and every downstream consumer (Program card buttons,
// reconcile pass, route variant-apply) MUST reference this helper instead of
// its own ad hoc check. If this returns false, the variant must NOT survive
// in `session.variants` and must NOT render a Program-card toggle button.
//
// Minimum invariants a launchable variant satisfies:
//   1. variant object exists
//   2. variant.selection exists
//   3. variant.selection.main is an array
//   4. variant.selection.main.length > 0 (no hollow / metadata-only variants)
//   5. every main row has a usable SelectedExercise with exercise identity
//      (truthy string `id` AND truthy string `name`)
//
// Deliberately NOT checked here (these are richer truths that belong to later
// corridors and have their own guards):
//   - grouped / blockId / method / methodLabel survival
//     (that is the VARIANT-PARENT-TRUTH-RECONCILE pass's job; a variant
//     without grouped truth is still internally valid as a flat session)
//   - monotonicity vs Full (that is the variant-monotonicity-audit's job)
//   - meaningful-difference duration threshold (handled by the caller)
//
// Keeping those out of this helper prevents it from over-rejecting perfectly
// usable flat variants. The helper's job is ONLY "is this a real, usable
// session body?" -- not "is this an ideal variant shape?"
// =============================================================================
export function isVariantLaunchable(
  variant: SessionVariant | undefined | null
): variant is SessionVariant {
  if (!variant) return false
  if (!variant.selection) return false
  if (!Array.isArray(variant.selection.main)) return false
  if (variant.selection.main.length === 0) return false
  for (const row of variant.selection.main) {
    if (!row) return false
    if (!row.exercise) return false
    const ex = row.exercise as unknown as { id?: unknown; name?: unknown }
    if (typeof ex.id !== 'string' || ex.id.length === 0) return false
    if (typeof ex.name !== 'string' || ex.name.length === 0) return false
  }
  return true
}

// =============================================================================
// [VARIANT-LAUNCHABILITY-CONTRACT] FAILED-BRANCH DIAGNOSTIC SNAPSHOT
// =============================================================================
// `isVariantLaunchable` is a type predicate, so inside an
// `if (!isVariantLaunchable(variant)) { ... }` branch TypeScript correctly
// narrows `variant` away from `SessionVariant`. When the upstream array is
// already typed as `SessionVariant[]` (the normal case at consumer sites
// like the Program card and the regenerated-variant filter loop in the
// builder), that residual narrows further to `never`, which makes property
// reads such as `variant?.label` fail to type-check.
//
// We still want loud diagnostic logs in that failed branch — silently
// dropping a non-launchable variant without saying which one is exactly the
// regression failure mode this contract was added to prevent. This helper
// inspects the value as `unknown`, validates each field at the boundary,
// and returns a small structured snapshot that callers can drop straight
// into a `console.warn` / `console.error` payload. It performs no rescue,
// no fabrication, no fallback — only honest read-out of whatever shape the
// rejected value happens to have.
// =============================================================================
export type VariantDiagnosticSnapshot = {
  label?: string
  duration?: number
  mainCount: number | 'not_array' | 'missing'
}

export function getVariantDiagnosticSnapshot(rawVariant: unknown): VariantDiagnosticSnapshot {
  if (!rawVariant || typeof rawVariant !== 'object') {
    return { mainCount: 'missing' }
  }

  const record = rawVariant as {
    label?: unknown
    duration?: unknown
    selection?: { main?: unknown }
  }

  return {
    label: typeof record.label === 'string' ? record.label : undefined,
    duration: typeof record.duration === 'number' ? record.duration : undefined,
    mainCount: Array.isArray(record.selection?.main)
      ? record.selection.main.length
      : 'not_array',
  }
}

// =============================================================================
// [VARIANT-MATERIAL-DISTINCTNESS-CONTRACT] CANONICAL DISTINCTNESS HELPER
// =============================================================================
// A short variant ("45 Min" / "30 Min") must not survive if it is effectively
// the same body as its reference (Full, or the nearest larger emitted
// variant). "Launchable" alone is not enough: the compressor can pass through
// all of Full's rows unchanged (e.g. when Full is already small, or when the
// greedy trim kept every row), producing a 45/30 tab that launches an
// IDENTICAL body. That is the "cosmetic short variant" failure mode.
//
// A variant is materially distinct from its reference iff ANY of the
// following is true:
//   1. different number of main exercises
//   2. different ordered exercise identity (different sequence of
//      `exercise.id` across main)
//   3. different total prescribed sets across main
//   4. meaningfully different duration (>= 5 min delta, matching the
//      threshold used by generateSessionVariants' meaningful-difference gate)
//
// If NONE of those hold, the variant is effectively the same as the
// reference and must be rejected upstream so it cannot surface as a button.
//
// This helper is deliberately symmetric and pure (no side effects, no
// mutation). It is the ONE authoritative distinctness check; every emit
// site and every post-reconcile filter must reference it instead of its
// own ad-hoc comparison.
// =============================================================================
export interface VariantDistinctnessReport {
  materiallyDistinct: boolean
  sameMainCount: boolean
  sameOrderedIdentity: boolean
  sameTotalSets: boolean
  sameDurationBucket: boolean
  candidateMainCount: number
  referenceMainCount: number
  candidateTotalSets: number
  referenceTotalSets: number
  candidateDuration: number
  referenceDuration: number
  durationDeltaMinutes: number
  // If not distinct, the exact fields that matched the reference (caller
  // surfaces this in warn logs so "why was this variant rejected" is
  // auditable).
  matchedFields: Array<'mainCount' | 'orderedIdentity' | 'totalSets' | 'duration'>
}

const DURATION_DISTINCTNESS_THRESHOLD_MIN = 5

function orderedIdentitySignature(variant: SessionVariant): string {
  return (variant.selection.main || [])
    .map(row => {
      const id = (row?.exercise as unknown as { id?: unknown })?.id
      return typeof id === 'string' ? id : ''
    })
    .join('|')
}

function totalPrescribedSets(variant: SessionVariant): number {
  let total = 0
  for (const row of variant.selection.main || []) {
    const sets = (row as unknown as { sets?: unknown }).sets
    if (typeof sets === 'number' && Number.isFinite(sets)) total += sets
  }
  return total
}

export function areVariantsMateriallyDistinct(
  candidate: SessionVariant | undefined | null,
  reference: SessionVariant | undefined | null
): VariantDistinctnessReport {
  // If either side is missing or unlaunchable, we treat them as distinct by
  // default so this helper never accidentally blocks emission of a valid
  // candidate when reference is absent. The upstream launchability gate is
  // the right place to reject hollow candidates; this helper's ONLY job is
  // to reject two real-but-identical bodies.
  if (!candidate || !reference || !isVariantLaunchable(candidate) || !isVariantLaunchable(reference)) {
    return {
      materiallyDistinct: true,
      sameMainCount: false,
      sameOrderedIdentity: false,
      sameTotalSets: false,
      sameDurationBucket: false,
      candidateMainCount: candidate?.selection?.main?.length ?? 0,
      referenceMainCount: reference?.selection?.main?.length ?? 0,
      candidateTotalSets: 0,
      referenceTotalSets: 0,
      candidateDuration: candidate?.duration ?? 0,
      referenceDuration: reference?.duration ?? 0,
      durationDeltaMinutes: Math.abs((candidate?.duration ?? 0) - (reference?.duration ?? 0)),
      matchedFields: [],
    }
  }

  const candidateMainCount = candidate.selection.main.length
  const referenceMainCount = reference.selection.main.length
  const candidateTotalSets = totalPrescribedSets(candidate)
  const referenceTotalSets = totalPrescribedSets(reference)
  const candidateDuration = candidate.duration
  const referenceDuration = reference.duration
  const durationDeltaMinutes = Math.abs(candidateDuration - referenceDuration)

  const sameMainCount = candidateMainCount === referenceMainCount
  const sameOrderedIdentity = orderedIdentitySignature(candidate) === orderedIdentitySignature(reference)
  const sameTotalSets = candidateTotalSets === referenceTotalSets
  const sameDurationBucket = durationDeltaMinutes < DURATION_DISTINCTNESS_THRESHOLD_MIN

  // Materially distinct iff at least one of the four axes differs.
  const materiallyDistinct = !(sameMainCount && sameOrderedIdentity && sameTotalSets && sameDurationBucket)

  const matchedFields: Array<'mainCount' | 'orderedIdentity' | 'totalSets' | 'duration'> = []
  if (!materiallyDistinct) {
    if (sameMainCount) matchedFields.push('mainCount')
    if (sameOrderedIdentity) matchedFields.push('orderedIdentity')
    if (sameTotalSets) matchedFields.push('totalSets')
    if (sameDurationBucket) matchedFields.push('duration')
  }

  return {
    materiallyDistinct,
    sameMainCount,
    sameOrderedIdentity,
    sameTotalSets,
    sameDurationBucket,
    candidateMainCount,
    referenceMainCount,
    candidateTotalSets,
    referenceTotalSets,
    candidateDuration,
    referenceDuration,
    durationDeltaMinutes,
    matchedFields,
  }
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
  
  // [VARIANT-LAUNCHABILITY-CONTRACT] Full is only emitted if it passes the
  // canonical validity gate. If the caller handed us an empty or malformed
  // full selection, we return an empty variants array rather than emitting a
  // hollow Full. Callers (and the card's selectedSessionContract) already
  // handle `session.variants` being empty/undefined by rendering a single
  // honest session with `session.estimatedMinutes`.
  const fullCandidate: SessionVariant = {
    duration: safeOriginalMinutes,
    label: 'Full Session',
    selection: safeSelection,
    compressionLevel: 'none',
  }
  if (!isVariantLaunchable(fullCandidate)) {
    console.warn('[VARIANT-LAUNCHABILITY-CONTRACT] Full variant rejected - no launchable body', {
      fullExerciseCount,
      safeOriginalMinutes,
      verdict: 'RETURNING_EMPTY_VARIANTS_ARRAY',
    })
    return []
  }
  const variants: SessionVariant[] = [fullCandidate]
  
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
      const candidate45: SessionVariant = {
        duration: 45,
        label: '45 Min',
        selection: compressed45.compressed,
        compressionLevel: compressed45.compressionLevel,
      }
      // [VARIANT-LAUNCHABILITY-CONTRACT] Only emit 45 Min if it has a real
      // launchable body. `count45 <= fullExerciseCount` alone was true even
      // when count45 was 0 (hollow compressed main), which pushed a
      // metadata-only variant that downstream consumers treated as real.
      if (!isVariantLaunchable(candidate45)) {
        console.warn('[VARIANT-LAUNCHABILITY-CONTRACT] Skipping 45min variant - no launchable body', {
          fullCount: fullExerciseCount,
          variant45Count: count45,
          reason: 'empty_or_unusable_selection_main',
        })
      } else if (count45 > fullExerciseCount) {
        console.warn('[session-variants] Skipping 45min variant - would be fuller than full session', {
          fullCount: fullExerciseCount,
          variant45Count: count45,
        })
      } else {
        // [VARIANT-MATERIAL-DISTINCTNESS-CONTRACT] Reject a 45 Min variant
        // whose body is effectively identical to Full (same ordered exercise
        // identity AND same main count AND same total sets AND near-equal
        // duration). Compression can degrade to a pass-through when Full is
        // already short or when the greedy trim happened to keep every row;
        // emitting such a candidate would surface a misleading 45 Min tab
        // that loads the full body.
        const distinctnessVsFull = areVariantsMateriallyDistinct(candidate45, fullCandidate)
        if (!distinctnessVsFull.materiallyDistinct) {
          console.warn('[VARIANT-MATERIAL-DISTINCTNESS-CONTRACT] Skipping 45min variant - not materially distinct from Full', {
            fullCount: fullExerciseCount,
            variant45Count: count45,
            matchedFields: distinctnessVsFull.matchedFields,
            candidateTotalSets: distinctnessVsFull.candidateTotalSets,
            referenceTotalSets: distinctnessVsFull.referenceTotalSets,
            durationDeltaMinutes: distinctnessVsFull.durationDeltaMinutes,
            verdict: 'REJECTED_COSMETIC_SHORT_VARIANT',
          })
        } else {
          variant45 = candidate45
          variants.push(variant45)
        }
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
      const candidate30: SessionVariant = {
        duration: 30,
        label: '30 Min',
        selection: compressed30.compressed,
        compressionLevel: compressed30.compressionLevel,
      }
      // [VARIANT-LAUNCHABILITY-CONTRACT] Same gate as 45 Min: reject hollow
      // compressions before the monotonicity guard, since a 0-count variant
      // would satisfy `count30 <= count45ForComparison` trivially.
      if (!isVariantLaunchable(candidate30)) {
        console.warn('[VARIANT-LAUNCHABILITY-CONTRACT] Skipping 30min variant - no launchable body', {
          fullCount: fullExerciseCount,
          count45: count45ForComparison,
          count30,
          reason: 'empty_or_unusable_selection_main',
        })
      } else if (count30 > count45ForComparison || count30 > fullExerciseCount) {
        console.warn('[session-variants] Skipping 30min variant - would be fuller than 45/full', {
          fullCount: fullExerciseCount,
          count45: count45ForComparison,
          count30,
        })
      } else {
        // [VARIANT-MATERIAL-DISTINCTNESS-CONTRACT] 30 Min must be
        // materially distinct from Full AND from the emitted 45 (if any).
        // Otherwise the 30 Min tab would either duplicate Full or duplicate
        // 45 -- both are cosmetic tabs that lie to the user.
        const distinctnessVsFull = areVariantsMateriallyDistinct(candidate30, fullCandidate)
        const distinctnessVs45 = variant45
          ? areVariantsMateriallyDistinct(candidate30, variant45)
          : { materiallyDistinct: true, matchedFields: [] as Array<'mainCount' | 'orderedIdentity' | 'totalSets' | 'duration'> }
        if (!distinctnessVsFull.materiallyDistinct) {
          console.warn('[VARIANT-MATERIAL-DISTINCTNESS-CONTRACT] Skipping 30min variant - not materially distinct from Full', {
            fullCount: fullExerciseCount,
            count30,
            matchedFields: distinctnessVsFull.matchedFields,
            verdict: 'REJECTED_COSMETIC_SHORT_VARIANT',
          })
        } else if (!distinctnessVs45.materiallyDistinct) {
          console.warn('[VARIANT-MATERIAL-DISTINCTNESS-CONTRACT] Skipping 30min variant - not materially distinct from 45 Min', {
            count45: count45ForComparison,
            count30,
            matchedFields: distinctnessVs45.matchedFields,
            verdict: 'REJECTED_DUPLICATE_SHORT_VARIANT',
          })
        } else {
          variant30 = candidate30
          variants.push(variant30)
        }
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
