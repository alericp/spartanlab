/**
 * Unified Program State Utility
 * 
 * SINGLE SOURCE OF TRUTH for program existence checks across the app.
 * All routes MUST use this instead of direct getLatestAdaptiveProgram() calls
 * for consistent behavior.
 */

import { getLatestAdaptiveProgram, type AdaptiveProgram } from './adaptive-program-builder'
import { getLatestProgram, type GeneratedProgram } from './program-service'

export interface ProgramState {
  hasProgram: boolean
  adaptiveProgram: AdaptiveProgram | null
  legacyProgram: GeneratedProgram | null
  activeProgram: AdaptiveProgram | GeneratedProgram | null
  sessionCount: number
}

/**
 * Get unified program state - THE canonical check for program existence
 * 
 * Usage:
 * const { hasProgram, activeProgram } = getProgramState()
 * if (hasProgram) { ... }
 */
export function getProgramState(): ProgramState {
  let adaptiveProgram: AdaptiveProgram | null = null
  let legacyProgram: GeneratedProgram | null = null
  
  try {
    adaptiveProgram = getLatestAdaptiveProgram()
  } catch {
    adaptiveProgram = null
  }
  
  try {
    legacyProgram = getLatestProgram()
  } catch {
    legacyProgram = null
  }
  
  // Prefer adaptive program over legacy
  const activeProgram = adaptiveProgram || legacyProgram
  
  // Canonical hasProgram check: must have sessions array with at least one session
  const hasProgram = !!(
    (adaptiveProgram && Array.isArray(adaptiveProgram.sessions) && adaptiveProgram.sessions.length > 0) ||
    (legacyProgram && legacyProgram.trainingDaysPerWeek > 0)
  )
  
  const sessionCount = adaptiveProgram?.sessions?.length || legacyProgram?.trainingDaysPerWeek || 0
  
  return {
    hasProgram,
    adaptiveProgram,
    legacyProgram,
    activeProgram,
    sessionCount,
  }
}

/**
 * Simple boolean check for program existence
 * Use this for quick guards, use getProgramState() when you need the program data
 */
export function hasActiveProgram(): boolean {
  return getProgramState().hasProgram
}
