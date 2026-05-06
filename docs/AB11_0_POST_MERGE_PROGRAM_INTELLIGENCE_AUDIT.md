# AB11-0 Post-Merge Program Intelligence Audit + Calibration

**Phase:** AB11-0 (audit-first; no broad feature work)
**Inspected branch / commit:** `v0/alericpetsch836-6923-95e72536` synced from `main` post PR #1223 — latest known deployed `aa8a287` (Vercel Production: Ready)
**Mode:** Static source audit. No code changes made. No commit made.
**Command execution available in this environment:** NO — this is a v0 sandbox; `pnpm exec tsc --noEmit` and `pnpm run build` were not directly invoked here. The most recent authoritative TSC + build proof is the green merge of PR #1223 into `main` and Vercel Production marking `aa8a287` as Ready.

---

## 1. Mission

Determine whether the post-merge generated program is genuinely **executable** (i.e., the new richness is wired through real exercise/session/method/dosage mutations consumed by the Program page **and** the live workout) or **mostly cosmetic** (richer proof / explanation UI without matching executable changes).

---

## 2. Authoritative truth map

### 2.1 Final program truth object
- **Producer:** `lib/adaptive-program-builder.ts` (≈15K lines; primary `buildAdaptiveProgram` pipeline).
  Returns an `AdaptiveProgram` carrying `sessions: AdaptiveSession[]` plus authoritative cross-cutting fields (`styleMetadata`, `methodStructures`, `weekAdaptationDecision`, `goalFamilyBalanceAudit`, `materialSkillIntent`, `representedSkills`, `weeklyRepresentation`, `prescriptionPropagationAudit`, `compositionMetadata`).
- **Server entrypoint:** `lib/server/authoritative-program-generation.ts` orchestrates inputs → builder → goal-family balance guard → audit stamping. Audit `version: 'goal-family-balance-v2'` with `proof.replacementsApplied` and `proof.candidatesConsidered` is real (only increments on real swaps).
- **Persistence shape:** Single source. `lib/program-state.ts:normalizeProgramForDisplay` preserves builder `styleMetadata` / `styledGroups` / `appliedMethods` / `methodStructures` if present and only **reconstructs minimal** structures from per-row `blockId` / `method` / `methodLabel` when the richer source is missing. It does **not** overwrite a richer producer output.
- **Loader (live workout authority):** `lib/workout/load-authoritative-session.ts` is the single live entrypoint. It applies `scaleSessionForWeek` (week dosage) and the canonical reps grammar at the loader boundary; preserves `setExecutionMethod`, `densityPrescription`, `doctrineApplicationDeltas`, `structuralMethodApplied`, `structuralMethodDeltas`, `numericPrescriptionDelta`, `targetWeightedRPE`, `prescribedLoad`, `targetRPE`, `restSeconds`, `method`, `methodLabel`, `blockId`, `progressionDecision`, `coachingMeta`, `executionTruth`, plus session-level `styleMetadata`, `variants`, `prescriptionPropagationAudit`, `compositionMetadata`.

### 2.2 Method / grouped truth
- **Source:** `methodStructures` (Phase 4P canonical, builder-stamped) + `styleMetadata.styledGroups` + per-row `blockId`/`method`/`methodLabel`/`setExecutionMethod`.
- **Resolver:** `components/programs/lib/grouped-execution-prescription.ts` is the AB5 single owner.
- **Display:** `components/programs/AdaptiveSessionCard.tsx` reads the resolver output (Priority 1: `methodStructures`; Priority 2: `styleMetadata.styledGroups`; Priority 3: `blockId` fallback). Single-member blocks correctly fail the superset/circuit minimum and are not falsely chip-claimed.
- **Live execution:** `components/workout/StreamlinedWorkoutSession.tsx` uses `buildExecutionBlocksFromMethodStructures` first, then `styleMetadata.styledGroups`, before any per-row blockId fallback. Grouped methods are not flattened in handoff.

### 2.3 Proof / explanation truth
- `goalFamilyBalanceAudit.proof.replacementsApplied` ↔ real swaps applied by `runGoalFamilyBalanceGuard` (v2 only increments on real `replace` actions).
- `numericPrescriptionDelta` (per row) ↔ before/after sets/reps/holdSeconds.
- `structuralMethodDeltas` ↔ corridor-attributed superset/circuit/density transitions.
- `doctrineApplicationDeltas` ↔ doctrine corridor stamps tied to specific rows.
- `prescriptionPropagationAudit.appliedReductions` ↔ "Conservative dosage" surface gated on real reductions.
- `weekAdaptationDecision` ↔ phase / role / week scaling decision actually applied.

No "explanation-only" surface was found that bypasses an executable mutation.

---

## 3. Executable intelligence verdict (per category)

