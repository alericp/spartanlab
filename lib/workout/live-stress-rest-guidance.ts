/**
 * LIVE STRESS REST GUIDANCE — Phase K8
 *
 * =============================================================================
 * PURE HELPER: DERIVES REST GUIDANCE FROM SESSION STRESS CONTEXT
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Consume existing Phase K stress/recovery fields (`stressLevel`, `recoveryCost`,
 * `stressRole`, `stressDistributionProof`) from the session and derive
 * user-facing rest guidance for the live workout.
 *
 * This is NOT:
 *   - A recomputation of weekly stress distribution (K2 owns that)
 *   - A reducer mutation (rest guidance is read-only display)
 *   - A timer override (guidance only; actual timer unchanged unless safe)
 *
 * PURITY CONTRACT
 * ---------------
 * - No React. No hooks. No localStorage. No fetch. No DB. No side effects.
 * - Reads ONLY the supplied session stress fields.
 * - Returns plain JSON-safe objects.
 * - Safe on server / client / build-time.
 */

import type { StressLevel, RecoveryCost } from '@/lib/program/weekly-stress-distribution-contract'

// =============================================================================
// INPUT TYPE
// =============================================================================

export interface LiveStressRestGuidanceInput {
  /** Phase K stress level (LOW | MODERATE | HIGH) */
  stressLevel?: StressLevel | string | null
  /** Phase K recovery cost (LOW | MODERATE | HIGH | VERY_HIGH) */
  recoveryCost?: RecoveryCost | string | null
  /** Phase K stress role (e.g., 'primary_strength_pull', 'broad_mixed_volume') */
  stressRole?: string | null
  /** Phase K visible proof label from stressDistributionProof */
  stressProofLabel?: string | null
  /** Base rest seconds from exercise prescription */
  baseRestSeconds?: number | null
  /** Current exercise category (skill, strength, pull, push, accessory, etc.) */
  exerciseCategory?: string | null
}

// =============================================================================
// OUTPUT TYPE
// =============================================================================

export interface LiveStressRestGuidanceResult {
  /** Short coaching label for the rest guidance */
  restLabel: string
  /** Recommended rest seconds (may be same as base if no adjustment) */
  recommendedRestSeconds: number
  /** Brief reason for the guidance */
  reason: string
  /** Visual tone for UI (neutral, conservative, recovery) */
  displayTone: 'neutral' | 'conservative' | 'recovery'
  /** Whether this guidance was derived from Phase K stress context */
  isStressAware: boolean
  /** Source of the guidance */
  source: 'phase-k-stress-context' | 'base-rest' | 'legacy-session'
}

// =============================================================================
// HELPER: DERIVE REST GUIDANCE
// =============================================================================

/**
 * Derives rest guidance from session stress context.
 *
 * Rules:
 * - LOW stress: keep base rest, no special guidance
 * - MODERATE stress: keep base rest, standard guidance
 * - HIGH stress: recommend longer rest, conservative guidance
 * - VERY_HIGH recovery cost: recommend full recovery, recovery guidance
 * - Missing/unknown: fall back to base rest with no fake claims
 */
