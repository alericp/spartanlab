/**
 * Canonical Readiness Engine
 * 
 * THE SINGLE SOURCE OF TRUTH for all readiness calculations in SpartanLab.
 * 
 * All readiness consumers must use this engine:
 * - Dashboard readiness visuals
 * - Public SEO calculators
 * - Constraint detection engine
 * - Program generation inputs
 * - Coaching summaries
 * - SkillState updates
 * 
 * Design Principles:
 * 1. One calculation path for each skill
 * 2. Standardized output format across all skills
 * 3. Consistent limiting factor detection
 * 4. Explainable, deterministic logic
 */

import {
  calculateFrontLeverReadiness,
  calculatePlancheReadiness,
  calculateMuscleUpReadiness,
  calculateHSPUReadiness,
  calculateLSitReadiness,
  calculateBackLeverReadiness,
  calculateVSitReadiness,
  calculateIronCrossReadiness,
  calculateDragonFlagReadiness,
  type ReadinessResult,
  type ReadinessLevel,
  type ScoreBreakdown,
  type IronCrossInputs,
  type VSitInputs,
  type DragonFlagInputs,
} from './skill-readiness'

// =============================================================================
// UNIFIED READINESS OUTPUT TYPES
// =============================================================================

export type SkillType = 'front_lever' | 'back_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit' | 'v_sit' | 'iron_cross' | 'dragon_flag' | 'one_arm_pull_up' | 'one_arm_push_up' | 'planche_push_up'

/**
 * Standardized readiness component scores (0-100)
 * All skills map their specific factors to these universal components
 */
export interface ReadinessComponentScores {
  pullStrength: number        // Pulling base strength (pull-ups, weighted pulls)
  pushStrength: number        // Pushing base strength (dips, push-ups)
  compression: number         // Core compression / hollow body
  scapularControl: number     // Scapular stability and control
  straightArmStrength: number // Straight-arm specific strength
  shoulderStability: number   // Shoulder joint stability
  wristTolerance: number      // Wrist strength/mobility
  mobility: number            // General mobility
  explosivePower: number      // Explosive movement capacity
  skillSpecific: number       // Skill-specific technique/experience
  tendonTolerance: number     // Tendon conditioning (critical for Iron Cross)
}

/**
 * Canonical readiness output - consistent across all skills
 */
export interface CanonicalReadinessResult {
  // Skill identification
  skill: SkillType
  
  // Overall score (0-100)
  overallScore: number
  
  // Readiness level classification
  level: ReadinessLevel
  levelLabel: string
  
  // Component breakdown (all normalized to 0-100)
  components: ReadinessComponentScores
  
  // Original detailed breakdown from skill-specific calculator
  rawBreakdown: ScoreBreakdown[]
  
  // Limiting factors - consistent detection
  primaryLimiter: LimitingFactor
  secondaryLimiter: LimitingFactor | null
  strongAreas: LimitingFactor[]
  
  // Coaching guidance
  recommendation: string
  nextProgression: string
  limitingFactorExplanation: string
  
  // Protocol recommendations
  suggestedProtocol?: string
}

/**
 * Limiting factor categories - maps to constraint detection categories
 */
export type LimitingFactor =
  | 'pull_strength'
  | 'push_strength'
  | 'straight_arm_pull_strength'
  | 'straight_arm_push_strength'
  | 'compression_strength'
  | 'core_control'
  | 'scapular_control'
  | 'shoulder_stability'
  | 'wrist_tolerance'
  | 'explosive_pull_power'
  | 'transition_strength'
  | 'vertical_push_strength'
  | 'mobility'
  | 'shoulder_extension_mobility'
  | 'skill_coordination'
  | 'balance_control'
  | 'tendon_tolerance'
  | 'ring_support_stability'
  | 'none'

export const LIMITING_FACTOR_LABELS: Record<LimitingFactor, string> = {
  pull_strength: 'Pulling Strength',
  push_strength: 'Pushing Strength',
  straight_arm_pull_strength: 'Straight-Arm Pull Strength',
  straight_arm_push_strength: 'Straight-Arm Push Strength',
  compression_strength: 'Compression Strength',
  core_control: 'Core Control',
  scapular_control: 'Scapular Control',
  shoulder_stability: 'Shoulder Stability',
  wrist_tolerance: 'Wrist Tolerance',
  explosive_pull_power: 'Explosive Pull Power',
  transition_strength: 'Transition Strength',
  vertical_push_strength: 'Vertical Push Strength',
  mobility: 'Mobility',
  shoulder_extension_mobility: 'Shoulder Extension Mobility',
  skill_coordination: 'Skill Coordination',
  balance_control: 'Balance Control',
  tendon_tolerance: 'Tendon Tolerance',
  ring_support_stability: 'Ring Support Stability',
  none: 'No Limiting Factor',
}

// =============================================================================
// SKILL-SPECIFIC COMPONENT MAPPINGS
// =============================================================================

/**
 * Maps skill-specific breakdown factors to universal component categories
 */
