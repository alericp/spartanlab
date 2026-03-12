// Session Performance Score Engine
// Lightweight, context-aware evaluation of workout execution quality
// NOT a gamification score - training quality assessment only

import { getDailyReadiness, type DailyReadinessResult, type ReadinessTier } from './daily-readiness'
import { type SessionType } from './workout-log-service'

// =============================================================================
// TYPES
// =============================================================================

export type PerformanceTier = 'low' | 'solid' | 'strong' | 'excellent'
export type AdjustmentSignal = 'hold' | 'progress' | 'stay_conservative'

export interface SessionPerformanceResult {
  performanceScore: number // 0-100
  performanceTier: PerformanceTier
  summary: string
  adjustmentSignal: AdjustmentSignal
  contributingSignals: string[]
  confidence: 'low' | 'medium' | 'high'
  
  // Detailed breakdown
  breakdown: {
    completionScore: number    // How much of the session was completed
    qualityScore: number       // Quality of execution (RPE control, etc.)
    contextScore: number       // How well it matched readiness/intent
    effortScore: number        // Appropriate effort for session type
  }
  
  // For history/analytics
  calculatedAt: string
  sessionId?: string
}

/**
 * Input for session performance calculation
 */
export interface SessionPerformanceInput {
  // Session metadata
  sessionId?: string
  sessionType: SessionType
  sessionName?: string
  
  // Completion data
  plannedSets: number
  completedSets: number
  plannedExercises: number
  completedExercises: number
  
  // Duration
  plannedDurationMinutes?: number
  actualDurationMinutes: number
  
  // RPE data
  targetRPE?: number
  averageRPE?: number
  maxRPE?: number
  setsAboveTargetRPE?: number
  
  // Rep/hold completion
  repCompletionRate?: number  // 0-100, percentage of target reps achieved
  holdCompletionRate?: number // 0-100, for static holds
  
  // Context
  readinessScore?: number
  readinessTier?: ReadinessTier
  wasLightSessionIntended?: boolean
  
