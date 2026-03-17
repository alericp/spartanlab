/**
 * Skill Prerequisite Data
 * 
 * Comprehensive prerequisite database for each supported skill.
 * Contains baseline targets, category weights, and coaching thresholds.
 */

import type { SkillType } from '../readiness/canonical-readiness-engine'

// =============================================================================
// PREREQUISITE CATEGORIES
// =============================================================================

export type PrerequisiteCategory = 
  | 'pulling_strength'
  | 'pushing_strength'
  | 'core_compression'
  | 'straight_arm_strength'
  | 'mobility'
  | 'tendon_tolerance'
  | 'skill_specific'
  | 'body_control'

export interface PrerequisiteMetric {
  name: string
  category: PrerequisiteCategory
  baselineTarget: number | string
  advancedTarget: number | string
  unit: string
  weight: number // Contribution to overall readiness (0-1)
  description: string
  assessmentMethod: string
}

export interface SkillPrerequisiteProfile {
  skill: SkillType
  displayName: string
  difficulty: 'intermediate' | 'advanced' | 'elite'
  typicalTimeToAchieve: string // e.g., "6-12 months"
  categoryWeights: Record<PrerequisiteCategory, number>
  metrics: PrerequisiteMetric[]
  coachingNotes: string[]
  commonMistakes: string[]
  injuryPrevention: string[]
}

// =============================================================================
// SKILL PREREQUISITE PROFILES
// =============================================================================

