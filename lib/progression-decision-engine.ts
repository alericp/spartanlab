// Progression Decision Engine
// Lightweight, deterministic progression evaluation
// Returns simple progress/maintain/regress decisions based on performance data

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getStoredRPESessions, type StoredRPESession } from './fatigue-score-calculator'
import { getFatigueTrainingDecision, type TrainingDecision } from './fatigue-decision-engine'
import { computeFatigueStateFromFeedback } from './session-feedback'

// =============================================================================
// TYPES
// =============================================================================

export type ProgressionDecision = 'progress' | 'maintain' | 'regress'

export interface ProgressionEvaluation {
  decision: ProgressionDecision
  confidence: number // 0-1 scale
  reasoning: string
  recommendations?: {
    nextTarget?: number
    bandAssistance?: boolean
    volumeModifier?: number
  }
}

export interface ProgressionInput {
  exerciseId: string
  exerciseName: string
  
  // Performance data
  recentPerformance?: {
    reps?: number
    holdSeconds?: number
    weight?: number
  }[]
  
  // Target range
  targetRange?: {
    min: number
    max: number
  }
  
  // RPE data
  averageRPE?: number
  
  // Fatigue state (from fatigue engine)
  fatigueNeedsDeload?: boolean
  fatigueScore?: number // 0-100
  
