// Training Coach Module
// Unified entry point for coach-like training decisions
// Synthesizes all SpartanLab engine outputs into actionable, concise guidance

import { getAthleteEngineSnapshot, type AthleteEngineSnapshot } from './adaptive-athlete-engine'
import { getAthleteCalibration, type AthleteCalibration } from './athlete-calibration'
import { getOnboardingProfile } from './athlete-profile'
import { getDailyReadiness, type DailyReadinessResult } from './daily-readiness'
import { getQuickFatigueDecision, type TrainingDecision } from './fatigue-decision-engine'
import { getCompressionReadiness, type CompressionReadinessResult } from './compression-readiness'
import { analyzeConstraints, type ConstraintResult } from './constraint-engine'
import { analyzeProgression as analyzeBandProgression, getBandRecommendation, type ProgressionAnalysis as BandProgressionAnalysis } from './band-progression-engine'
import { getWorkoutLogs } from './workout-log-service'
import { getSkillSessions } from './skill-session-service'

// =============================================================================
// TYPES
// =============================================================================

// Type for the quick fatigue check result
type QuickFatigueResult = {
  decision: TrainingDecision
  shortGuidance: string
  needsAttention: boolean
}

export type CoachingTone = 'encouraging' | 'direct' | 'analytical'

export interface CoachDecision {
  // What to train today
  sessionRecommendation: SessionRecommendation
  
  // Primary limiter
  primaryLimiter: LimiterInsight
  
  // Progression guidance
  progressionGuidance: ProgressionGuidance
  
  // Time-aware adjustments
  timeAdjustment: TimeAdjustment
  
  // Quick coach notes (3-5 short statements)
  coachNotes: string[]
  
  // Data quality
  confidenceLevel: 'low' | 'medium' | 'high'
  hasEnoughData: boolean
}

export interface SessionRecommendation {
  type: 'full_session' | 'condensed_session' | 'recovery_session' | 'skill_focus' | 'strength_focus'
  label: string
  explanation: string
  shouldTrain: boolean
  intensity: 'low' | 'moderate' | 'high'
}

export interface LimiterInsight {
  category: 'strength' | 'skill' | 'recovery' | 'consistency' | 'compression' | 'time' | 'none'
  label: string
  whyItMatters: string
  recommendedFocus: string
  urgency: 'high' | 'medium' | 'low'
}

export interface ProgressionGuidance {
  decision: 'progress' | 'hold' | 'regress' | 'reduce_assistance' | 'maintain_assistance'
  explanation: string
  specificAction: string
  confidence: 'low' | 'medium' | 'high'
}

export interface TimeAdjustment {
  availableMinutes: number
  recommendedApproach: 'full' | 'condensed' | 'priority_only'
  explanation: string
  preserveSkillWork: boolean
  preserveStrengthWork: boolean
}

// =============================================================================
// MAIN COACH FUNCTION
// =============================================================================

