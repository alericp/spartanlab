/**
 * SpartanLab Prerequisite Gate Engine
 * 
 * Ensures advanced exercises are only recommended when foundational 
 * stability and strength prerequisites are met.
 * 
 * This engine:
 * - Maps advanced exercises to required foundational capabilities
 * - Gates exercise selection during program generation
 * - Provides safe progression substitutes
 * - Supports override with safety warnings
 * - Integrates with readiness analysis
 */

import type { DifficultyLevel, Exercise } from './adaptive-exercise-pool'
import { getAllExercises, getExerciseById } from './adaptive-exercise-pool'
import type { SkillReadinessData } from './readiness-service'

// =============================================================================
// TYPES
// =============================================================================

export type StrengthLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type JointArea = 
  | 'shoulder' 
  | 'elbow' 
  | 'wrist' 
  | 'lower_back' 
  | 'hip' 
  | 'knee' 
  | 'ankle'

export interface PrerequisiteRule {
  exerciseId: string
  exerciseName: string
  
  // Required strength metrics
  requiredStrengthMetrics?: {
    metric: string
    level: StrengthLevel
    description: string
  }[]
  
  // Required skill stage (holdTime in seconds or reps)
  requiredSkillStage?: {
    exerciseId: string
    exerciseName: string
    holdTimeSeconds?: number
    reps?: number
  }[]
  
  // Required joint stability
  requiredJointStability?: {
    joint: JointArea
    stabilityThreshold: number // 0-100
    description: string
  }[]
  
  // Minimum readiness score
  minimumReadinessScore?: number
  
  // Related skill for readiness lookup
  relatedSkill?: 'front_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit'
  
  // Warning message for UI
  warningMessage: string
  
  // Knowledge bubble for education
  knowledgeBubble: string
  
  // Safe progression ladder (from easiest to target)
  safeProgressionLadder: string[]
  
  // Risk level if prerequisites not met
  riskLevel: 'moderate' | 'high' | 'very_high'
}

export interface GateCheckResult {
  exerciseId: string
  allowed: boolean
  
  // If not allowed, what to substitute
  recommendedSubstitute?: {
    exerciseId: string
    exerciseName: string
    reason: string
  }
  
  // Failed prerequisites
  failedPrerequisites?: {
    type: 'strength' | 'skill_stage' | 'joint_stability' | 'readiness'
    description: string
  }[]
  
  // Warning message
  warningMessage?: string
  
  // Knowledge bubble
  knowledgeBubble?: string
  
  // Can be overridden?
  canOverride: boolean
  
  // Risk level if overriding
  overrideRiskLevel?: 'moderate' | 'high' | 'very_high'
}

export interface AthletePrerequisiteContext {
  // Strength levels by metric
  strengthLevels?: Record<string, StrengthLevel>
  
  // Achieved skill stages (exerciseId -> holdTime or reps)
  achievedSkillStages?: Record<string, { holdTimeSeconds?: number; reps?: number }>
  
  // Joint stability scores (0-100)
  jointStabilityScores?: Record<JointArea, number>
  
  // Readiness data from database
  readinessData?: SkillReadinessData[]
  
  // Experience level
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // Any joint cautions/injuries
  jointCautions?: JointArea[]
}

// =============================================================================
// PREREQUISITE RULES DATABASE
// =============================================================================

