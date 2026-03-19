// Weak Point Detection Engine
// Analyzes athlete data to automatically detect training limitations and focus areas
// This drives intelligent program emphasis without manual guesswork

import type { OnboardingProfile, PrimaryLimitation, WeakestArea, JointCaution } from './athlete-profile'
import { getOnboardingProfile } from './athlete-profile'
import { getAthleteCalibration, type AthleteCalibration } from './athlete-calibration'

// =============================================================================
// TYPES
// =============================================================================

export type DevelopmentFocus = 
  | 'pulling_strength'
  | 'pushing_strength'
  | 'core_compression'
  | 'core_anti_extension'
  | 'shoulder_stability'
  | 'skill_coordination'
  | 'hip_mobility'
  | 'posterior_chain'
  | 'balanced_development'
  | 'general_fatigue'

export type MobilityEmphasis = 'none' | 'moderate' | 'high'

export type SkillPriority = {
  skill: string
  reason: string
}

export interface WeakPointSummary {
  // Primary focus area
  primaryFocus: DevelopmentFocus
  primaryFocusLabel: string
  primaryFocusReason: string
  
  // Secondary focus
  secondaryFocus: DevelopmentFocus | null
  secondaryFocusLabel: string | null
  
  // Mobility
  mobilityEmphasis: MobilityEmphasis
  mobilityAreas: string[]
  
  // Skill priorities
  skillPriorities: SkillPriority[]
  
  // Detected imbalances
  strengthImbalance: 'pull_weak' | 'push_weak' | 'core_weak' | 'balanced' | null
  
  // Volume adjustments
  volumeModifier: number // 0.8 = reduce, 1.0 = normal, 1.2 = increase
  
  // Joint considerations
  jointCautions: string[]
  
  // Confidence score (how much data we have)
  confidenceLevel: 'low' | 'medium' | 'high'
}

// =============================================================================
// FOCUS LABELS
// =============================================================================

const FOCUS_LABELS: Record<DevelopmentFocus, string> = {
  'pulling_strength': 'Pull strength development',
  'pushing_strength': 'Push strength development',
  'core_compression': 'Core and compression',
  'core_anti_extension': 'Core anti-extension',
  'shoulder_stability': 'Shoulder stability',
  'skill_coordination': 'Skill coordination',
  'hip_mobility': 'Hip mobility',
  'posterior_chain': 'Posterior chain flexibility',
  'balanced_development': 'Balanced development',
  'general_fatigue': 'Recovery focus',
}

// =============================================================================
// DETECTION HELPERS
// =============================================================================

/**
 * Estimate pull strength score (0-100)
 */
function estimatePullStrengthScore(profile: OnboardingProfile): number {
  let score = 50 // Default middle score
  
  // Pull-up max (major factor)
  if (profile.pullUpMax !== null) {
    if (profile.pullUpMax === 0) score = 10
    else if (profile.pullUpMax <= 3) score = 25
    else if (profile.pullUpMax <= 8) score = 45
    else if (profile.pullUpMax <= 12) score = 60
    else if (profile.pullUpMax <= 18) score = 75
    else score = 90
  }
  
  // Weighted pull-up bonus
  if (profile.weightedPullUp?.load) {
    const load = profile.weightedPullUp.load
    if (load >= 45) score = Math.max(score, 85)
    else if (load >= 25) score = Math.max(score, 70)
    else if (load >= 10) score = Math.max(score, 55)
  }
  
  return score
}

/**
 * Estimate push strength score (0-100)
 */
function estimatePushStrengthScore(profile: OnboardingProfile): number {
  let score = 50
  
  // Dip max
  if (profile.dipMax !== null) {
    if (profile.dipMax === 0) score = 15
    else if (profile.dipMax <= 5) score = 30
    else if (profile.dipMax <= 12) score = 50
    else if (profile.dipMax <= 20) score = 70
    else score = 85
  }
  
  // Push-up max bonus
  if (profile.pushUpMax !== null) {
    if (profile.pushUpMax >= 40) score = Math.max(score, 65)
    else if (profile.pushUpMax >= 25) score = Math.max(score, 50)
  }
  
  // Weighted dip bonus
  if (profile.weightedDip?.load) {
    const load = profile.weightedDip.load
    if (load >= 45) score = Math.max(score, 85)
    else if (load >= 25) score = Math.max(score, 70)
    else if (load >= 10) score = Math.max(score, 55)
  }
  
  return score
}

/**
 * Estimate core strength score (0-100)
 */
