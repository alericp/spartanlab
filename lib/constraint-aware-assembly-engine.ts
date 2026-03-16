/**
 * Constraint-Aware Assembly Engine
 * 
 * Central constraint orchestration for workout generation.
 * Ensures all athlete constraints are respected during session assembly.
 * 
 * Design Principle: The best workout is not the most theoretically perfect workout.
 * The best workout is the most effective session the athlete can:
 * - Recover from
 * - Execute well
 * - Fit into real life
 * - Sustain over time
 */

import type { JointCaution } from './athlete-profile'
import type { TrainingDecision } from './fatigue-decision-engine'
import type { PerformanceEnvelope } from './performance-envelope-service'
import type { StyleProgrammingRules } from './training-style-service'
import type { ConstraintCategory } from './constraint-integration'
import type { LimitingFactor } from './readiness/canonical-readiness-engine'

// =============================================================================
// CONSTRAINT CATEGORIES
// =============================================================================

export type ConstraintType = 
  | 'time_constraint'
  | 'fatigue_constraint'
  | 'tendon_constraint'
  | 'injury_constraint'
  | 'equipment_constraint'
  | 'weak_point_constraint'
  | 'framework_constraint'
  | 'envelope_constraint'
  | 'style_constraint'

export interface ActiveConstraint {
  type: ConstraintType
  severity: 'low' | 'moderate' | 'high' | 'critical'
  description: string
  action: ConstraintAction
  affectedTiers: ExerciseTier[]
}

export type ConstraintAction = 
  | 'reduce_volume'
  | 'substitute_exercise'
  | 'skip_tier'
  | 'add_protocol'
  | 'modify_intensity'
  | 'modify_rest'
  | 'prioritize_limiter'
  | 'protect_joint'
  | 'preserve_core'

// =============================================================================
// SESSION ASSEMBLY TIERS
// =============================================================================

export type ExerciseTier = 'tier1_core' | 'tier2_support' | 'tier3_optional'

export interface TierDefinition {
  tier: ExerciseTier
  label: string
  compressible: boolean
  skipWhenConstrained: boolean
  minExercises: number
  maxExercises: number
  exerciseTypes: string[]
}

export const SESSION_TIERS: TierDefinition[] = [
  {
    tier: 'tier1_core',
    label: 'Core Training',
    compressible: false,
    skipWhenConstrained: false,
    minExercises: 2,
    maxExercises: 4,
    exerciseTypes: ['skill_work', 'main_strength', 'weak_point_primary'],
  },
  {
    tier: 'tier2_support',
    label: 'Support Work',
    compressible: true,
    skipWhenConstrained: false,
    minExercises: 1,
    maxExercises: 3,
    exerciseTypes: ['secondary_strength', 'targeted_carryover', 'stability_work'],
  },
  {
    tier: 'tier3_optional',
    label: 'Optional Enhancement',
    compressible: true,
    skipWhenConstrained: true,
    minExercises: 0,
    maxExercises: 3,
    exerciseTypes: ['accessories', 'hypertrophy_support', 'extra_mobility', 'conditioning'],
  },
]

// =============================================================================
// CONSTRAINT INPUT TYPES
// =============================================================================

export interface ConstraintAwareInput {
  // Time constraints
  targetMinutes: number
  preferredMinutes: number
  
  // Fatigue state
  fatigueLevel: 'fresh' | 'normal' | 'fatigued' | 'overtrained'
  straightArmFatigue: number // 0-100
  overallFatigue: number // 0-100
  fatigueDecision: TrainingDecision | null
  
  // Tendon/joint state
  jointCautions: JointCaution[]
  tendonStress: {
    wrist: number
    shoulder: number
    elbow: number
  }
  
  // Injury flags
  activeInjuries: string[]
  discomfortFlags: string[]
  
  // Weak point data
  primaryLimiter: LimitingFactor | null
  secondaryLimiter: LimitingFactor | null
  limiterSeverity: number // 0-100
  
