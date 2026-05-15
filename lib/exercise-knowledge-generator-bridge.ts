/**
 * EXERCISE KNOWLEDGE GENERATOR BRIDGE — MASTER-8C.5
 *
 * =============================================================================
 * READ-ONLY ENRICHMENT BRIDGE FOR GENERATOR/SELECTOR
 * =============================================================================
 *
 * This module bridges the exercise knowledge foundation (exercise-skill-knowledge-seed.ts)
 * into the generator/selector pipeline (program-exercise-selector.ts) WITHOUT replacing
 * the adaptive exercise pool.
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No localStorage, no Date.now, no React imports
 *   - No database calls, no route calls
 *   - No UI imports, no `as any`, no `@ts-ignore`
 *   - No mutation of source data
 *   - Read-only enrichment only
 *
 * Created: MASTER-8C.5
 */

import type { Exercise } from './adaptive-exercise-pool'
import type { ExerciseSkillKnowledgeEntry, MethodCompatibilityProfile } from './program/exercise-skill-knowledge-contract'
import { getExerciseSkillKnowledgeEntry, findKnowledgeByAlias } from './program/exercise-skill-knowledge-validation'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Method compatibility verdict for selector use
 * Maps from knowledge contract verdicts to generator-friendly verdicts
 */
export interface GeneratorMethodCompatibilityVerdict {
  readonly methodId: string
  readonly verdict: 'preferred' | 'allowed' | 'caution' | 'avoid' | 'blocked'
  readonly rationale: string
}

/**
 * Training cost breakdown for selector use
 */
export interface GeneratorTrainingCost {
  readonly neuralCost: number | null
  readonly tendonCost: number | null
  readonly systemicFatigueCost: number | null
  readonly jointCost: number | null
  readonly localMuscleCost: number | null
}

/**
 * Flags indicating what knowledge can influence in the generator
 */
export interface GeneratorUseFlags {
  readonly canInfluenceScoring: boolean
  readonly canInfluenceMethodCompatibility: boolean
  readonly canInfluenceTissueStress: boolean
  readonly canInfluenceSkillTransfer: boolean
}

/**
 * Enriched exercise with knowledge data for generator use
 */
export interface GeneratorKnowledgeEnrichedExercise {
  readonly exercise: Exercise
  readonly knowledge: ExerciseSkillKnowledgeEntry | null
  readonly knowledgeMatched: boolean
  readonly knowledgeExerciseId: string | null
  readonly movementBalanceFamilies: readonly string[]
  readonly tissueStressRegions: readonly string[]
  readonly trainingPurposes: readonly string[]
  readonly skillTransferTargets: readonly string[]
  readonly methodCompatibilityVerdicts: readonly GeneratorMethodCompatibilityVerdict[]
  readonly prescriptionUnitTruth: string | null
  readonly frequencyTolerance: string | null
  readonly trainingCost: GeneratorTrainingCost
  readonly generatorUseFlags: GeneratorUseFlags
}

/**
 * Summary of knowledge consumption for a set of exercises
 */
