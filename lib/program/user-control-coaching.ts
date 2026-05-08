/**
 * [W.W10] User Control Without Breaking Intelligence — Coaching Helper
 * 
 * Derives coaching guidance from existing override-signal-service to help users
 * understand when their choices may impact their progress.
 * 
 * Truth source: override-signal-service.ts (analyzeSignalsForAdaptive, getOverrideSummaryBrief)
 * 
 * Advisory-only — does not mutate programs or auto-apply changes.
 */

import {
  analyzeSignalsForAdaptive,
  getOverrideSummaryBrief,
  type AdaptiveSignalFeedback,
  type SignalPattern,
} from '@/lib/override-signal-service'

// =============================================================================
// TYPES
// =============================================================================

export type UserControlCoachStatus = 'active' | 'inactive' | 'neutral'

export interface UserControlCoachModel {
  status: UserControlCoachStatus
  headline: string
  summary: string
  patterns: UserControlPattern[]
  recommendations: string[]
  evidence: string[]
  // Advisory markers
  isAdvisoryOnly: true
  programUnchanged: true
}

export interface UserControlPattern {
  type: 'frequent_skip' | 'frequent_replace' | 'difficulty_mismatch' | 'equipment_issue'
  exerciseName?: string
  severity: 'low' | 'moderate' | 'high'
  description: string
  recommendation: string
}

// =============================================================================
// DERIVATION
// =============================================================================

/**
 * Derive user control coaching model from existing override signal truth.
 * Uses the override-signal-service as the authoritative source.
 */
export function deriveUserControlCoaching(): UserControlCoachModel {
  // Get signal analysis from authoritative source
  const signalFeedback = analyzeSignalsForAdaptive(14) // Last 14 days
  const briefSummary = getOverrideSummaryBrief()
  
  // If no significant patterns, return inactive state
  if (!signalFeedback.hasSignificantPatterns && briefSummary.totalOverrides < 3) {
    return {
      status: 'inactive',
      headline: 'Your Choices Are Tracked',
      summary: 'The system learns from your exercise adjustments to improve future recommendations.',
      patterns: [],
      recommendations: [],
      evidence: ['No significant override patterns detected in recent sessions'],
      isAdvisoryOnly: true,
      programUnchanged: true,
    }
  }
  
  // Map signal patterns to coaching patterns
  const patterns: UserControlPattern[] = signalFeedback.patterns.map(mapSignalPatternToCoachingPattern)
  
  // Determine headline based on pattern severity
  const hasHighSeverity = patterns.some(p => p.severity === 'high')
  const hasModerateSeverity = patterns.some(p => p.severity === 'moderate')
  
  let headline: string
  let summary: string
  
  if (hasHighSeverity) {
    headline = 'Pattern Detected — Consider Adjusting'
    summary = 'Your recent exercise choices suggest some movements may need attention. The system is learning from your feedback.'
  } else if (hasModerateSeverity) {
    headline = 'Learning From Your Choices'
    summary = 'Some patterns in your recent adjustments have been noted. This helps improve future recommendations.'
  } else {
    headline = 'Tracking Your Preferences'
    summary = 'Your exercise adjustments are being used to personalize future sessions.'
  }
  
  // Build evidence list
  const evidence: string[] = []
  if (briefSummary.recentSkips > 0) {
    evidence.push(`${briefSummary.recentSkips} exercise(s) skipped in the last 7 days`)
  }
  if (briefSummary.recentReplacements > 0) {
    evidence.push(`${briefSummary.recentReplacements} exercise replacement(s) in the last 7 days`)
  }
  if (briefSummary.totalOverrides > 0) {
    evidence.push(`${briefSummary.totalOverrides} total adjustments recorded`)
  }
  
  return {
    status: hasHighSeverity ? 'active' : 'neutral',
    headline,
    summary,
    patterns,
    recommendations: signalFeedback.coachRecommendations,
    evidence,
    isAdvisoryOnly: true,
    programUnchanged: true,
  }
}

/**
 * Map override signal pattern to coaching pattern.
 */
function mapSignalPatternToCoachingPattern(pattern: SignalPattern): UserControlPattern {
  return {
    type: pattern.type,
    exerciseName: pattern.exerciseName,
    severity: pattern.severity,
    description: pattern.description,
    recommendation: pattern.recommendation,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if coaching model has active patterns worth showing.
 */
export function hasActiveUserControlCoaching(model: UserControlCoachModel): boolean {
  return model.status === 'active' || (model.status === 'neutral' && model.patterns.length > 0)
}

/**
 * Get coaching patterns grouped by type.
 */
export function getPatternsByType(model: UserControlCoachModel): Record<string, UserControlPattern[]> {
  const grouped: Record<string, UserControlPattern[]> = {
    skip: [],
    replace: [],
    difficulty: [],
    equipment: [],
  }
  
  for (const pattern of model.patterns) {
    switch (pattern.type) {
      case 'frequent_skip':
        grouped.skip.push(pattern)
        break
      case 'frequent_replace':
        grouped.replace.push(pattern)
        break
      case 'difficulty_mismatch':
        grouped.difficulty.push(pattern)
        break
      case 'equipment_issue':
        grouped.equipment.push(pattern)
        break
    }
  }
  
  return grouped
}

/**
 * Get severity color styling for UI.
 */
export function getUserControlSeverityStyles(severity: 'low' | 'moderate' | 'high'): {
  chipClass: string
  badgeClass: string
  iconColor: string
} {
  switch (severity) {
    case 'high':
      return {
        chipClass: 'bg-amber-500/15 text-amber-300/90 border border-amber-500/25',
        badgeClass: 'text-amber-400/70',
        iconColor: 'text-amber-400',
      }
    case 'moderate':
      return {
        chipClass: 'bg-yellow-500/10 text-yellow-300/80 border border-yellow-500/20',
        badgeClass: 'text-yellow-400/60',
        iconColor: 'text-yellow-400/70',
      }
    case 'low':
    default:
      return {
        chipClass: 'bg-blue-500/10 text-blue-300/70 border border-blue-500/15',
        badgeClass: 'text-blue-400/50',
        iconColor: 'text-blue-400/60',
      }
  }
}
