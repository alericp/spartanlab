/**
 * Banded Progression Integration Engine
 * 
 * Bridges the existing band-progression-engine with SpartanLab's core systems:
 * - Skill Progression Graph Engine
 * - SkillState / readiness engine
 * - Weak Point Detection Engine
 * - Program Builder
 * - Exercise Intelligence Layer
 * - Performance Envelope Modeling
 * 
 * This layer makes band-assisted work a real part of the AI engine,
 * not just an ignored workaround.
 */

import {
  type ResistanceBandColor,
  type ProgressionAnalysis,
  type BandProgressionSummary,
  BAND_ASSISTANCE_LEVEL,
  BAND_SHORT_LABELS,
  analyzeProgression,
  calculateBandProgressionSummary,
  getExerciseBandHistory,
  supportsBandAssistance,
  getNextLighterBand,
  BAND_ORDER,
  PROGRESSION_THRESHOLDS,
} from './band-progression-engine'
import type { SkillGraphId } from './skill-progression-graph-engine'
import type { WeakPointType } from './weak-point-engine'

// =============================================================================
// ASSISTANCE LEVEL ABSTRACTION
// =============================================================================

/**
 * Normalized assistance levels for consistent processing
 */
export type AssistanceLevel =
  | 'very_high_assistance'  // Blue band or equivalent
  | 'high_assistance'       // Green band or equivalent
  | 'moderate_assistance'   // Purple band or equivalent
  | 'low_assistance'        // Black band or equivalent
  | 'minimal_assistance'    // Red/Yellow band or equivalent
  | 'unassisted'            // No band

/**
 * Map band color to normalized assistance level
 */
export function bandToAssistanceLevel(band: ResistanceBandColor | null): AssistanceLevel {
  if (!band) return 'unassisted'
  
  const mapping: Record<ResistanceBandColor, AssistanceLevel> = {
    blue: 'very_high_assistance',
    green: 'high_assistance',
    purple: 'moderate_assistance',
    black: 'low_assistance',
    red: 'minimal_assistance',
    yellow: 'minimal_assistance',
  }
  return mapping[band]
}

/**
 * Map assistance level to approximate band
 */
export function assistanceLevelToBand(level: AssistanceLevel): ResistanceBandColor | null {
  const mapping: Record<AssistanceLevel, ResistanceBandColor | null> = {
    very_high_assistance: 'blue',
    high_assistance: 'green',
    moderate_assistance: 'purple',
    low_assistance: 'black',
    minimal_assistance: 'red',
    unassisted: null,
  }
  return mapping[level]
}

/**
 * Get numeric assistance factor (0 = unassisted, 1 = maximum assistance)
 */
export function getAssistanceFactor(level: AssistanceLevel): number {
  const factors: Record<AssistanceLevel, number> = {
    very_high_assistance: 1.0,
    high_assistance: 0.8,
    moderate_assistance: 0.6,
    low_assistance: 0.4,
    minimal_assistance: 0.2,
    unassisted: 0,
  }
  return factors[level]
}

// =============================================================================
// BANDED PROGRESSION MODEL (Extended)
// =============================================================================

/**
 * Extended banded progression entry for tracking
 */
export interface BandedProgressionEntry {
  bandedProgressionId: string
  athleteId: string
  exerciseId: string
  exerciseName: string
  skillTarget: SkillGraphId | null
  bandLevel: AssistanceLevel
  bandColor: ResistanceBandColor | null
  assistanceEstimate: number  // 0-100 percentage
  repCount: number | null
  holdDuration: number | null
  quality: 'clean' | 'shaky' | 'failed'
  rpe: number | null
  sessionDate: string
  confidenceScore: number
  notes: string | null
}

/**
 * Skill-level assistance tracking summary
 */
export interface SkillAssistanceProfile {
  skillId: SkillGraphId
  skillName: string
  currentAssistanceLevel: AssistanceLevel
  currentBandColor: ResistanceBandColor | null
  assistanceTrend: 'reducing' | 'stable' | 'increasing'
  sessionsAtCurrentLevel: number
  readinessImpact: number  // -20 to +20 adjustment to readiness
  progressionBlocker: boolean
  blockerReason: string | null
  recommendedNextStep: 'reduce_assistance' | 'maintain' | 'increase_assistance' | 'attempt_unassisted'
}

// =============================================================================
// ASSISTANCE REGISTRY WITH ESTIMATES
// =============================================================================

