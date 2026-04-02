/**
 * Doctrine Database Access Layer
 * 
 * PURPOSE:
 * Provides safe, read-only access to the doctrine database tables.
 * This layer does NOT replace existing code-based doctrine registries.
 * It enables future doctrine-aware generation by providing queryable DB access.
 * 
 * SAFETY:
 * - Gracefully handles missing DATABASE_URL
 * - Returns empty results when tables don't exist
 * - Production-safe logging only
 * - Read-only operations in this phase
 */

import { getSqlClient, isDatabaseAvailable } from './db'

// =============================================================================
// TYPES
// =============================================================================

export interface DoctrineSource {
  id: string
  sourceKey: string
  title: string
  sourceType: 'system_seeded' | 'manual' | 'extracted_pdf' | 'imported_note'
  description: string | null
  version: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DoctrinePrinciple {
  id: string
  sourceId: string
  doctrineFamily: string
  principleKey: string
  principleTitle: string
  principleSummary: string
  athleteLevelScope: string[]
  goalScope: string[] | null
  appliesToSkillTypes: string[] | null
  appliesToTrainingStyles: string[] | null
  safetyPriority: number
  priorityWeight: number
}

export interface ProgressionRule {
  id: string
  sourceId: string
  skillKey: string
  currentLevelKey: string
  nextLevelKey: string
  requiredPrerequisitesJson: Record<string, string> | null
  minReadinessJson: Record<string, string> | null
  progressionRuleSummary: string | null
  cautionFlagsJson: string[] | null
  confidenceWeight: number
}

export interface ExerciseSelectionRule {
  id: string
  sourceId: string
  goalKey: string | null
  skillKey: string | null
  exerciseKey: string
  roleKey: string | null
  levelScope: string[]
  equipmentRequirementsJson: Record<string, boolean> | null
  preferredWhenJson: Record<string, unknown> | null
  avoidWhenJson: Record<string, unknown> | null
  selectionWeight: number
}

export interface ContraindicationRule {
  id: string
  sourceId: string
  exerciseKey: string
  blockedJointJson: string[] | null
  blockedContextJson: Record<string, boolean> | null
  modificationGuidance: string | null
  severity: 'warning' | 'caution' | 'blocked'
}

export interface MethodRule {
  id: string
  sourceId: string
  methodKey: string
  category: string | null
  compatibleGoalsJson: string[] | null
  compatibleLevelsJson: string[] | null
  bestUseCasesJson: string[] | null
  avoidUseCasesJson: string[] | null
  structureBiasJson: Record<string, unknown> | null
}

export interface PrescriptionRule {
  id: string
  sourceId: string
  levelScope: string[] | null
  goalScope: string[] | null
  exerciseRoleScope: string[] | null
  repRangeJson: Record<string, unknown> | null
  setRangeJson: Record<string, unknown> | null
  holdRangeJson: Record<string, unknown> | null
  restRangeJson: Record<string, unknown> | null
  rpeGuidanceJson: Record<string, unknown> | null
  progressionGuidance: string | null
}

export interface CarryoverRule {
  id: string
  sourceId: string
  sourceExerciseOrSkillKey: string
  targetSkillKey: string
  carryoverType: 'direct' | 'indirect' | 'prerequisite' | 'accessory'
  carryoverStrength: number
  rationale: string | null
}

export interface DoctrineCoverageSummary {
  tablesExist: boolean
  sourcesCount: number
  principlesCount: number
  progressionRulesCount: number
  exerciseSelectionRulesCount: number
  contraindicationRulesCount: number
  methodRulesCount: number
  prescriptionRulesCount: number
  carryoverRulesCount: number
  activeSourcesCount: number
  hasLiveVersion: boolean
  totalRulesCount: number
}

// =============================================================================
// TABLE EXISTENCE CHECK
// =============================================================================

async function doctrineTablesExist(): Promise<boolean> {
  if (!isDatabaseAvailable()) {
    return false
  }
  
  try {
    const sql = getSqlClient()
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'training_doctrine_sources'
      ) as exists
    `
    return result[0]?.exists === true
  } catch (error) {
    console.log('[doctrine-db] Table existence check failed:', error)
    return false
  }
}

// =============================================================================
// READ FUNCTIONS
// =============================================================================

export async function getDoctrineSources(): Promise<DoctrineSource[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_key as "sourceKey",
        title,
        source_type as "sourceType",
        description,
        version,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM training_doctrine_sources
      ORDER BY created_at DESC
    `
    return rows as DoctrineSource[]
  } catch (error) {
    console.log('[doctrine-db] getDoctrineSources failed:', error)
    return []
  }
}

export async function getActiveDoctrineSources(): Promise<DoctrineSource[]> {
  const sources = await getDoctrineSources()
  return sources.filter(s => s.isActive)
}

