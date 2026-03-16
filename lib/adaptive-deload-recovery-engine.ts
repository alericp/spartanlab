/**
 * Adaptive Deload & Recovery Phase Engine
 * 
 * Intelligently detects when athletes need recovery phases and manages 
 * transitions between training and recovery states. Uses multiple signal
 * sources to make confident decisions that feel like professional coaching.
 * 
 * CORE PRINCIPLE: Deloads and recovery phases are intelligent tools, not failures.
 * They preserve tendon health, restore performance, and improve long-term progress.
 * 
 * INTEGRATION POINTS:
 * - Skill Fatigue & Volume Governor (stress accumulation)
 * - TrainingCycle Engine (cycle phase context)
 * - Performance Envelope (athlete-specific limits)
 * - Weak Point Detection (limiter severity trends)
 * - Readiness Engine (daily readiness trends)
 * - Benchmark Engine (performance stagnation detection)
 * - Program Builder (session adjustments)
 * - Warm-Up Intelligence (increased prep during recovery)
 */

import type { SkillGraphId } from './skill-progression-graph-engine'
import type { WeakPointType } from './weak-point-engine'

// =============================================================================
// CORE TYPES
// =============================================================================

export type RecoveryPhaseType =
  | 'light_deload'           // Slightly reduced volume, moderate intensity preserved
  | 'tendon_recovery'        // Reduced straight-arm/ring stress, increased prep
  | 'volume_reset'           // Lower total weekly volume, maintain movement quality
  | 'technique_recovery'     // Lower fatigue, maintain skill touch at easier intensity
  | 'fatigue_management'     // Broader workload reduction due to global fatigue
  | 'plateau_break'          // Strategic reduction before new progression push

export type RecoveryPhaseStatus = 'planned' | 'active' | 'completed' | 'cancelled'

export type TriggerSource =
  | 'readiness_decline'
  | 'benchmark_stagnation'
  | 'performance_regression'
  | 'stress_accumulation'
  | 'governor_escalation'
  | 'tendon_risk'
  | 'skill_quality_decline'
  | 'consecutive_hard_days'
  | 'cycle_scheduled'
  | 'manual_request'

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'volatile'

export interface RecoveryPhase {
  recoveryPhaseId: string
  athleteId: string
  phaseType: RecoveryPhaseType
  triggerReasons: TriggerSource[]
  startDate: string
  expectedDurationDays: number
  actualEndDate?: string
  status: RecoveryPhaseStatus
  
  // Trend data at trigger time
  fatigueTrend: TrendDirection
  tendonStressTrend: TrendDirection
  readinessTrend: TrendDirection
  performanceTrend: TrendDirection
  
  // Confidence and context
  confidenceScore: number // 0-100
  triggerSignalCount: number
  primaryTrigger: TriggerSource
  cycleContext?: string
  
  // Adjustments applied
  adjustments: RecoveryPhaseAdjustments
  
  // Outcome tracking
  outcomeNotes?: string
  wasEffective?: boolean
}

export interface RecoveryPhaseAdjustments {
  volumeReductionPercent: number // 0-60
  intensityReductionPercent: number // 0-40
  progressionFreeze: boolean
  straightArmStressReduction: number // 0-80
  ringStressReduction: number // 0-80
  preservedSkillTouchpoints: SkillGraphId[]
  increasedPrepWork: boolean
  accessoryEmphasis: 'maintain' | 'reduce' | 'remove'
  densityFormatAllowed: boolean
}

// =============================================================================
// TRIGGER SIGNAL TYPES
// =============================================================================

export interface TriggerSignal {
  source: TriggerSource
  weight: number // 0-10, higher = more significant
  present: boolean
  severity: 'low' | 'moderate' | 'high' | 'severe'
  description: string
  dataPoints: number // How many data points support this signal
}