export const PREREQUISITE_RULES: PrerequisiteRule[] = [
  // ===== RING DIP =====
  {
    exerciseId: 'ring_dip',
    exerciseName: 'Ring Dip',
    requiredStrengthMetrics: [
      {
        metric: 'push_strength',
        level: 'intermediate',
        description: 'Can perform 8+ parallel bar dips with good form',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'ring_support_hold',
        exerciseName: 'Ring Support Hold',
        holdTimeSeconds: 20,
      },
    ],
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 60,
        description: 'Adequate shoulder stability for ring instability',
      },
    ],
    warningMessage: 'Ring dips require strong shoulder stability and ring support strength. SpartanLab recommends building stability through ring push-ups first.',
    knowledgeBubble: 'Ring support holds build the shoulder stability needed for safe ring dips.',
    safeProgressionLadder: ['push_up', 'dip', 'ring_push_up', 'ring_support_hold', 'ring_dip'],
    riskLevel: 'high',
  },
  
  // ===== PLANCHE PUSH-UP =====
  {
    exerciseId: 'planche_pushup',
    exerciseName: 'Planche Push-Up',
    requiredStrengthMetrics: [
      {
        metric: 'push_strength',
        level: 'advanced',
        description: 'Can perform 15+ pseudo planche push-ups',
      },
      {
        metric: 'straight_arm_strength',
        level: 'intermediate',
        description: 'Can hold planche lean 30+ seconds',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'tuck_planche',
        exerciseName: 'Tuck Planche Hold',
        holdTimeSeconds: 10,
      },
      {
        exerciseId: 'planche_lean',
        exerciseName: 'Planche Lean',
        holdTimeSeconds: 30,
      },
    ],
    requiredJointStability: [
      {
        joint: 'wrist',
        stabilityThreshold: 70,
        description: 'Strong wrist conditioning for straight-arm loading',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 60,
        description: 'Elbow integrity for straight-arm pressing',
      },
    ],
    minimumReadinessScore: 50,
    relatedSkill: 'planche',
    warningMessage: 'Planche push-ups place extreme demands on wrists, elbows, and shoulders. Build planche leans and tuck planche holds first.',
    knowledgeBubble: 'Planche leans develop the wrist and shoulder conditioning needed for full planche work.',
    safeProgressionLadder: ['push_up', 'pseudo_planche_pushup', 'planche_lean', 'tuck_planche', 'planche_pushup'],
    riskLevel: 'very_high',
  },
  
  // ===== IRON CROSS =====
  {
    exerciseId: 'iron_cross',
    exerciseName: 'Iron Cross',
    requiredStrengthMetrics: [
      {
        metric: 'straight_arm_strength',
        level: 'elite',
        description: 'Exceptional straight-arm pulling and pressing',
      },
      {
        metric: 'ring_strength',
        level: 'advanced',
        description: 'Very strong ring work foundation',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'ring_support_hold',
        exerciseName: 'Ring Support Hold',
        holdTimeSeconds: 30,
      },
      {
        exerciseId: 'rto_support',
        exerciseName: 'RTO Support Hold',
        holdTimeSeconds: 20,
      },
    ],
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 85,
        description: 'Elite shoulder stability for extreme abduction',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 80,
        description: 'Strong elbow integrity for straight-arm loading',
      },
    ],
    warningMessage: 'The Iron Cross places extreme stress on shoulders and elbows. This is an elite skill requiring years of preparation.',
    knowledgeBubble: 'RTO support holds build the turned-out shoulder position needed for iron cross.',
    safeProgressionLadder: ['ring_support_hold', 'rto_support', 'iron_cross_negatives', 'banded_iron_cross', 'iron_cross'],
    riskLevel: 'very_high',
  },
  
  // ===== FRONT LEVER PULL =====
  {
    exerciseId: 'front_lever_pull',
    exerciseName: 'Front Lever Pull',
    requiredStrengthMetrics: [
      {
        metric: 'pull_strength',
        level: 'advanced',
        description: 'Can perform weighted pull-ups at bodyweight +50%',
      },
      {
        metric: 'straight_arm_strength',
        level: 'intermediate',
        description: 'Strong straight-arm pulling',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'adv_tuck_fl',
        exerciseName: 'Advanced Tuck Front Lever',
        holdTimeSeconds: 12,
      },
    ],
    minimumReadinessScore: 55,
    relatedSkill: 'front_lever',
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 65,
        description: 'Strong scapular control in horizontal pull position',
      },
    ],
    warningMessage: 'Front lever pulls require excellent horizontal pulling strength. Build your front lever hold to advanced tuck first.',
    knowledgeBubble: 'Advanced tuck front lever builds the straight-arm pulling strength needed for front lever pulls.',
    safeProgressionLadder: ['tuck_fl', 'adv_tuck_fl', 'fl_raises', 'front_lever_pull'],
    riskLevel: 'high',
  },
  
  // ===== MUSCLE-UP =====
  {
    exerciseId: 'muscle_up',
    exerciseName: 'Muscle-Up',
    requiredStrengthMetrics: [
      {
        metric: 'pull_strength',
        level: 'intermediate',
        description: 'Can perform 10+ pull-ups',
      },
      {
        metric: 'push_strength',
        level: 'intermediate',
        description: 'Can perform 15+ dips',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'explosive_pull_up',
        exerciseName: 'Explosive Pull-Up',
        reps: 8,
      },
      {
        exerciseId: 'chest_to_bar_pull_up',
        exerciseName: 'Chest-to-Bar Pull-Up',
        reps: 5,
      },
    ],
    minimumReadinessScore: 60,
    relatedSkill: 'muscle_up',
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 55,
        description: 'Shoulder stability through full range transition',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 50,
        description: 'Elbow integrity for transition loading',
      },
    ],
    warningMessage: 'Muscle-ups require explosive pulling power and strong dips. Build chest-to-bar pull-ups first.',
    knowledgeBubble: 'Explosive pull-ups to the lower chest develop the power needed for the transition.',
    safeProgressionLadder: ['pull_up', 'explosive_pull_up', 'chest_to_bar_pull_up', 'banded_muscle_up', 'muscle_up'],
    riskLevel: 'moderate',
  },
  
  // ===== HANDSTAND PUSH-UP (FREESTANDING) =====
  {
    exerciseId: 'freestanding_hspu',
    exerciseName: 'Freestanding HSPU',
    requiredStrengthMetrics: [
      {
        metric: 'push_strength',
        level: 'advanced',
        description: 'Can perform 8+ wall HSPU',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'wall_hspu',
        exerciseName: 'Wall Handstand Push-Up',
        reps: 8,
      },
      {
        exerciseId: 'freestanding_handstand',
        exerciseName: 'Freestanding Handstand',
        holdTimeSeconds: 30,
      },
    ],
    minimumReadinessScore: 65,
    relatedSkill: 'hspu',
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 70,
        description: 'Overhead stability in inverted position',
      },
      {
        joint: 'wrist',
        stabilityThreshold: 60,
        description: 'Wrist strength for balance corrections',
      },
    ],
    warningMessage: 'Freestanding HSPU requires both pressing strength and balance. Master wall HSPU and freestanding holds first.',
    knowledgeBubble: 'Wall HSPU builds the pressing strength while freestanding holds develop balance.',
    safeProgressionLadder: ['pike_push_up', 'wall_hspu', 'freestanding_handstand', 'freestanding_hspu'],
    riskLevel: 'high',
  },
  
  // ===== ONE ARM PULL-UP =====
  {
    exerciseId: 'one_arm_pull_up',
    exerciseName: 'One-Arm Pull-Up',
    requiredStrengthMetrics: [
      {
        metric: 'pull_strength',
        level: 'elite',
        description: 'Can perform weighted pull-ups at bodyweight +75%',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'archer_pull_up',
        exerciseName: 'Archer Pull-Up',
        reps: 8,
      },
    ],
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 75,
        description: 'Single-arm shoulder stability under load',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 70,
        description: 'Elbow integrity for unilateral loading',
      },
    ],
    warningMessage: 'One-arm pull-ups require exceptional pulling strength. Build to 8+ archer pull-ups first.',
    knowledgeBubble: 'Archer pull-ups shift load progressively to one arm while maintaining control.',
    safeProgressionLadder: ['pull_up', 'weighted_pull_up', 'archer_pull_up', 'one_arm_assisted', 'one_arm_pull_up'],
    riskLevel: 'high',
  },
  
  // ===== BACK LEVER =====
  {
    exerciseId: 'back_lever',
    exerciseName: 'Back Lever',
    requiredStrengthMetrics: [
      {
        metric: 'straight_arm_strength',
        level: 'intermediate',
        description: 'Strong straight-arm pressing foundation',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'german_hang',
        exerciseName: 'German Hang',
        holdTimeSeconds: 20,
      },
      {
        exerciseId: 'skin_the_cat',
        exerciseName: 'Skin the Cat',
        reps: 5,
      },
    ],
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 65,
        description: 'Shoulder flexibility and strength in extension',
      },
    ],
    warningMessage: 'Back levers require shoulder flexibility in extension. Build German hang mobility first.',
    knowledgeBubble: 'German hangs develop the shoulder extension mobility needed for back lever.',
    safeProgressionLadder: ['skin_the_cat', 'german_hang', 'tuck_back_lever', 'adv_tuck_back_lever', 'back_lever'],
    riskLevel: 'high',
  },
  
  // ===== IRON CROSS (ASSISTED) =====
  {
    exerciseId: 'assisted_cross_hold',
    exerciseName: 'Assisted Cross Hold',
    requiredStrengthMetrics: [
      {
        metric: 'straight_arm_strength',
        level: 'intermediate',
        description: 'Strong straight-arm pressing from rings work',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'rto_support_hold',
        exerciseName: 'RTO Support Hold',
        holdTimeSeconds: 30,
      },
    ],
    minimumReadinessScore: 55,
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 70,
        description: 'High shoulder stability for horizontal loading',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 65,
        description: 'Elbow integrity for straight-arm loading',
      },
    ],
    warningMessage: 'Assisted cross requires exceptional shoulder stability. Build RTO support holds to 30+ seconds first.',
    knowledgeBubble: 'RTO support develops the shoulder position and stability needed for cross progressions.',
    safeProgressionLadder: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold'],
    riskLevel: 'high',
  },
  
  // ===== IRON CROSS (NEGATIVES) =====
  {
    exerciseId: 'cross_negatives',
    exerciseName: 'Cross Negatives',
    requiredStrengthMetrics: [
      {
        metric: 'straight_arm_strength',
        level: 'advanced',
        description: 'Advanced straight-arm shoulder strength',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'assisted_cross_hold',
        exerciseName: 'Assisted Cross Hold',
        holdTimeSeconds: 15,
      },
    ],
    minimumReadinessScore: 70,
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 75,
        description: 'Excellent shoulder stability under eccentric cross loading',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 70,
        description: 'Elbow tendon conditioning for cross stress',
      },
    ],
    warningMessage: 'Cross negatives place extreme stress on shoulders and elbows. Build assisted cross holds first.',
    knowledgeBubble: 'Assisted cross holds condition tendons for the demands of cross negatives.',
    safeProgressionLadder: ['rto_support_hold', 'assisted_cross_hold', 'cross_negatives'],
    riskLevel: 'very_high',
  },
  
  // ===== IRON CROSS (FULL) =====
  {
    exerciseId: 'full_iron_cross',
    exerciseName: 'Full Iron Cross',
    requiredStrengthMetrics: [
      {
        metric: 'straight_arm_strength',
        level: 'elite',
        description: 'Elite-level straight-arm shoulder strength',
      },
    ],
    requiredSkillStage: [
      {
        exerciseId: 'cross_negatives',
        exerciseName: 'Cross Negatives',
        reps: 5,
      },
      {
        exerciseId: 'partial_cross_hold',
        exerciseName: 'Partial Cross Hold',
        holdTimeSeconds: 10,
      },
    ],
    minimumReadinessScore: 85,
    requiredJointStability: [
      {
        joint: 'shoulder',
        stabilityThreshold: 85,
        description: 'Elite shoulder joint integrity',
      },
      {
        joint: 'elbow',
        stabilityThreshold: 80,
        description: 'Conditioned elbow tendons for full cross loading',
      },
    ],
    warningMessage: 'Full Iron Cross is an elite skill. Years of progressive tendon conditioning are required. Do not rush this progression.',
    knowledgeBubble: 'Iron Cross requires years of preparation. Rushing leads to shoulder and elbow injuries.',
    safeProgressionLadder: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold', 'cross_negatives', 'partial_cross_hold', 'full_iron_cross'],
    riskLevel: 'very_high',
  },
]

