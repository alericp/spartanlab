/**
 * SpartanLab Training Principles Engine
 * 
 * Internal engine that encodes high-level calisthenics training philosophies
 * and allows the AI coach to intelligently select and blend methods.
 * 
 * DESIGN PHILOSOPHY:
 * - Externally: Users see unified SpartanLab coaching
 * - Internally: System applies proven training principles adaptively
 * 
 * The user should feel: "SpartanLab understands my goals and builds 
 * the right style of training for me."
 */

import type { ExperienceLevel } from './program-service'
import type { RangeTrainingMode } from './range-training-system'
import type { RPEValue } from './rpe-adjustment-engine'
import type { Exercise, DifficultyLevel } from './adaptive-exercise-pool'

// =============================================================================
// METHOD PROFILE TYPES
// =============================================================================

export type MethodProfileId = 
  | 'weighted_strength'
  | 'static_skill_density'
  | 'hypertrophy_support'
  | 'explosive_power'
  | 'endurance_density'
  | 'flexibility_exposure'
  | 'mobility_strength'
  | 'hybrid_skill_strength'
  | 'recovery_conservative'

export type MethodCategory = 
  | 'strength'
  | 'skill'
  | 'hypertrophy'
  | 'power'
  | 'endurance'
  | 'flexibility'
  | 'mobility'
  | 'hybrid'
  | 'recovery'

export type SkillType = 
  | 'front_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand'
  | 'hspu'
  | 'l_sit'
  | 'v_sit'
  | 'i_sit'
  | 'pancake'
  | 'toe_touch'
  | 'front_splits'
  | 'side_splits'
  | 'weighted_pull'
  | 'weighted_dip'
  | 'general_strength'

export type IntensityBias = 'low' | 'moderate' | 'high' | 'max'
export type VolumeBias = 'minimal' | 'low' | 'moderate' | 'high'
export type FrequencySuitability = 'daily' | 'high' | 'moderate' | 'low'
export type RecoveryProfile = 'minimal' | 'light' | 'moderate' | 'heavy' | 'max'

export interface MethodProfile {
  id: MethodProfileId
  name: string
  category: MethodCategory
  shortDescription: string
  publicLabel: string // User-facing label in SpartanLab style
  
  // Target audience
  intendedGoalTypes: SkillType[]
  intendedSkillTypes: SkillType[]
  intendedExperienceLevels: ExperienceLevel[]
  intendedRecoveryProfiles: RecoveryProfile[]
  intendedSessionLengths: ('short' | 'medium' | 'long')[]
  
  // Training characteristics
  fatigueCost: 1 | 2 | 3 | 4 | 5
  sorenessRisk: 1 | 2 | 3 | 4 | 5
  frequencySuitability: FrequencySuitability
  intensityBias: IntensityBias
  volumeBias: VolumeBias
  techniqueBias: 'low' | 'moderate' | 'high' // How technique-focused
  progressionBias: 'conservative' | 'moderate' | 'aggressive'
  
  // Application rules
  whenToUse: string[]
  whenNotToUse: string[]
  compatibleSkills: SkillType[]
  compatibleExerciseTags: string[]
  compatibleBlockTypes: ('warmup' | 'skill' | 'strength' | 'accessory' | 'conditioning' | 'flexibility' | 'mobility' | 'cooldown')[]
  contraindications: string[]
  
  // Programming rules
  rules: MethodRules
  
  notes: string
}

export interface MethodRules {
  // Set/rep structure
  repRangeMin: number
  repRangeMax: number
  setRangeMin: number
  setRangeMax: number
  holdDurationMin?: number // For isometrics, in seconds
  holdDurationMax?: number
  
  // Intensity/recovery
  targetRPE: RPEValue | [RPEValue, RPEValue] // Single or range
  restTimeMin: number // seconds
  restTimeMax: number // seconds
  
  // Volume control
  maxTotalSets: number
  maxExercises: number
  densityAllowed: boolean
  supersetAllowed: boolean
  dropSetAllowed: boolean
  
  // Progression
  progressionSpeed: 'slow' | 'moderate' | 'fast'
  deloadFrequency: 'rarely' | 'every_4_weeks' | 'every_3_weeks' | 'as_needed'
  failurePolicy: 'avoid' | 'occasional' | 'allowed' | 'encouraged'
  
  // Session structure
  skillFirst: boolean
  maxNeuralDemand: 1 | 2 | 3 | 4 | 5
  fatiguePreservation: boolean
  warmupEmphasis: 'minimal' | 'standard' | 'thorough'
}

// =============================================================================
// METHOD PROFILES - CORE DEFINITIONS
// =============================================================================

