/**
 * ONBOARDING TRUTH EXPRESSION AUDIT
 * 
 * =============================================================================
 * PURPOSE: Trace exactly where onboarding profile truth flows and is weakened
 * =============================================================================
 * 
 * This module provides authoritative tracing for:
 * 1. Canonical profile → materiality contract
 * 2. Materiality contract → week allocation
 * 3. Week allocation → session assembly
 * 4. Session assembly → visible week output
 * 
 * AUDIT ONLY - Read-only extraction, identifies exact loss points
 */

import type { CanonicalProgrammingProfile } from '../canonical-profile-service'

// =============================================================================
// TYPES
// =============================================================================

export type OnboardingTruthFamily =
  | 'primaryGoal'
  | 'secondaryGoal'
  | 'selectedSkills'
  | 'trainingMethodPreferences'
  | 'currentWorkingProgressions'
  | 'strengthBenchmarks'
  | 'flexibilityTargets'
  | 'experienceLevel'
  | 'equipmentTruth'
  | 'trainingPath'

export type ExpressionMode =
  | 'direct'       // Materially expressed as primary/direct work
  | 'support'      // Expressed as support/accessory work
  | 'carryover'    // Expressed via carryover/indirect work
  | 'deferred'     // Explicitly deferred with reason
  | 'absent'       // Not expressed at all

export type LossPoint =
  | 'none'                    // No loss - fully expressed
  | 'canonical'               // Lost at canonical profile (missing from profile)
  | 'materiality'             // Lost during materiality classification
  | 'allocation'              // Lost during session allocation
  | 'week_expression'         // Lost at visible week expression
  | 'session_assembly'        // Lost during session assembly
  | 'display_contract'        // Lost at display (present but not shown)

export interface OnboardingFamilyAuditEntry {
  family: OnboardingTruthFamily
  sourceTruth: unknown
  sourceTruthSummary: string
  consumedByBuilder: boolean
  materiallyClassified: boolean
  allocatedToWeek: boolean
  assembledIntoSessions: boolean
  visiblyExpressed: boolean
  expressionMode: ExpressionMode
  lossPoint: LossPoint
  reasonCode: string
  doctrineJustified: boolean
  auditDetails: {
    canonicalValue?: unknown
    materialityClassification?: string
    allocationResult?: string
    sessionAssemblyResult?: string
    visibleExpressionResult?: string
  }
}

export interface SkillDispositionEntry {
  skill: string
  canonicallySelected: boolean
  materialityRole: string
  allocationMode: string
  weekExpressionMode: string
  sessionCount: number
  directExerciseCount: number
  finalDisposition: 'direct_expression' | 'support_expression' | 'carryover_expression' | 'deferred_with_reason'
  deferralReason: string | null
  doctrineJustified: boolean
}

export interface MethodPreferenceDispositionEntry {
  method: string
  selectedInProfile: boolean
  passedToBuilder: boolean
  eligibilityStatus: 'earned' | 'allowed' | 'discouraged' | 'blocked' | 'unknown'
  actuallyApplied: boolean
  sessionsWithMethod: number
  finalDisposition: 'materially_applied' | 'blocked_by_readiness' | 'blocked_by_structure' | 'blocked_by_doctrine' | 'not_selected' | 'silent_loss'
  blockReason: string | null
}

export interface OnboardingTruthExpressionAudit {
  auditVersion: '1.0.0'
  auditTimestamp: string
  
  // Per-family audit
  familyAudits: OnboardingFamilyAuditEntry[]
  
  // Specific skill dispositions
  skillDispositions: SkillDispositionEntry[]
  
  // Method preference dispositions
  methodPreferenceDispositions: MethodPreferenceDispositionEntry[]
  
  // Key metrics
  metrics: {
    totalSelectedSkills: number
    directlyExpressedSkills: number
    supportExpressedSkills: number
    carryoverExpressedSkills: number
    deferredSkills: number
    selectedMethodCount: number
    appliedMethodCount: number
    silentMethodLosses: number
  }
  
  // Root cause verdict
  rootCauseVerdict: 'USER_MOSTLY_WRONG' | 'USER_PARTLY_RIGHT' | 'USER_MOSTLY_RIGHT'
  rootCauseExplanation: string
  
  // Specific findings
  backLeverDisposition: SkillDispositionEntry | null
  methodPreferenceVerdict: string
  selectedSkillExpressionVerdict: string
}

