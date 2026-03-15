/**
 * Unified Skill Progress Prediction Engine
 * 
 * This is the single source of truth for all skill/goal timeline predictions.
 * It consolidates and integrates:
 * - goal-projection-engine.ts (timeline calculations)
 * - skill-readiness-engine.ts (readiness assessments)
 * - skill-intelligence-layer.ts (confidence scoring, weak points)
 * - training-momentum-engine.ts (consistency effects)
 * - strength-trend-engine.ts (strength trajectory)
 * - fatigue-engine.ts (recovery adjustments)
 * - relative-strength-engine.ts (bodyweight-relative metrics)
 * - weak-point-priority-engine.ts (limiter identification)
 * 
 * All predictions are probabilistic and advisory - never absolute guarantees.
 */

import type { SkillGoal, TendonAdaptationLevel } from '../athlete-profile'
import type { TrainingMomentum } from '../training-momentum-engine'
import type { FatigueIndicators } from '../fatigue-engine'
import type { StrengthTrend } from '../strength-trend-engine'
import type { WeakPointAssessment } from '../weak-point-priority-engine'

// =============================================================================
// UNIFIED PREDICTION TYPES
// =============================================================================

export type SkillId = SkillGoal | 'weighted_pull_up' | 'weighted_dip' | 'weighted_chin_up'

export type ConfidenceTier = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'
export type TimelineConfidenceBand = 'uncertain' | 'rough_estimate' | 'likely' | 'confident'

export interface PredictionLimiter {
  category: LimiterCategory
  label: string
  impact: 'primary' | 'secondary' | 'minor'
  explanation: string
  timelineImpact: string // e.g., "Adds 2-4 weeks to estimate"
  recommendedFocus: string[]
}

export type LimiterCategory =
  | 'pulling_strength'
  | 'pushing_strength'
  | 'straight_arm_tolerance'
  | 'tendon_conditioning'
  | 'shoulder_mobility'
  | 'scapular_control'
  | 'core_compression'
  | 'bodyline_control'
  | 'grip_strength'
  | 'explosive_power'
  | 'skill_density'
  | 'consistency'
  | 'recovery_fatigue'
  | 'leverage_bodyweight'
  | 'ring_stability'
  | 'none'

export interface TimelineEstimate {
  minWeeks: number
  maxWeeks: number
  displayLabel: string // e.g., "4-8 weeks", "2-4 months"
  confidenceBand: TimelineConfidenceBand
}

export interface ProgressionStage {
  level: number
  name: string
  description: string
  isCurrentStage: boolean
}

export interface MomentumModifier {
  value: number // 0.7-1.4 multiplier
  direction: 'accelerating' | 'stable' | 'decelerating'
  explanation: string
}

export interface RecoveryModifier {
  value: number // 0.8-1.2 multiplier
  status: 'optimal' | 'adequate' | 'compromised' | 'fatigued'
  explanation: string
}

/**
 * The unified prediction result object.
 * This is the single structure returned for every skill/goal prediction.
 */
export interface UnifiedSkillPrediction {
  // Identity
  skillId: SkillId
  skillName: string
  skillCategory: 'strength_skill' | 'weighted_strength' | 'compression' | 'flexibility' | 'military_event'
  
  // Current Position
  currentStage: ProgressionStage
  
  // Next Milestone
  nextStage: ProgressionStage | null
  estimatedTimeToNextStage: TimelineEstimate | null
  predictedSessionCountToNextStage: number | null
  
  // Long-term Target (final progression level)
  longTermTarget: ProgressionStage
  estimatedTimeToTarget: TimelineEstimate | null
  predictedSessionCountToTarget: number | null
  
  // Readiness & Confidence
  readinessScore: number // 0-100
  confidenceScore: number // 0-100
  confidenceTier: ConfidenceTier
  
  // Limiters
  primaryLimiter: PredictionLimiter | null
  secondaryLimiter: PredictionLimiter | null
  
  // Dynamic Modifiers
  momentumModifier: MomentumModifier
  recoveryModifier: RecoveryModifier
  
  // Coach Guidance
  coachNotes: string[]
  primaryFocus: string
  suggestedExercises: string[]
  
  // Data Quality
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
  missingDataPoints: string[]
  
  // Metadata
  generatedAt: string
  basedOnSessions: number
  basedOnStrengthRecords: number
}

// =============================================================================
// SKILL CONFIGURATION
// =============================================================================

export interface SkillDifficultyConfig {
  tier: 'foundational' | 'intermediate' | 'advanced' | 'elite'
  baseWeeksPerLevel: number[]
  strengthExercise: 'weighted_pull_up' | 'weighted_dip' | 'weighted_muscle_up' | null
  strengthThresholdsPerLevel: number[] // % bodyweight
  tendonRiskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  requiresRingStability: boolean
  primaryLimiterCategory: LimiterCategory
  secondaryLimiterCategory: LimiterCategory | null
}

