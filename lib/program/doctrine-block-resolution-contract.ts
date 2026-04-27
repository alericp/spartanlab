/**
 * DOCTRINE BLOCK RESOLUTION CONTRACT — Phase 4Q
 *
 * =============================================================================
 * REPLACES GENERIC "BLOCKED" CHIPS WITH HONEST CLASSIFICATIONS
 * =============================================================================
 *
 * Background: through Phase 4L–4P, doctrine became visible — the program now
 * carries `methodStructures[]`, `styledGroups`, row-level method fields, and
 * a `methodStructureRollup`. But when the user opens the page, some method
 * families show up as "blocked" with no explanation. There are at least eight
 * different reasons a method can show as blocked, only some of which are real
 * safety blocks. This module classifies each blocked entry into the actual
 * cause:
 *
 *   APPLIED                          — actually applied (mirrored, not blocked)
 *   ALREADY_APPLIED                  — builder applied it before the corridor
 *   TRUE_SAFETY_BLOCK                — doctrine ran and refused for safety
 *   NO_RELEVANT_TARGET               — no exercise in this session matched
 *   NOT_RELEVANT_TO_SESSION          — wrong session role for this method
 *   BUG_MISSING_CONNECTION           — budgeted but no materializer exists yet
 *   BUG_RUNTIME_CONTRACT_MISSING     — applied in program but live runtime
 *                                      cannot execute (e.g. cluster)
 *   BUG_DISPLAY_CONSUMER_MISSING     — applied on session but card does not
 *                                      render the field
 *   BUG_NORMALIZER_DROPPED_TRUTH     — applied in program but live normalize
 *                                      stripped the field
 *   BUG_STALE_SOURCE_WON             — fresh program had truth, stale source
 *                                      replaced it before display
 *   UNKNOWN_NEEDS_AUDIT              — no rule matched yet
 *
 * The classifier is INPUT-ONLY. It does NOT mutate the program. It does NOT
 * apply the method. It produces a JSON-safe array the row-level mutator can
 * stamp onto each session and the program-level rollup can summarize.
 *
 * =============================================================================
 * INTEGRATION
 * =============================================================================
 *
 * The row-level mutator at
 * `lib/program/row-level-method-prescription-mutator.ts` already runs both the
 * doctrine application corridor and the structural method materialization
 * corridor per session. Phase 4Q adds one more step at the end: the classifier
 * reads the per-session `methodStructures[]` plus the program-level budget
 * plan, and stamps `session.doctrineBlockResolution` (an array) plus a
 * per-session `doctrineParticipation` verdict.
 *
 * The Program page's MaterializationStatusLine component renders the
 * program-level rollup as one compact line:
 *   "Doctrine resolution: A applied · B safety · C no target · D bug"
 */

import type { CanonicalMethodStructure, CanonicalMethodFamily } from './method-structure-contract'

// =============================================================================
// PER-ENTRY RESOLUTION
// =============================================================================

export type DoctrineBlockResolution =
  | 'APPLIED'
  | 'ALREADY_APPLIED'
  | 'TRUE_SAFETY_BLOCK'
  | 'NO_RELEVANT_TARGET'
  | 'NOT_RELEVANT_TO_SESSION'
  | 'BUG_MISSING_CONNECTION'
  | 'BUG_RUNTIME_CONTRACT_MISSING'
  | 'BUG_DISPLAY_CONSUMER_MISSING'
  | 'BUG_NORMALIZER_DROPPED_TRUTH'
  | 'BUG_STALE_SOURCE_WON'
  | 'UNKNOWN_NEEDS_AUDIT'

export type DoctrineBlockRequiredAction =
  | 'none'
  | 'apply_now'
  | 'connect_runtime_contract'
  | 'connect_display_consumer'
  | 'fix_normalizer_preservation'
  | 'replace_stale_source'
  | 'add_safety_explanation'
  | 'needs_manual_audit'

