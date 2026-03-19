/**
 * Explanation Integration Helper
 * 
 * Provides a helper function to generate explanation metadata from
 * program generation context. This is called by the adaptive-program-builder
 * when generating a new program.
 */

import {
  buildProgramExplanation,
  type ExplanationContext,
  type SessionContext,
} from './explanation-resolver'
import type { ProgramExplanationMetadata } from './explanation-types'
import type { AdaptiveSession } from './adaptive-program-builder'
import type { PrimaryGoal } from './program-service'
import type { ScheduleMode } from './flexible-schedule-engine'
import type { AdjustmentReasonCode } from './training-feedback-loop'
import { GOAL_LABELS } from './program-service'

/**
 * Context needed to generate explanation metadata
 */
export interface ExplanationGenerationContext {
  primaryGoal: PrimaryGoal
  scheduleMode: ScheduleMode
  currentWeekFrequency: number
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  fatigueState: 'low' | 'moderate' | 'high'
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
  trustedWorkoutCount: number
  adjustmentReasons?: AdjustmentReasonCode[]
  isFirstProgram: boolean
  constraintLabel?: string
  weakPointFocus?: string
  sessions: AdaptiveSession[]
}

/**
 * Generate canonical explanation metadata from program generation context.
 * This function is called during program generation to create truthful,
 * grounded explanations.
 * 
 * @returns ProgramExplanationMetadata or undefined if generation fails
 */
export function generateExplanationMetadata(
  ctx: ExplanationGenerationContext
): ProgramExplanationMetadata | undefined {
  try {
    console.log('[explanation-integration] Generating explanation metadata')
    
    // Build explanation context
    const explanationContext: ExplanationContext = {
      primaryGoal: ctx.primaryGoal,
      goalLabel: GOAL_LABELS[ctx.primaryGoal],
      scheduleMode: ctx.scheduleMode,
      currentWeekFrequency: ctx.currentWeekFrequency,
      previousWeekFrequency: undefined, // First generation
      experienceLevel: ctx.experienceLevel,
      fatigueState: ctx.fatigueState,
      dataConfidence: ctx.dataConfidence,
      trustedWorkoutCount: ctx.trustedWorkoutCount,
      adjustmentReasons: ctx.adjustmentReasons,
      isFirstProgram: ctx.isFirstProgram,
      limiters: ctx.constraintLabel ? [ctx.constraintLabel] : undefined,
      weakPoints: ctx.weakPointFocus ? [ctx.weakPointFocus] : undefined,
    }
    
    // Build session contexts
    const sessionContexts: SessionContext[] = ctx.sessions.map(session => ({
      dayNumber: session.dayNumber,
      sessionTitle: session.dayLabel,
      primaryIntent: session.focusLabel || session.focus,
      isLowerFatigue: session.adaptationNotes?.some(note => 
        note.toLowerCase().includes('volume') || 
        note.toLowerCase().includes('fatigue')
      ),
      isRecoveryBias: session.adaptationNotes?.some(note => 
        note.toLowerCase().includes('recovery')
      ),
      exercises: session.exercises.map(ex => ({
        exerciseId: ex.id,
        displayName: ex.name,
        role: ex.category,
        coachingReason: ex.selectionReason,
        movementPattern: undefined,
        skillTransfer: undefined,
      })),
    }))
    
    // Generate explanation
    const result = buildProgramExplanation(explanationContext, sessionContexts)
    
    console.log('[explanation-integration] Generated explanation:', {
      sessionCount: result.sessionExplanations.length,
      dataConfidence: result.dataConfidence,
      hasChangeExplanation: !!result.changeExplanation,
    })
    
    return result
  } catch (error) {
    console.warn('[explanation-integration] Failed to generate explanation:', error)
    return undefined
  }
}
