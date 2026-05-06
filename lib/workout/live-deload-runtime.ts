/**
 * [AB15] Live Deload Runtime Engine
 *
 * This module provides LIVE runtime adaptation during active workouts.
 * It observes session-level fatigue signals and can recommend/apply
 * conservative adjustments to the CURRENT workout without requiring
 * program regeneration, restart, or page refresh.
 *
 * STATIC vs LIVE BOUNDARY:
 * - AB13/AB14 operate at GENERATION time (program shaping)
 * - AB15 operates at RUNTIME (active workout execution)
 * - AB15 does NOT rewrite the saved program
 * - AB15 applies only to the current active session
 *
 * This is NOT the same as the long-term deload-recovery-engine.ts which
 * plans multi-day recovery phases. This is immediate, single-session,
 * live adaptation based on real-time performance signals.
 */

import type {
  SessionAdaptiveReadiness,
  AdaptiveExecutionSummary,
  RecoverySignal,
} from './live-workout-adaptive-signals'

// =============================================================================
// AB15 LIVE DELOAD TYPES
// =============================================================================

/**
 * AB15 live deload decision levels.
 * Conservative levels that can be applied immediately during workout.
 */
export type LiveDeloadLevel =
  | 'none'              // No adjustment needed
  | 'watch'             // Monitoring, no action yet
  | 'extend_rest'       // Recommend longer rest periods
  | 'reduce_volume'     // Reduce remaining sets
  | 'cap_intensity'     // Cap RPE for remaining work
  | 'recovery_mode'     // Full protective mode

/**
 * AB15 live deload adjustments that can be safely applied to active session.
 */
export interface LiveDeloadAdjustments {
  /** Reduce remaining sets by this many (per exercise) */
  reduceRemainingSetsBy: number
  /** Cap target RPE at this value for remaining work */
  capTargetRpeAt: number | null
  /** Multiply recommended rest time by this factor */
  restMultiplier: number
  /** Mark remaining high-stress work as optional */
  markRemainingAsOptional: boolean
  /** Full recovery-safe mode */
  recoveryMode: boolean
}

/**
 * AB15 live deload decision - the canonical output of the runtime engine.
 */
export interface LiveDeloadDecision {
  /** Whether any live adjustment was actually applied */
  applied: boolean
  /** The decision level */
  level: LiveDeloadLevel
  /** Reasons that contributed to this decision */
  reasons: string[]
  /** The adjustments to apply */
  adjustments: LiveDeloadAdjustments
  /** User-visible summary (null if no visible change) */
  visibleSummary: string | null
  /** Timestamp of decision */
  timestamp: number
  /** AB15 version stamp */
  version: 'ab15-live-deload-runtime'
}

// =============================================================================
// AB15 DECISION THRESHOLDS
// =============================================================================

const AB15_THRESHOLDS = {
  /** High RPE sets before escalating */
  HIGH_RPE_SETS_WATCH: 2,
  HIGH_RPE_SETS_EXTEND_REST: 3,
  HIGH_RPE_SETS_REDUCE_VOLUME: 4,
  HIGH_RPE_SETS_CAP_INTENSITY: 5,
  HIGH_RPE_SETS_RECOVERY_MODE: 6,

  /** Warning signals before escalating */
  WARNINGS_WATCH: 2,
  WARNINGS_EXTEND_REST: 3,
  WARNINGS_REDUCE_VOLUME: 4,

  /** Critical signals (pain/joint) immediately trigger */
  CRITICAL_SIGNALS_CAP_INTENSITY: 1,
  CRITICAL_SIGNALS_RECOVERY_MODE: 2,

  /** Fatigue level triggers */
  FATIGUE_LEVEL_REDUCE_VOLUME: 'fatigued' as const,
  FATIGUE_LEVEL_RECOVERY_MODE: 'exhausted' as const,
} as const

// =============================================================================
// AB15 LIVE DECISION ENGINE
// =============================================================================

/**
 * Compute AB15 live deload decision from current session readiness.
 *
 * This is the SINGLE entry point for AB15 runtime decisions.
 * It reads the accumulated session signals and produces a conservative
 * deload recommendation that can be applied immediately.
 *
 * SAFETY RULES:
 * - Never increases load/volume
 * - Never changes exercise selection
 * - Only reduces/caps remaining work
 * - Fails closed (no decision if can't compute)
 */
