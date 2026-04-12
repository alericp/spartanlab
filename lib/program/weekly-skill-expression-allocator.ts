/**
 * WEEKLY SKILL EXPRESSION ALLOCATOR
 * 
 * =============================================================================
 * AUTHORITATIVE UPSTREAM PLANNING CONTRACT
 * =============================================================================
 * 
 * This allocator becomes the SINGLE SOURCE OF TRUTH for how onboarding-selected
 * skills are expressed across the weekly program BEFORE session assembly.
 * 
 * It enforces:
 * 1. Selected skills cannot silently disappear
 * 2. Primary skills dominate direct high-intensity work
 * 3. Secondary/tertiary does not mean invisible
 * 4. Overlap-aware tissue allocation
 * 5. Grouped methods are contract-based decisions
 * 6. Current > Response > History precedence
 */

import type { FamilyReadinessContract, MethodPermission } from './exposure-adaptation-readiness'
import { mapSkillToFamily, type SkillFamily } from './skill-specific-truth-resolution'

// =============================================================================
// TYPES
// =============================================================================

export type UserPriorityTier = 'primary' | 'secondary' | 'additional'
export type DoctrineDisposition = 'direct_priority' | 'direct_limited' | 'carryover_only' | 'temporary_defer'
export type AllowedDirectIntensity = 'high' | 'moderate' | 'low' | 'none'
export type AllowedMethodAggression = 'straight_only' | 'simple_grouping_ok' | 'complex_grouping_ok'
export type OverlapRiskBucket = 'low' | 'moderate' | 'high'

/**
 * Weekly expression decision for a single skill family
 */
export interface WeeklySkillExpressionDecision {
  family: string
  skill: string
  selectedByUser: boolean
  userPriorityTier: UserPriorityTier
  doctrineDisposition: DoctrineDisposition
  directExposureTargetCount: number
  carryoverExposureTargetCount: number
  allowedDirectIntensity: AllowedDirectIntensity
  allowedMethodAggression: AllowedMethodAggression
  overlapRiskBucket: OverlapRiskBucket
  tissueConstraintReason: string | null
  readinessConstraintReason: string | null
  finalReasoning: string[]
}

/**
 * Complete weekly expression allocation contract
 */
export interface WeeklyExpressionAllocationContract {
  contractVersion: string
  builtAt: string
  
  // Input summary
  totalSelectedSkills: number
  effectiveTrainingDays: number
  
  // Decisions per skill
  decisions: WeeklySkillExpressionDecision[]
  
  // Overlap analysis
  overlapMatrix: OverlapMatrixEntry[]
  highOverlapPairs: string[][]
  
  // Method permissions
  globalMethodPermission: AllowedMethodAggression
  perSessionMethodPermissions: Map<number, AllowedMethodAggression>
  
  // Back lever specific (as per requirements)
  backLeverDisposition: {
    selected: boolean
    finalDisposition: DoctrineDisposition
    directCount: number
    carryoverCount: number
    deferReason: string | null
    expressionMode: 'direct_progression' | 'technical_exposure' | 'carryover_ownership' | 'explicit_deferment'
  } | null
  
  // Final audit
  audit: {
    skillsWithDirectPriority: number
    skillsWithDirectLimited: number
    skillsWithCarryoverOnly: number
    skillsDeferred: number
    visibleExpressionCount: number
    primarySkillsDominateHardWork: boolean
    noSilentDisappearances: boolean
    overlapAwareAllocation: boolean
    methodDecisionsContractBased: boolean
    verdict: 'ALLOCATION_STRONG' | 'ALLOCATION_ADEQUATE' | 'ALLOCATION_NARROW'
  }
}

/**
 * Overlap matrix entry
 */
interface OverlapMatrixEntry {
  familyA: string
  familyB: string
  overlapType: 'tissue' | 'joint' | 'neural' | 'recovery'
  overlapSeverity: 'low' | 'moderate' | 'high'
  constraintReason: string
}

