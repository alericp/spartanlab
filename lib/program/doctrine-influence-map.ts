/**
 * =============================================================================
 * [PHASE Z2] DOCTRINE UTILIZATION COVERAGE & INFLUENCE MAP
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Phase Z2 answers the question: "We loaded ~1,500 doctrine rules across 10
 * batches. Are they actually shaping the current program, or are they only
 * cosmetic explanation?"
 *
 * This file is a PURE read-only consolidator. It does NOT:
 *   - mutate the program
 *   - re-decide methods, exercises, sets, reps, RPE, rest, skill choice
 *   - load new doctrine
 *   - introduce new dependencies or schema fields
 *
 * It READS data already stamped onto the AdaptiveProgram by earlier phases:
 *   - program.doctrineRuntimeContract.perBatch                (LOADED proof)
 *   - program.doctrineRuntimeContract.doctrineCoverage        (per-category counts)
 *   - program.weeklyMethodRepresentation.byMethod             (per-method APPLIED/BLOCKED/NOT_NEEDED)
 *   - program.methodStructureRollup                           (4P applied counts)
 *   - program.doctrineApplicationRollup                       (4L/4M applied counts)
 *   - program.profileSnapshot.selectedSkills                  (skill targets)
 *   - program.sessions[*].exercises[*]                        (RPE histogram, names, methods)
 *   - runDoctrineCausalityAudit(program).entries / counts     (Phase W per-rule states)
 *
 * It produces ONE compact `DoctrineInfluenceMap` object with:
 *   - status totals (LOADED / EVALUATED / ELIGIBLE / APPLIED / MATERIALIZED /
 *     VISIBLE / SUPPRESSED / BLOCKED / NO_TARGET / LOW_INFLUENCE /
 *     ERROR_OR_UNMAPPED)
 *   - per-batch coverage (10 batches × 7 atom categories)
 *   - per-domain coverage (skill / method / density / prescription / recovery /
 *     sessionLength / safety / progression)
 *   - 3 applied/materialized samples
 *   - 3 suppressed/blocked samples
 *   - 3 no-target samples
 *   - RPE 7 vs 8 verdict with real histogram + gates
 *   - density truth (operational vs label-only)
 *   - method budget per family
 *   - skill coverage per selected skill
 *   - similarity diagnosis (legitimate convergence vs weak doctrine)
 *   - one-line verdict the UI can render verbatim
 *
 * The module never throws — every read is `?.` chained and falls through to
 * a safe "BROKEN_OR_UNMAPPED" entry if upstream data is missing.
 * =============================================================================
 */

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { runDoctrineCausalityAudit } from '@/lib/program/doctrine-causality-audit-contract'
import {
  getUploadedDoctrineBatchKeys,
  type UploadedDoctrineBatchKey,
} from '@/lib/doctrine/source-batches'

// =============================================================================
// PUBLIC TYPES — Phase Z2 utilization vocabulary
// =============================================================================

/**
 * The 11 honest utilization statuses the Phase Z2 prompt requires. Order is
 * intentional (best → worst) so totals can render as a stacked bar.
 */
export type InfluenceStatus =
  | 'LOADED'
  | 'EVALUATED'
  | 'ELIGIBLE'
  | 'SELECTED'
  | 'APPLIED'
  | 'MATERIALIZED'
  | 'VISIBLE'
  | 'SUPPRESSED'
  | 'BLOCKED'
  | 'NO_TARGET'
  | 'LOW_INFLUENCE'
  | 'ERROR_OR_UNMAPPED'

export type InfluenceLevel =
  | 'HIGH'         // applied AND materialized AND visible
  | 'MODERATE'     // applied but mostly suppressed/blocked at structural layer
  | 'LOW'          // evaluated but rarely materialized
  | 'NO_TARGET'    // legitimate — no target in this profile/cycle
  | 'BROKEN'       // counts unmapped / category missing

/** A row in the per-batch table. Each batch maps to an UploadedDoctrineBatchKey. */
export interface InfluenceBatchRow {
  batch: UploadedDoctrineBatchKey
  loaded: number
  /** From perBatch: 'db' or 'fallback'. Tells the user where the rules came from. */
  source: 'db' | 'fallback' | 'unknown'
  /** Eligible/applied counts inferred from the Phase W ledger entries that name this batch. */
  evaluated: number
  applied: number
  materialized: number
  blocked: number
  noTarget: number
  influence: InfluenceLevel
  notes: string
}

/** A row in the per-domain table — independent of batch. */
export interface InfluenceDomainRow {
  domain:
    | 'skill_progression'
    | 'exercise_selection'
    | 'carryover_support'
    | 'method_grouped'        // superset / circuit / density_block
    | 'method_row_level'      // top_set / drop_set / rest_pause / cluster
    | 'density'               // density_block + endurance_density
    | 'prescription'          // sets / reps / RPE / rest
    | 'rpe_intensity'         // RPE-specific diagnostic
    | 'recovery_safety'       // contraindication / recovery overlap
    | 'session_length'        // Full / 45 / 30
    | 'mobility_warmup'       // batch 09
    | 'weekly_architecture'   // session role / stress distribution
  loaded: number
  evaluated: number
  applied: number
  materialized: number
  visible: number
  suppressed: number
  blocked: number
  noTarget: number
  influence: InfluenceLevel
  notes: string
}