export interface RecoveryTriggerAssessment {
  shouldTriggerRecovery: boolean
  recommendedPhaseType: RecoveryPhaseType | null
  confidenceScore: number
  activeSignals: TriggerSignal[]
  totalSignalWeight: number
  primaryTrigger: TriggerSource | null
  explanation: string
  urgency: 'none' | 'suggested' | 'recommended' | 'required'
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface RecoveryAssessmentInput {
  // Readiness data
  currentReadinessScore: number // 0-100
  readinessHistory: { date: string; score: number }[]
  
  // Benchmark data
  benchmarkTrend: TrendDirection
  daysSinceLastPR: number
  recentBenchmarkFailures: number
  
  // Governor data
  weeklyStressScores: {
    straightArmPull: number
    straightArmPush: number
    ringSupport: number
    explosivePull: number
    compressionCore: number
  }
  governorEscalationCount: number // Times governor capped volume this week
  
  // Fatigue data
  consecutiveHighFatigueDays: number
  fatigueScore: number // 0-100
  fatigueTrend: TrendDirection
  
  // Tendon/joint data
  tendonStressLevel: 'low' | 'moderate' | 'high' | 'very_high'
  activeJointConcerns: string[]
  
  // Performance quality
  skillQualityTrend: TrendDirection
  recentFailedProgressionAttempts: number
  
  // Cycle context
  currentCyclePhase?: string
  weekInCycle?: number
  daysSinceLastDeload?: number
  
  // Envelope data
  envelopeUtilization: number // 0-100, how close to limits
  
  // Style context
  trainingStylePreference?: string
  athleteExperienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

// =============================================================================
// SIGNAL DETECTION FUNCTIONS
// =============================================================================

function detectReadinessDecline(input: RecoveryAssessmentInput): TriggerSignal {
  const { currentReadinessScore, readinessHistory } = input
  
  // Need at least 5 data points for trend
  if (readinessHistory.length < 5) {
    return {
      source: 'readiness_decline',
      weight: 0,
      present: false,
      severity: 'low',
      description: 'Insufficient readiness data',
      dataPoints: readinessHistory.length,
    }
  }
  
  // Calculate recent average vs older average
  const recent = readinessHistory.slice(-5)
  const older = readinessHistory.slice(-10, -5)
  
  const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length
  const olderAvg = older.length > 0 
    ? older.reduce((sum, r) => sum + r.score, 0) / older.length
    : recentAvg
  
  const decline = olderAvg - recentAvg
  const isCurrentlyLow = currentReadinessScore < 50
  
  // Determine severity based on decline magnitude and current state
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  if (decline >= 20 && isCurrentlyLow) {
    severity = 'severe'
    weight = 9
    present = true
  } else if (decline >= 15 || (decline >= 10 && isCurrentlyLow)) {
    severity = 'high'
    weight = 7
    present = true
  } else if (decline >= 10) {
    severity = 'moderate'
    weight = 5
    present = true
  } else if (decline >= 5 && isCurrentlyLow) {
    severity = 'low'
    weight = 3
    present = true
  }
  
  return {
    source: 'readiness_decline',
    weight,
    present,
    severity,
    description: present 
      ? `Readiness declined ${decline.toFixed(0)} points over recent sessions (current: ${currentReadinessScore})`
      : 'Readiness stable or improving',
    dataPoints: readinessHistory.length,
  }
}

function detectBenchmarkStagnation(input: RecoveryAssessmentInput): TriggerSignal {
  const { benchmarkTrend, daysSinceLastPR, recentBenchmarkFailures } = input
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  // Stagnation signals
  if (benchmarkTrend === 'declining' && daysSinceLastPR > 21) {
    severity = 'severe'
    weight = 8
    present = true
  } else if (daysSinceLastPR > 28 && recentBenchmarkFailures >= 2) {
    severity = 'high'
    weight = 7
    present = true
  } else if (daysSinceLastPR > 21 || recentBenchmarkFailures >= 3) {
    severity = 'moderate'
    weight = 5
    present = true
  } else if (daysSinceLastPR > 14 && benchmarkTrend === 'stable') {
    severity = 'low'
    weight = 3
    present = true
  }
  
  return {
    source: 'benchmark_stagnation',
    weight,
    present,
    severity,
    description: present
      ? `No benchmark progress in ${daysSinceLastPR} days (${recentBenchmarkFailures} recent failures)`
      : 'Benchmark progress on track',
    dataPoints: Math.min(daysSinceLastPR, 30),
  }
}

function detectStressAccumulation(input: RecoveryAssessmentInput): TriggerSignal {
  const { weeklyStressScores, governorEscalationCount } = input
  
  // Calculate total stress across movement families
  const totalStress = 
    weeklyStressScores.straightArmPull +
    weeklyStressScores.straightArmPush +
    weeklyStressScores.ringSupport +
    weeklyStressScores.explosivePull +
    weeklyStressScores.compressionCore
  
  // Check for high stress in specific areas
  const highStressAreas = [
    weeklyStressScores.straightArmPull > 70,
    weeklyStressScores.straightArmPush > 70,
    weeklyStressScores.ringSupport > 60,
  ].filter(Boolean).length
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  if (totalStress > 300 || highStressAreas >= 2 || governorEscalationCount >= 4) {
    severity = 'severe'
    weight = 9
    present = true
  } else if (totalStress > 250 || highStressAreas >= 1 || governorEscalationCount >= 3) {
    severity = 'high'
    weight = 7
    present = true
  } else if (totalStress > 200 || governorEscalationCount >= 2) {
    severity = 'moderate'
    weight = 5
    present = true
  } else if (totalStress > 150) {
    severity = 'low'
    weight = 2
    present = true
  }
  
  return {
    source: 'stress_accumulation',
    weight,
    present,
    severity,
    description: present
      ? `Weekly stress score: ${totalStress} (${highStressAreas} high-stress areas, ${governorEscalationCount} governor caps)`
      : 'Stress accumulation within normal range',
    dataPoints: 5,
  }
}

function detectGovernorEscalation(input: RecoveryAssessmentInput): TriggerSignal {
  const { governorEscalationCount, envelopeUtilization } = input
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  // Governor repeatedly intervening indicates systemic overload
  if (governorEscalationCount >= 5 || (governorEscalationCount >= 3 && envelopeUtilization > 90)) {
    severity = 'severe'
    weight = 8
    present = true
  } else if (governorEscalationCount >= 4 || (governorEscalationCount >= 2 && envelopeUtilization > 85)) {
    severity = 'high'
    weight = 6
    present = true
  } else if (governorEscalationCount >= 3) {
    severity = 'moderate'
    weight = 4
    present = true
  }
  
  return {
    source: 'governor_escalation',
    weight,
    present,
    severity,
    description: present
      ? `Volume governor intervened ${governorEscalationCount} times (envelope at ${envelopeUtilization}%)`
      : 'Volume governor within normal operation',
    dataPoints: governorEscalationCount,
  }
}

function detectTendonRisk(input: RecoveryAssessmentInput): TriggerSignal {
  const { tendonStressLevel, activeJointConcerns, weeklyStressScores } = input
  
  const highStraightArmStress = 
    weeklyStressScores.straightArmPull > 60 || 
    weeklyStressScores.straightArmPush > 60 ||
    weeklyStressScores.ringSupport > 50
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  if (tendonStressLevel === 'very_high' || (tendonStressLevel === 'high' && activeJointConcerns.length >= 2)) {
    severity = 'severe'
    weight = 9
    present = true
  } else if (tendonStressLevel === 'high' || (tendonStressLevel === 'moderate' && highStraightArmStress)) {
    severity = 'high'
    weight = 7
    present = true
  } else if (tendonStressLevel === 'moderate' && activeJointConcerns.length >= 1) {
    severity = 'moderate'
    weight = 5
    present = true
  }
  
  return {
    source: 'tendon_risk',
    weight,
    present,
    severity,
    description: present
      ? `Tendon stress: ${tendonStressLevel} (${activeJointConcerns.length} joint concerns active)`
      : 'Tendon stress within safe range',
    dataPoints: activeJointConcerns.length + 1,
  }
}

function detectSkillQualityDecline(input: RecoveryAssessmentInput): TriggerSignal {
  const { skillQualityTrend, recentFailedProgressionAttempts, fatigueScore } = input
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  if (skillQualityTrend === 'declining' && recentFailedProgressionAttempts >= 3) {
    severity = 'severe'
    weight = 7
    present = true
  } else if (skillQualityTrend === 'declining' || (recentFailedProgressionAttempts >= 2 && fatigueScore > 70)) {
    severity = 'high'
    weight = 6
    present = true
  } else if (recentFailedProgressionAttempts >= 2) {
    severity = 'moderate'
    weight = 4
    present = true
  }
  
  return {
    source: 'skill_quality_decline',
    weight,
    present,
    severity,
    description: present
      ? `Skill quality ${skillQualityTrend}, ${recentFailedProgressionAttempts} failed progression attempts`
      : 'Skill quality maintained',
    dataPoints: recentFailedProgressionAttempts + 1,
  }
}

function detectConsecutiveHardDays(input: RecoveryAssessmentInput): TriggerSignal {
  const { consecutiveHighFatigueDays, fatigueScore, fatigueTrend } = input
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low'
  let weight = 0
  let present = false
  
  if (consecutiveHighFatigueDays >= 5 || (consecutiveHighFatigueDays >= 3 && fatigueScore > 80)) {
    severity = 'severe'
    weight = 8
    present = true
  } else if (consecutiveHighFatigueDays >= 4 || (consecutiveHighFatigueDays >= 3 && fatigueTrend === 'declining')) {
    severity = 'high'
    weight = 6
    present = true
  } else if (consecutiveHighFatigueDays >= 3) {
    severity = 'moderate'
    weight = 4
    present = true
  }
  
  return {
    source: 'consecutive_hard_days',
    weight,
    present,
    severity,
    description: present
      ? `${consecutiveHighFatigueDays} consecutive high-fatigue days (current fatigue: ${fatigueScore})`
      : 'Training load distributed appropriately',
    dataPoints: consecutiveHighFatigueDays,
  }
}

// =============================================================================
// MAIN ASSESSMENT FUNCTION
// =============================================================================

/**
 * Assess whether a recovery phase should be triggered based on multiple signals
 * Requires multiple supporting signals unless risk is severe
 */
export function assessRecoveryNeed(input: RecoveryAssessmentInput): RecoveryTriggerAssessment {
  // Collect all signals
  const signals: TriggerSignal[] = [
    detectReadinessDecline(input),
    detectBenchmarkStagnation(input),
    detectStressAccumulation(input),
    detectGovernorEscalation(input),
    detectTendonRisk(input),
    detectSkillQualityDecline(input),
    detectConsecutiveHardDays(input),
  ]
  
  // Filter to active signals
  const activeSignals = signals.filter(s => s.present)
  const totalWeight = activeSignals.reduce((sum, s) => sum + s.weight, 0)
  
  // Find primary trigger (highest weight)
  const primarySignal = activeSignals.length > 0
    ? activeSignals.reduce((max, s) => s.weight > max.weight ? s : max)
    : null
  
  // Determine if we should trigger recovery
  // Require multiple signals OR one severe signal
  const hasSevereSignal = activeSignals.some(s => s.severity === 'severe')
  const hasMultipleHighSignals = activeSignals.filter(s => s.severity === 'high' || s.severity === 'severe').length >= 2
  const hasSignificantWeight = totalWeight >= 15
  
  const shouldTrigger = hasSevereSignal || hasMultipleHighSignals || hasSignificantWeight
  
  // Calculate confidence
  let confidence = 0
  if (activeSignals.length >= 4) confidence += 30
  else if (activeSignals.length >= 2) confidence += 20
  else if (activeSignals.length >= 1) confidence += 10
  
  if (hasSevereSignal) confidence += 35
  else if (hasMultipleHighSignals) confidence += 25
  
  confidence += Math.min(totalWeight * 2, 35)
  confidence = Math.min(confidence, 100)
  
  // Determine recommended phase type
  let recommendedType: RecoveryPhaseType | null = null
  let urgency: 'none' | 'suggested' | 'recommended' | 'required' = 'none'
  
  if (shouldTrigger) {
    // Determine phase type based on primary signals
    const tendonSignal = activeSignals.find(s => s.source === 'tendon_risk')
    const stressSignal = activeSignals.find(s => s.source === 'stress_accumulation')
    const qualitySignal = activeSignals.find(s => s.source === 'skill_quality_decline')
    const fatigueSignal = activeSignals.find(s => s.source === 'consecutive_hard_days')
    const benchmarkSignal = activeSignals.find(s => s.source === 'benchmark_stagnation')
    
    if (tendonSignal && tendonSignal.severity === 'severe') {
      recommendedType = 'tendon_recovery'
      urgency = 'required'
    } else if (tendonSignal && (tendonSignal.severity === 'high' || tendonSignal.severity === 'moderate')) {
      recommendedType = 'tendon_recovery'
      urgency = 'recommended'
    } else if (fatigueSignal && fatigueSignal.severity === 'severe') {
      recommendedType = 'fatigue_management'
      urgency = 'required'
    } else if (stressSignal && stressSignal.severity === 'severe') {
      recommendedType = 'volume_reset'
      urgency = 'recommended'
    } else if (qualitySignal && qualitySignal.present) {
      recommendedType = 'technique_recovery'
      urgency = 'recommended'
    } else if (benchmarkSignal && benchmarkSignal.severity === 'high') {
      recommendedType = 'plateau_break'
      urgency = 'suggested'
    } else if (totalWeight >= 12) {
      recommendedType = 'light_deload'
      urgency = 'suggested'
    } else {
      recommendedType = 'light_deload'
      urgency = 'suggested'
    }
  }
  
  // Generate explanation
  const explanation = generateAssessmentExplanation(activeSignals, shouldTrigger, recommendedType)
  
  return {
    shouldTriggerRecovery: shouldTrigger,
    recommendedPhaseType: recommendedType,
    confidenceScore: confidence,
    activeSignals,
    totalSignalWeight: totalWeight,
    primaryTrigger: primarySignal?.source || null,
    explanation,
    urgency,
  }
}

function generateAssessmentExplanation(
  signals: TriggerSignal[],
  shouldTrigger: boolean,
  phaseType: RecoveryPhaseType | null
): string {
  if (!shouldTrigger) {
    return 'Training load is sustainable. Continue with planned programming.'
  }
  
  const topSignals = signals
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(s => s.description)
  
  const phaseDescriptions: Record<RecoveryPhaseType, string> = {
    light_deload: 'A light deload phase is recommended to restore training capacity.',
    tendon_recovery: 'A tendon-focused recovery phase is recommended to protect connective tissue.',
    volume_reset: 'A volume reset phase is recommended to allow accumulated fatigue to dissipate.',
    technique_recovery: 'A technique-focused phase is recommended to restore movement quality.',
    fatigue_management: 'A fatigue management phase is needed to prevent overtraining.',
    plateau_break: 'A strategic reduction is recommended before attempting new progression.',
  }
  
  return `${phaseDescriptions[phaseType!]} Key factors: ${topSignals.join('; ')}.`
}

// =============================================================================
// RECOVERY PHASE ADJUSTMENTS
// =============================================================================

/**
 * Generate specific adjustments for a recovery phase type
 */
export function generatePhaseAdjustments(
  phaseType: RecoveryPhaseType,
  input: RecoveryAssessmentInput,
  preserveSkills: SkillGraphId[] = []
): RecoveryPhaseAdjustments {
  const baseAdjustments: Record<RecoveryPhaseType, RecoveryPhaseAdjustments> = {
    light_deload: {
      volumeReductionPercent: 30,
      intensityReductionPercent: 10,
      progressionFreeze: false,
      straightArmStressReduction: 20,
      ringStressReduction: 20,
      preservedSkillTouchpoints: preserveSkills,
      increasedPrepWork: false,
      accessoryEmphasis: 'reduce',
      densityFormatAllowed: true,
    },
    tendon_recovery: {
      volumeReductionPercent: 40,
      intensityReductionPercent: 20,
      progressionFreeze: true,
      straightArmStressReduction: 60,
      ringStressReduction: 70,
      preservedSkillTouchpoints: preserveSkills,
      increasedPrepWork: true,
      accessoryEmphasis: 'reduce',
      densityFormatAllowed: false,
    },
    volume_reset: {
      volumeReductionPercent: 50,
      intensityReductionPercent: 15,
      progressionFreeze: true,
      straightArmStressReduction: 40,
      ringStressReduction: 40,
      preservedSkillTouchpoints: preserveSkills,
      increasedPrepWork: true,
      accessoryEmphasis: 'reduce',
      densityFormatAllowed: true,
    },
    technique_recovery: {
      volumeReductionPercent: 35,
      intensityReductionPercent: 25,
      progressionFreeze: false,
      straightArmStressReduction: 30,
      ringStressReduction: 30,
      preservedSkillTouchpoints: preserveSkills,
      increasedPrepWork: false,
      accessoryEmphasis: 'maintain',
      densityFormatAllowed: true,
    },
    fatigue_management: {
      volumeReductionPercent: 45,
      intensityReductionPercent: 20,
      progressionFreeze: true,
      straightArmStressReduction: 50,
      ringStressReduction: 50,
      preservedSkillTouchpoints: preserveSkills,
      increasedPrepWork: true,
      accessoryEmphasis: 'remove',
      densityFormatAllowed: false,
    },
    plateau_break: {
      volumeReductionPercent: 40,
      intensityReductionPercent: 15,
      progressionFreeze: true,
      straightArmStressReduction: 30,
      ringStressReduction: 30,
      preservedSkillTouchpoints: preserveSkills,
      increasedPrepWork: false,
      accessoryEmphasis: 'reduce',
      densityFormatAllowed: true,
    },
  }
  
  const adjustments = { ...baseAdjustments[phaseType] }
  
  // Modify based on athlete experience level
  if (input.athleteExperienceLevel === 'beginner') {
    adjustments.volumeReductionPercent = Math.min(adjustments.volumeReductionPercent + 10, 60)
    adjustments.progressionFreeze = true
  } else if (input.athleteExperienceLevel === 'advanced') {
    // Advanced athletes may handle slightly less reduction
    adjustments.volumeReductionPercent = Math.max(adjustments.volumeReductionPercent - 5, 20)
  }
  
  // If tendon concerns are present, increase straight-arm reduction
  if (input.tendonStressLevel === 'very_high') {
    adjustments.straightArmStressReduction = Math.min(adjustments.straightArmStressReduction + 20, 80)
    adjustments.ringStressReduction = Math.min(adjustments.ringStressReduction + 20, 80)
    adjustments.densityFormatAllowed = false
  }
  
  // If envelope utilization is very high, be more aggressive
  if (input.envelopeUtilization > 90) {
    adjustments.volumeReductionPercent = Math.min(adjustments.volumeReductionPercent + 10, 60)
  }
  
  return adjustments
}

// =============================================================================
// PHASE DURATION CALCULATION
// =============================================================================

/**
 * Calculate appropriate duration for a recovery phase
 */
export function calculatePhaseDuration(
  phaseType: RecoveryPhaseType,
  input: RecoveryAssessmentInput
): number {
  const baseDurations: Record<RecoveryPhaseType, number> = {
    light_deload: 5,
    tendon_recovery: 10,
    volume_reset: 7,
    technique_recovery: 5,
    fatigue_management: 7,
    plateau_break: 7,
  }
  
  let duration = baseDurations[phaseType]
  
  // Extend if signals are severe
  if (input.tendonStressLevel === 'very_high') {
    duration += 3
  }
  
  if (input.consecutiveHighFatigueDays >= 5) {
    duration += 2
  }
  
  // Beginners may need longer recovery
  if (input.athleteExperienceLevel === 'beginner') {
    duration += 2
  }
  
  // Cap at reasonable maximum
  return Math.min(duration, 14)
}

// =============================================================================
// PROGRAM BUILDER INTEGRATION
// =============================================================================

export interface SessionRecoveryAdjustment {
  category: 'volume' | 'intensity' | 'exercise_selection' | 'structure' | 'prep_work'
  description: string
  originalValue?: string
  adjustedValue?: string
}

/**
 * Apply recovery phase adjustments to a session plan
 */
export function applyRecoveryAdjustmentsToSession(
  adjustments: RecoveryPhaseAdjustments,
  sessionPlan: {
    totalSets: number
    mainSkillSets: number
    accessorySets: number
    straightArmSets: number
    ringSets: number
    densityBlocksPlanned: number
    targetRPE: number
  }
): {
  adjustedPlan: typeof sessionPlan
  appliedAdjustments: SessionRecoveryAdjustment[]
} {
  const applied: SessionRecoveryAdjustment[] = []
  const adjusted = { ...sessionPlan }
  
  // Volume reduction
  if (adjustments.volumeReductionPercent > 0) {
    const reduction = adjustments.volumeReductionPercent / 100
    adjusted.totalSets = Math.round(sessionPlan.totalSets * (1 - reduction))
    applied.push({
      category: 'volume',
      description: `Total sets reduced by ${adjustments.volumeReductionPercent}%`,
      originalValue: `${sessionPlan.totalSets} sets`,
      adjustedValue: `${adjusted.totalSets} sets`,
    })
  }
  
  // Intensity reduction
  if (adjustments.intensityReductionPercent > 0) {
    const rpeReduction = adjustments.intensityReductionPercent / 10 // Convert to RPE scale
    adjusted.targetRPE = Math.max(sessionPlan.targetRPE - rpeReduction, 6)
    applied.push({
      category: 'intensity',
      description: `Target RPE reduced`,
      originalValue: `RPE ${sessionPlan.targetRPE}`,
      adjustedValue: `RPE ${adjusted.targetRPE.toFixed(1)}`,
    })
  }
  
  // Straight-arm stress reduction
  if (adjustments.straightArmStressReduction > 0) {
    const reduction = adjustments.straightArmStressReduction / 100
    adjusted.straightArmSets = Math.round(sessionPlan.straightArmSets * (1 - reduction))
    applied.push({
      category: 'exercise_selection',
      description: `Straight-arm work reduced for tendon recovery`,
      originalValue: `${sessionPlan.straightArmSets} straight-arm sets`,
      adjustedValue: `${adjusted.straightArmSets} straight-arm sets`,
    })
  }
  
  // Ring stress reduction
  if (adjustments.ringStressReduction > 0) {
    const reduction = adjustments.ringStressReduction / 100
    adjusted.ringSets = Math.round(sessionPlan.ringSets * (1 - reduction))
    applied.push({
      category: 'exercise_selection',
      description: `Ring work reduced for joint recovery`,
      originalValue: `${sessionPlan.ringSets} ring sets`,
      adjustedValue: `${adjusted.ringSets} ring sets`,
    })
  }
  
  // Accessory handling
  if (adjustments.accessoryEmphasis === 'remove') {
    adjusted.accessorySets = 0
    applied.push({
      category: 'volume',
      description: 'Accessory work removed during recovery phase',
      originalValue: `${sessionPlan.accessorySets} accessory sets`,
      adjustedValue: '0 accessory sets',
    })
  } else if (adjustments.accessoryEmphasis === 'reduce') {
    adjusted.accessorySets = Math.round(sessionPlan.accessorySets * 0.5)
    applied.push({
      category: 'volume',
      description: 'Accessory volume reduced',
      originalValue: `${sessionPlan.accessorySets} accessory sets`,
      adjustedValue: `${adjusted.accessorySets} accessory sets`,
    })
  }
  
  // Density format handling
  if (!adjustments.densityFormatAllowed && sessionPlan.densityBlocksPlanned > 0) {
    adjusted.densityBlocksPlanned = 0
    applied.push({
      category: 'structure',
      description: 'Density blocks replaced with standard structure',
      originalValue: `${sessionPlan.densityBlocksPlanned} density blocks`,
      adjustedValue: 'Standard structure',
    })
  }
  
  // Prep work increase
  if (adjustments.increasedPrepWork) {
    applied.push({
      category: 'prep_work',
      description: 'Increased joint prep and activation work added',
    })
  }
  
  return { adjustedPlan: adjusted, appliedAdjustments: applied }
}

// =============================================================================
// COACHING EXPLANATIONS
// =============================================================================

export interface RecoveryPhaseExplanation {
  headline: string
  rationale: string
  whatToExpect: string[]
  whatIsPreserved: string[]
  durationMessage: string
  encouragement: string
}

/**
 * Generate athlete-facing explanation for a recovery phase
 */
export function generateRecoveryPhaseExplanation(
  phase: RecoveryPhase,
  adjustments: RecoveryPhaseAdjustments
): RecoveryPhaseExplanation {
  const typeDescriptions: Record<RecoveryPhaseType, { headline: string; rationale: string }> = {
    light_deload: {
      headline: 'Light Recovery Phase',
      rationale: 'Your training has shifted into a light recovery phase to consolidate recent work and restore training capacity.',
    },
    tendon_recovery: {
      headline: 'Tendon-Focused Recovery',
      rationale: 'This phase prioritizes tendon health by reducing straight-arm and high-stress work while maintaining skill touch.',
    },
    volume_reset: {
      headline: 'Volume Reset Phase',
      rationale: 'Training volume has been reduced to allow accumulated fatigue to dissipate before your next progression push.',
    },
    technique_recovery: {
      headline: 'Technique-Focused Phase',
      rationale: 'A lighter phase focused on movement quality, allowing you to refine technique without fatigue interference.',
    },
    fatigue_management: {
      headline: 'Recovery-Focused Phase',
      rationale: 'Training load has been reduced to restore energy systems and support long-term progress.',
    },
    plateau_break: {
      headline: 'Strategic Recovery Phase',
      rationale: 'This planned reduction prepares your body for renewed progression attempts.',
    },
  }
  
  const { headline, rationale } = typeDescriptions[phase.phaseType]
  
  // What to expect
  const whatToExpect: string[] = []
  if (adjustments.volumeReductionPercent >= 40) {
    whatToExpect.push('Noticeably lighter training load')
  } else if (adjustments.volumeReductionPercent >= 20) {
    whatToExpect.push('Moderately reduced training volume')
  }
  
  if (adjustments.straightArmStressReduction >= 50) {
    whatToExpect.push('Reduced straight-arm work to protect tendons')
  }
  
  if (adjustments.increasedPrepWork) {
    whatToExpect.push('More focus on preparation and mobility work')
  }
  
  if (adjustments.progressionFreeze) {
    whatToExpect.push('Progression held at current level')
  }
  
  // What is preserved
  const whatIsPreserved: string[] = []
  if (adjustments.preservedSkillTouchpoints.length > 0) {
    whatIsPreserved.push(`Low-dose practice for ${adjustments.preservedSkillTouchpoints.slice(0, 2).join(' and ')}`)
  }
  whatIsPreserved.push('Core movement patterns and motor learning')
  
  if (adjustments.accessoryEmphasis !== 'remove') {
    whatIsPreserved.push('Supporting exercises to maintain balance')
  }
  
  // Duration message
  const durationMessage = `This phase is planned for ${phase.expectedDurationDays} days. Your training will return to normal progression afterward.`
  
  // Encouragement
  const encouragements = [
    'This is a normal and important part of sustainable progress.',
    'Recovery phases are how real progress happens over time.',
    'Think of this as preparation for your next breakthrough.',
    'Your body will thank you for this strategic pause.',
  ]
  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]
  
  return {
    headline,
    rationale,
    whatToExpect,
    whatIsPreserved,
    durationMessage,
    encouragement,
  }
}

/**
 * Generate short coach-style messages for UI display
 */
export function generateRecoveryCoachMessage(phase: RecoveryPhase): string {
  const messages: Record<RecoveryPhaseType, string[]> = {
    light_deload: [
      'Training shifted into a light recovery phase to preserve progress.',
      'A brief deload phase supports long-term training quality.',
    ],
    tendon_recovery: [
      'Straight-arm stress reduced to support tendon recovery.',
      'Tendon-focused recovery phase active to protect connective tissue.',
    ],
    volume_reset: [
      'Volume reset in progress to restore training capacity.',
      'Strategic volume reduction supports sustainable progress.',
    ],
    technique_recovery: [
      'Lighter technique-focused phase to restore movement quality.',
      'Focus on quality over quantity this phase.',
    ],
    fatigue_management: [
      'Recovery-focused training to restore energy systems.',
      'Training load reduced to prevent accumulated overtraining.',
    ],
    plateau_break: [
      'Strategic reset phase before your next progression push.',
      'Brief reduction prepares you for renewed progress.',
    ],
  }
  
  const options = messages[phase.phaseType]
  return options[Math.floor(Math.random() * options.length)]
}

// =============================================================================
// PHASE COMPLETION & TRACKING
// =============================================================================

/**
 * Assess if a recovery phase should be concluded
 */
export function assessPhaseCompletion(
  phase: RecoveryPhase,
  currentInput: RecoveryAssessmentInput
): {
  shouldComplete: boolean
  reason: string
  readyToProgress: boolean
} {
  // Check if minimum duration has passed
  const startDate = new Date(phase.startDate)
  const now = new Date()
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysPassed < Math.min(phase.expectedDurationDays * 0.7, 4)) {
    return {
      shouldComplete: false,
      reason: 'Minimum recovery duration not yet reached',
      readyToProgress: false,
    }
  }
  