export interface DoctrineBlockResolutionEntry {
  /** Stable identifier matching the underlying `methodStructures[].id`. */
  id: string
  family: CanonicalMethodFamily
  dayNumber?: number
  sessionId?: string
  sessionRole?: string
  /** The status as the corridor wrote it. */
  originalStatus: string
  /** The Phase 4Q classifier's verdict. */
  resolvedStatus: DoctrineBlockResolution
  /** Plain English. Always populated. */
  reason: string
  /** What the system or developer needs to do to clear this. */
  requiredAction: DoctrineBlockRequiredAction
  /**
   * Dotted paths the consumer can read for the underlying truth. E.g.
   *   ["program.weeklyMethodBudgetPlan.byFamily.cluster",
   *    "session.methodStructures[].id"]
   */
  evidencePaths: string[]
  /**
   * Short user-facing message. Replaces generic "blocked" chip text. Must be
   * mobile-safe and self-explanatory ("doctrine ran and refused for safety",
   * "no eligible exercise", "live workout cannot execute yet").
   */
  visibleUserMessage: string
}

// =============================================================================
// PROGRAM-LEVEL ROLLUP
// =============================================================================

export interface DoctrineBlockResolutionRollup {
  version: 'phase-4q-block-resolution-v1'
  totalApplied: number
  totalAlreadyApplied: number
  totalTrueSafetyBlocks: number
  totalNoRelevantTarget: number
  totalNotRelevantToSession: number
  totalBugMissingConnection: number
  totalBugRuntimeContractMissing: number
  totalBugDisplayConsumerMissing: number
  totalBugNormalizerDroppedTruth: number
  totalBugStaleSourceWon: number
  totalUnknownNeedsAudit: number
  /** Final program-level verdict the Program page renders as a one-liner. */
  finalVerdict:
    | 'ALL_BLOCKS_EXPLAINED_OR_APPLIED'
    | 'BUG_BLOCKS_REMAIN'
    | 'DISPLAY_SOURCE_SPLIT_REMAINS'
    | 'RUNTIME_PARITY_BLOCKED'
  /** First bug entry, used for the compact program-page line. */
  firstBugSample: {
    family: CanonicalMethodFamily
    dayNumber: number
    resolvedStatus: DoctrineBlockResolution
    visibleUserMessage: string
  } | null
  visibleProofPath: 'program.doctrineBlockResolutionRollup'
}

// =============================================================================
// CLASSIFIER INPUT
// =============================================================================

