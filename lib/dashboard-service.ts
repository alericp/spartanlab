// Dashboard service layer for aggregating platform data
// Composes existing services for unified dashboard view

import {
  getCurrentUser,
  getAthleteProfile,
  getSkillProgressions,
  type User,
  type AthleteProfile,
  type SkillProgression,
} from './data-service'
import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getOnboardingProfile } from './athlete-profile'
import {
  getLatestRecords,
  getPersonalRecords,
  getStrengthRecords,
  type ExerciseType,
  type StrengthRecord,
} from './strength-service'
import {
  getLatestProgram,
  GOAL_LABELS,
  type GeneratedProgram,
  type PrimaryGoal,
} from './program-service'
import { type AdaptiveProgram } from './adaptive-program-builder'
import { getProgramState } from './program-state'
import { SKILL_DEFINITIONS } from './skills'
import { getSkillSessions } from './skill-session-service'
import { generateSkillAnalysis } from './skill-readiness-engine'
import type { ReadinessStatus } from '@/types/skill-readiness'
import { calculateRelativeStrengthMetrics, getTierLabel } from './relative-strength-engine'
import { 
  getUnifiedSkillIntelligence, 
  generateTrainingAdjustments,
  type UnifiedSkillIntelligence,
  type SkillKey,
} from './skill-intelligence-layer'

export interface DashboardOverview {
  user: User
  profile: AthleteProfile
  progressions: SkillProgression[]
  strengthRecords: Record<ExerciseType, StrengthRecord | null>
  latestProgram: GeneratedProgram | null
}

export interface PrimarySkillSummary {
  skillName: string
  displayName: string
  currentLevelName: string
  targetLevelName: string
  progressScore: number
  hasData: boolean
  // New readiness fields
  readinessStatus?: ReadinessStatus
  weeklyDensity?: number
  bestHold?: number
  primaryLimiter?: string
}

export interface StrengthSummary {
  pullUp: StrengthRecord | null
  dip: StrengthRecord | null
  muscleUp: StrengthRecord | null
  hasAnyData: boolean
  // New relative strength fields
  pullTier?: string
  pushTier?: string
  pullRatio?: number
  pushRatio?: number
}

export interface ProgramSummary {
  goalLabel: string
  daysPerWeek: number
  sessionLength: number
  createdAt: string
  hasData: boolean
}

export interface CurrentFocus {
  mainFocus: string
  supportingFocus: string | null
  hasEnoughData: boolean
}

export interface RecentActivity {
  type: 'skill' | 'strength' | 'program'
  label: string
  timestamp: string
}

// Get complete dashboard overview
export function getDashboardOverview(): DashboardOverview {
  return {
    user: getCurrentUser(),
    profile: getAthleteProfile(),
    progressions: getSkillProgressions(),
    strengthRecords: getLatestRecords(),
    latestProgram: getLatestProgram(),
  }
}

// Get primary skill summary (based on profile goal or first progression)
export function getPrimarySkillSummary(overview: DashboardOverview): PrimarySkillSummary {
  const { profile, progressions } = overview
  
  // Find the skill matching primary goal, or use first progression
  let targetProgression: SkillProgression | null = null
  
  if (profile.primaryGoal) {
    targetProgression = progressions.find(p => p.skillName === profile.primaryGoal) || null
  }
  
  if (!targetProgression && progressions.length > 0) {
    targetProgression = progressions[0]
  }
  
  if (!targetProgression) {
    return {
      skillName: profile.primaryGoal || 'planche',
      displayName: profile.primaryGoal 
        ? (SKILL_DEFINITIONS as Record<string, { name: string }>)[profile.primaryGoal]?.name || 'Not Set'
        : 'Not Set',
      currentLevelName: 'Start tracking',
      targetLevelName: 'Set target',
      progressScore: 0,
      hasData: false,
    }
  }
  
  const skillDef = (SKILL_DEFINITIONS as Record<string, { name: string; levels: string[] }>)[targetProgression.skillName]
  
  // Get readiness analysis if we have session data
  let readinessStatus: ReadinessStatus | undefined
  let weeklyDensity: number | undefined
  let bestHold: number | undefined
  let primaryLimiter: string | undefined
  
  try {
    const sessions = getSkillSessions()
    const strengthRecords = getStrengthRecords()
    
    if (sessions.filter(s => s.skillName === targetProgression!.skillName).length > 0) {
      const analysis = generateSkillAnalysis(
        sessions,
        targetProgression.skillName,
        targetProgression.currentLevel,
        targetProgression.targetLevel,
        strengthRecords,
        profile.bodyweight,
        profile.experienceLevel
      )
      
      readinessStatus = analysis.readiness.status
      weeklyDensity = analysis.density.weeklyDensity
      bestHold = analysis.bestHold
      primaryLimiter = analysis.readiness.primaryLimiter !== 'none' && analysis.readiness.primaryLimiter !== 'no_data'
        ? analysis.readiness.primaryLimiter
        : undefined
    }
  } catch {
    // Silently fail if analysis isn't available
  }
  
  return {
    skillName: targetProgression.skillName,
    displayName: skillDef?.name || targetProgression.skillName,
    currentLevelName: skillDef?.levels[targetProgression.currentLevel] || `Level ${targetProgression.currentLevel}`,
    targetLevelName: skillDef?.levels[targetProgression.targetLevel] || `Level ${targetProgression.targetLevel}`,
    progressScore: targetProgression.progressScore,
    hasData: true,
    readinessStatus,
    weeklyDensity,
    bestHold,
    primaryLimiter,
  }
}

