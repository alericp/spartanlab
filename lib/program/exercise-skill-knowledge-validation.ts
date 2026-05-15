/**
 * EXERCISE & SKILL KNOWLEDGE VALIDATION — MASTER-8B.2
 *
 * =============================================================================
 * VALIDATION HELPERS FOR EXERCISE AND SKILL KNOWLEDGE SEED
 * =============================================================================
 *
 * This module provides deterministic validation helpers for the knowledge seed.
 * It verifies internal coherence and identifies missing critical coverage.
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, side-effect free
 *   - No React imports, no UI imports, no generator imports
 *   - Does not throw by default
 *   - Does not run at module load
 *   - Returns typed results for future use
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.2
 */

import type {
  ExerciseSkillKnowledgeEntry,
  SkillKnowledgeEntry,
  ExerciseSkillKnowledgeValidationResult,
  KnowledgeValidationIssue,
  KnowledgeCoverageSummary,
  ExerciseTaxonomyWarning,
} from './exercise-skill-knowledge-contract'

import {
  EXERCISE_SKILL_KNOWLEDGE_SEED,
  SKILL_KNOWLEDGE_SEED,
} from './exercise-skill-knowledge-seed'

// =============================================================================
// CRITICAL CONCEPTS TO VERIFY
// =============================================================================

/**
 * Critical exercise concepts that should be covered in the seed
 * MASTER-8C.1: Expanded to cover common program exercises
 */
const CRITICAL_EXERCISE_CONCEPTS = [
  'weighted_pull_up',
  'weighted_dip',
  'pull_up',
  'dip',
  'planche_lean',
  'tuck_planche',
  'tuck_fl',
  'l_sit_skill',
  'dragon_flag',
  'hollow_body',
  'wall_hspu',
  'pike_pushup',
  // MASTER-8C.1: Common program exercises
  'pppu',
  'elevated_pppu',
  'adv_tuck_planche',
  'adv_tuck_fl',
  'chest_to_bar_pull_up',
  'ring_dip',
  'straight_bar_dip',
  'explosive_pull_up',
  'high_pulls',
  'tuck_front_lever_pull',
  'support_hold',
  'pike_pushup_elevated',
  'chin_up',
  'archer_pull_up',
  'tuck_planche_pushup',
] as const

/**
 * Critical skill concepts that should be covered in the seed
 */
const CRITICAL_SKILL_CONCEPTS = [
  'planche',
  'front_lever',
  'back_lever',
  'hspu',
  'muscle_up',
  'one_arm_pull_up',
  'l_sit',
  'v_sit',
] as const

// =============================================================================
// ACCESSOR FUNCTIONS
// =============================================================================

/**
 * Returns all seeded exercise knowledge entries
 */
export function getExerciseSkillKnowledgeEntries(): readonly ExerciseSkillKnowledgeEntry[] {
  return EXERCISE_SKILL_KNOWLEDGE_SEED
}

/**
 * Returns all seeded skill knowledge entries
 */
export function getSkillKnowledgeEntries(): readonly SkillKnowledgeEntry[] {
  return SKILL_KNOWLEDGE_SEED
}

/**
 * Gets a specific exercise knowledge entry by ID
 */
export function getExerciseSkillKnowledgeEntry(exerciseId: string): ExerciseSkillKnowledgeEntry | null {
  return EXERCISE_SKILL_KNOWLEDGE_SEED.find(e => e.exerciseId === exerciseId) ?? null
}

/**
 * Gets a specific skill knowledge entry by ID
 */
export function getSkillKnowledgeById(skillId: string): SkillKnowledgeEntry | null {
  return SKILL_KNOWLEDGE_SEED.find(s => s.skillId === skillId) ?? null
}

/**
 * Finds a knowledge entry by alias (case-insensitive)
 */
