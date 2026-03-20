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

export type SessionDurationPreference = 30 | 45 | 60 | 75 | 90

export interface DurationPreferenceLabel {
  value: SessionDurationPreference
  label: string
  shortLabel: string
  description: string
}

export const DURATION_PREFERENCE_LABELS: Record<SessionDurationPreference, DurationPreferenceLabel> = {
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

export function getCanonicalDurationPreference(
  profileMinutes: number | null | undefined,
  source: string = 'unknown'
): SessionDurationPreference {
  const validPreferences: SessionDurationPreference[] = [30, 45, 60, 75, 90]
  
  if (profileMinutes && validPreferences.includes(profileMinutes as SessionDurationPreference)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DurationContract] Loaded preference: ${profileMinutes} min from ${source}`)
    }
    return profileMinutes as SessionDurationPreference
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[DurationContract] FALLBACK: Using ${DEFAULT_DURATION_PREFERENCE} min (missing from ${source})`)
  }
  return DEFAULT_DURATION_PREFERENCE
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
