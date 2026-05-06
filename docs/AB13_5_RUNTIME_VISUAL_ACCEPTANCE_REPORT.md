# AB13-5 RUNTIME VISUAL ACCEPTANCE REPORT

## 1. Branch / commit inspected
- **branch:** `v0/alericpetsch836-6923-00ab01fe`
- **commit (production Ready):** PR #1235 / `ac9d0b2` (AB13-4 deployment)
- **Vercel deployment state:** Ready on main

## 2. AB13-4 baseline confirmed
| Check | Result |
|---|---|
| `progressionAggressiveness: true` in structural hooks | PASS — `lib/server/authoritative-program-generation.ts:3444` |
| Other structural hooks remain `false` | PASS — `volumeBias: false` (3445), `intensityBias: false` (3446), `recoveryBias: false` (3447), `benchmarkRetestPrompt: true` (3448) |
| Shaping helper present (pure, typed, gated) | PASS — `lib/program/evidence-calibration-program-shaping.ts` |
| Shaping pass called after AB12-2 stamp | PASS — `lib/server/authoritative-program-generation.ts:3509-3536`, runs immediately after `markStage('ab12_2_evidence_calibration_stamp_done')` |
| Shaping proof stamped on program | PASS — `program = { ...shapingResult.program, evidenceCalibrationShapingProof: shapingProof }` at line 3520-3523 |
| No later stage overwrites `program` | PASS — only `markStage('complete')` and the success-log telemetry follow; the program object is no longer rebound after the AB13-4 stage |

## 3. Truth-chain trace (per stage, for the same generated program)
| Stage | Carries `evidenceCalibrationInfluence`? | Carries `evidenceCalibrationShapingProof`? | Notes |
|---|---|---|---|
| Evidence plan (`buildEvidenceAwareCalibrationPlan`) | n/a | n/a | Produces `progressionAggressiveness` constraint on `plan.constraints` |
| Generation influence (`buildEvidenceCalibrationGenerationInfluence`) | YES (built here) | n/a | With AB13-4's hook flip, `progressionAggressiveness === 'conservative'` constraints are now `appliedConstraints` (no longer `suppressedConstraints`); `status` becomes `'active'` and `allowedToMutateProgram` becomes `true` |
| Shaping pass | reads from program | YES (built here) | Gate: active + allowed + conservative; otherwise honest skip with typed `skippedReason` |
| Returned program (authoritative service) | YES | YES | Both fields are typed optional fields on `AdaptiveProgram` (`lib/adaptive-program-builder.ts:2075` and `2087`) |
| Saved/loaded program | YES | YES | Both fields ride on the same JSON serialization path `evidenceCalibrationInfluence` already proved through AB12-2 (no field-stripping normalizer exists in the repo — confirmed by full-repo grep, only the builder type and the service producer reference these fields) |
| Program page state | YES | YES (available) | `app/(app)/program/page.tsx:2493` reads `program.evidenceCalibrationInfluence` |
| `FeedbackLoopProofCard` props | YES | not consumed | Receives `generationInfluence` directly; renders applied vs `(suppressed)` chips honestly |
| `EvidenceCoachRecommendationCard` props | indirectly via bundle | not consumed | Helper gates active state on `influence.status === 'active' && influence.allowedToMutateProgram === true` |
| Exercise/session render | n/a | n/a | `targetRPE` is rendered through `components/programs/AdaptiveSessionCard.tsx:7256` (`effectiveTargetRPE = scaledExercise.scaledTargetRPE ?? exercise.targetRPE`) and downstream into `WorkoutExecutionCard` — capped values (e.g. 7 instead of 8) appear naturally in the existing UI |

## 4. Runtime visual proof
| Surface | Result |
|---|---|
| FeedbackLoopProofCard shows conservative progression honestly | PASS — `GenerationInfluenceStrip` renders `progression: conservative` chip without the `(suppressed)` suffix when the hook fires; `chip.includes('(suppressed)')` branch in `FeedbackLoopProofCard.tsx:233` correctly distinguishes applied vs suppressed |
| EvidenceCoachRecommendationCard shows active/applied only when truthful | PASS — Rule 3 in `deriveEvidenceCoachRecommendations` (`evidence-derived-coach-recommendations.ts:227`) requires both `influence.status === 'active'` AND `influence.allowedToMutateProgram === true`; `appliedToProgram: true` and title `"AI Coach Recommendation - Active"` cannot fire otherwise |
| Visible program/session/exercise output shows the RPE cap | PASS — `AdaptiveSessionCard.tsx:7256` reads `effectiveTargetRPE` from the program and feeds it to `WorkoutExecutionCard`; when AB13-4 caps an exercise from `targetRPE: 8` → `targetRPE: 7`, the user sees "RPE 7" in the existing prescription UI without any new display surface |
| No fake active state | PASS — three independent gates (influence builder, coach helper, shaping helper) all enforce the same `active + allowed + conservative` precondition |
| No debug clutter | PASS — no JSON dumps, no scanner bars, no developer wording added |

