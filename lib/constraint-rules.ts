// Constraint Rules
// Defines the rules for evaluating each constraint type

import type { ConstraintSignal, ConstraintType, ConstraintCategory, ConfidenceLevel } from '@/types/constraint-engine'
import type { SkillDensityMetrics, ReadinessStatus } from '@/types/skill-readiness'
import type { RecoverySignal } from './recovery-engine'
import type { MovementBalance } from './volume-analyzer'
import type { SupportLevel } from './strength-support-rules'
import type { RelativeStrengthTier } from './relative-strength-engine'

// =============================================================================
// THRESHOLDS
// =============================================================================

// [limiter-truth] ISSUE B: Clean-slate / low-history guardrails
// Users with fewer than this many total sessions should NOT be flagged as "inconsistent"
// This prevents mislabeling users who just started using the app
const CLEAN_SLATE_THRESHOLD = {
  // Minimum total workout history to flag ANY inconsistency
  minTotalWorkoutsForInconsistency: 6,  // INCREASED from 3
  // Minimum skill sessions for skill-specific inconsistency
  minSkillSessionsForInconsistency: 4,  // INCREASED from 3
}

const THRESHOLDS = {
  // Skill thresholds
  minWeeklyDensity: 30, // seconds
  minSessionsPerWeek: 2,
  minCleanHoldRate: 0.6,
  
  // Strength thresholds
  minPullRatio: 0.25, // 25% BW for basic skill support
  minPushRatio: 0.30,
  
  // Volume thresholds
  minWeeklySets: 20,
  minPullSets: 6,
  minPushSets: 6,
  
  // Recovery thresholds
  fatigueScoreThreshold: 50, // Below this indicates fatigue
}

// =============================================================================
// SKILL SIGNAL EVALUATION
// =============================================================================

export interface SkillSignalInputs {
  weeklyDensity: number
  sessionsThisWeek: number
  cleanHoldRate: number
  readinessStatus: ReadinessStatus | null
  holdTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  hasSkillData: boolean
  // ISSUE D FIX: Total session history for clean-slate detection
  // Users with < 3 sessions should not be flagged as "inconsistent"
  totalSkillSessionsLogged?: number
}

export function evaluateSkillSignals(inputs: SkillSignalInputs): ConstraintSignal[] {
  const signals: ConstraintSignal[] = []
  
  if (!inputs.hasSkillData) {
    return signals // No signals if no data
  }
  
  // Skill Density Deficit
  if (inputs.weeklyDensity < THRESHOLDS.minWeeklyDensity) {
    const severity = 1 - (inputs.weeklyDensity / THRESHOLDS.minWeeklyDensity)
    signals.push({
      type: 'skill_density_deficit',
      category: 'skill',
      score: Math.min(8, Math.round(severity * 10)),
      confidence: inputs.sessionsThisWeek > 0 ? 'high' : 'medium',
      rawMetrics: { weeklyDensity: inputs.weeklyDensity, threshold: THRESHOLDS.minWeeklyDensity },
    })
  }
  
  // Inconsistent Skill Exposure
  // [limiter-truth] ISSUE B: Only flag if user has meaningful skill session history
  // Clean-slate users should NOT be classified as "inconsistent" - use higher threshold
  const totalSkillHistory = inputs.totalSkillSessionsLogged ?? 0
  const hasEnoughSkillHistory = totalSkillHistory >= CLEAN_SLATE_THRESHOLD.minSkillSessionsForInconsistency
  
  // [limiter-truth] Log skill inconsistency decision
  console.log('[limiter-truth] Skill inconsistency check:', {
    totalSkillHistory,
    requiredThreshold: CLEAN_SLATE_THRESHOLD.minSkillSessionsForInconsistency,
    hasEnoughHistory: hasEnoughSkillHistory,
    sessionsThisWeek: inputs.sessionsThisWeek,
    wouldFlag: hasEnoughSkillHistory && inputs.sessionsThisWeek < THRESHOLDS.minSessionsPerWeek,
  })
  
  if (hasEnoughSkillHistory && inputs.sessionsThisWeek < THRESHOLDS.minSessionsPerWeek) {
    signals.push({
      type: 'inconsistent_skill_exposure',
      category: 'skill',
      score: inputs.sessionsThisWeek === 0 ? 6 : 4,
      confidence: totalSkillHistory >= 8 ? 'high' : 'medium', // INCREASED confidence threshold
      rawMetrics: { sessionsThisWeek: inputs.sessionsThisWeek, totalSkillHistory },
    })
  }
  
  // Progression Jump Too Large
  if (inputs.readinessStatus === 'stay_current' && inputs.cleanHoldRate < THRESHOLDS.minCleanHoldRate) {
    signals.push({
      type: 'progression_jump_too_large',
      category: 'skill',
      score: 5,
      confidence: 'medium',
      rawMetrics: { cleanHoldRate: inputs.cleanHoldRate, readinessStatus: inputs.readinessStatus },
    })
  }
  
  return signals
}

