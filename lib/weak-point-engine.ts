/**
 * Unified Weak Point Engine
 * 
 * THE SINGLE SOURCE OF TRUTH for limiter detection in SpartanLab.
 * 
 * This engine analyzes athlete data from multiple sources to identify
 * the primary limiting factor preventing skill progress.
 * 
 * Data Sources:
 * - SkillState (skill progress and readiness)
 * - Canonical Readiness Engine (readiness calculations)
 * - Benchmarks (strength tests)
 * - Performance Envelope (training response patterns)
 * - Workout Logs (actual training data)
 * - Constraint Detection (constraint analysis)
 * - Athlete Profile (experience, equipment, injuries)
 * 
 * Output:
 * - Primary limiter with severity score
 * - Secondary limiter if present
 * - Recommended training emphasis
 * - Affected skills
 * - Priority exercises
 */

import type { LimitingFactor } from './readiness/canonical-readiness-engine'
import type { OnboardingProfile } from './athlete-profile'
import type { AthleteCalibration } from './athlete-calibration'
import type { SkillState } from './skill-state-service'
import type { PerformanceEnvelope } from './performance-envelope-engine'
import {
  generateAthleteReadinessSummary,
  extractWeakPointsFromReadiness,
  type SkillReadinessScore,
  type AthleteReadinessSummary,
  type WeakPointFromReadiness,
} from './unified-readiness-integration'

// =============================================================================
// WEAK POINT TYPES
// =============================================================================

export type WeakPointType =
  // Strength-based
  | 'pull_strength'
  | 'push_strength'
  | 'straight_arm_pull_strength'
  | 'straight_arm_push_strength'
  | 'compression_strength'
  | 'explosive_power'
  | 'transition_strength'
  | 'vertical_push_strength'
  | 'dip_strength'
  // Control-based
  | 'scapular_control'
  | 'shoulder_stability'
  | 'core_control'
  | 'balance_control'
  | 'ring_support_stability'
  // Tolerance-based
  | 'wrist_tolerance'
  | 'tendon_tolerance'
  | 'mobility'
  | 'shoulder_extension_mobility'
  // Recovery-based
  | 'recovery_capacity'
  | 'work_capacity'
  // Equipment-based
  | 'equipment_limitation'
  // None
  | 'none'

export const WEAK_POINT_LABELS: Record<WeakPointType, string> = {
  pull_strength: 'Pulling Strength',
  push_strength: 'Pushing Strength',
  straight_arm_pull_strength: 'Straight-Arm Pull Strength',
  straight_arm_push_strength: 'Straight-Arm Push Strength',
  compression_strength: 'Compression Strength',
  explosive_power: 'Explosive Pull Power',
  transition_strength: 'Transition Strength',
  vertical_push_strength: 'Vertical Push Strength',
  dip_strength: 'Dip Strength',
  scapular_control: 'Scapular Control',
  shoulder_stability: 'Shoulder Stability',
  core_control: 'Core Control',
  balance_control: 'Balance Control',
  ring_support_stability: 'Ring Support Stability',
  wrist_tolerance: 'Wrist Tolerance',
  tendon_tolerance: 'Tendon Tolerance',
  mobility: 'General Mobility',
  shoulder_extension_mobility: 'Shoulder Extension Mobility',
  recovery_capacity: 'Recovery Capacity',
  work_capacity: 'Work Capacity',
  equipment_limitation: 'Equipment Limitation',
  none: 'No Limiting Factor',
}

// =============================================================================
// SKILL PREREQUISITE MAPS
// =============================================================================

export type SkillTarget = 
  | 'front_lever'
  | 'back_lever'
  | 'planche'
  | 'muscle_up'
  | 'ring_muscle_up'
  | 'hspu'
  | 'l_sit'
  | 'v_sit'
  | 'iron_cross'
  | 'one_arm_pull_up'
  | 'handstand'

interface SkillPrerequisite {
  factor: WeakPointType
  weight: number // 0-1, how much this affects the skill
  minimumBenchmark?: {
    metric: string
    value: number
    unit: string
  }
  description: string
}

/**
 * Skill prerequisite maps defining what each skill requires
 * These are the foundation for weak point detection
 */
