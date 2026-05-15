/**
 * PROGRAM BALANCE UI ADAPTER — MASTER-8B.4
 *
 * =============================================================================
 * SAFE INPUT EXTRACTION FOR PROGRAM BALANCE ANALYZER
 * =============================================================================
 *
 * This helper safely extracts ProgramBalanceBranchInput from the AdaptiveProgram
 * and related UI props without importing React or causing circular dependencies.
 *
 * GUARANTEES:
 *   - Pure TypeScript, side-effect free
 *   - No React imports, no UI components
 *   - No generator imports, no live workout runtime
 *   - No mutation of input objects
 *   - No module-scope execution
 *   - Safe narrowing for uncertain program shapes
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.4
 */

import type {
  ProgramBalanceBranchInput,
  ProgramBalanceSessionInput,
  ProgramBalanceExerciseInput,
} from './program-balance-intelligence-contract'
import { isSyntheticConditioningFinisherPlaceholder } from './conditioning-finisher-artifact-contract'

// =============================================================================
// SAFE TYPE GUARDS
// =============================================================================

function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// =============================================================================
// EXERCISE EXTRACTION
// =============================================================================

/**
 * MASTER-8C.4.F: Detects synthetic placeholder exercise IDs
 * These are generated placeholders that should not be treated as canonical exercise identity
 */
function isSyntheticExercisePlaceholderId(value: string): boolean {
  if (!value) return false
  const lower = value.toLowerCase()
  // Match patterns like: exercise-3, exercise_3, unknown_exercise_3, ex-3, etc.
  return /^(exercise|ex|unknown_exercise|unknown-exercise|item)[-_]?\d+$/i.test(lower)
}

/**
 * MASTER-8C.4.F: Source-aware exercise identity extraction
 * Collects candidate IDs from all possible sources and picks the best one
 */