/**
 * Estimated assistance in pounds/kg for common band colors
 * (Varies by manufacturer but provides relative guidance)
 */
export const BAND_ASSISTANCE_ESTIMATES: Record<ResistanceBandColor, { minLbs: number; maxLbs: number; typicalLbs: number }> = {
  yellow: { minLbs: 2, maxLbs: 15, typicalLbs: 5 },
  red: { minLbs: 10, maxLbs: 35, typicalLbs: 20 },
  black: { minLbs: 25, maxLbs: 65, typicalLbs: 40 },
  purple: { minLbs: 40, maxLbs: 80, typicalLbs: 55 },
  green: { minLbs: 50, maxLbs: 120, typicalLbs: 75 },
  blue: { minLbs: 65, maxLbs: 175, typicalLbs: 100 },
}

/**
 * Calculate approximate assistance percentage based on band and athlete weight
 */
export function estimateAssistancePercentage(
  band: ResistanceBandColor | null,
  athleteWeightLbs: number = 170
): number {
  if (!band) return 0
  
  const estimate = BAND_ASSISTANCE_ESTIMATES[band]
  const assistanceLbs = estimate.typicalLbs
  
  // Assistance percentage of bodyweight
  return Math.round((assistanceLbs / athleteWeightLbs) * 100)
}

// =============================================================================
// SKILL STATE INTEGRATION
// =============================================================================

/**
 * Calculate readiness adjustment based on assistance history
 * Returns a value from -20 to +20 to adjust base readiness
 */
export function calculateAssistanceReadinessAdjustment(
  exerciseId: string,
  targetSkill: SkillGraphId
): { adjustment: number; reason: string } {
  const analysis = analyzeProgression(exerciseId, exerciseId)
  
  if (analysis.status === 'new') {
    return { adjustment: 0, reason: 'No assistance history' }
  }
  
  const assistanceLevel = bandToAssistanceLevel(analysis.currentBand)
  const assistanceFactor = getAssistanceFactor(assistanceLevel)
  
  // Base adjustment: higher assistance = lower readiness credit
  let adjustment = 0
  let reason = ''
  
  switch (analysis.status) {
    case 'ready_to_reduce':
      // Ready to progress - positive readiness signal
      adjustment = Math.round(15 * (1 - assistanceFactor * 0.5))
      reason = 'Consistent performance with current assistance suggests improving readiness'
      break
      
    case 'progressing':
      // Making progress - moderate positive signal
      adjustment = Math.round(10 * (1 - assistanceFactor * 0.6))
      reason = 'Improving performance under assistance indicates building capacity'
      break
      
    case 'maintaining':
      // Stable - neutral to slight positive
      adjustment = Math.round(5 * (1 - assistanceFactor * 0.7))
      reason = 'Stable performance with assistance'
      break
      
    case 'stagnating':
      // Stuck - slight negative signal
      adjustment = -5
      reason = 'Stagnation at current assistance level may indicate a limiting factor'
      break
      
    case 'regressing':
      // Getting worse - negative signal
      adjustment = -10
      reason = 'Performance decline suggests readiness concerns'
      break
  }
  
  // Apply assistance-level penalty
  // Very high assistance = less credit toward unassisted readiness
  const assistancePenalty = Math.round(assistanceFactor * 10)
  adjustment -= assistancePenalty
  
  // Clamp to -20 to +20
  adjustment = Math.max(-20, Math.min(20, adjustment))
  
  return { adjustment, reason }
}

/**
 * Calculate confidence score for progression node based on assistance history
 */
export function calculateNodeConfidenceFromAssistance(
  exerciseId: string,
  nodeId: string
): { confidence: number; assistanceAdjusted: boolean; details: string } {
  const analysis = analyzeProgression(exerciseId, exerciseId)
  
  if (analysis.status === 'new') {
    return {
      confidence: 0,
      assistanceAdjusted: false,
      details: 'No logged attempts',
    }
  }
  
  const assistanceLevel = bandToAssistanceLevel(analysis.currentBand)
  const assistanceFactor = getAssistanceFactor(assistanceLevel)
  
  // Base confidence from analysis
  let baseConfidence = analysis.confidence
  
  // Reduce confidence based on assistance level
  // Unassisted performance = full confidence credit
  // High assistance = significantly reduced confidence credit
  const confidenceMultiplier = 1 - (assistanceFactor * 0.6)
  const adjustedConfidence = Math.round(baseConfidence * confidenceMultiplier)
  
  return {
    confidence: adjustedConfidence,
    assistanceAdjusted: assistanceFactor > 0,
    details: assistanceFactor > 0
      ? `Confidence adjusted for ${assistanceLevel.replace(/_/g, ' ')} (${analysis.currentBand} band)`
      : 'Unassisted performance',
  }
}

