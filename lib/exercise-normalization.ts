/**
 * Exercise Normalization Engine
 * 
 * Provides consistent exercise identification across the system for:
 * - PR tracking
 * - History grouping
 * - Athlete memory comparisons
 * 
 * Supports hybrid strength (calisthenics + barbell) without splitting systems.
 */

// =============================================================================
// CANONICAL EXERCISE KEYS
// =============================================================================

/**
 * Canonical exercise keys for the unified system
 * These are the "source of truth" identifiers
 */
export type CanonicalExerciseKey = 
  // Weighted Calisthenics
  | 'weighted_pull_up'
  | 'weighted_dip'
  | 'weighted_muscle_up'
  
  // Bodyweight Calisthenics
  | 'pull_up'
  | 'dip'
  | 'push_up'
  | 'muscle_up'
  | 'handstand_push_up'
  
  // Skill/Static Holds
  | 'front_lever'
  | 'front_lever_hold'
  | 'planche'
  | 'planche_hold'
  | 'planche_lean'
  | 'back_lever'
  | 'l_sit'
  | 'v_sit'
  | 'handstand'
  
  // Barbell Hinge
  | 'conventional_deadlift'
  | 'sumo_deadlift'
  | 'romanian_deadlift'
  | 'trap_bar_deadlift'
  
  // Barbell Squat (future)
  | 'back_squat'
  | 'front_squat'
  
  // Barbell Press (future)
  | 'bench_press'
  | 'overhead_press'
  
  // Core
  | 'dragon_flag'
  | 'ab_wheel'
  | 'hanging_leg_raise'

// =============================================================================
// EXERCISE CATEGORY MAPPING
// =============================================================================

export type NormalizedCategory = 
  | 'weighted_calisthenics'
  | 'bodyweight_calisthenics'
  | 'skill_static'
  | 'barbell_hinge'
  | 'barbell_squat'
  | 'barbell_press'
  | 'core'
  | 'other'

const EXERCISE_CATEGORY_MAP: Record<CanonicalExerciseKey, NormalizedCategory> = {
  // Weighted Calisthenics
  weighted_pull_up: 'weighted_calisthenics',
  weighted_dip: 'weighted_calisthenics',
  weighted_muscle_up: 'weighted_calisthenics',
  
  // Bodyweight
  pull_up: 'bodyweight_calisthenics',
  dip: 'bodyweight_calisthenics',
  push_up: 'bodyweight_calisthenics',
  muscle_up: 'bodyweight_calisthenics',
  handstand_push_up: 'bodyweight_calisthenics',
  
  // Skill/Static
  front_lever: 'skill_static',
  front_lever_hold: 'skill_static',
  planche: 'skill_static',
  planche_hold: 'skill_static',
  planche_lean: 'skill_static',
  back_lever: 'skill_static',
  l_sit: 'skill_static',
  v_sit: 'skill_static',
  handstand: 'skill_static',
  
  // Barbell Hinge
  conventional_deadlift: 'barbell_hinge',
  sumo_deadlift: 'barbell_hinge',
  romanian_deadlift: 'barbell_hinge',
  trap_bar_deadlift: 'barbell_hinge',
  
  // Barbell Squat
  back_squat: 'barbell_squat',
  front_squat: 'barbell_squat',
  
  // Barbell Press
  bench_press: 'barbell_press',
  overhead_press: 'barbell_press',
  
  // Core
  dragon_flag: 'core',
  ab_wheel: 'core',
  hanging_leg_raise: 'core',
}

// =============================================================================
// ALIAS MAPPING (Loose names -> Canonical keys)
// =============================================================================

/**
 * Maps various string representations to canonical keys
 * Handles typos, variations, and common alternate names
 */
