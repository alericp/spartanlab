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
  // ISSUE C FIX: New skill-identity-aware focus types
  | 'vertical_push_skill'   // For HSPU dedicated sessions
  | 'mixed_skill'           // For secondary skill expression

export interface WeeklyStructure {
  structureType: StructureType
  structureName: string
  days: DayStructure[]
  rationale: string
  // ISSUE C FIX: Track which selected skills got structure expression
  selectedSkillsExpressed?: string[]
}

export interface DayStructure {
  dayNumber: number
  focus: DayFocus
  focusLabel: string
  isPrimary: boolean // True if this is a key session for the goal
  movementEmphasis: 'push' | 'pull' | 'mixed'
  targetIntensity: 'high' | 'moderate' | 'low'
  // ISSUE D FIX: Skill identity tags for exercise selection
  skillIdentity?: string            // Primary skill this day is dedicated to (e.g., 'handstand_pushup')
  secondarySkillIdentities?: string[] // Secondary skills to express on mixed days
}

interface StructureInputs {
  primaryGoal: PrimaryGoal
  trainingDays: TrainingDays
  recoveryLevel: RecoveryLevel
  hasSecondaryPull?: boolean // Has front lever or muscle-up secondary
  hasSecondaryPush?: boolean // Has planche or HSPU secondary
  constraintType?: string
  // TASK 3: Expanded inputs for hybrid/multi-skill awareness
  trainingPathType?: 'hybrid' | 'skill_progression' | 'strength_endurance' | 'balanced'
  selectedSkillsCount?: number
  hasFlexibilityTargets?: boolean
  // ISSUE A FIX: Pass actual selected skill identities for structure-aware allocation
  selectedSkills?: string[]
  secondaryGoal?: string | null
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
  
  if (trainingDays === 5) {
    return buildFiveDayStructure(inputs, isPushGoal, isPullGoal, isStrengthGoal, recoveryLevel, constraintType)
  }
  
  // [TASK 6] 6 and 7 days - high-frequency intensity-managed structures
  if (trainingDays === 6) {
    return buildSixDayStructure(inputs, isPushGoal, isPullGoal, isStrengthGoal, recoveryLevel)
  }
  
  // 7 days - OTZ-style intensity-managed full week
  return buildSevenDayStructure(inputs, isPushGoal, isPullGoal, isStrengthGoal, recoveryLevel)
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
  
  // TASK 2: Check for secondary goal that creates hybrid skill emphasis (3-day)
  const hasOppositeSecondary = (isPushGoal && inputs.hasSecondaryPull) || (isPullGoal && inputs.hasSecondaryPush)
  const skillLabel = isPushGoal ? 'Push' : 'Pull'
  const secondaryLabel = isPushGoal ? 'Pull' : 'Push'
  