export const SKILL_PREREQUISITES: Record<SkillTarget, SkillPrerequisite[]> = {
  front_lever: [
    {
      factor: 'straight_arm_pull_strength',
      weight: 0.30,
      minimumBenchmark: { metric: 'weighted_pull_up', value: 20, unit: 'kg' },
      description: 'Straight-arm pulling strength for horizontal body hold',
    },
    {
      factor: 'pull_strength',
      weight: 0.25,
      minimumBenchmark: { metric: 'pull_ups', value: 15, unit: 'reps' },
      description: 'Foundational pulling strength base',
    },
    {
      factor: 'compression_strength',
      weight: 0.25,
      minimumBenchmark: { metric: 'hollow_hold', value: 45, unit: 'seconds' },
      description: 'Core compression for maintaining body tension',
    },
    {
      factor: 'scapular_control',
      weight: 0.15,
      description: 'Scapular depression and retraction control',
    },
    {
      factor: 'core_control',
      weight: 0.05,
      description: 'General core stability and control',
    },
  ],
  
  back_lever: [
    {
      factor: 'straight_arm_pull_strength',
      weight: 0.30,
      minimumBenchmark: { metric: 'weighted_pull_up', value: 15, unit: 'kg' },
      description: 'Straight-arm strength for supinated hold',
    },
    {
      factor: 'shoulder_extension_mobility',
      weight: 0.25,
      description: 'Shoulder extension range for the lever position',
    },
    {
      factor: 'scapular_control',
      weight: 0.25,
      description: 'Scapular retraction in extended position',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.15,
      description: 'Shoulder joint stability under load',
    },
    {
      factor: 'core_control',
      weight: 0.05,
      description: 'Core tension maintenance',
    },
  ],
  
  planche: [
    {
      factor: 'straight_arm_push_strength',
      weight: 0.30,
      minimumBenchmark: { metric: 'weighted_dip', value: 30, unit: 'kg' },
      description: 'Straight-arm pushing strength for lean',
    },
    {
      factor: 'push_strength',
      weight: 0.20,
      minimumBenchmark: { metric: 'dips', value: 20, unit: 'reps' },
      description: 'Foundational pushing strength',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.20,
      description: 'Shoulder protraction and stability under load',
    },
    {
      factor: 'wrist_tolerance',
      weight: 0.15,
      description: 'Wrist strength and conditioning for lean',
    },
    {
      factor: 'compression_strength',
      weight: 0.10,
      description: 'Posterior pelvic tilt and compression',
    },
    {
      factor: 'core_control',
      weight: 0.05,
      description: 'Core tension for body line',
    },
  ],
  
  muscle_up: [
    {
      factor: 'explosive_power',
      weight: 0.30,
      minimumBenchmark: { metric: 'chest_to_bar_pull_ups', value: 5, unit: 'reps' },
      description: 'Explosive pulling power for the pull phase',
    },
    {
      factor: 'transition_strength',
      weight: 0.25,
      description: 'Specific strength for the transition phase',
    },
    {
      factor: 'pull_strength',
      weight: 0.20,
      minimumBenchmark: { metric: 'pull_ups', value: 12, unit: 'reps' },
      description: 'Base pulling strength',
    },
    {
      factor: 'dip_strength',
      weight: 0.15,
      minimumBenchmark: { metric: 'dips', value: 15, unit: 'reps' },
      description: 'Dip strength for the push phase',
    },
    {
      factor: 'scapular_control',
      weight: 0.10,
      description: 'Scapular mobility through transition',
    },
  ],
  
  ring_muscle_up: [
    {
      factor: 'explosive_power',
      weight: 0.25,
      description: 'Explosive pulling on unstable rings',
    },
    {
      factor: 'transition_strength',
      weight: 0.25,
      description: 'Ring-specific transition strength',
    },
    {
      factor: 'ring_support_stability',
      weight: 0.20,
      description: 'Ring support and stability',
    },
    {
      factor: 'pull_strength',
      weight: 0.15,
      minimumBenchmark: { metric: 'pull_ups', value: 15, unit: 'reps' },
      description: 'Enhanced pulling strength for rings',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.15,
      description: 'Shoulder stability on rings',
    },
  ],
  
  hspu: [
    {
      factor: 'vertical_push_strength',
      weight: 0.35,
      minimumBenchmark: { metric: 'pike_push_ups', value: 10, unit: 'reps' },
      description: 'Overhead pressing strength',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.25,
      description: 'Shoulder stability in overhead position',
    },
    {
      factor: 'balance_control',
      weight: 0.20,
      description: 'Balance control against wall or freestanding',
    },
    {
      factor: 'core_control',
      weight: 0.10,
      description: 'Core stability during movement',
    },
    {
      factor: 'wrist_tolerance',
      weight: 0.10,
      description: 'Wrist conditioning for support',
    },
  ],
  
  l_sit: [
    {
      factor: 'compression_strength',
      weight: 0.40,
      minimumBenchmark: { metric: 'hanging_leg_raise', value: 10, unit: 'reps' },
      description: 'Hip flexor and compression strength',
    },
    {
      factor: 'core_control',
      weight: 0.30,
      description: 'Core control for leg elevation',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.15,
      description: 'Shoulder depression for support',
    },
    {
      factor: 'mobility',
      weight: 0.10,
      description: 'Hamstring and hip mobility',
    },
    {
      factor: 'wrist_tolerance',
      weight: 0.05,
      description: 'Wrist support tolerance',
    },
  ],
  
  v_sit: [
    {
      factor: 'compression_strength',
      weight: 0.45,
      description: 'Advanced hip flexor compression',
    },
    {
      factor: 'core_control',
      weight: 0.25,
      description: 'Extreme core control requirement',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.15,
      description: 'Shoulder depression with elevated legs',
    },
    {
      factor: 'mobility',
      weight: 0.15,
      description: 'Pike flexibility requirement',
    },
  ],
  
  iron_cross: [
    {
      factor: 'ring_support_stability',
      weight: 0.30,
      description: 'Extreme ring support strength',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.25,
      description: 'Shoulder stability at extreme angles',
    },
    {
      factor: 'tendon_tolerance',
      weight: 0.25,
      description: 'Bicep and shoulder tendon conditioning',
    },
    {
      factor: 'straight_arm_pull_strength',
      weight: 0.20,
      description: 'Straight-arm adduction strength',
    },
  ],
  
  one_arm_pull_up: [
    {
      factor: 'pull_strength',
      weight: 0.40,
      minimumBenchmark: { metric: 'weighted_pull_up', value: 50, unit: '%BW' },
      description: 'Extreme pulling strength requirement',
    },
    {
      factor: 'scapular_control',
      weight: 0.25,
      description: 'Unilateral scapular control',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.20,
      description: 'Single-arm shoulder stability',
    },
    {
      factor: 'core_control',
      weight: 0.15,
      description: 'Anti-rotation core control',
    },
  ],
  
  handstand: [
    {
      factor: 'balance_control',
      weight: 0.35,
      description: 'Primary balance and proprioception',
    },
    {
      factor: 'shoulder_stability',
      weight: 0.25,
      description: 'Overhead shoulder stability',
    },
    {
      factor: 'wrist_tolerance',
      weight: 0.20,
      description: 'Wrist strength and mobility for balance',
    },
    {
      factor: 'core_control',
      weight: 0.20,
      description: 'Core line control',
    },
  ],
}

