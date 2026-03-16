/**
 * Deload System
 * 
 * Implements intelligent deload recommendations and program adjustments
 * when fatigue accumulation requires recovery intervention.
 * 
 * Design Principles:
 * - Deloads preserve progress, not halt it
 * - Multiple signals required before triggering
 * - Athlete autonomy always preserved
 * - Clear, supportive coaching language
 */

import type { TrainingDecision, SessionAdjustments, WeeklyAdjustments } from '../fatigue-decision-engine'
import type { JointDiscomfortFlag } from '../athlete-profile'
import type { RecoveryStatus, FatigueTrend } from '../fatigue-engine'

// =============================================================================
// TYPES
// =============================================================================

export type DeloadType = 
  | 'volume_reduction'    // Reduce sets/reps, maintain intensity
  | 'intensity_reduction' // Reduce difficulty, maintain volume
  | 'frequency_reduction' // Fewer sessions, maintain quality
  | 'full_deload'         // Comprehensive recovery week
  | 'active_recovery'     // Light movement focus

export type DeloadTrigger =
  | 'fatigue_accumulation'  // Multiple fatigue signals elevated
  | 'performance_decline'   // Repeated workout failures
  | 'joint_stress'          // Joint discomfort flags active
  | 'overtraining_risk'     // Critical fatigue trend
  | 'scheduled_cycle'       // Planned deload in mesocycle
  | 'athlete_requested'     // Manual request

export type FatigueLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'RECOVERY_REQUIRED'

export interface DeloadRecommendation {
  shouldDeload: boolean
  deloadType: DeloadType
  trigger: DeloadTrigger | null
  fatigueLevel: FatigueLevel
  confidence: 'low' | 'medium' | 'high'
  durationDays: number
  adjustments: DeloadAdjustments
  jointProtocols: string[] // Protocol IDs to prioritize
  coachingMessage: string
  supportingReasoning: string[]
}

export interface DeloadAdjustments {
  volumeReductionPercent: number      // 0-50%
  intensityReductionPercent: number   // 0-30%
  frequencyReductionSessions: number  // 0-3 fewer sessions
  skillWorkFocus: boolean             // Prioritize technique
  recoveryProtocolsIncluded: boolean
  avoidHighStressExercises: boolean
  preserveGoalRelevantWork: boolean
}

export interface FatigueSignalSummary {
  performanceDrop: boolean
  exerciseSkips: boolean
  jointFlags: boolean
  volumeSpike: boolean
  consecutiveTrainingDays: number
  missedReps: boolean
  rpeElevated: boolean
}

// =============================================================================
// FATIGUE LEVEL CLASSIFICATION
// =============================================================================

/**
 * Classify fatigue level from multiple signals
 * Requires multiple indicators before escalating
 */
export function classifyFatigueLevel(signals: FatigueSignalSummary): FatigueLevel {
  let riskScore = 0
  
  // Performance signals (primary indicators)
  if (signals.performanceDrop) riskScore += 20
  if (signals.missedReps) riskScore += 15
  if (signals.rpeElevated) riskScore += 15
  
  // Volume/frequency signals
  if (signals.volumeSpike) riskScore += 15
  if (signals.consecutiveTrainingDays >= 5) riskScore += 20
  else if (signals.consecutiveTrainingDays >= 4) riskScore += 10
  
  // Joint signals (important safety indicator)
  if (signals.jointFlags) riskScore += 20
  
  // Behavioral signals
  if (signals.exerciseSkips) riskScore += 10
  
  // Require multiple signals for higher levels
  const activeSignals = [
    signals.performanceDrop,
    signals.missedReps,
    signals.rpeElevated,
    signals.volumeSpike,
    signals.consecutiveTrainingDays >= 4,
    signals.jointFlags,
    signals.exerciseSkips,
  ].filter(Boolean).length
  
  // Prevent single signal from triggering deload
  if (activeSignals < 2 && riskScore < 40) {
    return 'LOW'
  }
  
  if (riskScore >= 70 || (riskScore >= 50 && activeSignals >= 4)) {
    return 'RECOVERY_REQUIRED'
  }
  if (riskScore >= 50 || (riskScore >= 35 && activeSignals >= 3)) {
    return 'HIGH'
  }
  if (riskScore >= 30 || activeSignals >= 2) {
    return 'MODERATE'
  }
  
  return 'LOW'
}

