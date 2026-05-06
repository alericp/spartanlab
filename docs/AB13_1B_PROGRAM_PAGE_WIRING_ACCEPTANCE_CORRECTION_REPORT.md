# AB13-1B PROGRAM PAGE WIRING ACCEPTANCE CORRECTION REPORT

## 1. Branch / commit inspected
- **branch:** `v0/alericpetsch836-6923-76cda78e`
- **predecessor:** AB13-1 logic/component shipped on PR #1231 / commit `caf5fed`

## 2. Root issue
**AB13-1 helper/component existed but Program page wiring was missing in the pulled snapshot.**

Pre-fix grep on `app/(app)/program/page.tsx`:
- `deriveEvidenceCoachRecommendations` → 0 matches
- `EvidenceCoachRecommendationCard` → 0 matches

The IIFE at line 2473–2495 still returned only `<FeedbackLoopProofCard ... />`. The helper file `lib/program/evidence-derived-coach-recommendations.ts` (export `deriveEvidenceCoachRecommendations`, lines 191–194) and the component file `components/programs/EvidenceCoachRecommendationCard.tsx` (export `EvidenceCoachRecommendationCard`, line 49) were both intact, so this was a pure wiring regression.

## 3. Files changed
- `app/(app)/program/page.tsx` (added 2 imports near the existing `FeedbackLoopProofCard` import; wrapped the IIFE return in a `<div className="flex flex-col gap-3">` containing both cards; derived the coach bundle from the same `calibrationPlan` + `generationInfluence` already in scope)
- `docs/AB13_1B_PROGRAM_PAGE_WIRING_ACCEPTANCE_CORRECTION_REPORT.md` (NEW, this file)

## 4. Files inspected but not changed
- `lib/program/evidence-derived-coach-recommendations.ts` (helper export verified; not modified)
- `components/programs/EvidenceCoachRecommendationCard.tsx` (component export + props verified; not modified)
- `components/programs/FeedbackLoopProofCard.tsx` (proof card preserved as-is)
- `docs/AB13_1_EVIDENCE_DERIVED_COACH_RECOMMENDATIONS_REPORT.md` (left intact; this report supersedes its wiring claim)

## 5. Program page wiring proof
- `deriveEvidenceCoachRecommendations` imported: **PASS** (line 819)
- `EvidenceCoachRecommendationCard` imported: **PASS** (line 818)
- bundle derived from `calibrationPlan` + `generationInfluence`: **PASS** (line 2498, called inside the same IIFE that owns those variables)
- card rendered directly below `FeedbackLoopProofCard`: **PASS** (line 2509, inside `<div className="flex flex-col gap-3">` directly after the proof card)
- no parallel recommendation copy created: **PASS** (zero new strings; the renderer reads `bundle.primary.title/summary/recommendation` returned by the helper)

## 6. Truth source proof
- **workout summary source:** `summarizeWorkoutEvidence(buildWorkoutEvidenceSignalsFromProgramStamps(program))` — same as AB11/AB12-1 proof card
- **calibration plan source:** `buildEvidenceAwareCalibrationPlan({ workoutSummary, inputAvailability: { workout: 'ok', benchmark: 'absent' } })` — same call already feeding the proof card
- **generation influence source:** `program.evidenceCalibrationInfluence ?? null` — the canonical AB12-2 stamp on the typed `AdaptiveProgram` field
- **coach bundle source:** `deriveEvidenceCoachRecommendations({ plan: calibrationPlan, influence: generationInfluence })` — pure helper, exact same `plan` and `influence` variables passed to the proof card
- **rendered card source:** `<EvidenceCoachRecommendationCard bundle={coachRecommendationBundle} />` — renderer-only; cannot drift from the bundle

