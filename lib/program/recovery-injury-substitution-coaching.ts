/**
 * W.W9 — RECOVERY / INJURY / SUBSTITUTION COACHING INTEGRATION
 *
 * =============================================================================
 * UNIFIED COACHING SURFACE FOR RECOVERY-AWARE GUIDANCE
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Combine existing recovery, injury, and substitution truth sources into a
 * single, compact coaching model for UI rendering. This helper:
 *   1) Consumes existing RecoveryProgramAwarenessBridge
 *   2) Consumes existing InjurySubstitutionAdvisorySnapshot
 *   3) Produces a unified coaching model with clear guidance
 *   4) Uses conservative, non-medical language
 *   5) Never invents data — returns inactive when no truth exists
 *
 * CRITICAL INVARIANTS
 * -------------------
 *   - ADVISORY ONLY — no program/workout mutation
 *   - No medical claims — conservative training guidance only
 *   - No fake data — returns inactive when sources are missing
 *   - Pure function — safe on server/client/build-time
 *
 * @module W.W9
 */

import type { RecoveryProgramAwarenessBridge } from './recovery-program-awareness-bridge'
import type {
  InjurySubstitutionAdvisorySnapshot,
  InjurySubstitutionRecommendation,
} from './injury-substitution-advisory'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Coaching status indicating activity level.
 */
export type RecoveryCoachingStatus = 'active' | 'watch' | 'inactive'

/**
 * Risk level for display purposes.
 */
export type CoachingRiskLevel = 'low' | 'moderate' | 'high'

/**
 * Individual coaching item (recovery concern, injury caution, or substitution).
 */
export interface CoachingItem {
  type: 'recovery' | 'injury' | 'substitution'
  label: string
  detail: string
  source: string
  riskLevel?: CoachingRiskLevel
  /** For substitution items only */
  originalExercise?: string
  suggestedAlternative?: string
  jointOrRegion?: string
  isCurrentSessionOnly?: boolean
}

/**
 * The unified coaching model for UI rendering.
 */
export interface RecoveryInjurySubstitutionCoachModel {
  /** Overall coaching status */
  status: RecoveryCoachingStatus
  /** Short headline for the coaching card */
  headline: string
  /** Summary explanation */
  summary: string
  /** Primary action cue if applicable */
  primaryCue: string | null
  /** Action label for CTA if applicable */
  actionLabel: string | null
  /** Overall risk level */
  riskLevel: CoachingRiskLevel
  /** Evidence codes from source truths */
  evidence: string[]
  /** Individual coaching items */
  items: CoachingItem[]
  /** Whether adjustments are current-session-only */
  isCurrentSessionOnly: boolean
  /** Whether saved program remains unchanged */
  savedProgramUnchanged: boolean
  /** Source truths consumed */
  sources: {
    hasRecoveryBridge: boolean
    hasInjuryAdvisory: boolean
    recoveryLevel: string | null
    injuryStatus: string | null
  }
}

// =============================================================================
// INPUT TYPE
// =============================================================================

/**
 * Input for deriving the coaching model.
 */
export interface RecoveryInjurySubstitutionCoachingInput {
  /** Recovery-to-Program awareness bridge (optional) */
  recoveryBridge?: RecoveryProgramAwarenessBridge | null
  /** Injury substitution advisory snapshot (optional) */
  injuryAdvisory?: InjurySubstitutionAdvisorySnapshot | null
}

// =============================================================================
// DERIVATION HELPER
// =============================================================================

/**
 * Derive the unified coaching model from recovery and injury truth sources.
 *
 * This is a PURE function that:
 *   - Consumes existing truth sources
 *   - Returns inactive when no actionable truth exists
 *   - Uses conservative, non-medical language
 *   - Never invents data or fake claims
 *
 * @param input - Recovery bridge and/or injury advisory
 * @returns RecoveryInjurySubstitutionCoachModel
 */
