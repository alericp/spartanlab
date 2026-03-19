/**
 * SpartanLab Method Profile Registry
 * 
 * Canonical method profiles that the generator can select based on:
 * - Goal
 * - Athlete level
 * - Fatigue/recovery context
 * - Schedule mode
 * - Session time budget
 * - Current limiter
 * - Movement family
 * 
 * These are NOT separate generators. They are structured method profiles
 * that shape slot blueprints, loading, and support selection.
 */

import type { PrimaryGoal, ExperienceLevel } from '../program-service'
import type { ScheduleMode, DayStressLevel } from '../flexible-schedule-engine'
import type { MovementFamily } from '../movement-family-registry'

// =============================================================================
// METHOD PROFILE TYPES
// =============================================================================

export type MethodProfileType = 
  | 'skill_frequency'           // Motor-learning emphasis, repeated low-to-moderate exposure
  | 'neural_strength'           // Lower exercise count, higher intensity/rest/quality
  | 'mixed_strength_hypertrophy' // Moderate primary load + controlled accessory
  | 'density_condensed'         // Short-format with grouped support work
  | 'recovery_technical'        // Lower-fatigue technical exposure
  | 'weighted_basics'           // Heavy weighted calisthenics foundation
  | 'flexibility_integration'   // Mobility/flexibility-focused support

export interface MethodProfile {
  id: MethodProfileType
  name: string
  description: string
  
  // Session structure guidance
  structure: {
    maxExercises: number
    minExercises: number
    preferredExercises: number
    restBias: 'short' | 'moderate' | 'long'
    intensityBias: 'low' | 'moderate' | 'high'
    volumeBias: 'low' | 'moderate' | 'high'
  }
  
  // Slot weighting (how to distribute exercise types)
  slotWeighting: {
    skill: number        // 0-1
    strength: number     // 0-1
    accessory: number    // 0-1
    core: number         // 0-1
    mobility: number     // 0-1
  }
  
  // Conditions for selection
  conditions: {
    compatibleGoals: PrimaryGoal[]
    compatibleLevels: ExperienceLevel[]
    minSessionMinutes?: number
    maxSessionMinutes?: number
    fatigueStateRequired?: 'low' | 'moderate' | 'high' | 'any'
    scheduleModeBias?: ScheduleMode
  }
  
  // Movement pattern preferences
  movementBias: {
    preferStraightArm: boolean
    preferBentArm: boolean
    preferIsometrics: boolean
    preferDynamics: boolean
    allowedPatterns?: MovementFamily[]
  }
  
  // Tendon management
  tendonManagement: {
    conservativeLoading: boolean
    requiredRestDays: number
    maxStraightArmPerSession: number
    progressionPaceMultiplier: number  // 1.0 = normal, <1 = slower
  }
  
  // Explanation support
  reasonCode: string
  explanationText: string
}

// =============================================================================
// METHOD PROFILE REGISTRY
// =============================================================================

