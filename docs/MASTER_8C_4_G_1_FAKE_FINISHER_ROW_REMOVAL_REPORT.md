# MASTER-8C.4.G.1 — FAKE CONDITIONING FINISHER EXERCISE ROW REMOVAL REPORT

**Current Official Step:** MASTER-8C.4.G.1  
**Status:** COMPLETE  
**Date:** May 15th, 2026

---

## Summary

This repair step removed the creation of fake "Conditioning Finisher" exercise rows and added guards to filter legacy fake rows from Program Balance coverage, Program Page display, and method artifact collection.

---

## Root Cause

`applyEnduranceConditioningFinisher()` in `lib/program/requested-method-override-planner.ts` was creating a synthetic exercise object:

```typescript
const finisherExercise = {
  name: 'Conditioning Finisher',
  sets: 1,
  reps: '5-8 min',
  notes: 'Low-moderate intensity sustained work. Choose: row, bike, jump rope, or bodyweight circuit.',
  trainingMethod: 'endurance_density',
  method: 'endurance_density',
  isFinisher: true,
  category: 'conditioning',
  // ... more fields
}
targetSession.exercises.push(finisherExercise)
```

This caused:
1. Program Balance to treat `conditioning_finisher` as a missing exercise (Need Science: 1)
2. Program Page to display a fake exercise row with generic instructions
3. Method artifact collection to count it as an "applied" method

---

## Changes Made

### 1. Created Pure Guard Helper
**File:** `lib/program/conditioning-finisher-artifact-contract.ts`

- `isSyntheticConditioningFinisherPlaceholder(exercise)` — Detects legacy fake finisher rows
- `getSyntheticConditioningFinisherReason(exercise)` — Returns human-readable reason

Detection criteria:
- Name equals "Conditioning Finisher"
- OR method/trainingMethod is "endurance_density" AND isFinisher is true
- AND no real materialized finisher prescription exists (no selectedFinisherExerciseId, modality, timeCapSeconds, etc.)

### 2. Stopped Fake Row Creation at Source
**File:** `lib/program/requested-method-override-planner.ts`

`applyEnduranceConditioningFinisher()` now returns `status: 'blocked'` instead of creating a fake exercise row. Finisher intent is stored in `styleMetadata.conditioningFinisherIntent` for future implementation.

### 3. Added Legacy Filter to Program Balance
**File:** `lib/program/program-balance-ui-adapter.ts`

`extractSessionInput()` now skips rows where `isSyntheticConditioningFinisherPlaceholder()` returns true.

### 4. Added Display Filter to Program Page
**File:** `components/programs/AdaptiveSessionCard.tsx`

`safeExercises` now filters out synthetic finisher placeholders before rendering.

### 5. Added Artifact Collection Guard
**File:** `lib/program/requested-method-override-planner.ts`

`collectMethodOverrideArtifacts()` now skips synthetic finisher placeholders, so they don't count as applied methods.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/program/conditioning-finisher-artifact-contract.ts` | NEW — Pure guard functions |
| `lib/program/requested-method-override-planner.ts` | Modified — Blocked fake row creation, added artifact filter |
| `lib/program/program-balance-ui-adapter.ts` | Modified — Added legacy filter |
| `components/programs/AdaptiveSessionCard.tsx` | Modified — Added display filter |

## Files Intentionally Not Touched

- `lib/program/exercise-skill-knowledge-seed.ts` — No fake seed entry for `conditioning_finisher`
- `lib/adaptive-exercise-pool.ts` — No fake pool entry
- Database/Prisma schema
- Live workout reducer
- Generator files
- Warm-up/cooldown generation

---

## Build Verification

| Check | Result |
|-------|--------|
| TypeScript (`pnpm tsc --noEmit --pretty false`) | PASS (0 errors) |
| Build (`pnpm run build`) | PASS |
| Build Classification | N/A — Build succeeded |

---

## Expected Coverage After Fix

| Metric | Before | After |
|--------|--------|-------|
| Exercises | 21 | 20 |
| Full Science | 20 | 20 |
| Need Science | 1 | 0 |
| Unresolved IDs | `conditioning_finisher` | None |

---

## UI Verification Instructions

### Program Balance Check

1. Go to Program Page
2. Open Coach Intelligence
3. Tap Program Balance
4. Verify:
   - Exercises: 20 (not 21)
   - Full Science: 20
   - Need Science: 0
   - "Unresolved: conditioning_finisher" is GONE
   - "Need science: conditioning_finisher" is GONE
   - No "1 exercise(s) not found in any app source"
   - Read-only / No mutation status preserved

### Program Card Check

1. Go to Program Page
2. Find the day that previously showed "Conditioning Finisher"
3. Expand the workout card
4. Verify:
   - The fake "Conditioning Finisher" exercise row is GONE
   - Real exercises still render
   - Grouped structure (supersets, density blocks) still renders
   - Exercise count matches visible rows

### Method Planner Check

1. Open Method Planner / Method Decisions
2. Verify:
   - Real applied methods still count correctly
   - Circuits/supersets/density blocks still show as applied
   - Conditioning Finisher does NOT appear as applied

---

## What PASS Looks Like

- Program Balance shows 20 exercises, 20 full science, 0 need science
- No `conditioning_finisher` anywhere in unresolved/missing
- Program Page does not show fake "Conditioning Finisher" row
- Real exercises and grouped methods still work
- Live Workout does not show fake finisher exercise

## What FAIL Looks Like

- `conditioning_finisher` still appears as unresolved
- Need Science still shows 1
- Program Page still shows "Conditioning Finisher" with generic instructions
- Method Planner still counts it as applied

---

## Future Doctrine Preserved

Conditioning finisher remains a future method system. The real finisher decision engine must:
1. Select a real modality/exercise (jump rope, bike, row, bodyweight circuit)
2. Provide a real time cap and execution instructions
3. Store a real exercise identity (not `conditioning_finisher`)

Until that engine exists, the finisher is blocked/deferred, not faked.

---

## Next Official Step

If this passes visual verification:  
**MASTER-8C.5 — Generator / Restart Program DB Consumption Gate**
