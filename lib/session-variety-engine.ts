/**
 * Session Variety Engine
 * Ensures workout variety across the training week while preserving intentional repetition
 * 
 * Core principles:
 * - Repetition is allowed only when justified by coaching logic
 * - Variation should be purposeful, not random
 * - Weekly coherence must be maintained
 */

import type { DayFocus } from './program-structure-engine'
import type { MovementFamily } from './movement-family-registry'
import type { TrainingStyleMode } from './unified-coaching-engine'
import type { SkillType } from './training-principles-engine'

// =============================================================================
// SESSION INTENT MODEL
// =============================================================================

export type SessionType = 
  | 'skill_exposure'      // High-quality skill practice, low fatigue
  | 'strength_emphasis'   // Heavy loading, high neural demand
  | 'support_volume'      // Accessory work, moderate intensity
  | 'technique_day'       // Form refinement, submaximal
  | 'density_day'         // Higher volume, shorter rest
  | 'joint_support_day'   // Tendon/joint health focus
  | 'power_day'           // Explosive movements
  | 'mixed_capacity'      // Balanced development

export type FatigueProfile = 
  | 'high_neural'         // High CNS demand (heavy strength, complex skills)
  | 'moderate_mixed'      // Balanced demand
  | 'low_accumulation'    // Volume-focused, lower intensity
  | 'recovery_oriented'   // Minimal stress, joint health

export interface SessionIntent {
  sessionType: SessionType
  primarySkill: SkillType | null
  primaryMovementFamilies: MovementFamily[]
  primaryConstraintTarget: string | null
  secondarySupportFocus: string[]
  fatigueProfile: FatigueProfile
  intensityLevel: 'high' | 'moderate' | 'low'
  volumeLevel: 'high' | 'moderate' | 'low'
  
  // Exercise variation hints
  exerciseVariant: 'A' | 'B' | 'C' | null
  supportVariant: 'primary' | 'secondary' | 'tertiary'
  
  // Justification for this intent
  rationale: string
}

// =============================================================================
// VARIATION DIMENSIONS
// =============================================================================

export interface VariationDimensions {
  exerciseSelection: 'same' | 'varied' | 'complementary'
  emphasis: 'static' | 'dynamic' | 'strength' | 'control'
  progressionMethod: 'hold' | 'eccentric' | 'concentric' | 'isometric'
  supportWork: 'primary' | 'secondary' | 'accessory'
  repSetStyle: 'low_rep_high_set' | 'moderate' | 'high_rep_low_set'
  densityStructure: 'long_rest' | 'moderate_rest' | 'density_circuit'
  fatigueLoad: 'high' | 'moderate' | 'low'
}

// =============================================================================
// DUPLICATE SESSION DETECTION
// =============================================================================

export interface SessionSignature {
  dayNumber: number
  sessionType: SessionType
  primarySkill: SkillType | null
  primaryFamilies: MovementFamily[]
  mainExercises: string[]
  supportExercises: string[]
  fatigueProfile: FatigueProfile
}

export interface DuplicationResult {
  isDuplicate: boolean
  duplicateOf: number | null
  similarityScore: number // 0-1, 1 = identical
  matchedDimensions: string[]
  justificationAllowed: boolean
  justificationReason: string | null
}

/**
 * Check if two sessions are functionally duplicate
 */
export function detectDuplicateSession(
  session: SessionSignature,
  otherSessions: SessionSignature[]
): DuplicationResult {
  for (const other of otherSessions) {
    if (other.dayNumber === session.dayNumber) continue
    
    const similarity = calculateSessionSimilarity(session, other)
    
    if (similarity.score >= 0.85) {
      // Check if repetition is justified
      const justification = checkRepetitionJustification(session, other, similarity)
      
      return {
        isDuplicate: !justification.allowed,
        duplicateOf: other.dayNumber,
        similarityScore: similarity.score,
        matchedDimensions: similarity.matchedDimensions,
        justificationAllowed: justification.allowed,
        justificationReason: justification.reason,
      }
    }
  }
  
  return {
    isDuplicate: false,
    duplicateOf: null,
    similarityScore: 0,
    matchedDimensions: [],
    justificationAllowed: true,
    justificationReason: null,
  }
}

