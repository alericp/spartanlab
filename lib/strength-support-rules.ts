// Strength Support Rules Engine
// Maps weighted strength performance to skill-support readiness

import type { ExerciseType, StrengthRecord } from './strength-service'
import type { RelativeStrengthTier } from './relative-strength-engine'

// =============================================================================
// TYPES
// =============================================================================

export type SkillName = 'front_lever' | 'planche' | 'muscle_up' | 'handstand_pushup'

export type SupportLevel = 
  | 'strong_support' 
  | 'adequate_support' 
  | 'borderline_support' 
  | 'likely_limiter'
  | 'no_data'

export interface SkillSupportAssessment {
  skill: SkillName
  skillLabel: string
  supportLevel: SupportLevel
  supportLabel: string
  primaryExercise: ExerciseType
  secondaryExercise?: ExerciseType
  confidence: 'high' | 'medium' | 'low'
  explanation: string
}

export interface PushPullBalance {
  status: 'pull_stronger' | 'push_stronger' | 'balanced' | 'insufficient_data'
  label: string
  pullTier: RelativeStrengthTier | null
  pushTier: RelativeStrengthTier | null
  explanation: string
}

export interface StrengthWeakPoint {
  type: 'pulling' | 'pushing' | 'balanced' | 'unknown'
  message: string
  affectedSkills: SkillName[]
}

// =============================================================================
// SUPPORT THRESHOLDS (based on 1RM ratio)
// These define minimum relative strength for skill support
// =============================================================================

interface SkillSupportThreshold {
  skillLevel: string
  minPullRatio?: number  // For pull-dependent skills
  minPushRatio?: number  // For push-dependent skills
}

// Front Lever: primarily depends on pulling strength
const FRONT_LEVER_THRESHOLDS: SkillSupportThreshold[] = [
  { skillLevel: 'tuck', minPullRatio: 0.15 },
  { skillLevel: 'advanced_tuck', minPullRatio: 0.30 },
  { skillLevel: 'one_leg', minPullRatio: 0.40 },
  { skillLevel: 'straddle', minPullRatio: 0.55 },
  { skillLevel: 'full', minPullRatio: 0.70 },
]

// Planche: primarily depends on pushing strength
const PLANCHE_THRESHOLDS: SkillSupportThreshold[] = [
  { skillLevel: 'tuck', minPushRatio: 0.25 },
  { skillLevel: 'advanced_tuck', minPushRatio: 0.45 },
  { skillLevel: 'straddle', minPushRatio: 0.65 },
  { skillLevel: 'full', minPushRatio: 0.85 },
]

// Muscle-Up: depends on both pull and push
const MUSCLE_UP_THRESHOLDS: SkillSupportThreshold[] = [
  { skillLevel: 'assisted', minPullRatio: 0.10, minPushRatio: 0.15 },
  { skillLevel: 'strict', minPullRatio: 0.25, minPushRatio: 0.30 },
  { skillLevel: 'weighted_light', minPullRatio: 0.40, minPushRatio: 0.45 },
  { skillLevel: 'weighted_heavy', minPullRatio: 0.55, minPushRatio: 0.60 },
]

// HSPU: depends on pushing strength
const HSPU_THRESHOLDS: SkillSupportThreshold[] = [
  { skillLevel: 'pike', minPushRatio: 0.20 },
  { skillLevel: 'wall_partial', minPushRatio: 0.35 },
  { skillLevel: 'wall_full', minPushRatio: 0.50 },
  { skillLevel: 'freestanding', minPushRatio: 0.65 },
]

// =============================================================================
// SUPPORT LEVEL LABELS
// =============================================================================

const SUPPORT_LABELS: Record<SupportLevel, string> = {
  strong_support: 'Strong Support',
  adequate_support: 'Adequate Support',
  borderline_support: 'Borderline',
  likely_limiter: 'Likely Limiter',
  no_data: 'More Data Needed',
}

const SKILL_LABELS: Record<SkillName, string> = {
  front_lever: 'Front Lever',
  planche: 'Planche',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'HSPU',
}

// =============================================================================
// CORE ASSESSMENT FUNCTIONS
// =============================================================================

/**
 * Determine support level based on ratio vs threshold
 */
function determineSupportLevel(
  currentRatio: number | null,
  targetThreshold: number
): SupportLevel {
  if (currentRatio === null) return 'no_data'
  
  const ratio = currentRatio / targetThreshold
  
  if (ratio >= 1.15) return 'strong_support'
  if (ratio >= 0.95) return 'adequate_support'
  if (ratio >= 0.75) return 'borderline_support'
  return 'likely_limiter'
}

/**
 * Assess strength support for front lever
 */
