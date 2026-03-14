/**
 * Training Session Configuration
 * Defines session durations, coaching principles, and skill training rules
 * 
 * These principles influence program generation internally
 * without exposing methodology labels to users
 */

import type { PrimaryTrainingOutcome } from './athlete-profile'
import type { PrimaryGoal, ExperienceLevel } from './program-service'

// =============================================================================
// SESSION DURATION CONFIGURATION
// =============================================================================

export type StandardSessionLength = 30 | 45 | 60 | 75
export type ExtendedSessionLength = 90 | 120
export type AllSessionLength = StandardSessionLength | ExtendedSessionLength

export interface SessionDurationOption {
  value: AllSessionLength
  label: string
  description: string
  isExtended: boolean
  recommendedFor: string[]
}

export const SESSION_DURATION_OPTIONS: SessionDurationOption[] = [
  {
    value: 30,
    label: '30 minutes',
    description: 'Quick focused session',
    isExtended: false,
    recommendedFor: ['busy schedules', 'active recovery', 'skill practice only'],
  },
  {
    value: 45,
    label: '45 minutes',
    description: 'Standard training session',
    isExtended: false,
    recommendedFor: ['general fitness', 'skill work + conditioning', 'most athletes'],
  },
  {
    value: 60,
    label: '60 minutes',
    description: 'Full training session',
    isExtended: false,
    recommendedFor: ['skill development', 'strength building', 'intermediate athletes'],
  },
  {
    value: 75,
    label: '75 minutes',
    description: 'Extended training session',
    isExtended: false,
    recommendedFor: ['advanced skill work', 'weighted strength', 'comprehensive sessions'],
  },
  {
    value: 90,
    label: '90 minutes',
    description: 'Advanced training session',
    isExtended: true,
    recommendedFor: ['weighted calisthenics', 'ring specialization', 'high neural output'],
  },
  {
    value: 120,
    label: '120 minutes',
    description: 'Elite training session',
    isExtended: true,
    recommendedFor: ['iron cross training', 'competition prep', 'long rest protocols'],
  },
]

/**
 * Check if user qualifies for extended session options
 */
export function shouldShowExtendedDurations(context: {
  experienceLevel: ExperienceLevel
  primaryGoal?: PrimaryGoal
  primaryOutcome?: PrimaryTrainingOutcome
  skillGoals?: string[]
  extendedSessionsEnabled?: boolean
}): boolean {
  const { experienceLevel, primaryGoal, primaryOutcome, skillGoals = [], extendedSessionsEnabled } = context

  // Explicit user preference
  if (extendedSessionsEnabled) return true

  // Experience level check
  if (experienceLevel === 'advanced') return true

  // Weighted strength goals
  if (primaryGoal === 'weighted_strength') return true
  if (primaryOutcome === 'strength') return true

  // Iron cross training requires long sessions
  if (skillGoals.includes('iron_cross')) return true

  // Ring specialization benefits from longer sessions
  const ringSkills = ['iron_cross', 'maltese', 'victorian', 'planche', 'front_lever']
  if (skillGoals.some(skill => ringSkills.includes(skill))) return true

  return false
}

/**
 * Get available session durations for user
 */
export function getAvailableSessionDurations(context: {
  experienceLevel: ExperienceLevel
  primaryGoal?: PrimaryGoal
  primaryOutcome?: PrimaryTrainingOutcome
  skillGoals?: string[]
  extendedSessionsEnabled?: boolean
}): SessionDurationOption[] {
  const showExtended = shouldShowExtendedDurations(context)
  
  return SESSION_DURATION_OPTIONS.filter(opt => 
    showExtended ? true : !opt.isExtended
  )
}

// =============================================================================
// INTERNAL COACHING PRINCIPLES
// These influence program generation but are NOT exposed in the UI
// =============================================================================

export interface CoachingPrinciple {
  id: string
  // Internal name - never shown to users
  internalName: string
  // How this principle affects program generation
  effect: string
  // When to apply this principle
  applicability: {
    outcomes?: PrimaryTrainingOutcome[]
    goals?: PrimaryGoal[]
    experienceLevels?: ExperienceLevel[]
  }
}

/**
 * Internal coaching principles that guide program generation
 * These are inspired by elite coaching approaches but kept internal
 */
