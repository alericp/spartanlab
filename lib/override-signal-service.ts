// Override Signal Service
// Tracks exercise overrides as behavioral signals for the adaptive engine
// Signals help the AI understand athlete preferences and needs over time
// Now integrated with Enhanced Exercise Intelligence for smarter warnings

import {
  generateOverrideWarning,
  generateWhyThisExercise,
  scoreSubstitution,
  type AthleteExerciseContext,
  type SubstitutionQualityScore,
} from './enhanced-exercise-intelligence'

// =============================================================================
// TYPES
// =============================================================================

export type OverrideSignalType = 
  | 'skipped'              // Exercise was skipped
  | 'replaced'             // Exercise was replaced with alternative
  | 'progression_down'     // Athlete chose easier progression
  | 'progression_up'       // Athlete chose harder progression

export type SkipReason = 
  | 'equipment'            // Don't have the equipment
  | 'discomfort'           // Causes pain/discomfort
  | 'too_hard'             // Can't do it yet
  | 'time'                 // Running short on time
  | 'fatigue'              // Too tired for this today
  | 'preference'           // Just don't want to
  | 'other'

export interface OverrideSignal {
  id: string
  sessionId: string
  exerciseId: string
  exerciseName: string
  exerciseCategory: string
  signalType: OverrideSignalType
  reason?: SkipReason | string
  replacementExerciseId?: string
  replacementExerciseName?: string
  newProgression?: string
  timestamp: number
  date: string // ISO date for grouping
}

export interface OverrideSignalSummary {
  exerciseId: string
  exerciseName: string
  skipCount: number
  replaceCount: number
  progressionDownCount: number
  progressionUpCount: number
  mostCommonSkipReason: SkipReason | null
  lastSignalDate: string
}

export interface AdaptiveSignalFeedback {
  hasSignificantPatterns: boolean
  patterns: SignalPattern[]
  coachRecommendations: string[]
}

