'use client'

/**
 * [PHASE W] DOCTRINE CAUSALITY LEDGER LINE
 *
 * Honest one-line + chip-row summary of the Phase W causality audit. Reads
 * the canonical program object via `runDoctrineCausalityAudit` (pure
 * observation, no mutation) and renders an athlete-readable breakdown that
 * separates:
 *
 *   - Materialized          (rule changed final program; concrete fields cited)
 *   - Applied (no change)   (engine accepted, baseline already matched)
 *   - Suppressed            (eligible but a higher gate won)
 *   - Blocked by runtime    (doctrine-valid, runtime cannot execute yet)
 *   - Acknowledged          (shadow-mode / post-hoc only)
 *   - Unverified            (cannot prove or disprove from artifacts)
 *
 * Rendering rules (honesty-first):
 *   - Hides entirely if the audit returns INCONCLUSIVE with zero entries
 *     (the Phase 4B stale notice and Phase 4C MaterializationStatusLine
 *     already own the empty / stale states).
 *   - Verdict color follows honest thresholds:
 *       MOSTLY_CAUSAL     emerald
 *       PARTIALLY_CAUSAL  zinc
 *       MOSTLY_COSMETIC   amber
 *       INCONCLUSIVE      zinc + muted
 *   - Chips with count 0 are omitted (no "0 materialized" claims).
 *   - NEVER says "all doctrine applied" or "1500 rules active".
 *   - This line is COMPLEMENTARY to MaterializationStatusLine — that line
 *     reports the rollup-level structural change counts; this line reports
 *     per-rule classification distribution.
 */

import {
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Ban,
  Eye,
  HelpCircle,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { runDoctrineCausalityAudit } from '@/lib/program/doctrine-causality-audit-contract'

interface Props {
  program: AdaptiveProgram | null
}

export function DoctrineCausalityLedgerLine({ program }: Props) {
  if (!program) return null

  const ledger = runDoctrineCausalityAudit(program)

  // Hide entirely on legacy / inconclusive empty programs — the stale notice
  // owns that state. We never claim a verdict against zero data.
  if (ledger.verdict === 'INCONCLUSIVE' && ledger.counts.total === 0) {
    return null
  }

  const verdictMeta: Record<
    typeof ledger.verdict,
    { label: string; tone: 'emerald' | 'zinc' | 'amber'; icon: typeof CheckCircle2 }
  > = {
    MOSTLY_CAUSAL: { label: 'Doctrine impact: causal', tone: 'emerald', icon: CheckCircle2 },
    PARTIALLY_CAUSAL: { label: 'Doctrine impact: partial', tone: 'zinc', icon: CircleDot },
    MOSTLY_COSMETIC: { label: 'Doctrine impact: mostly acknowledged', tone: 'amber', icon: AlertTriangle },
    INCONCLUSIVE: { label: 'Doctrine impact: unverified', tone: 'zinc', icon: HelpCircle },
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

  // Build chip rows — chips with count 0 are omitted (honesty-first).
  type ChipTone = 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky'
  const chips: Array<{ label: string; count: number; tone: ChipTone; icon: typeof CheckCircle2 }> = []
  if (ledger.counts.materialized > 0) {
    chips.push({
      label: 'materialized',
      count: ledger.counts.materialized,
      tone: 'emerald',
      icon: CheckCircle2,
    })
  }
  if (ledger.counts.appliedNoStructuralChange > 0) {
    chips.push({
      label: 'applied (no change)',
      count: ledger.counts.appliedNoStructuralChange,
      tone: 'zinc',
      icon: CircleDot,
    })
  }
  if (ledger.counts.eligibleSuppressed > 0) {
    chips.push({
      label: 'suppressed',
      count: ledger.counts.eligibleSuppressed,
      tone: 'amber',
      icon: AlertTriangle,
    })
  }
  if (ledger.counts.blockedByRuntime > 0) {
    chips.push({
      label: 'blocked by runtime',
      count: ledger.counts.blockedByRuntime,
      tone: 'rose',
      icon: Ban,
    })
  }
  if (ledger.counts.acknowledgedOnly + ledger.counts.postHocOnly > 0) {
    chips.push({
      label: 'acknowledged',
      count: ledger.counts.acknowledgedOnly + ledger.counts.postHocOnly,
      tone: 'sky',
      icon: Eye,
    })
  }
  if (ledger.counts.unknownUnverified > 0) {
    chips.push({
      label: 'unverified',
      count: ledger.counts.unknownUnverified,
      tone: 'zinc',
      icon: HelpCircle,
    })
  }

  // Materialized examples — first 2 concrete `changedFields` paths from
  // the materialized entries. Truth-derived; never invented.
  const materializedExamples: string[] = []
  for (const entry of ledger.entries) {
    if (entry.state !== 'MATERIALIZED') continue
    for (const fc of entry.changedFields) {
      if (materializedExamples.length >= 2) break
      materializedExamples.push(fc.path)
    }
    if (materializedExamples.length >= 2) break
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-phase-w-causality={ledger.verdict.toLowerCase()}
      className={`mb-3 flex flex-col gap-2 rounded-md border px-3 py-2 max-w-full min-w-0 overflow-hidden ${containerToneClass}`}
    >
      {/* Verdict header row */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${iconToneClass}`} aria-hidden />
        <span className={`text-[12px] font-medium shrink-0 ${titleToneClass}`}>{meta.label}</span>
        <span className="text-[12px] text-[#A4ACB8] break-words [overflow-wrap:anywhere] min-w-0">
          {ledger.oneLineExplanation}
        </span>
      </div>

      {/* Per-bucket chip row — only buckets with count > 0 */}
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

      {/* Materialized examples — concrete deterministic paths only */}
      {materializedExamples.length > 0 && (
        <div className="text-[11px] text-[#6B7280] break-words [overflow-wrap:anywhere]">
          <span className="text-[#A4ACB8]">Examples: </span>
          <span className="font-mono">
            {materializedExamples.join(' \u00b7 ')}
          </span>
        </div>
      )}
    </div>
  )
}