export const METHOD_PROFILES: Record<MethodProfileId, MethodProfile> = {
  // -------------------------------------------------------------------------
  // A. WEIGHTED STRENGTH
  // -------------------------------------------------------------------------
  weighted_strength: {
    id: 'weighted_strength',
    name: 'Weighted Strength',
    category: 'strength',
    shortDescription: 'Maximal force development through heavy loading',
    publicLabel: 'Strength-focused',
    
    intendedGoalTypes: ['weighted_pull', 'weighted_dip', 'general_strength', 'muscle_up'],
    intendedSkillTypes: ['weighted_pull', 'weighted_dip', 'muscle_up', 'front_lever', 'planche'],
    intendedExperienceLevels: ['intermediate', 'advanced'],
    intendedRecoveryProfiles: ['moderate', 'heavy'],
    intendedSessionLengths: ['medium', 'long'],
    
    fatigueCost: 4,
    sorenessRisk: 3,
    frequencySuitability: 'moderate',
    intensityBias: 'max',
    volumeBias: 'low',
    techniqueBias: 'moderate',
    progressionBias: 'moderate',
    
    whenToUse: [
      'User wants maximal pulling/pushing strength',
      'User has access to weights or bands',
      'User can handle moderate soreness',
      'Primary goal is strength over skill',
    ],
    whenNotToUse: [
      'User is a beginner',
      'User has recovery limitations',
      'Very short session times',
      'User prioritizes skill technique over strength',
    ],
    compatibleSkills: ['weighted_pull', 'weighted_dip', 'muscle_up', 'front_lever'],
    compatibleExerciseTags: ['weighted', 'pull', 'push', 'compound'],
    compatibleBlockTypes: ['warmup', 'strength', 'accessory', 'cooldown'],
    contraindications: ['joint_issues', 'recovery_limited', 'beginner'],
    
    rules: {
      repRangeMin: 3,
      repRangeMax: 6,
      setRangeMin: 3,
      setRangeMax: 5,
      targetRPE: [8, 9],
      restTimeMin: 180,
      restTimeMax: 300,
      maxTotalSets: 16,
      maxExercises: 4,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'moderate',
      deloadFrequency: 'every_4_weeks',
      failurePolicy: 'occasional',
      skillFirst: false,
      maxNeuralDemand: 4,
      fatiguePreservation: false,
      warmupEmphasis: 'thorough',
    },
    
    notes: 'Heavy loading with full recovery between sets. Top set + backoff structure.',
  },

  // -------------------------------------------------------------------------
  // B. STATIC SKILL DENSITY
  // -------------------------------------------------------------------------
  static_skill_density: {
    id: 'static_skill_density',
    name: 'Static Skill Density',
    category: 'skill',
    shortDescription: 'Frequent high-quality static work with technical freshness',
    publicLabel: 'Skill-focused',
    
    intendedGoalTypes: ['front_lever', 'planche', 'handstand', 'l_sit', 'v_sit'],
    intendedSkillTypes: ['front_lever', 'planche', 'handstand', 'l_sit', 'v_sit', 'i_sit'],
    intendedExperienceLevels: ['beginner', 'intermediate', 'advanced'],
    intendedRecoveryProfiles: ['light', 'moderate'],
    intendedSessionLengths: ['short', 'medium', 'long'],
    
    fatigueCost: 2,
    sorenessRisk: 2,
    frequencySuitability: 'high',
    intensityBias: 'moderate',
    volumeBias: 'moderate',
    techniqueBias: 'high',
    progressionBias: 'conservative',
    
    whenToUse: [
      'User wants to master static skills',
      'User values technique over strength',
      'High training frequency is desired',
      'Recovery capacity is limited',
    ],
    whenNotToUse: [
      'User only wants strength gains',
      'User needs muscle mass',
      'Skill maintenance phase',
    ],
    compatibleSkills: ['front_lever', 'planche', 'handstand', 'l_sit', 'v_sit', 'i_sit'],
    compatibleExerciseTags: ['static', 'skill', 'isometric', 'hold'],
    compatibleBlockTypes: ['warmup', 'skill', 'accessory', 'cooldown'],
    contraindications: ['strength_only_goal'],
    
    rules: {
      repRangeMin: 1,
      repRangeMax: 5,
      setRangeMin: 4,
      setRangeMax: 8,
      holdDurationMin: 5,
      holdDurationMax: 15,
      targetRPE: [6, 8],
      restTimeMin: 90,
      restTimeMax: 180,
      maxTotalSets: 24,
      maxExercises: 6,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'slow',
      deloadFrequency: 'as_needed',
      failurePolicy: 'avoid',
      skillFirst: true,
      maxNeuralDemand: 5,
      fatiguePreservation: true,
      warmupEmphasis: 'thorough',
    },
    
    notes: 'Short clean sets, avoid failure, preserve freshness for skill quality.',
  },

  // -------------------------------------------------------------------------
  // C. HYPERTROPHY SUPPORT
  // -------------------------------------------------------------------------
  hypertrophy_support: {
    id: 'hypertrophy_support',
    name: 'Hypertrophy Support',
    category: 'hypertrophy',
    shortDescription: 'Muscle-building work to support skill development',
    publicLabel: 'Building support strength',
    
    intendedGoalTypes: ['general_strength', 'front_lever', 'planche', 'muscle_up'],
    intendedSkillTypes: ['front_lever', 'planche', 'muscle_up', 'hspu', 'weighted_pull', 'weighted_dip'],
    intendedExperienceLevels: ['beginner', 'intermediate', 'advanced'],
    intendedRecoveryProfiles: ['moderate', 'heavy'],
    intendedSessionLengths: ['medium', 'long'],
    
    fatigueCost: 3,
    sorenessRisk: 4,
    frequencySuitability: 'moderate',
    intensityBias: 'moderate',
    volumeBias: 'high',
    techniqueBias: 'low',
    progressionBias: 'moderate',
    
    whenToUse: [
      'User has lagging muscle groups',
      'User wants physique improvements',
      'Support phase for skill development',
      'User needs more muscle mass for skill progress',
    ],
    whenNotToUse: [
      'User is in skill peaking phase',
      'Very limited recovery capacity',
      'Short sessions only',
    ],
    compatibleSkills: ['front_lever', 'planche', 'muscle_up', 'hspu', 'weighted_pull', 'weighted_dip'],
    compatibleExerciseTags: ['accessory', 'isolation', 'compound', 'hypertrophy'],
    compatibleBlockTypes: ['warmup', 'strength', 'accessory', 'cooldown'],
    contraindications: ['skill_peaking', 'recovery_limited'],
    
    rules: {
      repRangeMin: 8,
      repRangeMax: 15,
      setRangeMin: 3,
      setRangeMax: 4,
      targetRPE: [7, 9],
      restTimeMin: 60,
      restTimeMax: 120,
      maxTotalSets: 20,
      maxExercises: 6,
      densityAllowed: true,
      supersetAllowed: true,
      dropSetAllowed: true,
      progressionSpeed: 'moderate',
      deloadFrequency: 'every_4_weeks',
      failurePolicy: 'occasional',
      skillFirst: false,
      maxNeuralDemand: 3,
      fatiguePreservation: false,
      warmupEmphasis: 'standard',
    },
    
    notes: 'Moderate reps, volume focus, accessory work for weak points.',
  },

  // -------------------------------------------------------------------------
  // D. EXPLOSIVE POWER
  // -------------------------------------------------------------------------
  explosive_power: {
    id: 'explosive_power',
    name: 'Explosive Power',
    category: 'power',
    shortDescription: 'Fast force production for dynamic movements',
    publicLabel: 'Power-focused',
    
    intendedGoalTypes: ['muscle_up', 'general_strength'],
    intendedSkillTypes: ['muscle_up', 'weighted_pull'],
    intendedExperienceLevels: ['intermediate', 'advanced'],
    intendedRecoveryProfiles: ['moderate', 'heavy'],
    intendedSessionLengths: ['short', 'medium'],
    
    fatigueCost: 4,
    sorenessRisk: 2,
    frequencySuitability: 'moderate',
    intensityBias: 'high',
    volumeBias: 'minimal',
    techniqueBias: 'high',
    progressionBias: 'conservative',
    
    whenToUse: [
      'User wants explosive pulling/pushing',
      'Muscle-up development',
      'Dynamic skill emphasis',
      'Speed-strength phase',
    ],
    whenNotToUse: [
      'User is fatigued',
      'Technique is not solid',
      'High volume day',
    ],
    compatibleSkills: ['muscle_up', 'weighted_pull'],
    compatibleExerciseTags: ['explosive', 'dynamic', 'power', 'plyometric'],
    compatibleBlockTypes: ['warmup', 'skill', 'strength', 'cooldown'],
    contraindications: ['high_fatigue', 'poor_technique', 'beginner'],
    
    rules: {
      repRangeMin: 1,
      repRangeMax: 5,
      setRangeMin: 3,
      setRangeMax: 6,
      targetRPE: [7, 8],
      restTimeMin: 180,
      restTimeMax: 300,
      maxTotalSets: 12,
      maxExercises: 3,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'slow',
      deloadFrequency: 'every_3_weeks',
      failurePolicy: 'avoid',
      skillFirst: true,
      maxNeuralDemand: 5,
      fatiguePreservation: true,
      warmupEmphasis: 'thorough',
    },
    
    notes: 'Low volume, max intent, full recovery. Quality over quantity.',
  },

  // -------------------------------------------------------------------------
  // E. ENDURANCE DENSITY
  // -------------------------------------------------------------------------
  endurance_density: {
    id: 'endurance_density',
    name: 'Endurance Density',
    category: 'endurance',
    shortDescription: 'Higher rep work with controlled fatigue management',
    publicLabel: 'Endurance-focused',
    
    intendedGoalTypes: ['general_strength', 'muscle_up'],
    intendedSkillTypes: ['muscle_up', 'weighted_pull', 'weighted_dip', 'general_strength'],
    intendedExperienceLevels: ['beginner', 'intermediate', 'advanced'],
    intendedRecoveryProfiles: ['light', 'moderate'],
    intendedSessionLengths: ['short', 'medium'],
    
    fatigueCost: 3,
    sorenessRisk: 3,
    frequencySuitability: 'moderate',
    intensityBias: 'low',
    volumeBias: 'high',
    techniqueBias: 'moderate',
    progressionBias: 'aggressive',
    
    whenToUse: [
      'User wants work capacity',
      'Building rep endurance',
      'Density/circuit finishers',
      'Conditioning emphasis',
    ],
    whenNotToUse: [
      'Maximal strength phase',
      'Skill technique focus',
      'Recovery-limited period',
    ],
    compatibleSkills: ['muscle_up', 'weighted_pull', 'weighted_dip', 'general_strength'],
    compatibleExerciseTags: ['compound', 'bodyweight', 'conditioning'],
    compatibleBlockTypes: ['warmup', 'strength', 'conditioning', 'accessory', 'cooldown'],
    contraindications: ['max_strength_phase', 'skill_peaking'],
    
    rules: {
      repRangeMin: 10,
      repRangeMax: 20,
      setRangeMin: 2,
      setRangeMax: 4,
      targetRPE: [6, 8],
      restTimeMin: 30,
      restTimeMax: 90,
      maxTotalSets: 16,
      maxExercises: 5,
      densityAllowed: true,
      supersetAllowed: true,
      dropSetAllowed: true,
      progressionSpeed: 'fast',
      deloadFrequency: 'every_4_weeks',
      failurePolicy: 'occasional',
      skillFirst: false,
      maxNeuralDemand: 3,
      fatiguePreservation: false,
      warmupEmphasis: 'standard',
    },
    
    notes: 'Supersets, circuits, controlled failure budgeting.',
  },

  // -------------------------------------------------------------------------
  // F. FLEXIBILITY EXPOSURE
  // -------------------------------------------------------------------------
  flexibility_exposure: {
    id: 'flexibility_exposure',
    name: 'Flexibility Exposure',
    category: 'flexibility',
    shortDescription: 'Low-soreness depth improvement through frequent exposure',
    publicLabel: 'Range-building',
    
    intendedGoalTypes: ['pancake', 'toe_touch', 'front_splits', 'side_splits'],
    intendedSkillTypes: ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'l_sit', 'v_sit'],
    intendedExperienceLevels: ['beginner', 'intermediate', 'advanced'],
    intendedRecoveryProfiles: ['minimal', 'light'],
    intendedSessionLengths: ['short', 'medium'],
    
    fatigueCost: 1,
    sorenessRisk: 1,
    frequencySuitability: 'daily',
    intensityBias: 'low',
    volumeBias: 'moderate',
    techniqueBias: 'moderate',
    progressionBias: 'conservative',
    
    whenToUse: [
      'User wants deeper range',
      'Low soreness tolerance',
      'High training frequency desired',
      'Flexibility as primary goal',
    ],
    whenNotToUse: [
      'User wants strength in end range',
      'Needs loaded mobility work',
      'Already has sufficient passive range',
    ],
    compatibleSkills: ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'l_sit', 'v_sit'],
    compatibleExerciseTags: ['flexibility', 'stretch', 'mobility', 'passive'],
    compatibleBlockTypes: ['warmup', 'flexibility', 'cooldown'],
    contraindications: ['needs_active_range', 'strength_in_range_goal'],
    
    rules: {
      repRangeMin: 1,
      repRangeMax: 3,
      setRangeMin: 3,
      setRangeMax: 3, // Always 3 rounds
      holdDurationMin: 15,
      holdDurationMax: 15, // Always 15 seconds
      targetRPE: [4, 6],
      restTimeMin: 5,
      restTimeMax: 15,
      maxTotalSets: 12,
      maxExercises: 4,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'slow',
      deloadFrequency: 'rarely',
      failurePolicy: 'avoid',
      skillFirst: false,
      maxNeuralDemand: 1,
      fatiguePreservation: true,
      warmupEmphasis: 'minimal',
    },
    
    notes: '15s holds, 3 rounds, multiple angles. Trainable daily.',
  },

  // -------------------------------------------------------------------------
  // G. MOBILITY STRENGTH
  // -------------------------------------------------------------------------
  mobility_strength: {
    id: 'mobility_strength',
    name: 'Mobility Strength',
    category: 'mobility',
    shortDescription: 'Active strength and control in end range positions',
    publicLabel: 'Active range strength',
    
    intendedGoalTypes: ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'l_sit', 'v_sit'],
    intendedSkillTypes: ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'l_sit', 'v_sit', 'i_sit'],
    intendedExperienceLevels: ['intermediate', 'advanced'],
    intendedRecoveryProfiles: ['moderate', 'heavy'],
    intendedSessionLengths: ['medium', 'long'],
    
    fatigueCost: 3,
    sorenessRisk: 3,
    frequencySuitability: 'low',
    intensityBias: 'moderate',
    volumeBias: 'low',
    techniqueBias: 'high',
    progressionBias: 'moderate',
    
    whenToUse: [
      'User wants strength in end range',
      'Loaded flexibility work needed',
      'Active range for skills (L-sit, V-sit)',
      'User can handle moderate soreness',
    ],
    whenNotToUse: [
      'User only wants passive depth',
      'Recovery is limited',
      'Very frequent training desired',
    ],
    compatibleSkills: ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'l_sit', 'v_sit', 'i_sit'],
    compatibleExerciseTags: ['mobility', 'loaded', 'active', 'compression'],
    compatibleBlockTypes: ['warmup', 'mobility', 'strength', 'cooldown'],
    contraindications: ['passive_range_only', 'recovery_limited'],
    
    rules: {
      repRangeMin: 5,
      repRangeMax: 10,
      setRangeMin: 2,
      setRangeMax: 4,
      holdDurationMin: 10,
      holdDurationMax: 30,
      targetRPE: [7, 8],
      restTimeMin: 60,
      restTimeMax: 120,
      maxTotalSets: 12,
      maxExercises: 4,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'moderate',
      deloadFrequency: 'every_4_weeks',
      failurePolicy: 'occasional',
      skillFirst: false,
      maxNeuralDemand: 3,
      fatiguePreservation: false,
      warmupEmphasis: 'thorough',
    },
    
    notes: 'Loaded stretching, active range drills. Treat like strength work.',
  },

  // -------------------------------------------------------------------------
  // H. HYBRID SKILL STRENGTH
  // -------------------------------------------------------------------------
  hybrid_skill_strength: {
    id: 'hybrid_skill_strength',
    name: 'Hybrid Skill-Strength',
    category: 'hybrid',
    shortDescription: 'Blend static skill work with weighted support strength',
    publicLabel: 'Skill and strength combined',
    
    intendedGoalTypes: ['front_lever', 'planche', 'muscle_up', 'hspu'],
    intendedSkillTypes: ['front_lever', 'planche', 'muscle_up', 'hspu', 'weighted_pull', 'weighted_dip'],
    intendedExperienceLevels: ['intermediate', 'advanced'],
    intendedRecoveryProfiles: ['moderate', 'heavy'],
    intendedSessionLengths: ['medium', 'long'],
    
    fatigueCost: 4,
    sorenessRisk: 3,
    frequencySuitability: 'moderate',
    intensityBias: 'high',
    volumeBias: 'moderate',
    techniqueBias: 'high',
    progressionBias: 'moderate',
    
    whenToUse: [
      'User wants both skill and strength',
      'Front lever + weighted pull-up combination',
      'Planche + push strength needed',
      'Skill progress requires more raw force',
    ],
    whenNotToUse: [
      'User is a beginner',
      'Recovery is very limited',
      'Skill-only focus desired',
    ],
    compatibleSkills: ['front_lever', 'planche', 'muscle_up', 'hspu', 'weighted_pull', 'weighted_dip'],
    compatibleExerciseTags: ['skill', 'weighted', 'static', 'compound'],
    compatibleBlockTypes: ['warmup', 'skill', 'strength', 'accessory', 'cooldown'],
    contraindications: ['beginner', 'recovery_limited'],
    
    rules: {
      repRangeMin: 3,
      repRangeMax: 8,
      setRangeMin: 3,
      setRangeMax: 5,
      holdDurationMin: 5,
      holdDurationMax: 15,
      targetRPE: [7, 9],
      restTimeMin: 120,
      restTimeMax: 240,
      maxTotalSets: 20,
      maxExercises: 5,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'moderate',
      deloadFrequency: 'every_4_weeks',
      failurePolicy: 'occasional',
      skillFirst: true,
      maxNeuralDemand: 5,
      fatiguePreservation: true,
      warmupEmphasis: 'thorough',
    },
    
    notes: 'Skill work first, then weighted support. Balance both qualities.',
  },

  // -------------------------------------------------------------------------
  // I. RECOVERY CONSERVATIVE
  // -------------------------------------------------------------------------
  recovery_conservative: {
    id: 'recovery_conservative',
    name: 'Recovery Conservative',
    category: 'recovery',
    shortDescription: 'Low-fatigue maintenance with reduced volume',
    publicLabel: 'Recovery-aware training',
    
    intendedGoalTypes: ['front_lever', 'planche', 'muscle_up', 'handstand', 'general_strength'],
    intendedSkillTypes: ['front_lever', 'planche', 'muscle_up', 'handstand', 'hspu', 'l_sit', 'v_sit'],
    intendedExperienceLevels: ['beginner', 'intermediate', 'advanced'],
    intendedRecoveryProfiles: ['minimal', 'light'],
    intendedSessionLengths: ['short', 'medium'],
    
    fatigueCost: 1,
    sorenessRisk: 1,
    frequencySuitability: 'high',
    intensityBias: 'low',
    volumeBias: 'minimal',
    techniqueBias: 'moderate',
    progressionBias: 'conservative',
    
    whenToUse: [
      'User has low readiness/fatigue',
      'Poor sleep or recovery',
      'Deload period',
      'Maintenance phase',
      'High life stress',
    ],
    whenNotToUse: [
      'User is well recovered',
      'Progress push phase',
      'User wants intensity',
    ],
    compatibleSkills: ['front_lever', 'planche', 'muscle_up', 'handstand', 'hspu', 'l_sit', 'v_sit'],
    compatibleExerciseTags: ['any'],
    compatibleBlockTypes: ['warmup', 'skill', 'strength', 'cooldown'],
    contraindications: ['progress_push', 'well_recovered'],
    
    rules: {
      repRangeMin: 3,
      repRangeMax: 8,
      setRangeMin: 2,
      setRangeMax: 3,
      holdDurationMin: 5,
      holdDurationMax: 10,
      targetRPE: [5, 7],
      restTimeMin: 120,
      restTimeMax: 180,
      maxTotalSets: 10,
      maxExercises: 4,
      densityAllowed: false,
      supersetAllowed: false,
      dropSetAllowed: false,
      progressionSpeed: 'slow',
      deloadFrequency: 'as_needed',
      failurePolicy: 'avoid',
      skillFirst: true,
      maxNeuralDemand: 3,
      fatiguePreservation: true,
      warmupEmphasis: 'standard',
    },
    
    notes: 'Reduced volume, maintain technique, prioritize recovery.',
  },
}

