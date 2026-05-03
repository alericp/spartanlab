/**
 * Weighted Skill Systems Engine
 * 
 * Comprehensive system for programming weighted calisthenics and tempo-based
 * skill-strength progressions. Supports:
 * - Weighted muscle-up, pull-up, dip pathways
 * - Slow muscle-up and tempo-controlled work
 * - Strength conversion programming
 * - Elite weighted calisthenics approaches
 * 
 * DESIGN PHILOSOPHY:
 * Weighted calisthenics is not just "add weight." This system models:
 * - Strength conversion (bodyweight → weighted → skill carryover)
 * - Tempo control (transition quality, positional strength)
 * - Leverage-specific carryover
 * - Joint/tendon tolerance
 */

import type { CoachingFrameworkId } from './coaching-framework-engine'
import type { SkillGraphId } from './skill-progression-graph-engine'
import type { WeakPointType } from './weak-point-engine'

// =============================================================================
// WEIGHTED SKILL TYPES
// =============================================================================

export type WeightedSkillId =
  | 'weighted_pullup'
  | 'weighted_chinup'
  | 'weighted_dip'
  | 'weighted_ring_dip'
  | 'weighted_muscle_up'
  | 'slow_muscle_up'
  | 'tempo_muscle_up'
  | 'weighted_front_lever_row'
  | 'tempo_pullup'
  | 'tempo_dip'
  | 'tempo_front_lever_row'
  | 'tempo_pseudo_planche_pushup'
  | 'straight_bar_dip'

export type WeightedProgressionType =
  | 'pure_weighted'           // Add load to basics
  | 'skill_carryover'         // Weighted basics for skill transfer
  | 'tempo_control'           // Tempo/slow reps for control
  | 'heavy_skill'             // Heavy advanced weighted skills

export type TempoType =
  | 'standard'                // Normal rep speed
  | 'slow_concentric'         // 3-5s up
  | 'slow_eccentric'          // 3-5s down
  | 'slow_both'               // 3-5s each direction
  | 'pause_top'               // 2-3s hold at top
  | 'pause_bottom'            // 2-3s hold at bottom
  | 'full_control'            // 5+ seconds full range

export type JointStressCategory = 'minimal' | 'low' | 'moderate' | 'high' | 'very_high'

// =============================================================================
// WEIGHTED SKILL PROFILE
// =============================================================================

export interface WeightedSkillProfile {
  weightedSkillId: WeightedSkillId
  displayName: string
  description: string
  parentSkill: SkillGraphId | 'general_pulling' | 'general_pushing'
  movementFamilies: string[]
  weightedProgressionType: WeightedProgressionType
  tempoSupportTypes: TempoType[]
  
  // Prerequisites
  prerequisites: WeightedSkillPrerequisites
  
  // Stress profile
  jointStressProfile: {
    shoulder: JointStressCategory
    elbow: JointStressCategory
    wrist: JointStressCategory
    sternum: JointStressCategory
  }
  
  // Framework compatibility
  bestFrameworks: CoachingFrameworkId[]
  avoidFrameworks: CoachingFrameworkId[]
  
  // Readiness factors
  readinessFactors: {
    factor: string
    weight: number
  }[]
  
  // Best use cases
  bestUseCases: string[]
  skillCarryover: SkillGraphId[]
  
  // Programming parameters
  defaultRepRange: { min: number; max: number }
  defaultSetRange: { min: number; max: number }
  restSecondsMin: number
  restSecondsMax: number
  maxWeeklyFrequency: number
  loadProgressionRate: 'slow' | 'moderate' | 'fast'
}

