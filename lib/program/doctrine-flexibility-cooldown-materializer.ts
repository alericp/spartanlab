// =============================================================================
// [PHASE 4I] DOCTRINE FLEXIBILITY / COOLDOWN MATERIALIZER
// =============================================================================
//
// PURPOSE
// -------
// First true Phase 4I materializer. Reads the athlete's selected flexibility
// goals (e.g. pancake, front_split, hamstring_flexibility) and the batch-09
// FLEXIBILITY_GOAL_SUPPORT_MATRIX, and emits a per-session cooldown/flexibility
// block plan that the Program page can render and the matrix can audit.
//
// SAFETY-FIRST DESIGN (Phase 4I non-negotiables)
// ----------------------------------------------
//   1. PURE FUNCTION  — no I/O, no async, no DB access, no console mutation.
//   2. ADDITIVE OUTPUT — emits a NEW top-level program field
//      `cooldownFlexibilityMaterialization`. Does NOT mutate session.cooldown
//      or any existing session shape, so live workout handoff and existing
//      session-shape consumers cannot break.
//   3. PROFILE-GATED  — when inputs.flexibilityGoals is empty / undefined,
//      emits an empty plan with verdict NOT_RELEVANT_TO_CURRENT_PROFILE and
//      records why. Does NOT pretend to apply doctrine.
//   4. BOUNDED       — caps blocks per session and sessions per week so this
//      cannot bloat the program.
//   5. SAFETY-AWARE  — refuses to schedule blocks that the support matrix
//      flags `cooldownAllowed: false`, refuses to schedule pre-strength
//      static work for goals flagged `avoidLongStaticBeforeStrength: true`.
//   6. DETERMINISTIC — given the same inputs, produces the same output. No
//      Math.random, no Date.now in the plan body (only in the timestamp).
//
// HONESTY RULES
// -------------
//   • If FLEXIBILITY_GOAL_SUPPORT_MATRIX has no entry for an athlete-selected
//     goal, the goal is recorded under `unmatchedGoals` with a reason; it is
//     NOT silently dropped.
//   • If a goal is recognized but `directFlexibilityGoal === false`, it is
//     skipped with reason — Phase 4I scope is direct flexibility goals only.
//   • Every emitted block carries `sourceRuleIds` derived from the support-
//     matrix entry so save/load can prove provenance.
// =============================================================================

import {
  FLEXIBILITY_GOAL_SUPPORT_MATRIX,
  type FlexibilityGoalKey,
  type FlexibilityGoalSupportEntry,
} from '@/lib/doctrine/source-batches'

// -----------------------------------------------------------------------------
// PUBLIC TYPES (JSON-safe — verified by composition)
// -----------------------------------------------------------------------------

export type CooldownFlexibilityVerdict =
  | 'CONNECTED_AND_MATERIAL'
  | 'NOT_RELEVANT_TO_CURRENT_PROFILE'
  | 'BLOCKED_NO_ELIGIBLE_SESSIONS'
  | 'NO_GOALS_RECOGNIZED'

export interface CooldownFlexibilityBlock {
  /** Stable id for save/load and Program page rendering. */
  blockId: string
  /** Goal key from the FLEXIBILITY_GOAL_SUPPORT_MATRIX. */
  goalKey: FlexibilityGoalKey
  displayName: string
  /** Coach-facing prescription string from the support matrix. */
  prescription: string
  /** Methods preferred for this goal (from the support matrix). */
  preferredMethods: string[]
  /** Where in the session this block belongs (Phase 4I always 'cooldown'). */
  placement: 'cooldown'
  /** User-visible 1-line guidance from the support matrix. */
  userGuidance: string
  /** Source rule ids for provenance (derived from matrix entry). */
  sourceRuleIds: string[]
}

export interface CooldownFlexibilityMaterializedSession {
  /** 0-based index inside the program's flat session list. */
  sessionIndex: number
  /** 1-based week and day if available (informational only). */
  weekNumber: number | null
  dayNumber: number | null
  blocks: CooldownFlexibilityBlock[]
  /** Honest reason if no blocks were emitted for this session. */
  noChangeReason: string | null
}

