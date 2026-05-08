/**
 * EXERCISE-LEVEL COACHING GUIDANCE — Step 25.6A
 *
 * =============================================================================
 * ADVISORY-ONLY COACHING CUES DERIVED FROM REAL EXERCISE/SESSION/PROGRAM TRUTH
 * =============================================================================
 *
 * This helper derives concise coaching guidance for individual exercises from
 * already-existing real exercise/session/program truth, then returns a typed
 * surface for the UI to render.
 *
 * Critical constraints:
 *
 *   - PURE. No side effects. No writes. No mutation. No browser APIs.
 *   - TRUTH-DERIVED. Uses only real fields from the exercise, session, and
 *     program objects. Never invents detail or fake coaching claims.
 *   - DETERMINISTIC. Same input always produces same output.
 *   - HONEST FALLBACK. When truth is insufficient, returns a modest basic
 *     guidance result from real fields only.
 *
 * The helper does NOT:
 *   - Mutate the program
 *   - Change exercise selection
 *   - Change sets/reps/rest
 *   - Affect live workout execution
 *   - Rewrite generator logic
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type ExerciseCoachingGuidanceSource = 'specific' | 'derived' | 'basic'

export interface ExerciseCoachingGuidance {
  /** Short label for the guidance category (e.g., "Skill focus", "Strength work") */
  label: string
  /** One-line coaching summary (e.g., "Prioritize clean positions over longer holds") */
  summary: string
  /** 1-3 short focus tags (e.g., ["Shape quality", "Controlled effort"]) */
  focusTags: string[]
  /** Optional caution when real logic supports it */
  caution: string | null
  /** Source of the guidance: specific (from explicit data), derived (from patterns), or basic (fallback) */
  source: ExerciseCoachingGuidanceSource
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface ExerciseCoachingInput {
  /** Exercise name (required) */
  name: string
  /** Exercise category if available */
  category?: string
  /** Sets count */
  sets?: number
  /** Reps or time string (e.g., "8-12" or "30s hold") */
  repsOrTime?: string
  /** Target RPE if available */
  targetRPE?: number
  /** Selection reason if available */
  selectionReason?: string
  /** Coaching meta from builder if available */
  coachingMeta?: {
    expressionMode?: string
    progressionIntent?: string
    skillSupportTargets?: string[]
  }
  /** Method if available */
  method?: string
  /** Prescription context from card contract (already computed) */
  prescriptionContext?: string | null
  /** Prescription intent from card contract (already computed) */
  prescriptionIntent?: string | null
  /** Intent label from card contract (already computed) */
  intentLabel?: string | null
}

export interface SessionContextForCoaching {
  /** Session focus/title */
  sessionFocus?: string
  /** Session goal */
  sessionGoal?: string
  /** Whether this is a primary session */
  isPrimarySession?: boolean
  /** Training style */
  trainingStyle?: string
}

export interface ProgramContextForCoaching {
  /** Primary goal */
  primaryGoal?: string
  /** Selected skills */
  selectedSkills?: string[]
}

// =============================================================================
// EXERCISE PATTERN DETECTION (PURE)
// =============================================================================

/** Detect if exercise is a skill/isometric/hold type */
function isSkillOrIsometricExercise(name: string): boolean {
  const lower = name.toLowerCase()
  const skillPatterns = [
    'planche', 'front lever', 'back lever', 'lever',
    'handstand', 'l-sit', 'v-sit', 'i-sit',
    'hollow hold', 'tuck hold', 'support hold',
    'planche lean', 'straddle', 'half lay', 'full lay',
    'iron cross', 'maltese', 'victorian', 'inverted cross',
    'manna', 'press to handstand', 'stalder',
  ]
  return skillPatterns.some(p => lower.includes(p))
}

/** Detect if exercise is a strength/compound type */
function isStrengthCompoundExercise(name: string, category?: string): boolean {
  const lower = name.toLowerCase()
  const catLower = (category || '').toLowerCase()
  if (catLower === 'strength' || catLower === 'push' || catLower === 'pull') return true
  const strengthPatterns = [
    'pull-up', 'pullup', 'chin-up', 'chinup',
    'dip', 'push-up', 'pushup', 'row',
    'squat', 'deadlift', 'hinge', 'press',
    'weighted', 'muscle-up', 'muscle up',
  ]
  return strengthPatterns.some(p => lower.includes(p))
}