// Get strength summary
export function getStrengthSummary(overview: DashboardOverview): StrengthSummary {
  const { strengthRecords, profile } = overview
  const bodyweight = profile.bodyweight
  
  // Calculate relative strength metrics if we have bodyweight
  let pullTier: string | undefined
  let pushTier: string | undefined
  let pullRatio: number | undefined
  let pushRatio: number | undefined
  
  if (bodyweight && strengthRecords.weighted_pull_up) {
    const metrics = calculateRelativeStrengthMetrics(strengthRecords.weighted_pull_up, bodyweight)
    pullTier = getTierLabel(metrics.tier)
    pullRatio = metrics.oneRMRatio ?? undefined
  }
  
  if (bodyweight && strengthRecords.weighted_dip) {
    const metrics = calculateRelativeStrengthMetrics(strengthRecords.weighted_dip, bodyweight)
    pushTier = getTierLabel(metrics.tier)
    pushRatio = metrics.oneRMRatio ?? undefined
  }
  
  return {
    pullUp: strengthRecords.weighted_pull_up,
    dip: strengthRecords.weighted_dip,
    muscleUp: strengthRecords.weighted_muscle_up,
    hasAnyData: Object.values(strengthRecords).some(r => r !== null),
    pullTier,
    pushTier,
    pullRatio,
    pushRatio,
  }
}

// Get program summary - uses unified program state check
export function getProgramSummary(overview: DashboardOverview): ProgramSummary {
  const { latestProgram } = overview
  
  // Use unified program state check for consistency across the app
  const { adaptiveProgram, hasProgram } = getProgramState()
  
  if (hasProgram && adaptiveProgram) {
    return {
      goalLabel: adaptiveProgram.goalLabel,
      daysPerWeek: adaptiveProgram.trainingDaysPerWeek,
      sessionLength: adaptiveProgram.sessionLength,
      createdAt: adaptiveProgram.createdAt,
      hasData: true,
    }
  }
  
  if (!latestProgram) {
    return {
      goalLabel: 'No Program',
      daysPerWeek: 0,
      sessionLength: 0,
      createdAt: '',
      hasData: false,
    }
  }
  
  return {
    goalLabel: GOAL_LABELS[latestProgram.primaryGoal],
    daysPerWeek: latestProgram.trainingDaysPerWeek,
    sessionLength: latestProgram.sessionLength,
    createdAt: latestProgram.createdAt,
    hasData: true,
  }
}

