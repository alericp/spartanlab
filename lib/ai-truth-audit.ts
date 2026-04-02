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
  
  // Calculate underexpressed skills
  const selectedSkills = program.selectedSkills || profile?.selectedSkills || []
  const representedSkills = program.representedSkills || []
  const underexpressedSkills = selectedSkills.filter(s => !representedSkills.includes(s))
  
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
    
    flexibilityGoalsUsed: profile?.selectedFlexibility || [],
    flexibilityIntegrated: (profile?.selectedFlexibility?.length || 0) > 0,
    
    trainingPathUsed: program.trainingPathType || profile?.trainingPathType || null,
    goalCategoriesUsed: program.goalCategories || profile?.goalCategories || [],
    
    trainingMethodsUsed: profile?.trainingMethodPreferences || [],
    // [SESSION-STYLE-TRUTH] Prefer program.sessionStylePreference (durable) over profile (ephemeral)
    // This ensures saved programs retain their generation-time session style preference
    sessionStyleUsed: program.sessionStylePreference || program.generationTruthSnapshot?.sessionStylePreference || profile?.sessionStylePreference || null,
    
    // [PHASE 2] Actual applied methods from session structures
    methodPreferencesApplied: aggregateActualAppliedMethods(program),
    methodPreferencesMateriality: computeMethodMateriality(program, profile?.trainingMethodPreferences || []),
    
    // [AI-TRUTH-PERSISTENCE] Prefer program.jointCautions (durable) over profile (ephemeral)
    // This ensures saved programs retain their generation-time joint cautions
    jointCautionsConsidered: program.jointCautions || program.generationTruthSnapshot?.jointCautions || profile?.jointCautions || [],
    weakPointAddressed: program.weakPointDetection?.primaryFocus || null,
    limiterAddressed: profile?.primaryLimitation || null,
    recoveryLevelUsed: program.recoveryLevel || profile?.recoveryQuality || null,
    
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