// =============================================================================
// AUDIT BUILDERS
// =============================================================================

/**
 * Build skill disposition from materiality and allocation data
 */
export function buildSkillDisposition(
  skill: string,
  canonicallySelected: boolean,
  materialSkillIntent: Array<{
    skill: string
    role: string
    representationMode: string
    allocatedSessions: number
    deferralReason?: string | null
    deferralReasonCode?: string | null
    constrainedBy?: string[]
  }>,
  sessionExercises: Array<{ skill?: string; name?: string }>,
  visibleWeekContract: {
    deferredSkills: string[]
    materiallyExpressedPrimarySkills: string[]
    materiallyExpressedTertiarySkills: string[]
    materiallyExpressedSupportSkills: string[]
    skillExpressionPlan?: Array<{
      skill: string
      expressionMode: string
      expressionReason: string
    }>
  } | null
): SkillDispositionEntry {
  const intent = materialSkillIntent.find(i => i.skill === skill)
  const expressionPlan = visibleWeekContract?.skillExpressionPlan?.find(p => p.skill === skill)
  
  // Count exercises that match this skill
  const directExerciseCount = sessionExercises.filter(ex => {
    const exSkill = ex.skill?.toLowerCase() || ''
    const exName = ex.name?.toLowerCase() || ''
    const skillLower = skill.toLowerCase().replace(/_/g, ' ')
    const skillUnderscore = skill.toLowerCase()
    
    return exSkill === skillUnderscore ||
           exSkill.includes(skillUnderscore) ||
           exName.includes(skillLower) ||
           (skill === 'back_lever' && (exName.includes('lever') || exName.includes('german hang'))) ||
           (skill === 'front_lever' && exName.includes('lever') && !exName.includes('back')) ||
           (skill === 'planche' && (exName.includes('planche') || exName.includes('pseudo'))) ||
           (skill === 'muscle_up' && exName.includes('muscle')) ||
           (skill === 'hspu' && (exName.includes('hspu') || exName.includes('handstand push')))
  }).length
  
  const sessionCount = intent?.allocatedSessions || 0
  
  // Determine final disposition
  let finalDisposition: SkillDispositionEntry['finalDisposition'] = 'deferred_with_reason'
  let deferralReason: string | null = null
  let doctrineJustified = false
  
  if (visibleWeekContract?.materiallyExpressedPrimarySkills?.includes(skill)) {
    finalDisposition = 'direct_expression'
  } else if (visibleWeekContract?.materiallyExpressedTertiarySkills?.includes(skill)) {
    finalDisposition = 'direct_expression'
  } else if (visibleWeekContract?.materiallyExpressedSupportSkills?.includes(skill)) {
    finalDisposition = directExerciseCount > 0 ? 'support_expression' : 'carryover_expression'
  } else if (visibleWeekContract?.deferredSkills?.includes(skill)) {
    finalDisposition = 'deferred_with_reason'
    deferralReason = expressionPlan?.expressionReason || intent?.deferralReason || 'unknown_deferral'
    
    // Check if deferral is doctrine-justified
    const validDeferralReasons = [
      'progression_not_ready',
      'recovery_budget_insufficient',
      'equipment_not_available',
      'schedule_budget_insufficient',
      'direct_conflict_with_primary_spine',
      'suppressed_by_realism_gating',
      'readiness_insufficient',
    ]
    doctrineJustified = validDeferralReasons.some(r => 
      (deferralReason || '').toLowerCase().includes(r.toLowerCase().replace(/_/g, ' ')) ||
      (deferralReason || '').toLowerCase().includes(r.toLowerCase())
    )
  } else if (directExerciseCount > 0) {
    finalDisposition = 'carryover_expression'
  } else {
    finalDisposition = 'deferred_with_reason'
    deferralReason = 'not_in_visible_week_contract'
  }
  
  return {
    skill,
    canonicallySelected,
    materialityRole: intent?.role || 'not_classified',
    allocationMode: intent?.representationMode || 'unknown',
    weekExpressionMode: expressionPlan?.expressionMode || 'unknown',
    sessionCount,
    directExerciseCount,
    finalDisposition,
    deferralReason,
    doctrineJustified,
  }
}

/**
 * Build method preference disposition
 */
