/**
 * Consistency & Momentum Engine
 * 
 * Central engine for protecting training consistency, handling missed sessions,
 * and maintaining long-term progress momentum. Integrates with recovery, progression,
 * and program builder systems.
 */

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { calculateTrainingMomentum, type TrainingMomentum, type MomentumLevel } from './training-momentum-engine'
import { calculateTrainingStreak, type TrainingStreak } from './progress-streak-engine'
import { getReadinessAssessment, type ReadinessAssessment } from './recovery-fatigue-engine'
import { getAthleteProfile } from './data-service'

// =============================================================================
// TYPES
// =============================================================================

export type ConsistencyState = 
  | 'strong'           // Consistent training, good momentum
  | 'building'         // Recovering/building consistency
  | 'rebuilding'       // Coming back from time off
  | 'starting'         // New or very little data

export type MissedSessionReason = 
  | 'fatigue'
  | 'life_event'
  | 'soreness'
  | 'motivation'
  | 'unknown'

export interface ConsistencyMetrics {
  // Weekly metrics
  sessionsThisWeek: number
  targetSessionsPerWeek: number
  weeklyCompletionRate: number
  
  // Monthly metrics
  sessionsThisMonth: number
  averageWeeklyFrequency: number
  
  // Streaks
  currentStreak: number
  longestStreak: number
  
  // Patterns
  missedSessionsLast14Days: number
  delayedSessionsLast14Days: number
  consecutiveRestDays: number
  daysSinceLastSession: number | null
  
  // Trend
  momentumTrend: 'improving' | 'stable' | 'declining'
  consistencyScore: number // 0-100
}

export interface MissedSessionAnalysis {
  detected: boolean
  daysOverdue: number
  reason: MissedSessionReason
  shouldShiftSchedule: boolean
  shouldCompressWeek: boolean
  shouldSkipWorkout: boolean
  shouldMergeElements: boolean
  adjustmentMessage: string
}

export interface ComebackWorkoutConfig {
  isComeback: boolean
  daysOff: number
  intensityMultiplier: number // 0.5-1.0
  volumeMultiplier: number // 0.5-1.0
  shouldReduceSets: boolean
  shouldSimplifyExercises: boolean
  shouldSkipMaxEffort: boolean
  warmupExtension: number // additional minutes
  focusAreas: ('skill_maintenance' | 'movement_quality' | 'base_strength')[]
  message: string
}

export interface ConsistencyAdjustment {
  // Volume adjustments
  volumeModifier: number // 0.5-1.2
  intensityModifier: number // 0.5-1.1
  
  // Specific adjustments
  reduceDensityWork: boolean
  reduceMobilityLoad: boolean
  prioritizeSkillQuality: boolean
  allowFasterProgression: boolean
  
  // Recovery protection
  extendWarmup: boolean
  addExtraRest: boolean
  
  // Reason
  reason: string
}

export interface ConsistencyStatus {
  state: ConsistencyState
  metrics: ConsistencyMetrics
  missedSession: MissedSessionAnalysis
  comebackConfig: ComebackWorkoutConfig
  adjustment: ConsistencyAdjustment
  
  // Simple messaging
  coachMessage: string
  shortLabel: string // For dashboard badge
  
  // Motivation
  encouragement: string
  habitTip: string
}

// =============================================================================
// STORAGE
// =============================================================================

const CONSISTENCY_STORAGE_KEY = 'spartanlab_consistency_data'
const SCHEDULED_SESSIONS_KEY = 'spartanlab_scheduled_sessions'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

interface StoredConsistencyData {
  lastAnalyzedDate: string
  scheduledDays: number[] // 0-6, Sunday-Saturday
  targetFrequency: number
  missedSessions: { date: string; reason: MissedSessionReason }[]
  comebackSessions: string[] // dates of comeback workouts
}

