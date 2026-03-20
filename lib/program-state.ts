/**
 * Unified Program State Utility
 * 
 * DO NOT DRIFT: This is the CANONICAL SOURCE OF TRUTH for program existence checks.
 * All routes MUST use getProgramState() instead of direct getLatestAdaptiveProgram() calls.
 * 
 * CRITICAL: This utility MUST NEVER throw. It always returns a safe object.
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
      
      // Ensure numeric fields have defaults
      sessionLength: program.sessionLength || 60,
      trainingDaysPerWeek: program.trainingDaysPerWeek || 3,
      currentWeekFrequency: program.currentWeekFrequency || program.trainingDaysPerWeek || 3,
      
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
    
    // Minimal diagnostic for debugging post-onboarding state
    console.log('[ProgramState] Validation result:', {
      hasUsableWorkoutProgram,
      adaptiveProgramExists: !!adaptiveProgram,
      sessionCount,
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

// =============================================================================
// TASK 1: STATE TYPE SEPARATION
// Critical distinction between profile, program, and history
// =============================================================================

export type GenerationMode = 'generate' | 'regenerate'

export interface GenerationContext {
  /** Mode: fresh generation or regeneration based on profile changes */
  mode: GenerationMode
  /** Whether a valid canonical profile exists */
  hasProfile: boolean
  /** Whether workout history exists (completed sessions) */
  hasHistory: boolean
  /** Whether an active program exists */
  hasProgram: boolean
  /** Reason for generation (for logging/auditing) */
  reason: string
  /** Whether profile has meaningfully changed since last generation */
  profileChanged: boolean
}

/**
 * TASK 6: Get explicit state flags for generation decisions
 * This ensures we never conflate missing history with missing profile
 */
export function getGenerationContext(): GenerationContext {
  const { hasProgram, adaptiveProgram } = getProgramState()
  
  // Check for canonical profile
  let hasProfile = false
  try {
    const { getCanonicalProfile } = require('./canonical-profile-service')
    const canonical = getCanonicalProfile()
    hasProfile = !!(canonical && (canonical.onboardingComplete || canonical.primaryGoal))
  } catch {
    hasProfile = false
  }
  
  // Check for workout history (completed sessions)
  // TASK 6: Check local storage for workout history evidence
  let hasHistory = false
  try {
    if (typeof window !== 'undefined') {
      // Check multiple possible workout history storage keys
      const workoutLogs = localStorage.getItem('spartanlab_workout_logs')
      const sessionHistory = localStorage.getItem('spartanlab_session_history')
      hasHistory = !!(workoutLogs || sessionHistory)
      
      // Also check training feedback loop data which requires history
      const feedbackData = localStorage.getItem('spartanlab_training_feedback')
      if (feedbackData) {
        try {
          const parsed = JSON.parse(feedbackData)
          hasHistory = hasHistory || (parsed.trustedWorkoutCount > 0)
        } catch {
          // Ignore parse errors
        }
      }
    }
  } catch {
    hasHistory = false
  }
  
  // TASK 6: Profile changed detection
  let profileChanged = true  // Default to true for safety
  if (adaptiveProgram?.profileSnapshot) {
    try {
      const { getCanonicalProfile } = require('./canonical-profile-service')
      const current = getCanonicalProfile()
      profileChanged = hasProfileChanged(adaptiveProgram.profileSnapshot, current)
    } catch {
      profileChanged = true
    }
  }
  
  // Determine generation mode
  const mode: GenerationMode = hasProgram ? 'regenerate' : 'generate'
  const reason = hasProgram 
    ? (profileChanged ? 'profile_changed' : 'manual_regenerate')
    : 'first_generation'
  
  console.log('[GenerationContext] TASK 6: State flags:', {
    hasProfile,
    hasHistory,
    hasProgram,
    profileChanged,
    mode,
    reason,
  })
  
  return {
    mode,
    hasProfile,
    hasHistory,
    hasProgram,
    reason,
    profileChanged,
  }
}

/**
 * TASK 6: Check if profile has meaningfully changed since program generation
 */
function hasProfileChanged(snapshot: unknown, current: unknown): boolean {
  if (!snapshot || !current) return true
  
  const s = snapshot as Record<string, unknown>
  const c = current as Record<string, unknown>
  
  // Check critical fields that affect programming
  const criticalFields = [
    'primaryGoal',
    'secondaryGoal',
    'trainingDaysPerWeek',
    'sessionLengthMinutes',
    'scheduleMode',
    'pullUpMax',
    'dipMax',
    'weightedPullUp',
    'weightedDip',
  ]
  
  for (const field of criticalFields) {
    if (JSON.stringify(s[field]) !== JSON.stringify(c[field])) {
      console.log('[ProfileChange] Field changed:', field, {
        snapshot: s[field],
        current: c[field],
      })
      return true
    }
  }
  
  return false
}

