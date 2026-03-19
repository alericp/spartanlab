/**
 * Session Load Intelligence Engine
 * 
 * Provides weighted session load evaluation and anti-bloat rules for workout programming.
 * 
 * CORE PHILOSOPHY:
 * A normal workout should contain about 3-6 meaningful exercises, but the engine may allow
 * more listed items when the session structure justifies it (supersets, circuits, density
 * blocks, prep/recovery clusters, low-fatigue accessories, etc.).
 * 
 * This module evaluates session load by weighted contribution, not raw exercise count.
 * It preserves existing recovery, skill, strength, tendon, and fatigue philosophy.
 */

import type { ExerciseCategory } from './adaptive-exercise-pool'
import type { SessionBlockType } from './session-assembly-engine'
import type { SessionStructureType, FatigueProfile } from './session-structure-engine'

// =============================================================================
// EXERCISE ROLE AND WEIGHTING TYPES
// =============================================================================

/**
 * Exercise role in the session context
 * Used to determine session load contribution
 */
export type ExerciseRole =
  | 'skill_primary'      // Main skill work (planche, front lever holds)
  | 'strength_primary'   // Heavy compound strength (weighted pull-ups, weighted dips)
  | 'secondary'          // Supporting strength work
  | 'accessory'          // Isolation/support muscles
  | 'core'               // Core and compression work
  | 'rehab_prep'         // Prehab, mobility, activation
  | 'conditioning'       // Circuits, density work, finishers

/**
 * Fatigue weight classification
 * Determines how much an exercise contributes to total session fatigue
 */
export type FatigueWeight = 'high' | 'medium' | 'low' | 'minimal'

/**
 * How exercise is delivered in the session
 * Affects session load calculation
 */
export type DeliveryStyle =
  | 'standalone'         // Standard straight sets with full rest
  | 'superset'           // Paired exercises, alternating
  | 'circuit'            // Multiple exercises in sequence
  | 'density'            // Time-based work blocks
  | 'emom'               // Every minute on the minute
  | 'finisher'           // End-of-session conditioning
  | 'cluster'            // Grouped prep or accessory work

// =============================================================================
// SESSION LOAD METADATA
// =============================================================================

export interface ExerciseLoadMetadata {
  role: ExerciseRole
  fatigueWeight: FatigueWeight
  sessionCountWeight: number  // 0.25 - 1.0
  deliveryStyle: DeliveryStyle
  jointStressCategory?: 'straight_arm' | 'bent_arm' | 'lower_body' | 'core' | 'minimal'
  isHighNeuralDemand: boolean
}

/**
 * Session load budget configuration by training style
 */
export interface SessionLoadBudget {
  maxWeightedLoad: number           // Maximum weighted session load (typically 4-6)
  maxHighFatigueExercises: number   // Max exercises with high fatigue weight
  maxStraightArmHolds: number       // Tendon protection: max straight-arm elements
  maxPrimaryExercises: number       // Max skill_primary + strength_primary
  allowExtraLowFatigue: boolean     // Whether low-fatigue extras are allowed
  maxTotalExercises: number         // Absolute ceiling (including warmup/cooldown)
}

// =============================================================================
// WEIGHT MAPPINGS
// =============================================================================

/**
 * Session count weight by exercise role
 * This determines how much each exercise contributes to the "meaningful exercise" count
 */
const SESSION_COUNT_WEIGHTS: Record<ExerciseRole, number> = {
  skill_primary: 1.0,      // Counts as 1 full exercise
  strength_primary: 1.0,   // Counts as 1 full exercise
  secondary: 0.75,         // Counts as 0.75 exercise
  accessory: 0.5,          // Counts as 0.5 exercise
  core: 0.5,               // Counts as 0.5 exercise
  rehab_prep: 0.25,        // Counts as 0.25 exercise
  conditioning: 0.5,       // Counts as 0.5 exercise (but grouped circuits count less)
}

/**
 * Delivery style multipliers for session load
 * Grouped/density formats reduce individual exercise load contribution
 */