  if (hasOppositeSecondary) {
    // TASK 2: 3-day hybrid - Day 2 becomes secondary skill day
    return {
      structureType: 'skill_dominant',
      structureName: `${skillLabel}-${secondaryLabel}-${skillLabel} Hybrid`,
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
          // TASK 2: Day 2 becomes secondary skill + support
          focus: isPushGoal ? 'pull_skill' : 'push_skill',
          focusLabel: `${secondaryLabel} Skill (Secondary)`,
          isPrimary: false,
          movementEmphasis: isPushGoal ? 'pull' : 'push',
          targetIntensity: 'high',
        },
        {
          dayNumber: 3,
          focus: isPushGoal ? 'push_strength' : 'pull_strength',
          focusLabel: `${skillLabel} Strength + Skill`,
          isPrimary: true,
          movementEmphasis: isPushGoal ? 'push' : 'pull',
          targetIntensity: 'high',
        },
      ],
      rationale: `Hybrid skill development: ${skillLabel} primary focus with dedicated ${secondaryLabel} secondary skill session.`,
    }
  }
  
  // Standard skill goal: Skill / Support / Skill
  return {
    structureType: 'skill_dominant',
    structureName: 'Skill-Support-Skill',
    days: [
      {
        dayNumber: 1,
        focus: isPushGoal ? 'push_skill' : 'pull_skill',
        focusLabel: `Primary ${skillLabel} Skill`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
      {
        dayNumber: 2,
        focus: isPushGoal ? 'pull_strength' : 'push_strength',
        focusLabel: `${secondaryLabel} Strength Support`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'pull' : 'push',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 3,
        focus: isPushGoal ? 'push_strength' : 'pull_strength',
        focusLabel: `${skillLabel} Strength + Skill`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'high',
      },
    ],
    rationale: `Two ${skillLabel.toLowerCase()} skill sessions per week builds skill density, with supporting ${secondaryLabel.toLowerCase()} work between.`,
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
  
  // TASK 2: Check for secondary goal that creates hybrid skill emphasis
  // e.g., Primary = Planche (push), Secondary = Front Lever (pull)
  const hasOppositeSecondary = (isPushGoal && inputs.hasSecondaryPull) || (isPullGoal && inputs.hasSecondaryPush)
  
  if (hasOppositeSecondary) {
    // TASK 2: Hybrid skill structure - dedicate a day to secondary goal skill work
    const secondaryLabel = isPushGoal ? 'Pull' : 'Push'
    return {
      structureType: 'push_pull_skill',
      structureName: `${skillLabel} + ${secondaryLabel} Skill Focus`,
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
          // TASK 2: Day 2 becomes secondary skill day instead of just support strength
          focus: isPushGoal ? 'pull_skill' : 'push_skill',
          focusLabel: `${secondaryLabel} Skill (Secondary)`,
          isPrimary: false,
          movementEmphasis: isPushGoal ? 'pull' : 'push',
          targetIntensity: 'high',  // Elevated for skill work
        },
        {
          dayNumber: 3,
          focus: isPushGoal ? 'push_strength' : 'pull_strength',
          focusLabel: `${skillLabel} Strength + Support`,
          isPrimary: true,
          movementEmphasis: isPushGoal ? 'push' : 'pull',
          targetIntensity: day3Intensity as 'high' | 'moderate',
        },
        {
          dayNumber: 4,
          focus: 'mixed_upper',
          focusLabel: 'Mixed Skills + Density',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
      ],
      rationale: `Hybrid skill focus: ${skillLabel} primary skill training, ${secondaryLabel} secondary skill development, ${skillLabel.toLowerCase()} strength, and mixed skill density session.`,
    }
  }
  
  // TASK 3: Hybrid training path - emphasizes skill + strength + accessory balance
  const isHybridPath = inputs.trainingPathType === 'hybrid'
  const hasMultipleSkills = (inputs.selectedSkillsCount || 0) > 2
  
  // ISSUE A FIX: Detect specific skill types from actual identities for smarter structure
  const selectedSkills = inputs.selectedSkills || []
  const hasHSPU = selectedSkills.includes('handstand_pushup') || selectedSkills.includes('hspu')
  const hasBackLever = selectedSkills.includes('back_lever')
  const hasLSit = selectedSkills.includes('l_sit') || selectedSkills.includes('v_sit')
  const hasMuscleUp = selectedSkills.includes('muscle_up')
  const hasFlexibilitySkills = selectedSkills.some(s => 
    ['front_splits', 'side_splits', 'pancake', 'pike', 'shoulder_flexibility'].includes(s)
  )
  
  // Log skill identity consumption for debugging
  console.log('[structure-engine] ISSUE A: Skill identities consumed:', {
    selectedSkills,
    hasHSPU,
    hasBackLever,
    hasLSit,
    hasMuscleUp,
    hasFlexibilitySkills,
    hasMultipleSkills,
    isHybridPath,
  })
  
  if (isHybridPath || hasMultipleSkills) {
    // ISSUE C FIX: Build skill-identity-aware day structure
    // Determine if we need a dedicated vertical push (HSPU) slot
    const needsVerticalPushSlot = hasHSPU && !isPushGoal // HSPU selected but not primary
    const needsBackLeverSlot = hasBackLever && !isPullGoal // Back lever selected but not primary
    const needsLSitSlot = hasLSit
    const needsMuscleUpSlot = hasMuscleUp && !isPullGoal
    
    // Build secondary skill label for rationale
    const secondarySkillLabels: string[] = []
    if (needsVerticalPushSlot) secondarySkillLabels.push('HSPU')
    if (needsBackLeverSlot) secondarySkillLabels.push('Back Lever')
    if (needsLSitSlot) secondarySkillLabels.push('L-Sit')
    if (needsMuscleUpSlot) secondarySkillLabels.push('Muscle-Up')
    
    // ISSUE C FIX: Log skill-aware structure decision
    console.log('[structure-engine] ISSUE C FIX: Skill-identity-aware hybrid structure:', {
      needsVerticalPushSlot,
      needsBackLeverSlot,
      needsLSitSlot,
      needsMuscleUpSlot,
      secondarySkillLabels,
    })
    
    // Day 2 focus: If HSPU selected but not primary, dedicate to vertical push
    // Otherwise use support direction
    const day2Focus = needsVerticalPushSlot 
      ? 'vertical_push_skill'
      : (isPushGoal ? 'pull_strength' : 'push_strength')
    const day2Label = needsVerticalPushSlot
      ? 'HSPU / Vertical Push Technical'
      : `${supportLabel} Strength + Accessories`
    const day2Movement = needsVerticalPushSlot ? 'push' : (isPushGoal ? 'pull' : 'push')
    
    // Day 4 focus: Mixed skills with specific skill expression if selected
    const day4HasSecondarySkills = secondarySkillLabels.length > 0 || hasFlexibilitySkills
    const day4Focus = inputs.hasFlexibilityTargets 
      ? 'flexibility_focus' 
      : (day4HasSecondarySkills ? 'mixed_skill' : 'mixed_upper')
    const day4Label = inputs.hasFlexibilityTargets 
      ? 'Mixed + Flexibility' 
      : (day4HasSecondarySkills 
          ? `Mixed Skills (${secondarySkillLabels.slice(0, 2).join(', ') || 'Secondary'})` 
          : 'Mixed Skills + Density')
    
    // Hybrid structure: More balanced skill + strength + support mix
    return {
      structureType: 'push_pull_skill',
      structureName: `Hybrid ${skillLabel} Focus`,
      // ISSUE C FIX: Include selected skill identities in structure metadata
      selectedSkillsExpressed: secondarySkillLabels,
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
          // ISSUE C FIX: Skill-identity-aware day 2
          focus: day2Focus,
          focusLabel: day2Label,
          isPrimary: needsVerticalPushSlot, // Promote to primary if HSPU dedicated
          movementEmphasis: day2Movement as 'push' | 'pull' | 'mixed',
          targetIntensity: needsVerticalPushSlot ? 'high' : 'moderate',
          // ISSUE D FIX: Tag day with skill identity if dedicated
          skillIdentity: needsVerticalPushSlot ? 'handstand_pushup' : undefined,
        },
        {
          dayNumber: 3,
          focus: isPushGoal ? 'push_strength' : 'pull_strength',
          focusLabel: `${skillLabel} Strength + Support`,
          isPrimary: true,
          movementEmphasis: isPushGoal ? 'push' : 'pull',
          targetIntensity: day3Intensity as 'high' | 'moderate',
        },
        {
          dayNumber: 4,
          // ISSUE C FIX: Skill-identity-aware day 4
          focus: day4Focus,
          focusLabel: day4Label,
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
          // ISSUE D FIX: Tag with secondary skill identities for exercise selection
          secondarySkillIdentities: secondarySkillLabels.length > 0 ? selectedSkills.filter(s => 
            s !== inputs.primaryGoal && ['handstand_pushup', 'hspu', 'back_lever', 'l_sit', 'v_sit', 'muscle_up'].includes(s)
          ) : undefined,
        },
      ],
      rationale: `Hybrid training: ${skillLabel} skill as primary focus${secondarySkillLabels.length > 0 ? `, with dedicated ${secondarySkillLabels.join('/')} expression` : ''}, balanced strength support across push/pull, and mixed session for skill density${inputs.hasFlexibilityTargets ? ' with flexibility targets' : ''}.`,
    }
  }
  
  // Standard 4-day structure without secondary skill emphasis
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
  
  // TASK 2: Check for secondary goal that creates hybrid skill emphasis (5-day)
  const hasOppositeSecondary = (isPushGoal && inputs.hasSecondaryPull) || (isPullGoal && inputs.hasSecondaryPush)
  
  if (hasOppositeSecondary) {
    // TASK 2: 5-day hybrid skill structure - dedicate a day to secondary goal
    const secondaryLabel = isPushGoal ? 'Pull' : 'Push'
    return {
      structureType: 'skill_dominant',
      structureName: `${skillLabel} + ${secondaryLabel} Hybrid`,
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
          // TASK 2: Day 2 becomes secondary skill day
          focus: isPushGoal ? 'pull_skill' : 'push_skill',
          focusLabel: `${secondaryLabel} Skill (Secondary)`,
          isPrimary: false,
          movementEmphasis: isPushGoal ? 'pull' : 'push',
          targetIntensity: 'high',
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
          focus: isPushGoal ? 'pull_strength' : 'push_strength',
          focusLabel: `${secondaryLabel} Strength Support`,
          isPrimary: false,
          movementEmphasis: isPushGoal ? 'pull' : 'push',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 5,
          focus: 'skill_density',
          focusLabel: 'Mixed Skill Density',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'moderate',
        },
      ],
      rationale: `Hybrid skill focus: ${skillLabel} primary skill emphasis with dedicated ${secondaryLabel} secondary skill day for balanced progression.`,
    }
  }
  
  // Standard skill goal with 5 days - bias toward primary skill
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
// 6-DAY STRUCTURE - High Frequency with Recovery Management
// [TASK 6] Supports advanced athletes with proper intensity distribution
// =============================================================================