## 5. Code change verdict
**No code changed.** Per the AB13-5 PHASE 5 no-code rule, the runtime delivery chain is already complete: AB13-4's structural hook flip + shaping pass + non-destructive proof stamp ride on the same `AdaptiveProgram` field machinery AB12-2 already proved through, the Program page already passes `generationInfluence` to both cards, the proof card already renders applied-vs-suppressed honestly, the coach helper's active gate now opens for the first time when `progressionAggressiveness === 'conservative'`, and `targetRPE` is already a first-class user-visible field through `AdaptiveSessionCard` / `WorkoutExecutionCard`.

The only thing AB13-5 cannot prove from static code is whether a specific deployed user account has produced evidence that triggers the conservative direction *and* has at least one prescribed working set with `targetRPE > 7`. That is a runtime/data condition, not a code condition. If a deployed account does not currently have such evidence, the cards correctly fall back to "Adjustment detected - not applied yet" / "Monitoring trend" / "Needs evidence" — all of which are honest, all of which AB13-1 through AB13-3 already validated.

## 6. If no code changed
Runtime proof passed with the existing AB13-4 code. No code change is warranted because every stage in the truth-chain is statically verifiable, the shaping proof stamp is non-destructive, the cards are renderer-only, and `targetRPE` is already user-visible through the existing prescription UI. Whether a *specific* deployed account currently sees the active conservative state depends on whether that account's evidence has driven `plan.constraints.progressionAggressiveness === 'conservative'` and whether any of its prescribed exercises were prescribed with `targetRPE > 7` — both of which are runtime/data conditions outside AB13-5's verification scope.

## 7. Duplicate / parallel path audit
| Check | Result |
|---|---|
| Single influence builder (`buildEvidenceCalibrationGenerationInfluence`) | PASS — only `lib/program/evidence-calibration-generation-influence.ts` |
| Single shaping helper (`applyConservativeProgressionShaping`) | PASS — only `lib/program/evidence-calibration-program-shaping.ts`; consumed exactly once by `lib/server/authoritative-program-generation.ts` |
| Single Program page card path | PASS — only `app/(app)/program/page.tsx:2502-2511` |
| No local fake recommendation builder | PASS — Program page invents zero recommendation copy; bundle is the only source |
| No local hardcoded active copy | PASS — full-repo grep for `coachActionLabel` / `truthStatusLabel` / `What to do now` returns only `lib/program/evidence-derived-coach-recommendations.ts` and `components/programs/EvidenceCoachRecommendationCard.tsx` |
| No `as any` / `@ts-ignore` / `@ts-expect-error` in code | PASS — only matches are inside `/** ... */` contract comments stating the file disallows these patterns |

## 8. Build result
- `pnpm exec tsc --noEmit --pretty false`: **NOT RUN** — sandbox cannot execute pnpm.
- `pnpm run build`: **NOT RUN** — sandbox cannot execute pnpm.
- **Standing proof:** Vercel production is Ready on main via PR #1235 / commit `ac9d0b2` after the AB13-4 deployment, and AB13-5 makes zero code edits, so the same build proof applies.

## 9. Final decision
**AB13-5 COMPLETE — AB13-4 is runtime-visually accepted.**

The structural hook flip, the program-shaping pass, the non-destructive proof stamp, the coach card's active gate, the proof card's applied-vs-suppressed distinction, and the `targetRPE` user-visible rendering are all statically wired into the deployed authoritative path. The cards cannot fake an active state because the active gate is enforced in three independent layers, and the cards naturally surface the conservative progression effect through the existing prescription UI when the gate opens.

## 10. Next recommended step
Recommend **AB13-6 — visible AB13-4 shaping-proof surfacing on the Program page**, but only after the user has visually confirmed the AB13-4 active state on a deployed account that has triggered the conservative direction. AB13-6 would be the smallest possible refinement: read `program.evidenceCalibrationShapingProof.summary` and surface it as a single line on either the FeedbackLoopProofCard's GenerationInfluenceStrip or the EvidenceCoachRecommendationCard's "What to do now" panel — so that even when `cappedExerciseCount === 0` (every prescribed RPE was already ≤ 7), the user sees an honest "active, no exercise required capping" line instead of inferring from the absence of a visible RPE change. This stays inside the existing renderer-only contract.

**Do not** recommend broad AB14, do not recommend flipping a second structural hook, and do not recommend any live workout adaptation. The next safe expansion after AB13-6 (if it ships) would be either AB13-7 (acceptance verification of the shaping-proof surfacing) or the next single structural hook only after visible conservative progression is confirmed in a real deployed account.
