import type { MovementBias } from '@/lib/movement-bias-detection-engine'
import type { ProgressionKnowledge, ExerciseKnowledge } from '@/lib/knowledge-bubble-content'
import { EXERCISE_KNOWLEDGE, PROGRESSION_KNOWLEDGE } from '@/lib/knowledge-bubble-content'
import {
  analyzeProgression as analyzeBandProgression,
  type ResistanceBandColor,
  BAND_SHORT_LABELS,
} from '@/lib/band-progression-engine'

// =============================================================================
// INSIGHT TEXT GENERATION FROM AI SYSTEMS
// =============================================================================

/**
 * Generates exercise selection insight text from knowledge base.
 * Pulls from existing knowledge bubble content.
 */
export function getExerciseSelectionInsight(exerciseId: string): string | null {
  // Normalize exercise ID to match knowledge base keys
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  const knowledge = EXERCISE_KNOWLEDGE[normalizedId] || EXERCISE_KNOWLEDGE[exerciseId]
  if (!knowledge) return null
  return knowledge.shortReason || null
}

/**
 * Generates skill carryover insight from exercise knowledge.
 */
export function getSkillCarryoverInsight(exerciseId: string): string[] | null {
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  const knowledge = EXERCISE_KNOWLEDGE[normalizedId] || EXERCISE_KNOWLEDGE[exerciseId]
  if (!knowledge || !knowledge.skillCarryover) return null
  return knowledge.skillCarryover
}

/**
 * Generates progression reasoning from progression knowledge base.
 */
export function getProgressionReasoning(progressionKey: string): ProgressionKnowledge | null {
  return PROGRESSION_KNOWLEDGE[progressionKey] || null
}

/**
 * Generates movement bias insight from bias detection result.
 */
export function getMovementBiasInsight(bias: MovementBias): {
  adjustment: string
  context: string
} | null {
  if (!bias || bias.biasType === 'balanced') return null

  const adjustmentMap: Record<string, string> = {
    pull_dominant: 'Increased pushing volume to balance pulling dominance.',
    push_dominant: 'Increased pulling volume to balance pushing dominance.',
    compression_dominant: 'Added more bent-arm strength work to complement compression focus.',
  }

  const contextMap: Record<string, string> = {
    pull_dominant: `Your body has strong pulling patterns. We're developing pushing strength to create symmetry.`,
    push_dominant: `Your body favors pushing movements. We're emphasizing pulling to prevent imbalances.`,
    compression_dominant: `Your core and compression are your strengths. We're building complementary arm strength.`,
  }

  return {
    adjustment: adjustmentMap[bias.biasType] || 'Adapting for movement balance.',
    context: contextMap[bias.biasType] || 'Personalizing for your movement pattern.',
  }
}

/**
 * Generates warm-up reasoning based on session focus and skills.
 */
export function getWarmupReasoningInsight(skillFocus: string, warmupElement: string): string {
  const reasoningMap: Record<string, Record<string, string>> = {
    front_lever: {
      scapular_pull: 'Scapular activation to prepare for front lever stability.',
      wrist: 'Wrist conditioning to support hanging strength.',
      shoulder: 'Shoulder mobility to maintain proper front lever position.',
      core: 'Core activation for lever body tension.',
    },
    planche: {
      wrist: 'Wrist preparation for weight distribution in planche position.',
      shoulder: 'Shoulder stability work for sustained planches.',
      core: 'Core compression for body alignment.',
      chest: 'Chest activation for pushing strength.',
    },
    handstand: {
      wrist: 'Wrist conditioning for balance and control.',
      shoulder: 'Shoulder preparation for sustained holds.',
      core: 'Core stability for vertical alignment.',
      neck: 'Neck preparation for looking forward in handstand.',
    },
    muscle_up: {
      shoulder: 'Shoulder mobility for transition phase.',
      wrist: 'Wrist preparation for grip transition.',
      core: 'Core tension for clean transition.',
      lat: 'Lat activation for pull phase.',
    },
    iron_cross: {
      shoulder: 'Shoulder preparation for extreme abduction.',
      wrist: 'Wrist conditioning for cross position.',
      core: 'Core activation for body alignment.',
      arm: 'Arm strength preparation for cross holds.',
    },
  }

  const skillReasons = reasoningMap[skillFocus]
  if (skillReasons && skillReasons[warmupElement]) {
    return skillReasons[warmupElement]
  }

  // Fallback generic reasoning
  const genericMap: Record<string, string> = {
    scapular_pull: 'Scapular activation for pulling readiness.',
    wrist: 'Wrist mobility and conditioning.',
    shoulder: 'Shoulder activation and mobility.',
    core: 'Core activation for body tension.',
    chest: 'Chest activation for pushing readiness.',
    lat: 'Lat activation for pulling strength.',
    arm: 'Arm and hand preparation.',
    neck: 'Neck and upper back mobility.',
  }

  return genericMap[warmupElement] || 'Joint and muscle preparation.'
}

