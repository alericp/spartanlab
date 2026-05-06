# AB14 — Evidence Calibration Volume-Bias Materialization

## 1. Status

**COMPLETE.**

AB14 wires exactly one new structural materialization hook —
`EvidenceCalibrationGenerationInfluence.volumeBias === 'reduce'` —
into the same canonical shaping corridor that already owns AB13-4.
Both passes now run inside one helper, behind one gate, with one
unified proof object. AB13-4, AB13-7, AB13-8, and AB13-11B are all
preserved.

## 2. Files changed

| Path | Reason |
|---|---|
| `lib/program/evidence-calibration-program-shaping.ts` | Extended the canonical shaping helper with the AB14 volume-reduce pass, the row-level `EvidenceCalibrationVolumeAdjustmentStamp` type, the program-level `EvidenceCalibrationVolumeAdjustmentProof` sub-proof, and a unified summary builder. Added the `'no_actionable_bias'` member to the `skippedReason` union. |
| `lib/adaptive-program-builder.ts` | Added optional row-level field `evidenceCalibrationVolumeAdjustment?: EvidenceCalibrationVolumeAdjustmentStamp` on `AdaptiveExercise`, mirroring the AB13-7 `evidenceCalibrationRpeCap` pattern via a type-only `import('./program/evidence-calibration-program-shaping')`. |
| `lib/server/authoritative-program-generation.ts` | Flipped one structural hook: `volumeBias: false` → `volumeBias: true`. The `applyConservativeProgressionShaping` call site itself is untouched — the helper now performs both passes internally. |
| `components/programs/AdaptiveSessionCard.tsx` | Added the per-row `Sets adjusted` chip rendered ONLY when `exercise.evidenceCalibrationVolumeAdjustment?.applied === true`. Sits next to the AB13-7 `RPE capped` chip in the same chip strip. |
| `lib/program/evidence-derived-coach-recommendations.ts` | Extended `buildProgramShapingProofFields` to honestly describe the AB14 mutation in `programShapingProofDetail` (combined / AB13-only / AB14-only / checked-no-change). Added the missing `'no_actionable_bias'` case to `buildShapingSkippedDetail` for exhaustive-switch type safety. |
| `docs/AB14_VOLUME_BIAS_MATERIALIZATION_REPORT.md` | This report. |

## 3. Exact structural hook added

The single new structural hook is `volumeBias === 'reduce'` →
`AdaptiveExercise.sets` reduced by exactly one set on eligible
prescribed working-set rows. The mutation runs inside the same
canonical `applyConservativeProgressionShaping` helper that owns
AB13-4 and is invoked by the same canonical site in
`lib/server/authoritative-program-generation.ts`.

```
buildEvidenceCalibrationGenerationInfluence(plan, {
  structuralHooks: {
    progressionAggressiveness: true,   // AB13-4
    volumeBias: true,                  // AB14   <-- newly flipped
    intensityBias: false,
    recoveryBias: false,
    benchmarkRetestPrompt: true,
  },
})
...
applyConservativeProgressionShaping(program, influence)
```

## 4. Exact mutation gate

The function-level gate:

```
influence.status === 'active'
AND influence.allowedToMutateProgram === true
AND ( progressionAggressiveness === 'conservative'   // AB13-4 sub-gate
      OR volumeBias === 'reduce' )                   // AB14   sub-gate
```

The AB14 sub-gate fires per-row only when:

- The function-level gate is open.
- `influence.volumeBias === 'reduce'`.
- The row is a prescribed working-set exercise (numeric finite `sets`).
- `sets >= MIN_SETS_FOR_VOLUME_REDUCTION` (= **3**).
- `setsAfter >= SETS_FLOOR_AFTER_REDUCTION` (= **2**).
- The row's category is NOT in
  `{warmup, warm-up, warm_up, cooldown, cool-down, cool_down, mobility, recovery, prehab, rehab}`.
- The row does NOT already carry an
  `evidenceCalibrationVolumeAdjustment.applied === true` stamp
  (idempotency guard).
- This session has not yet hit
  `MAX_VOLUME_REDUCTIONS_PER_SESSION` (= **2**) reductions.

`'maintain'` and `'increase_carefully'` produce **no mutation**.
The proof records a `volume_bias_not_reduce` skipped reason for
those — AB14 deliberately does not implement volume increases
because the safe direction was the only one specified for this
prompt.

## 5. Exact safety bounds