// =============================================================================
// WEAK POINT ASSESSMENT RESULT
// =============================================================================

export interface WeakPointAssessment {
  // Identity
  athleteId: string
  skillTarget: SkillTarget
  evaluatedAt: string
  
  // Primary limiter
  primaryLimiter: {
    type: WeakPointType
    label: string
    severityScore: number // 0-100, higher = more limiting
    confidenceScore: number // 0-1, how confident we are
    explanation: string
    dataSource: 'benchmark' | 'readiness' | 'envelope' | 'inference' | 'combined'
  }
  
  // Secondary limiter (if present)
  secondaryLimiter: {
    type: WeakPointType
    label: string
    severityScore: number
    explanation: string
  } | null
  
  // Strong areas (not limiting)
  strongAreas: WeakPointType[]
  
  // Recommendations
  trainingEmphasis: {
    primary: string
    secondary: string | null
    volumeAdjustment: 'increase' | 'maintain' | 'decrease'
    frequencyRecommendation: string
  }
  
  // Priority exercises to address limiter
  priorityExercises: Array<{
    exerciseId: string
    exerciseName: string
    reason: string
    targetedLimiter: WeakPointType
  }>
  
  // Affected skills (other skills impacted by this weak point)
  affectedSkills: SkillTarget[]
  
  // Feedback message
  coachingMessage: string
}

// =============================================================================
// BENCHMARK-TO-SCORE CONVERSION
// =============================================================================

interface BenchmarkScores {
  pullStrength: number
  pushStrength: number
  straightArmPull: number
  straightArmPush: number
  compression: number
  explosivePower: number
  scapularControl: number
  shoulderStability: number
  wristTolerance: number
  coreControl: number
  balanceControl: number
  mobility: number
}

