// Program Structure Engine
// Dynamically selects optimal weekly training structure based on athlete profile

import type { PrimaryGoal, TrainingDays } from './program-service'
import type { RecoveryLevel } from './recovery-engine'

export type StructureType = 
  | 'push_pull'
  | 'upper_focused'
  | 'skill_dominant'
  | 'full_body'
  | 'push_pull_skill'
  | 'rotating_emphasis'

export type DayFocus = 
  | 'push_skill'
  | 'pull_skill'
  | 'push_strength'
  | 'pull_strength'
  | 'mixed_upper'
  | 'skill_density'
  | 'support_recovery'
  | 'transition_work'
  | 'flexibility_focus'

export interface WeeklyStructure {
  structureType: StructureType
  structureName: string
  days: DayStructure[]
  rationale: string
}

export interface DayStructure {
  dayNumber: number
  focus: DayFocus
  focusLabel: string
  isPrimary: boolean // True if this is a key session for the goal
  movementEmphasis: 'push' | 'pull' | 'mixed'
  targetIntensity: 'high' | 'moderate' | 'low'
}

interface StructureInputs {
  primaryGoal: PrimaryGoal
  trainingDays: TrainingDays
  recoveryLevel: RecoveryLevel
  hasSecondaryPull?: boolean // Has front lever or muscle-up secondary
  hasSecondaryPush?: boolean // Has planche or HSPU secondary
  constraintType?: string
}

// =============================================================================
// STRUCTURE SELECTION LOGIC
// =============================================================================

export function selectOptimalStructure(inputs: StructureInputs): WeeklyStructure {
  const { primaryGoal, trainingDays, recoveryLevel, constraintType } = inputs
  
  // Determine if goal is push or pull dominant
  const isPushGoal = primaryGoal === 'planche' || primaryGoal === 'handstand_pushup'
  const isPullGoal = primaryGoal === 'front_lever' || primaryGoal === 'muscle_up'
  const isStrengthGoal = primaryGoal === 'weighted_strength'
  const isFlexibilityGoal = ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'flexibility'].includes(primaryGoal)
  
  // Handle flexibility goals with specialized structure
  if (isFlexibilityGoal) {
    return buildFlexibilityStructure(inputs, trainingDays)
  }
  
  // Select structure based on training frequency
  if (trainingDays === 2) {
    return buildTwoDayStructure(inputs, isPushGoal, isPullGoal)
  }
  
  if (trainingDays === 3) {
    return buildThreeDayStructure(inputs, isPushGoal, isPullGoal, isStrengthGoal)
  }
  
  if (trainingDays === 4) {
    return buildFourDayStructure(inputs, isPushGoal, isPullGoal, isStrengthGoal, recoveryLevel)
  }
  
  // 5 days
  return buildFiveDayStructure(inputs, isPushGoal, isPullGoal, isStrengthGoal, recoveryLevel, constraintType)
}

// =============================================================================
// 2-DAY STRUCTURE
// =============================================================================

function buildTwoDayStructure(
  inputs: StructureInputs,
  isPushGoal: boolean,
  isPullGoal: boolean
): WeeklyStructure {
  const { primaryGoal } = inputs
  
  // 2 days = Full body approach, prioritize skill each session
  const days: DayStructure[] = [
    {
      dayNumber: 1,
      focus: isPushGoal ? 'push_skill' : 'pull_skill',
      focusLabel: isPushGoal ? 'Push Skill + Pull Support' : 'Pull Skill + Push Support',
      isPrimary: true,
      movementEmphasis: isPushGoal ? 'push' : 'pull',
      targetIntensity: 'high',
    },
    {
      dayNumber: 2,
      focus: isPushGoal ? 'pull_strength' : 'push_strength',
      focusLabel: isPushGoal ? 'Pull Strength + Push Support' : 'Push Strength + Pull Support',
      isPrimary: false,
      movementEmphasis: isPushGoal ? 'pull' : 'push',
      targetIntensity: 'moderate',
    },
  ]
  
  return {
    structureType: 'full_body',
    structureName: 'Full Body 2-Day',
    days,
    rationale: `With 2 training days, each session combines ${isPushGoal ? 'push' : 'pull'} skill work with supporting strength to maximize exposure while allowing recovery.`,
  }
}

// =============================================================================
// 3-DAY STRUCTURE
// =============================================================================

