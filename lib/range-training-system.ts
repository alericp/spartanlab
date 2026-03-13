/**
 * SpartanLab Range-of-Motion Training System
 * 
 * Two distinct pathways for range-based skills:
 * 
 * 1. FLEXIBILITY
 *    - Goal: Go deeper with ease
 *    - Method: 15s holds, low soreness, frequent exposure, 3 rounds
 *    - Recovery: Minimal - trainable daily
 * 
 * 2. MOBILITY
 *    - Goal: Own the position with strength
 *    - Method: Loaded work, active strength, RPE-based progression
 *    - Recovery: Moderate - treated like strength training
 */

import type { RPEValue } from './rpe-adjustment-engine'

// =============================================================================
// TYPES
// =============================================================================

export type RangeSkill = 'pancake' | 'toe_touch' | 'front_splits' | 'side_splits'

export type RangeTrainingMode = 'flexibility' | 'mobility' | 'hybrid'

export interface RangeIntent {
  mode: RangeTrainingMode
  userPreference: 'deeper_range' | 'stronger_control' | 'both'
}

// Flexibility Mode: Low effort, high frequency
export interface FlexibilitySession {
  type: 'flexibility'
  holdTime: 15 // Always 15 seconds
  rounds: 3 // Always 3 rounds
  fatigueLevel: 'minimal'
  sorenessExpected: 'low'
  recoveryNeeded: 'none'
  frequency: 'daily'
  estimatedMinutes: number
}

// Mobility Mode: Loaded work, strength-based
export interface MobilityExercise {
  id: string
  name: string
  type: 'loaded_stretch' | 'active_range' | 'end_range_strength' | 'isometric'
  sets: number
  repsOrHold: string
  targetRPE: RPEValue
  loadSuggestion?: string
  cues: string[]
}

export interface MobilitySession {
  type: 'mobility'
  exercises: MobilityExercise[]
  fatigueLevel: 'moderate' | 'high'
  sorenessExpected: 'moderate'
  recoveryNeeded: '24-48h'
  frequency: '2-3x/week'
  estimatedMinutes: number
  targetRPE: RPEValue
}

// Hybrid: Combines both approaches
export interface HybridSession {
  type: 'hybrid'
  flexibilityPortion: FlexibilitySession
  mobilityPortion: MobilitySession
  fatigueLevel: 'moderate'
  sorenessExpected: 'low-moderate'
  recoveryNeeded: '24h'
  frequency: '3-4x/week'
  estimatedMinutes: number
}

export type RangeSession = FlexibilitySession | MobilitySession | HybridSession

// =============================================================================
// USER-FACING COPY
// =============================================================================

export const RANGE_MODE_COPY = {
  flexibility: {
    tagline: 'Go deeper with ease.',
    description: 'Short holds, low soreness, frequent practice.',
    frequency: 'Daily or post-workout',
    recovery: 'Minimal recovery needed',
    bestFor: 'Building passive range quickly',
  },
  mobility: {
    tagline: 'Own the position with strength.',
    description: 'Loaded work, more effort, more recovery.',
    frequency: '2-3x per week',
    recovery: 'Treat like strength training',
    bestFor: 'Building active control and strength in range',
  },
  hybrid: {
    tagline: 'Build both depth and strength.',
    description: 'Frequent flexibility exposure + strategic mobility work.',
    frequency: '3-4x per week',
    recovery: 'Moderate recovery days',
    bestFor: 'Balanced approach for complete range mastery',
  },
} as const

export const RANGE_INTENT_OPTIONS = [
  { 
    value: 'deeper_range' as const, 
    label: 'Deeper Range',
    description: 'Focus on getting into deeper positions',
    recommendedMode: 'flexibility' as RangeTrainingMode,
  },
  { 
    value: 'stronger_control' as const, 
    label: 'Stronger Control',
    description: 'Build strength and control at end ranges',
    recommendedMode: 'mobility' as RangeTrainingMode,
  },
  { 
    value: 'both' as const, 
    label: 'Both',
    description: 'Balance depth and strength development',
    recommendedMode: 'hybrid' as RangeTrainingMode,
  },
] as const

