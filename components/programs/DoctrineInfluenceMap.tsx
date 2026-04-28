'use client'

/**
 * =============================================================================
 * [PHASE Z2] DOCTRINE INFLUENCE MAP — compact owner/dev proof surface
 * =============================================================================
 *
 * Renders the `DoctrineInfluenceMap` produced by
 * `lib/program/doctrine-influence-map.ts` as a compact, accordion-friendly
 * panel. Designed to live inside the Phase X "View full AI evidence"
 * disclosure on the Program page, not on the main page chrome.
 *
 * GUARANTEES
 *   - Zero side effects, zero state beyond local <details> toggles.
 *   - Native HTML disclosure — no animation library.
 *   - Returns null when the program is missing.
 *   - Never claims more than the underlying audit proves.
 * =============================================================================
 */

import {
  CheckCircle2,
  AlertTriangle,
  Ban,
  CircleDot,
  HelpCircle,
  Layers,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import {
  buildDoctrineInfluenceMap,
  type DoctrineInfluenceMap,
  type InfluenceLevel,
} from '@/lib/program/doctrine-influence-map'

interface Props {
  program: AdaptiveProgram | null
}

const VERDICT_TONE: Record<DoctrineInfluenceMap['verdict'], { label: string; tone: 'emerald' | 'zinc' | 'amber' }> = {
  PASS: { label: 'Doctrine active', tone: 'emerald' },
  PARTIAL: { label: 'Doctrine partial', tone: 'zinc' },
  FAIL: { label: 'Doctrine weak', tone: 'amber' },
}

const INFLUENCE_TONE: Record<InfluenceLevel, string> = {
  HIGH: 'text-emerald-300',
  MODERATE: 'text-zinc-300',
  LOW: 'text-amber-300',
  NO_TARGET: 'text-sky-300',
  BROKEN: 'text-rose-300',
}

function pct(num: number, den: number): string {
  if (den <= 0) return '0%'
  return `${Math.round((num / den) * 100)}%`
}

function StatusBadge({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky'
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : tone === 'amber'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : tone === 'rose'
          ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          : tone === 'sky'
            ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
            : 'border-[#2B313A] bg-[#1A1F26] text-[#A4ACB8]'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tabular-nums ${cls}`}
    >
      <span className="font-medium">{count}</span>
      <span className="opacity-90">{label}</span>
    </span>
  )
}

export function DoctrineInfluenceMap({ program }: Props) {
  if (!program) return null
  const map = buildDoctrineInfluenceMap(program)
  const tone = VERDICT_TONE[map.verdict]

  // [PHASE AA1] Read the weekly method materialization plan stamped by the
  // authoritative generation pipeline. The plan is a JSON-safe summary of
  // user-preferred vs doctrine-earned methods + per-day assignments. We
  // render a compact disclosure inside the existing Influence Map panel so
  // the user can answer "which of my picked methods materialized, and on
  // which days?" without any new UI surface or chrome on the Program page.
  // Fail-closed when the plan is absent (legacy programs predating Phase
  // AA1 stamping).
  const matPlan = (program as unknown as {
    weeklyMethodMaterializationPlan?: {
      userPreferredMethods?: string[]
      doctrineEarnedMethods?: string[]
      byMethod?: Array<{
        method: string
        userPreferred: boolean
        doctrineEarned: boolean
        budgetVerdict: string
        materializedDays: number[]
        noSafeTargetDays: number[]
        reason: string
      }>
      dayAssignments?: Array<{
        dayNumber: number
        dayLabel: string | null
        appliedMethods: string[]
        blockedMethods: Array<{ method: string; reason: string }>
        primarySpine: string
      }>
      totals?: {
        sessionsConsidered: number
        sessionsWithAppliedMethod: number
        methodsUserPickedAndApplied: number
        methodsUserPickedNotApplied: number
        methodsDoctrineEarnedAndApplied: number
      }
      oneLineExplanation?: string
    } | null
  }).weeklyMethodMaterializationPlan ?? null

  // Status totals as compact chip strip — only non-zero buckets.
  const totalChips: Array<{ label: string; count: number; tone: 'emerald' | 'zinc' | 'amber' | 'rose' | 'sky' }> = []
  if (map.statusTotals.MATERIALIZED > 0)
    totalChips.push({ label: 'materialized', count: map.statusTotals.MATERIALIZED, tone: 'emerald' })
  if (map.statusTotals.APPLIED - map.statusTotals.MATERIALIZED > 0)
    totalChips.push({
      label: 'applied (no change)',
      count: map.statusTotals.APPLIED - map.statusTotals.MATERIALIZED,
      tone: 'zinc',
    })
  if (map.statusTotals.SUPPRESSED > 0)
    totalChips.push({ label: 'suppressed', count: map.statusTotals.SUPPRESSED, tone: 'amber' })
  if (map.statusTotals.BLOCKED > 0)
    totalChips.push({ label: 'blocked', count: map.statusTotals.BLOCKED, tone: 'rose' })
  if (map.statusTotals.NO_TARGET > 0)
    totalChips.push({ label: 'no target', count: map.statusTotals.NO_TARGET, tone: 'sky' })
  if (map.statusTotals.LOW_INFLUENCE > 0)
    totalChips.push({ label: 'low-influence', count: map.statusTotals.LOW_INFLUENCE, tone: 'sky' })
  if (map.statusTotals.ERROR_OR_UNMAPPED > 0)
    totalChips.push({ label: 'unmapped', count: map.statusTotals.ERROR_OR_UNMAPPED, tone: 'rose' })

  const containerCls =
    tone.tone === 'emerald'
      ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
      : tone.tone === 'amber'
        ? 'border-amber-500/25 bg-amber-500/[0.05]'
        : 'border-[#2B313A] bg-[#0F1115]'

  return (
    <div
      role="region"
      aria-label="Doctrine influence map"
      data-phase-z2-influence-map={map.verdict.toLowerCase()}
      className={`mt-2 rounded-md border ${containerCls} max-w-full min-w-0 overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-2 border-b border-[#2B313A]/60">
        <Layers className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#A4ACB8]" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12px] font-medium text-[#E6E9EF]">Doctrine influence map</span>
            <span
              className={`text-[10px] uppercase tracking-wide ${
                tone.tone === 'emerald'
                  ? 'text-emerald-300'
                  : tone.tone === 'amber'
                    ? 'text-amber-300'
                    : 'text-[#A4ACB8]'
              }`}
            >
              {tone.label} · {map.verdict}
            </span>
          </div>
          <p className="text-[11px] text-[#A4ACB8] mt-0.5 break-words [overflow-wrap:anywhere]">
            {map.oneLine}
          </p>
          <p className="text-[10px] text-[#7A828F] mt-0.5">
            {map.statusTotals.LOADED.toLocaleString()} atoms loaded across {map.byBatch.length} batches ·{' '}
            {map.statusTotals.EVALUATED} evaluated · {map.statusTotals.MATERIALIZED} materialized
          </p>
        </div>
      </div>

      {/* Status totals chip strip */}
      {totalChips.length > 0 && (
        <div className="px-3 py-2 border-b border-[#2B313A]/60 flex flex-wrap gap-1.5">
          {totalChips.map(c => (
            <StatusBadge key={c.label} label={c.label} count={c.count} tone={c.tone} />
          ))}
        </div>
      )}

      {/* Similarity diagnosis */}
      <div className="px-3 py-2 border-b border-[#2B313A]/60">
        <div className="text-[10px] font-medium text-[#A4ACB8] uppercase tracking-wide mb-1">
          Why the program looks the way it does
        </div>
        <p className="text-[11px] text-[#E6E9EF] break-words [overflow-wrap:anywhere]">
          {map.similarityDiagnosis.oneLine}
        </p>
        {map.similarityDiagnosis.evidence.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {map.similarityDiagnosis.evidence.slice(0, 4).map((ev, i) => (
              <li key={i} className="text-[10px] text-[#7A828F] break-words [overflow-wrap:anywhere]">
                · {ev}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Per-batch table */}
      <details className="group border-b border-[#2B313A]/60">
        <summary className="cursor-pointer select-none px-3 py-2 text-[11px] text-[#A4ACB8] hover:text-[#E6E9EF]">
          Batch coverage ({map.byBatch.length} batches)
        </summary>
        <div className="px-3 pb-3 pt-1 overflow-x-auto">
          <table className="w-full text-[10px] tabular-nums">
            <thead className="text-[#7A828F]">
              <tr className="text-left">
                <th className="font-medium pr-2">Batch</th>
                <th className="font-medium pr-2">Loaded</th>
                <th className="font-medium pr-2">Src</th>
                <th className="font-medium pr-2">Eval</th>
                <th className="font-medium pr-2">Appl</th>
                <th className="font-medium pr-2">Mat'l</th>
                <th className="font-medium pr-2">Blkd</th>
                <th className="font-medium pr-2">No&nbsp;tgt</th>
                <th className="font-medium pr-2">Influence</th>
              </tr>
            </thead>
            <tbody>
              {map.byBatch.map(b => (
                <tr key={b.batch} className="border-t border-[#1A1F26]">
                  <td className="pr-2 py-1 text-[#E6E9EF]">{b.batch}</td>
                  <td className="pr-2 text-[#E6E9EF]">{b.loaded}</td>
                  <td className="pr-2 text-[#7A828F]">{b.source}</td>
                  <td className="pr-2 text-[#A4ACB8]">{b.evaluated}</td>
                  <td className="pr-2 text-[#A4ACB8]">{b.applied}</td>
                  <td className="pr-2 text-emerald-300">{b.materialized}</td>
                  <td className="pr-2 text-rose-300/80">{b.blocked}</td>
                  <td className="pr-2 text-sky-300/80">{b.noTarget}</td>
                  <td className={`pr-2 ${INFLUENCE_TONE[b.influence]}`}>{b.influence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Per-domain table */}
      <details className="group border-b border-[#2B313A]/60">
        <summary className="cursor-pointer select-none px-3 py-2 text-[11px] text-[#A4ACB8] hover:text-[#E6E9EF]">
          Domain coverage ({map.byDomain.length} domains)
        </summary>
        <div className="px-3 pb-3 pt-1 overflow-x-auto">
          <table className="w-full text-[10px] tabular-nums">
            <thead className="text-[#7A828F]">
              <tr className="text-left">
                <th className="font-medium pr-2">Domain</th>
                <th className="font-medium pr-2">Loaded</th>
                <th className="font-medium pr-2">Eval</th>
                <th className="font-medium pr-2">Appl</th>
                <th className="font-medium pr-2">Mat'l</th>
                <th className="font-medium pr-2">Vis</th>
                <th className="font-medium pr-2">Supp</th>
                <th className="font-medium pr-2">Blkd</th>
                <th className="font-medium pr-2">Influence</th>
              </tr>
            </thead>
            <tbody>
              {map.byDomain.map(d => (
                <tr key={d.domain} className="border-t border-[#1A1F26]">
                  <td className="pr-2 py-1 text-[#E6E9EF]">{d.domain}</td>
                  <td className="pr-2 text-[#E6E9EF]">{d.loaded}</td>
                  <td className="pr-2 text-[#A4ACB8]">{d.evaluated}</td>
                  <td className="pr-2 text-[#A4ACB8]">{d.applied}</td>
                  <td className="pr-2 text-emerald-300">{d.materialized}</td>
                  <td className="pr-2 text-emerald-200/80">{d.visible}</td>
                  <td className="pr-2 text-amber-300/80">{d.suppressed}</td>
                  <td className="pr-2 text-rose-300/80">{d.blocked}</td>
                  <td className={`pr-2 ${INFLUENCE_TONE[d.influence]}`}>{d.influence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Samples */}
      <details className="group border-b border-[#2B313A]/60">
        <summary className="cursor-pointer select-none px-3 py-2 text-[11px] text-[#A4ACB8] hover:text-[#E6E9EF]">
          Materialization samples
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-2">
          <SampleSection
            title="Applied / materialized"
            icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden />}
            samples={map.samplesApplied}
            empty="No applied/materialized samples in the Phase W ledger."
          />
          <SampleSection
            title="Suppressed / blocked"
            icon={<Ban className="w-3 h-3 text-rose-400" aria-hidden />}
            samples={map.samplesSuppressed}
            empty="No suppressed or blocked rules detected."
          />
          <SampleSection
            title="No target"
            icon={<CircleDot className="w-3 h-3 text-sky-400" aria-hidden />}
            samples={map.samplesNoTarget}
            empty="All evaluated rules had a target."
          />
        </div>
      </details>

      {/* Diagnostics: RPE, density, methods, skills */}
      <div className="px-3 py-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <DiagBox
          title="RPE 7 vs 8"
          oneLine={map.rpeAnalysis.oneLine}
          extra={
            map.rpeAnalysis.totalExercises > 0
              ? `RPE 7: ${map.rpeAnalysis.rpe7Count} (${pct(map.rpeAnalysis.rpe7Count, map.rpeAnalysis.totalExercises)}) · RPE 8: ${map.rpeAnalysis.rpe8Count} (${pct(map.rpeAnalysis.rpe8Count, map.rpeAnalysis.totalExercises)}) · gates: ${map.rpeAnalysis.intensityGates.length}`
              : null
          }
          tone={
            map.rpeAnalysis.verdict === 'RPE7_LEGITIMATE' || map.rpeAnalysis.verdict === 'MIXED' || map.rpeAnalysis.verdict === 'RPE8_DOMINANT'
              ? 'emerald'
              : map.rpeAnalysis.verdict === 'RPE7_OVERUSED'
                ? 'amber'
                : 'zinc'
          }
        />
        <DiagBox
          title="Density truth"
          oneLine={map.densityAnalysis.oneLine}
          extra={`density_block: ${map.densityAnalysis.densityBlockStatus} · endurance_density: ${map.densityAnalysis.enduranceDensityStatus}`}
          tone={
            map.densityAnalysis.verdict === 'OPERATIONAL'
              ? 'emerald'
              : map.densityAnalysis.verdict === 'BLOCKED' || map.densityAnalysis.verdict === 'LABEL_ONLY'
                ? 'amber'
                : 'zinc'
          }
        />
        <DiagBox
          title="Method budget"
          oneLine={map.methodBudgetAnalysis.oneLine}
          extra={
            map.methodBudgetAnalysis.perMethod
              .slice(0, 6)
              .map(m => `${m.method}:${m.status === 'APPLIED' ? '✓' : m.status === 'BLOCKED_BY_SAFETY' ? '✗' : m.status === 'NOT_NEEDED_FOR_PROFILE' ? '–' : '?'}`)
              .join('  ')
          }
          tone={map.methodBudgetAnalysis.totalApplied > 0 ? 'emerald' : 'zinc'}
        />
        <DiagBox
          title="Skill coverage"
          oneLine={map.skillCoverageAnalysis.oneLine}
          extra={
            map.skillCoverageAnalysis.perSkill
              .slice(0, 6)
              .map(s => `${s.skill}: ${s.directCount}d/${s.carryoverCount}c`)
              .join('  ')
          }
          tone={
            map.skillCoverageAnalysis.expressedCount === map.skillCoverageAnalysis.selectedSkills.length
              ? 'emerald'
              : map.skillCoverageAnalysis.expressedCount > 0
                ? 'zinc'
                : 'amber'
          }
        />
      </div>

      {/*
        [PHASE AA1] Method preferences vs reality — disclosure-only.
        Renders only when the program carries a weeklyMethodMaterializationPlan
        stamp. Lives inside the same Trust Accordion details surface so it
        never clutters the main Program page.
      */}
      {matPlan && (
        <details className="group border-t border-[#2B313A]/60">
          <summary className="cursor-pointer select-none px-3 py-2 text-[11px] text-[#A4ACB8] hover:text-[#E6E9EF]">
            Method preferences vs reality
            {matPlan.totals && (
              <span className="ml-1.5 text-[10px] text-[#7A828F]">
                ({matPlan.totals.methodsUserPickedAndApplied} applied
                {matPlan.totals.methodsUserPickedNotApplied > 0
                  ? ` · ${matPlan.totals.methodsUserPickedNotApplied} not applied`
                  : ''}
                )
              </span>
            )}
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-2">
            {matPlan.oneLineExplanation && (
              <p className="text-[11px] text-[#E6E9EF] break-words [overflow-wrap:anywhere]">
                {matPlan.oneLineExplanation}
              </p>
            )}

            {/* Per-method table */}
            {Array.isArray(matPlan.byMethod) && matPlan.byMethod.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] tabular-nums">
                  <thead className="text-[#7A828F]">
                    <tr className="text-left">
                      <th className="font-medium pr-2">Method</th>
                      <th className="font-medium pr-2">Source</th>
                      <th className="font-medium pr-2">Verdict</th>
                      <th className="font-medium pr-2">Days&nbsp;applied</th>
                      <th className="font-medium pr-2">No&nbsp;target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matPlan.byMethod
                      // Surface user-preferred + doctrine-earned + actually-
                      // applied first; hide rows that are nothing-relevant.
                      .filter(
                        m =>
                          m.userPreferred ||
                          m.doctrineEarned ||
                          m.materializedDays.length > 0 ||
                          m.noSafeTargetDays.length > 0,
                      )
                      .map(m => {
                        const sourceLabel = m.userPreferred && m.doctrineEarned
                          ? 'pick + doctrine'
                          : m.userPreferred
                            ? 'your pick'
                            : m.doctrineEarned
                              ? 'doctrine'
                              : ''
                        const verdictTone =
                          m.materializedDays.length > 0
                            ? 'text-emerald-300'
                            : m.budgetVerdict === 'BLOCKED_BY_SAFETY'
                              ? 'text-rose-300'
                              : m.budgetVerdict === 'NO_SAFE_TARGET'
                                ? 'text-amber-300'
                                : 'text-[#A4ACB8]'
                        return (
                          <tr key={m.method} className="border-t border-[#1A1F26]">
                            <td className="pr-2 py-1 text-[#E6E9EF]">{m.method.replace(/_/g, ' ')}</td>
                            <td className="pr-2 text-[#A4ACB8]">{sourceLabel || '—'}</td>
                            <td className={`pr-2 ${verdictTone}`}>{m.budgetVerdict}</td>
                            <td className="pr-2 text-emerald-300">
                              {m.materializedDays.length > 0 ? m.materializedDays.join(', ') : '—'}
                            </td>
                            <td className="pr-2 text-amber-300/80">
                              {m.noSafeTargetDays.length > 0 ? m.noSafeTargetDays.join(', ') : '—'}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Per-day assignments — only days with applied or blocked methods */}
            {Array.isArray(matPlan.dayAssignments) && matPlan.dayAssignments.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-[#A4ACB8] uppercase tracking-wide mt-1">
                  Per-day method spine
                </div>
                <ul className="space-y-1">
                  {matPlan.dayAssignments.map(d => (
                    <li
                      key={d.dayNumber}
                      className="text-[10px] text-[#A4ACB8] break-words [overflow-wrap:anywhere]"
                    >
                      <span className="text-[#E6E9EF]">Day {d.dayNumber}</span>
                      {d.dayLabel && <span className="text-[#7A828F]"> · {d.dayLabel}</span>}
                      <span className="text-[#7A828F]"> · {d.primarySpine}</span>
                      {d.blockedMethods.length > 0 && (
                        <ul className="mt-0.5 ml-3">
                          {d.blockedMethods.map((b, i) => (
                            <li
                              key={`${d.dayNumber}-${b.method}-${i}`}
                              className="text-[10px] text-amber-300/70"
                            >
                              · {b.method.replace(/_/g, ' ')}: {b.reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

function SampleSection({
  title,
  icon,
  samples,
  empty,
}: {
  title: string
  icon: React.ReactNode
  samples: DoctrineInfluenceMap['samplesApplied']
  empty: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-medium text-[#A4ACB8] uppercase tracking-wide">{title}</span>
      </div>
      {samples.length === 0 ? (
        <p className="text-[10px] text-[#7A828F] pl-4">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {samples.map((s, i) => (
            <li
              key={`${s.ruleId}-${i}`}
              className="text-[10px] text-[#A4ACB8] pl-4 break-words [overflow-wrap:anywhere]"
            >
              <span className="text-[#E6E9EF] font-medium">{s.ruleName || s.ruleId}</span>
              <span className="text-[#7A828F]"> · {s.category} · {s.status}</span>
              {s.affects.length > 0 && (
                <span className="text-[#7A828F]"> · {s.affects.slice(0, 3).join(', ')}</span>
              )}
              <div className="text-[#7A828F]">{s.effectOrReason}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DiagBox({
  title,
  oneLine,
  extra,
  tone,
}: {
  title: string
  oneLine: string
  extra?: string | null
  tone: 'emerald' | 'amber' | 'zinc'
}) {
  const titleTone =
    tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : 'text-[#A4ACB8]'
  const Icon = tone === 'emerald' ? CheckCircle2 : tone === 'amber' ? AlertTriangle : HelpCircle
  return (
    <div className="rounded border border-[#2B313A] bg-[#0B0E12] p-2 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${titleTone}`} aria-hidden />
        <span className={`text-[10px] uppercase tracking-wide font-medium ${titleTone}`}>{title}</span>
      </div>
      <p className="text-[11px] text-[#E6E9EF] break-words [overflow-wrap:anywhere]">{oneLine}</p>
      {extra && (
        <p className="text-[10px] text-[#7A828F] mt-1 break-words [overflow-wrap:anywhere]">{extra}</p>
      )}
    </div>
  )
}
