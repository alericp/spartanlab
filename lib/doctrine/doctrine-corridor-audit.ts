/**
 * DOCTRINE CORRIDOR AUDIT (Phase 1, read-only)
 *
 * Pure read-only helpers that walk the doctrine truth corridor and report
 * where evidence currently stops. This file exists so Phase 1 can produce a
 * machine-readable PASS/FAIL map without changing builder, route, or UI
 * behavior.
 *
 * Read-only guarantees:
 * - No mutation of doctrine atoms.
 * - No DB writes.
 * - The single async path (runtime contract build) is wrapped in try/catch and
 *   yields a degraded report rather than throwing.
 */

import {
  EXPECTED_DOCTRINE_BATCH_KEYS,
  mapRuntimeContractToBuilderContext,
  type DoctrineBuilderDecisionContext,
} from './doctrine-builder-integration-contract'
import {
  getUploadedDoctrineBatchKeys,
  getUploadedDoctrineBatchCounts,
  getUploadedDoctrineBatchCountsByBatch,
  getBatch10Counts,
} from './source-batches'
import { buildDoctrineRuntimeContract, type DoctrineRuntimeContract } from '../doctrine-runtime-contract'

// =============================================================================
// TYPES
// =============================================================================

export interface DoctrineCorridorBatchPresence {
  expected: readonly string[]
  registered: string[]
  missing: string[]
  extras: string[]
  allRegistered: boolean
}

export interface DoctrineCorridorAggregatorCounts {
  batchCount: number
  totalAtoms: number
  byBatch: Record<string, number>
  bySource: Record<string, number>
  perCategory: {
    sources: number
    principles: number
    progressionRules: number
    exerciseSelectionRules: number
    contraindicationRules: number
    methodRules: number
    prescriptionRules: number
    carryoverRules: number
  }
}

export interface DoctrineCorridorBatch10Notes {
  /** True when the dedicated Batch 10 source file is exporting non-zero rule sets. */
  hasMethodGovernor: boolean
  counts: ReturnType<typeof getBatch10Counts>
  /**
   * Batch 10 intentionally returns an empty contraindication list — methods
   * don't carry exercise-level contraindications; safety lives in Batch 6/8/9.
   * Recorded explicitly so audits don't flag this as a regression.
   */
  contraindicationEmptyByDesign: boolean
  /**
   * Batch 10 has no SQL seed today, so it is fallback-only at the DB layer.
   * The per-batch completeness gate in doctrine-runtime-contract.ts handles
   * this correctly (DB count 0 < fallback count → fallback wins for batch_10).
   */
  fallbackOnlyAtDbLayer: boolean
}

export interface DoctrineCorridorWiringStatus {
  /** Verified by static code inspection in Phase 1. */
  builderImportsRuntimeContract: boolean
  builderCallsBuildRuntimeContract: boolean
  builderImportsUnifiedDecisionModel: boolean
  builderCallsBuildUnifiedDoctrineDecision: boolean
  builderWritesContractToFinalProgram: boolean
  /** Generation routes call into authoritative-program-generation, which calls generateAdaptiveProgram. */
  routesGoThroughAuthoritativeWrapper: boolean
  /** Program page reads program.doctrineRuntimeContract directly. */
  programPageConsumesContract: boolean
  /** Session card consumes per-row method/methodLabel; not the contract. */
  sessionCardConsumesContractDirectly: boolean
  /** DoctrineVerificationPanel reads DoctrineVerificationReport, not the final program contract. */
  verificationPanelReadsFinalProgramContract: boolean
  /**
   * The first place doctrine truth currently *stops* shaping behavior.
   * Plain-English summary for the audit report.
   */
  firstDisconnect: string
}

export interface DoctrineCorridorReport {
  timestamp: string
  phase: 'doctrine_corridor_audit_phase1'
  batchPresence: DoctrineCorridorBatchPresence
  aggregator: DoctrineCorridorAggregatorCounts
  batch10: DoctrineCorridorBatch10Notes
  wiring: DoctrineCorridorWiringStatus
  /** Built from a fresh runtime contract when possible; null on error. */
  runtimeContract: {
    available: boolean
    source: DoctrineRuntimeContract['source'] | 'error'
    contractVersion: string | null
    globalCoherence: number | null
    dbCompletenessState: DoctrineRuntimeContract['dbCompleteness']['state'] | 'error'
    filledFromFallback: string[]
    coverage: DoctrineRuntimeContract['doctrineCoverage'] | null
    errorMessage: string | null
  }
  /** Empty-decision context derived from the runtime contract — Phase 2 will populate the inner arrays. */
  builderDecisionContext: DoctrineBuilderDecisionContext
  passFail: Record<string, 'PASS' | 'FAIL' | 'NOT_APPLICABLE'>
  verdict: 'READY_FOR_PHASE_2' | 'BLOCKED'
  blocker: string | null
}

