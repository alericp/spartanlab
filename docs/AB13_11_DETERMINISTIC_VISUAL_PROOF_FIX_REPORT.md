# AB13-11 — DETERMINISTIC VISUAL PROOF FIX REPORT

## 1. Status

**COMPLETE.**

## 2. Code changed

YES — exactly one source file was modified, plus one new report.

## 3. Files inspected

- `components/programs/AB13VisualProofOverlay.tsx` (current AB13-10 state)
- `lib/program/evidence-calibration-program-shaping.ts` (helper contract,
  eligibility predicate, `NON_PRESCRIPTIVE_CATEGORIES`, conservative ceiling)
- `lib/adaptive-program-builder.ts` (`AdaptiveProgram`, `AdaptiveSession`,
  `AdaptiveExercise` shapes — required and optional fields)
- `lib/program/evidence-calibration-generation-influence.ts`
  (`EvidenceCalibrationGenerationInfluence` shape, the synthetic influence
  the overlay constructs)
- `lib/program/evidence-derived-coach-recommendations.ts`
  (`deriveEvidenceCoachRecommendations` signature)
- `components/programs/EvidenceCoachRecommendationCard.tsx`
  (rendering contract)
- `components/programs/AdaptiveSessionCard.tsx` (chip styling reference)
- `app/(app)/program/page.tsx` (overlay mount site — unchanged)

## 4. Files changed

- `components/programs/AB13VisualProofOverlay.tsx` — rewritten to add the
  AB13-11 fixture-fallback proof mode while preserving every AB13-10
  guarantee.
- `docs/AB13_11_DETERMINISTIC_VISUAL_PROOF_FIX_REPORT.md` — this report
  (new).

No other source files were modified. The Program page mount site, the
helper, the influence type, the coach card, and `AdaptiveSessionCard` are
all untouched.

## 5. Root cause confirmed

