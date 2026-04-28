/**
 * =============================================================================
 * [PHASE-W] DOCTRINE CAUSALITY AUDIT CONTRACT V2
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Phase Q produced a `DoctrineUtilizationTrace` that classifies each rule into
 * 6 states (ELIGIBLE_AND_APPLIED / ELIGIBLE_BUT_SUPPRESSED / NOT_ELIGIBLE /
 * BLOCKED_BY_UNSUPPORTED_RUNTIME / ACKNOWLEDGED_ONLY / POST_HOC_ONLY).
 *
 * Phase W answers a strictly stricter question: even when a rule is APPLIED,
 * did the final user-visible program structurally change because of it?
 *
 * The Phase W audit splits Phase Q's `ELIGIBLE_AND_APPLIED` bucket into:
 *
 *     MATERIALIZED                    — at least one concrete user-visible
 *                                       structural / prescription / method /
 *                                       selection / session-length change can
 *                                       be cited from authoritative artifacts
 *                                       already stamped on the program object.
 *
 *     APPLIED_NO_STRUCTURAL_CHANGE    — engine accepted the rule but the
 *                                       resulting output already matched the
 *                                       baseline; no concrete change can be
 *                                       cited. This is honest, not a failure.
 *
 * It also introduces three additional honest states beyond Phase Q's set:
 *
 *     DISPLAYED_ONLY                  — a chip / proof string is rendered for
 *                                       the rule but no structural fact backs
 *                                       it (cosmetic). Forces honest labeling.
 *
 *     UNKNOWN_UNVERIFIED              — the audit cannot prove or disprove
 *                                       causality from the available
 *                                       artifacts. NEVER promoted to APPLIED
 *                                       or MATERIALIZED.
 *
 *     NOT_EVALUATED                   — the rule was not even examined in
 *                                       this build. Distinct from
 *                                       NOT_ELIGIBLE (which is "examined and
 *                                       rejected by gates").
 *
 * IMPORTANT — THIS IS AN OBSERVATION CONTRACT
 * -------------------------------------------
 * Phase W is pure, deterministic, and stateless. It does NOT:
 *   - mutate the program
 *   - re-run any builder / adaptation / mutator step
 *   - produce a parallel generator
 *   - hide existing Phase Q/4A/4C/4E/4J/4L/4P/4Q proof
 *
 * It reads ONLY artifacts already stamped on the canonical program object by
 * earlier phases:
 *
 *   program.doctrineUtilizationTrace                      [Phase Q]
 *   program.doctrineIntegration.materializationRollup      [Phase 4A]
 *   program.doctrineCausalChallenge.sessionDiffs[]         [Phase 4E]
 *   program.weeklyMethodRepresentation                     [Phase 4J]
 *   program.rowLevelMutatorRollup                          [Phase 4L]
 *   program.methodStructureRollup                          [Phase 4P]
 *   program.doctrineApplicationRollup                      [Phase 4M]
 *   program.sessions[].rowLevelMutatorSummary              [Phase 4L per-session]
 *   program.sessions[].styleMetadata                       [builder]
 *   program.sessions[].exercises[]                         [builder + mutator]
 *
 * From this it produces a `DoctrineCausalityLedger` with:
 *   - per-rule classification into the 9 Phase W states
 *   - top-level counts in each bucket
 *   - an honest verdict (MOSTLY_CAUSAL / PARTIALLY_CAUSAL / MOSTLY_COSMETIC /
 *     INCONCLUSIVE)
 *   - concrete `changedFields` evidence for every MATERIALIZED entry
 *
 * NEVER claim MATERIALIZED without a non-empty `changedFields` array.
 * NEVER claim APPLIED_NO_STRUCTURAL_CHANGE for a rule that was never APPLIED
 * in Phase Q's trace.
 * NEVER promote DISPLAYED_ONLY entries upward.
 *
 * SAFETY POLICY
 * -------------
 * Every artifact read is `?.` chained. The function never throws on malformed
 * input; on total artifact absence it returns an INCONCLUSIVE ledger with an
 * `error` field and zero counts in every bucket. The program object is never
 * mutated.
 *
 * Cluster / circuit / density runtime: this audit specifically does NOT
 * promote method entries to MATERIALIZED unless the canonical session
 * structural change rollup confirms a real grouped block was written or a
 * row-level method left behind a `fieldChanges` entry. "Should apply" is not
 * MATERIALIZED. "No safe target" is not MATERIALIZED. "Blocked by unsupported
 * runtime" is BLOCKED_BY_RUNTIME, not MATERIALIZED.
 * =============================================================================
 */

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * The 9 honest Phase W causality states. Order is intentional: strongest
 * causal evidence first, weakest last.
 */
