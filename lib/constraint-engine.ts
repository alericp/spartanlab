// Constraint Engine
// Main entry point for primary limiter detection

import type { ConstraintResult, CONSTRAINT_LABELS } from '@/types/constraint-engine'
import {
  evaluateSkillSignals,
  evaluateStrengthSignals,
  evaluateVolumeSignals,
  evaluateRecoverySignals,
  type SkillSignalInputs,
  type StrengthSignalInputs,
  type VolumeSignalInputs,
  type RecoverySignalInputs,
} from './constraint-rules'
import {
  aggregateConstraintScores,
  determinePrimaryConstraint,
  calculateDataQuality,
} from './constraint-scoring'
import {
  generateFocusItems,
  generateExplanation,
} from './constraint-explanation'

// Import data sources
import { getSkillSessions } from './skill-session-service'
import { getSkillProgressions, getAthleteProfile } from './data-service'
import { getStrengthRecords } from './strength-service'
import { calculateRecoverySignal } from './recovery-engine'
import { calculateMovementBalance, calculateWeeklyVolume } from './volume-analyzer'
import { getWorkoutLogs } from './workout-log-service'
import { calculateSkillDensityMetrics, analyzeHoldTrend, getAggregateSessionStats } from './skill-density-engine'
import { calculateRelativeStrengthMetrics, type RelativeStrengthTier } from './relative-strength-engine'
import { assessFrontLeverSupport, assessPlancheSupport } from './strength-support-rules'

// [limiter-truth] Constraint labels - aligned with platform messaging
// ISSUE B: Inconsistency labels now require evidence and are distinct
const LABELS: Record<string, string> = {
  skill_density_deficit: 'Skill Exposure Too Low',
  progression_jump_too_large: 'Progression Too Advanced',
  // [limiter-truth] ISSUE B: Distinct labels for different inconsistency types
  inconsistent_skill_exposure: 'Skill Practice Gaps',  // More specific than generic "inconsistency"
  pull_strength_deficit: 'Pulling Strength Deficit',
  push_strength_deficit: 'Pushing Strength Deficit',
  core_tension_deficit: 'Core Tension Deficit',
  strength_imbalance: 'Push/Pull Imbalance',
  pull_volume_low: 'Low Pull Volume',
  push_volume_low: 'Low Push Volume',
  total_volume_low: 'Volume Too Low',
  horizontal_pull_neglect: 'Horizontal Pulling Neglect',
  fatigue_accumulation: 'Recovery / Fatigue Limiter',
  recovery_deficit: 'Recovery / Fatigue Limiter',
  training_inconsistency: 'Weekly Consistency Needed',  // More specific than generic "inconsistency"
  no_primary_constraint: 'No Primary Constraint',
  insufficient_data: 'More Data Needed',
  // [limiter-truth] Additional labels for new states
  early_calibration: 'Early Calibration',
  building_consistency: 'Building Consistency',
}

// =============================================================================
// MAIN ENGINE
// =============================================================================

/**
 * Analyze all athlete data and determine the primary training constraint
 * [PHASE 16L] Fixed null safety for server context where getAthleteProfile returns null
 */
