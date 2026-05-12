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
// [P1] Now supports defaultCollapsed prop for cleaner Program page hierarchy.
// =============================================================================

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Activity, ChevronDown, Sparkles, Info } from 'lucide-react'
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
// [AB12-2] Optional generation-time influence stamp from the
// authoritative-program-generation service. Reflects what was actually
// applied (or honestly suppressed) when this program was generated, as
// opposed to AB12-1's `calibrationPlan` which reflects what the live
// client-side governor currently recommends. Both can render side-by-
// side: AB12-1 is "live recommendation", AB12-2 is "what shipped".
import type { EvidenceCalibrationGenerationInfluence } from '@/lib/program/evidence-calibration-generation-influence'
// [IQ7 / AB17] Optional shaping proof from program generation. When present,
// shows concrete mutation proof (RPE caps, volume reductions) in the card.
import type { EvidenceCalibrationShapingProof } from '@/lib/program/evidence-calibration-program-shaping'

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
  /**
   * [AB12-2] Optional generation-time influence stamp. When present and
   * `status !== 'inactive'`, a SECOND compact label + chip strip is
   * rendered below the AB12-1 strip showing what was actually applied
   * (or honestly suppressed) at the moment this program was generated.
   * When omitted or `'inactive'`, the strip is hidden silently.
   */
  generationInfluence?: EvidenceCalibrationGenerationInfluence | null
  /**
   * [IQ7 / AB17] Optional shaping proof from program generation. When present,
   * used to determine if the program was actually mutated vs just influenced.
   */
  shapingProof?: EvidenceCalibrationShapingProof | null
  /**
   * [P1] When true, the card renders collapsed by default for cleaner
   * Program page hierarchy. User can expand to see full details.
   */
  defaultCollapsed?: boolean
  /**
   * [PPX-2] Custom title for the card. Defaults to "Coaching Feedback Loop"
   * for backward compatibility, but callers can override to avoid duplicate
   * naming when multiple cards appear on the same page. Examples:
   *   - "Calibration evidence" for benchmark-side card
   *   - "Recent adjustments" for workout-side card
   */
  title?: string
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

// =============================================================================
// [IQ7 / AB17] FEEDBACK LOOP CLOSURE STATE RESOLVER
// =============================================================================
// Pure display-only resolver that derives the visible closure state from
// the existing typed stamps. Never invents claims — derives from truth.

type FeedbackLoopClosureState =
  | 'baseline'           // No evidence logged yet
  | 'evidence_reviewed'  // Evidence exists but no safe mutation was needed/made
  | 'program_adjusted'   // Evidence actually mutated the program (RPE caps, volume, etc.)
  | 'safe_hold'          // Evidence suggested changes but they were suppressed for safety

interface FeedbackLoopClosureDisplay {
  state: FeedbackLoopClosureState
  headline: string
  chipLabel: string
  chipVariant: 'default' | 'secondary' | 'outline'
  collapsedSummary: string
  mutationProofLines: string[]
  suppressionNote: string | null
}