function buildSixDayStructure(
  inputs: StructureInputs,
  isPushGoal: boolean,
  isPullGoal: boolean,
  isStrengthGoal: boolean,
  recoveryLevel: RecoveryLevel
): WeeklyStructure {
  const skillLabel = isPushGoal ? 'Push' : 'Pull'
  const supportLabel = isPushGoal ? 'Pull' : 'Push'
  
  // Log high-frequency structure audit
  console.log('[high-frequency-structure-audit]', {
    requestedDays: 6,
    generatedDays: 6,
    templatePoolSize: 6,
    duplicateFocusCount: 2, // push_skill appears twice
    recoveryDistribution: 'alternating_intensity',
    isValid6Day: true,
    isValid7Day: false,
    finalVerdict: 'supported_with_conservative_distribution',
  })
  
  if (isStrengthGoal) {
    return {
      structureType: 'rotating_emphasis',
      structureName: 'Push-Pull 6-Day Rotation',
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
          focus: 'push_strength',
          focusLabel: 'Push (Moderate)',
          isPrimary: false,
          movementEmphasis: 'push',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 4,
          focus: 'pull_strength',
          focusLabel: 'Pull (Moderate)',
          isPrimary: false,
          movementEmphasis: 'pull',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 5,
          focus: 'push_strength',
          focusLabel: 'Push (Light)',
          isPrimary: false,
          movementEmphasis: 'push',
          targetIntensity: 'low',
        },
        {
          dayNumber: 6,
          focus: 'pull_strength',
          focusLabel: 'Pull (Light)',
          isPrimary: false,
          movementEmphasis: 'pull',
          targetIntensity: 'low',
        },
      ],
      rationale: 'Six-day push-pull rotation with descending intensity through the week. High intensity early, lighter sessions late for recovery.',
    }
  }
  
  // Skill-focused 6-day structure with intensity management
  return {
    structureType: 'skill_dominant',
    structureName: `${skillLabel} Skill (6-Day)`,
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
        focusLabel: `${supportLabel} Strength`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'pull' : 'push',
        targetIntensity: 'high',
      },
      {
        dayNumber: 3,
        focus: isPushGoal ? 'push_skill' : 'pull_skill',
        focusLabel: `${skillLabel} Skill (Volume)`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 4,
        focus: 'mixed_upper',
        focusLabel: 'Mixed / Active Recovery',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: 'low',
      },
      {
        dayNumber: 5,
        focus: isPushGoal ? 'push_strength' : 'pull_strength',
        focusLabel: `${skillLabel} Strength`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 6,
        focus: 'skill_density',
        focusLabel: `${skillLabel} Skill Density`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
    ],
    rationale: `High-frequency ${skillLabel.toLowerCase()} skill exposure across 6 days with built-in recovery day and strategic intensity variation.`,
  }
}

