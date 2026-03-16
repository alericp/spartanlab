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

// =============================================================================
// ENVELOPE-REFINED STYLE PARAMETERS
// =============================================================================

import type { PerformanceEnvelope } from './performance-envelope-engine'
import type { MovementFamily } from './movement-family-registry'

/**
 * Refined style parameters that combine training style preferences
 * with learned performance envelope data
 */
export interface EnvelopeRefinedStyleParams {
  // Base style
  styleMode: TrainingStyleMode
  
  // Envelope-refined rep range (overrides style if confident)
  repRangeMin: number
  repRangeMax: number
  repRangeSource: 'style' | 'envelope' | 'blended'
  
  // Envelope-refined volume (overrides style if confident)
  weeklyVolumeMin: number
  weeklyVolumeMax: number
  volumeSource: 'style' | 'envelope' | 'blended'
  
  // Envelope-refined density
  densityPreference: 'low' | 'moderate' | 'high'
  densitySource: 'style' | 'envelope' | 'blended'
  
  // Envelope-refined rest
  restSeconds: number
  restSource: 'style' | 'envelope' | 'blended'
  
  // Confidence in the refinement
  envelopeConfidence: number
  
  // Explanation for the athlete
  refinementNote: string
}

/**
 * Refine training style parameters using learned envelope data
 * Style provides the broad approach; envelope provides the athlete-specific dose
 */
export function refineStyleWithEnvelope(
  styleProfile: TrainingStyleProfile,
  envelope: PerformanceEnvelope | null,
  movementFamily: MovementFamily,
  exerciseCategory: 'skill' | 'strength' | 'accessory'
): EnvelopeRefinedStyleParams {
  const rules = getStyleProgrammingRules(styleProfile.styleMode)
  const baseRepRange = getRepRangeForStyle(styleProfile.styleMode, exerciseCategory)
  const baseRest = getRestPeriodForStyle(styleProfile.styleMode, exerciseCategory)
  const baseVolume = exerciseCategory === 'strength' 
    ? getRecommendedStrengthSets(styleProfile.styleMode, 4, 'pull')
    : { min: 6, max: 12 }
  
  // If no envelope or low confidence, use style defaults
  if (!envelope || envelope.confidenceScore < 0.3) {
    return {
      styleMode: styleProfile.styleMode,
      repRangeMin: baseRepRange.min,
      repRangeMax: baseRepRange.max,
      repRangeSource: 'style',
      weeklyVolumeMin: baseVolume.min,
      weeklyVolumeMax: baseVolume.max,
      volumeSource: 'style',
      densityPreference: rules.densityPreference,
      densitySource: 'style',
      restSeconds: baseRest,
      restSource: 'style',
      envelopeConfidence: envelope?.confidenceScore || 0,
      refinementNote: 'Using style defaults. More training data will enable personalization.',
    }
  }
  
  // Blend style and envelope data based on confidence
  const confidence = envelope.confidenceScore
  const blendFactor = Math.min(confidence, 0.7) // Cap envelope influence at 70%
  
  // Rep range: blend if envelope has rep zone confidence
  let repRangeMin = baseRepRange.min
  let repRangeMax = baseRepRange.max
  let repRangeSource: 'style' | 'envelope' | 'blended' = 'style'
  
  if (envelope.repZoneConfidence > 0.4) {
    // Strong envelope signal - use it
    repRangeMin = Math.round(
      baseRepRange.min * (1 - blendFactor) + envelope.preferredRepRangeMin * blendFactor
    )
    repRangeMax = Math.round(
      baseRepRange.max * (1 - blendFactor) + envelope.preferredRepRangeMax * blendFactor
    )
    repRangeSource = confidence > 0.6 ? 'envelope' : 'blended'
  }
  
  // Weekly volume: blend if envelope has volume confidence
  let weeklyVolumeMin = baseVolume.min
  let weeklyVolumeMax = baseVolume.max
  let volumeSource: 'style' | 'envelope' | 'blended' = 'style'
  
  if (envelope.weeklyVolumeConfidence > 0.4) {
    weeklyVolumeMin = Math.round(
      baseVolume.min * (1 - blendFactor) + envelope.preferredWeeklyVolumeMin * blendFactor
    )
    weeklyVolumeMax = Math.round(
      baseVolume.max * (1 - blendFactor) + envelope.preferredWeeklyVolumeMax * blendFactor
    )
    volumeSource = confidence > 0.6 ? 'envelope' : 'blended'
  }
  
  // Density: use envelope if confident
  let densityPreference = rules.densityPreference
  let densitySource: 'style' | 'envelope' | 'blended' = 'style'
  
  if (envelope.densityConfidence > 0.4) {
    // Map envelope density to style density
    densityPreference = envelope.preferredDensityLevel === 'high_density' ? 'high' :
                        envelope.preferredDensityLevel === 'low_density' ? 'low' : 'moderate'
    densitySource = confidence > 0.6 ? 'envelope' : 'blended'
  }
  
  // Rest: adjust based on density tolerance
  let restSeconds = baseRest
  let restSource: 'style' | 'envelope' | 'blended' = 'style'
  
  if (envelope.densityConfidence > 0.4) {
    if (envelope.densityTolerance === 'poor') {
      restSeconds = Math.round(baseRest * 1.2) // More rest needed
      restSource = 'blended'
    } else if (envelope.densityTolerance === 'good') {
      restSeconds = Math.round(baseRest * 0.85) // Can handle less rest
      restSource = 'blended'
    }
  }
  
  // Generate refinement note
  const notes: string[] = []
  if (repRangeSource !== 'style') {
    notes.push(`Rep range adjusted to ${repRangeMin}-${repRangeMax} based on your response data`)
  }
  if (volumeSource !== 'style') {
    notes.push(`Volume tuned to ${weeklyVolumeMin}-${weeklyVolumeMax} weekly sets`)
  }
  if (densitySource !== 'style') {
    notes.push(`Density preference: ${densityPreference}`)
  }
  
  return {
    styleMode: styleProfile.styleMode,
    repRangeMin,
    repRangeMax,
    repRangeSource,
    weeklyVolumeMin,
    weeklyVolumeMax,
    volumeSource,
    densityPreference,
    densitySource,
    restSeconds,
    restSource,
    envelopeConfidence: confidence,
    refinementNote: notes.length > 0 
      ? notes.join('. ') + '.'
      : `${STYLE_MODE_DEFINITIONS[styleProfile.styleMode].label} style with standard parameters.`,
  }
}