// =============================================================================
// WEAK POINT DETECTION INTEGRATION
// =============================================================================

/**
 * Map assistance patterns to potential weak points
 */
export interface AssistanceWeakPointSignal {
  weakPoint: WeakPointType
  confidence: number
  reason: string
  suggestedFocus: string
}

/**
 * Exercise-to-weak-point mapping for assistance analysis
 */
const ASSISTANCE_WEAK_POINT_MAP: Record<string, { weakPoints: WeakPointType[]; bodyweightThreshold: AssistanceLevel }[]> = {
  muscle_up: [
    { weakPoints: ['explosive_pull', 'high_pull_strength'], bodyweightThreshold: 'moderate_assistance' },
    { weakPoints: ['transition_control', 'straight_bar_dip'], bodyweightThreshold: 'low_assistance' },
  ],
  muscle_up_transition: [
    { weakPoints: ['transition_control', 'straight_bar_dip'], bodyweightThreshold: 'moderate_assistance' },
  ],
  front_lever_tuck: [
    { weakPoints: ['straight_arm_pull', 'scapular_control'], bodyweightThreshold: 'moderate_assistance' },
  ],
  front_lever_adv_tuck: [
    { weakPoints: ['straight_arm_pull', 'core_compression'], bodyweightThreshold: 'low_assistance' },
  ],
  front_lever_straddle: [
    { weakPoints: ['straight_arm_pull', 'lat_strength'], bodyweightThreshold: 'moderate_assistance' },
  ],
  front_lever_full: [
    { weakPoints: ['straight_arm_pull', 'lat_strength', 'core_compression'], bodyweightThreshold: 'high_assistance' },
  ],
  tuck_planche: [
    { weakPoints: ['straight_arm_push', 'shoulder_stability'], bodyweightThreshold: 'moderate_assistance' },
  ],
  adv_tuck_planche: [
    { weakPoints: ['straight_arm_push', 'wrist_tolerance'], bodyweightThreshold: 'low_assistance' },
  ],
  straddle_planche: [
    { weakPoints: ['straight_arm_push', 'shoulder_stability', 'wrist_tolerance'], bodyweightThreshold: 'high_assistance' },
  ],
  iron_cross: [
    { weakPoints: ['ring_support', 'straight_arm_push', 'shoulder_tendon'], bodyweightThreshold: 'very_high_assistance' },
  ],
  ring_muscle_up: [
    { weakPoints: ['ring_support', 'explosive_pull', 'transition_control'], bodyweightThreshold: 'moderate_assistance' },
  ],
  one_arm_pullup: [
    { weakPoints: ['pulling_strength', 'grip_strength', 'scapular_control'], bodyweightThreshold: 'high_assistance' },
  ],
}

/**
 * Detect weak points from assistance patterns
 */
export function detectWeakPointsFromAssistance(exerciseId: string): AssistanceWeakPointSignal[] {
  const analysis = analyzeProgression(exerciseId, exerciseId)
  const signals: AssistanceWeakPointSignal[] = []
  
  if (analysis.status === 'new' || !analysis.currentBand) {
    return signals
  }
  
  const currentAssistance = bandToAssistanceLevel(analysis.currentBand)
  const exerciseMap = ASSISTANCE_WEAK_POINT_MAP[exerciseId]
  
  if (!exerciseMap) return signals
  
  for (const mapping of exerciseMap) {
    const thresholdFactor = getAssistanceFactor(mapping.bodyweightThreshold)
    const currentFactor = getAssistanceFactor(currentAssistance)
    
    // If current assistance is higher than threshold, flag weak points
    if (currentFactor > thresholdFactor) {
      for (const weakPoint of mapping.weakPoints) {
        const confidence = Math.round((currentFactor - thresholdFactor) * 100)
        signals.push({
          weakPoint,
          confidence: Math.min(85, 50 + confidence),
          reason: `Requires ${currentAssistance.replace(/_/g, ' ')} for ${exerciseId.replace(/_/g, ' ')}`,
          suggestedFocus: getWeakPointFocusSuggestion(weakPoint),
        })
      }
    }
    
    // If stagnating, amplify weak point signals
    if (analysis.status === 'stagnating') {
      for (const weakPoint of mapping.weakPoints) {
        const existing = signals.find(s => s.weakPoint === weakPoint)
        if (existing) {
          existing.confidence = Math.min(95, existing.confidence + 15)
          existing.reason += ' (stagnation detected)'
        } else {
          signals.push({
            weakPoint,
            confidence: 60,
            reason: `Stagnation at ${exerciseId.replace(/_/g, ' ')} suggests limiting factor`,
            suggestedFocus: getWeakPointFocusSuggestion(weakPoint),
          })
        }
      }
    }
  }
  
  return signals
}