const SKILL_DIFFICULTY_CONFIG: Record<string, SkillDifficultyConfig> = {
  // Pulling Skills
  front_lever: {
    tier: 'advanced',
    baseWeeksPerLevel: [6, 10, 12, 16, 20],
    strengthExercise: 'weighted_pull_up',
    strengthThresholdsPerLevel: [15, 30, 45, 55, 70],
    tendonRiskLevel: 'high',
    requiresRingStability: false,
    primaryLimiterCategory: 'straight_arm_tolerance',
    secondaryLimiterCategory: 'scapular_control',
  },
  back_lever: {
    tier: 'advanced',
    baseWeeksPerLevel: [4, 8, 10, 14, 18],
    strengthExercise: 'weighted_pull_up',
    strengthThresholdsPerLevel: [10, 20, 35, 45, 55],
    tendonRiskLevel: 'high',
    requiresRingStability: true,
    primaryLimiterCategory: 'shoulder_mobility',
    secondaryLimiterCategory: 'straight_arm_tolerance',
  },
  one_arm_pull_up: {
    tier: 'elite',
    baseWeeksPerLevel: [8, 12, 16, 24, 32],
    strengthExercise: 'weighted_pull_up',
    strengthThresholdsPerLevel: [40, 55, 70, 85, 100],
    tendonRiskLevel: 'moderate',
    requiresRingStability: false,
    primaryLimiterCategory: 'pulling_strength',
    secondaryLimiterCategory: 'grip_strength',
  },
  muscle_up: {
    tier: 'intermediate',
    baseWeeksPerLevel: [4, 6, 10, 16],
    strengthExercise: 'weighted_pull_up',
    strengthThresholdsPerLevel: [20, 35, 50, 70],
    tendonRiskLevel: 'moderate',
    requiresRingStability: false,
    primaryLimiterCategory: 'explosive_power',
    secondaryLimiterCategory: 'pulling_strength',
  },
  iron_cross: {
    tier: 'elite',
    baseWeeksPerLevel: [12, 20, 32, 48, 72],
    strengthExercise: 'weighted_dip',
    strengthThresholdsPerLevel: [50, 70, 90, 110, 130],
    tendonRiskLevel: 'very_high',
    requiresRingStability: true,
    primaryLimiterCategory: 'tendon_conditioning',
    secondaryLimiterCategory: 'ring_stability',
  },
  
  // Pushing Skills
  planche: {
    tier: 'elite',
    baseWeeksPerLevel: [8, 12, 16, 24, 36],
    strengthExercise: 'weighted_dip',
    strengthThresholdsPerLevel: [20, 35, 50, 65, 85],
    tendonRiskLevel: 'very_high',
    requiresRingStability: false,
    primaryLimiterCategory: 'straight_arm_tolerance',
    secondaryLimiterCategory: 'pushing_strength',
  },
  handstand_pushup: {
    tier: 'advanced',
    baseWeeksPerLevel: [4, 8, 10, 16],
    strengthExercise: 'weighted_dip',
    strengthThresholdsPerLevel: [25, 40, 55, 75],
    tendonRiskLevel: 'low',
    requiresRingStability: false,
    primaryLimiterCategory: 'pushing_strength',
    secondaryLimiterCategory: 'shoulder_mobility',
  },
  handstand: {
    tier: 'intermediate',
    baseWeeksPerLevel: [4, 8, 12, 20],
    strengthExercise: null,
    strengthThresholdsPerLevel: [],
    tendonRiskLevel: 'low',
    requiresRingStability: false,
    primaryLimiterCategory: 'bodyline_control',
    secondaryLimiterCategory: 'shoulder_mobility',
  },
  
  // Compression Skills
  l_sit: {
    tier: 'foundational',
    baseWeeksPerLevel: [3, 6, 12, 20],
    strengthExercise: null,
    strengthThresholdsPerLevel: [],
    tendonRiskLevel: 'low',
    requiresRingStability: false,
    primaryLimiterCategory: 'core_compression',
    secondaryLimiterCategory: 'scapular_control',
  },
  v_sit: {
    tier: 'intermediate',
    baseWeeksPerLevel: [6, 10, 16, 24],
    strengthExercise: null,
    strengthThresholdsPerLevel: [],
    tendonRiskLevel: 'low',
    requiresRingStability: false,
    primaryLimiterCategory: 'core_compression',
    secondaryLimiterCategory: 'scapular_control',
  },
  i_sit: {
    tier: 'elite',
    baseWeeksPerLevel: [12, 20, 32, 48],
    strengthExercise: null,
    strengthThresholdsPerLevel: [],
    tendonRiskLevel: 'moderate',
    requiresRingStability: false,
    primaryLimiterCategory: 'core_compression',
    secondaryLimiterCategory: 'shoulder_mobility',
  },
  
  // Weighted Strength
  weighted_pull_up: {
    tier: 'foundational',
    baseWeeksPerLevel: [4, 6, 8, 12, 16],
    strengthExercise: 'weighted_pull_up',
    strengthThresholdsPerLevel: [10, 25, 45, 65, 85],
    tendonRiskLevel: 'low',
    requiresRingStability: false,
    primaryLimiterCategory: 'pulling_strength',
    secondaryLimiterCategory: 'grip_strength',
  },
  weighted_dip: {
    tier: 'foundational',
    baseWeeksPerLevel: [4, 6, 8, 12, 16],
    strengthExercise: 'weighted_dip',
    strengthThresholdsPerLevel: [15, 35, 55, 75, 100],
    tendonRiskLevel: 'low',
    requiresRingStability: false,
    primaryLimiterCategory: 'pushing_strength',
    secondaryLimiterCategory: 'none',
  },
}

