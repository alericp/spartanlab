// Constraint Explanation Engine
// Generates focus recommendations and science-backed explanations

import type { 
  ConstraintType, 
  FocusItem, 
  ConfidenceLevel,
} from '@/types/constraint-engine'

// =============================================================================
// FOCUS RECOMMENDATIONS
// =============================================================================

export function generateFocusItems(constraintType: ConstraintType): FocusItem[] {
  switch (constraintType) {
    case 'skill_density_deficit':
      return [
        { action: 'Add more skill hold sets per session', priority: 'primary' },
        { action: 'Target 30+ seconds total hold time weekly', priority: 'primary' },
        { action: 'Include short density blocks after strength work', priority: 'secondary' },
      ]
    
    case 'progression_jump_too_large':
      return [
        { action: 'Step back to a more comfortable progression', priority: 'primary' },
        { action: 'Focus on clean, controlled holds', priority: 'primary' },
        { action: 'Build confidence before advancing', priority: 'secondary' },
      ]
    
    case 'inconsistent_skill_exposure':
      return [
        { action: 'Train your primary skill at least 2x/week', priority: 'primary' },
        { action: 'Schedule dedicated skill sessions', priority: 'primary' },
        { action: 'Even brief practice counts', priority: 'secondary' },
      ]
    
    case 'pull_strength_deficit':
      return [
        { action: 'Prioritize weighted pull-up development', priority: 'primary' },
        { action: 'Add horizontal pulling volume (rows)', priority: 'primary' },
        { action: 'Build to 0.4x BW added for advanced skills', priority: 'secondary' },
      ]
    
    case 'push_strength_deficit':
      return [
        { action: 'Prioritize weighted dip development', priority: 'primary' },
        { action: 'Add pushing volume with progressive load', priority: 'primary' },
        { action: 'Build pressing reserve for skill support', priority: 'secondary' },
      ]
    
    case 'strength_imbalance':
      return [
        { action: 'Address the lagging movement pattern', priority: 'primary' },
        { action: 'Reduce volume on the dominant pattern', priority: 'secondary' },
        { action: 'Aim for balanced push/pull tiers', priority: 'secondary' },
      ]
    
    case 'core_tension_deficit':
      return [
        { action: 'Add hollow body holds to each session', priority: 'primary' },
        { action: 'Train L-sit progressions for core compression', priority: 'primary' },
        { action: 'Build to 30+ second hollow holds', priority: 'secondary' },
      ]
    
    case 'total_volume_low':
      return [
        { action: 'Increase weekly training frequency', priority: 'primary' },
        { action: 'Target minimum 20 sets per week', priority: 'primary' },
        { action: 'Add volume gradually to avoid injury', priority: 'secondary' },
      ]
    
    case 'training_inconsistency':
      return [
        { action: 'Schedule fixed training days', priority: 'primary' },
        { action: 'Train at least 3x per week minimum', priority: 'primary' },
        { action: 'Consistency beats intensity for skill development', priority: 'secondary' },
      ]
    
    case 'pull_volume_low':
      return [
        { action: 'Add pulling exercises to workouts', priority: 'primary' },
        { action: 'Include rows and vertical pulls weekly', priority: 'primary' },
        { action: 'Target 8-12 pull sets per week minimum', priority: 'secondary' },
      ]
    
    case 'push_volume_low':
      return [
        { action: 'Add pushing exercises to workouts', priority: 'primary' },
        { action: 'Include dips and presses weekly', priority: 'primary' },
        { action: 'Target 8-12 push sets per week minimum', priority: 'secondary' },
      ]
    
    case 'horizontal_pull_neglect':
      return [
        { action: 'Add front lever rows or inverted rows', priority: 'primary' },
        { action: 'Include horizontal pulling 2x/week', priority: 'primary' },
        { action: 'This directly supports front lever progress', priority: 'secondary' },
      ]
    
    case 'fatigue_accumulation':
      return [
        { action: 'Schedule a deload or light week', priority: 'primary' },
        { action: 'Reduce training intensity temporarily', priority: 'primary' },
        { action: 'Focus on mobility and recovery', priority: 'secondary' },
      ]
    
    case 'recovery_deficit':
      return [
        { action: 'Take 1-2 full rest days', priority: 'primary' },
        { action: 'Improve sleep and nutrition', priority: 'primary' },
        { action: 'Return when performance stabilizes', priority: 'secondary' },
      ]
    
    case 'no_primary_constraint':
      return [
        { action: 'Continue current training approach', priority: 'primary' },
        { action: 'Maintain consistency', priority: 'secondary' },
        { action: 'Monitor for emerging bottlenecks', priority: 'secondary' },
      ]
    
    case 'insufficient_data':
      return [
        { action: 'Log strength and skill sessions', priority: 'primary' },
        { action: 'Track workouts consistently', priority: 'primary' },
        { action: 'Check back after 1-2 weeks of logging', priority: 'secondary' },
      ]
    
    // [limiter-truth] New states for clean-slate / low-history users
    case 'early_calibration':
      return [
        { action: 'Complete at least 6 logged workouts', priority: 'primary' },
        { action: 'Track skill practice sessions', priority: 'primary' },
        { action: 'Log strength benchmarks when ready', priority: 'secondary' },
      ]
    
    case 'building_consistency':
      return [
        { action: 'Train at least 3x per week', priority: 'primary' },
        { action: 'Log each workout session', priority: 'primary' },
        { action: 'Build a consistent routine first', priority: 'secondary' },
      ]
    
    default:
      return [
        { action: 'Continue logging to improve insights', priority: 'primary' },
      ]
  }
}

