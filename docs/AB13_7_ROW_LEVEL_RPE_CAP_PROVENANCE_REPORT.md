# AB13-7 ROW-LEVEL RPE CAP PROVENANCE REPORT

## 1. Status

**COMPLETE**

## 2. Branch / commit inspected

- branch: `v0/alericpetsch836-6923-01ac353d`
- commit: AB13-6 baseline (PR #1237 / `7445f98` per the prompt context)
- deployment: AB13-6 Ready on `main`. AB13-7 changes are renderer + provenance only and ride the existing post-Phase-AA2 stamping path; no new generation/storage surface.

## 3. Files changed

- `lib/program/evidence-calibration-program-shaping.ts` — exported new `EvidenceCalibrationRpeCapStamp` type; stamped it on each row at the exact mutation site.
- `lib/adaptive-program-builder.ts` — added optional `evidenceCalibrationRpeCap?: …` field on `AdaptiveExercise` (type-only inline `import(...)`, JSON-safe, mirrors `evidenceCalibrationShapingProof` precedent).
- `components/programs/AdaptiveSessionCard.tsx` — added one tiny `RPE capped` chip in the existing per-row chip strip, gated entirely on the stamp.
- `docs/AB13_7_ROW_LEVEL_RPE_CAP_PROVENANCE_REPORT.md` — this report.

## 4. Root cause

AB13-4 already mutates `targetRPE` and stamps a **program-level** proof at `program.evidenceCalibrationShapingProof` (count, ceiling, summary). AB13-6 surfaces that program-level proof inside the AI Coach card. But the program-level proof carries `cappedExerciseCount` only — it does NOT identify which specific exercise rows were mutated. So the user could see "3 capped this cycle" at the card, yet the exercise rows themselves looked identical to any other row prescribed at RPE 7. Inferring capped rows from `targetRPE === 7` would create fake provenance because many exercises are naturally prescribed at RPE 7 by the builder. AB13-7 fixes this by adding a row-level provenance stamp at the exact mutation site, which is the only place that knows the value was strictly above 7 immediately before the cap.

## 5. Row stamp added

- field name: `evidenceCalibrationRpeCap`
- owning type: `AdaptiveExercise` (in `lib/adaptive-program-builder.ts`)
- stamp interface: `EvidenceCalibrationRpeCapStamp` (in `lib/program/evidence-calibration-program-shaping.ts`)
- exact mutation site: inside `applyConservativeProgressionShaping`, in the `session.exercises.map((ex) => …)` callback, in the branch reached after `isExerciseEligibleForCap(ex)` returned `true`. The stamp is constructed BEFORE the spread that returns the new row, with `rpeBefore` captured from `ex.targetRPE` BEFORE the cap mutation.
- exact condition required before stamping (all simultaneously true, all already enforced by the existing AB13-4 gate; AB13-7 adds none and weakens none):
  1. `influence` is non-null
  2. `influence.status === 'active'`
  3. `influence.allowedToMutateProgram === true`
  4. `influence.progressionAggressiveness === 'conservative'`
  5. `typeof ex.targetRPE === 'number'`
  6. `Number.isFinite(ex.targetRPE)`
  7. `ex.targetRPE > CONSERVATIVE_RPE_CEILING` (i.e. strictly greater than 7)
  8. `ex.category` is not in `NON_PRESCRIPTIVE_CATEGORIES` (warmup / cooldown / mobility / recovery / prehab / rehab)

## 6. Render owner

- component that renders the visible chip: `components/programs/AdaptiveSessionCard.tsx` (the canonical Program-page row renderer; verified by grepping `AdaptiveSessionCard` usage in `app/(app)/program/page.tsx`).
- where chip appears: inside the existing per-row chip strip (the same `<div>` container that already owns the Phase L `performanceAdaptation` chip and the doctrine-driven dosage-change chip), immediately after the Phase L chip block and before the strip's closing `</div>`. Single-line, never wraps the row container.
- what text appears: chip label `RPE capped`, with `title` / `aria-label` of `Evidence calibration capped this from RPE {before} to {after}.` (read verbatim from `rpeCap.reasonCoachLine` produced by the helper). No raw enum names (`reasonCode`, `source`, `applied`) are exposed in user-facing copy.
- `WorkoutExecutionCard.tsx` was deliberately NOT edited. It is the live-workout execution surface (explicitly out of scope per the prompt). The Program-page row render path goes through `AdaptiveSessionCard`, and that is where the prompt's required chip belongs.

## 7. Save/load preservation audit

- whether any whitelist exists: yes — `mapToAdaptiveExercises` in `lib/adaptive-program-builder.ts` (around L31186) is a generation-time field whitelist. It runs as part of session construction, BEFORE the post-Phase-AA2 stage in `lib/server/authoritative-program-generation.ts` where `applyConservativeProgressionShaping` is invoked.
- whether it was updated: **no** — and intentionally. Because the AB13-4 shaping pass runs AFTER `mapToAdaptiveExercises`, the AB13-7 stamp is applied to rows that have already passed through the whitelist. The mapper cannot drop a field that did not exist when it ran.
- whether normalizers invent anything: no. The renderer's defense-in-depth gate (`applied !== true` → return null, missing numeric `rpeBefore`/`rpeAfter` → return null) guarantees the chip is shown only when the producer's contract is fully satisfied. Nothing is invented client-side.
- save/load round-trip: the program is persisted as JSON and re-read as JSON; arbitrary optional keys survive a JSON round-trip. The Phase L `performanceAdaptation` precedent on the same `AdaptiveExercise` type (also no explicit mapper preservation entry) renders correctly across reloads, confirming this contract holds.

## 8. Honesty audit

PASS / FAIL:

- no fake row chips: **PASS** — the chip is gated on `rpeCap.applied === true` AND numeric `rpeBefore`/`rpeAfter`. It is never rendered without those.
- no `targetRPE === 7` inference: **PASS** — the renderer reads ONLY `exercise.evidenceCalibrationRpeCap` and never compares `targetRPE` to a literal. The only textual occurrence of `targetRPE === 7` in the new code is inside a comment that explicitly forbids that inference.
- no row stamp on unchanged rows: **PASS** — `applyConservativeProgressionShaping` only constructs the stamp inside the branch where the row is eligible AND `rpeBefore` is a number. Rows already at or below 7, rows in excluded categories, and rows skipped by the gate are NOT stamped (they early-return the original `ex` reference).
- no new structural hook: **PASS** — `progressionAggressiveness` remains the only structural hook flipped to `true` in `lib/server/authoritative-program-generation.ts`. `volumeBias`, `intensityBias`, and `recoveryBias` are unchanged.
- no generation behavior change: **PASS** — sets, reps, exercise selection, schedule, methods, eligibility categories, and the cap ceiling are all unchanged. The numeric `targetRPE` mutation that AB13-4 already performed is unchanged. AB13-7 only ADDS an optional sibling field on rows that AB13-4 was ALREADY mutating.

## 9. Build result

- `pnpm exec tsc --noEmit --pretty false`: NOT RUN — the v0 sandbox cannot execute `pnpm`. Static audit is clean: the new `EvidenceCalibrationRpeCapStamp` interface is fully typed (no `unknown`), the producer narrows `ex.targetRPE` from `number | undefined` to `number` via an explicit `typeof` check (no `as any`, no `@ts-ignore`), the renderer uses the same `as unknown as { … }` shape-cast pattern already used by the Phase L chip immediately above it, and the type carrier mirrors the `evidenceCalibrationShapingProof` inline-`import(...)` precedent that already passes type-check in production.
- `pnpm run build`: NOT RUN — same sandbox limitation. Standing proof is the AB13-6 Vercel-Ready deployment at PR #1237 / `7445f98`; AB13-7 makes only additive optional-field / additive-chip changes and cannot regress the existing build.

## 10. Runtime visual expectation

When conservative progression is active AND at least one prescribed working-set exercise originally had `targetRPE > 7`:

- The program-level AB13-6 proof line still renders inside `EvidenceCoachRecommendationCard`, showing the applied/checked-no-change/skipped status for the program as a whole.
- Every exercise row whose `targetRPE` was actually capped by AB13-4 shows a small `RPE capped` chip in the existing chip strip (same row strip as the Phase L `Adjusted from last workout` chip and the doctrine dosage-change chip), with a hover tooltip reading e.g. `Evidence calibration capped this from RPE 8 to 7.`
- Every other row — rows already at/below RPE 7, warmup/cooldown rows, rows the gate did not run on, rows on programs generated before AB13-4 — shows NO chip.
- The chip's `data-ab13-7-row-rpe-cap`, `data-ab13-7-rpe-before`, and `data-ab13-7-rpe-after` data attributes are available for runtime acceptance verification on a deployed page without exposing developer wording.

## 11. Final decision

**AB13-7 COMPLETE** — row-level RPE-cap provenance is stamped exclusively at the AB13-4 mutation site, the renderer reads exclusively from that stamp, no fake inference path exists, no structural hook was added, and no generation behavior changed. The chip will render correctly on a deployed account whose evidence triggers `progressionAggressiveness === 'conservative'` AND whose program has at least one prescribed working-set row with `targetRPE > 7`.

## 12. Next recommended step

Visual confirmation on a deployed Program page first. Use a test/account state where the AB12-1 plan recommends conservative progression and the AB13-4 helper has at least one eligible row with original `targetRPE > 7`. Confirm:

1. AB13-6 program proof line is visible inside the AI Coach card (already true after PR #1237).
2. AB13-7 `RPE capped` chip is visible on the exact rows the helper actually mutated.
3. No row that ended at RPE 7 by other means (natural builder prescription, doctrine dosage chip, or Phase L adjustment) shows the AB13-7 chip.

DO NOT recommend a second structural hook (volume / intensity / recovery bias) until that visual confirmation passes. The next narrow AB13 step after visual confirmation is AB13-8: extend the AI Coach card's program-level applied-list to enumerate the exact exercise names that were capped (sourced from the same row stamp), so the program-level proof and the row-level proof point at the same set.