/**
 * Generates recovery/deload phase insight.
 */
export function getRecoveryPhaseInsight(
  phase: 'deload' | 'recovery' | 'maintenance' | 'aggressive',
  reason: string
): string {
  const phaseReasonMap: Record<string, string> = {
    deload:
      'Deload week reduces volume to allow adaptation and prevent overtraining. This builds a stronger foundation for the next block.',
    recovery:
      'Recovery-focused session prioritizes technique and gentle strength maintenance over intense progression.',
    maintenance:
      'Maintenance phase preserves current strength levels while emphasizing form and consistency.',
    aggressive:
      'Progression push increases intensity and volume strategically to drive new strength gains.',
  }

  return phaseReasonMap[phase] || reason
}

/**
 * Generates safety/override protection insight from exercise knowledge.
 */
export function getOverrideProtectionInsight(
  exerciseId: string,
  exerciseName: string
): { reason: string; carryover: string[] } | null {
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  const knowledge = EXERCISE_KNOWLEDGE[normalizedId] || EXERCISE_KNOWLEDGE[exerciseId]
  if (!knowledge) return null

  return {
    reason: knowledge.shortReason || `${exerciseName} was selected for specific training stimulus.`,
    carryover: knowledge.skillCarryover || [],
  }
}

/**
 * Generates safety notes from exercise knowledge.
 */
export function getExerciseSafetyNote(exerciseId: string): string | null {
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  const knowledge = EXERCISE_KNOWLEDGE[normalizedId] || EXERCISE_KNOWLEDGE[exerciseId]
  if (!knowledge || !knowledge.safetyNote) return null
  return knowledge.safetyNote
}

/**
 * Generates common mistake warning from exercise knowledge.
 */
export function getExerciseCommonMistake(exerciseId: string): string | null {
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  const knowledge = EXERCISE_KNOWLEDGE[normalizedId] || EXERCISE_KNOWLEDGE[exerciseId]
  if (!knowledge || !knowledge.commonMistake) return null
  return knowledge.commonMistake
}

// =============================================================================
// BAND PROGRESSION INSIGHTS
// =============================================================================

/**
 * Generates band progression insight for an exercise.
 * Returns coaching message about band assistance status and recommendations.
 */
export function getBandProgressionInsight(exerciseId: string, exerciseName: string): {
  message: string | null
  status: 'ready_to_reduce' | 'progressing' | 'maintaining' | 'stagnating' | 'regressing' | 'new' | null
  currentBand: ResistanceBandColor | null
  recommendedBand: ResistanceBandColor | null
} {
  const analysis = analyzeBandProgression(exerciseId, exerciseName)
  
  if (analysis.status === 'new') {
    return {
      message: null,
      status: null,
      currentBand: null,
      recommendedBand: analysis.recommendedBand,
    }
  }
  
  // Generate coaching message based on status
  let message: string | null = null
  
  switch (analysis.status) {
    case 'ready_to_reduce':
      if (analysis.currentBand && analysis.recommendedBand) {
        message = `Band assistance reduced based on recent performance. Moving from ${BAND_SHORT_LABELS[analysis.currentBand]} to ${BAND_SHORT_LABELS[analysis.recommendedBand]}.`
      } else if (analysis.currentBand && !analysis.recommendedBand) {
        message = `Ready to attempt unassisted! Your ${BAND_SHORT_LABELS[analysis.currentBand]} band performance indicates you may be ready.`
      }
      break
      
    case 'progressing':
      message = 'Making good progress with band assistance. Continue building strength at this level.'
      break
      
    case 'maintaining':
      message = 'Assistance maintained to preserve form quality while building strength.'
      break
      
    case 'stagnating':
      message = analysis.reason || 'Performance plateaued. Consider accessory work to break through.'
      break
      
    case 'regressing':
      if (analysis.recommendedBand) {
        message = `Performance declining - consider moving to ${BAND_SHORT_LABELS[analysis.recommendedBand]} band until recovered.`
      } else {
        message = 'Performance declining - maintain current band level until recovered.'
      }
      break
  }
  
  // Add fatigue warning if present
  if (analysis.fatigueWarning && analysis.fatigueReason) {
    message = analysis.fatigueReason
  }
  
  return {
    message,
    status: analysis.status,
    currentBand: analysis.currentBand,
    recommendedBand: analysis.recommendedBand,
  }
}

