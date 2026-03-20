/**
 * SESSION DURATION CONTRACT
 * 
 * This file defines the CANONICAL duration truth model for SpartanLab.
 * 
 * DURATION CONTRACT (TASK 1):
 * ===========================
 * There are TWO distinct duration concepts that must NEVER be conflated:
 * 
 * 1. selectedDurationPreference (sessionLengthMinutes)
 *    - What the user CHOSE in onboarding/settings/builder
 *    - Stored in canonical profile and program metadata
 *    - Examples: 30, 45, 60, 75, 90 minutes
 *    - Labels: "30 min focused", "45 min balanced", "60 min complete", etc.
 *    - This is the TARGET the user wants, not a guarantee
 * 
 * 2. estimatedSessionDurationMinutes (estimatedMinutes)
 *    - What the generated session is ACTUALLY estimated to take
 *    - Computed from: warmup + exercises + sets*reps*rest + cooldown
 *    - May differ from preference due to:
 *      - Day type (lighter recovery days)
 *      - Adaptive density logic
 *      - Available exercises for constraints
 *      - Readiness-based compression
 *    - Examples: 39, 44, 57, 62 minutes
 * 
 * UI DISPLAY RULES:
 * - Program header: Show selectedDurationPreference as "60 min complete session"
 * - Day cards: Show estimatedMinutes as "~44 min"
 * - Both can coexist - they represent different things
 * - A 60-min preference with a 44-min day is VALID (e.g., light recovery day)
 * 
 * CANONICAL SOURCE:
 * - selectedDurationPreference comes from: canonicalProfile.sessionLengthMinutes
 * - estimatedMinutes is computed by: computeEstimatedSessionDuration()
 * 
 * REGENERATION RULE:
 * - Always read selectedDurationPreference from CURRENT canonical profile
 * - Do NOT read stale duration from old program metadata
 * - Program.sessionLength reflects preference AT GENERATION TIME (for history)
 */

// =============================================================================
// DURATION PREFERENCE TYPES
// =============================================================================

// TASK 1 & 7: Canonical duration tiers including future short-format support
export type SessionDurationPreference = 15 | 20 | 30 | 45 | 60 | 75 | 90

export interface DurationPreferenceLabel {
  value: SessionDurationPreference
  label: string
  shortLabel: string
  description: string
  isShortFormat?: boolean  // TASK 7: Flag for circuit/round-based sessions
}

export const DURATION_PREFERENCE_LABELS: Record<SessionDurationPreference, DurationPreferenceLabel> = {
  // TASK 7: Short format tiers (dormant - not exposed in UI yet)
  15: {
    value: 15,
    label: '15 min quick circuit',
    shortLabel: '15 min',
    description: 'Fast circuit or EMOM format',
    isShortFormat: true,
  },
  20: {
    value: 20,
    label: '20 min skill focus',
    shortLabel: '20 min',
    description: 'Focused skill work or conditioning circuit',
    isShortFormat: true,
  },
  30: {
    value: 30,
    label: '30 min focused session',
    shortLabel: '30 min',
    description: 'Essential skill and strength work only',
  },
  45: {
    value: 45,
    label: '45 min balanced session',
    shortLabel: '45 min',
    description: 'Core training with limited accessories',
  },
  60: {
    value: 60,
    label: '60 min complete session',
    shortLabel: '60 min',
    description: 'Full session with all components',
  },
  75: {
    value: 75,
    label: '75 min extended session',
    shortLabel: '75 min',
    description: 'Extended session with extra volume',
  },
  90: {
    value: 90,
    label: '90 min comprehensive session',
    shortLabel: '90 min',
    description: 'Maximum volume with full accessory work',
  },
}

// =============================================================================
// DURATION ESTIMATION CONSTANTS
// =============================================================================

const EXERCISE_TIME_ESTIMATES = {
  warmup: 1.5,
  skill: 6,
  strength: 5,
  push: 4,
  pull: 4,
  accessory: 3,
  core: 3,
  mobility: 2,
  cooldown: 1.5,
  conditioning: 4,
  finisher: 5,
} as const

