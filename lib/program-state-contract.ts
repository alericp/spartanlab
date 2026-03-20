/**
 * PROGRAM STATE CONTRACT
 * 
 * =============================================================================
 * REGRESSION GUARD: STATE SEPARATION IS LOAD-BEARING ARCHITECTURE
 * =============================================================================
 * 
 * This file defines the clear separation between:
 * 1. CANONICAL PROFILE - User's onboarding + metrics truth (source of truth)
 * 2. ACTIVE PROGRAM - Current generated plan being followed
 * 3. PROGRAM SNAPSHOT - Frozen copy of profile used at generation time
 * 4. WORKOUT HISTORY - Completed sessions only
 * 
 * REGRESSION PREVENTION RULES:
 * - Program generation MUST ALWAYS use canonical profile via buildGenerationInput()
 * - NEVER read from stale program.profileSnapshot for new generation inputs
 * - NEVER let active program metadata override canonical profile values
 * - Snapshots are for debugging and staleness detection ONLY, not for generation
 * 
 * STATE LIFECYCLE:
 * - Fresh generation: canonical profile -> generateAdaptiveProgram() -> active program + snapshot
 * - Regeneration: canonical profile (current truth) -> new program (old snapshot becomes stale)
 * - Restart: archive active program -> clear state -> return to builder-ready
 * 
 * If you need to detect staleness, use checkProgramStaleness() from canonical-profile-service.ts
 */

import { getCanonicalProfile, validateProfileForGeneration, type CanonicalProgrammingProfile } from './canonical-profile-service'
import { getProgramState } from './program-state'
import type { AdaptiveProgram } from './adaptive-program-builder'

// =============================================================================
// STATE TYPE DEFINITIONS
// =============================================================================

/**
 * Generation mode determines how the engine treats previous data.
 */
export type GenerationMode = 'fresh' | 'regenerate' | 'continue'

/**
 * Flags that describe current system state.
 */
export interface SystemStateFlags {
  /** Whether a canonical profile exists with required data */
  hasProfile: boolean
  /** Whether workout history exists */
  hasHistory: boolean
  /** Whether an active program exists */
  hasProgram: boolean
  /** Whether profile data has changed since last generation */
  profileChanged: boolean
  /** Generation mode recommendation */
  recommendedMode: GenerationMode
}

/**
 * Profile snapshot taken at program generation time.
 * Allows debugging and prevents stale data contamination.
 */
export interface ProfileSnapshot {
  /** Snapshot ID for tracking */
  snapshotId: string
  /** Timestamp when snapshot was taken */
  createdAt: string
  /** Key profile fields at generation time */
  primaryGoal: string | null
  secondaryGoal: string | null
  experienceLevel: string
  trainingDaysPerWeek: number | null
  sessionLengthMinutes: number
  scheduleMode: string
  equipmentAvailable: string[]
  jointCautions: string[]
  selectedSkills: string[]
  /** Strength benchmarks at generation time */
  strengthBenchmarks: {
    pullUpMax: string | null
    dipMax: string | null
    pushUpMax: string | null
    weightedPullUp: { addedWeight: number; reps: number } | null
    weightedDip: { addedWeight: number; reps: number } | null
  }
  /** Skill progressions at generation time */
  skillProgressions: {
    frontLever: string | null
    planche: string | null
    hspu: string | null
  }
}

/**
 * Generation input that combines canonical profile with generation context.
 */
export interface GenerationInput {
  /** The canonical profile (source of truth) */
  profile: CanonicalProgrammingProfile
  /** Generation mode */
  mode: GenerationMode
  /** Profile snapshot for debugging */
  profileSnapshot: ProfileSnapshot
  /** Whether this is an explicit user request */
  isUserInitiated: boolean
  /** Optional: reason for regeneration */
  regenerationReason?: string
  /** Optional: workout history context for regenerate mode */
  historyContext?: {
    completedSessionCount: number
    lastWorkoutDate: string | null
    fatigueLevel: 'low' | 'normal' | 'high'
  }
}

// =============================================================================
// STATE DETECTION FUNCTIONS
// =============================================================================

/**
 * Get current system state flags.
 * Use this to determine appropriate generation mode.
 */
export function getSystemStateFlags(): SystemStateFlags {
  const profile = getCanonicalProfile()
  const profileValidation = validateProfileForGeneration(profile)
  const programState = getProgramState()
  
  const hasProfile = profileValidation.isValid
  const hasHistory = getWorkoutHistoryCount() > 0
  const hasProgram = programState.hasProgram
  
  // Check if profile has changed since last generation
  const profileChanged = hasProgram ? hasProfileChangedSinceGeneration(profile, programState.adaptiveProgram) : true
  
  // Determine recommended mode
  let recommendedMode: GenerationMode = 'fresh'
  if (hasProgram && !profileChanged) {
    recommendedMode = 'continue'
  } else if (hasProgram && profileChanged) {
    recommendedMode = 'regenerate'
  } else {
    recommendedMode = 'fresh'
  }
  
  // Log state for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[StateContract] System state flags:', {
      hasProfile,
      hasHistory,
      hasProgram,
      profileChanged,
      recommendedMode,
    })
  }
  
  return {
    hasProfile,
    hasHistory,
    hasProgram,
    profileChanged,
    recommendedMode,
  }
}

