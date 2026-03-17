/**
 * Doctrine → Engine Integration Layer
 *
 * This layer allows Training Doctrine Registry profiles to intelligently
 * influence SpartanLab's AI engine decisions without replacing existing logic.
 *
 * Doctrine profiles are not standalone programs. They are structured philosophy
 * layers that should influence:
 * - How the engine interprets athlete needs
 * - What style of progression it prefers
 * - What exercise structures it leans toward
 * - How cautious or aggressive it is with volume, progression, and skill emphasis
 *
 * The engine should be driven by athlete data first.
 * Doctrine should refine decisions, not override athlete reality.
 */

import type { TrainingDoctrine } from './training-doctrine-registry/doctrineTypes'

// =============================================================================
// DOCTRINE INFLUENCE TYPES
// =============================================================================

export type InfluenceType =
  | 'progression_bias'        // How fast/slow to progress
  | 'structure_bias'          // Preferred session/block structures
  | 'safety_bias'             // Conservative vs. aggressive approach
  | 'movement_emphasis'       // Which movements to emphasize
  | 'framework_affinity'      // Preferred coaching frameworks
  | 'weak_point_interpretation' // How to interpret weak points
  | 'exercise_preference'     // Exercise selection bias
  | 'volume_tendency'         // Preferred volume levels
  | 'intensity_tendency'      // Preferred intensity levels

export type TargetSystem =
  | 'coaching_framework'      // Coaching Framework Selection Engine
  | 'weak_point_engine'       // Weak Point Detection Engine
  | 'program_builder'         // Program Builder
  | 'progression_graph'       // Skill Progression Graph Engine
  | 'exercise_intelligence'   // Exercise Intelligence Layer
  | 'movement_bias'           // Movement Bias Handling
  | 'performance_envelope'    // Performance Envelope Interpretation
  | 'all_systems'             // Global influence

// =============================================================================
// DOCTRINE INFLUENCE MODEL
// =============================================================================

export interface DoctrineInfluence {
  // Identity
  doctrineId: string
  influenceType: InfluenceType
  targetSystem: TargetSystem
  
  // Strength of influence (0.0 - 1.0)
  influenceWeight: number
  
  // Conditions under which this influence applies
  conditions?: {
    minAthleteLevel?: string
    maxAthleteLevel?: string
    requiredGoals?: string[]
    requiredBias?: string[]
  }
  
  // Description for logging/debugging
  description: string
}

// =============================================================================
// ATHLETE DOCTRINE CONTEXT
// =============================================================================

export interface AthleteDoctrineContext {
  athleteId: string
  
  // Current doctrine selections
  primaryDoctrine: TrainingDoctrine | null
  secondaryDoctrine?: TrainingDoctrine | null
  
  // Athlete properties influencing doctrine applicability
  athleteLevel: 'beginner' | 'intermediate' | 'advanced'
  primaryGoals: string[]
  trainingBias: 'pull_dominant' | 'push_dominant' | 'compression_dominant' | 'balanced'
  
  // Current training state
  readinessScore: number
  hasActiveInjury: boolean
  recoveryCapacity: 'low' | 'moderate' | 'high'
  
  // Doctrine stability tracking
  doctrineStartDate: string
  weeksSinceDoctrineSelection: number
}

// =============================================================================
// DOCTRINE SELECTION RESULT
// =============================================================================

export interface DoctrineSelectionResult {
  primaryDoctrineId: string | null
  secondaryDoctrineId?: string | null
  selectionReason: string
  selectedAt: string
  expectedStabilityPeriod: number // days
}

// =============================================================================
// FRAMEWORK INFLUENCE
// =============================================================================

export interface FrameworkInfluenceRecommendation {
  preferredFrameworks: string[]
  frameworkAffinityScores: Record<string, number>
  explanation: string
}

// =============================================================================
// WEAK POINT INFLUENCE
// =============================================================================

export interface WeakPointInfluenceRecommendation {
  emphasizeTendonTolerance: boolean
  emphasizePrerequisites: boolean
  emphasizeStrengthDeficits: boolean
  emphasizeMovementBias: boolean
  scaleIntensity: number // 0.8 - 1.2
  explanation: string
}