const DELIVERY_STYLE_MULTIPLIERS: Record<DeliveryStyle, number> = {
  standalone: 1.0,
  superset: 0.8,           // Two in superset = 1.6 instead of 2.0
  circuit: 0.6,            // Circuit of 3 = 1.8 instead of 3.0
  density: 0.5,            // Density block counts as less primary load
  emom: 0.7,               // EMOM structure manages fatigue automatically
  finisher: 0.4,           // Finishers are targeted, not primary
  cluster: 0.3,            // Prep clusters minimal load contribution
}

/**
 * Fatigue weight to numeric value
 */
const FATIGUE_WEIGHT_VALUES: Record<FatigueWeight, number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
  minimal: 0.1,
}

// =============================================================================
// SESSION LOAD BUDGETS BY TRAINING STYLE
// =============================================================================

export type TrainingSessionStyle =
  | 'skill_strength_dominant'  // Primary skill/strength focus
  | 'hypertrophy_mixed'        // Hypertrophy with some skill work
  | 'circuit_density'          // Conditioning-focused
  | 'prep_recovery'            // Light/recovery day
  | 'long_comprehensive'       // Extended session (90+ min)

const SESSION_LOAD_BUDGETS: Record<TrainingSessionStyle, SessionLoadBudget> = {
  skill_strength_dominant: {
    maxWeightedLoad: 5.0,
    maxHighFatigueExercises: 3,
    maxStraightArmHolds: 2,
    maxPrimaryExercises: 3,
    allowExtraLowFatigue: true,
    maxTotalExercises: 8,
  },
  hypertrophy_mixed: {
    maxWeightedLoad: 6.0,
    maxHighFatigueExercises: 4,
    maxStraightArmHolds: 2,
    maxPrimaryExercises: 4,
    allowExtraLowFatigue: true,
    maxTotalExercises: 10,
  },
  circuit_density: {
    maxWeightedLoad: 7.0,
    maxHighFatigueExercises: 3,
    maxStraightArmHolds: 1,
    maxPrimaryExercises: 2,
    allowExtraLowFatigue: true,
    maxTotalExercises: 12,  // Circuits can have more items
  },
  prep_recovery: {
    maxWeightedLoad: 3.0,
    maxHighFatigueExercises: 1,
    maxStraightArmHolds: 1,
    maxPrimaryExercises: 1,
    allowExtraLowFatigue: true,
    maxTotalExercises: 8,
  },
  long_comprehensive: {
    maxWeightedLoad: 8.0,
    maxHighFatigueExercises: 5,
    maxStraightArmHolds: 3,
    maxPrimaryExercises: 4,
    allowExtraLowFatigue: true,
    maxTotalExercises: 14,
  },
}

// =============================================================================
// EXERCISE ROLE DETECTION
// =============================================================================

/**
 * Determine exercise role based on category, neural demand, and fatigue cost
 */
export function determineExerciseRole(
  category: ExerciseCategory,
  neuralDemand: number,
  fatigueCost: number,
  blockType?: SessionBlockType
): ExerciseRole {
  // Skill exercises with high neural demand are primary
  if (category === 'skill' && neuralDemand >= 4) {
    return 'skill_primary'
  }
  
  // High-fatigue strength work is primary
  if (category === 'strength' && fatigueCost >= 4) {
    return 'strength_primary'
  }
  
  // Block type hints
  if (blockType === 'warmup' || blockType === 'mobility_activation') {
    return 'rehab_prep'
  }
  
  if (blockType === 'conditioning') {
    return 'conditioning'
  }
  
  if (blockType === 'flexibility' || blockType === 'cooldown') {
    return 'rehab_prep'
  }
  
  // Secondary strength
  if (category === 'strength') {
    return 'secondary'
  }
  
  // Core work
  if (category === 'core') {
    return 'core'
  }
  
  // Everything else is accessory
  return 'accessory'
}

/**
 * Determine fatigue weight based on exercise properties
 */
