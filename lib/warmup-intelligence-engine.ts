/**
 * Warm-Up / Joint Prep Intelligence Engine
 * 
 * Dynamically generates intelligent, session-specific warm-ups based on:
 * - Athlete's program and targeted skills
 * - Joint stress profile for the session
 * - Athlete weaknesses and injury risk indicators
 * - Tendon adaptation needs
 * - Performance envelope
 * 
 * This engine integrates with:
 * - Program Builder
 * - Skill Progression Graph
 * - Weak Point Detection Engine
 * - Joint Protocol System
 * - Prehab Preparation Engine
 * - Exercise Intelligence Layer
 */

import type { SkillGoal } from './athlete-profile'
import type { WeakPointType } from './weak-point-engine'
import type { SkillGraphId } from './skill-progression-graph-engine'
import {
  analyzeJointStress,
  selectPrehabExercises,
  generateSafetyNotes,
  generatePrehabWarmup,
  PREHAB_EXERCISE_LIBRARY,
  SKILL_JOINT_MAPPINGS,
  EXERCISE_JOINT_MAPPINGS,
  type JointArea,
  type LoadingIntensity,
  type PrehabExercise,
  type PrehabGenerationContext,
  type GeneratedPrehabWarmup,
  type JointStress,
} from './prehab/prehab-preparation-engine'

// =============================================================================
// TYPES
// =============================================================================

export type JointCategory =
  | 'wrists'
  | 'elbows'
  | 'shoulders'
  | 'scapula'
  | 'thoracic_spine'
  | 'core'
  | 'hips'
  | 'hamstrings'
  | 'ankles'
  | 'forearms'

export interface JointPrepCategory {
  jointId: JointCategory
  displayName: string
  riskMovements: string[]
  recommendedPrep: string[]
  activationType: 'mobility' | 'activation' | 'tendon_prep' | 'stability' | 'mixed'
  defaultStressLevel: LoadingIntensity
  tendonSensitive: boolean
}

export interface SessionJointProfile {
  joint: JointCategory
  stressLevel: LoadingIntensity
  hasTendonRisk: boolean
  primaryExercises: string[]
  recommendedPrepTime: number // minutes
}

export interface WarmUpExerciseWithRationale {
  exerciseId: string
  name: string
  prescription: string
  targetJoint: JointCategory
  rationale: string
  priority: number
  isRequired: boolean
  knowledgeBubble?: {
    shortTip: string
    fullExplanation: string
  }
}

export interface IntelligentWarmUp {
  exercises: WarmUpExerciseWithRationale[]
  totalMinutes: number
  focusSummary: string
  jointPrepSummary: string[]
  safetyNotes: string[]
  weakPointAdjustments: string[]
  tendonPrepIncluded: boolean
  isCompressed: boolean // for short sessions
}

export interface WarmUpGenerationInput {
  // Session info
  sessionExercises: Array<{
    exerciseId: string
    exerciseName: string
    isSkillWork: boolean
    isWeighted: boolean
    isExplosive: boolean
    isStraightArm: boolean
  }>
  targetSkills: SkillGoal[]
  sessionDurationMinutes: number
  isShortSession: boolean
  