export interface WeightedSkillPrerequisites {
  minimumReps: number                // Bodyweight reps before loading
  minimumHoldTime?: number           // For static prereqs (seconds)
  requiredSkills: string[]           // Skill names required
  requiredStrengthBenchmarks: {
    exercise: string
    metric: 'reps' | 'weight' | 'hold_time'
    minimumValue: number
    unit: string
  }[]
  jointToleranceFlags: string[]      // Flags that prevent access
  minimumExperienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

// =============================================================================
// WEIGHTED SKILL PROFILES REGISTRY
// =============================================================================

export const WEIGHTED_SKILL_PROFILES: Record<WeightedSkillId, WeightedSkillProfile> = {
  weighted_pullup: {
    weightedSkillId: 'weighted_pullup',
    displayName: 'Weighted Pull-Up',
    description: 'Pull-up with added external load for strength development',
    parentSkill: 'general_pulling',
    movementFamilies: ['vertical_pull'],
    weightedProgressionType: 'skill_carryover',
    tempoSupportTypes: ['standard', 'slow_eccentric', 'pause_top'],
    prerequisites: {
      minimumReps: 8,
      requiredSkills: ['pull_up'],
      requiredStrengthBenchmarks: [
        { exercise: 'pull_up', metric: 'reps', minimumValue: 8, unit: 'reps' },
      ],
      jointToleranceFlags: ['active_elbow_irritation', 'active_shoulder_instability'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'moderate',
      wrist: 'minimal',
      sternum: 'minimal',
    },
    bestFrameworks: ['barseagle_strength', 'strength_conversion', 'hypertrophy_supported'],
    avoidFrameworks: ['skill_frequency'],
    readinessFactors: [
      { factor: 'pulling_strength', weight: 0.40 },
      { factor: 'scapular_control', weight: 0.25 },
      { factor: 'elbow_tolerance', weight: 0.20 },
      { factor: 'shoulder_stability', weight: 0.15 },
    ],
    bestUseCases: [
      'Front lever strength carryover',
      'One-arm pull-up strength base',
      'Muscle-up pulling power',
      'General pulling strength development',
    ],
    skillCarryover: ['front_lever', 'one_arm_pull_up', 'muscle_up'],
    defaultRepRange: { min: 3, max: 8 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 120,
    restSecondsMax: 300,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'moderate',
  },
  
  weighted_chinup: {
    weightedSkillId: 'weighted_chinup',
    displayName: 'Weighted Chin-Up',
    description: 'Chin-up with added load, emphasizing bicep involvement',
    parentSkill: 'general_pulling',
    movementFamilies: ['vertical_pull'],
    weightedProgressionType: 'skill_carryover',
    tempoSupportTypes: ['standard', 'slow_eccentric'],
    prerequisites: {
      minimumReps: 10,
      requiredSkills: ['chin_up'],
      requiredStrengthBenchmarks: [
        { exercise: 'chin_up', metric: 'reps', minimumValue: 10, unit: 'reps' },
      ],
      jointToleranceFlags: ['active_elbow_irritation'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'low',
      elbow: 'moderate',
      wrist: 'low',
      sternum: 'minimal',
    },
    bestFrameworks: ['barseagle_strength', 'strength_conversion', 'hypertrophy_supported'],
    avoidFrameworks: [],
    readinessFactors: [
      { factor: 'pulling_strength', weight: 0.45 },
      { factor: 'elbow_tolerance', weight: 0.30 },
      { factor: 'shoulder_stability', weight: 0.25 },
    ],
    bestUseCases: [
      'Bicep strength development',
      'General pulling base',
      'One-arm chin-up preparation',
    ],
    skillCarryover: ['one_arm_pull_up'],
    defaultRepRange: { min: 4, max: 10 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 90,
    restSecondsMax: 240,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'moderate',
  },
  
  weighted_dip: {
    weightedSkillId: 'weighted_dip',
    displayName: 'Weighted Dip',
    description: 'Parallel bar dip with added load for pressing strength',
    parentSkill: 'general_pushing',
    movementFamilies: ['dip_pattern', 'vertical_push'],
    weightedProgressionType: 'skill_carryover',
    tempoSupportTypes: ['standard', 'slow_eccentric', 'pause_bottom'],
    prerequisites: {
      minimumReps: 10,
      requiredSkills: ['dip'],
      requiredStrengthBenchmarks: [
        { exercise: 'dip', metric: 'reps', minimumValue: 10, unit: 'reps' },
      ],
      jointToleranceFlags: ['sternum_irritation', 'active_shoulder_instability'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'moderate',
      wrist: 'low',
      sternum: 'moderate',
    },
    bestFrameworks: ['barseagle_strength', 'strength_conversion', 'hypertrophy_supported'],
    avoidFrameworks: ['tendon_conservative'],
    readinessFactors: [
      { factor: 'dip_strength', weight: 0.40 },
      { factor: 'shoulder_stability', weight: 0.30 },
      { factor: 'sternum_tolerance', weight: 0.20 },
      { factor: 'lockout_strength', weight: 0.10 },
    ],
    bestUseCases: [
      'Muscle-up lockout strength',
      'HSPU pressing base',
      'General pressing development',
    ],
    skillCarryover: ['muscle_up', 'hspu'],
    defaultRepRange: { min: 4, max: 10 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 120,
    restSecondsMax: 240,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'moderate',
  },
  
  weighted_ring_dip: {
    weightedSkillId: 'weighted_ring_dip',
    displayName: 'Weighted Ring Dip',
    description: 'Ring dip with added load for stability and pressing strength',
    parentSkill: 'general_pushing',
    movementFamilies: ['dip_pattern', 'rings_stability'],
    weightedProgressionType: 'skill_carryover',
    tempoSupportTypes: ['standard', 'slow_eccentric'],
    prerequisites: {
      minimumReps: 8,
      requiredSkills: ['ring_dip', 'ring_support'],
      requiredStrengthBenchmarks: [
        { exercise: 'ring_dip', metric: 'reps', minimumValue: 8, unit: 'reps' },
        { exercise: 'ring_support', metric: 'hold_time', minimumValue: 30, unit: 'seconds' },
      ],
      jointToleranceFlags: ['active_shoulder_instability', 'sternum_irritation'],
      minimumExperienceLevel: 'advanced',
    },
    jointStressProfile: {
      shoulder: 'high',
      elbow: 'moderate',
      wrist: 'low',
      sternum: 'moderate',
    },
    bestFrameworks: ['barseagle_strength', 'strength_conversion'],
    avoidFrameworks: ['skill_frequency', 'density_endurance'],
    readinessFactors: [
      { factor: 'dip_strength', weight: 0.30 },
      { factor: 'ring_stability', weight: 0.30 },
      { factor: 'shoulder_stability', weight: 0.25 },
      { factor: 'sternum_tolerance', weight: 0.15 },
    ],
    bestUseCases: [
      'Ring muscle-up lockout',
      'Iron cross preparation',
      'Advanced ring strength',
    ],
    skillCarryover: ['ring_muscle_up', 'iron_cross'],
    defaultRepRange: { min: 3, max: 8 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 150,
    restSecondsMax: 300,
    maxWeeklyFrequency: 2,
    loadProgressionRate: 'slow',
  },
  
  weighted_muscle_up: {
    weightedSkillId: 'weighted_muscle_up',
    displayName: 'Weighted Muscle-Up',
    description: 'Muscle-up with added load for elite pulling and pressing strength',
    parentSkill: 'muscle_up',
    movementFamilies: ['explosive_pull', 'dip_pattern', 'transition_skill'],
    weightedProgressionType: 'heavy_skill',
    tempoSupportTypes: ['standard'],
    prerequisites: {
      minimumReps: 5,
      requiredSkills: ['muscle_up', 'strict_muscle_up', 'weighted_pullup', 'weighted_dip'],
      requiredStrengthBenchmarks: [
        { exercise: 'muscle_up', metric: 'reps', minimumValue: 5, unit: 'reps' },
        { exercise: 'strict_muscle_up', metric: 'reps', minimumValue: 3, unit: 'reps' },
        { exercise: 'weighted_pullup', metric: 'weight', minimumValue: 15, unit: 'kg' },
        { exercise: 'weighted_dip', metric: 'weight', minimumValue: 20, unit: 'kg' },
      ],
      jointToleranceFlags: ['active_shoulder_instability', 'active_elbow_irritation'],
      minimumExperienceLevel: 'advanced',
    },
    jointStressProfile: {
      shoulder: 'very_high',
      elbow: 'high',
      wrist: 'moderate',
      sternum: 'moderate',
    },
    bestFrameworks: ['barseagle_strength', 'strength_conversion'],
    avoidFrameworks: ['skill_frequency', 'density_endurance', 'tendon_conservative'],
    readinessFactors: [
      { factor: 'explosive_pull', weight: 0.30 },
      { factor: 'dip_strength', weight: 0.25 },
      { factor: 'transition_control', weight: 0.20 },
      { factor: 'shoulder_stability', weight: 0.15 },
      { factor: 'elbow_tolerance', weight: 0.10 },
    ],
    bestUseCases: [
      'Elite explosive pulling development',
      'Advanced lockout strength',
      'Competition preparation',
    ],
    skillCarryover: ['muscle_up'],
    defaultRepRange: { min: 1, max: 3 },
    defaultSetRange: { min: 3, max: 6 },
    restSecondsMin: 180,
    restSecondsMax: 360,
    maxWeeklyFrequency: 2,
    loadProgressionRate: 'slow',
  },
  
  slow_muscle_up: {
    weightedSkillId: 'slow_muscle_up',
    displayName: 'Slow Muscle-Up',
    description: 'Muscle-up performed with controlled tempo for transition quality',
    parentSkill: 'muscle_up',
    movementFamilies: ['explosive_pull', 'dip_pattern', 'transition_skill'],
    weightedProgressionType: 'tempo_control',
    tempoSupportTypes: ['slow_concentric', 'slow_both', 'full_control'],
    prerequisites: {
      minimumReps: 3,
      requiredSkills: ['muscle_up', 'strict_muscle_up'],
      requiredStrengthBenchmarks: [
        { exercise: 'muscle_up', metric: 'reps', minimumValue: 5, unit: 'reps' },
        { exercise: 'strict_muscle_up', metric: 'reps', minimumValue: 3, unit: 'reps' },
      ],
      jointToleranceFlags: ['active_shoulder_instability'],
      minimumExperienceLevel: 'advanced',
    },
    jointStressProfile: {
      shoulder: 'high',
      elbow: 'high',
      wrist: 'moderate',
      sternum: 'low',
    },
    bestFrameworks: ['strength_conversion', 'skill_frequency', 'tendon_conservative'],
    avoidFrameworks: ['density_endurance'],
    readinessFactors: [
      { factor: 'transition_control', weight: 0.35 },
      { factor: 'explosive_pull', weight: 0.25 },
      { factor: 'dip_strength', weight: 0.20 },
      { factor: 'shoulder_stability', weight: 0.20 },
    ],
    bestUseCases: [
      'Transition quality improvement',
      'Full-range tension development',
      'Technique refinement under strength demand',
      'Weighted muscle-up preparation',
    ],
    skillCarryover: ['muscle_up', 'weighted_muscle_up'],
    defaultRepRange: { min: 1, max: 3 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 150,
    restSecondsMax: 300,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'slow',
  },
  
  tempo_muscle_up: {
    weightedSkillId: 'tempo_muscle_up',
    displayName: 'Tempo Muscle-Up',
    description: 'Muscle-up with specific tempo prescription for control development',
    parentSkill: 'muscle_up',
    movementFamilies: ['explosive_pull', 'dip_pattern', 'transition_skill'],
    weightedProgressionType: 'tempo_control',
    tempoSupportTypes: ['slow_eccentric', 'pause_top', 'slow_both'],
    prerequisites: {
      minimumReps: 2,
      requiredSkills: ['muscle_up'],
      requiredStrengthBenchmarks: [
        { exercise: 'muscle_up', metric: 'reps', minimumValue: 3, unit: 'reps' },
      ],
      jointToleranceFlags: ['active_shoulder_instability'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'moderate',
      wrist: 'low',
      sternum: 'low',
    },
    bestFrameworks: ['skill_frequency', 'strength_conversion', 'tendon_conservative'],
    avoidFrameworks: ['density_endurance'],
    readinessFactors: [
      { factor: 'transition_control', weight: 0.40 },
      { factor: 'explosive_pull', weight: 0.30 },
      { factor: 'dip_strength', weight: 0.30 },
    ],
    bestUseCases: [
      'Control development',
      'Technical improvement',
      'Fatigue-managed skill practice',
    ],
    skillCarryover: ['muscle_up', 'slow_muscle_up'],
    defaultRepRange: { min: 2, max: 5 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 120,
    restSecondsMax: 240,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'moderate',
  },
  
  weighted_front_lever_row: {
    weightedSkillId: 'weighted_front_lever_row',
    displayName: 'Weighted Front Lever Row',
    description: 'Front lever row with added load for advanced pulling strength',
    parentSkill: 'front_lever',
    movementFamilies: ['straight_arm_pull', 'horizontal_pull'],
    weightedProgressionType: 'heavy_skill',
    tempoSupportTypes: ['standard', 'slow_eccentric'],
    prerequisites: {
      minimumReps: 5,
      requiredSkills: ['front_lever_row', 'tuck_front_lever'],
      requiredStrengthBenchmarks: [
        { exercise: 'front_lever_row', metric: 'reps', minimumValue: 5, unit: 'reps' },
        { exercise: 'tuck_front_lever', metric: 'hold_time', minimumValue: 15, unit: 'seconds' },
      ],
      jointToleranceFlags: ['poor_tendon_tolerance'],
      minimumExperienceLevel: 'advanced',
    },
    jointStressProfile: {
      shoulder: 'high',
      elbow: 'high',
      wrist: 'low',
      sternum: 'minimal',
    },
    bestFrameworks: ['strength_conversion', 'barseagle_strength'],
    avoidFrameworks: ['density_endurance', 'tendon_conservative'],
    readinessFactors: [
      { factor: 'straight_arm_pull', weight: 0.35 },
      { factor: 'scapular_control', weight: 0.25 },
      { factor: 'lat_strength', weight: 0.25 },
      { factor: 'elbow_tolerance', weight: 0.15 },
    ],
    bestUseCases: [
      'Front lever progression',
      'Advanced pulling strength',
      'One-arm front lever preparation',
    ],
    skillCarryover: ['front_lever', 'front_lever_pullup', 'one_arm_front_lever_row'],
    defaultRepRange: { min: 3, max: 6 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 150,
    restSecondsMax: 300,
    maxWeeklyFrequency: 2,
    loadProgressionRate: 'slow',
  },
  
  tempo_pullup: {
    weightedSkillId: 'tempo_pullup',
    displayName: 'Tempo Pull-Up',
    description: 'Pull-up with controlled tempo for strength and control',
    parentSkill: 'general_pulling',
    movementFamilies: ['vertical_pull'],
    weightedProgressionType: 'tempo_control',
    tempoSupportTypes: ['slow_concentric', 'slow_eccentric', 'slow_both', 'pause_top'],
    prerequisites: {
      minimumReps: 8,
      requiredSkills: ['pull_up'],
      requiredStrengthBenchmarks: [
        { exercise: 'pull_up', metric: 'reps', minimumValue: 8, unit: 'reps' },
      ],
      jointToleranceFlags: [],
      minimumExperienceLevel: 'beginner',
    },
    jointStressProfile: {
      shoulder: 'low',
      elbow: 'low',
      wrist: 'minimal',
      sternum: 'minimal',
    },
    bestFrameworks: ['skill_frequency', 'tendon_conservative', 'strength_conversion'],
    avoidFrameworks: [],
    readinessFactors: [
      { factor: 'pulling_strength', weight: 0.50 },
      { factor: 'scapular_control', weight: 0.30 },
      { factor: 'shoulder_stability', weight: 0.20 },
    ],
    bestUseCases: [
      'Pulling control development',
      'Tendon preparation',
      'Quality over quantity emphasis',
    ],
    skillCarryover: ['front_lever', 'muscle_up'],
    defaultRepRange: { min: 3, max: 8 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 90,
    restSecondsMax: 180,
    maxWeeklyFrequency: 4,
    loadProgressionRate: 'moderate',
  },
  
  tempo_dip: {
    weightedSkillId: 'tempo_dip',
    displayName: 'Tempo Dip',
    description: 'Dip with controlled tempo for pressing strength and control',
    parentSkill: 'general_pushing',
    movementFamilies: ['dip_pattern', 'vertical_push'],
    weightedProgressionType: 'tempo_control',
    tempoSupportTypes: ['slow_concentric', 'slow_eccentric', 'slow_both', 'pause_bottom'],
    prerequisites: {
      minimumReps: 10,
      requiredSkills: ['dip'],
      requiredStrengthBenchmarks: [
        { exercise: 'dip', metric: 'reps', minimumValue: 10, unit: 'reps' },
      ],
      jointToleranceFlags: ['sternum_irritation'],
      minimumExperienceLevel: 'beginner',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'low',
      wrist: 'minimal',
      sternum: 'moderate',
    },
    bestFrameworks: ['skill_frequency', 'tendon_conservative', 'strength_conversion'],
    avoidFrameworks: [],
    readinessFactors: [
      { factor: 'dip_strength', weight: 0.45 },
      { factor: 'shoulder_stability', weight: 0.35 },
      { factor: 'sternum_tolerance', weight: 0.20 },
    ],
    bestUseCases: [
      'Pressing control development',
      'Muscle-up transition preparation',
      'Tendon-safe pressing work',
    ],
    skillCarryover: ['muscle_up', 'hspu'],
    defaultRepRange: { min: 4, max: 10 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 90,
    restSecondsMax: 180,
    maxWeeklyFrequency: 4,
    loadProgressionRate: 'moderate',
  },
  
  tempo_front_lever_row: {
    weightedSkillId: 'tempo_front_lever_row',
    displayName: 'Tempo Front Lever Row',
    description: 'Front lever row with controlled tempo for quality development',
    parentSkill: 'front_lever',
    movementFamilies: ['straight_arm_pull', 'horizontal_pull'],
    weightedProgressionType: 'tempo_control',
    tempoSupportTypes: ['slow_concentric', 'slow_eccentric', 'pause_top'],
    prerequisites: {
      minimumReps: 3,
      requiredSkills: ['front_lever_row'],
      requiredStrengthBenchmarks: [
        { exercise: 'front_lever_row', metric: 'reps', minimumValue: 3, unit: 'reps' },
      ],
      jointToleranceFlags: ['poor_tendon_tolerance'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'moderate',
      wrist: 'minimal',
      sternum: 'minimal',
    },
    bestFrameworks: ['skill_frequency', 'tendon_conservative', 'strength_conversion'],
    avoidFrameworks: [],
    readinessFactors: [
      { factor: 'straight_arm_pull', weight: 0.40 },
      { factor: 'scapular_control', weight: 0.35 },
      { factor: 'lat_strength', weight: 0.25 },
    ],
    bestUseCases: [
      'Front lever pulling quality',
      'Tendon-safe straight-arm work',
      'Control emphasis',
    ],
    skillCarryover: ['front_lever', 'front_lever_pullup'],
    defaultRepRange: { min: 3, max: 6 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 120,
    restSecondsMax: 240,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'slow',
  },
  
  tempo_pseudo_planche_pushup: {
    weightedSkillId: 'tempo_pseudo_planche_pushup',
    displayName: 'Tempo Pseudo Planche Push-Up',
    description: 'Pseudo planche push-up with controlled tempo for planche preparation',
    parentSkill: 'planche',
    movementFamilies: ['straight_arm_push', 'horizontal_push'],
    weightedProgressionType: 'tempo_control',
    tempoSupportTypes: ['slow_concentric', 'slow_eccentric', 'pause_bottom'],
    prerequisites: {
      minimumReps: 8,
      requiredSkills: ['pseudo_planche_pushup'],
      requiredStrengthBenchmarks: [
        { exercise: 'pseudo_planche_pushup', metric: 'reps', minimumValue: 8, unit: 'reps' },
      ],
      jointToleranceFlags: ['low_wrist_tolerance'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'low',
      wrist: 'high',
      sternum: 'minimal',
    },
    bestFrameworks: ['skill_frequency', 'strength_conversion', 'tendon_conservative'],
    avoidFrameworks: [],
    readinessFactors: [
      { factor: 'straight_arm_push', weight: 0.40 },
      { factor: 'wrist_tolerance', weight: 0.30 },
      { factor: 'shoulder_stability', weight: 0.30 },
    ],
    bestUseCases: [
      'Planche lean control',
      'Dynamic planche pressing preparation',
      'Wrist conditioning',
    ],
    skillCarryover: ['planche', 'planche_pushup'],
    defaultRepRange: { min: 4, max: 10 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 90,
    restSecondsMax: 180,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'moderate',
  },
  
  straight_bar_dip: {
    weightedSkillId: 'straight_bar_dip',
    displayName: 'Straight Bar Dip',
    description: 'Dip on straight bar for muscle-up transition strength',
    parentSkill: 'muscle_up',
    movementFamilies: ['dip_pattern', 'transition_skill'],
    weightedProgressionType: 'skill_carryover',
    tempoSupportTypes: ['standard', 'slow_eccentric', 'pause_bottom'],
    prerequisites: {
      minimumReps: 8,
      requiredSkills: ['dip'],
      requiredStrengthBenchmarks: [
        { exercise: 'dip', metric: 'reps', minimumValue: 10, unit: 'reps' },
      ],
      jointToleranceFlags: ['sternum_irritation'],
      minimumExperienceLevel: 'intermediate',
    },
    jointStressProfile: {
      shoulder: 'moderate',
      elbow: 'moderate',
      wrist: 'moderate',
      sternum: 'moderate',
    },
    bestFrameworks: ['strength_conversion', 'skill_frequency'],
    avoidFrameworks: [],
    readinessFactors: [
      { factor: 'dip_strength', weight: 0.40 },
      { factor: 'transition_control', weight: 0.30 },
      { factor: 'wrist_tolerance', weight: 0.15 },
      { factor: 'shoulder_stability', weight: 0.15 },
    ],
    bestUseCases: [
      'Muscle-up transition strength',
      'Weighted muscle-up lockout preparation',
      'Transition-specific strength',
    ],
    skillCarryover: ['muscle_up', 'weighted_muscle_up'],
    defaultRepRange: { min: 5, max: 12 },
    defaultSetRange: { min: 3, max: 5 },
    restSecondsMin: 90,
    restSecondsMax: 180,
    maxWeeklyFrequency: 3,
    loadProgressionRate: 'moderate',
  },
}

// =============================================================================
// WEIGHTED PROGRESSION LADDERS
// =============================================================================

export interface WeightedProgressionLadder {
  ladderId: string
  displayName: string
  description: string
  targetSkill: WeightedSkillId
  stages: WeightedProgressionStage[]
}

export interface WeightedProgressionStage {
  stageId: string
  stageName: string
  description: string
  stageIndex: number
  targetType: 'bodyweight' | 'light_load' | 'moderate_load' | 'heavy_load' | 'tempo'
  loadRange?: { minKg: number; maxKg: number }
  tempoType?: TempoType
  repRange: { min: number; max: number }
  setRange: { min: number; max: number }
  minimumWeeksAtStage: number
  advancementCriteria: {
    metric: 'reps' | 'weight' | 'tempo_seconds'
    targetValue: number
  }
  coachingNote: string
}

export const WEIGHTED_PROGRESSION_LADDERS: Record<string, WeightedProgressionLadder> = {
  weighted_pullup_ladder: {
    ladderId: 'weighted_pullup_ladder',
    displayName: 'Weighted Pull-Up Progression',
    description: 'Structured path from bodyweight mastery to heavy weighted pulling',
    targetSkill: 'weighted_pullup',
    stages: [
      {
        stageId: 'wpu_1_bw_mastery',
        stageName: 'Bodyweight Mastery',
        description: 'Build solid bodyweight pulling base',
        stageIndex: 0,
        targetType: 'bodyweight',
        repRange: { min: 8, max: 12 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 4,
        advancementCriteria: { metric: 'reps', targetValue: 12 },
        coachingNote: 'Focus on full range of motion and controlled tempo before adding load.',
      },
      {
        stageId: 'wpu_2_light',
        stageName: 'Light Weighted Work',
        description: 'Introduction to external loading',
        stageIndex: 1,
        targetType: 'light_load',
        loadRange: { minKg: 2.5, maxKg: 10 },
        repRange: { min: 6, max: 10 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 6,
        advancementCriteria: { metric: 'weight', targetValue: 10 },
        coachingNote: 'Start conservatively. Form must remain perfect with added load.',
      },
      {
        stageId: 'wpu_3_moderate',
        stageName: 'Moderate Weighted Work',
        description: 'Building meaningful weighted strength',
        stageIndex: 2,
        targetType: 'moderate_load',
        loadRange: { minKg: 10, maxKg: 25 },
        repRange: { min: 4, max: 8 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 8,
        advancementCriteria: { metric: 'weight', targetValue: 25 },
        coachingNote: 'This is where significant strength conversion happens. Be patient.',
      },
      {
        stageId: 'wpu_4_heavy',
        stageName: 'Heavy Weighted Work',
        description: 'Elite weighted pulling strength',
        stageIndex: 3,
        targetType: 'heavy_load',
        loadRange: { minKg: 25, maxKg: 50 },
        repRange: { min: 3, max: 6 },
        setRange: { min: 3, max: 6 },
        minimumWeeksAtStage: 12,
        advancementCriteria: { metric: 'weight', targetValue: 50 },
        coachingNote: 'Heavy singles and triples require excellent tendon tolerance. Progress slowly.',
      },
    ],
  },
  
  weighted_dip_ladder: {
    ladderId: 'weighted_dip_ladder',
    displayName: 'Weighted Dip Progression',
    description: 'Structured path to heavy weighted pressing',
    targetSkill: 'weighted_dip',
    stages: [
      {
        stageId: 'wdip_1_bw_mastery',
        stageName: 'Bodyweight Mastery',
        description: 'Build solid bodyweight pressing base',
        stageIndex: 0,
        targetType: 'bodyweight',
        repRange: { min: 10, max: 15 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 4,
        advancementCriteria: { metric: 'reps', targetValue: 15 },
        coachingNote: 'Full range of motion is essential. No partial reps.',
      },
      {
        stageId: 'wdip_2_light',
        stageName: 'Light Weighted Work',
        description: 'Introduction to weighted pressing',
        stageIndex: 1,
        targetType: 'light_load',
        loadRange: { minKg: 5, maxKg: 15 },
        repRange: { min: 6, max: 10 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 6,
        advancementCriteria: { metric: 'weight', targetValue: 15 },
        coachingNote: 'Monitor sternum comfort. Stop if any irritation.',
      },
      {
        stageId: 'wdip_3_moderate',
        stageName: 'Moderate Weighted Work',
        description: 'Building pressing strength',
        stageIndex: 2,
        targetType: 'moderate_load',
        loadRange: { minKg: 15, maxKg: 35 },
        repRange: { min: 4, max: 8 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 8,
        advancementCriteria: { metric: 'weight', targetValue: 35 },
        coachingNote: 'This builds the lockout strength needed for muscle-up mastery.',
      },
      {
        stageId: 'wdip_4_heavy',
        stageName: 'Heavy Weighted Work',
        description: 'Elite pressing strength',
        stageIndex: 3,
        targetType: 'heavy_load',
        loadRange: { minKg: 35, maxKg: 60 },
        repRange: { min: 3, max: 6 },
        setRange: { min: 3, max: 6 },
        minimumWeeksAtStage: 12,
        advancementCriteria: { metric: 'weight', targetValue: 60 },
        coachingNote: 'Heavy weighted dips require excellent shoulder stability.',
      },
    ],
  },
  
  muscle_up_tempo_ladder: {
    ladderId: 'muscle_up_tempo_ladder',
    displayName: 'Muscle-Up Tempo Progression',
    description: 'Develop muscle-up control before adding weight',
    targetSkill: 'slow_muscle_up',
    stages: [
      {
        stageId: 'mut_1_strict',
        stageName: 'Strict Muscle-Up',
        description: 'Minimal kip, controlled movement',
        stageIndex: 0,
        targetType: 'bodyweight',
        repRange: { min: 3, max: 5 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 4,
        advancementCriteria: { metric: 'reps', targetValue: 5 },
        coachingNote: 'Master the strict muscle-up before tempo work.',
      },
      {
        stageId: 'mut_2_tempo_eccentric',
        stageName: 'Tempo Eccentric',
        description: '3-second controlled descent',
        stageIndex: 1,
        targetType: 'tempo',
        tempoType: 'slow_eccentric',
        repRange: { min: 2, max: 4 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 6,
        advancementCriteria: { metric: 'tempo_seconds', targetValue: 5 },
        coachingNote: 'Control the descent. This builds transition awareness.',
      },
      {
        stageId: 'mut_3_slow_both',
        stageName: 'Full Tempo Control',
        description: '3-5 second concentric and eccentric',
        stageIndex: 2,
        targetType: 'tempo',
        tempoType: 'slow_both',
        repRange: { min: 1, max: 3 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 8,
        advancementCriteria: { metric: 'tempo_seconds', targetValue: 8 },
        coachingNote: 'Full control through the entire range demonstrates true strength.',
      },
      {
        stageId: 'mut_4_full_control',
        stageName: 'Ultra-Slow Muscle-Up',
        description: '5+ second full control',
        stageIndex: 3,
        targetType: 'tempo',
        tempoType: 'full_control',
        repRange: { min: 1, max: 2 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 8,
        advancementCriteria: { metric: 'tempo_seconds', targetValue: 12 },
        coachingNote: 'This level of control indicates readiness for weighted muscle-ups.',
      },
    ],
  },
  
  weighted_muscle_up_ladder: {
    ladderId: 'weighted_muscle_up_ladder',
    displayName: 'Weighted Muscle-Up Progression',
    description: 'Elite weighted muscle-up development',
    targetSkill: 'weighted_muscle_up',
    stages: [
      {
        stageId: 'wmu_1_prereq',
        stageName: 'Prerequisites',
        description: 'Build weighted pulling and pressing foundation',
        stageIndex: 0,
        targetType: 'bodyweight',
        repRange: { min: 5, max: 8 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 8,
        advancementCriteria: { metric: 'reps', targetValue: 8 },
        coachingNote: 'Ensure weighted pull +15kg and weighted dip +20kg before proceeding.',
      },
      {
        stageId: 'wmu_2_light',
        stageName: 'Light Weighted',
        description: '2.5-5kg added load',
        stageIndex: 1,
        targetType: 'light_load',
        loadRange: { minKg: 2.5, maxKg: 5 },
        repRange: { min: 2, max: 4 },
        setRange: { min: 3, max: 5 },
        minimumWeeksAtStage: 8,
        advancementCriteria: { metric: 'weight', targetValue: 5 },
        coachingNote: 'Even small loads significantly increase difficulty. Progress conservatively.',
      },
      {
        stageId: 'wmu_3_moderate',
        stageName: 'Moderate Weighted',
        description: '5-10kg added load',
        stageIndex: 2,
        targetType: 'moderate_load',
        loadRange: { minKg: 5, maxKg: 10 },
        repRange: { min: 1, max: 3 },
        setRange: { min: 3, max: 6 },
        minimumWeeksAtStage: 12,
        advancementCriteria: { metric: 'weight', targetValue: 10 },
        coachingNote: 'This is elite territory. Respect the movement.',
      },
      {
        stageId: 'wmu_4_heavy',
        stageName: 'Heavy Weighted',
        description: '10kg+ added load',
        stageIndex: 3,
        targetType: 'heavy_load',
        loadRange: { minKg: 10, maxKg: 25 },
        repRange: { min: 1, max: 2 },
        setRange: { min: 3, max: 6 },
        minimumWeeksAtStage: 16,
        advancementCriteria: { metric: 'weight', targetValue: 25 },
        coachingNote: 'Heavy weighted muscle-ups are among the most demanding movements.',
      },
    ],
  },
}

// =============================================================================
// PREREQUISITE CHECKING
// =============================================================================

export interface PrerequisiteCheckResult {
  eligible: boolean
  missingPrerequisites: string[]
  warnings: string[]
  readinessScore: number
  recommendations: string[]
}

export function checkWeightedSkillPrerequisites(
  skillId: WeightedSkillId,
  athleteData: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    benchmarks: Record<string, number>
    activeJointIssues: string[]
    skillsAcquired: string[]
  }
): PrerequisiteCheckResult {
  const profile = WEIGHTED_SKILL_PROFILES[skillId]
  const prereqs = profile.prerequisites
  
  const missingPrerequisites: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  let readinessScore = 100
  
  // Check experience level
  const expLevels = ['beginner', 'intermediate', 'advanced']
  const requiredExpIndex = expLevels.indexOf(prereqs.minimumExperienceLevel)
  const actualExpIndex = expLevels.indexOf(athleteData.experienceLevel)
  
  if (actualExpIndex < requiredExpIndex) {
    missingPrerequisites.push(`Requires ${prereqs.minimumExperienceLevel} experience level`)
    readinessScore -= 30
  }
  
  // Check required skills
  for (const skill of prereqs.requiredSkills) {
    if (!athleteData.skillsAcquired.includes(skill)) {
      missingPrerequisites.push(`Missing skill: ${skill}`)
      readinessScore -= 15
    }
  }
  
  // Check strength benchmarks
  for (const benchmark of prereqs.requiredStrengthBenchmarks) {
    const currentValue = athleteData.benchmarks[benchmark.exercise] || 0
    if (currentValue < benchmark.minimumValue) {
      missingPrerequisites.push(
        `${benchmark.exercise}: ${currentValue}/${benchmark.minimumValue} ${benchmark.unit}`
      )
      readinessScore -= 10
    }
  }
  
  // Check joint tolerance flags
  for (const flag of prereqs.jointToleranceFlags) {
    if (athleteData.activeJointIssues.includes(flag)) {
      warnings.push(`Active issue detected: ${flag}`)
      readinessScore -= 20
    }
  }
  
  // Generate recommendations
  if (readinessScore < 70) {
    recommendations.push('Focus on building prerequisites before attempting weighted work')
  }
  
  if (missingPrerequisites.some(p => p.includes('Missing skill'))) {
    recommendations.push('Complete bodyweight mastery before adding external load')
  }
  
  if (warnings.length > 0) {
    recommendations.push('Address joint/tendon concerns before weighted progressions')
  }
  
  return {
    eligible: readinessScore >= 70 && missingPrerequisites.length === 0,
    missingPrerequisites,
    warnings,
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    recommendations,
  }
}

// =============================================================================
// TEMPO LOGIC
// =============================================================================

export interface TempoRecommendation {
  recommended: boolean
  tempoType: TempoType
  rationale: string
  prescription: {
    concentricSeconds: number
    eccentricSeconds: number
    pauseTopSeconds: number
    pauseBottomSeconds: number
  }
}

export function getTempoRecommendation(
  skillId: WeightedSkillId,
  context: {
    primaryWeakPoint?: WeakPointType
    currentGoal: 'strength' | 'control' | 'technique' | 'hypertrophy'
    fatigueLevel: 'fresh' | 'normal' | 'fatigued'
    isDeloadWeek: boolean
  }
): TempoRecommendation {
  const profile = WEIGHTED_SKILL_PROFILES[skillId]
  
  // Default to standard tempo
  let tempoType: TempoType = 'standard'
  let rationale = 'Standard tempo for balanced development.'
  let prescription = {
    concentricSeconds: 1,
    eccentricSeconds: 2,
    pauseTopSeconds: 0,
    pauseBottomSeconds: 0,
  }
  
  // Check if tempo work is appropriate based on context
  const tempoOverWeight = 
    context.currentGoal === 'control' ||
    context.currentGoal === 'technique' ||
    context.fatigueLevel === 'fatigued' ||
    context.isDeloadWeek ||
    // [WEAK-POINT-TYPE-CONTRACT] primaryWeakPoint is canonical WeakPointType;
    // mapped 'transition_control' (stale) → 'transition_strength' (canonical).
    context.primaryWeakPoint === 'transition_strength'
  
  if (tempoOverWeight && profile.tempoSupportTypes.length > 1) {
    // Transition control weakness
    if (context.primaryWeakPoint === 'transition_strength') {
      tempoType = 'slow_both'
      rationale = 'Slow tempo chosen to develop transition control weakness.'
      prescription = {
        concentricSeconds: 3,
        eccentricSeconds: 3,
        pauseTopSeconds: 1,
        pauseBottomSeconds: 1,
      }
    }
    // Technique focus
    else if (context.currentGoal === 'technique') {
      tempoType = 'slow_eccentric'
      rationale = 'Tempo emphasis chosen for technique refinement.'
      prescription = {
        concentricSeconds: 1,
        eccentricSeconds: 4,
        pauseTopSeconds: 1,
        pauseBottomSeconds: 0,
      }
    }
    // Deload or fatigued
    else if (context.isDeloadWeek || context.fatigueLevel === 'fatigued') {
      tempoType = 'slow_eccentric'
      rationale = 'Tempo work selected to maintain stimulus while managing fatigue.'
      prescription = {
        concentricSeconds: 1,
        eccentricSeconds: 3,
        pauseTopSeconds: 0,
        pauseBottomSeconds: 0,
      }
    }
    // Control goal
    else if (context.currentGoal === 'control') {
      tempoType = 'full_control'
      rationale = 'Full control tempo selected to maximize positional awareness.'
      prescription = {
        concentricSeconds: 4,
        eccentricSeconds: 4,
        pauseTopSeconds: 2,
        pauseBottomSeconds: 2,
      }
    }
  }
  
  return {
    recommended: tempoOverWeight,
    tempoType,
    rationale,
    prescription,
  }
}

// =============================================================================
// FRAMEWORK INTEGRATION
// =============================================================================

export interface FrameworkWeightedGuidance {
  frameworkId: CoachingFrameworkId
  weightedApproach: 'primary' | 'supporting' | 'minimal' | 'avoid'
  tempoApproach: 'primary' | 'supporting' | 'minimal' | 'avoid'
  repRangeOverride?: { min: number; max: number }
  setRangeOverride?: { min: number; max: number }
  restOverride?: { min: number; max: number }
  specialNotes: string[]
}

export function getFrameworkWeightedGuidance(
  frameworkId: CoachingFrameworkId
): FrameworkWeightedGuidance {
  const guidanceMap: Record<CoachingFrameworkId, FrameworkWeightedGuidance> = {
    barseagle_strength: {
      frameworkId: 'barseagle_strength',
      weightedApproach: 'primary',
      tempoApproach: 'supporting',
      repRangeOverride: { min: 3, max: 6 },
      setRangeOverride: { min: 4, max: 6 },
      restOverride: { min: 180, max: 360 },
      specialNotes: [
        'Heavy first set structure',
        'Higher-rep back-off sets',
        'Long rest between heavy sets',
        'Minimal assistance work',
      ],
    },
    strength_conversion: {
      frameworkId: 'strength_conversion',
      weightedApproach: 'primary',
      tempoApproach: 'supporting',
      repRangeOverride: { min: 4, max: 8 },
      setRangeOverride: { min: 3, max: 5 },
      restOverride: { min: 120, max: 240 },
      specialNotes: [
        'Weighted basics that transfer to skill goals',
        'Balance between load and specificity',
        'Periodized load progression',
      ],
    },
    skill_frequency: {
      frameworkId: 'skill_frequency',
      weightedApproach: 'minimal',
      tempoApproach: 'supporting',
      repRangeOverride: { min: 3, max: 6 },
      setRangeOverride: { min: 2, max: 4 },
      restOverride: { min: 90, max: 180 },
      specialNotes: [
        'Light skill-support weighted work only',
        'Avoid heavy loading that increases fatigue',
        'Tempo work preferred over heavy weight',
      ],
    },
    density_endurance: {
      frameworkId: 'density_endurance',
      weightedApproach: 'minimal',
      tempoApproach: 'minimal',
      repRangeOverride: { min: 6, max: 12 },
      setRangeOverride: { min: 3, max: 5 },
      restOverride: { min: 60, max: 120 },
      specialNotes: [
        'Bodyweight volume preferred',
        'Light weighted work for variety only',
        'Avoid heavy loading',
      ],
    },
    hypertrophy_supported: {
      frameworkId: 'hypertrophy_supported',
      weightedApproach: 'supporting',
      tempoApproach: 'supporting',
      repRangeOverride: { min: 6, max: 12 },
      setRangeOverride: { min: 3, max: 5 },
      restOverride: { min: 90, max: 150 },
      specialNotes: [
        'Moderate loads for muscle development',
        'Tempo work for time under tension',
        'Volume over intensity',
      ],
    },
    tendon_conservative: {
      frameworkId: 'tendon_conservative',
      weightedApproach: 'minimal',
      tempoApproach: 'primary',
      repRangeOverride: { min: 4, max: 8 },
      setRangeOverride: { min: 2, max: 4 },
      restOverride: { min: 150, max: 300 },
      specialNotes: [
        'Slower weighted progressions',
        'Tempo work preferred for tendon adaptation',
        'Conservative loading increments',
        'Mandatory prehab inclusion',
      ],
    },
    balanced_hybrid: {
      frameworkId: 'balanced_hybrid',
      weightedApproach: 'supporting',
      tempoApproach: 'supporting',
      repRangeOverride: { min: 4, max: 10 },
      setRangeOverride: { min: 3, max: 5 },
      restOverride: { min: 90, max: 180 },
      specialNotes: [
        'Balanced approach to weighted work',
        'Mix of tempo and standard loading',
        'Periodized emphasis shifts',
      ],
    },
  }
  
  return guidanceMap[frameworkId]
}

// =============================================================================
// WEAK POINT INTEGRATION
// =============================================================================

export interface WeakPointWeightedRecommendation {
  weakPoint: WeakPointType
  recommendedWeightedSkills: WeightedSkillId[]
  recommendedTempoWork: WeightedSkillId[]
  avoidUntilResolved: WeightedSkillId[]
  rationale: string
}

export function getWeightedRecommendationsForWeakPoint(
  weakPoint: WeakPointType
): WeakPointWeightedRecommendation {
  const recommendations: Record<string, WeakPointWeightedRecommendation> = {
    // [WEAK-POINT-TYPE-CONTRACT] Mapped stale alias 'explosive_pull' to
    // canonical 'explosive_power' (WeakPointType in lib/weak-point-engine.ts;
    // canonical label "Explosive Pull Power" at WEAK_POINT_LABELS line 87).
    // The doctrine intent is preserved verbatim — only the union-conformant
    // identifier changes. The map is keyed `Record<string, ...>` so the key
    // change is structural only; the function's resolution logic still
    // accepts a `WeakPointType` parameter and dereferences via canonical key.
    explosive_power: {
      weakPoint: 'explosive_power',
      recommendedWeightedSkills: ['weighted_pullup', 'weighted_chinup'],
      recommendedTempoWork: ['tempo_pullup'],
      avoidUntilResolved: ['weighted_muscle_up'],
      rationale: 'Build explosive pulling strength with weighted basics before heavy skill work.',
    },
    // [WEAK-POINT-TYPE-CONTRACT] Mapped stale alias 'transition_control' to
    // canonical 'transition_strength' (label "Transition Strength" at
    // WEAK_POINT_LABELS line 88). Same doctrine, canonical identifier.
    transition_strength: {
      weakPoint: 'transition_strength',
      recommendedWeightedSkills: ['straight_bar_dip'],
      recommendedTempoWork: ['slow_muscle_up', 'tempo_muscle_up', 'tempo_dip'],
      avoidUntilResolved: ['weighted_muscle_up'],
      rationale: 'Focus on tempo control work to develop transition quality.',
    },
    dip_strength: {
      weakPoint: 'dip_strength',
      recommendedWeightedSkills: ['weighted_dip', 'weighted_ring_dip'],
      recommendedTempoWork: ['tempo_dip'],
      avoidUntilResolved: ['weighted_muscle_up'],
      rationale: 'Build pressing strength foundation with weighted dip progressions.',
    },
    lockout_strength: {
      weakPoint: 'lockout_strength',
      recommendedWeightedSkills: ['weighted_dip', 'straight_bar_dip'],
      recommendedTempoWork: ['tempo_dip'],
      avoidUntilResolved: [],
      rationale: 'Target lockout specifically with partial range and heavy dip work.',
    },
    // [WEAK-POINT-TYPE-CONTRACT] Mapped stale alias 'straight_arm_pull' to
    // canonical 'straight_arm_pull_strength' (canonical WeakPointType union
    // member at lib/weak-point-engine.ts:47, label "Straight-Arm Pull
    // Strength"). Same doctrine, canonical identifier.
    straight_arm_pull_strength: {
      weakPoint: 'straight_arm_pull_strength',
      recommendedWeightedSkills: ['weighted_front_lever_row'],
      recommendedTempoWork: ['tempo_front_lever_row'],
      avoidUntilResolved: [],
      rationale: 'Develop straight-arm pulling with controlled FL row progressions.',
    },
    scapular_control: {
      weakPoint: 'scapular_control',
      recommendedWeightedSkills: [],
      recommendedTempoWork: ['tempo_pullup'],
      avoidUntilResolved: ['weighted_pullup'],
      rationale: 'Focus on tempo work to develop scapular awareness before heavy loading.',
    },
    // [WEAK-POINT-TYPE-CONTRACT] Mapped stale alias 'compression' to
    // canonical 'compression_strength' (WeakPointType member at
    // lib/weak-point-engine.ts:51, label "Compression Strength"). The
    // canonical union also has 'core_compression' (line 57) — that one is
    // a control/stability concept; this entry's doctrine is about pressing
    // compression strength, so 'compression_strength' is the correct match.
    compression_strength: {
      weakPoint: 'compression_strength',
      recommendedWeightedSkills: [],
      recommendedTempoWork: [],
      avoidUntilResolved: [],
      rationale: 'Compression is not primarily addressed through weighted work.',
    },
    shoulder_stability: {
      weakPoint: 'shoulder_stability',
      recommendedWeightedSkills: [],
      recommendedTempoWork: ['tempo_dip', 'tempo_pullup'],
      avoidUntilResolved: ['weighted_ring_dip', 'weighted_muscle_up'],
      rationale: 'Build shoulder stability with controlled tempo work before heavy loading.',
    },
    wrist_tolerance: {
      weakPoint: 'wrist_tolerance',
      recommendedWeightedSkills: [],
      recommendedTempoWork: ['tempo_pseudo_planche_pushup'],
      avoidUntilResolved: [],
      rationale: 'Develop wrist tolerance gradually with controlled lean progressions.',
    },
  }
  
  return recommendations[weakPoint] || {
    weakPoint,
    recommendedWeightedSkills: [],
    recommendedTempoWork: [],
    avoidUntilResolved: [],
    rationale: 'No specific weighted recommendations for this weak point.',
  }
}

// =============================================================================
// TENDON SAFETY RULES
// =============================================================================

export interface TendonSafetyRule {
  ruleId: string
  appliesTo: WeightedSkillId[]
  condition: string
  action: 'reduce_load' | 'reduce_volume' | 'increase_rest' | 'insert_prehab' | 'avoid'
  adjustment: {
    loadReductionPercent?: number
    volumeReductionPercent?: number
    restIncreasePercent?: number
    prehabExercises?: string[]
  }
  coachingNote: string
}

export const TENDON_SAFETY_RULES: TendonSafetyRule[] = [
  {
    ruleId: 'elbow_sensitivity_pull',
    appliesTo: ['weighted_pullup', 'weighted_chinup', 'weighted_muscle_up', 'weighted_front_lever_row'],
    condition: 'active_elbow_irritation',
    action: 'reduce_load',
    adjustment: {
      loadReductionPercent: 30,
      prehabExercises: ['wrist_curls', 'reverse_wrist_curls', 'elbow_circles'],
    },
    coachingNote: 'Elbow sensitivity detected. Reduce load and include prehab.',
  },
  {
    ruleId: 'shoulder_sensitivity_overhead',
    appliesTo: ['weighted_dip', 'weighted_ring_dip', 'weighted_muscle_up'],
    condition: 'active_shoulder_instability',
    action: 'avoid',
    adjustment: {},
    coachingNote: 'Shoulder instability detected. Avoid heavy overhead/dip loading until resolved.',
  },
  {
    ruleId: 'sternum_sensitivity',
    appliesTo: ['weighted_dip', 'weighted_ring_dip'],
    condition: 'sternum_irritation',
    action: 'reduce_volume',
    adjustment: {
      volumeReductionPercent: 50,
      prehabExercises: ['chest_stretches', 'thoracic_mobility'],
    },
    coachingNote: 'Sternum sensitivity detected. Reduce dip volume significantly.',
  },
  {
    ruleId: 'general_tendon_fatigue',
    appliesTo: ['weighted_pullup', 'weighted_dip', 'weighted_muscle_up', 'weighted_front_lever_row'],
    condition: 'poor_tendon_tolerance',
    action: 'increase_rest',
    adjustment: {
      restIncreasePercent: 50,
      loadReductionPercent: 20,
    },
    coachingNote: 'Tendon fatigue indicators present. Increase rest and reduce load.',
  },
  {
    ruleId: 'wrist_sensitivity_pressing',
    appliesTo: ['tempo_pseudo_planche_pushup', 'straight_bar_dip'],
    condition: 'low_wrist_tolerance',
    action: 'insert_prehab',
    adjustment: {
      prehabExercises: ['wrist_circles', 'wrist_stretches', 'rice_bucket'],
    },
    coachingNote: 'Wrist sensitivity detected. Include wrist prehab before pressing work.',
  },
]

export function applyTendonSafetyRules(
  skillId: WeightedSkillId,
  activeConditions: string[]
): {
  applicable: TendonSafetyRule[]
  adjustments: {
    loadMultiplier: number
    volumeMultiplier: number
    restMultiplier: number
    prehabRequired: string[]
    shouldAvoid: boolean
  }
  coachingNotes: string[]
} {
  const applicableRules = TENDON_SAFETY_RULES.filter(
    rule => rule.appliesTo.includes(skillId) && activeConditions.includes(rule.condition)
  )
  
  let loadMultiplier = 1
  let volumeMultiplier = 1
  let restMultiplier = 1
  const prehabRequired: string[] = []
  let shouldAvoid = false
  const coachingNotes: string[] = []
  
  for (const rule of applicableRules) {
    if (rule.action === 'avoid') {
      shouldAvoid = true
      coachingNotes.push(rule.coachingNote)
      continue
    }
    
    if (rule.adjustment.loadReductionPercent) {
      loadMultiplier = Math.min(loadMultiplier, 1 - rule.adjustment.loadReductionPercent / 100)
    }
    if (rule.adjustment.volumeReductionPercent) {
      volumeMultiplier = Math.min(volumeMultiplier, 1 - rule.adjustment.volumeReductionPercent / 100)
    }
    if (rule.adjustment.restIncreasePercent) {
      restMultiplier = Math.max(restMultiplier, 1 + rule.adjustment.restIncreasePercent / 100)
    }
    if (rule.adjustment.prehabExercises) {
      prehabRequired.push(...rule.adjustment.prehabExercises)
    }
    coachingNotes.push(rule.coachingNote)
  }
  
  return {
    applicable: applicableRules,
    adjustments: {
      loadMultiplier,
      volumeMultiplier,
      restMultiplier,
      prehabRequired: [...new Set(prehabRequired)],
      shouldAvoid,
    },
    coachingNotes,
  }
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

export interface WeightedSkillExplanation {
  headline: string
  rationale: string
  benefitsForGoal: string[]
  progressionPath: string
  safetyConsiderations: string[]
}

export function generateWeightedSkillExplanation(
  skillId: WeightedSkillId,
  context: {
    primaryGoal: SkillGraphId | string
    currentFramework: CoachingFrameworkId
    primaryWeakPoint?: WeakPointType
  }
): WeightedSkillExplanation {
  const profile = WEIGHTED_SKILL_PROFILES[skillId]
  const frameworkGuidance = getFrameworkWeightedGuidance(context.currentFramework)
  
  // Build headline
  let headline = `${profile.displayName} for ${context.primaryGoal} development`
  
  // Build rationale
  let rationale = profile.description
  
  if (profile.weightedProgressionType === 'tempo_control') {
    rationale += ' Tempo work was selected because control is currently more valuable than raw load.'
  } else if (profile.weightedProgressionType === 'skill_carryover') {
    rationale += ` This builds the strength foundation that transfers to ${context.primaryGoal}.`
  } else if (profile.weightedProgressionType === 'heavy_skill') {
    rationale += ' Heavy skill work represents advanced training appropriate for your level.'
  }
  
  // Build benefits
  const benefitsForGoal = [...profile.bestUseCases]
  if (context.primaryWeakPoint) {
    const wpRec = getWeightedRecommendationsForWeakPoint(context.primaryWeakPoint)
    if (wpRec.recommendedWeightedSkills.includes(skillId)) {
      benefitsForGoal.push(`Directly addresses your ${context.primaryWeakPoint} limiter`)
    }
  }
  
  // Build progression path
  let progressionPath = 'Progress through bodyweight mastery'
  const ladder = Object.values(WEIGHTED_PROGRESSION_LADDERS).find(l => l.targetSkill === skillId)
  if (ladder) {
    progressionPath = ladder.stages.map(s => s.stageName).join(' → ')
  }
  
  // Build safety considerations
  const safetyConsiderations: string[] = []
  const jointProfile = profile.jointStressProfile
  if (jointProfile.shoulder === 'high' || jointProfile.shoulder === 'very_high') {
    safetyConsiderations.push('Monitor shoulder tolerance closely')
  }
  if (jointProfile.elbow === 'high' || jointProfile.elbow === 'very_high') {
    safetyConsiderations.push('Watch for elbow irritation')
  }
  if (jointProfile.sternum === 'moderate' || jointProfile.sternum === 'high') {
    safetyConsiderations.push('Be mindful of sternum comfort during deep positions')
  }
  
  safetyConsiderations.push(`Maximum ${profile.maxWeeklyFrequency}x per week recommended`)
  
  return {
    headline,
    rationale,
    benefitsForGoal,
    progressionPath,
    safetyConsiderations,
  }
}

// =============================================================================
// ATHLETE LEVEL GATING
// =============================================================================

export function getAvailableWeightedSkillsForAthlete(
  athleteLevel: 'beginner' | 'intermediate' | 'advanced',
  benchmarks: Record<string, number>,
  skillsAcquired: string[],
  activeJointIssues: string[]
): {
  available: WeightedSkillId[]
  nearlyAvailable: { skill: WeightedSkillId; missingPrereqs: string[] }[]
  locked: WeightedSkillId[]
} {
  const available: WeightedSkillId[] = []
  const nearlyAvailable: { skill: WeightedSkillId; missingPrereqs: string[] }[] = []
  const locked: WeightedSkillId[] = []
  
  for (const [skillId, profile] of Object.entries(WEIGHTED_SKILL_PROFILES)) {
    const result = checkWeightedSkillPrerequisites(skillId as WeightedSkillId, {
      experienceLevel: athleteLevel,
      benchmarks,
      activeJointIssues,
      skillsAcquired,
    })
    
    if (result.eligible) {
      available.push(skillId as WeightedSkillId)
    } else if (result.readinessScore >= 50) {
      nearlyAvailable.push({
        skill: skillId as WeightedSkillId,
        missingPrereqs: result.missingPrerequisites,
      })
    } else {
      locked.push(skillId as WeightedSkillId)
    }
  }
  
  return { available, nearlyAvailable, locked }
}

// =============================================================================
// EXPORTS
// =============================================================================
//
// [DUPLICATE-EXPORT-CONTRACT-FIX] All public symbols are exported inline at
// their declaration sites (`export const WEIGHTED_SKILL_PROFILES`,
// `export const WEIGHTED_PROGRESSION_LADDERS`, `export const
// TENDON_SAFETY_RULES`, and seven `export function` declarations). The
// previous bottom `export { ... }` block duplicated every name, producing
// TS2300/TS2484. Inline export remains the single canonical export style;
// public API is unchanged.