interface SimilarityResult {
  score: number
  matchedDimensions: string[]
}

function calculateSessionSimilarity(a: SessionSignature, b: SessionSignature): SimilarityResult {
  const matchedDimensions: string[] = []
  let score = 0
  const weights = {
    sessionType: 0.15,
    primarySkill: 0.20,
    primaryFamilies: 0.20,
    mainExercises: 0.25,
    supportExercises: 0.10,
    fatigueProfile: 0.10,
  }
  
  // Session type match
  if (a.sessionType === b.sessionType) {
    score += weights.sessionType
    matchedDimensions.push('session_type')
  }
  
  // Primary skill match
  if (a.primarySkill && b.primarySkill && a.primarySkill === b.primarySkill) {
    score += weights.primarySkill
    matchedDimensions.push('primary_skill')
  }
  
  // Movement family overlap
  const familyOverlap = a.primaryFamilies.filter(f => b.primaryFamilies.includes(f))
  const familyScore = familyOverlap.length / Math.max(a.primaryFamilies.length, b.primaryFamilies.length, 1)
  score += familyScore * weights.primaryFamilies
  if (familyScore > 0.5) matchedDimensions.push('movement_families')
  
  // Main exercise overlap
  const mainOverlap = a.mainExercises.filter(e => b.mainExercises.includes(e))
  const mainScore = mainOverlap.length / Math.max(a.mainExercises.length, b.mainExercises.length, 1)
  score += mainScore * weights.mainExercises
  if (mainScore > 0.5) matchedDimensions.push('main_exercises')
  
  // Support exercise overlap
  const supportOverlap = a.supportExercises.filter(e => b.supportExercises.includes(e))
  const supportScore = supportOverlap.length / Math.max(a.supportExercises.length, b.supportExercises.length, 1)
  score += supportScore * weights.supportExercises
  if (supportScore > 0.5) matchedDimensions.push('support_exercises')
  
  // Fatigue profile match
  if (a.fatigueProfile === b.fatigueProfile) {
    score += weights.fatigueProfile
    matchedDimensions.push('fatigue_profile')
  }
  
  return { score, matchedDimensions }
}

// =============================================================================
// ACCEPTABLE REPETITION RULES
// =============================================================================

interface JustificationResult {
  allowed: boolean
  reason: string | null
}

/**
 * Check if repetition between two similar sessions is acceptable
 */
function checkRepetitionJustification(
  session: SessionSignature,
  duplicate: SessionSignature,
  similarity: SimilarityResult
): JustificationResult {
  // Rule 1: Low-fatigue skill exposures are allowed to repeat
  if (
    session.sessionType === 'skill_exposure' &&
    session.fatigueProfile === 'low_accumulation'
  ) {
    return {
      allowed: true,
      reason: 'Repeated low-fatigue exposure is optimal for skill acquisition',
    }
  }
  
  // Rule 2: Technique days can repeat for motor learning
  if (session.sessionType === 'technique_day') {
    return {
      allowed: true,
      reason: 'Consistent technique practice supports motor learning',
    }
  }
  
  // Rule 3: Straight-arm skill practice benefits from consistency
  const straightArmFamilies: MovementFamily[] = ['straight_arm_pull', 'straight_arm_push']
  const hasMainlyStraightArm = session.primaryFamilies.some(f => straightArmFamilies.includes(f))
  if (hasMainlyStraightArm && session.fatigueProfile !== 'high_neural') {
    return {
      allowed: true,
      reason: 'Straight-arm skill work benefits from consistent structure',
    }
  }
  
  // Rule 4: Joint support days can repeat if needed for recovery
  if (session.sessionType === 'joint_support_day') {
    return {
      allowed: true,
      reason: 'Tendon health protocols benefit from repeated exposure',
    }
  }
  
  // Rule 5: High similarity with no justification = not allowed
  if (similarity.score >= 0.90 && similarity.matchedDimensions.includes('main_exercises')) {
    return {
      allowed: false,
      reason: null,
    }
  }
  
  // Default: moderate similarity is acceptable
  return {
    allowed: similarity.score < 0.85,
    reason: similarity.score < 0.85 ? 'Sessions have sufficient variation' : null,
  }
}

