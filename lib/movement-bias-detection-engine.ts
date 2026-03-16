/**
 * Movement Bias Detection Engine
 * 
 * Detects natural strength biases in athletes and adapts programming accordingly.
 * 
 * Common patterns:
 * - pull_dominant: Pulling strength exceeds pushing strength
 * - push_dominant: Pushing strength exceeds pulling strength  
 * - compression_dominant: Core/compression exceeds upper body
 * - balanced: Relatively even development
 * 
 * The system adjusts weekly programming emphasis so weaker movement families
 * receive slightly greater developmental focus while stronger families
 * receive maintenance volume.
 * 
 * KEY PRINCIPLES:
 * - Bias adjustments are MODERATE (60/40 splits, not 80/20)
 * - Strong patterns still receive maintenance work
 * - Detection requires consistent patterns, not single tests
 * - Integrates with weak points for reinforcement
 */

import type { PerformanceEnvelope } from './performance-envelope-engine'
import type { WeakPointType } from './weak-point-engine'
import type { MovementFamily } from './movement-family-registry'

// =============================================================================
// MOVEMENT BIAS TYPES
// =============================================================================

export type BiasType =
  | 'pull_dominant'
  | 'push_dominant'
  | 'compression_dominant'
  | 'explosive_dominant'
  | 'static_dominant'
  | 'balanced'

export type BiasPattern =
  | 'pulling'
  | 'pushing'
  | 'compression'
  | 'explosive'
  | 'static_holds'
  | 'ring_work'
  | 'straight_arm'
  | 'bent_arm'

export type BiasSeverity = 'mild' | 'moderate' | 'significant'

export interface MovementBias {
  movementBiasId: string
  athleteId: string
  biasType: BiasType
  dominantPattern: BiasPattern
  weakerPattern: BiasPattern
  biasSeverity: BiasSeverity
  confidenceScore: number // 0-1
  dateDetected: Date
  dateUpdated: Date
  
  // Detection sources
  detectionSources: {
    benchmarkContribution: number // 0-1
    skillStateContribution: number // 0-1
    envelopeContribution: number // 0-1
    weakPointContribution: number // 0-1
  }
  
  // Programming adjustments
  recommendedAdjustments: BiasAdjustment
  
  // History
  previousBiasType: BiasType | null
  stabilityScore: number // 0-1, how stable the bias detection has been
}

export interface BiasAdjustment {
  // Volume distribution (should sum to 1.0)
  pushVolumeRatio: number // e.g., 0.55 = 55% of upper body volume
  pullVolumeRatio: number // e.g., 0.45 = 45% of upper body volume
  
  // Emphasis flags
  emphasizePush: boolean
  emphasizePull: boolean
  emphasizeCompression: boolean
  
  // Skill progression adjustments
  pushProgressionModifier: number // 0.8-1.2
  pullProgressionModifier: number // 0.8-1.2
  compressionProgressionModifier: number // 0.8-1.2
  
  // Explanation
  rationale: string
}

// =============================================================================
// BENCHMARK THRESHOLDS FOR BIAS DETECTION
// =============================================================================

interface BenchmarkRatios {
  pullToPushRatio: number // pull_ups / dips (normalized)
  weightedPullToDipRatio: number
  frontLeverToPlancheReadiness: number
  compressionToUpperBodyRatio: number
}

const BIAS_THRESHOLDS = {
  // Pull/Push ratio thresholds
  pullDominant: {
    mild: 1.15, // Pull is 15% stronger
    moderate: 1.30, // Pull is 30% stronger
    significant: 1.50, // Pull is 50% stronger
  },
  pushDominant: {
    mild: 0.87, // Push is ~15% stronger (1/1.15)
    moderate: 0.77, // Push is ~30% stronger
    significant: 0.67, // Push is ~50% stronger
  },
  compressionDominant: {
    mild: 1.20,
    moderate: 1.40,
    significant: 1.60,
  },
  balanced: {
    min: 0.87,
    max: 1.15,
  },
}

// =============================================================================
// BENCHMARK INPUT INTERFACE
// =============================================================================

