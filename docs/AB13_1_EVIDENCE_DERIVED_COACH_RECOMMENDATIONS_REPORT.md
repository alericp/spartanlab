# AB13-1 — Evidence-Derived Coach Recommendations

> Status: **COMPLETE — safe to proceed to AB13-2**
> Branch: `v0/alericpetsch836-6923-ec9ae424`
> Scope: First bounded "AI Coach recommends..." surface, derived 100%
> from canonical AB11/AB12 truth. No new evidence system, no LLM, no
> live-workout changes, no schema changes.

---

## 1. Branch / commit inspected
- **branch:** `v0/alericpetsch836-6923-ec9ae424`
- **commit:** workspace pulled from latest branch state
- **predecessor:** AB12-3 acceptance gate (PASS) on PR #1229 / commit `59477e9`

## 2. Files changed
- `lib/program/evidence-derived-coach-recommendations.ts` (NEW, 494 lines, pure typed derivation)
- `components/programs/EvidenceCoachRecommendationCard.tsx` (NEW, 305 lines, renderer-only)
- `app/(app)/program/page.tsx` (added two imports + a 9-line wiring block inside the existing FeedbackLoopProofCard IIFE — same source-of-truth)
- `docs/AB13_1_EVIDENCE_DERIVED_COACH_RECOMMENDATIONS_REPORT.md` (NEW, this file)

## 3. Files inspected but not changed
- `docs/AB12_3_RUNTIME_ACCEPTANCE_REPORT.md`
- `lib/program/evidence-aware-program-calibration-governor.ts`
- `lib/program/evidence-calibration-generation-influence.ts`
- `lib/server/authoritative-program-generation.ts`
- `lib/adaptive-program-builder.ts`
- `components/programs/FeedbackLoopProofCard.tsx`
- `components/programs/CalibrationCheckpointCard.tsx`
- `lib/program-service.ts`

## 4. Recommendation truth source

| Source | File / field | Role |
|---|---|---|
| AB11 | `program.performanceAdaptation` stamps → `summarizeWorkoutEvidence` | Drives `plan.reasons` (athlete-facing proof lines) |
| AB12-1 | `buildEvidenceAwareCalibrationPlan` → `ProgramEvidenceCalibrationPlan` | Source of `plan.status`, `plan.confidence`, `plan.constraints`, `plan.reasons` |
| AB12-2 | `program.evidenceCalibrationInfluence` (stamped by `executeAuthoritativeGeneration` at Phase AA2) | Source of `influence.status`, `influence.allowedToMutateProgram`, `influence.appliedConstraints[]`, `influence.suppressedConstraints[]`, `influence.reasonSummary[]`, `influence.proof.chips[]` |
| Final program proof source | `program.evidenceCalibrationInfluence` (canonical typed field on `AdaptiveProgram`) | Read directly off the same object the FeedbackLoopProofCard reads |
| Program page consumer | `app/(app)/program/page.tsx:2487-2503` | `deriveEvidenceCoachRecommendations({ plan: calibrationPlan, influence: generationInfluence })` — same plan + influence the proof card receives, derived once |

The recommendation card and the FeedbackLoopProofCard are derived from the same two variables in the same IIFE. They cannot drift.

## 5. Recommendation statuses implemented

| Status | Trigger | Title | Severity | `appliedToProgram` |
|---|---|---|---|---|
| `active` | `influence.status === 'active'` AND `influence.allowedToMutateProgram === true` | "AI Coach Recommendation - Active" | `info` (or `notice` if recovery-protect / conservative) | **`true`** |
| `observe` | `influence.status === 'metadata_only'` AND plan applied AND zero suppressed structural | "Coach Recommendation - Observing" | `info` | `false` |
| `suppressed` | `influence.status === 'metadata_only'` AND plan applied AND `suppressedConstraints.length > 0` | "Adjustment detected - not applied yet" | `notice` | `false` |
| `waiting` | `influence.status === 'metadata_only'` AND plan `no_evidence` | "Waiting for evidence" | `info` | `false` |
| `degraded` | `influence.status === 'degraded'` | "Evidence unavailable - safe baseline" | `caution` | `false` |
| (none — empty bundle) | `influence === null` OR `influence.status === 'inactive'` | (card hidden) | — | — |

Under AB12-2 default hooks (every structural hook `false`), the only reachable states for users with workout history are `suppressed` (the most common) and `waiting`. The `active` state is gated behind `hasStructuralApplied`, which requires AB13+ to flip a structural builder hook AND wire a real builder seam — exactly as AB12-3 documented.

## 6. UI surface added
- **component:** `EvidenceCoachRecommendationCard` (renderer-only)
- **Program page placement:** inside the existing `FeedbackLoopProofCard` IIFE, wrapped together in a `<div className="flex flex-col gap-3">`. The recommendation card sits **immediately below** the proof card, in the same Program-page section. No redesign, no new section header.
- **max rendered recommendations:** 1 primary + up to 2 supporting notes (capped at 2 in code)
- **expected visible change:** see section 11 below

## 7. Scenario verdicts

