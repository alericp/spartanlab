/**
 * AUTHORITATIVE PROGRAM SOURCE MAP — Phase 4Q
 *
 * =============================================================================
 * READ-ONLY AUDIT/CONTRACT HELPER. NOT A BUILDER. NOT A MUTATOR.
 * =============================================================================
 *
 * The Program page and the Start Workout path can each read from many possible
 * sources of program truth:
 *   - the freshly generated program object,
 *   - a saved program returned from `getProgramState()` / localStorage,
 *   - a normalized loaded program from the live workout loader,
 *   - a flatter `buildProgramDisplayProjection()` projection,
 *   - older Phase-4E `doctrineCausalChallenge`-style proof fields,
 *   - source-batch labels that prove a doctrine *file* was loaded but NOT that
 *     it influenced the visible program,
 *   - a fallback session created by `createGuaranteedFallback()` after a load
 *     failure.
 *
 * This module classifies what is actually controlling the Program page's final
 * visible day cards and the Start Workout launch session, so the user (and the
 * code) can answer one question:
 *
 *   "If the Program page shows a circuit/superset/density block today, is it
 *    coming from the canonical generated program, or from a legacy/fallback
 *    path that won at display time?"
 *
 * It is intentionally a pure function. It NEVER mutates the program. It NEVER
 * writes to localStorage. It NEVER decides doctrine. It only inspects shapes
 * and emits a JSON-safe verdict.
 *
 * =============================================================================
 * INTEGRATION POINTS
 * =============================================================================
 *
 * 1. `lib/server/authoritative-program-generation.ts` calls
 *    `runAuthoritativeProgramSourceMap()` once after the per-session corridor
 *    loop and stamps the result onto `program.authoritativeSourceMap`. This
 *    proves that, at generation time, the freshly built program has every
 *    canonical method/structure field populated.
 *
 * 2. The Program page (or any client that has a hydrated program) MAY call
 *    `runAuthoritativeProgramSourceMap()` again with the live program object
 *    and compare. A divergence between generation-time and display-time
 *    source maps is the signal that a legacy path is winning.
 *
 * 3. The Start Workout corridor MAY call `runLiveWorkoutSourceMap()` with the
 *    live-workout normalized session to prove that `methodStructures`,
 *    `styledGroups`, and row-level method fields survived the normalize
 *    boundary in `lib/workout/load-authoritative-session.ts` /
 *    `lib/workout/normalize-workout-session.ts`.
 */

// =============================================================================
// PER-FIELD VERDICT
// =============================================================================

/**
 * Per-field verdict for the source map. The fields that matter to Phase 4Q
 * are split into two categories:
 *   - DISPLAY-CONTROLLING: must be `AUTHORITATIVE` for the Program page to
 *     reflect doctrine truth (e.g. `methodStructures`, `styledGroups`).
 *   - COMPATIBILITY-ONLY: older proof/scaffolding fields that should be
 *     preserved but must NOT control the visible card if newer truth exists
 *     (e.g. older `doctrineCausalChallenge`-style proof strings, source batch
 *     labels). These are tracked as `COMPATIBILITY_ONLY` and counted in
 *     `demotedSources`.
 */
// [PHASE 4Y] H.H5 — pull in the live grouped runtime evaluator so the
// per-program source map can publish a runtime verdict alongside the
// data-preservation verdict.
import {
  evaluateLiveGroupedExecution,
  type LiveGroupedRuntimeVerdict,
  type LiveGroupedRuntimeReason,
} from '@/lib/workout/live-grouped-execution-contract'

export type SourceFieldVerdictKind =
  | 'AUTHORITATIVE'
  | 'COMPATIBILITY_ONLY'
  | 'DISPLAY_ONLY'
  | 'LEGACY_DEMOTED'
  | 'MISSING'
  | 'DIVERGENT'

export interface SourceFieldVerdict {
  /** True when the field is present and non-empty on the input program. */
  present: boolean
  /** Dotted path that points to the canonical owner. */
  sourcePath: string
  /**
   * True when this field — as it currently sits — is what the Program page
   * card-builder will read for the day's visible block layout. False when the
   * field is preserved for diagnostics only.
   */
  controlsFinalDisplay: boolean
  /**
   * True when this field — as it currently sits — is what the live workout
   * launch will read. False when the live workout consumes a different field
   * (the parity verifier surfaces that as a separate divergence).
   */
  controlsLiveWorkout: boolean
  verdict: SourceFieldVerdictKind
  /** Plain English. Always populated. */
  notes: string
}

// =============================================================================
// PROGRAM-LEVEL SOURCE MAP
// =============================================================================

