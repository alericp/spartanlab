/**
 * PROGRAM TRUTH EXTRACTOR
 * 
 * =============================================================================
 * CENTRALIZED TRUTH EXTRACTION FOR ALL GENERATION PATHS
 * =============================================================================
 * 
 * This service assembles generation truth BEFORE the builder runs, ensuring
 * all generation paths (onboarding, main build, regenerate, modify, restart)
 * use the same truth extraction logic.
 * 
 * KEY RESPONSIBILITIES:
 * 1. Read user truth from authoritative sources
 * 2. Normalize it into one consistent contract
 * 3. Explicitly mark missing/defaulted/inferred/compressed fields
 * 4. Output both canonical builder input AND pre-generation truth explanation
 * 
 * RULE: Do NOT fabricate values. If a field is missing, mark it as such.
 */

import type { CanonicalProgrammingProfile } from './canonical-profile-service'
import type { AdaptiveProgram, AdaptiveProgramInputs } from './adaptive-program-builder'
import { buildProgramTruthExplanation, type ProgramTruthExplanation } from './ai-truth-audit'

// =============================================================================
// TYPES
// =============================================================================

export type TruthTriggerSource = 'onboarding' | 'main_build' | 'regenerate' | 'modify' | 'restart' | 'unknown'

export type FieldPresenceStatus = 'present' | 'defaulted' | 'inferred' | 'missing' | 'compressed'

export interface MaterialInputPresence {
  field: string
  status: FieldPresenceStatus
  value: unknown
  source: 'profile' | 'builder_inputs' | 'default' | 'inferred' | 'none'
  note?: string
}

export interface TruthExtractionResult {
  // Normalized inputs for the builder
  normalizedInputs: AdaptiveProgramInputs
  
  // Pre-generation truth context
  truthContext: {
    triggerSource: TruthTriggerSource
    extractedAt: string
    profilePresent: boolean
    inputsPresent: boolean
    
    // Material input presence verdicts
    materialInputPresence: MaterialInputPresence[]
    
    // Summary counts
    presentCount: number
    defaultedCount: number
    inferredCount: number
    missingCount: number
    
    // Parity verdict
    verdict: 
      | 'TRUTH_EXTRACTED_SUCCESSFULLY'
      | 'CANONICAL_PROFILE_COMPLETE'
      | 'FIELDS_DEFAULTED_PRESENT'
      | 'FIELDS_MISSING_REQUIRES_BACKFILL'
      | 'PARTIAL_TRUTH_AVAILABLE'
  }
  
  // Canonical profile snapshot for saving with program
  profileSnapshot: Partial<CanonicalProgrammingProfile>
}

// =============================================================================
// MATERIAL FIELDS TO AUDIT
// =============================================================================

