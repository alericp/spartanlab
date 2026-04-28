/**
 * =============================================================================
 * WeeklyMethodDecisionAccordion.tsx
 * -----------------------------------------------------------------------------
 * AB6 RECOVERY — DAY-BY-DAY AI COACH METHOD SUMMARY
 *
 * The previous version of this accordion only showed week-level counts
 * ("1 used · 0 preferred not used · 1 engine gap"), which the user could not
 * trust as a real coaching surface. This rebuild reads the new per-day
 * derivation (`buildPerWeekMethodCoachSummary`) and renders, inside a single
 * compact accordion, a Day 1 → Day N coach explanation:
 *
 *   1. A short "this week's strategy" intro paragraph.
 *   2. Per-day cards (one card per training day) showing:
 *        - Day number + label + role
 *        - Strategy line for the day
 *        - Methods USED with one-line "why used" reasoning
 *        - Methods NOT USED with one-line "why not used" reasoning
 *        - Override readiness + tradeoff per absent method
 *        - Compact influence chip (applied · blocked · runtime gap)
 *   3. A small "preferred but not honored this week" footer when relevant.
 *   4. An honest fallback when the underlying contract is missing.
 *
 * STRICT RULES
 *   - No new methods are decided here. We READ from session truth only.
 *   - Override action is NOT mutating anything — readiness is informative.
 *   - When the program is missing the Phase 4J representation, we still try
 *     to build the per-day summary directly from session method evidence;
 *     the user gets a real surface even on older saved programs.
 *   - All copy stays inside the existing dark-theme palette already in use
 *     elsewhere on the Program page. No emojis, no new fonts, no redesign.
 * =============================================================================
 */

'use client'

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import {
  buildPerWeekMethodCoachSummary,
  type DayMethodNotUsedEntry,
  type DayMethodUsedEntry,
  type DayOverrideEligibility,
  type PerDayMethodSummary,
  type PerWeekMethodCoachSummary,
} from '@/lib/program/per-day-method-summary'
import type { WeeklyMethodRepresentationContract } from '@/lib/program/weekly-method-representation'

// =============================================================================
// PROPS
// =============================================================================

interface WeeklyMethodDecisionAccordionProps {
  program: AdaptiveProgram | null | undefined
}

// =============================================================================
// SAFE EXTRACTOR
// =============================================================================

function extractRepresentation(
  program: AdaptiveProgram | null | undefined,
): WeeklyMethodRepresentationContract | null {
  if (!program) return null
  const raw = (program as unknown as {
    weeklyMethodRepresentation?: unknown
  }).weeklyMethodRepresentation
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<WeeklyMethodRepresentationContract>
  if (!Array.isArray(r.byMethod)) return null
  return r as WeeklyMethodRepresentationContract
}

// =============================================================================
// PRESENTATION HELPERS
// =============================================================================

const OVERRIDE_LABEL: Record<DayOverrideEligibility, string> = {
  safe_with_tradeoff: 'Override possible (with tradeoff)',
  unsafe_skill_protection: 'Override not recommended',
  unsafe_role_mismatch: 'Override not recommended for this day',
  engine_gap_no_writer: 'Override not yet supported',
  not_yet_evaluated: 'Override not yet evaluated',
}

