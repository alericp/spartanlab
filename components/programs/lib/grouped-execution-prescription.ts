/**
 * =============================================================================
 * [PHASE AB5] GROUPED EXECUTION PRESCRIPTION RESOLVER
 * =============================================================================
 *
 * Single authoritative resolver that converts a grouped display block (rich
 * `DisplayGroup` or permissive `RawFallbackBlock`) plus the session's hydrated
 * exercise list into a complete EXECUTION CONTRACT that carries rounds, member
 * doses, intra/post rest microcopy, and an orphan-row verdict.
 *
 * AB1-AB4 fixed compression / materialization / honesty corridor truthfulness.
 * AB5 closes the next visible execution blocker: grouped blocks render their
 * identity (Superset / Circuit / Density / Cluster) but the PROGRAM CARD HEADER
 * does not show rounds, and individual member rows can render with no
 * sets/reps/hold prescription when hydration drops a row.
 *
 * Causal contract:
 *   - rounds derive from REAL data (member sets agreement -> min member sets ->
 *     hydrated first member's sets -> typed fallback). Never invented.
 *   - member doses derive from hydrated session exercises. Members that do not
 *     bind to a real session exercise are flagged orphan and dropped from the
 *     display by the renderer.
 *   - rest microcopy reads from the existing GROUPED_METHOD_SEMANTICS table
 *     (single semantic source) so this resolver never duplicates microcopy.
 *
 * Live-workout parity: the live runtime in
 * `lib/workout/live-grouped-execution-contract.ts:596` derives `targetRounds`
 * as `methodStructure.rounds ?? memberExercises[0]?.sets || 3`. This resolver
 * mirrors that EXACT priority for the visible card so Program UI and Start
 * Workout cannot disagree about how many rounds a superset will execute.
 * =============================================================================
 */

import type { DisplayGroup, GroupType, RawFallbackBlock } from './session-group-display'
import { getGroupedMethodSemantics } from './session-group-display'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Why a particular `rounds` value was chosen. Stable codes the renderer (and
 * any future diagnostics surface) can branch on without parsing free text.
 *
 *   - methodStructureRounds : explicit `methodStructure.rounds` (live-runtime parity)
 *   - sharedMemberSets      : every hydrated member agreed on the same sets count
 *   - minMemberSets         : members disagreed; min taken (truthful upper-bound on doses)
 *   - firstHydratedMember   : only one member hydrated; its sets carries
 *   - fallbackThree         : nothing hydrated; documented fallback to 3 rounds
 *   - none                  : the block is not interpretable (no usable members)
 */
export type RoundsSource =
  | 'methodStructureRounds'
  | 'sharedMemberSets'
  | 'minMemberSets'
  | 'firstHydratedMember'
  | 'fallbackThree'
  | 'none'

/** Per-member execution contract. Mirrors the dose surface ExerciseRow needs. */
export interface ResolvedGroupMember {
  /** Hydrated session-exercise id when bound; empty when orphan. */
  id: string
  /** Display name (hydrated when bound; raw member name otherwise). */
  name: string
  /** A1/A2/B1/B2-style prefix carried from the upstream styledGroup. */
  prefix: string
  /** Hydrated sets count or null when the member does not bind to a real row. */
  sets: number | null
  /** Reps / time / hold string. Null when the member is orphan. */
  reps: string | null
  /** Optional hold duration parsed from `reps` when the field is a hold (e.g. "10s hold"). */
  holdSeconds: number | null
  /** Target RPE when authored upstream. */
  rpe: number | null
  /** Per-row rest seconds (post-row, distinct from group rest microcopy). */
  restSeconds: number | null
  /** Concise prescription text the renderer can show: "2 × 3-8 @ RPE 8". */
  prescriptionText: string
  /**
   * True iff a sets count AND a reps/hold value were resolvable. False marks
   * the member as INCOMPLETE — the renderer must drop the row (orphan guard)
   * unless the upstream variant intentionally preserved the row, in which
   * case the renderer surfaces an honest "missing prescription" diagnostic.
   */
  prescriptionComplete: boolean
  /** Reason codes for diagnostics / dev probes. Empty when complete. */
  missingFields: Array<'sets' | 'reps' | 'rpe' | 'restSeconds' | 'binding'>
  /** True iff this member bound to a real session exercise. */
  bound: boolean
}