export interface AuthoritativeProgramSourceMap {
  version: 'phase-4q-authoritative-source-map-v1'
  /**
   * Where the program object came from at the moment this map was built.
   * `generation` = fresh post-builder + post-corridor authoritative output.
   * `program_state` = read from `getProgramState()` (the page-level cached
   *   handoff between generation and the route render).
   * `display_projection` = a projection produced by
   *   `buildProgramDisplayProjection()` — should NEVER be the final source
   *   for live workout launch.
   * `live_workout_loader` = a normalized session emitted by
   *   `loadAuthoritativeSession()` for the live workout route.
   */
  finalProgramSource:
    | 'generation'
    | 'program_state'
    | 'display_projection'
    | 'live_workout_loader'
    | 'unknown'
  finalSessionSource:
    | 'program.sessions'
    | 'displayProjection.visibleSessionCards'
    | 'live_workout.normalized_session'
    | 'fallback'
    | 'unknown'
  finalDisplaySource:
    | 'canonical_session_object'
    | 'display_projection_only'
    | 'split_canonical_and_projection'
    | 'unknown'
  finalWorkoutLaunchSource:
    | 'canonical_session_object'
    | 'normalized_session_with_preserved_truth'
    | 'normalized_session_with_dropped_truth'
    | 'fallback'
    | 'unknown'
  programId: string | null
  generatedAt: string | null
  sessionsCount: number
  sourceVerdict:
    | 'LOCKED_SINGLE_AUTHORITATIVE_SOURCE'
    | 'SPLIT_SOURCE_DETECTED'
    | 'STALE_SOURCE_DETECTED'
    | 'LEGACY_FALLBACK_CONTROLLING_DISPLAY'
    | 'LIVE_WORKOUT_DIVERGES_FROM_PROGRAM_DISPLAY'
  // ===========================================================================
  // [PHASE 4W] FALLBACK-CONTROLS-DISPLAY CLASSIFICATION
  // ---------------------------------------------------------------------------
  // The existing `sourceVerdict` flags `LEGACY_FALLBACK_CONTROLLING_DISPLAY`
  // only when no canonical signal is left at all. Phase 4W adds a finer-grained
  // pair of booleans + reason codes so Program page / AdaptiveSessionCard /
  // diagnostics can answer *exactly* one question: "Is the visible card today
  // backed by canonical session truth, or is fallback driving it?" — without
  // having to redo the entire source-map analysis.
  //
  // Definitions (mutually exclusive when there is any program data):
  //   - `canonicalControlsDisplay = true`  ↔ the visible card today is
  //      controlled by a canonical signal: methodStructures (preferred),
  //      non-straight styledGroups, OR row-level method fields. Either
  //      methodStructures itself is present, or styledGroups+row-level
  //      methods agree with it (Phase 4P sibling output of the same
  //      corridor).
  //   - `fallbackControlsDisplay = true`   ↔ no canonical signal is
  //      driving the visible card today; whatever the user sees is coming
  //      from compatibility/legacy/fallback fields.
  //
  // Reason codes are stable strings (not localized prose) so consumers can
  // log/filter them without parsing English.
  // ===========================================================================
  /** True when canonical session truth controls today's visible cards. */
  canonicalControlsDisplay: boolean
  /** Stable reason explaining `canonicalControlsDisplay`. Null when not
   *  applicable (e.g. no program). */
  canonicalDisplayReason:
    | 'CANONICAL_TRUTH_PRESENT'
    | 'CANONICAL_METHOD_STRUCTURES_DRIVE_DISPLAY'
    | 'STYLED_GROUPS_AGREE_WITH_CANONICAL_CORRIDOR'
    | 'ROW_LEVEL_METHODS_DRIVE_DISPLAY'
    | null
  /** True when fallback / legacy / compatibility fields are what the user
   *  is seeing today (not necessarily a regression — legacy saved programs
   *  that never had canonical truth land here legitimately). */
  fallbackControlsDisplay: boolean
  /** Stable reason explaining `fallbackControlsDisplay`. Null when not
   *  applicable (canonical truth present and controlling). Multiple reasons
   *  may apply; the most-blocking one wins. */
  fallbackDisplayReason:
    | 'LEGACY_PROGRAM_NO_CANONICAL_TRUTH'
    | 'CANONICAL_TRUTH_PRESENT_BUT_FALLBACK_DISPLAY_CONTROLS'
    | 'FALLBACK_USED_FOR_COMPATIBILITY'
    | 'STYLED_GROUPS_USED_WITHOUT_METHOD_STRUCTURES'
    | 'DOCTRINE_CAUSAL_DISPLAY_USED_WITHOUT_DOCTRINE_BLOCK_RESOLUTION'
    | 'DISPLAY_PROJECTION_OLDER_THAN_CANONICAL_SESSION'
    | null
  fields: {
    programObject: SourceFieldVerdict
    sessions: SourceFieldVerdict
    exercises: SourceFieldVerdict
    methodStructures: SourceFieldVerdict
    styledGroups: SourceFieldVerdict
    rowLevelMethods: SourceFieldVerdict
    doctrineRollups: SourceFieldVerdict
    displayProjection: SourceFieldVerdict
    workoutLaunchSession: SourceFieldVerdict
  }
  /**
   * Source paths that were observed but are explicitly demoted to
   * compatibility-only. The Program page MUST NOT let these win over
   * `methodStructures` / `styledGroups` / row-level method fields.
   */
  demotedSources: string[]
  /**
   * Source paths that are blocked from controlling final display. If any of
   * these are observed AND newer canonical truth exists, the source map flags
   * `LEGACY_FALLBACK_CONTROLLING_DISPLAY`.
   */
  blockedLegacySources: string[]
  warnings: string[]
}

