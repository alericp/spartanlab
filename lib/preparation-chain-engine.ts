/**
 * SpartanLab Preparation Chain Engine
 * 
 * Ensures advanced skills and exercises respect proper preparation sequences.
 * Guides athletes through foundational work before advanced movements.
 * 
 * This engine:
 * - Defines preparation chains for all major movements
 * - Validates workout composition against preparation requirements
 * - Adjusts volume based on readiness and preparation status
 * - Generates guidance messaging for UI
 * - Integrates with progression ladders and readiness engine
 */

import {
  type PrerequisiteRule,
  type GateCheckResult,
  type AthletePrerequisiteContext,
  PREREQUISITE_RULES,
  checkExercisePrerequisite,
  buildPrerequisiteContext,
  getProgressionLadder,
} from './prerequisite-gate-engine'
import type { SkillReadinessData } from './readiness-service'

// =============================================================================
// TYPES
// =============================================================================

export type SkillCategory = 
  | 'horizontal_pull'
  | 'horizontal_push'
  | 'vertical_pull'
  | 'vertical_push'
  | 'ring_strength'
  | 'compression'
  | 'explosive'

export interface PreparationChain {
  skillId: string
  skillName: string
  category: SkillCategory
  /** Ordered chain of foundational movements leading to the target skill */
  chain: PreparationStep[]
  /** Minimum time recommended between progression attempts (days) */
  minimumProgressionInterval: number
  /** Risk level if chain is skipped */
  skipRiskLevel: 'low' | 'moderate' | 'high' | 'very_high'
}

export interface PreparationStep {
  exerciseId: string
  exerciseName: string
  /** Why this step matters */
  purpose: string
  /** Minimum competency to move on */
  minCompetency: {
    type: 'hold' | 'reps' | 'sets_reps'
    value: number
    secondaryValue?: number // for sets_reps (sets x reps)
  }
  /** Is this step critical? Skipping critical steps generates stronger warnings */
  isCritical: boolean
}

export interface PreparationValidation {
  skillId: string
  skillName: string
  /** Overall preparation score (0-100) */
  preparationScore: number
  /** Status summary */
  status: 'ready' | 'nearly_ready' | 'needs_work' | 'not_ready'
  /** Which steps are complete */
  completedSteps: string[]
  /** Which steps need more work */
  incompleteSteps: PreparationStepStatus[]
  /** Recommended action */
  recommendation: string
  /** Guidance message for UI */
  guidanceMessage: string
  /** Should foundational volume be increased? */
  increaseFoundationalVolume: boolean
  /** Should advanced skill volume be reduced? */
  reduceAdvancedVolume: boolean
  /** Volume adjustment factor (0.5 = half volume, 1.0 = normal) */
  advancedVolumeMultiplier: number
}

export interface PreparationStepStatus {
  exerciseId: string
  exerciseName: string
  purpose: string
  currentProgress: number // 0-100
  targetCompetency: string
  isCritical: boolean
}

export interface WorkoutPreparationAnalysis {
  /** Overall workout preparation score */
  overallScore: number
  /** Per-skill analysis */
  skillAnalyses: PreparationValidation[]
  /** Exercises that should be added for preparation */
  suggestedFoundationalExercises: SuggestedExercise[]
  /** Global guidance message */
  globalGuidance: string | null
  /** Any critical gaps that need attention */
  criticalGaps: string[]
}

export interface SuggestedExercise {
  exerciseId: string
  exerciseName: string
  reason: string
  supportedSkill: string
  priority: 'essential' | 'recommended' | 'beneficial'
  suggestedSets: number
  suggestedReps: string
}

// =============================================================================
// PREPARATION CHAINS DATABASE
// =============================================================================

