// Progression Ladders System
// Defines skill progression paths, regression relationships, and substitution mappings
// Enables intelligent exercise adaptation based on athlete performance

import type { Exercise, DifficultyLevel } from './adaptive-exercise-pool'
import { getAllExercises } from './adaptive-exercise-pool'

// =============================================================================
// TYPES
// =============================================================================

export interface ProgressionLadder {
  id: string
  name: string
  description: string
  skill: string // Target skill this ladder leads to
  steps: ProgressionStep[]
}

export interface ProgressionStep {
  exerciseId: string
  level: number // 1 = easiest, higher = harder
  prerequisiteHoldTime?: string // For isometric exercises
  prerequisiteReps?: number // For rep-based exercises
  cues?: string[] // Coaching cues for this step
}

export interface SubstitutionMapping {
  exerciseId: string
  substitutes: SubstituteOption[]
}

export interface SubstituteOption {
  exerciseId: string
  suitability: 'ideal' | 'good' | 'acceptable'
  reason: string
  fatigueAdjustment?: 'easier' | 'similar' | 'harder'
}

export interface ProgressionResult {
  currentStep: ProgressionStep
  nextStep?: ProgressionStep
  previousStep?: ProgressionStep
  percentComplete: number
  ladderId: string
  ladderName: string
}

// =============================================================================
// SKILL PROGRESSION LADDERS
// =============================================================================

