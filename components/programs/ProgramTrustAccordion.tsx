'use client'

/**
 * =============================================================================
 * [PHASE X] PROGRAM TRUST ACCORDION
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Phase W made doctrine causality more honest, but the Program page now
 * stacks four detailed proof lines vertically, which makes the page feel
 * like a developer/debug surface instead of a premium AI coach experience.
 *
 * Phase X consolidates those four lines into a compact, two-tier trust
 * surface:
 *
 *   LEVEL 1 (always visible):
 *     - One short, premium "Doctrine impact" verdict header
 *     - One compact one-line summary derived from the Phase W ledger
 *     - Compact chip strip with non-zero buckets only
 *
 *   LEVEL 2 (collapsed by default, behind <details> disclosure):
 *     - The original Phase 4C `MaterializationStatusLine`
 *     - The original Phase W `DoctrineCausalityLedgerLine`
 *     - The original Phase 4E `DoctrineCausalLine`
 *     - The original Phase 4L `WeeklyMethodChallengeLine`
 *
 * IMPORTANT — PROOF PRESERVATION
 * ------------------------------
 * Every Phase W causality state remains accessible. The accordion does NOT
 * remove, merge, or rename causality data. It ONLY changes information
 * architecture:
 *
 *   - All four proof lines still render the same way.
 *   - All Phase W bucket counts remain individually visible (chip + detail).
 *   - Suppressed / blocked / acknowledged / unknown states remain honest.
 *   - Cluster / circuit / density "blocked by runtime" remains visible
 *     inside the detail disclosure, never hidden, never falsely promoted.
 *
 * The compact summary uses ONLY data already returned by the existing
 * `runDoctrineCausalityAudit(program)` contract — no new computation,
 * no new generator pass, no mutation of the program object.
 *
 * SAFETY
 * ------
 * - Pure observation. Reads the program prop, runs the existing pure
 *   audit, returns JSX. Zero side effects. Zero state. Zero effects.
 * - On INCONCLUSIVE empty programs, hides entirely — the Phase 4B stale
 *   notice owns that state.
 * - Native HTML <details> for the disclosure → no new dependency, no
 *   animation framework, no client state needed. Native expand/collapse
 *   is mobile-friendly and accessible.
 * - Each child proof line was already fail-closed (returns null on
 *   missing artifacts). The accordion preserves that behavior.
 * =============================================================================
 */

