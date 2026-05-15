/**
 * PROGRAM BALANCE EXERCISE IDENTITY COVERAGE — MASTER-8C.1.2
 *
 * =============================================================================
 * EXERCISE IDENTITY COVERAGE ADAPTER FOR PROGRAM BALANCE
 * =============================================================================
 *
 * This module resolves exercise identity across multiple app data sources:
 *   1. Full science seed (Program Balance complete entries)
 *   2. Adaptive exercise pool (basic app identity)
 *   3. Enhanced exercise intelligence (partial enhanced profiles)
 *
 * CRITICAL DISTINCTION:
 *   - "Full science known" = complete ExerciseSkillKnowledgeEntry exists
 *   - "Basic identity known" = exercise exists in adaptive pool with basic metadata
 *   - "Enhanced partial known" = has enhanced intelligence profile but not full science
 *   - "Alias resolved" = matched through ID/name normalization
 *   - "Truly unknown" = not found in any source
 *
 * This separation prevents misleading coverage reports that treat pool-known
 * exercises as "totally unknown" just because they lack full science entries.
 *
 * Created: May 14th, 2026
 * Step: MASTER-8C.1.2
 */

import { getExerciseById as getPoolExercise, getAllExercises as getAllPoolExercises, type Exercise as PoolExercise } from '@/lib/adaptive-exercise-pool'
import { getExerciseSkillKnowledgeEntries, getSkillKnowledgeEntries, getExerciseSkillKnowledgeEntry, findKnowledgeByAlias } from './exercise-skill-knowledge-validation'

// =============================================================================
// IDENTITY COVERAGE TYPES
// =============================================================================

/**
 * Coverage status for a single exercise
 */
export type ExerciseIdentityCoverageStatus =
  | 'full_science_known'      // Complete Program Balance ExerciseSkillKnowledgeEntry exists
  | 'basic_identity_known'    // Exists in adaptive pool but lacks full science entry
  | 'enhanced_partial_known'  // Has enhanced profile but not full science
  | 'alias_resolved'          // Matched through ID/name normalization
  | 'truly_unknown'           // Not found in any source

/**
 * Resolution result for a single exercise
 */
export interface ExerciseIdentityCoverageResult {
  readonly exerciseId: string
  readonly exerciseName: string
  readonly status: ExerciseIdentityCoverageStatus
  readonly fullScienceEntry: boolean
  readonly basicPoolEntry: boolean
  readonly enhancedProfile: boolean
  readonly resolvedFromAlias: boolean
  readonly resolvedCanonicalId: string | null
  readonly resolvedCanonicalName: string | null
  readonly sourceDetails: string
}

/**
 * Summary of identity coverage across all exercises
 */
export interface ExerciseIdentityCoverageSummary {
  readonly totalExerciseCount: number
  readonly fullScienceKnownCount: number
  readonly basicIdentityKnownCount: number
  readonly enhancedPartialKnownCount: number
  readonly aliasResolvedCount: number
  readonly trulyUnknownCount: number
  readonly fullScienceKnownIds: readonly string[]
  readonly basicIdentityKnownIds: readonly string[]
  readonly enhancedPartialKnownIds: readonly string[]
  readonly aliasResolvedIds: readonly string[]
  readonly trulyUnknownIds: readonly string[]
  readonly trulyUnknownNames: readonly string[]
  /** Full science DB is complete for current program when all are full_science_known */
  readonly fullScienceCoverageComplete: boolean
  /** Basic identity coverage complete when no truly_unknown exercises */
  readonly basicIdentityCoverageComplete: boolean
  /** Source counts for transparency */
  readonly sourceCounts: {
    readonly fullScienceSeedTotal: number
    readonly adaptivePoolTotal: number
  }
}

// =============================================================================
// ID/NAME NORMALIZATION HELPERS
// =============================================================================

/**
 * Normalize exercise ID for matching
 */
function normalizeExerciseId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Normalize exercise name for matching
 */
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Common alias mappings for exercise IDs
 */
const EXERCISE_ID_ALIASES: Record<string, string[]> = {
  // Common variations
  'pull_up': ['pullup', 'pullups', 'pull_ups'],
  'push_up': ['pushup', 'pushups', 'push_ups'],
  'dip': ['dips'],
  'chin_up': ['chinup', 'chinups', 'chin_ups'],
  'l_sit': ['l_sit_skill', 'lsit'],
  'l_sit_skill': ['l_sit', 'lsit'],
  'pike_pushup': ['pike_push_up', 'pike_press'],
  'pike_push_up': ['pike_pushup', 'pike_press'],
  'hspu': ['handstand_push_up', 'handstand_pushup'],
  'wall_hspu': ['wall_handstand_push_up', 'wall_handstand_pushup'],
  'pppu': ['pseudo_planche_push_up', 'pseudo_planche_pushup', 'planche_lean_push_up'],
  'elevated_pppu': ['elevated_pseudo_planche_push_up', 'high_lean_pppu'],
  'tuck_fl': ['tuck_front_lever', 'tuck_front_lever_hold'],
  'adv_tuck_fl': ['advanced_tuck_front_lever', 'adv_tuck_front_lever'],
  'adv_tuck_planche': ['advanced_tuck_planche'],
  'tuck_planche': ['tuck_planche_hold'],
  'dragon_flag': ['dragonf_flag'],
  'hollow_body': ['hollow_hold', 'hollow_body_hold'],
}

