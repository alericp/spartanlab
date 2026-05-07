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

// =============================================================================
// [PHASE E.E4.1] METHOD-AWARE COMPOSITION RECEIPT
// =============================================================================
//
// This receipt proves whether a session achieved multi-structure composition
// (multiple different method families applied) or remained single-structure /
// straight-sets, and WHY. The corridor computes this after processing all
// families; the receipt travels through the session object to the display layer.
//
// Multi-structure composition means: more than one STRUCTURAL family (superset,
// circuit, density_block) was applied to separate exercise subsets in the same
// session. This is athlete-realistic only when safety gates allow it.
// =============================================================================

export type CompositionMode =
  | 'multi_structure_applied'      // 2+ different structural families applied
  | 'single_structure_applied'     // exactly 1 structural family applied
  | 'straight_sets_intentional'    // no structural families applied (safe)
  | 'straight_sets_by_safety'      // multi-structure blocked by safety
  | 'row_methods_only'             // only row-level methods, no grouped structures

export type CompositionStatus =
  | 'MULTI_STRUCTURE'
  | 'SINGLE_STRUCTURE'
  | 'STRAIGHT_SETS'
  | 'ROW_METHODS_ONLY'
  | 'NOT_EVALUATED'

/**
 * Method-aware composition receipt — proves what composition mode was achieved
 * and why. Attached to `session.methodAwareCompositionReceipt` by the corridor.
 */
export interface MethodAwareCompositionReceipt {
  /** Overall status for quick branching */
  status: CompositionStatus
  /** Detailed mode describing the composition outcome */
  compositionMode: CompositionMode
  /** Structural families that were applied (superset/circuit/density_block) */
  structuralFamiliesApplied: CanonicalMethodFamily[]
  /** Structural families that were suppressed/blocked */
  structuralFamiliesSuppressed: CanonicalMethodFamily[]
  /** Row-level families that were applied (top_set/drop_set/etc) */
  rowFamiliesApplied: CanonicalMethodFamily[]
  /** Total count of distinct structural families applied */
  distinctStructuralCount: number
  /** Exercise IDs affected by multi-structure composition */
  affectedExerciseIds: string[]
  /** Exercise names affected (for display) */
  affectedExerciseNames: string[]
  /** Primary structure if single-structure mode */
  primaryStructure: CanonicalMethodFamily | null
  /** Safety reasons that suppressed multi-structure */
  safetyBlockReasons: string[]
  /** Whether primary skill block was preserved */
  primarySkillPreserved: boolean
  /** Whether session length cap constrained composition */
  sessionLengthConstrained: boolean
  /** Short coach-like line for display */
  coachLine: string
  /** Detailed reason codes for audit */
  reasonCodes: string[]
  /** Source path for verification */
  visibleProofPath: 'session.methodAwareCompositionReceipt'
}

/**
 * Build a composition receipt from the methodStructures array.
 * Pure function — never mutates input.
 */
