/**
 * Session Assembly Engine
 * 
 * Deterministic rules for assembling training sessions based on:
 * - User goals and focus
 * - Training principles
 * - Session length
 * - Fatigue management
 * 
 * Each session type has specific block ordering rules.
 * Integrates with intelligent prehab/joint preparation system for adaptive mobility_activation blocks.
 */

import type { PrimaryTrainingOutcome } from './athlete-profile'
import type { ExperienceLevel, SessionLength, PrimaryGoal } from './program-service'
import { generateIntelligentPrehab } from './prehab'
import type { IntelligentPrehabContext } from './prehab'

// =============================================================================
// SESSION BLOCK TYPES
// =============================================================================

export type SessionBlockType =
  | 'warmup'
  | 'mobility_activation'
  | 'skill_balance'        // Handstand balance, skill practice
  | 'skill_isometric'      // Planche, front lever holds
  | 'skill_dynamic'        // Muscle-up work
  | 'primary_strength'     // Main strength work
  | 'secondary_strength'   // Accessory strength
  | 'accessory'           // Isolation and support
  | 'conditioning'        // Density, circuits
  | 'flexibility'         // Stretching, mobility
  | 'cooldown'

export interface SessionBlock {
  type: SessionBlockType
  name: string
  durationMinutes: number
  exercises: number
  intensity: 'low' | 'moderate' | 'high'
  restBetweenSets: [number, number] // seconds range
  notes: string[]
}

export interface SessionTemplate {
  id: string
  name: string
  description: string
  applicableTo: PrimaryTrainingOutcome[]
  totalDurationMinutes: number
  blocks: SessionBlock[]
  principlesApplied: string[]
}

// =============================================================================
// SESSION TEMPLATES BY FOCUS
// =============================================================================

export function buildSkillFirstSession(duration: number): SessionTemplate {
  const isShort = duration <= 45
  const isMedium = duration > 45 && duration <= 60
  const isLong = duration > 60
  
  const blocks: SessionBlock[] = [
    {
      type: 'warmup',
      name: 'General Warm-up',
      durationMinutes: 5,
      exercises: 3,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Light cardio', 'Joint circles', 'Dynamic stretches'],
    },
    {
      type: 'mobility_activation',
      name: 'Specific Prep',
      durationMinutes: isShort ? 3 : 5,
      exercises: 2,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Wrist prep', 'Shoulder activation', 'Scapular work'],
    },
    {
      type: 'skill_balance',
      name: 'Balance Skill Practice',
      durationMinutes: Math.min(10, duration * 0.15),
      exercises: 1,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Handstand practice', 'Quality over volume', 'End on good rep'],
    },
    {
      type: 'skill_isometric',
      name: 'Isometric Skill Work',
      durationMinutes: Math.min(15, duration * 0.25),
      exercises: 2,
      intensity: 'high',
      restBetweenSets: [120, 180],
      notes: ['Primary skill focus', 'Full rest between sets', 'Quality holds'],
    },
  ]
  
  if (isMedium || isLong) {
    blocks.push({
      type: 'primary_strength',
      name: 'Support Strength',
      durationMinutes: Math.min(15, duration * 0.2),
      exercises: 2,
      intensity: 'high',
      restBetweenSets: [90, 120],
      notes: ['Skill-specific strength work', 'Push/pull balance'],
    })
  }
  
  if (isLong) {
    blocks.push({
      type: 'accessory',
      name: 'Accessory Work',
      durationMinutes: Math.min(10, duration * 0.1),
      exercises: 2,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Weak point focus', 'Support muscles'],
    })
  }
  
  blocks.push({
    type: 'cooldown',
    name: 'Cooldown & Flexibility',
    durationMinutes: isShort ? 3 : 5,
    exercises: 2,
    intensity: 'low',
    restBetweenSets: [0, 0],
    notes: ['Static stretching', 'Breathing exercises'],
  })
  
  return {
    id: 'skill_first',
    name: 'Skill-Focused Session',
    description: 'Skill work prioritized early when CNS is fresh',
    applicableTo: ['skills'],
    totalDurationMinutes: duration,
    blocks,
    principlesApplied: [
      'skill_first_sequencing',
      'neural_output_priority',
      'quality_over_volume',
    ],
  }
}