function calculateBenchmarkScores(profile: OnboardingProfile, calibration: AthleteCalibration | null): BenchmarkScores {
  // Pull strength (0-100)
  let pullStrength = 50
  if (profile.pullUpMax !== null) {
    if (profile.pullUpMax === 0) pullStrength = 10
    else if (profile.pullUpMax <= 3) pullStrength = 25
    else if (profile.pullUpMax <= 8) pullStrength = 45
    else if (profile.pullUpMax <= 12) pullStrength = 60
    else if (profile.pullUpMax <= 18) pullStrength = 75
    else if (profile.pullUpMax <= 25) pullStrength = 85
    else pullStrength = 95
  }
  
  // Weighted pull-up bonus
  if (profile.weightedPullUp?.load) {
    const bwPercent = profile.bodyweight ? (profile.weightedPullUp.load / profile.bodyweight) * 100 : 0
    if (bwPercent >= 50) pullStrength = Math.max(pullStrength, 90)
    else if (bwPercent >= 30) pullStrength = Math.max(pullStrength, 75)
    else if (bwPercent >= 15) pullStrength = Math.max(pullStrength, 60)
  }
  
  // Push strength (0-100)
  let pushStrength = 50
  if (profile.dipMax !== null) {
    if (profile.dipMax === 0) pushStrength = 15
    else if (profile.dipMax <= 5) pushStrength = 30
    else if (profile.dipMax <= 12) pushStrength = 50
    else if (profile.dipMax <= 20) pushStrength = 70
    else if (profile.dipMax <= 30) pushStrength = 85
    else pushStrength = 95
  }
  
  // Push-up bonus
  if (profile.pushUpMax !== null) {
    if (profile.pushUpMax >= 50) pushStrength = Math.max(pushStrength, 70)
    else if (profile.pushUpMax >= 30) pushStrength = Math.max(pushStrength, 55)
  }
  
  // Weighted dip bonus
  if (profile.weightedDip?.load) {
    const load = profile.weightedDip.load
    if (load >= 45) pushStrength = Math.max(pushStrength, 90)
    else if (load >= 25) pushStrength = Math.max(pushStrength, 75)
    else if (load >= 10) pushStrength = Math.max(pushStrength, 60)
  }
  
  // Straight-arm pulling (estimated from weighted pull + skill levels)
  let straightArmPull = pullStrength * 0.7 // Base estimate
  if (profile.frontLeverHold && profile.frontLeverHold !== 'none') {
    const levelBonus: Record<string, number> = {
      'tuck': 50,
      'adv_tuck': 65,
      'one_leg': 75,
      'straddle': 85,
      'full': 95,
    }
    straightArmPull = Math.max(straightArmPull, levelBonus[profile.frontLeverHold] || 50)
  }
  
  // Straight-arm pushing (estimated from weighted dip + planche level)
  let straightArmPush = pushStrength * 0.7
  if (profile.plancheHold && profile.plancheHold !== 'none') {
    const levelBonus: Record<string, number> = {
      'lean': 40,
      'tuck': 55,
      'adv_tuck': 70,
      'straddle': 85,
      'full': 95,
    }
    straightArmPush = Math.max(straightArmPush, levelBonus[profile.plancheHold] || 40)
  }
  
  // Compression (from L-sit and core work)
  let compression = 50
  if (profile.lSitHold && profile.lSitHold !== 'unknown') {
    const lsitScores: Record<string, number> = {
      'none': 15,
      'tuck': 40,
      'one_leg': 60,
      'full': 80,
    }
    compression = lsitScores[profile.lSitHold] || 50
  }
  
  // Calibration bonus for compression
  if (calibration?.hollowBodySeconds) {
    if (calibration.hollowBodySeconds >= 60) compression = Math.max(compression, 75)
    else if (calibration.hollowBodySeconds >= 30) compression = Math.max(compression, 55)
  }
  
  // Explosive power (estimated from pull-ups + muscle-up capability)
  let explosivePower = pullStrength * 0.6
  if (profile.muscleUpCapable) explosivePower = Math.max(explosivePower, 80)
  
  // Scapular control (inferred from skill levels)
  let scapularControl = Math.min(pullStrength, compression) * 0.8
  
  // Shoulder stability (inferred from skill levels and absence of issues)
  let shoulderStability = 60
  if (profile.jointCautions?.includes('shoulder')) shoulderStability = 40
  else if (pushStrength >= 70 && profile.plancheHold) shoulderStability = 75
  
  // Wrist tolerance
  let wristTolerance = 60
  if (profile.jointCautions?.includes('wrist')) wristTolerance = 35
  else if (profile.handstandHold && profile.handstandHold !== 'none') wristTolerance = 75
  
  // Core control (from compression + calibration)
  let coreControl = compression * 0.9
  
  // Balance control (from handstand)
  let balanceControl = 50
  if (profile.handstandHold && profile.handstandHold !== 'none') {
    const hsScores: Record<string, number> = {
      'wall_assisted': 45,
      'wall': 55,
      'free_5s': 70,
      'free_15s': 80,
      'free_30s': 90,
    }
    balanceControl = hsScores[profile.handstandHold] || 50
  }
  
  // Mobility (general estimate)
  let mobility = 55
  if (profile.flexibilityEmphasis === 'high') mobility = 70
  else if (profile.flexibilityEmphasis === 'low') mobility = 40
  
  return {
    pullStrength,
    pushStrength,
    straightArmPull,
    straightArmPush,
    compression,
    explosivePower,
    scapularControl,
    shoulderStability,
    wristTolerance,
    coreControl,
    balanceControl,
    mobility,
  }
}

// =============================================================================
// WEAK POINT DETECTION
// =============================================================================