export function assessFrontLeverSupport(
  pullRatio: number | null,
  targetLevel: number = 2 // Default to advanced tuck/one leg
): SkillSupportAssessment {
  const threshold = FRONT_LEVER_THRESHOLDS[Math.min(targetLevel, FRONT_LEVER_THRESHOLDS.length - 1)]
  const supportLevel = determineSupportLevel(pullRatio, threshold.minPullRatio || 0.30)
  
  let explanation = ''
  switch (supportLevel) {
    case 'strong_support':
      explanation = 'Your pulling strength exceeds typical requirements for this front lever progression.'
      break
    case 'adequate_support':
      explanation = 'Pulling strength meets baseline requirements, though more reserve would help.'
      break
    case 'borderline_support':
      explanation = 'Pulling strength may be limiting. Building more pull capacity could unlock faster progress.'
      break
    case 'likely_limiter':
      explanation = 'Pulling strength is likely a primary limiter. Focus on weighted pull-up development.'
      break
    default:
      explanation = 'Log weighted pull-up records to assess front lever support strength.'
  }
  
  return {
    skill: 'front_lever',
    skillLabel: SKILL_LABELS.front_lever,
    supportLevel,
    supportLabel: SUPPORT_LABELS[supportLevel],
    primaryExercise: 'weighted_pull_up',
    confidence: pullRatio !== null ? 'high' : 'low',
    explanation,
  }
}

/**
 * Assess strength support for planche
 */
export function assessPlancheSupport(
  pushRatio: number | null,
  targetLevel: number = 1 // Default to advanced tuck
): SkillSupportAssessment {
  const threshold = PLANCHE_THRESHOLDS[Math.min(targetLevel, PLANCHE_THRESHOLDS.length - 1)]
  const supportLevel = determineSupportLevel(pushRatio, threshold.minPushRatio || 0.45)
  
  let explanation = ''
  switch (supportLevel) {
    case 'strong_support':
      explanation = 'Your pushing strength exceeds typical requirements for this planche progression.'
      break
    case 'adequate_support':
      explanation = 'Pushing strength meets baseline. Planche-specific lean work will complement this well.'
      break
    case 'borderline_support':
      explanation = 'Pushing strength may limit planche progress. Consider building more dip capacity.'
      break
    case 'likely_limiter':
      explanation = 'Pushing strength is likely limiting. Prioritize weighted dip development alongside planche work.'
      break
    default:
      explanation = 'Log weighted dip records to assess planche support strength.'
  }
  
  return {
    skill: 'planche',
    skillLabel: SKILL_LABELS.planche,
    supportLevel,
    supportLabel: SUPPORT_LABELS[supportLevel],
    primaryExercise: 'weighted_dip',
    confidence: pushRatio !== null ? 'high' : 'low',
    explanation,
  }
}

/**
 * Assess strength support for muscle-up
 */
export function assessMuscleUpSupport(
  pullRatio: number | null,
  pushRatio: number | null,
  targetLevel: number = 1 // Default to strict
): SkillSupportAssessment {
  const threshold = MUSCLE_UP_THRESHOLDS[Math.min(targetLevel, MUSCLE_UP_THRESHOLDS.length - 1)]
  
  const pullSupport = determineSupportLevel(pullRatio, threshold.minPullRatio || 0.25)
  const pushSupport = determineSupportLevel(pushRatio, threshold.minPushRatio || 0.30)
  
  // Take the weaker of the two
  const supportLevels: SupportLevel[] = ['likely_limiter', 'borderline_support', 'adequate_support', 'strong_support']
  const overallLevel = supportLevels[
    Math.min(supportLevels.indexOf(pullSupport), supportLevels.indexOf(pushSupport))
  ] || 'no_data'
  
  let explanation = ''
  if (pullRatio === null && pushRatio === null) {
    explanation = 'Log both weighted pull-up and dip records to assess muscle-up support.'
  } else if (pullSupport === pushSupport) {
    explanation = 'Pull and push strength are balanced for muscle-up work.'
  } else if (supportLevels.indexOf(pullSupport) < supportLevels.indexOf(pushSupport)) {
    explanation = 'Pulling strength is the weaker link for muscle-up development.'
  } else {
    explanation = 'Pushing strength (transition/dip) is the weaker link for muscle-up development.'
  }
  
  return {
    skill: 'muscle_up',
    skillLabel: SKILL_LABELS.muscle_up,
    supportLevel: overallLevel,
    supportLabel: SUPPORT_LABELS[overallLevel],
    primaryExercise: 'weighted_pull_up',
    secondaryExercise: 'weighted_dip',
    confidence: (pullRatio !== null && pushRatio !== null) ? 'high' : 'medium',
    explanation,
  }
}

/**
 * Assess strength support for HSPU
 */
