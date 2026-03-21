/**
 * Unified Program State Utility
 * 
 * =============================================================================
 * REGRESSION GUARD: PROGRAM SNAPSHOT CONSISTENCY (OBJECTIVE 4)
 * =============================================================================
 * 
 * DO NOT DRIFT: This is the CANONICAL SOURCE OF TRUTH for program existence checks.
 * All routes MUST use getProgramState() instead of direct getLatestAdaptiveProgram() calls.
 * 
 * CRITICAL: This utility MUST NEVER throw. It always returns a safe object.
 * 
 * RULES:
 * - Generated program, stored snapshot, dashboard summary, and program page all
 *   read from ONE consistent stored program state via getProgramState()
 * - No partial snapshot writes allowed
 * - Regenerate fully replaces current program snapshot
 * - Summary cards derive from stored current program, not stale side-state
 * - If current program is stale relative to profile, mark stale explicitly
 * 
 * DO NOT:
 * - Bypass getProgramState() with direct localStorage reads
 * - Write partial program snapshots
 * - Let dashboard show different state than program page
 * 
 * MIGRATION: This module handles backward compatibility with old storage keys:
 * - spartanlab_first_program (old onboarding key) → migrated to canonical storage
 * - spartanlab_adaptive_programs (canonical key) → preferred source of truth
 */

import { getLatestAdaptiveProgram, saveAdaptiveProgram, type AdaptiveProgram, type GenerationErrorCode } from './adaptive-program-builder'
import { getLatestProgram, type GeneratedProgram } from './program-service'
import { 
  assertProgramStateUsable, 
  markCanonicalPathUsed,
} from './production-safety'

// =============================================================================
// REBUILD RESULT CONTRACT - TASK 1
// =============================================================================
// This contract provides truthful, structured results for every build attempt.
// It answers all 7 questions from the PR goal without ambiguity.

/**
 * Status of a build/rebuild attempt.
 * - 'success': New program fully replaced the old one
 * - 'failed': Build failed at some stage, no replacement occurred
 * - 'preserved_last_good': Build failed but last good program is still available
 * - 'stale_visible_program': Visible program does not match current profile
 */
export type BuildAttemptStatus = 
  | 'success'
  | 'failed'
  | 'preserved_last_good'
  | 'stale_visible_program'

/**
 * Sub-codes that provide more detail about the failure.
 */
export type BuildAttemptSubCode =
  | 'empty_structure_days'
  | 'empty_final_session_array'
  | 'session_count_mismatch'
  | 'session_save_blocked'
  | 'assembly_unknown_failure'
  | 'empty_exercise_pool'
  | 'invalid_warmup_block'
  | 'invalid_cooldown_block'
  | 'invalid_main_block'
  | 'session_validation_failed'
  | 'normalization_failed'
  | 'display_safety_failed'
  | 'none'

/**
 * Structured result from every build/rebuild attempt.
 * TASK 1: This is the canonical contract for all generation outcomes.
 */
export interface BuildAttemptResult {
  /** Unique ID for this attempt (for logging/debugging) */
  attemptId: string
  /** When the attempt started */
  attemptedAt: string
  /** Overall status of the attempt */
  status: BuildAttemptStatus
  /** Which stage failed (if any) */
  stage: string
  /** Error code from GenerationError (if any) */
  errorCode: GenerationErrorCode | null
  /** More specific sub-code (if any) */
  subCode: BuildAttemptSubCode
  /** Whether the visible program was replaced with a new one */
  replacedVisibleProgram: boolean
  /** Whether a last good program was preserved on failure */
  preservedLastGoodProgram: boolean
  /** Whether the visible program is now stale relative to current profile */
  visibleProgramIsStale: boolean
  /** User-facing message (concise, product-grade) */
  userMessage: string
  /** Dev-facing summary with more detail */
  devSummary: string
  /** Profile signature used for this attempt */
  usedProfileSignature: string
  /** Previous program ID (if any) */
  previousProgramId: string | null
  /** New program ID (if successful) */
  newProgramId: string | null
}

