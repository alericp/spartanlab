/**
 * Skill Readiness Service
 * 
 * Clean service layer for public SEO calculators and AI engine integration.
 * Works without authentication for public calculator pages.
 * Integrates with existing readiness systems for logged-in users.
 * 
 * Supported Skills:
 * - Front Lever
 * - Back Lever
 * - Planche
 * - Muscle-Up
 * - HSPU (Handstand Push-Up)
 * - L-Sit
 * - V-Sit
 * - Iron Cross
 */

import {
  calculateCanonicalReadiness,
  type SkillType,
  type CanonicalReadinessResult,
  type AthleteReadinessInput,
  type LimitingFactor,
  LIMITING_FACTOR_LABELS,
} from '../readiness/canonical-readiness-engine'

// =============================================================================
// PUBLIC INPUT TYPES (For SEO Calculator Pages)
// =============================================================================

/**
 * Unified input for public calculator pages
 * All fields optional to support partial input scenarios
 */
export interface SkillReadinessInput {
  // Body metrics
  heightCm?: number
  weightKg?: number
  bodyFatPercent?: number
  
  // Pulling metrics
  pullups?: number
  weightedPullupKg?: number
  chestToBarReps?: number
  
  // Pushing metrics
  pushups?: number
  dips?: number
  weightedDipKg?: number
  
  // Core/Compression metrics
  hollowHoldSeconds?: number
  lSitHoldSeconds?: number
  
  // Skill-specific metrics
  plancheLeanSeconds?: number
  tuckFrontLeverSeconds?: number
  tuckBackLeverSeconds?: number
  wallHandstandSeconds?: number
  wallHSPUReps?: number
  pikeHSPUReps?: number
  
  // V-Sit specific
  pikeCompressionQuality?: 'poor' | 'moderate' | 'good' | 'excellent'
  hamstringFlexibility?: 'poor' | 'moderate' | 'good' | 'excellent'
  hipFlexorStrength?: 'weak' | 'moderate' | 'strong' | 'very_strong'
  
  // Iron Cross specific
  ringSupportSeconds?: number
  rtoSupportSeconds?: number
  straightArmStrength?: 'none' | 'basic' | 'intermediate' | 'advanced'
  scapularDepressionStrength?: 'weak' | 'moderate' | 'strong'
  shoulderStability?: 'unstable' | 'moderate' | 'stable' | 'very_stable'
  tendonTolerance?: 'low' | 'moderate' | 'high'
  
  // Mobility
  shoulderMobility?: 'poor' | 'moderate' | 'good' | 'excellent'
  germanHangSeconds?: number
  canSkinTheCat?: boolean
  
  // Equipment access
  hasRings?: boolean
  hasBar?: boolean
  hasParallettes?: boolean
  hasBands?: boolean
}

/**
 * Simplified result for public calculator pages
 */
export interface SkillReadinessResult {
  skill: SkillType
  readinessScore: number // 0-100
  classification: ReadinessClassification
  limitingFactors: LimitingFactorDetail[]
  recommendedNextFocus: string[]
  estimatedProgressionStage: ProgressionStage
  explanation: string
  breakdown: ComponentBreakdown[]
}

export type ReadinessClassification = 
  | 'Beginner'
  | 'Developing' 
  | 'Nearly Ready'
  | 'Ready'
  | 'Advanced'

export type ProgressionStage =
  | 'Foundation Building'
  | 'Early Progression'
  | 'Intermediate Progression'
  | 'Advanced Ready'
  | 'Mastery Phase'

export interface LimitingFactorDetail {
  factor: string
  severity: 'critical' | 'moderate' | 'minor'
  explanation: string
  recommendation: string
}

export interface ComponentBreakdown {
  name: string
  score: number // 0-100
  maxScore: number
  status: 'weak' | 'developing' | 'adequate' | 'strong'
}

// =============================================================================
// SKILL PREREQUISITE DATABASE
// =============================================================================

export interface SkillPrerequisites {
  skill: SkillType
  displayName: string
  description: string
  requiredMetrics: {
    name: string
    baselineTarget: number | string
    unit: string
    importance: 'critical' | 'high' | 'medium'
  }[]
  strengthIndicators: string[]
  mobilityIndicators: string[]
  compressionIndicators: string[]
  tendonIndicators?: string[]
}