function getStoredConsistencyData(): StoredConsistencyData {
  if (!isBrowser()) {
    return {
      lastAnalyzedDate: new Date().toISOString(),
      scheduledDays: [1, 3, 5], // Mon, Wed, Fri default
      targetFrequency: 3,
      missedSessions: [],
      comebackSessions: [],
    }
  }
  
  const stored = localStorage.getItem(CONSISTENCY_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {
        lastAnalyzedDate: new Date().toISOString(),
        scheduledDays: [1, 3, 5],
        targetFrequency: 3,
        missedSessions: [],
        comebackSessions: [],
      }
    }
  }
  
  // Try to infer from athlete profile
  const profile = getAthleteProfile()
  const targetFrequency = profile?.trainingDays === '5-6' ? 5 :
                          profile?.trainingDays === '4-5' ? 4 :
                          profile?.trainingDays === '3-4' ? 3 : 3
  
  return {
    lastAnalyzedDate: new Date().toISOString(),
    scheduledDays: getDefaultScheduledDays(targetFrequency),
    targetFrequency,
    missedSessions: [],
    comebackSessions: [],
  }
}

function saveConsistencyData(data: StoredConsistencyData): void {
  if (!isBrowser()) return
  localStorage.setItem(CONSISTENCY_STORAGE_KEY, JSON.stringify(data))
}

function getDefaultScheduledDays(frequency: number): number[] {
  switch (frequency) {
    case 2: return [1, 4] // Mon, Thu
    case 3: return [1, 3, 5] // Mon, Wed, Fri
    case 4: return [1, 2, 4, 5] // Mon, Tue, Thu, Fri
    case 5: return [1, 2, 3, 4, 5] // Mon-Fri
    case 6: return [1, 2, 3, 4, 5, 6] // Mon-Sat
    default: return [1, 3, 5]
  }
}

// =============================================================================
// CONSISTENCY METRICS
// =============================================================================

function calculateConsistencyMetrics(logs: WorkoutLog[], targetFrequency: number): ConsistencyMetrics {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Get workout dates
  const workoutDates = logs.map(log => log.sessionDate.split('T')[0])
  const uniqueDates = [...new Set(workoutDates)]
  
  // This week (Sunday to today)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const sessionsThisWeek = uniqueDates.filter(date => {
    const d = new Date(date)
    return d >= startOfWeek && d <= now
  }).length
  
  // This month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sessionsThisMonth = uniqueDates.filter(date => {
    const d = new Date(date)
    return d >= startOfMonth && d <= now
  }).length
  
  // Last 14 days for average
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const sessionsLast14Days = uniqueDates.filter(date => {
    const d = new Date(date)
    return d >= twoWeeksAgo && d <= now
  }).length
  const averageWeeklyFrequency = (sessionsLast14Days / 2)
  
  // Days since last session
  let daysSinceLastSession: number | null = null
  if (uniqueDates.length > 0) {
    const sortedDates = uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    const lastDate = new Date(sortedDates[0])
    daysSinceLastSession = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  }
  
  // Consecutive rest days
  let consecutiveRestDays = 0
  const checkDate = new Date(now)
  while (consecutiveRestDays < 14) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (uniqueDates.includes(dateStr)) break
    consecutiveRestDays++
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  // Streak calculation (simple version)
  const streak = calculateTrainingStreak()
  
  // Momentum trend
  const momentum = calculateTrainingMomentum()
  
  // Consistency score (0-100)
  const weeklyCompletionRate = targetFrequency > 0 ? sessionsThisWeek / targetFrequency : 0
  const frequencyScore = Math.min(100, (averageWeeklyFrequency / targetFrequency) * 100)
  const recencyBonus = daysSinceLastSession !== null && daysSinceLastSession <= 2 ? 10 : 0
  const consistencyScore = Math.round(Math.min(100, frequencyScore * 0.7 + weeklyCompletionRate * 30 + recencyBonus))
  
  return {
    sessionsThisWeek,
    targetSessionsPerWeek: targetFrequency,
    weeklyCompletionRate: Math.round(weeklyCompletionRate * 100) / 100,
    sessionsThisMonth,
    averageWeeklyFrequency: Math.round(averageWeeklyFrequency * 10) / 10,
    currentStreak: streak.currentStreak,
    longestStreak: streak.bestStreak,
    missedSessionsLast14Days: Math.max(0, targetFrequency * 2 - sessionsLast14Days),
    delayedSessionsLast14Days: 0, // Would need scheduled data to calculate
    consecutiveRestDays,
    daysSinceLastSession,
    momentumTrend: momentum.trend,
    consistencyScore,
  }
}