const SKILL_COMPONENT_MAPPINGS: Record<SkillType, Record<string, keyof ReadinessComponentScores>> = {
  front_lever: {
    'Pull-Up Strength': 'pullStrength',
    'Weighted Pull-Up': 'straightArmStrength',
    'Core Tension (Hollow Hold)': 'compression',
    'Tuck Front Lever Hold': 'skillSpecific',
    'Equipment Access': 'skillSpecific',
  },
  back_lever: {
    'German Hang / Shoulder Extension': 'mobility',
    'Skin the Cat Ability': 'shoulderStability',
    'Core Tension (Hollow Hold)': 'compression',
    'Tuck Back Lever Experience': 'skillSpecific',
    'Equipment Access': 'skillSpecific',
  },
  planche: {
    'Push-Up Endurance': 'pushStrength',
    'Dip Strength': 'pushStrength',
    'Planche Lean / Shoulder Loading': 'straightArmStrength',
    'Overhead Stability (Handstand)': 'shoulderStability',
    'Shoulder Mobility': 'mobility',
    'Equipment Access': 'skillSpecific',
  },
  muscle_up: {
    'Pull-Up Strength': 'pullStrength',
    'Dip Strength': 'pushStrength',
    'Chest-to-Bar Pull-Ups': 'explosivePower',
    'Explosive Pull Ability': 'explosivePower',
    'Equipment Access': 'skillSpecific',
  },
  hspu: {
    'Wall HSPU Ability': 'skillSpecific',
    'Pike Push-Up Strength': 'pushStrength',
    'Dip Strength': 'pushStrength',
    'Handstand Hold': 'shoulderStability',
    'Overhead Press Strength': 'pushStrength',
    'Equipment Access': 'skillSpecific',
  },
l_sit: {
  'Dip Support Strength': 'pushStrength',
  'Hollow Hold / Core Compression': 'compression',
  'Hip Flexor Strength': 'compression',
  'Toe Point Quality': 'mobility',
  'Equipment Access': 'skillSpecific',
  },
  v_sit: {
  'L-Sit Foundation': 'skillSpecific',
  'Pike Compression Strength': 'compression',
  'Hip Flexor Strength': 'compression',
  'Hamstring Flexibility': 'mobility',
  'Core Stability (Hollow Hold)': 'compression',
  },
  iron_cross: {
    'Ring Support Stability': 'shoulderStability',
    'RTO Support Hold': 'straightArmStrength',
    'Straight-Arm Shoulder Strength': 'straightArmStrength',
    'Scapular Depression Strength': 'scapularControl',
    'Shoulder Stability': 'shoulderStability',
    'Tendon Tolerance': 'tendonTolerance',
  },
  dragon_flag: {
    'Hollow Body Hold': 'compression',
    'Dragon Flag Tuck': 'skillSpecific',
    'Leg Raise Strength': 'compression',
    'Ab Wheel Rollout': 'compression',
    'Lower Back Mobility': 'mobility',
    'Hip Flexor Strength': 'compression',
  },
  one_arm_pull_up: {
    'Weighted Pull-Up Strength': 'pullStrength',
    'Archer Pull-Up Ability': 'skillSpecific',
    'Grip Strength': 'pullStrength',
    'Elbow/Bicep Tendon Health': 'shoulderStability',
    'Scapular Control': 'scapularControl',
  },
  one_arm_push_up: {
    'Push-Up Strength': 'pushStrength',
    'Archer Push-Up Ability': 'skillSpecific',
    'Core Anti-Rotation': 'compression',
    'Shoulder Stability': 'shoulderStability',
    'Wrist Tolerance': 'wristTolerance',
  },
  planche_push_up: {
    'Planche Hold Ability': 'straightArmStrength',
    'Pseudo Planche Push-Up': 'skillSpecific',
    'Scapular Protraction': 'scapularControl',
    'Tricep Strength': 'pushStrength',
    'Wrist Conditioning': 'wristTolerance',
    'Core Tension': 'compression',
  },
}

/**
 * Maps skill-specific limiting factors to universal categories
 */
const LIMITING_FACTOR_MAPPINGS: Record<SkillType, Record<string, LimitingFactor>> = {
  front_lever: {
    'Base pulling strength': 'pull_strength',
    'Weighted pulling deficit': 'straight_arm_pull_strength',
    'Core compression weakness': 'compression_strength',
    'Skill-specific experience': 'skill_coordination',
    'General preparedness': 'pull_strength',
  },
  back_lever: {
    'Shoulder extension mobility': 'shoulder_extension_mobility',
    'Shoulder stability': 'shoulder_stability',
    'Core compression weakness': 'compression_strength',
    'Skill-specific experience': 'skill_coordination',
    'General preparedness': 'straight_arm_pull_strength',
  },
  planche: {
    'Push-up endurance': 'push_strength',
    'Dip strength deficit': 'push_strength',
    'Planche lean weakness': 'straight_arm_push_strength',
    'Shoulder mobility': 'mobility',
    'General preparedness': 'straight_arm_push_strength',
  },
  muscle_up: {
    'Base pulling strength': 'pull_strength',
    'Pressing strength deficit': 'push_strength',
    'Pulling height deficit': 'explosive_pull_power',
    'Explosive power deficit': 'explosive_pull_power',
    'General preparedness': 'pull_strength',
  },
  hspu: {
    'Wall HSPU ability': 'vertical_push_strength',
    'Pike strength deficit': 'vertical_push_strength',
    'Pressing strength': 'push_strength',
    'Balance / stability': 'balance_control',
    'General preparedness': 'vertical_push_strength',
  },
l_sit: {
  'Dip support weakness': 'push_strength',
  'Core compression weakness': 'compression_strength',
  'Hip flexor weakness': 'compression_strength',
  'Mobility limitation': 'mobility',
  'General preparedness': 'compression_strength',
  },
  v_sit: {
  'L-sit strength deficit': 'skill_coordination',
  'Compression weakness': 'compression_strength',
  'Hip flexor weakness': 'compression_strength',
  'Hamstring flexibility limitation': 'mobility',
  'Core stability deficit': 'core_control',
  'General compression preparedness': 'compression_strength',
  },
  iron_cross: {
    'Ring support weakness': 'ring_support_stability',
    'RTO support deficit': 'straight_arm_push_strength',
    'Straight-arm strength deficit': 'straight_arm_push_strength',
    'Scapular depression weakness': 'scapular_control',
    'Shoulder stability limitation': 'shoulder_stability',
    'Tendon conditioning needed': 'tendon_tolerance',
    'Overall rings strength': 'straight_arm_push_strength',
  },
  dragon_flag: {
    'Core compression weakness': 'compression_strength',
    'Dragon flag progression deficit': 'skill_coordination',
    'Hip flexor weakness': 'compression_strength',
    'Lower back mobility limitation': 'mobility',
    'Anti-extension control': 'core_control',
    'General preparedness': 'compression_strength',
  },
  one_arm_pull_up: {
    'Base pulling strength': 'pull_strength',
    'Weighted pulling strength': 'pull_strength',
    'Unilateral pulling coordination': 'skill_coordination',
    'Grip strength deficit': 'pull_strength',
    'Tendon conditioning': 'tendon_tolerance',
    'General preparedness': 'pull_strength',
  },
  one_arm_push_up: {
    'Base pressing strength': 'push_strength',
    'Unilateral pressing coordination': 'skill_coordination',
    'Core anti-rotation weakness': 'core_control',
    'Shoulder stability': 'shoulder_stability',
    'General preparedness': 'push_strength',
  },
  planche_push_up: {
    'Planche hold strength': 'straight_arm_push_strength',
    'Pressing from planche': 'push_strength',
    'Scapular protraction weakness': 'scapular_control',
    'Wrist conditioning': 'wrist_tolerance',
    'Core tension': 'compression_strength',
    'General preparedness': 'straight_arm_push_strength',
  },
}

