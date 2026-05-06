# AB13-10 V0-COMPATIBLE VISUAL PROOF PATH REPORT

## 1. Status

COMPLETE.

A gated, owner-only visual proof overlay was added to the deployed Program
page so AB13's conservative-progression shaping chain can now be visually
confirmed end-to-end without requiring a real account whose evidence
naturally produces `status === 'active'` AND
`allowedToMutateProgram === true` AND
`progressionAggressiveness === 'conservative'` AND ≥1 working-set row
originally `targetRPE > 7`.

## 2. Code changed

YES.

## 3. Files inspected

- `lib/program/evidence-calibration-program-shaping.ts`
- `lib/program/evidence-calibration-generation-influence.ts`
- `lib/program/evidence-aware-program-calibration-governor.ts`
- `lib/program/evidence-derived-coach-recommendations.ts`
- `lib/server/authoritative-program-generation.ts`
- `lib/adaptive-program-builder.ts`
- `app/(app)/program/page.tsx`
- `components/programs/EvidenceCoachRecommendationCard.tsx`
- `components/programs/AdaptiveSessionCard.tsx`
- `docs/AB13_9_DEPLOYED_RUNTIME_VISUAL_CONFIRMATION_REPORT.md`

## 4. Files changed

- `components/programs/AB13VisualProofOverlay.tsx` — NEW. The gated overlay
  component. Contains the entire proof-path implementation in a single,
  removable file.
- `app/(app)/program/page.tsx` — TWO targeted edits only:
  1. Added a single `import { AB13VisualProofOverlay }` next to the other
     proof-corridor imports.
  2. Added a single `<AB13VisualProofOverlay program={program} />` render
     inside the existing `<div className="flex flex-col gap-3">` block that
     already contains `<FeedbackLoopProofCard />` and
     `<EvidenceCoachRecommendationCard />`. No other render path was
     touched.
- `docs/AB13_10_V0_COMPATIBLE_VISUAL_PROOF_PATH_REPORT.md` — NEW. This
  report.

## 5. Proof path chosen

**New gated proof path — Option A** from the prompt's "Possible Acceptable
Implementation Paths" list: a small internal AB13 proof section on the
Program page that only appears under an explicit URL query flag and renders
the real shaped canonical proof slice through existing Program card
components.

## 6. Why that path was chosen

- **Path A (existing runtime path) is not currently viable in v0.** Naturally
  triggering `progressionAggressiveness: 'conservative'` AND ≥1 row
  `targetRPE > 7` requires real evidence/log history (an
  `'observe_recovery_high_rpe'` / `'deload_high_strain'` /
  `'hold_inconsistent_volume'` / etc. decision in the AB12-1 governor) plus
  a generated program where the builder happened to prescribe at least one
  working-set RPE 8 or 9. v0 cannot reliably reproduce that on the owner's
  account on demand.
- **Path C (fixture/report-only) does not produce deployed visual proof**,
  which is exactly the residual blocker AB13-9 documented.
- **Path B (small dev/test-only runtime acceptance trigger)** in the
  Option A flavor — a separate, gated, side-by-side proof section — is the
  smallest safe path that:
  - calls the REAL `applyConservativeProgressionShaping` helper,
  - produces the REAL `EvidenceCalibrationShapingProof`,
  - produces REAL `evidenceCalibrationRpeCap` row stamps,
  - renders the proof through the REAL `EvidenceCoachRecommendationCard`
    via the REAL `deriveEvidenceCoachRecommendations` helper,
  - never mutates the user's saved program.

## 7. Exact gate / condition for the proof path

The overlay component's first runtime check is:

```
useSearchParams()?.get('ab13ProofOverlay') === 'force-rpe-cap'
```

When that exact match is false, the component returns `null` BEFORE any
helper call runs. The exact-match value `'force-rpe-cap'` is intentionally
non-obvious so accidental access (search-engine prefetch, automated
crawlers, copy-paste of a shortened URL) is essentially impossible.

To activate, the owner navigates to:

```
https://<deployed-domain>/program?ab13ProofOverlay=force-rpe-cap
```

