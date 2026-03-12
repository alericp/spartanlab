// Skill Readiness Engine Types
// Core types for the readiness-aware progression system

import type { SkillName, ExerciseType } from './domain'

// =============================================================================
// SKILL SESSION & HOLD TYPES
// =============================================================================

/**
 * Quality rating for a single hold/set
 * - clean: Solid, controlled hold with proper form
 * - shaky: Hold maintained but with visible instability
 * - failed: Could not complete the target hold
 */
export type HoldQuality = 'clean' | 'shaky' | 'failed'

/**
 * Band assistance used during a set
 */
export type ResistanceBandColor = 'yellow' | 'red' | 'black' | 'purple' | 'green' | 'blue'

export interface BandUsage {
  bandColor?: ResistanceBandColor
  assisted: boolean
}

/**
 * Individual set within a skill session
 */
export interface SkillSet {
  holdSeconds: number
  quality: HoldQuality
  timestamp?: string
  reps?: number
  band?: BandUsage // Optional band assistance tracking
}

/**
 * A single training session for a skill
 */
export interface SkillSession {
  id: string
  skillName: SkillName | string
  level: number // The progression level trained
  sets: SkillSet[]
  sessionDate: string
  sessionDensity: number // Total hold time in seconds
  notes?: string
  createdAt: string
}

// =============================================================================
// DENSITY METRICS
// =============================================================================

export interface SkillDensityMetrics {
  sessionDensity: number // Total hold time in most recent session (seconds)
  weeklyDensity: number // Total hold time over past 7 days (seconds)
  rollingAverageDensity: number // Average session density over recent sessions
  sessionsThisWeek: number
  totalSessions: number
  lastSessionDate: string | null
}

// =============================================================================
// SUPPORT STRENGTH
// =============================================================================

/**
 * Support strength assessment for a skill
 */
export interface SupportStrengthAssessment {
  // Overall readiness score 0-100
  score: number
  // Individual support factors
  factors: SupportFactor[]
  // Whether we have enough data to assess
  hasData: boolean
  // Missing data indicators
  missingData: string[]
}

export interface SupportFactor {
  name: string
  status: 'sufficient' | 'developing' | 'insufficient' | 'unknown'
  currentValue?: number
  targetValue?: number
  unit?: string
  note?: string
}

// =============================================================================
// READINESS DECISION
// =============================================================================

/**
 * The primary readiness decision output
 */
export type ReadinessStatus = 
  | 'progress_now'      // Ready to move to next full progression
  | 'micro_progress'    // Ready for an in-between step
  | 'stay_current'      // Continue building at current level
  | 'stabilize'         // Need to address instability/fatigue first

export type PrimaryLimiter = 
  | 'insufficient_density'
  | 'insufficient_ownership'
  | 'insufficient_support_strength'
  | 'unstable_trend'
  | 'recent_fatigue'
  | 'no_data'
  | 'none' // For progress_now cases

/**
 * Complete readiness decision with reasoning
 */
export interface ReadinessDecision {
  status: ReadinessStatus
  confidence: number // 0-100, how confident we are in this recommendation
  primaryLimiter: PrimaryLimiter
  explanation: string // Short science-backed explanation
  detailedFactors: {
    ownershipScore: number // 0-100
    supportStrengthScore: number // 0-100  
    densityScore: number // 0-100
    trendScore: number // 0-100
  }
}

// =============================================================================
// MICRO PROGRESSIONS
// =============================================================================

export interface MicroProgression {
  name: string
  description: string
  fromLevel: number
  towardLevel: number
  cues: string[] // 2-3 technique cues
}

// =============================================================================
// NEXT STEP GUIDANCE
// =============================================================================

export interface NextStepGuidance {
  priorities: string[] // 2-4 main training priorities
  exercises: ExerciseRecommendation[]
  focusAreas: string[]
}

export interface ExerciseRecommendation {
  name: string
  purpose: string
  setsReps?: string
}

// =============================================================================
// SKILL ANALYSIS (COMPLETE OUTPUT)
// =============================================================================

/**
 * Complete skill analysis including all metrics and recommendations
 */
export interface SkillAnalysis {
  skillName: SkillName | string
  currentLevel: number
  targetLevel: number
  
  // Core metrics
  bestHold: number
  averageHold: number
  density: SkillDensityMetrics
  
  // Readiness assessment
  readiness: ReadinessDecision
  supportStrength: SupportStrengthAssessment
  
  // Recommendations
  microProgression: MicroProgression | null // null if not applicable
  nextSteps: NextStepGuidance
  
  // Recent history summary
  recentSessions: number
  recentTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
}

// =============================================================================
// SKILL SUPPORT MAPPINGS
// =============================================================================

/**
 * Mapping of which strength exercises support which skills
 */
export type SkillSupportMapping = {
  [K in SkillName]: {
    primarySupport: ExerciseType[]
    targetOneRM: number // Target 1RM as percentage of bodyweight
    additionalFactors: string[]
  }
}

// =============================================================================
// THRESHOLDS & CONSTANTS
// =============================================================================

export interface ReadinessThresholds {
  // Minimum holds for level ownership
  minCleanHolds: number
  minAverageHoldSeconds: number
  minSessionsForReliability: number
  
  // Density requirements
  minWeeklyDensitySeconds: number
  minSessionDensitySeconds: number
  
  // Support strength requirements
  minSupportStrengthScore: number
  
  // Trend requirements
  minTrendStability: number
}

/**
 * Default thresholds - can be adjusted per skill or experience level
 */
export const DEFAULT_READINESS_THRESHOLDS: ReadinessThresholds = {
  minCleanHolds: 4,
  minAverageHoldSeconds: 6,
  minSessionsForReliability: 3,
  minWeeklyDensitySeconds: 45,
  minSessionDensitySeconds: 20,
  minSupportStrengthScore: 60,
  minTrendStability: 70,
}
