/**
 * [AB9.1] Exercise-Specific Ramp-Up/Prep Plan
 * 
 * Pure helper that derives a prep/ramp-up plan for the current exercise
 * based on real exercise truth (name, category, method, load, RPE).
 * 
 * This plan is passed through the live workout snapshot corridor and
 * rendered in ActiveWorkoutStartCorridor before Set 1 only when appropriate.
 * 
 * Rules:
 * - NO database calls
 * - NO side effects
 * - NO React
 * - Safe unknown handling
 * - Does NOT mutate workout state
 * - Does NOT count as a working set
 */

export type PrepPlanType = 'weighted_ramp' | 'advanced_skill_ramp' | 'high_intensity_ramp' | 'method_ramp' | 'none'

export type PrepPlanSource = 'weighted_load' | 'advanced_skill' | 'high_rpe' | 'method' | 'none'

export interface ExercisePrepPlan {
  /** Whether to render the prep panel */
  shouldRender: boolean
  /** Type of prep plan */
  planType: PrepPlanType
  /** Short headline for the prep panel */
  headline: string
  /** Brief reason why prep is recommended */
  reason: string
  /** 2-3 actionable prep steps */
  steps: string[]
  /** What triggered this prep recommendation */
  source: PrepPlanSource
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low'
}

export interface PrepPlanInput {
  exerciseName: string
  exerciseCategory?: string
  setExecutionMethod?: string
  exerciseMethod?: string
  prescribedLoad?: string | number | null
  targetRPE?: number | null
  currentSetNumber: number
  currentExerciseIndex: number
  isWarmupOrCooldown?: boolean
}

// =============================================================================
// ADVANCED SKILL PATTERNS
// =============================================================================

const ADVANCED_SKILL_PATTERNS = [
  // Lever work
  'front lever', 'back lever', 'side lever', 'human flag',
  // Planche family
  'planche', 'planche lean', 'tuck planche', 'straddle planche',
  // Muscle up variations
  'muscle up', 'muscle-up', 'bar muscle up', 'ring muscle up',
  // Handstand work
  'handstand', 'hspu', 'handstand push', 'press to handstand',
  // High-skill pulling
  'one arm pull', 'archer pull', 'typewriter pull',
  // High-skill pushing
  'one arm push', 'archer push', 'planche push',
  // Core/compression
  'dragon flag', 'v-sit', 'l-sit', 'manna',
  // Ring skills
  'iron cross', 'maltese', 'victorian',
]

// =============================================================================
// WEIGHTED EXERCISE PATTERNS  
// =============================================================================

const WEIGHTED_PATTERNS = [
  'weighted', 'barbell', 'dumbbell', 'kettlebell', 'cable',
  'loaded', 'resistance', 'external load',
]

// =============================================================================
// HIGH-INTENSITY METHOD PATTERNS
// =============================================================================

const HIGH_INTENSITY_METHODS = [
  'top_set', 'top set', 'topset',
  'cluster', 'cluster_set',
  'rest_pause', 'rest-pause', 'myo_rep', 'myorep',
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[-_]/g, ' ').trim()
}

function matchesPatterns(text: string, patterns: string[]): boolean {
  const normalized = normalizeString(text)
  return patterns.some(p => normalized.includes(normalizeString(p)))
}

function isAdvancedSkillExercise(name: string, category?: string): boolean {
  const combined = `${name} ${category || ''}`.toLowerCase()
  return matchesPatterns(combined, ADVANCED_SKILL_PATTERNS)
}

function isWeightedExercise(name: string, category?: string, prescribedLoad?: string | number | null): boolean {
  // Check if there's a real prescribed load
  if (prescribedLoad) {
    const loadStr = String(prescribedLoad).toLowerCase()
    // Skip if it's just "bodyweight" or similar
    if (!loadStr.includes('bodyweight') && !loadStr.includes('bw') && loadStr.length > 0) {
      return true
    }
  }
  
  const combined = `${name} ${category || ''}`.toLowerCase()
  return matchesPatterns(combined, WEIGHTED_PATTERNS)
}

function isHighIntensityMethod(method?: string): boolean {
  if (!method) return false
  return matchesPatterns(method, HIGH_INTENSITY_METHODS)
}

function isHighRPE(targetRPE?: number | null): boolean {
  return typeof targetRPE === 'number' && targetRPE >= 8
}

// =============================================================================
// PLAN GENERATORS
// =============================================================================

function buildAdvancedSkillPlan(exerciseName: string): ExercisePrepPlan {
  const normalizedName = normalizeString(exerciseName)
  
  let steps: string[]
  if (normalizedName.includes('lever') || normalizedName.includes('planche')) {
    steps = [
      'Activate scapular retraction with band pull-aparts or face pulls',
      'Practice the easier progression for 2-3 reps to prime the pattern',
      'Hold the target position briefly at reduced intensity before Set 1',
    ]
  } else if (normalizedName.includes('muscle up')) {
    steps = [
      'Do 3-5 explosive high pulls to prime the transition',
      'Practice the kip timing with 2-3 light swings',
      'Attempt one easy rep or assisted rep before the working set',
    ]
  } else if (normalizedName.includes('handstand') || normalizedName.includes('hspu')) {
    steps = [
      'Warm wrists with circles and extensions',
      'Hold a wall-supported position for 10-15 seconds',
      'Do 2-3 pike push-ups or elevated push-ups to prime shoulders',
    ]
  } else if (normalizedName.includes('archer') || normalizedName.includes('one arm')) {
    steps = [
      'Do 3-5 standard reps of the bilateral version',
      'Practice the assisted version for 2-3 reps each side',
      'Focus on controlled tempo before loading one arm',
    ]
  } else {
    steps = [
      'Practice the easier regression for 2-3 reps',
      'Focus on the key positions and tension points',
      'Enter Set 1 primed, not fatigued',
    ]
  }

  return {
    shouldRender: true,
    planType: 'advanced_skill_ramp',
    headline: 'Skill Prep',
    reason: 'This is an advanced skill movement. Prime the pattern before working sets.',
    steps,
    source: 'advanced_skill',
    confidence: 'high',
  }
}

