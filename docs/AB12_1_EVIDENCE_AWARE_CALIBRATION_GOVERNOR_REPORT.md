# AB12-1 — Evidence-Aware Program Calibration Governor

> Status: **COMPLETE**
> Branch: `v0/alericpetsch836-6923-3819fe86`
> Scope: First AB12 intelligence layer. Bounded, typed, metadata/proof-only.
> Schema/package/auth/billing/workout reducer changes: **none**.

---

## What AB12-1 ships

A single pure typed bridge from AB11 evidence/recommendation outputs into
a bounded `ProgramEvidenceCalibrationPlan`, plus a compact visible proof
strip on the existing `FeedbackLoopProofCard`. The governor never
fetches, never persists, never mutates the program — AB12-1 is
deliberately a metadata/proof bridge so we can ship the foundation
without rewriting the adaptive program builder. Structural builder
integration is deferred to AB12-2.

---

## Files

### Added

- `lib/program/evidence-aware-program-calibration-governor.ts`
  Pure typed governor. Exports `buildEvidenceAwareCalibrationPlan` and
  `ProgramEvidenceCalibrationPlan`. Decision tree:
  `not_applicable` → `degraded` → `no_evidence` → `applied`.
- `docs/AB12_1_EVIDENCE_AWARE_CALIBRATION_GOVERNOR_REPORT.md` (this file).

### Modified

- `components/programs/FeedbackLoopProofCard.tsx`
  New optional `calibrationPlan` prop. New private `CalibrationPlanStrip`
  renderer hidden when status is `not_applicable`. Strip renders in all
  three existing branches (no-summary, no-evidence, present) without
  touching the existing AB11-5 proof body.
- `components/programs/CalibrationCheckpointCard.tsx`
  Builds a benchmark-side plan from `benchmarkSummary` + `recommendation`,
  passes it to the `FeedbackLoopProofCard` it already renders. Honest
  availability flags: `failed` when fetch errored, `absent` while loading,
  `ok` after success.
- `app/(app)/program/page.tsx`
  Builds a workout-side plan from the `workoutSummary` it already derived
  from the canonical `performanceAdaptation` stamps, passes it to the
  `FeedbackLoopProofCard` it already renders.

### Inspected — not changed

- `lib/program/program-evidence-feedback-loop.ts` (governor input source)
- `lib/program/program-calibration-recommendation.ts` (governor input source)
- `lib/program/performance-feedback-adaptation-contract.ts` (Phase-L canonical types)
- `lib/benchmark-testing-engine.ts` (untouched)
- `app/api/benchmarks/route.ts` (untouched)

---

## Governor contract

```ts
interface ProgramEvidenceCalibrationPlan {
  status: 'applied' | 'no_evidence' | 'degraded' | 'not_applicable'
  confidence: 'low' | 'medium' | 'high'
  reasons: string[]                       // ≤3, derived from AB11 proofLines
  constraints: {
    progressionAggressiveness?: 'conservative' | 'standard' | 'aggressive'
    volumeBias?: 'reduce' | 'maintain' | 'increase_carefully'
    intensityBias?: 'cap' | 'maintain' | 'allow_progression'
    recoveryBias?: 'protect' | 'normal'
    skillPriorityBias?: string[]
    benchmarkRetestPrompt?: boolean
  }
  visibleProof: { label: string; summary: string; chips: string[] }
  governorVersion: 'ab12-1-evidence-aware-calibration-governor'
}
```

### Decision rules (in order, first match wins)

1. **`not_applicable`** — both inputs absent. UI hides the strip.
2. **`degraded`** — at least one input failed (caller passes `'failed'`
   in `inputAvailability`). Constraints fall back to safe baseline:
   `progressionAggressiveness: 'conservative'`. UI shows
   "Evidence unavailable — using safe baseline".
3. **`no_evidence`** — both inputs present but reported zero signals.
   Constraints empty (or `benchmarkRetestPrompt: true` if the
   recommendation engine has tests queued).
4. **`applied`** — at least one summary contributed real signals.
   Constraints derived from `decisionsApplied` with safety-wins-ties:
   `hold` always wins over `progress`; `deload` / `adjust_rest` always
   set `recoveryBias: 'protect'`.

### Confidence bucketing

Average of contributing summary confidences (+ recommendation
confidence when present):
- `≥ 0.66` → `high`
- `≥ 0.33` → `medium`
- otherwise → `low`

---

## AB11 → AB12 connection (canonical funnel lock)

