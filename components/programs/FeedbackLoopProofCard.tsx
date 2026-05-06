'use client'

// =============================================================================
// [AB11-5] FEEDBACK LOOP PROOF CARD — VISIBLE EVIDENCE → DECISION PROOF
// =============================================================================
//
// Compact, source-truth-only Program-page surface that renders a typed
// `ProgramEvidenceFeedbackSummary` as max-3 athlete-facing proof lines.
//
// CONTRACTS:
//   - Reads ONLY the typed summary produced by
//     `lib/program/program-evidence-feedback-loop.ts`. There is no parallel
//     UI-side reconstruction of "what evidence was used".
//   - Never invents claims. When the summary is null OR has zero benchmark
//     and zero workout signals, the card renders the honest no-evidence
//     baseline copy and is visually quiet (no error tone).
//   - Honest "considered / no change" state when evidence exists but the
//     bounded engine decided not to alter the prescription.
//   - No raw IDs, no JSON dumps, no debug data, no marketing language.
// =============================================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Activity, Sparkles, Info } from 'lucide-react'
import type {
  ProgramEvidenceDomain,
  ProgramEvidenceFeedbackSummary,
} from '@/lib/program/program-evidence-feedback-loop'
// [AB12-1] Optional bounded calibration plan. When supplied, the card
// renders a compact label + chip strip ABOVE the AB11-5 proof body so
// the user sees not just "what evidence was used" but also "what the
// program is currently calibrated to". The plan derives from the same
// AB11 inputs the card already trusts, so it cannot drift.
import type { ProgramEvidenceCalibrationPlan } from '@/lib/program/evidence-aware-program-calibration-governor'

interface FeedbackLoopProofCardProps {
  /** Benchmark/calibration-only summary, optional. */
  benchmarkSummary?: ProgramEvidenceFeedbackSummary | null
  /** Workout-evidence-only summary, optional. */
  workoutSummary?: ProgramEvidenceFeedbackSummary | null
  /**
   * Combined summary, optional. When supplied this takes precedence over
   * the per-side summaries and is rendered directly. When omitted, the
   * card derives display state from whichever per-side summaries are
   * non-null.
   */
  mergedSummary?: ProgramEvidenceFeedbackSummary | null
  /**
   * [AB12-1] Optional calibration plan from the evidence-aware governor.
   * When present and `status !== 'not_applicable'`, a small label + chip
   * strip is rendered. When `null`/absent OR `'not_applicable'`, the
   * card omits the strip silently.
   */
  calibrationPlan?: ProgramEvidenceCalibrationPlan | null
  className?: string
}

const DOMAIN_LABEL: Record<ProgramEvidenceDomain, string> = {
  skill: 'skill',
  strength: 'strength',
  mobility: 'mobility',
  endurance: 'endurance',
  readiness: 'readiness',
  recovery: 'recovery',
  unknown: 'general',
}

function pickDisplaySummary(
  props: FeedbackLoopProofCardProps,
): ProgramEvidenceFeedbackSummary | null {
  if (props.mergedSummary) return props.mergedSummary
  const b = props.benchmarkSummary ?? null
  const w = props.workoutSummary ?? null
  if (!b && !w) return null
  // No mergedSummary supplied; choose the most informative side.
  const bUsed = (b?.benchmarkSignalsUsed ?? 0) > 0
  const wUsed = (w?.workoutSignalsUsed ?? 0) > 0
  if (bUsed && !wUsed) return b
  if (wUsed && !bUsed) return w
  if (bUsed && wUsed) {
    // Prefer the side that actually changed the program; if both, prefer
    // benchmark (longer arc).
    if (b!.changedProgram && !w!.changedProgram) return b
    if (w!.changedProgram && !b!.changedProgram) return w
    return b
  }
  // Neither side has signals — surface the most "complete" no-evidence
  // summary so the copy is honest.
  return b ?? w
}

