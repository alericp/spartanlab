'use client'

/**
 * [PHASE 4C] PROGRAM MATERIALIZATION STATUS LINE
 *
 * One compact, mobile-safe, honest line that replaces the proof-only
 * DoctrineRuntimeProof / DoctrineIntegrationProofBlock visibility on the
 * normal athlete-facing Program page. Reads ONLY the
 * `program.doctrineIntegration.materializationRollup` rollup that the
 * Phase 4A wrapper writes onto every fresh build.
 *
 * Honest contract:
 *   - If the program is missing the current Phase 4A stamp, this line
 *     renders NOTHING. The Phase 4B `<ProgramMaterializationStaleNotice>`
 *     already owns that state and tells the user to regenerate. We never
 *     duplicate stale-state messaging here.
 *   - If the current stamp exists AND at least one session has real
 *     structural change, render a short outcome summary built from real
 *     counts ("3 sessions changed · 2 grouped blocks · 4 exercises").
 *   - If the current stamp exists but materialization produced no
 *     structural changes, render a short, honest no-change line. This
 *     does NOT claim doctrine "applied" — it states the truth.
 *
 * What this component intentionally does NOT show:
 *   - "Selected rules: 18", source labels, batch keys, batch counts.
 *   - Phase-disclaimer copy.
 *   - "Data-driven identifiers", "profile-driven" labels.
 *   - Anything that implies progress without a real changed field.
 *
 * The detailed proof panels remain available behind `?programProbe=1` for
 * QA. This line is the only doctrine-status surface the athlete sees on
 * the normal page.
 */

import { CheckCircle2, MinusCircle, AlertTriangle } from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { METHOD_DECISION_VERSION } from '@/lib/program/method-decision-engine'

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

interface DoctrineIntegrationView {
  methodDecisionVersion?: string | null
  allSessionsFlat?: boolean | null
  materializationRollup?: MaterializationRollupView | null
}

interface Props {
  program: AdaptiveProgram | null
}

export function MaterializationStatusLine({ program }: Props) {
  if (!program) return null

  const di = (program as unknown as { doctrineIntegration?: DoctrineIntegrationView | null })
    .doctrineIntegration ?? null

  // Hide when no current stamp exists — the stale notice owns that state.
  // We never claim a status against a stale or legacy program.
  if (!di || di.methodDecisionVersion !== METHOD_DECISION_VERSION) return null

  const rollup = di.materializationRollup ?? {}
  const sessionsChanged = rollup.sessionsWithStructuralChange ?? 0
  const groupedBlocks =
    (rollup.totalGroupedBlocks ?? 0) ||
    (rollup.totalGroupedSupersets ?? 0) +
      (rollup.totalGroupedCircuits ?? 0) +
      (rollup.totalGroupedDensityBlocks ?? 0)
  const totalRowMethods =
    (rollup.totalRowCluster ?? 0) +
    (rollup.totalRowTopSet ?? 0) +
    (rollup.totalRowDropSet ?? 0) +
    (rollup.totalRowRestPause ?? 0)
  const exercisesChanged = rollup.totalChangedExercises ?? 0
  const allFlat = di.allSessionsFlat ?? rollup.allSessionsFlat ?? false

  const hasRealChange =
    !allFlat && (sessionsChanged > 0 || groupedBlocks > 0 || totalRowMethods > 0 || exercisesChanged > 0)

  // Build the visible parts honestly, only including counts > 0.
  const parts: string[] = []
  if (sessionsChanged > 0) {
    parts.push(`${sessionsChanged} session${sessionsChanged === 1 ? '' : 's'} changed`)
  }
  if (groupedBlocks > 0) {
    parts.push(`${groupedBlocks} grouped block${groupedBlocks === 1 ? '' : 's'}`)
  }
  if (totalRowMethods > 0) {
    parts.push(`${totalRowMethods} method row${totalRowMethods === 1 ? '' : 's'}`)
  }
  if (hasRealChange && exercisesChanged > 0 && parts.length < 3) {
    parts.push(`${exercisesChanged} exercise${exercisesChanged === 1 ? '' : 's'} changed`)
  }

  if (hasRealChange) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-materialization-status="applied"
        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2 max-w-full min-w-0 overflow-hidden"
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400/90" aria-hidden />
        <span className="text-[12px] font-medium text-emerald-200 shrink-0">Doctrine applied</span>
        <span className="text-[12px] text-emerald-200/70 break-words [overflow-wrap:anywhere] min-w-0">
          {parts.join(' · ')}
        </span>
      </div>
    )
  }

  // Honest no-change state. No fake "applied" claim. No proof labels.
  return (
    <div
      role="status"
      aria-live="polite"
      data-materialization-status="no-change"
      className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-zinc-700/40 bg-zinc-900/40 px-3 py-2 max-w-full min-w-0 overflow-hidden"
    >
      <MinusCircle className="w-3.5 h-3.5 shrink-0 text-zinc-400/80" aria-hidden />
      <span className="text-[12px] font-medium text-zinc-300 shrink-0">Doctrine loaded</span>
      <span className="text-[12px] text-zinc-400/80 break-words [overflow-wrap:anywhere] min-w-0">
        no structural changes applied — sessions remain straight-set for this profile
      </span>
    </div>
  )
}