// =============================================================================
// SKILL-TO-PRINCIPLE COMPATIBILITY MATRIX
// =============================================================================

export interface SkillMethodCompatibility {
  skill: SkillType
  primaryMethods: MethodProfileId[]
  secondaryMethods: MethodProfileId[]
  notRecommended: MethodProfileId[]
  progressionNotes: string
}

export const SKILL_METHOD_MATRIX: Record<SkillType, SkillMethodCompatibility> = {
  // Static pulling skill
  front_lever: {
    skill: 'front_lever',
    primaryMethods: ['static_skill_density', 'hybrid_skill_strength'],
    secondaryMethods: ['weighted_strength', 'hypertrophy_support'],
    notRecommended: ['endurance_density', 'flexibility_exposure'],
    progressionNotes: 'Emphasize static holds with weighted pull-up support',
  },
  
  // Static pushing skill
  planche: {
    skill: 'planche',
    primaryMethods: ['static_skill_density', 'hybrid_skill_strength'],
    secondaryMethods: ['hypertrophy_support', 'recovery_conservative'],
    notRecommended: ['endurance_density', 'weighted_strength'],
    progressionNotes: 'High technique focus, straight arm emphasis, shoulder support',
  },
  
  // Dynamic explosive skill
  muscle_up: {
    skill: 'muscle_up',
    primaryMethods: ['explosive_power', 'weighted_strength'],
    secondaryMethods: ['endurance_density', 'hybrid_skill_strength'],
    notRecommended: ['flexibility_exposure', 'recovery_conservative'],
    progressionNotes: 'Explosive pulling power with transition technique',
  },
  
  // Overhead pushing skill
  handstand: {
    skill: 'handstand',
    primaryMethods: ['static_skill_density'],
    secondaryMethods: ['hybrid_skill_strength', 'recovery_conservative'],
    notRecommended: ['weighted_strength', 'endurance_density'],
    progressionNotes: 'Balance and technique focused, frequent practice',
  },
  
  hspu: {
    skill: 'hspu',
    primaryMethods: ['hybrid_skill_strength', 'static_skill_density'],
    secondaryMethods: ['weighted_strength', 'hypertrophy_support'],
    notRecommended: ['endurance_density', 'flexibility_exposure'],
    progressionNotes: 'Overhead strength with balance component',
  },
  
  // Compression skills
  l_sit: {
    skill: 'l_sit',
    primaryMethods: ['static_skill_density', 'flexibility_exposure'],
    secondaryMethods: ['mobility_strength', 'hypertrophy_support'],
    notRecommended: ['weighted_strength', 'explosive_power'],
    progressionNotes: 'Compression strength plus hamstring flexibility',
  },
  
  v_sit: {
    skill: 'v_sit',
    primaryMethods: ['static_skill_density', 'mobility_strength'],
    secondaryMethods: ['flexibility_exposure', 'hypertrophy_support'],
    notRecommended: ['weighted_strength', 'explosive_power'],
    progressionNotes: 'Advanced compression requiring active flexibility',
  },
  
  i_sit: {
    skill: 'i_sit',
    primaryMethods: ['static_skill_density', 'mobility_strength'],
    secondaryMethods: ['flexibility_exposure'],
    notRecommended: ['weighted_strength', 'endurance_density', 'explosive_power'],
    progressionNotes: 'Elite compression requiring maximum flexibility and strength',
  },
  
  // Flexibility/mobility skills
  pancake: {
    skill: 'pancake',
    primaryMethods: ['flexibility_exposure', 'mobility_strength'],
    secondaryMethods: ['static_skill_density'],
    notRecommended: ['weighted_strength', 'endurance_density', 'explosive_power'],
    progressionNotes: 'Choose flexibility for depth or mobility for active strength',
  },
  
  toe_touch: {
    skill: 'toe_touch',
    primaryMethods: ['flexibility_exposure', 'mobility_strength'],
    secondaryMethods: ['static_skill_density'],
    notRecommended: ['weighted_strength', 'endurance_density', 'explosive_power'],
    progressionNotes: 'Foundation for pike compression skills',
  },
  
  front_splits: {
    skill: 'front_splits',
    primaryMethods: ['flexibility_exposure', 'mobility_strength'],
    secondaryMethods: [],
    notRecommended: ['weighted_strength', 'endurance_density', 'explosive_power', 'static_skill_density'],
    progressionNotes: 'Hip flexor and hamstring balance',
  },
  
  side_splits: {
    skill: 'side_splits',
    primaryMethods: ['flexibility_exposure', 'mobility_strength'],
    secondaryMethods: [],
    notRecommended: ['weighted_strength', 'endurance_density', 'explosive_power', 'static_skill_density'],
    progressionNotes: 'Adductor flexibility and hip opening',
  },
  
  // Strength goals
  weighted_pull: {
    skill: 'weighted_pull',
    primaryMethods: ['weighted_strength'],
    secondaryMethods: ['hybrid_skill_strength', 'hypertrophy_support'],
    notRecommended: ['flexibility_exposure', 'recovery_conservative'],
    progressionNotes: 'Progressive overload emphasis',
  },
  
  weighted_dip: {
    skill: 'weighted_dip',
    primaryMethods: ['weighted_strength'],
    secondaryMethods: ['hybrid_skill_strength', 'hypertrophy_support'],
    notRecommended: ['flexibility_exposure', 'recovery_conservative'],
    progressionNotes: 'Progressive overload emphasis',
  },
  
  general_strength: {
    skill: 'general_strength',
    primaryMethods: ['weighted_strength', 'hypertrophy_support'],
    secondaryMethods: ['endurance_density', 'hybrid_skill_strength'],
    notRecommended: ['flexibility_exposure', 'static_skill_density'],
    progressionNotes: 'Balanced pulling and pushing strength',
  },
}