export function findKnowledgeByAlias(alias: string): ExerciseSkillKnowledgeEntry | null {
  const normalizedAlias = alias.toLowerCase().trim()
  
  for (const entry of EXERCISE_SKILL_KNOWLEDGE_SEED) {
    if (entry.canonicalName.toLowerCase() === normalizedAlias) {
      return entry
    }
    for (const entryAlias of entry.aliases) {
      if (entryAlias.toLowerCase() === normalizedAlias) {
        return entry
      }
    }
  }
  
  return null
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates the exercise and skill knowledge seed for internal coherence
 * Does NOT throw - returns a typed result
 */
export function validateExerciseSkillKnowledgeSeed(): ExerciseSkillKnowledgeValidationResult {
  const issues: KnowledgeValidationIssue[] = []
  const seenExerciseIds = new Set<string>()
  const seenSkillIds = new Set<string>()
  const taxonomyWarnings: ExerciseTaxonomyWarning[] = []
  
  // Validate exercises
  for (const entry of EXERCISE_SKILL_KNOWLEDGE_SEED) {
    // Check for missing ID
    if (!entry.exerciseId) {
      issues.push({
        severity: 'error',
        code: 'MISSING_EXERCISE_ID',
        message: 'Exercise entry missing exerciseId',
        affectedId: null,
        affectedField: 'exerciseId',
      })
      continue
    }
    
    // Check for duplicate ID
    if (seenExerciseIds.has(entry.exerciseId)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_EXERCISE_ID',
        message: `Duplicate exercise ID: ${entry.exerciseId}`,
        affectedId: entry.exerciseId,
        affectedField: 'exerciseId',
      })
    }
    seenExerciseIds.add(entry.exerciseId)
    
    // Check for missing canonical name
    if (!entry.canonicalName) {
      issues.push({
        severity: 'error',
        code: 'MISSING_CANONICAL_NAME',
        message: `Exercise ${entry.exerciseId} missing canonicalName`,
        affectedId: entry.exerciseId,
        affectedField: 'canonicalName',
      })
    }
    
    // Check prescription unit truth
    if (!entry.prescriptionUnit || entry.prescriptionUnit === 'unknown') {
      issues.push({
        severity: 'warning',
        code: 'MISSING_PRESCRIPTION_UNIT',
        message: `Exercise ${entry.exerciseId} has unknown prescription unit`,
        affectedId: entry.exerciseId,
        affectedField: 'prescriptionUnit',
      })
    }
    
    // Check for hold/reps conflict
    if (entry.isIsometric && entry.prescriptionUnit === 'reps') {
      issues.push({
        severity: 'warning',
        code: 'ISOMETRIC_REPS_CONFLICT',
        message: `Exercise ${entry.exerciseId} is marked isometric but uses reps`,
        affectedId: entry.exerciseId,
        affectedField: 'prescriptionUnit',
      })
      taxonomyWarnings.push('hold_labeled_as_pushup')
    }
    
    if (!entry.isIsometric && entry.prescriptionUnit === 'seconds' && !entry.modalities.includes('static_hold')) {
      issues.push({
        severity: 'warning',
        code: 'DYNAMIC_SECONDS_CONFLICT',
        message: `Exercise ${entry.exerciseId} uses seconds but is not marked as isometric/hold`,
        affectedId: entry.exerciseId,
        affectedField: 'prescriptionUnit',
      })
      taxonomyWarnings.push('dynamic_labeled_as_hold')
    }
    
    // Check for missing movement family
    if (!entry.movementFamilies || entry.movementFamilies.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_MOVEMENT_FAMILY',
        message: `Exercise ${entry.exerciseId} has no movement families`,
        affectedId: entry.exerciseId,
        affectedField: 'movementFamilies',
      })
    }
    
    // Check for missing tissue stress profile
    if (!entry.tissueStressProfile || entry.tissueStressProfile.length === 0) {
      issues.push({
        severity: 'info',
        code: 'MISSING_TISSUE_STRESS',
        message: `Exercise ${entry.exerciseId} has no tissue stress profile`,
        affectedId: entry.exerciseId,
        affectedField: 'tissueStressProfile',
      })
    }
    
    // Check for missing method compatibility
    if (!entry.methodCompatibility || entry.methodCompatibility.length === 0) {
      issues.push({
        severity: 'info',
        code: 'MISSING_METHOD_COMPATIBILITY',
        message: `Exercise ${entry.exerciseId} has no method compatibility`,
        affectedId: entry.exerciseId,
        affectedField: 'methodCompatibility',
      })
    }
    
    // Check weighted anchor entries
    if (entry.weightedStrengthAnchor) {
      if (!entry.modalities.includes('weighted')) {
        issues.push({
          severity: 'warning',
          code: 'ANCHOR_NOT_WEIGHTED',
          message: `Exercise ${entry.exerciseId} is marked as strength anchor but not weighted`,
          affectedId: entry.exerciseId,
          affectedField: 'weightedStrengthAnchor',
        })
      }
    }
    
    // Collect taxonomy warnings from entry
    for (const warning of entry.knownTaxonomyWarnings) {
      if (!taxonomyWarnings.includes(warning)) {
        taxonomyWarnings.push(warning)
      }
    }
  }
  
  // Validate skills
  for (const skill of SKILL_KNOWLEDGE_SEED) {
    // Check for missing ID
    if (!skill.skillId) {
      issues.push({
        severity: 'error',
        code: 'MISSING_SKILL_ID',
        message: 'Skill entry missing skillId',
        affectedId: null,
        affectedField: 'skillId',
      })
      continue
    }
    
    // Check for duplicate ID
    if (seenSkillIds.has(skill.skillId)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_SKILL_ID',
        message: `Duplicate skill ID: ${skill.skillId}`,
        affectedId: skill.skillId,
        affectedField: 'skillId',
      })
    }
    seenSkillIds.add(skill.skillId)
    
    // Check for missing canonical name
    if (!skill.canonicalName) {
      issues.push({
        severity: 'error',
        code: 'MISSING_SKILL_NAME',
        message: `Skill ${skill.skillId} missing canonicalName`,
        affectedId: skill.skillId,
        affectedField: 'canonicalName',
      })
    }
    
    // Check for missing high-value exercises
    if (!skill.highValueExerciseIds || skill.highValueExerciseIds.length === 0) {
      issues.push({
        severity: 'info',
        code: 'MISSING_HIGH_VALUE_EXERCISES',
        message: `Skill ${skill.skillId} has no high-value exercises`,
        affectedId: skill.skillId,
        affectedField: 'highValueExerciseIds',
      })
    }
    
    // Check for missing balance requirements
    if (!skill.programBalanceRequirements || skill.programBalanceRequirements.length === 0) {
      issues.push({
        severity: 'info',
        code: 'MISSING_BALANCE_REQUIREMENTS',
        message: `Skill ${skill.skillId} has no balance requirements`,
        affectedId: skill.skillId,
        affectedField: 'programBalanceRequirements',
      })
    }
  }
  
  // Check critical exercise coverage
  const missingCriticalExerciseConcepts: string[] = []
  for (const concept of CRITICAL_EXERCISE_CONCEPTS) {
    if (!seenExerciseIds.has(concept)) {
      missingCriticalExerciseConcepts.push(concept)
    }
  }
  
  // Check critical skill coverage
  const missingCriticalSkillConcepts: string[] = []
  for (const concept of CRITICAL_SKILL_CONCEPTS) {
    if (!seenSkillIds.has(concept)) {
      missingCriticalSkillConcepts.push(concept)
    }
  }
  
  // Check weighted anchors exist
  const hasWeightedPullUp = seenExerciseIds.has('weighted_pull_up')
  const hasWeightedDip = seenExerciseIds.has('weighted_dip')
  
  if (!hasWeightedPullUp) {
    issues.push({
      severity: 'warning',
      code: 'MISSING_WEIGHTED_PULLUP_ANCHOR',
      message: 'Weighted Pull-Up anchor not seeded',
      affectedId: 'weighted_pull_up',
      affectedField: null,
    })
  }
  
  if (!hasWeightedDip) {
    issues.push({
      severity: 'warning',
      code: 'MISSING_WEIGHTED_DIP_ANCHOR',
      message: 'Weighted Dip anchor not seeded',
      affectedId: 'weighted_dip',
      affectedField: null,
    })
  }
  
  // Calculate counts
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  
  return {
    ok: errorCount === 0,
    issueCount: issues.length,
    warningCount,
    seededExerciseCount: seenExerciseIds.size,
    seededSkillCount: seenSkillIds.size,
    issues,
    missingCriticalExerciseConcepts,
    missingCriticalSkillConcepts,
    taxonomyWarnings,
    nextRecommendedStep: errorCount === 0 
      ? 'MASTER-8B.3 — Program Balance Read-Only Intelligence'
      : 'Fix validation errors before proceeding',
  }
}

