/**
 * =============================================================================
 * [PHASE 4P] CANONICAL METHOD STRUCTURE CONTRACT
 * =============================================================================
 *
 * One JSON-safe shape that describes EVERY doctrine/method that ended up in a
 * generated session — whether emitted by the adaptive builder, the row-level
 * corridor, or the structural materialization corridor.
 *
 * Why this exists:
 *   Pre-Phase-4P, structural methods (superset / circuit / density_block /
 *   cluster) lived only on `session.styleMetadata.styledGroups`, while
 *   row-level methods (top_set / drop_set / rest_pause / endurance_density /
 *   prescription_rest / prescription_rpe) lived only on
 *   `exercise.setExecutionMethod` + `exercise.doctrineApplicationDeltas[]`.
 *   That split made it impossible to:
 *     - render one honest "Method structure" line on the Program page,
 *     - preserve the same truth into the live workout,
 *     - prove what was applied vs blocked vs not-needed for each family,
 *     - know which source (builder / corridor / structural) wrote each method.
 *
 *   `session.methodStructures: CanonicalMethodStructure[]` is the unified
 *   read-model. Existing fields (`styledGroups`, `blockId`, `setExecutionMethod`,
 *   `doctrineApplicationDeltas[]`) remain the writers and the legacy
 *   compatibility inputs. The new array is built by mirroring those existing
 *   writers into one shape — never replacing them.
 *
 * JSON-safe: every field is a primitive, array, or plain object. No Dates as
 * Date objects (only ISO strings). No functions. No class instances. This
 * survives JSON.stringify / structured-clone / Postgres jsonb.
 * =============================================================================
 */

export type CanonicalMethodFamily =
  | 'top_set'
  | 'backoff_sets'
  | 'drop_set'
  | 'rest_pause'
  | 'cluster'
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'endurance_density'
  | 'straight_sets'
  | 'prescription_rest'
  | 'prescription_rpe'

export type CanonicalMethodSource =
  | 'builder'
  | 'doctrine_application_corridor'
  | 'structural_method_materialization_corridor'

export type CanonicalMethodStatus =
  | 'applied'
  | 'already_applied'
  | 'blocked'
  | 'not_needed'
  | 'no_safe_target'
  | 'not_connected'
  | 'error'

/**
 * One method that affected (or was considered for) the session.
 *
 * - For grouped-structure families (superset / circuit / density_block):
 *     `exerciseIds` and `exerciseNames` list the members in display order.
 *     `targetExerciseId` is null because the entire block is the target.
 *
 * - For row-level families (top_set / drop_set / rest_pause / cluster /
 *   endurance_density / prescription_*):
 *     `exerciseIds` and `exerciseNames` contain a single entry —
 *     `targetExerciseId` is the exercise that owns the method.
 *
 * - For NOT_NEEDED / NO_SAFE_TARGET / BLOCKED entries, the arrays may be
 *   empty. `reason` always describes WHY the verdict is what it is.
 */
export interface CanonicalMethodStructure {
  /** Stable ID. For grouped: `method-{family}-day{n}-{idx}`. For row-level: `method-{family}-{exerciseId}`. */
  id: string
  family: CanonicalMethodFamily
  /** Visible label used in UI / proof lines. */
  label: string
  /** Which corridor stamped this entry. */
  source: CanonicalMethodSource
  status: CanonicalMethodStatus
  sessionId?: string
  dayNumber?: number
  exerciseIds: string[]
  exerciseNames: string[]
  targetExerciseId?: string
  targetExerciseName?: string
  /** Grouped-structure execution params. */
  rounds?: number
  timeCapMinutes?: number
  restBetweenExercisesSeconds?: number
  restBetweenRoundsSeconds?: number
  /** Compact one-line execution summary the live workout can read directly. */
  prescriptionSummary?: string
  /** Always populated. Plain English. */
  reason: string
  /** Doctrine rule IDs that earned this entry. */
  sourceRuleIds: string[]
  safetyGatesPassed: string[]
  safetyGatesFailed: string[]
  /** Where in the session/exercise tree the consumer can find the writer truth. */
  visibleProofPath: string
}

/**
 * Program-level rollup of every session's methodStructures.
 *
 * Shape is intentionally compact so the Program page can render one line:
 *   "Method structure: X applied · Y blocked · Z no safe target"
 *
 * The full per-family breakdown stays in `byFamily` for diagnostics.
 */
export interface MethodStructureRollup {
  version: 'phase-4p'
  sessionsProcessed: number
  totalApplied: number
  totalAlreadyApplied: number
  totalBlocked: number
  totalNotNeeded: number
  totalNoSafeTarget: number
  byFamily: Partial<Record<CanonicalMethodFamily, MethodStructureFamilyCounts>>
  finalVerdict:
    | 'STRUCTURAL_METHODS_APPLIED'
    | 'ROW_METHODS_ONLY_APPLIED'
    | 'EVALUATED_NO_SAFE_STRUCTURAL_METHODS'
    | 'METHOD_MATERIALIZATION_NOT_CONNECTED'
    | 'METHOD_MATERIALIZATION_ERROR'
  /** One representative applied entry per program — used for the compact line. */
  sampleProof: MethodStructureSampleProof | null
  visibleProofPath: 'program.methodStructureRollup'
}

