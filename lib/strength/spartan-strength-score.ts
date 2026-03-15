/**
 * Spartan Strength Score System
 * 
 * A universal scoring system that summarizes an athlete's calisthenics strength
 * and readiness across multiple metrics. Provides an overall score (0-100) plus
 * category breakdowns for Pull, Push, Core, and Skill Readiness.
 * 
 * Scoring Philosophy:
 * - Transparent, rule-based thresholds
 * - Weighted average across categories
 * - Categories are Pull (30%), Push (25%), Core (20%), Skill Readiness (25%)
 */

// =============================================================================
// TYPES
// =============================================================================

export type StrengthLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export interface CategoryScore {
  score: number // 0-100
  level: StrengthLevel
  label: string
}

export interface SpartanStrengthResult {
  overallScore: number // 0-100
  overallLevel: StrengthLevel
  overallLabel: string
  categories: {
    pullStrength: CategoryScore
    pushStrength: CategoryScore
    coreStrength: CategoryScore
    skillReadiness: CategoryScore
  }
  primaryStrength: string
  primaryWeakness: string
  recommendedFocus: string
  skillPathway: string
}

export interface SpartanStrengthInputs {
  // Pull metrics
  maxPullUps: number
  weightedPullUpLoad: number // lbs added
  canDoChestToBar: boolean
  
  // Push metrics
  maxPushUps: number
  maxDips: number
  weightedDipLoad?: number // lbs added
  
  // Core metrics
  hollowHoldTime: number // seconds
  lSitHoldTime?: number // seconds
  
  // Skill experience (optional)
  tuckFrontLeverHold?: number // seconds
  tuckPlancheHold?: number // seconds
  canDoMuscleUp?: boolean
  handstandHoldTime?: number // seconds
}

// =============================================================================
// LEVEL UTILITIES
// =============================================================================

export function getStrengthLevel(score: number): StrengthLevel {
  if (score >= 85) return 'elite'
  if (score >= 60) return 'advanced'
  if (score >= 35) return 'intermediate'
  return 'beginner'
}

export function getStrengthLabel(level: StrengthLevel): string {
  const labels: Record<StrengthLevel, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    elite: 'Elite',
  }
  return labels[level]
}

export function getOverallLabel(score: number): string {
  if (score >= 90) return 'Elite Spartan'
  if (score >= 80) return 'Advanced Spartan'
  if (score >= 65) return 'Skilled Athlete'
  if (score >= 50) return 'Developing Athlete'
  if (score >= 35) return 'Foundation Builder'
  return 'Beginner'
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-purple-400'
  if (score >= 70) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 30) return 'text-orange-400'
  return 'text-red-400'
}

export function getLevelColor(level: StrengthLevel): string {
  const colors: Record<StrengthLevel, string> = {
    elite: 'text-purple-400',
    advanced: 'text-emerald-400',
    intermediate: 'text-yellow-400',
    beginner: 'text-orange-400',
  }
  return colors[level]
}

export function getLevelBgColor(level: StrengthLevel): string {
  const colors: Record<StrengthLevel, string> = {
    elite: 'bg-purple-500/10 border-purple-500/30',
    advanced: 'bg-emerald-500/10 border-emerald-500/30',
    intermediate: 'bg-yellow-500/10 border-yellow-500/30',
    beginner: 'bg-orange-500/10 border-orange-500/30',
  }
  return colors[level]
}

// =============================================================================
// CATEGORY SCORING FUNCTIONS
// =============================================================================

/**
 * Pull Strength Score (0-100)
 * Based on pull-ups, weighted pull-ups, and chest-to-bar ability
 */