export function buildMethodPreferenceDisposition(
  method: string,
  selectedInProfile: boolean,
  methodEligibility: {
    supersets?: string
    circuits?: string
    densityBlocks?: string
    clusterSets?: string
  } | null,
  sessionsWithMethod: number,
  methodReadinessGating: Array<{
    family: string
    methodPermission: string
    gatedFromComplex: boolean
  }> | null
): MethodPreferenceDispositionEntry {
  const normalizedMethod = method.toLowerCase().replace(/_/g, '')
  
  // Get eligibility status
  let eligibilityStatus: MethodPreferenceDispositionEntry['eligibilityStatus'] = 'unknown'
  if (methodEligibility) {
    if (normalizedMethod.includes('superset')) {
      eligibilityStatus = (methodEligibility.supersets || 'unknown') as typeof eligibilityStatus
    } else if (normalizedMethod.includes('circuit')) {
      eligibilityStatus = (methodEligibility.circuits || 'unknown') as typeof eligibilityStatus
    } else if (normalizedMethod.includes('density')) {
      eligibilityStatus = (methodEligibility.densityBlocks || 'unknown') as typeof eligibilityStatus
    } else if (normalizedMethod.includes('cluster')) {
      eligibilityStatus = (methodEligibility.clusterSets || 'unknown') as typeof eligibilityStatus
    }
  }
  
  const actuallyApplied = sessionsWithMethod > 0
  
  // Determine final disposition
  let finalDisposition: MethodPreferenceDispositionEntry['finalDisposition'] = 'not_selected'
  let blockReason: string | null = null
  
  if (!selectedInProfile) {
    finalDisposition = 'not_selected'
  } else if (actuallyApplied) {
    finalDisposition = 'materially_applied'
  } else if (eligibilityStatus === 'blocked' || eligibilityStatus === 'discouraged') {
    finalDisposition = 'blocked_by_doctrine'
    blockReason = `method_eligibility_${eligibilityStatus}`
  } else if (methodReadinessGating?.some(g => g.gatedFromComplex)) {
    finalDisposition = 'blocked_by_readiness'
    blockReason = 'readiness_gating_restricts_complex_methods'
  } else {
    finalDisposition = 'silent_loss'
    blockReason = 'selected_but_not_applied_without_explicit_block'
  }
  
  return {
    method,
    selectedInProfile,
    passedToBuilder: selectedInProfile,
    eligibilityStatus,
    actuallyApplied,
    sessionsWithMethod,
    finalDisposition,
    blockReason,
  }
}

/**
 * Build complete onboarding truth expression audit
 */