/**
 * Generate explainable coaching note for envelope-refined parameters
 */
export function generateEnvelopeRefinementInsight(
  styleProfile: TrainingStyleProfile,
  refinedParams: EnvelopeRefinedStyleParams,
  movementFamily: MovementFamily
): string {
  const familyLabel = movementFamily.replace(/_/g, ' ')
  const styleLabel = STYLE_MODE_DEFINITIONS[styleProfile.styleMode].label
  
  if (refinedParams.envelopeConfidence < 0.3) {
    return `Using ${styleLabel} defaults for ${familyLabel}. Continue logging to personalize.`
  }
  
  if (refinedParams.envelopeConfidence < 0.5) {
    return `${styleLabel} style with early personalization for ${familyLabel}: ${refinedParams.repRangeMin}-${refinedParams.repRangeMax} reps, ${refinedParams.weeklyVolumeMin}-${refinedParams.weeklyVolumeMax} weekly sets.`
  }
  
  // High confidence - provide detailed insight
  const insights: string[] = []
  
  if (refinedParams.repRangeSource !== 'style') {
    insights.push(`You respond best to ${refinedParams.repRangeMin}-${refinedParams.repRangeMax} reps`)
  }
  
  if (refinedParams.volumeSource !== 'style') {
    insights.push(`${refinedParams.weeklyVolumeMin}-${refinedParams.weeklyVolumeMax} weekly sets is your productive range`)
  }
  
  if (refinedParams.densitySource !== 'style' && refinedParams.densityPreference !== 'moderate') {
    const densityNote = refinedParams.densityPreference === 'low' 
      ? 'more rest between sets helps your progress'
      : 'you handle higher-density work well'
    insights.push(densityNote)
  }
  
  if (insights.length === 0) {
    return `${styleLabel} programming is well-suited for your ${familyLabel} response patterns.`
  }
  
  return `For ${familyLabel}: ${insights.join(', ')}.`
}

// =============================================================================
// ADVANCED/COMBO METHODS
// =============================================================================