export const SKILL_PREREQUISITES: Record<SkillType, SkillPrerequisites> = {
  front_lever: {
    skill: 'front_lever',
    displayName: 'Front Lever',
    description: 'Horizontal hold with body facing upward, requiring extreme pulling strength and core tension.',
    requiredMetrics: [
      { name: 'Pull-ups', baselineTarget: 15, unit: 'reps', importance: 'critical' },
      { name: 'Weighted Pull-up', baselineTarget: 25, unit: 'kg added', importance: 'high' },
      { name: 'Hollow Hold', baselineTarget: 45, unit: 'seconds', importance: 'high' },
      { name: 'Tuck Front Lever', baselineTarget: 15, unit: 'seconds', importance: 'medium' },
    ],
    strengthIndicators: ['Pull-up strength', 'Lat strength', 'Grip endurance'],
    mobilityIndicators: ['Shoulder mobility'],
    compressionIndicators: ['Hollow body tension', 'Core compression'],
  },
  
  back_lever: {
    skill: 'back_lever',
    displayName: 'Back Lever',
    description: 'Horizontal hold with body facing downward, requiring shoulder extension mobility and pulling strength.',
    requiredMetrics: [
      { name: 'Pull-ups', baselineTarget: 12, unit: 'reps', importance: 'critical' },
      { name: 'German Hang', baselineTarget: 30, unit: 'seconds', importance: 'critical' },
      { name: 'Skin the Cat', baselineTarget: 'comfortable', unit: '', importance: 'high' },
      { name: 'Tuck Back Lever', baselineTarget: 15, unit: 'seconds', importance: 'medium' },
    ],
    strengthIndicators: ['Pull-up strength', 'Bicep tendon strength'],
    mobilityIndicators: ['Shoulder extension', 'German hang capacity'],
    compressionIndicators: ['Core tension'],
  },
  
  planche: {
    skill: 'planche',
    displayName: 'Planche',
    description: 'Horizontal hold facing downward supported only by hands, requiring extreme pushing strength.',
    requiredMetrics: [
      { name: 'Dips', baselineTarget: 20, unit: 'reps', importance: 'critical' },
      { name: 'Push-ups', baselineTarget: 40, unit: 'reps', importance: 'high' },
      { name: 'Planche Lean', baselineTarget: 45, unit: 'seconds', importance: 'critical' },
      { name: 'Wall Handstand', baselineTarget: 45, unit: 'seconds', importance: 'medium' },
    ],
    strengthIndicators: ['Dip strength', 'Shoulder protraction', 'Wrist strength'],
    mobilityIndicators: ['Shoulder mobility', 'Wrist extension'],
    compressionIndicators: ['Core compression', 'Posterior pelvic tilt'],
    tendonIndicators: ['Wrist tolerance', 'Elbow tolerance'],
  },
  
  muscle_up: {
    skill: 'muscle_up',
    displayName: 'Muscle-Up',
    description: 'Dynamic transition from below the bar to support above, combining pull and push.',
    requiredMetrics: [
      { name: 'Pull-ups', baselineTarget: 12, unit: 'reps', importance: 'critical' },
      { name: 'Dips', baselineTarget: 15, unit: 'reps', importance: 'critical' },
      { name: 'Chest-to-Bar', baselineTarget: 5, unit: 'reps', importance: 'high' },
      { name: 'Explosive Pulls', baselineTarget: 'yes', unit: '', importance: 'high' },
    ],
    strengthIndicators: ['Pulling power', 'Dip strength', 'Transition strength'],
    mobilityIndicators: ['Shoulder mobility'],
    compressionIndicators: ['Kipping ability'],
  },
  
  hspu: {
    skill: 'hspu',
    displayName: 'Handstand Push-Up',
    description: 'Vertical pressing from handstand position, requiring shoulder strength and balance.',
    requiredMetrics: [
      { name: 'Wall HSPU', baselineTarget: 5, unit: 'reps', importance: 'critical' },
      { name: 'Pike Push-ups', baselineTarget: 15, unit: 'reps', importance: 'high' },
      { name: 'Wall Handstand', baselineTarget: 60, unit: 'seconds', importance: 'high' },
      { name: 'Dips', baselineTarget: 15, unit: 'reps', importance: 'medium' },
    ],
    strengthIndicators: ['Overhead pressing', 'Shoulder strength', 'Tricep strength'],
    mobilityIndicators: ['Shoulder flexion', 'Wrist mobility'],
    compressionIndicators: ['Balance control'],
  },
  
  l_sit: {
    skill: 'l_sit',
    displayName: 'L-Sit',
    description: 'Static hold with legs horizontal, requiring hip flexor strength and compression.',
    requiredMetrics: [
      { name: 'Dips', baselineTarget: 12, unit: 'reps', importance: 'high' },
      { name: 'Hollow Hold', baselineTarget: 45, unit: 'seconds', importance: 'critical' },
      { name: 'Hip Flexor Strength', baselineTarget: 'moderate', unit: '', importance: 'critical' },
    ],
    strengthIndicators: ['Dip support strength', 'Hip flexor strength'],
    mobilityIndicators: ['Hamstring flexibility'],
    compressionIndicators: ['Core compression', 'Hip flexor engagement'],
  },
  
  v_sit: {
    skill: 'v_sit',
    displayName: 'V-Sit',
    description: 'Advanced compression hold with legs elevated above horizontal, building on L-sit.',
    requiredMetrics: [
      { name: 'L-Sit Hold', baselineTarget: 20, unit: 'seconds', importance: 'critical' },
      { name: 'Pike Compression', baselineTarget: 'good', unit: '', importance: 'critical' },
      { name: 'Hip Flexor Strength', baselineTarget: 'strong', unit: '', importance: 'critical' },
      { name: 'Hamstring Flexibility', baselineTarget: 'good', unit: '', importance: 'high' },
    ],
    strengthIndicators: ['Hip flexor strength', 'Core compression strength'],
    mobilityIndicators: ['Hamstring flexibility', 'Pike mobility'],
    compressionIndicators: ['Active pike compression', 'Core control'],
  },
  
  iron_cross: {
    skill: 'iron_cross',
    displayName: 'Iron Cross',
    description: 'Elite rings position with arms straight out horizontally, requiring years of preparation.',
    requiredMetrics: [
      { name: 'Ring Support', baselineTarget: 60, unit: 'seconds', importance: 'critical' },
      { name: 'RTO Support', baselineTarget: 30, unit: 'seconds', importance: 'critical' },
      { name: 'Dips', baselineTarget: 25, unit: 'reps', importance: 'high' },
      { name: 'Tendon Tolerance', baselineTarget: 'high', unit: '', importance: 'critical' },
    ],
    strengthIndicators: ['Ring support strength', 'Scapular depression', 'Straight-arm strength'],
    mobilityIndicators: ['Shoulder stability'],
    compressionIndicators: ['Core tension'],
    tendonIndicators: ['Bicep tendon tolerance', 'Elbow tolerance', 'Shoulder tolerance'],
  },
}

