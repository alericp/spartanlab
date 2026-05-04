// Adaptive Athlete Engine
// Central integration layer that synthesizes all SpartanLab tools into unified athlete intelligence

import { getAthleteProfile, getSkillProgressions, type AthleteProfile, type SkillProgression } from './data-service'
// [TYPE-OWNER-IMPORT] ConstraintResult lives in @/types/constraint-engine,
// not in ./constraint-engine. Import the type directly from its owner.
import { getConstraintInsight, analyzeConstraints, deriveCanonicalDisplayedLimiter } from './constraint-engine'
import type { ConstraintResult } from '@/types/constraint-engine'
import { assessDeloadNeed, type DeloadAssessment, type DeloadStatus } from './deload-detection-engine'
import { calculateRecoverySignal, type RecoverySignal, type RecoveryLevel } from './recovery-engine'
import { getStrengthRecords } from './strength-service'
import { calculateStrengthTrend, getOverallMomentum, type TrendDirection } from './strength-trend-engine'
import { getSkillSessions, getRecentSkillSessions } from './skill-session-service'
import { calculateSkillDensityMetrics, analyzeHoldTrend, analyzeDensityTrend } from './skill-density-engine'
// [TYPE-OWNER-IMPORT] ReadinessDecision/ReadinessStatus live in
// @/types/skill-readiness, not in ./skill-readiness-engine.
import { calculateReadinessDecision } from './skill-readiness-engine'
import type { ReadinessDecision, ReadinessStatus } from '@/types/skill-readiness'
import { getWorkoutLogs } from './workout-log-service'
import { calculateWeeklyVolume, getWorkoutsLastNDays } from './volume-analyzer'
import { getSkillProgression } from './skill-progression-rules'

// =============================================================================
// TYPES
// =============================================================================

export type MomentumState = 'improving' | 'stable' | 'plateauing' | 'regressing'
export type PlateauStatus = 'no_plateau' | 'possible_plateau' | 'plateau_detected'
export type FatigueState = 'fresh' | 'normal' | 'fatigued' | 'overtrained'

export interface AthleteState {
  // Identity
  username: string
  experienceLevel: string
  
  // Goals
  primaryGoal: string | null
  primaryGoalLabel: string
  currentSkillLevel: number
  targetSkillLevel: number
  
  // Constraints
  primaryConstraint: string | null
  constraintLabel: string
  constraintCategory: string
  constraintConfidence: string
  
  // Strength Support
  strengthSupportLevel: 'insufficient' | 'developing' | 'sufficient' | 'unknown'
  pullStrengthTrend: TrendDirection
  pushStrengthTrend: TrendDirection
  
  // Training State
  trainingMomentum: MomentumState
  momentumScore: number // 0-100
  plateauStatus: PlateauStatus
  fatigueState: FatigueState
  recoveryLevel: RecoveryLevel
  recoveryScore: number
  
  // Consistency
  sessionConsistency: number // 0-100
  weeklyFrequency: number
  recentWorkoutCount: number
  
  // Readiness
  skillReadinessStatus: ReadinessStatus | null
  skillReadinessConfidence: number
  
  // Deload
  deloadStatus: DeloadStatus
  deloadScore: number
  
  // Meta
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
  lastUpdated: string
}

export interface PrimaryFocusOutput {
  focusArea: string
  focusLabel: string
  reason: string
  suggestions: string[]
  urgency: 'high' | 'medium' | 'low'
}

export interface AthleteEngineInsight {
  type: 'momentum' | 'plateau' | 'constraint' | 'readiness' | 'recovery' | 'consistency'
  title: string
  value: string
  explanation: string
  significance: 'positive' | 'neutral' | 'attention' | 'warning'
}

export interface AthleteEngineSnapshot {
  state: AthleteState
  primaryFocus: PrimaryFocusOutput
  insights: AthleteEngineInsight[]
  topInsight: AthleteEngineInsight | null
  recommendations: string[]
  hasData: boolean
}

// =============================================================================
// SKILL LABEL HELPERS
// =============================================================================