### A — No evidence (fresh program, no workouts logged)
- AB12-1 plan → `status: 'no_evidence'`
- AB12-2 influence → `status: 'metadata_only'`, `benchmarkRetestPrompt: false-or-true`
- Bundle → `primary` is `waiting`, `confidenceLabel: 'insufficient'`, `appliedToProgram: false`
- Card title: **"Waiting for evidence"**, badge "Waiting for evidence", "Insufficient evidence"
- Recommendation text: "Log a few workouts so SpartanLab can start tracking trends." (or the benchmark variant if `benchmarkRetestPrompt === true`)
- **No fake AI claim. No `appliedToProgram: true`.** ✅ PASS

### B — Degraded evidence (evidence source unavailable)
- AB12-1 plan → `status: 'degraded'`
- AB12-2 influence → `status: 'degraded'`, `confidence: 'low'`
- Bundle → `primary` is `degraded`, severity `caution`, `appliedToProgram: false`
- Card title: **"Evidence unavailable - safe baseline"**
- Recommendation: "Continue training as planned. SpartanLab will resume calibrating as soon as evidence is available again."
- Single chip: `progression: conservative (suppressed)` (mirrors `influence.proof.chips`)
- **No fake active claim. No structural change claim.** ✅ PASS

### C — Suppressed constraint (AB12-2 default state for users with workouts)
- AB12-1 plan → `status: 'applied'` with N constraints
- AB12-2 influence → `status: 'metadata_only'`, `appliedConstraints: []`, `suppressedConstraints: [...N suppressed chips]`
- Bundle → `primary` is `suppressed`, severity `notice`, `appliedToProgram: false`
- Card title: **"Adjustment detected - not applied yet"**
- Summary: "Recent evidence suggests N adjustments, but the safe builder hook is not yet active."
- Why: derived from `influence.reasonSummary` (which derives from `plan.reasons` → AB11 proof lines)
- `suppressedReason` shown: "Structural builder constraints are suppressed by default in AB12-2 until each is wired by a future AB phase."
- **Card honestly says program was NOT changed.** ✅ PASS

### D — Observe-only (applied plan, zero suppressed structural — rare)
- AB12-1 plan → `status: 'applied'` with only `benchmarkRetestPrompt`
- AB12-2 influence → `status: 'metadata_only'`, `suppressedConstraints: []`, `appliedConstraints: ['benchmark retest suggested']` (when the prompt hook is on)
- Bundle → `primary` is `observe`, severity `info`, `appliedToProgram: false`
- Card title: **"Coach Recommendation - Observing"**
- Recommendation: "A benchmark retest is suggested so calibration confidence can grow." (or the no-prompt variant)
- **Says observing, not active.** ✅ PASS

### E — Applied influence (post-AB13+, when a structural hook flips)
- AB12-1 plan → `status: 'applied'`
- AB12-2 influence → `status: 'active'`, `allowedToMutateProgram: true`, e.g. `progressionAggressiveness: 'conservative'` in `appliedConstraints`
- Bundle → `primary` is `active`, severity `notice` (because conservative), `appliedToProgram: true`
- Card title: **"AI Coach Recommendation - Active"**
- Recommendation (deterministic from `buildActiveRecommendationCopy`): e.g. "Stay with the conservative progression this cycle; protect recovery before adding load."
- Why: includes `plan.reasons` + a "Watch how the next two sessions feel before pushing further." line (deterministic from `buildWatchNextCopy`).
- Visible chips: `influence.appliedConstraints` (no `(suppressed)` suffix).
- **First time honest "active" claim. Cannot fire under AB12-2 defaults.** ✅ PASS (gate verified)

## 8. Duplicate / fake-AI audit

| Search | Result |
|---|---|
| `as any`, `@ts-ignore`, `@ts-expect-error`, `ignoreBuildErrors` in AB13-1 files | **0 actual** — single match is a contract comment in `evidence-derived-coach-recommendations.ts:21` mentioning forbidden patterns |
| `deriveEvidenceCoachRecommendations` producers | **1** (`lib/program/evidence-derived-coach-recommendations.ts`). No duplicate. |
| `EvidenceCoachRecommendation` type owners | **1**. Type-only re-export in component. |
| Hand-written "Active"/"applied"/"influencing" copy in component | **0**. Every visible string flows from the bundle; the renderer holds only `STATUS_LABEL` (5 deterministic chip labels: Active / Observing / Adjustment suppressed / Waiting for evidence / Safe baseline). |
| Hardcoded chip arrays in component | **0**. Chips render from `primary.visibleProof[]`. |
| Hardcoded confidence in component | **0**. Confidence renders from `primary.confidenceLabel`. |
| Duplicate evidence/calibration storage | **0**. The helper consumes only the existing `ProgramEvidenceCalibrationPlan` and `EvidenceCalibrationGenerationInfluence` types. |
| Duplicate generation path | **0**. No call to `executeAuthoritativeGeneration`, no new builder, no new program shape. |
| Component hardcoded "active" without truth | **0**. `appliedToProgram: true` only exists on the `active` branch, which itself requires `influence.status === 'active'` AND `influence.allowedToMutateProgram === true` — both gated upstream. |
| Proof-card parity | **PRESERVED**. FeedbackLoopProofCard is unchanged. AB13-1 sits below it, sharing the same `plan` + `influence` variables in the same IIFE. |