export function buildMethodAwareCompositionReceipt(
  methodStructures: CanonicalMethodStructure[],
): MethodAwareCompositionReceipt {
  const STRUCTURAL_FAMILIES: CanonicalMethodFamily[] = ['superset', 'circuit', 'density_block']
  const ROW_FAMILIES: CanonicalMethodFamily[] = ['top_set', 'drop_set', 'rest_pause', 'cluster', 'endurance_density']

  // Count applied vs suppressed structural families
  const appliedStructural = new Set<CanonicalMethodFamily>()
  const suppressedStructural = new Set<CanonicalMethodFamily>()
  const appliedRow = new Set<CanonicalMethodFamily>()
  const affectedIds = new Set<string>()
  const affectedNames = new Set<string>()
  const safetyReasons: string[] = []

  for (const ms of methodStructures) {
    if (ms.status === 'applied' || ms.status === 'already_applied') {
      if (STRUCTURAL_FAMILIES.includes(ms.family)) {
        appliedStructural.add(ms.family)
        for (const id of ms.exerciseIds) affectedIds.add(id)
        for (const name of ms.exerciseNames) affectedNames.add(name)
      } else if (ROW_FAMILIES.includes(ms.family)) {
        appliedRow.add(ms.family)
      }
    } else if (ms.status === 'blocked' || ms.status === 'no_safe_target') {
      if (STRUCTURAL_FAMILIES.includes(ms.family)) {
        suppressedStructural.add(ms.family)
        if (ms.safetyGatesFailed.length > 0) {
          safetyReasons.push(...ms.safetyGatesFailed)
        }
        if (ms.reason) {
          safetyReasons.push(ms.reason)
        }
      }
    }
  }

  const structuralAppliedArr = Array.from(appliedStructural)
  const structuralSuppressedArr = Array.from(suppressedStructural)
  const rowAppliedArr = Array.from(appliedRow)
  const distinctStructuralCount = structuralAppliedArr.length

  // Determine composition mode
  let compositionMode: CompositionMode
  let status: CompositionStatus
  let coachLine: string
  const reasonCodes: string[] = []

  if (distinctStructuralCount >= 2) {
    compositionMode = 'multi_structure_applied'
    status = 'MULTI_STRUCTURE'
    const labels = structuralAppliedArr.map(f => familyLabel(f)).join(' + ')
    coachLine = `Multi-structure session: ${labels} applied to separate exercise blocks.`
    reasonCodes.push('multi_structure_achieved', ...structuralAppliedArr.map(f => `structural_${f}_applied`))
  } else if (distinctStructuralCount === 1) {
    compositionMode = 'single_structure_applied'
    status = 'SINGLE_STRUCTURE'
    const label = familyLabel(structuralAppliedArr[0])
    if (structuralSuppressedArr.length > 0) {
      coachLine = `${label} applied; other structures suppressed for safety.`
      reasonCodes.push('single_structure_with_suppression', `structural_${structuralAppliedArr[0]}_applied`)
    } else {
      coachLine = `${label} applied to accessory block.`
      reasonCodes.push('single_structure_clean', `structural_${structuralAppliedArr[0]}_applied`)
    }
  } else if (rowAppliedArr.length > 0) {
    compositionMode = 'row_methods_only'
    status = 'ROW_METHODS_ONLY'
    coachLine = 'Row-level methods applied; grouped structures not needed today.'
    reasonCodes.push('row_methods_only', ...rowAppliedArr.map(f => `row_${f}_applied`))
  } else if (safetyReasons.length > 0) {
    compositionMode = 'straight_sets_by_safety'
    status = 'STRAIGHT_SETS'
    coachLine = 'Straight sets kept — safety gates blocked grouped structures.'
    reasonCodes.push('straight_sets_by_safety', ...structuralSuppressedArr.map(f => `structural_${f}_blocked`))
  } else {
    compositionMode = 'straight_sets_intentional'
    status = 'STRAIGHT_SETS'
    coachLine = 'Straight sets — focused quality work without method complexity.'
    reasonCodes.push('straight_sets_intentional')
  }

  return {
    status,
    compositionMode,
    structuralFamiliesApplied: structuralAppliedArr,
    structuralFamiliesSuppressed: structuralSuppressedArr,
    rowFamiliesApplied: rowAppliedArr,
    distinctStructuralCount,
    affectedExerciseIds: Array.from(affectedIds),
    affectedExerciseNames: Array.from(affectedNames),
    primaryStructure: structuralAppliedArr.length > 0 ? structuralAppliedArr[0] : null,
    safetyBlockReasons: [...new Set(safetyReasons)].slice(0, 5),
    primarySkillPreserved: true, // corridor already enforces this
    sessionLengthConstrained: safetyReasons.some(r => r.includes('length') || r.includes('cap')),
    coachLine,
    reasonCodes,
    visibleProofPath: 'session.methodAwareCompositionReceipt',
  }
}

/**
 * Type guard for methodAwareCompositionReceipt from unknown JSON.
 */
export function coerceCompositionReceipt(raw: unknown): MethodAwareCompositionReceipt | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.status !== 'string' || typeof r.compositionMode !== 'string') return null
  if (typeof r.coachLine !== 'string') return null
  return raw as MethodAwareCompositionReceipt
}