const SKILL_LABELS: Record<string, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  muscle_up: 'Muscle-Up',
  handstand_push_up: 'Handstand Push-Up',
  back_lever: 'Back Lever',
  iron_cross: 'Iron Cross',
}

function getSkillLabel(skillKey: string | null): string {
  if (!skillKey) return 'No Goal Set'
  return SKILL_LABELS[skillKey] || skillKey.replace(/_/g, ' ')
}

// =============================================================================
// MOMENTUM CALCULATION
// =============================================================================

function calculateTrainingMomentum(
  strengthRecords: ReturnType<typeof getStrengthRecords>,
  skillSessions: ReturnType<typeof getSkillSessions>,
  primaryGoal: string | null
): { momentum: MomentumState; score: number } {
  let positiveSignals = 0
  let negativeSignals = 0
  let totalSignals = 0
  
  // Check strength trends
  const pullRecords = strengthRecords.filter(r => r.exercise === 'weighted_pull_up')
  const pushRecords = strengthRecords.filter(r => r.exercise === 'weighted_dip')
  
  if (pullRecords.length >= 3) {
    totalSignals++
    const trend = calculateStrengthTrend(pullRecords, 'weighted_pull_up')
    if (trend.direction === 'improving') positiveSignals++
    else if (trend.direction === 'regressing') negativeSignals++
  }
  
  if (pushRecords.length >= 3) {
    totalSignals++
    const trend = calculateStrengthTrend(pushRecords, 'weighted_dip')
    if (trend.direction === 'improving') positiveSignals++
    else if (trend.direction === 'regressing') negativeSignals++
  }
  
  // Check skill trends
  if (primaryGoal && skillSessions.length >= 3) {
    const goalSessions = skillSessions.filter(s => s.skillName === primaryGoal)
    if (goalSessions.length >= 3) {
      const level = goalSessions[0]?.level ?? 0
      
      totalSignals++
      const holdTrend = analyzeHoldTrend(skillSessions, primaryGoal, level)
      if (holdTrend === 'improving') positiveSignals++
      else if (holdTrend === 'declining') negativeSignals++
      
      totalSignals++
      const densityTrend = analyzeDensityTrend(skillSessions, primaryGoal, level)
      if (densityTrend === 'improving') positiveSignals++
      else if (densityTrend === 'declining') negativeSignals++
    }
  }
  
  // Check workout consistency
  const recentWorkouts = getWorkoutsLastNDays(14)
  if (recentWorkouts.length > 0) {
    totalSignals++
    if (recentWorkouts.length >= 6) positiveSignals++ // Good frequency
    else if (recentWorkouts.length <= 2) negativeSignals++ // Low frequency
  }
  
  // Calculate score
  if (totalSignals === 0) {
    return { momentum: 'stable', score: 50 }
  }
  
  const positiveRatio = positiveSignals / totalSignals
  const negativeRatio = negativeSignals / totalSignals
  const score = Math.round(50 + (positiveRatio * 50) - (negativeRatio * 50))
  
  // Determine state
  let momentum: MomentumState
  if (negativeRatio >= 0.5) {
    momentum = 'regressing'
  } else if (positiveRatio >= 0.5 && negativeRatio < 0.2) {
    momentum = 'improving'
  } else if (positiveRatio < 0.2 && negativeRatio < 0.2) {
    momentum = 'plateauing'
  } else {
    momentum = 'stable'
  }
  
  return { momentum, score }
}

// =============================================================================
// PLATEAU DETECTION
// =============================================================================