/**
 * Tissue overlap definitions - which families stress similar structures
 */
const TISSUE_OVERLAP_MAP: Record<string, { overlaps: string[]; severity: 'low' | 'moderate' | 'high'; reason: string }[]> = {
  'front_lever': [
    { overlaps: ['back_lever'], severity: 'high', reason: 'straight-arm shoulder depression demand' },
    { overlaps: ['planche'], severity: 'moderate', reason: 'scapular protraction/retraction antagonism' },
    { overlaps: ['rings_strength'], severity: 'moderate', reason: 'false grip and shoulder stability demand' },
    { overlaps: ['weighted_pull'], severity: 'low', reason: 'lat activation overlap' },
  ],
  'back_lever': [
    { overlaps: ['front_lever'], severity: 'high', reason: 'straight-arm shoulder depression demand' },
    { overlaps: ['planche'], severity: 'high', reason: 'straight-arm elbow/shoulder stress' },
    { overlaps: ['rings_strength'], severity: 'moderate', reason: 'ring support and shoulder stability' },
  ],
  'planche': [
    { overlaps: ['front_lever'], severity: 'moderate', reason: 'scapular and shoulder stability demand' },
    { overlaps: ['back_lever'], severity: 'high', reason: 'straight-arm elbow/shoulder stress' },
    { overlaps: ['hspu'], severity: 'moderate', reason: 'shoulder pressing overlap' },
    { overlaps: ['weighted_dip'], severity: 'low', reason: 'anterior shoulder loading' },
  ],
  'hspu': [
    { overlaps: ['planche'], severity: 'moderate', reason: 'shoulder pressing and overhead stability' },
    { overlaps: ['handstand'], severity: 'low', reason: 'overhead position demand' },
    { overlaps: ['weighted_dip'], severity: 'moderate', reason: 'pressing pattern overlap' },
  ],
  'muscle_up': [
    { overlaps: ['weighted_pull'], severity: 'moderate', reason: 'pulling pattern overlap' },
    { overlaps: ['weighted_dip'], severity: 'moderate', reason: 'dip transition demand' },
    { overlaps: ['rings_strength'], severity: 'moderate', reason: 'ring stability requirement' },
  ],
  'rings_strength': [
    { overlaps: ['front_lever'], severity: 'moderate', reason: 'ring stability and shoulder demand' },
    { overlaps: ['back_lever'], severity: 'moderate', reason: 'ring support and shoulder stability' },
    { overlaps: ['muscle_up'], severity: 'moderate', reason: 'ring stability requirement' },
  ],
  'weighted_pull': [
    { overlaps: ['front_lever'], severity: 'low', reason: 'lat activation overlap' },
    { overlaps: ['muscle_up'], severity: 'moderate', reason: 'pulling pattern overlap' },
  ],
  'weighted_dip': [
    { overlaps: ['planche'], severity: 'low', reason: 'anterior shoulder loading' },
    { overlaps: ['hspu'], severity: 'moderate', reason: 'pressing pattern overlap' },
    { overlaps: ['muscle_up'], severity: 'moderate', reason: 'dip transition demand' },
  ],
  'handstand': [
    { overlaps: ['hspu'], severity: 'low', reason: 'overhead position demand' },
  ],
  'compression': [
    // Compression has minimal direct overlap with pulling/pushing skills
  ],
}

// =============================================================================
// MAIN ALLOCATOR FUNCTION
// =============================================================================

export interface AllocatorInputs {
  selectedSkills: string[]
  primaryGoal: string
  secondaryGoal: string | null
  effectiveTrainingDays: number
  readinessMap: Map<string, FamilyReadinessContract>
  methodPreferences: {
    supersets?: boolean
    circuits?: boolean
    straightSets?: boolean
  }
  jointCautions: string[]
  equipmentAvailable: string[]
  experienceLevel: string
}

/**
 * Build the authoritative weekly skill expression allocation contract
 * 
 * This is the UPSTREAM source of truth that all downstream session assembly must consume.
 */
