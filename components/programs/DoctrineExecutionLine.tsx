'use client'

/**
 * =============================================================================
 * [PHASE Y1 OF 3] DOCTRINE EXECUTION — COMPACT UI SURFACE
 * =============================================================================
 *
 * Reads `program.doctrineExecutionMatrix` (stamped by Phase Y1 in the
 * adaptive program builder) and renders:
 *
 *   - One collapsed-by-default <details> block titled "Doctrine Execution"
 *   - The one-line summary (X loaded • Y eligible • Z fired • N changed
 *     training • M explanation-only • K blocked/suppressed)
 *   - Expanded: small bundle table + compact RPE/density/pairing notes
 *
 * NON-NEGOTIABLES OBEYED
 * ----------------------
 *   - mounts INSIDE the existing ProgramTrustAccordion's evidence
 *     disclosure (no new clutter on the main Program page)
 *   - native <details> — no new dependency, no client state
 *   - fail-closed: returns null if matrix is missing
 *   - never claims doctrine quality based on raw rule count
 *   - never promotes DISPLAY_ONLY into MUTATED_PROGRAM
 * =============================================================================
 */

import {
  ChevronDown,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Ban,
  Eye,
  HelpCircle,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type {
  DoctrineExecutionMatrix,
  DoctrineBundleState,
  CausalUtilizationVerdict,
} from '@/lib/program/doctrine-execution-matrix-contract'

interface Props {
  program: AdaptiveProgram | null
}

/**
 * Verdict tone — honest mapping. STRONGLY_CAUSAL is the only emerald state.
 * MOSTLY_EXPLANATORY / OVER_SUPPRESSED are amber so the user can see when
 * doctrine loaded a lot but did not change much.
 */
const VERDICT_META: Record<
  CausalUtilizationVerdict,
  { label: string; tone: 'emerald' | 'zinc' | 'amber' | 'rose' }
> = {
  STRONGLY_CAUSAL: { label: 'Doctrine strongly changed your plan', tone: 'emerald' },
  PARTIALLY_CAUSAL: { label: 'Doctrine partially changed your plan', tone: 'zinc' },
  MOSTLY_EXPLANATORY: { label: 'Doctrine mostly explanatory', tone: 'amber' },
  OVER_SUPPRESSED: { label: 'Doctrine over-suppressed by safety/runtime', tone: 'amber' },
  INSUFFICIENT_PROOF: { label: 'Doctrine causality not proven yet', tone: 'zinc' },
  UNKNOWN: { label: 'Doctrine causality unknown', tone: 'zinc' },
}

const STATE_META: Record<
  DoctrineBundleState,
  { label: string; changed: boolean; tone: 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky' }
> = {
  MUTATED_PROGRAM: { label: 'changed training', changed: true, tone: 'emerald' },
  FIRED_NO_MUTATION: { label: 'fired, no change', changed: false, tone: 'zinc' },
  DISPLAY_ONLY: { label: 'explanation only', changed: false, tone: 'sky' },
  ELIGIBLE_NOT_FIRED: { label: 'eligible, not fired', changed: false, tone: 'zinc' },
  LOADED_NOT_ELIGIBLE: { label: 'not relevant', changed: false, tone: 'zinc' },
  NOT_LOADED: { label: 'not loaded', changed: false, tone: 'zinc' },
  SUPPRESSED_BY_SAFETY: { label: 'suppressed (safety)', changed: false, tone: 'amber' },
  BLOCKED_BY_RUNTIME: { label: 'blocked (runtime)', changed: false, tone: 'rose' },
  SHADOWED_BY_HIGHER_PRIORITY_RULE: { label: 'shadowed', changed: false, tone: 'amber' },
  UNKNOWN_OR_UNVERIFIED: { label: 'unverified', changed: false, tone: 'zinc' },
}

function chipClass(tone: 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky'): string {
  return tone === 'emerald'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    : tone === 'amber'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      : tone === 'rose'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
        : tone === 'sky'
          ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
          : 'border-[#2B313A] bg-[#1A1F26] text-[#A4ACB8]'
}

export function DoctrineExecutionLine({ program }: Props) {
  if (!program) return null
  const matrix = (program as unknown as { doctrineExecutionMatrix?: DoctrineExecutionMatrix })
    .doctrineExecutionMatrix
  if (!matrix || !matrix.summary) return null

  const verdictMeta = VERDICT_META[matrix.summary.causalUtilizationVerdict] ?? VERDICT_META.UNKNOWN

  const headerToneClass =
    verdictMeta.tone === 'emerald'
      ? 'text-emerald-200'
      : verdictMeta.tone === 'amber'
        ? 'text-amber-200'
        : 'text-[#E6E9EF]'

  const VerdictIcon =
    verdictMeta.tone === 'emerald'
      ? CheckCircle2
      : verdictMeta.tone === 'amber'
        ? AlertTriangle
        : verdictMeta.tone === 'rose'
          ? Ban
          : CircleDot

  // Non-zero compact chips for the level-1 line.
  const summaryChips: Array<{ label: string; count: number; tone: 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky'; icon: typeof CheckCircle2 }> = []
  if (matrix.summary.bundlesMutatedProgram > 0) {
    summaryChips.push({
      label: 'changed training',
      count: matrix.summary.bundlesMutatedProgram,
      tone: 'emerald',
      icon: CheckCircle2,
    })
  }
  if (matrix.summary.bundlesDisplayOnly > 0) {
    summaryChips.push({
      label: 'explanation only',
      count: matrix.summary.bundlesDisplayOnly,
      tone: 'sky',
      icon: Eye,
    })
  }
  if (matrix.summary.bundlesBlockedByRuntime > 0) {
    summaryChips.push({
      label: 'blocked',
      count: matrix.summary.bundlesBlockedByRuntime,
      tone: 'rose',
      icon: Ban,
    })
  }
  if (matrix.summary.bundlesSuppressedBySafety > 0) {
    summaryChips.push({
      label: 'suppressed',
      count: matrix.summary.bundlesSuppressedBySafety,
      tone: 'amber',
      icon: AlertTriangle,
    })
  }
  if (matrix.summary.bundlesUnknownOrUnverified > 0) {
    summaryChips.push({
      label: 'unverified',
      count: matrix.summary.bundlesUnknownOrUnverified,
      tone: 'zinc',
      icon: HelpCircle,
    })
  }

  // Notable pairing rows — surface only verdicts a coach should know about.
  const notablePairings = matrix.pairingTrace.rows.filter(
    r => r.verdict !== 'GOOD_PAIRING' || r.isSkinTheCatPlusC2BCheck,
  )

  return (
    <details
      className="group rounded-md border border-[#2B313A] bg-[#0F1115] mt-2"
      data-phase-y1-doctrine-execution={matrix.summary.causalUtilizationVerdict.toLowerCase()}
    >
      <summary
        className="flex items-center justify-between gap-2 cursor-pointer select-none px-3 py-2 min-w-0"
        aria-label="Toggle Doctrine Execution detail"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <VerdictIcon className={`w-3.5 h-3.5 shrink-0 ${headerToneClass}`} aria-hidden />
          <span className={`text-[12px] font-medium shrink-0 ${headerToneClass}`}>
            Doctrine Execution
          </span>
          <span className="text-[11px] text-[#A4ACB8] tabular-nums break-words [overflow-wrap:anywhere] min-w-0">
            {matrix.summary.oneLineExplanation}
          </span>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 text-[#A4ACB8] transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-t border-[#2B313A]/60 px-3 py-2 flex flex-col gap-3">
        {/* Verdict + summary chips */}
        <div className="flex flex-col gap-1.5">
          <div className={`text-[11px] font-medium ${headerToneClass}`}>
            Verdict: {verdictMeta.label}
          </div>
          {summaryChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {summaryChips.map(c => {
                const Icon = c.icon
                return (
                  <span
                    key={c.label}
                    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tabular-nums ${chipClass(c.tone)}`}
                  >
                    <Icon className="w-3 h-3 shrink-0" aria-hidden />
                    <span className="font-medium">{c.count}</span>
                    <span className="opacity-90">{c.label}</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Bundle table */}
        <div className="rounded border border-[#2B313A]/60 overflow-hidden">
          <table className="w-full text-[10.5px] tabular-nums">
            <thead className="bg-[#1A1F26] text-[#A4ACB8]">
              <tr>
                <th className="text-left font-medium px-2 py-1">Domain</th>
                <th className="text-left font-medium px-2 py-1">State</th>
                <th className="text-left font-medium px-2 py-1">Changed?</th>
                <th className="text-left font-medium px-2 py-1 hidden sm:table-cell">Reason / example</th>
              </tr>
            </thead>
            <tbody className="text-[#E6E9EF]">
              {matrix.bundles.map(b => {
                const meta = STATE_META[b.finalVerdict] ?? STATE_META.UNKNOWN_OR_UNVERIFIED
                return (
                  <tr key={b.id} className="border-t border-[#2B313A]/40 align-top">
                    <td className="px-2 py-1 break-words [overflow-wrap:anywhere]">{b.domain}</td>
                    <td className="px-2 py-1">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[9.5px] ${chipClass(meta.tone)}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      {meta.changed ? (
                        <span className="text-emerald-300">yes</span>
                      ) : (
                        <span className="text-[#A4ACB8]">no</span>
                      )}
                    </td>
                    <td className="px-2 py-1 hidden sm:table-cell text-[#A4ACB8] break-words [overflow-wrap:anywhere]">
                      {b.exampleAfter ?? b.blockedReason ?? b.suppressionReason ?? b.notes.slice(0, 90)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* RPE-7 trace */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-[#E6E9EF]">RPE-7 reason trace</div>
          <div className="text-[10.5px] text-[#A4ACB8] break-words [overflow-wrap:anywhere]">
            {matrix.rpeReasonTrace.notes}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['method_owned', 'method-owned'],
                ['tendon_safety_cap', 'tendon cap'],
                ['recovery_conservative', 'recovery'],
                ['support_day_intent', 'support day'],
                ['skill_quality_intent', 'skill quality'],
                ['protected_week_cap', 'week cap'],
                ['default_fallback', 'default fallback'],
                ['unknown_unexplained', 'unknown'],
              ] as const
            ).map(([k, label]) => {
              const n = matrix.rpeReasonTrace.counts[k]
              if (!n) return null
              const tone =
                k === 'default_fallback' || k === 'unknown_unexplained' ? 'amber' : 'zinc'
              return (
                <span
                  key={k}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tabular-nums ${chipClass(tone)}`}
                >
                  <span className="font-medium">{n}</span>
                  <span className="opacity-90">{label}</span>
                </span>
              )
            })}
          </div>
        </div>

        {/* Density trace */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-[#E6E9EF]">Density materialization</div>
          {matrix.densityTrace.rows.length === 0 ? (
            <div className="text-[10.5px] text-[#A4ACB8]">
              No density blocks claimed in this program.
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {matrix.densityTrace.rows.map((r, i) => {
                const tone =
                  r.verdict === 'DENSITY_MATERIALIZED'
                    ? 'emerald'
                    : r.verdict === 'DENSITY_BLOCKED_BY_RUNTIME'
                      ? 'rose'
                      : 'amber'
                return (
                  <li
                    key={`${r.blockId}-${i}`}
                    className="text-[10.5px] text-[#A4ACB8] break-words [overflow-wrap:anywhere]"
                  >
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-[9.5px] mr-1.5 ${chipClass(tone)}`}
                    >
                      D{r.day}
                    </span>
                    {r.exercises.join(' + ') || 'density block'} — {r.reason}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Pairing trace */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-medium text-[#E6E9EF]">
            Superset / pairing fatigue overlap
          </div>
          {notablePairings.length === 0 ? (
            <div className="text-[10.5px] text-[#A4ACB8]">
              {matrix.pairingTrace.rows.length === 0
                ? 'No supersets/circuits/density blocks in this program.'
                : 'All pairings score LOW overlap — no fatigue conflicts detected.'}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {notablePairings.slice(0, 6).map((r, i) => {
                const tone =
                  r.verdict === 'GOOD_PAIRING'
                    ? 'emerald'
                    : r.verdict === 'ACCEPTABLE_IF_LOW_VOLUME'
                      ? 'sky'
                      : r.verdict === 'NEEDS_REST_OR_REORDER'
                        ? 'amber'
                        : r.verdict === 'SHOULD_NOT_BE_SUPERSET'
                          ? 'rose'
                          : 'zinc'
                return (
                  <li
                    key={`${r.blockId}-${i}`}
                    className="text-[10.5px] text-[#A4ACB8] break-words [overflow-wrap:anywhere]"
                  >
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-[9.5px] mr-1.5 ${chipClass(tone)}`}
                    >
                      D{r.day}
                    </span>
                    <span className="text-[#E6E9EF]">{r.pairLabel}</span>
                    {r.isSkinTheCatPlusC2BCheck && (
                      <span className="ml-1.5 text-[9.5px] text-amber-300">
                        [Skin-the-Cat + C2B doctrine check]
                      </span>
                    )}
                    {' — '}
                    <span>
                      {r.verdict.replace(/_/g, ' ').toLowerCase()}: {r.reason}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {matrix.pairingTrace.skinTheCatPlusC2BFound &&
            !notablePairings.some(r => r.isSkinTheCatPlusC2BCheck) && (
              <div className="text-[10.5px] text-emerald-300">
                Skin-the-Cat + C2B Pull-Up checked — overlap acceptable in this program.
              </div>
            )}
        </div>
      </div>
    </details>
  )
}