// =============================================================================
// PROGRESSION INFLUENCE
// =============================================================================

export interface ProgressionInfluenceRecommendation {
  progressionConservatism: number // 0 = aggressive, 1 = conservative
  prerequisiteEnforcement: boolean
  readinessThresholdAdjustment: number // -10 to +10 points
  nodeAdvancementDelay: number // days to wait before advancing
  explanation: string
}

// =============================================================================
// EXERCISE INFLUENCE
// =============================================================================

export interface ExerciseInfluenceRecommendation {
  preferredStructures: string[]
  exerciseSelectionBias: Record<string, number> // exercise type -> bias score
  reduceHighRiskExercises: boolean
  increaseFoundationalEmphasis: boolean
  explanation: string
}

// =============================================================================
// PROGRAM BUILDER INFLUENCE
// =============================================================================

export interface ProgramBuilderInfluenceRecommendation {
  sessionStructureBias: string // 'full_body' | 'split' | 'skill_focused' etc.
  supportExerciseEmphasis: number // 0-1, how much to include support work
  progressionConservatism: number // 0-1, how conservative to be with progression
  volum eScaling: number // 0.8-1.2, multiply recommended volume
  recoveryEmphasis: number // 0-1, how much recovery/deload to include
  explanation: string
}

// =============================================================================
// MOVEMENT BIAS INFLUENCE
// =============================================================================

export interface MovementBiasInfluenceRecommendation {
  emphasizeWeakPattern: boolean
  weakPatternIntensity: number // 0.5 - 1.5x normal
  maintainStrongPattern: boolean
  strongPatternEmphasis: number // 0.8 - 1.2x normal
  explanation: string
}

// =============================================================================
// ENVELOPE INFLUENCE
// =============================================================================

export interface EnvelopeInfluenceRecommendation {
  interpretAsConservative: boolean
  straightArmThresholdAdjustment: number // -10 to +10 points
  volumeTolerance: number // 0.7 - 1.3
  recoveryDemand: number // 1.0 - 2.0x
  explanation: string
}

// =============================================================================
// COMBINED DOCTRINE INFLUENCE RESULT
// =============================================================================

export interface DoctrineInfluenceResult {
  doctrineId: string
  doctrineName: string
  
  // System-specific recommendations
  frameworkInfluence: FrameworkInfluenceRecommendation
  weakPointInfluence: WeakPointInfluenceRecommendation
  progressionInfluence: ProgressionInfluenceRecommendation
  exerciseInfluence: ExerciseInfluenceRecommendation
  programBuilderInfluence: ProgramBuilderInfluenceRecommendation
  movementBiasInfluence: MovementBiasInfluenceRecommendation
  envelopeInfluence: EnvelopeInfluenceRecommendation
  
  // Overall summary
  summary: string
  effectiveUntil: string
}

// =============================================================================
// DOCTRINE INFLUENCE CONSTANTS
// =============================================================================

export const DOCTRINE_STABILITY_PERIOD_DAYS = 28 // 4 weeks

export const DOCTRINE_REEVAL_TRIGGERS = [
  'plateau_detected',
  'repeated_fatigue_signals',
  'major_readiness_change',
  'goal_update',
  'athlete_request',
  'injury_or_constraint',
]

// =============================================================================
// DOCTRINE INFLUENCE MAPPING
// =============================================================================

/**
 * Maps doctrine profiles to their influence characteristics
 * Used to apply doctrine-driven modifications to engine behavior
 */
