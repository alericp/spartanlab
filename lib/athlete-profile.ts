// Athlete Profile Types for Onboarding
// Comprehensive onboarding data model for calisthenics programming
// Supports beginners, intermediates, and advanced athletes

import type { MilitaryProfile } from './military-test-config'

// Re-export for convenience
export type { MilitaryProfile } from './military-test-config'

// =============================================================================
// ATHLETE PROFILE SECTION
// =============================================================================

export type Sex = 'male' | 'female'

export type TrainingExperience = 
  | 'new'           // New to training
  | 'some'          // Some experience (6mo - 1yr)
  | 'intermediate'  // Consistent intermediate (1-3 years)
  | 'advanced'      // Advanced athlete (3+ years)

export type HeightRange =
  | 'under_5_4'
  | '5_4_to_5_7'
  | '5_7_to_5_10'
  | '5_10_to_6_1'
  | '6_1_to_6_4'
  | 'over_6_4'

export type WeightRange =
  | 'under_140'
  | '140_160'
  | '160_180'
  | '180_200'
  | '200_220'
  | 'over_220'

export type BodyFatRange =
  | 'under_10'    // Very lean
  | '10_15'       // Lean/athletic
  | '15_20'       // Fit
  | '20_25'       // Average
  | '25_30'       // Above average
  | 'over_30'     // Higher
  | 'unknown'     // Don't know

// Body fat source - how the value was obtained
export type BodyFatSource = 
  | 'manual'      // User entered directly
  | 'calculator'  // Calculated via U.S. Navy method
  | 'unknown'     // Skipped or not provided

// =============================================================================
// GOALS SECTION
// =============================================================================

export type GoalCategory = 
  | 'skill_mastery'
  | 'strength'
  | 'muscle_physique'
  | 'flexibility'
  | 'mobility'
  | 'endurance'

export type PrimaryGoalType =
  | 'front_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand_pushup'
  | 'handstand'
  | 'l_sit'
  | 'v_sit'
  | 'pancake'
  | 'toe_touch'
  | 'front_splits'
  | 'side_splits'
  | 'weighted_pull'
  | 'weighted_dip'
  | 'general_strength'
  | 'muscle_building'
  | 'work_capacity'

// =============================================================================
// PRIMARY TRAINING OUTCOME
// =============================================================================

/**
 * Primary training outcome - what the user wants to achieve
 * This drives program structure and exercise selection
 */
export type PrimaryTrainingOutcome =
  | 'strength'        // Build calisthenics strength
  | 'max_reps'        // Increase max reps (pull-ups, push-ups, dips)
  | 'military'        // Train for military or tactical fitness tests
  | 'skills'          // Learn advanced calisthenics skills
  | 'endurance'       // Improve endurance and conditioning
  | 'general_fitness' // General fitness and body control

export const PRIMARY_TRAINING_OUTCOME_LABELS: Record<PrimaryTrainingOutcome, string> = {
  strength: 'Bodyweight Strength',
  max_reps: 'Rep Performance',
  military: 'Military & Tactical Prep',
  skills: 'Skill Mastery',
  endurance: 'Endurance & Work Capacity',
  general_fitness: 'General Fitness & Conditioning',
}

export const PRIMARY_TRAINING_OUTCOME_DESCRIPTIONS: Record<PrimaryTrainingOutcome, string> = {
  strength: 'Build raw pushing and pulling power with weighted progressions and strength-focused training',
  max_reps: 'Maximize your pull-up, push-up, and dip numbers with density training and rep progressions',
  military: 'Prepare for official fitness tests with branch-specific conditioning and event training',
  skills: 'Master planche, front lever, muscle-up, and other advanced movements with structured progressions',
  endurance: 'Build work capacity with circuits, density blocks, and sustained conditioning',
  general_fitness: 'Develop well-rounded fitness with balanced strength, conditioning, and movement quality',
}

/**
 * Helper text explaining who each training outcome is best for
 * Displayed in onboarding and goal selection UI
 */
export const PRIMARY_TRAINING_OUTCOME_HELPER_TEXT: Record<PrimaryTrainingOutcome, string> = {
  strength: 'Best for: Users who want raw power, weighted progressions, and strength gains',
  max_reps: 'Best for: Users chasing pull-up, push-up, and dip rep PRs',
  military: 'Best for: Recruits, applicants, and service members preparing for official fitness tests',
  skills: 'Best for: Users who want to master planche, front lever, muscle-up, and other advanced movements',
  endurance: 'Best for: Users focused on conditioning, circuits, and sustained work capacity',
  general_fitness: 'Best for: Users who want balanced strength, movement quality, and consistency without specializing',
}

/**
 * Concrete examples of outcomes for each training path
 */
export const PRIMARY_TRAINING_OUTCOME_EXAMPLES: Record<PrimaryTrainingOutcome, string[]> = {
  strength: ['Weighted pull-ups', 'Weighted dips', 'Harder progressions', 'Lower rep ranges'],
  max_reps: ['20+ pull-ups', '50+ push-ups', 'Rep density', 'Volume tolerance'],
  military: ['IST/PFT/CFT prep', 'ACFT training', 'Boot camp readiness', 'PT test standards'],
  skills: ['Planche', 'Front lever', 'Muscle-up', 'Handstand push-up'],
  endurance: ['Circuit training', 'Conditioning blocks', 'High-rep work', 'Work capacity'],
  general_fitness: ['Overall improvement', 'Movement quality', 'Consistency', 'Balanced fitness'],
}

// =============================================================================
// SKILL SELECTION
// =============================================================================

export type SkillGoal =
  | 'front_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand_pushup'
  | 'handstand'
  | 'iron_cross'
  | 'l_sit'
  | 'v_sit'
  | 'i_sit'

export type FlexibilityGoal =
  | 'pancake'
  | 'toe_touch'
  | 'front_splits'
  | 'side_splits'

export type RangeTrainingIntent = 'flexibility' | 'mobility' | 'hybrid'

// =============================================================================
// STRENGTH BENCHMARKS
// =============================================================================

// Metric confidence - tracks whether value is known or estimated
export type MetricConfidence = 'known' | 'unknown' | 'estimated'

export type PullUpCapacity =
  | '0'
  | '1_3'
  | '4_7'
  | '8_12'
  | '13_17'
  | '18_22'
  | '23_plus'
  | 'unknown'  // Don't know / not tested

