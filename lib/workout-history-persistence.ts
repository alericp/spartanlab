/**
 * Workout History Persistence Module
 * 
 * Handles saving completed workout sessions to the history system,
 * detecting and recording PRs, and generating session summaries.
 */

import {
  createWorkoutSessionHistoryEntry,
  recordSessionPersonalRecords,
  getPersonalRecordsByExercise,
  getActiveProgramHistory,
  isSessionAlreadyPersisted,
} from './history-service'
import type {
  CreateWorkoutSessionInput,
  SessionMetricsSnapshot,
  ExerciseResultSnapshot,
  PRHitSnapshot,
  PRType,
  ExerciseCategory,
  CompletedSetData,
} from '@/types/history'

// =============================================================================
// TYPES
// =============================================================================

export interface WorkoutSessionData {
  userId: string
  workoutName: string
  dayLabel?: string
  sessionNumber?: number
  focusArea?: string
  durationMinutes: number
  completedSets: CompletedSetData[]
  exercises: Array<{
    id: string
    name: string
    category: string
    sets: number
    targetReps?: number
    targetHold?: number
    weight?: number
  }>
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  notes?: string
  activeProgramId?: string
}

export interface PersistenceResult {
  success: boolean
  sessionHistoryId?: string
  prsDetected: PRHitSnapshot[]
  summaryMessage: string
  error?: string
}

// =============================================================================
// PR DETECTION
// =============================================================================

interface ExercisePerformance {
  exerciseId: string
  exerciseName: string
  category: string
  maxWeight?: number
  bestReps?: number
  bestHold?: number
  totalVolume?: number
  totalSets: number
}

/**
 * Aggregate exercise performance from completed sets
 */
function aggregateExercisePerformance(
  completedSets: CompletedSetData[],
  exercises: WorkoutSessionData['exercises']
): ExercisePerformance[] {
  const performanceMap = new Map<string, ExercisePerformance>()

  for (const set of completedSets) {
    const exercise = exercises.find(e => e.id === set.exerciseId)
    if (!exercise) continue

    let perf = performanceMap.get(set.exerciseId)
    if (!perf) {
      perf = {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName,
        category: set.exerciseCategory,
        totalSets: 0,
        totalVolume: 0,
      }
      performanceMap.set(set.exerciseId, perf)
    }

    perf.totalSets++

    // Track best reps
    if (set.actualReps > 0) {
      perf.bestReps = Math.max(perf.bestReps ?? 0, set.actualReps)
      perf.totalVolume = (perf.totalVolume ?? 0) + set.actualReps
    }

    // Track weight if this is a weighted exercise
    if (exercise.weight && exercise.weight > 0) {
      perf.maxWeight = Math.max(perf.maxWeight ?? 0, exercise.weight)
      // Volume = weight x reps x sets for weighted work
      if (set.actualReps > 0) {
        perf.totalVolume = (perf.totalVolume ?? 0) + (exercise.weight * set.actualReps)
      }
    }

    // Track hold time for skill/static exercises
    if (exercise.targetHold && exercise.targetHold > 0) {
      // Estimate actual hold based on completion - in real app this would be tracked
      const estimatedHold = set.actualReps > 0 ? exercise.targetHold : 0
      perf.bestHold = Math.max(perf.bestHold ?? 0, estimatedHold)
    }
  }

  return Array.from(performanceMap.values())
}

/**
 * Detect PRs by comparing current performance against historical bests
 */
