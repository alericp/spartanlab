# MASTER-8C.10.3 — Method Ledger Semantics / False Ownership / Invalid Overlap Repair Report

## Current Official Step
MASTER-8C.10.3

## Status
COMPLETE

## Files Changed
- `lib/program/method-slot-occupancy-ledger.ts` — Fixed strict row-level method ownership detection

## Files Intentionally Not Touched
- Live workout runtime files
- AdaptiveSessionCard live execution logic
- Generator / builder files  
- Program Balance analyzer files
- Database schema / Prisma
- Billing / auth / Stripe / Clerk
- Package files
- Onboarding
- Exercise seed database

## TypeScript Command Run
`pnpm tsc --noEmit --pretty false`

## TypeScript Result
PASS (0 errors)

## Build Command Run
`pnpm run build`

## Build Result
PASS

## What Changed

### Root Cause Identified
The ledger was treating generic training labels as row-method ownership. Line 261 originally had:
```ts
const isRowMethodOwned = !!(setExecutionMethod || methodOverrideApplied || methodOverrideMethodKey || trainingMethod || appliedMethod)
```

This wrongly classified exercises with `trainingMethod: "max_strength"` or `appliedMethod` as method-owned.

### Fix Applied
Created a STRICT row-level method ownership predicate that only returns true when there is actual method override evidence:

1. **Defined supported row execution methods:**
   - `top_set`, `drop_set`, `rest_pause`, `cluster`, `backoff_set`, `myo_reps` (and variations)

2. **A row is ONLY method-owned if:**
   - `methodOverrideApplied === true`, OR
   - `setExecutionMethod` is one of the supported row execution methods, OR
   - `methodOverrideMethodKey` is one of the supported row method keys

3. **A row is NOT method-owned merely because:**
   - `trainingMethod` exists (e.g., "max_strength", "skill_practice")
   - `methodFamily` exists (e.g., "push", "pull")
   - `appliedMethod` exists without override evidence
   - The exercise has intensity/skill/power labels

4. **Invalid overlap detection added:**
   - If a row is grouped-owned AND also has row-level override fields
   - Classified as `hasInvalidOverlap = true`
   - Grouped method wins for runtime/display safety
   - Reported in capacity summary

## Expected UI Changes

### Before Fix
- "0 free rows: 4 occupied by row methods, 20 in grouped structures"
- Row methods showed blocked despite straight-set rows existing
- REST-PAUSE displayed as valid inside circuit-owned exercise rows

### After Fix
- Accurate free row counts based on STRICT ownership evidence
- Only actual row-level method overrides count as occupied
- Only exact grouped member rows count as grouped-owned
- Invalid overlaps are detected and reported
- REST-PAUSE inside circuit rows is identified as invalid overlap

## Verification Location

### UI Path
1. Program Page → Day cards
2. Coach Intelligence Hub → Method Override Planner → Slot Eligibility & Frequency Preview

### Expected PASS Visual
- Planner shows realistic capacity based on strict ownership
- Row-level methods show available options when straight-set rows exist
- Circuit-owned rows are protected from row-level targeting
- Invalid overlap diagnostic appears if old bad data exists

### Expected FAIL Visual
- UI unchanged, still shows false occupancy
- REST-PAUSE still appears valid inside circuits
- All rows still blocked by generic labels

## Remaining Blockers
None for MASTER-8C.10.3 scope.

## Next Official Step
MASTER-8C.11 — Controlled multi-placement audit/revert parity and live workout render verification