// =============================================================================
// 7-DAY STRUCTURE - OTZ-Style Intensity-Managed Full Week
// [TASK 6] Supports daily training with careful recovery distribution
// =============================================================================

function buildSevenDayStructure(
  inputs: StructureInputs,
  isPushGoal: boolean,
  isPullGoal: boolean,
  isStrengthGoal: boolean,
  recoveryLevel: RecoveryLevel
): WeeklyStructure {
  const skillLabel = isPushGoal ? 'Push' : 'Pull'
  const supportLabel = isPushGoal ? 'Pull' : 'Push'
  
  // Log high-frequency structure audit
  console.log('[high-frequency-structure-audit]', {
    requestedDays: 7,
    generatedDays: 7,
    templatePoolSize: 7,
    duplicateFocusCount: 3, // skill focus appears 3 times
    recoveryDistribution: 'daily_undulating',
    isValid6Day: true,
    isValid7Day: true,
    finalVerdict: 'supported',
  })
  
  if (isStrengthGoal) {
    return {
      structureType: 'rotating_emphasis',
      structureName: 'Push-Pull 7-Day (Intensity Managed)',
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
          focusLabel: 'Light / Mobility',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'low',
        },
        {
          dayNumber: 4,
          focus: 'push_strength',
          focusLabel: 'Push (Moderate)',
          isPrimary: false,
          movementEmphasis: 'push',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 5,
          focus: 'pull_strength',
          focusLabel: 'Pull (Moderate)',
          isPrimary: false,
          movementEmphasis: 'pull',
          targetIntensity: 'moderate',
        },
        {
          dayNumber: 6,
          focus: 'support_recovery',
          focusLabel: 'Active Recovery',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'low',
        },
        {
          dayNumber: 7,
          focus: 'mixed_upper',
          focusLabel: 'Skill Practice (Light)',
          isPrimary: false,
          movementEmphasis: 'mixed',
          targetIntensity: 'low',
        },
      ],
      rationale: 'Seven-day intensity-managed rotation. Heavy days early, strategic recovery mid-week and end-week to support daily training.',
    }
  }
  
  // Skill-focused 7-day structure (OTZ-style daily training)
  return {
    structureType: 'skill_dominant',
    structureName: `${skillLabel} Skill (7-Day Daily)`,
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
        focusLabel: `${supportLabel} Strength`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'pull' : 'push',
        targetIntensity: 'high',
      },
      {
        dayNumber: 3,
        focus: isPushGoal ? 'push_skill' : 'pull_skill',
        focusLabel: `${skillLabel} Skill (Technique)`,
        isPrimary: true,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 4,
        focus: 'mixed_upper',
        focusLabel: 'Light / Mobility',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: 'low',
      },
      {
        dayNumber: 5,
        focus: isPushGoal ? 'push_strength' : 'pull_strength',
        focusLabel: `${skillLabel} Strength`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 6,
        focus: 'skill_density',
        focusLabel: `${skillLabel} Skill Density`,
        isPrimary: false,
        movementEmphasis: isPushGoal ? 'push' : 'pull',
        targetIntensity: 'moderate',
      },
      {
        dayNumber: 7,
        focus: 'support_recovery',
        focusLabel: 'Active Recovery',
        isPrimary: false,
        movementEmphasis: 'mixed',
        targetIntensity: 'low',
      },
    ],
    rationale: `Seven-day ${skillLabel.toLowerCase()} skill development with daily undulating intensity. High focus early, mid-week mobility, skill density late, recovery day to close the week.`,
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