const BLOCK_OVERHEAD = {
  warmup: 2,
  main: 1,
  cooldown: 1,
} as const

// =============================================================================
// DURATION ESTIMATION FUNCTIONS (TASK 4)
// =============================================================================

interface SessionForEstimation {
  warmup?: { length: number }[]
  exercises?: { category?: string; sets?: number }[]
  cooldown?: { length: number }[]
  finisher?: { durationMinutes?: number }
}

export function computeEstimatedSessionDuration(session: SessionForEstimation): number {
  let totalMinutes = 0
  
  if (session.warmup?.length) {
    totalMinutes += BLOCK_OVERHEAD.warmup
    totalMinutes += session.warmup.length * EXERCISE_TIME_ESTIMATES.warmup
  }
  
  if (session.exercises?.length) {
    totalMinutes += BLOCK_OVERHEAD.main
    for (const exercise of session.exercises) {
      const category = (exercise.category || 'strength').toLowerCase()
      const timeEstimate = EXERCISE_TIME_ESTIMATES[category as keyof typeof EXERCISE_TIME_ESTIMATES] 
        || EXERCISE_TIME_ESTIMATES.strength
      const setMultiplier = Math.max(1, (exercise.sets || 3) / 3)
      totalMinutes += timeEstimate * setMultiplier
    }
  }
  
  if (session.cooldown?.length) {
    totalMinutes += BLOCK_OVERHEAD.cooldown
    totalMinutes += session.cooldown.length * EXERCISE_TIME_ESTIMATES.cooldown
  }
  
  if (session.finisher?.durationMinutes) {
    totalMinutes += session.finisher.durationMinutes
  }
  
  return Math.round(totalMinutes)
}

// =============================================================================
// DURATION DISPLAY HELPERS (TASK 5)
// =============================================================================

export function formatDurationPreference(minutes: number): string {
  const preference = DURATION_PREFERENCE_LABELS[minutes as SessionDurationPreference]
  if (preference) {
    return preference.label
  }
  return `${minutes} min session`
}

export function formatEstimatedDuration(minutes: number): string {
  return `~${minutes} min`
}

export function getDurationShortLabel(minutes: number): string {
  const preference = DURATION_PREFERENCE_LABELS[minutes as SessionDurationPreference]
  return preference?.shortLabel || `${minutes} min`
}

// =============================================================================
// DURATION VALIDATION (TASK 8)
// =============================================================================

const DEFAULT_DURATION_PREFERENCE: SessionDurationPreference = 60

// TASK 1: Canonical duration resolver - single source of truth
export function getCanonicalDurationPreference(
  profileMinutes: number | null | undefined,
  source: string = 'unknown'
): SessionDurationPreference {
  // TASK 7: All valid tiers including short format (15, 20 are dormant)
  const validPreferences: SessionDurationPreference[] = [15, 20, 30, 45, 60, 75, 90]
  
  if (profileMinutes && validPreferences.includes(profileMinutes as SessionDurationPreference)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DurationContract] TASK 1: Loaded preference: ${profileMinutes} min from ${source}`)
    }
    return profileMinutes as SessionDurationPreference
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[DurationContract] TASK 1: FALLBACK to ${DEFAULT_DURATION_PREFERENCE} min (missing from ${source})`)
  }
  return DEFAULT_DURATION_PREFERENCE
}

// =============================================================================
// TASK 1: UNIFIED SESSION BUDGET RESOLVER
// Single function that returns real programming budget, not just a label
// =============================================================================

export interface SessionBudget {
  durationMinutes: SessionDurationPreference
  label: string
  volumeTargets: DurationVolumeTargets
  warmupDepth: 'minimal' | 'standard' | 'extended'
  includeAccessories: boolean
  includeCooldown: boolean
  includeCompression: boolean
  isShortFormat: boolean
  formatStyle: 'standard' | 'circuit' | 'emom' | 'amrap'
}