function resolveFeedbackLoopClosureDisplay(
  summary: ProgramEvidenceFeedbackSummary | null,
  influence: EvidenceCalibrationGenerationInfluence | null,
  shapingProof: EvidenceCalibrationShapingProof | null,
): FeedbackLoopClosureDisplay {
  const totalSignals = (summary?.benchmarkSignalsUsed ?? 0) + (summary?.workoutSignalsUsed ?? 0)
  
  // Case 1: No evidence at all
  if (totalSignals === 0 && (!influence || influence.status === 'inactive')) {
    return {
      state: 'baseline',
      headline: 'Feedback loop: baseline',
      chipLabel: 'Baseline',
      chipVariant: 'secondary',
      // [AB17.1 / IQ7.1] Explicit feedback-loop identity in collapsed summary
      collapsedSummary: 'Baseline — no logged workout evidence yet',
      mutationProofLines: [],
      suppressionNote: null,
    }
  }
  
  // Case 2: Check if shaping actually mutated the program
  const hasMutation = shapingProof?.appliedAtLeastOneMutation === true
  const rpeCaps = shapingProof?.cappedExerciseCount ?? 0
  const volumeReduced = shapingProof?.volumeAdjustment?.applied === true
  const setsRemoved = shapingProof?.volumeAdjustment?.totalSetsRemoved ?? 0
  
  // Build mutation proof lines from actual shaping proof
  const mutationProofLines: string[] = []
  if (rpeCaps > 0) {
    mutationProofLines.push(`RPE capped on ${rpeCaps} exercise${rpeCaps > 1 ? 's' : ''} (max RPE 7)`)
  }
  if (volumeReduced && setsRemoved > 0) {
    mutationProofLines.push(`${setsRemoved} set${setsRemoved > 1 ? 's' : ''} removed for recovery protection`)
  }
  if (influence?.progressionAggressiveness === 'conservative' && !hasMutation) {
    mutationProofLines.push('Conservative progression held (no exercises required capping)')
  }
  
  // Case 3: Evidence exists and actually mutated the program
  if (hasMutation) {
    return {
      state: 'program_adjusted',
      headline: 'Feedback loop: program adjusted',
      chipLabel: 'Adjusted',
      chipVariant: 'default',
      // [AB17.1 / IQ7.1] Explicit feedback-loop identity in collapsed summary
      collapsedSummary: 'Program adjusted — your logged data shaped this program',
      mutationProofLines,
      suppressionNote: null,
    }
  }
  
  // Case 4: Evidence exists but shaping was suppressed
  const wasSuppressed = shapingProof?.skippedReason != null && shapingProof.skippedReason !== 'progression_not_conservative'
  const hasConstraintsSuppressed = (influence?.suppressedConstraints?.length ?? 0) > 0
  
  if (wasSuppressed || hasConstraintsSuppressed) {
    const suppressionNote = shapingProof?.skippedReason === 'no_influence'
      ? 'Shaping pass skipped: no active influence from evidence'
      : shapingProof?.skippedReason === 'status_not_active'
        ? 'Shaping pass skipped: influence not active'
        : shapingProof?.skippedReason === 'not_allowed_to_mutate'
          ? 'Shaping pass skipped: insufficient confidence for structural changes'
          : hasConstraintsSuppressed
            ? `${influence!.suppressedConstraints!.length} constraint${influence!.suppressedConstraints!.length > 1 ? 's' : ''} considered but suppressed`
            : 'Evidence considered but no safe change made'
    
    return {
      state: 'safe_hold',
      headline: 'Feedback loop: safe hold',
      chipLabel: 'Safe hold',
      chipVariant: 'outline',
      // [AB17.1 / IQ7.1] Explicit feedback-loop identity in collapsed summary
      collapsedSummary: 'Safe hold — evidence reviewed, program unchanged',
      mutationProofLines: [],
      suppressionNote,
    }
  }
  
  // Case 5: Evidence exists, influence active, but no mutation was needed
  return {
    state: 'evidence_reviewed',
    headline: 'Feedback loop: evidence reviewed',
    chipLabel: totalSignals > 0 ? `${totalSignals} signal${totalSignals > 1 ? 's' : ''}` : 'Reviewed',
    chipVariant: 'secondary',
    // [AB17.1 / IQ7.1] Explicit feedback-loop identity in collapsed summary
    collapsedSummary: summary?.changedProgram
      ? 'Evidence reviewed — your logged data shaped this program'
      : 'Evidence reviewed — no changes needed yet',
    mutationProofLines,
    suppressionNote: null,
  }
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

// [AB12-2] Compact generation-influence strip. Renders ONLY when the
// authoritative service stamped a non-`inactive` influence on the
// program. Hidden for `'inactive'` so we never claim influence on a
// program that was generated without evidence inputs. Visually distinct
// from the AB12-1 strip (uses `data-ab12-2-...` markers + bordered ring
// rather than muted background) so a user can tell "what was applied to
// this program" from "what the live recommendation currently is".
function GenerationInfluenceStrip({
  influence,
}: {
  influence: EvidenceCalibrationGenerationInfluence
}) {
  if (influence.status === 'inactive') return null
  const variant: 'default' | 'secondary' | 'outline' =
    influence.status === 'active'
      ? 'default'
      : influence.status === 'degraded'
        ? 'outline'
        : 'secondary'
  return (
    <div
      className="mt-3 rounded-md border border-border bg-background p-3 ring-1 ring-border/40"
      data-ab12-2-generation-influence={influence.status}
      data-ab12-2-confidence={influence.confidence}
      data-ab12-2-allowed-to-mutate={String(influence.allowedToMutateProgram)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={variant}
            className="text-[10px] font-medium uppercase tracking-wide"
          >
            {influence.proof.label}
          </Badge>
          {influence.status === 'active' && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium uppercase tracking-wide"
            >
              {influence.confidence} confidence
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
        {influence.proof.summary}
      </p>
      {influence.proof.chips.length > 0 && (
        <ul
          className="mt-2 flex flex-wrap gap-1"
          role="list"
          aria-label="Generation-time calibration constraints"
        >
          {influence.proof.chips.map((chip, i) => (
            <li key={`${i}-${chip}`}>
              <Badge
                variant={
                  chip.includes('(suppressed)') ? 'outline' : 'secondary'
                }
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
  const influence = props.generationInfluence ?? null
  const shapingProof = props.shapingProof ?? null
  // [PPX-2] Custom title support - default to legacy name for backward compatibility
  const cardTitle = props.title ?? 'Coaching Feedback Loop'
  // [P1] Support collapsed by default for cleaner Program page
  const [isExpanded, setIsExpanded] = useState<boolean>(!props.defaultCollapsed)
  
  // [IQ7 / AB17] Derive the closure display state from all truth sources
  const closureDisplay = resolveFeedbackLoopClosureDisplay(summary, influence, shapingProof)
  
  // No summary at all — render compact no-evidence baseline.
  if (!summary) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card
          className={cn('mt-4', props.className)}
          data-ab11-5-feedback-proof="no-summary"
          data-iq7-closure-state={closureDisplay.state}
          data-p1-collapsed={!isExpanded}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-3 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-base font-semibold">
                    {cardTitle}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={closureDisplay.chipVariant} className="text-xs">
                    {closureDisplay.chipLabel}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </div>
              </div>
              {!isExpanded && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {closureDisplay.collapsedSummary}
                </p>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                No benchmark or workout evidence yet — using your onboarding
                baseline until you log tests or workouts.
              </p>
              {plan && <CalibrationPlanStrip plan={plan} />}
              {influence && <GenerationInfluenceStrip influence={influence} />}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }
  
  const totalSignals =
    summary.benchmarkSignalsUsed + summary.workoutSignalsUsed
  
  // Has summary but zero signals → honest baseline copy.
  if (totalSignals === 0) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card
          className={cn('mt-4', props.className)}
          data-ab11-5-feedback-proof="no-evidence"
          data-iq7-closure-state={closureDisplay.state}
          data-p1-collapsed={!isExpanded}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-3 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-base font-semibold">
                    {cardTitle}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={closureDisplay.chipVariant} className="text-xs">
                    {closureDisplay.chipLabel}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </div>
              </div>
              {!isExpanded && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {closureDisplay.collapsedSummary}
                </p>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {summary.summaryText}
              </p>
              {plan && <CalibrationPlanStrip plan={plan} />}
              {influence && <GenerationInfluenceStrip influence={influence} />}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  // Real evidence path. Render compact, max-3 proof lines.
  const stateAttr: string = summary.changedProgram
    ? 'changed'
    : 'considered_no_change'

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card
        className={cn('mt-4', props.className)}
        data-ab11-5-feedback-proof="present"
        data-ab11-5-state={stateAttr}
        data-iq7-closure-state={closureDisplay.state}
        data-p1-collapsed={!isExpanded}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3 hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <CardTitle className="text-base font-semibold">
                  {cardTitle}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={closureDisplay.chipVariant} 
                  className="text-xs"
                >
                  {closureDisplay.chipLabel}
                </Badge>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </div>
            </div>
            {!isExpanded && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {closureDisplay.collapsedSummary}
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-1 mb-3">
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
              {!summary.changedProgram && closureDisplay.state !== 'program_adjusted' && (
                <Badge variant="outline" className="text-[10px] font-medium">
                  Considered, no change needed
                </Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty mb-3">
              {summary.summaryText}
            </p>

            {/* [IQ7 / AB17] Mutation proof lines from shaping proof */}
            {closureDisplay.mutationProofLines.length > 0 && (
              <div 
                className="mb-3 rounded-md border border-border bg-secondary/30 p-3"
                data-iq7-mutation-proof="true"
              >
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  What changed
                </p>
                <ul className="flex flex-col gap-1" role="list">
                  {closureDisplay.mutationProofLines.map((line, idx) => (
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
              </div>
            )}

            {/* [IQ7 / AB17] Suppression note when evidence was considered but not applied */}
            {closureDisplay.suppressionNote && (
              <div 
                className="mb-3 rounded-md border border-border bg-background p-2.5"
                data-iq7-suppression-note="true"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Why no change was made
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
                  {closureDisplay.suppressionNote}
                </p>
              </div>
            )}

            {summary.proofLines.length > 0 && (
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
            )}
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
            {influence && <GenerationInfluenceStrip influence={influence} />}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
