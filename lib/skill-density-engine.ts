// Skill Density Engine
// Calculates training density metrics for skill sessions

import type { SkillSession, SkillDensityMetrics, SkillSet } from '@/types/skill-readiness'

// =============================================================================
// CONSTANTS
// =============================================================================

const DAYS_FOR_WEEKLY = 7
const SESSIONS_FOR_ROLLING_AVG = 5

// =============================================================================
// SESSION DENSITY
// =============================================================================

/**
 * Calculate the total hold time (density) for a single session
 */
export function calculateSessionDensity(sets: SkillSet[]): number {
  return sets.reduce((total, set) => total + set.holdSeconds, 0)
}

/**
 * Calculate average hold time across sets
 */
export function calculateAverageHold(sets: SkillSet[]): number {
  if (sets.length === 0) return 0
  const total = sets.reduce((sum, set) => sum + set.holdSeconds, 0)
  return Math.round((total / sets.length) * 10) / 10 // One decimal place
}

/**
 * Get best hold from sets
 */
export function getBestHold(sets: SkillSet[]): number {
  if (sets.length === 0) return 0
  return Math.max(...sets.map(s => s.holdSeconds))
}

/**
 * Count clean holds (quality === 'clean')
 */
export function countCleanHolds(sets: SkillSet[]): number {
  return sets.filter(s => s.quality === 'clean').length
}

/**
 * Get success rate (non-failed holds / total holds)
 */
export function getSuccessRate(sets: SkillSet[]): number {
  if (sets.length === 0) return 0
  const successful = sets.filter(s => s.quality !== 'failed').length
  return Math.round((successful / sets.length) * 100)
}

// =============================================================================
// WEEKLY DENSITY
// =============================================================================

/**
 * Calculate weekly density from an array of sessions
 */
export function calculateWeeklyDensity(
  sessions: SkillSession[],
  skillName: string,
  level: number
): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - DAYS_FOR_WEEKLY * 24 * 60 * 60 * 1000)
  
  return sessions
    .filter(s => 
      s.skillName === skillName &&
      s.level === level &&
      new Date(s.sessionDate) >= weekAgo
    )
    .reduce((total, session) => total + session.sessionDensity, 0)
}

/**
 * Count sessions in the past week
 */
export function countSessionsThisWeek(
  sessions: SkillSession[],
  skillName: string,
  level: number
): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - DAYS_FOR_WEEKLY * 24 * 60 * 60 * 1000)
  
  return sessions
    .filter(s => 
      s.skillName === skillName &&
      s.level === level &&
      new Date(s.sessionDate) >= weekAgo
    ).length
}

// =============================================================================
// ROLLING AVERAGE
// =============================================================================

/**
 * Calculate rolling average session density
 */
export function calculateRollingAverageDensity(
  sessions: SkillSession[],
  skillName: string,
  level: number
): number {
  const relevantSessions = sessions
    .filter(s => s.skillName === skillName && s.level === level)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, SESSIONS_FOR_ROLLING_AVG)
  
  if (relevantSessions.length === 0) return 0
  
  const total = relevantSessions.reduce((sum, s) => sum + s.sessionDensity, 0)
  return Math.round(total / relevantSessions.length)
}

// =============================================================================
// COMPLETE DENSITY METRICS
// =============================================================================

/**
 * Calculate all density metrics for a skill at a specific level
 */
export function calculateSkillDensityMetrics(
  sessions: SkillSession[],
  skillName: string,
  level: number
): SkillDensityMetrics {
  const relevantSessions = sessions
    .filter(s => s.skillName === skillName && s.level === level)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
  
  const mostRecent = relevantSessions[0]
  
  return {
    sessionDensity: mostRecent?.sessionDensity ?? 0,
    weeklyDensity: calculateWeeklyDensity(sessions, skillName, level),
    rollingAverageDensity: calculateRollingAverageDensity(sessions, skillName, level),
    sessionsThisWeek: countSessionsThisWeek(sessions, skillName, level),
    totalSessions: relevantSessions.length,
    lastSessionDate: mostRecent?.sessionDate ?? null,
  }
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Analyze trend in session density over recent sessions
 * Returns: 'improving' | 'stable' | 'declining' | 'insufficient_data'
 */
export function analyzeDensityTrend(
  sessions: SkillSession[],
  skillName: string,
  level: number
): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
  const relevantSessions = sessions
    .filter(s => s.skillName === skillName && s.level === level)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 5) // Last 5 sessions
  
  if (relevantSessions.length < 3) {
    return 'insufficient_data'
  }
  
  // Compare first half to second half
  const mid = Math.floor(relevantSessions.length / 2)
  const recentHalf = relevantSessions.slice(0, mid)
  const olderHalf = relevantSessions.slice(mid)
  
  const recentAvg = recentHalf.reduce((sum, s) => sum + s.sessionDensity, 0) / recentHalf.length
  const olderAvg = olderHalf.reduce((sum, s) => sum + s.sessionDensity, 0) / olderHalf.length
  
  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100
  
  if (changePercent > 10) return 'improving'
  if (changePercent < -10) return 'declining'
  return 'stable'
}

/**
 * Analyze hold time trend
 */
export function analyzeHoldTrend(
  sessions: SkillSession[],
  skillName: string,
  level: number
): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
  const relevantSessions = sessions
    .filter(s => s.skillName === skillName && s.level === level)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 5)
  
  if (relevantSessions.length < 3) {
    return 'insufficient_data'
  }
  
  // Get best hold from each session
  const bestHolds = relevantSessions.map(s => getBestHold(s.sets))
  
  const mid = Math.floor(bestHolds.length / 2)
  const recentAvg = bestHolds.slice(0, mid).reduce((a, b) => a + b, 0) / mid
  const olderAvg = bestHolds.slice(mid).reduce((a, b) => a + b, 0) / (bestHolds.length - mid)
  
  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100
  
  if (changePercent > 10) return 'improving'
  if (changePercent < -10) return 'declining'
  return 'stable'
}

// =============================================================================
// HELPER: AGGREGATE STATS FROM SESSIONS
// =============================================================================

/**
 * Get aggregate stats across all sessions for a skill/level
 */
export function getAggregateSessionStats(
  sessions: SkillSession[],
  skillName: string,
  level: number
): {
  totalSets: number
  totalHoldTime: number
  bestHold: number
  averageHold: number
  cleanHoldCount: number
  successRate: number
} {
  const relevantSessions = sessions.filter(
    s => s.skillName === skillName && s.level === level
  )
  
  const allSets = relevantSessions.flatMap(s => s.sets)
  
  return {
    totalSets: allSets.length,
    totalHoldTime: allSets.reduce((sum, s) => sum + s.holdSeconds, 0),
    bestHold: allSets.length > 0 ? Math.max(...allSets.map(s => s.holdSeconds)) : 0,
    averageHold: calculateAverageHold(allSets),
    cleanHoldCount: countCleanHolds(allSets),
    successRate: getSuccessRate(allSets),
  }
}
