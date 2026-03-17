/**
 * SpartanLab Enhanced Exercise Intelligence Layer
 * 
 * Builds on the existing exercise classification system to add:
 * - Best use case logic (when is this exercise the optimal choice)
 * - Contraindication logic (when to avoid this exercise)
 * - "Why this exercise" explanations
 * - Progression graph integration (node-aware selection)
 * - Weak point integration (corrective emphasis)
 * - Override warning generation
 * - Substitution quality scoring
 * 
 * This layer makes exercise decisions feel deliberate, coach-like, and safe.
 */

import type { MovementFamily, TrainingIntent, SkillCarryover, EquipmentTag, DifficultyBand } from './movement-family-registry'
import type { ExerciseClassification } from './exercise-classification-registry'
import { EXERCISE_CLASSIFICATIONS, getExerciseClassification } from './exercise-classification-registry'
import type { WeakPointType } from './weak-point-engine'
import type { ProgressionNode, SkillGraphId, DifficultyLevel } from './skill-progression-graph-engine'

// Map DifficultyLevel to DifficultyBand for compatibility
function mapDifficultyLevelToBand(level: DifficultyLevel): DifficultyBand {
  const mapping: Record<DifficultyLevel, DifficultyBand> = {
    foundation: 'beginner',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    elite: 'elite',
    master: 'elite',
  }
  return mapping[level]
}

// =============================================================================
// BEST USE CASE DEFINITIONS
// =============================================================================

export type BestUseCase =
  | 'front_lever_strength_support'
  | 'front_lever_progression_prep'
  | 'back_lever_strength_support'
  | 'planche_strength_support'
  | 'planche_wrist_prep'
  | 'muscle_up_pulling_base'
  | 'muscle_up_transition_strength'
  | 'muscle_up_lockout_strength'
  | 'iron_cross_shoulder_prep'
  | 'iron_cross_ring_stability'
  | 'hspu_vertical_push_base'
  | 'hspu_shoulder_strength'
  | 'handstand_balance_prep'
  | 'l_sit_compression_development'
  | 'v_sit_compression_advancement'
  | 'one_arm_pull_up_strength_base'
  | 'weighted_strength_development'
  | 'ring_stability_development'
  | 'ring_dip_preparation'
  | 'scapular_control_development'
  | 'shoulder_stability_development'
  | 'tendon_preparation'
  | 'joint_integrity_maintenance'
  | 'hypertrophy_support'
  | 'general_strength_base'
  | 'compression_limiter_correction'
  | 'pull_strength_limiter_correction'
  | 'push_strength_limiter_correction'
  | 'scapular_limiter_correction'
  | 'explosive_power_development'
  | 'transition_strength_development'

export interface BestUseCaseDefinition {
  useCase: BestUseCase
  description: string
  targetSkills: SkillCarryover[]
  targetWeakPoints: WeakPointType[]
  priority: 'primary' | 'secondary' | 'auxiliary'
}

// =============================================================================
// CONTRAINDICATION DEFINITIONS
// =============================================================================

export type ContraindicationType =
  | 'low_ring_support_stability'
  | 'active_shoulder_instability'
  | 'active_elbow_irritation'
  | 'low_wrist_tolerance'
  | 'inadequate_straight_arm_strength'
  | 'poor_tendon_tolerance'
  | 'early_beginner_level'
  | 'high_fatigue_state'
  | 'recent_tendon_stress'
  | 'inadequate_compression_strength'
  | 'inadequate_scapular_control'
  | 'equipment_limitation'
  | 'progression_prerequisite_missing'

export interface Contraindication {
  type: ContraindicationType
  severity: 'absolute' | 'relative' | 'caution'
  description: string
  alternativeRecommendation: string
}

// =============================================================================
// ENHANCED EXERCISE PROFILE
// =============================================================================

export interface EnhancedExerciseProfile {
  exerciseId: string
  exerciseName: string
  
  // Best use cases - when is this exercise optimal
  bestUseCases: BestUseCaseDefinition[]
  
  // Contraindications - when to avoid
  contraindications: Contraindication[]
  
  // Prerequisite requirements
  prerequisites: {
    minimumExperienceLevel: DifficultyBand
    requiredCapabilities: string[]
    recommendedBenchmarks: Record<string, number>
  }
  
  // Joint stress profile
  jointStressProfile: {
    wrist: number    // 0-10
    shoulder: number // 0-10
    elbow: number    // 0-10
    lowBack: number  // 0-10
    overall: 'low' | 'moderate' | 'high' | 'very_high'
  }
  
  // Knowledge summary for explanations
  knowledgeSummary: {
    whyItWorks: string
    bestFor: string
    avoidWhen: string
    coachTip: string
  }
  
  // Substitution metadata
  substitutionPriority: number // 1-10, higher = better substitute
  preservesIntent: boolean
  preservesFamily: boolean
}

// =============================================================================
// ENHANCED EXERCISE PROFILES DATABASE
// =============================================================================

