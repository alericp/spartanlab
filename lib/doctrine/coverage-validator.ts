/**
 * SpartanLab Doctrine Coverage Validator
 * 
 * Internal validation to confirm:
 * - Requested goal families have at least one direct DB-backed pathway
 * - Missing-support fallback is not fabricating fake exercises
 * - Progression ladders are not empty
 * - Support mappings do not point to zero candidates
 * - Dragon flag and advanced ladders have real resolver paths
 * - Short-format method profiles still resolve coherent sessions
 * 
 * This is for internal diagnostics, not UI exposure.
 */

import { getAllExercises, type Exercise } from '../adaptive-exercise-pool'
import { PROGRESSION_LADDERS, type ProgressionLadder } from '../progression-ladders'
import { LIMITER_MOVEMENT_REQUIREMENTS, selectSupportForLimiter } from '../movement-intelligence'
import { PREREQUISITE_RULES } from '../prerequisite-gate-engine'
import { METHOD_PROFILES, type MethodProfileType, validateMethodProfileCoverage } from './method-profile-registry'
import type { PrimaryGoal } from '../program-service'

// =============================================================================
// TYPES
// =============================================================================

export interface CoverageValidationResult {
  valid: boolean
  timestamp: string
  goalCoverage: Record<string, GoalCoverageStatus>
  ladderCoverage: LadderCoverageStatus[]
  limiterCoverage: LimiterCoverageStatus[]
  dragonFlagCoverage: DragonFlagCoverageStatus
  methodProfileCoverage: MethodProfileCoverageStatus
  issues: string[]
  warnings: string[]
}

export interface GoalCoverageStatus {
  goalId: string
  hasDirectPathway: boolean
  exerciseCount: number
  progressionLadderExists: boolean
  prerequisiteRuleExists: boolean
}

export interface LadderCoverageStatus {
  ladderId: string
  stepCount: number
  allExercisesExist: boolean
  missingExercises: string[]
}

export interface LimiterCoverageStatus {
  limiterId: string
  candidateCount: number
  hasCandidates: boolean
}

export interface DragonFlagCoverageStatus {
  exercisesInDatabase: string[]
  progressionLadderExists: boolean
  prerequisiteRuleExists: boolean
  limiterMappingExists: boolean
  fullyCovered: boolean
}

export interface MethodProfileCoverageStatus {
  profilesValid: boolean
  allGoalsCovered: boolean
  uncoveredGoals: string[]
}

// =============================================================================
// SKILL GOAL TO EXERCISE MAPPING
// =============================================================================

const SKILL_GOAL_EXERCISE_PATTERNS: Record<string, string[]> = {
  // Skill-based goals (maps from PrimaryGoal)
  // Lever/Static Skills
  front_lever: ['tuck_fl', 'adv_tuck_fl', 'straddle_fl', 'full_fl', 'fl_raises', 'front_lever_pull'],
  back_lever: ['german_hang', 'skin_the_cat', 'tuck_back_lever', 'back_lever'],
  planche: ['planche_lean', 'tuck_planche', 'adv_tuck_planche', 'straddle_planche', 'planche_pushup'],
  planche_push_up: ['tuck_planche', 'planche_pushup', 'tuck_planche_pushup', 'pseudo_planche_pushup'],
  // Transition Skills  
  muscle_up: ['muscle_up', 'banded_muscle_up', 'explosive_pull_up', 'chest_to_bar_pull_up'],
  iron_cross: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold', 'cross_negatives'],
  // Pressing Skills
  handstand_pushup: ['pike_push_up', 'elevated_pike_push_up', 'wall_hspu', 'hspu', 'deficit_hspu'],
  handstand: ['wall_handstand', 'chest_to_wall_handstand', 'freestanding_handstand', 'handstand_hold'],
  // Unilateral Strength Skills
  one_arm_pull_up: ['archer_pull_up', 'one_arm_hang', 'assisted_oap', 'weighted_pull_up'],
  one_arm_push_up: ['archer_push_up', 'one_arm_push_up', 'pseudo_planche_pushup', 'weighted_push_up'],
  // Core/Compression Skills
  dragon_flag: ['dragon_flag_tuck', 'dragon_flag_neg', 'dragon_flag_assisted', 'dragon_flag'],
  l_sit: ['l_sit_floor', 'l_sit_parallette', 'tuck_l_sit', 'l_sit_hold'],
  v_sit: ['l_sit_floor', 'v_sit', 'pike_compression', 'v_up'],
  i_sit: ['v_sit', 'manna_progressions', 'pike_compression', 'compression_pulses'],
  // Strength training goals
  weighted_pull: ['weighted_pull_up', 'weighted_chin_up', 'pull_up'],
  weighted_dip: ['weighted_dip', 'dip', 'ring_dip'],
  weighted_strength: ['weighted_pull_up', 'weighted_dip', 'weighted_push_up', 'weighted_chin_up'],
  general_strength: ['pull_up', 'dip', 'push_up', 'bodyweight_row', 'weighted_pull_up'],
  muscle_building: ['pull_up', 'dip', 'push_up', 'bodyweight_row', 'bicep_curl', 'tricep_extension'],
  work_capacity: ['pull_up', 'push_up', 'burpee', 'mountain_climber', 'dip'],
  // Flexibility goals
  flexibility: ['pancake_stretch', 'pike_stretch', 'middle_split_stretch'],
  pancake: ['pancake_stretch', 'pancake_active', 'compression_drill'],
  toe_touch: ['pike_stretch', 'standing_pike', 'jefferson_curl'],
  front_splits: ['front_split_stretch', 'hip_flexor_stretch', 'lunge_stretch'],
  side_splits: ['middle_split_stretch', 'horse_stance', 'adductor_stretch'],
  // Legacy/fallback patterns
  general: ['pull_up', 'dip', 'push_up', 'bodyweight_row'],
  skill: ['pull_up', 'dip', 'push_up', 'l_sit_floor', 'handstand_hold'],
  strength: ['pull_up', 'dip', 'push_up', 'bodyweight_row', 'weighted_pull_up'],
  endurance: ['pull_up', 'push_up', 'burpee', 'mountain_climber'],
  abs: ['hollow_body_hold', 'dragon_flag_tuck', 'leg_raises', 'plank'],
}

