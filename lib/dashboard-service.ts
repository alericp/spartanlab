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
import { getLatestAdaptiveProgram, type AdaptiveProgram } from './adaptive-program-builder'
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

// Get program summary
export function getProgramSummary(overview: DashboardOverview): ProgramSummary {
  const { latestProgram } = overview
  
  // Check for adaptive program first
  const adaptiveProgram = getLatestAdaptiveProgram()
  
  if (adaptiveProgram) {
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
