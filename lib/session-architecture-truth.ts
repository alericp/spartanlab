/**
 * SESSION ARCHITECTURE TRUTH CONTRACT
 * 
 * =============================================================================
 * AUTHORITATIVE CONTRACT FOR GENERATION ENFORCEMENT, NOT JUST EXPLANATION
 * =============================================================================
 * 
 * This contract is built ONCE per generation and MUST be consumed by:
 * - Weekly session allocation
 * - Session role assignment
 * - Support skill rotation placement
 * - Exercise selection filtering
 * - Method packaging decisions
 * 
 * This is GENERATION-FIRST, not UI-first.
 */

import type { DoctrineRuntimeContract } from './doctrine-runtime-contract'
import type { MaterialityContract } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface CurrentWorkingSkillCap {
  skill: string
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  isConservative: boolean
  allowedProgressionFamilies: string[]
  blockedProgressionFamilies: string[]
  truthSource: string
}

export interface DeferredSkillEntry {
  skill: string
  reason: 'schedule_limit' | 'joint_caution' | 'progression_safety' | 'skill_quality_protection' | 'time_constraint' | 'priority_allocation'
  details: string
}

export interface DoctrineArchitectureBias {
  sessionRoleBias: 'primary_dominant' | 'balanced_multi_skill' | 'support_enriched'
  supportAllocationBias: 'minimal' | 'moderate' | 'generous'
  methodPackagingBias: 'straight_sets_protected' | 'method_variety_allowed' | 'density_friendly'
  exerciseComplexityBias: 'conservative' | 'moderate' | 'aggressive'
  rationale: string[]
}

export interface WeeklyMinimums {
  minPrimaryTouches: number
  minSecondaryTouches: number
  minSupportTouches: number
  minDistinctSessionRoles: number
}

export interface StructuralGuards {
  maxGenericFallbacksPerWeek: number
  forbidHistoricalCeilingProgressions: boolean
  requireSupportSkillRotationWhenSelected: boolean
  requireVisibleDifferenceFromPrimaryOnlyTemplate: boolean
}

export interface ExplanationHooks {
  reasonsForReducedSkills: string[]
  reasonsForAddedSupport: string[]
  reasonsForConservativeProgression: string[]
  reasonsForMethodSelection: string[]
}

export interface SessionArchitectureTruthContract {
  // Contract metadata
  contractVersion: string
  builtAt: string
  builtFromTruth: boolean
  sourceVerdict: 'FULL_TRUTH_AVAILABLE' | 'PARTIAL_TRUTH_AVAILABLE' | 'MINIMAL_TRUTH_FALLBACK'
  
  // Skill classification for generation
  primarySpineSkills: string[]
  secondaryAnchorSkills: string[]
  supportRotationSkills: string[]
  deferredSkills: DeferredSkillEntry[]
  
  // Progression enforcement
  currentWorkingSkillCaps: Record<string, CurrentWorkingSkillCap>
  historicalCeilingPresent: Record<string, boolean>
  
  // Doctrine-driven architecture bias
  doctrineArchitectureBias: DoctrineArchitectureBias
  
  // Weekly minimums for materiality enforcement
  weeklyMinimums: WeeklyMinimums
  
  // Structural guards for anti-collapse
  structuralGuards: StructuralGuards
  
  // Explanation hooks for UI
  explanationHooks: ExplanationHooks
  
  // ==========================================================================
  // [PHASE 1 AI-TRUTH-ESCALATION] NEW FIELDS FOR BROADER TRUTH EXPRESSION
  // ==========================================================================
  
  // Flexibility integration - determines where flexibility work lives
  flexibilityIntegration: {
    hasFlexibilityGoals: boolean
    selectedFlexibility: string[]
    integrationMode: 'dedicated_block' | 'warmup_integrated' | 'cooldown_integrated' | 'none'
    affectedSessions: number[]  // Which session indices should include flexibility
    flexibilityTimeReserved: number  // Minutes reserved for flexibility per session
  }
  
  // Method packaging - determines session structure beyond just labels
  methodPackaging: {
    preferredMethods: string[]
    actualMethodsApplied: string[]
    methodsLimitedBySkillQuality: string[]
    packagingDecision: 'straight_sets' | 'supersets_allowed' | 'circuits_allowed' | 'density_allowed'
    rationale: string
  }
  
  // Visible difference enforcement - prevents generic templates
  visibleDifferenceTargets: {
    templateEscapeRequired: boolean
    minDistinctSessionRoles: number
    minNonPrimarySkillExpression: number
    requiredMethodVariety: boolean
    requiredFlexibilityIntegration: boolean
    differenceFromBaselineScore: number  // 0-100, higher = more personalized
  }
  
  // Generation context
  generationContext: {
    effectiveTrainingDays: number
    scheduleMode: string
    complexity: 'low' | 'moderate' | 'high'
    experienceLevel: string
    primaryGoal: string
    secondaryGoal: string | null
  }
  