export function buildWeeklyExpressionAllocationContract(
  inputs: AllocatorInputs
): WeeklyExpressionAllocationContract {
  // ==========================================================================
  // [ALLOCATOR_INPUT_VALIDATION] Validate and normalize inputs before processing
  // ==========================================================================
  if (!inputs) {
    throw new Error('[ALLOCATOR_INPUT_VALIDATION_FAIL] inputs is null/undefined')
  }
  
  // Normalize all inputs to safe values
  const safeSelectedSkills = Array.isArray(inputs.selectedSkills) ? inputs.selectedSkills : []
  const safePrimaryGoal = inputs.primaryGoal || ''
  const safeSecondaryGoal = inputs.secondaryGoal || null
  const safeEffectiveTrainingDays = typeof inputs.effectiveTrainingDays === 'number' && inputs.effectiveTrainingDays > 0 
    ? inputs.effectiveTrainingDays : 3
  const safeReadinessMap = inputs.readinessMap instanceof Map ? inputs.readinessMap : new Map()
  const safeMethodPreferences = inputs.methodPreferences || { supersets: false, circuits: false, straightSets: true }
  const safeJointCautions = Array.isArray(inputs.jointCautions) ? inputs.jointCautions : []
  const safeExperienceLevel = inputs.experienceLevel || 'intermediate'
  
  // Log validation results
  console.log('[ALLOCATOR_INPUT_VALIDATION_PASS]', {
    fingerprint: 'ALLOCATOR_V1_2026_04_12',
    selectedSkillsCount: safeSelectedSkills.length,
    primaryGoal: safePrimaryGoal || 'NONE',
    secondaryGoal: safeSecondaryGoal || 'NONE',
    effectiveTrainingDays: safeEffectiveTrainingDays,
    readinessMapSize: safeReadinessMap.size,
    experienceLevel: safeExperienceLevel,
    verdict: safeSelectedSkills.length > 0 ? 'INPUTS_VALID' : 'INPUTS_EMPTY_BUT_SAFE',
  })
  
  const {
    selectedSkills: _rawSelectedSkills,
    primaryGoal: _rawPrimaryGoal,
    secondaryGoal: _rawSecondaryGoal,
    effectiveTrainingDays: _rawTrainingDays,
    readinessMap: _rawReadinessMap,
    methodPreferences: _rawMethodPreferences,
    jointCautions: _rawJointCautions,
    experienceLevel: _rawExperienceLevel,
  } = inputs
  
  // Use safe values for all processing
  const selectedSkills = safeSelectedSkills
  const primaryGoal = safePrimaryGoal
  const secondaryGoal = safeSecondaryGoal
  const effectiveTrainingDays = safeEffectiveTrainingDays
  const readinessMap = safeReadinessMap
  const methodPreferences = safeMethodPreferences
  const jointCautions = safeJointCautions
  const experienceLevel = safeExperienceLevel
  
  const decisions: WeeklySkillExpressionDecision[] = []
  const overlapMatrix: OverlapMatrixEntry[] = []
  const highOverlapPairs: string[][] = []
  
  // ==========================================================================
  // STEP 1: CLASSIFY USER PRIORITY TIER FOR EACH SKILL
  // ==========================================================================
  const skillPriorityMap = new Map<string, UserPriorityTier>()
  for (const skill of selectedSkills) {
    if (skill === primaryGoal) {
      skillPriorityMap.set(skill, 'primary')
    } else if (skill === secondaryGoal) {
      skillPriorityMap.set(skill, 'secondary')
    } else {
      skillPriorityMap.set(skill, 'additional')
    }
  }
  
  // ==========================================================================
  // STEP 2: BUILD OVERLAP MATRIX
  // ==========================================================================
  for (let i = 0; i < selectedSkills.length; i++) {
    const skillA = selectedSkills[i]
    const familyA = mapSkillToFamily(skillA)
    
    for (let j = i + 1; j < selectedSkills.length; j++) {
      const skillB = selectedSkills[j]
      const familyB = mapSkillToFamily(skillB)
      
      // Check if families overlap
      const overlapDef = TISSUE_OVERLAP_MAP[familyA]?.find(o => o.overlaps.includes(familyB))
      if (overlapDef) {
        overlapMatrix.push({
          familyA,
          familyB,
          overlapType: 'tissue',
          overlapSeverity: overlapDef.severity,
          constraintReason: overlapDef.reason,
        })
        
        if (overlapDef.severity === 'high') {
          highOverlapPairs.push([familyA, familyB])
        }
      }
    }
  }
  
  // ==========================================================================
  // STEP 3: DETERMINE DIRECT VS CARRYOVER ALLOCATION PER SKILL
  // ==========================================================================
  
  // Calculate total direct exposure budget
  // Each training day can support ~2 direct skill progressions max
  const maxDirectExposuresPerWeek = effectiveTrainingDays * 2
  let directExposureBudgetRemaining = maxDirectExposuresPerWeek
  
  // Primary always gets direct priority
  const primaryDirectCount = Math.min(effectiveTrainingDays, Math.ceil(effectiveTrainingDays * 0.6))
  directExposureBudgetRemaining -= primaryDirectCount
  
  // Secondary gets direct limited
  const secondaryDirectCount = secondaryGoal 
    ? Math.min(Math.floor(effectiveTrainingDays * 0.4), directExposureBudgetRemaining)
    : 0
  directExposureBudgetRemaining -= secondaryDirectCount
  
  // Additional skills compete for remaining budget
  const additionalSkills = selectedSkills.filter(s => s !== primaryGoal && s !== secondaryGoal)
  const budgetPerAdditional = additionalSkills.length > 0 
    ? Math.floor(directExposureBudgetRemaining / additionalSkills.length)
    : 0
  
  // Track which skills got hard direct work for overlap analysis
  const skillsWithHardDirect = new Set<string>()
  
  for (const skill of selectedSkills) {
    const family = mapSkillToFamily(skill)
    const priorityTier = skillPriorityMap.get(skill) || 'additional'
    const readiness = readinessMap.get(family)
    
    let disposition: DoctrineDisposition = 'direct_priority'
    let directCount = 0
    let carryoverCount = 0
    let allowedIntensity: AllowedDirectIntensity = 'high'
    let allowedMethod: AllowedMethodAggression = 'complex_grouping_ok'
    let tissueConstraint: string | null = null
    let readinessConstraint: string | null = null
    const reasoning: string[] = []
    
    // =======================================================================
    // RULE 1: PRIMARY SKILLS DOMINATE DIRECT HIGH-INTENSITY WORK
    // =======================================================================
    if (priorityTier === 'primary') {
      disposition = 'direct_priority'
      directCount = primaryDirectCount
      carryoverCount = effectiveTrainingDays - directCount
      allowedIntensity = 'high'
      skillsWithHardDirect.add(skill)
      reasoning.push('Primary skill receives dominant direct high-intensity exposure')
      
    } else if (priorityTier === 'secondary') {
      disposition = 'direct_limited'
      directCount = secondaryDirectCount
      carryoverCount = Math.max(1, effectiveTrainingDays - directCount - 1)
      allowedIntensity = 'moderate'
      skillsWithHardDirect.add(skill)
      reasoning.push('Secondary skill receives direct exposure with moderate intensity')
      
    } else {
      // Additional skills - check overlap and readiness
      
      // =======================================================================
      // RULE 4: OVERLAP-AWARE TISSUE ALLOCATION
      // =======================================================================
      const overlapsWithPrimary = highOverlapPairs.some(pair => 
        (pair[0] === family && pair[1] === mapSkillToFamily(primaryGoal)) ||
        (pair[1] === family && pair[0] === mapSkillToFamily(primaryGoal))
      )
      
      const overlapsWithSecondary = secondaryGoal && highOverlapPairs.some(pair =>
        (pair[0] === family && pair[1] === mapSkillToFamily(secondaryGoal)) ||
        (pair[1] === family && pair[0] === mapSkillToFamily(secondaryGoal))
      )
      
      if (overlapsWithPrimary || overlapsWithSecondary) {
        // High overlap with primary/secondary - limit direct exposure
        disposition = 'direct_limited'
        directCount = Math.min(1, budgetPerAdditional)
        carryoverCount = Math.max(1, effectiveTrainingDays - directCount - 2)
        allowedIntensity = 'low'
        tissueConstraint = overlapsWithPrimary 
          ? `high overlap with primary (${primaryGoal})`
          : `high overlap with secondary (${secondaryGoal})`
        reasoning.push(`Direct exposure limited due to ${tissueConstraint}`)
        
      } else if (budgetPerAdditional >= 2) {
        // Enough budget - can get direct limited
        disposition = 'direct_limited'
        directCount = Math.min(2, budgetPerAdditional)
        carryoverCount = Math.max(1, effectiveTrainingDays - directCount - 1)
        allowedIntensity = 'moderate'
        reasoning.push('Additional skill receives direct limited exposure within budget')
        
      } else if (budgetPerAdditional >= 1) {
        // Minimal budget - technical exposure only
        disposition = 'direct_limited'
        directCount = 1
        carryoverCount = effectiveTrainingDays - 2
        allowedIntensity = 'low'
        reasoning.push('Additional skill receives minimal direct exposure due to budget constraints')
        
      } else {
        // No direct budget - carryover only
        disposition = 'carryover_only'
        directCount = 0
        carryoverCount = Math.max(1, Math.floor(effectiveTrainingDays / 2))
        allowedIntensity = 'none'
        reasoning.push('Additional skill deferred to carryover due to insufficient session budget')
      }
    }
    
    // =======================================================================
    // READINESS GATING (can override above decisions)
    // =======================================================================
    if (readiness) {
      // Readiness can LOWER intensity but not raise it
      if (readiness.progressionPermission === 'block' || readiness.adaptationReadiness === 'unready') {
        if (disposition === 'direct_priority') {
          disposition = 'direct_limited'
          allowedIntensity = 'moderate'
        } else if (disposition === 'direct_limited' && allowedIntensity === 'high') {
          allowedIntensity = 'moderate'
        }
        readinessConstraint = 'adaptation readiness insufficient for aggressive progression'
        reasoning.push(`Intensity capped to ${allowedIntensity} due to ${readinessConstraint}`)
      }
      
      // Method permission from readiness
      if (readiness.methodPermission === 'straight_sets_only') {
        allowedMethod = 'straight_only'
        reasoning.push('Method restricted to straight sets due to readiness')
      } else if (readiness.methodPermission === 'light_grouping_ok') {
        allowedMethod = 'simple_grouping_ok'
        reasoning.push('Method restricted to simple grouping due to readiness')
      }
    }
    
    // =======================================================================
    // RULE 2: SELECTED SKILLS CANNOT SILENTLY DISAPPEAR
    // Every skill must have explicit disposition with reasoning
    // =======================================================================
    if (disposition === 'carryover_only' && directCount === 0 && carryoverCount === 0) {
      carryoverCount = 1  // Minimum carryover visibility
      reasoning.push('Forced minimum carryover to prevent silent disappearance')
    }
    
    // Calculate overlap risk bucket
    const overlapCount = overlapMatrix.filter(o => 
      o.familyA === family || o.familyB === family
    ).filter(o => o.overlapSeverity === 'high').length
    
    const overlapRisk: OverlapRiskBucket = 
      overlapCount >= 2 ? 'high' :
      overlapCount === 1 ? 'moderate' : 'low'
    
    decisions.push({
      family,
      skill,
      selectedByUser: true,
      userPriorityTier: priorityTier,
      doctrineDisposition: disposition,
      directExposureTargetCount: directCount,
      carryoverExposureTargetCount: carryoverCount,
      allowedDirectIntensity: allowedIntensity,
      allowedMethodAggression: allowedMethod,
      overlapRiskBucket: overlapRisk,
      tissueConstraintReason: tissueConstraint,
      readinessConstraintReason: readinessConstraint,
      finalReasoning: reasoning,
    })
  }
  
  // ==========================================================================
  // STEP 4: BUILD METHOD PERMISSION CONTRACT
  // ==========================================================================
  let globalMethodPermission: AllowedMethodAggression = 'complex_grouping_ok'
  
  // If user didn't prefer supersets/circuits, use straight sets
  if (!methodPreferences.supersets && !methodPreferences.circuits) {
    globalMethodPermission = 'straight_only'
  } else if (methodPreferences.circuits) {
    globalMethodPermission = 'complex_grouping_ok'
  } else if (methodPreferences.supersets) {
    globalMethodPermission = 'simple_grouping_ok'
  }
  
  // If any primary skill has method restriction, downgrade global permission
  const primaryDecision = decisions.find(d => d.userPriorityTier === 'primary')
  if (primaryDecision?.allowedMethodAggression === 'straight_only') {
    globalMethodPermission = 'straight_only'
  } else if (primaryDecision?.allowedMethodAggression === 'simple_grouping_ok' && 
             globalMethodPermission === 'complex_grouping_ok') {
    globalMethodPermission = 'simple_grouping_ok'
  }
  
  // ==========================================================================
  // STEP 5: BACK LEVER SPECIFIC DISPOSITION (as per requirements)
  // ==========================================================================
  const backLeverDecision = decisions.find(d => 
    d.family === 'back_lever' || d.skill.toLowerCase().includes('back_lever')
  )
  
  let backLeverDisposition: WeeklyExpressionAllocationContract['backLeverDisposition'] = null
  
  if (backLeverDecision) {
    let expressionMode: 'direct_progression' | 'technical_exposure' | 'carryover_ownership' | 'explicit_deferment'
    
    if (backLeverDecision.doctrineDisposition === 'direct_priority') {
      expressionMode = 'direct_progression'
    } else if (backLeverDecision.doctrineDisposition === 'direct_limited' && 
               backLeverDecision.directExposureTargetCount >= 1) {
      expressionMode = 'direct_progression'
    } else if (backLeverDecision.doctrineDisposition === 'direct_limited') {
      expressionMode = 'technical_exposure'
    } else if (backLeverDecision.doctrineDisposition === 'carryover_only') {
      expressionMode = 'carryover_ownership'
    } else {
      expressionMode = 'explicit_deferment'
    }
    
    backLeverDisposition = {
      selected: true,
      finalDisposition: backLeverDecision.doctrineDisposition,
      directCount: backLeverDecision.directExposureTargetCount,
      carryoverCount: backLeverDecision.carryoverExposureTargetCount,
      deferReason: backLeverDecision.tissueConstraintReason || 
                   backLeverDecision.readinessConstraintReason ||
                   (expressionMode === 'explicit_deferment' ? 'insufficient_session_budget' : null),
      expressionMode,
    }
  }
  
  // ==========================================================================
  // STEP 6: BUILD AUDIT
  // ==========================================================================
  const skillsWithDirectPriority = decisions.filter(d => d.doctrineDisposition === 'direct_priority').length
  const skillsWithDirectLimited = decisions.filter(d => d.doctrineDisposition === 'direct_limited').length
  const skillsWithCarryoverOnly = decisions.filter(d => d.doctrineDisposition === 'carryover_only').length
  const skillsDeferred = decisions.filter(d => d.doctrineDisposition === 'temporary_defer').length
  
  const visibleExpressionCount = skillsWithDirectPriority + skillsWithDirectLimited
  
  // Check if primary skills dominate hard work
  const primarySkillsHardWork = decisions
    .filter(d => d.userPriorityTier === 'primary')
    .every(d => d.allowedDirectIntensity === 'high' || d.allowedDirectIntensity === 'moderate')
  
  // Check no silent disappearances
  const noSilentDisappearances = decisions.every(d => 
    d.finalReasoning.length > 0 && 
    (d.directExposureTargetCount > 0 || d.carryoverExposureTargetCount > 0)
  )
  
  // Check overlap-aware allocation
  const overlapAwareAllocation = highOverlapPairs.length === 0 || 
    highOverlapPairs.every(pair => {
      const skillA = decisions.find(d => d.family === pair[0])
      const skillB = decisions.find(d => d.family === pair[1])
      // Not both should have high intensity direct work
      return !(skillA?.allowedDirectIntensity === 'high' && skillB?.allowedDirectIntensity === 'high')
    })
  
  // Determine verdict
  let verdict: WeeklyExpressionAllocationContract['audit']['verdict'] = 'ALLOCATION_NARROW'
  if (visibleExpressionCount >= selectedSkills.length * 0.6 && noSilentDisappearances) {
    verdict = 'ALLOCATION_STRONG'
  } else if (visibleExpressionCount >= 2 && noSilentDisappearances) {
    verdict = 'ALLOCATION_ADEQUATE'
  }
  
  const contract: WeeklyExpressionAllocationContract = {
    contractVersion: '1.0.0',
    builtAt: new Date().toISOString(),
    totalSelectedSkills: selectedSkills.length,
    effectiveTrainingDays,
    decisions,
    overlapMatrix,
    highOverlapPairs,
    globalMethodPermission,
    perSessionMethodPermissions: new Map(),
    backLeverDisposition,
    audit: {
      skillsWithDirectPriority,
      skillsWithDirectLimited,
      skillsWithCarryoverOnly,
      skillsDeferred,
      visibleExpressionCount,
      primarySkillsDominateHardWork: primarySkillsHardWork,
      noSilentDisappearances,
      overlapAwareAllocation,
      methodDecisionsContractBased: true,
      verdict,
    },
  }
  
  // ==========================================================================
  // REQUIRED DEV LOGS
  // ==========================================================================
  
  // Log 1: [weekly-expression-audit]
  console.log('[weekly-expression-audit]', {
    totalSelectedSkills: selectedSkills.length,
    effectiveTrainingDays,
    perSkillDecisions: decisions.map(d => ({
      skill: d.skill,
      family: d.family,
      priorityTier: d.userPriorityTier,
      disposition: d.doctrineDisposition,
      directCount: d.directExposureTargetCount,
      carryoverCount: d.carryoverExposureTargetCount,
      intensity: d.allowedDirectIntensity,
      methodPermission: d.allowedMethodAggression,
      overlapRisk: d.overlapRiskBucket,
      reasoning: d.finalReasoning.join('; '),
    })),
    verdict: contract.audit.verdict,
  })
  
  // Log 2: [weekly-expression-overlap-audit]
  console.log('[weekly-expression-overlap-audit]', {
    highOverlapPairsCount: highOverlapPairs.length,
    highOverlapPairs: highOverlapPairs.map(p => `${p[0]} <-> ${p[1]}`),
    primaryFamiliesWonDirectPriority: decisions
      .filter(d => d.userPriorityTier === 'primary' && d.doctrineDisposition === 'direct_priority')
      .map(d => d.family),
    secondaryFamiliesLimited: decisions
      .filter(d => d.userPriorityTier === 'secondary')
      .map(d => ({ family: d.family, disposition: d.doctrineDisposition })),
    additionalFamiliesConstrained: decisions
      .filter(d => d.userPriorityTier === 'additional' && d.tissueConstraintReason)
      .map(d => ({ family: d.family, constraint: d.tissueConstraintReason })),
    overlapAwareAllocationActive: overlapAwareAllocation,
  })
  
  // Log 3: [weekly-expression-method-audit]
  console.log('[weekly-expression-method-audit]', {
    userMethodPreferences: methodPreferences,
    globalMethodPermission,
    perSkillMethodPermissions: decisions.map(d => ({
      skill: d.skill,
      allowedMethod: d.allowedMethodAggression,
      readinessConstrained: !!d.readinessConstraintReason,
    })),
    supersetsPermitted: globalMethodPermission !== 'straight_only',
    circuitsPermitted: globalMethodPermission === 'complex_grouping_ok',
    methodDecisionsBasis: 'contract_based',
  })
  
  // Log 4: [weekly-expression-back-lever-audit]
  if (backLeverDisposition) {
    console.log('[weekly-expression-back-lever-audit]', {
      selected: backLeverDisposition.selected,
      finalDisposition: backLeverDisposition.finalDisposition,
      directCount: backLeverDisposition.directCount,
      carryoverCount: backLeverDisposition.carryoverCount,
      deferReason: backLeverDisposition.deferReason,
      expressionMode: backLeverDisposition.expressionMode,
      visiblyExpressed: backLeverDisposition.directCount > 0 || 
                         backLeverDisposition.expressionMode !== 'explicit_deferment',
    })
  } else {
    console.log('[weekly-expression-back-lever-audit]', {
      selected: false,
      reason: 'back_lever not in selected skills',
    })
  }
  
  // Log 5: [weekly-expression-final-verdict]
  console.log('[weekly-expression-final-verdict]', {
    totalSelectedSkills: selectedSkills.length,
    skillsWithDirectExpression: visibleExpressionCount,
    skillsCarryoverOnly: skillsWithCarryoverOnly,
    skillsDeferred: skillsDeferred,
    primarySkillsDominate: primarySkillsHardWork,
    noSilentDisappearances,
    overlapAwareAllocation,
    methodDecisionsContractBased: true,
    backLeverHandled: !!backLeverDisposition,
    verdict: contract.audit.verdict,
    passesAllocationRequirements: noSilentDisappearances && 
      visibleExpressionCount >= 2 &&
      overlapAwareAllocation,
  })
  
  return contract
}