/**
 * TASK 1: Resolves session duration to a real programming budget.
 * This is the single source of truth for how duration affects session content.
 */
export function resolveSessionBudget(
  durationMinutes: SessionDurationPreference
): SessionBudget {
  const label = DURATION_PREFERENCE_LABELS[durationMinutes]?.label || `${durationMinutes} min session`
  const volumeTargets = getVolumeTargetsForDuration(durationMinutes)
  const isShortFormat = durationMinutes <= 20
  
  // Determine warmup depth based on duration
  let warmupDepth: SessionBudget['warmupDepth'] = 'standard'
  if (durationMinutes <= 20) warmupDepth = 'minimal'
  else if (durationMinutes >= 75) warmupDepth = 'extended'
  
  // Determine what components to include
  const includeAccessories = durationMinutes >= 45
  const includeCooldown = durationMinutes >= 30
  const includeCompression = durationMinutes >= 45
  
  // Short format sessions default to circuit style
  const formatStyle = isShortFormat ? 'circuit' : 'standard'
  
  const budget: SessionBudget = {
    durationMinutes,
    label,
    volumeTargets,
    warmupDepth,
    includeAccessories,
    includeCooldown,
    includeCompression,
    isShortFormat,
    formatStyle,
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[DurationContract] TASK 1: Resolved session budget:', {
      duration: durationMinutes,
      warmupDepth,
      mainExercises: volumeTargets.mainExerciseCount,
      totalSets: volumeTargets.totalSetsBudget,
      includeAccessories,
      isShortFormat,
    })
  }
  
  return budget
}

// =============================================================================
// TASK 5: DURATION-BASED VOLUME TARGETS
// These targets ensure actual content scales with selected duration
// =============================================================================

export interface DurationVolumeTargets {
  warmupExerciseCount: { min: number; max: number }
  mainExerciseCount: { min: number; max: number }
  accessoryExerciseCount: { min: number; max: number }
  cooldownExerciseCount: { min: number; max: number }
  skillSetsPerExercise: { min: number; max: number }
  strengthSetsPerExercise: { min: number; max: number }
  totalSetsBudget: { min: number; max: number }
}

export const DURATION_VOLUME_TARGETS: Record<SessionDurationPreference, DurationVolumeTargets> = {
  // TASK 7: Short format tiers - minimal but intentional
  15: {
    warmupExerciseCount: { min: 2, max: 3 },
    mainExerciseCount: { min: 2, max: 3 },
    accessoryExerciseCount: { min: 0, max: 0 },
    cooldownExerciseCount: { min: 1, max: 2 },
    skillSetsPerExercise: { min: 2, max: 3 },
    strengthSetsPerExercise: { min: 2, max: 2 },
    totalSetsBudget: { min: 6, max: 10 },
  },
  20: {
    warmupExerciseCount: { min: 3, max: 4 },
    mainExerciseCount: { min: 2, max: 3 },
    accessoryExerciseCount: { min: 0, max: 1 },
    cooldownExerciseCount: { min: 2, max: 3 },
    skillSetsPerExercise: { min: 3, max: 3 },
    strengthSetsPerExercise: { min: 2, max: 3 },
    totalSetsBudget: { min: 8, max: 12 },
  },
  30: {
    warmupExerciseCount: { min: 4, max: 6 },
    mainExerciseCount: { min: 2, max: 3 },
    accessoryExerciseCount: { min: 0, max: 1 },
    cooldownExerciseCount: { min: 2, max: 3 },
    skillSetsPerExercise: { min: 3, max: 4 },
    strengthSetsPerExercise: { min: 2, max: 3 },
    totalSetsBudget: { min: 10, max: 15 },
  },
  45: {
    warmupExerciseCount: { min: 5, max: 7 },
    mainExerciseCount: { min: 3, max: 4 },
    accessoryExerciseCount: { min: 1, max: 2 },
    cooldownExerciseCount: { min: 3, max: 4 },
    skillSetsPerExercise: { min: 3, max: 5 },
    strengthSetsPerExercise: { min: 3, max: 4 },
    totalSetsBudget: { min: 15, max: 22 },
  },
  60: {
    warmupExerciseCount: { min: 6, max: 9 },
    mainExerciseCount: { min: 4, max: 5 },
    accessoryExerciseCount: { min: 2, max: 3 },
    cooldownExerciseCount: { min: 4, max: 5 },
    skillSetsPerExercise: { min: 4, max: 5 },
    strengthSetsPerExercise: { min: 3, max: 4 },
    totalSetsBudget: { min: 22, max: 30 },
  },
  75: {
    warmupExerciseCount: { min: 7, max: 10 },
    mainExerciseCount: { min: 5, max: 6 },
    accessoryExerciseCount: { min: 3, max: 4 },
    cooldownExerciseCount: { min: 4, max: 6 },
    skillSetsPerExercise: { min: 4, max: 6 },
    strengthSetsPerExercise: { min: 4, max: 5 },
    totalSetsBudget: { min: 28, max: 38 },
  },
  90: {
    warmupExerciseCount: { min: 8, max: 12 },
    mainExerciseCount: { min: 6, max: 8 },
    accessoryExerciseCount: { min: 4, max: 5 },
    cooldownExerciseCount: { min: 5, max: 7 },
    skillSetsPerExercise: { min: 5, max: 6 },
    strengthSetsPerExercise: { min: 4, max: 5 },
    totalSetsBudget: { min: 35, max: 48 },
  },
}