export type ComboMethod = 
  | 'skill_combo'      // muscle-up → dip, front lever → pull-up
  | 'contrast_method'  // heavy → explosive pairs
  | 'density_block'    // circuit-style work
  | 'transition_drill' // movement transition practice

export interface ComboBlock {
  method: ComboMethod
  exercises: string[]
  description: string
  restBetweenExercises: number
  restAfterBlock: number
  rounds: number
}

/**
 * Get available combo methods based on style and skill level
 */
export function getAvailableComboMethods(
  styleMode: TrainingStyleMode,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  primarySkill?: string
): ComboMethod[] {
  const methods: ComboMethod[] = []
  
  // All styles can use skill combos at intermediate+
  if (skillLevel !== 'beginner') {
    methods.push('skill_combo')
  }
  
  // Style-specific methods
  switch (styleMode) {
    case 'strength_focused':
    case 'power_focused':
      if (skillLevel !== 'beginner') {
        methods.push('contrast_method')
      }
      break
    case 'endurance_focused':
      methods.push('density_block')
      break
    case 'skill_focused':
      if (skillLevel === 'advanced') {
        methods.push('transition_drill')
      }
      break
  }
  
  return methods
}

/**
 * Get combo blocks for a skill
 */
export function getComboBlocksForSkill(
  skill: string,
  styleMode: TrainingStyleMode,
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
): ComboBlock[] {
  const blocks: ComboBlock[] = []
  const availableMethods = getAvailableComboMethods(styleMode, skillLevel, skill)
  
  // Skill-specific combo definitions
  const SKILL_COMBOS: Record<string, ComboBlock[]> = {
    muscle_up: [
      {
        method: 'skill_combo',
        exercises: ['muscle_up', 'straight_bar_dip'],
        description: 'Muscle-up to straight bar dip combo for transition practice',
        restBetweenExercises: 0,
        restAfterBlock: 120,
        rounds: 3,
      },
      {
        method: 'contrast_method',
        exercises: ['weighted_pull_up', 'explosive_pull_up'],
        description: 'Heavy pull followed by explosive pull for power development',
        restBetweenExercises: 15,
        restAfterBlock: 180,
        rounds: 4,
      },
    ],
    front_lever: [
      {
        method: 'skill_combo',
        exercises: ['front_lever_hold', 'pull_up'],
        description: 'Front lever hold into pull-up for integrated strength',
        restBetweenExercises: 0,
        restAfterBlock: 120,
        rounds: 3,
      },
      {
        method: 'skill_combo',
        exercises: ['front_lever_row', 'front_lever_negative'],
        description: 'Row to negative for time under tension',
        restBetweenExercises: 5,
        restAfterBlock: 90,
        rounds: 4,
      },
    ],
    planche: [
      {
        method: 'skill_combo',
        exercises: ['planche_lean', 'pseudo_planche_push_up'],
        description: 'Planche lean into push-up for integrated pressing',
        restBetweenExercises: 0,
        restAfterBlock: 120,
        rounds: 3,
      },
      {
        method: 'transition_drill',
        exercises: ['tuck_planche', 'straddle_planche', 'tuck_planche'],
        description: 'Planche position transitions',
        restBetweenExercises: 0,
        restAfterBlock: 180,
        rounds: 2,
      },
    ],
    handstand_push_up: [
      {
        method: 'contrast_method',
        exercises: ['pike_push_up_weighted', 'pike_push_up_explosive'],
        description: 'Weighted pike to explosive pike for pressing power',
        restBetweenExercises: 15,
        restAfterBlock: 150,
        rounds: 3,
      },
    ],
    iron_cross: [
      {
        method: 'skill_combo',
        exercises: ['ring_support_hold', 'ring_turn_out'],
        description: 'Ring support to RTO for stability conditioning',
        restBetweenExercises: 0,
        restAfterBlock: 120,
        rounds: 3,
      },
      {
        method: 'skill_combo',
        exercises: ['cross_pull', 'ring_fly_negative'],
        description: 'Cross pulls with controlled fly negatives for tendon conditioning',
        restBetweenExercises: 10,
        restAfterBlock: 180,
        rounds: 2,
      },
    ],
    back_lever: [
      {
        method: 'skill_combo',
        exercises: ['back_lever_hold', 'skin_the_cat'],
        description: 'Back lever hold into skin the cat for shoulder mobility',
        restBetweenExercises: 0,
        restAfterBlock: 120,
        rounds: 3,
      },
      {
        method: 'skill_combo',
        exercises: ['german_hang', 'back_lever_negative'],
        description: 'German hang into back lever negative for eccentric strength',
        restBetweenExercises: 5,
        restAfterBlock: 150,
        rounds: 3,
      },
    ],
    l_sit: [
      {
        method: 'density_block',
        exercises: ['l_sit_hold', 'leg_raise', 'v_up'],
        description: 'Compression density circuit for core endurance',
        restBetweenExercises: 5,
        restAfterBlock: 60,
        rounds: 3,
      },
      {
        method: 'skill_combo',
        exercises: ['l_sit_hold', 'tuck_to_l_sit'],
        description: 'L-sit hold into tuck transitions for control',
        restBetweenExercises: 0,
        restAfterBlock: 90,
        rounds: 4,
      },
    ],
  }
  
  const skillCombos = SKILL_COMBOS[skill] || []
  
  // Filter by available methods
  for (const combo of skillCombos) {
    if (availableMethods.includes(combo.method)) {
      blocks.push(combo)
    }
  }
  
  return blocks
}