export function buildWeightedStrengthSession(duration: number): SessionTemplate {
  const isShort = duration <= 45
  const isLong = duration >= 75
  
  const blocks: SessionBlock[] = [
    {
      type: 'warmup',
      name: 'General Warm-up',
      durationMinutes: 5,
      exercises: 3,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Light movement', 'Joint prep', 'Blood flow'],
    },
    {
      type: 'mobility_activation',
      name: 'Movement Prep',
      durationMinutes: 5,
      exercises: 3,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Shoulder circles', 'Band pull-aparts', 'Hip circles'],
    },
    {
      type: 'primary_strength',
      name: 'Primary Lift',
      durationMinutes: isShort ? 15 : isLong ? 25 : 20,
      exercises: 1,
      intensity: 'high',
      restBetweenSets: [180, 300],
      notes: ['Heavy compound movement', 'Full rest', '3-5 reps focus'],
    },
    {
      type: 'secondary_strength',
      name: 'Secondary Lift',
      durationMinutes: isShort ? 10 : 15,
      exercises: 1,
      intensity: 'high',
      restBetweenSets: [120, 180],
      notes: ['Complementary movement', '5-8 reps'],
    },
  ]
  
  if (!isShort) {
    blocks.push({
      type: 'accessory',
      name: 'Accessory Work',
      durationMinutes: 10,
      exercises: 2,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Support muscles', 'Higher reps'],
    })
  }
  
  if (isLong) {
    blocks.push({
      type: 'flexibility',
      name: 'Mobility Work',
      durationMinutes: 5,
      exercises: 2,
      intensity: 'low',
      restBetweenSets: [0, 0],
      notes: ['Target tight areas', 'Active recovery'],
    })
  }
  
  blocks.push({
    type: 'cooldown',
    name: 'Cooldown',
    durationMinutes: 3,
    exercises: 2,
    intensity: 'low',
    restBetweenSets: [0, 0],
    notes: ['Light stretching', 'Deep breathing'],
  })
  
  return {
    id: 'weighted_strength',
    name: 'Weighted Strength Session',
    description: 'Heavy compound work with full recovery',
    applicableTo: ['strength'],
    totalDurationMinutes: duration,
    blocks,
    principlesApplied: [
      'weighted_strength_progression',
      'neural_output_strength',
      'long_rest_strength',
      'quality_over_volume',
    ],
  }
}

export function buildHandstandFocusedSession(duration: number): SessionTemplate {
  const blocks: SessionBlock[] = [
    {
      type: 'warmup',
      name: 'General Warm-up',
      durationMinutes: 5,
      exercises: 3,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Light cardio', 'Joint circles'],
    },
    {
      type: 'mobility_activation',
      name: 'Wrist & Shoulder Prep',
      durationMinutes: 5,
      exercises: 4,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Wrist prep routine', 'Shoulder flexion stretches', 'Scapular activation'],
    },
    {
      type: 'skill_balance',
      name: 'Handstand Balance Practice',
      durationMinutes: Math.min(15, duration * 0.25),
      exercises: 1,
      intensity: 'moderate',
      restBetweenSets: [60, 120],
      notes: [
        'Quality over quantity',
        'End on a good attempt',
        'Short attempts (under 30s)',
        'Full rest between attempts',
      ],
    },
  ]
  
  // Only add push strength if there's time and no heavy pushing elsewhere
  if (duration >= 45) {
    blocks.push({
      type: 'primary_strength',
      name: 'Push Strength (Optional)',
      durationMinutes: Math.min(15, duration * 0.2),
      exercises: 2,
      intensity: 'high',
      restBetweenSets: [90, 120],
      notes: [
        'Pike push-ups or HSPU progressions',
        'Skip if heavy pushing is programmed elsewhere',
      ],
    })
  }
  
  if (duration >= 60) {
    blocks.push({
      type: 'accessory',
      name: 'Shoulder Stability',
      durationMinutes: 10,
      exercises: 2,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Face pulls', 'External rotation work'],
    })
  }
  
  blocks.push({
    type: 'cooldown',
    name: 'Cooldown & Stretching',
    durationMinutes: 5,
    exercises: 3,
    intensity: 'low',
    restBetweenSets: [0, 0],
    notes: ['Wrist stretches', 'Shoulder stretches', 'Hip flexor stretch'],
  })
  
  return {
    id: 'handstand_focus',
    name: 'Handstand Practice Session',
    description: 'High-frequency balance skill work',
    applicableTo: ['skills'],
    totalDurationMinutes: duration,
    blocks,
    principlesApplied: [
      'skill_frequency_training',
      'quality_over_volume',
      'balance_skill_priority',
    ],
  }
}