export function analyzeConstraints(): ConstraintResult {
  // Gather all data
  const profile = getAthleteProfile()
  
  // [PHASE 16L] FIX: Handle null profile (server context has no localStorage)
  // Return early with insufficient_data result instead of crashing
  if (!profile) {
    console.log('[phase16l-bodyweight-null-root-cause-audit]', {
      crash_site: 'analyzeConstraints',
      profile_value: 'null',
      reason: 'getAthleteProfile_returns_null_in_server_context',
      fix: 'returning_insufficient_data_result',
    })
    return {
      primaryConstraint: 'insufficient_data',
      constraintLabel: 'Insufficient Data',
      category: 'data',
      confidence: 'low',
      explanation: 'Profile data not available in this context.',
      recommendations: ['Complete profile setup'],
      skillSignals: {
        weeklyDensity: 0,
        sessionsThisWeek: 0,
        cleanHoldRate: 0,
        readinessStatus: null,
        holdTrend: 'insufficient_data',
        hasSkillData: false,
      },
      strengthSignals: {
        pullRatio: null,
        pushRatio: null,
        hasStrengthData: false,
      },
      recoverySignals: {
        needsDeload: false,
        fatigueScore: 0,
        hasRecoveryData: false,
      },
    }
  }
  
  // [PHASE 16L] Profile source verdict - proves we're reading from non-null profile
  console.log('[phase16l-profile-source-truth-audit]', {
    source: 'getAthleteProfile',
    profileExists: true,
    hasBodyweight: profile.bodyweight !== null && profile.bodyweight !== undefined,
    hasPrimaryGoal: !!profile.primaryGoal,
  })
  
  const bodyweight = profile.bodyweight
  const primaryGoal = profile.primaryGoal
  
  // ==========================================================================
  // SKILL DATA
  // ==========================================================================
  const skillSessions = getSkillSessions()
  const progressions = getSkillProgressions()
  
  // Find the primary skill progression
  const primaryProgression = primaryGoal 
    ? progressions.find(p => p.skillName === primaryGoal)
    : progressions[0]
  
  let skillInputs: SkillSignalInputs = {
    weeklyDensity: 0,
    sessionsThisWeek: 0,
    cleanHoldRate: 0,
    readinessStatus: null,
    holdTrend: 'insufficient_data',
    hasSkillData: false,
  }
  
  if (primaryProgression && skillSessions.length > 0) {
    const densityMetrics = calculateSkillDensityMetrics(
      skillSessions, 
      primaryProgression.skillName, 
      primaryProgression.currentLevel
    )
    const holdTrend = analyzeHoldTrend(
      skillSessions,
      primaryProgression.skillName,
      primaryProgression.currentLevel
    )
    const stats = getAggregateSessionStats(
      skillSessions,
      primaryProgression.skillName,
      primaryProgression.currentLevel
    )
    
    skillInputs = {
      weeklyDensity: densityMetrics.weeklyDensity,
      sessionsThisWeek: densityMetrics.sessionsThisWeek,
      cleanHoldRate: stats.totalSets > 0 ? stats.cleanHoldCount / stats.totalSets : 0,
      readinessStatus: null, // Could be calculated but keeping simple
      holdTrend,
      hasSkillData: true,
      // ISSUE D FIX: Pass total skill session history for clean-slate detection
      totalSkillSessionsLogged: skillSessions.length,
    }
  }
  
  // ==========================================================================
  // STRENGTH DATA
  // ==========================================================================
  const strengthRecords = getStrengthRecords()
  const pullRecords = strengthRecords.filter(r => r.exercise === 'weighted_pull_up')
  const pushRecords = strengthRecords.filter(r => r.exercise === 'weighted_dip')
  
  let pullRatio: number | null = null
  let pushRatio: number | null = null
  let pullTier: RelativeStrengthTier | null = null
  let pushTier: RelativeStrengthTier | null = null
  
  if (pullRecords.length > 0 && bodyweight) {
    const bestPull = pullRecords.reduce((best, r) => 
      r.estimatedOneRM > best.estimatedOneRM ? r : best
    )
    const metrics = calculateRelativeStrengthMetrics(bestPull, bodyweight)
    pullRatio = metrics.oneRMRatio
    pullTier = metrics.tier
  }
  
  if (pushRecords.length > 0 && bodyweight) {
    const bestPush = pushRecords.reduce((best, r) => 
      r.estimatedOneRM > best.estimatedOneRM ? r : best
    )
    const metrics = calculateRelativeStrengthMetrics(bestPush, bodyweight)
    pushRatio = metrics.oneRMRatio
    pushTier = metrics.tier
  }
  
  const pullSupport = assessFrontLeverSupport(pullRatio)
  const pushSupport = assessPlancheSupport(pushRatio)
  
  const strengthInputs: StrengthSignalInputs = {
    pullRatio,
    pushRatio,
    pullTier,
    pushTier,
    pullSupportLevel: pullSupport.supportLevel,
    pushSupportLevel: pushSupport.supportLevel,
    hasStrengthData: strengthRecords.length > 0,
  }
  
  // ==========================================================================
  // VOLUME DATA
  // ==========================================================================
  const movementBalance = calculateMovementBalance()
  const weeklyVolume = calculateWeeklyVolume()
  
  // TASK 3: Get total workout history for clean-slate detection
  // Users with < 3 workouts should not be flagged as "inconsistent"
  const allWorkoutLogs = getWorkoutLogs()
  const totalWorkoutsLogged = allWorkoutLogs.length
  
  const volumeInputs: VolumeSignalInputs = {
    weeklyPushSets: movementBalance.pushSets,
    weeklyPullSets: movementBalance.pullSets,
    totalWeeklySets: weeklyVolume.totalSets,
    hasVolumeData: weeklyVolume.workoutsThisWeek > 0,
    primarySkillGoal: primaryGoal,
    workoutsThisWeek: weeklyVolume.workoutsThisWeek,
    totalWorkoutsLogged, // Pass total history for inconsistency filtering
  }
  
  // ==========================================================================
  // RECOVERY DATA
  // ==========================================================================
  const recoverySignal = calculateRecoverySignal()
  
  // Check if performance is declining
  const performanceDeclining = skillInputs.holdTrend === 'declining'
  
  const recoveryInputs: RecoverySignalInputs = {
    recoveryScore: recoverySignal.score,
    recoveryLevel: recoverySignal.level,
    volumeLoad: recoverySignal.factors.volumeLoad,
    hasRecoveryData: true, // Recovery engine always returns something
    performanceDeclining,
  }
  
  // ==========================================================================
  // EVALUATE ALL SIGNALS
  // ==========================================================================
  const skillSignals = evaluateSkillSignals(skillInputs)
  const strengthSignals = evaluateStrengthSignals(strengthInputs)
  const volumeSignals = evaluateVolumeSignals(volumeInputs)
  const recoverySignals = evaluateRecoverySignals(recoveryInputs)
  
  const allSignals = [...skillSignals, ...strengthSignals, ...volumeSignals, ...recoverySignals]
  
  // ==========================================================================
  // SCORE AND DETERMINE PRIMARY CONSTRAINT
  // ==========================================================================
  const scored = aggregateConstraintScores(allSignals)
  const { primary, secondary } = determinePrimaryConstraint(scored)
  
  const dataQuality = calculateDataQuality(
    skillInputs.hasSkillData,
    strengthInputs.hasStrengthData,
    volumeInputs.hasVolumeData,
    recoveryInputs.hasRecoveryData
  )
  
  // ==========================================================================
  // BUILD RESULT
  // ==========================================================================
  if (!primary || dataQuality === 'insufficient') {
    return {
      primaryConstraint: 'insufficient_data',
      constraintLabel: LABELS['insufficient_data'],
      category: 'none',
      confidence: 'low',
      score: 0,
      recommendedFocus: generateFocusItems('insufficient_data'),
      explanation: generateExplanation('insufficient_data', 'low'),
      dataQuality: 'insufficient',
    }
  }
  
  // If scores are all very low, no primary constraint
  if (primary.totalScore < 3) {
    return {
      primaryConstraint: 'no_primary_constraint',
      constraintLabel: LABELS['no_primary_constraint'],
      category: 'none',
      confidence: 'medium',
      score: 0,
      recommendedFocus: generateFocusItems('no_primary_constraint'),
      explanation: generateExplanation('no_primary_constraint', 'medium'),
      dataQuality,
    }
  }
  
  return {
    primaryConstraint: primary.type,
    constraintLabel: LABELS[primary.type] || primary.type,
    category: primary.category,
    confidence: primary.confidence,
    score: primary.totalScore,
    secondarySignal: secondary?.type,
    secondaryLabel: secondary ? (LABELS[secondary.type] || secondary.type) : undefined,
    recommendedFocus: generateFocusItems(primary.type),
    explanation: generateExplanation(primary.type, primary.confidence),
    dataQuality,
  }
}