/**
 * Get volume targets for a given duration preference.
 * TASK 5: Ensures actual content scales with selected duration.
 */
export function getVolumeTargetsForDuration(minutes: SessionDurationPreference): DurationVolumeTargets {
  return DURATION_VOLUME_TARGETS[minutes] || DURATION_VOLUME_TARGETS[60]
}

// =============================================================================
// TASK 10: FUTURE SHORT FORMAT HOOKS
// Architectural preparation for 15-20 min circuit/round-based styles
// NOT exposed in UI - internal engine hooks only
// =============================================================================

export type SessionFormat = 'standard' | 'circuit' | 'emom' | 'amrap'

export interface ShortFormatConfig {
  format: SessionFormat
  durationMinutes: 15 | 20
  roundCount: number
  restBetweenRounds: number  // seconds
  exercisesPerRound: number
  workInterval?: number  // for EMOM/interval formats
  restInterval?: number
}

export const SHORT_FORMAT_PRESETS: Record<string, ShortFormatConfig> = {
  quick_circuit_15: {
    format: 'circuit',
    durationMinutes: 15,
    roundCount: 3,
    restBetweenRounds: 60,
    exercisesPerRound: 4,
  },
  emom_skill_20: {
    format: 'emom',
    durationMinutes: 20,
    roundCount: 20,  // 20 minutes = 20 rounds
    restBetweenRounds: 0,
    exercisesPerRound: 1,
    workInterval: 40,
    restInterval: 20,
  },
  amrap_conditioning_15: {
    format: 'amrap',
    durationMinutes: 15,
    roundCount: 1,  // continuous
    restBetweenRounds: 0,
    exercisesPerRound: 4,
  },
}

// Placeholder for future implementation
export function isShortFormatSupported(): boolean {
  return false  // Not yet exposed in UI
}

// =============================================================================
// DEV LOGGING (TASK 9)
// =============================================================================

export function logDurationState(context: {
  source: string
  preference: number | null | undefined
  estimatedMinutes?: number
  dayNumber?: number
  wasComputed?: boolean
}): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const { source, preference, estimatedMinutes, dayNumber, wasComputed } = context
  
  console.log(`[DurationContract] ${source}:`, {
    selectedPreference: preference ? `${preference} min` : 'NOT SET',
    estimatedDuration: estimatedMinutes ? `~${estimatedMinutes} min` : 'N/A',
    dayNumber: dayNumber ?? 'N/A',
    wasComputed: wasComputed ?? false,
  })
}