function estimateCoreStrengthScore(profile: OnboardingProfile, calibration: AthleteCalibration | null): number {
  let score = 50
  
  // L-sit hold
  if (profile.lSitHold && profile.lSitHold !== 'unknown') {
    const lsitScores: Record<string, number> = {
      'none': 15,
      'tuck': 35,
      'one_leg': 50,
      'full': 70,
      'v_sit': 90,
    }
    score = lsitScores[profile.lSitHold] || score
  }
  
  // Front lever can indicate core strength
  if (profile.frontLever?.progression && profile.frontLever.progression !== 'none' && profile.frontLever.progression !== 'unknown') {
    const flCoreBonus: Record<string, number> = {
      'tuck': 10,
      'adv_tuck': 20,
      'one_leg': 30,
      'straddle': 40,
      'full': 50,
    }
    score = Math.max(score, 40 + (flCoreBonus[profile.frontLever.progression] || 0))
  }
  
  // Use calibration if available
  if (calibration?.coreCompressionTier) {
    const tierScores: Record<string, number> = {
      'very_low': 20,
      'low': 35,
      'moderate': 55,
      'strong': 80,
    }
    const calScore = tierScores[calibration.coreCompressionTier]
    if (calScore) score = Math.round((score + calScore) / 2) // Average with calibration
  }
  
  return score
}

/**
 * Estimate overall flexibility score (0-100)
 */
function estimateFlexibilityScore(profile: OnboardingProfile): { score: number; limitedAreas: string[] } {
  let totalScore = 0
  let count = 0
  const limitedAreas: string[] = []
  
  const levelScores: Record<string, number> = {
    'very_limited': 15,
    'limited': 30,
    'moderate': 50,
    'good': 70,
    'excellent': 90,
  }
  
  // Pancake
  if (profile.pancake?.level && profile.pancake.level !== 'unknown') {
    const s = levelScores[profile.pancake.level] || 50
    totalScore += s
    count++
    if (s <= 30) limitedAreas.push('Hip mobility')
  }
  
  // Toe touch
  if (profile.toeTouch?.level && profile.toeTouch.level !== 'unknown') {
    const s = levelScores[profile.toeTouch.level] || 50
    totalScore += s
    count++
    if (s <= 30) limitedAreas.push('Hamstring flexibility')
  }
  
  // Front splits
  if (profile.frontSplits?.level && profile.frontSplits.level !== 'unknown') {
    const s = levelScores[profile.frontSplits.level] || 50
    totalScore += s
    count++
    if (s <= 30) limitedAreas.push('Hip flexor/hamstring')
  }
  
  // Side splits
  if (profile.sideSplits?.level && profile.sideSplits.level !== 'unknown') {
    const s = levelScores[profile.sideSplits.level] || 50
    totalScore += s
    count++
    if (s <= 30) limitedAreas.push('Adductor flexibility')
  }
  
  const score = count > 0 ? Math.round(totalScore / count) : 50
  return { score, limitedAreas }
}

/**
 * Detect strength imbalance
 */
function detectStrengthImbalance(pullScore: number, pushScore: number, coreScore: number): 'pull_weak' | 'push_weak' | 'core_weak' | 'balanced' {
  const threshold = 15 // Meaningful difference threshold
  
  // Core weakness takes priority if significantly low
  if (coreScore < 35 && coreScore < pullScore - 10 && coreScore < pushScore - 10) {
    return 'core_weak'
  }
  
  // Pull vs push imbalance
  if (pullScore < pushScore - threshold) {
    return 'pull_weak'
  }
  
  if (pushScore < pullScore - threshold) {
    return 'push_weak'
  }
  
  return 'balanced'
}

/**
 * Detect skill bottlenecks
 */
function detectSkillBottlenecks(
  profile: OnboardingProfile,
  pullScore: number,
  pushScore: number,
  coreScore: number
): SkillPriority[] {
  const priorities: SkillPriority[] = []
  
  // Front lever - needs pull strength + core
  if (profile.frontLever?.progression) {
    const prog = profile.frontLever.progression
    if ((prog === 'none' || prog === 'tuck') && pullScore >= 60) {
      priorities.push({
        skill: 'Front lever',
        reason: 'Good pull strength, skill coordination limiting',
      })
    } else if (prog === 'none' && pullScore < 45) {
      priorities.push({
        skill: 'Front lever prep',
        reason: 'Build pulling strength first',
      })
    }
  }
  
  // Planche - needs push strength + shoulder stability
  if (profile.planche?.progression) {
    const prog = profile.planche.progression
    if ((prog === 'none' || prog === 'lean') && pushScore >= 60) {
      priorities.push({
        skill: 'Planche',
        reason: 'Good push strength, shoulder/skill work needed',
      })
    } else if (prog === 'none' && pushScore < 45) {
      priorities.push({
        skill: 'Planche prep',
        reason: 'Build pushing strength first',
      })
    }
  }
  
  // Muscle-up - needs pull strength + explosive power
  if (profile.muscleUp === 'none' || profile.muscleUp === 'working_on') {
    if (pullScore >= 55 && profile.pullUpMax && profile.pullUpMax >= 10) {
      priorities.push({
        skill: 'Muscle-up',
        reason: 'Strength ready, technique focus',
      })
    }
  }
  
  // HSPU - needs push strength + balance
  if (profile.hspu?.progression === 'none' || profile.hspu?.progression === 'pike') {
    if (pushScore >= 50) {
      priorities.push({
        skill: 'Handstand push-up',
        reason: 'Strength developing, practice inversions',
      })
    }
  }
  
  return priorities.slice(0, 3) // Limit to 3 priorities
}

