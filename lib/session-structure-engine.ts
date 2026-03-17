/**
 * Session Structure Engine
 * 
 * Generates intelligent structured workout formats (EMOM, ladders, pyramids, density blocks)
 * that respect all athlete constraints and training intelligence.
 * 
 * DESIGN PRINCIPLE: Structured training formats should function as intelligent containers
 * for exercises chosen by the AI system. These structures preserve:
 * - Progression safety
 * - Skill carryover
 * - Joint safety
 * - Weak-point emphasis
 * - Envelope limits
 * 
 * This prevents "random YouTube circuit" style training.
 */

import type { CoachingFrameworkId, FrameworkRules } from './coaching-framework-engine'
import type { StyleProgrammingRules, TrainingStyleMode } from './training-style-service'
import type { PerformanceEnvelope, MovementFamily } from './performance-envelope-engine'
import type { WeakPointType } from './weak-point-engine'
import type { ExerciseTier } from './constraint-aware-assembly-engine'

// =============================================================================
// SESSION STRUCTURE TYPES
// =============================================================================

export type SessionStructureType =
  | 'standard'
  | 'emom'
  | 'ladder'
  | 'pyramid'
  | 'density_block'
  | 'short_circuit'
  | 'skill_micro'

export type DensityLevel = 'low' | 'moderate' | 'high' | 'very_high'

export type FatigueProfile = 
  | 'very_low'      // Technical/skill work
  | 'low'           // Moderate intensity, controlled rest
  | 'moderate'      // Standard training
  | 'high'          // Density/circuit work
  | 'very_high'     // Maximum density

export interface ExerciseSlot {
  slotId: string
  slotType: 'skill' | 'strength' | 'support' | 'accessory' | 'conditioning'
  tier: ExerciseTier
  movementFamily?: MovementFamily
  allowedIntents: string[]
  repRange: [number, number]
  durationSeconds?: number  // For timed holds
  restAfterSeconds: number
  notes: string
}

export interface SessionStructure {
  structureId: string
  structureType: SessionStructureType
  structureName: string
  structureDescription: string
  
  // Timing
  recommendedSessionLengthMin: number
  recommendedSessionLengthMax: number
  totalDurationMinutes: number
  
  // Exercise configuration
  exerciseSlots: ExerciseSlot[]
  cycleCount: number  // Number of times to repeat the structure
  
  // Characteristics
  densityLevel: DensityLevel
  fatigueProfile: FatigueProfile
  jointStressLevel: 'low' | 'moderate' | 'high'
  
  // Best use cases
  bestUseCases: StructureUseCase[]
  
  // Framework compatibility
  compatibleFrameworks: CoachingFrameworkId[]
  incompatibleFrameworks: CoachingFrameworkId[]
  
  // Style compatibility
  compatibleStyles: TrainingStyleMode[]
  
