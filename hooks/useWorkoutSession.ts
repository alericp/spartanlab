'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AdaptiveSession, AdaptiveExercise } from '@/lib/adaptive-program-builder'
import { saveWorkoutLog, type WorkoutExercise, type SessionType, type FocusArea, type ExerciseCategory } from '@/lib/workout-log-service'
import { recordRPESession } from '@/lib/fatigue-engine'
import { onTrainingEvent } from '@/lib/achievements/achievement-engine'
import { showAchievementNotifications } from '@/components/achievements/achievement-notification'
import { onTrainingEventForChallenges } from '@/lib/challenges/challenge-engine'
import { showChallengeNotifications } from '@/components/challenges/challenge-notification'
import { persistWorkoutSession, type PersistenceResult } from '@/lib/workout-history-persistence'
import { createOccurrenceId, describeWorkoutSaveResult, type WorkoutSaveAthleteStatus } from '@/lib/workout/save-reliability'
import { classifyHistoryPersistence, measuredSessionRpe, type HistorySyncState } from '@/lib/workout/history-progress'
import { retryPendingWorkoutEvidence } from '@/lib/workout-log-service'
import { useAuth } from '@clerk/nextjs'
import type { CompletedSetData } from '@/types/history'

// Re-export CompletedSetData for components that import from this hook
export type { CompletedSetData } from '@/types/history'

// =============================================================================
// TYPES
// =============================================================================

export type SessionStatus = 'inactive' | 'active' | 'paused' | 'completed'

export interface SessionStats {
  totalSets: number
  completedSets: number
  totalExercises: number
  completedExercises: number
  averageRPE: number | null
  estimatedVolume: number
  elapsedSeconds: number
}

export interface WorkoutSessionState {
  status: SessionStatus
  startTime: number | null
  pausedTime: number | null
  totalPausedDuration: number
  elapsedSeconds: number
  completedSets: CompletedSetData[]
  currentExerciseIndex: number
  currentSetNumber: number
}

export interface WorkoutSessionControls {
  start: () => void
  pause: () => void
  resume: () => void
  finish: () => void
  reset: () => void
  recordSet: (data: Omit<CompletedSetData, 'exerciseId' | 'exerciseName' | 'exerciseCategory' | 'setNumber'>) => void
  nextExercise: () => void
  skipExercise: () => void
}

export interface UseWorkoutSessionReturn extends WorkoutSessionState, WorkoutSessionControls {
  stats: SessionStats
  isActive: boolean
  isPaused: boolean
  isCompleted: boolean
  formattedDuration: string
  canSave: boolean
  save: (notes?: string) => Promise<WorkoutSaveAthleteStatus>
  lastSaveResult: PersistenceResult | null
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function mapCategoryToLogCategory(category: string): ExerciseCategory {
  const categoryMap: Record<string, ExerciseCategory> = {
    skill: 'skill',
    push: 'push',
    pull: 'pull',
    core: 'core',
    legs: 'legs',
    mobility: 'mobility',
    strength: 'push', // Default strength to push
  }
  return categoryMap[category.toLowerCase()] || 'skill'
}

function mapFocusToFocusArea(focus: string): FocusArea {
  const focusMap: Record<string, FocusArea> = {
    planche: 'planche',
    front_lever: 'front_lever',
    'front lever': 'front_lever',
    muscle_up: 'muscle_up',
    'muscle up': 'muscle_up',
    handstand: 'handstand_pushup',
    handstand_pushup: 'handstand_pushup',
    weighted: 'weighted_strength',
    strength: 'weighted_strength',
  }
  
  const lowerFocus = focus.toLowerCase()
  for (const [key, value] of Object.entries(focusMap)) {
    if (lowerFocus.includes(key)) return value
  }
  return 'general'
}

// =============================================================================
// HOOK
// =============================================================================

export function useWorkoutSession(session: AdaptiveSession): UseWorkoutSessionReturn {
  const { userId } = useAuth()
  const [state, setState] = useState<WorkoutSessionState>({
    status: 'inactive',
    startTime: null,
    pausedTime: null,
    totalPausedDuration: 0,
    elapsedSeconds: 0,
    completedSets: [],
    currentExerciseIndex: 0,
    currentSetNumber: 1,
  })
  const [lastSaveResult, setLastSaveResult] = useState<PersistenceResult | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const occurrenceIdRef = useRef<string | null>(null)
  const saveLockRef = useRef(false)

  useEffect(() => {
    retryPendingWorkoutEvidence()
  }, [])

  // Calculate total sets in session
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const totalExercises = session.exercises.length

  // Timer effect
  useEffect(() => {
    if (state.status === 'active' && state.startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - state.startTime! - state.totalPausedDuration) / 1000)
        setState(prev => ({ ...prev, elapsedSeconds: elapsed }))
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.status, state.startTime, state.totalPausedDuration])