// =============================================================================
// LIMITER LABEL MAPPINGS
// =============================================================================

const LIMITER_LABELS: Record<LimiterCategory, string> = {
  pulling_strength: 'Pulling Strength',
  pushing_strength: 'Pushing Strength',
  straight_arm_tolerance: 'Straight-Arm Tolerance',
  tendon_conditioning: 'Tendon Conditioning',
  shoulder_mobility: 'Shoulder Mobility',
  scapular_control: 'Scapular Control',
  core_compression: 'Core Compression',
  bodyline_control: 'Bodyline Control',
  grip_strength: 'Grip Strength',
  explosive_power: 'Explosive Power',
  skill_density: 'Skill Practice Volume',
  consistency: 'Training Consistency',
  recovery_fatigue: 'Recovery Status',
  leverage_bodyweight: 'Leverage / Bodyweight',
  ring_stability: 'Ring Stability',
  none: 'None Identified',
}

const LIMITER_TIMELINE_IMPACTS: Record<LimiterCategory, string> = {
  pulling_strength: 'Adds 2-4 weeks while building base strength',
  pushing_strength: 'Adds 2-4 weeks while building push strength',
  straight_arm_tolerance: 'Adds 4-8 weeks for tendon adaptation',
  tendon_conditioning: 'Adds 6-12 weeks for safe tissue adaptation',
  shoulder_mobility: 'Adds 2-6 weeks for mobility development',
  scapular_control: 'Adds 2-4 weeks for stability work',
  core_compression: 'Adds 2-4 weeks for compression strength',
  bodyline_control: 'Adds 1-3 weeks for body tension development',
  grip_strength: 'Adds 1-2 weeks for grip conditioning',
  explosive_power: 'Adds 2-4 weeks for power development',
  skill_density: 'Adds 2-4 weeks due to lower exposure',
  consistency: 'Extends timeline proportionally to missed training',
  recovery_fatigue: 'Adds 1-2 weeks until recovery normalizes',
  leverage_bodyweight: 'May require body composition adjustment',
  ring_stability: 'Adds 4-8 weeks for ring conditioning',
  none: 'No significant impact',
}

const LIMITER_FOCUS_EXERCISES: Record<LimiterCategory, string[]> = {
  pulling_strength: ['Weighted Pull-Ups', 'Rows', 'Lat Pulldowns'],
  pushing_strength: ['Weighted Dips', 'Push-Up Progressions', 'Handstand Push-Up Prep'],
  straight_arm_tolerance: ['Support Holds', 'Planche Leans', 'Front Lever Raises'],
  tendon_conditioning: ['Isometric Holds', 'Eccentric Lowering', 'Gradual Load Progression'],
  shoulder_mobility: ['German Hangs', 'Shoulder Dislocates', 'Wall Slides'],
  scapular_control: ['Scapular Pull-Ups', 'Scapular Push-Ups', 'YTWL'],
  core_compression: ['Hanging Leg Raises', 'V-Ups', 'Compression Work'],
  bodyline_control: ['Hollow Holds', 'Arch Holds', 'Plank Variations'],
  grip_strength: ['Dead Hangs', 'Towel Pull-Ups', 'Grip Training'],
  explosive_power: ['Explosive Pull-Ups', 'Clapping Dips', 'Plyometric Push-Ups'],
  skill_density: ['More frequent skill practice', 'Greasing the groove'],
  consistency: ['Maintain training schedule', 'Prioritize session completion'],
  recovery_fatigue: ['Deload week', 'Sleep optimization', 'Nutrition focus'],
  leverage_bodyweight: ['Body composition work', 'Maintain strength while cutting'],
  ring_stability: ['Ring Support Holds', 'Ring Dips', 'Ring Push-Ups'],
  none: [],
}

// =============================================================================
// SKILL NAME MAPPINGS
// =============================================================================