const MATERIAL_FIELDS = [
  'primaryGoal',
  'secondaryGoal',
  'selectedSkills',
  'selectedStrength',
  'selectedFlexibility',
  'trainingStyle',
  'trainingPathType',
  'goalCategories',
  'experienceLevel',
  'scheduleMode',
  'trainingDaysPerWeek',
  'sessionDurationMode',
  'sessionLengthMinutes',
  'equipment',
  'bodyweight',
  'sex',
  'jointCautions',
  'weakestArea',
  'pullUpMax',
  'dipMax',
  'frontLeverProgression',
  'plancheProgression',
  'weightedPullUp',
  'weightedDip',
  'recoveryQuality',
  // [AI-TRUTH-PERSISTENCE] High-priority generation fields
  'trainingMethodPreferences',
  'sessionStylePreference',
] as const

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULTS: Record<string, unknown> = {
  primaryGoal: 'skill_acquisition',
  secondaryGoal: null,
  selectedSkills: [],
  selectedStrength: [],
  selectedFlexibility: [],
  trainingStyle: 'balanced',
  trainingPathType: 'skill_progression',
  goalCategories: [],
  experienceLevel: 'intermediate',
  scheduleMode: 'flexible',
  trainingDaysPerWeek: 4,
  sessionDurationMode: 'adaptive',
  sessionLengthMinutes: 60,
  equipment: ['pull_up_bar', 'parallel_bars', 'rings'],
  bodyweight: null,
  sex: null,
  jointCautions: [],
  weakestArea: null,
  pullUpMax: null,
  dipMax: null,
  frontLeverProgression: null,
  plancheProgression: null,
  weightedPullUp: null,
  weightedDip: null,
  recoveryQuality: 'moderate',
  // [AI-TRUTH-PERSISTENCE] Method preferences defaults
  trainingMethodPreferences: [],
  sessionStylePreference: null,
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extract and normalize truth from profile and builder inputs.
 * This is the SINGLE entry point for truth extraction across all generation paths.
 */
export function extractProgramTruth(
  profile: CanonicalProgrammingProfile | null,
  builderInputs: Partial<AdaptiveProgramInputs> | null,
  triggerSource: TruthTriggerSource
): TruthExtractionResult {
  const extractedAt = new Date().toISOString()
  const materialInputPresence: MaterialInputPresence[] = []
  
  // Build material input presence audit
  for (const field of MATERIAL_FIELDS) {
    const presence = auditFieldPresence(field, profile, builderInputs)
    materialInputPresence.push(presence)
  }
  
  // Count by status
  const presentCount = materialInputPresence.filter(p => p.status === 'present').length
  const defaultedCount = materialInputPresence.filter(p => p.status === 'defaulted').length
  const inferredCount = materialInputPresence.filter(p => p.status === 'inferred').length
  const missingCount = materialInputPresence.filter(p => p.status === 'missing').length
  
  // Determine overall verdict
  let verdict: TruthExtractionResult['truthContext']['verdict']
  if (missingCount === 0 && defaultedCount === 0) {
    verdict = 'CANONICAL_PROFILE_COMPLETE'
  } else if (missingCount === 0) {
    verdict = 'FIELDS_DEFAULTED_PRESENT'
  } else if (missingCount > 5) {
    verdict = 'FIELDS_MISSING_REQUIRES_BACKFILL'
  } else if (presentCount > missingCount) {
    verdict = 'PARTIAL_TRUTH_AVAILABLE'
  } else {
    verdict = 'TRUTH_EXTRACTED_SUCCESSFULLY'
  }
  
  // Build normalized inputs
  const normalizedInputs = buildNormalizedInputs(profile, builderInputs, materialInputPresence)
  
  // Build profile snapshot for persistence
  const profileSnapshot = buildProfileSnapshot(profile)
  
  // Log extraction result
  console.log('[program-truth-extractor] Extraction complete', {
    triggerSource,
    profilePresent: !!profile,
    inputsPresent: !!builderInputs,
    presentCount,
    defaultedCount,
    inferredCount,
    missingCount,
    verdict,
  })
  
  return {
    normalizedInputs,
    truthContext: {
      triggerSource,
      extractedAt,
      profilePresent: !!profile,
      inputsPresent: !!builderInputs,
      materialInputPresence,
      presentCount,
      defaultedCount,
      inferredCount,
      missingCount,
      verdict,
    },
    profileSnapshot,
  }
}

// =============================================================================
// FIELD PRESENCE AUDIT
// =============================================================================

function auditFieldPresence(
  field: string,
  profile: CanonicalProgrammingProfile | null,
  inputs: Partial<AdaptiveProgramInputs> | null
): MaterialInputPresence {
  // Check builder inputs first (they override profile)
  const inputValue = inputs ? getFieldValue(inputs, field) : undefined
  if (inputValue !== undefined && inputValue !== null) {
    const isEmpty = Array.isArray(inputValue) ? inputValue.length === 0 : false
    if (!isEmpty) {
      return {
        field,
        status: 'present',
        value: inputValue,
        source: 'builder_inputs',
      }
    }
  }
  
  // Check profile
  const profileValue = profile ? getFieldValue(profile, field) : undefined
  if (profileValue !== undefined && profileValue !== null) {
    const isEmpty = Array.isArray(profileValue) ? profileValue.length === 0 : false
    if (!isEmpty) {
      return {
        field,
        status: 'present',
        value: profileValue,
        source: 'profile',
      }
    }
  }
  
  // Check if we have a reasonable default
  const defaultValue = DEFAULTS[field]
  if (defaultValue !== undefined && defaultValue !== null) {
    return {
      field,
      status: 'defaulted',
      value: defaultValue,
      source: 'default',
      note: `Using default: ${JSON.stringify(defaultValue)}`,
    }
  }
  
  // Truly missing
  return {
    field,
    status: 'missing',
    value: null,
    source: 'none',
    note: 'No value available from profile, inputs, or defaults',
  }
}

function getFieldValue(obj: Record<string, unknown>, field: string): unknown {
  // Handle nested fields with simple dot notation
  if (field.includes('.')) {
    const parts = field.split('.')
    let current: unknown = obj
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }
    return current
  }
  
  // Handle equipment aliases
  if (field === 'equipment') {
    return obj['equipmentAvailable'] ?? obj['equipment']
  }
  
  // Handle session length aliases
  if (field === 'sessionLengthMinutes') {
    return obj['sessionLengthMinutes'] ?? obj['sessionLength']
  }
  
  return obj[field]
}