function getWeakPointFocusSuggestion(weakPoint: WeakPointType): string {
  const suggestions: Partial<Record<WeakPointType, string>> = {
    explosive_pull: 'High pulls, weighted pull-ups, explosive pull-up variations',
    transition_control: 'Slow muscle-up negatives, transition drills, straight bar dip work',
    straight_arm_pull: 'Front lever rows, straight-arm pulldown variations',
    straight_arm_push: 'Planche leans, pseudo planche push-ups, support holds',
    scapular_control: 'Scapular pulls, scapular push-ups, band face pulls',
    core_compression: 'L-sit work, compression drills, hanging leg raises',
    ring_support: 'Ring support holds, ring turned out holds',
    shoulder_stability: 'External rotation work, band shoulder exercises',
    pulling_strength: 'Weighted pull-ups, row variations',
    lat_strength: 'Weighted pull-ups, straight-arm pulldowns',
  }
  return suggestions[weakPoint] || 'Address this weak point with targeted accessory work'
}

// =============================================================================
// PROGRAM BUILDER INTEGRATION
// =============================================================================

/**
 * Exercise selection recommendation based on assistance history
 */
export interface AssistanceAwareExerciseRecommendation {
  exerciseId: string
  exerciseName: string
  useAssistance: boolean
  recommendedBand: ResistanceBandColor | null
  recommendedAssistance: AssistanceLevel
  rationale: string
  alternativeIfStalled: string | null
}

/**
 * Get assistance-aware exercise recommendation
 */
export function getAssistanceAwareRecommendation(
  exerciseId: string,
  exerciseName: string,
  athleteLevel: 'beginner' | 'intermediate' | 'advanced'
): AssistanceAwareExerciseRecommendation {
  if (!supportsBandAssistance(exerciseId)) {
    return {
      exerciseId,
      exerciseName,
      useAssistance: false,
      recommendedBand: null,
      recommendedAssistance: 'unassisted',
      rationale: 'This exercise does not support band assistance',
      alternativeIfStalled: null,
    }
  }
  
  const analysis = analyzeProgression(exerciseId, exerciseName)
  
  // New exercise - recommend starting band
  if (analysis.status === 'new') {
    const startingBand = analysis.recommendedBand
    return {
      exerciseId,
      exerciseName,
      useAssistance: startingBand !== null,
      recommendedBand: startingBand,
      recommendedAssistance: bandToAssistanceLevel(startingBand),
      rationale: startingBand
        ? `Start with ${BAND_SHORT_LABELS[startingBand]} band to build confidence and technique`
        : 'Try unassisted first to establish baseline',
      alternativeIfStalled: null,
    }
  }
  
  // Ready to reduce assistance
  if (analysis.status === 'ready_to_reduce') {
    const nextBand = analysis.recommendedBand
    return {
      exerciseId,
      exerciseName,
      useAssistance: nextBand !== null,
      recommendedBand: nextBand,
      recommendedAssistance: bandToAssistanceLevel(nextBand),
      rationale: nextBand
        ? `Progress to ${BAND_SHORT_LABELS[nextBand]} band - you have shown consistent quality`
        : 'Ready to attempt unassisted - great progress!',
      alternativeIfStalled: null,
    }
  }
  
  // Regressing - may need more assistance
  if (analysis.status === 'regressing') {
    const suggestedBand = analysis.recommendedBand || analysis.currentBand
    return {
      exerciseId,
      exerciseName,
      useAssistance: true,
      recommendedBand: suggestedBand,
      recommendedAssistance: bandToAssistanceLevel(suggestedBand),
      rationale: analysis.reason,
      alternativeIfStalled: 'Consider focusing on prerequisite strength work',
    }
  }
  
  // Stagnating - maintain but flag
  if (analysis.status === 'stagnating') {
    return {
      exerciseId,
      exerciseName,
      useAssistance: analysis.currentBand !== null,
      recommendedBand: analysis.currentBand,
      recommendedAssistance: bandToAssistanceLevel(analysis.currentBand),
      rationale: `Maintain ${analysis.currentBand ? BAND_SHORT_LABELS[analysis.currentBand] + ' band' : 'current'} while addressing limiting factors`,
      alternativeIfStalled: 'Shift emphasis to accessory/support work for 1-2 weeks',
    }
  }
  
  // Default: maintain current
  return {
    exerciseId,
    exerciseName,
    useAssistance: analysis.currentBand !== null,
    recommendedBand: analysis.currentBand,
    recommendedAssistance: bandToAssistanceLevel(analysis.currentBand),
    rationale: analysis.recommendation,
    alternativeIfStalled: null,
  }
}