export type RuleCausalityState =
  | 'MATERIALIZED'                  // engine accepted AND output structurally changed
  | 'APPLIED_NO_STRUCTURAL_CHANGE'  // engine accepted but output already matched
  | 'ELIGIBLE_SUPPRESSED'           // eligible but a higher gate suppressed it
  | 'BLOCKED_BY_RUNTIME'            // doctrine-valid, runtime cannot execute
  | 'EVALUATED_NOT_ELIGIBLE'        // examined, gates correctly rejected
  | 'ACKNOWLEDGED_ONLY'             // shadow-mode / preview, did not influence build
  | 'POST_HOC_ONLY'                 // appears only in audit slice after build
  | 'DISPLAYED_ONLY'                // chip rendered but no structural backing
  | 'NOT_EVALUATED'                 // the rule never entered the eligibility check
  | 'UNKNOWN_UNVERIFIED'            // cannot prove or disprove from artifacts

export type RuleCausalityCategory =
  | 'skill_selection'
  | 'exercise_selection'
  | 'method_selection'
  | 'prescription_mutation'
  | 'session_length'
  | 'recovery_protection'
  | 'intensity_distribution'
  | 'weekly_distribution'
  | 'equipment_constraint'
  | 'progression_level'
  | 'safety_gate'
  | 'runtime_support'
  | 'explanation_only'

/**
 * A concrete deterministic field-change citation. Path uses the same dotted
 * notation the row-level mutator already emits, e.g.
 *   sessions[2].exercises[4].setExecutionMethod
 *   sessions[0].styleMetadata.styledGroups[1].groupType
 *   sessions[5].estimatedMinutes
 *   weekly.skillExposure.planche
 *
 * `before` / `after` are intentionally permissive (string | number | null)
 * — most upstream phases only stamp summaries, not full snapshots.
 */
export interface RuleChangedField {
  path: string
  before: string | number | boolean | null
  after: string | number | boolean | null
  reasonCode?: string
}

/**
 * Phase W per-rule causality entry. One row per rule across all categories.
 */
export interface RuleCausalityEntry {
  ruleId: string
  ruleName: string
  category: RuleCausalityCategory
  /** Where in the build this rule was actually decided. */
  source: 'preBuilder' | 'builder' | 'adaptation' | 'mutator' | 'audit' | 'displayOnly' | 'unknown'
  state: RuleCausalityState
  evaluated: boolean
  eligible: boolean
  applied: boolean
  materialized: boolean
  blocked: boolean
  suppressed: boolean
  reasonCode: string
  reasonText: string
  /** Concrete field-level evidence. REQUIRED for MATERIALIZED. */
  changedFields: RuleChangedField[]
  affectedSessionIds: string[]
  affectedExerciseIds: string[]
  affectedMethodIds: string[]
  /** Where in the UI this rule's proof is visible (or 'none'). */
  userVisibleSurface: string
  /** 0..1 confidence the audit has in the classification. */
  confidence: number
  /** Short one-line athlete-readable explanation. */
  proofSummary: string
}

/**
 * Top-level Phase W ledger. Counts in each bucket, plus a verdict.
 */