export interface CooldownFlexibilityMaterialization {
  version: 'phase4i-cooldown-flexibility-materialization-v1'
  generatedAt: string
  verdict: CooldownFlexibilityVerdict
  /** All flexibility goals received from inputs (post-trim, post-dedupe). */
  athleteFlexibilityGoals: string[]
  /** Goals recognized by FLEXIBILITY_GOAL_SUPPORT_MATRIX. */
  recognizedGoals: FlexibilityGoalKey[]
  /** Goals NOT in the support matrix — recorded honestly with reason. */
  unmatchedGoals: { goal: string; reason: string }[]
  /** Goals recognized but skipped (e.g. directFlexibilityGoal=false). */
  skippedGoals: { goal: FlexibilityGoalKey; reason: string }[]
  /** Sessions that received at least one block. */
  materializedSessions: CooldownFlexibilityMaterializedSession[]
  totals: {
    eligibleGoalsCount: number
    sessionsConsidered: number
    sessionsMaterialized: number
    blocksEmitted: number
  }
  /** Plain-English summary for diagnostics. */
  notes: string
}

// -----------------------------------------------------------------------------
// PUBLIC ENTRY POINT
// -----------------------------------------------------------------------------

export interface BuildFlexibilityCooldownArgs {
  /** Direct echo of inputs.flexibilityGoals from the builder. */
  flexibilityGoals: string[] | null | undefined
  /**
   * Total number of sessions in the program (flat count, all weeks). Used to
   * decide how many sessions get cooldown blocks. The materializer never
   * exceeds this count.
   */
  totalSessionCount: number
  /**
   * Optional hint for week × day attribution; if not provided, sessionIndex
   * alone is recorded. Save/load survives without these.
   */
  sessionMetadata?: ReadonlyArray<{ sessionIndex: number; weekNumber?: number | null; dayNumber?: number | null }>
}

/** Phase 4I cap: at most this many sessions per week receive flexibility blocks. */
const MAX_SESSIONS_PER_WEEK_WITH_BLOCKS = 3
/** Phase 4I cap: at most this many distinct goals per session. */
const MAX_BLOCKS_PER_SESSION = 2

/**
 * Build the additive flexibility/cooldown materialization plan.
 *
 * Returns a fully populated CooldownFlexibilityMaterialization in every case,
 * including when there are no flexibility goals. Callers can attach the
 * result to `program.cooldownFlexibilityMaterialization` without any further
 * branching.
 */
