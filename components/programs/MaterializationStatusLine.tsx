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
