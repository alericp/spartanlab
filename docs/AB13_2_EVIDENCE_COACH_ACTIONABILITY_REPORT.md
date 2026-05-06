# AB13-2 — EVIDENCE COACH ACTIONABILITY REPORT

## 1. Branch / commit inspected
- **branch:** `v0/alericpetsch836-6923-250c231b`
- **predecessor:** AB13-1B Ready on `main` at PR #1232 / commit `ea40097`

## 2. Previous state
- **AB13-1 helper/component:** present and pure — `lib/program/evidence-derived-coach-recommendations.ts` + `components/programs/EvidenceCoachRecommendationCard.tsx`
- **AB13-1B Program page wiring:** intact — confirmed by grep at `app/(app)/program/page.tsx` lines 818, 819, 2498, 2509
- **Vercel/build state:** Ready on `main`

## 3. Files changed
- `lib/program/evidence-derived-coach-recommendations.ts` — extended types with AB13-2 actionability layer (`coachActionLabel`, `coachActionDetail`, `userNextStep`, `systemNextStep`, `truthStatusLabel`, `blockedReason?`, `evidenceQualityLabel`, `actionability`); new `EvidenceCoachActionability` and `EvidenceCoachEvidenceQuality` unions; new pure builders (`buildCoachActionFields`, `buildUserNextStep`, `buildSystemNextStep`, `buildTruthStatusLabel`, `mapConfidenceToEvidenceQuality`); helperVersion bumped to `'ab13-2-evidence-coach-actionability'`. All AB13-1 fields preserved verbatim.
- `components/programs/EvidenceCoachRecommendationCard.tsx` — added "What to do now" block (coachActionLabel, coachActionDetail, userNextStep, systemNextStep), new chip row (TruthStatus / EvidenceQuality / Actionability), honest "Why it is not applied yet" note when `blockedReason` is present, supporting note now also surfaces truth-status + coach action. New data attributes: `data-ab13-2-actionability`, `data-ab13-2-evidence-quality`, `data-ab13-2-truth-status`.
- `docs/AB13_2_EVIDENCE_COACH_ACTIONABILITY_REPORT.md` (this file).

## 4. Files inspected but not changed
- `app/(app)/program/page.tsx` — AB13-1B wiring already passes the bundle; no change needed.
- `components/programs/FeedbackLoopProofCard.tsx` — proof corridor untouched.
- `lib/program/evidence-aware-program-calibration-governor.ts` — used only via `import type` (verified `ProgramCalibrationPlanConfidence = 'low' | 'medium' | 'high'` and adjusted `mapConfidenceToEvidenceQuality` accordingly).
- `lib/program/evidence-calibration-generation-influence.ts` — used only via `import type`.
- `docs/AB13_1B_PROGRAM_PAGE_WIRING_ACCEPTANCE_CORRECTION_REPORT.md`.

## 5. Visual acceptance pre-check
- **EvidenceCoachRecommendationCard wired below FeedbackLoopProofCard:** PASS — `app/(app)/program/page.tsx:2503-2510` renders both cards inside `<div className="flex flex-col gap-3">`, same IIFE, same truth source.
- **Helper returns primary when expected:** PASS — verified by reading every branch of `deriveEvidenceCoachRecommendations`. For a typical AB12-2 default state (`influence.status === 'metadata_only'` + `suppressedConstraints.length > 0`), the helper returns a non-null `primary` with `status: 'suppressed'` and full AB13-2 fields. Card will render.

## 6. Helper changes
- **new fields added:** `coachActionLabel`, `coachActionDetail`, `userNextStep`, `systemNextStep`, `truthStatusLabel`, `blockedReason?`, `evidenceQualityLabel`, `actionability`.
- **state mapping updated:** every status branch (`active`, `observe`, `suppressed`, `waiting`, `degraded`) now passes through `buildCoachActionFields(status, ctx)` which returns a pure, typed object. Suppressed state populates `blockedReason` automatically; existing `suppressedReason` kept for back-compat.
- **helper remains pure:** PASS — no I/O, no React, no fetch, no DB, no localStorage. Only `import type` consumers from existing AB12 files.
- **no duplicate recommendation source:** PASS — grep finds exactly one `function deriveEvidenceCoachRecommendations` in the codebase.

## 7. Renderer changes
- **coach action block added:** PASS — new "What to do now" section under the recommendation block, displays `coachActionLabel` (font-medium), `coachActionDetail`, then a `<dl>` of "Your next step" + "What SpartanLab will do".
- **truth status shown:** PASS — `TruthStatusBadge` in the header chip row.
- **evidence quality shown:** PASS — `EvidenceQualityBadge` in the header chip row.
- **actionability shown:** PASS — `ActionabilityBadge` in the header chip row.
- **blocked/suppressed reason shown when present:** PASS — separate "Why it is not applied yet" note, neutral copy, no scary language.
- **renderer-only contract preserved:** PASS — every visible string comes from the bundle. No business logic. Constant maps for chip labels are deterministic and include all union members.