  // Calculate stats
  const stats: SessionStats = {
    totalSets,
    completedSets: state.completedSets.length,
    totalExercises,
    completedExercises: new Set(state.completedSets.map(s => s.exerciseId)).size,
    averageRPE: (() => {
      const average = measuredSessionRpe(state.completedSets.map(set => set.actualRPE))
      return average === null ? null : Math.round(average * 10) / 10
    })(),
    estimatedVolume: state.completedSets.reduce((sum, set) => {
      const effort = measuredSessionRpe([set.actualRPE])
      if (effort === null) return sum
      return sum + (set.actualReps * (effort / 10))
    }, 0),
    elapsedSeconds: state.elapsedSeconds,
  }

  // Control functions
  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'active',
      startTime: Date.now(),
      pausedTime: null,
      totalPausedDuration: 0,
      elapsedSeconds: 0,
    }))
  }, [])

  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'paused',
      pausedTime: Date.now(),
    }))
  }, [])

  const resume = useCallback(() => {
    setState(prev => {
      const pausedDuration = prev.pausedTime ? Date.now() - prev.pausedTime : 0
      return {
        ...prev,
        status: 'active',
        pausedTime: null,
        totalPausedDuration: prev.totalPausedDuration + pausedDuration,
      }
    })
  }, [])

  const finish = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'completed',
    }))
  }, [])

  const reset = useCallback(() => {
    occurrenceIdRef.current = null
    setState({
      status: 'inactive',
      startTime: null,
      pausedTime: null,
      totalPausedDuration: 0,
      elapsedSeconds: 0,
      completedSets: [],
      currentExerciseIndex: 0,
      currentSetNumber: 1,
    })
  }, [])

  const recordSet = useCallback((data: Omit<CompletedSetData, 'exerciseId' | 'exerciseName' | 'exerciseCategory' | 'setNumber'>) => {
    const currentExercise = session.exercises[state.currentExerciseIndex]
    if (!currentExercise) return

    const setData: CompletedSetData = {
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      exerciseCategory: currentExercise.category,
      setNumber: state.currentSetNumber,
      ...data,
    }

    setState(prev => {
      const newCompletedSets = [...prev.completedSets, setData]
      const isLastSet = prev.currentSetNumber >= currentExercise.sets
      const isLastExercise = prev.currentExerciseIndex >= session.exercises.length - 1

      if (isLastSet && isLastExercise) {
        // Workout complete
        return {
          ...prev,
          completedSets: newCompletedSets,
          status: 'completed',
        }
      } else if (isLastSet) {
        // Move to next exercise
        return {
          ...prev,
          completedSets: newCompletedSets,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSetNumber: 1,
        }
      } else {
        // Next set of same exercise
        return {
          ...prev,
          completedSets: newCompletedSets,
          currentSetNumber: prev.currentSetNumber + 1,
        }
      }
    })
  }, [session.exercises, state.currentExerciseIndex, state.currentSetNumber])

  const nextExercise = useCallback(() => {
    setState(prev => {
      if (prev.currentExerciseIndex >= session.exercises.length - 1) {
        return { ...prev, status: 'completed' }
      }
      return {
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        currentSetNumber: 1,
      }
    })
  }, [session.exercises.length])

  const skipExercise = useCallback(() => {
    nextExercise()
  }, [nextExercise])

  // Save session to workout log
  const save = useCallback(async (notes?: string): Promise<WorkoutSaveAthleteStatus> => {
    if (state.status !== 'completed' || state.completedSets.length === 0) {
      return describeWorkoutSaveResult({ outcome: 'failed' })
    }
    if (saveLockRef.current) return describeWorkoutSaveResult({ outcome: 'saving' })
    saveLockRef.current = true
    if (!occurrenceIdRef.current) occurrenceIdRef.current = createOccurrenceId()
    const occurrenceId = occurrenceIdRef.current
    const sessionDate = new Date().toISOString().split('T')[0]

    try {
      // Map completed sets to workout exercises
      const exerciseMap = new Map<string, WorkoutExercise>()
      
      for (const set of state.completedSets) {
        if (!exerciseMap.has(set.exerciseId)) {
          exerciseMap.set(set.exerciseId, {
            id: set.exerciseId,
            name: set.exerciseName,
            category: mapCategoryToLogCategory(set.exerciseCategory),
            sets: 0,
            reps: set.actualReps,
            completed: true,
          })
        }
        const exercise = exerciseMap.get(set.exerciseId)!
        exercise.sets += 1
        exercise.reps = Math.round(
          ((exercise.reps || 0) * (exercise.sets - 1) + set.actualReps) / exercise.sets
        )
      }

      const exercises = Array.from(exerciseMap.values())
      // Ensure minimum 1 minute duration to prevent 0-minute sessions
      const durationMinutes = Math.max(1, Math.round(state.elapsedSeconds / 60))

      const savedLog = saveWorkoutLog({
        sessionName: session.dayLabel,
        sessionType: 'mixed' as SessionType,
        sessionDate,
        durationMinutes,
        focusArea: mapFocusToFocusArea(session.focusLabel),
        notes,
        exercises,
        occurrenceId,
      })

      if (savedLog.saveDisposition === 'inserted') {
        const newAchievements = onTrainingEvent('workout_complete')
        if (newAchievements.length > 0) {
          showAchievementNotifications(newAchievements)
        }
        const completedChallenges = onTrainingEventForChallenges()
        if (completedChallenges.length > 0) {
          showChallengeNotifications(completedChallenges)
        }
      }

      // Persist to workout history system (database). A history failure
      // keeps the local log and the same occurrence id for the retry.
      let historySync: HistorySyncState = 'skipped'
      if (userId) {
        try {
        const historyResult = await persistWorkoutSession({
          userId,
          workoutName: session.dayLabel,
          workoutDate: sessionDate,
          clientSessionId: occurrenceId,
          dayLabel: session.dayLabel,
          focusArea: session.focusLabel,
          durationMinutes,
          completedSets: state.completedSets,
          // [ADAPTIVE-EXERCISE-CANONICAL-FIELDS] AdaptiveExercise stores
          // prescription as the single string `repsOrTime` (e.g. "8",
          // "10-12", "20s", "30-45s") and prescribed weight inside
          // `prescribedLoad.load`. The legacy fields `reps`, `hold`,
          // `weight` never existed on AdaptiveExercise. Parse the
          // canonical strings into the persisted history shape.
          exercises: session.exercises.map(ex => {
            const repsOrTime = ex.repsOrTime ?? ''
            // Hold prescription is the time-based form ending in 's'
            // (e.g. "20s", "30-45s"). Reps prescription is everything
            // else. Use the canonical lower bound for numeric history.
            const isHold = /s\s*$/i.test(repsOrTime)
            const numericLowerBound = (() => {
              const m = repsOrTime.match(/(\d+(?:\.\d+)?)/)
              return m ? Number.parseFloat(m[1]) : undefined
            })()
            return {
              id: ex.id,
              name: ex.name,
              category: ex.category,
              sets: ex.sets,
              targetReps: isHold ? undefined : numericLowerBound,
              // [WORKOUT-HISTORY-TARGET-HOLD-IS-NUMERIC] history shape
              // requires `number | undefined` (seconds). The canonical
              // hold-prescription string ("20s" / "30-45s") was being
              // assigned directly. Reuse `numericLowerBound` (already
              // parsed from the leading number in repsOrTime) so a hold
              // is persisted as the seconds count.
              targetHold: isHold ? numericLowerBound : undefined,
              weight: ex.prescribedLoad?.load,
            }
          }),
          notes,
        })
        setLastSaveResult(historyResult)
        
        // Log PR achievements for debugging
        if (historyResult.prsDetected.length > 0) {
          console.log('[WorkoutSession] PRs detected:', historyResult.prsDetected)
        }
        historySync = classifyHistoryPersistence(historyResult)
        } catch (error) {
          console.error('[WorkoutSession] History sync failed:', error)
          historySync = 'failed'
        }
      }

      // Record RPE once, including when History did not sync.
      if (savedLog.saveDisposition !== 'inserted') {
        return describeWorkoutSaveResult({
          outcome: 'saved',
          saveDisposition: savedLog.saveDisposition,
          serverEvidence: savedLog.serverEvidence,
          historySync,
        })
      }

      // Record RPE session for fatigue engine
      const rpeExercises = Array.from(
        state.completedSets.reduce((map, set) => {
          if (!map.has(set.exerciseName)) {
            map.set(set.exerciseName, { exerciseName: set.exerciseName, sets: [] })
          }
          const effort = measuredSessionRpe([set.actualRPE])
          if (effort === null) return map
          map.get(set.exerciseName)!.sets.push({
            setNumber: set.setNumber,
            targetRPE: measuredSessionRpe([set.targetRPE]) ?? effort,
            actualRPE: effort,
            targetReps: set.targetReps,
            actualReps: set.actualReps,
          })
          return map
        }, new Map<string, { exerciseName: string; sets: { setNumber: number; targetRPE: number; actualRPE: number; targetReps: number; actualReps: number }[] }>())
      ).map(([_, data]) => data)
        .filter(data => data.sets.length > 0)

      if (rpeExercises.length > 0) {
        recordRPESession({
          sessionId: occurrenceId,
          sessionDate: new Date().toISOString(),
          exercises: rpeExercises,
        })
      }

      return describeWorkoutSaveResult({
        outcome: 'saved',
        saveDisposition: savedLog.saveDisposition,
        serverEvidence: savedLog.serverEvidence,
        historySync,
      })
    } catch (error) {
      console.error('Failed to save workout session:', error)
      return describeWorkoutSaveResult({ outcome: 'failed' })
    } finally {
      saveLockRef.current = false
    }
  }, [state.status, state.completedSets, state.elapsedSeconds, session, userId])

  return {
    // State
    ...state,
    stats,
    isActive: state.status === 'active',
    isPaused: state.status === 'paused',
    isCompleted: state.status === 'completed',
    formattedDuration: formatDuration(state.elapsedSeconds),
    canSave: state.status === 'completed' && state.completedSets.length > 0,
    lastSaveResult,
    
    // Controls
    start,
    pause,
    resume,
    finish,
    reset,
    recordSet,
    nextExercise,
    skipExercise,
    save,
  }
}