export function buildOnboardingTruthExpressionAudit(
  canonicalProfile: CanonicalProgrammingProfile,
  materialSkillIntent: Array<{
    skill: string
    role: string
    representationMode: string
    allocatedSessions: number
    deferralReason?: string | null
    deferralReasonCode?: string | null
    constrainedBy?: string[]
  }>,
  visibleWeekContract: {
    deferredSkills: string[]
    materiallyExpressedPrimarySkills: string[]
    materiallyExpressedTertiarySkills: string[]
    materiallyExpressedSupportSkills: string[]
    skillExpressionPlan?: Array<{
      skill: string
      expressionMode: string
      expressionReason: string
    }>
  } | null,
  sessionExercises: Array<{ skill?: string; name?: string }>,
  methodEligibility: {
    supersets?: string
    circuits?: string
    densityBlocks?: string
    clusterSets?: string
  } | null,
  sessionStyleMetadatas: Array<{
    hasSupersetsApplied?: boolean
    hasCircuitsApplied?: boolean
    hasDensityApplied?: boolean
    appliedMethods?: string[]
  }>,
  methodReadinessGating: Array<{
    family: string
    methodPermission: string
    gatedFromComplex: boolean
  }> | null
): OnboardingTruthExpressionAudit {
  const selectedSkills = canonicalProfile.selectedSkills || []
  const methodPreferences = canonicalProfile.trainingMethodPreferences || []
  
  // Build skill dispositions
  const skillDispositions: SkillDispositionEntry[] = selectedSkills.map(skill =>
    buildSkillDisposition(
      skill,
      true,
      materialSkillIntent,
      sessionExercises,
      visibleWeekContract
    )
  )
  
  // Build method preference dispositions
  const sessionsWithSupersets = sessionStyleMetadatas.filter(s => s.hasSupersetsApplied).length
  const sessionsWithCircuits = sessionStyleMetadatas.filter(s => s.hasCircuitsApplied).length
  const sessionsWithDensity = sessionStyleMetadatas.filter(s => s.hasDensityApplied).length
  
  const methodPreferenceDispositions: MethodPreferenceDispositionEntry[] = [
    buildMethodPreferenceDisposition('supersets', methodPreferences.includes('supersets'), methodEligibility, sessionsWithSupersets, methodReadinessGating),
    buildMethodPreferenceDisposition('circuits', methodPreferences.includes('circuits'), methodEligibility, sessionsWithCircuits, methodReadinessGating),
    buildMethodPreferenceDisposition('density_blocks', methodPreferences.includes('density_blocks'), methodEligibility, sessionsWithDensity, methodReadinessGating),
    buildMethodPreferenceDisposition('straight_sets', methodPreferences.includes('straight_sets') || methodPreferences.length === 0, methodEligibility, sessionStyleMetadatas.length, methodReadinessGating),
  ]
  
  // Calculate metrics
  const directlyExpressedSkills = skillDispositions.filter(s => s.finalDisposition === 'direct_expression').length
  const supportExpressedSkills = skillDispositions.filter(s => s.finalDisposition === 'support_expression').length
  const carryoverExpressedSkills = skillDispositions.filter(s => s.finalDisposition === 'carryover_expression').length
  const deferredSkills = skillDispositions.filter(s => s.finalDisposition === 'deferred_with_reason').length
  
  const selectedMethodCount = methodPreferences.filter(m => m !== 'straight_sets').length
  const appliedMethodCount = methodPreferenceDispositions.filter(m => m.actuallyApplied && m.method !== 'straight_sets').length
  const silentMethodLosses = methodPreferenceDispositions.filter(m => m.finalDisposition === 'silent_loss').length
  
  // Build family audits
  const familyAudits: OnboardingFamilyAuditEntry[] = [
    {
      family: 'primaryGoal',
      sourceTruth: canonicalProfile.primaryGoal,
      sourceTruthSummary: canonicalProfile.primaryGoal || 'not_set',
      consumedByBuilder: true,
      materiallyClassified: true,
      allocatedToWeek: true,
      assembledIntoSessions: true,
      visiblyExpressed: true,
      expressionMode: 'direct',
      lossPoint: 'none',
      reasonCode: 'primary_goal_always_expressed',
      doctrineJustified: true,
      auditDetails: { canonicalValue: canonicalProfile.primaryGoal },
    },
    {
      family: 'secondaryGoal',
      sourceTruth: canonicalProfile.secondaryGoal,
      sourceTruthSummary: canonicalProfile.secondaryGoal || 'not_set',
      consumedByBuilder: !!canonicalProfile.secondaryGoal,
      materiallyClassified: !!canonicalProfile.secondaryGoal,
      allocatedToWeek: !!canonicalProfile.secondaryGoal,
      assembledIntoSessions: !!canonicalProfile.secondaryGoal,
      visiblyExpressed: !!canonicalProfile.secondaryGoal,
      expressionMode: canonicalProfile.secondaryGoal ? 'direct' : 'absent',
      lossPoint: canonicalProfile.secondaryGoal ? 'none' : 'canonical',
      reasonCode: canonicalProfile.secondaryGoal ? 'secondary_goal_expressed' : 'secondary_goal_not_set',
      doctrineJustified: true,
      auditDetails: { canonicalValue: canonicalProfile.secondaryGoal },
    },
    {
      family: 'selectedSkills',
      sourceTruth: selectedSkills,
      sourceTruthSummary: `${selectedSkills.length} skills: ${selectedSkills.join(', ')}`,
      consumedByBuilder: true,
      materiallyClassified: true,
      allocatedToWeek: true,
      assembledIntoSessions: directlyExpressedSkills + supportExpressedSkills + carryoverExpressedSkills > 0,
      visiblyExpressed: directlyExpressedSkills >= 2,
      expressionMode: directlyExpressedSkills >= selectedSkills.length * 0.5 ? 'direct' : 
                      directlyExpressedSkills + supportExpressedSkills >= selectedSkills.length * 0.5 ? 'support' :
                      deferredSkills > selectedSkills.length * 0.5 ? 'deferred' : 'carryover',
      lossPoint: directlyExpressedSkills >= selectedSkills.length * 0.5 ? 'none' :
                 directlyExpressedSkills >= 2 ? 'week_expression' : 'allocation',
      reasonCode: `${directlyExpressedSkills}/${selectedSkills.length} directly expressed`,
      doctrineJustified: skillDispositions.filter(s => s.finalDisposition === 'deferred_with_reason' && s.doctrineJustified).length >= deferredSkills * 0.5,
      auditDetails: {
        canonicalValue: selectedSkills,
        materialityClassification: skillDispositions.map(s => `${s.skill}:${s.materialityRole}`).join(', '),
        allocationResult: skillDispositions.map(s => `${s.skill}:${s.sessionCount}sessions`).join(', '),
        visibleExpressionResult: `${directlyExpressedSkills} direct, ${supportExpressedSkills} support, ${carryoverExpressedSkills} carryover, ${deferredSkills} deferred`,
      },
    },
    {
      family: 'trainingMethodPreferences',
      sourceTruth: methodPreferences,
      sourceTruthSummary: methodPreferences.length > 0 ? methodPreferences.join(', ') : 'default_straight_sets',
      consumedByBuilder: true,
      materiallyClassified: true,
      allocatedToWeek: true,
      assembledIntoSessions: appliedMethodCount > 0 || selectedMethodCount === 0,
      visiblyExpressed: silentMethodLosses === 0,
      expressionMode: silentMethodLosses === 0 ? 'direct' : 
                      appliedMethodCount > 0 ? 'support' : 'absent',
      lossPoint: silentMethodLosses === 0 ? 'none' : 'session_assembly',
      reasonCode: silentMethodLosses === 0 ? 'method_preferences_honored' : `${silentMethodLosses} methods silently lost`,
      doctrineJustified: methodPreferenceDispositions.filter(m => m.finalDisposition === 'blocked_by_readiness' || m.finalDisposition === 'blocked_by_doctrine').length >= silentMethodLosses,
      auditDetails: {
        canonicalValue: methodPreferences,
        visibleExpressionResult: methodPreferenceDispositions.map(m => `${m.method}:${m.finalDisposition}`).join(', '),
      },
    },
    {
      family: 'experienceLevel',
      sourceTruth: canonicalProfile.experienceLevel,
      sourceTruthSummary: canonicalProfile.experienceLevel || 'not_set',
      consumedByBuilder: true,
      materiallyClassified: true,
      allocatedToWeek: true,
      assembledIntoSessions: true,
      visiblyExpressed: false, // Not shown in UI
      expressionMode: 'support',
      lossPoint: 'display_contract',
      reasonCode: 'experience_level_affects_generation_not_shown',
      doctrineJustified: true,
      auditDetails: { canonicalValue: canonicalProfile.experienceLevel },
    },
  ]
  
  // Determine back lever disposition
  const backLeverDisposition = skillDispositions.find(s => s.skill === 'back_lever') || null
  
  // Determine root cause verdict
  let rootCauseVerdict: OnboardingTruthExpressionAudit['rootCauseVerdict'] = 'USER_MOSTLY_WRONG'
  let rootCauseExplanation = ''
  
  const expressionRatio = directlyExpressedSkills / Math.max(1, selectedSkills.length)
  const methodLossRatio = silentMethodLosses / Math.max(1, selectedMethodCount)
  const undeferredLossCount = skillDispositions.filter(s => s.finalDisposition === 'deferred_with_reason' && !s.doctrineJustified).length
  
  if (expressionRatio >= 0.5 && silentMethodLosses === 0 && undeferredLossCount === 0) {
    rootCauseVerdict = 'USER_MOSTLY_WRONG'
    rootCauseExplanation = `Onboarding truth is being expressed correctly. ${directlyExpressedSkills}/${selectedSkills.length} skills directly expressed, no silent method losses. Issues may be UI perception.`
  } else if (expressionRatio >= 0.3 && (silentMethodLosses > 0 || undeferredLossCount > 0)) {
    rootCauseVerdict = 'USER_PARTLY_RIGHT'
    rootCauseExplanation = `Onboarding is consumed but under-expressed in specific corridors. ${directlyExpressedSkills}/${selectedSkills.length} skills directly expressed, ${silentMethodLosses} method silent losses, ${undeferredLossCount} unjustified deferrals.`
  } else {
    rootCauseVerdict = 'USER_MOSTLY_RIGHT'
    rootCauseExplanation = `Onboarding breadth is materially lost before final week output. Only ${directlyExpressedSkills}/${selectedSkills.length} skills directly expressed, ${silentMethodLosses} method silent losses, ${undeferredLossCount} unjustified deferrals.`
  }
  
  // Build verdicts
  const selectedSkillExpressionVerdict = 
    directlyExpressedSkills >= selectedSkills.length * 0.5 ? 'STRONG_EXPRESSION' :
    directlyExpressedSkills >= 2 ? 'ADEQUATE_EXPRESSION' : 'WEAK_EXPRESSION'
  
  const methodPreferenceVerdict = 
    silentMethodLosses === 0 ? 'ALL_METHODS_ACCOUNTED' :
    silentMethodLosses <= 1 ? 'MOSTLY_ACCOUNTED' : 'SIGNIFICANT_SILENT_LOSS'
  
  return {
    auditVersion: '1.0.0',
    auditTimestamp: new Date().toISOString(),
    familyAudits,
    skillDispositions,
    methodPreferenceDispositions,
    metrics: {
      totalSelectedSkills: selectedSkills.length,
      directlyExpressedSkills,
      supportExpressedSkills,
      carryoverExpressedSkills,
      deferredSkills,
      selectedMethodCount,
      appliedMethodCount,
      silentMethodLosses,
    },
    rootCauseVerdict,
    rootCauseExplanation,
    backLeverDisposition,
    methodPreferenceVerdict,
    selectedSkillExpressionVerdict,
  }
}