export type PushUpCapacity =
  | '0_10'
  | '10_25'
  | '25_40'
  | '40_60'
  | '60_plus'
  | 'unknown'

export type DipCapacity =
  | '0'
  | '1_5'
  | '6_10'
  | '11_15'
  | '16_20'
  | '21_25'
  | '25_plus'
  | 'unknown'

export type WallHSPUReps =
  | '0'
  | '1_3'
  | '4_6'
  | '7_10'
  | '10_plus'
  | 'unknown'

// Weighted benchmarks - exact values in lbs/kg
export interface WeightedBenchmark {
  load: number | null      // Weight added
  unit: 'lbs' | 'kg'
  reps?: number            // Reps at that weight
}

// =============================================================================
// SKILL BENCHMARKS - Progression + Performance
// =============================================================================

export type FrontLeverProgression =
  | 'none'
  | 'tuck'
  | 'adv_tuck'
  | 'one_leg'
  | 'straddle'
  | 'full'
  | 'unknown'

export type PlancheProgression =
  | 'none'
  | 'lean'
  | 'tuck'
  | 'adv_tuck'
  | 'straddle'
  | 'full'
  | 'unknown'

export type MuscleUpReadiness =
  | 'none'
  | 'working_on'     // Can do high pull-ups
  | 'kipping'        // Can do kipping muscle-ups
  | 'strict_1_3'     // 1-3 strict
  | 'strict_4_plus'  // 4+ strict
  | 'unknown'

export type HSPUProgression =
  | 'none'
  | 'pike'
  | 'box_pike'
  | 'wall_hspu'
  | 'freestanding'
  | 'unknown'

export type LSitHoldCapacity =
  | 'none'
  | 'under_10'
  | '10_20'
  | '20_30'
  | '30_plus'
  | 'unknown'

export type VSitHoldCapacity =
  | 'none'
  | 'under_5'
  | '5_10'
  | '10_plus'
  | 'unknown'

export interface SkillBenchmark {
  progression: string
  holdSeconds?: number
  reps?: number
}

// =============================================================================
// SKILL TRAINING HISTORY (for tendon adaptation estimation)
// =============================================================================

export type SkillTrainingHistory = 
  | 'never'              // Never trained this skill
  | 'tried_little'       // Tried a little, dabbled
  | 'trained_consistently' // Trained consistently for a period
  | 'previously_strong'  // Was previously very strong at this

export type SkillLastTrained =
  | 'currently'          // Currently training
  | 'within_3_months'    // Within the last 3 months
  | '3_to_6_months'      // 3-6 months ago
  | '6_to_12_months'     // 6-12 months ago
  | '1_to_2_years'       // 1-2 years ago
  | 'over_2_years'       // More than 2 years ago

// Tendon adaptation levels with finer granularity for internal mapping
export type TendonAdaptationLevel = 'low' | 'low_moderate' | 'moderate' | 'moderate_high' | 'high'

export interface SkillHistoryEntry {
  trainingHistory: SkillTrainingHistory
  lastTrained: SkillLastTrained | null  // null if "never"
  tendonAdaptationScore: TendonAdaptationLevel
}

// Labels for UI
export const SKILL_TRAINING_HISTORY_LABELS: Record<SkillTrainingHistory, string> = {
  'never': 'Never',
  'tried_little': 'Tried a little',
  'trained_consistently': 'Trained consistently',
  'previously_strong': 'Previously strong',
}

export const SKILL_TRAINING_HISTORY_DESCRIPTIONS: Record<SkillTrainingHistory, string> = {
  'never': 'No experience with this skill',
  'tried_little': 'Dabbled or did occasional work',
  'trained_consistently': 'Trained this for weeks or months',
  'previously_strong': 'Could hold/perform intermediate+ levels',
}

export const SKILL_LAST_TRAINED_LABELS: Record<SkillLastTrained, string> = {
  'currently': 'Currently training',
  'within_3_months': 'Within 3 months',
  '3_to_6_months': '3-6 months ago',
  '6_to_12_months': '6-12 months ago',
  '1_to_2_years': '1-2 years ago',
  'over_2_years': 'Over 2 years ago',
}

// =============================================================================
// TENDON ADAPTATION CALCULATOR
// =============================================================================

/**
 * Calculates tendon adaptation level based on training history and time since last training.
 * 
 * RETENTION BEHAVIOR:
 * - Short layoffs (0-3 months): Retain most adaptation
 * - Medium layoffs (3-6 months): Some detraining, but significant retention
 * - Extended layoffs (6-12 months): Notable detraining, reduced starting point
 * - Long layoffs (1-2 years): Major detraining, conservative approach
 * - Very long layoffs (2+ years): Mostly reset, minimal retained benefit
 * 
 * MAPPING TABLE:
 * | History            | Time Since      | Adaptation   | Outcome                          |
 * |--------------------|-----------------|--------------|----------------------------------|
 * | Never              | N/A             | low          | Foundation layer                 |
 * | Tried a little     | Any             | low          | Conservative start               |
 * | Trained consistently| Currently      | moderate_high| Beginner with faster ramp        |
 * | Trained consistently| Within 3 months| moderate_high| Beginner with faster ramp        |
 * | Trained consistently| 3-6 months     | moderate     | Beginner progression             |
 * | Trained consistently| 6-12 months    | low_moderate | Conservative beginner            |
 * | Trained consistently| 1-2 years      | low          | Foundation + beginner blend      |
 * | Trained consistently| 2+ years       | low          | Mostly reset                     |
 * | Previously strong  | Currently       | high         | Intermediate entry possible      |
 * | Previously strong  | Within 3 months | high         | Cautious intermediate entry      |
 * | Previously strong  | 3-6 months      | moderate_high| Beginner/intermediate bridge     |
 * | Previously strong  | 6-12 months     | moderate     | Beginner with retained familiarity|
 * | Previously strong  | 1-2 years       | low_moderate | Foundation + beginner blend      |
 * | Previously strong  | 2+ years        | low          | Mostly reset                     |
 * 
 * SAFETY: This score informs starting point but NEVER overrides current strength metrics.
 */
