// Training Style Service
// Manages athlete training style profiles and priority weighting
// Integrates with the unified coaching engine for method selection

import { neon } from '@neondatabase/serverless'

// =============================================================================
// TYPES
// =============================================================================

export type TrainingStyleMode =
  | 'skill_focused'
  | 'strength_focused'
  | 'power_focused'
  | 'endurance_focused'
  | 'hypertrophy_supported'
  | 'balanced_hybrid'

export interface TrainingStyleProfile {
  id: string
  athleteId: string
  
  // Style mode (primary classification)
  styleMode: TrainingStyleMode
  
  // Priority weights (should sum to 100)
  skillPriority: number
  strengthPriority: number
  powerPriority: number
  endurancePriority: number
  hypertrophyPriority: number
  
  // Style-specific parameters
  preferHighFrequency: boolean     // Skill-focused: more exposures
  preferHeavyLoading: boolean      // Strength-focused: heavier weights
  preferExplosiveWork: boolean     // Power-focused: dynamic movements
  preferDensityWork: boolean       // Endurance-focused: circuits/density
  includeHypertrophySupport: boolean // Hypertrophy-supported: accessory work
  
  // Rep range preferences
  preferredRepRangeMin: number
  preferredRepRangeMax: number
  
  // Rest preferences
  preferredRestSeconds: number
  
  // Metadata
  source: 'onboarding' | 'settings' | 'adaptive' | 'manual'
  createdAt: string
  updatedAt: string
}

export interface StylePriorities {
  skill: number
  strength: number
  power: number
  endurance: number
  hypertrophy: number
}

export interface StyleProgrammingRules {
  // Volume/frequency modifiers
  skillExposureMultiplier: number      // How much to multiply skill work frequency
  strengthVolumeMultiplier: number     // Modifier for strength work volume
  accessoryVolumeMultiplier: number    // Modifier for accessory work
  
  // Intensity modifiers
  loadIntensityBias: 'light' | 'moderate' | 'heavy'
  repRangeBias: 'low' | 'moderate' | 'high'
  
  // Density modifiers
  restBias: 'short' | 'moderate' | 'long'
  densityPreference: 'low' | 'moderate' | 'high'
  
  // Exercise selection bias
  preferWeightedVariants: boolean
  preferExplosiveVariants: boolean
  preferIsometricHolds: boolean
  includeConditioningWork: boolean
  
  // Hypertrophy support
  hypertrophyAccessoriesPerSession: number
  hypertrophyBodyParts: string[]
}

// =============================================================================
// STYLE MODE DEFINITIONS
// =============================================================================

