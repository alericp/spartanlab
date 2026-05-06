# AB13-4 — Progression Aggressiveness Structural Hook Report

## 1. Branch / commit inspected
- **branch:** `v0/alericpetsch836-6923-2b00c764`
- **predecessor:** AB13-3 PASS on PR #1234 / commit `a2e79aa`

## 2. Previous state
- AB13-1: helper + card created
- AB13-1B: Program page wiring restored
- AB13-2: actionability layer added (8 new fields)
- AB13-3: runtime visual acceptance verified (no code change, only report)
- Vercel state: production Ready on main at commit `a2e79aa` / PR #1234

## 3. Files inspected
- `lib/program/evidence-calibration-generation-influence.ts`
- `lib/program/evidence-derived-coach-recommendations.ts`
- `lib/server/authoritative-program-generation.ts`
- `lib/adaptive-program-builder.ts` (only the `AdaptiveProgram` / `AdaptiveSession` / `AdaptiveExercise` interfaces and the existing `targetRPE` cap precedents at lines 28735, 29300, 29444, 29534)
- `components/programs/EvidenceCoachRecommendationCard.tsx` (verified renderer-only contract preserved)
- `components/programs/FeedbackLoopProofCard.tsx` (verified untouched)

## 4. Files changed
- **NEW** `lib/program/evidence-calibration-program-shaping.ts` — 299 lines, pure helper, single producer of conservative-progression mutation
- `lib/adaptive-program-builder.ts` — added one optional field `evidenceCalibrationShapingProof?` on the `AdaptiveProgram` interface (mirror of the existing AB12-2 `evidenceCalibrationInfluence?` precedent)
- `lib/server/authoritative-program-generation.ts` — flipped one structural hook from `false` to `true`, added one shaping-pass stage in its own try/catch immediately after the AB12-2 stamp
- **NEW** `docs/AB13_4_PROGRESSION_AGGRESSIVENESS_STRUCTURAL_HOOK_REPORT.md` (this file)

## 5. Hook change
- **progressionAggressiveness before:** `false` (suppressed since AB12-2)
- **progressionAggressiveness after:** `true` (first real structural hook in the system)
- **volumeBias unchanged:** `false`
- **intensityBias unchanged:** `false`
- **recoveryBias unchanged:** `false`
- **benchmarkRetestPrompt unchanged:** `true`

## 6. Influence contract verdict
- **active requires real hook:** PASS — `buildEvidenceCalibrationGenerationInfluence` only sets `status: 'active'` when `hasStructuralApplied === true`, which now requires `progressionAggressiveness !== null`, which requires `hooks.progressionAggressiveness === true` AND the plan to recommend it
- **allowedToMutateProgram still tied to active:** PASS — set on a single line: `const allowedToMutateProgram = status === 'active'`
- **appliedConstraints populated only by real hooks:** PASS — partition logic at lines 318-340 of the influence builder is unchanged; the only change is one hook value
- **suppressedConstraints remain honest:** PASS — `volumeBias`, `intensityBias`, `recoveryBias` still partition into suppressed
- **no fake active:** PASS — no helper hardcodes status

## 7. Program-shape mutation verdict
- **conservative influence read from canonical `program.evidenceCalibrationInfluence`:** PASS — the wiring at line 3470+ reads `program.evidenceCalibrationInfluence ?? null`, the SAME field stamped by AB12-2 one stage earlier
- **mutation only runs when active + allowed + conservative:** PASS — four sequential gates inside `applyConservativeProgressionShaping` (`!influence` → `status !== 'active'` → `allowedToMutateProgram !== true` → `progressionAggressiveness !== 'conservative'`)
- **cloned program object used:** PASS — `program.sessions.map(...)` clones each touched session via `{ ...session, exercises: newExercises }`; each touched exercise is cloned via `{ ...ex, targetRPE: 7 }`; the program itself is wrapped with `{ ...shapingResult.program, evidenceCalibrationShapingProof: shapingProof }` in the service
- **actual visible/session/exercise field changed:** PASS — `targetRPE` on every prescribed working row whose value was `> 7`. This is the SAME field the live workout session reads, the live workout reducer reads, and the program-card UI reads
- **no schedule/skill/equipment rewrite:** PASS — sessions, scheduleMode, selectedSkills, exercise selection, blocks, methods, sets, reps all untouched
- **no live workout mutation:** PASS — shaping runs server-side at generation time only
- **no fallback conversion:** PASS — when gate is closed the helper returns the SAME program reference