```
GET /api/benchmarks?action=list                      [AB11-2 canonical]
  → buildBenchmarkEvidenceSignalsFromLatestMap        [AB11-3]
  → summarizeBenchmarkEvidence                        [AB11-3]
  → buildEvidenceAwareCalibrationPlan(benchmarkSummary, recommendation)
                                                       [AB12-1]  ← NEW
  → FeedbackLoopProofCard.calibrationPlan              [AB11-5 surface]

CompletedSetEvidence → applyFuturePrescriptionMutations
                                                       [Phase-L canonical]
  → buildWorkoutEvidenceSignalsFromProgramStamps       [AB11-4]
  → summarizeWorkoutEvidence                           [AB11-4]
  → buildEvidenceAwareCalibrationPlan(workoutSummary)
                                                       [AB12-1]  ← NEW
  → FeedbackLoopProofCard.calibrationPlan              [AB11-5 surface]
```

No new fetch, no new storage, no new builder, no schema changes.

---

## Visible behavior

### Benchmark side (inside `CalibrationCheckpointCard`)

| AB11 state                       | Plan status        | UI strip                                                       |
|----------------------------------|--------------------|----------------------------------------------------------------|
| Loading (`latestMap === null`)   | `not_applicable`   | Hidden                                                         |
| Fetch error (`fetchError`)       | `degraded`         | "Evidence unavailable" + `progression: conservative`           |
| Empty list, recommendation has tests | `no_evidence` | "Evidence calibration waiting" + `benchmark baseline suggested`|
| Empty list, no recommendation    | `no_evidence`      | "Evidence calibration waiting", no chips                       |
| Real benchmark signals           | `applied`          | "Evidence calibration active" + chips derived from decisions   |

### Workout side (on Program page after `CalibrationCheckpointCard`)

| AB11 state                                | Plan status     | UI strip                                                |
|-------------------------------------------|-----------------|---------------------------------------------------------|
| No `performanceAdaptation` stamps         | `no_evidence`   | "Evidence calibration waiting"                          |
| Phase-L mutations applied (`hold`)        | `applied`       | "Evidence calibration active" + `progression: conservative` |
| Phase-L mutations applied (`reduce_volume`) | `applied`     | + `volume: reduce` + `recovery: protect` (if rest stamp)|
| Phase-L mutations applied (`progress`)    | `applied`       | + `progression: standard` + `volume: increase carefully`|

Every chip text is generated by the governor from a real
`ProgramEvidenceDecision` in the AB11 summary; nothing is hand-written
in the UI layer.

---

## Truth-to-UI guarantees

1. **No invented copy.** All chip strings, the `summary` line, and the
   `reasons[]` are derived from typed AB11 outputs.
2. **No fake "applied".** The governor uses the caller's
   `inputAvailability` flags to distinguish "no evidence" from "evidence
   unavailable". Neither the page nor the card ever forces `applied`.
3. **Safety wins ties.** A `hold` decision always lowers
   `progressionAggressiveness` to `conservative` even if a `progress`
   decision is also in the set.
4. **Domain isolation.** `skillPriorityBias` is only set when the skill
   domain actually contributed. Strength evidence cannot bias mobility.
5. **Stable audit stamp.** Every plan carries
   `governorVersion: 'ab12-1-evidence-aware-calibration-governor'` so
   downstream consumers can verify the producer.

---

## Type safety

- Zero `as any`, `@ts-ignore`, `@ts-expect-error` in any AB12 file.
- All new types are strict and local to the governor file.
- Existing core types (`ProgramEvidenceFeedbackSummary`,
  `ProgramCalibrationRecommendation`, `ProgramEvidenceDecision`,
  `ProgramEvidenceDomain`) are imported as `type`-only and not widened.
- `inputAvailability` is the typed mechanism for caller-provided
  failure signals; no untyped fallthrough.

---

## Out of scope (deferred to AB12-2)

- Wiring the bounded `constraints` into the actual program builder so
  that `progressionAggressiveness: 'conservative'` actually changes the
  next program's progression curve.
- Persisting the plan into the saved program shape (currently it is
  computed at render and never serialized — safe because every input is
  derived from already-persisted truth).
- A merged plan at the page level that consumes both benchmark and
  workout summaries simultaneously (currently each surface builds its
  own per-side plan; a merged plan requires lifting the benchmark fetch
  out of `CalibrationCheckpointCard`).

---

## Verification

- TypeScript audit: zero forbidden patterns in AB12 files.
- Build: not run in this sandbox; recommend
  `pnpm exec tsc --noEmit --pretty false && pnpm run build` locally
  before merging.
- Runtime: governor is a pure function; safe to call on every render;
  no I/O, no React, no global state.