export function deriveLiveStressRestGuidance(
  input: LiveStressRestGuidanceInput
): LiveStressRestGuidanceResult {
  const {
    stressLevel,
    recoveryCost,
    stressRole,
    stressProofLabel,
    baseRestSeconds,
    exerciseCategory,
  } = input

  // Base rest with default fallback
  const baseRest = typeof baseRestSeconds === 'number' && baseRestSeconds > 0
    ? baseRestSeconds
    : 90

  // No Phase K context available — fall back to legacy behavior
  if (!stressLevel && !recoveryCost && !stressRole) {
    return {
      restLabel: '',
      recommendedRestSeconds: baseRest,
      reason: '',
      displayTone: 'neutral',
      isStressAware: false,
      source: 'legacy-session',
    }
  }

  // Normalize stress level
  const normalizedStress = normalizeStressLevel(stressLevel)
  const normalizedCost = normalizeRecoveryCost(recoveryCost)

  // HIGH stress or VERY_HIGH recovery cost — conservative rest guidance
  if (normalizedStress === 'HIGH' || normalizedCost === 'VERY_HIGH') {
    const isHighTendon = isTendonHeavyCategory(exerciseCategory) || isTendonHeavyRole(stressRole)
    
    // Build reason from available context
    const reason = stressProofLabel
      ? `${stressProofLabel} — prioritize full recovery`
      : isHighTendon
        ? 'High tendon/skill demand — take full rest between sets'
        : 'High-stress session — avoid rushing sets'

    return {
      restLabel: 'Full recovery recommended',
      recommendedRestSeconds: Math.max(baseRest, isHighTendon ? 150 : 120),
      reason,
      displayTone: 'recovery',
      isStressAware: true,
      source: 'phase-k-stress-context',
    }
  }

  // HIGH recovery cost (but not VERY_HIGH) — moderate conservative guidance
  if (normalizedCost === 'HIGH') {
    return {
      restLabel: 'Quality recovery',
      recommendedRestSeconds: Math.max(baseRest, 90),
      reason: stressProofLabel || 'Moderate recovery demand — maintain quality',
      displayTone: 'conservative',
      isStressAware: true,
      source: 'phase-k-stress-context',
    }
  }

  // MODERATE stress — standard guidance, no override
  if (normalizedStress === 'MODERATE') {
    return {
      restLabel: '',
      recommendedRestSeconds: baseRest,
      reason: '',
      displayTone: 'neutral',
      isStressAware: true,
      source: 'phase-k-stress-context',
    }
  }

  // LOW stress — standard rest, no guidance needed
  return {
    restLabel: '',
    recommendedRestSeconds: baseRest,
    reason: '',
    displayTone: 'neutral',
    isStressAware: true,
    source: 'phase-k-stress-context',
  }
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function normalizeStressLevel(level: string | null | undefined): StressLevel | null {
  if (!level || typeof level !== 'string') return null
  const upper = level.toUpperCase()
  if (upper === 'LOW' || upper === 'MODERATE' || upper === 'HIGH') {
    return upper as StressLevel
  }
  return null
}

function normalizeRecoveryCost(cost: string | null | undefined): RecoveryCost | null {
  if (!cost || typeof cost !== 'string') return null
  const upper = cost.toUpperCase()
  if (upper === 'LOW' || upper === 'MODERATE' || upper === 'HIGH' || upper === 'VERY_HIGH') {
    return upper as RecoveryCost
  }
  return null
}

function isTendonHeavyCategory(category: string | null | undefined): boolean {
  if (!category) return false
  const lower = category.toLowerCase()
  return lower === 'skill' || lower === 'straight_arm' || lower === 'planche' || lower === 'lever'
}

function isTendonHeavyRole(role: string | null | undefined): boolean {
  if (!role) return false
  const lower = role.toLowerCase()
  return (
    lower.includes('tendon') ||
    lower.includes('skill') ||
    lower.includes('straight') ||
    lower.includes('planche') ||
    lower.includes('lever')
  )
}

// =============================================================================
// SESSION-LEVEL STRESS SUMMARY (for pre-start display)
// =============================================================================

export interface SessionStressSummary {
  /** Whether Phase K stress context is available */
  hasStressContext: boolean
  /** Human-readable label for the session stress level */
  stressLabel: string | null
  /** Human-readable label for the recovery cost */
  recoveryLabel: string | null
  /** Short coaching line for the session overview */
  coachingLine: string | null
  /** Display tone for the overview */
  displayTone: 'neutral' | 'conservative' | 'recovery'
}

/**
 * Builds a session-level stress summary for the pre-start overview.
 */
export function buildSessionStressSummary(input: {
  stressLevel?: string | null
  recoveryCost?: string | null
  stressRole?: string | null
  stressProofLabel?: string | null
}): SessionStressSummary {
  const { stressLevel, recoveryCost, stressRole, stressProofLabel } = input

  // No context available
  if (!stressLevel && !recoveryCost && !stressRole) {
    return {
      hasStressContext: false,
      stressLabel: null,
      recoveryLabel: null,
      coachingLine: null,
      displayTone: 'neutral',
    }
  }

  const normalizedStress = normalizeStressLevel(stressLevel)
  const normalizedCost = normalizeRecoveryCost(recoveryCost)

  // Build stress label
  let stressLabel: string | null = null
  if (normalizedStress === 'HIGH') stressLabel = 'High-stress session'
  else if (normalizedStress === 'MODERATE') stressLabel = 'Moderate session'
  else if (normalizedStress === 'LOW') stressLabel = 'Recovery-friendly'

  // Build recovery label
  let recoveryLabel: string | null = null
  if (normalizedCost === 'VERY_HIGH') recoveryLabel = 'High recovery demand'
  else if (normalizedCost === 'HIGH') recoveryLabel = 'Moderate recovery demand'

  // Build coaching line — prefer stressProofLabel if available
  let coachingLine: string | null = stressProofLabel || null
  let displayTone: 'neutral' | 'conservative' | 'recovery' = 'neutral'

  if (normalizedStress === 'HIGH' || normalizedCost === 'VERY_HIGH') {
    if (!coachingLine) {
      coachingLine = 'Take full rest between demanding sets to maintain quality'
    }
    displayTone = 'recovery'
  } else if (normalizedCost === 'HIGH') {
    if (!coachingLine) {
      coachingLine = 'Maintain quality rest periods for this session'
    }
    displayTone = 'conservative'
  }

  return {
    hasStressContext: true,
    stressLabel,
    recoveryLabel,
    coachingLine,
    displayTone,
  }
}