// =============================================================================
// EXPLANATIONS
// =============================================================================

export function generateExplanation(
  constraintType: ConstraintType,
  confidence: ConfidenceLevel
): string {
  const confidenceNote = confidence === 'low' 
    ? ' (More data will improve this analysis.)'
    : ''
  
  switch (constraintType) {
    case 'skill_density_deficit':
      return `You're not practicing skills often enough. Progress requires regular exposure - aim to train each skill at least twice per week for consistent improvement.${confidenceNote}`
    
    case 'progression_jump_too_large':
      return `The progression you're attempting may be too advanced for your current strength. Stepping back to an easier variation and building quality reps often leads to faster progress.${confidenceNote}`
    
    case 'inconsistent_skill_exposure':
      return `Skills need regular practice to develop. Training a skill less than twice per week makes it hard to build and retain the strength and control needed.${confidenceNote}`
    
    case 'pull_strength_deficit':
      return `Your pulling strength is not yet strong enough to support your skill goals. Front lever and muscle-up require a solid foundation of pulling strength.${confidenceNote}`
    
    case 'push_strength_deficit':
      return `Your pushing strength is not yet strong enough to support your skill goals. Planche and handstand push-ups require a solid foundation of pressing strength.${confidenceNote}`
    
    case 'strength_imbalance':
      return `A significant imbalance between pushing and pulling strength can limit skill development and increase injury risk. Addressing the weaker pattern helps overall progress.${confidenceNote}`
    
    case 'core_tension_deficit':
      return `Core tension is essential for skills like front lever, planche, and L-sit. Weak core compression limits body control during holds and can stall skill progress.${confidenceNote}`
    
    case 'total_volume_low':
      return `Your weekly training volume is below the threshold that typically supports strength and skill adaptation. Increasing total training sets helps drive progress.${confidenceNote}`
    
    case 'training_inconsistency':
      return `Inconsistent training disrupts the adaptation process. Skills and strength require regular stimulus to develop. Prioritize showing up consistently over training intensity.${confidenceNote}`
    
    case 'pull_volume_low':
      return `You're not doing enough pulling work each week. Add more pull-ups, rows, and pulling exercises to build the strength needed for advanced skills.${confidenceNote}`
    
    case 'push_volume_low':
      return `You're not doing enough pushing work each week. Add more dips, push-ups, and pressing exercises to build the strength needed for advanced skills.${confidenceNote}`
    
    case 'horizontal_pull_neglect':
      return `Front lever requires horizontal pulling strength specifically. Pull-ups alone won't fully transfer - add front lever rows and horizontal pulling work.${confidenceNote}`
    
    case 'fatigue_accumulation':
      return `Your body is showing signs of accumulated fatigue. Continuing to push hard without rest can stall progress. Consider a lighter training week to recover.${confidenceNote}`
    
    case 'recovery_deficit':
      return `Your performance is declining and fatigue is building up. Your body needs more rest. Prioritizing recovery now prevents bigger setbacks later.${confidenceNote}`
    
    case 'no_primary_constraint':
      return `Your training data looks balanced. Continue your current approach and the system will alert you if a bottleneck emerges.${confidenceNote}`
    
    case 'insufficient_data':
      return `Not enough training data to identify specific constraints. Log strength records, skill sessions, and workouts to unlock personalized insights.`
    
    // [limiter-truth] New states for clean-slate / low-history users
    case 'early_calibration':
      return `You're just getting started. Complete a few more training sessions and we'll be able to identify your specific limiters and optimize your programming.`
    
    case 'building_consistency':
      return `You're building your training baseline. Keep logging sessions consistently and the system will soon have enough data to provide confident recommendations.`
    
    default:
      return `Continue training consistently and the system will refine its analysis.${confidenceNote}`
  }
}