export async function getDoctrinePrinciples(filters?: {
  sourceId?: string
  doctrineFamily?: string
  levelScope?: string
}): Promise<DoctrinePrinciple[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    let query = sql`
      SELECT 
        id,
        source_id as "sourceId",
        doctrine_family as "doctrineFamily",
        principle_key as "principleKey",
        principle_title as "principleTitle",
        principle_summary as "principleSummary",
        athlete_level_scope as "athleteLevelScope",
        goal_scope as "goalScope",
        applies_to_skill_types as "appliesToSkillTypes",
        applies_to_training_styles as "appliesToTrainingStyles",
        safety_priority as "safetyPriority",
        priority_weight as "priorityWeight"
      FROM training_doctrine_principles
      WHERE 1=1
    `
    
    // Note: For complex filtering, a more sophisticated query builder would be needed
    // This is a simple implementation for the foundation phase
    const rows = await query
    
    let results = rows as DoctrinePrinciple[]
    
    // Apply filters in memory for simplicity
    if (filters?.sourceId) {
      results = results.filter(p => p.sourceId === filters.sourceId)
    }
    if (filters?.doctrineFamily) {
      results = results.filter(p => p.doctrineFamily === filters.doctrineFamily)
    }
    if (filters?.levelScope) {
      results = results.filter(p => 
        p.athleteLevelScope?.includes(filters.levelScope!)
      )
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getDoctrinePrinciples failed:', error)
    return []
  }
}

export async function getProgressionRules(filters?: {
  sourceId?: string
  skillKey?: string
  currentLevelKey?: string
}): Promise<ProgressionRule[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_id as "sourceId",
        skill_key as "skillKey",
        current_level_key as "currentLevelKey",
        next_level_key as "nextLevelKey",
        required_prerequisites_json as "requiredPrerequisitesJson",
        min_readiness_json as "minReadinessJson",
        progression_rule_summary as "progressionRuleSummary",
        caution_flags_json as "cautionFlagsJson",
        confidence_weight as "confidenceWeight"
      FROM progression_rules
      ORDER BY skill_key, current_level_key
    `
    
    let results = rows as ProgressionRule[]
    
    if (filters?.sourceId) {
      results = results.filter(r => r.sourceId === filters.sourceId)
    }
    if (filters?.skillKey) {
      results = results.filter(r => r.skillKey === filters.skillKey)
    }
    if (filters?.currentLevelKey) {
      results = results.filter(r => r.currentLevelKey === filters.currentLevelKey)
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getProgressionRules failed:', error)
    return []
  }
}

export async function getExerciseSelectionRules(filters?: {
  sourceId?: string
  goalKey?: string
  skillKey?: string
  exerciseKey?: string
}): Promise<ExerciseSelectionRule[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_id as "sourceId",
        goal_key as "goalKey",
        skill_key as "skillKey",
        exercise_key as "exerciseKey",
        role_key as "roleKey",
        level_scope as "levelScope",
        equipment_requirements_json as "equipmentRequirementsJson",
        preferred_when_json as "preferredWhenJson",
        avoid_when_json as "avoidWhenJson",
        selection_weight as "selectionWeight"
      FROM exercise_selection_rules
      ORDER BY exercise_key
    `
    
    let results = rows as ExerciseSelectionRule[]
    
    if (filters?.sourceId) {
      results = results.filter(r => r.sourceId === filters.sourceId)
    }
    if (filters?.goalKey) {
      results = results.filter(r => r.goalKey === filters.goalKey)
    }
    if (filters?.skillKey) {
      results = results.filter(r => r.skillKey === filters.skillKey)
    }
    if (filters?.exerciseKey) {
      results = results.filter(r => r.exerciseKey === filters.exerciseKey)
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getExerciseSelectionRules failed:', error)
    return []
  }
}

export async function getContraindicationRules(exerciseKey?: string): Promise<ContraindicationRule[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_id as "sourceId",
        exercise_key as "exerciseKey",
        blocked_joint_json as "blockedJointJson",
        blocked_context_json as "blockedContextJson",
        modification_guidance as "modificationGuidance",
        severity
      FROM exercise_contraindication_rules
      ORDER BY severity DESC, exercise_key
    `
    
    let results = rows as ContraindicationRule[]
    
    if (exerciseKey) {
      results = results.filter(r => r.exerciseKey === exerciseKey)
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getContraindicationRules failed:', error)
    return []
  }
}

export async function getMethodRules(methodKey?: string): Promise<MethodRule[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_id as "sourceId",
        method_key as "methodKey",
        category,
        compatible_goals_json as "compatibleGoalsJson",
        compatible_levels_json as "compatibleLevelsJson",
        best_use_cases_json as "bestUseCasesJson",
        avoid_use_cases_json as "avoidUseCasesJson",
        structure_bias_json as "structureBiasJson"
      FROM method_rules
      ORDER BY method_key
    `
    
    let results = rows as MethodRule[]
    
    if (methodKey) {
      results = results.filter(r => r.methodKey === methodKey)
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getMethodRules failed:', error)
    return []
  }
}

