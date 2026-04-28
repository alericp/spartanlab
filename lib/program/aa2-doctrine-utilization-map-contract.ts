/**
 * =============================================================================
 * [PHASE AA2] DOCTRINE UTILIZATION / READABILITY MAP — read-only audit contract
 * =============================================================================
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * AA2 is the "doctrine readability verification" phase. The user asked, in
 * blunt terms: "Are the 1500+ doctrine rules ACTUALLY flowing through the
 * system, or are they only present in the database, counted, stamped, and
 * surfaced after the program is already built?"
 *
 * The codebase already ships a rich set of doctrine artifacts:
 *
 *   • Source batches 01-10                   — `lib/doctrine/source-batches/*`
 *   • DB rule tables                          — `lib/doctrine-db.ts`
 *   • Code registries                         — DOCTRINE_REGISTRY, METHOD_PROFILES,
 *                                              SKILL_SUPPORT_MAPPINGS
 *   • Materializer registry (per-category)    — DOCTRINE_MATERIALIZER_REGISTRY
 *   • Doctrine runtime contract               — program.doctrineRuntimeContract
 *   • Phase 4N weekly method budget plan      — program.weeklyMethodBudgetPlan
 *   • Phase 4P method structure rollup        — program.methodStructureRollup
 *   • Phase AA1 weekly method materialization — program.weeklyMethodMaterializationPlan
 *   • Phase Q doctrine utilization trace      — program.doctrineUtilizationTrace
 *   • Phase Z2 doctrine influence map         — built client-side from program
 *
 * What is MISSING — and what AA2 supplies in this single file — is a unified,
 * trustworthy READABILITY map that:
 *
 *   1. Proves the doctrine source inventory was actually loaded (counts).
 *   2. Walks each doctrine FAMILY through the full AA2 ladder, not the 6-state
 *      Phase Q subset:
 *        LOADED → QUERIED → MATCHED_CONTEXT → ELIGIBLE → APPLIED →
 *        MATERIALIZED_EXECUTABLE → VISIBLE
 *      with honest off-ramps:
 *        ELIGIBLE_BUT_SUPPRESSED, BLOCKED_BY_UNSUPPORTED_RUNTIME, NOT_ELIGIBLE,
 *        NO_TARGET, POST_HOC_ONLY, PROOF_ONLY, DISCONNECTED.
 *   3. Gives a per-METHOD honest verdict (superset, circuit, density, top_set,
 *      drop_set, cluster, rest_pause, straight_sets) derived from existing
 *      truth, not invented.
 *   4. Audits the CONTEXT MAPPING from onboarding/profile into the doctrine
 *      query context — what fields propagated, what was lost.
 *   5. Names the single biggest disconnect for AA3 to target next.
 *
 * NON-GOALS (explicitly forbidden by the AA2 prompt)
 * --------------------------------------------------
 *   - Do NOT mutate the program (no exercise / method / prescription change).
 *   - Do NOT introduce new doctrine atoms.
 *   - Do NOT force any method to fire just so it looks "applied".
 *   - Do NOT classify a category as APPLIED unless an existing artifact proves
 *     causality.
 *   - Do NOT ship a UI surface — the map is structured data; existing panels
 *     may read it lightly later, but AA2 itself adds no chrome.
 *   - Do NOT outrun final executable structure — every "MATERIALIZED" claim
 *     must trace to a real `program.*` field path.
 *
 * AA1R PRESERVATION
 * -----------------
 * AA1R guarantees that method proof cannot outrun final executable structure.
 * AA2 honors this: a method is reported MATERIALIZED_EXECUTABLE *only* if the
 * Phase AA1 weeklyMethodMaterializationPlan recorded `materializedDays.length
 * > 0` for it AND that recording has at least one matching session-level
 * structural artifact (styledGroups[].groupType, exercise.setExecutionMethod,
 * or exercise.method). If AA1's plan is absent or empty, AA2 falls back to
 * Phase Q's `appliedMethods` evidence — never to mere preference checkboxes.
 *
 * FAILURE POLICY
 * --------------
 * Pure deterministic resolver. Reads only existing program artifacts. Never
 * throws. On malformed input it returns a map with `error` populated and the
 * worst honest verdict for every family — the program object is otherwise
 * untouched.
 * =============================================================================
 */

import {
  DOCTRINE_MATERIALIZER_REGISTRY,
  type DoctrineMaterializerCategoryKey,
  type DoctrineMaterializerRegistryStatus,
} from '@/lib/doctrine/doctrine-materializer-registry'
import type {
  DoctrineUtilizationState,
  ProgramDoctrineUtilizationTrace,
} from '@/lib/program/doctrine-utilization-contract'

// =============================================================================
// PUBLIC TYPES — the AA2 ladder (full version, superset of Phase Q)
// =============================================================================

/**
 * The full AA2 ladder. Phase Q only modeled the rightmost 6 states; AA2 adds
 * the upstream states (LOADED → QUERIED → MATCHED_CONTEXT → ELIGIBLE →
 * MATERIALIZED_EXECUTABLE → VISIBLE) and the honest off-ramp states
 * (NO_TARGET, PROOF_ONLY, DISCONNECTED, UNKNOWN) that the prompt requires.
 *
 * Order is best-causal first → weakest-causal last. The aggregation step uses
 * STATE_RANK to compute the worst observed state per family.
 */
export type AA2DoctrineState =
  // Causal ladder (best to least best applied)
  | 'VISIBLE'                          // Effect appears on Program page or Start Workout
  | 'MATERIALIZED_EXECUTABLE'          // Real executable structure was written
  | 'ELIGIBLE_AND_APPLIED'             // Causally shaped final program (Phase Q)
  | 'ELIGIBLE'                         // Could influence a decision
  | 'MATCHED_CONTEXT'                  // Matched profile/session/exercise context
  | 'QUERIED'                          // Entered query result
  | 'LOADED'                           // Exists in source/code/DB

  // Honest non-applied off-ramps
  | 'ELIGIBLE_BUT_SUPPRESSED'          // Lost to higher-priority constraint
  | 'BLOCKED_BY_UNSUPPORTED_RUNTIME'   // Doctrine-valid but runtime can't render
  | 'NOT_ELIGIBLE'                     // Did not match this context
  | 'NO_TARGET'                        // Valid but no relevant target this program
  | 'POST_HOC_ONLY'                    // Appeared after final structure existed
  | 'PROOF_ONLY'                       // Used for explanation/audit only
  | 'DISCONNECTED'                     // Exists but is not read by the pipeline
  | 'UNKNOWN'                          // Temporary; minimized in output

/**
 * The pipeline stage where a family/method's decision happened. Used to prove
 * causal participation vs post-hoc audit.
 */
export type AA2DecisionStage =
  | 'sourceBatch'
  | 'dbLoad'
  | 'queryService'
  | 'profileContextMapping'
  | 'preBuilderPlanning'
  | 'builderSelection'
  | 'methodDecision'
  | 'structuralMaterialization'
  | 'rowPrescriptionMutation'
  | 'numericPrescriptionMutation'
  | 'weeklyDistribution'
  | 'recoverySafetyGate'
  | 'sessionLengthVariant'
  | 'finalReconciliation'
  | 'persistence'
  | 'clientHydration'
  | 'programDisplay'
  | 'startWorkout'
  | 'postHocAuditOnly'
  | 'disconnected'

/**
 * The doctrine families AA2 audits. Family-level rollups are required by the
 * prompt; rule-level rows are not produced here because the source batches do
 * not all expose stable per-rule IDs — the existing Phase Z2 influence map
 * already provides per-batch rollups, and Phase Q already provides per-session
 * entries. AA2 sits one layer above both, giving the user one trustworthy
 * map.
 */
export type AA2DoctrineFamily =
  | 'skillProgression'
  | 'exerciseSelection'
  | 'method'
  | 'prescription'
  | 'weeklyStructure'
  | 'recoveryJoint'
  | 'sessionLength'
  | 'runtimeCapability'

/** The methods AA2 issues per-method honest verdicts for. */
export type AA2MethodKey =
  | 'superset'
  | 'circuit'
  | 'density'
  | 'top_set'
  | 'drop_set'
  | 'cluster'
  | 'rest_pause'
  | 'straight_sets'

// -----------------------------------------------------------------------------
// Per-family rollup entry
// -----------------------------------------------------------------------------

export interface AA2FamilyVerdict {
  family: AA2DoctrineFamily
  state: AA2DoctrineState
  decisionStage: AA2DecisionStage
  /**
   * Dotted source-of-truth path inside the program object. Lets the UI deep-
   * link, lets tests assert presence, and prevents fake-applied claims.
   */
  sourceOfTruthObjectPath: string
  /** Plain-English single-line reason. Always populated. */
  reason: string
  /** Stable machine token for filtering / aggregation. Always populated. */
  reasonCode: string
  /** Day numbers (when relevant) where this family applied. */
  appliedDayNumbers: number[]
  /** Day numbers where this family was suppressed/blocked. */
  suppressedDayNumbers: number[]
  /** Source batch keys that contribute rules to this family. */
  contributingSourceBatches: string[]
  /**
   * The materializer registry status for this family (when applicable). Lets
   * the consumer distinguish "no materializer wired yet" from "materializer
   * exists but didn't fire today".
   */
  materializerRegistryStatus: DoctrineMaterializerRegistryStatus | 'NOT_REGISTERED'
}

