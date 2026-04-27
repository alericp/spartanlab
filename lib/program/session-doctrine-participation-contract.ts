/**
 * SESSION DOCTRINE PARTICIPATION CONTRACT — Phase 4Q
 *
 * =============================================================================
 * EVERY DAY ANSWERS: "DID DOCTRINE PARTICIPATE IN THIS SESSION?"
 * =============================================================================
 *
 * Background: through Phase 4N–4P the program object carries:
 *   - `program.weeklyMethodBudgetPlan` (per-family verdict)
 *   - `program.doctrineApplicationRollup` (row-level applied counts)
 *   - `program.methodStructureRollup` (structural applied counts)
 *
 * What was missing was a per-session answer: when the user opens Day 4 and
 * sees no method chips, they cannot tell whether:
 *   A) doctrine ran and decisively applied something,
 *   B) doctrine ran but no change was earned for this session,
 *   C) doctrine was not relevant to this session's role,
 *   D) doctrine input was missing (no profile / no runtime),
 *   E) doctrine output was dropped (normalizer / stale source bug),
 *   F) display does not consume the doctrine output that was produced,
 *   G) live workout does not consume what the program page shows.
 *
 * This contract gives every session one verdict + one one-line reason. The
 * row-level mutator stamps it onto `session.doctrineParticipation` after the
 * doctrine application corridor and structural materialization corridor have
 * run. The Program page MaterializationStatusLine renders a one-liner if any
 * day has a non-decisive verdict.
 *
 * It is JSON-safe and persistable.
 */

// =============================================================================
// VERDICT
// =============================================================================

export type SessionDoctrineParticipationVerdict =
  | 'DOCTRINE_USED_DECISIVELY'
  | 'DOCTRINE_EVALUATED_NO_CHANGE'
  | 'DOCTRINE_NOT_RELEVANT_TO_SESSION'
  | 'DOCTRINE_INPUT_MISSING'
  | 'DOCTRINE_OUTPUT_DROPPED'
  | 'DISPLAY_NOT_CONSUMING_DOCTRINE'
  | 'LIVE_WORKOUT_NOT_CONSUMING_DOCTRINE'

// =============================================================================
// PARTICIPATION OBJECT
// =============================================================================

export interface SessionDoctrineParticipation {
  version: 'phase-4q-session-doctrine-participation-v1'
  dayNumber: number
  sessionRole: string | null
  /** True iff the doctrine query service was reached (runtime contract usable). */
  doctrineQueried: boolean
  /** True iff the doctrine runtime returned a usable contract (not stale / not error). */
  doctrineRuntimeAvailable: boolean
  /** True iff the program-level training intent vector was built. */
  trainingIntentAvailable: boolean
  /** True iff the program-level weekly method budget plan was built. */
  weeklyBudgetAvailable: boolean
  /** True iff the per-session method decision was stamped (Phase 4M). */
  methodDecisionAvailable: boolean
  /** True iff the structural materialization corridor produced a result. */
  structuralMaterializationRan: boolean
  /** True iff the row-level method prescription mutator produced a result. */
  rowLevelMutationRan: boolean
  /** Number of methodStructures that ended up `applied` or `already_applied`. */
  finalVisibleMethodCount: number
  /** Number of styledGroups + grouped methodStructures (superset/circuit/density_block). */
  finalVisibleGroupCount: number
  /** Final per-session verdict for the Program page. */
  finalVerdict: SessionDoctrineParticipationVerdict
  /** One-line reason. Always populated. */
  reason: string
  /** Visible proof path the Program page can deep-link to. */
  visibleProofPath: 'session.doctrineParticipation'
}

// =============================================================================
// BUILDER INPUT
// =============================================================================