export async function getPrescriptionRules(filters?: {
  levelScope?: string
  goalScope?: string
}): Promise<PrescriptionRule[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_id as "sourceId",
        level_scope as "levelScope",
        goal_scope as "goalScope",
        exercise_role_scope as "exerciseRoleScope",
        rep_range_json as "repRangeJson",
        set_range_json as "setRangeJson",
        hold_range_json as "holdRangeJson",
        rest_range_json as "restRangeJson",
        rpe_guidance_json as "rpeGuidanceJson",
        progression_guidance as "progressionGuidance"
      FROM prescription_rules
    `
    
    let results = rows as PrescriptionRule[]
    
    if (filters?.levelScope) {
      results = results.filter(r => r.levelScope?.includes(filters.levelScope!))
    }
    if (filters?.goalScope) {
      results = results.filter(r => r.goalScope?.includes(filters.goalScope!))
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getPrescriptionRules failed:', error)
    return []
  }
}

export async function getCarryoverRules(targetSkillKey?: string): Promise<CarryoverRule[]> {
  if (!isDatabaseAvailable()) {
    return []
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return []
  }
  
  try {
    const sql = getSqlClient()
    const rows = await sql`
      SELECT 
        id,
        source_id as "sourceId",
        source_exercise_or_skill_key as "sourceExerciseOrSkillKey",
        target_skill_key as "targetSkillKey",
        carryover_type as "carryoverType",
        carryover_strength as "carryoverStrength",
        rationale
      FROM skill_carryover_rules
      ORDER BY carryover_strength DESC
    `
    
    let results = rows as CarryoverRule[]
    
    if (targetSkillKey) {
      results = results.filter(r => r.targetSkillKey === targetSkillKey)
    }
    
    return results
  } catch (error) {
    console.log('[doctrine-db] getCarryoverRules failed:', error)
    return []
  }
}

// =============================================================================
// COVERAGE SUMMARY
// =============================================================================

export async function getDoctrineCoverageSummary(): Promise<DoctrineCoverageSummary> {
  const defaultSummary: DoctrineCoverageSummary = {
    tablesExist: false,
    sourcesCount: 0,
    principlesCount: 0,
    progressionRulesCount: 0,
    exerciseSelectionRulesCount: 0,
    contraindicationRulesCount: 0,
    methodRulesCount: 0,
    prescriptionRulesCount: 0,
    carryoverRulesCount: 0,
    activeSourcesCount: 0,
    hasLiveVersion: false,
    totalRulesCount: 0,
  }
  
  if (!isDatabaseAvailable()) {
    return defaultSummary
  }
  
  const tablesExist = await doctrineTablesExist()
  if (!tablesExist) {
    return defaultSummary
  }
  
  try {
    const sql = getSqlClient()
    
    // Get counts from all tables
    const [
      sourcesResult,
      principlesResult,
      progressionResult,
      exerciseSelectionResult,
      contraindicationResult,
      methodResult,
      prescriptionResult,
      carryoverResult,
      activeSourcesResult,
      liveVersionResult,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM training_doctrine_sources`,
      sql`SELECT COUNT(*) as count FROM training_doctrine_principles`,
      sql`SELECT COUNT(*) as count FROM progression_rules`,
      sql`SELECT COUNT(*) as count FROM exercise_selection_rules`,
      sql`SELECT COUNT(*) as count FROM exercise_contraindication_rules`,
      sql`SELECT COUNT(*) as count FROM method_rules`,
      sql`SELECT COUNT(*) as count FROM prescription_rules`,
      sql`SELECT COUNT(*) as count FROM skill_carryover_rules`,
      sql`SELECT COUNT(*) as count FROM training_doctrine_sources WHERE is_active = true`,
      sql`SELECT COUNT(*) as count FROM doctrine_rule_versions WHERE is_live = true`,
    ])
    
    const sourcesCount = Number(sourcesResult[0]?.count || 0)
    const principlesCount = Number(principlesResult[0]?.count || 0)
    const progressionRulesCount = Number(progressionResult[0]?.count || 0)
    const exerciseSelectionRulesCount = Number(exerciseSelectionResult[0]?.count || 0)
    const contraindicationRulesCount = Number(contraindicationResult[0]?.count || 0)
    const methodRulesCount = Number(methodResult[0]?.count || 0)
    const prescriptionRulesCount = Number(prescriptionResult[0]?.count || 0)
    const carryoverRulesCount = Number(carryoverResult[0]?.count || 0)
    
    return {
      tablesExist: true,
      sourcesCount,
      principlesCount,
      progressionRulesCount,
      exerciseSelectionRulesCount,
      contraindicationRulesCount,
      methodRulesCount,
      prescriptionRulesCount,
      carryoverRulesCount,
      activeSourcesCount: Number(activeSourcesResult[0]?.count || 0),
      hasLiveVersion: Number(liveVersionResult[0]?.count || 0) > 0,
      totalRulesCount: principlesCount + progressionRulesCount + exerciseSelectionRulesCount + 
        contraindicationRulesCount + methodRulesCount + prescriptionRulesCount + carryoverRulesCount,
    }
  } catch (error) {
    console.log('[doctrine-db] getDoctrineCoverageSummary failed:', error)
    return defaultSummary
  }
}