export function calculateTendonAdaptation(
  history: SkillTrainingHistory,
  lastTrained: SkillLastTrained | null
): TendonAdaptationLevel {
  // Never trained = always low, no exceptions
  if (history === 'never') {
    return 'low'
  }
  
  // Tried a little = low regardless of when (minimal adaptation built)
  if (history === 'tried_little') {
    return 'low'
  }
  
  // Handle "trained consistently" with time-based decay
  if (history === 'trained_consistently') {
    switch (lastTrained) {
      case 'currently':
      case 'within_3_months':
        // Recent consistent training = strong beginner adaptation
        return 'moderate_high'
      case '3_to_6_months':
        // Some detraining but still solid base
        return 'moderate'
      case '6_to_12_months':
        // Notable detraining, conservative approach
        return 'low_moderate'
      case '1_to_2_years':
      case 'over_2_years':
      default:
        // Long layoff = mostly lost
        return 'low'
    }
  }
  
  // Handle "previously strong" with time-based decay
  if (history === 'previously_strong') {
    switch (lastTrained) {
      case 'currently':
      case 'within_3_months':
        // Recently strong = can potentially enter intermediate
        return 'high'
      case '3_to_6_months':
        // Some detraining but significant retained strength
        return 'moderate_high'
      case '6_to_12_months':
        // Extended layoff, notable detraining
        return 'moderate'
      case '1_to_2_years':
        // Major detraining, but some neural memory
        return 'low_moderate'
      case 'over_2_years':
      default:
        // Very long layoff = mostly reset
        return 'low'
    }
  }
  
  return 'low'
}

// =============================================================================
// FLEXIBILITY BENCHMARKS
// =============================================================================

export type FlexibilityLevel =
  | 'none'           // Cannot reach
  | 'beginner'       // Very limited
  | 'developing'     // Making progress
  | 'intermediate'   // Decent range
  | 'advanced'       // Good range
  | 'elite'          // Full expression
  | 'unknown'        // Don't know / not tested

export interface FlexibilityBenchmark {
  level: FlexibilityLevel
  rangeIntent: RangeTrainingIntent | null  // Flexibility vs mobility focus
}

// =============================================================================
// EQUIPMENT
// =============================================================================

export type EquipmentType =
  | 'pullup_bar'
  | 'dip_bars'
  | 'parallettes'
  | 'rings'
  | 'resistance_bands'
  | 'weights'
  | 'bench_box'
  | 'minimal'

// =============================================================================
// TRAINING PATH TYPE
// =============================================================================

/**
 * Training path type - determines the overall focus of the program
 */
export type TrainingPathType = 'skill_progression' | 'strength_endurance' | 'hybrid'

export const TRAINING_PATH_LABELS: Record<TrainingPathType, string> = {
  skill_progression: 'Skill Progression',
  strength_endurance: 'Strength & Endurance',
  hybrid: 'Hybrid Training',
}

export const TRAINING_PATH_DESCRIPTIONS: Record<TrainingPathType, string> = {
  skill_progression: 'Focus on advanced calisthenics skills like planche, front lever, muscle-up, and handstand push-ups.',
  strength_endurance: 'Focus on improving pull-ups, push-ups, dips, and bodyweight strength for general fitness or military-style training.',
  hybrid: 'Combine skill work with strength and endurance training.',
}

// =============================================================================
// TRAINING SCHEDULE
// =============================================================================

export type TrainingDaysPerWeek = 2 | 3 | 4 | 5 | 6 | 'flexible'

// Workout duration: 20=20-30min, 30=30-45min, 45=45-60min, 60=60-75min, 75=75-90min, 90=90min, 120=120min
  export type SessionLengthPreference = 20 | 30 | 45 | 60 | 75 | 90 | 120 | 'flexible'
  
  // Semantic workout duration preference for program builder
  export type WorkoutDurationPreference = 'short' | 'medium' | 'long' | 'extended' | 'elite' | 'flexible'
  
  export const WORKOUT_DURATION_LABELS: Record<WorkoutDurationPreference, string> = {
  short: '20–30 minutes',
  medium: '30–45 minutes',
  long: '45–60 minutes',
  extended: '60–90 minutes',
  elite: '90–120 minutes',
  flexible: 'Flexible / varies',
  }
  
  export const WORKOUT_DURATION_DESCRIPTIONS: Record<WorkoutDurationPreference, string> = {
  short: '4–5 exercises, minimal accessories, density or supersets',
  medium: '5–7 exercises, balanced training structure',
  long: '6–8 exercises, full skill blocks, some accessory work',
  extended: '7–9 exercises, complete programming with accessories',
  elite: '10+ exercises, iron cross / weighted strength / ring specialization',
  flexible: 'Programs adapt based on available time',
  }

// Maps SessionLengthPreference to WorkoutDurationPreference
export function sessionLengthToDurationPreference(sessionLength: SessionLengthPreference): WorkoutDurationPreference {
  if (sessionLength === 'flexible') return 'flexible'
  if (sessionLength === 20) return 'short'
  if (sessionLength === 30) return 'medium'
  if (sessionLength === 45) return 'long'
  if (sessionLength === 60 || sessionLength === 75) return 'extended'
  if (sessionLength === 90 || sessionLength === 120) return 'elite'
  return 'medium' // default
}

export type SessionStylePreference = 'efficient' | 'full'

// =============================================================================
// RECOVERY / LIFESTYLE
// =============================================================================

export type RecoveryQuality = 'good' | 'normal' | 'poor'

export interface RecoveryProfile {
  sleepQuality: RecoveryQuality
  energyLevel: RecoveryQuality
  stressLevel: RecoveryQuality
  recoveryConfidence: RecoveryQuality
}

// =============================================================================
// READINESS CALIBRATION TYPES
// =============================================================================

// Question response types
export type TrainingConsistencyAnswer = 'very_consistent' | 'mostly_consistent' | 'inconsistent' | 'just_starting'
export type RecoveryToleranceAnswer = 'bounces_back' | 'needs_time' | 'easily_overtrained'
export type StrengthPerceptionAnswer = 'above_average' | 'average' | 'below_average' | 'unsure'
export type SkillFamiliarityAnswer = 'experienced' | 'some_exposure' | 'new_to_skills'
export type BodyTypeAnswer = 'lean_light' | 'athletic_medium' | 'strong_heavy' | 'tall_long'

// Readiness scores (0-100 internal scale)
export interface ReadinessScores {
  strengthPotentialScore: number      // 0-100: Estimated strength ceiling based on perception + body type
  skillAdaptationScore: number        // 0-100: How quickly they'll pick up skill work
  recoveryToleranceScore: number      // 0-100: How much volume/intensity they can handle
  volumeToleranceScore: number        // 0-100: Weekly training capacity
}