// =============================================================================
// NORMALIZED INPUT BUILDER
// =============================================================================

function buildNormalizedInputs(
  profile: CanonicalProgrammingProfile | null,
  inputs: Partial<AdaptiveProgramInputs> | null,
  presence: MaterialInputPresence[]
): AdaptiveProgramInputs {
  // Helper to get resolved value
  const getValue = (field: string): unknown => {
    const entry = presence.find(p => p.field === field)
    return entry?.value ?? DEFAULTS[field] ?? null
  }
  
  return {
    primaryGoal: getValue('primaryGoal') as string,
    secondaryGoal: getValue('secondaryGoal') as string | undefined,
    selectedSkills: (getValue('selectedSkills') as string[]) || [],
    trainingPathType: getValue('trainingPathType') as string | undefined,
    goalCategories: (getValue('goalCategories') as string[]) || [],
    experienceLevel: getValue('experienceLevel') as string,
    scheduleMode: (getValue('scheduleMode') as 'static' | 'flexible') || 'flexible',
    trainingDaysPerWeek: (getValue('trainingDaysPerWeek') as number) || 4,
    sessionDurationMode: (getValue('sessionDurationMode') as 'static' | 'adaptive') || 'adaptive',
    sessionLength: (getValue('sessionLengthMinutes') as number) || 60,
    equipment: (getValue('equipment') as string[]) || [],
    // Pass through any additional fields from inputs
    ...inputs,
  }
}

// =============================================================================
// PROFILE SNAPSHOT BUILDER
// =============================================================================

function buildProfileSnapshot(
  profile: CanonicalProgrammingProfile | null
): Partial<CanonicalProgrammingProfile> {
  if (!profile) {
    return {}
  }
  
  // Return a clean snapshot of the most important fields
  return {
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    selectedSkills: profile.selectedSkills,
    selectedFlexibility: profile.selectedFlexibility,
    trainingPathType: profile.trainingPathType,
    goalCategories: profile.goalCategories,
    experienceLevel: profile.experienceLevel,
    scheduleMode: profile.scheduleMode,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    sessionDurationMode: profile.sessionDurationMode,
    equipmentAvailable: profile.equipmentAvailable,
    jointCautions: profile.jointCautions,
    weakestArea: profile.weakestArea,
    recoveryQuality: profile.recoveryQuality,
    sex: profile.sex,
    bodyweight: profile.bodyweight,
    // [AI-TRUTH-PERSISTENCE] High-priority method preferences
    trainingMethodPreferences: profile.trainingMethodPreferences,
    sessionStylePreference: profile.sessionStylePreference,
  }
}

// =============================================================================
// TRUTH EXPLANATION ATTACHMENT
// =============================================================================

/**
 * Attach truth explanation to a generated program.
 * Call this AFTER generation but BEFORE saving.
 */
export function attachTruthExplanation(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile | null,
  triggerSource: TruthTriggerSource
): AdaptiveProgram {
  const explanation = buildProgramTruthExplanation(program, profile)
  
  // [CHECKLIST 1 OF 5] Extract authoritativeMultiSkillIntentContract from program if available
  const authoritativeContract = (program as {
    authoritativeMultiSkillIntentContract?: {
      selectedSkills: string[]
      primarySkill: string | null
      secondarySkill: string | null
      supportSkills: string[]
      deferredSkills: Array<{ skill: string; reasonCode: string; reasonLabel: string; details?: string }>
      materiallyExpressedSkills: string[]
      reducedThisCycleSkills: string[]
      skillPriorityOrder: Array<{ skill: string; role: string; priorityScore: number; exposureSessions: number; currentWorkingProgression?: string | null; historicalCeiling?: string | null }>
      coverageVerdict: 'strong' | 'adequate' | 'weak'
      sourceTruthCount: number
      materiallyUsedCount: number
      auditTrail: { canonicalSourceSkillCount: number; builderInputSkillCount: number; weightedAllocationSkillCount: number; sessionArchitectureSkillCount: number; skillsLostInPipeline: string[]; skillsNarrowedReason: string | null }
    } | null
  }).authoritativeMultiSkillIntentContract || null
  
  return {
    ...program,
    truthExplanation: {
      ...explanation,
      generatedAt: new Date().toISOString(),
      triggerSource,
      // [SESSION-ARCHITECTURE-MATERIALIZATION] Include materialization verdict if available
      materializationVerdict: program.materializationVerdict || null,
      // [CHECKLIST 1 OF 5] Include authoritative multi-skill intent contract if available
      authoritativeMultiSkillIntentContract: authoritativeContract ? {
        selectedSkills: authoritativeContract.selectedSkills,
        primarySkill: authoritativeContract.primarySkill,
        secondarySkill: authoritativeContract.secondarySkill,
        supportSkills: authoritativeContract.supportSkills,
        deferredSkills: authoritativeContract.deferredSkills,
        materiallyExpressedSkills: authoritativeContract.materiallyExpressedSkills,
        reducedThisCycleSkills: authoritativeContract.reducedThisCycleSkills,
        skillPriorityOrder: authoritativeContract.skillPriorityOrder.map(s => ({
          skill: s.skill,
          role: s.role as 'primary' | 'secondary' | 'tertiary' | 'support' | 'deferred',
          priorityScore: s.priorityScore,
          exposureSessions: s.exposureSessions,
          currentWorkingProgression: s.currentWorkingProgression,
          historicalCeiling: s.historicalCeiling,
        })),
        coverageVerdict: authoritativeContract.coverageVerdict,
        sourceTruthCount: authoritativeContract.sourceTruthCount,
        materiallyUsedCount: authoritativeContract.materiallyUsedCount,
        auditTrail: authoritativeContract.auditTrail,
      } : null,
    },
  }
}