// =============================================================================
// CORE SERVICE FUNCTIONS
// =============================================================================

/**
 * Calculate skill readiness from public input
 * Works without authentication for SEO calculator pages
 */
export function calculateSkillReadiness(
  skill: SkillType,
  input: SkillReadinessInput
): SkillReadinessResult {
  // Convert public input to canonical input format
  const canonicalInput = mapToCanonicalInput(input)
  
  // Calculate using canonical engine
  const canonical = calculateCanonicalReadiness(skill, canonicalInput)
  
  // Transform to public result format
  return transformToPublicResult(canonical)
}

/**
 * Get prerequisites for a specific skill
 */
export function getSkillPrerequisites(skill: SkillType): SkillPrerequisites {
  return SKILL_PREREQUISITES[skill]
}

/**
 * Get all supported skills
 */
export function getSupportedSkills(): SkillType[] {
  return Object.keys(SKILL_PREREQUISITES) as SkillType[]
}

/**
 * Interpret a readiness score into classification
 */
export function interpretReadinessScore(score: number): {
  classification: ReadinessClassification
  stage: ProgressionStage
  summary: string
} {
  if (score >= 85) {
    return {
      classification: 'Advanced',
      stage: 'Mastery Phase',
      summary: 'You have the strength foundation for advanced work on this skill.',
    }
  } else if (score >= 70) {
    return {
      classification: 'Ready',
      stage: 'Advanced Ready',
      summary: 'You are ready to begin dedicated training for this skill.',
    }
  } else if (score >= 50) {
    return {
      classification: 'Nearly Ready',
      stage: 'Intermediate Progression',
      summary: 'You are close to readiness. Continue building specific prerequisites.',
    }
  } else if (score >= 30) {
    return {
      classification: 'Developing',
      stage: 'Early Progression',
      summary: 'You are making progress. Focus on the identified weak points.',
    }
  } else {
    return {
      classification: 'Beginner',
      stage: 'Foundation Building',
      summary: 'Build your foundation first before attempting this skill.',
    }
  }
}