export async function detectSessionPRs(
  userId: string,
  performances: ExercisePerformance[]
): Promise<PRHitSnapshot[]> {
  const detectedPRs: PRHitSnapshot[] = []

  for (const perf of performances) {
    // Get historical PRs for this exercise
    const historicalPRs = await getPersonalRecordsByExercise(userId, perf.exerciseId)
    
    // Build lookup of best values by PR type
    const bestByType: Record<string, number> = {}
    for (const pr of historicalPRs) {
      const currentBest = bestByType[pr.prType] ?? 0
      if (pr.valuePrimary > currentBest) {
        bestByType[pr.prType] = pr.valuePrimary
      }
    }

    // Check for max_weight PR (weighted exercises only)
    if (perf.maxWeight && perf.maxWeight > 0) {
      const previousBest = bestByType['max_weight'] ?? 0
      if (perf.maxWeight > previousBest) {
        detectedPRs.push({
          exerciseKey: perf.exerciseId,
          exerciseName: perf.exerciseName,
          prType: 'max_weight',
          newValue: perf.maxWeight,
          previousValue: previousBest > 0 ? previousBest : undefined,
          unit: 'kg',
          improvement: previousBest > 0 ? perf.maxWeight - previousBest : undefined,
          improvementPercent: previousBest > 0 
            ? Math.round(((perf.maxWeight - previousBest) / previousBest) * 100)
            : undefined,
        })
      }
    }

    // Check for best_reps PR (bodyweight exercises primarily)
    if (perf.bestReps && perf.bestReps > 0 && !perf.maxWeight) {
      const previousBest = bestByType['best_reps'] ?? 0
      if (perf.bestReps > previousBest) {
        detectedPRs.push({
          exerciseKey: perf.exerciseId,
          exerciseName: perf.exerciseName,
          prType: 'best_reps',
          newValue: perf.bestReps,
          previousValue: previousBest > 0 ? previousBest : undefined,
          unit: 'reps',
          improvement: previousBest > 0 ? perf.bestReps - previousBest : undefined,
          improvementPercent: previousBest > 0 
            ? Math.round(((perf.bestReps - previousBest) / previousBest) * 100)
            : undefined,
        })
      }
    }

    // Check for best_hold PR (skill/static exercises)
    if (perf.bestHold && perf.bestHold > 0) {
      const previousBest = bestByType['best_hold'] ?? 0
      if (perf.bestHold > previousBest) {
        detectedPRs.push({
          exerciseKey: perf.exerciseId,
          exerciseName: perf.exerciseName,
          prType: 'best_hold',
          newValue: perf.bestHold,
          previousValue: previousBest > 0 ? previousBest : undefined,
          unit: 'seconds',
          improvement: previousBest > 0 ? perf.bestHold - previousBest : undefined,
          improvementPercent: previousBest > 0 
            ? Math.round(((perf.bestHold - previousBest) / previousBest) * 100)
            : undefined,
        })
      }
    }

    // Check for best_volume PR (significant for progression tracking)
    if (perf.totalVolume && perf.totalVolume > 0) {
      const previousBest = bestByType['best_volume'] ?? 0
      // Only record volume PRs if meaningfully higher (>5% improvement)
      if (perf.totalVolume > previousBest * 1.05) {
        detectedPRs.push({
          exerciseKey: perf.exerciseId,
          exerciseName: perf.exerciseName,
          prType: 'best_volume',
          newValue: perf.totalVolume,
          previousValue: previousBest > 0 ? previousBest : undefined,
          unit: perf.maxWeight ? 'kg*reps' : 'total_reps',
          improvement: previousBest > 0 ? perf.totalVolume - previousBest : undefined,
          improvementPercent: previousBest > 0 
            ? Math.round(((perf.totalVolume - previousBest) / previousBest) * 100)
            : undefined,
        })
      }
    }
  }

  return detectedPRs
}

// =============================================================================
// SESSION SUMMARY MESSAGE GENERATION
// =============================================================================

/**
 * Generate a concise, useful summary message for a completed workout session
 * Now supports hybrid strength context
 */
export function generateWorkoutSessionSummaryMessage(
  completionRate: number,
  prsHit: number,
  averageRPE: number | null,
  totalVolume: number,
  perceivedDifficulty?: 'easy' | 'normal' | 'hard',
  durationMinutes?: number,
  // Hybrid context
  hybridContext?: {
    hasDeadlift?: boolean
    hasWeightedPull?: boolean
    hasWeightedDip?: boolean
    deadliftPR?: boolean
    weightedPR?: boolean
  }
): string {
  const parts: string[] = []

  // Determine session type based on hybrid context
  const isHybridSession = hybridContext?.hasDeadlift || hybridContext?.hasWeightedPull || hybridContext?.hasWeightedDip
  const isDeadliftSession = hybridContext?.hasDeadlift
  
  // Session type prefix
  if (isDeadliftSession && hybridContext?.deadliftPR) {
    parts.push('Strong hybrid session')
  } else if (isDeadliftSession) {
    parts.push('Hybrid strength session')
  } else if (isHybridSession) {
    parts.push('Weighted calisthenics session')
  } else if (completionRate >= 0.95) {
    parts.push('Full session completed')
  } else if (completionRate >= 0.75) {
    parts.push('Solid session completed')
  } else if (completionRate >= 0.5) {
    parts.push('Partial session completed')
  } else {
    parts.push('Light session logged')
  }

  // PR mentions with hybrid awareness
  if (prsHit > 0) {
    if (hybridContext?.deadliftPR) {
      parts.push('with a new deadlift PR')
    } else if (hybridContext?.weightedPR) {
      parts.push('with a new weighted calisthenics PR')
    } else if (prsHit === 1) {
      parts.push('with 1 new PR')
    } else {
      parts.push(`with ${prsHit} new PRs`)
    }
  }

  // Performance quality based on RPE and difficulty
  const performanceDescriptor = getPerformanceDescriptor(averageRPE, perceivedDifficulty)
  if (performanceDescriptor) {
    parts.push(performanceDescriptor)
  }

  // Combine parts into a message
  let message = parts.join(' ')
  
  // Add period if not present
  if (!message.endsWith('.')) {
    message += '.'
  }

  return message
}

