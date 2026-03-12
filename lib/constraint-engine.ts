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
import { calculateSkillDensityMetrics, analyzeHoldTrend, getAggregateSessionStats } from './skill-density-engine'
import { calculateRelativeStrengthMetrics, type RelativeStrengthTier } from './relative-strength-engine'
import { assessFrontLeverSupport, assessPlancheSupport } from './strength-support-rules'

// Constraint labels - aligned with platform messaging
const LABELS: Record<string, string> = {
  skill_density_deficit: 'Skill Exposure Too Low',
  progression_jump_too_large: 'Progression Too Advanced Too Early',
  inconsistent_skill_exposure: 'Training Inconsistency',
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
  training_inconsistency: 'Training Inconsistency',
  no_primary_constraint: 'No Primary Constraint',
  insufficient_data: 'More Data Needed',
}

// =============================================================================
// MAIN ENGINE
// =============================================================================

/**
 * Analyze all athlete data and determine the primary training constraint
 */
export function analyzeConstraints(): ConstraintResult {
  // Gather all data
  const profile = getAthleteProfile()
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
  
  const volumeInputs: VolumeSignalInputs = {
    weeklyPushSets: movementBalance.pushSets,
    weeklyPullSets: movementBalance.pullSets,
    totalWeeklySets: weeklyVolume.totalSets,
    hasVolumeData: weeklyVolume.workoutsThisWeek > 0,
    primarySkillGoal: primaryGoal,
    workoutsThisWeek: weeklyVolume.workoutsThisWeek,
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

/**
 * Get a simplified insight for dashboard display
 */
export function getConstraintInsight(): {
  hasInsight: boolean
  label: string
  category: string
  focus: string[]
  explanation: string
  confidence: string
} {
  const result = analyzeConstraints()
  
  if (result.primaryConstraint === 'insufficient_data') {
    return {
      hasInsight: false,
      label: 'More Data Needed',
      category: 'Data',
      focus: ['Log workouts and skill sessions to unlock insights'],
      explanation: 'Track your training consistently to receive personalized constraint analysis.',
      confidence: 'low',
    }
  }
  
  if (result.primaryConstraint === 'no_primary_constraint') {
    return {
      hasInsight: true,
      label: 'Training Balanced',
      category: 'Balanced',
      focus: ['Continue current approach', 'Maintain consistency'],
      explanation: 'No major bottlenecks detected. Keep training consistently.',
      confidence: 'medium',
    }
  }
  
  return {
    hasInsight: true,
    label: result.constraintLabel,
    category: result.category.charAt(0).toUpperCase() + result.category.slice(1),
    focus: result.recommendedFocus
      .filter(f => f.priority === 'primary')
      .map(f => f.action)
      .slice(0, 3),
    explanation: result.explanation,
    confidence: result.confidence,
  }
}
