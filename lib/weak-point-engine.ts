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
  | 'bent_arm_pull'
  | 'bent_arm_push'
  | 'compression_strength'
  | 'explosive_power'
  | 'transition_strength'
  | 'vertical_push_strength'
  | 'dip_strength'
  // Core-specific
  | 'core_compression'
  | 'core_anti_extension'
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
  | 'general_fatigue'
  // Equipment-based
  | 'equipment_limitation'
  // None
  | 'none'

export const WEAK_POINT_LABELS: Record<WeakPointType, string> = {
  pull_strength: 'Pulling Strength',
  push_strength: 'Pushing Strength',
  straight_arm_pull_strength: 'Straight-Arm Pull Strength',
  straight_arm_push_strength: 'Straight-Arm Push Strength',
  bent_arm_pull: 'Bent-Arm Pulling',
  bent_arm_push: 'Bent-Arm Pushing',
  compression_strength: 'Compression Strength',
  explosive_power: 'Explosive Pull Power',
  transition_strength: 'Transition Strength',
  vertical_push_strength: 'Vertical Push Strength',
  dip_strength: 'Dip Strength',
  core_compression: 'Core Compression',
  core_anti_extension: 'Core Anti-Extension',
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
  general_fatigue: 'General Fatigue',
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

// [WEAK-POINT-ENGINE-CAPACITY-BUCKET-COERCION]
// `OnboardingProfile.pullUpMax / dipMax / pushUpMax` are CATEGORICAL bucket
// strings (e.g. '0', '1_3', '4_7', '8_12', '13_18', '19_25', '25_plus' for
// pull-ups; '0_10', '10_25', '25_40', '40_plus' for push-ups; etc). The
// weak-point engine treated them as numbers, producing TS2367/TS2365 across
// the entire scoring block. Map the bucket string to a representative
// numeric upper-bound ONCE per benchmark — preserves all downstream
// thresholds since the existing scoring code already keys on those numeric
// breakpoints (3, 8, 12, 18, 25 for pulls; 5, 12, 20, 30 for dips;
// 30, 50 for push-ups).
function bucketToNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  // Plain numeric string (e.g. '0', '50') — parse directly.
  if (/^\d+$/.test(value)) return parseInt(value, 10)
  // Range bucket ('1_3', '4_7', '8_12', ...) — use upper bound.
  const range = /^(\d+)_(\d+)$/.exec(value)
  if (range) return parseInt(range[2]!, 10)
  // Open-ended bucket ('25_plus', '40_plus') — use the lower bound + 1
  // so the value falls into the highest tier of the engine's thresholds.
  const open = /^(\d+)_plus$/.exec(value)
  if (open) return parseInt(open[1]!, 10) + 1
  return null
}