export function buildMilitaryConditioningSession(duration: number): SessionTemplate {
  const blocks: SessionBlock[] = [
    {
      type: 'warmup',
      name: 'Dynamic Warm-up',
      durationMinutes: 5,
      exercises: 4,
      intensity: 'moderate',
      restBetweenSets: [20, 30],
      notes: ['Light jog', 'Dynamic stretches', 'Movement prep'],
    },
    {
      type: 'primary_strength',
      name: 'Event-Specific Work',
      durationMinutes: Math.min(20, duration * 0.3),
      exercises: 2,
      intensity: 'high',
      restBetweenSets: [60, 90],
      notes: ['Test event practice', 'Near-test pace', 'Technique focus'],
    },
    {
      type: 'conditioning',
      name: 'Conditioning Block',
      durationMinutes: Math.min(15, duration * 0.25),
      exercises: 3,
      intensity: 'high',
      restBetweenSets: [30, 60],
      notes: ['Density circuit', 'Repeat effort', 'Fatigue tolerance'],
    },
  ]
  
  if (duration >= 60) {
    blocks.push({
      type: 'secondary_strength',
      name: 'Supplementary Work',
      durationMinutes: 10,
      exercises: 2,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Support exercises', 'Weak point development'],
    })
  }
  
  // Optional running block if time permits
  if (duration >= 45) {
    blocks.push({
      type: 'conditioning',
      name: 'Running/Cardio Block',
      durationMinutes: Math.min(15, duration * 0.2),
      exercises: 1,
      intensity: 'moderate',
      restBetweenSets: [60, 120],
      notes: ['Interval running', 'Pace work', 'Aerobic development'],
    })
  }
  
  blocks.push({
    type: 'cooldown',
    name: 'Cooldown',
    durationMinutes: 5,
    exercises: 3,
    intensity: 'low',
    restBetweenSets: [0, 0],
    notes: ['Light stretching', 'Hip mobility', 'Breathing'],
  })
  
  return {
    id: 'military_conditioning',
    name: 'Military Prep Session',
    description: 'Event-specific work with tactical conditioning',
    applicableTo: ['military'],
    totalDurationMinutes: duration,
    blocks,
    principlesApplied: [
      'endurance_density_training',
      'fatigue_tolerance',
      'event_specific_preparation',
    ],
  }
}