const DOCTRINE_INFLUENCE_MAP: Record<string, DoctrineInfluence[]> = {
  barseagle_minimal_volume: [
    {
      doctrineId: 'barseagle_minimal_volume',
      influenceType: 'framework_affinity',
      targetSystem: 'coaching_framework',
      influenceWeight: 0.8,
      description: 'Strong affinity for barseagle_strength and strength_conversion frameworks'
    },
    {
      doctrineId: 'barseagle_minimal_volume',
      influenceType: 'structure_bias',
      targetSystem: 'program_builder',
      influenceWeight: 0.7,
      description: 'Prefer weighted_strength_sets and bent_arm_blocks'
    },
    {
      doctrineId: 'barseagle_minimal_volume',
      influenceType: 'volume_tendency',
      targetSystem: 'all_systems',
      influenceWeight: 0.8,
      description: 'Strong preference for low volume, high intensity approach'
    }
  ],
  
  tendon_conservative: [
    {
      doctrineId: 'tendon_conservative',
      influenceType: 'safety_bias',
      targetSystem: 'all_systems',
      influenceWeight: 0.9,
      description: 'Conservative approach to progression, especially straight-arm skills'
    },
    {
      doctrineId: 'tendon_conservative',
      influenceType: 'weak_point_interpretation',
      targetSystem: 'weak_point_engine',
      influenceWeight: 0.8,
      description: 'Emphasize tendon tolerance and joint health concerns'
    },
    {
      doctrineId: 'tendon_conservative',
      influenceType: 'progression_bias',
      targetSystem: 'progression_graph',
      influenceWeight: 0.85,
      description: 'Stricter readiness requirements before advancing nodes'
    }
  ],
  
  tiered_progression_roadmap: [
    {
      doctrineId: 'tiered_progression_roadmap',
      influenceType: 'weak_point_interpretation',
      targetSystem: 'weak_point_engine',
      influenceWeight: 0.8,
      description: 'Emphasize missing prerequisites as strong weak points'
    },
    {
      doctrineId: 'tiered_progression_roadmap',
      influenceType: 'structure_bias',
      targetSystem: 'program_builder',
      influenceWeight: 0.75,
      description: 'Clear foundational emphasis before advanced progressions'
    },
    {
      doctrineId: 'tiered_progression_roadmap',
      influenceType: 'framework_affinity',
      targetSystem: 'coaching_framework',
      influenceWeight: 0.7,
      description: 'Affinity toward skill_frequency and structured approaches'
    }
  ],
  
  full_body_rings_integration: [
    {
      doctrineId: 'full_body_rings_integration',
      influenceType: 'structure_bias',
      targetSystem: 'program_builder',
      influenceWeight: 0.8,
      description: 'Full-body sessions with ring/static emphasis'
    },
    {
      doctrineId: 'full_body_rings_integration',
      influenceType: 'movement_emphasis',
      targetSystem: 'exercise_intelligence',
      influenceWeight: 0.75,
      description: 'Prefer integrated, high-transfer bodyweight exercises'
    },
    {
      doctrineId: 'full_body_rings_integration',
      influenceType: 'safety_bias',
      targetSystem: 'all_systems',
      influenceWeight: 0.7,
      description: 'Conservative respect for advanced leverage work'
    }
  ],
  
  otz_density_conditioning: [
    {
      doctrineId: 'otz_density_conditioning',
      influenceType: 'structure_bias',
      targetSystem: 'program_builder',
      influenceWeight: 0.85,
      description: 'Prefer density_blocks, emom_blocks, pyramid_ladders'
    },
    {
      doctrineId: 'otz_density_conditioning',
      influenceType: 'volume_tendency',
      targetSystem: 'all_systems',
      influenceWeight: 0.8,
      description: 'High volume, moderate intensity, compressed rest periods'
    }
  ]
}

// =============================================================================
// CORE DOCTRINE INTEGRATION FUNCTIONS
// =============================================================================

/**
 * Determine which doctrine(s) should be active for an athlete
 * Based on their goals, level, bias, and current training state
 */
export function selectDoctrinesForAthlete(
  context: AthleteDoctrineContext
): DoctrineSelectionResult {
  // This is a simplified selector - real implementation would be more sophisticated
  // and integrate with the coaching framework engine
  
  return {
    primaryDoctrineId: context.primaryDoctrine?.doctrineId || null,
    secondaryDoctrineId: context.secondaryDoctrine?.doctrineId,
    selectionReason: `Selected based on athlete level (${context.athleteLevel}), goals, and training state`,
    selectedAt: new Date().toISOString(),
    expectedStabilityPeriod: DOCTRINE_STABILITY_PERIOD_DAYS
  }
}

/**
 * Get all doctrine influence recommendations for a given context
 */