function overrideChipClasses(elig: DayOverrideEligibility): string {
  switch (elig) {
    case 'safe_with_tradeoff':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    case 'unsafe_skill_protection':
    case 'unsafe_role_mismatch':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    case 'engine_gap_no_writer':
    case 'not_yet_evaluated':
    default:
      return 'border-[#3A3A3A] bg-[#1A1A1A] text-[#8A8A8A]'
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DayMethodsUsedRow({ entry }: { entry: DayMethodUsedEntry }) {
  return (
    <li className="text-[12px] leading-relaxed text-[#C8C8C8]">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-medium text-[#E6E9EF]">{entry.label}</span>
        <span className="text-[10px] text-[#8A8A8A]">
          {entry.count}{' '}
          {entry.count === 1 ? 'occurrence' : 'occurrences'}
        </span>
        {entry.isUserPreference && (
          <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px text-[10px] font-medium text-emerald-400">
            preferred
          </span>
        )}
      </div>
      <div className="text-[11px] leading-relaxed text-[#A4ACB8] mt-0.5">
        {entry.reason}
      </div>
    </li>
  )
}

function DayMethodsNotUsedRow({ entry }: { entry: DayMethodNotUsedEntry }) {
  return (
    <li className="text-[12px] leading-relaxed text-[#A4ACB8]">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-medium text-[#C8C8C8]">{entry.label}</span>
        {entry.isUserPreference && (
          <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-1.5 py-px text-[10px] font-medium text-amber-400">
            preferred
          </span>
        )}
        <span
          className={`rounded-sm border px-1.5 py-px text-[10px] font-medium ${overrideChipClasses(
            entry.overrideEligibility,
          )}`}
        >
          {OVERRIDE_LABEL[entry.overrideEligibility]}
        </span>
      </div>
      <div className="text-[11px] leading-relaxed text-[#A4ACB8] mt-0.5">
        {entry.reason}
      </div>
      <div className="text-[10px] leading-relaxed text-[#6B7280] mt-0.5">
        <span className="text-[#8A8A8A]">Tradeoff: </span>
        {entry.overrideTradeoff}
      </div>
    </li>
  )
}

function DayCard({ day }: { day: PerDayMethodSummary }) {
  // Highlight only the most relevant absent methods so the card stays
  // compact. Priority order: user-preferred not honored, then any methods
  // explicitly blocked by role/skill protection, then up to 3 others.
  const sortedNotUsed = [...day.methodsNotUsed].sort((a, b) => {
    const score = (e: DayMethodNotUsedEntry): number => {
      if (e.isUserPreference) return 0
      if (
        e.reasonCategory === 'role_skill_priority' ||
        e.reasonCategory === 'role_strength_priority' ||
        e.reasonCategory === 'role_recovery_or_light' ||
        e.reasonCategory === 'role_acclimation_week'
      ) return 1
      if (e.reasonCategory === 'engine_gap_no_writer') return 2
      return 3
    }
    return score(a) - score(b)
  })
  // Cap visible "not used" entries at 5 so a single day never dominates
  // the accordion. The user can still see all 8 if they need to.
  const VISIBLE_NOT_USED = 5
  const visibleNotUsed = sortedNotUsed.slice(0, VISIBLE_NOT_USED)
  const hiddenNotUsedCount = sortedNotUsed.length - visibleNotUsed.length

  return (
    <div className="rounded-md border border-[#2B313A] bg-[#0F1115] p-3">
      {/* Header: day number + role + influence chip */}
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
          <span className="text-[12px] font-semibold text-[#E6E9EF]">
            Day {day.dayNumber}
          </span>
          {day.dayLabel && (
            <span className="text-[11px] text-[#A4ACB8]">{day.dayLabel}</span>
          )}
          {day.roleLabel && (
            <span className="rounded-sm border border-[#3A3A3A] bg-[#1A1A1A] px-1.5 py-px text-[10px] text-[#A4ACB8]">
              {day.roleLabel}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] text-[#6B7280]">
          <span className="text-emerald-400">{day.influence.applied}</span> applied
          <span className="mx-1 text-[#3A3A3A]">·</span>
          <span className="text-amber-400">{day.influence.blocked}</span> blocked
          {day.influence.runtimeGap > 0 && (
            <>
              <span className="mx-1 text-[#3A3A3A]">·</span>
              <span className="text-[#8A8A8A]">{day.influence.runtimeGap}</span> runtime
              gap
            </>
          )}
        </span>
      </div>

      {/* Strategy: 1-2 sentence "why this day looks the way it does" */}
      <p className="text-[11px] leading-relaxed text-[#A4ACB8] mb-2.5">
        {day.strategy}
      </p>

      {/* Methods used today */}
      {day.methodsUsed.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280] mb-1.5">
            Used
          </div>
          <ul className="space-y-1.5">
            {day.methodsUsed.map(entry => (
              <DayMethodsUsedRow key={entry.methodId} entry={entry} />
            ))}
          </ul>
        </div>
      )}

      {/* Methods NOT used today (with reasons + override readiness) */}
      {visibleNotUsed.length > 0 && (
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280] mb-1.5">
            Not used
          </div>
          <ul className="space-y-2">
            {visibleNotUsed.map(entry => (
              <DayMethodsNotUsedRow key={entry.methodId} entry={entry} />
            ))}
          </ul>
          {hiddenNotUsedCount > 0 && (
            <div className="text-[10px] text-[#6B7280] mt-1.5">
              + {hiddenNotUsedCount} more methods absent for similar reasons.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HEADER COUNTS
// =============================================================================

function summaryHeaderCounts(summary: PerWeekMethodCoachSummary): {
  usedCount: number
  daysWithMethods: number
  preferredNotHonoredCount: number
  runtimeGapCount: number
} {
  const runtimeGapMethods = new Set<string>()
  for (const d of summary.days) {
    for (const m of d.methodsNotUsed) {
      if (m.reasonCategory === 'engine_gap_no_writer') runtimeGapMethods.add(m.methodId)
    }
  }
  return {
    usedCount: summary.totals.methodsUsedAcrossWeek.length,
    daysWithMethods: summary.totals.daysWithAnyMethod,
    preferredNotHonoredCount: summary.totals.preferredNeverHonored.length,
    runtimeGapCount: runtimeGapMethods.size,
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WeeklyMethodDecisionAccordion({
  program,
}: WeeklyMethodDecisionAccordionProps) {
  const representation = extractRepresentation(program)
  const summary = buildPerWeekMethodCoachSummary({
    program,
    representation,
  })

  // Hard fallback — program is missing or has no sessions.
  if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0 || !summary) {
    return (
      <details className="group rounded-lg border border-[#2B313A] bg-[#0F1115] mb-3">
        <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-3 py-2.5 text-[12px] font-medium text-[#E6E9EF]">
          <span className="flex items-center gap-2">
            <span>Weekly Method Decisions</span>
            <span className="rounded-sm border border-[#3A3A3A] bg-[#1A1A1A] px-1.5 py-px text-[10px] font-medium text-[#8A8A8A]">
              not available
            </span>
          </span>
          <span className="text-[10px] text-[#6B7280] group-open:hidden">expand</span>
          <span className="text-[10px] text-[#6B7280] hidden group-open:inline">collapse</span>
        </summary>
        <div className="px-3 pb-3 pt-1 text-[11px] leading-relaxed text-[#A4ACB8]">
          Method reasoning is not available for this saved program yet.
          Regenerate to produce a full day-by-day method explanation.
        </div>
      </details>
    )
  }

  const { usedCount, daysWithMethods, preferredNotHonoredCount, runtimeGapCount } =
    summaryHeaderCounts(summary)
  const totalDays = summary.days.length

  return (
    <details className="group rounded-lg border border-[#2B313A] bg-[#0F1115] mb-3">
      <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-3 py-2.5">
        <div className="flex items-baseline gap-3 min-w-0 flex-wrap">
          <span className="text-[12px] font-medium text-[#E6E9EF]">
            Weekly Method Decisions
          </span>
          <span className="text-[11px] text-[#A4ACB8]">
            <span className="text-emerald-400">{usedCount}</span> method
            {usedCount === 1 ? '' : 's'} this week
            <span className="mx-1.5 text-[#3A3A3A]">·</span>
            <span className="text-[#A4ACB8]">
              {daysWithMethods}/{totalDays}
            </span>{' '}
            day{totalDays === 1 ? '' : 's'} with overlays
            {preferredNotHonoredCount > 0 && (
              <>
                <span className="mx-1.5 text-[#3A3A3A]">·</span>
                <span className="text-amber-400">{preferredNotHonoredCount}</span> preferred
                not used
              </>
            )}
            {runtimeGapCount > 0 && (
              <>
                <span className="mx-1.5 text-[#3A3A3A]">·</span>
                <span className="text-[#8A8A8A]">
                  {runtimeGapCount} runtime gap{runtimeGapCount === 1 ? '' : 's'}
                </span>
              </>
            )}
          </span>
        </div>
        <span className="text-[10px] text-[#6B7280] shrink-0 group-open:hidden">
          expand
        </span>
        <span className="text-[10px] text-[#6B7280] shrink-0 hidden group-open:inline">
          collapse
        </span>
      </summary>

      <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[#2B313A]/60">
        {/* This week's strategy intro */}
        <section>
          <h4 className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280] mb-1.5">
            This week&apos;s method strategy
          </h4>
          <p className="text-[12px] leading-relaxed text-[#C8C8C8]">
            {summary.weekStrategy}
          </p>
        </section>

        {/* Day-by-day breakdown */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280]">
            Day-by-day method reasoning
          </h4>
          <div className="space-y-2">
            {summary.days.map(day => (
              <DayCard key={day.dayNumber} day={day} />
            ))}
          </div>
        </section>

        {/* Preferred-but-never-honored footer (week-level) */}
        {summary.totals.preferredNeverHonored.length > 0 && (
          <section className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">
            <div className="text-[11px] font-medium text-amber-400 mb-1">
              Preferred styles not used this week
            </div>
            <p className="text-[11px] leading-relaxed text-[#A4ACB8]">
              {summary.totals.preferredNeverHonored
                .map(m => m.replace(/_/g, ' '))
                .join(', ')}
              . The per-day breakdown above shows why each day did not earn
              these styles, and which days have a safe override path with a
              dosage tradeoff.
            </p>
          </section>
        )}

        {/* Coaching footnote — explains the doctrine WITHOUT promising an
            override system that does not yet exist. */}
        <p className="text-[10px] leading-relaxed text-[#6B7280] pt-2 border-t border-[#2B313A]/40">
          The coach recommends the most optimal plan for your current
          profile, but you still own the program. Override-with-dosage-recompute
          is not yet built — when it ships, the days marked &quot;Override
          possible&quot; will offer it, with the safer days going first.
        </p>
      </div>
    </details>
  )
}