const SKILL_NAMES: Record<string, string> = {
  front_lever: 'Front Lever',
  back_lever: 'Back Lever',
  planche: 'Planche',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'Handstand Push-Up',
  handstand: 'Handstand',
  iron_cross: 'Iron Cross',
  one_arm_pull_up: 'One-Arm Pull-Up',
  l_sit: 'L-Sit',
  v_sit: 'V-Sit',
  i_sit: 'Manna / I-Sit',
  weighted_pull_up: 'Weighted Pull-Up',
  weighted_dip: 'Weighted Dip',
  weighted_chin_up: 'Weighted Chin-Up',
}

const SKILL_CATEGORIES: Record<string, UnifiedSkillPrediction['skillCategory']> = {
  front_lever: 'strength_skill',
  back_lever: 'strength_skill',
  planche: 'strength_skill',
  muscle_up: 'strength_skill',
  handstand_pushup: 'strength_skill',
  handstand: 'strength_skill',
  iron_cross: 'strength_skill',
  one_arm_pull_up: 'strength_skill',
  l_sit: 'compression',
  v_sit: 'compression',
  i_sit: 'compression',
  weighted_pull_up: 'weighted_strength',
  weighted_dip: 'weighted_strength',
  weighted_chin_up: 'weighted_strength',
}

// =============================================================================
// PROGRESSION LEVEL DEFINITIONS
// =============================================================================

const SKILL_LEVELS: Record<string, string[]> = {
  front_lever: ['Tuck', 'Advanced Tuck', 'One-Leg', 'Straddle', 'Full'],
  back_lever: ['Tuck', 'Advanced Tuck', 'One-Leg', 'Straddle', 'Full'],
  planche: ['Tuck', 'Advanced Tuck', 'Straddle', 'Half-Lay', 'Full'],
  muscle_up: ['Assisted', 'Kipping', 'Strict', 'Weighted', 'Ring Muscle-Up'],
  handstand_pushup: ['Pike', 'Wall Partial', 'Wall Full', 'Freestanding'],
  handstand: ['Wall Hold', 'Back-to-Wall', 'Chest-to-Wall', 'Freestanding'],
  iron_cross: ['Support Hold', 'Tuck Cross', 'Half Cross', 'Full Cross', 'Iron Cross'],
  one_arm_pull_up: ['Archer', 'Assisted OAP', 'Negative OAP', 'Partial OAP', 'Full OAP'],
  l_sit: ['Tuck', 'One-Leg', 'Full L-Sit', 'Straddle L', 'V-Sit Prep'],
  v_sit: ['L-Sit', 'Elevated L', 'Low V', 'Full V-Sit'],
  i_sit: ['V-Sit', 'Elevated V', 'Manna Prep', 'Full Manna'],
  weighted_pull_up: ['Bodyweight+10%', '+25% BW', '+45% BW', '+65% BW', '+85% BW'],
  weighted_dip: ['Bodyweight+15%', '+35% BW', '+55% BW', '+75% BW', '+100% BW'],
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimeRange(minWeeks: number, maxWeeks: number): string {
  if (minWeeks <= 0 && maxWeeks <= 0) return 'Achieved'
  
  if (maxWeeks <= 8) {
    return `${minWeeks}-${maxWeeks} weeks`
  }
  
  if (maxWeeks <= 16) {
    const minMonths = Math.round(minWeeks / 4)
    const maxMonths = Math.round(maxWeeks / 4)
    if (minMonths === maxMonths) {
      return `~${maxWeeks} weeks`
    }
    return `${minWeeks}-${maxWeeks} weeks`
  }
  
  const minMonths = Math.round(minWeeks / 4)
  const maxMonths = Math.round(maxWeeks / 4)
  return `${minMonths}-${maxMonths} months`
}

function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 85) return 'very_high'
  if (score >= 70) return 'high'
  if (score >= 50) return 'moderate'
  if (score >= 30) return 'low'
  return 'very_low'
}

function getConfidenceBand(score: number): TimelineConfidenceBand {
  if (score >= 75) return 'confident'
  if (score >= 55) return 'likely'
  if (score >= 35) return 'rough_estimate'
  return 'uncertain'
}

function getDataQuality(
  sessionCount: number,
  strengthRecordCount: number,
  hasBodyweight: boolean,
  hasMomentum: boolean
): UnifiedSkillPrediction['dataQuality'] {
  const dataPoints = [
    sessionCount >= 3,
    strengthRecordCount >= 2,
    hasBodyweight,
    hasMomentum,
  ].filter(Boolean).length
  
  if (dataPoints >= 4) return 'excellent'
  if (dataPoints >= 3) return 'good'
  if (dataPoints >= 2) return 'partial'
  return 'insufficient'
}

// =============================================================================
// MODIFIER CALCULATIONS
// =============================================================================