export function buildEnduranceSession(duration: number): SessionTemplate {
  const blocks: SessionBlock[] = [
    {
      type: 'warmup',
      name: 'Warm-up',
      durationMinutes: 5,
      exercises: 3,
      intensity: 'moderate',
      restBetweenSets: [20, 30],
      notes: ['Elevate heart rate', 'Movement prep'],
    },
    {
      type: 'conditioning',
      name: 'Work Capacity Block',
      durationMinutes: Math.min(20, duration * 0.35),
      exercises: 4,
      intensity: 'moderate',
      restBetweenSets: [30, 60],
      notes: ['Circuit format', 'Moderate pace', 'Build volume'],
    },
    {
      type: 'conditioning',
      name: 'Density Circuit',
      durationMinutes: Math.min(15, duration * 0.25),
      exercises: 3,
      intensity: 'high',
      restBetweenSets: [20, 45],
      notes: ['Higher intensity', 'Less rest', 'Push through fatigue'],
    },
  ]
  
  if (duration >= 60) {
    blocks.push({
      type: 'primary_strength',
      name: 'Strength Maintenance',
      durationMinutes: 10,
      exercises: 2,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Maintain strength while focusing on endurance'],
    })
  }
  
  blocks.push({
    type: 'cooldown',
    name: 'Cooldown',
    durationMinutes: 5,
    exercises: 3,
    intensity: 'low',
    restBetweenSets: [0, 0],
    notes: ['Active recovery', 'Static stretching', 'Breathing'],
  })
  
  return {
    id: 'endurance_focus',
    name: 'Endurance & Conditioning Session',
    description: 'Work capacity and conditioning focus',
    applicableTo: ['endurance', 'general_fitness'],
    totalDurationMinutes: duration,
    blocks,
    principlesApplied: [
      'endurance_density_training',
      'work_capacity_development',
      'fatigue_budgeting',
    ],
  }
}

export function buildLongStrengthSession(duration: number): SessionTemplate {
  // 90-120 minute sessions for serious strength athletes
  const blocks: SessionBlock[] = [
    {
      type: 'warmup',
      name: 'Comprehensive Warm-up',
      durationMinutes: 10,
      exercises: 5,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Light cardio', 'Full joint prep', 'Movement patterns'],
    },
    {
      type: 'mobility_activation',
      name: 'Movement Prep',
      durationMinutes: 10,
      exercises: 4,
      intensity: 'moderate',
      restBetweenSets: [30, 45],
      notes: ['Dynamic stretches', 'Activation drills', 'CNS priming'],
    },
    {
      type: 'skill_isometric',
      name: 'Skill Block (Optional)',
      durationMinutes: 15,
      exercises: 1,
      intensity: 'high',
      restBetweenSets: [180, 240],
      notes: ['If training skills', 'Full rest', 'Quality focus'],
    },
    {
      type: 'primary_strength',
      name: 'Primary Strength Block',
      durationMinutes: 30,
      exercises: 2,
      intensity: 'high',
      restBetweenSets: [180, 300],
      notes: ['Heavy compounds', '5+ minute rest on top sets', 'Low reps'],
    },
    {
      type: 'secondary_strength',
      name: 'Secondary Strength',
      durationMinutes: 20,
      exercises: 2,
      intensity: 'high',
      restBetweenSets: [120, 180],
      notes: ['Complementary lifts', 'Moderate reps'],
    },
    {
      type: 'accessory',
      name: 'Accessory Work',
      durationMinutes: 15,
      exercises: 3,
      intensity: 'moderate',
      restBetweenSets: [60, 90],
      notes: ['Support muscles', 'Higher volume'],
    },
    {
      type: 'flexibility',
      name: 'Mobility & Flexibility',
      durationMinutes: 10,
      exercises: 4,
      intensity: 'low',
      restBetweenSets: [0, 0],
      notes: ['Target tight areas', 'Recovery prep'],
    },
    {
      type: 'cooldown',
      name: 'Cooldown',
      durationMinutes: 5,
      exercises: 2,
      intensity: 'low',
      restBetweenSets: [0, 0],
      notes: ['Deep breathing', 'Parasympathetic activation'],
    },
  ]
  
  return {
    id: 'long_strength',
    name: 'Extended Strength Session',
    description: 'Comprehensive strength development for advanced athletes',
    applicableTo: ['strength'],
    totalDurationMinutes: duration,
    blocks,
    principlesApplied: [
      'weighted_strength_progression',
      'long_rest_strength',
      'neural_output_strength',
      'quality_over_volume',
      'comprehensive_development',
    ],
  }
}

