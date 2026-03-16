/**
 * Coaching Framework Selection Engine
 * 
 * Selects proven training methodologies based on athlete data and goals.
 * Frameworks guide how workouts are structured without replacing the program generator.
 * 
 * DESIGN PHILOSOPHY:
 * - Elite coaching frameworks + deterministic logic + athlete data
 * - Frameworks are stable - only change on meaningful athlete signals
 * - Integrates with TrainingStyleProfile, not replaces it
 * - Enhances program generation with methodology-specific parameters
 */

import type { TrainingStyleMode } from './training-style-service'
import type { SkillKey } from './skill-state-service'
import type { ExperienceLevel } from './program-service'

// =============================================================================
// COACHING FRAMEWORK TYPES
// =============================================================================

export type CoachingFrameworkId =
  | 'skill_frequency'
  | 'barseagle_strength'
  | 'strength_conversion'
  | 'density_endurance'
  | 'hypertrophy_supported'
  | 'tendon_conservative'
  | 'balanced_hybrid'

export type ProgressionMethod =
  | 'greasing_the_groove'  // High frequency, low fatigue
  | 'linear_periodization' // Progressive overload
  | 'undulating'           // Daily/weekly variation
  | 'conjugate'            // Max effort + dynamic effort
  | 'block_periodization'  // Phase-focused blocks
  | 'autoregulated'        // RPE/fatigue-based

export type SkillTypeTarget =
  | 'handstand'
  | 'front_lever'
  | 'back_lever'
  | 'planche'
  | 'muscle_up'
  | 'iron_cross'
  | 'l_sit'
  | 'v_sit'
  | 'weighted_pull'
  | 'weighted_dip'
  | 'general_calisthenics'

export interface CoachingFramework {
  frameworkId: CoachingFrameworkId
  frameworkName: string
  description: string
  
  // Bias factors (0-100, higher = more emphasis)
  primaryGoalBias: Record<string, number>   // Goal type -> bias
  styleBias: Record<TrainingStyleMode, number>
  
  // Training parameters
  skillFrequencyBias: 'low' | 'moderate' | 'high' | 'very_high'
  strengthBias: 'minimal' | 'low' | 'moderate' | 'high'
  densityBias: 'low' | 'moderate' | 'high'
  volumeBias: 'low' | 'moderate' | 'high'
  tendonSafetyBias: 'standard' | 'conservative' | 'very_conservative'
  
  // Methodology
  progressionMethod: ProgressionMethod
  
  // Target audience
  recommendedSkillTypes: SkillTypeTarget[]
  recommendedExperienceLevels: ExperienceLevel[]
  
  // Programming rules
  rules: FrameworkRules
  
  // Metadata
  inspirationSource: string
  bestFor: string[]
  notRecommendedFor: string[]
}

export interface FrameworkRules {
  // Set/rep structure
  preferredRepRangeMin: number
  preferredRepRangeMax: number
  preferredSetRangeMin: number
  preferredSetRangeMax: number
  
  // Rest intervals
  restSecondsMin: number
  restSecondsMax: number
  
  // Volume control
  maxWeeklySkillSets: number
  maxWeeklyStrengthSets: number
  accessorySetsPerSession: number
  
  // Frequency
  skillExposuresPerWeek: number
  strengthSessionsPerWeek: number
  
  // Intensity
  targetRPERange: [number, number]
  allowFailure: boolean
  
  // Deload
  deloadFrequencyWeeks: number
  deloadVolumeReduction: number
  
  // Special rules
  warmupSetsRequired: number
  backoffSetRequired: boolean
  supersetAllowed: boolean
  circuitAllowed: boolean
}

// =============================================================================
// FRAMEWORK REGISTRY
// =============================================================================