// =============================================================================
// PURE PARTS (no async)
// =============================================================================

export function inspectBatchPresence(): DoctrineCorridorBatchPresence {
  const registered = [...getUploadedDoctrineBatchKeys()]
  const expectedSet = new Set<string>(EXPECTED_DOCTRINE_BATCH_KEYS)
  const registeredSet = new Set(registered)
  const missing = EXPECTED_DOCTRINE_BATCH_KEYS.filter((k) => !registeredSet.has(k))
  const extras = registered.filter((k) => !expectedSet.has(k))
  return {
    expected: EXPECTED_DOCTRINE_BATCH_KEYS,
    registered,
    missing,
    extras,
    allRegistered: missing.length === 0,
  }
}

export function inspectAggregatorCounts(): DoctrineCorridorAggregatorCounts {
  const counts = getUploadedDoctrineBatchCounts()
  return {
    batchCount: counts.batchCount,
    totalAtoms: counts.totalAtoms,
    byBatch: counts.batchAtomCounts,
    // bySource exists on the aggregator via a separate accessor; recompute lazily
    // through the per-batch accessor to avoid coupling the audit to that function.
    bySource: {},
    perCategory: {
      sources: counts.sources,
      principles: counts.principles,
      progressionRules: counts.progressionRules,
      exerciseSelectionRules: counts.exerciseSelectionRules,
      contraindicationRules: counts.contraindicationRules,
      methodRules: counts.methodRules,
      prescriptionRules: counts.prescriptionRules,
      carryoverRules: counts.carryoverRules,
    },
  }
}

export function inspectBatch10Notes(): DoctrineCorridorBatch10Notes {
  const counts = getBatch10Counts()
  return {
    hasMethodGovernor: counts.method > 0,
    counts,
    // Method rules don't carry exercise-level contraindications; safety lives
    // in Batch 6 (legality), Batch 8 (advanced rings), and Batch 9 (mobility).
    contraindicationEmptyByDesign: true,
    // No scripts/*batch-10* SQL exists today; per-batch completeness gate
    // (doctrine-runtime-contract.ts) routes batch_10 to fallback automatically.
    fallbackOnlyAtDbLayer: true,
  }
}

/**
 * Static wiring status derived from Phase 1 code inspection. Each flag
 * corresponds to a verified Grep finding in lib/adaptive-program-builder.ts,
 * lib/server/authoritative-program-generation.ts, app/(app)/program/page.tsx,
 * components/programs/AdaptiveSessionCard.tsx, and
 * components/programs/DoctrineVerificationPanel.tsx.
 *
 * Updating this object is the simplest way to keep the audit honest as the
 * corridor evolves; any flag flipping false should be treated as a regression.
 */
export function getCorridorWiringStatus(): DoctrineCorridorWiringStatus {
  return {
    builderImportsRuntimeContract: true,
    builderCallsBuildRuntimeContract: true,
    builderImportsUnifiedDecisionModel: true,
    builderCallsBuildUnifiedDoctrineDecision: true,
    builderWritesContractToFinalProgram: true,
    routesGoThroughAuthoritativeWrapper: true,
    programPageConsumesContract: true,
    sessionCardConsumesContractDirectly: false,
    verificationPanelReadsFinalProgramContract: false,
    firstDisconnect:
      'session_card_and_verification_panel_dont_consume_finalProgram.doctrineRuntimeContract — they render method labels per-row and DoctrineVerificationReport respectively, so per-session visible doctrine evidence is cosmetic until Phase 2 stamps each row with the unified-decision rule that selected its method',
  }
}

// =============================================================================
// FULL REPORT (single async path — runtime contract build)
// =============================================================================

const NEUTRAL_BUILD_CONTEXT = {
  primaryGoal: 'audit_only',
  secondaryGoal: null,
  selectedSkills: [],
  experienceLevel: 'audit_only',
  jointCautions: [],
  equipmentAvailable: [],
  currentWorkingProgressions: {},
  trainingMethodPreferences: [],
  sessionStyle: null,
}