function detectPlateauStatus(
  strengthRecords: ReturnType<typeof getStrengthRecords>,
  skillSessions: ReturnType<typeof getSkillSessions>,
  primaryGoal: string | null
): PlateauStatus {
  let stableSignals = 0
  let totalSignals = 0
  
  // Check strength plateaus
  const pullRecords = strengthRecords.filter(r => r.exercise === 'weighted_pull_up')
  if (pullRecords.length >= 4) {
    totalSignals++
    const trend = calculateStrengthTrend(pullRecords, 'weighted_pull_up')
    if (trend.direction === 'stable') stableSignals++
  }
  
  const pushRecords = strengthRecords.filter(r => r.exercise === 'weighted_dip')
  if (pushRecords.length >= 4) {
    totalSignals++
    const trend = calculateStrengthTrend(pushRecords, 'weighted_dip')
    if (trend.direction === 'stable') stableSignals++
  }
  
  // Check skill plateaus
  if (primaryGoal && skillSessions.length >= 4) {
    const goalSessions = skillSessions.filter(s => s.skillName === primaryGoal)
    if (goalSessions.length >= 4) {
      const level = goalSessions[0]?.level ?? 0
      
      totalSignals++
      const holdTrend = analyzeHoldTrend(skillSessions, primaryGoal, level)
      if (holdTrend === 'stable') stableSignals++
      
      totalSignals++
      const densityTrend = analyzeDensityTrend(skillSessions, primaryGoal, level)
      if (densityTrend === 'stable') stableSignals++
    }
  }
  
  if (totalSignals === 0) return 'no_plateau'
  
  const stableRatio = stableSignals / totalSignals
  
  if (stableRatio >= 0.75) return 'plateau_detected'
  if (stableRatio >= 0.5) return 'possible_plateau'
  return 'no_plateau'
}

// =============================================================================
// FATIGUE STATE
// =============================================================================

function determineFatigueState(
  recovery: RecoverySignal,
  deload: DeloadAssessment
): FatigueState {
  if (deload.status === 'deload_recommended') return 'overtrained'
  if (deload.status === 'lighten_next_session' || recovery.level === 'LOW') return 'fatigued'
  if (recovery.level === 'HIGH') return 'fresh'
  return 'normal'
}

// =============================================================================
// CONSISTENCY CALCULATION
// =============================================================================

function calculateConsistency(): { score: number; weeklyFrequency: number; recentCount: number } {
  const workouts = getWorkoutsLastNDays(28) // Last 4 weeks
  const thisWeek = getWorkoutsLastNDays(7)
  
  // Score based on workouts per week
  const weeksWithData = 4
  const avgPerWeek = workouts.length / weeksWithData
  
  // Target is 3-5 workouts per week = 100%
  const score = Math.min(100, Math.round((avgPerWeek / 4) * 100))
  
  return {
    score,
    weeklyFrequency: Math.round(avgPerWeek * 10) / 10,
    recentCount: workouts.length,
  }
}

// =============================================================================
// DATA QUALITY ASSESSMENT
// =============================================================================

function assessDataQuality(
  profile: AthleteProfile,
  skillSessions: ReturnType<typeof getSkillSessions>,
  strengthRecords: ReturnType<typeof getStrengthRecords>,
  workoutLogs: ReturnType<typeof getWorkoutLogs>
): 'insufficient' | 'partial' | 'good' | 'excellent' {
  let score = 0
  
  // Profile completeness
  if (profile.bodyweight) score += 1
  if (profile.primaryGoal) score += 1
  if (profile.experienceLevel) score += 1
  
  // Skill data
  if (skillSessions.length >= 1) score += 1
  if (skillSessions.length >= 5) score += 1
  if (skillSessions.length >= 10) score += 1
  
  // Strength data
  if (strengthRecords.length >= 1) score += 1
  if (strengthRecords.length >= 5) score += 1
  if (strengthRecords.length >= 10) score += 1
  
  // Workout logs
  if (workoutLogs.length >= 1) score += 1
  if (workoutLogs.length >= 5) score += 1
  if (workoutLogs.length >= 10) score += 1
  
  if (score >= 10) return 'excellent'
  if (score >= 7) return 'good'
  if (score >= 4) return 'partial'
  return 'insufficient'
}

// =============================================================================
// PRIMARY FOCUS DETERMINATION
// =============================================================================