// =============================================================================
// PRINCIPLE SELECTION ENGINE
// =============================================================================

export interface SelectionContext {
  // User profile
  primaryGoal: SkillType
  secondaryGoals?: SkillType[]
  experienceLevel: ExperienceLevel
  recoveryCapacity: RecoveryProfile
  sorenessToleranceHigh: boolean
  
  // Session constraints
  sessionMinutes: number
  trainingDaysPerWeek: number
  
  // Current state
  currentFatigueLevel: 'low' | 'moderate' | 'high'
  recentSorenessLevel: 'none' | 'mild' | 'moderate' | 'high'
  
  // Tendon adaptation (from skill training history)
  tendonAdaptationLevel?: 'low' | 'moderate' | 'high'
  
  // Preferences
  rangeTrainingMode?: RangeTrainingMode
  wantsHypertrophy?: boolean
  wantsEndurance?: boolean
}

export interface SelectedMethods {
  primary: MethodProfile
  secondary?: MethodProfile
  modifiers?: MethodProfileId[]
  
  // User-facing explanation
  explanation: string
  shortSummary: string
}

/**
 * Select optimal method profiles based on user context
 */
export function selectMethodProfiles(context: SelectionContext): SelectedMethods {
  const { primaryGoal, experienceLevel, currentFatigueLevel, rangeTrainingMode } = context
  
  // Get skill compatibility
  const skillCompat = SKILL_METHOD_MATRIX[primaryGoal]
  if (!skillCompat) {
    // Default to hybrid skill strength if skill not found
    return {
      primary: METHOD_PROFILES.hybrid_skill_strength,
      explanation: 'Your plan uses a balanced approach for skill development.',
      shortSummary: 'Balanced skill training',
    }
  }
  
  // Check if recovery-conservative should override
  if (currentFatigueLevel === 'high' || context.recentSorenessLevel === 'high') {
    return {
      primary: METHOD_PROFILES.recovery_conservative,
      secondary: METHOD_PROFILES[skillCompat.primaryMethods[0]],
      explanation: 'Your plan favors recovery this week due to fatigue signals.',
      shortSummary: 'Recovery-aware',
    }
  }
  
  // Handle flexibility/mobility goals
  const flexMobilitySkills: SkillType[] = ['pancake', 'toe_touch', 'front_splits', 'side_splits']
  if (flexMobilitySkills.includes(primaryGoal)) {
    if (rangeTrainingMode === 'mobility') {
      return {
        primary: METHOD_PROFILES.mobility_strength,
        explanation: 'Your range training favors mobility to build strength in deep positions.',
        shortSummary: 'Active range strength',
      }
    } else if (rangeTrainingMode === 'hybrid') {
      return {
        primary: METHOD_PROFILES.flexibility_exposure,
        secondary: METHOD_PROFILES.mobility_strength,
        explanation: 'Your plan combines flexibility exposure with targeted mobility strength.',
        shortSummary: 'Depth and strength combined',
      }
    } else {
      return {
        primary: METHOD_PROFILES.flexibility_exposure,
        explanation: 'Your range training favors flexibility for low-soreness progress.',
        shortSummary: 'Range-building',
      }
    }
  }
  
  // Handle strength goals
  const strengthSkills: SkillType[] = ['weighted_pull', 'weighted_dip', 'general_strength']
  if (strengthSkills.includes(primaryGoal)) {
    const primary = METHOD_PROFILES.weighted_strength
    const secondary = context.wantsHypertrophy 
      ? METHOD_PROFILES.hypertrophy_support 
      : context.wantsEndurance
        ? METHOD_PROFILES.endurance_density
        : undefined
    
    return {
      primary,
      secondary,
      explanation: 'Your plan is strength-focused with progressive loading.',
      shortSummary: 'Strength-focused',
    }
  }
  
  // Handle skill goals
  const primaryMethod = skillCompat.primaryMethods[0]
  let primary = METHOD_PROFILES[primaryMethod]
  
  // Adjust based on experience level
  if (experienceLevel === 'beginner' && primary.id === 'hybrid_skill_strength') {
    primary = METHOD_PROFILES.static_skill_density
  }
  
  // Adjust based on tendon adaptation level
  // Low tendon adaptation = foundation focus (less intense skill exposure)
  // High tendon adaptation = can handle more aggressive methods
  if (context.tendonAdaptationLevel === 'low') {
    // Low tendon adaptation - start with static density for controlled exposure
    if (primary.id === 'dynamic_skill_mastery' || primary.id === 'hybrid_skill_strength') {
      primary = METHOD_PROFILES.static_skill_density
    }
  } else if (context.tendonAdaptationLevel === 'high' && experienceLevel !== 'beginner') {
    // High tendon adaptation with experience - can use more dynamic methods
    if (primary.id === 'static_skill_density' && skillCompat.primaryMethods.includes('hybrid_skill_strength')) {
      primary = METHOD_PROFILES.hybrid_skill_strength
    }
  }
  
  // Select secondary based on context
  let secondary: MethodProfile | undefined
  if (context.secondaryGoals?.some(g => strengthSkills.includes(g))) {
    secondary = METHOD_PROFILES.weighted_strength
  } else if (context.wantsHypertrophy) {
    secondary = METHOD_PROFILES.hypertrophy_support
  } else if (skillCompat.secondaryMethods.length > 0) {
    secondary = METHOD_PROFILES[skillCompat.secondaryMethods[0]]
  }
  
  // Build explanation
  const explanation = buildExplanation(primary, secondary)
  
  return {
    primary,
    secondary,
    explanation,
    shortSummary: primary.publicLabel,
  }
}