export const COACHING_FRAMEWORKS: Record<CoachingFrameworkId, CoachingFramework> = {
  // ---------------------------------------------------------------------------
  // SKILL FREQUENCY FRAMEWORK
  // Inspired by: Gymnastics-style skill acquisition
  // ---------------------------------------------------------------------------
  skill_frequency: {
    frameworkId: 'skill_frequency',
    frameworkName: 'Skill Frequency',
    description: 'High-frequency skill exposures with low fatigue sessions. Optimized for motor learning and technique acquisition.',
    
    primaryGoalBias: {
      handstand: 90,
      front_lever: 70,
      planche: 60,
      muscle_up: 75,
      l_sit: 80,
      general_strength: 40,
    },
    styleBias: {
      skill_focused: 95,
      strength_focused: 40,
      power_focused: 50,
      endurance_focused: 30,
      hypertrophy_supported: 25,
      balanced_hybrid: 60,
    },
    
    skillFrequencyBias: 'very_high',
    strengthBias: 'moderate',
    densityBias: 'low',
    volumeBias: 'moderate',
    tendonSafetyBias: 'standard',
    
    progressionMethod: 'greasing_the_groove',
    
    recommendedSkillTypes: ['handstand', 'front_lever', 'planche', 'l_sit', 'v_sit', 'muscle_up'],
    recommendedExperienceLevels: ['beginner', 'intermediate'],
    
    rules: {
      preferredRepRangeMin: 3,
      preferredRepRangeMax: 8,
      preferredSetRangeMin: 3,
      preferredSetRangeMax: 5,
      restSecondsMin: 90,
      restSecondsMax: 180,
      maxWeeklySkillSets: 25,
      maxWeeklyStrengthSets: 15,
      accessorySetsPerSession: 2,
      skillExposuresPerWeek: 4,
      strengthSessionsPerWeek: 3,
      targetRPERange: [6, 8],
      allowFailure: false,
      deloadFrequencyWeeks: 5,
      deloadVolumeReduction: 0.4,
      warmupSetsRequired: 2,
      backoffSetRequired: false,
      supersetAllowed: true,
      circuitAllowed: false,
    },
    
    inspirationSource: 'Gymnastics-style skill acquisition',
    bestFor: ['Beginners learning new skills', 'Handstand development', 'Technique-focused athletes'],
    notRecommendedFor: ['Athletes prioritizing maximal strength', 'Those seeking density/conditioning'],
  },

  // ---------------------------------------------------------------------------
  // BARSEAGLE STRENGTH FRAMEWORK
  // Inspired by: Ian Barseagle weighted calisthenics methodology
  // ---------------------------------------------------------------------------
  barseagle_strength: {
    frameworkId: 'barseagle_strength',
    frameworkName: 'Heavy Pulling Strength',
    description: '2 warm-up sets + 2 working sets approach. Heavy first set, higher-rep back-off set. ~5 minute rest for maximal neural strength.',
    
    primaryGoalBias: {
      weighted_pull: 95,
      weighted_dip: 90,
      front_lever: 80,
      muscle_up: 85,
      general_strength: 85,
      handstand: 40,
    },
    styleBias: {
      skill_focused: 40,
      strength_focused: 95,
      power_focused: 70,
      endurance_focused: 20,
      hypertrophy_supported: 60,
      balanced_hybrid: 65,
    },
    
    skillFrequencyBias: 'low',
    strengthBias: 'high',
    densityBias: 'low',
    volumeBias: 'low',
    tendonSafetyBias: 'standard',
    
    progressionMethod: 'linear_periodization',
    
    recommendedSkillTypes: ['weighted_pull', 'weighted_dip', 'front_lever', 'muscle_up'],
    recommendedExperienceLevels: ['intermediate', 'advanced'],
    
    rules: {
      preferredRepRangeMin: 3,
      preferredRepRangeMax: 6,
      preferredSetRangeMin: 2,
      preferredSetRangeMax: 4,
      restSecondsMin: 240,
      restSecondsMax: 300,
      maxWeeklySkillSets: 12,
      maxWeeklyStrengthSets: 16,
      accessorySetsPerSession: 3,
      skillExposuresPerWeek: 2,
      strengthSessionsPerWeek: 3,
      targetRPERange: [8, 9.5],
      allowFailure: false, // Stop before failure for neural work
      deloadFrequencyWeeks: 4,
      deloadVolumeReduction: 0.5,
      warmupSetsRequired: 2,
      backoffSetRequired: true, // Key: back-off set after heavy
      supersetAllowed: false, // Keep rest pure
      circuitAllowed: false,
    },
    
    inspirationSource: 'Ian Barseagle weighted calisthenics methodology',
    bestFor: ['Weighted pull-ups', 'Weighted dips', 'Maximal strength development', 'Advanced pulling strength'],
    notRecommendedFor: ['Pure beginners', 'Endurance-focused athletes', 'Time-constrained sessions'],
  },

  // ---------------------------------------------------------------------------
  // STRENGTH CONVERSION FRAMEWORK
  // Inspired by: Weighted calisthenics strength transfer systems
  // ---------------------------------------------------------------------------
  strength_conversion: {
    frameworkId: 'strength_conversion',
    frameworkName: 'Strength Conversion',
    description: 'Heavy compound pulling/pushing with lower rep ranges. Strength converts to skill progress through neural and structural adaptation.',
    
    primaryGoalBias: {
      front_lever: 90,
      muscle_up: 85,
      weighted_pull: 85,
      planche: 75,
      general_strength: 80,
      handstand: 50,
    },
    styleBias: {
      skill_focused: 55,
      strength_focused: 90,
      power_focused: 65,
      endurance_focused: 25,
      hypertrophy_supported: 55,
      balanced_hybrid: 70,
    },
    
    skillFrequencyBias: 'moderate',
    strengthBias: 'high',
    densityBias: 'low',
    volumeBias: 'moderate',
    tendonSafetyBias: 'standard',
    
    progressionMethod: 'undulating',
    
    recommendedSkillTypes: ['front_lever', 'muscle_up', 'weighted_pull', 'weighted_dip', 'planche'],
    recommendedExperienceLevels: ['intermediate', 'advanced', 'elite'],
    
    rules: {
      preferredRepRangeMin: 3,
      preferredRepRangeMax: 6,
      preferredSetRangeMin: 3,
      preferredSetRangeMax: 5,
      restSecondsMin: 180,
      restSecondsMax: 240,
      maxWeeklySkillSets: 18,
      maxWeeklyStrengthSets: 20,
      accessorySetsPerSession: 2,
      skillExposuresPerWeek: 3,
      strengthSessionsPerWeek: 3,
      targetRPERange: [7, 9],
      allowFailure: false,
      deloadFrequencyWeeks: 4,
      deloadVolumeReduction: 0.4,
      warmupSetsRequired: 2,
      backoffSetRequired: true,
      supersetAllowed: true,
      circuitAllowed: false,
    },
    
    inspirationSource: 'Weighted calisthenics strength transfer systems',
    bestFor: ['Front lever progression', 'Muscle-up development', 'Athletes who respond to heavy loading'],
    notRecommendedFor: ['Pure beginners', 'Endurance-focused athletes'],
  },

  // ---------------------------------------------------------------------------
  // DENSITY ENDURANCE FRAMEWORK
  // Inspired by: OTZ-style endurance training
  // ---------------------------------------------------------------------------
  density_endurance: {
    frameworkId: 'density_endurance',
    frameworkName: 'Density Endurance',
    description: 'Circuits and density blocks for fatigue tolerance development. Higher volume with strategic rest compression.',
    
    primaryGoalBias: {
      general_strength: 70,
      muscle_up: 75,
      handstand: 50,
      front_lever: 55,
      weighted_pull: 45,
    },
    styleBias: {
      skill_focused: 35,
      strength_focused: 40,
      power_focused: 30,
      endurance_focused: 95,
      hypertrophy_supported: 50,
      balanced_hybrid: 65,
    },
    
    skillFrequencyBias: 'moderate',
    strengthBias: 'moderate',
    densityBias: 'high',
    volumeBias: 'high',
    tendonSafetyBias: 'standard',
    
    progressionMethod: 'autoregulated',
    
    recommendedSkillTypes: ['general_calisthenics', 'muscle_up'],
    recommendedExperienceLevels: ['intermediate', 'advanced'],
    
    rules: {
      preferredRepRangeMin: 6,
      preferredRepRangeMax: 15,
      preferredSetRangeMin: 3,
      preferredSetRangeMax: 5,
      restSecondsMin: 30,
      restSecondsMax: 90,
      maxWeeklySkillSets: 15,
      maxWeeklyStrengthSets: 24,
      accessorySetsPerSession: 3,
      skillExposuresPerWeek: 3,
      strengthSessionsPerWeek: 4,
      targetRPERange: [7, 8.5],
      allowFailure: true,
      deloadFrequencyWeeks: 4,
      deloadVolumeReduction: 0.5,
      warmupSetsRequired: 1,
      backoffSetRequired: false,
      supersetAllowed: true,
      circuitAllowed: true,
    },
    
    inspirationSource: 'OTZ-style endurance training',
    bestFor: ['Conditioning', 'Fatigue tolerance', 'Work capacity development'],
    notRecommendedFor: ['Maximal strength focus', 'Iron cross/advanced rings', 'Recovery-limited athletes'],
  },

  // ---------------------------------------------------------------------------
  // HYPERTROPHY SUPPORTED FRAMEWORK
  // Hybrid physique + calisthenics approach
  // ---------------------------------------------------------------------------
  hypertrophy_supported: {
    frameworkId: 'hypertrophy_supported',
    frameworkName: 'Hypertrophy Supported',
    description: 'Skill work remains primary with strategic hypertrophy accessory layer. Supports muscle balance, aesthetics, and joint resilience.',
    
    primaryGoalBias: {
      general_strength: 75,
      front_lever: 70,
      muscle_up: 70,
      weighted_pull: 80,
      planche: 65,
      handstand: 55,
    },
    styleBias: {
      skill_focused: 50,
      strength_focused: 65,
      power_focused: 40,
      endurance_focused: 45,
      hypertrophy_supported: 95,
      balanced_hybrid: 80,
    },
    
    skillFrequencyBias: 'moderate',
    strengthBias: 'moderate',
    densityBias: 'moderate',
    volumeBias: 'high',
    tendonSafetyBias: 'standard',
    
    progressionMethod: 'undulating',
    
    recommendedSkillTypes: ['front_lever', 'muscle_up', 'weighted_pull', 'weighted_dip', 'general_calisthenics'],
    recommendedExperienceLevels: ['intermediate', 'advanced'],
    
    rules: {
      preferredRepRangeMin: 6,
      preferredRepRangeMax: 12,
      preferredSetRangeMin: 3,
      preferredSetRangeMax: 4,
      restSecondsMin: 60,
      restSecondsMax: 120,
      maxWeeklySkillSets: 15,
      maxWeeklyStrengthSets: 18,
      accessorySetsPerSession: 4, // Higher accessory volume
      skillExposuresPerWeek: 3,
      strengthSessionsPerWeek: 3,
      targetRPERange: [7, 9],
      allowFailure: true,
      deloadFrequencyWeeks: 4,
      deloadVolumeReduction: 0.4,
      warmupSetsRequired: 1,
      backoffSetRequired: false,
      supersetAllowed: true,
      circuitAllowed: true,
    },
    
    inspirationSource: 'Hybrid physique + calisthenics systems',
    bestFor: ['Athletes wanting aesthetics + skills', 'Muscle balance', 'Joint resilience through muscle'],
    notRecommendedFor: ['Pure skill acquisition', 'Maximal strength only'],
  },

  // ---------------------------------------------------------------------------
  // TENDON CONSERVATIVE FRAMEWORK
  // Inspired by: Rings specialists and tendon adaptation systems
  // ---------------------------------------------------------------------------
  tendon_conservative: {
    frameworkId: 'tendon_conservative',
    frameworkName: 'Tendon Conservative',
    description: 'Slower progression with lower straight-arm volume. Mandatory joint protocols for advanced rings work.',
    
    primaryGoalBias: {
      iron_cross: 95,
      planche: 90,
      back_lever: 85,
      front_lever: 80,
      handstand: 60,
      general_strength: 50,
    },
    styleBias: {
      skill_focused: 70,
      strength_focused: 75,
      power_focused: 30,
      endurance_focused: 20,
      hypertrophy_supported: 40,
      balanced_hybrid: 55,
    },
    
    skillFrequencyBias: 'low',
    strengthBias: 'moderate',
    densityBias: 'low',
    volumeBias: 'low',
    tendonSafetyBias: 'very_conservative',
    
    progressionMethod: 'block_periodization',
    
    recommendedSkillTypes: ['iron_cross', 'planche', 'back_lever', 'front_lever'],
    recommendedExperienceLevels: ['advanced', 'elite'],
    
    rules: {
      preferredRepRangeMin: 3,
      preferredRepRangeMax: 5,
      preferredSetRangeMin: 2,
      preferredSetRangeMax: 4,
      restSecondsMin: 180,
      restSecondsMax: 300,
      maxWeeklySkillSets: 10, // Lower volume
      maxWeeklyStrengthSets: 12,
      accessorySetsPerSession: 2,
      skillExposuresPerWeek: 2, // Lower frequency
      strengthSessionsPerWeek: 2,
      targetRPERange: [6, 8],
      allowFailure: false, // Never failure
      deloadFrequencyWeeks: 3, // More frequent deloads
      deloadVolumeReduction: 0.5,
      warmupSetsRequired: 3, // Extra warmup
      backoffSetRequired: false,
      supersetAllowed: false,
      circuitAllowed: false,
    },
    
    inspirationSource: 'Rings specialists and tendon adaptation systems',
    bestFor: ['Iron cross development', 'Planche progression', 'Athletes with tendon concerns', 'Rings specialization'],
    notRecommendedFor: ['Beginners', 'High-volume seekers', 'Conditioning focus'],
  },

  // ---------------------------------------------------------------------------
  // BALANCED HYBRID FRAMEWORK
  // General-purpose adaptive framework
  // ---------------------------------------------------------------------------
  balanced_hybrid: {
    frameworkId: 'balanced_hybrid',
    frameworkName: 'Balanced Hybrid',
    description: 'Balanced approach adapting to athlete signals. Combines skill, strength, and conditioning in flexible proportions.',
    
    primaryGoalBias: {
      general_strength: 70,
      front_lever: 70,
      muscle_up: 70,
      handstand: 70,
      planche: 65,
      weighted_pull: 65,
    },
    styleBias: {
      skill_focused: 65,
      strength_focused: 65,
      power_focused: 55,
      endurance_focused: 55,
      hypertrophy_supported: 60,
      balanced_hybrid: 95,
    },
    
    skillFrequencyBias: 'moderate',
    strengthBias: 'moderate',
    densityBias: 'moderate',
    volumeBias: 'moderate',
    tendonSafetyBias: 'standard',
    
    progressionMethod: 'autoregulated',
    
    recommendedSkillTypes: ['front_lever', 'muscle_up', 'handstand', 'general_calisthenics'],
    recommendedExperienceLevels: ['beginner', 'intermediate', 'advanced'],
    
    rules: {
      preferredRepRangeMin: 5,
      preferredRepRangeMax: 10,
      preferredSetRangeMin: 3,
      preferredSetRangeMax: 4,
      restSecondsMin: 90,
      restSecondsMax: 180,
      maxWeeklySkillSets: 18,
      maxWeeklyStrengthSets: 18,
      accessorySetsPerSession: 2,
      skillExposuresPerWeek: 3,
      strengthSessionsPerWeek: 3,
      targetRPERange: [7, 8.5],
      allowFailure: false,
      deloadFrequencyWeeks: 4,
      deloadVolumeReduction: 0.4,
      warmupSetsRequired: 2,
      backoffSetRequired: false,
      supersetAllowed: true,
      circuitAllowed: true,
    },
    
    inspirationSource: 'Adaptive hybrid calisthenics systems',
    bestFor: ['General development', 'Athletes unsure of focus', 'Balanced progression'],
    notRecommendedFor: ['Athletes with very specific goals needing specialized approach'],
  },
}