/**
 * Decide whether to use assisted or unassisted version for programming
 */
export function shouldUseAssistedVersion(
  exerciseId: string,
  context: {
    athleteLevel: 'beginner' | 'intermediate' | 'advanced'
    sessionFatigue: 'fresh' | 'normal' | 'fatigued'
    isDeloadWeek: boolean
    prioritizeQuality: boolean
  }
): { useAssisted: boolean; reason: string } {
  const analysis = analyzeProgression(exerciseId, exerciseId)
  
  // No history - base on athlete level and exercise difficulty
  if (analysis.status === 'new') {
    if (context.athleteLevel === 'beginner') {
      return { useAssisted: true, reason: 'Begin with assistance to build proper technique' }
    }
    return { useAssisted: false, reason: 'Attempt unassisted to establish baseline' }
  }
  
  // Deload week - use assistance for quality
  if (context.isDeloadWeek && analysis.currentBand) {
    return { useAssisted: true, reason: 'Maintain assistance during deload for recovery' }
  }
  
  // High fatigue - use assistance for safety
  if (context.sessionFatigue === 'fatigued' && analysis.currentBand) {
    return { useAssisted: true, reason: 'Use assistance due to accumulated fatigue' }
  }
  
  // Quality priority and struggling - use assistance
  if (context.prioritizeQuality && (analysis.status === 'stagnating' || analysis.status === 'regressing')) {
    return { useAssisted: true, reason: 'Prioritize movement quality with appropriate assistance' }
  }
  
  // Ready to progress - reduce or remove assistance
  if (analysis.status === 'ready_to_reduce') {
    const nextBand = analysis.recommendedBand
    if (!nextBand) {
      return { useAssisted: false, reason: 'Ready to attempt unassisted' }
    }
    return { useAssisted: true, reason: `Progress to lighter assistance (${BAND_SHORT_LABELS[nextBand]})` }
  }
  
  // Default: use current assistance level
  return {
    useAssisted: analysis.currentBand !== null,
    reason: analysis.currentBand 
      ? `Continue with ${BAND_SHORT_LABELS[analysis.currentBand]} band`
      : 'Continue unassisted training',
  }
}

// =============================================================================
// PERFORMANCE ENVELOPE INTEGRATION
// =============================================================================

/**
 * Calculate effective load for performance envelope (discounted by assistance)
 */
export function calculateEffectiveLoad(
  performanceValue: number,
  assistanceLevel: AssistanceLevel,
  metricType: 'reps' | 'hold_seconds' | 'weight'
): number {
  const assistanceFactor = getAssistanceFactor(assistanceLevel)
  
  // Discount factor: high assistance = less credit toward envelope
  const discountFactor = 1 - (assistanceFactor * 0.5)
  
  return Math.round(performanceValue * discountFactor)
}

/**
 * Determine if assisted performance should count toward envelope learning
 */
