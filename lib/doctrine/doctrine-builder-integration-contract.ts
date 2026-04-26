/**
 * DOCTRINE → BUILDER INTEGRATION CONTRACT (Phase 1, types-only)
 *
 * PURPOSE:
 * Defines the small, stable, builder-safe shape that Phase 2 will hand to the
 * adaptive program builder so it can consume *selected* doctrine influence
 * without re-querying the doctrine DB or re-walking the full Batch 1–10 atom
 * universe at every decision site.
 *
 * SCOPE — PHASE 1:
 * - This file is types + pure helpers ONLY.
 * - No DB queries.
 * - No async I/O.
 * - No imports from the adaptive-program-builder (one-way dependency only).
 * - No mutation of program output.
 *
 * RELATION TO EXISTING CONTRACTS:
 * - lib/doctrine-runtime-contract.ts            : the LARGE upstream contract built once
 *                                                  per generation from Doctrine DB +
 *                                                  Batch 1–10 fallback.
 * - lib/doctrine/doctrine-influence-contract.ts : shadow/merge contract that classifies
 *                                                  source ownership per domain.
 * - lib/doctrine/unified-doctrine-decision-model.ts
 *                                                : translates doctrine into dominant-spine
 *                                                  + integration constraints + selection
 *                                                  rules used by the builder/selector.
 * - THIS FILE                                   : compact, builder-input-shaped surface
 *                                                  that Phase 2 will mount onto the
 *                                                  builder so per-decision sites can
 *                                                  read selected doctrine evidence with
 *                                                  provenance preserved.
 *
 * WHY NEW (instead of extending DoctrineInfluenceContract):
 * The influence contract is a domain-ownership classifier. The runtime contract is a
 * full doctrine truth bundle. Neither exposes the *compact, decision-site-shaped*
 * payload the builder needs (selected summaries with provenance + decision flags +
 * visible-proof hints). This contract is the explicit handoff between the two layers.
 *
 * SAFETY:
 * - Types only. Cannot change generation behavior on its own.
 * - All helpers are pure (no clocks except builtAt timestamp; no DB; no fs).
 * - Default values are conservative: when input is null/undefined the helpers return
 *   an unusable context with diagnostics.usable=false.
 */

import type { DoctrineRuntimeContract } from '../doctrine-runtime-contract'

// =============================================================================
// EXPECTED BATCHES
// =============================================================================

/**
 * The 10 doctrine batches that must be present in the fallback aggregator.
 * Kept here as a literal tuple so Phase 1 audit can compare expected vs actual
 * without reaching into source-batch internals.
 */
export const EXPECTED_DOCTRINE_BATCH_KEYS = [
  'batch_01',
  'batch_02',
  'batch_03',
  'batch_04',
  'batch_05',
  'batch_06',
  'batch_07',
  'batch_08',
  'batch_09',
  'batch_10',
] as const

export type ExpectedDoctrineBatchKey = (typeof EXPECTED_DOCTRINE_BATCH_KEYS)[number]

// =============================================================================
// SOURCE MODE
// =============================================================================

/**
 * Builder-facing source-mode label. Mapped from `DoctrineRuntimeContract.source`,
 * which has a slightly larger union (it includes the legacy `fallback_batch_01`
 * and an internal `fallback_none` value). This contract collapses those to the
 * four user-visible modes the Program UI actually distinguishes.
 */
export type DoctrineSourceMode =
  | 'db_live'
  | 'fallback_uploaded_batches'
  | 'hybrid_db_plus_uploaded_fallback'
  | 'unavailable'

// =============================================================================
// SUMMARY ATOM
// =============================================================================

/**
 * A single doctrine influence atom in the form the builder needs.
 *
 * NOTE: Phase 2 should populate this from the runtime contract / unified
 * decision model — NOT from the raw uploaded-batch aggregator. The point of
 * this contract is selected, not exhaustive.
 */
export interface DoctrineInfluenceSummary {
  /** Stable atom id (matches doctrine DB row id when DB-sourced). */
  id: string
  /** Source row id (e.g. 'src_batch_10_method_governor_v1'); null for legacy. */
  sourceId: string | null
  /** Originating batch (e.g. 'batch_10') when known. */
  batch: string | null
  /** Doctrine family (progression | method | prescription | carryover | selection | safety | flexibility | military | advanced_skill). */
  family: string | null
  title: string
  summary: string
  priorityWeight?: number
  safetyPriority?: number
  tags?: string[]
  appliesTo?: string[]
  rejectsFor?: string[]
  /** A short human-readable phrase the Program UI may surface as proof (e.g. "Top set + back-off — Batch 10 method governor"). */
  visibleEvidence?: string
}