export function determineFatigueWeight(
  fatigueCost: number,
  neuralDemand: number,
  isIsometric?: boolean
): FatigueWeight {
  // High neural demand isometrics (planche, front lever) are high fatigue
  if (isIsometric && neuralDemand >= 4) {
    return 'high'
  }
  
  // High fatigue cost exercises
  if (fatigueCost >= 4) {
    return 'high'
  }
  
  if (fatigueCost >= 3) {
    return 'medium'
  }
  
  if (fatigueCost >= 2) {
    return 'low'
  }
  
  return 'minimal'
}

/**
 * Build exercise load metadata
 */
export function buildExerciseLoadMetadata(
  exercise: {
    category: ExerciseCategory
    neuralDemand: number
    fatigueCost: number
    movementPattern?: string
    isIsometric?: boolean
  },
  deliveryStyle: DeliveryStyle = 'standalone',
  blockType?: SessionBlockType
): ExerciseLoadMetadata {
  const role = determineExerciseRole(
    exercise.category,
    exercise.neuralDemand,
    exercise.fatigueCost,
    blockType
  )
  
  const fatigueWeight = determineFatigueWeight(
    exercise.fatigueCost,
    exercise.neuralDemand,
    exercise.isIsometric
  )
  
  // Determine joint stress category
  let jointStressCategory: ExerciseLoadMetadata['jointStressCategory']
  if (exercise.movementPattern?.includes('horizontal')) {
    jointStressCategory = 'straight_arm'
  } else if (exercise.movementPattern?.includes('vertical')) {
    jointStressCategory = 'bent_arm'
  } else if (exercise.movementPattern?.includes('core') || exercise.movementPattern?.includes('compression')) {
    jointStressCategory = 'core'
  } else {
    jointStressCategory = 'minimal'
  }
  
  return {
    role,
    fatigueWeight,
    sessionCountWeight: SESSION_COUNT_WEIGHTS[role] * DELIVERY_STYLE_MULTIPLIERS[deliveryStyle],
    deliveryStyle,
    jointStressCategory,
    isHighNeuralDemand: exercise.neuralDemand >= 4,
  }
}

// =============================================================================
// SESSION LOAD CALCULATION
// =============================================================================

export interface SessionLoadSummary {
  weightedExerciseCount: number
  totalFatigueLoad: number
  highFatigueCount: number
  straightArmCount: number
  primaryCount: number
  totalExerciseCount: number
  isWithinBudget: boolean
  budgetViolations: string[]
  loadBreakdown: {
    skillPrimary: number
    strengthPrimary: number
    secondary: number
    accessory: number
    core: number
    rehabPrep: number
    conditioning: number
  }
}

/**
 * Calculate session load from exercise metadata
 */
export function calculateSessionLoad(
  exercises: ExerciseLoadMetadata[],
  budget: SessionLoadBudget
): SessionLoadSummary {
  const violations: string[] = []
  
  // Calculate weighted counts
  let weightedExerciseCount = 0
  let totalFatigueLoad = 0
  let highFatigueCount = 0
  let straightArmCount = 0
  let primaryCount = 0
  
  const loadBreakdown = {
    skillPrimary: 0,
    strengthPrimary: 0,
    secondary: 0,
    accessory: 0,
    core: 0,
    rehabPrep: 0,
    conditioning: 0,
  }
  
  for (const ex of exercises) {
    weightedExerciseCount += ex.sessionCountWeight
    totalFatigueLoad += FATIGUE_WEIGHT_VALUES[ex.fatigueWeight] * ex.sessionCountWeight
    
    if (ex.fatigueWeight === 'high') {
      highFatigueCount++
    }
    
    if (ex.jointStressCategory === 'straight_arm') {
      straightArmCount++
    }
    
    if (ex.role === 'skill_primary' || ex.role === 'strength_primary') {
      primaryCount++
    }
    
    // Update breakdown
    switch (ex.role) {
      case 'skill_primary':
        loadBreakdown.skillPrimary++
        break
      case 'strength_primary':
        loadBreakdown.strengthPrimary++
        break
      case 'secondary':
        loadBreakdown.secondary++
        break
      case 'accessory':
        loadBreakdown.accessory++
        break
      case 'core':
        loadBreakdown.core++
        break
      case 'rehab_prep':
        loadBreakdown.rehabPrep++
        break
      case 'conditioning':
        loadBreakdown.conditioning++
        break
    }
  }
  
  // Check budget violations
  if (weightedExerciseCount > budget.maxWeightedLoad) {
    violations.push(`Weighted load (${weightedExerciseCount.toFixed(1)}) exceeds budget (${budget.maxWeightedLoad})`)
  }
  
  if (highFatigueCount > budget.maxHighFatigueExercises) {
    violations.push(`Too many high-fatigue exercises (${highFatigueCount}/${budget.maxHighFatigueExercises})`)
  }
  
  if (straightArmCount > budget.maxStraightArmHolds) {
    violations.push(`Too many straight-arm elements (${straightArmCount}/${budget.maxStraightArmHolds}) - tendon stress`)
  }
  
  if (primaryCount > budget.maxPrimaryExercises) {
    violations.push(`Too many primary exercises (${primaryCount}/${budget.maxPrimaryExercises})`)
  }
  
  if (exercises.length > budget.maxTotalExercises) {
    violations.push(`Total exercises (${exercises.length}) exceeds maximum (${budget.maxTotalExercises})`)
  }
  
  return {
    weightedExerciseCount,
    totalFatigueLoad,
    highFatigueCount,
    straightArmCount,
    primaryCount,
    totalExerciseCount: exercises.length,
    isWithinBudget: violations.length === 0,
    budgetViolations: violations,
    loadBreakdown,
  }
}

