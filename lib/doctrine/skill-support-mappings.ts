/**
 * SpartanLab Skill Support Mappings
 * 
 * Canonical prerequisite and support mappings for major skill families.
 * Used by the engine to:
 * - Determine if prerequisites are met
 * - Select appropriate support work
 * - Identify common limiting factors
 * - Provide safe alternatives when prerequisites are missing
 * 
 * This complements the existing skill prerequisite data with engine-actionable mappings.
 */

import type { MovementFamily, SkillCarryover } from '../movement-family-registry'

// =============================================================================
// TYPES
// =============================================================================

export interface SkillSupportMapping {
  skillId: SkillCarryover
  displayName: string
  
  // Required movement families for this skill
  primaryRequirements: MovementFamily[]
  
  // Supporting movement families that help development
  supportPatterns: MovementFamily[]
  
  // Common limiting factors
  commonLimiters: LimiterMapping[]
  
  // Safe alternatives when prerequisites missing
  safeAlternatives: string[]
  
  // Exercise IDs that directly support this skill
  directSupportExercises: string[]
  
  // Exercise IDs that are accessory support
  accessorySupportExercises: string[]
  
  // Prerequisite exercises that must be achieved first
  prerequisiteExercises: PrerequisiteExercise[]
  
  // Integration constraints
  constraints: {
    maxStraightArmPerSession: number
    restDaysBetweenHeavySessions: number
    preferredFrequencyPerWeek: number
    tendonSensitive: boolean
  }
}

export interface LimiterMapping {
  limiterId: string
  description: string
  supportPatterns: MovementFamily[]
  exerciseIds: string[]
}

export interface PrerequisiteExercise {
  exerciseId: string
  requirement: string // e.g., "15s hold" or "8 reps"
  isCritical: boolean
}

// =============================================================================
// SKILL SUPPORT MAPPINGS REGISTRY
// =============================================================================

