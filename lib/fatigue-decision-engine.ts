// Fatigue Decision Engine
// Translates fatigue signals into actionable training decisions

import {
  analyzeFatigue,
  quickFatigueCheck,
  type FatigueIndicators,
  type FatigueScore,
  type FatigueTrendData,
  type RecoveryStatus,
} from './fatigue-engine'

// =============================================================================
// DECISION TYPES
// =============================================================================

export type TrainingDecision =
  | 'TRAIN_AS_PLANNED'
  | 'PRESERVE_QUALITY'
  | 'LIGHTEN_SESSION'
  | 'COMPRESS_WEEKLY_LOAD'
  | 'DELOAD_RECOMMENDED'

export type DeloadRecommendation =
  | 'NO_DELOAD_NEEDED'
  | 'WATCH_RECOVERY'
  | 'LIGHTEN_NEXT_SESSION'
  | 'DELOAD_RECOMMENDED'

export interface FatigueDecision {
  decision: TrainingDecision
  deloadRecommendation: DeloadRecommendation
  confidence: 'low' | 'medium' | 'high'
  shortGuidance: string
  explanation: string
  adjustments: SessionAdjustments
  weeklyAdjustments: WeeklyAdjustments
}

export interface SessionAdjustments {
  reduceAccessoryVolume: boolean
  reduceAccessoryPercent: number // 0-100
  preserveSkillWork: boolean
  preserveMainStrength: boolean
  reduceOverallSets: boolean
  overallSetReduction: number // 0-50%
  suggestLowerRPE: boolean
  rpeReduction: number // 0-2
}

export interface WeeklyAdjustments {
  compressWeek: boolean
  dropLowPrioritySessions: boolean
  sessionsToPreserve: number
  volumeReductionPercent: number
  preserveGoalRelevantOnly: boolean
}

// =============================================================================
// DECISION THRESHOLDS
// =============================================================================

const THRESHOLDS = {
  // Fatigue score thresholds
  LOW_FATIGUE: 30,
  MODERATE_FATIGUE: 50,
  ELEVATED_FATIGUE: 70,
  HIGH_FATIGUE: 85,
  
  // Trend severity weights
  TREND_STABLE: 0,
  TREND_RISING: 10,
  TREND_ELEVATED: 20,
  TREND_CRITICAL: 35,
  
  // Days in fatigued state before escalating
  DAYS_BEFORE_ESCALATION: 3,
  DAYS_BEFORE_DELOAD: 5,
}

// =============================================================================
// MAIN DECISION FUNCTION
// =============================================================================

/**
 * Analyze fatigue signals and return a training decision
 * This is the primary entry point for fatigue-based training control
 */
export function getFatigueTrainingDecision(): FatigueDecision {
  const indicators = analyzeFatigue()
  
  // Calculate effective fatigue (score + trend modifier)
  const trendModifier = getTrendModifier(indicators.fatigueTrend.trend)
  const effectiveFatigue = Math.min(100, indicators.fatigueScore.value + trendModifier)
  
  // Determine base decision from fatigue level
  const decision = determineDecision(effectiveFatigue, indicators)
  const deloadRecommendation = determineDeloadRecommendation(effectiveFatigue, indicators)
  
  // Generate adjustments based on decision
  const adjustments = generateSessionAdjustments(decision, effectiveFatigue)
  const weeklyAdjustments = generateWeeklyAdjustments(decision, effectiveFatigue)
  
  // Generate guidance
  const shortGuidance = generateShortGuidance(decision)
  const explanation = generateExplanation(decision, indicators, effectiveFatigue)
  
  return {
    decision,
    deloadRecommendation,
    confidence: indicators.fatigueScore.confidence,
    shortGuidance,
    explanation,
    adjustments,
    weeklyAdjustments,
  }
}

/**
 * Quick decision check for workout execution
 * Lighter weight than full analysis
 */
export function getQuickFatigueDecision(): {
  decision: TrainingDecision
  shortGuidance: string
  needsAttention: boolean
} {
  const quick = quickFatigueCheck()
  
  let decision: TrainingDecision = 'TRAIN_AS_PLANNED'
  let shortGuidance = 'Recovery signals are strong. Continue as planned.'
  
  if (quick.level === 'high' || quick.trend === 'critical') {
    decision = 'DELOAD_RECOMMENDED'
    shortGuidance = 'Fatigue signals elevated. Consider a lighter session or deload.'
  } else if (quick.level === 'elevated' || quick.trend === 'elevated') {
    decision = 'LIGHTEN_SESSION'
    shortGuidance = 'Fatigue building. Prioritize quality over volume today.'
  } else if (quick.level === 'moderate' || quick.trend === 'rising') {
    decision = 'PRESERVE_QUALITY'
    shortGuidance = 'Maintain core work. Reduce lower-priority volume.'
  }
  
  return {
    decision,
    shortGuidance,
    needsAttention: quick.needsAttention,
  }
}