// =============================================================================
// MINIMAL INPUT SHAPE
// =============================================================================

/**
 * Minimal duck-typed shape we read from. We intentionally do NOT import
 * `AdaptiveProgram` — this helper must be runnable on a raw saved-state JSON
 * blob (e.g. a hydrated localStorage object) without import-time crashes.
 */
type ProgramLike = {
  id?: unknown
  generatedAt?: unknown
  sessions?: unknown
  methodStructureRollup?: unknown
  doctrineApplicationRollup?: unknown
  rowLevelMutatorRollup?: unknown
  weeklyMethodBudgetPlan?: unknown
  trainingIntentVector?: unknown
  // Older / compatibility-only proof fields. Present on legacy programs.
  doctrineCausalChallenge?: unknown
  doctrineSourceBatchLabels?: unknown
}

type SessionLike = {
  dayNumber?: unknown
  exercises?: unknown
  methodStructures?: unknown
  styleMetadata?: unknown
  rowLevelMutatorSummary?: unknown
}

// =============================================================================
// FIELD INSPECTORS
// =============================================================================

function safeIsArray(v: unknown): v is unknown[] {
  return Array.isArray(v)
}

function nonEmptyArrayCount(v: unknown): number {
  return safeIsArray(v) ? v.length : 0
}

function inspectMethodStructures(sessions: SessionLike[]): {
  totalMethodStructures: number
  sessionsWithMethodStructures: number
} {
  let total = 0
  let withMethodStructures = 0
  for (const sess of sessions) {
    const arr = sess.methodStructures
    if (safeIsArray(arr) && arr.length > 0) {
      withMethodStructures += 1
      total += arr.length
    }
  }
  return { totalMethodStructures: total, sessionsWithMethodStructures: withMethodStructures }
}

function inspectStyledGroups(sessions: SessionLike[]): {
  totalStyledGroups: number
  sessionsWithStyledGroups: number
  sessionsWithNonStraightGroups: number
} {
  let total = 0
  let withStyledGroups = 0
  let withNonStraight = 0
  for (const sess of sessions) {
    const sm = sess.styleMetadata as { styledGroups?: unknown } | undefined
    const groups = sm?.styledGroups
    if (safeIsArray(groups) && groups.length > 0) {
      withStyledGroups += 1
      total += groups.length
      const nonStraight = groups.some(
        (g) =>
          g &&
          typeof g === 'object' &&
          (g as { groupType?: string }).groupType !== 'straight',
      )
      if (nonStraight) withNonStraight += 1
    }
  }
  return {
    totalStyledGroups: total,
    sessionsWithStyledGroups: withStyledGroups,
    sessionsWithNonStraightGroups: withNonStraight,
  }
}

function inspectRowLevelMethods(sessions: SessionLike[]): {
  totalRowLevelMethodFields: number
  sessionsWithRowLevelMethodFields: number
} {
  // Look for per-exercise `setExecutionMethod`, `method`, `methodLabel`,
  // `densityPrescription`, `doctrineApplicationDeltas`, or
  // `structuralMethodApplied`. Any of these counts.
  let total = 0
  let sessionsHit = 0
  for (const sess of sessions) {
    const exs = safeIsArray(sess.exercises) ? sess.exercises : []
    let sessionTotal = 0
    for (const ex of exs) {
      if (!ex || typeof ex !== 'object') continue
      const e = ex as Record<string, unknown>
      const hit =
        typeof e.setExecutionMethod === 'string' ||
        typeof e.method === 'string' ||
        typeof e.methodLabel === 'string' ||
        (e.densityPrescription && typeof e.densityPrescription === 'object') ||
        (safeIsArray(e.doctrineApplicationDeltas) && (e.doctrineApplicationDeltas as unknown[]).length > 0) ||
        e.structuralMethodApplied === true
      if (hit) sessionTotal += 1
    }
    if (sessionTotal > 0) sessionsHit += 1
    total += sessionTotal
  }
  return { totalRowLevelMethodFields: total, sessionsWithRowLevelMethodFields: sessionsHit }
}

// =============================================================================
// MAIN PROGRAM-LEVEL SOURCE MAP
// =============================================================================

export interface RunAuthoritativeProgramSourceMapInput {
  program: unknown
  /** Where this call site claims the program came from. */
  observedAt: AuthoritativeProgramSourceMap['finalProgramSource']
  /**
   * Set true when the call site has reason to believe the program came from a
   * stale localStorage hydration (e.g. boot-time before fresh generation).
   */
  staleSourceSuspected?: boolean
  /**
   * Set true when the call site has reason to believe a fresh generation
   * just succeeded, so any localStorage win would be a regression.
   */
  freshGenerationJustCompleted?: boolean
}