import {
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Ban,
  Eye,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { runDoctrineCausalityAudit } from '@/lib/program/doctrine-causality-audit-contract'
import {
  MaterializationStatusLine,
  DoctrineCausalLine,
  WeeklyMethodChallengeLine,
} from '@/components/programs/MaterializationStatusLine'
import { DoctrineCausalityLedgerLine } from '@/components/programs/DoctrineCausalityLedgerLine'

interface Props {
  program: AdaptiveProgram | null
}

/**
 * Phase X user-facing copy map. The Phase W contract emits technical state
 * names; the accordion summary surfaces premium training-language equivalents.
 * Technical names remain verbatim inside the detail disclosure (each child
 * proof line keeps its existing labels), so QA / dev verification is unchanged.
 */
const SUMMARY_COPY = {
  materialized: 'changed your plan',
  appliedNoStructuralChange: 'already satisfied',
  eligibleSuppressed: 'held back for safety',
  blockedByRuntime: 'unsupported in live workout',
  acknowledgedAndPostHoc: 'informational only',
  unknownUnverified: 'no verified impact',
} as const

export function ProgramTrustAccordion({ program }: Props) {
  if (!program) return null

  const ledger = runDoctrineCausalityAudit(program)

  // Hide entirely on legacy / inconclusive empty programs — the Phase 4B
  // stale notice owns that state. Same gate the Phase W ledger line uses.
  if (ledger.verdict === 'INCONCLUSIVE' && ledger.counts.total === 0) {
    return null
  }

  // Verdict header tone — same honest thresholds as the Phase W ledger line,
  // but with premium athlete-facing copy.
  const verdictMeta: Record<
    typeof ledger.verdict,
    {
      label: string
      tone: 'emerald' | 'zinc' | 'amber'
      icon: typeof CheckCircle2
    }
  > = {
    MOSTLY_CAUSAL: {
      label: 'AI changed your plan',
      tone: 'emerald',
      icon: CheckCircle2,
    },
    PARTIALLY_CAUSAL: {
      label: 'AI partially changed your plan',
      tone: 'zinc',
      icon: CircleDot,
    },
    MOSTLY_COSMETIC: {
      label: 'AI mostly informational',
      tone: 'amber',
      icon: AlertTriangle,
    },
    INCONCLUSIVE: {
      label: 'AI impact unverified',
      tone: 'zinc',
      icon: HelpCircle,
    },
  }
  const meta = verdictMeta[ledger.verdict]
  const Icon = meta.icon

  const containerToneClass =
    meta.tone === 'emerald'
      ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
      : meta.tone === 'amber'
        ? 'border-amber-500/25 bg-amber-500/[0.05]'
        : 'border-[#2B313A] bg-[#0F1115]'
  const titleToneClass =
    meta.tone === 'emerald'
      ? 'text-emerald-200'
      : meta.tone === 'amber'
        ? 'text-amber-200'
        : 'text-[#E6E9EF]'
  const iconToneClass =
    meta.tone === 'emerald'
      ? 'text-emerald-400/90'
      : meta.tone === 'amber'
        ? 'text-amber-400/90'
        : 'text-[#A4ACB8]'

  // Compact chip row — premium copy, honest counts, only buckets > 0.
  // The Phase W states are PRESERVED individually (we never merge
  // materialized into "applied", never merge suppressed into "blocked").
  // Acknowledged + post-hoc are summed into one "informational only" chip
  // because the user-facing distinction is not actionable; the detail
  // disclosure still surfaces both buckets separately via the original
  // Phase W ledger line.
  type ChipTone = 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky'
  const chips: Array<{
    label: string
    count: number
    tone: ChipTone
    icon: typeof CheckCircle2
  }> = []
  if (ledger.counts.materialized > 0) {
    chips.push({
      label: SUMMARY_COPY.materialized,
      count: ledger.counts.materialized,
      tone: 'emerald',
      icon: CheckCircle2,
    })
  }
  if (ledger.counts.appliedNoStructuralChange > 0) {
    chips.push({
      label: SUMMARY_COPY.appliedNoStructuralChange,
      count: ledger.counts.appliedNoStructuralChange,
      tone: 'zinc',
      icon: CircleDot,
    })
  }
  if (ledger.counts.eligibleSuppressed > 0) {
    chips.push({
      label: SUMMARY_COPY.eligibleSuppressed,
      count: ledger.counts.eligibleSuppressed,
      tone: 'amber',
      icon: AlertTriangle,
    })
  }
  if (ledger.counts.blockedByRuntime > 0) {
    chips.push({
      label: SUMMARY_COPY.blockedByRuntime,
      count: ledger.counts.blockedByRuntime,
      tone: 'rose',
      icon: Ban,
    })
  }
  const acknowledgedTotal =
    ledger.counts.acknowledgedOnly + ledger.counts.postHocOnly
  if (acknowledgedTotal > 0) {
    chips.push({
      label: SUMMARY_COPY.acknowledgedAndPostHoc,
      count: acknowledgedTotal,
      tone: 'sky',
      icon: Eye,
    })
  }
  if (ledger.counts.unknownUnverified > 0) {
    chips.push({
      label: SUMMARY_COPY.unknownUnverified,
      count: ledger.counts.unknownUnverified,
      tone: 'zinc',
      icon: HelpCircle,
    })
  }

  return (
    <div
      role="region"
      aria-label="AI coaching impact summary"
      data-phase-x-trust-accordion={ledger.verdict.toLowerCase()}
      className={`mb-3 rounded-md border max-w-full min-w-0 overflow-hidden ${containerToneClass}`}
    >
      {/* ===========================================================
          LEVEL 1 — ALWAYS VISIBLE COMPACT TRUST SUMMARY
          - verdict header
          - one-line honest summary from the Phase W ledger
          - chip strip (non-zero buckets only, premium copy)
          =========================================================== */}
      <div className="flex flex-col gap-2 px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <Icon
            className={`w-3.5 h-3.5 shrink-0 ${iconToneClass}`}
            aria-hidden
          />
          <span
            className={`text-[12px] font-medium shrink-0 ${titleToneClass}`}
          >
            {meta.label}
          </span>
          <span className="text-[12px] text-[#A4ACB8] break-words [overflow-wrap:anywhere] min-w-0">
            {ledger.oneLineExplanation}
          </span>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map(c => {
              const ChipIcon = c.icon
              const chipClass =
                c.tone === 'emerald'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : c.tone === 'amber'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    : c.tone === 'rose'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                      : c.tone === 'sky'
                        ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
                        : 'border-[#2B313A] bg-[#1A1F26] text-[#A4ACB8]'
              return (
                <span
                  key={c.label}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tabular-nums ${chipClass}`}
                >
                  <ChipIcon className="w-3 h-3 shrink-0" aria-hidden />
                  <span className="font-medium">{c.count}</span>
                  <span className="opacity-90">{c.label}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* ===========================================================
          LEVEL 2 — COLLAPSED EVIDENCE DETAIL
          Native <details> disclosure. Collapsed by default. When
          expanded, the four original Phase W proof surfaces render
          identically to their pre-Phase-X behavior — the ONLY change
          is that they live behind a click instead of stacking on the
          main page. Every causality state remains accessible.
          =========================================================== */}
      <details className="group border-t border-[#2B313A]/60">
        <summary
          className="flex items-center justify-between gap-2 cursor-pointer select-none px-3 py-2 text-[11px] font-medium text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors min-w-0"
          aria-label="Toggle full AI coaching evidence detail"
        >
          <span className="break-words [overflow-wrap:anywhere] min-w-0">
            View full AI evidence
          </span>
          <ChevronDown
            className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="flex flex-col gap-0 px-3 pb-3 pt-1">
          {/*
            Each child line is identical to its pre-Phase-X render:
            - same component
            - same `program` prop
            - same internal data path
            - same fail-closed null behavior on missing artifacts
            The accordion reorders the visual hierarchy without
            changing what each line proves.
          */}
          <MaterializationStatusLine program={program} />
          <DoctrineCausalityLedgerLine program={program} />
          <DoctrineCausalLine program={program} />
          <WeeklyMethodChallengeLine program={program} />
        </div>
      </details>
    </div>
  )
}