/**
 * Returns coverage summary for the knowledge seed
 */
export function getKnowledgeCoverageSummary(): KnowledgeCoverageSummary {
  let exercisesWithFullProfiles = 0
  let exercisesWithMethodCompatibility = 0
  let exercisesWithTissueStress = 0
  let exercisesWithProgressionPaths = 0
  let weightedAnchorCount = 0
  let taxonomyWarningCount = 0
  
  for (const entry of EXERCISE_SKILL_KNOWLEDGE_SEED) {
    // Full profile = has name, unit, movement family, stress profile, method compat
    const hasFull = 
      entry.canonicalName &&
      entry.prescriptionUnit &&
      entry.prescriptionUnit !== 'unknown' &&
      entry.movementFamilies.length > 0 &&
      entry.tissueStressProfile.length > 0 &&
      entry.methodCompatibility.length > 0
    
    if (hasFull) exercisesWithFullProfiles++
    if (entry.methodCompatibility.length > 0) exercisesWithMethodCompatibility++
    if (entry.tissueStressProfile.length > 0) exercisesWithTissueStress++
    if (entry.progressionRelationships.length > 0) exercisesWithProgressionPaths++
    if (entry.weightedStrengthAnchor) weightedAnchorCount++
    taxonomyWarningCount += entry.knownTaxonomyWarnings.length
  }
  
  let skillsWithBalanceRequirements = 0
  for (const skill of SKILL_KNOWLEDGE_SEED) {
    if (skill.programBalanceRequirements.length > 0) skillsWithBalanceRequirements++
  }
  
  return {
    totalExercises: EXERCISE_SKILL_KNOWLEDGE_SEED.length,
    totalSkills: SKILL_KNOWLEDGE_SEED.length,
    exercisesWithFullProfiles,
    exercisesWithMethodCompatibility,
    exercisesWithTissueStress,
    exercisesWithProgressionPaths,
    skillsWithBalanceRequirements,
    weightedAnchorCount,
    taxonomyWarningCount,
  }
}