const EXERCISE_ALIAS_MAP: Record<string, CanonicalExerciseKey> = {
  // Weighted Pull-Up aliases
  'weighted_pull_up': 'weighted_pull_up',
  'weighted pull up': 'weighted_pull_up',
  'weighted pullup': 'weighted_pull_up',
  'weighted pull-up': 'weighted_pull_up',
  'wpullup': 'weighted_pull_up',
  'wpu': 'weighted_pull_up',
  
  // Weighted Dip aliases
  'weighted_dip': 'weighted_dip',
  'weighted dip': 'weighted_dip',
  'wdip': 'weighted_dip',
  'wd': 'weighted_dip',
  
  // Weighted Muscle-Up aliases
  'weighted_muscle_up': 'weighted_muscle_up',
  'weighted muscle up': 'weighted_muscle_up',
  'weighted muscleup': 'weighted_muscle_up',
  'weighted muscle-up': 'weighted_muscle_up',
  'wmu': 'weighted_muscle_up',
  
  // Pull-Up aliases
  'pull_up': 'pull_up',
  'pull up': 'pull_up',
  'pullup': 'pull_up',
  'pull-up': 'pull_up',
  'chin up': 'pull_up',
  'chinup': 'pull_up',
  
  // Dip aliases
  'dip': 'dip',
  'dips': 'dip',
  'parallel dip': 'dip',
  'bar dip': 'dip',
  
  // Push-Up aliases
  'push_up': 'push_up',
  'push up': 'push_up',
  'pushup': 'push_up',
  'push-up': 'push_up',
  
  // Muscle-Up aliases
  'muscle_up': 'muscle_up',
  'muscle up': 'muscle_up',
  'muscleup': 'muscle_up',
  'muscle-up': 'muscle_up',
  'mu': 'muscle_up',
  
  // Front Lever aliases
  'front_lever': 'front_lever',
  'front lever': 'front_lever',
  'frontlever': 'front_lever',
  'fl': 'front_lever',
  'front_lever_hold': 'front_lever_hold',
  'front lever hold': 'front_lever_hold',
  
  // Planche aliases
  'planche': 'planche',
  'planche_hold': 'planche_hold',
  'planche hold': 'planche_hold',
  'planche_lean': 'planche_lean',
  'planche lean': 'planche_lean',
  'pl': 'planche',
  
  // Deadlift aliases
  'conventional_deadlift': 'conventional_deadlift',
  'conventional deadlift': 'conventional_deadlift',
  'deadlift': 'conventional_deadlift',
  'dl': 'conventional_deadlift',
  
  'sumo_deadlift': 'sumo_deadlift',
  'sumo deadlift': 'sumo_deadlift',
  'sumo': 'sumo_deadlift',
  
  'romanian_deadlift': 'romanian_deadlift',
  'romanian deadlift': 'romanian_deadlift',
  'rdl': 'romanian_deadlift',
  'stiff leg deadlift': 'romanian_deadlift',
  
  'trap_bar_deadlift': 'trap_bar_deadlift',
  'trap bar deadlift': 'trap_bar_deadlift',
  'hex bar deadlift': 'trap_bar_deadlift',
  'hex bar': 'trap_bar_deadlift',
  
  // Squat aliases
  'back_squat': 'back_squat',
  'back squat': 'back_squat',
  'squat': 'back_squat',
  'barbell squat': 'back_squat',
  
  'front_squat': 'front_squat',
  'front squat': 'front_squat',
  
  // Press aliases
  'bench_press': 'bench_press',
  'bench press': 'bench_press',
  'bench': 'bench_press',
  'barbell bench': 'bench_press',
  
  'overhead_press': 'overhead_press',
  'overhead press': 'overhead_press',
  'ohp': 'overhead_press',
  'military press': 'overhead_press',
  'shoulder press': 'overhead_press',
  
  // Handstand Push-Up aliases
  'handstand_push_up': 'handstand_push_up',
  'handstand push up': 'handstand_push_up',
  'handstand pushup': 'handstand_push_up',
  'hspu': 'handstand_push_up',
  
  // Core aliases
  'dragon_flag': 'dragon_flag',
  'dragon flag': 'dragon_flag',
  'ab_wheel': 'ab_wheel',
  'ab wheel': 'ab_wheel',
  'ab rollout': 'ab_wheel',
  'hanging_leg_raise': 'hanging_leg_raise',
  'hanging leg raise': 'hanging_leg_raise',
  'hlr': 'hanging_leg_raise',
  
  // Other static holds
  'back_lever': 'back_lever',
  'back lever': 'back_lever',
  'l_sit': 'l_sit',
  'l sit': 'l_sit',
  'lsit': 'l_sit',
  'v_sit': 'v_sit',
  'v sit': 'v_sit',
  'vsit': 'v_sit',
  'handstand': 'handstand',
  'hs': 'handstand',
}

// =============================================================================
// NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Normalize an exercise name/id to its canonical key
 * Returns undefined if no match found
 */
export function normalizeExerciseKey(input: string): CanonicalExerciseKey | undefined {
  const normalized = input.toLowerCase().trim()
  return EXERCISE_ALIAS_MAP[normalized]
}

