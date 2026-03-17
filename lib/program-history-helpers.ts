/**
 * Program History Helpers
 * 
 * Additional utility functions for program history management
 * Including "Start New Program" and history statistics
 */

import {
  createProgramVersion,
  getFullProgramHistory,
  type ProgramVersionResult,
  type ProgramHistoryContext,
} from './program-history-versioning'
import type { ProgramHistory } from '@/types/history'
import type { AdaptiveProgram } from './adaptive-program-builder'
import type { GenerationReason } from './program-version-service'

// =============================================================================
// START NEW PROGRAM (HARD RESET SUPPORT)
// =============================================================================

export type ResetReason = 'time_off' | 'goal_change' | 'life_change' | 'schedule_change' | 'user_request'

/**
 * Start a completely new program (hard reset)
 * Archives current program and creates a new one from scratch
 * 
 * This is the foundation for the "Start New Program" UI flow
 */
export async function startNewProgram(
  userId: string,
  newProgram: AdaptiveProgram,
  resetReason?: ResetReason
): Promise<ProgramVersionResult> {
  // Map reset reasons to generation reasons
  const reasonMap: Record<ResetReason, GenerationReason> = {
    time_off: 'manual_regeneration',
    goal_change: 'settings_goal_change',
    life_change: 'settings_schedule_change',
    schedule_change: 'settings_schedule_change',
    user_request: 'manual_regeneration',
  }
  
  const generationReason = resetReason ? reasonMap[resetReason] : 'manual_regeneration'
  
  return createProgramVersion({
    userId,
    program: newProgram,
    generationReason,
  })
}

// =============================================================================
// HISTORY STATISTICS
// =============================================================================

export interface ProgramHistoryStats {
  totalPrograms: number
  activeProgram: ProgramHistory | null
  archivedPrograms: number
  totalWorkoutSessions: number
  totalPRsAchieved: number
  oldestProgramDate: string | null
  newestProgramDate: string | null
}

/**
 * Get a summary of program history stats for a user
 */
export async function getProgramHistoryStats(userId: string): Promise<ProgramHistoryStats> {
  const history = await getFullProgramHistory(userId)
  
  // Sum up stats from all programs
  let totalWorkoutSessions = 0
  let totalPRsAchieved = 0
  let oldestDate: string | null = null
  let newestDate: string | null = null
  
  const allPrograms = [history.activeProgram, ...history.archivedPrograms].filter(Boolean) as ProgramHistory[]
  
  for (const program of allPrograms) {
    totalWorkoutSessions += program.totalSessionsCompleted || 0
    totalPRsAchieved += program.totalPRsAchieved || 0
    
    // Track date range
    if (!oldestDate || program.createdAt < oldestDate) {
      oldestDate = program.createdAt
    }
    if (!newestDate || program.createdAt > newestDate) {
      newestDate = program.createdAt
    }
  }
  
  return {
    totalPrograms: history.totalVersions,
    activeProgram: history.activeProgram,
    archivedPrograms: history.archivedPrograms.length,
    totalWorkoutSessions,
    totalPRsAchieved,
    oldestProgramDate: oldestDate,
    newestProgramDate: newestDate,
  }
}

// =============================================================================
// PROGRAM COMPARISON HELPERS (PREPARED FOR FUTURE UI)
// =============================================================================

export interface ProgramComparison {
  oldProgram: ProgramHistory
  newProgram: ProgramHistory
  changes: {
    goalChanged: boolean
    oldGoal: string | null
    newGoal: string | null
    frequencyChanged: boolean
    oldFrequency: number | null
    newFrequency: number | null
    durationChanged: boolean
    oldDuration: number | null
    newDuration: number | null
  }
  daysBetween: number
}

/**
 * Compare two program versions
 * Useful for "What changed?" UI in program history
 */
export function compareProgramVersions(
  oldProgram: ProgramHistory,
  newProgram: ProgramHistory
): ProgramComparison {
  const oldDate = new Date(oldProgram.createdAt)
  const newDate = new Date(newProgram.createdAt)
  const daysBetween = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    oldProgram,
    newProgram,
    changes: {
      goalChanged: oldProgram.primaryGoal !== newProgram.primaryGoal,
      oldGoal: oldProgram.primaryGoal ?? null,
      newGoal: newProgram.primaryGoal ?? null,
      frequencyChanged: oldProgram.trainingDaysPerWeek !== newProgram.trainingDaysPerWeek,
      oldFrequency: oldProgram.trainingDaysPerWeek ?? null,
      newFrequency: newProgram.trainingDaysPerWeek ?? null,
      durationChanged: oldProgram.sessionLengthMinutes !== newProgram.sessionLengthMinutes,
      oldDuration: oldProgram.sessionLengthMinutes ?? null,
      newDuration: newProgram.sessionLengthMinutes ?? null,
    },
    daysBetween,
  }
}

/**
 * Get consecutive version comparisons for a user's history
 * Useful for timeline/evolution views
 */
export async function getVersionComparisons(
  userId: string,
  limit: number = 10
): Promise<ProgramComparison[]> {
  const history = await getFullProgramHistory(userId, limit + 1)
  
  // Combine active and archived, sort by date descending
  const allPrograms = [
    history.activeProgram,
    ...history.archivedPrograms,
  ].filter(Boolean) as ProgramHistory[]
  
  // Sort by creation date (newest first)
  allPrograms.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  // Build comparisons between consecutive versions
  const comparisons: ProgramComparison[] = []
  
  for (let i = 0; i < allPrograms.length - 1 && i < limit; i++) {
    const newer = allPrograms[i]
    const older = allPrograms[i + 1]
    comparisons.push(compareProgramVersions(older, newer))
  }
  
  return comparisons
}
