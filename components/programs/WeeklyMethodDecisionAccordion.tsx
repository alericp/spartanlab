/**
 * =============================================================================
 * WeeklyMethodDecisionAccordion.tsx
 * -----------------------------------------------------------------------------
 * AB6 — Top-level "Weekly Method Decisions" accordion.
 *
 * PURPOSE
 *   Wire the existing `weekly-method-decision-summary.ts` derivation into
 *   the visible Program page. The user previously had to expand every day
 *   card and scroll through scattered method copy to understand which
 *   training methods the AI coach used and which user-preferred methods
 *   were not used; this surface answers that question in ONE compact place,
 *   above the day cards.
 *
 * DOCTRINE
 *   - Source of truth: `program.weeklyMethodRepresentation` (the Phase 4J
 *     `WeeklyMethodRepresentationContract` set by
 *     `lib/server/authoritative-program-generation.ts`).
 *   - Derivation: `buildWeeklyMethodDecisionSummary` — pure function. We do
 *     NOT re-evaluate methods. We do NOT introduce a second selection engine.
 *   - When the underlying contract is missing (older saved programs), we
 *     render an honest fallback: "regenerate to produce method reasoning"
 *     instead of inventing fake AI explanation.
 *   - Dimensions the engine cannot truly evaluate (recovery, fatigue,
 *     progression-week, joint/tendon caution, dosage recompute, session-
 *     length tradeoff, exercise-compatibility recompute) are surfaced as
 *     "Not yet evaluated by current method decision layer" — never as
 *     "the AI considered it" filler.
 *   - No override mutation here. The AB5 add-on prompt explicitly forbids
 *     building a full override system in this step; we only describe
 *     override eligibility and tradeoff so the future override phase can
 *     read the same shape.
 *
 * UI BEHAVIOR
 *   - Renders as a single compact `<details>` block, collapsed by default,
 *     to match the visual idiom of `ProgramTrustAccordion` already on this
 *     page. No emojis, no new fonts, no new dependencies, no redesign.
 *   - Header summary always visible: "Methods used: 2  ·  Preferred not
 *     used: 1  ·  Not yet evaluated: 3" so the user gets the gist without
 *     opening it.
 *   - Expanded body renders three honest sections: Used / Preferred but
 *     not used / Engine gaps + not-yet-evaluated dimensions.
 *
 * NOT IMPLEMENTED HERE (deferred — see AB7)
 *   - Override action that mutates the program
 *   - Dosage / frequency / intensity recompute
 *   - Per-day method timeline
 * =============================================================================
 */

'use client'

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import {
  buildWeeklyMethodDecisionSummary,
  type WeeklyMethodDecisionSummary,
  type WeeklyMethodOverrideEligibility,
  type WeeklyMethodReasonCategory,
} from '@/lib/program/weekly-method-decision-summary'
import type {
  WeeklyMethodId,
  WeeklyMethodRepresentationContract,
} from '@/lib/program/weekly-method-representation'

// =============================================================================
// PROPS
// =============================================================================

interface WeeklyMethodDecisionAccordionProps {
  /**
   * The full program. We read `program.weeklyMethodRepresentation` off it
   * defensively — older saved programs may not carry this field, in which
   * case we render the missing-data fallback rather than crashing.
   */
  program: AdaptiveProgram | null | undefined
}

// =============================================================================
// SAFE EXTRACTOR
// =============================================================================

/**
 * Pull the WeeklyMethodRepresentationContract off the program object without
 * trusting its shape. Returns `null` when the field is missing or fails any
 * of the minimum-shape sanity checks. We do NOT validate every field — the
 * decision-summary derivation is already null-tolerant — we just guard
 * against `null` / `undefined` / wrong-type so the renderer cannot crash.
 */
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

/**
 * Human-readable method label. We intentionally do NOT include parenthetical
 * jargon; the user wanted concise coaching language. Falls back to a
 * lowercased + de-snake-cased version when an unknown method id appears.
 */