/**
 * Get the category for an exercise
 */
export function getExerciseCategory(exerciseKey: CanonicalExerciseKey): NormalizedCategory {
  return EXERCISE_CATEGORY_MAP[exerciseKey] ?? 'other'
}

/**
 * Check if an exercise is a barbell movement
 */
export function isBarbell(exerciseKey: CanonicalExerciseKey): boolean {
  const category = getExerciseCategory(exerciseKey)
  return ['barbell_hinge', 'barbell_squat', 'barbell_press'].includes(category)
}

/**
 * Check if an exercise is a deadlift variant
 */
export function isDeadlift(exerciseKey: CanonicalExerciseKey): boolean {
  return [
    'conventional_deadlift',
    'sumo_deadlift',
    'romanian_deadlift',
    'trap_bar_deadlift',
  ].includes(exerciseKey)
}

/**
 * Check if an exercise is weighted calisthenics
 */
export function isWeightedCalisthenics(exerciseKey: CanonicalExerciseKey): boolean {
  return getExerciseCategory(exerciseKey) === 'weighted_calisthenics'
}

/**
 * Check if an exercise is a skill/static hold
 */
export function isSkillStatic(exerciseKey: CanonicalExerciseKey): boolean {
  return getExerciseCategory(exerciseKey) === 'skill_static'
}

/**
 * Get display name for an exercise
 */
export function getExerciseDisplayName(exerciseKey: CanonicalExerciseKey): string {
  const nameMap: Record<CanonicalExerciseKey, string> = {
    weighted_pull_up: 'Weighted Pull-Up',
    weighted_dip: 'Weighted Dip',
    weighted_muscle_up: 'Weighted Muscle-Up',
    pull_up: 'Pull-Up',
    dip: 'Dip',
    push_up: 'Push-Up',
    muscle_up: 'Muscle-Up',
    handstand_push_up: 'Handstand Push-Up',
    front_lever: 'Front Lever',
    front_lever_hold: 'Front Lever Hold',
    planche: 'Planche',
    planche_hold: 'Planche Hold',
    planche_lean: 'Planche Lean',
    back_lever: 'Back Lever',
    l_sit: 'L-Sit',
    v_sit: 'V-Sit',
    handstand: 'Handstand',
    conventional_deadlift: 'Conventional Deadlift',
    sumo_deadlift: 'Sumo Deadlift',
    romanian_deadlift: 'Romanian Deadlift',
    trap_bar_deadlift: 'Trap Bar Deadlift',
    back_squat: 'Back Squat',
    front_squat: 'Front Squat',
    bench_press: 'Bench Press',
    overhead_press: 'Overhead Press',
    dragon_flag: 'Dragon Flag',
    ab_wheel: 'Ab Wheel',
    hanging_leg_raise: 'Hanging Leg Raise',
  }
  return nameMap[exerciseKey] ?? exerciseKey
}

// =============================================================================
// PR TYPE COMPATIBILITY
// =============================================================================

export type PRTrackingType = 'max_weight' | 'best_reps' | 'best_hold' | 'best_volume' | 'barbell_1rm' | 'relative_strength'

/**
 * Get applicable PR types for an exercise category
 */
export function getApplicablePRTypes(category: NormalizedCategory): PRTrackingType[] {
  switch (category) {
    case 'weighted_calisthenics':
      return ['max_weight', 'best_reps', 'best_volume', 'relative_strength']
    case 'barbell_hinge':
    case 'barbell_squat':
    case 'barbell_press':
      return ['barbell_1rm', 'best_reps', 'best_volume', 'relative_strength']
    case 'bodyweight_calisthenics':
      return ['best_reps', 'best_volume']
    case 'skill_static':
      return ['best_hold', 'best_reps']
    case 'core':
      return ['best_reps', 'best_hold']
    default:
      return ['best_reps', 'best_volume']
  }
}

/**
 * Determine the primary PR metric for an exercise
 */
export function getPrimaryPRMetric(category: NormalizedCategory): PRTrackingType {
  switch (category) {
    case 'weighted_calisthenics':
      return 'max_weight'
    case 'barbell_hinge':
    case 'barbell_squat':
    case 'barbell_press':
      return 'barbell_1rm'
    case 'bodyweight_calisthenics':
      return 'best_reps'
    case 'skill_static':
      return 'best_hold'
    default:
      return 'best_reps'
  }
}
