# AB13-8 FINAL RUNTIME ACCEPTANCE LOCK REPORT

## 1. Status
COMPLETE

## 2. Files inspected
- `lib/program/evidence-calibration-program-shaping.ts`
- `lib/adaptive-program-builder.ts` (AdaptiveProgram + AdaptiveExercise)
- `lib/server/authoritative-program-generation.ts` (stamp + shaping call site, lines ~3453, ~3510-3528)
- `app/(app)/program/page.tsx` (canonical proof reads, lines ~2493, ~2501, ~2507)
- `lib/program/evidence-derived-coach-recommendations.ts` (AB13-6 helper)
- `components/programs/EvidenceCoachRecommendationCard.tsx`
- `components/programs/AdaptiveSessionCard.tsx` (chip block, lines ~7644-7702)

## 3. Files changed
- `components/programs/AdaptiveSessionCard.tsx` — removed the unknown-cast in the AB13-7 chip block; now uses direct typed access via `AdaptiveExercise.evidenceCalibrationRpeCap`.
- `docs/AB13_8_FINAL_RUNTIME_ACCEPTANCE_LOCK_REPORT.md` — this report.

## 4. Whether code changed
YES — one tiny type-safety cleanup. No behavior change, no new logic, no new structural hook, no UI change.

## 5. Exact chain verdict

### Stage A — Influence gate: PASS
- `EvidenceCalibrationGenerationInfluence` is created upstream and stamped on `program.evidenceCalibrationInfluence` at `authoritative-program-generation.ts` line 3453.
- The active path requires `status === 'active'` AND `allowedToMutateProgram === true` AND `progressionAggressiveness === 'conservative'` (verified inside `applyConservativeProgressionShaping` Gates 2-4).

### Stage B — Shaping helper: PASS
- `applyConservativeProgressionShaping` is pure, gate-correct, clone-on-write.
- Eligibility: `typeof targetRPE === 'number'` AND `Number.isFinite(targetRPE)` AND `targetRPE > 7` AND category not in `NON_PRESCRIPTIVE_CATEGORIES` (warmup/warm-up/warm_up/cooldown/cool-down/cool_down/mobility/recovery/prehab/rehab).
- `rpeBefore = ex.targetRPE` is captured BEFORE any mutation; the explicit `if (typeof rpeBefore !== 'number') return ex` keeps TS narrowing aligned with the runtime guarantee — no `as any`, no suppression.
- Stamp is constructed with `applied: true`, `rpeAfter === ceilingRpe === 7`, `rpeBefore > rpeAfter`, and a user-safe `reasonCoachLine`.
- Stamp is attached to a CLONED row (`{ ...ex, targetRPE: 7, evidenceCalibrationRpeCap: rowStamp }`); the original reference is untouched.

### Stage C — Program proof: PASS
- `evidenceCalibrationShapingProof` is built every time the helper is called (gate open OR closed) — never null, never fabricated.
- `appliedAtLeastOneMutation` is true iff `cappedExerciseCount > 0`. The "checked / no-cap-required" state stays distinct (`ranShapingPass: true, appliedAtLeastOneMutation: false`).
- Skipped reasons are honest: `no_influence` / `status_not_active` / `not_allowed_to_mutate` / `progression_not_conservative`.

### Stage D — Authoritative save/return: PASS
- `lib/server/authoritative-program-generation.ts` lines 3510-3523:
  ```
  const shapingResult = applyConservativeProgressionShaping(
    program,
    program.evidenceCalibrationInfluence ?? null,
  )
  …
  program = {
    ...shapingResult.program,
    evidenceCalibrationShapingProof: shapingProof,
  }
  ```
- The `program` variable that flows forward IS the post-shaping clone — the row-level stamps live on `shapingResult.program.sessions[i].exercises[j]`, and the spread `...shapingResult.program` preserves those references.
- Order is critical and correct: the AB13-4 shaping pass runs AFTER `mapToAdaptiveExercises` and AFTER the AB12-2 influence stamp, so no upstream mapper can strip the row stamps. JSON serialization round-trips optional fields verbatim (same precedent as `stressAdjustmentDelta` and `performanceAdaptation`).
- The `try` block stamps a diagnostic on success and a separate skipped-proof shape only on the catch path — no code path returns or saves the pre-shaped program.

### Stage E — Program page consumption: PASS
- `app/(app)/program/page.tsx` line 2493: `const generationInfluence = program.evidenceCalibrationInfluence ?? null` (canonical).
- Line 2501: `program.evidenceCalibrationShapingProof ?? null` (canonical).
- Line 2507: `deriveEvidenceCoachRecommendations({ plan, influence: generationInfluence, shapingProof: generationShapingProof })`.
- The same `program.sessions` flow into `AdaptiveSessionCard`, so the chip's `exercise` prop is the same shaped row whose stamp was created at the mutation site.

### Stage F — EvidenceCoachRecommendationCard / FeedbackLoopProofCard consumption: PASS
- The AB13-6 helper (`evidence-derived-coach-recommendations.ts`) takes `{ plan, influence, shapingProof }` and produces `programShapingProofStatus ∈ {'applied' | 'checked_no_change' | 'skipped' | 'unavailable'}` plus user-safe `programShapingProofLabel` and `programShapingProofDetail`.
- `EvidenceCoachRecommendationCard` renders verbatim from the bundle — no local fabrication.
- Active/applied wording requires the existing `appliedToProgram === true` gate (which itself requires `status === 'active'` AND `allowedToMutateProgram === true`); the AB13-6 shaping fields are spread additively and CANNOT promote a non-active recommendation to applied.