export function getCoachDecision(availableMinutes?: number): CoachDecision {
  // Gather all engine outputs
  const snapshot = getAthleteEngineSnapshot()
  const calibration = getAthleteCalibration()
  const profile = getOnboardingProfile()
  const readiness = getDailyReadiness()
  const fatigueDecision = getQuickFatigueDecision()
  const compression = getCompressionReadiness()
  const constraints = analyzeConstraints()
  
  // Check data quality
  const hasEnoughData = snapshot.hasData && snapshot.state.dataQuality !== 'insufficient'
  const confidenceLevel = determineConfidence(snapshot, readiness)
  
  // Determine session recommendation
  const sessionRecommendation = determineSessionRecommendation(
    readiness,
    fatigueDecision,
    snapshot,
    availableMinutes
  )
  
  // Determine primary limiter
  const primaryLimiter = determinePrimaryLimiter(
    constraints,
    compression,
    calibration,
    snapshot
  )
  
  // Determine progression guidance
  const progressionGuidance = determineProgressionGuidance(
    readiness,
    fatigueDecision,
    snapshot,
    calibration
  )
  
  // Determine time adjustments
  const timeAdjustment = determineTimeAdjustment(
    availableMinutes || getDefaultSessionMinutes(calibration),
    fatigueDecision,
    snapshot
  )
  
  // Generate coach notes
  const coachNotes = generateCoachNotes(
    sessionRecommendation,
    primaryLimiter,
    progressionGuidance,
    compression,
    readiness
  )
  
  return {
    sessionRecommendation,
    primaryLimiter,
    progressionGuidance,
    timeAdjustment,
    coachNotes,
    confidenceLevel,
    hasEnoughData,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function determineConfidence(
  snapshot: AthleteEngineSnapshot,
  readiness: DailyReadinessResult
): 'low' | 'medium' | 'high' {
  if (snapshot.state.dataQuality === 'excellent' && readiness.confidence === 'high') {
    return 'high'
  }
  if (snapshot.state.dataQuality === 'good' || readiness.confidence === 'medium') {
    return 'medium'
  }
  return 'low'
}

function getDefaultSessionMinutes(calibration: AthleteCalibration): number {
  switch (calibration.sessionCapacity) {
    case 'short': return 30
    case 'medium': return 45
    case 'high': return 60
    default: return 45
  }
}

function determineSessionRecommendation(
  readiness: DailyReadinessResult,
  fatigueDecision: QuickFatigueResult,
  snapshot: AthleteEngineSnapshot,
  availableMinutes?: number
): SessionRecommendation {
  // Check if recovery is needed
  if (fatigueDecision.decision === 'DELOAD_RECOMMENDED') {
    return {
      type: 'recovery_session',
      label: 'Recovery Focus',
      explanation: 'Fatigue signals suggest prioritizing recovery today.',
      shouldTrain: true,
      intensity: 'low',
    }
  }
  
  if (fatigueDecision.decision === 'LIGHTEN_SESSION') {
    return {
      type: 'recovery_session',
      label: 'Light Session',
      explanation: 'Moderate fatigue detected. Keep intensity manageable.',
      shouldTrain: true,
      intensity: 'low',
    }
  }
  
  // Check readiness
  if (readiness.readinessTier === 'low') {
    return {
      type: 'recovery_session',
      label: 'Conservative Session',
      explanation: 'Readiness is low. Focus on technique and avoid pushing hard.',
      shouldTrain: true,
      intensity: 'low',
    }
  }
  
  // Time-constrained sessions
  if (availableMinutes && availableMinutes < 30) {
    return {
      type: 'condensed_session',
      label: 'Condensed Session',
      explanation: 'Limited time today. Focusing on highest-value work.',
      shouldTrain: true,
      intensity: 'moderate',
    }
  }
  
  // High readiness
  if (readiness.readinessTier === 'high' && fatigueDecision.decision === 'TRAIN_AS_PLANNED') {
    return {
      type: 'full_session',
      label: 'Full Training',
      explanation: 'Readiness is high. Great day to push training.',
      shouldTrain: true,
      intensity: 'high',
    }
  }
  
  // Default: moderate session
  return {
    type: 'full_session',
    label: 'Standard Session',
    explanation: 'Conditions support normal training.',
    shouldTrain: true,
    intensity: 'moderate',
  }
}

function determinePrimaryLimiter(
  constraints: ConstraintResult,
  compression: CompressionReadinessResult,
  calibration: AthleteCalibration,
  snapshot: AthleteEngineSnapshot
): LimiterInsight {
  // Check for consistency issues first
  if (snapshot.state.sessionConsistency < 50 && snapshot.state.dataQuality !== 'insufficient') {
    return {
      category: 'consistency',
      label: 'Training Consistency',
      whyItMatters: 'Irregular training reduces skill acquisition and strength adaptation.',
      recommendedFocus: 'Establish a consistent weekly training schedule.',
      urgency: 'high',
    }
  }
  
  // Recovery constraint
  if (snapshot.state.fatigueState === 'fatigued' || snapshot.state.fatigueState === 'overtrained') {
    return {
      category: 'recovery',
      label: 'Recovery Constraint',
      whyItMatters: 'Accumulated fatigue limits training quality and increases injury risk.',
      recommendedFocus: 'Prioritize sleep, reduce volume, and allow adaptation.',
      urgency: 'high',
    }
  }
  
  // Use constraint engine result
  if (constraints.primaryConstraint && constraints.confidence !== 'low') {
    const category = mapConstraintToCategory(constraints.primaryConstraint)
    return {
      category,
      label: constraints.label,
      whyItMatters: constraints.explanation,
      recommendedFocus: constraints.focusItems[0]?.action || 'Address the identified constraint.',
      urgency: constraints.confidence === 'high' ? 'high' : 'medium',
    }
  }
  
  // Compression weakness
  if (compression.primaryLimiter !== 'none' && calibration.needsCompressionWork) {
    return {
      category: 'compression',
      label: 'Compression Strength',
      whyItMatters: compression.limiterExplanation,
      recommendedFocus: compression.recommendedFocus[0] || 'Build compression strength progressively.',
      urgency: 'medium',
    }
  }
  
  // No primary limiter
  return {
    category: 'none',
    label: 'No Major Limiter',
    whyItMatters: 'Training is balanced. Continue with current approach.',
    recommendedFocus: 'Maintain consistency and progressive overload.',
    urgency: 'low',
  }
}

function mapConstraintToCategory(constraint: string): LimiterInsight['category'] {
  if (constraint.includes('pull') || constraint.includes('push') || constraint.includes('strength')) {
    return 'strength'
  }
  if (constraint.includes('skill') || constraint.includes('density') || constraint.includes('progression')) {
    return 'skill'
  }
  if (constraint.includes('recovery') || constraint.includes('fatigue')) {
    return 'recovery'
  }
  if (constraint.includes('compression') || constraint.includes('core')) {
    return 'compression'
  }
  if (constraint.includes('consistency') || constraint.includes('volume')) {
    return 'consistency'
  }
  return 'none'
}

function determineProgressionGuidance(
  readiness: DailyReadinessResult,
  fatigueDecision: QuickFatigueResult,
  snapshot: AthleteEngineSnapshot,
  calibration: AthleteCalibration
): ProgressionGuidance {
  // Check if we should regress
  if (fatigueDecision.decision === 'DELOAD_RECOMMENDED') {
    return {
      decision: 'regress',
      explanation: 'Fatigue levels suggest stepping back to consolidate gains.',
      specificAction: 'Reduce intensity by 20-30% for the next few sessions.',
      confidence: 'high',
    }
  }
  
  // Check readiness for progression
  if (snapshot.state.skillReadinessStatus === 'progress_now' && readiness.readinessTier !== 'low') {
    return {
      decision: 'progress',
      explanation: 'You have solid ownership of your current level.',
      specificAction: 'Attempt the next progression or reduce assistance.',
      confidence: 'high',
    }
  }
  
  // Band-assisted movements
  if (snapshot.state.skillReadinessStatus === 'consolidate') {
    return {
      decision: 'maintain_assistance',
      explanation: 'Current level needs more consolidation before reducing assistance.',
      specificAction: 'Focus on cleaner reps at current assistance level.',
      confidence: 'medium',
    }
  }
  
  // Check for progression too aggressive
  if (calibration.suggestedProgressionLevel === 'very_conservative') {
    return {
      decision: 'hold',
      explanation: 'Current profile suggests conservative progression timing.',
      specificAction: 'Build more volume at current level before advancing.',
      confidence: 'medium',
    }
  }
  
  // Default: maintain
  return {
    decision: 'hold',
    explanation: 'Continue building at current level.',
    specificAction: 'Focus on quality reps and consistent exposure.',
    confidence: 'medium',
  }
}

function determineTimeAdjustment(
  availableMinutes: number,
  fatigueDecision: QuickFatigueResult,
  snapshot: AthleteEngineSnapshot
): TimeAdjustment {
  // Very short sessions
  if (availableMinutes < 25) {
    return {
      availableMinutes,
      recommendedApproach: 'priority_only',
      explanation: 'Limited time. Focus on skill work and one primary strength movement.',
      preserveSkillWork: true,
      preserveStrengthWork: false,
    }
  }
  
  // Short sessions
  if (availableMinutes < 40) {
    return {
      availableMinutes,
      recommendedApproach: 'condensed',
      explanation: 'Session condensed to fit available time while preserving key work.',
      preserveSkillWork: true,
      preserveStrengthWork: true,
    }
  }
  
  // Recovery-biased session (check if fatigue needs attention)
  if (fatigueDecision.needsAttention || fatigueDecision.decision === 'LIGHTEN_SESSION') {
    return {
      availableMinutes,
      recommendedApproach: 'condensed',
      explanation: 'Volume reduced based on fatigue signals.',
      preserveSkillWork: true,
      preserveStrengthWork: true,
    }
  }
  
  // Full session
  return {
    availableMinutes,
    recommendedApproach: 'full',
    explanation: 'Full session fits available time.',
    preserveSkillWork: true,
    preserveStrengthWork: true,
  }
}

function generateCoachNotes(
  session: SessionRecommendation,
  limiter: LimiterInsight,
  progression: ProgressionGuidance,
  compression: CompressionReadinessResult,
  readiness: DailyReadinessResult
): string[] {
  const notes: string[] = []
  
  // Session note
  if (session.intensity === 'high') {
    notes.push('Today is a great day to push your training.')
  } else if (session.intensity === 'low') {
    notes.push('Keep intensity manageable today to support recovery.')
  }
  
  // Limiter note
  if (limiter.category !== 'none' && limiter.urgency !== 'low') {
    notes.push(`Your current plan addresses ${limiter.label.toLowerCase()}.`)
  }
  
  // Progression note
  if (progression.decision === 'progress') {
    notes.push('Consider attempting your next progression level.')
  } else if (progression.decision === 'regress') {
    notes.push('Focus on consolidation rather than progression today.')
  }
  
  // Compression note (if relevant)
  if (compression.shouldIncludeCompressionWork && compression.readinessLabel !== 'ready') {
    notes.push('Including compression work to support your skill progression.')
  }
  
  // Readiness note
  if (readiness.readinessTier === 'high') {
    notes.push('Readiness signals are positive.')
  } else if (readiness.readinessTier === 'low') {
    notes.push('Fatigue signals suggest keeping today conservative.')
  }
  
  // Limit to 5 notes max
  return notes.slice(0, 5)
}

// =============================================================================
// QUICK COACH INSIGHTS (for dashboard display)
// =============================================================================

export interface QuickCoachInsight {
  icon: 'checkmark' | 'alert' | 'info' | 'progress' | 'recovery'
  text: string
  significance: 'positive' | 'neutral' | 'attention'
}

export function getQuickCoachInsights(): QuickCoachInsight[] {
  const decision = getCoachDecision()
  const insights: QuickCoachInsight[] = []
  
  // Session recommendation insight
  if (decision.sessionRecommendation.intensity === 'high') {
    insights.push({
      icon: 'checkmark',
      text: 'Ready for full training today',
      significance: 'positive',
    })
  } else if (decision.sessionRecommendation.intensity === 'low') {
    insights.push({
      icon: 'recovery',
      text: 'Recovery-focused session recommended',
      significance: 'attention',
    })
  }
  
  // Limiter insight
  if (decision.primaryLimiter.category !== 'none') {
    insights.push({
      icon: 'info',
      text: `Focus area: ${decision.primaryLimiter.label}`,
      significance: 'neutral',
    })
  }
  
  // Progression insight
  if (decision.progressionGuidance.decision === 'progress') {
    insights.push({
      icon: 'progress',
      text: 'Ready to attempt next progression',
      significance: 'positive',
    })
  }
  
  return insights.slice(0, 3)
}

// =============================================================================
// COACH EXPLANATION GENERATOR
// =============================================================================

export function getCoachExplanation(topic: 'session' | 'limiter' | 'progression' | 'time'): string {
  const decision = getCoachDecision()
  
  switch (topic) {
    case 'session':
      return decision.sessionRecommendation.explanation
    case 'limiter':
      return decision.primaryLimiter.whyItMatters
    case 'progression':
      return decision.progressionGuidance.explanation
    case 'time':
      return decision.timeAdjustment.explanation
    default:
      return 'Continue with your planned training.'
  }
}