export const METHOD_PROFILES: Record<MethodProfileType, MethodProfile> = {
  skill_frequency: {
    id: 'skill_frequency',
    name: 'Skill-Frequency Profile',
    description: 'Motor-learning emphasis with repeated low-to-moderate exposure for skill acquisition',
    structure: {
      maxExercises: 6,
      minExercises: 4,
      preferredExercises: 5,
      restBias: 'long',
      intensityBias: 'moderate',
      volumeBias: 'low',
    },
    slotWeighting: {
      skill: 0.5,
      strength: 0.2,
      accessory: 0.15,
      core: 0.1,
      mobility: 0.05,
    },
    conditions: {
      // Note: using extended goal names that map from PrimaryGoal
      compatibleGoals: ['front_lever', 'planche', 'muscle_up', 'handstand_pushup', 'iron_cross', 'skill'],
      compatibleLevels: ['intermediate', 'advanced'],
      fatigueStateRequired: 'any',
    },
    movementBias: {
      preferStraightArm: true,
      preferBentArm: false,
      preferIsometrics: true,
      preferDynamics: false,
    },
    tendonManagement: {
      conservativeLoading: true,
      requiredRestDays: 2,
      maxStraightArmPerSession: 2,
      progressionPaceMultiplier: 0.8,
    },
    reasonCode: 'skill_frequency_profile',
    explanationText: 'Using skill-frequency approach: repeated practice at moderate intensity for motor learning',
  },
  
  neural_strength: {
    id: 'neural_strength',
    name: 'Neural Strength Profile',
    description: 'Lower total exercise count with higher intensity, rest, and quality for maximal strength',
    structure: {
      maxExercises: 5,
      minExercises: 3,
      preferredExercises: 4,
      restBias: 'long',
      intensityBias: 'high',
      volumeBias: 'low',
    },
    slotWeighting: {
      skill: 0.25,
      strength: 0.5,
      accessory: 0.15,
      core: 0.1,
      mobility: 0.0,
    },
    conditions: {
      compatibleGoals: ['one_arm_chin_up', 'front_lever', 'planche', 'muscle_up', 'hspu', 'general_strength'],
      compatibleLevels: ['intermediate', 'advanced'],
      fatigueStateRequired: 'low',
    },
    movementBias: {
      preferStraightArm: false,
      preferBentArm: true,
      preferIsometrics: false,
      preferDynamics: true,
    },
    tendonManagement: {
      conservativeLoading: false,
      requiredRestDays: 2,
      maxStraightArmPerSession: 2,
      progressionPaceMultiplier: 1.0,
    },
    reasonCode: 'neural_strength_profile',
    explanationText: 'Using neural strength approach: high intensity, longer rest, quality over volume',
  },
  
  mixed_strength_hypertrophy: {
    id: 'mixed_strength_hypertrophy',
    name: 'Mixed Strength-Hypertrophy Profile',
    description: 'Moderate primary load with controlled accessory slots for balanced upper-body development',
    structure: {
      maxExercises: 7,
      minExercises: 5,
      preferredExercises: 6,
      restBias: 'moderate',
      intensityBias: 'moderate',
      volumeBias: 'moderate',
    },
    slotWeighting: {
      skill: 0.2,
      strength: 0.35,
      accessory: 0.25,
      core: 0.15,
      mobility: 0.05,
    },
    conditions: {
      compatibleGoals: ['muscle_up', 'general_strength', 'physique', 'pull_up_mastery', 'dip_strength'],
      compatibleLevels: ['beginner', 'intermediate', 'advanced'],
      fatigueStateRequired: 'any',
    },
    movementBias: {
      preferStraightArm: false,
      preferBentArm: true,
      preferIsometrics: false,
      preferDynamics: true,
    },
    tendonManagement: {
      conservativeLoading: false,
      requiredRestDays: 1,
      maxStraightArmPerSession: 1,
      progressionPaceMultiplier: 1.0,
    },
    reasonCode: 'mixed_hypertrophy_profile',
    explanationText: 'Using mixed strength-hypertrophy approach: balanced intensity and volume for development',
  },
  
  density_condensed: {
    id: 'density_condensed',
    name: 'Density/Condensed Profile',
    description: 'Short-format session with grouped support work for time efficiency',
    structure: {
      maxExercises: 6,
      minExercises: 4,
      preferredExercises: 5,
      restBias: 'short',
      intensityBias: 'moderate',
      volumeBias: 'moderate',
    },
    slotWeighting: {
      skill: 0.3,
      strength: 0.25,
      accessory: 0.2,
      core: 0.2,
      mobility: 0.05,
    },
    conditions: {
      compatibleGoals: ['general_strength', 'muscle_up', 'l_sit', 'pull_up_mastery', 'endurance'],
      compatibleLevels: ['beginner', 'intermediate', 'advanced'],
      maxSessionMinutes: 45,
      fatigueStateRequired: 'low',
    },
    movementBias: {
      preferStraightArm: false,
      preferBentArm: true,
      preferIsometrics: false,
      preferDynamics: true,
    },
    tendonManagement: {
      conservativeLoading: true,
      requiredRestDays: 1,
      maxStraightArmPerSession: 1,
      progressionPaceMultiplier: 0.9,
    },
    reasonCode: 'density_structure_reason',
    explanationText: 'Using density format: grouped work with shorter rests for time efficiency',
  },
  
  recovery_technical: {
    id: 'recovery_technical',
    name: 'Recovery-Biased Technical Profile',
    description: 'Lower-fatigue technical exposure with mobility and positional support',
    structure: {
      maxExercises: 5,
      minExercises: 3,
      preferredExercises: 4,
      restBias: 'moderate',
      intensityBias: 'low',
      volumeBias: 'low',
    },
    slotWeighting: {
      skill: 0.35,
      strength: 0.1,
      accessory: 0.1,
      core: 0.2,
      mobility: 0.25,
    },
    conditions: {
      compatibleGoals: ['front_lever', 'planche', 'handstand', 'l_sit', 'flexibility', 'pancake', 'splits'],
      compatibleLevels: ['beginner', 'intermediate', 'advanced'],
      fatigueStateRequired: 'high',
    },
    movementBias: {
      preferStraightArm: false,
      preferBentArm: false,
      preferIsometrics: true,
      preferDynamics: false,
    },
    tendonManagement: {
      conservativeLoading: true,
      requiredRestDays: 1,
      maxStraightArmPerSession: 1,
      progressionPaceMultiplier: 0.7,
    },
    reasonCode: 'recovery_bias_structure_reason',
    explanationText: 'Using recovery-biased approach: lower intensity with technical focus for restoration',
  },
  
  weighted_basics: {
    id: 'weighted_basics',
    name: 'Weighted Basics Profile',
    description: 'Heavy weighted calisthenics foundation for strength transfer to skills',
    structure: {
      maxExercises: 5,
      minExercises: 3,
      preferredExercises: 4,
      restBias: 'long',
      intensityBias: 'high',
      volumeBias: 'low',
    },
    slotWeighting: {
      skill: 0.15,
      strength: 0.55,
      accessory: 0.15,
      core: 0.15,
      mobility: 0.0,
    },
    conditions: {
      compatibleGoals: ['one_arm_chin_up', 'muscle_up', 'front_lever', 'general_strength'],
      compatibleLevels: ['intermediate', 'advanced'],
      fatigueStateRequired: 'low',
    },
    movementBias: {
      preferStraightArm: false,
      preferBentArm: true,
      preferIsometrics: false,
      preferDynamics: true,
      allowedPatterns: ['vertical_pull', 'dip_pattern', 'horizontal_pull', 'squat_pattern'],
    },
    tendonManagement: {
      conservativeLoading: false,
      requiredRestDays: 2,
      maxStraightArmPerSession: 1,
      progressionPaceMultiplier: 1.0,
    },
    reasonCode: 'weighted_basics_profile',
    explanationText: 'Using weighted basics approach: heavy compounds for foundational strength',
  },
  
  flexibility_integration: {
    id: 'flexibility_integration',
    name: 'Flexibility Integration Profile',
    description: 'Mobility and flexibility-focused support for skill prerequisites',
    structure: {
      maxExercises: 6,
      minExercises: 4,
      preferredExercises: 5,
      restBias: 'moderate',
      intensityBias: 'low',
      volumeBias: 'moderate',
    },
    slotWeighting: {
      skill: 0.2,
      strength: 0.15,
      accessory: 0.1,
      core: 0.2,
      mobility: 0.35,
    },
    conditions: {
      compatibleGoals: ['flexibility', 'pancake', 'splits', 'l_sit', 'v_sit', 'handstand'],
      compatibleLevels: ['beginner', 'intermediate', 'advanced'],
      fatigueStateRequired: 'any',
    },
    movementBias: {
      preferStraightArm: false,
      preferBentArm: false,
      preferIsometrics: true,
      preferDynamics: false,
      allowedPatterns: ['compression_core', 'mobility', 'joint_integrity'],
    },
    tendonManagement: {
      conservativeLoading: true,
      requiredRestDays: 1,
      maxStraightArmPerSession: 0,
      progressionPaceMultiplier: 1.0,
    },
    reasonCode: 'mobility_support_profile',
    explanationText: 'Using flexibility integration: mobility work supporting skill prerequisites',
  },
}