function calculatePullStrength(inputs: SpartanStrengthInputs): CategoryScore {
  let score = 0
  
  // Base pull-ups (max 40 points)
  // Elite: 25+ = 40pts, Advanced: 18-24 = 30pts, Intermediate: 12-17 = 20pts, Beginner: <12
  if (inputs.maxPullUps >= 25) score += 40
  else if (inputs.maxPullUps >= 18) score += 30
  else if (inputs.maxPullUps >= 12) score += 20
  else if (inputs.maxPullUps >= 8) score += 12
  else if (inputs.maxPullUps >= 5) score += 6
  else score += Math.min(5, inputs.maxPullUps)
  
  // Weighted pull-ups (max 45 points)
  // Elite: +70lb = 45pts, Advanced: +50lb = 35pts, Intermediate: +30lb = 20pts
  if (inputs.weightedPullUpLoad >= 100) score += 45
  else if (inputs.weightedPullUpLoad >= 70) score += 40
  else if (inputs.weightedPullUpLoad >= 50) score += 30
  else if (inputs.weightedPullUpLoad >= 35) score += 22
  else if (inputs.weightedPullUpLoad >= 20) score += 14
  else if (inputs.weightedPullUpLoad >= 10) score += 7
  else score += Math.floor(inputs.weightedPullUpLoad * 0.5)
  
  // Chest-to-bar ability (max 15 points)
  if (inputs.canDoChestToBar) score += 15
  
  const finalScore = Math.min(100, score)
  const level = getStrengthLevel(finalScore)
  
  return {
    score: finalScore,
    level,
    label: getStrengthLabel(level),
  }
}

/**
 * Push Strength Score (0-100)
 * Based on push-ups, dips, and weighted dips
 */
function calculatePushStrength(inputs: SpartanStrengthInputs): CategoryScore {
  let score = 0
  
  // Base push-ups (max 25 points)
  if (inputs.maxPushUps >= 50) score += 25
  else if (inputs.maxPushUps >= 40) score += 22
  else if (inputs.maxPushUps >= 30) score += 18
  else if (inputs.maxPushUps >= 20) score += 12
  else if (inputs.maxPushUps >= 10) score += 6
  else score += Math.floor(inputs.maxPushUps * 0.5)
  
  // Dips (max 35 points)
  if (inputs.maxDips >= 30) score += 35
  else if (inputs.maxDips >= 20) score += 28
  else if (inputs.maxDips >= 15) score += 22
  else if (inputs.maxDips >= 10) score += 14
  else if (inputs.maxDips >= 5) score += 7
  else score += inputs.maxDips
  
  // Weighted dips (max 40 points)
  const weightedDip = inputs.weightedDipLoad || 0
  if (weightedDip >= 100) score += 40
  else if (weightedDip >= 70) score += 32
  else if (weightedDip >= 45) score += 24
  else if (weightedDip >= 25) score += 15
  else if (weightedDip >= 10) score += 8
  else score += Math.floor(weightedDip * 0.5)
  
  const finalScore = Math.min(100, score)
  const level = getStrengthLevel(finalScore)
  
  return {
    score: finalScore,
    level,
    label: getStrengthLabel(level),
  }
}

/**
 * Core Strength Score (0-100)
 * Based on hollow hold time and L-sit ability
 */
function calculateCoreStrength(inputs: SpartanStrengthInputs): CategoryScore {
  let score = 0
  
  // Hollow hold (max 60 points)
  if (inputs.hollowHoldTime >= 90) score += 60
  else if (inputs.hollowHoldTime >= 60) score += 50
  else if (inputs.hollowHoldTime >= 45) score += 38
  else if (inputs.hollowHoldTime >= 30) score += 25
  else if (inputs.hollowHoldTime >= 15) score += 12
  else score += Math.floor(inputs.hollowHoldTime * 0.8)
  
  // L-sit hold (max 40 points)
  const lSit = inputs.lSitHoldTime || 0
  if (lSit >= 30) score += 40
  else if (lSit >= 20) score += 32
  else if (lSit >= 15) score += 24
  else if (lSit >= 10) score += 16
  else if (lSit >= 5) score += 8
  else score += Math.floor(lSit * 1.5)
  
  const finalScore = Math.min(100, score)
  const level = getStrengthLevel(finalScore)
  
  return {
    score: finalScore,
    level,
    label: getStrengthLabel(level),
  }
}