export function calculateExperienceModifier(experienceLevel: string): number {
  switch (experienceLevel) {
    case 'advanced': return 0.8
    case 'beginner': return 1.3
    case 'intermediate':
    default: return 1.0
  }
}

export function calculateFrequencyModifier(trainingDaysPerWeek: number): number {
  if (trainingDaysPerWeek >= 5) return 0.85
  if (trainingDaysPerWeek === 4) return 1.0
  if (trainingDaysPerWeek === 3) return 1.15
  if (trainingDaysPerWeek === 2) return 1.35
  return 1.5
}

export function calculateMomentumModifier(momentum: TrainingMomentum | null): MomentumModifier {
  if (!momentum || !momentum.hasData) {
    return {
      value: 1.0,
      direction: 'stable',
      explanation: 'No training data available yet',
    }
  }
  
  let value = 1.0
  let direction: MomentumModifier['direction'] = 'stable'
  let explanation = ''
  
  switch (momentum.level) {
    case 'very_strong':
      value = 0.85
      direction = 'accelerating'
      explanation = 'Excellent consistency is accelerating your progress'
      break
    case 'strong':
      value = 0.95
      direction = 'accelerating'
      explanation = 'Good training consistency supporting steady progress'
      break
    case 'developing':
      value = 1.05
      direction = 'stable'
      explanation = 'Building consistency - maintain current trajectory'
      break
    case 'low':
      value = 1.2
      direction = 'decelerating'
      explanation = 'Lower consistency is extending timeline estimates'
      break
    case 'none':
      value = 1.35
      direction = 'decelerating'
      explanation = 'Insufficient training volume affecting progress'
      break
  }
  
  // Adjust for trend
  if (momentum.trend === 'increasing') {
    value *= 0.95
    if (direction !== 'accelerating') direction = 'stable'
    explanation += ' (trending upward)'
  } else if (momentum.trend === 'decreasing') {
    value *= 1.05
    if (direction !== 'decelerating') direction = 'stable'
    explanation += ' (trending downward)'
  }
  
  return { value, direction, explanation }
}

export function calculateRecoveryModifier(fatigue: FatigueIndicators | null): RecoveryModifier {
  if (!fatigue) {
    return {
      value: 1.0,
      status: 'adequate',
      explanation: 'No fatigue data available',
    }
  }
  
  const fatigueLevel = fatigue.fatigueScore.level
  
  switch (fatigueLevel) {
    case 'low':
      return {
        value: 0.95,
        status: 'optimal',
        explanation: 'Recovery is optimal - supporting faster progress',
      }
    case 'moderate':
      return {
        value: 1.0,
        status: 'adequate',
        explanation: 'Recovery is adequate for steady progress',
      }
    case 'elevated':
      return {
        value: 1.1,
        status: 'compromised',
        explanation: 'Elevated fatigue may slow progress temporarily',
      }
    case 'high':
      return {
        value: 1.25,
        status: 'fatigued',
        explanation: 'High fatigue - consider deload before projecting',
      }
    default:
      return {
        value: 1.0,
        status: 'adequate',
        explanation: 'Recovery status normal',
      }
  }
}

// =============================================================================
// LIMITER IDENTIFICATION
// =============================================================================

