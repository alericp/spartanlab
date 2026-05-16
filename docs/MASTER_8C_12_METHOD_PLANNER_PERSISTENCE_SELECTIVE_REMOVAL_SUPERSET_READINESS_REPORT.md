# MASTER-8C.12 — Method Planner Persistence Repair + Selective Removal + Superset Structural Override Apply Readiness Report

**Date:** May 15, 2026  
**Status:** PARTIAL COMPLETE (8C.12A + 8C.12B + 8C.12D complete, 8C.12C deferred)  
**Step Type:** Same-corridor bundled repair + controlled implementation gate

---

## Summary

This step addressed the critical user-reported bug where row-level Method Planner additions appeared on Program Day cards but disappeared after page refresh. The root cause was identified and fixed: frequency placement was using a state-only callback instead of the authoritative `saveAdaptiveProgram` persistence path.

Additionally, selective removal was implemented to allow users to remove specific applied methods without wiping everything via "Reset All".

Superset structural apply (8C.12C) is **deferred** pending additional grouped method infrastructure work.

---

## Subtask Results

### MASTER-8C.12A — Persistence Repair: **COMPLETE**

**Root Cause Found:**
- `SlotEligibilityFrequencyPreviewSection` was calling `onProgramUpdate(result.updatedProgram)` after `applyConfirmedFrequencyPlacementPreview`
- `onProgramUpdate` was wired to `setProgram` (React state only)
- Other method override paths (apply/revert/reset) correctly used `saveAdaptiveProgram`
- Result: Row-level methods appeared in UI but were lost on refresh

**Fix Applied:**
1. Added new `onApplyFrequencyPlacement` callback prop to:
   - `ProgramCoachIntelligenceHubProps` interface
   - `AdaptiveProgramDisplayProps` interface
   - `RequestedMethodsSheetContent` inner component props
   - `SlotEligibilityFrequencyPreviewSectionProps` interface

2. Created `handleApplyFrequencyPlacement` callback in `app/(app)/program/page.tsx`:
   - Calls pure `applyConfirmedFrequencyPlacementPreview` helper
   - Saves result through `saveAdaptiveProgram`
   - Updates Program Page state with saved program
   - Returns result with evidence including "Program saved via saveAdaptiveProgram"

3. Updated `SlotEligibilityFrequencyPreviewSection.handleConfirmApply`:
   - Now uses `onApplyFrequencyPlacement` when available (persists to localStorage)
   - Falls back to state-only update with WARNING evidence if callback unavailable
   - In production path, the callback is always available

**Save Path After Fix:**
```
User confirms frequency placement
→ handleConfirmApply calls onApplyFrequencyPlacement
→ handleApplyFrequencyPlacement in Program Page
→ applyConfirmedFrequencyPlacementPreview (pure helper)
→ saveAdaptiveProgram (canonical persistence)
→ onProgramUpdate (state update with saved program)
→ Refresh loads from localStorage via canonical hydration
→ Applied methods persist
```

### MASTER-8C.12B — Selective Removal: **COMPLETE**

**New Types Added to `lib/program/method-frequency-placement-apply-contract.ts`:**
- `AppliedMethodPlacement` — Represents a single user-applied method with identity
- `ExtractAppliedPlacementsResult` — Result of extracting all applied placements
- `SelectiveRemovalResult` — Result of removing selected placements

**New Functions Added:**
- `extractAppliedMethodPlacements(program)` — Extracts all user-applied method placements from program
- `removeSelectedMethodPlacements({ program, placementIds })` — Removes selected placements while preserving others

**New Callback Added:**
- `handleRemoveSelectedPlacements` in `app/(app)/program/page.tsx`
- Wired through `AdaptiveProgramDisplay` and `ProgramCoachIntelligenceHub`

**New UI Added:**
- `SelectiveMethodRemovalSection` component in `ProgramCoachIntelligenceHub.tsx`
- Shows collapsible "Manage Applied Methods" section with count badge
- Lists all user-applied placements with checkboxes
- Select all/deselect all functionality
- Confirmation dialog before removal
- Removes only selected items
- Preserves unselected items and native AI methods

### MASTER-8C.12C — Superset Structural Apply: **DEFERRED**

**Reason for Deferral:**
Superset apply requires grouped method infrastructure that writes to:
- `session.methodStructures`
- `session.styleMetadata.styledGroups`
- Exercise-level group membership fields

The current row-level frequency placement corridor writes to individual exercise fields only. Adding Superset apply requires:
1. Superset candidate scoring logic (compatible exercise pairs)
2. Safe pairing validation (skill quality, recovery, muscle group balance)
3. Grouped structure writer that matches native Superset materialization shape
4. Selective removal for grouped structures
5. Verification that Program Day cards and live workout consume the grouped truth

This is a larger scope that should be its own step.

### MASTER-8C.12D — Density Block / AMRAP Doctrine: **COMPLETE**

**Documented in this report:**

1. **Density Block** should not necessarily require a pre-existing timed window. A user-applied Density Block can create the time window when the structural writer/runtime is ready.