// =============================================================================
// SESSION ASSEMBLY FUNCTION
// =============================================================================

export interface SessionAssemblyContext {
  outcome: PrimaryTrainingOutcome
  primaryGoal?: PrimaryGoal
  experienceLevel: ExperienceLevel
  sessionLengthMinutes: number
  hasHandstandGoal?: boolean
  hasRunningCapability?: boolean
  skillGoals?: string[]
}

/**
 * Assemble appropriate session structure based on context
 */
export function assembleSession(context: SessionAssemblyContext): SessionTemplate {
  const { outcome, sessionLengthMinutes, hasHandstandGoal, primaryGoal } = context
  
  // Special case: Extended sessions (90-120 min) for strength
  if (sessionLengthMinutes >= 90 && (outcome === 'strength' || primaryGoal === 'weighted_strength')) {
    return buildLongStrengthSession(sessionLengthMinutes)
  }
  
  // Handstand-focused sessions
  if (hasHandstandGoal && outcome === 'skills') {
    return buildHandstandFocusedSession(sessionLengthMinutes)
  }
  
  // Select by primary outcome
  switch (outcome) {
    case 'skills':
      return buildSkillFirstSession(sessionLengthMinutes)
    
    case 'strength':
      return buildWeightedStrengthSession(sessionLengthMinutes)
    
    case 'military':
      return buildMilitaryConditioningSession(sessionLengthMinutes)
    
    case 'endurance':
    case 'max_reps':
      return buildEnduranceSession(sessionLengthMinutes)
    
    case 'general_fitness':
    default:
      // Balanced session - mix of strength and conditioning
      return buildEnduranceSession(sessionLengthMinutes)
  }
}

/**
 * Get session duration in minutes from session length type
 */
export function getSessionDurationMinutes(sessionLength: SessionLength): number {
  if (typeof sessionLength === 'number') return sessionLength
  
  const durationMap: Record<string, number> = {
    '30': 30,
    '30-min': 30,
    '45': 45,
    '45-min': 45,
    '60': 60,
    '60-min': 60,
    '75': 75,
    '75-min': 75,
    '90': 90,
    '90-min': 90,
    '120': 120,
    '120-min': 120,
  }
  
  return durationMap[sessionLength] || parseInt(sessionLength.split('-')[0], 10) || 45
}

/**
 * Validate session assembly
 */
export function validateSessionAssembly(template: SessionTemplate): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check total duration
  const totalBlockDuration = template.blocks.reduce((sum, block) => sum + block.durationMinutes, 0)
  if (totalBlockDuration > template.totalDurationMinutes + 5) {
    issues.push(`Block durations (${totalBlockDuration}min) exceed session length (${template.totalDurationMinutes}min)`)
  }
  
  // Check for warmup
  if (!template.blocks.some(b => b.type === 'warmup')) {
    issues.push('Session missing warmup block')
  }
  
  // Check for cooldown
  if (!template.blocks.some(b => b.type === 'cooldown')) {
    issues.push('Session missing cooldown block')
  }
  
  // Check ordering - warmup should be first
  if (template.blocks[0]?.type !== 'warmup') {
    issues.push('Warmup should be first block')
  }
  
  // Check for high intensity blocks late in session without conditioning
  const lastHighIntensity = template.blocks.map((b, i) => ({ block: b, index: i }))
    .filter(item => item.block.intensity === 'high')
    .pop()
  
  if (lastHighIntensity && lastHighIntensity.index >= template.blocks.length - 1) {
    issues.push('High intensity block at end of session - consider cooldown placement')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  }
}

// =============================================================================
// INTELLIGENT MOBILITY_ACTIVATION BLOCK GENERATION
// =============================================================================