/**
 * Build reverse alias map for lookups
 */
function buildReverseAliasMap(): Map<string, string> {
  const reverseMap = new Map<string, string>()
  for (const [canonical, aliases] of Object.entries(EXERCISE_ID_ALIASES)) {
    for (const alias of aliases) {
      reverseMap.set(normalizeExerciseId(alias), canonical)
    }
  }
  return reverseMap
}

const REVERSE_ALIAS_MAP = buildReverseAliasMap()

// =============================================================================
// CACHED LOOKUPS (built lazily)
// =============================================================================

let cachedPoolExerciseIds: Set<string> | null = null
let cachedPoolExerciseNames: Map<string, string> | null = null
let cachedScienceExerciseIds: Set<string> | null = null

function getPoolExerciseIds(): Set<string> {
  if (!cachedPoolExerciseIds) {
    const exercises = getAllPoolExercises()
    cachedPoolExerciseIds = new Set(exercises.map(e => normalizeExerciseId(e.id)))
  }
  return cachedPoolExerciseIds
}

function getPoolExerciseNameMap(): Map<string, string> {
  if (!cachedPoolExerciseNames) {
    cachedPoolExerciseNames = new Map()
    const exercises = getAllPoolExercises()
    for (const e of exercises) {
      cachedPoolExerciseNames.set(normalizeExerciseName(e.name), e.id)
    }
  }
  return cachedPoolExerciseNames
}

function getScienceExerciseIds(): Set<string> {
  if (!cachedScienceExerciseIds) {
    const entries = getExerciseSkillKnowledgeEntries()
    cachedScienceExerciseIds = new Set(entries.map(e => normalizeExerciseId(e.exerciseId)))
  }
  return cachedScienceExerciseIds
}

// =============================================================================
// MAIN RESOLUTION FUNCTIONS
// =============================================================================

/**
 * Resolve identity coverage for a single exercise
 */