export interface BenchmarkInput {
  // Pulling benchmarks
  pullUps?: number // Max reps
  weightedPullUp?: number // Added weight in kg
  chinUps?: number
  rows?: number
  
  // Pushing benchmarks
  dips?: number // Max reps
  weightedDip?: number // Added weight in kg
  pushUps?: number
  hspu?: number
  
  // Compression benchmarks
  hollowHold?: number // Seconds
  lSit?: number // Seconds
  vSit?: number // Seconds
  
  // Skill readiness (0-100)
  frontLeverReadiness?: number
  plancheReadiness?: number
  muscleUpReadiness?: number
  hspuReadiness?: number
  
  // Athlete context
  bodyweight?: number // kg
}

// =============================================================================
// SKILL STATE INPUT INTERFACE
// =============================================================================

export interface SkillStateInput {
  frontLever?: {
    readiness: number // 0-100
    currentNode: string
    confidence: number // 0-1
  }
  planche?: {
    readiness: number
    currentNode: string
    confidence: number
  }
  muscleUp?: {
    readiness: number
    currentNode: string
    confidence: number
  }
  lSit?: {
    readiness: number
    currentNode: string
    confidence: number
  }
}

// =============================================================================
// BIAS DETECTION FUNCTIONS
// =============================================================================

/**
 * Calculate pull-to-push ratio from benchmarks
 */
function calculatePullPushRatio(benchmarks: BenchmarkInput): number {
  let pullScore = 0
  let pushScore = 0
  let pullCount = 0
  let pushCount = 0
  
  // Pulling metrics (normalized to ~20 rep equivalent)
  if (benchmarks.pullUps !== undefined) {
    pullScore += benchmarks.pullUps / 15 * 100 // 15 pull-ups = 100
    pullCount++
  }
  if (benchmarks.weightedPullUp !== undefined) {
    pullScore += benchmarks.weightedPullUp / 30 * 100 // 30kg = 100
    pullCount++
  }
  if (benchmarks.chinUps !== undefined) {
    pullScore += benchmarks.chinUps / 18 * 100 // 18 chin-ups = 100
    pullCount++
  }
  
  // Pushing metrics
  if (benchmarks.dips !== undefined) {
    pushScore += benchmarks.dips / 20 * 100 // 20 dips = 100
    pushCount++
  }
  if (benchmarks.weightedDip !== undefined) {
    pushScore += benchmarks.weightedDip / 35 * 100 // 35kg = 100
    pushCount++
  }
  if (benchmarks.pushUps !== undefined) {
    pushScore += benchmarks.pushUps / 40 * 100 // 40 push-ups = 100
    pushCount++
  }
  
  if (pullCount === 0 || pushCount === 0) {
    return 1.0 // Default to balanced if insufficient data
  }
  
  const avgPull = pullScore / pullCount
  const avgPush = pushScore / pushCount
  
  return avgPush > 0 ? avgPull / avgPush : 1.0
}

/**
 * Calculate compression ratio from benchmarks
 */
function calculateCompressionRatio(benchmarks: BenchmarkInput): number {
  let compressionScore = 0
  let compressionCount = 0
  
  if (benchmarks.hollowHold !== undefined) {
    compressionScore += benchmarks.hollowHold / 60 * 100 // 60s = 100
    compressionCount++
  }
  if (benchmarks.lSit !== undefined) {
    compressionScore += benchmarks.lSit / 30 * 100 // 30s = 100
    compressionCount++
  }
  if (benchmarks.vSit !== undefined) {
    compressionScore += benchmarks.vSit / 15 * 100 // 15s = 100
    compressionCount++
  }
  
  if (compressionCount === 0) {
    return 1.0
  }
  
  // Compare to average upper body
  const pullPushAvg = (
    (benchmarks.pullUps || 0) / 15 * 100 +
    (benchmarks.dips || 0) / 20 * 100
  ) / 2 || 50
  
  const avgCompression = compressionScore / compressionCount
  
  return pullPushAvg > 0 ? avgCompression / pullPushAvg : 1.0
}