// =============================================================================
// CORE VALIDATION
// =============================================================================

/**
 * Run full doctrine coverage validation.
 * Returns detailed results for diagnostics.
 */
export function validateDoctrineCoverage(): CoverageValidationResult {
  console.log('[coverage] Starting doctrine coverage validation')
  
  const allExercises = getAllExercises()
  const exerciseIds = new Set(allExercises.map(e => e.id))
  const issues: string[] = []
  const warnings: string[] = []
  
  // 1. Goal coverage
  const goalCoverage: Record<string, GoalCoverageStatus> = {}
  for (const [goalId, exercisePatterns] of Object.entries(SKILL_GOAL_EXERCISE_PATTERNS)) {
    const existingExercises = exercisePatterns.filter(id => exerciseIds.has(id))
    const hasLadder = PROGRESSION_LADDERS.some(l => l.skill === goalId || l.id === goalId)
    const hasPrereq = PREREQUISITE_RULES.some(r => r.relatedSkill === goalId || r.exerciseId.includes(goalId))
    
    goalCoverage[goalId] = {
      goalId,
      hasDirectPathway: existingExercises.length > 0,
      exerciseCount: existingExercises.length,
      progressionLadderExists: hasLadder,
      prerequisiteRuleExists: hasPrereq,
    }
    
    if (existingExercises.length === 0) {
      issues.push(`Goal ${goalId} has no DB-backed exercises`)
    }
  }
  
  // 2. Ladder coverage
  const ladderCoverage: LadderCoverageStatus[] = []
  for (const ladder of PROGRESSION_LADDERS) {
    const missingExercises = ladder.steps
      .map(step => step.exerciseId)
      .filter(id => !exerciseIds.has(id))
    
    ladderCoverage.push({
      ladderId: ladder.id,
      stepCount: ladder.steps.length,
      allExercisesExist: missingExercises.length === 0,
      missingExercises,
    })
    
    if (missingExercises.length > 0) {
      warnings.push(`Ladder ${ladder.id} references missing exercises: ${missingExercises.join(', ')}`)
    }
  }
  
  // 3. Limiter coverage
  const limiterCoverage: LimiterCoverageStatus[] = []
  for (const limiterId of Object.keys(LIMITER_MOVEMENT_REQUIREMENTS)) {
    const candidates = selectSupportForLimiter(limiterId, { limit: 10 })
    limiterCoverage.push({
      limiterId,
      candidateCount: candidates.length,
      hasCandidates: candidates.length > 0,
    })
    
    if (candidates.length === 0) {
      warnings.push(`Limiter ${limiterId} resolves to zero candidates`)
    }
  }
  
  // 4. Dragon flag specific coverage
  const dragonFlagExercises = ['dragon_flag_tuck', 'dragon_flag_neg', 'dragon_flag_assisted', 'dragon_flag']
  const existingDragonFlag = dragonFlagExercises.filter(id => exerciseIds.has(id))
  const dragonFlagLadder = PROGRESSION_LADDERS.some(l => 
    l.steps.some(s => s.exerciseId.includes('dragon_flag'))
  )
  const dragonFlagPrereq = PREREQUISITE_RULES.some(r => 
    r.exerciseId === 'dragon_flag' || r.exerciseId === 'dragon_flag_neg'
  )
  const dragonFlagLimiter = 'dragon_flag_anti_extension' in LIMITER_MOVEMENT_REQUIREMENTS
  
  const dragonFlagCoverage: DragonFlagCoverageStatus = {
    exercisesInDatabase: existingDragonFlag,
    progressionLadderExists: dragonFlagLadder,
    prerequisiteRuleExists: dragonFlagPrereq,
    limiterMappingExists: dragonFlagLimiter,
    fullyCovered: existingDragonFlag.length >= 3 && dragonFlagLadder && dragonFlagPrereq && dragonFlagLimiter,
  }
  
  if (!dragonFlagCoverage.fullyCovered) {
    warnings.push('Dragon flag coverage incomplete: ' + JSON.stringify({
      exercises: existingDragonFlag.length,
      ladder: dragonFlagLadder,
      prereq: dragonFlagPrereq,
      limiter: dragonFlagLimiter,
    }))
  }
  
  // 5. Method profile coverage
  const profileValidation = validateMethodProfileCoverage()
  const methodProfileCoverage: MethodProfileCoverageStatus = {
    profilesValid: profileValidation.valid,
    allGoalsCovered: profileValidation.issues.length === 0,
    uncoveredGoals: profileValidation.issues.filter(i => i.includes('has no method profile')).map(i => i.split(' ')[1]),
  }
  
  if (!profileValidation.valid) {
    issues.push(...profileValidation.issues)
  }
  
  // Summary
  const valid = issues.length === 0
  
  console.log('[coverage] Validation complete:', {
    valid,
    issueCount: issues.length,
    warningCount: warnings.length,
    goalsChecked: Object.keys(goalCoverage).length,
    laddersChecked: ladderCoverage.length,
    limitersChecked: limiterCoverage.length,
    dragonFlagFullyCovered: dragonFlagCoverage.fullyCovered,
  })
  
  return {
    valid,
    timestamp: new Date().toISOString(),
    goalCoverage,
    ladderCoverage,
    limiterCoverage,
    dragonFlagCoverage,
    methodProfileCoverage,
    issues,
    warnings,
  }
}