// =============================================================================
// METHOD PROFILE SELECTION
// =============================================================================

export interface MethodProfileContext {
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  scheduleMode: ScheduleMode
  sessionMinutes?: number
  fatigueState?: 'low' | 'moderate' | 'high'
  currentLimiter?: string
  dayStress?: DayStressLevel
}

/**
 * Select the most appropriate method profile for the given context.
 * Returns the profile and selection reason.
 */
export function selectMethodProfile(
  context: MethodProfileContext
): { profile: MethodProfile; reason: string } {
  const { primaryGoal, experienceLevel, fatigueState, sessionMinutes, dayStress } = context
  
  console.log('[doctrine] Selecting method profile for:', { primaryGoal, experienceLevel, fatigueState })
  
  // Recovery-biased if high fatigue
  if (fatigueState === 'high' || dayStress === 'recovery_bias_technical') {
    console.log('[doctrine] Selected: recovery_technical (high fatigue)')
    return {
      profile: METHOD_PROFILES.recovery_technical,
      reason: 'Recovery-biased due to high fatigue state',
    }
  }
  
  // Density if short session
  if (sessionMinutes && sessionMinutes <= 45) {
    const densityProfile = METHOD_PROFILES.density_condensed
    if (densityProfile.conditions.compatibleGoals.includes(primaryGoal)) {
      console.log('[doctrine] Selected: density_condensed (short session)')
      return {
        profile: densityProfile,
        reason: `Short session format (${sessionMinutes}min) using density approach`,
      }
    }
  }
  
  // Flexibility-focused for flexibility goals
  if (['flexibility', 'pancake', 'splits'].includes(primaryGoal)) {
    console.log('[doctrine] Selected: flexibility_integration (flexibility goal)')
    return {
      profile: METHOD_PROFILES.flexibility_integration,
      reason: 'Flexibility goal requires integrated mobility work',
    }
  }
  
  // Weighted basics for strength-focused advanced athletes
  if (
    experienceLevel === 'advanced' &&
    ['one_arm_chin_up', 'general_strength'].includes(primaryGoal) &&
    fatigueState === 'low'
  ) {
    console.log('[doctrine] Selected: weighted_basics (advanced strength goal)')
    return {
      profile: METHOD_PROFILES.weighted_basics,
      reason: 'Advanced strength goal using weighted basics foundation',
    }
  }
  
  // Neural strength for low fatigue + advanced skills
  if (
    fatigueState === 'low' &&
    ['one_arm_chin_up', 'front_lever', 'planche'].includes(primaryGoal) &&
    experienceLevel !== 'beginner'
  ) {
    console.log('[doctrine] Selected: neural_strength (low fatigue, advanced skill)')
    return {
      profile: METHOD_PROFILES.neural_strength,
      reason: 'Neural strength approach for advanced skill development',
    }
  }
  
  // Skill-frequency for skill goals
  if (
    ['front_lever', 'planche', 'muscle_up', 'handstand', 'hspu', 'l_sit', 'iron_cross'].includes(primaryGoal)
  ) {
    console.log('[doctrine] Selected: skill_frequency (skill goal)')
    return {
      profile: METHOD_PROFILES.skill_frequency,
      reason: 'Skill-frequency approach for motor learning',
    }
  }
  
  // Default to mixed for general goals
  console.log('[doctrine] Selected: mixed_strength_hypertrophy (default)')
  return {
    profile: METHOD_PROFILES.mixed_strength_hypertrophy,
    reason: 'Balanced strength-hypertrophy approach',
  }
}