// =============================================================================
// EQUIPMENT-STYLE INTEGRATION
// =============================================================================

export interface StyleEquipmentRecommendation {
  styleMode: TrainingStyleMode
  equipment: string[]
  recommendedExercises: string[]
  excludedExercises: string[]
}

/**
 * Get equipment-appropriate exercises for a style
 */
export function getStyleEquipmentExercises(
  styleMode: TrainingStyleMode,
  availableEquipment: string[],
  category: 'strength' | 'accessory' | 'conditioning'
): string[] {
  const hasWeights = availableEquipment.some(e => 
    ['dumbbells', 'barbell', 'weight_plates', 'weight_belt'].includes(e)
  )
  const hasPullBar = availableEquipment.includes('pull_bar')
  const hasDipBars = availableEquipment.includes('dip_bars')
  const hasRings = availableEquipment.includes('rings')
  const hasBench = availableEquipment.includes('bench')
  const hasResistanceBands = availableEquipment.includes('resistance_bands')
  
  const exercises: string[] = []
  const rules = getStyleProgrammingRules(styleMode)
  
  if (category === 'strength') {
    // Pull exercises
    if (hasPullBar) {
      exercises.push('pull_up')
      if (rules.preferWeightedVariants && hasWeights) {
        exercises.push('weighted_pull_up')
      }
      if (rules.preferExplosiveVariants) {
        exercises.push('explosive_pull_up', 'chest_to_bar_pull_up')
      }
    }
    if (hasRings) {
      exercises.push('ring_row', 'ring_pull_up')
    }
    
    // Push exercises
    if (hasDipBars) {
      exercises.push('dip')
      if (rules.preferWeightedVariants && hasWeights) {
        exercises.push('weighted_dip')
      }
    }
    exercises.push('push_up')
    if (rules.preferWeightedVariants && hasWeights) {
      exercises.push('weighted_push_up')
    }
    if (rules.preferExplosiveVariants) {
      exercises.push('clap_push_up', 'explosive_push_up')
    }
  }
  
  if (category === 'accessory') {
    // Style-appropriate accessories
    if (styleMode === 'hypertrophy_supported' || rules.hypertrophyAccessoriesPerSession > 0) {
      if (hasWeights) {
        exercises.push('spider_curl', 'incline_curl', 'hammer_curl')
        if (hasBench) {
          exercises.push('incline_bench_press', 'incline_db_press')
        }
        exercises.push('seated_row', 'low_angle_row')
      }
      if (hasDipBars) {
        exercises.push('straight_bar_dip')
      }
      if (hasResistanceBands) {
        exercises.push('band_curl', 'band_face_pull', 'band_pull_apart')
      }
    }
  }
  
  if (category === 'conditioning') {
    if (rules.includeConditioningWork) {
      exercises.push('burpee', 'mountain_climber', 'jumping_jack')
      if (hasPullBar) {
        exercises.push('pull_up_ladder')
      }
      if (hasDipBars) {
        exercises.push('dip_ladder')
      }
    }
  }
  
  return exercises
}

// =============================================================================
// PERFORMANCE ENVELOPE INTEGRATION
// =============================================================================

