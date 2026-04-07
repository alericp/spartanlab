/**
 * DOCTRINE INFLUENCE CONTRACT
 * 
 * PURPOSE:
 * Single normalized influence layer that bridges doctrine DB → adaptive generator.
 * This contract explicitly separates and audits:
 * - athleteTruth (canonical profile data)
 * - doctrineDbTruth (DB-backed rules from Neon)
 * - codeDoctrineFallbackTruth (code registries used when DB unavailable)
 * - mergedInfluence (combined influence per domain)
 * - sourceAttribution (per-domain ownership: db | code | merged | missing)
 * - readinessState (DB availability and coverage diagnostics)
 * 
 * OWNERSHIP RULES:
 * - Canonical athlete/profile truth remains upstream owner for athlete-specific data
 * - Doctrine DB becomes owner for DB-backed doctrine domains when available
 * - Existing code registries remain fallback owners only where DB data is unavailable
 * - This contract is the single normalized consumer-facing truth for downstream logic
 * 
 * SAFETY:
 * - Read-only with respect to DB
 * - Safe when doctrine DB is unavailable
 * - Does NOT change generation behavior in this phase (shadow mode)
 * - Graceful fallback to code registries
 * - No crash risk from missing DB data
 * 
 * PHASE: Shadow Integration (resolved + carried forward + auditable)
 */

import { type DoctrineRuntimeContract } from '../doctrine-runtime-contract'
import { checkDoctrineRuntimeReadiness, type DoctrineRuntimeReadiness } from '../doctrine-runtime-readiness'
import { DOCTRINE_REGISTRY } from '../training-doctrine-registry/doctrineRegistry'
import { METHOD_PROFILES } from './method-profile-registry'
import { SKILL_SUPPORT_MAPPINGS } from './skill-support-mappings'

// =============================================================================
// TYPES - ATHLETE TRUTH
// =============================================================================

/**
 * Canonical athlete truth from profile/onboarding.
 * This data comes UPSTREAM from canonical-profile-service.
 */
export interface AthleteTruth {
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  experienceLevel: string | null
  scheduleMode: string | null
  targetFrequency: number | null
  jointCautions: string[]
  equipmentAvailable: string[]
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
  }>
  trainingPath: string | null
  sessionStyle: string | null
  timeAvailability: number | null
}

// =============================================================================
// TYPES - DOCTRINE DB TRUTH
// =============================================================================

/**
 * Truth resolved from Doctrine DB (Neon).
 * This data comes from doctrine-db.ts queries.
 */
export interface DoctrineDbTruth {
  available: boolean
  coverageSummary: {
    sourcesCount: number
    principlesCount: number
    progressionRulesCount: number
    exerciseSelectionRulesCount: number
    contraindicationRulesCount: number
    methodRulesCount: number
    prescriptionRulesCount: number
    carryoverRulesCount: number
    totalRulesCount: number
    hasLiveRules: boolean
  }
  progressionRulesPresent: boolean
  contraindicationRulesPresent: boolean
  methodRulesPresent: boolean
  prescriptionRulesPresent: boolean
  carryoverRulesPresent: boolean
  exerciseSelectionRulesPresent: boolean
}

// =============================================================================
// TYPES - CODE FALLBACK TRUTH
// =============================================================================

/**
 * Truth from code-based registries (fallback when DB unavailable).
 * These are the existing code registries that predate doctrine DB.
 */
export interface CodeDoctrineFallbackTruth {
  doctrineRegistryActive: boolean
  doctrineRegistryCount: number
  methodProfileRegistryActive: boolean
  methodProfileCount: number
  skillSupportMappingsActive: boolean
  skillSupportMappingCount: number
  fallbackReason: string | null
}

// =============================================================================
// TYPES - SOURCE ATTRIBUTION
// =============================================================================

export type SourceOwner = 'db' | 'code' | 'merged' | 'missing'

/**
 * Per-domain source attribution.
 * Explicitly tracks whether each influence domain is DB-owned, code-owned, merged, or missing.
 */