export function shouldCountForEnvelope(
  assistanceLevel: AssistanceLevel,
  quality: 'clean' | 'shaky' | 'failed'
): { shouldCount: boolean; weight: number; reason: string } {
  const assistanceFactor = getAssistanceFactor(assistanceLevel)
  
  // Failed sets don't count
  if (quality === 'failed') {
    return { shouldCount: false, weight: 0, reason: 'Failed sets excluded from envelope' }
  }
  
  // Very high assistance = minimal envelope learning
  if (assistanceFactor >= 0.8) {
    return {
      shouldCount: true,
      weight: 0.2,
      reason: 'High assistance provides limited envelope data',
    }
  }
  
  // Moderate assistance = partial credit
  if (assistanceFactor >= 0.4) {
    return {
      shouldCount: true,
      weight: 0.5,
      reason: 'Moderate assistance provides partial envelope data',
    }
  }
  
  // Low/no assistance = full credit
  return {
    shouldCount: true,
    weight: quality === 'clean' ? 1.0 : 0.7,
    reason: 'Low/no assistance provides full envelope data',
  }
}

// =============================================================================
// PROGRESSION GATING
// =============================================================================

/**
 * Check if athlete is ready to progress to next node based on assistance history
 */
export interface ProgressionGateResult {
  canProgress: boolean
  confidenceLevel: 'high' | 'moderate' | 'low'
  reason: string
  requirements: {
    met: string[]
    notMet: string[]
  }
  suggestedAction: 'progress' | 'reduce_assistance_first' | 'continue_building' | 'address_weak_points'
}

export function checkProgressionGate(
  exerciseId: string,
  targetNodeDifficulty: 'foundation' | 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'master'
): ProgressionGateResult {
  const analysis = analyzeProgression(exerciseId, exerciseId)
  const summary = calculateBandProgressionSummary(exerciseId, exerciseId)
  
  const requirements = {
    met: [] as string[],
    notMet: [] as string[],
  }
  
  // Requirement 1: Minimum sessions
  if (summary.totalSessions >= PROGRESSION_THRESHOLDS.minSessionsForProgression) {
    requirements.met.push(`${summary.totalSessions} sessions logged (min: ${PROGRESSION_THRESHOLDS.minSessionsForProgression})`)
  } else {
    requirements.notMet.push(`Need ${PROGRESSION_THRESHOLDS.minSessionsForProgression - summary.totalSessions} more sessions`)
  }
  
  // Requirement 2: Assistance level appropriate for target difficulty
  const currentAssistance = bandToAssistanceLevel(analysis.currentBand)
  const assistanceFactor = getAssistanceFactor(currentAssistance)
  
  const maxAssistanceForDifficulty: Record<string, number> = {
    foundation: 1.0,
    beginner: 0.8,
    intermediate: 0.6,
    advanced: 0.4,
    elite: 0.2,
    master: 0,
  }
  
  const maxAllowed = maxAssistanceForDifficulty[targetNodeDifficulty]
  
  if (assistanceFactor <= maxAllowed) {
    requirements.met.push(`Assistance level appropriate for ${targetNodeDifficulty} difficulty`)
  } else {
    requirements.notMet.push(`Current assistance too high for ${targetNodeDifficulty} - reduce to ${getAssistanceLevelName(maxAllowed)} or less`)
  }
  
  // Requirement 3: Performance quality
  if (analysis.signals.cleanSetRatio >= PROGRESSION_THRESHOLDS.minCleanSetsRatio) {
    requirements.met.push(`Clean set ratio: ${Math.round(analysis.signals.cleanSetRatio * 100)}%`)
  } else {
    requirements.notMet.push(`Clean set ratio too low: ${Math.round(analysis.signals.cleanSetRatio * 100)}% (need ${PROGRESSION_THRESHOLDS.minCleanSetsRatio * 100}%)`)
  }
  
  // Requirement 4: Not regressing
  if (analysis.status !== 'regressing') {
    requirements.met.push('Performance stable or improving')
  } else {
    requirements.notMet.push('Currently regressing - address before progressing')
  }
  
  // Determine result
  const canProgress = requirements.notMet.length === 0
  const confidenceLevel = requirements.notMet.length === 0 
    ? 'high' 
    : requirements.notMet.length === 1 
      ? 'moderate' 
      : 'low'
  
  let suggestedAction: ProgressionGateResult['suggestedAction']
  if (canProgress) {
    suggestedAction = 'progress'
  } else if (requirements.notMet.some(r => r.includes('assistance'))) {
    suggestedAction = 'reduce_assistance_first'
  } else if (analysis.status === 'stagnating') {
    suggestedAction = 'address_weak_points'
  } else {
    suggestedAction = 'continue_building'
  }
  
  return {
    canProgress,
    confidenceLevel,
    reason: canProgress 
      ? 'All progression requirements met'
      : `${requirements.notMet.length} requirement(s) not met`,
    requirements,
    suggestedAction,
  }
}