/**
 * Quick check if a specific skill goal has resolver coverage.
 */
export function hasGoalCoverage(goalId: string): boolean {
  const patterns = SKILL_GOAL_EXERCISE_PATTERNS[goalId]
  if (!patterns) return false
  
  const allExercises = getAllExercises()
  const exerciseIds = new Set(allExercises.map(e => e.id))
  
  return patterns.some(id => exerciseIds.has(id))
}

/**
 * Quick check if dragon flag is fully integrated.
 */
export function isDragonFlagIntegrated(): boolean {
  const allExercises = getAllExercises()
  const exerciseIds = new Set(allExercises.map(e => e.id))
  
  // Check all dragon flag exercises exist
  const requiredExercises = ['dragon_flag_tuck', 'dragon_flag_neg', 'dragon_flag']
  const allExist = requiredExercises.every(id => exerciseIds.has(id))
  
  // Check progression ladder includes dragon flag
  const hasLadder = PROGRESSION_LADDERS.some(l => 
    l.steps.some(s => s.exerciseId.includes('dragon_flag'))
  )
  
  // Check prerequisite rule exists
  const hasPrereq = PREREQUISITE_RULES.some(r => r.exerciseId === 'dragon_flag')
  
  // Check limiter mapping exists
  const hasLimiter = 'dragon_flag_anti_extension' in LIMITER_MOVEMENT_REQUIREMENTS
  
  const integrated = allExist && hasLadder && hasPrereq && hasLimiter
  
  console.log('[coverage] Dragon flag integration check:', {
    allExist,
    hasLadder,
    hasPrereq,
    hasLimiter,
    integrated,
  })
  
  return integrated
}

/**
 * Validate that a method profile can produce a coherent session.
 */
export function canMethodProfileResolveSession(profileType: MethodProfileType): boolean {
  const profile = METHOD_PROFILES[profileType]
  if (!profile) return false
  
  // Check at least one compatible goal has exercises
  for (const goal of profile.conditions.compatibleGoals) {
    if (hasGoalCoverage(goal)) {
      return true
    }
  }
  
  return false
}

/**
 * Get all missing exercise IDs referenced by ladders but not in database.
 */
export function getMissingLadderExercises(): string[] {
  const allExercises = getAllExercises()
  const exerciseIds = new Set(allExercises.map(e => e.id))
  const missing: string[] = []
  
  for (const ladder of PROGRESSION_LADDERS) {
    for (const step of ladder.steps) {
      if (!exerciseIds.has(step.exerciseId) && !missing.includes(step.exerciseId)) {
        missing.push(step.exerciseId)
      }
    }
  }
  
  return missing
}
