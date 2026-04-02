/**
 * Doctrine Runtime Readiness Check
 * 
 * PURPOSE:
 * Single safe helper that checks whether doctrine DB is available for future use.
 * Does NOT change generator behavior in this phase.
 * May be logged by generation/audit code for diagnostics.
 * 
 * SAFETY:
 * - Read-only check
 * - No generator decision changes
 * - Safe for production logging
 */

import { getDoctrineCoverageSummary, type DoctrineCoverageSummary } from './doctrine-db'

// =============================================================================
// TYPES
// =============================================================================

export interface DoctrineRuntimeReadiness {
  // Basic availability
  tablesPresent: boolean
  liveSourcesPresent: boolean
  
  // Rule coverage
  hasPrinciples: boolean
  hasProgressionRules: boolean
  hasExerciseSelectionRules: boolean
  hasContraindicationRules: boolean
  hasMethodRules: boolean
  hasPrescriptionRules: boolean
  hasCarryoverRules: boolean
  
  // Minimum coverage thresholds
  minPrinciplesMet: boolean      // At least 3 principles
  minProgressionRulesMet: boolean // At least 2 progression rules per skill
  minExerciseRulesMet: boolean    // At least 3 exercise selection rules
  minContraindicationsMet: boolean // At least 2 contraindication rules
  
  // Overall readiness
  doctrineDBAvaialble: boolean
  minimumCoverageMet: boolean
  safeToConsumeInLaterPhase: boolean
  
  // Raw counts for logging
  counts: {
    sources: number
    activeSources: number
    principles: number
    progressionRules: number
    exerciseSelectionRules: number
    contraindicationRules: number
    methodRules: number
    prescriptionRules: number
    carryoverRules: number
    totalRules: number
  }
  
  // Diagnosis
  missingComponents: string[]
  readinessVerdict: 'NOT_READY' | 'PARTIAL' | 'READY' | 'FULL'
  readinessExplanation: string
}

// =============================================================================
// THRESHOLDS
// =============================================================================

const MINIMUM_THRESHOLDS = {
  principles: 3,
  progressionRules: 2,
  exerciseSelectionRules: 3,
  contraindicationRules: 2,
  methodRules: 1,
  prescriptionRules: 1,
  carryoverRules: 2,
}

// =============================================================================
// READINESS CHECK
// =============================================================================

/**
 * Check doctrine DB runtime readiness
 * Safe to call from any context - does not throw, returns structured result
 */