  // Audit trail
  audit: {
    totalSelectedSkills: number
    representedSkillCount: number
    supportSkillCount: number
    deferredSkillCount: number
    currentWorkingCapCount: number
    historicalCeilingBlockedCount: number
    doctrineInfluenceLevel: 'none' | 'minimal' | 'moderate' | 'strong'
    // [PHASE 1 AI-TRUTH-ESCALATION] Additional audit fields
    flexibilityIntegrated: boolean
    methodsAppliedCount: number
    visibleDifferenceScore: number
  }
}

// =============================================================================
// BUILDER
// =============================================================================

export interface SessionArchitectureTruthInput {
  materialityContract: MaterialityContract | null
  doctrineRuntimeContract: DoctrineRuntimeContract | null
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
    truthSource: string
    isConservative: boolean
  }> | null
  trainingMethodPreferences: Array<{ id: string; name: string }> | null
  sessionStylePreference: string | null
  scheduleMode: string
  effectiveTrainingDays: number
  primaryGoal: string
  secondaryGoal: string | null
  selectedSkills: string[]
  selectedFlexibility: string[]
  experienceLevel: string
  jointCautions: string[]
  multiSkillAllocation: {
    representedSkills: string[]
    supportExpressedSkills: string[]
    supportRotationalSkills: string[]
    deferredSkills: Array<{ skill: string; reason: string }>
  } | null
}

/**
 * Builds the authoritative session architecture truth contract.
 * This MUST be called ONCE per generation, AFTER materiality and doctrine contracts.
 */