  // Exercise type hint
  isIsometric?: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const THRESHOLDS = {
  // Minimum sessions needed for confident decision
  MIN_SESSIONS_FOR_PROGRESS: 2,
  MIN_SESSIONS_FOR_REGRESS: 2,
  MIN_SESSIONS_FOR_CONFIDENCE: 3,
  
  // RPE thresholds
  RPE_EASY: 6,
  RPE_TARGET_LOW: 7,
  RPE_TARGET_HIGH: 8.5,
  RPE_TOO_HARD: 9,
  
  // Performance thresholds
  COMPLETION_RATE_EXCELLENT: 0.9,
  COMPLETION_RATE_GOOD: 0.75,
  COMPLETION_RATE_POOR: 0.5,
  
  // Hold time thresholds (seconds) for isometric skills
  HOLD_MIN_PROGRESS: 8,
  HOLD_TARGET_LOW: 10,
  HOLD_TARGET_HIGH: 15,
  HOLD_MASTERY: 20,
  
  // Rep thresholds for dynamic exercises
  REPS_FOR_PROGRESS: 8,
  REPS_MINIMUM: 5,
}

// =============================================================================
// MAIN EVALUATION FUNCTION
// =============================================================================

/**
 * Evaluate whether a user should progress, maintain, or regress an exercise.
 * 
 * Rules:
 * - Isometric holds: Progress if hold >= target upper bound consistently
 * - Reps: Progress if top of rep range achieved cleanly for 2-3 sessions
 * - Fatigue override: Force maintain or regress if needsDeload is true
 * - No data: Default to maintain
 * 
 * @param input - Performance data and context
 * @returns Progression decision with confidence score
 */
export function evaluateProgression(input: ProgressionInput): ProgressionEvaluation {
  // =========================================================================
  // FATIGUE OVERRIDE - Highest priority
  // =========================================================================
  if (input.fatigueNeedsDeload) {
    return {
      decision: 'maintain',
      confidence: 0.95,
      reasoning: 'Fatigue signals indicate recovery is needed. Maintaining current level.',
      recommendations: {
        volumeModifier: 0.7,
      }
    }
  }
  
  // High fatigue score also triggers maintain/regress
  if (input.fatigueScore !== undefined && input.fatigueScore >= 80) {
    return {
      decision: 'regress',
      confidence: 0.8,
      reasoning: 'High fatigue detected. Step back temporarily for recovery.',
      recommendations: {
        volumeModifier: 0.6,
      }
    }
  }
  
  // =========================================================================
  // NO DATA - Default to maintain
  // =========================================================================
  if (!input.recentPerformance || input.recentPerformance.length === 0) {
    return {
      decision: 'maintain',
      confidence: 0.3,
      reasoning: 'No performance data available. Maintaining current level.',
    }
  }
  
  const performances = input.recentPerformance
  const sessionCount = performances.length
  
  // =========================================================================
  // ISOMETRIC HOLDS (FL, Planche, L-sit)
  // =========================================================================
  if (input.isIsometric || performances.some(p => p.holdSeconds !== undefined)) {
    return evaluateIsometricProgression(input, performances)
  }
  
  // =========================================================================
  // REPS (Pull-ups, Dips, etc.)
  // =========================================================================
  return evaluateRepProgression(input, performances)
}

// =============================================================================
// ISOMETRIC EVALUATION
// =============================================================================

function evaluateIsometricProgression(
  input: ProgressionInput,
  performances: NonNullable<ProgressionInput['recentPerformance']>
): ProgressionEvaluation {
  // Extract hold times
  const holdTimes = performances
    .filter(p => p.holdSeconds !== undefined)
    .map(p => p.holdSeconds!)
  
  if (holdTimes.length === 0) {
    return {
      decision: 'maintain',
      confidence: 0.3,
      reasoning: 'No hold time data available.',
    }
  }
  
  const avgHold = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length
  const recentHolds = holdTimes.slice(0, THRESHOLDS.MIN_SESSIONS_FOR_PROGRESS)
  const allHitTarget = recentHolds.length >= THRESHOLDS.MIN_SESSIONS_FOR_PROGRESS
  
  // Get target range
  const targetMin = input.targetRange?.min ?? THRESHOLDS.HOLD_TARGET_LOW
  const targetMax = input.targetRange?.max ?? THRESHOLDS.HOLD_TARGET_HIGH
  
  // Check RPE if available
  const rpeInRange = input.averageRPE === undefined || 
    (input.averageRPE >= THRESHOLDS.RPE_TARGET_LOW && 
     input.averageRPE <= THRESHOLDS.RPE_TARGET_HIGH)
  
  const rpeEasy = input.averageRPE !== undefined && input.averageRPE <= THRESHOLDS.RPE_EASY
  const rpeTooHard = input.averageRPE !== undefined && input.averageRPE >= THRESHOLDS.RPE_TOO_HARD
  
  // -------------------------------------------------------------------------
  // PROGRESS: Hold >= target upper bound consistently
  // -------------------------------------------------------------------------
  if (avgHold >= targetMax && allHitTarget && (rpeInRange || rpeEasy)) {
    const confidence = Math.min(0.95, 0.6 + (holdTimes.length * 0.1))
    return {
      decision: 'progress',
      confidence,
      reasoning: `Consistently hitting ${avgHold.toFixed(0)}s holds (target: ${targetMax}s). Ready to advance.`,
      recommendations: {
        nextTarget: Math.min(targetMax + 5, THRESHOLDS.HOLD_MASTERY),
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // REGRESS: Hold below lower bound or RPE too hard
  // -------------------------------------------------------------------------
  if (avgHold < targetMin || rpeTooHard) {
    // Check consistency of poor performance
    const recentBelowTarget = recentHolds.filter(h => h < targetMin).length
    
    if (recentBelowTarget >= THRESHOLDS.MIN_SESSIONS_FOR_REGRESS || rpeTooHard) {
      return {
        decision: 'regress',
        confidence: 0.75,
        reasoning: rpeTooHard 
          ? 'RPE too high. Step back to build strength safely.'
          : `Struggling to hit target (avg: ${avgHold.toFixed(0)}s, target: ${targetMin}s). Step back.`,
        recommendations: {
          bandAssistance: true,
        }
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // MAINTAIN: Within target range
  // -------------------------------------------------------------------------
  return {
    decision: 'maintain',
    confidence: 0.7,
    reasoning: `Holding ${avgHold.toFixed(0)}s (target range: ${targetMin}-${targetMax}s). Continue building strength.`,
  }
}

// =============================================================================
// REP-BASED EVALUATION
// =============================================================================

function evaluateRepProgression(
  input: ProgressionInput,
  performances: NonNullable<ProgressionInput['recentPerformance']>
): ProgressionEvaluation {
  // Extract rep counts
  const repCounts = performances
    .filter(p => p.reps !== undefined)
    .map(p => p.reps!)
  
  if (repCounts.length === 0) {
    return {
      decision: 'maintain',
      confidence: 0.3,
      reasoning: 'No rep data available.',
    }
  }
  
  const avgReps = repCounts.reduce((a, b) => a + b, 0) / repCounts.length
  const recentReps = repCounts.slice(0, THRESHOLDS.MIN_SESSIONS_FOR_PROGRESS)
  
  // Get target range
  const targetMin = input.targetRange?.min ?? THRESHOLDS.REPS_MINIMUM
  const targetMax = input.targetRange?.max ?? THRESHOLDS.REPS_FOR_PROGRESS
  
  // Check RPE if available
  const rpeInRange = input.averageRPE === undefined || 
    (input.averageRPE >= THRESHOLDS.RPE_TARGET_LOW && 
     input.averageRPE <= THRESHOLDS.RPE_TARGET_HIGH)
  
  const rpeEasy = input.averageRPE !== undefined && input.averageRPE <= THRESHOLDS.RPE_EASY
  const rpeTooHard = input.averageRPE !== undefined && input.averageRPE >= THRESHOLDS.RPE_TOO_HARD
  
  // -------------------------------------------------------------------------
  // PROGRESS: Hitting top of rep range cleanly
  // -------------------------------------------------------------------------
  const hitsTopRange = recentReps.filter(r => r >= targetMax).length >= THRESHOLDS.MIN_SESSIONS_FOR_PROGRESS
  
  if (hitsTopRange && (rpeInRange || rpeEasy)) {
    const confidence = Math.min(0.95, 0.6 + (repCounts.length * 0.1))
    return {
      decision: 'progress',
      confidence,
      reasoning: `Consistently hitting ${Math.round(avgReps)} reps (target: ${targetMax}). Ready to progress load.`,
      recommendations: {
        nextTarget: targetMax + 2,
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // REGRESS: Cannot hit minimum or RPE too hard
  // -------------------------------------------------------------------------
  if (avgReps < targetMin || rpeTooHard) {
    const recentBelowMin = recentReps.filter(r => r < targetMin).length
    
    if (recentBelowMin >= THRESHOLDS.MIN_SESSIONS_FOR_REGRESS || rpeTooHard) {
      return {
        decision: 'regress',
        confidence: 0.75,
        reasoning: rpeTooHard 
          ? 'RPE too high. Reduce load temporarily.'
          : `Struggling to hit minimum reps (avg: ${Math.round(avgReps)}, min: ${targetMin}). Reduce load.`,
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // MAINTAIN: Mid range
  // -------------------------------------------------------------------------
  return {
    decision: 'maintain',
    confidence: 0.7,
    reasoning: `Averaging ${Math.round(avgReps)} reps (target range: ${targetMin}-${targetMax}). Continue building.`,
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get recent performance for an exercise from workout logs.
 */
export function getRecentPerformance(
  exerciseId: string,
  exerciseName: string,
  sessionCount: number = 5
): ProgressionInput['recentPerformance'] {
  try {
    const logs = getWorkoutLogs()
    const performances: NonNullable<ProgressionInput['recentPerformance']> = []
    
    // Sort by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    )
    
    for (const log of sortedLogs) {
      const exercise = log.exercises.find(e => 
        e.id === exerciseId || 
        e.name.toLowerCase() === exerciseName.toLowerCase()
      )
      
      if (exercise) {
        performances.push({
          reps: exercise.reps,
          holdSeconds: exercise.holdSeconds,
          weight: exercise.load,
        })
        
        if (performances.length >= sessionCount) break
      }
    }
    
    return performances
  } catch {
    return []
  }
}

/**
 * Get average RPE for an exercise from RPE sessions.
 */
export function getAverageRPE(
  exerciseId: string,
  exerciseName: string,
  sessionCount: number = 5
): number | undefined {
  try {
    const rpeSessions = getStoredRPESessions()
    const rpeValues: number[] = []
    
    for (const session of rpeSessions.slice(0, sessionCount)) {
      const exerciseRPE = session.exercises.find(e =>
        e.exerciseId === exerciseId || e.exerciseName === exerciseName
      )
      
      if (exerciseRPE && exerciseRPE.sets.length > 0) {
        const avgSetRPE = exerciseRPE.sets.reduce((sum, s) => sum + s.actualRPE, 0) / exerciseRPE.sets.length
        rpeValues.push(avgSetRPE)
      }
    }
    
    if (rpeValues.length === 0) return undefined
    return rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
  } catch {
    return undefined
  }
}

/**
 * Get current fatigue state for progression decisions.
 */
export function getFatigueState(): { needsDeload: boolean; fatigueScore: number } {
  try {
    const fatigueDecision = getFatigueTrainingDecision()
    const feedbackState = computeFatigueStateFromFeedback()
    
    const needsDeload = fatigueDecision.decision === 'SKIP_TODAY' ||
                        fatigueDecision.decision === 'DELOAD_RECOMMENDED' ||
                        feedbackState.needsDeload
    
    // Convert fatigue score to 0-100 scale
    const fatigueScore = feedbackState.fatigueScore * 10 // 0-10 -> 0-100
    
    return { needsDeload, fatigueScore }
  } catch {
    return { needsDeload: false, fatigueScore: 50 }
  }
}

/**
 * Full evaluation with automatic data gathering.
 * Convenience function that handles all data retrieval.
 */
export function evaluateExerciseProgression(
  exerciseId: string,
  exerciseName: string,
  targetRange?: { min: number; max: number },
  isIsometric?: boolean
): ProgressionEvaluation {
  const recentPerformance = getRecentPerformance(exerciseId, exerciseName)
  const averageRPE = getAverageRPE(exerciseId, exerciseName)
  const { needsDeload, fatigueScore } = getFatigueState()
  
  return evaluateProgression({
    exerciseId,
    exerciseName,
    recentPerformance,
    targetRange,
    averageRPE,
    fatigueNeedsDeload: needsDeload,
    fatigueScore,
    isIsometric,
  })
}

// =============================================================================
// BULK EVALUATION
// =============================================================================

export interface ExerciseProgressionSummary {
  exerciseId: string
  exerciseName: string
  evaluation: ProgressionEvaluation
}

/**
 * Evaluate all exercises from recent workouts.
 */
export function evaluateAllExercises(
  sessionCount: number = 3
): ExerciseProgressionSummary[] {
  try {
    const logs = getWorkoutLogs()
    const sortedLogs = [...logs]
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      .slice(0, sessionCount)
    
    // Collect unique exercises
    const exerciseMap = new Map<string, { id: string; name: string; isIsometric: boolean }>()
    
    for (const log of sortedLogs) {
      for (const exercise of log.exercises) {
        if (!exerciseMap.has(exercise.id)) {
          const isIsometric = exercise.holdSeconds !== undefined
          exerciseMap.set(exercise.id, {
            id: exercise.id,
            name: exercise.name,
            isIsometric,
          })
        }
      }
    }
    
    // Evaluate each exercise
    const summaries: ExerciseProgressionSummary[] = []
    
    for (const exercise of exerciseMap.values()) {
      const evaluation = evaluateExerciseProgression(
        exercise.id,
        exercise.name,
        undefined,
        exercise.isIsometric
      )
      
      summaries.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        evaluation,
      })
    }
    
    return summaries
  } catch {
    return []
  }
}

/**
 * Get exercises ready to progress.
 */
export function getReadyToProgress(): ExerciseProgressionSummary[] {
  return evaluateAllExercises().filter(s => s.evaluation.decision === 'progress')
}

/**
 * Get exercises that should regress.
 */
export function getNeedingRegression(): ExerciseProgressionSummary[] {
  return evaluateAllExercises().filter(s => s.evaluation.decision === 'regress')
}