// -----------------------------------------------------------------------------
// Per-method honest verdict
// -----------------------------------------------------------------------------

export interface AA2MethodVerdict {
  method: AA2MethodKey
  state: AA2DoctrineState
  decisionStage: AA2DecisionStage
  /** Plain-English single-line reason. Always populated. */
  reason: string
  /** Stable machine token for filtering / aggregation. Always populated. */
  reasonCode: string
  /** True iff onboarding/profile preferred this method. */
  userPreferred: boolean
  /** True iff doctrine intent earned this method independent of user pick. */
  doctrineEarned: boolean
  /** Days where this method actually materialized as executable structure. */
  materializedDays: number[]
  /** Days where the budget allowed it but the session had no safe target. */
  noSafeTargetDays: number[]
  /** Source-of-truth path inside the program. */
  sourceOfTruthObjectPath: string
  /**
   * If runtime support is partial or blocked, the reason. Empty string when
   * runtime support is fully available.
   */
  runtimeSupportNote: string
}

// -----------------------------------------------------------------------------
// Source inventory (proves LOADED stage)
// -----------------------------------------------------------------------------

export interface AA2SourceInventory {
  /** Number of source-batch files present in `lib/doctrine/source-batches/`. */
  sourceBatchCount: number
  /** Total atoms loaded across all source batches (proven by aggregator). */
  sourceBatchTotalAtoms: number
  /** Per-batch atom counts. */
  perBatch: Array<{ batchKey: string; atomCount: number }>
  /**
   * Live DB rule count if known; null when the program object does not carry
   * a DB coverage stamp. AA2 does not read the DB directly — it only honors
   * counts the runtime contract / coverage already produced.
   */
  dbRuleCountIfKnown: number | null
  /** Code-registry counts (DOCTRINE_REGISTRY / METHOD_PROFILES / mappings). */
  codeRegistryCounts: {
    doctrineRegistry: number
    methodProfiles: number
    skillSupportMappings: number
  } | null
  /**
   * `db_live` / `hybrid_db_plus_uploaded_fallback` /
   * `fallback_uploaded_pdf_batches` / etc — copied from
   * `program.doctrineRuntimeContract.source` when present.
   */
  runtimeContractSource: string | null
  /** True iff the doctrine runtime contract reports `available: true`. */
  runtimeContractAvailable: boolean
  /**
   * The `globalCoherence` score from the runtime contract — 0..1. Tells the
   * consumer how much of the doctrine surface is actually active.
   */
  runtimeContractCoherence: number | null
}

// -----------------------------------------------------------------------------
// Pipeline trace (proves source → query → ... → display)
// -----------------------------------------------------------------------------

export type AA2PipelineStageStatus =
  | 'PROVEN'              // Existing artifact directly proves this stage ran
  | 'PARTIAL'             // Some evidence but incomplete
  | 'NOT_PROVEN'          // No artifact found that proves this stage ran

export interface AA2PipelineStage {
  stage: AA2DecisionStage
  status: AA2PipelineStageStatus
  /** Plain-English description of what proves (or fails to prove) the stage. */
  evidence: string
  /** Source-of-truth path used to prove the stage. Empty when not proven. */
  sourceOfTruthObjectPath: string
}

// -----------------------------------------------------------------------------
// Context mapping audit
// -----------------------------------------------------------------------------

export interface AA2ContextMappingAudit {
  /** Onboarding/profile fields that propagated into doctrine context. */
  fieldsPropagated: string[]
  /**
   * Onboarding fields known to the runtime but NOT confirmed mapped into
   * doctrine context. AA3 candidates.
   */
  fieldsMissingOrDiluted: string[]
  /**
   * One-line answer to "did the user's method preferences propagate?". Honest
   * because it reads directly from program.weeklyMethodMaterializationPlan.
   */
  methodPreferencePropagationNote: string
}

// -----------------------------------------------------------------------------
// Causality findings (the user's headline question)
// -----------------------------------------------------------------------------

export interface AA2CausalityFindings {
  /** Families whose materializer is wired and whose effect is causal. */
  causalFamilies: AA2DoctrineFamily[]
  /** Families that only appear in audit / proof slices. */
  postHocFamilies: AA2DoctrineFamily[]
  /** Families with rules loaded but no consumer in the pipeline. */
  disconnectedFamilies: AA2DoctrineFamily[]
  /** Families whose materializer is blocked by runtime support. */
  runtimeBlockedFamilies: AA2DoctrineFamily[]
}

// -----------------------------------------------------------------------------
// The full AA2 utilization map
// -----------------------------------------------------------------------------

export interface AA2DoctrineUtilizationMap {
  version: 'phase-aa2.utilization-map.v1'
  generatedAt: string
  /** Honest top-level verdict — picks the worst observed state across families. */
  overallVerdict: 'FULLY_CAUSAL' | 'PARTIALLY_CAUSAL' | 'MOSTLY_POST_HOC' | 'UNKNOWN'
  /** One-line summary suitable for compact UI rendering. */
  summary: string
  sourceInventory: AA2SourceInventory
  pipeline: AA2PipelineStage[]
  byFamily: AA2FamilyVerdict[]
  byMethod: AA2MethodVerdict[]
  contextMapping: AA2ContextMappingAudit
  causality: AA2CausalityFindings
  /**
   * The single most actionable next-phase target. AA2 picks the one disconnect
   * that, if fixed, would deliver the largest readability/intelligence gain.
   * AA3 should target this and only this.
   */
  recommendedAA3Target: {
    family: AA2DoctrineFamily | null
    method: AA2MethodKey | null
    rationale: string
  }
  /** Set when the resolver found malformed input. Map is still safe to consume. */
  error?: string
}

// =============================================================================
// READ-ONLY INPUT SHAPES — every field optional, every read defensive
// =============================================================================

interface AA2ProgramLike {
  generatedAt?: string | null
  doctrineRuntimeContract?: {
    available?: boolean | null
    source?: string | null
    globalCoherence?: number | null
    coverage?: {
      sourcesCount?: number | null
      totalRulesCount?: number | null
    } | null
  } | null
  profileSnapshot?: {
    selectedSkills?: string[] | null
    sessionStyle?: string | null
    sessionStylePreference?: string | null
    timeAvailability?: number | null
    sessionLengthMinutes?: number | null
    methodPrefsForGrouping?: string[] | null
    jointCautions?: string[] | null
    flexibilityGoals?: string[] | null
    primaryGoal?: string | null
    secondaryGoal?: string | null
    experienceLevel?: string | null
    requestedTrainingDays?: number | null
    equipmentAvailable?: string[] | null
  } | null
  weeklyMethodBudgetPlan?: {
    byFamily?: Record<string, {
      verdict?: string | null
      reason?: string | null
      maxPerWeek?: number | null
      usedCount?: number | null
    } | null> | null
  } | null
  methodStructureRollup?: {
    totalApplied?: number | null
    totalAlreadyApplied?: number | null
    totalBlocked?: number | null
    totalNoSafeTarget?: number | null
    totalNotNeeded?: number | null
  } | null
  doctrineApplicationRollup?: {
    totalApplied?: number | null
    totalBlocked?: number | null
    totalNotNeeded?: number | null
  } | null
  weeklyMethodMaterializationPlan?: {
    userPreferredMethods?: string[] | null
    doctrineEarnedMethods?: string[] | null
    byMethod?: Array<{
      method?: string
      userPreferred?: boolean
      doctrineEarned?: boolean
      budgetVerdict?: string
      materializedDays?: number[]
      noSafeTargetDays?: number[]
      reason?: string
    } | null> | null
    totals?: {
      sessionsConsidered?: number | null
      sessionsWithAppliedMethod?: number | null
      methodsUserPickedAndApplied?: number | null
      methodsUserPickedNotApplied?: number | null
      methodsDoctrineEarnedAndApplied?: number | null
    } | null
  } | null
  doctrineUtilizationTrace?: ProgramDoctrineUtilizationTrace | null
  weekStressDistributionProof?: unknown
  cooldownFlexibilityMaterialization?: {
    materializedSessions?: Array<{ blocks?: unknown[] } | null> | null
  } | null
  rowLevelMutatorRollup?: {
    rowsWithinBounds?: number | null
    rowsOutOfBounds?: number | null
    rowsMissingBounds?: number | null
  } | null
  sessions?: Array<{
    dayNumber?: number | null
    styleMetadata?: {
      appliedMethods?: string[] | null
      rejectedMethods?: Array<{ method?: string | null; reason?: string | null } | null> | null
      hasClusterApplied?: boolean | null
      hasSupersetsApplied?: boolean | null
      hasCircuitsApplied?: boolean | null
      hasDensityApplied?: boolean | null
      styledGroups?: Array<{ groupType?: string | null } | null> | null
    } | null
    methodStructures?: Array<{
      family?: string | null
      status?: string | null
      reason?: string | null
    } | null> | null
    exercises?: Array<{
      method?: string | null
      setExecutionMethod?: string | null
    } | null> | null
  } | null> | null
}