// =============================================================================
// DELOAD DETERMINATION
// =============================================================================

/**
 * Determine if deload is needed and what type
 */
export function determineDeloadNeed(
  fatigueLevel: FatigueLevel,
  recoveryStatus: RecoveryStatus,
  fatigueTrend: FatigueTrend,
  jointDiscomforts: JointDiscomfortFlag[],
  daysSinceLastDeload: number
): DeloadRecommendation {
  // Base deload parameters
  let shouldDeload = false
  let deloadType: DeloadType = 'volume_reduction'
  let trigger: DeloadTrigger | null = null
  let durationDays = 5
  let confidence: 'low' | 'medium' | 'high' = 'medium'
  
  // Determine trigger and type
  if (recoveryStatus === 'overtrained' || fatigueTrend === 'critical') {
    shouldDeload = true
    deloadType = 'full_deload'
    trigger = 'overtraining_risk'
    durationDays = 7
    confidence = 'high'
  } else if (fatigueLevel === 'RECOVERY_REQUIRED') {
    shouldDeload = true
    deloadType = 'volume_reduction'
    trigger = 'fatigue_accumulation'
    durationDays = 5
    confidence = 'high'
  } else if (fatigueLevel === 'HIGH' && fatigueTrend === 'elevated') {
    shouldDeload = true
    deloadType = 'intensity_reduction'
    trigger = 'fatigue_accumulation'
    durationDays = 4
    confidence = 'medium'
  } else if (jointDiscomforts.length >= 2) {
    shouldDeload = true
    deloadType = 'active_recovery'
    trigger = 'joint_stress'
    durationDays = 5
    confidence = 'high'
  } else if (daysSinceLastDeload >= 35) {
    // Scheduled deload if no recent recovery week
    shouldDeload = fatigueLevel !== 'LOW'
    deloadType = 'volume_reduction'
    trigger = 'scheduled_cycle'
    durationDays = 4
    confidence = 'medium'
  }
  
  // Generate adjustments based on deload type
  const adjustments = generateDeloadAdjustments(deloadType, fatigueLevel)
  
  // Map joint discomfort to recommended protocols
  const jointProtocols = mapJointDiscomfortToProtocols(jointDiscomforts)
  
  // Generate coaching message
  const { message, reasoning } = generateDeloadCoaching(
    shouldDeload,
    deloadType,
    trigger,
    fatigueLevel
  )
  
  return {
    shouldDeload,
    deloadType,
    trigger,
    fatigueLevel,
    confidence,
    durationDays,
    adjustments,
    jointProtocols,
    coachingMessage: message,
    supportingReasoning: reasoning,
  }
}

// =============================================================================
// ADJUSTMENT GENERATION
// =============================================================================