// =============================================================================
// VARIATION GENERATOR
// =============================================================================

export interface VariationConfig {
  skill: SkillType
  trainingStyle: TrainingStyleMode
  primaryConstraint: string | null
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  weeklyDays: number
  existingIntents: SessionIntent[]
}

/**
 * Generate varied session intents for a week
 */
export function generateWeeklySessionIntents(config: VariationConfig): SessionIntent[] {
  const { skill, trainingStyle, primaryConstraint, experienceLevel, weeklyDays, existingIntents } = config
  const intents: SessionIntent[] = []
  
  // Get skill-specific movement families
  const skillFamilies = getSkillMovementFamilies(skill)
  
  // Determine base session distribution
  const distribution = getSessionDistribution(weeklyDays, trainingStyle, experienceLevel)
  
  for (let day = 1; day <= weeklyDays; day++) {
    const dayDistribution = distribution[day - 1]
    
    // Build intent with appropriate variation
    const intent = buildSessionIntent({
      dayNumber: day,
      skill,
      families: skillFamilies,
      constraint: primaryConstraint,
      distribution: dayDistribution,
      trainingStyle,
      experienceLevel,
      existingIntents: intents,
    })
    
    intents.push(intent)
  }
  
  return intents
}

interface SessionDistribution {
  type: SessionType
  isPrimary: boolean
  variant: 'A' | 'B' | 'C'
  supportVariant: 'primary' | 'secondary' | 'tertiary'
}

function getSessionDistribution(
  days: number,
  style: TrainingStyleMode,
  level: 'beginner' | 'intermediate' | 'advanced'
): SessionDistribution[] {
  // 2-day distribution
  if (days === 2) {
    if (style === 'skill') {
      return [
        { type: 'skill_exposure', isPrimary: true, variant: 'A', supportVariant: 'primary' },
        { type: 'support_volume', isPrimary: false, variant: 'B', supportVariant: 'secondary' },
      ]
    }
    return [
      { type: 'strength_emphasis', isPrimary: true, variant: 'A', supportVariant: 'primary' },
      { type: 'skill_exposure', isPrimary: false, variant: 'B', supportVariant: 'secondary' },
    ]
  }
  
  // 3-day distribution
  if (days === 3) {
    if (style === 'skill') {
      return [
        { type: 'skill_exposure', isPrimary: true, variant: 'A', supportVariant: 'primary' },
        { type: 'technique_day', isPrimary: true, variant: 'B', supportVariant: 'secondary' },
        { type: 'support_volume', isPrimary: false, variant: 'C', supportVariant: 'tertiary' },
      ]
    }
    if (style === 'strength') {
      return [
        { type: 'strength_emphasis', isPrimary: true, variant: 'A', supportVariant: 'primary' },
        { type: 'skill_exposure', isPrimary: true, variant: 'B', supportVariant: 'secondary' },
        { type: 'support_volume', isPrimary: false, variant: 'C', supportVariant: 'tertiary' },
      ]
    }
    // Default mixed
    return [
      { type: 'skill_exposure', isPrimary: true, variant: 'A', supportVariant: 'primary' },
      { type: 'strength_emphasis', isPrimary: true, variant: 'B', supportVariant: 'secondary' },
      { type: 'density_day', isPrimary: false, variant: 'C', supportVariant: 'tertiary' },
    ]
  }
  
  // 4-day distribution
  if (days === 4) {
    if (style === 'skill') {
      return [
        { type: 'skill_exposure', isPrimary: true, variant: 'A', supportVariant: 'primary' },
        { type: 'technique_day', isPrimary: true, variant: 'B', supportVariant: 'secondary' },
        { type: 'skill_exposure', isPrimary: true, variant: 'A', supportVariant: 'secondary' }, // Intentional repeat
        { type: 'support_volume', isPrimary: false, variant: 'C', supportVariant: 'tertiary' },
      ]
    }
    return [
      { type: 'strength_emphasis', isPrimary: true, variant: 'A', supportVariant: 'primary' },
      { type: 'skill_exposure', isPrimary: true, variant: 'B', supportVariant: 'secondary' },
      { type: 'support_volume', isPrimary: false, variant: 'C', supportVariant: 'tertiary' },
      { type: 'density_day', isPrimary: false, variant: 'B', supportVariant: 'secondary' },
    ]
  }
  
  // 5-day distribution
  return [
    { type: 'skill_exposure', isPrimary: true, variant: 'A', supportVariant: 'primary' },
    { type: 'strength_emphasis', isPrimary: true, variant: 'B', supportVariant: 'secondary' },
    { type: 'technique_day', isPrimary: true, variant: 'A', supportVariant: 'primary' },
    { type: 'support_volume', isPrimary: false, variant: 'C', supportVariant: 'tertiary' },
    { type: 'density_day', isPrimary: false, variant: 'B', supportVariant: 'secondary' },
  ]
}

