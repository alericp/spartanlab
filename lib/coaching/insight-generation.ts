import type { MovementBias } from '@/lib/movement-bias-detection-engine'
import type { ProgressionKnowledge } from '@/lib/knowledge-bubble-content'
import { KNOWLEDGE_BUBBLE_CONTENT, PROGRESSION_KNOWLEDGE } from '@/lib/knowledge-bubble-content'

// =============================================================================
// INSIGHT TEXT GENERATION FROM AI SYSTEMS
// =============================================================================

/**
 * Generates exercise selection insight text from knowledge base.
 * Pulls from existing knowledge bubble content.
 */
export function getExerciseSelectionInsight(exerciseId: string): string | null {
  const knowledge = KNOWLEDGE_BUBBLE_CONTENT[exerciseId]
  if (!knowledge) return null
  return knowledge.shortReason || null
}

/**
 * Generates skill carryover insight from exercise knowledge.
 */
export function getSkillCarryoverInsight(exerciseId: string): string[] | null {
  const knowledge = KNOWLEDGE_BUBBLE_CONTENT[exerciseId]
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
  const knowledge = KNOWLEDGE_BUBBLE_CONTENT[exerciseId]
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
  const knowledge = KNOWLEDGE_BUBBLE_CONTENT[exerciseId]
  if (!knowledge || !knowledge.safetyNote) return null
  return knowledge.safetyNote
}

/**
 * Generates common mistake warning from exercise knowledge.
 */
export function getExerciseCommonMistake(exerciseId: string): string | null {
  const knowledge = KNOWLEDGE_BUBBLE_CONTENT[exerciseId]
  if (!knowledge || !knowledge.commonMistake) return null
  return knowledge.commonMistake
}
