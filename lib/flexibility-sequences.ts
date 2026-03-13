/**
 * SpartanLab Flexibility Training Philosophy
 * 
 * Core Principles:
 * - 15 second holds (NOT 30-60s static stretching)
 * - Multiple angles/variations per movement
 * - 3 rounds of each sequence
 * - Low soreness, high frequency training
 * - Sessions lasting 5-12 minutes
 * 
 * This creates productive flexibility work without damaging recovery.
 */

export interface FlexibilityMovement {
  id: string
  name: string
  holdTime: 15 // Always 15 seconds
  cues: string[]
  side?: 'left' | 'right' | 'both' | 'center'
}

export interface FlexibilitySequence {
  id: string
  name: string
  skill: 'toe_touch' | 'front_splits' | 'side_splits' | 'pancake'
  description: string
  movements: FlexibilityMovement[]
  rounds: 3 // Always 3 rounds
  estimatedMinutes: number
  targets: string[]
  frequency: string
}

// =============================================================================
// TOE TOUCH / FORWARD FOLD SEQUENCE
// =============================================================================
export const TOE_TOUCH_SEQUENCE: FlexibilitySequence = {
  id: 'toe_touch_sequence',
  name: 'Toe Touch Flow',
  skill: 'toe_touch',
  description: 'Hamstring and posterior chain mobility through multiple angles',
  movements: [
    {
      id: 'single_leg_hamstring_left',
      name: 'Single-Leg Hamstring Pull (Left)',
      holdTime: 15,
      cues: ['Left leg extended', 'Right leg bent', 'Hinge at hips', 'Keep back flat'],
      side: 'left',
    },
    {
      id: 'single_leg_hamstring_right',
      name: 'Single-Leg Hamstring Pull (Right)',
      holdTime: 15,
      cues: ['Right leg extended', 'Left leg bent', 'Reach toward toes', 'Breathe steadily'],
      side: 'right',
    },
    {
      id: 'seated_forward_fold_straight',
      name: 'Seated Forward Fold (Straight Back)',
      holdTime: 15,
      cues: ['Legs together', 'Maintain flat back', 'Hinge from hips', 'Reach forward'],
      side: 'center',
    },
    {
      id: 'seated_forward_fold_rounded',
      name: 'Seated Forward Fold (Rounded)',
      holdTime: 15,
      cues: ['Allow spine to round', 'Relax into position', 'Breathe into stretch', 'Let gravity help'],
      side: 'center',
    },
  ],
  rounds: 3,
  estimatedMinutes: 5,
  targets: ['Hamstrings', 'Spinal flexion', 'Posterior chain mobility'],
  frequency: 'Daily or post-workout',
}

// =============================================================================
// FRONT SPLITS SEQUENCE
// =============================================================================
export const FRONT_SPLITS_SEQUENCE: FlexibilitySequence = {
  id: 'front_splits_sequence',
  name: 'Front Splits Flow',
  skill: 'front_splits',
  description: 'Hip flexor and hamstring mobility for front split progression',
  movements: [
    // Right leg forward sequence
    {
      id: 'hip_flexor_kneeling_right',
      name: 'Kneeling Hip Flexor Stretch (Right Forward)',
      holdTime: 15,
      cues: ['Right foot forward', 'Left knee down', 'Squeeze left glute', 'Push hips forward'],
      side: 'right',
    },
    {
      id: 'half_split_right',
      name: 'Half Split Position (Right Forward)',
      holdTime: 15,
      cues: ['Right leg straight', 'Hinge at hips', 'Keep hips square', 'Flex right foot'],
      side: 'right',
    },
    {
      id: 'front_split_exposure_right',
      name: 'Front Split Exposure (Right Forward)',
      holdTime: 15,
      cues: ['Slide into split', 'Support with hands', 'Go to comfortable depth', 'Breathe steadily'],
      side: 'right',
    },
    // Left leg forward sequence
    {
      id: 'hip_flexor_kneeling_left',
      name: 'Kneeling Hip Flexor Stretch (Left Forward)',
      holdTime: 15,
      cues: ['Left foot forward', 'Right knee down', 'Squeeze right glute', 'Push hips forward'],
      side: 'left',
    },
    {
      id: 'half_split_left',
      name: 'Half Split Position (Left Forward)',
      holdTime: 15,
      cues: ['Left leg straight', 'Hinge at hips', 'Keep hips square', 'Flex left foot'],
      side: 'left',
    },
    {
      id: 'front_split_exposure_left',
      name: 'Front Split Exposure (Left Forward)',
      holdTime: 15,
      cues: ['Slide into split', 'Support with hands', 'Go to comfortable depth', 'Breathe steadily'],
      side: 'left',
    },
  ],
  rounds: 3,
  estimatedMinutes: 9,
  targets: ['Hip flexors', 'Hamstrings', 'Split depth exposure'],
  frequency: 'Daily or post-workout',
}