// Get current focus recommendation
export function getCurrentFocusSummary(overview: DashboardOverview): CurrentFocus {
  const { profile, progressions, strengthRecords, latestProgram } = overview
  
  // Not enough data
  if (progressions.length === 0 && !Object.values(strengthRecords).some(r => r !== null) && !latestProgram) {
    return {
      mainFocus: 'Start by tracking a skill, logging strength, or generating your first program.',
      supportingFocus: null,
      hasEnoughData: false,
    }
  }
  
  let mainFocus = ''
  let supportingFocus: string | null = null
  
  // Build main focus from primary goal and skill data
  if (profile.primaryGoal) {
    const goalName = (SKILL_DEFINITIONS as Record<string, { name: string }>)[profile.primaryGoal]?.name || profile.primaryGoal
    const progression = progressions.find(p => p.skillName === profile.primaryGoal)
    
    if (progression) {
      const skillDef = (SKILL_DEFINITIONS as Record<string, { levels: string[] }>)[progression.skillName]
      const currentLevel = skillDef?.levels[progression.currentLevel] || 'current level'
      const targetLevel = skillDef?.levels[progression.targetLevel] || 'target'
      
      if (progression.progressScore < 100) {
        mainFocus = `Progress ${goalName} from ${currentLevel} toward ${targetLevel}.`
      } else {
        mainFocus = `${goalName} target reached. Consider setting a new milestone.`
      }
    } else {
      mainFocus = `Your primary goal is ${goalName}. Start tracking to see progress.`
    }
  } else if (progressions.length > 0) {
    const firstProg = progressions[0]
    const skillDef = (SKILL_DEFINITIONS as Record<string, { name: string; levels: string[] }>)[firstProg.skillName]
    mainFocus = `Continue ${skillDef?.name || firstProg.skillName} progression.`
  } else {
    mainFocus = 'Set a primary goal in settings to focus your training.'
  }
  
  // Build supporting focus from strength data
  if (strengthRecords.weighted_pull_up || strengthRecords.weighted_dip) {
    const pullStr = strengthRecords.weighted_pull_up ? `pull-up +${strengthRecords.weighted_pull_up.weightAdded}lbs` : ''
    const dipStr = strengthRecords.weighted_dip ? `dip +${strengthRecords.weighted_dip.weightAdded}lbs` : ''
    
    if (profile.primaryGoal === 'front_lever' || profile.primaryGoal === 'muscle_up') {
      if (strengthRecords.weighted_pull_up) {
        supportingFocus = `Maintain pulling strength at ${pullStr} to support skill work.`
      }
    } else if (profile.primaryGoal === 'planche' || profile.primaryGoal === 'handstand_pushup') {
      if (strengthRecords.weighted_dip) {
        supportingFocus = `Build pushing strength at ${dipStr} to support pressing movements.`
      }
    }
  }
  
  return {
    mainFocus,
    supportingFocus,
    hasEnoughData: true,
  }
}