/**
 * Get workout history count (helper).
 */
function getWorkoutHistoryCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const history = localStorage.getItem('spartanlab_workout_history')
    if (!history) return 0
    const parsed = JSON.parse(history)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

/**
 * Check if profile has meaningfully changed since last generation.
 */
function hasProfileChangedSinceGeneration(
  currentProfile: CanonicalProgrammingProfile,
  activeProgram: AdaptiveProgram | null
): boolean {
  if (!activeProgram) return true
  
  // Check key fields that affect program structure
  const keyFieldsChanged = [
    currentProfile.primaryGoal !== activeProgram.primaryGoal,
    currentProfile.secondaryGoal !== (activeProgram as unknown as { secondaryGoal?: string }).secondaryGoal,
    currentProfile.trainingDaysPerWeek !== activeProgram.trainingDaysPerWeek,
    currentProfile.sessionLengthMinutes !== activeProgram.sessionLength,
    currentProfile.scheduleMode !== (activeProgram as unknown as { scheduleMode?: string }).scheduleMode,
    JSON.stringify(currentProfile.equipmentAvailable?.sort()) !== JSON.stringify((activeProgram.equipment || []).sort()),
    JSON.stringify(currentProfile.jointCautions?.sort()) !== JSON.stringify((activeProgram.jointCautions || []).sort()),
  ]
  
  return keyFieldsChanged.some(changed => changed)
}

// =============================================================================
// GENERATION INPUT BUILDER
// =============================================================================

/**
 * Build the canonical generation input.
 * 
 * CRITICAL: This function ALWAYS uses the current canonical profile.
 * It NEVER reads from stale program data.
 * 
 * @param mode - Generation mode ('fresh', 'regenerate', 'continue')
 * @param isUserInitiated - Whether user explicitly requested generation
 * @param regenerationReason - Optional reason for regeneration
 */
export function buildGenerationInput(
  mode: GenerationMode,
  isUserInitiated: boolean = true,
  regenerationReason?: string
): GenerationInput {
  // CRITICAL: Always get CURRENT canonical profile
  const profile = getCanonicalProfile()
  
  // CRITICAL: Validate profile before proceeding
  const validation = validateProfileForGeneration(profile)
  if (!validation.isValid) {
    throw new Error(`[StateContract] Cannot generate: Missing required profile data: ${validation.missingFields.join(', ')}`)
  }
  
  // Create snapshot for debugging and traceability
  const profileSnapshot = createProfileSnapshot(profile)
  
  // Get history context if regenerating
  let historyContext: GenerationInput['historyContext'] = undefined
  if (mode === 'regenerate') {
    historyContext = getHistoryContext()
  }
  
  // Log generation input for diagnostics
  console.log('[StateContract] GENERATION INPUT:', {
    mode,
    isUserInitiated,
    regenerationReason,
    profile: {
      primaryGoal: profile.primaryGoal,
      secondaryGoal: profile.secondaryGoal,
      experienceLevel: profile.experienceLevel,
      scheduleMode: profile.scheduleMode,
      sessionLengthMinutes: profile.sessionLengthMinutes,
    },
    hasHistoryContext: !!historyContext,
  })
  
  return {
    profile,
    mode,
    profileSnapshot,
    isUserInitiated,
    regenerationReason,
    historyContext,
  }
}

/**
 * Create a profile snapshot for traceability.
 */
function createProfileSnapshot(profile: CanonicalProgrammingProfile): ProfileSnapshot {
  return {
    snapshotId: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    experienceLevel: profile.experienceLevel,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    scheduleMode: profile.scheduleMode,
    equipmentAvailable: profile.equipmentAvailable || [],
    jointCautions: profile.jointCautions || [],
    selectedSkills: profile.selectedSkills || [],
    strengthBenchmarks: {
      pullUpMax: profile.pullUpMax,
      dipMax: profile.dipMax,
      pushUpMax: profile.pushUpMax,
      weightedPullUp: profile.weightedPullUp,
      weightedDip: profile.weightedDip,
    },
    skillProgressions: {
      frontLever: profile.frontLeverProgression,
      planche: profile.plancheProgression,
      hspu: profile.hspuProgression,
    },
  }
}

/**
 * Get history context for regeneration mode.
 */