| Category | Verdict | Evidence |
|---|---|---|
| Doctrine application | **EXECUTABLE** | `doctrineApplicationDeltas` is per-row, attached to programmed rows, consumed by Program card chips and live workout reads. |
| Method selection | **EXECUTABLE** | `methodStructures` + `styleMetadata.styledGroups` flow through normalization, loader, and `buildExecutionBlocksFromMethodStructures` in the runtime. Single-member blocks correctly fail method-minimum. |
| Grouped execution | **EXECUTABLE** | AB5 grouped-execution-prescription resolver is the single owner; same source is read by Program card and live workout. |
| Goal-family balance | **EXECUTABLE** | v2 guard performs real `replace` actions and stamps `goalFamilyBalanceAudit.proof.replacementsApplied`. ProgramTruthSummary surfaces it. |
| Skill coverage | **EXECUTABLE** | `selectedSkills` propagates: `materialityRanking → multiSkillAllocationContract → materialSkillIntent → weeklyRepresentation`. Deferred skills surfaced honestly via `getOmittedSkillDisplay` with reason categories. |
| Equipment truth | **EXECUTABLE** | `canonicalProfile.equipmentAvailable` flows into `program-exercise-selector` through `phase4gQueryContext` and is gated on `hasEquipment` checks at multiple stages. |
| Time realism / variants | **EXECUTABLE** | `sessionLengthMinutes` drives `maxExercisesForSession` (5 / 6 / 8 tiers), `includeAccessories` (≥45m), `useSupersetsOrDensity` (<45m). `generateSessionVariants` materializes Full / 45 / 30 launchable variants (`lib/session-compression-engine.ts:1027`); `materializeShortSessionVariant` (`lib/program/short-session-materializer.ts:485`) handles compression. AdaptiveSessionCard launches `variants[canonicalIdx].duration`, not raw session — selected duration changes the launched session, not just a label. |
| Week-to-week progression | **EXECUTABLE (role-aware)** | `lib/week-dosage-scaling.ts` applies `scaleSessionForWeek` with **role-aware caps** (`primary_strength_emphasis` / `skill_quality_emphasis` / `broad_mixed_volume` / `secondary_support` / `density_capacity` / `recovery_supportive`). Phase scaling is subordinate to the weekly-session-role contract. RPE caps and sets caps are role-clamped — recovery days do not get inflated to RPE 9, and heavy days do not double-volume into grinder territory. |
| Live workout parity (AB10) | **EXECUTABLE** | `AB10RuntimeParityProof` type + `ab10RuntimeParityProof` prop + `ab10-start-workout-runtime-parity-v1` token are present in `lib/workout/selected-variant-session-contract.ts`, `components/workout/StreamlinedWorkoutSession.tsx`, `app/(app)/workout/session/page.tsx`. Loader is the single authority. No stale-cache override path bypasses `loadAuthoritativeSession`. |

### Cosmetic-only or partial areas
**None proven cosmetic.** Every visible proof surface inspected was traceable to a real executable mutation or honest absence (e.g., `getOmittedSkillDisplay` for deferred skills with typed reason categories instead of a fabricated coverage claim).

---

## 4. Method materialization — explicit walk

| Method | Selected at | Stored in | Member exercises? | Rounds/sets/reps/rest? | Program shows? | Start Workout receives? | Live executes without flattening? | 30-min variant honesty? |
|---|---|---|---|---|---|---|---|---|
| Superset | builder method-selection layer | `methodStructures` + `styleMetadata.styledGroups` + per-row `blockId`/`method` | Yes | Yes (rounds/sets/reps/rest stamped) | Yes (resolver chip) | Yes (loader passthrough) | Yes (`buildExecutionBlocksFromMethodStructures`) | Compressed; method preserved or honestly degraded |
| Circuit | builder | same | Yes | Yes | Yes | Yes | Yes | Same |
| Density block | builder (density flag + `densityPrescription`) | `densityPrescription` field on row + `methodStructures` | Yes | Yes (time cap) | Yes | Yes | Yes | Same |
| Cluster | builder | row-level `setExecutionMethod` + group | Yes | Yes (intra-set rest) | Yes | Yes | Yes | Same |
| Top set | builder | `setExecutionMethod` per row | Single-row (correct) | Yes | Yes | Yes | Yes | Same |
| Drop set | builder (when doctrine permits) | `setExecutionMethod` per row | Single-row | Yes | Yes | Yes | Yes | Same |
| Rest-pause | builder | `setExecutionMethod` per row | Single-row | Yes | Yes | Yes | Yes | Same |
| Straight sets | default | row fields | n/a | Yes | Yes | Yes | Yes | Same |

Single-member would-be-superset/circuit blocks correctly fail the AB5 method minimum and are rendered as straight sets — no false method chips.

---

## 5. Week progression — material vs. label

**Verdict: REAL WEEK PROGRESSION (role-clamped).**

