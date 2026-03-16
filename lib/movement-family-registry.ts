/**
 * SpartanLab Movement Family Registry
 * 
 * Central registry for exercise classification that enables intelligent:
 * - Exercise purpose understanding
 * - Skill carryover mapping
 * - Equipment-aware substitutions
 * - Training intent preservation
 * - Workout time optimization
 * 
 * This is the source of truth for how exercises relate to training goals.
 */

// =============================================================================
// MOVEMENT FAMILY DEFINITIONS
// =============================================================================

/**
 * Core movement families for calisthenics training
 * Each family represents a distinct movement pattern with specific training adaptations
 */
export type MovementFamily =
  // Pull patterns
  | 'vertical_pull'           // Pull-ups, chin-ups
  | 'horizontal_pull'         // Rows, front lever pulls
  | 'straight_arm_pull'       // Front lever holds, ice cream makers
  // Push patterns
  | 'vertical_push'           // HSPU, pike push-ups
  | 'horizontal_push'         // Push-ups, planche work
  | 'straight_arm_push'       // Planche holds, maltese prep
  | 'dip_pattern'             // Dips, straight bar dips
  // Lower body
  | 'squat_pattern'           // Squats, pistols
  | 'hinge_pattern'           // RDLs, hip thrusts
  | 'unilateral_leg'          // Lunges, step-ups
  // Core patterns
  | 'compression_core'        // L-sit, V-sit, leg raises
  | 'anti_extension_core'     // Planks, ab wheel, hollow body
  | 'anti_rotation_core'      // Pallof press, side planks
  | 'rotational_core'         // Wood chops, russian twists
  // Special patterns
  | 'scapular_control'        // Scap pulls, scap push-ups
  | 'explosive_pull'          // Muscle-up transitions, explosive pulls
  | 'explosive_push'          // Clap push-ups, explosive dips
  | 'joint_integrity'         // Shoulder prehab, wrist prep
  | 'mobility'                // Stretches, mobility drills
  | 'transition'              // Muscle-up, skin the cat
  // Rings-specific patterns
  | 'rings_stability'         // Ring support, RTO holds, ring control
  | 'rings_strength'          // Iron cross prep, ring dips, maltese
  // Accessory/Isolation
  | 'shoulder_isolation'      // Lateral raises, face pulls
  | 'arm_isolation'           // Curls, tricep work
  | 'grip_strength'           // Hangs, grip work
  // Hypertrophy/General
  | 'hypertrophy_accessory'   // General hypertrophy work

// =============================================================================
// TRAINING INTENT DEFINITIONS
// =============================================================================

/**
 * Training intent tags describe the PURPOSE of an exercise
 * A single exercise can have multiple intents
 */
export type TrainingIntent =
  | 'skill'           // High neural demand, technique-focused
  | 'strength'        // Max strength development (1-5 reps typical)
  | 'hypertrophy'     // Muscle building (6-12 reps typical)
  | 'endurance'       // Muscular endurance (15+ reps)
  | 'power'           // Explosive strength
  | 'mobility'        // Range of motion improvement
  | 'durability'      // Joint health, prehab
  | 'activation'      // Warm-up, muscle activation
  | 'accessory'       // Support work, isolation

// =============================================================================
// SKILL CARRYOVER DEFINITIONS
// =============================================================================

/**
 * Skills that exercises can transfer to
 */
export type SkillCarryover =
  | 'front_lever'
  | 'back_lever'
  | 'planche'
  | 'hspu'
  | 'muscle_up'
  | 'l_sit'
  | 'v_sit'
  | 'handstand'
  | 'iron_cross'
  | 'human_flag'
  | 'one_arm_pull_up'
  | 'one_arm_push_up'

// =============================================================================
// EQUIPMENT DEFINITIONS
// =============================================================================

/**
 * Equipment types for exercise filtering
 */
export type EquipmentTag =
  | 'pullup_bar'
  | 'rings'
  | 'parallettes'
  | 'dip_bars'
  | 'straight_bar'
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'squat_rack'
  | 'cables'
  | 'lat_pulldown'
  | 'resistance_bands'
  | 'wall'
  | 'floor'
  | 'stall_bars'
  | 'weight_vest'

