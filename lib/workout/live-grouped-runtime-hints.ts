/**
 * =============================================================================
 * [PHASE AB6] LIVE GROUPED EXECUTION RUNTIME PARITY HINTS
 * =============================================================================
 *
 * Pure, side-effect-free helpers that translate the AB5 grouped execution
 * contract (members + rounds + intra/post rest) into compact strings the
 * live workout active screen can render WITHOUT inventing new truth.
 *
 * Why this exists: the live corridor already knows it is in a grouped
 * block (via `groupedMemberIndex`, `blockGroupType`, `currentRound`,
 * `targetRounds`, `blockMemberExercises`, etc. forwarded from
 * StreamlinedWorkoutSession's executionPlan). Before AB6 it expressed
 * grouped intent only on the round-rest screen and used a hard-coded
 * `String.fromCharCode(65 + memberIndex)` member label that produced
 * "Circuit A" / "Circuit B" instead of the canonical "Circuit 1" /
 * "Circuit 2" the program card already uses.
 *
 * AB6 closes that display gap so the user sees the SAME grouped identity
 * during execution that they saw in the program card. No reducer changes,
 * no advance-flow changes, no new truth source — these helpers only
 * format strings from inputs the corridor already receives.
 *
 * The grouped execution truth is owned by:
 *   - `lib/workout/live-grouped-execution-contract.ts` (build/validate
 *     execution blocks from canonical methodStructures)
 *   - `lib/workout/live-execution-contract.ts` (LiveExecutionContract +
 *     GroupedBlockContext shape consumed by surfaces)
 *   - `components/programs/lib/grouped-execution-prescription.ts` (the
 *     program card prescription resolver — shares idiom with this file)
 *
 * This module is the LIVE-SCREEN consumer-side. It MUST remain pure.
 * =============================================================================
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Group type accepted at the live corridor surface. We accept the same
 * values the corridor already destructures plus `null`/`undefined` so
 * callers do not need to pre-filter. `'emom'` is preserved for backward
 * compatibility with the corridor's existing prop type even though the
 * canonical method-structure family does not include it today.
 */
export type LiveGroupType =
  | 'superset'
  | 'circuit'
  | 'cluster'
  | 'density_block'
  | 'emom'
  | null
  | undefined

export interface BuildGroupedMemberLabelInput {
  groupType: LiveGroupType
  /** Zero-based index of the current member within its grouped block. */
  memberIndex: number
  /**
   * Optional upstream prefix (e.g. "A1", "B2") if the program card already
   * computed one. When present and non-empty, this wins so live and program
   * cards cannot disagree.
   */
  prefix?: string | null
}

export interface BuildGroupedRoundBadgeInput {
  groupType: LiveGroupType
  currentRound: number
  targetRounds: number
}

export interface BuildGroupedFlowHintInput {
  groupType: LiveGroupType
  /** Zero-based index of the current member; null when not in a grouped block. */
  memberIndex: number | null
  memberCount: number
  currentRound: number
  targetRounds: number
  /** Rest seconds BETWEEN grouped members (intra-block). */
  intraBlockRestSeconds?: number | null
  /** Rest seconds AFTER a full round of the grouped block. */
  postRoundRestSeconds?: number | null
  /** Optional name of the next grouped member, for explicit hand-off copy. */
  nextMemberName?: string | null
}

// =============================================================================
// HELPERS
// =============================================================================

const SUPERSET_LABEL_LETTERS = 'ABCDEFGH'

/**
 * Canonical per-group-type member label idiom. Matches the program card:
 *
 *   superset       -> A, B, C, ...
 *   circuit        -> 1, 2, 3, ...
 *   cluster        -> 1, 2, 3, ...
 *   density_block  -> 1, 2, 3, ... (rotation slot)
 *   emom           -> 1, 2, 3, ... (legacy alias)
 *
 * If the upstream resolver already computed a `prefix` (e.g. "A1", "B2"),
 * we honor it verbatim because it carries the program card's authoritative
 * identity for that exact member.
 */
export function buildGroupedMemberLabel(input: BuildGroupedMemberLabelInput): string {
  const { groupType, memberIndex, prefix } = input

  if (typeof prefix === 'string' && prefix.trim().length > 0) {
    return prefix.trim()
  }

  const idx = Number.isFinite(memberIndex) && memberIndex >= 0 ? Math.trunc(memberIndex) : 0

  if (groupType === 'superset') {
    if (idx < SUPERSET_LABEL_LETTERS.length) return SUPERSET_LABEL_LETTERS.charAt(idx)
    // Beyond H is unusual; fall back to numbered to avoid wrap.
    return String(idx + 1)
  }
  // circuit / cluster / density_block / emom / null all use 1-based numbers.
  return String(idx + 1)
}

/**
 * Coach-voice method noun the corridor can prepend to the member label
 * (e.g. "Superset A", "Circuit 2", "Cluster 1"). Returns null when the
 * group type is not a real grouped block (so the corridor can render a
 * non-grouped layout untouched).
 */
export function buildGroupedMemberBadgeText(input: BuildGroupedMemberLabelInput): string | null {
  const { groupType } = input
  if (!groupType) return null
  const label = buildGroupedMemberLabel(input)
  switch (groupType) {
    case 'superset':
      return `Superset ${label}`
    case 'circuit':
      return `Circuit ${label}`
    case 'cluster':
      return `Cluster ${label}`
    case 'density_block':
      return `Rotation ${label}`
    case 'emom':
      return `EMOM ${label}`
    default:
      return null
  }
}

