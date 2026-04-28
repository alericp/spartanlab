// =============================================================================
// [PHASE AA1R] FINAL METHOD MATERIALIZATION TRUTH RECONCILER
//
// PROBLEM
// stampMethodDecisionsOnSessions() runs early, BEFORE
// applyRowLevelMethodPrescriptionMutations() and the structural method
// materialization corridor. Anything those later corridors do (or fail to do)
// to session.exercises[].blockId / styledGroups can leave session.styleMetadata.
// methodMaterializationSummary and session.methodDecision.actualMaterialization
// describing a snapshot that no longer matches the visible exercise body.
//
// User-reported failure mode: Day 3 shows a red "Doctrine Materialization"
// card with "Superset applied" but the visible exercise list contains no real
// superset block, and the card itself reports "0 exercises changed" — an
// internally contradictory claim that proves the doctrine wording was stamped
// from a stale summary.
//
// FIX
// One final reconciliation pass that runs at the very end of
// authoritative-program-generation, after every method/row/structural/numeric
// corridor has finished. It:
//
//   1. Re-derives session.styleMetadata.methodMaterializationSummary from the
//      FINAL session.exercises + styledGroups truth (now AA1R-aware so
//      orphaned styledGroups without matching exercise blockIds are dropped
//      and an integrity verdict is set).
//   2. Re-derives session.methodDecision.actualMaterialization from that
//      freshly-stamped summary so the doctrine panel reads only final truth.
//   3. Reconciles session.styleMetadata.appliedMethods against the final
//      summary (additive: keeps row-level methods that did materialize; drops
//      grouped claims the integrity gate disqualified).
//   4. Rebuilds program.doctrineIntegration.materializationRollup so the
//      program-level rollup matches the reconciled truth.
//
// PURE / SURGICAL
// This reconciler does NOT re-decide training. It does not pick new methods,
// does not re-run safety gates, does not invent prescriptions. It only
// reconciles the proof/readout layer to match what the executable program now
// is.
// =============================================================================

import {
  deriveMethodMaterializationSummary,
  type MethodMaterializationSummary,
  type MaterializedSessionLike,
} from '@/lib/program/method-materialization-summary'
import {
  buildActualMaterialization,
  type MethodDecision,
  type MethodDecisionSessionInput,
} from '@/lib/program/method-decision-engine'

// ---- Minimal session shape (duck-typed; no coupling to AdaptiveSession) -----
interface ReconcilableSession {
  dayNumber?: number | null
  dayLabel?: string | null
  exercises?: Array<{
    blockId?: string | null
    method?: string | null
    setExecutionMethod?: string | null
    name?: string | null
  }> | null
  styleMetadata?: {
    appliedMethods?: string[] | null
    styledGroups?: Array<{ id?: string; groupType?: string | null; exercises?: Array<{ name?: string | null }> | null }> | null
    methodMaterializationSummary?: MethodMaterializationSummary | null
    clusterDecision?: { targetExerciseId?: string | null; kind?: string | null } | null
    [key: string]: unknown
  } | null
  methodDecision?: MethodDecision | null
  [key: string]: unknown
}

interface ReconcilableProgram {
  sessions?: ReconcilableSession[] | null
  doctrineIntegration?: Record<string, unknown> | null
  [key: string]: unknown
}

export interface FinalMethodTruthReconciliationRollup {
  sessionsProcessed: number
  sessionsWithSummaryRestamped: number
  sessionsWithMethodDecisionRefreshed: number
  sessionsWithAppliedMethodsTrimmed: number
  sessionsWithStaleStyledGroupsDropped: number
  sessionsForcedToFlat: number
  sessionsWithIntegrityFail: number
  sessionsWithIntegrityWarn: number
  sessionsWithIntegrityPass: number
  totalStaleStyledGroupsDropped: number
  /** Methods whose grouped claim was dropped because final structure did not back it. */
  methodClaimsRemovedBecauseNoFinalStructure: string[]
  /** Final per-session debug summary the program-page can also display. */
  perSession: Array<{
    dayNumber: number | null
    integrityVerdict: MethodMaterializationSummary['summaryIntegrityVerdict']
    dominantRenderMode: 'grouped' | 'flat_with_method_cues' | 'flat'
    groupedBlockCount: number
    groupedExerciseRowCount: number
    staleStyledGroupCount: number
    orphanedMethods: string[]
    appliedMethods: string[]
  }>
}

