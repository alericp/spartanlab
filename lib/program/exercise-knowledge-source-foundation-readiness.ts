/**
 * Exercise Knowledge Source Foundation Readiness Gate
 * 
 * Prompt 79 of 86 / MASTER-8C.83.1 / AB20.4.76.1
 * 
 * This is an INSERTED strategic gate that proves whether the current
 * exercise knowledge source foundation is strong enough to support
 * safe future-session adaptive mutation decisions.
 * 
 * This helper is:
 * - Pure TypeScript, side-effect free
 * - No React, no browser APIs, no Date.now, no Math.random
 * - No localStorage/sessionStorage, no fetch, no DB/API calls
 * - No mutation, no generator import
 * - Read-only analysis of existing knowledge sources
 */

import {
  getExerciseSkillKnowledgeEntries,
  getSkillKnowledgeEntries,
  validateExerciseSkillKnowledgeSeed,
  getKnowledgeCoverageSummary,
} from './exercise-skill-knowledge-validation'

import type {
  ExerciseSkillKnowledgeEntry,
  SkillKnowledgeEntry,
  MovementBalanceFamily,
} from './exercise-skill-knowledge-contract'

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------

export type ExerciseKnowledgeSourceFoundationStatus =
  | 'blocked_seed_missing'
  | 'blocked_contract_missing'
  | 'partial_source_foundation'
  | 'read_only_ready'
  | 'mutation_not_allowed'

// -----------------------------------------------------------------------------
// High-Impact Family Definition
// -----------------------------------------------------------------------------

export type HighImpactFamilyId =
  | 'planche'
  | 'front_lever'
  | 'back_lever'
  | 'hspu'
  | 'muscle_up'
  | 'one_arm_pull_up'
  | 'dragon_flag'
  | 'l_sit'
  | 'v_sit'
  | 'weighted_pull_up'
  | 'weighted_dip'
  | 'warmup'
  | 'cooldown'
  | 'prehab_rehab'

export interface HighImpactFamilyStatus {
  readonly familyId: HighImpactFamilyId
  readonly label: string
  readonly status: 'source_backed' | 'partial' | 'missing'
  readonly seedExerciseMatches: number
  readonly seedSkillMatches: number
  readonly requiredFieldsPresent: {
    readonly identityAliases: boolean
    readonly unitTruth: boolean
    readonly skillTransfer: boolean
    readonly movementFamily: boolean
    readonly tissueStress: boolean
    readonly fatigueCost: boolean
    readonly frequencyTolerance: boolean
    readonly methodCompatibility: boolean
    readonly progressionRegression: boolean
    readonly bandAssistanceLogic: boolean
    readonly warmupNeeds: boolean
    readonly cooldownNeeds: boolean
    readonly prehabRehabTags: boolean
    readonly sourceEvidenceMetadata: boolean
    readonly confidenceLevel: boolean
  }
  readonly blockers: readonly string[]
  readonly nextSafeAction: string
}

// -----------------------------------------------------------------------------
// Main Model
// -----------------------------------------------------------------------------

export interface ExerciseKnowledgeSourceFoundationReadinessModel {
  // Step identification
  readonly promptNumber: 79
  readonly totalPrompts: 86
  readonly insertedGate: true
  readonly masterStep: 'MASTER-8C.83.1'
  readonly abStep: 'AB20.4.76.1'
  readonly sourceStep: 'Prompt 79 of 86 / MASTER-8C.83.1 / AB20.4.76.1'
  
  // Status
  readonly status: ExerciseKnowledgeSourceFoundationStatus
  readonly statusLabel: string
  readonly headline: string
  readonly summary: string
  
  // Hard-locked invariants
  readonly previewOnly: true
  readonly readOnly: true
  readonly mutationAllowed: false
  readonly futureSessionsMutated: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly storageTouched: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly schemaTouched: false
  readonly generatorTouched: false
  readonly methodPlannerTouched: false
  readonly completedSessionsProtected: true
  