function mapScoreToWeakPoint(factor: WeakPointType, scores: BenchmarkScores): number {
  const mapping: Partial<Record<WeakPointType, keyof BenchmarkScores>> = {
    pull_strength: 'pullStrength',
    push_strength: 'pushStrength',
    straight_arm_pull_strength: 'straightArmPull',
    straight_arm_push_strength: 'straightArmPush',
    compression_strength: 'compression',
    explosive_power: 'explosivePower',
    scapular_control: 'scapularControl',
    shoulder_stability: 'shoulderStability',
    wrist_tolerance: 'wristTolerance',
    core_control: 'coreControl',
    balance_control: 'balanceControl',
    mobility: 'mobility',
  }
  
  const scoreKey = mapping[factor]
  if (scoreKey) {
    return scores[scoreKey]
  }
  
  // Fallback estimates
  if (factor === 'transition_strength') return scores.explosivePower * 0.8
  if (factor === 'vertical_push_strength') return scores.pushStrength * 0.85
  if (factor === 'dip_strength') return scores.pushStrength
  if (factor === 'ring_support_stability') return scores.shoulderStability * 0.7
  if (factor === 'tendon_tolerance') return Math.min(scores.shoulderStability, 60)
  if (factor === 'shoulder_extension_mobility') return scores.mobility * 0.9
  
  return 50 // Default
}

/**
 * Detect weak points for a specific skill target
 */