function extractCanonicalExerciseIdentity(
  exercise: Record<string, unknown>,
  index: number
): { id: string; name: string; source: string; syntheticPlaceholderUsed: boolean } {
  const candidates: { id: string; name: string; source: string }[] = []

  // Helper to safely get string from nested path
  const getString = (obj: unknown, ...keys: string[]): string | null => {
    let current: unknown = obj
    for (const key of keys) {
      if (!current || typeof current !== 'object') return null
      current = (current as Record<string, unknown>)[key]
    }
    return typeof current === 'string' && current.length > 0 ? current : null
  }

  // Helper to derive ID from name
  const nameToId = (name: string): string => name.toLowerCase().replace(/\s+/g, '_')

  // Collect ID candidates in priority order (most specific first)

  // Nested exercise object (highest priority - this is the canonical source)
  const nestedExId = getString(exercise, 'exercise', 'id')
  const nestedExExerciseId = getString(exercise, 'exercise', 'exerciseId')
  const nestedExName = getString(exercise, 'exercise', 'name')
  if (nestedExId && !isSyntheticExercisePlaceholderId(nestedExId)) {
    candidates.push({ id: nestedExId, name: nestedExName ?? nestedExId, source: 'exercise.id' })
  }
  if (nestedExExerciseId && !isSyntheticExercisePlaceholderId(nestedExExerciseId)) {
    candidates.push({ id: nestedExExerciseId, name: nestedExName ?? nestedExExerciseId, source: 'exercise.exerciseId' })
  }
  if (nestedExName && candidates.length === 0) {
    candidates.push({ id: nameToId(nestedExName), name: nestedExName, source: 'exercise.name (derived)' })
  }

  // Source exercise object
  const srcExId = getString(exercise, 'sourceExercise', 'id')
  const srcExName = getString(exercise, 'sourceExercise', 'name')
  if (srcExId && !isSyntheticExercisePlaceholderId(srcExId)) {
    candidates.push({ id: srcExId, name: srcExName ?? srcExId, source: 'sourceExercise.id' })
  }

  // Original exercise object
  const origExId = getString(exercise, 'originalExercise', 'id')
  const origExName = getString(exercise, 'originalExercise', 'name')
  if (origExId && !isSyntheticExercisePlaceholderId(origExId)) {
    candidates.push({ id: origExId, name: origExName ?? origExId, source: 'originalExercise.id' })
  }

  // Selected exercise nested object
  const selExId = getString(exercise, 'selectedExercise', 'exercise', 'id')
  const selExName = getString(exercise, 'selectedExercise', 'exercise', 'name')
  if (selExId && !isSyntheticExercisePlaceholderId(selExId)) {
    candidates.push({ id: selExId, name: selExName ?? selExId, source: 'selectedExercise.exercise.id' })
  }
  const selId = getString(exercise, 'selectedExercise', 'id')
  const selName = getString(exercise, 'selectedExercise', 'name')
  if (selId && !isSyntheticExercisePlaceholderId(selId)) {
    candidates.push({ id: selId, name: selName ?? selId, source: 'selectedExercise.id' })
  }

  // Metadata fields
  const metaExId = getString(exercise, 'metadata', 'exerciseId')
  const metaCanonId = getString(exercise, 'metadata', 'canonicalExerciseId')
  const metaSrcId = getString(exercise, 'metadata', 'sourceExerciseId')
  if (metaCanonId && !isSyntheticExercisePlaceholderId(metaCanonId)) {
    candidates.push({ id: metaCanonId, name: metaCanonId, source: 'metadata.canonicalExerciseId' })
  }
  if (metaExId && !isSyntheticExercisePlaceholderId(metaExId)) {
    candidates.push({ id: metaExId, name: metaExId, source: 'metadata.exerciseId' })
  }
  if (metaSrcId && !isSyntheticExercisePlaceholderId(metaSrcId)) {
    candidates.push({ id: metaSrcId, name: metaSrcId, source: 'metadata.sourceExerciseId' })
  }

  // Coaching meta
  const coachExId = getString(exercise, 'coachingMeta', 'exerciseId')
  if (coachExId && !isSyntheticExercisePlaceholderId(coachExId)) {
    candidates.push({ id: coachExId, name: coachExId, source: 'coachingMeta.exerciseId' })
  }

  // Flat fields (lower priority than nested)
  const flatExerciseId = getString(exercise, 'exerciseId')
  const flatCanonId = getString(exercise, 'canonicalExerciseId')
  const flatDbExId = getString(exercise, 'databaseExerciseId')
  const flatPoolExId = getString(exercise, 'poolExerciseId')
  const flatSrcExId = getString(exercise, 'sourceExerciseId')
  const flatId = getString(exercise, 'id')
  const flatName = getString(exercise, 'name')
  const flatExName = getString(exercise, 'exerciseName')

  if (flatCanonId && !isSyntheticExercisePlaceholderId(flatCanonId)) {
    candidates.push({ id: flatCanonId, name: flatName ?? flatCanonId, source: 'canonicalExerciseId' })
  }
  if (flatDbExId && !isSyntheticExercisePlaceholderId(flatDbExId)) {
    candidates.push({ id: flatDbExId, name: flatName ?? flatDbExId, source: 'databaseExerciseId' })
  }
  if (flatPoolExId && !isSyntheticExercisePlaceholderId(flatPoolExId)) {
    candidates.push({ id: flatPoolExId, name: flatName ?? flatPoolExId, source: 'poolExerciseId' })
  }
  if (flatSrcExId && !isSyntheticExercisePlaceholderId(flatSrcExId)) {
    candidates.push({ id: flatSrcExId, name: flatName ?? flatSrcExId, source: 'sourceExerciseId' })
  }
  if (flatExerciseId && !isSyntheticExercisePlaceholderId(flatExerciseId)) {
    candidates.push({ id: flatExerciseId, name: flatName ?? flatExerciseId, source: 'exerciseId' })
  }
  if (flatId && !isSyntheticExercisePlaceholderId(flatId)) {
    candidates.push({ id: flatId, name: flatName ?? flatId, source: 'id' })
  }
  // Derive from name if we have a valid name but no valid IDs yet
  if (flatName && candidates.length === 0) {
    candidates.push({ id: nameToId(flatName), name: flatName, source: 'name (derived)' })
  }
  if (flatExName && candidates.length === 0) {
    candidates.push({ id: nameToId(flatExName), name: flatExName, source: 'exerciseName (derived)' })
  }

  // If we found valid candidates, use the first one (highest priority)
  if (candidates.length > 0) {
    return { ...candidates[0], syntheticPlaceholderUsed: false }
  }

  // Fallback: use placeholder IDs even if synthetic, but flag it
  const fallbackId = flatId ?? flatExerciseId ?? `unknown_exercise_${index}`
  const fallbackName = flatName ?? flatExName ?? flatId ?? `Unknown Exercise ${index + 1}`
  return {
    id: fallbackId,
    name: fallbackName,
    source: isSyntheticExercisePlaceholderId(fallbackId) ? 'synthetic_placeholder' : 'fallback',
    syntheticPlaceholderUsed: isSyntheticExercisePlaceholderId(fallbackId),
  }
}