export interface SignalPattern {
  type: 'frequent_skip' | 'frequent_replace' | 'difficulty_mismatch' | 'equipment_issue'
  exerciseId?: string
  exerciseName?: string
  movementCategory?: string
  severity: 'low' | 'moderate' | 'high'
  description: string
  recommendation: string
}

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_override_signals'
const MAX_SIGNALS = 200 // Keep rolling window of signals

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function getStoredSignals(): OverrideSignal[] {
  if (!isBrowser()) return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function saveSignals(signals: OverrideSignal[]): void {
  if (!isBrowser()) return
  try {
    // Keep only most recent signals
    const trimmed = signals.slice(-MAX_SIGNALS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {}
}

// =============================================================================
// SIGNAL RECORDING
// =============================================================================

/**
 * Record an exercise skip signal
 */
export function recordSkipSignal(
  sessionId: string,
  exerciseId: string,
  exerciseName: string,
  exerciseCategory: string,
  reason: SkipReason
): OverrideSignal {
  const signal: OverrideSignal = {
    id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    exerciseId,
    exerciseName,
    exerciseCategory,
    signalType: 'skipped',
    reason,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
  }
  
  const signals = getStoredSignals()
  signals.push(signal)
  saveSignals(signals)
  
  return signal
}

/**
 * Record an exercise replacement signal
 */
export function recordReplaceSignal(
  sessionId: string,
  exerciseId: string,
  exerciseName: string,
  exerciseCategory: string,
  replacementExerciseId: string,
  replacementExerciseName: string,
  reason?: string
): OverrideSignal {
  const signal: OverrideSignal = {
    id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    exerciseId,
    exerciseName,
    exerciseCategory,
    signalType: 'replaced',
    reason,
    replacementExerciseId,
    replacementExerciseName,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
  }
  
  const signals = getStoredSignals()
  signals.push(signal)
  saveSignals(signals)
  
  return signal
}

/**
 * Record a progression adjustment signal
 */
export function recordProgressionSignal(
  sessionId: string,
  exerciseId: string,
  exerciseName: string,
  exerciseCategory: string,
  direction: 'up' | 'down',
  newProgression: string
): OverrideSignal {
  const signal: OverrideSignal = {
    id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    exerciseId,
    exerciseName,
    exerciseCategory,
    signalType: direction === 'up' ? 'progression_up' : 'progression_down',
    newProgression,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
  }
  
  const signals = getStoredSignals()
  signals.push(signal)
  saveSignals(signals)
  
  return signal
}

// =============================================================================
// SIGNAL ANALYSIS
// =============================================================================

/**
 * Get all override signals
 */
export function getOverrideSignals(): OverrideSignal[] {
  return getStoredSignals()
}

/**
 * Get signals for a specific exercise
 */
export function getSignalsForExercise(exerciseId: string): OverrideSignal[] {
  return getStoredSignals().filter(s => s.exerciseId === exerciseId)
}

/**
 * Get signals within a date range
 */
export function getSignalsInRange(startDate: string, endDate: string): OverrideSignal[] {
  return getStoredSignals().filter(s => s.date >= startDate && s.date <= endDate)
}

/**
 * Get signal summary for exercises
 */
export function getExerciseSignalSummaries(): OverrideSignalSummary[] {
  const signals = getStoredSignals()
  const exerciseMap = new Map<string, OverrideSignalSummary>()
  
  for (const signal of signals) {
    let summary = exerciseMap.get(signal.exerciseId)
    if (!summary) {
      summary = {
        exerciseId: signal.exerciseId,
        exerciseName: signal.exerciseName,
        skipCount: 0,
        replaceCount: 0,
        progressionDownCount: 0,
        progressionUpCount: 0,
        mostCommonSkipReason: null,
        lastSignalDate: signal.date,
      }
      exerciseMap.set(signal.exerciseId, summary)
    }
    
    switch (signal.signalType) {
      case 'skipped':
        summary.skipCount++
        break
      case 'replaced':
        summary.replaceCount++
        break
      case 'progression_down':
        summary.progressionDownCount++
        break
      case 'progression_up':
        summary.progressionUpCount++
        break
    }
    
    if (signal.date > summary.lastSignalDate) {
      summary.lastSignalDate = signal.date
    }
  }
  
  // Calculate most common skip reason per exercise
  for (const [exerciseId, summary] of exerciseMap) {
    const skipSignals = signals.filter(s => s.exerciseId === exerciseId && s.signalType === 'skipped')
    if (skipSignals.length > 0) {
      const reasonCounts = new Map<SkipReason, number>()
      for (const s of skipSignals) {
        if (s.reason) {
          const reason = s.reason as SkipReason
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
        }
      }
      let maxCount = 0
      let maxReason: SkipReason | null = null
      for (const [reason, count] of reasonCounts) {
        if (count > maxCount) {
          maxCount = count
          maxReason = reason
        }
      }
      summary.mostCommonSkipReason = maxReason
    }
  }
  
  return Array.from(exerciseMap.values())
}

/**
 * Analyze signals and generate adaptive feedback
 * Used by the program builder to make smarter decisions
 */
export function analyzeSignalsForAdaptive(recentDays: number = 14): AdaptiveSignalFeedback {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - recentDays)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]
  
  const recentSignals = getStoredSignals().filter(s => s.date >= cutoffStr)
  
  if (recentSignals.length === 0) {
    return {
      hasSignificantPatterns: false,
      patterns: [],
      coachRecommendations: [],
    }
  }
  
  const patterns: SignalPattern[] = []
  const recommendations: string[] = []
  
  // Analyze skip frequency by exercise
  const exerciseSkips = new Map<string, OverrideSignal[]>()
  for (const s of recentSignals) {
    if (s.signalType === 'skipped') {
      const existing = exerciseSkips.get(s.exerciseId) || []
      existing.push(s)
      exerciseSkips.set(s.exerciseId, existing)
    }
  }
  
  for (const [exerciseId, skips] of exerciseSkips) {
    if (skips.length >= 3) {
      const exerciseName = skips[0].exerciseName
      const severity = skips.length >= 5 ? 'high' : 'moderate'
      
      // Check if discomfort is common reason
      const discomfortSkips = skips.filter(s => s.reason === 'discomfort')
      if (discomfortSkips.length >= 2) {
        patterns.push({
          type: 'frequent_skip',
          exerciseId,
          exerciseName,
          severity: 'high',
          description: `${exerciseName} frequently causes discomfort`,
          recommendation: `Consider replacing ${exerciseName} with a joint-friendly alternative`,
        })
        recommendations.push(`Replace ${exerciseName} with a more comfortable variation`)
      } else {
        patterns.push({
          type: 'frequent_skip',
          exerciseId,
          exerciseName,
          severity,
          description: `${exerciseName} has been skipped ${skips.length} times recently`,
          recommendation: `Review if ${exerciseName} is appropriate for current level`,
        })
      }
    }
  }
  
  // Analyze difficulty patterns by category
  const categoryDifficultyDown = new Map<string, number>()
  const categoryDifficultyUp = new Map<string, number>()
  
  for (const s of recentSignals) {
    if (s.signalType === 'progression_down') {
      categoryDifficultyDown.set(
        s.exerciseCategory, 
        (categoryDifficultyDown.get(s.exerciseCategory) || 0) + 1
      )
    }
    if (s.signalType === 'progression_up') {
      categoryDifficultyUp.set(
        s.exerciseCategory, 
        (categoryDifficultyUp.get(s.exerciseCategory) || 0) + 1
      )
    }
  }
  
  for (const [category, count] of categoryDifficultyDown) {
    if (count >= 3) {
      patterns.push({
        type: 'difficulty_mismatch',
        movementCategory: category,
        severity: count >= 5 ? 'high' : 'moderate',
        description: `${category} exercises are often being downgraded`,
        recommendation: `Consider starting ${category} work at a lower progression level`,
      })
      recommendations.push(`Adjust ${category} difficulty down for better consistency`)
    }
  }
  
  // Check equipment issues
  const equipmentSkips = recentSignals.filter(s => s.reason === 'equipment')
  if (equipmentSkips.length >= 2) {
    patterns.push({
      type: 'equipment_issue',
      severity: 'moderate',
      description: `Exercises skipped due to missing equipment`,
      recommendation: `Update equipment availability in profile settings`,
    })
    recommendations.push('Update your equipment settings to get better exercise selections')
  }
  
  return {
    hasSignificantPatterns: patterns.length > 0,
    patterns,
    coachRecommendations: recommendations,
  }
}

/**
 * Get a brief summary suitable for display
 */
export function getOverrideSummaryBrief(): {
  totalOverrides: number
  recentSkips: number
  recentReplacements: number
  hasPatterns: boolean
} {
  const signals = getStoredSignals()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]
  
  const recentSignals = signals.filter(s => s.date >= cutoffStr)
  const feedback = analyzeSignalsForAdaptive(7)
  
  return {
    totalOverrides: signals.length,
    recentSkips: recentSignals.filter(s => s.signalType === 'skipped').length,
    recentReplacements: recentSignals.filter(s => s.signalType === 'replaced').length,
    hasPatterns: feedback.hasSignificantPatterns,
  }
}