  // Athlete context
  weakPoints: WeakPointType[]
  jointCautions: JointCategory[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // Equipment
  hasRings: boolean
  hasBands: boolean
  hasPullBar: boolean
}

// =============================================================================
// JOINT PREPARATION REGISTRY
// =============================================================================

export const JOINT_PREP_REGISTRY: Record<JointCategory, JointPrepCategory> = {
  wrists: {
    jointId: 'wrists',
    displayName: 'Wrists',
    riskMovements: [
      'planche', 'pseudo_planche_pushup', 'handstand', 'ring_support',
      'planche_lean', 'maltese', 'floor_l_sit', 'pike_pushup',
    ],
    recommendedPrep: ['wrist_circles', 'wrist_rocks', 'palm_pulses', 'finger_extensions'],
    activationType: 'mobility',
    defaultStressLevel: 'moderate',
    tendonSensitive: true,
  },
  elbows: {
    jointId: 'elbows',
    displayName: 'Elbows',
    riskMovements: [
      'front_lever', 'back_lever', 'iron_cross', 'weighted_pull_up',
      'one_arm_pull_up', 'weighted_chin_up', 'muscle_up', 'maltese',
    ],
    recommendedPrep: ['light_band_curls', 'reverse_wrist_curls', 'elbow_circles', 'pronation_supination'],
    activationType: 'tendon_prep',
    defaultStressLevel: 'high',
    tendonSensitive: true,
  },
  shoulders: {
    jointId: 'shoulders',
    displayName: 'Shoulders',
    riskMovements: [
      'planche', 'handstand', 'muscle_up', 'iron_cross', 'maltese',
      'weighted_dip', 'hspu', 'back_lever', 'ring_dip',
    ],
    recommendedPrep: ['band_dislocates', 'arm_circles', 'shoulder_rotations', 'ytwl_raises'],
    activationType: 'mixed',
    defaultStressLevel: 'high',
    tendonSensitive: true,
  },
  scapula: {
    jointId: 'scapula',
    displayName: 'Scapula',
    riskMovements: [
      'front_lever', 'back_lever', 'planche', 'handstand',
      'muscle_up', 'one_arm_pull_up', 'iron_cross', 'ring_support',
    ],
    recommendedPrep: ['scapular_pull_ups', 'scapular_push_ups', 'band_pull_aparts', 'prone_i_raises'],
    activationType: 'activation',
    defaultStressLevel: 'moderate',
    tendonSensitive: false,
  },
  thoracic_spine: {
    jointId: 'thoracic_spine',
    displayName: 'Thoracic Spine',
    riskMovements: [
      'back_lever', 'german_hang', 'handstand', 'bridge',
    ],
    recommendedPrep: ['cat_cow', 'thread_the_needle', 'thoracic_rotations', 'foam_roll_thoracic'],
    activationType: 'mobility',
    defaultStressLevel: 'low',
    tendonSensitive: false,
  },
  core: {
    jointId: 'core',
    displayName: 'Core',
    riskMovements: [
      'front_lever', 'back_lever', 'planche', 'l_sit', 'v_sit',
      'dragon_flag', 'hanging_leg_raise', 'compression_work',
    ],
    recommendedPrep: ['hollow_hold', 'dead_bugs', 'plank_activation', 'pike_pulses'],
    activationType: 'activation',
    defaultStressLevel: 'moderate',
    tendonSensitive: false,
  },
  hips: {
    jointId: 'hips',
    displayName: 'Hips',
    riskMovements: [
      'l_sit', 'v_sit', 'straddle_planche', 'pike_compression',
      'pancake', 'middle_split',
    ],
    recommendedPrep: ['hip_circles', 'hip_flexor_activation', 'frog_stretch', 'hip_airplanes'],
    activationType: 'mobility',
    defaultStressLevel: 'moderate',
    tendonSensitive: false,
  },
  hamstrings: {
    jointId: 'hamstrings',
    displayName: 'Hamstrings',
    riskMovements: [
      'pike_compression', 'l_sit', 'v_sit', 'pancake',
    ],
    recommendedPrep: ['leg_swings', 'romanian_deadlift_bodyweight', 'hamstring_scoops'],
    activationType: 'mobility',
    defaultStressLevel: 'low',
    tendonSensitive: false,
  },
  ankles: {
    jointId: 'ankles',
    displayName: 'Ankles',
    riskMovements: [
      'pistol_squat', 'shrimp_squat', 'deep_squat',
    ],
    recommendedPrep: ['ankle_circles', 'calf_raises', 'ankle_rocks'],
    activationType: 'mobility',
    defaultStressLevel: 'low',
    tendonSensitive: false,
  },
  forearms: {
    jointId: 'forearms',
    displayName: 'Forearms',
    riskMovements: [
      'one_arm_pull_up', 'weighted_pull_up', 'front_lever', 'dead_hang',
    ],
    recommendedPrep: ['wrist_curls_light', 'reverse_wrist_curls', 'grip_work'],
    activationType: 'tendon_prep',
    defaultStressLevel: 'moderate',
    tendonSensitive: true,
  },
}

// =============================================================================
// EXERCISE JOINT STRESS PROFILES
// =============================================================================

export const EXERCISE_JOINT_STRESS_PROFILES: Record<string, Record<JointCategory, LoadingIntensity | null>> = {
  // Planche family
  planche_lean: { wrists: 'high', shoulders: 'high', scapula: 'moderate', elbows: 'low', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'low', thoracic_spine: null },
  tuck_planche: { wrists: 'high', shoulders: 'high', scapula: 'high', elbows: 'moderate', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: null },
  straddle_planche: { wrists: 'high', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: 'moderate', hamstrings: 'low', ankles: null, forearms: 'moderate', thoracic_spine: null },
  full_planche: { wrists: 'high', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: null },
  pseudo_planche_pushup: { wrists: 'high', shoulders: 'high', scapula: 'moderate', elbows: 'moderate', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'low', thoracic_spine: null },
  
  // Front lever family
  tuck_front_lever: { wrists: null, shoulders: 'moderate', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: null },
  front_lever_rows: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  front_lever: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  
  // Muscle-up family
  muscle_up: { wrists: 'moderate', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: null },
  weighted_muscle_up: { wrists: 'moderate', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  slow_muscle_up: { wrists: 'moderate', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: null },
  
  // Pull-up family
  pull_up: { wrists: null, shoulders: 'moderate', scapula: 'moderate', elbows: 'moderate', core: 'low', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: null },
  weighted_pull_up: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  one_arm_pull_up: { wrists: 'moderate', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  
  // Dip family
  dip: { wrists: null, shoulders: 'moderate', scapula: 'moderate', elbows: 'moderate', core: 'low', hips: null, hamstrings: null, ankles: null, forearms: null, thoracic_spine: null },
  weighted_dip: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: null, thoracic_spine: null },
  ring_dip: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: null, thoracic_spine: null },
  straight_bar_dip: { wrists: 'moderate', shoulders: 'high', scapula: 'high', elbows: 'high', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: null, thoracic_spine: null },
  
  // Handstand family
  handstand: { wrists: 'high', shoulders: 'moderate', scapula: 'moderate', elbows: 'low', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'low', thoracic_spine: null },
  hspu: { wrists: 'high', shoulders: 'high', scapula: 'high', elbows: 'moderate', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: 'low', thoracic_spine: null },
  
  // Back lever
  back_lever: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'moderate', thoracic_spine: 'high' },
  
  // Iron cross / Maltese
  iron_cross: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  maltese: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'high', core: 'high', hips: null, hamstrings: null, ankles: null, forearms: 'high', thoracic_spine: null },
  
  // Compression
  l_sit: { wrists: 'moderate', shoulders: 'moderate', scapula: 'low', elbows: 'low', core: 'high', hips: 'high', hamstrings: 'moderate', ankles: null, forearms: null, thoracic_spine: null },
  v_sit: { wrists: 'moderate', shoulders: 'moderate', scapula: 'low', elbows: 'low', core: 'high', hips: 'high', hamstrings: 'moderate', ankles: null, forearms: null, thoracic_spine: null },
  
  // Ring support
  ring_support: { wrists: null, shoulders: 'high', scapula: 'high', elbows: 'moderate', core: 'moderate', hips: null, hamstrings: null, ankles: null, forearms: null, thoracic_spine: null },
}