function buildExplanation(primary: MethodProfile, secondary?: MethodProfile): string {
  if (secondary) {
    return `Your plan emphasizes ${primary.publicLabel.toLowerCase()} with ${secondary.publicLabel.toLowerCase()} support.`
  }
  return `Your plan is ${primary.publicLabel.toLowerCase()}.`
}

// =============================================================================
// PUBLIC-FACING EXPLANATIONS
// =============================================================================

export const PLAN_EXPLANATIONS = {
  weighted_strength: 'Your plan is strength-focused.',
  static_skill_density: 'Your plan emphasizes static skill quality.',
  hypertrophy_support: 'Your plan builds support strength for skill development.',
  explosive_power: 'Your plan is power-focused for explosive movements.',
  endurance_density: 'Your plan builds work capacity and endurance.',
  flexibility_exposure: 'Your range training favors flexibility for low-soreness progress.',
  mobility_strength: 'Your range training favors mobility to build strength in deep positions.',
  hybrid_skill_strength: 'Your plan blends skill practice with weighted support strength.',
  recovery_conservative: 'Your plan is adjusted for recovery this week.',
} as const

export const TRAINING_EMPHASIS_DESCRIPTIONS = {
  weighted_strength: 'Heavy loading, lower reps, longer rest periods.',
  static_skill_density: 'Short quality holds, avoid failure, preserve technique.',
  hypertrophy_support: 'Moderate reps, higher volume for muscle development.',
  explosive_power: 'Maximum intent, full recovery between sets.',
  endurance_density: 'Higher reps, shorter rest, conditioning focus.',
  flexibility_exposure: '15-second holds, 3 rounds, multiple angles.',
  mobility_strength: 'Loaded drills, active range work, moderate intensity.',
  hybrid_skill_strength: 'Skill work first, then weighted support.',
  recovery_conservative: 'Reduced volume, maintain technique, prioritize rest.',
} as const

