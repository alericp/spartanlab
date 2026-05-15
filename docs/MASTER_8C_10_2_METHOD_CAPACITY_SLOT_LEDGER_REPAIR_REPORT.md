# MASTER-8C.10.2 — Method Capacity / Slot Ledger Repair Report

## Current Official Step
MASTER-8C.10.2

## Status
COMPLETE

## Files Changed
1. **NEW: `lib/program/method-slot-occupancy-ledger.ts`** (654 lines)
   - Creates authoritative read-only method slot occupancy ledger
   - Tracks per-exercise ownership state across all sessions
   - Provides capacity counts and detailed block reasons
   - Exports: `buildMethodSlotOccupancyLedger`, `buildSessionMethodSlotLedger`, `getExerciseMethodOccupancy`, `countSessionsWithAvailableRowMethodSlots`, `buildCapacitySummary`, `buildMethodBlockedReason`

2. **`lib/program/method-slot-eligibility-frequency-planner.ts`**
   - Added import for occupancy ledger
   - Added capacity fields to `MethodFrequencyPreview` interface
   - Updated `buildMethodFrequencyPreview` to use ledger for capacity tracking
   - Updated `buildMethodSlotEligibilityFrequencyPlan` to build ledger
   - Blocked reasons now use detailed ledger information

3. **`components/programs/ProgramCoachIntelligenceHub.tsx`**
   - Updated blocked reason display to show capacity summary
   - Updated eligible method display to show capacity information

## Files Intentionally Not Touched
- Live workout runtime files
- Generator / builder files (`lib/adaptive-program-builder.ts`, `lib/program-exercise-selector.ts`)
- Program Balance analyzer files
- Database schema / Prisma
- Billing / auth / Stripe / Clerk
- Package files
- Onboarding files
- Exercise database seed

## TypeScript Command Run
`pnpm tsc --noEmit --pretty false`

## TypeScript Result
PASS (0 errors)

## Build Command Run
`pnpm run build`

## Build Result
PASS

## What Changed
The core repair introduces an explicit **method slot occupancy ledger** that tracks ownership state for every exercise slot across all program sessions. Previously, the planner could collapse to "0 eligible" without explaining WHY - now it provides precise counts:
- Total training rows
- Available rows for row methods
- Rows occupied by row methods
- Rows occupied by grouped methods (circuits, supersets, density)

The blocked reason for methods now shows specific information like:
- `No free rows: 3 occupied by row methods, 2 in grouped structures`
- `Timed-window logging model required` (for density)
- `Superset structural writer not implemented`

## What Was Preserved
- MASTER-8C.10.1 collision guard (Top Set cannot overlap circuit-owned rows)
- All existing Method Planner functionality
- Density/superset/endurance blocked states
- Live workout stability (no runtime changes)
- Program Balance analyzer logic
- Generator logic

## Root Cause Found
The previous implementation in `scoreSessionForRowLevelMethod` would skip exercises using `isExerciseAlreadyMethodOwned()` but never tracked WHY or HOW MANY were skipped. When all exercises were skipped (due to being occupied), the UI only showed "No safe slots found" without proving what was occupied.

## Exact UI Verification Location
- **App route/page:** Program Page
- **Exact screen/phase:** Open Coach Intelligence Hub → Method Override Planner → Slot Eligibility & Frequency Preview
- **Exact card/section:** Slot Eligibility & Frequency Preview rows

## Expected PASS Visual
- Blocked methods show specific reasons: `No free rows: all occupied by saved methods` or method-specific reasons
- Eligible methods show capacity: `3 free days · 5 free rows`
- After applying one Drop Set, only that row becomes unavailable; other unowned rows remain eligible
- Circuit-owned rows are never targeted by row-level methods

## Expected FAIL Visual
- Generic "No safe slots found" without capacity proof
- Top Set/Drop Set can still target circuit-owned exercises
- Total capacity collapse after one apply

## Remaining Blockers
- Multi-placement audit/revert parity (MASTER-8C.11)
- Live workout render verification for row-level methods

## Next Official Step Only If This Passes
MASTER-8C.11 — Controlled multi-placement audit/revert parity and live workout render verification
