'use client'

// =============================================================================
// [AB11-1] CALIBRATION CHECKPOINT CARD
// =============================================================================
//
// Compact, source-truth-only display surface that consumes the typed
// `ProgramCalibrationRecommendation` produced by
// `lib/program/program-calibration-recommendation.ts`.
//
// CONTRACT:
//   - This component renders ONLY what is on the recommendation object.
//   - It NEVER invents reason / influence / safety copy.
//   - Result capture is intentionally NOT wired here — the canonical
//     capture path is `createBenchmark()` in
//     `lib/benchmark-testing-engine.ts`. AB11-2 will wire that flow
//     through the existing typed surface; until then the card surfaces
//     recommendations + honest "result entry coming soon" guidance and
//     provides a deep link to the existing test guides where one exists.
//
// VISUAL HIERARCHY:
//   - Sits directly under `<ProgramTruthSummary>` on the Program page.
//   - Uses the same `<Card>` / `<Badge>` shadcn primitives so it matches
//     the rest of the surface and respects the global token palette.
//   - Caps at 3 tests — this is a checkpoint, not a dashboard.
// =============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Target, Clock3, Info, AlertTriangle } from 'lucide-react'
import type {
  ProgramCalibrationRecommendation,
  CalibrationRecommendedTest,
  CalibrationRecommendationReasonCode,
  CalibrationSafetyStatus,
} from '@/lib/program/program-calibration-recommendation'

interface CalibrationCheckpointCardProps {
  recommendation: ProgramCalibrationRecommendation | null
}

const REASON_BADGE_LABEL: Record<CalibrationRecommendationReasonCode, string> = {
  no_baseline_yet: 'New baseline',
  goal_alignment: 'Goal-aligned',
  skill_alignment: 'Skill-aligned',
  essential_baseline: 'Essential',
  plateau_suspected: 'Plateau check',
  overdue_retest: 'Retest',
  protective_check_before_progression: 'Safety check',
}

const SAFETY_LABEL: Record<CalibrationSafetyStatus, string> = {
  safe: 'Safe to test today',
  delay: 'Delay testing',
  unknown: 'No recovery signal yet',
}

function priorityTone(priority: CalibrationRecommendedTest['priority']): string {
  switch (priority) {
    case 'essential':
      return 'border-foreground/20 bg-foreground/[0.03]'
    case 'recommended':
      return 'border-border bg-card'
    case 'optional':
      return 'border-border/60 bg-muted/30'
  }
}

export function CalibrationCheckpointCard({
  recommendation,
}: CalibrationCheckpointCardProps) {
  // Hard guard: nothing to render means render nothing. We never
  // fabricate copy when the engine declined to recommend a test.
  if (!recommendation) return null
  if (recommendation.recommendedTests.length === 0) {
    // Honest empty state — derives the message from the engine, not from
    // local strings, except for the universally-true intro line.
    return (
      <Card
        className="mt-4"
        data-ab11-1-calibration-checkpoint="empty"
        data-engine-version={recommendation.engineVersion}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">
              Calibration Checkpoint
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {recommendation.reasonSummary}
          </p>
        </CardContent>
      </Card>
    )
  }

  const tests = recommendation.recommendedTests
  const safety = recommendation.safeToTestToday
  const showSafetyNote = safety !== 'safe' // surface unknown / delay honestly

  return (
    <Card
      className="mt-4"
      data-ab11-1-calibration-checkpoint="present"
      data-engine-version={recommendation.engineVersion}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">
              Calibration Checkpoint
            </CardTitle>
          </div>
          {recommendation.primaryLimiterHypothesis &&
            recommendation.primaryLimiterHypothesis !== 'unknown' && (
              <Badge variant="outline" className="text-xs font-medium">
                Limiter hypothesis:{' '}
                {recommendation.primaryLimiterHypothesis.replace(/_/g, ' ')}
              </Badge>
            )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {recommendation.reasonSummary}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="flex flex-col gap-3" role="list">
          {tests.map((t) => (
            <li
              key={t.testName}
              className={cn(
                'flex flex-col gap-2 rounded-md border p-3',
                priorityTone(t.priority),
              )}
              data-test-name={t.testName}
              data-reason-code={t.reasonCode}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {t.displayName}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wide">
                    {REASON_BADGE_LABEL[t.reasonCode]}
                  </Badge>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                  {t.estimatedTimeMinutes} min
                </span>
              </div>

              <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
                {t.reasonText}
              </p>

              <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                <Info className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />
                {t.programInfluenceNote}
              </p>
            </li>
          ))}
        </ul>

        {showSafetyNote && (
          <p
            className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
            role="note"
          >
            <AlertTriangle className="mt-[2px] h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              {SAFETY_LABEL[safety]}
              {recommendation.blockedReasons.length > 0 && (
                <>
                  {' — '}
                  {recommendation.blockedReasons.join('; ')}
                </>
              )}
              {safety === 'unknown' && (
                <>
                  {' '}
                  Test only when you feel fresh. Result capture coming in the next
                  update.
                </>
              )}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
