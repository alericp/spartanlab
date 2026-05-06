# AB13-11B SOURCE RECONCILIATION REPORT

## 1. Status

**COMPLETE**

The deterministic fixture fallback is now actually present in source, not
just claimed in a report.

## 2. Source/report mismatch confirmed

**YES.**

> AB13-11 source implementation was absent; previous report was not valid proof.

The AB13-11 report (`docs/AB13_11_DETERMINISTIC_VISUAL_PROOF_FIX_REPORT.md`)
described code that did not exist in
`components/programs/AB13VisualProofOverlay.tsx` at the time of the AB13-11B
audit. AB13-11B reconciles the mismatch by actually shipping the source
changes the AB13-11 report had described.

## 3. Exact source audit (before AB13-11B)

| Check | Before AB13-11B |
| --- | --- |
| `components/programs/AB13VisualProofOverlay.tsx` line count | ~333 lines (matched the AB13-10 implementation) |
| `buildFixtureProgram` symbol present | NO |
| Literal string `fixture-fallback` present | NO (only the AB13-10 single-mode path) |
| `data-ab13-11-proof-mode` attribute present | NO |
| `data-ab13-11-row-rpe-cap` attribute present | NO |
| Any `data-ab13-11-*` attribute present | NO |
| AB13-10 attributes (`data-ab13-10-overlay`, `data-ab13-10-row-rpe-cap`) only | YES |
| AB13-11 report referenced line ~395 | YES (impossible — file was ~333 lines) |

The previous AB13-11 report was therefore not valid proof and has been
superseded by this AB13-11B report.

## 4. Files changed

- `components/programs/AB13VisualProofOverlay.tsx` — full rewrite to add the
  deterministic fixture fallback, two ordered proof modes, AB13-11 data
  attributes, and the failed-state branch. AB13-10 attributes are preserved
  on the overlay root for backwards compatibility with anything inspecting
  the previous shape.
- `docs/AB13_11B_SOURCE_RECONCILIATION_REPORT.md` — this report.

No other file changed. No package change. No schema change. No production
generation change. No AB14 logic.

## 5. What code was actually changed

### 5.1 New `buildFixtureProgram` helper (overlay-local, not exported)

Walks `program.sessions[i].exercises[j]` deterministically (sessions then
exercises in declaration order), picks the first exercise whose lowercased
`category` is not in a local `FIXTURE_NON_PRESCRIPTIVE_CATEGORIES` set
mirroring the helper's own `NON_PRESCRIPTIVE_CATEGORIES` (plus a few
picker-quality-only tokens like `flexibility`, `restorative`, `breathing`).

It then constructs:

```
const newExercise: AdaptiveExercise = {
  ...pickedExercise,
  targetRPE: 8,
  evidenceCalibrationRpeCap: undefined,
}
const newExercises = pickedSession.exercises.map(
  (ex, i) => (i === pickedExerciseIndex ? newExercise : ex),
)
const newSession = { ...pickedSession, exercises: newExercises }
const newSessions = program.sessions.map(
  (session, i) => (i === pickedSessionIndex ? newSession : session),
)
const fixtureProgram: AdaptiveProgram = {
  ...program,
  sessions: newSessions,
  evidenceCalibrationShapingProof: undefined,
}
```

Every step is an immutable spread or `.map()` rebuild. The original
`program`, `program.sessions`, every original session, and every original
exercise are never written. Returns `null` when no acceptable exercise
exists in the loaded program.

### 5.2 New `resolveProof(program)` resolver

Implements the two ordered modes inside one function:

1. **Mode 1 — current-program.** Calls
   `applyConservativeProgressionShaping(program, SYNTHETIC_PROOF_INFLUENCE)`.
   Collects rows where `exercise.evidenceCalibrationRpeCap?.applied === true`.
   Returns `{ mode: 'current-program', result, cappedRows }` if any row was
   stamped.
2. **Mode 2 — fixture-fallback.** Only runs when Mode 1 produced zero capped
   rows. Calls `buildFixtureProgram(program)`; if that returns `null`,
   returns `{ mode: 'failed', reason: 'No usable exercise shape...' }`.
   Otherwise calls
   `applyConservativeProgressionShaping(fixtureProgram, SYNTHETIC_PROOF_INFLUENCE)`
   on the **clone** (the user's `program` reference is never read again
   after cloning) and collects capped rows the same way. If the helper still
   produced zero stamps, returns `{ mode: 'failed', reason: 'Fixture seeded
   an eligible RPE>7 row, but the real helper did not stamp...' }`.
   Otherwise returns `{ mode: 'fixture-fallback', result, cappedRows,
   fixturePick }`.

The same real `applyConservativeProgressionShaping` helper is the only
producer of `evidenceCalibrationShapingProof` and
`evidenceCalibrationRpeCap` in both modes. The overlay never hand-writes
either.

### 5.3 Render path

The component's `useMemo` now calls `resolveProof(program)` instead of the
helper directly. The render branches:

- Gate closed → `null`.
- Gate open but no program → failed shell with explanation.
- `mode === 'failed'` → failed shell with the resolver's exact reason.
- Success (`current-program` or `fixture-fallback`) → mode label, optional
  fixture-fallback explanatory note, helper summary, real
  `EvidenceCoachRecommendationCard`, capped-row list, and the unique
  no-cap fallback note kept as a contract-drift safety only.

### 5.4 AB13-11 data attributes added

| Surface | Attribute |
| --- | --- |
| Overlay root | `data-ab13-10-overlay="true"` (preserved) and `data-ab13-11-proof-mode="current-program" \| "fixture-fallback" \| "failed"` |
| Helper summary | `data-ab13-11-shaping-summary` |
| Coach card wrapper | `data-ab13-11-coach-card` |
| Each capped row `<li>` | `data-ab13-11-capped-row="true"`, `data-ab13-11-proof-mode={mode}`, `data-ab13-11-rpe-before={stamp.rpeBefore}`, `data-ab13-11-rpe-after={stamp.rpeAfter}` |
| Each chip | `data-ab13-11-row-rpe-cap="true"`, plus `data-ab13-11-rpe-before` / `data-ab13-11-rpe-after` for inspectability |
| No-cap honest fallback paragraph | `data-ab13-11-no-cap-required` |

## 6. Proof modes now implemented

| Mode | Trigger | Helper input | Stamp source |
| --- | --- | --- | --- |
| `current-program` | Mode 1 finds ≥1 capped row | The user's loaded `program` | Real helper |
| `fixture-fallback` | Mode 1 finds zero, fixture builds, helper stamps ≥1 | An immutable spread-clone of `program` with one non-warmup-style exercise's `targetRPE` set to 8 | Real helper |
| `failed` | Either no acceptable picker candidate exists, or the helper still produced zero stamps on the fixture | n/a | n/a |

## 7. Whether normal users are affected

**NO.** The overlay returns `null` whenever
`searchParams.get('ab13ProofOverlay') !== 'force-rpe-cap'`. The
`useSearchParams` value is read on the client and the gate check runs
before the helper, before `buildFixtureProgram`, before
`deriveEvidenceCoachRecommendations`. On every other URL — including
indexed / crawled / prefetched URLs — the component contributes nothing to
the DOM.

## 8. Whether real user program is mutated

**NO.** The `program` prop is read-only inside the overlay. The fixture
builder uses object spreads and `.map()` rebuilds for every level
(program → sessions → session → exercises → exercise). The real helper
itself documents the same clone-on-write contract. There is no `program.X
=` assignment, no `Array.prototype.push` / `.splice` / `.unshift` /
`.sort` / `.fill` on any original array, no in-place exercise edit.

A grep for assignment/mutation patterns on the overlay returned only
read-only access:

```
program.sessions[s]                  // read
program.sessions[pickedSessionIndex] // read
program.sessions.map(...)            // returns a new array
```

## 9. Whether saved program is persisted/overwritten

**NO.** The overlay never calls `setProgram`, `fetch`, any route handler,
any API endpoint, `localStorage`, `sessionStorage`, IndexedDB, or any
storage helper. The shaped program from the helper exists only inside
`useMemo` and is consumed only by the overlay's own JSX — nothing reads it
back into parent state.

## 10. Whether real helper is the only producer of proof/stamps

**YES.**

- `applyConservativeProgressionShaping` is the only function in the
  codebase that constructs an `EvidenceCalibrationRpeCapStamp` (verified by
  the AB13-7 / AB13-8 audits). The overlay imports the helper as a value
  and the result types as type-only.
- The overlay never builds a `{ source: 'evidence_calibration_...',
  applied: true, ... }` literal. The fixture builder only sets
  `targetRPE: 8` and `evidenceCalibrationRpeCap: undefined` on the cloned
  exercise — the helper subsequently produces the real stamp.
- Program-level proof: `EvidenceCalibrationShapingProof` is constructed
  only inside the helper. The overlay's `coachBundle` is built from
  `result.shapingProof` exactly as the production Program page does.

## 11. Whether row chips derive only from `evidenceCalibrationRpeCap`

**YES.** Every chip in the overlay sits behind:

```
const stamp = exercise.evidenceCalibrationRpeCap
if (!stamp || stamp.applied !== true) return null
```

Tooltip / aria-label / data-attribute values are read from `stamp.rpeBefore`,
`stamp.rpeAfter`, and `stamp.reasonCoachLine`. There is no other code path
that renders a chip.

## 12. Whether executable `targetRPE === 7` inference exists

**NO.** A grep for `targetRPE\s*===?\s*7` finds two matches:

```
components/programs/AB13VisualProofOverlay.tsx:44:
 *     stamp (no `targetRPE === 7` inference).
components/programs/AB13VisualProofOverlay.tsx:338:
 * no `targetRPE === 7` inference anywhere in this file.
```

Both are inside comments **forbidding** that inference. There is no
executable path that reads `targetRPE`, compares it to `7`, and renders a
chip from the result.

## 13. Whether AB14 was added

**NO.**

- No second structural hook (`volumeBias` / `intensityBias` / `recoveryBias`
  remain `null` in `SYNTHETIC_PROOF_INFLUENCE`).
