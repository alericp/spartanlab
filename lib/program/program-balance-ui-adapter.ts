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
 * Safely extracts exercise input from an unknown exercise object
 */
function extractExerciseInput(exercise: unknown, index: number): ProgramBalanceExerciseInput | null {
  if (!exercise || typeof exercise !== 'object') return null

  const ex = exercise as Record<string, unknown>

  // Extract ID - try multiple possible fields
  const id = isValidString(ex.id) ? ex.id :
             isValidString(ex.exerciseId) ? ex.exerciseId :
             isValidString(ex.name) ? ex.name.toLowerCase().replace(/\s+/g, '_') :
             `unknown_exercise_${index}`

  // Extract name - try multiple possible fields
  const name = isValidString(ex.name) ? ex.name :
               isValidString(ex.exerciseName) ? ex.exerciseName :
               isValidString(ex.exercise) && typeof ex.exercise === 'string' ? ex.exercise :
               typeof ex.exercise === 'object' && ex.exercise !== null && isValidString((ex.exercise as Record<string, unknown>).name) ? (ex.exercise as Record<string, unknown>).name as string :
               id

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