export interface MethodStructureFamilyCounts {
  applied: number
  alreadyApplied: number
  blocked: number
  notNeeded: number
  noSafeTarget: number
}

export interface MethodStructureSampleProof {
  dayNumber: number
  family: CanonicalMethodFamily
  exerciseNames: string[]
  reason: string
  visibleProofPath: string
}

/**
 * Family counts initializer — guarantees every counter starts at 0 so callers
 * can `+= 1` without null checks.
 */
export function emptyFamilyCounts(): MethodStructureFamilyCounts {
  return { applied: 0, alreadyApplied: 0, blocked: 0, notNeeded: 0, noSafeTarget: 0 }
}

/**
 * Status → counter bucket mapping. Keeps the rollup honest:
 *   `applied` and `already_applied` are NOT merged because the user wants to
 *   know what THIS phase materialized vs what the builder already did.
 */
export function bumpFamilyCounts(
  counts: MethodStructureFamilyCounts,
  status: CanonicalMethodStatus,
): void {
  switch (status) {
    case 'applied':
      counts.applied += 1
      return
    case 'already_applied':
      counts.alreadyApplied += 1
      return
    case 'blocked':
      counts.blocked += 1
      return
    case 'not_needed':
      counts.notNeeded += 1
      return
    case 'no_safe_target':
      counts.noSafeTarget += 1
      return
    case 'not_connected':
    case 'error':
      // Not promoted into per-family counters. The program-level finalVerdict
      // surfaces these explicitly.
      return
  }
}

/**
 * Visible label for each family. Mirrors `GROUPED_METHOD_SEMANTICS.label` from
 * `components/programs/lib/session-group-display.ts` for grouped families so
 * UI and corridor agree on noun choice.
 */
export function familyLabel(family: CanonicalMethodFamily): string {
  switch (family) {
    case 'top_set': return 'Top Set'
    case 'backoff_sets': return 'Back-Off Sets'
    case 'drop_set': return 'Drop Set'
    case 'rest_pause': return 'Rest-Pause'
    case 'cluster': return 'Cluster Set'
    case 'superset': return 'Superset'
    case 'circuit': return 'Circuit'
    case 'density_block': return 'Density Block'
    case 'endurance_density': return 'Endurance Density'
    case 'straight_sets': return 'Straight Sets'
    case 'prescription_rest': return 'Rest Prescription'
    case 'prescription_rpe': return 'RPE Prescription'
  }
}

/**
 * Type guard — used by consumers reading legacy `methodStructures` arrays
 * persisted before this contract was finalized. Coerces unknown JSON into a
 * CanonicalMethodStructure or returns null.
 */
export function coerceMethodStructure(raw: unknown): CanonicalMethodStructure | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.family !== 'string') return null
  if (typeof r.status !== 'string' || typeof r.source !== 'string') return null
  return {
    id: r.id,
    family: r.family as CanonicalMethodFamily,
    label: typeof r.label === 'string' ? r.label : familyLabel(r.family as CanonicalMethodFamily),
    source: r.source as CanonicalMethodSource,
    status: r.status as CanonicalMethodStatus,
    sessionId: typeof r.sessionId === 'string' ? r.sessionId : undefined,
    dayNumber: typeof r.dayNumber === 'number' ? r.dayNumber : undefined,
    exerciseIds: Array.isArray(r.exerciseIds) ? r.exerciseIds.filter((x): x is string => typeof x === 'string') : [],
    exerciseNames: Array.isArray(r.exerciseNames) ? r.exerciseNames.filter((x): x is string => typeof x === 'string') : [],
    targetExerciseId: typeof r.targetExerciseId === 'string' ? r.targetExerciseId : undefined,
    targetExerciseName: typeof r.targetExerciseName === 'string' ? r.targetExerciseName : undefined,
    rounds: typeof r.rounds === 'number' ? r.rounds : undefined,
    timeCapMinutes: typeof r.timeCapMinutes === 'number' ? r.timeCapMinutes : undefined,
    restBetweenExercisesSeconds: typeof r.restBetweenExercisesSeconds === 'number' ? r.restBetweenExercisesSeconds : undefined,
    restBetweenRoundsSeconds: typeof r.restBetweenRoundsSeconds === 'number' ? r.restBetweenRoundsSeconds : undefined,
    prescriptionSummary: typeof r.prescriptionSummary === 'string' ? r.prescriptionSummary : undefined,
    reason: typeof r.reason === 'string' ? r.reason : '',
    sourceRuleIds: Array.isArray(r.sourceRuleIds) ? r.sourceRuleIds.filter((x): x is string => typeof x === 'string') : [],
    safetyGatesPassed: Array.isArray(r.safetyGatesPassed) ? r.safetyGatesPassed.filter((x): x is string => typeof x === 'string') : [],
    safetyGatesFailed: Array.isArray(r.safetyGatesFailed) ? r.safetyGatesFailed.filter((x): x is string => typeof x === 'string') : [],
    visibleProofPath: typeof r.visibleProofPath === 'string' ? r.visibleProofPath : '',
  }
}