export const PREPARATION_CHAINS: PreparationChain[] = [
  // ===== FRONT LEVER =====
  {
    skillId: 'front_lever',
    skillName: 'Front Lever',
    category: 'horizontal_pull',
    minimumProgressionInterval: 7,
    skipRiskLevel: 'high',
    chain: [
      {
        exerciseId: 'scap_pull_up',
        exerciseName: 'Scapular Pull-Ups',
        purpose: 'Develops scapular depression strength critical for horizontal hold stability',
        minCompetency: { type: 'reps', value: 15 },
        isCritical: true,
      },
      {
        exerciseId: 'active_hang',
        exerciseName: 'Active Hang',
        purpose: 'Builds shoulder stability and lat engagement pattern',
        minCompetency: { type: 'hold', value: 30 },
        isCritical: false,
      },
      {
        exerciseId: 'inverted_row',
        exerciseName: 'Inverted Rows',
        purpose: 'Horizontal pulling strength matches front lever pulling angle',
        minCompetency: { type: 'reps', value: 15 },
        isCritical: true,
      },
      {
        exerciseId: 'tuck_fl',
        exerciseName: 'Tuck Front Lever Hold',
        purpose: 'Entry-level front lever position with reduced leverage',
        minCompetency: { type: 'hold', value: 15 },
        isCritical: true,
      },
      {
        exerciseId: 'fl_raises',
        exerciseName: 'Front Lever Raises',
        purpose: 'Builds concentric strength in the front lever movement pattern',
        minCompetency: { type: 'reps', value: 8 },
        isCritical: false,
      },
    ],
  },

  // ===== PLANCHE =====
  {
    skillId: 'planche',
    skillName: 'Planche',
    category: 'horizontal_push',
    minimumProgressionInterval: 7,
    skipRiskLevel: 'very_high',
    chain: [
      {
        exerciseId: 'planche_lean',
        exerciseName: 'Planche Lean',
        purpose: 'Conditions wrists and shoulders for forward lean loading',
        minCompetency: { type: 'hold', value: 30 },
        isCritical: true,
      },
      {
        exerciseId: 'pseudo_planche_pushup',
        exerciseName: 'Pseudo Planche Push-Ups',
        purpose: 'Builds bent-arm pushing strength in the planche lean position',
        minCompetency: { type: 'reps', value: 12 },
        isCritical: true,
      },
      {
        exerciseId: 'frog_stand',
        exerciseName: 'Frog Stand',
        purpose: 'Develops wrist strength and balance in forward lean',
        minCompetency: { type: 'hold', value: 30 },
        isCritical: false,
      },
      {
        exerciseId: 'l_sit',
        exerciseName: 'L-Sit Hold',
        purpose: 'Builds shoulder depression and compression strength',
        minCompetency: { type: 'hold', value: 20 },
        isCritical: false,
      },
      {
        exerciseId: 'tuck_planche',
        exerciseName: 'Tuck Planche Hold',
        purpose: 'Entry planche position with knees tucked',
        minCompetency: { type: 'hold', value: 10 },
        isCritical: true,
      },
    ],
  },

  // ===== MUSCLE-UP =====
  {
    skillId: 'muscle_up',
    skillName: 'Muscle-Up',
    category: 'explosive',
    minimumProgressionInterval: 5,
    skipRiskLevel: 'moderate',
    chain: [
      {
        exerciseId: 'pull_up',
        exerciseName: 'Pull-Ups',
        purpose: 'Foundation pulling strength for the pull phase',
        minCompetency: { type: 'reps', value: 10 },
        isCritical: true,
      },
      {
        exerciseId: 'dip',
        exerciseName: 'Dips',
        purpose: 'Foundation pressing strength for the push phase',
        minCompetency: { type: 'reps', value: 15 },
        isCritical: true,
      },
      {
        exerciseId: 'explosive_pull_up',
        exerciseName: 'Explosive Pull-Ups',
        purpose: 'Develops the explosive power needed for the transition',
        minCompetency: { type: 'reps', value: 8 },
        isCritical: true,
      },
      {
        exerciseId: 'chest_to_bar_pull_up',
        exerciseName: 'Chest-to-Bar Pull-Ups',
        purpose: 'Increases pull height to clear the bar for transition',
        minCompetency: { type: 'reps', value: 5 },
        isCritical: true,
      },
      {
        exerciseId: 'transition_practice',
        exerciseName: 'Muscle-Up Transition Practice',
        purpose: 'Isolated transition movement pattern',
        minCompetency: { type: 'reps', value: 5 },
        isCritical: false,
      },
    ],
  },

  // ===== RING DIP =====
  {
    skillId: 'ring_dip',
    skillName: 'Ring Dip',
    category: 'ring_strength',
    minimumProgressionInterval: 5,
    skipRiskLevel: 'high',
    chain: [
      {
        exerciseId: 'push_up',
        exerciseName: 'Push-Ups',
        purpose: 'Builds baseline pushing strength',
        minCompetency: { type: 'reps', value: 20 },
        isCritical: false,
      },
      {
        exerciseId: 'dip',
        exerciseName: 'Parallel Bar Dips',
        purpose: 'Develops dip strength on stable surface',
        minCompetency: { type: 'reps', value: 12 },
        isCritical: true,
      },
      {
        exerciseId: 'ring_push_up',
        exerciseName: 'Ring Push-Ups',
        purpose: 'Introduces ring instability with lower risk',
        minCompetency: { type: 'reps', value: 12 },
        isCritical: true,
      },
      {
        exerciseId: 'ring_support_hold',
        exerciseName: 'Ring Support Hold',
        purpose: 'Builds shoulder stability in rings support position',
        minCompetency: { type: 'hold', value: 30 },
        isCritical: true,
      },
    ],
  },

  // ===== HANDSTAND PUSH-UP =====
  {
    skillId: 'hspu',
    skillName: 'Handstand Push-Up',
    category: 'vertical_push',
    minimumProgressionInterval: 5,
    skipRiskLevel: 'moderate',
    chain: [
      {
        exerciseId: 'pike_push_up',
        exerciseName: 'Pike Push-Ups',
        purpose: 'Introduces overhead pressing angle with reduced load',
        minCompetency: { type: 'reps', value: 15 },
        isCritical: true,
      },
      {
        exerciseId: 'elevated_pike_push_up',
        exerciseName: 'Elevated Pike Push-Ups',
        purpose: 'Increases overhead pressing angle progressively',
        minCompetency: { type: 'reps', value: 12 },
        isCritical: true,
      },
      {
        exerciseId: 'wall_handstand',
        exerciseName: 'Wall Handstand Hold',
        purpose: 'Builds inverted stability and shoulder endurance',
        minCompetency: { type: 'hold', value: 45 },
        isCritical: true,
      },
      {
        exerciseId: 'wall_hspu_negatives',
        exerciseName: 'Wall HSPU Negatives',
        purpose: 'Develops eccentric strength in full range HSPU',
        minCompetency: { type: 'reps', value: 5 },
        isCritical: false,
      },
    ],
  },

  // ===== BACK LEVER =====
  {
    skillId: 'back_lever',
    skillName: 'Back Lever',
    category: 'horizontal_pull',
    minimumProgressionInterval: 7,
    skipRiskLevel: 'high',
    chain: [
      {
        exerciseId: 'skin_the_cat',
        exerciseName: 'Skin the Cat',
        purpose: 'Develops shoulder extension mobility safely',
        minCompetency: { type: 'reps', value: 5 },
        isCritical: true,
      },
      {
        exerciseId: 'german_hang',
        exerciseName: 'German Hang',
        purpose: 'Builds shoulder extension flexibility under load',
        minCompetency: { type: 'hold', value: 20 },
        isCritical: true,
      },
      {
        exerciseId: 'tuck_back_lever',
        exerciseName: 'Tuck Back Lever Hold',
        purpose: 'Entry-level back lever with reduced leverage',
        minCompetency: { type: 'hold', value: 15 },
        isCritical: true,
      },
    ],
  },

  // ===== IRON CROSS =====
  {
    skillId: 'iron_cross',
    skillName: 'Iron Cross',
    category: 'ring_strength',
    minimumProgressionInterval: 14,
    skipRiskLevel: 'very_high',
    chain: [
      {
        exerciseId: 'ring_support_hold',
        exerciseName: 'Ring Support Hold',
        purpose: 'Foundation stability in rings support',
        minCompetency: { type: 'hold', value: 60 },
        isCritical: true,
      },
      {
        exerciseId: 'rto_support_hold',
        exerciseName: 'RTO Support Hold',
        purpose: 'Builds turned-out shoulder position needed for cross',
        minCompetency: { type: 'hold', value: 30 },
        isCritical: true,
      },
      {
        exerciseId: 'ring_fly',
        exerciseName: 'Ring Flyes',
        purpose: 'Develops straight-arm chest and shoulder strength',
        minCompetency: { type: 'reps', value: 10 },
        isCritical: true,
      },
      {
        exerciseId: 'assisted_cross_hold',
        exerciseName: 'Assisted Cross Hold',
        purpose: 'Cross position with band assistance for tendon conditioning',
        minCompetency: { type: 'hold', value: 15 },
        isCritical: true,
      },
      {
        exerciseId: 'cross_negatives',
        exerciseName: 'Cross Negatives',
        purpose: 'Eccentric cross strength development',
        minCompetency: { type: 'reps', value: 5 },
        isCritical: true,
      },
    ],
  },
]