// =============================================================================
// SIDE SPLITS SEQUENCE
// =============================================================================
export const SIDE_SPLITS_SEQUENCE: FlexibilitySequence = {
  id: 'side_splits_sequence',
  name: 'Side Splits Flow',
  skill: 'side_splits',
  description: 'Adductor and hip opening for middle split progression',
  movements: [
    {
      id: 'wide_horse_stance',
      name: 'Wide Horse Stance Stretch',
      holdTime: 15,
      cues: ['Feet wide', 'Sink low', 'Knees track over toes', 'Keep chest up'],
      side: 'center',
    },
    {
      id: 'frog_stretch_exposure',
      name: 'Frog Stretch Exposure',
      holdTime: 15,
      cues: ['Knees wide', 'Hips sink back', 'Rock gently if needed', 'Relax groin'],
      side: 'center',
    },
    {
      id: 'side_split_exposure',
      name: 'Side Split Exposure Hold',
      holdTime: 15,
      cues: ['Slide feet wide', 'Support with hands', 'Toes point up', 'Go to comfortable depth'],
      side: 'center',
    },
  ],
  rounds: 3,
  estimatedMinutes: 5,
  targets: ['Inner thigh mobility', 'Adductor strength', 'Hip opening'],
  frequency: 'Daily or post-workout',
}

// =============================================================================
// PANCAKE SEQUENCE
// =============================================================================
export const PANCAKE_SEQUENCE: FlexibilitySequence = {
  id: 'pancake_sequence',
  name: 'Pancake Flow',
  skill: 'pancake',
  description: 'Straddle fold mobility for compression and pike skills',
  movements: [
    {
      id: 'seated_wide_straddle',
      name: 'Seated Wide Straddle Fold',
      holdTime: 15,
      cues: ['Legs wide', 'Sit tall initially', 'Hinge from hips', 'Walk hands forward'],
      side: 'center',
    },
    {
      id: 'pancake_lean_forward',
      name: 'Pancake Lean (Hands Walking Forward)',
      holdTime: 15,
      cues: ['Continue walking hands', 'Keep legs active', 'Breathe into stretch', 'Maintain hip hinge'],
      side: 'center',
    },
    {
      id: 'active_compression_pancake',
      name: 'Active Compression Pancake Hold',
      holdTime: 15,
      cues: ['Engage hip flexors', 'Pull chest toward floor', 'Keep core engaged', 'Active position'],
      side: 'center',
    },
  ],
  rounds: 3,
  estimatedMinutes: 5,
  targets: ['Hip flexors', 'Hamstrings', 'Adductors', 'Compression strength'],
  frequency: 'Daily or post-workout',
}

// =============================================================================
// SEQUENCE REGISTRY
// =============================================================================
export const FLEXIBILITY_SEQUENCES: Record<string, FlexibilitySequence> = {
  toe_touch: TOE_TOUCH_SEQUENCE,
  front_splits: FRONT_SPLITS_SEQUENCE,
  side_splits: SIDE_SPLITS_SEQUENCE,
  pancake: PANCAKE_SEQUENCE,
}

// =============================================================================
// SESSION GENERATOR
// =============================================================================

export interface FlexibilitySessionConfig {
  skill: 'toe_touch' | 'front_splits' | 'side_splits' | 'pancake' | 'flexibility'
  maxMinutes?: number // Default 12 minutes max
}

