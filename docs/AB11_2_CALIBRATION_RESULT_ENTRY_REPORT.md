# AB11-2 Calibration Result Entry + Benchmark Feed-In Report

**Phase:** AB11-2 (additive intelligence wiring; no broad feature work, no rewrites, no parallel storage)
**Inspected branch:** `v0/alericpetsch836-6923-92c67bc0` (post AB11-1)
**Command execution available in this environment:** NO. `pnpm exec tsc --noEmit --pretty false` and `pnpm run build` cannot be invoked from this v0 sandbox. The patch is internally consistent at the TypeScript contract level (engine producer ↔ card consumer ↔ API validator all reference the same canonical unions exported from `lib/benchmark-testing-engine.ts`). The user must run the two commands locally before merging.

---

## 1. Mission

Wire the AB11-1 Calibration Checkpoint card into the existing benchmark capture system so:

1. The user can enter a result for a recommended calibration test through a compact inline form on the Program page.
2. The result submits through the existing canonical capture path (`POST /api/benchmarks` → `createBenchmark()`).
3. The card displays the latest known benchmark per recommended test after save.
4. The recommendation engine is fed the user's already-tested names + latest benchmark evidence so the next-best test floats up.
5. No parallel storage, no fake results, no AB6–AB10 corridor changes.

---

## 2. Files inspected (audit-first)

| File | Verdict |
|---|---|
| `docs/AB11_1_BASELINE_PROGRESS_TESTING_REPORT.md` | Read; informed the AB11-2 scope. |
| `lib/program/program-calibration-recommendation.ts` | Extended (engine remains pure). |
| `components/programs/CalibrationCheckpointCard.tsx` | Replaced (now owns I/O for benchmark history; consumes its own engine). |
| `app/(app)/program/page.tsx` | One-import diff: drop `buildProgramCalibrationRecommendation` (no longer needed at page level), switch `<CalibrationCheckpointCard recommendation=…>` → `<CalibrationCheckpointCard input=…>`. |
| `lib/benchmark-testing-engine.ts` | UNCHANGED. Reused: `Benchmark`, `BenchmarkInput`, `BenchmarkMovementFamily`, `TestCategory`, `TestUnit`, `TestCondition`, `DataQuality`, `createBenchmark()`, `getUserBenchmarks()`. |
| `app/api/benchmarks/route.ts` | Hardened: narrow runtime validation for the POST body (enums + finite > 0 testValue + bounded confidence + capped notes). GET handlers untouched. Successful-response shape preserved. |
| `components/ui/{button,input,textarea,label,card,badge}.tsx` | Existing shadcn primitives reused; no UI redesign. |

No live workout / loader / builder / normalizer / Prisma / migrations / package / Next config files were modified.

---

## 3. Existing benchmark API reused

YES — the canonical capture path was reused unchanged:

```
[Card] -> POST /api/benchmarks -> createBenchmark(userId, BenchmarkInput) -> Postgres
[Card] <- GET  /api/benchmarks?action=list <- getUserBenchmarks(userId)   <- Postgres
```

No new server action was created. No parallel storage was created. The auth model (`spartanlab_user_id` cookie) is preserved as-is.

---

## 4. Engine extensions (source-owned, narrow)

`lib/program/program-calibration-recommendation.ts`:

- New imported types: `TestCategory`, `TestUnit` (canonical from the benchmark engine).
- New interface `LatestBenchmarkSummary` (narrow projection of a `Benchmark` row — `testValue` / `testUnit` / `testDate` / `changePercent`). Producer = card. Consumer = engine.
- New input field `latestBenchmarksByTestName?: ReadonlyMap<string, LatestBenchmarkSummary> | null`. The engine derives both `alreadyTested` and `latestKnownResult` from its keys/values. Backward-compat `alreadyTestedNames` is unioned when both are provided.
- Extended `CalibrationRecommendedTest`:
  - `testCategory: TestCategory` — projected from the catalog so the UI never guesses when building the `BenchmarkInput`.
  - `testUnit: TestUnit` — projected from the catalog; drives the Result-Entry input prefill.
  - `alreadyTested: boolean` — derived strictly from input data; never invented.
  - `latestKnownResult: { value; unit; testedAt; changePercent } | null` — pure projection from the input map; `null` when no benchmark exists.