/** Detect if exercise is an accessory/hypertrophy type */
function isAccessoryExercise(name: string, category?: string): boolean {
  const lower = name.toLowerCase()
  const catLower = (category || '').toLowerCase()
  if (catLower === 'accessory') return true
  const accessoryPatterns = [
    'curl', 'tricep', 'raise', 'fly', 'flye',
    'extension', 'calf', 'hamstring curl',
    'lateral raise', 'rear delt', 'face pull',
    'bicep', 'isolation', 'single-arm', 'single arm',
  ]
  return accessoryPatterns.some(p => lower.includes(p))
}

/** Detect if exercise is a mobility/prehab/joint type */
function isMobilityPrehabExercise(name: string, category?: string): boolean {
  const lower = name.toLowerCase()
  const catLower = (category || '').toLowerCase()
  if (catLower === 'warmup' || catLower === 'cooldown' || catLower === 'mobility') return true
  const mobilityPatterns = [
    'wrist', 'shoulder', 'scapular', 'scap',
    'hip', 'ankle', 'mobility', 'stretch',
    'cars', 'prep', 'prehab', 'external rotation',
    'band pull-apart', 'dislocate', 'thoracic',
    'flexion', 'abduction', 'rotation',
  ]
  return mobilityPatterns.some(p => lower.includes(p))
}

/** Detect if exercise is a core/trunk type */
function isCoreExercise(name: string, category?: string): boolean {
  const lower = name.toLowerCase()
  const catLower = (category || '').toLowerCase()
  if (catLower === 'core') return true
  const corePatterns = [
    'hollow', 'arch', 'compression', 'leg raise',
    'dragon flag', 'plank', 'side plank', 'dead bug',
    'ab wheel', 'ab rollout', 'crunch', 'sit-up', 'situp',
    'v-up', 'toes to bar', 'hanging raise',
  ]
  return corePatterns.some(p => lower.includes(p))
}

/** Detect if exercise is a conditioning/density type */
function isConditioningExercise(name: string, method?: string, selectionReason?: string): boolean {
  const lower = name.toLowerCase()
  const methodLower = (method || '').toLowerCase()
  const reasonLower = (selectionReason || '').toLowerCase()
  const condPatterns = [
    'circuit', 'density', 'emom', 'amrap',
    'conditioning', 'finisher', 'interval',
  ]
  return condPatterns.some(p => 
    lower.includes(p) || methodLower.includes(p) || reasonLower.includes(p)
  )
}

/** Check if repsOrTime indicates a hold (isometric) */
function isHoldPrescription(repsOrTime?: string): boolean {
  if (!repsOrTime) return false
  const lower = repsOrTime.toLowerCase()
  return lower.includes('hold') || lower.includes('sec') || lower.includes('s ') || /\d+s$/.test(lower)
}

// =============================================================================
// MAIN GUIDANCE DERIVATION (PURE, DETERMINISTIC)
// =============================================================================

/**
 * Derive exercise-level coaching guidance from real exercise/session/program truth.
 * 
 * @param exercise - The exercise input with available fields
 * @param sessionContext - Optional session context
 * @param programContext - Optional program context
 * @returns ExerciseCoachingGuidance with label, summary, tags, and source
 */