/**
 * "Round X of Y" badge text. Returns null when the group type isn't a
 * grouped block, when targetRounds isn't a positive integer, or when the
 * current round isn't sane. Density blocks don't express round-based
 * progress so they return null too — they are time-capped guidance.
 */
export function buildGroupedRoundBadgeText(input: BuildGroupedRoundBadgeInput): string | null {
  const { groupType, currentRound, targetRounds } = input
  if (!groupType || groupType === 'density_block') return null
  if (!Number.isFinite(targetRounds) || targetRounds <= 0) return null
  if (!Number.isFinite(currentRound) || currentRound < 1) return null
  // Clamp the displayed current round to the target so the round-rest
  // transition (where the machine briefly carries currentRound = target+1
  // before advancing the block) doesn't render "Round 4 of 3".
  const safeCurrent = Math.min(Math.max(1, Math.trunc(currentRound)), Math.trunc(targetRounds))
  return `Round ${safeCurrent} of ${Math.trunc(targetRounds)}`
}

/**
 * Compact grouped-flow hint shown UNDER the target prescription on the
 * active card so the user knows what comes next AS PART of the grouped
 * intent, not as an unrelated next exercise.
 *
 * Format examples:
 *   superset, mid-pair  : "Then move to B with 0s rest"
 *   superset, last      : "Round 2 of 3 next · 90s rest after round"
 *   circuit, mid-round  : "Then station 2 · 10s rest"
 *   circuit, last       : "Round 2 of 3 next · 90s rest after round"
 *   cluster             : "Cluster set · 15s mini-rest between mini-sets"
 *   density_block       : "Rotate within time cap · keep quality high"
 *
 * Returns null when the input doesn't describe a grouped block (so the
 * corridor can render the active card unchanged for straight sets).
 */
export function buildGroupedFlowHintText(input: BuildGroupedFlowHintInput): string | null {
  const {
    groupType,
    memberIndex,
    memberCount,
    currentRound,
    targetRounds,
    intraBlockRestSeconds,
    postRoundRestSeconds,
    nextMemberName,
  } = input
  if (!groupType) return null
  if (memberIndex == null || memberIndex < 0) return null

  const isLastMemberOfRound = memberCount > 0 && memberIndex >= memberCount - 1
  const isLastRound =
    Number.isFinite(targetRounds) && targetRounds > 0 && currentRound >= targetRounds

  // Density: time-capped, not round-paced. Single coach line.
  if (groupType === 'density_block') {
    return 'Rotate within the time cap · keep quality high'
  }

  // Cluster: a single-member grouped method that runs as cluster sets
  // (mini-sets with intra-set short rest). Use the intra rest seconds
  // when known so the live screen agrees with the program card.
  if (groupType === 'cluster') {
    const intra = formatRestSeconds(intraBlockRestSeconds)
    const post = formatRestSeconds(postRoundRestSeconds)
    if (intra && post) {
      return `Cluster set · ${intra} mini-rest · ${post} after the cluster`
    }
    if (intra) {
      return `Cluster set · ${intra} mini-rest between mini-sets`
    }
    if (post) {
      return `Cluster set · full rest ${post} after the cluster`
    }
    return 'Cluster set · short mini-rests, full rest after'
  }

  // Superset / circuit / emom: paired or rotation execution. Two cases:
  //   - mid-round member  -> "then go to <next member label/name> with <intra rest>"
  //   - last member       -> "after this set, <round x of y next> · <post rest>"
  const nextIdx = memberCount > 0 ? (memberIndex + 1) % memberCount : 0
  const nextLabel = buildGroupedMemberLabel({ groupType, memberIndex: nextIdx })
  const intra = formatRestSeconds(intraBlockRestSeconds)
  const post = formatRestSeconds(postRoundRestSeconds)

  if (!isLastMemberOfRound) {
    const nextRef =
      typeof nextMemberName === 'string' && nextMemberName.trim().length > 0
        ? `${nextLabel} (${nextMemberName.trim()})`
        : nextLabel
    if (intra && intra !== '0s') {
      return `Then move to ${nextRef} with ${intra} rest`
    }
    return `Then move to ${nextRef} with minimal rest`
  }

  // Last member of the round.
  if (isLastRound) {
    return post ? `Last round · full rest ${post} after` : 'Last round of this block'
  }
  const nextRoundNumber = Number.isFinite(currentRound) ? Math.trunc(currentRound) + 1 : null
  const roundLine =
    nextRoundNumber != null && Number.isFinite(targetRounds) && targetRounds > 0
      ? `Round ${nextRoundNumber} of ${Math.trunc(targetRounds)} next`
      : 'Next round next'
  return post ? `${roundLine} · ${post} rest after round` : roundLine
}

// =============================================================================
// INTERNAL
// =============================================================================

/**
 * Format a rest-seconds value as a compact human string. Returns null when
 * the input isn't a positive finite number; returns "0s" when the input is
 * a real zero (callers can decide whether to show that or suppress it).
 */
function formatRestSeconds(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < 0) return null
  if (value === 0) return '0s'
  if (value < 60) return `${Math.round(value)}s`
  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value - minutes * 60)
  if (seconds === 0) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}
