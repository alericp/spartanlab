/**
 * Persist a future-session performance adjustment onto the canonical
 * active program. The next workout load reads that saved program.
 * Completed workout logs are not rewritten.
 */

import {
  getLatestAdaptiveProgram,
  saveAdaptiveProgram,
  type AdaptiveProgram,
} from '../adaptive-program-builder'
import { revertPerformanceAdaptation } from './performance-feedback-adaptation-contract'
import { applyPerformanceFeedbackOverlay } from './performance-feedback-integration'

export function persistActiveProgramPerformanceFeedback(): AdaptiveProgram | null {
  if (typeof window === 'undefined') return null
  const current = getLatestAdaptiveProgram()
  if (!current) return null
  const result = applyPerformanceFeedbackOverlay(current)
  if (!result?.changed) return current
  return saveAdaptiveProgram(result.program as AdaptiveProgram)
}

export function revertPersistedPerformanceAdaptation(target: {
  dayNumber: number
  exerciseId?: string
  exerciseName?: string
}): AdaptiveProgram | null {
  if (typeof window === 'undefined') return null
  const current = getLatestAdaptiveProgram()
  if (!current) return null
  const reverted = revertPerformanceAdaptation(current, target)
  if (!reverted.changed) return current
  return saveAdaptiveProgram(reverted.program as AdaptiveProgram)
}