## 8. Visible proof verdict
- **FeedbackLoopProofCard remains derived:** PASS — reads `generationInfluence.proof.label / summary / chips` (no code change, no hardcoded copy)
- **EvidenceCoachRecommendationCard remains derived:** PASS — renderer-only, all visible strings flow from `bundle.primary` produced by `deriveEvidenceCoachRecommendations`
- **no local Program page copy builder:** PASS — verified via grep
- **expected visible user-facing change named:** When a user has performance evidence that triggers the AB12-1 plan to recommend `'conservative'` progression, the influence resolves to `status: 'active'`, `allowedToMutateProgram: true`, `appliedConstraints: ['progression: conservative']` (NO suppressed suffix). Both visible cards then truthfully show:
  - FeedbackLoopProofCard: label "Evidence calibration influencing next program", chip `progression: conservative` (no suppressed suffix)
  - EvidenceCoachRecommendationCard: title "AI Coach Recommendation - Active", "Applied to this program" status chip, "Follow the calibrated adjustment" coach action, `appliedToProgram: true`
  - And — for the first time honestly — the actual program shape changes: every prescribed working-set RPE > 7 is now capped at 7

## 9. Duplicate/parallel path audit
- **single influence builder:** PASS — `buildEvidenceCalibrationGenerationInfluence` defined exactly once (`lib/program/evidence-calibration-generation-influence.ts`)
- **single generation stamp path:** PASS — `executeAuthoritativeGeneration` is the only stamp site
- **single shaping consumer:** PASS — `applyConservativeProgressionShaping` defined once and called once (the service)
- **no duplicate coach helper:** PASS — `deriveEvidenceCoachRecommendations` defined once
- **no fake UI active state:** PASS — every "active" claim now flows from the real influence object that requires a real hook + a real plan recommendation

## 10. Build result
- **`pnpm exec tsc --noEmit --pretty false`:** NOT RUN — sandbox cannot execute pnpm. Code-level audit: zero `as any`, zero `@ts-ignore`, zero `@ts-expect-error`, all imports resolve to verified exported names, the new optional field on `AdaptiveProgram` matches the existing AB12-2 precedent for an optional typed field
- **`pnpm run build`:** NOT RUN — same. Standing proof: AB13-2/AB13-3 deployed Ready on main; AB13-4 only adds one optional field, one new pure helper file, and one stage inside an existing `try/catch`-style structure

## 11. Final decision
**AB13-4 COMPLETE** — `progressionAggressiveness` now has a real structural hook AND a real downstream consumer. When the AB12-1 plan recommends conservative progression for an account with eligible evidence, the influence resolves to active, the shaping pass runs, every prescribed working-set RPE > 7 gets capped at 7, the proof object is stamped on the program, and both visible cards (FeedbackLoopProofCard + EvidenceCoachRecommendationCard) reflect the change automatically because they were already derived from the same influence object.

The honest active claim is no longer fakeable: it requires (a) the hook to be `true`, (b) the plan to actually recommend `'conservative'`, AND (c) the shaping pass to either find rows to cap or honestly report `appliedAtLeastOneMutation: false` when the program had no rows above ceiling. The proof object distinguishes "ran but found nothing to cap" from "did not run because gate was closed", and the `skippedReason` enum makes future debugging straightforward.

## 12. Next recommended step
**AB13-5 — runtime/visual acceptance verification of the AB13-4 conservative-progression effect on a real generated program**, mirroring the AB13-3 approach: do not flip another structural hook yet. Verify that on an account with conservative-recommending evidence the cards switch from "Adjustment detected - not applied yet" to "Applied to this program", and that at least one exercise row visibly shows targetRPE 7 where the pre-AB13-4 program had a higher value. After AB13-5 confirms the visible flip, AB13-6 can move to the second structural hook (recommended order: `recoveryBias: 'protect'` because it composes safely with conservative progression and never makes a session harder).
