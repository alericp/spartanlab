// Constraint Integration Layer
// Bridges the enhanced constraint detection engine with existing systems
// Provides clean integration points for program generation and UI

import {
  detectConstraintsSync,
  detectSkillConstraints,
  getConstraintInsightForSkill,
  CONSTRAINT_CATEGORY_LABELS,
  SKILL_CONSTRAINT_REQUIREMENTS,
  type ConstraintCategory,
  type SkillType,
  type GlobalConstraintResult,
  type SkillConstraintResult,
} from './constraint-detection-engine'
import { getAthleteProfile } from './data-service'

// =============================================================================
// PROGRAM GENERATION INTEGRATION
// =============================================================================

export interface ProgramConstraintContext {
  primaryConstraint: ConstraintCategory
  secondaryConstraint: ConstraintCategory | null
  strongQualities: ConstraintCategory[]
  volumeAdjustments: {
    increasePriority: string[] // Movement categories to increase
    maintainPriority: string[] // Movement categories to maintain
    decreasePriority: string[] // Movement categories that can be reduced
  }
  recommendations: string[]
  explanation: string
}

/**
 * Get constraint context for program generation
 * Maps constraints to volume and exercise selection priorities
 */
export function getConstraintContextForProgram(
  primaryGoal?: string
): ProgramConstraintContext {
  const constraints = detectConstraintsSync()
  
  // Map constraints to volume adjustments
  const volumeAdjustments = mapConstraintsToVolumeAdjustments(
    constraints.primaryConstraint,
    constraints.secondaryConstraint,
    constraints.strongQualities
  )
  
  // Get skill-specific context if primary goal is a skill
  let explanation = ''
  if (primaryGoal && isValidSkillType(primaryGoal)) {
    const skillConstraint = constraints.skillResults[primaryGoal as SkillType]
    if (skillConstraint) {
      explanation = skillConstraint.explanation
    }
  }
  
  if (!explanation) {
    explanation = generateGlobalExplanation(
      constraints.primaryConstraint,
      constraints.secondaryConstraint
    )
  }
  
  return {
    primaryConstraint: constraints.primaryConstraint,
    secondaryConstraint: constraints.secondaryConstraint,
    strongQualities: constraints.strongQualities,
    volumeAdjustments,
    recommendations: constraints.overallRecommendations,
    explanation,
  }
}

function isValidSkillType(skill: string): skill is SkillType {
  return ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit'].includes(skill)
}

function mapConstraintsToVolumeAdjustments(
  primary: ConstraintCategory,
  secondary: ConstraintCategory | null,
  strongQualities: ConstraintCategory[]
): {
  increasePriority: string[]
  maintainPriority: string[]
  decreasePriority: string[]
} {
  const increasePriority: string[] = []
  const maintainPriority: string[] = []
  const decreasePriority: string[] = []
  
  // Map primary constraint to increased volume
  const constraintToMovement: Partial<Record<ConstraintCategory, string[]>> = {
    pull_strength: ['weighted_pull', 'pull_up', 'row'],
    push_strength: ['weighted_dip', 'dip', 'push_up'],
    straight_arm_pull_strength: ['front_lever_raise', 'straight_arm_pull', 'tuck_front_lever'],
    straight_arm_push_strength: ['planche_lean', 'pseudo_planche', 'straight_arm_push'],
    compression_strength: ['l_sit', 'v_up', 'compression', 'pike_compression'],
    core_control: ['hollow_body', 'plank', 'core'],
    scapular_control: ['scapular_pull', 'retraction', 'depression'],
    shoulder_stability: ['shoulder_prep', 'external_rotation', 'stability'],
    wrist_tolerance: ['wrist_conditioning', 'wrist_prep'],
    explosive_pull_power: ['explosive_pull', 'high_pull', 'kipping'],
    transition_strength: ['muscle_up_transition', 'straight_bar_dip'],
    vertical_push_strength: ['pike_push_up', 'hspu', 'overhead_press'],
  }
  
  // Add primary constraint movements to increase
  if (constraintToMovement[primary]) {
    increasePriority.push(...constraintToMovement[primary]!)
  }
  
  // Add secondary constraint movements
  if (secondary && constraintToMovement[secondary]) {
    const secondaryMovements = constraintToMovement[secondary]!
    for (const movement of secondaryMovements) {
      if (!increasePriority.includes(movement)) {
        increasePriority.push(movement)
      }
    }
  }
  
  // Map strong qualities to maintain (not decrease)
  for (const quality of strongQualities) {
    if (constraintToMovement[quality]) {
      maintainPriority.push(...constraintToMovement[quality]!)
    }
  }
  
  // Everything else can be reduced if needed
  const allMovements = [
    'weighted_pull', 'pull_up', 'row',
    'weighted_dip', 'dip', 'push_up',
    'front_lever_raise', 'planche_lean',
    'l_sit', 'core',
    'shoulder_prep', 'wrist_conditioning',
  ]
  
  for (const movement of allMovements) {
    if (!increasePriority.includes(movement) && !maintainPriority.includes(movement)) {
      decreasePriority.push(movement)
    }
  }
  
  return { increasePriority, maintainPriority, decreasePriority }
}