// =============================================================================
// FRAMEWORK SELECTION ENGINE
// =============================================================================

export interface FrameworkSelectionInput {
  // Athlete profile
  primaryGoal: string
  secondaryGoals: string[]
  experienceLevel: ExperienceLevel
  trainingStyle: TrainingStyleMode
  equipment: string[]
  jointCautions: string[]
  
  // Skill context
  primarySkill: SkillKey | null
  skillLevels: Record<SkillKey, number>
  
  // Readiness context
  readinessScore: number
  limitingFactor: string | null
  
  // Constraint context
  primaryConstraint: string | null
  hasTendonConcern: boolean
  
  // Performance envelope
  preferredRepRange: { min: number; max: number } | null
  preferredDensity: 'low' | 'moderate' | 'high' | null
  envelopeConfidence: number
  
  // Current state
  currentFrameworkId: CoachingFrameworkId | null
  weeksOnCurrentFramework: number
}

export interface FrameworkSelectionResult {
  selectedFrameworkId: CoachingFrameworkId
  framework: CoachingFramework
  confidenceScore: number
  selectionReason: string
  secondaryFrameworkId: CoachingFrameworkId | null
  shouldSwitch: boolean
  switchReason: string | null
}

/**
 * Select the most appropriate coaching framework based on athlete context
 */