export function identifyLimiters(
  skillId: string,
  strengthSupport: 'strong' | 'moderate' | 'weak' | 'unknown',
  weakPoints: WeakPointAssessment[] | null,
  tendonLevel: TendonAdaptationLevel | null,
  consistencyLevel: 'high' | 'moderate' | 'low' | 'unknown'
): { primary: PredictionLimiter | null; secondary: PredictionLimiter | null } {
  const config = SKILL_DIFFICULTY_CONFIG[skillId]
  if (!config) {
    return { primary: null, secondary: null }
  }
  
  const limiters: PredictionLimiter[] = []
  
  // Check strength support
  if (strengthSupport === 'weak') {
    const isPulling = ['front_lever', 'back_lever', 'muscle_up', 'one_arm_pull_up'].includes(skillId)
    const category = isPulling ? 'pulling_strength' : 'pushing_strength'
    limiters.push({
      category,
      label: LIMITER_LABELS[category],
      impact: 'primary',
      explanation: `Insufficient ${isPulling ? 'pulling' : 'pushing'} strength to support current progression`,
      timelineImpact: LIMITER_TIMELINE_IMPACTS[category],
      recommendedFocus: LIMITER_FOCUS_EXERCISES[category],
    })
  }
  
  // Check tendon conditioning for high-risk skills
  if (config.tendonRiskLevel === 'high' || config.tendonRiskLevel === 'very_high') {
    if (tendonLevel === 'low' || tendonLevel === 'low_moderate') {
      limiters.push({
        category: 'tendon_conditioning',
        label: LIMITER_LABELS.tendon_conditioning,
        impact: config.tendonRiskLevel === 'very_high' ? 'primary' : 'secondary',
        explanation: 'Tendon adaptation needs more time before advancing',
        timelineImpact: LIMITER_TIMELINE_IMPACTS.tendon_conditioning,
        recommendedFocus: LIMITER_FOCUS_EXERCISES.tendon_conditioning,
      })
    }
  }
  
  // Check consistency
  if (consistencyLevel === 'low') {
    limiters.push({
      category: 'consistency',
      label: LIMITER_LABELS.consistency,
      impact: 'secondary',
      explanation: 'Inconsistent training extending timeline',
      timelineImpact: LIMITER_TIMELINE_IMPACTS.consistency,
      recommendedFocus: LIMITER_FOCUS_EXERCISES.consistency,
    })
  }
  
  // Add skill-specific primary limiter if not already identified
  const primaryCategory = config.primaryLimiterCategory
  if (primaryCategory !== 'none' && !limiters.some(l => l.category === primaryCategory)) {
    // Only add if weak points indicate this is actually a limiter
    const relevantWeakPoint = weakPoints?.find(wp => {
      // Map weak point categories to limiter categories
      return wp.category === primaryCategory || 
             (primaryCategory === 'straight_arm_tolerance' && wp.category === 'straight_arm_tolerance') ||
             (primaryCategory === 'pulling_strength' && wp.category === 'pulling_strength')
    })
    
    if (relevantWeakPoint && relevantWeakPoint.severity !== 'none') {
      limiters.push({
        category: primaryCategory,
        label: LIMITER_LABELS[primaryCategory],
        impact: 'secondary',
        explanation: `${LIMITER_LABELS[primaryCategory]} needs development`,
        timelineImpact: LIMITER_TIMELINE_IMPACTS[primaryCategory],
        recommendedFocus: LIMITER_FOCUS_EXERCISES[primaryCategory],
      })
    }
  }
  
  // Sort by impact and return top 2
  const sortedLimiters = limiters.sort((a, b) => {
    const order = { primary: 0, secondary: 1, minor: 2 }
    return order[a.impact] - order[b.impact]
  })
  
  return {
    primary: sortedLimiters[0] || null,
    secondary: sortedLimiters[1] || null,
  }
}

// =============================================================================
// MAIN PREDICTION FUNCTION
// =============================================================================

export interface PredictionInputs {
  skillId: SkillId
  currentLevel: number
  experienceLevel: string
  trainingDaysPerWeek: number
  bodyweight: number | null
  sessionCount: number
  strengthRecordCount: number
  strengthSupport: 'strong' | 'moderate' | 'weak' | 'unknown'
  momentum: TrainingMomentum | null
  fatigue: FatigueIndicators | null
  weakPoints: WeakPointAssessment[] | null
  tendonLevel: TendonAdaptationLevel | null
  consistencyLevel: 'high' | 'moderate' | 'low' | 'unknown'
  relevantStrength1RM: number | null
}

