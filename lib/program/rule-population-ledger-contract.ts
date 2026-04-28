// =============================================================================
// [PHASE AB1] RULE POPULATION LEDGER CONTRACT
// =============================================================================
//
// PURPOSE
// -------
// AB1 closes the gap between "doctrine reports rules applied" and
// "rules visibly/executably shape the actual training program". Phase 4H
// already produces a per-category honest classification at
// `program.doctrineMaterializationMatrix` with these category-level
// statuses:
//
//   CONNECTED_AND_MATERIAL     — rules reach a decision surface AND can
//                                change a real program field. Each row
//                                also lists `changedProgramFields[]` and
//                                `visibleSurfaces[]` — the only reliable
//                                proof that a rule materialised something.
//   READ_BUT_SCORING_ONLY      — rules influenced candidate scoring but
//                                no field was mutated.
//   READ_BUT_AUDIT_ONLY        — rules were loaded into an audit object
//                                but no decision surface consumed them.
//   BLOCKED_WITH_REASON        — rules eligible but a named gate blocked.
//   NOT_RELEVANT_TO_CURRENT_PROFILE
//   NOT_READ / NOT_IN_SCHEMA
//   MATERIALIZER_NOT_CONNECTED — rules read but no consumer is wired yet.
//
// AB1 does NOT introduce a second classification engine. It DERIVES from
// the existing matrix the eleven-state Rule Population Ledger required by
// the AB1 prompt:
//
//   loaded → candidate → eligible → selected → mutated → visible → executable
//                                              + blocked / suppressed /
//                                              + no_target / audit_only
//
// CRITICAL SEMANTIC RULE (AB1 PART A):
//   Only categories whose rules reach state `mutated`, `visible`, or
//   `executable` may be counted as "applied". A category that is
//   audit_only / scoring_only / blocked / suppressed / no_target / not
//   relevant is NOT counted as applied.
//
// SOURCE OF TRUTH (read-only)
// ---------------------------
//   • program.doctrineMaterializationMatrix (Phase 4H)
//   • program.cooldownFlexibilityMaterialization (Phase 4I + AA4 bridge
//     telemetry: bridgeBlocksInjected / bridgeSessionsInjected)
//
// NON-NEGOTIABLES
// ---------------
//   ✓ pure derivation — no new doctrine, no new mutators, no I/O
//   ✓ JSON-serialisable (survives save / API roundtrip)
//   ✓ never inflates "applied" counts
//   ✓ never claims executable without proof from changedProgramFields
//   ✓ never throws — partial / missing data falls back to honest defaults
// =============================================================================

import type {
  DoctrineMaterializationMatrix,
  DoctrineCategoryRow,
  DoctrineCategoryStatus,
} from '@/lib/doctrine/doctrine-materialization-matrix'

// -----------------------------------------------------------------------------
// 11-state contract from AB1 Part A.
// -----------------------------------------------------------------------------
export type RulePopulationLedgerEntryState =
  /** Rules exist and were available in the runtime path. */
  | 'loaded'
  /** Rules matched broad context (athlete category / session shape). */
  | 'candidate'
  /** Rules survived athlete/session eligibility checks. */
  | 'eligible'
  /** Rules were chosen as inputs to a decision. */
  | 'selected'
  /** Rules changed a real program/session field (non-empty changedProgramFields). */
  | 'mutated'
  /** Mutation appears on a Program UI surface (non-empty visibleSurfaces). */
  | 'visible'
  /** Mutation appears in Start Workout or affects executable workout behaviour. */
  | 'executable'
  /** Rules were eligible/selected but intentionally not used, with a reason. */
  | 'blocked'
  /** Rules prevented by safety / time / recovery / progression caps. */
  | 'suppressed'
  /** Rules had no valid exercise/session/goal target. */
  | 'no_target'
  /** Rules produced metadata or explanation but did not change the program. */
  | 'audit_only'

/** Stable category keys mirror Phase 4H matrix categories so the ledger and
 *  the matrix stay one-to-one. */
export type RulePopulationLedgerCategoryKey = DoctrineCategoryRow['category']