export interface GeneratorKnowledgeConsumptionSummary {
  readonly poolCount: number
  readonly matchedCount: number
  readonly missingCount: number
  readonly matchedIds: readonly string[]
  readonly missingIds: readonly string[]
  readonly consumptionMode: 'read_only_enrichment'
  readonly mutationApplied: false
  readonly verdict: 'ready' | 'partial' | 'blocked'
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Normalize method key for selector compatibility
 * Handles plural/singular variations (e.g., 'supersets' vs 'superset')
 */
export function normalizeKnowledgeMethodKeyForSelector(methodId: string): string {
  const normalized = methodId.toLowerCase().trim()
  // Handle common variations
  const mappings: Record<string, string> = {
    'supersets': 'superset',
    'circuits': 'circuit',
    'density_blocks': 'density_block',
    'drop_sets': 'drop_set',
    'cluster_sets': 'cluster_set',
    'rest_pause': 'rest_pause',
    'top_set_backoff': 'top_set_backoff',
    'endurance_density': 'endurance_density',
  }
  return mappings[normalized] ?? normalized
}

/**
 * Convert MethodCompatibilityProfile to GeneratorMethodCompatibilityVerdict
 */
function convertMethodProfile(profile: MethodCompatibilityProfile): GeneratorMethodCompatibilityVerdict {
  return {
    methodId: normalizeKnowledgeMethodKeyForSelector(profile.methodId),
    verdict: profile.verdict,
    rationale: profile.rationale,
  }
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get knowledge entry for a pool exercise
 * Tries: exact ID match, then canonical ID, then alias/name match
 */
export function getGeneratorExerciseKnowledgeForPoolExercise(
  exercise: Exercise
): ExerciseSkillKnowledgeEntry | null {
  // Try exact ID match first
  const byId = getExerciseSkillKnowledgeEntry(exercise.id)
  if (byId) return byId

  // Try canonical exercise ID if present
  const canonicalId = (exercise as { canonicalExerciseId?: string }).canonicalExerciseId
  if (canonicalId) {
    const byCanonical = getExerciseSkillKnowledgeEntry(canonicalId)
    if (byCanonical) return byCanonical
  }

  // Try alias/name match
  const byAlias = findKnowledgeByAlias(exercise.name)
  if (byAlias) return byAlias

  // Try ID as alias (some IDs are human-readable)
  const byIdAsAlias = findKnowledgeByAlias(exercise.id)
  if (byIdAsAlias) return byIdAsAlias

  return null
}

/**
 * Enrich a pool exercise with knowledge data for generator selection
 */
export function enrichExerciseForGeneratorSelection(
  exercise: Exercise
): GeneratorKnowledgeEnrichedExercise {
  const knowledge = getGeneratorExerciseKnowledgeForPoolExercise(exercise)

  if (!knowledge) {
    // Return with empty knowledge fields
    return {
      exercise,
      knowledge: null,
      knowledgeMatched: false,
      knowledgeExerciseId: null,
      movementBalanceFamilies: [],
      tissueStressRegions: [],
      trainingPurposes: [],
      skillTransferTargets: [],
      methodCompatibilityVerdicts: [],
      prescriptionUnitTruth: null,
      frequencyTolerance: null,
      trainingCost: {
        neuralCost: null,
        tendonCost: null,
        systemicFatigueCost: null,
        jointCost: null,
        localMuscleCost: null,
      },
      generatorUseFlags: {
        canInfluenceScoring: false,
        canInfluenceMethodCompatibility: false,
        canInfluenceTissueStress: false,
        canInfluenceSkillTransfer: false,
      },
    }
  }

  // Extract tissue stress regions from tissueStressProfile array
  const tissueStressRegions: string[] = []
  if (knowledge.tissueStressProfile && Array.isArray(knowledge.tissueStressProfile)) {
    for (const profile of knowledge.tissueStressProfile) {
      if (profile.region && profile.magnitude !== 'none') {
        tissueStressRegions.push(profile.region)
      }
    }
  }

  // Extract skill transfer targets from skillTransfers array
  const skillTransferTargets: string[] = []
  if (knowledge.skillTransfers && Array.isArray(knowledge.skillTransfers)) {
    for (const profile of knowledge.skillTransfers) {
      skillTransferTargets.push(profile.skillId)
    }
  }

  // Convert method compatibility profiles
  const methodCompatibilityVerdicts: GeneratorMethodCompatibilityVerdict[] = []
  if (knowledge.methodCompatibility && Array.isArray(knowledge.methodCompatibility)) {
    for (const profile of knowledge.methodCompatibility) {
      methodCompatibilityVerdicts.push(convertMethodProfile(profile))
    }
  }

  // Extract training cost
  const trainingCost: GeneratorTrainingCost = {
    neuralCost: knowledge.trainingCost?.neuralCost ?? null,
    tendonCost: knowledge.trainingCost?.tendonCost ?? null,
    systemicFatigueCost: knowledge.trainingCost?.systemicFatigueCost ?? null,
    jointCost: knowledge.trainingCost?.jointCost ?? null,
    localMuscleCost: knowledge.trainingCost?.localMuscleCost ?? null,
  }

  // Determine what can be influenced
  const canInfluenceScoring = Boolean(
    (knowledge.trainingPurposes && knowledge.trainingPurposes.length > 0) ||
    knowledge.trainingCost ||
    (knowledge.movementFamilies && knowledge.movementFamilies.length > 0)
  )
  const canInfluenceMethodCompatibility = Boolean(
    knowledge.methodCompatibility && knowledge.methodCompatibility.length > 0
  )
  const canInfluenceTissueStress = Boolean(
    knowledge.tissueStressProfile && knowledge.tissueStressProfile.length > 0
  )
  const canInfluenceSkillTransfer = Boolean(
    knowledge.skillTransfers && knowledge.skillTransfers.length > 0
  )

  return {
    exercise,
    knowledge,
    knowledgeMatched: true,
    knowledgeExerciseId: knowledge.exerciseId,
    movementBalanceFamilies: knowledge.movementFamilies ?? [],
    tissueStressRegions,
    trainingPurposes: knowledge.trainingPurposes ?? [],
    skillTransferTargets,
    methodCompatibilityVerdicts,
    prescriptionUnitTruth: knowledge.prescriptionUnit ?? null,
    frequencyTolerance: knowledge.frequencyTolerance ?? null,
    trainingCost,
    generatorUseFlags: {
      canInfluenceScoring,
      canInfluenceMethodCompatibility,
      canInfluenceTissueStress,
      canInfluenceSkillTransfer,
    },
  }
}

/**
 * Build a summary of knowledge consumption for a set of exercises
 */
export function buildGeneratorKnowledgeConsumptionSummary(
  exercises: readonly Exercise[]
): GeneratorKnowledgeConsumptionSummary {
  const matchedIds: string[] = []
  const missingIds: string[] = []

  for (const exercise of exercises) {
    const knowledge = getGeneratorExerciseKnowledgeForPoolExercise(exercise)
    if (knowledge) {
      matchedIds.push(exercise.id)
    } else {
      missingIds.push(exercise.id)
    }
  }

  const poolCount = exercises.length
  const matchedCount = matchedIds.length
  const missingCount = missingIds.length

  // Determine verdict
  let verdict: 'ready' | 'partial' | 'blocked'
  if (missingCount === 0) {
    verdict = 'ready'
  } else if (matchedCount > 0) {
    verdict = 'partial'
  } else {
    verdict = 'blocked'
  }

  return {
    poolCount,
    matchedCount,
    missingCount,
    matchedIds,
    missingIds,
    consumptionMode: 'read_only_enrichment',
    mutationApplied: false,
    verdict,
  }
}

/**
 * Get method compatibility verdict for an exercise and method
 * Returns null if no knowledge or no compatibility data for that method
 */
export function getMethodCompatibilityForExercise(
  exercise: Exercise,
  methodKey: string
): GeneratorMethodCompatibilityVerdict | null {
  const enriched = enrichExerciseForGeneratorSelection(exercise)
  if (!enriched.knowledgeMatched) return null

  const normalizedMethodKey = normalizeKnowledgeMethodKeyForSelector(methodKey)
  for (const verdict of enriched.methodCompatibilityVerdicts) {
    if (verdict.methodId === normalizedMethodKey) {
      return verdict
    }
  }

  return null
}