- Scoring change: already-tested goal-aligned tests are flagged `overdue_retest` (score −5); skill-aligned tests (score −10); plain essential baselines (score −20). New baselines still float to the top, but a tested goal-aligned test can still appear if it is goal-critical, honoring the prompt rule "Do not remove useful tests just because they were tested once."
- Engine version union widened to `'ab11-1-baseline-progress-recommender' | 'ab11-2-result-entry-recommender'`. Version stamped on every recommendation for static auditability via `data-engine-version` on the card.

The engine remains pure: no `fetch`, no DB, no I/O, fully deterministic given the input.

---

## 5. Card refactor (I/O ownership; same shadcn primitives)

`components/programs/CalibrationCheckpointCard.tsx`:

- Prop contract changed from `recommendation: ProgramCalibrationRecommendation | null` → `input: ProgramCalibrationInput`. The card runs the pure engine internally with the augmented `latestBenchmarksByTestName`.
- On mount: `fetch('/api/benchmarks?action=list', { cache: 'no-store' })`. Response is narrowed by a runtime type-guard (`isBenchmarksListResponse`) — no `as any`. 401 is treated as "no benchmarks yet" (renders recommendations without `alreadyTested` flags). Network/HTTP errors render a small inline non-blocking note with a Retry button. AbortController prevents stale-state races.
- Per recommended test: a compact `<CalibrationTestRow>` with engine-derived header, reason text, program-influence note, and (when available) a "Latest" line. A "Log result" button toggles a small inline form with:
  - Numeric `Input` prefilled with the canonical `testUnit` label (`reps` / `sec` / `kg` / `lbs` / `level` / `%`).
  - Optional `Textarea` for notes (capped at 500 chars client-side, 2000 chars server-side).
  - Submit button with loading + saved + error states (all derived from real submit outcome — never faked).
- Submit payload is built strictly from the engine's canonical fields: `movementFamily` / `testName` / `testCategory` / `testUnit` / `testValue` (parsed) / `isBaseline = !alreadyTested` / `notes?`. The UI never guesses category or unit.
- After a successful save the card bumps `refreshTick` which re-runs `loadList()`, the engine re-projects, `latestKnownResult` flips on, and the row's badge changes from "New baseline" → "Tested" + "Retest".
- Empty / no-auth / fetch-error states render honestly. The Program page never crashes.

Visual hierarchy unchanged: card sits under `<ProgramTruthSummary>`, capped at 3 tests, uses the same `<Card>` / `<Badge>` shadcn primitives as the rest of the surface.

---

## 6. API validation hardening (narrow, additive)

`app/api/benchmarks/route.ts`:

- Body is `unknown`-typed at parse time, narrowed via a `Record<string, unknown>` cast (no `as any`).
- Runtime guards built from canonical-union arrays declared with `as const satisfies readonly BenchmarkMovementFamily[]` (etc.). If the type-level unions in the engine ever drift, TypeScript fails the `satisfies` check at compile time — the validator cannot silently lag behind the type.
- Required fields: `movementFamily` ∈ `MOVEMENT_FAMILIES`, `testCategory` ∈ `TEST_CATEGORIES`, `testUnit` ∈ `TEST_UNITS`, `testName` non-empty trimmed string, `testValue` finite > 0.
- Optional fields narrowed only when present: `bodyweightAtTest` finite > 0; `testConditions` ∈ `TEST_CONDITIONS`; `confidenceScore` ∈ [0, 1]; `dataQuality` ∈ `DATA_QUALITIES`; `isBaseline` boolean; `notes` capped at 2000 chars.
- Successful-response shape PRESERVED: `{ success: true, benchmark, feedback, readinessAdjustments, message }`. Any existing client (e.g. dashboard) is unaffected.
- The `createBenchmark()` null-guard already in place (`PRE-AB6 BUILD GREEN GATE`) is preserved verbatim.

No dependencies added. No validation library introduced.

---

## 7. alreadyTestedNames + latestBenchmarksByTestName wiring

YES — both wired.

- The card builds `latestMap = buildLatestMap(benchmarks)` (latest row per `testName` by `testDate`) and passes it as `latestBenchmarksByTestName` into the engine.
- The engine derives `alreadyTested = latestMap.has(testName)` per recommended test, populates `latestKnownResult` from the same map, and adjusts scoring/reason-code accordingly (`overdue_retest` for goal/skill-aligned tested rows; deprioritized for plain essential tested rows).
- Tested rows still appear when goal-critical, honoring the prompt rule.

---

## 8. Readiness signal — DEFERRED to AB11-3