/**
 * Safely extracts exercise input from an unknown exercise object
 * MASTER-8C.4.F: Now uses source-aware identity extraction to avoid synthetic placeholders
 */
function extractExerciseInput(exercise: unknown, index: number): ProgramBalanceExerciseInput | null {
  if (!exercise || typeof exercise !== 'object') return null

  const ex = exercise as Record<string, unknown>

  // MASTER-8C.4.F: Use source-aware extraction for canonical identity
  const identity = extractCanonicalExerciseIdentity(ex, index)
  const id = identity.id
  const name = identity.name

  // Extract sets
  const sets = isValidNumber(ex.sets) ? ex.sets : undefined

  // Extract reps/time - try multiple possible fields
  let repsOrTime: string | number | undefined
  if (isValidNumber(ex.reps)) {
    repsOrTime = ex.reps
  } else if (isValidString(ex.reps)) {
    repsOrTime = ex.reps
  } else if (isValidNumber(ex.hold)) {
    repsOrTime = `${ex.hold}s`
  } else if (isValidNumber(ex.duration)) {
    repsOrTime = `${ex.duration}s`
  } else if (isValidNumber(ex.time)) {
    repsOrTime = `${ex.time}s`
  } else if (isValidString(ex.target)) {
    repsOrTime = ex.target
  }

  // Extract category
  const category = isValidString(ex.category) ? ex.category : undefined

  // Extract method tags - try multiple possible fields
  let methodTags: string[] | undefined
  if (isValidArray(ex.methodTags)) {
    methodTags = ex.methodTags.filter(isValidString)
  } else if (isValidString(ex.method)) {
    methodTags = [ex.method]
  } else if (isValidString(ex.methodGroup)) {
    methodTags = [ex.methodGroup]
  }

  // Extract target RPE
  const targetRpe = isValidNumber(ex.targetRpe) ? ex.targetRpe :
                    isValidNumber(ex.rpe) ? ex.rpe : undefined

  // Extract warmup/cooldown flags
  const isWarmup = ex.isWarmup === true || ex.warmup === true
  const isCooldown = ex.isCooldown === true || ex.cooldown === true

  return {
    id,
    name,
    sets,
    repsOrTime,
    category,
    methodTags,
    targetRpe,
    isWarmup,
    isCooldown,
  }
}

// =============================================================================
// SESSION EXTRACTION
// =============================================================================

/**
 * Safely extracts session input from an unknown session object
 */
function extractSessionInput(session: unknown, index: number): ProgramBalanceSessionInput | null {
  if (!session || typeof session !== 'object') return null

  const sess = session as Record<string, unknown>

  // Extract day index - try multiple possible fields
  const dayIndex = isValidNumber(sess.dayNumber) ? sess.dayNumber :
                   isValidNumber(sess.day) ? sess.day :
                   index + 1

  // Extract title/name - try multiple possible fields
  const title = isValidString(sess.dayLabel) ? sess.dayLabel :
                isValidString(sess.name) ? sess.name :
                isValidString(sess.title) ? sess.title :
                isValidString(sess.focus) ? sess.focus :
                isValidString(sess.focusLabel) ? sess.focusLabel :
                `Day ${dayIndex}`

  // Extract completed status
  const completed = sess.completed === true || sess.isCompleted === true

  // Extract exercises
  const exercisesRaw = isValidArray(sess.exercises) ? sess.exercises : []
  const exercises: ProgramBalanceExerciseInput[] = []
  for (let i = 0; i < exercisesRaw.length; i++) {
    // [MASTER-8C.4.G.1] Skip synthetic conditioning finisher placeholders
    // These are method artifacts, not real exercises, and should not be analyzed
    if (isSyntheticConditioningFinisherPlaceholder(exercisesRaw[i])) {
      continue
    }
    const extracted = extractExerciseInput(exercisesRaw[i], i)
    if (extracted) {
      exercises.push(extracted)
    }
  }

  return {
    dayIndex,
    title,
    completed,
    exercises,
  }
}

// =============================================================================
// MAIN ADAPTER
// =============================================================================

/**
 * Input arguments for the UI adapter
 */
export interface BuildProgramBalanceInputArgs {
  /** The adaptive program object (can be partial/unknown shape) */
  program: unknown
  /** Selected skill IDs from UI skill representations */
  selectedSkillIds: readonly string[]
  /** Current week number */
  currentWeekNumber?: number
}