export const STYLE_MODE_DEFINITIONS: Record<TrainingStyleMode, {
  label: string
  description: string
  priorities: StylePriorities
  rules: StyleProgrammingRules
}> = {
  skill_focused: {
    label: 'Skill-Focused',
    description: 'High-frequency skill exposures with quality focus. Strength work supports skill development.',
    priorities: { skill: 50, strength: 25, power: 10, endurance: 10, hypertrophy: 5 },
    rules: {
      skillExposureMultiplier: 1.3,
      strengthVolumeMultiplier: 0.85,
      accessoryVolumeMultiplier: 0.7,
      loadIntensityBias: 'moderate',
      repRangeBias: 'moderate',
      restBias: 'moderate',
      densityPreference: 'low',
      preferWeightedVariants: false,
      preferExplosiveVariants: false,
      preferIsometricHolds: true,
      includeConditioningWork: false,
      hypertrophyAccessoriesPerSession: 1,
      hypertrophyBodyParts: [],
    },
  },
  strength_focused: {
    label: 'Strength-Focused',
    description: 'Heavier loading with lower reps. Weighted calisthenics emphasized for maximal strength.',
    priorities: { skill: 20, strength: 50, power: 15, endurance: 5, hypertrophy: 10 },
    rules: {
      skillExposureMultiplier: 0.9,
      strengthVolumeMultiplier: 1.2,
      accessoryVolumeMultiplier: 0.9,
      loadIntensityBias: 'heavy',
      repRangeBias: 'low',
      restBias: 'long',
      densityPreference: 'low',
      preferWeightedVariants: true,
      preferExplosiveVariants: false,
      preferIsometricHolds: false,
      includeConditioningWork: false,
      hypertrophyAccessoriesPerSession: 2,
      hypertrophyBodyParts: ['back', 'chest'],
    },
  },
  power_focused: {
    label: 'Power-Focused',
    description: 'Explosive pulling and pushing. Dynamic movement emphasis with high-quality speed work.',
    priorities: { skill: 15, strength: 30, power: 40, endurance: 5, hypertrophy: 10 },
    rules: {
      skillExposureMultiplier: 0.8,
      strengthVolumeMultiplier: 0.9,
      accessoryVolumeMultiplier: 0.7,
      loadIntensityBias: 'moderate',
      repRangeBias: 'low',
      restBias: 'long',
      densityPreference: 'low',
      preferWeightedVariants: false,
      preferExplosiveVariants: true,
      preferIsometricHolds: false,
      includeConditioningWork: false,
      hypertrophyAccessoriesPerSession: 1,
      hypertrophyBodyParts: [],
    },
  },
  endurance_focused: {
    label: 'Endurance/Density',
    description: 'Work capacity building with shorter rest. Circuit and density work for repeat-effort tolerance.',
    priorities: { skill: 15, strength: 15, power: 5, endurance: 55, hypertrophy: 10 },
    rules: {
      skillExposureMultiplier: 0.9,
      strengthVolumeMultiplier: 0.8,
      accessoryVolumeMultiplier: 1.0,
      loadIntensityBias: 'light',
      repRangeBias: 'high',
      restBias: 'short',
      densityPreference: 'high',
      preferWeightedVariants: false,
      preferExplosiveVariants: false,
      preferIsometricHolds: false,
      includeConditioningWork: true,
      hypertrophyAccessoriesPerSession: 0,
      hypertrophyBodyParts: [],
    },
  },
  hypertrophy_supported: {
    label: 'Hypertrophy-Supported',
    description: 'Core skill work first with targeted muscle development. Minimal high-ROI accessories for physique.',
    priorities: { skill: 25, strength: 25, power: 5, endurance: 10, hypertrophy: 35 },
    rules: {
      skillExposureMultiplier: 0.95,
      strengthVolumeMultiplier: 1.0,
      accessoryVolumeMultiplier: 1.4,
      loadIntensityBias: 'moderate',
      repRangeBias: 'moderate',
      restBias: 'moderate',
      densityPreference: 'moderate',
      preferWeightedVariants: true,
      preferExplosiveVariants: false,
      preferIsometricHolds: false,
      includeConditioningWork: false,
      hypertrophyAccessoriesPerSession: 3,
      hypertrophyBodyParts: ['biceps', 'chest', 'shoulders', 'back'],
    },
  },
  balanced_hybrid: {
    label: 'Balanced Hybrid',
    description: 'Skill, strength, and accessory balance. Moderate density for general-use training.',
    priorities: { skill: 30, strength: 30, power: 10, endurance: 15, hypertrophy: 15 },
    rules: {
      skillExposureMultiplier: 1.0,
      strengthVolumeMultiplier: 1.0,
      accessoryVolumeMultiplier: 1.0,
      loadIntensityBias: 'moderate',
      repRangeBias: 'moderate',
      restBias: 'moderate',
      densityPreference: 'moderate',
      preferWeightedVariants: false,
      preferExplosiveVariants: false,
      preferIsometricHolds: false,
      includeConditioningWork: false,
      hypertrophyAccessoriesPerSession: 2,
      hypertrophyBodyParts: ['back', 'biceps'],
    },
  },
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not set')
  }
  return neon(connectionString)
}

/**
 * Get training style profile for an athlete
 */
export async function getTrainingStyleProfile(
  athleteId: string
): Promise<TrainingStyleProfile | null> {
  const sql = getDb()
  
  try {
    // Try athlete_id first (new schema), then user_id (legacy)
    let result = await sql`
      SELECT 
        id,
        COALESCE(athlete_id, user_id) as "athleteId",
        style_mode as "styleMode",
        skill_priority as "skillPriority",
        strength_priority as "strengthPriority",
        power_priority as "powerPriority",
        endurance_priority as "endurancePriority",
        hypertrophy_priority as "hypertrophyPriority",
        COALESCE(prefer_high_frequency, false) as "preferHighFrequency",
        COALESCE(prefer_heavy_loading, false) as "preferHeavyLoading",
        COALESCE(prefer_explosive_work, false) as "preferExplosiveWork",
        COALESCE(prefer_density_work, false) as "preferDensityWork",
        COALESCE(include_hypertrophy_support, true) as "includeHypertrophySupport",
        COALESCE(preferred_rep_range_min, 6) as "preferredRepRangeMin",
        COALESCE(preferred_rep_range_max, 12) as "preferredRepRangeMax",
        COALESCE(preferred_rest_seconds, 90) as "preferredRestSeconds",
        source,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM training_style_profiles
      WHERE COALESCE(athlete_id, user_id) = ${athleteId}
      LIMIT 1
    `
    
    if (result.length === 0) return null
    return result[0] as TrainingStyleProfile
  } catch {
    // Table might not exist yet
    return null
  }
}