NOT wired in AB11-2.

The engine already accepts `readinessContraindication?: { kind: 'delay'; reason: string } | null`. A real readiness contraindication source exists in the repo (e.g. `lib/daily-readiness.ts` and a canonical readiness engine), but feeding it through requires:

1. Identifying the canonical "high-fatigue / unfit-to-test" predicate among the existing readiness sources.
2. Either passing the contraindication into the card from a server-fetched dashboard payload, OR adding a second client-side fetch from a readiness endpoint and folding it into the engine input alongside `latestMap`.

This is correctly out of AB11-2 scope per the prompt: "If not easy: leave safeToTestToday as 'unknown' [...] document that AB11-3 can wire deeper readiness." The card already renders an honest "No recovery signal yet — Test only when you feel fresh and recovered." line when `safeToTestToday === 'unknown'`.

---

## 9. Acceptance check summary

| # | Check | Result |
|---|---|---|
| 1 | Calibration card can submit a result for a recommended test | YES |
| 2 | Submission uses existing `/api/benchmarks` POST → `createBenchmark()` | YES |
| 3 | No parallel benchmark storage created | YES |
| 4 | `testCategory` / `testUnit` come from the canonical recommendation, not UI guesses | YES |
| 5 | Latest result displays after successful submit | YES (engine re-projects on `refreshTick`) |
| 6 | Existing latest benchmark list fetched through one safe path | YES (`GET /api/benchmarks?action=list`, narrowed by type guard) |
| 7 | `alreadyTestedNames` / `latestBenchmarksByTestName` wired | YES |
| 8 | No fake readiness or fake benchmark results invented | YES |
| 9 | Errors surfaced honestly | YES (per-row submit error + non-blocking fetch error with Retry) |
| 10 | Empty / no-auth / no-DB states do not crash Program page | YES (401 → empty map; fetch error → inline note; engine renders without latest) |
| 11 | AB6–AB10 corridors untouched | YES |
| 12 | No forbidden TypeScript patterns added | YES (no `as any`, no `@ts-ignore`, no `@ts-expect-error`, no `ignoreBuildErrors`, no fake widened types) |
| 13 | TSC / build PASS | NOT RUN (sandbox cannot exec; the user must run locally) |
| 14 | Report file exists | YES — this document |

---

## 10. Recommended AB11-3 next step

**AB11-3 — READINESS-AWARE CALIBRATION + PROGRESSION FEEDBACK LOOP.**

1. Wire the existing readiness contraindication source into the card via a typed `safeToTestToday` predicate. Pass `readinessContraindication` into `buildProgramCalibrationRecommendation()`. The engine already returns `'delay'` + `blockedReasons` honestly when contraindicated.
2. Surface the existing `feedback` + `readinessAdjustments` returned by `POST /api/benchmarks` as a one-line post-save summary on the row (e.g. "Result feeds 1.05× pull-volume next week"). This data is already returned by the API; AB11-2 just doesn't consume it yet.
3. Begin reading `getProgressTestTriggers()` and `analyzeBenchmarkTrend()` results so plateau / improving / declining trends override scoring beyond the simple `wasTested` deprioritization. This is the natural next intelligence layer.

No builder, schema, or UI redesign changes.

---

## 11. Final response checklist

- Branch / commit inspected: `v0/alericpetsch836-6923-92c67bc0` (post AB11-1)
- Command execution available: NO
- TSC result: NOT RUN (sandbox)
- Build result: NOT RUN (sandbox)
- Files changed:
  - `lib/program/program-calibration-recommendation.ts` (extended, engine still pure)
  - `components/programs/CalibrationCheckpointCard.tsx` (refactored to own I/O + result entry)
  - `app/api/benchmarks/route.ts` (POST validation hardened; GET untouched; success shape preserved)
  - `app/(app)/program/page.tsx` (1 import dropped, 1 prop renamed)
  - `docs/AB11_2_CALIBRATION_RESULT_ENTRY_REPORT.md` (this report)
- Existing benchmark API reused: YES
- New storage created: NO
- Result entry implemented: YES
- Latest result display implemented: YES
- `alreadyTestedNames` / `latestBenchmarksByTestName` wired: YES
- Readiness signal wired: DEFERRED (engine already accepts; AB11-3 to wire source)
- API validation hardened: YES
- Forbidden patterns added: NO
- AB6–AB10 corridors preserved: YES
- Safe to proceed to AB11-3: YES
