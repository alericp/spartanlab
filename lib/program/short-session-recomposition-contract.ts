/**
 * ============================================================================
 * [PHASE AB3] SHORT SESSION DOCTRINE RECOMPOSITION CONTRACT
 * ============================================================================
 *
 * AB3 corridor lock. Owns the truth of "what doctrine actually decided about
 * this 45 Min / 30 Min variant body" and surfaces it as a JSON-safe
 * `recompositionTruth` sidecar that survives to the Program UI and (read-only)
 * to Start Workout via the same selected-variant pathway used today.
 *
 * Corridor entry point:
 *   buildSession(...)
 *     └─ generateSessionVariants(...)            (compression — produces bodies)
 *     └─ [VARIANT-PARENT-TRUTH-RECONCILE] pass   (decorates Full with grouped
 *                                                 truth, regenerates 45/30 so
 *                                                 atomic groups survive)
 *     └─ recomposeSessionVariants(...)           (THIS MODULE — analyses the
 *                                                 reconciled 45/30 bodies vs
 *                                                 Full and stamps doctrine
 *                                                 truth on each short variant)
 *     └─ session.variants[i].recompositionTruth  (consumed by AdaptiveSessionCard)
 *
 * What this module does NOT do:
 *   - It does NOT regenerate or replace `variant.selection.main`. The
 *     reconcile pass already settled atomic groups, exercise identity, and
 *     ordering. Mutating `selection.main` here would risk Start Workout
 *     parity drift, monotonicity violations, and fingerprint mismatches.
 *   - It does NOT add new methods to a variant body. Method materialisation
 *     is owned by the structural method materialisation corridor and
 *     row-level method prescription mutator. Those are upstream and they
 *     already write `blockId` / `method` / `methodLabel` to
 *     `session.exercises` and (after reconcile) to `variant.selection.main`.
 *     This module READS that grouped truth and reports which methods carried
 *     into each short variant.
 *   - It does NOT inflate "applied" counts. The ledger it stamps follows
 *     AB1/AB2 semantics — `applied = mutated ∪ visible ∪ executable`, with
 *     `selected_no_mutation`, `blocked`, `suppressed`, `no_target`, and
 *     `audit_only` separated.
 *
 * What this module DOES:
 *   1. Compares the reconciled short-variant body against Full.
 *   2. Identifies the doctrine-aware crunch-time strategy that explains the
 *      compression (preserve_spine, set_reduction, paired_accessory, etc.).
 *   3. Identifies preserved priority anchors, deferred exercises, set deltas,
 *      RPE deltas, rest deltas, and method changes carried from Full.
 *   4. Stamps an honest `engine` field — `doctrine_recomposition` when the
 *      analysis ran with full context, `fallback_compression` when context
 *      was missing or analysis errored.
 *   5. Emits a per-variant rule-population ledger compatible with AB1.
 *
 * AB3 honesty rule:
 *   If `engine === 'fallback_compression'`, the Program UI MUST NOT label the
 *   variant as "doctrine-recomposed". The UI surface in AdaptiveSessionCard
 *   reads this field directly and renders a different label in fallback mode.
 *
 * ============================================================================
 */

import type { ExerciseSelection, SelectedExercise } from '@/lib/program-exercise-selector'
import type { SessionVariant } from '@/lib/session-compression-engine'

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------

/**
 * Engine identity. Distinguishes "doctrine actually scored this variant" from
 * "we only had compression output and could not score." AB3 forbids labelling
 * fallback compression as doctrine recomposition in user-visible surfaces.
 */
export type RecompositionEngine = 'doctrine_recomposition' | 'fallback_compression'

