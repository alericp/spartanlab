# MASTER-8C.10.1 — Method Collision Guard + Smarter Frequency Placement Ranking

## Status: COMPLETE

## Current Official Step
MASTER-8C.10.1

## Files Changed
- `lib/program/method-slot-eligibility-frequency-planner.ts` — Enhanced ownership detection with session-level grouped method structures
- `lib/program/method-frequency-slot-placement-preview.ts` — Smarter ranking to avoid adjacent same-exercise targets
- `lib/program/method-frequency-placement-apply-contract.ts` — Defense against stale previews with re-check at apply time

## Files Intentionally Not Touched
- `lib/adaptive-program-builder.ts`
- `lib/program-exercise-selector.ts`
- `lib/program/program-balance-readonly-analyzer.ts`
- `lib/program/generator-knowledge-consumption-proof.ts`
- Live workout runtime files
- Workout logging files
- Schema/migrations
- package.json / pnpm-lock.yaml
- Auth/billing
- Marketing pages

## Root Cause Found
The original `isExerciseAlreadyMethodOwned()` function only checked exercise-level fields:
- `styledGroupId`
- `appliedMethod`
- `methodFamily`

It did NOT check session-level grouped structures:
- `session.styledGroups`
- `session.methodStructures`
- `session.styleMetadata.styledGroups`

This allowed row-level methods (Top Set, Drop Set, etc.) to be proposed on exercises already owned by grouped methods (Circuits, Supersets, Density Blocks).

Additionally, `selectPlacementTargets()` did not penalize:
- Same exercise name on adjacent sessions
- High-fatigue methods on consecutive days
- Duplicate exercise selection for the same method

## How Collision Guard Now Works

### Enhanced Ownership Detection
New function `isExerciseOwnedBySessionMethod(exercise, session)` returns:
```typescript
interface MethodOwnershipResult {
  owned: boolean
  ownerMethodKey: string | null
  ownerKind: 'row_level' | 'grouped_structure' | 'session_structure' | 'unknown' | null
  reason: string
  evidence: string[]
}
```

### Session-Level Occupancy Collection
New function `collectSessionMethodOccupancy(session)` scans:
- `session.styledGroups` for grouped method types and member exercise IDs
- `session.methodStructures` for method structures and member IDs
- `session.styleMetadata.styledGroups` for additional grouped structures
- `session.exercises` for row-level method fields

### Apply-Contract Defense
Before writing method metadata, `applyTargetToProgram()` now re-checks:
- If target has `styledGroupId` → blocked
- If target has different `methodFamily` → blocked
- If target has `appliedMethod` → blocked
- If target is member of session-level styled group → blocked

## How Placement Ranking Now Avoids Adjacent Same-Exercise

### New Checks in selectPlacementTargets()
1. **Hard block method-owned slots** — No longer just soft preference, now completely skipped
2. **Track used exercise names** — Maintain set of normalized exercise names already selected
3. **Adjacent duplicate detection** — Check if selecting this slot would create same exercise within 1 session index
4. **Better alternative check** — Only allow adjacent duplicate if no better alternative exists
5. **Warning generation** — When forced to use adjacent duplicate, add clear warning

### New Reason Codes
- `blocked_existing_grouped_method_owner`
- `avoided_adjacent_same_exercise`
- `avoided_adjacent_high_fatigue_method`
- `avoided_duplicate_exercise_frequency`
- `selected_best_non_adjacent_alternative`
- `forced_duplicate_no_alternative`

## Methods That Can Apply
- Drop Set
- Rest-Pause
- Top Set
- Backoff Sets
- Cluster (if row-level render support verified)

## Methods That Remain Blocked
- **Density Blocks** — Timed-window logging required
- **Endurance/Conditioning** — Real modality/exercise prescription required
- **Supersets** — Structural writer not implemented
- **Circuits** — Use existing Method Planner for circuit application

## Proofs

### Collision Guard Proof
Circuit-owned rows now have `isExerciseAlreadyMethodOwned(exercise, session) === true` because:
- Session-level `styledGroups` are scanned for member exercise IDs
- If exercise ID matches a group member, it's blocked

### Adjacent Duplicate Guard Proof
Top Set 2x now checks:
- If both selected targets would have the same normalized exercise name AND
- If their session indices differ by ≤ 1 (adjacent)
Then: skip the second target if better alternative exists, or add warning if forced

### Program Balance Proof
- No exercise count changes from metadata-only method apply
- No fake Conditioning Finisher
- Coverage remains stable

### Generator DB Proof
- No changes to generator consumption logic
- Proof remains stable

### Day Card Render Proof
- DB-INFORMED SELECTION remains visible
- Row-level method metadata written to existing fields that `resolveRowMethodTruth` reads
- Grouped method blocks remain visible

### Live Workout Safety Proof
- No live runtime changes
- Row-level metadata does not break session boot

## TypeScript/Build Results
- **TypeScript:** PASS (0 errors)
- **Build:** PASS

## Remaining Blockers
- Full revert parity for multi-placement → MASTER-8C.11
- Live workout render verification for row-level frequency methods → MASTER-8C.11

## Next Official Step (if PASS)
MASTER-8C.11 — Controlled multi-placement audit/revert parity and live workout render verification