// =============================================================================
// DIFFICULTY DEFINITIONS
// =============================================================================

/**
 * Difficulty/progression bands
 */
export type DifficultyBand = 'beginner' | 'intermediate' | 'advanced' | 'elite'

// =============================================================================
// EXERCISE CLASSIFICATION INTERFACE
// =============================================================================

/**
 * Complete exercise classification with all metadata
 */
export interface ExerciseClassification {
  id: string
  name: string
  
  // Primary classification
  primaryFamily: MovementFamily
  secondaryFamilies?: MovementFamily[]
  
  // Training intent (can have multiple)
  intents: TrainingIntent[]
  primaryIntent: TrainingIntent
  
  // Skill transfer
  skillCarryover?: SkillCarryover[]
  
  // Equipment requirements
  requiredEquipment: EquipmentTag[]
  optionalEquipment?: EquipmentTag[]
  
  // Difficulty
  difficulty: DifficultyBand
  progressionStage?: number  // 1-10 within difficulty band
  
  // Training characteristics
  fatigueCost: 1 | 2 | 3 | 4 | 5
  neuralDemand: 1 | 2 | 3 | 4 | 5
  jointStress: 1 | 2 | 3 | 4 | 5
  
  // Session placement priority
  placementTier: 1 | 2 | 3  // 1 = skill/main, 2 = support, 3 = accessory
  
  // Substitution guidance
  substitutionPool?: string[]  // Exercise IDs that can replace this
  cannotSubstituteFor?: string[]  // Exercises this cannot replace
}

// =============================================================================
// MOVEMENT FAMILY METADATA
// =============================================================================

export interface MovementFamilyMetadata {
  id: MovementFamily
  name: string
  description: string
  primaryMuscles: string[]
  relatedFamilies: MovementFamily[]
  typicalIntents: TrainingIntent[]
  skillTransfers: SkillCarryover[]
}