2. **Density Block** should not be assumed to equal generic AMRAP.

3. **Calisthenics density** can mean skill-endurance sequencing:
   - Fixed reps/holds
   - Near-failure or max-RPE finish
   - Immediate transitions
   - Push/pull or muscle-group alternation
   - Rest mainly from switching movement patterns
   - Planche/front lever/core/push-pull combinations
   - Event-style skill endurance
   - Quality caps and safety stops

4. **AMRAP** may need its own method family or sub-mode because AMRAP can mean:
   - One exercise max reps
   - One exercise max quality reps in time
   - Rotating rounds for time
   - Many rounds as possible
   - Conditioning circuit AMRAP
   - Skill endurance density
   - Benchmark/testing AMRAP
   - Hypertrophy/endurance finisher AMRAP

5. **Future AMRAP UI** may need selectable subtypes/options rather than a single generic method.

6. **Density/AMRAP future work** must include:
   - Program card render
   - Start Workout/live runtime
   - Timer/time-cap behavior
   - Logging model
   - RPE/failure capture
   - Safety stops
   - Persistence/reload
   - Reset/selective removal
   - Doctrine/fitness goal matching
   - Clear difference from Circuit/Superset/Endurance

---

## Files Changed

| File | Changes |
|------|---------|
| `app/(app)/program/page.tsx` | Added `handleApplyFrequencyPlacement`, `handleRemoveSelectedPlacements` callbacks; added imports |
| `components/programs/AdaptiveProgramDisplay.tsx` | Added `onApplyFrequencyPlacement`, `onRemoveSelectedPlacements` props and wiring |
| `components/programs/ProgramCoachIntelligenceHub.tsx` | Added callback props to interface and inner components; added `SelectiveMethodRemovalSection` component; added icon imports |
| `lib/program/method-frequency-placement-apply-contract.ts` | Added extended types; added `extractAppliedMethodPlacements`, `removeSelectedMethodPlacements` functions |

## Files Intentionally Not Touched

- Generator/builder program creation logic
- Database/Prisma
- Auth/billing/Stripe/Clerk
- Package files
- Onboarding
- Exercise seed database
- `AdaptiveSessionCard.tsx` (consumer audit showed it already works)
- `StreamlinedWorkoutSession.tsx` (consumer audit showed it already works)
- `structural-method-materialization-corridor.ts` (not needed for row-level persistence fix)
- `method-structure-contract.ts` (not needed for row-level persistence fix)

---

## Verification Commands

```bash
# TypeScript check
pnpm tsc --noEmit --pretty false
# Result: 0 errors

# Build
pnpm run build
# Result: PASSED (exit code 0)
```

---

## Deployment Status

Ready for deployment after this report is committed.

---

## UI Verification Location

**App route/page:** `/program` (Program Page)

**Exact screen/phase:** Coach Intelligence Hub → Method Override Planner

**Sections to verify:**
1. Slot Eligibility & Frequency Preview — apply row-level methods
2. Manage Applied Methods — new selective removal section
3. Reset overrides — existing reset all section
4. Program Day cards — verify applied methods appear
5. Start Workout — verify applied method cues appear

---

## Expected PASS Visual

1. Apply Top Set to one target → appears on Program Day card
2. Refresh page → Top Set still appears
3. Apply Drop Set to another target → both appear
4. Refresh page → both still appear
5. Open "Manage Applied Methods" → see both placements listed
6. Select only one placement → remove it
7. Refresh page → only removed one is gone, other remains
8. Use Reset All → all user-applied methods removed, native methods remain
9. Start Workout → no crash, method cues appear

---

## Expected FAIL Visual

- Applied methods disappear after refresh
- Selective removal deletes unselected methods
- Reset All removes native AI methods
- Superset is falsely shown as implemented
- Density is falsely unlocked
- TypeScript/build fails

---

## Remaining Blockers

| Blocker | Status |
|---------|--------|
| Row-level persistence | **FIXED** |
| Selective removal | **IMPLEMENTED** |
| Superset structural apply | **DEFERRED** — needs grouped method writer infrastructure |
| Density Block apply | **BLOCKED** — needs timed/sequence runtime, logging model |
| AMRAP apply | **NOT STARTED** — needs doctrine definition first |

---

## Next Official Step (if this passes)

**MASTER-8C.13** — Superset Structural Override Apply Implementation

Prerequisites for 8C.13:
- 8C.12A persistence must pass verification
- 8C.12B selective removal must pass verification
- Superset candidate scoring logic must be defined
- Safe pairing rules must be documented
- Grouped structure writer must match native materialization shape

OR

**MASTER-8C.13** — Density Block / AMRAP Method Family Doctrine + Timed/Sequence Runtime Readiness Inventory

If the reconciled checklist selects this as higher priority than Superset.

---

## Conclusion

MASTER-8C.12A and 8C.12B are **COMPLETE** and ready for verification. The critical persistence bug is fixed and selective removal is implemented. Superset structural apply (8C.12C) is deferred to a dedicated step that can properly implement the grouped method infrastructure.