/**
 * Create or update training style profile
 */
export async function saveTrainingStyleProfile(
  athleteId: string,
  input: Partial<TrainingStyleProfile> & { styleMode: TrainingStyleMode }
): Promise<TrainingStyleProfile> {
  const sql = getDb()
  
  // Get defaults from style mode definition
  const defaults = STYLE_MODE_DEFINITIONS[input.styleMode]
  const priorities = input.skillPriority !== undefined
    ? {
        skill: input.skillPriority,
        strength: input.strengthPriority ?? defaults.priorities.strength,
        power: input.powerPriority ?? defaults.priorities.power,
        endurance: input.endurancePriority ?? defaults.priorities.endurance,
        hypertrophy: input.hypertrophyPriority ?? defaults.priorities.hypertrophy,
      }
    : defaults.priorities
  
  const result = await sql`
    INSERT INTO training_style_profiles (
      athlete_id,
      style_mode,
      skill_priority,
      strength_priority,
      power_priority,
      endurance_priority,
      hypertrophy_priority,
      prefer_high_frequency,
      prefer_heavy_loading,
      prefer_explosive_work,
      prefer_density_work,
      include_hypertrophy_support,
      preferred_rep_range_min,
      preferred_rep_range_max,
      preferred_rest_seconds,
      source
    ) VALUES (
      ${athleteId},
      ${input.styleMode},
      ${priorities.skill},
      ${priorities.strength},
      ${priorities.power},
      ${priorities.endurance},
      ${priorities.hypertrophy},
      ${input.preferHighFrequency ?? input.styleMode === 'skill_focused'},
      ${input.preferHeavyLoading ?? input.styleMode === 'strength_focused'},
      ${input.preferExplosiveWork ?? input.styleMode === 'power_focused'},
      ${input.preferDensityWork ?? input.styleMode === 'endurance_focused'},
      ${input.includeHypertrophySupport ?? input.styleMode === 'hypertrophy_supported'},
      ${input.preferredRepRangeMin ?? 6},
      ${input.preferredRepRangeMax ?? 12},
      ${input.preferredRestSeconds ?? 90},
      ${input.source ?? 'settings'}
    )
    ON CONFLICT (athlete_id) DO UPDATE SET
      style_mode = EXCLUDED.style_mode,
      skill_priority = EXCLUDED.skill_priority,
      strength_priority = EXCLUDED.strength_priority,
      power_priority = EXCLUDED.power_priority,
      endurance_priority = EXCLUDED.endurance_priority,
      hypertrophy_priority = EXCLUDED.hypertrophy_priority,
      prefer_high_frequency = EXCLUDED.prefer_high_frequency,
      prefer_heavy_loading = EXCLUDED.prefer_heavy_loading,
      prefer_explosive_work = EXCLUDED.prefer_explosive_work,
      prefer_density_work = EXCLUDED.prefer_density_work,
      include_hypertrophy_support = EXCLUDED.include_hypertrophy_support,
      preferred_rep_range_min = EXCLUDED.preferred_rep_range_min,
      preferred_rep_range_max = EXCLUDED.preferred_rep_range_max,
      preferred_rest_seconds = EXCLUDED.preferred_rest_seconds,
      source = EXCLUDED.source,
      updated_at = NOW()
    RETURNING
      id,
      athlete_id as "athleteId",
      style_mode as "styleMode",
      skill_priority as "skillPriority",
      strength_priority as "strengthPriority",
      power_priority as "powerPriority",
      endurance_priority as "endurancePriority",
      hypertrophy_priority as "hypertrophyPriority",
      prefer_high_frequency as "preferHighFrequency",
      prefer_heavy_loading as "preferHeavyLoading",
      prefer_explosive_work as "preferExplosiveWork",
      prefer_density_work as "preferDensityWork",
      include_hypertrophy_support as "includeHypertrophySupport",
      preferred_rep_range_min as "preferredRepRangeMin",
      preferred_rep_range_max as "preferredRepRangeMax",
      preferred_rest_seconds as "preferredRestSeconds",
      source,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `
  
  return result[0] as TrainingStyleProfile
}

// =============================================================================
// STYLE DERIVATION HELPERS
// =============================================================================

/**
 * Infer training style from onboarding profile
 */
export function inferStyleFromOnboarding(profile: {
  primaryOutcome?: string
  workoutDuration?: string
  trainingAge?: number
}): TrainingStyleMode {
  const outcome = profile.primaryOutcome
  
  switch (outcome) {
    case 'strength':
      return 'strength_focused'
    case 'skills':
      return 'skill_focused'
    case 'endurance':
    case 'max_reps':
      return 'endurance_focused'
    case 'aesthetics':
    case 'hypertrophy':
      return 'hypertrophy_supported'
    case 'military':
    case 'balanced':
    default:
      return 'balanced_hybrid'
  }
}