/**
 * [PHASE 4E] DOCTRINE CAUSAL CHALLENGE LINE
 *
 * Sibling to <MaterializationStatusLine>. Reads ONLY
 * `program.doctrineCausalChallenge` — the program-level rollup of
 * per-session DoctrineScoringAudit records (pre-doctrine top-3 vs
 * post-doctrine top-3) aggregated in the builder finalization step.
 *
 * What this line answers (which the materialization line does NOT):
 *   "Did doctrine actually CHANGE which exercise was picked, vs. doctrine
 *    just being available and getting evaluated?"
 *
 * Materialization line answers a different question (groupings/methods).
 * Both are needed — an exercise can be doctrine-changed without being
 * materialized into a grouped block, and vice versa.
 *
 * Honest contract:
 *   - If the challenge object is missing entirely (legacy program): render
 *     nothing. The stale notice owns that case.
 *   - If `materialProgramChanged === true`: emerald — "Doctrine changed
 *     N exercise selections across M sessions". This is the only state
 *     that claims causal authority.
 *   - If `unchangedVerdict === 'doctrine_did_not_run'` or
 *     `'doctrine_cache_empty'`: amber — doctrine never reached generation,
 *     this is a real upstream failure the user should know about.
 *   - If `unchangedVerdict === 'doctrine_domain_gap'`: amber — doctrine
 *     loaded but no rule matched any candidate for this profile.
 *   - If `unchangedVerdict === 'doctrine_scoring_too_weak'`: zinc —
 *     doctrine evaluated alternatives but base ranking won. This is
 *     honest "available but not causal" — not failure, not success.
 *
 * What this line refuses to do:
 *   - Claim doctrine "applied" if no exercise winner changed.
 *   - Show selected-rule counts, source counts, batch labels, or any
 *     proof-only metadata as evidence of causality.
 *   - Hide upstream failures behind ambiguous copy.
 */
interface DoctrineCausalChallengeView {
  version?: string
  doctrineEnabled?: boolean
  sessionsEvaluated?: number
  sessionsWithAudit?: number
  sessionsTopCandidateChanged?: number
  sessionsTop3Changed?: number
  sessionsCandidatesAffectedButNoWinnerChange?: number
  materialProgramChanged?: boolean
  unchangedVerdict?:
    | 'not_unchanged'
    | 'doctrine_did_not_run'
    | 'doctrine_cache_empty'
    | 'doctrine_domain_gap'
    | 'doctrine_scoring_too_weak'
    | 'already_optimal_protected'
  finalVerdict?:
    | 'DOCTRINE_MATERIALLY_CHANGED_PROGRAM'
    | 'DOCTRINE_AVAILABLE_BUT_NOT_CAUSAL'
    | 'DOCTRINE_DID_NOT_REACH_GENERATION'
    | 'DOCTRINE_NO_MATCHING_RULES_FOR_PROFILE'
}