/**
 * Calculate skill readiness ratio
 */
function calculateSkillReadinessRatio(benchmarks: BenchmarkInput): number {
  const pullReadiness = benchmarks.frontLeverReadiness || benchmarks.muscleUpReadiness || 50
  const pushReadiness = benchmarks.plancheReadiness || benchmarks.hspuReadiness || 50
  
  return pushReadiness > 0 ? pullReadiness / pushReadiness : 1.0
}

/**
 * Detect bias from skill state data
 */
function detectBiasFromSkillState(skillState: SkillStateInput): {
  biasType: BiasType
  confidence: number
  dominantPattern: BiasPattern
  weakerPattern: BiasPattern
} {
  const frontLeverScore = skillState.frontLever?.readiness || 0
  const plancheScore = skillState.planche?.readiness || 0
  const muscleUpScore = skillState.muscleUp?.readiness || 0
  const lSitScore = skillState.lSit?.readiness || 0
  
  // Calculate pattern scores
  const pullScore = (frontLeverScore + muscleUpScore) / 2
  const pushScore = plancheScore
  const compressionScore = lSitScore
  
  const pullPushRatio = pushScore > 0 ? pullScore / pushScore : 1.0
  
  // Determine bias
  if (pullPushRatio > BIAS_THRESHOLDS.pullDominant.mild) {
    const severity = pullPushRatio > BIAS_THRESHOLDS.pullDominant.significant ? 0.9 :
                     pullPushRatio > BIAS_THRESHOLDS.pullDominant.moderate ? 0.7 : 0.5
    return {
      biasType: 'pull_dominant',
      confidence: severity,
      dominantPattern: 'pulling',
      weakerPattern: 'pushing',
    }
  }
  
  if (pullPushRatio < BIAS_THRESHOLDS.pushDominant.mild) {
    const severity = pullPushRatio < BIAS_THRESHOLDS.pushDominant.significant ? 0.9 :
                     pullPushRatio < BIAS_THRESHOLDS.pushDominant.moderate ? 0.7 : 0.5
    return {
      biasType: 'push_dominant',
      confidence: severity,
      dominantPattern: 'pushing',
      weakerPattern: 'pulling',
    }
  }
  
  return {
    biasType: 'balanced',
    confidence: 0.6,
    dominantPattern: 'pulling', // Default
    weakerPattern: 'pushing',
  }
}

/**
 * Detect bias from performance envelope data
 */
function detectBiasFromEnvelope(envelopes: PerformanceEnvelope[]): {
  biasType: BiasType
  confidence: number
} {
  const pullEnvelopes = envelopes.filter(e => 
    ['vertical_pull', 'horizontal_pull', 'straight_arm_pull'].includes(e.movementFamily)
  )
  const pushEnvelopes = envelopes.filter(e =>
    ['vertical_push', 'horizontal_push', 'straight_arm_push'].includes(e.movementFamily)
  )
  
  if (pullEnvelopes.length === 0 || pushEnvelopes.length === 0) {
    return { biasType: 'balanced', confidence: 0.3 }
  }
  
  // Compare performance trends
  const pullTrendScore = pullEnvelopes.reduce((sum, e) => 
    sum + (e.performanceTrend === 'improving' ? 1 : e.performanceTrend === 'declining' ? -1 : 0), 0
  ) / pullEnvelopes.length
  
  const pushTrendScore = pushEnvelopes.reduce((sum, e) =>
    sum + (e.performanceTrend === 'improving' ? 1 : e.performanceTrend === 'declining' ? -1 : 0), 0
  ) / pushEnvelopes.length
  
  // Compare fatigue tolerance
  const avgPullFatigue = pullEnvelopes.reduce((sum, e) => sum + e.fatigueThreshold, 0) / pullEnvelopes.length
  const avgPushFatigue = pushEnvelopes.reduce((sum, e) => sum + e.fatigueThreshold, 0) / pushEnvelopes.length
  
  const trendDiff = pullTrendScore - pushTrendScore
  const fatigueDiff = avgPullFatigue - avgPushFatigue
  
  if (trendDiff > 0.3 || fatigueDiff > 20) {
    return { biasType: 'pull_dominant', confidence: Math.min(0.8, Math.abs(trendDiff) + 0.3) }
  }
  if (trendDiff < -0.3 || fatigueDiff < -20) {
    return { biasType: 'push_dominant', confidence: Math.min(0.8, Math.abs(trendDiff) + 0.3) }
  }
  
  return { biasType: 'balanced', confidence: 0.5 }
}

