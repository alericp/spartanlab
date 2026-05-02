// First Session Service
// Generates personalized reasoning and context for the first training session
// Uses athlete profile, constraints, readiness, and training style to explain why this session was chosen

import {
  getOnboardingProfile,
  type OnboardingProfile,
  type ReadinessCalibration,
  calculateReadinessScores,
} from './athlete-profile'
import { type AdaptiveProgram, type AdaptiveSession } from './adaptive-program-builder'
import { type ProgramReasoning } from './onboarding-service'
import { getConstraintInsight } from './constraint-engine'


// =============================================================================
// TYPES
// =============================================================================

export interface FirstSessionReasoning {
  headline: string
  explanation: string
  keyFactors: string[]
  readinessHighlights: {
    strength: string | null
    limiter: string | null
  }
  sessionOverview: {
    title: string
    focus: string
    estimatedMinutes: number
    exerciseCount: number
  }
}

export interface FirstSessionContext {
  isFirstSession: boolean
  hasCompletedFirstSession: boolean
  sessionReadyStatus: 'ready' | 'generating' | 'not_available' | 'error'
  reasoning: FirstSessionReasoning | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GOAL_DISPLAY_MAP: Record<string, string> = {
  front_lever: 'Front Lever',
  planche: 'Planche',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'Handstand Push-Up',
  weighted_strength: 'Weighted Strength',
  general_strength: 'General Strength',
  weighted_pull: 'Weighted Pull-Ups',
  weighted_dip: 'Weighted Dips',
}

const FOCUS_DISPLAY_MAP: Record<string, string> = {
  skill: 'Skill Development',
  strength: 'Strength Building',
  pull: 'Pulling Strength',
  push: 'Pushing Strength',
  legs: 'Lower Body',
  core: 'Core Training',
  recovery: 'Active Recovery',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get display name for a goal
 */
function getGoalDisplay(goal: string | null | undefined): string {
  if (!goal) return 'Calisthenics Training'
  return GOAL_DISPLAY_MAP[goal] || goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Get display name for a focus area
 */
function getFocusDisplay(focus: string | null | undefined): string {
  if (!focus) return 'Full Body Training'
  return FOCUS_DISPLAY_MAP[focus] || focus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// =============================================================================
// [PRE-AB6 BUILD GREEN GATE / FIRST-SESSION READINESS BOUNDARY MAPPER]
// Boundary mapper: OnboardingProfile is broader than ReadinessCalibration.
// Only pass readiness-calibration fields into calculateReadinessScores.
//
// calculateReadinessScores(calibration: Partial<ReadinessCalibration>) reads
// 5 raw answer fields nested under OnboardingProfile.readinessCalibration:
//   trainingConsistency | recoveryTolerance | strengthPerception
//   | skillFamiliarity | bodyType
//
// Returns {} when calibration is absent so the calculator falls back to
// its built-in middle-of-road defaults rather than us inventing answers.
// Mirrors components/onboarding/OnboardingCompleteClient.tsx — duplicated
// locally to avoid widening the lib surface and to keep this readiness
// boundary self-contained per the bounded corridor scope.
// =============================================================================
function toReadinessCalibrationInput(
  profile: OnboardingProfile | null | undefined,
): Partial<ReadinessCalibration> {
  if (!profile) return {}

  const calibration = profile.readinessCalibration
  if (!calibration) return {}

  return {
    trainingConsistency: calibration.trainingConsistency,
    recoveryTolerance: calibration.recoveryTolerance,
    strengthPerception: calibration.strengthPerception,
    skillFamiliarity: calibration.skillFamiliarity,
    bodyType: calibration.bodyType,
  }
}

/**
 * Analyze profile to find primary strengths and limiters
 *
 * [PRE-AB6 BUILD GREEN GATE / READINESS CONTRACT REALIGNMENT]
 * The authoritative ReadinessScores contract (lib/athlete-profile.ts:812-817)
 * exposes exactly 4 fields:
 *   strengthPotentialScore | skillAdaptationScore
 *   | recoveryToleranceScore | volumeToleranceScore
 * The previous code read stale fields (pullStrength, pushStrength,
 * compression, straightArmStrength, overall) that no longer exist on
 * ReadinessScores. There is also no `overall` field — readinessScore is
 * derived as the average of the 4 finite numeric scores, matching the
 * 0-100 internal scale of each individual score.
 */
function analyzeReadinessProfile(profile: OnboardingProfile | null): {
  primaryStrength: string | null
  primaryLimiter: string | null
  readinessScore: number
} {
  if (!profile) {
    return { primaryStrength: null, primaryLimiter: null, readinessScore: 50 }
  }

  const readiness = calculateReadinessScores(toReadinessCalibrationInput(profile))

  // Build scores array from the authoritative 4-field ReadinessScores
  // contract. Labels are human-readable for use in keyFactors copy.
  const scores: Array<{ key: string; value: number }> = [
    { key: 'Strength Potential', value: readiness.strengthPotentialScore },
    { key: 'Skill Adaptation', value: readiness.skillAdaptationScore },
    { key: 'Recovery Tolerance', value: readiness.recoveryToleranceScore },
    { key: 'Volume Tolerance', value: readiness.volumeToleranceScore },
  ].filter(s => Number.isFinite(s.value) && s.value > 0)

  // Derive overall readinessScore as the average of the finite scores.
  // Falls back to the calculator default (50) when nothing is finite.
  const finiteValues = scores.map(s => s.value)
  const readinessScore =
    finiteValues.length > 0
      ? Math.round(finiteValues.reduce((sum, v) => sum + v, 0) / finiteValues.length)
      : 50

  if (scores.length === 0) {
    return { primaryStrength: null, primaryLimiter: null, readinessScore }
  }

  const sorted = [...scores].sort((a, b) => b.value - a.value)
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  return {
    primaryStrength: top && top.value >= 65 ? top.key : null,
    primaryLimiter: bottom && bottom.value < 50 ? bottom.key : null,
    readinessScore,
  }
}

/**
 * Generate constraint-based explanation from profile data
 */
function generateConstraintExplanation(
  _constraintInsight: unknown,
  profile: OnboardingProfile | null
): string | null {
  // Fallback to profile-based constraint explanation
  if (Array.isArray(profile?.jointCautions) && profile.jointCautions.length > 0) {
    const cautionMap: Record<string, string> = {
      shoulders: 'shoulder stability exercises are emphasized',
      wrists: 'wrist conditioning is integrated',
      elbows: 'elbow-safe progressions are selected',
      lower_back: 'core stability is prioritized',
    }
    const firstCaution = profile.jointCautions[0]
    if (cautionMap[firstCaution]) {
      return `Based on your profile, ${cautionMap[firstCaution]}.`
    }
  }

  return null
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Generate personalized reasoning for the first session
 */
export function generateFirstSessionReasoning(
  session: AdaptiveSession | null,
  program: AdaptiveProgram | null,
  programReasoning: ProgramReasoning | null,
  profile: OnboardingProfile | null
): FirstSessionReasoning | null {
  if (!session) {
    return null
  }

  const goalDisplay = getGoalDisplay(program?.goalLabel || profile?.primaryGoal)
  const focusDisplay = getFocusDisplay(session.focus)
  
  // Analyze readiness
  const readinessAnalysis = analyzeReadinessProfile(profile)
  
  // Get constraint insight
  let constraintInsightResult: ReturnType<typeof getConstraintInsight> | null = null
  try {
    constraintInsightResult = getConstraintInsight()
  } catch {
    // Non-critical
  }

  // Build key factors
  const keyFactors: string[] = []
  
  // Add goal-based factor
  if (program?.goalLabel || profile?.primaryGoal) {
    keyFactors.push(`Tailored for ${goalDisplay} development`)
  }

  // Add readiness-based factors
  if (readinessAnalysis.primaryStrength) {
    keyFactors.push(`Leveraging your ${readinessAnalysis.primaryStrength.toLowerCase()}`)
  }
  if (readinessAnalysis.primaryLimiter) {
    keyFactors.push(`Addressing ${readinessAnalysis.primaryLimiter.toLowerCase()} as priority area`)
  }

  // Add constraint-based factor
  const constraintExplanation = constraintInsightResult?.hasInsight 
    ? constraintInsightResult.explanation 
    : generateConstraintExplanation(null, profile)
  if (constraintExplanation) {
    keyFactors.push(constraintExplanation)
  }

  // Add time-based factor
  if (profile?.trainingTime) {
    const timeMap: Record<string, string> = {
      '30_min': 'Optimized for 30-minute sessions',
      '45_min': 'Designed for 45-minute windows',
      '60_min': 'Full 60-minute development',
      '90_min': 'Comprehensive extended session',
    }
    if (timeMap[profile.trainingTime]) {
      keyFactors.push(timeMap[profile.trainingTime])
    }
  }

  // Build explanation
  let explanation = ''
  
  if (session.rationale) {
    explanation = session.rationale
  } else if (programReasoning?.weakPointSummary?.primaryFocusReason) {
    explanation = programReasoning.weakPointSummary.primaryFocusReason
  } else {
    // Generate based on session focus
    const focusExplanations: Record<string, string> = {
      skill: `This session emphasizes skill work to build toward your ${goalDisplay} goal, with supporting strength exercises.`,
      strength: 'This session focuses on building the foundational strength required for advanced skills.',
      pull: 'Pulling strength is the foundation for many calisthenics skills. This session builds that base.',
      push: 'Pushing strength and shoulder stability are developed in this session.',
      core: 'Core control and compression strength are essential for skill progressions.',
    }
    explanation = focusExplanations[session.focus || 'skill'] || 
      `Your first session is calibrated to your current level and ${goalDisplay} goals.`
  }

  // Build headline
  let headline = 'Your First Spartan Session Is Ready'
  if (session.focusLabel) {
    headline = `Start With ${session.focusLabel}`
  }

  return {
    headline,
    explanation,
    keyFactors: keyFactors.slice(0, 3),
    readinessHighlights: {
      strength: readinessAnalysis.primaryStrength,
      limiter: readinessAnalysis.primaryLimiter,
    },
    sessionOverview: {
      title: session.dayLabel || `Day 1: ${focusDisplay}`,
      focus: session.focusLabel || focusDisplay,
      estimatedMinutes: session.estimatedMinutes || 45,
      exerciseCount: session.exercises?.length || 0,
    },
  }
}

/**
 * Check if user has completed their first session
 */
export function hasCompletedFirstSession(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const logs = localStorage.getItem('spartanlab_workout_logs')
    if (!logs) return false
    
    const parsed = JSON.parse(logs)
    return Array.isArray(parsed) && parsed.length > 0
  } catch {
    return false
  }
}

/**
 * Check if user has an active first session ready
 */
export function isFirstSessionReady(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Check for active program
    const program = localStorage.getItem('spartanlab_adaptive_program')
    if (!program) return false
    
    const parsed = JSON.parse(program)
    return parsed?.sessions?.length > 0
  } catch {
    return false
  }
}

/**
 * Get the complete first session context
 */
export function getFirstSessionContext(): FirstSessionContext {
  const hasCompleted = hasCompletedFirstSession()
  const isReady = isFirstSessionReady()
  
  return {
    isFirstSession: !hasCompleted && isReady,
    hasCompletedFirstSession: hasCompleted,
    sessionReadyStatus: hasCompleted ? 'ready' : (isReady ? 'ready' : 'not_available'),
    reasoning: null, // Populated by the component that fetches full data
  }
}