export function computeLiveDeloadDecision(
  sessionReadiness: SessionAdaptiveReadiness,
  latestSummary?: AdaptiveExecutionSummary | null
): LiveDeloadDecision {
  const reasons: string[] = []
  let level: LiveDeloadLevel = 'none'
  let adjustments: LiveDeloadAdjustments = {
    reduceRemainingSetsBy: 0,
    capTargetRpeAt: null,
    restMultiplier: 1.0,
    markRemainingAsOptional: false,
    recoveryMode: false,
  }

  // Extract signals
  const {
    sessionFatigueLevel,
    totalHighRPESets,
    totalCriticalSignals,
    totalWarningSignals,
    painFlagActive,
    volumeCautionActive,
  } = sessionReadiness

  // ==========================================================================
  // CRITICAL SIGNAL PATH (immediate escalation)
  // ==========================================================================

  if (painFlagActive || totalCriticalSignals >= AB15_THRESHOLDS.CRITICAL_SIGNALS_RECOVERY_MODE) {
    level = 'recovery_mode'
    reasons.push('Pain or joint stress detected')
    adjustments = {
      reduceRemainingSetsBy: 2,
      capTargetRpeAt: 6,
      restMultiplier: 1.5,
      markRemainingAsOptional: true,
      recoveryMode: true,
    }
  } else if (totalCriticalSignals >= AB15_THRESHOLDS.CRITICAL_SIGNALS_CAP_INTENSITY) {
    level = 'cap_intensity'
    reasons.push('Critical signal detected')
    adjustments = {
      reduceRemainingSetsBy: 1,
      capTargetRpeAt: 7,
      restMultiplier: 1.3,
      markRemainingAsOptional: false,
      recoveryMode: false,
    }
  }

  // ==========================================================================
  // FATIGUE LEVEL PATH
  // ==========================================================================

  if (level === 'none' && sessionFatigueLevel === AB15_THRESHOLDS.FATIGUE_LEVEL_RECOVERY_MODE) {
    level = 'recovery_mode'
    reasons.push('Session fatigue exhausted')
    adjustments = {
      reduceRemainingSetsBy: 2,
      capTargetRpeAt: 6,
      restMultiplier: 1.5,
      markRemainingAsOptional: true,
      recoveryMode: true,
    }
  } else if (level === 'none' && sessionFatigueLevel === AB15_THRESHOLDS.FATIGUE_LEVEL_REDUCE_VOLUME) {
    level = 'reduce_volume'
    reasons.push('Session fatigue elevated')
    adjustments = {
      reduceRemainingSetsBy: 1,
      capTargetRpeAt: 8,
      restMultiplier: 1.2,
      markRemainingAsOptional: false,
      recoveryMode: false,
    }
  }

  // ==========================================================================
  // HIGH RPE ACCUMULATION PATH
  // ==========================================================================

  if (level === 'none') {
    if (totalHighRPESets >= AB15_THRESHOLDS.HIGH_RPE_SETS_RECOVERY_MODE) {
      level = 'recovery_mode'
      reasons.push(`${totalHighRPESets} high-RPE sets accumulated`)
      adjustments = {
        reduceRemainingSetsBy: 2,
        capTargetRpeAt: 6,
        restMultiplier: 1.5,
        markRemainingAsOptional: true,
        recoveryMode: true,
      }
    } else if (totalHighRPESets >= AB15_THRESHOLDS.HIGH_RPE_SETS_CAP_INTENSITY) {
      level = 'cap_intensity'
      reasons.push(`${totalHighRPESets} high-RPE sets accumulated`)
      adjustments = {
        reduceRemainingSetsBy: 1,
        capTargetRpeAt: 7,
        restMultiplier: 1.3,
        markRemainingAsOptional: false,
        recoveryMode: false,
      }
    } else if (totalHighRPESets >= AB15_THRESHOLDS.HIGH_RPE_SETS_REDUCE_VOLUME) {
      level = 'reduce_volume'
      reasons.push(`${totalHighRPESets} high-RPE sets accumulated`)
      adjustments = {
        reduceRemainingSetsBy: 1,
        capTargetRpeAt: 8,
        restMultiplier: 1.2,
        markRemainingAsOptional: false,
        recoveryMode: false,
      }
    } else if (totalHighRPESets >= AB15_THRESHOLDS.HIGH_RPE_SETS_EXTEND_REST) {
      level = 'extend_rest'
      reasons.push(`${totalHighRPESets} high-RPE sets accumulated`)
      adjustments = {
        reduceRemainingSetsBy: 0,
        capTargetRpeAt: null,
        restMultiplier: 1.25,
        markRemainingAsOptional: false,
        recoveryMode: false,
      }
    } else if (totalHighRPESets >= AB15_THRESHOLDS.HIGH_RPE_SETS_WATCH) {
      level = 'watch'
      reasons.push('Monitoring fatigue signals')
    }
  }

  // ==========================================================================
  // WARNING SIGNAL PATH
  // ==========================================================================

  if (level === 'none' && totalWarningSignals >= AB15_THRESHOLDS.WARNINGS_REDUCE_VOLUME) {
    level = 'reduce_volume'
    reasons.push(`${totalWarningSignals} warning signals`)
    adjustments = {
      reduceRemainingSetsBy: 1,
      capTargetRpeAt: 8,
      restMultiplier: 1.2,
      markRemainingAsOptional: false,
      recoveryMode: false,
    }
  } else if (level === 'none' && totalWarningSignals >= AB15_THRESHOLDS.WARNINGS_EXTEND_REST) {
    level = 'extend_rest'
    reasons.push(`${totalWarningSignals} warning signals`)
    adjustments = {
      reduceRemainingSetsBy: 0,
      capTargetRpeAt: null,
      restMultiplier: 1.2,
      markRemainingAsOptional: false,
      recoveryMode: false,
    }
  } else if (level === 'none' && totalWarningSignals >= AB15_THRESHOLDS.WARNINGS_WATCH) {
    level = 'watch'
    reasons.push('Monitoring warning signals')
  }

  // ==========================================================================
  // VOLUME CAUTION FROM LATEST SET
  // ==========================================================================

  if (level === 'none' && volumeCautionActive) {
    level = 'watch'
    reasons.push('Volume caution from recent set')
  }

  // ==========================================================================
  // BUILD DECISION
  // ==========================================================================

  const applied = level !== 'none' && level !== 'watch'

  return {
    applied,
    level,
    reasons,
    adjustments,
    visibleSummary: buildVisibleSummary(level, reasons, adjustments),
    timestamp: Date.now(),
    version: 'ab15-live-deload-runtime',
  }
}