export const COACHING_PRINCIPLES: CoachingPrinciple[] = [
  {
    id: 'skill_before_strength',
    internalName: 'Skill-First Sequencing',
    effect: 'Place skill work early in session when neural output is highest',
    applicability: {
      outcomes: ['skills'],
      goals: ['planche', 'front_lever', 'muscle_up', 'handstand_pushup'],
    },
  },
  {
    id: 'neural_output_priority',
    internalName: 'Neural Output Prioritization',
    effect: 'High-skill movements placed when CNS is fresh, strength work follows',
    applicability: {
      experienceLevels: ['intermediate', 'advanced'],
    },
  },
  {
    id: 'quality_over_volume',
    internalName: 'Quality Set Priority',
    effect: 'Fewer high-quality sets rather than junk volume',
    applicability: {
      outcomes: ['strength', 'skills'],
      experienceLevels: ['advanced'],
    },
  },
  {
    id: 'long_rest_strength',
    internalName: 'Long Rest Strength Protocol',
    effect: '3-5 minute rest for maximum strength output',
    applicability: {
      outcomes: ['strength'],
      goals: ['weighted_strength'],
    },
  },
  {
    id: 'fatigue_budgeting',
    internalName: 'Fatigue Budget Management',
    effect: 'Track cumulative fatigue and adjust volume accordingly',
    applicability: {},
  },
  {
    id: 'density_for_endurance',
    internalName: 'Density Work for Endurance',
    effect: 'Shorter rest, more work in less time for conditioning',
    applicability: {
      outcomes: ['endurance', 'max_reps', 'military'],
    },
  },
  {
    id: 'progressive_overload_waves',
    internalName: 'Wave Loading Progression',
    effect: 'Periodized intensity waves to prevent stagnation',
    applicability: {
      experienceLevels: ['intermediate', 'advanced'],
    },
  },
  {
    id: 'recovery_aware',
    internalName: 'Recovery-Aware Programming',
    effect: 'Adjust volume and intensity based on recovery signals',
    applicability: {},
  },
]

/**
 * Get applicable coaching principles for a given context
 */
export function getApplicableCoachingPrinciples(context: {
  outcome?: PrimaryTrainingOutcome
  goal?: PrimaryGoal
  experienceLevel: ExperienceLevel
}): CoachingPrinciple[] {
  return COACHING_PRINCIPLES.filter(principle => {
    const { outcomes, goals, experienceLevels } = principle.applicability

    // If no constraints, always apply
    if (!outcomes && !goals && !experienceLevels) return true

    // Check outcome match
    if (outcomes && context.outcome && !outcomes.includes(context.outcome)) return false

    // Check goal match
    if (goals && context.goal && !goals.includes(context.goal)) return false

    // Check experience level match
    if (experienceLevels && !experienceLevels.includes(context.experienceLevel)) return false

    return true
  })
}

// =============================================================================
// HANDSTAND TRAINING RULES
// =============================================================================

export interface HandstandTrainingConfig {
  // Balance work - placed early in session
  balanceWork: {
    maxDurationMinutes: number
    optimalDurationMinutes: number
    placementInSession: 'after_warmup' | 'after_skill_work'
    frequencyPerWeek: number
    cues: string[]
  }
  // Strength work - can be placed later
  strengthWork: {
    skipIfHeavyPushingProgrammed: boolean
    exercises: string[]
    alternativeIfSkipped: string
  }
}

export const HANDSTAND_TRAINING_CONFIG: HandstandTrainingConfig = {
  balanceWork: {
    maxDurationMinutes: 15,
    optimalDurationMinutes: 10,
    placementInSession: 'after_warmup',
    frequencyPerWeek: 4, // Frequent short exposure > infrequent long exposure
    cues: [
      'Quality over quantity - end practice on a good rep',
      'Keep attempts short (under 30s) to maintain quality',
      'Rest fully between attempts for neural recovery',
    ],
  },
  strengthWork: {
    skipIfHeavyPushingProgrammed: true,
    exercises: [
      'wall_hspu',
      'pike_pushup',
      'deficit_pike_pushup',
      'elevated_pike_pushup',
      'wall_hspu_negatives',
    ],
    alternativeIfSkipped: 'Include in separate session or as finisher on pull days',
  },
}

/**
 * Determine if handstand strength work should be included
 */
export function shouldIncludeHandstandStrength(sessionFocus: string[], exercisesPlanned: string[]): boolean {
  // Skip if heavy pushing is already in the session
  const heavyPushingExercises = [
    'weighted_dip',
    'planche_work',
    'pseudo_planche_pushup',
    'ring_dip',
    'weighted_push_up',
  ]

  const hasHeavyPushing = exercisesPlanned.some(ex => 
    heavyPushingExercises.some(heavy => ex.toLowerCase().includes(heavy.toLowerCase()))
  )

  return !hasHeavyPushing
}