/**
 * Generate a unique attempt ID.
 */
function generateAttemptId(): string {
  return `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Create a profile signature for comparison.
 * Used to detect if visible program matches current profile.
 */
export function createProfileSignature(profile: {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  scheduleMode?: string
  trainingDaysPerWeek?: number | null
  sessionLengthMinutes?: number
  selectedSkills?: string[]
}): string {
  return JSON.stringify({
    g: profile.primaryGoal || '',
    g2: profile.secondaryGoal || '',
    sm: profile.scheduleMode || '',
    td: profile.trainingDaysPerWeek || 0,
    sl: profile.sessionLengthMinutes || 0,
    sk: (profile.selectedSkills || []).sort().join(','),
  })
}

/**
 * Map error codes to user-facing messages.
 * TASK 5: Concise, stage-specific messaging.
 */
export function getErrorUserMessage(
  errorCode: GenerationErrorCode | null,
  subCode: BuildAttemptSubCode,
  hasLastGoodProgram: boolean
): string {
  const suffix = hasLastGoodProgram 
    ? ' Your previous plan is still available.' 
    : ''
  
  switch (errorCode) {
    case 'profile_validation_failed':
      return 'Complete your training profile to build a plan.'
    case 'input_resolution_failed':
      return 'Missing required settings. Check your profile.' + suffix
    case 'structure_selection_failed':
      return 'Unable to create a plan with those settings. Try adjusting your schedule or goals.' + suffix
    case 'session_assembly_failed':
      if (subCode === 'empty_exercise_pool') {
        return 'No suitable exercises found for your equipment. Check your equipment settings.' + suffix
      }
      if (subCode === 'empty_final_session_array') {
        return 'Sessions could not be built. Try different goals or schedule.' + suffix
      }
      return 'Session building stopped unexpectedly.' + suffix
    case 'warmup_generation_failed':
      return 'Warmup generation encountered an issue.' + suffix
    case 'validation_failed':
      return 'Plan validation failed. Try adjusting your settings.' + suffix
    case 'snapshot_normalization_failed':
      return 'Plan could not be prepared for display.' + suffix
    case 'snapshot_save_failed':
      if (subCode === 'session_save_blocked') {
        return 'Plan save was blocked due to validation issues.' + suffix
      }
      return 'Plan could not be saved.' + suffix
    case 'unknown_generation_failure':
    default:
      return 'Unable to create your plan. Please try again.' + suffix
  }
}

/**
 * Create a successful build result.
 */
export function createSuccessBuildResult(
  profileSignature: string,
  previousProgramId: string | null,
  newProgramId: string
): BuildAttemptResult {
  const result: BuildAttemptResult = {
    attemptId: generateAttemptId(),
    attemptedAt: new Date().toISOString(),
    status: 'success',
    stage: 'completed',
    errorCode: null,
    subCode: 'none',
    replacedVisibleProgram: true,
    preservedLastGoodProgram: false, // Not applicable on success
    visibleProgramIsStale: false,
    userMessage: 'Your new training plan is ready.',
    devSummary: `SUCCESS: Program ${newProgramId} replaced ${previousProgramId || 'none'}`,
    usedProfileSignature: profileSignature,
    previousProgramId,
    newProgramId,
  }
  
  // Log for debugging
  console.log('[program-rebuild-truth] BUILD SUCCESS:', {
    attemptId: result.attemptId,
    newProgramId,
    previousProgramId,
    replacedVisibleProgram: true,
  })
  
  return result
}

/**
 * Create a failed build result with last good program preserved.
 */
export function createFailedBuildResult(
  errorCode: GenerationErrorCode | null,
  stage: string,
  subCode: BuildAttemptSubCode,
  profileSignature: string,
  previousProgramId: string | null,
  errorMessage: string
): BuildAttemptResult {
  const hasLastGoodProgram = previousProgramId !== null
  const userMessage = getErrorUserMessage(errorCode, subCode, hasLastGoodProgram)
  
  const result: BuildAttemptResult = {
    attemptId: generateAttemptId(),
    attemptedAt: new Date().toISOString(),
    status: hasLastGoodProgram ? 'preserved_last_good' : 'failed',
    stage,
    errorCode,
    subCode,
    replacedVisibleProgram: false,
    preservedLastGoodProgram: hasLastGoodProgram,
    visibleProgramIsStale: hasLastGoodProgram, // If we have a last good program but failed to update, it's now stale
    userMessage,
    devSummary: `FAILED at ${stage} [${errorCode}/${subCode}]: ${errorMessage}. Last good: ${previousProgramId || 'none'}`,
    usedProfileSignature: profileSignature,
    previousProgramId,
    newProgramId: null,
  }
  
  // Log for debugging with searchable prefix
  console.log('[program-rebuild-error] BUILD FAILED:', {
    attemptId: result.attemptId,
    stage,
    errorCode,
    subCode,
    preservedLastGoodProgram: hasLastGoodProgram,
    visibleProgramIsStale: result.visibleProgramIsStale,
    previousProgramId,
  })
  
  if (hasLastGoodProgram) {
    console.log('[program-rebuild-fallback] Last good program preserved:', {
      programId: previousProgramId,
      message: 'User is viewing previous plan - new profile truth NOT applied',
    })
  }
  
  return result
}

/**
 * Get the most recent build attempt result from storage.
 * Used by UI to display current build status.
 */
export function getLastBuildAttemptResult(): BuildAttemptResult | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('spartanlab_last_build_result')
    if (!stored) return null
    return JSON.parse(stored) as BuildAttemptResult
  } catch {
    return null
  }
}

/**
 * Save the build attempt result to storage.
 */
export function saveLastBuildAttemptResult(result: BuildAttemptResult): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('spartanlab_last_build_result', JSON.stringify(result))
    
    // Also dispatch event for UI components to react
    window.dispatchEvent(new CustomEvent('spartanlab:build-result', { detail: result }))
  } catch (err) {
    console.error('[program-rebuild-truth] Failed to save build result:', err)
  }
}

/**
 * Clear the last build result (e.g., when user starts fresh).
 */
export function clearLastBuildAttemptResult(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('spartanlab_last_build_result')
}

// =============================================================================
// MIGRATION HELPERS - Handle old storage keys
// =============================================================================

/**
 * Attempt to recover a program from the old spartanlab_first_program key
 * and migrate it to canonical storage. This is idempotent - safe to call multiple times.
 * 
 * CRITICAL: Must validate ALL sessions before migrating to prevent saving malformed data
 */
function migrateFirstProgramIfNeeded(): AdaptiveProgram | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('spartanlab_first_program')
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    
    // Validate basic structure
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.sessions) || parsed.sessions.length === 0) return null
    
    // Validate ALL sessions have required structure before migrating
    for (let i = 0; i < parsed.sessions.length; i++) {
      const session = parsed.sessions[i]
      if (!session || typeof session !== 'object') {
        console.log(`[Migration] Session ${i} is invalid, skipping migration`)
        return null
      }
      if (!Array.isArray(session.exercises)) {
        console.log(`[Migration] Session ${i} has no exercises array, skipping migration`)
        return null
      }
      // First session must have at least one exercise
      if (i === 0 && session.exercises.length === 0) {
        console.log('[Migration] First session has no exercises, skipping migration')
        return null
      }
    }
    
    // This looks valid - save it to canonical storage
    // saveAdaptiveProgram handles deduplication by ID
    const saved = saveAdaptiveProgram(parsed)
    console.log('[Migration] Successfully migrated first_program to canonical storage')
    
    return saved
  } catch (err) {
    console.error('[Migration] Error during migration:', err)
    return null
  }
}

export interface ProgramState {
  /** Whether a usable workout program exists */
  hasProgram: boolean
  /** Whether the program has actual runnable sessions */
  hasUsableWorkoutProgram: boolean
  /** The adaptive program object (preferred) */
  adaptiveProgram: AdaptiveProgram | null
  /** The legacy program object (fallback) */
  legacyProgram: GeneratedProgram | null
  /** The active program (adaptive or legacy) */
  activeProgram: AdaptiveProgram | GeneratedProgram | null
  /** Number of sessions available */
  sessionCount: number
}

/**
 * Validate that an adaptive program is fully usable by all downstream readers
 * This checks ALL sessions, not just the first one, to prevent crashes in
 * today/week/adjustment widgets that may access any session.
 * 
 * GUARANTEED: Never throws - returns false on any error
 */
function validateAdaptiveProgramUsability(program: AdaptiveProgram | null): boolean {
  try {
    if (!program || typeof program !== 'object') return false
    if (!Array.isArray(program.sessions) || program.sessions.length === 0) return false
    
    // Validate EVERY session has required structure
    for (let i = 0; i < program.sessions.length; i++) {
      const session = program.sessions[i]
      if (!session || typeof session !== 'object') {
        console.log(`[ProgramState] Session ${i} is not a valid object`)
        return false
      }
      if (!Array.isArray(session.exercises)) {
        console.log(`[ProgramState] Session ${i} has no exercises array`)
        return false
      }
      // Note: We don't require exercises.length > 0 - an empty session is still valid structure
      // But first session should have exercises for a truly usable program
      if (i === 0 && session.exercises.length === 0) {
        console.log('[ProgramState] First session has no exercises')
        return false
      }
    }
    
    return true
  } catch (err) {
    console.error('[ProgramState] Validation error:', err)
    return false
  }
}

/** Safe default state - used when anything fails */
const SAFE_DEFAULT_STATE: ProgramState = {
  hasProgram: false,
  hasUsableWorkoutProgram: false,
  adaptiveProgram: null,
  legacyProgram: null,
  activeProgram: null,
  sessionCount: 0,
}

// =============================================================================
// PROGRAM NORMALIZATION - Crash-proof display helpers
// =============================================================================

/**
 * Check if a program is safe to render in AdaptiveProgramDisplay
 * Returns false if any critical display property could cause a crash
 * 
 * TASK 4: Enhanced display-sanity gate that validates enough fields
 * to guarantee the display layer won't explode
 */
export function isRenderableProgram(program: AdaptiveProgram | null): boolean {
  if (!program || typeof program !== 'object') return false
  if (!Array.isArray(program.sessions)) return false
  if (!program.goalLabel || typeof program.goalLabel !== 'string') return false
  if (!program.createdAt) return false
  
  // TASK 4: Validate every rendered session has minimal safe fields
  for (let i = 0; i < program.sessions.length; i++) {
    const session = program.sessions[i]
    if (!session || typeof session !== 'object') return false
    if (!Array.isArray(session.exercises)) return false
    // First session must have exercises for display to be meaningful
    if (i === 0 && session.exercises.length === 0) return false
  }
  
  return true
}

/**
 * TASK 4: Display-safe verification helper
 * Returns true only if the program is fully safe for the display layer
 * This is a stricter check than isRenderableProgram for the final sanity gate
 */
export function isProgramDisplaySafe(program: AdaptiveProgram | null): {
  safe: boolean
  reason?: string
} {
  if (!program || typeof program !== 'object') {
    return { safe: false, reason: 'program_null_or_invalid' }
  }
  if (!Array.isArray(program.sessions)) {
    return { safe: false, reason: 'sessions_not_array' }
  }
  if (program.sessions.length === 0) {
    return { safe: false, reason: 'sessions_empty' }
  }
  if (!program.goalLabel || typeof program.goalLabel !== 'string') {
    return { safe: false, reason: 'goalLabel_missing' }
  }
  if (!program.createdAt) {
    return { safe: false, reason: 'createdAt_missing' }
  }
  
  // Validate each session
  for (let i = 0; i < program.sessions.length; i++) {
    const session = program.sessions[i]
    if (!session || typeof session !== 'object') {
      return { safe: false, reason: `session_${i}_invalid` }
    }
    if (!Array.isArray(session.exercises)) {
      return { safe: false, reason: `session_${i}_exercises_not_array` }
    }
  }
  
  return { safe: true }
}

/**
 * Default values for missing nested objects in AdaptiveProgram
 * Used to prevent crashes when accessing optional properties
 */
const DEFAULT_CONSTRAINT_INSIGHT = {
  hasInsight: false,
  label: 'Training Balanced',
  category: 'none' as const,
  severity: 'low' as const,
}

const DEFAULT_STRUCTURE = {
  structureName: 'Custom Program',
  rationale: 'Personalized training structure',
  dayTypes: [],
}

const DEFAULT_ENGINE_CONTEXT = {
  plateauStatus: 'no_plateau' as const,
  strengthSupportLevel: 'unknown' as const,
  fatigueState: 'normal' as const,
  recommendations: [],
}

const DEFAULT_EQUIPMENT_PROFILE = {
  hasFullSetup: true,
  adaptationNotes: [],
  available: [],
  missing: [],
}

/**
 * Normalize a program for safe display
 * Fills in missing nested objects with safe defaults to prevent crashes
 * 
 * IMPORTANT: This does NOT validate the program is usable for workouts,
 * only that it won't crash when rendered.
 */
export function normalizeProgramForDisplay(program: AdaptiveProgram | null): AdaptiveProgram | null {
  if (!program || typeof program !== 'object') return null
  
  try {
    // Create a safe copy with defaults for all potentially missing nested objects
    const normalized: AdaptiveProgram = {
      ...program,
      // Ensure required string fields have defaults
      goalLabel: program.goalLabel || 'Training Program',
      experienceLevel: program.experienceLevel || 'intermediate',
      programRationale: program.programRationale || '',
      recoveryLevel: program.recoveryLevel || 'MODERATE',
      createdAt: program.createdAt || new Date().toISOString(),
      
      // ISSUE C FIX: Preserve actual program values - only use fallbacks for truly missing fields
      // These fallbacks are for snapshot display only, not for generation truth
      sessionLength: program.sessionLength ?? 60,  // Fallback only if truly null/undefined
      trainingDaysPerWeek: program.trainingDaysPerWeek ?? 3,  // Fallback only if truly null/undefined
      currentWeekFrequency: program.currentWeekFrequency ?? program.trainingDaysPerWeek ?? 3,
      
      // Ensure nested objects have defaults
      constraintInsight: {
        ...DEFAULT_CONSTRAINT_INSIGHT,
        ...(program.constraintInsight || {}),
      },
      structure: {
        ...DEFAULT_STRUCTURE,
        ...(program.structure || {}),
      },
      engineContext: program.engineContext ? {
        ...DEFAULT_ENGINE_CONTEXT,
        ...program.engineContext,
        recommendations: Array.isArray(program.engineContext.recommendations) 
          ? program.engineContext.recommendations 
          : [],
      } : undefined,
      equipmentProfile: program.equipmentProfile ? {
        ...DEFAULT_EQUIPMENT_PROFILE,
        ...program.equipmentProfile,
        adaptationNotes: Array.isArray(program.equipmentProfile.adaptationNotes)
          ? program.equipmentProfile.adaptationNotes
          : [],
      } : undefined,
      
      // Ensure sessions array exists and filter out invalid sessions
      sessions: Array.isArray(program.sessions) 
        ? program.sessions.filter(s => s && typeof s === 'object' && Array.isArray(s.exercises))
        : [],
    }
    
    console.log('[ProgramState] Normalized program for display:', {
      originalSessions: program.sessions?.length || 0,
      normalizedSessions: normalized.sessions.length,
      hasConstraintInsight: !!program.constraintInsight,
      hasStructure: !!program.structure,
      hasEngineContext: !!program.engineContext,
    })
    
    return normalized
  } catch (err) {
    console.error('[ProgramState] Error normalizing program:', err)
    return null
  }
}

/**
 * Get unified program state - THE canonical check for program existence
 * 
 * GUARANTEED: This function NEVER throws. It always returns a valid ProgramState object.
 * 
 * Usage:
 * const { hasProgram, activeProgram } = getProgramState()
 * if (hasProgram) { ... }
 */
export function getProgramState(): ProgramState {
  try {
    let adaptiveProgram: AdaptiveProgram | null = null
    let legacyProgram: GeneratedProgram | null = null
    
    // Step 1: Try to get from canonical adaptive storage
    try {
      adaptiveProgram = getLatestAdaptiveProgram()
    } catch {
      adaptiveProgram = null
    }
    
    // Step 2: If no adaptive program, try migration from old storage
    if (!adaptiveProgram) {
      adaptiveProgram = migrateFirstProgramIfNeeded()
    }
    
    // Step 3: Legacy program fallback (old program-service system)
    try {
      legacyProgram = getLatestProgram()
    } catch {
      legacyProgram = null
    }
    
    // Prefer adaptive program over legacy
    const activeProgram = adaptiveProgram || legacyProgram
    
    // Check if adaptive program has actual runnable sessions
    // CRITICAL: Validate ALL sessions, not just the first one, to prevent downstream crashes
    const hasUsableAdaptiveProgram = validateAdaptiveProgramUsability(adaptiveProgram)
    
    // Check if legacy program exists and has training days
    const hasUsableLegacyProgram = !!(
      legacyProgram && 
      typeof legacyProgram.trainingDaysPerWeek === 'number' &&
      legacyProgram.trainingDaysPerWeek > 0
    )
    
    // Canonical hasProgram check: must have sessions array with at least one session
    const hasProgram = hasUsableAdaptiveProgram || hasUsableLegacyProgram
    const hasUsableWorkoutProgram = hasUsableAdaptiveProgram
    
    const sessionCount = adaptiveProgram?.sessions?.length || legacyProgram?.trainingDaysPerWeek || 0
    
    // PRODUCTION SAFETY: Verify state coherence before returning
    markCanonicalPathUsed('program_read')
    const safetyCheck = assertProgramStateUsable({
      hasProgram,
      hasUsableWorkoutProgram,
      sessionCount,
      adaptiveProgram,
    })
    
    // If safety check fails and should degrade, return safe default
    if (!safetyCheck.ok && safetyCheck.shouldDegrade) {
      console.warn('[ProgramState] Safety check failed, degrading to safe default:', safetyCheck.reason)
      return SAFE_DEFAULT_STATE
    }
    
    // TASK 7: Enhanced diagnostic for debugging program snapshot state
    console.log('[ProgramState] TASK 4: getProgramState read source:', {
      source: adaptiveProgram ? 'adaptiveProgram' : legacyProgram ? 'legacyProgram' : 'none',
      hasUsableWorkoutProgram,
      adaptiveProgramExists: !!adaptiveProgram,
      sessionCount,
      programId: adaptiveProgram?.id || 'none',
      primaryGoal: adaptiveProgram?.primaryGoal || legacyProgram?.primaryGoal || 'none',
      goalLabel: adaptiveProgram?.goalLabel || 'none',
    })
    
    return {
      hasProgram,
      hasUsableWorkoutProgram,
      adaptiveProgram,
      legacyProgram,
      activeProgram,
      sessionCount,
    }
  } catch (err) {
    // Absolute safety: if anything fails, return safe default
    console.error('[ProgramState] Error in getProgramState:', err)
    return SAFE_DEFAULT_STATE
  }
}

/**
 * Simple boolean check for program existence
 * Use this for quick guards, use getProgramState() when you need the program data
 * GUARANTEED: This function NEVER throws.
 */
export function hasActiveProgram(): boolean {
  try {
    return getProgramState().hasProgram
  } catch {
    return false
  }
}
