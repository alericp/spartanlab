// Skill Progression Rules
// Defines progressions, micro-progressions, and level requirements

import type { MicroProgression, ReadinessThresholds } from '@/types/skill-readiness'

// =============================================================================
// SKILL DEFINITIONS (Enhanced)
// =============================================================================

export interface EnhancedSkillLevel {
  name: string
  minHoldForOwnership: number // Seconds for 4+ repeatable clean holds
  targetHold: number // Seconds to aim for before progression
  microToNext?: MicroProgression // Micro-progression toward next level
}

export interface EnhancedSkillDefinition {
  key: string
  name: string
  description: string
  levels: EnhancedSkillLevel[]
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up' | 'weighted_dip' | 'weighted_muscle_up'
    minOneRMPercent: number[] // By level index - % of bodyweight added
    additionalFactors: string[]
  }
  isIsometric: boolean // True for holds, false for dynamic skills
  trainingPhilosophy?: string // SpartanLab flexibility philosophy description
}

// =============================================================================
// PLANCHE PROGRESSION
// =============================================================================

export const PLANCHE_PROGRESSION: EnhancedSkillDefinition = {
  key: 'planche',
  name: 'Planche',
  description: 'Master the horizontal hold progression',
  isIsometric: true,
  levels: [
    {
      name: 'Tuck Planche',
      minHoldForOwnership: 8,
      targetHold: 15,
      microToNext: {
        name: 'Extended Tuck Planche',
        description: 'Gradually extend hips backward while maintaining tuck',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Push hips back slightly', 'Keep knees tucked but extend hip angle', 'Maintain shoulder protraction'],
      },
    },
    {
      name: 'Advanced Tuck Planche',
      minHoldForOwnership: 6,
      targetHold: 12,
      microToNext: {
        name: 'Half-Lay Planche',
        description: 'Straighten legs partially while keeping slight knee bend',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Extend legs to 45 degrees', 'Drive shoulders forward', 'Maintain hollow body'],
      },
    },
    {
      name: 'Straddle Planche',
      minHoldForOwnership: 5,
      targetHold: 10,
      microToNext: {
        name: 'Narrow Straddle Planche',
        description: 'Gradually bring legs closer together',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Reduce straddle width progressively', 'Increase forward lean slightly', 'Engage glutes hard'],
      },
    },
    {
      name: 'Full Planche',
      minHoldForOwnership: 3,
      targetHold: 8,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_dip',
    minOneRMPercent: [20, 35, 50, 65], // % of BW added for each level
    additionalFactors: ['Pseudo planche push-up depth', 'Planche lean duration', 'Scapular protraction strength'],
  },
}

// =============================================================================
// FRONT LEVER PROGRESSION
// =============================================================================

export const FRONT_LEVER_PROGRESSION: EnhancedSkillDefinition = {
  key: 'front_lever',
  name: 'Front Lever',
  description: 'Complete horizontal front body hold',
  isIsometric: true,
  levels: [
    {
      name: 'Tuck Front Lever',
      minHoldForOwnership: 10,
      targetHold: 20,
      microToNext: {
        name: 'Extended Tuck Front Lever',
        description: 'Push hips away while maintaining tuck position',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Extend hip angle', 'Keep knees tucked to chest', 'Depress and retract scapulae'],
      },
    },
    {
      name: 'Advanced Tuck Front Lever',
      minHoldForOwnership: 8,
      targetHold: 15,
      microToNext: {
        name: 'Half-Lay Front Lever',
        description: 'Straighten legs partially with slight knee bend',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Extend legs to 45-60 degrees', 'Drive hips up', 'Maintain posterior pelvic tilt'],
      },
    },
    {
      name: 'One Leg Front Lever',
      minHoldForOwnership: 6,
      targetHold: 12,
      microToNext: {
        name: 'Straddle Entry Holds',
        description: 'Practice straddle with wider leg position',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Wide straddle first', 'Gradually narrow straddle', 'Keep hips level'],
      },
    },
    {
      name: 'Straddle Front Lever',
      minHoldForOwnership: 5,
      targetHold: 10,
      microToNext: {
        name: 'Narrow Straddle Front Lever',
        description: 'Bring legs progressively closer',
        fromLevel: 3,
        towardLevel: 4,
        cues: ['Reduce straddle width 10-15% each week', 'Maintain hip height', 'Keep core tight'],
      },
    },
    {
      name: 'Full Front Lever',
      minHoldForOwnership: 3,
      targetHold: 8,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [15, 30, 45, 55, 70], // % of BW added
    additionalFactors: ['Front lever row capacity', 'Scapular depression strength', 'Core anti-extension'],
  },
}

// =============================================================================
// MUSCLE UP PROGRESSION
// =============================================================================

export const MUSCLE_UP_PROGRESSION: EnhancedSkillDefinition = {
  key: 'muscle_up',
  name: 'Muscle Up',
  description: 'Explosive bar transition skill',
  isIsometric: false,
  levels: [
    {
      name: 'Band Assisted Muscle Up',
      minHoldForOwnership: 5, // Reps, not seconds for dynamic skills
      targetHold: 8,
      microToNext: {
        name: 'Lighter Band Assistance',
        description: 'Progress to thinner resistance band',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Reduce band thickness progressively', 'Focus on transition technique', 'Pull high before transition'],
      },
    },
    {
      name: 'Jumping Muscle Up',
      minHoldForOwnership: 5,
      targetHold: 8,
      microToNext: {
        name: 'Lower Box/Minimal Jump',
        description: 'Reduce jump assistance progressively',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Lower jump platform', 'Pull through more', 'Quick transition at peak'],
      },
    },
    {
      name: 'Strict Muscle Up',
      minHoldForOwnership: 3,
      targetHold: 5,
      microToNext: {
        name: 'Tempo Muscle Up',
        description: 'Control the movement with slower tempo',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['3 second pull phase', 'Pause at transition', 'Controlled dip'],
      },
    },
    {
      name: 'Weighted Muscle Up',
      minHoldForOwnership: 1,
      targetHold: 3,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [20, 35, 50, 70],
    additionalFactors: ['High pull capacity', 'Dip strength', 'Transition technique'],
  },
}

// =============================================================================
// HANDSTAND PUSHUP PROGRESSION
// =============================================================================

export const HANDSTAND_PUSHUP_PROGRESSION: EnhancedSkillDefinition = {
  key: 'handstand_pushup',
  name: 'Handstand Pushup',
  description: 'Vertical pressing strength',
  isIsometric: false,
  levels: [
    {
      name: 'Wall Supported HSPU',
      minHoldForOwnership: 5,
      targetHold: 10,
      microToNext: {
        name: 'Increased ROM Wall HSPU',
        description: 'Add deficit for greater range of motion',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Add parallettes or blocks', 'Increase depth progressively', 'Control the negative'],
      },
    },
    {
      name: 'Partial ROM Freestanding',
      minHoldForOwnership: 3,
      targetHold: 6,
      microToNext: {
        name: 'Deeper Partial ROM',
        description: 'Increase range of motion gradually',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Lower 1-2 inches more each week', 'Maintain balance', 'Keep elbows tracking properly'],
      },
    },
    {
      name: 'Strict Wall HSPU',
      minHoldForOwnership: 5,
      targetHold: 8,
      microToNext: {
        name: 'Heel Tap HSPU',
        description: 'Minimal wall contact during the press',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Light heel touch only', 'Press without leaning into wall', 'Build balance confidence'],
      },
    },
    {
      name: 'Freestanding HSPU',
      minHoldForOwnership: 1,
      targetHold: 3,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_dip',
    minOneRMPercent: [25, 40, 55, 75],
    additionalFactors: ['Pike pushup strength', 'Handstand hold time', 'Shoulder mobility'],
  },
}

// =============================================================================
// COMPRESSION SKILL PROGRESSIONS - L-SIT, V-SIT, I-SIT
// =============================================================================

export const L_SIT_PROGRESSION: EnhancedSkillDefinition = {
  key: 'l_sit',
  name: 'L-Sit',
  description: 'Master core compression strength and hip flexor endurance',
  isIsometric: true,
  levels: [
    {
      name: 'Tuck L-Sit',
      minHoldForOwnership: 10,
      targetHold: 15,
      microToNext: {
        name: 'Extended Tuck L-Sit',
        description: 'Gradually straighten legs while maintaining hold',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Extend legs to 45 degrees', 'Keep core braced', 'Push shoulders down and back'],
      },
    },
    {
      name: 'L-Sit Hold',
      minHoldForOwnership: 15,
      targetHold: 25,
      microToNext: {
        name: 'Elevated L-Sit',
        description: 'Increase difficulty on higher apparatus',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Find lower parallettes', 'Maintain body tension', 'Drive shoulders forward'],
      },
    },
    {
      name: 'Advanced L-Sit',
      minHoldForOwnership: 20,
      targetHold: 30,
      microToNext: {
        name: 'V-Sit Entry',
        description: 'Begin exploring V-sit progression',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Increase hip flexion angle slightly', 'Lift legs higher', 'Focus on control not height'],
      },
    },
    {
      name: 'V-Sit Progression',
      minHoldForOwnership: 12,
      targetHold: 20,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [0, 10, 15, 25],
    additionalFactors: ['Hip flexor flexibility', 'Core compression strength', 'Shoulder stability'],
  },
}

export const V_SIT_PROGRESSION: EnhancedSkillDefinition = {
  key: 'v_sit',
  name: 'V-Sit',
  description: 'Advanced core compression with full leg extension',
  isIsometric: true,
  levels: [
    {
      name: 'V-Sit Entry',
      minHoldForOwnership: 8,
      targetHold: 12,
      microToNext: {
        name: 'Increased Leg Height',
        description: 'Lift legs higher toward horizontal',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Legs at 45 degrees initially', 'Increase angle progressively', 'Maintain body control'],
      },
    },
    {
      name: 'V-Sit Hold',
      minHoldForOwnership: 5,
      targetHold: 10,
      microToNext: {
        name: 'I-Sit Entry',
        description: 'Progress toward vertical body position',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Lean back slightly more', 'Lift shoulders higher', 'Work toward I-sit progressions'],
      },
    },
    {
      name: 'I-Sit Entry',
      minHoldForOwnership: 3,
      targetHold: 8,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [20, 30, 45],
    additionalFactors: ['L-sit mastery', 'Hip flexor strength', 'Upper body leverage control'],
  },
}

export const I_SIT_PROGRESSION: EnhancedSkillDefinition = {
  key: 'i_sit',
  name: 'I-Sit',
  description: 'Elite compression strength - complete vertical body hold',
  isIsometric: true,
  levels: [
    {
      name: 'I-Sit Entry',
      minHoldForOwnership: 2,
      targetHold: 5,
      microToNext: {
        name: 'Extended I-Sit',
        description: 'Increase hold time and body alignment',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['Keep body straight', 'Maximum shoulder depression', 'Perfect vertical alignment'],
      },
    },
    {
      name: 'I-Sit Hold',
      minHoldForOwnership: 3,
      targetHold: 8,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [50, 70],
    additionalFactors: ['V-sit mastery', 'Exceptional hip flexor strength', 'Elite compression control'],
  },
}

// Add compression skills to the registry
export const COMPRESSION_SKILL_PROGRESSIONS: Record<string, EnhancedSkillDefinition> = {
  l_sit: L_SIT_PROGRESSION,
  v_sit: V_SIT_PROGRESSION,
  i_sit: I_SIT_PROGRESSION,
}

// =============================================================================
// FLEXIBILITY SKILL PROGRESSIONS
// =============================================================================

export const PANCAKE_PROGRESSION: EnhancedSkillDefinition = {
  key: 'pancake',
  name: 'Pancake',
  description: 'Forward fold with legs wide - essential for compression and straddle skills',
  isIsometric: true,
  // SpartanLab Philosophy: 15s exposure holds, 3 rounds, multiple angles
  trainingPhilosophy: '15s holds x 3 rounds, daily frequency',
  levels: [
    {
      name: 'Basic Exposure',
      minHoldForOwnership: 15,
      targetHold: 15, // 15s x 3 rounds = 45s total exposure
      microToNext: {
        name: 'Straddle with Forward Reach',
        description: 'Build exposure with multiple angles, 3 rounds daily',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['15s seated straddle', '15s hands walking forward', '15s active pancake', 'Repeat 3 rounds'],
      },
    },
    {
      name: 'Moderate Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Deepening Pancake Flow',
        description: 'Increase depth while maintaining 15s exposure structure',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Maintain hip hinge', 'Walk hands further each round', 'Keep legs active'],
      },
    },
    {
      name: 'Deep Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Compression Pancake Work',
        description: 'Add active compression strength to deep fold',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Engage hip flexors actively', 'Pull chest toward floor', 'Control throughout'],
      },
    },
    {
      name: 'Full Position',
      minHoldForOwnership: 15,
      targetHold: 15,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [0, 0, 0, 0],
    additionalFactors: ['Hip flexor strength', 'Adductor flexibility', 'Core compression ability'],
  },
}

export const TOE_TOUCH_PROGRESSION: EnhancedSkillDefinition = {
  key: 'toe_touch',
  name: 'Toe Touch',
  description: 'Standing forward fold - foundation for pike compression',
  isIsometric: true,
  // SpartanLab Philosophy: 15s exposure holds, 3 rounds, multiple angles
  trainingPhilosophy: '15s holds x 3 rounds, daily frequency',
  levels: [
    {
      name: 'Basic Exposure',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Hamstring Flow',
        description: 'Build exposure with single-leg and double-leg variations',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['15s single-leg left', '15s single-leg right', '15s seated straight back', '15s seated rounded', 'Repeat 3 rounds'],
      },
    },
    {
      name: 'Moderate Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Deepening Flow',
        description: 'Increase depth while maintaining 15s structure',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Straighten knees gradually', 'Keep weight forward', 'Relax into stretch'],
      },
    },
    {
      name: 'Deep Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Pike Compression Work',
        description: 'Add active compression to deep fold',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Pull chest to thighs actively', 'Straight legs throughout', 'Engage core'],
      },
    },
    {
      name: 'Full Position',
      minHoldForOwnership: 15,
      targetHold: 15,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [0, 0, 0, 0],
    additionalFactors: ['Hamstring flexibility', 'Hip hinge mobility', 'Core compression'],
  },
}

export const FRONT_SPLITS_PROGRESSION: EnhancedSkillDefinition = {
  key: 'front_splits',
  name: 'Front Splits',
  description: 'Full leg split front-to-back - hip flexor and hamstring mobility',
  isIsometric: true,
  // SpartanLab Philosophy: 15s exposure holds, 3 rounds, both sides
  trainingPhilosophy: '15s holds x 3 rounds per side, daily frequency',
  levels: [
    {
      name: 'Basic Exposure',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Front Split Flow',
        description: 'Hip flexor, half split, split exposure per side',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['15s hip flexor stretch', '15s half split', '15s split exposure', 'Both sides, 3 rounds'],
      },
    },
    {
      name: 'Moderate Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Deepening Split Flow',
        description: 'Increase depth while maintaining structure',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Lower into each position', 'Keep hips square', 'Breathe into stretch'],
      },
    },
    {
      name: 'Deep Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Full Split Exposure',
        description: 'Work toward full floor contact',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Reduce hand support', 'Control descent', 'Maintain alignment'],
      },
    },
    {
      name: 'Full Position',
      minHoldForOwnership: 15,
      targetHold: 15,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [0, 0, 0, 0],
    additionalFactors: ['Hip flexor flexibility', 'Hamstring flexibility', 'Hip stability'],
  },
}

export const SIDE_SPLITS_PROGRESSION: EnhancedSkillDefinition = {
  key: 'side_splits',
  name: 'Side Splits',
  description: 'Full leg split side-to-side - essential for straddle skills',
  isIsometric: true,
  // SpartanLab Philosophy: 15s exposure holds, 3 rounds, multiple angles
  trainingPhilosophy: '15s holds x 3 rounds, daily frequency',
  levels: [
    {
      name: 'Basic Exposure',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Side Split Flow',
        description: 'Horse stance, frog, split exposure sequence',
        fromLevel: 0,
        towardLevel: 1,
        cues: ['15s horse stance', '15s frog stretch', '15s split exposure', 'Repeat 3 rounds'],
      },
    },
    {
      name: 'Moderate Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Deepening Flow',
        description: 'Increase depth in each position',
        fromLevel: 1,
        towardLevel: 2,
        cues: ['Sink lower each round', 'Rock gently', 'Relax into stretch'],
      },
    },
    {
      name: 'Deep Range',
      minHoldForOwnership: 15,
      targetHold: 15,
      microToNext: {
        name: 'Full Split Exposure',
        description: 'Work toward full floor contact',
        fromLevel: 2,
        towardLevel: 3,
        cues: ['Reduce hand support', 'Toes pointing up', 'Control throughout'],
      },
    },
    {
      name: 'Full Position',
      minHoldForOwnership: 15,
      targetHold: 15,
    },
  ],
  supportStrengthRequirements: {
    primaryExercise: 'weighted_pull_up',
    minOneRMPercent: [0, 0, 0, 0],
    additionalFactors: ['Adductor flexibility', 'Hip mobility', 'Hip stability'],
  },
}

