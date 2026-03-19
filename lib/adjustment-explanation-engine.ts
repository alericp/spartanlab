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

// =============================================================================
// DOCTRINE-DRIVEN REASON CODES
// =============================================================================

/**
 * Canonical reason codes for doctrine-driven exercise selection.
 * Used by the explanation layer to describe why exercises were chosen.
 */
export type DoctrineReasonCode =
  // Movement family support
  | 'dragon_flag_support'
  | 'straight_arm_pull_support'
  | 'straight_arm_push_support'
  | 'vertical_push_support'
  | 'explosive_pull_support'
  | 'transition_support'
  | 'compression_support'
  | 'mobility_support'
  | 'anti_extension_support'
  | 'scapular_control_support'
  // Method profile reasons
  | 'skill_frequency_profile'
  | 'neural_strength_profile'
  | 'mixed_hypertrophy_profile'
  | 'density_structure_reason'
  | 'recovery_bias_structure_reason'
  | 'weighted_basics_profile'
  | 'mobility_support_profile'
  // Prerequisite/progression reasons
  | 'prerequisite_not_met'
  | 'progression_ladder_step'
  | 'support_for_limiter'
  // Training structure reasons
  | 'tendon_load_conservative'
  | 'straight_arm_limit_reached'
  | 'joint_stress_avoidance'

export interface DoctrineReasonExplanation {
  headline: string
  description: string
  scienceBasis: string
}

/**
 * Get human-readable explanation for a doctrine reason code.
 */
export function getDoctrineReasonExplanation(code: DoctrineReasonCode): DoctrineReasonExplanation {
  const explanations: Record<DoctrineReasonCode, DoctrineReasonExplanation> = {
    // Movement family support
    dragon_flag_support: {
      headline: 'Dragon Flag Support',
      description: 'Anti-extension core work building toward dragon flag progression.',
      scienceBasis: 'Dragon flags require exceptional trunk stiffness and anti-extension strength.',
    },
    straight_arm_pull_support: {
      headline: 'Straight-Arm Pull Support',
      description: 'Straight-arm pulling exercises supporting front lever development.',
      scienceBasis: 'Front lever requires straight-arm pulling strength with scapular depression.',
    },
    straight_arm_push_support: {
      headline: 'Straight-Arm Push Support',
      description: 'Straight-arm pushing exercises supporting planche development.',
      scienceBasis: 'Planche requires straight-arm pushing strength with scapular protraction.',
    },
    vertical_push_support: {
      headline: 'Vertical Push Support',
      description: 'Overhead pressing strength supporting HSPU progression.',
      scienceBasis: 'HSPU requires strong vertical pressing with overhead stability.',
    },
    explosive_pull_support: {
      headline: 'Explosive Pull Support',
      description: 'Explosive pulling power supporting muscle-up transition.',
      scienceBasis: 'Muscle-up transition requires pulling power to achieve sufficient height.',
    },
    transition_support: {
      headline: 'Transition Support',
      description: 'Transition-specific work for muscle-up development.',
      scienceBasis: 'The muscle-up transition requires specific strength through the pullover position.',
    },
    compression_support: {
      headline: 'Compression Support',
      description: 'Hip flexor and compression work supporting L-sit/V-sit development.',
      scienceBasis: 'L-sit requires active hip flexion strength to maintain leg elevation.',
    },
    mobility_support: {
      headline: 'Mobility Support',
      description: 'Flexibility work supporting skill prerequisites.',
      scienceBasis: 'Many skills require specific mobility that must be developed alongside strength.',
    },
    anti_extension_support: {
      headline: 'Anti-Extension Support',
      description: 'Anti-extension core work supporting body position control.',
      scienceBasis: 'Hollow body positions require anti-extension strength to maintain alignment.',
    },
    scapular_control_support: {
      headline: 'Scapular Control Support',
      description: 'Scapular stability work supporting skill execution.',
      scienceBasis: 'Scapular control is foundational for both pulling and pushing skills.',
    },
    // Method profile reasons
    skill_frequency_profile: {
      headline: 'Skill-Frequency Approach',
      description: 'Using repeated moderate exposure for motor learning.',
      scienceBasis: 'Motor learning benefits from frequent practice at sub-maximal intensity.',
    },
    neural_strength_profile: {
      headline: 'Neural Strength Approach',
      description: 'High intensity with longer rest for maximal strength development.',
      scienceBasis: 'Maximal strength requires high neural drive with full recovery between sets.',
    },
    mixed_hypertrophy_profile: {
      headline: 'Mixed Strength-Hypertrophy',
      description: 'Balanced approach for strength and muscle development.',
      scienceBasis: 'Moderate intensity with sufficient volume supports both strength and hypertrophy.',
    },
    density_structure_reason: {
      headline: 'Density Training Format',
      description: 'Time-efficient grouped work for conditioning benefit.',
      scienceBasis: 'Density training maintains stimulus while reducing total session time.',
    },
    recovery_bias_structure_reason: {
      headline: 'Recovery-Biased Approach',
      description: 'Lower intensity technical work for active recovery.',
      scienceBasis: 'Active recovery maintains movement patterns while allowing adaptation.',
    },
    weighted_basics_profile: {
      headline: 'Weighted Basics Foundation',
      description: 'Heavy compounds building foundational strength.',
      scienceBasis: 'Weighted basics develop the strength base that transfers to bodyweight skills.',
    },
    mobility_support_profile: {
      headline: 'Flexibility Integration',
      description: 'Mobility work integrated with skill development.',
      scienceBasis: 'Flexibility and strength should be developed together for optimal skill acquisition.',
    },
    // Prerequisite/progression reasons
    prerequisite_not_met: {
      headline: 'Building Prerequisites',
      description: 'Foundational work building toward advanced exercise requirements.',
      scienceBasis: 'Advanced exercises require specific strength and stability prerequisites.',
    },
    progression_ladder_step: {
      headline: 'Progression Step',
      description: 'Current position in the progression ladder toward skill mastery.',
      scienceBasis: 'Progressive overload through structured regression/progression ladders.',
    },
    support_for_limiter: {
      headline: 'Addressing Limiter',
      description: 'Targeted work addressing identified weak point.',
      scienceBasis: 'Addressing limiting factors accelerates overall skill progression.',
    },
    // Training structure reasons
    tendon_load_conservative: {
      headline: 'Conservative Tendon Loading',
      description: 'Reduced straight-arm volume for tendon health.',
      scienceBasis: 'Tendons adapt slower than muscles and require careful load management.',
    },
    straight_arm_limit_reached: {
      headline: 'Straight-Arm Limit',
      description: 'Maximum straight-arm exercises for this session reached.',
      scienceBasis: 'Limiting straight-arm work per session protects connective tissue.',
    },
    joint_stress_avoidance: {
      headline: 'Joint Stress Management',
      description: 'Exercise selected to minimize joint stress based on athlete profile.',
      scienceBasis: 'Avoiding high stress on sensitive joints prevents injury and supports long-term training.',
    },
  }
  
  return explanations[code] || {
    headline: 'Training Decision',
    description: 'Exercise selected based on training goals and athlete state.',
    scienceBasis: 'Programming decisions consider multiple factors for optimal outcomes.',
  }
}

/**
 * Format multiple doctrine reasons into a coaching-style explanation.
 */
export function formatDoctrineReasons(codes: DoctrineReasonCode[]): string {
  if (codes.length === 0) return ''
  
  const explanations = codes.map(code => getDoctrineReasonExplanation(code))
  
  if (codes.length === 1) {
    return explanations[0].description
  }
  
  // Combine multiple reasons
  return explanations.map(e => e.description).join(' ')
}
