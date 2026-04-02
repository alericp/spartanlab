/**
 * AI TRUTH AUDIT SYSTEM
 * 
 * =============================================================================
 * PURPOSE: Map and verify truth flow from onboarding → generation → display
 * =============================================================================
 * 
 * This module provides:
 * 1. Field-by-field truth usage audit
 * 2. Loss detection across the pipeline
 * 3. Normalized program explanation object
 * 4. Explanation gap analysis
 * 
 * AUDIT ONLY - Does not modify generation or display logic
 */

import type { CanonicalProgrammingProfile } from './canonical-profile-service'
import type { AdaptiveProgram, AdaptiveProgramInputs } from './adaptive-program-builder'

// =============================================================================
// TRUTH FIELD DEFINITIONS
// =============================================================================

export type TruthFieldEffectType = 
  | 'none'                    // Field exists but has no effect
  | 'display_only'            // Only affects display, not generation
  | 'schedule_only'           // Only affects schedule/frequency
  | 'exercise_selection'      // Affects which exercises are chosen
  | 'identity'                // Affects program identity/goal classification
  | 'summary_copy'            // Affects summary text generation
  | 'multi_factor'            // Affects multiple aspects
  | 'volume_intensity'        // Affects sets/reps/load
  | 'structure'               // Affects session structure (supersets, etc.)

export type TruthFieldVerdict = 
  | 'FULLY_CONNECTED'                  // Field flows from profile → generation → display
  | 'STORED_BUT_UNUSED'                // In profile but not consumed by generator
  | 'USED_BUT_NOT_DISPLAYED'           // Consumed by generator but not shown on page
  | 'DISPLAYED_BUT_NOT_GENERATIVE'     // Shown on page but doesn't affect generation
  | 'LOST_BEFORE_SAVE'                 // In generation but not persisted to program
  | 'HIDDEN_ON_PROGRAM_PAGE'           // Persisted but not surfaced in UI
  | 'COMPRESSED_INTO_BROADER_FIELD'    // Merged into another field
  | 'PARTIALLY_CONNECTED'              // Some aspects flow through, others don't

export type TruthLossPoint = 
  | 'LOST_AT_CANONICAL_PROFILE'
  | 'LOST_AT_BUILDER_PREFILL'
  | 'LOST_AT_GENERATION_INPUT'
  | 'LOST_AT_STRUCTURE_BUILD'
  | 'LOST_AT_SAVE'
  | 'LOST_AT_PROGRAM_PAGE_DISPLAY'
  | 'PRESENT_BUT_NOT_EXPLAINED'

// =============================================================================
// [PHASE 2] METHOD PREFERENCES MATERIALITY TYPES
// =============================================================================

export interface MethodApplicationSummary {
  // What methods were actually applied across all sessions
  actuallyApplied: string[]
  // Per-session breakdown of what was applied
  perSessionMethods: Array<{
    dayNumber: number
    dayFocus: string
    appliedMethods: string[]
    hasSuperset: boolean
    hasCircuit: boolean
    hasDensity: boolean
    structureDescription: string
  }>
  // Aggregate counts
  sessionsWithSupersets: number
  sessionsWithCircuits: number
  sessionsWithDensity: number
  sessionsWithOnlyStraightSets: number
  // Expression summary
  expressionSummary: string
}

export interface MethodMaterialityReport {
  // What the user selected
  userSelectedMethods: string[]
  // What was actually applied
  appliedMethods: string[]
  // What was selected but NOT applied
  selectedButNotApplied: string[]
  // Reasons for non-application
  nonApplicationReasons: Array<{
    method: string
    reason: string
  }>
  // Materiality verdict
  verdict: 'FULLY_EXPRESSED' | 'MOSTLY_EXPRESSED' | 'LIGHTLY_EXPRESSED' | 'NOT_EXPRESSED' | 'NO_PREFERENCES'
  // User-facing explanation of how preferences shaped the program
  explanationForUser: string
}

export interface TruthFieldAudit {
  fieldName: string
  existsInCanonicalProfile: boolean
  existsInBuilderInputs: boolean
  consumedByGenerator: boolean
  persistedOnSavedProgram: boolean
  shownOnProgramPage: boolean
  effectType: TruthFieldEffectType
  notes: string
  verdict: TruthFieldVerdict
  lossPoint?: TruthLossPoint
}

// =============================================================================
// TRUTH AUDIT REGISTRY
// =============================================================================

/**
 * Complete registry of onboarding/profile fields and their truth flow status.
 * This is the authoritative map of how each field is (or isn't) used.
 */