### Stage G — AdaptiveSessionCard chip consumption: PASS
- Renders ONLY when `exercise.evidenceCalibrationRpeCap` is defined, `applied === true`, and both `rpeBefore` / `rpeAfter` are numeric.
- After AB13-8: direct typed access (`exercise.evidenceCalibrationRpeCap`) replaces the previous `as unknown as { ... }` shape — type safety improved, runtime behavior identical.
- Tooltip / `aria-label` use the producer-supplied `reasonCoachLine` (`"Evidence calibration capped this from RPE {before} to {after}."`), with a typed fallback that produces the same message.
- Compact chip lives inside the existing chip strip; no new section, no new layout.

### Stage H — Runtime visual: PASS by code path
- Code-level guarantees fully wired. Visual confirmation on a real deployed account whose evidence triggers `progressionAggressiveness === 'conservative'` AND has at least one row originally `> RPE 7` is the only remaining external check.

## 6. Same-canonical-program guarantee
PASS — both surfaces derive from the SAME canonical post-shaping program object:
- `program.evidenceCalibrationShapingProof` (program-level proof) is stamped on the same `program` reassignment that carries `program.sessions[].exercises[].evidenceCalibrationRpeCap` (row-level proof). They cannot diverge — there is exactly one assignment site (`authoritative-program-generation.ts` line 3520).
- The Program page reads both surfaces off the same `program` variable (lines 2493 / 2501).

## 7. Row chip remains stamp-only
PASS:
- The only executable read in the chip block is `exercise.evidenceCalibrationRpeCap` followed by three honest runtime guards.
- The only `targetRPE === 7` reference in the file is inside a JSDoc comment that explicitly forbids that inference.
- Repository-wide grep for `targetRPE === 7` / `targetRPE === CONSERVATIVE_RPE_CEILING` returns only the comment in `AdaptiveSessionCard.tsx` and zero executable matches.

## 8. Unknown-cast disposition
REPLACED.
- Before: `(exercise as unknown as { evidenceCalibrationRpeCap?: { … local duplicate shape … } }).evidenceCalibrationRpeCap`.
- After: `exercise.evidenceCalibrationRpeCap`.
- Justification: `AdaptiveExercise` (line 2042 of `lib/adaptive-program-builder.ts`) already declares the field as `evidenceCalibrationRpeCap?: import('./program/evidence-calibration-program-shaping').EvidenceCalibrationRpeCapStamp`. The `import('…')` form is a TYPE-ONLY import, so direct typed access introduces ZERO runtime coupling, ZERO circular dependency risk, and ZERO new value imports in the renderer. The local duplicate shape was strictly worse: it could silently drift from the producer's exported `EvidenceCalibrationRpeCapStamp`. The runtime guards (`applied !== true`, numeric before/after) are kept as belt-and-suspenders defenses.
- No `as any`, no `@ts-ignore`, no `@ts-expect-error` introduced. None of the surrounding pre-existing `as any` lines (Phase 7B session resolution near lines 607-609, 2903, 2912) were touched — those are explicitly out of AB13-8 scope.

## 9. Build result
- `pnpm exec tsc --noEmit --pretty false`: NOT RUN (sandbox cannot execute pnpm).
- `pnpm run build`: NOT RUN (sandbox cannot execute pnpm).
- Standing proof of buildability: AB13-7 was deployed Ready on `main` via PR #1238 / commit `8f8213c`. AB13-8's only code change replaces a typed-but-unnecessary unknown-cast with direct field access on a type that already declares the field; this strictly tightens type-checking and cannot produce a new TS error.

## 10. Runtime visual expectation
On a deployed user/program where evidence triggers active conservative progression AND ≥1 working-set row originally has `targetRPE > 7`:
1. `EvidenceCoachRecommendationCard` shows the active/applied state with the AB13-6 shaping-proof line `"Program shaping applied — Capped N working-set RPE target(s) at RPE 7 this cycle."`
2. `FeedbackLoopProofCard` shows the conservative-progression chip without the `(suppressed)` suffix.
3. Affected exercise rows show `targetRPE: 7` AND a compact teal `RPE capped` chip in the existing chip strip; tooltip / aria-label reads `"Evidence calibration capped this from RPE {before} to 7."`.
4. Naturally-7 rows (and any row without the producer's stamp) show NO chip.
5. Conservative-active-but-no-cap-needed: card shows `"Program shaping checked — Conservative progression is active, but no exercise needed an RPE cap…"`; no row chips appear (correct, not a failure).
6. Non-active states: no fake applied claim, no row chips.

## 11. Safe to proceed
- AB13 is code-chain locked.
- Visual confirmation on a real deployed account is the only remaining external check (cannot be performed inside the sandbox).
- Safe to proceed to AB14 / next intelligence phase ONLY AFTER a deployed account visually confirms the AB13-6 program proof line AND the AB13-7 row chip render together for at least one capped row.
- Until that visual confirmation, the safe direction is a narrow runtime touch-up (e.g. enumerating capped exercise names inside the AI Coach card from the same row stamps), not a second structural hook.

## 12. Final decision
**B. "AB13 code chain is locked, but runtime visual confirmation is still required."**

Code chain is verified end-to-end: every stage from evidence influence → shaping helper → program proof → authoritative save/return → Program page → coach card → row chip derives from the same canonical post-shaping program object, with no fake-active path, no `targetRPE === 7` inference, and no second structural hook. The single remaining external dependency is a deployed account whose evidence triggers `progressionAggressiveness === 'conservative'` AND has at least one working-set row originally above RPE 7 — only the user can confirm that condition exists in production data.
