/**
 * Workout Reasoning Display Contract
 * 
 * Creates a display-safe version of workout reasoning for UI rendering.
 * This contract NEVER throws and guarantees all fields used by WhyThisWorkout
 * and related components have safe default values.
 * 
 * [DISPLAY-CONTRACT] This is DISPLAY-ONLY. It does not mutate generation truth.
 */

// =============================================================================
// SAFE EXTRACTION HELPERS - NEVER THROW
// =============================================================================

function safeString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value === 'string' && allowed.includes(value as T)) return value as T
  return fallback
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function safeObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

// =============================================================================
// DISPLAY CONTRACT TYPES
// =============================================================================

export type ReasoningConfidence = 'low' | 'moderate' | 'high'
export type DataQuality = 'sparse' | 'developing' | 'solid'
export type SessionType = 'skill' | 'strength' | 'mixed' | 'deload' | 'recovery'

export interface LimiterDisplay {
  label: string
  explanation: string
}

export interface FrameworkInfluenceDisplay {
  influence: string
}

export interface EnvelopeInfluenceDisplay {
  adaptations: string[]
}

export interface WorkoutReasoningDisplayContract {
  /** Main explanation for why this workout */
  whyThisWorkout: string
  /** Primary focus area */
  workoutFocus: string
  /** Session type for icon selection */
  sessionType: SessionType
  /** Confidence level */
  reasoningConfidence: ReasoningConfidence
  /** Data quality indicator */
  dataQuality: DataQuality
  /** Primary limiter info */
  primaryLimiter: LimiterDisplay
  /** Secondary limiter (null if not present) */
  secondaryLimiter: LimiterDisplay | null
  /** Framework influence (null if not present) */
  frameworkInfluence: FrameworkInfluenceDisplay | null
  /** Envelope influence (null if not present) */
  envelopeInfluence: EnvelopeInfluenceDisplay | null
}

// =============================================================================
// VALID ENUM VALUES
// =============================================================================

const VALID_CONFIDENCE: readonly ReasoningConfidence[] = ['low', 'moderate', 'high']
const VALID_DATA_QUALITY: readonly DataQuality[] = ['sparse', 'developing', 'solid']
const VALID_SESSION_TYPE: readonly SessionType[] = ['skill', 'strength', 'mixed', 'deload', 'recovery']

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_WHY_THIS_WORKOUT = 'This workout was loaded successfully.'
const DEFAULT_WORKOUT_FOCUS = 'Adaptive Session'
const DEFAULT_SESSION_TYPE: SessionType = 'mixed'
const DEFAULT_CONFIDENCE: ReasoningConfidence = 'low'
const DEFAULT_DATA_QUALITY: DataQuality = 'sparse'

const DEFAULT_PRIMARY_LIMITER: LimiterDisplay = {
  label: 'Current training priority',
  explanation: 'Your workout is ready. Continue building your training history for more personalized insights.',
}

// =============================================================================
// MAIN CONTRACT BUILDER
// =============================================================================

/**
 * Builds a display-safe workout reasoning contract from any input.
 * 
 * This function NEVER throws. If input is invalid/partial, it returns
 * a contract with safe fallback values that won't crash UI rendering.
 * 
 * @param input - Raw workout reasoning summary (unknown shape)
 * @returns Safe display contract or null if input is completely unusable
 */