export const PROGRESSION_LADDERS: ProgressionLadder[] = [
  // ===== FRONT LEVER PROGRESSION =====
  {
    id: 'front_lever',
    name: 'Front Lever',
    description: 'Horizontal pull skill progression from tuck to full front lever',
    skill: 'front_lever',
    steps: [
      {
        exerciseId: 'tuck_fl',
        level: 1,
        prerequisiteHoldTime: '15s',
        cues: ['Tight tuck', 'Hips at bar height', 'Depress shoulders'],
      },
      {
        exerciseId: 'adv_tuck_fl',
        level: 2,
        prerequisiteHoldTime: '12s',
        cues: ['Open hip angle to 90°', 'Maintain horizontal body', 'Strong lat engagement'],
      },
      {
        exerciseId: 'one_leg_fl',
        level: 3,
        prerequisiteHoldTime: '10s',
        cues: ['One leg extended', 'Fight rotation', 'Keep hips level'],
      },
      {
        exerciseId: 'straddle_fl',
        level: 4,
        prerequisiteHoldTime: '8s',
        cues: ['Wide straddle', 'Point toes', 'Shoulders depressed'],
      },
      {
        exerciseId: 'banded_fl_hold',
        level: 5,
        prerequisiteHoldTime: '20s',
        cues: ['Full FL position with band', 'Reduce band assistance over time', 'Practice full body line'],
      },
    ],
  },

  // ===== IRON CROSS PROGRESSION =====
  {
    id: 'iron_cross',
    name: 'Iron Cross',
    description: 'Advanced rings skill progression requiring extreme straight-arm shoulder strength',
    skill: 'iron_cross',
    steps: [
      {
        exerciseId: 'ring_support_hold',
        level: 1,
        prerequisiteHoldTime: '60s',
        cues: ['Arms locked straight', 'Shoulders depressed', 'Rings stable against body'],
      },
      {
        exerciseId: 'rto_support_hold',
        level: 2,
        prerequisiteHoldTime: '30s',
        cues: ['Rings turned out 45-90 degrees', 'Maintain depression', 'Control rotation'],
      },
      {
        exerciseId: 'assisted_cross_hold',
        level: 3,
        prerequisiteHoldTime: '15s',
        cues: ['Use band for assistance', 'Arms horizontal', 'Shoulders depressed throughout'],
      },
      {
        exerciseId: 'cross_negatives',
        level: 4,
        prerequisiteReps: 5,
        cues: ['Slow controlled descent', '5+ seconds per rep', 'Fight against gravity'],
      },
      {
        exerciseId: 'partial_cross_hold',
        level: 5,
        prerequisiteHoldTime: '10s',
        cues: ['Arms at 45-degree angle', 'Build toward horizontal', 'Perfect form over ROM'],
      },
      {
        exerciseId: 'full_iron_cross',
        level: 6,
        prerequisiteHoldTime: '5s',
        cues: ['Arms fully horizontal', 'Body vertical', 'Maximum tension throughout'],
      },
    ],
  },

  // ===== PLANCHE PROGRESSION =====
  {
    id: 'planche',
    name: 'Planche',
    description: 'Horizontal push skill progression from lean to full planche',
    skill: 'planche',
    steps: [
      {
        exerciseId: 'planche_lean',
        level: 1,
        prerequisiteHoldTime: '30s',
        cues: ['Protracted shoulders', 'Straight arms', 'Lean forward progressively'],
      },
      {
        exerciseId: 'tuck_planche',
        level: 2,
        prerequisiteHoldTime: '12s',
        cues: ['Tight tuck', 'Round upper back', 'Push through floor'],
      },
      {
        exerciseId: 'adv_tuck_planche',
        level: 3,
        prerequisiteHoldTime: '10s',
        cues: ['Open hip angle', 'Maintain protraction', 'Keep hips low'],
      },
      {
        exerciseId: 'straddle_planche',
        level: 4,
        prerequisiteHoldTime: '6s',
        cues: ['Wide straddle', 'Strong lean', 'Full body tension'],
      },
      {
        exerciseId: 'banded_planche_hold',
        level: 5,
        prerequisiteHoldTime: '15s',
        cues: ['Full planche position with band', 'Progressive band reduction', 'Maintain straight body'],
      },
    ],
  },

  // ===== MUSCLE-UP PROGRESSION =====
  {
    id: 'muscle_up',
    name: 'Muscle-Up',
    description: 'Transition skill from pull to dip position',
    skill: 'muscle_up',
    steps: [
      {
        exerciseId: 'explosive_pull_up',
        level: 1,
        prerequisiteReps: 8,
        cues: ['Maximum acceleration', 'Pull to lower chest', 'Quick elbows'],
      },
      {
        exerciseId: 'chest_to_bar_pull_up',
        level: 2,
        prerequisiteReps: 5,
        cues: ['Touch chest to bar', 'Lean back slightly', 'Strong pull'],
      },
      {
        exerciseId: 'muscle_up_transition_drill',
        level: 3,
        prerequisiteReps: 8,
        cues: ['Low bar practice', 'Roll wrists over', 'Lead with chest'],
      },
      {
        exerciseId: 'muscle_up_negative',
        level: 4,
        prerequisiteReps: 5,
        cues: ['Slow descent (3-4s)', 'Control transition', 'Stay close to bar'],
      },
      {
        exerciseId: 'strict_muscle_up',
        level: 5,
        prerequisiteReps: 3,
        cues: ['No kip', 'Explosive pull', 'Deep dip at top'],
      },
    ],
  },

  // ===== HSPU PROGRESSION =====
  {
    id: 'handstand_pushup',
    name: 'Handstand Push-Up',
    description: 'Vertical push progression from pike to freestanding HSPU',
    skill: 'handstand_pushup',
    steps: [
      {
        exerciseId: 'pike_pushup',
        level: 1,
        prerequisiteReps: 15,
        cues: ['Hips high', 'Head between arms', 'Full ROM'],
      },
      {
        exerciseId: 'pike_pushup_elevated',
        level: 2,
        prerequisiteReps: 12,
        cues: ['Feet on box', 'More vertical torso', 'Control descent'],
      },
      {
        exerciseId: 'wall_hspu_negative',
        level: 3,
        prerequisiteReps: 6,
        cues: ['Slow 3-4s descent', 'Head forward', 'Elbows track 45°'],
      },
      {
        exerciseId: 'wall_hspu',
        level: 4,
        prerequisiteReps: 5,
        cues: ['Full ROM', 'Head to floor', 'Squeeze at top'],
      },
      {
        exerciseId: 'deficit_hspu',
        level: 5,
        prerequisiteReps: 3,
        cues: ['Extended ROM', 'Parallettes/blocks', 'Maximum strength'],
      },
      {
        exerciseId: 'freestanding_hs_hold',
        level: 6,
        prerequisiteHoldTime: '30s',
        cues: ['Balance first', 'Hollow body', 'Controlled press'],
      },
    ],
  },

  // ===== COMPRESSION PROGRESSION =====
  {
    id: 'compression',
    name: 'Compression / V-Sit',
    description: 'Hip flexor and compression strength progression',
    skill: 'v_sit',
    steps: [
      {
        exerciseId: 'seated_leg_lift',
        level: 1,
        prerequisiteReps: 15,
        cues: ['Straight legs', 'Point toes', 'Lean back slightly'],
      },
      {
        exerciseId: 'compression_work',
        level: 2,
        prerequisiteReps: 12,
        cues: ['Pike position', 'Pull legs to chest', 'Active compression'],
      },
      {
        exerciseId: 'tuck_l_sit',
        level: 3,
        prerequisiteHoldTime: '15s',
        cues: ['Knees to chest', 'Straight arms', 'Push floor away'],
      },
      {
        exerciseId: 'l_sit_skill',
        level: 4,
        prerequisiteHoldTime: '12s',
        cues: ['Legs parallel', 'Point toes', 'Depress shoulders'],
      },
      {
        exerciseId: 'straddle_compression_lift',
        level: 5,
        prerequisiteReps: 10,
        cues: ['Wide straddle', 'Active lift', 'Maximum compression'],
      },
      {
        exerciseId: 'v_sit_progression',
        level: 6,
        prerequisiteHoldTime: '8s',
        cues: ['Legs above horizontal', 'Strong pike', 'Balance point'],
      },
      {
        exerciseId: 'v_sit_hold',
        level: 7,
        prerequisiteHoldTime: '5s',
        cues: ['Full V position', 'Maximum height', 'Point toes'],
      },
    ],
  },

  // ===== CORE PROGRESSION =====
  {
    id: 'core_strength',
    name: 'Core Strength',
    description: 'Core stability and anti-extension progression',
    skill: 'front_lever', // Transfers to front lever
    steps: [
      {
        exerciseId: 'hollow_body',
        level: 1,
        prerequisiteHoldTime: '30s',
        cues: ['Lower back flat', 'Arms overhead', 'Tuck chin'],
      },
      {
        exerciseId: 'hollow_body_rock',
        level: 2,
        prerequisiteReps: 20,
        cues: ['Maintain hollow', 'Rock without breaking', 'Controlled'],
      },
      {
        exerciseId: 'hanging_knee_raise',
        level: 3,
        prerequisiteReps: 15,
        cues: ['No swing', 'Curl pelvis', 'Slow descent'],
      },
      {
        exerciseId: 'hanging_leg_raise',
        level: 4,
        prerequisiteReps: 10,
        cues: ['Straight legs', 'Full ROM', 'Control'],
      },
      {
        exerciseId: 'toes_to_bar',
        level: 5,
        prerequisiteReps: 8,
        cues: ['Touch toes to bar', 'No kip', 'Compression'],
      },
      {
        exerciseId: 'dragon_flag_neg',
        level: 6,
        prerequisiteReps: 5,
        cues: ['Slow descent', 'Body straight', 'Fight gravity'],
      },
      {
        exerciseId: 'dragon_flag',
        level: 7,
        prerequisiteReps: 4,
        cues: ['Full concentric', 'Body line', 'Max tension'],
      },
    ],
  },

  // ===== PULL STRENGTH PROGRESSION =====
  {
    id: 'pull_strength',
    name: 'Pull Strength',
    description: 'Vertical pulling strength progression',
    skill: 'front_lever',
    steps: [
      {
        exerciseId: 'bodyweight_row',
        level: 1,
        prerequisiteReps: 12,
        cues: ['Full ROM', 'Body straight', 'Squeeze back'],
      },
      {
        exerciseId: 'pull_up',
        level: 2,
        prerequisiteReps: 10,
        cues: ['Dead hang start', 'Chin over bar', 'Control descent'],
      },
      {
        exerciseId: 'chin_up',
        level: 3,
        prerequisiteReps: 10,
        cues: ['Supinated grip', 'Full ROM', 'Bicep emphasis'],
      },
      {
        exerciseId: 'chest_to_bar_pull_up',
        level: 4,
        prerequisiteReps: 6,
        cues: ['Touch chest', 'Lean back', 'Full pull'],
      },
      {
        exerciseId: 'archer_pull_up',
        level: 5,
        prerequisiteReps: 5,
        cues: ['Assist arm straight', 'Unilateral pull', 'Control'],
      },
      {
        exerciseId: 'weighted_pull_up',
        level: 6,
        prerequisiteReps: 5,
        cues: ['Add weight', 'Maintain form', 'Progressive overload'],
      },
    ],
  },

  // ===== PUSH STRENGTH PROGRESSION =====
  {
    id: 'push_strength',
    name: 'Push Strength',
    description: 'Horizontal and vertical pushing progression',
    skill: 'planche',
    steps: [
      {
        exerciseId: 'push_up',
        level: 1,
        prerequisiteReps: 20,
        cues: ['Full ROM', 'Body straight', 'Elbows 45°'],
      },
      {
        exerciseId: 'diamond_pushup',
        level: 2,
        prerequisiteReps: 15,
        cues: ['Hands close', 'Elbows in', 'Tricep focus'],
      },
      {
        exerciseId: 'dip',
        level: 3,
        prerequisiteReps: 12,
        cues: ['Full depth', 'Lean forward', 'Control'],
      },
      {
        exerciseId: 'ring_push_up',
        level: 4,
        prerequisiteReps: 10,
        cues: ['Turn out at top', 'Stabilize rings', 'Full ROM'],
      },
      {
        exerciseId: 'ring_dip',
        level: 5,
        prerequisiteReps: 8,
        cues: ['Turn out at top', 'Deep stretch', 'Control'],
      },
      {
        exerciseId: 'pppu',
        level: 6,
        prerequisiteReps: 8,
        cues: ['Maximum lean', 'Straight arms at top', 'Planche transfer'],
      },
      {
        exerciseId: 'weighted_dip',
        level: 7,
        prerequisiteReps: 5,
        cues: ['Add weight', 'Full ROM', 'Build strength'],
      },
    ],
  },

  // ===== FLEXIBILITY PROGRESSIONS =====

  // ===== PANCAKE PROGRESSION =====
  {
    id: 'pancake',
    name: 'Pancake',
    description: 'Forward fold with legs wide - essential for compression and straddle skills',
    skill: 'pancake',
    steps: [
      {
        exerciseId: 'seated_straddle_fold',
        level: 1,
        prerequisiteHoldTime: '30s',
        cues: ['Sit tall', 'Legs wide', 'Hinge from hips'],
      },
      {
        exerciseId: 'seated_pancake_hold',
        level: 2,
        prerequisiteHoldTime: '30s',
        cues: ['Use props if needed', 'Walk hands forward', 'Breathe deeply'],
      },
      {
        exerciseId: 'active_pancake_pulses',
        level: 3,
        prerequisiteReps: 15,
        cues: ['Engage hip flexors', 'Small controlled pulses', 'Maintain form'],
      },
      {
        exerciseId: 'pancake_side_reaches',
        level: 4,
        prerequisiteHoldTime: '30s',
        cues: ['Reach to each foot', 'Keep other hip down', 'Rotate torso'],
      },
      {
        exerciseId: 'compression_pancake',
        level: 5,
        prerequisiteHoldTime: '20s',
        cues: ['Chest toward floor', 'Active compression', 'Control throughout'],
      },
    ],
  },

  // ===== TOE TOUCH PROGRESSION =====
  {
    id: 'toe_touch',
    name: 'Toe Touch',
    description: 'Standing forward fold - foundation for pike compression',
    skill: 'toe_touch',
    steps: [
      {
        exerciseId: 'standing_toe_touch',
        level: 1,
        prerequisiteHoldTime: '30s',
        cues: ['Soft knees initially', 'Hang relaxed', 'Let gravity help'],
      },
      {
        exerciseId: 'standing_forward_fold',
        level: 2,
        prerequisiteHoldTime: '30s',
        cues: ['Straighten knees', 'Relax neck', 'Breathe into stretch'],
      },
      {
        exerciseId: 'hamstring_fold',
        level: 3,
        prerequisiteHoldTime: '30s',
        cues: ['One leg at a time', 'Hinge at hips', 'Keep back flat'],
      },
      {
        exerciseId: 'seated_pike_fold',
        level: 4,
        prerequisiteHoldTime: '30s',
        cues: ['Legs together', 'Reach for toes', 'Chest toward thighs'],
      },
      {
        exerciseId: 'deep_pike_fold',
        level: 5,
        prerequisiteHoldTime: '20s',
        cues: ['Maximum compression', 'Pull chest to thighs', 'Straight legs'],
      },
    ],
  },

  // ===== FRONT SPLITS PROGRESSION =====
  {
    id: 'front_splits',
    name: 'Front Splits',
    description: 'Full leg split front-to-back - hip flexor and hamstring mobility',
    skill: 'front_splits',
    steps: [
      {
        exerciseId: 'runners_lunge',
        level: 1,
        prerequisiteHoldTime: '30s',
        cues: ['Back knee down', 'Sink hips forward', 'Keep torso upright'],
      },
      {
        exerciseId: 'half_splits',
        level: 2,
        prerequisiteHoldTime: '30s',
        cues: ['Front leg straight', 'Hinge forward', 'Square hips'],
      },
      {
        exerciseId: 'front_split_prep',
        level: 3,
        prerequisiteHoldTime: '30s',
        cues: ['Use blocks for support', 'Slide feet apart', 'Control descent'],
      },
      {
        exerciseId: 'pigeon_pose',
        level: 4,
        prerequisiteHoldTime: '45s',
        cues: ['Open hip', 'Front shin angled', 'Relax into stretch'],
      },
      {
        exerciseId: 'full_front_split',
        level: 5,
        prerequisiteHoldTime: '20s',
        cues: ['Both legs straight', 'Hips square', 'Control throughout'],
      },
    ],
  },

  // ===== SIDE SPLITS PROGRESSION =====
  {
    id: 'side_splits',
    name: 'Side Splits',
    description: 'Full leg split side-to-side - essential for straddle skills',
    skill: 'side_splits',
    steps: [
      {
        exerciseId: 'horse_stance_hold',
        level: 1,
        prerequisiteHoldTime: '30s',
        cues: ['Wide stance', 'Sink low', 'Chest up'],
      },
      {
        exerciseId: 'frog_pose',
        level: 2,
        prerequisiteHoldTime: '45s',
        cues: ['Knees wide', 'Rock gently', 'Relax groin'],
      },
      {
        exerciseId: 'cossack_hold',
        level: 3,
        prerequisiteHoldTime: '30s',
        cues: ['Side lunge', 'Straight leg pointed up', 'Deep stretch'],
      },
      {
        exerciseId: 'side_split_prep',
        level: 4,
        prerequisiteHoldTime: '30s',
        cues: ['Use blocks', 'Slide out gradually', 'Control descent'],
      },
      {
        exerciseId: 'full_side_split',
        level: 5,
        prerequisiteHoldTime: '20s',
        cues: ['Toes pointing up', 'Hips forward', 'Control throughout'],
      },
    ],
  },
]