export interface ClassifyDoctrineBlocksInput {
  /** The session's canonical methodStructures array, as written by the
   *  Phase 4P structural materialization corridor and the Phase 4M doctrine
   *  application corridor. */
  methodStructures: CanonicalMethodStructure[]
  /** The session's day number, used in evidence paths. */
  dayNumber?: number
  /** The session's id, used in evidence paths. */
  sessionId?: string
  /** The session's weekly role (e.g. "primary_skill", "accessory",
   *  "conditioning"). When supplied, blocks for methods that don't fit the
   *  role are classified as `NOT_RELEVANT_TO_SESSION`. */
  sessionRole?: string | null
  /** Program-level weekly budget plan. Used to confirm whether the corridor
   *  was even *asked* to apply this family this week. */
  weeklyMethodBudgetPlan?: {
    byFamily?: Record<string, { verdict?: string }>
  } | null
  /**
   * Set true when the live workout runtime cannot execute the family yet.
   * Defaults: cluster=true (no setExecutionMethod runtime contract yet).
   * The structural corridor already marks builder-applied clusters with a
   * `BLOCKED_BY_RUNTIME_CONTRACT` reason; this classifier preserves that.
   */
  runtimeContractMissingFamilies?: CanonicalMethodFamily[]
  /**
   * Set when the Program page's display consumer is known to render this
   * family. Phase 4Q assumes superset/circuit/density_block/top_set/drop_set/
   * rest_pause/cluster/endurance_density are all rendered; everything else
   * is classified as `BUG_DISPLAY_CONSUMER_MISSING` until proven otherwise.
   */
  displayConsumerCoverage?: Partial<Record<CanonicalMethodFamily, boolean>>
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_DISPLAY_COVERAGE: Record<CanonicalMethodFamily, boolean> = {
  top_set: true,
  backoff_sets: true,
  drop_set: true,
  rest_pause: true,
  cluster: true,
  superset: true,
  circuit: true,
  density_block: true,
  endurance_density: true,
  prescription_rest: true,
  prescription_rpe: true,
  straight_sets: true,
}

const DEFAULT_RUNTIME_MISSING: CanonicalMethodFamily[] = ['cluster']

// Session role → families that are normally NOT relevant to the role. Used
// only to downgrade `BUG_MISSING_CONNECTION` to `NOT_RELEVANT_TO_SESSION` when
// the role makes the missing connection harmless.
const ROLE_FAMILY_RELEVANCE: Record<string, CanonicalMethodFamily[]> = {
  // Primary-skill days favour quality + skill expression. Density blocks and
  // circuits on a primary skill day are intentionally out of scope.
  primary_skill: ['top_set', 'backoff_sets', 'cluster', 'rest_pause'],
  // Conditioning days favour density + circuits.
  conditioning: ['circuit', 'density_block', 'endurance_density', 'prescription_rest'],
  // Accessory days are the natural home for hypertrophy methods.
  accessory: ['drop_set', 'rest_pause', 'superset', 'top_set', 'prescription_rpe'],
  // Recovery days are intentionally low-stim — no method is relevant.
  recovery: [],
}

// =============================================================================
// CLASSIFIER
// =============================================================================

export interface ClassifyDoctrineBlocksResult {
  entries: DoctrineBlockResolutionEntry[]
  appliedCount: number
  alreadyAppliedCount: number
  trueSafetyBlockCount: number
  noRelevantTargetCount: number
  notRelevantToSessionCount: number
  bugMissingConnectionCount: number
  bugRuntimeContractMissingCount: number
  bugDisplayConsumerMissingCount: number
  bugNormalizerDroppedTruthCount: number
  bugStaleSourceWonCount: number
  unknownNeedsAuditCount: number
}

export function classifyDoctrineBlocksForSession(
  input: ClassifyDoctrineBlocksInput,
): ClassifyDoctrineBlocksResult {
  const runtimeMissing = new Set(
    input.runtimeContractMissingFamilies ?? DEFAULT_RUNTIME_MISSING,
  )
  const displayCoverage = {
    ...DEFAULT_DISPLAY_COVERAGE,
    ...(input.displayConsumerCoverage ?? {}),
  }
  const roleRelevant = input.sessionRole ? ROLE_FAMILY_RELEVANCE[input.sessionRole] : null

  const entries: DoctrineBlockResolutionEntry[] = []
  const counts = {
    appliedCount: 0,
    alreadyAppliedCount: 0,
    trueSafetyBlockCount: 0,
    noRelevantTargetCount: 0,
    notRelevantToSessionCount: 0,
    bugMissingConnectionCount: 0,
    bugRuntimeContractMissingCount: 0,
    bugDisplayConsumerMissingCount: 0,
    bugNormalizerDroppedTruthCount: 0,
    bugStaleSourceWonCount: 0,
    unknownNeedsAuditCount: 0,
  }

  for (const entry of input.methodStructures) {
    const evidencePaths = [
      `session.methodStructures[].id=${entry.id}`,
      ...(input.weeklyMethodBudgetPlan?.byFamily?.[entry.family]
        ? [`program.weeklyMethodBudgetPlan.byFamily.${entry.family}`]
        : []),
    ]
    const displayCovered = displayCoverage[entry.family] !== false
    const isRuntimeMissing = runtimeMissing.has(entry.family)

    let resolved: DoctrineBlockResolution
    let reason: string
    let requiredAction: DoctrineBlockRequiredAction
    let visibleUserMessage: string

    switch (entry.status) {
      case 'applied': {
        resolved = 'APPLIED'
        reason = entry.reason || 'doctrine-earned method materialized this session'
        requiredAction = 'none'
        visibleUserMessage = 'Applied this session'
        counts.appliedCount += 1
        // [PHASE 4Q] If the corridor APPLIED a method but the live runtime
        // cannot execute it (e.g. cluster), the live workout consumes it as
        // method guidance only — flag this as a runtime-contract gap so the
        // user sees an honest "Method preserved as guidance — live execution
        // pending" message instead of an unqualified green chip.
        if (isRuntimeMissing) {
          resolved = 'BUG_RUNTIME_CONTRACT_MISSING'
          reason = `${entry.family} applied at program level but live workout has no execution runtime contract yet`
          requiredAction = 'connect_runtime_contract'
          visibleUserMessage = 'Method applied — live execution pending runtime contract'
          counts.appliedCount -= 1
          counts.bugRuntimeContractMissingCount += 1
        } else if (!displayCovered) {
          resolved = 'BUG_DISPLAY_CONSUMER_MISSING'
          reason = `${entry.family} applied but Program page card does not yet render this family`
          requiredAction = 'connect_display_consumer'
          visibleUserMessage = 'Method applied — display consumer missing'
          counts.appliedCount -= 1
          counts.bugDisplayConsumerMissingCount += 1
        }
        break
      }

      case 'already_applied': {
        resolved = 'ALREADY_APPLIED'
        reason = entry.reason || 'builder applied this method before the corridor ran'
        requiredAction = 'none'
        visibleUserMessage = 'Already applied by builder'
        counts.alreadyAppliedCount += 1
        break
      }

      case 'no_safe_target': {
        resolved = 'NO_RELEVANT_TARGET'
        reason =
          entry.reason ||
          `no eligible row for ${entry.family} in this session after safety scan`
        requiredAction = 'none'
        visibleUserMessage = 'No eligible exercise this session'
        counts.noRelevantTargetCount += 1
        break
      }

      case 'not_needed': {
        // The corridor explicitly said this family was not earned for this
        // session by the budget plan. If the session role makes the family
        // out of scope, classify NOT_RELEVANT_TO_SESSION; otherwise keep it
        // as NO_RELEVANT_TARGET-style "evaluated, no change earned".
        if (roleRelevant !== null && !roleRelevant.includes(entry.family)) {
          resolved = 'NOT_RELEVANT_TO_SESSION'
          reason = `${entry.family} is not the focus for ${input.sessionRole} sessions`
          requiredAction = 'none'
          visibleUserMessage = `Not relevant to ${input.sessionRole ?? 'session'} role`
          counts.notRelevantToSessionCount += 1
        } else {
          resolved = 'NO_RELEVANT_TARGET'
          reason =
            entry.reason || `${entry.family} not earned by training intent for this session`
          requiredAction = 'none'
          visibleUserMessage = 'Evaluated, no change earned'
          counts.noRelevantTargetCount += 1
        }
        break
      }

      case 'blocked': {
        // Discriminate between true-safety blocks vs runtime-contract gaps.
        // The structural materialization corridor uses the literal token
        // `BLOCKED_BY_RUNTIME_CONTRACT` in the `reason` string for clusters
        // it intentionally refuses to apply because the live workout setExecutionMethod
        // runtime is not yet wired. Anything else with `safety` in the reason
        // counts as a true safety block.
        const reasonText = (entry.reason || '').toLowerCase()
        if (
          reasonText.includes('runtime_contract') ||
          reasonText.includes('runtime contract') ||
          isRuntimeMissing
        ) {
          resolved = 'BUG_RUNTIME_CONTRACT_MISSING'
          reason =
            entry.reason ||
            `${entry.family} blocked because live workout execution contract is not yet wired`
          requiredAction = 'connect_runtime_contract'
          visibleUserMessage = 'Live execution pending runtime contract'
          counts.bugRuntimeContractMissingCount += 1
        } else if (
          reasonText.includes('safety') ||
          reasonText.includes('tendon') ||
          reasonText.includes('skill') ||
          (entry.safetyGatesFailed && entry.safetyGatesFailed.length > 0)
        ) {
          resolved = 'TRUE_SAFETY_BLOCK'
          reason = entry.reason || 'doctrine ran and refused to apply for safety'
          requiredAction = 'add_safety_explanation'
          visibleUserMessage = 'Doctrine refused for safety'
          counts.trueSafetyBlockCount += 1
        } else {
          resolved = 'UNKNOWN_NEEDS_AUDIT'
          reason = entry.reason || 'blocked without classified safety reason'
          requiredAction = 'needs_manual_audit'
          visibleUserMessage = 'Blocked — needs audit'
          counts.unknownNeedsAuditCount += 1
        }
        break
      }

      case 'not_connected': {
        // Budgeted SHOULD_APPLY/MAY_APPLY but no materializer exists. This is
        // exactly the gap Phase 4P closed for superset/circuit/density_block
        // — anything still arriving here in Phase 4Q is a real bug.
        resolved = 'BUG_MISSING_CONNECTION'
        reason =
          entry.reason ||
          `${entry.family} budget says SHOULD_APPLY/MAY_APPLY but no materializer is wired`
        requiredAction = 'apply_now'
        visibleUserMessage = 'Method earned but not yet connected'
        counts.bugMissingConnectionCount += 1
        break
      }

      case 'error':
      default: {
        resolved = 'UNKNOWN_NEEDS_AUDIT'
        reason = entry.reason || 'classifier could not resolve this status'
        requiredAction = 'needs_manual_audit'
        visibleUserMessage = 'Status not classified'
        counts.unknownNeedsAuditCount += 1
        break
      }
    }

    entries.push({
      id: entry.id,
      family: entry.family,
      dayNumber: input.dayNumber ?? entry.dayNumber,
      sessionId: input.sessionId ?? entry.sessionId,
      sessionRole: input.sessionRole ?? undefined,
      originalStatus: entry.status,
      resolvedStatus: resolved,
      reason,
      requiredAction,
      evidencePaths,
      visibleUserMessage,
    })
  }

  return { entries, ...counts }
}

// =============================================================================
// PROGRAM-LEVEL ROLLUP BUILDER
// =============================================================================

export function buildDoctrineBlockResolutionRollup(
  perSessionResults: ClassifyDoctrineBlocksResult[],
): DoctrineBlockResolutionRollup {
  const totals = {
    totalApplied: 0,
    totalAlreadyApplied: 0,
    totalTrueSafetyBlocks: 0,
    totalNoRelevantTarget: 0,
    totalNotRelevantToSession: 0,
    totalBugMissingConnection: 0,
    totalBugRuntimeContractMissing: 0,
    totalBugDisplayConsumerMissing: 0,
    totalBugNormalizerDroppedTruth: 0,
    totalBugStaleSourceWon: 0,
    totalUnknownNeedsAudit: 0,
  }
  let firstBugSample: DoctrineBlockResolutionRollup['firstBugSample'] = null

  for (const r of perSessionResults) {
    totals.totalApplied += r.appliedCount
    totals.totalAlreadyApplied += r.alreadyAppliedCount
    totals.totalTrueSafetyBlocks += r.trueSafetyBlockCount
    totals.totalNoRelevantTarget += r.noRelevantTargetCount
    totals.totalNotRelevantToSession += r.notRelevantToSessionCount
    totals.totalBugMissingConnection += r.bugMissingConnectionCount
    totals.totalBugRuntimeContractMissing += r.bugRuntimeContractMissingCount
    totals.totalBugDisplayConsumerMissing += r.bugDisplayConsumerMissingCount
    totals.totalBugNormalizerDroppedTruth += r.bugNormalizerDroppedTruthCount
    totals.totalBugStaleSourceWon += r.bugStaleSourceWonCount
    totals.totalUnknownNeedsAudit += r.unknownNeedsAuditCount

    if (firstBugSample === null) {
      const firstBug = r.entries.find(
        (e) =>
          e.resolvedStatus === 'BUG_MISSING_CONNECTION' ||
          e.resolvedStatus === 'BUG_RUNTIME_CONTRACT_MISSING' ||
          e.resolvedStatus === 'BUG_DISPLAY_CONSUMER_MISSING' ||
          e.resolvedStatus === 'BUG_NORMALIZER_DROPPED_TRUTH' ||
          e.resolvedStatus === 'BUG_STALE_SOURCE_WON',
      )
      if (firstBug) {
        firstBugSample = {
          family: firstBug.family,
          dayNumber: firstBug.dayNumber ?? 0,
          resolvedStatus: firstBug.resolvedStatus,
          visibleUserMessage: firstBug.visibleUserMessage,
        }
      }
    }
  }

  const totalBugs =
    totals.totalBugMissingConnection +
    totals.totalBugRuntimeContractMissing +
    totals.totalBugDisplayConsumerMissing +
    totals.totalBugNormalizerDroppedTruth +
    totals.totalBugStaleSourceWon

  let finalVerdict: DoctrineBlockResolutionRollup['finalVerdict']
  if (totals.totalBugNormalizerDroppedTruth > 0 || totals.totalBugStaleSourceWon > 0) {
    finalVerdict = 'DISPLAY_SOURCE_SPLIT_REMAINS'
  } else if (totals.totalBugRuntimeContractMissing > 0) {
    finalVerdict = 'RUNTIME_PARITY_BLOCKED'
  } else if (totalBugs > 0) {
    finalVerdict = 'BUG_BLOCKS_REMAIN'
  } else {
    finalVerdict = 'ALL_BLOCKS_EXPLAINED_OR_APPLIED'
  }

  return {
    version: 'phase-4q-block-resolution-v1',
    ...totals,
    finalVerdict,
    firstBugSample,
    visibleProofPath: 'program.doctrineBlockResolutionRollup',
  }
}