export interface SourceAttribution {
  progression: SourceOwner
  contraindications: SourceOwner
  methodSelection: SourceOwner
  carryover: SourceOwner
  prescription: SourceOwner
  skillSupport: SourceOwner
  exerciseSelection: SourceOwner
}

// =============================================================================
// TYPES - MERGED INFLUENCE
// =============================================================================

/**
 * Merged influence per domain.
 * This is the final resolved influence for downstream consumption.
 * In shadow mode, this does NOT change generation behavior yet.
 */
export interface MergedInfluence {
  movementEmphasis: {
    primarySkillEmphasis: string[]
    secondarySkillEmphasis: string[]
    carryoverSkills: string[]
    confidence: number
  }
  progressionPacing: {
    conservativeBias: boolean
    assistedRecommended: boolean
    rationale: string[]
    confidence: number
  }
  safetyCautions: {
    blockedExercises: string[]
    cautionExercises: string[]
    jointProtections: string[]
    confidence: number
  }
  methodPreferences: {
    preferredMethods: string[]
    limitedMethods: string[]
    blockedMethods: string[]
    densityAllowed: boolean
    supersetsAllowed: boolean
    circuitsAllowed: boolean
    confidence: number
  }
  prescriptionGuidance: {
    intensityBias: 'conservative' | 'moderate' | 'aggressive' | null
    volumeBias: 'low' | 'moderate' | 'high' | null
    holdBias: 'skill_quality_first' | 'volume_first' | null
    confidence: number
  }
  carryoverEmphasis: {
    carryoverMap: Record<string, string[]>
    supportSkills: string[]
    deferredSkills: string[]
    confidence: number
  }
}

// =============================================================================
// TYPES - READINESS STATE
// =============================================================================

/**
 * Readiness state diagnostics.
 * Used for audit/debug visibility.
 */
export interface ReadinessState {
  doctrineDbReady: boolean
  doctrineDbCoverage: 'none' | 'partial' | 'minimum' | 'full'
  unresolvedDomains: string[]
  fallbackDomains: string[]
  readinessVerdict: 'NOT_READY' | 'PARTIAL' | 'READY' | 'FULL'
  readinessExplanation: string
}

// =============================================================================
// TYPES - DOCTRINE INFLUENCE CONTRACT
// =============================================================================

/**
 * The canonical Doctrine Influence Contract.
 * Built ONCE per generation, carried forward through the pipeline.
 * This is the single normalized truth source for doctrine influence.
 */
export interface DoctrineInfluenceContract {
  // Contract metadata
  contractId: string
  builtAt: string
  contractVersion: string
  
  // Section A: Athlete truth (from canonical profile)
  athleteTruth: AthleteTruth
  
  // Section B: Doctrine DB truth (from Neon)
  doctrineDbTruth: DoctrineDbTruth
  
  // Section C: Code fallback truth (existing registries)
  codeDoctrineFallbackTruth: CodeDoctrineFallbackTruth
  
  // Section D: Merged influence (final resolved influence)
  mergedInfluence: MergedInfluence
  
  // Section E: Source attribution (per-domain ownership)
  sourceAttribution: SourceAttribution
  
  // Section F: Readiness state (diagnostics)
  readinessState: ReadinessState
  
  // Reference to underlying runtime contract (if available)
  underlyingRuntimeContract: DoctrineRuntimeContract | null
  
  // Safety flags
  safetyFlags: {
    dbAvailable: boolean
    fallbackActive: boolean
    shadowModeOnly: boolean
    noVisibleBehaviorChange: boolean
  }
}

// =============================================================================
// BUILD CONTEXT
// =============================================================================

export interface DoctrineInfluenceBuildContext {
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  experienceLevel: string | null
  scheduleMode: string | null
  targetFrequency: number | null
  jointCautions: string[]
  equipmentAvailable: string[]
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
  }>
  trainingPath: string | null
  sessionStyle: string | null
  timeAvailability: number | null
}

// =============================================================================
// RESOLVER FUNCTION
// =============================================================================