// =============================================================================
// MISSED SESSION DETECTION
// =============================================================================

function analyzeMissedSessions(
  metrics: ConsistencyMetrics,
  storedData: StoredConsistencyData
): MissedSessionAnalysis {
  const { daysSinceLastSession, consecutiveRestDays, targetSessionsPerWeek } = metrics
  
  // No session data at all
  if (daysSinceLastSession === null) {
    return {
      detected: false,
      daysOverdue: 0,
      reason: 'unknown',
      shouldShiftSchedule: false,
      shouldCompressWeek: false,
      shouldSkipWorkout: false,
      shouldMergeElements: false,
      adjustmentMessage: '',
    }
  }
  
  // Calculate expected gap between sessions
  const expectedGap = Math.ceil(7 / targetSessionsPerWeek)
  const overdueThreshold = expectedGap + 1 // Allow 1 day grace period
  
  // Check if session is overdue
  const isOverdue = daysSinceLastSession > overdueThreshold
  const daysOverdue = isOverdue ? daysSinceLastSession - expectedGap : 0
  
  if (!isOverdue) {
    return {
      detected: false,
      daysOverdue: 0,
      reason: 'unknown',
      shouldShiftSchedule: false,
      shouldCompressWeek: false,
      shouldSkipWorkout: false,
      shouldMergeElements: false,
      adjustmentMessage: '',
    }
  }
  
  // Determine reason (heuristic)
  let reason: MissedSessionReason = 'unknown'
  const readiness = getReadinessAssessment()
  
  if (readiness.state === 'recovery_focused' || readiness.factors.soreness !== 'none') {
    reason = daysSinceLastSession > 4 ? 'fatigue' : 'soreness'
  } else if (readiness.factors.motivation === 'low') {
    reason = 'motivation'
  } else if (daysOverdue > 3) {
    reason = 'life_event'
  }
  
  // Determine adjustments
  const shouldShiftSchedule = daysOverdue >= 2 && daysOverdue < 5
  const shouldCompressWeek = daysOverdue >= 1 && daysOverdue < 3
  const shouldSkipWorkout = daysOverdue >= 5 // Too long, just move on
  const shouldMergeElements = daysOverdue >= 2 && daysOverdue < 4
  
  // Generate message
  let adjustmentMessage = ''
  if (shouldSkipWorkout) {
    adjustmentMessage = "No worries about the missed time. Let's focus on moving forward."
  } else if (shouldMergeElements) {
    adjustmentMessage = "Next session will include key elements from the missed workout."
  } else if (shouldCompressWeek) {
    adjustmentMessage = "Your schedule has been adjusted to maintain weekly progress."
  } else if (shouldShiftSchedule) {
    adjustmentMessage = "Schedule shifted slightly to keep you on track."
  }
  
  return {
    detected: true,
    daysOverdue,
    reason,
    shouldShiftSchedule,
    shouldCompressWeek,
    shouldSkipWorkout,
    shouldMergeElements,
    adjustmentMessage,
  }
}

// =============================================================================
// COMEBACK WORKOUT LOGIC
// =============================================================================