export function applyDoctrineInfluence(
  doctrine: TrainingDoctrine | null,
  context: AthleteDoctrineContext
): DoctrineInfluenceResult | null {
  if (!doctrine) {
    return null
  }

  const influences = DOCTRINE_INFLUENCE_MAP[doctrine.doctrineId] || []

  return {
    doctrineId: doctrine.doctrineId,
    doctrineName: doctrine.name,
    
    frameworkInfluence: getFrameworkInfluence(doctrine),
    weakPointInfluence: getWeakPointInfluence(doctrine),
    progressionInfluence: getProgressionInfluence(doctrine),
    exerciseInfluence: getExerciseInfluence(doctrine),
    programBuilderInfluence: getProgramBuilderInfluence(doctrine),
    movementBiasInfluence: getMovementBiasInfluence(doctrine),
    envelopeInfluence: getEnvelopeInfluence(doctrine),
    
    summary: `Training doctrine: ${doctrine.name}. ${doctrine.summary}`,
    effectiveUntil: new Date(Date.now() + DOCTRINE_STABILITY_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Get doctrine influence for a specific system
 */
export function getDoctrineInfluenceForSystem(
  doctrine: TrainingDoctrine,
  system: TargetSystem
): DoctrineInfluence[] {
  const influences = DOCTRINE_INFLUENCE_MAP[doctrine.doctrineId] || []
  return influences.filter(
    inf => inf.targetSystem === system || inf.targetSystem === 'all_systems'
  )
}

/**
 * Check if doctrine should be re-evaluated based on trigger conditions
 */
export function shouldReEvaluateDoctrine(
  context: AthleteDoctrineContext,
  triggers: string[]
): boolean {
  if (context.weeksSinceDoctrineSelection >= 4) {
    return true
  }
  
  return triggers.some(trigger =>
    DOCTRINE_REEVAL_TRIGGERS.includes(trigger)
  )
}

// =============================================================================
// SYSTEM-SPECIFIC INFLUENCE FUNCTIONS
// =============================================================================

export function getFrameworkInfluence(doctrine: TrainingDoctrine): FrameworkInfluenceRecommendation {
  const frameworkAffinityScores: Record<string, number> = {}
  
  // Build affinity scores based on doctrine-framework compatibility
  doctrine.compatibleFrameworks?.forEach(framework => {
    frameworkAffinityScores[framework] = 12 // +12 points in framework selection
  })

  return {
    preferredFrameworks: doctrine.compatibleFrameworks || [],
    frameworkAffinityScores,
    explanation: `${doctrine.name} has affinity toward: ${doctrine.compatibleFrameworks?.join(', ') || 'no specific frameworks'}`
  }
}

export function getWeakPointInfluence(doctrine: TrainingDoctrine): WeakPointInfluenceRecommendation {
  const adjustments: WeakPointInfluenceRecommendation = {
    emphasizeTendonTolerance: doctrine.doctrineId.includes('conservative') || doctrine.doctrineId.includes('tendon'),
    emphasizePrerequisites: doctrine.doctrineId.includes('roadmap') || doctrine.doctrineId.includes('tiered'),
    emphasizeStrengthDeficits: doctrine.doctrineId.includes('strength') || doctrine.doctrineId.includes('barseagle'),
    emphasizeMovementBias: false,
    scaleIntensity: 1.0,
    explanation: `Weak point interpretation adjusted for ${doctrine.name}`
  }

  return adjustments
}

export function getProgressionInfluence(doctrine: TrainingDoctrine): ProgressionInfluenceRecommendation {
  let conservatism = 0.5
  let thresholdAdjustment = 0
  let prerequisiteEnforcement = false
  let nodeAdvancementDelay = 0

  if (doctrine.doctrineId.includes('conservative') || doctrine.doctrineId.includes('tendon')) {
    conservatism = 0.8
    thresholdAdjustment = 5
    nodeAdvancementDelay = 7
  } else if (doctrine.doctrineId.includes('roadmap') || doctrine.doctrineId.includes('tiered')) {
    conservatism = 0.6
    prerequisiteEnforcement = true
  } else if (doctrine.doctrineId.includes('barseagle')) {
    conservatism = 0.3
    thresholdAdjustment = -5
  }

  return {
    progressionConservatism: conservatism,
    prerequisiteEnforcement,
    readinessThresholdAdjustment: thresholdAdjustment,
    nodeAdvancementDelay,
    explanation: `Progression pacing for ${doctrine.name}: ${conservatism > 0.6 ? 'Conservative' : 'Balanced'}`
  }
}

export function getExerciseInfluence(doctrine: TrainingDoctrine): ExerciseInfluenceRecommendation {
  const structures = doctrine.preferredStructures || []
  const bias: Record<string, number> = {}

  // Build exercise selection bias based on doctrine structures
  if (structures.includes('weighted_strength_sets')) {
    bias['weighted_pull_ups'] = 1.2
    bias['weighted_dips'] = 1.2
  }
  if (structures.includes('ring_support_progressions')) {
    bias['ring_support_holds'] = 1.3
    bias['ring_rows'] = 1.2
  }
  if (structures.includes('static_hold_blocks')) {
    bias['handstand_hold'] = 1.1
    bias['planche_hold'] = 1.2
  }

  return {
    preferredStructures: structures,
    exerciseSelectionBias: bias,
    reduceHighRiskExercises: doctrine.doctrineId.includes('conservative') || doctrine.doctrineId.includes('tendon'),
    increaseFoundationalEmphasis: doctrine.doctrineId.includes('roadmap') || doctrine.doctrineId.includes('tiered'),
    explanation: `Exercise selection influenced by ${doctrine.name}`
  }
}

export function getProgramBuilderInfluence(doctrine: TrainingDoctrine): ProgramBuilderInfluenceRecommendation {
  let sessionStructure = 'full_body'
  let supportEmphasis = 0.5
  let conservatism = 0.5
  let volumeScaling = 1.0
  let recoveryEmphasis = 0.4

  if (doctrine.doctrineId.includes('barseagle')) {
    sessionStructure = 'strength_focused'
    supportEmphasis = 0.3
    conservatism = 0.3
    volumeScaling = 0.8
  } else if (doctrine.doctrineId.includes('density')) {
    sessionStructure = 'density_circuit'
    supportEmphasis = 0.6
    volumeScaling = 1.3
  } else if (doctrine.doctrineId.includes('conservative') || doctrine.doctrineId.includes('tendon')) {
    supportEmphasis = 0.8
    conservatism = 0.85
    volumeScaling = 0.9
    recoveryEmphasis = 0.7
  } else if (doctrine.doctrineId.includes('roadmap')) {
    sessionStructure = 'structured_progression'
    supportEmphasis = 0.7
    conservatism = 0.6
  }

  return {
    sessionStructureBias: sessionStructure,
    supportExerciseEmphasis: supportEmphasis,
    progressionConservatism: conservatism,
    volumeScaling,
    recoveryEmphasis,
    explanation: `Program structure influenced by ${doctrine.name}`
  }
}

export function getMovementBiasInfluence(doctrine: TrainingDoctrine): MovementBiasInfluenceRecommendation {
  return {
    emphasizeWeakPattern: true,
    weakPatternIntensity: 1.1,
    maintainStrongPattern: true,
    strongPatternEmphasis: 1.0,
    explanation: `Movement bias handling refined by ${doctrine.name}`
  }
}

export function getEnvelopeInfluence(doctrine: TrainingDoctrine): EnvelopeInfluenceRecommendation {
  let conservative = false
  let thresholdAdjustment = 0
  let volumeTolerance = 1.0
  let recoveryDemand = 1.0

  if (doctrine.doctrineId.includes('conservative') || doctrine.doctrineId.includes('tendon')) {
    conservative = true
    thresholdAdjustment = -5
    volumeTolerance = 0.8
    recoveryDemand = 1.5
  } else if (doctrine.doctrineId.includes('density')) {
    volumeTolerance = 1.2
    recoveryDemand = 1.1
  }

  return {
    interpretAsConservative: conservative,
    straightArmThresholdAdjustment: thresholdAdjustment,
    volumeTolerance,
    recoveryDemand,
    explanation: `Performance envelope interpretation adjusted by ${doctrine.name}`
  }
}