// =============================================================================
// SESSION STYLE DETECTION
// =============================================================================

/**
 * Determine training session style from context
 */
export function determineSessionStyle(
  sessionMinutes: number,
  primaryFocus: 'skill' | 'strength' | 'conditioning' | 'recovery' | 'mixed',
  structureType?: SessionStructureType,
  fatigueProfile?: FatigueProfile
): TrainingSessionStyle {
  // Long sessions (90+ min)
  if (sessionMinutes >= 90) {
    return 'long_comprehensive'
  }
  
  // Recovery/prep sessions
  if (primaryFocus === 'recovery' || fatigueProfile === 'very_low') {
    return 'prep_recovery'
  }
  
  // Circuit/density structures
  if (structureType === 'density_block' || structureType === 'emom' || 
      structureType === 'short_circuit' || primaryFocus === 'conditioning') {
    return 'circuit_density'
  }
  
  // Hypertrophy mixed
  if (primaryFocus === 'mixed' && sessionMinutes >= 60) {
    return 'hypertrophy_mixed'
  }
  
  // Default to skill/strength dominant
  return 'skill_strength_dominant'
}

/**
 * Get session load budget for a given style
 */
export function getSessionLoadBudget(style: TrainingSessionStyle): SessionLoadBudget {
  return SESSION_LOAD_BUDGETS[style]
}

// =============================================================================
// ANTI-BLOAT VALIDATION
// =============================================================================

export interface AntiBloatResult {
  isValid: boolean
  issues: string[]
  suggestions: string[]
  severityLevel: 'ok' | 'warning' | 'critical'
}

/**
 * Validate session against anti-bloat rules
 * Prevents sessions that are overloaded even if goals are broad
 */
