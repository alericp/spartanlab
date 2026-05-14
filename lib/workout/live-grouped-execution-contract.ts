/**
 * =============================================================================
 * [PHASE 4Y] LIVE GROUPED EXECUTION CONTRACT — H.H5 RUNTIME PARITY
 * =============================================================================
 *
 * Closes the last open leg of Phase H: "live workout does not silently flatten
 * grouped methods". H.H1-H.H4 already proved that:
 *
 *   - the selected variant survives Start Workout (selected-variant-session-contract)
 *   - the loader preserves methodStructures (load-authoritative-session)
 *   - the normalizer preserves styledGroups (normalize-workout-session)
 *   - row-level method fields survive (setExecutionMethod, densityPrescription,
 *     doctrineApplicationDeltas, structuralMethodDeltas, targetWeightedRPE)
 *
 * The remaining concern was that the live runtime in
 * `components/workout/StreamlinedWorkoutSession.tsx` only built its
 * `ExecutionPlan` from `styleMetadata.styledGroups` (subject to a
 * shadow-owner guard) and otherwise fell back to a flat
 * `deriveExecutionPlanFromExercises(...)` call. When the canonical Phase 4P
 * `methodStructures[]` carried executable grouped truth (superset / circuit /
 * cluster / density_block) but `styledGroups` was either absent or rejected
 * by the shadow-owner guard, the live runtime would silently flatten the
 * grouped work into independent rows.
 *
 * This module is the H.H5 closer. It is PURE and has no side effects:
 *
 *   1. `evaluateLiveGroupedExecution(session, opts)` returns a parity verdict
 *      that proves the live runtime is genuinely grouped (or honestly states
 *      why it is guidance-only). Used by the source-map and the live UI
 *      banner.
 *   2. `buildExecutionBlocksFromMethodStructures(methodStructures, exercises,
 *      opts)` is a secondary block builder the live corridor can call when
 *      `styledGroups` is unavailable or rejected. The result is shape-
 *      compatible with `ExecutionBlock` from `live-workout-machine.ts` and
 *      drops members that do not bind to a real session exercise (no
 *      invented exercises, no ghost members).
 *
 * Doctrine-quality concerns (recovery / intensity / adaptiveness) are
 * intentionally NOT in scope here — see `docs/SPARTANLAB_MASTER_TRUTH_
 * CONNECTION_BLUEPRINT.md` deferred audit note.
 * =============================================================================
 */

import type {
  CanonicalMethodStructure,
  CanonicalMethodFamily,
} from '@/lib/program/method-structure-contract'
import type {
  ExecutionBlock,
  MachineExercise,
} from '@/lib/workout/live-workout-machine'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Outcome verdict for the live runtime, published on the source map and
 * surfaced in the live UI banner. The four meaningful values:
 *
 *   - `FULL_GROUPED_RUNTIME` — at least one grouped block is executable AND
 *     the runtime will dispatch grouped actions for it.
 *   - `STRAIGHT_SETS_ONLY_NO_GROUPS` — the session is intentionally straight
 *     sets only. No verdict cost.
 *   - `LIVE_GUIDANCE_PRESERVED_ONLY` — grouped data exists but cannot be
 *     executed safely. Live UI must show an honest "guidance only" banner.
 *   - `GROUPED_RUNTIME_PARTIAL` — some grouped blocks are executable, some
 *     are guidance-only.
 *   - `GROUPED_RUNTIME_BLOCKED` — every grouped block is guidance/blocked.
 */
export type LiveGroupedRuntimeVerdict =
  | 'FULL_GROUPED_RUNTIME'
  | 'STRAIGHT_SETS_ONLY_NO_GROUPS'
  | 'LIVE_GUIDANCE_PRESERVED_ONLY'
  | 'GROUPED_RUNTIME_PARTIAL'
  | 'GROUPED_RUNTIME_BLOCKED'

/** Stable reason codes attached to the verdict (for proof strips + dev probes). */
export type LiveGroupedRuntimeReason =
  | 'NO_GROUPED_METHODS_PRESENT'
  | 'METHOD_STRUCTURE_MEMBERS_BOUND'
  | 'STYLED_GROUP_MEMBERS_BOUND'
  | 'ROW_LEVEL_METHOD_ONLY'
  | 'GROUP_MEMBER_REF_NOT_FOUND'
  | 'UNSUPPORTED_METHOD_TYPE'
  | 'MISSING_ROUND_OR_SET_CONTRACT'
  | 'DENSITY_RUNTIME_NOT_SUPPORTED_YET'
  | 'DENSITY_TIME_CAP_MISSING' // [AB7] Density block exists but has no timeCapMinutes
  | 'DENSITY_EXECUTABLE_WITH_TIME_CAP' // [AB7] Density block is safe to execute
  | 'SAFE_GROUPED_RUNTIME_READY'
  | 'GUIDANCE_ONLY_PRESERVED'
  | 'FLAT_FALLBACK_REQUIRED'
  | 'STYLED_GROUP_FLATTENED_SEQUENCE_MISMATCH'
  | 'METHOD_STRUCTURE_STATUS_NOT_APPLIED'
  | 'CLUSTER_AT_LEAST_ONE_MEMBER_OK'