export const TRUTH_FIELD_REGISTRY: TruthFieldAudit[] = [
  // ===== GOALS & IDENTITY =====
  {
    fieldName: 'primaryGoal',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: true,
    effectType: 'identity',
    notes: 'Core identity field, affects structure selection and exercise emphasis',
    verdict: 'FULLY_CONNECTED',
  },
  {
    fieldName: 'secondaryGoal',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'identity',
    notes: 'Affects exercise selection but NOT clearly surfaced in UI explanation',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'selectedSkills',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: true,
    effectType: 'multi_factor',
    notes: 'Shown in "Built around" tags, affects exercise selection and session focus',
    verdict: 'FULLY_CONNECTED',
  },
  {
    fieldName: 'goalCategories',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'identity',
    notes: 'Multiple categories from onboarding, affects goal hierarchy but not shown',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'trainingPathType',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'structure',
    notes: 'skill_progression vs strength_endurance vs hybrid - affects structure but hidden',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  
  // ===== SCHEDULE & DURATION =====
  {
    fieldName: 'scheduleMode',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: true,
    effectType: 'schedule_only',
    notes: 'static vs flexible - core schedule identity, shown in Schedule Status',
    verdict: 'FULLY_CONNECTED',
  },
  {
    fieldName: 'trainingDaysPerWeek',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: true,
    effectType: 'schedule_only',
    notes: 'Baseline frequency, shown as Current/Baseline sessions',
    verdict: 'FULLY_CONNECTED',
  },
  {
    fieldName: 'sessionDurationMode',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'structure',
    notes: 'static vs adaptive duration - affects compression but not explained',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'sessionLengthMinutes',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: true,
    effectType: 'structure',
    notes: 'Duration target, shown in session cards',
    verdict: 'FULLY_CONNECTED',
  },
  
  // ===== EXPERIENCE & EQUIPMENT =====
  {
    fieldName: 'experienceLevel',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'multi_factor',
    notes: 'Affects volume, progression rate, exercise complexity - NOT displayed',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'equipmentAvailable',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'Critical for exercise filtering but not shown in UI',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  
  // ===== FLEXIBILITY =====
  {
    fieldName: 'selectedFlexibility',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: true,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'Flexibility goals affect cooldown/mobility work but poorly surfaced',
    verdict: 'PARTIALLY_CONNECTED',
    lossPoint: 'LOST_AT_SAVE',
  },
  
  // ===== STRENGTH BENCHMARKS =====
  {
    fieldName: 'weightedPullUp',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'volume_intensity',
    notes: 'Drives weighted load prescription but not persisted on program object',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'weightedDip',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'volume_intensity',
    notes: 'Drives weighted load prescription but not persisted on program object',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'pullUpMax',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'volume_intensity',
    notes: 'Affects rep ranges and volume but not explained',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  
  // ===== SKILL BENCHMARKS =====
  {
    fieldName: 'frontLeverProgression',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'Determines front lever exercise variation - not surfaced to user',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'plancheProgression',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'Determines planche exercise variation - not surfaced to user',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  
  // ===== TRAINING STYLE =====
  {
    fieldName: 'trainingMethodPreferences',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'structure',
    notes: 'Supersets, circuits, etc. - affects structure but not explained',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'sessionStylePreference',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'structure',
    notes: 'longer_complete vs shorter_focused - hidden from user',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  
  // ===== DIAGNOSTICS =====
  {
    fieldName: 'jointCautions',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'Filters exercises for safety but not shown - user doesnt know exercises were adapted',
    verdict: 'USED_BUT_NOT_DISPLAYED',
    lossPoint: 'PRESENT_BUT_NOT_EXPLAINED',
  },
  {
    fieldName: 'weakestArea',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'Affects accessory selection - present in weakPointDetection but not surfaced',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'primaryLimitation',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'exercise_selection',
    notes: 'mobility/strength limiter - affects emphasis but not explained',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  
  // ===== RECOVERY =====
  {
    fieldName: 'recoveryQuality',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: true,
    shownOnProgramPage: false,
    effectType: 'volume_intensity',
    notes: 'Affects volume/intensity recommendations but not shown',
    verdict: 'USED_BUT_NOT_DISPLAYED',
  },
  {
    fieldName: 'recoveryRaw',
    existsInCanonicalProfile: true,
    existsInBuilderInputs: false,
    consumedByGenerator: true,
    persistedOnSavedProgram: false,
    shownOnProgramPage: false,
    effectType: 'volume_intensity',
    notes: 'Sleep/energy/stress details - compressed into recoveryQuality',
    verdict: 'COMPRESSED_INTO_BROADER_FIELD',
  },
]

// =============================================================================
// BROADER SKILL COVERAGE CONTRACT
// [PHASE 2 MULTI-SKILL] Structured coverage with deferral reasons
// =============================================================================

export interface SkillCoverageEntry {
  skill: string
  priorityLevel: 'primary' | 'secondary' | 'tertiary' | 'support'
  targetExposure: number
  allocatedSessions: number
  materiallyExpressedSessions: number
  coverageStatus: 'fully_represented' | 'broadly_represented' | 'support_only' | 'deferred'
  deferralReason: string | null
}

export interface BroaderSkillCoverageContract {
  entries: SkillCoverageEntry[]
  coverageVerdict: 'strong' | 'adequate' | 'weak'
  representedSkills: string[]
  deferredSkills: Array<{ skill: string; reason: string }>
  supportOnlySkills: string[]
}

// =============================================================================
// PROGRAM TRUTH EXPLANATION OBJECT
// =============================================================================

/**
 * Normalized explanation object derived from saved program + profile.
 * This captures what the user SHOULD see to understand why their program
 * looks the way it does.
 */
export interface ProgramTruthExplanation {
  // Identity
  identityPrimary: string | null
  identitySecondary: string | null
  identityLabel: string
  
  // Skills
  selectedSkillsUsed: string[]
  representedSkillsInWeek: string[]
  underexpressedSkills: string[]
  
  // [PHASE 2 MULTI-SKILL] Broader skill coverage contract
  broaderSkillCoverage: BroaderSkillCoverageContract | null
  
  // Schedule
  scheduleModeUsed: 'static' | 'flexible'
  baselineSessions: number
  currentSessions: number
  frequencyWasAdapted: boolean
  frequencyAdaptationReason: string | null
  
  // Duration
  durationModeUsed: 'static' | 'adaptive'
  durationTargetUsed: number
  
  // Experience & Equipment
  experienceLevelUsed: string
  equipmentUsed: string[]
  weightedLoadingUsed: boolean
  
  // Flexibility
  flexibilityGoalsUsed: string[]
  flexibilityIntegrated: boolean
  
  // Training Path
  trainingPathUsed: string | null
  goalCategoriesUsed: string[]
  
  // Style
  trainingMethodsUsed: string[]
  sessionStyleUsed: string | null
  
  // [PHASE 2] Actual method application from session structures
  methodPreferencesApplied: MethodApplicationSummary
  methodPreferencesMateriality: MethodMaterialityReport
  
  // Diagnostics considered
  jointCautionsConsidered: string[]
  weakPointAddressed: string | null
  limiterAddressed: string | null
  recoveryLevelUsed: string | null
  
  // Explanation quality
  explanationFactors: Array<{
    factor: string
    label: string
    wasUsed: boolean
    isVisible: boolean
    importance: 'high' | 'medium' | 'low'
  }>
  hiddenTruthNotSurfaced: string[]
  
  // Summary
  truthfulSummary: string
  explanationQualityVerdict: 'EXPLANATION_STRONG' | 'EXPLANATION_THIN' | 'GENERATION_MAY_BE_RIGHT_BUT_PROOF_IS_WEAK' | 'USER_TRUTH_NOT_SUFFICIENTLY_SURFACED'
}

// =============================================================================
// AUDIT FUNCTIONS
// =============================================================================

/**
 * Generate field-by-field truth usage audit.
 */
export function generateTruthFieldAudit(): TruthFieldAudit[] {
  return TRUTH_FIELD_REGISTRY
}

/**
 * Get fields that are used but not displayed.
 */
export function getHiddenGenerativeFields(): TruthFieldAudit[] {
  return TRUTH_FIELD_REGISTRY.filter(f => f.verdict === 'USED_BUT_NOT_DISPLAYED')
}

/**
 * Get fields that are stored but unused.
 */
export function getUnusedStoredFields(): TruthFieldAudit[] {
  return TRUTH_FIELD_REGISTRY.filter(f => f.verdict === 'STORED_BUT_UNUSED')
}

/**
 * Get fields fully connected end-to-end.
 */
export function getFullyConnectedFields(): TruthFieldAudit[] {
  return TRUTH_FIELD_REGISTRY.filter(f => f.verdict === 'FULLY_CONNECTED')
}

/**
 * Build the normalized program truth explanation object.
 */
export function buildProgramTruthExplanation(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile | null
): ProgramTruthExplanation {
  // Derive explanation factors
  const explanationFactors: ProgramTruthExplanation['explanationFactors'] = []
  const hiddenTruthNotSurfaced: string[] = []
  
  // Check each important field
  const importantFields = [
    { factor: 'primaryGoal', label: 'Primary Goal', isVisible: true, importance: 'high' as const },
    { factor: 'secondaryGoal', label: 'Secondary Goal', isVisible: false, importance: 'medium' as const },
    { factor: 'selectedSkills', label: 'Skill Selection', isVisible: true, importance: 'high' as const },
    { factor: 'experienceLevel', label: 'Experience Level', isVisible: false, importance: 'high' as const },
    { factor: 'equipmentAvailable', label: 'Equipment', isVisible: false, importance: 'medium' as const },
    { factor: 'jointCautions', label: 'Joint Safety', isVisible: false, importance: 'high' as const },
    { factor: 'trainingMethodPreferences', label: 'Training Style', isVisible: false, importance: 'medium' as const },
    { factor: 'weightedLoading', label: 'Weighted Loading', isVisible: false, importance: 'medium' as const },
    { factor: 'recoveryQuality', label: 'Recovery Status', isVisible: false, importance: 'medium' as const },
    { factor: 'flexibilityGoals', label: 'Flexibility Goals', isVisible: false, importance: 'low' as const },
  ]
  
  for (const field of importantFields) {
    const wasUsed = checkFieldWasUsed(field.factor, program, profile)
    explanationFactors.push({
      factor: field.factor,
      label: field.label,
      wasUsed,
      isVisible: field.isVisible,
      importance: field.importance,
    })
    
    if (wasUsed && !field.isVisible) {
      hiddenTruthNotSurfaced.push(field.label)
    }
  }
  
  // ==========================================================================
  // [PHASE 1 SPINE] PREFER AUTHORITATIVE SPINE CONTRACT IF PRESENT
  // ==========================================================================
  // If the program has a saved authoritative spine contract, prefer it over
  // recomputing from disparate fields. This ensures display parity with build.
  // ==========================================================================
  const spineContract = (program as { authoritativeSpineContract?: {
    representedSkillsThisCycle?: string[]
    deferredSkillsThisCycle?: Array<{ skill: string; reason: string }>
    materiallyConsideredSkills?: Array<{ skill: string; role: string; deferralReason: string | null }>
  } | null }).authoritativeSpineContract
  
  if (spineContract) {
    console.log('[ai-truth-audit] Using authoritative spine contract for truth explanation', {
      representedSkillsCount: spineContract.representedSkillsThisCycle?.length || 0,
      deferredSkillsCount: spineContract.deferredSkillsThisCycle?.length || 0,
    })
  }
  
  // Calculate underexpressed skills - prefer spine contract data if available
  const selectedSkills = spineContract?.materiallyConsideredSkills?.map(s => s.skill) 
    || program.selectedSkills 
    || profile?.selectedSkills 
    || []
  const representedSkills = spineContract?.representedSkillsThisCycle 
    || program.representedSkills 
    || []
  const underexpressedSkills = selectedSkills.filter(s => !representedSkills.includes(s))
  
  // [PHASE 2 MULTI-SKILL] Build broader skill coverage contract from weeklyRepresentation
  let broaderSkillCoverage: BroaderSkillCoverageContract | null = null
  const weeklyRep = (program as { weeklyRepresentation?: {
    policies: Array<{
      skill: string
      selectedRank: 'headline' | 'secondary' | 'tertiary' | 'optional'
      targetExposure: number
      actualExposure: { direct: number; technical: number; support: number; warmupOnly: number; total: number }
      representationVerdict: string
      narrowingPoint: string | null
    }>
    coverageRatio: number
    verdictCounts: {
      headline_represented: number
      broadly_represented: number
      support_only: number
      selected_but_underexpressed: number
      filtered_out_by_constraints: number
    }
  }}).weeklyRepresentation
  
  if (weeklyRep?.policies) {
    const entries: SkillCoverageEntry[] = weeklyRep.policies.map(p => {
      // Map selectedRank to priorityLevel
      const priorityLevel = p.selectedRank === 'headline' ? 'primary' as const
        : p.selectedRank === 'secondary' ? 'secondary' as const
        : p.selectedRank === 'tertiary' ? 'tertiary' as const
        : 'support' as const
      
      // Map representationVerdict to coverageStatus
      let coverageStatus: SkillCoverageEntry['coverageStatus']
      let deferralReason: string | null = null
      
      if (p.representationVerdict === 'headline_represented') {
        coverageStatus = 'fully_represented'
      } else if (p.representationVerdict === 'broadly_represented') {
        coverageStatus = 'broadly_represented'
      } else if (p.representationVerdict === 'support_only') {
        coverageStatus = 'support_only'
        deferralReason = 'Limited to support role due to primary goal emphasis'
      } else if (p.representationVerdict === 'selected_but_underexpressed') {
        coverageStatus = 'deferred'
        deferralReason = p.narrowingPoint === 'equipment_constraint' 
          ? 'Equipment limitations'
          : p.narrowingPoint === 'insufficient_main_slot_allocation'
            ? 'Reduced to protect primary goal emphasis'
            : p.narrowingPoint === 'below_minimum_exposure_target'
              ? 'Weekly session count limits broader coverage'
              : 'Primary goal dominance this cycle'
      } else if (p.representationVerdict === 'filtered_out_by_constraints') {
        coverageStatus = 'deferred'
        deferralReason = 'Filtered out by equipment or progression constraints'
      } else {
        coverageStatus = 'deferred'
        deferralReason = 'Scheduling constraints'
      }
      
      return {
        skill: p.skill,
        priorityLevel,
        targetExposure: p.targetExposure,
        allocatedSessions: p.targetExposure,
        materiallyExpressedSessions: p.actualExposure.direct + p.actualExposure.technical,
        coverageStatus,
        deferralReason,
      }
    })
    
    // Categorize skills
    const representedSkillsFromContract = entries
      .filter(e => e.coverageStatus === 'fully_represented' || e.coverageStatus === 'broadly_represented')
      .map(e => e.skill)
    
    const deferredSkillsFromContract = entries
      .filter(e => e.coverageStatus === 'deferred')
      .map(e => ({ skill: e.skill, reason: e.deferralReason || 'Scheduling constraints' }))
    
    const supportOnlySkillsFromContract = entries
      .filter(e => e.coverageStatus === 'support_only')
      .map(e => e.skill)
    
    // Determine overall verdict
    const totalSelected = entries.length
    const materiallyRepresented = entries.filter(e => 
      e.coverageStatus === 'fully_represented' || e.coverageStatus === 'broadly_represented'
    ).length
    const coverageRatioComputed = totalSelected > 0 ? materiallyRepresented / totalSelected : 0
    
    const coverageVerdict = coverageRatioComputed >= 0.7 ? 'strong'
      : coverageRatioComputed >= 0.5 ? 'adequate'
      : 'weak'
    
    broaderSkillCoverage = {
      entries,
      coverageVerdict,
      representedSkills: representedSkillsFromContract,
      deferredSkills: deferredSkillsFromContract,
      supportOnlySkills: supportOnlySkillsFromContract,
    }
    
    console.log('[PHASE2-MULTI-SKILL-COVERAGE-CONTRACT]', {
      totalSelectedSkills: totalSelected,
      materiallyRepresentedCount: materiallyRepresented,
      supportOnlyCount: supportOnlySkillsFromContract.length,
      deferredCount: deferredSkillsFromContract.length,
      coverageRatio: coverageRatioComputed,
      coverageVerdict,
      verdict: 'MULTI_SKILL_COVERAGE_CONTRACT_BUILT',
    })
  }
  
  // Determine explanation quality
  const highImportanceHidden = explanationFactors.filter(f => f.importance === 'high' && f.wasUsed && !f.isVisible).length
  const totalHidden = hiddenTruthNotSurfaced.length
  
  let explanationQualityVerdict: ProgramTruthExplanation['explanationQualityVerdict']
  if (totalHidden === 0) {
    explanationQualityVerdict = 'EXPLANATION_STRONG'
  } else if (highImportanceHidden >= 2) {
    explanationQualityVerdict = 'USER_TRUTH_NOT_SUFFICIENTLY_SURFACED'
  } else if (totalHidden >= 4) {
    explanationQualityVerdict = 'GENERATION_MAY_BE_RIGHT_BUT_PROOF_IS_WEAK'
  } else {
    explanationQualityVerdict = 'EXPLANATION_THIN'
  }
  
  // Build truthful summary
  const summaryParts: string[] = []
  if (program.primaryGoal) {
    summaryParts.push(`Primary: ${program.primaryGoal.replace(/_/g, ' ')}`)
  }
  if (program.secondaryGoal) {
    summaryParts.push(`Secondary: ${program.secondaryGoal.replace(/_/g, ' ')}`)
  }
  if (selectedSkills.length > 0) {
    summaryParts.push(`Skills: ${selectedSkills.slice(0, 3).join(', ')}${selectedSkills.length > 3 ? '...' : ''}`)
  }
  if (profile?.experienceLevel) {
    summaryParts.push(`Level: ${profile.experienceLevel}`)
  }
  
  return {
    identityPrimary: program.primaryGoal || null,
    identitySecondary: program.secondaryGoal || null,
    identityLabel: program.goalLabel || '',
    
    selectedSkillsUsed: selectedSkills,
    representedSkillsInWeek: representedSkills,
    underexpressedSkills,
    
    // [PHASE 2 MULTI-SKILL] Broader skill coverage contract
    broaderSkillCoverage,
    
    scheduleModeUsed: program.scheduleMode || 'flexible',
    baselineSessions: program.trainingDaysPerWeek || 4,
    currentSessions: program.sessions?.length || 0,
    frequencyWasAdapted: program.flexibleFrequencyRootCause?.wasModifiedFromBaseline || false,
    frequencyAdaptationReason: program.flexibleFrequencyRootCause?.reasonDetails || null,
    
    durationModeUsed: program.sessionDurationMode || 'static',
    durationTargetUsed: program.sessionLength || 60,
    
    experienceLevelUsed: program.experienceLevel || profile?.experienceLevel || 'intermediate',
    equipmentUsed: program.equipmentProfile?.available || profile?.equipmentAvailable || [],
    weightedLoadingUsed: program.weightedStrengthPrescription?.hasWeightedData || false,
    
    // [FLEXIBILITY-TRUTH-CONTRACT] Prefer program.selectedFlexibility (durable) over profile (ephemeral)
    // This ensures saved programs retain their generation-time flexibility goals
    flexibilityGoalsUsed: program.selectedFlexibility || program.generationTruthSnapshot?.selectedFlexibility || profile?.selectedFlexibility || [],
    flexibilityIntegrated: (program.selectedFlexibility?.length || program.generationTruthSnapshot?.selectedFlexibility?.length || profile?.selectedFlexibility?.length || 0) > 0,
    
    trainingPathUsed: program.trainingPathType || profile?.trainingPathType || null,
    goalCategoriesUsed: program.goalCategories || profile?.goalCategories || [],
    
    // [METHOD-TRUTH-CONTRACT] Prefer program.trainingMethodPreferences (durable) over profile (ephemeral)
    // This ensures saved programs retain their generation-time training method preferences
    trainingMethodsUsed: program.trainingMethodPreferences || program.generationTruthSnapshot?.trainingMethodPreferences || profile?.trainingMethodPreferences || [],
    // [SESSION-STYLE-TRUTH] Prefer program.sessionStylePreference (durable) over profile (ephemeral)
    // This ensures saved programs retain their generation-time session style preference
    sessionStyleUsed: program.sessionStylePreference || program.generationTruthSnapshot?.sessionStylePreference || profile?.sessionStylePreference || null,
    // [SESSION-STYLE-MATERIALITY] Track whether style materially affected construction
    sessionStyleMateriallyApplied: program.sessionStyleMateriality?.styleMateriallyApplied || false,
    sessionStyleAdjustmentReason: program.sessionStyleMateriality?.adjustmentReason || null,
    
    // [PHASE 2] Actual applied methods from session structures
    methodPreferencesApplied: aggregateActualAppliedMethods(program),
    // [METHOD-TRUTH-CONTRACT] Use program-first truth for materiality computation
    methodPreferencesMateriality: computeMethodMateriality(
      program, 
      program.trainingMethodPreferences || program.generationTruthSnapshot?.trainingMethodPreferences || profile?.trainingMethodPreferences || []
    ),
    
    // [AI-TRUTH-PERSISTENCE] Prefer program.jointCautions (durable) over profile (ephemeral)
    // This ensures saved programs retain their generation-time joint cautions
    jointCautionsConsidered: program.jointCautions || program.generationTruthSnapshot?.jointCautions || profile?.jointCautions || [],
    weakPointAddressed: program.weakPointDetection?.primaryFocus || null,
    limiterAddressed: profile?.primaryLimitation || null,
    recoveryLevelUsed: program.recoveryLevel || profile?.recoveryQuality || null,
    
    // [SKILL-STRENGTH-TRUTH-CONTRACT] Prefer program.skillStrengthProfile (durable) over snapshot/profile
    // This ensures saved programs retain the exact skill/strength truth used to generate them
    skillStrengthProfile: program.skillStrengthProfile || {
      plancheProgression: program.generationTruthSnapshot?.plancheProgression || profile?.plancheProgression || null,
      frontLeverProgression: program.generationTruthSnapshot?.frontLeverProgression || profile?.frontLeverProgression || null,
      hspuCapability: program.generationTruthSnapshot?.hspuProgression || profile?.hspu || null,
      weightedPullUp: program.generationTruthSnapshot?.weightedPullUp || profile?.weightedPullUp || null,
      weightedDip: program.generationTruthSnapshot?.weightedDip || profile?.weightedDip || null,
      pullUpCapacity: profile?.pullUps || null,
      dipCapacity: profile?.dips || null,
      wallHspuCapacity: profile?.wallHSPU || null,
      experienceLevel: program.experienceLevel || profile?.experienceLevel || 'intermediate',
    },
    skillStrengthMateriallyApplied: !!(
      program.skillStrengthProfile?.plancheProgression ||
      program.skillStrengthProfile?.frontLeverProgression ||
      program.skillStrengthProfile?.weightedPullUp ||
      program.skillStrengthProfile?.weightedDip
    ),
    
    // [CURRENT-PROGRESSION-TRUTH-CONTRACT] Include current working progressions contract
    // This shows the user their true current ability vs historical ceiling
    currentWorkingProgressions: program.currentWorkingProgressions || null,
    progressionTruthNote: program.currentWorkingProgressions?.anyConservativeStart
      ? 'Current progression is set conservatively based on training recency and skill state.'
      : null,
    
    // [PHASE 6] Output quality materiality - proves how well profile shapes actual sessions
    outputQualityReport: computeOutputQualityMateriality(
      program,
      program.experienceLevel || profile?.experienceLevel || 'intermediate'
    ),
    
    // [PHASE 7] Visible difference verdict - for use when comparing before/after rebuild
    // This is populated by the calling code when a previousProgram is available
    visibleDifferenceReport: null as ProgramDiffReport | null,
    
    explanationFactors,
    hiddenTruthNotSurfaced,
    
    truthfulSummary: summaryParts.join(' | '),
    explanationQualityVerdict,
  }
}

// =============================================================================
// [PHASE 2] METHOD PREFERENCES MATERIALITY HELPERS
// =============================================================================

/**
 * Aggregate actually applied methods from all session styleMetadata.
 * This tells us what methods were REALLY used in the generated program.
 */
function aggregateActualAppliedMethods(program: AdaptiveProgram): MethodApplicationSummary {
  const sessions = program.sessions || []
  const allAppliedMethods = new Set<string>()
  const perSessionMethods: MethodApplicationSummary['perSessionMethods'] = []
  
  let sessionsWithSupersets = 0
  let sessionsWithCircuits = 0
  let sessionsWithDensity = 0
  let sessionsWithOnlyStraightSets = 0
  
  for (const session of sessions) {
    const styleMetadata = (session as { styleMetadata?: {
      primaryStyle?: string
      hasSupersetsApplied?: boolean
      hasCircuitsApplied?: boolean
      hasDensityApplied?: boolean
      structureDescription?: string
      appliedMethods?: string[]
    }}).styleMetadata
    
    const appliedMethods = styleMetadata?.appliedMethods || []
    const hasSuperset = styleMetadata?.hasSupersetsApplied || appliedMethods.includes('supersets')
    const hasCircuit = styleMetadata?.hasCircuitsApplied || appliedMethods.includes('circuits')
    const hasDensity = styleMetadata?.hasDensityApplied || appliedMethods.includes('density_blocks')
    
    // Track per-session
    perSessionMethods.push({
      dayNumber: session.dayNumber,
      dayFocus: session.focus || 'mixed',
      appliedMethods,
      hasSuperset,
      hasCircuit,
      hasDensity,
      structureDescription: styleMetadata?.structureDescription || 'Standard structure',
    })
    
    // Add to global set
    for (const method of appliedMethods) {
      allAppliedMethods.add(method)
    }
    
    // Count session types
    if (hasSuperset) sessionsWithSupersets++
    if (hasCircuit) sessionsWithCircuits++
    if (hasDensity) sessionsWithDensity++
    if (!hasSuperset && !hasCircuit && !hasDensity) sessionsWithOnlyStraightSets++
  }
  
  // Build expression summary
  const summaryParts: string[] = []
  if (sessionsWithSupersets > 0) {
    summaryParts.push(`supersets in ${sessionsWithSupersets} session${sessionsWithSupersets > 1 ? 's' : ''}`)
  }
  if (sessionsWithCircuits > 0) {
    summaryParts.push(`circuits in ${sessionsWithCircuits} session${sessionsWithCircuits > 1 ? 's' : ''}`)
  }
  if (sessionsWithDensity > 0) {
    summaryParts.push(`density blocks in ${sessionsWithDensity} session${sessionsWithDensity > 1 ? 's' : ''}`)
  }
  
  const expressionSummary = summaryParts.length > 0
    ? `Your training style preferences were applied: ${summaryParts.join(', ')}.`
    : 'Sessions use focused straight-set structure for optimal skill development.'
  
  return {
    actuallyApplied: Array.from(allAppliedMethods),
    perSessionMethods,
    sessionsWithSupersets,
    sessionsWithCircuits,
    sessionsWithDensity,
    sessionsWithOnlyStraightSets,
    expressionSummary,
  }
}

/**
 * Compute how well user's method preferences were materialized in the program.
 */
function computeMethodMateriality(
  program: AdaptiveProgram,
  userSelectedMethods: string[]
): MethodMaterialityReport {
  const applicationSummary = aggregateActualAppliedMethods(program)
  const appliedMethods = applicationSummary.actuallyApplied
  
  // Handle no preferences case
  if (!userSelectedMethods || userSelectedMethods.length === 0) {
    return {
      userSelectedMethods: [],
      appliedMethods,
      selectedButNotApplied: [],
      nonApplicationReasons: [],
      verdict: 'NO_PREFERENCES',
      explanationForUser: 'No specific training method preferences were selected. Sessions use standard coaching structure.',
    }
  }
  
  // Find what was selected but not applied
  const selectedButNotApplied = userSelectedMethods.filter(
    method => !appliedMethods.includes(method) && method !== 'straight_sets'
  )
  
  // Build reasons for non-application
  const nonApplicationReasons: MethodMaterialityReport['nonApplicationReasons'] = []
  for (const method of selectedButNotApplied) {
    let reason = 'Method not suitable for session composition'
    if (method === 'circuits') {
      reason = 'Circuits require 3+ compatible exercises; skill-focused sessions prioritize quality'
    } else if (method === 'density_blocks') {
      reason = 'Density blocks best suited for conditioning segments'
    } else if (method === 'supersets') {
      reason = 'Supersets require compatible exercise pairs; high-skill work protected'
    }
    nonApplicationReasons.push({ method, reason })
  }
  
  // Calculate verdict
  const totalSelected = userSelectedMethods.filter(m => m !== 'straight_sets').length
  const totalApplied = appliedMethods.filter(m => m !== 'straight_sets').length
  const matchedCount = userSelectedMethods.filter(m => appliedMethods.includes(m) && m !== 'straight_sets').length
  
  let verdict: MethodMaterialityReport['verdict']
  if (totalSelected === 0) {
    verdict = 'NO_PREFERENCES'
  } else if (matchedCount === totalSelected) {
    verdict = 'FULLY_EXPRESSED'
  } else if (matchedCount >= totalSelected * 0.5) {
    verdict = 'MOSTLY_EXPRESSED'
  } else if (totalApplied > 0) {
    verdict = 'LIGHTLY_EXPRESSED'
  } else {
    verdict = 'NOT_EXPRESSED'
  }
  
  // Build user-facing explanation
  let explanationForUser: string
  switch (verdict) {
    case 'FULLY_EXPRESSED':
      explanationForUser = `Your selected training methods (${userSelectedMethods.filter(m => m !== 'straight_sets').map(m => m.replace(/_/g, ' ')).join(', ')}) were fully integrated into your program.`
      break
    case 'MOSTLY_EXPRESSED':
      explanationForUser = `Most of your training style preferences were applied. ${applicationSummary.expressionSummary}`
      break
    case 'LIGHTLY_EXPRESSED':
      explanationForUser = `Your training style preferences were selectively applied where appropriate. ${selectedButNotApplied.length > 0 ? `Some methods (${selectedButNotApplied.join(', ')}) were limited to protect skill quality.` : ''}`
      break
    case 'NOT_EXPRESSED':
      explanationForUser = `Your selected methods weren't applied this week because advanced skill work requires focused straight-set training. Future conditioning or accessory phases may use your preferred methods.`
      break
    default:
      explanationForUser = 'Sessions use standard coaching structure.'
  }
  
  return {
    userSelectedMethods,
    appliedMethods,
    selectedButNotApplied,
    nonApplicationReasons,
    verdict,
    explanationForUser,
  }
}

// =============================================================================
// [PHASE 6] OUTPUT QUALITY MATERIALITY HELPERS
// =============================================================================

interface OutputQualityReport {
  sessionRoleDifferentiation: {
    distinctRolesCount: number
    totalSessions: number
    rolesUsed: string[]
    verdict: 'WELL_DIFFERENTIATED' | 'PARTIALLY_DIFFERENTIATED' | 'GENERIC'
  }
  exerciseComplexity: {
    averageExercisesPerSession: number
    skillExercisesCount: number
    strengthExercisesCount: number
    accessoryExercisesCount: number
    advancedProgressionsUsed: string[]
    verdict: 'ADVANCED_EXPRESSION' | 'MODERATE_EXPRESSION' | 'BASIC_EXPRESSION'
  }
  loadingQuality: {
    hasWeightedExercises: boolean
    weightedExerciseCount: number
    hasHoldTargets: boolean
    hasRepProgressions: boolean
    verdict: 'STRONG_LOADING' | 'MODERATE_LOADING' | 'BASIC_LOADING'
  }
  overallVerdict: 'STRONGLY_EXPRESSED' | 'PARTIALLY_EXPRESSED' | 'UNDEREXPRESSED'
  explanationForUser: string
}

/**
 * Compute how well the athlete's profile is expressed in the actual output.
 * This evaluates session differentiation, exercise complexity, and loading quality.
 */
function computeOutputQualityMateriality(
  program: AdaptiveProgram,
  experienceLevel: string
): OutputQualityReport {
  const sessions = program.sessions || []
  
  // 1. Analyze session role differentiation
  const sessionRoles = new Set<string>()
  for (const session of sessions) {
    const role = (session as { sessionIntent?: { sessionType?: string } }).sessionIntent?.sessionType
      || session.focus 
      || 'mixed'
    sessionRoles.add(role)
  }
  
  const distinctRolesCount = sessionRoles.size
  const totalSessions = sessions.length
  const roleVerdict = distinctRolesCount >= Math.ceil(totalSessions * 0.5)
    ? 'WELL_DIFFERENTIATED'
    : distinctRolesCount >= 2
      ? 'PARTIALLY_DIFFERENTIATED'
      : 'GENERIC'
  
  // 2. Analyze exercise complexity
  let totalExercises = 0
  let skillExercises = 0
  let strengthExercises = 0
  let accessoryExercises = 0
  const advancedProgressions = new Set<string>()
  
  for (const session of sessions) {
    const exercises = session.exercises || []
    totalExercises += exercises.length
    
    for (const ex of exercises) {
      const category = (ex as { category?: string }).category || ''
      const name = ex.name?.toLowerCase() || ''
      
      if (category === 'skill' || name.includes('planche') || name.includes('lever') || name.includes('hspu')) {
        skillExercises++
        // Detect advanced progressions
        if (name.includes('straddle') || name.includes('full') || name.includes('advanced')) {
          advancedProgressions.add(ex.name || '')
        }
      } else if (category === 'strength' || name.includes('pull') || name.includes('dip') || name.includes('row')) {
        strengthExercises++
      } else {
        accessoryExercises++
      }
    }
  }
  
  const avgExercises = totalSessions > 0 ? totalExercises / totalSessions : 0
  const isAdvanced = experienceLevel === 'advanced'
  const exerciseVerdict = isAdvanced 
    ? (avgExercises >= 6 && advancedProgressions.size > 0 ? 'ADVANCED_EXPRESSION' 
       : avgExercises >= 5 ? 'MODERATE_EXPRESSION' 
       : 'BASIC_EXPRESSION')
    : (avgExercises >= 5 ? 'ADVANCED_EXPRESSION' 
       : avgExercises >= 4 ? 'MODERATE_EXPRESSION' 
       : 'BASIC_EXPRESSION')
  
  // 3. Analyze loading quality
  let weightedExerciseCount = 0
  let hasHoldTargets = false
  let hasRepProgressions = false
  
  for (const session of sessions) {
    const exercises = session.exercises || []
    for (const ex of exercises) {
      const prescription = (ex as { prescription?: { weightedLoad?: number; holdDuration?: number; reps?: number | string } }).prescription
      if (prescription?.weightedLoad && prescription.weightedLoad > 0) {
        weightedExerciseCount++
      }
      if (prescription?.holdDuration && prescription.holdDuration > 0) {
        hasHoldTargets = true
      }
      if (prescription?.reps && prescription.reps.toString().includes('-')) {
        hasRepProgressions = true
      }
    }
  }
  
  const hasWeightedExercises = weightedExerciseCount > 0 || program.weightedStrengthPrescription?.hasWeightedData
  const loadingVerdict = hasWeightedExercises && (hasHoldTargets || hasRepProgressions)
    ? 'STRONG_LOADING'
    : hasHoldTargets || hasRepProgressions
      ? 'MODERATE_LOADING'
      : 'BASIC_LOADING'
  
  // 4. Overall verdict
  const verdictScores = {
    sessionRole: roleVerdict === 'WELL_DIFFERENTIATED' ? 2 : roleVerdict === 'PARTIALLY_DIFFERENTIATED' ? 1 : 0,
    exercise: exerciseVerdict === 'ADVANCED_EXPRESSION' ? 2 : exerciseVerdict === 'MODERATE_EXPRESSION' ? 1 : 0,
    loading: loadingVerdict === 'STRONG_LOADING' ? 2 : loadingVerdict === 'MODERATE_LOADING' ? 1 : 0,
  }
  const totalScore = verdictScores.sessionRole + verdictScores.exercise + verdictScores.loading
  
  const overallVerdict = totalScore >= 5 
    ? 'STRONGLY_EXPRESSED' 
    : totalScore >= 3 
      ? 'PARTIALLY_EXPRESSED' 
      : 'UNDEREXPRESSED'
  
  // 5. Build explanation for user
  let explanationForUser = ''
  if (overallVerdict === 'STRONGLY_EXPRESSED') {
    explanationForUser = `Your ${experienceLevel} profile is well-expressed: ${distinctRolesCount} distinct session types, ${avgExercises.toFixed(1)} exercises/session, ${advancedProgressions.size > 0 ? `advanced progressions (${Array.from(advancedProgressions).slice(0, 2).join(', ')})` : 'appropriate complexity'}.`
  } else if (overallVerdict === 'PARTIALLY_EXPRESSED') {
    explanationForUser = `Your profile shapes the program with ${distinctRolesCount} session types and ${avgExercises.toFixed(1)} exercises/session. ${isAdvanced ? 'Some advanced elements are included.' : ''}`
  } else {
    explanationForUser = `Sessions use foundational structure appropriate for recovery or joint protection considerations.`
  }
  
  return {
    sessionRoleDifferentiation: {
      distinctRolesCount,
      totalSessions,
      rolesUsed: Array.from(sessionRoles),
      verdict: roleVerdict,
    },
    exerciseComplexity: {
      averageExercisesPerSession: avgExercises,
      skillExercisesCount: skillExercises,
      strengthExercisesCount: strengthExercises,
      accessoryExercisesCount: accessoryExercises,
      advancedProgressionsUsed: Array.from(advancedProgressions),
      verdict: exerciseVerdict,
    },
    loadingQuality: {
      hasWeightedExercises: hasWeightedExercises || false,
      weightedExerciseCount,
      hasHoldTargets,
      hasRepProgressions,
      verdict: loadingVerdict,
    },
    overallVerdict,
    explanationForUser,
  }
}

/**
 * Helper to check if a field was materially used.
 */
function checkFieldWasUsed(
  fieldName: string, 
  program: AdaptiveProgram, 
  profile: CanonicalProgrammingProfile | null
): boolean {
  switch (fieldName) {
    case 'primaryGoal':
      return !!program.primaryGoal
    case 'secondaryGoal':
      return !!program.secondaryGoal
    case 'selectedSkills':
      return (program.selectedSkills?.length || 0) > 0
    case 'experienceLevel':
      return !!program.experienceLevel
    case 'equipmentAvailable':
      return (program.equipmentProfile?.available?.length || 0) > 0
    case 'jointCautions':
      return (profile?.jointCautions?.length || 0) > 0
    case 'trainingMethodPreferences':
      return (profile?.trainingMethodPreferences?.length || 0) > 0
    case 'weightedLoading':
      return program.weightedStrengthPrescription?.hasWeightedData || false
    case 'recoveryQuality':
      return !!program.recoveryLevel || !!profile?.recoveryQuality
    case 'flexibilityGoals':
      return (profile?.selectedFlexibility?.length || 0) > 0
    default:
      return false
  }
}

// =============================================================================
// DEV LOGGING FUNCTIONS
// =============================================================================

/**
 * Log field-by-field truth audit to console (dev only).
 */
export function logTruthFieldAudit(): void {
  if (process.env.NODE_ENV === 'production') return
  
  const audit = generateTruthFieldAudit()
  
  console.log('[AI-TRUTH-AUDIT] ========== FIELD-BY-FIELD USAGE TABLE ==========')
  console.table(audit.map(f => ({
    Field: f.fieldName,
    InProfile: f.existsInCanonicalProfile ? 'YES' : 'NO',
    InBuilder: f.existsInBuilderInputs ? 'YES' : 'NO',
    Generated: f.consumedByGenerator ? 'YES' : 'NO',
    Saved: f.persistedOnSavedProgram ? 'YES' : 'NO',
    Displayed: f.shownOnProgramPage ? 'YES' : 'NO',
    Effect: f.effectType,
    Verdict: f.verdict,
  })))
  
  const fullyConnected = getFullyConnectedFields()
  const hidden = getHiddenGenerativeFields()
  const unused = getUnusedStoredFields()
  
  console.log('[AI-TRUTH-AUDIT] ========== SUMMARY ==========')
  console.log('[AI-TRUTH-AUDIT] Fully connected fields:', fullyConnected.map(f => f.fieldName))
  console.log('[AI-TRUTH-AUDIT] Used but not displayed:', hidden.map(f => f.fieldName))
  console.log('[AI-TRUTH-AUDIT] Stored but unused:', unused.map(f => f.fieldName))
}

/**
 * Log program truth explanation to console (dev only).
 */
export function logProgramTruthExplanation(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile | null
): ProgramTruthExplanation {
  const explanation = buildProgramTruthExplanation(program, profile)
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AI-TRUTH-AUDIT] ========== PROGRAM TRUTH EXPLANATION ==========')
    console.log('[AI-TRUTH-AUDIT] Identity:', {
      primary: explanation.identityPrimary,
      secondary: explanation.identitySecondary,
      label: explanation.identityLabel,
    })
    console.log('[AI-TRUTH-AUDIT] Skills:', {
      selected: explanation.selectedSkillsUsed,
      represented: explanation.representedSkillsInWeek,
      underexpressed: explanation.underexpressedSkills,
    })
    console.log('[AI-TRUTH-AUDIT] Schedule:', {
      mode: explanation.scheduleModeUsed,
      baseline: explanation.baselineSessions,
      current: explanation.currentSessions,
      adapted: explanation.frequencyWasAdapted,
      reason: explanation.frequencyAdaptationReason,
    })
    console.log('[AI-TRUTH-AUDIT] Hidden truth not surfaced:', explanation.hiddenTruthNotSurfaced)
    console.log('[AI-TRUTH-AUDIT] Explanation quality verdict:', explanation.explanationQualityVerdict)
    console.log('[AI-TRUTH-AUDIT] Truthful summary:', explanation.truthfulSummary)
  }
  
  return explanation
}

/**
 * Log explanation gap analysis (dev only).
 */
export function logExplanationGapAudit(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile | null
): void {
  if (process.env.NODE_ENV === 'production') return
  
  const explanation = buildProgramTruthExplanation(program, profile)
  
  // Top 5 truths that SHOULD be visible
  const shouldBeVisible = explanation.explanationFactors
    .filter(f => f.wasUsed && !f.isVisible)
    .sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 }
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    })
    .slice(0, 5)
    .map(f => f.label)
  
  // Top 5 truths currently visible
  const currentlyVisible = explanation.explanationFactors
    .filter(f => f.wasUsed && f.isVisible)
    .slice(0, 5)
    .map(f => f.label)
  
  // Top 5 truths currently invisible but important
  const invisibleButImportant = explanation.explanationFactors
    .filter(f => f.wasUsed && !f.isVisible && f.importance !== 'low')
    .slice(0, 5)
    .map(f => f.label)
  
  console.log('[AI-TRUTH-AUDIT] ========== EXPLANATION GAP AUDIT ==========')
  console.log('[AI-TRUTH-AUDIT] Top 5 truths that SHOULD be visible:', shouldBeVisible)
  console.log('[AI-TRUTH-AUDIT] Top 5 truths currently visible:', currentlyVisible)
  console.log('[AI-TRUTH-AUDIT] Top 5 truths currently invisible but important:', invisibleButImportant)
  console.log('[AI-TRUTH-AUDIT] Verdict:', explanation.explanationQualityVerdict)
}

// =============================================================================
// [PHASE 7] VISIBLE PROGRAM DIFFERENCE ANALYSIS
// =============================================================================

export type VisibleDifferenceVerdict = 
  | 'NO_MEANINGFUL_CHANGE_SAME_INPUT_SAME_OUTPUT'
  | 'INTERNAL_CHANGE_ONLY_NOT_VISIBLE'
  | 'DISPLAY_HID_REAL_CHANGE'
  | 'STALE_PROGRAM_RENDERED'
  | 'PARTIAL_REUSE_SUPPRESSED_FRESH_OUTPUT'
  | 'TRUE_MEANINGFUL_CHANGE_VISIBLE'
  | 'NO_PREVIOUS_PROGRAM'

export interface ProgramDiffReport {
  verdict: VisibleDifferenceVerdict
  
  // Macro level
  programIdChanged: boolean
  createdAtChanged: boolean
  goalChanged: boolean
  scheduleChanged: boolean
  
  // Session level
  sessionCountChanged: boolean
  sessionCountBefore: number
  sessionCountAfter: number
  sessionTitlesChanged: number // count of changed titles
  sessionFocusChanged: number // count of changed focus areas
  
  // Exercise level
  exercisesAdded: number
  exercisesRemoved: number
  exercisesModified: number
  
  // Prescription level
  prescriptionsModified: number
  
  // Summary
  totalVisibleChanges: number
  userFacingExplanation: string
}

/**
 * Compare two programs to determine if meaningful visible differences exist.
 * This helps prove whether the builder is correctly producing different output
 * or whether display compression is hiding real changes.
 */
export function getProgramVisibleDifferenceVerdict(
  previousProgram: AdaptiveProgram | null,
  nextProgram: AdaptiveProgram
): ProgramDiffReport {
  // No previous program - this is a first build
  if (!previousProgram) {
    return {
      verdict: 'NO_PREVIOUS_PROGRAM',
      programIdChanged: true,
      createdAtChanged: true,
      goalChanged: false,
      scheduleChanged: false,
      sessionCountChanged: false,
      sessionCountBefore: 0,
      sessionCountAfter: nextProgram.sessions?.length || 0,
      sessionTitlesChanged: 0,
      sessionFocusChanged: 0,
      exercisesAdded: 0,
      exercisesRemoved: 0,
      exercisesModified: 0,
      prescriptionsModified: 0,
      totalVisibleChanges: 0,
      userFacingExplanation: 'This is your first program.',
    }
  }
  
  const prevSessions = previousProgram.sessions || []
  const nextSessions = nextProgram.sessions || []
  
  // Macro comparisons
  const programIdChanged = previousProgram.id !== nextProgram.id
  const createdAtChanged = previousProgram.createdAt !== nextProgram.createdAt
  const goalChanged = previousProgram.primaryGoal !== nextProgram.primaryGoal ||
                      previousProgram.secondaryGoal !== nextProgram.secondaryGoal
  const scheduleChanged = previousProgram.scheduleMode !== nextProgram.scheduleMode ||
                          previousProgram.currentWeekFrequency !== nextProgram.currentWeekFrequency
  
  // Session level
  const sessionCountBefore = prevSessions.length
  const sessionCountAfter = nextSessions.length
  const sessionCountChanged = sessionCountBefore !== sessionCountAfter
  
  // Compare session titles and focus
  let sessionTitlesChanged = 0
  let sessionFocusChanged = 0
  const minSessions = Math.min(sessionCountBefore, sessionCountAfter)
  
  for (let i = 0; i < minSessions; i++) {
    const prev = prevSessions[i]
    const next = nextSessions[i]
    
    if (prev.title !== next.title || prev.name !== next.name) {
      sessionTitlesChanged++
    }
    if (prev.focus !== next.focus) {
      sessionFocusChanged++
    }
  }
  
  // Exercise level comparison
  let exercisesAdded = 0
  let exercisesRemoved = 0
  let exercisesModified = 0
  let prescriptionsModified = 0
  
  // Build exercise name sets for comparison
  const prevExerciseNames = new Set<string>()
  const nextExerciseNames = new Set<string>()
  const prevExerciseMap = new Map<string, unknown>()
  const nextExerciseMap = new Map<string, unknown>()
  
  for (const session of prevSessions) {
    for (const ex of (session.exercises || [])) {
      const key = `${session.dayOfWeek || session.dayNumber}-${ex.name}`
      prevExerciseNames.add(key)
      prevExerciseMap.set(key, ex)
    }
  }
  
  for (const session of nextSessions) {
    for (const ex of (session.exercises || [])) {
      const key = `${session.dayOfWeek || session.dayNumber}-${ex.name}`
      nextExerciseNames.add(key)
      nextExerciseMap.set(key, ex)
    }
  }
  
  // Count added/removed exercises
  for (const name of nextExerciseNames) {
    if (!prevExerciseNames.has(name)) {
      exercisesAdded++
    }
  }
  for (const name of prevExerciseNames) {
    if (!nextExerciseNames.has(name)) {
      exercisesRemoved++
    }
  }
  
  // Count modified exercises (same name but different prescription)
  for (const name of nextExerciseNames) {
    if (prevExerciseNames.has(name)) {
      const prevEx = prevExerciseMap.get(name) as { sets?: number; reps?: number | string } | undefined
      const nextEx = nextExerciseMap.get(name) as { sets?: number; reps?: number | string } | undefined
      
      if (prevEx && nextEx) {
        if (prevEx.sets !== nextEx.sets || 
            JSON.stringify(prevEx.reps) !== JSON.stringify(nextEx.reps)) {
          exercisesModified++
          prescriptionsModified++
        }
      }
    }
  }
  
  // Calculate total visible changes
  const totalVisibleChanges = 
    (sessionCountChanged ? 10 : 0) +
    sessionTitlesChanged * 3 +
    sessionFocusChanged * 2 +
    exercisesAdded * 2 +
    exercisesRemoved * 2 +
    exercisesModified +
    prescriptionsModified
  
  // Determine verdict
  let verdict: VisibleDifferenceVerdict
  let userFacingExplanation: string
  
  if (totalVisibleChanges === 0) {
    // Check if IDs are different (meaning generation ran but produced same output)
    if (programIdChanged) {
      verdict = 'NO_MEANINGFUL_CHANGE_SAME_INPUT_SAME_OUTPUT'
      userFacingExplanation = 'Your saved inputs resolved to the same optimal structure, so your plan stayed largely unchanged. This is expected when your profile and goals remain the same.'
    } else {
      verdict = 'STALE_PROGRAM_RENDERED'
      userFacingExplanation = 'The same program is still being displayed.'
    }
  } else if (totalVisibleChanges < 5) {
    verdict = 'INTERNAL_CHANGE_ONLY_NOT_VISIBLE'
    userFacingExplanation = `Minor adjustments made: ${prescriptionsModified > 0 ? `${prescriptionsModified} prescription${prescriptionsModified > 1 ? 's' : ''} refined` : 'internal optimizations applied'}.`
  } else if (totalVisibleChanges < 15) {
    verdict = 'TRUE_MEANINGFUL_CHANGE_VISIBLE'
    const changes: string[] = []
    if (sessionCountChanged) changes.push(`${sessionCountAfter} sessions (was ${sessionCountBefore})`)
    if (exercisesAdded > 0) changes.push(`${exercisesAdded} exercise${exercisesAdded > 1 ? 's' : ''} added`)
    if (exercisesRemoved > 0) changes.push(`${exercisesRemoved} exercise${exercisesRemoved > 1 ? 's' : ''} updated`)
    userFacingExplanation = `Program updated: ${changes.join(', ') || 'structure refined'}.`
  } else {
    verdict = 'TRUE_MEANINGFUL_CHANGE_VISIBLE'
    userFacingExplanation = `Significant restructuring: ${sessionCountAfter} sessions with ${exercisesAdded + exercisesRemoved} exercise changes.`
  }
  
  return {
    verdict,
    programIdChanged,
    createdAtChanged,
    goalChanged,
    scheduleChanged,
    sessionCountChanged,
    sessionCountBefore,
    sessionCountAfter,
    sessionTitlesChanged,
    sessionFocusChanged,
    exercisesAdded,
    exercisesRemoved,
    exercisesModified,
    prescriptionsModified,
    totalVisibleChanges,
    userFacingExplanation,
  }
}