// =============================================================================
// WARM-UP EXERCISE DATABASE WITH KNOWLEDGE BUBBLES
// =============================================================================

export interface WarmUpExerciseDefinition {
  id: string
  name: string
  targetJoints: JointCategory[]
  prescription: string
  category: 'mobility' | 'activation' | 'tendon_prep' | 'stability'
  priority: number // 1-5, higher = more important
  equipment: ('none' | 'bands' | 'pull_bar' | 'rings' | 'floor')[]
  knowledgeBubble: {
    shortTip: string
    fullExplanation: string
  }
  durationSeconds: number
}

export const WARMUP_EXERCISE_DATABASE: WarmUpExerciseDefinition[] = [
  // WRIST PREPARATION
  {
    id: 'wrist_circles',
    name: 'Wrist Circles',
    targetJoints: ['wrists'],
    prescription: '10 each direction',
    category: 'mobility',
    priority: 5,
    equipment: ['none'],
    knowledgeBubble: {
      shortTip: 'Prepares wrists for loading',
      fullExplanation: 'Wrist circles increase synovial fluid production and warm the joint capsule before weight-bearing exercises.',
    },
    durationSeconds: 30,
  },
  {
    id: 'wrist_rocks',
    name: 'Wrist Rocks',
    targetJoints: ['wrists'],
    prescription: '10 forward, 10 backward',
    category: 'mobility',
    priority: 5,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Essential for planche and handstand',
      fullExplanation: 'Wrist rocks prepare the wrists for the extension demands of planche, handstand, and floor pressing movements.',
    },
    durationSeconds: 40,
  },
  {
    id: 'palm_pulses',
    name: 'Palm Pulses',
    targetJoints: ['wrists'],
    prescription: '20 pulses',
    category: 'mobility',
    priority: 4,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Wrist extension prep',
      fullExplanation: 'Gentle loading of the wrists in extension prepares the tendons for pushing movements.',
    },
    durationSeconds: 30,
  },
  
  // ELBOW PREPARATION
  {
    id: 'light_band_curls',
    name: 'Light Band Curls',
    targetJoints: ['elbows', 'forearms'],
    prescription: '15 reps',
    category: 'tendon_prep',
    priority: 4,
    equipment: ['bands'],
    knowledgeBubble: {
      shortTip: 'Bicep tendon warm-up',
      fullExplanation: 'Light curls increase blood flow to the bicep tendons, preparing them for straight-arm pulling stress.',
    },
    durationSeconds: 30,
  },
  {
    id: 'elbow_circles',
    name: 'Elbow Circles',
    targetJoints: ['elbows'],
    prescription: '10 each direction',
    category: 'mobility',
    priority: 3,
    equipment: ['none'],
    knowledgeBubble: {
      shortTip: 'Elbow joint mobilization',
      fullExplanation: 'Prepares the elbow joint capsule and surrounding tissues for flexion/extension demands.',
    },
    durationSeconds: 20,
  },
  {
    id: 'reverse_wrist_curls',
    name: 'Reverse Wrist Curls',
    targetJoints: ['elbows', 'forearms'],
    prescription: '15 reps',
    category: 'tendon_prep',
    priority: 4,
    equipment: ['bands'],
    knowledgeBubble: {
      shortTip: 'Forearm extensor prep',
      fullExplanation: 'Activates the forearm extensors and prepares the lateral elbow tendons for gripping demands.',
    },
    durationSeconds: 30,
  },
  
  // SHOULDER PREPARATION
  {
    id: 'arm_circles',
    name: 'Arm Circles',
    targetJoints: ['shoulders'],
    prescription: '10 each direction',
    category: 'mobility',
    priority: 4,
    equipment: ['none'],
    knowledgeBubble: {
      shortTip: 'General shoulder warm-up',
      fullExplanation: 'Arm circles mobilize the shoulder joint through its full range and increase blood flow to the rotator cuff.',
    },
    durationSeconds: 30,
  },
  {
    id: 'band_dislocates',
    name: 'Band Dislocates',
    targetJoints: ['shoulders', 'thoracic_spine'],
    prescription: '10 reps',
    category: 'mobility',
    priority: 5,
    equipment: ['bands'],
    knowledgeBubble: {
      shortTip: 'Shoulder flexibility prep',
      fullExplanation: 'Band dislocates improve shoulder mobility and prepare the joint for overhead and behind-body positions.',
    },
    durationSeconds: 40,
  },
  {
    id: 'shoulder_rotations',
    name: 'Internal/External Rotations',
    targetJoints: ['shoulders'],
    prescription: '10 each',
    category: 'activation',
    priority: 4,
    equipment: ['bands'],
    knowledgeBubble: {
      shortTip: 'Rotator cuff activation',
      fullExplanation: 'Activates the rotator cuff muscles to stabilize the shoulder during pressing and pulling.',
    },
    durationSeconds: 40,
  },
  {
    id: 'ytwl_raises',
    name: 'YTWL Raises',
    targetJoints: ['shoulders', 'scapula'],
    prescription: '5 each position',
    category: 'activation',
    priority: 4,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Shoulder stabilizer activation',
      fullExplanation: 'Targets the smaller stabilizer muscles of the shoulder and upper back for improved control.',
    },
    durationSeconds: 60,
  },
  
  // SCAPULAR PREPARATION
  {
    id: 'scapular_push_ups',
    name: 'Scapular Push-Ups',
    targetJoints: ['scapula', 'shoulders'],
    prescription: '10 reps',
    category: 'activation',
    priority: 5,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Serratus anterior activation',
      fullExplanation: 'Activates the serratus anterior for scapular protraction, essential for pushing movements and planche.',
    },
    durationSeconds: 30,
  },
  {
    id: 'scapular_pull_ups',
    name: 'Scapular Pull-Ups',
    targetJoints: ['scapula', 'shoulders'],
    prescription: '8 reps',
    category: 'activation',
    priority: 5,
    equipment: ['pull_bar'],
    knowledgeBubble: {
      shortTip: 'Scapular control for pulling',
      fullExplanation: 'Prepares the scapular depressors for pulling movements and front lever work.',
    },
    durationSeconds: 30,
  },
  {
    id: 'band_pull_aparts',
    name: 'Band Pull Aparts',
    targetJoints: ['scapula', 'shoulders'],
    prescription: '15 reps',
    category: 'activation',
    priority: 4,
    equipment: ['bands'],
    knowledgeBubble: {
      shortTip: 'Rear delt and rhomboid activation',
      fullExplanation: 'Activates the posterior shoulder and scapular retractors for improved posture and pulling strength.',
    },
    durationSeconds: 30,
  },
  
  // CORE PREPARATION
  {
    id: 'hollow_hold_activation',
    name: 'Hollow Hold Activation',
    targetJoints: ['core'],
    prescription: '20 seconds',
    category: 'activation',
    priority: 5,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Core activation for skill work',
      fullExplanation: 'Activates the deep core muscles needed for front lever, planche, and compression movements.',
    },
    durationSeconds: 25,
  },
  {
    id: 'dead_bugs',
    name: 'Dead Bugs',
    targetJoints: ['core', 'hips'],
    prescription: '10 each side',
    category: 'activation',
    priority: 4,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Anti-extension core prep',
      fullExplanation: 'Prepares the core for maintaining position during lever and compression movements.',
    },
    durationSeconds: 40,
  },
  {
    id: 'pike_pulses',
    name: 'Pike Pulses',
    targetJoints: ['core', 'hips', 'hamstrings'],
    prescription: '15 pulses',
    category: 'activation',
    priority: 4,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Compression activation',
      fullExplanation: 'Activates the hip flexors and compression muscles for L-sit and V-sit preparation.',
    },
    durationSeconds: 30,
  },
  
  // HIP PREPARATION
  {
    id: 'hip_circles',
    name: 'Hip Circles',
    targetJoints: ['hips'],
    prescription: '10 each direction',
    category: 'mobility',
    priority: 3,
    equipment: ['none'],
    knowledgeBubble: {
      shortTip: 'Hip joint mobilization',
      fullExplanation: 'Increases hip mobility and prepares the joint for compression and straddle positions.',
    },
    durationSeconds: 30,
  },
  {
    id: 'hip_flexor_activation',
    name: 'Hip Flexor Activation',
    targetJoints: ['hips', 'core'],
    prescription: '10 each leg',
    category: 'activation',
    priority: 4,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Hip flexor strength prep',
      fullExplanation: 'Activates the hip flexors for compression strength demands in L-sit and V-sit.',
    },
    durationSeconds: 40,
  },
  
  // THORACIC SPINE
  {
    id: 'cat_cow',
    name: 'Cat-Cow',
    targetJoints: ['thoracic_spine', 'core'],
    prescription: '10 reps',
    category: 'mobility',
    priority: 3,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Spine mobilization',
      fullExplanation: 'Mobilizes the thoracic spine and prepares it for extension demands in back lever and overhead work.',
    },
    durationSeconds: 30,
  },
  {
    id: 'thoracic_rotations',
    name: 'Thoracic Rotations',
    targetJoints: ['thoracic_spine'],
    prescription: '8 each side',
    category: 'mobility',
    priority: 3,
    equipment: ['floor'],
    knowledgeBubble: {
      shortTip: 'Rotational mobility',
      fullExplanation: 'Improves thoracic rotation for better overhead positioning and shoulder mechanics.',
    },
    durationSeconds: 40,
  },
]