/**
 * Generate hybrid-specific session summary
 */
export function generateHybridSessionSummary(
  exercises: Array<{ id: string; name: string; category: string }>,
  prs: Array<{ exerciseKey: string; prType: string }>,
  averageRPE: number | null
): string {
  const hasDeadlift = exercises.some(e => 
    e.id.includes('deadlift') || e.category === 'barbell_hinge'
  )
  const hasWeightedPull = exercises.some(e => e.id === 'weighted_pull_up')
  const hasWeightedDip = exercises.some(e => e.id === 'weighted_dip')
  
  const deadliftPR = prs.some(pr => pr.exerciseKey.includes('deadlift'))
  const weightedPullPR = prs.some(pr => pr.exerciseKey === 'weighted_pull_up')
  const weightedDipPR = prs.some(pr => pr.exerciseKey === 'weighted_dip')
  
  // Build contextual summary
  const summaryParts: string[] = []
  
  if (hasDeadlift && deadliftPR) {
    summaryParts.push('New deadlift PR achieved')
  } else if (hasDeadlift) {
    if (averageRPE && averageRPE >= 8) {
      summaryParts.push('Heavy hinge work completed')
    } else {
      summaryParts.push('Deadlift training completed')
    }
  }
  
  if (hasWeightedPull || hasWeightedDip) {
    if (weightedPullPR || weightedDipPR) {
      summaryParts.push('weighted strength PRs hit')
    } else {
      summaryParts.push('stable weighted pulling output')
    }
  }
  
  if (summaryParts.length === 0) {
    return 'Session completed.'
  }
  
  // Join with appropriate connector
  if (summaryParts.length === 1) {
    return summaryParts[0] + '.'
  }
  
  return summaryParts.join(' and ') + '.'
}

function getPerformanceDescriptor(
  averageRPE: number | null,
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
): string | null {
  // Use perceived difficulty as primary indicator if available
  if (perceivedDifficulty) {
    switch (perceivedDifficulty) {
      case 'easy':
        return 'Recovery-focused intensity'
      case 'hard':
        return 'High-effort output'
      case 'normal':
        return 'Steady working intensity'
    }
  }

  // Fall back to RPE if available
  if (averageRPE !== null) {
    if (averageRPE >= 8.5) {
      return 'Maximum effort across sets'
    } else if (averageRPE >= 7) {
      return 'Strong working intensity'
    } else if (averageRPE >= 5) {
      return 'Moderate controlled effort'
    } else {
      return 'Light maintenance work'
    }
  }

  return null
}

// =============================================================================
// MAIN PERSISTENCE FUNCTION
// =============================================================================

/**
 * Persist a completed workout session to history
 * 
 * This is the central function that:
 * 1. Creates the workout session history entry
 * 2. Detects and records any PRs
 * 3. Generates a session summary message
 * 4. Links to the active program if available
 */