function determinePrimaryFocus(state: AthleteState): PrimaryFocusOutput {
  // Priority order: recovery > constraint > plateau > readiness > general
  
  // Recovery/Fatigue takes priority
  if (state.fatigueState === 'overtrained' || state.deloadStatus === 'deload_recommended') {
    return {
      focusArea: 'recovery',
      focusLabel: 'Recovery Focus',
      reason: 'Multiple signals indicate accumulated fatigue. Recovery is the priority.',
      suggestions: [
        'Reduce training volume by 40-50%',
        'Prioritize sleep and nutrition',
        'Light movement only for 5-7 days',
      ],
      urgency: 'high',
    }
  }
  
  if (state.fatigueState === 'fatigued' || state.deloadStatus === 'lighten_next_session') {
    return {
      focusArea: 'recovery',
      focusLabel: 'Manage Fatigue',
      reason: 'Fatigue is elevated. Reduce intensity to prevent overtraining.',
      suggestions: [
        'Reduce next session volume by 30%',
        'Focus on technique over intensity',
        'Monitor recovery before increasing load',
      ],
      urgency: 'medium',
    }
  }
  
  // Constraint-based focus
  if (state.primaryConstraint && state.constraintConfidence !== 'low') {
    const suggestions = getSuggestionsForConstraint(state.primaryConstraint, state.primaryGoal)
    return {
      focusArea: state.primaryConstraint,
      focusLabel: state.constraintLabel,
      reason: `Your ${state.primaryGoalLabel} progress is currently limited by ${state.constraintLabel.toLowerCase()}.`,
      suggestions,
      urgency: state.constraintConfidence === 'high' ? 'high' : 'medium',
    }
  }
  
  // Plateau-based focus
  if (state.plateauStatus === 'plateau_detected') {
    return {
      focusArea: 'plateau',
      focusLabel: 'Break Through Plateau',
      reason: 'Performance has plateaued across multiple areas. Training stimulus needs adjustment.',
      suggestions: [
        'Introduce new exercise variations',
        'Adjust rep ranges and intensity',
        'Consider a brief deload followed by progressive overload',
      ],
      urgency: 'medium',
    }
  }
  
  // Readiness-based focus
  if (state.skillReadinessStatus === 'progress_now') {
    return {
      focusArea: 'progression',
      focusLabel: 'Ready to Progress',
      reason: 'You have strong ownership of your current level and are ready to attempt the next progression.',
      suggestions: [
        'Attempt next progression level',
        'Maintain current level density work',
        'Build confidence with micro-progressions',
      ],
      urgency: 'low',
    }
  }
  
  // Default: maintain current approach
  return {
    focusArea: 'maintenance',
    focusLabel: 'Continue Building',
    reason: 'No major issues detected. Continue with consistent training.',
    suggestions: [
      `Focus on ${state.primaryGoalLabel} skill density`,
      'Maintain strength training balance',
      'Track progress consistently',
    ],
    urgency: 'low',
  }
}

function getSuggestionsForConstraint(constraint: string, primaryGoal: string | null): string[] {
  const suggestions: Record<string, string[]> = {
    skill_density_deficit: [
      'Increase weekly skill exposure time',
      'Add more frequent, shorter skill sessions',
      'Focus on quality holds over quantity',
    ],
    pull_strength_deficit: [
      'Prioritize weighted pull-up progression',
      'Add horizontal pulling work (rows)',
      'Include scapular strength exercises',
    ],
    push_strength_deficit: [
      'Prioritize weighted dip progression',
      'Add pike push-up variations',
      'Include shoulder pressing work',
    ],
    horizontal_pull_neglect: [
      'Add front lever rows',
      'Include horizontal pulling variations',
      'Balance vertical and horizontal pulling',
    ],
    strength_imbalance: [
      'Address weaker movement pattern',
      'Increase volume on lagging area',
      'Maintain balanced push/pull ratio',
    ],
    fatigue_accumulation: [
      'Reduce total training volume',
      'Prioritize recovery this week',
      'Consider a light deload',
    ],
    recovery_deficit: [
      'Improve sleep quality and duration',
      'Reduce training frequency temporarily',
      'Focus on nutrition and hydration',
    ],
  }
  
  return suggestions[constraint] || [
    'Address the identified limiting factor',
    'Maintain consistent training',
    'Monitor progress and adjust',
  ]
}

