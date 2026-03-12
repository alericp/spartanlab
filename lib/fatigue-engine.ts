// Fatigue Intelligence Engine
// Central module for fatigue detection and trend analysis

import {
  calculateAllFatigueSignals,
  type FatigueSignals,
  getStoredRPESessions,
  saveRPESession,
  type StoredRPESession,
} from './fatigue-score-calculator'

import {
  calculateTrainingLoadSummary,
  getACWRRiskLevel,
  type TrainingLoadSummary,
} from './training-load-analyzer'

// =============================================================================
// TYPES
// =============================================================================

export type FatigueTrend = 'stable' | 'rising' | 'elevated' | 'critical'
export type RecoveryStatus = 'recovered' | 'recovering' | 'fatigued' | 'overtrained'

export interface FatigueScore {
  value: number // 0-100
  level: 'low' | 'moderate' | 'elevated' | 'high'
  confidence: 'low' | 'medium' | 'high' // Based on data availability
}

export interface FatigueTrendData {
  trend: FatigueTrend
  direction: 'improving' | 'stable' | 'worsening'
  daysInCurrentState: number
  projectedDaysToRecovery: number | null
}

export interface FatigueIndicators {
  fatigueScore: FatigueScore
  fatigueTrend: FatigueTrendData
  recentTrainingLoad: TrainingLoadSummary
  recoveryStatus: RecoveryStatus
  signals: FatigueSignals
  recommendations: string[]
  lastUpdated: string
}

// Storage key for fatigue history
const FATIGUE_HISTORY_KEY = 'spartanlab_fatigue_history'

interface FatigueHistoryEntry {
  date: string
  score: number
  trend: FatigueTrend
}

// =============================================================================
// FATIGUE HISTORY STORAGE
// =============================================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function getFatigueHistory(): FatigueHistoryEntry[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(FATIGUE_HISTORY_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveFatigueHistory(entry: FatigueHistoryEntry): void {
  if (!isBrowser()) return
  const history = getFatigueHistory()
  
  // Add new entry
  history.push(entry)
  
  // Keep only last 30 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const filtered = history.filter(h => new Date(h.date) >= cutoff)
  
  localStorage.setItem(FATIGUE_HISTORY_KEY, JSON.stringify(filtered))
}

// =============================================================================
// MAIN FATIGUE CALCULATION
// =============================================================================

/**
 * Calculate overall fatigue score from individual signals
 * Weighted combination based on signal importance
 */
export function calculateFatigueScore(signals: FatigueSignals): FatigueScore {
  // Weighted signal contributions
  const weights = {
    rpeEscalation: 0.25,      // RPE creep is a primary indicator
    repDropOff: 0.20,         // Performance decline matters
    volumeStress: 0.15,       // Volume is a factor
    frequencyStress: 0.15,    // Training density
    recoveryGap: 0.15,        // Insufficient rest
    consistencyDrop: 0.10,    // Missed sessions (body forcing rest)
  }
  
  // Calculate weighted score
  const weightedScore =
    (signals.rpeEscalation * weights.rpeEscalation) +
    (signals.repDropOff * weights.repDropOff) +
    (signals.volumeStress * weights.volumeStress) +
    (signals.frequencyStress * weights.frequencyStress) +
    (signals.recoveryGap * weights.recoveryGap) +
    (signals.consistencyDrop * weights.consistencyDrop)
  
  const value = Math.round(weightedScore)
  
  // Determine level
  let level: FatigueScore['level']
  if (value < 30) {
    level = 'low'
  } else if (value < 50) {
    level = 'moderate'
  } else if (value < 70) {
    level = 'elevated'
  } else {
    level = 'high'
  }
  
  // Determine confidence based on data availability
  const rpeSessions = getStoredRPESessions()
  let confidence: FatigueScore['confidence']
  if (rpeSessions.length >= 5) {
    confidence = 'high'
  } else if (rpeSessions.length >= 2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }
  
  return { value, level, confidence }
}

// =============================================================================
// TREND DETECTION
// =============================================================================