// =============================================================================
// ATHLETE INPUT TYPES
// =============================================================================

/**
 * Universal athlete input for readiness calculation
 * Can come from AthleteProfile, onboarding data, or manual input
 */
export interface AthleteReadinessInput {
  // Pull metrics
  maxPullUps?: number
  weightedPullUpLoad?: number // lbs
  chestToBarReps?: number
  
  // Push metrics  
  maxPushUps?: number
  maxDips?: number
  
  // Core metrics
  hollowHoldTime?: number // seconds
  
  // Skill-specific metrics
  tuckFrontLeverHold?: number
  tuckBackLeverHold?: number
  plancheLeanHold?: number
  wallHandstandHold?: number
  wallHSPUReps?: number
  pikeHSPUReps?: number
  
  // Mobility assessments
  shoulderMobilityConfidence?: 'poor' | 'moderate' | 'good' | 'excellent'
  germanHangTime?: number
  
  // Ability flags
  canSkinTheCat?: boolean
  hasExplosivePulls?: boolean
  overheadPressStrength?: 'none' | 'light' | 'moderate' | 'strong'
  toePointQuality?: 'poor' | 'moderate' | 'good'
  hipFlexorStrength?: 'weak' | 'moderate' | 'strong' | 'very_strong'
  
  // Equipment
  equipment?: string[]
  hasRings?: boolean
  hasBar?: boolean
  hasParallettes?: boolean
  hasFloor?: boolean
  hasWall?: boolean
  hasBands?: boolean
  
// V-Sit specific
  lSitHoldTime?: number
  pikeCompressionQuality?: 'poor' | 'moderate' | 'good' | 'excellent'
  hamstringFlexibility?: 'poor' | 'moderate' | 'good' | 'excellent'
  
  // Iron Cross specific
  ringSupportHoldTime?: number
  rtoSupportHoldTime?: number
  straightArmStrength?: 'none' | 'basic' | 'intermediate' | 'advanced'
  scapularDepressionStrength?: 'weak' | 'moderate' | 'strong'
  shoulderStability?: 'unstable' | 'moderate' | 'stable' | 'very_stable'
  tendonTolerance?: 'low' | 'moderate' | 'high'
  assistedCrossHoldTime?: number
  
  // Dragon Flag specific
  dragonFlagTuckReps?: number
  legRaiseMax?: number
  abWheelRolloutMax?: number
  lowerBackMobility?: 'poor' | 'moderate' | 'good' | 'excellent'
  
  // One-Arm Pull-Up specific
  archerPullUpReps?: number
  
  // One-Arm Push-Up specific
  archerPushUpReps?: number
  
  // Planche Push-Up specific
  pseudoPlanchePushUpReps?: number
  tuckPlancheHold?: number
  wristCircles?: boolean
  }

// =============================================================================
// MAIN CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate readiness for a specific skill
 * THE CANONICAL ENTRY POINT - all consumers should use this
 */
export function calculateCanonicalReadiness(
  skill: SkillType,
  input: AthleteReadinessInput
): CanonicalReadinessResult {
  // Route to skill-specific calculator
  const rawResult = calculateRawReadiness(skill, input)
  
  // Transform to canonical format
  return transformToCanonical(skill, rawResult, input)
}

/**
 * Calculate readiness for all skills at once
 */
export function calculateAllSkillReadiness(
  input: AthleteReadinessInput
): Map<SkillType, CanonicalReadinessResult> {
  const skills: SkillType[] = ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit', 'v_sit', 'iron_cross', 'dragon_flag', 'one_arm_pull_up', 'one_arm_push_up', 'planche_push_up']
  const results = new Map<SkillType, CanonicalReadinessResult>()
  
  for (const skill of skills) {
    results.set(skill, calculateCanonicalReadiness(skill, input))
  }
  
  return results
}

/**
 * Calculate readiness from AthleteProfile data
 * Convenience function for engine integration
 */