// =============================================================================
// STRENGTH SIGNAL EVALUATION
// =============================================================================

export interface StrengthSignalInputs {
  pullRatio: number | null
  pushRatio: number | null
  pullTier: RelativeStrengthTier | null
  pushTier: RelativeStrengthTier | null
  pullSupportLevel: SupportLevel
  pushSupportLevel: SupportLevel
  hasStrengthData: boolean
  coreHoldTime?: number | null // L-sit or hollow hold time
}

export function evaluateStrengthSignals(inputs: StrengthSignalInputs): ConstraintSignal[] {
  const signals: ConstraintSignal[] = []
  
  if (!inputs.hasStrengthData) {
    return signals
  }
  
  // Pull Strength Deficit
  if (inputs.pullSupportLevel === 'likely_limiter' || inputs.pullSupportLevel === 'borderline_support') {
    const score = inputs.pullSupportLevel === 'likely_limiter' ? 7 : 4
    signals.push({
      type: 'pull_strength_deficit',
      category: 'strength',
      score,
      confidence: inputs.pullRatio !== null ? 'high' : 'low',
      rawMetrics: { pullRatio: inputs.pullRatio, pullSupportLevel: inputs.pullSupportLevel },
    })
  }
  
  // Push Strength Deficit
  if (inputs.pushSupportLevel === 'likely_limiter' || inputs.pushSupportLevel === 'borderline_support') {
    const score = inputs.pushSupportLevel === 'likely_limiter' ? 7 : 4
    signals.push({
      type: 'push_strength_deficit',
      category: 'strength',
      score,
      confidence: inputs.pushRatio !== null ? 'high' : 'low',
      rawMetrics: { pushRatio: inputs.pushRatio, pushSupportLevel: inputs.pushSupportLevel },
    })
  }
  
  // Strength Imbalance (check tier difference)
  if (inputs.pullTier && inputs.pushTier) {
    const tierOrder: RelativeStrengthTier[] = ['novice', 'developing', 'strong', 'advanced', 'elite']
    const pullIndex = tierOrder.indexOf(inputs.pullTier)
    const pushIndex = tierOrder.indexOf(inputs.pushTier)
    const diff = Math.abs(pullIndex - pushIndex)
    
    if (diff >= 2) {
      signals.push({
        type: 'strength_imbalance',
        category: 'strength',
        score: Math.min(6, diff * 2),
        confidence: 'high',
        rawMetrics: { pullTier: inputs.pullTier, pushTier: inputs.pushTier, tierDiff: diff },
      })
    }
  }
  
  // Core Tension Deficit (if core hold time is low for skill goals)
  if (inputs.coreHoldTime !== undefined && inputs.coreHoldTime !== null && inputs.coreHoldTime < 20) {
    signals.push({
      type: 'core_tension_deficit',
      category: 'strength',
      score: inputs.coreHoldTime < 10 ? 6 : 4,
      confidence: 'medium',
      rawMetrics: { coreHoldTime: inputs.coreHoldTime },
    })
  }
  
  return signals
}

// =============================================================================
// VOLUME SIGNAL EVALUATION
// =============================================================================

export interface VolumeSignalInputs {
  weeklyPushSets: number
  weeklyPullSets: number
  totalWeeklySets: number
  hasVolumeData: boolean
  primarySkillGoal: string | null
  workoutsThisWeek?: number
  missedSessions?: number
  trainingStreak?: number
  // TASK 3: Total workout history for clean-slate detection
  // Users with < 3 workouts should not be flagged as "inconsistent"
  totalWorkoutsLogged?: number
}