interface IntentBuilderInput {
  dayNumber: number
  skill: SkillType
  families: MovementFamily[]
  constraint: string | null
  distribution: SessionDistribution
  trainingStyle: TrainingStyleMode
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  existingIntents: SessionIntent[]
}

function buildSessionIntent(input: IntentBuilderInput): SessionIntent {
  const { dayNumber, skill, families, constraint, distribution, trainingStyle, experienceLevel, existingIntents } = input
  
  // Determine fatigue profile from session type
  const fatigueProfile = getFatigueProfileForSessionType(distribution.type)
  
  // Get secondary support focus based on variant
  const secondaryFocus = getSecondaryFocus(skill, distribution.supportVariant, constraint)
  
  // Build rationale
  const rationale = buildSessionRationale(distribution, skill, trainingStyle, dayNumber)
  
  return {
    sessionType: distribution.type,
    primarySkill: skill,
    primaryMovementFamilies: families,
    primaryConstraintTarget: constraint,
    secondarySupportFocus: secondaryFocus,
    fatigueProfile,
    intensityLevel: distribution.isPrimary ? 'high' : 'moderate',
    volumeLevel: distribution.type === 'support_volume' || distribution.type === 'density_day' ? 'high' : 'moderate',
    exerciseVariant: distribution.variant,
    supportVariant: distribution.supportVariant,
    rationale,
  }
}

function getFatigueProfileForSessionType(type: SessionType): FatigueProfile {
  switch (type) {
    case 'strength_emphasis':
    case 'power_day':
      return 'high_neural'
    case 'skill_exposure':
    case 'technique_day':
      return 'low_accumulation'
    case 'density_day':
    case 'support_volume':
      return 'moderate_mixed'
    case 'joint_support_day':
      return 'recovery_oriented'
    default:
      return 'moderate_mixed'
  }
}

function getSecondaryFocus(skill: SkillType, variant: 'primary' | 'secondary' | 'tertiary', constraint: string | null): string[] {
  const baseSupport: Record<SkillType, string[][]> = {
    front_lever: [
      ['weighted_pull', 'compression'],
      ['rows', 'scapular_control'],
      ['bicep_curl', 'core_anti_extension'],
    ],
    planche: [
      ['weighted_dip', 'shoulder_protraction'],
      ['pseudo_planche', 'wrist_prep'],
      ['tricep_extension', 'serratus_work'],
    ],
    muscle_up: [
      ['weighted_pull', 'explosive_pull'],
      ['straight_bar_dip', 'transition_drill'],
      ['ring_support', 'kipping_practice'],
    ],
    hspu: [
      ['pike_push', 'shoulder_press'],
      ['handstand_hold', 'wall_slides'],
      ['face_pull', 'rear_delt'],
    ],
    back_lever: [
      ['skin_the_cat', 'shoulder_extension'],
      ['german_hang', 'bicep_curl'],
      ['rear_delt', 'core_work'],
    ],
    iron_cross: [
      ['ring_support', 'cross_pull'],
      ['wide_ring_fly', 'bicep_curl'],
      ['shoulder_rehab', 'tendon_conditioning'],
    ],
    l_sit: [
      ['compression', 'pike_stretch'],
      ['hanging_leg_raise', 'hip_flexor'],
      ['support_hold', 'wrist_prep'],
    ],
    weighted_strength: [
      ['weighted_pull', 'weighted_dip'],
      ['rows', 'push_ups'],
      ['accessory_arm', 'core'],
    ],
    general: [
      ['pull', 'push'],
      ['core', 'mobility'],
      ['accessory', 'conditioning'],
    ],
  }
  
  const variantIndex = variant === 'primary' ? 0 : variant === 'secondary' ? 1 : 2
  const skillSupport = baseSupport[skill] || baseSupport.general
  const focus = [...(skillSupport[variantIndex] || skillSupport[0])]
  
  // Add constraint-specific focus if relevant
  if (constraint) {
    focus.push(constraint.replace(/_/g, ' '))
  }
  
  return focus
}