/** Source the live runtime ultimately consumed for its execution blocks. */
export type LiveExecutionBlockSource =
  | 'methodStructures'
  | 'styledGroups'
  | 'rowLevelMethods'
  | 'flatRows'

export type LiveExecutionBlockSafetyStatus = 'executable' | 'guidanceOnly' | 'blocked'

export interface LiveGroupedExecutionGroupSafety {
  groupId: string
  methodFamily: string
  safetyStatus: LiveExecutionBlockSafetyStatus
  blockedReason?: LiveGroupedRuntimeReason
  /** Member ids in display order (only those that bound to a real session row). */
  boundMemberIds: string[]
  /** Member ids that failed to bind (referenced but not in session). */
  unboundMemberIds: string[]
}

export interface LiveGroupedExecutionDiagnostics {
  totalExercises: number
  totalBlocks: number
  groupedBlocks: number
  flatBlocks: number
  unmatchedGroupRefs: string[]
  unsupportedGroupTypes: string[]
}

export interface LiveGroupedExecutionResult {
  parityVerdict: LiveGroupedRuntimeVerdict
  reasons: LiveGroupedRuntimeReason[]
  /** Where the actual live runtime got its grouped blocks (or would get them). */
  source: LiveExecutionBlockSource
  /** Whether the live runtime can dispatch grouped actions for at least one block. */
  hasExecutableGroupedBlocks: boolean
  groupSafety: LiveGroupedExecutionGroupSafety[]
  diagnostics: LiveGroupedExecutionDiagnostics
}

// =============================================================================
// INPUT SHAPES — defensive readers (no schema assumptions beyond the contract)
// =============================================================================

interface SessionLike {
  methodStructures?: unknown
  styleMetadata?: { styledGroups?: unknown } | null
  exercises?: unknown
}

interface ExerciseRefLike {
  id?: unknown
  name?: unknown
}

interface StyledGroupLike {
  id?: unknown
  groupType?: unknown
  exercises?: ExerciseRefLike[]
}

// =============================================================================
// HELPERS
// =============================================================================

/** Grouped families the live runtime supports as interactive sequences. */
const EXECUTABLE_GROUPED_FAMILIES: ReadonlySet<CanonicalMethodFamily> = new Set<CanonicalMethodFamily>([
  'superset',
  'circuit',
  'cluster',
  // [AB7] density_block is now executable when timeCapMinutes is present
  'density_block',
])

/** Grouped families that exist on the program side but are not yet runtime-safe. */
const GUIDANCE_ONLY_GROUPED_FAMILIES: ReadonlySet<CanonicalMethodFamily> = new Set<CanonicalMethodFamily>([
  // [AB7] density_block moved to executable - empty set for now
])

// =============================================================================
// [AB20.4.5.4.4] STATUS NORMALIZATION
// =============================================================================

/**
 * [AB20.4.5.4.4] Normalizes method status variations to a canonical form.
 * 
 * The UI/Planner surfaces use different status words: "applied", "materialized",
 * "user_applied", "override_applied", etc. The live runtime should accept all
 * variations that mean "this method should execute".
 */
export function normalizeMethodStatus(rawStatus: unknown): 'applied' | 'already_applied' | 'blocked' | 'not_needed' | 'unknown' {
  if (typeof rawStatus !== 'string') return 'unknown'
  const s = rawStatus.toLowerCase().trim()
  
  // Treat these as executable "applied" status
  if (s === 'applied') return 'applied'
  if (s === 'already_applied') return 'already_applied'
  if (s === 'materialized') return 'applied'
  if (s === 'already_materialized') return 'already_applied'
  if (s === 'override_applied') return 'applied'
  if (s === 'user_applied') return 'applied'
  if (s === 'success') return 'applied' // Some paths return {status: 'success'}
  
  // Treat these as blocked/not-executable
  if (s === 'blocked') return 'blocked'
  if (s === 'not_needed') return 'not_needed'
  if (s === 'no_safe_target') return 'blocked'
  if (s === 'not_connected') return 'blocked'
  if (s === 'error') return 'blocked'
  if (s === 'failed') return 'blocked'
  
  return 'unknown'
}

// =============================================================================
// [AB15.6.2] GROUPED ROUND AUTHORITY RESOLVER
// =============================================================================