export function evaluateVolumeSignals(inputs: VolumeSignalInputs): ConstraintSignal[] {
  const signals: ConstraintSignal[] = []
  
  if (!inputs.hasVolumeData || inputs.totalWeeklySets === 0) {
    return signals
  }
  
  // Low Pull Volume
  if (inputs.weeklyPullSets < THRESHOLDS.minPullSets) {
    signals.push({
      type: 'pull_volume_low',
      category: 'volume',
      score: inputs.weeklyPullSets === 0 ? 5 : 3,
      confidence: 'medium',
      rawMetrics: { weeklyPullSets: inputs.weeklyPullSets },
    })
  }
  
  // Low Push Volume
  if (inputs.weeklyPushSets < THRESHOLDS.minPushSets) {
    signals.push({
      type: 'push_volume_low',
      category: 'volume',
      score: inputs.weeklyPushSets === 0 ? 5 : 3,
      confidence: 'medium',
      rawMetrics: { weeklyPushSets: inputs.weeklyPushSets },
    })
  }
  
  // Horizontal Pull Neglect (if FL is a goal)
  if (inputs.primarySkillGoal === 'front_lever' && inputs.weeklyPullSets < 4) {
    signals.push({
      type: 'horizontal_pull_neglect',
      category: 'volume',
      score: 4,
      confidence: 'medium',
      rawMetrics: { weeklyPullSets: inputs.weeklyPullSets, primaryGoal: inputs.primarySkillGoal },
    })
  }
  
  // Total Volume Too Low
  if (inputs.totalWeeklySets < THRESHOLDS.minWeeklySets && inputs.totalWeeklySets > 0) {
    signals.push({
      type: 'total_volume_low',
      category: 'volume',
      score: inputs.totalWeeklySets < 10 ? 6 : 4,
      confidence: 'high',
      rawMetrics: { totalWeeklySets: inputs.totalWeeklySets, threshold: THRESHOLDS.minWeeklySets },
    })
  }
  
  // Training Inconsistency (missed sessions or low workout frequency)
  // [limiter-truth] ISSUE B: Only flag if user has meaningful workout history
  // Clean-slate users should NOT be classified as "inconsistent" - use higher threshold
  const totalWorkoutHistory = inputs.totalWorkoutsLogged ?? 0
  const hasEnoughHistoryForInconsistency = totalWorkoutHistory >= CLEAN_SLATE_THRESHOLD.minTotalWorkoutsForInconsistency
  
  // [limiter-truth] Log volume inconsistency decision
  console.log('[limiter-truth] Volume inconsistency check:', {
    totalWorkoutHistory,
    requiredThreshold: CLEAN_SLATE_THRESHOLD.minTotalWorkoutsForInconsistency,
    hasEnoughHistory: hasEnoughHistoryForInconsistency,
    workoutsThisWeek: inputs.workoutsThisWeek,
    wouldFlag: hasEnoughHistoryForInconsistency && inputs.workoutsThisWeek !== undefined && inputs.workoutsThisWeek < 2,
  })
  
  if (hasEnoughHistoryForInconsistency && inputs.workoutsThisWeek !== undefined && inputs.workoutsThisWeek < 2) {
    signals.push({
      type: 'training_inconsistency',
      category: 'volume',
      score: inputs.workoutsThisWeek === 0 ? 7 : 5,
      confidence: totalWorkoutHistory >= 10 ? 'high' : 'medium', // INCREASED confidence threshold
      rawMetrics: { workoutsThisWeek: inputs.workoutsThisWeek, totalHistory: totalWorkoutHistory },
    })
  }
  
  // Training Inconsistency (missed sessions) - only if enough history
  if (hasEnoughHistoryForInconsistency && inputs.missedSessions !== undefined && inputs.missedSessions >= 2) {
    signals.push({
      type: 'training_inconsistency',
      category: 'volume',
      score: Math.min(7, inputs.missedSessions * 2),
      confidence: totalWorkoutHistory >= 10 ? 'high' : 'medium', // INCREASED confidence threshold
      rawMetrics: { missedSessions: inputs.missedSessions, totalHistory: totalWorkoutHistory },
    })
  }
  
  return signals
}

// =============================================================================
// RECOVERY SIGNAL EVALUATION
// =============================================================================

export interface RecoverySignalInputs {
  recoveryScore: number
  recoveryLevel: 'HIGH' | 'MODERATE' | 'LOW'
  volumeLoad: 'low' | 'moderate' | 'high'
  hasRecoveryData: boolean
  performanceDeclining: boolean
}

export function evaluateRecoverySignals(inputs: RecoverySignalInputs): ConstraintSignal[] {
  const signals: ConstraintSignal[] = []
  
  if (!inputs.hasRecoveryData) {
    return signals
  }
  
  // Fatigue Accumulation
  if (inputs.recoveryLevel === 'LOW') {
    signals.push({
      type: 'fatigue_accumulation',
      category: 'recovery',
      score: 7,
      confidence: 'high',
      rawMetrics: { recoveryScore: inputs.recoveryScore, recoveryLevel: inputs.recoveryLevel },
    })
  }
  
  // Recovery Deficit with performance decline
  if (inputs.recoveryLevel === 'LOW' && inputs.performanceDeclining) {
    signals.push({
      type: 'recovery_deficit',
      category: 'recovery',
      score: 8,
      confidence: 'high',
      rawMetrics: { performanceDeclining: inputs.performanceDeclining },
    })
  }
  
  // Moderate fatigue with high volume
  if (inputs.recoveryLevel === 'MODERATE' && inputs.volumeLoad === 'high') {
    signals.push({
      type: 'fatigue_accumulation',
      category: 'recovery',
      score: 4,
      confidence: 'medium',
      rawMetrics: { recoveryLevel: inputs.recoveryLevel, volumeLoad: inputs.volumeLoad },
    })
  }
  
  return signals
}