/**
 * Detect bias from weak points
 */
function detectBiasFromWeakPoints(weakPoints: WeakPointType[]): {
  biasType: BiasType
  confidence: number
} {
  const pullWeakPoints = ['pull_strength', 'straight_arm_pull_strength', 'explosive_power']
  const pushWeakPoints = ['push_strength', 'straight_arm_push_strength', 'vertical_push_strength', 'dip_strength']
  
  const hasPullWeakness = weakPoints.some(wp => pullWeakPoints.includes(wp))
  const hasPushWeakness = weakPoints.some(wp => pushWeakPoints.includes(wp))
  
  if (hasPushWeakness && !hasPullWeakness) {
    return { biasType: 'pull_dominant', confidence: 0.7 }
  }
  if (hasPullWeakness && !hasPushWeakness) {
    return { biasType: 'push_dominant', confidence: 0.7 }
  }
  
  return { biasType: 'balanced', confidence: 0.4 }
}

// =============================================================================
// MAIN DETECTION FUNCTION
// =============================================================================

export interface BiasDetectionInput {
  athleteId: string
  benchmarks?: BenchmarkInput
  skillState?: SkillStateInput
  envelopes?: PerformanceEnvelope[]
  weakPoints?: WeakPointType[]
  previousBias?: MovementBias
}

/**
 * Detect movement bias from all available sources
 */