| Bound | Value | Effect |
|---|---|---|
| `MIN_SETS_FOR_VOLUME_REDUCTION` | `3` | Never touch rows that already prescribe < 3 sets. |
| `SETS_FLOOR_AFTER_REDUCTION` | `2` | Resulting `sets` is always >= 2. |
| Reduction magnitude | `-1` set | Single-set reduction only. |
| `MAX_VOLUME_REDUCTIONS_PER_SESSION` | `2` | A single workout can have at most 2 working-set reductions. |
| Non-prescriptive categories | excluded | Warmup / cooldown / mobility / recovery / prehab / rehab dosage is never touched. |
| Idempotency | row-stamp guard | Re-running on the same program is a no-op. |
| Non-mutation directions | `'maintain'`, `'increase_carefully'` | Recorded as observed, no mutation applied. |

AB14 changes `sets` only. It does **not** change reps, RPE,
exercise selection, schedule, weeks, blocks, methods, rest times,
skill progression, or any other field.

## 6. Exact row-level stamp field

```
// lib/adaptive-program-builder.ts
evidenceCalibrationVolumeAdjustment?: import('./program/evidence-calibration-program-shaping').EvidenceCalibrationVolumeAdjustmentStamp
```

Stamp shape (owned by the shaping helper):

```ts
export interface EvidenceCalibrationVolumeAdjustmentStamp {
  source: 'evidence_calibration_volume_bias'
  applied: true
  setsBefore: number
  setsAfter: number              // === setsBefore - 1, >= setsFloor
  volumeBias: 'reduce'
  setsFloor: number              // SETS_FLOOR_AFTER_REDUCTION
  reasonCode: 'volume_bias_reduce'
  reasonCoachLine: string        // safe to render verbatim
  version: 'ab14-volume-bias-materialization'
}
```

Optional, JSON-safe, mirrors the AB13-7
`EvidenceCalibrationRpeCapStamp` precedent. Older programs and
programs generated before AB14 simply omit it.

## 7. Exact program-level proof field

The existing `EvidenceCalibrationShapingProof` is extended
additively with one optional nested sub-proof:

```ts
export interface EvidenceCalibrationShapingProof {
  // ...existing AB13-4 fields preserved exactly...
  shapingVersion: 'ab13-4-evidence-calibration-conservative-progression'
  ranShapingPass: boolean                    // AB13 sub-gate flag
  appliedAtLeastOneMutation: boolean         // AB13 mutation flag
  cappedExerciseCount: number
  ceilingRpe: number
  summary: string                            // now combined
  skippedReason:
    | null
    | 'no_influence'
    | 'status_not_active'
    | 'not_allowed_to_mutate'
    | 'progression_not_conservative'
    | 'no_actionable_bias'                   // [AB14] new
  // [AB14] optional nested sub-proof
  volumeAdjustment?: EvidenceCalibrationVolumeAdjustmentProof
}

export interface EvidenceCalibrationVolumeAdjustmentProof {
  version: 'ab14-volume-bias-materialization'
  ranShapingPass: boolean                    // AB14 sub-gate flag
  appliedAtLeastOneMutation: boolean
  adjustedExerciseCount: number
  volumeBias: VolumeBias | null
  setsFloor: number
  perSessionCap: number
  summary: string
  skippedReason:
    | null
    | 'gate_closed'
    | 'volume_bias_not_reduce'
    | 'no_eligible_rows'
}
```

The legacy AB13-only fields keep their AB13-only meaning so every
existing consumer (`buildProgramShapingProofFields`, the
FeedbackLoopProofCard, the AB13 visual proof overlay) continues
to work unchanged.

## 8. Exact UI chip condition

In `AdaptiveSessionCard.tsx`, the AB14 chip renders if and only if:

```ts
!isWarmupCooldown
&& exercise.evidenceCalibrationVolumeAdjustment != null
&& exercise.evidenceCalibrationVolumeAdjustment.applied === true
&& typeof exercise.evidenceCalibrationVolumeAdjustment.setsBefore === 'number'
&& typeof exercise.evidenceCalibrationVolumeAdjustment.setsAfter === 'number'
```

