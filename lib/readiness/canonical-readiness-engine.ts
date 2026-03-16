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
  type ReadinessResult,
  type ReadinessLevel,
  type ScoreBreakdown,
} from './skill-readiness'

// =============================================================================
// UNIFIED READINESS OUTPUT TYPES
// =============================================================================

export type SkillType = 'front_lever' | 'back_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit'

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
  hipFlexorStrength?: 'weak' | 'moderate' | 'strong'
  
  // Equipment
  equipment?: string[]
  hasRings?: boolean
  hasBar?: boolean
  hasParallettes?: boolean
  hasFloor?: boolean
  hasWall?: boolean
  hasBands?: boolean
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
  const skills: SkillType[] = ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit']
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