// =============================================================================
// WEAK POINT TO WARMUP MAPPING
// =============================================================================

const WEAK_POINT_WARMUP_ADDITIONS: Record<WeakPointType, {
  extraExercises: string[]
  rationale: string
  priorityBoost: number
}> = {
  scapular_control: {
    extraExercises: ['scapular_pull_ups', 'scapular_push_ups', 'band_pull_aparts'],
    rationale: 'Additional scapular activation to address control deficit',
    priorityBoost: 2,
  },
  shoulder_stability: {
    extraExercises: ['shoulder_rotations', 'ytwl_raises', 'band_dislocates'],
    rationale: 'Enhanced shoulder stabilization for injury prevention',
    priorityBoost: 2,
  },
  wrist_tolerance: {
    extraExercises: ['wrist_circles', 'wrist_rocks', 'palm_pulses'],
    rationale: 'Extended wrist preparation due to low tolerance',
    priorityBoost: 3,
  },
  tendon_tolerance: {
    extraExercises: ['light_band_curls', 'reverse_wrist_curls'],
    rationale: 'Tendon warm-up for improved tolerance',
    priorityBoost: 2,
  },
  compression_strength: {
    extraExercises: ['pike_pulses', 'hollow_hold_activation', 'dead_bugs'],
    rationale: 'Core and compression activation to support weak point',
    priorityBoost: 1,
  },
  pull_strength: {
    extraExercises: ['scapular_pull_ups', 'band_pull_aparts'],
    rationale: 'Pulling activation to prepare for strength work',
    priorityBoost: 1,
  },
  push_strength: {
    extraExercises: ['scapular_push_ups', 'shoulder_rotations'],
    rationale: 'Pushing activation to prepare for strength work',
    priorityBoost: 1,
  },
  straight_arm_pull_strength: {
    extraExercises: ['scapular_pull_ups', 'light_band_curls', 'hollow_hold_activation'],
    rationale: 'Preparation for straight-arm pulling demands',
    priorityBoost: 2,
  },
  straight_arm_push_strength: {
    extraExercises: ['wrist_rocks', 'scapular_push_ups', 'shoulder_rotations'],
    rationale: 'Preparation for straight-arm pushing demands',
    priorityBoost: 2,
  },
  core_control: {
    extraExercises: ['hollow_hold_activation', 'dead_bugs'],
    rationale: 'Core activation for improved control',
    priorityBoost: 1,
  },
  balance_control: {
    extraExercises: ['hollow_hold_activation', 'scapular_push_ups'],
    rationale: 'Stability activation for balance work',
    priorityBoost: 1,
  },
  ring_support_stability: {
    extraExercises: ['scapular_push_ups', 'shoulder_rotations', 'band_pull_aparts'],
    rationale: 'Ring stability preparation',
    priorityBoost: 2,
  },
  explosive_power: {
    extraExercises: ['scapular_pull_ups', 'arm_circles'],
    rationale: 'Neural activation for explosive movements',
    priorityBoost: 1,
  },
  transition_strength: {
    extraExercises: ['scapular_pull_ups', 'scapular_push_ups', 'hollow_hold_activation'],
    rationale: 'Transition preparation for muscle-up work',
    priorityBoost: 1,
  },
  vertical_push_strength: {
    extraExercises: ['shoulder_rotations', 'wrist_rocks'],
    rationale: 'Vertical push preparation',
    priorityBoost: 1,
  },
  dip_strength: {
    extraExercises: ['scapular_push_ups', 'shoulder_rotations'],
    rationale: 'Dip preparation',
    priorityBoost: 1,
  },
  mobility: {
    extraExercises: ['band_dislocates', 'hip_circles', 'thoracic_rotations'],
    rationale: 'Mobility focus due to limitation',
    priorityBoost: 1,
  },
  shoulder_extension_mobility: {
    extraExercises: ['band_dislocates', 'thoracic_rotations'],
    rationale: 'Shoulder extension preparation',
    priorityBoost: 2,
  },
  recovery_capacity: {
    extraExercises: [],
    rationale: 'No specific warmup adjustment',
    priorityBoost: 0,
  },
  work_capacity: {
    extraExercises: [],
    rationale: 'No specific warmup adjustment',
    priorityBoost: 0,
  },
  equipment_limitation: {
    extraExercises: [],
    rationale: 'No specific warmup adjustment',
    priorityBoost: 0,
  },
  none: {
    extraExercises: [],
    rationale: 'No weak point detected',
    priorityBoost: 0,
  },
  // [WEAK-POINT-TYPE-CONTRACT] These five keys complete the
  // Record<WeakPointType, ...> exhaustiveness contract for the canonical
  // WeakPointType union (lib/weak-point-engine.ts:43-77). Each entry is a
  // conservative warm-up addition derived from the existing nearest-neighbour
  // entries above; no new exercise IDs are introduced. Doctrine intent:
  // these weak points get standard activation work without overriding the
  // joint-stress-driven primary warm-up.
  bent_arm_pull: {
    extraExercises: ['scapular_pull_ups', 'band_pull_aparts'],
    rationale: 'Bent-arm pulling activation to prepare elbows and lats',
    priorityBoost: 1,
  },
  bent_arm_push: {
    extraExercises: ['scapular_push_ups', 'shoulder_rotations'],
    rationale: 'Bent-arm pushing activation to prepare elbows and shoulders',
    priorityBoost: 1,
  },
  core_compression: {
    extraExercises: ['pike_pulses', 'hollow_hold_activation', 'dead_bugs'],
    rationale: 'Compression activation to support core weak point',
    priorityBoost: 1,
  },
  core_anti_extension: {
    extraExercises: ['hollow_hold_activation', 'dead_bugs'],
    rationale: 'Anti-extension activation to stabilize lumbar spine',
    priorityBoost: 1,
  },
  general_fatigue: {
    extraExercises: [],
    rationale: 'Reduce warm-up intensity due to general fatigue load',
    priorityBoost: 0,
  },
}