// =============================================================================
// CORE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate preparation status for a specific skill
 */
export function validateSkillPreparation(
  skillId: string,
  athleteProgress: Record<string, { hold?: number; reps?: number }>,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): PreparationValidation {
  const chain = PREPARATION_CHAINS.find(c => c.skillId === skillId)
  
  if (!chain) {
    // No chain defined = no validation needed
    return {
      skillId,
      skillName: skillId.replace(/_/g, ' '),
      preparationScore: 100,
      status: 'ready',
      completedSteps: [],
      incompleteSteps: [],
      recommendation: 'No specific preparation requirements.',
      guidanceMessage: '',
      increaseFoundationalVolume: false,
      reduceAdvancedVolume: false,
      advancedVolumeMultiplier: 1.0,
    }
  }
  
  const completedSteps: string[] = []
  const incompleteSteps: PreparationStepStatus[] = []
  let totalWeight = 0
  let achievedWeight = 0
  
  for (const step of chain.chain) {
    const progress = athleteProgress[step.exerciseId]
    const weight = step.isCritical ? 2 : 1
    totalWeight += weight
    
    let stepProgress = 0
    let targetCompetency = ''
    
    if (step.minCompetency.type === 'hold') {
      const current = progress?.hold ?? 0
      const target = step.minCompetency.value
      stepProgress = Math.min(100, (current / target) * 100)
      targetCompetency = `${target}s hold`
    } else if (step.minCompetency.type === 'reps') {
      const current = progress?.reps ?? 0
      const target = step.minCompetency.value
      stepProgress = Math.min(100, (current / target) * 100)
      targetCompetency = `${target} reps`
    }
    
    if (stepProgress >= 100) {
      completedSteps.push(step.exerciseId)
      achievedWeight += weight
    } else {
      incompleteSteps.push({
        exerciseId: step.exerciseId,
        exerciseName: step.exerciseName,
        purpose: step.purpose,
        currentProgress: Math.round(stepProgress),
        targetCompetency,
        isCritical: step.isCritical,
      })
      // Partial credit for partial progress
      achievedWeight += (stepProgress / 100) * weight
    }
  }
  
  const preparationScore = Math.round((achievedWeight / totalWeight) * 100)
  
  // Determine status
  let status: PreparationValidation['status']
  if (preparationScore >= 90) {
    status = 'ready'
  } else if (preparationScore >= 70) {
    status = 'nearly_ready'
  } else if (preparationScore >= 40) {
    status = 'needs_work'
  } else {
    status = 'not_ready'
  }
  
  // Adjust for experience level
  let adjustedScore = preparationScore
  if (experienceLevel === 'advanced') {
    // Advanced athletes get more leeway
    adjustedScore = Math.min(100, preparationScore + 15)
  } else if (experienceLevel === 'beginner') {
    // Beginners need stronger preparation
    adjustedScore = Math.max(0, preparationScore - 10)
  }
  
  // Generate recommendation
  let recommendation = ''
  let guidanceMessage = ''
  
  const criticalIncomplete = incompleteSteps.filter(s => s.isCritical)
  
  if (status === 'ready') {
    recommendation = `Ready to train ${chain.skillName}. Foundation is solid.`
    guidanceMessage = ''
  } else if (status === 'nearly_ready') {
    recommendation = `Close to ready for ${chain.skillName}. Focus on: ${incompleteSteps[0]?.exerciseName}.`
    guidanceMessage = `This movement typically requires foundational strength. Supporting exercises have been included to improve readiness.`
  } else if (criticalIncomplete.length > 0) {
    recommendation = `Build ${criticalIncomplete[0].exerciseName} before progressing to ${chain.skillName}.`
    guidanceMessage = `This movement requires foundational strength. ${criticalIncomplete[0].exerciseName} has been prioritized to improve readiness safely.`
  } else {
    recommendation = `Continue building foundation for ${chain.skillName}.`
    guidanceMessage = `Foundational exercises have been included to prepare you for this skill.`
  }
  
  // Determine volume adjustments
  const increaseFoundationalVolume = status === 'needs_work' || status === 'not_ready'
  const reduceAdvancedVolume = status !== 'ready'
  
  let advancedVolumeMultiplier = 1.0
  if (status === 'not_ready') {
    advancedVolumeMultiplier = 0.3
  } else if (status === 'needs_work') {
    advancedVolumeMultiplier = 0.6
  } else if (status === 'nearly_ready') {
    advancedVolumeMultiplier = 0.85
  }
  
  return {
    skillId,
    skillName: chain.skillName,
    preparationScore: adjustedScore,
    status,
    completedSteps,
    incompleteSteps,
    recommendation,
    guidanceMessage,
    increaseFoundationalVolume,
    reduceAdvancedVolume,
    advancedVolumeMultiplier,
  }
}