// =============================================================================
// MOBILITY EXERCISE DEFINITIONS
// =============================================================================

export const MOBILITY_EXERCISES: Record<RangeSkill, MobilityExercise[]> = {
  pancake: [
    {
      id: 'weighted_pancake_goodmorning',
      name: 'Weighted Pancake Good Morning',
      type: 'loaded_stretch',
      sets: 3,
      repsOrHold: '8-10',
      targetRPE: 7,
      loadSuggestion: 'Light barbell or plate',
      cues: ['Wide stance', 'Hinge at hips', 'Control the descent', 'Drive through hips'],
    },
    {
      id: 'active_pancake_pulses',
      name: 'Active Pancake Pulses',
      type: 'active_range',
      sets: 3,
      repsOrHold: '10-15 pulses',
      targetRPE: 7,
      cues: ['Engage hip flexors', 'Small controlled pulses', 'Pull yourself deeper'],
    },
    {
      id: 'pancake_compression_hold',
      name: 'Pancake Compression Hold',
      type: 'end_range_strength',
      sets: 3,
      repsOrHold: '20-30s',
      targetRPE: 8,
      cues: ['Maximum depth', 'Actively pull chest to floor', 'Squeeze at end range'],
    },
    {
      id: 'straddle_lift_offs',
      name: 'Straddle Lift-Offs',
      type: 'end_range_strength',
      sets: 3,
      repsOrHold: '5-8',
      targetRPE: 8,
      cues: ['Deep pancake position', 'Lift hands briefly', 'Control the lift'],
    },
  ],
  toe_touch: [
    {
      id: 'weighted_jefferson_curl',
      name: 'Jefferson Curl',
      type: 'loaded_stretch',
      sets: 3,
      repsOrHold: '5-8',
      targetRPE: 7,
      loadSuggestion: 'Light dumbbell or kettlebell',
      cues: ['Stand on elevated surface', 'Slowly roll down vertebra by vertebra', 'Control the load'],
    },
    {
      id: 'pike_compression_holds',
      name: 'Pike Compression Holds',
      type: 'end_range_strength',
      sets: 3,
      repsOrHold: '20-30s',
      targetRPE: 8,
      cues: ['Actively pull chest to thighs', 'Straight legs', 'Engage hip flexors'],
    },
    {
      id: 'standing_pike_pulses',
      name: 'Standing Pike Pulses',
      type: 'active_range',
      sets: 3,
      repsOrHold: '15-20 pulses',
      targetRPE: 7,
      cues: ['Soft knees to start', 'Small controlled pulses', 'Feel hamstrings engage'],
    },
    {
      id: 'elevated_pike_reach',
      name: 'Elevated Pike Reach',
      type: 'loaded_stretch',
      sets: 3,
      repsOrHold: '30s',
      targetRPE: 7,
      cues: ['Feet elevated', 'Reach past toes', 'Maintain straight legs'],
    },
  ],
  front_splits: [
    {
      id: 'loaded_lunge_stretch',
      name: 'Loaded Lunge Stretch',
      type: 'loaded_stretch',
      sets: 3,
      repsOrHold: '30s each',
      targetRPE: 7,
      loadSuggestion: 'Hold dumbbells or weight vest',
      cues: ['Deep lunge', 'Load adds stretch depth', 'Keep torso upright'],
    },
    {
      id: 'active_split_pulses',
      name: 'Active Split Pulses',
      type: 'active_range',
      sets: 3,
      repsOrHold: '10-15 each leg',
      targetRPE: 7,
      cues: ['Near end range', 'Small controlled pulses', 'Squeeze glutes on back leg'],
    },
    {
      id: 'split_hover_holds',
      name: 'Split Hover Holds',
      type: 'end_range_strength',
      sets: 3,
      repsOrHold: '15-20s each',
      targetRPE: 8,
      cues: ['Lift hands slightly', 'Hold position without support', 'Engage all muscles'],
    },
    {
      id: 'pnf_split_contract_relax',
      name: 'PNF Split Contract-Relax',
      type: 'isometric',
      sets: 3,
      repsOrHold: '5s contract, 10s relax x3',
      targetRPE: 8,
      cues: ['Contract muscles at end range', 'Relax and sink deeper', 'Repeat pattern'],
    },
  ],
  side_splits: [
    {
      id: 'loaded_horse_stance',
      name: 'Loaded Horse Stance',
      type: 'loaded_stretch',
      sets: 3,
      repsOrHold: '30-45s',
      targetRPE: 7,
      loadSuggestion: 'Goblet hold kettlebell',
      cues: ['Wide stance', 'Sink deep', 'Load helps open hips'],
    },
    {
      id: 'wall_split_slides',
      name: 'Wall Split Slides',
      type: 'active_range',
      sets: 3,
      repsOrHold: '10-15',
      targetRPE: 7,
      cues: ['Lie on back, legs up wall', 'Let legs slide apart', 'Control the descent'],
    },
    {
      id: 'active_straddle_hover',
      name: 'Active Straddle Hover',
      type: 'end_range_strength',
      sets: 3,
      repsOrHold: '15-20s',
      targetRPE: 8,
      cues: ['Near end range', 'Lift hands off floor', 'Control with leg strength'],
    },
    {
      id: 'cossack_weighted_shifts',
      name: 'Weighted Cossack Shifts',
      type: 'loaded_stretch',
      sets: 3,
      repsOrHold: '8-10 each side',
      targetRPE: 7,
      loadSuggestion: 'Light kettlebell goblet hold',
      cues: ['Deep lateral lunge', 'Straight leg stretches adductors', 'Controlled transitions'],
    },
  ],
}

