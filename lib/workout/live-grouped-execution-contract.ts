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
  // density_block is intentionally classed as guidance until a safe
  // density timer runtime exists; see DENSITY_RUNTIME_NOT_SUPPORTED_YET.
])

/** Grouped families that exist on the program side but are not yet runtime-safe. */
const GUIDANCE_ONLY_GROUPED_FAMILIES: ReadonlySet<CanonicalMethodFamily> = new Set<CanonicalMethodFamily>([
  'density_block',
])

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

    // Method-minimum: superset/circuit need >= 2; cluster ok with >= 1.
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

      if (groupType === 'density_block') {
        reasons.add('DENSITY_RUNTIME_NOT_SUPPORTED_YET')
        reasons.add('GUIDANCE_ONLY_PRESERVED')
        groupSafety.push({
          groupId,
          methodFamily: groupType,
          safetyStatus: 'guidanceOnly',
          blockedReason: 'DENSITY_RUNTIME_NOT_SUPPORTED_YET',
          boundMemberIds: [],
          unboundMemberIds: [],
        })
        styledGroupSafetyAdded++
        continue
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
  }

  const exerciseIndexById = new Map<string, number>()
  const exerciseIndexByName = new Map<string, number>()
  exercises.forEach((ex, i) => {
    if (ex.id) exerciseIndexById.set(ex.id, i)
    if (ex.name) exerciseIndexByName.set(normalizeName(ex.name), i)
  })

  for (const ms of methodStructures) {
    if (!ms || !ms.family) continue
    if (!EXECUTABLE_GROUPED_FAMILIES.has(ms.family)) continue
    if (ms.status !== 'applied' && ms.status !== 'already_applied') {
      reasons.add('METHOD_STRUCTURE_STATUS_NOT_APPLIED')
      continue
    }

    const ids = safeIsArray<string>(ms.exerciseIds) ? ms.exerciseIds : []
    const names = safeIsArray<string>(ms.exerciseNames) ? ms.exerciseNames : []
    const memberExercises: MachineExercise[] = []
    const memberExerciseIndexes: number[] = []

    const len = Math.max(ids.length, names.length)
    for (let i = 0; i < len; i++) {
      const refId = typeof ids[i] === 'string' ? ids[i] : ''
      const refName = typeof names[i] === 'string' ? names[i] : ''
      let exIndex = -1
      if (refId && exerciseIndexById.has(refId)) {
        exIndex = exerciseIndexById.get(refId)!
      } else if (refName && exerciseIndexByName.has(normalizeName(refName))) {
        exIndex = exerciseIndexByName.get(normalizeName(refName))!
      }
      if (exIndex < 0) {
        reasons.add('GROUP_MEMBER_REF_NOT_FOUND')
        continue
      }
      // Skip if this exercise was already consumed by an earlier grouped block.
      if (consumedExerciseIndexes.has(exIndex)) continue
      memberExercises.push(exercises[exIndex])
      memberExerciseIndexes.push(exIndex)
    }

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

    const targetRounds =
      typeof ms.rounds === 'number' && ms.rounds > 0
        ? Math.round(ms.rounds)
        : memberExercises[0]?.sets || 3

    const baseLabel =
      family === 'superset'
        ? 'Superset'
        : family === 'circuit'
          ? 'Circuit'
          : family === 'cluster'
            ? 'Cluster Set'
            : memberExercises[0]?.name || 'Exercise'
    const counterIndex = familyCounters[family] ?? 0
    const blockLetter = String.fromCharCode(65 + counterIndex)
    familyCounters[family] = counterIndex + 1
    const blockLabel = `${baseLabel} ${blockLetter}`

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
    })

    for (const idx of memberExerciseIndexes) consumedExerciseIndexes.add(idx)
    for (const ex of memberExercises) totalSets += ex.sets || 3
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