// Full readiness calibration data
export interface ReadinessCalibration {
  // Raw answers
  trainingConsistency: TrainingConsistencyAnswer | null
  recoveryTolerance: RecoveryToleranceAnswer | null
  strengthPerception: StrengthPerceptionAnswer | null
  skillFamiliarity: SkillFamiliarityAnswer | null
  bodyType: BodyTypeAnswer | null
  
  // Computed scores (calculated from answers)
  scores: ReadinessScores | null
}

// Labels for UI
export const TRAINING_CONSISTENCY_LABELS: Record<TrainingConsistencyAnswer, string> = {
  'very_consistent': 'Very consistent',
  'mostly_consistent': 'Mostly consistent',
  'inconsistent': 'On and off',
  'just_starting': 'Just starting out',
}

export const TRAINING_CONSISTENCY_DESCRIPTIONS: Record<TrainingConsistencyAnswer, string> = {
  'very_consistent': 'Rarely miss sessions, training is a habit',
  'mostly_consistent': 'Train regularly with occasional breaks',
  'inconsistent': 'Tend to start and stop, hard to maintain',
  'just_starting': 'Building the habit now',
}

export const RECOVERY_TOLERANCE_LABELS: Record<RecoveryToleranceAnswer, string> = {
  'bounces_back': 'Quick recovery',
  'needs_time': 'Need adequate rest',
  'easily_overtrained': 'Recover slowly',
}

export const RECOVERY_TOLERANCE_DESCRIPTIONS: Record<RecoveryToleranceAnswer, string> = {
  'bounces_back': 'Can train hard day after day',
  'needs_time': 'Need rest days between hard sessions',
  'easily_overtrained': 'Get fatigued or sore easily',
}

export const STRENGTH_PERCEPTION_LABELS: Record<StrengthPerceptionAnswer, string> = {
  'above_average': 'Stronger than most',
  'average': 'About average',
  'below_average': 'Working on it',
  'unsure': 'Not sure yet',
}

export const SKILL_FAMILIARITY_LABELS: Record<SkillFamiliarityAnswer, string> = {
  'experienced': 'Experienced',
  'some_exposure': 'Some exposure',
  'new_to_skills': 'New to skills',
}

export const SKILL_FAMILIARITY_DESCRIPTIONS: Record<SkillFamiliarityAnswer, string> = {
  'experienced': 'Have trained levers, handstands, or similar',
  'some_exposure': 'Tried some skill work before',
  'new_to_skills': 'Mostly strength or cardio background',
}

export const BODY_TYPE_LABELS: Record<BodyTypeAnswer, string> = {
  'lean_light': 'Lean & light',
  'athletic_medium': 'Athletic build',
  'strong_heavy': 'Strong & heavy',
  'tall_long': 'Tall / long limbs',
}

export const BODY_TYPE_DESCRIPTIONS: Record<BodyTypeAnswer, string> = {
  'lean_light': 'Lower body weight, good leverage for skills',
  'athletic_medium': 'Balanced build, versatile',
  'strong_heavy': 'More muscle mass, strength-focused',
  'tall_long': 'Longer levers, may need more time on skills',
}

// =============================================================================
// READINESS SCORE CALCULATOR
// =============================================================================

export function calculateReadinessScores(calibration: Partial<ReadinessCalibration>): ReadinessScores {
  // Default middle-of-road scores
  let strengthPotential = 50
  let skillAdaptation = 50
  let recoveryTolerance = 50
  let volumeTolerance = 50

  // Training consistency affects volume tolerance and skill adaptation
  switch (calibration.trainingConsistency) {
    case 'very_consistent':
      volumeTolerance += 25
      skillAdaptation += 10
      break
    case 'mostly_consistent':
      volumeTolerance += 10
      skillAdaptation += 5
      break
    case 'inconsistent':
      volumeTolerance -= 10
      break
    case 'just_starting':
      volumeTolerance -= 20
      skillAdaptation -= 5
      break
  }

  // Recovery tolerance affects recovery and volume scores
  switch (calibration.recoveryTolerance) {
    case 'bounces_back':
      recoveryTolerance += 30
      volumeTolerance += 15
      break
    case 'needs_time':
      // Keep at baseline
      break
    case 'easily_overtrained':
      recoveryTolerance -= 25
      volumeTolerance -= 15
      break
  }

  // Strength perception affects strength potential
  switch (calibration.strengthPerception) {
    case 'above_average':
      strengthPotential += 25
      break
    case 'average':
      strengthPotential += 5
      break
    case 'below_average':
      strengthPotential -= 15
      break
    case 'unsure':
      // Keep at baseline - conservative
      break
  }

  // Skill familiarity affects skill adaptation
  switch (calibration.skillFamiliarity) {
    case 'experienced':
      skillAdaptation += 30
      break
    case 'some_exposure':
      skillAdaptation += 10
      break
    case 'new_to_skills':
      skillAdaptation -= 10
      break
  }

  // Body type affects multiple scores
  switch (calibration.bodyType) {
    case 'lean_light':
      skillAdaptation += 15
      strengthPotential -= 5
      break
    case 'athletic_medium':
      strengthPotential += 10
      skillAdaptation += 5
      break
    case 'strong_heavy':
      strengthPotential += 20
      skillAdaptation -= 15
      recoveryTolerance += 5
      break
    case 'tall_long':
      skillAdaptation -= 10  // Longer levers = harder skills
      strengthPotential += 5
      break
  }

  // Clamp all scores to 0-100
  return {
    strengthPotentialScore: Math.max(0, Math.min(100, strengthPotential)),
    skillAdaptationScore: Math.max(0, Math.min(100, skillAdaptation)),
    recoveryToleranceScore: Math.max(0, Math.min(100, recoveryTolerance)),
    volumeToleranceScore: Math.max(0, Math.min(100, volumeTolerance)),
  }
}

// =============================================================================
// FULL ONBOARDING PROFILE
// =============================================================================

export interface OnboardingProfile {
  // Section 1: Athlete Profile
  sex: Sex | null
  heightRange: HeightRange | null
  weightRange: WeightRange | null
  bodyFatRange: BodyFatRange | null
  bodyFatPercent: number | null           // Exact percentage (from manual or calculator)
  bodyFatSource: BodyFatSource | null     // How the value was obtained
  trainingExperience: TrainingExperience | null
  