/**
 * Get recommended focus areas based on limiting factors
 */
export function getRecommendedFocus(limiters: LimitingFactor[]): string[] {
  const recommendations: string[] = []
  
  for (const limiter of limiters) {
    switch (limiter) {
      case 'pull_strength':
        recommendations.push('Increase pull-up volume and weighted pull-up strength')
        break
      case 'push_strength':
        recommendations.push('Build dip strength and push-up endurance')
        break
      case 'straight_arm_pull_strength':
        recommendations.push('Add front lever progressions and straight-arm rows')
        break
      case 'straight_arm_push_strength':
        recommendations.push('Develop planche leans and pseudo planche push-ups')
        break
      case 'compression_strength':
        recommendations.push('Train active pike compression and hollow body holds')
        break
      case 'core_control':
        recommendations.push('Focus on hollow holds and core tension drills')
        break
      case 'scapular_control':
        recommendations.push('Add scapular pulls and active hangs')
        break
      case 'shoulder_stability':
        recommendations.push('Build shoulder stability through support holds')
        break
      case 'wrist_tolerance':
        recommendations.push('Prioritize wrist conditioning and mobility')
        break
      case 'explosive_pull_power':
        recommendations.push('Train explosive high pulls and chest-to-bar work')
        break
      case 'mobility':
        recommendations.push('Improve flexibility through dedicated stretching')
        break
      case 'shoulder_extension_mobility':
        recommendations.push('Work on german hangs and shoulder extension stretches')
        break
      case 'tendon_tolerance':
        recommendations.push('Build tendon conditioning gradually over time')
        break
      case 'ring_support_stability':
        recommendations.push('Accumulate ring support time with RTO progression')
        break
      default:
        // No specific recommendation for this limiter
        break
    }
  }
  
  return recommendations.slice(0, 3) // Return top 3 recommendations
}

// =============================================================================
// INTERNAL TRANSFORMATION FUNCTIONS
// =============================================================================

function mapToCanonicalInput(input: SkillReadinessInput): AthleteReadinessInput {
  return {
    // Pull metrics
    maxPullUps: input.pullups,
    weightedPullUpLoad: input.weightedPullupKg ? input.weightedPullupKg * 2.2 : undefined, // Convert to lbs
    chestToBarReps: input.chestToBarReps,
    
    // Push metrics
    maxPushUps: input.pushups,
    maxDips: input.dips,
    
    // Core metrics
    hollowHoldTime: input.hollowHoldSeconds,
    
    // Skill-specific metrics
    plancheLeanHold: input.plancheLeanSeconds,
    tuckFrontLeverHold: input.tuckFrontLeverSeconds,
    tuckBackLeverHold: input.tuckBackLeverSeconds,
    wallHandstandHold: input.wallHandstandSeconds,
    wallHSPUReps: input.wallHSPUReps,
    pikeHSPUReps: input.pikeHSPUReps,
    
    // V-Sit specific
    lSitHoldTime: input.lSitHoldSeconds,
    pikeCompressionQuality: input.pikeCompressionQuality,
    hamstringFlexibility: input.hamstringFlexibility,
    hipFlexorStrength: input.hipFlexorStrength === 'very_strong' ? 'strong' : input.hipFlexorStrength,
    
    // Iron Cross specific
    ringSupportHoldTime: input.ringSupportSeconds,
    rtoSupportHoldTime: input.rtoSupportSeconds,
    straightArmStrength: input.straightArmStrength,
    scapularDepressionStrength: input.scapularDepressionStrength,
    shoulderStability: input.shoulderStability,
    tendonTolerance: input.tendonTolerance,
    
    // Mobility
    shoulderMobilityConfidence: input.shoulderMobility,
    germanHangTime: input.germanHangSeconds,
    canSkinTheCat: input.canSkinTheCat,
    
    // Equipment
    hasRings: input.hasRings,
    hasBar: input.hasBar,
    hasParallettes: input.hasParallettes,
    hasBands: input.hasBands,
    hasFloor: true,
    hasWall: true,
  }
}