// =============================================================================
// WARMUP GENERATION FUNCTIONS
// =============================================================================

/**
 * Analyze session exercises to determine joint stress profile
 */
export function analyzeSessionJointStress(
  input: WarmUpGenerationInput
): Map<JointCategory, SessionJointProfile> {
  const jointProfiles = new Map<JointCategory, SessionJointProfile>()
  
  // Initialize all joints
  const allJoints: JointCategory[] = ['wrists', 'elbows', 'shoulders', 'scapula', 'thoracic_spine', 'core', 'hips', 'hamstrings', 'ankles', 'forearms']
  for (const joint of allJoints) {
    jointProfiles.set(joint, {
      joint,
      stressLevel: 'low',
      hasTendonRisk: false,
      primaryExercises: [],
      recommendedPrepTime: 0,
    })
  }
  
  // Analyze each exercise
  for (const exercise of input.sessionExercises) {
    const stressProfile = EXERCISE_JOINT_STRESS_PROFILES[exercise.exerciseId] ||
                          EXERCISE_JOINT_STRESS_PROFILES[exercise.exerciseName.toLowerCase().replace(/\s+/g, '_')]
    
    if (stressProfile) {
      for (const [jointStr, intensity] of Object.entries(stressProfile)) {
        const joint = jointStr as JointCategory
        if (intensity) {
          const profile = jointProfiles.get(joint)!
          
          // Update stress level to max
          profile.stressLevel = maxIntensity(profile.stressLevel, intensity)
          profile.primaryExercises.push(exercise.exerciseName)
          
          // Check tendon risk
          if (exercise.isStraightArm || exercise.isWeighted) {
            const jointRegistry = JOINT_PREP_REGISTRY[joint]
            if (jointRegistry?.tendonSensitive) {
              profile.hasTendonRisk = true
            }
          }
        }
      }
    }
  }
  
  // Also analyze target skills
  for (const skill of input.targetSkills) {
    const skillStress = SKILL_JOINT_MAPPINGS[skill]
    if (skillStress) {
      for (const stress of skillStress) {
        const mappedJoint = mapJointAreaToCategory(stress.joint)
        if (mappedJoint) {
          const profile = jointProfiles.get(mappedJoint)!
          profile.stressLevel = maxIntensity(profile.stressLevel, stress.intensity)
          profile.hasTendonRisk = profile.hasTendonRisk || stress.tendonRisk
          profile.primaryExercises.push(skill)
        }
      }
    }
  }
  
  // Calculate recommended prep time
  for (const [joint, profile] of jointProfiles) {
    if (profile.stressLevel !== 'low' || profile.primaryExercises.length > 0) {
      profile.recommendedPrepTime = calculatePrepTime(profile.stressLevel, profile.hasTendonRisk)
    }
  }
  
  return jointProfiles
}