export function runAuthoritativeProgramSourceMap(
  input: RunAuthoritativeProgramSourceMapInput,
): AuthoritativeProgramSourceMap {
  const program = (input.program ?? null) as ProgramLike | null
  const observedAt = input.observedAt
  const staleSourceSuspected = input.staleSourceSuspected === true
  const freshGenerationJustCompleted = input.freshGenerationJustCompleted === true

  const warnings: string[] = []
  const demotedSources: string[] = []
  const blockedLegacySources: string[] = []

  if (!program || typeof program !== 'object') {
    return {
      version: 'phase-4q-authoritative-source-map-v1',
      finalProgramSource: observedAt,
      finalSessionSource: 'unknown',
      finalDisplaySource: 'unknown',
      finalWorkoutLaunchSource: 'unknown',
      programId: null,
      generatedAt: null,
      sessionsCount: 0,
      sourceVerdict: 'STALE_SOURCE_DETECTED',
      // [PHASE 4W] No program → display is trivially fallback-controlled
      // because there is nothing canonical to drive it. Reason is the
      // generic legacy-no-canonical code; consumers should already gate on
      // `programId !== null` before treating this as actionable.
      canonicalControlsDisplay: false,
      canonicalDisplayReason: null,
      fallbackControlsDisplay: true,
      fallbackDisplayReason: 'LEGACY_PROGRAM_NO_CANONICAL_TRUTH',
      fields: makeAllMissingFields(),
      demotedSources,
      blockedLegacySources,
      warnings: ['program object missing or non-object'],
    }
  }

  const sessions: SessionLike[] = safeIsArray(program.sessions)
    ? (program.sessions as SessionLike[])
    : []

  const methodStructureCounts = inspectMethodStructures(sessions)
  const styledGroupsCounts = inspectStyledGroups(sessions)
  const rowLevelCounts = inspectRowLevelMethods(sessions)

  const hasMethodStructureRollup =
    program.methodStructureRollup !== undefined && program.methodStructureRollup !== null
  const hasDoctrineApplicationRollup =
    program.doctrineApplicationRollup !== undefined && program.doctrineApplicationRollup !== null
  const hasWeeklyBudgetPlan =
    program.weeklyMethodBudgetPlan !== undefined && program.weeklyMethodBudgetPlan !== null

  // Compatibility-only legacy proof labels — present on older programs. These
  // remain on the program object for diagnostics, but they are NOT allowed to
  // control which method block the Program page renders.
  if (program.doctrineCausalChallenge !== undefined && program.doctrineCausalChallenge !== null) {
    demotedSources.push('program.doctrineCausalChallenge')
    if (
      !hasMethodStructureRollup &&
      methodStructureCounts.totalMethodStructures === 0
    ) {
      // Older proof field is the only remaining doctrine signal. Block it.
      blockedLegacySources.push('program.doctrineCausalChallenge')
      warnings.push(
        'doctrineCausalChallenge present but methodStructureRollup missing — older proof must not control display',
      )
    }
  }
  if (
    program.doctrineSourceBatchLabels !== undefined &&
    safeIsArray(program.doctrineSourceBatchLabels) &&
    nonEmptyArrayCount(program.doctrineSourceBatchLabels) > 0
  ) {
    // Source batch labels prove a doctrine *file* loaded; they do NOT prove
    // the doctrine influenced the visible session. They are demoted at
    // display time so chips like "Batch 7 loaded" cannot stand in for an
    // actual applied method.
    demotedSources.push('program.doctrineSourceBatchLabels')
  }

  // -------------------------------------------------------------------------
  // PER-FIELD VERDICTS
  // -------------------------------------------------------------------------
  const fields: AuthoritativeProgramSourceMap['fields'] = {
    programObject: {
      present: true,
      sourcePath: 'program',
      controlsFinalDisplay: true,
      controlsLiveWorkout: true,
      verdict: 'AUTHORITATIVE',
      notes: 'program object loaded',
    },
    sessions: {
      present: sessions.length > 0,
      sourcePath: 'program.sessions',
      controlsFinalDisplay: true,
      controlsLiveWorkout: true,
      verdict: sessions.length > 0 ? 'AUTHORITATIVE' : 'MISSING',
      notes:
        sessions.length > 0
          ? `${sessions.length} sessions present`
          : 'sessions array missing or empty',
    },
    exercises: {
      present: sessions.some(
        (s) => safeIsArray(s.exercises) && (s.exercises as unknown[]).length > 0,
      ),
      sourcePath: 'program.sessions[].exercises',
      controlsFinalDisplay: true,
      controlsLiveWorkout: true,
      verdict: sessions.some(
        (s) => safeIsArray(s.exercises) && (s.exercises as unknown[]).length > 0,
      )
        ? 'AUTHORITATIVE'
        : 'MISSING',
      notes: 'per-session exercise rows',
    },
    methodStructures: {
      present: methodStructureCounts.totalMethodStructures > 0,
      sourcePath: 'program.sessions[].methodStructures',
      controlsFinalDisplay: methodStructureCounts.totalMethodStructures > 0,
      controlsLiveWorkout: methodStructureCounts.totalMethodStructures > 0,
      verdict:
        methodStructureCounts.totalMethodStructures > 0
          ? 'AUTHORITATIVE'
          : hasMethodStructureRollup
            ? 'COMPATIBILITY_ONLY'
            : 'MISSING',
      notes: `${methodStructureCounts.totalMethodStructures} entries across ${methodStructureCounts.sessionsWithMethodStructures} sessions`,
    },
    styledGroups: {
      present: styledGroupsCounts.totalStyledGroups > 0,
      sourcePath: 'program.sessions[].styleMetadata.styledGroups',
      controlsFinalDisplay: styledGroupsCounts.sessionsWithNonStraightGroups > 0,
      controlsLiveWorkout: styledGroupsCounts.sessionsWithNonStraightGroups > 0,
      verdict:
        styledGroupsCounts.sessionsWithNonStraightGroups > 0
          ? 'AUTHORITATIVE'
          : styledGroupsCounts.totalStyledGroups > 0
            ? 'COMPATIBILITY_ONLY'
            : 'MISSING',
      notes: `${styledGroupsCounts.sessionsWithStyledGroups} sessions with styledGroups (${styledGroupsCounts.sessionsWithNonStraightGroups} non-straight)`,
    },
    rowLevelMethods: {
      present: rowLevelCounts.totalRowLevelMethodFields > 0,
      sourcePath:
        'program.sessions[].exercises[].{setExecutionMethod,method,methodLabel,densityPrescription,doctrineApplicationDeltas,structuralMethodApplied}',
      controlsFinalDisplay: rowLevelCounts.totalRowLevelMethodFields > 0,
      controlsLiveWorkout: rowLevelCounts.totalRowLevelMethodFields > 0,
      verdict:
        rowLevelCounts.totalRowLevelMethodFields > 0 ? 'AUTHORITATIVE' : 'MISSING',
      notes: `${rowLevelCounts.totalRowLevelMethodFields} rows across ${rowLevelCounts.sessionsWithRowLevelMethodFields} sessions`,
    },
    doctrineRollups: {
      present: hasMethodStructureRollup || hasDoctrineApplicationRollup,
      sourcePath: 'program.{methodStructureRollup,doctrineApplicationRollup,rowLevelMutatorRollup,weeklyMethodBudgetPlan,trainingIntentVector}',
      controlsFinalDisplay: false,
      controlsLiveWorkout: false,
      verdict:
        hasMethodStructureRollup && hasDoctrineApplicationRollup && hasWeeklyBudgetPlan
          ? 'AUTHORITATIVE'
          : hasMethodStructureRollup || hasDoctrineApplicationRollup
            ? 'COMPATIBILITY_ONLY'
            : 'MISSING',
      notes: 'rollups are diagnostic — they prove decisions ran, they do not control display',
    },
    displayProjection: {
      present: false, // populated by Program page when it builds its own map
      sourcePath: 'displayProjection.visibleSessionCards',
      controlsFinalDisplay: false,
      controlsLiveWorkout: false,
      verdict: 'DISPLAY_ONLY',
      notes:
        'projection is allowed to format/summarize/prioritize but must not control method truth',
    },
    workoutLaunchSession: {
      present: false, // populated by live workout when it loads
      sourcePath: 'live_workout.normalized_session',
      controlsFinalDisplay: false,
      controlsLiveWorkout: true,
      verdict: 'COMPATIBILITY_ONLY',
      notes: 'parity confirmed/broken via runLiveWorkoutSourceMap()',
    },
  }

  // -------------------------------------------------------------------------
  // OVERALL VERDICT
  // -------------------------------------------------------------------------
  let sourceVerdict: AuthoritativeProgramSourceMap['sourceVerdict']
  if (
    blockedLegacySources.length > 0 &&
    !hasMethodStructureRollup &&
    methodStructureCounts.totalMethodStructures === 0
  ) {
    sourceVerdict = 'LEGACY_FALLBACK_CONTROLLING_DISPLAY'
  } else if (staleSourceSuspected && freshGenerationJustCompleted) {
    sourceVerdict = 'STALE_SOURCE_DETECTED'
    warnings.push(
      'fresh generation completed but source observed as stale localStorage — block hydration replay',
    )
  } else if (
    sessions.length > 0 &&
    rowLevelCounts.totalRowLevelMethodFields === 0 &&
    methodStructureCounts.totalMethodStructures === 0
  ) {
    sourceVerdict = 'SPLIT_SOURCE_DETECTED'
    warnings.push(
      'sessions present but no methodStructures and no row-level method fields — likely projection-only or pre-corridor program',
    )
  } else {
    sourceVerdict = 'LOCKED_SINGLE_AUTHORITATIVE_SOURCE'
  }

  // ---------------------------------------------------------------------------
  // [PHASE 4W] CANONICAL VS FALLBACK DISPLAY CLASSIFICATION
  // ---------------------------------------------------------------------------
  // Definitions, evaluated in priority order:
  //   1. methodStructures present on ≥1 session                  → canonical
  //   2. else: non-straight styledGroups + row-level methods     → canonical
  //      (Phase 4P sibling output of the same corridor)
  //   3. else: row-level methods alone                           → canonical
  //   4. else: ANY canonical signal exists but display is not    → fallback
  //      controlled by it (e.g. methodStructureRollup says it    (CANONICAL_…
  //      ran but per-session structures are missing)              BUT_FALLBACK)
  //   5. else: legacy / no canonical signal at all                → fallback
  //      (LEGACY_PROGRAM_NO_CANONICAL_TRUTH)
  //
  // The blocked-legacy-source branch upgrades reason to the most blocking
  // case so consumers can show targeted dev diagnostics:
  //   - `STYLED_GROUPS_USED_WITHOUT_METHOD_STRUCTURES`
  //   - `DOCTRINE_CAUSAL_DISPLAY_USED_WITHOUT_DOCTRINE_BLOCK_RESOLUTION`
  // ---------------------------------------------------------------------------
  let canonicalControlsDisplay = false
  let canonicalDisplayReason: AuthoritativeProgramSourceMap['canonicalDisplayReason'] = null
  let fallbackControlsDisplay = false
  let fallbackDisplayReason: AuthoritativeProgramSourceMap['fallbackDisplayReason'] = null

  if (methodStructureCounts.totalMethodStructures > 0) {
    canonicalControlsDisplay = true
    canonicalDisplayReason = 'CANONICAL_METHOD_STRUCTURES_DRIVE_DISPLAY'
  } else if (
    styledGroupsCounts.sessionsWithNonStraightGroups > 0 &&
    rowLevelCounts.totalRowLevelMethodFields > 0
  ) {
    // Sibling Phase 4P outputs agree on a doctrine corridor decision; this
    // is canonical-equivalent display even though the methodStructures
    // array specifically is empty/legacy.
    canonicalControlsDisplay = true
    canonicalDisplayReason = 'STYLED_GROUPS_AGREE_WITH_CANONICAL_CORRIDOR'
  } else if (rowLevelCounts.totalRowLevelMethodFields > 0) {
    canonicalControlsDisplay = true
    canonicalDisplayReason = 'ROW_LEVEL_METHODS_DRIVE_DISPLAY'
  } else {
    // No canonical display driver. Decide which fallback flavor applies.
    fallbackControlsDisplay = true
    if (styledGroupsCounts.totalStyledGroups > 0) {
      // styledGroups present but no methodStructures and no row-level
      // methods → display is being painted off legacy styledGroups only.
      fallbackDisplayReason = 'STYLED_GROUPS_USED_WITHOUT_METHOD_STRUCTURES'
    } else if (
      blockedLegacySources.includes('program.doctrineCausalChallenge')
    ) {
      fallbackDisplayReason =
        'DOCTRINE_CAUSAL_DISPLAY_USED_WITHOUT_DOCTRINE_BLOCK_RESOLUTION'
    } else if (
      hasMethodStructureRollup ||
      hasDoctrineApplicationRollup ||
      hasWeeklyBudgetPlan
    ) {
      // The decision rollups exist but per-session structures are gone —
      // canonical truth was authored upstream but the display layer is
      // running on something else.
      fallbackDisplayReason =
        'CANONICAL_TRUTH_PRESENT_BUT_FALLBACK_DISPLAY_CONTROLS'
    } else if (sessions.length > 0) {
      // Sessions render through compatibility fallback (e.g. straight
      // exercises only). Honest, not a regression for legacy programs.
      fallbackDisplayReason = 'LEGACY_PROGRAM_NO_CANONICAL_TRUTH'
    } else {
      fallbackDisplayReason = 'LEGACY_PROGRAM_NO_CANONICAL_TRUTH'
    }
  }

  return {
    version: 'phase-4q-authoritative-source-map-v1',
    finalProgramSource: observedAt,
    finalSessionSource: sessions.length > 0 ? 'program.sessions' : 'unknown',
    finalDisplaySource:
      methodStructureCounts.totalMethodStructures > 0 ||
      styledGroupsCounts.sessionsWithNonStraightGroups > 0 ||
      rowLevelCounts.totalRowLevelMethodFields > 0
        ? 'canonical_session_object'
        : 'unknown',
    finalWorkoutLaunchSource:
      observedAt === 'live_workout_loader' ? 'normalized_session_with_preserved_truth' : 'canonical_session_object',
    programId: typeof program.id === 'string' ? program.id : null,
    generatedAt: typeof program.generatedAt === 'string' ? program.generatedAt : null,
    sessionsCount: sessions.length,
    sourceVerdict,
    canonicalControlsDisplay,
    canonicalDisplayReason,
    fallbackControlsDisplay,
    fallbackDisplayReason,
    fields,
    demotedSources,
    blockedLegacySources,
    warnings,
  }
}