export interface BuildSessionDoctrineParticipationInput {
  dayNumber: number
  sessionRole?: string | null
  /** True if any doctrine source batch returned data this generation. */
  doctrineQueried: boolean
  /** True if `program.doctrineRuntimeContract` is usable (not stale/error). */
  doctrineRuntimeAvailable: boolean
  /** True if `program.trainingIntentVector` was built. */
  trainingIntentAvailable: boolean
  /** True if `program.weeklyMethodBudgetPlan` was built. */
  weeklyBudgetAvailable: boolean
  /** True if `session.methodDecision` is stamped. */
  methodDecisionAvailable: boolean
  /** True if structural corridor ran (passed the try/catch). */
  structuralMaterializationRan: boolean
  /** True if row-level mutator ran (passed the try/catch). */
  rowLevelMutationRan: boolean
  /** Counts derived from `session.methodStructures[]`. */
  appliedCount: number
  alreadyAppliedCount: number
  blockedCount: number
  noSafeTargetCount: number
  notNeededCount: number
  /** Counts of grouped (superset/circuit/density_block) entries that were
   *  applied or already-applied. */
  groupedAppliedCount: number
  /** Number of bug-classified entries from the block resolution classifier. */
  bugCount: number
}

// =============================================================================
// SESSION ROLES THAT INTENTIONALLY DO NOT ACCEPT DOCTRINE METHODS
// =============================================================================

const ROLES_WITHOUT_METHOD_DOCTRINE = new Set<string>([
  // Recovery sessions are intentionally low-stim — methods like density,
  // drop sets, rest-pause are out of scope by design. They are NOT bugs.
  'recovery',
  'mobility_only',
])

// =============================================================================
// BUILDER
// =============================================================================

export function buildSessionDoctrineParticipation(
  input: BuildSessionDoctrineParticipationInput,
): SessionDoctrineParticipation {
  const finalVisibleMethodCount = input.appliedCount + input.alreadyAppliedCount
  const finalVisibleGroupCount = input.groupedAppliedCount
  const sessionRole = input.sessionRole ?? null

  // -------------------------------------------------------------------------
  // VERDICT TREE
  // -------------------------------------------------------------------------
  // Order matters. We first detect missing inputs, then dropped output, then
  // role-relevance, then count-based verdicts.
  let finalVerdict: SessionDoctrineParticipationVerdict
  let reason: string

  if (!input.doctrineQueried || !input.doctrineRuntimeAvailable) {
    finalVerdict = 'DOCTRINE_INPUT_MISSING'
    reason = !input.doctrineQueried
      ? 'doctrine query did not return — runtime not reached'
      : 'doctrine runtime contract missing/stale at generation time'
  } else if (!input.trainingIntentAvailable || !input.weeklyBudgetAvailable) {
    finalVerdict = 'DOCTRINE_INPUT_MISSING'
    reason = !input.trainingIntentAvailable
      ? 'training intent vector missing — profile inputs unreadable'
      : 'weekly method budget plan missing — corridor had no doctrine-earned families'
  } else if (
    sessionRole !== null &&
    ROLES_WITHOUT_METHOD_DOCTRINE.has(sessionRole) &&
    finalVisibleMethodCount === 0
  ) {
    finalVerdict = 'DOCTRINE_NOT_RELEVANT_TO_SESSION'
    reason = `${sessionRole} sessions intentionally skip method doctrine`
  } else if (!input.structuralMaterializationRan && !input.rowLevelMutationRan) {
    finalVerdict = 'DOCTRINE_OUTPUT_DROPPED'
    reason =
      'corridors did not run for this session — structural and row-level mutator both skipped'
  } else if (input.bugCount > 0 && finalVisibleMethodCount === 0) {
    // Bugs prevented anything from materializing.
    finalVerdict = 'DOCTRINE_OUTPUT_DROPPED'
    reason = `${input.bugCount} method(s) blocked by classified bug — see doctrineBlockResolution`
  } else if (finalVisibleMethodCount > 0) {
    finalVerdict = 'DOCTRINE_USED_DECISIVELY'
    reason =
      finalVisibleGroupCount > 0
        ? `${finalVisibleMethodCount} method(s) applied including ${finalVisibleGroupCount} grouped block(s)`
        : `${finalVisibleMethodCount} row-level method(s) applied`
  } else {
    // Doctrine ran, no method earned for this session, no bugs. Honest no-change.
    finalVerdict = 'DOCTRINE_EVALUATED_NO_CHANGE'
    reason =
      input.noSafeTargetCount > 0
        ? `evaluated, no safe target this session (${input.noSafeTargetCount} families had no eligible row)`
        : 'evaluated, no method earned for this session role'
  }

  return {
    version: 'phase-4q-session-doctrine-participation-v1',
    dayNumber: input.dayNumber,
    sessionRole,
    doctrineQueried: input.doctrineQueried,
    doctrineRuntimeAvailable: input.doctrineRuntimeAvailable,
    trainingIntentAvailable: input.trainingIntentAvailable,
    weeklyBudgetAvailable: input.weeklyBudgetAvailable,
    methodDecisionAvailable: input.methodDecisionAvailable,
    structuralMaterializationRan: input.structuralMaterializationRan,
    rowLevelMutationRan: input.rowLevelMutationRan,
    finalVisibleMethodCount,
    finalVisibleGroupCount,
    finalVerdict,
    reason,
    visibleProofPath: 'session.doctrineParticipation',
  }
}