export const SKILL_SUPPORT_MAPPINGS: Record<SkillCarryover, SkillSupportMapping> = {
  
  front_lever: {
    skillId: 'front_lever',
    displayName: 'Front Lever',
    primaryRequirements: ['straight_arm_pull', 'anti_extension_core', 'scapular_control'],
    supportPatterns: ['vertical_pull', 'horizontal_pull', 'compression_core'],
    commonLimiters: [
      {
        limiterId: 'front_lever_straight_arm_strength',
        description: 'Straight-arm pulling strength',
        supportPatterns: ['straight_arm_pull'],
        exerciseIds: ['fl_raises', 'tuck_fl', 'adv_tuck_fl', 'ice_cream_makers'],
      },
      {
        limiterId: 'front_lever_core',
        description: 'Anti-extension core strength',
        supportPatterns: ['anti_extension_core'],
        exerciseIds: ['hollow_body_hold', 'dragon_flag_tuck', 'body_lever'],
      },
      {
        limiterId: 'front_lever_pulling_base',
        description: 'General pulling strength foundation',
        supportPatterns: ['vertical_pull', 'horizontal_pull'],
        exerciseIds: ['weighted_pull_up', 'bodyweight_row', 'archer_pull_up'],
      },
    ],
    safeAlternatives: ['tuck_fl', 'adv_tuck_fl', 'fl_raises', 'bodyweight_row'],
    directSupportExercises: ['tuck_fl', 'adv_tuck_fl', 'one_leg_fl', 'straddle_fl', 'fl_raises', 'front_lever_pull'],
    accessorySupportExercises: ['hollow_body_hold', 'scapular_pulls', 'face_pull', 'bicep_curl'],
    prerequisiteExercises: [
      { exerciseId: 'pull_up', requirement: '10 reps', isCritical: true },
      { exerciseId: 'tuck_fl', requirement: '15s hold', isCritical: true },
      { exerciseId: 'hollow_body_hold', requirement: '30s hold', isCritical: false },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 2,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: true,
    },
  },
  
  back_lever: {
    skillId: 'back_lever',
    displayName: 'Back Lever',
    primaryRequirements: ['straight_arm_pull', 'scapular_control'],
    supportPatterns: ['horizontal_pull', 'anti_extension_core', 'mobility'],
    commonLimiters: [
      {
        limiterId: 'back_lever_shoulder_extension',
        description: 'Shoulder extension mobility',
        supportPatterns: ['mobility'],
        exerciseIds: ['german_hang', 'skin_the_cat', 'shoulder_dislocates'],
      },
      {
        limiterId: 'back_lever_straight_arm_strength',
        description: 'Straight-arm pressing/pulling in extension',
        supportPatterns: ['straight_arm_pull'],
        exerciseIds: ['tuck_back_lever', 'adv_tuck_back_lever', 'skin_the_cat'],
      },
    ],
    safeAlternatives: ['german_hang', 'skin_the_cat', 'tuck_back_lever'],
    directSupportExercises: ['tuck_back_lever', 'adv_tuck_back_lever', 'german_hang', 'skin_the_cat'],
    accessorySupportExercises: ['shoulder_dislocates', 'face_pull', 'rear_delt_fly'],
    prerequisiteExercises: [
      { exerciseId: 'german_hang', requirement: '20s hold', isCritical: true },
      { exerciseId: 'skin_the_cat', requirement: '5 reps', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 2,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: true,
    },
  },
  
  planche: {
    skillId: 'planche',
    displayName: 'Planche',
    primaryRequirements: ['straight_arm_push', 'scapular_control', 'anti_extension_core'],
    supportPatterns: ['horizontal_push', 'compression_core', 'joint_integrity'],
    commonLimiters: [
      {
        limiterId: 'planche_straight_arm_strength',
        description: 'Straight-arm pushing strength',
        supportPatterns: ['straight_arm_push'],
        exerciseIds: ['planche_lean', 'tuck_planche', 'adv_tuck_planche', 'pseudo_planche_pushup'],
      },
      {
        limiterId: 'planche_protraction',
        description: 'Scapular protraction strength',
        supportPatterns: ['scapular_control', 'horizontal_push'],
        exerciseIds: ['planche_lean', 'scapular_protraction', 'serratus_pushup'],
      },
      {
        limiterId: 'planche_wrist_tolerance',
        description: 'Wrist conditioning for weight bearing',
        supportPatterns: ['joint_integrity'],
        exerciseIds: ['wrist_circles', 'wrist_pushups', 'planche_lean'],
      },
    ],
    safeAlternatives: ['planche_lean', 'pseudo_planche_pushup', 'tuck_planche'],
    directSupportExercises: ['planche_lean', 'tuck_planche', 'adv_tuck_planche', 'straddle_planche', 'pseudo_planche_pushup', 'planche_pushup'],
    accessorySupportExercises: ['serratus_pushup', 'scapular_protraction', 'face_pull', 'tricep_extension'],
    prerequisiteExercises: [
      { exerciseId: 'push_up', requirement: '25 reps', isCritical: true },
      { exerciseId: 'planche_lean', requirement: '30s hold', isCritical: true },
      { exerciseId: 'tuck_planche', requirement: '10s hold', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 2,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: true,
    },
  },
  
  hspu: {
    skillId: 'hspu',
    displayName: 'Handstand Push-Up',
    primaryRequirements: ['vertical_push', 'scapular_control'],
    supportPatterns: ['horizontal_push', 'joint_integrity', 'anti_extension_core'],
    commonLimiters: [
      {
        limiterId: 'hspu_pressing_strength',
        description: 'Vertical pressing strength',
        supportPatterns: ['vertical_push'],
        exerciseIds: ['pike_push_up', 'elevated_pike_push_up', 'wall_hspu', 'z_press'],
      },
      {
        limiterId: 'hspu_stability',
        description: 'Overhead shoulder stability',
        supportPatterns: ['scapular_control', 'joint_integrity'],
        exerciseIds: ['handstand_hold', 'wall_slides', 'face_pull'],
      },
    ],
    safeAlternatives: ['pike_push_up', 'elevated_pike_push_up', 'wall_hspu'],
    directSupportExercises: ['pike_push_up', 'elevated_pike_push_up', 'wall_hspu', 'deficit_hspu', 'freestanding_hspu'],
    accessorySupportExercises: ['handstand_hold', 'face_pull', 'lateral_raise', 'tricep_extension'],
    prerequisiteExercises: [
      { exerciseId: 'dip', requirement: '15 reps', isCritical: true },
      { exerciseId: 'pike_push_up', requirement: '12 reps', isCritical: true },
      { exerciseId: 'wall_hspu', requirement: '5 reps', isCritical: false },
    ],
    constraints: {
      maxStraightArmPerSession: 3, // Less tendon-sensitive than levers
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: false,
    },
  },
  
  muscle_up: {
    skillId: 'muscle_up',
    displayName: 'Muscle-Up',
    primaryRequirements: ['vertical_pull', 'dip_pattern'],
    supportPatterns: ['horizontal_pull', 'horizontal_push', 'scapular_control'],
    commonLimiters: [
      {
        limiterId: 'muscle_up_pull',
        description: 'Explosive pulling height',
        supportPatterns: ['vertical_pull'],
        exerciseIds: ['explosive_pull_up', 'chest_to_bar_pull_up', 'weighted_pull_up'],
      },
      {
        limiterId: 'muscle_up_transition',
        description: 'Transition strength from pull to dip',
        supportPatterns: ['dip_pattern'],
        exerciseIds: ['straight_bar_dip', 'muscle_up_negative', 'dip'],
      },
    ],
    safeAlternatives: ['explosive_pull_up', 'chest_to_bar_pull_up', 'banded_muscle_up'],
    directSupportExercises: ['explosive_pull_up', 'chest_to_bar_pull_up', 'muscle_up_negative', 'banded_muscle_up', 'muscle_up'],
    accessorySupportExercises: ['straight_bar_dip', 'weighted_pull_up', 'weighted_dip'],
    prerequisiteExercises: [
      { exerciseId: 'pull_up', requirement: '12 reps', isCritical: true },
      { exerciseId: 'dip', requirement: '15 reps', isCritical: true },
      { exerciseId: 'chest_to_bar_pull_up', requirement: '5 reps', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 3,
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: false,
    },
  },
  
  l_sit: {
    skillId: 'l_sit',
    displayName: 'L-Sit',
    primaryRequirements: ['compression_core', 'dip_pattern'],
    supportPatterns: ['scapular_control', 'mobility'],
    commonLimiters: [
      {
        limiterId: 'l_sit_compression',
        description: 'Hip flexor compression strength',
        supportPatterns: ['compression_core'],
        exerciseIds: ['leg_raises', 'compression_pulses', 'v_up'],
      },
      {
        limiterId: 'l_sit_support',
        description: 'Shoulder depression endurance',
        supportPatterns: ['dip_pattern', 'scapular_control'],
        exerciseIds: ['support_hold', 'scapular_shrugs'],
      },
    ],
    safeAlternatives: ['tuck_l_sit', 'one_leg_l_sit', 'leg_raises'],
    directSupportExercises: ['l_sit_floor', 'l_sit_parallettes', 'l_sit_rings', 'tuck_l_sit'],
    accessorySupportExercises: ['leg_raises', 'compression_pulses', 'pike_stretch', 'support_hold'],
    prerequisiteExercises: [
      { exerciseId: 'support_hold', requirement: '30s hold', isCritical: true },
      { exerciseId: 'tuck_l_sit', requirement: '15s hold', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 3,
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 4,
      tendonSensitive: false,
    },
  },
  
  v_sit: {
    skillId: 'v_sit',
    displayName: 'V-Sit',
    primaryRequirements: ['compression_core'],
    supportPatterns: ['scapular_control', 'mobility', 'dip_pattern'],
    commonLimiters: [
      {
        limiterId: 'v_sit_compression',
        description: 'Active pike compression',
        supportPatterns: ['compression_core'],
        exerciseIds: ['l_sit_floor', 'pike_compression', 'v_up', 'leg_raises'],
      },
      {
        limiterId: 'v_sit_flexibility',
        description: 'Hamstring flexibility',
        supportPatterns: ['mobility'],
        exerciseIds: ['pike_stretch', 'pancake_stretch'],
      },
    ],
    safeAlternatives: ['l_sit_floor', 'pike_compression', 'v_up'],
    directSupportExercises: ['v_sit', 'l_sit_floor', 'pike_compression'],
    accessorySupportExercises: ['leg_raises', 'pike_stretch', 'pancake_stretch', 'compression_pulses'],
    prerequisiteExercises: [
      { exerciseId: 'l_sit_floor', requirement: '20s hold', isCritical: true },
      { exerciseId: 'pike_stretch', requirement: 'palms to floor', isCritical: false },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 4,
      tendonSensitive: false,
    },
  },
  
  i_sit: {
  skillId: 'i_sit',
  displayName: 'Manna / I-Sit',
  primaryRequirements: ['compression_core', 'scapular_control', 'straight_arm_push'],
  supportPatterns: ['mobility', 'dip_pattern'],
  commonLimiters: [
  {
  limiterId: 'i_sit_compression',
  description: 'Extreme active compression',
  supportPatterns: ['compression_core'],
  exerciseIds: ['v_sit', 'pike_compression', 'manna_progressions', 'compression_pulses'],
  },
  {
  limiterId: 'i_sit_flexibility',
  description: 'Pancake and pike flexibility',
  supportPatterns: ['mobility'],
  exerciseIds: ['pike_stretch', 'pancake_stretch', 'hamstring_pnf'],
  },
  {
  limiterId: 'i_sit_shoulder_extension',
  description: 'Shoulder extension for lean',
  supportPatterns: ['mobility', 'straight_arm_push'],
  exerciseIds: ['shoulder_dislocates', 'german_hang', 'planche_lean'],
  },
  ],
  safeAlternatives: ['v_sit', 'manna_progressions', 'pike_compression'],
  directSupportExercises: ['v_sit', 'manna_progressions', 'compression_pulses'],
  accessorySupportExercises: ['pike_stretch', 'pancake_stretch', 'shoulder_dislocates', 'support_hold'],
  prerequisiteExercises: [
  { exerciseId: 'v_sit', requirement: '15s hold', isCritical: true },
  { exerciseId: 'pancake_stretch', requirement: 'chest to floor', isCritical: false },
  ],
  constraints: {
  maxStraightArmPerSession: 2,
  restDaysBetweenHeavySessions: 1,
  preferredFrequencyPerWeek: 4,
  tendonSensitive: false,
  },
  },
  
  handstand: {
  skillId: 'handstand',
  displayName: 'Handstand',
  primaryRequirements: ['vertical_push', 'scapular_control'],
    supportPatterns: ['anti_extension_core', 'joint_integrity'],
    commonLimiters: [
      {
        limiterId: 'handstand_balance',
        description: 'Balance control',
        supportPatterns: ['scapular_control', 'joint_integrity'],
        exerciseIds: ['wall_handstand', 'chest_to_wall_handstand', 'wrist_circles'],
      },
      {
        limiterId: 'handstand_overhead_mobility',
        description: 'Overhead shoulder mobility',
        supportPatterns: ['mobility'],
        exerciseIds: ['shoulder_dislocates', 'wall_slides'],
      },
    ],
    safeAlternatives: ['wall_handstand', 'chest_to_wall_handstand', 'pike_push_up'],
    directSupportExercises: ['wall_handstand', 'chest_to_wall_handstand', 'freestanding_handstand'],
    accessorySupportExercises: ['shoulder_dislocates', 'wrist_circles', 'hollow_body_hold', 'pike_push_up'],
    prerequisiteExercises: [
      { exerciseId: 'wall_handstand', requirement: '60s hold', isCritical: true },
      { exerciseId: 'hollow_body_hold', requirement: '30s hold', isCritical: false },
    ],
    constraints: {
      maxStraightArmPerSession: 3,
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 5,
      tendonSensitive: false,
    },
  },
  
  iron_cross: {
    skillId: 'iron_cross',
    displayName: 'Iron Cross',
    primaryRequirements: ['rings_strength', 'straight_arm_push', 'scapular_control'],
    supportPatterns: ['rings_stability', 'joint_integrity'],
    commonLimiters: [
      {
        limiterId: 'iron_cross_tendon_conditioning',
        description: 'Bicep and shoulder tendon conditioning',
        supportPatterns: ['rings_stability', 'joint_integrity'],
        exerciseIds: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold'],
      },
      {
        limiterId: 'iron_cross_straight_arm_strength',
        description: 'Straight-arm strength under extreme load',
        supportPatterns: ['straight_arm_push', 'rings_strength'],
        exerciseIds: ['cross_negatives', 'assisted_cross_hold', 'rto_support_hold'],
      },
    ],
    safeAlternatives: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold'],
    directSupportExercises: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold', 'cross_negatives', 'partial_cross_hold'],
    accessorySupportExercises: ['bicep_curl', 'face_pull', 'reverse_fly'],
    prerequisiteExercises: [
      { exerciseId: 'ring_support_hold', requirement: '60s hold', isCritical: true },
      { exerciseId: 'rto_support_hold', requirement: '30s hold', isCritical: true },
      { exerciseId: 'assisted_cross_hold', requirement: '15s hold', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 1,
      restDaysBetweenHeavySessions: 3,
      preferredFrequencyPerWeek: 2,
      tendonSensitive: true,
    },
  },
  
  human_flag: {
    skillId: 'human_flag',
    displayName: 'Human Flag',
    primaryRequirements: ['anti_rotation_core', 'horizontal_push', 'horizontal_pull'],
    supportPatterns: ['scapular_control', 'joint_integrity'],
    commonLimiters: [
      {
        limiterId: 'human_flag_oblique_strength',
        description: 'Anti-lateral flexion strength',
        supportPatterns: ['anti_rotation_core'],
        exerciseIds: ['side_plank', 'hanging_windshield_wipers', 'pallof_press'],
      },
      {
        limiterId: 'human_flag_pressing_pulling',
        description: 'Push/pull balance for flag position',
        supportPatterns: ['horizontal_push', 'horizontal_pull'],
        exerciseIds: ['one_arm_push_up', 'archer_pull_up'],
      },
    ],
    safeAlternatives: ['side_plank', 'straddle_flag', 'tuck_flag'],
    directSupportExercises: ['tuck_flag', 'straddle_flag', 'human_flag'],
    accessorySupportExercises: ['side_plank', 'pallof_press', 'archer_pull_up', 'one_arm_push_up'],
    prerequisiteExercises: [
      { exerciseId: 'side_plank', requirement: '45s hold', isCritical: true },
      { exerciseId: 'tuck_flag', requirement: '10s hold', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 2,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: false,
    },
  },
  
  one_arm_pull_up: {
    skillId: 'one_arm_pull_up',
    displayName: 'One-Arm Pull-Up',
    primaryRequirements: ['vertical_pull'],
    supportPatterns: ['horizontal_pull', 'scapular_control', 'joint_integrity'],
    commonLimiters: [
      {
        limiterId: 'one_arm_pull_up_strength',
        description: 'Unilateral pulling strength',
        supportPatterns: ['vertical_pull'],
        exerciseIds: ['weighted_pull_up', 'archer_pull_up', 'one_arm_assisted'],
      },
      {
        limiterId: 'one_arm_pull_up_tendon',
        description: 'Elbow/bicep tendon conditioning',
        supportPatterns: ['joint_integrity'],
        exerciseIds: ['bicep_curl', 'hammer_curl'],
      },
    ],
    safeAlternatives: ['weighted_pull_up', 'archer_pull_up', 'one_arm_assisted'],
    directSupportExercises: ['weighted_pull_up', 'archer_pull_up', 'one_arm_assisted', 'one_arm_pull_up'],
    accessorySupportExercises: ['bicep_curl', 'hammer_curl', 'face_pull', 'scapular_pulls'],
    prerequisiteExercises: [
      { exerciseId: 'pull_up', requirement: '15 reps', isCritical: true },
      { exerciseId: 'weighted_pull_up', requirement: '50% BW added', isCritical: true },
      { exerciseId: 'archer_pull_up', requirement: '8 reps', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 2,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: true,
    },
  },
  
  one_arm_push_up: {
    skillId: 'one_arm_push_up',
    displayName: 'One-Arm Push-Up',
    primaryRequirements: ['horizontal_push', 'anti_rotation_core'],
    supportPatterns: ['scapular_control'],
    commonLimiters: [
      {
        limiterId: 'one_arm_push_up_strength',
        description: 'Unilateral pressing strength',
        supportPatterns: ['horizontal_push'],
        exerciseIds: ['archer_push_up', 'weighted_push_up', 'decline_push_up'],
      },
      {
        limiterId: 'one_arm_push_up_stability',
        description: 'Core anti-rotation stability',
        supportPatterns: ['anti_rotation_core'],
        exerciseIds: ['pallof_press', 'one_arm_plank'],
      },
    ],
    safeAlternatives: ['archer_push_up', 'decline_push_up', 'elevated_one_arm_push_up'],
    directSupportExercises: ['archer_push_up', 'decline_push_up', 'one_arm_push_up'],
    accessorySupportExercises: ['pallof_press', 'tricep_extension', 'face_pull'],
    prerequisiteExercises: [
      { exerciseId: 'push_up', requirement: '30 reps', isCritical: true },
      { exerciseId: 'archer_push_up', requirement: '8 reps each', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 3,
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: false,
    },
  },
  
  dragon_flag: {
    skillId: 'dragon_flag',
    displayName: 'Dragon Flag',
    primaryRequirements: ['anti_extension_core', 'compression_core'],
    supportPatterns: ['scapular_control', 'vertical_pull'],
    commonLimiters: [
      {
        limiterId: 'dragon_flag_core_strength',
        description: 'Anti-extension core strength',
        supportPatterns: ['anti_extension_core'],
        exerciseIds: ['hollow_body_hold', 'body_lever', 'hanging_leg_raise', 'dragon_flag_tuck'],
      },
      {
        limiterId: 'dragon_flag_lat_engagement',
        description: 'Lat engagement for stable anchor',
        supportPatterns: ['vertical_pull', 'scapular_control'],
        exerciseIds: ['pull_up', 'scapular_pulls', 'bodyweight_row'],
      },
      {
        limiterId: 'dragon_flag_trunk_tension',
        description: 'Full body tension and stiffness',
        supportPatterns: ['anti_extension_core', 'compression_core'],
        exerciseIds: ['hollow_body_rock', 'plank_hold', 'ring_body_saw'],
      },
    ],
    safeAlternatives: ['dragon_flag_tuck', 'hollow_body_hold', 'body_lever'],
    directSupportExercises: ['dragon_flag_tuck', 'dragon_flag_neg', 'dragon_flag_assisted', 'dragon_flag'],
    accessorySupportExercises: ['hollow_body_hold', 'hollow_body_rock', 'hanging_leg_raise', 'body_lever', 'toes_to_bar'],
    prerequisiteExercises: [
      { exerciseId: 'hollow_body_hold', requirement: '45s hold', isCritical: true },
      { exerciseId: 'hanging_leg_raise', requirement: '10 reps', isCritical: true },
      { exerciseId: 'dragon_flag_tuck', requirement: '8 reps', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 3,
      restDaysBetweenHeavySessions: 1,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: false,
    },
  },
  
  planche_push_up: {
    skillId: 'planche_push_up',
    displayName: 'Planche Push-Up',
    primaryRequirements: ['straight_arm_push', 'horizontal_push', 'scapular_control'],
    supportPatterns: ['anti_extension_core', 'joint_integrity'],
    commonLimiters: [
      {
        limiterId: 'planche_push_up_straight_arm',
        description: 'Bent-arm planche position strength',
        supportPatterns: ['straight_arm_push', 'horizontal_push'],
        exerciseIds: ['pseudo_planche_pushup', 'tuck_planche', 'adv_tuck_planche', 'planche_lean'],
      },
      {
        limiterId: 'planche_push_up_pressing',
        description: 'Pressing out of planche position',
        supportPatterns: ['horizontal_push'],
        exerciseIds: ['pseudo_planche_pushup', 'deficit_push_up', 'ring_push_up'],
      },
      {
        limiterId: 'planche_push_up_protraction',
        description: 'Scapular protraction under load',
        supportPatterns: ['scapular_control'],
        exerciseIds: ['planche_lean', 'serratus_pushup', 'scapular_protraction'],
      },
    ],
    safeAlternatives: ['pseudo_planche_pushup', 'tuck_planche_pushup', 'elevated_pseudo_planche_pushup'],
    directSupportExercises: ['pseudo_planche_pushup', 'tuck_planche_pushup', 'adv_tuck_planche_pushup', 'straddle_planche_pushup', 'planche_pushup'],
    accessorySupportExercises: ['planche_lean', 'serratus_pushup', 'tricep_extension', 'face_pull', 'hollow_body_hold'],
    prerequisiteExercises: [
      { exerciseId: 'pseudo_planche_pushup', requirement: '12 reps', isCritical: true },
      { exerciseId: 'tuck_planche', requirement: '15s hold', isCritical: true },
      { exerciseId: 'tuck_planche_pushup', requirement: '5 reps', isCritical: true },
    ],
    constraints: {
      maxStraightArmPerSession: 2,
      restDaysBetweenHeavySessions: 2,
      preferredFrequencyPerWeek: 3,
      tendonSensitive: true,
    },
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get support mapping for a skill.
 */
export function getSupportMapping(skillId: SkillCarryover): SkillSupportMapping | null {
  return SKILL_SUPPORT_MAPPINGS[skillId] || null
}

/**
 * Get all direct support exercises for a skill.
 */
export function getDirectSupportExercises(skillId: SkillCarryover): string[] {
  const mapping = SKILL_SUPPORT_MAPPINGS[skillId]
  return mapping?.directSupportExercises || []
}

/**
 * Get common limiters for a skill.
 */
export function getSkillLimiters(skillId: SkillCarryover): LimiterMapping[] {
  const mapping = SKILL_SUPPORT_MAPPINGS[skillId]
  return mapping?.commonLimiters || []
}

/**
 * Get safe alternatives when prerequisites are not met.
 */
export function getSafeAlternatives(skillId: SkillCarryover): string[] {
  const mapping = SKILL_SUPPORT_MAPPINGS[skillId]
  return mapping?.safeAlternatives || []
}

/**
 * Check if a skill is tendon-sensitive.
 */
export function isSkillTendonSensitive(skillId: SkillCarryover): boolean {
  const mapping = SKILL_SUPPORT_MAPPINGS[skillId]
  return mapping?.constraints.tendonSensitive || false
}

/**
 * Get max straight-arm exercises allowed per session for a skill.
 */
export function getMaxStraightArmForSkill(skillId: SkillCarryover): number {
  const mapping = SKILL_SUPPORT_MAPPINGS[skillId]
  return mapping?.constraints.maxStraightArmPerSession || 2
}