export function buildSessionArchitectureTruthContract(
  input: SessionArchitectureTruthInput
): SessionArchitectureTruthContract {
  // ==========================================================================
  // [POST_ALLOCATION_SESSION_ARCHITECTURE_VALIDATION] Input validation gate
  // ==========================================================================
  // Validate required inputs exist before proceeding to prevent downstream crashes
  // ==========================================================================
  
  if (!input) {
    throw new Error('[SESSION_ARCHITECTURE_TRUTH_VALIDATION_FAIL] Input is null/undefined')
  }
  
  if (!input.primaryGoal) {
    console.warn('[SESSION_ARCHITECTURE_TRUTH_VALIDATION_WARN]', {
      issue: 'primaryGoal_missing',
      fallback: 'empty_string',
    })
  }
  
  if (!Array.isArray(input.selectedSkills)) {
    console.warn('[SESSION_ARCHITECTURE_TRUTH_VALIDATION_WARN]', {
      issue: 'selectedSkills_not_array',
      type: typeof input.selectedSkills,
      fallback: 'empty_array',
    })
  }
  
  const {
    materialityContract,
    doctrineRuntimeContract,
    currentWorkingProgressions,
    trainingMethodPreferences,
    sessionStylePreference,
    scheduleMode,
    effectiveTrainingDays,
    primaryGoal,
    secondaryGoal,
    selectedSkills,
    experienceLevel,
    jointCautions,
    multiSkillAllocation,
  } = input
  
  // Normalize inputs to prevent downstream crashes
  const safeSelectedSkills = Array.isArray(selectedSkills) ? selectedSkills : []
  const safePrimaryGoal = primaryGoal || ''
  const safeExperienceLevel = experienceLevel || 'intermediate'
  const safeEffectiveTrainingDays = effectiveTrainingDays || 3
  const safeScheduleMode = scheduleMode || 'standard'
  
  const builtAt = new Date().toISOString()
  
  // ==========================================================================
  // STEP 1: Determine complexity level
  // ==========================================================================
  const complexity = determineComplexity(safeSelectedSkills, safeEffectiveTrainingDays, safeExperienceLevel)
  
  // ==========================================================================
  // STEP 2: Build skill classification from multi-skill allocation
  // ==========================================================================
  const primarySpineSkills: string[] = []
  const secondaryAnchorSkills: string[] = []
  const supportRotationSkills: string[] = []
  const deferredSkills: DeferredSkillEntry[] = []
  
  if (multiSkillAllocation) {
    // Primary = represented skills (primary + secondary anchors)
    primarySpineSkills.push(...multiSkillAllocation.representedSkills.filter(s => 
      s.toLowerCase().includes(safePrimaryGoal.toLowerCase())
    ))
    
    // Secondary = remaining represented skills
    secondaryAnchorSkills.push(...multiSkillAllocation.representedSkills.filter(s => 
      !primarySpineSkills.includes(s)
    ))
    
    // Support = support expressed + rotational
    supportRotationSkills.push(
      ...multiSkillAllocation.supportExpressedSkills,
      ...multiSkillAllocation.supportRotationalSkills
    )
    
    // Deferred = explicitly deferred
    for (const d of multiSkillAllocation.deferredSkills) {
      deferredSkills.push({
        skill: d.skill,
        reason: mapReasonToEnum(d.reason),
        details: d.reason,
      })
    }
  } else {
    // Fallback: use primary/secondary from goals
    if (safePrimaryGoal) primarySpineSkills.push(safePrimaryGoal)
    if (secondaryGoal) secondaryAnchorSkills.push(secondaryGoal)
  }
  
  // ==========================================================================
  // STEP 3: Build current working skill caps (PROGRESSION ENFORCEMENT)
  // ==========================================================================
  const currentWorkingSkillCaps: Record<string, CurrentWorkingSkillCap> = {}
  const historicalCeilingPresent: Record<string, boolean> = {}
  let historicalCeilingBlockedCount = 0
  
  if (currentWorkingProgressions) {
    for (const [skill, data] of Object.entries(currentWorkingProgressions)) {
      const hasHistoricalCeiling = !!data.historicalCeiling && 
        data.historicalCeiling !== data.currentWorkingProgression
      
      historicalCeilingPresent[skill] = hasHistoricalCeiling
      if (hasHistoricalCeiling) historicalCeilingBlockedCount++
      
      // Build allowed/blocked progression families
      const allowedFamilies = buildAllowedProgressionFamilies(
        skill,
        data.currentWorkingProgression,
        data.historicalCeiling,
        data.isConservative
      )
      
      currentWorkingSkillCaps[skill] = {
        skill,
        currentWorkingProgression: data.currentWorkingProgression,
        historicalCeiling: data.historicalCeiling,
        isConservative: data.isConservative,
        allowedProgressionFamilies: allowedFamilies.allowed,
        blockedProgressionFamilies: allowedFamilies.blocked,
        truthSource: data.truthSource,
      }
    }
  }
  
  // ==========================================================================
  // STEP 4: Build doctrine architecture bias
  // ==========================================================================
  const doctrineArchitectureBias = buildDoctrineArchitectureBias(
    doctrineRuntimeContract,
    trainingMethodPreferences,
    sessionStylePreference,
    complexity,
    effectiveTrainingDays
  )
  
  // ==========================================================================
  // STEP 5: Calculate weekly minimums based on complexity
  // ==========================================================================
  const weeklyMinimums = calculateWeeklyMinimums(
    effectiveTrainingDays,
    complexity,
    primarySpineSkills.length,
    secondaryAnchorSkills.length,
    supportRotationSkills.length
  )
  
  // ==========================================================================
  // STEP 6: Build structural guards
  // ==========================================================================
  const structuralGuards: StructuralGuards = {
    maxGenericFallbacksPerWeek: complexity === 'high' ? 1 : complexity === 'moderate' ? 2 : 3,
    forbidHistoricalCeilingProgressions: true, // ALWAYS TRUE - key safety feature
    requireSupportSkillRotationWhenSelected: supportRotationSkills.length > 0,
    requireVisibleDifferenceFromPrimaryOnlyTemplate: 
      safeSelectedSkills.length > 2 && safeEffectiveTrainingDays >= 5 && complexity !== 'low',
  }
  
  // ==========================================================================
  // STEP 7: Build explanation hooks
  // ==========================================================================
  const explanationHooks = buildExplanationHooks(
    deferredSkills,
    supportRotationSkills,
    currentWorkingSkillCaps,
    doctrineArchitectureBias,
    jointCautions
  )
  
  // ==========================================================================
  // STEP 8: Determine source verdict
  // ==========================================================================
  const hasFullTruth = !!materialityContract && !!currentWorkingProgressions && 
    Object.keys(currentWorkingProgressions).length > 0
  const hasPartialTruth = !!materialityContract || !!multiSkillAllocation
  const sourceVerdict: SessionArchitectureTruthContract['sourceVerdict'] = 
    hasFullTruth ? 'FULL_TRUTH_AVAILABLE' :
    hasPartialTruth ? 'PARTIAL_TRUTH_AVAILABLE' : 
    'MINIMAL_TRUTH_FALLBACK'
  
  // ==========================================================================
  // [PHASE 1 AI-TRUTH-ESCALATION] STEP 9: Build flexibility integration
  // ==========================================================================
  const hasFlexibilityGoals = (input.selectedFlexibility?.length || 0) > 0
  const flexibilityIntegration: SessionArchitectureTruthContract['flexibilityIntegration'] = {
    hasFlexibilityGoals,
    selectedFlexibility: input.selectedFlexibility || [],
    integrationMode: hasFlexibilityGoals 
      ? (effectiveTrainingDays >= 5 ? 'dedicated_block' : 'cooldown_integrated')
      : 'none',
    affectedSessions: hasFlexibilityGoals 
      ? Array.from({ length: Math.min(3, effectiveTrainingDays) }, (_, i) => i)
      : [],
    flexibilityTimeReserved: hasFlexibilityGoals ? (effectiveTrainingDays >= 5 ? 10 : 5) : 0,
  }
  
  // ==========================================================================
  // [PHASE 1 AI-TRUTH-ESCALATION] STEP 10: Build method packaging decision
  // ==========================================================================
  const preferredMethods = trainingMethodPreferences?.map(p => p.name || p.id) || ['straight_sets']
  const methodsLimitedBySkillQuality = preferredMethods.filter(m => 
    m === 'circuits' || m === 'density_blocks'
  )
  
  // Determine actual applicable methods based on skill quality protection
  const primaryIsAdvancedSkill = ['planche', 'front_lever', 'back_lever', 'iron_cross', 'maltese', 'victorian']
    .some(s => primaryGoal?.toLowerCase().includes(s))
  
  const actualMethodsApplied = primaryIsAdvancedSkill
    ? preferredMethods.filter(m => m !== 'circuits') // Protect skill quality
    : preferredMethods
  
  const methodPackaging: SessionArchitectureTruthContract['methodPackaging'] = {
    preferredMethods,
    actualMethodsApplied,
    methodsLimitedBySkillQuality: primaryIsAdvancedSkill ? methodsLimitedBySkillQuality : [],
    packagingDecision: actualMethodsApplied.includes('density_blocks') ? 'density_allowed'
      : actualMethodsApplied.includes('circuits') ? 'circuits_allowed'
      : actualMethodsApplied.includes('supersets') ? 'supersets_allowed'
      : 'straight_sets',
    rationale: primaryIsAdvancedSkill 
      ? 'Skill quality protection limits high-fatigue methods for advanced skills'
      : preferredMethods.length > 1 
        ? `User-selected methods applied: ${actualMethodsApplied.join(', ')}`
        : 'Default straight sets',
  }
  
  // ==========================================================================
  // [PHASE 1 AI-TRUTH-ESCALATION] STEP 11: Build visible difference targets
  // ==========================================================================
  const baselineDifferenceScore = 0
  let differenceScore = baselineDifferenceScore
  
  // Score increases based on personalization factors
  if (supportRotationSkills.length >= 1) differenceScore += 15
  if (supportRotationSkills.length >= 2) differenceScore += 10
  if (hasFlexibilityGoals) differenceScore += 15
  if (actualMethodsApplied.length > 1) differenceScore += 10
  if (Object.keys(currentWorkingSkillCaps).length > 0) differenceScore += 15
  if (doctrineArchitectureBias.sessionRoleBias !== 'primary_dominant') differenceScore += 10
  if (secondaryAnchorSkills.length >= 1) differenceScore += 10
  if (complexity === 'high') differenceScore += 15
  
  const visibleDifferenceTargets: SessionArchitectureTruthContract['visibleDifferenceTargets'] = {
    templateEscapeRequired: structuralGuards.requireVisibleDifferenceFromPrimaryOnlyTemplate,
    minDistinctSessionRoles: complexity === 'high' ? 3 : complexity === 'moderate' ? 2 : 1,
    minNonPrimarySkillExpression: Math.min(supportRotationSkills.length + secondaryAnchorSkills.length, 3),
    requiredMethodVariety: actualMethodsApplied.length > 1,
    requiredFlexibilityIntegration: hasFlexibilityGoals,
    differenceFromBaselineScore: Math.min(100, differenceScore),
  }
  
  // ==========================================================================
  // BUILD FINAL CONTRACT
  // ==========================================================================
  const contract: SessionArchitectureTruthContract = {
    contractVersion: '1.0.0',
    builtAt,
    builtFromTruth: hasFullTruth || hasPartialTruth,
    sourceVerdict,
    
    primarySpineSkills,
    secondaryAnchorSkills,
    supportRotationSkills,
    deferredSkills,
    
    currentWorkingSkillCaps,
    historicalCeilingPresent,
    
    doctrineArchitectureBias,
    weeklyMinimums,
    structuralGuards,
    explanationHooks,
    
    // [PHASE 1 AI-TRUTH-ESCALATION] New fields
    flexibilityIntegration,
    methodPackaging,
    visibleDifferenceTargets,
    
    generationContext: {
      effectiveTrainingDays: safeEffectiveTrainingDays,
      scheduleMode: safeScheduleMode,
      complexity,
      experienceLevel: safeExperienceLevel,
      primaryGoal: safePrimaryGoal,
      secondaryGoal,
    },
    
    audit: {
      totalSelectedSkills: safeSelectedSkills.length,
      representedSkillCount: primarySpineSkills.length + secondaryAnchorSkills.length,
      supportSkillCount: supportRotationSkills.length,
      deferredSkillCount: deferredSkills.length,
      currentWorkingCapCount: Object.keys(currentWorkingSkillCaps).length,
      historicalCeilingBlockedCount,
      doctrineInfluenceLevel: doctrineRuntimeContract?.explanationDoctrine?.doctrineInfluenceLevel || 'none',
      // [PHASE 1 AI-TRUTH-ESCALATION] Additional audit fields
      flexibilityIntegrated: hasFlexibilityGoals,
      methodsAppliedCount: actualMethodsApplied.length,
      visibleDifferenceScore: differenceScore,
    },
  }
  
  console.log('[SESSION-ARCHITECTURE-TRUTH-CONTRACT-BUILT]', {
    contractVersion: contract.contractVersion,
    sourceVerdict: contract.sourceVerdict,
    complexity: contract.generationContext.complexity,
    primarySpineCount: primarySpineSkills.length,
    secondaryAnchorCount: secondaryAnchorSkills.length,
    supportRotationCount: supportRotationSkills.length,
    deferredCount: deferredSkills.length,
    currentWorkingCapCount: Object.keys(currentWorkingSkillCaps).length,
    historicalCeilingBlockedCount,
    forbidHistoricalCeiling: structuralGuards.forbidHistoricalCeilingProgressions,
    requireVisibleDifference: structuralGuards.requireVisibleDifferenceFromPrimaryOnlyTemplate,
    weeklyMinimums,
    doctrineArchitectureBias: doctrineArchitectureBias.sessionRoleBias,
    // [PHASE 1 AI-TRUTH-ESCALATION] Additional audit fields
    flexibilityIntegration: {
      hasGoals: flexibilityIntegration.hasFlexibilityGoals,
      mode: flexibilityIntegration.integrationMode,
      timeReserved: flexibilityIntegration.flexibilityTimeReserved,
    },
    methodPackaging: {
      preferred: preferredMethods,
      applied: actualMethodsApplied,
      decision: methodPackaging.packagingDecision,
    },
    visibleDifferenceScore: differenceScore,
    templateEscapeRequired: visibleDifferenceTargets.templateEscapeRequired,
    verdict: 'SESSION_ARCHITECTURE_TRUTH_READY',
  })
  
  return contract
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function determineComplexity(
  selectedSkills: string[],
  effectiveTrainingDays: number,
  experienceLevel: string
): 'low' | 'moderate' | 'high' {
  const skillCount = selectedSkills.length
  const isAdvanced = experienceLevel.toLowerCase().includes('advanced')
  const isIntermediate = experienceLevel.toLowerCase().includes('intermediate')
  
  if (skillCount > 3 && effectiveTrainingDays >= 5 && (isAdvanced || isIntermediate)) {
    return 'high'
  }
  if (skillCount >= 2 && effectiveTrainingDays >= 4) {
    return 'moderate'
  }
  return 'low'
}

function mapReasonToEnum(reason: string): DeferredSkillEntry['reason'] {
  const lower = reason.toLowerCase()
  if (lower.includes('schedule') || lower.includes('time')) return 'schedule_limit'
  if (lower.includes('joint') || lower.includes('caution')) return 'joint_caution'
  if (lower.includes('progression') || lower.includes('safety')) return 'progression_safety'
  if (lower.includes('quality')) return 'skill_quality_protection'
  if (lower.includes('priority')) return 'priority_allocation'
  return 'time_constraint'
}

function buildAllowedProgressionFamilies(
  skill: string,
  currentWorking: string | null,
  historicalCeiling: string | null,
  isConservative: boolean
): { allowed: string[]; blocked: string[] } {
  const allowed: string[] = []
  const blocked: string[] = []
  
  // [EXERCISE-SELECTION-HARDENING] Safe string operation
  const skillLower = (skill ?? '').toLowerCase()
  
  // Define progression hierarchy for common skills
  const progressionHierarchies: Record<string, string[]> = {
    planche: ['tuck_planche', 'adv_tuck_planche', 'straddle_planche', 'full_planche'],
    front_lever: ['tuck_front_lever', 'adv_tuck_front_lever', 'straddle_front_lever', 'full_front_lever'],
    back_lever: ['tuck_back_lever', 'adv_tuck_back_lever', 'straddle_back_lever', 'full_back_lever'],
    handstand: ['wall_handstand', 'chest_to_wall', 'freestanding_handstand', 'one_arm_handstand'],
    muscle_up: ['negative_muscle_up', 'kipping_muscle_up', 'strict_muscle_up', 'weighted_muscle_up'],
    hspu: ['pike_pushup', 'wall_hspu', 'freestanding_hspu', 'deficit_hspu'],
  }
  
  // Find relevant hierarchy
  let hierarchy: string[] | null = null
  for (const [key, levels] of Object.entries(progressionHierarchies)) {
    if (skillLower.includes(key)) {
      hierarchy = levels
      break
    }
  }
  
  if (!hierarchy) {
    // No hierarchy found - allow current working only
    if (currentWorking) allowed.push(currentWorking)
    return { allowed, blocked }
  }
  
  // Find current working index in hierarchy
  let currentIndex = -1
  if (currentWorking) {
    const cwLower = currentWorking.toLowerCase().replace(/[\s_-]/g, '')
    currentIndex = hierarchy.findIndex(p => 
      p.toLowerCase().replace(/[\s_-]/g, '').includes(cwLower) ||
      cwLower.includes(p.toLowerCase().replace(/[\s_-]/g, ''))
    )
  }
  
  // Find historical ceiling index
  let ceilingIndex = -1
  if (historicalCeiling) {
    const hcLower = historicalCeiling.toLowerCase().replace(/[\s_-]/g, '')
    ceilingIndex = hierarchy.findIndex(p => 
      p.toLowerCase().replace(/[\s_-]/g, '').includes(hcLower) ||
      hcLower.includes(p.toLowerCase().replace(/[\s_-]/g, ''))
    )
  }
  
  // CRITICAL: Block historical ceiling progressions if above current working
  if (currentIndex >= 0) {
    // Allow current working and below
    for (let i = 0; i <= currentIndex; i++) {
      allowed.push(hierarchy[i])
    }
    
    // If conservative, also allow one step above for aspiration work only
    if (!isConservative && currentIndex < hierarchy.length - 1) {
      allowed.push(hierarchy[currentIndex + 1])
    }
    
    // Block everything above current working (including historical ceiling)
    for (let i = currentIndex + (isConservative ? 1 : 2); i < hierarchy.length; i++) {
      blocked.push(hierarchy[i])
    }
  } else if (ceilingIndex >= 0) {
    // No current working but have ceiling - be conservative
    // Allow only beginner progressions
    allowed.push(hierarchy[0])
    if (hierarchy.length > 1) allowed.push(hierarchy[1])
    // Block ceiling and above
    for (let i = ceilingIndex; i < hierarchy.length; i++) {
      blocked.push(hierarchy[i])
    }
  }
  
  return { allowed, blocked }
}

function buildDoctrineArchitectureBias(
  doctrineContract: DoctrineRuntimeContract | null,
  methodPreferences: Array<{ id: string; name: string }> | null,
  sessionStyle: string | null,
  complexity: 'low' | 'moderate' | 'high',
  trainingDays: number
): DoctrineArchitectureBias {
  const rationale: string[] = []
  
  // Default bias
  let sessionRoleBias: DoctrineArchitectureBias['sessionRoleBias'] = 'primary_dominant'
  let supportAllocationBias: DoctrineArchitectureBias['supportAllocationBias'] = 'moderate'
  let methodPackagingBias: DoctrineArchitectureBias['methodPackagingBias'] = 'straight_sets_protected'
  let exerciseComplexityBias: DoctrineArchitectureBias['exerciseComplexityBias'] = 'moderate'
  
  // Apply doctrine influence
  if (doctrineContract?.available) {
    // Session role bias based on skill doctrine
    if (doctrineContract.skillDoctrine.supportSkills.length > 2) {
      sessionRoleBias = 'support_enriched'
      rationale.push('Doctrine indicates multiple support skills should be expressed')
    } else if (doctrineContract.skillDoctrine.representedSkills.length > 2) {
      sessionRoleBias = 'balanced_multi_skill'
      rationale.push('Doctrine indicates balanced multi-skill representation')
    }
    
    // Method packaging bias based on method doctrine
    if (doctrineContract.methodDoctrine.densityAllowed) {
      methodPackagingBias = 'density_friendly'
      rationale.push('Doctrine permits density-based methods')
    } else if (doctrineContract.methodDoctrine.circuitsAllowed) {
      methodPackagingBias = 'method_variety_allowed'
      rationale.push('Doctrine permits circuit-based methods')
    }
    
    // Exercise complexity bias based on prescription doctrine
    if (doctrineContract.prescriptionDoctrine.intensityBias === 'conservative') {
      exerciseComplexityBias = 'conservative'
      rationale.push('Doctrine recommends conservative exercise complexity')
    } else if (doctrineContract.prescriptionDoctrine.intensityBias === 'aggressive') {
      exerciseComplexityBias = 'aggressive'
      rationale.push('Doctrine permits aggressive exercise complexity')
    }
  }
  
  // Apply method preferences influence
  if (methodPreferences && methodPreferences.length > 0) {
    const methodNames = methodPreferences.map(m => m.name.toLowerCase())
    
    if (methodNames.some(m => m.includes('superset') || m.includes('circuit') || m.includes('density'))) {
      if (methodPackagingBias === 'straight_sets_protected') {
        methodPackagingBias = 'method_variety_allowed'
        rationale.push('User method preferences allow paired/circuit work')
      }
    }
  }
  
  // Adjust support allocation based on complexity and training days
  if (complexity === 'high' && trainingDays >= 5) {
    supportAllocationBias = 'generous'
    rationale.push('High complexity + sufficient training days allows generous support allocation')
  } else if (complexity === 'low' || trainingDays <= 3) {
    supportAllocationBias = 'minimal'
    rationale.push('Limited schedule favors minimal support allocation')
  }
  
  return {
    sessionRoleBias,
    supportAllocationBias,
    methodPackagingBias,
    exerciseComplexityBias,
    rationale,
  }
}

function calculateWeeklyMinimums(
  trainingDays: number,
  complexity: 'low' | 'moderate' | 'high',
  primaryCount: number,
  secondaryCount: number,
  supportCount: number
): WeeklyMinimums {
  // Base minimums scale with training days
  const minPrimaryTouches = Math.max(2, Math.floor(trainingDays * 0.5))
  const minSecondaryTouches = secondaryCount > 0 ? Math.max(1, Math.floor(trainingDays * 0.3)) : 0
  
  // Support touches based on complexity and support count
  let minSupportTouches = 0
  if (supportCount > 0) {
    if (complexity === 'high') {
      minSupportTouches = Math.max(2, Math.min(supportCount, Math.floor(trainingDays * 0.3)))
    } else if (complexity === 'moderate') {
      minSupportTouches = Math.max(1, Math.min(supportCount, Math.floor(trainingDays * 0.2)))
    }
  }
  
  // Distinct session roles based on training days and complexity
  let minDistinctSessionRoles = 2 // At minimum: skill day + mixed/strength day
  if (trainingDays >= 5 && complexity !== 'low') {
    minDistinctSessionRoles = 3
  }
  if (trainingDays >= 6 && complexity === 'high') {
    minDistinctSessionRoles = 4
  }
  
  return {
    minPrimaryTouches,
    minSecondaryTouches,
    minSupportTouches,
    minDistinctSessionRoles,
  }
}

function buildExplanationHooks(
  deferredSkills: DeferredSkillEntry[],
  supportSkills: string[],
  currentWorkingCaps: Record<string, CurrentWorkingSkillCap>,
  doctrineArchitectureBias: DoctrineArchitectureBias,
  jointCautions: string[]
): ExplanationHooks {
  const reasonsForReducedSkills: string[] = []
  const reasonsForAddedSupport: string[] = []
  const reasonsForConservativeProgression: string[] = []
  const reasonsForMethodSelection: string[] = []
  
  // Deferred skill reasons
  for (const d of deferredSkills) {
    reasonsForReducedSkills.push(`${d.skill}: ${d.details}`)
  }
  
  // Support skill reasons
  if (supportSkills.length > 0) {
    if (doctrineArchitectureBias.supportAllocationBias === 'generous') {
      reasonsForAddedSupport.push('Your schedule and complexity level support additional skill exposure')
    }
    if (doctrineArchitectureBias.sessionRoleBias === 'support_enriched') {
      reasonsForAddedSupport.push('Training doctrine recommends support skill rotation')
    }
  }
  
  // Conservative progression reasons
  for (const cap of Object.values(currentWorkingCaps)) {
    if (cap.isConservative && cap.historicalCeiling && cap.currentWorkingProgression !== cap.historicalCeiling) {
      reasonsForConservativeProgression.push(
        `${cap.skill}: Building from ${cap.currentWorkingProgression} (past: ${cap.historicalCeiling})`
      )
    }
  }
  
  // Joint caution influence
  if (jointCautions.length > 0) {
    reasonsForConservativeProgression.push(`Joint considerations: ${jointCautions.join(', ')}`)
  }
  
  // Method selection reasons
  reasonsForMethodSelection.push(...doctrineArchitectureBias.rationale)
  
  return {
    reasonsForReducedSkills,
    reasonsForAddedSupport,
    reasonsForConservativeProgression,
    reasonsForMethodSelection,
  }
}

// =============================================================================
// ENFORCEMENT HELPERS (for use in generation)
// =============================================================================

/**
 * Filters exercise candidates by current working progression caps.
 * MUST be used BEFORE doctrine scoring to enforce historical ceiling blocking.
 */
export function filterByCaptedProgression(
  candidates: Array<{ id: string; name: string; difficulty?: string; transferTo?: string[] }>,
  skillCaps: Record<string, CurrentWorkingSkillCap>,
  targetSkill: string
): {
  allowed: typeof candidates
  blocked: typeof candidates
  verdict: 'FILTERED_BY_CURRENT_WORKING' | 'NO_CAP_FOUND' | 'ALL_BLOCKED'
  reason: string
} {
  const cap = findCapForSkill(skillCaps, targetSkill)
  
  if (!cap) {
    return {
      allowed: candidates,
      blocked: [],
      verdict: 'NO_CAP_FOUND',
      reason: `No current working cap found for ${targetSkill}`,
    }
  }
  
  const allowed: typeof candidates = []
  const blocked: typeof candidates = []
  
  for (const candidate of candidates) {
    const candidateName = candidate.id.toLowerCase() + ' ' + candidate.name.toLowerCase()
    
    // Check if candidate matches any blocked progression
    const isBlocked = cap.blockedProgressionFamilies.some(blockedProg => {
      const blockedLower = blockedProg.toLowerCase().replace(/[\s_-]/g, '')
      return candidateName.replace(/[\s_-]/g, '').includes(blockedLower)
    })
    
    if (isBlocked) {
      blocked.push(candidate)
    } else {
      allowed.push(candidate)
    }
  }
  
  if (allowed.length === 0 && blocked.length > 0) {
    return {
      allowed: candidates.slice(0, 1), // Fallback: allow at least one
      blocked: blocked.slice(1),
      verdict: 'ALL_BLOCKED',
      reason: `All candidates blocked by current working cap - allowing safest option`,
    }
  }
  
  return {
    allowed,
    blocked,
    verdict: 'FILTERED_BY_CURRENT_WORKING',
    reason: `Filtered ${blocked.length} exercises above current working progression for ${targetSkill}`,
  }
}

function findCapForSkill(
  caps: Record<string, CurrentWorkingSkillCap>,
  skill: string
): CurrentWorkingSkillCap | null {
  // [EXERCISE-SELECTION-HARDENING] Safe string operation
  const skillLower = (skill ?? '').toLowerCase().replace(/[\s_-]/g, '')
  
  for (const [key, cap] of Object.entries(caps)) {
    const keyLower = key.toLowerCase().replace(/[\s_-]/g, '')
    if (keyLower.includes(skillLower) || skillLower.includes(keyLower)) {
      return cap
    }
  }
  
  return null
}

/**
 * Validates that the generated week shows visible difference from primary-only template.
 * Returns a verdict and suggestions for refinement if needed.
 */
export function validateWeeklyMateriality(
  sessions: Array<{
    exercises: Array<{ id: string; category?: string }>
    dayType?: string
    focus?: string
  }>,
  contract: SessionArchitectureTruthContract
): {
  verdict: 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT' | 'ACCEPTABLY_DIFFERENT' | 'STRONGLY_PERSONALIZED'
  metrics: {
    avgExercisesPerSession: number
    distinctSessionRoles: number
    supportSkillTouches: number
    nonPrimaryAppearances: number
    methodPackagedBlockCount: number
    currentWorkingConstrainedCount: number
  }
  needsRefinement: boolean
  refinementSuggestions: string[]
} {
  const metrics = {
    avgExercisesPerSession: 0,
    distinctSessionRoles: 0,
    supportSkillTouches: 0,
    nonPrimaryAppearances: 0,
    methodPackagedBlockCount: 0,
    currentWorkingConstrainedCount: 0,
  }
  
  // Calculate metrics
  const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0)
  metrics.avgExercisesPerSession = sessions.length > 0 ? totalExercises / sessions.length : 0
  
  const sessionRoles = new Set(sessions.map(s => s.dayType || s.focus || 'unknown'))
  metrics.distinctSessionRoles = sessionRoles.size
  
  // Count support skill touches and non-primary appearances
  const primarySkillsLower = new Set(contract.primarySpineSkills.map(s => s.toLowerCase()))
  const supportSkillsLower = new Set(contract.supportRotationSkills.map(s => s.toLowerCase()))
  
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const exIdLower = ex.id.toLowerCase()
      
      // Check for support skill
      for (const support of supportSkillsLower) {
        if (exIdLower.includes(support.replace(/[\s_-]/g, ''))) {
          metrics.supportSkillTouches++
          break
        }
      }
      
      // Check for non-primary
      let isPrimary = false
      for (const primary of primarySkillsLower) {
        if (exIdLower.includes(primary.replace(/[\s_-]/g, ''))) {
          isPrimary = true
          break
        }
      }
      if (!isPrimary && ex.category !== 'warmup' && ex.category !== 'cooldown') {
        metrics.nonPrimaryAppearances++
      }
    }
  }
  
  // Determine verdict
  const refinementSuggestions: string[] = []
  let verdict: 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT' | 'ACCEPTABLY_DIFFERENT' | 'STRONGLY_PERSONALIZED'
  
  const { weeklyMinimums, structuralGuards } = contract
  
  // Check against minimums
  if (metrics.distinctSessionRoles < weeklyMinimums.minDistinctSessionRoles) {
    refinementSuggestions.push(`Need ${weeklyMinimums.minDistinctSessionRoles - metrics.distinctSessionRoles} more distinct session roles`)
  }
  
  if (metrics.supportSkillTouches < weeklyMinimums.minSupportTouches) {
    refinementSuggestions.push(`Need ${weeklyMinimums.minSupportTouches - metrics.supportSkillTouches} more support skill touches`)
  }
  
  // Visible difference check
  if (structuralGuards.requireVisibleDifferenceFromPrimaryOnlyTemplate) {
    const hasVisibleDifference = 
      metrics.supportSkillTouches >= 2 ||
      metrics.nonPrimaryAppearances >= 4 ||
      metrics.distinctSessionRoles >= 3
    
    if (!hasVisibleDifference) {
      refinementSuggestions.push('Week too similar to primary-only template - add support skill rotation')
    }
  }
  
  // Determine final verdict
  if (refinementSuggestions.length >= 2) {
    verdict = 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT'
  } else if (refinementSuggestions.length === 0 && 
             metrics.supportSkillTouches >= weeklyMinimums.minSupportTouches &&
             metrics.distinctSessionRoles >= weeklyMinimums.minDistinctSessionRoles) {
    verdict = 'STRONGLY_PERSONALIZED'
  } else {
    verdict = 'ACCEPTABLY_DIFFERENT'
  }
  
  return {
    verdict,
    metrics,
    needsRefinement: verdict === 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT' && refinementSuggestions.length > 0,
    refinementSuggestions,
  }
}