export function detectMovementBias(input: BiasDetectionInput): MovementBias {
  const {
    athleteId,
    benchmarks,
    skillState,
    envelopes,
    weakPoints,
    previousBias,
  } = input
  
  // Collect signals from each source
  const signals: Array<{ biasType: BiasType; confidence: number; weight: number }> = []
  const contributions = {
    benchmarkContribution: 0,
    skillStateContribution: 0,
    envelopeContribution: 0,
    weakPointContribution: 0,
  }
  
  // 1. Benchmark detection (highest weight)
  if (benchmarks && (benchmarks.pullUps || benchmarks.dips)) {
    const pullPushRatio = calculatePullPushRatio(benchmarks)
    const compressionRatio = calculateCompressionRatio(benchmarks)
    const skillRatio = calculateSkillReadinessRatio(benchmarks)
    
    let benchmarkBias: BiasType = 'balanced'
    let benchmarkConfidence = 0.5
    
    if (pullPushRatio > BIAS_THRESHOLDS.pullDominant.significant) {
      benchmarkBias = 'pull_dominant'
      benchmarkConfidence = 0.9
    } else if (pullPushRatio > BIAS_THRESHOLDS.pullDominant.moderate) {
      benchmarkBias = 'pull_dominant'
      benchmarkConfidence = 0.7
    } else if (pullPushRatio > BIAS_THRESHOLDS.pullDominant.mild) {
      benchmarkBias = 'pull_dominant'
      benchmarkConfidence = 0.5
    } else if (pullPushRatio < BIAS_THRESHOLDS.pushDominant.significant) {
      benchmarkBias = 'push_dominant'
      benchmarkConfidence = 0.9
    } else if (pullPushRatio < BIAS_THRESHOLDS.pushDominant.moderate) {
      benchmarkBias = 'push_dominant'
      benchmarkConfidence = 0.7
    } else if (pullPushRatio < BIAS_THRESHOLDS.pushDominant.mild) {
      benchmarkBias = 'push_dominant'
      benchmarkConfidence = 0.5
    }
    
    // Check for compression dominance
    if (compressionRatio > BIAS_THRESHOLDS.compressionDominant.moderate) {
      benchmarkBias = 'compression_dominant'
      benchmarkConfidence = Math.max(benchmarkConfidence, 0.6)
    }
    
    // Weight skill ratio into the decision
    if (Math.abs(skillRatio - 1) > 0.3) {
      benchmarkConfidence = Math.min(1, benchmarkConfidence + 0.1)
    }
    
    signals.push({ biasType: benchmarkBias, confidence: benchmarkConfidence, weight: 0.4 })
    contributions.benchmarkContribution = 0.4
  }
  
  // 2. Skill state detection
  if (skillState && (skillState.frontLever || skillState.planche)) {
    const skillBias = detectBiasFromSkillState(skillState)
    signals.push({ biasType: skillBias.biasType, confidence: skillBias.confidence, weight: 0.25 })
    contributions.skillStateContribution = 0.25
  }
  
  // 3. Envelope detection
  if (envelopes && envelopes.length > 0) {
    const envelopeBias = detectBiasFromEnvelope(envelopes)
    signals.push({ biasType: envelopeBias.biasType, confidence: envelopeBias.confidence, weight: 0.2 })
    contributions.envelopeContribution = 0.2
  }
  
  // 4. Weak point detection
  if (weakPoints && weakPoints.length > 0) {
    const weakPointBias = detectBiasFromWeakPoints(weakPoints)
    signals.push({ biasType: weakPointBias.biasType, confidence: weakPointBias.confidence, weight: 0.15 })
    contributions.weakPointContribution = 0.15
  }
  
  // Aggregate signals
  let finalBiasType: BiasType = 'balanced'
  let finalConfidence = 0.5
  let dominantPattern: BiasPattern = 'pulling'
  let weakerPattern: BiasPattern = 'pushing'
  
  if (signals.length > 0) {
    // Count weighted votes for each bias type
    const votes: Record<BiasType, number> = {
      pull_dominant: 0,
      push_dominant: 0,
      compression_dominant: 0,
      explosive_dominant: 0,
      static_dominant: 0,
      balanced: 0,
    }
    
    let totalWeight = 0
    for (const signal of signals) {
      votes[signal.biasType] += signal.confidence * signal.weight
      totalWeight += signal.weight
    }
    
    // Find highest vote
    let maxVote = 0
    for (const [biasType, vote] of Object.entries(votes)) {
      if (vote > maxVote) {
        maxVote = vote
        finalBiasType = biasType as BiasType
      }
    }
    
    finalConfidence = totalWeight > 0 ? maxVote / totalWeight : 0.5
    
    // Set patterns based on bias type
    switch (finalBiasType) {
      case 'pull_dominant':
        dominantPattern = 'pulling'
        weakerPattern = 'pushing'
        break
      case 'push_dominant':
        dominantPattern = 'pushing'
        weakerPattern = 'pulling'
        break
      case 'compression_dominant':
        dominantPattern = 'compression'
        weakerPattern = 'pulling'
        break
      default:
        dominantPattern = 'pulling'
        weakerPattern = 'pushing'
    }
  }
  
  // Calculate severity
  const biasSeverity: BiasSeverity = 
    finalConfidence > 0.75 ? 'significant' :
    finalConfidence > 0.55 ? 'moderate' : 'mild'
  
  // Calculate stability score
  let stabilityScore = 0.5
  if (previousBias) {
    if (previousBias.biasType === finalBiasType) {
      stabilityScore = Math.min(1, previousBias.stabilityScore + 0.1)
    } else {
      stabilityScore = Math.max(0.3, previousBias.stabilityScore - 0.2)
    }
  }
  
  // Generate adjustments
  const adjustments = generateBiasAdjustments(finalBiasType, biasSeverity)
  
  return {
    movementBiasId: `bias_${athleteId}_${Date.now()}`,
    athleteId,
    biasType: finalBiasType,
    dominantPattern,
    weakerPattern,
    biasSeverity,
    confidenceScore: finalConfidence,
    dateDetected: previousBias?.dateDetected || new Date(),
    dateUpdated: new Date(),
    detectionSources: contributions,
    recommendedAdjustments: adjustments,
    previousBiasType: previousBias?.biasType || null,
    stabilityScore,
  }
}

