# AB12-2 — Evidence Calibration → Safe Program-Generation Influence

> Status: **COMPLETE (metadata + structural-suppressed bridge end-to-end)**
> Branch: `v0/alericpetsch836-6923-724b0039`
> Scope: First connected, typed bridge from AB12-1 plan into the
> authoritative-generation corridor. Builder mutations deferred to AB12-3.
> Schema/package/auth/billing/workout reducer changes: **none**.

---

## What AB12-2 ships

A typed `EvidenceCalibrationGenerationInfluence` contract that converts
the AB12-1 `ProgramEvidenceCalibrationPlan` into a builder-safe
generation-time stamp, plus the authoritative-service plumbing that
runs this conversion on **every successful generation** and stamps the
result onto `program.evidenceCalibrationInfluence`. The Program page
reads the stamp directly off the canonical program object and renders
a second compact strip on the existing `FeedbackLoopProofCard` —
distinct from AB12-1's "live recommendation" strip — so users can see
*what was actually applied* (or honestly suppressed) when their current
program was generated.

AB12-2 deliberately leaves every structural builder constraint
(`progressionAggressiveness`, `volumeBias`, `intensityBias`,
`recoveryBias`) in the `suppressedConstraints` list. The 31k-line
`lib/adaptive-program-builder.ts` has no audited safe knob for these
yet; AB12-3 will wire them one at a time. Only the UI-level
`benchmarkRetestPrompt` hook is reported as `applied` in AB12-2.

This is the honest "structural influence is unsafe right now" path
the prompt explicitly authorized:

> "AT LEAST ONE safe constraint can influence generation OR the report
> proves why structural influence is unsafe right now."

---

## Files

### Added

- `lib/program/evidence-calibration-generation-influence.ts` (new)
  Pure typed bridge. Exports `EvidenceCalibrationGenerationInfluence`,
  `EvidenceCalibrationInfluenceStatus`,
  `EvidenceCalibrationConstraintName`,
  `EvidenceCalibrationStructuralHooks`, and
  `buildEvidenceCalibrationGenerationInfluence(plan, options)`.
  No I/O, no DB, no React, no global state, no fetch, no localStorage.
- `docs/AB12_2_EVIDENCE_CALIBRATION_GENERATION_INFLUENCE_REPORT.md`
  (this file).

### Modified

- `lib/server/authoritative-program-generation.ts`
  - Added type-only + helper imports for AB11 evidence summary
    builders, AB12-1 governor, and AB12-2 influence builder.
  - Added optional `evidenceCalibrationPlan?: ProgramEvidenceCalibrationPlan`
    field to `AuthoritativeGenerationRequest` (caller may pass a
    pre-built plan; never required).
  - Added a new post-Phase-AA2 stage
    `ab12_2_evidence_calibration_stamp_done` that:
    1. Resolves a plan: prefer `request.evidenceCalibrationPlan`, else
       build a workout-only plan server-side from the just-generated
       program's `performanceAdaptation` stamps (same canonical source
       AB11-4/AB11-5 use on the Program page).
    2. Converts the plan via
       `buildEvidenceCalibrationGenerationInfluence(plan, { structuralHooks })`
       with AB12-2 default hooks: only `benchmarkRetestPrompt: true`.
    3. Stamps `program.evidenceCalibrationInfluence` non-destructively
       (`program = { ...program, evidenceCalibrationInfluence: influence }`).
  - Failure non-blocking: try/catch absorbs and logs.
- `lib/adaptive-program-builder.ts`
  - Added type-only import of `EvidenceCalibrationGenerationInfluence`.
  - Added `evidenceCalibrationInfluence?: EvidenceCalibrationGenerationInfluence`
    field on the `AdaptiveProgram` interface. Optional + non-destructive
    — older programs and programs generated before AB12-2 simply omit it.
- `components/programs/FeedbackLoopProofCard.tsx`
  - Added type-only import of `EvidenceCalibrationGenerationInfluence`.
  - Added optional `generationInfluence?: EvidenceCalibrationGenerationInfluence | null`
    prop.
  - Added private `GenerationInfluenceStrip` renderer with
    `data-ab12-2-generation-influence`,
    `data-ab12-2-confidence`, and
    `data-ab12-2-allowed-to-mutate` markers; visually distinct from
    the AB12-1 strip via bordered ring vs muted background.
  - Strip wired into all three render branches (no-summary,
    no-evidence, present) AND the proof-lines-zero fallback.
  - Suppressed chips render with `outline` variant; applied chips
    render with `secondary` variant — mirroring the data state.