/**
 * Reconcile every session's method materialization proof against the FINAL
 * executable session body. Mutates `program.sessions[*].styleMetadata` and
 * `program.sessions[*].methodDecision.actualMaterialization` in place. Returns
 * a rollup the caller can log without exposing program internals.
 */
export function reconcileFinalMethodMaterializationTruth(
  program: ReconcilableProgram | null | undefined,
): FinalMethodTruthReconciliationRollup {
  const rollup: FinalMethodTruthReconciliationRollup = {
    sessionsProcessed: 0,
    sessionsWithSummaryRestamped: 0,
    sessionsWithMethodDecisionRefreshed: 0,
    sessionsWithAppliedMethodsTrimmed: 0,
    sessionsWithStaleStyledGroupsDropped: 0,
    sessionsForcedToFlat: 0,
    sessionsWithIntegrityFail: 0,
    sessionsWithIntegrityWarn: 0,
    sessionsWithIntegrityPass: 0,
    totalStaleStyledGroupsDropped: 0,
    methodClaimsRemovedBecauseNoFinalStructure: [],
    perSession: [],
  }

  const sessions = Array.isArray(program?.sessions) ? program!.sessions! : []
  if (sessions.length === 0) return rollup

  const removedClaimsAccum = new Set<string>()

  for (const session of sessions) {
    if (!session) continue
    rollup.sessionsProcessed += 1

    // -------------------------------------------------------------------------
    // 1) Re-derive the canonical materialization summary from the FINAL
    //    session.exercises + styledGroups truth. The (AA1R-aware) derivation
    //    drops styledGroups whose members are not bound to >= 2 exercise
    //    blockIds and emits an integrity verdict.
    // -------------------------------------------------------------------------
    const finalSummary = deriveMethodMaterializationSummary(session as MaterializedSessionLike)

    // Compare against the previously-stamped summary to detect when the early
    // stamp had been lying. We only need a coarse comparison.
    const priorSummary =
      (session.styleMetadata as { methodMaterializationSummary?: MethodMaterializationSummary | null } | null)
        ?.methodMaterializationSummary ?? null
    const priorGroupedTotal = priorSummary
      ? (priorSummary.groupedMethodCounts.superset ?? 0) +
        (priorSummary.groupedMethodCounts.circuit ?? 0) +
        (priorSummary.groupedMethodCounts.density_block ?? 0)
      : 0
    const finalGroupedTotal =
      finalSummary.groupedMethodCounts.superset +
      finalSummary.groupedMethodCounts.circuit +
      finalSummary.groupedMethodCounts.density_block
    const droppedClaims: string[] = []
    if (priorSummary) {
      if ((priorSummary.groupedMethodCounts.superset ?? 0) > 0 && finalSummary.groupedMethodCounts.superset === 0) {
        droppedClaims.push('superset')
      }
      if ((priorSummary.groupedMethodCounts.circuit ?? 0) > 0 && finalSummary.groupedMethodCounts.circuit === 0) {
        droppedClaims.push('circuit')
      }
      if ((priorSummary.groupedMethodCounts.density_block ?? 0) > 0 && finalSummary.groupedMethodCounts.density_block === 0) {
        droppedClaims.push('density_block')
      }
    }
    for (const m of droppedClaims) removedClaimsAccum.add(m)

    if (priorGroupedTotal !== finalGroupedTotal || (priorSummary?.summaryIntegrityVerdict ?? null) !==
        finalSummary.summaryIntegrityVerdict) {
      rollup.sessionsWithSummaryRestamped += 1
    }

    // Stamp the final summary onto the session. Build styleMetadata if absent.
    if (!session.styleMetadata) {
      ;(session as ReconcilableSession).styleMetadata = {}
    }
    ;(session.styleMetadata as { methodMaterializationSummary?: MethodMaterializationSummary }).methodMaterializationSummary =
      finalSummary

    // -------------------------------------------------------------------------
    // 2) Stale styledGroup accounting + integrity bucket counts.
    // -------------------------------------------------------------------------
    if (finalSummary.staleStyledGroupCount > 0) {
      rollup.sessionsWithStaleStyledGroupsDropped += 1
      rollup.totalStaleStyledGroupsDropped += finalSummary.staleStyledGroupCount
    }
    if (finalSummary.summaryIntegrityVerdict === 'FAIL_METHOD_CLAIM_WITH_ZERO_CHANGED_EXERCISES') {
      rollup.sessionsWithIntegrityFail += 1
      rollup.sessionsForcedToFlat += 1
    } else if (finalSummary.summaryIntegrityVerdict === 'WARN_STYLED_GROUP_WITHOUT_ROW_BINDING') {
      rollup.sessionsWithIntegrityWarn += 1
    } else {
      rollup.sessionsWithIntegrityPass += 1
    }

    // -------------------------------------------------------------------------
    // 3) Refresh methodDecision.actualMaterialization from the freshly stamped
    //    summary so the doctrine panel reads ONLY final reconciled truth.
    //    buildActualMaterialization reads styleMetadata.methodMaterializationSummary
    //    first when present — which we just restamped above.
    // -------------------------------------------------------------------------
    const md = (session as { methodDecision?: MethodDecision | null }).methodDecision ?? null
    if (md) {
      try {
        const refreshed = buildActualMaterialization(session as MethodDecisionSessionInput)
        const before = md.actualMaterialization
        const changed =
          !before ||
          before.hasRealStructuralChange !== refreshed.hasRealStructuralChange ||
          before.dominantRenderMode !== refreshed.dominantRenderMode ||
          before.groupedBlockCount !== refreshed.groupedBlockCount ||
          before.changedExerciseCount !== refreshed.changedExerciseCount
        ;(md as { actualMaterialization: typeof refreshed }).actualMaterialization = refreshed
        if (changed) rollup.sessionsWithMethodDecisionRefreshed += 1
      } catch {
        // fail-soft: never block generation on a refresh error.
      }
    }

    // -------------------------------------------------------------------------
    // 4) Reconcile styleMetadata.appliedMethods to the final summary. We only
    //    DROP claims that the integrity gate disqualified (e.g. orphaned
    //    grouped methods) and PRESERVE row-level methods that genuinely
    //    materialized. straight_sets remains as the baseline.
    // -------------------------------------------------------------------------
    const priorApplied = Array.isArray((session.styleMetadata as { appliedMethods?: string[] } | null)?.appliedMethods)
      ? ((session.styleMetadata as { appliedMethods?: string[] }).appliedMethods as string[])
      : []
    if (priorApplied.length > 0) {
      const finalMaterialized = new Set(finalSummary.materializedMethods)
      const orphans = new Set(finalSummary.orphanedStyledGroupMethods)
      const trimmed: string[] = []
      let dropped = false
      for (const raw of priorApplied) {
        const tag = (raw ?? '').toString().toLowerCase()
        if (tag === 'straight_sets' || tag === 'straight') {
          trimmed.push(raw)
          continue
        }
        // Map plural builder tags ("supersets", "circuits", "density_blocks") to
        // canonical singular form used by the summary.
        const canonical = tag === 'supersets' ? 'superset'
          : tag === 'circuits' ? 'circuit'
          : tag === 'density_blocks' || tag === 'density' ? 'density_block'
          : tag === 'top_sets' ? 'top_set'
          : tag === 'drop_sets' ? 'drop_set'
          : tag === 'cluster_sets' ? 'cluster'
          : tag
        // Drop if this method's grouped claim was orphaned AND it doesn't appear
        // in finalMaterialized (no row-level rescue either).
        if (orphans.has(canonical) && !finalMaterialized.has(canonical)) {
          dropped = true
          continue
        }
        // Drop unknown/grouped claims that didn't survive (e.g. summary says
        // no superset materialized but appliedMethods still says 'supersets').
        if (
          (canonical === 'superset' || canonical === 'circuit' || canonical === 'density_block') &&
          !finalMaterialized.has(canonical)
        ) {
          dropped = true
          continue
        }
        trimmed.push(raw)
      }
      // Add row-level methods that the final summary proves but appliedMethods
      // missed (preserves user-visible top_set / drop_set / rest_pause when
      // they genuinely exist).
      for (const m of finalMaterialized) {
        if (m === 'top_set' && !trimmed.includes('top_set')) trimmed.push('top_set')
        if (m === 'drop_set' && !trimmed.includes('drop_set')) trimmed.push('drop_set')
        if (m === 'rest_pause' && !trimmed.includes('rest_pause')) trimmed.push('rest_pause')
      }
      if (dropped || trimmed.length !== priorApplied.length) {
        rollup.sessionsWithAppliedMethodsTrimmed += 1
      }
      ;(session.styleMetadata as { appliedMethods?: string[] }).appliedMethods = trimmed
    }

    // -------------------------------------------------------------------------
    // 5) Per-session debug record.
    // -------------------------------------------------------------------------
    rollup.perSession.push({
      dayNumber: typeof session.dayNumber === 'number' ? session.dayNumber : null,
      integrityVerdict: finalSummary.summaryIntegrityVerdict,
      dominantRenderMode: finalSummary.dominantRenderMode,
      groupedBlockCount: finalSummary.groupedBlockCount,
      groupedExerciseRowCount: finalSummary.groupedExerciseRowCount,
      staleStyledGroupCount: finalSummary.staleStyledGroupCount,
      orphanedMethods: finalSummary.orphanedStyledGroupMethods,
      appliedMethods: Array.isArray((session.styleMetadata as { appliedMethods?: string[] } | null)?.appliedMethods)
        ? ((session.styleMetadata as { appliedMethods?: string[] }).appliedMethods as string[])
        : [],
    })
  }

  rollup.methodClaimsRemovedBecauseNoFinalStructure = Array.from(removedClaimsAccum).sort()

  // ---------------------------------------------------------------------------
  // 6) Refresh the program-level materializationRollup on doctrineIntegration
  //    so consumers that read the rollup get the reconciled truth.
  // ---------------------------------------------------------------------------
  if (program && program.doctrineIntegration && typeof program.doctrineIntegration === 'object') {
    let sessionsWithStructuralChange = 0
    let totalGroupedBlocks = 0
    let totalGroupedSupersets = 0
    let totalGroupedCircuits = 0
    let totalGroupedDensityBlocks = 0
    let totalRowCluster = 0
    let totalRowTopSet = 0
    let totalRowDropSet = 0
    let totalRowRestPause = 0
    let totalChangedExercises = 0
    for (const sess of sessions) {
      const am = sess?.methodDecision?.actualMaterialization
      if (!am) continue
      if (am.hasRealStructuralChange) sessionsWithStructuralChange += 1
      totalGroupedBlocks += am.groupedBlockCount
      totalGroupedSupersets += am.groupedMethodCounts.superset
      totalGroupedCircuits += am.groupedMethodCounts.circuit
      totalGroupedDensityBlocks += am.groupedMethodCounts.density_block
      totalRowCluster += am.rowExecutionCounts.cluster
      totalRowTopSet += am.rowExecutionCounts.top_set
      totalRowDropSet += am.rowExecutionCounts.drop_set
      totalRowRestPause += am.rowExecutionCounts.rest_pause
      totalChangedExercises += am.changedExerciseCount
    }
    const reconciled = {
      sessionsWithStructuralChange,
      totalGroupedBlocks,
      totalGroupedSupersets,
      totalGroupedCircuits,
      totalGroupedDensityBlocks,
      totalRowCluster,
      totalRowTopSet,
      totalRowDropSet,
      totalRowRestPause,
      totalChangedExercises,
      allSessionsFlat: sessionsWithStructuralChange === 0,
    }
    ;(program.doctrineIntegration as Record<string, unknown>).materializationRollup = reconciled
    ;(program.doctrineIntegration as Record<string, unknown>).allSessionsFlat = reconciled.allSessionsFlat
    ;(program.doctrineIntegration as Record<string, unknown>).materializationReconciledAt = new Date().toISOString()
  }

  return rollup
}