const METHOD_LABEL: Record<WeeklyMethodId, string> = {
  superset: 'Supersets',
  circuit: 'Circuits',
  density_block: 'Density blocks',
  cluster: 'Cluster sets',
  top_set_backoff: 'Top set + backoff',
  drop_set: 'Drop sets',
  rest_pause: 'Rest-pause',
  endurance_density: 'Endurance / conditioning blocks',
}

function methodLabel(id: WeeklyMethodId): string {
  return METHOD_LABEL[id] ?? String(id).replace(/_/g, ' ')
}

/**
 * Friendly reason-category label. Stays in plain coaching English — no
 * "scaffold", "contract", "rollup", "materializer" jargon for the
 * athlete-facing surface.
 */
const REASON_CATEGORY_LABEL: Record<WeeklyMethodReasonCategory, string> = {
  skill_quality_protection: 'Skill quality protection',
  strength_specificity: 'Strength specificity',
  goal_priority_mismatch: 'Goal priority mismatch',
  engine_gap_no_writer: 'Not yet supported by runtime',
  profile_did_not_request: 'Not selected in your profile',
  not_yet_evaluated: 'Not yet evaluated by current method decision layer',
}

const OVERRIDE_LABEL: Record<WeeklyMethodOverrideEligibility, string> = {
  safe_to_offer_with_tradeoff: 'Override possible (with tradeoff)',
  unsafe_to_offer: 'Override not recommended right now',
  engine_gap: 'Override not yet supported',
  not_yet_evaluated: 'Override not yet evaluated',
}

/** Color tag for the override-eligibility chip. We stay inside the existing
 * dark-theme palette already used elsewhere on the Program page (amber for
 * caution, emerald for safe, neutral grey for engine gap / unknown). */
function overrideChipClasses(elig: WeeklyMethodOverrideEligibility): string {
  switch (elig) {
    case 'safe_to_offer_with_tradeoff':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    case 'unsafe_to_offer':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    case 'engine_gap':
      return 'border-[#3A3A3A] bg-[#1A1A1A] text-[#8A8A8A]'
    case 'not_yet_evaluated':
    default:
      return 'border-[#3A3A3A] bg-[#1A1A1A] text-[#8A8A8A]'
  }
}

// =============================================================================
// SUB-SECTIONS
// =============================================================================

function MethodsUsedSection({
  summary,
}: {
  summary: WeeklyMethodDecisionSummary
}) {
  if (summary.methodsUsed.length === 0) {
    return (
      <div className="text-[12px] leading-relaxed text-[#8A8A8A]">
        No method-style structures were materialized this week. The plan
        used straight sets to protect skill quality and progression
        clarity.
      </div>
    )
  }
  return (
    <ul className="space-y-1.5">
      {summary.methodsUsed.map(entry => (
        <li
          key={entry.methodId}
          className="flex items-baseline justify-between gap-3 text-[12px] leading-relaxed text-[#C8C8C8]"
        >
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="font-medium text-[#E6E9EF]">
              {methodLabel(entry.methodId)}
            </span>
            {entry.isUserPreference && (
              <span className="shrink-0 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px text-[10px] font-medium text-emerald-400">
                preferred
              </span>
            )}
          </span>
          <span className="shrink-0 text-[11px] text-[#8A8A8A]">
            {entry.materializedCount}{' '}
            {entry.materializedCount === 1 ? 'block' : 'blocks'} this week
          </span>
        </li>
      ))}
    </ul>
  )
}