/**
 * Log the onboarding truth expression audit with required dev logs
 */
export function logOnboardingTruthExpressionAudit(audit: OnboardingTruthExpressionAudit): void {
  // Main audit log
  console.log('[onboarding-truth-audit]', {
    totalSelectedSkills: audit.metrics.totalSelectedSkills,
    directlyExpressed: audit.metrics.directlyExpressedSkills,
    supportExpressed: audit.metrics.supportExpressedSkills,
    carryoverExpressed: audit.metrics.carryoverExpressedSkills,
    deferred: audit.metrics.deferredSkills,
    familyLossPoints: audit.familyAudits
      .filter(f => f.lossPoint !== 'none')
      .map(f => ({ family: f.family, lossPoint: f.lossPoint, reason: f.reasonCode })),
    rootCauseVerdict: audit.rootCauseVerdict,
  })
  
  // Selected skill expression audit
  console.log('[selected-skill-expression-audit]', {
    totalSkills: audit.metrics.totalSelectedSkills,
    directCount: audit.metrics.directlyExpressedSkills,
    supportCount: audit.metrics.supportExpressedSkills,
    carryoverCount: audit.metrics.carryoverExpressedSkills,
    deferredCount: audit.metrics.deferredSkills,
    skillDispositions: audit.skillDispositions.map(s => ({
      skill: s.skill,
      disposition: s.finalDisposition,
      role: s.materialityRole,
      sessions: s.sessionCount,
      exercises: s.directExerciseCount,
      doctrineJustified: s.doctrineJustified,
    })),
    verdict: audit.selectedSkillExpressionVerdict,
  })
  
  // Method preference expression audit
  console.log('[method-preference-expression-audit]', {
    selectedMethods: audit.methodPreferenceDispositions.filter(m => m.selectedInProfile).map(m => m.method),
    appliedMethods: audit.methodPreferenceDispositions.filter(m => m.actuallyApplied).map(m => m.method),
    silentLosses: audit.methodPreferenceDispositions.filter(m => m.finalDisposition === 'silent_loss').map(m => ({
      method: m.method,
      blockReason: m.blockReason,
    })),
    blockedByReadiness: audit.methodPreferenceDispositions.filter(m => m.finalDisposition === 'blocked_by_readiness').map(m => m.method),
    blockedByDoctrine: audit.methodPreferenceDispositions.filter(m => m.finalDisposition === 'blocked_by_doctrine').map(m => m.method),
    verdict: audit.methodPreferenceVerdict,
  })
  
  // Back lever disposition audit
  if (audit.backLeverDisposition) {
    console.log('[back-lever-disposition-audit]', {
      canonicallySelected: audit.backLeverDisposition.canonicallySelected,
      materialityRole: audit.backLeverDisposition.materialityRole,
      allocationMode: audit.backLeverDisposition.allocationMode,
      weekExpressionMode: audit.backLeverDisposition.weekExpressionMode,
      sessionCount: audit.backLeverDisposition.sessionCount,
      directExerciseCount: audit.backLeverDisposition.directExerciseCount,
      finalDisposition: audit.backLeverDisposition.finalDisposition,
      deferralReason: audit.backLeverDisposition.deferralReason,
      doctrineJustified: audit.backLeverDisposition.doctrineJustified,
    })
  }
  
  // Final verdict
  console.log('[final-onboarding-expression-verdict]', {
    rootCauseVerdict: audit.rootCauseVerdict,
    rootCauseExplanation: audit.rootCauseExplanation,
    skillExpressionVerdict: audit.selectedSkillExpressionVerdict,
    methodPreferenceVerdict: audit.methodPreferenceVerdict,
    backLeverHandled: audit.backLeverDisposition ? audit.backLeverDisposition.finalDisposition : 'not_selected',
    undeferredSilentLosses: audit.skillDispositions.filter(s => s.finalDisposition === 'deferred_with_reason' && !s.doctrineJustified).length,
    silentMethodLosses: audit.metrics.silentMethodLosses,
  })
}