function makeAllMissingFields(): AuthoritativeProgramSourceMap['fields'] {
  const m = (path: string): SourceFieldVerdict => ({
    present: false,
    sourcePath: path,
    controlsFinalDisplay: false,
    controlsLiveWorkout: false,
    verdict: 'MISSING',
    notes: 'absent or unreadable',
  })
  return {
    programObject: m('program'),
    sessions: m('program.sessions'),
    exercises: m('program.sessions[].exercises'),
    methodStructures: m('program.sessions[].methodStructures'),
    styledGroups: m('program.sessions[].styleMetadata.styledGroups'),
    rowLevelMethods: m('program.sessions[].exercises[]'),
    doctrineRollups: m('program.methodStructureRollup'),
    displayProjection: m('displayProjection.visibleSessionCards'),
    workoutLaunchSession: m('live_workout.normalized_session'),
  }
}

// =============================================================================
// LIVE WORKOUT SESSION SOURCE MAP
// =============================================================================

/**
 * Subset of the program source map for the live-workout single-session case.
 * This is what the Start Workout corridor calls AFTER `loadAuthoritativeSession`
 * has produced a normalized session. It compares program-display-time canonical
 * truth against live-workout-time normalized truth and reports parity.
 */
export interface LiveWorkoutSourceMap {
  version: 'phase-4q-live-workout-source-map-v1'
  programDisplaySessionId: string | null
  liveWorkoutSessionId: string | null
  selectedVariantPreserved: boolean
  methodStructuresPreserved: boolean
  styledGroupsPreserved: boolean
  rowLevelMethodsPreserved: boolean
  rowLevelMutatorSummaryPreserved: boolean
  doctrineParticipationPreserved: boolean
  doctrineBlockResolutionPreserved: boolean
  verdict:
    | 'LIVE_PARITY_CONFIRMED'
    | 'LIVE_GUIDANCE_PRESERVED_ONLY'
    | 'LIVE_PARITY_BROKEN_NORMALIZER'
    | 'LIVE_PARITY_BROKEN_SELECTED_VARIANT'
    | 'LIVE_PARITY_BROKEN_STALE_SOURCE'
    | 'LIVE_NOT_LAUNCHED_YET'
  /**
   * [PHASE 4Y] H.H5 runtime verdict. Independent of the data-preservation
   * `verdict` above. Proves whether the live runtime will actually consume
   * grouped truth as interactive sequences (FULL_GROUPED_RUNTIME) or has
   * fallen back to guidance-only / blocked / partial. Populated by
   * `evaluateLiveGroupedExecution(liveSess)`.
   */
  liveGroupedRuntimeVerdict: LiveGroupedRuntimeVerdict
  /** Stable reason codes attached to `liveGroupedRuntimeVerdict`. */
  liveGroupedRuntimeReasons: LiveGroupedRuntimeReason[]
  /** Source the live runtime ultimately consumed for grouped blocks. */
  liveGroupedRuntimeSource:
    | 'methodStructures'
    | 'styledGroups'
    | 'rowLevelMethods'
    | 'flatRows'
  /** True when at least one grouped block is executable in the live runtime. */
  liveGroupedRuntimeHasExecutableBlocks: boolean
  warnings: string[]
}