// =============================================================================
// CORE GATE CHECK FUNCTION
// =============================================================================

/**
 * Check if an athlete meets prerequisites for an exercise
 */
export function checkExercisePrerequisite(
  exerciseId: string,
  context: AthletePrerequisiteContext
): GateCheckResult {
  // Find the prerequisite rule
  const rule = PREREQUISITE_RULES.find(r => 
    r.exerciseId === exerciseId || 
    r.exerciseId === exerciseId.toLowerCase().replace(/\s+/g, '_')
  )
  
  // No rule = no gate = allowed
  if (!rule) {
    return {
      exerciseId,
      allowed: true,
      canOverride: false,
    }
  }
  
  const failedPrerequisites: GateCheckResult['failedPrerequisites'] = []
  
  // Check strength metrics
  if (rule.requiredStrengthMetrics) {
    for (const req of rule.requiredStrengthMetrics) {
      const athleteLevel = context.strengthLevels?.[req.metric]
      if (!meetsStrengthLevel(athleteLevel, req.level)) {
        failedPrerequisites.push({
          type: 'strength',
          description: req.description,
        })
      }
    }
  }
  
  // Check skill stages
  if (rule.requiredSkillStage) {
    for (const req of rule.requiredSkillStage) {
      const achieved = context.achievedSkillStages?.[req.exerciseId]
      
      if (req.holdTimeSeconds && (!achieved?.holdTimeSeconds || achieved.holdTimeSeconds < req.holdTimeSeconds)) {
        failedPrerequisites.push({
          type: 'skill_stage',
          description: `${req.exerciseName}: ${req.holdTimeSeconds}s hold required`,
        })
      }
      
      if (req.reps && (!achieved?.reps || achieved.reps < req.reps)) {
        failedPrerequisites.push({
          type: 'skill_stage',
          description: `${req.exerciseName}: ${req.reps} reps required`,
        })
      }
    }
  }
  
  // Check joint stability
  if (rule.requiredJointStability) {
    for (const req of rule.requiredJointStability) {
      const athleteScore = context.jointStabilityScores?.[req.joint] ?? 50
      
      // Check for joint cautions
      const hasJointCaution = context.jointCautions?.includes(req.joint)
      
      if (athleteScore < req.stabilityThreshold || hasJointCaution) {
        failedPrerequisites.push({
          type: 'joint_stability',
          description: req.description,
        })
      }
    }
  }
  
  // Check readiness score
  if (rule.minimumReadinessScore && rule.relatedSkill) {
    const readiness = context.readinessData?.find(r => r.skill === rule.relatedSkill)
    if (!readiness || readiness.readinessScore < rule.minimumReadinessScore) {
      failedPrerequisites.push({
        type: 'readiness',
        description: `${rule.relatedSkill.replace('_', ' ')} readiness score below ${rule.minimumReadinessScore}%`,
      })
    }
  }
  
  // Determine result
  const allowed = failedPrerequisites.length === 0
  
  // Find recommended substitute (one step back in progression)
  let recommendedSubstitute: GateCheckResult['recommendedSubstitute'] | undefined
  
  if (!allowed && rule.safeProgressionLadder.length > 1) {
    const targetIndex = rule.safeProgressionLadder.indexOf(exerciseId)
    const substituteIndex = targetIndex > 0 ? targetIndex - 1 : 0
    const substituteId = rule.safeProgressionLadder[substituteIndex]
    
    // Try to find the exercise name
    const substituteExercise = getAllExercises().find(e => 
      e.id === substituteId || e.name.toLowerCase().replace(/\s+/g, '_') === substituteId
    )
    
    recommendedSubstitute = {
      exerciseId: substituteId,
      exerciseName: substituteExercise?.name || formatExerciseName(substituteId),
      reason: `Builds the foundation for ${rule.exerciseName}`,
    }
  }
  
  return {
    exerciseId,
    allowed,
    recommendedSubstitute,
    failedPrerequisites: failedPrerequisites.length > 0 ? failedPrerequisites : undefined,
    warningMessage: !allowed ? rule.warningMessage : undefined,
    knowledgeBubble: rule.knowledgeBubble,
    canOverride: true,
    overrideRiskLevel: !allowed ? rule.riskLevel : undefined,
  }
}

