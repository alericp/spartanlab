/**
 * Doctrine Query Service
 * 
 * PURPOSE:
 * Higher-level query interface for doctrine data.
 * Combines DB-backed doctrine with code-based registries.
 * Provides unified access for future generator integration.
 * 
 * SAFETY:
 * - Read-only operations
 * - Graceful fallback to code registries if DB unavailable
 * - No generator behavior changes in this phase
 */

import {
  getDoctrineSources,
  getActiveDoctrineSources,
  getDoctrinePrinciples,
  getProgressionRules,
  getExerciseSelectionRules,
  getContraindicationRules,
  getMethodRules,
  getPrescriptionRules,
  getCarryoverRules,
  getDoctrineCoverageSummary,
  type DoctrineSource,
  type DoctrinePrinciple,
  type ProgressionRule,
  type ExerciseSelectionRule,
  type ContraindicationRule,
  type MethodRule,
  type PrescriptionRule,
  type CarryoverRule,
  type DoctrineCoverageSummary,
} from './doctrine-db'

// Import code-based registries for comparison/fallback
import { DOCTRINE_REGISTRY } from './training-doctrine-registry/doctrineRegistry'
import { METHOD_PROFILES } from './doctrine/method-profile-registry'
import { SKILL_SUPPORT_MAPPINGS } from './doctrine/skill-support-mappings'

// =============================================================================
// TYPES
// =============================================================================

export interface DoctrineQueryContext {
  goalKey?: string
  skillKey?: string
  levelScope?: string
  equipmentAvailable?: string[]
  jointCautions?: string[]
}

export interface CombinedDoctrineSnapshot {
  // DB-backed doctrine
  dbSources: DoctrineSource[]
  dbPrinciples: DoctrinePrinciple[]
  dbProgressionRules: ProgressionRule[]
  dbExerciseSelectionRules: ExerciseSelectionRule[]
  dbContraindicationRules: ContraindicationRule[]
  dbMethodRules: MethodRule[]
  dbPrescriptionRules: PrescriptionRule[]
  dbCarryoverRules: CarryoverRule[]
  
  // Code-based registry counts (for comparison)
  codeDoctrineCount: number
  codeMethodProfileCount: number
  codeSkillMappingCount: number
  
  // Coverage summary
  coverage: DoctrineCoverageSummary
  
  // Status
  dbAvailable: boolean
  codeAvailable: boolean
  hybridMode: boolean
}