function generateDeloadAdjustments(
  deloadType: DeloadType,
  fatigueLevel: FatigueLevel
): DeloadAdjustments {
  switch (deloadType) {
    case 'full_deload':
      return {
        volumeReductionPercent: 40,
        intensityReductionPercent: 20,
        frequencyReductionSessions: 2,
        skillWorkFocus: true,
        recoveryProtocolsIncluded: true,
        avoidHighStressExercises: true,
        preserveGoalRelevantWork: true,
      }
    
    case 'volume_reduction':
      return {
        volumeReductionPercent: 30,
        intensityReductionPercent: 0,
        frequencyReductionSessions: 1,
        skillWorkFocus: true,
        recoveryProtocolsIncluded: true,
        avoidHighStressExercises: false,
        preserveGoalRelevantWork: true,
      }
    
    case 'intensity_reduction':
      return {
        volumeReductionPercent: 10,
        intensityReductionPercent: 25,
        frequencyReductionSessions: 0,
        skillWorkFocus: true,
        recoveryProtocolsIncluded: true,
        avoidHighStressExercises: true,
        preserveGoalRelevantWork: true,
      }
    
    case 'frequency_reduction':
      return {
        volumeReductionPercent: 15,
        intensityReductionPercent: 0,
        frequencyReductionSessions: 2,
        skillWorkFocus: true,
        recoveryProtocolsIncluded: false,
        avoidHighStressExercises: false,
        preserveGoalRelevantWork: true,
      }
    
    case 'active_recovery':
      return {
        volumeReductionPercent: 50,
        intensityReductionPercent: 30,
        frequencyReductionSessions: 1,
        skillWorkFocus: false,
        recoveryProtocolsIncluded: true,
        avoidHighStressExercises: true,
        preserveGoalRelevantWork: false,
      }
  }
}

// =============================================================================
// JOINT PROTOCOL INTEGRATION
// =============================================================================

function mapJointDiscomfortToProtocols(discomforts: JointDiscomfortFlag[]): string[] {
  const protocolMap: Record<JointDiscomfortFlag, string> = {
    'wrist_irritation': 'wrist_integrity_protocol',
    'elbow_tendon_pain': 'elbow_tendon_health_protocol',
    'shoulder_instability': 'shoulder_stability_protocol',
    'knee_discomfort': 'knee_stability_protocol',
    'ankle_stiffness': 'ankle_mobility_protocol',
    'hip_tightness': 'hip_compression_protocol',
    'scapular_weakness': 'scapular_control_protocol',
  }
  
  return discomforts.map(d => protocolMap[d]).filter(Boolean)
}

// =============================================================================
// COACHING MESSAGE GENERATION
// =============================================================================

function generateDeloadCoaching(
  shouldDeload: boolean,
  deloadType: DeloadType,
  trigger: DeloadTrigger | null,
  fatigueLevel: FatigueLevel
): { message: string; reasoning: string[] } {
  if (!shouldDeload) {
    return {
      message: 'Training is progressing well. Continue with your current plan.',
      reasoning: ['Fatigue signals within normal range', 'Recovery appears adequate'],
    }
  }
  
  // Positive, supportive coaching tone
  const messages: Record<DeloadType, string> = {
    'volume_reduction': 'A lighter training week supports continued progress. Volume reduced while preserving skill work.',
    'intensity_reduction': 'Training intensity adjusted this week to protect long-term progress. Focus on quality movement.',
    'frequency_reduction': 'Recovery days added this week to restore training capacity. Strength gains consolidate during rest.',
    'full_deload': 'A recovery week has been introduced to support your next training phase. Deloads are part of intelligent programming.',
    'active_recovery': 'Focus this week is on movement quality and joint health. Light activity supports active recovery.',
  }
  
  const triggerReasons: Record<DeloadTrigger, string[]> = {
    'fatigue_accumulation': [
      'Multiple fatigue indicators elevated over recent sessions',
      'Training load requires recovery adjustment',
    ],
    'performance_decline': [
      'Performance trends indicate accumulated fatigue',
      'Recovery supports strength preservation',
    ],
    'joint_stress': [
      'Joint discomfort signals require attention',
      'Protective protocols added to warm-ups',
    ],
    'overtraining_risk': [
      'Training density approaching limits',
      'Strategic rest protects long-term progress',
    ],
    'scheduled_cycle': [
      'Periodic recovery supports continued adaptation',
      'Planned deload maintains training quality',
    ],
    'athlete_requested': [
      'Recovery period initiated as requested',
      'Rest supports your training goals',
    ],
  }
  
  return {
    message: messages[deloadType],
    reasoning: trigger ? triggerReasons[trigger] : ['Recovery adjustment based on training analysis'],
  }
}