/**
 * Get a simple band change notification message.
 * Used when band selection changes during logging.
 */
export function getBandChangeNotification(
  previousBand: ResistanceBandColor | null,
  newBand: ResistanceBandColor | null
): string | null {
  if (previousBand === newBand) return null
  
  if (!previousBand && newBand) {
    return `Using ${BAND_SHORT_LABELS[newBand]} band assistance.`
  }
  
  if (previousBand && !newBand) {
    return 'Training unassisted! Great progress.'
  }
  
  if (previousBand && newBand) {
    // Determine if this is progression or regression
    const bandOrder: ResistanceBandColor[] = ['blue', 'green', 'purple', 'black', 'red', 'yellow']
    const prevIndex = bandOrder.indexOf(previousBand)
    const newIndex = bandOrder.indexOf(newBand)
    
    if (newIndex > prevIndex) {
      return `Reduced assistance from ${BAND_SHORT_LABELS[previousBand]} to ${BAND_SHORT_LABELS[newBand]}. Progress!`
    } else {
      return `Increased assistance to ${BAND_SHORT_LABELS[newBand]}. Smart to maintain form quality.`
    }
  }
  
  return null
}

// =============================================================================
// PREPARATION CHAIN INSIGHTS
// =============================================================================

import {
  validateSkillPreparation,
  getPreparationChain,
  getOverrideGuidance,
  type PreparationValidation,
} from '@/lib/preparation-chain-engine'

/**
 * Get preparation insight for a skill in the workout.
 * Returns guidance message if athlete needs foundational work.
 */
export function getPreparationInsight(
  skillId: string,
  athleteProgress: Record<string, { hold?: number; reps?: number }>,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): {
  message: string | null
  status: PreparationValidation['status']
  increaseFoundationalVolume: boolean
  reduceAdvancedVolume: boolean
} {
  const validation = validateSkillPreparation(skillId, athleteProgress, experienceLevel)
  
  return {
    message: validation.guidanceMessage || null,
    status: validation.status,
    increaseFoundationalVolume: validation.increaseFoundationalVolume,
    reduceAdvancedVolume: validation.reduceAdvancedVolume,
  }
}

/**
 * Get override guidance when user skips a foundational exercise.
 * Returns warning message if skipping may impact progress.
 */
export function getSkipExerciseGuidance(
  skillId: string,
  skippedExerciseId: string,
  athleteProgress: Record<string, { hold?: number; reps?: number }>
): {
  message: string
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  suggestedAlternative: string | null
} {
  const guidance = getOverrideGuidance(skillId, skippedExerciseId, athleteProgress)
  
  return {
    message: guidance.message,
    riskLevel: guidance.riskLevel,
    suggestedAlternative: guidance.suggestedAlternative,
  }
}

/**
 * Get the preparation chain explanation for a skill.
 * Used in tooltips or knowledge bubbles.
 */
export function getPreparationChainExplanation(skillId: string): string | null {
  const chain = getPreparationChain(skillId)
  
  if (!chain) return null
  
  const criticalSteps = chain.chain.filter(s => s.isCritical)
  
  if (criticalSteps.length === 0) return null
  
  const exerciseNames = criticalSteps.map(s => s.exerciseName).join(', ')
  
  return `${chain.skillName} requires: ${exerciseNames}. These build the strength and control needed for safe progression.`
}