export interface DoctrineForSkill {
  skillKey: string
  progressionRules: ProgressionRule[]
  carryoverRules: CarryoverRule[]
  relevantPrinciples: DoctrinePrinciple[]
  relevantContraindications: ContraindicationRule[]
  relevantExerciseRules: ExerciseSelectionRule[]
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all doctrine sources from DB
 */
export async function queryDoctrineSources(): Promise<DoctrineSource[]> {
  return getDoctrineSources()
}

/**
 * Get active doctrine sources only
 */
export async function queryActiveSources(): Promise<DoctrineSource[]> {
  return getActiveDoctrineSources()
}

/**
 * Get doctrine principles filtered by context
 */
export async function queryPrinciples(context?: DoctrineQueryContext): Promise<DoctrinePrinciple[]> {
  return getDoctrinePrinciples({
    levelScope: context?.levelScope,
  })
}

/**
 * Get progression rules for a specific skill
 */
export async function queryProgressionRulesForSkill(skillKey: string): Promise<ProgressionRule[]> {
  return getProgressionRules({ skillKey })
}

/**
 * Get exercise selection rules filtered by context
 */
export async function queryExerciseSelectionRules(context?: DoctrineQueryContext): Promise<ExerciseSelectionRule[]> {
  return getExerciseSelectionRules({
    goalKey: context?.goalKey,
    skillKey: context?.skillKey,
  })
}

/**
 * Get contraindication rules for athlete's joint cautions
 */
export async function queryContraindicationsForContext(
  exerciseKey?: string,
  jointCautions?: string[]
): Promise<ContraindicationRule[]> {
  const rules = await getContraindicationRules(exerciseKey)
  
  if (!jointCautions || jointCautions.length === 0) {
    return rules
  }
  
  // Filter to rules relevant to athlete's joint cautions
  return rules.filter(rule => {
    if (!rule.blockedJointJson) return false
    return rule.blockedJointJson.some(joint => 
      jointCautions.some(caution => caution.toLowerCase().includes(joint.toLowerCase()))
    )
  })
}

/**
 * Get method rules filtered by goal and level
 */
export async function queryMethodRules(context?: DoctrineQueryContext): Promise<MethodRule[]> {
  const rules = await getMethodRules()
  
  if (!context) return rules
  
  return rules.filter(rule => {
    const goalMatch = !context.goalKey || 
      rule.compatibleGoalsJson?.includes(context.goalKey)
    const levelMatch = !context.levelScope || 
      rule.compatibleLevelsJson?.includes(context.levelScope)
    return goalMatch && levelMatch
  })
}

/**
 * Get prescription rules filtered by level and goal
 */
export async function queryPrescriptionRules(context?: DoctrineQueryContext): Promise<PrescriptionRule[]> {
  return getPrescriptionRules({
    levelScope: context?.levelScope,
    goalScope: context?.goalKey,
  })
}

/**
 * Get carryover rules for a target skill
 */
export async function queryCarryoverRulesForSkill(targetSkillKey: string): Promise<CarryoverRule[]> {
  return getCarryoverRules(targetSkillKey)
}

/**
 * Get combined doctrine snapshot for a specific skill
 */
export async function queryDoctrineForSkill(skillKey: string): Promise<DoctrineForSkill> {
  const [progressionRules, carryoverRules, principles, exerciseRules] = await Promise.all([
    getProgressionRules({ skillKey }),
    getCarryoverRules(skillKey),
    getDoctrinePrinciples(),
    getExerciseSelectionRules({ skillKey }),
  ])
  
  // Get contraindication rules for exercises in this skill's selection rules
  const exerciseKeys = [...new Set(exerciseRules.map(r => r.exerciseKey))]
  const contraindicationPromises = exerciseKeys.map(ek => getContraindicationRules(ek))
  const contraindicationResults = await Promise.all(contraindicationPromises)
  const relevantContraindications = contraindicationResults.flat()
  
  // Filter principles relevant to this skill
  const relevantPrinciples = principles.filter(p => 
    p.appliesToSkillTypes?.includes(skillKey) || 
    p.doctrineFamily === 'static_skill_training' ||
    p.doctrineFamily === 'strength_foundation'
  )
  
  return {
    skillKey,
    progressionRules,
    carryoverRules,
    relevantPrinciples,
    relevantContraindications,
    relevantExerciseRules: exerciseRules,
  }
}

/**
 * Get full combined doctrine snapshot (DB + code registries)
 */
export async function getCombinedDoctrineSnapshot(): Promise<CombinedDoctrineSnapshot> {
  const [
    dbSources,
    dbPrinciples,
    dbProgressionRules,
    dbExerciseSelectionRules,
    dbContraindicationRules,
    dbMethodRules,
    dbPrescriptionRules,
    dbCarryoverRules,
    coverage,
  ] = await Promise.all([
    getDoctrineSources(),
    getDoctrinePrinciples(),
    getProgressionRules(),
    getExerciseSelectionRules(),
    getContraindicationRules(),
    getMethodRules(),
    getPrescriptionRules(),
    getCarryoverRules(),
    getDoctrineCoverageSummary(),
  ])
  
  const codeDoctrineCount = Object.keys(DOCTRINE_REGISTRY).length
  const codeMethodProfileCount = Object.keys(METHOD_PROFILES).length
  const codeSkillMappingCount = Object.keys(SKILL_SUPPORT_MAPPINGS).length
  
  const dbAvailable = coverage.tablesExist && coverage.sourcesCount > 0
  const codeAvailable = codeDoctrineCount > 0 && codeMethodProfileCount > 0
  
  return {
    dbSources,
    dbPrinciples,
    dbProgressionRules,
    dbExerciseSelectionRules,
    dbContraindicationRules,
    dbMethodRules,
    dbPrescriptionRules,
    dbCarryoverRules,
    codeDoctrineCount,
    codeMethodProfileCount,
    codeSkillMappingCount,
    coverage,
    dbAvailable,
    codeAvailable,
    hybridMode: dbAvailable && codeAvailable,
  }
}

/**
 * Get doctrine coverage summary
 */
export async function getDoctrineStatus(): Promise<DoctrineCoverageSummary> {
  return getDoctrineCoverageSummary()
}

// =============================================================================
// COMPARISON UTILITIES
// =============================================================================

export interface DoctrineSourceComparison {
  codeRegistries: {
    doctrineRegistry: string[]
    methodProfiles: string[]
    skillSupportMappings: string[]
  }
  dbTables: {
    sources: number
    principles: number
    progressionRules: number
    exerciseSelectionRules: number
    contraindicationRules: number
    methodRules: number
    prescriptionRules: number
    carryoverRules: number
  }
  status: {
    codeOnlyToday: boolean
    dbFoundationExists: boolean
    dbHasData: boolean
    readyForHybrid: boolean
  }
}

/**
 * Compare code-based vs DB-backed doctrine sources
 */
export async function compareDoctrineSourcesStatus(): Promise<DoctrineSourceComparison> {
  const coverage = await getDoctrineCoverageSummary()
  
  return {
    codeRegistries: {
      doctrineRegistry: Object.keys(DOCTRINE_REGISTRY),
      methodProfiles: Object.keys(METHOD_PROFILES),
      skillSupportMappings: Object.keys(SKILL_SUPPORT_MAPPINGS),
    },
    dbTables: {
      sources: coverage.sourcesCount,
      principles: coverage.principlesCount,
      progressionRules: coverage.progressionRulesCount,
      exerciseSelectionRules: coverage.exerciseSelectionRulesCount,
      contraindicationRules: coverage.contraindicationRulesCount,
      methodRules: coverage.methodRulesCount,
      prescriptionRules: coverage.prescriptionRulesCount,
      carryoverRules: coverage.carryoverRulesCount,
    },
    status: {
      codeOnlyToday: !coverage.tablesExist || coverage.totalRulesCount === 0,
      dbFoundationExists: coverage.tablesExist,
      dbHasData: coverage.totalRulesCount > 0,
      readyForHybrid: coverage.tablesExist && coverage.totalRulesCount > 0 && coverage.activeSourcesCount > 0,
    },
  }
}