/**
 * Detect fatigue trend from recent history
 */
function detectFatigueTrend(currentScore: number): FatigueTrendData {
  const history = getFatigueHistory()
  
  // Default for insufficient data
  if (history.length < 3) {
    return {
      trend: 'stable',
      direction: 'stable',
      daysInCurrentState: 1,
      projectedDaysToRecovery: null,
    }
  }
  
  // Get last 7 entries
  const recent = history.slice(-7)
  
  // Calculate trend direction
  const oldAvg = recent.slice(0, Math.floor(recent.length / 2)).reduce((sum, h) => sum + h.score, 0) / Math.floor(recent.length / 2)
  const newAvg = recent.slice(Math.floor(recent.length / 2)).reduce((sum, h) => sum + h.score, 0) / Math.ceil(recent.length / 2)
  
  const scoreDelta = newAvg - oldAvg
  
  // Determine direction
  let direction: FatigueTrendData['direction']
  if (scoreDelta > 5) {
    direction = 'worsening'
  } else if (scoreDelta < -5) {
    direction = 'improving'
  } else {
    direction = 'stable'
  }
  
  // Determine trend level
  let trend: FatigueTrend
  if (currentScore >= 80 || (currentScore >= 70 && direction === 'worsening')) {
    trend = 'critical'
  } else if (currentScore >= 60 || (currentScore >= 50 && direction === 'worsening')) {
    trend = 'elevated'
  } else if (currentScore >= 40 || direction === 'worsening') {
    trend = 'rising'
  } else {
    trend = 'stable'
  }
  
  // Count days in current state
  let daysInCurrentState = 1
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].trend === trend) {
      daysInCurrentState++
    } else {
      break
    }
  }
  
  // Project recovery (simplified)
  let projectedDaysToRecovery: number | null = null
  if (trend === 'elevated' || trend === 'critical') {
    projectedDaysToRecovery = Math.ceil(currentScore / 15) // Rough estimate
  }
  
  return {
    trend,
    direction,
    daysInCurrentState,
    projectedDaysToRecovery,
  }
}

// =============================================================================
// RECOVERY STATUS
// =============================================================================

/**
 * Determine overall recovery status from fatigue score and trend
 */
function determineRecoveryStatus(fatigueScore: FatigueScore, trend: FatigueTrend): RecoveryStatus {
  if (fatigueScore.value >= 80 || trend === 'critical') {
    return 'overtrained'
  }
  if (fatigueScore.value >= 60 || trend === 'elevated') {
    return 'fatigued'
  }
  if (fatigueScore.value >= 30) {
    return 'recovering'
  }
  return 'recovered'
}

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

/**
 * Generate actionable recommendations based on fatigue analysis
 */