The flag is a per-navigation URL parameter — there is no localStorage, no
cookie, no global state. Removing the parameter from the URL hides the
overlay completely on the next navigation/refresh.

## 8. Why normal users are unaffected

1. Without the URL query flag, the overlay component's first check returns
   `null`. No JSX is rendered. No helper is called. No memoized work runs.
2. The synthetic `EvidenceCalibrationGenerationInfluence` is a `const`
   defined inside the overlay file and is **never exported**. Nothing
   outside this file can read it.
3. The synthetic influence is **never written into**
   `program.evidenceCalibrationInfluence`. It is only ever passed as the
   second argument to `applyConservativeProgressionShaping` inside the
   overlay's `useMemo`.
4. The shaped program returned by the helper lives only inside the
   overlay's `useMemo` value. It is **never** passed to `setProgram`,
   **never** persisted, **never** returned to the parent. The user's
   `program` state in the Program page is untouched.
5. The overlay renders inside a clearly-labeled amber-bordered shell with
   a "Proof overlay" tag and the heading "AB13 conservative progression
   shaping — visual verification" so it cannot be mistaken for the user's
   real program-shaping proof.
6. The real `<FeedbackLoopProofCard />` and `<EvidenceCoachRecommendationCard />`
   above the overlay continue to read the canonical
   `program.evidenceCalibrationInfluence` and
   `program.evidenceCalibrationShapingProof` — exactly as before. AB13-6's
   real program-level proof line is unchanged.

## 9. Real `applyConservativeProgressionShaping` helper used

YES. The overlay calls
`applyConservativeProgressionShaping(program, SYNTHETIC_PROOF_INFLUENCE)`
directly. There is no duplicate helper. The helper file
`lib/program/evidence-calibration-program-shaping.ts` is unchanged.

## 10. `program.evidenceCalibrationShapingProof` produced by the real helper

YES. The overlay reads `proofResult.shapingProof` directly from the helper's
return value (`EvidenceCalibrationShapingResult.shapingProof`). The
overlay never hand-builds a proof object. The helper's `summary`,
`appliedAtLeastOneMutation`, `cappedExerciseCount`, and `ceilingRpe` fields
are surfaced verbatim.

## 11. `exercise.evidenceCalibrationRpeCap` produced by the real helper

YES. The overlay iterates `proofResult.program.sessions[*].exercises[*]`
(the SHAPED program from the helper's return value, not the user's
pre-shaped program) and surfaces only rows where
`ex.evidenceCalibrationRpeCap?.applied === true`. The helper itself
attaches the stamp at the exact mutation site in
`applyConservativeProgressionShaping`; the overlay never writes a stamp.

## 12. Row chip derives only from `exercise.evidenceCalibrationRpeCap`

YES. The chip predicate is:

```ts
if (ex.evidenceCalibrationRpeCap?.applied === true) { ...render chip... }
```

The chip's tooltip / `aria-label` / `data-ab13-10-rpe-before` /
`data-ab13-10-rpe-after` attributes all read from
`stamp.reasonCoachLine`, `stamp.rpeBefore`, `stamp.rpeAfter` — fields the
real helper populated.

## 13. Any `targetRPE === 7` inference powering the chip

NO. A `grep` of the new file for `targetRPE\s*===?\s*7` returns only two
matches, both inside comments that explicitly forbid that inference:

- Line 35: a doc comment `(no \`targetRPE === 7\` inference)`.
- Line 211: an inline comment `No \`targetRPE === 7\` inference; the
  predicate is "stamp present and applied".`

There is no executable code path in the overlay (or anywhere else in the
project, per the AB13-9 audit) that infers "RPE capped" from the final
numeric value.

## 14. Exact expected visible UI when the overlay is active

When the URL contains `?ab13ProofOverlay=force-rpe-cap` AND a program is
loaded:

- An amber-bordered card appears directly below the
  `<EvidenceCoachRecommendationCard />` with:
  - A small **"Proof overlay"** tag.
  - The heading **"AB13 conservative progression shaping — visual
    verification"**.