// =============================================================================
// AI COACH DECISION LOGIC
// =============================================================================

export interface RangeTrainingFactors {
  skill: RangeSkill
  userPreference: RangeIntent['userPreference']
  currentFatigueLevel: 'low' | 'moderate' | 'high'
  weeklyTrainingDays: number
  sorenessToleranceHigh: boolean
  hasStrengthTrainingToday: boolean
  recoveryCapacity: 'limited' | 'moderate' | 'high'
  wantsLoadedStretching: boolean
}

/**
 * AI Coach decision function: determines optimal training mode
 */
export function determineRangeTrainingMode(factors: RangeTrainingFactors): {
  mode: RangeTrainingMode
  reasoning: string
} {
  const { 
    userPreference, 
    currentFatigueLevel, 
    weeklyTrainingDays,
    sorenessToleranceHigh,
    hasStrengthTrainingToday,
    recoveryCapacity,
    wantsLoadedStretching,
  } = factors

  // High fatigue = always flexibility (recovery-friendly)
  if (currentFatigueLevel === 'high') {
    return {
      mode: 'flexibility',
      reasoning: 'Your plan favors flexibility to increase range without adding fatigue.',
    }
  }

  // User explicitly wants passive depth only
  if (userPreference === 'deeper_range' && !wantsLoadedStretching) {
    return {
      mode: 'flexibility',
      reasoning: 'Your plan favors flexibility to increase range with low soreness.',
    }
  }

  // User explicitly wants strength in range
  if (userPreference === 'stronger_control' && recoveryCapacity !== 'limited') {
    // Check if appropriate day for mobility work
    if (!hasStrengthTrainingToday || recoveryCapacity === 'high') {
      return {
        mode: 'mobility',
        reasoning: 'Your plan favors mobility to build strength in deep positions.',
      }
    }
    // If strength training today, use hybrid to avoid overload
    return {
      mode: 'hybrid',
      reasoning: 'Using hybrid mode to balance mobility work with your strength training.',
    }
  }

  // User wants both
  if (userPreference === 'both') {
    // High training frequency = hybrid to manage volume
    if (weeklyTrainingDays >= 5) {
      return {
        mode: 'hybrid',
        reasoning: 'Hybrid mode balances your high training frequency with range work.',
      }
    }
    // Lower frequency = can do dedicated mobility days
    if (weeklyTrainingDays <= 3 && sorenessToleranceHigh) {
      return {
        mode: 'mobility',
        reasoning: 'Your schedule allows dedicated mobility sessions for maximum range strength.',
      }
    }
    return {
      mode: 'hybrid',
      reasoning: 'Your plan builds both depth and strength in range.',
    }
  }

  // Default: flexibility (safest, most recoverable)
  return {
    mode: 'flexibility',
    reasoning: 'Your plan favors flexibility for consistent, low-impact range improvement.',
  }
}