export function assessHSPUSupport(
  pushRatio: number | null,
  targetLevel: number = 2 // Default to wall full
): SkillSupportAssessment {
  const threshold = HSPU_THRESHOLDS[Math.min(targetLevel, HSPU_THRESHOLDS.length - 1)]
  const supportLevel = determineSupportLevel(pushRatio, threshold.minPushRatio || 0.50)
  
  let explanation = ''
  switch (supportLevel) {
    case 'strong_support':
      explanation = 'Your pressing strength is solid for this HSPU progression level.'
      break
    case 'adequate_support':
      explanation = 'Pressing strength is adequate. Balance work and ROM development are key.'
      break
    case 'borderline_support':
      explanation = 'Pressing strength may limit HSPU progress. Build more overhead capacity.'
      break
    case 'likely_limiter':
      explanation = 'Pressing strength is likely limiting. Focus on pike pushups and wall work.'
      break
    default:
      explanation = 'Log weighted dip records to estimate HSPU support strength.'
  }
  
  return {
    skill: 'handstand_pushup',
    skillLabel: SKILL_LABELS.handstand_pushup,
    supportLevel,
    supportLabel: SUPPORT_LABELS[supportLevel],
    primaryExercise: 'weighted_dip',
    confidence: pushRatio !== null ? 'medium' : 'low', // Medium because dip is a proxy
    explanation,
  }
}

/**
 * Assess all skill support levels
 */
export function assessAllSkillSupport(
  pullRatio: number | null,
  pushRatio: number | null,
  targetLevels?: Partial<Record<SkillName, number>>
): SkillSupportAssessment[] {
  return [
    assessFrontLeverSupport(pullRatio, targetLevels?.front_lever),
    assessPlancheSupport(pushRatio, targetLevels?.planche),
    assessMuscleUpSupport(pullRatio, pushRatio, targetLevels?.muscle_up),
    assessHSPUSupport(pushRatio, targetLevels?.handstand_pushup),
  ]
}

/**
 * Calculate push/pull balance
 */
export function calculatePushPullBalance(
  pullTier: RelativeStrengthTier | null,
  pushTier: RelativeStrengthTier | null
): PushPullBalance {
  if (!pullTier && !pushTier) {
    return {
      status: 'insufficient_data',
      label: 'More Data Needed',
      pullTier: null,
      pushTier: null,
      explanation: 'Log both weighted pull-ups and dips to analyze push/pull balance.',
    }
  }
  
  if (!pullTier) {
    return {
      status: 'insufficient_data',
      label: 'Pull Data Needed',
      pullTier: null,
      pushTier,
      explanation: 'Log weighted pull-up records to compare with your push strength.',
    }
  }
  
  if (!pushTier) {
    return {
      status: 'insufficient_data',
      label: 'Push Data Needed',
      pullTier,
      pushTier: null,
      explanation: 'Log weighted dip records to compare with your pull strength.',
    }
  }
  
  const tierOrder: RelativeStrengthTier[] = ['novice', 'developing', 'strong', 'advanced', 'elite']
  const pullIndex = tierOrder.indexOf(pullTier)
  const pushIndex = tierOrder.indexOf(pushTier)
  const diff = pullIndex - pushIndex
  
  if (Math.abs(diff) <= 1) {
    return {
      status: 'balanced',
      label: 'Balanced',
      pullTier,
      pushTier,
      explanation: 'Your push and pull strength are well-balanced, which is ideal for calisthenics skills.',
    }
  }
  
  if (diff > 1) {
    return {
      status: 'pull_stronger',
      label: 'Pull Dominant',
      pullTier,
      pushTier,
      explanation: 'Your pulling strength is notably stronger than pushing. Consider more dip volume.',
    }
  }
  
  return {
    status: 'push_stronger',
    label: 'Push Dominant',
    pullTier,
    pushTier,
    explanation: 'Your pushing strength is notably stronger than pulling. Consider more pull-up volume.',
  }
}

/**
 * Identify primary strength weak point
 */
export function identifyWeakPoint(
  assessments: SkillSupportAssessment[],
  balance: PushPullBalance
): StrengthWeakPoint {
  const limiters = assessments.filter(a => a.supportLevel === 'likely_limiter')
  const borderline = assessments.filter(a => a.supportLevel === 'borderline_support')
  
  // Check for clear limiting patterns
  const pullLimited = [...limiters, ...borderline].filter(a => a.primaryExercise === 'weighted_pull_up')
  const pushLimited = [...limiters, ...borderline].filter(a => a.primaryExercise === 'weighted_dip')
  
  if (pullLimited.length > pushLimited.length) {
    return {
      type: 'pulling',
      message: 'Pulling strength is your current weak point for skill development.',
      affectedSkills: pullLimited.map(a => a.skill),
    }
  }
  
  if (pushLimited.length > pullLimited.length) {
    return {
      type: 'pushing',
      message: 'Pushing strength is your current weak point for skill development.',
      affectedSkills: pushLimited.map(a => a.skill),
    }
  }
  
  if (limiters.length === 0 && borderline.length === 0) {
    return {
      type: 'balanced',
      message: 'Strength does not appear to be a primary limiter right now.',
      affectedSkills: [],
    }
  }
  
  return {
    type: 'unknown',
    message: 'Both push and pull patterns may need development.',
    affectedSkills: [...pullLimited, ...pushLimited].map(a => a.skill),
  }
}