/**
 * Skill Readiness Score (0-100)
 * Based on skill-specific holds and progressions
 */
function calculateSkillReadiness(inputs: SpartanStrengthInputs): CategoryScore {
  let score = 0
  
  // Tuck front lever (max 30 points)
  const tuckFL = inputs.tuckFrontLeverHold || 0
  if (tuckFL >= 20) score += 30
  else if (tuckFL >= 15) score += 24
  else if (tuckFL >= 10) score += 18
  else if (tuckFL >= 5) score += 10
  else score += Math.floor(tuckFL * 2)
  
  // Tuck planche (max 25 points)
  const tuckPlanche = inputs.tuckPlancheHold || 0
  if (tuckPlanche >= 15) score += 25
  else if (tuckPlanche >= 10) score += 20
  else if (tuckPlanche >= 6) score += 14
  else if (tuckPlanche >= 3) score += 8
  else score += Math.floor(tuckPlanche * 2)
  
  // Muscle-up ability (max 25 points)
  if (inputs.canDoMuscleUp) score += 25
  
  // Handstand (max 20 points)
  const handstand = inputs.handstandHoldTime || 0
  if (handstand >= 30) score += 20
  else if (handstand >= 20) score += 16
  else if (handstand >= 10) score += 10
  else if (handstand >= 5) score += 5
  else score += Math.floor(handstand)
  
  const finalScore = Math.min(100, score)
  const level = getStrengthLevel(finalScore)
  
  return {
    score: finalScore,
    level,
    label: getStrengthLabel(level),
  }
}

// =============================================================================
// MAIN CALCULATION FUNCTION
// =============================================================================

export function calculateSpartanStrengthScore(inputs: SpartanStrengthInputs): SpartanStrengthResult {
  // Calculate category scores
  const pullStrength = calculatePullStrength(inputs)
  const pushStrength = calculatePushStrength(inputs)
  const coreStrength = calculateCoreStrength(inputs)
  const skillReadiness = calculateSkillReadiness(inputs)
  
  // Weighted average for overall score
  // Pull: 30%, Push: 25%, Core: 20%, Skill: 25%
  const overallScore = Math.round(
    pullStrength.score * 0.30 +
    pushStrength.score * 0.25 +
    coreStrength.score * 0.20 +
    skillReadiness.score * 0.25
  )
  
  const overallLevel = getStrengthLevel(overallScore)
  const overallLabel = getOverallLabel(overallScore)
  
  // Determine primary strength and weakness
  const categories = [
    { name: 'Pull Strength', score: pullStrength.score },
    { name: 'Push Strength', score: pushStrength.score },
    { name: 'Core Strength', score: coreStrength.score },
    { name: 'Skill Readiness', score: skillReadiness.score },
  ]
  
  const sorted = [...categories].sort((a, b) => b.score - a.score)
  const primaryStrength = sorted[0].name
  const primaryWeakness = sorted[sorted.length - 1].name
  
  // Determine skill pathway based on strengths
  let skillPathway = 'Foundation Building'
  if (pullStrength.score >= 60 && coreStrength.score >= 50) {
    skillPathway = 'Front Lever Pathway'
  } else if (pushStrength.score >= 60 && coreStrength.score >= 50) {
    skillPathway = 'Planche Pathway'
  } else if (pullStrength.score >= 50 && pushStrength.score >= 40) {
    skillPathway = 'Muscle-Up Pathway'
  } else if (coreStrength.score >= 60 && pushStrength.score >= 40) {
    skillPathway = 'Handstand Pathway'
  }
  
  // Determine recommended focus
  let recommendedFocus = 'Build foundational strength across all areas'
  if (pullStrength.score < 40) {
    recommendedFocus = 'Focus on weighted pull-up progression to build pulling foundation'
  } else if (pushStrength.score < 40) {
    recommendedFocus = 'Focus on weighted dip progression to build pushing foundation'
  } else if (coreStrength.score < 40) {
    recommendedFocus = 'Focus on hollow body and L-sit progressions for core strength'
  } else if (skillReadiness.score < 40) {
    recommendedFocus = 'Begin skill-specific training: tuck holds and progressions'
  } else {
    recommendedFocus = `Continue developing ${skillPathway.replace(' Pathway', '')} skills`
  }
  
  return {
    overallScore,
    overallLevel,
    overallLabel,
    categories: {
      pullStrength,
      pushStrength,
      coreStrength,
      skillReadiness,
    },
    primaryStrength,
    primaryWeakness,
    recommendedFocus,
    skillPathway,
  }
}