/**
 * Refine style programming based on performance envelope data
 */
export function refineStyleWithEnvelope(
  styleMode: TrainingStyleMode,
  envelopeData: {
    optimalRepRange?: { min: number; max: number }
    volumeTolerance?: 'low' | 'moderate' | 'high'
    fatigueSensitivity?: 'low' | 'moderate' | 'high'
    responseToIntensity?: 'poor' | 'moderate' | 'good'
  }
): Partial<StyleProgrammingRules> {
  const refinements: Partial<StyleProgrammingRules> = {}
  const baseRules = getStyleProgrammingRules(styleMode)
  
  // Adjust rep range if envelope suggests different optimal
  if (envelopeData.optimalRepRange) {
    const { min, max } = envelopeData.optimalRepRange
    if (min >= 8) {
      refinements.repRangeBias = 'high'
    } else if (max <= 5) {
      refinements.repRangeBias = 'low'
    }
  }
  
  // Adjust volume based on tolerance
  if (envelopeData.volumeTolerance) {
    switch (envelopeData.volumeTolerance) {
      case 'low':
        refinements.strengthVolumeMultiplier = Math.max(0.7, baseRules.strengthVolumeMultiplier * 0.85)
        refinements.accessoryVolumeMultiplier = Math.max(0.5, baseRules.accessoryVolumeMultiplier * 0.8)
        break
      case 'high':
        refinements.strengthVolumeMultiplier = Math.min(1.4, baseRules.strengthVolumeMultiplier * 1.1)
        refinements.accessoryVolumeMultiplier = Math.min(1.6, baseRules.accessoryVolumeMultiplier * 1.15)
        break
    }
  }
  
  // Adjust density based on fatigue sensitivity
  if (envelopeData.fatigueSensitivity === 'high') {
    refinements.restBias = 'long'
    refinements.densityPreference = 'low'
  } else if (envelopeData.fatigueSensitivity === 'low' && styleMode !== 'strength_focused') {
    refinements.densityPreference = 'high'
  }
  
  // Adjust intensity preference
  if (envelopeData.responseToIntensity === 'poor' && baseRules.loadIntensityBias === 'heavy') {
    refinements.loadIntensityBias = 'moderate'
  } else if (envelopeData.responseToIntensity === 'good' && baseRules.loadIntensityBias === 'moderate') {
    refinements.loadIntensityBias = 'heavy'
  }
  
  return refinements
}

// =============================================================================
// PREREQUISITE SAFETY GATE
// =============================================================================

/**
 * CORE DESIGN PRINCIPLE: Style changes the method, NOT the prerequisites.
 * 
 * This function ensures that regardless of training style, all skill prerequisites
 * are preserved. Style affects HOW the athlete trains those prerequisites, not
 * WHETHER they are required.
 */

export interface PrerequisiteRequirement {
  category: string
  minRequired: boolean
  styleAdjustment: 'method_only' | 'volume_adjust' | 'intensity_adjust'
}

/**
 * Skill-to-prerequisite mapping - these are NON-NEGOTIABLE regardless of style
 */
export const SKILL_PREREQUISITES: Record<string, PrerequisiteRequirement[]> = {
  front_lever: [
    { category: 'compression_strength', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'scapular_control', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'straight_arm_pull_strength', minRequired: true, styleAdjustment: 'intensity_adjust' },
    { category: 'core_control', minRequired: true, styleAdjustment: 'volume_adjust' },
  ],
  planche: [
    { category: 'wrist_tolerance', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'straight_arm_push_strength', minRequired: true, styleAdjustment: 'intensity_adjust' },
    { category: 'shoulder_stability', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'core_control', minRequired: true, styleAdjustment: 'volume_adjust' },
  ],
  muscle_up: [
    { category: 'explosive_pull_power', minRequired: true, styleAdjustment: 'intensity_adjust' },
    { category: 'transition_strength', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'pull_strength', minRequired: true, styleAdjustment: 'intensity_adjust' },
    { category: 'push_strength', minRequired: true, styleAdjustment: 'intensity_adjust' },
  ],
  iron_cross: [
    { category: 'straight_arm_push_strength', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'shoulder_stability', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'scapular_control', minRequired: true, styleAdjustment: 'method_only' },
    // Tendon tolerance is critical - no style can rush this
    { category: 'tendon_tolerance', minRequired: true, styleAdjustment: 'method_only' },
  ],
  back_lever: [
    { category: 'shoulder_extension_mobility', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'straight_arm_pull_strength', minRequired: true, styleAdjustment: 'intensity_adjust' },
    { category: 'core_control', minRequired: true, styleAdjustment: 'volume_adjust' },
  ],
  handstand_push_up: [
    { category: 'vertical_push_strength', minRequired: true, styleAdjustment: 'intensity_adjust' },
    { category: 'shoulder_stability', minRequired: true, styleAdjustment: 'method_only' },
    { category: 'balance_control', minRequired: true, styleAdjustment: 'volume_adjust' },
    { category: 'wrist_tolerance', minRequired: true, styleAdjustment: 'method_only' },
  ],
  l_sit: [
    { category: 'compression_strength', minRequired: true, styleAdjustment: 'volume_adjust' },
    { category: 'core_control', minRequired: true, styleAdjustment: 'volume_adjust' },
    { category: 'shoulder_stability', minRequired: true, styleAdjustment: 'method_only' },
  ],
}

