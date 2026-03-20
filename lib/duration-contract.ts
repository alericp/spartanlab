/**
 * DURATION CONTRACT - SESSION DURATION TRUTH MODEL
 * 
 * This module defines the canonical duration semantics for SpartanLab.
 * 
 * TWO DISTINCT CONCEPTS:
 * 
 * 1. SESSION_DURATION_PREFERENCE (selectedDurationPreference)
 *    - What the user chose in onboarding/settings/builder
 *    - This is the TARGET duration for session planning
 *    - Stored in profile as sessionLengthMinutes: 30 | 45 | 60 | 90
 *    - UI labels: "30 min focused", "45 min balanced", "60 min complete", "90 min extended"
 *    - This value is STABLE and canonical - engine should not overwrite it
 * 
 * 2. ESTIMATED_SESSION_DURATION (estimatedDurationMinutes)
 *    - What the generated session is actually estimated to take
 *    - Computed from real program contents (warmup, exercises, rest, cooldown)
 *    - May vary day-to-day based on session focus, adaptive trims, recovery bias
 *    - A "60 min complete" preference may generate a ~44 min session on lighter days
 *    - This is HONEST and content-based - never faked to match preference
 * 
 * RULES:
 * - UI must NOT conflate these two concepts
 * - Settings/Builder show: selected preference (target)
 * - Day cards show: estimated actual time
 * - Regeneration reads: canonical sessionLengthMinutes from profile (not stale program metadata)
 * - Generation targets: sessionLengthMinutes preference, but actual output varies
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Valid session duration preferences (in minutes)
 */
export type SessionDurationMinutes = 30 | 45 | 60 | 75 | 90

/**
 * Session duration preference with semantic label
 */
export interface SessionDurationPreference {
  minutes: SessionDurationMinutes
  label: string
  description: string
}

/**
 * Estimated session duration computed from content
 */
export interface EstimatedSessionDuration {
  totalMinutes: number
  breakdown: {
    warmupMinutes: number
    mainWorkMinutes: number
    cooldownMinutes: number
    restMinutes: number
    finisherMinutes: number
  }
  isCompressed: boolean
  compressionReason?: string
}

// =============================================================================
// CANONICAL DURATION PREFERENCE LABELS
// =============================================================================

/**
 * Canonical labels for session duration preferences.
 * These MUST be used consistently across settings, builder, and display.
 */
export const DURATION_PREFERENCE_LABELS: Record<SessionDurationMinutes, SessionDurationPreference> = {
  30: {
    minutes: 30,
    label: '30 min focused session',
    description: 'Quick, efficient training hitting core movements',
  },
  45: {
    minutes: 45,
    label: '45 min balanced session',
    description: 'Balanced session with skill and strength work',
  },
  60: {
    minutes: 60,
    label: '60 min complete session',
    description: 'Full training with warmup, skill, strength, and cooldown',
  },
  75: {
    minutes: 75,
    label: '75 min extended session',
    description: 'Extended session with additional accessory work',
  },
  90: {
    minutes: 90,
    label: '90 min comprehensive session',
    description: 'Comprehensive training with full periodization',
  },
}

/**
 * Get the canonical label for a duration preference
 */
export function getDurationPreferenceLabel(minutes: number): string {
  const normalized = normalizeDurationMinutes(minutes)
  return DURATION_PREFERENCE_LABELS[normalized]?.label || `${minutes} min session`
}

/**
 * Get the full preference object for a duration
 */
export function getDurationPreference(minutes: number): SessionDurationPreference {
  const normalized = normalizeDurationMinutes(minutes)
  return DURATION_PREFERENCE_LABELS[normalized] || {
    minutes: normalized,
    label: `${minutes} min session`,
    description: 'Custom duration session',
  }
}

// =============================================================================
// DURATION NORMALIZATION
// =============================================================================

/**
 * Normalize a duration value to the nearest valid preference.
 * Handles legacy values and edge cases.
 */
export function normalizeDurationMinutes(minutes: number | string | null | undefined): SessionDurationMinutes {
  if (minutes === null || minutes === undefined) {
    console.log('[duration-contract] No duration provided, using default: 45')
    return 45
  }
  
  const numericMinutes = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes
  
  if (isNaN(numericMinutes)) {
    console.log('[duration-contract] Invalid duration value, using default: 45')
    return 45
  }
  
  // Map to nearest valid preference
  if (numericMinutes <= 30) return 30
  if (numericMinutes <= 45) return 45
  if (numericMinutes <= 60) return 60
  if (numericMinutes <= 75) return 75
  return 90
}