function getAssistanceLevelName(factor: number): string {
  if (factor >= 0.8) return 'high assistance'
  if (factor >= 0.6) return 'moderate assistance'
  if (factor >= 0.4) return 'low assistance'
  if (factor >= 0.2) return 'minimal assistance'
  return 'unassisted'
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

/**
 * Generate coach-style explanation for assistance decisions
 */
export function generateAssistanceExplanation(
  exerciseId: string,
  exerciseName: string,
  context: 'session_selection' | 'progression_decision' | 'weak_point_insight'
): string {
  const analysis = analyzeProgression(exerciseId, exerciseName)
  const summary = calculateBandProgressionSummary(exerciseId, exerciseName)
  
  if (analysis.status === 'new') {
    return `Starting ${exerciseName} with appropriate assistance to build technique and confidence.`
  }
  
  const currentBandName = analysis.currentBand ? BAND_SHORT_LABELS[analysis.currentBand] : 'no'
  
  switch (context) {
    case 'session_selection':
      if (analysis.status === 'ready_to_reduce') {
        return `You have been performing well with ${currentBandName} band. Ready to reduce assistance.`
      }
      if (analysis.status === 'stagnating') {
        return `Maintaining ${currentBandName} band while addressing underlying limiters.`
      }
      return `Continuing with ${currentBandName} band based on recent performance.`
      
    case 'progression_decision':
      if (analysis.status === 'ready_to_reduce') {
        const nextBand = analysis.recommendedBand
        return nextBand 
          ? `Consistent quality with ${currentBandName} band suggests readiness for ${BAND_SHORT_LABELS[nextBand]} band.`
          : `Strong performance indicates readiness to attempt ${exerciseName} unassisted.`
      }
      if (analysis.status === 'regressing') {
        return `Recent performance suggests maintaining or temporarily increasing assistance for quality.`
      }
      return `Continue building consistency with ${currentBandName} band before reducing assistance.`
      
    case 'weak_point_insight':
      const signals = detectWeakPointsFromAssistance(exerciseId)
      if (signals.length > 0) {
        const topSignal = signals[0]
        return `Assistance pattern suggests ${topSignal.weakPoint.replace(/_/g, ' ')} may be limiting. ${topSignal.suggestedFocus}`
      }
      return `Current assistance level is appropriate for your strength profile.`
      
    default:
      return analysis.recommendation
  }
}

/**
 * Generate concise assistance trend summary for athlete display
 */
export function generateAssistanceTrendSummary(exerciseId: string): string {
  const summary = calculateBandProgressionSummary(exerciseId, exerciseId)
  const analysis = analyzeProgression(exerciseId, exerciseId)
  
  if (summary.totalSessions === 0) {
    return 'No training history yet'
  }
  
  const bandHistory = summary.bandHistory
  if (bandHistory.length === 1) {
    return `Training with ${BAND_SHORT_LABELS[bandHistory[0].bandColor]} band (${bandHistory[0].sessionCount} sessions)`
  }
  
  // Check if assistance has been reducing
  const sortedByTime = [...bandHistory].sort((a, b) => 
    new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
  )
  
  if (sortedByTime.length >= 2) {
    const recent = sortedByTime[0]
    const previous = sortedByTime[1]
    
    const recentLevel = BAND_ASSISTANCE_LEVEL[recent.bandColor]
    const previousLevel = BAND_ASSISTANCE_LEVEL[previous.bandColor]
    
    if (recentLevel < previousLevel) {
      return `Progressed from ${BAND_SHORT_LABELS[previous.bandColor]} to ${BAND_SHORT_LABELS[recent.bandColor]} band`
    }
  }
  
  if (analysis.status === 'ready_to_reduce') {
    return `Ready to reduce assistance from ${summary.currentBand ? BAND_SHORT_LABELS[summary.currentBand] : 'current'} band`
  }
  
  return `Training with ${summary.currentBand ? BAND_SHORT_LABELS[summary.currentBand] : 'no'} band`
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Re-export from band-progression-engine for convenience
  type ResistanceBandColor,
  type ProgressionAnalysis,
  type BandProgressionSummary,
  BAND_ASSISTANCE_LEVEL,
  BAND_SHORT_LABELS,
  BAND_ORDER,
  analyzeProgression,
  calculateBandProgressionSummary,
  supportsBandAssistance,
  getNextLighterBand,
}