export interface RunLiveWorkoutSourceMapInput {
  /** The exact session object the Program page card committed to launch. */
  programDisplaySession: unknown
  /** The normalized session the live workout loaded after normalization. */
  liveWorkoutSession: unknown
  /** Selected variant key (full / 45 / 30) the Program card committed to. */
  selectedVariantKey?: string | null
  /** Selected variant key the live workout actually consumed. */
  liveSelectedVariantKey?: string | null
  /** True if the live workout corridor had to fall back to a stale source. */
  staleSourceUsed?: boolean
}

export function runLiveWorkoutSourceMap(
  input: RunLiveWorkoutSourceMapInput,
): LiveWorkoutSourceMap {
  const warnings: string[] = []
  const programSess =
    input.programDisplaySession && typeof input.programDisplaySession === 'object'
      ? (input.programDisplaySession as Record<string, unknown>)
      : null
  const liveSess =
    input.liveWorkoutSession && typeof input.liveWorkoutSession === 'object'
      ? (input.liveWorkoutSession as Record<string, unknown>)
      : null

  if (!programSess || !liveSess) {
    return {
      version: 'phase-4q-live-workout-source-map-v1',
      programDisplaySessionId: null,
      liveWorkoutSessionId: null,
      selectedVariantPreserved: false,
      methodStructuresPreserved: false,
      styledGroupsPreserved: false,
      rowLevelMethodsPreserved: false,
      rowLevelMutatorSummaryPreserved: false,
      doctrineParticipationPreserved: false,
      doctrineBlockResolutionPreserved: false,
      verdict: 'LIVE_NOT_LAUNCHED_YET',
      liveGroupedRuntimeVerdict: 'STRAIGHT_SETS_ONLY_NO_GROUPS',
      liveGroupedRuntimeReasons: ['NO_GROUPED_METHODS_PRESENT'],
      liveGroupedRuntimeSource: 'flatRows',
      liveGroupedRuntimeHasExecutableBlocks: false,
      warnings: ['program or live session missing'],
    }
  }

  // Extract program-side truth
  const programMethodStructures = safeIsArray(programSess.methodStructures)
    ? (programSess.methodStructures as unknown[])
    : []
  const programStyleMeta = (programSess.styleMetadata ?? null) as
    | { styledGroups?: unknown }
    | null
  const programStyledGroups = safeIsArray(programStyleMeta?.styledGroups)
    ? (programStyleMeta!.styledGroups as unknown[])
    : []
  const programRowLevel = inspectRowLevelMethods([programSess as SessionLike])
  const programHasMutatorSummary =
    programSess.rowLevelMutatorSummary && typeof programSess.rowLevelMutatorSummary === 'object'

  // Extract live-side truth
  const liveMethodStructures = safeIsArray(liveSess.methodStructures)
    ? (liveSess.methodStructures as unknown[])
    : []
  const liveStyleMeta = (liveSess.styleMetadata ?? null) as
    | { styledGroups?: unknown }
    | null
  const liveStyledGroups = safeIsArray(liveStyleMeta?.styledGroups)
    ? (liveStyleMeta!.styledGroups as unknown[])
    : []
  const liveRowLevel = inspectRowLevelMethods([liveSess as SessionLike])
  const liveHasMutatorSummary =
    liveSess.rowLevelMutatorSummary && typeof liveSess.rowLevelMutatorSummary === 'object'

  // Per-field preservation
  const methodStructuresPreserved =
    programMethodStructures.length === 0 ||
    liveMethodStructures.length >= programMethodStructures.length
  const styledGroupsPreserved =
    programStyledGroups.length === 0 || liveStyledGroups.length >= programStyledGroups.length
  const rowLevelMethodsPreserved =
    programRowLevel.totalRowLevelMethodFields === 0 ||
    liveRowLevel.totalRowLevelMethodFields >= programRowLevel.totalRowLevelMethodFields
  const rowLevelMutatorSummaryPreserved =
    !programHasMutatorSummary || !!liveHasMutatorSummary
  const doctrineParticipationPreserved =
    !programSess.doctrineParticipation || !!liveSess.doctrineParticipation
  const doctrineBlockResolutionPreserved =
    !programSess.doctrineBlockResolution || !!liveSess.doctrineBlockResolution

  const selectedVariantPreserved =
    !input.selectedVariantKey ||
    !input.liveSelectedVariantKey ||
    input.selectedVariantKey === input.liveSelectedVariantKey

  // Verdict
  let verdict: LiveWorkoutSourceMap['verdict']
  if (input.staleSourceUsed === true) {
    verdict = 'LIVE_PARITY_BROKEN_STALE_SOURCE'
    warnings.push('live workout corridor used a stale source')
  } else if (!selectedVariantPreserved) {
    verdict = 'LIVE_PARITY_BROKEN_SELECTED_VARIANT'
    warnings.push(
      `selected variant mismatch: program=${input.selectedVariantKey} live=${input.liveSelectedVariantKey}`,
    )
  } else if (
    methodStructuresPreserved &&
    styledGroupsPreserved &&
    rowLevelMethodsPreserved &&
    rowLevelMutatorSummaryPreserved
  ) {
    verdict = 'LIVE_PARITY_CONFIRMED'
  } else if (
    // styledGroups preserved but methodStructures dropped → guidance survives.
    styledGroupsPreserved &&
    !methodStructuresPreserved
  ) {
    verdict = 'LIVE_GUIDANCE_PRESERVED_ONLY'
    warnings.push(
      'styledGroups preserved but methodStructures stripped by live normalizer',
    )
  } else {
    verdict = 'LIVE_PARITY_BROKEN_NORMALIZER'
    if (!methodStructuresPreserved) warnings.push('methodStructures stripped by live normalizer')
    if (!styledGroupsPreserved) warnings.push('styleMetadata.styledGroups stripped by live normalizer')
    if (!rowLevelMethodsPreserved) warnings.push('row-level method fields stripped by live normalizer')
    if (!rowLevelMutatorSummaryPreserved)
      warnings.push('rowLevelMutatorSummary stripped by live normalizer')
  }

  // [PHASE 4Y] H.H5 — runtime parity verdict. The data-preservation `verdict`
  // above only proves methodStructures/styledGroups survived; this verdict
  // proves the live runtime will actually consume them as interactive grouped
  // sequences (FULL_GROUPED_RUNTIME) or honestly states why it cannot
  // (LIVE_GUIDANCE_PRESERVED_ONLY / GROUPED_RUNTIME_BLOCKED /
  // GROUPED_RUNTIME_PARTIAL / STRAIGHT_SETS_ONLY_NO_GROUPS).
  //
  // We pass `styledGroupsAcceptedAsExecutionSource: undefined` because the
  // source-map runs from outside the live component and cannot know whether
  // StreamlinedWorkoutSession's shadow-owner guard accepted styledGroups in
  // this particular boot. The evaluator falls back to methodStructures-first
  // analysis, which is exactly what we want: the verdict reflects the safest
  // possible runtime grouping that the canonical session truth can guarantee.
  const liveGroupedExec = evaluateLiveGroupedExecution({
    session: liveSess as Parameters<typeof evaluateLiveGroupedExecution>[0]['session'],
  })

  return {
    version: 'phase-4q-live-workout-source-map-v1',
    programDisplaySessionId:
      typeof programSess.id === 'string' ? (programSess.id as string) : null,
    liveWorkoutSessionId: typeof liveSess.id === 'string' ? (liveSess.id as string) : null,
    selectedVariantPreserved,
    methodStructuresPreserved,
    styledGroupsPreserved,
    rowLevelMethodsPreserved,
    rowLevelMutatorSummaryPreserved,
    doctrineParticipationPreserved,
    doctrineBlockResolutionPreserved,
    verdict,
    liveGroupedRuntimeVerdict: liveGroupedExec.parityVerdict,
    liveGroupedRuntimeReasons: liveGroupedExec.reasons,
    liveGroupedRuntimeSource: liveGroupedExec.source,
    liveGroupedRuntimeHasExecutableBlocks: liveGroupedExec.hasExecutableGroupedBlocks,
    warnings,
  }
}