/**
 * Validate that a style mode doesn't skip required prerequisites for a skill
 * 
 * Style changes HOW we train prerequisites, not WHETHER they're included.
 * Returns adjustments that respect both style preferences AND prerequisite requirements.
 */
export function validateStylePrerequisites(
  skill: string,
  styleMode: TrainingStyleMode,
  currentConstraints: string[]
): {
  preservedPrerequisites: string[]
  styleMethodAdjustments: Map<string, string>
  coachingNote: string
} {
  const prerequisites = SKILL_PREREQUISITES[skill] || []
  const preservedPrerequisites: string[] = []
  const styleMethodAdjustments = new Map<string, string>()
  const rules = getStyleProgrammingRules(styleMode)
  
  for (const prereq of prerequisites) {
    // All prerequisites are preserved regardless of style
    preservedPrerequisites.push(prereq.category)
    
    // Style determines HOW we train each prerequisite
    let method = 'standard'
    
    switch (prereq.styleAdjustment) {
      case 'method_only':
        // Prerequisite method is fixed - style cannot change it
        method = 'fixed'
        break
      case 'volume_adjust':
        // Style can adjust volume for this prerequisite
        if (rules.skillExposureMultiplier > 1.1) {
          method = 'high_frequency_low_intensity'
        } else if (rules.strengthVolumeMultiplier > 1.1) {
          method = 'moderate_frequency_high_intensity'
        } else {
          method = 'balanced'
        }
        break
      case 'intensity_adjust':
        // Style can adjust intensity for this prerequisite
        if (rules.loadIntensityBias === 'heavy') {
          method = 'low_rep_high_load'
        } else if (rules.loadIntensityBias === 'light') {
          method = 'high_rep_endurance'
        } else {
          method = 'moderate_intensity'
        }
        break
    }
    
    styleMethodAdjustments.set(prereq.category, method)
  }
  
  // Generate coaching note
  const styleLabel = STYLE_MODE_DEFINITIONS[styleMode].label
  const skillLabel = skill.replace(/_/g, ' ')
  const coachingNote = `${styleLabel} approach for ${skillLabel}: All ${preservedPrerequisites.length} prerequisites preserved. Style affects training method, not requirements.`
  
  return {
    preservedPrerequisites,
    styleMethodAdjustments,
    coachingNote,
  }
}

/**
 * Check if a style-based volume adjustment is safe for tendon-sensitive work
 * 
 * Even aggressive styles must respect tendon recovery limits.
 */