// =============================================================================
// SUBSTITUTION MAPPINGS - Movement pattern compatible exercises
// =============================================================================

export const SUBSTITUTION_MAPPINGS: SubstitutionMapping[] = [
  // ===== VERTICAL PULL SUBSTITUTIONS =====
  {
    exerciseId: 'weighted_pull_up',
    substitutes: [
      { exerciseId: 'pull_up', suitability: 'ideal', reason: 'Same pattern, reduced load', fatigueAdjustment: 'easier' },
      { exerciseId: 'chin_up', suitability: 'good', reason: 'Similar pattern, bicep emphasis', fatigueAdjustment: 'similar' },
      { exerciseId: 'bodyweight_row', suitability: 'acceptable', reason: 'Horizontal pull alternative', fatigueAdjustment: 'easier' },
    ],
  },
  {
    exerciseId: 'archer_pull_up',
    substitutes: [
      { exerciseId: 'chest_to_bar_pull_up', suitability: 'ideal', reason: 'High pull alternative', fatigueAdjustment: 'similar' },
      { exerciseId: 'pull_up', suitability: 'good', reason: 'Bilateral regression', fatigueAdjustment: 'easier' },
      { exerciseId: 'typewriter_pull_up', suitability: 'good', reason: 'Similar unilateral pattern', fatigueAdjustment: 'similar' },
    ],
  },
  {
    exerciseId: 'tuck_front_lever_pull',
    substitutes: [
      { exerciseId: 'ring_row_elevated', suitability: 'ideal', reason: 'Horizontal pull, easier', fatigueAdjustment: 'easier' },
      { exerciseId: 'bodyweight_row', suitability: 'good', reason: 'Basic horizontal pull', fatigueAdjustment: 'easier' },
      { exerciseId: 'ring_row', suitability: 'good', reason: 'Ring instability training', fatigueAdjustment: 'easier' },
    ],
  },

  // ===== HORIZONTAL PULL SUBSTITUTIONS =====
  {
    exerciseId: 'ring_row_elevated',
    substitutes: [
      { exerciseId: 'bodyweight_row', suitability: 'ideal', reason: 'Same pattern, feet down', fatigueAdjustment: 'easier' },
      { exerciseId: 'ring_row', suitability: 'good', reason: 'Ring stability variant', fatigueAdjustment: 'similar' },
    ],
  },

  // ===== VERTICAL PUSH SUBSTITUTIONS =====
  {
    exerciseId: 'weighted_dip',
    substitutes: [
      { exerciseId: 'dip', suitability: 'ideal', reason: 'Same pattern, bodyweight', fatigueAdjustment: 'easier' },
      { exerciseId: 'ring_dip', suitability: 'good', reason: 'Unstable variant', fatigueAdjustment: 'similar' },
      { exerciseId: 'straight_bar_dip', suitability: 'acceptable', reason: 'Bar variant', fatigueAdjustment: 'similar' },
    ],
  },
  {
    exerciseId: 'ring_dip',
    substitutes: [
      { exerciseId: 'dip', suitability: 'ideal', reason: 'Stable dip alternative', fatigueAdjustment: 'easier' },
      { exerciseId: 'push_up', suitability: 'acceptable', reason: 'Push pattern regression', fatigueAdjustment: 'easier' },
    ],
  },
  {
    exerciseId: 'wall_hspu',
    substitutes: [
      { exerciseId: 'wall_hspu_negative', suitability: 'ideal', reason: 'Eccentric focus', fatigueAdjustment: 'easier' },
      { exerciseId: 'pike_pushup_elevated', suitability: 'good', reason: 'Similar angle', fatigueAdjustment: 'easier' },
      { exerciseId: 'pike_pushup', suitability: 'acceptable', reason: 'Basic vertical push', fatigueAdjustment: 'easier' },
    ],
  },

  // ===== HORIZONTAL PUSH SUBSTITUTIONS =====
  {
    exerciseId: 'pppu',
    substitutes: [
      { exerciseId: 'ring_push_up', suitability: 'ideal', reason: 'Instability + push', fatigueAdjustment: 'similar' },
      { exerciseId: 'archer_push_up', suitability: 'good', reason: 'Unilateral progression', fatigueAdjustment: 'similar' },
      { exerciseId: 'diamond_pushup', suitability: 'acceptable', reason: 'Tricep emphasis', fatigueAdjustment: 'easier' },
    ],
  },
  {
    exerciseId: 'planche_lean_pushup',
    substitutes: [
      { exerciseId: 'pppu', suitability: 'ideal', reason: 'Less lean angle', fatigueAdjustment: 'easier' },
      { exerciseId: 'ring_push_up', suitability: 'good', reason: 'Push + stability', fatigueAdjustment: 'easier' },
    ],
  },

  // ===== SKILL SUBSTITUTIONS =====
  {
    exerciseId: 'tuck_fl',
    substitutes: [
      { exerciseId: 'banded_fl_hold', suitability: 'ideal', reason: 'Band assisted full position', fatigueAdjustment: 'easier' },
      { exerciseId: 'tuck_front_lever_pull', suitability: 'good', reason: 'Dynamic pulling', fatigueAdjustment: 'similar' },
    ],
  },
  {
    exerciseId: 'tuck_planche',
    substitutes: [
      { exerciseId: 'banded_planche_hold', suitability: 'ideal', reason: 'Band assisted position', fatigueAdjustment: 'easier' },
      { exerciseId: 'planche_lean', suitability: 'good', reason: 'Lean work', fatigueAdjustment: 'easier' },
    ],
  },
  {
    exerciseId: 'strict_muscle_up',
    substitutes: [
      { exerciseId: 'muscle_up_negative', suitability: 'ideal', reason: 'Eccentric pattern', fatigueAdjustment: 'easier' },
      { exerciseId: 'muscle_up_transition_drill', suitability: 'good', reason: 'Transition practice', fatigueAdjustment: 'easier' },
      { exerciseId: 'high_pulls', suitability: 'acceptable', reason: 'Pull component', fatigueAdjustment: 'easier' },
    ],
  },

  // ===== COMPRESSION SUBSTITUTIONS =====
  {
    exerciseId: 'l_sit_skill',
    substitutes: [
      { exerciseId: 'tuck_l_sit', suitability: 'ideal', reason: 'Tucked regression', fatigueAdjustment: 'easier' },
      { exerciseId: 'single_leg_l_sit', suitability: 'good', reason: 'One leg extended', fatigueAdjustment: 'easier' },
      { exerciseId: 'compression_work', suitability: 'acceptable', reason: 'Active compression', fatigueAdjustment: 'easier' },
    ],
  },
  {
    exerciseId: 'v_sit_hold',
    substitutes: [
      { exerciseId: 'v_sit_progression', suitability: 'ideal', reason: 'Partial V-sit', fatigueAdjustment: 'easier' },
      { exerciseId: 'advanced_l_sit', suitability: 'good', reason: 'High L-sit', fatigueAdjustment: 'easier' },
      { exerciseId: 'l_sit_skill', suitability: 'acceptable', reason: 'L-sit baseline', fatigueAdjustment: 'easier' },
    ],
  },

  // ===== CORE SUBSTITUTIONS =====
  {
    exerciseId: 'dragon_flag',
    substitutes: [
      { exerciseId: 'dragon_flag_neg', suitability: 'ideal', reason: 'Eccentric focus', fatigueAdjustment: 'easier' },
      { exerciseId: 'hanging_leg_raise', suitability: 'good', reason: 'Hanging core', fatigueAdjustment: 'easier' },
    ],
  },
  {
    exerciseId: 'toes_to_bar',
    substitutes: [
      { exerciseId: 'hanging_leg_raise', suitability: 'ideal', reason: 'Straight leg hang', fatigueAdjustment: 'easier' },
      { exerciseId: 'hanging_knee_raise', suitability: 'good', reason: 'Bent knee variant', fatigueAdjustment: 'easier' },
    ],
  },
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the progression ladder for a specific exercise
 */
export function getExerciseLadder(exerciseId: string): ProgressionResult | null {
  for (const ladder of PROGRESSION_LADDERS) {
    const stepIndex = ladder.steps.findIndex(s => s.exerciseId === exerciseId)
    if (stepIndex !== -1) {
      const currentStep = ladder.steps[stepIndex]
      const nextStep = ladder.steps[stepIndex + 1]
      const previousStep = ladder.steps[stepIndex - 1]
      const percentComplete = ((stepIndex + 1) / ladder.steps.length) * 100

      return {
        currentStep,
        nextStep,
        previousStep,
        percentComplete,
        ladderId: ladder.id,
        ladderName: ladder.name,
      }
    }
  }
  return null
}

/**
 * Get the next progression for an exercise
 */
export function getProgressionUp(exerciseId: string): string | null {
  const ladder = getExerciseLadder(exerciseId)
  return ladder?.nextStep?.exerciseId || null
}

/**
 * Get the regression (easier) version of an exercise
 */
export function getProgressionDown(exerciseId: string): string | null {
  const ladder = getExerciseLadder(exerciseId)
  return ladder?.previousStep?.exerciseId || null
}

/**
 * Get substitution options for an exercise
 */
export function getSubstitutes(exerciseId: string): SubstituteOption[] {
  const mapping = SUBSTITUTION_MAPPINGS.find(m => m.exerciseId === exerciseId)
  return mapping?.substitutes || []
}

/**
 * Get the best substitute for an exercise based on desired fatigue level
 */
export function getBestSubstitute(
  exerciseId: string,
  preferredFatigue: 'easier' | 'similar' | 'harder' = 'similar'
): SubstituteOption | null {
  const subs = getSubstitutes(exerciseId)
  if (subs.length === 0) return null

  // First try to match fatigue preference
  const preferred = subs.find(s => s.fatigueAdjustment === preferredFatigue && s.suitability === 'ideal')
  if (preferred) return preferred

  // Fall back to ideal suitability
  const ideal = subs.find(s => s.suitability === 'ideal')
  if (ideal) return ideal

  // Fall back to good suitability
  const good = subs.find(s => s.suitability === 'good')
  if (good) return good

  // Return first available
  return subs[0]
}

/**
 * Check if athlete is ready to progress based on performance
 */
export function isReadyToProgress(
  exerciseId: string,
  currentHoldTime?: number,
  currentReps?: number
): boolean {
  const ladder = getExerciseLadder(exerciseId)
  if (!ladder || !ladder.nextStep) return false

  const currentStep = ladder.currentStep

  // Check hold time requirement
  if (currentStep.prerequisiteHoldTime && currentHoldTime) {
    const requiredSeconds = parseHoldTime(currentStep.prerequisiteHoldTime)
    if (currentHoldTime >= requiredSeconds) return true
  }

  // Check rep requirement
  if (currentStep.prerequisiteReps && currentReps) {
    if (currentReps >= currentStep.prerequisiteReps) return true
  }

  return false
}

/**
 * Get recommended exercise based on athlete level and fatigue
 */
export function getAdaptedExercise(
  exerciseId: string,
  athleteLevel: DifficultyLevel,
  fatigueLevel: 'low' | 'moderate' | 'high'
): string {
  const allExercises = getAllExercises()
  const exercise = allExercises.find(e => e.id === exerciseId)
  if (!exercise) return exerciseId

  // High fatigue - prefer regression
  if (fatigueLevel === 'high') {
    const regression = getProgressionDown(exerciseId)
    if (regression) return regression

    // Try substitution with easier fatigue
    const sub = getBestSubstitute(exerciseId, 'easier')
    if (sub) return sub.exerciseId

    return exerciseId
  }

  // Check if exercise matches athlete level
  const exerciseLevel = exercise.difficultyLevel || 'intermediate'
  const levelOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'elite']
  const athleteLevelIndex = levelOrder.indexOf(athleteLevel)
  const exerciseLevelIndex = levelOrder.indexOf(exerciseLevel)

  // If exercise is too hard for athlete, regress
  if (exerciseLevelIndex > athleteLevelIndex) {
    const regression = getProgressionDown(exerciseId)
    if (regression) return regression

    const sub = getBestSubstitute(exerciseId, 'easier')
    if (sub) return sub.exerciseId
  }

  // If exercise is too easy, consider progression (only for low fatigue)
  if (exerciseLevelIndex < athleteLevelIndex - 1 && fatigueLevel === 'low') {
    const progression = getProgressionUp(exerciseId)
    if (progression) return progression
  }

  return exerciseId
}

