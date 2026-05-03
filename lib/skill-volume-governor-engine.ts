/**
 * Skill Fatigue & Volume Governor Engine
 * 
 * Intelligently controls weekly and session-level volume for high-stress skill work.
 * Acts as a "brake" when programming becomes too aggressive.
 * 
 * KEY DESIGN PRINCIPLES:
 * - Movement-family-specific stress tracking (not one generic cap)
 * - Straight-arm and bent-arm families governed separately
 * - Protects tendons, joints, technique quality, and long-term progress
 * - Integrates with Performance Envelope for personalized limits
 * - Deterministic, coach-like behavior (not random reductions)
 */

import type { MovementFamily } from './movement-family-registry'
import type { SkillGraphId } from './skill-progression-graph-engine'
import type { WeakPointType } from './weak-point-engine'

// =============================================================================
// TYPES
// =============================================================================

export type SkillStressFocus = MovementFamily | 'straight_arm_pull' | 'straight_arm_push' | 
  'ring_support' | 'ring_strength' | 'explosive_pull' | 'compression_core'

export type JointStressFocus = 
  | 'wrist'
  | 'elbow'
  | 'shoulder'
  | 'shoulder_tendon'
  | 'scapular_tendon'
  | 'hip_flexor'
  | 'bicep_tendon'
  | 'sternum'

export type TendonStressLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
export type FatigueRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical'

/**
 * Skill Stress tracking structure
 */
export interface SkillStress {
  skillStressId: string
  athleteId: string
  movementFamily: SkillStressFocus
  skillTarget?: SkillGraphId
  sessionStressScore: number
  weeklyStressScore: number
  jointStressFocus: JointStressFocus[]
  tendonStressLevel: TendonStressLevel
  fatigueRiskLevel: FatigueRiskLevel
  dateTracked: Date
}

/**
 * Session stress analysis result
 */
export interface SessionStressAnalysis {
  totalSessionStress: number
  stressByFamily: Record<SkillStressFocus, number>
  jointStressProfile: Record<JointStressFocus, number>
  tendonRiskLevel: TendonStressLevel
  fatigueRiskLevel: FatigueRiskLevel
  highRiskElements: string[]
  governorRecommendations: GovernorRecommendation[]
  coachingExplanation: string
}

/**
 * Weekly stress accumulation tracking
 */
export interface WeeklyStressAccumulation {
  athleteId: string
  weekStartDate: Date
  stressByFamily: Record<SkillStressFocus, number>
  totalWeeklyStress: number
  sessionsThisWeek: number
  highStressSessions: number
  familiesAtLimit: SkillStressFocus[]
  familiesNearLimit: SkillStressFocus[]
  recoveryNeeded: boolean
}

/**
 * Governor recommendation for session adjustment
 */