export function detectWeakPoints(
  skillTarget: SkillTarget,
  profile: OnboardingProfile,
  calibration: AthleteCalibration | null,
  skillState?: SkillState | null,
  envelope?: PerformanceEnvelope | null
): WeakPointAssessment {
  const prerequisites = SKILL_PREREQUISITES[skillTarget]
  const scores = calculateBenchmarkScores(profile, calibration)
  
  // Calculate weighted scores for each prerequisite
  const prerequisiteScores = prerequisites.map(prereq => {
    const score = mapScoreToWeakPoint(prereq.factor, scores)
    // Severity is how much this limits (100 - score means lower score = more limiting)
    const severity = 100 - score
    return {
      factor: prereq.factor,
      weight: prereq.weight,
      score,
      severity,
      weightedSeverity: severity * prereq.weight,
      description: prereq.description,
    }
  })
  
  // Sort by weighted severity (most limiting first)
  const sorted = [...prerequisiteScores].sort((a, b) => b.weightedSeverity - a.weightedSeverity)
  
  // Primary limiter is the one with highest weighted severity
  const primaryPrereq = sorted[0]
  const primarySeverity = primaryPrereq.severity
  
  // Secondary limiter only if it's also significant (severity > 30)
  const secondaryPrereq = sorted[1]?.severity > 30 ? sorted[1] : null
  
  // Strong areas (score >= 70)
  const strongAreas = prerequisiteScores
    .filter(p => p.score >= 70)
    .map(p => p.factor)
  
  // Calculate confidence based on data availability
  let confidenceScore = 0.5
  if (profile.pullUpMax !== null) confidenceScore += 0.1
  if (profile.dipMax !== null) confidenceScore += 0.1
  if (profile.weightedPullUp?.load) confidenceScore += 0.1
  if (calibration) confidenceScore += 0.1
  if (skillState) confidenceScore += 0.1
  confidenceScore = Math.min(confidenceScore, 1.0)
  
  // Generate priority exercises
  const priorityExercises = getPriorityExercises(primaryPrereq.factor, secondaryPrereq?.factor)
  
  // Get affected skills
  const affectedSkills = getAffectedSkills(primaryPrereq.factor)
  
  // Generate coaching message
  const coachingMessage = generateCoachingMessage(skillTarget, primaryPrereq, secondaryPrereq)
  
  return {
    athleteId: profile.userId || 'unknown',
    skillTarget,
    evaluatedAt: new Date().toISOString(),
    
    primaryLimiter: {
      type: primaryPrereq.factor,
      label: WEAK_POINT_LABELS[primaryPrereq.factor],
      severityScore: Math.round(primarySeverity),
      confidenceScore,
      explanation: primaryPrereq.description,
      dataSource: calibration ? 'combined' : 'inference',
    },
    
    secondaryLimiter: secondaryPrereq ? {
      type: secondaryPrereq.factor,
      label: WEAK_POINT_LABELS[secondaryPrereq.factor],
      severityScore: Math.round(secondaryPrereq.severity),
      explanation: secondaryPrereq.description,
    } : null,
    
    strongAreas,
    
    trainingEmphasis: {
      primary: generateEmphasisLabel(primaryPrereq.factor),
      secondary: secondaryPrereq ? generateEmphasisLabel(secondaryPrereq.factor) : null,
      volumeAdjustment: primarySeverity > 60 ? 'increase' : 'maintain',
      frequencyRecommendation: primarySeverity > 50 
        ? `Prioritize ${WEAK_POINT_LABELS[primaryPrereq.factor].toLowerCase()} work 2-3x per week`
        : 'Maintain balanced training frequency',
    },
    
    priorityExercises,
    affectedSkills,
    coachingMessage,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateEmphasisLabel(factor: WeakPointType): string {
  const emphasisMap: Record<WeakPointType, string> = {
    pull_strength: 'Weighted pull-up progressions',
    push_strength: 'Weighted dip and push-up work',
    straight_arm_pull_strength: 'Front lever and straight-arm pulling',
    straight_arm_push_strength: 'Planche lean and straight-arm pushing',
    compression_strength: 'L-sit and compression drills',
    explosive_power: 'High pulls and explosive pulling',
    transition_strength: 'Muscle-up transition drills',
    vertical_push_strength: 'Pike push-ups and overhead pressing',
    dip_strength: 'Dip progressions and weighted dips',
    scapular_control: 'Scapular pulls and holds',
    shoulder_stability: 'Shoulder stability protocols',
    core_control: 'Hollow body and plank progressions',
    balance_control: 'Handstand practice and balance drills',
    ring_support_stability: 'Ring support holds and dips',
    wrist_tolerance: 'Wrist conditioning and mobility',
    tendon_tolerance: 'Gradual tendon loading protocols',
    mobility: 'Mobility and flexibility work',
    shoulder_extension_mobility: 'Shoulder extension stretches',
    recovery_capacity: 'Recovery optimization',
    work_capacity: 'Volume building',
    equipment_limitation: 'Equipment alternatives',
    none: 'Balanced progression',
  }
  return emphasisMap[factor] || 'Focused training'
}

function getPriorityExercises(
  primary: WeakPointType,
  secondary?: WeakPointType | null
): WeakPointAssessment['priorityExercises'] {
  const exerciseMap: Partial<Record<WeakPointType, Array<{ id: string; name: string; reason: string }>>> = {
    pull_strength: [
      { id: 'weighted_pull_up', name: 'Weighted Pull-Up', reason: 'Builds foundational pulling strength' },
      { id: 'chin_up', name: 'Chin-Up', reason: 'Bicep emphasis for pulling' },
      { id: 'archer_pull_up', name: 'Archer Pull-Up', reason: 'Unilateral pulling strength' },
    ],
    straight_arm_pull_strength: [
      { id: 'front_lever_raise', name: 'Front Lever Raise', reason: 'Direct straight-arm pulling' },
      { id: 'ice_cream_makers', name: 'Ice Cream Makers', reason: 'Dynamic straight-arm work' },
      { id: 'tuck_front_lever_hold', name: 'Tuck Front Lever Hold', reason: 'Isometric straight-arm loading' },
    ],
    compression_strength: [
      { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', reason: 'Hip flexor and compression strength' },
      { id: 'l_sit_hold', name: 'L-Sit Hold', reason: 'Compression endurance' },
      { id: 'v_up', name: 'V-Up', reason: 'Dynamic compression' },
    ],
    explosive_power: [
      { id: 'chest_to_bar_pull_up', name: 'Chest-to-Bar Pull-Up', reason: 'High pull power' },
      { id: 'kipping_pull_up', name: 'Kipping Pull-Up', reason: 'Explosive hip drive' },
      { id: 'muscle_up_negative', name: 'Muscle-Up Negative', reason: 'Transition control' },
    ],
    scapular_control: [
      { id: 'scapular_pull_up', name: 'Scapular Pull-Up', reason: 'Scapular activation' },
      { id: 'front_lever_scap_pull', name: 'FL Scapular Pull', reason: 'Retraction under load' },
      { id: 'inverted_hang_shrug', name: 'Inverted Hang Shrug', reason: 'Depression strength' },
    ],
    shoulder_stability: [
      { id: 'ring_support_hold', name: 'Ring Support Hold', reason: 'Ring stability base' },
      { id: 'planche_lean', name: 'Planche Lean', reason: 'Anterior shoulder loading' },
      { id: 'face_pull', name: 'Face Pull', reason: 'Rear delt and rotator cuff' },
    ],
  }
  
  const primaryExercises = exerciseMap[primary] || []
  const secondaryExercises = secondary ? (exerciseMap[secondary] || []).slice(0, 1) : []
  
  return [
    ...primaryExercises.map(e => ({ ...e, targetedLimiter: primary })),
    ...secondaryExercises.map(e => ({ ...e, targetedLimiter: secondary! })),
  ]
}

function getAffectedSkills(limiter: WeakPointType): SkillTarget[] {
  const skillsAffected: Partial<Record<WeakPointType, SkillTarget[]>> = {
    pull_strength: ['front_lever', 'back_lever', 'muscle_up', 'one_arm_pull_up'],
    straight_arm_pull_strength: ['front_lever', 'back_lever', 'iron_cross'],
    straight_arm_push_strength: ['planche'],
    compression_strength: ['l_sit', 'v_sit', 'front_lever'],
    explosive_power: ['muscle_up', 'ring_muscle_up'],
    shoulder_stability: ['planche', 'hspu', 'iron_cross', 'handstand'],
    balance_control: ['handstand', 'hspu'],
    wrist_tolerance: ['planche', 'handstand', 'l_sit'],
  }
  
  return skillsAffected[limiter] || []
}

function generateCoachingMessage(
  skill: SkillTarget,
  primary: { factor: WeakPointType; severity: number },
  secondary: { factor: WeakPointType; severity: number } | null
): string {
  const skillLabel = skill.replace(/_/g, ' ')
  const primaryLabel = WEAK_POINT_LABELS[primary.factor].toLowerCase()
  
  if (primary.severity < 30) {
    return `Strong foundation for ${skillLabel}. Continue balanced progression.`
  }
  
  if (primary.severity < 50) {
    return `Your ${skillLabel} progress is limited by ${primaryLabel}. Consistent focused work will unlock progress.`
  }
  
  if (secondary) {
    const secondaryLabel = WEAK_POINT_LABELS[secondary.factor].toLowerCase()
    return `Your ${skillLabel} limiter is ${primaryLabel}, with ${secondaryLabel} as a secondary focus. Prioritize these areas.`
  }
  
  return `Your current ${skillLabel} limiter is ${primaryLabel}. Focused training on this area will accelerate your progress.`
}

// =============================================================================
// EXPORT: Limiter-to-LimitingFactor conversion
// =============================================================================

/**
 * Convert WeakPointType to canonical LimitingFactor for readiness integration
 */
export function weakPointToLimitingFactor(weakPoint: WeakPointType): LimitingFactor {
  const mapping: Partial<Record<WeakPointType, LimitingFactor>> = {
    pull_strength: 'pull_strength',
    push_strength: 'push_strength',
    straight_arm_pull_strength: 'straight_arm_pull_strength',
    straight_arm_push_strength: 'straight_arm_push_strength',
    compression_strength: 'compression_strength',
    explosive_power: 'explosive_pull_power',
    transition_strength: 'transition_strength',
    vertical_push_strength: 'vertical_push_strength',
    scapular_control: 'scapular_control',
    shoulder_stability: 'shoulder_stability',
    wrist_tolerance: 'wrist_tolerance',
    core_control: 'core_control',
    balance_control: 'balance_control',
    tendon_tolerance: 'tendon_tolerance',
    mobility: 'mobility',
    shoulder_extension_mobility: 'shoulder_extension_mobility',
    ring_support_stability: 'ring_support_stability',
    none: 'none',
  }
  
  return mapping[weakPoint] || 'none'
}

// =============================================================================
// PLATEAU DETECTION
// =============================================================================

export interface PlateauResult {
  isPlateaued: boolean
  plateauArea: WeakPointType | null
  weeksSinceProgress: number
  recommendation: string
}

/**
 * Detect if athlete is plateaued based on benchmark history
 * (Simplified - full implementation would use historical data)
 */
export function detectPlateau(
  currentAssessment: WeakPointAssessment,
  previousAssessments: WeakPointAssessment[]
): PlateauResult {
  if (previousAssessments.length < 2) {
    return {
      isPlateaued: false,
      plateauArea: null,
      weeksSinceProgress: 0,
      recommendation: 'Continue training and track progress.',
    }
  }
  
  // Check if primary limiter has remained the same with similar severity
  const recentAssessments = previousAssessments.slice(-4) // Last 4 assessments
  const sameLimiter = recentAssessments.every(
    a => a.primaryLimiter.type === currentAssessment.primaryLimiter.type
  )
  
  const severityVariance = recentAssessments.reduce((sum, a) => {
    return sum + Math.abs(a.primaryLimiter.severityScore - currentAssessment.primaryLimiter.severityScore)
  }, 0) / recentAssessments.length
  
  const isPlateaued = sameLimiter && severityVariance < 10
  
  if (isPlateaued) {
    return {
      isPlateaued: true,
      plateauArea: currentAssessment.primaryLimiter.type,
      weeksSinceProgress: recentAssessments.length * 2, // Estimate
      recommendation: `Your ${WEAK_POINT_LABELS[currentAssessment.primaryLimiter.type].toLowerCase()} has plateaued. Consider varying your training approach or increasing volume.`,
    }
  }
  
  return {
    isPlateaued: false,
    plateauArea: null,
    weeksSinceProgress: 0,
    recommendation: 'Progress is on track.',
  }
}

// =============================================================================
// READINESS-INTEGRATED WEAK POINT DETECTION
// =============================================================================

/**
 * Enhanced weak point detection that integrates canonical readiness calculations.
 * This function combines benchmark-based detection with readiness engine signals
 * for more accurate limiter identification.
 */
export function detectWeakPointsWithReadiness(
  skillTarget: SkillTarget,
  profile: OnboardingProfile,
  calibration: AthleteCalibration | null,
  primaryGoal?: string
): WeakPointAssessment & { readinessIntegration: ReadinessIntegration } {
  // Get base weak point assessment
  const baseAssessment = detectWeakPoints(skillTarget, profile, calibration)
  
  // Generate readiness summary for the athlete
  let readinessSummary: AthleteReadinessSummary | null = null
  let readinessWeakPoints: WeakPointFromReadiness[] = []
  
  try {
    // Convert OnboardingProfile to AthleteProfile format for readiness calculation
    const athleteProfile = {
      userId: profile.userId || 'unknown',
      experienceLevel: profile.experienceLevel || 'intermediate',
      maxPullUps: profile.pullUpMax || 0,
      maxDips: profile.dipMax || 0,
      weightedPullUp: profile.weightedPullUp?.load || 0,
      weightedDip: profile.weightedDip?.load || 0,
      hollowHold: profile.hollowHold || 0,
      lSitHold: profile.lSitHold || 0,
      bodyweight: profile.bodyweight || 75,
      primaryGoal: primaryGoal || skillTarget,
    }
    
    readinessSummary = generateAthleteReadinessSummary(
      athleteProfile.userId,
      athleteProfile as any,
      primaryGoal || skillTarget,
      calibration
    )
    
    readinessWeakPoints = extractWeakPointsFromReadiness(readinessSummary)
  } catch {
    // Continue with base assessment if readiness calculation fails
  }
  
  // Merge insights from readiness analysis
  const readinessIntegration: ReadinessIntegration = {
    readinessScore: readinessSummary?.primaryReadiness?.readinessScore || null,
    readinessLevel: readinessSummary?.primaryReadiness?.readinessLevel || null,
    readinessLimiter: readinessSummary?.globalPrimaryLimiter || null,
    readinessWeakPoints,
    limiterAgreement: checkLimiterAgreement(
      baseAssessment.primaryLimiter.type,
      readinessSummary?.globalPrimaryLimiter
    ),
    combinedConfidence: calculateCombinedConfidence(
      baseAssessment.primaryLimiter.confidenceScore,
      readinessSummary?.dataQuality
    ),
  }
  
  // If readiness and benchmark detection agree, increase confidence
  if (readinessIntegration.limiterAgreement === 'full') {
    baseAssessment.primaryLimiter.confidenceScore = Math.min(
      1.0,
      baseAssessment.primaryLimiter.confidenceScore + 0.15
    )
  }
  
  return {
    ...baseAssessment,
    readinessIntegration,
  }
}

/**
 * Readiness integration data for weak point assessment
 */
export interface ReadinessIntegration {
  readinessScore: number | null
  readinessLevel: string | null
  readinessLimiter: LimitingFactor | null
  readinessWeakPoints: WeakPointFromReadiness[]
  limiterAgreement: 'full' | 'partial' | 'different' | 'unknown'
  combinedConfidence: number
}

function checkLimiterAgreement(
  benchmarkLimiter: WeakPointType,
  readinessLimiter: LimitingFactor | null | undefined
): ReadinessIntegration['limiterAgreement'] {
  if (!readinessLimiter || readinessLimiter === 'none') {
    return 'unknown'
  }
  
  // Direct match
  if (benchmarkLimiter === readinessLimiter) {
    return 'full'
  }
  
  // Related limiters (partial agreement)
  const relatedGroups: WeakPointType[][] = [
    ['pull_strength', 'straight_arm_pull_strength', 'explosive_power'],
    ['push_strength', 'straight_arm_push_strength', 'vertical_push_strength', 'dip_strength'],
    ['scapular_control', 'shoulder_stability', 'ring_support_stability'],
    ['compression_strength', 'core_control'],
    ['wrist_tolerance', 'tendon_tolerance'],
    ['mobility', 'shoulder_extension_mobility'],
  ]
  
  for (const group of relatedGroups) {
    if (group.includes(benchmarkLimiter) && group.includes(readinessLimiter as WeakPointType)) {
      return 'partial'
    }
  }
  
  return 'different'
}

function calculateCombinedConfidence(
  benchmarkConfidence: number,
  readinessDataQuality: string | undefined
): number {
  const readinessConfidence = 
    readinessDataQuality === 'excellent' ? 0.9 :
    readinessDataQuality === 'solid' ? 0.7 :
    readinessDataQuality === 'developing' ? 0.5 : 0.3
  
  // Average with slight weighting toward readiness (it's more comprehensive)
  return benchmarkConfidence * 0.4 + readinessConfidence * 0.6
}