  // Section 1b: Primary Training Outcome
  // This drives program structure - what does the user want to achieve?
  primaryTrainingOutcome: PrimaryTrainingOutcome | null
  
  // Section 1b-military: Military Test Prep Profile
  // Conditional - only populated if primaryTrainingOutcome === 'military'
  militaryProfile: MilitaryProfile | null
  
  // Section 1c: Training Path Type
  // Determines overall program focus: skill-based, strength/endurance, or hybrid
  trainingPathType: TrainingPathType | null
  
  // Section 2: Goals
  primaryGoal: PrimaryGoalType | null
  secondaryGoal: PrimaryGoalType | null
  goalCategories: GoalCategory[]
  
  // Section 3: Skill Selection (conditional - only if skills/hybrid outcome)
  selectedSkills: SkillGoal[]
  selectedFlexibility: FlexibilityGoal[]
  
  // Section 4: Strength Benchmarks
  pullUpMax: PullUpCapacity | null
  pushUpMax: PushUpCapacity | null
  dipMax: DipCapacity | null
  wallHSPUReps: WallHSPUReps | null
  weightedPullUp: WeightedBenchmark | null
  weightedDip: WeightedBenchmark | null
  
  // Section 5: Skill Benchmarks
  frontLever: SkillBenchmark | null
  planche: SkillBenchmark | null
  muscleUp: MuscleUpReadiness | null
  hspu: SkillBenchmark | null
  lSitHold: LSitHoldCapacity | null
  vSitHold: VSitHoldCapacity | null
  
  // Section 5b: Skill Training History (for tendon adaptation)
  skillHistory: {
    front_lever?: SkillHistoryEntry
    planche?: SkillHistoryEntry
    muscle_up?: SkillHistoryEntry
    handstand_pushup?: SkillHistoryEntry
    handstand?: SkillHistoryEntry
    l_sit?: SkillHistoryEntry
    v_sit?: SkillHistoryEntry
  }
  
  // Section 6: Flexibility Benchmarks
  pancake: FlexibilityBenchmark | null
  toeTouch: FlexibilityBenchmark | null
  frontSplits: FlexibilityBenchmark | null
  sideSplits: FlexibilityBenchmark | null
  
  // Section 7: Equipment
  equipment: EquipmentType[]
  
  // Section 8: Training Schedule
  trainingDaysPerWeek: TrainingDaysPerWeek | null
  sessionLengthMinutes: SessionLengthPreference | null
  workoutDurationPreference: WorkoutDurationPreference | null  // Semantic duration for program builder
  sessionStyle: SessionStylePreference | null
  
  // Section 9: Recovery / Lifestyle
  recovery: RecoveryProfile | null
  
  // Section 10: Readiness Calibration
  readinessCalibration: ReadinessCalibration | null
  
  // Meta
  hasSeenDashboardIntro: boolean
  onboardingComplete: boolean
}

// =============================================================================
// LEGACY TYPE ALIASES (backward compatibility)
// =============================================================================

export type SkillInterest = SkillGoal
export type FlexibilityFocus = 'none' | 'minor' | 'important'
export type OnboardingGoal = 'skill' | 'strength' | 'endurance' | 'abs' | 'general'
export type TrainingTimeRange = '10_20' | '20_30' | '30_45' | '45_60' | '60_plus'
export type WeeklyTrainingDays = '2' | '3' | '4' | '5_plus'
export type EnduranceInterest = 'yes' | 'occasionally' | 'no'
export type LSitCapacity = 'none' | 'under_10' | '10_20' | '20_plus'

// =============================================================================
// DISPLAY LABELS
// =============================================================================

export const TRAINING_EXPERIENCE_LABELS: Record<TrainingExperience, string> = {
  'new': 'New to training',
  'some': 'Some experience',
  'intermediate': 'Consistent intermediate',
  'advanced': 'Advanced athlete',
}

export const TRAINING_EXPERIENCE_DESCRIPTIONS: Record<TrainingExperience, string> = {
  'new': 'Just getting started or less than 6 months',
  'some': '6 months to 1 year of training',
  'intermediate': '1-3 years of consistent training',
  'advanced': '3+ years of dedicated training',
}

export const HEIGHT_LABELS: Record<HeightRange, string> = {
  'under_5_4': "Under 5'4\"",
  '5_4_to_5_7': "5'4\" – 5'7\"",
  '5_7_to_5_10': "5'7\" – 5'10\"",
  '5_10_to_6_1': "5'10\" – 6'1\"",
  '6_1_to_6_4': "6'1\" – 6'4\"",
  'over_6_4': "Over 6'4\"",
}

export const WEIGHT_LABELS: Record<WeightRange, string> = {
  'under_140': 'Under 140 lbs',
  '140_160': '140 – 160 lbs',
  '160_180': '160 – 180 lbs',
  '180_200': '180 – 200 lbs',
  '200_220': '200 – 220 lbs',
  'over_220': '220+ lbs',
}

export const BODY_FAT_LABELS: Record<BodyFatRange, string> = {
  'under_10': 'Under 10%',
  '10_15': '10-15%',
  '15_20': '15-20%',
  '20_25': '20-25%',
  '25_30': '25-30%',
  'over_30': '30%+',
  'unknown': "I don't know",
}

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  'skill_mastery': 'Skill Mastery',
  'strength': 'Strength',
  'muscle_physique': 'Muscle / Physique',
  'flexibility': 'Flexibility',
  'mobility': 'Mobility',
  'endurance': 'Endurance / Work Capacity',
}

export const GOAL_CATEGORY_DESCRIPTIONS: Record<GoalCategory, string> = {
  'skill_mastery': 'Unlock advanced calisthenics movements',
  'strength': 'Build raw pushing and pulling power',
  'muscle_physique': 'Support hypertrophy and aesthetics',
  'flexibility': 'Increase passive range of motion',
  'mobility': 'Develop strength through range',
  'endurance': 'Improve work capacity and conditioning',
}

export const SKILL_GOAL_LABELS: Record<SkillGoal, string> = {
  'front_lever': 'Front Lever',
  'planche': 'Planche',
  'muscle_up': 'Muscle-Up',
  'handstand_pushup': 'Handstand Push-Up',
  'handstand': 'Handstand',
  'l_sit': 'L-Sit',
  'v_sit': 'V-Sit',
  'i_sit': 'Manna / I-Sit',
}