export function buildDoctrineFlexibilityCooldownMaterialization(
  args: BuildFlexibilityCooldownArgs
): CooldownFlexibilityMaterialization {
  const generatedAt = new Date().toISOString()
  const totalSessionCount = Math.max(0, Math.floor(args.totalSessionCount ?? 0))

  // Step 1: trim/dedupe athlete flexibility goals defensively.
  const rawGoals = Array.isArray(args.flexibilityGoals) ? args.flexibilityGoals : []
  const athleteFlexibilityGoals = Array.from(
    new Set(
      rawGoals
        .map(g => (typeof g === 'string' ? g.trim() : ''))
        .filter(g => g.length > 0)
    )
  )

  // Step 2: short-circuit when nothing is selected.
  if (athleteFlexibilityGoals.length === 0) {
    return {
      version: 'phase4i-cooldown-flexibility-materialization-v1',
      generatedAt,
      verdict: 'NOT_RELEVANT_TO_CURRENT_PROFILE',
      athleteFlexibilityGoals,
      recognizedGoals: [],
      unmatchedGoals: [],
      skippedGoals: [],
      materializedSessions: [],
      totals: {
        eligibleGoalsCount: 0,
        sessionsConsidered: totalSessionCount,
        sessionsMaterialized: 0,
        blocksEmitted: 0,
      },
      notes:
        'No flexibility goals selected during onboarding. Cooldown/flexibility ' +
        'doctrine intentionally does not insert blocks when no direct goal ' +
        'exists, to avoid bloating sessions.',
    }
  }

  // Step 3: classify each athlete goal against the support matrix.
  const matrix = FLEXIBILITY_GOAL_SUPPORT_MATRIX as Record<string, FlexibilityGoalSupportEntry>
  const recognizedGoals: FlexibilityGoalKey[] = []
  const unmatchedGoals: { goal: string; reason: string }[] = []
  const skippedGoals: { goal: FlexibilityGoalKey; reason: string }[] = []

  for (const raw of athleteFlexibilityGoals) {
    // Allow case-insensitive match by lowercasing and replacing spaces with underscores
    const normalized = raw.toLowerCase().replace(/\s+/g, '_')
    const entry = matrix[normalized]
    if (!entry) {
      unmatchedGoals.push({
        goal: raw,
        reason: 'goal not present in FLEXIBILITY_GOAL_SUPPORT_MATRIX',
      })
      continue
    }
    if (entry.directFlexibilityGoal !== true) {
      skippedGoals.push({
        goal: entry.goalKey,
        reason:
          'matrix entry is a supporting / mobility-only category — Phase 4I emits cooldown blocks only for direct flexibility goals',
      })
      continue
    }
    if (entry.cooldownAllowed !== true) {
      skippedGoals.push({
        goal: entry.goalKey,
        reason: 'matrix entry has cooldownAllowed: false',
      })
      continue
    }
    recognizedGoals.push(entry.goalKey)
  }

  // Step 4: short-circuit when no recognized goals survive classification.
  if (recognizedGoals.length === 0) {
    return {
      version: 'phase4i-cooldown-flexibility-materialization-v1',
      generatedAt,
      verdict: 'NO_GOALS_RECOGNIZED',
      athleteFlexibilityGoals,
      recognizedGoals,
      unmatchedGoals,
      skippedGoals,
      materializedSessions: [],
      totals: {
        eligibleGoalsCount: 0,
        sessionsConsidered: totalSessionCount,
        sessionsMaterialized: 0,
        blocksEmitted: 0,
      },
      notes:
        'Athlete has flexibility goals but none of them survived the support-matrix ' +
        'classification (either unmatched, indirect, or cooldown-blocked).',
    }
  }

  // Step 5: short-circuit when the program has no sessions to attach to.
  if (totalSessionCount === 0) {
    return {
      version: 'phase4i-cooldown-flexibility-materialization-v1',
      generatedAt,
      verdict: 'BLOCKED_NO_ELIGIBLE_SESSIONS',
      athleteFlexibilityGoals,
      recognizedGoals,
      unmatchedGoals,
      skippedGoals,
      materializedSessions: [],
      totals: {
        eligibleGoalsCount: recognizedGoals.length,
        sessionsConsidered: 0,
        sessionsMaterialized: 0,
        blocksEmitted: 0,
      },
      notes:
        'Athlete has eligible flexibility goals but the program has zero sessions ' +
        'to attach cooldown blocks to.',
    }
  }

  // Step 6: pick which sessions get blocks.
  //
  // Phase 4I rule: at most MAX_SESSIONS_PER_WEEK_WITH_BLOCKS sessions per week
  // receive blocks. We approximate "week" by treating every 7 sessions as a
  // week boundary if no sessionMetadata is provided. This is a deliberately
  // conservative cap to prevent bloating sessions with cooldown work.
  const sessionMetaByIndex = new Map<number, { weekNumber: number | null; dayNumber: number | null }>()
  if (Array.isArray(args.sessionMetadata)) {
    for (const m of args.sessionMetadata) {
      if (typeof m?.sessionIndex === 'number') {
        sessionMetaByIndex.set(m.sessionIndex, {
          weekNumber: typeof m.weekNumber === 'number' ? m.weekNumber : null,
          dayNumber: typeof m.dayNumber === 'number' ? m.dayNumber : null,
        })
      }
    }
  }

  // Group session indices by week (using metadata if present, else 0-based fallback).
  const sessionsByWeek = new Map<number, number[]>()
  for (let i = 0; i < totalSessionCount; i += 1) {
    const meta = sessionMetaByIndex.get(i)
    const weekKey =
      meta?.weekNumber != null
        ? meta.weekNumber
        : Math.floor(i / 7) + 1 // approximate week if no metadata
    const arr = sessionsByWeek.get(weekKey) ?? []
    arr.push(i)
    sessionsByWeek.set(weekKey, arr)
  }

  // Pick up to MAX_SESSIONS_PER_WEEK_WITH_BLOCKS sessions per week, evenly spaced.
  const eligibleSessionIndices: number[] = []
  for (const [, indices] of sessionsByWeek) {
    const cap = Math.min(MAX_SESSIONS_PER_WEEK_WITH_BLOCKS, indices.length)
    if (cap === 0) continue
    const step = Math.max(1, Math.floor(indices.length / cap))
    for (let n = 0, i = 0; n < cap && i < indices.length; n += 1, i += step) {
      eligibleSessionIndices.push(indices[i])
    }
  }
  eligibleSessionIndices.sort((a, b) => a - b)

  // Step 7: assign goals to sessions in round-robin order so each goal gets
  // roughly equal exposure across the week. Each session gets up to
  // MAX_BLOCKS_PER_SESSION distinct goals.
  const materializedSessions: CooldownFlexibilityMaterializedSession[] = []
  let blocksEmitted = 0
  let goalCursor = 0
  for (const sessionIndex of eligibleSessionIndices) {
    const blocks: CooldownFlexibilityBlock[] = []
    for (let b = 0; b < MAX_BLOCKS_PER_SESSION; b += 1) {
      const goalKey = recognizedGoals[goalCursor % recognizedGoals.length]
      goalCursor += 1
      const entry = matrix[goalKey]
      if (!entry) continue
      // Skip duplicate within the same session
      if (blocks.some(x => x.goalKey === entry.goalKey)) continue
      const blockId = `phase4i-flex-${sessionIndex}-${entry.goalKey}-${b}`
      blocks.push({
        blockId,
        goalKey: entry.goalKey,
        displayName: entry.displayName,
        prescription: entry.recommendedDefaultPrescription,
        preferredMethods: Array.isArray(entry.preferredMethods)
          ? [...entry.preferredMethods]
          : [],
        placement: 'cooldown',
        userGuidance: entry.userVisibleGuidance,
        // Provenance: batch-09 source ids that govern flexibility goal entries.
        // Stable, JSON-safe, survives save/load.
        sourceRuleIds: [
          `src_batch_09_static_cooldown_flexibility_principles`,
          `src_batch_09_${entry.goalKey}_progression_batch_09`,
        ],
      })
      blocksEmitted += 1
    }
    const meta = sessionMetaByIndex.get(sessionIndex)
    materializedSessions.push({
      sessionIndex,
      weekNumber: meta?.weekNumber ?? null,
      dayNumber: meta?.dayNumber ?? null,
      blocks,
      noChangeReason: blocks.length === 0 ? 'no eligible goal could be assigned to this session' : null,
    })
  }

  return {
    version: 'phase4i-cooldown-flexibility-materialization-v1',
    generatedAt,
    verdict: blocksEmitted > 0 ? 'CONNECTED_AND_MATERIAL' : 'BLOCKED_NO_ELIGIBLE_SESSIONS',
    athleteFlexibilityGoals,
    recognizedGoals,
    unmatchedGoals,
    skippedGoals,
    materializedSessions,
    totals: {
      eligibleGoalsCount: recognizedGoals.length,
      sessionsConsidered: totalSessionCount,
      sessionsMaterialized: materializedSessions.filter(s => s.blocks.length > 0).length,
      blocksEmitted,
    },
    notes:
      `${recognizedGoals.length} flexibility goal(s) recognized: ${recognizedGoals.join(', ')}. ` +
      `${blocksEmitted} block(s) scheduled across ${materializedSessions.filter(s => s.blocks.length > 0).length} session(s). ` +
      `Cap: ${MAX_SESSIONS_PER_WEEK_WITH_BLOCKS} session(s)/week × ${MAX_BLOCKS_PER_SESSION} block(s)/session.`,
  }
}