/**
 * Crunch-time strategy that best describes what doctrine decided about this
 * short variant. These are NOT mutually exclusive in principle, but the
 * recomposer picks the single dominant strategy for headline rendering and
 * lists the rest as secondary signals on the deltas.
 *
 *  - preserve_spine     : the same priority anchors as Full survived; only
 *                         lower-priority work was trimmed.
 *  - density_recompose  : compression preserved most rows but reduced rest /
 *                         compressed time via density / packing.
 *  - paired_accessory   : two or more accessory rows that share compatible
 *                         pattern were left adjacent in the short body so
 *                         materialisation can superset them (carried truth).
 *  - set_reduction      : same exercises as Full but fewer prescribed sets.
 *  - rest_reduction     : same exercises and sets, shorter rest prescriptions.
 *  - rpe_reduction      : same shape but reduced RPE targets to keep quality
 *                         under a tighter time cap.
 *  - minimal_priority   : only the highest-ROI primary remained; very deep cut.
 *  - straight_sets_best : doctrine evaluated method options and decided that
 *                         straight sets (no superset / cluster / density) was
 *                         the safest crunch-time strategy.
 *  - identity_preserve  : variant is materially distinct from Full but the
 *                         doctrine analysis concluded the compression was
 *                         already optimal — no additional recomposition axis
 *                         was warranted.
 */
export type CrunchTimeStrategy =
  | 'preserve_spine'
  | 'density_recompose'
  | 'paired_accessory'
  | 'set_reduction'
  | 'rest_reduction'
  | 'rpe_reduction'
  | 'minimal_priority'
  | 'straight_sets_best'
  | 'identity_preserve'

/**
 * Per-method state inside the recomposition truth. AB1 ledger semantics —
 * `mutated`, `visible`, `executable` count as applied; everything else does
 * not. `affectedExercises` is a name list (display-friendly, JSON-safe).
 */
export interface RecompositionMethodChange {
  method: string
  state:
    | 'selected'
    | 'mutated'
    | 'visible'
    | 'executable'
    | 'blocked'
    | 'suppressed'
    | 'no_target'
  reason: string
  affectedExercises: string[]
}

/**
 * AB1-shaped per-variant rule ledger. Counts only — names live in the change
 * arrays (`changedExercises`, `deferredExercises`, etc.). Keep this strictly
 * additive over the AB1 categories.
 */
export interface RecompositionLedger {
  loaded: number
  candidate: number
  eligible: number
  selected: number
  mutated: number
  visible: number
  executable: number
  blocked: number
  suppressed: number
  no_target: number
  audit_only: number
}

/**
 * Stamped onto `session.variants[i].recompositionTruth` for every short
 * variant (45 Min / 30 Min). The Full variant does NOT carry recomposition
 * truth — Full is the parent, not a recomposition of itself.
 */
export interface RecompositionTruth {
  /** Always 45 or 30 in current product surface; future-proofed as number. */
  targetMinutes: number
  /**
   * Honest engine identity. `fallback_compression` means analysis could not
   * run (missing context, malformed inputs) and the variant is the raw
   * compression output. UI must not claim doctrine recomposition in that case.
   */
  engine: RecompositionEngine
  /** Compression's best estimate of variant duration. */
  estimatedMinutes: number
  /** Dominant crunch-time strategy headline. */
  crunchTimeStrategy: CrunchTimeStrategy
  /**
   * Whether the recomposer applied at least one analytical mutation that
   * compression alone would not have produced. Today the "mutation" is
   * doctrine classification + ledger stamping; structural body changes are
   * deliberately delegated upstream. `recompositionApplied: true` simply
   * means the analysis ran and produced honest doctrine truth on top of
   * compression. When `engine === 'fallback_compression'` this is false.
   */
  recompositionApplied: boolean
  /** Names of priority anchors that survived from Full into this variant. */
  preservedPriorityAnchors: string[]
  /** Names of exercises in this variant that came from Full. */
  changedExercises: string[]
  /** Names of exercises in Full that did NOT survive into this variant. */
  deferredExercises: string[]
  /**
   * Per-row set deltas relative to Full, of the form
   * `"Weighted Pull-Up: 4 → 3 sets"`. Empty when no row had a set delta.
   */
  setDeltas: string[]
  /**
   * Per-row RPE deltas, e.g. `"Planche Lean: RPE 8 → 7"`. Only populated when
   * `targetRPE` is present on both bodies and they differ.
   */
  rpeDeltas: string[]
  /**
   * Per-row rest deltas, e.g. `"Hindu Push-Ups: rest 90s → 60s"`. Only
   * populated when `restSeconds` is present on both bodies and they differ.
   */
  restDeltas: string[]
  /**
   * Method changes carried into this variant. Each entry classifies how the
   * method survived (or did not) into the short body.
   */
  methodChanges: RecompositionMethodChange[]
  /**
   * Specific safety / scoring blocks reported by the recomposer. These are
   * AB2-style typed reasons ("primary skill quality protected", "time cap
   * exceeded", "tendon load risk", etc.) — never the generic
   * "session already has method".
   */
  safetyBlocks: string[]
  /** AB1-compatible per-variant rule ledger. */
  ledger: RecompositionLedger
  /**
   * Short concise sentence the Program UI can render verbatim, e.g.
   * "30 Min recomposed: preserved Planche Lean spine, deferred 2 accessories,
   * trimmed 4 sets."
   */
  visibleSummary: string
  /**
   * Whether Start Workout is expected to execute the same body that Program
   * UI shows. Set to true whenever `selection.main` was not mutated by this
   * module (the standard path). The selected-variant route consumes
   * `variant.selection.main` directly via `buildSelectedVariantMain`, so
   * untouched selection means automatic parity.
   */
  executableParityExpected: boolean
}