export function calculateReadinessFromProfile(
  skill: SkillType,
  profile: {
    pullUpMax?: number | null
    dipMax?: number | null
    pushUpMax?: number | null
    hollowHoldTime?: number | null
    experienceLevel?: string
    equipment?: string[]
  }
): CanonicalReadinessResult {
  const input: AthleteReadinessInput = {
    maxPullUps: profile.pullUpMax ?? undefined,
    maxDips: profile.dipMax ?? undefined,
    maxPushUps: profile.pushUpMax ?? undefined,
    hollowHoldTime: profile.hollowHoldTime ?? undefined,
    equipment: profile.equipment,
    hasBar: profile.equipment?.some(e => e.includes('bar') || e.includes('pull')) ?? true,
    hasRings: profile.equipment?.includes('rings') ?? false,
    hasParallettes: profile.equipment?.includes('parallettes') ?? true,
    hasFloor: true,
    hasWall: true,
  }
  
  return calculateCanonicalReadiness(skill, input)
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function calculateRawReadiness(skill: SkillType, input: AthleteReadinessInput): ReadinessResult {
  switch (skill) {
    case 'front_lever':
      return calculateFrontLeverReadiness({
        maxPullUps: input.maxPullUps ?? 0,
        weightedPullUpLoad: input.weightedPullUpLoad ?? 0,
        hollowHoldTime: input.hollowHoldTime ?? 0,
        tuckFrontLeverHold: input.tuckFrontLeverHold,
        hasRings: input.hasRings ?? false,
        hasBar: input.hasBar ?? true,
      })
    
    case 'back_lever':
      return calculateBackLeverReadiness({
        maxPullUps: input.maxPullUps ?? 0,
        germanHangHold: input.germanHangTime ?? 0,
        skinTheCatReps: input.canSkinTheCat ? 3 : 0, // Convert boolean to rep estimate
        ringsSupportHold: 20, // Default estimate
        invertedHangHold: 10, // Default estimate
        hasRings: input.hasRings ?? false,
        hasBar: input.hasBar ?? true,
      })
    
    case 'planche':
      return calculatePlancheReadiness({
        maxPushUps: input.maxPushUps ?? 0,
        maxDips: input.maxDips ?? 0,
        plancheLeanHold: input.plancheLeanHold ?? 0,
        wallHandstandHold: input.wallHandstandHold,
        shoulderMobilityConfidence: input.shoulderMobilityConfidence ?? 'moderate',
        hasParallettes: input.hasParallettes ?? false,
        hasFloor: input.hasFloor ?? true,
      })
    
    case 'muscle_up':
      return calculateMuscleUpReadiness({
        maxPullUps: input.maxPullUps ?? 0,
        maxDips: input.maxDips ?? 0,
        chestToBarReps: input.chestToBarReps ?? 0,
        hasExplosivePulls: input.hasExplosivePulls ?? false,
        hasBar: input.hasBar ?? true,
        hasBands: input.hasBands ?? false,
      })
    
    case 'hspu':
      return calculateHSPUReadiness({
        wallHSPUReps: input.wallHSPUReps ?? 0,
        pikeHSPUReps: input.pikeHSPUReps ?? 0,
        maxDips: input.maxDips ?? 0,
        wallHandstandHold: input.wallHandstandHold ?? 0,
        overheadPressStrength: input.overheadPressStrength ?? 'none',
        hasWall: input.hasWall ?? true,
        hasParallettes: input.hasParallettes ?? false,
      })
    
  case 'l_sit':
  return calculateLSitReadiness({
  maxDips: input.maxDips ?? 0,
  hollowHoldTime: input.hollowHoldTime ?? 0,
  toePointQuality: input.toePointQuality ?? 'moderate',
  hipFlexorStrength: input.hipFlexorStrength ?? 'moderate',
  hasParallettes: input.hasParallettes ?? false,
  hasFloor: input.hasFloor ?? true,
  })
  
  case 'v_sit':
  return calculateVSitReadiness({
  maxPushUps: input.maxPushUps ?? 0,
  maxDips: input.maxDips ?? 0,
  lSitHoldTime: input.lSitHoldTime ?? 0,
  hollowHoldTime: input.hollowHoldTime ?? 0,
  pikeCompressionQuality: input.pikeCompressionQuality ?? 'moderate',
  hamstringFlexibility: input.hamstringFlexibility ?? 'moderate',
  hipFlexorStrength: input.hipFlexorStrength ?? 'moderate',
  hasParallettes: input.hasParallettes ?? false,
  hasFloor: input.hasFloor ?? true,
  })
  
  case 'iron_cross':
  return calculateIronCrossReadiness({
  ringSupportHoldTime: input.ringSupportHoldTime ?? 0,
  rtoSupportHoldTime: input.rtoSupportHoldTime ?? 0,
  straightArmStrength: input.straightArmStrength ?? 'none',
  maxDips: input.maxDips ?? 0,
  scapularDepressionStrength: input.scapularDepressionStrength ?? 'weak',
  shoulderStability: input.shoulderStability ?? 'unstable',
  tendonTolerance: input.tendonTolerance ?? 'low',
  hasRings: input.hasRings ?? false,
  assistedCrossHoldTime: input.assistedCrossHoldTime,
  })
  
    case 'dragon_flag':
      return calculateDragonFlagReadiness({
        dragonFlagTuckReps: input.dragonFlagTuckReps ?? 0,
        legRaiseMax: input.legRaiseMax ?? 0,
        abWheelRolloutMax: input.abWheelRolloutMax ?? 0,
        hollowHoldTime: input.hollowHoldTime ?? 0,
        lowerBackMobility: input.lowerBackMobility ?? 'moderate',
      })
    
    case 'one_arm_pull_up':
      // Use weighted pull-up strength as primary indicator
      return calculateOneArmPullUpReadiness({
        maxPullUps: input.maxPullUps ?? 0,
        weightedPullUpLoad: input.weightedPullUpLoad ?? 0,
        archerPullUpReps: input.archerPullUpReps ?? 0,
        hasBar: input.hasBar ?? true,
      })
    
    case 'one_arm_push_up':
      // Use push-up and archer push-up ability
      return calculateOneArmPushUpReadiness({
        maxPushUps: input.maxPushUps ?? 0,
        archerPushUpReps: input.archerPushUpReps ?? 0,
        hollowHoldTime: input.hollowHoldTime ?? 0,
      })
    
    case 'planche_push_up':
      // Requires strong planche hold plus pressing ability
      return calculatePlanchePushUpReadiness({
        plancheLeanHold: input.plancheLeanHold ?? 0,
        pseudoPlanchePushUpReps: input.pseudoPlanchePushUpReps ?? 0,
        tuckPlancheHold: input.tuckPlancheHold ?? 0,
        maxDips: input.maxDips ?? 0,
        wristCircles: input.wristCircles ?? true,
      })
    
    default:
      // Fallback
      return calculateFrontLeverReadiness({
        maxPullUps: input.maxPullUps ?? 0,
        weightedPullUpLoad: input.weightedPullUpLoad ?? 0,
        hollowHoldTime: input.hollowHoldTime ?? 0,
        hasRings: false,
        hasBar: true,
      })
  }
}

function transformToCanonical(
  skill: SkillType,
  raw: ReadinessResult,
  input: AthleteReadinessInput
): CanonicalReadinessResult {
  // Build component scores
  const components = buildComponentScores(skill, raw.breakdown)
  
  // Detect limiting factors
  const { primary, secondary, strong } = detectLimitingFactors(skill, raw.breakdown, raw.limitingFactor)
  
  return {
    skill,
    overallScore: raw.score,
    level: raw.level,
    levelLabel: raw.label,
    components,
    rawBreakdown: raw.breakdown,
    primaryLimiter: primary,
    secondaryLimiter: secondary,
    strongAreas: strong,
    recommendation: raw.recommendation,
    nextProgression: raw.nextProgression,
    limitingFactorExplanation: raw.limitingFactorExplanation,
    suggestedProtocol: raw.suggestedProtocol,
  }
}

function buildComponentScores(skill: SkillType, breakdown: ScoreBreakdown[]): ReadinessComponentScores {
  const mapping = SKILL_COMPONENT_MAPPINGS[skill]
  const scores: ReadinessComponentScores = {
    pullStrength: 50,
    pushStrength: 50,
    compression: 50,
    scapularControl: 50,
    straightArmStrength: 50,
    shoulderStability: 50,
    wristTolerance: 50,
    mobility: 50,
    explosivePower: 50,
    skillSpecific: 50,
  }
  
  // Accumulate scores from breakdown factors
  const componentCounts: Record<string, number> = {}
  const componentTotals: Record<string, number> = {}
  
  for (const item of breakdown) {
    const component = mapping[item.factor]
    if (component) {
      const normalizedScore = (item.score / item.maxScore) * 100
      if (!componentTotals[component]) {
        componentTotals[component] = 0
        componentCounts[component] = 0
      }
      componentTotals[component] += normalizedScore
      componentCounts[component] += 1
    }
  }
  
  // Average scores per component
  for (const [component, total] of Object.entries(componentTotals)) {
    const count = componentCounts[component]
    if (count > 0) {
      scores[component as keyof ReadinessComponentScores] = Math.round(total / count)
    }
  }
  
  return scores
}

function detectLimitingFactors(
  skill: SkillType,
  breakdown: ScoreBreakdown[],
  rawLimitingFactor: string
): {
  primary: LimitingFactor
  secondary: LimitingFactor | null
  strong: LimitingFactor[]
} {
  // Sort by normalized score (lowest first)
  const sorted = [...breakdown]
    .filter(b => b.maxScore > 5) // Exclude equipment factors
    .map(b => ({
      ...b,
      normalized: (b.score / b.maxScore) * 100
    }))
    .sort((a, b) => a.normalized - b.normalized)
  
  const mapping = LIMITING_FACTOR_MAPPINGS[skill]
  
  // Primary limiter from raw result or lowest scored factor
  let primary: LimitingFactor = mapping[rawLimitingFactor] || 'none'
  if (primary === 'none' && sorted.length > 0 && sorted[0].normalized < 70) {
    // Fall back to lowest scored factor
    const lowestFactor = sorted[0].factor
    primary = findLimitingFactorForBreakdown(skill, lowestFactor)
  }
  
  // Secondary limiter (second lowest if below threshold)
  let secondary: LimitingFactor | null = null
  if (sorted.length > 1 && sorted[1].normalized < 70) {
    secondary = findLimitingFactorForBreakdown(skill, sorted[1].factor)
  }
  
  // Strong areas (above 80%)
  const strong: LimitingFactor[] = sorted
    .filter(b => b.normalized >= 80)
    .map(b => findLimitingFactorForBreakdown(skill, b.factor))
    .filter(f => f !== 'none')
  
  return { primary, secondary, strong }
}

function findLimitingFactorForBreakdown(skill: SkillType, factorName: string): LimitingFactor {
  // Direct mapping based on factor name patterns
  const lowerFactor = factorName.toLowerCase()
  
  if (lowerFactor.includes('pull-up') || lowerFactor.includes('pull strength')) {
    return 'pull_strength'
  }
  if (lowerFactor.includes('push-up') || lowerFactor.includes('push strength') || lowerFactor.includes('pike')) {
    return 'push_strength'
  }
  if (lowerFactor.includes('dip')) {
    return skill === 'muscle_up' ? 'push_strength' : 'push_strength'
  }
  if (lowerFactor.includes('weighted')) {
    return skill === 'front_lever' ? 'straight_arm_pull_strength' : 'pull_strength'
  }
  if (lowerFactor.includes('core') || lowerFactor.includes('hollow') || lowerFactor.includes('compression')) {
    return 'compression_strength'
  }
  if (lowerFactor.includes('lean') || lowerFactor.includes('shoulder load')) {
    return 'straight_arm_push_strength'
  }
  if (lowerFactor.includes('chest-to-bar') || lowerFactor.includes('explosive')) {
    return 'explosive_pull_power'
  }
  if (lowerFactor.includes('handstand') || lowerFactor.includes('overhead')) {
    return 'shoulder_stability'
  }
  if (lowerFactor.includes('mobility')) {
    return 'mobility'
  }
  if (lowerFactor.includes('german hang') || lowerFactor.includes('skin the cat')) {
    return 'shoulder_extension_mobility'
  }
  if (lowerFactor.includes('tuck') || lowerFactor.includes('lever') || lowerFactor.includes('experience')) {
    return 'skill_coordination'
  }
  if (lowerFactor.includes('hip flexor')) {
    return 'compression_strength'
  }
  if (lowerFactor.includes('wall hspu')) {
    return 'vertical_push_strength'
  }
  
  return 'none'
}

// =============================================================================
// EXPORT LEGACY COMPATIBLE FUNCTION
// =============================================================================

/**
 * Legacy-compatible function for existing consumers
 * Returns format expected by readiness-calculation-service
 */
export function calculateSkillReadinessLegacy(
  skill: string,
  profile: {
    pullUpMax?: number | null
    dipMax?: number | null
    pushUpMax?: number | null
    hollowHoldTime?: number | null
    experienceLevel?: string
    equipment?: string[]
  }
): {
  overallScore: number
  pullStrengthScore: number
  compressionScore: number
  scapularControlScore: number
  straightArmScore: number
  mobilityScore: number
  limitingFactor: string
  level: ReadinessLevel
  recommendation: string
} | null {
  if (!['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit'].includes(skill)) {
    return null
  }
  
  const canonical = calculateReadinessFromProfile(skill as SkillType, profile)
  
  return {
    overallScore: canonical.overallScore,
    pullStrengthScore: canonical.components.pullStrength,
    compressionScore: canonical.components.compression,
    scapularControlScore: canonical.components.scapularControl,
    straightArmScore: canonical.components.straightArmStrength,
    mobilityScore: canonical.components.mobility,
    limitingFactor: canonical.primaryLimiter,
    level: canonical.level,
    recommendation: canonical.recommendation,
  }
}

// =============================================================================
// EXPLANATION GENERATORS
// =============================================================================

/**
 * Generate a coaching explanation for the primary limiter
 */
export function getLimiterExplanation(skill: SkillType, limiter: LimitingFactor): string {
  const skillLabel = skill.replace(/_/g, ' ')
  const limiterLabel = LIMITING_FACTOR_LABELS[limiter]
  
  const explanations: Record<LimitingFactor, string> = {
    pull_strength: `${limiterLabel} is your current limiter for ${skillLabel}. Focus on building your pull-up base and weighted pulling capacity.`,
    push_strength: `${limiterLabel} needs development for ${skillLabel} progress. Prioritize dips and push-up variations.`,
    straight_arm_pull_strength: `${limiterLabel} is limiting your ${skillLabel}. Work on front lever rows, negatives, and weighted pulling.`,
    straight_arm_push_strength: `${limiterLabel} needs work for ${skillLabel}. Focus on planche leans and pseudo planche push-ups.`,
    compression_strength: `${limiterLabel} is your weak point for ${skillLabel}. Prioritize hollow body holds and compression work.`,
    core_control: `${limiterLabel} needs attention for ${skillLabel}. Include more anti-extension and hollow body work.`,
    scapular_control: `${limiterLabel} is limiting ${skillLabel} progress. Work on scapular pull-ups and retraction exercises.`,
    shoulder_stability: `${limiterLabel} needs development for ${skillLabel}. Include stability drills and controlled progressions.`,
    wrist_tolerance: `${limiterLabel} is a limiting factor. Prioritize wrist conditioning before progressing.`,
    explosive_pull_power: `${limiterLabel} needs work for ${skillLabel}. Practice high pulls and explosive pulling drills.`,
    transition_strength: `${limiterLabel} is your current limiter. Focus on transition-specific drills and negatives.`,
    vertical_push_strength: `${limiterLabel} is limiting ${skillLabel}. Work on pike push-ups and wall HSPU progressions.`,
    mobility: `${limiterLabel} limitations are affecting ${skillLabel}. Include mobility work in your routine.`,
    shoulder_extension_mobility: `${limiterLabel} is limiting ${skillLabel}. Work on german hangs and skin the cats.`,
    skill_coordination: `${limiterLabel} can improve through consistent practice at your current progression level.`,
    balance_control: `${limiterLabel} needs development. Practice wall-assisted work and balance drills.`,
    tendon_tolerance: `${limiterLabel} is currently limiting ${skillLabel}. Build slowly with isometric holds, tempo reps, and longer adaptation periods to develop connective-tissue resilience before increasing intensity.`,
    ring_support_stability: `${limiterLabel} is your current limiter for ${skillLabel}. Prioritize ring support holds, dip negatives on rings, and shoulder-position control drills.`,
    none: `You have solid readiness across all components for ${skillLabel}. Focus on skill practice.`,
  }
  
  return explanations[limiter] || `Continue working on your ${skillLabel} foundations.`
}

/**
 * Generate a summary statement for coaching displays
 */
export function getReadinessSummary(result: CanonicalReadinessResult): string {
  const skillLabel = result.skill.replace(/_/g, ' ')
  
  if (result.overallScore >= 85) {
    return `You have strong readiness for ${skillLabel} progressions. ${result.recommendation}`
  } else if (result.overallScore >= 70) {
    return `Good ${skillLabel} readiness with room to grow. ${LIMITING_FACTOR_LABELS[result.primaryLimiter]} is your current focus area.`
  } else if (result.overallScore >= 50) {
    return `Developing ${skillLabel} readiness. ${LIMITING_FACTOR_LABELS[result.primaryLimiter]} needs priority attention.`
  } else {
    return `Building foundations for ${skillLabel}. Focus on ${LIMITING_FACTOR_LABELS[result.primaryLimiter]} to accelerate progress.`
  }
}

// =============================================================================
// WORKOUT REASONING SUMMARY
// =============================================================================

/**
 * Unified workout reasoning summary that explains WHY a workout was generated.
 * This is the single source of truth for workout explanations across the app.
 * 
 * Produced during program generation by combining:
 * - Skill readiness state
 * - Constraint detection results  
 * - Performance envelope data
 * - Selected coaching framework
 */
export interface WorkoutReasoningSummary {
  // Core readiness state
  skillReadiness: {
    primarySkill: string
    readinessScore: number
    readinessLevel: ReadinessLevel
    trend: 'improving' | 'stable' | 'declining' | 'unknown'
  }
  
  // Primary and secondary limiters
  primaryLimiter: {
    factor: LimitingFactor
    label: string
    score: number // 0-100, how much this is limiting
    explanation: string
  }
  secondaryLimiter: {
    factor: LimitingFactor
    label: string
    score: number
    explanation: string
  } | null
  
  // Framework and envelope influence
  frameworkInfluence: {
    frameworkId: string
    frameworkName: string
    influence: string // Short description of how framework affected workout
  } | null
  
  envelopeInfluence: {
    confidenceLevel: 'low' | 'moderate' | 'high'
    adaptations: string[] // List of envelope-driven adaptations
  } | null
  
  constraintInfluence: {
    activeConstraints: string[]
    protocolsAdded: string[]
  } | null
  
  // The main explanation - concise, coach-like
  whyThisWorkout: string
  
  // Supporting details for optional display
  workoutFocus: string // e.g., "Horizontal Pulling Strength"
  sessionType: 'skill' | 'strength' | 'mixed' | 'deload' | 'recovery'
  keyExerciseReasons: Array<{
    exerciseName: string
    reason: string
    skillConnection?: string
  }>
  
  // Confidence in the reasoning
  reasoningConfidence: 'low' | 'moderate' | 'high'
  dataQuality: 'sparse' | 'developing' | 'solid'
}

/**
 * Generate the "Why This Workout" explanation
 * This is the primary user-facing summary
 */
export function generateWhyThisWorkout(
  primaryLimiter: LimitingFactor,
  primarySkill: string,
  sessionType: WorkoutReasoningSummary['sessionType'],
  frameworkName?: string
): string {
  const limiterLabel = LIMITING_FACTOR_LABELS[primaryLimiter]
  const skillLabel = formatSkillLabel(primarySkill)
  
  // Session type specific templates
  if (sessionType === 'deload') {
    return 'This is a recovery-focused session to reduce accumulated fatigue and prepare for your next training block.'
  }
  
  if (sessionType === 'recovery') {
    return 'Light mobility and technique work to support recovery while maintaining movement quality.'
  }
  
  // Limiter-focused explanations
  const limiterTemplates: Partial<Record<LimitingFactor, string>> = {
    pull_strength: `Your current limiter is ${limiterLabel.toLowerCase()}, so this workout prioritizes weighted pulling and vertical pull development to support your ${skillLabel} progress.`,
    straight_arm_pull_strength: `${limiterLabel} is your primary bottleneck for ${skillLabel}. This session focuses on straight-arm pulling and front lever progressions.`,
    straight_arm_push_strength: `${limiterLabel} limits your ${skillLabel}. Today's workout prioritizes planche leans and straight-arm pushing work.`,
    compression_strength: `This session focuses on ${limiterLabel.toLowerCase()} to support your ${skillLabel} progression. Expect hollow body work and compression drills.`,
    scapular_control: `${limiterLabel} is key for ${skillLabel}. This workout includes scapular-focused pulling and stability work.`,
    shoulder_stability: `Building ${limiterLabel.toLowerCase()} for ${skillLabel}. This session includes controlled stability progressions.`,
    explosive_pull_power: `${limiterLabel} is your limiter for ${skillLabel}. This workout includes high pulls and explosive pulling drills.`,
    transition_strength: `${limiterLabel} is holding back your muscle-up. This session targets transition-specific strength development.`,
    vertical_push_strength: `Building ${limiterLabel.toLowerCase()} for HSPU progress. Today's workout prioritizes pike work and overhead pressing.`,
    wrist_tolerance: `Wrist conditioning is prioritized to safely progress your ${skillLabel} work.`,
    balance_control: `Balance and control work to support your handstand and ${skillLabel} progress.`,
    none: `Strong readiness across all components. This session maintains progress while building skill consistency.`,
  }
  
  const baseExplanation = limiterTemplates[primaryLimiter] || 
    `This workout targets ${limiterLabel.toLowerCase()} to support your ${skillLabel} development.`
  
  // Add framework context if present
  if (frameworkName) {
    return `${baseExplanation} Structured using ${frameworkName} principles.`
  }
  
  return baseExplanation
}

/**
 * Generate exercise-specific reasons for knowledge bubbles
 */
export function generateExerciseReason(
  exerciseId: string,
  primaryLimiter: LimitingFactor,
  primarySkill: string
): { reason: string; skillConnection?: string } {
  const skillLabel = formatSkillLabel(primarySkill)
  
  // Exercise-specific reasons mapped to limiters and skills
  const exerciseReasons: Record<string, { reason: string; skills?: string[] }> = {
    // Pulling exercises
    weighted_pull_up: {
      reason: 'Builds foundational pulling strength required for advanced skills.',
      skills: ['front_lever', 'muscle_up', 'one_arm_pull_up'],
    },
    front_lever_row: {
      reason: 'Develops horizontal pulling strength with direct front lever carryover.',
      skills: ['front_lever'],
    },
    chest_to_bar_pull_up: {
      reason: 'Builds the high-pull strength needed for muscle-up transitions.',
      skills: ['muscle_up', 'ring_muscle_up'],
    },
    archer_pull_up: {
      reason: 'Develops unilateral pulling strength toward one-arm pull-up.',
      skills: ['one_arm_pull_up', 'muscle_up'],
    },
    
    // Pushing exercises
    weighted_dip: {
      reason: 'Builds foundational pushing strength for planche and pressing skills.',
      skills: ['planche', 'handstand_pushup'],
    },
    ring_dip: {
      reason: 'Develops shoulder stability and control for ring work.',
      skills: ['planche', 'iron_cross', 'ring_muscle_up'],
    },
    pseudo_planche_pushup: {
      reason: 'Develops forward lean strength and shoulder conditioning for planche.',
      skills: ['planche'],
    },
    pike_push_up: {
      reason: 'Foundation for vertical pressing toward handstand push-up.',
      skills: ['handstand_pushup'],
    },
    wall_hspu: {
      reason: 'Builds overhead pressing strength with wall support.',
      skills: ['handstand_pushup', 'freestanding_hspu'],
    },
    
    // Core exercises
    hollow_body_hold: {
      reason: 'Develops core tension and body line control for skill work.',
      skills: ['front_lever', 'planche', 'l_sit'],
    },
    hanging_leg_raise: {
      reason: 'Improves compression strength for L-sit and lever progressions.',
      skills: ['l_sit', 'front_lever', 'v_sit'],
    },
    l_sit_hold: {
      reason: 'Builds compression strength and shoulder depression control.',
      skills: ['l_sit', 'v_sit', 'manna'],
    },
    
    // Support exercises
    ring_support_hold: {
      reason: 'Builds shoulder stability required for ring-based skills.',
      skills: ['ring_muscle_up', 'iron_cross', 'ring_dip'],
    },
    rto_support: {
      reason: 'Advanced shoulder stability for ring strength progressions.',
      skills: ['iron_cross', 'planche'],
    },
    scapular_pull_up: {
      reason: 'Develops scapular control and strength for pulling skills.',
      skills: ['front_lever', 'muscle_up'],
    },
    
    // Skill work
    tuck_front_lever: {
      reason: 'Progressive overload at your current front lever stage.',
      skills: ['front_lever'],
    },
    adv_tuck_front_lever: {
      reason: 'Intermediate front lever progression building toward straddle.',
      skills: ['front_lever'],
    },
    tuck_planche: {
      reason: 'Progressive overload at your current planche stage.',
      skills: ['planche'],
    },
    straddle_planche: {
      reason: 'Advanced planche progression toward full planche.',
      skills: ['planche'],
    },
  }
  
  const exerciseData = exerciseReasons[exerciseId]
  
  if (exerciseData) {
    const hasSkillConnection = exerciseData.skills?.includes(primarySkill)
    return {
      reason: exerciseData.reason,
      skillConnection: hasSkillConnection ? `Directly supports ${skillLabel} development.` : undefined,
    }
  }
  
  // Fallback based on limiter
  const limiterBasedReason = generateLimiterBasedExerciseReason(exerciseId, primaryLimiter)
  return { reason: limiterBasedReason }
}

function generateLimiterBasedExerciseReason(exerciseId: string, limiter: LimitingFactor): string {
  const limiterLabel = LIMITING_FACTOR_LABELS[limiter]
  
  // Check exercise category from name
  if (exerciseId.includes('pull') || exerciseId.includes('row')) {
    return `Builds pulling strength to address ${limiterLabel.toLowerCase()} limitations.`
  }
  if (exerciseId.includes('dip') || exerciseId.includes('push')) {
    return `Develops pushing strength supporting your current training focus.`
  }
  if (exerciseId.includes('hold') || exerciseId.includes('hollow')) {
    return `Builds core control and body tension for skill work.`
  }
  if (exerciseId.includes('support') || exerciseId.includes('ring')) {
    return `Develops shoulder stability required for skill progressions.`
  }
  
  return 'Supports your current training goals.'
}

function formatSkillLabel(skill: string): string {
  return skill
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Build a complete WorkoutReasoningSummary
 * This is the main function called during program generation
 */
export function buildWorkoutReasoningSummary(
  readinessResult: CanonicalReadinessResult | null,
  constraintData: {
    primaryConstraint?: string
    secondaryConstraint?: string
    protocolsAdded?: string[]
  } | null,
  frameworkData: {
    frameworkId: string
    frameworkName: string
  } | null,
  envelopeData: {
    confidence: number
    adaptations?: string[]
  } | null,
  sessionType: WorkoutReasoningSummary['sessionType'] = 'mixed',
  exercises: Array<{ id: string; name: string }> = []
): WorkoutReasoningSummary {
  // Determine primary skill and limiter
  const primarySkill = readinessResult?.skill || 'general'
  const primaryLimiter: LimitingFactor = readinessResult?.primaryLimiter || 'none'
  const secondaryLimiter = readinessResult?.secondaryLimiter || null
  
  // Calculate data quality
  const hasReadiness = !!readinessResult && readinessResult.overallScore > 0
  const hasEnvelope = !!envelopeData && envelopeData.confidence > 0.3
  const hasFramework = !!frameworkData
  const dataQuality: WorkoutReasoningSummary['dataQuality'] = 
    hasReadiness && hasEnvelope ? 'solid' :
    hasReadiness || hasEnvelope ? 'developing' : 'sparse'
  
  // Calculate reasoning confidence
  const reasoningConfidence: WorkoutReasoningSummary['reasoningConfidence'] =
    dataQuality === 'solid' && hasFramework ? 'high' :
    dataQuality === 'developing' ? 'moderate' : 'low'
  
  // Build exercise reasons
  const keyExerciseReasons = exercises.slice(0, 5).map(ex => {
    const { reason, skillConnection } = generateExerciseReason(ex.id, primaryLimiter, primarySkill)
    return {
      exerciseName: ex.name,
      reason,
      skillConnection,
    }
  })
  
  // Generate the main explanation
  const whyThisWorkout = generateWhyThisWorkout(
    primaryLimiter,
    primarySkill,
    sessionType,
    frameworkData?.frameworkName
  )
  
  // Build workout focus label
  const workoutFocus = LIMITING_FACTOR_LABELS[primaryLimiter] !== 'No Limiting Factor'
    ? LIMITING_FACTOR_LABELS[primaryLimiter]
    : sessionType === 'skill' ? 'Skill Practice'
    : sessionType === 'strength' ? 'Strength Development'
    : 'Balanced Training'
  
  return {
    skillReadiness: {
      primarySkill,
      readinessScore: readinessResult?.overallScore || 0,
      readinessLevel: readinessResult?.level || 'Building',
      trend: 'unknown', // Would come from skill state service
    },
    primaryLimiter: {
      factor: primaryLimiter,
      label: LIMITING_FACTOR_LABELS[primaryLimiter],
      score: readinessResult?.components 
        ? 100 - Math.min(...Object.values(readinessResult.components))
        : 0,
      explanation: readinessResult 
        ? getLimiterExplanation(readinessResult.skill, primaryLimiter)
        : 'Continue building your training foundation.',
    },
    secondaryLimiter: secondaryLimiter ? {
      factor: secondaryLimiter,
      label: LIMITING_FACTOR_LABELS[secondaryLimiter],
      score: 50,
      explanation: readinessResult
        ? getLimiterExplanation(readinessResult.skill, secondaryLimiter)
        : '',
    } : null,
    frameworkInfluence: frameworkData ? {
      frameworkId: frameworkData.frameworkId,
      frameworkName: frameworkData.frameworkName,
      influence: `Workout structured using ${frameworkData.frameworkName} principles.`,
    } : null,
    envelopeInfluence: envelopeData && envelopeData.confidence > 0.3 ? {
      confidenceLevel: envelopeData.confidence >= 0.7 ? 'high' : 
                       envelopeData.confidence >= 0.4 ? 'moderate' : 'low',
      adaptations: envelopeData.adaptations || [],
    } : null,
    constraintInfluence: constraintData?.primaryConstraint ? {
      activeConstraints: [
        constraintData.primaryConstraint,
        ...(constraintData.secondaryConstraint ? [constraintData.secondaryConstraint] : []),
      ],
      protocolsAdded: constraintData.protocolsAdded || [],
    } : null,
    whyThisWorkout,
    workoutFocus,
    sessionType,
    keyExerciseReasons,
    reasoningConfidence,
    dataQuality,
  }
}