function calculateComebackConfig(metrics: ConsistencyMetrics): ComebackWorkoutConfig {
  const { daysSinceLastSession, consecutiveRestDays } = metrics
  
  // Default - no comeback needed
  const defaultConfig: ComebackWorkoutConfig = {
    isComeback: false,
    daysOff: 0,
    intensityMultiplier: 1.0,
    volumeMultiplier: 1.0,
    shouldReduceSets: false,
    shouldSimplifyExercises: false,
    shouldSkipMaxEffort: false,
    warmupExtension: 0,
    focusAreas: [],
    message: '',
  }
  
  if (daysSinceLastSession === null) {
    return defaultConfig
  }
  
  // Comeback thresholds
  const MILD_COMEBACK_DAYS = 5
  const MODERATE_COMEBACK_DAYS = 8
  const SIGNIFICANT_COMEBACK_DAYS = 14
  
  if (daysSinceLastSession < MILD_COMEBACK_DAYS) {
    return defaultConfig
  }
  
  // Mild comeback (5-7 days off)
  if (daysSinceLastSession < MODERATE_COMEBACK_DAYS) {
    return {
      isComeback: true,
      daysOff: daysSinceLastSession,
      intensityMultiplier: 0.85,
      volumeMultiplier: 0.9,
      shouldReduceSets: false,
      shouldSimplifyExercises: false,
      shouldSkipMaxEffort: true,
      warmupExtension: 2,
      focusAreas: ['movement_quality', 'base_strength'],
      message: "Welcome back. This session eases you back into training.",
    }
  }
  
  // Moderate comeback (8-13 days off)
  if (daysSinceLastSession < SIGNIFICANT_COMEBACK_DAYS) {
    return {
      isComeback: true,
      daysOff: daysSinceLastSession,
      intensityMultiplier: 0.75,
      volumeMultiplier: 0.8,
      shouldReduceSets: true,
      shouldSimplifyExercises: false,
      shouldSkipMaxEffort: true,
      warmupExtension: 5,
      focusAreas: ['movement_quality', 'skill_maintenance'],
      message: "Good to see you back. This workout rebuilds your rhythm.",
    }
  }
  
  // Significant comeback (14+ days off)
  return {
    isComeback: true,
    daysOff: daysSinceLastSession,
    intensityMultiplier: 0.65,
    volumeMultiplier: 0.6,
    shouldReduceSets: true,
    shouldSimplifyExercises: true,
    shouldSkipMaxEffort: true,
    warmupExtension: 8,
    focusAreas: ['movement_quality', 'skill_maintenance', 'base_strength'],
    message: "Welcome back! This session is designed to rebuild your momentum gently.",
  }
}

// =============================================================================
// CONSISTENCY STATE
// =============================================================================

function determineConsistencyState(
  metrics: ConsistencyMetrics,
  momentum: TrainingMomentum,
  comebackConfig: ComebackWorkoutConfig
): ConsistencyState {
  // Comeback takes priority
  if (comebackConfig.isComeback) {
    return 'rebuilding'
  }
  
  // Check momentum and consistency score
  const { consistencyScore, averageWeeklyFrequency, targetSessionsPerWeek } = metrics
  const frequencyRatio = averageWeeklyFrequency / targetSessionsPerWeek
  
  // Not enough data
  if (metrics.sessionsThisMonth < 2) {
    return 'starting'
  }
  
  // Strong consistency
  if (consistencyScore >= 75 && frequencyRatio >= 0.85 && momentum.level !== 'low') {
    return 'strong'
  }
  
  // Building consistency
  if (consistencyScore >= 40 || (momentum.trend === 'increasing' && consistencyScore >= 30)) {
    return 'building'
  }
  
  // Rebuilding
  return 'rebuilding'
}

// =============================================================================
// TRAINING ADJUSTMENTS
// =============================================================================

function calculateConsistencyAdjustment(
  state: ConsistencyState,
  metrics: ConsistencyMetrics,
  comebackConfig: ComebackWorkoutConfig,
  readiness: ReadinessAssessment
): ConsistencyAdjustment {
  // Strong consistency - allow slightly more
  if (state === 'strong' && metrics.momentumTrend === 'improving') {
    return {
      volumeModifier: 1.0,
      intensityModifier: 1.0,
      reduceDensityWork: false,
      reduceMobilityLoad: false,
      prioritizeSkillQuality: false,
      allowFasterProgression: true,
      extendWarmup: false,
      addExtraRest: false,
      reason: 'Strong consistency supports normal progression.',
    }
  }
  
  // Rebuilding after time off
  if (comebackConfig.isComeback) {
    return {
      volumeModifier: comebackConfig.volumeMultiplier,
      intensityModifier: comebackConfig.intensityMultiplier,
      reduceDensityWork: true,
      reduceMobilityLoad: comebackConfig.daysOff > 10,
      prioritizeSkillQuality: true,
      allowFasterProgression: false,
      extendWarmup: true,
      addExtraRest: true,
      reason: 'Comeback workout with reduced load.',
    }
  }
  
  // Declining momentum - protect consistency
  if (metrics.momentumTrend === 'declining') {
    return {
      volumeModifier: 0.9,
      intensityModifier: 0.95,
      reduceDensityWork: true,
      reduceMobilityLoad: false,
      prioritizeSkillQuality: true,
      allowFasterProgression: false,
      extendWarmup: false,
      addExtraRest: false,
      reason: 'Lighter session to protect consistency.',
    }
  }
  
  // Building state - moderate approach
  if (state === 'building') {
    return {
      volumeModifier: 0.95,
      intensityModifier: 1.0,
      reduceDensityWork: false,
      reduceMobilityLoad: false,
      prioritizeSkillQuality: false,
      allowFasterProgression: false,
      extendWarmup: false,
      addExtraRest: false,
      reason: 'Building momentum steadily.',
    }
  }
  
  // Default - normal training
  return {
    volumeModifier: 1.0,
    intensityModifier: 1.0,
    reduceDensityWork: false,
    reduceMobilityLoad: false,
    prioritizeSkillQuality: false,
    allowFasterProgression: false,
    extendWarmup: false,
    addExtraRest: false,
    reason: '',
  }
}

