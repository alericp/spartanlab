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

import { getLatestAdaptiveProgram, saveAdaptiveProgram, type AdaptiveProgram } from './adaptive-program-builder'
import { getLatestProgram, type GeneratedProgram } from './program-service'
import { 
  assertProgramStateUsable, 
  markCanonicalPathUsed,
} from './production-safety'

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