/**
 * Returns user-critical knowledge coverage (skills most likely to be selected)
 */
export function getUserCriticalKnowledgeCoverage(): {
  readonly coveredCriticalSkills: readonly string[]
  readonly missingCriticalSkills: readonly string[]
  readonly coveredCriticalExercises: readonly string[]
  readonly missingCriticalExercises: readonly string[]
  readonly overallCoverage: number
} {
  const seededExerciseIds = new Set(EXERCISE_SKILL_KNOWLEDGE_SEED.map(e => e.exerciseId))
  const seededSkillIds = new Set(SKILL_KNOWLEDGE_SEED.map(s => s.skillId))
  
  const coveredCriticalSkills = CRITICAL_SKILL_CONCEPTS.filter(s => seededSkillIds.has(s))
  const missingCriticalSkills = CRITICAL_SKILL_CONCEPTS.filter(s => !seededSkillIds.has(s))
  const coveredCriticalExercises = CRITICAL_EXERCISE_CONCEPTS.filter(e => seededExerciseIds.has(e))
  const missingCriticalExercises = CRITICAL_EXERCISE_CONCEPTS.filter(e => !seededExerciseIds.has(e))
  
  const totalCritical = CRITICAL_SKILL_CONCEPTS.length + CRITICAL_EXERCISE_CONCEPTS.length
  const totalCovered = coveredCriticalSkills.length + coveredCriticalExercises.length
  const overallCoverage = totalCritical > 0 ? Math.round((totalCovered / totalCritical) * 100) : 0
  
  return {
    coveredCriticalSkills,
    missingCriticalSkills,
    coveredCriticalExercises,
    missingCriticalExercises,
    overallCoverage,
  }
}

/**
 * Checks if Planche Lean Push-Up taxonomy is properly handled
 * This is a critical check to prevent hold/rep confusion
 */
export function checkPlancheLeanPushUpTaxonomy(): {
  readonly handled: boolean
  readonly plancheLeanIsSeconds: boolean
  readonly tuckPlanchePushupIsReps: boolean
  readonly explanation: string
} {
  const plancheLean = getExerciseSkillKnowledgeEntry('planche_lean')
  const tuckPlanchePushup = getExerciseSkillKnowledgeEntry('tuck_planche_pushup')
  
  const plancheLeanIsSeconds = plancheLean?.prescriptionUnit === 'seconds' && plancheLean?.isIsometric === true
  const tuckPlanchePushupIsReps = tuckPlanchePushup?.prescriptionUnit === 'reps' && tuckPlanchePushup?.isIsometric === false
  
  const handled = plancheLeanIsSeconds && tuckPlanchePushupIsReps
  
  let explanation = ''
  if (handled) {
    explanation = 'Planche Lean (static hold) uses seconds, Tuck Planche Push-Up (dynamic) uses reps - taxonomy is correctly separated'
  } else if (!plancheLean) {
    explanation = 'Planche Lean not seeded'
  } else if (!tuckPlanchePushup) {
    explanation = 'Tuck Planche Push-Up not seeded'
  } else {
    explanation = 'Taxonomy may be ambiguous - verify prescription units'
  }
  
  return {
    handled,
    plancheLeanIsSeconds,
    tuckPlanchePushupIsReps,
    explanation,
  }
}

/**
 * Checks if weighted strength anchors are properly represented
 */
export function checkWeightedAnchorRepresentation(): {
  readonly weightedPullUpSeeded: boolean
  readonly weightedDipSeeded: boolean
  readonly bothAnchorsMarked: boolean
  readonly pullAnchorHasSkillTransfer: boolean
  readonly dipAnchorHasSkillTransfer: boolean
} {
  const weightedPullUp = getExerciseSkillKnowledgeEntry('weighted_pull_up')
  const weightedDip = getExerciseSkillKnowledgeEntry('weighted_dip')
  
  return {
    weightedPullUpSeeded: !!weightedPullUp,
    weightedDipSeeded: !!weightedDip,
    bothAnchorsMarked: 
      (weightedPullUp?.weightedStrengthAnchor ?? false) && 
      (weightedDip?.weightedStrengthAnchor ?? false),
    pullAnchorHasSkillTransfer: (weightedPullUp?.skillTransfers?.length ?? 0) > 0,
    dipAnchorHasSkillTransfer: (weightedDip?.skillTransfers?.length ?? 0) > 0,
  }
}
