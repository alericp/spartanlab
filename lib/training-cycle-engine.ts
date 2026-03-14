/**
 * SpartanLab Training Cycle Engine
 * 
 * Implements modular cycle-based programming for calisthenics training.
 * Supports periodized training with distinct phases for different adaptations.
 * 
 * CYCLE TYPES:
 * - Skill Cycle: High skill exposure, technique focus
 * - Strength Cycle: Low reps, high intensity, neural output
 * - Hypertrophy Cycle: Moderate-high volume, muscle growth
 * - Endurance Cycle: High reps, conditioning focus
 * - Mixed Cycle: Balanced approach for general development
 * 
 * NO athlete names or branded methods exposed in UI.
 */

import type { ExperienceLevel, PrimaryGoal } from './program-service'
import type { PrimaryTrainingOutcome } from './athlete-profile'

// =============================================================================
// CORE CYCLE TYPES
// =============================================================================

export type CycleType = 'skill' | 'strength' | 'hypertrophy' | 'endurance' | 'mixed' | 'peak' | 'deload'

export type CycleFocus = 
  | 'planche'
  | 'front_lever'
  | 'handstand'
  | 'muscle_up'
  | 'iron_cross'
  | 'one_arm_pull_up'
  | 'weighted_pull'
  | 'weighted_dip'
  | 'upper_body'
  | 'pull_focus'
  | 'push_focus'
  | 'full_body'
  | 'general'

export interface VolumeDistribution {
  skillWork: number      // 0-100 percentage
  strengthWork: number   // 0-100 percentage
  hypertrophyWork: number // 0-100 percentage
  enduranceWork: number  // 0-100 percentage
  mobilityWork: number   // 0-100 percentage
}

export interface IntensityDistribution {
  lowIntensity: number   // 0-100 percentage (RPE 5-6)
  moderateIntensity: number // 0-100 percentage (RPE 7-8)
  highIntensity: number  // 0-100 percentage (RPE 9-10)
}

export interface ProgressionPacing {
  weeklyProgressionRate: 'slow' | 'moderate' | 'aggressive'
  deloadFrequency: number // weeks between deloads
  plateauProtocol: string
  advancementCriteria: string[]
}

export interface ExerciseBias {
  preferredMovementPatterns: string[]
  avoidedMovementPatterns: string[]
  equipmentPriority: string[]
  repRangePreference: { min: number; max: number }
  restPeriodPreference: { min: number; max: number } // seconds
}

export interface RecoveryBias {
  sessionFrequencyMax: number
  requiredRestDays: number
  sleepEmphasis: 'standard' | 'elevated' | 'critical'
  nutritionEmphasis: 'maintenance' | 'surplus' | 'slight_surplus'
  stressToleranceLevel: 'low' | 'moderate' | 'high'
}

// =============================================================================
// TRAINING CYCLE DEFINITION
// =============================================================================

export interface TrainingCycle {
  id: string
  name: string
  type: CycleType
  focus: CycleFocus
  durationWeeks: number
  
  // Core distributions
  trainingEmphasis: string
  volumeDistribution: VolumeDistribution
  intensityDistribution: IntensityDistribution
  progressionPacing: ProgressionPacing
  exerciseBias: ExerciseBias
  recoveryBias: RecoveryBias
  
  // Session structure
  sessionsPerWeek: { min: number; max: number }
  sessionDurationMinutes: { min: number; max: number }
  
  // Cycle-specific rules
  keyPrinciples: string[]
  avoidanceCriteria: string[]
  successMetrics: string[]
  
  // Transition rules
  recommendedFollowUp: CycleType[]
  prerequisites: string[]
}

// =============================================================================
// SKILL CYCLES
// =============================================================================

