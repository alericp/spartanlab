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

// =============================================================================
// PHASE 2 — PROGRAM-LEVEL METADATA SHAPE
// =============================================================================
//
// `DoctrineIntegrationProof` is the COMPACT proof object that Phase 2 attaches
// to the generated AdaptiveProgram (`program.doctrineIntegration`). It does
// NOT carry raw doctrine atoms; it carries selected counts, decision flags,
// a small set of representative `DoctrineInfluenceSummary` items per category
// (with batch + sourceFamily provenance preserved), and an honest disclaimer
// that Phase 2 has wired *context* — not yet doctrine-driven decisions.
//
// Persistence: the program is JSON.stringify'd whole by setActiveProgram, so
// `doctrineIntegration` survives save/load with no normalize boundary needed.
// =============================================================================

export type DoctrineIntegrationContextStatus =
  | 'active'      // doctrine context reached the builder + is usable
  | 'degraded'    // doctrine context reached the builder but is partial / partial DB / missing batches
  | 'unavailable' // no doctrine runtime contract was available

/**
 * Selected-counts mirror of `DoctrineBuilderDecisionContext.selectedDoctrine`.
 * Numbers only — used for the program-UI proof strip and for fast diffs.
 */
export interface DoctrineIntegrationSelectedCounts {
  principles: number
  progressionRules: number
  exerciseSelectionRules: number
  contraindicationRules: number
  methodRules: number
  prescriptionRules: number
  carryoverRules: number
}

/**
 * Compact, save-safe proof object attached to every generated program.
 * Never references the live runtime contract; everything here is a snapshot.
 */
export interface DoctrineIntegrationProof {
  /** Phase tag — flips when Phase 3 starts changing actual decisions. */
  phase: 'phase_2_context_wired'

  /** Honest health label for the Program UI. */
  contextStatus: DoctrineIntegrationContextStatus

  /** Mirrors decisionContext.sourceMode (db_live | fallback | hybrid | unavailable). */
  sourceMode: DoctrineSourceMode

  /** Mirrors decisionContext.batchCoverage. */
  batchCoverage: DoctrineBuilderDecisionContext['batchCoverage']
  presentBatches: string[]
  missingBatches: string[]

  /** Counts of the selected (compact) doctrine arrays handed to the builder. */
  selectedCounts: DoctrineIntegrationSelectedCounts

  /** Top-N representative summaries per category — preserves batch/source provenance. */
  selectedSummaries: {
    principles: DoctrineInfluenceSummary[]
    progressionRules: DoctrineInfluenceSummary[]
    exerciseSelectionRules: DoctrineInfluenceSummary[]
    contraindicationRules: DoctrineInfluenceSummary[]
    methodRules: DoctrineInfluenceSummary[]
    prescriptionRules: DoctrineInfluenceSummary[]
    carryoverRules: DoctrineInfluenceSummary[]
  }

  /** Boolean fast-paths — copy of decisionContext.decisionFlags. */
  decisionFlags: DoctrineBuilderDecisionContext['decisionFlags']

  /** What the Program UI is allowed to claim Phase 2 reached. */
  expectedProgramInfluences: string[]
  missingInfluences: string[]

  /** Honest health report. */
  diagnostics: DoctrineBuilderDecisionContext['diagnostics']

  /** Stable disclaimer the Program UI must display next to the proof. */
  disclaimer: string

  /** ISO timestamp of the proof attachment (set by the wrapper). */
  attachedAt: string

  /** decisionContext.contextId for log correlation. */
  contextId: string
  contextVersion: string
}

const PHASE2_DISCLAIMER =
  'Doctrine context reached the builder. Phase 2 does not yet allow doctrine to change exercise selection or prescriptions.'

/**
 * Hard cap so the proof never bloats the program payload. Tuned for "enough
 * provenance for the UI to render an honest list" and nothing more.
 */
const PROOF_PER_CATEGORY_CAP = 6