// =============================================================================
// DECISION DETERMINATION
// =============================================================================

function getTrendModifier(trend: FatigueTrendData['trend']): number {
  switch (trend) {
    case 'stable':
      return THRESHOLDS.TREND_STABLE
    case 'rising':
      return THRESHOLDS.TREND_RISING
    case 'elevated':
      return THRESHOLDS.TREND_ELEVATED
    case 'critical':
      return THRESHOLDS.TREND_CRITICAL
  }
}

function determineDecision(
  effectiveFatigue: number,
  indicators: FatigueIndicators
): TrainingDecision {
  const { fatigueTrend, recoveryStatus } = indicators
  
  // Critical state always triggers deload
  if (fatigueTrend.trend === 'critical' || recoveryStatus === 'overtrained') {
    return 'DELOAD_RECOMMENDED'
  }
  
  // High fatigue with sustained state
  if (effectiveFatigue >= THRESHOLDS.HIGH_FATIGUE) {
    if (fatigueTrend.daysInCurrentState >= THRESHOLDS.DAYS_BEFORE_DELOAD) {
      return 'DELOAD_RECOMMENDED'
    }
    return 'COMPRESS_WEEKLY_LOAD'
  }
  
  // Elevated fatigue
  if (effectiveFatigue >= THRESHOLDS.ELEVATED_FATIGUE) {
    if (fatigueTrend.daysInCurrentState >= THRESHOLDS.DAYS_BEFORE_ESCALATION) {
      return 'COMPRESS_WEEKLY_LOAD'
    }
    return 'LIGHTEN_SESSION'
  }
  
  // Moderate fatigue
  if (effectiveFatigue >= THRESHOLDS.MODERATE_FATIGUE) {
    return 'PRESERVE_QUALITY'
  }
  
  // Low fatigue - train as planned
  return 'TRAIN_AS_PLANNED'
}

function determineDeloadRecommendation(
  effectiveFatigue: number,
  indicators: FatigueIndicators
): DeloadRecommendation {
  const { fatigueTrend, recoveryStatus, signals } = indicators
  
  // Strong indicators for deload
  if (
    effectiveFatigue >= THRESHOLDS.HIGH_FATIGUE ||
    fatigueTrend.trend === 'critical' ||
    recoveryStatus === 'overtrained'
  ) {
    return 'DELOAD_RECOMMENDED'
  }
  
  // Moderate indicators - lighten next session
  if (
    effectiveFatigue >= THRESHOLDS.ELEVATED_FATIGUE ||
    (fatigueTrend.trend === 'elevated' && fatigueTrend.daysInCurrentState >= 3)
  ) {
    return 'LIGHTEN_NEXT_SESSION'
  }
  
  // Early warning signs
  if (
    effectiveFatigue >= THRESHOLDS.MODERATE_FATIGUE ||
    fatigueTrend.trend === 'rising' ||
    signals.rpeEscalation > 50
  ) {
    return 'WATCH_RECOVERY'
  }
  
  return 'NO_DELOAD_NEEDED'
}

// =============================================================================
// ADJUSTMENT GENERATION
// =============================================================================

function generateSessionAdjustments(
  decision: TrainingDecision,
  effectiveFatigue: number
): SessionAdjustments {
  switch (decision) {
    case 'TRAIN_AS_PLANNED':
      return {
        reduceAccessoryVolume: false,
        reduceAccessoryPercent: 0,
        preserveSkillWork: true,
        preserveMainStrength: true,
        reduceOverallSets: false,
        overallSetReduction: 0,
        suggestLowerRPE: false,
        rpeReduction: 0,
      }
    
    case 'PRESERVE_QUALITY':
      return {
        reduceAccessoryVolume: true,
        reduceAccessoryPercent: 20,
        preserveSkillWork: true,
        preserveMainStrength: true,
        reduceOverallSets: false,
        overallSetReduction: 0,
        suggestLowerRPE: false,
        rpeReduction: 0,
      }
    
    case 'LIGHTEN_SESSION':
      return {
        reduceAccessoryVolume: true,
        reduceAccessoryPercent: 40,
        preserveSkillWork: true,
        preserveMainStrength: true,
        reduceOverallSets: true,
        overallSetReduction: 20,
        suggestLowerRPE: true,
        rpeReduction: 1,
      }
    
    case 'COMPRESS_WEEKLY_LOAD':
      return {
        reduceAccessoryVolume: true,
        reduceAccessoryPercent: 50,
        preserveSkillWork: true,
        preserveMainStrength: true,
        reduceOverallSets: true,
        overallSetReduction: 30,
        suggestLowerRPE: true,
        rpeReduction: 1,
      }
    
    case 'DELOAD_RECOMMENDED':
      return {
        reduceAccessoryVolume: true,
        reduceAccessoryPercent: 70,
        preserveSkillWork: true,
        preserveMainStrength: false, // Can reduce main work too
        reduceOverallSets: true,
        overallSetReduction: 40,
        suggestLowerRPE: true,
        rpeReduction: 2,
      }
  }
}