/**
 * Builds a safe ProgramBalanceBranchInput from UI program data
 *
 * This function safely extracts data from the AdaptiveProgram without
 * assuming exact type shapes, making it resilient to program schema changes.
 */
export function buildProgramBalanceBranchInputFromProgram(
  args: BuildProgramBalanceInputArgs
): ProgramBalanceBranchInput {
  const { program, selectedSkillIds, currentWeekNumber } = args

  // Handle null/undefined program
  if (!program || typeof program !== 'object') {
    return {
      programId: undefined,
      weekNumber: currentWeekNumber,
      selectedSkillIds,
      sessions: [],
    }
  }

  const prog = program as Record<string, unknown>

  // Extract program ID
  const programId = isValidString(prog.id) ? prog.id :
                    isValidString(prog.programId) ? prog.programId : undefined

  // Extract week number
  const weekNumber = currentWeekNumber ??
                     (isValidNumber(prog.currentWeek) ? prog.currentWeek : undefined) ??
                     (isValidNumber(prog.weekNumber) ? prog.weekNumber : undefined)

  // Extract sessions
  const sessionsRaw = isValidArray(prog.sessions) ? prog.sessions : []
  const sessions: ProgramBalanceSessionInput[] = []
  for (let i = 0; i < sessionsRaw.length; i++) {
    const extracted = extractSessionInput(sessionsRaw[i], i)
    if (extracted) {
      sessions.push(extracted)
    }
  }

  // Extract optional context - MASTER-8B.5: improved foundation-source parity
  // Method summary: prefer weeklyMethodRepresentation, then fallbacks
  const existingMethodSummary = prog.weeklyMethodRepresentation ?? 
                                 prog.weeklyMethodDecisionSummary ??
                                 prog.methodMaterializationSummary ??
                                 undefined
  // Adaptive Foundation: prefer adaptiveFoundationModel (canonical), then adaptiveFoundation (legacy)
  const adaptiveFoundationSummary = prog.adaptiveFoundationModel ?? 
                                     prog.adaptiveFoundation ??
                                     undefined
  // Recovery/Stress: prefer recoveryReadiness, then stress distribution plan, then governor adjustments
  const recoveryReadinessSummary = prog.recoveryReadiness ?? 
                                    prog.weeklyStressDistributionPlan ??
                                    prog.weeklyStressGovernorAdjustments ??
                                    undefined
  const evidenceWorkoutHistorySummary = prog.evidenceHistory ?? prog.workoutHistory
  const currentPhase = isValidString(prog.phase) ? prog.phase :
                       isValidString(prog.currentPhase) ? prog.currentPhase : undefined
  const timeBudgetMinutes = isValidNumber(prog.timeBudget) ? prog.timeBudget : undefined

  return {
    programId,
    weekNumber,
    selectedSkillIds,
    sessions,
    existingMethodSummary,
    adaptiveFoundationSummary,
    recoveryReadinessSummary,
    evidenceWorkoutHistorySummary,
    currentPhase,
    timeBudgetMinutes,
  }
}

/**
 * MASTER-8C.4: Builds input with optional explicit Adaptive Foundation override
 * 
 * When the program object doesn't have adaptiveFoundationModel/adaptiveFoundation,
 * but the caller has resolved one separately (e.g., via resolveVisibleAdaptiveFoundation),
 * this allows passing it explicitly to avoid the "not linked" message.
 */
export function buildProgramBalanceBranchInputWithFoundation(
  program: unknown,
  selectedSkillIds: readonly string[],
  currentWeekNumber?: number,
  resolvedAdaptiveFoundation?: unknown,
): ProgramBalanceBranchInput {
  const base = buildProgramBalanceBranchInputFromProgram({ program, selectedSkillIds, currentWeekNumber })
  
  // If base already has adaptiveFoundationSummary, use it
  // Otherwise, use the explicit override if provided
  if (!base.adaptiveFoundationSummary && resolvedAdaptiveFoundation) {
    return {
      ...base,
      adaptiveFoundationSummary: resolvedAdaptiveFoundation,
    }
  }
  
  return base
}

/**
 * Extracts selected skill IDs from skill representation display objects
 */
export function extractSelectedSkillIdsFromRepresentations(
  representations: readonly { skill?: string | null; skillId?: string | null }[]
): string[] {
  const ids: string[] = []
  for (const rep of representations) {
    const id = rep.skill ?? rep.skillId
    if (isValidString(id)) {
      ids.push(id)
    }
  }
  return ids
}