  // Additional signals
  bandProgressionMade?: boolean
  failedSets?: number
  skippedExercises?: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Score thresholds for tiers
const TIER_THRESHOLDS = {
  excellent: 85,
  strong: 65,
  solid: 40,
  low: 0,
}

// Weights for different components
const COMPONENT_WEIGHTS = {
  completion: 0.35,    // 35% - Did you finish the work?
  quality: 0.25,       // 25% - Was the quality good?
  context: 0.20,       // 20% - Did it match readiness/intent?
  effort: 0.20,        // 20% - Was effort appropriate?
}

// Session type expectations
const SESSION_TYPE_RPE_TARGETS: Record<SessionType, { min: number; ideal: number; max: number }> = {
  skill: { min: 6, ideal: 7, max: 8 },      // Technical focus, not max effort
  strength: { min: 7, ideal: 8, max: 9 },   // Productive effort
  mixed: { min: 6, ideal: 7.5, max: 8.5 },  // Balanced
  recovery: { min: 4, ideal: 5, max: 6 },   // Light and restorative
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculate completion score (0-100)
 */
function calculateCompletionScore(input: SessionPerformanceInput): { score: number; signal: string } {
  const setCompletion = input.plannedSets > 0 
    ? (input.completedSets / input.plannedSets) * 100 
    : 100
  
  const exerciseCompletion = input.plannedExercises > 0
    ? (input.completedExercises / input.plannedExercises) * 100
    : 100
  
  // Average set and exercise completion, weighted toward sets
  const completion = (setCompletion * 0.7) + (exerciseCompletion * 0.3)
  
  // Determine signal based on completion
  let signal: string
  if (completion >= 95) {
    signal = 'Full session completed'
  } else if (completion >= 80) {
    signal = 'Most of session completed'
  } else if (completion >= 60) {
    signal = 'Partial session completion'
  } else {
    signal = 'Significant work missed'
  }
  
  return { score: clamp(completion, 0, 100), signal }
}

/**
 * Calculate quality score based on rep/hold completion and failed sets (0-100)
 */
function calculateQualityScore(input: SessionPerformanceInput): { score: number; signal: string } {
  let qualityPoints = 0
  let signalParts: string[] = []
  
  // Rep completion contributes 40 points max
  if (input.repCompletionRate !== undefined) {
    qualityPoints += (input.repCompletionRate / 100) * 40
    if (input.repCompletionRate >= 90) {
      signalParts.push('strong rep completion')
    } else if (input.repCompletionRate < 70) {
      signalParts.push('rep targets partially met')
    }
  } else {
    // Default to moderate if no data
    qualityPoints += 30
  }
  
  // Hold completion contributes 30 points max
  if (input.holdCompletionRate !== undefined) {
    qualityPoints += (input.holdCompletionRate / 100) * 30
    if (input.holdCompletionRate >= 90) {
      signalParts.push('solid hold times')
    }
  } else {
    qualityPoints += 20
  }
  
  // Failed sets penalty (up to -20 points)
  if (input.failedSets !== undefined && input.failedSets > 0) {
    const failPenalty = Math.min(input.failedSets * 5, 20)
    qualityPoints -= failPenalty
    if (input.failedSets >= 3) {
      signalParts.push('multiple failed sets')
    }
  }
  
  // Base points for having any quality data
  qualityPoints += 30
  
  const signal = signalParts.length > 0 
    ? signalParts.join(', ')
    : 'Quality maintained throughout'
  
  return { score: clamp(qualityPoints, 0, 100), signal }
}

/**
 * Calculate context score - how well session matched readiness (0-100)
 */
function calculateContextScore(input: SessionPerformanceInput): { score: number; signal: string } {
  // If no readiness data, assume moderate context match
  if (input.readinessScore === undefined || input.readinessTier === undefined) {
    return { score: 70, signal: 'Session context not evaluated' }
  }
  
  const avgRPE = input.averageRPE ?? 7
  
  // High readiness + high effort = good
  // Low readiness + light effort = good
  // Low readiness + high effort = concerning
  // High readiness + very low effort = underutilized (but not bad)
  
  let contextScore = 70 // Start at baseline
  let signal = ''
  
  if (input.readinessTier === 'high') {
    // High readiness - productive effort is expected
    if (avgRPE >= 7 && avgRPE <= 8.5) {
      contextScore = 95
      signal = 'Productive effort matched high readiness'
    } else if (avgRPE > 8.5) {
      contextScore = 80
      signal = 'High effort on a ready day'
    } else {
      contextScore = 75
      signal = 'Conservative effort despite high readiness'
    }
  } else if (input.readinessTier === 'moderate') {
    // Moderate readiness - controlled effort is ideal
    if (avgRPE >= 6.5 && avgRPE <= 8) {
      contextScore = 90
      signal = 'Controlled effort matched readiness'
    } else if (avgRPE > 8) {
      contextScore = 65
      signal = 'Higher effort than readiness suggested'
    } else {
      contextScore = 80
      signal = 'Conservative approach with moderate readiness'
    }
  } else {
    // Low readiness - light effort is smart
    if (input.wasLightSessionIntended || avgRPE <= 7) {
      contextScore = 95
      signal = 'Smart adjustment for lower readiness'
    } else if (avgRPE <= 7.5) {
      contextScore = 75
      signal = 'Acceptable effort given low readiness'
    } else {
      contextScore = 50
      signal = 'High effort despite low readiness'
    }
  }
  
  return { score: clamp(contextScore, 0, 100), signal }
}

/**
 * Calculate effort score based on RPE appropriateness for session type (0-100)
 */
function calculateEffortScore(input: SessionPerformanceInput): { score: number; signal: string } {
  const targets = SESSION_TYPE_RPE_TARGETS[input.sessionType]
  const avgRPE = input.averageRPE
  
  // If no RPE data, assume moderate effort
  if (avgRPE === undefined) {
    return { score: 70, signal: 'Effort tracking not available' }
  }
  
  let effortScore: number
  let signal: string
  
  // Check if RPE is in ideal range
  if (avgRPE >= targets.min && avgRPE <= targets.max) {
    // Within acceptable range
    const distanceFromIdeal = Math.abs(avgRPE - targets.ideal)
    effortScore = 100 - (distanceFromIdeal * 10)
    
    if (distanceFromIdeal <= 0.5) {
      signal = 'Effort precisely matched session intent'
    } else {
      signal = 'Effort appropriate for session type'
    }
  } else if (avgRPE < targets.min) {
    // Under-effort (not necessarily bad)
    const underAmount = targets.min - avgRPE
    effortScore = 80 - (underAmount * 10)
    signal = 'Lower effort than typical for session type'
  } else {
    // Over-effort (may indicate pushing too hard)
    const overAmount = avgRPE - targets.max
    effortScore = 75 - (overAmount * 15)
    signal = 'Higher effort than intended for session type'
  }
  
  // Bonus for band progression
  if (input.bandProgressionMade) {
    effortScore += 5
    signal = 'Progress made with reduced assistance'
  }
  
  return { score: clamp(effortScore, 0, 100), signal }
}

/**
 * Determine performance tier from score
 */
function getTierFromScore(score: number): PerformanceTier {
  if (score >= TIER_THRESHOLDS.excellent) return 'excellent'
  if (score >= TIER_THRESHOLDS.strong) return 'strong'
  if (score >= TIER_THRESHOLDS.solid) return 'solid'
  return 'low'
}

/**
 * Determine adjustment signal based on performance and context
 */
function determineAdjustmentSignal(
  score: number,
  tier: PerformanceTier,
  input: SessionPerformanceInput,
  contextScore: number
): AdjustmentSignal {
  // Strong or excellent with good context = can progress
  if (tier === 'excellent' && contextScore >= 80) {
    return 'progress'
  }
  
  if (tier === 'strong' && contextScore >= 75) {
    // Only suggest progress if readiness was at least moderate
    if (input.readinessTier !== 'low') {
      return 'progress'
    }
  }
  
  // Low performance or concerning context = stay conservative
  if (tier === 'low') {
    return 'stay_conservative'
  }
  
  if (contextScore < 60) {
    return 'stay_conservative'
  }
  
  // Check for specific warning signs
  if (input.failedSets && input.failedSets >= 3) {
    return 'stay_conservative'
  }
  
  if (input.setsAboveTargetRPE && input.setsAboveTargetRPE >= 4) {
    return 'stay_conservative'
  }
  
  // Default to hold
  return 'hold'
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  tier: PerformanceTier,
  adjustmentSignal: AdjustmentSignal,
  input: SessionPerformanceInput,
  contributingSignals: string[]
): string {
  // Build contextual summary
  const sessionTypeName = input.sessionType.charAt(0).toUpperCase() + input.sessionType.slice(1)
  
  if (tier === 'excellent') {
    if (input.readinessTier === 'high') {
      return 'You capitalized on high readiness with excellent execution across the board.'
    }
    if (adjustmentSignal === 'progress') {
      return 'You exceeded session targets with stable effort, which may support progression soon.'
    }
    return 'Outstanding execution. The key work was completed with quality and appropriate effort.'
  }
  
  if (tier === 'strong') {
    if (input.readinessTier === 'low') {
      return 'Smart session management given lower readiness. Quality was preserved where it mattered.'
    }
    return 'You completed the key work with good quality and effort control.'
  }
  
  if (tier === 'solid') {
    if (input.readinessTier === 'low' || input.wasLightSessionIntended) {
      return "Today's session matched your recovery state and stayed productive."
    }
    if (contributingSignals.some(s => s.includes('partial'))) {
      return 'Partial completion but quality was maintained. Consistency builds progress.'
    }
    return 'A productive session that contributes to your training foundation.'
  }
  
  // Low tier
  if (input.failedSets && input.failedSets >= 3) {
    return 'Multiple failed sets suggest fatigue or technique breakdown. Rest and reassess.'
  }
  if (contributingSignals.some(s => s.includes('missed'))) {
    return 'Significant work was missed. Keeping the next session conservative is recommended.'
  }
  return 'Fatigue likely reduced output today, so keeping the next session conservative is recommended.'
}

/**
 * Determine confidence level based on available data
 */
function determineConfidence(input: SessionPerformanceInput): 'low' | 'medium' | 'high' {
  let dataPoints = 0
  
  if (input.averageRPE !== undefined) dataPoints++
  if (input.repCompletionRate !== undefined) dataPoints++
  if (input.holdCompletionRate !== undefined) dataPoints++
  if (input.readinessScore !== undefined) dataPoints++
  if (input.plannedSets > 0 && input.completedSets >= 0) dataPoints++
  if (input.actualDurationMinutes > 0) dataPoints++
  
  if (dataPoints >= 5) return 'high'
  if (dataPoints >= 3) return 'medium'
  return 'low'
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Calculate session performance score
 */
export function getSessionPerformance(input: SessionPerformanceInput): SessionPerformanceResult {
  // Calculate individual component scores
  const completion = calculateCompletionScore(input)
  const quality = calculateQualityScore(input)
  const context = calculateContextScore(input)
  const effort = calculateEffortScore(input)
  
  // Calculate weighted final score
  const performanceScore = Math.round(
    (completion.score * COMPONENT_WEIGHTS.completion) +
    (quality.score * COMPONENT_WEIGHTS.quality) +
    (context.score * COMPONENT_WEIGHTS.context) +
    (effort.score * COMPONENT_WEIGHTS.effort)
  )
  
  // Determine tier
  const performanceTier = getTierFromScore(performanceScore)
  
  // Collect contributing signals
  const contributingSignals: string[] = [
    completion.signal,
    quality.signal,
    context.signal,
    effort.signal,
  ].filter(s => s && s !== 'Session context not evaluated' && s !== 'Effort tracking not available')
  
  // Determine adjustment signal
  const adjustmentSignal = determineAdjustmentSignal(performanceScore, performanceTier, input, context.score)
  
  // Generate summary
  const summary = generateSummary(performanceTier, adjustmentSignal, input, contributingSignals)
  
  // Determine confidence
  const confidence = determineConfidence(input)
  
  return {
    performanceScore,
    performanceTier,
    summary,
    adjustmentSignal,
    contributingSignals,
    confidence,
    breakdown: {
      completionScore: Math.round(completion.score),
      qualityScore: Math.round(quality.score),
      contextScore: Math.round(context.score),
      effortScore: Math.round(effort.score),
    },
    calculatedAt: new Date().toISOString(),
    sessionId: input.sessionId,
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get tier label for display
 */
export function getPerformanceTierLabel(tier: PerformanceTier): string {
  const labels: Record<PerformanceTier, string> = {
    excellent: 'Excellent',
    strong: 'Strong',
    solid: 'Solid',
    low: 'Below Target',
  }
  return labels[tier]
}

/**
 * Get adjustment signal label for display
 */
export function getAdjustmentSignalLabel(signal: AdjustmentSignal): string {
  const labels: Record<AdjustmentSignal, string> = {
    progress: 'Ready to Progress',
    hold: 'Maintain Current',
    stay_conservative: 'Stay Conservative',
  }
  return labels[signal]
}

/**
 * Get tier color class
 */
export function getPerformanceTierColor(tier: PerformanceTier): string {
  const colors: Record<PerformanceTier, string> = {
    excellent: 'text-green-400',
    strong: 'text-emerald-400',
    solid: 'text-blue-400',
    low: 'text-amber-400',
  }
  return colors[tier]
}

/**
 * Get tier background color class
 */
export function getPerformanceTierBgColor(tier: PerformanceTier): string {
  const colors: Record<PerformanceTier, string> = {
    excellent: 'bg-green-500/10 border-green-500/30',
    strong: 'bg-emerald-500/10 border-emerald-500/30',
    solid: 'bg-blue-500/10 border-blue-500/30',
    low: 'bg-amber-500/10 border-amber-500/30',
  }
  return colors[tier]
}

/**
 * Get adjustment signal color
 */
export function getAdjustmentSignalColor(signal: AdjustmentSignal): string {
  const colors: Record<AdjustmentSignal, string> = {
    progress: 'text-green-400 bg-green-500/10',
    hold: 'text-blue-400 bg-blue-500/10',
    stay_conservative: 'text-amber-400 bg-amber-500/10',
  }
  return colors[signal]
}

/**
 * Create input from session stats (convenience function for workout summary)
 */
export function createPerformanceInputFromStats(
  stats: {
    completedSets: number
    totalSets: number
    elapsedSeconds: number
    averageRPE?: number
  },
  completedSets: Array<{
    targetReps: number
    actualReps: number
    targetRPE: number
    actualRPE: number
  }>,
  sessionType: SessionType = 'mixed',
  sessionName?: string,
  readiness?: DailyReadinessResult
): SessionPerformanceInput {
  // Calculate rep completion rate
  let totalTargetReps = 0
  let totalActualReps = 0
  let setsAboveTargetRPE = 0
  let maxRPE = 0
  let failedSets = 0
  
  for (const set of completedSets) {
    totalTargetReps += set.targetReps
    totalActualReps += set.actualReps
    if (set.actualRPE > set.targetRPE) {
      setsAboveTargetRPE++
    }
    if (set.actualRPE > maxRPE) {
      maxRPE = set.actualRPE
    }
    // Consider failed if less than 50% of target reps
    if (set.actualReps < set.targetReps * 0.5) {
      failedSets++
    }
  }
  
  const repCompletionRate = totalTargetReps > 0 
    ? (totalActualReps / totalTargetReps) * 100 
    : 100
  
  return {
    sessionType,
    sessionName,
    plannedSets: stats.totalSets,
    completedSets: stats.completedSets,
    plannedExercises: stats.totalSets, // Approximate
    completedExercises: stats.completedSets,
    actualDurationMinutes: Math.round(stats.elapsedSeconds / 60),
    averageRPE: stats.averageRPE,
    maxRPE: maxRPE || undefined,
    targetRPE: SESSION_TYPE_RPE_TARGETS[sessionType].ideal,
    repCompletionRate,
    setsAboveTargetRPE,
    failedSets,
    readinessScore: readiness?.readinessScore,
    readinessTier: readiness?.readinessTier,
    wasLightSessionIntended: readiness?.recommendation === 'light',
  }
}

/**
 * Get a fallback result when insufficient data
 */
export function getFallbackPerformanceResult(): SessionPerformanceResult {
  return {
    performanceScore: 60,
    performanceTier: 'solid',
    summary: 'Log more session detail to improve performance scoring.',
    adjustmentSignal: 'hold',
    contributingSignals: ['Limited session data available'],
    confidence: 'low',
    breakdown: {
      completionScore: 70,
      qualityScore: 60,
      contextScore: 60,
      effortScore: 60,
    },
    calculatedAt: new Date().toISOString(),
  }
}