// =============================================================================
// EXERCISE TAGGING HELPERS
// =============================================================================

export interface ExerciseMethodTags {
  exerciseId: string
  compatibleMethods: MethodProfileId[]
}

/**
 * Get compatible methods for an exercise based on its characteristics
 */
export function getExerciseMethodCompatibility(exercise: Exercise): MethodProfileId[] {
  const methods: MethodProfileId[] = []
  
  // Check for weighted/strength compatibility
  if (exercise.id.includes('weighted') || exercise.category === 'strength') {
    methods.push('weighted_strength', 'hybrid_skill_strength')
  }
  
  // Check for skill/static compatibility
  if (exercise.isIsometric || exercise.category === 'skill') {
    methods.push('static_skill_density')
  }
  
  // Check for flexibility compatibility
  if (exercise.category === 'flexibility' || exercise.movementPattern === 'mobility') {
    methods.push('flexibility_exposure', 'mobility_strength')
  }
  
  // Check for hypertrophy compatibility
  if (exercise.category === 'accessory' || (exercise.defaultSets >= 3 && !exercise.isIsometric)) {
    methods.push('hypertrophy_support')
  }
  
  // Check for explosive/power compatibility
  if (exercise.id.includes('explosive') || exercise.id.includes('dynamic')) {
    methods.push('explosive_power')
  }
  
  // Most exercises are recovery-compatible at lower intensity
  methods.push('recovery_conservative')
  
  return [...new Set(methods)]
}