export interface GroupedRoundsResolution {
  targetRounds: number
  policy: 'explicit_rounds' | 'unanimous_member_sets' | 'normalized_min_sets' | 'fallback_default'
  memberSetCounts: number[]
  hadMismatch: boolean
  reason: string
}

/**
 * [AB15.6.2] Resolves authoritative grouped runtime rounds.
 * 
 * For superset/circuit, there must be ONE authoritative round count.
 * - If explicit `methodRounds` is provided and valid, use it.
 * - If all member set counts match, use that count.
 * - If member set counts mismatch, normalize to the MINIMUM positive member set count.
 *   Example: Archer Pull-Ups 3, Pull-Ups 4 → grouped rounds = 3
 * - Never create unlabeled "leftover" member work in a grouped block.
 * 
 * This prevents the confusing state where a 3-set and 4-set exercise appear
 * in the same superset but the UI shows different totals for each member.
 */
export function resolveGroupedRuntimeRounds(
  memberExercises: Array<{ sets?: number; name?: string }>,
  methodRounds?: number | null,
): GroupedRoundsResolution {
  // Extract valid set counts from members
  const memberSetCounts = memberExercises.map(ex => {
    const sets = typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 0
    return sets
  })
  
  // Filter to positive counts only
  const positiveCounts = memberSetCounts.filter(s => s > 0)
  
  // If explicit method rounds are provided and valid, use them
  if (typeof methodRounds === 'number' && methodRounds > 0) {
    return {
      targetRounds: Math.round(methodRounds),
      policy: 'explicit_rounds',
      memberSetCounts,
      hadMismatch: false,
      reason: `Using explicit method rounds: ${methodRounds}`,
    }
  }
  
  // No valid members - return default
  if (positiveCounts.length === 0) {
    return {
      targetRounds: 3,
      policy: 'fallback_default',
      memberSetCounts,
      hadMismatch: false,
      reason: 'No valid member set counts found, using default 3',
    }
  }
  
  // Check if all positive counts are unanimous
  const uniqueCounts = new Set(positiveCounts)
  if (uniqueCounts.size === 1) {
    const unanimousCount = positiveCounts[0]
    return {
      targetRounds: unanimousCount,
      policy: 'unanimous_member_sets',
      memberSetCounts,
      hadMismatch: false,
      reason: `All ${positiveCounts.length} members have ${unanimousCount} sets`,
    }
  }
  
  // Members have mismatched set counts - normalize to minimum
  const minCount = Math.min(...positiveCounts)
  const maxCount = Math.max(...positiveCounts)
  return {
    targetRounds: minCount,
    policy: 'normalized_min_sets',
    memberSetCounts,
    hadMismatch: true,
    reason: `Normalized mismatched sets (${positiveCounts.join(', ')}) to minimum: ${minCount}. Extra work beyond ${minCount} rounds not executed in grouped block.`,
  }
}

function safeIsArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value)
}

function readSessionExercises(session: SessionLike): Array<{ id: string; name: string }> {
  if (!safeIsArray(session.exercises)) return []
  return session.exercises
    .map((ex) => {
      if (!ex || typeof ex !== 'object') return null
      const r = ex as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      const name = typeof r.name === 'string' ? r.name : ''
      if (!id && !name) return null
      return { id, name }
    })
    .filter((e): e is { id: string; name: string } => e !== null)
}

function readMethodStructures(session: SessionLike): CanonicalMethodStructure[] {
  if (!safeIsArray<CanonicalMethodStructure>(session.methodStructures)) return []
  return session.methodStructures.filter(
    (m): m is CanonicalMethodStructure => !!m && typeof m === 'object',
  )
}