// Add flexibility skills to the registry
export const FLEXIBILITY_SKILL_PROGRESSIONS: Record<string, EnhancedSkillDefinition> = {
  pancake: PANCAKE_PROGRESSION,
  toe_touch: TOE_TOUCH_PROGRESSION,
  front_splits: FRONT_SPLITS_PROGRESSION,
  side_splits: SIDE_SPLITS_PROGRESSION,
}

// =============================================================================
// SKILL PROGRESSIONS REGISTRY (Main Export)
// =============================================================================

export const SKILL_PROGRESSIONS: Record<string, EnhancedSkillDefinition> = {
  planche: PLANCHE_PROGRESSION,
  front_lever: FRONT_LEVER_PROGRESSION,
  muscle_up: MUSCLE_UP_PROGRESSION,
  handstand_pushup: HANDSTAND_PUSHUP_PROGRESSION,
  l_sit: L_SIT_PROGRESSION,
  v_sit: V_SIT_PROGRESSION,
  i_sit: I_SIT_PROGRESSION,
  // Flexibility skills
  pancake: PANCAKE_PROGRESSION,
  toe_touch: TOE_TOUCH_PROGRESSION,
  front_splits: FRONT_SPLITS_PROGRESSION,
  side_splits: SIDE_SPLITS_PROGRESSION,
}