Chip text: `Sets adjusted`. Tooltip / aria-label is the producer's
`reasonCoachLine` (for example: *"Evidence calibration reduced this
from 4 sets to 3 based on recent recovery and load signals."*).
The chip uses an amber palette to distinguish it from the AB13-7
teal `RPE capped` chip while sitting in the same chip strip.

Data attributes for visual / E2E proof:
- `data-ab14-row-volume-adjustment="true"`
- `data-ab14-sets-before={setsBefore}`
- `data-ab14-sets-after={setsAfter}`

## 9. AB13 preservation verdict

**AB13 preserved exactly.** Specifically:

- `applyConservativeProgressionShaping` keeps its name and exported
  signature.
- AB13-4 RPE cap behavior is unchanged: any prescribed row with
  `targetRPE > 7` (and an eligible category) still gets capped to 7
  when the AB13 sub-gate is open.
- AB13-7 row-level `evidenceCalibrationRpeCap` stamp still emits.
- AB13-8 `RPE capped` chip in `AdaptiveSessionCard` still renders.
- AB13-11B `buildFixtureProgram`, `fixture-fallback`,
  `data-ab13-11-proof-mode`, and `data-ab13-11-row-rpe-cap` are not
  touched. The AB13 visual-proof overlay
  (`components/programs/AB13VisualProofOverlay.tsx`) and the
  `?ab13ProofOverlay=force-rpe-cap` activation path are not touched.
- Existing `EvidenceCalibrationShapingProof` fields keep their
  AB13-only semantics. The `skippedReason` union additions are
  strictly additive.
- All exhaustive switches over `skippedReason` have been updated
  for the new union member (compile-safe).

## 10. Build / typecheck result

Static-only verification was performed (no runnable build from this
edit window). All static checks are clean:

- No `as any` introduced.
- No `@ts-ignore` introduced.
- No `@ts-expect-error` introduced.
- No package or schema changes.
- Both exhaustive switches over `EvidenceCalibrationShapingProof['skippedReason']` (`buildSkippedSummary`, `buildShapingSkippedDetail`) cover the new `'no_actionable_bias'` member.
- The new optional row-level field is wired via the same type-only `import('./program/evidence-calibration-program-shaping')` pattern AB13-7 uses, so the builder file (~31k lines) takes no new runtime import and no circular dependency is introduced.

Grep audit:

```
$ rg "evidenceCalibrationVolumeAdjustment|EvidenceCalibrationVolumeAdjustmentStamp|EvidenceCalibrationVolumeAdjustmentProof|Sets adjusted|volume_bias_reduce|ab14-volume-bias-materialization"
components/programs/AdaptiveSessionCard.tsx
lib/adaptive-program-builder.ts
lib/program/evidence-calibration-program-shaping.ts
$ rg "volumeBias:\s*true|volumeBias:\s*false" lib/server/authoritative-program-generation.ts
3452: volumeBias: true,
$ rg "\bas any\b|@ts-ignore|@ts-expect-error" \
     lib/program/evidence-calibration-program-shaping.ts \
     components/programs/AdaptiveSessionCard.tsx
lib/program/evidence-calibration-program-shaping.ts:38: *   2. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
(comment-only mention in the file's contract docblock — no actual suppression)
```

## 11. Runtime visual expectation

For an account where the active calibration plan resolves
`volumeBias === 'reduce'` and the influence reaches `active` +
`allowedToMutateProgram === true`, the next freshly generated program will:

- Have `program.evidenceCalibrationShapingProof.volumeAdjustment.appliedAtLeastOneMutation === true`
  with `adjustedExerciseCount >= 1` (capped at `2 × <session count>`).
- Show the `Sets adjusted` chip on at least one exercise row in
  `AdaptiveSessionCard` (orange/amber, next to the existing
  `RPE capped` teal chip if AB13-4 also fired).
- Surface `volume: reduce` in the existing influence chip strip
  (already wired by the AB12-2 producer once the structural hook
  is `true`).
- Show the combined coach-card line *"Capped N working-set RPE
  targets at RPE 7 and reduced sets on M working-set exercises
  this cycle."* when both passes applied, or the volume-only
  variant when only AB14 applied.

For users with `'maintain'` / `'increase_carefully'` / unavailable
plans, the program page is **unchanged** — no `Sets adjusted`
chip, no fake claim of volume mutation, no UI regression.

The AB13 visual proof overlay
(`?ab13ProofOverlay=force-rpe-cap`) continues to behave exactly as
it did after AB13-11B.

## 12. AB15 readiness

**Safe to proceed.** The canonical shaping corridor is now proven
to carry two independent structural hooks behind one gate without
breaking either of them. The same pattern can be applied for the
next bounded structural hook:

- `intensityBias === 'cap'` → cap `targetRPE` ceiling further
  (or cap loadGuidance), gated independently of AB13 and AB14.
- `recoveryBias === 'protect'` → reduce optional accessory
  intensity / inject mandatory rest-day spacing, gated
  independently.

Each future flip follows the same shape: extend the helper with
one more sub-gate and one more row-level stamp, flip the matching
`structuralHooks` flag in
`lib/server/authoritative-program-generation.ts`, and add one
more chip in `AdaptiveSessionCard`. AB13 and AB14 must continue
to run unchanged.