  // Counts
  readonly exerciseSeedCount: number
  readonly skillSeedCount: number
  readonly validationErrorCount: number
  readonly validationWarningCount: number
  readonly highImpactFamilyCount: number
  readonly highImpactCoveredCount: number
  readonly highImpactPartialCount: number
  readonly highImpactMissingCount: number
  readonly currentProgramExerciseCount: number
  readonly currentProgramFullScienceKnownCount: number
  readonly currentProgramPartialOrBasicCount: number
  readonly currentProgramUnknownCount: number
  
  // Family breakdown
  readonly highImpactFamilies: readonly HighImpactFamilyStatus[]
  
  // Blockers and next steps
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

// -----------------------------------------------------------------------------
// High-Impact Family Definitions
// -----------------------------------------------------------------------------

const HIGH_IMPACT_FAMILIES: readonly {
  id: HighImpactFamilyId
  label: string
  matchPatterns: readonly string[]
  movementFamilies: readonly MovementBalanceFamily[]
}[] = [
  {
    id: 'planche',
    label: 'Planche',
    matchPatterns: ['planche', 'planche_lean', 'pseudo_planche'],
    movementFamilies: ['horizontal_push', 'straight_arm_push'],
  },
  {
    id: 'front_lever',
    label: 'Front Lever',
    matchPatterns: ['front_lever', 'front_lever_raise'],
    movementFamilies: ['horizontal_pull', 'straight_arm_pull'],
  },
  {
    id: 'back_lever',
    label: 'Back Lever',
    matchPatterns: ['back_lever'],
    movementFamilies: ['horizontal_pull', 'straight_arm_pull'],
  },
  {
    id: 'hspu',
    label: 'Handstand Push-Up',
    matchPatterns: ['hspu', 'handstand_push_up', 'pike_push_up', 'wall_hspu'],
    movementFamilies: ['vertical_push'],
  },
  {
    id: 'muscle_up',
    label: 'Muscle-Up',
    matchPatterns: ['muscle_up', 'bar_muscle_up', 'ring_muscle_up'],
    movementFamilies: ['vertical_pull', 'vertical_push'],
  },
  {
    id: 'one_arm_pull_up',
    label: 'One-Arm Pull-Up',
    matchPatterns: ['one_arm_pull_up', 'oap', 'archer_pull_up', 'typewriter'],
    movementFamilies: ['vertical_pull'],
  },
  {
    id: 'dragon_flag',
    label: 'Dragon Flag',
    matchPatterns: ['dragon_flag', 'lying_leg_raise'],
    movementFamilies: ['anti_extension_core', 'compression_core'],
  },
  {
    id: 'l_sit',
    label: 'L-Sit',
    matchPatterns: ['l_sit', 'l_hang', 'tuck_l_sit'],
    movementFamilies: ['compression_core'],
  },
  {
    id: 'v_sit',
    label: 'V-Sit',
    matchPatterns: ['v_sit', 'straddle_l', 'manna'],
    movementFamilies: ['compression_core'],
  },
  {
    id: 'weighted_pull_up',
    label: 'Weighted Pull-Up',
    matchPatterns: ['weighted_pull_up', 'weighted_chin_up'],
    movementFamilies: ['vertical_pull'],
  },
  {
    id: 'weighted_dip',
    label: 'Weighted Dip',
    matchPatterns: ['weighted_dip', 'weighted_ring_dip'],
    movementFamilies: ['vertical_push'],
  },
  {
    id: 'warmup',
    label: 'Warm-Up',
    matchPatterns: ['warmup', 'warm_up', 'mobility', 'activation'],
    movementFamilies: ['mobility'],
  },
  {
    id: 'cooldown',
    label: 'Cooldown',
    matchPatterns: ['cooldown', 'cool_down', 'static_stretch', 'recovery'],
    movementFamilies: ['mobility'],
  },
  {
    id: 'prehab_rehab',
    label: 'Prehab/Rehab',
    matchPatterns: ['prehab', 'rehab', 'rotator_cuff', 'band_pull_apart', 'face_pull'],
    movementFamilies: ['prehab_joint', 'scapular_control'],
  },
]

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function matchesFamily(
  entry: ExerciseSkillKnowledgeEntry,
  patterns: readonly string[],
  families: readonly MovementBalanceFamily[]
): boolean {
  const id = entry.exerciseId.toLowerCase()
  const aliases = entry.aliases?.map((a: string) => a.toLowerCase()) ?? []
  
  // Check if ID or aliases match any pattern
  const patternMatch = patterns.some(pattern => {
    const p = pattern.toLowerCase()
    return id.includes(p) || aliases.some((a: string) => a.includes(p))
  })
  
  // Check if movement families match
  const familyMatch = entry.movementFamilies 
    ? entry.movementFamilies.some(mf => families.includes(mf))
    : false
  
  return patternMatch || familyMatch
}

function checkRequiredFields(entries: readonly ExerciseSkillKnowledgeEntry[]): HighImpactFamilyStatus['requiredFieldsPresent'] {
  if (entries.length === 0) {
    return {
      identityAliases: false,
      unitTruth: false,
      skillTransfer: false,
      movementFamily: false,
      tissueStress: false,
      fatigueCost: false,
      frequencyTolerance: false,
      methodCompatibility: false,
      progressionRegression: false,
      bandAssistanceLogic: false,
      warmupNeeds: false,
      cooldownNeeds: false,
      prehabRehabTags: false,
      sourceEvidenceMetadata: false,
      confidenceLevel: false,
    }
  }
  
  // Check if at least one entry has each field
  return {
    identityAliases: entries.some(e => e.aliases && e.aliases.length > 0),
    unitTruth: entries.some(e => e.prescriptionUnit !== undefined),
    skillTransfer: entries.some(e => e.skillTransfers && e.skillTransfers.length > 0),
    movementFamily: entries.some(e => e.movementFamilies && e.movementFamilies.length > 0),
    tissueStress: entries.some(e => e.tissueStressProfile && e.tissueStressProfile.length > 0),
    fatigueCost: entries.some(e => e.trainingCost !== undefined),
    frequencyTolerance: entries.some(e => e.frequencyTolerance !== undefined),
    methodCompatibility: entries.some(e => e.methodCompatibility && e.methodCompatibility.length > 0),
    progressionRegression: entries.some(e => e.progressionRelationships && e.progressionRelationships.length > 0),
    bandAssistanceLogic: entries.some(e => e.bandAssistanceSupported !== undefined),
    warmupNeeds: entries.some(e => e.warmupNeeds !== undefined),
    cooldownNeeds: entries.some(e => e.cooldownNeeds !== undefined),
    prehabRehabTags: entries.some(e => e.userAbilityGates && e.userAbilityGates.length > 0),
    sourceEvidenceMetadata: entries.some(e => e.sourceKinds && e.sourceKinds.length > 0 && !e.sourceKinds.every(sk => sk === 'coach_authored_seed')),
    confidenceLevel: entries.some(e => e.confidence !== undefined),
  }
}

function countFieldsPresent(fields: HighImpactFamilyStatus['requiredFieldsPresent']): number {
  return Object.values(fields).filter(Boolean).length
}

function evaluateFamilyStatus(
  familyId: HighImpactFamilyId,
  label: string,
  exerciseMatches: readonly ExerciseSkillKnowledgeEntry[],
  skillMatches: readonly SkillKnowledgeEntry[]
): HighImpactFamilyStatus {
  const requiredFieldsPresent = checkRequiredFields(exerciseMatches)
  const fieldCount = countFieldsPresent(requiredFieldsPresent)
  const totalFields = 15
  
  const blockers: string[] = []
  let status: 'source_backed' | 'partial' | 'missing'
  let nextSafeAction: string
  
  if (exerciseMatches.length === 0) {
    status = 'missing'
    blockers.push(`No exercise entries found for ${label}`)
    nextSafeAction = `Add ${label} exercise entries to knowledge seed`
  } else if (fieldCount < 8) {
    status = 'partial'
    if (!requiredFieldsPresent.sourceEvidenceMetadata) {
      blockers.push('Missing source evidence metadata')
    }
    if (!requiredFieldsPresent.tissueStress) {
      blockers.push('Missing tissue stress profile')
    }
    if (!requiredFieldsPresent.progressionRegression) {
      blockers.push('Missing progression/regression relationships')
    }
    if (!requiredFieldsPresent.methodCompatibility) {
      blockers.push('Missing method compatibility profiles')
    }
    nextSafeAction = `Backfill missing fields for ${label} entries`
  } else {
    status = 'source_backed'
    nextSafeAction = `${label} source foundation is adequate for read-only preview`
  }
  
  return {
    familyId,
    label,
    status,
    seedExerciseMatches: exerciseMatches.length,
    seedSkillMatches: skillMatches.length,
    requiredFieldsPresent,
    blockers,
    nextSafeAction,
  }
}

// -----------------------------------------------------------------------------
// Input Interface
// -----------------------------------------------------------------------------

export interface ExerciseKnowledgeSourceFoundationReadinessInput {
  readonly currentProgramExerciseCount?: number
  readonly currentProgramFullScienceKnownCount?: number
  readonly currentProgramPartialOrBasicCount?: number
  readonly currentProgramUnknownCount?: number
}

// -----------------------------------------------------------------------------
// Main Resolver
// -----------------------------------------------------------------------------

export function resolveExerciseKnowledgeSourceFoundationReadiness(
  input: ExerciseKnowledgeSourceFoundationReadinessInput = {}
): ExerciseKnowledgeSourceFoundationReadinessModel {
  // Get seed data
  let exerciseEntries: readonly ExerciseSkillKnowledgeEntry[] = []
  let skillEntries: readonly SkillKnowledgeEntry[] = []
  let validationResult: ReturnType<typeof validateExerciseSkillKnowledgeSeed> | null = null
  let coverageSummary: ReturnType<typeof getKnowledgeCoverageSummary> | null = null
  
  try {
    exerciseEntries = getExerciseSkillKnowledgeEntries()
    skillEntries = getSkillKnowledgeEntries()
    validationResult = validateExerciseSkillKnowledgeSeed()
    coverageSummary = getKnowledgeCoverageSummary()
  } catch {
    // Seed may be missing or malformed
  }
  
  const exerciseSeedCount = exerciseEntries.length
  const skillSeedCount = skillEntries.length
  const validationErrorCount = validationResult?.issueCount ?? 0
  const validationWarningCount = validationResult?.warningCount ?? 0
  
  // Check if seed is missing
  if (exerciseSeedCount === 0) {
    return {
      promptNumber: 79,
      totalPrompts: 86,
      insertedGate: true,
      masterStep: 'MASTER-8C.83.1',
      abStep: 'AB20.4.76.1',
      sourceStep: 'Prompt 79 of 86 / MASTER-8C.83.1 / AB20.4.76.1',
      status: 'blocked_seed_missing',
      statusLabel: 'Seed Missing',
      headline: 'Exercise knowledge seed is missing or empty',
      summary: 'Cannot evaluate source foundation without exercise knowledge entries.',
      previewOnly: true,
      readOnly: true,
      mutationAllowed: false,
      futureSessionsMutated: false,
      programCardsChanged: false,
      startWorkoutChanged: false,
      liveWorkoutChanged: false,
      storageTouched: false,
      apiTouched: false,
      dbTouched: false,
      schemaTouched: false,
      generatorTouched: false,
      methodPlannerTouched: false,
      completedSessionsProtected: true,
      exerciseSeedCount: 0,
      skillSeedCount: 0,
      validationErrorCount: 0,
      validationWarningCount: 0,
      highImpactFamilyCount: HIGH_IMPACT_FAMILIES.length,
      highImpactCoveredCount: 0,
      highImpactPartialCount: 0,
      highImpactMissingCount: HIGH_IMPACT_FAMILIES.length,
      currentProgramExerciseCount: input.currentProgramExerciseCount ?? 0,
      currentProgramFullScienceKnownCount: input.currentProgramFullScienceKnownCount ?? 0,
      currentProgramPartialOrBasicCount: input.currentProgramPartialOrBasicCount ?? 0,
      currentProgramUnknownCount: input.currentProgramUnknownCount ?? 0,
      highImpactFamilies: HIGH_IMPACT_FAMILIES.map(f => ({
        familyId: f.id,
        label: f.label,
        status: 'missing' as const,
        seedExerciseMatches: 0,
        seedSkillMatches: 0,
        requiredFieldsPresent: {
          identityAliases: false,
          unitTruth: false,
          skillTransfer: false,
          movementFamily: false,
          tissueStress: false,
          fatigueCost: false,
          frequencyTolerance: false,
          methodCompatibility: false,
          progressionRegression: false,
          bandAssistanceLogic: false,
          warmupNeeds: false,
          cooldownNeeds: false,
          prehabRehabTags: false,
          sourceEvidenceMetadata: false,
          confidenceLevel: false,
        },
        blockers: ['Seed missing'],
        nextSafeAction: 'Add exercise knowledge seed',
      })),
      blockers: ['Exercise knowledge seed is missing or empty'],
      safetyNotes: ['Mutation remains locked until seed is populated'],
      nextRequiredStep: 'Populate exercise knowledge seed before continuing',
    }
  }
  
  // Evaluate each high-impact family
  const highImpactFamilies = HIGH_IMPACT_FAMILIES.map(family => {
    const exerciseMatches = exerciseEntries.filter(e => 
      matchesFamily(e, family.matchPatterns, family.movementFamilies)
    )
    const skillMatches = skillEntries.filter(s => {
      const id = s.skillId.toLowerCase()
      return family.matchPatterns.some(p => id.includes(p.toLowerCase()))
    })
    return evaluateFamilyStatus(family.id, family.label, exerciseMatches, skillMatches)
  })
  
  const highImpactCoveredCount = highImpactFamilies.filter(f => f.status === 'source_backed').length
  const highImpactPartialCount = highImpactFamilies.filter(f => f.status === 'partial').length
  const highImpactMissingCount = highImpactFamilies.filter(f => f.status === 'missing').length
  
  // Determine overall status
  let status: ExerciseKnowledgeSourceFoundationStatus
  let statusLabel: string
  let headline: string
  let summary: string
  const blockers: string[] = []
  const safetyNotes: string[] = []
  
  if (highImpactMissingCount > 5) {
    status = 'blocked_contract_missing'
    statusLabel = 'Major Gaps'
    headline = 'Exercise knowledge foundation has major coverage gaps'
    summary = `${highImpactMissingCount} of ${HIGH_IMPACT_FAMILIES.length} high-impact families are missing from the seed. Mutation is not safe.`
    blockers.push(`${highImpactMissingCount} high-impact families have no entries`)
  } else if (highImpactCoveredCount < HIGH_IMPACT_FAMILIES.length / 2) {
    status = 'partial_source_foundation'
    statusLabel = 'Partial'
    headline = 'Exercise knowledge foundation is partially populated'
    summary = `${highImpactCoveredCount} covered, ${highImpactPartialCount} partial, ${highImpactMissingCount} missing. Read-only preview is safe; mutation requires backfill.`
    if (highImpactPartialCount > 0) {
      blockers.push(`${highImpactPartialCount} families have incomplete field coverage`)
    }
    if (highImpactMissingCount > 0) {
      blockers.push(`${highImpactMissingCount} families are missing entirely`)
    }
  } else if (highImpactPartialCount > 3 || highImpactMissingCount > 0) {
    status = 'mutation_not_allowed'
    statusLabel = 'Read-Only Safe'
    headline = 'Source foundation supports read-only preview but not mutation'
    summary = `${highImpactCoveredCount} families are source-backed. ${highImpactPartialCount + highImpactMissingCount} need backfill before mutation is authorized.`
    blockers.push('Some high-impact families lack complete source metadata')
  } else {
    status = 'read_only_ready'
    statusLabel = 'Foundation Ready'
    headline = 'Exercise knowledge source foundation is adequate'
    summary = `${exerciseSeedCount} exercises and ${skillSeedCount} skills in seed. ${highImpactCoveredCount} high-impact families are source-backed. Safe for read-only preview.`
  }
  
  // Add validation warnings to blockers
  if (validationErrorCount > 0) {
    blockers.push(`${validationErrorCount} validation error(s) in seed`)
  }
  
  // Safety notes
  safetyNotes.push('Mutation remains locked regardless of source foundation status')
  safetyNotes.push('This gate proves knowledge existence, not mutation authorization')
  safetyNotes.push('Program Cards, Start Workout, Live Workout remain unchanged')
  
  // Determine next step
  let nextRequiredStep: string
  if (status === 'blocked_contract_missing') {
    nextRequiredStep = 'Backfill missing exercise knowledge entries before continuing'
  } else if (status === 'partial_source_foundation' || status === 'mutation_not_allowed') {
    nextRequiredStep = 'Continue to Program Card Changed-Session Proof (original Prompt 79) with read-only source; targeted backfill can follow'
  } else {
    nextRequiredStep = 'Proceed to Program Card Changed-Session Proof (original Prompt 79 / now Prompt 80 of 86)'
  }
  
  return {
    promptNumber: 79,
    totalPrompts: 86,
    insertedGate: true,
    masterStep: 'MASTER-8C.83.1',
    abStep: 'AB20.4.76.1',
    sourceStep: 'Prompt 79 of 86 / MASTER-8C.83.1 / AB20.4.76.1',
    status,
    statusLabel,
    headline,
    summary,
    previewOnly: true,
    readOnly: true,
    mutationAllowed: false,
    futureSessionsMutated: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    storageTouched: false,
    apiTouched: false,
    dbTouched: false,
    schemaTouched: false,
    generatorTouched: false,
    methodPlannerTouched: false,
    completedSessionsProtected: true,
    exerciseSeedCount,
    skillSeedCount,
    validationErrorCount,
    validationWarningCount,
    highImpactFamilyCount: HIGH_IMPACT_FAMILIES.length,
    highImpactCoveredCount,
    highImpactPartialCount,
    highImpactMissingCount,
    currentProgramExerciseCount: input.currentProgramExerciseCount ?? 0,
    currentProgramFullScienceKnownCount: input.currentProgramFullScienceKnownCount ?? 0,
    currentProgramPartialOrBasicCount: input.currentProgramPartialOrBasicCount ?? 0,
    currentProgramUnknownCount: input.currentProgramUnknownCount ?? 0,
    highImpactFamilies,
    blockers,
    safetyNotes,
    nextRequiredStep,
  }
}

// -----------------------------------------------------------------------------
// UI Helper Functions
// -----------------------------------------------------------------------------

export function getExerciseKnowledgeSourceFoundationStatusLabel(
  status: ExerciseKnowledgeSourceFoundationStatus
): string {
  switch (status) {
    case 'blocked_seed_missing':
      return 'Seed Missing'
    case 'blocked_contract_missing':
      return 'Major Gaps'
    case 'partial_source_foundation':
      return 'Partial'
    case 'read_only_ready':
      return 'Foundation Ready'
    case 'mutation_not_allowed':
      return 'Read-Only Safe'
    default:
      return 'Unknown'
  }
}

export function getExerciseKnowledgeSourceFoundationStatusColor(
  status: ExerciseKnowledgeSourceFoundationStatus
): 'red' | 'amber' | 'lime' | 'sky' {
  switch (status) {
    case 'blocked_seed_missing':
    case 'blocked_contract_missing':
      return 'red'
    case 'partial_source_foundation':
      return 'amber'
    case 'read_only_ready':
      return 'lime'
    case 'mutation_not_allowed':
      return 'sky'
    default:
      return 'amber'
  }
}

export function getHighImpactFamilyStatusColor(
  status: 'source_backed' | 'partial' | 'missing'
): string {
  switch (status) {
    case 'source_backed':
      return 'bg-lime-500/10 text-lime-400/70 border-lime-500/20'
    case 'partial':
      return 'bg-amber-500/10 text-amber-400/70 border-amber-500/20'
    case 'missing':
      return 'bg-red-500/10 text-red-400/70 border-red-500/20'
    default:
      return 'bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20'
  }
}