/**
 * Batch check multiple exercises
 */
export function checkMultiplePrerequisites(
  exerciseIds: string[],
  context: AthletePrerequisiteContext
): Map<string, GateCheckResult> {
  const results = new Map<string, GateCheckResult>()
  
  for (const id of exerciseIds) {
    results.set(id, checkExercisePrerequisite(id, context))
  }
  
  return results
}

/**
 * Get the safe substitute for an exercise that failed gate check
 */
export function getSafeSubstitute(
  exerciseId: string,
  context: AthletePrerequisiteContext
): { exerciseId: string; exerciseName: string; reason: string } | null {
  const gateResult = checkExercisePrerequisite(exerciseId, context)
  
  if (gateResult.allowed) {
    return null // No substitute needed
  }
  
  return gateResult.recommendedSubstitute || null
}

/**
 * Get the full progression ladder for an exercise
 */
export function getProgressionLadder(exerciseId: string): string[] | null {
  const rule = PREREQUISITE_RULES.find(r => 
    r.exerciseId === exerciseId || 
    r.exerciseId === exerciseId.toLowerCase().replace(/\s+/g, '_')
  )
  
  return rule?.safeProgressionLadder || null
}

/**
 * Get knowledge bubble for an exercise
 */
export function getExerciseKnowledgeBubble(exerciseId: string): string | null {
  const rule = PREREQUISITE_RULES.find(r => 
    r.exerciseId === exerciseId || 
    r.exerciseId === exerciseId.toLowerCase().replace(/\s+/g, '_')
  )
  
  return rule?.knowledgeBubble || null
}