function generateGlobalExplanation(
  primary: ConstraintCategory,
  secondary: ConstraintCategory | null
): string {
  const primaryLabel = CONSTRAINT_CATEGORY_LABELS[primary] || primary
  
  if (primary === 'none') {
    return 'Your training is well-balanced. Continue with current approach.'
  }
  
  if (primary === 'insufficient_data') {
    return 'More training data needed for personalized constraint analysis.'
  }
  
  let explanation = `Your primary training limiter is ${primaryLabel.toLowerCase()}`
  
  if (secondary) {
    const secondaryLabel = CONSTRAINT_CATEGORY_LABELS[secondary] || secondary
    explanation += `, with ${secondaryLabel.toLowerCase()} as a secondary factor`
  }
  
  explanation += '.'
  
  return explanation
}

// =============================================================================
// ROADMAP INTEGRATION
// =============================================================================

export interface RoadmapConstraintContext {
  skill: SkillType
  isBlocked: boolean
  blockingConstraints: ConstraintCategory[]
  readinessForNextMilestone: number
  explanation: string
  recommendations: string[]
}

/**
 * Get constraint context for roadmap progression decisions
 */
export function getConstraintContextForRoadmap(
  skill: SkillType
): RoadmapConstraintContext {
  const profile = getAthleteProfile()
  const result = detectSkillConstraints(skill, null, profile)
  
  // Determine if blocked (low readiness for next milestone)
  const isBlocked = result.overallReadiness < 60
  
  // Get blocking constraints (high constraint scores)
  const blockingConstraints = result.constraintScores
    .filter(s => s.score > 60)
    .map(s => s.category)
  
  return {
    skill,
    isBlocked,
    blockingConstraints,
    readinessForNextMilestone: result.overallReadiness,
    explanation: result.explanation,
    recommendations: result.recommendations,
  }
}

// =============================================================================
// UI INTEGRATION
// =============================================================================

/**
 * Get constraint summary for dashboard display
 */
export function getConstraintSummaryForDashboard(): {
  hasPrimaryConstraint: boolean
  primaryLabel: string
  secondaryLabel: string | null
  category: string
  recommendations: string[]
  isTimeLimited: boolean
  isFatigued: boolean
  dataQuality: string
} {
  const constraints = detectConstraintsSync()
  
  return {
    hasPrimaryConstraint: constraints.primaryConstraint !== 'none' && 
                          constraints.primaryConstraint !== 'insufficient_data',
    primaryLabel: CONSTRAINT_CATEGORY_LABELS[constraints.primaryConstraint] || 'None',
    secondaryLabel: constraints.secondaryConstraint 
      ? CONSTRAINT_CATEGORY_LABELS[constraints.secondaryConstraint] 
      : null,
    category: getCategoryFromConstraint(constraints.primaryConstraint),
    recommendations: constraints.overallRecommendations,
    isTimeLimited: constraints.scheduleStatus.isTimeLimited,
    isFatigued: constraints.fatigueStatus.isFatigued,
    dataQuality: constraints.dataQuality,
  }
}

function getCategoryFromConstraint(constraint: ConstraintCategory): string {
  const strengthConstraints: ConstraintCategory[] = [
    'pull_strength', 'push_strength', 'straight_arm_pull_strength',
    'straight_arm_push_strength', 'compression_strength', 'core_control',
    'scapular_control', 'shoulder_stability', 'wrist_tolerance',
    'explosive_pull_power', 'transition_strength', 'vertical_push_strength',
  ]
  
  const recoveryConstraints: ConstraintCategory[] = [
    'fatigue_recovery', 'training_consistency',
  ]
  
  const scheduleConstraints: ConstraintCategory[] = [
    'schedule_time_constraint',
  ]
  
  const mobilityConstraints: ConstraintCategory[] = [
    'mobility', 'shoulder_extension_mobility',
  ]
  
  const skillConstraints: ConstraintCategory[] = [
    'skill_coordination', 'balance_control',
  ]
  
  if (strengthConstraints.includes(constraint)) return 'Strength'
  if (recoveryConstraints.includes(constraint)) return 'Recovery'
  if (scheduleConstraints.includes(constraint)) return 'Schedule'
  if (mobilityConstraints.includes(constraint)) return 'Mobility'
  if (skillConstraints.includes(constraint)) return 'Skill'
  if (constraint === 'none') return 'Balanced'
  
  return 'Data'
}

// =============================================================================
// SKILL-SPECIFIC CONSTRAINT ACCESS
// =============================================================================

/**
 * Get constraints for a specific skill (for skill detail pages, roadmaps, etc.)
 */
export function getSkillConstraints(skill: SkillType): SkillConstraintResult {
  const profile = getAthleteProfile()
  return detectSkillConstraints(skill, null, profile)
}

/**
 * Get all skill constraints at once
 */
export function getAllSkillConstraints(): Record<SkillType, SkillConstraintResult> {
  const profile = getAthleteProfile()
  const skills: SkillType[] = ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit']
  
  const results: Record<SkillType, SkillConstraintResult> = {} as any
  
  for (const skill of skills) {
    results[skill] = detectSkillConstraints(skill, null, profile)
  }
  
  return results
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CONSTRAINT_CATEGORY_LABELS,
  SKILL_CONSTRAINT_REQUIREMENTS,
  type ConstraintCategory,
  type SkillType,
  type GlobalConstraintResult,
  type SkillConstraintResult,
}