  // Framework
  frameworkId: string | null
  frameworkRules: {
    volumeMultiplier: number
    restMultiplier: number
    intensityBias: 'low' | 'moderate' | 'high'
    preferredDensity: 'low' | 'moderate' | 'high'
  } | null
  
  // Envelope
  envelopeConfidence: number // 0-1
  envelopeLimits: {
    maxStraightArmVolume?: number
    preferredRepRange?: { min: number; max: number }
    fatigueThreshold?: number
  } | null
  
  // Style
  trainingStyle: string
  styleProgrammingRules: StyleProgrammingRules | null
  
  // Equipment
  availableEquipment: string[]
  missingCriticalEquipment: string[]
}

// =============================================================================
// CONSTRAINT ANALYSIS OUTPUT
// =============================================================================

export interface ConstraintAnalysis {
  activeConstraints: ActiveConstraint[]
  constraintSummary: string
  
  // Tier modifications
  tier1Modifications: TierModification[]
  tier2Modifications: TierModification[]
  tier3Modifications: TierModification[]
  
  // Volume adjustments
  overallVolumeMultiplier: number
  straightArmVolumeMultiplier: number
  intensityMultiplier: number
  restMultiplier: number
  
  // Exercise guidance
  exercisesToAvoid: string[]
  exercisesToPrioritize: string[]
  exercisesToSubstitute: Array<{ original: string; replacement: string; reason: string }>
  
  // Protocols to add
  protocolsToAdd: string[]
  
  // Builder reasoning
  builderReasoning: BuilderReasoning[]
}

export interface TierModification {
  tier: ExerciseTier
  action: 'preserve' | 'compress' | 'skip' | 'enhance'
  reason: string
  exerciseCountAdjustment: number
}

export interface BuilderReasoning {
  category: string
  decision: string
  explanation: string
  priority: 'info' | 'important' | 'critical'
}

// =============================================================================
// MAIN CONSTRAINT ANALYZER
// =============================================================================