export interface RulePopulationLedgerCategoryEntry {
  category: RulePopulationLedgerCategoryKey
  /** The single AB1 state this category resolved to in this run. */
  state: RulePopulationLedgerEntryState
  /**
   * The set of states this category occupies. Most categories resolve to
   * a single dominant state, but `mutated/visible/executable` are nested
   * (executable implies visible implies mutated) and we keep them as a
   * set so downstream consumers can render all three honestly.
   */
  states: RulePopulationLedgerEntryState[]
  /** Verbatim Phase 4H category status for traceability. */
  matrixStatus: DoctrineCategoryStatus
  /** Counts copied from the matrix for the per-category card. */
  rulesRead: number
  rulesRelevant: number
  rulesEligible: number
  rulesSelected: number
  rulesMaterialized: number
  rulesBlocked: number
  /** Concrete program fields this category changed. Empty unless `mutated`. */
  changedProgramFields: string[]
  /** Where the user can see proof. Empty unless `visible`. */
  visibleSurfaces: string[]
  /** Honest reason when nothing changed. Mirrors matrix.noChangeReason. */
  noChangeReason: string | null
  /** Plain-English summary suitable for UI tooltips. */
  notes: string
}

export interface RulePopulationLedgerTotals {
  /** Categories that reach state `executable` (mutated + visible + Start
   *  Workout or set-execution path). */
  categoriesExecutable: number
  /** Categories that reach state `visible` (mutated + at least one UI surface). */
  categoriesVisible: number
  /** Categories that reach state `mutated` (changed at least one program field). */
  categoriesMutated: number
  /** Categories that influenced scoring but mutated nothing. */
  categoriesScoringOnly: number
  /** Categories whose rules were loaded but never consumed. */
  categoriesAuditOnly: number
  /** Categories blocked / suppressed by a named gate. */
  categoriesBlocked: number
  /** Categories with no valid target on this profile/session. */
  categoriesNoTarget: number
  /** Categories not relevant to this athlete's current profile. */
  categoriesNotRelevant: number
  /** Categories whose rules are loaded but no materializer is wired yet. */
  categoriesMaterializerNotConnected: number
  /** Sum of rulesMaterialized across all categories. */
  totalRulesMaterialized: number
  /** Sum of rulesRead across all categories. */
  totalRulesRead: number
}

export type RulePopulationLedgerVerdict =
  | 'RULES_VISIBLY_CHANGED_PROGRAM'
  | 'RULES_PARTIALLY_CHANGED_PROGRAM'
  | 'RULES_READ_BUT_NOT_VISIBLE'
  | 'RULES_NOT_AVAILABLE'

export interface RulePopulationLedger {
  version: 'ab1-rule-population-ledger-v1'
  generatedAt: string
  /** Whether the runtime contract was actually built and available. */
  doctrineRuntimeAvailable: boolean
  categories: RulePopulationLedgerCategoryEntry[]
  totals: RulePopulationLedgerTotals
  verdict: RulePopulationLedgerVerdict
  /** Compact one-line headline suitable for surfacing in the Program UI. */
  headline: string
}

// =============================================================================
// CATEGORY → EXECUTABLE MAP
// =============================================================================
//
// Which categories, when they reach `mutated`, also reach `executable`?
// A change is `executable` iff Start Workout (or live workout behaviour)
// renders / consumes it. We derive this from the existing matrix's
// `visibleSurfaces` — if a category's visibleSurfaces include the
// session card body, the live workout cooldown/warm-up rows, or the row
// prescription itself, it is executable.
//
// This list is conservative: when in doubt, a category is `visible` but
// NOT `executable`. The AA4 audit confirmed:
//   • exercise_selection / prescription / progression / mobility_warmup_prehab
//     / cooldown_flexibility / weekly_architecture all hit Start Workout
//     because Start Workout reads `session.exercises`, `session.warmup`,
//     `session.cooldown`, and the per-row prescription directly.
//   • method_selection (grouped) hits Start Workout via styledGroups.
//   • method_selection_row_level hits Start Workout via setExecutionMethod.
//   • carryover_support / contraindication_safety are visible (selection
//     reasons + blocked-method reasons) but do not directly mutate live
//     workout execution beyond what exercise_selection already does.
// -----------------------------------------------------------------------------
const EXECUTABLE_CATEGORIES: ReadonlySet<RulePopulationLedgerCategoryKey> = new Set([
  'exercise_selection',
  'method_selection',
  'method_selection_row_level',
  'prescription',
  'progression',
  'mobility_warmup_prehab',
  'cooldown_flexibility',
  'weekly_architecture',
])

// =============================================================================
// LEDGER BUILDER
// =============================================================================