function generateFatigueRecommendations(
  fatigueScore: FatigueScore,
  signals: FatigueSignals,
  loadSummary: TrainingLoadSummary
): string[] {
  const recommendations: string[] = []
  
  // High fatigue
  if (fatigueScore.level === 'high') {
    recommendations.push('Consider a deload week to allow recovery.')
    recommendations.push('Focus on sleep and nutrition this week.')
  } else if (fatigueScore.level === 'elevated') {
    recommendations.push('Reduce training volume by 20-30% this week.')
    recommendations.push('Prioritize main lifts over accessories.')
  }
  
  // RPE escalation
  if (signals.rpeEscalation > 60) {
    recommendations.push('RPE trending higher than usual. Monitor effort levels.')
  }
  
  // Rep drop-off
  if (signals.repDropOff > 50) {
    recommendations.push('Performance declining. Extra rest may help.')
  }
  
  // Volume stress
  if (signals.volumeStress > 70) {
    recommendations.push('Training volume is high. Consider reducing sets.')
  }
  
  // Frequency stress
  if (signals.frequencyStress > 60) {
    recommendations.push('Training frequency is dense. Add rest days if needed.')
  }
  
  // ACWR risk
  const acwrRisk = getACWRRiskLevel(loadSummary.acuteChronicRatio)
  if (acwrRisk === 'high') {
    recommendations.push('Training load increased rapidly. Maintain current load.')
  }
  
  // Default for low fatigue
  if (recommendations.length === 0) {
    recommendations.push('Recovery looks good. Continue as planned.')
  }
  
  return recommendations.slice(0, 3) // Max 3 recommendations
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Main function to analyze fatigue and return full indicators
 * Also available as getFatigueIndicators()
 */
export function analyzeFatigue(): FatigueIndicators {
  // Calculate all signals
  const signals = calculateAllFatigueSignals()
  
  // Calculate fatigue score
  const fatigueScore = calculateFatigueScore(signals)
  
  // Detect trend
  const trendData = detectFatigueTrend(fatigueScore.value)
  
  // Get training load summary
  const recentTrainingLoad = calculateTrainingLoadSummary()
  
  // Determine recovery status
  const recoveryStatus = determineRecoveryStatus(fatigueScore, trendData.trend)
  
  // Generate recommendations
  const recommendations = generateFatigueRecommendations(fatigueScore, signals, recentTrainingLoad)
  
  // Save to history for trend tracking
  saveFatigueHistory({
    date: new Date().toISOString(),
    score: fatigueScore.value,
    trend: trendData.trend,
  })
  
  return {
    fatigueScore,
    fatigueTrend: trendData,
    recentTrainingLoad,
    recoveryStatus,
    signals,
    recommendations,
    lastUpdated: new Date().toISOString(),
  }
}

// Alias for backwards compatibility
export const getFatigueIndicators = analyzeFatigue

/**
 * Quick fatigue check - lightweight version for frequent use
 */
export function quickFatigueCheck(): {
  score: number
  level: FatigueScore['level']
  trend: FatigueTrend
  needsAttention: boolean
} {
  const signals = calculateAllFatigueSignals()
  const fatigueScore = calculateFatigueScore(signals)
  const trendData = detectFatigueTrend(fatigueScore.value)
  
  return {
    score: fatigueScore.value,
    level: fatigueScore.level,
    trend: trendData.trend,
    needsAttention: fatigueScore.value >= 60 || trendData.trend === 'critical',
  }
}

/**
 * Record RPE session data for fatigue tracking
 * Called by workout execution system after each session
 */
export function recordRPESession(session: StoredRPESession): void {
  saveRPESession(session)
}

/**
 * Get fatigue level color for UI
 */
export function getFatigueLevelColor(level: FatigueScore['level']): string {
  switch (level) {
    case 'low':
      return '#22C55E' // green
    case 'moderate':
      return '#EAB308' // yellow
    case 'elevated':
      return '#F97316' // orange
    case 'high':
      return '#EF4444' // red
  }
}

/**
 * Get fatigue trend color for UI
 */
export function getFatigueTrendColor(trend: FatigueTrend): string {
  switch (trend) {
    case 'stable':
      return '#22C55E' // green
    case 'rising':
      return '#EAB308' // yellow
    case 'elevated':
      return '#F97316' // orange
    case 'critical':
      return '#EF4444' // red
  }
}

/**
 * Get recovery status label
 */
export function getRecoveryStatusLabel(status: RecoveryStatus): string {
  switch (status) {
    case 'recovered':
      return 'Fully Recovered'
    case 'recovering':
      return 'Recovering'
    case 'fatigued':
      return 'Fatigued'
    case 'overtrained':
      return 'Needs Rest'
  }
}

// =============================================================================
// EXPORTS FOR ADAPTIVE TRAINING INTEGRATION
// =============================================================================

export {
  type FatigueSignals,
  type StoredRPESession,
  getStoredRPESessions,
} from './fatigue-score-calculator'

export {
  type TrainingLoadSummary,
  type SessionIntensity,
  getDailyLoads,
  classifySessionIntensity,
  getACWRRiskLevel,
} from './training-load-analyzer'

// NOTE: fatigue-decision-engine imports from fatigue-engine,
// so we don't re-export from there to avoid circular dependency.
// Import fatigue-decision-engine directly where needed.