export const MOVEMENT_FAMILY_METADATA: Record<MovementFamily, MovementFamilyMetadata> = {
  // Pull patterns
  vertical_pull: {
    id: 'vertical_pull',
    name: 'Vertical Pull',
    description: 'Pulling movements in the vertical plane',
    primaryMuscles: ['lats', 'biceps', 'rear_deltoid', 'rhomboids'],
    relatedFamilies: ['horizontal_pull', 'straight_arm_pull', 'scapular_control'],
    typicalIntents: ['strength', 'hypertrophy', 'skill'],
    skillTransfers: ['front_lever', 'muscle_up', 'one_arm_pull_up'],
  },
  horizontal_pull: {
    id: 'horizontal_pull',
    name: 'Horizontal Pull',
    description: 'Rowing movements and horizontal pulling',
    primaryMuscles: ['lats', 'rhomboids', 'biceps', 'rear_deltoid'],
    relatedFamilies: ['vertical_pull', 'straight_arm_pull', 'scapular_control'],
    typicalIntents: ['strength', 'hypertrophy'],
    skillTransfers: ['front_lever', 'back_lever'],
  },
  straight_arm_pull: {
    id: 'straight_arm_pull',
    name: 'Straight Arm Pull',
    description: 'Pulling with straight arms - levers, pullovers',
    primaryMuscles: ['lats', 'teres_major', 'core'],
    relatedFamilies: ['horizontal_pull', 'compression_core'],
    typicalIntents: ['skill', 'strength'],
    skillTransfers: ['front_lever', 'back_lever', 'iron_cross'],
  },
  // Push patterns
  vertical_push: {
    id: 'vertical_push',
    name: 'Vertical Push',
    description: 'Overhead pushing movements',
    primaryMuscles: ['anterior_deltoid', 'triceps', 'upper_chest'],
    relatedFamilies: ['horizontal_push', 'dip_pattern'],
    typicalIntents: ['strength', 'skill'],
    skillTransfers: ['hspu', 'handstand'],
  },
  horizontal_push: {
    id: 'horizontal_push',
    name: 'Horizontal Push',
    description: 'Push-up pattern and horizontal pressing',
    primaryMuscles: ['chest', 'anterior_deltoid', 'triceps'],
    relatedFamilies: ['vertical_push', 'straight_arm_push', 'dip_pattern'],
    typicalIntents: ['strength', 'hypertrophy', 'skill'],
    skillTransfers: ['planche', 'one_arm_push_up'],
  },
  straight_arm_push: {
    id: 'straight_arm_push',
    name: 'Straight Arm Push',
    description: 'Pushing with locked arms - planche, maltese',
    primaryMuscles: ['anterior_deltoid', 'chest', 'biceps_tendon'],
    relatedFamilies: ['horizontal_push', 'compression_core'],
    typicalIntents: ['skill', 'strength'],
    skillTransfers: ['planche', 'iron_cross'],
  },
  dip_pattern: {
    id: 'dip_pattern',
    name: 'Dip Pattern',
    description: 'Dipping movements - bar dips, ring dips',
    primaryMuscles: ['chest', 'triceps', 'anterior_deltoid'],
    relatedFamilies: ['vertical_push', 'horizontal_push', 'transition'],
    typicalIntents: ['strength', 'hypertrophy', 'skill'],
    skillTransfers: ['muscle_up', 'planche'],
  },
  // Lower body
  squat_pattern: {
    id: 'squat_pattern',
    name: 'Squat Pattern',
    description: 'Squatting movements',
    primaryMuscles: ['quadriceps', 'glutes', 'core'],
    relatedFamilies: ['unilateral_leg', 'hinge_pattern'],
    typicalIntents: ['strength', 'hypertrophy', 'endurance'],
    skillTransfers: [],
  },
  hinge_pattern: {
    id: 'hinge_pattern',
    name: 'Hip Hinge',
    description: 'Hip-dominant movements - RDLs, good mornings',
    primaryMuscles: ['hamstrings', 'glutes', 'lower_back'],
    relatedFamilies: ['squat_pattern', 'unilateral_leg'],
    typicalIntents: ['strength', 'hypertrophy'],
    skillTransfers: [],
  },
  unilateral_leg: {
    id: 'unilateral_leg',
    name: 'Unilateral Leg',
    description: 'Single leg work - pistols, lunges',
    primaryMuscles: ['quadriceps', 'glutes', 'stabilizers'],
    relatedFamilies: ['squat_pattern', 'hinge_pattern'],
    typicalIntents: ['strength', 'skill'],
    skillTransfers: [],
  },
  // Core patterns
  compression_core: {
    id: 'compression_core',
    name: 'Compression Core',
    description: 'Hip flexion and pike compression',
    primaryMuscles: ['hip_flexors', 'rectus_abdominis', 'obliques'],
    relatedFamilies: ['anti_extension_core', 'straight_arm_pull', 'straight_arm_push'],
    typicalIntents: ['skill', 'strength'],
    skillTransfers: ['l_sit', 'v_sit', 'front_lever', 'planche'],
  },
  anti_extension_core: {
    id: 'anti_extension_core',
    name: 'Anti-Extension Core',
    description: 'Resisting spinal extension - planks, hollow body',
    primaryMuscles: ['rectus_abdominis', 'transverse_abdominis'],
    relatedFamilies: ['compression_core', 'anti_rotation_core'],
    typicalIntents: ['strength', 'durability'],
    skillTransfers: ['front_lever', 'planche', 'handstand'],
  },
  anti_rotation_core: {
    id: 'anti_rotation_core',
    name: 'Anti-Rotation Core',
    description: 'Resisting rotational forces',
    primaryMuscles: ['obliques', 'transverse_abdominis'],
    relatedFamilies: ['anti_extension_core', 'rotational_core'],
    typicalIntents: ['strength', 'durability'],
    skillTransfers: ['human_flag'],
  },
  rotational_core: {
    id: 'rotational_core',
    name: 'Rotational Core',
    description: 'Rotational movements',
    primaryMuscles: ['obliques', 'hip_flexors'],
    relatedFamilies: ['anti_rotation_core'],
    typicalIntents: ['strength', 'power'],
    skillTransfers: [],
  },
  // Special patterns
  scapular_control: {
    id: 'scapular_control',
    name: 'Scapular Control',
    description: 'Scapular stability and mobility',
    primaryMuscles: ['serratus_anterior', 'rhomboids', 'lower_trapezius'],
    relatedFamilies: ['vertical_pull', 'horizontal_pull', 'joint_integrity'],
    typicalIntents: ['durability', 'activation', 'skill'],
    skillTransfers: ['front_lever', 'back_lever', 'planche', 'handstand'],
  },
  explosive_pull: {
    id: 'explosive_pull',
    name: 'Explosive Pull',
    description: 'Explosive pulling movements',
    primaryMuscles: ['lats', 'biceps', 'core'],
    relatedFamilies: ['vertical_pull', 'transition'],
    typicalIntents: ['power', 'skill'],
    skillTransfers: ['muscle_up'],
  },
  explosive_push: {
    id: 'explosive_push',
    name: 'Explosive Push',
    description: 'Explosive pushing movements',
    primaryMuscles: ['chest', 'triceps', 'anterior_deltoid'],
    relatedFamilies: ['horizontal_push', 'vertical_push'],
    typicalIntents: ['power'],
    skillTransfers: [],
  },
  joint_integrity: {
    id: 'joint_integrity',
    name: 'Joint Integrity',
    description: 'Prehab and joint preparation',
    primaryMuscles: ['rotator_cuff', 'wrist_flexors', 'stabilizers'],
    relatedFamilies: ['scapular_control', 'mobility'],
    typicalIntents: ['durability', 'activation'],
    skillTransfers: [],
  },
  mobility: {
    id: 'mobility',
    name: 'Mobility',
    description: 'Range of motion and flexibility',
    primaryMuscles: ['various'],
    relatedFamilies: ['joint_integrity'],
    typicalIntents: ['mobility'],
    skillTransfers: [],
  },
  transition: {
    id: 'transition',
    name: 'Transition',
    description: 'Movement transitions - muscle-up, skin the cat',
    primaryMuscles: ['lats', 'chest', 'core'],
    relatedFamilies: ['dip_pattern', 'explosive_pull'],
    typicalIntents: ['skill', 'strength'],
    skillTransfers: ['muscle_up', 'back_lever'],
  },
  // Isolation
  shoulder_isolation: {
    id: 'shoulder_isolation',
    name: 'Shoulder Isolation',
    description: 'Isolated shoulder work - raises, face pulls',
    primaryMuscles: ['deltoids', 'rotator_cuff'],
    relatedFamilies: ['joint_integrity'],
    typicalIntents: ['hypertrophy', 'durability'],
    skillTransfers: [],
  },
  arm_isolation: {
    id: 'arm_isolation',
    name: 'Arm Isolation',
    description: 'Isolated arm work - curls, extensions',
    primaryMuscles: ['biceps', 'triceps', 'forearms'],
    relatedFamilies: [],
    typicalIntents: ['hypertrophy', 'accessory'],
    skillTransfers: [],
  },
  grip_strength: {
    id: 'grip_strength',
    name: 'Grip Strength',
    description: 'Grip and forearm work',
    primaryMuscles: ['forearms', 'finger_flexors'],
    relatedFamilies: ['vertical_pull'],
    typicalIntents: ['strength', 'durability'],
    skillTransfers: ['one_arm_pull_up', 'front_lever'],
  },
}