// =============================================================================
// MESSAGING
// =============================================================================

function getCoachMessage(
  state: ConsistencyState,
  metrics: ConsistencyMetrics,
  comebackConfig: ComebackWorkoutConfig
): string {
  if (comebackConfig.isComeback) {
    return comebackConfig.message
  }
  
  switch (state) {
    case 'strong':
      if (metrics.currentStreak >= 7) {
        return `You've trained consistently for ${Math.floor(metrics.currentStreak / 7)} weeks.`
      }
      return 'Your training rhythm is strong.'
      
    case 'building':
      if (metrics.momentumTrend === 'improving') {
        return 'Your consistency is improving.'
      }
      return 'Keep building your training habit.'
      
    case 'rebuilding':
      return 'Focus on showing up. Progress follows consistency.'
      
    case 'starting':
      return 'Every session builds your foundation.'
      
    default:
      return 'Stay consistent. Small sessions still move you forward.'
  }
}

function getShortLabel(state: ConsistencyState): string {
  switch (state) {
    case 'strong': return 'Strong'
    case 'building': return 'Building'
    case 'rebuilding': return 'Rebuilding'
    case 'starting': return 'Starting'
    default: return 'Building'
  }
}

function getEncouragement(state: ConsistencyState, metrics: ConsistencyMetrics): string {
  if (state === 'strong' && metrics.currentStreak >= 14) {
    return 'Your dedication is building real results.'
  }
  
  if (metrics.momentumTrend === 'improving') {
    return 'Your momentum is building.'
  }
  
  if (state === 'rebuilding') {
    return 'Consistency beats intensity. Just show up.'
  }
  
  return 'Every session counts.'
}

function getHabitTip(state: ConsistencyState, metrics: ConsistencyMetrics): string {
  const tips: Record<ConsistencyState, string[]> = {
    strong: [
      'Maintain your rhythm even during busy weeks.',
      'Quality over quantity keeps momentum strong.',
    ],
    building: [
      'Same time, same days helps build the habit.',
      'Start with showing up. Intensity can come later.',
    ],
    rebuilding: [
      'A 15-minute session beats a skipped workout.',
      'Focus on consistency first, progression second.',
    ],
    starting: [
      'Start small. Two sessions per week is a solid foundation.',
      'Schedule your training like any important appointment.',
    ],
  }
  
  const stateTips = tips[state] || tips.building
  return stateTips[Math.floor(Math.random() * stateTips.length)]
}

// =============================================================================
// MAIN EXPORTS
// =============================================================================

// Filter to only trusted workouts - excludes demo/seed/untrusted data
// PHASE 5: Stricter filtering - require explicit trust OR known good sourceRoute
function getTrustedWorkouts() {
  return getWorkoutLogs().filter(log => {
    // Reject demo workouts
    if (log.sourceRoute === 'demo' || (log as any).isDemo === true) return false
    // Reject explicitly untrusted
    if (log.trusted === false) return false
    // PHASE 5: Require explicit trust OR known good sourceRoute
    const hasValidSource = log.sourceRoute === 'workout_session' || 
                          log.sourceRoute === 'first_session' || 
                          log.sourceRoute === 'quick_log'
    const hasExplicitTrust = log.trusted === true
    return hasValidSource || hasExplicitTrust
  })
}