function buildSessionRationale(
  distribution: SessionDistribution,
  skill: SkillType,
  style: TrainingStyleMode,
  dayNumber: number
): string {
  const skillName = skill.replace(/_/g, ' ')
  
  switch (distribution.type) {
    case 'skill_exposure':
      return `Day ${dayNumber} focuses on high-quality ${skillName} practice with fresh neural output.`
    case 'strength_emphasis':
      return `Day ${dayNumber} emphasizes strength development to support ${skillName} progression.`
    case 'technique_day':
      return `Day ${dayNumber} prioritizes technique refinement for ${skillName} at submaximal intensity.`
    case 'support_volume':
      return `Day ${dayNumber} builds supporting muscle capacity for ${skillName} without high CNS demand.`
    case 'density_day':
      return `Day ${dayNumber} uses higher volume with moderate rest to build work capacity for ${skillName}.`
    case 'joint_support_day':
      return `Day ${dayNumber} focuses on tendon health and joint preparation for ${skillName} demands.`
    case 'power_day':
      return `Day ${dayNumber} develops explosive qualities needed for ${skillName}.`
    default:
      return `Day ${dayNumber} provides balanced training supporting ${skillName} development.`
  }
}

function getSkillMovementFamilies(skill: SkillType): MovementFamily[] {
  const skillFamilyMap: Record<SkillType, MovementFamily[]> = {
    front_lever: ['straight_arm_pull', 'horizontal_pull', 'compression_core'],
    planche: ['straight_arm_push', 'horizontal_push', 'compression_core'],
    muscle_up: ['vertical_pull', 'vertical_push', 'horizontal_pull'],
    hspu: ['vertical_push', 'compression_core'],
    back_lever: ['straight_arm_pull', 'compression_core'],
    iron_cross: ['straight_arm_pull', 'straight_arm_push'],
    l_sit: ['compression_core', 'hip_hinge'],
    weighted_strength: ['vertical_pull', 'vertical_push', 'horizontal_pull', 'horizontal_push'],
    general: ['vertical_pull', 'vertical_push', 'compression_core'],
  }
  
  return skillFamilyMap[skill] || skillFamilyMap.general
}

// =============================================================================
// EXERCISE VARIATION HELPERS
// =============================================================================

export interface ExerciseVariationSet {
  variantA: string[]
  variantB: string[]
  variantC: string[]
}

/**
 * Get exercise variants for a skill to ensure variety across days
 */
