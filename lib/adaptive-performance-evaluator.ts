/**
 * Adaptive Performance Evaluator
 * 
 * [LIVE-EXECUTION-TRUTH] STEP 5: Post-set adaptive recommendation evaluator
 * 
 * Evaluates each logged set for a skill/progression-sensitive exercise and determines
 * whether to recommend easier progressions, assisted variants, or band adjustments.
 */

import type { ResistanceBandColor } from './band-progression-engine'
import type { RPEValue } from './rpe-adjustment-engine'

// =============================================================================
// TYPES
// =============================================================================

export type AdaptiveRecommendation = 
  | 'keep_current'
  | 'recommend_assistance'
  | 'recommend_easier_progression'
  | 'recommend_reduce_band_assistance'
  | 'recommend_more_assistance'

export interface SetPerformanceData {
  setNumber: number
  targetReps: number
  actualReps: number
  targetHoldSeconds?: number
  actualHoldSeconds?: number
  targetRPE: number
  actualRPE: RPEValue
  bandUsed: ResistanceBandColor | 'none'
}

export interface ExerciseExecutionTruth {
  sourceSkill: string | null
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  usesConservativeStart: boolean
  assistedRecommended: boolean
  assistedAllowed: boolean
  bandRecommended: boolean
  recommendedBandColor: ResistanceBandColor | null
  bandSelectable: boolean
  fallbackEasierExerciseId: string | null
  fallbackEasierExerciseName: string | null
  fallbackEasierBandColor: ResistanceBandColor | null
  downgradeTrigger: {
    highRpeThreshold: number
    missedTargetThreshold: number
    allowAutoAdjust: boolean
  } | null
  explanationNote: string | null
}

export interface AdaptiveRecommendationResult {
  recommendation: AdaptiveRecommendation
  confidence: 'high' | 'moderate' | 'low'
  reason: string
  coachingMessage: string | null
  suggestedAction: {
    type: 'switch_exercise' | 'add_band' | 'change_band' | 'remove_band' | 'none'
    targetExerciseId?: string
    targetExerciseName?: string
    targetBandColor?: ResistanceBandColor | null
  }
  triggerInputs: {
    rpeTooHigh: boolean
    targetMissedSignificantly: boolean
    repeatedFailures: boolean
    unassistedAttemptFailed: boolean
  }
}