function generateWeeklyAdjustments(
  decision: TrainingDecision,
  effectiveFatigue: number
): WeeklyAdjustments {
  switch (decision) {
    case 'TRAIN_AS_PLANNED':
    case 'PRESERVE_QUALITY':
      return {
        compressWeek: false,
        dropLowPrioritySessions: false,
        sessionsToPreserve: 0, // All sessions
        volumeReductionPercent: 0,
        preserveGoalRelevantOnly: false,
      }
    
    case 'LIGHTEN_SESSION':
      return {
        compressWeek: false,
        dropLowPrioritySessions: true,
        sessionsToPreserve: 0,
        volumeReductionPercent: 15,
        preserveGoalRelevantOnly: false,
      }
    
    case 'COMPRESS_WEEKLY_LOAD':
      return {
        compressWeek: true,
        dropLowPrioritySessions: true,
        sessionsToPreserve: 3, // Keep max 3 primary sessions
        volumeReductionPercent: 30,
        preserveGoalRelevantOnly: true,
      }
    
    case 'DELOAD_RECOMMENDED':
      return {
        compressWeek: true,
        dropLowPrioritySessions: true,
        sessionsToPreserve: 2, // Keep max 2 sessions
        volumeReductionPercent: 40,
        preserveGoalRelevantOnly: true,
      }
  }
}

// =============================================================================
// GUIDANCE GENERATION
// =============================================================================

function generateShortGuidance(decision: TrainingDecision): string {
  switch (decision) {
    case 'TRAIN_AS_PLANNED':
      return 'Recovery signals are strong. Continue with the planned session.'
    case 'PRESERVE_QUALITY':
      return 'Maintain core work. Reduce lower-priority volume to preserve strength quality.'
    case 'LIGHTEN_SESSION':
      return 'Reduce total volume today while keeping the highest-value work.'
    case 'COMPRESS_WEEKLY_LOAD':
      return 'Reduce weekly load. Preserve only the most goal-relevant sessions.'
    case 'DELOAD_RECOMMENDED':
      return 'Training stress has accumulated. A lower-intensity period is recommended.'
  }
}

function generateExplanation(
  decision: TrainingDecision,
  indicators: FatigueIndicators,
  effectiveFatigue: number
): string {
  const { fatigueScore, fatigueTrend, signals } = indicators
  
  const parts: string[] = []
  
  // Describe current state
  if (fatigueScore.level === 'high') {
    parts.push('Your fatigue indicators show elevated training stress.')
  } else if (fatigueScore.level === 'elevated') {
    parts.push('Fatigue signals are building across recent sessions.')
  } else if (fatigueScore.level === 'moderate') {
    parts.push('Moderate fatigue detected from recent training.')
  } else {
    parts.push('Your recovery indicators remain strong.')
  }
  
  // Add trend context
  if (fatigueTrend.trend === 'critical') {
    parts.push('Fatigue trend is critical and needs immediate attention.')
  } else if (fatigueTrend.trend === 'elevated') {
    parts.push(`Fatigue has been elevated for ${fatigueTrend.daysInCurrentState} days.`)
  } else if (fatigueTrend.trend === 'rising') {
    parts.push('Fatigue trend is rising.')
  }
  
  // Add specific signal insights
  if (signals.rpeEscalation > 60) {
    parts.push('Session effort levels have been consistently higher than intended.')
  }
  if (signals.repDropOff > 50) {
    parts.push('Rep performance is declining compared to recent sessions.')
  }
  if (signals.recoveryGap > 50) {
    parts.push('Recovery time between sessions may be insufficient.')
  }
  
  // Add decision rationale
  switch (decision) {
    case 'PRESERVE_QUALITY':
      parts.push('Reducing accessory volume helps maintain strength output quality.')
      break
    case 'LIGHTEN_SESSION':
      parts.push('A lighter session today will help restore productive training capacity.')
      break
    case 'COMPRESS_WEEKLY_LOAD':
      parts.push('Reducing this week\'s total load will support long-term progress.')
      break
    case 'DELOAD_RECOMMENDED':
      parts.push('A structured recovery period is recommended to restore training readiness.')
      break
  }
  
  return parts.join(' ')
}