// =============================================================================
// [limiter-truth] CANONICAL DISPLAYED-LIMITER HELPER (ISSUE A/D)
// =============================================================================

/**
 * Low-history state detection thresholds
 * [limiter-truth] ISSUE B: These thresholds determine when we have enough data
 * to confidently make limiter assertions
 */
const LOW_HISTORY_THRESHOLDS = {
  minTotalWorkouts: 6,       // Minimum total workout history
  minSkillSessions: 4,       // Minimum skill sessions for skill-related constraints
  minStrengthRecords: 2,     // Minimum strength records for strength constraints
}

/**
 * Determine if the user is in a low-history / clean-slate state
 * [limiter-truth] ISSUE B: This must be checked before asserting any confident limiter
 */
function detectLowHistoryState(): {
  isLowHistory: boolean
  totalWorkouts: number
  totalSkillSessions: number
  totalStrengthRecords: number
  reason: string | null
} {
  const workoutLogs = getWorkoutLogs()
  const skillSessions = getSkillSessions()
  const strengthRecords = getStrengthRecords()
  
  const totalWorkouts = workoutLogs.length
  const totalSkillSessions = skillSessions.length
  const totalStrengthRecords = strengthRecords.length
  
  const isLowWorkouts = totalWorkouts < LOW_HISTORY_THRESHOLDS.minTotalWorkouts
  const isLowSkill = totalSkillSessions < LOW_HISTORY_THRESHOLDS.minSkillSessions
  const isLowStrength = totalStrengthRecords < LOW_HISTORY_THRESHOLDS.minStrengthRecords
  
  // Overall low-history if any critical data source is thin
  const isLowHistory = isLowWorkouts && isLowSkill
  
  let reason: string | null = null
  if (isLowWorkouts && isLowSkill) {
    reason = 'insufficient_overall_history'
  } else if (isLowWorkouts) {
    reason = 'insufficient_workout_history'
  } else if (isLowSkill) {
    reason = 'insufficient_skill_history'
  }
  
  console.log('[limiter-truth] Low-history state detected:', {
    isLowHistory,
    totalWorkouts,
    totalSkillSessions,
    totalStrengthRecords,
    reason,
    thresholds: LOW_HISTORY_THRESHOLDS,
  })
  
  return { isLowHistory, totalWorkouts, totalSkillSessions, totalStrengthRecords, reason }
}