- `app/(app)/program/page.tsx`
  - In the existing AB11-4/AB11-5 IIFE that builds the workout-side
    plan, also reads `program.evidenceCalibrationInfluence` (typed
    directly off `AdaptiveProgram` — no cast) and passes it to
    `<FeedbackLoopProofCard>`.

### Inspected — not changed

- `lib/program/evidence-aware-program-calibration-governor.ts`
  (AB12-1 governor — input source; verified its exported types and
  decision contract are unchanged.)
- `lib/program/program-evidence-feedback-loop.ts`
  (AB11 evidence summarizers — input source for the workout-only
  server-side plan.)
- `lib/program/program-calibration-recommendation.ts`
  (AB11 recommendation engine — not used in AB12-2 server-side build
  because the page-level calibration card owns the benchmark fetch.)
- All `app/api/program/**` route handlers (regenerate, rebuild-adjustment,
  generate-from-modify-builder, generate-fresh, onboarding/generate-first-program).
  Not modified — every successful generation through these routes will
  carry an honest `program.evidenceCalibrationInfluence` stamp because
  the authoritative service builds the workout-only plan when callers
  don't pass one. No route needs to opt in.

---

## Influence contract

```ts
interface EvidenceCalibrationGenerationInfluence {
  status: 'inactive' | 'metadata_only' | 'active' | 'degraded'
  sourceGovernorVersion: 'ab12-1-evidence-aware-calibration-governor' | 'unknown'
  confidence: 'low' | 'medium' | 'high'
  allowedToMutateProgram: boolean
  progressionAggressiveness: 'conservative' | 'standard' | 'aggressive' | null
  volumeBias: 'reduce' | 'maintain' | 'increase_carefully' | null
  intensityBias: 'cap' | 'maintain' | 'allow_progression' | null
  recoveryBias: 'protect' | 'normal' | null
  benchmarkRetestPrompt: boolean
  appliedConstraints: string[]
  suppressedConstraints: string[]
  reasonSummary: string[]
  proof: { label: string; summary: string; chips: string[] }
  influenceVersion: 'ab12-2-evidence-calibration-generation-influence'
}
```

### Decision rules (in order, first match wins)

1. **`inactive`** — plan is `null`/`undefined` OR `not_applicable`.
   No constraints, no chips. UI strip hidden.
2. **`degraded`** — plan is `degraded`. Confidence forced to `low`.
   Only `progressionAggressiveness: 'conservative'` chip survives,
   reported as `(suppressed)`. UI says "Evidence unavailable — safe baseline".
3. **`metadata_only`** — plan is `no_evidence`, OR plan is `applied`
   but every structural constraint is currently suppressed by hooks.
   UI says "Evidence calibration waiting" or
   "Evidence calibration observed — Program influence pending".
4. **`active`** — plan is `applied` AND at least one structural hook
   is true (none in AB12-2). UI says
   "Evidence calibration influencing next program".

### Safety wins ties

- Low confidence + `aggressive` progression → downgraded to `standard`
  before chip emission.
- Degraded → only conservative baseline survives, reported suppressed.
- Every structural constraint the plan asked for that has no hook is
  partitioned into `suppressedConstraints` with explicit `(suppressed)`
  chip suffix. No fake applied state can occur.

---

## Canonical funnel verification

```
AB11 evidence summary  (server, from program.performanceAdaptation stamps)
  → buildEvidenceAwareCalibrationPlan                  [AB12-1 governor]
  → buildEvidenceCalibrationGenerationInfluence        [AB12-2 contract]   ← NEW
  → program.evidenceCalibrationInfluence = influence   [stamped post-Phase-AA2]
  → AdaptiveProgram (optional typed field on canonical interface)
  → page.program (typed AdaptiveProgram on Program page)
  → FeedbackLoopProofCard.generationInfluence prop
  → GenerationInfluenceStrip (data-ab12-2-generation-influence)
```

Every link is typed end-to-end. No `unknown` casts, no `as any`. The
field is optional on the AdaptiveProgram interface so older saved
programs (pre-AB12-2) read as `undefined` and the strip hides silently.

---

## Generation path parity

Every authoritative-generation entry — onboarding first build, fresh
main, regenerate, rebuild from current settings, modify-submit, and
restart-new-program — flows through `executeAuthoritativeGeneration`,
which contains the new AB12-2 stamp stage. Therefore **every path
inherits the stamp without any route needing to opt in**:

| Path                                        | Stamp present | Notes |
|---------------------------------------------|---------------|-------|
| `app/api/onboarding/generate-first-program` | yes           | workout-only plan, likely `metadata_only` (no completed workouts on first build) |
| `app/api/program/generate-fresh`            | yes           | workout-only plan |
| `app/api/program/regenerate`                | yes           | workout-only plan |
| `app/api/program/rebuild-adjustment`        | yes           | workout-only plan |
| `app/api/program/generate-from-modify-builder` | yes        | workout-only plan |
| (any future route)                          | yes           | as long as it calls `executeAuthoritativeGeneration` |