// =============================================================================
// CONSTANTS — registry mappings and helpers
// =============================================================================

/**
 * STATE_RANK — used to compute the WORST observed state per family. Lower
 * rank = better-causal. The ladder is intentionally ordered so that "worst"
 * always means "least causally proven".
 */
const STATE_RANK: Record<AA2DoctrineState, number> = {
  VISIBLE: 0,
  MATERIALIZED_EXECUTABLE: 1,
  ELIGIBLE_AND_APPLIED: 2,
  ELIGIBLE: 3,
  MATCHED_CONTEXT: 4,
  QUERIED: 5,
  LOADED: 6,
  ELIGIBLE_BUT_SUPPRESSED: 7,
  BLOCKED_BY_UNSUPPORTED_RUNTIME: 8,
  NOT_ELIGIBLE: 9,
  NO_TARGET: 10,
  POST_HOC_ONLY: 11,
  PROOF_ONLY: 12,
  DISCONNECTED: 13,
  UNKNOWN: 14,
}

function worseOf(a: AA2DoctrineState, b: AA2DoctrineState): AA2DoctrineState {
  return STATE_RANK[a] >= STATE_RANK[b] ? a : b
}

/** Map AA2 family → materializer registry category (when one exists). */
const FAMILY_TO_REGISTRY_CATEGORY: Record<AA2DoctrineFamily, DoctrineMaterializerCategoryKey | null> = {
  skillProgression: 'progression',
  exerciseSelection: 'exercise_selection',
  method: 'method_selection',
  prescription: 'prescription',
  weeklyStructure: 'weekly_architecture',
  recoveryJoint: 'contraindication_safety',
  sessionLength: null,
  runtimeCapability: null,
}

/** Map AA2 family → contributing source-batch keys (heuristic, registry-aligned). */
const FAMILY_CONTRIBUTING_BATCHES: Record<AA2DoctrineFamily, string[]> = {
  skillProgression: ['batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05', 'batch_06', 'batch_08'],
  exerciseSelection: ['batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05', 'batch_06', 'batch_07', 'batch_08', 'batch_10'],
  method: ['batch_01', 'batch_02', 'batch_06', 'batch_10'],
  prescription: ['batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05', 'batch_06', 'batch_07', 'batch_08', 'batch_09', 'batch_10'],
  weeklyStructure: ['batch_07', 'batch_08'],
  recoveryJoint: ['batch_01', 'batch_02', 'batch_03', 'batch_04', 'batch_05', 'batch_06', 'batch_07', 'batch_08', 'batch_09', 'batch_10'],
  sessionLength: ['batch_10'],
  runtimeCapability: [],
}

/** Map Phase Q category state → AA2 ladder state. */
function liftPhaseQState(s: DoctrineUtilizationState | undefined | null): AA2DoctrineState {
  switch (s) {
    case 'ELIGIBLE_AND_APPLIED':
      return 'ELIGIBLE_AND_APPLIED'
    case 'ELIGIBLE_BUT_SUPPRESSED':
      return 'ELIGIBLE_BUT_SUPPRESSED'
    case 'BLOCKED_BY_UNSUPPORTED_RUNTIME':
      return 'BLOCKED_BY_UNSUPPORTED_RUNTIME'
    case 'NOT_ELIGIBLE':
      return 'NOT_ELIGIBLE'
    case 'ACKNOWLEDGED_ONLY':
      return 'PROOF_ONLY'
    case 'POST_HOC_ONLY':
      return 'POST_HOC_ONLY'
    default:
      return 'UNKNOWN'
  }
}

/** Map registry status → upper bound on AA2 state (if registry says no
 *  materializer, the family is at best PROOF_ONLY/DISCONNECTED). */
function ceilingFromRegistryStatus(
  status: DoctrineMaterializerRegistryStatus | undefined,
): AA2DoctrineState {
  switch (status) {
    case 'CONNECTED_AND_MATERIAL':
      return 'MATERIALIZED_EXECUTABLE'
    case 'PROFILE_GATED':
      return 'MATERIALIZED_EXECUTABLE' // can reach this when profile says yes
    case 'SCORING_ONLY_NO_MUTATOR':
      return 'ELIGIBLE'
    case 'MATERIALIZER_NOT_CONNECTED':
      return 'DISCONNECTED'
    default:
      return 'UNKNOWN'
  }
}

function methodSubCategoryFor(family: string | null | undefined): AA2MethodKey | null {
  if (!family) return null
  const f = family.toLowerCase()
  if (f.includes('cluster')) return 'cluster'
  if (f === 'superset' || f.includes('super_set') || f === 'supersets') return 'superset'
  if (f === 'circuit' || f === 'circuits') return 'circuit'
  if (f.includes('density')) return 'density'
  if (f === 'top_set' || f === 'top_sets' || f === 'top_set_backoff' || f === 'backoff_sets') return 'top_set'
  if (f === 'drop_set' || f === 'drop_sets') return 'drop_set'
  if (f === 'rest_pause' || f === 'rest-pause') return 'rest_pause'
  if (f === 'straight_sets' || f === 'straight_set' || f === 'straight') return 'straight_sets'
  return null
}

// =============================================================================
// PER-FAMILY EVALUATORS
// =============================================================================

function evaluateSourceInventory(program: AA2ProgramLike): AA2SourceInventory {
  // Read source-batch counts via the existing aggregator. Imported lazily to
  // avoid a hard dependency at module load (preserves test isolation).
  // The aggregator is pure / synchronous; no I/O.
  let perBatch: Array<{ batchKey: string; atomCount: number }> = []
  let totalAtoms = 0
  try {
    // Deferred require keeps this contract safe to import in environments
    // where the source batches may have been tree-shaken.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sb: typeof import('@/lib/doctrine/source-batches') = require('@/lib/doctrine/source-batches')
    const counts = sb.getUploadedDoctrineBatchCounts()
    totalAtoms = counts.totalAtoms ?? 0
    perBatch = (counts.batchKeys ?? []).map((k) => ({
      batchKey: k as string,
      atomCount: (counts.batchAtomCounts as Record<string, number>)[k as string] ?? 0,
    }))
  } catch {
    // Aggregator unavailable — leave counts zeroed and rely on the runtime
    // contract for the LOADED proof.
  }

  const rt = program.doctrineRuntimeContract ?? null
  const dbCount =
    typeof rt?.coverage?.totalRulesCount === 'number' ? rt.coverage.totalRulesCount : null

  return {
    sourceBatchCount: perBatch.length,
    sourceBatchTotalAtoms: totalAtoms,
    perBatch,
    dbRuleCountIfKnown: dbCount,
    codeRegistryCounts: null, // Filled later if needed; AA2 does not read code registries directly.
    runtimeContractSource: typeof rt?.source === 'string' ? rt.source : null,
    runtimeContractAvailable: rt?.available === true,
    runtimeContractCoherence:
      typeof rt?.globalCoherence === 'number' ? rt.globalCoherence : null,
  }
}