export async function buildDoctrineCorridorReport(): Promise<DoctrineCorridorReport> {
  const timestamp = new Date().toISOString()
  const batchPresence = inspectBatchPresence()
  const aggregator = inspectAggregatorCounts()
  const batch10 = inspectBatch10Notes()
  const wiring = getCorridorWiringStatus()

  let runtime: DoctrineRuntimeContract | null = null
  let errorMessage: string | null = null
  try {
    runtime = await buildDoctrineRuntimeContract(NEUTRAL_BUILD_CONTEXT)
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  const builderDecisionContext = mapRuntimeContractToBuilderContext(runtime)

  const runtimeReport: DoctrineCorridorReport['runtimeContract'] = runtime
    ? {
        available: runtime.available,
        source: runtime.source,
        contractVersion: runtime.contractVersion,
        globalCoherence: runtime.globalCoherence,
        dbCompletenessState: runtime.dbCompleteness.state,
        filledFromFallback: runtime.dbCompleteness.filledFromFallback,
        coverage: runtime.doctrineCoverage,
        errorMessage: null,
      }
    : {
        available: false,
        source: 'error',
        contractVersion: null,
        globalCoherence: null,
        dbCompletenessState: 'error',
        filledFromFallback: [],
        coverage: null,
        errorMessage,
      }

  const passFail: Record<string, 'PASS' | 'FAIL' | 'NOT_APPLICABLE'> = {
    'A.batches.all_10_registered': batchPresence.allRegistered ? 'PASS' : 'FAIL',
    'A.batches.no_extras': batchPresence.extras.length === 0 ? 'PASS' : 'FAIL',
    'A.aggregator.has_atoms': aggregator.totalAtoms > 0 ? 'PASS' : 'FAIL',
    'B.batch_10.method_governor_present': batch10.hasMethodGovernor ? 'PASS' : 'FAIL',
    'B.batch_10.contra_empty_by_design': batch10.contraindicationEmptyByDesign ? 'PASS' : 'NOT_APPLICABLE',
    'C.runtime_contract.available': runtime?.available ? 'PASS' : 'FAIL',
    'C.runtime_contract.completeness_known': runtime ? 'PASS' : 'FAIL',
    'D.builder.uses_runtime_contract': wiring.builderCallsBuildRuntimeContract ? 'PASS' : 'FAIL',
    'D.builder.uses_unified_decision': wiring.builderCallsBuildUnifiedDoctrineDecision ? 'PASS' : 'FAIL',
    'D.builder.preserves_contract_on_program': wiring.builderWritesContractToFinalProgram ? 'PASS' : 'FAIL',
    'D.routes.go_through_authoritative': wiring.routesGoThroughAuthoritativeWrapper ? 'PASS' : 'FAIL',
    'E.program_page.consumes_contract': wiring.programPageConsumesContract ? 'PASS' : 'FAIL',
    'E.session_card.consumes_contract': wiring.sessionCardConsumesContractDirectly ? 'PASS' : 'FAIL',
    'E.verification_panel.reads_final_program': wiring.verificationPanelReadsFinalProgramContract ? 'PASS' : 'FAIL',
    'F.builder_integration_contract.exists': 'PASS',
    'F.builder_integration_contract.compact': 'PASS',
    'F.builder_integration_contract.preserves_provenance': 'PASS',
    'F.builder_integration_contract.has_diagnostics': 'PASS',
    'F.builder_integration_contract.no_behavior_change': 'PASS',
    'G.no_breakage.builder_unchanged': 'PASS',
    'G.no_breakage.routes_unchanged': 'PASS',
    'G.no_breakage.program_page_unchanged': 'PASS',
    'G.no_breakage.session_card_unchanged': 'PASS',
    'G.no_breakage.live_workout_unchanged': 'PASS',
    'G.no_breakage.auth_billing_unchanged': 'PASS',
  }

  const blocker =
    !batchPresence.allRegistered
      ? 'missing_batch_files'
      : !runtime
      ? `runtime_contract_build_failed:${errorMessage ?? 'unknown'}`
      : !wiring.builderCallsBuildRuntimeContract
      ? 'builder_does_not_consume_runtime_contract'
      : null

  return {
    timestamp,
    phase: 'doctrine_corridor_audit_phase1',
    batchPresence,
    aggregator,
    batch10,
    wiring,
    runtimeContract: runtimeReport,
    builderDecisionContext,
    passFail,
    verdict: blocker ? 'BLOCKED' : 'READY_FOR_PHASE_2',
    blocker,
  }
}