/**
 * Get programming rules for a style mode
 */
export function getStyleProgrammingRules(styleMode: TrainingStyleMode): StyleProgrammingRules {
  return STYLE_MODE_DEFINITIONS[styleMode].rules
}

/**
 * Get style priorities for a mode
 */
export function getStylePriorities(styleMode: TrainingStyleMode): StylePriorities {
  return STYLE_MODE_DEFINITIONS[styleMode].priorities
}

/**
 * Check if a style change should trigger program regeneration
 */
export function shouldRegenerateForStyleChange(
  oldStyle: TrainingStyleMode,
  newStyle: TrainingStyleMode
): boolean {
  // Any style change is significant enough to regenerate
  if (oldStyle !== newStyle) {
    return true
  }
  return false
}

// =============================================================================
// STYLE-SPECIFIC VOLUME CALCULATIONS
// =============================================================================

/**
 * Calculate recommended weekly skill exposures based on style
 */
export function getRecommendedSkillExposures(
  styleMode: TrainingStyleMode,
  trainingDaysPerWeek: number
): number {
  const rules = getStyleProgrammingRules(styleMode)
  const base = Math.min(trainingDaysPerWeek, 5) // Cap at 5 skill days
  return Math.round(base * rules.skillExposureMultiplier)
}

/**
 * Calculate recommended strength sets per week based on style
 */
export function getRecommendedStrengthSets(
  styleMode: TrainingStyleMode,
  trainingDaysPerWeek: number,
  movementCategory: 'pull' | 'push' | 'core'
): { min: number; max: number } {
  const rules = getStyleProgrammingRules(styleMode)
  
  // Base weekly sets per category
  const baseSets = {
    pull: { min: 10, max: 16 },
    push: { min: 8, max: 14 },
    core: { min: 6, max: 10 },
  }
  
  const base = baseSets[movementCategory]
  const multiplier = rules.strengthVolumeMultiplier
  
  // Scale by training days
  const dayMultiplier = trainingDaysPerWeek >= 4 ? 1.2 : trainingDaysPerWeek >= 3 ? 1.0 : 0.8
  
  return {
    min: Math.round(base.min * multiplier * dayMultiplier),
    max: Math.round(base.max * multiplier * dayMultiplier),
  }
}

/**
 * Calculate recommended accessory volume based on style
 */
export function getRecommendedAccessoryVolume(
  styleMode: TrainingStyleMode,
  sessionDurationMinutes: number
): { exercisesPerSession: number; setsPerExercise: number } {
  const rules = getStyleProgrammingRules(styleMode)
  
  // Base accessory volume
  let exercisesPerSession = rules.hypertrophyAccessoriesPerSession
  let setsPerExercise = 3
  
  // Adjust for session duration
  if (sessionDurationMinutes < 45) {
    exercisesPerSession = Math.max(1, exercisesPerSession - 1)
    setsPerExercise = 2
  } else if (sessionDurationMinutes >= 60) {
    exercisesPerSession = Math.min(4, exercisesPerSession + 1)
  }
  
  return { exercisesPerSession, setsPerExercise }
}

/**
 * Get rep range based on style and exercise category
 */
export function getRepRangeForStyle(
  styleMode: TrainingStyleMode,
  exerciseCategory: 'skill' | 'strength' | 'accessory'
): { min: number; max: number } {
  const rules = getStyleProgrammingRules(styleMode)
  
  // Base rep ranges by category and bias
  const repRanges = {
    low: { skill: { min: 3, max: 5 }, strength: { min: 3, max: 6 }, accessory: { min: 6, max: 10 } },
    moderate: { skill: { min: 5, max: 8 }, strength: { min: 5, max: 8 }, accessory: { min: 8, max: 12 } },
    high: { skill: { min: 8, max: 12 }, strength: { min: 8, max: 12 }, accessory: { min: 12, max: 15 } },
  }
  
  return repRanges[rules.repRangeBias][exerciseCategory]
}

/**
 * Get rest period based on style and exercise category
 */
export function getRestPeriodForStyle(
  styleMode: TrainingStyleMode,
  exerciseCategory: 'skill' | 'strength' | 'accessory'
): number {
  const rules = getStyleProgrammingRules(styleMode)
  
  // Base rest periods in seconds
  const restPeriods = {
    short: { skill: 60, strength: 90, accessory: 45 },
    moderate: { skill: 90, strength: 120, accessory: 60 },
    long: { skill: 120, strength: 180, accessory: 90 },
  }
  
  return restPeriods[rules.restBias][exerciseCategory]
}