// =============================================================================
// ENFORCEMENT HELPERS
// =============================================================================

/**
 * Check if a skill deferral has a valid doctrine-justified reason
 */
export function isDeferralDoctrineJustified(deferralReason: string | null): boolean {
  if (!deferralReason) return false
  
  const validReasons = [
    'progression_not_ready',
    'progression_level_too_low',
    'recovery_budget_insufficient',
    'recovery_constrained',
    'equipment_not_available',
    'equipment_constraint',
    'schedule_budget_insufficient',
    'insufficient_session_budget',
    'direct_conflict_with_primary_spine',
    'suppressed_by_realism_gating',
    'readiness_insufficient',
    'readiness_gated',
  ]
  
  const normalizedReason = deferralReason.toLowerCase().replace(/[_-]/g, ' ')
  return validReasons.some(r => normalizedReason.includes(r.replace(/_/g, ' ')))
}

/**
 * Determine if additional tertiary skills should be promoted to visible expression
 * based on schedule/recovery allowing it and doctrine not explicitly blocking
 */
export function shouldPromoteTertiaryToVisible(
  skill: string,
  currentDisposition: SkillDispositionEntry,
  effectiveTrainingDays: number,
  directlyExpressedCount: number,
  selectedSkillsCount: number
): { shouldPromote: boolean; reason: string } {
  // Already directly expressed
  if (currentDisposition.finalDisposition === 'direct_expression') {
    return { shouldPromote: false, reason: 'already_directly_expressed' }
  }
  
  // Deferred with doctrine-justified reason
  if (currentDisposition.finalDisposition === 'deferred_with_reason' && currentDisposition.doctrineJustified) {
    return { shouldPromote: false, reason: 'deferred_with_doctrine_justified_reason' }
  }
  
  // Check if we have room for more direct expression
  const minimumDirectExpression = Math.ceil(selectedSkillsCount * 0.4)
  if (directlyExpressedCount >= minimumDirectExpression) {
    return { shouldPromote: false, reason: 'direct_expression_floor_already_met' }
  }
  
  // Check if schedule allows (need at least 4 days for tertiary expression)
  if (effectiveTrainingDays < 4) {
    return { shouldPromote: false, reason: 'insufficient_training_days_for_tertiary_expression' }
  }
  
  // Has exercises but only carryover - could be promoted
  if (currentDisposition.directExerciseCount > 0 && currentDisposition.finalDisposition === 'carryover_expression') {
    return { shouldPromote: true, reason: 'has_exercises_but_only_carryover_can_promote' }
  }
  
  // Support expression with sessions - could be promoted
  if (currentDisposition.finalDisposition === 'support_expression' && currentDisposition.sessionCount >= 1) {
    return { shouldPromote: true, reason: 'support_with_sessions_can_promote' }
  }
  
  // Deferred without doctrine justification - should promote
  if (currentDisposition.finalDisposition === 'deferred_with_reason' && !currentDisposition.doctrineJustified) {
    return { shouldPromote: true, reason: 'deferred_without_doctrine_justification_should_promote' }
  }
  
  return { shouldPromote: false, reason: 'no_promotion_criteria_met' }
}
