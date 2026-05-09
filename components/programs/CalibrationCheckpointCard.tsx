'use client'

// =============================================================================
// [AB11-2] CALIBRATION CHECKPOINT CARD (RESULT-ENTRY ENABLED)
// =============================================================================
//
// Compact, source-truth-only Program-page surface that:
//   1. Accepts the typed `ProgramCalibrationInput` from the page (program
//      truth: primaryGoal / secondaryGoal / selectedSkills /
//      equipmentAvailable).
//   2. Fetches the user's persisted benchmark history through the
//      EXISTING `GET /api/benchmarks?action=list` endpoint on mount.
//      There is no parallel storage and no shadow data layer.
//   3. Runs the pure `buildProgramCalibrationRecommendation()` engine
//      with the fetched `latestBenchmarksByTestName` map so the engine
//      can deprioritize already-tested baselines, mark `alreadyTested`,
//      and project `latestKnownResult` honestly per row.
//   4. Renders a compact inline result-entry affordance per recommended
//      test that POSTs to the EXISTING `/api/benchmarks` capture path
//      (which feeds `createBenchmark()`). After a successful submit, we
//      re-fetch the list so the engine re-projects with the new evidence.
//
// CONTRACTS:
//   - The card renders ONLY what is on the recommendation object plus
//     the latest benchmark evidence we just fetched. No parallel
//     cosmetic copy.
//   - On no-auth / no-DB / no-benchmarks the card degrades cleanly.
//   - Errors are surfaced honestly; we never fake success.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Info,
  Loader2,
  Target,
  X,
} from 'lucide-react'
import {
  buildProgramCalibrationRecommendation,
  type CalibrationRecommendationReasonCode,
  type CalibrationRecommendedTest,
  type CalibrationSafetyStatus,
  type LatestBenchmarkSummary,
  type ProgramCalibrationInput,
} from '@/lib/program/program-calibration-recommendation'
import type { TestUnit } from '@/lib/benchmark-testing-engine'
import {
  buildBenchmarkEvidenceSignalsFromLatestMap,
  summarizeBenchmarkEvidence,
  summarizeNoEvidence,
  type ProgramEvidenceFeedbackSummary,
} from '@/lib/program/program-evidence-feedback-loop'
import { FeedbackLoopProofCard } from './FeedbackLoopProofCard'
// [AB12-1] Evidence-aware governor — consumes the benchmark summary +
// the calibration recommendation we already build, produces a typed
// bounded plan, and renders it as a compact strip inside the existing
// FeedbackLoopProofCard. No new fetch, no new storage, no UI redesign.
import {
  buildEvidenceAwareCalibrationPlan,
  type ProgramEvidenceCalibrationPlan,
} from '@/lib/program/evidence-aware-program-calibration-governor'

// =============================================================================
// PROPS
// =============================================================================

interface CalibrationCheckpointCardProps {
  /** Typed program-truth inputs (forwarded by the Program page). */
  input: ProgramCalibrationInput
}

// =============================================================================
// LIST RESPONSE TYPES (mirror the `/api/benchmarks?action=list` payload)
// =============================================================================

interface BenchmarkListRow {
  testName: string
  testValue: number
  testUnit: TestUnit
  testDate: string
  changePercent: number | null
}

interface BenchmarksListResponse {
  success: true
  benchmarks: BenchmarkListRow[]
  count: number
}

// Runtime-validated TestUnit set so the type predicate cannot lie about
// an out-of-union string.
const KNOWN_TEST_UNITS: ReadonlySet<TestUnit> = new Set<TestUnit>([
  'reps',
  'seconds',
  'kg',
  'lbs',
  'progression_level',
  'percentage',
])

function isTestUnitLiteral(v: unknown): v is TestUnit {
  return typeof v === 'string' && KNOWN_TEST_UNITS.has(v as TestUnit)
}

function isBenchmarkListRow(v: unknown): v is BenchmarkListRow {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return (
    typeof r.testName === 'string' &&
    typeof r.testValue === 'number' &&
    Number.isFinite(r.testValue) &&
    isTestUnitLiteral(r.testUnit) &&
    typeof r.testDate === 'string' &&
    (r.changePercent === null || typeof r.changePercent === 'number')
  )
}

function buildLatestMap(
  rows: readonly BenchmarkListRow[],
): Map<string, LatestBenchmarkSummary> {
  // The `/api/benchmarks?action=list` endpoint returns rows ordered most
  // recent first. We keep the FIRST row per testName so the map holds
  // the latest known benchmark — never older noise.
  const map = new Map<string, LatestBenchmarkSummary>()
  for (const row of rows) {
    if (map.has(row.testName)) continue
    map.set(row.testName, {
      testValue: row.testValue,
      testUnit: row.testUnit,
      testDate: row.testDate,
      changePercent: row.changePercent,
    })
  }
  return map
}

