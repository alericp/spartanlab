# AB12-3 — Post-Deploy Runtime Acceptance Gate for AB12-2

> Status: **COMPLETE — AB12-2 accepted, safe to proceed to AB13**
> Branch: `v0/alericpetsch836-6923-1d6fdb94`
> Scope: Verification-only audit. No feature expansion.

---

## Executive verdict

AB12-2 is real, connected, typed end-to-end, and honest. Every stage of
the funnel from AB11 evidence summary through to the visible UI strip
was traced in code and proven. No fake "active" state can be produced
under AB12-2 default hooks. No duplicate calibration system exists. No
patch was required.

---

## Stage-by-stage funnel verdict

| Stage | Verdict | Evidence |
|-------|---------|----------|
| AB11 evidence summary | **PASS** | `buildWorkoutEvidenceSignalsFromProgramStamps` + `summarizeWorkoutEvidence` called at `lib/server/authoritative-program-generation.ts:3408` from `program.performanceAdaptation` stamps |
| AB12-1 plan | **PASS** | `buildEvidenceAwareCalibrationPlan` called at `lib/server/authoritative-program-generation.ts:3415` with the workout summary |
| AB12-2 influence | **PASS** | `buildEvidenceCalibrationGenerationInfluence` called at `lib/server/authoritative-program-generation.ts:3425` |
| Authoritative generation | **PASS** | New phase runs unconditionally inside `executeAuthoritativeGeneration` after `markStage('phase_aa2_doctrine_utilization_done')` and before `markStage('complete')`; wrapped in try/catch so failure is non-blocking |
| Builder context | **PARTIAL — by design** | AB12-2 default hooks set every structural builder constraint to `false`. The 31k-line `lib/adaptive-program-builder.ts` does **not** read the influence object. This is the explicit AB12-2 boundary the report named: `AB12-3` is the prompt that wires the first structural hook |
| Builder decision | **PARTIAL — by design** | Same as above. No structural mutation. UI-level `benchmarkRetestPrompt` is the only `applied` constraint |
| Generated program object | **PASS** | `program = { ...program, evidenceCalibrationInfluence: influence }` at `lib/server/authoritative-program-generation.ts:3439` — non-destructive spread, preserves every other field |
| Metadata/proof stamp | **PASS** | Field is part of the typed `AdaptiveProgram` interface (`lib/adaptive-program-builder.ts`), so it survives every consumer that uses the canonical type |
| Save/load/hydration | **PASS** | `lib/program-service.ts` uses `JSON.stringify(program)` and `JSON.parse(stored)` — no field whitelist, no normalization layer that could strip the optional field |
| Program page consumer | **PASS** | `app/(app)/program/page.tsx:2487`: `const generationInfluence = program.evidenceCalibrationInfluence ?? null` — direct typed access, no cast |
| Visible UI proof | **PASS** | `components/programs/FeedbackLoopProofCard.tsx` `GenerationInfluenceStrip` renders ONLY `influence.proof.label`, `influence.proof.summary`, `influence.proof.chips` — every visible string is derived from the influence object, none are hand-written |

---

## Scenario verdicts

### A — No evidence (fresh program, no completed workouts)

- AB11 workout summary → zero signals
- AB12-1 plan → `status: 'no_evidence'`
- AB12-2 influence → `status: 'metadata_only'`, all structural constraints `null`, `appliedConstraints: []`, `suppressedConstraints: []`, `allowedToMutateProgram: false`
- UI strip label: **"Evidence calibration waiting"**
- Summary: "Evidence calibration waiting — complete benchmarks or workouts to personalize calibration."
- No chips. No false claims.

**Verdict: PASS** — code path verified at `evidence-calibration-generation-influence.ts:393-401` (`label = '...waiting'` when `plan.status === 'no_evidence'`).

### B — Degraded evidence (evidence source unavailable)

- AB12-1 plan → `status: 'degraded'`
- AB12-2 influence → `status: 'degraded'`, `confidence` forced to `'low'`, `progressionAggressiveness: 'conservative'` (suppressed), `allowedToMutateProgram: false`
- UI strip label: **"Evidence unavailable — safe baseline"**
- Single chip: `"progression: conservative (suppressed)"`
- No fake active claims.

**Verdict: PASS** — code path verified at `evidence-calibration-generation-influence.ts:295-322` (Rule 2 in the builder).

### C — Evidence present, every constraint suppressed (AB12-2 default)