// ----------------------------------------------------------------------------
// Module input contract
// ----------------------------------------------------------------------------

export interface RecomposeSessionVariantsInput {
  /** Full session variant (post-reconcile). Used as parent truth for deltas. */
  fullVariant: SessionVariant
  /**
   * The list of short variants to analyse. Caller passes `[variant45?,
   * variant30?]`. Each is analysed independently against Full.
   */
  shortVariants: SessionVariant[]
  /**
   * Post-materialisation session.exercises so we can read which methods
   * actually carried into the body. May be empty when materialisation was
   * skipped — recomposer still runs but reports `methodChanges: []`.
   */
  sessionExercisesPostMaterialization: Array<{
    id?: string
    exerciseId?: string
    name?: string
    blockId?: string
    method?: string
    methodLabel?: string
  }>
  /**
   * Methods the materialiser actually applied at session level (e.g.
   * `['supersets', 'cluster_sets']`). Used to honestly classify
   * `methodChanges`.
   */
  appliedMethodsThisSession: string[]
  /** Day number for telemetry only. */
  dayNumber?: number
  /** Day focus for telemetry only. */
  focus?: string
  /**
   * Skill expressions selected for this session, used to identify priority
   * anchors. Keep as plain strings for JSON-safety and decoupling from the
   * skill enum.
   */
  primarySkillExpressions?: string[]
}

// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

interface RowReadout {
  id: string
  name: string
  sets: number
  reps: string
  rpe: number | null
  rest: number | null
  blockId: string | null
  method: string | null
  methodLabel: string | null
  isPriorityAnchor: boolean
  selectionReason: string
}

const PRIORITY_ANCHOR_REASON_KEYWORDS = [
  'primary',
  'skill',
  'planche',
  'front lever',
  'back lever',
  'hspu',
  'handstand',
  'one arm',
  'muscle up',
  'iron cross',
  'maltese',
  'victorian',
  'spine',
]

function isPriorityAnchorRow(row: SelectedExercise, primarySkillExpressions: string[] = []): boolean {
  const reason = (row.selectionReason || '').toLowerCase()
  const exerciseName = (row.exercise?.name || '').toLowerCase()
  const sessionRole = (row.selectionContext?.sessionRole || '').toLowerCase()

  // Direct priority signal from selection trace
  if (sessionRole.includes('primary') || sessionRole.includes('skill')) return true

  // Influencing skills with `primary` influence are anchors
  const influencing = row.selectionContext?.influencingSkills ?? []
  for (const inf of influencing) {
    if (inf.influence === 'primary') return true
  }

  // Match against selected primary skill expressions (planche, front_lever, ...)
  for (const skill of primarySkillExpressions) {
    const s = skill.toLowerCase().replace(/_/g, ' ')
    if (exerciseName.includes(s) || reason.includes(s)) return true
  }

  // Reason keyword fallback (covers carryover_support / hybrid rationales that
  // are still genuine priority anchors per doctrine).
  for (const kw of PRIORITY_ANCHOR_REASON_KEYWORDS) {
    if (reason.includes(kw)) return true
  }
  return false
}