// =============================================================================
// DISPLAY MAPS
// =============================================================================

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

function formatLatest(t: CalibrationRecommendedTest): string | null {
  const lr = t.latestKnownResult
  if (!lr) return null
  // Render a compact, honest line. We never invent improvement copy when
  // changePercent is null (no prior result existed).
  const valueTxt = `${lr.value} ${lr.unit}`
  if (lr.changePercent === null) {
    return `Latest: ${valueTxt} • baseline`
  }
  const sign = lr.changePercent > 0 ? '+' : ''
  return `Latest: ${valueTxt} • ${sign}${lr.changePercent.toFixed(1)}%`
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CalibrationCheckpointCard({
  input,
}: CalibrationCheckpointCardProps) {
  // [P1] Default collapsed for cleaner Program page hierarchy
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [latestMap, setLatestMap] = useState<Map<
    string,
    LatestBenchmarkSummary
  > | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  // Bumped after each successful submit so the recommendation re-projects.
  const [refreshTick, setRefreshTick] = useState<number>(0)
  const abortRef = useRef<AbortController | null>(null)

  const loadList = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setFetchError(null)
    try {
      const res = await fetch('/api/benchmarks?action=list', {
        method: 'GET',
        credentials: 'same-origin',
        signal: ctrl.signal,
      })
      if (res.status === 401) {
        // No auth: degrade cleanly. Engine still runs without latest map.
        setLatestMap(new Map())
        return
      }
      if (!res.ok) {
        // Honest, narrow error surface — never fabricate a success state.
        setLatestMap(new Map())
        setFetchError(`Could not load benchmark history (${res.status}).`)
        return
      }
      const json: unknown = await res.json()
      if (
        !json ||
        typeof json !== 'object' ||
        (json as { success?: unknown }).success !== true ||
        !Array.isArray((json as BenchmarksListResponse).benchmarks)
      ) {
        setLatestMap(new Map())
        setFetchError('Benchmark history response was malformed.')
        return
      }
      const rows = (json as BenchmarksListResponse).benchmarks.filter(
        isBenchmarkListRow,
      )
      setLatestMap(buildLatestMap(rows))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setFetchError(e instanceof Error ? e.message : 'Network error')
      setLatestMap(new Map())
    }
  }, [])

  useEffect(() => {
    void loadList()
    return () => {
      abortRef.current?.abort()
    }
  }, [loadList, refreshTick])

  // Pure recommendation re-runs whenever inputs OR latest evidence change.
  const recommendation = useMemo(
    () =>
      buildProgramCalibrationRecommendation({
        ...input,
        latestBenchmarksByTestName: latestMap ?? undefined,
      }),
    [input, latestMap],
  )

  // [AB11-3] Compute the typed benchmark evidence summary from the SAME
  // latest map the engine consumed. We only build it once the fetch has
  // resolved; while loading we hold null so the proof card renders the
  // honest baseline copy instead of inventing claims.
  const benchmarkSummary: ProgramEvidenceFeedbackSummary | null = useMemo(() => {
    if (latestMap === null) return null
    if (latestMap.size === 0) return summarizeNoEvidence('benchmark')
    const signals = buildBenchmarkEvidenceSignalsFromLatestMap(latestMap)
    return summarizeBenchmarkEvidence(signals)
  }, [latestMap])

  // [AB12-1] Evidence-aware calibration plan. Consumes the benchmark
  // summary + the recommendation engine output we already have. The
  // governor handles all degraded/no-evidence/applied states honestly;
  // we just render the result.
  //
  // Availability is wired explicitly: when `fetchError` is set the
  // benchmark side genuinely failed and the plan should report
  // `degraded` instead of `no_evidence`. When `latestMap === null`
  // we are still loading — treat as `absent` so the strip stays quiet.
  const calibrationPlan: ProgramEvidenceCalibrationPlan = useMemo(
    () =>
      buildEvidenceAwareCalibrationPlan({
        benchmarkSummary,
        calibrationRecommendation: recommendation,
        inputAvailability: {
          benchmark:
            fetchError !== null
              ? 'failed'
              : latestMap === null
                ? 'absent'
                : 'ok',
          // The card has no view into workout evidence; the page-level
          // workout proof card builds its own plan. Mark absent here
          // so the governor does not pretend to speak for workouts.
          workout: 'absent',
        },
      }),
    [benchmarkSummary, recommendation, fetchError, latestMap],
  )

  if (recommendation.recommendedTests.length === 0) {
    return (
      <>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <Card
            className="mt-4"
            data-ab11-2-calibration-checkpoint="empty"
            data-engine-version={recommendation.engineVersion}
            data-p1-collapsed={!isExpanded}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer pb-3 hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <CardTitle className="text-base font-semibold">
                      Calibration Checkpoint
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      No tests needed
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
                    Your calibration is up to date
                  </p>
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {recommendation.reasonSummary}
                </p>
                {fetchError && (
                  <p
                    className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                    role="note"
                  >
                    <AlertTriangle
                      className="mt-[2px] h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{fetchError}</span>
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        {/* [AB11-5] Honest benchmark-side proof even when no tests are
            recommended (e.g. user has no goals selected). Shows the
            baseline copy via summarizeNoEvidence when latestMap is empty.
            [AB12-1] Also surfaces the evidence-aware calibration plan as
            a compact strip below the proof body.
            [PPX-2] Custom title to distinguish from workout-side card. */}
        <FeedbackLoopProofCard
          benchmarkSummary={benchmarkSummary}
          calibrationPlan={calibrationPlan}
          defaultCollapsed={true}
          title="Calibration evidence"
        />
      </>
    )
  }

  const tests = recommendation.recommendedTests
  const safety = recommendation.safeToTestToday
  const showSafetyNote = safety !== 'safe' || fetchError !== null
  
  // [P5] Build compact summary for collapsed header
  // The badge must match the number of visible test rows rendered in the
  // expanded body. We count tests.length (the same array mapped to rows),
  // not a priority subset, to avoid "2 essential tests" when 3 rows render.
  const visibleTestCount = tests.length
  const testCountLabel = `${visibleTestCount} recommended test${visibleTestCount === 1 ? '' : 's'}`

  return (
    <>
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card
        className="mt-4"
        data-ab11-2-calibration-checkpoint="present"
        data-engine-version={recommendation.engineVersion}
        data-p1-collapsed={!isExpanded}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3 hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <CardTitle className="text-base font-semibold">
                  Calibration Checkpoint
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {testCountLabel}
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
                Baseline tests help personalize your progressions with real evidence
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground text-pretty">
              {recommendation.reasonSummary}
            </p>
            {recommendation.primaryLimiterHypothesis &&
              recommendation.primaryLimiterHypothesis !== 'unknown' && (
                <Badge variant="outline" className="mb-3 text-xs font-medium">
                  Limiter hypothesis:{' '}
                  {recommendation.primaryLimiterHypothesis.replace(/_/g, ' ')}
                </Badge>
              )}
            <ul className="flex flex-col gap-3" role="list">
              {tests.map((t) => (
                <CalibrationTestRow
                  key={t.testName}
                  test={t}
                  onSubmitted={() => setRefreshTick((n) => n + 1)}
                />
              ))}
            </ul>

            {showSafetyNote && (
              <p
                className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                role="note"
              >
                <AlertTriangle
                  className="mt-[2px] h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {fetchError ? (
                    <>{fetchError}</>
                  ) : (
                    <>
                      {SAFETY_LABEL[safety]}
                      {recommendation.blockedReasons.length > 0 && (
                        <>
                          {' — '}
                          {recommendation.blockedReasons.join('; ')}
                        </>
                      )}
                      {safety === 'unknown' && (
                        <> Test only when you feel fresh.</>
                      )}
                    </>
                  )}
                </span>
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
    {/* [AB11-5] Benchmark-side feedback proof. Renders directly off the
        same `latestMap` the calibration engine consumed, so the proof
        cannot drift from the recommendation. The card itself handles
        no-evidence and considered/no-change states honestly.
        [AB12-1] The same proof card now also renders the evidence-aware
        calibration plan strip, derived from the benchmark summary +
        recommendation already in scope.
        [PPX-2] Custom title to distinguish from workout-side card. */}
    <FeedbackLoopProofCard
      benchmarkSummary={benchmarkSummary}
      calibrationPlan={calibrationPlan}
      defaultCollapsed={true}
      title="Calibration evidence"
    />
    </>
  )
}

// =============================================================================
// ROW (test + collapsible result entry)
// =============================================================================

interface CalibrationTestRowProps {
  test: CalibrationRecommendedTest
  onSubmitted: () => void
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; benchmarkValue: number; benchmarkUnit: TestUnit }

function CalibrationTestRow({ test, onSubmitted }: CalibrationTestRowProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [valueRaw, setValueRaw] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [state, setState] = useState<SubmitState>({ kind: 'idle' })

  const latestLine = formatLatest(test)

  const submit = useCallback(async () => {
    const num = Number(valueRaw)
    if (!Number.isFinite(num) || num <= 0) {
      setState({
        kind: 'error',
        message: 'Enter a number greater than 0.',
      })
      return
    }
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // Canonical fields projected from the recommendation object —
          // never guessed in the UI.
          movementFamily: test.movementFamily,
          testName: test.testName,
          testCategory: test.testCategory,
          testValue: num,
          testUnit: test.testUnit,
          // First time we see this testName -> baseline. Otherwise it's a
          // retest and `isBaseline` must be false so the engine can
          // compute changePercent honestly.
          isBaseline: !test.alreadyTested,
          // Default condition is `unknown` until AB11-3 wires readiness.
          testConditions: 'unknown',
          notes: notes.trim().length > 0 ? notes.trim() : undefined,
        }),
      })
      if (!res.ok) {
        const errJson: unknown = await res.json().catch(() => null)
        const msg =
          errJson && typeof errJson === 'object' && 'error' in errJson
            ? String((errJson as { error: unknown }).error)
            : `Save failed (${res.status}).`
        setState({ kind: 'error', message: msg })
        return
      }
      const json: unknown = await res.json()
      // Optimistic success feedback derived from the canonical response.
      if (
        json &&
        typeof json === 'object' &&
        'benchmark' in json &&
        (json as { benchmark: unknown }).benchmark &&
        typeof (json as { benchmark: { testValue?: unknown } }).benchmark ===
          'object'
      ) {
        const bm = (json as { benchmark: Record<string, unknown> }).benchmark
        const v = Number(bm.testValue)
        const u = bm.testUnit
        if (Number.isFinite(v) && isTestUnitLiteral(u)) {
          setState({ kind: 'success', benchmarkValue: v, benchmarkUnit: u })
          // Trigger parent re-fetch so the engine re-projects with the
          // new evidence (alreadyTested + latestKnownResult).
          onSubmitted()
          return
        }
      }
      // Successful HTTP but malformed body: surface honestly.
      setState({
        kind: 'error',
        message: 'Saved, but response was malformed.',
      })
      onSubmitted()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Network error',
      })
    }
  }, [valueRaw, notes, test, onSubmitted])

  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-md border p-3',
        priorityTone(test.priority),
      )}
      data-test-name={test.testName}
      data-reason-code={test.reasonCode}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {test.displayName}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] font-medium uppercase tracking-wide"
          >
            {REASON_BADGE_LABEL[test.reasonCode]}
          </Badge>
          {test.alreadyTested && (
            <Badge variant="outline" className="text-[10px] font-medium">
              Tested
            </Badge>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          {test.estimatedTimeMinutes} min
        </span>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
        {test.reasonText}
      </p>

      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
        <Info
          className="mr-1 inline h-3 w-3 align-[-1px]"
          aria-hidden="true"
        />
        {test.programInfluenceNote}
      </p>

      {latestLine && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {latestLine}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {!open ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setOpen(true)
              setState({ kind: 'idle' })
            }}
          >
            {test.alreadyTested ? 'Log retest' : 'Log result'}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              setOpen(false)
              setState({ kind: 'idle' })
              setValueRaw('')
              setNotes('')
            }}
          >
            <X className="mr-1 h-3 w-3" aria-hidden="true" />
            Cancel
          </Button>
        )}
        {state.kind === 'success' && (
          <span className="flex items-center gap-1 text-xs text-foreground/80">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Saved {state.benchmarkValue} {state.benchmarkUnit}.
          </span>
        )}
      </div>

      {open && (
        <div className="mt-1 flex flex-col gap-2 rounded-md border border-border/60 bg-muted/30 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`calib-value-${test.testName}`}
                className="text-xs font-medium"
              >
                Result
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`calib-value-${test.testName}`}
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="any"
                  value={valueRaw}
                  onChange={(e) => setValueRaw(e.target.value)}
                  className="h-8 w-28 text-sm"
                  placeholder="0"
                  aria-describedby={`calib-unit-${test.testName}`}
                />
                <span
                  id={`calib-unit-${test.testName}`}
                  className="text-xs text-muted-foreground"
                >
                  {test.testUnit}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label
                htmlFor={`calib-notes-${test.testName}`}
                className="text-xs font-medium"
              >
                Notes (optional)
              </Label>
              <Input
                id={`calib-notes-${test.testName}`}
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-sm"
                placeholder="e.g. fresh, warm, full ROM"
                maxLength={500}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={submit}
              disabled={state.kind === 'submitting'}
            >
              {state.kind === 'submitting' ? (
                <>
                  <Loader2
                    className="mr-1 h-3 w-3 animate-spin"
                    aria-hidden="true"
                  />
                  Saving
                </>
              ) : (
                'Save result'
              )}
            </Button>
          </div>
          {state.kind === 'error' && (
            <p
              className="flex items-start gap-2 text-xs leading-relaxed text-destructive"
              role="alert"
            >
              <AlertTriangle
                className="mt-[2px] h-3 w-3 shrink-0"
                aria-hidden="true"
              />
              <span>{state.message}</span>
            </p>
          )}
        </div>
      )}
    </li>
  )
}