## 7. Duplicate/fake-AI audit
- duplicate helper avoided: **PASS** (the existing helper is the only producer)
- duplicate storage avoided: **PASS** (no DB, no localStorage, no fetch added)
- fake active claim avoided: **PASS** (active state is gated by `influence.status === 'active' && influence.allowedToMutateProgram`, which AB12-2 default hooks cannot trip)
- component hardcoding avoided: **PASS** (Program page wiring contains zero coach copy strings)
- proof card preserved: **PASS** (FeedbackLoopProofCard JSX and props unchanged)
- AB12 influence logic unchanged: **PASS** (no edits to `lib/server/authoritative-program-generation.ts`, `lib/program/evidence-calibration-generation-influence.ts`, or `lib/program/evidence-aware-program-calibration-governor.ts`)
- live workout untouched: **PASS**
- schema untouched: **PASS**

## 8. Build status
- `pnpm exec tsc --noEmit --pretty false`: **NOT RUN** — sandbox cannot execute pnpm
- `pnpm run build`: **NOT RUN** — same

Code-level verification:
- Both imports use the verified export names from the helper and component files.
- The bundle derivation uses the helper's exact prop contract: `{ plan: ProgramEvidenceCalibrationPlan | null, influence: EvidenceCalibrationGenerationInfluence | null }`.
- The component is invoked with its sole `bundle` prop (`EvidenceCoachRecommendationCardProps`).
- All variables (`calibrationPlan`, `generationInfluence`, `workoutSummary`) were already in scope inside this IIFE before the change.
- Zero `as any`, `@ts-ignore`, `@ts-expect-error`, or type-weakening introduced.

## 9. Expected visible result
On the Program page, immediately below the existing FeedbackLoopProofCard, a second compact card with title "AI Coach" and one of these honest states:
- **Waiting for evidence** — for fresh programs without `performanceAdaptation` stamps
- **Coach Recommendation - Observing** — when evidence exists but plan stays observe
- **Adjustment detected - not applied yet** — for AB12-2's default suppressed state (most common state today, since AB12-2 left every structural hook off)
- **Evidence unavailable - safe baseline** — for degraded
- **AI Coach Recommendation - Active** — only after AB13-2 wires the first real builder hook

When the helper's bundle has `primary: null`, the renderer returns `null` and the card is silently absent. No fake-active state can fire on AB12-2 defaults.

## 10. Final decision
**AB13-1B COMPLETE — AB13-1 is now visibly accepted.** Safe to proceed to AB13-2 *after* visual confirmation on the deployed Program page.

## 11. Next recommended prompt
**AB13-2 — wire the first real structural builder hook.** Concretely:
1. In `lib/server/authoritative-program-generation.ts`, flip `progressionAggressiveness: false` to `true` inside the `structuralHooks` config passed to `buildEvidenceCalibrationGenerationInfluence`.
2. Add an optional typed `evidenceCalibrationInfluence?` field to `AdaptiveProgramInputs` in `lib/adaptive-program-builder.ts`.
3. Pass the influence into the existing performance-adaptation seam where `applyFuturePrescriptionMutations` decides next-cycle progression delta.
4. Gate the existing aggressive progression branch on `influence.progressionAggressiveness !== 'conservative' || !influence.allowedToMutateProgram`.

Once AB13-2 lands, the AB13-1B card will switch from "Adjustment detected - not applied yet" to "AI Coach Recommendation - Active" honestly for the first time.

---

## Final output

1. **AB13-1B status:** COMPLETE
2. **Exact files changed:** `app/(app)/program/page.tsx`, `docs/AB13_1B_PROGRAM_PAGE_WIRING_ACCEPTANCE_CORRECTION_REPORT.md`
3. **Build result:**
   - `pnpm exec tsc --noEmit --pretty false` — not executable in sandbox; code-level audit clean (zero `as any`, all imports resolve to verified exports, all variables in scope)
   - `pnpm run build` — same
4. **Visible Program-page change expected:** A compact "AI Coach" card now renders directly below the FeedbackLoopProofCard inside a `flex flex-col gap-3` wrapper, showing one of five honest states derived deterministically from the same `calibrationPlan` + `generationInfluence` the proof card already trusts.
5. **Safe to proceed to AB13-2:** YES, conditional on user visually confirming the new card appears on the deployed Program page.