/**
 * Analyze preparation status for all skills in a workout
 */
export function analyzeWorkoutPreparation(
  plannedSkills: string[],
  plannedExercises: Array<{ id: string; name: string }>,
  athleteProgress: Record<string, { hold?: number; reps?: number }>,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): WorkoutPreparationAnalysis {
  const skillAnalyses: PreparationValidation[] = []
  const suggestedFoundationalExercises: SuggestedExercise[] = []
  const criticalGaps: string[] = []
  
  // Analyze each planned skill
  for (const skillId of plannedSkills) {
    const validation = validateSkillPreparation(skillId, athleteProgress, experienceLevel)
    skillAnalyses.push(validation)
    
    // Collect critical gaps
    const criticalIncomplete = validation.incompleteSteps.filter(s => s.isCritical)
    for (const step of criticalIncomplete) {
      criticalGaps.push(`${step.exerciseName} for ${validation.skillName}`)
    }
    
    // Suggest foundational exercises that aren't already in workout
    if (validation.status !== 'ready') {
      for (const step of validation.incompleteSteps) {
        const alreadyIncluded = plannedExercises.some(e => 
          e.id === step.exerciseId || 
          e.name.toLowerCase().replace(/\s+/g, '_') === step.exerciseId
        )
        
        if (!alreadyIncluded) {
          suggestedFoundationalExercises.push({
            exerciseId: step.exerciseId,
            exerciseName: step.exerciseName,
            reason: step.purpose,
            supportedSkill: validation.skillName,
            priority: step.isCritical ? 'essential' : 'recommended',
            suggestedSets: 3,
            suggestedReps: step.currentProgress < 50 ? '8-12' : '12-15',
          })
        }
      }
    }
  }
  
  // Calculate overall score
  const overallScore = skillAnalyses.length > 0
    ? Math.round(skillAnalyses.reduce((sum, a) => sum + a.preparationScore, 0) / skillAnalyses.length)
    : 100
  
  // Generate global guidance
  let globalGuidance: string | null = null
  
  if (criticalGaps.length > 0) {
    globalGuidance = `Foundational exercises included to support: ${criticalGaps.slice(0, 3).join(', ')}${criticalGaps.length > 3 ? '...' : ''}`
  } else if (overallScore < 70) {
    globalGuidance = 'Supporting exercises have been included to improve skill readiness.'
  }
  
  return {
    overallScore,
    skillAnalyses,
    suggestedFoundationalExercises,
    globalGuidance,
    criticalGaps,
  }
}