export function generateUnifiedPrediction(inputs: PredictionInputs): UnifiedSkillPrediction {
  const {
    skillId,
    currentLevel,
    experienceLevel,
    trainingDaysPerWeek,
    bodyweight,
    sessionCount,
    strengthRecordCount,
    strengthSupport,
    momentum,
    fatigue,
    weakPoints,
    tendonLevel,
    consistencyLevel,
    relevantStrength1RM,
  } = inputs
  
  const config = SKILL_DIFFICULTY_CONFIG[skillId]
  const levels = SKILL_LEVELS[skillId] || []
  const maxLevel = levels.length - 1
  const isAtFinalLevel = currentLevel >= maxLevel
  
  // Current stage
  const currentStage: ProgressionStage = {
    level: currentLevel,
    name: levels[currentLevel] || 'Foundation',
    description: `Current progression level`,
    isCurrentStage: true,
  }
  
  // Next stage
  const nextStage: ProgressionStage | null = isAtFinalLevel ? null : {
    level: currentLevel + 1,
    name: levels[currentLevel + 1] || 'Next',
    description: `Next progression milestone`,
    isCurrentStage: false,
  }
  
  // Long-term target
  const longTermTarget: ProgressionStage = {
    level: maxLevel,
    name: levels[maxLevel] || 'Final',
    description: `Ultimate skill mastery`,
    isCurrentStage: currentLevel >= maxLevel,
  }
  
  // Calculate modifiers
  const experienceModifier = calculateExperienceModifier(experienceLevel)
  const frequencyModifier = calculateFrequencyModifier(trainingDaysPerWeek)
  const momentumModifier = calculateMomentumModifier(momentum)
  const recoveryModifier = calculateRecoveryModifier(fatigue)
  
  let strengthModifier = 1.0
  if (strengthSupport === 'strong') strengthModifier = 0.85
  else if (strengthSupport === 'weak') strengthModifier = 1.25
  else if (strengthSupport === 'unknown') strengthModifier = 1.1
  
  // Total modifier for timeline
  const totalModifier = experienceModifier * frequencyModifier * momentumModifier.value * 
                        recoveryModifier.value * strengthModifier
  
  // Calculate timeline to next stage
  let estimatedTimeToNextStage: TimelineEstimate | null = null
  let predictedSessionCountToNextStage: number | null = null
  
  if (!isAtFinalLevel && config) {
    const baseWeeks = config.baseWeeksPerLevel[Math.min(currentLevel, config.baseWeeksPerLevel.length - 1)] || 12
    const adjustedWeeks = Math.round(baseWeeks * totalModifier)
    const minWeeks = Math.max(2, Math.round(adjustedWeeks * 0.75))
    const maxWeeks = Math.round(adjustedWeeks * 1.3)
    
    // Calculate confidence
    const dataQuality = getDataQuality(sessionCount, strengthRecordCount, bodyweight !== null, momentum?.hasData || false)
    let confidenceScore = 50
    if (dataQuality === 'excellent') confidenceScore = 80
    else if (dataQuality === 'good') confidenceScore = 65
    else if (dataQuality === 'partial') confidenceScore = 45
    else confidenceScore = 25
    
    estimatedTimeToNextStage = {
      minWeeks,
      maxWeeks,
      displayLabel: formatTimeRange(minWeeks, maxWeeks),
      confidenceBand: getConfidenceBand(confidenceScore),
    }
    
    // Estimate sessions (average 3-4 per week during active training)
    const avgWeeks = (minWeeks + maxWeeks) / 2
    predictedSessionCountToNextStage = Math.round(avgWeeks * Math.min(trainingDaysPerWeek, 4) * 0.85)
  }
  
  // Calculate timeline to final target
  let estimatedTimeToTarget: TimelineEstimate | null = null
  let predictedSessionCountToTarget: number | null = null
  
  if (currentLevel < maxLevel && config) {
    let totalBaseWeeks = 0
    for (let i = currentLevel; i < maxLevel; i++) {
      totalBaseWeeks += config.baseWeeksPerLevel[Math.min(i, config.baseWeeksPerLevel.length - 1)] || 16
    }
    const adjustedTotalWeeks = Math.round(totalBaseWeeks * totalModifier)
    const minTotalWeeks = Math.max(4, Math.round(adjustedTotalWeeks * 0.7))
    const maxTotalWeeks = Math.round(adjustedTotalWeeks * 1.4)
    
    estimatedTimeToTarget = {
      minWeeks: minTotalWeeks,
      maxWeeks: maxTotalWeeks,
      displayLabel: formatTimeRange(minTotalWeeks, maxTotalWeeks),
      confidenceBand: 'rough_estimate', // Long-term predictions are always less certain
    }
    
    const avgTotalWeeks = (minTotalWeeks + maxTotalWeeks) / 2
    predictedSessionCountToTarget = Math.round(avgTotalWeeks * Math.min(trainingDaysPerWeek, 4) * 0.8)
  }
  
  // Calculate readiness and confidence scores
  const dataQuality = getDataQuality(sessionCount, strengthRecordCount, bodyweight !== null, momentum?.hasData || false)
  
  let readinessScore = 50
  if (strengthSupport === 'strong') readinessScore += 20
  else if (strengthSupport === 'weak') readinessScore -= 15
  if (momentumModifier.direction === 'accelerating') readinessScore += 10
  else if (momentumModifier.direction === 'decelerating') readinessScore -= 10
  if (recoveryModifier.status === 'optimal') readinessScore += 5
  else if (recoveryModifier.status === 'fatigued') readinessScore -= 15
  readinessScore = Math.max(0, Math.min(100, readinessScore))
  
  let confidenceScore = 50
  if (dataQuality === 'excellent') confidenceScore = 80
  else if (dataQuality === 'good') confidenceScore = 65
  else if (dataQuality === 'partial') confidenceScore = 40
  else confidenceScore = 20
  
  // Identify limiters
  const { primary: primaryLimiter, secondary: secondaryLimiter } = identifyLimiters(
    skillId,
    strengthSupport,
    weakPoints,
    tendonLevel,
    consistencyLevel
  )
  
  // Generate coach notes
  const coachNotes: string[] = []
  
  if (isAtFinalLevel) {
    coachNotes.push(`Congratulations! You've reached ${levels[maxLevel]}. Focus on hold quality and duration.`)
  } else {
    if (strengthSupport === 'weak') {
      coachNotes.push('Building support strength will accelerate your progress.')
    }
    if (momentumModifier.direction === 'decelerating') {
      coachNotes.push('Increasing training consistency will shorten your timeline.')
    }
    if (recoveryModifier.status === 'fatigued') {
      coachNotes.push('Consider a deload week to optimize recovery.')
    }
    if (primaryLimiter) {
      coachNotes.push(`Primary focus: ${primaryLimiter.label}`)
    }
  }
  
  // Missing data points
  const missingDataPoints: string[] = []
  if (!bodyweight) missingDataPoints.push('Bodyweight')
  if (sessionCount === 0) missingDataPoints.push('Skill sessions')
  if (strengthRecordCount === 0) missingDataPoints.push('Strength records')
  if (!momentum?.hasData) missingDataPoints.push('Training history')
  
  // Primary focus and exercises
  const primaryFocus = primaryLimiter?.label || (nextStage ? `Progress toward ${nextStage.name}` : 'Maintain current level')
  const suggestedExercises = primaryLimiter?.recommendedFocus || []
  
  return {
    skillId,
    skillName: SKILL_NAMES[skillId] || skillId,
    skillCategory: SKILL_CATEGORIES[skillId] || 'strength_skill',
    
    currentStage,
    nextStage,
    estimatedTimeToNextStage,
    predictedSessionCountToNextStage,
    
    longTermTarget,
    estimatedTimeToTarget,
    predictedSessionCountToTarget,
    
    readinessScore,
    confidenceScore,
    confidenceTier: getConfidenceTier(confidenceScore),
    
    primaryLimiter,
    secondaryLimiter,
    
    momentumModifier,
    recoveryModifier,
    
    coachNotes,
    primaryFocus,
    suggestedExercises,
    
    dataQuality,
    missingDataPoints,
    
    generatedAt: new Date().toISOString(),
    basedOnSessions: sessionCount,
    basedOnStrengthRecords: strengthRecordCount,
  }
}

