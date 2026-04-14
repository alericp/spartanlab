/**
 * Week Advancement Service
 * 
 * =============================================================================
 * SINGLE PURPOSE: Safe week progression without program regeneration
 * =============================================================================
 * 
 * This service handles advancing the active program from one week to the next
 * WITHOUT triggering any program regeneration or rebuild logic.
 * 
 * CORE PRINCIPLES:
 * - NEVER regenerates sessions
 * - NEVER modifies exercise content
 * - ONLY updates the authoritative `weekNumber` field
 * - Preserves all program identity and structure
 * - Safe persistence to localStorage
 * 
 * USE CASE:
 * User has trained through week 1 and wants to move to week 2 while
 * keeping the same generated program structure.
 */

import { getLatestAdaptiveProgram, saveAdaptiveProgram, type AdaptiveProgram } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface WeekAdvancementResult {
  success: boolean
  previousWeek: number
  newWeek: number
  programId: string
  advancedAt: string
  error?: string
  wasAlreadyOnTargetWeek?: boolean
}

export interface WeekProgressionState {
  currentWeek: number
  totalWeeksInCycle: number
  canAdvance: boolean
  cannotAdvanceReason?: string
  programId: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** 
 * Default program cycle length in weeks.
 * Most calisthenics programs run 4-8 week cycles before deload/reset.
 */
const DEFAULT_CYCLE_LENGTH = 4

/**
 * Storage key for week advancement history.
 */
const WEEK_ADVANCEMENT_HISTORY_KEY = 'spartanlab_week_advancement_history'

// =============================================================================
// MAIN ADVANCEMENT FUNCTION
// =============================================================================

/**
 * Advance the active program to the next week.
 * 
 * This is the PRIMARY entry point for week advancement.
 * It ONLY modifies the weekNumber field and re-saves the program.
 * 
 * @returns WeekAdvancementResult with success/failure and new week number
 */
export function advanceToNextWeek(): WeekAdvancementResult {
  const timestamp = new Date().toISOString()
  
  // Get current program
  const program = getLatestAdaptiveProgram()
  
  if (!program) {
    return {
      success: false,
      previousWeek: 0,
      newWeek: 0,
      programId: '',
      advancedAt: timestamp,
      error: 'No active program found',
    }
  }
  
  const currentWeek = program.weekNumber || 1
  const cycleLength = DEFAULT_CYCLE_LENGTH
  
  // Check if we're already at the final week of the cycle
  if (currentWeek >= cycleLength) {
    return {
      success: false,
      previousWeek: currentWeek,
      newWeek: currentWeek,
      programId: program.id,
      advancedAt: timestamp,
      error: `Already at week ${currentWeek} of ${cycleLength}. Consider regenerating for a new cycle.`,
    }
  }
  
  const newWeek = currentWeek + 1
  
  // Create updated program with ONLY the weekNumber changed
  const updatedProgram: AdaptiveProgram = {
    ...program,
    weekNumber: newWeek,
  }
  
  // Persist the updated program
  try {
    saveAdaptiveProgram(updatedProgram)
    
    // Log the advancement for history/debugging
    console.log('[week-advancement] Successfully advanced week', {
      programId: program.id,
      previousWeek: currentWeek,
      newWeek,
      timestamp,
    })
    
    // Save to advancement history
    saveAdvancementHistory({
      programId: program.id,
      previousWeek: currentWeek,
      newWeek,
      advancedAt: timestamp,
    })
    
    // Dispatch event for UI components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spartanlab:week-advanced', {
        detail: { previousWeek: currentWeek, newWeek, programId: program.id }
      }))
    }
    
    return {
      success: true,
      previousWeek: currentWeek,
      newWeek,
      programId: program.id,
      advancedAt: timestamp,
    }
  } catch (err) {
    console.error('[week-advancement] Failed to save advanced program:', err)
    return {
      success: false,
      previousWeek: currentWeek,
      newWeek: currentWeek,
      programId: program.id,
      advancedAt: timestamp,
      error: `Failed to save: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Advance to a specific week number (for flexibility).
 * 
 * Use this when you need to jump to a specific week, not just the next one.
 * Still validates the target week is within cycle bounds.
 */
export function advanceToWeek(targetWeek: number): WeekAdvancementResult {
  const timestamp = new Date().toISOString()
  
  const program = getLatestAdaptiveProgram()
  
  if (!program) {
    return {
      success: false,
      previousWeek: 0,
      newWeek: 0,
      programId: '',
      advancedAt: timestamp,
      error: 'No active program found',
    }
  }
  
  const currentWeek = program.weekNumber || 1
  const cycleLength = DEFAULT_CYCLE_LENGTH
  
  // Validate target week
  if (targetWeek < 1) {
    return {
      success: false,
      previousWeek: currentWeek,
      newWeek: currentWeek,
      programId: program.id,
      advancedAt: timestamp,
      error: 'Week number must be at least 1',
    }
  }
  
  if (targetWeek > cycleLength) {
    return {
      success: false,
      previousWeek: currentWeek,
      newWeek: currentWeek,
      programId: program.id,
      advancedAt: timestamp,
      error: `Week ${targetWeek} exceeds cycle length of ${cycleLength}`,
    }
  }
  
  if (targetWeek === currentWeek) {
    return {
      success: true,
      previousWeek: currentWeek,
      newWeek: targetWeek,
      programId: program.id,
      advancedAt: timestamp,
      wasAlreadyOnTargetWeek: true,
    }
  }
  
  // Create updated program
  const updatedProgram: AdaptiveProgram = {
    ...program,
    weekNumber: targetWeek,
  }
  
  try {
    saveAdaptiveProgram(updatedProgram)
    
    console.log('[week-advancement] Advanced to specific week', {
      programId: program.id,
      previousWeek: currentWeek,
      newWeek: targetWeek,
      timestamp,
    })
    
    saveAdvancementHistory({
      programId: program.id,
      previousWeek: currentWeek,
      newWeek: targetWeek,
      advancedAt: timestamp,
    })
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spartanlab:week-advanced', {
        detail: { previousWeek: currentWeek, newWeek: targetWeek, programId: program.id }
      }))
    }
    
    return {
      success: true,
      previousWeek: currentWeek,
      newWeek: targetWeek,
      programId: program.id,
      advancedAt: timestamp,
    }
  } catch (err) {
    console.error('[week-advancement] Failed to advance to specific week:', err)
    return {
      success: false,
      previousWeek: currentWeek,
      newWeek: currentWeek,
      programId: program.id,
      advancedAt: timestamp,
      error: `Failed to save: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

// =============================================================================
// STATE INSPECTION FUNCTIONS
// =============================================================================

/**
 * Get the current week progression state.
 * 
 * Use this to display current week and determine if advancement is available.
 */
export function getWeekProgressionState(): WeekProgressionState | null {
  const program = getLatestAdaptiveProgram()
  
  if (!program) {
    return null
  }
  
  const currentWeek = program.weekNumber || 1
  const cycleLength = DEFAULT_CYCLE_LENGTH
  const canAdvance = currentWeek < cycleLength
  
  return {
    currentWeek,
    totalWeeksInCycle: cycleLength,
    canAdvance,
    cannotAdvanceReason: canAdvance ? undefined : `At final week (${currentWeek}/${cycleLength}). Regenerate for new cycle.`,
    programId: program.id,
  }
}

/**
 * Get the current week number from the active program.
 * Simple convenience function for UI display.
 */
export function getCurrentWeekNumber(): number {
  const program = getLatestAdaptiveProgram()
  return program?.weekNumber || 1
}

// =============================================================================
// HISTORY FUNCTIONS
// =============================================================================

interface AdvancementHistoryEntry {
  programId: string
  previousWeek: number
  newWeek: number
  advancedAt: string
}

/**
 * Save advancement to history for tracking/debugging.
 */
function saveAdvancementHistory(entry: AdvancementHistoryEntry): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(WEEK_ADVANCEMENT_HISTORY_KEY)
    const history: AdvancementHistoryEntry[] = stored ? JSON.parse(stored) : []
    
    // Keep only last 20 entries
    history.unshift(entry)
    if (history.length > 20) history.pop()
    
    localStorage.setItem(WEEK_ADVANCEMENT_HISTORY_KEY, JSON.stringify(history))
  } catch (err) {
    console.warn('[week-advancement] Failed to save history:', err)
  }
}

/**
 * Get advancement history for debugging/display.
 */
export function getAdvancementHistory(): AdvancementHistoryEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(WEEK_ADVANCEMENT_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Clear advancement history.
 */
export function clearAdvancementHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WEEK_ADVANCEMENT_HISTORY_KEY)
}