/**
 * Generate intelligent mobility/activation block using joint stress mapping
 * This replaces generic "wrist prep + shoulder work" with targeted preparation
 */
export interface MobilityActivationContext {
  mainExercises: Array<{
    name: string
    category: string
    movementPattern: string
    primaryMuscles: string[]
  }>
  sessionLength: SessionLength
  athleteWeakPoints?: Record<string, number>
}

export function generateIntelligentMobilityBlock(context: MobilityActivationContext): SessionBlock {
  try {
    // Convert to prehab context
    const prehabContext: IntelligentPrehabContext = {
      mainExercises: context.mainExercises.map((ex, idx) => ({
        id: `ex_${idx}`,
        name: ex.name,
        category: ex.category as any,
        movementPattern: ex.movementPattern as any,
        primaryMuscles: ex.primaryMuscles,
      })),
      sessionLength: context.sessionLength,
      athleteWeakPoints: context.athleteWeakPoints,
      sessionFocus: 'skill',
    }
    
    // Generate intelligent prehab
    const prehabResult = generateIntelligentPrehab(prehabContext)
    
    // Return as mobility_activation block
    return {
      type: 'mobility_activation',
      name: 'Intelligent Joint Preparation',
      durationMinutes: prehabResult.estimatedDuration,
      exercises: prehabResult.prehabExercises.length,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: [
        `Focused on: ${prehabResult.primaryJointsFocused.join(', ')}`,
        ...prehabResult.weakPointAdaptations,
        prehabResult.prehabExercises.map(ex => `${ex.name} - ${ex.prescription}`).join('; '),
      ],
    }
  } catch (error) {
    // Fallback to generic mobility block
    console.warn('[session-assembly] Falling back to generic mobility block:', error)
    return {
      type: 'mobility_activation',
      name: 'General Joint Preparation',
      durationMinutes: 5,
      exercises: 3,
      intensity: 'low',
      restBetweenSets: [30, 45],
      notes: ['Wrist prep', 'Shoulder activation', 'Scapular work'],
    }
  }
}

/**
 * Re-export prehab functions for convenience
 */
export { generateIntelligentPrehab } from './prehab'
export type { IntelligentPrehabContext, IntelligentPrehabResult } from './prehab'

// =============================================================================
// SESSION LOAD INTELLIGENCE INTEGRATION
// =============================================================================

/**
 * Re-export session load intelligence for unified access
 */
export {
  buildExerciseLoadMetadata,
  calculateSessionLoad,
  determineSessionStyle,
  getSessionLoadBudget,
  validateSessionAntiBloat,
  generateSessionLoadRationale,
  applyGroupedDeliveryStyle,
  type ExerciseRole,
  type FatigueWeight,
  type DeliveryStyle,
  type ExerciseLoadMetadata,
  type SessionLoadBudget,
  type SessionLoadSummary,
  type TrainingSessionStyle,
  type AntiBloatResult,
} from './session-load-intelligence'

/**
 * Session size guidelines by block type
 * Used for coaching explanations and validation
 */
export const SESSION_SIZE_GUIDELINES = {
  skill_strength_dominant: {
    typicalExerciseCount: '3-6 meaningful exercises',
    maxPrimaryMovements: 3,
    description: 'Prioritizes skill and strength quality over volume',
  },
  hypertrophy_mixed: {
    typicalExerciseCount: '4-7 total items (weighted load controlled)',
    maxPrimaryMovements: 4,
    description: 'Higher volume with controlled fatigue accumulation',
  },
  circuit_density: {
    typicalExerciseCount: 'More listed items allowed (grouped as clusters)',
    maxPrimaryMovements: 2,
    description: 'Density format groups exercises, reducing per-item load impact',
  },
  prep_recovery: {
    typicalExerciseCount: 'Multiple low-fatigue items allowed',
    maxPrimaryMovements: 1,
    description: 'Focus on movement quality and recovery, not load',
  },
} as const