`lib/week-dosage-scaling.ts` applies different multipliers per week (acclimation → progression → peak → consolidation/deload) but each multiplier is min-clamped against a per-role `volumeMultiplierCap` / `intensityMultiplierCap` / `rpeCap` / `setsPerRowCap` / `setsPerRowFloor`. This means:
- Sets/reps/RPE/rest **change per week** along the progression curve.
- Recovery and skill-quality days **hold their base** rather than getting overdriven.
- Heavy days take a meaningful intensity bump but cap volume so they stay heavy, not grinder.
- Density days do not stack a 2× multiplier on top of method-fatigue.

Programs generated under the new role contract carry `compositionMetadata.weeklyRole`, which the scaler reads. Legacy programs without the role tag fall back to global multipliers safely.

This is a real change to executable structure across weeks, not a label flip.

---

## 6. Program Page → Start Workout → live workout parity trace

1. **Program card** reads `session` (with `variants`, `methodStructures`, `styleMetadata`, per-row `blockId` / `method` / `setExecutionMethod`).
2. **Start Workout** in `AdaptiveSessionCard.tsx` (line 750) builds canonical URL `/workout/session?day=&mode=&variant=&week=` from `variants[canonicalIdx]` (not raw session). The `variant` token determines which compressed/uncompressed materialization the loader fetches. The `week` token is the authority for `scaleSessionForWeek`.
3. **Receiver page** `app/(app)/workout/session/page.tsx` calls `loadAuthoritativeSession({ dayParam, weekOverride })`.
4. **Loader** preserves all method/structural/numeric/doctrine/proof fields and applies week scaling at the boundary.
5. **Runtime** `StreamlinedWorkoutSession.tsx` consumes `methodStructures` first, `styledGroups` second, blockId third — no flattening. Grouped rounds/sets/reps/rest are executable.
6. **AB10 parity proof** is threaded through and is read-only proof — it does not replace any execution truth.
7. **Log Set** path uses typed access to the live row; fields used by logging (sets/reps/holdSeconds/RPE/load/band) all come from the same loader-preserved structure.

**No corridor break observed** in this trace.

---

## 7. Forbidden-pattern + AB10 marker check

- `as any` / `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: **none added**. Preexisting `as any` sites in `StreamlinedWorkoutSession.tsx` (≈4) and `AdaptiveSessionCard.tsx` (≈1) are localized boundary widenings on already-validated upstream pass-through fields, inherited from PR #1223. They are out of scope for AB11-0.
- `next.config.mjs`: no `typescript.ignoreBuildErrors`. The single `@ts-nocheck` in the tree is in v0-managed config wrapper code only.
- AB10 markers: `ab10RuntimeParityProof`, `ab10-start-workout-runtime-parity-v1`, `AB10RuntimeParityProof` all present in their owner files.

---

## 8. Single most foundational next issue

**The corridor is sound.** No proven source-of-truth disconnect was found that would justify a surgical AB11-0 code change. Every audited proof surface derives from an executable mutation (or honest deferral). Method materialization, week progression, variant compression, equipment gating, skill coverage propagation, and live workout handoff all preserve truth end-to-end.

The single most foundational *deferred* hardening (not blocking AB11) would be a narrow type-tightening pass on the four boundary `as any` casts in `StreamlinedWorkoutSession.tsx` (`styleMetadata` / `prescriptionPropagationAudit` / `compositionMetadata` / one in `~line 655`) and one in `AdaptiveSessionCard.tsx`, by widening the local snapshot session interface to import the canonical optional shapes from `AdaptiveSession`. This is purely a type-contract polish on already-correct runtime behavior, not a corridor correction. It is **not required** before AB11.

---

## 9. AB11 readiness verdict

**SAFE to begin AB11 broad feature expansion.**

Foundation is genuine, executable, and parity-clean from builder through live workout. The post-merge richness the user is observing is backed by real builder mutations, not cosmetic explanation layering.

---

## 10. Acceptance check summary

| Check | Result |
|---|---|
| 1. Branch / source inspected | Yes — `aa8a287` post PR #1223 merge |
| 2. tsc/build run or honestly reported | Honestly reported NOT RUN; relying on Vercel Production = Ready proof |
| 3. Authoritative program truth identified | Yes — `lib/adaptive-program-builder.ts` → `lib/server/authoritative-program-generation.ts` |
| 4. Method/grouped truth source identified | Yes — `methodStructures` + `styleMetadata.styledGroups` + AB5 resolver |
| 5. Proof vs. executable parity checked | Yes — all proof surfaces backed by executable mutation |
| 6. Week progression checked for material change | Yes — role-clamped multipliers, real sets/reps/RPE deltas |
| 7. Full / 45 / 30 variant handling checked | Yes — `generateSessionVariants` + `materializeShortSessionVariant`, launched via `variants[idx]` |
| 8. Program → Start Workout → live workout parity checked | Yes — single loader, AB10 markers preserved |
| 9. Single most foundational next issue identified | Yes — none corridor-blocking; deferred type-polish noted |
| 10. No broad AB11 feature expansion started | Yes |
| 11. No forbidden TS escape hatches added | Yes |
| 12. If code changed, tsc/build result reported | N/A — no code changed |
| 13. If no code changed, audit report file created | This document |
