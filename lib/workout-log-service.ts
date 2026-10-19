// Workout Log service layer for preview mode
// Uses localStorage for persistence, easy to swap to Prisma later

/**
 * Workout Log Service
 * 
 * DO NOT DRIFT: This is the CANONICAL WORKOUT LOGGING entrypoint.
 * All session completion MUST call saveWorkoutLog() with trusted=true ONLY for real user completions.
 * The trusted flag determines whether data feeds back into next generation.
 * Demo workouts (isDemo=true) are NEVER trusted and never affect adaptive logic.
 */

import { saveSessionFeedback } from './session-feedback'
import { selectOwnedHistoryRetry } from './workout/history-progress'
import {
  occurrenceAfterEvidenceSave,
  planLocalWorkoutSave,
  workoutLogIdForOccurrence,
  WORKOUT_OCCURRENCE_STORAGE_KEY,
  type StoredOccurrence,
} from './workout/save-reliability'
// [PHASE-L / AB10-CONTRACT-CLEANUP] CompletedSetEvidence is the canonical
// per-set ledger shape — type-only import keeps the runtime acyclic while
// pinning WorkoutLog and QuickLogInput to the authoritative contract.
import type { CompletedSetEvidence } from './program/performance-feedback-adaptation-contract'
import { persistActiveProgramPerformanceFeedback } from './program/performance-feedback-persistence'

export type SessionType = 'skill' | 'strength' | 'mixed' | 'recovery'
export type FocusArea = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup' | 'weighted_strength' | 'general'
export type ExerciseCategory = 'skill' | 'push' | 'pull' | 'core' | 'legs' | 'mobility'
export type PerceivedDifficulty = 'easy' | 'normal' | 'hard'

export type ResistanceBandColor = 'yellow' | 'red' | 'black' | 'purple' | 'green' | 'blue'

export interface BandUsage {
  bandColor?: ResistanceBandColor
  assisted: boolean
}

export interface WorkoutExercise {
  id: string
  name: string
  category: ExerciseCategory
  sets: number
  reps?: number
  load?: number
  holdSeconds?: number
  completed: boolean
  band?: BandUsage // Optional band assistance tracking
  supportsBandAssistance?: boolean // Whether this exercise can use bands
}

export interface WorkoutLog {
  id: string
  createdAt: string
  sessionName: string
  sessionType: SessionType
  sessionDate: string
  durationMinutes: number
  focusArea: FocusArea
  notes?: string
  exercises: WorkoutExercise[]
  // Perceived difficulty for adaptive progression
  perceivedDifficulty?: PerceivedDifficulty
  // Quick log metadata
  isQuickLog?: boolean
  generatedWorkoutId?: string
  // Key performance metrics (best reps in session)
  keyPerformance?: {
    pullUps?: number
    dips?: number
    pushUps?: number
    skillHoldSeconds?: number
    skillName?: string
  }
  // Time optimization tracking
  timeOptimization?: {
    wasOptimized: boolean
    originalMinutes: number
    targetMinutes: number
    actualMinutes: number
    removedExerciseCount: number
    reducedExerciseCount: number
  }
  // FEEDBACK LOOP: Completion status for adaptive engine
  completionStatus?: 'completed' | 'partial' | 'skipped'
  // FEEDBACK LOOP: Whether this log is trusted for adaptive decisions
  // Only true for real user-completed workouts, not demo/debug
  trusted?: boolean
  // FEEDBACK LOOP: Source route for tracking
  sourceRoute?: 'workout_session' | 'first_session' | 'quick_log' | 'demo'
  // [EXECUTION-TRUTH-FIX] Exercise-level notes and flags
  exerciseNotes?: {
    exerciseIndex: number
    exerciseName: string
    flags: string[]
    freeText: string
  }[]
  // [PHASE-L / AB10-CONTRACT-CLEANUP] Per-set evidence ledger written by
  // StreamlinedWorkoutSession.handleCompleteWorkout() and read by
  // extractCompletedSetEvidence() in the performance-feedback contract.
  // This is the authoritative source ownership — referenced by
  // lib/server/workout-set-evidence-persistence.ts and
  // lib/program/performance-feedback-adaptation-contract.ts.
  completedSetEvidence?: CompletedSetEvidence[]
  occurrenceId?: string
  serverEvidence?: 'pending' | 'saved' | 'skipped'
  /** Signed-in athlete who owns a history retry. Another account must not read it. */
  ownerUserId?: string
  /** Pending means History still needs the original occurrence id. */
  historySync?: 'pending' | 'updated' | 'skipped'
}

