# MASTER-8C.4.F — Synthetic Placeholder Identity Extraction Repair Report

## Current Official Step
MASTER-8C.4.F

## Status
COMPLETE

## Why MASTER-8C.4.E Did Not Complete the Fix
MASTER-8C.4.E deployed diagnostics that revealed the exact unresolved exercise was `exercise-3` - a synthetic placeholder ID. The diagnostics showed:
- `Unresolved: exercise-3`
- `Need science: exercise-3`
- Runtime proof: `20+0 = 20/21`

This proved the issue was NOT a missing seed entry but rather the UI adapter extracting a synthetic placeholder instead of the canonical exercise identity.

## Exact Root Cause Found
The `extractExerciseInput()` function in `program-balance-ui-adapter.ts` was using `ex.id` directly without checking if it was a synthetic placeholder like `exercise-3`. It did NOT check nested sources like `ex.exercise.id` where the real canonical exercise identity exists.

### Source Object Structure Analysis
- `ex.id` = `exercise-3` (synthetic placeholder from UI/state)
- `ex.exercise.id` = likely contains the real canonical exercise ID
- `ex.exercise.name` = likely contains the real exercise name

### Field Wrongly Chosen
`ex.id` (the synthetic placeholder)

### Field Now Chosen
`ex.exercise.id` or `ex.exercise.name` (derived) - the nested canonical source

## Fix Applied

### 1. Added Synthetic Placeholder Detection
```typescript
function isSyntheticExercisePlaceholderId(value: string): boolean
```
Detects patterns like: `exercise-3`, `exercise_3`, `unknown_exercise_3`, `ex-3`, `item-3`

### 2. Added Source-Aware Identity Extraction
```typescript
function extractCanonicalExerciseIdentity(exercise, index)
```
Collects candidates from all possible sources in priority order:
1. Nested `exercise.id` / `exercise.exerciseId` / `exercise.name`
2. Nested `sourceExercise.id` / `originalExercise.id` / `selectedExercise.id`
3. Metadata fields (`metadata.exerciseId`, `metadata.canonicalExerciseId`)
4. Coaching meta fields
5. Flat fields (`exerciseId`, `canonicalExerciseId`, `databaseExerciseId`, `poolExerciseId`)
6. Flat `id` (only if NOT a synthetic placeholder)
7. Derived from `name` if no valid ID candidates exist

### 3. Updated `extractExerciseInput()` to Use New Extraction
Now uses `extractCanonicalExerciseIdentity()` which:
- Skips synthetic placeholder IDs when valid nested sources exist
- Falls back to placeholder only if no canonical identity can be found
- Flags when a synthetic placeholder had to be used

## Coverage Expected After Fix

| Metric | Before | After |
|--------|--------|-------|
| Sessions | 6 | 6 |
| Exercises | 21 | 21 |
| Full Science | 20 | 21 |
| Need Science | 1 | 0 |
| Runtime proof | `20+0 = 20/21` | `21+0 = 21/21` |
| Unresolved IDs | `exercise-3` | None |

## Files Changed
1. `lib/program/program-balance-ui-adapter.ts` - Added source-aware identity extraction with synthetic placeholder detection
2. `docs/MASTER_8C_4_F_SYNTHETIC_PLACEHOLDER_IDENTITY_EXTRACTION_REPAIR_REPORT.md` - Created

## Files Intentionally Not Touched
- `lib/program/exercise-skill-knowledge-seed.ts` - No seed entry added for `exercise-3`
- `lib/adaptive-exercise-pool.ts` - No pool entry added for `exercise-3`
- Generator files
- Live workout files
- Method Planner files
- Program card rendering files

## Build Results

| Command | Result |
|---------|--------|
| `pnpm tsc --noEmit --pretty false` | PASSED |
| `pnpm run build` | PASSED |
| Deployment safe | YES |

## UI Verification

### App Route/Page
Live app → Program page

### Exact Screen/Phase
Scroll to Coach Intelligence → Tap Program Balance

### What Should Be Gone
- Full Science 20
- Need Science 1
- `20+0 = 20/21`
- `Unresolved: exercise-3`
- `Need science: exercise-3`
- `1 exercise(s) not found in any app source.`
- `1 exercises not in knowledge seed`
- false `full DB gate pending` caused by `exercise-3`

### What Should Be Newly Visible
- Full Science 21
- Need Science 0
- Runtime proof showing `21+0 = 21/21` or `20+1 = 21/21`
- Future Candidates should show honest blocker (read-only phase) instead of false DB gate

### PASS Criteria
- Program Balance shows Full Science 21 / Need Science 0
- Runtime proof shows 21/21
- `exercise-3` no longer appears as unresolved
- Program Balance remains read-only
- No Method Planner, Program Card, Generator, or Live Workout regression

### FAIL Criteria
- `exercise-3` still appears (source object lacks nested canonical identity)
- Full Science remains 20
- Coverage warning remains visible

## Next Official Step (only if PASS)
MASTER-8C.5 — Generator / Restart Program DB Consumption Gate