export interface SessionPerformanceContext {
  completedSets: SetPerformanceData[]
  exerciseIndex: number
  executionTruth: ExerciseExecutionTruth | null | undefined
  isHoldExercise: boolean
  exerciseName: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Band order from lightest to heaviest assistance
const BAND_ASSISTANCE_ORDER: ResistanceBandColor[] = ['yellow', 'red', 'black', 'purple', 'green', 'blue']

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the next heavier band (more assistance)
 */
function getNextHeavierBand(currentBand: ResistanceBandColor | 'none'): ResistanceBandColor | null {
  if (currentBand === 'none') return 'yellow' // Start with lightest
  const currentIndex = BAND_ASSISTANCE_ORDER.indexOf(currentBand)
  if (currentIndex === -1 || currentIndex >= BAND_ASSISTANCE_ORDER.length - 1) {
    return null // Already at heaviest or not found
  }
  return BAND_ASSISTANCE_ORDER[currentIndex + 1]
}

/**
 * Get the next lighter band (less assistance)
 */
function getNextLighterBand(currentBand: ResistanceBandColor): ResistanceBandColor | null {
  const currentIndex = BAND_ASSISTANCE_ORDER.indexOf(currentBand)
  if (currentIndex <= 0) return null // Already at lightest or not found
  return BAND_ASSISTANCE_ORDER[currentIndex - 1]
}

// =============================================================================
// MAIN EVALUATOR
// =============================================================================

/**
 * Evaluate a completed set and determine if adaptive recommendation is needed.
 * 
 * This is called after each logged set to check performance against targets
 * and recommend progressions, assistance, or band changes when warranted.
 */
export function evaluateSetPerformance(
  currentSet: SetPerformanceData,
  context: SessionPerformanceContext
): AdaptiveRecommendationResult {
  const { executionTruth, completedSets, isHoldExercise, exerciseName } = context
  
  // Default result: no recommendation needed
  const defaultResult: AdaptiveRecommendationResult = {
    recommendation: 'keep_current',
    confidence: 'high',
    reason: 'Performance within acceptable range',
    coachingMessage: null,
    suggestedAction: { type: 'none' },
    triggerInputs: {
      rpeTooHigh: false,
      targetMissedSignificantly: false,
      repeatedFailures: false,
      unassistedAttemptFailed: false,
    },
  }
  
  // If no executionTruth, we can't make intelligent recommendations
  if (!executionTruth) {
    return defaultResult
  }
  
  // Get downgrade thresholds from executionTruth
  const thresholds = executionTruth.downgradeTrigger ?? {
    highRpeThreshold: 9,
    missedTargetThreshold: 0.5,
    allowAutoAdjust: false,
  }
  
  // ==========================================================================
  // TRIGGER EVALUATION
  // ==========================================================================
  
  // 1. Check if RPE is too high
  const rpeTooHigh = currentSet.actualRPE >= thresholds.highRpeThreshold
  
  // 2. Check if target was missed significantly
  let targetMissedSignificantly = false
  if (isHoldExercise && currentSet.targetHoldSeconds && currentSet.actualHoldSeconds !== undefined) {
    const holdRatio = currentSet.actualHoldSeconds / currentSet.targetHoldSeconds
    targetMissedSignificantly = holdRatio < thresholds.missedTargetThreshold
  } else {
    const repRatio = currentSet.actualReps / currentSet.targetReps
    targetMissedSignificantly = repRatio < thresholds.missedTargetThreshold
  }
  
  // 3. Check for repeated failures (multiple poor sets in this exercise)
  const poorSetsInExercise = completedSets.filter(s => {
    const highRpe = s.actualRPE >= thresholds.highRpeThreshold
    let missedTarget = false
    if (isHoldExercise && s.targetHoldSeconds && s.actualHoldSeconds !== undefined) {
      missedTarget = s.actualHoldSeconds / s.targetHoldSeconds < thresholds.missedTargetThreshold
    } else {
      missedTarget = s.actualReps / s.targetReps < thresholds.missedTargetThreshold
    }
    return highRpe || missedTarget
  })
  const repeatedFailures = poorSetsInExercise.length >= 2
  
  // 4. Check if this is an unassisted attempt that failed when assisted is allowed
  const unassistedAttemptFailed = 
    executionTruth.assistedAllowed && 
    currentSet.bandUsed === 'none' && 
    (rpeTooHigh || targetMissedSignificantly)
  
  const triggerInputs = {
    rpeTooHigh,
    targetMissedSignificantly,
    repeatedFailures,
    unassistedAttemptFailed,
  }
  
  // ==========================================================================
  // RECOMMENDATION LOGIC
  // ==========================================================================
  
  // Priority 1: Unassisted attempt failed when assistance is available
  if (unassistedAttemptFailed) {
    const recommendedBand = executionTruth.recommendedBandColor ?? 'purple'
    return {
      recommendation: 'recommend_assistance',
      confidence: 'high',
      reason: 'Unassisted attempt showed high difficulty; band assistance would improve quality',
      coachingMessage: `Adaptive recommends adding band assistance (${recommendedBand}) for ${exerciseName}. Quality reps with assistance build better strength than struggling without.`,
      suggestedAction: {
        type: 'add_band',
        targetBandColor: recommendedBand,
      },
      triggerInputs,
    }
  }
  
  // Priority 2: RPE too high with band - need more assistance
  if (rpeTooHigh && currentSet.bandUsed !== 'none') {
    const heavierBand = getNextHeavierBand(currentSet.bandUsed)
    if (heavierBand) {
      return {
        recommendation: 'recommend_more_assistance',
        confidence: 'moderate',
        reason: `RPE ${currentSet.actualRPE} indicates current band assistance is insufficient`,
        coachingMessage: `RPE was ${currentSet.actualRPE} - consider using ${heavierBand} band for better quality.`,
        suggestedAction: {
          type: 'change_band',
          targetBandColor: heavierBand,
        },
        triggerInputs,
      }
    }
  }
  
  // Priority 3: Repeated failures - recommend easier progression
  if (repeatedFailures && executionTruth.fallbackEasierExerciseId) {
    return {
      recommendation: 'recommend_easier_progression',
      confidence: 'high',
      reason: 'Multiple sets below target suggest current progression is too difficult',
      coachingMessage: `Adaptive recommends switching to ${executionTruth.fallbackEasierExerciseName} based on performance. Build quality here before progressing.`,
      suggestedAction: {
        type: 'switch_exercise',
        targetExerciseId: executionTruth.fallbackEasierExerciseId,
        targetExerciseName: executionTruth.fallbackEasierExerciseName ?? undefined,
        targetBandColor: executionTruth.fallbackEasierBandColor,
      },
      triggerInputs,
    }
  }
  
  // Priority 4: Single poor set with RPE too high or target missed - mild recommendation
  if (rpeTooHigh || targetMissedSignificantly) {
    // If we have an easier fallback, suggest it
    if (executionTruth.fallbackEasierExerciseId) {
      return {
        recommendation: 'recommend_easier_progression',
        confidence: 'low',
        reason: rpeTooHigh 
          ? `RPE ${currentSet.actualRPE} suggests exercise may be too challenging`
          : 'Target significantly missed, easier progression may help',
        coachingMessage: rpeTooHigh
          ? `That set felt hard (RPE ${currentSet.actualRPE}). Consider switching to ${executionTruth.fallbackEasierExerciseName} for better quality.`
          : `Target was missed significantly. Consider ${executionTruth.fallbackEasierExerciseName} for more achievable progression.`,
        suggestedAction: {
          type: 'switch_exercise',
          targetExerciseId: executionTruth.fallbackEasierExerciseId,
          targetExerciseName: executionTruth.fallbackEasierExerciseName ?? undefined,
          targetBandColor: executionTruth.fallbackEasierBandColor,
        },
        triggerInputs,
      }
    }
    
    // If band assistance is available but not being used
    if (executionTruth.assistedAllowed && currentSet.bandUsed === 'none') {
      return {
        recommendation: 'recommend_assistance',
        confidence: 'low',
        reason: 'Performance below target; band assistance may help',
        coachingMessage: `Consider adding band assistance for better quality reps.`,
        suggestedAction: {
          type: 'add_band',
          targetBandColor: executionTruth.recommendedBandColor ?? 'purple',
        },
        triggerInputs,
      }
    }
  }
  
  // Priority 5: Check if performance is GOOD and we might recommend reducing assistance
  const performanceExcellent = 
    currentSet.actualRPE <= 7 && 
    (isHoldExercise 
      ? (currentSet.actualHoldSeconds ?? 0) >= (currentSet.targetHoldSeconds ?? 0)
      : currentSet.actualReps >= currentSet.targetReps)
  
  if (performanceExcellent && currentSet.bandUsed !== 'none') {
    // Good performance with band - might be ready to reduce assistance
    const lighterBand = getNextLighterBand(currentSet.bandUsed)
    
    // Only suggest reducing assistance after multiple good sets
    const goodSetsWithBand = completedSets.filter(s => 
      s.bandUsed !== 'none' && 
      s.actualRPE <= 7 && 
      (isHoldExercise 
        ? (s.actualHoldSeconds ?? 0) >= (s.targetHoldSeconds ?? 0)
        : s.actualReps >= s.targetReps)
    )
    
    if (goodSetsWithBand.length >= 2) {
      return {
        recommendation: 'recommend_reduce_band_assistance',
        confidence: 'moderate',
        reason: 'Consistent good performance suggests readiness for less assistance',
        coachingMessage: lighterBand 
          ? `Great work! You might be ready to try ${lighterBand} band (less assistance) next time.`
          : `Excellent performance! You may be ready to attempt without band assistance soon.`,
        suggestedAction: {
          type: lighterBand ? 'change_band' : 'remove_band',
          targetBandColor: lighterBand,
        },
        triggerInputs,
      }
    }
  }
  
  // No recommendation needed
  return defaultResult
}

/**
 * Format a coaching message based on the recommendation
 */
export function formatAdaptiveCoachingMessage(result: AdaptiveRecommendationResult): string {
  if (!result.coachingMessage) {
    return ''
  }
  return result.coachingMessage
}

/**
 * Check if a recommendation should be shown to the user
 */
export function shouldShowRecommendation(result: AdaptiveRecommendationResult): boolean {
  return result.recommendation !== 'keep_current'
}