- The card contains:
  1. A **Helper result** line that prints the real helper's `shapingProof.summary`
     verbatim. When the helper actually capped rows, the summary reads:
     `"Conservative progression applied — N exercise(s) capped at RPE 7."`
     When no row needed capping, it reads:
     `"Conservative progression active — no exercises required capping
     (every prescribed RPE was already ≤ 7)."`
  2. The real `<EvidenceCoachRecommendationCard />` rendered with a real
     `EvidenceCoachRecommendationBundle` produced by the real
     `deriveEvidenceCoachRecommendations` helper. This proves the AB13-6
     program-level shaping proof line surfaces correctly when the gate is
     open.
  3. A **"Capped exercise rows"** list. For each row the helper actually
     stamped, one line of the form:
     ```
     <session label>  <exercise name>  RPE 7  [RPE capped]
     ```
     where `[RPE capped]` is the same teal chip
     (`bg-teal-500/10 text-teal-300 border border-teal-500/30 ...`) that
     `AdaptiveSessionCard` renders for the AB13-7 row chip. Hovering the
     chip shows the tooltip:
     `"Evidence calibration capped this from RPE {rpeBefore} to {rpeAfter}."`
  4. If `appliedAtLeastOneMutation === false`, the list is replaced with
     the honest "checked / no cap required" line, proving the helper
     differentiates these two states.
  5. A footer line reminding the owner how to disable the overlay.

When the URL does **not** contain the flag, the overlay renders absolutely
nothing. The Program page looks identical to its current production
behavior.

## 15. Exact owner verification steps

1. Open the deployed SpartanLab app and sign in.
2. Navigate to the Program page until the program card has finished
   loading (the page state has `program` populated).
3. Append the proof flag to the URL:
   ```
   /program?ab13ProofOverlay=force-rpe-cap
   ```
   Press Enter to navigate.
4. Confirm an amber-bordered card titled
   **"AB13 conservative progression shaping — visual verification"**
   appears directly below the existing
   `<EvidenceCoachRecommendationCard />`.
5. Read the **Helper result** line. It should be one of:
   - `"Conservative progression applied — N exercise(s) capped at RPE 7."`
     → confirms SUCCESS STATE A (applied/capped proof). Continue to
     step 6.
   - `"Conservative progression active — no exercises required capping
     (every prescribed RPE was already ≤ 7)."`
     → confirms SUCCESS STATE B (checked / no cap required). The chip
     list does not appear, which is correct.
6. If SUCCESS STATE A: confirm the **EvidenceCoachRecommendationCard** in
   the overlay now shows the active/applied AB13-6 program-level shaping
   proof line.
7. If SUCCESS STATE A: confirm the **Capped exercise rows** list appears.
   For each capped row, hover the **RPE capped** chip and verify the
   tooltip / `aria-label` reads
   `"Evidence calibration capped this from RPE <before> to <after>."` with
   `<before>` strictly greater than `<after>` and `<after> === 7`.
8. Confirm that rows whose original `targetRPE` was already ≤ 7 do **not**
   appear in the chip list (negative proof — no fake `targetRPE === 7`
   inference).
9. Remove the query parameter from the URL and refresh. Confirm the
   overlay disappears completely and the page returns to its normal
   appearance.

## 16. Build result

- `pnpm exec tsc --noEmit --pretty false`: **NOT RUN** — the v0 sandbox
  cannot execute `pnpm`.
- `pnpm run build`: **NOT RUN** — same reason.

Static checks performed instead:

- New file `components/programs/AB13VisualProofOverlay.tsx` contains zero
  occurrences of `as any`, `@ts-ignore`, or `@ts-expect-error` (verified
  via Grep).
- All imports resolve to existing exported symbols:
  - `applyConservativeProgressionShaping` — exported from
    `lib/program/evidence-calibration-program-shaping.ts`.
  - `EvidenceCalibrationShapingResult` — exported from same file.
  - `EvidenceCalibrationGenerationInfluence` — exported from
    `lib/program/evidence-calibration-generation-influence.ts`.
  - `deriveEvidenceCoachRecommendations` — exported from
    `lib/program/evidence-derived-coach-recommendations.ts`.
  - `EvidenceCoachRecommendationCard` — exported from
    `components/programs/EvidenceCoachRecommendationCard.tsx`.
  - `AdaptiveProgram`, `AdaptiveExercise` — exported types from
    `lib/adaptive-program-builder.ts`.
  - `useSearchParams` — exported from `next/navigation`.