/**
 * Get all exercises in a specific ladder
 */
export function getLadderExercises(ladderId: string): ProgressionStep[] {
  const ladder = PROGRESSION_LADDERS.find(l => l.id === ladderId)
  return ladder?.steps || []
}

/**
 * Get ladder progress for an athlete (used for skill tracking)
 */
export function getLadderProgress(
  ladderId: string,
  currentExerciseId: string
): { level: number; total: number; percentComplete: number } | null {
  const ladder = PROGRESSION_LADDERS.find(l => l.id === ladderId)
  if (!ladder) return null

  const stepIndex = ladder.steps.findIndex(s => s.exerciseId === currentExerciseId)
  if (stepIndex === -1) return null

  return {
    level: stepIndex + 1,
    total: ladder.steps.length,
    percentComplete: ((stepIndex + 1) / ladder.steps.length) * 100,
  }
}

/**
 * Find the appropriate starting exercise for an athlete in a ladder
 */
export function findStartingExercise(
  ladderId: string,
  athleteLevel: DifficultyLevel
): ProgressionStep | null {
  const ladder = PROGRESSION_LADDERS.find(l => l.id === ladderId)
  if (!ladder) return null

  const allExercises = getAllExercises()
  const levelOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'elite']
  const athleteLevelIndex = levelOrder.indexOf(athleteLevel)

  // Find the highest step that matches athlete level
  for (let i = ladder.steps.length - 1; i >= 0; i--) {
    const step = ladder.steps[i]
    const exercise = allExercises.find(e => e.id === step.exerciseId)
    if (exercise) {
      const exerciseLevel = exercise.difficultyLevel || 'intermediate'
      const exerciseLevelIndex = levelOrder.indexOf(exerciseLevel)
      if (exerciseLevelIndex <= athleteLevelIndex) {
        return step
      }
    }
  }

  // Default to first step
  return ladder.steps[0]
}

/**
 * Get fatigue-appropriate regression for an exercise
 */
export function getFatigueRegression(
  exerciseId: string,
  currentFatigueCost: number
): string | null {
  // First try ladder regression
  const regression = getProgressionDown(exerciseId)
  if (regression) {
    const allExercises = getAllExercises()
    const regExercise = allExercises.find(e => e.id === regression)
    if (regExercise && regExercise.fatigueCost < currentFatigueCost) {
      return regression
    }
  }

  // Try substitution with easier fatigue
  const sub = getBestSubstitute(exerciseId, 'easier')
  if (sub) return sub.exerciseId

  return null
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseHoldTime(timeStr: string): number {
  const match = timeStr.match(/(\d+)s?/)
  return match ? parseInt(match[1], 10) : 0
}

// =============================================================================
// EXPORTS FOR PROGRAM BUILDER INTEGRATION
// =============================================================================

export {
  PROGRESSION_LADDERS,
  SUBSTITUTION_MAPPINGS,
}