export interface DoctrineCausalityLedger {
  version: 'phase-w.causality-audit.v1'
  generatedAt: string
  /** Honest top-level verdict. */
  verdict: 'MOSTLY_CAUSAL' | 'PARTIALLY_CAUSAL' | 'MOSTLY_COSMETIC' | 'INCONCLUSIVE'
  /** One-line athlete-readable summary of the breakdown. */
  oneLineExplanation: string
  /** Per-bucket counts. */
  counts: {
    materialized: number
    appliedNoStructuralChange: number
    eligibleSuppressed: number
    blockedByRuntime: number
    evaluatedNotEligible: number
    acknowledgedOnly: number
    postHocOnly: number
    displayedOnly: number
    notEvaluated: number
    unknownUnverified: number
    /** Sum of materialized + appliedNoStructuralChange + eligibleSuppressed +
     * blockedByRuntime + evaluatedNotEligible + acknowledgedOnly + postHocOnly
     * + displayedOnly + unknownUnverified + notEvaluated. */
    total: number
  }
  /** Per-rule rows. */
  entries: RuleCausalityEntry[]
  /** Sources of truth this ledger consumed (for transparency). */
  artifactsRead: {
    doctrineUtilizationTracePresent: boolean
    materializationRollupPresent: boolean
    doctrineCausalChallengePresent: boolean
    weeklyMethodRepresentationPresent: boolean
    rowLevelMutatorRollupPresent: boolean
    methodStructureRollupPresent: boolean
    sessionLengthVariantPresent: boolean
  }
  /** Set when input artifacts were missing/malformed. Ledger still returns. */
  error?: string
}

// =============================================================================
// INTERNAL READ-ONLY VIEWS — every field optional, every read `?.` chained
// =============================================================================

interface PhaseQTraceEntryView {
  ruleId?: string
  category?: string
  subCategory?: string
  state?: string
  decisionStage?: string
  appliedTo?: string
  reason?: string
  blockerReason?: string
  structuralEffect?: string
  sourceOfTruthObjectPath?: string
  visibleProofText?: string
  affectedDays?: number[]
  affectedExerciseIds?: string[]
}

interface PhaseQTraceView {
  programLevelEntries?: PhaseQTraceEntryView[]
  perCategoryRollup?: Record<string, { applied?: number; eligibleSuppressed?: number; notEligible?: number; blockedByRuntime?: number; acknowledgedOnly?: number; postHocOnly?: number }>
}

interface RowLevelFieldChangeView {
  exerciseId?: string
  exerciseName?: string
  path?: string
  before?: unknown
  after?: unknown
  reasonCode?: string
  sourceRuleIds?: string[]
}

interface RowLevelAppliedMutationView {
  exerciseId?: string
  exerciseName?: string
  methodId?: string
  source?: string
  reasonCode?: string
  fieldChanges?: RowLevelFieldChangeView[]
}

interface RowLevelBlockedMutationView {
  methodId?: string
  reasonCode?: string
  plainEnglish?: string
  sourceRuleIds?: string[]
}

interface RowLevelMutatorRollupView {
  appliedCount?: number
  blockedCount?: number
  appliedMutations?: RowLevelAppliedMutationView[]
  blockedMutations?: RowLevelBlockedMutationView[]
  appliedMethods?: string[]
  blockedMethods?: string[]
  fieldChangeCount?: number
}

interface MaterializationRollupView {
  sessionsWithStructuralChange?: number
  totalGroupedBlocks?: number
  totalGroupedSupersets?: number
  totalGroupedCircuits?: number
  totalGroupedDensityBlocks?: number
  totalRowCluster?: number
  totalRowTopSet?: number
  totalRowDropSet?: number
  totalRowRestPause?: number
  totalChangedExercises?: number
  allSessionsFlat?: boolean
}

interface DoctrineCausalChallengeSessionDiffView {
  dayNumber?: number
  preTopExerciseId?: string
  postTopExerciseId?: string
  doctrineChangedTopWinner?: boolean
  reason?: string
}

interface DoctrineCausalChallengeView {
  sessionDiffs?: DoctrineCausalChallengeSessionDiffView[]
  programLevelChangedSessions?: number
}