function getHistoryContext(): GenerationInput['historyContext'] {
  if (typeof window === 'undefined') return undefined
  
  try {
    const history = localStorage.getItem('spartanlab_workout_history')
    if (!history) return undefined
    
    const parsed = JSON.parse(history)
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined
    
    // Get most recent workout
    const sorted = parsed.sort((a: { completedAt?: string }, b: { completedAt?: string }) => {
      const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return bDate - aDate
    })
    
    const lastWorkout = sorted[0]
    
    return {
      completedSessionCount: parsed.length,
      lastWorkoutDate: lastWorkout?.completedAt || null,
      fatigueLevel: estimateFatigueLevel(parsed),
    }
  } catch {
    return undefined
  }
}

/**
 * Estimate fatigue level from recent workout history.
 */
function estimateFatigueLevel(history: Array<{ completedAt?: string }>): 'low' | 'normal' | 'high' {
  if (!history || history.length === 0) return 'normal'
  
  // Count workouts in last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentCount = history.filter(w => {
    const date = w.completedAt ? new Date(w.completedAt).getTime() : 0
    return date > sevenDaysAgo
  }).length
  
  if (recentCount >= 6) return 'high'
  if (recentCount >= 4) return 'normal'
  return 'low'
}

// =============================================================================
// CLEAN SLATE FUNCTIONS
// =============================================================================

/**
 * Reset program state (safe reset).
 * DOES NOT delete profile or history.
 * Only clears active program to trigger fresh generation.
 */
export function resetProgramState(): void {
  if (typeof window === 'undefined') return
  
  console.log('[StateContract] Resetting program state (safe reset)')
  
  // Clear active program
  localStorage.removeItem('spartanlab_adaptive_programs')
  localStorage.removeItem('spartanlab_adaptive_program')
  localStorage.removeItem('spartanlab_first_program')
  localStorage.removeItem('spartanlab_program_cache')
  
  // Set recalculation flag
  localStorage.setItem('spartanlab_program_recalc_pending', 'true')
  localStorage.setItem('spartanlab_program_recalc_time', new Date().toISOString())
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('spartanlab:program-reset'))
}

/**
 * Full reset (requires confirmation).
 * Deletes program AND profile AND history.
 * Use with extreme caution.
 */
export function fullSystemReset(): void {
  if (typeof window === 'undefined') return
  
  console.log('[StateContract] FULL SYSTEM RESET')
  
  // Clear everything
  const keysToRemove = [
    'spartanlab_adaptive_programs',
    'spartanlab_adaptive_program',
    'spartanlab_first_program',
    'spartanlab_program_cache',
    'spartanlab_athlete_profile',
    'spartanlab_onboarding_profile',
    'spartanlab_canonical_profile',
    'spartanlab_workout_history',
    'spartanlab_completed_workouts',
    'spartanlab_program_recalc_pending',
  ]
  
  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('spartanlab:full-reset'))
}

// =============================================================================
// CREDIT WASTE PREVENTION
// =============================================================================

/**
 * Check if regeneration should be skipped (no meaningful change).
 * Use this before consuming generation credits.
 */
export function shouldSkipRegeneration(): {
  shouldSkip: boolean
  reason: string
} {
  const flags = getSystemStateFlags()
  
  if (!flags.hasProfile) {
    return { shouldSkip: true, reason: 'No profile - cannot generate' }
  }
  
  if (flags.hasProgram && !flags.profileChanged) {
    return { shouldSkip: true, reason: 'No meaningful profile changes since last generation' }
  }
  
  return { shouldSkip: false, reason: 'Generation should proceed' }
}

// =============================================================================
// DEV DIAGNOSTICS
// =============================================================================

/**
 * Log comprehensive state diagnostics (dev only).
 */
export function logStateDiagnostics(): void {
  if (process.env.NODE_ENV === 'production') return
  
  const flags = getSystemStateFlags()
  const profile = getCanonicalProfile()
  const programState = getProgramState()
  
  console.group('[StateContract] DIAGNOSTICS')
  console.log('System State Flags:', flags)
  console.log('Canonical Profile:', {
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    experienceLevel: profile.experienceLevel,
    scheduleMode: profile.scheduleMode,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    equipmentCount: profile.equipmentAvailable?.length || 0,
    jointCautionsCount: profile.jointCautions?.length || 0,
    selectedSkillsCount: profile.selectedSkills?.length || 0,
  })
  console.log('Program State:', {
    hasProgram: programState.hasProgram,
    hasUsableWorkoutProgram: programState.hasUsableWorkoutProgram,
    sessionCount: programState.sessionCount,
    programGoal: programState.adaptiveProgram?.primaryGoal || 'none',
  })
  console.groupEnd()
}

// Export types
export type { CanonicalProgrammingProfile } from './canonical-profile-service'