export interface GeneratedFlexibilitySession {
  name: string
  skill: string
  totalMinutes: number
  totalRounds: number
  exercises: {
    name: string
    holdTime: 15
    cues: string[]
    round: number
  }[]
  philosophy: string
}

/**
 * Generates a flexibility session following SpartanLab's 15-second exposure philosophy
 */
export function generateFlexibilitySession(config: FlexibilitySessionConfig): GeneratedFlexibilitySession {
  const { skill, maxMinutes = 12 } = config
  
  // Get the appropriate sequence(s)
  let sequences: FlexibilitySequence[] = []
  
  if (skill === 'flexibility') {
    // For general flexibility, pick 2 complementary sequences
    sequences = [TOE_TOUCH_SEQUENCE, PANCAKE_SEQUENCE]
  } else {
    const sequence = FLEXIBILITY_SEQUENCES[skill]
    if (sequence) {
      sequences = [sequence]
    } else {
      sequences = [TOE_TOUCH_SEQUENCE] // Fallback
    }
  }
  
  // Build the session exercises
  const exercises: GeneratedFlexibilitySession['exercises'] = []
  let totalTime = 0
  
  for (const sequence of sequences) {
    // Check if adding this sequence would exceed time limit
    const sequenceTime = sequence.movements.length * 15 * sequence.rounds / 60
    if (totalTime + sequenceTime > maxMinutes) continue
    
    // Add all movements for 3 rounds
    for (let round = 1; round <= sequence.rounds; round++) {
      for (const movement of sequence.movements) {
        exercises.push({
          name: movement.name,
          holdTime: 15,
          cues: movement.cues,
          round,
        })
      }
    }
    
    totalTime += sequenceTime
  }
  
  // Calculate actual total minutes
  const actualMinutes = Math.round(exercises.length * 15 / 60)
  
  return {
    name: skill === 'flexibility' 
      ? 'General Flexibility Flow' 
      : `${FLEXIBILITY_SEQUENCES[skill]?.name || 'Flexibility'} Session`,
    skill,
    totalMinutes: Math.max(actualMinutes, sequences.reduce((sum, s) => sum + s.estimatedMinutes, 0)),
    totalRounds: 3,
    exercises,
    philosophy: 'SpartanLab Flexibility: 15-second exposures, multiple angles, 3 rounds. Frequent training without soreness.',
  }
}

/**
 * Returns the recommended flexibility session duration based on goal
 */
export function getFlexibilitySessionDuration(skill: string): { minMinutes: number; maxMinutes: number } {
  const durations: Record<string, { minMinutes: number; maxMinutes: number }> = {
    toe_touch: { minMinutes: 5, maxMinutes: 8 },
    front_splits: { minMinutes: 8, maxMinutes: 12 },
    side_splits: { minMinutes: 5, maxMinutes: 8 },
    pancake: { minMinutes: 5, maxMinutes: 8 },
    flexibility: { minMinutes: 8, maxMinutes: 12 },
  }
  
  return durations[skill] || { minMinutes: 5, maxMinutes: 10 }
}

/**
 * Calculates flexibility progress level based on range achieved
 */
export function getFlexibilityProgressLevel(skill: string, rangeScore: number): {
  level: 'basic_exposure' | 'moderate_range' | 'deep_range' | 'full_position'
  label: string
  nextMilestone: string
} {
  if (rangeScore < 25) {
    return {
      level: 'basic_exposure',
      label: 'Basic Exposure',
      nextMilestone: 'Achieve moderate range with consistent practice',
    }
  } else if (rangeScore < 50) {
    return {
      level: 'moderate_range',
      label: 'Moderate Range',
      nextMilestone: 'Work toward deep range with daily exposure',
    }
  } else if (rangeScore < 75) {
    return {
      level: 'deep_range',
      label: 'Deep Range',
      nextMilestone: 'Progress toward full position ownership',
    }
  } else {
    return {
      level: 'full_position',
      label: 'Full Position',
      nextMilestone: 'Maintain and build active control',
    }
  }
}