// =============================================================================
// SHAREABLE RESULT TEXT
// =============================================================================

export function generateShareableText(result: SpartanStrengthResult): string {
  return `My Spartan Strength Score is ${result.overallScore}/100 (${result.overallLabel})

Pull Strength: ${result.categories.pullStrength.label}
Push Strength: ${result.categories.pushStrength.label}
Core Strength: ${result.categories.coreStrength.label}
Skill Readiness: ${result.categories.skillReadiness.label}

Skill Pathway: ${result.skillPathway}

Test yours at SpartanLab.app`
}

// =============================================================================
// QUICK SCORE FROM READINESS INPUTS
// =============================================================================

/**
 * Calculate Spartan Strength Score from Front Lever Readiness inputs
 */
export function spartanScoreFromFrontLeverInputs(
  flInputs: { maxPullUps: number; weightedPullUpLoad: number; hollowHoldTime: number; tuckFrontLeverHold?: number }
): SpartanStrengthResult {
  return calculateSpartanStrengthScore({
    maxPullUps: flInputs.maxPullUps,
    weightedPullUpLoad: flInputs.weightedPullUpLoad,
    canDoChestToBar: flInputs.maxPullUps >= 12,
    maxPushUps: 20, // Default estimate
    maxDips: 10, // Default estimate
    hollowHoldTime: flInputs.hollowHoldTime,
    tuckFrontLeverHold: flInputs.tuckFrontLeverHold,
  })
}

/**
 * Calculate Spartan Strength Score from Planche Readiness inputs
 */
export function spartanScoreFromPlancheInputs(
  plInputs: { maxPushUps: number; maxDips: number; plancheLeanHold: number; handstandHoldTime?: number }
): SpartanStrengthResult {
  return calculateSpartanStrengthScore({
    maxPullUps: 10, // Default estimate
    weightedPullUpLoad: 0,
    canDoChestToBar: false,
    maxPushUps: plInputs.maxPushUps,
    maxDips: plInputs.maxDips,
    hollowHoldTime: 30, // Default estimate
    tuckPlancheHold: plInputs.plancheLeanHold > 30 ? Math.floor(plInputs.plancheLeanHold / 6) : 0,
    handstandHoldTime: plInputs.handstandHoldTime,
  })
}

/**
 * Calculate Spartan Strength Score from Muscle-Up Readiness inputs
 */
export function spartanScoreFromMuscleUpInputs(
  muInputs: { maxPullUps: number; maxDips: number; chestToBarReps: number; canDoMuscleUp: boolean }
): SpartanStrengthResult {
  return calculateSpartanStrengthScore({
    maxPullUps: muInputs.maxPullUps,
    weightedPullUpLoad: muInputs.maxPullUps >= 15 ? 25 : 10, // Estimate
    canDoChestToBar: muInputs.chestToBarReps >= 5,
    maxPushUps: 25, // Default estimate
    maxDips: muInputs.maxDips,
    hollowHoldTime: 30, // Default estimate
    canDoMuscleUp: muInputs.canDoMuscleUp,
  })
}