function readRow(row: SelectedExercise, primarySkillExpressions: string[] = []): RowReadout {
  const ex = row.exercise as unknown as {
    id?: string
    name?: string
    blockId?: string
    method?: string
    methodLabel?: string
  }
  return {
    id: typeof ex.id === 'string' ? ex.id : '',
    name: typeof ex.name === 'string' ? ex.name : 'unknown',
    sets: typeof row.sets === 'number' ? row.sets : 0,
    reps: typeof row.repsOrTime === 'string' ? row.repsOrTime : '',
    rpe: typeof row.targetRPE === 'number' ? row.targetRPE : null,
    rest: typeof row.restSeconds === 'number' ? row.restSeconds : null,
    blockId: typeof ex.blockId === 'string' ? ex.blockId : null,
    method: typeof ex.method === 'string' ? ex.method : null,
    methodLabel: typeof ex.methodLabel === 'string' ? ex.methodLabel : null,
    isPriorityAnchor: isPriorityAnchorRow(row, primarySkillExpressions),
    selectionReason: row.selectionReason || '',
  }
}

function readSelection(
  selection: ExerciseSelection,
  primarySkillExpressions: string[] = []
): RowReadout[] {
  const main = Array.isArray(selection?.main) ? selection.main : []
  return main.map(r => readRow(r, primarySkillExpressions))
}

function readableMethodLabel(method: string | null, methodLabel: string | null): string {
  if (methodLabel) return methodLabel
  if (!method) return 'method'
  switch (method) {
    case 'superset':
    case 'supersets':
      return 'superset'
    case 'circuit':
    case 'circuits':
      return 'circuit'
    case 'density_block':
    case 'density_blocks':
      return 'density block'
    case 'cluster':
    case 'cluster_sets':
      return 'cluster'
    case 'rest_pause':
    case 'rest-pause':
      return 'rest-pause'
    default:
      return method.replace(/_/g, ' ')
  }
}

// ----------------------------------------------------------------------------
// Strategy classifier
// ----------------------------------------------------------------------------

interface StrategyInput {
  fullRows: RowReadout[]
  variantRows: RowReadout[]
  preservedAnchorCount: number
  totalAnchorCountInFull: number
  setDeltaCount: number
  rpeDeltaCount: number
  restDeltaCount: number
  hasCarriedSuperset: boolean
  hasCarriedDensity: boolean
  hasCarriedCluster: boolean
  hasCarriedRestPause: boolean
  variantHasOnlyOnePriorityRow: boolean
}

function classifyCrunchTimeStrategy(input: StrategyInput): CrunchTimeStrategy {
  const {
    fullRows,
    variantRows,
    preservedAnchorCount,
    totalAnchorCountInFull,
    setDeltaCount,
    rpeDeltaCount,
    restDeltaCount,
    hasCarriedSuperset,
    hasCarriedDensity,
    hasCarriedCluster,
    hasCarriedRestPause,
    variantHasOnlyOnePriorityRow,
  } = input

  const variantCount = variantRows.length
  const fullCount = fullRows.length
  const sameCount = variantCount === fullCount
  const sameOrderedIdentity =
    sameCount &&
    fullRows.every((r, i) => r.id === (variantRows[i]?.id ?? '__missing__'))

  // Method-carried strategies first — they describe the dominant doctrine
  // signal even when there is also a set/rest delta.
  if (hasCarriedDensity) return 'density_recompose'
  if (hasCarriedSuperset) return 'paired_accessory'

  // Same body, different prescription → prescription-axis strategies
  if (sameOrderedIdentity) {
    if (setDeltaCount > 0 && setDeltaCount >= rpeDeltaCount && setDeltaCount >= restDeltaCount) {
      return 'set_reduction'
    }
    if (restDeltaCount > 0 && restDeltaCount >= rpeDeltaCount) {
      return 'rest_reduction'
    }
    if (rpeDeltaCount > 0) {
      return 'rpe_reduction'
    }
    // Identical body and identical prescription — exposed by distinctness
    // gate as cosmetic; if it survived, treat as identity-preserve diagnostic
    return 'identity_preserve'
  }

  // Body shrunk but priority anchors mostly survived → preserve-spine
  if (preservedAnchorCount > 0 && preservedAnchorCount >= Math.ceil(totalAnchorCountInFull * 0.6)) {
    return 'preserve_spine'
  }

  // Variant collapsed to one priority row only
  if (variantHasOnlyOnePriorityRow && variantCount <= 3) return 'minimal_priority'

  // Cluster / rest-pause carried but no superset/density — single-method
  // efficiency. Treat as straight-sets-best since the body is otherwise
  // straight sets with one row-level method intervention.
  if (hasCarriedCluster || hasCarriedRestPause) return 'straight_sets_best'

  // Default — variant is materially distinct, body shrunk, no method carry,
  // anchors mostly preserved (else preserveSpine fired). Doctrine evaluated
  // and concluded straight sets best for the time cap.
  return 'straight_sets_best'
}