function PreferredButNotUsedSection({
  summary,
}: {
  summary: WeeklyMethodDecisionSummary
}) {
  if (summary.preferredButNotUsed.length === 0) {
    return (
      <div className="text-[12px] leading-relaxed text-[#8A8A8A]">
        Every method style you preferred was either used, or no method
        preferences were selected during onboarding.
      </div>
    )
  }
  return (
    <ul className="space-y-2.5">
      {summary.preferredButNotUsed.map(entry => (
        <li
          key={entry.methodId}
          className="rounded-md border border-[#2B313A] bg-[#0F1115] p-2.5"
        >
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-[12px] font-medium text-[#E6E9EF]">
              {methodLabel(entry.methodId)}
            </span>
            <span
              className={`shrink-0 rounded-sm border px-1.5 py-px text-[10px] font-medium ${overrideChipClasses(
                entry.overrideEligibility,
              )}`}
            >
              {OVERRIDE_LABEL[entry.overrideEligibility]}
            </span>
          </div>
          <div className="text-[11px] leading-relaxed text-[#A4ACB8] mb-1">
            <span className="text-[#8A8A8A]">Why not used:</span>{' '}
            {REASON_CATEGORY_LABEL[entry.reasonCategory]}
          </div>
          {/* Decision-layer reason text passes through verbatim. We never
              rewrite it — that would risk inventing reasoning. */}
          {entry.reason && (
            <div className="text-[11px] leading-relaxed text-[#A4ACB8] mb-1.5">
              {entry.reason}
            </div>
          )}
          <div className="text-[11px] leading-relaxed text-[#8A8A8A]">
            <span className="text-[#6B7280]">Tradeoff if forced:</span>{' '}
            {entry.overrideTradeoffNote}
          </div>
        </li>
      ))}
    </ul>
  )
}

function NotYetEvaluatedSection({
  summary,
}: {
  summary: WeeklyMethodDecisionSummary
}) {
  // Engine gaps come from real status entries — show those first because
  // they are concrete (a specific method has no row-level writer yet).
  const hasEngineGaps = summary.engineGaps.length > 0

  // Honest dimensions the decision layer has no producer for yet. We list
  // them flat so the user understands these are NOT silently considered.
  const notYetEvaluatedFlags: Array<{ key: string; label: string }> = []
  if (summary.notYetEvaluated.recoveryWindowReasoning) {
    notYetEvaluatedFlags.push({
      key: 'recovery',
      label: 'Recovery-window reasoning',
    })
  }
  if (summary.notYetEvaluated.fatigueLoadReasoning) {
    notYetEvaluatedFlags.push({
      key: 'fatigue',
      label: 'Fatigue-load reasoning',
    })
  }
  if (summary.notYetEvaluated.progressionWeekReasoning) {
    notYetEvaluatedFlags.push({
      key: 'progression',
      label: 'Progression-week reasoning',
    })
  }
  if (summary.notYetEvaluated.jointTendonCautionReasoning) {
    notYetEvaluatedFlags.push({
      key: 'joint',
      label: 'Joint / tendon caution reasoning',
    })
  }
  if (summary.notYetEvaluated.sessionLengthTradeoffReasoning) {
    notYetEvaluatedFlags.push({
      key: 'session-length',
      label: 'Session-length tradeoff reasoning',
    })
  }
  if (summary.notYetEvaluated.dosageRecompute) {
    notYetEvaluatedFlags.push({
      key: 'dosage',
      label: 'Override dosage recompute',
    })
  }
  if (summary.notYetEvaluated.exerciseCompatibilityRecompute) {
    notYetEvaluatedFlags.push({
      key: 'compat',
      label: 'Exercise-compatibility recompute',
    })
  }

  if (!hasEngineGaps && notYetEvaluatedFlags.length === 0) return null

  return (
    <div className="space-y-2.5">
      {hasEngineGaps && (
        <div>
          <div className="text-[11px] font-medium text-[#A4ACB8] mb-1.5">
            Method styles not yet supported in runtime
          </div>
          <ul className="space-y-1">
            {summary.engineGaps.map(gap => (
              <li
                key={gap.methodId}
                className="flex items-baseline gap-2 text-[11px] leading-relaxed text-[#8A8A8A]"
              >
                <span className="text-[#A4ACB8]">{methodLabel(gap.methodId)}:</span>
                <span>{gap.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {notYetEvaluatedFlags.length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-[#A4ACB8] mb-1.5">
            Dimensions not yet evaluated by current method decision layer
          </div>
          {/* We render these as a flex-wrapped chip strip rather than a
              dense paragraph so the user sees at a glance that these are
              honest gaps, not silent assumptions. */}
          <div className="flex flex-wrap gap-1.5">
            {notYetEvaluatedFlags.map(flag => (
              <span
                key={flag.key}
                className="rounded-sm border border-[#3A3A3A] bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] text-[#8A8A8A]"
              >
                {flag.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WeeklyMethodDecisionAccordion({
  program,
}: WeeklyMethodDecisionAccordionProps) {
  const representation = extractRepresentation(program)

  // Older saved programs do not carry the Phase 4J representation contract.
  // We render a graceful, honest fallback rather than fake reasoning.
  // Crucially: we DO render something so the user knows the surface
  // exists and just lacks data for this saved program — silently hiding
  // would leave them looking for it.
  if (!representation) {
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
          Regenerate to produce full method decision reasoning.
        </div>
      </details>
    )
  }

  const summary = buildWeeklyMethodDecisionSummary({
    representation,
    derivedFromMaterializationRollup: true,
  })

  if (!summary) return null

  // Header counts. We use these in the always-visible summary line so the
  // user gets the gist without expanding the accordion.
  const usedCount = summary.methodsUsed.length
  const preferredNotUsedCount = summary.preferredButNotUsed.length
  const engineGapCount = summary.engineGaps.length

  return (
    <details className="group rounded-lg border border-[#2B313A] bg-[#0F1115] mb-3">
      <summary className="flex items-center justify-between gap-3 cursor-pointer select-none px-3 py-2.5">
        <div className="flex items-baseline gap-3 min-w-0 flex-wrap">
          <span className="text-[12px] font-medium text-[#E6E9EF]">
            Weekly Method Decisions
          </span>
          {/* Compact always-visible summary — the user can read the gist
              without expanding. Each chip stays in the existing palette. */}
          <span className="text-[11px] text-[#A4ACB8]">
            <span className="text-emerald-400">{usedCount}</span> used
            <span className="mx-1.5 text-[#3A3A3A]">·</span>
            <span className={preferredNotUsedCount > 0 ? 'text-amber-400' : 'text-[#A4ACB8]'}>
              {preferredNotUsedCount}
            </span>{' '}
            preferred not used
            {engineGapCount > 0 && (
              <>
                <span className="mx-1.5 text-[#3A3A3A]">·</span>
                <span className="text-[#8A8A8A]">{engineGapCount} engine gap{engineGapCount === 1 ? '' : 's'}</span>
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

      <div className="px-3 pb-3 pt-1 space-y-4 border-t border-[#2B313A]/60">
        {/* Methods used */}
        <section>
          <h4 className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280] mb-2">
            Methods used this week
          </h4>
          <MethodsUsedSection summary={summary} />
        </section>

        {/* Preferred but not used */}
        <section>
          <h4 className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280] mb-2">
            Methods you prefer that were not used
          </h4>
          <PreferredButNotUsedSection summary={summary} />
        </section>

        {/* Honest gaps */}
        <section>
          <NotYetEvaluatedSection summary={summary} />
        </section>

        {/* Coaching footnote — explains the doctrine WITHOUT promising an
            override system that does not yet exist. */}
        <p className="text-[10px] leading-relaxed text-[#6B7280] pt-2 border-t border-[#2B313A]/40">
          The coach recommends the most optimal plan for your current
          profile, but you still own the program. A safe override path
          that recomputes dosage and rest is not yet built — when it
          ships, this surface will offer it where the override is marked
          possible.
        </p>
      </div>
    </details>
  )
}