export async function checkDoctrineRuntimeReadiness(): Promise<DoctrineRuntimeReadiness> {
  let coverage: DoctrineCoverageSummary
  
  try {
    coverage = await getDoctrineCoverageSummary()
  } catch (error) {
    // If we can't even get coverage, DB is not available
    return createNotReadyResult('Database connection failed')
  }
  
  const {
    tablesExist,
    sourcesCount,
    principlesCount,
    progressionRulesCount,
    exerciseSelectionRulesCount,
    contraindicationRulesCount,
    methodRulesCount,
    prescriptionRulesCount,
    carryoverRulesCount,
    activeSourcesCount,
    totalRulesCount,
  } = coverage
  
  // Basic availability checks
  const tablesPresent = tablesExist
  const liveSourcesPresent = activeSourcesCount > 0
  
  // Rule presence checks
  const hasPrinciples = principlesCount > 0
  const hasProgressionRules = progressionRulesCount > 0
  const hasExerciseSelectionRules = exerciseSelectionRulesCount > 0
  const hasContraindicationRules = contraindicationRulesCount > 0
  const hasMethodRules = methodRulesCount > 0
  const hasPrescriptionRules = prescriptionRulesCount > 0
  const hasCarryoverRules = carryoverRulesCount > 0
  
  // Minimum coverage checks
  const minPrinciplesMet = principlesCount >= MINIMUM_THRESHOLDS.principles
  const minProgressionRulesMet = progressionRulesCount >= MINIMUM_THRESHOLDS.progressionRules
  const minExerciseRulesMet = exerciseSelectionRulesCount >= MINIMUM_THRESHOLDS.exerciseSelectionRules
  const minContraindicationsMet = contraindicationRulesCount >= MINIMUM_THRESHOLDS.contraindicationRules
  
  // Overall readiness
  const doctrineDBAvaialble = tablesPresent && liveSourcesPresent
  const minimumCoverageMet = minPrinciplesMet && minProgressionRulesMet && minExerciseRulesMet
  const safeToConsumeInLaterPhase = doctrineDBAvaialble && minimumCoverageMet
  
  // Collect missing components
  const missingComponents: string[] = []
  if (!tablesPresent) missingComponents.push('doctrine_tables_not_created')
  if (!liveSourcesPresent) missingComponents.push('no_active_doctrine_sources')
  if (!hasPrinciples) missingComponents.push('no_principles')
  if (!hasProgressionRules) missingComponents.push('no_progression_rules')
  if (!hasExerciseSelectionRules) missingComponents.push('no_exercise_selection_rules')
  if (!hasContraindicationRules) missingComponents.push('no_contraindication_rules')
  if (!minPrinciplesMet) missingComponents.push('principles_below_threshold')
  if (!minProgressionRulesMet) missingComponents.push('progression_rules_below_threshold')
  if (!minExerciseRulesMet) missingComponents.push('exercise_rules_below_threshold')
  
  // Determine verdict
  let readinessVerdict: 'NOT_READY' | 'PARTIAL' | 'READY' | 'FULL'
  let readinessExplanation: string
  
  if (!tablesPresent) {
    readinessVerdict = 'NOT_READY'
    readinessExplanation = 'Doctrine database tables have not been created. Run migration 012-doctrine-foundation-schema.sql.'
  } else if (!liveSourcesPresent) {
    readinessVerdict = 'NOT_READY'
    readinessExplanation = 'Doctrine tables exist but no active doctrine sources found. Run seed 013-doctrine-foundation-seed.sql.'
  } else if (!minimumCoverageMet) {
    readinessVerdict = 'PARTIAL'
    readinessExplanation = `Doctrine DB has ${totalRulesCount} rules but below minimum thresholds. Missing: ${missingComponents.join(', ')}.`
  } else if (totalRulesCount < 50) {
    readinessVerdict = 'READY'
    readinessExplanation = `Doctrine DB meets minimum thresholds with ${totalRulesCount} rules. Safe for initial generator integration.`
  } else {
    readinessVerdict = 'FULL'
    readinessExplanation = `Doctrine DB is fully populated with ${totalRulesCount} rules from ${activeSourcesCount} active sources.`
  }
  
  return {
    tablesPresent,
    liveSourcesPresent,
    hasPrinciples,
    hasProgressionRules,
    hasExerciseSelectionRules,
    hasContraindicationRules,
    hasMethodRules,
    hasPrescriptionRules,
    hasCarryoverRules,
    minPrinciplesMet,
    minProgressionRulesMet,
    minExerciseRulesMet,
    minContraindicationsMet,
    doctrineDBAvaialble,
    minimumCoverageMet,
    safeToConsumeInLaterPhase,
    counts: {
      sources: sourcesCount,
      activeSources: activeSourcesCount,
      principles: principlesCount,
      progressionRules: progressionRulesCount,
      exerciseSelectionRules: exerciseSelectionRulesCount,
      contraindicationRules: contraindicationRulesCount,
      methodRules: methodRulesCount,
      prescriptionRules: prescriptionRulesCount,
      carryoverRules: carryoverRulesCount,
      totalRules: totalRulesCount,
    },
    missingComponents,
    readinessVerdict,
    readinessExplanation,
  }
}

/**
 * Quick check if doctrine DB is ready for use (boolean only)
 */
export async function isDoctrineDBReady(): Promise<boolean> {
  const readiness = await checkDoctrineRuntimeReadiness()
  return readiness.safeToConsumeInLaterPhase
}

/**
 * Get a quick status string for logging
 */
export async function getDoctrineReadinessStatus(): Promise<string> {
  const readiness = await checkDoctrineRuntimeReadiness()
  return `[doctrine-db] ${readiness.readinessVerdict}: ${readiness.readinessExplanation}`
}

// =============================================================================
// HELPERS
// =============================================================================

function createNotReadyResult(reason: string): DoctrineRuntimeReadiness {
  return {
    tablesPresent: false,
    liveSourcesPresent: false,
    hasPrinciples: false,
    hasProgressionRules: false,
    hasExerciseSelectionRules: false,
    hasContraindicationRules: false,
    hasMethodRules: false,
    hasPrescriptionRules: false,
    hasCarryoverRules: false,
    minPrinciplesMet: false,
    minProgressionRulesMet: false,
    minExerciseRulesMet: false,
    minContraindicationsMet: false,
    doctrineDBAvaialble: false,
    minimumCoverageMet: false,
    safeToConsumeInLaterPhase: false,
    counts: {
      sources: 0,
      activeSources: 0,
      principles: 0,
      progressionRules: 0,
      exerciseSelectionRules: 0,
      contraindicationRules: 0,
      methodRules: 0,
      prescriptionRules: 0,
      carryoverRules: 0,
      totalRules: 0,
    },
    missingComponents: [reason],
    readinessVerdict: 'NOT_READY',
    readinessExplanation: reason,
  }
}