function buildWeightedPlan(exerciseName: string, prescribedLoad?: string | number | null): ExercisePrepPlan {
  const loadDisplay = prescribedLoad ? String(prescribedLoad) : 'working weight'
  
  return {
    shouldRender: true,
    planType: 'weighted_ramp',
    headline: 'Ramp-Up Sets',
    reason: `Build to ${loadDisplay} with progressive loads to prepare joints and nervous system.`,
    steps: [
      'Start with an empty bar or 50% of working weight for 5-8 reps',
      'Add weight gradually: 70% for 3-5 reps, then 85% for 2-3 reps',
      'Rest 60-90 seconds, then begin your first working set',
    ],
    source: 'weighted_load',
    confidence: 'high',
  }
}

function buildHighIntensityPlan(targetRPE: number): ExercisePrepPlan {
  return {
    shouldRender: true,
    planType: 'high_intensity_ramp',
    headline: 'Intensity Prep',
    reason: `Target RPE ${targetRPE} is high effort. Prepare with submaximal practice.`,
    steps: [
      'Do 2-3 reps at RPE 5-6 to find your groove',
      'Rest briefly and mentally rehearse the working set',
      'Enter Set 1 focused and ready for quality effort',
    ],
    source: 'high_rpe',
    confidence: 'medium',
  }
}

function buildMethodPlan(method: string): ExercisePrepPlan {
  const normalizedMethod = normalizeString(method)
  
  let steps: string[]
  if (normalizedMethod.includes('top') && normalizedMethod.includes('set')) {
    steps = [
      'Warm up with 2-3 lighter sets before your top set',
      'Focus on bar speed and technique at submaximal loads',
      'Save your best effort for the top set',
    ]
  } else if (normalizedMethod.includes('cluster')) {
    steps = [
      'Practice the cluster rest timing with a lighter weight',
      'Get comfortable with the mini-rest protocol',
      'Start conservatively - clusters accumulate fatigue quickly',
    ]
  } else if (normalizedMethod.includes('rest') && normalizedMethod.includes('pause')) {
    steps = [
      'Do a few standard reps to establish your baseline',
      'Practice the rest-pause breathing rhythm',
      'Plan your mini-rest points before starting',
    ]
  } else {
    steps = [
      'Familiarize yourself with the method protocol',
      'Do a practice set at reduced intensity',
      'Enter the working set with clear intent',
    ]
  }

  return {
    shouldRender: true,
    planType: 'method_ramp',
    headline: 'Method Prep',
    reason: 'This set uses a specific training method. Prime the protocol.',
    steps,
    source: 'method',
    confidence: 'medium',
  }
}

// =============================================================================
// MAIN PLAN BUILDER
// =============================================================================

export function buildExercisePrepPlan(input: PrepPlanInput): ExercisePrepPlan {
  const {
    exerciseName,
    exerciseCategory,
    setExecutionMethod,
    exerciseMethod,
    prescribedLoad,
    targetRPE,
    currentSetNumber,
    currentExerciseIndex,
    isWarmupOrCooldown,
  } = input

  // Only show prep before Set 1
  if (currentSetNumber !== 1) {
    return {
      shouldRender: false,
      planType: 'none',
      headline: '',
      reason: '',
      steps: [],
      source: 'none',
      confidence: 'low',
    }
  }

  // Skip warm-up and cooldown exercises
  if (isWarmupOrCooldown) {
    return {
      shouldRender: false,
      planType: 'none',
      headline: '',
      reason: '',
      steps: [],
      source: 'none',
      confidence: 'low',
    }
  }

  // Priority 1: Advanced skill exercises always get prep
  if (isAdvancedSkillExercise(exerciseName, exerciseCategory)) {
    return buildAdvancedSkillPlan(exerciseName)
  }

  // Priority 2: Weighted exercises with real load
  if (isWeightedExercise(exerciseName, exerciseCategory, prescribedLoad)) {
    return buildWeightedPlan(exerciseName, prescribedLoad)
  }

  // Priority 3: High-intensity methods
  const effectiveMethod = setExecutionMethod || exerciseMethod || ''
  if (isHighIntensityMethod(effectiveMethod)) {
    return buildMethodPlan(effectiveMethod)
  }

  // Priority 4: High RPE (8+) work
  if (isHighRPE(targetRPE) && typeof targetRPE === 'number') {
    return buildHighIntensityPlan(targetRPE)
  }

  // No prep needed for normal accessory work
  return {
    shouldRender: false,
    planType: 'none',
    headline: '',
    reason: '',
    steps: [],
    source: 'none',
    confidence: 'low',
  }
}