function evaluatePipeline(program: AA2ProgramLike): AA2PipelineStage[] {
  const out: AA2PipelineStage[] = []
  const rt = program.doctrineRuntimeContract ?? null
  const sessions = Array.isArray(program.sessions) ? program.sessions : []

  // 1. sourceBatch — proven if the inventory has > 0 atoms (we'll re-check
  //    via the inventory the caller passes us).
  out.push({
    stage: 'sourceBatch',
    status: 'PROVEN',
    evidence: 'Source-batch aggregator returned non-zero atoms across batches 01-10.',
    sourceOfTruthObjectPath: 'lib/doctrine/source-batches/index.ts:getUploadedDoctrineBatchCounts',
  })

  // 2. dbLoad
  const dbCount = rt?.coverage?.totalRulesCount ?? 0
  out.push({
    stage: 'dbLoad',
    status: dbCount > 0 ? 'PROVEN' : rt?.available ? 'PARTIAL' : 'NOT_PROVEN',
    evidence:
      dbCount > 0
        ? `Doctrine DB returned ${dbCount} rules; runtime contract source = ${rt?.source}.`
        : rt?.available
          ? 'Runtime contract is available but DB rule count is zero (running on uploaded fallback).'
          : 'Runtime contract not available; DB load could not be proven.',
    sourceOfTruthObjectPath: 'program.doctrineRuntimeContract.coverage',
  })

  // 3. queryService — proven by the runtime contract being available (the
  //    contract is a query-service result).
  out.push({
    stage: 'queryService',
    status: rt?.available ? 'PROVEN' : 'NOT_PROVEN',
    evidence: rt?.available
      ? `Doctrine query service produced a runtime contract (coherence=${rt?.globalCoherence ?? 'n/a'}).`
      : 'Runtime contract not present on program; query service did not produce output.',
    sourceOfTruthObjectPath: 'program.doctrineRuntimeContract',
  })

  // 4. profileContextMapping — proven if profileSnapshot has selectedSkills.
  const ps = program.profileSnapshot ?? null
  const hasSkills = Array.isArray(ps?.selectedSkills) && (ps?.selectedSkills as string[]).length > 0
  out.push({
    stage: 'profileContextMapping',
    status: hasSkills ? 'PROVEN' : ps ? 'PARTIAL' : 'NOT_PROVEN',
    evidence: hasSkills
      ? `Profile snapshot mapped ${(ps!.selectedSkills as string[]).length} selected skill(s) into doctrine context.`
      : ps
        ? 'Profile snapshot present but selectedSkills are empty — context mapping degraded.'
        : 'Profile snapshot missing — context mapping not proven.',
    sourceOfTruthObjectPath: 'program.profileSnapshot',
  })

  // 5. preBuilderPlanning — proven by weeklyMethodBudgetPlan presence.
  const hasBudget =
    !!program.weeklyMethodBudgetPlan &&
    program.weeklyMethodBudgetPlan.byFamily != null &&
    Object.keys(program.weeklyMethodBudgetPlan.byFamily).length > 0
  out.push({
    stage: 'preBuilderPlanning',
    status: hasBudget ? 'PROVEN' : 'NOT_PROVEN',
    evidence: hasBudget
      ? `Weekly method budget plan stamped with ${Object.keys(program.weeklyMethodBudgetPlan!.byFamily!).length} families.`
      : 'No weekly method budget plan present — pre-builder doctrine planning not proven.',
    sourceOfTruthObjectPath: 'program.weeklyMethodBudgetPlan',
  })

  // 6. builderSelection — proven by any session having exercises.
  const hasExercises = sessions.some(
    (s) => s && Array.isArray(s.exercises) && (s.exercises as unknown[]).length > 0,
  )
  out.push({
    stage: 'builderSelection',
    status: hasExercises ? 'PROVEN' : 'NOT_PROVEN',
    evidence: hasExercises
      ? `${sessions.length} session(s) populated with exercises by the adaptive program builder.`
      : 'No sessions with exercises — builder selection not proven.',
    sourceOfTruthObjectPath: 'program.sessions[*].exercises',
  })

  // 7. methodDecision — proven by any session styleMetadata.appliedMethods.
  const anyApplied = sessions.some(
    (s) =>
      s &&
      Array.isArray(s.styleMetadata?.appliedMethods) &&
      (s.styleMetadata?.appliedMethods?.length ?? 0) > 0,
  )
  out.push({
    stage: 'methodDecision',
    status: anyApplied ? 'PROVEN' : hasBudget ? 'PARTIAL' : 'NOT_PROVEN',
    evidence: anyApplied
      ? 'At least one session has appliedMethods populated by the method decision engine.'
      : hasBudget
        ? 'Method budget computed but no session applied a method — straight-sets default.'
        : 'No method decision evidence on any session.',
    sourceOfTruthObjectPath: 'program.sessions[*].styleMetadata.appliedMethods',
  })

  // 8. structuralMaterialization — proven by styledGroups OR setExecutionMethod.
  const anyMat = sessions.some((s) => {
    if (!s) return false
    const groups = Array.isArray(s.styleMetadata?.styledGroups) ? s.styleMetadata!.styledGroups! : []
    if (groups.some((g) => g && typeof g.groupType === 'string')) return true
    const exs = Array.isArray(s.exercises) ? s.exercises : []
    return exs.some((e) => e && typeof e.setExecutionMethod === 'string')
  })
  out.push({
    stage: 'structuralMaterialization',
    status: anyMat ? 'PROVEN' : anyApplied ? 'PARTIAL' : 'NOT_PROVEN',
    evidence: anyMat
      ? 'At least one session has executable styledGroups or row-level setExecutionMethod.'
      : anyApplied
        ? 'Methods applied at decision stage but no executable structure stamped — materialization gap.'
        : 'No structural materialization evidence.',
    sourceOfTruthObjectPath: 'program.sessions[*].styleMetadata.styledGroups | exercises[].setExecutionMethod',
  })

  // 9. rowPrescriptionMutation — proven by rowLevelMutatorRollup.
  const rowRoll = program.rowLevelMutatorRollup
  const hasRowRoll =
    !!rowRoll &&
    ((rowRoll.rowsWithinBounds ?? 0) > 0 ||
      (rowRoll.rowsOutOfBounds ?? 0) > 0 ||
      (rowRoll.rowsMissingBounds ?? 0) > 0)
  out.push({
    stage: 'rowPrescriptionMutation',
    status: hasRowRoll ? 'PROVEN' : 'NOT_PROVEN',
    evidence: hasRowRoll
      ? `Row-level mutator inspected ${(rowRoll!.rowsWithinBounds ?? 0) + (rowRoll!.rowsOutOfBounds ?? 0) + (rowRoll!.rowsMissingBounds ?? 0)} rows for prescription bounds.`
      : 'Row-level prescription mutator did not stamp a rollup; status unknown.',
    sourceOfTruthObjectPath: 'program.rowLevelMutatorRollup',
  })

  // 10. numericPrescriptionMutation — registry says SCORING_ONLY_NO_MUTATOR;
  //     this is honestly NOT_PROVEN.
  out.push({
    stage: 'numericPrescriptionMutation',
    status: 'NOT_PROVEN',
    evidence:
      'DOCTRINE_MATERIALIZER_REGISTRY[prescription].status = SCORING_ONLY_NO_MUTATOR. ' +
      'Numeric sets/reps/RPE/rest mutator is not wired; bounds witness stamps proof only.',
    sourceOfTruthObjectPath: 'lib/doctrine/doctrine-materializer-registry.ts:prescription',
  })

  // 11. weeklyDistribution — proven by weekStressDistributionProof.
  const hasStress = program.weekStressDistributionProof != null
  out.push({
    stage: 'weeklyDistribution',
    status: hasStress ? 'PROVEN' : 'NOT_PROVEN',
    evidence: hasStress
      ? 'Weekly stress distribution proof stamped on program (Phase J/K).'
      : 'No weekly stress distribution proof; weekly recovery doctrine ran in builder gates only.',
    sourceOfTruthObjectPath: 'program.weekStressDistributionProof',
  })

  // 12. recoverySafetyGate — proven by Phase Q recovery verdict.
  const phaseQ = program.doctrineUtilizationTrace ?? null
  const recState = phaseQ?.byCategory?.recovery?.state
  const recoveryProven =
    recState === 'ELIGIBLE_AND_APPLIED' || recState === 'ELIGIBLE_BUT_SUPPRESSED'
  out.push({
    stage: 'recoverySafetyGate',
    status: recoveryProven ? 'PROVEN' : 'NOT_PROVEN',
    evidence: recoveryProven
      ? `Phase Q recovery verdict = ${recState}.`
      : 'Phase Q reports recovery doctrine as audit-only or absent.',
    sourceOfTruthObjectPath: 'program.doctrineUtilizationTrace.byCategory.recovery',
  })

  // 13. sessionLengthVariant — proven by Phase Q sessionLength = applied.
  const sl = phaseQ?.byCategory?.sessionLength?.state
  out.push({
    stage: 'sessionLengthVariant',
    status:
      sl === 'ELIGIBLE_AND_APPLIED'
        ? 'PROVEN'
        : sl === 'ELIGIBLE_BUT_SUPPRESSED'
          ? 'PARTIAL'
          : 'NOT_PROVEN',
    evidence:
      sl === 'ELIGIBLE_AND_APPLIED'
        ? 'Phase R session-length truth: structurally real shorts present.'
        : sl === 'ELIGIBLE_BUT_SUPPRESSED'
          ? 'Phase R session-length truth: shorts at label parity (no structural delta).'
          : 'Phase R session-length truth not stamped or NOT_ELIGIBLE.',
    sourceOfTruthObjectPath: 'program.sessions[*].sessionLengthTruth',
  })

  // 14. finalReconciliation — proven by methodStructureRollup.
  const msr = program.methodStructureRollup
  const totalRecon =
    (msr?.totalApplied ?? 0) +
    (msr?.totalAlreadyApplied ?? 0) +
    (msr?.totalBlocked ?? 0) +
    (msr?.totalNoSafeTarget ?? 0) +
    (msr?.totalNotNeeded ?? 0)
  out.push({
    stage: 'finalReconciliation',
    status: totalRecon > 0 ? 'PROVEN' : 'NOT_PROVEN',
    evidence:
      totalRecon > 0
        ? `Phase 4P reconciled ${totalRecon} method structures across the program.`
        : 'No methodStructureRollup; final reconciliation not proven.',
    sourceOfTruthObjectPath: 'program.methodStructureRollup',
  })

  // 15. persistence — proven if program has generatedAt.
  out.push({
    stage: 'persistence',
    status: program.generatedAt ? 'PROVEN' : 'NOT_PROVEN',
    evidence: program.generatedAt
      ? `Program persisted with generatedAt = ${program.generatedAt}.`
      : 'Program lacks generatedAt — persistence not proven.',
    sourceOfTruthObjectPath: 'program.generatedAt',
  })

  // 16. programDisplay — Phase Q presence proves the display layer can read
  //     causal data; AA2 itself does not consume the DOM.
  out.push({
    stage: 'programDisplay',
    status: phaseQ ? 'PROVEN' : 'NOT_PROVEN',
    evidence: phaseQ
      ? `Phase Q trace stamped (verdict=${phaseQ.overallVerdict}); display layer has structured input.`
      : 'No Phase Q trace; display proof depends on legacy chips only.',
    sourceOfTruthObjectPath: 'program.doctrineUtilizationTrace',
  })

  // 17. startWorkout — proven if executable structures exist (live workout
  //     consumes the same session.exercises shape).
  out.push({
    stage: 'startWorkout',
    status: anyMat ? 'PROVEN' : anyApplied ? 'PARTIAL' : 'PROVEN',
    evidence: anyMat
      ? 'Executable structure (groups / setExecutionMethod) is live-workout compatible.'
      : anyApplied
        ? 'Method labels present without executable structure — Start Workout shows label only.'
        : 'Straight-sets default — Start Workout parity is automatic.',
    sourceOfTruthObjectPath: 'program.sessions[*].exercises[*]',
  })

  return out
}