/** A concrete sample for the report. */
export interface InfluenceSample {
  ruleId: string
  ruleName: string
  category: string
  status: InfluenceStatus
  /** Day numbers / exercise names this entry touches (best-effort). */
  affects: string[]
  /** What changed (or why it didn't). */
  effectOrReason: string
  /** Stable machine reason for grouping. */
  reasonCode: string
  /** Whether the user can see the effect. */
  userVisible: boolean
}

export interface RpeAnalysis {
  /** Histogram of every numeric targetRPE seen across exercises. */
  histogram: Record<string, number> // { '6': 12, '7': 18, '8': 4, ... }
  totalExercises: number
  rpe7Count: number
  rpe7AndBelowCount: number
  rpe8Count: number
  rpe8AndAboveCount: number
  rpe7Share: number  // 0..1
  rpe8Share: number  // 0..1
  /** Plain English verdict. */
  verdict: 'RPE7_LEGITIMATE' | 'RPE7_OVERUSED' | 'RPE8_DOMINANT' | 'MIXED' | 'INSUFFICIENT_DATA'
  /** Concrete gates that capped intensity (read from the program's stamps). */
  intensityGates: string[]
  oneLine: string
}

export interface DensityAnalysis {
  /** From weeklyMethodRepresentation.byMethod. */
  densityBlockStatus: 'APPLIED' | 'BLOCKED_BY_SAFETY' | 'NOT_NEEDED_FOR_PROFILE' | 'MATERIALIZER_NOT_CONNECTED' | 'UNKNOWN'
  enduranceDensityStatus: 'APPLIED' | 'BLOCKED_BY_SAFETY' | 'NOT_NEEDED_FOR_PROFILE' | 'MATERIALIZER_NOT_CONNECTED' | 'UNKNOWN'
  /** True iff at least one session.styleMetadata.hasDensityApplied is true. */
  appliedAtLeastOnce: boolean
  /** True iff density appears as a chip/label only with no structural change. */
  labelOnly: boolean
  /** Plain English verdict. */
  verdict: 'OPERATIONAL' | 'LIMITED' | 'LABEL_ONLY' | 'BLOCKED' | 'NO_DENSITY'
  oneLine: string
}

export interface MethodBudgetAnalysis {
  /** Echo of weeklyMethodRepresentation.byMethod, classified into Z2 vocabulary. */
  perMethod: Array<{
    method: string
    status: 'APPLIED' | 'BLOCKED_BY_SAFETY' | 'NOT_NEEDED_FOR_PROFILE' | 'MATERIALIZER_NOT_CONNECTED' | 'UNKNOWN'
    materializedCount: number
    reason: string
  }>
  totalApplied: number
  totalBlocked: number
  totalNotNeeded: number
  totalMaterializerMissing: number
  oneLine: string
}

export interface SkillCoverageAnalysis {
  selectedSkills: string[]
  perSkill: Array<{
    skill: string
    directCount: number       // exercises whose name contains the skill token
    carryoverCount: number    // exercises whose category/role suggests support
    expressed: boolean
    note: string
  }>
  expressedCount: number
  missingSkills: string[]
  oneLine: string
}

export type SimilarityCause =
  | 'A_LEGITIMATE_CONVERGENCE'
  | 'B_SAFETY_ACCLIMATION_GATES'
  | 'C_WEAK_DOCTRINE_INFLUENCE'
  | 'D_PROJECTION_LOSS'
  | 'E_DETERMINISTIC_TEMPLATE'
  | 'F_STALE_SAVED_REPLAY'
  | 'G_UNDER_CALIBRATED_DIVERSITY'

export interface SimilarityDiagnosis {
  primaryCause: SimilarityCause
  oneLine: string
  evidence: string[]
}

export interface DoctrineInfluenceMap {
  version: 'phase-z2.influence-map.v1'
  generatedAt: string
  /** Honest top-level verdict. */
  verdict: 'PASS' | 'PARTIAL' | 'FAIL'
  /** One-line athlete-readable summary. */
  oneLine: string
  /** Aggregate counts per Z2 status. */
  statusTotals: Record<InfluenceStatus, number>
  /** 10-batch coverage table. */
  byBatch: InfluenceBatchRow[]
  /** Per-domain coverage table. */
  byDomain: InfluenceDomainRow[]
  /** 3 applied/materialized samples. */
  samplesApplied: InfluenceSample[]
  /** 3 suppressed/blocked samples. */
  samplesSuppressed: InfluenceSample[]
  /** 3 no-target samples. */
  samplesNoTarget: InfluenceSample[]
  /** RPE 7 vs 8 answer with real histogram and gates. */
  rpeAnalysis: RpeAnalysis
  /** Density truth. */
  densityAnalysis: DensityAnalysis
  /** Method budget per family. */
  methodBudgetAnalysis: MethodBudgetAnalysis
  /** Skill coverage answer. */
  skillCoverageAnalysis: SkillCoverageAnalysis
  /** Why does the program still look similar? */
  similarityDiagnosis: SimilarityDiagnosis
  /** Set when a downstream artifact is malformed; the map is still safe to render. */
  error?: string
}

// =============================================================================
// READ-ONLY VIEWS — defensively typed, every field optional
// =============================================================================