export const FLEXIBILITY_GOAL_LABELS: Record<FlexibilityGoal, string> = {
  'pancake': 'Pancake',
  'toe_touch': 'Toe Touch / Forward Fold',
  'front_splits': 'Front Splits',
  'side_splits': 'Side Splits',
}

export const PULLUP_LABELS: Record<PullUpCapacity, string> = {
  '0': '0',
  '1_3': '1–3',
  '4_7': '4–7',
  '8_12': '8–12',
  '13_17': '13–17',
  '18_22': '18–22',
  '23_plus': '23+',
  'unknown': "Don't know",
}

export const PUSHUP_LABELS: Record<PushUpCapacity, string> = {
  '0_10': '0���10',
  '10_25': '10–25',
  '25_40': '25–40',
  '40_60': '40–60',
  '60_plus': '60+',
  'unknown': "Don't know",
}

export const DIP_LABELS: Record<DipCapacity, string> = {
  '0': '0',
  '1_5': '1–5',
  '6_10': '6–10',
  '11_15': '11–15',
  '16_20': '16–20',
  '21_25': '21–25',
  '25_plus': '25+',
  'unknown': "Don't know",
}

export const WALL_HSPU_LABELS: Record<WallHSPUReps, string> = {
  '0': '0',
  '1_3': '1–3',
  '4_6': '4–6',
  '7_10': '7–10',
  '10_plus': '10+',
  'unknown': "Don't know",
}

export const FRONT_LEVER_LABELS: Record<FrontLeverProgression, string> = {
  'none': 'Not started',
  'tuck': 'Tuck',
  'adv_tuck': 'Advanced Tuck',
  'one_leg': 'One Leg',
  'straddle': 'Straddle',
  'full': 'Full',
  'unknown': "Don't know",
}

export const PLANCHE_LABELS: Record<PlancheProgression, string> = {
  'none': 'Not started',
  'lean': 'Planche Lean',
  'tuck': 'Tuck',
  'adv_tuck': 'Advanced Tuck',
  'straddle': 'Straddle',
  'full': 'Full',
  'unknown': "Don't know",
}

export const MUSCLE_UP_LABELS: Record<MuscleUpReadiness, string> = {
  'none': 'Not yet',
  'working_on': 'Working on it',
  'kipping': 'Kipping only',
  'strict_1_3': '1–3 strict',
  'strict_4_plus': '4+ strict',
  'unknown': "Don't know",
}

export const HSPU_LABELS: Record<HSPUProgression, string> = {
  'none': 'Not started',
  'pike': 'Pike push-ups',
  'box_pike': 'Elevated pike',
  'wall_hspu': 'Wall HSPU',
  'freestanding': 'Freestanding',
  'unknown': "Don't know",
}

export const LSIT_HOLD_LABELS: Record<LSitHoldCapacity, string> = {
  'none': "Can't hold",
  'under_10': 'Under 10s',
  '10_20': '10–20s',
  '20_30': '20–30s',
  '30_plus': '30s+',
  'unknown': "Don't know",
}

export const VSIT_HOLD_LABELS: Record<VSitHoldCapacity, string> = {
  'none': "Can't hold",
  'under_5': 'Under 5s',
  '5_10': '5–10s',
  '10_plus': '10s+',
  'unknown': "Don't know",
}

export const FLEXIBILITY_LEVEL_LABELS: Record<FlexibilityLevel, string> = {
  'none': 'Cannot reach',
  'beginner': 'Very limited',
  'developing': 'Making progress',
  'intermediate': 'Decent range',
  'advanced': 'Good range',
  'elite': 'Full expression',
  'unknown': "Don't know",
}

export const RANGE_INTENT_LABELS: Record<RangeTrainingIntent, string> = {
  'flexibility': 'Flexibility focus',
  'mobility': 'Mobility focus',
  'hybrid': 'Both',
}

export const RANGE_INTENT_DESCRIPTIONS: Record<RangeTrainingIntent, string> = {
  'flexibility': 'Prioritize passive range and relaxation',
  'mobility': 'Prioritize strength and control through range',
  'hybrid': 'Balance both flexibility and mobility work',
}

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  'pullup_bar': 'Pull-up bar',
  'dip_bars': 'Dip bars',
  'parallettes': 'Parallettes',
  'rings': 'Rings',
  'resistance_bands': 'Bands',
  'weights': 'Weights',
  'bench_box': 'Bench / Box',
  'minimal': 'Minimal / Home setup',
}

export const SESSION_LENGTH_LABELS: Record<SessionLengthPreference, string> = {
  20: '20–30 minutes',
  30: '30–45 minutes',
  45: '45–60 minutes',
  60: '60–75 minutes',
  75: '75–90 minutes',
  'flexible': 'Flexible / varies',
}

export const TRAINING_DAYS_LABELS: Record<TrainingDaysPerWeek, string> = {
  2: '2 days',
  3: '3 days',
  4: '4 days',
  5: '5 days',
  6: '6 days',
  'flexible': 'Flexible',
}

export const SESSION_STYLE_LABELS: Record<SessionStylePreference, string> = {
  'efficient': 'Shorter, efficient sessions',
  'full': 'Fuller, comprehensive sessions',
}

export const RECOVERY_LABELS: Record<RecoveryQuality, string> = {
  'good': 'Good',
  'normal': 'Normal',
  'poor': 'Poor',
}

// Legacy labels for backward compatibility
export const SKILL_INTEREST_LABELS = SKILL_GOAL_LABELS
export const GOAL_LABELS: Record<OnboardingGoal, string> = {
  'skill': 'Unlock skills',
  'strength': 'Build strength',
  'endurance': 'Improve endurance',
  'abs': 'Visible abs / core',
  'general': 'General fitness',
}
export const FLEXIBILITY_FOCUS_LABELS: Record<FlexibilityFocus, string> = {
  'none': 'Not a focus',
  'minor': 'Minor accessory goal',
  'important': 'Important training goal',
}
export const TRAINING_TIME_LABELS: Record<TrainingTimeRange, string> = {
  '10_20': '10–20 min',
  '20_30': '20–30 min',
  '30_45': '30–45 min',
  '45_60': '45–60 min',
  '60_plus': '60+ min',
}
export const WEEKLY_TRAINING_LABELS: Record<WeeklyTrainingDays, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5_plus': '5+',
}
export const ENDURANCE_INTEREST_LABELS: Record<EnduranceInterest, string> = {
  'yes': 'Yes, regularly',
  'occasionally': 'Occasionally',
  'no': 'Not really',
}
export const LSIT_LABELS: Record<LSitCapacity, string> = {
  'none': 'No',
  'under_10': 'Under 10 sec',
  '10_20': '10–20 sec',
  '20_plus': '20+ sec',
}

