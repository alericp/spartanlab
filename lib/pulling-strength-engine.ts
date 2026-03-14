/**
 * Pulling Strength Engine
 * 
 * Comprehensive pulling progression systems including:
 * - One-Arm Pull-Up progression
 * - Weighted Pull-Up strength development
 * - Pull-Up endurance systems
 * - Pulling weak point detection
 * - Pulling exercise library
 * 
 * All principles derived from advanced calisthenics training approaches.
 * No athlete names or branded methods exposed in user-facing content.
 */

import type { ExperienceLevel } from './program-service'
import type { SkillProgressionSystem, ProgressionLevel, ReadinessRequirement, SupportExercise, MobilityPrepWork } from './comprehensive-skill-progressions'

// =============================================================================
// PULLING WEAK POINT CATEGORIES
// =============================================================================

export type PullWeakPointCategory =
  | 'overall_pulling_strength'
  | 'scapular_depression'
  | 'lockout_strength'
  | 'chest_to_bar_power'
  | 'grip_strength'
  | 'arm_asymmetry'
  | 'eccentric_control'
  | 'explosive_power'
  | 'endurance_capacity'
  | 'lat_engagement'
  | 'bicep_tendon_tolerance'

export interface PullWeakPointAssessment {
  category: PullWeakPointCategory
  score: number // 0-100
  severity: 'none' | 'minor' | 'moderate' | 'significant' | 'critical'
  recommendations: string[]
  priorityExercises: string[]
  trainingFocus: string
}

// =============================================================================
// PULLING EXERCISE LIBRARY
// =============================================================================