// =============================================================================
// DECISION CONTEXT
// =============================================================================

/**
 * The compact, builder-safe decision payload. Phase 2 will pass an instance of
 * this directly to builder input assembly and per-decision call sites. It is
 * deliberately shallow: no nested doctrine atoms beyond `DoctrineInfluenceSummary`.
 */
export interface DoctrineBuilderDecisionContext {
  /** Stable id for diagnostics + log correlation. */
  contextId: string
  /** ISO timestamp of construction. */
  builtAt: string
  /** Mirrors the runtime contract's contractVersion when derived from one, else '1.0.0-phase1'. */
  contextVersion: string

  /** Where the doctrine evidence came from. */
  sourceMode: DoctrineSourceMode

  /** Coverage of the registered Batch 1–10 fallback set. */
  batchCoverage: {
    expectedBatches: readonly string[]
    presentBatches: string[]
    missingBatches: string[]
    /** Batches that have *some* atoms but were filled from fallback rather than DB. */
    partialBatches: string[]
  }

  /**
   * Selected doctrine summaries grouped by family. Phase 1 leaves these arrays
   * empty by default; Phase 2 populates them from the unified decision model.
   * The builder MUST treat empty arrays as "no doctrine influence in this
   * family" — never as "doctrine universe is empty".
   */
  selectedDoctrine: {
    principles: DoctrineInfluenceSummary[]
    progressionRules: DoctrineInfluenceSummary[]
    exerciseSelectionRules: DoctrineInfluenceSummary[]
    contraindicationRules: DoctrineInfluenceSummary[]
    methodRules: DoctrineInfluenceSummary[]
    prescriptionRules: DoctrineInfluenceSummary[]
    carryoverRules: DoctrineInfluenceSummary[]
  }

  /** Boolean fast-paths for per-decision branching without re-walking arrays. */
  decisionFlags: {
    protectsPrimarySkill: boolean
    hasMethodDecisionRules: boolean
    hasWarmupCooldownRules: boolean
    hasLowerBodyPreferenceRules: boolean
    hasMilitaryRules: boolean
    hasAdvancedSkillRules: boolean
    hasFlexibilityRules: boolean
    hasContraindicationRules: boolean
  }

  /** What the Program UI is allowed to show as visible doctrine proof. */
  visibleProof: {
    doctrineSourceLabel: string
    expectedProgramInfluences: string[]
    missingInfluences: string[]
  }

  /** Honest health report. Builder should consult this BEFORE consuming. */
  diagnostics: {
    usable: boolean
    blocker: string | null
    warnings: string[]
  }
}

// =============================================================================
// PURE HELPERS
// =============================================================================

const PHASE1_VERSION = '1.0.0-phase1'

let monotonicCounter = 0
function nextContextId(): string {
  monotonicCounter = (monotonicCounter + 1) & 0xffff
  return `dbic-${Date.now().toString(36)}-${monotonicCounter.toString(36)}`
}

/** Returns a fresh, empty, *unusable* context. Safe to pass anywhere. */
export function buildEmptyDoctrineDecisionContext(): DoctrineBuilderDecisionContext {
  return {
    contextId: nextContextId(),
    builtAt: new Date().toISOString(),
    contextVersion: PHASE1_VERSION,
    sourceMode: 'unavailable',
    batchCoverage: {
      expectedBatches: EXPECTED_DOCTRINE_BATCH_KEYS,
      presentBatches: [],
      missingBatches: [...EXPECTED_DOCTRINE_BATCH_KEYS],
      partialBatches: [],
    },
    selectedDoctrine: {
      principles: [],
      progressionRules: [],
      exerciseSelectionRules: [],
      contraindicationRules: [],
      methodRules: [],
      prescriptionRules: [],
      carryoverRules: [],
    },
    decisionFlags: {
      protectsPrimarySkill: false,
      hasMethodDecisionRules: false,
      hasWarmupCooldownRules: false,
      hasLowerBodyPreferenceRules: false,
      hasMilitaryRules: false,
      hasAdvancedSkillRules: false,
      hasFlexibilityRules: false,
      hasContraindicationRules: false,
    },
    visibleProof: {
      doctrineSourceLabel: 'unavailable',
      expectedProgramInfluences: [],
      missingInfluences: [],
    },
    diagnostics: {
      usable: false,
      blocker: 'no_doctrine_decision_context_built',
      warnings: [],
    },
  }
}

/**
 * Map the runtime contract's `source` field onto the builder-facing source mode.
 * Intentionally pure; does not mutate `runtime`.
 */