  // Check if recovery signals have improved
  const readinessImproved = currentInput.currentReadinessScore >= 60
  const fatigueReduced = currentInput.fatigueScore < 50
  const tendonStressNormalized = currentInput.tendonStressLevel === 'low' || currentInput.tendonStressLevel === 'moderate'
  
  const recoverySignals = [readinessImproved, fatigueReduced, tendonStressNormalized].filter(Boolean).length
  
  if (daysPassed >= phase.expectedDurationDays && recoverySignals >= 2) {
    return {
      shouldComplete: true,
      reason: 'Recovery phase duration complete and signals improved',
      readyToProgress: true,
    }
  }
  
  if (daysPassed >= phase.expectedDurationDays * 1.5) {
    return {
      shouldComplete: true,
      reason: 'Extended recovery phase duration reached',
      readyToProgress: recoverySignals >= 1,
    }
  }
  
  return {
    shouldComplete: false,
    reason: `Recovery in progress (day ${daysPassed}/${phase.expectedDurationDays})`,
    readyToProgress: false,
  }
}

// =============================================================================
// CYCLE INTEGRATION
// =============================================================================

/**
 * Determine if a recovery phase fits the current training cycle context
 */
export function assessCycleCompatibility(
  phaseType: RecoveryPhaseType,
  cycleContext: {
    currentPhase: string
    weekInCycle: number
    totalCycleWeeks: number
    cycleGoal: string
  }
): {
  compatible: boolean
  adjustmentSuggestion?: string
} {
  // Recovery phases generally fit at any point, but some timing is better
  const { currentPhase, weekInCycle, totalCycleWeeks } = cycleContext
  
  // End of cycle is natural deload point
  if (weekInCycle >= totalCycleWeeks - 1) {
    return {
      compatible: true,
      adjustmentSuggestion: 'Aligns with natural cycle end - good timing for recovery.',
    }
  }
  
  // Mid-cycle deload can be strategic
  if (weekInCycle >= 3 && weekInCycle <= totalCycleWeeks - 2) {
    return {
      compatible: true,
      adjustmentSuggestion: 'Mid-cycle recovery will support remaining progression work.',
    }
  }
  
  // Early cycle recovery is unusual but not blocked
  if (weekInCycle <= 2) {
    return {
      compatible: true,
      adjustmentSuggestion: 'Early cycle recovery - may want to reassess cycle goals after.',
    }
  }
  
  return { compatible: true }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  assessRecoveryNeed,
  generatePhaseAdjustments,
  calculatePhaseDuration,
  applyRecoveryAdjustmentsToSession,
  generateRecoveryPhaseExplanation,
  generateRecoveryCoachMessage,
  assessPhaseCompletion,
  assessCycleCompatibility,
}