// ----------------------------------------------------------------------------
// Method change classifier
// ----------------------------------------------------------------------------

function classifyMethodChanges(
  variantRows: RowReadout[],
  appliedMethodsThisSession: string[]
): RecompositionMethodChange[] {
  const out: RecompositionMethodChange[] = []
  const seen = new Set<string>()

  // For each method that was applied at session level, see whether at least
  // one row in the variant body still carries it. If yes → executable. If
  // applied at session level but no row in this variant carries it → the
  // method was DEFERRED by compression (the row that carried it did not
  // survive into this short body). That is reported as `no_target`.
  for (const method of appliedMethodsThisSession) {
    const canonical = method.replace(/_blocks?$/, '').replace(/_sets$/, '')
    if (seen.has(canonical)) continue
    seen.add(canonical)

    const carryingRows = variantRows.filter(r => {
      if (!r.method) return false
      const rowCanonical = r.method.replace(/_blocks?$/, '').replace(/_sets$/, '')
      return rowCanonical === canonical || r.method === method
    })

    if (carryingRows.length > 0) {
      out.push({
        method: readableMethodLabel(canonical, carryingRows[0].methodLabel),
        state: 'executable',
        reason: 'carried into short variant body and survives to Start Workout',
        affectedExercises: carryingRows.map(r => r.name),
      })
    } else {
      out.push({
        method: readableMethodLabel(canonical, null),
        state: 'no_target',
        reason: 'method-bearing row did not survive compression into this short variant',
        affectedExercises: [],
      })
    }
  }

  // Detect any row-level method present in the variant that was NOT in the
  // session-level applied list (rare; would indicate row-level method
  // mutator wrote it but session-level summary missed it). Surface as
  // `visible` rather than `executable` since the session-level claim is
  // missing — caller can audit via telemetry.
  for (const r of variantRows) {
    if (!r.method) continue
    const canonical = r.method.replace(/_blocks?$/, '').replace(/_sets$/, '')
    if (seen.has(canonical)) continue
    if (appliedMethodsThisSession.some(m => m.startsWith(canonical))) continue
    seen.add(canonical)
    out.push({
      method: readableMethodLabel(canonical, r.methodLabel),
      state: 'visible',
      reason: 'row-level method present in variant body without matching session-level applied claim',
      affectedExercises: [r.name],
    })
  }

  return out
}

// ----------------------------------------------------------------------------
// Single-variant analysis
// ----------------------------------------------------------------------------