function mapJointAreaToCategory(area: JointArea): JointCategory | null {
  const mapping: Record<JointArea, JointCategory> = {
    wrist: 'wrists',
    elbow: 'elbows',
    shoulder_anterior: 'shoulders',
    shoulder_posterior: 'shoulders',
    shoulder_extension: 'shoulders',
    scapula: 'scapula',
    spine: 'thoracic_spine',
    hip: 'hips',
    core: 'core',
  }
  return mapping[area] || null
}

function maxIntensity(a: LoadingIntensity, b: LoadingIntensity): LoadingIntensity {
  const order: LoadingIntensity[] = ['low', 'moderate', 'high', 'extreme']
  const aIdx = order.indexOf(a)
  const bIdx = order.indexOf(b)
  return order[Math.max(aIdx, bIdx)]
}

function calculatePrepTime(intensity: LoadingIntensity, hasTendonRisk: boolean): number {
  const baseTimes: Record<LoadingIntensity, number> = {
    low: 0.5,
    moderate: 1,
    high: 1.5,
    extreme: 2,
  }
  return baseTimes[intensity] + (hasTendonRisk ? 0.5 : 0)
}

/**
 * Select warmup exercises based on joint stress profile
 */
export function selectWarmupExercises(
  jointProfiles: Map<JointCategory, SessionJointProfile>,
  input: WarmUpGenerationInput,
  maxExercises: number
): WarmUpExerciseWithRationale[] {
  const selectedExercises: WarmUpExerciseWithRationale[] = []
  const usedExerciseIds = new Set<string>()
  
  // Get joints that need prep (sorted by priority)
  const jointsNeedingPrep = Array.from(jointProfiles.entries())
    .filter(([, profile]) => profile.stressLevel !== 'low' || profile.primaryExercises.length > 0)
    .sort((a, b) => {
      // Sort by stress level (high/extreme first) and tendon risk
      const aScore = getStressScore(a[1].stressLevel) + (a[1].hasTendonRisk ? 2 : 0)
      const bScore = getStressScore(b[1].stressLevel) + (b[1].hasTendonRisk ? 2 : 0)
      return bScore - aScore
    })
  
  // Add exercises for high-stress joints first
  for (const [joint, profile] of jointsNeedingPrep) {
    if (selectedExercises.length >= maxExercises) break
    
    const candidates = WARMUP_EXERCISE_DATABASE
      .filter(ex => ex.targetJoints.includes(joint) && !usedExerciseIds.has(ex.id))
      .filter(ex => hasRequiredEquipment(ex, input))
      .sort((a, b) => b.priority - a.priority)
    
    if (candidates.length > 0) {
      const exercise = candidates[0]
      usedExerciseIds.add(exercise.id)
      
      selectedExercises.push({
        exerciseId: exercise.id,
        name: exercise.name,
        prescription: exercise.prescription,
        targetJoint: joint,
        rationale: generateExerciseRationale(exercise, profile),
        priority: exercise.priority + getStressScore(profile.stressLevel),
        isRequired: profile.stressLevel === 'high' || profile.stressLevel === 'extreme',
        knowledgeBubble: exercise.knowledgeBubble,
      })
    }
  }
  
  // Add weak point exercises if space
  for (const weakPoint of input.weakPoints) {
    if (selectedExercises.length >= maxExercises) break
    
    const additions = WEAK_POINT_WARMUP_ADDITIONS[weakPoint]
    if (additions && additions.extraExercises.length > 0) {
      for (const exId of additions.extraExercises) {
        if (selectedExercises.length >= maxExercises) break
        if (usedExerciseIds.has(exId)) continue
        
        const exercise = WARMUP_EXERCISE_DATABASE.find(ex => ex.id === exId)
        if (exercise && hasRequiredEquipment(exercise, input)) {
          usedExerciseIds.add(exId)
          selectedExercises.push({
            exerciseId: exercise.id,
            name: exercise.name,
            prescription: exercise.prescription,
            targetJoint: exercise.targetJoints[0],
            rationale: additions.rationale,
            priority: exercise.priority + additions.priorityBoost,
            isRequired: false,
            knowledgeBubble: exercise.knowledgeBubble,
          })
        }
      }
    }
  }
  
  // Sort by priority
  return selectedExercises.sort((a, b) => b.priority - a.priority)
}

function getStressScore(intensity: LoadingIntensity): number {
  const scores: Record<LoadingIntensity, number> = {
    low: 0,
    moderate: 1,
    high: 2,
    extreme: 3,
  }
  return scores[intensity]
}