// =============================================================================
// INSIGHT GENERATION
// =============================================================================

function generateEngineInsights(state: AthleteState): AthleteEngineInsight[] {
  const insights: AthleteEngineInsight[] = []
  
  // Momentum insight
  insights.push({
    type: 'momentum',
    title: 'Training Momentum',
    value: state.trainingMomentum.charAt(0).toUpperCase() + state.trainingMomentum.slice(1),
    explanation: getMomentumExplanation(state.trainingMomentum, state.momentumScore),
    significance: state.trainingMomentum === 'improving' ? 'positive' :
                  state.trainingMomentum === 'regressing' ? 'warning' : 'neutral',
  })
  
  // Plateau insight (if relevant)
  if (state.plateauStatus !== 'no_plateau') {
    insights.push({
      type: 'plateau',
      title: 'Plateau Status',
      value: state.plateauStatus === 'plateau_detected' ? 'Plateau Detected' : 'Possible Plateau',
      explanation: state.plateauStatus === 'plateau_detected'
        ? 'Performance has been flat across multiple areas. Consider varying your training approach.'
        : 'Some metrics are showing signs of stagnation. Monitor closely.',
      significance: 'attention',
    })
  }
  
  // Constraint insight (if relevant)
  if (state.primaryConstraint && state.constraintConfidence !== 'low') {
    insights.push({
      type: 'constraint',
      title: 'Primary Limiter',
      value: state.constraintLabel,
      explanation: `This is currently the biggest factor limiting your ${state.primaryGoalLabel} progress.`,
      significance: 'attention',
    })
  }
  
  // Recovery insight
  insights.push({
    type: 'recovery',
    title: 'Recovery State',
    value: state.recoveryLevel === 'HIGH' ? 'Fresh' : state.recoveryLevel === 'LOW' ? 'Fatigued' : 'Normal',
    explanation: getRecoveryExplanation(state.recoveryLevel, state.recoveryScore),
    significance: state.recoveryLevel === 'HIGH' ? 'positive' :
                  state.recoveryLevel === 'LOW' ? 'warning' : 'neutral',
  })
  
  // Consistency insight
  insights.push({
    type: 'consistency',
    title: 'Training Consistency',
    value: state.sessionConsistency >= 75 ? 'Excellent' :
           state.sessionConsistency >= 50 ? 'Good' :
           state.sessionConsistency >= 25 ? 'Moderate' : 'Low',
    explanation: `Averaging ${state.weeklyFrequency.toFixed(1)} sessions per week. ${
      state.sessionConsistency >= 75 ? 'This consistency drives long-term progress.' :
      state.sessionConsistency >= 50 ? 'Good baseline - more frequency would accelerate gains.' :
      'More consistent training would significantly improve results.'
    }`,
    significance: state.sessionConsistency >= 50 ? 'positive' : 'attention',
  })
  
  // Readiness insight (if applicable)
  if (state.skillReadinessStatus) {
    insights.push({
      type: 'readiness',
      title: 'Progression Readiness',
      value: formatReadinessStatus(state.skillReadinessStatus),
      explanation: getReadinessExplanation(state.skillReadinessStatus, state.skillReadinessConfidence),
      significance: state.skillReadinessStatus === 'progress_now' ? 'positive' :
                    state.skillReadinessStatus === 'stabilize' ? 'warning' : 'neutral',
    })
  }
  
  return insights
}

function getMomentumExplanation(momentum: MomentumState, score: number): string {
  switch (momentum) {
    case 'improving':
      return 'Your recent performance across strength and skill metrics is trending upward. Keep the current approach.'
    case 'stable':
      return 'Performance is holding steady. This can be a sign of consolidation or a plateau forming.'
    case 'plateauing':
      return 'Multiple metrics show flat progress. Consider introducing new training stimuli.'
    case 'regressing':
      return 'Recent trends show declining performance. Check recovery, sleep, and training load.'
  }
}