export function deriveExerciseLevelCoachingGuidance(
  exercise: ExerciseCoachingInput,
  sessionContext?: SessionContextForCoaching,
  programContext?: ProgramContextForCoaching
): ExerciseCoachingGuidance {
  const { name, category, repsOrTime, targetRPE, method, selectionReason, coachingMeta } = exercise
  
  // If we have prescriptionContext from the card contract, use it as the summary base
  // This is already truth-derived by buildExerciseCardContract
  const existingContext = exercise.prescriptionContext
  const existingIntent = exercise.intentLabel
  
  // PRIORITY 1: Skill / isometric / hold exercise
  if (isSkillOrIsometricExercise(name) || (isHoldPrescription(repsOrTime) && category === 'skill')) {
    return {
      label: 'Skill focus',
      summary: existingContext || 'Prioritize clean positions over longer holds. Stop when shape breaks.',
      focusTags: ['Shape quality', 'Controlled effort'],
      caution: targetRPE && targetRPE >= 9 ? 'High RPE — maintain form standards' : null,
      source: existingContext ? 'specific' : 'derived',
    }
  }
  
  // PRIORITY 2: Mobility / prehab / joint prep
  if (isMobilityPrehabExercise(name, category)) {
    return {
      label: 'Joint prep',
      summary: existingContext || 'Move slowly and stay pain-free. This prepares joints, not builds fatigue.',
      focusTags: ['Control', 'Range of motion'],
      caution: null,
      source: existingContext ? 'specific' : 'derived',
    }
  }
  
  // PRIORITY 3: Core / trunk
  if (isCoreExercise(name, category)) {
    return {
      label: 'Core stability',
      summary: existingContext || 'Keep pelvis and ribs controlled. Stop before compensation takes over.',
      focusTags: ['Trunk control', 'Quality reps'],
      caution: null,
      source: existingContext ? 'specific' : 'derived',
    }
  }
  
  // PRIORITY 4: Conditioning / density
  if (isConditioningExercise(name, method, selectionReason)) {
    return {
      label: 'Work capacity',
      summary: existingContext || 'Keep effort sustainable. Pace early work so quality survives.',
      focusTags: ['Pacing', 'Sustained effort'],
      caution: null,
      source: existingContext ? 'specific' : 'derived',
    }
  }
  
  // PRIORITY 5: Strength / compound
  if (isStrengthCompoundExercise(name, category)) {
    const isHighRPE = targetRPE && targetRPE >= 8
    return {
      label: isHighRPE ? 'Strength work' : 'Strength building',
      summary: existingContext || (isHighRPE 
        ? 'Hard set — maintain form through demanding reps.'
        : 'Keep working sets controlled and repeatable.'),
      focusTags: isHighRPE ? ['Max effort', 'Form integrity'] : ['Controlled strength', 'Repeatable sets'],
      caution: isHighRPE ? 'Leave technique quality in reserve' : null,
      source: existingContext ? 'specific' : 'derived',
    }
  }
  
  // PRIORITY 6: Accessory / hypertrophy
  if (isAccessoryExercise(name, category)) {
    return {
      label: 'Support work',
      summary: existingContext || 'Chase control and target-muscle tension, not max load.',
      focusTags: ['Muscle tension', 'Strict form'],
      caution: 'Do not let accessory fatigue damage main skill work',
      source: existingContext ? 'specific' : 'derived',
    }
  }
  
  // PRIORITY 7: Use existing prescriptionContext if available
  if (existingContext) {
    return {
      label: existingIntent || 'Training focus',
      summary: existingContext,
      focusTags: ['Form quality', 'Consistent execution'],
      caution: null,
      source: 'specific',
    }
  }
  
  // FALLBACK: Basic guidance from available data
  return {
    label: 'Technique focus',
    summary: 'Use clean reps and follow the listed prescription.',
    focusTags: ['Form consistency'],
    caution: null,
    source: 'basic',
  }
}

// =============================================================================
// CONVENIENCE: Build guidance from card contract output
// =============================================================================

/**
 * Build coaching guidance using existing card contract fields.
 * This is the preferred entry point when the card contract is already built.
 */
export function buildCoachingGuidanceFromCardContract(
  exerciseName: string,
  exerciseCategory: string,
  cardContract: {
    prescriptionContext: string | null
    prescriptionIntent: string
    intentLabel: string
  },
  extraFields?: {
    repsOrTime?: string
    targetRPE?: number
    method?: string
    selectionReason?: string
  }
): ExerciseCoachingGuidance {
  return deriveExerciseLevelCoachingGuidance({
    name: exerciseName,
    category: exerciseCategory,
    prescriptionContext: cardContract.prescriptionContext,
    prescriptionIntent: cardContract.prescriptionIntent,
    intentLabel: cardContract.intentLabel,
    ...extraFields,
  })
}