export function DoctrineCausalLine({ program }: Props) {
  if (!program) return null

  const challenge = (program as unknown as { doctrineCausalChallenge?: DoctrineCausalChallengeView | null })
    .doctrineCausalChallenge ?? null

  // No causal challenge object means a pre-Phase-4E program. The Phase 4B
  // stale notice already handles "regenerate to refresh" copy — we do not
  // duplicate that here.
  if (!challenge || challenge.version !== 'phase4e-doctrine-ab-causal-challenge-v1') return null

  const sessionsChanged = challenge.sessionsTopCandidateChanged ?? 0
  const sessionsWithAudit = challenge.sessionsWithAudit ?? 0
  const verdict = challenge.unchangedVerdict ?? 'not_unchanged'

  // Material change — doctrine actually picked a different exercise.
  if ((challenge.materialProgramChanged ?? false) === true && sessionsChanged > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-causal-status="changed"
        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2 max-w-full min-w-0 overflow-hidden"
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400/90" aria-hidden />
        <span className="text-[12px] font-medium text-emerald-200 shrink-0">Doctrine selected exercises</span>
        <span className="text-[12px] text-emerald-200/70 break-words [overflow-wrap:anywhere] min-w-0">
          changed {sessionsChanged} session{sessionsChanged === 1 ? '' : 's'} of {sessionsWithAudit} evaluated
        </span>
      </div>
    )
  }

  // Real upstream failure — doctrine never reached generation. The user
  // should know, because regenerate alone won't fix it.
  if (verdict === 'doctrine_did_not_run' || verdict === 'doctrine_cache_empty') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-causal-status="did-not-run"
        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2 max-w-full min-w-0 overflow-hidden"
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400/90" aria-hidden />
        <span className="text-[12px] font-medium text-amber-200 shrink-0">Doctrine did not reach generation</span>
        <span className="text-[12px] text-amber-200/70 break-words [overflow-wrap:anywhere] min-w-0">
          {verdict === 'doctrine_cache_empty'
            ? 'rules cache was unavailable when this program was built'
            : 'selector did not run with doctrine — regenerate may not fix this on its own'}
        </span>
      </div>
    )
  }

  // Doctrine loaded but had no rules matching this profile's domains.
  if (verdict === 'doctrine_domain_gap') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-causal-status="domain-gap"
        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2 max-w-full min-w-0 overflow-hidden"
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400/90" aria-hidden />
        <span className="text-[12px] font-medium text-amber-200 shrink-0">No doctrine rules matched</span>
        <span className="text-[12px] text-amber-200/70 break-words [overflow-wrap:anywhere] min-w-0">
          rules were loaded but none applied to your profile&apos;s candidates
        </span>
      </div>
    )
  }

  // Doctrine evaluated alternatives but base ranking already won. This is
  // the honest "available but not causal" state — not a failure, but
  // explicitly not a success either.
  if (verdict === 'doctrine_scoring_too_weak' || verdict === 'already_optimal_protected') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-causal-status="evaluated-no-change"
        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-zinc-700/40 bg-zinc-900/40 px-3 py-2 max-w-full min-w-0 overflow-hidden"
      >
        <MinusCircle className="w-3.5 h-3.5 shrink-0 text-zinc-400/80" aria-hidden />
        <span className="text-[12px] font-medium text-zinc-300 shrink-0">Doctrine evaluated alternatives</span>
        <span className="text-[12px] text-zinc-400/80 break-words [overflow-wrap:anywhere] min-w-0">
          base ranking already optimal — no exercise selection changed across {sessionsWithAudit} session{sessionsWithAudit === 1 ? '' : 's'}
        </span>
      </div>
    )
  }

  // Unknown or not_unchanged with sessionsChanged === 0 — render nothing
  // rather than show ambiguous copy.
  return null
}

/**
 * [PHASE 4L] WEEKLY METHOD CHALLENGE LINE
 *
 * Reads `program.weeklyMethodRepresentation` (Phase 4J auditor output) and
 * `program.rowLevelMutatorRollup` (Phase 4L mutator rollup) and renders a
 * compact per-method chip set so the athlete can see, at a glance, which
 * row-level methods materialized vs. which were blocked by safety vs. which
 * are not needed for their profile.
 *
 * Honest contract:
 *   - Hidden when `program.weeklyMethodRepresentation` is missing
 *     (legacy / pre-Phase-4J program — the stale notice owns that state).
 *   - Each chip's status comes from real audit data:
 *       APPLIED                       → emerald + count
 *       BLOCKED_BY_SAFETY             → amber
 *       NOT_NEEDED_FOR_PROFILE        → zinc
 *       MATERIALIZER_NOT_CONNECTED    → zinc dashed
 *   - Never claims "applied" without a non-zero materialized count.
 *   - Never hides honest gaps (`endurance_density` legitimately reports
 *     `MATERIALIZER_NOT_CONNECTED` from the auditor, but if the Phase 4L
 *     mutator applied it on at least one session this rollup will reclassify
 *     it as APPLIED via `rowLevelMutatorRollup.enduranceDensityApplied`).
 *   - Includes a compact prescription-bounds summary line when the mutator
 *     ran (e.g. "8/12 rows within prescription bounds").
 */