  // Constraints
  requiresEquipment: string[]
  minimumExperienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

export type StructureUseCase =
  | 'skill_practice'
  | 'strength_development'
  | 'conditioning'
  | 'weak_point_work'
  | 'time_efficient'
  | 'technique_focus'
  | 'endurance_building'
  | 'hypertrophy_support'
  | 'deload_session'
  | 'density_training'

// =============================================================================
// EMOM STRUCTURE
// =============================================================================

export function buildEMOMStructure(
  durationMinutes: number,
  exerciseCount: 2 | 3 | 4,
  focusArea: 'skill' | 'strength' | 'mixed'
): SessionStructure {
  const minutesPerCycle = exerciseCount
  const cycleCount = Math.floor(durationMinutes / minutesPerCycle)
  
  const slots: ExerciseSlot[] = []
  
  if (focusArea === 'skill' || focusArea === 'mixed') {
    slots.push({
      slotId: 'emom_skill',
      slotType: 'skill',
      tier: 'tier1_core',
      allowedIntents: ['skill_isometric', 'skill_dynamic', 'explosive_power'],
      repRange: [3, 6],
      durationSeconds: 10,
      restAfterSeconds: 0, // Rest is remainder of minute
      notes: 'Technical skill work - quality over volume',
    })
  }
  
  if (focusArea === 'strength' || focusArea === 'mixed') {
    slots.push({
      slotId: 'emom_strength',
      slotType: 'strength',
      tier: 'tier1_core',
      allowedIntents: ['primary_strength', 'weighted_strength'],
      repRange: [4, 8],
      restAfterSeconds: 0,
      notes: 'Strength work - controlled pace',
    })
  }
  
  if (exerciseCount >= 3) {
    slots.push({
      slotId: 'emom_support',
      slotType: 'support',
      tier: 'tier2_support',
      allowedIntents: ['compression_core', 'stability_work', 'pulling_support'],
      repRange: [6, 12],
      restAfterSeconds: 0,
      notes: 'Support work - maintain quality',
    })
  }
  
  if (exerciseCount >= 4) {
    slots.push({
      slotId: 'emom_accessory',
      slotType: 'accessory',
      tier: 'tier3_optional',
      allowedIntents: ['accessory_work', 'conditioning'],
      repRange: [8, 15],
      restAfterSeconds: 0,
      notes: 'Accessory work - controlled fatigue',
    })
  }
  
  return {
    structureId: `emom_${exerciseCount}_${focusArea}_${durationMinutes}`,
    structureType: 'emom',
    structureName: `${durationMinutes}-Minute EMOM`,
    structureDescription: `Every Minute On the Minute with ${exerciseCount} exercises. Structured timing ensures quality reps with built-in rest periods.`,
    
    recommendedSessionLengthMin: 10,
    recommendedSessionLengthMax: 24,
    totalDurationMinutes: durationMinutes,
    
    exerciseSlots: slots,
    cycleCount,
    
    densityLevel: 'moderate',
    fatigueProfile: 'low',
    jointStressLevel: 'moderate',
    
    bestUseCases: ['skill_practice', 'technique_focus', 'time_efficient'],
    
    compatibleFrameworks: ['skill_frequency', 'density_endurance', 'balanced_hybrid'],
    incompatibleFrameworks: ['barseagle_strength'],
    
    compatibleStyles: ['skill_focused', 'power_focused', 'endurance_focused', 'balanced_hybrid'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'beginner',
  }
}

// =============================================================================
// LADDER STRUCTURE
// =============================================================================

export function buildLadderStructure(
  maxHeight: number,
  exerciseCount: 2 | 3,
  ascending: boolean = true
): SessionStructure {
  const slots: ExerciseSlot[] = []
  
  slots.push({
    slotId: 'ladder_primary',
    slotType: 'strength',
    tier: 'tier1_core',
    allowedIntents: ['primary_strength', 'pulling_strength', 'pushing_strength'],
    repRange: [1, maxHeight],
    restAfterSeconds: 15,
    notes: ascending 
      ? `Ascending ladder: 1-2-3-...up to ${maxHeight}`
      : `Descending ladder: ${maxHeight}...3-2-1`,
  })
  
  slots.push({
    slotId: 'ladder_secondary',
    slotType: 'strength',
    tier: 'tier1_core',
    allowedIntents: ['secondary_strength', 'pushing_strength', 'pulling_strength'],
    repRange: [1, maxHeight],
    restAfterSeconds: 15,
    notes: 'Paired movement pattern',
  })
  
  if (exerciseCount >= 3) {
    slots.push({
      slotId: 'ladder_tertiary',
      slotType: 'support',
      tier: 'tier2_support',
      allowedIntents: ['lower_body', 'core_work', 'compression_core'],
      repRange: [2, maxHeight * 2],
      restAfterSeconds: 30,
      notes: 'Supporting movement',
    })
  }
  
  // Calculate approximate duration
  const repsPerCycle = ascending 
    ? (maxHeight * (maxHeight + 1)) / 2 
    : (maxHeight * (maxHeight + 1)) / 2
  const estimatedDuration = Math.round(repsPerCycle * 0.5) // ~30 seconds per round
  
  return {
    structureId: `ladder_${maxHeight}_${exerciseCount}`,
    structureType: 'ladder',
    structureName: `${ascending ? 'Ascending' : 'Descending'} Ladder to ${maxHeight}`,
    structureDescription: `Progressive repetition ${ascending ? 'increase' : 'decrease'}. Builds work capacity while managing fatigue intelligently.`,
    
    recommendedSessionLengthMin: 15,
    recommendedSessionLengthMax: 30,
    totalDurationMinutes: estimatedDuration,
    
    exerciseSlots: slots,
    cycleCount: 1, // Ladders are typically done once
    
    densityLevel: 'moderate',
    fatigueProfile: 'moderate',
    jointStressLevel: 'moderate',
    
    bestUseCases: ['endurance_building', 'technique_focus', 'strength_development'],
    
    compatibleFrameworks: ['density_endurance', 'balanced_hybrid', 'strength_conversion'],
    incompatibleFrameworks: ['tendon_conservative'],
    
    compatibleStyles: ['strength_focused', 'endurance_focused', 'balanced_hybrid'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'intermediate',
  }
}

// =============================================================================
// PYRAMID STRUCTURE
// =============================================================================

export function buildPyramidStructure(
  peakReps: number,
  stepSize: number = 2
): SessionStructure {
  const slots: ExerciseSlot[] = [
    {
      slotId: 'pyramid_primary',
      slotType: 'strength',
      tier: 'tier1_core',
      allowedIntents: ['primary_strength', 'pulling_strength', 'pushing_strength'],
      repRange: [stepSize, peakReps],
      restAfterSeconds: 45,
      notes: `Pyramid: ${stepSize}-${stepSize*2}-...-${peakReps}-...-${stepSize*2}-${stepSize}`,
    },
  ]
  
  // Calculate total reps: going up and down
  const stepsUp = Math.floor(peakReps / stepSize)
  const totalReps = (stepsUp * (stepsUp + 1) * stepSize) - peakReps // Up + down - peak (counted once)
  const estimatedDuration = Math.round(totalReps * 0.4) // ~24 seconds per set average
  
  return {
    structureId: `pyramid_${peakReps}_${stepSize}`,
    structureType: 'pyramid',
    structureName: `Pyramid to ${peakReps}`,
    structureDescription: `Increasing then decreasing rep structure (${stepSize}-${stepSize*2}-...-${peakReps}-...-${stepSize*2}-${stepSize}). Excellent for strength-endurance and hypertrophy.`,
    
    recommendedSessionLengthMin: 15,
    recommendedSessionLengthMax: 25,
    totalDurationMinutes: estimatedDuration,
    
    exerciseSlots: slots,
    cycleCount: 1,
    
    densityLevel: 'high',
    fatigueProfile: 'high',
    jointStressLevel: 'moderate',
    
    bestUseCases: ['hypertrophy_support', 'endurance_building', 'conditioning'],
    
    compatibleFrameworks: ['density_endurance', 'hypertrophy_supported'],
    incompatibleFrameworks: ['skill_frequency', 'barseagle_strength', 'tendon_conservative'],
    
    compatibleStyles: ['hypertrophy_supported', 'endurance_focused'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'intermediate',
  }
}

// =============================================================================
// DENSITY BLOCK STRUCTURE
// =============================================================================

export function buildDensityBlockStructure(
  durationMinutes: number,
  focusArea: 'skill' | 'weak_point' | 'accessory',
  exerciseCount: 2 | 3 | 4 = 3
): SessionStructure {
  const slots: ExerciseSlot[] = []
  
  if (focusArea === 'skill') {
    slots.push({
      slotId: 'density_skill',
      slotType: 'skill',
      tier: 'tier1_core',
      allowedIntents: ['skill_isometric', 'skill_support', 'technique_work'],
      repRange: [3, 5],
      durationSeconds: 8,
      restAfterSeconds: 20,
      notes: 'Skill reinforcement - short, quality holds/reps',
    })
  }
  
  if (focusArea === 'weak_point' || exerciseCount >= 2) {
    slots.push({
      slotId: 'density_limiter',
      slotType: 'support',
      tier: 'tier1_core',
      allowedIntents: ['limiter_work', 'compression_core', 'scapular_control'],
      repRange: [5, 10],
      restAfterSeconds: 15,
      notes: 'Weak point focus - target your limiter',
    })
  }
  
  if (exerciseCount >= 2) {
    slots.push({
      slotId: 'density_support',
      slotType: 'support',
      tier: 'tier2_support',
      allowedIntents: ['support_strength', 'stability_work'],
      repRange: [6, 12],
      restAfterSeconds: 15,
      notes: 'Support work - maintain movement quality',
    })
  }
  
  if (exerciseCount >= 4 || focusArea === 'accessory') {
    slots.push({
      slotId: 'density_accessory',
      slotType: 'accessory',
      tier: 'tier3_optional',
      allowedIntents: ['accessory_work', 'conditioning'],
      repRange: [10, 15],
      restAfterSeconds: 10,
      notes: 'Accessory pump - controlled fatigue',
    })
  }
  
  return {
    structureId: `density_${durationMinutes}_${focusArea}`,
    structureType: 'density_block',
    structureName: `${durationMinutes}-Minute Density Block`,
    structureDescription: `Fixed-time work block with repeated exercises. Excellent for skill reinforcement, weak point work, and accessory volume.`,
    
    recommendedSessionLengthMin: 5,
    recommendedSessionLengthMax: 12,
    totalDurationMinutes: durationMinutes,
    
    exerciseSlots: slots,
    cycleCount: Math.floor(durationMinutes / 2), // Approximate cycles
    
    densityLevel: 'high',
    fatigueProfile: 'moderate',
    jointStressLevel: 'low',
    
    bestUseCases: ['weak_point_work', 'time_efficient', 'density_training', 'technique_focus'],
    
    compatibleFrameworks: ['skill_frequency', 'density_endurance', 'balanced_hybrid'],
    incompatibleFrameworks: ['barseagle_strength'],
    
    compatibleStyles: ['skill_focused', 'endurance_focused', 'balanced_hybrid'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'beginner',
  }
}

// =============================================================================
// SHORT SESSION STRUCTURE
// =============================================================================

export function buildShortSessionStructure(
  durationMinutes: number,
  primaryFocus: 'skill' | 'strength' | 'conditioning'
): SessionStructure {
  const slots: ExerciseSlot[] = []
  
  // Tier 1: Always include skill or main work
  if (primaryFocus === 'skill' || primaryFocus === 'strength') {
    slots.push({
      slotId: 'short_primary',
      slotType: primaryFocus === 'skill' ? 'skill' : 'strength',
      tier: 'tier1_core',
      allowedIntents: primaryFocus === 'skill' 
        ? ['skill_isometric', 'skill_dynamic', 'skill_balance']
        : ['primary_strength', 'weighted_strength'],
      repRange: primaryFocus === 'skill' ? [3, 5] : [5, 8],
      durationSeconds: primaryFocus === 'skill' ? 10 : undefined,
      restAfterSeconds: 90,
      notes: 'Primary focus - maximum quality',
    })
  }
  
  // Tier 2: Main strength if skill-focused, or support
  slots.push({
    slotId: 'short_secondary',
    slotType: 'strength',
    tier: primaryFocus === 'skill' ? 'tier1_core' : 'tier2_support',
    allowedIntents: ['secondary_strength', 'pulling_support', 'pushing_support'],
    repRange: [5, 10],
    restAfterSeconds: 60,
    notes: 'Support movement - maintain balance',
  })
  
  // Tier 3: Condensed weak point or accessory (if time allows)
  if (durationMinutes >= 15) {
    slots.push({
      slotId: 'short_finisher',
      slotType: primaryFocus === 'conditioning' ? 'conditioning' : 'support',
      tier: 'tier3_optional',
      allowedIntents: primaryFocus === 'conditioning'
        ? ['conditioning', 'endurance_work']
        : ['limiter_work', 'compression_core', 'stability_work'],
      repRange: [8, 15],
      restAfterSeconds: 30,
      notes: 'Finisher - targeted work',
    })
  }
  
  return {
    structureId: `short_${durationMinutes}_${primaryFocus}`,
    structureType: 'short_circuit',
    structureName: `${durationMinutes}-Minute Express Session`,
    structureDescription: `Time-efficient session preserving meaningful training stimulus. Focuses on ${primaryFocus === 'skill' ? 'skill exposure' : primaryFocus === 'strength' ? 'strength work' : 'conditioning'} with strategic support work.`,
    
    recommendedSessionLengthMin: 10,
    recommendedSessionLengthMax: 25,
    totalDurationMinutes: durationMinutes,
    
    exerciseSlots: slots,
    cycleCount: 1,
    
    densityLevel: 'moderate',
    fatigueProfile: 'moderate',
    jointStressLevel: 'low',
    
    bestUseCases: ['time_efficient', 'skill_practice', 'technique_focus'],
    
    compatibleFrameworks: ['skill_frequency', 'balanced_hybrid', 'density_endurance'],
    incompatibleFrameworks: [],
    
    compatibleStyles: ['skill_focused', 'strength_focused', 'endurance_focused', 'balanced_hybrid'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'beginner',
  }
}

// =============================================================================
// SKILL MICRO SESSION STRUCTURE
// =============================================================================

export function buildSkillMicroSession(
  skillFocus: string,
  durationMinutes: number = 10
): SessionStructure {
  const slots: ExerciseSlot[] = [
    {
      slotId: 'micro_skill',
      slotType: 'skill',
      tier: 'tier1_core',
      allowedIntents: ['skill_isometric', 'skill_dynamic', 'skill_balance', 'technique_work'],
      repRange: [2, 4],
      durationSeconds: 8,
      restAfterSeconds: 60,
      notes: 'Primary skill focus - perfect practice',
    },
    {
      slotId: 'micro_prep',
      slotType: 'support',
      tier: 'tier2_support',
      allowedIntents: ['skill_support', 'stability_work', 'mobility_activation'],
      repRange: [5, 8],
      restAfterSeconds: 30,
      notes: 'Skill-specific preparation and support',
    },
  ]
  
  return {
    structureId: `micro_${skillFocus}_${durationMinutes}`,
    structureType: 'skill_micro',
    structureName: `${durationMinutes}-Minute ${skillFocus.replace(/_/g, ' ')} Micro Session`,
    structureDescription: `Quick skill-focused session for technique maintenance and motor learning. Low fatigue, high quality.`,
    
    recommendedSessionLengthMin: 5,
    recommendedSessionLengthMax: 15,
    totalDurationMinutes: durationMinutes,
    
    exerciseSlots: slots,
    cycleCount: Math.floor(durationMinutes / 3),
    
    densityLevel: 'low',
    fatigueProfile: 'very_low',
    jointStressLevel: 'low',
    
    bestUseCases: ['skill_practice', 'technique_focus', 'time_efficient', 'deload_session'],
    
    compatibleFrameworks: ['skill_frequency', 'tendon_conservative', 'balanced_hybrid'],
    incompatibleFrameworks: ['barseagle_strength', 'hypertrophy_supported'],
    
    compatibleStyles: ['skill_focused', 'balanced_hybrid'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'beginner',
  }
}

// =============================================================================
// STRUCTURE SELECTION ENGINE
// =============================================================================

export interface StructureSelectionInput {
  availableMinutes: number
  trainingStyle: TrainingStyleMode
  frameworkId?: CoachingFrameworkId
  frameworkRules?: FrameworkRules
  styleRules?: StyleProgrammingRules
  primaryGoal?: string
  primaryWeakPoint?: WeakPointType
  fatigueLevel: 'fresh' | 'normal' | 'fatigued'
  envelopeTolerances?: {
    straightArmPull?: number
    straightArmPush?: number
    verticalPull?: number
  }
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  preferDensityTraining?: boolean
  isDeloadWeek?: boolean
}

export interface StructureSelectionResult {
  selectedStructure: SessionStructure
  selectionScore: number
  selectionReasoning: string[]
  alternativeStructures: SessionStructure[]
  coachingExplanation: string
}

/**
 * Select the most appropriate session structure based on athlete context
 */
export function selectSessionStructure(
  input: StructureSelectionInput
): StructureSelectionResult {
  const candidates: Array<{ structure: SessionStructure; score: number; reasons: string[] }> = []
  
  // Standard structure is always a candidate
  const standardStructure = buildStandardStructure(input.availableMinutes)
  candidates.push({
    structure: standardStructure,
    score: 50, // Baseline score
    reasons: ['Default training structure'],
  })
  
  // Consider EMOM for short-moderate sessions with skill focus
  if (input.availableMinutes >= 10 && input.availableMinutes <= 24) {
    const emom = buildEMOMStructure(
      Math.min(input.availableMinutes, 20),
      input.availableMinutes <= 12 ? 2 : 3,
      input.trainingStyle === 'skill_focused' ? 'skill' : 'mixed'
    )
    let score = 40
    const reasons: string[] = []
    
    if (input.trainingStyle === 'skill_focused') {
      score += 20
      reasons.push('Skill-focused style matches EMOM structure')
    }
    if (input.frameworkId === 'skill_frequency') {
      score += 15
      reasons.push('Skill frequency framework supports EMOM')
    }
    if (input.fatigueLevel === 'fatigued') {
      score += 10
      reasons.push('EMOM provides built-in rest for fatigued athletes')
    }
    if (input.frameworkId === 'barseagle_strength') {
      score -= 30
      reasons.push('Barseagle strength framework incompatible with EMOM')
    }
    
    candidates.push({ structure: emom, score, reasons })
  }
  
  // Consider ladder for intermediate+ athletes wanting endurance
  if (
    input.experienceLevel !== 'beginner' &&
    input.availableMinutes >= 15 &&
    (input.trainingStyle === 'endurance_focused' || input.styleRules?.densityPreference === 'high')
  ) {
    const ladder = buildLadderStructure(
      input.experienceLevel === 'advanced' ? 7 : 5,
      input.availableMinutes <= 20 ? 2 : 3
    )
    let score = 35
    const reasons: string[] = []
    
    if (input.trainingStyle === 'endurance_focused') {
      score += 20
      reasons.push('Endurance focus matches ladder structure')
    }
    if (input.frameworkId === 'density_endurance') {
      score += 15
      reasons.push('Density endurance framework supports ladders')
    }
    if (input.fatigueLevel === 'fatigued') {
      score -= 15
      reasons.push('Ladders not ideal for fatigued state')
    }
    
    candidates.push({ structure: ladder, score, reasons })
  }
  
  // Consider pyramid for hypertrophy-supported training
  if (
    input.trainingStyle === 'hypertrophy_supported' &&
    input.experienceLevel !== 'beginner' &&
    input.availableMinutes >= 15
  ) {
    const pyramid = buildPyramidStructure(10, 2)
    let score = 30
    const reasons: string[] = []
    
    score += 25
    reasons.push('Hypertrophy style matches pyramid structure')
    
    if (input.fatigueLevel === 'fresh') {
      score += 10
      reasons.push('Fresh state supports high-volume pyramid')
    }
    if (input.frameworkId === 'tendon_conservative') {
      score -= 20
      reasons.push('Conservative framework discourages pyramids')
    }
    
    candidates.push({ structure: pyramid, score, reasons })
  }
  
  // Consider density blocks for weak point emphasis or time-crunched training
  if (
    (input.primaryWeakPoint && input.availableMinutes >= 6) ||
    (input.preferDensityTraining && input.availableMinutes <= 20)
  ) {
    const focusArea = input.primaryWeakPoint ? 'weak_point' : 'skill'
    const density = buildDensityBlockStructure(
      Math.min(input.availableMinutes, 10),
      focusArea,
      input.availableMinutes <= 8 ? 2 : 3
    )
    let score = 35
    const reasons: string[] = []
    
    if (input.primaryWeakPoint) {
      score += 20
      reasons.push('Density block targets weak point effectively')
    }
    if (input.preferDensityTraining) {
      score += 15
      reasons.push('Athlete prefers density-style training')
    }
    if (input.frameworkId === 'barseagle_strength') {
      score -= 25
      reasons.push('Heavy strength framework incompatible with density blocks')
    }
    
    candidates.push({ structure: density, score, reasons })
  }
  
  // Consider short sessions for time constraints
  if (input.availableMinutes <= 25) {
    const primaryFocus = input.trainingStyle === 'skill_focused' ? 'skill' 
      : input.trainingStyle === 'strength_focused' ? 'strength' 
      : 'conditioning'
    const shortSession = buildShortSessionStructure(input.availableMinutes, primaryFocus)
    let score = 45
    const reasons: string[] = []
    
    if (input.availableMinutes <= 15) {
      score += 20
      reasons.push('Very limited time favors short session structure')
    }
    reasons.push('Time-efficient session preserves core training')
    
    candidates.push({ structure: shortSession, score, reasons })
  }
  
  // Consider skill micro for deload or very short sessions
  if (input.isDeloadWeek || (input.availableMinutes <= 15 && input.trainingStyle === 'skill_focused')) {
    const micro = buildSkillMicroSession(input.primaryGoal || 'general', Math.min(input.availableMinutes, 10))
    let score = 30
    const reasons: string[] = []
    
    if (input.isDeloadWeek) {
      score += 30
      reasons.push('Skill micro ideal for deload week')
    }
    if (input.trainingStyle === 'skill_focused' && input.availableMinutes <= 15) {
      score += 15
      reasons.push('Short skill-focused session matches micro format')
    }
    
    candidates.push({ structure: micro, score, reasons })
  }
  
  // Sort by score and select
  candidates.sort((a, b) => b.score - a.score)
  const selected = candidates[0]
  const alternatives = candidates.slice(1, 4).map(c => c.structure)
  
  // Generate coaching explanation
  const coachingExplanation = generateStructureExplanation(selected.structure, input, selected.reasons)
  
  return {
    selectedStructure: selected.structure,
    selectionScore: selected.score,
    selectionReasoning: selected.reasons,
    alternativeStructures: alternatives,
    coachingExplanation,
  }
}

// =============================================================================
// STANDARD STRUCTURE (DEFAULT)
// =============================================================================

function buildStandardStructure(durationMinutes: number): SessionStructure {
  const slots: ExerciseSlot[] = [
    {
      slotId: 'standard_skill',
      slotType: 'skill',
      tier: 'tier1_core',
      allowedIntents: ['skill_isometric', 'skill_dynamic', 'skill_balance'],
      repRange: [3, 5],
      durationSeconds: 10,
      restAfterSeconds: 120,
      notes: 'Primary skill work - full rest for quality',
    },
    {
      slotId: 'standard_strength',
      slotType: 'strength',
      tier: 'tier1_core',
      allowedIntents: ['primary_strength', 'weighted_strength', 'secondary_strength'],
      repRange: [5, 8],
      restAfterSeconds: 90,
      notes: 'Main strength work',
    },
    {
      slotId: 'standard_support',
      slotType: 'support',
      tier: 'tier2_support',
      allowedIntents: ['support_strength', 'pulling_support', 'pushing_support'],
      repRange: [6, 12],
      restAfterSeconds: 60,
      notes: 'Support and accessory work',
    },
  ]
  
  if (durationMinutes >= 45) {
    slots.push({
      slotId: 'standard_accessory',
      slotType: 'accessory',
      tier: 'tier3_optional',
      allowedIntents: ['accessory_work', 'limiter_work', 'conditioning'],
      repRange: [8, 15],
      restAfterSeconds: 45,
      notes: 'Optional accessory and weak point work',
    })
  }
  
  return {
    structureId: `standard_${durationMinutes}`,
    structureType: 'standard',
    structureName: 'Standard Training Session',
    structureDescription: 'Traditional block-based training structure with skill work first, followed by strength and support work.',
    
    recommendedSessionLengthMin: 30,
    recommendedSessionLengthMax: 90,
    totalDurationMinutes: durationMinutes,
    
    exerciseSlots: slots,
    cycleCount: 1,
    
    densityLevel: 'moderate',
    fatigueProfile: 'moderate',
    jointStressLevel: 'moderate',
    
    bestUseCases: ['strength_development', 'skill_practice', 'technique_focus'],
    
    compatibleFrameworks: ['skill_frequency', 'barseagle_strength', 'strength_conversion', 'balanced_hybrid', 'tendon_conservative', 'hypertrophy_supported', 'density_endurance'],
    incompatibleFrameworks: [],
    
    compatibleStyles: ['skill_focused', 'strength_focused', 'power_focused', 'endurance_focused', 'hypertrophy_supported', 'balanced_hybrid'],
    
    requiresEquipment: [],
    minimumExperienceLevel: 'beginner',
  }
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

function generateStructureExplanation(
  structure: SessionStructure,
  input: StructureSelectionInput,
  reasons: string[]
): string {
  const explanations: Record<SessionStructureType, (input: StructureSelectionInput) => string> = {
    standard: () => 
      'Your workout follows a traditional structure with skill work first, followed by strength and support movements. This proven format ensures quality practice when you are freshest.',
    
    emom: (input) => 
      `Your workout uses a ${structure.totalDurationMinutes}-minute EMOM (Every Minute On the Minute) structure. This format provides ${input.fatigueLevel === 'fatigued' ? 'built-in recovery time to manage your current fatigue' : 'structured timing that encourages quality reps with consistent rest periods'}.`,
    
    ladder: () =>
      'Your workout uses a ladder structure with progressively increasing reps. This builds work capacity while naturally managing fatigue through varying intensity.',
    
    pyramid: () =>
      'Your workout uses a pyramid structure, ramping up then back down in reps. This is excellent for strength-endurance development and controlled hypertrophy stimulus.',
    
    density_block: (input) =>
      input.primaryWeakPoint
        ? `Your workout includes a density block to reinforce ${input.primaryWeakPoint.replace(/_/g, ' ')} - your current limiter. The timed format accumulates quality volume efficiently.`
        : 'Your workout uses a density block to reinforce skill work in a time-efficient format.',
    
    short_circuit: (input) =>
      `Your ${input.availableMinutes}-minute express session preserves meaningful training stimulus despite limited time. Focus areas are prioritized while maintaining quality.`,
    
    skill_micro: (input) =>
      input.isDeloadWeek
        ? 'This skill micro-session maintains motor patterns during your deload week with minimal fatigue accumulation.'
        : `This ${structure.totalDurationMinutes}-minute micro-session focuses on quality skill practice with low fatigue impact.`,
  }
  
  return explanations[structure.structureType](input)
}

// =============================================================================
// ENVELOPE-AWARE STRUCTURE ADJUSTMENT
// =============================================================================

export interface EnvelopeAdjustedStructure {
  structure: SessionStructure
  adjustments: string[]
  volumeReduction: number
  safetyNotes: string[]
}

/**
 * Adjust a session structure based on Performance Envelope limits
 */
export function adjustStructureForEnvelope(
  structure: SessionStructure,
  envelopeTolerances: {
    straightArmPull?: number
    straightArmPush?: number
    verticalPull?: number
    compressionCore?: number
  }
): EnvelopeAdjustedStructure {
  const adjustments: string[] = []
  const safetyNotes: string[] = []
  let volumeReduction = 0
  
  // Clone structure for modification
  const adjusted: SessionStructure = JSON.parse(JSON.stringify(structure))
  
  // Check straight-arm tolerances
  if (envelopeTolerances.straightArmPull !== undefined && envelopeTolerances.straightArmPull < 50) {
    // Reduce straight-arm work
    adjusted.exerciseSlots = adjusted.exerciseSlots.map(slot => {
      if (slot.allowedIntents.includes('skill_isometric') || slot.allowedIntents.includes('straight_arm_pull')) {
        const reduction = Math.round((1 - envelopeTolerances.straightArmPull! / 100) * 30)
        volumeReduction += reduction
        adjustments.push('Reduced straight-arm pull volume due to envelope limits')
        return {
          ...slot,
          repRange: [
            Math.max(1, slot.repRange[0] - 1),
            Math.max(2, slot.repRange[1] - 2),
          ] as [number, number],
        }
      }
      return slot
    })
    safetyNotes.push('Monitor straight-arm pulling fatigue carefully')
  }
  
  if (envelopeTolerances.straightArmPush !== undefined && envelopeTolerances.straightArmPush < 50) {
    adjusted.exerciseSlots = adjusted.exerciseSlots.map(slot => {
      if (slot.allowedIntents.includes('straight_arm_push') || slot.allowedIntents.includes('planche_work')) {
        const reduction = Math.round((1 - envelopeTolerances.straightArmPush! / 100) * 30)
        volumeReduction += reduction
        adjustments.push('Reduced straight-arm push volume due to envelope limits')
        return {
          ...slot,
          repRange: [
            Math.max(1, slot.repRange[0] - 1),
            Math.max(2, slot.repRange[1] - 2),
          ] as [number, number],
        }
      }
      return slot
    })
    safetyNotes.push('Wrist and shoulder stress should be monitored')
  }
  
  // Density adjustments based on overall tolerance
  if (structure.densityLevel === 'high' || structure.densityLevel === 'very_high') {
    const avgTolerance = Object.values(envelopeTolerances).reduce((a, b) => (a || 0) + (b || 0), 0) / 
      Object.values(envelopeTolerances).filter(v => v !== undefined).length
    
    if (avgTolerance < 40) {
      adjusted.densityLevel = 'moderate'
      adjustments.push('Reduced density level for recovery capacity')
      volumeReduction += 15
    }
  }
  
  return {
    structure: adjusted,
    adjustments,
    volumeReduction,
    safetyNotes,
  }
}

// =============================================================================
// WEAK POINT INTEGRATION
// =============================================================================

/**
 * Modify structure to emphasize weak points
 */
export function integrateWeakPointIntoStructure(
  structure: SessionStructure,
  weakPoint: WeakPointType,
  severity: number
): SessionStructure {
  const modified = JSON.parse(JSON.stringify(structure)) as SessionStructure
  
  // Map weak points to intents
  const weakPointIntentMap: Record<string, string[]> = {
    compression_strength: ['compression_core', 'limiter_work', 'core_work'],
    scapular_control: ['scapular_control', 'stability_work', 'pulling_support'],
    shoulder_stability: ['stability_work', 'shoulder_support', 'ring_support'],
    straight_arm_pull_strength: ['straight_arm_pull', 'skill_isometric', 'pulling_support'],
    straight_arm_push_strength: ['straight_arm_push', 'skill_isometric', 'pushing_support'],
    wrist_mobility: ['mobility_activation', 'wrist_prep'],
    hip_flexor_strength: ['compression_core', 'hip_flexor_work'],
    pulling_endurance: ['pulling_support', 'endurance_work'],
    pushing_endurance: ['pushing_support', 'endurance_work'],
  }
  
  const targetIntents = weakPointIntentMap[weakPoint] || ['limiter_work']
  
  // Find or add a slot for weak point work
  const existingSupportSlot = modified.exerciseSlots.find(s => s.tier === 'tier2_support')
  
  if (existingSupportSlot) {
    // Modify existing support slot to include weak point intents
    existingSupportSlot.allowedIntents = [...targetIntents, ...existingSupportSlot.allowedIntents]
    existingSupportSlot.notes = `Emphasizes ${weakPoint.replace(/_/g, ' ')} - your current limiter`
  } else {
    // Add a weak point slot
    modified.exerciseSlots.push({
      slotId: 'weak_point_focus',
      slotType: 'support',
      tier: 'tier2_support',
      allowedIntents: targetIntents,
      repRange: severity > 70 ? [8, 15] : [5, 10],
      restAfterSeconds: 45,
      notes: `Targets ${weakPoint.replace(/_/g, ' ')} - priority limiter work`,
    })
  }
  
  return modified
}

// =============================================================================
// TRAINING STYLE INTEGRATION
// =============================================================================

export type ExtendedTrainingStyleMode = 
  | TrainingStyleMode
  | 'short_session_training'
  | 'density_training'
  | 'skill_micro_session'

/**
 * Get recommended structure type based on training style
 */
export function getRecommendedStructureForStyle(
  style: ExtendedTrainingStyleMode,
  availableMinutes: number
): SessionStructureType {
  const styleStructureMap: Record<ExtendedTrainingStyleMode, SessionStructureType[]> = {
    skill_focused: ['standard', 'emom', 'skill_micro'],
    strength_focused: ['standard', 'ladder'],
    power_focused: ['standard', 'emom'],
    endurance_focused: ['ladder', 'pyramid', 'density_block'],
    hypertrophy_supported: ['standard', 'pyramid'],
    balanced_hybrid: ['standard', 'emom', 'density_block'],
    short_session_training: ['short_circuit', 'emom', 'density_block'],
    density_training: ['density_block', 'emom', 'ladder'],
    skill_micro_session: ['skill_micro', 'emom'],
  }
  
  const preferences = styleStructureMap[style]
  
  // Filter by time constraints
  if (availableMinutes <= 15) {
    if (preferences.includes('short_circuit')) return 'short_circuit'
    if (preferences.includes('skill_micro')) return 'skill_micro'
    if (preferences.includes('emom')) return 'emom'
    return 'short_circuit'
  }
  
  if (availableMinutes <= 25) {
    if (preferences.includes('emom')) return 'emom'
    if (preferences.includes('density_block')) return 'density_block'
    if (preferences.includes('short_circuit')) return 'short_circuit'
  }
  
  return preferences[0]
}

// =============================================================================
// OVERUSE PREVENTION
// =============================================================================

export interface StructureUsageHistory {
  structureType: SessionStructureType
  usedAt: Date
  sessionId: string
}

/**
 * Check if a structure has been overused recently
 */
export function checkStructureOveruse(
  structureType: SessionStructureType,
  history: StructureUsageHistory[],
  windowDays: number = 7
): { isOverused: boolean; usageCount: number; recommendation: string } {
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - windowDays)
  
  const recentUsage = history.filter(h => 
    h.structureType === structureType && 
    new Date(h.usedAt) >= windowStart
  )
  
  // Define overuse thresholds
  const overuseThresholds: Record<SessionStructureType, number> = {
    standard: 5,      // Standard can be used frequently
    emom: 3,          // EMOM should be limited
    ladder: 2,        // Ladders need recovery
    pyramid: 2,       // Pyramids are taxing
    density_block: 3, // Density blocks moderate use
    short_circuit: 4, // Short sessions can be frequent
    skill_micro: 5,   // Micro sessions low impact
  }
  
  const threshold = overuseThresholds[structureType]
  const isOverused = recentUsage.length >= threshold
  
  let recommendation = ''
  if (isOverused) {
    if (structureType === 'pyramid' || structureType === 'ladder') {
      recommendation = 'Consider a standard or EMOM structure to allow recovery from high-density work.'
    } else if (structureType === 'emom' || structureType === 'density_block') {
      recommendation = 'A standard training session would provide beneficial variety.'
    } else {
      recommendation = 'Consider varying your session structure for continued adaptation.'
    }
  }
  
  return {
    isOverused,
    usageCount: recentUsage.length,
    recommendation,
  }
}

// =============================================================================
// ADDITIONAL COACHING EXPLANATIONS
// =============================================================================

/**
 * Generate a detailed coaching explanation for why a structure was selected
 */
export function getStructureCoachingDetails(
  structure: SessionStructure,
  selectionReasons: string[]
): {
  headline: string
  rationale: string
  benefits: string[]
  tips: string[]
} {
  const structureDetails: Record<SessionStructureType, {
    headline: string
    benefits: string[]
    tips: string[]
  }> = {
    standard: {
      headline: 'Traditional Training Structure',
      benefits: [
        'Optimal sequencing for skill development',
        'Full rest periods preserve movement quality',
        'Proven format for strength and skill gains',
      ],
      tips: [
        'Focus on quality over quantity',
        'Take full rest between skill sets',
        'End each exercise on a good rep',
      ],
    },
    emom: {
      headline: 'Every Minute On the Minute',
      benefits: [
        'Built-in rest periods manage fatigue',
        'Structured timing improves consistency',
        'Excellent for skill practice and maintenance',
      ],
      tips: [
        'Choose reps you can complete with good form',
        'Use the rest to actively recover',
        'Stay 2-3 reps from failure',
      ],
    },
    ladder: {
      headline: 'Progressive Ladder',
      benefits: [
        'Builds work capacity systematically',
        'Natural fatigue management through structure',
        'Great for technique under accumulating fatigue',
      ],
      tips: [
        'Maintain form even as reps increase',
        'Keep rest short but meaningful',
        'Know your limit and respect it',
      ],
    },
    pyramid: {
      headline: 'Pyramid Training',
      benefits: [
        'High total volume for muscle development',
        'Manages fatigue through descending phase',
        'Excellent strength-endurance stimulus',
      ],
      tips: [
        'Pace yourself on the way up',
        'Push through the descent',
        'Stay mentally engaged throughout',
      ],
    },
    density_block: {
      headline: 'Density Training Block',
      benefits: [
        'Time-efficient skill reinforcement',
        'Targets weak points effectively',
        'Accumulates quality volume quickly',
      ],
      tips: [
        'Keep movements controlled',
        'Focus on your target weak point',
        'Track total reps to monitor progress',
      ],
    },
    short_circuit: {
      headline: 'Express Training Session',
      benefits: [
        'Maximizes limited time',
        'Preserves core training stimulus',
        'Maintains training consistency',
      ],
      tips: [
        'Prioritize the most important movements',
        'Quality over quantity is essential',
        'Something is always better than nothing',
      ],
    },
    skill_micro: {
      headline: 'Skill Micro-Session',
      benefits: [
        'Maintains motor patterns with low fatigue',
        'Perfect for busy days or deload periods',
        'Keeps skill sharp without overtraining',
      ],
      tips: [
        'Focus on perfect practice',
        'Stop before fatigue affects form',
        'Use this to build frequency',
      ],
    },
  }
  
  const details = structureDetails[structure.structureType]
  
  return {
    headline: details.headline,
    rationale: selectionReasons.length > 0 
      ? `Selected because: ${selectionReasons.slice(0, 3).join('. ')}.`
      : `${structure.structureDescription}`,
    benefits: details.benefits,
    tips: details.tips,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  selectSessionStructure,
  buildEMOMStructure,
  buildLadderStructure,
  buildPyramidStructure,
  buildDensityBlockStructure,
  buildShortSessionStructure,
  buildSkillMicroSession,
  adjustStructureForEnvelope,
  integrateWeakPointIntoStructure,
  getRecommendedStructureForStyle,
  checkStructureOveruse,
  getStructureCoachingDetails,
}