export const PLANCHE_SKILL_CYCLE: TrainingCycle = {
  id: 'planche_skill',
  name: 'Planche Skill Development',
  type: 'skill',
  focus: 'planche',
  durationWeeks: 6,
  
  trainingEmphasis: 'High frequency skill exposure with controlled fatigue. Focus on positional strength and lean mechanics.',
  
  volumeDistribution: {
    skillWork: 45,
    strengthWork: 35,
    hypertrophyWork: 10,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 20,
    moderateIntensity: 60,
    highIntensity: 20,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'slow',
    deloadFrequency: 4,
    plateauProtocol: 'Reduce hold times, increase frequency, add easier progressions',
    advancementCriteria: [
      'Consistent 8-10 second holds at current progression',
      'No shoulder or wrist discomfort',
      'Clean body line maintained throughout',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['planche leans', 'tuck planche', 'pseudo planche push-ups', 'planche press attempts'],
    avoidedMovementPatterns: ['heavy overhead pressing', 'excessive dip volume'],
    equipmentPriority: ['parallettes', 'floor', 'rings'],
    repRangePreference: { min: 3, max: 8 },
    restPeriodPreference: { min: 120, max: 180 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 5,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'slight_surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 3, max: 5 },
  sessionDurationMinutes: { min: 45, max: 75 },
  
  keyPrinciples: [
    'Skill work performed when fresh (beginning of session)',
    'Quality over quantity - stop before form breakdown',
    'Frequent short exposures rather than infrequent long sessions',
    'Support straight-arm strength with bent-arm pushing',
  ],
  
  avoidanceCriteria: [
    'Training to failure on planche-specific work',
    'High volume push accessory work same day',
    'Excessive wrist stress exercises',
  ],
  
  successMetrics: [
    'Hold time progression (target +2-3 seconds per 2 weeks)',
    'Cleaner body position',
    'Reduced perceived effort at same progression',
  ],
  
  recommendedFollowUp: ['strength', 'hypertrophy', 'mixed'],
  prerequisites: ['Solid push-up strength (25+ reps)', 'Basic wrist conditioning', 'Scapular protraction control'],
}

export const FRONT_LEVER_SKILL_CYCLE: TrainingCycle = {
  id: 'front_lever_skill',
  name: 'Front Lever Skill Development',
  type: 'skill',
  focus: 'front_lever',
  durationWeeks: 6,
  
  trainingEmphasis: 'High frequency exposure with pulling strength support. Focus on scapular depression and bodyline control.',
  
  volumeDistribution: {
    skillWork: 45,
    strengthWork: 35,
    hypertrophyWork: 10,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 20,
    moderateIntensity: 60,
    highIntensity: 20,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'slow',
    deloadFrequency: 4,
    plateauProtocol: 'Add negatives, reduce hold duration, increase pulling volume',
    advancementCriteria: [
      'Consistent 8-10 second holds with proper depression',
      'Clean horizontal body line',
      'No excessive lower back compensation',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['front lever raises', 'front lever holds', 'ice cream makers', 'inverted rows'],
    avoidedMovementPatterns: ['high volume bicep curls', 'excessive grip work'],
    equipmentPriority: ['bar', 'rings', 'stall bars'],
    repRangePreference: { min: 3, max: 8 },
    restPeriodPreference: { min: 120, max: 180 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 5,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'slight_surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 3, max: 5 },
  sessionDurationMinutes: { min: 45, max: 75 },
  
  keyPrinciples: [
    'Skill work performed early in session',
    'Emphasize scapular depression throughout',
    'Use dynamic work to build static strength',
    'Support with weighted pulling',
  ],
  
  avoidanceCriteria: [
    'High volume pull accessory work before skill work',
    'Training to complete failure',
    'Ignoring bodyline quality',
  ],
  
  successMetrics: [
    'Hold time progression',
    'Improved bodyline',
    'Reduced bicep fatigue in holds',
  ],
  
  recommendedFollowUp: ['strength', 'hypertrophy', 'mixed'],
  prerequisites: ['10+ strict pull-ups', 'Basic inverted hang comfort', 'Scapular depression control'],
}

export const HANDSTAND_SKILL_CYCLE: TrainingCycle = {
  id: 'handstand_skill',
  name: 'Handstand Balance Development',
  type: 'skill',
  focus: 'handstand',
  durationWeeks: 8,
  
  trainingEmphasis: 'High frequency balance practice with short sessions. Focus on proprioception and micro-corrections.',
  
  volumeDistribution: {
    skillWork: 60,
    strengthWork: 20,
    hypertrophyWork: 5,
    enduranceWork: 0,
    mobilityWork: 15,
  },
  
  intensityDistribution: {
    lowIntensity: 40,
    moderateIntensity: 50,
    highIntensity: 10,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'slow',
    deloadFrequency: 6,
    plateauProtocol: 'Increase daily practice frequency, reduce per-session volume',
    advancementCriteria: [
      'Consistent 15+ second freestanding holds',
      'Reliable kick-up entry',
      'Clean bail technique',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['wall handstand', 'kick-ups', 'heel pulls', 'freestanding attempts'],
    avoidedMovementPatterns: ['excessive HSPU volume if balance is primary goal'],
    equipmentPriority: ['wall', 'floor', 'parallettes'],
    repRangePreference: { min: 3, max: 10 },
    restPeriodPreference: { min: 60, max: 120 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 7,
    requiredRestDays: 0,
    sleepEmphasis: 'standard',
    nutritionEmphasis: 'maintenance',
    stressToleranceLevel: 'high',
  },
  
  sessionsPerWeek: { min: 5, max: 7 },
  sessionDurationMinutes: { min: 10, max: 20 },
  
  keyPrinciples: [
    'Daily practice trumps long infrequent sessions',
    'Stop before fatigue degrades quality',
    '10-15 minutes of quality practice is sufficient',
    'Focus on one skill aspect per session',
  ],
  
  avoidanceCriteria: [
    'Training to wrist fatigue',
    'Long sessions that degrade quality',
    'Practicing bad habits when tired',
  ],
  
  successMetrics: [
    'Hold time increase',
    'Entry consistency',
    'Reduced wall dependency',
  ],
  
  recommendedFollowUp: ['mixed', 'strength'],
  prerequisites: ['30+ second wall handstand', 'Basic wrist conditioning', 'Shoulder mobility adequate'],
}

export const MUSCLE_UP_SKILL_CYCLE: TrainingCycle = {
  id: 'muscle_up_skill',
  name: 'Muscle-Up Skill Development',
  type: 'skill',
  focus: 'muscle_up',
  durationWeeks: 6,
  
  trainingEmphasis: 'Transition timing and explosive pulling. Focus on the coordination between pull and push phases.',
  
  volumeDistribution: {
    skillWork: 40,
    strengthWork: 40,
    hypertrophyWork: 10,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 15,
    moderateIntensity: 55,
    highIntensity: 30,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Focus on transition drills, add explosive pull variations',
    advancementCriteria: [
      'Consistent transition from pull to push',
      'Clean chest-to-bar pulls',
      'Strong dip at top',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['explosive pull-ups', 'transition drills', 'high pulls', 'dips'],
    avoidedMovementPatterns: ['excessive slow pulling that kills explosiveness'],
    equipmentPriority: ['bar', 'rings'],
    repRangePreference: { min: 3, max: 6 },
    restPeriodPreference: { min: 120, max: 180 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'slight_surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 3, max: 4 },
  sessionDurationMinutes: { min: 45, max: 75 },
  
  keyPrinciples: [
    'Explosive pulling is trained fresh',
    'Transition is a timing skill, not just strength',
    'False grip training on rings if applicable',
    'Dip strength supports the catch',
  ],
  
  avoidanceCriteria: [
    'Grinding slow reps',
    'Training when fatigued',
    'Ignoring dip portion',
  ],
  
  successMetrics: [
    'Transition smoothness',
    'Pull height',
    'Rep consistency',
  ],
  
  recommendedFollowUp: ['strength', 'hypertrophy', 'mixed'],
  prerequisites: ['10+ strict pull-ups', '15+ dips', 'Chest-to-bar pull-ups'],
}

export const ONE_ARM_PULL_UP_SKILL_CYCLE: TrainingCycle = {
  id: 'one_arm_pull_up_skill',
  name: 'One-Arm Pull-Up Development',
  type: 'skill',
  focus: 'one_arm_pull_up',
  durationWeeks: 8,
  
  trainingEmphasis: 'Unilateral pulling strength development with progressive assistance reduction.',
  
  volumeDistribution: {
    skillWork: 35,
    strengthWork: 50,
    hypertrophyWork: 10,
    enduranceWork: 0,
    mobilityWork: 5,
  },
  
  intensityDistribution: {
    lowIntensity: 10,
    moderateIntensity: 50,
    highIntensity: 40,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'slow',
    deloadFrequency: 4,
    plateauProtocol: 'Add weighted bilateral pulls, increase assisted OAP volume',
    advancementCriteria: [
      'Clean assisted reps with minimal support',
      'Controlled eccentric one-arm negatives',
      'Strong scapular engagement',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['archer pull-ups', 'assisted one-arm pulls', 'weighted pull-ups', 'typewriter pull-ups'],
    avoidedMovementPatterns: ['excessive grip-fatiguing work'],
    equipmentPriority: ['bar', 'rings', 'bands'],
    repRangePreference: { min: 1, max: 5 },
    restPeriodPreference: { min: 180, max: 300 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'slight_surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 3, max: 4 },
  sessionDurationMinutes: { min: 60, max: 90 },
  
  keyPrinciples: [
    'Quality singles and doubles over volume',
    'Train both arms to prevent imbalance',
    'Weighted bilateral pulls support OAP',
    'Eccentric control is critical',
  ],
  
  avoidanceCriteria: [
    'High rep endurance work on pull days',
    'Training through elbow pain',
    'Neglecting the weaker arm',
  ],
  
  successMetrics: [
    'Assistance reduction',
    'Eccentric control duration',
    'Bilateral weighted pull increases',
  ],
  
  recommendedFollowUp: ['strength', 'hypertrophy', 'mixed'],
  prerequisites: ['15+ strict pull-ups', '+50% BW weighted pull-up', 'No elbow issues'],
}

// =============================================================================
// STRENGTH CYCLES
// =============================================================================

export const WEIGHTED_PULL_STRENGTH_CYCLE: TrainingCycle = {
  id: 'weighted_pull_strength',
  name: 'Weighted Pull-Up Strength',
  type: 'strength',
  focus: 'weighted_pull',
  durationWeeks: 6,
  
  trainingEmphasis: 'Progressive overload on weighted pulling. Low reps, high intensity, complete recovery.',
  
  volumeDistribution: {
    skillWork: 5,
    strengthWork: 70,
    hypertrophyWork: 15,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 10,
    moderateIntensity: 30,
    highIntensity: 60,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Wave loading, add volume at lower intensity, rest more',
    advancementCriteria: [
      'Weight increases of 2.5-5 lbs per week on main sets',
      'Clean form through full ROM',
      'Consistent performance across sessions',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['weighted pull-up', 'weighted chin-up', 'heavy rows', 'lat pulldowns'],
    avoidedMovementPatterns: ['high volume bodyweight pulling', 'grip-intensive work'],
    equipmentPriority: ['dip belt', 'weight vest', 'cable machines'],
    repRangePreference: { min: 1, max: 5 },
    restPeriodPreference: { min: 180, max: 300 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 2,
    sleepEmphasis: 'critical',
    nutritionEmphasis: 'surplus',
    stressToleranceLevel: 'low',
  },
  
  sessionsPerWeek: { min: 3, max: 4 },
  sessionDurationMinutes: { min: 60, max: 90 },
  
  keyPrinciples: [
    'Prioritize main lift when fresh',
    'Long rest between heavy sets (3-5 minutes)',
    'Quality over quantity',
    'Track performance meticulously',
  ],
  
  avoidanceCriteria: [
    'Training to failure regularly',
    'Cutting rest periods',
    'Excessive accessory work',
  ],
  
  successMetrics: [
    'Weight progression on main lifts',
    'Rep quality at higher loads',
    'Recovery between sessions',
  ],
  
  recommendedFollowUp: ['hypertrophy', 'peak', 'skill'],
  prerequisites: ['15+ strict pull-ups', 'Some weighted pull experience', 'No shoulder issues'],
}

export const WEIGHTED_DIP_STRENGTH_CYCLE: TrainingCycle = {
  id: 'weighted_dip_strength',
  name: 'Weighted Dip Strength',
  type: 'strength',
  focus: 'weighted_dip',
  durationWeeks: 6,
  
  trainingEmphasis: 'Progressive overload on weighted dips. Build pushing foundation for skills.',
  
  volumeDistribution: {
    skillWork: 5,
    strengthWork: 70,
    hypertrophyWork: 15,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 10,
    moderateIntensity: 30,
    highIntensity: 60,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Add pause reps, increase ROM, wave loading',
    advancementCriteria: [
      'Weight increases maintaining depth',
      'Full ROM without shoulder compensation',
      'Consistent rep quality',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['weighted dips', 'close grip bench', 'overhead press', 'tricep work'],
    avoidedMovementPatterns: ['excessive chest flies', 'high volume push-ups'],
    equipmentPriority: ['dip station', 'dip belt', 'rings'],
    repRangePreference: { min: 3, max: 6 },
    restPeriodPreference: { min: 180, max: 300 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 2,
    sleepEmphasis: 'critical',
    nutritionEmphasis: 'surplus',
    stressToleranceLevel: 'low',
  },
  
  sessionsPerWeek: { min: 3, max: 4 },
  sessionDurationMinutes: { min: 60, max: 90 },
  
  keyPrinciples: [
    'Full ROM dips only',
    'Control the eccentric',
    'Long rest for neural recovery',
    'Track loads precisely',
  ],
  
  avoidanceCriteria: [
    'Partial ROM for ego weights',
    'Training through shoulder pain',
    'Excessive pressing volume',
  ],
  
  successMetrics: [
    'Weight progression',
    'Full ROM maintenance',
    'Shoulder health',
  ],
  
  recommendedFollowUp: ['hypertrophy', 'skill', 'mixed'],
  prerequisites: ['20+ bodyweight dips', 'Good shoulder mobility', 'No anterior shoulder issues'],
}

export const STREETLIFTING_STRENGTH_CYCLE: TrainingCycle = {
  id: 'streetlifting_strength',
  name: 'Streetlifting Strength',
  type: 'strength',
  focus: 'upper_body',
  durationWeeks: 8,
  
  trainingEmphasis: 'Maximize weighted dip and weighted pull-up totals. Competition-style training.',
  
  volumeDistribution: {
    skillWork: 0,
    strengthWork: 80,
    hypertrophyWork: 10,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 5,
    moderateIntensity: 30,
    highIntensity: 65,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Heavy singles, back-off sets, competition simulation',
    advancementCriteria: [
      'PR attempts progressing',
      'Performance repeatability',
      'Clean competition-standard reps',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['max weighted pull-up', 'max weighted dip', 'heavy rows', 'close grip pressing'],
    avoidedMovementPatterns: ['skill work that fatigues CNS', 'excessive conditioning'],
    equipmentPriority: ['competition-spec equipment', 'dip belt', 'calibrated weights'],
    repRangePreference: { min: 1, max: 3 },
    restPeriodPreference: { min: 240, max: 420 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 2,
    sleepEmphasis: 'critical',
    nutritionEmphasis: 'surplus',
    stressToleranceLevel: 'low',
  },
  
  sessionsPerWeek: { min: 3, max: 4 },
  sessionDurationMinutes: { min: 75, max: 120 },
  
  keyPrinciples: [
    'Peaking protocol for max attempts',
    'Competition-standard form only',
    'Strategic attempt selection',
    'Maximum recovery between sessions',
  ],
  
  avoidanceCriteria: [
    'Junk volume',
    'Form breakdown for PRs',
    'Insufficient recovery',
  ],
  
  successMetrics: [
    'Total weight (dip + pull combined)',
    'Consistent PR progression',
    'Competition readiness',
  ],
  
  recommendedFollowUp: ['hypertrophy', 'deload', 'mixed'],
  prerequisites: ['+50% BW on both movements', 'Competition experience recommended', 'No injuries'],
}

// =============================================================================
// HYPERTROPHY CYCLES
// =============================================================================

export const UPPER_HYPERTROPHY_CYCLE: TrainingCycle = {
  id: 'upper_hypertrophy',
  name: 'Upper Body Hypertrophy',
  type: 'hypertrophy',
  focus: 'upper_body',
  durationWeeks: 6,
  
  trainingEmphasis: 'Build muscle mass in upper body to support future strength and skill work.',
  
  volumeDistribution: {
    skillWork: 5,
    strengthWork: 20,
    hypertrophyWork: 65,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 20,
    moderateIntensity: 65,
    highIntensity: 15,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 5,
    plateauProtocol: 'Add sets, vary rep ranges, introduce new movements',
    advancementCriteria: [
      'Progressive overload on main movements',
      'Pump and soreness feedback',
      'Visual changes over cycle',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['rows', 'pull-ups', 'dips', 'push-ups', 'curls', 'tricep work', 'shoulder work'],
    avoidedMovementPatterns: ['heavy singles', 'max attempts'],
    equipmentPriority: ['dumbbells', 'cables', 'rings', 'bars'],
    repRangePreference: { min: 8, max: 15 },
    restPeriodPreference: { min: 60, max: 120 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 5,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 4, max: 5 },
  sessionDurationMinutes: { min: 60, max: 90 },
  
  keyPrinciples: [
    'Time under tension matters',
    'Full ROM for maximum stretch',
    'Progressive overload weekly',
    'Adequate protein intake',
  ],
  
  avoidanceCriteria: [
    'Ego lifting with partial ROM',
    'Skipping accessory work',
    'Under-eating',
  ],
  
  successMetrics: [
    'Rep progression at given weights',
    'Measurement changes',
    'Visual improvements',
  ],
  
  recommendedFollowUp: ['strength', 'skill', 'mixed'],
  prerequisites: ['Basic movement competency', 'Consistent training history', 'Nutrition plan in place'],
}

export const PULL_HYPERTROPHY_CYCLE: TrainingCycle = {
  id: 'pull_hypertrophy',
  name: 'Pull-Focused Hypertrophy',
  type: 'hypertrophy',
  focus: 'pull_focus',
  durationWeeks: 6,
  
  trainingEmphasis: 'Build pulling muscle mass. Back width, thickness, and bicep development.',
  
  volumeDistribution: {
    skillWork: 5,
    strengthWork: 20,
    hypertrophyWork: 65,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 20,
    moderateIntensity: 65,
    highIntensity: 15,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 5,
    plateauProtocol: 'Vary grip widths, add isolation work, increase volume',
    advancementCriteria: [
      'Pull-up rep increases',
      'Row weight increases',
      'Back development visible',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['pull-ups', 'chin-ups', 'rows', 'lat pulldowns', 'face pulls', 'curls', 'rear delts'],
    avoidedMovementPatterns: ['excessive pushing volume'],
    equipmentPriority: ['bar', 'cables', 'dumbbells', 'rings'],
    repRangePreference: { min: 8, max: 15 },
    restPeriodPreference: { min: 60, max: 120 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 5,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 4, max: 5 },
  sessionDurationMinutes: { min: 60, max: 75 },
  
  keyPrinciples: [
    'Hit back from multiple angles',
    'Include both horizontal and vertical pulls',
    'Control the eccentric',
    'Full stretch at bottom',
  ],
  
  avoidanceCriteria: [
    'Bicep-dominant pulling',
    'Momentum on rows',
    'Neglecting rear delts',
  ],
  
  successMetrics: [
    'Pull-up rep PRs',
    'Row strength increases',
    'Back development',
  ],
  
  recommendedFollowUp: ['strength', 'skill', 'mixed'],
  prerequisites: ['8+ pull-ups', 'Good lat engagement', 'No shoulder impingement'],
}

export const PUSH_HYPERTROPHY_CYCLE: TrainingCycle = {
  id: 'push_hypertrophy',
  name: 'Push-Focused Hypertrophy',
  type: 'hypertrophy',
  focus: 'push_focus',
  durationWeeks: 6,
  
  trainingEmphasis: 'Build pushing muscle mass. Chest, shoulders, and tricep development.',
  
  volumeDistribution: {
    skillWork: 5,
    strengthWork: 20,
    hypertrophyWork: 65,
    enduranceWork: 0,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 20,
    moderateIntensity: 65,
    highIntensity: 15,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 5,
    plateauProtocol: 'Vary push-up angles, add isolation, increase volume',
    advancementCriteria: [
      'Dip rep increases',
      'Push-up progression advancement',
      'Chest/shoulder development',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['dips', 'push-up variations', 'pike push-ups', 'overhead work', 'tricep extensions', 'flyes'],
    avoidedMovementPatterns: ['excessive pulling volume'],
    equipmentPriority: ['parallettes', 'rings', 'dumbbells', 'cables'],
    repRangePreference: { min: 8, max: 15 },
    restPeriodPreference: { min: 60, max: 120 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 5,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 4, max: 5 },
  sessionDurationMinutes: { min: 60, max: 75 },
  
  keyPrinciples: [
    'Full ROM on all pressing',
    'Include incline and decline angles',
    'Shoulder health maintenance',
    'Tricep isolation included',
  ],
  
  avoidanceCriteria: [
    'Partial ROM dips',
    'Ignoring shoulder mobility',
    'Excessive front delt dominance',
  ],
  
  successMetrics: [
    'Dip rep PRs',
    'Push-up progression',
    'Chest/tricep development',
  ],
  
  recommendedFollowUp: ['strength', 'skill', 'mixed'],
  prerequisites: ['15+ push-ups', '10+ dips', 'Good shoulder mobility'],
}

// =============================================================================
// ENDURANCE CYCLES
// =============================================================================

export const PULL_ENDURANCE_CYCLE: TrainingCycle = {
  id: 'pull_endurance',
  name: 'Pull-Up Endurance Development',
  type: 'endurance',
  focus: 'pull_focus',
  durationWeeks: 6,
  
  trainingEmphasis: 'Maximize pull-up reps and work capacity. Military test preparation.',
  
  volumeDistribution: {
    skillWork: 0,
    strengthWork: 15,
    hypertrophyWork: 25,
    enduranceWork: 50,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 40,
    moderateIntensity: 50,
    highIntensity: 10,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Grease the groove, add density work, vary rep schemes',
    advancementCriteria: [
      'Max rep test improvements',
      'Improved recovery between sets',
      'Higher volume tolerance',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['pull-up ladders', 'pull-up pyramids', 'density sets', 'varied grip pulls', 'Australian rows'],
    avoidedMovementPatterns: ['heavy weighted pulls', 'low-rep skill work'],
    equipmentPriority: ['bar', 'rings'],
    repRangePreference: { min: 5, max: 20 },
    restPeriodPreference: { min: 30, max: 90 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 6,
    requiredRestDays: 1,
    sleepEmphasis: 'standard',
    nutritionEmphasis: 'maintenance',
    stressToleranceLevel: 'high',
  },
  
  sessionsPerWeek: { min: 4, max: 6 },
  sessionDurationMinutes: { min: 30, max: 60 },
  
  keyPrinciples: [
    'Total weekly volume over max effort',
    'Multiple sessions per day if applicable',
    'Never train to complete failure',
    'Pacing is critical for tests',
  ],
  
  avoidanceCriteria: [
    'Training to failure regularly',
    'Too much rest between sets',
    'Ignoring technique under fatigue',
  ],
  
  successMetrics: [
    'Max rep improvements',
    'Total weekly volume',
    'Test performance',
  ],
  
  recommendedFollowUp: ['mixed', 'strength', 'hypertrophy'],
  prerequisites: ['10+ strict pull-ups', 'No elbow issues', 'Consistent training schedule'],
}

export const GENERAL_ENDURANCE_CYCLE: TrainingCycle = {
  id: 'general_endurance',
  name: 'General Conditioning',
  type: 'endurance',
  focus: 'full_body',
  durationWeeks: 6,
  
  trainingEmphasis: 'Build work capacity across all movement patterns. Circuit training and conditioning.',
  
  volumeDistribution: {
    skillWork: 5,
    strengthWork: 15,
    hypertrophyWork: 20,
    enduranceWork: 50,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 35,
    moderateIntensity: 55,
    highIntensity: 10,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Add circuit complexity, reduce rest, increase duration',
    advancementCriteria: [
      'Faster circuit times',
      'Higher rep counts',
      'Improved recovery',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['push-ups', 'pull-ups', 'squats', 'burpees', 'mountain climbers', 'planks'],
    avoidedMovementPatterns: ['heavy isolated movements', 'long rest periods'],
    equipmentPriority: ['bodyweight', 'minimal equipment'],
    repRangePreference: { min: 10, max: 30 },
    restPeriodPreference: { min: 15, max: 60 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 6,
    requiredRestDays: 1,
    sleepEmphasis: 'standard',
    nutritionEmphasis: 'maintenance',
    stressToleranceLevel: 'high',
  },
  
  sessionsPerWeek: { min: 4, max: 6 },
  sessionDurationMinutes: { min: 30, max: 45 },
  
  keyPrinciples: [
    'Maintain movement quality under fatigue',
    'Progressive circuit complexity',
    'Strategic rest periods',
    'Full body each session',
  ],
  
  avoidanceCriteria: [
    'Sloppy form for speed',
    'Ignoring recovery signals',
    'Too much variety without progression',
  ],
  
  successMetrics: [
    'Circuit completion times',
    'Sustained effort duration',
    'Recovery rate improvements',
  ],
  
  recommendedFollowUp: ['strength', 'hypertrophy', 'mixed'],
  prerequisites: ['Basic exercise competency', 'Cardiovascular baseline', 'No joint issues'],
}

// =============================================================================
// MIXED/GENERAL CYCLES
// =============================================================================

export const MIXED_DEVELOPMENT_CYCLE: TrainingCycle = {
  id: 'mixed_development',
  name: 'Balanced Development',
  type: 'mixed',
  focus: 'general',
  durationWeeks: 8,
  
  trainingEmphasis: 'Well-rounded development across strength, skills, and conditioning.',
  
  volumeDistribution: {
    skillWork: 25,
    strengthWork: 30,
    hypertrophyWork: 25,
    enduranceWork: 10,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 25,
    moderateIntensity: 55,
    highIntensity: 20,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'moderate',
    deloadFrequency: 4,
    plateauProtocol: 'Rotate focus areas while maintaining others',
    advancementCriteria: [
      'Progress across multiple domains',
      'No regression in any area',
      'Sustainable long-term',
    ],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['all fundamental patterns', 'skill progressions', 'compound strength', 'conditioning'],
    avoidedMovementPatterns: ['extreme specialization'],
    equipmentPriority: ['bar', 'rings', 'parallettes', 'floor'],
    repRangePreference: { min: 5, max: 15 },
    restPeriodPreference: { min: 60, max: 180 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 5,
    requiredRestDays: 2,
    sleepEmphasis: 'elevated',
    nutritionEmphasis: 'slight_surplus',
    stressToleranceLevel: 'moderate',
  },
  
  sessionsPerWeek: { min: 3, max: 5 },
  sessionDurationMinutes: { min: 60, max: 90 },
  
  keyPrinciples: [
    'Maintain breadth while progressing',
    'Periodize emphasis within cycle',
    'Skill work when fresh',
    'Conditioning at end of session',
  ],
  
  avoidanceCriteria: [
    'Abandoning any training quality',
    'Over-emphasizing one area at expense of others',
    'Insufficient recovery',
  ],
  
  successMetrics: [
    'Progress in primary skill',
    'Strength baseline maintained',
    'Conditioning maintained',
  ],
  
  recommendedFollowUp: ['skill', 'strength', 'hypertrophy'],
  prerequisites: ['Foundational fitness', '6+ months training', 'Clear goals'],
}

// =============================================================================
// DELOAD & PEAK CYCLES
// =============================================================================

export const DELOAD_CYCLE: TrainingCycle = {
  id: 'deload',
  name: 'Recovery Deload',
  type: 'deload',
  focus: 'general',
  durationWeeks: 1,
  
  trainingEmphasis: 'Reduced volume and intensity for recovery and supercompensation.',
  
  volumeDistribution: {
    skillWork: 30,
    strengthWork: 20,
    hypertrophyWork: 10,
    enduranceWork: 10,
    mobilityWork: 30,
  },
  
  intensityDistribution: {
    lowIntensity: 60,
    moderateIntensity: 35,
    highIntensity: 5,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'slow',
    deloadFrequency: 0,
    plateauProtocol: 'N/A - recovery focus',
    advancementCriteria: ['Feeling recovered and ready to train hard'],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['light skill work', 'mobility', 'easy movement'],
    avoidedMovementPatterns: ['heavy loads', 'high rep burnouts', 'new exercises'],
    equipmentPriority: ['bodyweight', 'bands', 'foam roller'],
    repRangePreference: { min: 5, max: 10 },
    restPeriodPreference: { min: 90, max: 180 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 3,
    sleepEmphasis: 'critical',
    nutritionEmphasis: 'maintenance',
    stressToleranceLevel: 'low',
  },
  
  sessionsPerWeek: { min: 2, max: 4 },
  sessionDurationMinutes: { min: 30, max: 45 },
  
  keyPrinciples: [
    '40-60% of normal volume',
    'Maintain movement patterns without stress',
    'Prioritize sleep and nutrition',
    'Address mobility limitations',
  ],
  
  avoidanceCriteria: [
    'Testing PRs',
    'Adding new exercises',
    'Training through fatigue',
  ],
  
  successMetrics: [
    'Feeling refreshed',
    'Reduced joint stress',
    'Mental eagerness to train',
  ],
  
  recommendedFollowUp: ['strength', 'skill', 'hypertrophy'],
  prerequisites: ['None - always appropriate when needed'],
}

export const PEAK_CYCLE: TrainingCycle = {
  id: 'peak',
  name: 'Performance Peak',
  type: 'peak',
  focus: 'general',
  durationWeeks: 2,
  
  trainingEmphasis: 'Reduce volume, maintain intensity, peak for tests or competitions.',
  
  volumeDistribution: {
    skillWork: 20,
    strengthWork: 50,
    hypertrophyWork: 10,
    enduranceWork: 10,
    mobilityWork: 10,
  },
  
  intensityDistribution: {
    lowIntensity: 20,
    moderateIntensity: 30,
    highIntensity: 50,
  },
  
  progressionPacing: {
    weeklyProgressionRate: 'slow',
    deloadFrequency: 0,
    plateauProtocol: 'Reduce volume, maintain intensity, trust the taper',
    advancementCriteria: ['Peak performance on test day'],
  },
  
  exerciseBias: {
    preferredMovementPatterns: ['competition movements', 'test-specific exercises'],
    avoidedMovementPatterns: ['new exercises', 'high fatigue work'],
    equipmentPriority: ['competition-specific'],
    repRangePreference: { min: 1, max: 5 },
    restPeriodPreference: { min: 180, max: 300 },
  },
  
  recoveryBias: {
    sessionFrequencyMax: 4,
    requiredRestDays: 2,
    sleepEmphasis: 'critical',
    nutritionEmphasis: 'maintenance',
    stressToleranceLevel: 'low',
  },
  
  sessionsPerWeek: { min: 2, max: 4 },
  sessionDurationMinutes: { min: 45, max: 75 },
  
  keyPrinciples: [
    'Volume drops, intensity maintained',
    'Practice competition movements',
    'Mental preparation',
    'Trust the training',
  ],
  
  avoidanceCriteria: [
    'Last-minute volume increases',
    'New exercises or techniques',
    'Over-thinking',
  ],
  
  successMetrics: [
    'Competition/test performance',
    'Confidence level',
    'Recovery status',
  ],
  
  recommendedFollowUp: ['deload', 'hypertrophy', 'mixed'],
  prerequisites: ['Adequate base training', 'Specific goal/test date'],
}

// =============================================================================
// CYCLE COLLECTIONS
// =============================================================================

export const SKILL_CYCLES: TrainingCycle[] = [
  PLANCHE_SKILL_CYCLE,
  FRONT_LEVER_SKILL_CYCLE,
  HANDSTAND_SKILL_CYCLE,
  MUSCLE_UP_SKILL_CYCLE,
  ONE_ARM_PULL_UP_SKILL_CYCLE,
]

export const STRENGTH_CYCLES: TrainingCycle[] = [
  WEIGHTED_PULL_STRENGTH_CYCLE,
  WEIGHTED_DIP_STRENGTH_CYCLE,
  STREETLIFTING_STRENGTH_CYCLE,
]

export const HYPERTROPHY_CYCLES: TrainingCycle[] = [
  UPPER_HYPERTROPHY_CYCLE,
  PULL_HYPERTROPHY_CYCLE,
  PUSH_HYPERTROPHY_CYCLE,
]

export const ENDURANCE_CYCLES: TrainingCycle[] = [
  PULL_ENDURANCE_CYCLE,
  GENERAL_ENDURANCE_CYCLE,
]

export const UTILITY_CYCLES: TrainingCycle[] = [
  MIXED_DEVELOPMENT_CYCLE,
  DELOAD_CYCLE,
  PEAK_CYCLE,
]

export const ALL_TRAINING_CYCLES: TrainingCycle[] = [
  ...SKILL_CYCLES,
  ...STRENGTH_CYCLES,
  ...HYPERTROPHY_CYCLES,
  ...ENDURANCE_CYCLES,
  ...UTILITY_CYCLES,
]

// =============================================================================
// CYCLE SELECTION ENGINE
// =============================================================================

export interface CycleSelectionFactors {
  primaryGoal: PrimaryGoal | PrimaryTrainingOutcome
  experienceLevel: ExperienceLevel
  currentPhase?: CycleType
  skillFocus?: CycleFocus
  weeksSinceDeload: number
  hasCompetitionSoon: boolean
  priorityArea: 'skill' | 'strength' | 'size' | 'endurance' | 'balanced'
}

export function selectRecommendedCycle(factors: CycleSelectionFactors): TrainingCycle {
  const { primaryGoal, experienceLevel, currentPhase, weeksSinceDeload, hasCompetitionSoon, priorityArea } = factors

  // Deload check - if overdue, recommend deload
  if (weeksSinceDeload >= 6) {
    return DELOAD_CYCLE
  }

  // Competition coming - recommend peak
  if (hasCompetitionSoon) {
    return PEAK_CYCLE
  }

  // Goal-based selection
  if (primaryGoal === 'planche') return PLANCHE_SKILL_CYCLE
  if (primaryGoal === 'front_lever') return FRONT_LEVER_SKILL_CYCLE
  if (primaryGoal === 'handstand_pushup' || primaryGoal === 'handstand') return HANDSTAND_SKILL_CYCLE
  if (primaryGoal === 'muscle_up') return MUSCLE_UP_SKILL_CYCLE
  if (primaryGoal === 'weighted_strength') return STREETLIFTING_STRENGTH_CYCLE

  // Priority-based fallback
  switch (priorityArea) {
    case 'skill':
      return MIXED_DEVELOPMENT_CYCLE
    case 'strength':
      return experienceLevel === 'beginner' ? PULL_HYPERTROPHY_CYCLE : WEIGHTED_PULL_STRENGTH_CYCLE
    case 'size':
      return UPPER_HYPERTROPHY_CYCLE
    case 'endurance':
      return GENERAL_ENDURANCE_CYCLE
    case 'balanced':
    default:
      return MIXED_DEVELOPMENT_CYCLE
  }
}

// =============================================================================
// CYCLE TRANSITION ENGINE
// =============================================================================

export interface CycleTransition {
  fromCycle: CycleType
  toCycle: CycleType
  rationale: string
  transitionWeek: boolean // If true, add a transition week
  recommendations: string[]
}

export const RECOMMENDED_CYCLE_TRANSITIONS: CycleTransition[] = [
  {
    fromCycle: 'hypertrophy',
    toCycle: 'strength',
    rationale: 'New muscle mass provides foundation for strength gains',
    transitionWeek: true,
    recommendations: [
      'Reduce volume by 20% in transition week',
      'Start strength cycle with moderate loads',
      'Maintain new muscle with adequate protein',
    ],
  },
  {
    fromCycle: 'strength',
    toCycle: 'skill',
    rationale: 'Strength base supports skill development',
    transitionWeek: false,
    recommendations: [
      'Maintain some strength work during skill cycle',
      'Skill work when completely fresh',
      'Reduce overall fatigue',
    ],
  },
  {
    fromCycle: 'skill',
    toCycle: 'hypertrophy',
    rationale: 'Build structural support for continued skill progression',
    transitionWeek: false,
    recommendations: [
      'Continue light skill maintenance',
      'Focus on weak points identified during skill cycle',
      'Prioritize muscle groups that support primary skill',
    ],
  },
  {
    fromCycle: 'strength',
    toCycle: 'peak',
    rationale: 'Taper for maximum performance',
    transitionWeek: false,
    recommendations: [
      'Reduce volume 30-40% immediately',
      'Maintain heavy singles',
      'Extra focus on recovery',
    ],
  },
  {
    fromCycle: 'peak',
    toCycle: 'deload',
    rationale: 'Recovery after max effort',
    transitionWeek: false,
    recommendations: [
      'Complete rest or very light activity',
      'Address any minor aches',
      'Mental break from training',
    ],
  },
  {
    fromCycle: 'endurance',
    toCycle: 'strength',
    rationale: 'Convert work capacity into strength gains',
    transitionWeek: true,
    recommendations: [
      'Gradually increase loads',
      'Reduce rep ranges over 2 weeks',
      'Maintain some conditioning',
    ],
  },
]

export function getTransitionRecommendation(fromCycle: CycleType, toCycle: CycleType): CycleTransition | null {
  return RECOMMENDED_CYCLE_TRANSITIONS.find(
    t => t.fromCycle === fromCycle && t.toCycle === toCycle
  ) || null
}

// =============================================================================
// CYCLE GUIDE STRUCTURES (SEO SUPPORT)
// =============================================================================

export interface CycleGuideStructure {
  slug: string
  title: string
  description: string
  sections: {
    name: string
    content: string[]
  }[]
  seoKeywords: string[]
}

export const CYCLE_GUIDE_STRUCTURES: CycleGuideStructure[] = [
  {
    slug: 'skill-cycles-guide',
    title: 'Calisthenics Skill Cycles',
    description: 'Learn how to structure skill-focused training cycles for planche, front lever, handstand, and muscle-up development.',
    sections: [
      {
        name: 'What is a Skill Cycle?',
        content: [
          'A skill cycle prioritizes movement pattern development over strength or muscle gains',
          'High frequency exposure to skill work when fresh',
          'Moderate support strength to maintain foundation',
          'Low fatigue accumulation to preserve motor learning quality',
        ],
      },
      {
        name: 'When to Use Skill Cycles',
        content: [
          'When learning a new skill (planche, front lever, handstand)',
          'When breaking through a skill plateau',
          'When technique needs refinement',
          'After building a strength base in a previous cycle',
        ],
      },
      {
        name: 'Skill Cycle Structure',
        content: [
          'Duration: 6-8 weeks typical',
          'Frequency: 3-5 sessions per week',
          'Session length: 45-75 minutes',
          'Volume: 40-60% skill work, 30-40% support strength',
        ],
      },
    ],
    seoKeywords: ['calisthenics skill cycle', 'planche training cycle', 'front lever program', 'handstand training structure'],
  },
  {
    slug: 'strength-cycles-guide',
    title: 'Calisthenics Strength Cycles',
    description: 'Master weighted calisthenics and build raw strength with structured strength cycles.',
    sections: [
      {
        name: 'What is a Strength Cycle?',
        content: [
          'A strength cycle prioritizes progressive overload and neural adaptations',
          'Low rep ranges (1-5 reps) with high intensity',
          'Long rest periods (3-5 minutes) for full recovery',
          'Focus on weighted movements and max effort work',
        ],
      },
      {
        name: 'When to Use Strength Cycles',
        content: [
          'When building foundation for advanced skills',
          'When training for streetlifting or weighted calisthenics',
          'After a hypertrophy phase to express new muscle',
          'When peaking for competition',
        ],
      },
      {
        name: 'Strength Cycle Structure',
        content: [
          'Duration: 6-8 weeks',
          'Frequency: 3-4 sessions per week',
          'Session length: 60-90 minutes',
          'Volume: 60-80% strength work, neural output focus',
        ],
      },
    ],
    seoKeywords: ['weighted calisthenics program', 'strength cycle', 'weighted pull-up program', 'streetlifting training'],
  },
  {
    slug: 'hypertrophy-cycles-guide',
    title: 'Calisthenics Hypertrophy Cycles',
    description: 'Build muscle mass with calisthenics using structured hypertrophy training cycles.',
    sections: [
      {
        name: 'What is a Hypertrophy Cycle?',
        content: [
          'A hypertrophy cycle prioritizes muscle growth and structural development',
          'Moderate-high rep ranges (8-15 reps)',
          'Time under tension and controlled tempos',
          'Higher training volume with moderate intensity',
        ],
      },
      {
        name: 'When to Use Hypertrophy Cycles',
        content: [
          'When building foundation for future strength gains',
          'When body composition improvement is priority',
          'When recovering from strength-focused training',
          'To address weak points and imbalances',
        ],
      },
      {
        name: 'Hypertrophy Cycle Structure',
        content: [
          'Duration: 6 weeks',
          'Frequency: 4-5 sessions per week',
          'Session length: 60-90 minutes',
          'Volume: 60-70% hypertrophy work, caloric surplus recommended',
        ],
      },
    ],
    seoKeywords: ['calisthenics hypertrophy', 'muscle building calisthenics', 'bodyweight muscle gain', 'calisthenics bulk'],
  },
  {
    slug: 'training-phases-guide',
    title: 'How to Structure Training Phases',
    description: 'Learn how to transition between skill, strength, and hypertrophy cycles for long-term progress.',
    sections: [
      {
        name: 'Periodization Basics',
        content: [
          'Training in phases allows for focused adaptation',
          'Cycling through different emphases prevents plateaus',
          'Deload weeks are essential between intense phases',
          'Plan transitions based on goals and fatigue status',
        ],
      },
      {
        name: 'Common Phase Sequences',
        content: [
          'Hypertrophy → Strength → Skill (classic approach)',
          'Skill → Hypertrophy (when skill plateaus, build more muscle)',
          'Strength → Peak → Deload (competition preparation)',
          'Mixed → Skill (transition from general to specific)',
        ],
      },
      {
        name: 'Managing Transitions',
        content: [
          'Use transition weeks when changing emphasis dramatically',
          'Maintain some work in other areas during focused phases',
          'Listen to recovery signals and adjust accordingly',
          'Track progress metrics appropriate to current phase',
        ],
      },
    ],
    seoKeywords: ['calisthenics periodization', 'training phases', 'program design', 'long-term progress calisthenics'],
  },
]

// =============================================================================
// MARKETING CLAIMS (Backed by implementation)
// =============================================================================

export const CYCLE_MARKETING_CLAIMS = {
  headline: 'Structured Training Cycles for Real Progress',
  subheadline: 'Move beyond random workouts with periodized training that builds skills, strength, and muscle systematically.',
  
  capabilities: [
    'Skill cycles for planche, front lever, handstand, and muscle-up development',
    'Strength cycles for weighted calisthenics and streetlifting',
    'Hypertrophy cycles for muscle building that supports skills',
    'Endurance cycles for max-rep and military test preparation',
    'Intelligent cycle transitions based on your goals and progress',
  ],
  
  differentiators: [
    'Not random workouts - structured periodization',
    'Each cycle has specific volume, intensity, and exercise prescriptions',
    'Built-in deload and peaking phases',
    'Transition recommendations between phases',
  ],
}