function getRecoveryExplanation(level: RecoveryLevel, score: number): string {
  switch (level) {
    case 'HIGH':
      return 'Recovery indicators are good. You have capacity for higher training loads.'
    case 'MODERATE':
      return 'Recovery is adequate for normal training. Monitor fatigue as the week progresses.'
    case 'LOW':
      return 'Recovery is compromised. Consider reducing intensity or taking extra rest.'
  }
}

function formatReadinessStatus(status: ReadinessStatus): string {
  switch (status) {
    case 'progress_now': return 'Ready to Progress'
    case 'micro_progress': return 'Micro-Progress Ready'
    case 'stay_current': return 'Building Foundation'
    case 'stabilize': return 'Needs Stabilization'
    default: return 'Unknown'
  }
}

function getReadinessExplanation(status: ReadinessStatus, confidence: number): string {
  switch (status) {
    case 'progress_now':
      return `Strong ownership of current level with good support strength. Ready to attempt the next progression.`
    case 'micro_progress':
      return `You're outperforming your current level but not fully ready for the next. A micro-progression is appropriate.`
    case 'stay_current':
      return `Continue building at your current level. More quality volume needed before advancing.`
    case 'stabilize':
      return `Recent performance decline suggests fatigue. Focus on recovery before pushing progression.`
    default:
      return 'Log more skill sessions to assess progression readiness.'
  }
}

// =============================================================================
// MAIN ENGINE FUNCTIONS
// =============================================================================

/**
 * Build the complete Athlete State model by synthesizing all tool outputs
 */