export function validateSessionAntiBloat(
  exercises: ExerciseLoadMetadata[],
  sessionStyle: TrainingSessionStyle
): AntiBloatResult {
  const issues: string[] = []
  const suggestions: string[] = []
  
  const budget = getSessionLoadBudget(sessionStyle)
  const load = calculateSessionLoad(exercises, budget)
  
  // Check for excessive same-pattern redundancy
  const patternCounts = new Map<string, number>()
  for (const ex of exercises) {
    if (ex.jointStressCategory) {
      patternCounts.set(
        ex.jointStressCategory,
        (patternCounts.get(ex.jointStressCategory) || 0) + 1
      )
    }
  }
  
  for (const [pattern, count] of patternCounts) {
    if (pattern === 'straight_arm' && count > 3) {
      issues.push(`Excessive straight-arm work (${count} exercises) - high tendon stress`)
      suggestions.push('Consider removing one straight-arm element or moving to different day')
    }
    if (pattern === 'bent_arm' && count > 4) {
      issues.push(`Excessive bent-arm work (${count} exercises) - joint fatigue risk`)
    }
  }
  
  // Check for too many high-neural-demand exercises
  const highNeuralCount = exercises.filter(e => e.isHighNeuralDemand).length
  if (highNeuralCount > 3) {
    issues.push(`Too many high neural demand exercises (${highNeuralCount}) - CNS fatigue risk`)
    suggestions.push('Move some skill work to a different session for quality practice')
  }
  
  // Check for bloated primary section
  if (load.primaryCount > 4) {
    issues.push(`Session has ${load.primaryCount} primary exercises - likely too many main lifts`)
    suggestions.push('Focus on 2-3 primary movements per session for quality')
  }
  
  // Add budget violations
  issues.push(...load.budgetViolations)
  
  // Determine severity
  let severityLevel: AntiBloatResult['severityLevel'] = 'ok'
  if (issues.length > 0 && issues.length <= 2) {
    severityLevel = 'warning'
  } else if (issues.length > 2) {
    severityLevel = 'critical'
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    severityLevel,
  }
}

// =============================================================================
// GROUPED BLOCK HANDLING
// =============================================================================

/**
 * Apply grouped delivery style to exercises in a block
 * Supersets, circuits, density blocks count differently than standalone exercises
 */
export function applyGroupedDeliveryStyle(
  exercises: ExerciseLoadMetadata[],
  groupType: 'superset' | 'circuit' | 'density' | 'finisher' | 'cluster'
): ExerciseLoadMetadata[] {
  const deliveryStyle: DeliveryStyle = groupType
  
  return exercises.map(ex => ({
    ...ex,
    deliveryStyle,
    sessionCountWeight: SESSION_COUNT_WEIGHTS[ex.role] * DELIVERY_STYLE_MULTIPLIERS[deliveryStyle],
  }))
}

// =============================================================================
// SESSION LOAD RATIONALE
// =============================================================================

/**
 * Generate human-readable rationale for session load decisions
 */
export function generateSessionLoadRationale(
  load: SessionLoadSummary,
  sessionStyle: TrainingSessionStyle
): string[] {
  const rationale: string[] = []
  
  // Explain the session structure
  if (load.totalExerciseCount !== Math.round(load.weightedExerciseCount)) {
    rationale.push(
      `This session uses a ${load.totalExerciseCount}-exercise structure with an effective load of ${load.weightedExerciseCount.toFixed(1)} meaningful exercises.`
    )
  } else {
    rationale.push(
      `This session contains ${load.totalExerciseCount} exercises, targeting quality and recovery.`
    )
  }
  
  // Explain if supersets/circuits are used
  if (load.loadBreakdown.conditioning > 0 && load.totalExerciseCount > 6) {
    rationale.push(
      'Additional items are included as conditioning/circuit work, not as extra primary load.'
    )
  }
  
  // Explain prep work
  if (load.loadBreakdown.rehabPrep > 2) {
    rationale.push(
      'Prep and recovery work are included but do not count toward primary session load.'
    )
  }
  
  // Explain tendon-protective choices
  if (load.straightArmCount > 0 && load.straightArmCount <= 2) {
    rationale.push(
      `Straight-arm elements (${load.straightArmCount}) are limited to protect tendon adaptation.`
    )
  }
  
  // Explain session style choice
  switch (sessionStyle) {
    case 'skill_strength_dominant':
      rationale.push('Session prioritizes skill and strength quality over volume.')
      break
    case 'circuit_density':
      rationale.push('Density format allows more exercise variety while managing total fatigue.')
      break
    case 'prep_recovery':
      rationale.push('Light session load supports recovery while maintaining movement practice.')
      break
    case 'long_comprehensive':
      rationale.push('Extended session allows comprehensive development with proper rest periods.')
      break
  }
  
  return rationale
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  SESSION_COUNT_WEIGHTS,
  DELIVERY_STYLE_MULTIPLIERS,
  FATIGUE_WEIGHT_VALUES,
  SESSION_LOAD_BUDGETS,
}