// =============================================================================
// SKILL CARRYOVER METADATA
// =============================================================================

export interface SkillCarryoverMetadata {
  id: SkillCarryover
  name: string
  primaryFamilies: MovementFamily[]
  supportFamilies: MovementFamily[]
  keyIntents: TrainingIntent[]
}

export const SKILL_CARRYOVER_METADATA: Record<SkillCarryover, SkillCarryoverMetadata> = {
  front_lever: {
    id: 'front_lever',
    name: 'Front Lever',
    primaryFamilies: ['straight_arm_pull', 'horizontal_pull'],
    supportFamilies: ['compression_core', 'scapular_control', 'vertical_pull'],
    keyIntents: ['skill', 'strength'],
  },
  back_lever: {
    id: 'back_lever',
    name: 'Back Lever',
    primaryFamilies: ['straight_arm_pull', 'horizontal_pull'],
    supportFamilies: ['scapular_control', 'mobility'],
    keyIntents: ['skill', 'strength'],
  },
  planche: {
    id: 'planche',
    name: 'Planche',
    primaryFamilies: ['straight_arm_push', 'horizontal_push'],
    supportFamilies: ['compression_core', 'scapular_control', 'joint_integrity'],
    keyIntents: ['skill', 'strength'],
  },
  hspu: {
    id: 'hspu',
    name: 'Handstand Push-Up',
    primaryFamilies: ['vertical_push'],
    supportFamilies: ['scapular_control', 'anti_extension_core'],
    keyIntents: ['skill', 'strength'],
  },
  muscle_up: {
    id: 'muscle_up',
    name: 'Muscle-Up',
    primaryFamilies: ['transition', 'explosive_pull'],
    supportFamilies: ['vertical_pull', 'dip_pattern', 'scapular_control'],
    keyIntents: ['skill', 'power', 'strength'],
  },
  l_sit: {
    id: 'l_sit',
    name: 'L-Sit',
    primaryFamilies: ['compression_core'],
    supportFamilies: ['straight_arm_push', 'scapular_control'],
    keyIntents: ['skill', 'strength'],
  },
  v_sit: {
    id: 'v_sit',
    name: 'V-Sit',
    primaryFamilies: ['compression_core'],
    supportFamilies: ['mobility', 'straight_arm_push'],
    keyIntents: ['skill', 'strength'],
  },
  handstand: {
    id: 'handstand',
    name: 'Handstand',
    primaryFamilies: ['vertical_push', 'anti_extension_core'],
    supportFamilies: ['scapular_control', 'joint_integrity'],
    keyIntents: ['skill'],
  },
  iron_cross: {
    id: 'iron_cross',
    name: 'Iron Cross',
    primaryFamilies: ['straight_arm_pull', 'straight_arm_push'],
    supportFamilies: ['joint_integrity', 'scapular_control'],
    keyIntents: ['skill', 'strength'],
  },
  human_flag: {
    id: 'human_flag',
    name: 'Human Flag',
    primaryFamilies: ['anti_rotation_core', 'vertical_pull'],
    supportFamilies: ['horizontal_push', 'grip_strength'],
    keyIntents: ['skill', 'strength'],
  },
  one_arm_pull_up: {
    id: 'one_arm_pull_up',
    name: 'One Arm Pull-Up',
    primaryFamilies: ['vertical_pull'],
    supportFamilies: ['grip_strength', 'scapular_control'],
    keyIntents: ['strength', 'skill'],
  },
  one_arm_push_up: {
    id: 'one_arm_push_up',
    name: 'One Arm Push-Up',
    primaryFamilies: ['horizontal_push'],
    supportFamilies: ['anti_rotation_core'],
    keyIntents: ['strength', 'skill'],
  },
}