function emptyProof(): DoctrineIntegrationProof {
  return {
    phase: 'phase_2_context_wired',
    contextStatus: 'unavailable',
    sourceMode: 'unavailable',
    batchCoverage: {
      expectedBatches: EXPECTED_DOCTRINE_BATCH_KEYS,
      presentBatches: [],
      missingBatches: [...EXPECTED_DOCTRINE_BATCH_KEYS],
      partialBatches: [],
    },
    presentBatches: [],
    missingBatches: [...EXPECTED_DOCTRINE_BATCH_KEYS],
    selectedCounts: {
      principles: 0,
      progressionRules: 0,
      exerciseSelectionRules: 0,
      contraindicationRules: 0,
      methodRules: 0,
      prescriptionRules: 0,
      carryoverRules: 0,
    },
    selectedSummaries: {
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
    expectedProgramInfluences: [],
    missingInfluences: [],
    diagnostics: {
      usable: false,
      blocker: 'no_doctrine_runtime_contract',
      warnings: [],
    },
    disclaimer: PHASE2_DISCLAIMER,
    attachedAt: new Date().toISOString(),
    contextId: 'unavailable',
    contextVersion: 'unavailable',
  }
}

/**
 * Read-only summary derivation: walks the runtime contract bundles and emits
 * a small DoctrineInfluenceSummary[] per category. Pure; no DB; no clocks
 * beyond `attachedAt` written by the caller.
 *
 * IMPORTANT: this never copies raw atoms. Each summary item is a *reference
 * line* the Program UI can render with provenance.
 */
function deriveSelectedSummaries(
  runtime: DoctrineRuntimeContract,
): DoctrineIntegrationProof['selectedSummaries'] {
  const principles: DoctrineInfluenceSummary[] = []
  const methodRules: DoctrineInfluenceSummary[] = []
  const prescriptionRules: DoctrineInfluenceSummary[] = []
  const exerciseSelectionRules: DoctrineInfluenceSummary[] = []
  const carryoverRules: DoctrineInfluenceSummary[] = []
  const progressionRules: DoctrineInfluenceSummary[] = []
  // Contraindications: runtime doesn't expose a category bundle today; Phase 2
  // surfaces 0 here and the Program UI will explicitly say so. This matches
  // the audit-truth principle that we never invent doctrine claims.
  const contraindicationRules: DoctrineInfluenceSummary[] = []

  // ---- principles: derive from headlineReasons + userVisibleSummary
  const headlines = runtime.explanationDoctrine?.headlineReasons ?? []
  for (let i = 0; i < headlines.length && principles.length < PROOF_PER_CATEGORY_CAP; i++) {
    const text = headlines[i]
    if (!text) continue
    principles.push({
      id: `principle_headline_${i}`,
      sourceId: null,
      batch: null,
      family: 'principle',
      title: text,
      summary: text,
      visibleEvidence: text,
    })
  }

  // ---- method rules: pull from preferred / blocked / limited
  const md = runtime.methodDoctrine
  if (md) {
    for (const m of md.preferredMethods.slice(0, PROOF_PER_CATEGORY_CAP)) {
      const reasons = md.methodReasons?.[m] ?? []
      methodRules.push({
        id: `method_preferred_${m}`,
        sourceId: null,
        batch: null,
        family: 'method',
        title: `Preferred: ${m}`,
        summary: reasons[0] ?? `Method preferred by current doctrine: ${m}`,
        appliesTo: [m],
        visibleEvidence: `Preferred — ${m}`,
      })
    }
    for (const m of md.blockedMethods.slice(0, PROOF_PER_CATEGORY_CAP - methodRules.length)) {
      const reasons = md.methodReasons?.[m] ?? []
      methodRules.push({
        id: `method_blocked_${m}`,
        sourceId: null,
        batch: null,
        family: 'method',
        title: `Blocked: ${m}`,
        summary: reasons[0] ?? `Method blocked by current doctrine: ${m}`,
        rejectsFor: [m],
        visibleEvidence: `Blocked — ${m}`,
      })
    }
  }

  // ---- prescription rules: pull from rationale lines + biases
  const px = runtime.prescriptionDoctrine
  if (px) {
    const rats = px.rationale ?? []
    for (let i = 0; i < rats.length && prescriptionRules.length < PROOF_PER_CATEGORY_CAP; i++) {
      const text = rats[i]
      if (!text) continue
      prescriptionRules.push({
        id: `prescription_rationale_${i}`,
        sourceId: null,
        batch: null,
        family: 'prescription',
        title: text,
        summary: text,
        visibleEvidence: text,
      })
    }
    if (prescriptionRules.length < PROOF_PER_CATEGORY_CAP) {
      const tagBits: string[] = []
      if (px.intensityBias) tagBits.push(`intensity:${px.intensityBias}`)
      if (px.volumeBias) tagBits.push(`volume:${px.volumeBias}`)
      if (px.densityBias) tagBits.push(`density:${px.densityBias}`)
      if (px.holdBias) tagBits.push(`hold:${px.holdBias}`)
      if (tagBits.length > 0) {
        prescriptionRules.push({
          id: 'prescription_bias_summary',
          sourceId: null,
          batch: null,
          family: 'prescription',
          title: 'Prescription biases',
          summary: tagBits.join(' · '),
          tags: tagBits,
          visibleEvidence: tagBits.join(' · '),
        })
      }
    }
  }

  // ---- exercise selection rules: from exerciseDoctrine.summary
  const ex = runtime.exerciseDoctrine
  if (ex) {
    const sums = ex.summary ?? []
    for (let i = 0; i < sums.length && exerciseSelectionRules.length < PROOF_PER_CATEGORY_CAP; i++) {
      const text = sums[i]
      if (!text) continue
      exerciseSelectionRules.push({
        id: `selection_summary_${i}`,
        sourceId: null,
        batch: null,
        family: 'exercise_selection',
        title: text,
        summary: text,
        visibleEvidence: text,
      })
    }
  }

  // ---- carryover rules: from skillDoctrine.carryoverMap
  const sk = runtime.skillDoctrine
  if (sk?.carryoverMap) {
    const entries = Object.entries(sk.carryoverMap)
    for (let i = 0; i < entries.length && carryoverRules.length < PROOF_PER_CATEGORY_CAP; i++) {
      const [skill, carriers] = entries[i]
      if (!skill || !Array.isArray(carriers) || carriers.length === 0) continue
      const carriersText = carriers.slice(0, 3).join(', ')
      carryoverRules.push({
        id: `carryover_${skill}`,
        sourceId: null,
        batch: null,
        family: 'carryover',
        title: `${skill} ← ${carriersText}`,
        summary: `Carryover support for ${skill}: ${carriersText}`,
        appliesTo: [skill],
        visibleEvidence: `${skill} ← ${carriersText}`,
      })
    }
  }

  // ---- progression rules: from progressionDoctrine.perSkill
  const pr = runtime.progressionDoctrine
  if (pr?.perSkill) {
    const entries = Object.entries(pr.perSkill)
    for (let i = 0; i < entries.length && progressionRules.length < PROOF_PER_CATEGORY_CAP; i++) {
      const [skill, doctrine] = entries[i]
      if (!skill || !doctrine) continue
      // SkillProgressionDoctrine has a free-form shape; we surface the skill name only.
      progressionRules.push({
        id: `progression_${skill}`,
        sourceId: null,
        batch: null,
        family: 'progression',
        title: `Progression doctrine: ${skill}`,
        summary: `Progression policy active for ${skill}`,
        appliesTo: [skill],
        visibleEvidence: `Progression — ${skill}`,
      })
    }
  }

  return {
    principles,
    progressionRules,
    exerciseSelectionRules,
    contraindicationRules,
    methodRules,
    prescriptionRules,
    carryoverRules,
  }
}

/**
 * Phase 2 PROGRAM-LEVEL PROOF BUILDER.
 *
 * Pure helper. Given the runtime contract that the builder consumed plus the
 * compact decision context derived from it, returns the proof object that
 * `executeAuthoritativeGeneration` attaches to `program.doctrineIntegration`.
 *
 * The status logic:
 *   - 'unavailable' when runtime is null/unavailable
 *   - 'degraded'    when sourceMode === 'unavailable' OR missingBatches.length > 0
 *                   OR diagnostics.warnings is non-empty OR globalCoherence < 0.5
 *   - 'active'      otherwise (decision context is usable AND coverage clean)
 *
 * No mutation, no DB, no async, no clocks beyond `attachedAt`.
 */
export function buildDoctrineIntegrationProof(
  runtime: DoctrineRuntimeContract | null | undefined,
  decisionContext: DoctrineBuilderDecisionContext,
): DoctrineIntegrationProof {
  if (!runtime || !runtime.available) {
    const proof = emptyProof()
    proof.diagnostics = {
      usable: false,
      blocker: 'doctrine_runtime_contract_unavailable',
      warnings: decisionContext.diagnostics.warnings ?? [],
    }
    proof.contextId = decisionContext.contextId
    proof.contextVersion = decisionContext.contextVersion
    return proof
  }

  const summaries = deriveSelectedSummaries(runtime)
  const cov = runtime.doctrineCoverage

  const selectedCounts: DoctrineIntegrationSelectedCounts = {
    principles: summaries.principles.length,
    progressionRules: summaries.progressionRules.length,
    exerciseSelectionRules: summaries.exerciseSelectionRules.length,
    contraindicationRules: summaries.contraindicationRules.length,
    methodRules: summaries.methodRules.length,
    prescriptionRules: summaries.prescriptionRules.length,
    carryoverRules: summaries.carryoverRules.length,
  }

  const decisionFlags: DoctrineBuilderDecisionContext['decisionFlags'] = {
    ...decisionContext.decisionFlags,
    // Strengthen flags with what the runtime actually reports — these are
    // counts/booleans the runtime computes itself, not invented claims.
    protectsPrimarySkill:
      decisionContext.decisionFlags.protectsPrimarySkill ||
      (runtime.skillDoctrine?.representedSkills?.length ?? 0) > 0,
    hasMethodDecisionRules:
      decisionContext.decisionFlags.hasMethodDecisionRules || (cov?.methodRuleCount ?? 0) > 0,
    hasContraindicationRules:
      decisionContext.decisionFlags.hasContraindicationRules ||
      (runtime.methodDoctrine?.blockedMethods?.length ?? 0) > 0,
  }

  const missingBatchesFromCoverage = decisionContext.batchCoverage.missingBatches
  const partialBatches = decisionContext.batchCoverage.partialBatches
  const lowCoherence = (runtime.globalCoherence ?? 0) < 0.5
  const hasMissing = missingBatchesFromCoverage.length > 0
  const sourceUnavailable = decisionContext.sourceMode === 'unavailable'

  let contextStatus: DoctrineIntegrationContextStatus
  if (sourceUnavailable) {
    contextStatus = 'unavailable'
  } else if (hasMissing || lowCoherence || partialBatches.length > 0) {
    contextStatus = 'degraded'
  } else {
    contextStatus = 'active'
  }

  const warnings: string[] = [...(decisionContext.diagnostics.warnings ?? [])]
  if (lowCoherence) warnings.push(`low_global_coherence:${runtime.globalCoherence?.toFixed(2)}`)
  if (hasMissing) warnings.push(`missing_batches:${missingBatchesFromCoverage.join(',')}`)

  return {
    phase: 'phase_2_context_wired',
    contextStatus,
    sourceMode: decisionContext.sourceMode,
    batchCoverage: decisionContext.batchCoverage,
    presentBatches: [...decisionContext.batchCoverage.presentBatches],
    missingBatches: [...decisionContext.batchCoverage.missingBatches],
    selectedCounts,
    selectedSummaries: summaries,
    decisionFlags,
    expectedProgramInfluences: decisionContext.visibleProof.expectedProgramInfluences,
    missingInfluences: decisionContext.visibleProof.missingInfluences,
    diagnostics: {
      usable: contextStatus === 'active',
      blocker: contextStatus === 'unavailable' ? 'context_unavailable' : null,
      warnings,
    },
    disclaimer: PHASE2_DISCLAIMER,
    attachedAt: new Date().toISOString(),
    contextId: decisionContext.contextId,
    contextVersion: decisionContext.contextVersion,
  }
}

/**
 * Defensive normalizer for `program.doctrineIntegration` across save/load.
 * Returns a fully-populated proof; missing fields fall back to safe empty
 * values. Never throws, never invents `active` status.
 */
export function normalizeDoctrineIntegrationProof(
  proof: Partial<DoctrineIntegrationProof> | null | undefined,
): DoctrineIntegrationProof {
  if (!proof) return emptyProof()
  const empty = emptyProof()
  return {
    phase: 'phase_2_context_wired',
    contextStatus: proof.contextStatus ?? empty.contextStatus,
    sourceMode: proof.sourceMode ?? empty.sourceMode,
    batchCoverage: proof.batchCoverage ?? empty.batchCoverage,
    presentBatches: proof.presentBatches ?? empty.presentBatches,
    missingBatches: proof.missingBatches ?? empty.missingBatches,
    selectedCounts: proof.selectedCounts ?? empty.selectedCounts,
    selectedSummaries: proof.selectedSummaries ?? empty.selectedSummaries,
    decisionFlags: proof.decisionFlags ?? empty.decisionFlags,
    expectedProgramInfluences: proof.expectedProgramInfluences ?? [],
    missingInfluences: proof.missingInfluences ?? [],
    diagnostics: proof.diagnostics ?? empty.diagnostics,
    disclaimer: proof.disclaimer ?? PHASE2_DISCLAIMER,
    attachedAt: proof.attachedAt ?? empty.attachedAt,
    contextId: proof.contextId ?? empty.contextId,
    contextVersion: proof.contextVersion ?? empty.contextVersion,
  }
}