function hasRequiredEquipment(exercise: WarmUpExerciseDefinition, input: WarmUpGenerationInput): boolean {
  if (exercise.equipment.includes('none') || exercise.equipment.includes('floor')) {
    return true
  }
  if (exercise.equipment.includes('bands') && input.hasBands) return true
  if (exercise.equipment.includes('pull_bar') && input.hasPullBar) return true
  if (exercise.equipment.includes('rings') && input.hasRings) return true
  return false
}

function generateExerciseRationale(exercise: WarmUpExerciseDefinition, profile: SessionJointProfile): string {
  const jointName = JOINT_PREP_REGISTRY[profile.joint]?.displayName || profile.joint
  
  if (profile.hasTendonRisk) {
    return `${exercise.category === 'tendon_prep' ? 'Tendon preparation' : 'Joint preparation'} for ${jointName.toLowerCase()} due to high-stress movements: ${profile.primaryExercises.slice(0, 2).join(', ')}`
  }
  
  return `${jointName} preparation for ${profile.primaryExercises.slice(0, 2).join(', ')}`
}

/**
 * Generate intelligent warmup
 */
export function generateIntelligentWarmup(input: WarmUpGenerationInput): IntelligentWarmUp {
  // Analyze joint stress
  const jointProfiles = analyzeSessionJointStress(input)
  
  // Determine max exercises based on session type
  const maxExercises = input.isShortSession 
    ? 3 
    : input.sessionDurationMinutes < 30 
      ? 4 
      : 5
  
  // Select exercises
  const exercises = selectWarmupExercises(jointProfiles, input, maxExercises)
  
  // Calculate total time
  const totalSeconds = exercises.reduce((sum, ex) => {
    const definition = WARMUP_EXERCISE_DATABASE.find(d => d.id === ex.exerciseId)
    return sum + (definition?.durationSeconds || 30)
  }, 0)
  const totalMinutes = Math.ceil(totalSeconds / 60)
  
  // Generate summaries
  const focusSummary = generateFocusSummary(jointProfiles, input.targetSkills)
  const jointPrepSummary = generateJointPrepSummary(jointProfiles)
  const safetyNotes = generateWarmupSafetyNotes(jointProfiles, input)
  const weakPointAdjustments = generateWeakPointAdjustments(input.weakPoints, exercises)
  
  // Check if tendon prep included
  const tendonPrepIncluded = exercises.some(ex => {
    const def = WARMUP_EXERCISE_DATABASE.find(d => d.id === ex.exerciseId)
    return def?.category === 'tendon_prep'
  })
  
  return {
    exercises,
    totalMinutes,
    focusSummary,
    jointPrepSummary,
    safetyNotes,
    weakPointAdjustments,
    tendonPrepIncluded,
    isCompressed: input.isShortSession,
  }
}

function generateFocusSummary(
  jointProfiles: Map<JointCategory, SessionJointProfile>,
  targetSkills: SkillGoal[]
): string {
  const highStressJoints = Array.from(jointProfiles.entries())
    .filter(([, p]) => p.stressLevel === 'high' || p.stressLevel === 'extreme')
    .map(([j]) => JOINT_PREP_REGISTRY[j]?.displayName || j)
  
  if (highStressJoints.length === 0) {
    return `General warm-up for ${targetSkills.length > 0 ? targetSkills.slice(0, 2).join(' and ') : 'your session'}.`
  }
  
  return `Targeted preparation for ${highStressJoints.slice(0, 3).join(', ')} due to ${targetSkills.length > 0 ? targetSkills[0] : 'session'} demands.`
}

function generateJointPrepSummary(jointProfiles: Map<JointCategory, SessionJointProfile>): string[] {
  const summaries: string[] = []
  
  for (const [joint, profile] of jointProfiles) {
    if (profile.stressLevel === 'high' || profile.stressLevel === 'extreme') {
      const jointName = JOINT_PREP_REGISTRY[joint]?.displayName || joint
      const riskNote = profile.hasTendonRisk ? ' (tendon stress)' : ''
      summaries.push(`${jointName}: ${profile.stressLevel} stress${riskNote}`)
    }
  }
  
  return summaries
}

function generateWarmupSafetyNotes(
  jointProfiles: Map<JointCategory, SessionJointProfile>,
  input: WarmUpGenerationInput
): string[] {
  const notes: string[] = []
  
  // Check for tendon-sensitive joints
  for (const [joint, profile] of jointProfiles) {
    if (profile.hasTendonRisk) {
      const jointName = JOINT_PREP_REGISTRY[joint]?.displayName || joint
      notes.push(`Take extra time warming up ${jointName.toLowerCase()} - tendon loading expected.`)
    }
  }
  
  // Check for joint cautions
  for (const caution of input.jointCautions) {
    const profile = jointProfiles.get(caution)
    if (profile && profile.stressLevel !== 'low') {
      notes.push(`Proceed carefully with ${caution} work due to existing caution.`)
    }
  }
  
  // Beginner safety
  if (input.experienceLevel === 'beginner') {
    notes.push('As a beginner, spend extra time on each warm-up movement.')
  }
  
  return notes
}

function generateWeakPointAdjustments(
  weakPoints: WeakPointType[],
  exercises: WarmUpExerciseWithRationale[]
): string[] {
  const adjustments: string[] = []
  
  for (const weakPoint of weakPoints) {
    const addition = WEAK_POINT_WARMUP_ADDITIONS[weakPoint]
    if (addition && addition.extraExercises.length > 0) {
      const included = exercises.some(ex => addition.extraExercises.includes(ex.exerciseId))
      if (included) {
        adjustments.push(addition.rationale)
      }
    }
  }
  
  return adjustments
}