/**
 * Check if a value is a valid session duration preference
 */
export function isValidDurationPreference(minutes: number): minutes is SessionDurationMinutes {
  return [30, 45, 60, 75, 90].includes(minutes)
}

// =============================================================================
// SESSION TIME ESTIMATION
// =============================================================================

/**
 * Default time estimates per exercise category (in minutes)
 */
const EXERCISE_TIME_ESTIMATES = {
  warmup: {
    perItem: 2,
    minimum: 5,
    maximum: 12,
  },
  skill: {
    perSet: 2.5, // Includes rest
    perHold: 0.5, // Per second of isometric work
  },
  strength: {
    perSet: 3, // Includes rest (longer for heavy work)
  },
  accessory: {
    perSet: 2,
  },
  cooldown: {
    perItem: 1.5,
    minimum: 3,
    maximum: 8,
  },
  finisher: {
    density: 6,
    emom: 8,
    default: 5,
  },
}

/**
 * Estimate session duration from actual content.
 * This is the HONEST estimate based on what's in the session.
 */
export function estimateSessionDuration(session: {
  warmup?: Array<{ sets?: number }>
  exercises?: Array<{ sets?: number; category?: string; repsOrTime?: string }>
  cooldown?: Array<{ sets?: number }>
  finisher?: { durationMinutes?: number; type?: string }
}): EstimatedSessionDuration {
  let warmupMinutes = 0
  let mainWorkMinutes = 0
  let cooldownMinutes = 0
  let finisherMinutes = 0
  
  // Warmup estimation
  if (session.warmup && Array.isArray(session.warmup)) {
    const warmupItems = session.warmup.length
    warmupMinutes = Math.min(
      EXERCISE_TIME_ESTIMATES.warmup.maximum,
      Math.max(
        EXERCISE_TIME_ESTIMATES.warmup.minimum,
        warmupItems * EXERCISE_TIME_ESTIMATES.warmup.perItem
      )
    )
  } else {
    warmupMinutes = EXERCISE_TIME_ESTIMATES.warmup.minimum
  }
  
  // Main work estimation
  if (session.exercises && Array.isArray(session.exercises)) {
    for (const exercise of session.exercises) {
      const sets = exercise.sets || 3
      const category = exercise.category || 'strength'
      
      if (category === 'skill') {
        // Check if it's an isometric hold
        const repsOrTime = exercise.repsOrTime || ''
        if (repsOrTime.includes('s') || repsOrTime.includes('hold')) {
          // Isometric - use hold time estimate
          const holdSeconds = parseHoldSeconds(repsOrTime)
          mainWorkMinutes += sets * (holdSeconds / 60 + 1) // Hold time + rest
        } else {
          mainWorkMinutes += sets * EXERCISE_TIME_ESTIMATES.skill.perSet
        }
      } else if (category === 'strength') {
        mainWorkMinutes += sets * EXERCISE_TIME_ESTIMATES.strength.perSet
      } else {
        mainWorkMinutes += sets * EXERCISE_TIME_ESTIMATES.accessory.perSet
      }
    }
  }
  
  // Cooldown estimation
  if (session.cooldown && Array.isArray(session.cooldown)) {
    const cooldownItems = session.cooldown.length
    cooldownMinutes = Math.min(
      EXERCISE_TIME_ESTIMATES.cooldown.maximum,
      Math.max(
        EXERCISE_TIME_ESTIMATES.cooldown.minimum,
        cooldownItems * EXERCISE_TIME_ESTIMATES.cooldown.perItem
      )
    )
  } else {
    cooldownMinutes = EXERCISE_TIME_ESTIMATES.cooldown.minimum
  }
  
  // Finisher estimation
  if (session.finisher) {
    finisherMinutes = session.finisher.durationMinutes || 
      (session.finisher.type === 'density' ? EXERCISE_TIME_ESTIMATES.finisher.density :
       session.finisher.type === 'emom' ? EXERCISE_TIME_ESTIMATES.finisher.emom :
       EXERCISE_TIME_ESTIMATES.finisher.default)
  }
  
  // Calculate rest time (roughly 20% of main work for transitions/setup)
  const restMinutes = Math.round(mainWorkMinutes * 0.2)
  
  const totalMinutes = Math.round(
    warmupMinutes + mainWorkMinutes + cooldownMinutes + finisherMinutes + restMinutes
  )
  
  return {
    totalMinutes,
    breakdown: {
      warmupMinutes: Math.round(warmupMinutes),
      mainWorkMinutes: Math.round(mainWorkMinutes),
      cooldownMinutes: Math.round(cooldownMinutes),
      restMinutes,
      finisherMinutes: Math.round(finisherMinutes),
    },
    isCompressed: false,
  }
}