// =============================================================================
// ADJUSTMENT GENERATION
// =============================================================================

/**
 * Generate programming adjustments based on detected bias
 */
function generateBiasAdjustments(biasType: BiasType, severity: BiasSeverity): BiasAdjustment {
  // Base ratios (balanced = 0.50/0.50)
  let pushRatio = 0.50
  let pullRatio = 0.50
  
  // Severity modifiers (keep adjustments moderate)
  const severityModifier = severity === 'significant' ? 0.10 :
                          severity === 'moderate' ? 0.07 : 0.04
  
  let emphasizePush = false
  let emphasizePull = false
  let emphasizeCompression = false
  let rationale = ''
  
  switch (biasType) {
    case 'pull_dominant':
      // Increase push volume to develop weaker pattern
      pushRatio = 0.50 + severityModifier // Max ~0.60
      pullRatio = 0.50 - severityModifier // Min ~0.40
      emphasizePush = true
      rationale = 'Your pulling strength exceeds pushing strength. Programming emphasizes pushing development while maintaining your pulling ability.'
      break
      
    case 'push_dominant':
      pullRatio = 0.50 + severityModifier
      pushRatio = 0.50 - severityModifier
      emphasizePull = true
      rationale = 'Your pushing strength exceeds pulling strength. Programming emphasizes pulling development while maintaining your pushing ability.'
      break
      
    case 'compression_dominant':
      // Slightly increase upper body, maintain compression
      pushRatio = 0.48
      pullRatio = 0.48
      emphasizeCompression = false // Already strong
      rationale = 'Your compression strength is well-developed. Programming maintains this while emphasizing upper body development.'
      break
      
    default:
      rationale = 'Your push and pull patterns are relatively balanced. Programming maintains equal emphasis on both.'
  }
  
  // Calculate progression modifiers (weaker patterns get slight boost)
  const pushProgressionModifier = emphasizePush ? 1.05 + (severityModifier * 0.5) : 
                                  biasType === 'push_dominant' ? 0.95 : 1.0
  const pullProgressionModifier = emphasizePull ? 1.05 + (severityModifier * 0.5) :
                                  biasType === 'pull_dominant' ? 0.95 : 1.0
  const compressionProgressionModifier = emphasizeCompression ? 1.05 : 1.0
  
  return {
    pushVolumeRatio: pushRatio,
    pullVolumeRatio: pullRatio,
    emphasizePush,
    emphasizePull,
    emphasizeCompression,
    pushProgressionModifier,
    pullProgressionModifier,
    compressionProgressionModifier,
    rationale,
  }
}

// =============================================================================
// PROGRAM BUILDER INTEGRATION
// =============================================================================

export interface BiasAdjustedVolume {
  pushSets: number
  pullSets: number
  compressionSets: number
  adjustmentApplied: boolean
  explanation: string
}

/**
 * Apply bias adjustments to weekly volume distribution
 */
export function applyBiasToVolume(
  basePushSets: number,
  basePullSets: number,
  baseCompressionSets: number,
  bias: MovementBias
): BiasAdjustedVolume {
  const { recommendedAdjustments, biasType } = bias
  
  if (biasType === 'balanced') {
    return {
      pushSets: basePushSets,
      pullSets: basePullSets,
      compressionSets: baseCompressionSets,
      adjustmentApplied: false,
      explanation: 'Volume distribution unchanged - patterns are balanced.',
    }
  }
  
  const totalUpperSets = basePushSets + basePullSets
  const adjustedPushSets = Math.round(totalUpperSets * recommendedAdjustments.pushVolumeRatio)
  const adjustedPullSets = Math.round(totalUpperSets * recommendedAdjustments.pullVolumeRatio)
  
  return {
    pushSets: adjustedPushSets,
    pullSets: adjustedPullSets,
    compressionSets: baseCompressionSets,
    adjustmentApplied: true,
    explanation: recommendedAdjustments.rationale,
  }
}