export function getExerciseVariants(skill: SkillType): ExerciseVariationSet {
  const variants: Record<SkillType, ExerciseVariationSet> = {
    front_lever: {
      variantA: ['front_lever_hold', 'weighted_pull_up', 'compression_hold'],
      variantB: ['front_lever_raise', 'row_progression', 'scapular_pull'],
      variantC: ['front_lever_negative', 'straight_arm_pull', 'hollow_body'],
    },
    planche: {
      variantA: ['planche_lean', 'weighted_dip', 'pseudo_planche_push_up'],
      variantB: ['tuck_planche', 'pike_push_up', 'protraction_hold'],
      variantC: ['planche_negative', 'ring_push_up', 'serratus_press'],
    },
    muscle_up: {
      variantA: ['high_pull', 'weighted_pull_up', 'straight_bar_dip'],
      variantB: ['muscle_up_negative', 'explosive_pull', 'transition_drill'],
      variantC: ['chest_to_bar', 'kipping_pull', 'ring_dip'],
    },
    hspu: {
      variantA: ['pike_push_up', 'handstand_hold', 'shoulder_press'],
      variantB: ['wall_hspu_negative', 'elevated_pike', 'face_pull'],
      variantC: ['box_hspu', 'wall_walk', 'rear_delt_fly'],
    },
    back_lever: {
      variantA: ['skin_the_cat', 'german_hang', 'bicep_curl'],
      variantB: ['back_lever_raise', 'shoulder_extension', 'rear_support'],
      variantC: ['back_lever_negative', 'ring_row_supinated', 'core_rotation'],
    },
    iron_cross: {
      variantA: ['ring_support', 'cross_pull', 'ring_fly'],
      variantB: ['rto_support', 'wide_pull', 'tendon_conditioning'],
      variantC: ['iron_cross_negative', 'band_cross', 'shoulder_stability'],
    },
    l_sit: {
      variantA: ['l_sit_hold', 'compression_lift', 'pike_stretch'],
      variantB: ['tuck_l_sit', 'hanging_leg_raise', 'hip_flexor_march'],
      variantC: ['straddle_l', 'v_up', 'pancake_compression'],
    },
    weighted_strength: {
      variantA: ['weighted_pull_up', 'weighted_dip', 'ring_row'],
      variantB: ['weighted_chin_up', 'ring_dip', 'push_up'],
      variantC: ['one_arm_row', 'close_grip_dip', 'archer_pull'],
    },
    general: {
      variantA: ['pull_up', 'push_up', 'hollow_hold'],
      variantB: ['row', 'dip', 'plank'],
      variantC: ['chin_up', 'pike_push', 'dead_bug'],
    },
  }
  
  return variants[skill] || variants.general
}

// =============================================================================
// REPETITION JUSTIFICATION TRACKING
// =============================================================================

export interface RepetitionJustification {
  dayA: number
  dayB: number
  reason: string
  isIntentional: boolean
  coachingNote: string
}

/**
 * Generate justification notes for intentionally repeated sessions
 */
export function generateRepetitionJustifications(
  intents: SessionIntent[]
): RepetitionJustification[] {
  const justifications: RepetitionJustification[] = []
  
  for (let i = 0; i < intents.length; i++) {
    for (let j = i + 1; j < intents.length; j++) {
      const intentA = intents[i]
      const intentB = intents[j]
      
      // Check if these intents are similar
      if (
        intentA.sessionType === intentB.sessionType &&
        intentA.primarySkill === intentB.primarySkill &&
        intentA.exerciseVariant === intentB.exerciseVariant
      ) {
        const justification = getRepetitionJustification(intentA, intentB)
        if (justification) {
          justifications.push({
            dayA: i + 1,
            dayB: j + 1,
            reason: justification.reason,
            isIntentional: justification.isIntentional,
            coachingNote: justification.coachingNote,
          })
        }
      }
    }
  }
  
  return justifications
}

function getRepetitionJustification(
  a: SessionIntent,
  b: SessionIntent
): { reason: string; isIntentional: boolean; coachingNote: string } | null {
  if (a.sessionType === 'skill_exposure' && a.fatigueProfile === 'low_accumulation') {
    return {
      reason: 'Frequent low-fatigue skill exposure',
      isIntentional: true,
      coachingNote: 'Repeated low-fatigue exposure is optimal for this skill.',
    }
  }
  
  if (a.sessionType === 'technique_day') {
    return {
      reason: 'Consistent technique practice',
      isIntentional: true,
      coachingNote: 'This athlete benefits from frequent high-quality practice.',
    }
  }
  
  // Check for straight-arm work
  const straightArmFamilies: MovementFamily[] = ['straight_arm_pull', 'straight_arm_push']
  if (a.primaryMovementFamilies.some(f => straightArmFamilies.includes(f))) {
    return {
      reason: 'Tendon-safe repeated exposure',
      isIntentional: true,
      coachingNote: 'Tendon pacing favors consistent submaximal exposures.',
    }
  }
  
  return null
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  calculateSessionSimilarity,
  checkRepetitionJustification,
}