/**
 * Calculate confidence level based on available data
 */
function calculateConfidence(profile: OnboardingProfile): 'low' | 'medium' | 'high' {
  let dataPoints = 0
  
  if (profile.pullUpMax !== null) dataPoints++
  if (profile.dipMax !== null) dataPoints++
  if (profile.pushUpMax !== null) dataPoints++
  if (profile.weightedPullUp?.load) dataPoints++
  if (profile.weightedDip?.load) dataPoints++
  if (profile.frontLever?.progression && profile.frontLever.progression !== 'unknown') dataPoints++
  if (profile.planche?.progression && profile.planche.progression !== 'unknown') dataPoints++
  if (profile.lSitHold && profile.lSitHold !== 'unknown') dataPoints++
  if (profile.pancake?.level && profile.pancake.level !== 'unknown') dataPoints++
  if (profile.primaryLimitation && profile.primaryLimitation !== 'not_sure') dataPoints++
  if (profile.weakestArea && profile.weakestArea !== 'not_sure') dataPoints++
  
  if (dataPoints >= 8) return 'high'
  if (dataPoints >= 4) return 'medium'
  return 'low'
}

// =============================================================================
// MAIN DETECTION FUNCTION
// =============================================================================

/**
 * Detect weak points and generate training focus summary
 */