// Get recent activity
export function getRecentActivity(overview: DashboardOverview): RecentActivity[] {
  const activities: RecentActivity[] = []
  
  // Check progressions
  for (const prog of overview.progressions) {
    activities.push({
      type: 'skill',
      label: `Updated ${(SKILL_DEFINITIONS as Record<string, { name: string }>)[prog.skillName]?.name || prog.skillName} progress`,
      timestamp: prog.lastUpdated,
    })
  }
  
  // Check strength records
  for (const [key, record] of Object.entries(overview.strengthRecords)) {
    if (record) {
      const exerciseName = key === 'weighted_pull_up' ? 'Pull-Up' : key === 'weighted_dip' ? 'Dip' : 'Muscle-Up'
      activities.push({
        type: 'strength',
        label: `Logged Weighted ${exerciseName}: +${record.weightAdded}lbs x${record.reps}`,
        timestamp: record.dateLogged,
      })
    }
  }
  
  // Check program
  if (overview.latestProgram) {
    activities.push({
      type: 'program',
      label: `Generated ${GOAL_LABELS[overview.latestProgram.primaryGoal]} program`,
      timestamp: overview.latestProgram.createdAt,
    })
  }
  
  // Sort by timestamp descending and take top 5
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

// Get unified skill intelligence for dashboard display
// This is the single source of truth for skill confidence and weak point summaries
export function getSkillIntelligenceSummary(overview: DashboardOverview): {
  intelligence: UnifiedSkillIntelligence | null
  primarySkillConfidence: number | null
  primaryLimiter: string | null
  topAdjustments: string[]
} {
  const { profile } = overview
  
  // Get skill sessions and strength records for intelligence calculation
  const skillSessions = getSkillSessions()
  const strengthRecords = getStrengthRecords()
  
  // Determine which skills to analyze based on profile goals
  const selectedSkills: SkillKey[] = ['front_lever', 'planche', 'muscle_up', 'handstand_pushup', 'handstand', 'l_sit', 'v_sit', 'i_sit']
  
  try {
    const intelligence = getUnifiedSkillIntelligence(
      skillSessions,
      strengthRecords,
      profile.bodyweight,
      selectedSkills
    )
    
    // Get primary skill confidence
    const primaryGoal = profile.primaryGoal as SkillKey | null
    const primarySkillIntel = primaryGoal ? intelligence.skills[primaryGoal] : null
    const primarySkillConfidence = primarySkillIntel?.confidence.confidence ?? null
    
    // Get primary limiter
    const primaryLimiter = primarySkillIntel?.weakPoints.primaryLimiter?.label ?? 
                           intelligence.globalLimiters.primaryPattern ?? null
    
    // Get top adjustments
    const adjustments = generateTrainingAdjustments(intelligence)
    const topAdjustments = adjustments.slice(0, 3).map(a => a.target)
    
    return {
      intelligence,
      primarySkillConfidence,
      primaryLimiter,
      topAdjustments,
    }
  } catch {
    return {
      intelligence: null,
      primarySkillConfidence: null,
      primaryLimiter: null,
      topAdjustments: [],
    }
  }
}

// Format relative time
export function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// =============================================================================
// CANONICAL DASHBOARD USER STATE
// Single source of truth for dashboard gating decisions
// =============================================================================

export interface DashboardUserState {
  /** User has completed onboarding profile basics */
  hasOnboardingProfile: boolean
  /** User has a usable workout program */
  hasUsableProgram: boolean
  /** User has logged at least one real workout */
  hasRealWorkoutLogs: boolean
  /** User has real strength records (not seeded) */
  hasRealStrengthRecords: boolean
  /** User has real skill sessions (not seeded) */
  hasRealSkillSessions: boolean
  /** Program state is trusted (not just an object in storage) */
  hasTrustedProgramState: boolean
  /** Performance data is trusted (enough real data for metrics) */
  hasTrustedPerformanceData: boolean
  /** User is in pre-program state (onboarding done but no program yet) */
  isPreProgramState: boolean
  /** User is in pre-workout state (program exists but no workouts logged) */
  isPreWorkoutState: boolean
  /** User is in early-program state (has program but < 3 workouts) */
  isEarlyProgramState: boolean
  /** User is in mature training state (enough data for full dashboard) */
  isMatureTrainingState: boolean
  /** User has meaningful real data (trusted for dashboard) */
  hasMeaningfulRealData: boolean
  /** Total workout count */
  workoutCount: number
  /** Trusted workout count (validated real workouts only) */
  trustedWorkoutCount: number
  /** Data confidence level for dashboard display decisions */
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
  /** Debug: diagnostic state label */
  stateLabel: 'new-user' | 'pre-program' | 'pre-workout' | 'active-trainer'
}

/**
 * Get canonical dashboard user state
 * Used to gate dashboard sections and ensure truthful display
 * 
 * GUARANTEED: Never throws - returns safe defaults
 */
export function getDashboardUserState(): DashboardUserState {
  try {
    // Get onboarding profile
    const onboardingProfile = getOnboardingProfile()
    const hasOnboardingProfile = !!(onboardingProfile && onboardingProfile.primaryGoal)
    
    // Get program state
    const programState = getProgramState()
    const hasUsableWorkoutProgram = programState.hasUsableWorkoutProgram
    
    // Get workout logs - validate they look like real workout data
    const workoutLogs = getWorkoutLogs()
    const trustedWorkouts = workoutLogs.filter(log => isTrustedWorkoutLog(log))
    const hasRealWorkoutLogs = trustedWorkouts.length > 0
    const workoutCount = workoutLogs.length
    const trustedWorkoutCount = trustedWorkouts.length
    
    // Get strength records - validate they look like real records
    const strengthRecords = getStrengthRecords()
    const trustedStrengthRecords = strengthRecords.filter(rec => isTrustedStrengthRecord(rec))
    const hasRealStrengthRecords = trustedStrengthRecords.length > 0
    
    // Get skill sessions - validate they look like real sessions
    const skillSessions = getSkillSessions()
    const trustedSkillSessions = skillSessions.filter(sess => isTrustedSkillSession(sess))
    const hasRealSkillSessions = trustedSkillSessions.length > 0
    
    // Determine program trust state
    const hasTrustedProgramState = hasUsableWorkoutProgram && 
      programState.sessionCount > 0 && 
      !!programState.adaptiveProgram
    
    // Determine performance data trust
    // Requires real workouts to trust performance metrics
    const hasTrustedPerformanceData = trustedWorkoutCount >= 3
    
    // Determine state phases
    const isPreProgramState = hasOnboardingProfile && !hasUsableWorkoutProgram
    const isPreWorkoutState = hasUsableWorkoutProgram && !hasRealWorkoutLogs
    const isEarlyProgramState = hasUsableWorkoutProgram && hasRealWorkoutLogs && trustedWorkoutCount < 3
    const isMatureTrainingState = trustedWorkoutCount >= 3
    
    // Meaningful real data = has real workouts OR (has program AND has real sessions/records)
    const hasMeaningfulRealData = hasRealWorkoutLogs || 
      (hasUsableWorkoutProgram && (hasRealSkillSessions || hasRealStrengthRecords))
    
    // Compute data confidence level
    let dataConfidence: DashboardUserState['dataConfidence'] = 'none'
    if (trustedWorkoutCount >= 10) {
      dataConfidence = 'high'
    } else if (trustedWorkoutCount >= 3) {
      dataConfidence = 'medium'
    } else if (trustedWorkoutCount >= 1 || hasUsableWorkoutProgram) {
      dataConfidence = 'low'
    }
    
    // Determine state label
    let stateLabel: DashboardUserState['stateLabel'] = 'new-user'
    if (hasRealWorkoutLogs) {
      stateLabel = 'active-trainer'
    } else if (hasUsableWorkoutProgram) {
      stateLabel = 'pre-workout'
    } else if (hasOnboardingProfile) {
      stateLabel = 'pre-program'
    }
    
    console.log('[dashboard-truth]', { 
      stateLabel, 
      workoutCount, 
      trustedWorkoutCount,
      dataConfidence,
      hasUsableWorkoutProgram, 
      hasOnboardingProfile,
      isMatureTrainingState,
    })
    
    return {
      hasOnboardingProfile,
      hasUsableProgram: hasUsableWorkoutProgram,
      hasRealWorkoutLogs,
      hasRealStrengthRecords,
      hasRealSkillSessions,
      hasTrustedProgramState,
      hasTrustedPerformanceData,
      isPreProgramState,
      isPreWorkoutState,
      isEarlyProgramState,
      isMatureTrainingState,
      hasMeaningfulRealData,
      workoutCount,
      trustedWorkoutCount,
      dataConfidence,
      stateLabel,
    }
  } catch (err) {
    console.error('[dashboard-truth] Error:', err)
    return {
      hasOnboardingProfile: false,
      hasUsableProgram: false,
      hasRealWorkoutLogs: false,
      hasRealStrengthRecords: false,
      hasRealSkillSessions: false,
      hasTrustedProgramState: false,
      hasTrustedPerformanceData: false,
      isPreProgramState: false,
      isPreWorkoutState: false,
      isEarlyProgramState: false,
      isMatureTrainingState: false,
      hasMeaningfulRealData: false,
      workoutCount: 0,
      trustedWorkoutCount: 0,
      dataConfidence: 'none',
      stateLabel: 'new-user',
    }
  }
}

// =============================================================================
// TRUSTED DATA VALIDATORS
// Narrow, deterministic checks for real user data vs seeded/debug data
// =============================================================================

/**
 * Check if a workout log appears to be real user data
 * Returns true for logs that have expected structure and completion indicators
 */
function isTrustedWorkoutLog(log: ReturnType<typeof getWorkoutLogs>[number]): boolean {
  try {
    // Must have basic required fields
    if (!log.id || !log.sessionDate || !log.createdAt) return false
    
    // Must have valid session date within reasonable range (not from the future or ancient past)
    const sessionDate = new Date(log.sessionDate)
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    if (sessionDate > now || sessionDate < oneYearAgo) return false
    
    // Must have exercises array (even if empty is technically valid after completion)
    if (!Array.isArray(log.exercises)) return false
    
    // If it has duration, must be reasonable (1-300 minutes)
    if (log.durationMinutes && (log.durationMinutes < 1 || log.durationMinutes > 300)) return false
    
    // Passed all checks - appears to be real user data
    return true
  } catch {
    return false
  }
}

/**
 * Check if a strength record appears to be real user data
 */
function isTrustedStrengthRecord(record: ReturnType<typeof getStrengthRecords>[number]): boolean {
  try {
    // Must have required fields
    if (!record.id || !record.exercise || !record.dateLogged) return false
    
    // Must have valid date
    const logDate = new Date(record.dateLogged)
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    if (logDate > now || logDate < oneYearAgo) return false
    
    // Must have reasonable values
    if (record.reps && (record.reps < 1 || record.reps > 100)) return false
    if (record.weightAdded && (record.weightAdded < 0 || record.weightAdded > 500)) return false
    
    return true
  } catch {
    return false
  }
}

/**
 * Check if a skill session appears to be real user data
 */
function isTrustedSkillSession(session: ReturnType<typeof getSkillSessions>[number]): boolean {
  try {
    // Must have required fields
    if (!session.id || !session.skillName || !session.sessionDate) return false
    
    // Must have valid date
    const sessionDate = new Date(session.sessionDate)
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    if (sessionDate > now || sessionDate < oneYearAgo) return false
    
    // Must have sets array
    if (!Array.isArray(session.sets)) return false
    
    return true
  } catch {
    return false
  }
}