export function isSafeForTendonWork(
  styleMode: TrainingStyleMode,
  movementFamily: string,
  currentWeeklyVolume: number,
  fatigueLevel: 'fresh' | 'normal' | 'fatigued' | 'overtrained'
): {
  isSafe: boolean
  maxAllowedVolume: number
  recommendation: string
} {
  const rules = getStyleProgrammingRules(styleMode)
  
  // Tendon-sensitive movement families
  const TENDON_SENSITIVE = ['straight_arm_pull', 'straight_arm_push', 'rings_stability', 'rings_strength']
  
  if (!TENDON_SENSITIVE.includes(movementFamily)) {
    return {
      isSafe: true,
      maxAllowedVolume: 999, // No limit
      recommendation: 'Movement family is not tendon-sensitive.',
    }
  }
  
  // Base tendon volume limits (weekly sets)
  const BASE_TENDON_LIMITS: Record<string, number> = {
    straight_arm_pull: 12,
    straight_arm_push: 10,
    rings_stability: 15,
    rings_strength: 8,
  }
  
  // Fatigue-based multiplier
  const fatigueMultiplier = {
    fresh: 1.2,
    normal: 1.0,
    fatigued: 0.7,
    overtrained: 0.4,
  }
  
  // Style can NOT increase tendon limits - only potentially decrease
  const styleMultiplier = rules.densityPreference === 'high' ? 0.85 : 1.0
  
  const baseLimit = BASE_TENDON_LIMITS[movementFamily] || 10
  const adjustedLimit = Math.floor(baseLimit * fatigueMultiplier[fatigueLevel] * styleMultiplier)
  
  const isSafe = currentWeeklyVolume <= adjustedLimit
  
  let recommendation = ''
  if (!isSafe) {
    recommendation = `${movementFamily.replace(/_/g, ' ')} volume (${currentWeeklyVolume}) exceeds safe limit (${adjustedLimit}). Reduce to protect tendons.`
  } else if (currentWeeklyVolume > adjustedLimit * 0.85) {
    recommendation = `Approaching tendon volume limit. Monitor for joint discomfort.`
  } else {
    recommendation = `Volume within safe tendon tolerance.`
  }
  
  return {
    isSafe,
    maxAllowedVolume: adjustedLimit,
    recommendation,
  }
}

// =============================================================================
// STYLE SUMMARY/EXPLANATION
// =============================================================================

/**
 * Generate coaching summary explaining the style bias
 */
export function getStyleCoachingSummary(
  styleMode: TrainingStyleMode,
  primarySkill?: string,
  constraint?: string
): string {
  const definition = STYLE_MODE_DEFINITIONS[styleMode]
  
  const skillText = primarySkill 
    ? ` for ${primarySkill.replace(/_/g, ' ')}` 
    : ''
  
  const constraintText = constraint
    ? ` while prioritizing ${constraint.replace(/_/g, ' ')}`
    : ''
  
  switch (styleMode) {
    case 'skill_focused':
      return `Your program uses a skill-focused approach${skillText}${constraintText}. High-frequency exposures with quality emphasis.`
    case 'strength_focused':
      return `Your program uses a strength-focused approach${skillText}${constraintText}. Heavier loading with lower reps for maximal strength.`
    case 'power_focused':
      return `Your program uses a power-focused approach${skillText}${constraintText}. Explosive movements for dynamic strength.`
    case 'endurance_focused':
      return `Your program uses an endurance-focused approach${skillText}${constraintText}. Work capacity building with density protocols.`
    case 'hypertrophy_supported':
      return `Your program uses a hypertrophy-supported approach${skillText}${constraintText}. Skill-first with targeted accessory work for physique balance.`
    case 'balanced_hybrid':
    default:
      return `Your program uses a balanced approach${skillText}${constraintText}. Skill, strength, and accessory work in moderation.`
  }
}

// =============================================================================
// ENHANCED COACHING EXPLANATIONS
// =============================================================================

/**
 * Generate detailed style explanation for knowledge bubbles
 * These are premium, concise coaching insights.
 */
export interface StyleExplanation {
  headline: string
  details: string[]
  methodHighlight: string
  preservedElement: string
}