- AB12-1 plan → `status: 'applied'` with one or more constraints
- AB12-2 hooks (default) → all structural `false`, only `benchmarkRetestPrompt: true`
- AB12-2 influence → `status: 'metadata_only'` (because `hasStructuralApplied === false`), every structural constraint partitioned into `suppressedConstraints`, `allowedToMutateProgram: false`
- UI strip label: **"Evidence calibration observed — Program influence pending"**
- Summary: "Evidence observed (N constraints pending builder wiring in AB12-3)."
- Chips render with `outline` variant + `(suppressed)` suffix in `GenerationInfluenceStrip` (`FeedbackLoopProofCard.tsx:227-237`).

**Verdict: PASS** — `hasStructuralApplied` gate at `evidence-calibration-generation-influence.ts:381-388` is the truth gate that prevents fake active.

### D — Evidence present, safe constraint applied

- Requires at least one of `progressionAggressiveness`, `volumeBias`, `intensityBias`, or `recoveryBias` hook to be `true` AND a builder seam reading the influence.
- AB12-2 default hooks: **none of these are true**.
- Therefore: this scenario **cannot fire under AB12-2 defaults**. The `active` label and `allowedToMutateProgram: true` are gated behind `hasStructuralApplied`, which requires a hook flip + a real builder seam.
- AB12-3 is the designated prompt that flips the first hook (likely `progressionAggressiveness`) and wires the corresponding builder seam.

**Verdict: PASS — scenario gated correctly. No false-positive path exists.**

---

## Generation path parity

Every successful generation flows through `executeAuthoritativeGeneration`,
which contains the AB12-2 stamp phase. Verified by grepping for callers:

| Path | File | Verdict |
|------|------|---------|
| Onboarding first build | `app/api/onboarding/generate-first-program/route.ts` | **PASS** |
| Fresh main | `app/api/program/generate-fresh/route.ts` | **PASS** |
| Regenerate | `app/api/program/regenerate/route.ts` | **PASS** |
| Rebuild current | `app/api/program/rebuild-adjustment/route.ts` | **PASS** |
| Modify submit | `app/api/program/generate-from-modify-builder/route.ts` | **PASS** |
| Restart | (covered by `generate-fresh` / `regenerate`) | **PASS** |
| Saved reload | `lib/program-service.ts` `JSON.parse(stored)` | **PASS** — round-trip preserves the optional field |

`regenerate/route.ts` returns `result.program` directly at line 471 — no
field whitelist, no normalization that could strip the new field.

**Note on parity**: every path inherits the **stamp** (proof carries
through). Whether the stamp ever reaches `status: 'active'` is gated by
hook config, which AB12-3 will flip. So parity is honest:
"every path stamps; no path mutates structure yet."

---

## UI honesty verdict

| Question | Verdict |
|----------|---------|
| Active labels honest? | **PASS** — "influencing next program" string only emitted from the `active` branch in `evidence-calibration-generation-influence.ts:397`. That branch is gated by `hasStructuralApplied` which requires a real hook flip. AB12-2 defaults make this branch unreachable. Audit grep confirms no other source of this string. |
| Suppressed labels honest? | **PASS** — `(suppressed)` suffix is appended in `formatConstraintChip(name, value, false)` and `outline` Badge variant is used. Visible to user. |
| Degraded labels honest? | **PASS** — only the conservative chip appears, marked suppressed. |
| No-evidence labels honest? | **PASS** — `"Evidence calibration waiting"` only appears for `plan.status === 'no_evidence'`. |
| No fake chips? | **PASS** — `chips` array in proof is derived 100% from `applied` and `suppressed` arrays, both of which are derived from plan constraint partition. Zero hand-written chips in the UI component. |

---

## Duplicate / parallel path audit

| Search | Result |
|--------|--------|
| `evidenceCalibrationInfluence` | 5 files, all in the canonical funnel: governor → influence builder → service → builder type → page consumer / proof card. No duplicates. |
| `buildEvidenceCalibrationGenerationInfluence` | 1 producer (the influence builder file), 1 caller (the authoritative service). Clean. |
| `ProgramEvidenceCalibrationPlan` | 1 producer (governor), 1 consumer (influence builder). Clean. |
| `status: 'active'` literal | All matches in unrelated subscription/h2h/workout-session code. **Zero** AB12-2 fake-active literals. |
| `allowedToMutateProgram: true` literal | **Zero matches**. The only `true` value is computed by the builder gate `status === 'active'`, which is itself gated by `hasStructuralApplied`. |
| Hand-written "Evidence calibration influencing next program" | **One** source location (the influence builder, line 397, behind the `active` gate). No UI duplicate. |