export function getSkillProgression(skillKey: string): EnhancedSkillDefinition | null {
  return SKILL_PROGRESSIONS[skillKey] ?? null
}

export function getSkillLevel(skillKey: string, levelIndex: number): EnhancedSkillLevel | null {
  const skill = SKILL_PROGRESSIONS[skillKey]
  if (!skill || levelIndex < 0 || levelIndex >= skill.levels.length) {
    return null
  }
  return skill.levels[levelIndex]
}

export function getMicroProgression(skillKey: string, levelIndex: number): MicroProgression | null {
  const level = getSkillLevel(skillKey, levelIndex)
  return level?.microToNext ?? null
}

// =============================================================================
// READINESS THRESHOLDS BY EXPERIENCE
// =============================================================================

export function getReadinessThresholds(experienceLevel: string): ReadinessThresholds {
  switch (experienceLevel) {
    case 'beginner':
      return {
        minCleanHolds: 5,
        minAverageHoldSeconds: 8,
        minSessionsForReliability: 4,
        minWeeklyDensitySeconds: 60,
        minSessionDensitySeconds: 25,
        minSupportStrengthScore: 65,
        minTrendStability: 75,
      }
    case 'advanced':
      return {
        minCleanHolds: 3,
        minAverageHoldSeconds: 5,
        minSessionsForReliability: 2,
        minWeeklyDensitySeconds: 35,
        minSessionDensitySeconds: 15,
        minSupportStrengthScore: 55,
        minTrendStability: 65,
      }
    case 'intermediate':
    default:
      return {
        minCleanHolds: 4,
        minAverageHoldSeconds: 6,
        minSessionsForReliability: 3,
        minWeeklyDensitySeconds: 45,
        minSessionDensitySeconds: 20,
        minSupportStrengthScore: 60,
        minTrendStability: 70,
      }
  }
}