interface PerBatchView {
  dbTotal?: number
  fallbackTotal?: number
  filled?: 'db' | 'fallback'
}

interface DoctrineCoverageView {
  totalRules?: number
  progressionRuleCount?: number
  exerciseSelectionRuleCount?: number
  methodRuleCount?: number
  prescriptionRuleCount?: number
  carryoverRuleCount?: number
}

interface RuntimeContractView {
  available?: boolean
  perBatch?: Record<string, PerBatchView>
  doctrineCoverage?: DoctrineCoverageView
}

interface WeeklyMethodEntryView {
  methodId?: string
  status?: string
  materializedCount?: number
  reason?: string
  hasMaterializer?: boolean
}

interface WeeklyMethodRepresentationView {
  byMethod?: WeeklyMethodEntryView[]
  totals?: {
    methodsApplied?: number
    methodsBlockedBySafety?: number
    methodsNotNeeded?: number
    methodsMaterializerNotConnected?: number
  }
}

interface ExerciseView {
  name?: string | null
  exerciseName?: string | null
  category?: string | null
  role?: string | null
  selectionReason?: string | null
  setExecutionMethod?: string | null
  method?: string | null
  methodLabel?: string | null
  targetRPE?: number | null
  blockId?: string | null
  skillTags?: string[] | null
}

interface SessionView {
  dayNumber?: number
  exercises?: ExerciseView[]
  styleMetadata?: {
    hasDensityApplied?: boolean
    hasClusterApplied?: boolean
    hasSupersetsApplied?: boolean
    hasCircuitsApplied?: boolean
    appliedMethods?: string[]
  }
}

interface ProgramView {
  doctrineRuntimeContract?: RuntimeContractView | null
  weeklyMethodRepresentation?: WeeklyMethodRepresentationView | null
  profileSnapshot?: {
    selectedSkills?: string[] | null
  } | null
  sessions?: SessionView[] | null
}

// =============================================================================
// HELPERS
// =============================================================================

function safeCount(n: number | null | undefined): number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0
}

function emptyStatusTotals(): Record<InfluenceStatus, number> {
  return {
    LOADED: 0,
    EVALUATED: 0,
    ELIGIBLE: 0,
    SELECTED: 0,
    APPLIED: 0,
    MATERIALIZED: 0,
    VISIBLE: 0,
    SUPPRESSED: 0,
    BLOCKED: 0,
    NO_TARGET: 0,
    LOW_INFLUENCE: 0,
    ERROR_OR_UNMAPPED: 0,
  }
}

function tokenize(s: string | null | undefined): string {
  if (!s) return ''
  return s.toLowerCase().replace(/[\s_\-]+/g, '')
}

function influenceFromCounts(args: {
  loaded: number
  applied: number
  materialized: number
  blocked: number
  noTarget: number
  visible?: number
}): InfluenceLevel {
  if (args.loaded === 0) return 'BROKEN'
  if (args.materialized > 0 && (args.visible === undefined || args.visible > 0)) return 'HIGH'
  if (args.applied > 0) return 'MODERATE'
  if (args.noTarget > 0 && args.applied === 0 && args.materialized === 0) return 'NO_TARGET'
  return 'LOW'
}

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================