export interface PullingExercise {
  id: string
  name: string
  category: 'vertical_pull' | 'horizontal_pull' | 'isometric' | 'explosive' | 'unilateral' | 'weighted' | 'endurance'
  tags: ('skill' | 'strength' | 'hypertrophy' | 'endurance' | 'grip' | 'transition' | 'unilateral' | 'eccentric' | 'isometric' | 'explosive')[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  primaryMuscles: string[]
  equipmentRequired: ('pull_up_bar' | 'rings' | 'resistance_band' | 'weight_belt' | 'dumbbells' | 'cable')[]
  description: string
  techniqueCues: string[]
  commonMistakes: string[]
  setsRepsGuidelines: {
    strength: string
    hypertrophy: string
    endurance: string
  }
  progressionFrom?: string
  progressionTo?: string
  supportsSkills: string[]
}

export const PULLING_EXERCISE_LIBRARY: Record<string, PullingExercise> = {
  // ==========================================================================
  // FOUNDATIONAL PULLING EXERCISES
  // ==========================================================================
  
  dead_hang: {
    id: 'dead_hang',
    name: 'Dead Hang',
    category: 'isometric',
    tags: ['grip', 'endurance'],
    difficulty: 'beginner',
    primaryMuscles: ['forearms', 'lats', 'shoulders'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Passive hang from bar with fully relaxed shoulders',
    techniqueCues: ['Relax shoulders completely', 'Full arm extension', 'Breathe deeply'],
    commonMistakes: ['Shrugging shoulders', 'Bending elbows', 'Holding breath'],
    setsRepsGuidelines: {
      strength: '3-4 x max hold',
      hypertrophy: 'N/A',
      endurance: '3-5 x 30-60s',
    },
    progressionTo: 'active_hang',
    supportsSkills: ['pull_up', 'muscle_up', 'front_lever'],
  },
  
  active_hang: {
    id: 'active_hang',
    name: 'Active Hang',
    category: 'isometric',
    tags: ['strength', 'skill'],
    difficulty: 'beginner',
    primaryMuscles: ['lats', 'lower_traps', 'rhomboids'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Hang with engaged scapulae - depressed and slightly retracted',
    techniqueCues: ['Pull shoulders down away from ears', 'Engage lats', 'Keep arms straight', 'Posterior pelvic tilt'],
    commonMistakes: ['Only retracting without depression', 'Bending elbows', 'Losing engagement'],
    setsRepsGuidelines: {
      strength: '3-4 x 10-20s',
      hypertrophy: 'N/A',
      endurance: '4-5 x 20-30s',
    },
    progressionFrom: 'dead_hang',
    progressionTo: 'scapular_pull',
    supportsSkills: ['pull_up', 'front_lever', 'muscle_up'],
  },
  
  scapular_pull: {
    id: 'scapular_pull',
    name: 'Scapular Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'skill'],
    difficulty: 'beginner',
    primaryMuscles: ['lats', 'lower_traps', 'rhomboids'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull body up using only scapular depression - no arm bend',
    techniqueCues: ['Start from dead hang', 'Depress scapulae forcefully', 'Rise 2-3 inches', 'Control the negative'],
    commonMistakes: ['Bending elbows', 'Insufficient range', 'Using momentum'],
    setsRepsGuidelines: {
      strength: '3-4 x 8-12',
      hypertrophy: '3-4 x 12-15',
      endurance: '3 x 15-20',
    },
    progressionFrom: 'active_hang',
    progressionTo: 'pull_up',
    supportsSkills: ['pull_up', 'front_lever', 'muscle_up'],
  },

  // ==========================================================================
  // STANDARD PULL-UP VARIATIONS
  // ==========================================================================
  
  assisted_pull_up: {
    id: 'assisted_pull_up',
    name: 'Assisted Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'skill'],
    difficulty: 'beginner',
    primaryMuscles: ['lats', 'biceps', 'rhomboids', 'lower_traps'],
    equipmentRequired: ['pull_up_bar', 'resistance_band'],
    description: 'Pull-up with band or machine assistance to reduce bodyweight load',
    techniqueCues: ['Full range of motion', 'Control both phases', 'Chin clears bar', 'Depress scapulae at top'],
    commonMistakes: ['Kipping or swinging', 'Partial range', 'Too much assistance'],
    setsRepsGuidelines: {
      strength: '4-5 x 6-8',
      hypertrophy: '3-4 x 10-12',
      endurance: '3-4 x 12-15',
    },
    progressionTo: 'pull_up',
    supportsSkills: ['pull_up', 'muscle_up'],
  },
  
  pull_up_negative: {
    id: 'pull_up_negative',
    name: 'Pull-Up Negative',
    category: 'vertical_pull',
    tags: ['strength', 'eccentric'],
    difficulty: 'beginner',
    primaryMuscles: ['lats', 'biceps', 'rhomboids'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Jump or step to top position and lower slowly with control',
    techniqueCues: ['Start at top position', '3-5 second descent', 'Control throughout', 'Reset cleanly between reps'],
    commonMistakes: ['Dropping too fast', 'Inconsistent tempo', 'Not reaching full extension at bottom'],
    setsRepsGuidelines: {
      strength: '4-5 x 3-5 (5s negatives)',
      hypertrophy: '3-4 x 6-8 (3s negatives)',
      endurance: '3 x 8-10 (3s negatives)',
    },
    progressionTo: 'pull_up',
    supportsSkills: ['pull_up', 'muscle_up', 'one_arm_pull_up'],
  },
  
  pull_up: {
    id: 'pull_up',
    name: 'Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'skill'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'rhomboids', 'lower_traps', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Standard vertical pull from dead hang to chin over bar',
    techniqueCues: ['Start from dead hang', 'Initiate with scapular depression', 'Pull elbows down and back', 'Chin clears bar', 'Control descent'],
    commonMistakes: ['Kipping', 'Partial range', 'Shrugging at top', 'Chicken neck'],
    setsRepsGuidelines: {
      strength: '4-5 x 5-8',
      hypertrophy: '3-4 x 8-12',
      endurance: '3-4 x 12-20',
    },
    progressionFrom: 'assisted_pull_up',
    progressionTo: 'weighted_pull_up',
    supportsSkills: ['muscle_up', 'front_lever', 'one_arm_pull_up'],
  },
  
  chin_up: {
    id: 'chin_up',
    name: 'Chin-Up',
    category: 'vertical_pull',
    tags: ['strength', 'hypertrophy'],
    difficulty: 'intermediate',
    primaryMuscles: ['biceps', 'lats', 'brachialis'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up with supinated (palms facing) grip emphasizing biceps',
    techniqueCues: ['Supinated grip shoulder-width', 'Full range of motion', 'Control both phases', 'Keep elbows close'],
    commonMistakes: ['Excessive swinging', 'Partial range', 'Flaring elbows'],
    setsRepsGuidelines: {
      strength: '4-5 x 5-8',
      hypertrophy: '3-4 x 8-12',
      endurance: '3-4 x 12-15',
    },
    progressionTo: 'weighted_chin_up',
    supportsSkills: ['muscle_up', 'one_arm_pull_up'],
  },
  
  neutral_grip_pull_up: {
    id: 'neutral_grip_pull_up',
    name: 'Neutral Grip Pull-Up',
    category: 'vertical_pull',
    tags: ['strength'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'brachialis', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up with palms facing each other - joint-friendly variation',
    techniqueCues: ['Palms face each other', 'Full extension at bottom', 'Pull to upper chest', 'Control negative'],
    commonMistakes: ['Shortened range', 'Excessive momentum'],
    setsRepsGuidelines: {
      strength: '4-5 x 5-8',
      hypertrophy: '3-4 x 8-12',
      endurance: '3-4 x 12-15',
    },
    supportsSkills: ['muscle_up', 'one_arm_pull_up'],
  },

  // ==========================================================================
  // WEIGHTED PULLING EXERCISES
  // ==========================================================================
  
  weighted_pull_up: {
    id: 'weighted_pull_up',
    name: 'Weighted Pull-Up',
    category: 'weighted',
    tags: ['strength', 'hypertrophy'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'rhomboids', 'lower_traps', 'forearms'],
    equipmentRequired: ['pull_up_bar', 'weight_belt'],
    description: 'Pull-up with additional external load for strength development',
    techniqueCues: ['Secure weight properly', 'Control the added mass', 'Full range maintained', 'No kipping', 'Longer rest between sets'],
    commonMistakes: ['Too much weight too soon', 'Shortened range', 'Excessive swing from weight'],
    setsRepsGuidelines: {
      strength: '4-6 x 3-5',
      hypertrophy: '3-4 x 6-10',
      endurance: '3 x 10-12 (light weight)',
    },
    progressionFrom: 'pull_up',
    supportsSkills: ['front_lever', 'one_arm_pull_up', 'muscle_up'],
  },
  
  weighted_chin_up: {
    id: 'weighted_chin_up',
    name: 'Weighted Chin-Up',
    category: 'weighted',
    tags: ['strength', 'hypertrophy'],
    difficulty: 'intermediate',
    primaryMuscles: ['biceps', 'lats', 'brachialis'],
    equipmentRequired: ['pull_up_bar', 'weight_belt'],
    description: 'Chin-up with additional external load for bicep and pulling strength',
    techniqueCues: ['Supinated grip', 'Full range of motion', 'Control the weight', 'Elbows stay close'],
    commonMistakes: ['Excessive weight', 'Partial reps', 'Elbow flare'],
    setsRepsGuidelines: {
      strength: '4-6 x 3-5',
      hypertrophy: '3-4 x 6-10',
      endurance: '3 x 10-12',
    },
    progressionFrom: 'chin_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  weighted_neutral_pull_up: {
    id: 'weighted_neutral_pull_up',
    name: 'Weighted Neutral Grip Pull-Up',
    category: 'weighted',
    tags: ['strength'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'brachialis', 'forearms'],
    equipmentRequired: ['pull_up_bar', 'weight_belt'],
    description: 'Neutral grip pull-up with additional load - joint-friendly weighted option',
    techniqueCues: ['Neutral grip position', 'Full range maintained', 'Control throughout', 'Appropriate loading'],
    commonMistakes: ['Excessive weight', 'Shortened range'],
    setsRepsGuidelines: {
      strength: '4-6 x 3-5',
      hypertrophy: '3-4 x 6-10',
      endurance: '3 x 10-12',
    },
    supportsSkills: ['one_arm_pull_up'],
  },

  // ==========================================================================
  // UNILATERAL / ONE-ARM PULL-UP PROGRESSIONS
  // ==========================================================================
  
  archer_pull_up: {
    id: 'archer_pull_up',
    name: 'Archer Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral', 'skill'],
    difficulty: 'advanced',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'core'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Wide grip pull-up pulling to one side while keeping other arm straight',
    techniqueCues: ['Wide grip', 'Pull to one side', 'Assisting arm stays straight', 'Alternate sides', 'Full range'],
    commonMistakes: ['Bending assisting arm', 'Insufficient pull height', 'Swinging'],
    setsRepsGuidelines: {
      strength: '4-5 x 3-5 each side',
      hypertrophy: '3-4 x 6-8 each side',
      endurance: '3 x 8-10 each side',
    },
    progressionFrom: 'pull_up',
    progressionTo: 'typewriter_pull_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  typewriter_pull_up: {
    id: 'typewriter_pull_up',
    name: 'Typewriter Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral', 'skill'],
    difficulty: 'advanced',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'core'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull to top position then traverse side to side while maintaining height',
    techniqueCues: ['Pull up first', 'Traverse across bar', 'Keep chin above bar', 'Control the traverse', 'Both directions'],
    commonMistakes: ['Dropping during traverse', 'Rushing movement', 'Incomplete traverse'],
    setsRepsGuidelines: {
      strength: '3-4 x 3-4 each direction',
      hypertrophy: '3 x 5-6 each direction',
      endurance: '3 x 8-10 total',
    },
    progressionFrom: 'archer_pull_up',
    progressionTo: 'one_arm_assisted_pull_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  uneven_pull_up: {
    id: 'uneven_pull_up',
    name: 'Uneven Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral'],
    difficulty: 'advanced',
    primaryMuscles: ['lats', 'biceps', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up with one hand lower (on towel/strap) to create uneven loading',
    techniqueCues: ['One hand on bar, one on towel/strap', 'Lower hand assists less', 'Pull primarily with upper hand', 'Switch sides'],
    commonMistakes: ['Too much towel assistance', 'Not switching sides', 'Rushed reps'],
    setsRepsGuidelines: {
      strength: '4-5 x 4-6 each side',
      hypertrophy: '3-4 x 6-8 each side',
      endurance: '3 x 8-12 each side',
    },
    progressionTo: 'one_arm_assisted_pull_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  one_arm_assisted_pull_up: {
    id: 'one_arm_assisted_pull_up',
    name: 'One-Arm Assisted Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral', 'skill'],
    difficulty: 'advanced',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'core'],
    equipmentRequired: ['pull_up_bar', 'resistance_band'],
    description: 'One-arm pull-up with band or minimal finger assistance',
    techniqueCues: ['Grip bar with one hand', 'Minimal assistance from band/fingers', 'Full range of motion', 'Control negative', 'Strong core engagement'],
    commonMistakes: ['Too much assistance', 'Rotating torso excessively', 'Partial range'],
    setsRepsGuidelines: {
      strength: '4-6 x 2-4 each arm',
      hypertrophy: '3-4 x 4-6 each arm',
      endurance: '3 x 6-8 each arm',
    },
    progressionFrom: 'typewriter_pull_up',
    progressionTo: 'one_arm_eccentric_pull_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  one_arm_eccentric_pull_up: {
    id: 'one_arm_eccentric_pull_up',
    name: 'One-Arm Eccentric Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral', 'eccentric'],
    difficulty: 'elite',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'core'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Controlled one-arm lowering from top position',
    techniqueCues: ['Jump or pull to top with both arms', 'Release to one arm', '5-8 second controlled descent', 'Resist rotation', 'Full extension at bottom'],
    commonMistakes: ['Dropping too fast', 'Excessive rotation', 'Not reaching full extension'],
    setsRepsGuidelines: {
      strength: '4-6 x 2-3 each arm (5-8s negatives)',
      hypertrophy: '3-4 x 3-4 each arm (5s negatives)',
      endurance: 'N/A',
    },
    progressionFrom: 'one_arm_assisted_pull_up',
    progressionTo: 'one_arm_pull_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  counterweight_one_arm_pull_up: {
    id: 'counterweight_one_arm_pull_up',
    name: 'Counterweight One-Arm Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral', 'skill'],
    difficulty: 'elite',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'core'],
    equipmentRequired: ['pull_up_bar', 'cable', 'dumbbells'],
    description: 'One-arm pull-up with counterweight assistance via pulley or off-hand weight',
    techniqueCues: ['Counterweight reduces effective load', 'Full one-arm pulling pattern', 'Progressively reduce counterweight', 'Maintain form'],
    commonMistakes: ['Too much counterweight', 'Rushing progression', 'Poor form'],
    setsRepsGuidelines: {
      strength: '4-6 x 2-4 each arm',
      hypertrophy: '3-4 x 4-6 each arm',
      endurance: 'N/A',
    },
    progressionTo: 'one_arm_pull_up',
    supportsSkills: ['one_arm_pull_up'],
  },
  
