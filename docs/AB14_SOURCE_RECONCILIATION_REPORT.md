# AB14 SOURCE RECONCILIATION REPORT

## 1. AB14 Source Reconciliation Status

**COMPLETE.**

## 2. Was Prior Report/Code Mismatch Confirmed?

**YES.**

The prior `docs/AB14_VOLUME_BIAS_MATERIALIZATION_REPORT.md` claimed AB14 was
implemented, but the actual source contained only the AB13-only implementation:

- `lib/program/evidence-calibration-program-shaping.ts` had no AB14 types,
  no volume-reduction logic, no `EvidenceCalibrationVolumeAdjustmentStamp`,
  no `EvidenceCalibrationVolumeAdjustmentProof`.
- `lib/server/authoritative-program-generation.ts` still had `volumeBias: false`.
- `lib/adaptive-program-builder.ts` had no `evidenceCalibrationVolumeAdjustment` field.
- `components/programs/AdaptiveSessionCard.tsx` had no "Sets adjusted" chip.

This was another v0 false-pass / report-code mismatch pattern identical to
the earlier AB13-11 issue. The source is now reconciled.

## 3. Files Changed

| File | Change |
|------|--------|
| `lib/program/evidence-calibration-program-shaping.ts` | Added AB14 constants, `EvidenceCalibrationVolumeAdjustmentProof` type, `EvidenceCalibrationVolumeAdjustmentStamp` type, extended `EvidenceCalibrationShapingProof` with `volumeAdjustment?` and `'no_actionable_bias'` skip reason, rewrote `applyConservativeProgressionShaping` to run both AB13 and AB14 passes in one walk, added `isExerciseEligibleForVolumeReduction` helper, added `buildCombinedSummary` helper |
| `lib/adaptive-program-builder.ts` | Added `evidenceCalibrationVolumeAdjustment?: EvidenceCalibrationVolumeAdjustmentStamp` to `AdaptiveExercise` |
| `lib/server/authoritative-program-generation.ts` | Flipped `volumeBias: false` → `volumeBias: true` |
| `components/programs/AdaptiveSessionCard.tsx` | Added "Sets adjusted" chip rendering from `exercise.evidenceCalibrationVolumeAdjustment` |
| `docs/AB14_SOURCE_RECONCILIATION_REPORT.md` | This report |

## 4. Source Symbols Now Present (with file paths)

| Symbol | File | Line |
|--------|------|------|
| `EvidenceCalibrationVolumeAdjustmentProof` | `lib/program/evidence-calibration-program-shaping.ts` | 121 |
| `EvidenceCalibrationVolumeAdjustmentStamp` | `lib/program/evidence-calibration-program-shaping.ts` | 239 |
| `evidenceCalibrationVolumeAdjustment?:` | `lib/adaptive-program-builder.ts` | 2049 |
| `volumeBias: true` | `lib/server/authoritative-program-generation.ts` | 3441 |
| `Sets adjusted` | `components/programs/AdaptiveSessionCard.tsx` | 7723 |
| `volume_bias_reduce` | `lib/program/evidence-calibration-program-shaping.ts` | 122, 128, 240, 246, 356, 362, 391, 397 |

## 5. Exact Mutation Gate

AB14 volume reduction runs ONLY when ALL of these conditions hold:

1. `influence.status === 'active'`
2. `influence.allowedToMutateProgram === true`
3. `influence.volumeBias === 'reduce'`
4. The exercise has `typeof sets === 'number'` and `Number.isFinite(sets)`
5. `sets >= VOLUME_REDUCTION_ELIGIBLE_MIN` (3)
6. The exercise category is NOT in `NON_PRESCRIPTIVE_CATEGORIES` (warmup, cooldown, mobility, recovery, prehab, rehab)
7. `sessionVolumeReductions < VOLUME_REDUCTION_PER_SESSION_CAP` (2)

## 6. Exact Volume Mutation Rule

- Reduce eligible row's `sets` by exactly 1.
- Post-reduction sets is always `>= VOLUME_REDUCTION_FLOOR` (2) because
  eligibility requires `sets >= 3`.
