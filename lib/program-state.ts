/**
 * Unified Program State Utility
 * 
 * SINGLE SOURCE OF TRUTH for program existence checks across the app.
 * All routes MUST use this instead of direct getLatestAdaptiveProgram() calls
 * for consistent behavior.
 * 
 * CRITICAL: This utility MUST NEVER throw. It always returns a safe object.
 * 
 * MIGRATION: This module handles backward compatibility with old storage keys:
 * - spartanlab_first_program (old onboarding key) → migrated to canonical storage
 * - spartanlab_adaptive_programs (canonical key) → preferred source of truth
 */

import { getLatestAdaptiveProgram, saveAdaptiveProgram, type AdaptiveProgram } from './adaptive-program-builder'
import { getLatestProgram, type GeneratedProgram } from './program-service'

// =============================================================================
// MIGRATION HELPERS - Handle old storage keys
// =============================================================================

/**
 * Attempt to recover a program from the old spartanlab_first_program key
 * and migrate it to canonical storage. This is idempotent - safe to call multiple times.
 */
function migrateFirstProgramIfNeeded(): AdaptiveProgram | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('spartanlab_first_program')
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    
    // Validate it looks like an AdaptiveProgram
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.sessions) || parsed.sessions.length === 0) return null
    if (!parsed.sessions[0]?.exercises || parsed.sessions[0].exercises.length === 0) return null
    
    // This looks valid - save it to canonical storage
    // saveAdaptiveProgram handles deduplication by ID
    const saved = saveAdaptiveProgram(parsed)
    
    return saved
  } catch {
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

/** Safe default state - used when anything fails */
const SAFE_DEFAULT_STATE: ProgramState = {
  hasProgram: false,
  hasUsableWorkoutProgram: false,
  adaptiveProgram: null,
  legacyProgram: null,
  activeProgram: null,
  sessionCount: 0,
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
    const hasUsableAdaptiveProgram = !!(
      adaptiveProgram && 
      Array.isArray(adaptiveProgram.sessions) && 
      adaptiveProgram.sessions.length > 0 &&
      adaptiveProgram.sessions[0]?.exercises?.length > 0
    )
    
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
    
    // Minimal diagnostic for debugging post-onboarding state
    if (!hasUsableWorkoutProgram) {
      console.log('[ProgramState] No usable workout program found')
    }
    
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