export type SavedWorkoutLog = WorkoutLog & { saveDisposition: 'inserted' | 'kept' }

const STORAGE_KEY = 'spartanlab_workout_logs'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Get all workout logs
export function getWorkoutLogs(): WorkoutLog[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

const evidenceSyncInFlight = new Set<string>()

function evidenceSyncNeeded(log: WorkoutLog): boolean {
  return log.trusted !== false
    && log.sourceRoute !== 'demo'
    && Array.isArray(log.completedSetEvidence)
    && log.completedSetEvidence.length > 0
}

function writeStoredLogs(logs: WorkoutLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function markLoggedHistorySync(
  occurrenceId: string,
  userId: string,
  state: 'pending' | 'updated' | 'skipped',
): void {
  if (!isBrowser() || !occurrenceId || !userId) return
  const logs = getWorkoutLogs()
  const index = logs.findIndex(log => log.occurrenceId === occurrenceId)
  if (index < 0) return
  const current = logs[index]
  if (current.ownerUserId && current.ownerUserId !== userId) return
  logs[index] = { ...current, ownerUserId: userId, historySync: state }
  writeStoredLogs(logs)
}

export function readLoggedHistoryRetry(
  userId: string | null | undefined,
  source: 'manual' | 'quick',
  match?: { sessionName?: string; generatedWorkoutId?: string },
): WorkoutLog | null {
  if (!isBrowser()) return null
  return selectOwnedHistoryRetry(getWorkoutLogs(), userId, source, match)
}

function patchStoredLog(id: string, patch: Partial<WorkoutLog>) {
  const logs = getWorkoutLogs()
  const index = logs.findIndex((log) => log.id === id)
  if (index < 0) return
  logs[index] = { ...logs[index], ...patch }
  writeStoredLogs(logs)
}

function releaseOccurrenceAfterEvidenceSave(occurrenceId?: string) {
  if (!isBrowser() || !occurrenceId) return
  try {
    const raw = localStorage.getItem(WORKOUT_OCCURRENCE_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as StoredOccurrence
    if (!parsed || typeof parsed.sessionId !== 'string' || typeof parsed.occurrenceId !== 'string') return
    const decision = occurrenceAfterEvidenceSave(parsed, occurrenceId)
    if (decision.action === 'release') {
      localStorage.removeItem(WORKOUT_OCCURRENCE_STORAGE_KEY)
    } else if (decision.action === 'keep') {
      localStorage.setItem(WORKOUT_OCCURRENCE_STORAGE_KEY, JSON.stringify(decision.occurrence))
    }
  } catch {}
}

function scheduleEvidenceRetry(log: WorkoutLog, attempt: number) {
  const timer = setTimeout(() => queueEvidenceSync(log, attempt), 1000) as { unref?: () => void }
  timer.unref?.()
}

function queueEvidenceSync(log: WorkoutLog, attempt = 0) {
  if (!isBrowser() || !evidenceSyncNeeded(log) || evidenceSyncInFlight.has(log.id)) return
  evidenceSyncInFlight.add(log.id)
  try {
    const programId = log.generatedWorkoutId?.split('_session_')[0] || null
    fetch('/api/workout-log/save-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutLog: log,
        programId,
      }),
    })
      .then((response) => {
        evidenceSyncInFlight.delete(log.id)
        if (response.ok) {
          patchStoredLog(log.id, { serverEvidence: 'saved' })
          releaseOccurrenceAfterEvidenceSave(log.occurrenceId)
          return
        }
        if (attempt < 1) {
          scheduleEvidenceRetry(log, attempt + 1)
          return
        }
        patchStoredLog(log.id, { serverEvidence: 'pending' })
      })
      .catch(() => {
        evidenceSyncInFlight.delete(log.id)
        if (attempt < 1) {
          scheduleEvidenceRetry(log, attempt + 1)
          return
        }
        patchStoredLog(log.id, { serverEvidence: 'pending' })
      })
  } catch {
    evidenceSyncInFlight.delete(log.id)
    patchStoredLog(log.id, { serverEvidence: 'pending' })
  }
}

export function retryPendingWorkoutEvidence(): void {
  if (!isBrowser()) return
  for (const log of getWorkoutLogs()) {
    if (log.serverEvidence === 'pending') queueEvidenceSync(log)
  }
}