export function resolveExerciseIdentityCoverage(
  exerciseId: string,
  exerciseName: string
): ExerciseIdentityCoverageResult {
  const normalizedId = normalizeExerciseId(exerciseId)
  const normalizedName = normalizeExerciseName(exerciseName)
  
  const scienceIds = getScienceExerciseIds()
  const poolIds = getPoolExerciseIds()
  const poolNameMap = getPoolExerciseNameMap()
  
  // 1. Check full science seed (direct match)
  const scienceEntry = getExerciseSkillKnowledgeEntry(exerciseId)
  if (scienceEntry) {
    return {
      exerciseId,
      exerciseName,
      status: 'full_science_known',
      fullScienceEntry: true,
      basicPoolEntry: poolIds.has(normalizedId),
      enhancedProfile: false, // Could check enhanced-exercise-intelligence if needed
      resolvedFromAlias: false,
      resolvedCanonicalId: scienceEntry.exerciseId,
      resolvedCanonicalName: scienceEntry.canonicalName,
      sourceDetails: 'Full Program Balance science entry',
    }
  }
  
  // 2. Check science seed via alias
  const aliasCanonicalId = REVERSE_ALIAS_MAP.get(normalizedId)
  if (aliasCanonicalId) {
    const aliasedEntry = getExerciseSkillKnowledgeEntry(aliasCanonicalId)
    if (aliasedEntry) {
      return {
        exerciseId,
        exerciseName,
        status: 'alias_resolved',
        fullScienceEntry: true,
        basicPoolEntry: poolIds.has(normalizedId) || poolIds.has(normalizeExerciseId(aliasCanonicalId)),
        enhancedProfile: false,
        resolvedFromAlias: true,
        resolvedCanonicalId: aliasedEntry.exerciseId,
        resolvedCanonicalName: aliasedEntry.canonicalName,
        sourceDetails: `Alias resolved to ${aliasedEntry.exerciseId}`,
      }
    }
  }
  
  // 3. Check adaptive pool (direct match)
  if (poolIds.has(normalizedId)) {
    const poolExercise = getPoolExercise(exerciseId)
    return {
      exerciseId,
      exerciseName,
      status: 'basic_identity_known',
      fullScienceEntry: false,
      basicPoolEntry: true,
      enhancedProfile: false,
      resolvedFromAlias: false,
      resolvedCanonicalId: poolExercise?.id ?? exerciseId,
      resolvedCanonicalName: poolExercise?.name ?? exerciseName,
      sourceDetails: 'Found in adaptive exercise pool (basic identity)',
    }
  }
  
  // 4. Check adaptive pool via name match
  const poolIdFromName = poolNameMap.get(normalizedName)
  if (poolIdFromName) {
    const poolExercise = getPoolExercise(poolIdFromName)
    return {
      exerciseId,
      exerciseName,
      status: 'basic_identity_known',
      fullScienceEntry: false,
      basicPoolEntry: true,
      enhancedProfile: false,
      resolvedFromAlias: true,
      resolvedCanonicalId: poolIdFromName,
      resolvedCanonicalName: poolExercise?.name ?? exerciseName,
      sourceDetails: `Name matched to ${poolIdFromName} in adaptive pool`,
    }
  }
  
  // 5. Check pool via alias
  if (aliasCanonicalId && poolIds.has(normalizeExerciseId(aliasCanonicalId))) {
    const poolExercise = getPoolExercise(aliasCanonicalId)
    return {
      exerciseId,
      exerciseName,
      status: 'basic_identity_known',
      fullScienceEntry: false,
      basicPoolEntry: true,
      enhancedProfile: false,
      resolvedFromAlias: true,
      resolvedCanonicalId: aliasCanonicalId,
      resolvedCanonicalName: poolExercise?.name ?? exerciseName,
      sourceDetails: `Alias resolved to ${aliasCanonicalId} in adaptive pool`,
    }
  }
  
  // 6. Truly unknown
  return {
    exerciseId,
    exerciseName,
    status: 'truly_unknown',
    fullScienceEntry: false,
    basicPoolEntry: false,
    enhancedProfile: false,
    resolvedFromAlias: false,
    resolvedCanonicalId: null,
    resolvedCanonicalName: null,
    sourceDetails: 'Not found in any exercise source',
  }
}

/**
 * Summarize identity coverage for a list of exercises
 */
export function summarizeExerciseIdentityCoverage(
  exercises: readonly { id: string; name: string }[]
): ExerciseIdentityCoverageSummary {
  const results = exercises.map(e => resolveExerciseIdentityCoverage(e.id, e.name))
  
  const fullScienceKnown = results.filter(r => r.status === 'full_science_known')
  const basicIdentityKnown = results.filter(r => r.status === 'basic_identity_known')
  const enhancedPartialKnown = results.filter(r => r.status === 'enhanced_partial_known')
  const aliasResolved = results.filter(r => r.status === 'alias_resolved')
  const trulyUnknown = results.filter(r => r.status === 'truly_unknown')
  
  const scienceEntries = getExerciseSkillKnowledgeEntries()
  const poolExercises = getAllPoolExercises()
  
  return {
    totalExerciseCount: exercises.length,
    fullScienceKnownCount: fullScienceKnown.length,
    basicIdentityKnownCount: basicIdentityKnown.length,
    enhancedPartialKnownCount: enhancedPartialKnown.length,
    aliasResolvedCount: aliasResolved.length,
    trulyUnknownCount: trulyUnknown.length,
    fullScienceKnownIds: fullScienceKnown.map(r => r.exerciseId),
    basicIdentityKnownIds: basicIdentityKnown.map(r => r.exerciseId),
    enhancedPartialKnownIds: enhancedPartialKnown.map(r => r.exerciseId),
    aliasResolvedIds: aliasResolved.map(r => r.exerciseId),
    trulyUnknownIds: trulyUnknown.map(r => r.exerciseId),
    trulyUnknownNames: trulyUnknown.map(r => r.exerciseName),
    // Full science coverage = all exercises have full science entries (including alias resolved)
    fullScienceCoverageComplete: exercises.length > 0 && 
      (fullScienceKnown.length + aliasResolved.length) === exercises.length,
    // Basic identity coverage = no truly unknown exercises
    basicIdentityCoverageComplete: exercises.length > 0 && trulyUnknown.length === 0,
    sourceCounts: {
      fullScienceSeedTotal: scienceEntries.length,
      adaptivePoolTotal: poolExercises.length,
    },
  }
}

/**
 * Get total counts of exercise sources (for UI display)
 */
export function getExerciseSourceCounts(): {
  fullScienceSeedCount: number
  adaptivePoolCount: number
} {
  return {
    fullScienceSeedCount: getExerciseSkillKnowledgeEntries().length,
    adaptivePoolCount: getAllPoolExercises().length,
  }
}