/**
 * Clear all override signals (for testing/reset)
 */
export function clearOverrideSignals(): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// =============================================================================
// ENHANCED EXERCISE INTELLIGENCE INTEGRATION
// =============================================================================

/**
 * Enhanced override warning using the exercise intelligence layer
 * Provides more nuanced and coach-like feedback on exercise substitutions
 */
export interface EnhancedOverrideWarning {
  shouldWarn: boolean
  severity: 'none' | 'info' | 'warning' | 'danger'
  headline: string
  message: string
  substitutionQuality: 'excellent' | 'good' | 'acceptable' | 'poor'
  preservedAttributes: string[]
  lostAttributes: string[]
  coachingTip: string | null
}

export function getEnhancedOverrideWarning(
  originalExerciseId: string,
  overrideExerciseId: string,
  targetSkill?: string,
  athleteContext?: AthleteExerciseContext
): EnhancedOverrideWarning {
  // Get warning from exercise intelligence
  const warning = generateOverrideWarning(
    originalExerciseId,
    overrideExerciseId,
    targetSkill as any,
    athleteContext
  )
  
  // Get substitution quality score
  const qualityScore = scoreSubstitution(
    originalExerciseId,
    overrideExerciseId,
    targetSkill as any
  )
  
  // Get explanation for original exercise
  const whyOriginal = generateWhyThisExercise(
    originalExerciseId,
    targetSkill as any
  )
  
  // Build preserved/lost attributes
  const preservedAttributes: string[] = []
  const lostAttributes: string[] = []
  
  if (qualityScore.preserves.movementFamily) {
    preservedAttributes.push('Movement pattern')
  } else {
    lostAttributes.push('Movement pattern')
  }
  
  if (qualityScore.preserves.trainingIntent) {
    preservedAttributes.push('Training intent')
  } else {
    lostAttributes.push('Training intent')
  }
  
  if (qualityScore.preserves.skillCarryover) {
    preservedAttributes.push('Skill transfer')
  } else if (targetSkill) {
    lostAttributes.push('Skill transfer')
  }
  
  if (qualityScore.preserves.difficultyLevel) {
    preservedAttributes.push('Difficulty level')
  } else {
    lostAttributes.push('Difficulty match')
  }
  
  // Build headline based on quality
  let headline = ''
  switch (qualityScore.qualityLevel) {
    case 'excellent':
      headline = 'Great substitute'
      break
    case 'good':
      headline = 'Solid alternative'
      break
    case 'acceptable':
      headline = 'Acceptable but different'
      break
    case 'poor':
      headline = 'Consider a closer match'
      break
  }
  
  // Determine if we should show coaching tip
  const coachingTip = warning.shouldWarn && whyOriginal?.coachTip
    ? whyOriginal.coachTip
    : null
  
  return {
    shouldWarn: warning.shouldWarn,
    severity: warning.shouldWarn 
      ? (warning.severity === 'danger' ? 'danger' : warning.severity === 'warning' ? 'warning' : 'info')
      : 'none',
    headline,
    message: warning.message || `${headline}: This exercise ${preservedAttributes.length > 0 ? `preserves ${preservedAttributes.join(', ').toLowerCase()}` : 'differs significantly from the original'}.`,
    substitutionQuality: qualityScore.qualityLevel,
    preservedAttributes,
    lostAttributes,
    coachingTip,
  }
}

/**
 * Generate "why this exercise was recommended" explanation for UI display
 */
export interface ExerciseExplanationForUI {
  exerciseId: string
  exerciseName: string
  headline: string
  shortRationale: string
  fullRationale: string
  skillBenefit: string
  coachTip: string
  confidenceIndicator: 'high' | 'medium' | 'low'
}

export function getExerciseExplanationForUI(
  exerciseId: string,
  targetSkill?: string,
  primaryWeakPoint?: string
): ExerciseExplanationForUI | null {
  const explanation = generateWhyThisExercise(
    exerciseId,
    targetSkill as any,
    primaryWeakPoint as any
  )
  
  if (!explanation) return null
  
  // Build short rationale (first sentence)
  const shortRationale = explanation.rationale.split('.')[0] + '.'
  
  return {
    exerciseId: explanation.exerciseId,
    exerciseName: explanation.exerciseName,
    headline: explanation.headline,
    shortRationale,
    fullRationale: explanation.rationale,
    skillBenefit: explanation.skillBenefit,
    coachTip: explanation.coachTip,
    confidenceIndicator: explanation.confidenceLevel,
  }
}