// Save a workout log
export function saveWorkoutLog(log: Omit<WorkoutLog, 'id' | 'createdAt'>): SavedWorkoutLog {
  const occurrenceId = log.occurrenceId
  const id = occurrenceId
    ? workoutLogIdForOccurrence(occurrenceId)
    : `workout-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const candidate: WorkoutLog = {
    ...log,
    id,
    occurrenceId,
    createdAt: new Date().toISOString(),
    serverEvidence: evidenceSyncNeeded({ ...log, id, createdAt: '' }) ? 'pending' : 'skipped',
  }

  if (!isBrowser()) {
    return { ...candidate, saveDisposition: 'inserted' }
  }

  const logs = getWorkoutLogs()
  const plan = planLocalWorkoutSave(logs, candidate)

  if (plan.action === 'insert') {
    logs.push(plan.log)
    writeStoredLogs(logs)
    queueEvidenceSync(plan.log)
  } else if (plan.action === 'retry-server') {
    queueEvidenceSync(plan.log)
  }

  // Auto-save session feedback only for the first local commit.
  if (plan.action === 'insert') {
    try {
      saveSessionFeedback(plan.log.id, {
        difficulty: plan.log.perceivedDifficulty || 'normal',
        completed: plan.log.exercises.every(e => e.completed),
        trusted: plan.log.trusted !== false && plan.log.sourceRoute !== 'demo',
      })
      console.log('[fatigue-loop] Session feedback saved:', {
        sessionId: plan.log.id,
        difficulty: plan.log.perceivedDifficulty || 'normal',
        trusted: plan.log.trusted !== false && plan.log.sourceRoute !== 'demo',
      })
    } catch {
      // Non-blocking - don't fail the save if feedback capture fails
    }
  }

  return {
    ...plan.log,
    saveDisposition: plan.action === 'insert' ? 'inserted' : 'kept',
  }
}

// Delete a workout log
export function deleteWorkoutLog(id: string): boolean {
  if (!isBrowser()) return false
  
  const logs = getWorkoutLogs()
  const filtered = logs.filter(l => l.id !== id)
  
  if (filtered.length === logs.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  
  // [PPX-R7.5] Fire non-blocking server evidence delete
  // This ensures deleted workout evidence doesn't feed future adaptation
  try {
    fetch('/api/workout-log/delete-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutLogId: id }),
    })
      .then(response => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PPX-R7.5] Server evidence delete:', {
            workoutId: id,
            status: response.ok ? 'ok' : 'failed',
          })
        }
      })
      .catch(err => {
        // Non-blocking: local delete succeeded, server delete is best-effort
        if (process.env.NODE_ENV === 'development') {
          console.log('[PPX-R7.5] Server evidence delete failed (non-blocking):', String(err))
        }
      })
  } catch {
    // Outer try-catch for environments without fetch
  }
  
  return true
}

// Get recent workout logs (sorted by date descending)
export function getRecentWorkoutLogs(limit: number = 10): WorkoutLog[] {
  const logs = getWorkoutLogs()
  return logs
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, limit)
}

// Get latest workout
export function getLatestWorkout(): WorkoutLog | null {
  const logs = getRecentWorkoutLogs(1)
  return logs[0] || null
}

// Session type labels
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  skill: 'Skill',
  strength: 'Strength',
  mixed: 'Mixed',
  recovery: 'Recovery',
}

// Focus area labels
export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  muscle_up: 'Muscle Up',
  handstand_pushup: 'Handstand Pushup',
  weighted_strength: 'Weighted Strength',
  general: 'General',
}

// Exercise category labels
export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  skill: 'Skill',
  push: 'Push',
  pull: 'Pull',
  core: 'Core',
  legs: 'Legs',
  mobility: 'Mobility',
}

// =============================================================================
// QUICK WORKOUT LOGGING
// =============================================================================

interface QuickLogInput {
  sessionName: string
  sessionType: SessionType
  focusArea: FocusArea
  durationMinutes: number
  perceivedDifficulty: PerceivedDifficulty
  generatedWorkoutId?: string
  keyPerformance?: WorkoutLog['keyPerformance']
  notes?: string
  // FEEDBACK LOOP: Exercise-level outcomes for progression engine
  exercises?: WorkoutExercise[]
  // FEEDBACK LOOP: Mark as demo/debug to exclude from adaptive logic
  isDemo?: boolean
  // FEEDBACK LOOP: Completion quality
  completionStatus?: 'completed' | 'partial' | 'skipped'
  sourceRoute?: 'workout_session' | 'first_session' | 'quick_log' | 'demo'
  // [EXECUTION-TRUTH-FIX] Exercise-level notes and flags
  exerciseNotes?: WorkoutLog['exerciseNotes']
  // [PHASE-L / AB10-CONTRACT-CLEANUP] Per-set evidence ledger forwarded from
  // StreamlinedWorkoutSession into the canonical workout log so future
  // prescription mutation can consume per-set RPE / reps / hold / reason
  // tags. Optional because callers prior to AB10 may not provide it.
  completedSetEvidence?: CompletedSetEvidence[]
  occurrenceId?: string
}

/**
 * Quick log a completed workout with minimal input
 * Used for fast logging of generated workouts
 * 
 * FEEDBACK LOOP: This is the canonical entry point for workout logging.
 * All completed sessions should flow through here for adaptive decisions.
 * 
 * [PHASE 13] After logging, this triggers active-week mutation evaluation.
 */
export function quickLogWorkout(input: QuickLogInput): SavedWorkoutLog {
  // Demo workouts are never trusted for adaptive logic
  const isDemo = input.isDemo === true
  const trusted = !isDemo
  
  console.log('[workout-log] Saving workout:', {
    sessionName: input.sessionName,
    isDemo,
    trusted,
    completionStatus: input.completionStatus || 'completed',
    exerciseCount: input.exercises?.length || 0,
    sourceRoute: input.sourceRoute || (isDemo ? 'demo' : 'workout_session'),
  })
  
  const log = saveWorkoutLog({
    sessionName: input.sessionName,
    sessionType: input.sessionType,
    sessionDate: new Date().toISOString().split('T')[0],
    durationMinutes: input.durationMinutes,
    focusArea: input.focusArea,
    perceivedDifficulty: input.perceivedDifficulty,
    isQuickLog: true,
    generatedWorkoutId: input.generatedWorkoutId,
    keyPerformance: input.keyPerformance,
    notes: input.notes,
    exercises: input.exercises || [], // Include exercise-level outcomes
    // [EXECUTION-TRUTH-FIX] Include exercise-level notes
    exerciseNotes: input.exerciseNotes,
    // FEEDBACK LOOP fields
    completionStatus: input.completionStatus || 'completed',
    trusted,
    sourceRoute: input.sourceRoute || (isDemo ? 'demo' : 'workout_session'),
    // [PHASE-L / AB10-CONTRACT-CLEANUP] Forward per-set evidence verbatim so
    // the canonical workout log carries the ledger StreamlinedWorkoutSession
    // built. Downstream readers (extractCompletedSetEvidence + persistence
    // adapter) consume `log.completedSetEvidence` directly.
    completedSetEvidence: input.completedSetEvidence,
    occurrenceId: input.occurrenceId,
  })
  
  // Persist the future-session adjustment before anything else reads the
  // active program. The program page used to keep this only in React state.
  if (trusted && typeof window !== 'undefined') {
    try {
      persistActiveProgramPerformanceFeedback()
    } catch (err) {
      console.error('[performance-feedback] future session save failed', err)
    }
  }

  // [PHASE 13] Dispatch event for active-week mutation evaluation
  // This allows the program display to react to workout completion
  if (typeof window !== 'undefined' && trusted) {
    window.dispatchEvent(new CustomEvent('spartanlab:workout-logged', {
      detail: {
        workoutId: log.id,
        sessionName: input.sessionName,
        programId: input.generatedWorkoutId?.split('_session_')[0] || null,
        trusted,
      }
    }))
    
    console.log('[phase13] Dispatched workout-logged event for active-week mutation')
  }
  
  return log
}

/**
 * Get perceived difficulty distribution for adaptive adjustments
 */
export function getDifficultyDistribution(days: number = 14): {
  easy: number
  normal: number
  hard: number
  trend: 'getting_easier' | 'stable' | 'getting_harder'
} {
  const logs = getRecentWorkoutLogs(30)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const recentLogs = logs.filter(log => 
    new Date(log.sessionDate) >= cutoffDate && log.perceivedDifficulty
  )
  
  const counts = {
    easy: recentLogs.filter(l => l.perceivedDifficulty === 'easy').length,
    normal: recentLogs.filter(l => l.perceivedDifficulty === 'normal').length,
    hard: recentLogs.filter(l => l.perceivedDifficulty === 'hard').length,
  }
  
  // Determine trend based on recent vs older logs
  const midpoint = Math.floor(recentLogs.length / 2)
  const recentHalf = recentLogs.slice(0, midpoint)
  const olderHalf = recentLogs.slice(midpoint)
  
  const recentHardRate = recentHalf.filter(l => l.perceivedDifficulty === 'hard').length / (recentHalf.length || 1)
  const olderHardRate = olderHalf.filter(l => l.perceivedDifficulty === 'hard').length / (olderHalf.length || 1)
  
  let trend: 'getting_easier' | 'stable' | 'getting_harder' = 'stable'
  if (recentHardRate > olderHardRate + 0.2) trend = 'getting_harder'
  else if (recentHardRate < olderHardRate - 0.2) trend = 'getting_easier'
  
  return { ...counts, trend }
}

/**
 * Get workout completion stats for a period
 */
export function getCompletionStats(days: number = 30): {
  totalWorkouts: number
  avgDuration: number
  avgDifficultyScore: number // 1=easy, 2=normal, 3=hard
  workoutsPerWeek: number
} {
  const logs = getRecentWorkoutLogs(100)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const recentLogs = logs.filter(log => new Date(log.sessionDate) >= cutoffDate)
  
  const totalWorkouts = recentLogs.length
  const avgDuration = totalWorkouts > 0
    ? recentLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / totalWorkouts
    : 0
  
  const difficultyScores = recentLogs
    .filter(l => l.perceivedDifficulty)
    .map(l => l.perceivedDifficulty === 'easy' ? 1 : l.perceivedDifficulty === 'normal' ? 2 : 3)
  
  const avgDifficultyScore = difficultyScores.length > 0
    ? difficultyScores.reduce((a, b) => a + b, 0) / difficultyScores.length
    : 2
  
  const weeks = days / 7
  const workoutsPerWeek = totalWorkouts / weeks
  
  return { totalWorkouts, avgDuration, avgDifficultyScore, workoutsPerWeek }
}

// Perceived difficulty labels
export const DIFFICULTY_LABELS: Record<PerceivedDifficulty, string> = {
  easy: 'Easy - Could do more',
  normal: 'Normal - Just right',
  hard: 'Hard - Pushed my limits',
}

// Common exercise templates for quick selection
export const EXERCISE_TEMPLATES: { name: string; category: ExerciseCategory }[] = [
  // Skills
  { name: 'Planche Lean', category: 'skill' },
  { name: 'Tuck Planche Hold', category: 'skill' },
  { name: 'Advanced Tuck Planche', category: 'skill' },
  { name: 'Front Lever Tuck Hold', category: 'skill' },
  { name: 'Front Lever Raises', category: 'skill' },
  { name: 'Handstand Hold', category: 'skill' },
  { name: 'Muscle-Up', category: 'skill' },
  // Push
  { name: 'Weighted Dips', category: 'push' },
  { name: 'Dips', category: 'push' },
  { name: 'Push-Ups', category: 'push' },
  { name: 'Pseudo Planche Push-Ups', category: 'push' },
  { name: 'Pike Push-Ups', category: 'push' },
  { name: 'Wall HSPU', category: 'push' },
  // Pull
  { name: 'Weighted Pull-Ups', category: 'pull' },
  { name: 'Pull-Ups', category: 'pull' },
  { name: 'Chin-Ups', category: 'pull' },
  { name: 'Bodyweight Rows', category: 'pull' },
  { name: 'Scap Pull-Ups', category: 'pull' },
  { name: 'Archer Pull-Ups', category: 'pull' },
  // Core
  { name: 'Hollow Body Hold', category: 'core' },
  { name: 'L-Sit Hold', category: 'core' },
  { name: 'Hanging Knee Raises', category: 'core' },
  { name: 'Dragon Flags', category: 'core' },
  { name: 'Ab Wheel Rollouts', category: 'core' },
  // Legs
  { name: 'Pistol Squats', category: 'legs' },
  { name: 'Bulgarian Split Squats', category: 'legs' },
  { name: 'Nordic Curls', category: 'legs' },
  // Mobility
  { name: 'Shoulder Dislocates', category: 'mobility' },
  { name: 'Wrist Circles', category: 'mobility' },
  { name: 'Hip Flexor Stretch', category: 'mobility' },
]