export interface BuildRulePopulationLedgerArgs {
  matrix: DoctrineMaterializationMatrix | null | undefined
  /** AA4 truth-to-UI bridge telemetry. When the bridge actually injected
   *  blocks into session.cooldown, cooldown_flexibility is upgraded to
   *  executable regardless of matrix-level visibleSurfaces wording. */
  cooldownFlexBridge?: {
    bridgeBlocksInjected?: number
    bridgeSessionsInjected?: number
  } | null
}

/**
 * Pure derivation. Never throws. Falls back to a `RULES_NOT_AVAILABLE`
 * ledger when the matrix is missing/partial — the audit object must
 * always be present so downstream UI can render an honest empty state.
 */
export function buildRulePopulationLedger(
  args: BuildRulePopulationLedgerArgs,
): RulePopulationLedger {
  const generatedAt = new Date().toISOString()
  const matrix = args?.matrix ?? null
  const bridge = args?.cooldownFlexBridge ?? null

  // ---------------------------------------------------------------------------
  // Defensive empty-state. Returned when the matrix never ran (legacy save,
  // partial regeneration, or runtime contract unavailable). Honest verdict.
  // ---------------------------------------------------------------------------
  if (
    !matrix ||
    !Array.isArray(matrix.categories) ||
    matrix.categories.length === 0
  ) {
    return {
      version: 'ab1-rule-population-ledger-v1',
      generatedAt,
      doctrineRuntimeAvailable: !!matrix?.doctrineRuntimeAvailable,
      categories: [],
      totals: {
        categoriesExecutable: 0,
        categoriesVisible: 0,
        categoriesMutated: 0,
        categoriesScoringOnly: 0,
        categoriesAuditOnly: 0,
        categoriesBlocked: 0,
        categoriesNoTarget: 0,
        categoriesNotRelevant: 0,
        categoriesMaterializerNotConnected: 0,
        totalRulesMaterialized: 0,
        totalRulesRead: 0,
      },
      verdict: 'RULES_NOT_AVAILABLE',
      headline: 'Rule population not available for this program.',
    }
  }

  const entries: RulePopulationLedgerCategoryEntry[] = matrix.categories.map(
    (row): RulePopulationLedgerCategoryEntry => {
      // ---------------------------------------------------------------------
      // Resolve the canonical AB1 state for this category.
      //
      // Priority order (highest wins):
      //   1. status === MATERIALIZER_NOT_CONNECTED → audit_only
      //   2. status === NOT_RELEVANT_TO_CURRENT_PROFILE → suppressed (with
      //      a "not relevant" note — distinct counter on totals)
      //   3. status === BLOCKED_WITH_REASON → blocked
      //   4. status === NOT_READ / NOT_IN_SCHEMA → audit_only
      //   5. status === READ_BUT_AUDIT_ONLY → audit_only
      //   6. status === READ_BUT_SCORING_ONLY → selected
      //   7. status === CONNECTED_AND_MATERIAL → mutated → visible →
      //      executable (each gated by proof — see below)
      //
      // The `mutated → visible → executable` ladder requires PROOF:
      //   • mutated requires changedProgramFields.length > 0
      //   • visible requires visibleSurfaces.length > 0 AND mutated
      //   • executable requires mutated AND category in EXECUTABLE_CATEGORIES
      // ---------------------------------------------------------------------
      const states = new Set<RulePopulationLedgerEntryState>(['loaded'])
      let dominant: RulePopulationLedgerEntryState = 'loaded'

      if (row.rulesRelevant > 0) states.add('candidate')
      if (row.rulesEligible > 0) states.add('eligible')
      if (row.rulesSelected > 0) states.add('selected')

      const mutationProven =
        Array.isArray(row.changedProgramFields) && row.changedProgramFields.length > 0
      const visibilityProven =
        Array.isArray(row.visibleSurfaces) && row.visibleSurfaces.length > 0

      switch (row.status) {
        case 'MATERIALIZER_NOT_CONNECTED':
          states.add('audit_only')
          dominant = 'audit_only'
          break

        case 'NOT_RELEVANT_TO_CURRENT_PROFILE':
          states.add('suppressed')
          dominant = 'suppressed'
          break

        case 'BLOCKED_WITH_REASON':
          states.add('blocked')
          dominant = 'blocked'
          break

        case 'NOT_READ':
        case 'NOT_IN_SCHEMA':
          // Not reachable as "applied" by definition. We treat both as
          // audit_only so the totals do not under-count the "did nothing"
          // bucket the user cares about.
          states.add('audit_only')
          dominant = 'audit_only'
          break

        case 'READ_BUT_AUDIT_ONLY':
          states.add('audit_only')
          dominant = 'audit_only'
          break

        case 'READ_BUT_SCORING_ONLY':
          // Influenced ranking but mutated nothing. Honest "selected".
          states.add('selected')
          dominant = 'selected'
          break

        case 'CONNECTED_AND_MATERIAL': {
          // Apply the proof ladder. CONNECTED_AND_MATERIAL is the matrix's
          // gate for "could mutate"; the ledger demands proof.
          if (mutationProven) {
            states.add('mutated')
            dominant = 'mutated'
            if (visibilityProven) {
              states.add('visible')
              dominant = 'visible'
              if (EXECUTABLE_CATEGORIES.has(row.category)) {
                states.add('executable')
                dominant = 'executable'
              }
            }
          } else if (row.rulesBlocked > 0) {
            // No mutation but rules were blocked — most honest state.
            states.add('blocked')
            dominant = 'blocked'
          } else if (row.rulesSelected > 0 || row.rulesEligible > 0) {
            // Considered but did not mutate. Could be a session where the
            // category legitimately had no target (e.g. top set on a
            // skill-priority day with no loaded anchor).
            states.add('no_target')
            dominant = 'no_target'
          } else {
            // CONNECTED_AND_MATERIAL but no rules selected/blocked/changed.
            // Treat as audit_only rather than over-claiming.
            states.add('audit_only')
            dominant = 'audit_only'
          }
          break
        }

        default:
          // Defensive: any future matrix status we haven't classified yet
          // resolves to audit_only rather than over-counting.
          states.add('audit_only')
          dominant = 'audit_only'
      }

      // ---------------------------------------------------------------------
      // [AA4 bridge upgrade]
      // The AA4 truth-to-UI bridge actually pushes synthesized cooldown
      // exercises into session.cooldown when bridgeBlocksInjected > 0,
      // which means cooldown_flexibility is provably executable. If the
      // matrix row is already CONNECTED_AND_MATERIAL with proof, we have
      // already classified it as executable above; this guard handles the
      // edge case where the matrix proof fields are missing on a saved
      // program but the bridge telemetry survives.
      // ---------------------------------------------------------------------
      if (
        row.category === 'cooldown_flexibility' &&
        bridge &&
        typeof bridge.bridgeBlocksInjected === 'number' &&
        bridge.bridgeBlocksInjected > 0 &&
        !states.has('executable')
      ) {
        states.add('mutated')
        states.add('visible')
        states.add('executable')
        dominant = 'executable'
      }

      return {
        category: row.category,
        state: dominant,
        states: Array.from(states),
        matrixStatus: row.status,
        rulesRead: row.rulesRead,
        rulesRelevant: row.rulesRelevant,
        rulesEligible: row.rulesEligible,
        rulesSelected: row.rulesSelected,
        rulesMaterialized: row.rulesMaterialized,
        rulesBlocked: row.rulesBlocked,
        changedProgramFields: Array.isArray(row.changedProgramFields)
          ? [...row.changedProgramFields]
          : [],
        visibleSurfaces: Array.isArray(row.visibleSurfaces)
          ? [...row.visibleSurfaces]
          : [],
        noChangeReason: row.noChangeReason ?? null,
        notes: row.notes ?? '',
      }
    },
  )

  // ---------------------------------------------------------------------------
  // Aggregates. Each counter is mutually exclusive at the dominant-state
  // level so the user can read "X visible · Y scoring-only · Z blocked"
  // without double-counting. Total rule counts are preserved verbatim.
  // ---------------------------------------------------------------------------
  let categoriesExecutable = 0
  let categoriesVisible = 0
  let categoriesMutated = 0
  let categoriesScoringOnly = 0
  let categoriesAuditOnly = 0
  let categoriesBlocked = 0
  let categoriesNoTarget = 0
  let categoriesNotRelevant = 0
  let categoriesMaterializerNotConnected = 0

  for (const e of entries) {
    if (e.state === 'executable') {
      categoriesExecutable += 1
      categoriesVisible += 1
      categoriesMutated += 1
    } else if (e.state === 'visible') {
      categoriesVisible += 1
      categoriesMutated += 1
    } else if (e.state === 'mutated') {
      categoriesMutated += 1
    } else if (e.state === 'selected') {
      categoriesScoringOnly += 1
    } else if (e.state === 'audit_only') {
      categoriesAuditOnly += 1
      if (e.matrixStatus === 'MATERIALIZER_NOT_CONNECTED') {
        categoriesMaterializerNotConnected += 1
      }
    } else if (e.state === 'blocked') {
      categoriesBlocked += 1
    } else if (e.state === 'no_target') {
      categoriesNoTarget += 1
    } else if (e.state === 'suppressed') {
      // suppressed currently maps 1:1 to NOT_RELEVANT_TO_CURRENT_PROFILE
      categoriesNotRelevant += 1
    }
  }

  const totalRulesMaterialized = entries.reduce(
    (sum, e) => sum + (e.rulesMaterialized || 0),
    0,
  )
  const totalRulesRead = entries.reduce((sum, e) => sum + (e.rulesRead || 0), 0)

  // ---------------------------------------------------------------------------
  // Verdict. AB1 demands honesty: if no category reaches visible/executable,
  // we say "RULES_READ_BUT_NOT_VISIBLE" no matter how many categories are
  // CONNECTED_AND_MATERIAL at the matrix level. This is exactly the user-
  // facing distinction AB1 asked for.
  // ---------------------------------------------------------------------------
  const visibleOrExecutable = categoriesExecutable + categoriesVisible
  let verdict: RulePopulationLedgerVerdict
  let headline: string

  if (!matrix.doctrineRuntimeAvailable) {
    verdict = 'RULES_NOT_AVAILABLE'
    headline = 'Doctrine runtime was not available for this program.'
  } else if (visibleOrExecutable === 0) {
    verdict = 'RULES_READ_BUT_NOT_VISIBLE'
    headline = `${totalRulesRead} rules read · 0 categories visibly changed the program.`
  } else if (
    categoriesAuditOnly === 0 &&
    categoriesScoringOnly === 0 &&
    categoriesMaterializerNotConnected === 0
  ) {
    verdict = 'RULES_VISIBLY_CHANGED_PROGRAM'
    headline = `${categoriesExecutable} categories changed executable training · ${categoriesMutated} total mutated.`
  } else {
    verdict = 'RULES_PARTIALLY_CHANGED_PROGRAM'
    const parts: string[] = []
    if (categoriesExecutable > 0) parts.push(`${categoriesExecutable} executable`)
    if (categoriesVisible - categoriesExecutable > 0) {
      parts.push(`${categoriesVisible - categoriesExecutable} visible`)
    }
    if (categoriesScoringOnly > 0) parts.push(`${categoriesScoringOnly} scoring-only`)
    if (categoriesAuditOnly > 0) parts.push(`${categoriesAuditOnly} audit-only`)
    if (categoriesBlocked > 0) parts.push(`${categoriesBlocked} blocked`)
    if (categoriesNoTarget > 0) parts.push(`${categoriesNoTarget} no target`)
    headline = `Rule population: ${parts.join(' · ')}.`
  }

  return {
    version: 'ab1-rule-population-ledger-v1',
    generatedAt,
    doctrineRuntimeAvailable: !!matrix.doctrineRuntimeAvailable,
    categories: entries,
    totals: {
      categoriesExecutable,
      categoriesVisible,
      categoriesMutated,
      categoriesScoringOnly,
      categoriesAuditOnly,
      categoriesBlocked,
      categoriesNoTarget,
      categoriesNotRelevant,
      categoriesMaterializerNotConnected,
      totalRulesMaterialized,
      totalRulesRead,
    },
    verdict,
    headline,
  }
}

// =============================================================================
// HUMAN-READABLE LABELS (for UI use only — non-authoritative)
// =============================================================================

export const RULE_LEDGER_CATEGORY_LABELS: Record<
  RulePopulationLedgerCategoryKey,
  string
> = {
  exercise_selection: 'Exercise selection',
  carryover_support: 'Carryover & support work',
  method_selection: 'Method structure (grouped)',
  method_selection_row_level: 'Method structure (row-level)',
  prescription: 'Sets / reps / RPE / rest',
  progression: 'Progression & ramp',
  contraindication_safety: 'Joint & contraindication safety',
  mobility_warmup_prehab: 'Warm-up & prehab',
  cooldown_flexibility: 'Cool-down & flexibility',
  weekly_architecture: 'Weekly architecture',
}

export const RULE_LEDGER_STATE_LABELS: Record<
  RulePopulationLedgerEntryState,
  string
> = {
  loaded: 'Loaded',
  candidate: 'Candidate',
  eligible: 'Eligible',
  selected: 'Influenced scoring',
  mutated: 'Changed program',
  visible: 'Visible',
  executable: 'Live workout',
  blocked: 'Blocked',
  suppressed: 'Not relevant',
  no_target: 'No target',
  audit_only: 'Audit only',
}