  one_arm_pull_up: {
    id: 'one_arm_pull_up',
    name: 'One-Arm Pull-Up',
    category: 'unilateral',
    tags: ['strength', 'unilateral', 'skill'],
    difficulty: 'elite',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'core', 'obliques'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Complete pull-up using only one arm - elite pulling skill',
    techniqueCues: ['Strong grip', 'Engage core to prevent rotation', 'Pull elbow down and back', 'Chin clears bar', 'Control descent'],
    commonMistakes: ['Excessive rotation', 'Kipping', 'Partial range'],
    setsRepsGuidelines: {
      strength: '5-6 x 1-3 each arm',
      hypertrophy: '4-5 x 3-5 each arm',
      endurance: '3-4 x 5+ each arm',
    },
    progressionFrom: 'one_arm_eccentric_pull_up',
    supportsSkills: [],
  },

  // ==========================================================================
  // EXPLOSIVE PULLING EXERCISES
  // ==========================================================================
  
  explosive_pull_up: {
    id: 'explosive_pull_up',
    name: 'Explosive Pull-Up',
    category: 'explosive',
    tags: ['strength', 'explosive', 'skill'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up with maximum explosive power - chest or higher',
    techniqueCues: ['Explosive initiation', 'Pull to chest or higher', 'Quick powerful pull', 'Control descent'],
    commonMistakes: ['Using kip instead of pull', 'Not reaching height', 'Uncontrolled negative'],
    setsRepsGuidelines: {
      strength: '4-5 x 3-5',
      hypertrophy: 'N/A',
      endurance: 'N/A',
    },
    progressionFrom: 'pull_up',
    progressionTo: 'chest_to_bar_pull_up',
    supportsSkills: ['muscle_up'],
  },
  
  chest_to_bar_pull_up: {
    id: 'chest_to_bar_pull_up',
    name: 'Chest-to-Bar Pull-Up',
    category: 'explosive',
    tags: ['strength', 'explosive', 'skill'],
    difficulty: 'advanced',
    primaryMuscles: ['lats', 'biceps', 'rhomboids', 'rear_delts'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up where chest contacts the bar at top',
    techniqueCues: ['Explosive pull', 'Drive elbows down and back', 'Chest touches bar', 'Lean back slightly at top', 'Control descent'],
    commonMistakes: ['Not reaching chest height', 'Excessive kip', 'Forward lean instead of back'],
    setsRepsGuidelines: {
      strength: '4-5 x 3-6',
      hypertrophy: '3-4 x 6-10',
      endurance: '3 x 10-12',
    },
    progressionFrom: 'explosive_pull_up',
    supportsSkills: ['muscle_up'],
  },
  
  clapping_pull_up: {
    id: 'clapping_pull_up',
    name: 'Clapping Pull-Up',
    category: 'explosive',
    tags: ['explosive', 'skill'],
    difficulty: 'elite',
    primaryMuscles: ['lats', 'biceps', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Explosive pull-up releasing bar at top to clap',
    techniqueCues: ['Maximum explosive power', 'Release at peak', 'Quick clap', 'Re-catch bar', 'Control descent'],
    commonMistakes: ['Insufficient height', 'Poor re-catch', 'Excessive fatigue attempts'],
    setsRepsGuidelines: {
      strength: '3-4 x 2-4',
      hypertrophy: 'N/A',
      endurance: 'N/A',
    },
    progressionFrom: 'chest_to_bar_pull_up',
    supportsSkills: ['muscle_up'],
  },

  // ==========================================================================
  // ISOMETRIC PULLING HOLDS
  // ==========================================================================
  
  flexed_arm_hang: {
    id: 'flexed_arm_hang',
    name: 'Flexed Arm Hang',
    category: 'isometric',
    tags: ['strength', 'isometric', 'endurance'],
    difficulty: 'beginner',
    primaryMuscles: ['biceps', 'lats', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Hold at top of pull-up position with chin above bar',
    techniqueCues: ['Chin above bar', 'Shoulders depressed', 'Elbows bent', 'Maintain position'],
    commonMistakes: ['Chin dropping below bar', 'Shrugging shoulders', 'Not engaging lats'],
    setsRepsGuidelines: {
      strength: '3-4 x max hold',
      hypertrophy: 'N/A',
      endurance: '4-5 x 20-30s',
    },
    supportsSkills: ['pull_up', 'muscle_up'],
  },
  
  lockoff_hold: {
    id: 'lockoff_hold',
    name: 'Lockoff Hold',
    category: 'isometric',
    tags: ['strength', 'isometric'],
    difficulty: 'intermediate',
    primaryMuscles: ['biceps', 'lats', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Hold at various points of pull-up range - 90 degrees, 120 degrees, etc.',
    techniqueCues: ['Choose specific angle', 'Hold with control', 'Maintain tension', 'Breathe steadily'],
    commonMistakes: ['Drifting from position', 'Holding breath', 'Poor shoulder position'],
    setsRepsGuidelines: {
      strength: '3-4 x 5-10s each position',
      hypertrophy: 'N/A',
      endurance: '3-4 x 10-20s each position',
    },
    supportsSkills: ['one_arm_pull_up', 'front_lever'],
  },

  // ==========================================================================
  // HORIZONTAL PULLING / ROWS
  // ==========================================================================
  
  inverted_row: {
    id: 'inverted_row',
    name: 'Inverted Row',
    category: 'horizontal_pull',
    tags: ['strength', 'hypertrophy'],
    difficulty: 'beginner',
    primaryMuscles: ['lats', 'rhomboids', 'rear_delts', 'biceps'],
    equipmentRequired: ['pull_up_bar', 'rings'],
    description: 'Horizontal pulling movement - body angled under bar or rings',
    techniqueCues: ['Straight body line', 'Pull chest to bar/rings', 'Squeeze shoulder blades', 'Control descent'],
    commonMistakes: ['Sagging hips', 'Pulling to stomach', 'Partial range'],
    setsRepsGuidelines: {
      strength: '4-5 x 6-10',
      hypertrophy: '3-4 x 10-15',
      endurance: '3 x 15-20',
    },
    progressionTo: 'feet_elevated_row',
    supportsSkills: ['front_lever', 'muscle_up'],
  },
  
  feet_elevated_row: {
    id: 'feet_elevated_row',
    name: 'Feet Elevated Row',
    category: 'horizontal_pull',
    tags: ['strength', 'hypertrophy'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'rhomboids', 'rear_delts', 'biceps'],
    equipmentRequired: ['pull_up_bar', 'rings'],
    description: 'Inverted row with feet elevated to increase difficulty',
    techniqueCues: ['Feet on elevated surface', 'Horizontal body position', 'Full range of motion', 'Control throughout'],
    commonMistakes: ['Dropping hips', 'Shortened range', 'Rushing reps'],
    setsRepsGuidelines: {
      strength: '4-5 x 6-10',
      hypertrophy: '3-4 x 8-12',
      endurance: '3 x 12-15',
    },
    progressionFrom: 'inverted_row',
    progressionTo: 'front_lever_row',
    supportsSkills: ['front_lever'],
  },
  
  front_lever_row: {
    id: 'front_lever_row',
    name: 'Front Lever Row',
    category: 'horizontal_pull',
    tags: ['strength', 'skill'],
    difficulty: 'elite',
    primaryMuscles: ['lats', 'rear_delts', 'core', 'rhomboids'],
    equipmentRequired: ['pull_up_bar', 'rings'],
    description: 'Row performed from front lever position - elite pulling exercise',
    techniqueCues: ['Establish front lever', 'Pull body to hands', 'Maintain lever position', 'Control extension'],
    commonMistakes: ['Losing lever position', 'Incomplete rows', 'Hips dropping'],
    setsRepsGuidelines: {
      strength: '4-5 x 3-6',
      hypertrophy: '3-4 x 5-8',
      endurance: '3 x 8-10',
    },
    progressionFrom: 'feet_elevated_row',
    supportsSkills: ['front_lever'],
  },

  // ==========================================================================
  // GRIP-FOCUSED PULLING
  // ==========================================================================
  
  towel_pull_up: {
    id: 'towel_pull_up',
    name: 'Towel Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'grip'],
    difficulty: 'intermediate',
    primaryMuscles: ['forearms', 'lats', 'biceps'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up gripping towels draped over bar for grip challenge',
    techniqueCues: ['Secure towels over bar', 'Grip towels firmly', 'Full range pull-up', 'Focus on grip endurance'],
    commonMistakes: ['Loose grip', 'Shortened range', 'Swinging'],
    setsRepsGuidelines: {
      strength: '4-5 x 4-8',
      hypertrophy: '3-4 x 6-10',
      endurance: '3 x 10-15',
    },
    supportsSkills: ['one_arm_pull_up'],
  },
  
  fat_grip_pull_up: {
    id: 'fat_grip_pull_up',
    name: 'Fat Grip Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'grip'],
    difficulty: 'intermediate',
    primaryMuscles: ['forearms', 'lats', 'biceps'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up using thick bar or fat gripz for enhanced grip challenge',
    techniqueCues: ['Thick grip challenges forearms', 'Maintain full range', 'Focus on crushing grip', 'Control descent'],
    commonMistakes: ['Gripping too tight too early', 'Shortened range'],
    setsRepsGuidelines: {
      strength: '4-5 x 4-8',
      hypertrophy: '3-4 x 6-10',
      endurance: '3 x 8-12',
    },
    supportsSkills: ['one_arm_pull_up'],
  },
  
  mixed_grip_pull_up: {
    id: 'mixed_grip_pull_up',
    name: 'Mixed Grip Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'grip'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'forearms'],
    equipmentRequired: ['pull_up_bar'],
    description: 'Pull-up with one hand pronated and one supinated',
    techniqueCues: ['One hand over, one under', 'Even pulling force', 'Full range', 'Switch grip each set'],
    commonMistakes: ['Favoring one side', 'Rotation during pull', 'Not switching'],
    setsRepsGuidelines: {
      strength: '4-5 x 5-8',
      hypertrophy: '3-4 x 8-12',
      endurance: '3 x 12-15',
    },
    supportsSkills: ['one_arm_pull_up'],
  },

  // ==========================================================================
  // RING PULLING EXERCISES
  // ==========================================================================
  
  ring_pull_up: {
    id: 'ring_pull_up',
    name: 'Ring Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'skill'],
    difficulty: 'intermediate',
    primaryMuscles: ['lats', 'biceps', 'forearms', 'stabilizers'],
    equipmentRequired: ['rings'],
    description: 'Pull-up on gymnastic rings adding instability challenge',
    techniqueCues: ['Rings can rotate freely', 'Stabilize throughout', 'Full range of motion', 'Turn rings out at top'],
    commonMistakes: ['Excessive swinging', 'Rings too close/far', 'Not controlling rotation'],
    setsRepsGuidelines: {
      strength: '4-5 x 5-8',
      hypertrophy: '3-4 x 8-12',
      endurance: '3 x 12-15',
    },
    supportsSkills: ['muscle_up', 'iron_cross'],
  },
  
  false_grip_pull_up: {
    id: 'false_grip_pull_up',
    name: 'False Grip Pull-Up',
    category: 'vertical_pull',
    tags: ['strength', 'skill', 'transition'],
    difficulty: 'advanced',
    primaryMuscles: ['forearms', 'lats', 'biceps', 'wrist_flexors'],
    equipmentRequired: ['rings'],
    description: 'Ring pull-up maintaining false grip for muscle-up preparation',
    techniqueCues: ['Wrist over ring', 'Maintain grip throughout', 'Pull high to chest', 'Train grip endurance first'],
    commonMistakes: ['Losing false grip', 'Insufficient height', 'Grip too tight'],
    setsRepsGuidelines: {
      strength: '4-5 x 3-6',
      hypertrophy: '3-4 x 5-8',
      endurance: '3 x 8-10',
    },
    supportsSkills: ['muscle_up'],
  },
}

// =============================================================================
// ONE-ARM PULL-UP PROGRESSION SYSTEM
// =============================================================================

export const ONE_ARM_PULL_UP_SYSTEM: SkillProgressionSystem = {
  skillKey: 'one_arm_pull_up',
  skillName: 'One-Arm Pull-Up',
  category: 'dynamic',
  overallDescription: 'Elite unilateral pulling skill requiring exceptional pulling strength, grip strength, and anti-rotation control.',
  
  readinessRequirements: [
    {
      id: 'pull_up_strength',
      category: 'strength',
      description: 'Strong strict pull-up base',
      minimumLevel: '15+ strict pull-ups',
      isCritical: true,
    },
    {
      id: 'weighted_pull_strength',
      category: 'strength',
      description: 'Weighted pull-up capacity',
      minimumLevel: '+50% bodyweight for 5 reps OR +75% for 1 rep',
      isCritical: true,
    },
    {
      id: 'scapular_control',
      category: 'skill',
      description: 'Strong scapular depression under load',
      minimumLevel: 'Clean active hangs for 30s+',
      isCritical: true,
    },
    {
      id: 'grip_strength',
      category: 'strength',
      description: 'Single-arm hang capacity',
      minimumLevel: '20+ second single-arm dead hang each arm',
      isCritical: true,
    },
    {
      id: 'unilateral_base',
      category: 'experience',
      description: 'Unilateral pulling experience',
      minimumLevel: '8+ archer pull-ups each side',
      isCritical: false,
    },
    {
      id: 'elbow_conditioning',
      category: 'tendon',
      description: 'Elbow/bicep tendon preparation',
      minimumLevel: '8+ weeks of progressive weighted pulling',
      isCritical: true,
    },
  ],
  
  progressionLevels: [
    {
      name: 'Archer Pull-Ups',
      description: 'Wide grip with one arm providing decreasing assistance',
      repsGoal: 8,
      minimumForAdvancement: '8+ reps each side with minimal assistance arm bend',
      techniqueCues: [
        'Wide overhand grip',
        'Pull toward one hand',
        'Assisting arm stays straight',
        'Full range of motion',
        'Control negative phase',
      ],
      commonMistakes: [
        'Bending assisting arm',
        'Not reaching full height',
        'Swinging or kipping',
        'Uneven volume between sides',
      ],
    },
    {
      name: 'Typewriter Pull-Ups',
      description: 'Traverse at top position from side to side',
      repsGoal: 6,
      minimumForAdvancement: '6+ traverses each direction',
      techniqueCues: [
        'Pull up first to top position',
        'Keep chin above bar',
        'Traverse smoothly side to side',
        'Control throughout traverse',
      ],
      commonMistakes: [
        'Dropping below bar during traverse',
        'Rushing the movement',
        'Incomplete traverse range',
      ],
    },
    {
      name: 'Assisted One-Arm Pull-Ups',
      description: 'One-arm pull with band or minimal finger assistance',
      repsGoal: 5,
      minimumForAdvancement: '5+ reps each arm with light assistance',
      techniqueCues: [
        'Single arm grip',
        'Minimal assistance from other hand/band',
        'Full range maintained',
        'Anti-rotation core engagement',
        'Progressive assistance reduction',
      ],
      commonMistakes: [
        'Too much assistance',
        'Excessive torso rotation',
        'Partial range of motion',
        'Inconsistent assistance level',
      ],
    },
    {
      name: 'One-Arm Negatives',
      description: 'Controlled one-arm lowering from top position',
      holdTimeGoal: 6,
      minimumForAdvancement: '6+ second controlled negatives each arm',
      techniqueCues: [
        'Start at top (jump or two-arm pull)',
        'Release to single arm',
        '5-8 second controlled descent',
        'Resist rotation throughout',
        'Full extension at bottom',
      ],
      commonMistakes: [
        'Dropping instead of controlling',
        'Excessive spinning/rotation',
        'Not reaching full extension',
        'Inconsistent tempo',
      ],
    },
    {
      name: 'Partial One-Arm Pull-Ups',
      description: 'One-arm pulling through reduced range',
      repsGoal: 3,
      minimumForAdvancement: '3+ reps each arm from 90-degree bent arm',
      techniqueCues: [
        'Start from bent arm position',
        'Pull to full lockoff',
        'Lower with control',
        'Gradually increase range',
      ],
      commonMistakes: [
        'Not progressively increasing range',
        'Losing control at bottom',
        'Kipping to initiate',
      ],
    },
    {
      name: 'Full One-Arm Pull-Up',
      description: 'Complete pull-up using single arm',
      repsGoal: 3,
      minimumForAdvancement: 'Achieved',
      techniqueCues: [
        'Dead hang start',
        'Initiate with scapular depression',
        'Drive elbow down and back',
        'Core prevents rotation',
        'Chin clears bar',
        'Controlled descent',
      ],
      commonMistakes: [
        'Excessive kip or momentum',
        'Partial range',
        'Uncontrolled negative',
        'Over-rotation',
      ],
    },
  ],
  
  supportExercises: [
    {
      name: 'Weighted Pull-Ups',
      purpose: 'Build pulling strength foundation',
      setsReps: '4-6 x 3-5 @ +50-75% BW',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Archer Pull-Ups',
      purpose: 'Unilateral strength development',
      setsReps: '4-5 x 4-6 each side',
      frequency: '2x per week',
      priority: 'essential',
    },
    {
      name: 'Single-Arm Dead Hang',
      purpose: 'Grip strength and shoulder stability',
      setsReps: '3-4 x max hold each arm',
      frequency: '3x per week',
      priority: 'essential',
    },
    {
      name: 'Typewriter Pull-Ups',
      purpose: 'Transition strength and control',
      setsReps: '3-4 x 4-6 each direction',
      frequency: '2x per week',
      priority: 'recommended',
    },
    {
      name: 'Lockoff Holds',
      purpose: 'Isometric strength at various angles',
      setsReps: '3-4 x 5-10s each position',
      frequency: '2x per week',
      priority: 'recommended',
    },
    {
      name: 'Core Anti-Rotation Work',
      purpose: 'Prevent rotation during one-arm pulls',
      setsReps: '3-4 x 8-12 Pallof press or similar',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
    {
      name: 'Towel/Fat Grip Pull-Ups',
      purpose: 'Enhanced grip strength',
      setsReps: '3-4 x 5-8',
      frequency: '1-2x per week',
      priority: 'optional',
    },
  ],
  
  mobilityPrepWork: [
    {
      name: 'Shoulder Circles',
      purpose: 'Shoulder joint mobility',
      duration: '30s each direction',
      frequency: 'Every session',
    },
    {
      name: 'Dead Hang with Rotation',
      purpose: 'Shoulder and thoracic mobility',
      duration: '30-60s',
      frequency: 'Every session',
    },
    {
      name: 'Wrist Circles and Stretches',
      purpose: 'Wrist preparation',
      duration: '60s total',
      frequency: 'Every session',
    },
    {
      name: 'Elbow Flexion/Extension',
      purpose: 'Elbow joint preparation',
      duration: '30s each',
      frequency: 'Every session',
    },
  ],
  
  advancementRules: {
    repsThreshold: 5,
    consistencyRequirement: '3 sessions meeting criteria',
    additionalCriteria: [
      'Clean form with no excessive swing or rotation',
      'Both arms within 1 rep of each other',
      'Full range of motion maintained',
      'Controlled negative on every rep',
    ],
  },
  
  regressionRules: {
    triggers: [
      'Pain in elbow, shoulder, or bicep',
      'Unable to complete 50% of previous session reps',
      'Significant form breakdown',
      'Excessive fatigue affecting quality',
    ],
    fallbackLevel: 'Previous progression level',
    recoveryProtocol: 'Return to weighted pull-ups and archer variations for 2-4 weeks',
  },
  
  frequencyRules: {
    optimalFrequency: 2,
    minimumFrequency: 2,
    maximumFrequency: 3,
    restBetweenSessions: 48,
    rationale: 'High neurological demand requires adequate recovery. Grip and elbow tendons need rest between sessions.',
  },
  
  sessionPlacementRules: {
    preferredPosition: 'early',
    afterWarmup: true,
    beforeStrengthWork: true,
    maxDurationMinutes: 20,
    rationale: 'One-arm pull-up work demands maximal neural output and should be performed fresh.',
  },
  
  safetyWarnings: [
    'Elbow tendon stress is significant - progress gradually',
    'Ensure adequate weighted pull-up strength before unilateral work',
    'Balance volume between arms to prevent imbalances',
    'Stop immediately if sharp elbow or shoulder pain occurs',
    'Grip failure can result in falls - use appropriate setup',
  ],
}

// =============================================================================
// WEIGHTED PULL-UP PROGRESSION SYSTEM
// =============================================================================

export interface WeightedPullUpLevel {
  name: string
  addedWeightPercent: number // % of bodyweight
  repsRange: string
  strengthStandard: string
  skillsUnlocked: string[]
}

export const WEIGHTED_PULL_UP_LEVELS: WeightedPullUpLevel[] = [
  {
    name: 'Foundation',
    addedWeightPercent: 10,
    repsRange: '5-8 reps',
    strengthStandard: 'Developing basic weighted pulling',
    skillsUnlocked: [],
  },
  {
    name: 'Developing',
    addedWeightPercent: 25,
    repsRange: '5-8 reps',
    strengthStandard: 'Solid weighted pulling base',
    skillsUnlocked: ['tuck_front_lever_potential'],
  },
  {
    name: 'Intermediate',
    addedWeightPercent: 40,
    repsRange: '5-8 reps',
    strengthStandard: 'Good weighted pulling strength',
    skillsUnlocked: ['advanced_tuck_front_lever', 'muscle_up_potential'],
  },
  {
    name: 'Advanced',
    addedWeightPercent: 60,
    repsRange: '3-5 reps',
    strengthStandard: 'Strong weighted pulling',
    skillsUnlocked: ['straddle_front_lever', 'clean_muscle_up'],
  },
  {
    name: 'Elite',
    addedWeightPercent: 80,
    repsRange: '3-5 reps',
    strengthStandard: 'Elite weighted pulling',
    skillsUnlocked: ['full_front_lever', 'one_arm_pull_up_potential'],
  },
  {
    name: 'World Class',
    addedWeightPercent: 100,
    repsRange: '1-3 reps',
    strengthStandard: 'World-class pulling strength',
    skillsUnlocked: ['one_arm_pull_up', 'front_lever_mastery'],
  },
]

export interface WeightedPullUpProgram {
  phase: 'strength' | 'hypertrophy' | 'peaking'
  durationWeeks: number
  primarySetsReps: string
  restPeriod: string
  intensityGuideline: string
  progressionRule: string
  accessoryWork: string[]
}

export const WEIGHTED_PULL_UP_PROGRAMS: WeightedPullUpProgram[] = [
  {
    phase: 'strength',
    durationWeeks: 4,
    primarySetsReps: '5-6 x 3-5 reps',
    restPeriod: '3-4 minutes',
    intensityGuideline: 'RPE 8-9, leave 1-2 reps in reserve',
    progressionRule: 'Add 2.5-5lbs when completing all sets at top of rep range',
    accessoryWork: [
      'Weighted chin-ups 3x6-8',
      'Inverted rows 3x10-12',
      'Scapular pulls 3x10',
    ],
  },
  {
    phase: 'hypertrophy',
    durationWeeks: 4,
    primarySetsReps: '4 x 6-10 reps',
    restPeriod: '2-3 minutes',
    intensityGuideline: 'RPE 7-8, moderate weight higher volume',
    progressionRule: 'Increase reps within range before adding weight',
    accessoryWork: [
      'Chin-ups 3x8-12',
      'Lat pulldown 3x10-12',
      'Bicep curls 3x10-15',
    ],
  },
  {
    phase: 'peaking',
    durationWeeks: 2,
    primarySetsReps: '6-8 x 1-3 reps',
    restPeriod: '4-5 minutes',
    intensityGuideline: 'RPE 9-10, testing new maxes',
    progressionRule: 'Progressive singles building to new 1RM',
    accessoryWork: [
      'Light pull-ups 2x5',
      'Active recovery work',
    ],
  },
]

// =============================================================================
// PULL-UP ENDURANCE SYSTEMS
// =============================================================================

export interface PullUpEnduranceProtocol {
  id: string
  name: string
  description: string
  targetGoal: 'max_reps' | 'military_test' | 'general_endurance' | 'work_capacity'
  structure: string
  setsReps: string
  restPeriod: string
  frequency: string
  progressionRule: string
  suitableFor: ExperienceLevel[]
}

export const PULL_UP_ENDURANCE_PROTOCOLS: PullUpEnduranceProtocol[] = [
  {
    id: 'ladder_protocol',
    name: 'Pull-Up Ladders',
    description: 'Ascending rep ladders building volume tolerance',
    targetGoal: 'max_reps',
    structure: '1-2-3-4-5 ladder, repeat 2-4 times',
    setsReps: '30-60 total reps per session',
    restPeriod: 'Equal to reps just completed (1 rep = 1 breath, 5 reps = 5 breaths)',
    frequency: '3-4x per week',
    progressionRule: 'Add rungs to ladder or add full ladders',
    suitableFor: ['intermediate', 'advanced'],
  },
  {
    id: 'density_blocks',
    name: 'Pull-Up Density Training',
    description: 'Maximum reps within time constraint',
    targetGoal: 'work_capacity',
    structure: '10-15 minute block, accumulate reps',
    setsReps: 'Sub-maximal sets throughout block',
    restPeriod: 'As needed, goal is total volume',
    frequency: '2-3x per week',
    progressionRule: 'Increase reps per block or reduce rest intervals',
    suitableFor: ['intermediate', 'advanced'],
  },
  {
    id: 'grease_the_groove',
    name: 'Frequent Sub-Maximal Practice',
    description: 'Multiple daily sets at sub-maximal intensity',
    targetGoal: 'max_reps',
    structure: '5-8 sets throughout day at 50-70% max',
    setsReps: 'If max is 10, do sets of 5-7',
    restPeriod: 'Hours between sets',
    frequency: '5-6 days per week',
    progressionRule: 'Gradually increase reps per set as max improves',
    suitableFor: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'max_rep_waves',
    name: 'Max Rep Wave Protocol',
    description: 'Alternating intensity waves for rep development',
    targetGoal: 'max_reps',
    structure: 'Week 1: 3x70%, Week 2: 3x80%, Week 3: 3x90%, Week 4: Test',
    setsReps: '4-5 sets at percentage of current max',
    restPeriod: '2-3 minutes',
    frequency: '2-3x per week',
    progressionRule: 'Reset percentages based on new max after test week',
    suitableFor: ['intermediate', 'advanced'],
  },
  {
    id: 'military_pt_prep',
    name: 'Military PT Test Prep',
    description: 'High-rep pull-up training for PT tests',
    targetGoal: 'military_test',
    structure: 'Pyramid up and down + max set finisher',
    setsReps: '1-2-3-4-5-4-3-2-1 + max set',
    restPeriod: '30-60 seconds',
    frequency: '3x per week',
    progressionRule: 'Extend pyramid peak or reduce rest',
    suitableFor: ['intermediate', 'advanced'],
  },
  {
    id: 'emom_endurance',
    name: 'EMOM Pull-Up Protocol',
    description: 'Every minute on the minute pull-up sets',
    targetGoal: 'general_endurance',
    structure: '10-20 minutes EMOM',
    setsReps: '5-8 reps each minute (or 50-60% max)',
    restPeriod: 'Remainder of minute',
    frequency: '2-3x per week',
    progressionRule: 'Increase reps per minute or extend duration',
    suitableFor: ['intermediate', 'advanced'],
  },
  {
    id: 'fatigue_tolerance',
    name: 'Fatigue Tolerance Training',
    description: 'High-volume accumulated fatigue work',
    targetGoal: 'general_endurance',
    structure: '100 rep challenge - complete as fast as possible',
    setsReps: '100 total reps, any set structure',
    restPeriod: 'As needed',
    frequency: '1x per week',
    progressionRule: 'Reduce completion time',
    suitableFor: ['advanced'],
  },
]

// =============================================================================
// PULL WEAK POINT DETECTION ENGINE
// =============================================================================

export interface PullProfileFactors {
  maxPullUps: number
  maxWeightedPullUp: number // % of BW added
  maxOneArmHang: number // seconds
  canDoArcherPullUps: boolean
  archerPullUpReps: number
  chestToBarCapable: boolean
  hasElbowPain: boolean
  hasGripLimitation: boolean
  armStrengthBalance: 'balanced' | 'left_dominant' | 'right_dominant'
  experienceLevel: ExperienceLevel
  primaryGoal: 'one_arm_pull_up' | 'weighted_strength' | 'max_reps' | 'front_lever' | 'muscle_up' | 'general'
}

/**
 * Analyze overall pulling strength weakness
 */
export function analyzePullStrength(factors: PullProfileFactors): PullWeakPointAssessment {
  const pullUps = factors.maxPullUps
  
  let score = 50
  let severity: PullWeakPointAssessment['severity'] = 'none'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (pullUps < 5) {
    score = 20
    severity = 'critical'
    recommendations.push('Focus on building basic pull-up capacity first')
    recommendations.push('Use assisted pull-ups and negatives')
    priorityExercises.push('assisted_pull_up', 'pull_up_negative', 'inverted_row')
  } else if (pullUps < 10) {
    score = 40
    severity = 'significant'
    recommendations.push('Build pull-up volume before weighted or unilateral work')
    priorityExercises.push('pull_up', 'chin_up', 'scapular_pull')
  } else if (pullUps < 15) {
    score = 60
    severity = 'moderate'
    recommendations.push('Continue building base while introducing weighted work')
    priorityExercises.push('pull_up', 'weighted_pull_up', 'inverted_row')
  } else if (pullUps < 20) {
    score = 75
    severity = 'minor'
    recommendations.push('Ready for advanced progressions')
    priorityExercises.push('weighted_pull_up', 'archer_pull_up')
  } else {
    score = 90
    severity = 'none'
    priorityExercises.push('weighted_pull_up', 'one_arm_assisted_pull_up')
  }
  
  return {
    category: 'overall_pulling_strength',
    score,
    severity,
    recommendations,
    priorityExercises,
    trainingFocus: severity === 'none' ? 'Advanced pulling skills' : 'Build foundational pulling strength',
  }
}

/**
 * Analyze scapular depression strength
 */
export function analyzeScapularDepression(factors: PullProfileFactors): PullWeakPointAssessment {
  // Estimate based on pull-up capacity and chest-to-bar ability
  const hasGoodScapControl = factors.chestToBarCapable && factors.maxPullUps >= 12
  
  let score = hasGoodScapControl ? 80 : 50
  let severity: PullWeakPointAssessment['severity'] = hasGoodScapControl ? 'none' : 'moderate'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (!hasGoodScapControl) {
    recommendations.push('Add scapular pull-ups to every pulling session')
    recommendations.push('Practice active hangs for scapular awareness')
    priorityExercises.push('scapular_pull', 'active_hang', 'front_lever_row')
    
    if (factors.maxPullUps < 10) {
      severity = 'significant'
      score = 35
    }
  }
  
  return {
    category: 'scapular_depression',
    score,
    severity,
    recommendations,
    priorityExercises,
    trainingFocus: 'Scapular control and depression strength',
  }
}

/**
 * Analyze grip strength for pulling
 */
export function analyzeGripStrength(factors: PullProfileFactors): PullWeakPointAssessment {
  const oneArmHang = factors.maxOneArmHang
  const hasGripIssue = factors.hasGripLimitation
  
  let score = 50
  let severity: PullWeakPointAssessment['severity'] = 'moderate'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (hasGripIssue || oneArmHang < 10) {
    score = 30
    severity = 'significant'
    recommendations.push('Grip is limiting factor - prioritize grip training')
    recommendations.push('Add dead hangs and farmer walks')
    priorityExercises.push('dead_hang', 'towel_pull_up', 'fat_grip_pull_up')
  } else if (oneArmHang < 20) {
    score = 50
    severity = 'moderate'
    recommendations.push('Continue developing grip alongside pulling')
    priorityExercises.push('dead_hang', 'active_hang', 'towel_pull_up')
  } else if (oneArmHang < 30) {
    score = 70
    severity = 'minor'
    recommendations.push('Grip is adequate for most progressions')
    priorityExercises.push('towel_pull_up')
  } else {
    score = 90
    severity = 'none'
  }
  
  return {
    category: 'grip_strength',
    score,
    severity,
    recommendations,
    priorityExercises,
    trainingFocus: 'Grip strength development',
  }
}

/**
 * Analyze arm strength balance
 */
export function analyzeArmBalance(factors: PullProfileFactors): PullWeakPointAssessment {
  const balance = factors.armStrengthBalance
  
  let score = 50
  let severity: PullWeakPointAssessment['severity'] = 'none'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (balance !== 'balanced') {
    score = 40
    severity = 'moderate'
    const weakSide = balance === 'left_dominant' ? 'right' : 'left'
    recommendations.push(`Address ${weakSide} arm weakness before one-arm progressions`)
    recommendations.push('Start unilateral sets with weaker arm')
    priorityExercises.push('uneven_pull_up', 'one_arm_assisted_pull_up')
  } else {
    score = 85
  }
  
  return {
    category: 'arm_asymmetry',
    score,
    severity,
    recommendations,
    priorityExercises,
    trainingFocus: 'Bilateral balance',
  }
}

/**
 * Analyze explosive pulling power
 */
export function analyzeExplosivePower(factors: PullProfileFactors): PullWeakPointAssessment {
  const canChestToBar = factors.chestToBarCapable
  
  let score = canChestToBar ? 75 : 40
  let severity: PullWeakPointAssessment['severity'] = canChestToBar ? 'minor' : 'moderate'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (!canChestToBar) {
    recommendations.push('Develop explosive pulling for muscle-up and high pulls')
    recommendations.push('Add explosive pull-ups to training')
    priorityExercises.push('explosive_pull_up', 'chest_to_bar_pull_up')
    
    if (factors.primaryGoal === 'muscle_up') {
      severity = 'significant'
      score = 30
    }
  }
  
  return {
    category: 'explosive_power',
    score,
    severity,
    recommendations,
    priorityExercises,
    trainingFocus: 'Explosive pulling development',
  }
}

/**
 * Full pulling weak point analysis
 */
export function analyzeFullPullProfile(factors: PullProfileFactors): PullWeakPointAssessment[] {
  return [
    analyzePullStrength(factors),
    analyzeScapularDepression(factors),
    analyzeGripStrength(factors),
    analyzeArmBalance(factors),
    analyzeExplosivePower(factors),
  ]
}

/**
 * Get priority exercises based on weak points
 */
export function getPullPriorityExercises(assessments: PullWeakPointAssessment[]): string[] {
  const prioritized: string[] = []
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 0, significant: 1, moderate: 2, minor: 3, none: 4 }
  const sorted = [...assessments].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  
  // Collect priority exercises from most severe weak points
  for (const assessment of sorted) {
    if (assessment.severity !== 'none') {
      for (const exercise of assessment.priorityExercises) {
        if (!prioritized.includes(exercise)) {
          prioritized.push(exercise)
        }
      }
    }
    // Limit to top 6 priority exercises
    if (prioritized.length >= 6) break
  }
  
  return prioritized
}

// =============================================================================
// GUIDE STRUCTURE SUPPORT
// =============================================================================

export interface PullGuideStructure {
  slug: string
  title: string
  description: string
  category: string
  readTime: string
  sections: {
    id: string
    title: string
    content: string[]
  }[]
  seoKeywords: string[]
}

export const PULL_GUIDE_STRUCTURES: PullGuideStructure[] = [
  {
    slug: 'one-arm-pull-up-guide',
    title: 'One-Arm Pull-Up Training Guide',
    description: 'Complete guide to achieving the one-arm pull-up. Progressions, prerequisites, training structure, and common mistakes.',
    category: 'Elite Skills',
    readTime: '15 min read',
    sections: [
      {
        id: 'prerequisites',
        title: 'Prerequisites',
        content: [
          '15+ strict pull-ups',
          'Weighted pull-up at +50% bodyweight',
          '20+ second single-arm hang',
          'Strong scapular control',
        ],
      },
      {
        id: 'progression_stages',
        title: 'Progression Stages',
        content: [
          'Archer Pull-Ups',
          'Typewriter Pull-Ups',
          'Assisted One-Arm Pull-Ups',
          'One-Arm Negatives',
          'Partial One-Arm Pull-Ups',
          'Full One-Arm Pull-Up',
        ],
      },
      {
        id: 'common_mistakes',
        title: 'Common Mistakes',
        content: [
          'Progressing too quickly',
          'Neglecting grip work',
          'Ignoring arm imbalances',
          'Insufficient weighted pull-up base',
          'Poor eccentric control',
        ],
      },
      {
        id: 'training_frequency',
        title: 'Training Frequency',
        content: [
          '2-3 sessions per week',
          '48+ hours between sessions',
          'Balance with other pulling work',
        ],
      },
    ],
    seoKeywords: [
      'one arm pull up progression',
      'how to do one arm pull up',
      'one arm chin up training',
      'unilateral pull up training',
      'one arm pullup guide',
    ],
  },
  {
    slug: 'weighted-pull-up-guide',
    title: 'Weighted Pull-Up Training Guide',
    description: 'Build serious pulling strength with weighted pull-ups. Strength levels, programming, and skill correlations.',
    category: 'Strength',
    readTime: '12 min read',
    sections: [
      {
        id: 'strength_levels',
        title: 'Strength Levels',
        content: [
          'Foundation: +10% BW',
          'Developing: +25% BW',
          'Intermediate: +40% BW',
          'Advanced: +60% BW',
          'Elite: +80% BW',
          'World Class: +100% BW',
        ],
      },
      {
        id: 'programming',
        title: 'Programming Approach',
        content: [
          'Strength focus: 5-6 x 3-5 reps',
          'Hypertrophy focus: 4 x 6-10 reps',
          '3-4 minute rest for strength',
          'Progressive overload weekly',
        ],
      },
      {
        id: 'skill_correlations',
        title: 'Skill Unlocks',
        content: [
          '+40% BW → Muscle-up readiness',
          '+60% BW → Front lever potential',
          '+80% BW → One-arm pull-up potential',
        ],
      },
    ],
    seoKeywords: [
      'weighted pull up progression',
      'weighted pullup program',
      'how to increase weighted pull up',
      'weighted chin up training',
      'calisthenics weighted pulling',
    ],
  },
  {
    slug: 'pull-up-endurance-guide',
    title: 'Pull-Up Endurance Training Guide',
    description: 'Maximize your pull-up reps with structured endurance protocols. Ladders, density work, and max-rep training.',
    category: 'Endurance',
    readTime: '10 min read',
    sections: [
      {
        id: 'protocols',
        title: 'Training Protocols',
        content: [
          'Ladder Training',
          'Density Blocks',
          'Grease the Groove',
          'Max Rep Waves',
          'EMOM Training',
        ],
      },
      {
        id: 'military_prep',
        title: 'Military Test Prep',
        content: [
          'Pyramid protocols',
          'High-frequency practice',
          'Test-specific pacing',
        ],
      },
    ],
    seoKeywords: [
      'increase pull up reps',
      'pull up endurance training',
      'max pull ups',
      'military pull up training',
      'pull up volume training',
    ],
  },
]

// =============================================================================
// MARKETING SUPPORT
// =============================================================================

export const PULL_MARKETING_CLAIMS = {
  capabilities: [
    'Advanced pulling progression systems covering strength, endurance, weighted calisthenics, and one-arm pull-up development',
    'Intelligent weak point detection for pulling strength, grip, scapular control, and explosive power',
    'Structured endurance protocols for max-rep development and military test preparation',
    'Comprehensive exercise library with 40+ pulling variations',
  ],
  
  featureDescriptions: {
    oneArmPullUp: 'Complete one-arm pull-up progression system with readiness requirements, progressive stages, and support exercise selection.',
    weightedPulling: 'Strength-focused weighted pull-up programming with progressive overload, periodization, and skill correlation tracking.',
    pullEndurance: 'Structured endurance protocols including ladders, density training, and military-specific preparation.',
    weakPointDetection: 'Intelligent analysis of pulling weak points with targeted exercise recommendations.',
  },
  
  copyHooks: {
    homepage: 'Master the one-arm pull-up and build elite pulling strength with structured progressions.',
    pullSection: 'From your first pull-up to the one-arm pull-up — intelligent programming that adapts to your level.',
    strengthSection: 'Weighted pull-up programming designed to unlock advanced calisthenics skills.',
  },
}