// =============================================================================
// PROGRAM-LEVEL PARTICIPATION ROLLUP
// =============================================================================

export interface ProgramDoctrineParticipationRollup {
  version: 'phase-4q-program-doctrine-participation-v1'
  sessionsProcessed: number
  countsByVerdict: Record<SessionDoctrineParticipationVerdict, number>
  /** True if every day either used doctrine decisively, evaluated honestly,
   *  or has a recognized role-based reason. False if any day silently skipped. */
  everyDayAccounted: boolean
  /** Worst-case verdict across the week, used for the program-page line. */
  worstVerdict: SessionDoctrineParticipationVerdict
  /** Days with the worst verdict — used for the line `(Day 3, 5)`. */
  worstVerdictDays: number[]
  visibleProofPath: 'program.doctrineParticipationRollup'
}

const VERDICT_PRIORITY: SessionDoctrineParticipationVerdict[] = [
  'LIVE_WORKOUT_NOT_CONSUMING_DOCTRINE',
  'DISPLAY_NOT_CONSUMING_DOCTRINE',
  'DOCTRINE_OUTPUT_DROPPED',
  'DOCTRINE_INPUT_MISSING',
  'DOCTRINE_NOT_RELEVANT_TO_SESSION',
  'DOCTRINE_EVALUATED_NO_CHANGE',
  'DOCTRINE_USED_DECISIVELY',
]

export function buildProgramDoctrineParticipationRollup(
  perSession: SessionDoctrineParticipation[],
): ProgramDoctrineParticipationRollup {
  const counts: Record<SessionDoctrineParticipationVerdict, number> = {
    DOCTRINE_USED_DECISIVELY: 0,
    DOCTRINE_EVALUATED_NO_CHANGE: 0,
    DOCTRINE_NOT_RELEVANT_TO_SESSION: 0,
    DOCTRINE_INPUT_MISSING: 0,
    DOCTRINE_OUTPUT_DROPPED: 0,
    DISPLAY_NOT_CONSUMING_DOCTRINE: 0,
    LIVE_WORKOUT_NOT_CONSUMING_DOCTRINE: 0,
  }
  for (const p of perSession) {
    counts[p.finalVerdict] += 1
  }

  // Worst-case verdict across the week (lowest priority index = worst).
  let worstVerdict: SessionDoctrineParticipationVerdict = 'DOCTRINE_USED_DECISIVELY'
  for (const v of VERDICT_PRIORITY) {
    if (counts[v] > 0) {
      worstVerdict = v
      break
    }
  }
  const worstVerdictDays = perSession
    .filter((p) => p.finalVerdict === worstVerdict)
    .map((p) => p.dayNumber)

  // Every day is "accounted for" iff none of them are output-dropped or
  // input-missing. Decisively-applied / evaluated-no-change / not-relevant
  // are all honest verdicts that the user can read.
  const everyDayAccounted =
    counts.DOCTRINE_OUTPUT_DROPPED === 0 &&
    counts.DOCTRINE_INPUT_MISSING === 0 &&
    counts.DISPLAY_NOT_CONSUMING_DOCTRINE === 0 &&
    counts.LIVE_WORKOUT_NOT_CONSUMING_DOCTRINE === 0

  return {
    version: 'phase-4q-program-doctrine-participation-v1',
    sessionsProcessed: perSession.length,
    countsByVerdict: counts,
    everyDayAccounted,
    worstVerdict,
    worstVerdictDays,
    visibleProofPath: 'program.doctrineParticipationRollup',
  }
}