// =============================================================================
// PARITY VERDICTS
// =============================================================================

export type ParityVerdict = 
  | 'TRUTH_EXTRACTED_SUCCESSFULLY'
  | 'CANONICAL_PROFILE_COMPLETE'
  | 'BUILDER_INPUT_MATCHES_CANONICAL'
  | 'BUILDER_OUTPUT_SAVED_CLEANLY'
  | 'PROGRAM_PAGE_MATCHES_SAVED_PROGRAM'
  | 'FIELDS_DEFAULTED_PRESENT'
  | 'FIELDS_MISSING_REQUIRES_BACKFILL'
  | 'STYLE_EXPRESSION_WEAK'
  | 'SKILL_EXPRESSION_PARTIAL'
  | 'BENCHMARK_DATA_ABSENT'

/**
 * Generate parity verdicts for a program.
 */
export function generateParityVerdicts(
  program: AdaptiveProgram,
  profile: CanonicalProgrammingProfile | null
): ParityVerdict[] {
  const verdicts: ParityVerdict[] = []
  
  // Check truth extraction
  if (program.truthExplanation) {
    verdicts.push('TRUTH_EXTRACTED_SUCCESSFULLY')
  }
  
  // Check profile completeness
  if (profile?.primaryGoal && profile?.selectedSkills?.length) {
    verdicts.push('CANONICAL_PROFILE_COMPLETE')
  }
  
  // Check builder output was saved
  if (program.id && program.sessions?.length) {
    verdicts.push('BUILDER_OUTPUT_SAVED_CLEANLY')
  }
  
  // Check skill expression
  const selectedSkills = program.selectedSkills || []
  const representedSkills = program.representedSkills || []
  if (selectedSkills.length > 0) {
    const coverage = representedSkills.length / selectedSkills.length
    if (coverage < 0.5) {
      verdicts.push('SKILL_EXPRESSION_PARTIAL')
    }
  }
  
  // Check benchmark data
  if (!profile?.pullUpMax && !profile?.dipMax && !profile?.frontLeverProgression) {
    verdicts.push('BENCHMARK_DATA_ABSENT')
  }
  
  return verdicts
}

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

/**
 * Log material input presence for debugging.
 */
export function logMaterialInputPresence(presence: MaterialInputPresence[]): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[program-truth-extractor] ===== MATERIAL INPUT PRESENCE =====')
  console.table(presence.map(p => ({
    Field: p.field,
    Status: p.status,
    Source: p.source,
    Value: typeof p.value === 'object' ? JSON.stringify(p.value).slice(0, 50) : String(p.value),
    Note: p.note || '',
  })))
}

/**
 * Log parity verdicts for debugging.
 */
export function logParityVerdicts(verdicts: ParityVerdict[]): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[program-truth-extractor] ===== PARITY VERDICTS =====')
  verdicts.forEach(v => {
    const emoji = v.includes('MISSING') || v.includes('ABSENT') || v.includes('PARTIAL') || v.includes('WEAK')
      ? '⚠️'
      : '✓'
    console.log(`[program-truth-extractor] ${emoji} ${v}`)
  })
}