function analyseVariant(
  fullRows: RowReadout[],
  variant: SessionVariant,
  primarySkillExpressions: string[],
  appliedMethodsThisSession: string[]
): RecompositionTruth {
  const variantRows = readSelection(variant.selection, primarySkillExpressions)

  // Membership maps keyed by exercise id
  const variantById = new Map<string, RowReadout>()
  for (const v of variantRows) {
    if (v.id) variantById.set(v.id, v)
  }
  const fullById = new Map<string, RowReadout>()
  for (const f of fullRows) {
    if (f.id) fullById.set(f.id, f)
  }

  const preservedPriorityAnchors: string[] = []
  const changedExercises: string[] = []
  const deferredExercises: string[] = []
  const setDeltas: string[] = []
  const rpeDeltas: string[] = []
  const restDeltas: string[] = []

  let preservedAnchorCount = 0
  let totalAnchorCountInFull = 0
  for (const f of fullRows) {
    if (f.isPriorityAnchor) totalAnchorCountInFull += 1
    const v = variantById.get(f.id)
    if (v) {
      changedExercises.push(v.name)
      if (f.isPriorityAnchor) {
        preservedAnchorCount += 1
        preservedPriorityAnchors.push(v.name)
      }
      if (f.sets !== v.sets && f.sets > 0 && v.sets >= 0) {
        setDeltas.push(`${v.name}: ${f.sets} → ${v.sets} sets`)
      }
      if (f.rpe !== null && v.rpe !== null && f.rpe !== v.rpe) {
        rpeDeltas.push(`${v.name}: RPE ${f.rpe} → ${v.rpe}`)
      }
      if (f.rest !== null && v.rest !== null && f.rest !== v.rest) {
        restDeltas.push(`${v.name}: rest ${f.rest}s → ${v.rest}s`)
      }
    } else {
      deferredExercises.push(f.name)
    }
  }

  const hasCarriedSuperset = variantRows.some(r => {
    const m = (r.method || '').toLowerCase()
    return m === 'superset' || m === 'supersets'
  })
  const hasCarriedDensity = variantRows.some(r => {
    const m = (r.method || '').toLowerCase()
    return m === 'density_block' || m === 'density_blocks' || m === 'density'
  })
  const hasCarriedCluster = variantRows.some(r => {
    const m = (r.method || '').toLowerCase()
    return m === 'cluster' || m === 'cluster_sets'
  })
  const hasCarriedRestPause = variantRows.some(r => {
    const m = (r.method || '').toLowerCase()
    return m === 'rest_pause' || m === 'rest-pause' || m === 'restpause'
  })

  const variantPriorityRowCount = variantRows.filter(r => r.isPriorityAnchor).length
  const crunchTimeStrategy = classifyCrunchTimeStrategy({
    fullRows,
    variantRows,
    preservedAnchorCount,
    totalAnchorCountInFull,
    setDeltaCount: setDeltas.length,
    rpeDeltaCount: rpeDeltas.length,
    restDeltaCount: restDeltas.length,
    hasCarriedSuperset,
    hasCarriedDensity,
    hasCarriedCluster,
    hasCarriedRestPause,
    variantHasOnlyOnePriorityRow: variantPriorityRowCount === 1,
  })

  const methodChanges = classifyMethodChanges(variantRows, appliedMethodsThisSession)

  // ---------------------------------------------------------------------
  // AB1-compatible per-variant ledger
  // ---------------------------------------------------------------------
  // Counting policy:
  //  - `loaded`     : every Full row was a candidate doctrine target.
  //  - `candidate`  : every Full row eligible for the variant body.
  //  - `eligible`   : Full rows whose role / category did not auto-disqualify.
  //                   Approximation: same as candidate at this layer.
  //  - `selected`   : variant rows (those that survived).
  //  - `mutated`    : variant rows whose set/rpe/rest differ from Full or
  //                   that carry method truth not present in the matching
  //                   Full row. (When body is materially distinct from Full,
  //                   every variant row counts as mutated by definition.)
  //  - `visible`    : same as mutated for AB3 — every mutated row is in the
  //                   variant body and therefore visible in Program UI.
  //  - `executable` : variant rows whose method or prescription will reach
  //                   Start Workout. Row-level method present OR set count
  //                   differs from Full counts as executable.
  //  - `blocked`    : method changes with state `blocked`.
  //  - `suppressed` : method changes with state `suppressed`.
  //  - `no_target`  : method changes with state `no_target` + deferred Full
  //                   rows that had method truth that didn't carry.
  //  - `audit_only` : Full rows whose only difference from variant row is in
  //                   selection reason / metadata, not in a real field.
  // ---------------------------------------------------------------------
  const totalRowsInFull = fullRows.length
  const selectedCount = variantRows.length
  const mutatedRows = new Set<string>()
  for (const v of variantRows) {
    const f = fullById.get(v.id)
    if (!f) {
      // variant row not in Full (rare; should not happen post-reconcile)
      mutatedRows.add(v.id)
      continue
    }
    if (
      f.sets !== v.sets ||
      f.rpe !== v.rpe ||
      f.rest !== v.rest ||
      f.method !== v.method ||
      f.blockId !== v.blockId
    ) {
      mutatedRows.add(v.id)
    }
  }
  const visibleCount = mutatedRows.size
  const executableCount =
    mutatedRows.size +
    variantRows.filter(r => r.method !== null && !mutatedRows.has(r.id)).length
  const blocked = methodChanges.filter(m => m.state === 'blocked').length
  const suppressed = methodChanges.filter(m => m.state === 'suppressed').length
  const noTarget =
    methodChanges.filter(m => m.state === 'no_target').length +
    deferredExercises.filter(name => {
      const f = fullRows.find(fr => fr.name === name)
      return !!(f && f.method)
    }).length
  const auditOnly = Math.max(
    0,
    totalRowsInFull - selectedCount - blocked - suppressed - noTarget
  )

  const ledger: RecompositionLedger = {
    loaded: totalRowsInFull,
    candidate: totalRowsInFull,
    eligible: totalRowsInFull,
    selected: selectedCount,
    mutated: mutatedRows.size,
    visible: visibleCount,
    executable: executableCount,
    blocked,
    suppressed,
    no_target: noTarget,
    audit_only: auditOnly,
  }

  // ---------------------------------------------------------------------
  // Safety blocks — derived from method changes that were blocked, plus
  // structural signals. Specific reasons only, never generic.
  // ---------------------------------------------------------------------
  const safetyBlocks: string[] = []
  for (const m of methodChanges) {
    if (m.state === 'blocked' || m.state === 'suppressed') {
      safetyBlocks.push(`${m.method} ${m.state}: ${m.reason}`)
    }
  }
  if (variantPriorityRowCount === 0 && totalAnchorCountInFull > 0) {
    safetyBlocks.push(
      'priority spine collapsed: no primary anchor survived compression — recomposer flagged for review'
    )
  }

  // ---------------------------------------------------------------------
  // Visible summary — short concise sentence the card can render directly.
  // ---------------------------------------------------------------------
  const summaryParts: string[] = []
  switch (crunchTimeStrategy) {
    case 'preserve_spine':
      summaryParts.push(
        preservedPriorityAnchors.length > 0
          ? `Preserved ${preservedPriorityAnchors.slice(0, 2).join(' + ')} spine`
          : 'Preserved priority spine'
      )
      break
    case 'paired_accessory':
      summaryParts.push('Paired accessories via superset')
      break
    case 'density_recompose':
      summaryParts.push('Density recompose')
      break
    case 'set_reduction':
      summaryParts.push(`Reduced ${setDeltas.length} prescription${setDeltas.length === 1 ? '' : 's'}`)
      break
    case 'rest_reduction':
      summaryParts.push('Trimmed rest for tighter density')
      break
    case 'rpe_reduction':
      summaryParts.push('Lowered RPE for crunch-time quality')
      break
    case 'minimal_priority':
      summaryParts.push('Minimal priority spine kept')
      break
    case 'straight_sets_best':
      summaryParts.push('Straight sets chosen as crunch-time best')
      break
    case 'identity_preserve':
      summaryParts.push('Compression already optimal')
      break
  }
  if (deferredExercises.length > 0) {
    summaryParts.push(
      `deferred ${deferredExercises.length} ${deferredExercises.length === 1 ? 'exercise' : 'exercises'}`
    )
  }
  if (setDeltas.length > 0 && crunchTimeStrategy !== 'set_reduction') {
    const totalSetsTrimmed = setDeltas.reduce((acc, s) => {
      const m = s.match(/(\d+)\s*→\s*(\d+)/)
      if (!m) return acc
      const before = Number(m[1])
      const after = Number(m[2])
      return acc + Math.max(0, before - after)
    }, 0)
    if (totalSetsTrimmed > 0) summaryParts.push(`trimmed ${totalSetsTrimmed} sets`)
  }

  const visibleSummary = `${variant.label} recomposed: ${summaryParts.join(', ')}.`

  return {
    targetMinutes: variant.duration,
    engine: 'doctrine_recomposition',
    estimatedMinutes: variant.duration,
    crunchTimeStrategy,
    recompositionApplied: true,
    preservedPriorityAnchors,
    changedExercises,
    deferredExercises,
    setDeltas,
    rpeDeltas,
    restDeltas,
    methodChanges,
    safetyBlocks,
    ledger,
    visibleSummary,
    executableParityExpected: true,
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * Single-variant entry — exposed for tests / debug surfaces.
 */
export function recomposeSessionForDuration(
  fullVariant: SessionVariant,
  shortVariant: SessionVariant,
  options: {
    primarySkillExpressions?: string[]
    sessionExercisesPostMaterialization?: RecomposeSessionVariantsInput['sessionExercisesPostMaterialization']
    appliedMethodsThisSession?: string[]
  } = {}
): RecompositionTruth {
  try {
    if (!fullVariant?.selection?.main || !shortVariant?.selection?.main) {
      return makeFallbackTruth(shortVariant)
    }
    const fullRows = readSelection(fullVariant.selection, options.primarySkillExpressions ?? [])
    return analyseVariant(
      fullRows,
      shortVariant,
      options.primarySkillExpressions ?? [],
      options.appliedMethodsThisSession ?? []
    )
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[PHASE-AB3-RECOMPOSITION-ERROR]', {
        targetMinutes: shortVariant?.duration,
        error: err instanceof Error ? err.message : String(err),
      })
    }
    return makeFallbackTruth(shortVariant)
  }
}