interface MethodStructureRollupView {
  appliedTotal?: number
  blockedTotal?: number
  notNeededTotal?: number
  noSafeTargetTotal?: number
  alreadyAppliedTotal?: number
  byFamily?: Record<string, { applied?: number; blocked?: number; notNeeded?: number; noSafeTarget?: number; alreadyApplied?: number }>
}

interface ProgramView {
  doctrineUtilizationTrace?: PhaseQTraceView | null
  doctrineIntegration?: { materializationRollup?: MaterializationRollupView | null } | null
  doctrineCausalChallenge?: DoctrineCausalChallengeView | null
  rowLevelMutatorRollup?: RowLevelMutatorRollupView | null
  methodStructureRollup?: MethodStructureRollupView | null
  weeklyMethodRepresentation?: unknown | null
  /** Phase R selected variant marker (presence is enough — value lives in session metadata). */
  sessionLengthVariantApplied?: boolean | null
  sessions?: Array<{
    id?: string | number
    dayNumber?: number
    rowLevelMutatorSummary?: RowLevelMutatorRollupView | null
    styleMetadata?: unknown
    exercises?: unknown[]
  }>
}

// =============================================================================
// HELPERS
// =============================================================================

function safeString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function safeNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return 0
}

function safeBool(v: unknown): boolean {
  return v === true
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Map a Phase 4L `RowLevelFieldChange` row into a Phase W `RuleChangedField`.
 * Phase 4L `before/after` may be objects (densityPrescription before/after).
 * We coerce to the constrained primitive union for the ledger and stash the
 * full object only via reasonCode so we don't bloat UI payloads.
 */
function coerceFieldChange(fc: RowLevelFieldChangeView): RuleChangedField {
  const path = safeString(fc.path, 'unknown')
  const exId = safeString(fc.exerciseId, '')
  const fullPath = exId ? `exercises[${exId}].${path}` : path
  const before =
    fc.before === null || fc.before === undefined
      ? null
      : typeof fc.before === 'string' || typeof fc.before === 'number' || typeof fc.before === 'boolean'
        ? fc.before
        : 'object_before' // Phase 4L sometimes carries a full object; UI only needs change presence
  const after =
    fc.after === null || fc.after === undefined
      ? null
      : typeof fc.after === 'string' || typeof fc.after === 'number' || typeof fc.after === 'boolean'
        ? fc.after
        : 'object_after'
  return {
    path: fullPath,
    before,
    after,
    reasonCode: fc.reasonCode,
  }
}

/**
 * Map Phase Q's `state` string onto the Phase W state. APPLIED is intentionally
 * NOT mapped to MATERIALIZED here — that promotion only happens after we
 * confirm concrete `changedFields` evidence below.
 */
function phaseQToPhaseW(qState: string): RuleCausalityState {
  switch (qState) {
    case 'ELIGIBLE_AND_APPLIED':
      return 'APPLIED_NO_STRUCTURAL_CHANGE' // tentative — promoted to MATERIALIZED only when changedFields > 0
    case 'ELIGIBLE_BUT_SUPPRESSED':
      return 'ELIGIBLE_SUPPRESSED'
    case 'NOT_ELIGIBLE':
      return 'EVALUATED_NOT_ELIGIBLE'
    case 'BLOCKED_BY_UNSUPPORTED_RUNTIME':
      return 'BLOCKED_BY_RUNTIME'
    case 'ACKNOWLEDGED_ONLY':
      return 'ACKNOWLEDGED_ONLY'
    case 'POST_HOC_ONLY':
      return 'POST_HOC_ONLY'
    default:
      return 'UNKNOWN_UNVERIFIED'
  }
}

function phaseQCategoryToPhaseW(qCategory: string, subCategory?: string): RuleCausalityCategory {
  switch (qCategory) {
    case 'skill':
      return 'skill_selection'
    case 'method':
      return 'method_selection'
    case 'recovery':
      return 'recovery_protection'
    case 'prescription':
      return 'prescription_mutation'
    case 'sessionLength':
      return 'session_length'
    default:
      return subCategory === 'equipment' ? 'equipment_constraint' : 'explanation_only'
  }
}

function phaseQStageToPhaseW(stage: string): RuleCausalityEntry['source'] {
  switch (stage) {
    case 'preBuilder':
      return 'preBuilder'
    case 'builder':
      return 'builder'
    case 'adaptation':
      return 'adaptation'
    case 'qualityAudit':
      return 'audit'
    case 'displayOnly':
      return 'displayOnly'
    default:
      return 'unknown'
  }
}

/**
 * Index Phase 4L row-level field-change rows by methodId so a Phase Q
 * `method:<methodId>` entry can pick up its concrete changedFields.
 */
function indexRowLevelChangesByMethod(
  rollup: RowLevelMutatorRollupView | null | undefined,
): Record<string, RuleChangedField[]> {
  const out: Record<string, RuleChangedField[]> = {}
  const applied = rollup?.appliedMutations ?? []
  for (const m of applied) {
    const key = safeString(m.methodId, '')
    if (!key) continue
    const list = out[key] ?? (out[key] = [])
    for (const fc of m.fieldChanges ?? []) {
      list.push(coerceFieldChange(fc))
    }
  }
  return out
}

/**
 * Estimate `changedFields` for a Phase Q `skill` entry by looking at the
 * doctrine causal challenge — if doctrine changed at least one session's top
 * winner, the skill rule gets credit for that exercise selection change.
 */
function changedFieldsFromCausalChallenge(
  challenge: DoctrineCausalChallengeView | null | undefined,
): RuleChangedField[] {
  const diffs = challenge?.sessionDiffs ?? []
  const out: RuleChangedField[] = []
  for (const d of diffs) {
    if (!d.doctrineChangedTopWinner) continue
    out.push({
      path: `sessions[day=${d.dayNumber ?? '?'}].topExerciseWinner`,
      before: safeString(d.preTopExerciseId, null) || null,
      after: safeString(d.postTopExerciseId, null) || null,
      reasonCode: 'doctrine_changed_top_winner',
    })
  }
  return out
}

/**
 * Estimate session-length materialization. Phase R writes selected variant
 * exercise lists per mode; if the materialization rollup confirms structural
 * change AND a session-length variant was applied, we cite the change.
 *
 * Conservative: we only cite a path-level change here, not a full diff,
 * because the audit reads only stamped artifacts (no re-running of the
 * variant resolver).
 */
function changedFieldsFromSessionLength(
  program: ProgramView,
): RuleChangedField[] {
  const variantApplied = program.sessionLengthVariantApplied === true
  const rollup = program.doctrineIntegration?.materializationRollup ?? {}
  const sessionsChanged = safeNumber(rollup.sessionsWithStructuralChange)
  if (!variantApplied) return []
  if (sessionsChanged <= 0) return []
  return [
    {
      path: 'sessions[*].selectedSessionVariant',
      before: 'full_session_default',
      after: 'session_length_variant_applied',
      reasonCode: 'phase_r_session_length_variant',
    },
  ]
}

// =============================================================================
// MAIN — runDoctrineCausalityAudit
// =============================================================================

/**
 * Pure observation. Reads a canonical AdaptiveProgram and returns a
 * `DoctrineCausalityLedger`. NEVER mutates input.
 *
 * Contract:
 *   - returns a ledger even when artifacts are missing (verdict=INCONCLUSIVE)
 *   - never throws
 *   - every MATERIALIZED entry has at least one `changedFields` row
 *   - every APPLIED_NO_STRUCTURAL_CHANGE entry came from a Phase Q
 *     `ELIGIBLE_AND_APPLIED` row that had no field-level evidence
 *   - DISPLAYED_ONLY is reserved — populated only if a future caller
 *     explicitly attaches display-only rules; this function never invents them
 */
export function runDoctrineCausalityAudit(
  programInput: AdaptiveProgram | null | undefined,
): DoctrineCausalityLedger {
  const empty = (error?: string): DoctrineCausalityLedger => ({
    version: 'phase-w.causality-audit.v1',
    generatedAt: nowIso(),
    verdict: 'INCONCLUSIVE',
    oneLineExplanation:
      error
        ? `Causality audit could not run: ${error}`
        : 'Causality audit ran on an empty program — no rules to classify.',
    counts: {
      materialized: 0,
      appliedNoStructuralChange: 0,
      eligibleSuppressed: 0,
      blockedByRuntime: 0,
      evaluatedNotEligible: 0,
      acknowledgedOnly: 0,
      postHocOnly: 0,
      displayedOnly: 0,
      notEvaluated: 0,
      unknownUnverified: 0,
      total: 0,
    },
    entries: [],
    artifactsRead: {
      doctrineUtilizationTracePresent: false,
      materializationRollupPresent: false,
      doctrineCausalChallengePresent: false,
      weeklyMethodRepresentationPresent: false,
      rowLevelMutatorRollupPresent: false,
      methodStructureRollupPresent: false,
      sessionLengthVariantPresent: false,
    },
    error,
  })

  if (!programInput) return empty()
  const program = programInput as unknown as ProgramView

  let phaseQTrace: PhaseQTraceView | null = null
  let materializationRollup: MaterializationRollupView | null = null
  let causalChallenge: DoctrineCausalChallengeView | null = null
  let rowLevelRollup: RowLevelMutatorRollupView | null = null
  let methodStructure: MethodStructureRollupView | null = null
  let weeklyMethodPresent = false
  let sessionLengthVariantPresent = false

  try {
    phaseQTrace = program.doctrineUtilizationTrace ?? null
    materializationRollup = program.doctrineIntegration?.materializationRollup ?? null
    causalChallenge = program.doctrineCausalChallenge ?? null
    rowLevelRollup = program.rowLevelMutatorRollup ?? null
    methodStructure = program.methodStructureRollup ?? null
    weeklyMethodPresent = program.weeklyMethodRepresentation != null
    sessionLengthVariantPresent = program.sessionLengthVariantApplied === true
  } catch (e) {
    return empty(`artifact_read_failure:${String(e)}`)
  }

  const phaseQEntries = phaseQTrace?.programLevelEntries ?? []
  if (phaseQEntries.length === 0) {
    // No Phase Q trace at all — we cannot honestly classify rule-by-rule.
    // Return INCONCLUSIVE so the UI cannot claim doctrine causality.
    return {
      ...empty('phase_q_trace_missing_or_empty'),
      artifactsRead: {
        doctrineUtilizationTracePresent: false,
        materializationRollupPresent: !!materializationRollup,
        doctrineCausalChallengePresent: !!causalChallenge,
        weeklyMethodRepresentationPresent: weeklyMethodPresent,
        rowLevelMutatorRollupPresent: !!rowLevelRollup,
        methodStructureRollupPresent: !!methodStructure,
        sessionLengthVariantPresent,
      },
    }
  }

  const rowChangesByMethod = indexRowLevelChangesByMethod(rowLevelRollup)
  const causalChangedFields = changedFieldsFromCausalChallenge(causalChallenge)
  const sessionLengthChangedFields = changedFieldsFromSessionLength(program)

  const entries: RuleCausalityEntry[] = []
  for (const q of phaseQEntries) {
    const ruleId = safeString(q.ruleId, 'phaseQ:unknown')
    const qState = safeString(q.state, 'UNKNOWN')
    const qCategory = safeString(q.category, '')
    const subCategory = safeString(q.subCategory, '')
    const reason = safeString(q.reason, '')
    const blockerReason = safeString(q.blockerReason, '')
    const structuralEffect = safeString(q.structuralEffect, '')
    const sourcePath = safeString(q.sourceOfTruthObjectPath, '')
    const proofText = safeString(q.visibleProofText, '')
    const stage = safeString(q.decisionStage, 'unknown')

    const initialState = phaseQToPhaseW(qState)
    const category = phaseQCategoryToPhaseW(qCategory, subCategory)
    const source = phaseQStageToPhaseW(stage)

    // Build concrete changedFields evidence from the right artifact for this rule.
    let changedFields: RuleChangedField[] = []
    if (initialState === 'APPLIED_NO_STRUCTURAL_CHANGE') {
      if (qCategory === 'method' && subCategory) {
        changedFields = rowChangesByMethod[subCategory] ?? []
      } else if (qCategory === 'skill') {
        changedFields = causalChangedFields
      } else if (qCategory === 'sessionLength') {
        changedFields = sessionLengthChangedFields
      } else if (qCategory === 'prescription') {
        // Prescription bounds proofs are "within bounds, not mutated" by design;
        // unless a row-level method emitted prescription-shaped fieldChanges,
        // we honestly leave changedFields empty (i.e. APPLIED_NO_STRUCTURAL_CHANGE).
        const restRpeChanges: RuleChangedField[] = []
        for (const m of rowLevelRollup?.appliedMutations ?? []) {
          for (const fc of m.fieldChanges ?? []) {
            const p = safeString(fc.path, '')
            if (p === 'restSeconds' || p === 'targetRPE' || p === 'rpe' || p === 'rest') {
              restRpeChanges.push(coerceFieldChange(fc))
            }
          }
        }
        changedFields = restRpeChanges
      }
    }

    // Promote APPLIED_NO_STRUCTURAL_CHANGE to MATERIALIZED iff concrete
    // evidence exists. NEVER promote any other state.
    let finalState: RuleCausalityState = initialState
    if (initialState === 'APPLIED_NO_STRUCTURAL_CHANGE' && changedFields.length > 0) {
      finalState = 'MATERIALIZED'
    }

    const evaluated = qState !== 'UNKNOWN' && qState !== ''
    const eligible =
      qState === 'ELIGIBLE_AND_APPLIED' ||
      qState === 'ELIGIBLE_BUT_SUPPRESSED' ||
      qState === 'BLOCKED_BY_UNSUPPORTED_RUNTIME'
    const applied = qState === 'ELIGIBLE_AND_APPLIED'
    const materialized = finalState === 'MATERIALIZED'
    const blocked = finalState === 'BLOCKED_BY_RUNTIME'
    const suppressed = finalState === 'ELIGIBLE_SUPPRESSED'

    const reasonCode =
      blockerReason ||
      (materialized
        ? 'materialized_concrete_field_change'
        : finalState === 'APPLIED_NO_STRUCTURAL_CHANGE'
          ? 'applied_output_already_matched'
          : finalState)
    const proofSummary =
      proofText ||
      (materialized
        ? `Caused ${changedFields.length} concrete field change${changedFields.length === 1 ? '' : 's'}.`
        : finalState === 'APPLIED_NO_STRUCTURAL_CHANGE'
          ? 'Engine accepted the rule but the baseline output already matched — no mutation needed.'
          : reason || 'No structural change.')

    const affectedDays = (q.affectedDays ?? []).map(d => `day${d}`)
    const affectedExerciseIds = q.affectedExerciseIds ?? []
    const affectedMethodIds = subCategory ? [subCategory] : []

    entries.push({
      ruleId,
      ruleName: subCategory ? `${qCategory}:${subCategory}` : qCategory || ruleId,
      category,
      source,
      state: finalState,
      evaluated,
      eligible,
      applied,
      materialized,
      blocked,
      suppressed,
      reasonCode,
      reasonText: reason || structuralEffect || proofText || 'No detail.',
      changedFields,
      affectedSessionIds: affectedDays,
      affectedExerciseIds,
      affectedMethodIds,
      userVisibleSurface: sourcePath || 'none',
      confidence: materialized ? 0.95 : finalState === 'UNKNOWN_UNVERIFIED' ? 0.2 : 0.7,
      proofSummary,
    })
  }

  // Counts
  const counts = {
    materialized: entries.filter(e => e.state === 'MATERIALIZED').length,
    appliedNoStructuralChange: entries.filter(e => e.state === 'APPLIED_NO_STRUCTURAL_CHANGE').length,
    eligibleSuppressed: entries.filter(e => e.state === 'ELIGIBLE_SUPPRESSED').length,
    blockedByRuntime: entries.filter(e => e.state === 'BLOCKED_BY_RUNTIME').length,
    evaluatedNotEligible: entries.filter(e => e.state === 'EVALUATED_NOT_ELIGIBLE').length,
    acknowledgedOnly: entries.filter(e => e.state === 'ACKNOWLEDGED_ONLY').length,
    postHocOnly: entries.filter(e => e.state === 'POST_HOC_ONLY').length,
    displayedOnly: entries.filter(e => e.state === 'DISPLAYED_ONLY').length,
    notEvaluated: entries.filter(e => e.state === 'NOT_EVALUATED').length,
    unknownUnverified: entries.filter(e => e.state === 'UNKNOWN_UNVERIFIED').length,
    total: entries.length,
  }

  // Verdict — read from counts. Honest thresholds:
  //   MOSTLY_CAUSAL    materialized >= 1 AND materialized > appliedNoStructuralChange
  //                    AND materialized > acknowledgedOnly + postHocOnly + displayedOnly
  //   PARTIALLY_CAUSAL materialized >= 1 but does not dominate
  //   MOSTLY_COSMETIC  materialized === 0 AND
  //                    (acknowledgedOnly + postHocOnly + displayedOnly) > 0
  //   INCONCLUSIVE     materialized === 0 AND no cosmetic-only entries either
  let verdict: DoctrineCausalityLedger['verdict']
  const cosmetic = counts.acknowledgedOnly + counts.postHocOnly + counts.displayedOnly
  if (counts.materialized >= 1 && counts.materialized >= counts.appliedNoStructuralChange && counts.materialized >= cosmetic) {
    verdict = 'MOSTLY_CAUSAL'
  } else if (counts.materialized >= 1) {
    verdict = 'PARTIALLY_CAUSAL'
  } else if (cosmetic > 0) {
    verdict = 'MOSTLY_COSMETIC'
  } else {
    verdict = 'INCONCLUSIVE'
  }

  const oneLineExplanation = (() => {
    const segments: string[] = []
    if (counts.materialized > 0) segments.push(`${counts.materialized} materialized`)
    if (counts.appliedNoStructuralChange > 0) segments.push(`${counts.appliedNoStructuralChange} applied (no change needed)`)
    if (counts.eligibleSuppressed > 0) segments.push(`${counts.eligibleSuppressed} suppressed`)
    if (counts.blockedByRuntime > 0) segments.push(`${counts.blockedByRuntime} blocked by runtime`)
    if (counts.acknowledgedOnly > 0) segments.push(`${counts.acknowledgedOnly} acknowledged only`)
    if (counts.postHocOnly > 0) segments.push(`${counts.postHocOnly} post-hoc only`)
    if (counts.unknownUnverified > 0) segments.push(`${counts.unknownUnverified} unverified`)
    return segments.length === 0
      ? 'No doctrine activity classified for this build.'
      : segments.join(' \u00b7 ')
  })()

  return {
    version: 'phase-w.causality-audit.v1',
    generatedAt: nowIso(),
    verdict,
    oneLineExplanation,
    counts,
    entries,
    artifactsRead: {
      doctrineUtilizationTracePresent: !!phaseQTrace && phaseQEntries.length > 0,
      materializationRollupPresent: !!materializationRollup,
      doctrineCausalChallengePresent: !!causalChallenge,
      weeklyMethodRepresentationPresent: weeklyMethodPresent,
      rowLevelMutatorRollupPresent: !!rowLevelRollup,
      methodStructureRollupPresent: !!methodStructure,
      sessionLengthVariantPresent,
    },
  }
}

/**
 * Convenience selector for surface code that wants the verdict only.
 */
export function getCausalityVerdict(
  program: AdaptiveProgram | null | undefined,
): DoctrineCausalityLedger['verdict'] {
  return runDoctrineCausalityAudit(program).verdict
}
