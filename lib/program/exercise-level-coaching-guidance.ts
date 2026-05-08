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
  /** [WW7] RPE/effort intelligence — explicit effort guidance when targetRPE exists */
  effortGuidance?: {
    /** Effort band label (e.g., "Controlled", "Strong", "Near-limit") */
    band: string
    /** User-friendly effort cue explaining what this RPE means */
    cue: string
    /** Numeric RPE if available (for display) */
    rpe?: number
  } | null
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
  /** Rest seconds if available */
  restSeconds?: number
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
  /** Primary goal from program */
  primaryGoal?: string
  /** Composition metadata if available */
  compositionMetadata?: {
    sessionIntensity?: 'high' | 'moderate' | 'low' | 'recovery'
    sessionRole?: string
    volumeEmphasis?: string
  }
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
// PRESCRIPTION-AWARE DETECTION — Step 25.6B
// =============================================================================

/** Parse rep count from repsOrTime string (e.g., "8-12" -> 10, "5" -> 5, "3x8" -> 8) */
function parseRepCount(repsOrTime?: string): number | null {
  if (!repsOrTime) return null
  const lower = repsOrTime.toLowerCase()
  // Skip time-based prescriptions
  if (lower.includes('sec') || lower.includes('hold') || /\d+s$/.test(lower)) return null
  // Handle ranges like "8-12" -> average
  const rangeMatch = repsOrTime.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2)
  }
  // Handle "3x8" format
  const setsRepsMatch = repsOrTime.match(/\d+\s*x\s*(\d+)/i)
  if (setsRepsMatch) {
    return parseInt(setsRepsMatch[1], 10)
  }
  // Handle plain number
  const plainMatch = repsOrTime.match(/^(\d+)/)
  if (plainMatch) {
    return parseInt(plainMatch[1], 10)
  }
  return null
}

/** Detect if prescription is low-rep strength (1-5 reps) */
function isLowRepStrength(repsOrTime?: string): boolean {
  const reps = parseRepCount(repsOrTime)
  return reps !== null && reps >= 1 && reps <= 5
}

/** Detect if prescription is moderate-rep strength (4-8 reps) */
function isModerateRepStrength(repsOrTime?: string): boolean {
  const reps = parseRepCount(repsOrTime)
  return reps !== null && reps >= 4 && reps <= 8
}

/** Detect if prescription is higher-rep accessory/hypertrophy (8+ reps) */
function isHigherRepAccessory(repsOrTime?: string): boolean {
  const reps = parseRepCount(repsOrTime)
  return reps !== null && reps >= 8
}

/** Detect if rest is short (under 60s) indicating density work */
function isShortRest(restSeconds?: number): boolean {
  return restSeconds !== undefined && restSeconds > 0 && restSeconds < 60
}

/** Detect if rest is moderate (60-120s) */
function isModerateRest(restSeconds?: number): boolean {
  return restSeconds !== undefined && restSeconds >= 60 && restSeconds <= 120
}

/** Detect if rest is long (over 120s) indicating strength focus */
function isLongRest(restSeconds?: number): boolean {
  return restSeconds !== undefined && restSeconds > 120
}

/** Detect if RPE indicates high effort (8+) */
function isHighEffortRPE(targetRPE?: number): boolean {
  return targetRPE !== undefined && targetRPE >= 8
}

/** Detect if RPE indicates moderate effort (6-7) */
function isModerateEffortRPE(targetRPE?: number): boolean {
  return targetRPE !== undefined && targetRPE >= 6 && targetRPE < 8
}

// =============================================================================
// WW7: RPE / EFFORT INTELLIGENCE USABILITY
// =============================================================================

/**
 * Derive user-friendly effort guidance from real targetRPE.
 * Maps numeric RPE to effort band + actionable execution cue.
 * 
 * Returns null if no real RPE exists — never invents a fake value.
 */
function deriveEffortGuidanceFromRPE(
  targetRPE?: number,
  exerciseCategory?: string,
  isMobility?: boolean
): { band: string; cue: string; rpe: number } | null {
  // No RPE = no effort guidance (honest fallback)
  if (targetRPE === undefined || targetRPE === null) return null
  
  // Mobility/prehab always gets low-strain guidance regardless of any RPE
  if (isMobility) {
    return {
      band: 'Low strain',
      cue: 'Stay smooth and pain-free. This should support the session, not exhaust you.',
      rpe: targetRPE,
    }
  }
  
  // RPE band mapping based on real numeric value
  if (targetRPE <= 5) {
    return {
      band: 'Easy',
      cue: 'Light effort — focus on movement quality and positioning.',
      rpe: targetRPE,
    }
  }
  
  if (targetRPE === 6) {
    return {
      band: 'Controlled',
      cue: 'Finish with several clean reps in reserve. Build skill without draining recovery.',
      rpe: targetRPE,
    }
  }
  
  if (targetRPE === 7) {
    return {
      band: 'Moderate',
      cue: 'Work hard, but keep the set clean. You should still feel like you had more reps available.',
      rpe: targetRPE,
    }
  }
  
  if (targetRPE === 8) {
    return {
      band: 'Strong',
      cue: 'Push with intent while avoiding form breakdown. Stop before grinding turns the set sloppy.',
      rpe: targetRPE,
    }
  }
  
  if (targetRPE === 9) {
    return {
      band: 'Near-limit',
      cue: 'This should feel very hard but still controlled. Do not force extra reps past the prescription.',
      rpe: targetRPE,
    }
  }
  
  // RPE 10 (max effort) — only if explicitly prescribed
  if (targetRPE >= 10) {
    return {
      band: 'Max effort',
      cue: 'All-out set. Use only when the prescription explicitly calls for failure.',
      rpe: targetRPE,
    }
  }
  
  return null
}