// =============================================================================
// LONG-TERM FATIGUE TRACKING
// =============================================================================

const FATIGUE_PATTERN_STORAGE_KEY = 'spartanlab_fatigue_patterns'

export interface FatiguePatternEntry {
  date: string
  fatigueLevel: FatigueLevel
  deloadTriggered: boolean
  trigger: DeloadTrigger | null
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function saveFatiguePattern(entry: FatiguePatternEntry): void {
  if (!isBrowser()) return
  
  const stored = localStorage.getItem(FATIGUE_PATTERN_STORAGE_KEY)
  let patterns: FatiguePatternEntry[] = []
  
  if (stored) {
    try {
      patterns = JSON.parse(stored)
    } catch {
      patterns = []
    }
  }
  
  patterns.push(entry)
  
  // Keep last 90 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const filtered = patterns.filter(p => new Date(p.date) >= cutoff)
  
  localStorage.setItem(FATIGUE_PATTERN_STORAGE_KEY, JSON.stringify(filtered))
}

export function getFatiguePatterns(): FatiguePatternEntry[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(FATIGUE_PATTERN_STORAGE_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function analyzeFatigueHistory(): {
  deloadFrequency: number
  averageFatigueLevel: string
  recurringTriggers: DeloadTrigger[]
  recommendation: string
} {
  const patterns = getFatiguePatterns()
  
  if (patterns.length < 7) {
    return {
      deloadFrequency: 0,
      averageFatigueLevel: 'UNKNOWN',
      recurringTriggers: [],
      recommendation: 'Insufficient data for fatigue pattern analysis.',
    }
  }
  
  const deloads = patterns.filter(p => p.deloadTriggered)
  const deloadFrequency = Math.round((deloads.length / patterns.length) * 100)
  
  // Calculate average fatigue
  const levelScores: Record<FatigueLevel, number> = {
    'LOW': 1,
    'MODERATE': 2,
    'HIGH': 3,
    'RECOVERY_REQUIRED': 4,
  }
  
  const avgScore = patterns.reduce((sum, p) => sum + levelScores[p.fatigueLevel], 0) / patterns.length
  let averageFatigueLevel = 'LOW'
  if (avgScore >= 3) averageFatigueLevel = 'HIGH'
  else if (avgScore >= 2) averageFatigueLevel = 'MODERATE'
  
  // Find recurring triggers
  const triggerCounts: Partial<Record<DeloadTrigger, number>> = {}
  for (const pattern of patterns) {
    if (pattern.trigger) {
      triggerCounts[pattern.trigger] = (triggerCounts[pattern.trigger] || 0) + 1
    }
  }
  
  const recurringTriggers = Object.entries(triggerCounts)
    .filter(([, count]) => count >= 2)
    .map(([trigger]) => trigger as DeloadTrigger)
  
  // Generate recommendation
  let recommendation = 'Training load appears well-managed.'
  if (deloadFrequency > 30) {
    recommendation = 'Frequent deloads detected. Consider reducing baseline training intensity.'
  } else if (recurringTriggers.includes('joint_stress')) {
    recommendation = 'Joint stress is a recurring factor. Prioritize joint integrity protocols.'
  } else if (avgScore >= 2.5) {
    recommendation = 'Average fatigue runs high. More recovery days may benefit long-term progress.'
  }
  
  return {
    deloadFrequency,
    averageFatigueLevel,
    recurringTriggers,
    recommendation,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function getDeloadRecommendation(
  recoveryStatus: RecoveryStatus,
  fatigueTrend: FatigueTrend,
  jointDiscomforts: JointDiscomfortFlag[],
  signals: FatigueSignalSummary,
  daysSinceLastDeload: number = 30
): DeloadRecommendation {
  const fatigueLevel = classifyFatigueLevel(signals)
  
  return determineDeloadNeed(
    fatigueLevel,
    recoveryStatus,
    fatigueTrend,
    jointDiscomforts,
    daysSinceLastDeload
  )
}