// =============================================================================
// VISIBLE SUMMARY BUILDER
// =============================================================================

function buildVisibleSummary(
  level: LiveDeloadLevel,
  reasons: string[],
  adjustments: LiveDeloadAdjustments
): string | null {
  switch (level) {
    case 'none':
      return null
    case 'watch':
      return null // Don't show "watching" - too noisy
    case 'extend_rest':
      return 'Extended rest recommended'
    case 'reduce_volume':
      return adjustments.reduceRemainingSetsBy > 0
        ? `Remaining sets reduced (${reasons[0] || 'fatigue signals'})`
        : 'Volume reduction active'
    case 'cap_intensity':
      return adjustments.capTargetRpeAt
        ? `Intensity capped at RPE ${adjustments.capTargetRpeAt}`
        : 'Intensity capped'
    case 'recovery_mode':
      return 'Recovery-safe mode active'
  }
}

// =============================================================================
// UTILITY: CHECK IF DECISION CHANGED
// =============================================================================

/**
 * Check if a new decision is meaningfully different from a previous one.
 * Used to avoid redundant UI updates.
 */
export function hasDecisionChanged(
  prev: LiveDeloadDecision | null,
  next: LiveDeloadDecision
): boolean {
  if (!prev) return next.applied
  if (prev.level !== next.level) return true
  if (prev.applied !== next.applied) return true
  if (prev.adjustments.reduceRemainingSetsBy !== next.adjustments.reduceRemainingSetsBy) return true
  if (prev.adjustments.capTargetRpeAt !== next.adjustments.capTargetRpeAt) return true
  if (prev.adjustments.recoveryMode !== next.adjustments.recoveryMode) return true
  return false
}

// =============================================================================
// SESSION METADATA FOR PERSISTENCE
// =============================================================================

/**
 * AB15 session metadata for optional persistence.
 * This can be saved with completed workout data.
 */
export interface AB15SessionMetadata {
  liveDeloadApplied: boolean
  finalLevel: LiveDeloadLevel
  finalReasons: string[]
  totalDecisionUpdates: number
  highestLevelReached: LiveDeloadLevel
  version: 'ab15-live-deload-runtime'
}

/**
 * Build session metadata from decision history.
 */
export function buildAB15SessionMetadata(
  decisions: LiveDeloadDecision[]
): AB15SessionMetadata {
  if (decisions.length === 0) {
    return {
      liveDeloadApplied: false,
      finalLevel: 'none',
      finalReasons: [],
      totalDecisionUpdates: 0,
      highestLevelReached: 'none',
      version: 'ab15-live-deload-runtime',
    }
  }

  const levelOrder: LiveDeloadLevel[] = [
    'none', 'watch', 'extend_rest', 'reduce_volume', 'cap_intensity', 'recovery_mode'
  ]

  let highestLevelIndex = 0
  for (const d of decisions) {
    const idx = levelOrder.indexOf(d.level)
    if (idx > highestLevelIndex) highestLevelIndex = idx
  }

  const final = decisions[decisions.length - 1]

  return {
    liveDeloadApplied: decisions.some(d => d.applied),
    finalLevel: final.level,
    finalReasons: final.reasons,
    totalDecisionUpdates: decisions.filter(d => d.applied).length,
    highestLevelReached: levelOrder[highestLevelIndex],
    version: 'ab15-live-deload-runtime',
  }
}