export function selectFramework(input: FrameworkSelectionInput): FrameworkSelectionResult {
  const scores: Record<CoachingFrameworkId, number> = {
    skill_frequency: 0,
    barseagle_strength: 0,
    strength_conversion: 0,
    density_endurance: 0,
    hypertrophy_supported: 0,
    tendon_conservative: 0,
    balanced_hybrid: 0,
  }
  
  const reasons: Record<CoachingFrameworkId, string[]> = {
    skill_frequency: [],
    barseagle_strength: [],
    strength_conversion: [],
    density_endurance: [],
    hypertrophy_supported: [],
    tendon_conservative: [],
    balanced_hybrid: [],
  }
  
  // Score each framework
  for (const [id, framework] of Object.entries(COACHING_FRAMEWORKS)) {
    const frameworkId = id as CoachingFrameworkId
    let score = 50 // Base score
    
    // 1. Goal alignment (major factor)
    const goalBias = framework.primaryGoalBias[input.primaryGoal] || 50
    score += (goalBias - 50) * 0.4 // Scale to ±20
    if (goalBias > 75) {
      reasons[frameworkId].push(`Strong fit for ${input.primaryGoal}`)
    }
    
    // 2. Training style alignment (major factor)
    const styleBias = framework.styleBias[input.trainingStyle] || 50
    score += (styleBias - 50) * 0.3 // Scale to ±15
    if (styleBias > 80) {
      reasons[frameworkId].push(`Matches ${input.trainingStyle.replace(/_/g, ' ')} style`)
    }
    
    // 3. Experience level fit
    if (framework.recommendedExperienceLevels.includes(input.experienceLevel)) {
      score += 10
    } else {
      score -= 15
      reasons[frameworkId].push(`Not optimal for ${input.experienceLevel} level`)
    }
    
    // 4. Tendon concern handling (critical for safety)
    if (input.hasTendonConcern || input.jointCautions.length > 0) {
      if (framework.tendonSafetyBias === 'very_conservative') {
        score += 25
        reasons[frameworkId].push('Conservative approach for joint safety')
      } else if (framework.tendonSafetyBias === 'conservative') {
        score += 10
      }
    }
    
    // 5. Iron Cross / advanced rings detection
    if (input.primaryGoal === 'iron_cross' || input.primarySkill === 'iron_cross') {
      if (frameworkId === 'tendon_conservative') {
        score += 30
        reasons[frameworkId].push('Required for Iron Cross progression')
      } else if (framework.tendonSafetyBias === 'standard') {
        score -= 20
      }
    }
    
    // 6. Planche detection
    if (input.primaryGoal === 'planche' || input.primarySkill === 'planche') {
      if (frameworkId === 'tendon_conservative') {
        score += 15
        reasons[frameworkId].push('Conservative approach for planche tendon demands')
      } else if (frameworkId === 'strength_conversion') {
        score += 10
        reasons[frameworkId].push('Strength base supports planche')
      }
    }
    
    // 7. Weighted calisthenics detection
    if (input.primaryGoal === 'weighted_pull' || input.primaryGoal === 'weighted_dip' ||
        input.equipment.includes('weight_belt') || input.equipment.includes('dumbbells')) {
      if (frameworkId === 'barseagle_strength') {
        score += 20
        reasons[frameworkId].push('Optimized for weighted calisthenics')
      } else if (frameworkId === 'strength_conversion') {
        score += 10
      }
    }
    
    // 8. Performance envelope alignment
    if (input.envelopeConfidence > 0.5 && input.preferredRepRange) {
      const envRepMid = (input.preferredRepRange.min + input.preferredRepRange.max) / 2
      const frameworkRepMid = (framework.rules.preferredRepRangeMin + framework.rules.preferredRepRangeMax) / 2
      const repMatch = 1 - Math.abs(envRepMid - frameworkRepMid) / 10
      score += repMatch * 10
      if (repMatch > 0.7) {
        reasons[frameworkId].push('Matches your effective rep range')
      }
    }
    
    if (input.envelopeConfidence > 0.5 && input.preferredDensity) {
      if (input.preferredDensity === framework.densityBias) {
        score += 8
        reasons[frameworkId].push('Matches your density preference')
      }
    }
    
    // 9. Constraint handling
    if (input.primaryConstraint) {
      if (input.primaryConstraint.includes('tendon') && framework.tendonSafetyBias !== 'standard') {
        score += 15
      }
      if (input.primaryConstraint.includes('endurance') && frameworkId === 'density_endurance') {
        score += 15
        reasons[frameworkId].push('Addresses work capacity constraint')
      }
    }
    
    scores[frameworkId] = Math.max(0, Math.min(100, score))
  }
  
  // Find top frameworks
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [topId, topScore] = sorted[0] as [CoachingFrameworkId, number]
  const [secondId, secondScore] = sorted[1] as [CoachingFrameworkId, number]
  
  // Determine if we should switch from current framework
  const shouldSwitch = determineFrameworkSwitch(input, topId, topScore)
  
  // Build selection reason
  const topReasons = reasons[topId].slice(0, 3)
  const selectionReason = topReasons.length > 0 
    ? topReasons.join('. ') + '.'
    : `Best overall match for your goals and training context.`
  
  return {
    selectedFrameworkId: topId,
    framework: COACHING_FRAMEWORKS[topId],
    confidenceScore: topScore / 100,
    selectionReason,
    secondaryFrameworkId: secondScore > 60 ? secondId : null,
    shouldSwitch,
    switchReason: shouldSwitch ? getFrameworkSwitchReason(input.currentFrameworkId, topId) : null,
  }
}