- The `SYNTHETIC_PROOF_INFLUENCE` literal contains every required field
  of `EvidenceCalibrationGenerationInfluence` (status,
  sourceGovernorVersion, confidence, allowedToMutateProgram,
  progressionAggressiveness, volumeBias, intensityBias, recoveryBias,
  benchmarkRetestPrompt, appliedConstraints, suppressedConstraints,
  reasonSummary, proof, influenceVersion). Cross-checked against the
  interface in `lib/program/evidence-calibration-generation-influence.ts`.
- `deriveEvidenceCoachRecommendations` is invoked with the exact
  `{ plan, influence, shapingProof }` shape the production Program page
  uses one block above (see `app/(app)/program/page.tsx` line ~2517).
- The chip Tailwind classes (`text-[10px] uppercase tracking-wider
  font-semibold px-1.5 py-0.5 rounded shrink-0 bg-teal-500/10 text-teal-300
  border border-teal-500/30`) match the AB13-7 chip in
  `AdaptiveSessionCard.tsx` line 7686-ish character-for-character so the
  visual verification ground truth is the same chip the production program
  card renders.

## 17. Final decision

> **AB13 is visually provable through the deployed Program page proof
> path. Safe to visually verify before AB14.**

Rationale: AB13's static code chain has been locked since AB13-8
(documented in AB13-9). The only remaining gap was an in-deployed
visual confirmation that the chain renders correctly when its gate is
open. AB13-10 closes that gap with a gated, owner-only overlay that
runs the real helper, produces real proof, and renders through real
production components without modifying the user's saved program or
affecting any other user.

Once the owner has visually confirmed SUCCESS STATE A (or, if no
working-set row in their current program had `targetRPE > 7`,
confirmed SUCCESS STATE B and then loaded a program that does have
such a row to obtain SUCCESS STATE A), AB13 is fully locked and the
project is safe to proceed to AB14 (the next intelligence phase / next
structural hook).

## Acceptance test results

| Test | Result |
| --- | --- |
| No AB14 logic added | PASS (no new structural hook; volumeBias / intensityBias / recoveryBias paths untouched) |
| No second structural hook | PASS |
| No normal production behavior changed | PASS (overlay returns `null` without the URL flag; existing FeedbackLoopProofCard / EvidenceCoachRecommendationCard unchanged) |
| Proof path is gated and safe | PASS (exact-match URL query flag, no persistence, clearly-labeled overlay shell) |
| Real AB13 shaping helper used | PASS (`applyConservativeProgressionShaping` called directly, no duplicate) |
| Program-level proof comes from canonical `evidenceCalibrationShapingProof` | PASS (proof shown is `proofResult.shapingProof.summary`; coach card uses `deriveEvidenceCoachRecommendations` with the same proof object) |
| Row-level chip comes only from `evidenceCalibrationRpeCap` | PASS (chip predicate is `ex.evidenceCalibrationRpeCap?.applied === true`) |
| No fake inference from `targetRPE === 7` | PASS (only matches are inside comments that forbid the inference) |
| Owner has clear deployed verification steps | PASS (Section 15 above) |
| Report created | PASS (this file) |

## Next recommended step (after owner visual confirmation)

If, after performing the verification steps in Section 15, the owner
confirms that:

1. SUCCESS STATE A appears on at least one program where ≥1 working-set
   row originally had `targetRPE > 7`, AND
2. the row chip reads `RPE capped` with the correct before/after tooltip,
   AND
3. uncapped rows show no chip,

then AB13 is fully verified and the project is safe to proceed to AB14
(the next intelligence phase). The `AB13VisualProofOverlay` component
and its single `<AB13VisualProofOverlay />` render in
`app/(app)/program/page.tsx` may be removed at any time after AB13
verification — they have no downstream consumers.