/**
 * Parse hold seconds from a repsOrTime string like "20-30s" or "30s hold"
 */
function parseHoldSeconds(repsOrTime: string): number {
  const match = repsOrTime.match(/(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return 20 // Default hold time
}

// =============================================================================
// DURATION DEVIATION HANDLING
// =============================================================================

/**
 * Calculate the deviation between target and estimated duration.
 * Returns context about why the deviation exists.
 */
export function analyzeDurationDeviation(
  targetMinutes: SessionDurationMinutes,
  estimatedMinutes: number
): {
  deviationMinutes: number
  deviationPercent: number
  isWithinExpectation: boolean
  deviationReason: string
} {
  const deviationMinutes = estimatedMinutes - targetMinutes
  const deviationPercent = Math.round((deviationMinutes / targetMinutes) * 100)
  
  // Allow +/- 20% deviation as "within expectation"
  const isWithinExpectation = Math.abs(deviationPercent) <= 20
  
  let deviationReason = ''
  if (deviationMinutes < -10) {
    deviationReason = 'This is a lighter recovery-focused session'
  } else if (deviationMinutes < -5) {
    deviationReason = 'Session optimized for efficiency'
  } else if (deviationMinutes > 10) {
    deviationReason = 'Extended session due to additional skill work'
  } else if (deviationMinutes > 5) {
    deviationReason = 'Slightly longer due to extra rest between heavy sets'
  } else {
    deviationReason = 'Session matches your target duration'
  }
  
  return {
    deviationMinutes,
    deviationPercent,
    isWithinExpectation,
    deviationReason,
  }
}

// =============================================================================
// SESSION BUDGET RESOLVER (TASK 1)
// =============================================================================

/**
 * CANONICAL SESSION BUDGET RESOLVER
 * 
 * This is THE function to use when the engine needs to know how much content
 * to generate for a session. It returns a real programming budget, not just a label.
 * 
 * This ensures:
 * - 30 min feels clearly shorter and more minimal
 * - 45 min feels balanced
 * - 60 min feels meaningfully fuller
 * - Duration label reflects actual programming behavior
 */
export interface SessionBudget {
  targetMinutes: SessionDurationMinutes
  warmup: {
    minutesBudget: number
    maxExercises: number
    phases: ('general' | 'specific' | 'activation')[]
  }
  mainWork: {
    minutesBudget: number
    minExercises: number
    maxExercises: number
    skillSlots: number      // Number of skill-focused exercise slots
    strengthSlots: number   // Number of strength/support exercise slots
    accessorySlots: number  // Number of accessory/weak-point slots
  }
  cooldown: {
    minutesBudget: number
    maxExercises: number
    includeFlexibility: boolean
  }
  finisher: {
    canInclude: boolean
    maxMinutes: number
  }
  label: string
  variant: 'focused' | 'balanced' | 'complete' | 'extended' | 'circuit_short'
}

/**
 * Resolve session budget from target duration.
 * This is the SINGLE SOURCE OF TRUTH for session content volume.
 */
export function resolveSessionBudget(targetMinutes: number): SessionBudget {
  const normalized = normalizeDurationMinutes(targetMinutes)
  
  // Log for engine diagnostics
  if (process.env.NODE_ENV !== 'production') {
    console.log('[duration-contract] resolveSessionBudget:', { input: targetMinutes, normalized })
  }
  
  switch (normalized) {
    case 30:
      return {
        targetMinutes: 30,
        warmup: {
          minutesBudget: 4,
          maxExercises: 4,
          phases: ['general', 'specific'], // No activation phase for short sessions
        },
        mainWork: {
          minutesBudget: 20,
          minExercises: 3,
          maxExercises: 4,
          skillSlots: 1,
          strengthSlots: 2,
          accessorySlots: 0, // No accessories in focused session
        },
        cooldown: {
          minutesBudget: 2,
          maxExercises: 2,
          includeFlexibility: false,
        },
        finisher: {
          canInclude: false,
          maxMinutes: 0,
        },
        label: '30 min focused session',
        variant: 'focused',
      }
      
    case 45:
      return {
        targetMinutes: 45,
        warmup: {
          minutesBudget: 5,
          maxExercises: 5,
          phases: ['general', 'specific', 'activation'],
        },
        mainWork: {
          minutesBudget: 30,
          minExercises: 4,
          maxExercises: 5,
          skillSlots: 2,
          strengthSlots: 2,
          accessorySlots: 1,
        },
        cooldown: {
          minutesBudget: 3,
          maxExercises: 3,
          includeFlexibility: true,
        },
        finisher: {
          canInclude: false,
          maxMinutes: 0,
        },
        label: '45 min balanced session',
        variant: 'balanced',
      }
      
    case 60:
      // TASK 8: Enhanced 60-min complete session
      // This should feel like a "real" complete training session with:
      // - Fuller warmup with proper skill prep
      // - Primary skill block with quality work
      // - Meaningful strength/support block
      // - Targeted accessory/core work
      // - Optional finisher for conditioning
      // - Sensible cooldown with flexibility
      return {
        targetMinutes: 60,
        warmup: {
          minutesBudget: 7,           // INCREASED for proper prep
          maxExercises: 7,            // INCREASED to allow fuller warmup
          phases: ['general', 'specific', 'activation'],
        },
        mainWork: {
          minutesBudget: 40,          // Realistic main work window
          minExercises: 5,
          maxExercises: 7,            // INCREASED for complete session feel
          skillSlots: 2,              // Primary + secondary skill work
          strengthSlots: 3,           // Weighted support + bodyweight strength
          accessorySlots: 2,          // Targeted weak point work
        },
        cooldown: {
          minutesBudget: 5,           // INCREASED for meaningful cooldown
          maxExercises: 4,            // INCREASED for flexibility goals
          includeFlexibility: true,
        },
        finisher: {
          canInclude: true,
          maxMinutes: 6,
        },
        label: '60 min complete session',
        variant: 'complete',
      }
      
    case 75:
      return {
        targetMinutes: 75,
        warmup: {
          minutesBudget: 7,
          maxExercises: 7,
          phases: ['general', 'specific', 'activation'],
        },
        mainWork: {
          minutesBudget: 52,
          minExercises: 5,
          maxExercises: 7,
          skillSlots: 3,
          strengthSlots: 3,
          accessorySlots: 2,
        },
        cooldown: {
          minutesBudget: 5,
          maxExercises: 4,
          includeFlexibility: true,
        },
        finisher: {
          canInclude: true,
          maxMinutes: 8,
        },
        label: '75 min extended session',
        variant: 'extended',
      }
      
    case 90:
    default:
      return {
        targetMinutes: 90,
        warmup: {
          minutesBudget: 8,
          maxExercises: 8,
          phases: ['general', 'specific', 'activation'],
        },
        mainWork: {
          minutesBudget: 62,
          minExercises: 6,
          maxExercises: 8,
          skillSlots: 3,
          strengthSlots: 4,
          accessorySlots: 3,
        },
        cooldown: {
          minutesBudget: 6,
          maxExercises: 4,
          includeFlexibility: true,
        },
        finisher: {
          canInclude: true,
          maxMinutes: 10,
        },
        label: '90 min comprehensive session',
        variant: 'extended',
      }
  }
}

/**
 * Get a SHORT-FORMAT budget for future 15-20 min circuit sessions.
 * TASK 7: This is a structural hook for future expansion.
 * Currently NOT used by default generation - only available for explicit short-format requests.
 */
export function resolveShortFormatBudget(targetMinutes: number): SessionBudget {
  const clampedMinutes = Math.max(15, Math.min(25, targetMinutes))
  
  return {
    targetMinutes: clampedMinutes as SessionDurationMinutes,
    warmup: {
      minutesBudget: 3,
      maxExercises: 3,
      phases: ['general', 'specific'],
    },
    mainWork: {
      minutesBudget: clampedMinutes - 5,
      minExercises: 3,
      maxExercises: 4,
      skillSlots: 1,
      strengthSlots: 2,
      accessorySlots: 0,
    },
    cooldown: {
      minutesBudget: 2,
      maxExercises: 2,
      includeFlexibility: false,
    },
    finisher: {
      canInclude: false,
      maxMinutes: 0,
    },
    label: `${clampedMinutes} min circuit session`,
    variant: 'circuit_short',
  }
}

// =============================================================================
// DEV LOGGING
// =============================================================================

/**
 * Log duration truth for debugging.
 * Only logs in development.
 */
export function logDurationTruth(
  context: string,
  data: {
    canonicalPreference?: number
    source?: string
    estimatedMinutes?: number
    fallbackUsed?: boolean
  }
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[duration-contract] ${context}:`, {
      canonicalPreference: data.canonicalPreference,
      source: data.source || 'unknown',
      estimatedMinutes: data.estimatedMinutes,
      fallbackUsed: data.fallbackUsed || false,
    })
  }
}
