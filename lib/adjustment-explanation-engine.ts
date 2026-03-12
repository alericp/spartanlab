// Adjustment Explanation Engine
// Generates concise, science-backed explanations for all training adjustments

import type { SessionAdjustmentType, WellnessState } from './daily-adjustment-engine'
import type { WeekAdjustmentType } from './week-reschedule-engine'
import type { DeloadStatus } from './deload-detection-engine'

// =============================================================================
// SESSION ADJUSTMENT EXPLANATIONS
// =============================================================================

export interface SessionExplanation {
  headline: string
  rationale: string
  scienceBasis: string
}

export function getSessionAdjustmentExplanation(
  type: SessionAdjustmentType,
  wellness: WellnessState,
  timeCompression: { available: number; planned: number } | null
): SessionExplanation {
  const headlines: Record<SessionAdjustmentType, string> = {
    keep_as_planned: 'Full Session',
    shorten_session: 'Compressed Session',
    reduce_volume: 'Volume Adjusted',
    shift_emphasis: 'Emphasis Shifted',
    recovery_bias: 'Recovery Focus',
  }
  
  let rationale: string
  let scienceBasis: string
  
  if (type === 'keep_as_planned') {
    rationale = 'No adjustment needed. Your current state supports the planned training.'
    scienceBasis = 'Optimal training occurs when recovery matches planned stress.'
  } else if (type === 'shorten_session') {
    const minutes = timeCompression?.available || 30
    rationale = `Session compressed to ${minutes} minutes while preserving skill work and primary strength movements.`
    scienceBasis = 'Research shows skill acquisition and strength stimulus are maintained when volume is reduced but key movements are preserved.'
  } else if (type === 'reduce_volume') {
    if (wellness === 'fatigued') {
      rationale = 'Volume reduced to maintain training quality while managing accumulated fatigue.'
      scienceBasis = 'Reducing volume during high fatigue periods prevents overreaching and supports adaptation.'
    } else {
      rationale = 'Set counts reduced to fit available time while preserving key movement patterns.'
      scienceBasis = 'Maintaining movement frequency with reduced volume preserves training adaptations better than skipping sessions.'
    }
  } else if (type === 'shift_emphasis') {
    rationale = 'Session rebalanced toward higher-quality skill work with reduced accessory volume.'
    scienceBasis = 'Neural adaptations for skill work benefit from quality over quantity when fatigue is elevated.'
  } else if (type === 'recovery_bias') {
    rationale = 'Focus shifted to technique and lower-fatigue movements to support recovery.'
    scienceBasis = 'Active recovery with reduced intensity supports adaptation while preventing fatigue accumulation.'
  } else {
    rationale = 'Adjustment applied based on current conditions.'
    scienceBasis = 'Training should adapt to individual recovery and time constraints.'
  }
  
  return {
    headline: headlines[type] || 'Adjusted Session',
    rationale,
    scienceBasis,
  }
}

// =============================================================================
// WEEK ADJUSTMENT EXPLANATIONS
// =============================================================================

export interface WeekExplanation {
  headline: string
  rationale: string
  scienceBasis: string
}

export function getWeekAdjustmentExplanation(
  type: WeekAdjustmentType,
  missedDays: number,
  remainingDays: number
): WeekExplanation {
  const headlines: Record<WeekAdjustmentType, string> = {
    keep_week_as_planned: 'On Track',
    do_missed_now: 'Priority Session Recovery',
    merge_priority_work: 'Work Merged',
    compress_week: 'Week Compressed',
    drop_lowest_priority: 'Volume Managed',
    shift_schedule: 'Schedule Adjusted',
  }
  
  let rationale: string
  let scienceBasis: string
  
  if (type === 'keep_week_as_planned') {
    rationale = 'No schedule conflicts detected. Continue with planned sessions.'
    scienceBasis = 'Consistency in training schedule supports progressive adaptation.'
  } else if (type === 'do_missed_now') {
    rationale = 'A priority session was missed. Completing it today preserves the week\'s primary training stimulus.'
    scienceBasis = 'Skill and strength sessions have a time-sensitive training window. Completing within 24-48 hours maintains stimulus effectiveness.'
  } else if (type === 'merge_priority_work') {
    rationale = 'Key exercises from the missed session merged into the next workout to preserve training effect without excessive volume.'
    scienceBasis = 'Maintaining exposure to key movement patterns is more important than completing every planned set.'
  } else if (type === 'compress_week') {
    rationale = `Week compressed to ${remainingDays} priority sessions after missing ${missedDays} day${missedDays > 1 ? 's' : ''}.`
    scienceBasis = 'When time is limited, focusing on highest-value sessions produces better outcomes than attempting to cram all missed work.'
  } else if (type === 'drop_lowest_priority') {
    rationale = 'Lower-priority accessory work dropped to prevent fatigue accumulation from compressed schedule.'
    scienceBasis = 'Accessory work provides diminishing returns compared to primary skill and strength work.'
  } else if (type === 'shift_schedule') {
    rationale = 'Remaining sessions reordered to maintain weekly priorities.'
    scienceBasis = 'Flexible scheduling with maintained weekly volume supports adaptation better than rigid adherence to specific days.'
  } else {
    rationale = 'Schedule adjusted based on current week state.'
    scienceBasis = 'Training plans should adapt to life circumstances while preserving core intent.'
  }
  
  return {
    headline: headlines[type] || 'Week Adjusted',
    rationale,
    scienceBasis,
  }
}