## 8. Fake-active audit
- **active requires `status === 'active'`:** PASS — gated in helper rule 3.
- **active requires `appliedToProgram === true`:** PASS — set to `true` only in active branch; explicitly `false` in every other branch.
- **suppressed does not claim mutation:** PASS — `truthStatusLabel: 'Detected, not applied'`, `actionability: 'blocked'`, `coachActionLabel: 'Keep training as written'`, `appliedToProgram: false`.
- **waiting does not claim evidence:** PASS — `evidenceQualityLabel: 'insufficient'`, `truthStatusLabel: 'Needs evidence'`, `appliedToProgram: false`.
- **degraded does not claim healthy calibration:** PASS — `truthStatusLabel: 'Evidence unavailable'`, `actionability: 'degraded'`, `evidenceQualityLabel: 'limited'`, `appliedToProgram: false`.

## 9. Truth-to-UI audit
- **helper owns copy:** PASS — every new visible string is built inside `buildCoachActionFields`, `buildUserNextStep`, `buildSystemNextStep`, or `buildTruthStatusLabel`.
- **bundle carries copy:** PASS — fields are part of `EvidenceCoachRecommendation`.
- **card renders copy:** PASS — renderer reads `primary.coachActionLabel`, etc., directly off the bundle.
- **Program page does not invent copy:** PASS — grep for `coachActionLabel|coachActionDetail|userNextStep|systemNextStep|truthStatusLabel` in `app/(app)/program/page.tsx` returns zero matches.

## 10. Build result
- **`pnpm exec tsc --noEmit --pretty false`:** NOT RUN — sandbox cannot execute pnpm. Code-level audit confirms zero `as any`, zero `@ts-ignore`, zero `@ts-expect-error`. All imports resolve to verified exported names. `mapConfidenceToEvidenceQuality` correctly handles the actual `'low' | 'medium' | 'high'` confidence union with a `default` arm for the synthetic `'insufficient'` mapping. Renderer's chip-label maps are exhaustive over all union members.
- **`pnpm run build`:** NOT RUN — sandbox cannot execute pnpm. The same audit applies. The previous AB13-1 helper compiled clean on production at PR #1232; AB13-2 only adds fields and pure helpers without touching any I/O.

## 11. Visible result expected
On the Program page, immediately below `FeedbackLoopProofCard`, the existing AI Coach card now shows:

- **Header chip row** with three new chips: a truth-status chip ("Applied to this program" / "Monitoring trend" / "Detected, not applied" / "Needs evidence" / "Evidence unavailable"), an evidence-quality chip ("Strong / Moderate / Limited / Insufficient evidence"), and an actionability chip ("Ready / Monitor / Collect evidence / Blocked / Degraded"). Existing status + confidence chips preserved.
- **A new "What to do now" panel** under the recommendation block containing:
  - the coach action label (font-medium),
  - one detail sentence,
  - "Your next step" — concrete user behavior,
  - "What SpartanLab will do" — the system-side reciprocal step.
- **A separate "Why it is not applied yet" note** whenever the bundle includes `blockedReason` (the AB12-2 default suppressed state always populates this).

Most users today will see: card title "Adjustment detected - not applied yet", chips reading "Detected, not applied / Limited evidence / Blocked", action panel "Keep training as written" with concrete user/system next steps, and the "Why it is not applied yet" note explaining the safe-builder-hook gate. Fake-active claims cannot fire under AB12-2 default hooks.

## 12. Final decision
**AB13-2 COMPLETE — safe to visually verify and then proceed to AB13-3.**

## 13. Next recommended step
After visual verification on the deployed Program page, **AB13-3 — wire the first real structural builder hook** (`progressionAggressiveness: 'conservative'`). Flip the corresponding `structuralHooks` flag in the AB12-2 default config inside the authoritative service stamp phase, and gate the existing progression-curve seam in `lib/adaptive-program-builder.ts` on `influence.progressionAggressiveness === 'conservative' && influence.allowedToMutateProgram`. Once AB13-3 lands, the AB13-2 card will switch to:
- title: "AI Coach Recommendation - Active"
- chips: "Applied to this program / Strong evidence / Ready"
- action panel: "Follow the calibrated adjustment"

— for the first time honestly, with no copy or chip changes needed in AB13-2.