// =============================================================================
// SESSION ADJUSTMENT APPLICATION
// =============================================================================

export interface AdjustedSession {
  exercises: AdjustedExercise[]
  wasAdjusted: boolean
  adjustmentReason: string
  originalSetCount: number
  adjustedSetCount: number
}

export interface AdjustedExercise {
  id: string
  name: string
  category: string
  originalSets: number
  adjustedSets: number
  wasReduced: boolean
  isPreserved: boolean
  rpeAdjustment: number
}

/**
 * Apply fatigue-based adjustments to a session's exercises
 */
export function applyFatigueAdjustments(
  exercises: Array<{
    id: string
    name: string
    category: string
    sets: number
    isSkillWork?: boolean
    isMainStrength?: boolean
    isAccessory?: boolean
  }>,
  adjustments: SessionAdjustments
): AdjustedSession {
  if (!adjustments.reduceAccessoryVolume && !adjustments.reduceOverallSets) {
    return {
      exercises: exercises.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        originalSets: e.sets,
        adjustedSets: e.sets,
        wasReduced: false,
        isPreserved: true,
        rpeAdjustment: 0,
      })),
      wasAdjusted: false,
      adjustmentReason: 'No adjustment needed.',
      originalSetCount: exercises.reduce((sum, e) => sum + e.sets, 0),
      adjustedSetCount: exercises.reduce((sum, e) => sum + e.sets, 0),
    }
  }
  
  const adjusted: AdjustedExercise[] = exercises.map(exercise => {
    const isSkill = exercise.isSkillWork || 
      exercise.category === 'skill' || 
      exercise.name.toLowerCase().includes('hold')
    const isMain = exercise.isMainStrength || 
      exercise.category === 'strength' ||
      exercise.category === 'main'
    const isAccessory = exercise.isAccessory || 
      exercise.category === 'accessory' ||
      (!isSkill && !isMain)
    
    let adjustedSets = exercise.sets
    let wasReduced = false
    let isPreserved = true
    
    // Preserve skill work unless in deload
    if (isSkill && adjustments.preserveSkillWork) {
      isPreserved = true
    }
    // Preserve main strength unless in deload
    else if (isMain && adjustments.preserveMainStrength) {
      isPreserved = true
    }
    // Reduce accessory work
    else if (isAccessory && adjustments.reduceAccessoryVolume) {
      const reduction = adjustments.reduceAccessoryPercent / 100
      adjustedSets = Math.max(1, Math.ceil(exercise.sets * (1 - reduction)))
      wasReduced = adjustedSets < exercise.sets
      isPreserved = adjustedSets > 0
    }
    // Apply overall reduction
    else if (adjustments.reduceOverallSets) {
      const reduction = adjustments.overallSetReduction / 100
      adjustedSets = Math.max(1, Math.ceil(exercise.sets * (1 - reduction * 0.5))) // Less aggressive for non-accessory
      wasReduced = adjustedSets < exercise.sets
    }
    
    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      originalSets: exercise.sets,
      adjustedSets,
      wasReduced,
      isPreserved,
      rpeAdjustment: adjustments.suggestLowerRPE ? -adjustments.rpeReduction : 0,
    }
  })
  
  const originalSetCount = exercises.reduce((sum, e) => sum + e.sets, 0)
  const adjustedSetCount = adjusted.reduce((sum, e) => sum + e.adjustedSets, 0)
  
  let adjustmentReason = 'Session adjusted based on fatigue signals.'
  if (adjustments.reduceAccessoryVolume) {
    adjustmentReason = 'Accessory volume reduced to preserve strength quality.'
  }
  if (adjustments.reduceOverallSets) {
    adjustmentReason = 'Overall session volume reduced due to accumulated fatigue.'
  }
  
  return {
    exercises: adjusted,
    wasAdjusted: true,
    adjustmentReason,
    originalSetCount,
    adjustedSetCount,
  }
}

// =============================================================================
// DELOAD WEEK GENERATION
// =============================================================================

export interface DeloadWeekPlan {
  isRecommended: boolean
  reason: string
  volumeReduction: number
  intensityReduction: number
  sessionsRecommended: number
  focusAreas: string[]
  guidance: string[]
}