/**
 * Get preparation chain for a skill
 */
export function getPreparationChain(skillId: string): PreparationChain | null {
  return PREPARATION_CHAINS.find(c => c.skillId === skillId) || null
}

/**
 * Get all skills that require preparation chains
 */
export function getSkillsWithPreparationChains(): string[] {
  return PREPARATION_CHAINS.map(c => c.skillId)
}

// =============================================================================
// OVERRIDE GUIDANCE
// =============================================================================

export interface OverrideGuidance {
  message: string
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  suggestedAlternative: string | null
  proceedAnyway: boolean
}

/**
 * Generate guidance when user attempts to skip preparation
 */
export function getOverrideGuidance(
  skillId: string,
  skippedExerciseId: string,
  athleteProgress: Record<string, { hold?: number; reps?: number }>
): OverrideGuidance {
  const chain = PREPARATION_CHAINS.find(c => c.skillId === skillId)
  
  if (!chain) {
    return {
      message: '',
      riskLevel: 'low',
      suggestedAlternative: null,
      proceedAnyway: true,
    }
  }
  
  const step = chain.chain.find(s => s.exerciseId === skippedExerciseId)
  
  if (!step) {
    return {
      message: '',
      riskLevel: 'low',
      suggestedAlternative: null,
      proceedAnyway: true,
    }
  }
  
  const validation = validateSkillPreparation(skillId, athleteProgress)
  
  if (step.isCritical && validation.status !== 'ready') {
    return {
      message: `Skipping ${step.exerciseName} may reduce long-term progress efficiency. This exercise ${step.purpose.toLowerCase()}.`,
      riskLevel: chain.skipRiskLevel,
      suggestedAlternative: step.exerciseName,
      proceedAnyway: true, // Always allow override
    }
  }
  
  return {
    message: `${step.exerciseName} supports ${chain.skillName} development, but isn't critical at your current level.`,
    riskLevel: 'low',
    suggestedAlternative: null,
    proceedAnyway: true,
  }
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Apply preparation-based volume adjustments to a workout
 */
export function applyPreparationVolumeAdjustments(
  exercises: Array<{
    id: string
    name: string
    sets: number
    relatedSkill?: string
    isAdvanced?: boolean
  }>,
  workoutAnalysis: WorkoutPreparationAnalysis
): Array<{
  id: string
  name: string
  sets: number
  relatedSkill?: string
  isAdvanced?: boolean
  adjustedSets: number
  adjustmentReason?: string
}> {
  return exercises.map(exercise => {
    let adjustedSets = exercise.sets
    let adjustmentReason: string | undefined
    
    if (exercise.relatedSkill && exercise.isAdvanced) {
      const skillAnalysis = workoutAnalysis.skillAnalyses.find(
        a => a.skillId === exercise.relatedSkill
      )
      
      if (skillAnalysis && skillAnalysis.reduceAdvancedVolume) {
        adjustedSets = Math.max(1, Math.round(exercise.sets * skillAnalysis.advancedVolumeMultiplier))
        adjustmentReason = `Volume adjusted to ${adjustedSets} sets based on preparation status`
      }
    }
    
    return {
      ...exercise,
      adjustedSets,
      adjustmentReason,
    }
  })
}

/**
 * Get foundational exercises to add based on preparation analysis
 */
export function getFoundationalExercisesToAdd(
  analysis: WorkoutPreparationAnalysis,
  maxToAdd: number = 2
): SuggestedExercise[] {
  // Prioritize essential exercises, then recommended
  const sorted = [...analysis.suggestedFoundationalExercises].sort((a, b) => {
    if (a.priority === 'essential' && b.priority !== 'essential') return -1
    if (b.priority === 'essential' && a.priority !== 'essential') return 1
    return 0
  })
  
  return sorted.slice(0, maxToAdd)
}