// =============================================================================
// IRON CROSS SKILL SYSTEM
// =============================================================================

export interface IronCrossReadinessCheck {
  requirement: string
  description: string
  minimumLevel: string
  safetyImportance: 'critical' | 'important' | 'beneficial'
}

export const IRON_CROSS_READINESS_REQUIREMENTS: IronCrossReadinessCheck[] = [
  {
    requirement: 'straight_arm_strength',
    description: 'Prior straight arm strength training experience',
    minimumLevel: '3+ months of dedicated straight arm work',
    safetyImportance: 'critical',
  },
  {
    requirement: 'planche_experience',
    description: 'Tuck planche or better achieved',
    minimumLevel: 'Tuck planche 8+ second hold',
    safetyImportance: 'critical',
  },
  {
    requirement: 'front_lever_experience',
    description: 'Front lever progression experience',
    minimumLevel: 'Tuck front lever 10+ second hold',
    safetyImportance: 'critical',
  },
  {
    requirement: 'ring_support',
    description: 'Solid ring support hold with turn-out',
    minimumLevel: '30+ seconds with external rotation',
    safetyImportance: 'critical',
  },
  {
    requirement: 'shoulder_health',
    description: 'No current shoulder injuries or limitations',
    minimumLevel: 'Pain-free overhead and cross-body movement',
    safetyImportance: 'critical',
  },
]

export interface IronCrossFoundationalProgression {
  name: string
  description: string
  purpose: string
  weeklyFrequency: number
  progressionCriteria: string
}

export const IRON_CROSS_FOUNDATIONAL_PROGRESSIONS: IronCrossFoundationalProgression[] = [
  {
    name: 'Ring Support Hold',
    description: 'Static hold at top of ring dip position',
    purpose: 'Build ring stability and shoulder positioning',
    weeklyFrequency: 3,
    progressionCriteria: '45+ seconds with full turn-out',
  },
  {
    name: 'Ring Support with Turn Out',
    description: 'Ring support with maximum external rotation',
    purpose: 'Develop rotator cuff strength and ring control',
    weeklyFrequency: 3,
    progressionCriteria: '30+ seconds with elbows fully locked',
  },
  {
    name: 'German Hang',
    description: 'Inverted hang with arms behind body',
    purpose: 'Build shoulder flexibility and bicep tendon tolerance',
    weeklyFrequency: 2,
    progressionCriteria: '20+ seconds with straight arms',
  },
  {
    name: 'Straight Arm Conditioning',
    description: 'Planche leans, support holds, and straight arm strength',
    purpose: 'Prepare connective tissue for straight arm loading',
    weeklyFrequency: 3,
    progressionCriteria: 'Consistent training without bicep/elbow discomfort',
  },
  {
    name: 'Ring Stabilization Holds',
    description: 'Various ring positions emphasizing stability',
    purpose: 'Develop proprioception and control on rings',
    weeklyFrequency: 3,
    progressionCriteria: 'Minimal ring shake during holds',
  },
  {
    name: 'Cross Pull Negatives',
    description: 'Slow lowering from support to cross position (with assistance)',
    purpose: 'Build specific cross strength eccentrically',
    weeklyFrequency: 2,
    progressionCriteria: '5+ second controlled descent',
  },
]

export const IRON_CROSS_SAFETY_WARNING = `Iron Cross requires significant tendon strength and straight-arm conditioning. Progressions will begin conservatively to protect connective tissue. Rushing this skill risks serious bicep and elbow tendon injuries.`

/**
 * Check if user is ready for iron cross progressions
 */
export function checkIronCrossReadiness(userProfile: {
  straightArmExperience?: boolean
  plancheLevelAchieved?: string
  frontLeverLevelAchieved?: string
  ringSupportHoldSeconds?: number
  hasShoulderIssues?: boolean
}): {
  isReady: boolean
  missingRequirements: string[]
  recommendation: string
} {
  const missing: string[] = []

  if (!userProfile.straightArmExperience) {
    missing.push('straight arm strength training experience')
  }

  if (!userProfile.plancheLevelAchieved || userProfile.plancheLevelAchieved === 'none') {
    missing.push('planche progression (at least tuck planche)')
  }

  if (!userProfile.frontLeverLevelAchieved || userProfile.frontLeverLevelAchieved === 'none') {
    missing.push('front lever progression (at least tuck front lever)')
  }

  if (!userProfile.ringSupportHoldSeconds || userProfile.ringSupportHoldSeconds < 30) {
    missing.push('ring support hold (30+ seconds with turn-out)')
  }

  if (userProfile.hasShoulderIssues) {
    missing.push('clear shoulder health assessment')
  }

  const isReady = missing.length === 0

  return {
    isReady,
    missingRequirements: missing,
    recommendation: isReady
      ? 'Ready to begin iron cross progressions with proper foundational work'
      : `Build foundation first: ${missing.join(', ')}. Programs will include preparatory exercises.`,
  }
}