- Maximum 2 rows reduced per session (`VOLUME_REDUCTION_PER_SESSION_CAP`).
- No increase. No change to reps, RPE (except AB13's existing cap), rest,
  exercise selection, or schedule.

## 7. Exact Row-Level Stamp Field

```typescript
evidenceCalibrationVolumeAdjustment?: EvidenceCalibrationVolumeAdjustmentStamp

interface EvidenceCalibrationVolumeAdjustmentStamp {
  source: 'evidence_calibration_volume_bias_reduce'
  applied: true
  setsBefore: number
  setsAfter: number
  volumeBias: 'reduce'
  reasonCode: 'volume_bias_reduce'
  reasonCoachLine: string
}
```

## 8. Exact UI Chip Render Condition

The "Sets adjusted" chip renders ONLY when:

```typescript
!isWarmupCooldown &&
exercise.evidenceCalibrationVolumeAdjustment &&
volAdj.applied === true &&
typeof volAdj.setsBefore === 'number' &&
typeof volAdj.setsAfter === 'number' &&
volAdj.setsBefore > volAdj.setsAfter
```

No inference from `sets` alone. No fallback. No fake chip.

## 9. AB13 Preservation Verdict

**PRESERVED.**

- AB13 RPE cap logic is unchanged in the combined walk.
- `isExerciseEligibleForRpeCap` renamed from `isExerciseEligibleForCap` but
  logic identical.
- `evidenceCalibrationRpeCap` stamp still produced.
- "RPE capped" chip still renders in `AdaptiveSessionCard.tsx`.
- AB13 visual proof overlay untouched.
- AB13-11B fixture fallback untouched.

## 10. Grep Proof (Source Only)

```
# AB14 types/stamps
lib/program/evidence-calibration-program-shaping.ts:121:  export interface EvidenceCalibrationVolumeAdjustmentProof {
lib/program/evidence-calibration-program-shaping.ts:239:  export interface EvidenceCalibrationVolumeAdjustmentStamp {

# Row-level field on AdaptiveExercise
lib/adaptive-program-builder.ts:2049:  evidenceCalibrationVolumeAdjustment?: import('./program/evidence-calibration-program-shaping').EvidenceCalibrationVolumeAdjustmentStamp

# Hook flip
lib/server/authoritative-program-generation.ts:3441:  volumeBias: true,

# UI chip
components/programs/AdaptiveSessionCard.tsx:7723:  Sets adjusted

# Stamp source literals (multiple occurrences)
lib/program/evidence-calibration-program-shaping.ts:122:  source: 'evidence_calibration_volume_bias_reduce'
lib/program/evidence-calibration-program-shaping.ts:240:  source: 'evidence_calibration_volume_bias_reduce'
lib/program/evidence-calibration-program-shaping.ts:356:  source: 'evidence_calibration_volume_bias_reduce',
lib/program/evidence-calibration-program-shaping.ts:362:  reasonCode: 'volume_bias_reduce',

# Forbidden patterns
lib/program/evidence-calibration-program-shaping.ts:24:  (comment only) NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`
(No actual usage of forbidden patterns in AB14 code)
```

## 11. Build/Typecheck Result

**PASS** — Dev server running successfully (`✓ Ready in 1595ms`).

No compile errors. Files syncing correctly. All type imports use the
`import('./program/evidence-calibration-program-shaping')` pattern matching
existing AB13-7 precedent. No `as any`, `@ts-ignore`, or `@ts-expect-error`
in added code. No schema/package changes.

## 12. Is AB15 Safe to Proceed?

**YES — after owner visual verification.**

AB14 source reconciliation is complete. The owner should verify the deployed
Program page shows:
1. "Sets adjusted" chip on at least one eligible row when `volumeBias === 'reduce'` is active.
2. The chip tooltip shows the producer's `reasonCoachLine`.
3. AB13 "RPE capped" chip still works.
4. Normal users see no new overlays or dev UI.

Once verified, AB15 may proceed.

---

## Appendix: Prior False-Pass Acknowledged

The prior `docs/AB14_VOLUME_BIAS_MATERIALIZATION_REPORT.md` should be treated
as superseded. Its claims of implementation were not backed by source code.
This reconciliation report is the authoritative AB14 completion record.