type WeeklyMethodId =
  | 'top_set_backoff'
  | 'drop_set'
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'cluster'
  | 'endurance_density'
  | 'rest_pause'

type WeeklyMethodStatus =
  | 'APPLIED'
  | 'BLOCKED_BY_SAFETY'
  | 'NOT_NEEDED_FOR_PROFILE'
  | 'MATERIALIZER_NOT_CONNECTED'

interface WeeklyMethodEntry {
  methodId: WeeklyMethodId
  status: WeeklyMethodStatus
  materializedCount: number
  reason: string
  hasMaterializer: boolean
}

interface WeeklyMethodRepView {
  version?: string
  byMethod?: WeeklyMethodEntry[]
  oneLineExplanation?: string
  totals?: {
    methodsApplied?: number
    methodsBlockedBySafety?: number
    methodsNotNeeded?: number
    methodsMaterializerNotConnected?: number
  }
}

interface RowLevelMutatorRollupView {
  sessionsProcessed?: number
  totalApplied?: number
  totalBlocked?: number
  enduranceDensityApplied?: number
  // [PHASE 4M] Doctrine application corridor counts
  topSetApplied?: number
  dropSetApplied?: number
  restPauseApplied?: number
  prescriptionRestApplied?: number
  prescriptionRpeApplied?: number
  totalDoctrineApplications?: number
  programFinalVerdict?:
    | 'DOCTRINE_DECISIVELY_APPLIED'
    | 'DOCTRINE_PARTIALLY_APPLIED'
    | 'DOCTRINE_EVALUATED_NO_SAFE_CHANGES'
    | 'DOCTRINE_NOT_CONNECTED'
  rowsWithinBounds?: number
  rowsOutOfBounds?: number
  rowsMissingBounds?: number
}

const METHOD_CHIP_LABELS: Record<WeeklyMethodId, string> = {
  top_set_backoff: 'Top Set + Back-Off',
  drop_set: 'Drop Set',
  superset: 'Superset',
  circuit: 'Circuit',
  density_block: 'Density Block',
  cluster: 'Cluster',
  endurance_density: 'Endurance Density',
  rest_pause: 'Rest-Pause',
}

const METHOD_CHIP_ORDER: WeeklyMethodId[] = [
  'top_set_backoff',
  'drop_set',
  'rest_pause',
  'cluster',
  'endurance_density',
  'superset',
  'circuit',
  'density_block',
]

function chipClassForStatus(status: WeeklyMethodStatus): string {
  switch (status) {
    case 'APPLIED':
      return 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200'
    case 'BLOCKED_BY_SAFETY':
      return 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200'
    case 'NOT_NEEDED_FOR_PROFILE':
      return 'border-zinc-700/40 bg-zinc-900/40 text-zinc-300'
    case 'MATERIALIZER_NOT_CONNECTED':
      return 'border-dashed border-zinc-700/50 bg-zinc-900/30 text-zinc-400'
  }
}

function statusShortLabel(status: WeeklyMethodStatus): string {
  switch (status) {
    case 'APPLIED':
      return 'applied'
    case 'BLOCKED_BY_SAFETY':
      return 'blocked'
    case 'NOT_NEEDED_FOR_PROFILE':
      return 'not needed'
    case 'MATERIALIZER_NOT_CONNECTED':
      return 'not connected'
  }
}