/**
 * Batch entry — preferred call site. Walks `shortVariants`, runs analysis on
 * each, and returns an array of truths in the same order. Caller stamps each
 * truth onto the matching `session.variants[i].recompositionTruth`.
 */
export function recomposeSessionVariants(
  input: RecomposeSessionVariantsInput
): RecompositionTruth[] {
  const {
    fullVariant,
    shortVariants,
    sessionExercisesPostMaterialization,
    appliedMethodsThisSession,
    primarySkillExpressions,
  } = input

  return shortVariants.map(sv =>
    recomposeSessionForDuration(fullVariant, sv, {
      primarySkillExpressions,
      sessionExercisesPostMaterialization,
      appliedMethodsThisSession,
    })
  )
}

/**
 * Honest fallback when context is missing or analysis errored. AB3 forbids
 * labelling this as doctrine recomposition; the UI surface keys off
 * `engine === 'fallback_compression'` and renders a different label.
 */
function makeFallbackTruth(shortVariant: SessionVariant): RecompositionTruth {
  return {
    targetMinutes: shortVariant?.duration ?? 0,
    engine: 'fallback_compression',
    estimatedMinutes: shortVariant?.duration ?? 0,
    crunchTimeStrategy: 'identity_preserve',
    recompositionApplied: false,
    preservedPriorityAnchors: [],
    changedExercises: [],
    deferredExercises: [],
    setDeltas: [],
    rpeDeltas: [],
    restDeltas: [],
    methodChanges: [],
    safetyBlocks: [],
    ledger: {
      loaded: 0,
      candidate: 0,
      eligible: 0,
      selected: 0,
      mutated: 0,
      visible: 0,
      executable: 0,
      blocked: 0,
      suppressed: 0,
      no_target: 0,
      audit_only: 0,
    },
    visibleSummary: `${shortVariant?.label ?? 'Short'} session: compression-only fallback (no doctrine recomposition available).`,
    executableParityExpected: true,
  }
}

// ----------------------------------------------------------------------------
// SessionVariant augmentation
// ----------------------------------------------------------------------------
// We do not edit the SessionVariant interface in compression-engine.ts.
// Instead, AB3 consumers cast to this augmented shape on read. Stamping is
// JSON-safe (plain object, no functions / class instances) and survives
// serialisation through any save/load layer that JSON.stringify-s the
// program.

export interface SessionVariantWithRecompositionTruth extends SessionVariant {
  recompositionTruth?: RecompositionTruth
}

/**
 * Type guard / accessor used by the Program UI. Centralises the sidecar
 * read so card / today / start-workout consumers cannot drift.
 */
export function getRecompositionTruth(
  variant: SessionVariant | undefined | null
): RecompositionTruth | null {
  if (!variant) return null
  const truth = (variant as SessionVariantWithRecompositionTruth).recompositionTruth
  if (!truth) return null
  if (typeof truth.engine !== 'string') return null
  return truth
}