export function mapRuntimeSourceToBuilderSourceMode(
  runtimeSource: DoctrineRuntimeContract['source'] | null | undefined,
): DoctrineSourceMode {
  switch (runtimeSource) {
    case 'db_live':
      return 'db_live'
    case 'hybrid_db_plus_uploaded_fallback':
      return 'hybrid_db_plus_uploaded_fallback'
    case 'fallback_uploaded_pdf_batches':
    case 'fallback_batch_01':
      return 'fallback_uploaded_batches'
    case 'fallback_none':
    case null:
    case undefined:
    default:
      return 'unavailable'
  }
}

/**
 * Phase 1 read-only summary of doctrine coverage for the builder. Does NOT
 * fabricate selectedDoctrine arrays — Phase 2 owns that. This helper exists so
 * the corridor audit + future builder wiring can both compute the *same*
 * coverage shape without duplicating logic.
 */
export function summarizeDoctrineCoverageForBuilder(
  runtime: DoctrineRuntimeContract | null | undefined,
): {
  sourceMode: DoctrineSourceMode
  batchCoverage: DoctrineBuilderDecisionContext['batchCoverage']
  visibleProof: DoctrineBuilderDecisionContext['visibleProof']
} {
  if (!runtime || !runtime.available) {
    return {
      sourceMode: 'unavailable',
      batchCoverage: {
        expectedBatches: EXPECTED_DOCTRINE_BATCH_KEYS,
        presentBatches: [],
        missingBatches: [...EXPECTED_DOCTRINE_BATCH_KEYS],
        partialBatches: [],
      },
      visibleProof: {
        doctrineSourceLabel: 'unavailable',
        expectedProgramInfluences: [],
        missingInfluences: [],
      },
    }
  }

  const sourceMode = mapRuntimeSourceToBuilderSourceMode(runtime.source)

  const presentBatches: string[] = []
  const missingBatches: string[] = []
  const partialBatches: string[] = []

  const counts = runtime.batchCoverage?.batchAtomCounts ?? {}
  const filledFromFallback = new Set(runtime.dbCompleteness?.filledFromFallback ?? [])

  for (const bk of EXPECTED_DOCTRINE_BATCH_KEYS) {
    const c = counts[bk] ?? 0
    if (c > 0) {
      presentBatches.push(bk)
      // "Partial" here means: the batch IS represented in the merged set, but
      // it was filled from in-code fallback rather than DB. The Program UI
      // can surface this as honest proof without claiming DB completeness.
      if (filledFromFallback.has(bk)) partialBatches.push(bk)
    } else {
      missingBatches.push(bk)
    }
  }

  return {
    sourceMode,
    batchCoverage: {
      expectedBatches: EXPECTED_DOCTRINE_BATCH_KEYS,
      presentBatches,
      missingBatches,
      partialBatches,
    },
    visibleProof: {
      doctrineSourceLabel: sourceMode,
      expectedProgramInfluences: runtime.explanationDoctrine?.userVisibleSummary ?? [],
      missingInfluences: runtime.explanationDoctrine?.hiddenFactors ?? [],
    },
  }
}

/**
 * Phase 1 helper: derive an EMPTY-DECISION context from a runtime contract.
 * This intentionally does NOT populate selectedDoctrine arrays — that is
 * Phase 2's responsibility. The builder will still see authoritative coverage
 * + diagnostics so it can decide whether to engage doctrine-guided generation.
 */
export function mapRuntimeContractToBuilderContext(
  runtime: DoctrineRuntimeContract | null | undefined,
): DoctrineBuilderDecisionContext {
  const ctx = buildEmptyDoctrineDecisionContext()
  if (!runtime || !runtime.available) {
    ctx.diagnostics = {
      usable: false,
      blocker: 'doctrine_runtime_contract_unavailable',
      warnings: [],
    }
    return ctx
  }

  const summary = summarizeDoctrineCoverageForBuilder(runtime)
  ctx.contextVersion = `${PHASE1_VERSION}+rc:${runtime.contractVersion}`
  ctx.sourceMode = summary.sourceMode
  ctx.batchCoverage = summary.batchCoverage
  ctx.visibleProof = summary.visibleProof

  const cov = runtime.doctrineCoverage
  ctx.decisionFlags = {
    // True coverage signals — selectedDoctrine arrays remain empty until Phase 2.
    protectsPrimarySkill: (runtime.skillDoctrine?.representedSkills?.length ?? 0) > 0,
    hasMethodDecisionRules: cov.methodRuleCount > 0,
    hasWarmupCooldownRules: false, // Phase 2: derived from Batch 9 selection rules
    hasLowerBodyPreferenceRules: false, // Phase 2: derived from Batch 7 selection rules
    hasMilitaryRules: false, // Phase 2: derived from Batch 7 sources
    hasAdvancedSkillRules: false, // Phase 2: derived from Batch 8 sources
    hasFlexibilityRules: false, // Phase 2: derived from Batch 9 sources
    hasContraindicationRules: false, // Phase 2: derived from Batch 6/8/9 contraindications
  }

  ctx.diagnostics = {
    // "usable" is intentionally conservative in Phase 1: the runtime contract
    // is available AND coverage is non-trivial AND no batches are missing.
    usable:
      runtime.doctrineCoverage.hasLiveRules &&
      ctx.batchCoverage.missingBatches.length === 0,
    blocker: null,
    warnings: ctx.batchCoverage.partialBatches.length > 0
      ? [
          `partial_batches:${ctx.batchCoverage.partialBatches.join(',')}`,
        ]
      : [],
  }

  return ctx
}

