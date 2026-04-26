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

import { CheckCircle2, MinusCircle } from 'lucide-react'
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