export function detectWeakPoints(): WeakPointSummary {
  const profile = getOnboardingProfile()
  const calibration = getAthleteCalibration()
  
  // Default result for missing profile
  if (!profile) {
    return {
      primaryFocus: 'balanced_development',
      primaryFocusLabel: FOCUS_LABELS['balanced_development'],
      primaryFocusReason: 'Complete onboarding to detect focus areas',
      secondaryFocus: null,
      secondaryFocusLabel: null,
      mobilityEmphasis: 'moderate',
      mobilityAreas: [],
      skillPriorities: [],
      strengthImbalance: null,
      volumeModifier: 1.0,
      jointCautions: [],
      confidenceLevel: 'low',
    }
  }
  
  // Calculate strength scores
  const pullScore = estimatePullStrengthScore(profile)
  const pushScore = estimatePushStrengthScore(profile)
  const coreScore = estimateCoreStrengthScore(profile, calibration)
  const { score: flexScore, limitedAreas: flexLimitedAreas } = estimateFlexibilityScore(profile)
  
  // Detect imbalance
  const strengthImbalance = detectStrengthImbalance(pullScore, pushScore, coreScore)
  
  // Detect skill bottlenecks
  const skillPriorities = detectSkillBottlenecks(profile, pullScore, pushScore, coreScore)
  
  // Determine primary focus
  let primaryFocus: DevelopmentFocus = 'balanced_development'
  let primaryFocusReason = 'Well-rounded training approach'
  
  // User's self-reported limitation takes high priority
  if (profile.primaryLimitation && profile.primaryLimitation !== 'not_sure') {
    switch (profile.primaryLimitation) {
      case 'strength':
        if (strengthImbalance === 'pull_weak') {
          primaryFocus = 'pulling_strength'
          primaryFocusReason = 'You identified strength as a limiter, pulling is your weaker area'
        } else if (strengthImbalance === 'push_weak') {
          primaryFocus = 'pushing_strength'
          primaryFocusReason = 'You identified strength as a limiter, pushing is your weaker area'
        } else {
          primaryFocus = 'balanced_development'
          primaryFocusReason = 'You identified strength as a limiter, balanced strength work'
        }
        break
      case 'flexibility':
        primaryFocus = flexLimitedAreas.includes('Hip mobility') ? 'hip_mobility' : 'posterior_chain'
        primaryFocusReason = 'You identified flexibility as your main limitation'
        break
      case 'skill_coordination':
        primaryFocus = 'skill_coordination'
        primaryFocusReason = 'You identified skill coordination as your main limitation'
        break
      case 'recovery':
        primaryFocus = 'balanced_development'
        primaryFocusReason = 'Recovery-focused approach with moderate intensity'
        break
      case 'consistency':
        primaryFocus = 'balanced_development'
        primaryFocusReason = 'Sustainable approach to build consistency'
        break
    }
  }
  
  // User's weakest area also influences focus
  if (profile.weakestArea && profile.weakestArea !== 'not_sure' && primaryFocus === 'balanced_development') {
    switch (profile.weakestArea) {
      case 'pulling_strength':
        primaryFocus = 'pulling_strength'
        primaryFocusReason = 'Pulling strength identified as your weakest area'
        break
      case 'pushing_strength':
        primaryFocus = 'pushing_strength'
        primaryFocusReason = 'Pushing strength identified as your weakest area'
        break
      case 'core_strength':
        primaryFocus = 'core_compression'
        primaryFocusReason = 'Core strength identified as your weakest area'
        break
      case 'shoulder_stability':
        primaryFocus = 'shoulder_stability'
        primaryFocusReason = 'Shoulder stability identified as your weakest area'
        break
      case 'hip_mobility':
        primaryFocus = 'hip_mobility'
        primaryFocusReason = 'Hip mobility identified as your weakest area'
        break
      case 'hamstring_flexibility':
        primaryFocus = 'posterior_chain'
        primaryFocusReason = 'Hamstring flexibility identified as your weakest area'
        break
    }
  }
  
  // If still balanced, use detected imbalance
  if (primaryFocus === 'balanced_development') {
    switch (strengthImbalance) {
      case 'pull_weak':
        primaryFocus = 'pulling_strength'
        primaryFocusReason = 'Detected pulling strength as weaker relative to pushing'
        break
      case 'push_weak':
        primaryFocus = 'pushing_strength'
        primaryFocusReason = 'Detected pushing strength as weaker relative to pulling'
        break
      case 'core_weak':
        primaryFocus = 'core_compression'
        primaryFocusReason = 'Core and compression work needs development'
        break
    }
  }
  
  // Determine secondary focus
  let secondaryFocus: DevelopmentFocus | null = null
  
  if (primaryFocus === 'pulling_strength' && coreScore < 50) {
    secondaryFocus = 'core_compression'
  } else if (primaryFocus === 'pushing_strength' && flexScore < 40) {
    secondaryFocus = 'hip_mobility'
  } else if (primaryFocus !== 'skill_coordination' && skillPriorities.length > 0) {
    secondaryFocus = 'skill_coordination'
  } else if (calibration?.needsCompressionWork && primaryFocus !== 'core_compression') {
    secondaryFocus = 'core_compression'
  }
  
  // Determine mobility emphasis
  let mobilityEmphasis: MobilityEmphasis = 'moderate'
  if (flexScore < 30 || profile.primaryLimitation === 'flexibility') {
    mobilityEmphasis = 'high'
  } else if (flexScore >= 60) {
    mobilityEmphasis = 'none'
  }
  
  // Volume modifier based on recovery/consistency concerns
  let volumeModifier = 1.0
  if (profile.primaryLimitation === 'recovery') {
    volumeModifier = 0.85 // Reduce volume for recovery concerns
  } else if (profile.primaryLimitation === 'consistency') {
    volumeModifier = 0.9 // Slightly reduce for consistency building
  }
  
  // Joint cautions
  const jointCautions = (profile.jointCautions || []).map(j => {
    const labels: Record<JointCaution, string> = {
      'shoulders': 'Shoulders',
      'elbows': 'Elbows',
      'wrists': 'Wrists',
      'lower_back': 'Lower back',
      'knees': 'Knees',
    }
    return labels[j] || j
  })
  
  return {
    primaryFocus,
    primaryFocusLabel: FOCUS_LABELS[primaryFocus],
    primaryFocusReason,
    secondaryFocus,
    secondaryFocusLabel: secondaryFocus ? FOCUS_LABELS[secondaryFocus] : null,
    mobilityEmphasis,
    mobilityAreas: flexLimitedAreas,
    skillPriorities,
    strengthImbalance,
    volumeModifier,
    jointCautions,
    confidenceLevel: calculateConfidence(profile),
  }
}

// =============================================================================
// PROGRAM ADJUSTMENT HELPERS
// =============================================================================

/**
 * Get volume distribution adjustments based on weak points
 */