export const SKILL_PREREQUISITE_PROFILES: Record<SkillType, SkillPrerequisiteProfile> = {
  
  front_lever: {
    skill: 'front_lever',
    displayName: 'Front Lever',
    difficulty: 'advanced',
    typicalTimeToAchieve: '12-24 months',
    categoryWeights: {
      pulling_strength: 0.35,
      core_compression: 0.25,
      straight_arm_strength: 0.20,
      mobility: 0.05,
      tendon_tolerance: 0.05,
      pushing_strength: 0.0,
      skill_specific: 0.10,
      body_control: 0.0,
    },
    metrics: [
      {
        name: 'Strict Pull-Ups',
        category: 'pulling_strength',
        baselineTarget: 12,
        advancedTarget: 20,
        unit: 'reps',
        weight: 0.20,
        description: 'Foundation for all pulling strength work',
        assessmentMethod: 'Max strict pull-ups without kipping',
      },
      {
        name: 'Weighted Pull-Up',
        category: 'pulling_strength',
        baselineTarget: 25,
        advancedTarget: 50,
        unit: 'kg added',
        weight: 0.15,
        description: 'Correlates strongly with front lever progression',
        assessmentMethod: 'Max added weight for 1 rep',
      },
      {
        name: 'Hollow Body Hold',
        category: 'core_compression',
        baselineTarget: 45,
        advancedTarget: 90,
        unit: 'seconds',
        weight: 0.25,
        description: 'Core tension pattern matches front lever position',
        assessmentMethod: 'Max hold with posterior pelvic tilt maintained',
      },
      {
        name: 'Tuck Front Lever Hold',
        category: 'skill_specific',
        baselineTarget: 10,
        advancedTarget: 25,
        unit: 'seconds',
        weight: 0.20,
        description: 'Entry-level front lever progression',
        assessmentMethod: 'Max clean hold with knees tucked to chest',
      },
      {
        name: 'Active Scapular Depression',
        category: 'straight_arm_strength',
        baselineTarget: 20,
        advancedTarget: 45,
        unit: 'seconds',
        weight: 0.15,
        description: 'Scapular position is critical for horizontal holds',
        assessmentMethod: 'Hang with active depression maintained',
      },
    ],
    coachingNotes: [
      'Front lever progress often stalls when weighted pull-up plateaus',
      'Tuck progression: knee position affects leverage significantly',
      'Scapular depression must be maintained throughout the hold',
      'Body should form a straight line from shoulders to toes',
    ],
    commonMistakes: [
      'Arching lower back instead of maintaining hollow body',
      'Relaxing scapular depression under fatigue',
      'Progressing too quickly past tuck variations',
      'Neglecting row variations which build specific endurance',
    ],
    injuryPrevention: [
      'Build shoulder stability with face pulls and band work',
      'Ensure proper warm-up including scapular activation',
      'Progress slowly to protect bicep tendons',
      'Include overhead mobility work to prevent impingement',
    ],
  },
  
  back_lever: {
    skill: 'back_lever',
    displayName: 'Back Lever',
    difficulty: 'intermediate',
    typicalTimeToAchieve: '6-12 months',
    categoryWeights: {
      pulling_strength: 0.25,
      core_compression: 0.15,
      straight_arm_strength: 0.20,
      mobility: 0.25,
      tendon_tolerance: 0.10,
      pushing_strength: 0.0,
      skill_specific: 0.05,
      body_control: 0.0,
    },
    metrics: [
      {
        name: 'German Hang',
        category: 'mobility',
        baselineTarget: 30,
        advancedTarget: 60,
        unit: 'seconds',
        weight: 0.25,
        description: 'Tests shoulder extension mobility under load',
        assessmentMethod: 'Comfortable hold with arms straight behind',
      },
      {
        name: 'Skin the Cat',
        category: 'skill_specific',
        baselineTarget: 'comfortable',
        advancedTarget: 'controlled',
        unit: '',
        weight: 0.20,
        description: 'Transition movement that builds pattern',
        assessmentMethod: 'Can perform controlled skin the cat both directions',
      },
      {
        name: 'Strict Pull-Ups',
        category: 'pulling_strength',
        baselineTarget: 10,
        advancedTarget: 15,
        unit: 'reps',
        weight: 0.15,
        description: 'Base pulling strength requirement',
        assessmentMethod: 'Max strict pull-ups',
      },
      {
        name: 'Tuck Back Lever Hold',
        category: 'straight_arm_strength',
        baselineTarget: 10,
        advancedTarget: 20,
        unit: 'seconds',
        weight: 0.20,
        description: 'Entry progression for back lever',
        assessmentMethod: 'Max clean tuck hold',
      },
      {
        name: 'Bicep Tendon Tolerance',
        category: 'tendon_tolerance',
        baselineTarget: 'moderate',
        advancedTarget: 'high',
        unit: '',
        weight: 0.10,
        description: 'Significant strain on bicep tendons',
        assessmentMethod: 'No discomfort in german hang or skin the cat',
      },
    ],
    coachingNotes: [
      'Shoulder extension mobility is often the limiting factor',
      'German hang is the best predictor of back lever readiness',
      'Skin the cat should be mastered before static holds',
      'Back lever typically comes before front lever',
    ],
    commonMistakes: [
      'Forcing into position without adequate mobility',
      'Neglecting bicep tendon conditioning',
      'Rushing past german hang progression',
      'Poor alignment causing unnecessary shoulder stress',
    ],
    injuryPrevention: [
      'Gradual exposure to shoulder extension loading',
      'Never force range of motion',
      'Include bicep stretching and strengthening',
      'Progress based on comfort, not just strength',
    ],
  },
  
  planche: {
    skill: 'planche',
    displayName: 'Planche',
    difficulty: 'elite',
    typicalTimeToAchieve: '24-48 months',
    categoryWeights: {
      pushing_strength: 0.30,
      straight_arm_strength: 0.30,
      core_compression: 0.15,
      mobility: 0.05,
      tendon_tolerance: 0.15,
      pulling_strength: 0.0,
      skill_specific: 0.05,
      body_control: 0.0,
    },
    metrics: [
      {
        name: 'Planche Lean Hold',
        category: 'straight_arm_strength',
        baselineTarget: 30,
        advancedTarget: 60,
        unit: 'seconds',
        weight: 0.30,
        description: 'Most specific planche preparation exercise',
        assessmentMethod: 'Max hold with shoulders past wrists',
      },
      {
        name: 'Parallel Bar Dips',
        category: 'pushing_strength',
        baselineTarget: 20,
        advancedTarget: 35,
        unit: 'reps',
        weight: 0.20,
        description: 'Fundamental pushing strength',
        assessmentMethod: 'Max strict dips with full ROM',
      },
      {
        name: 'Push-Up Endurance',
        category: 'pushing_strength',
        baselineTarget: 40,
        advancedTarget: 60,
        unit: 'reps',
        weight: 0.10,
        description: 'General pushing work capacity',
        assessmentMethod: 'Max push-ups in one set',
      },
      {
        name: 'Handstand Hold',
        category: 'skill_specific',
        baselineTarget: 30,
        advancedTarget: 60,
        unit: 'seconds',
        weight: 0.15,
        description: 'Shoulder stability and body awareness',
        assessmentMethod: 'Wall handstand or freestanding hold',
      },
      {
        name: 'Wrist Extension Mobility',
        category: 'tendon_tolerance',
        baselineTarget: 'comfortable',
        advancedTarget: 'excellent',
        unit: '',
        weight: 0.15,
        description: 'Wrist loading tolerance for planche',
        assessmentMethod: 'Can hold planche lean 30s without wrist pain',
      },
    ],
    coachingNotes: [
      'Planche lean is the most important preparatory exercise',
      'Wrist conditioning is critical and often overlooked',
      'Shoulder protraction must be maintained throughout',
      'Progress through tuck → adv tuck → straddle is typical',
    ],
    commonMistakes: [
      'Rushing to tuck planche without adequate lean strength',
      'Neglecting wrist prehab and conditioning',
      'Losing posterior pelvic tilt under fatigue',
      'Not maintaining full protraction',
    ],
    injuryPrevention: [
      'Daily wrist warm-up and conditioning',
      'Progress lean depth gradually over months',
      'Balance push work with pulling volume',
      'Include elbow prehab for straight-arm loading',
    ],
  },
  
  muscle_up: {
    skill: 'muscle_up',
    displayName: 'Muscle-Up',
    difficulty: 'intermediate',
    typicalTimeToAchieve: '6-12 months',
    categoryWeights: {
      pulling_strength: 0.35,
      pushing_strength: 0.25,
      straight_arm_strength: 0.0,
      core_compression: 0.10,
      mobility: 0.05,
      tendon_tolerance: 0.05,
      skill_specific: 0.20,
      body_control: 0.0,
    },
    metrics: [
      {
        name: 'Strict Pull-Ups',
        category: 'pulling_strength',
        baselineTarget: 10,
        advancedTarget: 18,
        unit: 'reps',
        weight: 0.25,
        description: 'Foundation for the pull phase',
        assessmentMethod: 'Max strict pull-ups',
      },
      {
        name: 'Chest-to-Bar Pull-Ups',
        category: 'skill_specific',
        baselineTarget: 3,
        advancedTarget: 10,
        unit: 'reps',
        weight: 0.20,
        description: 'Pulling height for transition',
        assessmentMethod: 'Pull-ups with chest touching bar',
      },
      {
        name: 'Parallel Bar Dips',
        category: 'pushing_strength',
        baselineTarget: 12,
        advancedTarget: 25,
        unit: 'reps',
        weight: 0.25,
        description: 'Press-out strength after transition',
        assessmentMethod: 'Max strict dips',
      },
      {
        name: 'Explosive Pull Power',
        category: 'skill_specific',
        baselineTarget: 'developing',
        advancedTarget: 'strong',
        unit: '',
        weight: 0.15,
        description: 'Ability to generate upward momentum',
        assessmentMethod: 'Can pull explosively to sternum or higher',
      },
      {
        name: 'False Grip Comfort',
        category: 'skill_specific',
        baselineTarget: 10,
        advancedTarget: 30,
        unit: 'seconds',
        weight: 0.10,
        description: 'Grip position for rings muscle-up',
        assessmentMethod: 'False grip hang time on rings',
      },
    ],
    coachingNotes: [
      'Muscle-up is a skill that combines pulling and pushing',
      'The transition is the hardest part - requires practice',
      'Bar muscle-up and ring muscle-up have different techniques',
      'Kipping can help learn the movement but strict is the goal',
    ],
    commonMistakes: [
      'Insufficient pulling height before attempting transition',
      'Trying to "chicken wing" over the bar',
      'Not keeping the bar/rings close to the body',
      'Excessive reliance on kipping without strength base',
    ],
    injuryPrevention: [
      'Build pulling strength before attempting transitions',
      'Include shoulder mobility work',
      'Progress from band-assisted to unassisted',
      'Avoid excessive volume when learning',
    ],
  },
  
  hspu: {
    skill: 'hspu',
    displayName: 'Handstand Push-Up',
    difficulty: 'advanced',
    typicalTimeToAchieve: '12-18 months',
    categoryWeights: {
      pushing_strength: 0.40,
      core_compression: 0.15,
      straight_arm_strength: 0.0,
      mobility: 0.10,
      tendon_tolerance: 0.05,
      pulling_strength: 0.0,
      skill_specific: 0.25,
      body_control: 0.05,
    },
    metrics: [
      {
        name: 'Wall HSPU',
        category: 'skill_specific',
        baselineTarget: 3,
        advancedTarget: 12,
        unit: 'reps',
        weight: 0.30,
        description: 'Direct HSPU progression',
        assessmentMethod: 'Max wall handstand push-ups',
      },
      {
        name: 'Pike Push-Ups',
        category: 'pushing_strength',
        baselineTarget: 15,
        advancedTarget: 30,
        unit: 'reps',
        weight: 0.20,
        description: 'Overhead pressing pattern builder',
        assessmentMethod: 'Max pike push-ups with elevated feet',
      },
      {
        name: 'Wall Handstand Hold',
        category: 'skill_specific',
        baselineTarget: 45,
        advancedTarget: 90,
        unit: 'seconds',
        weight: 0.20,
        description: 'Stability in the inverted position',
        assessmentMethod: 'Max wall handstand hold',
      },
      {
        name: 'Parallel Bar Dips',
        category: 'pushing_strength',
        baselineTarget: 15,
        advancedTarget: 25,
        unit: 'reps',
        weight: 0.15,
        description: 'General pressing strength indicator',
        assessmentMethod: 'Max strict dips',
      },
      {
        name: 'Overhead Shoulder Mobility',
        category: 'mobility',
        baselineTarget: 'moderate',
        advancedTarget: 'excellent',
        unit: '',
        weight: 0.10,
        description: 'Stacked handstand requires mobility',
        assessmentMethod: 'Can achieve straight line in handstand',
      },
    ],
    coachingNotes: [
      'Wall HSPU is the most direct progression',
      'Pike push-ups build the pressing pattern',
      'Balance becomes important for freestanding HSPU',
      'Deficit HSPU increases ROM requirement',
    ],
    commonMistakes: [
      'Excessive arch in the lower back',
      'Not stacking shoulders properly',
      'Rushing freestanding before wall mastery',
      'Neglecting the bottom position strength',
    ],
    injuryPrevention: [
      'Include shoulder mobility work',
      'Strengthen the bottom position specifically',
      'Balance pressing with pulling work',
      'Progress depth gradually',
    ],
  },
  
  l_sit: {
    skill: 'l_sit',
    displayName: 'L-Sit',
    difficulty: 'intermediate',
    typicalTimeToAchieve: '3-6 months',
    categoryWeights: {
      pushing_strength: 0.20,
      core_compression: 0.40,
      straight_arm_strength: 0.0,
      mobility: 0.15,
      tendon_tolerance: 0.0,
      pulling_strength: 0.0,
      skill_specific: 0.15,
      body_control: 0.10,
    },
    metrics: [
      {
        name: 'Hollow Body Hold',
        category: 'core_compression',
        baselineTarget: 30,
        advancedTarget: 60,
        unit: 'seconds',
        weight: 0.30,
        description: 'Core tension foundation',
        assessmentMethod: 'Max hollow hold with legs straight',
      },
      {
        name: 'Hip Flexor Strength',
        category: 'core_compression',
        baselineTarget: 'moderate',
        advancedTarget: 'strong',
        unit: '',
        weight: 0.25,
        description: 'Required to lift legs to horizontal',
        assessmentMethod: 'Can hold legs horizontal in seated position',
      },
      {
        name: 'Dip Support Hold',
        category: 'pushing_strength',
        baselineTarget: 30,
        advancedTarget: 60,
        unit: 'seconds',
        weight: 0.20,
        description: 'Support position endurance',
        assessmentMethod: 'Max parallette or dip bar support hold',
      },
      {
        name: 'Hamstring Flexibility',
        category: 'mobility',
        baselineTarget: 'moderate',
        advancedTarget: 'good',
        unit: '',
        weight: 0.15,
        description: 'Allows straighter legs',
        assessmentMethod: 'Can touch toes with straight legs',
      },
      {
        name: 'Toe Point Quality',
        category: 'body_control',
        baselineTarget: 'moderate',
        advancedTarget: 'excellent',
        unit: '',
        weight: 0.05,
        description: 'Aesthetic and form consideration',
        assessmentMethod: 'Can maintain pointed toes throughout hold',
      },
    ],
    coachingNotes: [
      'L-sit is primarily a compression strength exercise',
      'Hip flexor strength is often the limiting factor',
      'Tuck → one-leg → full is the standard progression',
      'Floor L-sit is harder than parallette L-sit',
    ],
    commonMistakes: [
      'Rounding the lower back',
      'Not engaging hip flexors actively',
      'Holding breath instead of breathing',
      'Progressing past tuck too quickly',
    ],
    injuryPrevention: [
      'Warm up hip flexors before training',
      'Balance L-sit work with hip extension',
      'Include wrist conditioning for floor work',
      'Build gradually to protect hip flexors',
    ],
  },
  
  v_sit: {
    skill: 'v_sit',
    displayName: 'V-Sit',
    difficulty: 'advanced',
    typicalTimeToAchieve: '12-24 months',
    categoryWeights: {
      pushing_strength: 0.10,
      core_compression: 0.50,
      straight_arm_strength: 0.0,
      mobility: 0.20,
      tendon_tolerance: 0.0,
      pulling_strength: 0.0,
      skill_specific: 0.15,
      body_control: 0.05,
    },
    metrics: [
      {
        name: 'L-Sit Hold',
        category: 'skill_specific',
        baselineTarget: 20,
        advancedTarget: 45,
        unit: 'seconds',
        weight: 0.25,
        description: 'Prerequisite skill mastery',
        assessmentMethod: 'Max clean L-sit hold',
      },
      {
        name: 'Pike Compression Strength',
        category: 'core_compression',
        baselineTarget: 'moderate',
        advancedTarget: 'excellent',
        unit: '',
        weight: 0.30,
        description: 'Active pike compression ability',
        assessmentMethod: 'Can compress legs to chest in seated pike',
      },
      {
        name: 'Hip Flexor Strength',
        category: 'core_compression',
        baselineTarget: 'strong',
        advancedTarget: 'very strong',
        unit: '',
        weight: 0.20,
        description: 'Required to lift legs above horizontal',
        assessmentMethod: 'Can lift legs above horizontal seated',
      },
      {
        name: 'Hamstring Flexibility',
        category: 'mobility',
        baselineTarget: 'good',
        advancedTarget: 'excellent',
        unit: '',
        weight: 0.15,
        description: 'Allows V position without back rounding',
        assessmentMethod: 'Full pike pancake stretch',
      },
      {
        name: 'Core Stability',
        category: 'core_compression',
        baselineTarget: 60,
        advancedTarget: 90,
        unit: 'seconds',
        weight: 0.05,
        description: 'Maintaining position under fatigue',
        assessmentMethod: 'Hollow hold endurance',
      },
    ],
    coachingNotes: [
      'V-sit builds directly on L-sit mastery',
      'Compression strength is the primary limiter',
      'Training should include weighted pike compression',
      'Manna is the next progression from V-sit',
    ],
    commonMistakes: [
      'Attempting V-sit without solid L-sit',
      'Rounding lower back to lift legs higher',
      'Not actively engaging compression',
      'Neglecting hamstring flexibility work',
    ],
    injuryPrevention: [
      'Build compression strength gradually',
      'Include active flexibility work',
      'Balance with hip extension exercises',
      'Progress based on compression capacity',
    ],
  },
  
  iron_cross: {
    skill: 'iron_cross',
    displayName: 'Iron Cross',
    difficulty: 'elite',
    typicalTimeToAchieve: '36-60 months',
    categoryWeights: {
      pushing_strength: 0.10,
      core_compression: 0.05,
      straight_arm_strength: 0.35,
      mobility: 0.05,
      tendon_tolerance: 0.35,
      pulling_strength: 0.0,
      skill_specific: 0.10,
      body_control: 0.0,
    },
    metrics: [
      {
        name: 'Ring Support Hold',
        category: 'skill_specific',
        baselineTarget: 60,
        advancedTarget: 120,
        unit: 'seconds',
        weight: 0.20,
        description: 'Foundation for all rings work',
        assessmentMethod: 'Max stable ring support hold',
      },
      {
        name: 'RTO Support Hold',
        category: 'straight_arm_strength',
        baselineTarget: 30,
        advancedTarget: 60,
        unit: 'seconds',
        weight: 0.20,
        description: 'Rings turned out builds specific strength',
        assessmentMethod: 'Max RTO support with full turn-out',
      },
      {
        name: 'Tendon Conditioning',
        category: 'tendon_tolerance',
        baselineTarget: 'moderate',
        advancedTarget: 'high',
        unit: '',
        weight: 0.30,
        description: 'Years of progressive loading required',
        assessmentMethod: 'Training history and current loading capacity',
      },
      {
        name: 'Scapular Depression Strength',
        category: 'straight_arm_strength',
        baselineTarget: 'moderate',
        advancedTarget: 'strong',
        unit: '',
        weight: 0.15,
        description: 'Controls the descent and hold',
        assessmentMethod: 'Can maintain depression under load',
      },
      {
        name: 'Assisted Cross Hold',
        category: 'skill_specific',
        baselineTarget: 10,
        advancedTarget: 30,
        unit: 'seconds',
        weight: 0.10,
        description: 'Band-assisted cross progression',
        assessmentMethod: 'Max hold with lightest band',
      },
    ],
    coachingNotes: [
      'Iron cross requires years of dedicated tendon conditioning',
      'Progress extremely slowly to protect tendons',
      'RTO support is the foundation for cross training',
      'Most athletes need 3-5 years of rings work before cross',
    ],
    commonMistakes: [
      'Attempting cross progressions too early',
      'Neglecting ring support fundamentals',
      'Not respecting tendon adaptation timeline',
      'Using excessive band assistance',
    ],
    injuryPrevention: [
      'Progress over years, not months',
      'Include extensive ring support work',
      'Listen to tendon feedback (any pain = back off)',
      'Include bicep prehab and strengthening',
    ],
  },
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get prerequisite profile for a skill
 */
export function getPrerequisiteProfile(skill: SkillType): SkillPrerequisiteProfile {
  return SKILL_PREREQUISITE_PROFILES[skill]
}

/**
 * Get all prerequisite profiles
 */
export function getAllPrerequisiteProfiles(): SkillPrerequisiteProfile[] {
  return Object.values(SKILL_PREREQUISITE_PROFILES)
}

/**
 * Get skills by difficulty
 */
export function getSkillsByDifficulty(difficulty: 'intermediate' | 'advanced' | 'elite'): SkillType[] {
  return Object.entries(SKILL_PREREQUISITE_PROFILES)
    .filter(([, profile]) => profile.difficulty === difficulty)
    .map(([skill]) => skill as SkillType)
}

/**
 * Get coaching notes for a skill
 */
export function getCoachingNotes(skill: SkillType): string[] {
  return SKILL_PREREQUISITE_PROFILES[skill].coachingNotes
}

/**
 * Get injury prevention tips for a skill
 */
export function getInjuryPreventionTips(skill: SkillType): string[] {
  return SKILL_PREREQUISITE_PROFILES[skill].injuryPrevention
}