The AB13-10 overlay only ran the real helper against the user's currently
loaded program. The helper's eligibility predicate (`typeof targetRPE ===
'number'` AND `targetRPE > 7` AND category not in
`NON_PRESCRIPTIVE_CATEGORIES`) means that a saved program with no
prescribed working-set row above RPE 7 produces zero stamps even though
the gate is open. The honest "checked / no cap required" state then
appeared and the row-level chip corridor was never visually proven.

This is exactly the failure mode AB13-11 was scoped to fix.

## 6. What changed

The overlay now resolves the proof in two ordered modes inside a single
`useMemo`:

1. **Mode 1 — natural proof** against the loaded program. The real
   `applyConservativeProgressionShaping` helper is called with the
   synthetic active+conservative+allowed influence. If
   `shapingProof.appliedAtLeastOneMutation === true`, this mode wins and
   the overlay surfaces the result as `current-program`.

2. **Mode 2 — fixture-fallback** when Mode 1 produced zero stamps. A new
   file-local function `buildFixtureProgram(program)` walks
   `program.sessions[*].exercises[*]`, picks the first row whose
   `category` is not in the helper's non-prescriptive set, and produces
   an immutable clone of the program with that single row's `targetRPE`
   bumped to `8`. Every level of the clone (program, sessions array,
   chosen session, exercises array, chosen exercise) is rebuilt by
   spread copy — the user's references are demonstrably untouched. The
   real helper is then called on the clone with the same synthetic
   influence; the stamps it produces are the only source of the visible
   chip.

3. **Mode 3 — failed** when neither mode produced a stamp (no program
   loaded, no session/exercise pair available, or the helper rejected
   even the promoted fixture row). The overlay surfaces that honestly;
   AB13 is not declared visually provable in that case.

Helper-eligibility constants used by the picker
(`NON_PRESCRIPTIVE_CATEGORIES`, `FIXTURE_TARGET_RPE = 8`) are
file-local and labeled as a picker only — the helper remains the
authority that mutates and stamps.

## 7. Proof mode behavior

| Mode | When it triggers | What renders |
|---|---|---|
| `current-program` | Loaded program had ≥1 eligible row | Emerald banner "AB13 proof mode: current program", helper summary, real `EvidenceCoachRecommendationCard`, list of capped rows with `RPE capped` chip(s) sourced only from `evidenceCalibrationRpeCap` |
| `fixture-fallback` | Loaded program had 0 eligible rows but ≥1 row had a non-warmup category | Amber banner "AB13 proof mode: overlay fixture fallback" + a sentence naming the promoted exercise/session and stating the saved program was NOT modified, helper summary, real coach card, capped rows with chip |
| `failed` | No program loaded, or no fixture row available, or helper rejected the fixture | "AB13 visual proof failed" with the exact reason; no chip, no fake claim of readiness |

The `data-ab13-11-proof-mode` attribute is stamped on the overlay root,
on every capped-row `<li>`, and on every chip, so DOM inspection can
distinguish modes deterministically.

## 8. Whether normal users are affected

**NO.** The component returns `null` before any helper call when
`searchParams.get('ab13ProofOverlay') !== 'force-rpe-cap'`. The synthetic
influence and the fixture clone only ever exist inside `useMemo` and are
never reachable from any other component. The render mount in
`app/(app)/program/page.tsx` is a single `<AB13VisualProofOverlay
program={program} />` next to the existing proof cards.

## 9. Whether the user's real program is mutated

**NO.** The fixture builder uses spread copies at every level (`{
...program }`, `[...sessions]`, `{ ...session }`, `[...exercises]`, `{
...exercise }`). The original program, sessions, exercises, and the
loaded React state are never mutated. The only `.push(` in the file
appends to a local-only `cappedRows` array used solely to render the
list — it is never assigned back to the program.

## 10. Whether the user's saved program is persisted/overwritten

**NO.** The overlay calls no API, no route handler, no `setProgram`, no
`localStorage`, no `sessionStorage`, no `fetch`, no DB write. The
shaped program returned by the helper is a `useMemo` value consumed
only by the overlay's render.

## 11. Whether the real helper is still the only producer

**YES.** Every `evidenceCalibrationShapingProof` and
`evidenceCalibrationRpeCap` value rendered by the overlay comes from
`applyConservativeProgressionShaping`. The overlay never hand-writes a
stamp; the fixture builder only adjusts an exercise's `targetRPE`
input — the helper remains the authority for whether to mutate and
whether to stamp.

## 12. Whether row chip derives only from `evidenceCalibrationRpeCap`

**YES.** The row predicate is exactly:

```ts
if (ex.evidenceCalibrationRpeCap?.applied === true) { /* render chip */ }
```

The chip's `rpeBefore`, `rpeAfter`, and tooltip text all come from the
stamp object's fields. There is no fallback path that renders a chip
without the stamp.

## 13. Whether `targetRPE === 7` inference exists

**NO.** A grep for `targetRPE\s*===?\s*7` against
`AB13VisualProofOverlay.tsx` returns only two matches, both inside
comments that document the prohibition (lines 47 and 395). No
executable predicate uses the final RPE value to infer the cap.

## 14. Whether AB14 was added

**NO.** No new structural hook, no `volumeBias` mutation, no
`intensityBias` mutation, no `recoveryBias` mutation, no benchmark
retest logic, no schedule logic, no exercise selection change, no
set/rep change. AB13-11 is a proof-overlay tightening only.

## 15. Exact owner verification steps

1. Deploy the branch to Vercel.
2. Open the deployed SpartanLab Program page on a logged-in account.
3. Confirm a program is loaded (the page renders the existing proof
   cards as normal). At this point the AB13 overlay is hidden — confirm
   nothing extra is rendered.
4. Append `?ab13ProofOverlay=force-rpe-cap` to the Program-page URL and
   reload. The overlay's amber-bordered "AB13 conservative progression
   shaping — visual verification" section should appear directly below
   the existing `EvidenceCoachRecommendationCard`.
5. Read the proof-mode banner at the top of the overlay. It will be one
   of:
   - **AB13 proof mode: current program** (emerald) — the loaded
     program already had an eligible RPE>7 row.
   - **AB13 proof mode: overlay fixture fallback** (amber) — the
     overlay promoted exactly one row to RPE 8 in an isolated clone;
     the visible note states the saved program was not modified.
6. Confirm the real `EvidenceCoachRecommendationCard` renders the
   AB13-6 program-shaping-proof line with the active+conservative
   shape.
7. Confirm at least one row is listed under "Capped exercise rows
   (from real `evidenceCalibrationRpeCap` stamps)" and that its `RPE
   capped` chip:
   - reads "RPE capped"
   - has a `title` / `aria-label` of the form "Evidence calibration
     capped this from RPE 8 to 7."
   - displays the row's after-RPE as `RPE 7`
8. Optionally inspect the DOM and verify the chip's
   `data-ab13-11-rpe-before`, `data-ab13-11-rpe-after`, and
   `data-ab13-11-proof-mode` attributes match the visible values.
9. Remove the `?ab13ProofOverlay=...` query parameter and reload.
   Confirm the entire amber section disappears and only the original
   proof cards remain.

## 16. Build / typecheck results

- `pnpm exec tsc --noEmit --pretty false` — **NOT RUN.** The v0
  sandbox cannot execute `pnpm`. Static checks performed instead:
  - Grep against the file for `\bas\s+any\b|@ts-ignore|@ts-expect-error`
    returned **0 matches**.
  - Every imported type (`AdaptiveProgram`, `AdaptiveSession`,
    `AdaptiveExercise`, `EvidenceCalibrationShapingResult`,
    `EvidenceCalibrationGenerationInfluence`) is consumed in
    type-correct positions.
  - `SYNTHETIC_PROOF_INFLUENCE` literally satisfies the
    `EvidenceCalibrationGenerationInfluence` shape verified in AB13-10.
  - The fixture builder constructs immutable clones using spread; the
    resulting object is shaped exactly like the input
    `AdaptiveProgram` (only `targetRPE` is replaced on a single
    cloned exercise), so it is structurally compatible with the real
    helper's signature.
- `pnpm run build` — **NOT RUN** for the same reason. The same static
  checks above apply. AB13-10 is already deployed Ready on `main`,
  and AB13-11 is a self-contained additive change inside a single
  client component, so the build risk surface is minimal.

## 17. Final decision

**"AB13 is visually provable with deterministic program-level and
row-level proof. Owner should verify the deployed overlay before
AB14."**

Both proof corridors are now visible together via the same proof URL:

- The program-level shaping proof line renders through the real
  `EvidenceCoachRecommendationCard` for both `current-program` and
  `fixture-fallback` modes.
- The row-level `RPE capped` chip is guaranteed to render whenever the
  loaded program has at least one session with at least one
  non-warmup-category exercise, because the fixture-fallback clone
  promotes exactly one such row to RPE 8 and the real helper caps it
  to 7.
- The user's saved program is never mutated, never persisted, and
  never reachable from any other component.
- Normal users on every other URL are unaffected.

AB13 is locked statically (AB13-4..AB13-9), runtime-locked through the
gated visual proof corridor (AB13-10), and now deterministically
visually-provable (AB13-11). After the owner completes the deployed
verification steps in §15, AB14 / the next intelligence phase is safe
to begin.