// =============================================================================
// BATCH PREDICTION FOR ALL ACTIVE SKILLS
// =============================================================================

export interface BatchPredictionResult {
  predictions: Record<string, UnifiedSkillPrediction>
  globalInsights: {
    primaryLimiterPattern: LimiterCategory | null
    affectedSkills: string[]
    overallReadiness: 'ready' | 'building' | 'needs_work' | 'insufficient_data'
    topRecommendation: string
  }
  generatedAt: string
}

export function generateBatchPredictions(
  skillIds: SkillId[],
  getInputsForSkill: (skillId: SkillId) => PredictionInputs
): BatchPredictionResult {
  const predictions: Record<string, UnifiedSkillPrediction> = {}
  const limiterCounts: Record<LimiterCategory, number> = {} as Record<LimiterCategory, number>
  let totalReadiness = 0
  let skillCount = 0
  
  for (const skillId of skillIds) {
    const inputs = getInputsForSkill(skillId)
    const prediction = generateUnifiedPrediction(inputs)
    predictions[skillId] = prediction
    
    if (prediction.primaryLimiter) {
      limiterCounts[prediction.primaryLimiter.category] = 
        (limiterCounts[prediction.primaryLimiter.category] || 0) + 1
    }
    
    totalReadiness += prediction.readinessScore
    skillCount++
  }
  
  // Find most common limiter
  let primaryLimiterPattern: LimiterCategory | null = null
  let maxCount = 0
  const affectedSkills: string[] = []
  
  for (const [category, count] of Object.entries(limiterCounts)) {
    if (count > maxCount) {
      maxCount = count
      primaryLimiterPattern = category as LimiterCategory
    }
  }
  
  if (primaryLimiterPattern) {
    for (const [skillId, prediction] of Object.entries(predictions)) {
      if (prediction.primaryLimiter?.category === primaryLimiterPattern) {
        affectedSkills.push(skillId)
      }
    }
  }
  
  // Determine overall readiness
  const avgReadiness = skillCount > 0 ? totalReadiness / skillCount : 0
  let overallReadiness: BatchPredictionResult['globalInsights']['overallReadiness']
  if (avgReadiness >= 70) overallReadiness = 'ready'
  else if (avgReadiness >= 50) overallReadiness = 'building'
  else if (avgReadiness >= 30) overallReadiness = 'needs_work'
  else overallReadiness = 'insufficient_data'
  
  // Generate top recommendation
  let topRecommendation = 'Continue consistent training'
  if (primaryLimiterPattern && primaryLimiterPattern !== 'none') {
    topRecommendation = `Focus on ${LIMITER_LABELS[primaryLimiterPattern]} to accelerate progress across multiple skills`
  }
  
  return {
    predictions,
    globalInsights: {
      primaryLimiterPattern,
      affectedSkills,
      overallReadiness,
      topRecommendation,
    },
    generatedAt: new Date().toISOString(),
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  SKILL_DIFFICULTY_CONFIG,
  SKILL_NAMES,
  SKILL_LEVELS,
  LIMITER_LABELS,
  LIMITER_TIMELINE_IMPACTS,
  LIMITER_FOCUS_EXERCISES,
}