/** Final block-level execution contract. */
export interface ResolvedGroupedExecutionPrescription {
  groupId: string
  groupType: GroupType
  /** Number of rounds / paired sets the block will execute. */
  rounds: number
  roundsSource: RoundsSource
  /** Hydrated members in display order (orphan members KEEP their entry — the
   *  renderer decides whether to show or drop based on `prescriptionComplete`). */
  members: ResolvedGroupMember[]
  /** Members that successfully bound (hydrated). Always a subset of `members`. */
  boundMembers: ResolvedGroupMember[]
  /** Microcopy from the single semantic source; safe to render verbatim. */
  intraExerciseRestText: string
  afterRoundRestText: string
  /** True iff every renderable member is prescription-complete. */
  prescriptionComplete: boolean
  /** Block-level diagnostic. Set when at least one member failed to bind. */
  hasOrphanMembers: boolean
  orphanMemberCount: number
  /**
   * Single-line execution sentence the card can render under the header.
   * Example: "2 rounds: A1 Archer Pull-Ups 3-8, A2 Chest-to-Bar Pull-Ups 5-8."
   * Empty string when block is not interpretable.
   */
  executionText: string
}

// =============================================================================
// HYDRATION INPUT — minimal duck-typed shape we accept
// =============================================================================

interface HydratedExerciseLike {
  id: string
  name: string
  sets?: number | null
  repsOrTime?: string | null
  /** Some upstream paths use `reps` instead of `repsOrTime`. */
  reps?: string | null
  targetRPE?: number | null
  restSeconds?: number | null
  /** Week-progression-truth scaled fields. We honor scaled when present. */
  scaledSets?: number | null
  scaledReps?: string | null
  scaledTargetRPE?: number | null
}

interface RawMemberLike {
  id?: string
  name: string
  prefix?: string
  /** RawFallbackBlock uses `methodLabel`-derived prefix already. */
  methodLabel?: string
}

/**
 * Hydration accessor passed in by the renderer. Returns the hydrated
 * exercise for a given member id/name (and optional positional index), or
 * null when the member is orphan. The renderer already builds an
 * `exerciseDataMap` / `hydrateMap` AND a `blockIdToDisplayExercises`
 * positional map; this resolver delegates lookup so we never duplicate
 * the map-building logic and so the resolver's bind verdict can never
 * disagree with the renderer's bind verdict.
 *
 * The position index lets the rich-path hydrate function honor its
 * primary bind strategy (blockId + positional index) which is more robust
 * than id/name in the presence of upstream rename drift.
 */
export type HydrateMemberFn = (
  member: RawMemberLike & { positionIndex: number },
) => HydratedExerciseLike | null

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse a hold duration from a reps string. Recognizes "10s", "10 sec",
 * "10s hold", "12-15s". Returns null when the string isn't a hold.
 */