/**
 * Determine if framework should actually switch (stability protection)
 */
function determineFrameworkSwitch(
  input: FrameworkSelectionInput,
  newFrameworkId: CoachingFrameworkId,
  newScore: number
): boolean {
  // No current framework = always select new
  if (!input.currentFrameworkId) return true
  
  // Same framework = no switch needed
  if (input.currentFrameworkId === newFrameworkId) return false
  
  // Minimum weeks on framework before considering switch
  const MIN_WEEKS_BEFORE_SWITCH = 4
  if (input.weeksOnCurrentFramework < MIN_WEEKS_BEFORE_SWITCH) {
    return false // Too early to switch
  }
  
  // Require significant score difference to switch
  const SWITCH_THRESHOLD = 20
  const currentFrameworkScore = calculateFrameworkScore(input, input.currentFrameworkId)
  
  if (newScore - currentFrameworkScore < SWITCH_THRESHOLD) {
    return false // Not enough difference
  }
  
  // Safety-critical switches (always allow)
  if (input.hasTendonConcern && newFrameworkId === 'tendon_conservative') {
    return true
  }
  
  return true
}

/**
 * Calculate score for a specific framework (for comparison)
 */
function calculateFrameworkScore(input: FrameworkSelectionInput, frameworkId: CoachingFrameworkId): number {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  let score = 50
  
  const goalBias = framework.primaryGoalBias[input.primaryGoal] || 50
  score += (goalBias - 50) * 0.4
  
  const styleBias = framework.styleBias[input.trainingStyle] || 50
  score += (styleBias - 50) * 0.3
  
  if (framework.recommendedExperienceLevels.includes(input.experienceLevel)) {
    score += 10
  }
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Get human-readable reason for framework switch
 */
function getFrameworkSwitchReason(
  oldFramework: CoachingFrameworkId | null,
  newFramework: CoachingFrameworkId
): string {
  if (!oldFramework) {
    return `Initial framework selected: ${COACHING_FRAMEWORKS[newFramework].frameworkName}.`
  }
  
  const reasons: Record<CoachingFrameworkId, string> = {
    skill_frequency: 'to prioritize skill frequency and technique development',
    barseagle_strength: 'to optimize heavy strength work with proper rest',
    strength_conversion: 'to convert strength gains into skill progression',
    density_endurance: 'to develop work capacity and fatigue tolerance',
    hypertrophy_supported: 'to include strategic hypertrophy support',
    tendon_conservative: 'to protect tendon health during advanced progressions',
    balanced_hybrid: 'to balance multiple training qualities',
  }
  
  return `Framework updated ${reasons[newFramework]}.`
}

// =============================================================================
// FRAMEWORK PROGRAMMING PARAMETERS
// =============================================================================

export interface FrameworkProgrammingParams {
  // Set/rep structure
  repRange: { min: number; max: number }
  setRange: { min: number; max: number }
  
  // Rest intervals
  restRange: { min: number; max: number }
  
  // Volume
  maxWeeklySkillSets: number
  maxWeeklyStrengthSets: number
  accessorySetsPerSession: number
  
  // Frequency
  skillExposuresPerWeek: number
  
  // Intensity
  targetRPE: [number, number]
  allowFailure: boolean
  
  // Structure
  warmupSetsRequired: number
  backoffSetRequired: boolean
  supersetAllowed: boolean
  circuitAllowed: boolean
  
  // Progression
  progressionMethod: ProgressionMethod
  deloadFrequencyWeeks: number
}

/**
 * Get programming parameters for a framework
 */
export function getFrameworkProgrammingParams(frameworkId: CoachingFrameworkId): FrameworkProgrammingParams {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  const rules = framework.rules
  
  return {
    repRange: { min: rules.preferredRepRangeMin, max: rules.preferredRepRangeMax },
    setRange: { min: rules.preferredSetRangeMin, max: rules.preferredSetRangeMax },
    restRange: { min: rules.restSecondsMin, max: rules.restSecondsMax },
    maxWeeklySkillSets: rules.maxWeeklySkillSets,
    maxWeeklyStrengthSets: rules.maxWeeklyStrengthSets,
    accessorySetsPerSession: rules.accessorySetsPerSession,
    skillExposuresPerWeek: rules.skillExposuresPerWeek,
    targetRPE: rules.targetRPERange,
    allowFailure: rules.allowFailure,
    warmupSetsRequired: rules.warmupSetsRequired,
    backoffSetRequired: rules.backoffSetRequired,
    supersetAllowed: rules.supersetAllowed,
    circuitAllowed: rules.circuitAllowed,
    progressionMethod: framework.progressionMethod,
    deloadFrequencyWeeks: rules.deloadFrequencyWeeks,
  }
}

// =============================================================================
// COACHING EXPLANATION LAYER
// =============================================================================

/**
 * Generate coaching explanation for selected framework
 */
export function generateFrameworkExplanation(
  frameworkId: CoachingFrameworkId,
  context: {
    primaryGoal: string
    trainingStyle: TrainingStyleMode
  }
): string {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  
  const explanations: Record<CoachingFrameworkId, string> = {
    skill_frequency: 'Your program uses frequent skill practice to accelerate motor learning. This approach keeps sessions fresh while building technical mastery.',
    barseagle_strength: 'Your program uses a proven heavy strength approach: warm-up sets followed by a heavy working set and back-off set. Long rest periods maximize neural adaptation.',
    strength_conversion: 'Your program develops raw strength that transfers to skill progression. Heavy compound movements build the foundation for advanced calisthenics.',
    density_endurance: 'Your program includes density blocks and circuits to build work capacity and fatigue tolerance. This develops conditioning alongside strength.',
    hypertrophy_supported: 'Your program combines skill work with strategic hypertrophy accessories. This supports muscle balance, joint health, and aesthetics.',
    tendon_conservative: 'Your program uses a conservative approach with lower straight-arm volume and longer rest periods. This protects tendon health during advanced progressions.',
    balanced_hybrid: 'Your program balances skill development, strength, and conditioning in flexible proportions. Training adapts to your response.',
  }
  
  return explanations[frameworkId]
}

/**
 * Generate short coaching message for framework
 */
export function getFrameworkCoachingMessage(frameworkId: CoachingFrameworkId): string {
  const messages: Record<CoachingFrameworkId, string> = {
    skill_frequency: 'Skill-first approach: quality practice builds mastery.',
    barseagle_strength: 'Heavy strength focus: neural gains with minimal fatigue.',
    strength_conversion: 'Strength converts to skills: build your foundation.',
    density_endurance: 'Work capacity focus: building fatigue tolerance.',
    hypertrophy_supported: 'Balanced development: skills plus muscle support.',
    tendon_conservative: 'Conservative progression: protecting long-term health.',
    balanced_hybrid: 'Adaptive training: responding to your signals.',
  }
  
  return messages[frameworkId]
}

// =============================================================================
// FRAMEWORK STABILITY TRACKING
// =============================================================================

export interface FrameworkHistory {
  frameworkId: CoachingFrameworkId
  startedAt: string
  endedAt: string | null
  weeksActive: number
  switchReason: string | null
}

/**
 * Track framework selection history for stability analysis
 */
const frameworkHistoryCache = new Map<string, FrameworkHistory[]>()

export function recordFrameworkSelection(
  athleteId: string,
  frameworkId: CoachingFrameworkId,
  reason: string | null
): void {
  const history = frameworkHistoryCache.get(athleteId) || []
  
  // Close previous framework if exists
  if (history.length > 0 && !history[history.length - 1].endedAt) {
    const prev = history[history.length - 1]
    prev.endedAt = new Date().toISOString()
    prev.weeksActive = Math.floor(
      (Date.now() - new Date(prev.startedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  }
  
  // Add new framework
  history.push({
    frameworkId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    weeksActive: 0,
    switchReason: reason,
  })
  
  frameworkHistoryCache.set(athleteId, history)
}

export function getFrameworkHistory(athleteId: string): FrameworkHistory[] {
  return frameworkHistoryCache.get(athleteId) || []
}

export function getCurrentFrameworkWeeks(athleteId: string): number {
  const history = frameworkHistoryCache.get(athleteId)
  if (!history || history.length === 0) return 0
  
  const current = history[history.length - 1]
  if (current.endedAt) return 0
  
  return Math.floor(
    (Date.now() - new Date(current.startedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
}

// =============================================================================
// DETAILED COACHING EXPLANATIONS
// =============================================================================

/**
 * Get detailed explanation of why a framework was selected
 */
export function getFrameworkSelectionExplanation(
  frameworkId: CoachingFrameworkId,
  selectionReason: string,
  context: {
    primaryGoal: string
    trainingStyle: string
    hasTendonConcern: boolean
    experienceLevel: string
  }
): string[] {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  const explanations: string[] = []
  
  // Main selection reason
  explanations.push(selectionReason)
  
  // Add context-specific explanations
  if (frameworkId === 'tendon_conservative' && context.hasTendonConcern) {
    explanations.push(
      'Conservative programming protects your tendons during challenging progressions.'
    )
  }
  
  if (frameworkId === 'barseagle_strength') {
    explanations.push(
      'This proven strength method uses 2 warm-up sets followed by a heavy working set and back-off set with 5-minute rest periods.'
    )
  }
  
  if (frameworkId === 'skill_frequency') {
    explanations.push(
      'Frequent skill exposures accelerate motor learning while keeping fatigue low.'
    )
  }
  
  // Experience level fit
  if (framework.recommendedExperienceLevels.includes(context.experienceLevel as any)) {
    explanations.push(
      `Well-suited for your ${context.experienceLevel} experience level.`
    )
  }
  
  return explanations
}

/**
 * Get framework summary for dashboard display
 */
export function getFrameworkDashboardSummary(frameworkId: CoachingFrameworkId): {
  name: string
  icon: string
  shortDescription: string
  keyBenefits: string[]
} {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  
  const icons: Record<CoachingFrameworkId, string> = {
    skill_frequency: 'Repeat',
    barseagle_strength: 'Dumbbell',
    strength_conversion: 'TrendingUp',
    density_endurance: 'Timer',
    hypertrophy_supported: 'Target',
    tendon_conservative: 'Shield',
    balanced_hybrid: 'Scale',
  }
  
  return {
    name: framework.frameworkName,
    icon: icons[frameworkId],
    shortDescription: framework.description.split('.')[0] + '.',
    keyBenefits: framework.bestFor.slice(0, 3),
  }
}

/**
 * Get framework comparison for educational UI
 */
export function getFrameworkComparison(frameworkIds: CoachingFrameworkId[]): Array<{
  id: CoachingFrameworkId
  name: string
  strengthBias: string
  volumeBias: string
  frequency: string
  bestFor: string
}> {
  return frameworkIds.map(id => {
    const fw = COACHING_FRAMEWORKS[id]
    return {
      id,
      name: fw.frameworkName,
      strengthBias: fw.strengthBias,
      volumeBias: fw.volumeBias,
      frequency: fw.skillFrequencyBias,
      bestFor: fw.bestFor[0],
    }
  })
}

/**
 * Get all framework IDs for display
 */
export function getAllFrameworkIds(): CoachingFrameworkId[] {
  return Object.keys(COACHING_FRAMEWORKS) as CoachingFrameworkId[]
}

/**
 * Get framework by ID
 */
export function getFramework(id: CoachingFrameworkId): CoachingFramework {
  return COACHING_FRAMEWORKS[id]
}

// =============================================================================
// ENVELOPE-PERSONALIZED FRAMEWORK PARAMETERS
// =============================================================================

import type { PerformanceEnvelope, DensityLevel } from './performance-envelope-engine'

/**
 * Personalized framework parameters that blend the selected framework's methodology
 * with the athlete's learned performance envelope
 */
export interface PersonalizedFrameworkParams {
  // Rep ranges (blended from framework + envelope)
  repRangeMin: number
  repRangeMax: number
  repRangeSource: 'framework' | 'envelope' | 'blended'
  
  // Set ranges (blended from framework + envelope)
  setRangeMin: number
  setRangeMax: number
  
  // Volume limits (primarily from envelope, bounded by framework)
  weeklyVolumeMin: number
  weeklyVolumeMax: number
  toleratedVolumeMax: number
  
  // Density preference (from envelope if confident, else framework)
  densityPreference: DensityLevel
  densitySource: 'framework' | 'envelope'
  
  // Rest intervals (framework-informed, envelope-adjusted)
  restSecondsMin: number
  restSecondsMax: number
  
  // Fatigue management (from envelope)
  fatigueThreshold: number
  recoveryDays: number
  
  // Framework-specific parameters
  progressionMethod: ProgressionMethod
  allowFailure: boolean
  supersetAllowed: boolean
  circuitAllowed: boolean
  
  // Confidence in personalization
  personalizationConfidence: number
  
  // Explanations
  adaptations: string[]
}

/**
 * Get framework parameters personalized by the athlete's performance envelope
 * 
 * This function blends the selected coaching framework's methodology with
 * learned athlete-specific responses to create truly personalized programming.
 * 
 * The framework provides the "philosophy" (what approach to use),
 * the envelope provides the "tuning" (how this athlete responds).
 */
export function getPersonalizedFrameworkParams(
  frameworkId: CoachingFrameworkId,
  envelope: PerformanceEnvelope | null
): PersonalizedFrameworkParams {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  const rules = framework.rules
  const adaptations: string[] = []
  
  // If no envelope or very low confidence, return framework defaults
  if (!envelope || envelope.confidenceScore < 0.2) {
    return {
      repRangeMin: rules.preferredRepRangeMin,
      repRangeMax: rules.preferredRepRangeMax,
      repRangeSource: 'framework',
      setRangeMin: rules.preferredSetRangeMin,
      setRangeMax: rules.preferredSetRangeMax,
      weeklyVolumeMin: Math.round(rules.maxWeeklySkillSets * 0.6),
      weeklyVolumeMax: rules.maxWeeklySkillSets,
      toleratedVolumeMax: Math.round(rules.maxWeeklySkillSets * 1.2),
      densityPreference: framework.densityBias === 'high' ? 'high_density' : 
                         framework.densityBias === 'low' ? 'low_density' : 'moderate_density',
      densitySource: 'framework',
      restSecondsMin: rules.restSecondsMin,
      restSecondsMax: rules.restSecondsMax,
      fatigueThreshold: rules.maxWeeklySkillSets + rules.maxWeeklyStrengthSets,
      recoveryDays: framework.tendonSafetyBias === 'very_conservative' ? 3 : 2,
      progressionMethod: framework.progressionMethod,
      allowFailure: rules.allowFailure,
      supersetAllowed: rules.supersetAllowed,
      circuitAllowed: rules.circuitAllowed,
      personalizationConfidence: 0,
      adaptations: ['Using framework defaults (insufficient personalization data)'],
    }
  }
  
  // ==========================================================================
  // REP RANGE BLENDING
  // ==========================================================================
  // Use envelope if confident AND within reasonable bounds of framework philosophy
  let repRangeMin = rules.preferredRepRangeMin
  let repRangeMax = rules.preferredRepRangeMax
  let repRangeSource: 'framework' | 'envelope' | 'blended' = 'framework'
  
  if (envelope.repZoneConfidence >= 0.4) {
    // Check if envelope rep range is compatible with framework philosophy
    const envelopeAvg = (envelope.preferredRepRangeMin + envelope.preferredRepRangeMax) / 2
    const frameworkAvg = (rules.preferredRepRangeMin + rules.preferredRepRangeMax) / 2
    const difference = Math.abs(envelopeAvg - frameworkAvg)
    
    if (difference <= 3) {
      // Close enough - use envelope values
      repRangeMin = envelope.preferredRepRangeMin
      repRangeMax = envelope.preferredRepRangeMax
      repRangeSource = 'envelope'
      adaptations.push(
        `Rep range personalized to ${repRangeMin}-${repRangeMax} based on your response data`
      )
    } else if (difference <= 5) {
      // Blend them - envelope has different preference but within tolerance
      const blendWeight = Math.min(envelope.repZoneConfidence, 0.6)
      repRangeMin = Math.round(rules.preferredRepRangeMin * (1 - blendWeight) + envelope.preferredRepRangeMin * blendWeight)
      repRangeMax = Math.round(rules.preferredRepRangeMax * (1 - blendWeight) + envelope.preferredRepRangeMax * blendWeight)
      repRangeSource = 'blended'
      adaptations.push(
        `Rep range adjusted to ${repRangeMin}-${repRangeMax} (blending framework ${rules.preferredRepRangeMin}-${rules.preferredRepRangeMax} with your preference)`
      )
    } else {
      // Envelope suggests very different rep range - note it but prioritize framework philosophy
      adaptations.push(
        `Note: You respond well to ${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax} reps, but ${framework.frameworkName} prescribes ${rules.preferredRepRangeMin}-${rules.preferredRepRangeMax}`
      )
    }
  }
  
  // ==========================================================================
  // SET RANGE BLENDING
  // ==========================================================================
  let setRangeMin = rules.preferredSetRangeMin
  let setRangeMax = rules.preferredSetRangeMax
  
  if (envelope.confidenceScore >= 0.4) {
    setRangeMin = Math.max(rules.preferredSetRangeMin - 1, envelope.preferredSetRangeMin)
    setRangeMax = Math.min(rules.preferredSetRangeMax + 1, envelope.preferredSetRangeMax)
  }
  
  // ==========================================================================
  // VOLUME LIMITS (primarily from envelope)
  // ==========================================================================
  let weeklyVolumeMin: number
  let weeklyVolumeMax: number
  let toleratedVolumeMax: number
  
  if (envelope.weeklyVolumeConfidence >= 0.4) {
    weeklyVolumeMin = envelope.preferredWeeklyVolumeMin
    weeklyVolumeMax = envelope.preferredWeeklyVolumeMax
    toleratedVolumeMax = envelope.toleratedWeeklyVolumeMax
    
    // Warn if framework wants more volume than athlete tolerates
    if (rules.maxWeeklySkillSets > envelope.toleratedWeeklyVolumeMax) {
      adaptations.push(
        `Weekly volume capped at ${envelope.toleratedWeeklyVolumeMax} sets (your tolerance is lower than framework default)`
      )
    }
  } else {
    // Use framework defaults with conservative buffer
    weeklyVolumeMin = Math.round(rules.maxWeeklySkillSets * 0.6)
    weeklyVolumeMax = rules.maxWeeklySkillSets
    toleratedVolumeMax = Math.round(rules.maxWeeklySkillSets * 1.2)
  }
  
  // ==========================================================================
  // DENSITY PREFERENCE
  // ==========================================================================
  let densityPreference: DensityLevel
  let densitySource: 'framework' | 'envelope' = 'framework'
  
  if (envelope.densityConfidence >= 0.4) {
    densityPreference = envelope.preferredDensityLevel
    densitySource = 'envelope'
    
    // Check for framework conflict
    const frameworkDensity = framework.densityBias
    if (frameworkDensity === 'high' && envelope.densityTolerance === 'poor') {
      adaptations.push(
        'Rest periods extended despite framework preference (you respond better to lower density)'
      )
    } else if (frameworkDensity === 'low' && envelope.densityTolerance === 'good') {
      adaptations.push(
        'Session density optimized based on your good recovery tolerance'
      )
    }
  } else {
    densityPreference = framework.densityBias === 'high' ? 'high_density' : 
                       framework.densityBias === 'low' ? 'low_density' : 'moderate_density'
  }
  
  // ==========================================================================
  // REST INTERVALS (framework + density adjustment)
  // ==========================================================================
  let restSecondsMin = rules.restSecondsMin
  let restSecondsMax = rules.restSecondsMax
  
  if (envelope.densityTolerance === 'poor') {
    restSecondsMin = Math.round(restSecondsMin * 1.3)
    restSecondsMax = Math.round(restSecondsMax * 1.3)
  } else if (envelope.densityTolerance === 'good') {
    restSecondsMin = Math.round(restSecondsMin * 0.8)
    restSecondsMax = Math.round(restSecondsMax * 0.9)
  }
  
  // ==========================================================================
  // FATIGUE AND RECOVERY
  // ==========================================================================
  const fatigueThreshold = envelope.fatigueThreshold
  const recoveryDays = envelope.recoveryRateEstimate || 
                       (framework.tendonSafetyBias === 'very_conservative' ? 3 : 2)
  
  if (envelope.recoveryNeeds === 'high') {
    adaptations.push('Extended recovery periods recommended based on your response patterns')
  }
  
  // ==========================================================================
  // CALCULATE PERSONALIZATION CONFIDENCE
  // ==========================================================================
  const personalizationConfidence = Math.min(
    envelope.confidenceScore,
    (envelope.repZoneConfidence + envelope.weeklyVolumeConfidence + envelope.densityConfidence) / 3
  )
  
  return {
    repRangeMin,
    repRangeMax,
    repRangeSource,
    setRangeMin,
    setRangeMax,
    weeklyVolumeMin,
    weeklyVolumeMax,
    toleratedVolumeMax,
    densityPreference,
    densitySource,
    restSecondsMin,
    restSecondsMax,
    fatigueThreshold,
    recoveryDays,
    progressionMethod: framework.progressionMethod,
    allowFailure: rules.allowFailure,
    supersetAllowed: rules.supersetAllowed && envelope.densityTolerance !== 'poor',
    circuitAllowed: rules.circuitAllowed && envelope.densityTolerance === 'good',
    personalizationConfidence,
    adaptations,
  }
}

/**
 * Check if the selected framework aligns with the athlete's learned envelope
 * Returns compatibility assessment and recommendations
 */
export function assessFrameworkEnvelopeCompatibility(
  frameworkId: CoachingFrameworkId,
  envelope: PerformanceEnvelope
): {
  compatibility: 'excellent' | 'good' | 'moderate' | 'poor'
  score: number
  conflicts: string[]
  recommendations: string[]
} {
  const framework = COACHING_FRAMEWORKS[frameworkId]
  const rules = framework.rules
  const conflicts: string[] = []
  const recommendations: string[] = []
  let score = 70 // Base score
  
  // Check rep range compatibility
  const envelopeRepAvg = (envelope.preferredRepRangeMin + envelope.preferredRepRangeMax) / 2
  const frameworkRepAvg = (rules.preferredRepRangeMin + rules.preferredRepRangeMax) / 2
  const repDiff = Math.abs(envelopeRepAvg - frameworkRepAvg)
  
  if (repDiff > 5 && envelope.repZoneConfidence >= 0.4) {
    score -= 15
    conflicts.push(`Framework rep range (${rules.preferredRepRangeMin}-${rules.preferredRepRangeMax}) differs significantly from your optimal (${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax})`)
    recommendations.push(`Consider ${envelope.preferredRepRangeMin <= 3 ? 'barseagle_strength' : 'hypertrophy_supported'} framework to match your response pattern`)
  } else if (repDiff <= 2) {
    score += 10
  }
  
  // Check density compatibility
  if (envelope.densityConfidence >= 0.4) {
    if (framework.densityBias === 'high' && envelope.densityTolerance === 'poor') {
      score -= 20
      conflicts.push('Framework uses high density but you respond poorly to compressed rest periods')
      recommendations.push('Rest periods will be automatically extended to match your recovery needs')
    } else if (framework.densityBias === 'low' && envelope.densityTolerance === 'good') {
      score += 5
      recommendations.push('You could handle higher density if time-constrained')
    }
  }
  
  // Check volume compatibility
  if (envelope.weeklyVolumeConfidence >= 0.4) {
    if (rules.maxWeeklySkillSets > envelope.toleratedWeeklyVolumeMax * 1.2) {
      score -= 15
      conflicts.push(`Framework volume (${rules.maxWeeklySkillSets} sets/week) exceeds your tolerance (${envelope.toleratedWeeklyVolumeMax})`)
      recommendations.push('Volume will be automatically capped to prevent quality degradation')
    }
  }
  
  // Check framework affinity
  if (envelope.frameworkAffinity.frameworkConfidence >= 0.4) {
    if (envelope.frameworkAffinity.preferredFramework === frameworkId) {
      score += 15
    } else if (envelope.frameworkAffinity.preferredFramework) {
      score -= 5
      recommendations.push(`Your response patterns suggest ${envelope.frameworkAffinity.preferredFramework} might be a better fit`)
    }
  }
  
  // Determine compatibility level
  let compatibility: 'excellent' | 'good' | 'moderate' | 'poor' = 'good'
  if (score >= 85) compatibility = 'excellent'
  else if (score >= 70) compatibility = 'good'
  else if (score >= 50) compatibility = 'moderate'
  else compatibility = 'poor'
  
  return {
    compatibility,
    score: Math.max(0, Math.min(100, score)),
    conflicts,
    recommendations,
  }
}