export const ENHANCED_EXERCISE_PROFILES: Record<string, EnhancedExerciseProfile> = {
  // =========================================================================
  // WEIGHTED PULLING
  // =========================================================================
  'weighted_pull_up': {
    exerciseId: 'weighted_pull_up',
    exerciseName: 'Weighted Pull-Up',
    bestUseCases: [
      {
        useCase: 'front_lever_strength_support',
        description: 'Builds the pulling strength foundation required for front lever holds',
        targetSkills: ['front_lever'],
        targetWeakPoints: ['pull_strength', 'straight_arm_pull_strength'],
        priority: 'primary',
      },
      {
        useCase: 'muscle_up_pulling_base',
        description: 'Develops explosive pulling capacity for muscle-up transitions',
        targetSkills: ['muscle_up'],
        targetWeakPoints: ['pull_strength', 'explosive_power'],
        priority: 'primary',
      },
      {
        useCase: 'one_arm_pull_up_strength_base',
        description: 'Progressive overload path toward unilateral pulling strength',
        targetSkills: ['one_arm_pull_up'],
        targetWeakPoints: ['pull_strength'],
        priority: 'primary',
      },
      {
        useCase: 'weighted_strength_development',
        description: 'General maximal pulling strength development',
        targetSkills: ['front_lever', 'muscle_up', 'one_arm_pull_up'],
        targetWeakPoints: ['pull_strength'],
        priority: 'secondary',
      },
    ],
    contraindications: [
      {
        type: 'early_beginner_level',
        severity: 'absolute',
        description: 'Requires solid bodyweight pull-up foundation (8+ reps)',
        alternativeRecommendation: 'Focus on bodyweight pull-ups until you can perform 8-10 clean reps',
      },
      {
        type: 'active_shoulder_instability',
        severity: 'relative',
        description: 'Added load increases shoulder demands significantly',
        alternativeRecommendation: 'Use bodyweight pull-ups with controlled tempo instead',
      },
      {
        type: 'active_elbow_irritation',
        severity: 'caution',
        description: 'Weighted pulling can aggravate elbow tendon issues',
        alternativeRecommendation: 'Reduce load or use neutral grip variation',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'intermediate',
      requiredCapabilities: ['8+ bodyweight pull-ups', 'healthy shoulder mobility'],
      recommendedBenchmarks: { pull_ups: 8, shoulder_mobility_score: 70 },
    },
    jointStressProfile: {
      wrist: 2,
      shoulder: 5,
      elbow: 4,
      lowBack: 1,
      overall: 'moderate',
    },
    knowledgeSummary: {
      whyItWorks: 'Progressive overload through external load develops maximal pulling strength that transfers to advanced lever and pulling skills.',
      bestFor: 'Athletes with solid pull-up base seeking strength gains for front lever, muscle-up, or one-arm pulling goals.',
      avoidWhen: 'You cannot perform 8+ clean bodyweight pull-ups, or have active shoulder/elbow discomfort.',
      coachTip: 'Start with 10-20% bodyweight added. Focus on controlled descent - the eccentric builds strength.',
    },
    substitutionPriority: 9,
    preservesIntent: true,
    preservesFamily: true,
  },

  'pull_up': {
    exerciseId: 'pull_up',
    exerciseName: 'Pull-Up',
    bestUseCases: [
      {
        useCase: 'general_strength_base',
        description: 'Foundational pulling pattern for all upper body goals',
        targetSkills: ['front_lever', 'muscle_up', 'one_arm_pull_up'],
        targetWeakPoints: ['pull_strength'],
        priority: 'primary',
      },
      {
        useCase: 'front_lever_progression_prep',
        description: 'Develops pulling endurance and control for lever work',
        targetSkills: ['front_lever'],
        targetWeakPoints: ['pull_strength'],
        priority: 'secondary',
      },
      {
        useCase: 'pull_strength_limiter_correction',
        description: 'Addresses pulling strength as a limiting factor',
        targetSkills: ['front_lever', 'muscle_up'],
        targetWeakPoints: ['pull_strength'],
        priority: 'primary',
      },
    ],
    contraindications: [
      {
        type: 'early_beginner_level',
        severity: 'relative',
        description: 'May need assistance if unable to perform any reps',
        alternativeRecommendation: 'Start with band-assisted pull-ups or Australian pull-ups',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['dead hang for 20+ seconds'],
      recommendedBenchmarks: { dead_hang: 20 },
    },
    jointStressProfile: {
      wrist: 2,
      shoulder: 3,
      elbow: 3,
      lowBack: 1,
      overall: 'low',
    },
    knowledgeSummary: {
      whyItWorks: 'The pull-up is the foundational vertical pulling pattern that develops lat strength, scapular control, and grip endurance.',
      bestFor: 'All athletes at any level seeking to build or maintain pulling capacity.',
      avoidWhen: 'You cannot hang for 20 seconds, or have acute shoulder pain.',
      coachTip: 'Focus on full range of motion - dead hang to chin over bar. Control both phases.',
    },
    substitutionPriority: 8,
    preservesIntent: true,
    preservesFamily: true,
  },

  // =========================================================================
  // RING EXERCISES
  // =========================================================================
  'ring_dip': {
    exerciseId: 'ring_dip',
    exerciseName: 'Ring Dip',
    bestUseCases: [
      {
        useCase: 'iron_cross_shoulder_prep',
        description: 'Builds ring stability and shoulder strength for cross work',
        targetSkills: ['iron_cross'],
        targetWeakPoints: ['ring_support_stability', 'shoulder_stability', 'dip_strength'],
        priority: 'primary',
      },
      {
        useCase: 'muscle_up_lockout_strength',
        description: 'Develops the pushing strength for muscle-up completion',
        targetSkills: ['muscle_up'],
        targetWeakPoints: ['dip_strength', 'push_strength'],
        priority: 'primary',
      },
      {
        useCase: 'ring_stability_development',
        description: 'Builds fundamental ring control under load',
        targetSkills: ['iron_cross', 'muscle_up'],
        targetWeakPoints: ['ring_support_stability'],
        priority: 'secondary',
      },
    ],
    contraindications: [
      {
        type: 'low_ring_support_stability',
        severity: 'absolute',
        description: 'Cannot maintain stable ring support for 30+ seconds',
        alternativeRecommendation: 'Build ring support hold to 45-60 seconds before attempting ring dips',
      },
      {
        type: 'active_shoulder_instability',
        severity: 'absolute',
        description: 'Ring dips place significant shoulder stability demands',
        alternativeRecommendation: 'Use parallel bar dips until shoulder stability improves',
      },
      {
        type: 'early_beginner_level',
        severity: 'absolute',
        description: 'Requires solid dip and ring support foundation',
        alternativeRecommendation: 'Master parallel bar dips and ring support hold first',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'intermediate',
      requiredCapabilities: ['10+ parallel bar dips', '45+ second ring support hold', 'healthy shoulders'],
      recommendedBenchmarks: { dips: 10, ring_support_hold: 45 },
    },
    jointStressProfile: {
      wrist: 2,
      shoulder: 7,
      elbow: 4,
      lowBack: 1,
      overall: 'high',
    },
    knowledgeSummary: {
      whyItWorks: 'Ring dips develop shoulder stability and pushing strength in an unstable environment, building the foundation for advanced ring skills.',
      bestFor: 'Athletes with solid dip base and ring support who want to progress toward muscle-ups or iron cross.',
      avoidWhen: 'You cannot hold a stable ring support for 45 seconds, or have shoulder instability.',
      coachTip: 'Keep rings turned out (RTO) at the top. Go deep only when you can maintain stability.',
    },
    substitutionPriority: 9,
    preservesIntent: true,
    preservesFamily: true,
  },

  'ring_push_up': {
    exerciseId: 'ring_push_up',
    exerciseName: 'Ring Push-Up',
    bestUseCases: [
      {
        useCase: 'ring_dip_preparation',
        description: 'Builds ring stability in a less demanding position',
        targetSkills: ['iron_cross', 'muscle_up'],
        targetWeakPoints: ['ring_support_stability', 'push_strength'],
        priority: 'primary',
      },
      {
        useCase: 'ring_stability_development',
        description: 'Develops fundamental ring control and pressing strength',
        targetSkills: ['iron_cross'],
        targetWeakPoints: ['ring_support_stability'],
        priority: 'primary',
      },
      {
        useCase: 'shoulder_stability_development',
        description: 'Builds dynamic shoulder stability in unstable environment',
        targetSkills: ['planche', 'iron_cross'],
        targetWeakPoints: ['shoulder_stability'],
        priority: 'secondary',
      },
    ],
    contraindications: [
      {
        type: 'active_shoulder_instability',
        severity: 'relative',
        description: 'Ring instability increases shoulder demands',
        alternativeRecommendation: 'Use floor push-ups until shoulder stability improves',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['15+ floor push-ups', 'basic ring familiarity'],
      recommendedBenchmarks: { push_ups: 15 },
    },
    jointStressProfile: {
      wrist: 2,
      shoulder: 4,
      elbow: 2,
      lowBack: 2,
      overall: 'moderate',
    },
    knowledgeSummary: {
      whyItWorks: 'Ring push-ups build shoulder stability and pressing strength in an unstable environment, preparing for ring dips and support work.',
      bestFor: 'Athletes transitioning from floor work to ring training, or building ring dip prerequisites.',
      avoidWhen: 'You cannot perform 15 clean floor push-ups, or have active shoulder issues.',
      coachTip: 'Turn rings out at the top (RTO). This builds the shoulder position needed for advanced ring skills.',
    },
    substitutionPriority: 8,
    preservesIntent: true,
    preservesFamily: true,
  },

  'ring_support_hold': {
    exerciseId: 'ring_support_hold',
    exerciseName: 'Ring Support Hold',
    bestUseCases: [
      {
        useCase: 'iron_cross_ring_stability',
        description: 'Fundamental ring stability for all advanced ring work',
        targetSkills: ['iron_cross'],
        targetWeakPoints: ['ring_support_stability', 'shoulder_stability'],
        priority: 'primary',
      },
      {
        useCase: 'ring_dip_preparation',
        description: 'Required prerequisite for safe ring dip progression',
        targetSkills: ['muscle_up', 'iron_cross'],
        targetWeakPoints: ['ring_support_stability'],
        priority: 'primary',
      },
      {
        useCase: 'tendon_preparation',
        description: 'Develops connective tissue tolerance for ring demands',
        targetSkills: ['iron_cross'],
        targetWeakPoints: ['tendon_tolerance', 'ring_support_stability'],
        priority: 'secondary',
      },
    ],
    contraindications: [],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['ability to mount rings'],
      recommendedBenchmarks: {},
    },
    jointStressProfile: {
      wrist: 1,
      shoulder: 5,
      elbow: 3,
      lowBack: 1,
      overall: 'moderate',
    },
    knowledgeSummary: {
      whyItWorks: 'The ring support hold builds fundamental shoulder stability and ring control that is prerequisite for all advanced ring skills.',
      bestFor: 'All ring training athletes. This is non-negotiable foundational work.',
      avoidWhen: 'Acute shoulder pain. Otherwise, everyone benefits from this exercise.',
      coachTip: 'Keep shoulders down and back, arms locked. Progress from neutral to rings turned out (RTO).',
    },
    substitutionPriority: 10,
    preservesIntent: true,
    preservesFamily: true,
  },

  // =========================================================================
  // COMPRESSION EXERCISES
  // =========================================================================
  'l_sit_hold': {
    exerciseId: 'l_sit_hold',
    exerciseName: 'L-Sit Hold',
    bestUseCases: [
      {
        useCase: 'l_sit_compression_development',
        description: 'Direct skill practice for L-sit mastery',
        targetSkills: ['l_sit', 'v_sit'],
        targetWeakPoints: ['compression_strength', 'core_control'],
        priority: 'primary',
      },
      {
        useCase: 'compression_limiter_correction',
        description: 'Addresses compression as a limiting factor for front lever and planche',
        targetSkills: ['front_lever', 'planche', 'l_sit', 'v_sit'],
        targetWeakPoints: ['compression_strength'],
        priority: 'primary',
      },
      {
        useCase: 'front_lever_progression_prep',
        description: 'Builds compression capacity needed for lever positions',
        targetSkills: ['front_lever'],
        targetWeakPoints: ['compression_strength', 'core_control'],
        priority: 'secondary',
      },
    ],
    contraindications: [
      {
        type: 'low_wrist_tolerance',
        severity: 'relative',
        description: 'Floor L-sits place wrist demands',
        alternativeRecommendation: 'Use parallettes to reduce wrist extension',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['seated compression ability'],
      recommendedBenchmarks: {},
    },
    jointStressProfile: {
      wrist: 4,
      shoulder: 3,
      elbow: 2,
      lowBack: 2,
      overall: 'moderate',
    },
    knowledgeSummary: {
      whyItWorks: 'The L-sit develops hip flexor strength and compression capacity that transfers to front lever, V-sit, and planche.',
      bestFor: 'Athletes building compression strength for any lever skill or addressing compression as a limiter.',
      avoidWhen: 'Significant wrist limitation - use parallettes instead.',
      coachTip: 'Push shoulders down hard, lock arms, and lift legs as high as possible. Quality over duration.',
    },
    substitutionPriority: 9,
    preservesIntent: true,
    preservesFamily: true,
  },

  'hanging_leg_raise': {
    exerciseId: 'hanging_leg_raise',
    exerciseName: 'Hanging Leg Raise',
    bestUseCases: [
      {
        useCase: 'compression_limiter_correction',
        description: 'Builds compression strength in a hanging position',
        targetSkills: ['front_lever', 'l_sit', 'v_sit'],
        targetWeakPoints: ['compression_strength', 'core_control'],
        priority: 'primary',
      },
      {
        useCase: 'front_lever_progression_prep',
        description: 'Develops compression under straight-arm pulling demands',
        targetSkills: ['front_lever'],
        targetWeakPoints: ['compression_strength'],
        priority: 'primary',
      },
    ],
    contraindications: [
      {
        type: 'inadequate_compression_strength',
        severity: 'relative',
        description: 'May swing or use momentum if compression is very weak',
        alternativeRecommendation: 'Start with knee raises or lying leg raises',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['30 second dead hang', 'basic core control'],
      recommendedBenchmarks: { dead_hang: 30 },
    },
    jointStressProfile: {
      wrist: 2,
      shoulder: 3,
      elbow: 2,
      lowBack: 3,
      overall: 'low',
    },
    knowledgeSummary: {
      whyItWorks: 'Hanging leg raises build compression strength while also loading the grip and shoulders, mimicking front lever demands.',
      bestFor: 'Athletes working toward front lever or addressing compression weakness.',
      avoidWhen: 'Cannot maintain a still hang - start with lying variations.',
      coachTip: 'Keep legs straight, control the descent. Eliminate all swing before adding reps.',
    },
    substitutionPriority: 8,
    preservesIntent: true,
    preservesFamily: true,
  },

  // =========================================================================
  // SCAPULAR CONTROL
  // =========================================================================
  'scap_pull_up': {
    exerciseId: 'scap_pull_up',
    exerciseName: 'Scapular Pull-Up',
    bestUseCases: [
      {
        useCase: 'scapular_control_development',
        description: 'Develops scapular depression and retraction strength',
        targetSkills: ['front_lever', 'muscle_up'],
        targetWeakPoints: ['scapular_control'],
        priority: 'primary',
      },
      {
        useCase: 'scapular_limiter_correction',
        description: 'Addresses scapular control as a limiting factor',
        targetSkills: ['front_lever', 'muscle_up', 'back_lever'],
        targetWeakPoints: ['scapular_control'],
        priority: 'primary',
      },
      {
        useCase: 'front_lever_progression_prep',
        description: 'Builds the scapular control required for lever positions',
        targetSkills: ['front_lever'],
        targetWeakPoints: ['scapular_control'],
        priority: 'secondary',
      },
    ],
    contraindications: [],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['dead hang'],
      recommendedBenchmarks: {},
    },
    jointStressProfile: {
      wrist: 1,
      shoulder: 3,
      elbow: 1,
      lowBack: 1,
      overall: 'low',
    },
    knowledgeSummary: {
      whyItWorks: 'Scapular pull-ups isolate the scapular depression pattern required for front lever and muscle-up initiation.',
      bestFor: 'All athletes, especially those with scapular control weakness or working on front lever.',
      avoidWhen: 'Almost never - this is safe for all levels.',
      coachTip: 'Keep arms straight. Focus only on pulling shoulders down and back. Small range, big impact.',
    },
    substitutionPriority: 10,
    preservesIntent: true,
    preservesFamily: true,
  },

  // =========================================================================
  // PLANCHE WORK
  // =========================================================================
  'planche_lean': {
    exerciseId: 'planche_lean',
    exerciseName: 'Planche Lean',
    bestUseCases: [
      {
        useCase: 'planche_strength_support',
        description: 'Builds straight-arm pushing strength and shoulder protraction',
        targetSkills: ['planche'],
        targetWeakPoints: ['straight_arm_push_strength', 'shoulder_stability'],
        priority: 'primary',
      },
      {
        useCase: 'planche_wrist_prep',
        description: 'Progressively loads wrists for planche demands',
        targetSkills: ['planche'],
        targetWeakPoints: ['wrist_tolerance'],
        priority: 'secondary',
      },
      {
        useCase: 'tendon_preparation',
        description: 'Develops bicep and shoulder tendon tolerance',
        targetSkills: ['planche'],
        targetWeakPoints: ['tendon_tolerance'],
        priority: 'secondary',
      },
    ],
    contraindications: [
      {
        type: 'low_wrist_tolerance',
        severity: 'relative',
        description: 'Significant wrist loading in extension',
        alternativeRecommendation: 'Start with wrist prep and use parallettes to reduce extension',
      },
      {
        type: 'inadequate_straight_arm_strength',
        severity: 'caution',
        description: 'Arms must remain locked throughout',
        alternativeRecommendation: 'Build push-up strength and focus on elbow lockout',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'beginner',
      requiredCapabilities: ['30+ push-ups', 'wrist extension tolerance'],
      recommendedBenchmarks: { push_ups: 30 },
    },
    jointStressProfile: {
      wrist: 6,
      shoulder: 4,
      elbow: 3,
      lowBack: 2,
      overall: 'moderate',
    },
    knowledgeSummary: {
      whyItWorks: 'Planche leans progressively load the shoulders and wrists in the planche position while keeping feet grounded.',
      bestFor: 'Athletes beginning planche training or building the foundational strength and tolerance.',
      avoidWhen: 'Wrist pain during the exercise - use parallettes or reduce lean angle.',
      coachTip: 'Lock elbows, protract shoulders, lean forward slowly. Stop when arms begin to bend.',
    },
    substitutionPriority: 9,
    preservesIntent: true,
    preservesFamily: true,
  },

  // =========================================================================
  // DIPS
  // =========================================================================
  'straight_bar_dip': {
    exerciseId: 'straight_bar_dip',
    exerciseName: 'Straight Bar Dip',
    bestUseCases: [
      {
        useCase: 'muscle_up_lockout_strength',
        description: 'Specific strength for muscle-up transition and lockout',
        targetSkills: ['muscle_up'],
        targetWeakPoints: ['dip_strength', 'transition_strength'],
        priority: 'primary',
      },
      {
        useCase: 'transition_strength_development',
        description: 'Builds the specific pushing pattern for bar muscle-up',
        targetSkills: ['muscle_up'],
        targetWeakPoints: ['transition_strength'],
        priority: 'primary',
      },
    ],
    contraindications: [
      {
        type: 'active_shoulder_instability',
        severity: 'relative',
        description: 'Requires good shoulder stability in deep flexion',
        alternativeRecommendation: 'Build parallel bar dip strength first',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'intermediate',
      requiredCapabilities: ['10+ parallel bar dips', 'shoulder mobility'],
      recommendedBenchmarks: { dips: 10 },
    },
    jointStressProfile: {
      wrist: 3,
      shoulder: 5,
      elbow: 3,
      lowBack: 2,
      overall: 'moderate',
    },
    knowledgeSummary: {
      whyItWorks: 'Straight bar dips train the exact pushing pattern used in the muscle-up transition and lockout phase.',
      bestFor: 'Athletes specifically training for bar muscle-up.',
      avoidWhen: 'Cannot perform 10+ parallel bar dips, or have shoulder mobility limitations.',
      coachTip: 'Lean forward over the bar, push through to full lockout. This builds muscle-up specific strength.',
    },
    substitutionPriority: 9,
    preservesIntent: true,
    preservesFamily: true,
  },

  'weighted_dip': {
    exerciseId: 'weighted_dip',
    exerciseName: 'Weighted Dip',
    bestUseCases: [
      {
        useCase: 'push_strength_limiter_correction',
        description: 'Maximal pushing strength development',
        targetSkills: ['muscle_up', 'hspu'],
        targetWeakPoints: ['dip_strength', 'push_strength'],
        priority: 'primary',
      },
      {
        useCase: 'weighted_strength_development',
        description: 'Progressive overload for upper body pushing',
        targetSkills: ['muscle_up', 'hspu', 'planche'],
        targetWeakPoints: ['dip_strength', 'push_strength'],
        priority: 'primary',
      },
    ],
    contraindications: [
      {
        type: 'early_beginner_level',
        severity: 'absolute',
        description: 'Requires solid bodyweight dip foundation',
        alternativeRecommendation: 'Build to 15+ bodyweight dips first',
      },
      {
        type: 'active_shoulder_instability',
        severity: 'relative',
        description: 'Added load increases shoulder demands',
        alternativeRecommendation: 'Use bodyweight dips with controlled tempo',
      },
    ],
    prerequisites: {
      minimumExperienceLevel: 'intermediate',
      requiredCapabilities: ['15+ bodyweight dips', 'healthy shoulders'],
      recommendedBenchmarks: { dips: 15 },
    },
    jointStressProfile: {
      wrist: 2,
      shoulder: 6,
      elbow: 4,
      lowBack: 2,
      overall: 'high',
    },
    knowledgeSummary: {
      whyItWorks: 'Weighted dips develop maximal pushing strength that transfers to muscle-up lockout, HSPU, and ring work.',
      bestFor: 'Athletes with solid dip base seeking strength gains for pushing skills.',
      avoidWhen: 'Cannot perform 15+ clean bodyweight dips, or have shoulder discomfort.',
      coachTip: 'Start with 10-15% bodyweight added. Full range of motion - deep to full lockout.',
    },
    substitutionPriority: 9,
    preservesIntent: true,
    preservesFamily: true,
  },
}

// =============================================================================
// EXERCISE INTELLIGENCE FUNCTIONS
// =============================================================================

/**
 * Get enhanced profile for an exercise
 */
export function getEnhancedExerciseProfile(exerciseId: string): EnhancedExerciseProfile | null {
  return ENHANCED_EXERCISE_PROFILES[exerciseId] || null
}

/**
 * Check if an exercise has contraindications for the current athlete context
 */
export interface AthleteExerciseContext {
  experienceLevel: DifficultyBand
  ringsSupportHoldSeconds?: number
  pullUps?: number
  dips?: number
  pushUps?: number
  hasShoulderInstability?: boolean
  hasElbowIrritation?: boolean
  hasWristDiscomfort?: boolean
  fatigueLevel?: 'low' | 'moderate' | 'high'
  tendonStressLevel?: 'low' | 'moderate' | 'high'
}

export function checkContraindications(
  exerciseId: string,
  context: AthleteExerciseContext
): Contraindication[] {
  const profile = getEnhancedExerciseProfile(exerciseId)
  if (!profile) return []
  
  const triggered: Contraindication[] = []
  
  for (const contraindication of profile.contraindications) {
    let isTriggered = false
    
    switch (contraindication.type) {
      case 'low_ring_support_stability':
        isTriggered = (context.ringsSupportHoldSeconds ?? 0) < 30
        break
      case 'active_shoulder_instability':
        isTriggered = context.hasShoulderInstability === true
        break
      case 'active_elbow_irritation':
        isTriggered = context.hasElbowIrritation === true
        break
      case 'low_wrist_tolerance':
        isTriggered = context.hasWristDiscomfort === true
        break
      case 'early_beginner_level':
        isTriggered = context.experienceLevel === 'beginner'
        break
      case 'high_fatigue_state':
        isTriggered = context.fatigueLevel === 'high'
        break
      case 'recent_tendon_stress':
        isTriggered = context.tendonStressLevel === 'high'
        break
    }
    
    if (isTriggered) {
      triggered.push(contraindication)
    }
  }
  
  return triggered
}

/**
 * Get best exercises for a specific use case
 */
export function getExercisesForUseCase(useCase: BestUseCase): EnhancedExerciseProfile[] {
  const matching: EnhancedExerciseProfile[] = []
  
  for (const profile of Object.values(ENHANCED_EXERCISE_PROFILES)) {
    if (profile.bestUseCases.some(uc => uc.useCase === useCase)) {
      matching.push(profile)
    }
  }
  
  // Sort by priority within the use case
  return matching.sort((a, b) => {
    const aUseCase = a.bestUseCases.find(uc => uc.useCase === useCase)
    const bUseCase = b.bestUseCases.find(uc => uc.useCase === useCase)
    const priorityOrder = { primary: 0, secondary: 1, auxiliary: 2 }
    return (priorityOrder[aUseCase?.priority || 'auxiliary']) - (priorityOrder[bUseCase?.priority || 'auxiliary'])
  })
}

/**
 * Get exercises that target a specific weak point
 */
export function getExercisesForWeakPoint(weakPoint: WeakPointType): EnhancedExerciseProfile[] {
  const matching: EnhancedExerciseProfile[] = []
  
  for (const profile of Object.values(ENHANCED_EXERCISE_PROFILES)) {
    const matchingUseCases = profile.bestUseCases.filter(uc => 
      uc.targetWeakPoints.includes(weakPoint)
    )
    
    if (matchingUseCases.length > 0) {
      matching.push(profile)
    }
  }
  
  return matching
}

/**
 * Generate "why this exercise" explanation
 */
export interface WhyThisExerciseExplanation {
  exerciseId: string
  exerciseName: string
  headline: string
  rationale: string
  skillBenefit: string
  coachTip: string
  confidenceLevel: 'high' | 'medium' | 'low'
}

export function generateWhyThisExercise(
  exerciseId: string,
  targetSkill?: SkillCarryover,
  primaryWeakPoint?: WeakPointType
): WhyThisExerciseExplanation | null {
  const profile = getEnhancedExerciseProfile(exerciseId)
  const classification = getExerciseClassification(exerciseId)
  
  if (!profile && !classification) return null
  
  const exerciseName = profile?.exerciseName || classification?.name || exerciseId
  
  // Find most relevant use case
  let relevantUseCase: BestUseCaseDefinition | null = null
  let confidenceLevel: 'high' | 'medium' | 'low' = 'low'
  
  if (profile) {
    // First priority: matches both skill and weak point
    if (targetSkill && primaryWeakPoint) {
      relevantUseCase = profile.bestUseCases.find(uc =>
        uc.targetSkills.includes(targetSkill) && uc.targetWeakPoints.includes(primaryWeakPoint)
      ) || null
      if (relevantUseCase) confidenceLevel = 'high'
    }
    
    // Second priority: matches skill
    if (!relevantUseCase && targetSkill) {
      relevantUseCase = profile.bestUseCases.find(uc =>
        uc.targetSkills.includes(targetSkill)
      ) || null
      if (relevantUseCase) confidenceLevel = 'medium'
    }
    
    // Third priority: matches weak point
    if (!relevantUseCase && primaryWeakPoint) {
      relevantUseCase = profile.bestUseCases.find(uc =>
        uc.targetWeakPoints.includes(primaryWeakPoint)
      ) || null
      if (relevantUseCase) confidenceLevel = 'medium'
    }
    
    // Fallback: primary use case
    if (!relevantUseCase && profile.bestUseCases.length > 0) {
      relevantUseCase = profile.bestUseCases.find(uc => uc.priority === 'primary') || profile.bestUseCases[0]
      confidenceLevel = 'low'
    }
  }
  
  // Build explanation
  let headline = ''
  let rationale = ''
  let skillBenefit = ''
  
  if (relevantUseCase) {
    headline = relevantUseCase.description
    rationale = profile?.knowledgeSummary.whyItWorks || relevantUseCase.description
    skillBenefit = `Transfers to ${relevantUseCase.targetSkills.map(s => s.replace(/_/g, ' ')).join(', ')}.`
  } else if (classification) {
    headline = `${classification.primaryIntent.charAt(0).toUpperCase() + classification.primaryIntent.slice(1)} exercise for ${classification.primaryFamily.replace(/_/g, ' ')}.`
    rationale = `This exercise targets the ${classification.primaryFamily.replace(/_/g, ' ')} movement pattern.`
    skillBenefit = classification.skillCarryover?.length 
      ? `Transfers to ${classification.skillCarryover.map(s => s.replace(/_/g, ' ')).join(', ')}.`
      : 'General strength and conditioning benefit.'
  } else {
    headline = 'Selected based on your training needs.'
    rationale = 'This exercise supports your current training goals.'
    skillBenefit = 'Contributes to overall skill development.'
  }
  
  return {
    exerciseId,
    exerciseName,
    headline,
    rationale,
    skillBenefit,
    coachTip: profile?.knowledgeSummary.coachTip || 'Focus on quality movement throughout each rep.',
    confidenceLevel,
  }
}

/**
 * Score a substitution for quality
 */
export interface SubstitutionQualityScore {
  originalExerciseId: string
  substituteExerciseId: string
  qualityScore: number // 0-100
  qualityLevel: 'excellent' | 'good' | 'acceptable' | 'poor'
  preserves: {
    movementFamily: boolean
    trainingIntent: boolean
    skillCarryover: boolean
    difficultyLevel: boolean
    jointStressProfile: boolean
  }
  warningLevel: 'none' | 'info' | 'warning' | 'danger'
  warningMessage: string | null
}

export function scoreSubstitution(
  originalExerciseId: string,
  substituteExerciseId: string,
  targetSkill?: SkillCarryover
): SubstitutionQualityScore {
  const originalProfile = getEnhancedExerciseProfile(originalExerciseId)
  const originalClassification = getExerciseClassification(originalExerciseId)
  const substituteProfile = getEnhancedExerciseProfile(substituteExerciseId)
  const substituteClassification = getExerciseClassification(substituteExerciseId)
  
  let score = 0
  const preserves = {
    movementFamily: false,
    trainingIntent: false,
    skillCarryover: false,
    difficultyLevel: false,
    jointStressProfile: false,
  }
  
  // Movement family match (30 points)
  if (originalClassification && substituteClassification) {
    if (substituteClassification.primaryFamily === originalClassification.primaryFamily) {
      score += 30
      preserves.movementFamily = true
    } else if (originalClassification.secondaryFamilies?.includes(substituteClassification.primaryFamily)) {
      score += 15
    }
  }
  
  // Training intent match (25 points)
  if (originalClassification && substituteClassification) {
    if (substituteClassification.primaryIntent === originalClassification.primaryIntent) {
      score += 25
      preserves.trainingIntent = true
    } else if (substituteClassification.intents.includes(originalClassification.primaryIntent)) {
      score += 15
    }
  }
  
  // Skill carryover match (25 points)
  if (originalClassification && substituteClassification && targetSkill) {
    const originalHasCarryover = originalClassification.skillCarryover?.includes(targetSkill)
    const substituteHasCarryover = substituteClassification.skillCarryover?.includes(targetSkill)
    
    if (originalHasCarryover && substituteHasCarryover) {
      score += 25
      preserves.skillCarryover = true
    } else if (substituteHasCarryover) {
      score += 15
    }
  } else {
    score += 10 // Default partial credit
  }
  
  // Difficulty match (10 points)
  if (originalClassification && substituteClassification) {
    if (substituteClassification.difficulty === originalClassification.difficulty) {
      score += 10
      preserves.difficultyLevel = true
    } else {
      const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
      const diff = Math.abs(
        difficultyOrder.indexOf(originalClassification.difficulty) -
        difficultyOrder.indexOf(substituteClassification.difficulty)
      )
      if (diff === 1) score += 5
    }
  }
  
  // Joint stress match (10 points)
  if (originalProfile && substituteProfile) {
    const originalStress = originalProfile.jointStressProfile.overall
    const substituteStress = substituteProfile.jointStressProfile.overall
    
    if (originalStress === substituteStress) {
      score += 10
      preserves.jointStressProfile = true
    } else {
      const stressOrder = ['low', 'moderate', 'high', 'very_high']
      const diff = Math.abs(
        stressOrder.indexOf(originalStress) - stressOrder.indexOf(substituteStress)
      )
      if (diff === 1) score += 5
    }
  } else {
    score += 5 // Default partial credit
  }
  
  // Determine quality level and warning
  let qualityLevel: SubstitutionQualityScore['qualityLevel']
  let warningLevel: SubstitutionQualityScore['warningLevel'] = 'none'
  let warningMessage: string | null = null
  
  if (score >= 80) {
    qualityLevel = 'excellent'
  } else if (score >= 60) {
    qualityLevel = 'good'
  } else if (score >= 40) {
    qualityLevel = 'acceptable'
    warningLevel = 'info'
    warningMessage = 'This substitution may not fully preserve your original training intent.'
  } else {
    qualityLevel = 'poor'
    warningLevel = 'warning'
    warningMessage = 'This exercise differs significantly from the original. Consider a closer alternative.'
  }
  
  // Check for danger-level warnings
  if (!preserves.skillCarryover && targetSkill) {
    warningLevel = 'warning'
    warningMessage = `This exercise may not transfer as well to ${targetSkill.replace(/_/g, ' ')}.`
  }
  
  return {
    originalExerciseId,
    substituteExerciseId,
    qualityScore: score,
    qualityLevel,
    preserves,
    warningLevel,
    warningMessage,
  }
}

/**
 * Generate override warning message
 */
export function generateOverrideWarning(
  originalExerciseId: string,
  overrideExerciseId: string,
  targetSkill?: SkillCarryover,
  athleteContext?: AthleteExerciseContext
): { shouldWarn: boolean; message: string; severity: 'info' | 'warning' | 'danger' } {
  const substitutionScore = scoreSubstitution(originalExerciseId, overrideExerciseId, targetSkill)
  const overrideContraindications = athleteContext 
    ? checkContraindications(overrideExerciseId, athleteContext)
    : []
  
  // Check for absolute contraindications
  const absoluteContraindications = overrideContraindications.filter(c => c.severity === 'absolute')
  if (absoluteContraindications.length > 0) {
    return {
      shouldWarn: true,
      message: absoluteContraindications[0].description + ' ' + absoluteContraindications[0].alternativeRecommendation,
      severity: 'danger',
    }
  }
  
  // Check for relative contraindications
  const relativeContraindications = overrideContraindications.filter(c => c.severity === 'relative')
  if (relativeContraindications.length > 0) {
    return {
      shouldWarn: true,
      message: relativeContraindications[0].description + ' ' + relativeContraindications[0].alternativeRecommendation,
      severity: 'warning',
    }
  }
  
  // Check substitution quality
  if (substitutionScore.qualityLevel === 'poor') {
    const originalProfile = getEnhancedExerciseProfile(originalExerciseId)
    const originalName = originalProfile?.exerciseName || originalExerciseId
    
    return {
      shouldWarn: true,
      message: `SpartanLab recommended ${originalName} because it better matches your current training goals. ${substitutionScore.warningMessage || ''}`,
      severity: 'warning',
    }
  }
  
  if (substitutionScore.qualityLevel === 'acceptable') {
    return {
      shouldWarn: true,
      message: substitutionScore.warningMessage || 'This substitution may affect your training outcomes.',
      severity: 'info',
    }
  }
  
  return {
    shouldWarn: false,
    message: '',
    severity: 'info',
  }
}

// =============================================================================
// PROGRESSION GRAPH INTEGRATION
// =============================================================================

/**
 * Get exercises appropriate for a progression node
 */
export function getExercisesForProgressionNode(
  node: ProgressionNode,
  skillId: SkillGraphId
): EnhancedExerciseProfile[] {
  const results: EnhancedExerciseProfile[] = []
  
  // Map skill graph ID to skill carryover type
  const skillCarryover = skillId as SkillCarryover
  
  for (const profile of Object.values(ENHANCED_EXERCISE_PROFILES)) {
    const matchingUseCases = profile.bestUseCases.filter(uc =>
      uc.targetSkills.includes(skillCarryover)
    )
    
    if (matchingUseCases.length > 0) {
      // Check if appropriate for the node's difficulty level
      const nodeLevelBand = mapDifficultyLevelToBand(node.difficultyLevel)
      const prereqs = profile.prerequisites
      
      const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
      const nodeLevelIdx = difficultyOrder.indexOf(nodeLevelBand)
      const exerciseLevelIdx = difficultyOrder.indexOf(prereqs.minimumExperienceLevel)
      
      // Exercise should be at or below the node's level
      if (exerciseLevelIdx <= nodeLevelIdx + 1) {
        results.push(profile)
      }
    }
  }
  
  return results
}

/**
 * Get prerequisite exercises for a blocked node
 */
export function getPrerequisiteExercises(
  blockedNode: ProgressionNode,
  blockingReasons: string[]
): EnhancedExerciseProfile[] {
  const results: EnhancedExerciseProfile[] = []
  
  // Map blocking reasons to weak points
  const weakPointMap: Record<string, WeakPointType[]> = {
    'pulling strength': ['pull_strength', 'straight_arm_pull_strength'],
    'pushing strength': ['push_strength', 'straight_arm_push_strength', 'dip_strength'],
    'compression': ['compression_strength', 'core_control'],
    'scapular control': ['scapular_control'],
    'ring support': ['ring_support_stability'],
    'shoulder stability': ['shoulder_stability'],
    'tendon': ['tendon_tolerance', 'wrist_tolerance'],
    'wrist': ['wrist_tolerance'],
  }
  
  const targetWeakPoints: WeakPointType[] = []
  
  for (const reason of blockingReasons) {
    const lowerReason = reason.toLowerCase()
    for (const [keyword, weakPoints] of Object.entries(weakPointMap)) {
      if (lowerReason.includes(keyword)) {
        targetWeakPoints.push(...weakPoints)
      }
    }
  }
  
  // Find exercises targeting these weak points
  for (const weakPoint of [...new Set(targetWeakPoints)]) {
    const exercises = getExercisesForWeakPoint(weakPoint)
    results.push(...exercises)
  }
  
  // Deduplicate
  const seen = new Set<string>()
  return results.filter(profile => {
    if (seen.has(profile.exerciseId)) return false
    seen.add(profile.exerciseId)
    return true
  })
}

// =============================================================================
// WEIGHTED SKILL INTEGRATION
// =============================================================================

import {
  WEIGHTED_SKILL_PROFILES,
  getTempoRecommendation,
  checkWeightedSkillPrerequisites,
  generateWeightedSkillExplanation,
  type WeightedSkillId,
  type WeightedSkillProfile,
} from './weighted-skill-systems-engine'

/**
 * Get recommended weighted exercises for a given skill target
 */
export function getWeightedExercisesForSkillTarget(
  targetSkill: SkillGraphId,
  context: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    benchmarks: Record<string, number>
    skillsAcquired: string[]
    activeJointIssues: string[]
    currentFramework?: string
  }
): {
  recommended: WeightedSkillProfile[]
  tempoAlternatives: WeightedSkillProfile[]
  notYetAvailable: { skill: WeightedSkillProfile; missingPrereqs: string[] }[]
} {
  const recommended: WeightedSkillProfile[] = []
  const tempoAlternatives: WeightedSkillProfile[] = []
  const notYetAvailable: { skill: WeightedSkillProfile; missingPrereqs: string[] }[] = []
  
  for (const [, profile] of Object.entries(WEIGHTED_SKILL_PROFILES)) {
    // Check if this weighted skill supports the target
    if (!profile.skillCarryover.includes(targetSkill) && 
        profile.parentSkill !== targetSkill) {
      continue
    }
    
    // Check prerequisites
    const prereqCheck = checkWeightedSkillPrerequisites(profile.weightedSkillId, {
      experienceLevel: context.experienceLevel,
      benchmarks: context.benchmarks,
      activeJointIssues: context.activeJointIssues,
      skillsAcquired: context.skillsAcquired,
    })
    
    if (prereqCheck.eligible) {
      if (profile.weightedProgressionType === 'tempo_control') {
        tempoAlternatives.push(profile)
      } else {
        recommended.push(profile)
      }
    } else if (prereqCheck.readinessScore >= 50) {
      notYetAvailable.push({
        skill: profile,
        missingPrereqs: prereqCheck.missingPrerequisites,
      })
    }
  }
  
  return { recommended, tempoAlternatives, notYetAvailable }
}

/**
 * Generate enhanced "why this exercise" explanation for weighted skills
 */
export function generateWhyThisWeightedExercise(
  skillId: WeightedSkillId,
  context: {
    primaryGoal: SkillGraphId | string
    currentFramework: string
    primaryWeakPoint?: WeakPointType
    fatigueLevel?: 'fresh' | 'normal' | 'fatigued'
  }
): WhyThisExerciseExplanation {
  const weightedExplanation = generateWeightedSkillExplanation(skillId, {
    primaryGoal: context.primaryGoal as SkillGraphId,
    currentFramework: context.currentFramework as any,
    primaryWeakPoint: context.primaryWeakPoint,
  })
  
  const tempoRec = getTempoRecommendation(skillId, {
    primaryWeakPoint: context.primaryWeakPoint,
    currentGoal: 'strength',
    fatigueLevel: context.fatigueLevel || 'normal',
    isDeloadWeek: false,
  })
  
  let coachTip = weightedExplanation.safetyConsiderations[0] || 'Progress conservatively with external load.'
  if (tempoRec.recommended) {
    coachTip = `Consider tempo work: ${tempoRec.rationale}`
  }
  
  return {
    exerciseId: skillId,
    exerciseName: WEIGHTED_SKILL_PROFILES[skillId].displayName,
    headline: weightedExplanation.headline,
    rationale: weightedExplanation.rationale,
    skillBenefit: weightedExplanation.benefitsForGoal.join('. '),
    coachTip,
    confidenceLevel: 'high',
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  ENHANCED_EXERCISE_PROFILES,
  getEnhancedExerciseProfile,
  checkContraindications,
  getExercisesForUseCase,
  getExercisesForWeakPoint,
  generateWhyThisExercise,
  scoreSubstitution,
  generateOverrideWarning,
  getExercisesForProgressionNode,
  getPrerequisiteExercises,
  // Weighted skill integration
  getWeightedExercisesForSkillTarget,
  generateWhyThisWeightedExercise,
}