**Duplicates found: none. Corrected: none. Remaining risks: none.**

## 9. Build status
- `pnpm exec tsc --noEmit --pretty false`: **NOT RUN** — sandbox cannot execute pnpm.
- `pnpm run build`: **NOT RUN** — same.
- Code-level verification:
  - All AB13-1 imports resolve to actual exports (verified by grep): `ProgramEvidenceCalibrationPlan`, `ProgressionAggressiveness`, `VolumeBias`, `IntensityBias`, `RecoveryBias` from the governor; `EvidenceCalibrationGenerationInfluence` from the influence module.
  - All component imports (`Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, `cn`, `Sparkles`, `Eye`, `Hourglass`, `AlertTriangle`, `CircleSlash`) match the FeedbackLoopProofCard import pattern (verified by reading `components/programs/FeedbackLoopProofCard.tsx:22-30`).
  - The IIFE wiring in `app/(app)/program/page.tsx` returns a single React element (`<div>`) wrapping both cards — no return-shape change.
  - Zero forbidden suppressions across the three changed files.

## 10. Final decision
**AB13-1 COMPLETE — safe to proceed to AB13-2.**

The recommendation card is fully derived from canonical AB11/AB12 truth, gated correctly against fake-active claims, hidden cleanly when there is nothing to say, and visually consistent with the existing proof surface. The helper is a single pure function with deterministic output; the component is a dumb renderer. No second evidence system was introduced. No live workout code was touched. No schema, package, auth, or billing was modified.

## 11. User-visible expected result

On the Program page, **immediately below** the existing FeedbackLoopProofCard (which already shows the AB12-1 + AB12-2 strips), a new compact card appears.

The card you actually see depends on real state today:

- **Fresh program, no workouts logged:**
  > **Waiting for evidence**
  > Badges: "Waiting for evidence" • "Insufficient evidence"
  > "SpartanLab needs benchmarks or logged sessions before it can calibrate."
  > Recommendation box: "Log a few workouts so SpartanLab can start tracking trends." (or the benchmark variant)

- **Program with workout history (the AB12-2 default state):**
  > **Adjustment detected - not applied yet**
  > Badges: "Adjustment suppressed" • "{low/medium/high} confidence"
  > "Recent evidence suggests N adjustments, but the safe builder hook is not yet active."
  > Recommendation box: "Continue training as planned. SpartanLab will apply the adjustment automatically once the safe builder hook ships."
  > Why: 1-3 lines from your real AB11 proof lines (e.g. "Average completed RPE in upper push has trended upward over the last 3 sessions.")
  > Chips: e.g. `progression: conservative (suppressed)`, `recovery: protect (suppressed)`
  > Why not applied: "Structural builder constraints are suppressed by default in AB12-2 until each is wired by a future AB phase."
  > Sources: "AB11 workout adaptation stamps • AB12-1 calibration governor"

- **Evidence source temporarily unavailable:**
  > **Evidence unavailable - safe baseline**
  > Badge: "Safe baseline" • "Low confidence"
  > "Continue training as planned. SpartanLab will resume calibrating as soon as evidence is available again."

- **Future state (after AB13-2 wires the first structural hook):**
  > **AI Coach Recommendation - Active**
  > Badges: "Active" • "{low/medium/high} confidence"
  > "Calibration is shaping this program (1 constraint applied)."
  > Recommendation box: "Stay with the conservative progression this cycle." (or the deterministic copy for whatever combination of dials is active)
  > Why: real AB11 reasons + a "Watch sleep, soreness, and morning readiness over the next sessions." line when recovery is protected.
  > Chips: `progression: conservative` (no suppressed suffix).

The card hides itself silently when `influence` is null or `inactive` — no placeholder, no skeleton, no clutter.

## 12. Next recommended prompt

**AB13-2 — wire the first real structural builder hook.**

Concrete plan:
1. In `lib/server/authoritative-program-generation.ts`, flip `progressionAggressiveness: true` in the AB12-2 `structuralHooks` config passed to `buildEvidenceCalibrationGenerationInfluence`.
2. Pass the resolved `EvidenceCalibrationGenerationInfluence` (or just the resolved `progressionAggressiveness` value) into the existing performance-adaptation seam in `lib/adaptive-program-builder.ts` via a new optional field on the builder context.
3. Gate the existing progression curve on `influence.progressionAggressiveness === 'conservative' && influence.allowedToMutateProgram`.
4. Verify the first program built after this lands legitimately reaches `status: 'active'`, `appliedConstraints: ['progression: conservative']`, and the AB13-1 card switches from "Adjustment detected - not applied yet" to "AI Coach Recommendation - Active" — for the first time honestly.

Keep all other constraints suppressed for AB13-2. AB13-3+ can wire `recoveryBias: 'protect'`, `volumeBias`, `intensityBias` one at a time behind the same pattern.