function transformToPublicResult(canonical: CanonicalReadinessResult): SkillReadinessResult {
  const interpretation = interpretReadinessScore(canonical.overallScore)
  const primaryLimiterLabel = LIMITING_FACTOR_LABELS[canonical.primaryLimiter] || 'General Preparedness'
  
  // Build limiting factors list
  const limitingFactors: LimitingFactorDetail[] = []
  
  if (canonical.primaryLimiter !== 'none') {
    limitingFactors.push({
      factor: primaryLimiterLabel,
      severity: canonical.overallScore < 30 ? 'critical' : canonical.overallScore < 60 ? 'moderate' : 'minor',
      explanation: canonical.limitingFactorExplanation,
      recommendation: canonical.recommendation,
    })
  }
  
  if (canonical.secondaryLimiter && canonical.secondaryLimiter !== 'none') {
    const secondaryLabel = LIMITING_FACTOR_LABELS[canonical.secondaryLimiter]
    limitingFactors.push({
      factor: secondaryLabel,
      severity: 'moderate',
      explanation: `${secondaryLabel} is a secondary limiting factor.`,
      recommendation: `Address ${secondaryLabel.toLowerCase()} alongside primary focus.`,
    })
  }
  
  // Build component breakdown
  const breakdown: ComponentBreakdown[] = canonical.rawBreakdown.map(b => ({
    name: b.factor,
    score: Math.round((b.score / b.maxScore) * 100),
    maxScore: 100,
    status: b.status,
  }))
  
  // Get recommended focus
  const recommendedFocus = getRecommendedFocus([
    canonical.primaryLimiter,
    ...(canonical.secondaryLimiter ? [canonical.secondaryLimiter] : []),
  ])
  
  return {
    skill: canonical.skill,
    readinessScore: canonical.overallScore,
    classification: interpretation.classification,
    limitingFactors,
    recommendedNextFocus: recommendedFocus.length > 0 ? recommendedFocus : [canonical.nextProgression],
    estimatedProgressionStage: interpretation.stage,
    explanation: canonical.recommendation,
    breakdown,
  }
}

// =============================================================================
// AI ENGINE INTEGRATION HELPERS
// =============================================================================

/**
 * Calculate readiness for multiple skills at once
 * Useful for AI engine to get full athlete picture
 */
export function calculateAllSkillReadiness(
  input: SkillReadinessInput
): Map<SkillType, SkillReadinessResult> {
  const results = new Map<SkillType, SkillReadinessResult>()
  
  for (const skill of getSupportedSkills()) {
    try {
      results.set(skill, calculateSkillReadiness(skill, input))
    } catch {
      // Skip skills that fail calculation (missing required data)
    }
  }
  
  return results
}

/**
 * Get the athlete's strongest and weakest skills
 * Useful for AI coaching decisions
 */
export function analyzeSkillProfile(results: Map<SkillType, SkillReadinessResult>): {
  strongestSkills: SkillType[]
  weakestSkills: SkillType[]
  overallStrengths: string[]
  overallWeaknesses: string[]
} {
  const scores = Array.from(results.entries())
    .map(([skill, result]) => ({ skill, score: result.readinessScore }))
    .sort((a, b) => b.score - a.score)
  
  const strongestSkills = scores.slice(0, 2).map(s => s.skill)
  const weakestSkills = scores.slice(-2).reverse().map(s => s.skill)
  
  // Aggregate common strengths and weaknesses
  const strengthCounts = new Map<string, number>()
  const weaknessCounts = new Map<string, number>()
  
  for (const [, result] of results) {
    for (const b of result.breakdown) {
      if (b.status === 'strong') {
        strengthCounts.set(b.name, (strengthCounts.get(b.name) || 0) + 1)
      } else if (b.status === 'weak') {
        weaknessCounts.set(b.name, (weaknessCounts.get(b.name) || 0) + 1)
      }
    }
  }
  
  const overallStrengths = Array.from(strengthCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)
  
  const overallWeaknesses = Array.from(weaknessCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)
  
  return {
    strongestSkills,
    weakestSkills,
    overallStrengths,
    overallWeaknesses,
  }
}