export function buildAthleteState(): AthleteState {
  // Gather all data
  const profile = getAthleteProfile()
  
  // [PHASE 16L] FIX: Handle null profile in server context
  // Return a safe default state instead of crashing
  if (!profile) {
    return {
      username: 'Athlete',
      experienceLevel: 'intermediate',
      primaryGoal: null,
      // [ADAPTIVE-ATHLETE-ENGINE-PRIMARY-SKILL-DROPPED] AthleteState
      // does not declare a `primarySkill` field — it was a legacy
      // companion field to `primaryGoal` that has since been folded
      // into the goal itself.
      currentLevel: null,
      targetLevel: null,
      momentumScore: 0,
      // [PLATEAU-STATUS-LITERAL-DRIFT] PlateauStatus is
      // 'no_plateau' | 'possible_plateau' | 'plateau_detected' — there
      // is no 'insufficient_data' value. Map to 'no_plateau' since
      // absence of evidence is the conservative no-plateau verdict.
      plateauStatus: 'no_plateau',
      strengthTrends: { pull: 'insufficient_data', push: 'insufficient_data' },
      readinessStatus: null,
      fatigueLevel: 'optimal',
      consistencyScore: 0,
      constraintFocus: { label: 'Insufficient Data', code: 'insufficient_data' },
      strengthSupport: 'unknown',
      state: {
        hasData: false,
        dataQuality: 'insufficient',
        isOptimal: false,
        needsDeload: false,
        hasSkillData: false,
        hasStrengthData: false,
      },
    }
  }
  
  const progressions = getSkillProgressions()
  const skillSessions = getSkillSessions()
  const strengthRecords = getStrengthRecords()
  const workoutLogs = getWorkoutLogs()
  const recovery = calculateRecoverySignal()
  const deload = assessDeloadNeed()
  const constraintResult = analyzeConstraints()
  
  // Find primary skill progression
  const primaryProgression = profile.primaryGoal
    ? progressions.find(p => p.skillName === profile.primaryGoal)
    : progressions[0]
  
  // Calculate derived states
  const { momentum, score: momentumScore } = calculateTrainingMomentum(
    strengthRecords,
    skillSessions,
    profile.primaryGoal
  )
  
  const plateauStatus = detectPlateauStatus(strengthRecords, skillSessions, profile.primaryGoal)
  const fatigueState = determineFatigueState(recovery, deload)
  const consistency = calculateConsistency()
  const dataQuality = assessDataQuality(profile, skillSessions, strengthRecords, workoutLogs)
  
  // Calculate strength trends
  const pullRecords = strengthRecords.filter(r => r.exercise === 'weighted_pull_up')
  const pushRecords = strengthRecords.filter(r => r.exercise === 'weighted_dip')
  const pullTrend = pullRecords.length >= 3 
    ? calculateStrengthTrend(pullRecords, 'weighted_pull_up').direction 
    : 'insufficient_data'
  const pushTrend = pushRecords.length >= 3 
    ? calculateStrengthTrend(pushRecords, 'weighted_dip').direction 
    : 'insufficient_data'
  
  // Calculate skill readiness (if applicable)
  let skillReadiness: ReadinessDecision | null = null
  if (primaryProgression && skillSessions.length > 0) {
    skillReadiness = calculateReadinessDecision(
      skillSessions,
      primaryProgression.skillName,
      primaryProgression.currentLevel,
      primaryProgression.targetLevel,
      strengthRecords,
      profile.bodyweight,
      profile.experienceLevel
    )
  }
  
  // Determine strength support level from constraint result
  let strengthSupportLevel: 'insufficient' | 'developing' | 'sufficient' | 'unknown' = 'unknown'
  if (constraintResult.primaryConstraint === 'pull_strength_deficit' ||
      constraintResult.primaryConstraint === 'push_strength_deficit') {
    strengthSupportLevel = 'insufficient'
  } else if (constraintResult.dataQuality !== 'insufficient' &&
             !constraintResult.primaryConstraint?.includes('strength')) {
    strengthSupportLevel = pullTrend === 'improving' || pushTrend === 'improving' 
      ? 'sufficient' : 'developing'
  }
  
  return {
    // Identity
    username: 'Athlete',
    experienceLevel: profile.experienceLevel,
    
    // Goals
    primaryGoal: profile.primaryGoal,
    primaryGoalLabel: getSkillLabel(profile.primaryGoal),
    currentSkillLevel: primaryProgression?.currentLevel ?? 0,
    targetSkillLevel: primaryProgression?.targetLevel ?? 0,
    
    // [limiter-truth] ISSUE A/D: Use canonical displayed-limiter for unified truth
    // This ensures AthleteIntelligenceCard and all other surfaces show the same limiter
    ...(() => {
      const canonical = deriveCanonicalDisplayedLimiter()
      // [limiter-truth] Log the canonical limiter being used
      console.log('[limiter-truth] buildAthleteState using canonical limiter:', {
        code: canonical.code,
        label: canonical.label,
        isLowHistory: canonical.isLowHistory,
        isFallback: canonical.isFallback,
      })
      // Don't show as primary constraint if low-history or insufficient data
      const shouldShowConstraint = !canonical.isLowHistory && 
                                   canonical.code !== 'insufficient_data' && 
                                   canonical.code !== 'no_primary_constraint' &&
                                   canonical.code !== 'early_calibration' &&
                                   canonical.code !== 'building_consistency'
      return {
        primaryConstraint: shouldShowConstraint ? canonical.code : null,
        constraintLabel: canonical.label,
        constraintConfidence: canonical.confidence,
      }
    })(),
    constraintCategory: constraintResult.category, // Keep for internal routing
    
    // Strength Support
    strengthSupportLevel,
    pullStrengthTrend: pullTrend,
    pushStrengthTrend: pushTrend,
    
    // Training State
    trainingMomentum: momentum,
    momentumScore,
    plateauStatus,
    fatigueState,
    recoveryLevel: recovery.level,
    recoveryScore: recovery.score,
    
    // Consistency
    sessionConsistency: consistency.score,
    weeklyFrequency: consistency.weeklyFrequency,
    recentWorkoutCount: consistency.recentCount,
    
    // Readiness
    skillReadinessStatus: skillReadiness?.status ?? null,
    skillReadinessConfidence: skillReadiness?.confidence ?? 0,
    
    // Deload
    deloadStatus: deload.status,
    deloadScore: deload.score,
    
    // Meta
    dataQuality,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get the complete Athlete Engine snapshot with state, focus, and insights
 */
export function getAthleteEngineSnapshot(): AthleteEngineSnapshot {
  const state = buildAthleteState()
  const primaryFocus = determinePrimaryFocus(state)
  const insights = generateEngineInsights(state)
  
  // Find top insight (prioritize warnings, then attention, then positive)
  const warningInsights = insights.filter(i => i.significance === 'warning')
  const attentionInsights = insights.filter(i => i.significance === 'attention')
  const positiveInsights = insights.filter(i => i.significance === 'positive')
  
  const topInsight = warningInsights[0] || attentionInsights[0] || positiveInsights[0] || null
  
  // Generate recommendations
  const recommendations = generateRecommendations(state, primaryFocus)
  
  return {
    state,
    primaryFocus,
    insights,
    topInsight,
    recommendations,
    hasData: state.dataQuality !== 'insufficient',
  }
}

function generateRecommendations(state: AthleteState, focus: PrimaryFocusOutput): string[] {
  const recommendations: string[] = []
  
  // Always include focus suggestions
  recommendations.push(...focus.suggestions.slice(0, 2))
  
  // Add context-specific recommendations
  if (state.plateauStatus === 'plateau_detected' && focus.focusArea !== 'plateau') {
    recommendations.push('Consider varying your training approach to break through the plateau')
  }
  
  if (state.sessionConsistency < 50 && focus.focusArea !== 'recovery') {
    recommendations.push('Increase training consistency to accelerate progress')
  }
  
  if (state.skillReadinessStatus === 'progress_now' && focus.focusArea !== 'progression') {
    recommendations.push('You are ready to attempt the next skill progression')
  }
  
  return recommendations.slice(0, 4)
}

/**
 * Get a quick summary for dashboard widgets
 */
export function getQuickEngineStatus(): {
  momentum: MomentumState
  momentumLabel: string
  focusArea: string
  focusLabel: string
  hasData: boolean
  topConcern: string | null
} {
  const snapshot = getAthleteEngineSnapshot()
  
  return {
    momentum: snapshot.state.trainingMomentum,
    momentumLabel: snapshot.state.trainingMomentum.charAt(0).toUpperCase() + 
                   snapshot.state.trainingMomentum.slice(1),
    focusArea: snapshot.primaryFocus.focusArea,
    focusLabel: snapshot.primaryFocus.focusLabel,
    hasData: snapshot.hasData,
    topConcern: snapshot.topInsight?.significance === 'warning' ||
                snapshot.topInsight?.significance === 'attention'
      ? snapshot.topInsight.value
      : null,
  }
}

/**
 * Get program builder context from the engine state
 */
export function getProgramBuilderContext(): {
  primaryConstraint: string | null
  constraintLabel: string
  plateauStatus: PlateauStatus
  strengthSupportLevel: string
  recoveryState: FatigueState
  recommendations: string[]
} {
  const state = buildAthleteState()
  const focus = determinePrimaryFocus(state)
  
  return {
    primaryConstraint: state.primaryConstraint,
    constraintLabel: state.constraintLabel,
    plateauStatus: state.plateauStatus,
    strengthSupportLevel: state.strengthSupportLevel,
    recoveryState: state.fatigueState,
    recommendations: focus.suggestions,
  }
}

/**
 * Get skill tracker context from the engine state
 */
export function getSkillTrackerContext(): {
  shouldDelayProgression: boolean
  delayReason: string | null
  readinessBoost: boolean
  boostReason: string | null
} {
  const state = buildAthleteState()
  
  // Delay progression if fatigued
  const shouldDelay = state.fatigueState === 'fatigued' || 
                      state.fatigueState === 'overtrained' ||
                      state.deloadStatus === 'deload_recommended'
  
  // Boost if momentum is improving and fresh
  const shouldBoost = state.trainingMomentum === 'improving' &&
                      state.fatigueState === 'fresh' &&
                      state.skillReadinessStatus === 'progress_now'
  
  return {
    shouldDelayProgression: shouldDelay,
    delayReason: shouldDelay 
      ? 'High fatigue detected. Focus on recovery before attempting progression.'
      : null,
    readinessBoost: shouldBoost,
    boostReason: shouldBoost
      ? 'Strong momentum and fresh recovery state support progression attempts.'
      : null,
  }
}