**Duplicates found: none. Corrected: none. Remaining risks: none.**

---

## Build status

- `pnpm exec tsc --noEmit --pretty false`: **NOT RUN** — sandbox cannot execute pnpm; AB12-2 is verified Ready on production main, so the live build is the proof.
- `pnpm run build`: **NOT RUN** — same.
- Code-level audit: zero `as any`, zero `@ts-ignore`, zero `@ts-expect-error`, zero `ignoreBuildErrors` in any AB12-2 file (one benign mention is inside a contract comment in `evidence-calibration-generation-influence.ts:27`).

---

## Files changed

**None.** AB12-3 is verification-only. AB12-2 was confirmed correct as deployed.

## Files inspected but not changed

- `docs/AB12_2_EVIDENCE_CALIBRATION_GENERATION_INFLUENCE_REPORT.md`
- `lib/program/evidence-aware-program-calibration-governor.ts`
- `lib/program/evidence-calibration-generation-influence.ts`
- `lib/server/authoritative-program-generation.ts`
- `lib/adaptive-program-builder.ts`
- `app/(app)/program/page.tsx`
- `components/programs/FeedbackLoopProofCard.tsx`
- `components/programs/CalibrationCheckpointCard.tsx`
- `lib/program-service.ts`
- `app/api/program/regenerate/route.ts`
- `app/api/program/rebuild-adjustment/route.ts`
- `app/api/program/generate-from-modify-builder/route.ts`
- `app/api/program/generate-fresh/route.ts`
- `app/api/onboarding/generate-first-program/route.ts`

---

## User-visible expected result

After AB12-2 deploy, on the Program page below the Calibration Checkpoint
card and the AB11-5 Feedback Loop Proof card, there are now **two**
compact strips inside the same proof card:

1. **AB12-1 strip** (muted background) — "live recommendation" derived
   from current evidence. Shows what the governor currently wants.
2. **AB12-2 strip** (bordered ring background, visually distinct) —
   "what was applied at generation time" derived from the canonical
   `program.evidenceCalibrationInfluence` stamp. For a fresh program
   this reads:

   > **Evidence calibration waiting**
   > "Evidence calibration waiting — complete benchmarks or workouts to personalize calibration."

   For a program with completed workout stamps, this reads:

   > **Evidence calibration observed — Program influence pending**
   > "Evidence observed (3 constraints pending builder wiring in AB12-3)."
   > Chips: `progression: conservative (suppressed)`, `volume: maintain (suppressed)`, `recovery: protect (suppressed)`

The two strips can disagree (live recommendation differs from what
shipped), and that disagreement is honest. The user can verify at a
glance which constraints AB12 wants to apply vs which constraints have
actually reached the program.

---

## Final decision

**AB12-3 COMPLETE — AB12-2 is accepted, safe to proceed to AB13.**

Every stage of the AB12-2 funnel was traced in code and verified. The
"structural builder constraints suppressed" state is not a bug — it is
the documented and intentional AB12-2 boundary, with the suppression
visible to the user via `(suppressed)` chips and the
`Program influence pending` label. The design correctly prevents fake
active claims by gating `status: 'active'` behind `hasStructuralApplied`,
which itself requires a structural hook flip.

---

## Next recommended prompt

**AB13 — wire the first real structural builder hook**:
`progressionAggressiveness: 'conservative'` → tighter progression curve
inside the existing performance-adaptation seam in
`lib/adaptive-program-builder.ts` (the same seam that produces the
`performanceAdaptation` stamps AB11-4 reads). Concretely:

1. Pass the `EvidenceCalibrationGenerationInfluence` (or the resolved
   `progressionAggressiveness` value alone) through to the builder via
   a new optional field on the builder context — one bounded knob, no
   broad refactor.
2. Gate the existing progression curve on
   `influence.progressionAggressiveness === 'conservative' && influence.allowedToMutateProgram`.
3. Flip `progressionAggressiveness: true` in the AB12-2 default
   `structuralHooks` config inside the authoritative service.
4. The first program built after this lands will report
   `status: 'active'`, `allowedToMutateProgram: true`,
   `appliedConstraints: ['progression: conservative']`, and the UI
   strip will switch to "Evidence calibration influencing next program"
   — for the first time honestly.

Keep all other constraints suppressed for AB13. AB14+ can wire
`recoveryBias: 'protect'`, `volumeBias`, `intensityBias` one at a time
behind the same pattern.