/** Build prescription-aware tags from real fields */
function buildPrescriptionTags(
  repsOrTime?: string,
  targetRPE?: number,
  restSeconds?: number,
  sets?: number
): string[] {
  const tags: string[] = []
  
  // Rep-based tags
  if (isLowRepStrength(repsOrTime)) {
    tags.push('Low reps')
  } else if (isHigherRepAccessory(repsOrTime) && !isModerateRepStrength(repsOrTime)) {
    tags.push('Volume work')
  }
  
  // RPE-based tags
  if (isHighEffortRPE(targetRPE)) {
    tags.push('Hard effort')
  } else if (isModerateEffortRPE(targetRPE)) {
    tags.push('Controlled effort')
  }
  
  // Rest-based tags
  if (isShortRest(restSeconds)) {
    tags.push('Quick turnover')
  } else if (isLongRest(restSeconds)) {
    tags.push('Full recovery')
  }
  
  // Keep tags concise
  return tags.slice(0, 2)
}

// =============================================================================
// MAIN GUIDANCE DERIVATION (PURE, DETERMINISTIC)
// =============================================================================

/**
 * Derive exercise-level coaching guidance from real exercise/session/program truth.
 * 
 * Step 25.6B: Now prescription-aware — uses sets, reps, rest, RPE to sharpen cues.
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
  const { name, category, repsOrTime, targetRPE, restSeconds, sets, method, selectionReason } = exercise
  
  // If we have prescriptionContext from the card contract, use it as the summary base
  // This is already truth-derived by buildExerciseCardContract
  const existingContext = exercise.prescriptionContext
  const existingIntent = exercise.intentLabel
  
  // [STEP 25.6B] Build prescription-aware tags from real fields
  const prescriptionTags = buildPrescriptionTags(repsOrTime, targetRPE, restSeconds, sets)
  
  // [STEP 25.6B] Derive session intensity context if available
  const sessionIntensity = sessionContext?.compositionMetadata?.sessionIntensity
  const isRecoverySession = sessionIntensity === 'recovery' || sessionIntensity === 'low'
  const isHighIntensitySession = sessionIntensity === 'high'
  
  // [WW7] Derive effort guidance from real targetRPE — null if no RPE exists
  const isMobility = isMobilityPrehabExercise(name, category)
  const effortGuidance = deriveEffortGuidanceFromRPE(targetRPE, category, isMobility)
  
  // PRIORITY 1: Skill / isometric / hold exercise
  if (isSkillOrIsometricExercise(name) || (isHoldPrescription(repsOrTime) && category === 'skill')) {
    // [STEP 25.6B] Prescription-aware skill cue
    const hasMultipleSets = sets !== undefined && sets > 1
    const summary = existingContext || (hasMultipleSets
      ? 'Keep each hold clean and repeatable across sets. End before position quality breaks.'
      : 'Prioritize clean positions over longer holds. Stop when shape breaks.')
    
    return {
      label: 'Skill focus',
      summary,
      focusTags: prescriptionTags.length > 0 
        ? ['Shape quality', ...prescriptionTags].slice(0, 3)
        : ['Shape quality', 'Controlled effort'],
      caution: targetRPE && targetRPE >= 9 ? 'High RPE — maintain form standards' : null,
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
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
      effortGuidance,
    }
  }
  
  // PRIORITY 3: Core / trunk
  if (isCoreExercise(name, category)) {
    // [STEP 25.6B] Prescription-aware core cue
    const isHighRep = isHigherRepAccessory(repsOrTime)
    const summary = existingContext || (isHighRep
      ? 'Control each rep through the full range. Stop the set before compensation takes over.'
      : 'Keep pelvis and ribs controlled. Stop before compensation takes over.')
    
    return {
      label: 'Core stability',
      summary,
      focusTags: prescriptionTags.length > 0
        ? ['Trunk control', ...prescriptionTags].slice(0, 3)
        : ['Trunk control', 'Quality reps'],
      caution: null,
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
    }
  }
  
  // PRIORITY 4: Short rest / density prescription (before strength/accessory checks)
  if (isShortRest(restSeconds) || isConditioningExercise(name, method, selectionReason)) {
    // [STEP 25.6B] Prescription-aware density cue
    const summary = existingContext || 'Pace the early sets so quality survives the shorter rest window.'
    
    return {
      label: 'Work capacity',
      summary,
      focusTags: ['Pacing', 'Quick turnover'],
      caution: isHighEffortRPE(targetRPE) ? 'High effort with short rest — pace carefully' : null,
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
    }
  }
  
  // PRIORITY 5: Low-rep strength (1-5 reps)
  if (isLowRepStrength(repsOrTime) && isStrengthCompoundExercise(name, category)) {
    // [STEP 25.6B] Prescription-aware low-rep strength cue
    const hasLongRest = isLongRest(restSeconds)
    const summary = existingContext || (hasLongRest
      ? 'Use the rest fully so each set stays powerful and technically clean.'
      : 'Treat these as quality strength sets. Keep reps powerful and stop before grinding.')
    
    return {
      label: 'Strength work',
      summary,
      focusTags: prescriptionTags.length > 0
        ? ['Max strength', ...prescriptionTags].slice(0, 3)
        : ['Max strength', 'Full recovery'],
      caution: isHighEffortRPE(targetRPE) ? 'Leave technique quality in reserve' : null,
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
    }
  }
  
  // PRIORITY 6: Moderate-rep strength (4-8 reps)
  if (isModerateRepStrength(repsOrTime) && isStrengthCompoundExercise(name, category)) {
    // [STEP 25.6B] Prescription-aware moderate-rep cue
    const isHighRPE = isHighEffortRPE(targetRPE)
    const summary = existingContext || (isHighRPE
      ? 'Hard set — maintain form through demanding reps.'
      : 'Keep every rep consistent. The goal is repeatable strength, not chasing extra sloppy reps.')
    
    return {
      label: isHighRPE ? 'Strength work' : 'Strength building',
      summary,
      focusTags: prescriptionTags.length > 0
        ? ['Repeatable sets', ...prescriptionTags].slice(0, 3)
        : ['Controlled strength', 'Repeatable sets'],
      caution: isHighRPE ? 'Leave technique quality in reserve' : null,
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
    }
  }
  
  // PRIORITY 7: General strength / compound (fallback for strength without clear rep range)
  if (isStrengthCompoundExercise(name, category)) {
    const isHighRPE = isHighEffortRPE(targetRPE)
    return {
      label: isHighRPE ? 'Strength work' : 'Strength building',
      summary: existingContext || (isHighRPE 
        ? 'Hard set — maintain form through demanding reps.'
        : 'Keep working sets controlled and repeatable.'),
      focusTags: prescriptionTags.length > 0
        ? [...prescriptionTags, 'Form integrity'].slice(0, 3)
        : (isHighRPE ? ['Max effort', 'Form integrity'] : ['Controlled strength', 'Repeatable sets']),
      caution: isHighRPE ? 'Leave technique quality in reserve' : null,
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
    }
  }
  
  // PRIORITY 8: Higher-rep accessory / hypertrophy (8+ reps)
  if (isHigherRepAccessory(repsOrTime) || isAccessoryExercise(name, category)) {
    // [STEP 25.6B] Prescription-aware accessory cue
    const summary = existingContext || 'Use controlled tension here. Build useful volume without draining your main skill work.'
    
    return {
      label: 'Support work',
      summary,
      focusTags: prescriptionTags.length > 0
        ? ['Muscle tension', ...prescriptionTags].slice(0, 3)
        : ['Muscle tension', 'Strict form'],
      caution: isHighIntensitySession ? null : 'Do not let accessory fatigue damage main skill work',
      source: existingContext ? 'specific' : 'derived',
      effortGuidance,
    }
  }
  
  // PRIORITY 9: Use existing prescriptionContext if available
  if (existingContext) {
    return {
      label: existingIntent || 'Training focus',
      summary: existingContext,
      focusTags: prescriptionTags.length > 0
        ? [...prescriptionTags, 'Form quality'].slice(0, 3)
        : ['Form quality', 'Consistent execution'],
      caution: null,
      source: 'specific',
      effortGuidance,
    }
  }
  
  // FALLBACK: Basic guidance from available data
  // [STEP 25.6B] Even fallback uses prescription tags when available
  return {
    label: 'Technique focus',
    summary: 'Follow the listed prescription and keep technique consistent across sets.',
    focusTags: prescriptionTags.length > 0
      ? [...prescriptionTags, 'Form consistency'].slice(0, 3)
      : ['Form consistency'],
    caution: null,
    source: 'basic',
    effortGuidance,
  }
}

// =============================================================================
// CONVENIENCE: Build guidance from card contract output
// =============================================================================

/**
 * Build coaching guidance using existing card contract fields.
 * This is the preferred entry point when the card contract is already built.
 * 
 * Step 25.6B: Now accepts sets, restSeconds, and sessionContext for prescription-aware cues.
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
    sets?: number
    repsOrTime?: string
    targetRPE?: number
    restSeconds?: number
    method?: string
    selectionReason?: string
  },
  sessionContext?: SessionContextForCoaching
): ExerciseCoachingGuidance {
  return deriveExerciseLevelCoachingGuidance({
    name: exerciseName,
    category: exerciseCategory,
    prescriptionContext: cardContract.prescriptionContext,
    prescriptionIntent: cardContract.prescriptionIntent,
    intentLabel: cardContract.intentLabel,
    ...extraFields,
  }, sessionContext)
}