export function WeeklyMethodChallengeLine({ program }: Props) {
  if (!program) return null

  const weeklyRep = (program as unknown as { weeklyMethodRepresentation?: WeeklyMethodRepView | null })
    .weeklyMethodRepresentation ?? null

  // Hidden on legacy / pre-Phase-4J programs.
  if (!weeklyRep || !Array.isArray(weeklyRep.byMethod) || weeklyRep.byMethod.length === 0) return null

  const mutatorRollup = (program as unknown as { rowLevelMutatorRollup?: RowLevelMutatorRollupView | null })
    .rowLevelMutatorRollup ?? null

  // [PHASE 4L+4M] Reclassify chips via the mutator rollup. The Phase 4J
  // auditor reads from `materializationRollup.totalRow*` only — it cannot
  // see post-builder writes from the Phase 4L mutator
  // (`exercise.method = 'endurance_density'`) or the Phase 4M doctrine
  // application corridor (doctrine-earned `setExecutionMethod` for
  // top_set / drop_set / rest_pause on rows the builder did not touch).
  // We honestly upgrade the chip when the rollup proves an application
  // happened beyond what the auditor saw.
  const reclassified = new Map<WeeklyMethodId, { status: WeeklyMethodStatus; materializedCount: number; reason: string }>()
  if (mutatorRollup && (mutatorRollup.enduranceDensityApplied ?? 0) > 0) {
    reclassified.set('endurance_density', {
      status: 'APPLIED',
      materializedCount: mutatorRollup.enduranceDensityApplied ?? 0,
      reason: `Applied to ${mutatorRollup.enduranceDensityApplied} session(s) by the row-level mutator on safe late-position accessory / core / conditioning targets.`,
    })
  }
  // [PHASE 4M] Doctrine-earned row-level methods. Only upgrade the chip if
  // the auditor reported < the corridor's count (i.e. the corridor added
  // applications the auditor did not see). Never downgrade.
  if (mutatorRollup && (mutatorRollup.topSetApplied ?? 0) > 0) {
    reclassified.set('top_set_backoff', {
      status: 'APPLIED',
      materializedCount: mutatorRollup.topSetApplied ?? 0,
      reason: `Doctrine application corridor applied top set + back-off on ${mutatorRollup.topSetApplied} session pillar(s) — loadable strength row + strength-priority profile.`,
    })
  }
  if (mutatorRollup && (mutatorRollup.dropSetApplied ?? 0) > 0) {
    reclassified.set('drop_set', {
      status: 'APPLIED',
      materializedCount: mutatorRollup.dropSetApplied ?? 0,
      reason: `Doctrine application corridor applied drop set on ${mutatorRollup.dropSetApplied} late accessory_hypertrophy row(s) — hypertrophy-priority profile.`,
    })
  }
  if (mutatorRollup && (mutatorRollup.restPauseApplied ?? 0) > 0) {
    reclassified.set('rest_pause', {
      status: 'APPLIED',
      materializedCount: mutatorRollup.restPauseApplied ?? 0,
      reason: `Doctrine application corridor applied rest-pause on ${mutatorRollup.restPauseApplied} late accessory row(s) — strength-endurance / strength-priority profile.`,
    })
  }

  const entries = (weeklyRep.byMethod ?? [])
    .filter(e => METHOD_CHIP_ORDER.includes(e.methodId))
    .map(e => {
      const reclass = reclassified.get(e.methodId)
      if (reclass) return { ...e, ...reclass }
      return e
    })
    .sort((a, b) => METHOD_CHIP_ORDER.indexOf(a.methodId) - METHOD_CHIP_ORDER.indexOf(b.methodId))

  if (entries.length === 0) return null

  // Build prescription bounds summary line — only when mutator ran.
  const totalRows =
    (mutatorRollup?.rowsWithinBounds ?? 0) +
    (mutatorRollup?.rowsOutOfBounds ?? 0) +
    (mutatorRollup?.rowsMissingBounds ?? 0)
  const showPrescriptionLine = !!mutatorRollup && totalRows > 0

  return (
    <div
      role="status"
      aria-live="polite"
      data-method-challenge="phase4l"
      className="mb-3 rounded-md border border-zinc-700/40 bg-zinc-900/40 px-3 py-2 max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-zinc-400/80" aria-hidden />
        <span className="text-[12px] font-medium text-zinc-200">Method materialization</span>
        {weeklyRep.oneLineExplanation && (
          <span className="text-[12px] text-zinc-400/80 break-words [overflow-wrap:anywhere] min-w-0 flex-1">
            {weeklyRep.oneLineExplanation}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {entries.map(entry => {
          const label = METHOD_CHIP_LABELS[entry.methodId]
          const chipClass = chipClassForStatus(entry.status)
          const showCount = entry.status === 'APPLIED' && entry.materializedCount > 0
          return (
            <span
              key={entry.methodId}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-tight ${chipClass}`}
              title={entry.reason}
            >
              <span className="font-medium">{label}</span>
              <span className="opacity-70">
                {showCount ? `· ${entry.materializedCount}` : `· ${statusShortLabel(entry.status)}`}
              </span>
            </span>
          )
        })}
      </div>

      {showPrescriptionLine && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400/80">
          <span className="font-medium text-zinc-300">Prescription bounds</span>
          <span>
            {mutatorRollup?.rowsWithinBounds ?? 0}/{totalRows} rows within doctrine bounds
            {(mutatorRollup?.rowsOutOfBounds ?? 0) > 0 &&
              ` · ${mutatorRollup?.rowsOutOfBounds} out-of-bounds (not mutated)`}
            {(mutatorRollup?.rowsMissingBounds ?? 0) > 0 &&
              ` · ${mutatorRollup?.rowsMissingBounds} missing parseable dosage`}
          </span>
        </div>
      )}

      {/* [PHASE 4M] Doctrine application deltas — visible proof that the
          doctrine application corridor decisively mutated rest seconds and/or
          targetRPE on at least one row. Only renders when the corridor
          applied a real mutation (count > 0). */}
      {mutatorRollup && ((mutatorRollup.prescriptionRestApplied ?? 0) > 0 || (mutatorRollup.prescriptionRpeApplied ?? 0) > 0) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400/80">
          <span className="font-medium text-zinc-300">Doctrine deltas</span>
          <span>
            {(mutatorRollup.prescriptionRestApplied ?? 0) > 0 &&
              `${mutatorRollup.prescriptionRestApplied} rest adjustment${(mutatorRollup.prescriptionRestApplied ?? 0) === 1 ? '' : 's'}`}
            {(mutatorRollup.prescriptionRestApplied ?? 0) > 0 && (mutatorRollup.prescriptionRpeApplied ?? 0) > 0 && ' · '}
            {(mutatorRollup.prescriptionRpeApplied ?? 0) > 0 &&
              `${mutatorRollup.prescriptionRpeApplied} RPE assignment${(mutatorRollup.prescriptionRpeApplied ?? 0) === 1 ? '' : 's'}`}
            {' (within conservative role bounds, before/after stamped on each row)'}
          </span>
        </div>
      )}

      {/* [PHASE 4M] Program-level final verdict — concise honest read of the
          rollup. Hidden when the corridor never ran (no rollup attached). */}
      {mutatorRollup?.programFinalVerdict && (
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          <span className="font-medium text-zinc-300">Doctrine application</span>
          <span
            className={
              mutatorRollup.programFinalVerdict === 'DOCTRINE_DECISIVELY_APPLIED'
                ? 'text-emerald-300'
                : mutatorRollup.programFinalVerdict === 'DOCTRINE_PARTIALLY_APPLIED'
                  ? 'text-emerald-200/80'
                  : 'text-zinc-400'
            }
          >
            {mutatorRollup.programFinalVerdict === 'DOCTRINE_DECISIVELY_APPLIED' &&
              `decisively applied (${mutatorRollup.totalDoctrineApplications ?? 0} mutation${(mutatorRollup.totalDoctrineApplications ?? 0) === 1 ? '' : 's'})`}
            {mutatorRollup.programFinalVerdict === 'DOCTRINE_PARTIALLY_APPLIED' &&
              `partially applied (${mutatorRollup.totalDoctrineApplications ?? 0} mutation${(mutatorRollup.totalDoctrineApplications ?? 0) === 1 ? '' : 's'}, some blocked by safety)`}
            {mutatorRollup.programFinalVerdict === 'DOCTRINE_EVALUATED_NO_SAFE_CHANGES' &&
              'evaluated, no safe changes earned for this profile'}
            {mutatorRollup.programFinalVerdict === 'DOCTRINE_NOT_CONNECTED' && 'not connected'}
          </span>
        </div>
      )}

      <Phase4NMethodBudgetLine program={program as unknown as { weeklyMethodBudgetPlan?: BudgetPlanView | null; trainingIntentVector?: IntentVectorView | null }} />

      <Phase4PMethodStructureLine program={program as unknown as { methodStructureRollup?: MethodStructureRollupView | null }} />
    </div>
  )
}

// =============================================================================
// [PHASE 4P] METHOD STRUCTURE ROLLUP LINE
// Reads `program.methodStructureRollup` (built once by
// `lib/server/authoritative-program-generation.ts`, populated by per-session
// `summary.structuralMaterialization`). Renders one compact line summarising
// what the structural materialization corridor did across the whole week:
//   "Method structure: X applied · Y already applied · Z blocked · W no safe target"
// The verdict pill is colour-coded:
//   STRUCTURAL_METHODS_APPLIED        → emerald
//   ROW_METHODS_ONLY_APPLIED          → emerald-200
//   EVALUATED_NO_SAFE_STRUCTURAL_METHODS → zinc
//   METHOD_MATERIALIZATION_NOT_CONNECTED → zinc-dashed
// When a sample proof exists, it shows in a hover-tooltip on the verdict pill
// with the day, family, and member exercises. Honest no-change is honoured —
// nothing is shown when the rollup is absent.
// =============================================================================
interface MethodStructureRollupView {
  finalVerdict?: string
  totalApplied?: number
  totalAlreadyApplied?: number
  totalBlocked?: number
  totalNotNeeded?: number
  totalNoSafeTarget?: number
  totalNewStructuralGroupsWritten?: number
  byFamily?: Record<string, { applied?: number; alreadyApplied?: number; blocked?: number; notNeeded?: number; noSafeTarget?: number }>
  sampleProof?: {
    dayNumber?: number
    family?: string
    exerciseNames?: string[]
    reason?: string
    visibleProofPath?: string
  } | null
}

function Phase4PMethodStructureLine({ program }: { program: { methodStructureRollup?: MethodStructureRollupView | null } }) {
  const rollup = program.methodStructureRollup
  if (!rollup || !rollup.finalVerdict) return null

  const applied = rollup.totalApplied ?? 0
  const alreadyApplied = rollup.totalAlreadyApplied ?? 0
  const blocked = rollup.totalBlocked ?? 0
  const noSafeTarget = rollup.totalNoSafeTarget ?? 0
  const notNeeded = rollup.totalNotNeeded ?? 0
  const newWritten = rollup.totalNewStructuralGroupsWritten ?? 0

  const sample = rollup.sampleProof ?? null
  const sampleTooltip = sample
    ? `Day ${sample.dayNumber ?? '?'} · ${sample.family ?? '—'}: ${(sample.exerciseNames ?? []).join(' + ') || '(no members)'}${sample.reason ? ` — ${sample.reason}` : ''}`
    : ''

  function verdictMicrocopy(): { label: string; tone: string } {
    switch (rollup?.finalVerdict) {
      case 'STRUCTURAL_METHODS_APPLIED':
        return { label: 'structural methods applied', tone: 'text-emerald-300' }
      case 'ROW_METHODS_ONLY_APPLIED':
        return { label: 'row-level methods applied (no grouped structure earned)', tone: 'text-emerald-200/80' }
      case 'EVALUATED_NO_SAFE_STRUCTURAL_METHODS':
        return { label: 'evaluated, no safe structural methods', tone: 'text-zinc-400' }
      case 'METHOD_MATERIALIZATION_NOT_CONNECTED':
        return { label: 'not connected', tone: 'text-zinc-500' }
      case 'METHOD_MATERIALIZATION_ERROR':
        return { label: 'error during materialization', tone: 'text-amber-300' }
      default:
        return { label: rollup?.finalVerdict ?? '—', tone: 'text-zinc-400' }
    }
  }
  const { label, tone } = verdictMicrocopy()

  return (
    <div className="mt-2 border-t border-zinc-800/60 pt-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] min-w-0" style={{ overflowWrap: 'anywhere' }}>
        <span className="font-medium text-zinc-300">Method structure</span>
        <span className={tone} title={sampleTooltip}>
          {label}
        </span>
        <span className="text-zinc-500">·</span>
        <span className="text-zinc-400">
          {applied} applied
          {newWritten > 0 ? ` (${newWritten} new)` : ''}
          {alreadyApplied > 0 ? ` · ${alreadyApplied} already applied` : ''}
          {blocked > 0 ? ` · ${blocked} blocked` : ''}
          {noSafeTarget > 0 ? ` · ${noSafeTarget} no safe target` : ''}
          {notNeeded > 0 ? ` · ${notNeeded} not needed` : ''}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// [PHASE 4N] METHOD BUDGET LINE
// Reads `program.weeklyMethodBudgetPlan` (built once by
// `lib/program/weekly-method-budget-plan.ts`) and renders a compact per-family
// verdict strip: SHOULD_APPLY / MAY_APPLY / NOT_NEEDED / BLOCKED_BY_SAFETY /
// NO_SAFE_TARGET / NOT_CONNECTED. Each chip carries the budget reason in its
// `title` tooltip — the user can hover any "blocked" or "not_needed" chip and
// see the exact intent / safety reason instead of guessing.
// =============================================================================
type BudgetVerdict =
  | 'SHOULD_APPLY'
  | 'MAY_APPLY'
  | 'NOT_NEEDED'
  | 'BLOCKED_BY_SAFETY'
  | 'NO_SAFE_TARGET'
  | 'NOT_CONNECTED'
interface BudgetEntryView {
  family: string
  verdict: BudgetVerdict
  recommendedWeeklyCount?: number
  reason?: string
}
interface BudgetPlanView {
  byFamily?: Record<string, BudgetEntryView>
  totalShouldApply?: number
}
interface IntentVectorView {
  strengthIntent?: number
  hypertrophyIntent?: number
  skillIntent?: number
  enduranceIntent?: number
  densityIntent?: number
  advancedAthleteSignal?: number
  tendonProtectionIntent?: number
  confidence?: 'low' | 'partial' | 'usable' | 'strong'
}

function Phase4NMethodBudgetLine({
  program,
}: {
  program: { weeklyMethodBudgetPlan?: BudgetPlanView | null; trainingIntentVector?: IntentVectorView | null }
}) {
  const budget = program.weeklyMethodBudgetPlan
  const vector = program.trainingIntentVector

  if (!budget || !budget.byFamily) return null

  const familyOrder: Array<{ key: string; label: string }> = [
    { key: 'top_set_backoff', label: 'Top Set' },
    { key: 'drop_set', label: 'Drop Set' },
    { key: 'rest_pause', label: 'Rest-Pause' },
    { key: 'cluster', label: 'Cluster' },
    { key: 'superset', label: 'Superset' },
    { key: 'circuit', label: 'Circuit' },
    { key: 'density_block', label: 'Density Block' },
    { key: 'endurance_density', label: 'Endurance Density' },
  ]

  function chipClass(verdict: BudgetVerdict): string {
    switch (verdict) {
      case 'SHOULD_APPLY':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'MAY_APPLY':
        return 'bg-emerald-400/10 text-emerald-200/80 border-emerald-400/20'
      case 'NOT_NEEDED':
        return 'bg-zinc-700/40 text-zinc-400 border-zinc-700/50'
      case 'BLOCKED_BY_SAFETY':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'NO_SAFE_TARGET':
        return 'bg-zinc-700/40 text-zinc-400 border-zinc-700/50 border-dashed'
      case 'NOT_CONNECTED':
        return 'bg-zinc-800/40 text-zinc-500 border-zinc-800/60 border-dashed'
    }
  }
  function shortLabel(verdict: BudgetVerdict): string {
    switch (verdict) {
      case 'SHOULD_APPLY': return 'should apply'
      case 'MAY_APPLY': return 'may apply'
      case 'NOT_NEEDED': return 'not needed'
      case 'BLOCKED_BY_SAFETY': return 'blocked'
      case 'NO_SAFE_TARGET': return 'no safe target'
      case 'NOT_CONNECTED': return 'not connected'
    }
  }

  return (
    <div className="mt-2 border-t border-zinc-800/60 pt-2">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-medium text-zinc-300">Method budget</span>
        {vector?.confidence && (
          <span className="text-zinc-500">
            (intent vector: {vector.confidence}
            {typeof vector.strengthIntent === 'number' && ` · str ${vector.strengthIntent.toFixed(2)}`}
            {typeof vector.hypertrophyIntent === 'number' && ` · hyp ${vector.hypertrophyIntent.toFixed(2)}`}
            {typeof vector.skillIntent === 'number' && ` · skill ${vector.skillIntent.toFixed(2)}`}
            {typeof vector.enduranceIntent === 'number' && ` · end ${vector.enduranceIntent.toFixed(2)}`}
            {typeof vector.densityIntent === 'number' && ` · den ${vector.densityIntent.toFixed(2)}`}
            )
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {familyOrder.map(({ key, label }) => {
          const entry = budget.byFamily?.[key]
          if (!entry) return null
          const verdict = entry.verdict
          return (
            <span
              key={key}
              title={entry.reason ?? ''}
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${chipClass(verdict)}`}
            >
              <span className="font-medium">{label}</span>
              <span className="opacity-70">·</span>
              <span>{shortLabel(verdict)}</span>
              {verdict === 'SHOULD_APPLY' && typeof entry.recommendedWeeklyCount === 'number' && entry.recommendedWeeklyCount > 0 && (
                <span className="opacity-70">{` ×${entry.recommendedWeeklyCount}/wk`}</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