// =============================================================================
// SHORT SESSION SUPPORT
// =============================================================================

/**
 * Generate compressed warmup for short sessions
 */
export function generateCompressedWarmup(
  input: WarmUpGenerationInput
): IntelligentWarmUp {
  // Force short session mode
  const shortInput: WarmUpGenerationInput = {
    ...input,
    isShortSession: true,
  }
  
  const warmup = generateIntelligentWarmup(shortInput)
  
  // Further compress if needed
  if (warmup.exercises.length > 3) {
    warmup.exercises = warmup.exercises
      .filter(ex => ex.isRequired || ex.priority >= 5)
      .slice(0, 3)
    
    // Recalculate time
    warmup.totalMinutes = Math.ceil(
      warmup.exercises.reduce((sum, ex) => {
        const def = WARMUP_EXERCISE_DATABASE.find(d => d.id === ex.exerciseId)
        return sum + (def?.durationSeconds || 30)
      }, 0) / 60
    )
  }
  
  return warmup
}

// =============================================================================
// KNOWLEDGE BUBBLE HELPERS
// =============================================================================

/**
 * Get knowledge bubble for a warmup exercise
 */
export function getWarmupKnowledgeBubble(exerciseId: string): {
  shortTip: string
  fullExplanation: string
} | null {
  const exercise = WARMUP_EXERCISE_DATABASE.find(ex => ex.id === exerciseId)
  return exercise?.knowledgeBubble || null
}

/**
 * Generate contextual warmup explanation
 */
export function generateWarmupExplanation(
  warmup: IntelligentWarmUp,
  targetSkill?: SkillGoal
): string {
  const jointFocus = warmup.jointPrepSummary.length > 0
    ? warmup.jointPrepSummary[0].split(':')[0]
    : 'general preparation'
  
  if (warmup.isCompressed) {
    return `This compressed warm-up focuses on ${jointFocus.toLowerCase()} to prepare you for ${targetSkill || 'your session'} in minimal time.`
  }
  
  if (warmup.tendonPrepIncluded) {
    return `This warm-up includes tendon preparation because your session contains high-stress straight-arm work.`
  }
  
  return `Targeted warm-up for ${jointFocus.toLowerCase()} to prepare you for ${targetSkill || 'your session'}.`
}

// =============================================================================
// VOLUME GOVERNOR INTEGRATION
// =============================================================================

import { SkillVolumeGovernor, type SessionStressAnalysis } from './skill-volume-governor-engine'

/**
 * Enhance warmup based on volume governor stress analysis
 */
export function enhanceWarmupFromGovernor(
  baseWarmup: IntelligentWarmUp,
  stressAnalysis: SessionStressAnalysis
): IntelligentWarmUp {
  const warmupNeeds = SkillVolumeGovernor.getStressBasedWarmupNeeds(stressAnalysis)
  
  // If governor recommends thorough warmup, add additional prep
  if (warmupNeeds.warmupIntensityLevel === 'thorough') {
    const enhancedWarmup = { ...baseWarmup }
    
    // Add tendon prep exercises
    for (const tendonPrep of warmupNeeds.additionalTendonPrep) {
      const existingIds = enhancedWarmup.exercises.map(e => e.exerciseId)
      if (!existingIds.includes(tendonPrep)) {
        const tendonExercise = WARMUP_EXERCISE_DATABASE.find(e => e.id === tendonPrep)
        if (tendonExercise) {
          enhancedWarmup.exercises.push({
            exerciseId: tendonExercise.id,
            exerciseName: tendonExercise.name,
            instruction: tendonExercise.defaultPrescription,
            rationale: `Added for tendon preparation based on session stress analysis.`,
            jointCategory: tendonExercise.primaryJoint,
            priority: tendonExercise.priority,
            knowledgeBubble: tendonExercise.knowledgeBubble,
          })
        }
      }
    }
    
    // Add joint prep for high-stress joints
    for (const joint of warmupNeeds.additionalJointPrep) {
      const jointExercises = WARMUP_EXERCISE_DATABASE.filter(e => e.primaryJoint === joint)
      const existingIds = enhancedWarmup.exercises.map(e => e.exerciseId)
      const newJointExercise = jointExercises.find(e => !existingIds.includes(e.id))
      
      if (newJointExercise) {
        enhancedWarmup.exercises.push({
          exerciseId: newJointExercise.id,
          exerciseName: newJointExercise.name,
          instruction: newJointExercise.defaultPrescription,
          rationale: `Added for ${joint} preparation due to elevated stress.`,
          jointCategory: newJointExercise.primaryJoint,
          priority: newJointExercise.priority,
          knowledgeBubble: newJointExercise.knowledgeBubble,
        })
      }
    }
    
    // Recalculate total time
    enhancedWarmup.totalMinutes = Math.ceil(
      enhancedWarmup.exercises.reduce((sum, ex) => {
        const def = WARMUP_EXERCISE_DATABASE.find(d => d.id === ex.exerciseId)
        return sum + (def?.durationSeconds || 30)
      }, 0) / 60
    )
    
    enhancedWarmup.tendonPrepIncluded = true
    enhancedWarmup.coachingNote = `Enhanced warm-up recommended due to ${stressAnalysis.fatigueRiskLevel} session stress. ${stressAnalysis.coachingExplanation}`
    
    return enhancedWarmup
  }
  
  return baseWarmup
}

// =============================================================================
// EXPORTS
// =============================================================================
//
// [DUPLICATE-EXPORT-CONTRACT-FIX] All public symbols are exported inline at
// their declaration sites. The previous bottom `export { ... }` block
// duplicated every name, producing TS2300/TS2484. Inline `export function`
// remains the single canonical export style; public API is unchanged.