// [AB12-1] Compact plan strip. Renders ONLY when the governor produced a
// speakable status. Hidden for `'not_applicable'` so we never claim
// calibration on a surface where AB11 was never wired.
function CalibrationPlanStrip({
  plan,
}: {
  plan: ProgramEvidenceCalibrationPlan
}) {
  if (plan.status === 'not_applicable') return null
  const variant: 'default' | 'secondary' | 'outline' =
    plan.status === 'applied'
      ? 'default'
      : plan.status === 'degraded'
        ? 'outline'
        : 'secondary'
  return (
    <div
      className="mt-3 rounded-md border border-border/60 bg-muted/30 p-3"
      data-ab12-1-calibration-plan={plan.status}
      data-ab12-1-confidence={plan.confidence}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={variant}
            className="text-[10px] font-medium uppercase tracking-wide"
          >
            {plan.visibleProof.label}
          </Badge>
          {plan.status === 'applied' && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium uppercase tracking-wide"
            >
              {plan.confidence} confidence
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
        {plan.visibleProof.summary}
      </p>
      {plan.visibleProof.chips.length > 0 && (
        <ul
          className="mt-2 flex flex-wrap gap-1"
          role="list"
          aria-label="Calibration constraints"
        >
          {plan.visibleProof.chips.map((chip, i) => (
            <li key={`${i}-${chip}`}>
              <Badge
                variant="secondary"
                className="text-[10px] font-medium normal-case"
              >
                {chip}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FeedbackLoopProofCard(props: FeedbackLoopProofCardProps) {
  const summary = pickDisplaySummary(props)
  const plan = props.calibrationPlan ?? null

  // No summary at all — render compact no-evidence baseline.
  if (!summary) {
    return (
      <Card
        className={cn('mt-4', props.className)}
        data-ab11-5-feedback-proof="no-summary"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle className="text-base font-semibold">
              Feedback Loop Proof
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            No benchmark or workout evidence yet — using your onboarding
            baseline until you log tests or workouts.
          </p>
          {plan && <CalibrationPlanStrip plan={plan} />}
        </CardContent>
      </Card>
    )
  }

  const totalSignals =
    summary.benchmarkSignalsUsed + summary.workoutSignalsUsed

  // Has summary but zero signals → honest baseline copy.
  if (totalSignals === 0) {
    return (
      <Card
        className={cn('mt-4', props.className)}
        data-ab11-5-feedback-proof="no-evidence"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle className="text-base font-semibold">
              Feedback Loop Proof
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {summary.summaryText}
          </p>
          {plan && <CalibrationPlanStrip plan={plan} />}
        </CardContent>
      </Card>
    )
  }

  // Real evidence path. Render compact, max-3 proof lines.
  const stateAttr: string = summary.changedProgram
    ? 'changed'
    : 'considered_no_change'

  return (
    <Card
      className={cn('mt-4', props.className)}
      data-ab11-5-feedback-proof="present"
      data-ab11-5-state={stateAttr}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle className="text-base font-semibold">
              Feedback Loop Proof
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {summary.benchmarkSignalsUsed > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] font-medium uppercase tracking-wide"
              >
                {summary.benchmarkSignalsUsed} benchmark
                {summary.benchmarkSignalsUsed === 1 ? '' : 's'}
              </Badge>
            )}
            {summary.workoutSignalsUsed > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] font-medium uppercase tracking-wide"
              >
                {summary.workoutSignalsUsed} workout signal
                {summary.workoutSignalsUsed === 1 ? '' : 's'}
              </Badge>
            )}
            {!summary.changedProgram && (
              <Badge variant="outline" className="text-[10px] font-medium">
                Considered • no change
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {summary.summaryText}
        </p>
      </CardHeader>

      {summary.proofLines.length > 0 && (
        <CardContent className="pt-0">
          <ul className="flex flex-col gap-1.5" role="list">
            {summary.proofLines.slice(0, 3).map((line, idx) => (
              <li
                key={`${idx}-${line}`}
                className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 text-pretty"
              >
                <Info
                  className="mt-[3px] h-3 w-3 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {summary.domainsAffected.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Areas reviewed:{' '}
              {summary.domainsAffected
                .map((d) => DOMAIN_LABEL[d])
                .filter((s) => s !== 'general')
                .join(', ') || 'general'}
            </p>
          )}
          {plan && <CalibrationPlanStrip plan={plan} />}
        </CardContent>
      )}
      {/* When there are no proofLines we still render the plan strip
          inside its own minimal CardContent so the AB12-1 surface is
          visible even when AB11 only produced summary text. */}
      {summary.proofLines.length === 0 && plan && (
        <CardContent className="pt-0">
          <CalibrationPlanStrip plan={plan} />
        </CardContent>
      )}
    </Card>
  )
}