/**
 * CANONICAL DISPLAYED-LIMITER FUNCTION (TASK 2)
 * [limiter-truth] ISSUE A/D: Single source of truth for displayed limiter across all surfaces
 * 
 * Priority order:
 * 1. Check for low-history state first (prevents false confidence)
 * 2. Real recent history / actual completed sessions
 * 3. Real performance signals / strength metrics
 * 4. Recovery constraints
 * 5. Profile-based heuristics only when stronger evidence is missing
 */
export function deriveCanonicalDisplayedLimiter(): {
  label: string
  code: string
  category: string
  confidence: 'low' | 'medium' | 'high'
  isLowHistory: boolean
  isFallback: boolean
  explanation: string
  focus: string[]
} {
  // [limiter-truth] ISSUE B: Check low-history state first
  const historyState = detectLowHistoryState()
  
  // [limiter-truth] ISSUE B/F: If low-history, return early with appropriate label
  // Do NOT return "Training Inconsistency" for clean-slate users
  if (historyState.isLowHistory) {
    console.log('[limiter-truth] Returning early calibration label due to low history')
    
    return {
      label: 'Early Calibration',
      code: 'early_calibration',
      category: 'calibration',
      confidence: 'low',
      isLowHistory: true,
      isFallback: false, // This is intentional, not a fallback
      explanation: 'Complete a few more training sessions to unlock personalized constraint analysis. We need more data to confidently identify your limiters.',
      focus: [
        'Log your workouts consistently',
        'Track skill practice sessions',
        'Complete at least 6 workouts total',
      ],
    }
  }
  
  // [limiter-truth] Get full constraint analysis
  const result = analyzeConstraints()
  
  // [limiter-truth] ISSUE B/F: Check if the result is "insufficient_data" despite having some history
  // This means we have workout logs but not enough specific data for confident analysis
  if (result.primaryConstraint === 'insufficient_data') {
    console.log('[limiter-truth] Constraint engine returned insufficient_data with some history')
    
    return {
      label: 'More Data Needed',
      code: 'insufficient_data',
      category: 'data',
      confidence: 'low',
      isLowHistory: false,
      isFallback: true,
      explanation: 'Your training data is being collected. Continue logging workouts and skill sessions for personalized insights.',
      focus: [
        'Log detailed workout sets',
        'Track skill holds and progressions',
        'Record strength benchmarks',
      ],
    }
  }
  
  // [limiter-truth] No primary constraint = balanced training
  if (result.primaryConstraint === 'no_primary_constraint') {
    return {
      label: 'Training Balanced',
      code: 'no_primary_constraint',
      category: 'balanced',
      confidence: 'medium',
      isLowHistory: false,
      isFallback: false,
      explanation: 'No major bottlenecks detected. Your training appears well-balanced across skill, strength, and volume.',
      focus: [
        'Continue current approach',
        'Maintain consistency',
        'Progress gradually',
      ],
    }
  }
  
  // [limiter-truth] ISSUE B: Special handling for inconsistency labels
  // These should ONLY appear with high confidence and sufficient history
  if (
    result.primaryConstraint === 'training_inconsistency' ||
    result.primaryConstraint === 'inconsistent_skill_exposure'
  ) {
    // [limiter-truth] Double-check we have enough history for this assertion
    if (historyState.totalWorkouts < 8) {
      console.log('[limiter-truth] Suppressing inconsistency label due to borderline history:', {
        constraint: result.primaryConstraint,
        totalWorkouts: historyState.totalWorkouts,
      })
      
      // Return a softer label instead
      // [PHASE 7] Limiter vs Builder Failure Truth - Building Consistency is a calibration state, NOT a builder failure
      console.log('[limiter-vs-builder-failure-truth]', {
        limiterLabel: 'Building Consistency',
        limiterCode: 'building_consistency',
        isCalibrationState: true,
        isBuilderFailure: false,
        reason: 'Low workout history with borderline inconsistency - user needs to establish baseline',
        hidesActiveBuilderFailure: false,
        verdict: 'limiter_separate_from_builder_failure',
      })
      return {
        label: 'Building Consistency',
        code: 'building_consistency',
        category: 'calibration',
        confidence: 'medium',
        isLowHistory: false,
        isFallback: false,
        explanation: 'Establishing your training baseline. Keep logging sessions to help us understand your patterns better.',
        focus: [
          'Train at least 3x per week',
          'Log each workout session',
          'Build a consistent routine',
        ],
      }
    }
  }
  
  // [limiter-truth] Return the actual constraint result
  const focusItems = result.recommendedFocus
    .filter(f => f.priority === 'primary')
    .map(f => f.action)
    .slice(0, 3)
  
  console.log('[limiter-truth] Returning canonical limiter:', {
    code: result.primaryConstraint,
    label: result.constraintLabel,
    confidence: result.confidence,
    historyState: {
      totalWorkouts: historyState.totalWorkouts,
      totalSkillSessions: historyState.totalSkillSessions,
    },
  })
  
  return {
    label: result.constraintLabel,
    code: result.primaryConstraint,
    category: result.category.charAt(0).toUpperCase() + result.category.slice(1),
    confidence: result.confidence,
    isLowHistory: false,
    isFallback: false,
    explanation: result.explanation,
    focus: focusItems.length > 0 ? focusItems : ['Continue current approach'],
  }
}