// =============================================================================
// PROFILE APPLICATION HELPERS
// =============================================================================

/**
 * Apply method profile constraints to exercise count limits.
 */
export function applyProfileToExerciseCount(
  profile: MethodProfile,
  baseMax: number,
  baseMin: number
): { max: number; min: number; preferred: number } {
  return {
    max: Math.min(profile.structure.maxExercises, baseMax),
    min: Math.max(profile.structure.minExercises, baseMin),
    preferred: profile.structure.preferredExercises,
  }
}

/**
 * Check if an exercise pattern is allowed by the profile.
 */
export function isPatternAllowedByProfile(
  profile: MethodProfile,
  pattern: MovementFamily
): boolean {
  if (!profile.movementBias.allowedPatterns) {
    return true
  }
  return profile.movementBias.allowedPatterns.includes(pattern)
}

/**
 * Get slot weight for a role from the profile.
 */
export function getSlotWeightForRole(
  profile: MethodProfile,
  role: 'skill' | 'strength' | 'accessory' | 'core' | 'mobility'
): number {
  return profile.slotWeighting[role] || 0
}

/**
 * Check if profile allows straight-arm work in current session.
 */
export function canAddStraightArmWork(
  profile: MethodProfile,
  currentStraightArmCount: number
): boolean {
  return currentStraightArmCount < profile.tendonManagement.maxStraightArmPerSession
}

// =============================================================================
// COVERAGE VALIDATION
// =============================================================================

/**
 * Validate that all registered profiles have valid conditions.
 * Used for internal diagnostics.
 */
export function validateMethodProfileCoverage(): {
  valid: boolean
  issues: string[]
  coverage: Record<PrimaryGoal, MethodProfileType[]>
} {
  const issues: string[] = []
  const coverage: Record<string, MethodProfileType[]> = {}
  
  for (const [profileId, profile] of Object.entries(METHOD_PROFILES)) {
    // Check each profile has at least one compatible goal
    if (profile.conditions.compatibleGoals.length === 0) {
      issues.push(`Profile ${profileId} has no compatible goals`)
    }
    
    // Build coverage map
    for (const goal of profile.conditions.compatibleGoals) {
      if (!coverage[goal]) coverage[goal] = []
      coverage[goal].push(profileId as MethodProfileType)
    }
  }
  
  // Check common goals have coverage
  const commonGoals: PrimaryGoal[] = [
    'front_lever', 'planche', 'muscle_up', 'handstand', 'l_sit', 'general_strength'
  ]
  for (const goal of commonGoals) {
    if (!coverage[goal] || coverage[goal].length === 0) {
      issues.push(`Goal ${goal} has no method profile coverage`)
    }
  }
  
  console.log('[doctrine] Method profile coverage validation:', {
    valid: issues.length === 0,
    issueCount: issues.length,
  })
  
  return {
    valid: issues.length === 0,
    issues,
    coverage: coverage as Record<PrimaryGoal, MethodProfileType[]>,
  }
}