function readStyledGroups(session: SessionLike): StyledGroupLike[] {
  const meta = session.styleMetadata
  if (!meta || typeof meta !== 'object') return []
  const groups = (meta as { styledGroups?: unknown }).styledGroups
  if (!safeIsArray<StyledGroupLike>(groups)) return []
  return groups.filter((g): g is StyledGroupLike => !!g && typeof g === 'object')
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/** Bind a method-structure member ref to a real session exercise index. */
function bindMemberToExercise(
  refId: string,
  refName: string,
  exercises: Array<{ id: string; name: string }>,
): { exerciseId: string; exerciseName: string; index: number } | null {
  if (refId) {
    const idx = exercises.findIndex((e) => e.id === refId)
    if (idx >= 0) return { exerciseId: exercises[idx].id, exerciseName: exercises[idx].name, index: idx }
  }
  if (refName) {
    const norm = normalizeName(refName)
    const idx = exercises.findIndex((e) => normalizeName(e.name) === norm)
    if (idx >= 0) return { exerciseId: exercises[idx].id, exerciseName: exercises[idx].name, index: idx }
  }
  return null
}

// =============================================================================
// PUBLIC: EVALUATE LIVE GROUPED EXECUTION
// =============================================================================

export interface EvaluateLiveGroupedExecutionInput {
  session: SessionLike
  /**
   * Optional override telling the evaluator whether the live runtime actually
   * built blocks from styledGroups (i.e. the shadow-owner guard accepted them).
   * When true, we trust styledGroups as the active source.
   */
  styledGroupsAcceptedAsExecutionSource?: boolean
}

/**
 * Pure read-only evaluator. Inspects the session and returns a parity verdict
 * that proves whether the live runtime is genuinely grouped or guidance-only.
 * Does not allocate machine state, does not setProgram, does not write storage.
 */
export function evaluateLiveGroupedExecution(
  input: EvaluateLiveGroupedExecutionInput,
): LiveGroupedExecutionResult {
  const session = input.session
  const styledGroupsAccepted = !!input.styledGroupsAcceptedAsExecutionSource
  const exercises = readSessionExercises(session)
  const methodStructures = readMethodStructures(session)
  const styledGroups = readStyledGroups(session)

  const reasons = new Set<LiveGroupedRuntimeReason>()
  const groupSafety: LiveGroupedExecutionGroupSafety[] = []
  const unmatchedGroupRefs: string[] = []
  const unsupportedGroupTypes: string[] = []

  // -------------------------------------------------------------------------
  // 1. METHOD STRUCTURES — the canonical Phase 4P read-model.
  // -------------------------------------------------------------------------
  for (const ms of methodStructures) {
    if (!ms.family) continue
    const family = ms.family
    const isGroupedFamily =
      EXECUTABLE_GROUPED_FAMILIES.has(family) || GUIDANCE_ONLY_GROUPED_FAMILIES.has(family)
    if (!isGroupedFamily) continue

    if (ms.status !== 'applied' && ms.status !== 'already_applied') {
      reasons.add('METHOD_STRUCTURE_STATUS_NOT_APPLIED')
      groupSafety.push({
        groupId: ms.id,
        methodFamily: family,
        safetyStatus: 'guidanceOnly',
        blockedReason: 'METHOD_STRUCTURE_STATUS_NOT_APPLIED',
        boundMemberIds: [],
        unboundMemberIds: ms.exerciseIds ?? [],
      })
      continue
    }

    // [AB7] Density blocks require timeCapMinutes to be executable
    if (family === 'density_block') {
      const hasTimeCap = typeof ms.timeCapMinutes === 'number' && ms.timeCapMinutes > 0
      if (!hasTimeCap) {
        reasons.add('DENSITY_TIME_CAP_MISSING')
        reasons.add('GUIDANCE_ONLY_PRESERVED')
        groupSafety.push({
          groupId: ms.id,
          methodFamily: family,
          safetyStatus: 'guidanceOnly',
          blockedReason: 'DENSITY_TIME_CAP_MISSING',
          boundMemberIds: ms.exerciseIds ?? [],
          unboundMemberIds: [],
        })
        continue
      }
      // Density with valid time cap continues to binding check below
    }
    
    if (GUIDANCE_ONLY_GROUPED_FAMILIES.has(family)) {
      reasons.add('DENSITY_RUNTIME_NOT_SUPPORTED_YET')
      reasons.add('GUIDANCE_ONLY_PRESERVED')
      groupSafety.push({
        groupId: ms.id,
        methodFamily: family,
        safetyStatus: 'guidanceOnly',
        blockedReason: 'DENSITY_RUNTIME_NOT_SUPPORTED_YET',
        boundMemberIds: ms.exerciseIds ?? [],
        unboundMemberIds: [],
      })
      continue
    }

    // Bind members to real session rows.
    const ids = safeIsArray<string>(ms.exerciseIds) ? ms.exerciseIds : []
    const names = safeIsArray<string>(ms.exerciseNames) ? ms.exerciseNames : []
    const boundMemberIds: string[] = []
    const unboundMemberIds: string[] = []
    const len = Math.max(ids.length, names.length)
    for (let i = 0; i < len; i++) {
      const refId = typeof ids[i] === 'string' ? ids[i] : ''
      const refName = typeof names[i] === 'string' ? names[i] : ''
      const bound = bindMemberToExercise(refId, refName, exercises)
      if (bound) boundMemberIds.push(bound.exerciseId)
      else if (refId || refName) {
        unboundMemberIds.push(refId || refName)
        unmatchedGroupRefs.push(refId || refName)
      }
    }

    // Method-minimum: superset/circuit need >= 2; cluster/density ok with >= 1.
    const minMembers = family === 'superset' || family === 'circuit' ? 2 : 1
    if (boundMemberIds.length < minMembers) {
      reasons.add('GROUP_MEMBER_REF_NOT_FOUND')
      groupSafety.push({
        groupId: ms.id,
        methodFamily: family,
        safetyStatus: 'guidanceOnly',
        blockedReason: 'GROUP_MEMBER_REF_NOT_FOUND',
        boundMemberIds,
        unboundMemberIds,
      })
      continue
    }

    reasons.add('METHOD_STRUCTURE_MEMBERS_BOUND')
    if (family === 'cluster' && boundMemberIds.length === 1) {
      reasons.add('CLUSTER_AT_LEAST_ONE_MEMBER_OK')
    }
    groupSafety.push({
      groupId: ms.id,
      methodFamily: family,
      safetyStatus: 'executable',
      boundMemberIds,
      unboundMemberIds,
    })
  }

  // -------------------------------------------------------------------------
  // 2. STYLED GROUPS — secondary signal. We trust the live runtime's own
  //    shadow-owner guard for whether styledGroups can OWN execution order.
  // -------------------------------------------------------------------------
  let styledGroupSafetyAdded = 0
  if (styledGroupsAccepted) {
    for (const g of styledGroups) {
      const groupType = typeof g.groupType === 'string' ? g.groupType : ''
      const groupId = typeof g.id === 'string' ? g.id : 'styled-group'
      if (!groupType || groupType === 'straight') continue

      const known = (
        ['superset', 'circuit', 'cluster', 'density_block'] as const
      ).includes(groupType as 'superset' | 'circuit' | 'cluster' | 'density_block')
      if (!known) {
        reasons.add('UNSUPPORTED_METHOD_TYPE')
        unsupportedGroupTypes.push(groupType)
        groupSafety.push({
          groupId,
          methodFamily: groupType,
          safetyStatus: 'guidanceOnly',
          blockedReason: 'UNSUPPORTED_METHOD_TYPE',
          boundMemberIds: [],
          unboundMemberIds: [],
        })
        styledGroupSafetyAdded++
        continue
      }

      // [AB7] Density blocks from styledGroups - check if corresponding
      // methodStructure has timeCapMinutes, or mark as guidance-only
      if (groupType === 'density_block') {
        // Look for matching methodStructure with time cap
        const matchingMs = methodStructures.find(
          (ms) => ms.family === 'density_block' && 
          typeof ms.timeCapMinutes === 'number' && 
          ms.timeCapMinutes > 0
        )
        if (!matchingMs) {
          reasons.add('DENSITY_TIME_CAP_MISSING')
          reasons.add('GUIDANCE_ONLY_PRESERVED')
          groupSafety.push({
            groupId,
            methodFamily: groupType,
            safetyStatus: 'guidanceOnly',
            blockedReason: 'DENSITY_TIME_CAP_MISSING',
            boundMemberIds: [],
            unboundMemberIds: [],
          })
          styledGroupSafetyAdded++
          continue
        }
        // Has time cap - allow it to proceed to executable status
        reasons.add('DENSITY_EXECUTABLE_WITH_TIME_CAP')
      }

      // Skip if methodStructures already covered this exact group. We avoid
      // duplicate safety entries for the same logical block.
      if (groupSafety.some((s) => s.groupId === groupId || s.methodFamily === groupType)) {
        continue
      }

      reasons.add('STYLED_GROUP_MEMBERS_BOUND')
      const memberIds = safeIsArray<ExerciseRefLike>(g.exercises)
        ? g.exercises.map((e) => (typeof e?.id === 'string' ? e.id : '')).filter(Boolean)
        : []
      groupSafety.push({
        groupId,
        methodFamily: groupType,
        safetyStatus: 'executable',
        boundMemberIds: memberIds,
        unboundMemberIds: [],
      })
      styledGroupSafetyAdded++
    }
  } else if (styledGroups.length > 0 && groupSafety.length === 0) {
    // styledGroups present but rejected by shadow-owner guard AND
    // methodStructures yielded nothing executable -> guidance only.
    reasons.add('STYLED_GROUP_FLATTENED_SEQUENCE_MISMATCH')
    reasons.add('GUIDANCE_ONLY_PRESERVED')
    for (const g of styledGroups) {
      const groupType = typeof g.groupType === 'string' ? g.groupType : ''
      if (!groupType || groupType === 'straight') continue
      const groupId = typeof g.id === 'string' ? g.id : 'styled-group'
      groupSafety.push({
        groupId,
        methodFamily: groupType,
        safetyStatus: 'guidanceOnly',
        blockedReason: 'STYLED_GROUP_FLATTENED_SEQUENCE_MISMATCH',
        boundMemberIds: [],
        unboundMemberIds: [],
      })
    }
  }

  // -------------------------------------------------------------------------
  // 3. CLASSIFY VERDICT
  // -------------------------------------------------------------------------
  const executableCount = groupSafety.filter((s) => s.safetyStatus === 'executable').length
  const guidanceCount = groupSafety.filter((s) => s.safetyStatus === 'guidanceOnly').length

  let parityVerdict: LiveGroupedRuntimeVerdict
  let source: LiveExecutionBlockSource

  if (groupSafety.length === 0) {
    reasons.add('NO_GROUPED_METHODS_PRESENT')
    parityVerdict = 'STRAIGHT_SETS_ONLY_NO_GROUPS'
    source = 'flatRows'
  } else if (executableCount > 0 && guidanceCount === 0) {
    parityVerdict = 'FULL_GROUPED_RUNTIME'
    source = styledGroupsAccepted && styledGroupSafetyAdded > 0 ? 'styledGroups' : 'methodStructures'
    reasons.add('SAFE_GROUPED_RUNTIME_READY')
  } else if (executableCount > 0 && guidanceCount > 0) {
    parityVerdict = 'GROUPED_RUNTIME_PARTIAL'
    source = styledGroupsAccepted && styledGroupSafetyAdded > 0 ? 'styledGroups' : 'methodStructures'
  } else if (executableCount === 0 && guidanceCount > 0) {
    // Either density-only blocks or every grouped block is unbound/blocked.
    if (Array.from(reasons).every((r) => r === 'DENSITY_RUNTIME_NOT_SUPPORTED_YET' || r === 'GUIDANCE_ONLY_PRESERVED')) {
      parityVerdict = 'LIVE_GUIDANCE_PRESERVED_ONLY'
    } else {
      parityVerdict = 'GROUPED_RUNTIME_BLOCKED'
    }
    source = 'flatRows'
    reasons.add('FLAT_FALLBACK_REQUIRED')
  } else {
    parityVerdict = 'STRAIGHT_SETS_ONLY_NO_GROUPS'
    source = 'flatRows'
  }

  const diagnostics: LiveGroupedExecutionDiagnostics = {
    totalExercises: exercises.length,
    totalBlocks: groupSafety.length || exercises.length,
    groupedBlocks: groupSafety.length,
    flatBlocks: Math.max(0, exercises.length - executableCount),
    unmatchedGroupRefs,
    unsupportedGroupTypes,
  }

  return {
    parityVerdict,
    reasons: Array.from(reasons),
    source,
    hasExecutableGroupedBlocks: executableCount > 0,
    groupSafety,
    diagnostics,
  }
}

// =============================================================================
// PUBLIC: BUILD EXECUTION BLOCKS FROM METHOD STRUCTURES
// =============================================================================

export interface BuildExecutionBlocksFromMethodStructuresInput {
  methodStructures: CanonicalMethodStructure[]
  /** The booted MachineExercise[] (live runtime exercise list, in display order). */
  exercises: MachineExercise[]
}

export interface BuildExecutionBlocksFromMethodStructuresResult {
  blocks: ExecutionBlock[]
  hasGroupedBlocks: boolean
  totalSets: number
  /** Indexes of exercises that were ALREADY consumed as grouped members. */
  consumedExerciseIndexes: Set<number>
  /** Reason codes captured during build. */
  reasons: LiveGroupedRuntimeReason[]
}

/**
 * Convert canonical methodStructures into shape-compatible ExecutionBlocks the
 * live-workout machine can consume directly. Only emits blocks whose members
 * bind to real session exercises by id (then by normalized name as fallback).
 *
 * Drops:
 *   - density_block (until safe density runtime exists; emits guidance only)
 *   - non-applied / blocked / not_needed structures
 *   - structures with fewer than the family's minimum bound members
 *
 * Does NOT emit straight/flat blocks — the caller is responsible for filling
 * in the rest with the existing flat path. Returns the indexes of consumed
 * exercises so the caller can avoid duplicating grouped members as flat rows.
 */
export function buildExecutionBlocksFromMethodStructures(
  input: BuildExecutionBlocksFromMethodStructuresInput,
): BuildExecutionBlocksFromMethodStructuresResult {
  const { methodStructures, exercises } = input
  const blocks: ExecutionBlock[] = []
  const consumedExerciseIndexes = new Set<number>()
  const reasons = new Set<LiveGroupedRuntimeReason>()
  let totalSets = 0

  // Counters used for "Superset A / Superset B / Circuit A" labelling, mirrors
  // the styledGroups path in StreamlinedWorkoutSession.tsx.
  const familyCounters: Record<string, number> = {
    superset: 0,
    circuit: 0,
    cluster: 0,
    density_block: 0, // [AB7] Added density block counter
  }

  const exerciseIndexById = new Map<string, number>()
  const exerciseIndexByName = new Map<string, number>()
  // [AB20.4.5.4.4] Add exerciseId and sourceExerciseId for alternative ID matching
  const exerciseIndexByExerciseId = new Map<string, number>()
  const exerciseIndexBySourceExerciseId = new Map<string, number>()
  // [AB20.4.5.4.4] Add blockId grouping for rescue path
  const exerciseIndexByBlockId = new Map<string, number[]>()
  
  exercises.forEach((ex, i) => {
    if (ex.id) exerciseIndexById.set(ex.id, i)
    if (ex.name) exerciseIndexByName.set(normalizeName(ex.name), i)
    // [AB20.4.5.4.4] Support alternative ID fields for binding
    const exAny = ex as unknown as Record<string, unknown>
    if (typeof exAny.exerciseId === 'string' && exAny.exerciseId) {
      exerciseIndexByExerciseId.set(exAny.exerciseId, i)
    }
    if (typeof exAny.sourceExerciseId === 'string' && exAny.sourceExerciseId) {
      exerciseIndexBySourceExerciseId.set(exAny.sourceExerciseId, i)
    }
    // [AB20.4.5.4.4] Group by blockId for rescue path
    if (typeof exAny.blockId === 'string' && exAny.blockId) {
      const existing = exerciseIndexByBlockId.get(exAny.blockId) || []
      existing.push(i)
      exerciseIndexByBlockId.set(exAny.blockId, existing)
    }
  })
  
  // [AB20.4.5.4.4] Detailed diagnostics for debugging binding failures
  console.log('[AB20.4.5.4.4] buildExecutionBlocksFromMethodStructures input', {
    methodStructuresCount: methodStructures.length,
    methodStructuresFamilies: methodStructures.map(ms => ms?.family),
    methodStructuresStatuses: methodStructures.map(ms => ms?.status),
    exerciseCount: exercises.length,
    exerciseNames: exercises.map(ex => ex.name),
    exerciseIds: exercises.map(ex => ex.id),
    exerciseIndexByIdKeys: Array.from(exerciseIndexById.keys()),
    exerciseIndexByNameKeys: Array.from(exerciseIndexByName.keys()),
    blockIdGroups: Array.from(exerciseIndexByBlockId.entries()).map(([k, v]) => ({ blockId: k, indexes: v })),
  })

  for (const ms of methodStructures) {
    if (!ms || !ms.family) continue
    if (!EXECUTABLE_GROUPED_FAMILIES.has(ms.family)) continue
    
    // [AB20.4.5.4.4] Expanded status acceptance - accept more status variations
    const normalizedStatus = normalizeMethodStatus(ms.status)
    if (normalizedStatus !== 'applied' && normalizedStatus !== 'already_applied') {
      console.log('[AB20.4.5.4.4] Skipping methodStructure due to status', {
        family: ms.family,
        rawStatus: ms.status,
        normalizedStatus,
      })
      reasons.add('METHOD_STRUCTURE_STATUS_NOT_APPLIED')
      continue
    }
    
    // [AB7] Density blocks require timeCapMinutes to be built as executable blocks
    if (ms.family === 'density_block') {
      const hasTimeCap = typeof ms.timeCapMinutes === 'number' && ms.timeCapMinutes > 0
      if (!hasTimeCap) {
        console.log('[AB20.4.5.4.4] Skipping density_block due to missing timeCap', { family: ms.family, timeCapMinutes: ms.timeCapMinutes })
        reasons.add('DENSITY_TIME_CAP_MISSING')
        continue
      }
    }

    const ids = safeIsArray<string>(ms.exerciseIds) ? ms.exerciseIds : []
    const names = safeIsArray<string>(ms.exerciseNames) ? ms.exerciseNames : []
    const memberExercises: MachineExercise[] = []
    const memberExerciseIndexes: number[] = []
    const unboundRefs: string[] = []

    const len = Math.max(ids.length, names.length)
    for (let i = 0; i < len; i++) {
      const refId = typeof ids[i] === 'string' ? ids[i] : ''
      const refName = typeof names[i] === 'string' ? names[i] : ''
      let exIndex = -1
      let bindSource = 'none'
      
      // [AB20.4.5.4.4] Extended binding ladder with multiple ID types and name matching
      if (refId && exerciseIndexById.has(refId)) {
        exIndex = exerciseIndexById.get(refId)!
        bindSource = 'id'
      } else if (refId && exerciseIndexByExerciseId.has(refId)) {
        exIndex = exerciseIndexByExerciseId.get(refId)!
        bindSource = 'exerciseId'
      } else if (refId && exerciseIndexBySourceExerciseId.has(refId)) {
        exIndex = exerciseIndexBySourceExerciseId.get(refId)!
        bindSource = 'sourceExerciseId'
      } else if (refName && exerciseIndexByName.has(normalizeName(refName))) {
        exIndex = exerciseIndexByName.get(normalizeName(refName))!
        bindSource = 'name'
      }
      
      if (exIndex < 0) {
        unboundRefs.push(refName || refId || `ref-${i}`)
        reasons.add('GROUP_MEMBER_REF_NOT_FOUND')
        continue
      }
      // Skip if this exercise was already consumed by an earlier grouped block.
      if (consumedExerciseIndexes.has(exIndex)) {
        console.log('[AB20.4.5.4.4] Skipping already-consumed exercise', { refId, refName, exIndex, bindSource })
        continue
      }
      memberExercises.push(exercises[exIndex])
      memberExerciseIndexes.push(exIndex)
    }
    
    // [AB20.4.5.4.4] Log binding result for each methodStructure
    console.log('[AB20.4.5.4.4] methodStructure binding result', {
      family: ms.family,
      status: ms.status,
      normalizedStatus,
      rawIds: ids,
      rawNames: names,
      boundIndexes: memberExerciseIndexes,
      unboundRefs,
      memberCount: memberExercises.length,
    })

    const minMembers = ms.family === 'superset' || ms.family === 'circuit' ? 2 : 1
    if (memberExercises.length < minMembers) {
      reasons.add('GROUP_MEMBER_REF_NOT_FOUND')
      continue
    }

    // Mirror styledGroups path's rest-timing defaults so the live machine
    // behaves the same regardless of which source built the block.
    const family = ms.family
    const intraBlockRestSeconds =
      typeof ms.restBetweenExercisesSeconds === 'number'
        ? Math.max(0, Math.round(ms.restBetweenExercisesSeconds))
        : family === 'superset'
          ? 0
          : family === 'circuit'
            ? 10
            : family === 'cluster'
              ? 15
              : 15

    const postRoundRestSeconds =
      typeof ms.restBetweenRoundsSeconds === 'number'
        ? Math.max(0, Math.round(ms.restBetweenRoundsSeconds))
        : memberExercises[0]?.restSeconds || 90

    // [AB15.6.2] Use grouped round authority resolver for consistent runtime rounds
    // This ensures mismatched member set counts are normalized to minimum
    const roundsResolution = resolveGroupedRuntimeRounds(
      memberExercises,
      typeof ms.rounds === 'number' ? ms.rounds : null
    )
    const targetRounds = roundsResolution.targetRounds
    
    // Log mismatch for debugging (visible in dev tools)
    if (roundsResolution.hadMismatch) {
      console.log('[AB15.6.2] Grouped rounds normalized:', {
        blockId: ms.id,
        family,
        memberSetCounts: roundsResolution.memberSetCounts,
        resolvedRounds: targetRounds,
        reason: roundsResolution.reason,
      })
    }

    const baseLabel =
      family === 'superset'
        ? 'Superset'
        : family === 'circuit'
          ? 'Circuit'
          : family === 'cluster'
            ? 'Cluster Set'
            : family === 'density_block'
              ? 'Density Block'
              : memberExercises[0]?.name || 'Exercise'
    const counterIndex = familyCounters[family] ?? 0
    const blockLetter = String.fromCharCode(65 + counterIndex)
    familyCounters[family] = counterIndex + 1
    const blockLabel = `${baseLabel} ${blockLetter}`

    // [AB7] Include timeCapSeconds for density blocks
    const timeCapSeconds = family === 'density_block' && typeof ms.timeCapMinutes === 'number'
      ? Math.round(ms.timeCapMinutes * 60)
      : undefined
    
    blocks.push({
      blockId: ms.id,
      groupType: family as ExecutionBlock['groupType'],
      blockLabel,
      memberExercises,
      memberExerciseIndexes,
      targetRounds,
      intraBlockRestSeconds,
      postRoundRestSeconds,
      postBlockRestSeconds: 120,
      timeCapSeconds,
    })

    for (const idx of memberExerciseIndexes) consumedExerciseIndexes.add(idx)
    // [AB15.6.2] Use resolved grouped rounds × member count for accurate executable work count
    // NOT sum of raw member sets, which could include mismatched "leftover" sets
    totalSets += targetRounds * memberExercises.length
  }

  if (blocks.length > 0) reasons.add('METHOD_STRUCTURE_MEMBERS_BOUND')

  return {
    blocks,
    hasGroupedBlocks: blocks.length > 0,
    totalSets,
    consumedExerciseIndexes,
    reasons: Array.from(reasons),
  }
}