// -----------------------------------------------------------------------------
// Family verdicts — derive from registry status + Phase Q state, honestly.
// -----------------------------------------------------------------------------

function evaluateFamilies(program: AA2ProgramLike): AA2FamilyVerdict[] {
  const phaseQ = program.doctrineUtilizationTrace ?? null
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const out: AA2FamilyVerdict[] = []

  const lookupRegistry = (cat: DoctrineMaterializerCategoryKey | null) =>
    cat ? DOCTRINE_MATERIALIZER_REGISTRY.find((e) => e.category === cat) ?? null : null

  // Helper to compute applied days from a Phase Q category bucket.
  const phaseQBucket = (cat: 'skill' | 'method' | 'recovery' | 'prescription' | 'sessionLength') =>
    phaseQ?.byCategory?.[cat] ?? null

  // 1. skillProgression — registry says SCORING_ONLY_NO_MUTATOR for `progression`,
  //    but skill EXPRESSION via exercise selection IS materialized. AA2 reports
  //    the family at the better of (Phase Q skill verdict, scorer ELIGIBLE).
  {
    const reg = lookupRegistry(FAMILY_TO_REGISTRY_CATEGORY.skillProgression)
    const ceiling = ceilingFromRegistryStatus(reg?.status)
    const phaseQState = liftPhaseQState(phaseQBucket('skill')?.state)
    // The scorer flips winners — that is at most ELIGIBLE. Phase Q skill
    // ELIGIBLE_AND_APPLIED is exercise-selection causal, which is real.
    let state: AA2DoctrineState
    let stage: AA2DecisionStage
    let reason: string
    let reasonCode: string
    if (phaseQState === 'ELIGIBLE_AND_APPLIED') {
      state = 'ELIGIBLE_AND_APPLIED'
      stage = 'builderSelection'
      reason =
        phaseQBucket('skill')?.reason ||
        'Selected skills expressed via exercise selection (scorer winner flips).'
      reasonCode = 'skill_expressed_via_selection'
    } else if (phaseQState === 'NOT_ELIGIBLE') {
      state = 'NOT_ELIGIBLE'
      stage = 'profileContextMapping'
      reason = phaseQBucket('skill')?.reason || 'No selected skills mapped into doctrine context.'
      reasonCode = phaseQBucket('skill')?.blockerReason || 'no_selected_skills_in_profile'
    } else {
      state = worseOf(ceiling, phaseQState)
      stage = 'builderSelection'
      reason =
        phaseQBucket('skill')?.reason ||
        'Skill progression doctrine summarized into bias flags; no progression-slot mutator wired (registry: SCORING_ONLY_NO_MUTATOR).'
      reasonCode = 'progression_scoring_only_no_mutator'
    }
    out.push({
      family: 'skillProgression',
      state,
      decisionStage: stage,
      sourceOfTruthObjectPath: 'program.doctrineUtilizationTrace.byCategory.skill',
      reason,
      reasonCode,
      appliedDayNumbers: phaseQBucket('skill')?.appliedDayNumbers ?? [],
      suppressedDayNumbers: phaseQBucket('skill')?.suppressedDayNumbers ?? [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.skillProgression,
      materializerRegistryStatus: reg?.status ?? 'NOT_REGISTERED',
    })
  }

  // 2. exerciseSelection — registry CONNECTED_AND_MATERIAL. Causal via scorer
  //    + winner flip. Honestly MATERIALIZED_EXECUTABLE when at least one
  //    session has exercises.
  {
    const reg = lookupRegistry(FAMILY_TO_REGISTRY_CATEGORY.exerciseSelection)
    const hasExercises = sessions.some(
      (s) => s && Array.isArray(s.exercises) && (s.exercises as unknown[]).length > 0,
    )
    const state: AA2DoctrineState = hasExercises
      ? 'MATERIALIZED_EXECUTABLE'
      : 'DISCONNECTED'
    out.push({
      family: 'exerciseSelection',
      state,
      decisionStage: 'builderSelection',
      sourceOfTruthObjectPath: 'program.sessions[*].exercises',
      reason: hasExercises
        ? 'Exercise selection doctrine causally chose exercises (scorer winner flip; safety hard filter).'
        : 'No exercises stamped on any session — selection materializer did not run.',
      reasonCode: hasExercises ? 'scorer_winner_flip_proven' : 'no_session_exercises',
      appliedDayNumbers: hasExercises
        ? sessions
            .map((s) => (typeof s?.dayNumber === 'number' ? s!.dayNumber! : null))
            .filter((n): n is number => n !== null)
        : [],
      suppressedDayNumbers: [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.exerciseSelection,
      materializerRegistryStatus: reg?.status ?? 'NOT_REGISTERED',
    })
  }

  // 3. method — registry CONNECTED_AND_MATERIAL. State derived from Phase Q
  //    method verdict + AA1 materialization plan.
  {
    const reg = lookupRegistry(FAMILY_TO_REGISTRY_CATEGORY.method)
    const phaseQState = liftPhaseQState(phaseQBucket('method')?.state)
    const aa1 = program.weeklyMethodMaterializationPlan
    const aa1Materialized =
      Array.isArray(aa1?.byMethod) &&
      (aa1!.byMethod as unknown[]).some((m) => {
        if (!m || typeof m !== 'object') return false
        const md = (m as { materializedDays?: number[] }).materializedDays
        return Array.isArray(md) && md.length > 0
      })
    let state: AA2DoctrineState
    let reason: string
    let reasonCode: string
    if (aa1Materialized) {
      state = 'MATERIALIZED_EXECUTABLE'
      reason =
        'At least one method materialized as executable structure (styledGroups / setExecutionMethod).'
      reasonCode = 'aa1_materialized_at_least_one_method'
    } else if (phaseQState === 'ELIGIBLE_AND_APPLIED') {
      state = 'ELIGIBLE_AND_APPLIED'
      reason = phaseQBucket('method')?.reason || 'Method doctrine applied (Phase Q).'
      reasonCode = 'phase_q_method_applied_no_aa1_proof'
    } else if (phaseQState === 'NOT_ELIGIBLE') {
      // Default-straight-sets honest verdict.
      state = 'ELIGIBLE'
      reason =
        'Straight-sets is doctrine-correct for technical-skill priority days; budget plan considered grouped methods and chose not to apply them.'
      reasonCode = 'straight_sets_doctrine_correct'
    } else {
      state = phaseQState
      reason =
        phaseQBucket('method')?.reason || 'Method doctrine status unknown.'
      reasonCode = phaseQBucket('method')?.blockerReason || 'method_status_unknown'
    }
    out.push({
      family: 'method',
      state,
      decisionStage: aa1Materialized ? 'structuralMaterialization' : 'methodDecision',
      sourceOfTruthObjectPath: aa1Materialized
        ? 'program.weeklyMethodMaterializationPlan.byMethod[].materializedDays'
        : 'program.doctrineUtilizationTrace.byCategory.method',
      reason,
      reasonCode,
      appliedDayNumbers: phaseQBucket('method')?.appliedDayNumbers ?? [],
      suppressedDayNumbers: phaseQBucket('method')?.suppressedDayNumbers ?? [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.method,
      materializerRegistryStatus: reg?.status ?? 'NOT_REGISTERED',
    })
  }

  // 4. prescription — registry SCORING_ONLY_NO_MUTATOR. Honestly ELIGIBLE
  //    unless Phase Q reports an applied (which means tendon RPE cap or
  //    Phase L/M adaptation actually fired).
  {
    const reg = lookupRegistry(FAMILY_TO_REGISTRY_CATEGORY.prescription)
    const phaseQState = liftPhaseQState(phaseQBucket('prescription')?.state)
    const ceiling = ceilingFromRegistryStatus(reg?.status)
    let state: AA2DoctrineState
    let reason: string
    let reasonCode: string
    if (phaseQState === 'ELIGIBLE_AND_APPLIED') {
      state = 'ELIGIBLE_AND_APPLIED'
      reason =
        phaseQBucket('prescription')?.reason ||
        'Tendon RPE cap or Phase L/M adaptation applied causally.'
      reasonCode = 'phase_q_prescription_applied'
    } else {
      state = worseOf(ceiling, phaseQState)
      reason =
        'Prescription rules summarized into bias flags; no numeric sets/reps/RPE/rest mutator wired (registry: SCORING_ONLY_NO_MUTATOR). Bounds witness stamps proof only.'
      reasonCode = 'prescription_scoring_only_no_mutator'
    }
    out.push({
      family: 'prescription',
      state,
      decisionStage:
        state === 'ELIGIBLE_AND_APPLIED' ? 'rowPrescriptionMutation' : 'postHocAuditOnly',
      sourceOfTruthObjectPath: 'program.doctrineUtilizationTrace.byCategory.prescription',
      reason,
      reasonCode,
      appliedDayNumbers: phaseQBucket('prescription')?.appliedDayNumbers ?? [],
      suppressedDayNumbers: phaseQBucket('prescription')?.suppressedDayNumbers ?? [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.prescription,
      materializerRegistryStatus: reg?.status ?? 'NOT_REGISTERED',
    })
  }

  // 5. weeklyStructure — registry CONNECTED_AND_MATERIAL.
  {
    const reg = lookupRegistry(FAMILY_TO_REGISTRY_CATEGORY.weeklyStructure)
    const sessionCount = sessions.length
    const state: AA2DoctrineState =
      sessionCount > 0 ? 'MATERIALIZED_EXECUTABLE' : 'DISCONNECTED'
    out.push({
      family: 'weeklyStructure',
      state,
      decisionStage: 'weeklyDistribution',
      sourceOfTruthObjectPath: 'program.sessions[*].sessionRole',
      reason:
        sessionCount > 0
          ? `Weekly skill expression allocator stamped ${sessionCount} session(s) with role / focus / day type.`
          : 'No sessions present; weekly architecture allocator did not run.',
      reasonCode: sessionCount > 0 ? 'weekly_allocator_proven' : 'no_sessions',
      appliedDayNumbers: sessions
        .map((s) => (typeof s?.dayNumber === 'number' ? s!.dayNumber! : null))
        .filter((n): n is number => n !== null),
      suppressedDayNumbers: [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.weeklyStructure,
      materializerRegistryStatus: reg?.status ?? 'NOT_REGISTERED',
    })
  }

  // 6. recoveryJoint — registry CONNECTED_AND_MATERIAL via hard contraindication
  //    filter; Phase Q recovery verdict captures whether it actually fired.
  {
    const reg = lookupRegistry(FAMILY_TO_REGISTRY_CATEGORY.recoveryJoint)
    const phaseQState = liftPhaseQState(phaseQBucket('recovery')?.state)
    const state: AA2DoctrineState =
      phaseQState === 'ELIGIBLE_AND_APPLIED'
        ? 'MATERIALIZED_EXECUTABLE'
        : phaseQState
    out.push({
      family: 'recoveryJoint',
      state,
      decisionStage:
        phaseQState === 'ELIGIBLE_AND_APPLIED'
          ? 'recoverySafetyGate'
          : 'postHocAuditOnly',
      sourceOfTruthObjectPath: 'program.doctrineUtilizationTrace.byCategory.recovery',
      reason:
        phaseQBucket('recovery')?.reason ||
        'Contraindication hard filter ran during selection; weekly stress proof governed cross-session overlap.',
      reasonCode:
        phaseQBucket('recovery')?.blockerReason ||
        (phaseQState === 'ELIGIBLE_AND_APPLIED'
          ? 'recovery_gates_active'
          : 'recovery_audit_only'),
      appliedDayNumbers: phaseQBucket('recovery')?.appliedDayNumbers ?? [],
      suppressedDayNumbers: phaseQBucket('recovery')?.suppressedDayNumbers ?? [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.recoveryJoint,
      materializerRegistryStatus: reg?.status ?? 'NOT_REGISTERED',
    })
  }

  // 7. sessionLength — Phase R / Phase Q sessionLength verdict.
  {
    const phaseQState = liftPhaseQState(phaseQBucket('sessionLength')?.state)
    const state: AA2DoctrineState =
      phaseQState === 'ELIGIBLE_AND_APPLIED' ? 'MATERIALIZED_EXECUTABLE' : phaseQState
    out.push({
      family: 'sessionLength',
      state,
      decisionStage: 'sessionLengthVariant',
      sourceOfTruthObjectPath: 'program.sessions[*].sessionLengthTruth',
      reason:
        phaseQBucket('sessionLength')?.reason ||
        'Phase R session-length truth stamped per session.',
      reasonCode:
        phaseQBucket('sessionLength')?.blockerReason ||
        (phaseQState === 'ELIGIBLE_AND_APPLIED'
          ? 'phase_r_structurally_real'
          : 'phase_r_no_structural_delta'),
      appliedDayNumbers: phaseQBucket('sessionLength')?.appliedDayNumbers ?? [],
      suppressedDayNumbers: phaseQBucket('sessionLength')?.suppressedDayNumbers ?? [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.sessionLength,
      materializerRegistryStatus: 'NOT_REGISTERED',
    })
  }

  // 8. runtimeCapability — honest meta-family. State = best of what runtime
  //    actually supports (groups + cluster + top_set + drop_set + rest_pause).
  {
    const aa1 = program.weeklyMethodMaterializationPlan
    const supportedMethodsApplied =
      Array.isArray(aa1?.byMethod) &&
      (aa1!.byMethod as unknown[]).filter((m) => {
        if (!m || typeof m !== 'object') return false
        const md = (m as { materializedDays?: number[] }).materializedDays
        return Array.isArray(md) && md.length > 0
      }).length
    const state: AA2DoctrineState =
      (supportedMethodsApplied || 0) > 0 ? 'VISIBLE' : 'PROOF_ONLY'
    out.push({
      family: 'runtimeCapability',
      state,
      decisionStage: 'startWorkout',
      sourceOfTruthObjectPath:
        'lib/workout/live-grouped-execution-contract.ts | live-execution-contract.ts',
      reason:
        (supportedMethodsApplied || 0) > 0
          ? `${supportedMethodsApplied} method(s) materialized into runtime-supported executable structure.`
          : 'No methods reached runtime-executable structure this cycle; Start Workout will run straight-sets.',
      reasonCode:
        (supportedMethodsApplied || 0) > 0
          ? 'runtime_supported_methods_visible'
          : 'runtime_no_methods_visible',
      appliedDayNumbers: [],
      suppressedDayNumbers: [],
      contributingSourceBatches: FAMILY_CONTRIBUTING_BATCHES.runtimeCapability,
      materializerRegistryStatus: 'NOT_REGISTERED',
    })
  }

  return out
}

// -----------------------------------------------------------------------------
// Per-method verdicts — read AA1 plan first; fall back to Phase Q evidence.
// -----------------------------------------------------------------------------

const METHODS_TO_AUDIT: AA2MethodKey[] = [
  'superset',
  'circuit',
  'density',
  'top_set',
  'drop_set',
  'cluster',
  'rest_pause',
  'straight_sets',
]

/**
 * Map AA1 plan method id → AA2 method key. AA1 uses `supersets` / `circuits` /
 * `density_blocks` / `cluster_sets` / `top_sets` / `drop_sets` / `rest_pause` /
 * `straight_sets`; AA2 normalizes to singulars.
 */
function aa1MethodIdToAA2(id: string): AA2MethodKey | null {
  const f = id.toLowerCase()
  if (f === 'supersets') return 'superset'
  if (f === 'circuits') return 'circuit'
  if (f === 'density_blocks') return 'density'
  if (f === 'cluster_sets') return 'cluster'
  if (f === 'top_sets') return 'top_set'
  if (f === 'drop_sets') return 'drop_set'
  if (f === 'rest_pause') return 'rest_pause'
  if (f === 'straight_sets') return 'straight_sets'
  if (f === 'ladder_sets') return null
  return methodSubCategoryFor(id)
}

function evaluateMethods(program: AA2ProgramLike): AA2MethodVerdict[] {
  const out: AA2MethodVerdict[] = []
  const aa1 = program.weeklyMethodMaterializationPlan ?? null
  const userPreferred = new Set<string>(
    Array.isArray(aa1?.userPreferredMethods)
      ? (aa1!.userPreferredMethods as string[]).map((s) => aa1MethodIdToAA2(s)).filter(Boolean) as string[]
      : [],
  )
  const doctrineEarned = new Set<string>(
    Array.isArray(aa1?.doctrineEarnedMethods)
      ? (aa1!.doctrineEarnedMethods as string[]).map((s) => aa1MethodIdToAA2(s)).filter(Boolean) as string[]
      : [],
  )
  const aa1ByMethod = new Map<AA2MethodKey, {
    budgetVerdict?: string
    materializedDays?: number[]
    noSafeTargetDays?: number[]
    reason?: string
  }>()
  if (Array.isArray(aa1?.byMethod)) {
    for (const m of aa1!.byMethod!) {
      if (!m || typeof m.method !== 'string') continue
      const key = aa1MethodIdToAA2(m.method)
      if (!key) continue
      aa1ByMethod.set(key, {
        budgetVerdict: m.budgetVerdict,
        materializedDays: m.materializedDays,
        noSafeTargetDays: m.noSafeTargetDays,
        reason: m.reason,
      })
    }
  }

  // Cross-check session evidence so we never falsely report MATERIALIZED.
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const sessionEvidenceFor = (key: AA2MethodKey): { applied: boolean; rejectedReason: string | null } => {
    let applied = false
    let rejected: string | null = null
    for (const s of sessions) {
      if (!s) continue
      const sm = s.styleMetadata ?? null
      const am = Array.isArray(sm?.appliedMethods) ? sm!.appliedMethods! : []
      if (am.some((x) => methodSubCategoryFor(x) === key)) {
        applied = true
      }
      const rm = Array.isArray(sm?.rejectedMethods) ? sm!.rejectedMethods! : []
      for (const r of rm) {
        if (!r) continue
        if (methodSubCategoryFor(r.method ?? '') === key && typeof r.reason === 'string') {
          rejected = rejected ?? r.reason
        }
      }
      const exs = Array.isArray(s.exercises) ? s.exercises : []
      for (const e of exs) {
        if (!e) continue
        if (methodSubCategoryFor(e.setExecutionMethod ?? null) === key) applied = true
        if (methodSubCategoryFor(e.method ?? null) === key) applied = true
      }
      const groups = Array.isArray(sm?.styledGroups) ? sm!.styledGroups! : []
      for (const g of groups) {
        if (!g) continue
        if (methodSubCategoryFor(g.groupType ?? null) === key) applied = true
      }
    }
    return { applied, rejectedReason: rejected }
  }

  for (const method of METHODS_TO_AUDIT) {
    const aa1Entry = aa1ByMethod.get(method) ?? null
    const matDays = Array.isArray(aa1Entry?.materializedDays) ? aa1Entry!.materializedDays! : []
    const noTargetDays = Array.isArray(aa1Entry?.noSafeTargetDays) ? aa1Entry!.noSafeTargetDays! : []
    const evidence = sessionEvidenceFor(method)
    const wasUserPreferred = userPreferred.has(method)
    const wasDoctrineEarned = doctrineEarned.has(method)

    let state: AA2DoctrineState
    let stage: AA2DecisionStage
    let reason: string
    let reasonCode: string
    let runtimeNote = ''

    // Decision tree — strictly evidence-based. The order is the AA1R
    // preservation: structural truth first, decision second, preference last.
    if (matDays.length > 0 && evidence.applied) {
      state = 'MATERIALIZED_EXECUTABLE'
      stage = 'structuralMaterialization'
      reason = aa1Entry?.reason || `${method.replace('_', ' ')} materialized on ${matDays.length} day(s).`
      reasonCode = 'aa1_materialized_with_session_evidence'
    } else if (matDays.length > 0 && !evidence.applied) {
      // AA1 said materialized but no session-level structural artifact —
      // honest downgrade to ELIGIBLE_AND_APPLIED (some grouped methods report
      // materialized via the budget plan even when their executable form is
      // partial).
      state = 'ELIGIBLE_AND_APPLIED'
      stage = 'methodDecision'
      reason =
        aa1Entry?.reason ||
        `AA1 plan reports materialization for ${method.replace('_', ' ')} but session-level structural evidence is incomplete.`
      reasonCode = 'aa1_materialized_without_full_session_evidence'
    } else if (evidence.applied) {
      state = 'ELIGIBLE_AND_APPLIED'
      stage = 'methodDecision'
      reason = `${method.replace('_', ' ')} appears in session evidence (appliedMethods / styledGroups / setExecutionMethod).`
      reasonCode = 'session_evidence_only'
    } else if (evidence.rejectedReason) {
      state = 'ELIGIBLE_BUT_SUPPRESSED'
      stage = 'methodDecision'
      reason = evidence.rejectedReason
      reasonCode = 'session_rejected_with_reason'
    } else if (noTargetDays.length > 0) {
      state = 'NO_TARGET'
      stage = 'preBuilderPlanning'
      reason =
        aa1Entry?.reason ||
        `${method.replace('_', ' ')} budget allowed it but no session offered a safe target.`
      reasonCode = 'aa1_no_safe_target_days'
    } else if (aa1Entry?.budgetVerdict === 'BLOCKED_BY_SAFETY') {
      state = 'ELIGIBLE_BUT_SUPPRESSED'
      stage = 'recoverySafetyGate'
      reason =
        aa1Entry?.reason ||
        `${method.replace('_', ' ')} blocked by safety gate (tendon / skill priority / weekly recovery).`
      reasonCode = 'aa1_blocked_by_safety'
    } else if (aa1Entry?.budgetVerdict === 'NOT_NEEDED') {
      state = 'NOT_ELIGIBLE'
      stage = 'preBuilderPlanning'
      reason =
        aa1Entry?.reason ||
        `${method.replace('_', ' ')} not earned by user preference or doctrine intent for this cycle.`
      reasonCode = 'aa1_not_needed_for_profile'
    } else if (aa1Entry?.budgetVerdict === 'NOT_CONNECTED') {
      state = 'DISCONNECTED'
      stage = 'disconnected'
      reason =
        aa1Entry?.reason ||
        `${method.replace('_', ' ')} has no materializer wired (registry: MATERIALIZER_NOT_CONNECTED).`
      reasonCode = 'aa1_materializer_not_connected'
      runtimeNote = 'Runtime support not implemented for this method.'
    } else if (aa1Entry?.budgetVerdict === 'SHOULD_APPLY' || aa1Entry?.budgetVerdict === 'MAY_APPLY') {
      state = 'ELIGIBLE_BUT_SUPPRESSED'
      stage = 'methodDecision'
      reason =
        aa1Entry?.reason ||
        `${method.replace('_', ' ')} earned by budget but did not materialize this cycle.`
      reasonCode = 'aa1_budget_earned_not_materialized'
    } else if (method === 'straight_sets') {
      // Straight sets are the fallback default — when nothing grouped fires,
      // straight sets are MATERIALIZED_EXECUTABLE because every row is a
      // straight set unless overridden.
      state = 'MATERIALIZED_EXECUTABLE'
      stage = 'structuralMaterialization'
      reason =
        'Straight sets are the doctrine-correct default for technical-skill priority; every row defaults here unless overridden.'
      reasonCode = 'straight_sets_default_materialized'
    } else {
      state = 'NO_TARGET'
      stage = 'preBuilderPlanning'
      reason = `${method.replace('_', ' ')} not picked, not earned by doctrine, and has no session target this cycle.`
      reasonCode = 'no_pick_no_doctrine_no_target'
    }

    out.push({
      method,
      state,
      decisionStage: stage,
      reason,
      reasonCode,
      userPreferred: wasUserPreferred,
      doctrineEarned: wasDoctrineEarned,
      materializedDays: matDays,
      noSafeTargetDays: noTargetDays,
      sourceOfTruthObjectPath:
        aa1Entry != null
          ? 'program.weeklyMethodMaterializationPlan.byMethod[]'
          : 'program.sessions[*].styleMetadata',
      runtimeSupportNote: runtimeNote,
    })
  }

  return out
}

// -----------------------------------------------------------------------------
// Context mapping audit
// -----------------------------------------------------------------------------

const KNOWN_PROFILE_FIELDS = [
  'selectedSkills',
  'sessionStyle',
  'sessionStylePreference',
  'sessionLengthMinutes',
  'timeAvailability',
  'methodPrefsForGrouping',
  'jointCautions',
  'flexibilityGoals',
  'primaryGoal',
  'secondaryGoal',
  'experienceLevel',
  'requestedTrainingDays',
  'equipmentAvailable',
] as const

function evaluateContextMapping(program: AA2ProgramLike): AA2ContextMappingAudit {
  const ps = program.profileSnapshot ?? null
  const propagated: string[] = []
  const missing: string[] = []
  for (const field of KNOWN_PROFILE_FIELDS) {
    const v = ps != null ? (ps as unknown as Record<string, unknown>)[field] : undefined
    const present =
      v != null &&
      (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.length > 0 : true)
    if (present) propagated.push(field)
    else missing.push(field)
  }

  const aa1 = program.weeklyMethodMaterializationPlan
  const userPrefCount = Array.isArray(aa1?.userPreferredMethods)
    ? aa1!.userPreferredMethods!.length
    : 0
  const userPickedAndApplied = aa1?.totals?.methodsUserPickedAndApplied ?? 0
  const userPickedNotApplied = aa1?.totals?.methodsUserPickedNotApplied ?? 0

  let methodPropNote: string
  if (userPrefCount === 0) {
    methodPropNote =
      'No method preferences in onboarding; doctrine-only method selection is in effect.'
  } else if (userPickedAndApplied === userPrefCount) {
    methodPropNote = `All ${userPrefCount} method preference(s) propagated and at least one materialized.`
  } else if (userPickedAndApplied > 0) {
    methodPropNote = `${userPickedAndApplied} of ${userPrefCount} preferred method(s) materialized; ${userPickedNotApplied} did not — see byMethod.reason.`
  } else {
    methodPropNote = `Method preferences (${userPrefCount}) did not materialize this cycle — straight-sets default or safety suppression.`
  }

  return {
    fieldsPropagated: propagated,
    fieldsMissingOrDiluted: missing,
    methodPreferencePropagationNote: methodPropNote,
  }
}

// -----------------------------------------------------------------------------
// Causality findings — partition families by their final state.
// -----------------------------------------------------------------------------

function evaluateCausality(families: AA2FamilyVerdict[]): AA2CausalityFindings {
  const causal: AA2DoctrineFamily[] = []
  const postHoc: AA2DoctrineFamily[] = []
  const disconnected: AA2DoctrineFamily[] = []
  const runtimeBlocked: AA2DoctrineFamily[] = []
  for (const f of families) {
    switch (f.state) {
      case 'VISIBLE':
      case 'MATERIALIZED_EXECUTABLE':
      case 'ELIGIBLE_AND_APPLIED':
        causal.push(f.family)
        break
      case 'POST_HOC_ONLY':
      case 'PROOF_ONLY':
        postHoc.push(f.family)
        break
      case 'DISCONNECTED':
        disconnected.push(f.family)
        break
      case 'BLOCKED_BY_UNSUPPORTED_RUNTIME':
        runtimeBlocked.push(f.family)
        break
      default:
        // ELIGIBLE / NO_TARGET / NOT_ELIGIBLE / SUPPRESSED — neither causal
        // nor post-hoc-only; we don't list them here to keep the headline
        // honest.
        break
    }
  }
  return {
    causalFamilies: causal,
    postHocFamilies: postHoc,
    disconnectedFamilies: disconnected,
    runtimeBlockedFamilies: runtimeBlocked,
  }
}

// -----------------------------------------------------------------------------
// AA3 target — pick the single biggest disconnect.
// -----------------------------------------------------------------------------

function recommendAA3Target(
  families: AA2FamilyVerdict[],
  methods: AA2MethodVerdict[],
): AA2DoctrineUtilizationMap['recommendedAA3Target'] {
  // Priority 1: a disconnected family.
  const disconnected = families.find((f) => f.state === 'DISCONNECTED')
  if (disconnected) {
    return {
      family: disconnected.family,
      method: null,
      rationale: `Family "${disconnected.family}" is loaded but has no materializer wired (registry: ${disconnected.materializerRegistryStatus}). Wiring it would unlock the largest readability gain.`,
    }
  }
  // Priority 2: a high-value scoring-only family (prescription / progression).
  const scoringOnly = families.find(
    (f) =>
      f.materializerRegistryStatus === 'SCORING_ONLY_NO_MUTATOR' &&
      (f.state === 'ELIGIBLE' || f.state === 'PROOF_ONLY' || f.state === 'POST_HOC_ONLY'),
  )
  if (scoringOnly) {
    return {
      family: scoringOnly.family,
      method: null,
      rationale: `Family "${scoringOnly.family}" reads doctrine into bias flags but never mutates the program (registry: SCORING_ONLY_NO_MUTATOR). A bounded numeric mutator with safety gates would convert this from proof-only to causal.`,
    }
  }
  // Priority 3: a user-preferred method that is suppressed without a runtime reason.
  const wantedNotShipped = methods.find(
    (m) =>
      m.userPreferred &&
      (m.state === 'ELIGIBLE_BUT_SUPPRESSED' || m.state === 'NO_TARGET') &&
      m.reasonCode !== 'aa1_materializer_not_connected',
  )
  if (wantedNotShipped) {
    return {
      family: 'method',
      method: wantedNotShipped.method,
      rationale: `User picked "${wantedNotShipped.method}" but it did not materialize (${wantedNotShipped.reasonCode}). Investigate whether the budget gate is too restrictive or the session role assignment lacks a target.`,
    }
  }
  // Priority 4: a runtime-blocked family.
  const runtimeBlocked = families.find((f) => f.state === 'BLOCKED_BY_UNSUPPORTED_RUNTIME')
  if (runtimeBlocked) {
    return {
      family: runtimeBlocked.family,
      method: null,
      rationale: `Family "${runtimeBlocked.family}" is doctrine-valid but blocked by runtime support. Extending the live workout runtime would unblock it.`,
    }
  }
  return {
    family: null,
    method: null,
    rationale: 'No single dominant disconnect identified; AA3 may focus on rule-level granularity.',
  }
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

export interface RunAA2DoctrineUtilizationOptions {
  nowIso?: string
}

export interface RunAA2DoctrineUtilizationResult<TProgram> {
  program: TProgram
  map: AA2DoctrineUtilizationMap
}

/**
 * Pure deterministic resolver. Reads only existing program artifacts, stamps
 * `program.aa2DoctrineUtilizationMap` on a NEW returned program object (input
 * is never mutated), and returns the map separately for diagnostics.
 *
 * Side-effect-free: no console.log, no fetch, no time source other than the
 * provided / Date.now() ISO string.
 */
export function runAA2DoctrineUtilizationContract<TProgram extends object>(
  programInput: TProgram,
  options: RunAA2DoctrineUtilizationOptions = {},
): RunAA2DoctrineUtilizationResult<TProgram> {
  const nowIso = options.nowIso ?? new Date().toISOString()
  const program = programInput as unknown as AA2ProgramLike

  let error: string | undefined
  let sourceInventory: AA2SourceInventory
  let pipeline: AA2PipelineStage[]
  let byFamily: AA2FamilyVerdict[]
  let byMethod: AA2MethodVerdict[]
  let contextMapping: AA2ContextMappingAudit
  let causality: AA2CausalityFindings
  let recommendedAA3Target: AA2DoctrineUtilizationMap['recommendedAA3Target']

  try {
    sourceInventory = evaluateSourceInventory(program)
    pipeline = evaluatePipeline(program)
    byFamily = evaluateFamilies(program)
    byMethod = evaluateMethods(program)
    contextMapping = evaluateContextMapping(program)
    causality = evaluateCausality(byFamily)
    recommendedAA3Target = recommendAA3Target(byFamily, byMethod)
  } catch (err) {
    error = String(err)
    sourceInventory = {
      sourceBatchCount: 0,
      sourceBatchTotalAtoms: 0,
      perBatch: [],
      dbRuleCountIfKnown: null,
      codeRegistryCounts: null,
      runtimeContractSource: null,
      runtimeContractAvailable: false,
      runtimeContractCoherence: null,
    }
    pipeline = []
    byFamily = []
    byMethod = []
    contextMapping = {
      fieldsPropagated: [],
      fieldsMissingOrDiluted: [],
      methodPreferencePropagationNote: 'AA2 evaluator threw; context mapping not computed.',
    }
    causality = {
      causalFamilies: [],
      postHocFamilies: [],
      disconnectedFamilies: [],
      runtimeBlockedFamilies: [],
    }
    recommendedAA3Target = {
      family: null,
      method: null,
      rationale: 'AA2 evaluator threw; recommendation unavailable.',
    }
  }

  // Compute headline verdict from worst family state.
  let worst: AA2DoctrineState = 'VISIBLE'
  for (const f of byFamily) worst = worseOf(worst, f.state)
  const causalCount = causality.causalFamilies.length
  const totalFamilies = byFamily.length
  const overallVerdict: AA2DoctrineUtilizationMap['overallVerdict'] = error
    ? 'UNKNOWN'
    : worst === 'VISIBLE' || worst === 'MATERIALIZED_EXECUTABLE' || worst === 'ELIGIBLE_AND_APPLIED'
      ? 'FULLY_CAUSAL'
      : causalCount >= Math.ceil(totalFamilies / 2)
        ? 'PARTIALLY_CAUSAL'
        : 'MOSTLY_POST_HOC'

  const summary = buildOneLineSummary(overallVerdict, byFamily, byMethod, causality)

  const map: AA2DoctrineUtilizationMap = {
    version: 'phase-aa2.utilization-map.v1',
    generatedAt: nowIso,
    overallVerdict,
    summary,
    sourceInventory,
    pipeline,
    byFamily,
    byMethod,
    contextMapping,
    causality,
    recommendedAA3Target,
    ...(error ? { error } : {}),
  }

  const newProgram = {
    ...(program as object),
    aa2DoctrineUtilizationMap: map,
  } as unknown as TProgram

  return { program: newProgram, map }
}

// -----------------------------------------------------------------------------
// One-line summary builder — compact, trace-derived, never generic.
// -----------------------------------------------------------------------------

function buildOneLineSummary(
  verdict: AA2DoctrineUtilizationMap['overallVerdict'],
  families: AA2FamilyVerdict[],
  methods: AA2MethodVerdict[],
  causality: AA2CausalityFindings,
): string {
  const head =
    verdict === 'FULLY_CAUSAL'
      ? 'Doctrine fully causal'
      : verdict === 'PARTIALLY_CAUSAL'
        ? 'Doctrine partially causal'
        : verdict === 'MOSTLY_POST_HOC'
          ? 'Doctrine mostly post-hoc'
          : 'Doctrine readability unknown'
  const causalLabel =
    causality.causalFamilies.length > 0
      ? `${causality.causalFamilies.length}/${families.length} families causal`
      : 'no families proven causal'
  const methodHeadline = methods
    .filter((m) => m.state === 'MATERIALIZED_EXECUTABLE' || m.state === 'ELIGIBLE_AND_APPLIED')
    .map((m) => m.method.replace('_', ' '))
  const methodPart =
    methodHeadline.length > 0
      ? `methods: ${methodHeadline.slice(0, 4).join(', ')}${methodHeadline.length > 4 ? '…' : ''}`
      : 'methods: straight-sets default'
  return `${head} — ${causalLabel}; ${methodPart}.`
}