// =============================================================================
// SESSION GENERATORS
// =============================================================================

export function generateFlexibilitySession(skill: RangeSkill): FlexibilitySession {
  const minutesBySkill: Record<RangeSkill, number> = {
    toe_touch: 5,
    front_splits: 9,
    side_splits: 6,
    pancake: 6,
  }

  return {
    type: 'flexibility',
    holdTime: 15,
    rounds: 3,
    fatigueLevel: 'minimal',
    sorenessExpected: 'low',
    recoveryNeeded: 'none',
    frequency: 'daily',
    estimatedMinutes: minutesBySkill[skill],
  }
}

export function generateMobilitySession(skill: RangeSkill): MobilitySession {
  const exercises = MOBILITY_EXERCISES[skill]
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const estimatedMinutes = Math.round(totalSets * 2.5) // ~2.5 min per set with rest

  return {
    type: 'mobility',
    exercises,
    fatigueLevel: 'moderate',
    sorenessExpected: 'moderate',
    recoveryNeeded: '24-48h',
    frequency: '2-3x/week',
    estimatedMinutes,
    targetRPE: 7,
  }
}

export function generateHybridSession(skill: RangeSkill): HybridSession {
  const flexPortion = generateFlexibilitySession(skill)
  const mobilityExercises = MOBILITY_EXERCISES[skill].slice(0, 2) // Take first 2 mobility exercises
  
  const mobilityPortion: MobilitySession = {
    type: 'mobility',
    exercises: mobilityExercises,
    fatigueLevel: 'moderate',
    sorenessExpected: 'moderate',
    recoveryNeeded: '24-48h',
    frequency: '2-3x/week',
    estimatedMinutes: mobilityExercises.reduce((sum, ex) => sum + ex.sets, 0) * 2,
    targetRPE: 7,
  }

  return {
    type: 'hybrid',
    flexibilityPortion: flexPortion,
    mobilityPortion: mobilityPortion,
    fatigueLevel: 'moderate',
    sorenessExpected: 'low-moderate',
    recoveryNeeded: '24h',
    frequency: '3-4x/week',
    estimatedMinutes: flexPortion.estimatedMinutes + mobilityPortion.estimatedMinutes,
  }
}

/**
 * Generate appropriate session based on mode
 */
export function generateRangeSession(
  skill: RangeSkill, 
  mode: RangeTrainingMode
): RangeSession {
  switch (mode) {
    case 'flexibility':
      return generateFlexibilitySession(skill)
    case 'mobility':
      return generateMobilitySession(skill)
    case 'hybrid':
      return generateHybridSession(skill)
  }
}

// =============================================================================
// SESSION EXPLANATION COPY
// =============================================================================

export function getSessionExplanation(session: RangeSession): string {
  switch (session.type) {
    case 'flexibility':
      return 'This session uses short holds and multiple angles to build range without soreness.'
    case 'mobility':
      return 'This session uses loaded work and active control to build strength at end range.'
    case 'hybrid':
      return 'This session combines flexibility exposure with targeted mobility work for balanced progress.'
  }
}

export function getPlanRationale(mode: RangeTrainingMode): string {
  switch (mode) {
    case 'flexibility':
      return 'Your plan favors flexibility to increase range with low soreness.'
    case 'mobility':
      return 'Your plan favors mobility to build strength in deep positions.'
    case 'hybrid':
      return 'Your plan builds both depth and strength in range.'
  }
}