/**
 * Defensive normalizer for any caller that has a partial/possibly-malformed
 * decision context (e.g. across a save/load boundary). Returns a fully-populated
 * context with the missing fields filled from the empty default.
 */
export function normalizeDoctrineDecisionContext(
  context: Partial<DoctrineBuilderDecisionContext> | null | undefined,
): DoctrineBuilderDecisionContext {
  if (!context) return buildEmptyDoctrineDecisionContext()
  const empty = buildEmptyDoctrineDecisionContext()
  return {
    contextId: context.contextId ?? empty.contextId,
    builtAt: context.builtAt ?? empty.builtAt,
    contextVersion: context.contextVersion ?? empty.contextVersion,
    sourceMode: context.sourceMode ?? empty.sourceMode,
    batchCoverage: {
      expectedBatches: context.batchCoverage?.expectedBatches ?? empty.batchCoverage.expectedBatches,
      presentBatches: context.batchCoverage?.presentBatches ?? empty.batchCoverage.presentBatches,
      missingBatches: context.batchCoverage?.missingBatches ?? empty.batchCoverage.missingBatches,
      partialBatches: context.batchCoverage?.partialBatches ?? empty.batchCoverage.partialBatches,
    },
    selectedDoctrine: {
      principles: context.selectedDoctrine?.principles ?? [],
      progressionRules: context.selectedDoctrine?.progressionRules ?? [],
      exerciseSelectionRules: context.selectedDoctrine?.exerciseSelectionRules ?? [],
      contraindicationRules: context.selectedDoctrine?.contraindicationRules ?? [],
      methodRules: context.selectedDoctrine?.methodRules ?? [],
      prescriptionRules: context.selectedDoctrine?.prescriptionRules ?? [],
      carryoverRules: context.selectedDoctrine?.carryoverRules ?? [],
    },
    decisionFlags: {
      protectsPrimarySkill: context.decisionFlags?.protectsPrimarySkill ?? false,
      hasMethodDecisionRules: context.decisionFlags?.hasMethodDecisionRules ?? false,
      hasWarmupCooldownRules: context.decisionFlags?.hasWarmupCooldownRules ?? false,
      hasLowerBodyPreferenceRules: context.decisionFlags?.hasLowerBodyPreferenceRules ?? false,
      hasMilitaryRules: context.decisionFlags?.hasMilitaryRules ?? false,
      hasAdvancedSkillRules: context.decisionFlags?.hasAdvancedSkillRules ?? false,
      hasFlexibilityRules: context.decisionFlags?.hasFlexibilityRules ?? false,
      hasContraindicationRules: context.decisionFlags?.hasContraindicationRules ?? false,
    },
    visibleProof: {
      doctrineSourceLabel: context.visibleProof?.doctrineSourceLabel ?? empty.visibleProof.doctrineSourceLabel,
      expectedProgramInfluences: context.visibleProof?.expectedProgramInfluences ?? [],
      missingInfluences: context.visibleProof?.missingInfluences ?? [],
    },
    diagnostics: {
      usable: context.diagnostics?.usable ?? false,
      blocker: context.diagnostics?.blocker ?? null,
      warnings: context.diagnostics?.warnings ?? [],
    },
  }
}

/**
 * Thin gate the builder will call before consuming `selectedDoctrine`.
 * Phase 1: stays conservative — usable=false unless coverage is non-trivial.
 */
export function isDoctrineDecisionContextUsable(
  context: DoctrineBuilderDecisionContext | null | undefined,
): boolean {
  if (!context) return false
  return context.diagnostics.usable === true && context.sourceMode !== 'unavailable'
}