// =============================================================================
// INTENT METADATA
// =============================================================================

export interface TrainingIntentMetadata {
  id: TrainingIntent
  name: string
  description: string
  typicalRepRange: string
  sessionPriority: number  // 1 = highest priority in session ordering
  canCompress: boolean     // Can be trimmed in time-constrained sessions
}

export const TRAINING_INTENT_METADATA: Record<TrainingIntent, TrainingIntentMetadata> = {
  skill: {
    id: 'skill',
    name: 'Skill Work',
    description: 'High neural demand movements requiring technique focus',
    typicalRepRange: '3-6 reps or 5-15s holds',
    sessionPriority: 1,
    canCompress: false,
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    description: 'Maximum force development',
    typicalRepRange: '1-5 reps',
    sessionPriority: 2,
    canCompress: false,
  },
  power: {
    id: 'power',
    name: 'Power',
    description: 'Explosive force production',
    typicalRepRange: '3-6 reps',
    sessionPriority: 2,
    canCompress: false,
  },
  hypertrophy: {
    id: 'hypertrophy',
    name: 'Hypertrophy',
    description: 'Muscle building work',
    typicalRepRange: '6-12 reps',
    sessionPriority: 3,
    canCompress: true,
  },
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    description: 'Muscular endurance development',
    typicalRepRange: '15+ reps',
    sessionPriority: 4,
    canCompress: true,
  },
  durability: {
    id: 'durability',
    name: 'Durability',
    description: 'Joint health and prehab',
    typicalRepRange: '10-20 reps',
    sessionPriority: 5,
    canCompress: true,
  },
  mobility: {
    id: 'mobility',
    name: 'Mobility',
    description: 'Range of motion improvement',
    typicalRepRange: '30-60s holds',
    sessionPriority: 6,
    canCompress: true,
  },
  activation: {
    id: 'activation',
    name: 'Activation',
    description: 'Warm-up and muscle activation',
    typicalRepRange: '8-15 reps',
    sessionPriority: 0,  // Beginning of session
    canCompress: true,
  },
  accessory: {
    id: 'accessory',
    name: 'Accessory',
    description: 'Support and isolation work',
    typicalRepRange: '8-15 reps',
    sessionPriority: 5,
    canCompress: true,
  },
}