// =============================================================================
// STORAGE FUNCTIONS
// =============================================================================

const ONBOARDING_STORAGE_KEY = 'spartanlab_onboarding_profile'

export function saveOnboardingProfile(profile: OnboardingProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(profile))
  }
}

export function getOnboardingProfile(): OnboardingProfile | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function isOnboardingComplete(): boolean {
  const profile = getOnboardingProfile()
  if (!profile) return false
  
  // Minimum requirements for a complete onboarding
  return (
    profile.onboardingComplete === true ||
    (
      profile.sex !== null &&
      profile.trainingExperience !== null &&
      profile.primaryGoal !== null &&
      profile.trainingDaysPerWeek !== null &&
      profile.sessionLengthMinutes !== null &&
      profile.equipment.length > 0
    )
  )
}

export function createEmptyOnboardingProfile(): OnboardingProfile {
  return {
  // Section 1: Athlete Profile
  sex: null,
  heightRange: null,
  weightRange: null,
  bodyFatRange: null,
  bodyFatPercent: null,
  bodyFatSource: null,
  trainingExperience: null,
  
  // Section 1b: Primary Training Outcome
  primaryTrainingOutcome: null,
  
  // Section 1b-military: Military Profile
  militaryProfile: null,
  
  // Section 1c: Training Path Type
  trainingPathType: null,
  
  // Section 2: Goals
  primaryGoal: null,
  secondaryGoal: null,
  goalCategories: [],
  
  // Section 3: Skill Selection
  selectedSkills: [],
    selectedFlexibility: [],
    
    // Section 4: Strength Benchmarks
    pullUpMax: null,
    pushUpMax: null,
    dipMax: null,
    wallHSPUReps: null,
    weightedPullUp: null,
    weightedDip: null,
    
  // Section 5: Skill Benchmarks
  frontLever: null,
  planche: null,
  muscleUp: null,
  hspu: null,
  lSitHold: null,
  vSitHold: null,
  
  // Section 5b: Skill Training History
  skillHistory: {},
  
  // Section 6: Flexibility Benchmarks
    pancake: null,
    toeTouch: null,
    frontSplits: null,
    sideSplits: null,
    
    // Section 7: Equipment
    equipment: [],
    
  // Section 8: Training Schedule
  trainingDaysPerWeek: null,
  sessionLengthMinutes: null,
  workoutDurationPreference: null,
  sessionStyle: null,
  
  // Section 9: Recovery / Lifestyle
    recovery: null,
    
    // Section 10: Readiness Calibration
    readinessCalibration: null,
    
    // Meta
    hasSeenDashboardIntro: false,
    onboardingComplete: false,
  }
}

// =============================================================================
// DASHBOARD INTRO HELPERS
// =============================================================================

export function hasSeenDashboardIntro(): boolean {
  const profile = getOnboardingProfile()
  return profile?.hasSeenDashboardIntro ?? false
}

export function markDashboardIntroSeen(): void {
  const profile = getOnboardingProfile()
  if (profile) {
    saveOnboardingProfile({
      ...profile,
      hasSeenDashboardIntro: true,
    })
  }
}

export function resetDashboardIntro(): void {
  const profile = getOnboardingProfile()
  if (profile) {
    saveOnboardingProfile({
      ...profile,
      hasSeenDashboardIntro: false,
    })
  }
}

// =============================================================================
// STRENGTH TIER ESTIMATION
// =============================================================================

export type StrengthTier = 'novice' | 'developing' | 'intermediate' | 'advanced' | 'elite'

export function estimateStrengthTier(profile: OnboardingProfile): StrengthTier {
  // Use training experience as primary signal
  if (profile.trainingExperience) {
    const expMap: Record<TrainingExperience, StrengthTier> = {
      'new': 'novice',
      'some': 'developing',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
    }
    return expMap[profile.trainingExperience]
  }
  
  // Fallback to pull-up/dip capacity estimation
  // Handle "unknown" values by defaulting to novice
  if (!profile.pullUpMax || !profile.dipMax) return 'novice'
  if (profile.pullUpMax === 'unknown' || profile.dipMax === 'unknown') return 'novice'
  
  const pullupScore: Record<PullUpCapacity, number> = {
    '0': 0,
    '1_3': 1,
    '4_7': 2,
    '8_12': 3,
    '13_17': 4,
    '18_22': 5,
    '23_plus': 6,
    'unknown': 0, // Treat unknown as 0 for scoring
  }
  
  const dipScore: Record<DipCapacity, number> = {
    '0': 0,
    '1_5': 1,
    '6_10': 2,
    '11_15': 3,
    '16_20': 4,
    '21_25': 5,
    '25_plus': 6,
    'unknown': 0, // Treat unknown as 0 for scoring
  }
  
  const avgScore = ((pullupScore[profile.pullUpMax] ?? 0) + (dipScore[profile.dipMax] ?? 0)) / 2
  
  if (avgScore <= 1) return 'novice'
  if (avgScore <= 2.5) return 'developing'
  if (avgScore <= 4) return 'intermediate'
  if (avgScore <= 5) return 'advanced'
  return 'elite'
}

// =============================================================================
// PROGRAM MAPPING HELPERS
// =============================================================================

export function mapStrengthTierToExperience(tier: StrengthTier): 'beginner' | 'intermediate' | 'advanced' {
  if (tier === 'novice' || tier === 'developing') return 'beginner'
  if (tier === 'intermediate') return 'intermediate'
  return 'advanced'
}

export function mapTrainingExperienceToLevel(exp: TrainingExperience | null): 'beginner' | 'intermediate' | 'advanced' {
  if (!exp || exp === 'new' || exp === 'some') return 'beginner'
  if (exp === 'intermediate') return 'intermediate'
  return 'advanced'
}