export function getVolumeDistribution(weakPoints: WeakPointSummary): {
  pullRatio: number
  pushRatio: number
  coreRatio: number
  skillRatio: number
  mobilityRatio: number
} {
  // Default balanced distribution
  let pullRatio = 1.0
  let pushRatio = 1.0
  let coreRatio = 1.0
  let skillRatio = 1.0
  let mobilityRatio = 1.0
  
  // Adjust based on primary focus
  switch (weakPoints.primaryFocus) {
    case 'pulling_strength':
      pullRatio = 1.3
      pushRatio = 0.9
      break
    case 'pushing_strength':
      pushRatio = 1.3
      pullRatio = 0.9
      break
    case 'core_compression':
      coreRatio = 1.4
      break
    case 'shoulder_stability':
      pushRatio = 1.1
      skillRatio = 1.2
      break
    case 'skill_coordination':
      skillRatio = 1.3
      break
    case 'hip_mobility':
    case 'posterior_chain':
      mobilityRatio = 1.5
      break
  }
  
  // Adjust based on secondary focus
  if (weakPoints.secondaryFocus === 'core_compression') {
    coreRatio = Math.max(coreRatio, 1.2)
  } else if (weakPoints.secondaryFocus === 'skill_coordination') {
    skillRatio = Math.max(skillRatio, 1.15)
  }
  
  // Mobility emphasis adjustment
  if (weakPoints.mobilityEmphasis === 'high') {
    mobilityRatio = Math.max(mobilityRatio, 1.3)
  }
  
  // Apply volume modifier
  const modifier = weakPoints.volumeModifier
  return {
    pullRatio: pullRatio * modifier,
    pushRatio: pushRatio * modifier,
    coreRatio: coreRatio * modifier,
    skillRatio: skillRatio * modifier,
    mobilityRatio: mobilityRatio,
  }
}

/**
 * Get exercise selection adjustments
 */
export function getExerciseSelectionGuidance(weakPoints: WeakPointSummary): {
  priorityExerciseTypes: string[]
  deprioritizedTypes: string[]
  additionalNotes: string[]
} {
  const priorityExerciseTypes: string[] = []
  const deprioritizedTypes: string[] = []
  const additionalNotes: string[] = []
  
  // Based on primary focus
  switch (weakPoints.primaryFocus) {
    case 'pulling_strength':
      priorityExerciseTypes.push('pull-ups', 'rows', 'front lever progressions')
      additionalNotes.push('Emphasize pulling volume')
      break
    case 'pushing_strength':
      priorityExerciseTypes.push('dips', 'push-ups', 'planche progressions')
      additionalNotes.push('Emphasize pushing volume')
      break
    case 'core_compression':
      priorityExerciseTypes.push('L-sits', 'dragon flag negatives', 'compression work')
      additionalNotes.push('Include compression in every session')
      additionalNotes.push('Dragon flags build compression + anti-extension together')
      break
    case 'core_anti_extension':
      priorityExerciseTypes.push('hollow holds', 'dragon flags', 'front lever raises')
      additionalNotes.push('Focus on maintaining body tension against gravity')
      additionalNotes.push('Progress dragon flag: tuck -> negatives -> assisted -> full')
      break
    case 'shoulder_stability':
      priorityExerciseTypes.push('scapular work', 'support holds', 'shoulder prep')
      additionalNotes.push('Extended warm-up for shoulder stability')
      break
    case 'skill_coordination':
      priorityExerciseTypes.push('skill practice', 'technique drills')
      additionalNotes.push('Prioritize skill practice when fresh')
      break
    case 'general_fatigue':
      deprioritizedTypes.push('high-intensity strength work')
      additionalNotes.push('Reduce volume and intensity - recovery focus')
      break
  }
  
  // Joint caution adjustments
  if (weakPoints.jointCautions.includes('Shoulders')) {
    deprioritizedTypes.push('extreme overhead positions')
    additionalNotes.push('Avoid excessive overhead loading')
  }
  if (weakPoints.jointCautions.includes('Elbows')) {
    deprioritizedTypes.push('high-volume pulling')
    additionalNotes.push('Manage pulling volume carefully')
  }
  if (weakPoints.jointCautions.includes('Wrists')) {
    deprioritizedTypes.push('aggressive planche progressions')
    additionalNotes.push('Include wrist preparation')
  }
  if (weakPoints.jointCautions.includes('Lower back')) {
    deprioritizedTypes.push('heavy compression loading')
    additionalNotes.push('Limit excessive compression stress')
  }
  
  return {
    priorityExerciseTypes,
    deprioritizedTypes,
    additionalNotes,
  }
}