If a route ever wants to pass a richer plan (e.g. one that includes
benchmark evidence loaded server-side), it can populate the new
optional `request.evidenceCalibrationPlan` field. AB12-3 is the
designated stage for adding a server-side benchmark loader and wiring
the first structural builder hook.

---

## User-visible expected change

After this deploy, on the Program page below the existing Calibration
Checkpoint card and the AB11-5 Feedback Loop Proof card:

- **Fresh program, no completed workouts**:
  AB12-1 strip says "Evidence calibration waiting"; AB12-2 strip
  appears with `metadata_only` status saying
  "Evidence calibration waiting — complete benchmarks or workouts to
  personalize calibration." No chips. Bordered ring distinguishes it
  from the AB12-1 strip.

- **Program with `performanceAdaptation` stamps from completed workouts**:
  AB12-1 strip says "Evidence calibration active" with constraint
  chips (live recommendation). AB12-2 strip says
  "Evidence calibration observed — Program influence pending" with
  the same constraints rendered as `(suppressed)` chips, plus a brief
  summary like "Evidence observed (3 constraints pending builder
  wiring in AB12-3)." Honest. Distinct from the live AB12-1 strip.

- **Program generated when benchmark fetch was failing**:
  AB12-1 strip on the calibration card says "Evidence unavailable —
  safe baseline". AB12-2 strip on the workout side may still say
  `metadata_only` because the workout-only server plan is independent
  of benchmark availability. The two strips honestly disagree, which
  is the truthful state.

The two strips together let the user verify: "what does the live
governor currently want?" (AB12-1) vs "what was actually committed to
this generated program?" (AB12-2). For AB12-2 they will agree on the
set of constraints but differ on `applied` vs `suppressed` until
AB12-3 lands.

---

## Truth-to-UI guarantees

1. **No invented copy.** Every chip, label, and summary line is
   generated by the AB12-2 builder from the plan; nothing is
   hand-written in the React component.
2. **No fake "applied".** A constraint can only appear in
   `appliedConstraints` if the caller declared a hook for it. AB12-2
   defaults forbid every structural hook.
3. **`(suppressed)` chip suffix is explicit.** Suppressed constraints
   render with `outline` variant + `(suppressed)` text suffix so the
   user sees why a chip is not contributing.
4. **`data-ab12-2-allowed-to-mutate` data attribute** exposes the
   honest gate: it is `"false"` for AB12-2 because no structural hook
   is wired.
5. **Stable audit stamp** via `influenceVersion`.

---

## Type safety

- Zero `as any`, `@ts-ignore`, `@ts-expect-error` in AB12-2 files
  (grep verified — only one benign mention in the contract comment of
  `evidence-calibration-generation-influence.ts`).
- All new types are strict and locally owned. The
  `evidence-calibration-generation-influence.ts` file imports six
  AB12-1 governor types as `type`-only and exposes a single concrete
  type plus a single concrete builder function.
- Non-destructive `AdaptiveProgram` extension: one optional field,
  type-only import in the builder file.
- `program.evidenceCalibrationInfluence` is read with no cast on the
  Program page because the field is now part of the canonical
  `AdaptiveProgram` interface.

---

## Out of scope (deferred to AB12-3)

- **Wiring at least one structural builder hook.** AB12-3 will wire
  one safe knob (most likely `progressionAggressiveness: 'conservative'`
  → tighter progression curve in the existing
  `evaluateSessionProgressions` corridor) and flip the corresponding
  hook from `false` to `true` in the AB12-2 builder default.
- **Server-side benchmark loader.** The AB12-2 stamp currently uses
  workout-only evidence server-side; a Neon benchmark loader would
  let the server build a richer plan without depending on the
  page-level calibration card.
- **Confidence-aware suppression.** AB12-2 suppresses by hook
  declaration; AB12-3 may also suppress aggressive constraints when
  confidence is `low` even if the hook exists.

---

## Verification

- Type-only audit: zero forbidden patterns in AB12-2 files.
- Build: not run in this sandbox; recommend
  `pnpm exec tsc --noEmit --pretty false && pnpm run build` locally
  before merging.
- Runtime: the new service stage is wrapped in a try/catch that
  absorbs any error and lets the program return unstamped, so AB12-2
  cannot block a generation that previously succeeded.
- The optional field on `AdaptiveProgram` is non-breaking for all
  consumers because every existing consumer reads only specific named
  fields.