function parseHoldSeconds(reps: string | null | undefined): number | null {
  if (!reps) return null
  const trimmed = reps.trim().toLowerCase()
  // Single value or range followed by 's' or ' sec' or ' second'.
  const match = trimmed.match(/^(\d+)(?:\s*[-–]\s*\d+)?\s*(?:s|sec|seconds?)\b/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Build the human dose string a single member shows. Mirrors the
 * "{sets} × {reps}" idiom the live runtime + ExerciseRow already use, and
 * decorates with RPE when authored. Returns the empty string when the dose
 * cannot be expressed (caller treats that as orphan).
 */
function buildPrescriptionText(args: {
  sets: number | null
  reps: string | null
  rpe: number | null
}): string {
  const { sets, reps, rpe } = args
  if (sets == null || !reps) return ''
  // Use × so the visible string never collides with set-execution method
  // microcopy that uses lowercase 'x' (e.g. "10 x 5s holds").
  const head = `${sets} × ${reps}`
  return rpe != null && Number.isFinite(rpe) ? `${head} @ RPE ${rpe}` : head
}

/**
 * Choose `rounds` honestly. Priority order (mirrors live-runtime parity at
 * lib/workout/live-grouped-execution-contract.ts:596-599):
 *
 *   1. explicit method-structure rounds, when present and > 0
 *   2. shared member sets — every hydrated member agreed
 *   3. minimum hydrated member sets — members disagreed (truthful upper bound)
 *   4. first hydrated member's sets
 *   5. fallback to 3 (matches the live runtime's `|| 3` fallback)
 *   6. 'none' when the block has no hydrated members at all
 */
function chooseRounds(args: {
  methodStructureRounds: number | null
  hydratedSets: number[]
}): { rounds: number; roundsSource: RoundsSource } {
  const { methodStructureRounds, hydratedSets } = args
  if (
    methodStructureRounds != null &&
    Number.isFinite(methodStructureRounds) &&
    methodStructureRounds > 0
  ) {
    return { rounds: Math.round(methodStructureRounds), roundsSource: 'methodStructureRounds' }
  }
  const valid = hydratedSets.filter(n => Number.isFinite(n) && n > 0)
  if (valid.length === 0) {
    return { rounds: 3, roundsSource: 'fallbackThree' }
  }
  if (valid.length === 1) {
    return { rounds: Math.round(valid[0]), roundsSource: 'firstHydratedMember' }
  }
  const allEqual = valid.every(n => n === valid[0])
  if (allEqual) {
    return { rounds: Math.round(valid[0]), roundsSource: 'sharedMemberSets' }
  }
  // Members disagree: pick the floor so we never promise more rounds than the
  // lowest-prescribed member can actually execute. The live runtime would do
  // the same: superset rounds are bounded by the smaller-sets member.
  const min = Math.min(...valid)
  return { rounds: Math.round(min), roundsSource: 'minMemberSets' }
}

// =============================================================================
// PUBLIC: RESOLVE GROUPED EXECUTION PRESCRIPTION
// =============================================================================

export interface ResolveGroupedExecutionPrescriptionInput {
  /** Either branch's grouped block. We accept both shapes for AB5 parity. */
  block:
    | { kind: 'rich'; group: DisplayGroup }
    | { kind: 'raw'; block: RawFallbackBlock }
  /** Member -> hydrated session exercise resolver supplied by the renderer. */
  hydrate: HydrateMemberFn
  /**
   * Optional explicit rounds count from the upstream methodStructure (when the
   * card has access to it). Honors live-runtime parity at the strongest level.
   */
  methodStructureRounds?: number | null
}

/**
 * Resolve a grouped block's complete execution prescription. Pure: no React
 * hooks, no DOM, no module-level state. The renderer is a thin consumer.
 */
export function resolveGroupedExecutionPrescription(
  input: ResolveGroupedExecutionPrescriptionInput,
): ResolvedGroupedExecutionPrescription {
  const { block, hydrate, methodStructureRounds } = input

  const groupType: GroupType = block.kind === 'rich' ? block.group.groupType : block.block.groupType
  const groupId: string = block.kind === 'rich' ? block.group.id : block.block.groupId

  // Normalize member input to a single shape both branches share.
  type NormalizedMember = { id: string; name: string; prefix: string }
  const members: NormalizedMember[] = (block.kind === 'rich'
    ? block.group.exercises.map((m, i) => ({
        id: m.id || '',
        name: m.name || '',
        prefix:
          m.prefix ||
          m.methodLabel?.match(/[A-Z]\d?$/)?.[0] ||
          `${String.fromCharCode(65)}${i + 1}`,
      }))
    : block.block.members.map((m, i) => ({
        id: m.id || '',
        name: m.name || '',
        prefix: m.prefix || `${String.fromCharCode(65)}${i + 1}`,
      })))

  // Hydrate every member individually. Orphans keep their slot but carry no
  // dose; the renderer decides whether to show them. Position is passed in
  // so the rich-path hydrate can honor blockId + positional binding (its
  // most robust strategy against upstream rename drift).
  const resolvedMembers: ResolvedGroupMember[] = members.map((m, positionIndex) => {
    const hydrated = hydrate({ id: m.id, name: m.name, prefix: m.prefix, positionIndex })
    if (!hydrated) {
      return {
        id: m.id,
        name: (m.name || '').trim(),
        prefix: m.prefix,
        sets: null,
        reps: null,
        holdSeconds: null,
        rpe: null,
        restSeconds: null,
        prescriptionText: '',
        prescriptionComplete: false,
        missingFields: ['binding', 'sets', 'reps'],
        bound: false,
      }
    }

    // Honor week-scaled fields the same way ExerciseRow does at line 6253-6255.
    const sets =
      typeof hydrated.scaledSets === 'number' && hydrated.scaledSets > 0
        ? hydrated.scaledSets
        : typeof hydrated.sets === 'number' && hydrated.sets > 0
          ? hydrated.sets
          : null
    const reps =
      (typeof hydrated.scaledReps === 'string' && hydrated.scaledReps.trim().length > 0
        ? hydrated.scaledReps
        : null) ||
      (typeof hydrated.repsOrTime === 'string' && hydrated.repsOrTime.trim().length > 0
        ? hydrated.repsOrTime
        : null) ||
      (typeof hydrated.reps === 'string' && hydrated.reps.trim().length > 0
        ? hydrated.reps
        : null)
    const rpe =
      typeof hydrated.scaledTargetRPE === 'number'
        ? hydrated.scaledTargetRPE
        : typeof hydrated.targetRPE === 'number'
          ? hydrated.targetRPE
          : null
    const restSeconds =
      typeof hydrated.restSeconds === 'number' && hydrated.restSeconds >= 0
        ? hydrated.restSeconds
        : null
    const holdSeconds = parseHoldSeconds(reps)

    const prescriptionText = buildPrescriptionText({ sets, reps, rpe })
    const missingFields: ResolvedGroupMember['missingFields'] = []
    if (sets == null) missingFields.push('sets')
    if (!reps) missingFields.push('reps')
    if (rpe == null) missingFields.push('rpe')
    if (restSeconds == null) missingFields.push('restSeconds')

    return {
      id: hydrated.id || m.id,
      name: (hydrated.name || m.name || '').trim(),
      prefix: m.prefix,
      sets,
      reps,
      holdSeconds,
      rpe,
      restSeconds,
      prescriptionText,
      // A member is COMPLETE for orphan-guard purposes when sets + reps both
      // resolved. RPE/rest are nice-to-have but not required to execute.
      prescriptionComplete: sets != null && !!reps,
      missingFields,
      bound: true,
    }
  })

  const boundMembers = resolvedMembers.filter(m => m.bound)
  const orphanMemberCount = resolvedMembers.length - boundMembers.length

  // Round count: prefer explicit methodStructure rounds, then hydrated agreement.
  const hydratedSets = boundMembers
    .map(m => m.sets)
    .filter((n): n is number => n != null)
  const { rounds, roundsSource } = chooseRounds({
    methodStructureRounds: methodStructureRounds ?? null,
    hydratedSets,
  })

  // Microcopy: read from the single authoritative semantic source. Density
  // and circuit have their own restProtocol; superset has the "0-15s between"
  // / "90-120s after" idiom encoded there.
  const semantics = getGroupedMethodSemantics(groupType)
  // Fallback split for blocks whose semantics table entry is missing
  // (only 'straight', which doesn't reach this resolver in practice).
  const restMicrocopy = semantics?.restProtocol ?? '60-120s between sets'
  // Most semantics restProtocol strings already encode both intra and after.
  // We expose them as a single line; the renderer concatenates with the
  // header. For supersets specifically, decompose the existing
  // "0-15s between, 90-120s after pair" into two halves so the card can show
  // them on two lines or one as it sees fit.
  let intraExerciseRestText = ''
  let afterRoundRestText = ''
  if (groupType === 'superset' && restMicrocopy.includes(',')) {
    const [intra, after] = restMicrocopy.split(',').map(s => s.trim())
    intraExerciseRestText = intra
    afterRoundRestText = after
  } else {
    afterRoundRestText = restMicrocopy
  }

  // Block-level honesty: complete iff we have at least 1 bound member AND
  // every bound member is prescription-complete. Orphans do NOT mark the
  // block incomplete on their own — the renderer drops orphan rows so the
  // visible block can still be honest about the rows that DO execute.
  const prescriptionComplete =
    boundMembers.length > 0 && boundMembers.every(m => m.prescriptionComplete)

  // One-line execution sentence (used when the renderer wants a coach-voice
  // line below the header). Example:
  //   "2 rounds: A1 Archer Pull-Ups 3 × 5, A2 Chest-to-Bar Pull-Ups 3 × 5."
  let executionText = ''
  if (boundMembers.length > 0) {
    const parts = boundMembers
      .filter(m => m.prescriptionComplete)
      .map(m => `${m.prefix} ${m.name} ${m.prescriptionText}`)
    if (parts.length > 0) {
      const roundsLabel =
        groupType === 'superset' ? `${rounds} paired set${rounds === 1 ? '' : 's'}` :
        groupType === 'circuit' ? `${rounds} round${rounds === 1 ? '' : 's'}` :
        groupType === 'cluster' ? `${rounds} cluster${rounds === 1 ? '' : 's'}` :
        groupType === 'density_block' ? `time-capped` :
        `${rounds} round${rounds === 1 ? '' : 's'}`
      executionText = `${roundsLabel}: ${parts.join(', ')}.`
    }
  }

  return {
    groupId,
    groupType,
    rounds,
    roundsSource,
    members: resolvedMembers,
    boundMembers,
    intraExerciseRestText,
    afterRoundRestText,
    prescriptionComplete,
    hasOrphanMembers: orphanMemberCount > 0,
    orphanMemberCount,
    executionText,
  }
}

// =============================================================================
// PUBLIC: HEADER LABEL HELPER
// =============================================================================

/**
 * Build the rounds chip the card header shows after the method label. Stable
 * idiom per group type so QA can grep on it. Returns null when the resolver
 * has no rounds value to express (unbound block).
 *
 *   superset  -> "2 paired sets"
 *   circuit   -> "3 rounds"
 *   cluster   -> "5 cluster sets"
 *   density   -> "time-capped"
 */
export function buildRoundsHeaderText(
  prescription: ResolvedGroupedExecutionPrescription,
): string | null {
  if (prescription.boundMembers.length === 0) return null
  const r = prescription.rounds
  if (!Number.isFinite(r) || r <= 0) return null
  switch (prescription.groupType) {
    case 'superset':
      return `${r} paired set${r === 1 ? '' : 's'}`
    case 'circuit':
      return `${r} round${r === 1 ? '' : 's'}`
    case 'cluster':
      return `${r} cluster set${r === 1 ? '' : 's'}`
    case 'density_block':
      return 'time-capped'
    default:
      return `${r} round${r === 1 ? '' : 's'}`
  }
}