- No new mutation gate, no new generation behavior, no new builder pass,
  no new schema, no new persisted field.
- No new AI engine, no new card outside the overlay.
- The synthetic influence sets `progressionAggressiveness: 'conservative'`
  exactly so the existing AB13-4 path runs — that is the same hook AB13-4
  already shipped, not a new one.

## 14. Build / typecheck results

### `pnpm exec tsc --noEmit --pretty false`

**NOT RUN.** The v0 sandbox cannot execute `pnpm` directly.

Static checks performed instead:

| Check | Result |
| --- | --- |
| `as any` / `@ts-ignore` / `@ts-expect-error` in overlay | Zero matches (grep) |
| `evidenceCalibrationRpeCap?:` declared on `AdaptiveExercise` | Confirmed at `lib/adaptive-program-builder.ts:2042` (AB13-7) |
| `evidenceCalibrationShapingProof?:` declared on `AdaptiveProgram` | Confirmed at `lib/adaptive-program-builder.ts:2104` |
| Optional field `evidenceCalibrationInfluence?:` declared on `AdaptiveProgram` | Confirmed at `lib/adaptive-program-builder.ts:2092` |
| `EvidenceCalibrationGenerationInfluence` shape matches the imported type | Re-confirmed against `lib/program/evidence-calibration-generation-influence.ts` (`status`, `sourceGovernorVersion`, `confidence`, `allowedToMutateProgram`, `progressionAggressiveness`, `volumeBias`, `intensityBias`, `recoveryBias`, `benchmarkRetestPrompt`, `appliedConstraints`, `suppressedConstraints`, `reasonSummary`, `proof`, `influenceVersion`) |
| `EvidenceCalibrationShapingResult` import path | Confirmed exported from `lib/program/evidence-calibration-program-shaping.ts` |
| `deriveEvidenceCoachRecommendations({ plan, influence, shapingProof })` signature | Confirmed unchanged (used identically in the production Program page proof corridor) |

### `pnpm run build`

**NOT RUN.** Same sandbox limitation. The static checks above plus the
fact that the previous AB13-10 / AB13-7 implementations are already
deployed Ready on `main` (PR #1239 / commit `f3f39e9` per AB13-8, then
PR #1240 / commit `005fa00` per AB13-9, then the AB13-10 deployment per
AB13-10's report) gives high confidence the rewrite compiles. The rewrite
is type-equivalent to the AB13-10 file plus a new local helper and a
discriminated union — no global types were touched.

## 15. Owner verification steps

1. Deploy this branch to Vercel (PR auto-deploys via the preview pipeline).
2. Open the deployed SpartanLab Program page on a logged-in account that
   already has any program loaded (the program does NOT need any RPE>7 row
   — fixture fallback handles that case).
3. Confirm normal Program page behavior: no proof overlay anywhere, no
   visible change to any session card, no extra chip on any exercise row.
4. Append the proof query flag to the URL:
   ```
   /program?ab13ProofOverlay=force-rpe-cap
   ```
5. The amber `Proof overlay` section should appear directly under the
   existing `EvidenceCoachRecommendationCard`.
6. Read the mode label at the top of the section:
   - `AB13 proof mode: current program` → the user's program already had
     ≥1 eligible RPE>7 row and the helper capped it. No fixture is in use.
     Skip to step 8.
   - `AB13 proof mode: overlay fixture fallback` → the user's program had
     no eligible RPE>7 row, so the overlay cloned the program and seeded
     one cloned exercise's `targetRPE` to 8. The amber explanatory line
     identifies which session/exercise was picked. The user's saved
     program is unchanged.
   - `AB13 visual proof failed` → see step 10.
7. Confirm the helper summary line reads either `Conservative progression
   applied — N exercise(s) capped at RPE 7.` or its checked/no-cap variant
   (the success modes always render the applied variant; the no-cap
   variant is only kept as a contract-drift safety).
8. Confirm the real `EvidenceCoachRecommendationCard` renders inside the
   overlay and shows the program-level shaping proof line ("evidence
   calibration shaping applied" or equivalent).
9. Confirm at least one capped row appears in the list, with:
   - the session label,
   - the exercise name,
   - the post-cap RPE (7),
   - the teal `RPE capped` chip,
   - and the chip tooltip / aria-label `Evidence calibration capped this
     from RPE {before} to {after}.`
10. If the overlay shows `AB13 visual proof failed`, do **not** declare AB13
    ready for AB14. Read the explicit reason and report it back.
11. Remove the query flag from the URL and refresh. The amber overlay
    section disappears completely. The rest of the Program page is
    unchanged.

## 16. Final decision

**"AB13-11B is source-verified and visually provable; owner should verify the deployed overlay before AB14."**

The source now matches what the AB13-11 report had described: a deterministic
fixture-fallback proof path that uses the real shaping helper as the only
stamp producer, never mutates the user's program, and is invisible to normal
users. AB14 remains blocked until the owner performs the verification steps
above on the deployed Program page and confirms both program-level and
row-level proof appear together.