// Legacy compatibility function
export function mapOnboardingGoalToProgram(goal: OnboardingGoal | PrimaryGoalType): string {
  const goalMap: Record<string, string> = {
    'skill': 'front_lever',
    'strength': 'weighted_strength',
    'endurance': 'general_strength',
    'abs': 'general_strength',
    'general': 'general_strength',
    // Direct mappings for new goals
    'front_lever': 'front_lever',
    'planche': 'planche',
    'muscle_up': 'muscle_up',
    'handstand_pushup': 'handstand_pushup',
    'weighted_pull': 'weighted_strength',
    'weighted_dip': 'weighted_strength',
    'general_strength': 'general_strength',
  }
  return goalMap[goal] || 'general_strength'
}

// Legacy compatibility functions
export function mapTrainingTimeToMinutes(time: TrainingTimeRange): number {
  const timeMap: Record<TrainingTimeRange, number> = {
    '10_20': 20,
    '20_30': 30,
    '30_45': 45,
    '45_60': 60,
    '60_plus': 75,
  }
  return timeMap[time] || 45
}

export function mapWeeklyTrainingToDays(weekly: WeeklyTrainingDays): number {
  const daysMap: Record<WeeklyTrainingDays, number> = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5_plus': 5,
  }
  return daysMap[weekly] || 3
}

// =============================================================================
// DEFAULT ESTIMATION ENGINE
// =============================================================================

// Default values used when user selects "Don't know" / "Unknown"
// These are conservative beginner-safe estimates based on training experience

export interface EstimatedDefaults {
  pullUpMax: PullUpCapacity
  dipMax: DipCapacity
  pushUpMax: PushUpCapacity
  wallHSPUReps: WallHSPUReps
  frontLever: FrontLeverProgression
  planche: PlancheProgression
  muscleUp: MuscleUpReadiness
  hspu: HSPUProgression
  lSitHold: LSitHoldCapacity
  vSitHold: VSitHoldCapacity
  flexibilityLevel: FlexibilityLevel
}

// Conservative defaults based on training experience
export function getDefaultEstimates(experience: TrainingExperience | null): EstimatedDefaults {
  switch (experience) {
    case 'advanced':
      return {
        pullUpMax: '8_12',
        dipMax: '11_15',
        pushUpMax: '25_40',
        wallHSPUReps: '4_6',
        frontLever: 'adv_tuck',
        planche: 'tuck',
        muscleUp: 'working_on',
        hspu: 'box_pike',
        lSitHold: '10_20',
        vSitHold: 'under_5',
        flexibilityLevel: 'developing',
      }
    case 'intermediate':
      return {
        pullUpMax: '4_7',
        dipMax: '6_10',
        pushUpMax: '25_40',
        wallHSPUReps: '1_3',
        frontLever: 'tuck',
        planche: 'lean',
        muscleUp: 'none',
        hspu: 'pike',
        lSitHold: 'under_10',
        vSitHold: 'none',
        flexibilityLevel: 'beginner',
      }
    case 'some':
      return {
        pullUpMax: '1_3',
        dipMax: '1_5',
        pushUpMax: '10_25',
        wallHSPUReps: '0',
        frontLever: 'none',
        planche: 'none',
        muscleUp: 'none',
        hspu: 'none',
        lSitHold: 'none',
        vSitHold: 'none',
        flexibilityLevel: 'beginner',
      }
    case 'new':
    default:
      return {
        pullUpMax: '0',
        dipMax: '0',
        pushUpMax: '0_10',
        wallHSPUReps: '0',
        frontLever: 'none',
        planche: 'none',
        muscleUp: 'none',
        hspu: 'none',
        lSitHold: 'none',
        vSitHold: 'none',
        flexibilityLevel: 'none',
      }
  }
}

// Check if a metric is "unknown" and needs estimation
export function isMetricUnknown(value: string | null | undefined): boolean {
  return value === 'unknown' || value === null || value === undefined
}

// Get estimated value for a specific metric
export function getEstimatedMetric<K extends keyof EstimatedDefaults>(
  profile: OnboardingProfile,
  metricKey: K
): EstimatedDefaults[K] {
  const defaults = getDefaultEstimates(profile.trainingExperience)
  return defaults[metricKey]
}

// Check if profile has any estimated/unknown values
export function hasEstimatedValues(profile: OnboardingProfile): boolean {
  return (
    profile.pullUpMax === 'unknown' ||
    profile.dipMax === 'unknown' ||
    profile.pushUpMax === 'unknown' ||
    profile.wallHSPUReps === 'unknown' ||
    profile.frontLever?.progression === 'unknown' ||
    profile.planche?.progression === 'unknown' ||
    profile.muscleUp === 'unknown' ||
    profile.hspu?.progression === 'unknown' ||
    profile.lSitHold === 'unknown' ||
    profile.vSitHold === 'unknown' ||
    profile.pancake?.level === 'unknown' ||
    profile.toeTouch?.level === 'unknown' ||
    profile.frontSplits?.level === 'unknown' ||
    profile.sideSplits?.level === 'unknown'
  )
}

// Get actual or estimated value for program building
export function getEffectiveStrengthValue(
  profile: OnboardingProfile,
  metric: 'pullUpMax' | 'dipMax' | 'pushUpMax' | 'wallHSPUReps'
): { value: string; isEstimated: boolean } {
  const profileValue = profile[metric]
  if (isMetricUnknown(profileValue)) {
    const defaults = getDefaultEstimates(profile.trainingExperience)
    return { value: defaults[metric], isEstimated: true }
  }
  return { value: profileValue!, isEstimated: false }
}

// =============================================================================
// PROGRAM INPUT SUGGESTION
// =============================================================================

export function suggestProgramInputsFromOnboarding(profile: OnboardingProfile) {
  const strengthTier = estimateStrengthTier(profile)
  
  return {
    experienceLevel: profile.trainingExperience 
      ? mapTrainingExperienceToLevel(profile.trainingExperience)
      : mapStrengthTierToExperience(strengthTier),
  // Handle 'flexible' as default to 45 minutes for calculations
  sessionLength: typeof profile.sessionLengthMinutes === 'number' ? profile.sessionLengthMinutes : 45,
  // Handle 'flexible' as default to 4 days for calculations
  trainingDaysPerWeek: typeof profile.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : 4,
    primaryGoal: profile.primaryGoal || 'general_strength',
    estimatedStrengthTier: strengthTier,
    hasEstimatedValues: hasEstimatedValues(profile),
  }
}