function buildThreeDayStructure(
  inputs: StructureInputs,
  isPushGoal: boolean,
  isPullGoal: boolean,
  isStrengthGoal: boolean
): WeeklyStructure {
  const { primaryGoal } = inputs
  
  if (isStrengthGoal) {
    // Strength goal: Push / Pull / Mixed
    return {
      structureType: 'push_pull',
      structureName: 'Push-Pull-Mixed',
      days: [
        {
          dayNumber: 1,
          focus: 'push_strength',
          focusLabel: 'Push Strength',
          isPrimary: true,
          movementEmphasis: 'push',
          targetIntensity: 'high',
        },
        {
          dayNumber: 2,
          focus: 'pull_strength',
          focusLabel: 'Pull Strength',
          isPrimary: true,
          movementEmphasis: 'pull',
          targetIntensity: 'high',
        },
        {
          dayNumber: 3,
          focus: 'mixed_upper',
          focusLabel: 'Mixed Upper + Core',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
      ],
      rationale: 'Alternating push and pull days maximize strength exposure with adequate recovery between sessions.',
    }
  }
  
  // Skill goal: Skill / Support / Skill
  return {
    structureType: 'skill_dominant',
    structureName: 'Skill-Support-Skill',
    days: [
      {
        dayNumber: 1,
        focus: isPushGoal ? 'push_skill' : 'pull_skill',
        focusLabel: `Primary ${isPushGoal ? 'Push' : 'Pull'} Skill`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
      {
        dayNumber: 2,
        focus: isPushGoal ? 'pull_strength' : 'push_strength',
        focusLabel: `${isPushGoal ? 'Pull' : 'Push'} Strength Support`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'pull' : 'push',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 3,
        focus: isPushGoal ? 'push_strength' : 'pull_strength',
        focusLabel: `${isPushGoal ? 'Push' : 'Pull'} Strength + Skill`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
    ],
    rationale: `Two ${isPushGoal ? 'push' : 'pull'} skill sessions per week builds skill density, with supporting ${isPushGoal ? 'pull' : 'push'} work between.`,
  }
}

// =============================================================================
// 4-DAY STRUCTURE
// =============================================================================

function buildFourDayStructure(
  inputs: StructureInputs,
  isPushGoal: boolean,
  isPullGoal: boolean,
  isStrengthGoal: boolean,
  recoveryLevel: RecoveryLevel
): WeeklyStructure {
  const { primaryGoal } = inputs
  
  if (isStrengthGoal) {
    return {
      structureType: 'push_pull',
      structureName: 'Push-Pull 4-Day',
      days: [
        {
          dayNumber: 1,
          focus: 'push_strength',
          focusLabel: 'Push Strength (Heavy)',
          isPrimary: true,
          movementEmphasis: 'push',
          targetIntensity: 'high',
        },
        {
          dayNumber: 2,
          focus: 'pull_strength',
          focusLabel: 'Pull Strength (Heavy)',
          isPrimary: true,
          movementEmphasis: 'pull',
          targetIntensity: 'high',
        },
        {
          dayNumber: 3,
          focus: 'push_strength',
          focusLabel: 'Push Strength (Volume)',
          isPrimary: false,
          movementEmphasis: 'push',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 4,
          focus: 'pull_strength',
          focusLabel: 'Pull Strength (Volume)',
          isPrimary: false,
          movementEmphasis: 'pull',
          targetIntensity: 'moderate',
        },
      ],
      rationale: 'Heavy and volume days for both push and pull patterns optimize strength development across the week.',
    }
  }
  
  // Skill goal with 4 days
  const skillLabel = isPushGoal ? 'Push' : 'Pull'
  const supportLabel = isPushGoal ? 'Pull' : 'Push'
  
  // If recovery is low, make day 3 lighter
  const day3Intensity = recoveryLevel === 'LOW' ? 'moderate' : 'high'
  
  return {
    structureType: 'push_pull_skill',
    structureName: `${skillLabel} Skill Focus`,
    days: [
      {
        dayNumber: 1,
        focus: isPushGoal ? 'push_skill' : 'pull_skill',
        focusLabel: `${skillLabel} Skill (Primary)`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
      {
        dayNumber: 2,
        focus: isPushGoal ? 'pull_strength' : 'push_strength',
        focusLabel: `${supportLabel} Support Strength`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'pull' : 'push',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 3,
        focus: isPushGoal ? 'push_strength' : 'pull_strength',
        focusLabel: `${skillLabel} Strength`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: day3Intensity as 'high' | 'moderate',
      },
      {
        dayNumber: 4,
        focus: isPushGoal ? 'mixed_upper' : 'mixed_upper',
        focusLabel: 'Mixed + Skill Density',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: 'moderate',
      },
    ],
    rationale: `Primary ${skillLabel.toLowerCase()} skill day, supporting ${supportLabel.toLowerCase()} work, ${skillLabel.toLowerCase()} strength, and mixed session for complete development.`,
  }
}

// =============================================================================
// 5-DAY STRUCTURE
// =============================================================================

function buildFiveDayStructure(
  inputs: StructureInputs,
  isPushGoal: boolean,
  isPullGoal: boolean,
  isStrengthGoal: boolean,
  recoveryLevel: RecoveryLevel,
  constraintType?: string
): WeeklyStructure {
  const skillLabel = isPushGoal ? 'Push' : 'Pull'
  const supportLabel = isPushGoal ? 'Pull' : 'Push'
  
  // If recovery is low, include a lighter day
  const includesLightDay = recoveryLevel === 'LOW'
  
  if (isStrengthGoal) {
    return {
      structureType: 'rotating_emphasis',
      structureName: 'Push-Pull Rotation',
      days: [
        {
          dayNumber: 1,
          focus: 'push_strength',
          focusLabel: 'Push (Heavy)',
          isPrimary: true,
          movementEmphasis: 'push',
          targetIntensity: 'high',
        },
        {
          dayNumber: 2,
          focus: 'pull_strength',
          focusLabel: 'Pull (Heavy)',
          isPrimary: true,
          movementEmphasis: 'pull',
          targetIntensity: 'high',
        },
        {
          dayNumber: 3,
          focus: 'mixed_upper',
          focusLabel: 'Mixed / Active Recovery',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: includesLightDay ? 'low' : 'moderate',
        },
        {
          dayNumber: 4,
          focus: 'push_strength',
          focusLabel: 'Push (Volume)',
          isPrimary: false,
          movementEmphasis: 'push',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 5,
          focus: 'pull_strength',
          focusLabel: 'Pull (Volume)',
          isPrimary: false,
          movementEmphasis: 'pull',
          targetIntensity: 'moderate',
        },
      ],
      rationale: 'Heavy days early in the week, mid-week recovery, then volume work to drive adaptation.',
    }
  }
  
  // Skill goal with 5 days - bias toward skill
  return {
    structureType: 'skill_dominant',
    structureName: `${skillLabel} Skill Dominant`,
    days: [
      {
        dayNumber: 1,
        focus: isPushGoal ? 'push_skill' : 'pull_skill',
        focusLabel: `${skillLabel} Skill (Primary)`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
      {
        dayNumber: 2,
        focus: isPushGoal ? 'pull_strength' : 'push_strength',
        focusLabel: `${supportLabel} Support`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'pull' : 'push',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 3,
        focus: isPushGoal ? 'push_strength' : 'pull_strength',
        focusLabel: `${skillLabel} Strength`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
      {
        dayNumber: 4,
        focus: 'support_recovery',
        focusLabel: 'Support + Recovery',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: includesLightDay ? 'low' : 'moderate',
      },
      {
        dayNumber: 5,
        focus: 'skill_density',
        focusLabel: `${skillLabel} Skill Density`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
    ],
    rationale: `High frequency ${skillLabel.toLowerCase()} skill exposure with strategic ${supportLabel.toLowerCase()} support and recovery built in.`,
  }
}

// =============================================================================
// STRUCTURE EXPLANATION
// =============================================================================

export function getStructureExplanation(structure: WeeklyStructure): string {
  return structure.rationale
}

export function getDayExplanation(day: DayStructure, goalName: string): string {
  const explanations: Record<DayFocus, string> = {
    push_skill: `Skill work appears first when neural quality is highest. This session prioritizes ${goalName} progression.`,
    pull_skill: `Skill work appears first when neural quality is highest. This session prioritizes ${goalName} progression.`,
    push_strength: 'Primary pushing strength work supports skill development and builds foundation.',
    pull_strength: 'Primary pulling strength work supports skill development and builds foundation.',
    mixed_upper: 'Balanced session for overall development and movement variety.',
    skill_density: 'Additional skill exposure at moderate intensity to build density without excessive fatigue.',
    support_recovery: 'Lighter session focused on support work and active recovery.',
    transition_work: 'Focused on transition patterns and movement coordination.',
    flexibility_focus: `Dedicated flexibility work for ${goalName}. Frequent exposure with moderate holds builds lasting range.`,
  }
  
  return explanations[day.focus] || 'Session designed to support overall progression.'
}

// =============================================================================
// FLEXIBILITY STRUCTURE
// =============================================================================

function buildFlexibilityStructure(
  inputs: StructureInputs,
  trainingDays: TrainingDays
): WeeklyStructure {
  const { primaryGoal } = inputs
  
  // Format goal name for display
  const goalLabel = primaryGoal === 'toe_touch' ? 'Toe Touch'
    : primaryGoal === 'front_splits' ? 'Front Splits'
    : primaryGoal === 'side_splits' ? 'Side Splits'
    : primaryGoal === 'pancake' ? 'Pancake'
    : 'Flexibility'
  
  // Flexibility philosophy: frequent short sessions > infrequent long sessions
  // Build structure based on training days available
  
  if (trainingDays === 2) {
    return {
      structureType: 'full_body',
      structureName: `${goalLabel} Focus (2x/week)`,
      days: [
        {
          dayNumber: 1,
          focus: 'flexibility_focus',
          focusLabel: `${goalLabel} + Light Strength`,
          isPrimary: true,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 2,
          focus: 'flexibility_focus',
          focusLabel: `${goalLabel} + Core/Compression`,
          isPrimary: true,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
      ],
      rationale: `${goalLabel} focused sessions with complementary strength work. Consistency is key for flexibility gains.`,
    }
  }
  
  if (trainingDays === 3) {
    return {
      structureType: 'full_body',
      structureName: `${goalLabel} Focus (3x/week)`,
      days: [
        {
          dayNumber: 1,
          focus: 'flexibility_focus',
          focusLabel: `${goalLabel} Primary`,
          isPrimary: true,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 2,
          focus: 'mixed_upper',
          focusLabel: 'Strength + Flexibility Maintenance',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 3,
          focus: 'flexibility_focus',
          focusLabel: `${goalLabel} + Active Work`,
          isPrimary: true,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
      ],
      rationale: `Alternating ${goalLabel.toLowerCase()} focused and maintenance sessions. This frequency optimizes flexibility adaptation.`,
    }
  }
  
  if (trainingDays === 4) {
    return {
      structureType: 'full_body',
      structureName: `${goalLabel} Focus (4x/week)`,
      days: [
        {
          dayNumber: 1,
          focus: 'flexibility_focus',
          focusLabel: `${goalLabel} Deep Work`,
          isPrimary: true,
          movementEmphasis: 'mixed',
          targetIntensity: 'high',
        },
        {
          dayNumber: 2,
          focus: 'mixed_upper',
          focusLabel: 'Strength + Active Flexibility',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 3,
          focus: 'flexibility_focus',
          focusLabel: `${goalLabel} + Core`,
          isPrimary: true,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 4,
          focus: 'support_recovery',
          focusLabel: 'Light Flexibility + Recovery',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'low',
        },
      ],
      rationale: `High frequency ${goalLabel.toLowerCase()} exposure with strategic recovery. 4 sessions/week is ideal for flexibility progress.`,
    }
  }
  
  // 5 days
  return {
    structureType: 'full_body',
    structureName: `${goalLabel} Focus (5x/week)`,
    days: [
      {
        dayNumber: 1,
        focus: 'flexibility_focus',
        focusLabel: `${goalLabel} Deep Work`,
        isPrimary: true,
        movementEmphasis: 'mixed',
        targetIntensity: 'high',
      },
      {
        dayNumber: 2,
        focus: 'mixed_upper',
        focusLabel: 'Strength + Active Flexibility',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 3,
        focus: 'flexibility_focus',
        focusLabel: `${goalLabel} + Compression`,
        isPrimary: true,
        movementEmphasis: 'mixed',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 4,
        focus: 'support_recovery',
        focusLabel: 'Light Flexibility + Recovery',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: 'low',
      },
      {
        dayNumber: 5,
        focus: 'flexibility_focus',
        focusLabel: `${goalLabel} + Active Work`,
        isPrimary: true,
        movementEmphasis: 'mixed',
        targetIntensity: 'moderate',
      },
    ],
    rationale: `Maximum ${goalLabel.toLowerCase()} frequency with strategic recovery. This structure drives rapid flexibility adaptation.`,
  }
}