// =============================================================================
// DASHBOARD INSIGHT HELPERS
// =============================================================================

export interface WeeklyEmphasis {
  primaryEmphasis: string
  secondaryEmphasis?: string
  rationale: string
}

/**
 * Generate dashboard insight text for current training emphasis
 */
export function getWeeklyEmphasisInsight(selectedMethods: SelectedMethods): WeeklyEmphasis {
  const { primary, secondary } = selectedMethods
  
  return {
    primaryEmphasis: primary.publicLabel,
    secondaryEmphasis: secondary?.publicLabel,
    rationale: selectedMethods.explanation,
  }
}

/**
 * Get a short coaching message based on selected methods
 */
export function getCoachingMessage(selectedMethods: SelectedMethods): string {
  const messages: Record<MethodProfileId, string[]> = {
    weighted_strength: [
      'Focus on quality reps with full recovery between sets.',
      'Progressive overload is the goal this week.',
    ],
    static_skill_density: [
      'Short, clean holds. Quality over duration.',
      'Stay fresh for each set. Avoid grinding.',
    ],
    hypertrophy_support: [
      'Building the foundation for your skills.',
      'Controlled reps, feel the muscle work.',
    ],
    explosive_power: [
      'Maximum intent on every rep.',
      'Rest fully between sets. Speed matters.',
    ],
    endurance_density: [
      'Manage your fatigue throughout the session.',
      'Push the pace but stay technical.',
    ],
    flexibility_exposure: [
      'Short holds, breathe deeply, stay relaxed.',
      'Consistency beats intensity for flexibility.',
    ],
    mobility_strength: [
      'Own each position with control.',
      'Active effort in your end range.',
    ],
    hybrid_skill_strength: [
      'Skill work first while fresh.',
      'Build the strength to support your skills.',
    ],
    recovery_conservative: [
      'Listen to your body this week.',
      'Maintain technique, reduce intensity.',
    ],
  }
  
  const primaryMessages = messages[selectedMethods.primary.id]
  return primaryMessages[Math.floor(Math.random() * primaryMessages.length)]
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type MethodProfile,
  type MethodRules,
  type SkillMethodCompatibility,
}