export function buildDoctrineInfluenceMap(
  program: AdaptiveProgram | null | undefined,
): DoctrineInfluenceMap {
  const generatedAt = new Date().toISOString()
  const empty: DoctrineInfluenceMap = {
    version: 'phase-z2.influence-map.v1',
    generatedAt,
    verdict: 'FAIL',
    oneLine: 'No program available — doctrine influence map cannot be computed.',
    statusTotals: emptyStatusTotals(),
    byBatch: [],
    byDomain: [],
    samplesApplied: [],
    samplesSuppressed: [],
    samplesNoTarget: [],
    rpeAnalysis: {
      histogram: {},
      totalExercises: 0,
      rpe7Count: 0,
      rpe7AndBelowCount: 0,
      rpe8Count: 0,
      rpe8AndAboveCount: 0,
      rpe7Share: 0,
      rpe8Share: 0,
      verdict: 'INSUFFICIENT_DATA',
      intensityGates: [],
      oneLine: 'No exercises available for RPE analysis.',
    },
    densityAnalysis: {
      densityBlockStatus: 'UNKNOWN',
      enduranceDensityStatus: 'UNKNOWN',
      appliedAtLeastOnce: false,
      labelOnly: false,
      verdict: 'NO_DENSITY',
      oneLine: 'Density not computable without a program.',
    },
    methodBudgetAnalysis: {
      perMethod: [],
      totalApplied: 0,
      totalBlocked: 0,
      totalNotNeeded: 0,
      totalMaterializerMissing: 0,
      oneLine: 'No method budget data.',
    },
    skillCoverageAnalysis: {
      selectedSkills: [],
      perSkill: [],
      expressedCount: 0,
      missingSkills: [],
      oneLine: 'No selected skills available.',
    },
    similarityDiagnosis: {
      primaryCause: 'C_WEAK_DOCTRINE_INFLUENCE',
      oneLine: 'No program — cannot diagnose similarity.',
      evidence: [],
    },
    error: 'no_program',
  }

  if (!program) return empty

  const view = program as unknown as ProgramView
  const totals = emptyStatusTotals()

  // ---------------------------------------------------------------------------
  // 1. LOADED — runtime contract per-batch + 10-batch coverage.
  // ---------------------------------------------------------------------------
  const perBatch = view.doctrineRuntimeContract?.perBatch ?? {}
  const expectedBatchKeys = getUploadedDoctrineBatchKeys()
  const batchAtomCounts = new Map<UploadedDoctrineBatchKey, number>()
  let totalLoaded = 0
  for (const bk of expectedBatchKeys) {
    const stat = perBatch[bk]
    const dbTotal = safeCount(stat?.dbTotal)
    const fbTotal = safeCount(stat?.fallbackTotal)
    const count = stat?.filled === 'db' ? dbTotal : fbTotal
    batchAtomCounts.set(bk, count)
    totalLoaded += count
  }
  totals.LOADED = totalLoaded

  // ---------------------------------------------------------------------------
  // 2. Phase W causality audit — single source of truth for state buckets.
  // ---------------------------------------------------------------------------
  let ledger
  try {
    ledger = runDoctrineCausalityAudit(program)
  } catch {
    ledger = null
  }

  if (ledger) {
    totals.MATERIALIZED = ledger.counts.materialized
    totals.APPLIED = ledger.counts.materialized + ledger.counts.appliedNoStructuralChange
    totals.SELECTED = totals.APPLIED // selected ⇒ applied at this audit's granularity
    totals.ELIGIBLE = totals.APPLIED + ledger.counts.eligibleSuppressed
    totals.EVALUATED =
      totals.ELIGIBLE +
      ledger.counts.evaluatedNotEligible +
      ledger.counts.acknowledgedOnly +
      ledger.counts.postHocOnly +
      ledger.counts.displayedOnly
    totals.VISIBLE = ledger.counts.materialized + ledger.counts.appliedNoStructuralChange
    totals.SUPPRESSED = ledger.counts.eligibleSuppressed
    totals.BLOCKED = ledger.counts.blockedByRuntime
    totals.NO_TARGET = ledger.counts.evaluatedNotEligible + ledger.counts.notEvaluated
    totals.LOW_INFLUENCE =
      ledger.counts.acknowledgedOnly + ledger.counts.postHocOnly + ledger.counts.displayedOnly
    totals.ERROR_OR_UNMAPPED = ledger.counts.unknownUnverified
  }

  // ---------------------------------------------------------------------------
  // 3. Build the 10-batch table. Per-batch evaluated/applied counts are
  //    inferred from the ledger entries when their reasonText/proofSummary
  //    references a batch token, otherwise we report only LOADED honestly.
  // ---------------------------------------------------------------------------
  const ledgerEntries = ledger?.entries ?? []
  const byBatch: InfluenceBatchRow[] = []
  for (const bk of expectedBatchKeys) {
    const stat = perBatch[bk]
    const loaded = batchAtomCounts.get(bk) ?? 0
    const source: 'db' | 'fallback' | 'unknown' =
      stat?.filled === 'db' ? 'db' : stat?.filled === 'fallback' ? 'fallback' : 'unknown'
    // Heuristic per-batch attribution — if an entry's ruleId or proofSummary
    // contains the batch key (e.g. "batch_07"), credit it to that batch.
    const tokens = [bk, bk.replace('_', '-'), bk.replace('_', '')]
    const matched = ledgerEntries.filter(e => {
      const blob = `${e.ruleId} ${e.ruleName} ${e.proofSummary} ${e.reasonText}`.toLowerCase()
      return tokens.some(t => blob.includes(t))
    })
    const evaluated = matched.length
    const applied = matched.filter(e => e.applied).length
    const materialized = matched.filter(e => e.materialized).length
    const blocked = matched.filter(e => e.blocked).length
    const noTarget = matched.filter(e => e.state === 'NOT_EVALUATED' || e.state === 'EVALUATED_NOT_ELIGIBLE').length

    byBatch.push({
      batch: bk,
      loaded,
      source,
      evaluated,
      applied,
      materialized,
      blocked,
      noTarget,
      influence: influenceFromCounts({ loaded, applied, materialized, blocked, noTarget }),
      notes:
        loaded === 0
          ? 'no atoms reached runtime — check db/fallback fill for this batch'
          : evaluated === 0
            ? 'atoms loaded but no per-rule attribution from Phase W ledger (rules may apply via aggregate scoring)'
            : `${applied} applied / ${materialized} materialized / ${blocked} blocked`,
    })
  }

  // ---------------------------------------------------------------------------
  // 4. Per-domain rollup. We seed with the runtime coverage (LOADED) and use
  //    Phase W entry categories for evaluated/applied/materialized.
  // ---------------------------------------------------------------------------
  const cov = view.doctrineRuntimeContract?.doctrineCoverage
  const byDomain: InfluenceDomainRow[] = []

  function entriesByCategory(...cats: string[]): typeof ledgerEntries {
    const set = new Set(cats.map(c => c.toLowerCase()))
    return ledgerEntries.filter(e => set.has(String(e.category).toLowerCase()))
  }

  function makeDomainRow(
    domain: InfluenceDomainRow['domain'],
    loaded: number,
    entries: typeof ledgerEntries,
    note: string,
  ): InfluenceDomainRow {
    const evaluated = entries.length
    const applied = entries.filter(e => e.applied).length
    const materialized = entries.filter(e => e.materialized).length
    const visible = entries.filter(e => e.userVisibleSurface && e.userVisibleSurface !== 'none').length
    const suppressed = entries.filter(e => e.suppressed).length
    const blocked = entries.filter(e => e.blocked).length
    const noTarget = entries.filter(
      e => e.state === 'NOT_EVALUATED' || e.state === 'EVALUATED_NOT_ELIGIBLE',
    ).length
    return {
      domain,
      loaded,
      evaluated,
      applied,
      materialized,
      visible,
      suppressed,
      blocked,
      noTarget,
      influence: influenceFromCounts({ loaded, applied, materialized, blocked, noTarget, visible }),
      notes: note,
    }
  }

  byDomain.push(
    makeDomainRow(
      'skill_progression',
      safeCount(cov?.progressionRuleCount),
      entriesByCategory('skill', 'skill_progression', 'progression'),
      'progression rules from doctrineCoverage',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'exercise_selection',
      safeCount(cov?.exerciseSelectionRuleCount),
      entriesByCategory('exercise_selection', 'selection'),
      'selection rules; affects ranking + winner flips',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'carryover_support',
      safeCount(cov?.carryoverRuleCount),
      entriesByCategory('carryover', 'carryover_support'),
      'support-slot allocation + skill carryover map',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'method_grouped',
      safeCount(cov?.methodRuleCount),
      entriesByCategory('method', 'method_grouped'),
      'superset / circuit / density_block grouped materializer',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'method_row_level',
      0,
      entriesByCategory('method_row_level', 'row_level_method'),
      'top_set / drop_set / rest_pause / cluster row-level mutator',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'density',
      0,
      entriesByCategory('density'),
      'density_block (grouped) + endurance_density (rolled into grouped)',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'prescription',
      safeCount(cov?.prescriptionRuleCount),
      entriesByCategory('prescription'),
      'sets / reps / holds / RPE / rest writers',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'rpe_intensity',
      0,
      entriesByCategory('rpe', 'intensity', 'prescription_rpe'),
      'RPE acclimation + tendon-aware caps',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'recovery_safety',
      0,
      entriesByCategory('recovery', 'safety', 'contraindication'),
      'pulling/pressing overlap + joint/tendon safety',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'session_length',
      0,
      entriesByCategory('session_length', 'sessionLength'),
      'Full / 45 / 30 minute structural variants',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'mobility_warmup',
      0,
      entriesByCategory('mobility', 'warmup', 'cooldown', 'flexibility'),
      'batch 09 — flexibility / mobility / warmup / cooldown',
    ),
  )
  byDomain.push(
    makeDomainRow(
      'weekly_architecture',
      0,
      entriesByCategory('weekly', 'session_role', 'weekly_architecture'),
      'session role + stress distribution',
    ),
  )

  // ---------------------------------------------------------------------------
  // 5. Sample picking — 3 applied/materialized, 3 suppressed/blocked, 3 no-target.
  // ---------------------------------------------------------------------------
  const samplesApplied: InfluenceSample[] = ledgerEntries
    .filter(e => e.materialized || e.state === 'MATERIALIZED' || e.state === 'APPLIED_NO_STRUCTURAL_CHANGE')
    .slice(0, 3)
    .map(e => ({
      ruleId: e.ruleId || 'unknown',
      ruleName: e.ruleName || 'unknown',
      category: e.category || 'unknown',
      status: e.materialized ? 'MATERIALIZED' : 'APPLIED',
      affects: [
        ...e.affectedSessionIds.slice(0, 2).map(id => `day:${id}`),
        ...e.affectedExerciseIds.slice(0, 2).map(id => `ex:${id}`),
        ...e.affectedMethodIds.slice(0, 2).map(id => `method:${id}`),
      ],
      effectOrReason: e.proofSummary || e.reasonText || 'applied',
      reasonCode: e.reasonCode || 'applied',
      userVisible: !!e.userVisibleSurface && e.userVisibleSurface !== 'none',
    }))

  const samplesSuppressed: InfluenceSample[] = ledgerEntries
    .filter(e => e.suppressed || e.blocked || e.state === 'ELIGIBLE_SUPPRESSED' || e.state === 'BLOCKED_BY_RUNTIME')
    .slice(0, 3)
    .map(e => ({
      ruleId: e.ruleId || 'unknown',
      ruleName: e.ruleName || 'unknown',
      category: e.category || 'unknown',
      status: e.blocked ? 'BLOCKED' : 'SUPPRESSED',
      affects: [
        ...e.affectedSessionIds.slice(0, 2).map(id => `day:${id}`),
        ...e.affectedExerciseIds.slice(0, 2).map(id => `ex:${id}`),
      ],
      effectOrReason: e.reasonText || e.proofSummary || 'held back',
      reasonCode: e.reasonCode || 'suppressed',
      userVisible: !!e.userVisibleSurface && e.userVisibleSurface !== 'none',
    }))

  const samplesNoTarget: InfluenceSample[] = ledgerEntries
    .filter(
      e =>
        e.state === 'NOT_EVALUATED' ||
        e.state === 'EVALUATED_NOT_ELIGIBLE' ||
        (!e.applied && !e.materialized && !e.suppressed && !e.blocked),
    )
    .slice(0, 3)
    .map(e => ({
      ruleId: e.ruleId || 'unknown',
      ruleName: e.ruleName || 'unknown',
      category: e.category || 'unknown',
      status: 'NO_TARGET',
      affects: [],
      effectOrReason: e.reasonText || 'no target in current profile/cycle',
      reasonCode: e.reasonCode || 'no_target',
      userVisible: false,
    }))

  // ---------------------------------------------------------------------------
  // 6. RPE histogram + verdict.
  // ---------------------------------------------------------------------------
  const histogram: Record<string, number> = {}
  let totalExercises = 0
  let rpe7Count = 0
  let rpe8Count = 0
  let rpe7AndBelow = 0
  let rpe8AndAbove = 0
  for (const session of view.sessions ?? []) {
    for (const ex of session.exercises ?? []) {
      const rpe = typeof ex.targetRPE === 'number' ? ex.targetRPE : null
      if (rpe === null || !Number.isFinite(rpe)) continue
      totalExercises += 1
      const key = String(Math.round(rpe))
      histogram[key] = (histogram[key] ?? 0) + 1
      if (rpe === 7) rpe7Count += 1
      if (rpe === 8) rpe8Count += 1
      if (rpe <= 7) rpe7AndBelow += 1
      if (rpe >= 8) rpe8AndAbove += 1
    }
  }
  const rpe7Share = totalExercises > 0 ? rpe7Count / totalExercises : 0
  const rpe8Share = totalExercises > 0 ? rpe8Count / totalExercises : 0
  const intensityGates: string[] = []
  // Heuristic gate detection — Phase W ledger entries with reasonCode tokens.
  for (const e of ledgerEntries) {
    const code = (e.reasonCode || '').toLowerCase()
    if (code.includes('acclim') || code.includes('rpe_cap') || code.includes('tendon')) {
      intensityGates.push(e.ruleName || code)
    }
  }
  const uniqueGates = Array.from(new Set(intensityGates)).slice(0, 6)

  let rpeVerdict: RpeAnalysis['verdict']
  let rpeOneLine: string
  if (totalExercises === 0) {
    rpeVerdict = 'INSUFFICIENT_DATA'
    rpeOneLine = 'No exercises with numeric RPE found.'
  } else if (rpe7AndBelow / totalExercises > 0.8 && uniqueGates.length === 0) {
    rpeVerdict = 'RPE7_OVERUSED'
    rpeOneLine = `RPE 7 dominates (${Math.round((rpe7AndBelow / totalExercises) * 100)}% at or below RPE 7) and no explicit acclimation/tendon gate was found — likely overused.`
  } else if (rpe7AndBelow / totalExercises > 0.6 && uniqueGates.length > 0) {
    rpeVerdict = 'RPE7_LEGITIMATE'
    rpeOneLine = `RPE 7 conservative — gated by ${uniqueGates.length} intensity rule(s) (${uniqueGates.slice(0, 2).join(', ')}…).`
  } else if (rpe8Share > 0.4) {
    rpeVerdict = 'RPE8_DOMINANT'
    rpeOneLine = `RPE 8 leads (${Math.round(rpe8Share * 100)}%) — strength/hypertrophy intensity is being expressed.`
  } else {
    rpeVerdict = 'MIXED'
    rpeOneLine = `Mixed intensity: RPE 7 ${Math.round(rpe7Share * 100)}%, RPE 8 ${Math.round(rpe8Share * 100)}%.`
  }

  const rpeAnalysis: RpeAnalysis = {
    histogram,
    totalExercises,
    rpe7Count,
    rpe7AndBelowCount: rpe7AndBelow,
    rpe8Count,
    rpe8AndAboveCount: rpe8AndAbove,
    rpe7Share,
    rpe8Share,
    verdict: rpeVerdict,
    intensityGates: uniqueGates,
    oneLine: rpeOneLine,
  }

  // ---------------------------------------------------------------------------
  // 7. Density analysis from weeklyMethodRepresentation.
  // ---------------------------------------------------------------------------
  const wmr = view.weeklyMethodRepresentation
  const byMethod = wmr?.byMethod ?? []
  function methodEntry(id: string): WeeklyMethodEntryView | null {
    return byMethod.find(m => m.methodId === id) ?? null
  }
  function statusOf(e: WeeklyMethodEntryView | null): DensityAnalysis['densityBlockStatus'] {
    const s = (e?.status ?? '').toUpperCase()
    if (s === 'APPLIED') return 'APPLIED'
    if (s === 'BLOCKED_BY_SAFETY') return 'BLOCKED_BY_SAFETY'
    if (s === 'NOT_NEEDED_FOR_PROFILE') return 'NOT_NEEDED_FOR_PROFILE'
    if (s === 'MATERIALIZER_NOT_CONNECTED') return 'MATERIALIZER_NOT_CONNECTED'
    return 'UNKNOWN'
  }
  const densityBlock = methodEntry('density_block')
  const enduranceDensity = methodEntry('endurance_density')
  const densityBlockStatus = statusOf(densityBlock)
  const enduranceDensityStatus = statusOf(enduranceDensity)

  let appliedAtLeastOnce = false
  for (const session of view.sessions ?? []) {
    if (session.styleMetadata?.hasDensityApplied === true) {
      appliedAtLeastOnce = true
      break
    }
  }
  const labelOnly =
    !appliedAtLeastOnce &&
    (densityBlockStatus === 'APPLIED' || enduranceDensityStatus === 'APPLIED')

  let densityVerdict: DensityAnalysis['verdict']
  let densityOneLine: string
  if (densityBlockStatus === 'APPLIED' && appliedAtLeastOnce) {
    densityVerdict = 'OPERATIONAL'
    densityOneLine = `Density operational — grouped density_block stamped on at least one session (${safeCount(densityBlock?.materializedCount)} block(s)).`
  } else if (densityBlockStatus === 'BLOCKED_BY_SAFETY') {
    densityVerdict = 'BLOCKED'
    densityOneLine = `Density blocked: ${densityBlock?.reason || 'safety/recovery gate held it back'}.`
  } else if (densityBlockStatus === 'NOT_NEEDED_FOR_PROFILE') {
    densityVerdict = 'NO_DENSITY'
    densityOneLine = 'Density not needed for this profile (skill priority + acclimation).'
  } else if (labelOnly) {
    densityVerdict = 'LABEL_ONLY'
    densityOneLine = 'Density appears as a method label but no session has hasDensityApplied=true — label only.'
  } else if (densityBlockStatus === 'MATERIALIZER_NOT_CONNECTED' || enduranceDensityStatus === 'MATERIALIZER_NOT_CONNECTED') {
    densityVerdict = 'LIMITED'
    densityOneLine = 'Density partial — endurance_density has no row-level writer; only grouped density_block can materialize.'
  } else {
    densityVerdict = 'NO_DENSITY'
    densityOneLine = 'No density methods active in this cycle.'
  }

  const densityAnalysis: DensityAnalysis = {
    densityBlockStatus,
    enduranceDensityStatus,
    appliedAtLeastOnce,
    labelOnly,
    verdict: densityVerdict,
    oneLine: densityOneLine,
  }

  // ---------------------------------------------------------------------------
  // 8. Method budget per family.
  // ---------------------------------------------------------------------------
  const perMethod = byMethod.map(m => ({
    method: m.methodId || 'unknown',
    status: statusOf(m),
    materializedCount: safeCount(m.materializedCount),
    reason: m.reason || '',
  }))
  const totalApplied = perMethod.filter(m => m.status === 'APPLIED').length
  const totalBlocked = perMethod.filter(m => m.status === 'BLOCKED_BY_SAFETY').length
  const totalNotNeeded = perMethod.filter(m => m.status === 'NOT_NEEDED_FOR_PROFILE').length
  const totalMatMissing = perMethod.filter(m => m.status === 'MATERIALIZER_NOT_CONNECTED').length
  const methodBudgetAnalysis: MethodBudgetAnalysis = {
    perMethod,
    totalApplied,
    totalBlocked,
    totalNotNeeded,
    totalMaterializerMissing: totalMatMissing,
    oneLine:
      perMethod.length === 0
        ? 'Method budget data unavailable.'
        : `${totalApplied} applied · ${totalBlocked} blocked · ${totalNotNeeded} not needed · ${totalMatMissing} materializer-gap`,
  }

  // ---------------------------------------------------------------------------
  // 9. Skill coverage — direct + carryover detection per selectedSkill.
  // ---------------------------------------------------------------------------
  const selectedSkills = view.profileSnapshot?.selectedSkills ?? []
  const sessions = view.sessions ?? []
  const allExercises: ExerciseView[] = sessions.flatMap(s => s.exercises ?? [])
  const perSkill = selectedSkills.map(skill => {
    const skillToken = tokenize(skill)
    let directCount = 0
    let carryoverCount = 0
    for (const ex of allExercises) {
      const nameToken = tokenize(ex.name || ex.exerciseName || '')
      const catToken = tokenize(ex.category || '')
      const tagsToken = (ex.skillTags ?? []).map(t => tokenize(t)).join(',')
      const blob = `${nameToken}|${catToken}|${tagsToken}`
      if (skillToken.length >= 3 && nameToken.includes(skillToken)) {
        directCount += 1
      } else if (skillToken.length >= 3 && blob.includes(skillToken)) {
        carryoverCount += 1
      }
    }
    return {
      skill,
      directCount,
      carryoverCount,
      expressed: directCount + carryoverCount > 0,
      note:
        directCount > 0
          ? `direct work present (${directCount} ex)`
          : carryoverCount > 0
            ? `via carryover/tags (${carryoverCount} ex)`
            : 'no direct or carryover match — likely missing or tag mismatch',
    }
  })
  const expressedCount = perSkill.filter(p => p.expressed).length
  const missingSkills = perSkill.filter(p => !p.expressed).map(p => p.skill)
  const skillCoverageAnalysis: SkillCoverageAnalysis = {
    selectedSkills,
    perSkill,
    expressedCount,
    missingSkills,
    oneLine:
      selectedSkills.length === 0
        ? 'No selected skills — coverage not applicable.'
        : `${expressedCount}/${selectedSkills.length} expressed${missingSkills.length > 0 ? ` · missing: ${missingSkills.slice(0, 3).join(', ')}` : ''}`,
  }

  // ---------------------------------------------------------------------------
  // 10. Similarity diagnosis — pick the best-supported cause.
  // ---------------------------------------------------------------------------
  let primaryCause: SimilarityCause = 'A_LEGITIMATE_CONVERGENCE'
  const evidence: string[] = []

  const materializedShare =
    totals.MATERIALIZED + totals.APPLIED > 0
      ? totals.MATERIALIZED / Math.max(1, totals.MATERIALIZED + totals.APPLIED)
      : 0
  const cosmeticShare =
    totals.LOW_INFLUENCE / Math.max(1, totals.EVALUATED || 1)

  if (totalLoaded === 0) {
    primaryCause = 'D_PROJECTION_LOSS'
    evidence.push('runtime contract reports zero loaded atoms across all 10 batches')
  } else if (materializedShare >= 0.5 && totals.MATERIALIZED >= 5) {
    primaryCause = 'A_LEGITIMATE_CONVERGENCE'
    evidence.push(`${totals.MATERIALIZED} materialized rules vs ${totals.APPLIED} total applied`)
    evidence.push(`${expressedCount}/${selectedSkills.length} selected skills expressed`)
    evidence.push(`density verdict: ${densityVerdict}`)
  } else if (totals.SUPPRESSED + totals.BLOCKED > totals.MATERIALIZED * 2) {
    primaryCause = 'B_SAFETY_ACCLIMATION_GATES'
    evidence.push(
      `suppressed/blocked (${totals.SUPPRESSED + totals.BLOCKED}) > 2× materialized (${totals.MATERIALIZED})`,
    )
    if (uniqueGates.length > 0) evidence.push(`active intensity gates: ${uniqueGates.slice(0, 3).join(', ')}`)
  } else if (cosmeticShare > 0.4) {
    primaryCause = 'C_WEAK_DOCTRINE_INFLUENCE'
    evidence.push(
      `low-influence (acknowledged + post-hoc + display-only) is ${Math.round(cosmeticShare * 100)}% of evaluated rules`,
    )
  } else if (totals.MATERIALIZED === 0 && totals.APPLIED > 0) {
    primaryCause = 'D_PROJECTION_LOSS'
    evidence.push('rules applied internally but materialized = 0 (likely demoted during projection)')
  } else if (totalLoaded > 0 && totals.EVALUATED === 0) {
    primaryCause = 'E_DETERMINISTIC_TEMPLATE'
    evidence.push('atoms loaded but Phase W ledger has no entries — generator may be skipping per-rule decisions')
  } else {
    primaryCause = 'A_LEGITIMATE_CONVERGENCE'
    evidence.push('mixed signals; default to legitimate convergence pending more data')
  }

  const similarityCopy: Record<SimilarityCause, string> = {
    A_LEGITIMATE_CONVERGENCE: 'Program is converging on fundamentals because doctrine + safety gates legitimately point there.',
    B_SAFETY_ACCLIMATION_GATES: 'Program is conservative because safety/acclimation gates correctly outrank diversity rules this cycle.',
    C_WEAK_DOCTRINE_INFLUENCE: 'Doctrine influence is weak — most evaluated rules end up acknowledged/post-hoc rather than applied.',
    D_PROJECTION_LOSS: 'Doctrine influence is being lost during projection — rules applied internally but did not survive to visible output.',
    E_DETERMINISTIC_TEMPLATE: 'Generator may be falling back to a deterministic template (no per-rule decision was recorded).',
    F_STALE_SAVED_REPLAY: 'Output may be a stale saved program replay — rules ran but the visible plan is from a prior cycle.',
    G_UNDER_CALIBRATED_DIVERSITY: 'Method/style diversity is under-calibrated — applied rules cluster around the same few decisions.',
  }
  const similarityDiagnosis: SimilarityDiagnosis = {
    primaryCause,
    oneLine: similarityCopy[primaryCause],
    evidence,
  }

  // ---------------------------------------------------------------------------
  // 11. Verdict + summary line.
  // ---------------------------------------------------------------------------
  let verdict: 'PASS' | 'PARTIAL' | 'FAIL'
  let oneLine: string
  if (totalLoaded === 0) {
    verdict = 'FAIL'
    oneLine = 'Doctrine corpus did not reach the runtime — zero loaded atoms.'
  } else if (totals.MATERIALIZED >= 3 && expressedCount >= Math.max(1, Math.floor(selectedSkills.length * 0.6))) {
    verdict = 'PASS'
    oneLine = `Doctrine is active: ${totals.MATERIALIZED} rule(s) materialized, ${expressedCount}/${selectedSkills.length} skills expressed, density ${densityVerdict.toLowerCase()}.`
  } else if (totals.APPLIED > 0 || totals.MATERIALIZED > 0) {
    verdict = 'PARTIAL'
    oneLine = `Doctrine partial: ${totals.MATERIALIZED} materialized, ${totals.APPLIED} applied, ${totals.SUPPRESSED} suppressed.`
  } else {
    verdict = 'FAIL'
    oneLine = 'Doctrine loaded but no applied/materialized rules detected by Phase W audit.'
  }

  return {
    version: 'phase-z2.influence-map.v1',
    generatedAt,
    verdict,
    oneLine,
    statusTotals: totals,
    byBatch,
    byDomain,
    samplesApplied,
    samplesSuppressed,
    samplesNoTarget,
    rpeAnalysis,
    densityAnalysis,
    methodBudgetAnalysis,
    skillCoverageAnalysis,
    similarityDiagnosis,
  }
}