/**
 * Get skill progression modifier based on bias
 */
export function getBiasProgressionModifier(
  movementFamily: MovementFamily,
  bias: MovementBias
): number {
  const { recommendedAdjustments } = bias
  
  const pushFamilies: MovementFamily[] = ['vertical_push', 'horizontal_push', 'straight_arm_push']
  const pullFamilies: MovementFamily[] = ['vertical_pull', 'horizontal_pull', 'straight_arm_pull']
  const compressionFamilies: MovementFamily[] = ['compression', 'hip_flexion']
  
  if (pushFamilies.includes(movementFamily)) {
    return recommendedAdjustments.pushProgressionModifier
  }
  if (pullFamilies.includes(movementFamily)) {
    return recommendedAdjustments.pullProgressionModifier
  }
  if (compressionFamilies.includes(movementFamily)) {
    return recommendedAdjustments.compressionProgressionModifier
  }
  
  return 1.0
}

// =============================================================================
// FRAMEWORK INTEGRATION
// =============================================================================

/**
 * Adjust framework recommendations based on bias
 */
export function adjustFrameworkForBias(
  frameworkId: string,
  bias: MovementBias
): {
  exerciseEmphasisAdjustment: 'push' | 'pull' | 'balanced'
  skillExposureAdjustment: 'push' | 'pull' | 'balanced'
  volumeAdjustment: BiasAdjustment
  explanation: string
} {
  const { biasType, recommendedAdjustments } = bias
  
  let exerciseEmphasis: 'push' | 'pull' | 'balanced' = 'balanced'
  let skillEmphasis: 'push' | 'pull' | 'balanced' = 'balanced'
  let explanation = ''
  
  switch (biasType) {
    case 'pull_dominant':
      exerciseEmphasis = 'push'
      skillEmphasis = 'push'
      explanation = `${frameworkId} framework adjusted to emphasize pushing development.`
      break
    case 'push_dominant':
      exerciseEmphasis = 'pull'
      skillEmphasis = 'pull'
      explanation = `${frameworkId} framework adjusted to emphasize pulling development.`
      break
    default:
      explanation = `${frameworkId} framework maintains balanced emphasis.`
  }
  
  return {
    exerciseEmphasisAdjustment: exerciseEmphasis,
    skillExposureAdjustment: skillEmphasis,
    volumeAdjustment: recommendedAdjustments,
    explanation,
  }
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

export interface BiasExplanation {
  headline: string
  rationale: string
  whatThisMeans: string
  howProgramAdjusts: string
  encouragement: string
}

/**
 * Generate athlete-facing explanation of detected bias
 */
export function generateBiasExplanation(bias: MovementBias): BiasExplanation {
  const { biasType, biasSeverity, dominantPattern, weakerPattern, recommendedAdjustments } = bias
  
  const severityLabel = biasSeverity === 'significant' ? 'noticeably' :
                       biasSeverity === 'moderate' ? 'moderately' : 'slightly'
  
  let headline = ''
  let whatThisMeans = ''
  let howProgramAdjusts = ''
  let encouragement = ''
  
  switch (biasType) {
    case 'pull_dominant':
      headline = 'Your pulling strength leads your pushing strength'
      whatThisMeans = `Your ${dominantPattern} patterns are ${severityLabel} stronger than your ${weakerPattern} patterns. This is common and often reflects training history or natural strengths.`
      howProgramAdjusts = `Your program will include ${biasSeverity === 'significant' ? '60/40' : biasSeverity === 'moderate' ? '57/43' : '54/46'} push/pull emphasis to develop balanced strength while maintaining your pulling ability.`
      encouragement = 'Strong pulling is an excellent foundation for advanced skills like front lever and muscle-up.'
      break
      
    case 'push_dominant':
      headline = 'Your pushing strength leads your pulling strength'
      whatThisMeans = `Your ${dominantPattern} patterns are ${severityLabel} stronger than your ${weakerPattern} patterns. This provides a good foundation for planche and handstand work.`
      howProgramAdjusts = `Your program will include ${biasSeverity === 'significant' ? '60/40' : biasSeverity === 'moderate' ? '57/43' : '54/46'} pull/push emphasis to develop balanced strength while maintaining your pushing ability.`
      encouragement = 'Strong pushing forms an excellent base for planche progressions and handstand push-ups.'
      break
      
    case 'compression_dominant':
      headline = 'Your compression strength is well-developed'
      whatThisMeans = 'Your core compression strength exceeds typical ratios. This provides excellent body tension for skills like L-sit and front lever.'
      howProgramAdjusts = 'Your program will maintain compression work while emphasizing upper body strength development.'
      encouragement = 'Strong compression is often the limiting factor for others - you have a real advantage here.'
      break
      
    default:
      headline = 'Your push and pull patterns are balanced'
      whatThisMeans = 'Your pushing and pulling strength are relatively even, which is excellent for overall skill development.'
      howProgramAdjusts = 'Your program maintains equal emphasis on both patterns.'
      encouragement = 'Balanced strength allows for well-rounded skill progression across all movement families.'
  }
  
  return {
    headline,
    rationale: recommendedAdjustments.rationale,
    whatThisMeans,
    howProgramAdjusts,
    encouragement,
  }
}

/**
 * Generate concise coach message for bias
 */
export function generateBiasCoachMessage(bias: MovementBias): string {
  const { biasType, biasSeverity } = bias
  
  if (biasType === 'balanced') {
    return 'Your push and pull patterns are balanced. Programming maintains equal emphasis on both.'
  }
  
  const intensity = biasSeverity === 'significant' ? 'noticeably' :
                   biasSeverity === 'moderate' ? 'moderately' : 'slightly'
  
  switch (biasType) {
    case 'pull_dominant':
      return `Your training ${intensity} emphasizes pushing because your pulling strength currently exceeds it.`
    case 'push_dominant':
      return `Your training ${intensity} emphasizes pulling because your pushing strength currently exceeds it.`
    case 'compression_dominant':
      return 'Your program maintains strong compression while developing upper body strength.'
    default:
      return 'Programming maintains balanced emphasis across movement patterns.'
  }
}

// =============================================================================
// RE-EVALUATION TRIGGERS
// =============================================================================

export interface ReEvaluationTrigger {
  shouldReEvaluate: boolean
  reason: string
  urgency: 'immediate' | 'next_session' | 'weekly'
}

/**
 * Check if bias should be re-evaluated
 */
export function checkBiasReEvaluation(
  currentBias: MovementBias,
  newBenchmarks?: BenchmarkInput,
  skillStateChanged?: boolean,
  weeksElapsed?: number
): ReEvaluationTrigger {
  // Re-evaluate if new benchmarks provided
  if (newBenchmarks && (newBenchmarks.pullUps || newBenchmarks.dips)) {
    return {
      shouldReEvaluate: true,
      reason: 'New benchmark data available',
      urgency: 'next_session',
    }
  }
  
  // Re-evaluate if skill state significantly changed
  if (skillStateChanged) {
    return {
      shouldReEvaluate: true,
      reason: 'Skill readiness levels changed significantly',
      urgency: 'next_session',
    }
  }
  
  // Re-evaluate periodically (every 4 weeks)
  if (weeksElapsed && weeksElapsed >= 4) {
    return {
      shouldReEvaluate: true,
      reason: 'Periodic re-evaluation due',
      urgency: 'weekly',
    }
  }
  
  // Re-evaluate if confidence is low
  if (currentBias.confidenceScore < 0.4) {
    return {
      shouldReEvaluate: true,
      reason: 'Low confidence in current bias detection',
      urgency: 'weekly',
    }
  }
  
  return {
    shouldReEvaluate: false,
    reason: 'No re-evaluation needed',
    urgency: 'weekly',
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  BIAS_THRESHOLDS,
  calculatePullPushRatio,
  calculateCompressionRatio,
  calculateSkillReadinessRatio,
  detectBiasFromSkillState,
  detectBiasFromEnvelope,
  detectBiasFromWeakPoints,
  generateBiasAdjustments,
}