// =============================================================================
// DELOAD EXPLANATIONS
// =============================================================================

export interface DeloadExplanation {
  headline: string
  rationale: string
  scienceBasis: string
  actionItems: string[]
}

export function getDeloadExplanation(status: DeloadStatus): DeloadExplanation {
  const headlines: Record<DeloadStatus, string> = {
    no_deload_needed: 'Recovery On Track',
    watch_recovery: 'Monitor Fatigue',
    lighten_next_session: 'Reduce Next Session',
    deload_recommended: 'Deload Week Recommended',
  }
  
  let rationale: string
  let scienceBasis: string
  let actionItems: string[]
  
  if (status === 'no_deload_needed') {
    rationale = 'Current training load and recovery indicators suggest you are adapting well.'
    scienceBasis = 'Progressive overload can continue when performance is stable or improving.'
    actionItems = [
      'Continue with planned training',
      'Monitor performance trends',
    ]
  } else if (status === 'watch_recovery') {
    rationale = 'Mild fatigue signals detected. Monitor closely over the next few sessions.'
    scienceBasis = 'Early fatigue detection allows for proactive adjustments before performance declines.'
    actionItems = [
      'Track session quality closely',
      'Prioritize sleep and nutrition',
      'Consider lighter accessory work',
    ]
  } else if (status === 'lighten_next_session') {
    rationale = 'Multiple indicators suggest elevated fatigue. A lighter session will help restore readiness.'
    scienceBasis = 'Strategic deload sessions prevent accumulated fatigue from compromising adaptation.'
    actionItems = [
      'Reduce volume by 30-40%',
      'Maintain movement patterns',
      'Skip lowest-priority accessories',
      'Focus on movement quality',
    ]
  } else if (status === 'deload_recommended') {
    rationale = 'Significant fatigue accumulation detected. A planned deload will restore training capacity.'
    scienceBasis = 'Deload periods allow physiological adaptation to catch up with training stress, leading to improved performance afterward.'
    actionItems = [
      'Reduce volume by 40-50% for 5-7 days',
      'Maintain skill exposure at lower intensity',
      'Emphasize mobility and recovery work',
      'Target 8+ hours of sleep nightly',
      'Focus on nutrition quality',
    ]
  } else {
    rationale = 'Recovery status assessed based on available data.'
    scienceBasis = 'Training should be adjusted based on recovery indicators.'
    actionItems = ['Review training load', 'Assess recovery quality']
  }
  
  return {
    headline: headlines[status] || 'Recovery Assessment',
    rationale,
    scienceBasis,
    actionItems,
  }
}

// =============================================================================
// UNIFIED TRAINING INSIGHT
// =============================================================================

export interface UnifiedTrainingInsight {
  sessionInsight: SessionExplanation | null
  weekInsight: WeekExplanation | null
  deloadInsight: DeloadExplanation
  primaryRecommendation: string
  urgency: 'low' | 'medium' | 'high' | 'none'
}

export function generateUnifiedTrainingInsight(
  sessionAdjustment: { type: SessionAdjustmentType; wellness: WellnessState; time: { available: number; planned: number } | null } | null,
  weekAdjustment: { type: WeekAdjustmentType; missedDays: number; remainingDays: number } | null,
  deloadStatus: DeloadStatus
): UnifiedTrainingInsight {
  const sessionInsight = sessionAdjustment
    ? getSessionAdjustmentExplanation(sessionAdjustment.type, sessionAdjustment.wellness, sessionAdjustment.time)
    : null
  
  const weekInsight = weekAdjustment
    ? getWeekAdjustmentExplanation(weekAdjustment.type, weekAdjustment.missedDays, weekAdjustment.remainingDays)
    : null
  
  const deloadInsight = getDeloadExplanation(deloadStatus)
  
  // Determine primary recommendation and urgency
  let primaryRecommendation: string
  let urgency: 'low' | 'medium' | 'high' | 'none' = 'none'
  
  // Deload takes priority if recommended
  if (deloadStatus === 'deload_recommended') {
    primaryRecommendation = 'A deload is recommended based on accumulated fatigue signals.'
    urgency = 'high'
  } else if (deloadStatus === 'lighten_next_session') {
    primaryRecommendation = 'Consider a lighter session to manage fatigue accumulation.'
    urgency = 'medium'
  } else if (weekAdjustment && weekAdjustment.type !== 'keep_week_as_planned') {
    primaryRecommendation = weekInsight?.rationale || 'Week schedule adjusted.'
    urgency = weekAdjustment.missedDays >= 2 ? 'medium' : 'low'
  } else if (sessionAdjustment && sessionAdjustment.type !== 'keep_as_planned') {
    primaryRecommendation = sessionInsight?.rationale || 'Session adjusted for current conditions.'
    urgency = sessionAdjustment.wellness === 'fatigued' ? 'low' : 'none'
  } else {
    primaryRecommendation = 'Training on track. Continue with planned work.'
    urgency = 'none'
  }
  
  return {
    sessionInsight,
    weekInsight,
    deloadInsight,
    primaryRecommendation,
    urgency,
  }
}