/**
 * Get the current consistency status for the user
 */
export function getConsistencyStatus(): ConsistencyStatus {
  const logs = getTrustedWorkouts()
  const storedData = getStoredConsistencyData()
  const momentum = getTrainingMomentum()
  const readiness = getReadinessAssessment()
  
  // Calculate metrics
  const metrics = calculateConsistencyMetrics(logs, storedData.targetFrequency)
  
  // Analyze missed sessions
  const missedSession = analyzeMissedSessions(metrics, storedData)
  
  // Calculate comeback config
  const comebackConfig = calculateComebackConfig(metrics)
  
  // Determine state
  const state = determineConsistencyState(metrics, momentum, comebackConfig)
  
  // Calculate adjustments
  const adjustment = calculateConsistencyAdjustment(state, metrics, comebackConfig, readiness)
  
  return {
    state,
    metrics,
    missedSession,
    comebackConfig,
    adjustment,
    coachMessage: getCoachMessage(state, metrics, comebackConfig),
    shortLabel: getShortLabel(state),
    encouragement: getEncouragement(state, metrics),
    habitTip: getHabitTip(state, metrics),
  }
}

/**
 * Get just the comeback workout configuration
 */
export function getComebackWorkoutConfig(): ComebackWorkoutConfig {
  const logs = getTrustedWorkouts()
  const storedData = getStoredConsistencyData()
  const metrics = calculateConsistencyMetrics(logs, storedData.targetFrequency)
  return calculateComebackConfig(metrics)
}

/**
 * Get consistency-based training adjustments
 */
export function getConsistencyAdjustments(): ConsistencyAdjustment {
  const status = getConsistencyStatus()
  return status.adjustment
}

/**
 * Record a missed session with reason
 */
export function recordMissedSession(reason: MissedSessionReason): void {
  const data = getStoredConsistencyData()
  data.missedSessions.push({
    date: new Date().toISOString(),
    reason,
  })
  // Keep only last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  data.missedSessions = data.missedSessions.filter(m => m.date >= thirtyDaysAgo)
  saveConsistencyData(data)
}

/**
 * Update target training frequency
 */
export function setTargetFrequency(frequency: number): void {
  const data = getStoredConsistencyData()
  data.targetFrequency = Math.max(1, Math.min(7, frequency))
  data.scheduledDays = getDefaultScheduledDays(data.targetFrequency)
  saveConsistencyData(data)
}

/**
 * Check if current session should be a comeback workout
 */
export function isCombackSession(): boolean {
  const config = getComebackWorkoutConfig()
  return config.isComeback
}

/**
 * Get simple consistency badge for dashboard
 */
export function getConsistencyBadge(): { label: string; state: ConsistencyState; color: string } {
  const status = getConsistencyStatus()
  
  const colors: Record<ConsistencyState, string> = {
    strong: '#22C55E',
    building: '#C1121F',
    rebuilding: '#4F6D8A',
    starting: '#6B7280',
  }
  
  return {
    label: status.shortLabel,
    state: status.state,
    color: colors[status.state],
  }
}

/**
 * Should the user progress on their current exercise?
 * Integrates consistency with progression decisions
 */
export function shouldAllowProgression(): { allowed: boolean; reason: string } {
  const status = getConsistencyStatus()
  
  // Comeback sessions should not progress
  if (status.comebackConfig.isComeback) {
    return {
      allowed: false,
      reason: 'Focus on rebuilding consistency before progressing.',
    }
  }
  
  // Declining momentum - hold steady
  if (status.metrics.momentumTrend === 'declining') {
    return {
      allowed: false,
      reason: 'Maintain current level while building consistency.',
    }
  }
  
  // Strong consistency allows progression
  if (status.state === 'strong') {
    return {
      allowed: true,
      reason: 'Strong consistency supports progression.',
    }
  }
  
  // Building - allow with caution
  if (status.state === 'building' && status.metrics.consistencyScore >= 50) {
    return {
      allowed: true,
      reason: 'Good consistency allows careful progression.',
    }
  }
  
  // Default - hold steady
  return {
    allowed: false,
    reason: 'Build more consistency before progressing.',
  }
}