export function deriveRecoveryInjurySubstitutionCoaching(
  input: RecoveryInjurySubstitutionCoachingInput,
): RecoveryInjurySubstitutionCoachModel {
  const { recoveryBridge, injuryAdvisory } = input

  const items: CoachingItem[] = []
  const evidence: string[] = []

  // Track sources
  const hasRecoveryBridge = Boolean(recoveryBridge?.available)
  const hasInjuryAdvisory = Boolean(
    injuryAdvisory && injuryAdvisory.status !== 'none' && injuryAdvisory.recommendations.length > 0
  )

  // ----- Process recovery bridge -----
  let recoveryRiskLevel: CoachingRiskLevel = 'low'
  if (hasRecoveryBridge && recoveryBridge) {
    const level = recoveryBridge.level

    if (level === 'deload_recommended') {
      recoveryRiskLevel = 'high'
      items.push({
        type: 'recovery',
        label: 'Deload Recommended',
        detail: recoveryBridge.summary || 'Multiple strain signals suggest a lighter training approach.',
        source: 'recovery_awareness_bridge',
        riskLevel: 'high',
      })
      evidence.push('recovery_deload_recommended')
    } else if (level === 'reduce_load') {
      recoveryRiskLevel = 'moderate'
      items.push({
        type: 'recovery',
        label: 'Consider Lighter Training',
        detail: recoveryBridge.summary || 'Recovery signals suggest reducing intensity today.',
        source: 'recovery_awareness_bridge',
        riskLevel: 'moderate',
      })
      evidence.push('recovery_reduce_load')
    } else if (level === 'monitor') {
      items.push({
        type: 'recovery',
        label: 'Monitor Recovery',
        detail: recoveryBridge.summary || 'Stay aware of how you feel during training.',
        source: 'recovery_awareness_bridge',
        riskLevel: 'low',
      })
      evidence.push('recovery_monitor')
    }

    // Add reason codes as evidence
    if (recoveryBridge.reasonCodes?.length > 0) {
      evidence.push(...recoveryBridge.reasonCodes.slice(0, 3))
    }
  }

  // ----- Process injury advisory -----
  let injuryRiskLevel: CoachingRiskLevel = 'low'
  if (hasInjuryAdvisory && injuryAdvisory) {
    const status = injuryAdvisory.status

    if (status === 'urgent_block') {
      injuryRiskLevel = 'high'
    } else if (status === 'recommend_review') {
      injuryRiskLevel = 'moderate'
    } else if (status === 'watch') {
      injuryRiskLevel = 'low'
    }

    // Process recommendations as substitution items
    for (const rec of injuryAdvisory.recommendations.slice(0, 5)) {
      items.push(mapRecommendationToCoachingItem(rec))
    }

    // Add evidence
    if (injuryAdvisory.affectedExerciseCount > 0) {
      evidence.push(`injury_affected_exercises_${injuryAdvisory.affectedExerciseCount}`)
    }
  }

  // ----- Determine overall status and risk -----
  const hasActiveItems = items.length > 0
  const overallRiskLevel: CoachingRiskLevel =
    recoveryRiskLevel === 'high' || injuryRiskLevel === 'high'
      ? 'high'
      : recoveryRiskLevel === 'moderate' || injuryRiskLevel === 'moderate'
      ? 'moderate'
      : 'low'

  const status: RecoveryCoachingStatus = hasActiveItems
    ? overallRiskLevel === 'high' || overallRiskLevel === 'moderate'
      ? 'active'
      : 'watch'
    : 'inactive'

  // ----- Generate headline and summary -----
  const { headline, summary, primaryCue, actionLabel } = generateCoachingCopy(
    status,
    items,
    recoveryBridge,
    injuryAdvisory,
  )

  return {
    status,
    headline,
    summary,
    primaryCue,
    actionLabel,
    riskLevel: overallRiskLevel,
    evidence,
    items,
    isCurrentSessionOnly: true, // Advisory adjustments are always current-session-only
    savedProgramUnchanged: true, // Advisory never mutates saved program
    sources: {
      hasRecoveryBridge,
      hasInjuryAdvisory,
      recoveryLevel: recoveryBridge?.level ?? null,
      injuryStatus: injuryAdvisory?.status ?? null,
    },
  }
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function mapRecommendationToCoachingItem(rec: InjurySubstitutionRecommendation): CoachingItem {
  const riskLevel: CoachingRiskLevel =
    rec.riskLevel === 'high' ? 'high' : rec.riskLevel === 'medium' ? 'moderate' : 'low'

  return {
    type: rec.suggestedAlternativeName ? 'substitution' : 'injury',
    label: rec.visibleLabel || `${rec.jointOrRegion.replace(/_/g, ' ')} concern`,
    detail: rec.reason,
    source: 'injury_substitution_advisory',
    riskLevel,
    originalExercise: rec.affectedExerciseName,
    suggestedAlternative: rec.suggestedAlternativeName ?? undefined,
    jointOrRegion: rec.jointOrRegion,
    isCurrentSessionOnly: true,
  }
}

function generateCoachingCopy(
  status: RecoveryCoachingStatus,
  items: CoachingItem[],
  recoveryBridge?: RecoveryProgramAwarenessBridge | null,
  injuryAdvisory?: InjurySubstitutionAdvisorySnapshot | null,
): {
  headline: string
  summary: string
  primaryCue: string | null
  actionLabel: string | null
} {
  if (status === 'inactive') {
    return {
      headline: 'Ready to Train',
      summary: 'No recovery or joint concerns detected for this session.',
      primaryCue: null,
      actionLabel: null,
    }
  }

  const hasRecovery = items.some((i) => i.type === 'recovery')
  const hasInjury = items.some((i) => i.type === 'injury' || i.type === 'substitution')
  const substitutionCount = items.filter((i) => i.type === 'substitution').length

  // Prioritize headline based on severity
  let headline = 'Recovery-Aware Coaching'
  let summary = ''
  let primaryCue: string | null = null
  let actionLabel: string | null = null

  if (recoveryBridge?.level === 'deload_recommended') {
    headline = 'Deload Recommended'
    summary = 'Multiple strain signals indicate a lighter training approach may be beneficial.'
    primaryCue = 'Consider reducing volume and intensity today.'
    actionLabel = 'Preview Adjusted Session'
  } else if (recoveryBridge?.level === 'reduce_load') {
    headline = 'Consider Lighter Training'
    summary = 'Recovery signals suggest a conservative approach today.'
    primaryCue = 'Train mindfully and stop if fatigue builds.'
    actionLabel = 'Preview Adjusted Session'
  } else if (injuryAdvisory?.status === 'urgent_block') {
    headline = 'Joint Caution Active'
    summary = injuryAdvisory.visibleSummary || 'Some exercises may need modification due to reported joint concerns.'
    primaryCue = 'Use safer options if discomfort appears.'
  } else if (injuryAdvisory?.status === 'recommend_review') {
    headline = 'Safer Options Available'
    summary = `${substitutionCount} safer alternative${substitutionCount !== 1 ? 's' : ''} available based on your joint concerns.`
    primaryCue = 'Swap to the safer option if the original movement aggravates the area.'
  } else if (hasRecovery && hasInjury) {
    headline = 'Recovery & Joint Coaching'
    summary = 'Both recovery status and joint concerns are noted. Train mindfully.'
  } else if (hasRecovery) {
    headline = recoveryBridge?.headline || 'Monitor Recovery'
    summary = recoveryBridge?.summary || 'Stay aware of how you feel during training.'
  } else if (hasInjury) {
    headline = 'Joint Caution Noted'
    summary = 'Watch for discomfort in the flagged areas. Safer options are available if needed.'
  }

  return { headline, summary, primaryCue, actionLabel }
}

// =============================================================================
// UTILITY HELPERS
// =============================================================================

/**
 * Check if the coaching model has any actionable items.
 */
export function hasActiveCoaching(model: RecoveryInjurySubstitutionCoachModel): boolean {
  return model.status !== 'inactive' && model.items.length > 0
}

/**
 * Get chip display info for compact UI rendering.
 */
export function getCoachingChipDisplay(model: RecoveryInjurySubstitutionCoachModel): {
  visible: boolean
  label: string
  severity: 'info' | 'warning' | 'alert' | 'neutral'
} {
  if (model.status === 'inactive') {
    return { visible: false, label: '', severity: 'neutral' }
  }

  if (model.riskLevel === 'high') {
    return { visible: true, label: model.headline, severity: 'alert' }
  }
  if (model.riskLevel === 'moderate') {
    return { visible: true, label: model.headline, severity: 'warning' }
  }
  return { visible: true, label: model.headline, severity: 'info' }
}

/**
 * Get coaching items grouped by type.
 */
export function getCoachingItemsByType(model: RecoveryInjurySubstitutionCoachModel): {
  recovery: CoachingItem[]
  injury: CoachingItem[]
  substitution: CoachingItem[]
} {
  return {
    recovery: model.items.filter((i) => i.type === 'recovery'),
    injury: model.items.filter((i) => i.type === 'injury'),
    substitution: model.items.filter((i) => i.type === 'substitution'),
  }
}