/**
 * Get disposition for a specific skill from the contract
 */
export function getSkillDisposition(
  contract: WeeklyExpressionAllocationContract,
  skill: string
): WeeklySkillExpressionDecision | null {
  return contract.decisions.find(d => d.skill === skill) || null
}

/**
 * Check if a skill should receive direct progression based on contract
 */
export function shouldReceiveDirectProgression(
  contract: WeeklyExpressionAllocationContract,
  skill: string
): boolean {
  const decision = getSkillDisposition(contract, skill)
  if (!decision) return false
  
  return decision.doctrineDisposition === 'direct_priority' ||
         (decision.doctrineDisposition === 'direct_limited' && decision.directExposureTargetCount >= 1)
}

/**
 * Check if grouped methods are allowed for a skill
 */
export function areGroupedMethodsAllowed(
  contract: WeeklyExpressionAllocationContract,
  skill: string
): { supersetsOk: boolean; circuitsOk: boolean; reason: string } {
  const decision = getSkillDisposition(contract, skill)
  const globalPermission = contract.globalMethodPermission
  
  if (!decision) {
    return { 
      supersetsOk: globalPermission !== 'straight_only',
      circuitsOk: globalPermission === 'complex_grouping_ok',
      reason: 'skill_not_in_contract',
    }
  }
  
  // Use the more restrictive of global vs skill permission
  const effectivePermission = decision.allowedMethodAggression === 'straight_only' 
    ? 'straight_only'
    : (decision.allowedMethodAggression === 'simple_grouping_ok' || globalPermission === 'simple_grouping_ok')
      ? 'simple_grouping_ok'
      : globalPermission
  
  return {
    supersetsOk: effectivePermission !== 'straight_only',
    circuitsOk: effectivePermission === 'complex_grouping_ok',
    reason: decision.readinessConstraintReason || 
            decision.tissueConstraintReason || 
            'contract_based_permission',
  }
}