/**
 * TASK 7: Reset program state (clean slate) WITHOUT touching profile or history
 * This allows fresh generation without losing user data
 */
export function resetProgramState(): { success: boolean; message: string } {
  try {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Cannot reset server-side' }
    }
    
    // Only remove program data, NOT profile or history
    localStorage.removeItem('spartanlab_adaptive_programs')
    localStorage.removeItem('spartanlab_first_program')
    localStorage.removeItem('spartanlab_programs')
    
    console.log('[ProgramState] TASK 7: Program state reset (profile and history preserved)')
    
    return { success: true, message: 'Program cleared. Profile and history preserved.' }
  } catch (err) {
    console.error('[ProgramState] Reset failed:', err)
    return { success: false, message: 'Failed to reset program state' }
  }
}

/**
 * TASK 8: Check if regeneration would be meaningful
 * Prevents wasted computation when nothing has changed
 */
export function shouldRegenerate(): { 
  should: boolean
  reason: string 
} {
  const context = getGenerationContext()
  
  if (!context.hasProfile) {
    return { should: false, reason: 'No profile exists - complete onboarding first' }
  }
  
  if (!context.hasProgram) {
    return { should: true, reason: 'No program exists - generation needed' }
  }
  
  if (context.profileChanged) {
    return { should: true, reason: 'Profile has changed since last generation' }
  }
  
  return { should: false, reason: 'No meaningful changes detected - regeneration would be redundant' }
}

// =============================================================================
// TASK 10 & 11: DIAGNOSTICS AND VERIFICATION
// =============================================================================

/**
 * TASK 10: Get full state diagnostic for debugging
 * Returns all relevant state information without modifying anything
 */
export function getStateDiagnostic(): {
  profile: { exists: boolean; onboardingComplete: boolean; primaryGoal: string | null }
  program: { exists: boolean; id: string | null; sessionCount: number; profileSnapshot: boolean }
  history: { exists: boolean }
  generation: GenerationContext
} {
  const programState = getProgramState()
  const genContext = getGenerationContext()
  
  let profileInfo = { exists: false, onboardingComplete: false, primaryGoal: null as string | null }
  try {
    const { getCanonicalProfile } = require('./canonical-profile-service')
    const canonical = getCanonicalProfile()
    if (canonical) {
      profileInfo = {
        exists: true,
        onboardingComplete: !!canonical.onboardingComplete,
        primaryGoal: canonical.primaryGoal || null,
      }
    }
  } catch {
    // Profile service not available
  }
  
  const diagnostic = {
    profile: profileInfo,
    program: {
      exists: programState.hasProgram,
      id: programState.adaptiveProgram?.id || null,
      sessionCount: programState.sessionCount,
      profileSnapshot: !!(programState.adaptiveProgram as any)?.profileSnapshot,
    },
    history: {
      exists: genContext.hasHistory,
    },
    generation: genContext,
  }
  
  console.log('[StateDiagnostic] Full state:', diagnostic)
  
  return diagnostic
}

/**
 * TASK 11: Verify flow integrity
 * Checks that all expected connections between profile, program, and history are valid
 */
export function verifyStateIntegrity(): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const diagnostic = getStateDiagnostic()
  
  // Rule 1: If program exists, profile must exist
  if (diagnostic.program.exists && !diagnostic.profile.exists) {
    issues.push('INTEGRITY: Program exists but no profile found - program may be orphaned')
  }
  
  // Rule 2: If profile has onboardingComplete, profile should have primaryGoal
  if (diagnostic.profile.onboardingComplete && !diagnostic.profile.primaryGoal) {
    issues.push('INTEGRITY: Onboarding marked complete but no primary goal set')
  }
  
  // Rule 3: If program exists, it should have sessions
  if (diagnostic.program.exists && diagnostic.program.sessionCount === 0) {
    issues.push('INTEGRITY: Program exists but has no sessions')
  }
  
  // Rule 4: Warn if program exists without profile snapshot
  if (diagnostic.program.exists && !diagnostic.program.profileSnapshot) {
    issues.push('WARNING: Program exists without profile snapshot - regeneration drift may occur')
  }
  
  const valid = issues.filter(i => i.startsWith('INTEGRITY')).length === 0
  
  if (!valid) {
    console.error('[StateIntegrity] Issues detected:', issues)
  } else {
    console.log('[StateIntegrity] State is valid')
  }
  
  return { valid, issues }
}