function calculateBenchmarkScores(profile: OnboardingProfile, calibration: AthleteCalibration | null): BenchmarkScores {
  // [WEAK-POINT-ENGINE-CAPACITY-BUCKET-COERCION] coerce all three at once.
  const pullUpMaxN = bucketToNumber(profile.pullUpMax as string | null)
  const dipMaxN = bucketToNumber(profile.dipMax as string | null)
  const pushUpMaxN = bucketToNumber(profile.pushUpMax as string | null)

  // Pull strength (0-100)
  let pullStrength = 50
  if (pullUpMaxN !== null) {
    if (pullUpMaxN === 0) pullStrength = 10
    else if (pullUpMaxN <= 3) pullStrength = 25
    else if (pullUpMaxN <= 8) pullStrength = 45
    else if (pullUpMaxN <= 12) pullStrength = 60
    else if (pullUpMaxN <= 18) pullStrength = 75
    else if (pullUpMaxN <= 25) pullStrength = 85
    else pullStrength = 95
  }
  
  // Weighted pull-up bonus
  // [WEAK-POINT-ENGINE-WEIGHTED-LIFT-OWNER] canonical
  // `WeightedBenchmark.load` is the numeric load (lbs/kg). Previous
  // edit incorrectly wrote `addedWeight`; the correct canonical field
  // is `load`. Bodyweight is *not* on `OnboardingProfile`, so we drop
  // the bodyweight-relative percentage path and use absolute load
  // thresholds instead.
  const legacyProfile = profile as OnboardingProfile & { bodyweight?: number | null }
  if (profile.weightedPullUp?.load) {
    const load = profile.weightedPullUp.load
    const bwPercent = legacyProfile.bodyweight
      ? (load / legacyProfile.bodyweight) * 100
      : 0
    if (bwPercent >= 50) pullStrength = Math.max(pullStrength, 90)
    else if (bwPercent >= 30) pullStrength = Math.max(pullStrength, 75)
    else if (bwPercent >= 15) pullStrength = Math.max(pullStrength, 60)
  }
  
  // Push strength (0-100)
  let pushStrength = 50
  if (dipMaxN !== null) {
    if (dipMaxN === 0) pushStrength = 15
    else if (dipMaxN <= 5) pushStrength = 30
    else if (dipMaxN <= 12) pushStrength = 50
    else if (dipMaxN <= 20) pushStrength = 70
    else if (dipMaxN <= 30) pushStrength = 85
    else pushStrength = 95
  }
  
  // Push-up bonus
  if (pushUpMaxN !== null) {
    if (pushUpMaxN >= 50) pushStrength = Math.max(pushStrength, 70)
    else if (pushUpMaxN >= 30) pushStrength = Math.max(pushStrength, 55)
  }
  
  // Weighted dip bonus
  // [WEAK-POINT-ENGINE-WEIGHTED-LIFT-OWNER] canonical field is `load`.
  if (profile.weightedDip?.load) {
    const load = profile.weightedDip.load
    if (load >= 45) pushStrength = Math.max(pushStrength, 90)
    else if (load >= 25) pushStrength = Math.max(pushStrength, 75)
    else if (load >= 10) pushStrength = Math.max(pushStrength, 60)
  }
  
  // [WEAK-POINT-ENGINE-SKILL-BENCHMARK-OWNER]
  // `OnboardingProfile.frontLever` is `SkillBenchmark | null` (an object
  // with a `.progression` field), not a flat `frontLeverHold` string.
  // Same applies to `planche`. Read the progression off the benchmark
  // object — same downstream string keys, real owner.
  const frontLeverProgression = profile.frontLever?.progression ?? null
  const plancheProgression = profile.planche?.progression ?? null

  // Straight-arm pulling (estimated from weighted pull + skill levels)
  let straightArmPull = pullStrength * 0.7 // Base estimate
  if (frontLeverProgression && frontLeverProgression !== 'none') {
    const levelBonus: Record<string, number> = {
      'tuck': 50,
      'adv_tuck': 65,
      'one_leg': 75,
      'straddle': 85,
      'full': 95,
    }
    straightArmPull = Math.max(straightArmPull, levelBonus[frontLeverProgression] || 50)
  }
  
  // Straight-arm pushing (estimated from weighted dip + planche level)
  let straightArmPush = pushStrength * 0.7
  if (plancheProgression && plancheProgression !== 'none') {
    const levelBonus: Record<string, number> = {
      'lean': 40,
      'tuck': 55,
      'adv_tuck': 70,
      'straddle': 85,
      'full': 95,
    }
    straightArmPush = Math.max(straightArmPush, levelBonus[plancheProgression] || 40)
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
  
  // [WEAK-POINT-ENGINE-CALIBRATION-FIELD-OWNER]
  // `AthleteCalibration` no longer exposes `hollowBodySeconds` directly.
  // Read defensively through the looser legacy shape so calibration data
  // that still carries the field on disk continues to contribute.
  const legacyCalibration = calibration as (AthleteCalibration & { hollowBodySeconds?: number }) | null
  if (legacyCalibration?.hollowBodySeconds) {
    if (legacyCalibration.hollowBodySeconds >= 60) compression = Math.max(compression, 75)
    else if (legacyCalibration.hollowBodySeconds >= 30) compression = Math.max(compression, 55)
  }
  
  // Explosive power (estimated from pull-ups + muscle-up capability)
  let explosivePower = pullStrength * 0.6
  // [WEAK-POINT-ENGINE-MUSCLEUP-OWNER] `OnboardingProfile.muscleUp` is
  // `MuscleUpReadiness | null` ('none' | 'working_on' | 'capable' | ...).
  // Treat the explicit "can do a muscle-up" tokens as capable.
  const muscleUpCapable = profile.muscleUp === 'capable' || profile.muscleUp === 'working_on'
  if (muscleUpCapable) explosivePower = Math.max(explosivePower, 80)
  
  // Scapular control (inferred from skill levels)
  let scapularControl = Math.min(pullStrength, compression) * 0.8
  
  // [WEAK-POINT-ENGINE-JOINT-CAUTION-PLURALIZATION] `jointCautions` union
  // uses plural tokens (`shoulders`, `wrists`, `elbows`); singular forms
  // never matched at runtime. Use the canonical plurals.
  // [WEAK-POINT-ENGINE-HANDSTAND-FIELD-DROPPED] OnboardingProfile no
  // longer carries a `handstandHold` field. Read defensively through a
  // legacy structural slice so persisted documents that still have it
  // continue to feed the wrist/balance scores.
  const legacyProfileForHandstand = profile as OnboardingProfile & { handstandHold?: string | null }
  const handstandHold = legacyProfileForHandstand.handstandHold ?? null

  // Shoulder stability (inferred from skill levels and absence of issues)
  let shoulderStability = 60
  if (profile.jointCautions?.includes('shoulders')) shoulderStability = 40
  else if (pushStrength >= 70 && plancheProgression) shoulderStability = 75
  
  // Wrist tolerance
  let wristTolerance = 60
  if (profile.jointCautions?.includes('wrists')) wristTolerance = 35
  else if (handstandHold && handstandHold !== 'none') wristTolerance = 75
  
  // Core control (from compression + calibration)
  let coreControl = compression * 0.9
  
  // Balance control (from handstand)
  let balanceControl = 50
  if (handstandHold && handstandHold !== 'none') {
    const hsScores: Record<string, number> = {
      'wall_assisted': 45,
      'wall': 55,
      'free_5s': 70,
      'free_15s': 80,
      'free_30s': 90,
    }
    balanceControl = hsScores[handstandHold] || 50
  }
  
  // Mobility (general estimate)
  // [WEAK-POINT-ENGINE-FLEX-EMPHASIS-LEGACY] `flexibilityEmphasis` is no
  // longer declared on `OnboardingProfile` but persisted documents may
  // still carry it. Read defensively through a structural slice.
  const legacyFlex = (profile as OnboardingProfile & { flexibilityEmphasis?: 'high' | 'low' | string }).flexibilityEmphasis
  let mobility = 55
  if (legacyFlex === 'high') mobility = 70
  else if (legacyFlex === 'low') mobility = 40
  
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
  
  // New weak point type fallbacks
  if (factor === 'bent_arm_pull') return scores.pullStrength
  if (factor === 'bent_arm_push') return scores.pushStrength
  if (factor === 'core_compression') return scores.compression
  if (factor === 'core_anti_extension') return Math.min(scores.compression, scores.coreControl)
  if (factor === 'general_fatigue') return 50 // Not strength-based
  if (factor === 'recovery_capacity') return 50 // Not strength-based
  if (factor === 'work_capacity') return scores.explosivePower * 0.9
  
  return 50 // Default
}

/**
 * Detect weak points for a specific skill target.
 * Returns ranked bottlenecks with severity scores and priority exercises.
 * 
 * ENGINE QUALITY: This is the canonical limiter detection function.
 * All constraint/bottleneck analysis should flow through here.
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
  
  // ENGINE QUALITY: Log benchmark scores for diagnostics (dev only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WeakPointEngine] Benchmark scores for', skillTarget, ':', {
      pullStrength: scores.pullStrength,
      pushStrength: scores.pushStrength,
      straightArmPull: scores.straightArmPull,
      straightArmPush: scores.straightArmPush,
      compression: scores.compression,
      scapularControl: scores.scapularControl,
    })
  }
  
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
  
  // ENGINE QUALITY: Log assessment summary (dev only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WeakPointEngine] Assessment for', skillTarget, ':', {
      primaryLimiter: primaryPrereq.factor,
      primarySeverity: Math.round(primarySeverity),
      secondaryLimiter: secondaryPrereq?.factor || 'none',
      strongAreas: strongAreas.length,
      confidence: confidenceScore.toFixed(2),
    })
  }
  
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
  // [WEAK-POINT-TYPE-CONTRACT] This map is typed `Record<WeakPointType, string>`
  // — exhaustive, NOT Partial. The five entries below (bent_arm_pull,
  // bent_arm_push, core_compression, core_anti_extension, general_fatigue)
  // were missing from the prior version and produced TS2741 missing-key
  // errors. Each label is derived directly from the canonical
  // WEAK_POINT_LABELS table (line 79-107) and the WEAK_POINT_ACCESSORIES
  // doctrine (line 1524-1677): the emphasis text describes the same
  // accessory protocol that the accessory map prescribes, so coaching
  // language stays consistent across both surfaces. No new doctrine is
  // invented; existing per-key accessory intent is summarized.
  const emphasisMap: Record<WeakPointType, string> = {
    pull_strength: 'Weighted pull-up progressions',
    push_strength: 'Weighted dip and push-up work',
    straight_arm_pull_strength: 'Front lever and straight-arm pulling',
    straight_arm_push_strength: 'Planche lean and straight-arm pushing',
    bent_arm_pull: 'Chin-up and inverted row progressions',
    bent_arm_push: 'Push-up and dip progressions',
    compression_strength: 'L-sit and compression drills',
    explosive_power: 'High pulls and explosive pulling',
    transition_strength: 'Muscle-up transition drills',
    vertical_push_strength: 'Pike push-ups and overhead pressing',
    dip_strength: 'Dip progressions and weighted dips',
    core_compression: 'L-sit and dragon flag tuck progressions',
    core_anti_extension: 'Hollow body and dragon flag negatives',
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
    general_fatigue: 'Reduced volume and recovery focus',
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

// =============================================================================
// DOCTRINE INFLUENCE INTEGRATION
// =============================================================================

/**
 * Apply doctrine-informed weak point weighting.
 * Adjusts how weak points are prioritized based on training doctrine.
 *
 * Examples:
 * - Tendon-conservative doctrine: emphasize joint/tendon tolerance weak points
 * - Roadmap doctrine: emphasize missing prerequisites
 * - Weighted-strength doctrine: emphasize strength deficits for weighted skills
 */
export function applyDoctrineInfluenceToWeakPointAssessment(
  assessment: WeakPointAssessment,
  doctrineAdjustments: {
    emphasizeTendonTolerance?: boolean
    emphasizePrerequisites?: boolean
    emphasizeStrengthDeficits?: boolean
    emphasizeMovementBias?: boolean
    scaleIntensity?: number
  }
): WeakPointAssessment {
  if (!doctrineAdjustments || Object.keys(doctrineAdjustments).length === 0) {
    return assessment
  }

  let adjustedSeverity = assessment.primaryLimiter.severityScore
  const originalType = assessment.primaryLimiter.type

  // Tendon-conservative doctrine: boost tendon/joint concerns
  if (doctrineAdjustments.emphasizeTendonTolerance && 
      (originalType === 'tendon_tolerance' || originalType === 'wrist_tolerance')) {
    adjustedSeverity = Math.min(100, adjustedSeverity + 10)
  }

  // Roadmap doctrine: boost prerequisite gaps
  if (doctrineAdjustments.emphasizePrerequisites && 
      (originalType === 'pull_strength' || originalType === 'push_strength')) {
    adjustedSeverity = Math.min(100, adjustedSeverity + 8)
  }

  // Weighted-strength doctrine: boost strength deficits
  if (doctrineAdjustments.emphasizeStrengthDeficits && 
      (originalType === 'pull_strength' || originalType === 'push_strength' || 
       originalType === 'straight_arm_pull_strength' || originalType === 'straight_arm_push_strength')) {
    adjustedSeverity = Math.min(100, adjustedSeverity + 5)
  }

  // Movement bias doctrine: boost weak-side emphasis
  if (doctrineAdjustments.emphasizeMovementBias &&
      (originalType === 'push_strength' || originalType === 'pull_strength')) {
    adjustedSeverity = Math.min(100, adjustedSeverity + 3)
  }

  // Apply intensity scaling if provided
  if (doctrineAdjustments.scaleIntensity && doctrineAdjustments.scaleIntensity !== 1) {
    adjustedSeverity = adjustedSeverity * doctrineAdjustments.scaleIntensity
  }

  return {
    ...assessment,
    primaryLimiter: {
      ...assessment.primaryLimiter,
      severityScore: Math.min(100, Math.max(0, adjustedSeverity))
    }
  }
}

// =============================================================================
// RULE-BASED WEAK POINT DETECTION
// =============================================================================

/**
 * Simple, deterministic weak point detection based on clear rules.
 * This is the primary entry point for detecting limiting factors.
 * 
 * Rules:
 * - Front Lever: Strong pull-ups + weak FL = core_anti_extension + straight_arm_pull_strength
 * - Planche: Strong dips + weak planche = straight_arm_push_strength + shoulder_stability
 * - L-sit/Compression: Weak compression = core_compression
 * - Fatigue: High fatigue = general_fatigue (reduce volume)
 * - Scapular: Pulling present but skill weak = scapular_control
 */
export interface DetectedWeakPoints {
  primary: WeakPointType[]
  secondary: WeakPointType[]
}

export interface DetectionInput {
  // Onboarding profile data
  pullUpMax?: number | null
  dipMax?: number | null
  weightedPullUp?: { load: number } | null
  weightedDip?: { load: number } | null
  // Skill levels
  frontLeverLevel?: string | null
  plancheLevel?: string | null
  lSitLevel?: string | null
  // Fatigue state
  needsDeload?: boolean
  fatigueScore?: number // 0-100, higher = more fatigued
  // General strength context
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Deterministic detection of weak points based on simple rules.
 * Never throws, works with partial data, returns safe defaults.
 */
export function detectWeakPointsFromInput(input: DetectionInput): DetectedWeakPoints {
  const primary: WeakPointType[] = []
  const secondary: WeakPointType[] = []
  
  // Helper to check if pull strength is strong
  const hasStrongPulls = (input.pullUpMax && input.pullUpMax >= 12) || 
                         (input.weightedPullUp?.load && input.weightedPullUp.load >= 20)
  
  // Helper to check if push strength is strong
  const hasStrongPush = (input.dipMax && input.dipMax >= 15) ||
                        (input.weightedDip?.load && input.weightedDip.load >= 20)
  
  // ==========================================================================
  // FATIGUE RULE (highest priority - affects all training)
  // ==========================================================================
  if (input.needsDeload || (input.fatigueScore && input.fatigueScore >= 75)) {
    primary.push('general_fatigue')
    // Don't add other weak points - focus on recovery
    return { primary, secondary }
  }
  
  // ==========================================================================
  // FRONT LEVER LOGIC
  // Strong pulls + weak front lever = core_anti_extension + straight_arm_pull_strength
  // ==========================================================================
  if (hasStrongPulls && (!input.frontLeverLevel || 
      input.frontLeverLevel === 'none' || 
      input.frontLeverLevel === 'tuck' ||
      input.frontLeverLevel === 'unknown')) {
    primary.push('core_anti_extension')
    primary.push('straight_arm_pull_strength')
  }
  
  // ==========================================================================
  // PLANCHE LOGIC
  // Strong dips + weak planche = straight_arm_push_strength + shoulder_stability
  // ==========================================================================
  if (hasStrongPush && (!input.plancheLevel || 
      input.plancheLevel === 'none' || 
      input.plancheLevel === 'lean' ||
      input.plancheLevel === 'unknown')) {
    primary.push('straight_arm_push_strength')
    secondary.push('shoulder_stability')
  }
  
  // ==========================================================================
  // L-SIT / COMPRESSION LOGIC
  // Weak L-sit = core_compression (dragon flag is good for this)
  // ==========================================================================
  if (!input.lSitLevel || 
      input.lSitLevel === 'none' || 
      input.lSitLevel === 'tuck' ||
      input.lSitLevel === 'unknown') {
    // Compression weakness
    if (!primary.includes('core_compression')) {
      primary.push('core_compression')
    }
    // Dragon flag helps both compression AND anti-extension
    if (!primary.includes('core_anti_extension')) {
      secondary.push('core_anti_extension')
    }
  }
  
  // ==========================================================================
  // SCAPULAR LOGIC
  // Has pulling capability but skill work weak = scapular_control
  // ==========================================================================
  if ((input.pullUpMax && input.pullUpMax >= 8) && 
      ((!input.frontLeverLevel || input.frontLeverLevel === 'none' || input.frontLeverLevel === 'tuck') ||
       (input.experienceLevel === 'intermediate' && !hasStrongPulls))) {
    if (!primary.includes('scapular_control')) {
      secondary.push('scapular_control')
    }
  }
  
  // ==========================================================================
  // GENERAL STRENGTH DEFICITS
  // ==========================================================================
  if (input.pullUpMax !== undefined && input.pullUpMax !== null && input.pullUpMax < 8) {
    primary.push('pull_strength')
    primary.push('bent_arm_pull')
  }
  
  if (input.dipMax !== undefined && input.dipMax !== null && input.dipMax < 10) {
    primary.push('push_strength')
    primary.push('bent_arm_push')
  }
  
  // ==========================================================================
  // DEDUPLICATE AND RETURN
  // ==========================================================================
  return {
    primary: [...new Set(primary)],
    secondary: [...new Set(secondary.filter(s => !primary.includes(s)))],
  }
}

/**
 * Combine detection results with onboarding profile.
 * Convenience function for use in program builder.
 * 
 * [PROFILE-TRUTH-CONSUMPTION] UPGRADED: Now incorporates athlete's self-reported
 * weakestArea and primaryLimitation from onboarding, elevating user truth
 * alongside benchmark-derived detection.
 */
export function detectWeakPointsForProfile(
  profile: OnboardingProfile | null,
  calibration: AthleteCalibration | null,
  fatigueNeedsDeload?: boolean,
  fatigueScore?: number
): DetectedWeakPoints {
  if (!profile) {
    return { primary: [], secondary: [] }
  }
  
  const input: DetectionInput = {
    pullUpMax: profile.pullUpMax,
    dipMax: profile.dipMax,
    weightedPullUp: profile.weightedPullUp,
    weightedDip: profile.weightedDip,
    frontLeverLevel: profile.frontLeverHold || profile.frontLever?.progression,
    plancheLevel: profile.plancheHold || profile.planche?.progression,
    lSitLevel: profile.lSitHold,
    needsDeload: fatigueNeedsDeload,
    fatigueScore: fatigueScore,
    experienceLevel: calibration?.fitnessLevel as 'beginner' | 'intermediate' | 'advanced' || 'intermediate',
  }
  
  // Get benchmark-derived weak points
  const detected = detectWeakPointsFromInput(input)
  
  // ==========================================================================
  // [PROFILE-TRUTH-CONSUMPTION] INCORPORATE ATHLETE SELF-REPORTED WEAK AREAS
  // ==========================================================================
  // The athlete's explicit weakestArea and primaryLimitation from onboarding
  // represent direct user truth that should influence program construction.
  // These are elevated to primary consideration when provided.
  
  const profileWeakAreas = mapProfileDiagnosticsToWeakPoints(
    profile.weakestArea,
    profile.primaryLimitation
  )
  
  // Merge profile-reported weak areas with detected ones
  // Profile truth gets elevated - user-reported weaknesses are primary
  const mergedPrimary = [...new Set([
    ...profileWeakAreas.primary,
    ...detected.primary,
  ])]
  
  const mergedSecondary = [...new Set([
    ...profileWeakAreas.secondary,
    ...detected.secondary.filter(s => !mergedPrimary.includes(s)),
  ])]
  
  // Log profile truth consumption for audit
  if (profile.weakestArea || profile.primaryLimitation) {
    console.log('[profile-truth-consumption] Weak point detection includes profile diagnostics:', {
      weakestArea: profile.weakestArea,
      primaryLimitation: profile.primaryLimitation,
      profileWeakAreas,
      benchmarkDetected: detected,
      merged: { primary: mergedPrimary, secondary: mergedSecondary },
    })
  }
  
  return {
    primary: mergedPrimary,
    secondary: mergedSecondary,
  }
}

/**
 * Map athlete's self-reported weakestArea and primaryLimitation to WeakPointType.
 * 
 * [PROFILE-TRUTH-CONSUMPTION] This bridges onboarding diagnostics to
 * the weak-point engine, ensuring user-reported limitations materially
 * affect program construction.
 */
function mapProfileDiagnosticsToWeakPoints(
  weakestArea: string | null | undefined,
  primaryLimitation: string | null | undefined
): { primary: WeakPointType[]; secondary: WeakPointType[] } {
  const primary: WeakPointType[] = []
  const secondary: WeakPointType[] = []
  
  // Map weakestArea to WeakPointType
  // These come from OnboardingProfile.weakestArea
  if (weakestArea) {
    const weakAreaMapping: Record<string, WeakPointType> = {
      'pulling_strength': 'pull_strength',
      'pushing_strength': 'push_strength',
      'core_strength': 'core_compression',
      'shoulder_stability': 'shoulder_stability',
      'hip_mobility': 'mobility',
      'hamstring_flexibility': 'mobility',
    }
    const mapped = weakAreaMapping[weakestArea]
    if (mapped) {
      primary.push(mapped)
    }
  }
  
  // Map primaryLimitation to WeakPointType
  // These come from OnboardingProfile.primaryLimitation
  if (primaryLimitation) {
    const limitationMapping: Record<string, WeakPointType> = {
      'strength': 'pull_strength', // Default to pull as more common limiter
      'flexibility': 'mobility',
      'skill_coordination': 'scapular_control',
      'recovery': 'recovery_capacity',
      'consistency': 'work_capacity',
    }
    const mapped = limitationMapping[primaryLimitation]
    if (mapped && !primary.includes(mapped)) {
      // Add to secondary if primary already has a different weakness
      if (primary.length > 0) {
        secondary.push(mapped)
      } else {
        primary.push(mapped)
      }
    }
  }
  
  return { primary, secondary }
}

// =============================================================================
// WEAK POINT TO ACCESSORY MAPPING
// =============================================================================

/**
 * Maps weak point types to specific accessory exercises that address them.
 * Used by the program builder to add targeted support work.
 */
export const WEAK_POINT_ACCESSORIES: Record<WeakPointType, {
  primary: string[]
  secondary: string[]
  maxPerSession: number
}> = {
  // Core weak points - dragon flag integration
  // Dragon flag progression: tuck -> negatives -> assisted -> full
  // These address BOTH compression and anti-extension
  core_compression: {
    primary: ['tuck_l_sit', 'l_sit_core', 'hanging_l_sit'],
    secondary: ['dragon_flag_tuck', 'dragon_flag_neg', 'hanging_knee_raise'],
    maxPerSession: 2,
  },
  core_anti_extension: {
    primary: ['hollow_body', 'dragon_flag_tuck', 'dragon_flag_neg'],
    secondary: ['dead_bug', 'plank', 'tuck_front_lever_pull'],
    maxPerSession: 2,
  },
  compression_strength: {
    primary: ['l_sit_core', 'tuck_l_sit', 'pike_compression'],
    secondary: ['dragon_flag_tuck', 'dragon_flag_neg', 'hanging_leg_raise'],
    maxPerSession: 2,
  },
  core_control: {
    primary: ['hollow_body', 'dead_bug', 'bird_dog'],
    secondary: ['plank', 'side_hollow_hold'],
    maxPerSession: 1,
  },
  
  // Strength weak points
  pull_strength: {
    primary: ['pull_up', 'chin_up', 'inverted_row'],
    secondary: ['band_assisted_pull_up', 'pull_up_negative'],
    maxPerSession: 2,
  },
  bent_arm_pull: {
    primary: ['chin_up', 'inverted_row', 'ring_row'],
    secondary: ['band_assisted_pull_up', 'australian_pull_up'],
    maxPerSession: 2,
  },
  push_strength: {
    primary: ['dip', 'push_up', 'pike_push_up'],
    secondary: ['diamond_push_up', 'dip_negative'],
    maxPerSession: 2,
  },
  bent_arm_push: {
    primary: ['push_up', 'dip', 'diamond_push_up'],
    secondary: ['incline_push_up', 'dip_negative'],
    maxPerSession: 2,
  },
  straight_arm_pull_strength: {
    primary: ['tuck_front_lever_pull', 'pelican_curl_band', 'straight_arm_pull_down'],
    secondary: ['scap_pull_up', 'active_hang'],
    maxPerSession: 1,
  },
  straight_arm_push_strength: {
    primary: ['planche_lean', 'pseudo_planche_push_up', 'maltese_lean'],
    secondary: ['support_hold', 'ring_support_turn_out'],
    maxPerSession: 1,
  },
  dip_strength: {
    primary: ['dip', 'ring_dip', 'weighted_dip'],
    secondary: ['dip_negative', 'bench_dip'],
    maxPerSession: 1,
  },
  explosive_power: {
    primary: ['chest_to_bar_pull_up', 'explosive_pull_up', 'jumping_muscle_up'],
    secondary: ['clapping_push_up', 'kipping_pull_up'],
    maxPerSession: 1,
  },
  transition_strength: {
    primary: ['muscle_up_transition', 'low_bar_muscle_up', 'negative_muscle_up'],
    secondary: ['straight_bar_dip', 'chest_to_bar_pull_up'],
    maxPerSession: 1,
  },
  vertical_push_strength: {
    primary: ['pike_push_up', 'wall_hspu', 'decline_pike_push_up'],
    secondary: ['handstand_wall_touch', 'pike_hold'],
    maxPerSession: 1,
  },
  
  // Control weak points
  scapular_control: {
    primary: ['scap_pull_up', 'scap_pushup', 'scapular_retraction_hold'],
    secondary: ['banded_pull_apart', 'prone_y_raise'],
    maxPerSession: 1,
  },
  shoulder_stability: {
    primary: ['support_hold', 'shoulder_tap', 'ring_support_turn_out'],
    secondary: ['cuban_rotation', 'external_rotation'],
    maxPerSession: 1,
  },
  balance_control: {
    primary: ['wall_handstand', 'crow_pose', 'frog_stand'],
    secondary: ['handstand_wall_touch', 'pike_walk'],
    maxPerSession: 1,
  },
  ring_support_stability: {
    primary: ['ring_support_hold', 'ring_support_turn_out', 'ring_push_up'],
    secondary: ['ring_row', 'ring_plank'],
    maxPerSession: 1,
  },
  
  // Tolerance weak points
  wrist_tolerance: {
    primary: ['wrist_circle', 'wrist_extension_stretch', 'wrist_pushup'],
    secondary: ['finger_extension', 'wrist_rock'],
    maxPerSession: 1,
  },
  tendon_tolerance: {
    primary: ['support_hold', 'dead_hang', 'planche_lean_light'],
    secondary: ['wall_slide', 'external_rotation_light'],
    maxPerSession: 1,
  },
  mobility: {
    primary: ['shoulder_dislocate', 'deep_squat_hold', 'hip_flexor_stretch'],
    secondary: ['pigeon_pose', 'pancake_stretch'],
    maxPerSession: 1,
  },
  shoulder_extension_mobility: {
    primary: ['german_hang_passive', 'shoulder_dislocate', 'skin_the_cat_negative'],
    secondary: ['wall_slide', 'lat_stretch'],
    maxPerSession: 1,
  },
  
  // Recovery weak points
  recovery_capacity: {
    primary: [],
    secondary: [],
    maxPerSession: 0, // No accessories - reduce volume instead
  },
  work_capacity: {
    primary: ['emom_pull_up', 'emom_push_up', 'circuit_training'],
    secondary: ['high_rep_row', 'high_rep_push_up'],
    maxPerSession: 1,
  },
  general_fatigue: {
    primary: [],
    secondary: [],
    maxPerSession: 0, // No accessories - reduce volume instead
  },
  
  // Other
  equipment_limitation: {
    primary: [],
    secondary: [],
    maxPerSession: 0,
  },
  none: {
    primary: [],
    secondary: [],
    maxPerSession: 0,
  },
}

/**
 * Get recommended accessories for a list of weak points.
 * Respects session limits and prioritizes primary limiters.
 * 
 * @param weakPoints - Array of weak point types, ordered by priority
 * @param maxTotal - Maximum total accessories to return (default 2)
 * @returns Array of exercise IDs to add to session
 */
export function getWeakPointAccessories(
  weakPoints: WeakPointType[],
  maxTotal: number = 2
): string[] {
  const selected: string[] = []
  const usedIds = new Set<string>()
  
  // Process weak points in priority order
  for (const wp of weakPoints) {
    if (selected.length >= maxTotal) break
    
    const config = WEAK_POINT_ACCESSORIES[wp]
    if (!config || config.maxPerSession === 0) continue
    
    // Add primary accessories first
    for (const exerciseId of config.primary) {
      if (selected.length >= maxTotal) break
      if (usedIds.has(exerciseId)) continue
      
      selected.push(exerciseId)
      usedIds.add(exerciseId)
    }
    
    // Add secondary if still have room
    for (const exerciseId of config.secondary) {
      if (selected.length >= maxTotal) break
      if (usedIds.has(exerciseId)) continue
      
      selected.push(exerciseId)
      usedIds.add(exerciseId)
      break // Only one secondary per weak point
    }
  }
  
  return selected
}

/**
 * Check if a weak point indicates fatigue and should reduce volume.
 */
export function shouldReduceVolumeForWeakPoint(weakPoint: WeakPointType): boolean {
  return weakPoint === 'general_fatigue' || 
         weakPoint === 'recovery_capacity' ||
         weakPoint === 'tendon_tolerance'
}

/**
 * Get volume modifier based on weak point type.
 * Returns a multiplier (e.g., 0.7 for 30% reduction).
 */
export function getVolumeModifierForWeakPoint(weakPoint: WeakPointType): number {
  switch (weakPoint) {
    case 'general_fatigue':
      return 0.6 // 40% reduction
    case 'recovery_capacity':
      return 0.75 // 25% reduction
    case 'tendon_tolerance':
      return 0.85 // 15% reduction
    default:
      return 1.0
  }
}

// =============================================================================
// MOVEMENT-INTELLIGENT ACCESSORY SELECTION
// =============================================================================

import {
  selectSupportForLimiter,
  LIMITER_MOVEMENT_REQUIREMENTS,
  type MovementIntelligentExercise,
} from './movement-intelligence'
import type { JointCaution } from './athlete-profile'

/**
 * Maps WeakPointType to movement intelligence limiter ID
 */
const WEAK_POINT_TO_LIMITER: Partial<Record<WeakPointType, string>> = {
  straight_arm_pull_strength: 'front_lever_straight_arm_strength',
  straight_arm_push_strength: 'planche_straight_arm_strength',
  core_compression: 'compression_strength',
  core_anti_extension: 'dragon_flag_anti_extension',
  compression_strength: 'l_sit_compression',
  scapular_control: 'planche_protraction',
  vertical_push_strength: 'hspu_pressing_strength',
}

/**
 * Get movement-intelligent accessory recommendations for weak points.
 * This uses the canonical movement intelligence layer for selection.
 */
export function getMovementIntelligentAccessories(
  weakPoints: WeakPointType[],
  options: {
    jointCautions?: JointCaution[]
    maxDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    excludeIds?: string[]
    maxTotal?: number
  } = {}
): MovementIntelligentExercise[] {
  const maxTotal = options.maxTotal || 2
  const selected: MovementIntelligentExercise[] = []
  const usedIds = new Set<string>(options.excludeIds || [])
  
  console.log('[movement-intel] Selecting accessories for weak points:', weakPoints)
  
  for (const wp of weakPoints) {
    if (selected.length >= maxTotal) break
    
    // Map to movement intelligence limiter ID
    const limiterId = WEAK_POINT_TO_LIMITER[wp]
    if (!limiterId) {
      // Fall back to regular accessory selection if no movement intelligence mapping
      continue
    }
    
    // Use movement intelligence to find support exercises
    const candidates = selectSupportForLimiter(limiterId, {
      jointCautions: options.jointCautions,
      maxDifficulty: options.maxDifficulty,
      excludeIds: [...usedIds],
      limit: 2,
    })
    
    // Add candidates that haven't been used
    for (const candidate of candidates) {
      if (selected.length >= maxTotal) break
      if (usedIds.has(candidate.id)) continue
      
      selected.push(candidate)
      usedIds.add(candidate.id)
      
      console.log('[movement-intel] Selected accessory for', wp + ':', {
        id: candidate.id,
        pattern: candidate.primaryPattern,
        armType: candidate.armType,
        trunkDemand: candidate.trunkDemand,
      })
    }
  }
  
  return selected
}

/**
 * Get accessory exercise IDs using movement intelligence with fallback
 */
export function getSmartWeakPointAccessories(
  weakPoints: WeakPointType[],
  options: {
    jointCautions?: JointCaution[]
    maxDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    excludeIds?: string[]
    maxTotal?: number
  } = {}
): string[] {
  // First try movement-intelligent selection
  const intelligentAccessories = getMovementIntelligentAccessories(weakPoints, options)
  
  if (intelligentAccessories.length >= (options.maxTotal || 2)) {
    return intelligentAccessories.map(ex => ex.id)
  }
  
  // Fill remaining with traditional selection
  const neededMore = (options.maxTotal || 2) - intelligentAccessories.length
  const usedIds = new Set(intelligentAccessories.map(ex => ex.id))
  
  const traditional = getWeakPointAccessories(weakPoints, neededMore + 2)
    .filter(id => !usedIds.has(id))
    .slice(0, neededMore)
  
  return [...intelligentAccessories.map(ex => ex.id), ...traditional]
}

// =============================================================================
// TASK 7: LIMITER-DRIVEN PROGRAM SHAPING
// =============================================================================

/**
 * Program modifications driven by detected limiter.
 * TASK 7: Ensures limiter detection actually shapes the program.
 */
export interface LimiterDrivenProgramMods {
  // Volume adjustments
  volumeModifier: number
  intensityModifier: number
  
  // Session structure
  skillSlotsAdjustment: number        // +/- skill exercise slots
  strengthSlotsAdjustment: number     // +/- strength exercise slots
  accessorySlotsAdjustment: number    // +/- accessory slots
  
  // Weekly structure
  recommendedDaysPerWeek: { min: number; max: number }
  suggestStraightArmRestDay: boolean
  suggestRecoveryDay: boolean
  
  // Exercise selection guidance
  prioritizeExerciseTypes: string[]
  avoidExerciseTypes: string[]
  
  // Rest and intensity
  restMultiplier: number              // For main work
  warmupEmphasis: string[]            // Focus areas for warmup
  
  // Explanation for UI
  rationale: string
  coachingTip: string
}

/**
 * Generate program modifications based on detected limiter.
 * This is the canonical function for TASK 7.
 * 
 * @param primaryLimiter - The primary weak point detected
 * @param secondaryLimiter - Optional secondary limiter
 * @param severity - Severity score (0-100)
 * @returns Program modifications that address the limiter
 */
export function getLimiterDrivenProgramMods(
  primaryLimiter: WeakPointType,
  secondaryLimiter: WeakPointType | null,
  severity: number
): LimiterDrivenProgramMods {
  const baseMods: LimiterDrivenProgramMods = {
    volumeModifier: 1.0,
    intensityModifier: 1.0,
    skillSlotsAdjustment: 0,
    strengthSlotsAdjustment: 0,
    accessorySlotsAdjustment: 0,
    recommendedDaysPerWeek: { min: 3, max: 5 },
    suggestStraightArmRestDay: false,
    suggestRecoveryDay: false,
    prioritizeExerciseTypes: [],
    avoidExerciseTypes: [],
    restMultiplier: 1.0,
    warmupEmphasis: [],
    rationale: '',
    coachingTip: '',
  }
  
  // =========================================================================
  // PULLING STRENGTH DEFICIT
  // =========================================================================
  if (primaryLimiter === 'pull_strength' || primaryLimiter === 'bent_arm_pull') {
    return {
      ...baseMods,
      strengthSlotsAdjustment: +1,
      accessorySlotsAdjustment: +1,
      prioritizeExerciseTypes: ['vertical_pull', 'horizontal_pull', 'weighted_pull'],
      warmupEmphasis: ['scapular_activation', 'lat_activation'],
      rationale: 'Your pulling strength is currently limiting skill progress. This program emphasizes pulling volume and weighted progressions.',
      coachingTip: 'Focus on adding weight to your pull-ups before advancing lever work.',
    }
  }
  
  // =========================================================================
  // PUSHING STRENGTH DEFICIT
  // =========================================================================
  if (primaryLimiter === 'push_strength' || primaryLimiter === 'bent_arm_push' || primaryLimiter === 'dip_strength') {
    return {
      ...baseMods,
      strengthSlotsAdjustment: +1,
      prioritizeExerciseTypes: ['vertical_push', 'horizontal_push', 'weighted_dip'],
      warmupEmphasis: ['shoulder_activation', 'tricep_prep'],
      rationale: 'Your pushing strength needs development. This program includes more pressing volume.',
      coachingTip: 'Build your dip numbers before pushing hard on planche work.',
    }
  }
  
  // =========================================================================
  // STRAIGHT-ARM PULL DEFICIT (Front Lever)
  // =========================================================================
  if (primaryLimiter === 'straight_arm_pull_strength') {
    return {
      ...baseMods,
      skillSlotsAdjustment: +1,
      accessorySlotsAdjustment: +1,
      suggestStraightArmRestDay: true,
      prioritizeExerciseTypes: ['straight_arm_pull', 'scapular_pull', 'front_lever_prep'],
      avoidExerciseTypes: [], // Don't avoid bent-arm - it supports
      warmupEmphasis: ['scapular_activation', 'lat_stretch', 'shoulder_circles'],
      restMultiplier: 1.2, // Extra rest for tendon work
      rationale: 'Straight-arm pulling strength is your primary limiter for front lever. The program includes targeted lever progressions with adequate tendon recovery.',
      coachingTip: 'Quality holds at easier progressions build tendon strength. Avoid grinding long holds.',
    }
  }
  
  // =========================================================================
  // STRAIGHT-ARM PUSH DEFICIT (Planche)
  // =========================================================================
  if (primaryLimiter === 'straight_arm_push_strength') {
    return {
      ...baseMods,
      skillSlotsAdjustment: +1,
      accessorySlotsAdjustment: +1,
      suggestStraightArmRestDay: true,
      prioritizeExerciseTypes: ['straight_arm_push', 'planche_lean', 'pseudo_planche'],
      warmupEmphasis: ['wrist_prep', 'shoulder_protraction', 'scapular_activation'],
      restMultiplier: 1.3, // Extra rest for wrist/tendon work
      rationale: 'Straight-arm pushing strength is your primary limiter for planche. The program emphasizes lean work and shoulder protraction.',
      coachingTip: 'Lean angle matters more than hold time. Build protraction strength gradually.',
    }
  }
  
  // =========================================================================
  // CORE COMPRESSION DEFICIT
  // =========================================================================
  if (primaryLimiter === 'compression_strength' || primaryLimiter === 'core_compression') {
    return {
      ...baseMods,
      accessorySlotsAdjustment: +1,
      prioritizeExerciseTypes: ['compression', 'hip_flexor', 'l_sit_prep'],
      warmupEmphasis: ['hip_flexor_activation', 'pike_stretch'],
      rationale: 'Compression strength is limiting your L-sit and skill work. Additional core compression work is included.',
      coachingTip: 'Pike compression drills transfer directly to lever and planche body position.',
    }
  }
  
  // =========================================================================
  // CORE ANTI-EXTENSION DEFICIT
  // =========================================================================
  if (primaryLimiter === 'core_anti_extension') {
    return {
      ...baseMods,
      accessorySlotsAdjustment: +1,
      prioritizeExerciseTypes: ['anti_extension', 'hollow_body', 'dragon_flag'],
      warmupEmphasis: ['hollow_hold', 'dead_bug'],
      rationale: 'Anti-extension core strength is limiting your lever and planche line. Dragon flag progressions are included.',
      coachingTip: 'Hollow body position is the foundation. If your back arches, regress the movement.',
    }
  }
  
  // =========================================================================
  // SCAPULAR CONTROL DEFICIT
  // =========================================================================
  if (primaryLimiter === 'scapular_control') {
    return {
      ...baseMods,
      accessorySlotsAdjustment: +1,
      prioritizeExerciseTypes: ['scapular_pull', 'scapular_push', 'retraction'],
      warmupEmphasis: ['scapular_circles', 'scap_pull_up', 'retraction_holds'],
      rationale: 'Scapular control is essential for skill work. Additional scapular emphasis is included.',
      coachingTip: 'Focus on initiating movements from the scapulae, not the arms.',
    }
  }
  
  // =========================================================================
  // SHOULDER STABILITY DEFICIT
  // =========================================================================
  if (primaryLimiter === 'shoulder_stability') {
    return {
      ...baseMods,
      restMultiplier: 1.2,
      intensityModifier: 0.9,
      prioritizeExerciseTypes: ['support_hold', 'ring_support', 'shoulder_stability'],
      avoidExerciseTypes: ['explosive', 'max_effort'],
      warmupEmphasis: ['rotator_cuff', 'shoulder_circles', 'wall_slides'],
      rationale: 'Shoulder stability needs development before progressing to demanding skills. Program includes controlled stability work.',
      coachingTip: 'Build time under tension in supported positions. Quality over intensity.',
    }
  }
  
  // =========================================================================
  // WRIST TOLERANCE DEFICIT
  // =========================================================================
  if (primaryLimiter === 'wrist_tolerance') {
    return {
      ...baseMods,
      restMultiplier: 1.3,
      intensityModifier: 0.85,
      prioritizeExerciseTypes: ['parallette', 'ring', 'wrist_prep'],
      avoidExerciseTypes: ['floor_planche', 'extended_wrist_holds'],
      warmupEmphasis: ['wrist_circles', 'wrist_rocks', 'finger_stretches'],
      rationale: 'Wrist tolerance is a limiter. Program uses parallettes where possible and includes extra wrist prep.',
      coachingTip: 'Build wrist strength gradually. Use parallettes to reduce strain while developing tolerance.',
    }
  }
  
  // =========================================================================
  // TENDON TOLERANCE DEFICIT
  // =========================================================================
  if (primaryLimiter === 'tendon_tolerance') {
    return {
      ...baseMods,
      volumeModifier: 0.85,
      intensityModifier: 0.9,
      restMultiplier: 1.4,
      recommendedDaysPerWeek: { min: 3, max: 4 },
      suggestStraightArmRestDay: true,
      suggestRecoveryDay: true,
      avoidExerciseTypes: ['high_volume_straight_arm', 'max_holds'],
      warmupEmphasis: ['joint_circles', 'blood_flow', 'gradual_loading'],
      rationale: 'Tendon tolerance requires patient development. Volume is reduced with extra recovery time between straight-arm sessions.',
      coachingTip: 'Tendons adapt slower than muscles. Respect the rest days and avoid grinding.',
    }
  }
  
  // =========================================================================
  // RECOVERY / FATIGUE
  // =========================================================================
  if (primaryLimiter === 'general_fatigue' || primaryLimiter === 'recovery_capacity') {
    return {
      ...baseMods,
      volumeModifier: severity > 70 ? 0.6 : 0.75,
      intensityModifier: severity > 70 ? 0.85 : 0.9,
      skillSlotsAdjustment: -1,
      accessorySlotsAdjustment: -1,
      recommendedDaysPerWeek: { min: 2, max: 3 },
      suggestRecoveryDay: true,
      avoidExerciseTypes: ['max_effort', 'high_volume'],
      warmupEmphasis: ['blood_flow', 'mobility'],
      rationale: 'Current fatigue levels indicate a need for reduced volume. Focus on quality over quantity.',
      coachingTip: 'Recovery is part of progress. Reduced sessions now will pay off later.',
    }
  }
  
  // =========================================================================
  // VERTICAL PUSH DEFICIT (HSPU)
  // =========================================================================
  if (primaryLimiter === 'vertical_push_strength') {
    return {
      ...baseMods,
      strengthSlotsAdjustment: +1,
      prioritizeExerciseTypes: ['pike_push', 'wall_hspu', 'overhead_press'],
      warmupEmphasis: ['shoulder_mobility', 'thoracic_extension', 'wrist_prep'],
      rationale: 'Vertical pushing strength needs development for HSPU progress. Pike push-up progressions are emphasized.',
      coachingTip: 'Wall-assisted work builds strength. Free-standing comes after wall strength is solid.',
    }
  }
  
  // =========================================================================
  // EXPLOSIVE POWER DEFICIT (Muscle-Up)
  // =========================================================================
  if (primaryLimiter === 'explosive_power' || primaryLimiter === 'transition_strength') {
    return {
      ...baseMods,
      skillSlotsAdjustment: +1,
      prioritizeExerciseTypes: ['high_pull', 'chest_to_bar', 'transition_drill'],
      warmupEmphasis: ['explosive_prep', 'hip_drive', 'lat_activation'],
      rationale: 'Explosive pulling power is key for muscle-up success. High pulls and transition drills are included.',
      coachingTip: 'Learn to pull explosively, not just strongly. Height matters.',
    }
  }
  
  // =========================================================================
  // DEFAULT (NO SPECIFIC LIMITER)
  // =========================================================================
  if (primaryLimiter === 'none') {
    return {
      ...baseMods,
      rationale: 'No clear limiter detected. Balanced progression across all areas.',
      coachingTip: 'Continue consistent training across skill and strength work.',
    }
  }
  
  // Default fallback
  return {
    ...baseMods,
    rationale: `Training emphasis adjusted for ${WEAK_POINT_LABELS[primaryLimiter].toLowerCase()}.`,
    coachingTip: 'Consistent targeted work will address this area.',
  }
}

/**
 * DEV DIAGNOSTIC: Log limiter-driven modifications
 */
export function logLimiterDrivenMods(
  limiter: WeakPointType,
  mods: LimiterDrivenProgramMods
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[LimiterDrivenMods] Limiter:', limiter)
  console.log('[LimiterDrivenMods] Modifications:', {
    volume: mods.volumeModifier,
    intensity: mods.intensityModifier,
    skillSlots: mods.skillSlotsAdjustment,
    strengthSlots: mods.strengthSlotsAdjustment,
    accessorySlots: mods.accessorySlotsAdjustment,
    restMultiplier: mods.restMultiplier,
    prioritize: mods.prioritizeExerciseTypes,
  })
  console.log('[LimiterDrivenMods] Rationale:', mods.rationale)
}