// =============================================================================
// RUNNING LOGIC CONFIGURATION
// =============================================================================

export interface RunningInclusionRules {
  // Goals where running should be prominent
  prominentGoals: PrimaryTrainingOutcome[]
  // Goals where running may be included occasionally
  optionalGoals: PrimaryTrainingOutcome[]
  // Goals where running should be minimal or excluded
  excludedGoals: PrimaryTrainingOutcome[]
}

export const RUNNING_INCLUSION_RULES: RunningInclusionRules = {
  prominentGoals: ['endurance', 'military'],
  optionalGoals: ['general_fitness', 'max_reps'],
  excludedGoals: ['skills', 'strength'],
}

/**
 * Determine if running should be included in programming
 */
export function shouldIncludeRunning(
  outcome: PrimaryTrainingOutcome,
  explicitConditioningRequest?: boolean
): {
  shouldInclude: boolean
  frequency: 'none' | 'occasional' | 'regular' | 'primary'
  rationale: string
} {
  if (explicitConditioningRequest) {
    return {
      shouldInclude: true,
      frequency: 'regular',
      rationale: 'User explicitly requested conditioning work',
    }
  }

  if (RUNNING_INCLUSION_RULES.prominentGoals.includes(outcome)) {
    return {
      shouldInclude: true,
      frequency: 'primary',
      rationale: `Running is essential for ${outcome} training goals`,
    }
  }

  if (RUNNING_INCLUSION_RULES.optionalGoals.includes(outcome)) {
    return {
      shouldInclude: true,
      frequency: 'occasional',
      rationale: 'Running supports overall conditioning without dominating programming',
    }
  }

  return {
    shouldInclude: false,
    frequency: 'none',
    rationale: 'Pure calisthenics skill/strength focus - running not included unless requested',
  }
}

// =============================================================================
// SKILL TRAINING SEQUENCING RULES
// =============================================================================

export interface SessionSequencingRules {
  // Order of training elements within a session
  sequenceOrder: string[]
  // Elements that must come early (fresh CNS)
  earlySessionElements: string[]
  // Elements that can be placed later
  lateSessionElements: string[]
}

export const SESSION_SEQUENCING_RULES: SessionSequencingRules = {
  sequenceOrder: [
    'warmup',
    'mobility_activation',
    'skill_balance_work', // Handstands, balance practice
    'skill_strength_work', // Planche, front lever, etc.
    'primary_strength', // Main strength work
    'accessory_work',
    'conditioning_finisher',
    'flexibility_cooldown',
  ],
  earlySessionElements: [
    'handstand_balance',
    'skill_isometrics',
    'max_strength_attempts',
    'explosive_work',
    'high_skill_movements',
  ],
  lateSessionElements: [
    'hypertrophy_work',
    'endurance_circuits',
    'flexibility_work',
    'conditioning',
    'accessory_isolation',
  ],
}

/**
 * Get recommended session structure based on training focus
 */
export function getSessionStructure(
  focus: PrimaryTrainingOutcome,
  includesHandstand: boolean,
  includesSkillWork: boolean
): string[] {
  const structure: string[] = ['warmup']

  // Handstand balance always early if included
  if (includesHandstand) {
    structure.push('handstand_balance_work')
  }

  // Skill isometrics before strength
  if (includesSkillWork) {
    structure.push('skill_isometric_work')
  }

  // Main training block based on focus
  switch (focus) {
    case 'strength':
      structure.push('primary_strength', 'accessory_strength')
      break
    case 'skills':
      structure.push('skill_progressions', 'support_strength')
      break
    case 'endurance':
    case 'military':
      structure.push('strength_circuit', 'conditioning_work')
      break
    case 'max_reps':
      structure.push('density_blocks', 'volume_work')
      break
    default:
      structure.push('balanced_training')
  }

  structure.push('cooldown')
  return structure
}