/**
 * Check if an exercise is gated (has prerequisite rules)
 */
export function isGatedExercise(exerciseId: string): boolean {
  return PREREQUISITE_RULES.some(r => 
    r.exerciseId === exerciseId || 
    r.exerciseId === exerciseId.toLowerCase().replace(/\s+/g, '_')
  )
}

/**
 * Get all gated exercise IDs
 */
export function getGatedExerciseIds(): string[] {
  return PREREQUISITE_RULES.map(r => r.exerciseId)
}

// =============================================================================
// CONTEXT BUILDING HELPERS
// =============================================================================

/**
 * Build prerequisite context from athlete profile and readiness data
 */
export function buildPrerequisiteContext(
  profile: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    jointCautions?: JointArea[]
  },
  readinessData?: SkillReadinessData[],
  achievedSkillStages?: Record<string, { holdTimeSeconds?: number; reps?: number }>
): AthletePrerequisiteContext {
  // Infer strength levels from experience
  const strengthLevels: Record<string, StrengthLevel> = {}
  
  if (profile.experienceLevel === 'beginner') {
    strengthLevels['push_strength'] = 'beginner'
    strengthLevels['pull_strength'] = 'beginner'
    strengthLevels['straight_arm_strength'] = 'novice'
    strengthLevels['ring_strength'] = 'novice'
  } else if (profile.experienceLevel === 'intermediate') {
    strengthLevels['push_strength'] = 'intermediate'
    strengthLevels['pull_strength'] = 'intermediate'
    strengthLevels['straight_arm_strength'] = 'beginner'
    strengthLevels['ring_strength'] = 'beginner'
  } else {
    strengthLevels['push_strength'] = 'advanced'
    strengthLevels['pull_strength'] = 'advanced'
    strengthLevels['straight_arm_strength'] = 'intermediate'
    strengthLevels['ring_strength'] = 'intermediate'
  }
  
  // Infer joint stability from experience level
  const baseStability = profile.experienceLevel === 'beginner' ? 40 :
                        profile.experienceLevel === 'intermediate' ? 55 : 70
  
  const jointStabilityScores: Record<JointArea, number> = {
    shoulder: baseStability,
    elbow: baseStability + 5,
    wrist: baseStability - 5,
    lower_back: baseStability,
    hip: baseStability + 5,
    knee: baseStability + 10,
    ankle: baseStability + 10,
  }
  
  // Reduce stability for joints with cautions
  if (profile.jointCautions) {
    for (const joint of profile.jointCautions) {
      jointStabilityScores[joint] = Math.max(20, jointStabilityScores[joint] - 25)
    }
  }
  
  return {
    strengthLevels,
    achievedSkillStages: achievedSkillStages || {},
    jointStabilityScores,
    readinessData,
    experienceLevel: profile.experienceLevel,
    jointCautions: profile.jointCautions,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function meetsStrengthLevel(current: StrengthLevel | undefined, required: StrengthLevel): boolean {
  const levelOrder: Record<StrengthLevel, number> = {
    novice: 1,
    beginner: 2,
    intermediate: 3,
    advanced: 4,
    elite: 5,
  }
  
  const currentLevel = current ? levelOrder[current] : 0
  const requiredLevel = levelOrder[required]
  
  return currentLevel >= requiredLevel
}

function formatExerciseName(id: string): string {
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