export async function persistWorkoutSession(
  data: WorkoutSessionData
): Promise<PersistenceResult> {
  try {
    const workoutDate = new Date().toISOString().split('T')[0]
    
    // Idempotency check - prevent duplicate saves
    const alreadyPersisted = await isSessionAlreadyPersisted(
      data.userId,
      data.workoutName,
      workoutDate
    )
    
    if (alreadyPersisted) {
      return {
        success: true,
        prsDetected: [],
        summaryMessage: 'Session already saved.',
        error: 'Duplicate save prevented - session already persisted',
      }
    }

    // Get active program history for linking
    const activeProgram = await getActiveProgramHistory(data.userId)

    // Aggregate exercise performance data
    const performances = aggregateExercisePerformance(data.completedSets, data.exercises)

    // Detect PRs
    const detectedPRs = await detectSessionPRs(data.userId, performances)

    // Build session metrics snapshot
    const totalSets = data.completedSets.length
    const totalReps = data.completedSets.reduce((sum, s) => sum + s.actualReps, 0)
    const averageRPE = totalSets > 0
      ? data.completedSets.reduce((sum, s) => sum + s.actualRPE, 0) / totalSets
      : null

    const sessionMetrics: SessionMetricsSnapshot = {
      totalSets,
      totalReps,
      totalVolume: performances.reduce((sum, p) => sum + (p.totalVolume ?? 0), 0),
      actualDurationMinutes: data.durationMinutes,
      averageRPE: averageRPE ? Math.round(averageRPE * 10) / 10 : undefined,
      completionRate: data.exercises.length > 0
        ? new Set(data.completedSets.map(s => s.exerciseId)).size / data.exercises.length
        : 1,
    }

    // Build exercise results snapshot
    const exerciseResults: ExerciseResultSnapshot[] = data.exercises.map(exercise => {
      const sets = data.completedSets.filter(s => s.exerciseId === exercise.id)
      const wasCompleted = sets.length > 0
      const perf = performances.find(p => p.exerciseId === exercise.id)
      
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: mapToExerciseCategory(exercise.category),
        prescribed: {
          sets: exercise.sets,
          reps: exercise.targetReps?.toString(),
          hold: exercise.targetHold?.toString(),
          weight: exercise.weight,
        },
        actual: {
          setsCompleted: sets.length,
          repsPerSet: sets.map(s => s.actualReps),
          weightUsed: exercise.weight,
        },
        wasCompleted,
        wasSkipped: !wasCompleted,
        isPR: detectedPRs.some(pr => pr.exerciseKey === exercise.id),
        prType: detectedPRs.find(pr => pr.exerciseKey === exercise.id)?.prType,
      }
    })

    // Generate summary message
    const completionRate = sessionMetrics.completionRate ?? 1
    const summaryMessage = generateWorkoutSessionSummaryMessage(
      completionRate,
      detectedPRs.length,
      averageRPE,
      sessionMetrics.totalVolume ?? 0,
      data.perceivedDifficulty,
      data.durationMinutes
    )

    // Create the workout session history entry
    const sessionInput: CreateWorkoutSessionInput = {
      userId: data.userId,
      programHistoryId: activeProgram?.id,
      activeProgramId: data.activeProgramId,
      workoutDate,
      workoutName: data.workoutName,
      dayLabel: data.dayLabel,
      sessionNumber: data.sessionNumber,
      sessionStatus: completionRate >= 0.5 ? 'completed' : 'partial',
      summaryMessage,
      sessionMetricsSnapshot: sessionMetrics,
      exerciseResultsSnapshot: exerciseResults,
      prsHitSnapshot: detectedPRs,
      durationMinutes: data.durationMinutes,
      totalVolume: sessionMetrics.totalVolume,
      exercisesCompleted: new Set(data.completedSets.map(s => s.exerciseId)).size,
      exercisesSkipped: data.exercises.length - new Set(data.completedSets.map(s => s.exerciseId)).size,
      difficultyRating: data.perceivedDifficulty === 'hard' ? 3 
        : data.perceivedDifficulty === 'normal' ? 2 
        : data.perceivedDifficulty === 'easy' ? 1 
        : undefined,
    }

    const sessionHistory = await createWorkoutSessionHistoryEntry(sessionInput)

    if (!sessionHistory) {
      // Database might not be available - return success with local-only result
      return {
        success: true,
        prsDetected: detectedPRs,
        summaryMessage,
        error: 'Session logged locally only - database unavailable',
      }
    }

    // Record PRs to PR history table
    if (detectedPRs.length > 0) {
      await recordSessionPersonalRecords(
        data.userId,
        sessionHistory.id,
        activeProgram?.id,
        detectedPRs.map(pr => ({
          exerciseKey: pr.exerciseKey,
          exerciseName: pr.exerciseName,
          exerciseCategory: performances.find(p => p.exerciseId === pr.exerciseKey)?.category,
          prType: pr.prType,
          valuePrimary: pr.newValue,
          unit: pr.unit,
        }))
      )
    }

    return {
      success: true,
      sessionHistoryId: sessionHistory.id,
      prsDetected: detectedPRs,
      summaryMessage,
    }
  } catch (error) {
    console.error('[WorkoutHistoryPersistence] Error persisting session:', error)
    return {
      success: false,
      prsDetected: [],
      summaryMessage: 'Session completed.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapToExerciseCategory(category: string): ExerciseCategory {
  const categoryMap: Record<string, ExerciseCategory> = {
    skill: 'skill',
    strength: 'strength',
    weighted: 'weighted',
    bodyweight: 'bodyweight',
    push: 'strength',
    pull: 'strength',
    core: 'strength',
    legs: 'strength',
    mobility: 'mobility',
    conditioning: 'conditioning',
  }
  return categoryMap[category.toLowerCase()] || 'bodyweight'
}
