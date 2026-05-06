# AB13-6 SHAPING PROOF VISIBLE SURFACING REPORT

## 1. Status
COMPLETE

## 2. Branch / commit inspected
- branch: `v0/alericpetsch836-6923-6e741c4b`
- commit: post-AB13-5 snapshot pulled into this chat (AB13-5 was a no-code report-only step)
- deployment: AB13-4 still standing as the last code-affecting Vercel-Ready deployment (PR #1235 / `ac9d0b2`); AB13-5 deployed report-only on PR #1236

## 3. Files changed
- `lib/program/evidence-derived-coach-recommendations.ts`
  - Added optional `shapingProof?: EvidenceCalibrationShapingProof | null` to `deriveEvidenceCoachRecommendations` args.
  - Added new exported type `EvidenceCoachShapingProofStatus`.
  - Added three new optional fields on `EvidenceCoachRecommendation`: `programShapingProofStatus`, `programShapingProofLabel`, `programShapingProofDetail`.
  - Added new pure builder `buildProgramShapingProofFields` + `buildShapingSkippedDetail`.
  - Bumped `helperVersion` literal from `'ab13-2-evidence-coach-actionability'` to `'ab13-6-evidence-coach-shaping-proof'`. No external consumer references the old literal.
  - Spread `...(shapingFields ?? {})` onto every primary recommendation literal (active, observe, suppressed, waiting, degraded). Supporting note left untouched (no duplication).
- `app/(app)/program/page.tsx`
  - Reads `program.evidenceCalibrationShapingProof ?? null` next to the existing `program.evidenceCalibrationInfluence ?? null`.
  - Passes the proof verbatim into the existing `deriveEvidenceCoachRecommendations({ ... })` call. No local builder, no inspection of proof internals.
- `components/programs/EvidenceCoachRecommendationCard.tsx`
  - Imports new `EvidenceCoachShapingProofStatus` type.
  - Adds `data-ab13-6-shaping-proof-status` attribute on the Card root.
  - Renders new `<ProgramShapingProofLine />` sub-renderer at the bottom of the existing "What to do now" panel.
  - Adds the pure `ProgramShapingProofLine` sub-renderer. Hides itself silently when `label` or `detail` are undefined.
- `docs/AB13_6_SHAPING_PROOF_VISIBLE_SURFACING_REPORT.md` (new)

## 4. Root cause
Confirmed root cause #1 from the AB13-6 ranking: the canonical AB13-4 proof exists on `program.evidenceCalibrationShapingProof` but was not being passed into the helper bundle, so the renderer could only show active/suppressed states and could not distinguish "active + capped N exercises", "active + no exercise required capping", "skipped (safe reason)", or "unavailable (older program)". The fix is fully renderer-only: read the proof, pass it through the helper, render one helper-derived line. No generation behavior, no shaping logic, no schema, no storage changes.

## 5. Source-of-truth path
- final program object: `program` (already used by every existing card in the same Program-page IIFE)
- proof field: `program.evidenceCalibrationShapingProof` (typed optional on `AdaptiveProgram` since AB13-4)
- helper input: `deriveEvidenceCoachRecommendations({ plan, influence, shapingProof })`
- card prop: `bundle.primary.programShapingProofLabel` + `bundle.primary.programShapingProofDetail` + `bundle.primary.programShapingProofStatus`
- render location: inside the existing "What to do now" panel of `EvidenceCoachRecommendationCard`, separated by a thin top border so it reads as a coaching footer rather than a duplicate panel

## 6. User-facing copy added
All copy is owned by the helper; the renderer only displays it.

- applied/capped state:
  - label: `"Program shaping applied"`
  - detail: ``Capped {N} working-set RPE target{s} at RPE {ceiling} this cycle.``
- checked/no capping needed state:
  - label: `"Program shaping checked"`
  - detail: ``Conservative progression is active, but no exercise needed an RPE cap (every prescribed RPE was already at or below {ceiling}).``
- skipped/not triggered state:
  - label: `"Program shaping not applied"`
  - detail (per safe reason):
    - `progression_not_conservative` → `"Current evidence does not call for conservative progression on this program."`
    - `status_not_active` → `"The recommendation is being monitored, not applied to this program."`
    - `not_allowed_to_mutate` → `"The recommendation is held back from mutating this program for safety."`
    - `no_influence` → `"No evidence influence was available when this program was generated."`
- proof unavailable behavior:
  - Helper returns `undefined`. All three optional fields stay `undefined`. The renderer's `ProgramShapingProofLine` returns `null` and the card looks identical to its AB13-2 form.

## 7. Honesty audit
- no fake active: PASS — `appliedToProgram: true` still requires `influence.status === 'active' && influence.allowedToMutateProgram === true`. The new shaping fields cannot promote a non-active recommendation.
- no fake applied: PASS — `programShapingProofStatus: 'applied'` requires BOTH `proof.ranShapingPass === true` AND `proof.appliedAtLeastOneMutation === true`. The "active no-op" state correctly maps to `'checked_no_change'`, not `'applied'`.
- no raw debug fields: PASS — user-facing copy never references `ranShapingPass`, `cappedExerciseCount`, `skippedReason`, or `ceilingRpe` enum identifiers. The numeric ceiling is rendered as `RPE 7` only.
- no duplicate recommendation logic: PASS — only one producer (`buildProgramShapingProofFields`), only one consumer (each primary recommendation literal spread), zero recommendation builders in components or Program page.
- no local Program page proof builder: PASS — Program page only reads `program.evidenceCalibrationShapingProof` and passes it to the helper. Grep confirmed no references to `programShapingProofLabel`, `programShapingProofDetail`, `programShapingProofStatus`, `cappedExerciseCount`, or `ranShapingPass` in `app/(app)/program/page.tsx`.

## 8. Build result
- `pnpm exec tsc --noEmit --pretty false`: NOT RUN (sandbox cannot execute pnpm). Code-level audit clean. Type contracts:
  - `shapingProof?: EvidenceCalibrationShapingProof | null` is optional, so all existing `deriveEvidenceCoachRecommendations({ plan, influence })` callers (none in code today, only the one Program-page caller already updated) compile unchanged.
  - All three new recommendation fields are optional (`?`), so every existing primary literal compiles unchanged after the spread.
  - `helperVersion` literal bumped to `'ab13-6-evidence-coach-shaping-proof'`; no external consumer references the prior literal (verified via grep).
  - `ProgramShapingProofLine` accepts `string | undefined` props and short-circuits when undefined, so the optional-field pattern is safe.
  - Switch in `buildShapingSkippedDetail` is exhaustive over `NonNullable<EvidenceCalibrationShapingProof['skippedReason']>` (`'no_influence' | 'status_not_active' | 'not_allowed_to_mutate' | 'progression_not_conservative'`).
- `pnpm run build`: NOT RUN (sandbox cannot execute pnpm). Standing AB13-4 Vercel-Ready proof on PR #1235 is the closest passing build. AB13-5 was no-code; AB13-6 only adds optional fields and a renderer-only sub-component.

## 9. Runtime visual expectation
On the deployed Program page, directly below the existing "What to do now" panel inside the AI Coach card, users will see ONE subtle line separated by a thin top border:

- When AB13-4 actively capped exercises:
  > **PROGRAM SHAPING APPLIED**
  > Capped 3 working-set RPE targets at RPE 7 this cycle.

- When AB13-4 ran but no capping was needed (active no-op — the previously invisible state):
  > **PROGRAM SHAPING CHECKED**
  > Conservative progression is active, but no exercise needed an RPE cap (every prescribed RPE was already at or below 7).

- When AB13-4 was skipped because the plan did not call for conservative progression:
  > **PROGRAM SHAPING NOT APPLIED**
  > Current evidence does not call for conservative progression on this program.

- When AB13-4 was skipped for safety (not active / not allowed to mutate):
  > **PROGRAM SHAPING NOT APPLIED**
  > The recommendation is being monitored, not applied to this program.
  > *(or the "held back from mutating this program for safety" variant)*

- When the program was generated before AB13-4 (no proof stamped): the line is silently omitted; the card looks identical to its AB13-2 form. Honest "unavailable" state.

The line is small text, muted-foreground, separated only by a thin top-border. No new panel, no debug clutter, no JSON, no AB-phase identifiers in user-facing copy.

## 10. Final decision
- AB13-6 COMPLETE: the canonical AB13-4 shaping proof is now visibly surfaced on the Program page through the existing card path, with helper-owned honest copy across all four meaningful states and a silent omission for the unavailable state. No fake active/applied claims; no duplicate recommendation path; no generation behavior change; no schema/storage change.

## 11. Next recommended step
**Visual confirmation first.** Recommend asking the user to verify on a deployed account that:
1. The new "PROGRAM SHAPING …" line appears at the bottom of the existing "What to do now" panel.
2. The state matches the user's actual evidence/program (most production accounts will see the "skipped — current evidence does not call for conservative progression" variant; that is honest and expected).
3. No raw enum names appear anywhere in the visible UI.

**Do not** advance to a second structural hook (volumeBias / intensityBias / recoveryBias) until at least one deployed account is observed showing either the "applied" or the "checked, no change" variant — that is the only proof that AB13-4's structural mutation chain is fully alive end-to-end.

If visual confirmation passes, the next narrow step is **AB13-7**: add a tiny exercise-row chip surface that reads the same `program.evidenceCalibrationShapingProof` and labels capped exercises (e.g. "RPE 7 (cap)") so the per-exercise proof matches the card's per-program proof. Renderer-only. No new structural hook.