export interface GovernorRecommendation {
  recommendationType: GovernorRecommendationType
  targetFamily?: SkillStressFocus
  currentValue: number
  recommendedValue: number
  rationale: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export type GovernorRecommendationType =
  | 'reduce_sets'
  | 'lower_progression'
  | 'swap_to_support_work'
  | 'reduce_density'
  | 'add_rest_day'
  | 'increase_warmup'
  | 'avoid_advanced_node'
  | 'change_session_structure'
  | 'preserve_as_is'

/**
 * Exercise stress profile for scoring
 */
export interface ExerciseStressProfile {
  exerciseId: string
  primaryStressFamily: SkillStressFocus
  secondaryStressFamilies?: SkillStressFocus[]
  jointStress: Partial<Record<JointStressFocus, number>> // 0-100
  tendonStressLevel: TendonStressLevel
  baseStressScore: number // 1-10 scale
  leverageDifficultyMultiplier: number // 1.0-2.0
  tempoMultiplier: number // 1.0-1.5 for slow tempo work
  weightedMultiplier: number // 1.0-2.0 for weighted variations
  ringInstabilityMultiplier: number // 1.0-1.5 for ring work
}

/**
 * Governor input for session analysis
 */
export interface GovernorSessionInput {
  athleteId: string
  plannedExercises: PlannedExercise[]
  sessionStructureType: 'standard' | 'emom' | 'ladder' | 'pyramid' | 'density_block' | 'short_circuit'
  sessionDurationMinutes: number
  isDeloadWeek: boolean
  currentFramework?: string
  trainingStyle?: string
  weeklyStressSoFar?: WeeklyStressAccumulation
  envelopeLimits?: EnvelopeLimits
}

export interface PlannedExercise {
  exerciseId: string
  exerciseName: string
  sets: number
  reps: number
  holdSeconds?: number
  isWeighted: boolean
  weightKg?: number
  tempoControlled: boolean
  progressionLevel: 'foundation' | 'intermediate' | 'advanced' | 'elite' | 'master'
  movementFamily: SkillStressFocus
  isRingBased: boolean
  isAdvancedSkillNode: boolean
}

export interface EnvelopeLimits {
  straightArmPullTolerance: number // 0-100
  straightArmPushTolerance: number // 0-100
  ringSupportTolerance: number // 0-100
  explosivePullTolerance: number // 0-100
  densityTolerance: 'poor' | 'moderate' | 'good'
  weeklyVolumeCap: number // sets
}

// =============================================================================
// STRESS SCORING CONSTANTS
// =============================================================================

/**
 * Base stress scores by movement family (per set)
 * Straight-arm and ring work score higher than bent-arm basics
 */
const BASE_STRESS_BY_FAMILY: Record<SkillStressFocus, number> = {
  straight_arm_pull: 8,
  straight_arm_push: 9,
  ring_support: 7,
  ring_strength: 10,
  explosive_pull: 6,
  compression_core: 4,
  vertical_pull: 3,
  horizontal_pull: 4,
  vertical_push: 3,
  horizontal_push: 3,
  dip_pattern: 3,
  squat_pattern: 2,
  hinge_pattern: 2,
  // [SKILL-STRESS-FOCUS-CONTRACT] barbell_hinge is a canonical MovementFamily
  // (lib/movement-family-registry.ts:35) and therefore part of the
  // SkillStressFocus union. Per-set base stress is set to 3 — same magnitude
  // as dip_pattern and slightly above hinge_pattern, reflecting that loaded
  // deadlift hinges carry more systemic fatigue than bodyweight RDLs but
  // less than ring/straight-arm work. Doctrine intent of the surrounding
  // entries is preserved verbatim.
  barbell_hinge: 3,
  unilateral_leg: 2,
  anti_extension_core: 2,
  anti_rotation_core: 2,
  rotational_core: 2,
  scapular_control: 2,
  explosive_push: 5,
  joint_integrity: 1,
  mobility: 1,
  transition: 5,
  rings_stability: 6,
  rings_strength: 9,
  shoulder_isolation: 2,
  arm_isolation: 1,
  grip_strength: 2,
  hypertrophy_accessory: 2,
}

/**
 * Progression level multipliers
 */
const PROGRESSION_MULTIPLIERS: Record<string, number> = {
  foundation: 1.0,
  intermediate: 1.2,
  advanced: 1.5,
  elite: 1.8,
  master: 2.0,
}

/**
 * Session structure multipliers (density formats increase stress)
 */
const STRUCTURE_MULTIPLIERS: Record<string, number> = {
  standard: 1.0,
  emom: 1.1,
  ladder: 1.2,
  pyramid: 1.3,
  density_block: 1.4,
  short_circuit: 1.1,
}

/**
 * Weekly stress thresholds by family
 */
const WEEKLY_STRESS_THRESHOLDS: Record<SkillStressFocus, { safe: number; warning: number; limit: number }> = {
  straight_arm_pull: { safe: 80, warning: 120, limit: 160 },
  straight_arm_push: { safe: 70, warning: 100, limit: 140 },
  ring_support: { safe: 60, warning: 90, limit: 120 },
  ring_strength: { safe: 50, warning: 70, limit: 100 },
  explosive_pull: { safe: 100, warning: 150, limit: 200 },
  compression_core: { safe: 120, warning: 180, limit: 240 },
  vertical_pull: { safe: 150, warning: 220, limit: 300 },
  horizontal_pull: { safe: 140, warning: 200, limit: 280 },
  vertical_push: { safe: 140, warning: 200, limit: 280 },
  horizontal_push: { safe: 140, warning: 200, limit: 280 },
  dip_pattern: { safe: 130, warning: 190, limit: 260 },
  squat_pattern: { safe: 160, warning: 240, limit: 320 },
  hinge_pattern: { safe: 140, warning: 200, limit: 280 },
  // [SKILL-STRESS-FOCUS-CONTRACT] barbell_hinge thresholds set conservatively
  // 10-15% lower than hinge_pattern — loaded barbell deadlift work fatigues
  // the posterior chain faster than bodyweight hinges. Same shape as the
  // hinge_pattern row above; only the absolute numbers differ.
  barbell_hinge: { safe: 120, warning: 170, limit: 240 },
  unilateral_leg: { safe: 120, warning: 180, limit: 240 },
  anti_extension_core: { safe: 140, warning: 200, limit: 280 },
  anti_rotation_core: { safe: 120, warning: 180, limit: 240 },
  rotational_core: { safe: 100, warning: 150, limit: 200 },
  scapular_control: { safe: 140, warning: 200, limit: 280 },
  explosive_push: { safe: 100, warning: 150, limit: 200 },
  joint_integrity: { safe: 200, warning: 300, limit: 400 },
  mobility: { safe: 300, warning: 400, limit: 500 },
  transition: { safe: 80, warning: 120, limit: 160 },
  rings_stability: { safe: 100, warning: 150, limit: 200 },
  rings_strength: { safe: 60, warning: 90, limit: 120 },
  shoulder_isolation: { safe: 140, warning: 200, limit: 280 },
  arm_isolation: { safe: 160, warning: 240, limit: 320 },
  grip_strength: { safe: 120, warning: 180, limit: 240 },
  hypertrophy_accessory: { safe: 180, warning: 260, limit: 360 },
}

/**
 * Advanced skill nodes that require stricter governance
 */
const HIGH_RISK_SKILL_NODES: string[] = [
  'iron_cross', 'maltese', 'full_planche', 'straddle_planche',
  'full_front_lever', 'one_arm_front_lever', 'planche_pushup',
  'weighted_muscle_up', 'one_arm_pull_up', 'full_back_lever',
  'straddle_planche_pushup', 'full_planche_pushup',
  'one_arm_front_lever_row', 'maltese_negative',
]

/**
 * Session structure + family combinations that are unsafe
 */
const UNSAFE_STRUCTURE_COMBINATIONS: Array<{ structure: string; families: SkillStressFocus[] }> = [
  { structure: 'density_block', families: ['ring_strength', 'straight_arm_push'] },
  { structure: 'pyramid', families: ['ring_strength', 'straight_arm_push', 'straight_arm_pull'] },
  { structure: 'ladder', families: ['ring_strength'] },
  { structure: 'density_block', families: ['explosive_pull'] }, // Only for weighted
]

// =============================================================================
// SESSION STRESS SCORING
// =============================================================================

/**
 * Calculate stress score for a single exercise
 */
export function calculateExerciseStress(exercise: PlannedExercise): number {
  const baseStress = BASE_STRESS_BY_FAMILY[exercise.movementFamily] || 3
  const progressionMultiplier = PROGRESSION_MULTIPLIERS[exercise.progressionLevel] || 1.0
  
  let stressScore = baseStress * exercise.sets * progressionMultiplier
  
  // Apply modifiers
  if (exercise.isWeighted) {
    const weightMultiplier = 1 + (exercise.weightKg || 0) * 0.02 // +2% per kg
    stressScore *= Math.min(2.0, weightMultiplier)
  }
  
  if (exercise.tempoControlled) {
    stressScore *= 1.3 // Tempo work increases stress
  }
  
  if (exercise.isRingBased) {
    stressScore *= 1.2 // Ring instability adds stress
  }
  
  if (exercise.isAdvancedSkillNode) {
    stressScore *= 1.4 // Advanced nodes are inherently more stressful
  }
  
  // Hold-based exercises scale with duration
  if (exercise.holdSeconds) {
    stressScore *= 1 + (exercise.holdSeconds / 30) * 0.5
  }
  
  return Math.round(stressScore * 10) / 10
}

/**
 * Analyze session stress and generate governor recommendations
 */
export function analyzeSessionStress(input: GovernorSessionInput): SessionStressAnalysis {
  const stressByFamily: Record<string, number> = {}
  const jointStressProfile: Record<string, number> = {}
  let totalSessionStress = 0
  const highRiskElements: string[] = []
  const recommendations: GovernorRecommendation[] = []
  
  // Calculate stress for each exercise
  for (const exercise of input.plannedExercises) {
    const exerciseStress = calculateExerciseStress(exercise)
    totalSessionStress += exerciseStress
    
    // Accumulate by family
    const family = exercise.movementFamily
    stressByFamily[family] = (stressByFamily[family] || 0) + exerciseStress
    
    // Track joint stress
    const jointStress = getJointStressForExercise(exercise)
    for (const [joint, stress] of Object.entries(jointStress)) {
      jointStressProfile[joint] = Math.max(jointStressProfile[joint] || 0, stress)
    }
    
    // Flag high-risk elements
    if (exercise.isAdvancedSkillNode || HIGH_RISK_SKILL_NODES.some(n => exercise.exerciseId.includes(n))) {
      highRiskElements.push(exercise.exerciseName)
    }
  }
  
  // Apply structure multiplier
  const structureMultiplier = STRUCTURE_MULTIPLIERS[input.sessionStructureType] || 1.0
  totalSessionStress *= structureMultiplier
  
  // Check for unsafe structure combinations
  for (const combo of UNSAFE_STRUCTURE_COMBINATIONS) {
    if (input.sessionStructureType === combo.structure) {
      for (const family of combo.families) {
        if ((stressByFamily[family] || 0) > 0) {
          recommendations.push({
            recommendationType: 'change_session_structure',
            targetFamily: family,
            currentValue: stressByFamily[family],
            recommendedValue: 0,
            rationale: `${family} work is not safe in ${input.sessionStructureType} format. Use standard structure instead.`,
            priority: 'high',
          })
        }
      }
    }
  }
  
  // Check weekly accumulation if provided
  if (input.weeklyStressSoFar) {
    for (const [family, stress] of Object.entries(stressByFamily)) {
      const familyKey = family as SkillStressFocus
      const currentWeekly = input.weeklyStressSoFar.stressByFamily[familyKey] || 0
      const projectedWeekly = currentWeekly + stress
      const thresholds = WEEKLY_STRESS_THRESHOLDS[familyKey]
      
      if (thresholds && projectedWeekly > thresholds.limit) {
        recommendations.push({
          recommendationType: 'reduce_sets',
          targetFamily: familyKey,
          currentValue: stress,
          recommendedValue: Math.max(0, thresholds.limit - currentWeekly),
          rationale: `Weekly ${family} stress would exceed safe limit. Reduce volume or skip this family today.`,
          priority: 'critical',
        })
      } else if (thresholds && projectedWeekly > thresholds.warning) {
        recommendations.push({
          recommendationType: 'reduce_sets',
          targetFamily: familyKey,
          currentValue: stress,
          recommendedValue: stress * 0.7,
          rationale: `Weekly ${family} stress approaching limit. Consider reducing volume.`,
          priority: 'medium',
        })
      }
    }
  }
  
  // Check envelope limits if provided
  if (input.envelopeLimits) {
    applyEnvelopeLimits(stressByFamily, input.envelopeLimits, recommendations)
  }
  
  // Apply deload week reductions
  if (input.isDeloadWeek) {
    recommendations.push({
      recommendationType: 'reduce_sets',
      currentValue: totalSessionStress,
      recommendedValue: totalSessionStress * 0.6,
      rationale: 'Deload week: reduce overall stress by 40%.',
      priority: 'high',
    })
  }
  
  // Determine overall risk levels
  const tendonRiskLevel = calculateTendonRiskLevel(jointStressProfile, stressByFamily)
  const fatigueRiskLevel = calculateFatigueRiskLevel(totalSessionStress, stressByFamily, input)
  
  // Generate coaching explanation
  const coachingExplanation = generateCoachingExplanation(
    totalSessionStress,
    stressByFamily as Record<SkillStressFocus, number>,
    recommendations,
    fatigueRiskLevel
  )
  
  return {
    totalSessionStress: Math.round(totalSessionStress),
    stressByFamily: stressByFamily as Record<SkillStressFocus, number>,
    jointStressProfile: jointStressProfile as Record<JointStressFocus, number>,
    tendonRiskLevel,
    fatigueRiskLevel,
    highRiskElements,
    governorRecommendations: recommendations,
    coachingExplanation,
  }
}

/**
 * Get joint stress mapping for an exercise
 */
function getJointStressForExercise(exercise: PlannedExercise): Record<JointStressFocus, number> {
  const jointStress: Partial<Record<JointStressFocus, number>> = {}
  
  // Family-based joint stress defaults
  const familyJointMap: Record<SkillStressFocus, Partial<Record<JointStressFocus, number>>> = {
    straight_arm_pull: { shoulder: 70, elbow: 50, scapular_tendon: 80 },
    straight_arm_push: { shoulder: 80, wrist: 70, shoulder_tendon: 90 },
    ring_support: { shoulder: 60, shoulder_tendon: 70 },
    ring_strength: { shoulder: 90, shoulder_tendon: 95, elbow: 60 },
    explosive_pull: { shoulder: 50, elbow: 60, bicep_tendon: 70 },
    compression_core: { hip_flexor: 60 },
    vertical_pull: { shoulder: 40, elbow: 50, bicep_tendon: 40 },
    horizontal_pull: { shoulder: 40, elbow: 40 },
    vertical_push: { shoulder: 50, wrist: 60 },
    horizontal_push: { shoulder: 40, wrist: 40 },
    dip_pattern: { shoulder: 50, elbow: 40, sternum: 30 },
    transition: { shoulder: 60, elbow: 50 },
    rings_stability: { shoulder: 50, shoulder_tendon: 60 },
    rings_strength: { shoulder: 85, shoulder_tendon: 90 },
    squat_pattern: {},
    hinge_pattern: {},
    // [SKILL-STRESS-FOCUS-CONTRACT] barbell_hinge: deadlift variants load the
    // hip flexors and lumbar spine. hip_flexor is the only canonical
    // JointStressFocus that maps cleanly to barbell hinge fatigue; the other
    // canonical foci (wrist/elbow/shoulder/scapular_tendon/bicep_tendon/sternum)
    // are not loaded by deadlift patterns. Empty `{}` would falsely imply
    // zero joint stress, so a single hip_flexor: 40 entry is doctrinally
    // accurate without overstating systemic load.
    barbell_hinge: { hip_flexor: 40 },
    unilateral_leg: {},
    anti_extension_core: {},
    anti_rotation_core: {},
    rotational_core: {},
    scapular_control: { shoulder: 30, scapular_tendon: 40 },
    explosive_push: { shoulder: 50, wrist: 50 },
    joint_integrity: {},
    mobility: {},
    shoulder_isolation: { shoulder: 40 },
    arm_isolation: { elbow: 30 },
    grip_strength: { wrist: 40 },
    hypertrophy_accessory: {},
  }
  
  const familyDefaults = familyJointMap[exercise.movementFamily] || {}
  Object.assign(jointStress, familyDefaults)
  
  // Increase for advanced progressions
  if (exercise.progressionLevel === 'elite' || exercise.progressionLevel === 'master') {
    for (const joint of Object.keys(jointStress) as JointStressFocus[]) {
      jointStress[joint] = Math.min(100, (jointStress[joint] || 0) * 1.3)
    }
  }
  
  // Increase for weighted work
  if (exercise.isWeighted) {
    for (const joint of Object.keys(jointStress) as JointStressFocus[]) {
      jointStress[joint] = Math.min(100, (jointStress[joint] || 0) * 1.2)
    }
  }
  
  return jointStress as Record<JointStressFocus, number>
}

/**
 * Apply envelope limits to generate additional recommendations
 */
function applyEnvelopeLimits(
  stressByFamily: Record<string, number>,
  limits: EnvelopeLimits,
  recommendations: GovernorRecommendation[]
): void {
  // Check straight-arm tolerances
  const saPullStress = stressByFamily['straight_arm_pull'] || 0
  if (saPullStress > 0 && limits.straightArmPullTolerance < 50) {
    recommendations.push({
      recommendationType: 'reduce_sets',
      targetFamily: 'straight_arm_pull',
      currentValue: saPullStress,
      recommendedValue: saPullStress * (limits.straightArmPullTolerance / 100),
      rationale: 'Athlete has low straight-arm pull tolerance. Reduce volume to match envelope.',
      priority: 'high',
    })
  }
  
  const saPushStress = stressByFamily['straight_arm_push'] || 0
  if (saPushStress > 0 && limits.straightArmPushTolerance < 50) {
    recommendations.push({
      recommendationType: 'reduce_sets',
      targetFamily: 'straight_arm_push',
      currentValue: saPushStress,
      recommendedValue: saPushStress * (limits.straightArmPushTolerance / 100),
      rationale: 'Athlete has low straight-arm push tolerance. Reduce volume to match envelope.',
      priority: 'high',
    })
  }
  
  const ringStress = (stressByFamily['ring_support'] || 0) + (stressByFamily['ring_strength'] || 0)
  if (ringStress > 0 && limits.ringSupportTolerance < 50) {
    recommendations.push({
      recommendationType: 'reduce_sets',
      targetFamily: 'ring_support',
      currentValue: ringStress,
      recommendedValue: ringStress * (limits.ringSupportTolerance / 100),
      rationale: 'Athlete has low ring stability tolerance. Reduce ring work volume.',
      priority: 'high',
    })
  }
  
  // Check density tolerance
  if (limits.densityTolerance === 'poor') {
    const highDensityFamilies = ['straight_arm_pull', 'straight_arm_push', 'ring_strength']
    for (const family of highDensityFamilies) {
      if (stressByFamily[family] > 0) {
        recommendations.push({
          recommendationType: 'reduce_density',
          targetFamily: family as SkillStressFocus,
          currentValue: stressByFamily[family],
          recommendedValue: stressByFamily[family] * 0.7,
          rationale: 'Athlete has poor density tolerance. Use longer rest periods for skill work.',
          priority: 'medium',
        })
      }
    }
  }
}

/**
 * Calculate tendon risk level from joint stress profile
 */
function calculateTendonRiskLevel(
  jointStress: Record<string, number>,
  stressByFamily: Record<string, number>
): TendonStressLevel {
  const tendonJoints: JointStressFocus[] = ['shoulder_tendon', 'scapular_tendon', 'bicep_tendon']
  let maxTendonStress = 0
  
  for (const joint of tendonJoints) {
    maxTendonStress = Math.max(maxTendonStress, jointStress[joint] || 0)
  }
  
  // High-stress families contribute to overall tendon risk
  const straightArmStress = (stressByFamily['straight_arm_pull'] || 0) + 
                            (stressByFamily['straight_arm_push'] || 0) +
                            (stressByFamily['ring_strength'] || 0)
  
  const combinedRisk = maxTendonStress + (straightArmStress * 0.3)
  
  if (combinedRisk >= 100) return 'extreme'
  if (combinedRisk >= 80) return 'very_high'
  if (combinedRisk >= 60) return 'high'
  if (combinedRisk >= 40) return 'moderate'
  if (combinedRisk >= 20) return 'low'
  return 'minimal'
}

/**
 * Calculate overall fatigue risk level
 */
function calculateFatigueRiskLevel(
  totalStress: number,
  stressByFamily: Record<string, number>,
  input: GovernorSessionInput
): FatigueRiskLevel {
  let riskScore = totalStress / 10
  
  // Add risk for high-stress families
  riskScore += ((stressByFamily['straight_arm_push'] || 0) / 20)
  riskScore += ((stressByFamily['ring_strength'] || 0) / 15)
  
  // Add risk for multiple high-stress families in one session
  const highStressFamilies = ['straight_arm_pull', 'straight_arm_push', 'ring_strength', 'ring_support']
  const activeHighStressFamilies = highStressFamilies.filter(f => (stressByFamily[f] || 0) > 20).length
  riskScore += activeHighStressFamilies * 5
  
  // Add risk for density formats
  if (input.sessionStructureType === 'density_block' || input.sessionStructureType === 'pyramid') {
    riskScore += 10
  }
  
  // Reduce risk for deload
  if (input.isDeloadWeek) {
    riskScore *= 0.5
  }
  
  if (riskScore >= 50) return 'critical'
  if (riskScore >= 35) return 'high'
  if (riskScore >= 20) return 'elevated'
  if (riskScore >= 10) return 'moderate'
  return 'low'
}

// =============================================================================
// WEEKLY STRESS TRACKING
// =============================================================================

/**
 * Calculate weekly stress accumulation
 */
export function calculateWeeklyStress(
  athleteId: string,
  sessionAnalyses: SessionStressAnalysis[],
  weekStartDate: Date
): WeeklyStressAccumulation {
  const stressByFamily: Record<SkillStressFocus, number> = {} as Record<SkillStressFocus, number>
  let totalWeeklyStress = 0
  let highStressSessions = 0
  
  for (const session of sessionAnalyses) {
    totalWeeklyStress += session.totalSessionStress
    
    for (const [family, stress] of Object.entries(session.stressByFamily)) {
      stressByFamily[family as SkillStressFocus] = 
        (stressByFamily[family as SkillStressFocus] || 0) + stress
    }
    
    if (session.fatigueRiskLevel === 'high' || session.fatigueRiskLevel === 'critical') {
      highStressSessions++
    }
  }
  
  // Determine which families are at or near limit
  const familiesAtLimit: SkillStressFocus[] = []
  const familiesNearLimit: SkillStressFocus[] = []
  
  for (const [family, stress] of Object.entries(stressByFamily)) {
    const thresholds = WEEKLY_STRESS_THRESHOLDS[family as SkillStressFocus]
    if (thresholds) {
      if (stress >= thresholds.limit) {
        familiesAtLimit.push(family as SkillStressFocus)
      } else if (stress >= thresholds.warning) {
        familiesNearLimit.push(family as SkillStressFocus)
      }
    }
  }
  
  return {
    athleteId,
    weekStartDate,
    stressByFamily,
    totalWeeklyStress,
    sessionsThisWeek: sessionAnalyses.length,
    highStressSessions,
    familiesAtLimit,
    familiesNearLimit,
    recoveryNeeded: familiesAtLimit.length > 0 || highStressSessions >= 3,
  }
}

/**
 * Check if a proposed session would exceed weekly limits
 */
export function wouldExceedWeeklyLimits(
  proposedSession: SessionStressAnalysis,
  currentWeeklyStress: WeeklyStressAccumulation
): { exceeds: boolean; violations: string[] } {
  const violations: string[] = []
  
  for (const [family, stress] of Object.entries(proposedSession.stressByFamily)) {
    const currentStress = currentWeeklyStress.stressByFamily[family as SkillStressFocus] || 0
    const projectedStress = currentStress + stress
    const thresholds = WEEKLY_STRESS_THRESHOLDS[family as SkillStressFocus]
    
    if (thresholds && projectedStress > thresholds.limit) {
      violations.push(`${family}: ${Math.round(projectedStress)} exceeds limit of ${thresholds.limit}`)
    }
  }
  
  return {
    exceeds: violations.length > 0,
    violations,
  }
}

// =============================================================================
// GOVERNOR RESPONSE GENERATION
// =============================================================================

/**
 * Apply governor recommendations to modify a session
 */
export function applyGovernorRecommendations(
  exercises: PlannedExercise[],
  recommendations: GovernorRecommendation[]
): {
  modifiedExercises: PlannedExercise[]
  changesApplied: string[]
} {
  const modifiedExercises = [...exercises]
  const changesApplied: string[] = []
  
  // Sort by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedRecs = [...recommendations].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )
  
  for (const rec of sortedRecs) {
    switch (rec.recommendationType) {
      case 'reduce_sets':
        if (rec.targetFamily) {
          for (const ex of modifiedExercises) {
            if (ex.movementFamily === rec.targetFamily && ex.sets > 1) {
              const reduction = Math.ceil(ex.sets * 0.3)
              ex.sets = Math.max(1, ex.sets - reduction)
              changesApplied.push(`Reduced ${ex.exerciseName} sets to preserve quality`)
            }
          }
        }
        break
        
      case 'lower_progression':
        for (const ex of modifiedExercises) {
          if (rec.targetFamily && ex.movementFamily === rec.targetFamily) {
            changesApplied.push(`Consider using an easier progression for ${ex.exerciseName}`)
          }
        }
        break
        
      case 'avoid_advanced_node':
        for (let i = modifiedExercises.length - 1; i >= 0; i--) {
          if (modifiedExercises[i].isAdvancedSkillNode && rec.targetFamily === modifiedExercises[i].movementFamily) {
            changesApplied.push(`Removed ${modifiedExercises[i].exerciseName} - too advanced for current stress levels`)
            modifiedExercises.splice(i, 1)
          }
        }
        break
    }
  }
  
  return { modifiedExercises, changesApplied }
}

/**
 * Generate coaching explanation for stress analysis
 */
function generateCoachingExplanation(
  totalStress: number,
  stressByFamily: Record<SkillStressFocus, number>,
  recommendations: GovernorRecommendation[],
  riskLevel: FatigueRiskLevel
): string {
  const explanations: string[] = []
  
  // Overall assessment
  if (riskLevel === 'low') {
    explanations.push('Session stress is well-balanced.')
  } else if (riskLevel === 'moderate') {
    explanations.push('Session has moderate stress. Quality should be maintained with focus.')
  } else if (riskLevel === 'elevated') {
    explanations.push('Session stress is elevated. Prioritize technique over volume.')
  } else if (riskLevel === 'high') {
    explanations.push('High session stress detected. Volume adjustments recommended.')
  } else {
    explanations.push('Critical stress level. Session requires significant modification.')
  }
  
  // Family-specific notes
  const highStressFamilies = Object.entries(stressByFamily)
    .filter(([, stress]) => stress > 40)
    .map(([family]) => family)
  
  if (highStressFamilies.includes('straight_arm_push')) {
    explanations.push('Straight-arm push volume is significant - tendons need adequate recovery.')
  }
  if (highStressFamilies.includes('ring_strength')) {
    explanations.push('Ring strength work is demanding - maintain strict rest periods.')
  }
  
  // Critical recommendations
  const criticalRecs = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')
  if (criticalRecs.length > 0) {
    explanations.push(criticalRecs[0].rationale)
  }
  
  return explanations.slice(0, 3).join(' ')
}

// =============================================================================
// FRAMEWORK-AWARE STRESS ADJUSTMENT
// =============================================================================

/**
 * Adjust stress thresholds based on coaching framework
 */
export function getFrameworkAdjustedThresholds(
  framework: string,
  baseThresholds: typeof WEEKLY_STRESS_THRESHOLDS
): typeof WEEKLY_STRESS_THRESHOLDS {
  const adjustedThresholds = JSON.parse(JSON.stringify(baseThresholds))
  
  const frameworkMultipliers: Record<string, number> = {
    barseagle_strength: 0.9, // More conservative for heavy work
    skill_frequency: 1.1, // Allow more frequent, lower-dose exposures
    tendon_conservative: 0.7, // Much more conservative for tendon safety
    density_endurance: 1.0, // Standard but avoid density for high-risk families
    strength_conversion: 0.95, // Slightly conservative for weighted work
    hybrid_balanced: 1.0, // Standard thresholds
  }
  
  const multiplier = frameworkMultipliers[framework] || 1.0
  
  for (const family of Object.keys(adjustedThresholds) as SkillStressFocus[]) {
    adjustedThresholds[family].safe *= multiplier
    adjustedThresholds[family].warning *= multiplier
    adjustedThresholds[family].limit *= multiplier
  }
  
  return adjustedThresholds
}

// =============================================================================
// WARMUP INTEGRATION
// =============================================================================

/**
 * Get additional warmup needs based on stress analysis
 */
export function getStressBasedWarmupNeeds(
  analysis: SessionStressAnalysis
): {
  additionalJointPrep: JointStressFocus[]
  additionalTendonPrep: string[]
  warmupIntensityLevel: 'minimal' | 'moderate' | 'thorough'
} {
  const additionalJointPrep: JointStressFocus[] = []
  const additionalTendonPrep: string[] = []
  
  // Add joint prep based on stress profile
  for (const [joint, stress] of Object.entries(analysis.jointStressProfile)) {
    if (stress >= 60) {
      additionalJointPrep.push(joint as JointStressFocus)
    }
  }
  
  // Add tendon prep based on families
  if ((analysis.stressByFamily['straight_arm_push'] || 0) > 30) {
    additionalTendonPrep.push('shoulder_external_rotation_prep')
    additionalTendonPrep.push('wrist_prep')
  }
  if ((analysis.stressByFamily['straight_arm_pull'] || 0) > 30) {
    additionalTendonPrep.push('scapular_pulls')
    additionalTendonPrep.push('lat_activation')
  }
  if ((analysis.stressByFamily['ring_strength'] || 0) > 20) {
    additionalTendonPrep.push('ring_support_prep')
    additionalTendonPrep.push('shoulder_tendon_warmup')
  }
  
  // Determine warmup intensity
  let warmupIntensityLevel: 'minimal' | 'moderate' | 'thorough' = 'minimal'
  if (analysis.tendonRiskLevel === 'very_high' || analysis.tendonRiskLevel === 'extreme') {
    warmupIntensityLevel = 'thorough'
  } else if (analysis.tendonRiskLevel === 'high' || analysis.fatigueRiskLevel === 'elevated') {
    warmupIntensityLevel = 'moderate'
  }
  
  return {
    additionalJointPrep,
    additionalTendonPrep,
    warmupIntensityLevel,
  }
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

/**
 * Generate concise coach-style explanation for a governor action
 */
export function generateGovernorCoachingMessage(
  recommendation: GovernorRecommendation
): string {
  const messages: Record<GovernorRecommendationType, (r: GovernorRecommendation) => string> = {
    reduce_sets: (r) => r.targetFamily 
      ? `${formatFamilyName(r.targetFamily)} volume was reduced to preserve skill quality.`
      : 'Overall volume was reduced to support recovery.',
    lower_progression: (r) => r.targetFamily
      ? `A more accessible progression was selected for ${formatFamilyName(r.targetFamily)} work.`
      : 'Progression difficulty was adjusted for sustainable training.',
    swap_to_support_work: (r) => `${formatFamilyName(r.targetFamily || 'skill')} work was replaced with supporting exercises to manage stress.`,
    reduce_density: (r) => `Rest periods were extended for ${formatFamilyName(r.targetFamily || 'high-demand')} work to protect technique.`,
    add_rest_day: () => 'An additional rest day was recommended based on accumulated stress.',
    increase_warmup: (r) => `Enhanced warmup was added for ${formatFamilyName(r.targetFamily || 'demanding')} movements.`,
    avoid_advanced_node: (r) => `Advanced ${formatFamilyName(r.targetFamily || 'skill')} work was postponed to match current readiness.`,
    change_session_structure: (r) => `Session structure was adjusted to safely accommodate ${formatFamilyName(r.targetFamily || 'high-stress')} work.`,
    preserve_as_is: () => 'Session is well-structured for current recovery status.',
  }
  
  return messages[recommendation.recommendationType](recommendation)
}

function formatFamilyName(family: SkillStressFocus | string): string {
  const nameMap: Record<string, string> = {
    straight_arm_pull: 'straight-arm pulling',
    straight_arm_push: 'straight-arm pushing',
    ring_support: 'ring stability',
    ring_strength: 'ring strength',
    explosive_pull: 'explosive pulling',
    compression_core: 'compression',
    vertical_pull: 'pulling',
    vertical_push: 'pressing',
    dip_pattern: 'dip',
    transition: 'transition',
  }
  return nameMap[family] || family.replace(/_/g, ' ')
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  BASE_STRESS_BY_FAMILY,
  WEEKLY_STRESS_THRESHOLDS,
  HIGH_RISK_SKILL_NODES,
  UNSAFE_STRUCTURE_COMBINATIONS,
}

export const SkillVolumeGovernor = {
  analyzeSessionStress,
  calculateExerciseStress,
  calculateWeeklyStress,
  wouldExceedWeeklyLimits,
  applyGovernorRecommendations,
  getFrameworkAdjustedThresholds,
  getStressBasedWarmupNeeds,
  generateGovernorCoachingMessage,
}