/**
 * Generate deload week recommendations
 */
export function generateDeloadPlan(indicators: FatigueIndicators): DeloadWeekPlan {
  const { fatigueScore, fatigueTrend, recoveryStatus } = indicators
  
  // Determine if deload is recommended
  const isRecommended = 
    fatigueScore.level === 'high' ||
    fatigueTrend.trend === 'critical' ||
    recoveryStatus === 'overtrained' ||
    (fatigueScore.level === 'elevated' && fatigueTrend.daysInCurrentState >= 5)
  
  if (!isRecommended) {
    return {
      isRecommended: false,
      reason: 'Current fatigue levels do not warrant a deload.',
      volumeReduction: 0,
      intensityReduction: 0,
      sessionsRecommended: 0,
      focusAreas: [],
      guidance: [],
    }
  }
  
  // Calculate reductions based on severity
  let volumeReduction: number
  let intensityReduction: number
  let sessionsRecommended: number
  
  if (fatigueTrend.trend === 'critical' || recoveryStatus === 'overtrained') {
    volumeReduction = 50
    intensityReduction = 20
    sessionsRecommended = 2
  } else if (fatigueScore.level === 'high') {
    volumeReduction = 40
    intensityReduction = 15
    sessionsRecommended = 3
  } else {
    volumeReduction = 30
    intensityReduction = 10
    sessionsRecommended = 3
  }
  
  const reason = generateDeloadReason(indicators)
  
  return {
    isRecommended: true,
    reason,
    volumeReduction,
    intensityReduction,
    sessionsRecommended,
    focusAreas: [
      'Maintain movement patterns',
      'Reduce loading and density',
      'Prioritize skill practice over strength work',
    ],
    guidance: [
      `Reduce total weekly volume by approximately ${volumeReduction}%.`,
      `Lower target RPE by ${intensityReduction}% from normal ranges.`,
      `Aim for ${sessionsRecommended} lighter sessions this week.`,
      'Focus on movement quality rather than performance metrics.',
    ],
  }
}

function generateDeloadReason(indicators: FatigueIndicators): string {
  const { fatigueScore, fatigueTrend, signals } = indicators
  
  const factors: string[] = []
  
  if (fatigueScore.level === 'high') {
    factors.push('high accumulated fatigue')
  }
  if (fatigueTrend.trend === 'critical') {
    factors.push('critical fatigue trend')
  }
  if (signals.rpeEscalation > 60) {
    factors.push('consistently elevated effort levels')
  }
  if (signals.repDropOff > 50) {
    factors.push('declining rep performance')
  }
  if (fatigueTrend.daysInCurrentState >= 5) {
    factors.push(`${fatigueTrend.daysInCurrentState} days in fatigued state`)
  }
  
  if (factors.length === 0) {
    return 'Accumulated training stress suggests a recovery period would benefit long-term progress.'
  }
  
  return `Deload recommended due to ${factors.join(', ')}. A structured recovery week will help restore training readiness.`
}

// =============================================================================
// EXPORT HELPER FOR UI
// =============================================================================

export function getDecisionColor(decision: TrainingDecision): string {
  switch (decision) {
    case 'TRAIN_AS_PLANNED':
      return '#22C55E' // green
    case 'PRESERVE_QUALITY':
      return '#EAB308' // yellow
    case 'LIGHTEN_SESSION':
      return '#F97316' // orange
    case 'COMPRESS_WEEKLY_LOAD':
      return '#F97316' // orange
    case 'DELOAD_RECOMMENDED':
      return '#EF4444' // red
  }
}

export function getDecisionLabel(decision: TrainingDecision): string {
  switch (decision) {
    case 'TRAIN_AS_PLANNED':
      return 'Train as Planned'
    case 'PRESERVE_QUALITY':
      return 'Preserve Quality'
    case 'LIGHTEN_SESSION':
      return 'Lighten Session'
    case 'COMPRESS_WEEKLY_LOAD':
      return 'Compress Weekly Load'
    case 'DELOAD_RECOMMENDED':
      return 'Deload Recommended'
  }
}

export function getDeloadLabel(recommendation: DeloadRecommendation): string {
  switch (recommendation) {
    case 'NO_DELOAD_NEEDED':
      return 'No Deload Needed'
    case 'WATCH_RECOVERY':
      return 'Watch Recovery'
    case 'LIGHTEN_NEXT_SESSION':
      return 'Lighten Next Session'
    case 'DELOAD_RECOMMENDED':
      return 'Deload Recommended'
  }
}