// =============================================================================
// EQUIPMENT COMPATIBILITY
// =============================================================================

export interface EquipmentProfile {
  id: EquipmentTag
  name: string
  commonWith: EquipmentTag[]
  allowsProgressions: boolean
}

export const EQUIPMENT_PROFILES: Record<EquipmentTag, EquipmentProfile> = {
  pullup_bar: {
    id: 'pullup_bar',
    name: 'Pull-Up Bar',
    commonWith: ['straight_bar'],
    allowsProgressions: true,
  },
  rings: {
    id: 'rings',
    name: 'Gymnastic Rings',
    commonWith: ['pullup_bar'],
    allowsProgressions: true,
  },
  parallettes: {
    id: 'parallettes',
    name: 'Parallettes',
    commonWith: ['dip_bars', 'floor'],
    allowsProgressions: true,
  },
  dip_bars: {
    id: 'dip_bars',
    name: 'Dip Bars',
    commonWith: ['parallettes'],
    allowsProgressions: true,
  },
  straight_bar: {
    id: 'straight_bar',
    name: 'Straight Bar',
    commonWith: ['pullup_bar', 'dip_bars'],
    allowsProgressions: true,
  },
  dumbbells: {
    id: 'dumbbells',
    name: 'Dumbbells',
    commonWith: ['barbell'],
    allowsProgressions: true,
  },
  barbell: {
    id: 'barbell',
    name: 'Barbell',
    commonWith: ['dumbbells', 'squat_rack'],
    allowsProgressions: true,
  },
  bench: {
    id: 'bench',
    name: 'Weight Bench',
    commonWith: ['dumbbells', 'barbell'],
    allowsProgressions: false,
  },
  squat_rack: {
    id: 'squat_rack',
    name: 'Squat Rack',
    commonWith: ['barbell'],
    allowsProgressions: false,
  },
  cables: {
    id: 'cables',
    name: 'Cable Machine',
    commonWith: ['lat_pulldown', 'dumbbells'],
    allowsProgressions: true,
  },
  lat_pulldown: {
    id: 'lat_pulldown',
    name: 'Lat Pulldown Machine',
    commonWith: ['cables', 'pullup_bar'],
    allowsProgressions: true,
  },
  resistance_bands: {
    id: 'resistance_bands',
    name: 'Resistance Bands',
    commonWith: [],
    allowsProgressions: true,
  },
  wall: {
    id: 'wall',
    name: 'Wall',
    commonWith: ['floor'],
    allowsProgressions: false,
  },
  floor: {
    id: 'floor',
    name: 'Floor',
    commonWith: ['wall'],
    allowsProgressions: false,
  },
  stall_bars: {
    id: 'stall_bars',
    name: 'Stall Bars',
    commonWith: ['pullup_bar', 'wall'],
    allowsProgressions: true,
  },
  weight_vest: {
    id: 'weight_vest',
    name: 'Weight Vest',
    commonWith: [],
    allowsProgressions: true,
  },
}
