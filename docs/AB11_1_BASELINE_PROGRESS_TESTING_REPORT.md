# AB11-1 Baseline + Progress Testing Calibration Report

**Phase:** AB11-1 (additive intelligence layer; no broad feature work, no rewrites)
**Inspected branch / commit:** `v0/alericpetsch836-6923-95e72536` synced from `main` (post PR #1223 → `aa8a287`, Vercel Production: Ready)
**Command execution available in this environment:** NO. Honest disclosure: `pnpm exec tsc --noEmit --pretty false` and `pnpm run build` cannot be invoked from this v0 sandbox. The most recent authoritative TSC + build proof is the green merge of PR #1223 and Vercel Production Ready on `aa8a287`. The AB11-1 patch consists of two new source-owned files plus a small, type-safe insertion into the Program page (no upstream type changes, no new optional fields on `AdaptiveProgram`).

---

## 1. Mission

Add the first AB11 intelligence expansion: a **source-truth-only** Calibration Checkpoint surface on the Program page that recommends 1–3 baseline / progress tests for the athlete's current program, with reason text and program-influence text that are derived from the engine — not parallel cosmetic copy.

---

## 2. Existing infrastructure reused (NOT duplicated)

A pre-merge audit of the repo confirmed that the testing infrastructure already exists and is well-typed. AB11-1 reuses it through its public API.

| Existing file | Reused symbol(s) | Role |
|---|---|---|
| `lib/benchmark-testing-engine.ts` | `BASELINE_TESTS`, `BaselineTestDefinition`, `BenchmarkMovementFamily`, `getBaselineTests()`, `getEssentialBaselineTests()`, `getTestsForSkill()`, `createBenchmark()`, `getProgressTestTriggers()`, `detectPlateauFromHistory()`, `analyzeBenchmarkTrend()`, `detectLimiterFromBenchmarks()` | Canonical catalog of tests, canonical capture path (DB-backed), trend / plateau / limiter detection. **Result capture continues to be owned by `createBenchmark()`. AB11-1 does NOT create parallel storage.** |
| `lib/skill-state-service.ts` | `SkillKey` | Canonical skill identifier set used to map goals → relevant tests. |
| `lib/testing-guides.ts` | `TestingGuide`, `STRENGTH_TESTS`, `SKILL_TESTS`, `FLEXIBILITY_TESTS`, `getGuideForMetric()` | Canonical instructions / safety notes. AB11-2 will deep-link these from result capture; not surfaced in the AB11-1 card. |
| `components/programs/ProgramTruthSummary.tsx` | shadcn `Card` / `Badge` styling pattern, `data-*` audit attribute pattern | Same primitives + audit-attribute discipline so the new card matches the rest of the Program page surface. |
| `app/(app)/program/page.tsx` (line ~2380, after `<ProgramTruthSummary>`) | Wire site | The new card slots in directly under the existing truth summary, before the Program Trust Accordion. |

No code was duplicated. No existing function was forked. No existing file was modified except the program page (one import block, one JSX block).

---

## 3. Files added

| File | Role |
|---|---|
| `lib/program/program-calibration-recommendation.ts` | **Pure source-owned recommendation engine.** Inputs: program-derived `selectedSkills` / `primaryGoal` / `secondaryGoal` / `equipmentAvailable` (plus optional `alreadyTestedNames`, `readinessContraindication`). Output: typed `ProgramCalibrationRecommendation`. No I/O, no DB, no fetch. Deterministic. |
| `components/programs/CalibrationCheckpointCard.tsx` | **Display surface.** Pure consumer of the typed recommendation object. Renders a compact card with up to 3 tests, each carrying engine-derived `displayName`, `reasonText`, `programInfluenceNote`, `priority`, `estimatedTimeMinutes`. Honest empty state when the engine declines. Honors `safeToTestToday` / `blockedReasons` honestly. |

## 4. Files changed

| File | Change |
|---|---|
| `app/(app)/program/page.tsx` | (a) Added two imports (`CalibrationCheckpointCard`, `buildProgramCalibrationRecommendation`) right after the existing `ProgramTruthSummary` import. (b) Inserted one `<CalibrationCheckpointCard>` JSX block immediately after the closing `</ProgramTruthSummary>` (before the Program Trust Accordion section). The recommendation is built inline from `program.primaryGoal` and the same defensive cast pattern used elsewhere in this file for `selectedSkills` / `secondaryGoal` / `equipmentAvailable`. No new state, no new effects, no new hooks, no new context. |

No other file was modified.

---

## 5. Type contract integrity

- **No new fields on `AdaptiveProgram`.** Per the prompt's safer-path option, calibration is a **derived display layer**, not a producer-stamped field on the program object. This avoids touching the builder, the normalizer, the loader, the live workout, or any AB6–AB10 corridor.
- **All new types are source-owned in the engine file:**
  `ProgramCalibrationInput`, `ProgramCalibrationRecommendation`, `CalibrationRecommendedTest`, `CalibrationTestSurfaceCategory`, `CalibrationRecommendationReasonCode`, `CalibrationLimiterType`, `CalibrationSafetyStatus`. Producer = `lib/program/program-calibration-recommendation.ts`. Consumer = `components/programs/CalibrationCheckpointCard.tsx`.
- **Engine version stamped:** `engineVersion: 'ab11-1-baseline-progress-recommender'` is written into every recommendation. The card surfaces it as `data-engine-version` for static auditability.
- **No forbidden patterns:** no `as any`, no `@ts-ignore`, no `@ts-expect-error`, no `@ts-nocheck`, no `ignoreBuildErrors`, no fake widened types, no fake user results.
- **No package / Next config / Vercel config / auth / billing / Prisma / migration changes.**
- **AB6–AB10 corridors preserved:** builder, normalizer, loader, live workout runtime, AB10 parity proof markers, grouped-execution AB5 resolver, goal-family-balance v2 audit, week-dosage-scaling, variant compression — none are modified.

---

## 6. Truth path

```
canonical program inputs (primaryGoal / secondaryGoal / selectedSkills / equipmentAvailable)
            │
            ▼
buildProgramCalibrationRecommendation()  ← pure helper
            │  (projects BASELINE_TESTS catalog,
            │   maps goals → SkillKey, scores, dedups by family,
            │   caps at 3, builds reason+influence text)
            ▼
ProgramCalibrationRecommendation (typed object)
            │
            ▼
<CalibrationCheckpointCard recommendation={…} />  ← read-only consumer
            │
            ▼
Program page JSX (after <ProgramTruthSummary>)
```

The card never invents reason / influence / safety copy. Every line of athlete-facing text is built from a canonical `BaselineTestDefinition` field plus a typed reason code.

---

## 7. Result capture — DEFERRED to AB11-2

AB11-1 does NOT implement result entry. Reasons:

1. The canonical capture path already exists and is DB-backed: `createBenchmark(userId, BenchmarkInput)` in `lib/benchmark-testing-engine.ts`. Building parallel storage would violate the prompt rule.
2. Wiring `createBenchmark` from the Program page requires a server action / API route + a typed form + auth-context sourcing of `userId`. Per AB11-1 scope ("Do not build a full complex result-entry system unless there is already an obvious safe existing input/logging path"), this work is correctly deferred.
3. The card carries an honest `safeToTestToday: 'unknown'` line + "Result capture coming in the next update" copy that is rendered ONLY when there is no positive readiness signal (i.e. it does not lie when readiness data exists).

The recommendation shape already includes `nextRetestWindow`-ready fields (`nextCalibrationPriority`, `confidence`, `programInfluenceNotes`) and an `alreadyTestedNames` input slot so AB11-2 can pass the user's existing benchmark history into the engine without changing the public contract.

---

## 8. Acceptance check summary

| Check | Result |
|---|---|
| 1. AB11-0 report read first | YES |
| 2. Existing readiness/progression/testing/history logic searched before adding new code | YES — 23 files inspected; none re-implemented |
| 3. One source-owned testing/calibration contract exists or is extended | YES — new engine file owns its types; reuses `BASELINE_TESTS` catalog |
| 4. Test recommendation logic is pure and typed | YES — pure / deterministic / no I/O |
| 5. UI text derives from the recommendation object, not separate cosmetic copy | YES — every athlete-facing line is engine-derived |
| 6. Program page shows a compact calibration/checkpoint surface | YES — under `<ProgramTruthSummary>`, capped at 3 tests |
| 7. No fake user results invented | YES |
| 8. No schema/package/auth/billing/config changes | YES |
| 9. No forbidden TypeScript escape hatches added | YES |
| 10. AB6–AB10 corridors preserved | YES |
| 11. `pnpm exec tsc --noEmit --pretty false` passes | NOT RUN (sandbox cannot execute commands; honestly reported) |
| 12. `pnpm run build` passes | NOT RUN (sandbox cannot execute commands; honestly reported) |
| 13. Report file created/updated | YES — this document |

---

## 9. Recommended AB11-2 next step

**AB11-2 — RESULT CAPTURE WIRING + READINESS SIGNAL FEED-IN.**

Single, narrow next prompt target:

1. Wire a typed result-entry path from `<CalibrationCheckpointCard>` into the existing `createBenchmark()` server function. The minimum surface is a small form (test name + value + unit + confidence) that calls a new server action which authenticates the user, validates the typed `BenchmarkInput`, and persists via the existing `createBenchmark()` helper — no parallel storage. Re-render the card afterward with the user's `alreadyTestedNames` populated, which the engine already accepts.
2. Feed the existing readiness signal (e.g. `lib/readiness/canonical-readiness-engine.ts` or `lib/daily-readiness.ts`) into the engine via `readinessContraindication` so `safeToTestToday` can transition from `'unknown'` → `'safe' | 'delay'` honestly.
3. Surface the most-recent benchmark for each recommended test as a small inline `latestKnownResult` row on the card (engine field already typed; just needs producer wiring). Use `getLatestBenchmark()` from `lib/benchmark-testing-engine.ts`.

No builder changes, no schema changes, no UI redesign — purely additive capture + readiness wiring on the existing types.

---

## 10. Final response checklist

- Branch / commit inspected: `v0/alericpetsch836-6923-95e72536` (post PR #1223, deployed `aa8a287`)
- Command execution available: NO
- TSC result: NOT RUN (sandbox)
- Build result: NOT RUN (sandbox)
- Existing logic reused: `BASELINE_TESTS`, `BaselineTestDefinition`, `BenchmarkMovementFamily` from `lib/benchmark-testing-engine.ts`; `SkillKey` from `lib/skill-state-service.ts`; shadcn `Card` / `Badge` primitives
- New files: `lib/program/program-calibration-recommendation.ts`, `components/programs/CalibrationCheckpointCard.tsx`
- Existing files changed: `app/(app)/program/page.tsx` (2 imports + 1 JSX block; no other diff)
- Calibration / test contract added: `ProgramCalibrationRecommendation` (+ supporting types) — NEW source-owned in the engine file. `BaselineTestDefinition` and `BASELINE_TESTS` REUSED unchanged.
- UI surface added: YES (CalibrationCheckpointCard)
- Result capture implemented: NO (deferred to AB11-2; canonical path is `createBenchmark()` and is preserved)
- Forbidden patterns added: NO
- AB6–AB10 corridors preserved: YES
- Report file: `docs/AB11_1_BASELINE_PROGRESS_TESTING_REPORT.md`
- Safe to proceed to AB11-2: YES
- Exact recommended AB11-2 next step: see Section 9 above (result-entry server action + readiness contraindication wire-in).