export function generateDetailedStyleExplanation(
  styleMode: TrainingStyleMode,
  skill: string,
  constraint?: string,
  envelopeConfidence?: number
): StyleExplanation {
  const definition = STYLE_MODE_DEFINITIONS[styleMode]
  const skillLabel = skill.replace(/_/g, ' ')
  const constraintLabel = constraint?.replace(/_/g, ' ')
  
  const explanations: Record<TrainingStyleMode, StyleExplanation> = {
    skill_focused: {
      headline: `Skill-Focused Training for ${skillLabel}`,
      details: [
        'High-frequency practice with lower fatigue per session',
        'Quality over intensity - perfect reps build skill faster',
        'Repeated exposure cements motor patterns',
        constraintLabel ? `Prioritizing ${constraintLabel} to unlock progress` : '',
      ].filter(Boolean),
      methodHighlight: 'Frequent low-fatigue skill exposures with quality emphasis',
      preservedElement: 'All strength prerequisites maintained with skill-biased methods',
    },
    strength_focused: {
      headline: `Strength-Focused Training for ${skillLabel}`,
      details: [
        'Heavier loading with lower rep ranges for maximal strength',
        'Weighted calisthenics emphasized where equipment allows',
        'Longer rest periods for full neural recovery',
        constraintLabel ? `Building ${constraintLabel} through progressive overload` : '',
      ].filter(Boolean),
      methodHighlight: 'Lower reps, heavier loads, longer rest for maximal adaptation',
      preservedElement: 'Skill work maintained but strength qualities prioritized',
    },
    power_focused: {
      headline: `Power-Focused Training for ${skillLabel}`,
      details: [
        'Explosive movement emphasis for dynamic strength',
        'Quality speed reps with full recovery between sets',
        'Plyometric and contrast methods where appropriate',
        constraintLabel ? `Developing explosive ${constraintLabel}` : '',
      ].filter(Boolean),
      methodHighlight: 'Explosive pulling and pushing with neural recovery focus',
      preservedElement: 'Base strength and skill prerequisites preserved',
    },
    endurance_focused: {
      headline: `Endurance/Density Training for ${skillLabel}`,
      details: [
        'Work capacity building through shorter rest periods',
        'Circuit and density blocks for repeat-effort tolerance',
        'Skill quality preserved for high-risk movements',
        constraintLabel ? `Building fatigue resistance in ${constraintLabel}` : '',
      ].filter(Boolean),
      methodHighlight: 'Density protocols with careful preservation of technique',
      preservedElement: 'Straight-arm and tendon-sensitive work kept conservative',
    },
    hypertrophy_supported: {
      headline: `Hypertrophy-Supported Training for ${skillLabel}`,
      details: [
        'Core skill work remains the primary focus',
        'Minimal high-ROI accessory work for muscle balance',
        'Physique support enhances both aesthetics and performance',
        constraintLabel ? `Supporting ${constraintLabel} through targeted hypertrophy` : '',
      ].filter(Boolean),
      methodHighlight: 'Skill-first programming with strategic accessory work',
      preservedElement: 'Calisthenics identity fully preserved - accessories are support only',
    },
    balanced_hybrid: {
      headline: `Balanced Training for ${skillLabel}`,
      details: [
        'Moderate distribution across skill, strength, and support work',
        'Adaptable approach that responds to your progress',
        'Well-rounded development without extreme bias',
        constraintLabel ? `Balanced attention to ${constraintLabel}` : '',
      ].filter(Boolean),
      methodHighlight: 'Moderate intensity, frequency, and accessory balance',
      preservedElement: 'All training qualities developed in proportion',
    },
  }
  
  const explanation = explanations[styleMode]
  
  // Add envelope confidence note if available
  if (envelopeConfidence !== undefined && envelopeConfidence > 0.5) {
    explanation.details.push('Personalized based on your training response data')
  }
  
  return explanation
}

/**
 * Generate short coaching note for UI display
 */
export function getShortStyleNote(styleMode: TrainingStyleMode): string {
  const notes: Record<TrainingStyleMode, string> = {
    skill_focused: 'High-frequency practice, quality emphasis',
    strength_focused: 'Heavier loading, lower reps',
    power_focused: 'Explosive movements, dynamic strength',
    endurance_focused: 'Work capacity, density protocols',
    hypertrophy_supported: 'Skill-first with targeted accessories',
    balanced_hybrid: 'Moderate distribution, adaptable approach',
  }
  return notes[styleMode]
}

/**
 * Generate style-specific rep scheme description
 */
export function getStyleRepSchemeNote(styleMode: TrainingStyleMode): string {
  const notes: Record<TrainingStyleMode, string> = {
    skill_focused: '5-8 reps for strength work, hold durations for skill',
    strength_focused: '3-6 reps for primary lifts, 6-10 for support',
    power_focused: '1-5 explosive reps with full recovery',
    endurance_focused: '8-15 reps, shorter rest, density emphasis',
    hypertrophy_supported: '6-12 reps, moderate rest, accessory focus',
    balanced_hybrid: '5-10 reps, balanced rest periods',
  }
  return notes[styleMode]
}