/**
 * Build the Doctrine Influence Contract.
 * 
 * This resolver:
 * 1. Checks doctrine DB readiness first
 * 2. Safely queries doctrine DB only if readiness is valid
 * 3. Merges DB truth with existing code truth
 * 4. Never crashes generation if DB data is missing
 * 5. Returns a deterministic normalized contract every time
 * 
 * SHADOW MODE: This phase is "resolved + carried forward + auditable" only.
 * No broad behavior rewrite.
 */
export async function buildDoctrineInfluenceContract(
  context: DoctrineInfluenceBuildContext,
  runtimeContract: DoctrineRuntimeContract | null
): Promise<DoctrineInfluenceContract> {
  const contractId = `doctrine-influence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const builtAt = new Date().toISOString()
  
  // ==========================================================================
  // STEP 1: Check doctrine DB readiness
  // ==========================================================================
  let readiness: DoctrineRuntimeReadiness
  try {
    readiness = await checkDoctrineRuntimeReadiness()
  } catch (error) {
    console.log('[doctrine-influence-contract] Readiness check failed, using fallback:', error)
    readiness = createFallbackReadiness()
  }
  
  // ==========================================================================
  // STEP 2: Build athlete truth from context (canonical profile data)
  // Source: Upstream canonical-profile-service
  // ==========================================================================
  const athleteTruth: AthleteTruth = {
    primaryGoal: context.primaryGoal,
    secondaryGoal: context.secondaryGoal,
    selectedSkills: context.selectedSkills,
    experienceLevel: context.experienceLevel,
    scheduleMode: context.scheduleMode,
    targetFrequency: context.targetFrequency,
    jointCautions: context.jointCautions,
    equipmentAvailable: context.equipmentAvailable,
    currentWorkingProgressions: context.currentWorkingProgressions,
    trainingPath: context.trainingPath,
    sessionStyle: context.sessionStyle,
    timeAvailability: context.timeAvailability,
  }
  
  // ==========================================================================
  // STEP 3: Build doctrine DB truth
  // Source: doctrine-db.ts + doctrine-runtime-readiness.ts
  // ==========================================================================
  const doctrineDbTruth = buildDoctrineDbTruth(readiness, runtimeContract)
  
  // ==========================================================================
  // STEP 4: Build code fallback truth
  // Source: Existing code registries (DOCTRINE_REGISTRY, METHOD_PROFILES, etc.)
  // ==========================================================================
  const codeDoctrineFallbackTruth = buildCodeFallbackTruth(readiness)
  
  // ==========================================================================
  // STEP 5: Determine source attribution per domain
  // Explicit ownership: db | code | merged | missing
  // ==========================================================================
  const sourceAttribution = buildSourceAttribution(readiness, runtimeContract)
  
  // ==========================================================================
  // STEP 6: Build merged influence
  // Combines DB + code fallback where applicable
  // ==========================================================================
  const mergedInfluence = buildMergedInfluence(
    athleteTruth,
    runtimeContract,
    sourceAttribution
  )
  
  // ==========================================================================
  // STEP 7: Build readiness state for diagnostics
  // ==========================================================================
  const readinessState = buildReadinessState(readiness, sourceAttribution)
  
  // ==========================================================================
  // STEP 8: Assemble final contract
  // ==========================================================================
  const contract: DoctrineInfluenceContract = {
    contractId,
    builtAt,
    contractVersion: '1.0.0-shadow',
    
    athleteTruth,
    doctrineDbTruth,
    codeDoctrineFallbackTruth,
    mergedInfluence,
    sourceAttribution,
    readinessState,
    
    underlyingRuntimeContract: runtimeContract,
    
    safetyFlags: {
      dbAvailable: readiness.doctrineDBAvaialble,
      fallbackActive: !readiness.safeToConsumeInLaterPhase,
      shadowModeOnly: true, // [SHADOW MODE] This phase does not change visible behavior
      noVisibleBehaviorChange: true,
    },
  }
  
  // ==========================================================================
  // STEP 9: Log contract build for audit
  // ==========================================================================
  console.log('[DOCTRINE-INFLUENCE-CONTRACT-BUILT]', {
    contractId,
    builtAt,
    dbAvailable: contract.safetyFlags.dbAvailable,
    fallbackActive: contract.safetyFlags.fallbackActive,
    shadowModeOnly: contract.safetyFlags.shadowModeOnly,
    sourceAttribution: contract.sourceAttribution,
    readinessVerdict: contract.readinessState.readinessVerdict,
    unresolvedDomains: contract.readinessState.unresolvedDomains,
    fallbackDomains: contract.readinessState.fallbackDomains,
  })
  
  return contract
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createFallbackReadiness(): DoctrineRuntimeReadiness {
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
    missingComponents: ['database_connection_failed'],
    readinessVerdict: 'NOT_READY',
    readinessExplanation: 'Database connection failed - using code fallback',
  }
}

function buildDoctrineDbTruth(
  readiness: DoctrineRuntimeReadiness,
  runtimeContract: DoctrineRuntimeContract | null
): DoctrineDbTruth {
  const coverage = runtimeContract?.doctrineCoverage
  
  return {
    available: readiness.doctrineDBAvaialble,
    coverageSummary: {
      sourcesCount: coverage?.sourcesCount ?? readiness.counts.sources,
      principlesCount: coverage?.principlesCount ?? readiness.counts.principles,
      progressionRulesCount: coverage?.progressionRuleCount ?? readiness.counts.progressionRules,
      exerciseSelectionRulesCount: coverage?.exerciseSelectionRuleCount ?? readiness.counts.exerciseSelectionRules,
      contraindicationRulesCount: readiness.counts.contraindicationRules,
      methodRulesCount: coverage?.methodRuleCount ?? readiness.counts.methodRules,
      prescriptionRulesCount: coverage?.prescriptionRuleCount ?? readiness.counts.prescriptionRules,
      carryoverRulesCount: coverage?.carryoverRuleCount ?? readiness.counts.carryoverRules,
      totalRulesCount: readiness.counts.totalRules,
      hasLiveRules: coverage?.hasLiveRules ?? (readiness.counts.totalRules > 0),
    },
    progressionRulesPresent: readiness.hasProgressionRules,
    contraindicationRulesPresent: readiness.hasContraindicationRules,
    methodRulesPresent: readiness.hasMethodRules,
    prescriptionRulesPresent: readiness.hasPrescriptionRules,
    carryoverRulesPresent: readiness.hasCarryoverRules,
    exerciseSelectionRulesPresent: readiness.hasExerciseSelectionRules,
  }
}

function buildCodeFallbackTruth(readiness: DoctrineRuntimeReadiness): CodeDoctrineFallbackTruth {
  // Check if code registries are active (fallback when DB unavailable)
  const doctrineRegistryKeys = Object.keys(DOCTRINE_REGISTRY || {})
  const methodProfileKeys = Object.keys(METHOD_PROFILES || {})
  const skillSupportKeys = Object.keys(SKILL_SUPPORT_MAPPINGS || {})
  
  const fallbackNeeded = !readiness.safeToConsumeInLaterPhase
  
  return {
    doctrineRegistryActive: fallbackNeeded && doctrineRegistryKeys.length > 0,
    doctrineRegistryCount: doctrineRegistryKeys.length,
    methodProfileRegistryActive: fallbackNeeded && methodProfileKeys.length > 0,
    methodProfileCount: methodProfileKeys.length,
    skillSupportMappingsActive: fallbackNeeded && skillSupportKeys.length > 0,
    skillSupportMappingCount: skillSupportKeys.length,
    fallbackReason: fallbackNeeded
      ? `Doctrine DB not fully ready: ${readiness.readinessExplanation}`
      : null,
  }
}

function buildSourceAttribution(
  readiness: DoctrineRuntimeReadiness,
  runtimeContract: DoctrineRuntimeContract | null
): SourceAttribution {
  const dbAvailable = readiness.doctrineDBAvaialble && readiness.safeToConsumeInLaterPhase
  
  // Determine source owner per domain
  // Owner is 'db' if DB has live rules for that domain
  // Owner is 'code' if falling back to code registry
  // Owner is 'merged' if using both
  // Owner is 'missing' if neither available
  
  const hasDbProgression = runtimeContract?.doctrineCoverage?.progressionRuleCount ?? 0 > 0
  const hasDbMethod = runtimeContract?.doctrineCoverage?.methodRuleCount ?? 0 > 0
  const hasDbPrescription = runtimeContract?.doctrineCoverage?.prescriptionRuleCount ?? 0 > 0
  const hasDbCarryover = runtimeContract?.doctrineCoverage?.carryoverRuleCount ?? 0 > 0
  const hasDbExercise = runtimeContract?.doctrineCoverage?.exerciseSelectionRuleCount ?? 0 > 0
  const hasDbContraindication = readiness.hasContraindicationRules
  
  const codeDoctrineAvailable = Object.keys(DOCTRINE_REGISTRY || {}).length > 0
  const codeMethodAvailable = Object.keys(METHOD_PROFILES || {}).length > 0
  const codeSkillSupportAvailable = Object.keys(SKILL_SUPPORT_MAPPINGS || {}).length > 0
  
  return {
    progression: determineOwner(dbAvailable && hasDbProgression, codeDoctrineAvailable),
    contraindications: determineOwner(dbAvailable && hasDbContraindication, false),
    methodSelection: determineOwner(dbAvailable && hasDbMethod, codeMethodAvailable),
    carryover: determineOwner(dbAvailable && hasDbCarryover, codeSkillSupportAvailable),
    prescription: determineOwner(dbAvailable && hasDbPrescription, false),
    skillSupport: determineOwner(false, codeSkillSupportAvailable), // Always code for now
    exerciseSelection: determineOwner(dbAvailable && hasDbExercise, false),
  }
}

function determineOwner(dbHasData: boolean, codeHasData: boolean): SourceOwner {
  if (dbHasData && codeHasData) return 'merged'
  if (dbHasData) return 'db'
  if (codeHasData) return 'code'
  return 'missing'
}

function buildMergedInfluence(
  athleteTruth: AthleteTruth,
  runtimeContract: DoctrineRuntimeContract | null,
  sourceAttribution: SourceAttribution
): MergedInfluence {
  // Build merged influence from runtime contract if available
  // Otherwise use safe defaults
  
  const progressionDoctrine = runtimeContract?.progressionDoctrine
  const methodDoctrine = runtimeContract?.methodDoctrine
  const prescriptionDoctrine = runtimeContract?.prescriptionDoctrine
  const skillDoctrine = runtimeContract?.skillDoctrine
  
  return {
    movementEmphasis: {
      primarySkillEmphasis: athleteTruth.selectedSkills.slice(0, 2),
      secondarySkillEmphasis: athleteTruth.selectedSkills.slice(2, 4),
      carryoverSkills: skillDoctrine?.supportSkills ?? [],
      confidence: sourceAttribution.carryover === 'db' ? 0.9 : 0.5,
    },
    progressionPacing: {
      conservativeBias: progressionDoctrine?.globalConservativeBias ?? false,
      assistedRecommended: progressionDoctrine?.globalAssistedBias ?? false,
      rationale: [],
      confidence: sourceAttribution.progression === 'db' ? 0.9 : 0.5,
    },
    safetyCautions: {
      blockedExercises: [],
      cautionExercises: [],
      jointProtections: athleteTruth.jointCautions,
      confidence: sourceAttribution.contraindications === 'db' ? 0.9 : 0.3,
    },
    methodPreferences: {
      preferredMethods: methodDoctrine?.preferredMethods ?? [],
      limitedMethods: methodDoctrine?.limitedMethods ?? [],
      blockedMethods: methodDoctrine?.blockedMethods ?? [],
      densityAllowed: methodDoctrine?.densityAllowed ?? true,
      supersetsAllowed: methodDoctrine?.supersetsAllowed ?? true,
      circuitsAllowed: methodDoctrine?.circuitsAllowed ?? true,
      confidence: sourceAttribution.methodSelection === 'db' ? 0.9 : 0.5,
    },
    prescriptionGuidance: {
      intensityBias: prescriptionDoctrine?.intensityBias ?? null,
      volumeBias: prescriptionDoctrine?.volumeBias ?? null,
      holdBias: prescriptionDoctrine?.holdBias ?? null,
      confidence: sourceAttribution.prescription === 'db' ? 0.9 : 0.3,
    },
    carryoverEmphasis: {
      carryoverMap: skillDoctrine?.carryoverMap ?? {},
      supportSkills: skillDoctrine?.supportSkills ?? [],
      deferredSkills: skillDoctrine?.deferredSkills ?? [],
      confidence: sourceAttribution.carryover === 'db' ? 0.9 : 0.5,
    },
  }
}

function buildReadinessState(
  readiness: DoctrineRuntimeReadiness,
  sourceAttribution: SourceAttribution
): ReadinessState {
  // Determine unresolved and fallback domains
  const unresolvedDomains: string[] = []
  const fallbackDomains: string[] = []
  
  const domains: Array<{ key: keyof SourceAttribution; label: string }> = [
    { key: 'progression', label: 'progression' },
    { key: 'contraindications', label: 'contraindications' },
    { key: 'methodSelection', label: 'method_selection' },
    { key: 'carryover', label: 'carryover' },
    { key: 'prescription', label: 'prescription' },
    { key: 'skillSupport', label: 'skill_support' },
    { key: 'exerciseSelection', label: 'exercise_selection' },
  ]
  
  for (const { key, label } of domains) {
    const owner = sourceAttribution[key]
    if (owner === 'missing') {
      unresolvedDomains.push(label)
    } else if (owner === 'code') {
      fallbackDomains.push(label)
    }
  }
  
  // Determine coverage level
  let coverage: 'none' | 'partial' | 'minimum' | 'full'
  if (!readiness.doctrineDBAvaialble) {
    coverage = 'none'
  } else if (!readiness.minimumCoverageMet) {
    coverage = 'partial'
  } else if (readiness.counts.totalRules < 50) {
    coverage = 'minimum'
  } else {
    coverage = 'full'
  }
  
  return {
    doctrineDbReady: readiness.safeToConsumeInLaterPhase,
    doctrineDbCoverage: coverage,
    unresolvedDomains,
    fallbackDomains,
    readinessVerdict: readiness.readinessVerdict,
    readinessExplanation: readiness.readinessExplanation,
  }
}

// =============================================================================
// AUDIT HELPERS
// =============================================================================

/**
 * Generate a human-readable audit summary of the doctrine influence contract.
 * Used for debug/audit visibility.
 */
export function generateDoctrineInfluenceAuditSummary(
  contract: DoctrineInfluenceContract
): Record<string, unknown> {
  return {
    contractId: contract.contractId,
    builtAt: contract.builtAt,
    version: contract.contractVersion,
    
    // Athlete truth summary
    athleteTruth: {
      primaryGoal: contract.athleteTruth.primaryGoal,
      selectedSkillsCount: contract.athleteTruth.selectedSkills.length,
      experienceLevel: contract.athleteTruth.experienceLevel,
      jointCautionsCount: contract.athleteTruth.jointCautions.length,
    },
    
    // DB truth summary
    doctrineDbTruth: {
      available: contract.doctrineDbTruth.available,
      totalRulesCount: contract.doctrineDbTruth.coverageSummary.totalRulesCount,
      hasLiveRules: contract.doctrineDbTruth.coverageSummary.hasLiveRules,
    },
    
    // Code fallback summary
    codeFallbackTruth: {
      fallbackActive: contract.codeDoctrineFallbackTruth.doctrineRegistryActive,
      fallbackReason: contract.codeDoctrineFallbackTruth.fallbackReason,
    },
    
    // Source attribution
    sourceAttribution: contract.sourceAttribution,
    
    // Readiness state
    readinessState: {
      dbReady: contract.readinessState.doctrineDbReady,
      coverage: contract.readinessState.doctrineDbCoverage,
      verdict: contract.readinessState.readinessVerdict,
      unresolvedDomains: contract.readinessState.unresolvedDomains,
      fallbackDomains: contract.readinessState.fallbackDomains,
    },
    
    // Safety flags
    safetyFlags: contract.safetyFlags,
  }
}