export function analyzeConstraints(input: ConstraintAwareInput): ConstraintAnalysis {
  const activeConstraints: ActiveConstraint[] = []
  const builderReasoning: BuilderReasoning[] = []
  
  // 1. Analyze time constraint
  const timeConstraint = analyzeTimeConstraint(input)
  if (timeConstraint) {
    activeConstraints.push(timeConstraint)
    builderReasoning.push({
      category: 'Time',
      decision: timeConstraint.action,
      explanation: timeConstraint.description,
      priority: timeConstraint.severity === 'high' ? 'important' : 'info',
    })
  }
  
  // 2. Analyze fatigue constraint
  const fatigueConstraint = analyzeFatigueConstraint(input)
  if (fatigueConstraint) {
    activeConstraints.push(fatigueConstraint)
    builderReasoning.push({
      category: 'Fatigue',
      decision: fatigueConstraint.action,
      explanation: fatigueConstraint.description,
      priority: fatigueConstraint.severity === 'high' ? 'critical' : 'important',
    })
  }
  
  // 3. Analyze tendon constraint
  const tendonConstraint = analyzeTendonConstraint(input)
  if (tendonConstraint) {
    activeConstraints.push(tendonConstraint)
    builderReasoning.push({
      category: 'Tendon',
      decision: tendonConstraint.action,
      explanation: tendonConstraint.description,
      priority: tendonConstraint.severity === 'critical' ? 'critical' : 'important',
    })
  }
  
  // 4. Analyze injury constraint
  const injuryConstraint = analyzeInjuryConstraint(input)
  if (injuryConstraint) {
    activeConstraints.push(injuryConstraint)
    builderReasoning.push({
      category: 'Injury',
      decision: injuryConstraint.action,
      explanation: injuryConstraint.description,
      priority: 'critical',
    })
  }
  
  // 5. Analyze equipment constraint
  const equipmentConstraint = analyzeEquipmentConstraint(input)
  if (equipmentConstraint) {
    activeConstraints.push(equipmentConstraint)
    builderReasoning.push({
      category: 'Equipment',
      decision: equipmentConstraint.action,
      explanation: equipmentConstraint.description,
      priority: 'info',
    })
  }
  
  // 6. Analyze weak point constraint (positive - prioritize limiter work)
  const weakPointConstraint = analyzeWeakPointConstraint(input)
  if (weakPointConstraint) {
    activeConstraints.push(weakPointConstraint)
    builderReasoning.push({
      category: 'Weak Point',
      decision: weakPointConstraint.action,
      explanation: weakPointConstraint.description,
      priority: 'important',
    })
  }
  
  // 7. Analyze framework constraint
  const frameworkConstraint = analyzeFrameworkConstraint(input)
  if (frameworkConstraint) {
    activeConstraints.push(frameworkConstraint)
    builderReasoning.push({
      category: 'Framework',
      decision: frameworkConstraint.action,
      explanation: frameworkConstraint.description,
      priority: 'info',
    })
  }
  
  // 8. Analyze envelope constraint
  const envelopeConstraint = analyzeEnvelopeConstraint(input)
  if (envelopeConstraint) {
    activeConstraints.push(envelopeConstraint)
    builderReasoning.push({
      category: 'Envelope',
      decision: envelopeConstraint.action,
      explanation: envelopeConstraint.description,
      priority: 'info',
    })
  }
  
  // Calculate combined modifiers
  const modifiers = calculateCombinedModifiers(activeConstraints, input)
  
  // Determine tier modifications
  const tier1Mods = determineTierModifications('tier1_core', activeConstraints, input)
  const tier2Mods = determineTierModifications('tier2_support', activeConstraints, input)
  const tier3Mods = determineTierModifications('tier3_optional', activeConstraints, input)
  
  // Generate constraint summary
  const constraintSummary = generateConstraintSummary(activeConstraints)
  
  // Determine exercises to avoid/prioritize/substitute
  const exerciseGuidance = generateExerciseGuidance(activeConstraints, input)
  
  // Determine protocols to add
  const protocolsToAdd = determineProtocols(activeConstraints, input)
  
  return {
    activeConstraints,
    constraintSummary,
    tier1Modifications: tier1Mods,
    tier2Modifications: tier2Mods,
    tier3Modifications: tier3Mods,
    overallVolumeMultiplier: modifiers.volumeMultiplier,
    straightArmVolumeMultiplier: modifiers.straightArmMultiplier,
    intensityMultiplier: modifiers.intensityMultiplier,
    restMultiplier: modifiers.restMultiplier,
    exercisesToAvoid: exerciseGuidance.avoid,
    exercisesToPrioritize: exerciseGuidance.prioritize,
    exercisesToSubstitute: exerciseGuidance.substitutions,
    protocolsToAdd,
    builderReasoning,
  }
}

// =============================================================================
// INDIVIDUAL CONSTRAINT ANALYZERS
// =============================================================================

function analyzeTimeConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  const timeDiff = input.targetMinutes - input.preferredMinutes
  
  if (input.targetMinutes >= 60) return null // Full session
  
  if (input.targetMinutes <= 30) {
    return {
      type: 'time_constraint',
      severity: 'high',
      description: 'Limited to 30 minutes. Preserving core skill and strength work only.',
      action: 'skip_tier',
      affectedTiers: ['tier3_optional'],
    }
  }
  
  if (input.targetMinutes <= 45) {
    return {
      type: 'time_constraint',
      severity: 'moderate',
      description: 'Compressed session. Reducing accessory work to preserve core training.',
      action: 'reduce_volume',
      affectedTiers: ['tier2_support', 'tier3_optional'],
    }
  }
  
  return null
}

function analyzeFatigueConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  // Check straight-arm fatigue specifically
  if (input.straightArmFatigue > 80) {
    return {
      type: 'fatigue_constraint',
      severity: 'high',
      description: 'High straight-arm fatigue detected. Reducing isometric skill volume.',
      action: 'reduce_volume',
      affectedTiers: ['tier1_core', 'tier2_support'],
    }
  }
  
  // Check overall fatigue
  if (input.fatigueLevel === 'overtrained') {
    return {
      type: 'fatigue_constraint',
      severity: 'critical',
      description: 'Significant fatigue accumulation. Deload session recommended.',
      action: 'reduce_volume',
      affectedTiers: ['tier1_core', 'tier2_support', 'tier3_optional'],
    }
  }
  
  if (input.fatigueLevel === 'fatigued') {
    return {
      type: 'fatigue_constraint',
      severity: 'moderate',
      description: 'Elevated fatigue. Reducing volume to support recovery.',
      action: 'reduce_volume',
      affectedTiers: ['tier2_support', 'tier3_optional'],
    }
  }
  
  // Check fatigue decision
  if (input.fatigueDecision === 'REDUCE_INTENSITY') {
    return {
      type: 'fatigue_constraint',
      severity: 'moderate',
      description: 'Training at reduced intensity to manage accumulated fatigue.',
      action: 'modify_intensity',
      affectedTiers: ['tier1_core', 'tier2_support'],
    }
  }
  
  return null
}

function analyzeTendonConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  const { wrist, shoulder, elbow } = input.tendonStress
  
  // Check for critical tendon stress
  if (wrist > 80 || shoulder > 80 || elbow > 80) {
    const affectedJoint = wrist > 80 ? 'wrist' : shoulder > 80 ? 'shoulder' : 'elbow'
    return {
      type: 'tendon_constraint',
      severity: 'critical',
      description: `High ${affectedJoint} tendon stress. Using protective progression.`,
      action: 'protect_joint',
      affectedTiers: ['tier1_core', 'tier2_support'],
    }
  }
  
  // Check for moderate tendon stress
  if (wrist > 60 || shoulder > 60 || elbow > 60) {
    return {
      type: 'tendon_constraint',
      severity: 'moderate',
      description: 'Elevated tendon stress. Selecting lower-stress progressions.',
      action: 'substitute_exercise',
      affectedTiers: ['tier1_core', 'tier2_support'],
    }
  }
  
  return null
}

function analyzeInjuryConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  if (input.activeInjuries.length === 0 && input.discomfortFlags.length === 0) {
    return null
  }
  
  // Active injuries take priority
  if (input.activeInjuries.length > 0) {
    return {
      type: 'injury_constraint',
      severity: 'critical',
      description: `Active injury flag: ${input.activeInjuries[0]}. Avoiding aggravating movements.`,
      action: 'substitute_exercise',
      affectedTiers: ['tier1_core', 'tier2_support', 'tier3_optional'],
    }
  }
  
  // Discomfort flags
  if (input.discomfortFlags.length > 0) {
    return {
      type: 'injury_constraint',
      severity: 'moderate',
      description: `Discomfort reported: ${input.discomfortFlags[0]}. Using protective selections.`,
      action: 'protect_joint',
      affectedTiers: ['tier1_core', 'tier2_support'],
    }
  }
  
  return null
}

function analyzeEquipmentConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  if (input.missingCriticalEquipment.length === 0) return null
  
  return {
    type: 'equipment_constraint',
    severity: 'moderate',
    description: `Adapting for missing equipment: ${input.missingCriticalEquipment.join(', ')}.`,
    action: 'substitute_exercise',
    affectedTiers: ['tier1_core', 'tier2_support', 'tier3_optional'],
  }
}

function analyzeWeakPointConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  if (!input.primaryLimiter || input.primaryLimiter === 'none') return null
  
  const limiterLabel = formatLimiterLabel(input.primaryLimiter)
  
  return {
    type: 'weak_point_constraint',
    severity: input.limiterSeverity > 70 ? 'high' : 'moderate',
    description: `${limiterLabel} identified as primary limiter. Prioritizing targeted work.`,
    action: 'prioritize_limiter',
    affectedTiers: ['tier1_core', 'tier2_support'],
  }
}

function analyzeFrameworkConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  if (!input.frameworkId || !input.frameworkRules) return null
  
  const { volumeMultiplier, preferredDensity } = input.frameworkRules
  
  if (volumeMultiplier < 0.8) {
    return {
      type: 'framework_constraint',
      severity: 'low',
      description: 'Framework prescribes reduced volume for quality focus.',
      action: 'reduce_volume',
      affectedTiers: ['tier2_support', 'tier3_optional'],
    }
  }
  
  if (preferredDensity === 'low') {
    return {
      type: 'framework_constraint',
      severity: 'low',
      description: 'Framework emphasizes longer rest for strength adaptation.',
      action: 'modify_rest',
      affectedTiers: ['tier1_core', 'tier2_support'],
    }
  }
  
  return null
}

function analyzeEnvelopeConstraint(input: ConstraintAwareInput): ActiveConstraint | null {
  if (input.envelopeConfidence < 0.4 || !input.envelopeLimits) return null
  
  const { maxStraightArmVolume, fatigueThreshold } = input.envelopeLimits
  
  if (maxStraightArmVolume && maxStraightArmVolume < 8) {
    return {
      type: 'envelope_constraint',
      severity: 'moderate',
      description: 'Performance data suggests lower straight-arm volume tolerance.',
      action: 'reduce_volume',
      affectedTiers: ['tier1_core'],
    }
  }
  
  if (fatigueThreshold && input.overallFatigue > fatigueThreshold) {
    return {
      type: 'envelope_constraint',
      severity: 'moderate',
      description: 'Approaching learned fatigue threshold. Moderating session load.',
      action: 'reduce_volume',
      affectedTiers: ['tier2_support', 'tier3_optional'],
    }
  }
  
  return null
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateCombinedModifiers(
  constraints: ActiveConstraint[],
  input: ConstraintAwareInput
): {
  volumeMultiplier: number
  straightArmMultiplier: number
  intensityMultiplier: number
  restMultiplier: number
} {
  let volumeMultiplier = 1.0
  let straightArmMultiplier = 1.0
  let intensityMultiplier = 1.0
  let restMultiplier = 1.0
  
  for (const constraint of constraints) {
    switch (constraint.action) {
      case 'reduce_volume':
        volumeMultiplier *= constraint.severity === 'critical' ? 0.6 
                         : constraint.severity === 'high' ? 0.75 
                         : constraint.severity === 'moderate' ? 0.85 
                         : 0.95
        break
        
      case 'modify_intensity':
        intensityMultiplier *= 0.85
        break
        
      case 'modify_rest':
        restMultiplier *= 1.3
        break
    }
  }
  
  // Apply straight-arm specific reduction if fatigue is high
  if (input.straightArmFatigue > 60) {
    straightArmMultiplier *= 1 - (input.straightArmFatigue - 60) / 100
  }
  
  // Apply framework rules
  if (input.frameworkRules) {
    volumeMultiplier *= input.frameworkRules.volumeMultiplier
    restMultiplier *= input.frameworkRules.restMultiplier
  }
  
  return {
    volumeMultiplier: Math.max(0.5, Math.min(1.2, volumeMultiplier)),
    straightArmMultiplier: Math.max(0.4, Math.min(1.0, straightArmMultiplier)),
    intensityMultiplier: Math.max(0.7, Math.min(1.0, intensityMultiplier)),
    restMultiplier: Math.max(0.8, Math.min(1.5, restMultiplier)),
  }
}

function determineTierModifications(
  tier: ExerciseTier,
  constraints: ActiveConstraint[],
  input: ConstraintAwareInput
): TierModification[] {
  const modifications: TierModification[] = []
  
  for (const constraint of constraints) {
    if (!constraint.affectedTiers.includes(tier)) continue
    
    let action: TierModification['action'] = 'preserve'
    let exerciseCountAdjustment = 0
    
    switch (constraint.action) {
      case 'skip_tier':
        if (tier === 'tier3_optional') {
          action = 'skip'
          exerciseCountAdjustment = -3
        }
        break
        
      case 'reduce_volume':
        action = 'compress'
        exerciseCountAdjustment = tier === 'tier3_optional' ? -2 : -1
        break
        
      case 'prioritize_limiter':
        if (tier === 'tier1_core' || tier === 'tier2_support') {
          action = 'enhance'
          exerciseCountAdjustment = 0 // Prioritize, don't add
        }
        break
        
      default:
        action = 'preserve'
    }
    
    modifications.push({
      tier,
      action,
      reason: constraint.description,
      exerciseCountAdjustment,
    })
  }
  
  return modifications
}

function generateConstraintSummary(constraints: ActiveConstraint[]): string {
  if (constraints.length === 0) {
    return 'No active constraints. Full session prescribed.'
  }
  
  const critical = constraints.filter(c => c.severity === 'critical')
  const high = constraints.filter(c => c.severity === 'high')
  
  if (critical.length > 0) {
    return `Critical: ${critical[0].description}`
  }
  
  if (high.length > 0) {
    return `Important: ${high[0].description}`
  }
  
  return `${constraints.length} constraint(s) active. Session adapted accordingly.`
}

function generateExerciseGuidance(
  constraints: ActiveConstraint[],
  input: ConstraintAwareInput
): {
  avoid: string[]
  prioritize: string[]
  substitutions: Array<{ original: string; replacement: string; reason: string }>
} {
  const avoid: string[] = []
  const prioritize: string[] = []
  const substitutions: Array<{ original: string; replacement: string; reason: string }> = []
  
  // Map joint cautions to exercises to avoid
  for (const caution of input.jointCautions) {
    switch (caution) {
      case 'wrists':
        avoid.push('full_planche_lean', 'aggressive_planche')
        substitutions.push({
          original: 'planche_lean',
          replacement: 'pseudo_planche_pushup',
          reason: 'Reduced wrist extension angle',
        })
        break
      case 'shoulders':
        avoid.push('iron_cross', 'maltese', 'deep_ring_support')
        break
      case 'elbows':
        avoid.push('pelican_curl', 'aggressive_back_lever')
        break
    }
  }
  
  // Map weak points to exercises to prioritize
  if (input.primaryLimiter) {
    const limiterExercises = getLimiterExercises(input.primaryLimiter)
    prioritize.push(...limiterExercises)
  }
  
  return { avoid, prioritize, substitutions }
}

function determineProtocols(
  constraints: ActiveConstraint[],
  input: ConstraintAwareInput
): string[] {
  const protocols: string[] = []
  
  // Add protocols based on joint cautions
  for (const caution of input.jointCautions) {
    switch (caution) {
      case 'wrists':
        protocols.push('wrist_prep_protocol')
        break
      case 'shoulders':
        protocols.push('shoulder_stability_protocol')
        break
      case 'elbows':
        protocols.push('elbow_conditioning_protocol')
        break
    }
  }
  
  // Add deload protocol if fatigue is high
  if (input.fatigueLevel === 'overtrained' || input.fatigueLevel === 'fatigued') {
    protocols.push('fatigue_management_protocol')
  }
  
  return [...new Set(protocols)]
}

function formatLimiterLabel(limiter: LimitingFactor): string {
  const labels: Partial<Record<LimitingFactor, string>> = {
    pull_strength: 'Pulling strength',
    straight_arm_pull_strength: 'Straight-arm pulling',
    straight_arm_push_strength: 'Straight-arm pushing',
    compression_strength: 'Compression strength',
    scapular_control: 'Scapular control',
    shoulder_stability: 'Shoulder stability',
    explosive_pull_power: 'Explosive pulling power',
    transition_strength: 'Transition strength',
    vertical_push_strength: 'Vertical pushing',
    wrist_tolerance: 'Wrist tolerance',
    balance_control: 'Balance control',
  }
  return labels[limiter] || String(limiter).replace(/_/g, ' ')
}

function getLimiterExercises(limiter: LimitingFactor): string[] {
  const limiterExercises: Partial<Record<LimitingFactor, string[]>> = {
    pull_strength: ['weighted_pull_up', 'chest_to_bar', 'archer_pull_up'],
    straight_arm_pull_strength: ['front_lever_raise', 'tuck_front_lever_row', 'straight_arm_pulldown'],
    straight_arm_push_strength: ['planche_lean', 'pseudo_planche_pushup', 'tuck_planche'],
    compression_strength: ['hanging_leg_raise', 'l_sit', 'pike_compression'],
    scapular_control: ['scapular_pull_up', 'scapular_push_up', 'band_pull_apart'],
    shoulder_stability: ['ring_support_hold', 'rto_support', 'band_external_rotation'],
    explosive_pull_power: ['explosive_pull_up', 'high_pull', 'jumping_pull_up'],
    transition_strength: ['muscle_up_transition', 'straight_bar_dip', 'deep_dip'],
    vertical_push_strength: ['pike_push_up', 'wall_hspu', 'press_to_handstand_eccentric'],
    wrist_tolerance: ['wrist_circles', 'wrist_pushup', 'finger_stretch'],
    balance_control: ['wall_handstand', 'chest_to_wall_hold', 'freestanding_attempts'],
  }
  return limiterExercises[limiter] || []
}

// =============================================================================
// BUILDER REASONING FORMATTER
// =============================================================================

export interface FormattedBuilderReasoning {
  shortSummary: string
  detailedExplanations: string[]
  coachingTone: string
}

export function formatBuilderReasoning(
  analysis: ConstraintAnalysis
): FormattedBuilderReasoning {
  const explanations = analysis.builderReasoning.map(r => r.explanation)
  
  // Generate short summary
  let shortSummary = 'Full session prescribed.'
  
  const critical = analysis.builderReasoning.filter(r => r.priority === 'critical')
  const important = analysis.builderReasoning.filter(r => r.priority === 'important')
  
  if (critical.length > 0) {
    shortSummary = critical[0].explanation
  } else if (important.length > 0) {
    shortSummary = important[0].explanation
  } else if (analysis.activeConstraints.length > 0) {
    shortSummary = 'Session adapted based on your current status.'
  }
  
  // Generate coaching tone message
  const coachingTone = generateCoachingTone(analysis)
  
  return {
    shortSummary,
    detailedExplanations: explanations,
    coachingTone,
  }
}

function generateCoachingTone(analysis: ConstraintAnalysis): string {
  const messages: string[] = []
  
  // Time constraint
  const timeConstraint = analysis.activeConstraints.find(c => c.type === 'time_constraint')
  if (timeConstraint) {
    if (timeConstraint.severity === 'high') {
      messages.push('Accessory work was reduced to preserve quality within your 30-minute session.')
    } else {
      messages.push('Session structure was compressed while preserving core training.')
    }
  }
  
  // Fatigue constraint
  const fatigueConstraint = analysis.activeConstraints.find(c => c.type === 'fatigue_constraint')
  if (fatigueConstraint) {
    if (fatigueConstraint.severity === 'critical') {
      messages.push('Straight-arm volume was lowered due to elevated fatigue.')
    } else {
      messages.push('Volume was moderated to support recovery.')
    }
  }
  
  // Weak point constraint
  const weakPointConstraint = analysis.activeConstraints.find(c => c.type === 'weak_point_constraint')
  if (weakPointConstraint) {
    const limiterLabel = analysis.exercisesToPrioritize.length > 0 
      ? analysis.exercisesToPrioritize[0].replace(/_/g, ' ')
      : 'your limiter'
    messages.push(`Compression work was prioritized because ${limiterLabel} is your current limiter.`)
  }
  
  // Injury constraint
  const injuryConstraint = analysis.activeConstraints.find(c => c.type === 'injury_constraint')
  if (injuryConstraint) {
    messages.push('A lower-stress progression was selected to protect your shoulder.')
  }
  
  if (messages.length === 0) {
    return 'Your session is optimized for your current training status.'
  }
  
  return messages.join(' ')
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  analyzeConstraints,
  formatBuilderReasoning,
  SESSION_TIERS,
}