export function buildWorkoutReasoningDisplayContract(
  input: unknown
): WorkoutReasoningDisplayContract | null {
  // Reject null/undefined/non-objects
  const obj = safeObject(input)
  if (!obj) {
    console.log('[reasoning-display-contract] Input rejected: not an object', { inputType: typeof input })
    return null
  }
  
  // Extract primary limiter safely
  let primaryLimiter: LimiterDisplay
  const rawPrimary = safeObject(obj.primaryLimiter)
  if (rawPrimary) {
    primaryLimiter = {
      label: safeString(rawPrimary.label, DEFAULT_PRIMARY_LIMITER.label),
      explanation: safeString(rawPrimary.explanation, DEFAULT_PRIMARY_LIMITER.explanation),
    }
  } else {
    primaryLimiter = DEFAULT_PRIMARY_LIMITER
  }
  
  // Extract secondary limiter safely (null if not present/valid)
  let secondaryLimiter: LimiterDisplay | null = null
  const rawSecondary = safeObject(obj.secondaryLimiter)
  if (rawSecondary) {
    const label = safeString(rawSecondary.label, '')
    if (label) {
      secondaryLimiter = {
        label,
        explanation: safeString(rawSecondary.explanation, ''),
      }
    }
  }
  
  // Extract framework influence safely (null if not present/valid)
  let frameworkInfluence: FrameworkInfluenceDisplay | null = null
  const rawFramework = safeObject(obj.frameworkInfluence)
  if (rawFramework) {
    const influence = safeString(rawFramework.influence, '')
    if (influence) {
      frameworkInfluence = { influence }
    }
  }
  
  // Extract envelope influence safely (null if not present/valid)
  let envelopeInfluence: EnvelopeInfluenceDisplay | null = null
  const rawEnvelope = safeObject(obj.envelopeInfluence)
  if (rawEnvelope) {
    const adaptations = safeStringArray(rawEnvelope.adaptations)
    if (adaptations.length > 0) {
      envelopeInfluence = { adaptations }
    }
  }
  
  // Build the safe contract
  const contract: WorkoutReasoningDisplayContract = {
    whyThisWorkout: safeString(obj.whyThisWorkout, DEFAULT_WHY_THIS_WORKOUT),
    workoutFocus: safeString(obj.workoutFocus, DEFAULT_WORKOUT_FOCUS),
    sessionType: safeEnum(obj.sessionType, VALID_SESSION_TYPE, DEFAULT_SESSION_TYPE),
    reasoningConfidence: safeEnum(obj.reasoningConfidence, VALID_CONFIDENCE, DEFAULT_CONFIDENCE),
    dataQuality: safeEnum(obj.dataQuality, VALID_DATA_QUALITY, DEFAULT_DATA_QUALITY),
    primaryLimiter,
    secondaryLimiter,
    frameworkInfluence,
    envelopeInfluence,
  }
  
  return contract
}

/**
 * Quick shape check for diagnostic logging.
 * Returns a compact object describing what fields exist/are valid.
 */
export function getReasoningShapeDiagnostic(input: unknown): {
  exists: boolean
  isObject: boolean
  hasWhyThisWorkout: boolean
  hasPrimaryLimiter: boolean
  hasPrimaryLimiterLabel: boolean
  hasEnvelopeInfluence: boolean
  hasEnvelopeAdaptations: boolean
  hasDataQuality: boolean
  hasWorkoutFocus: boolean
  hasSessionType: boolean
} {
  if (input === null || input === undefined) {
    return {
      exists: false,
      isObject: false,
      hasWhyThisWorkout: false,
      hasPrimaryLimiter: false,
      hasPrimaryLimiterLabel: false,
      hasEnvelopeInfluence: false,
      hasEnvelopeAdaptations: false,
      hasDataQuality: false,
      hasWorkoutFocus: false,
      hasSessionType: false,
    }
  }
  
  const obj = safeObject(input)
  if (!obj) {
    return {
      exists: true,
      isObject: false,
      hasWhyThisWorkout: false,
      hasPrimaryLimiter: false,
      hasPrimaryLimiterLabel: false,
      hasEnvelopeInfluence: false,
      hasEnvelopeAdaptations: false,
      hasDataQuality: false,
      hasWorkoutFocus: false,
      hasSessionType: false,
    }
  }
  
  const primaryLimiter = safeObject(obj.primaryLimiter)
  const envelopeInfluence = safeObject(obj.envelopeInfluence)
  
  return {
    exists: true,
    isObject: true,
    hasWhyThisWorkout: typeof obj.whyThisWorkout === 'string' && !!obj.whyThisWorkout,
    hasPrimaryLimiter: !!primaryLimiter,
    hasPrimaryLimiterLabel: !!primaryLimiter && typeof primaryLimiter.label === 'string',
    hasEnvelopeInfluence: !!envelopeInfluence,
    hasEnvelopeAdaptations: !!envelopeInfluence && Array.isArray(envelopeInfluence.adaptations),
    hasDataQuality: typeof obj.dataQuality === 'string',
    hasWorkoutFocus: typeof obj.workoutFocus === 'string',
    hasSessionType: typeof obj.sessionType === 'string',
  }
}