/**
 * Get a simplified insight for dashboard display
 * [limiter-truth] ISSUE D: Now uses canonical displayed-limiter helper
 */
export function getConstraintInsight(): {
  hasInsight: boolean
  label: string
  category: string
  focus: string[]
  explanation: string
  confidence: string
} {
  // [limiter-truth] Use canonical helper for unified truth
  const canonical = deriveCanonicalDisplayedLimiter()
  
  // [limiter-truth] Log that we're using canonical source
  console.log('[limiter-truth] getConstraintInsight using canonical source:', canonical.code)
  
  // Low-history or insufficient data = no confident insight
  if (canonical.isLowHistory || canonical.code === 'insufficient_data') {
    return {
      hasInsight: false,
      label: canonical.label,
      category: canonical.category,
      focus: canonical.focus,
      explanation: canonical.explanation,
      confidence: canonical.confidence,
    }
  }
  
  // Balanced training
  if (canonical.code === 'no_primary_constraint') {
    return {
      hasInsight: true,
      label: 'Training Balanced',
      category: 'Balanced',
      focus: canonical.focus,
      explanation: canonical.explanation,
      confidence: canonical.confidence,
    }
  }
  
  // Actual constraint insight
  return {
    hasInsight: true,
    label: canonical.label,
    category: canonical.category,
    focus: canonical.focus,
    explanation: canonical.explanation,
    confidence: canonical.confidence,
  }
}
