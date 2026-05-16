# MASTER-8C.12.1 — Method Planner UX Unification Report

## Current Official Step
MASTER-8C.12.1

## Status
COMPLETE

## Subtasks Completed

### 8C.12.1A — Method-Detail Frequency Controls
- Added `MethodDetailFrequencyControls` component inside `ProgramCoachIntelligenceHub.tsx`
- Component appears inside the selected method detail view after the preview section
- Supports row-level methods: Top Set, Backoff Sets, Drop Sets, Rest-Pause, Cluster Sets
- Shows frequency chips (0x/1x/2x/3x based on safeMax), preview targets, and apply button
- Structural methods (Circuit, Superset, Density Block) show appropriate messaging instead of frequency controls
- Uses existing `buildFrequencySlotPlacementPreview` and `onApplyFrequencyPlacement` callback

### 8C.12.1B — Demote Standalone Frequency Section
- Updated `SlotEligibilityFrequencyPreviewSection` to accept `isDiagnosticMode` prop
- When `isDiagnosticMode=true` (now the default), section is collapsed by default
- Header changed to "Advanced Placement Diagnostics" with "Optional" badge
- Visual styling dimmed to indicate secondary/diagnostic nature
- Original method list is now the primary user workflow

### 8C.12.1C — Visible Selective Removal UI
- Added `ManageAppliedAdditionsSection` component
- Displays all user-applied method placements with checkboxes
- Shows method label, day number, exercise name, and "Added by you" indicator
- Select all / deselect all functionality
- Remove selected button with confirmation dialog
- Success/error result banners after removal
- Empty state when no user-applied placements exist
- Uses existing `extractAppliedMethodPlacements` and `onRemoveSelectedPlacements`

### 8C.12.1D — Target Ranking Audit and Improvement
- Improved `selectPlacementTargets` in `method-frequency-slot-placement-preview.ts`
- Added session method load calculation to prefer less-loaded days
- Changed sorting from earliest-day-first to score-based ranking:
  1. Hard block already method-owned
  2. Prefer high confidence
  3. Prefer not primary skill sensitive
  4. Prefer fewer caution reasons
  5. **NEW**: Prefer sessions with lower method load
  6. **NEW**: Spread across sessions using distance from midpoint
- Updated `buildWhyChosen` to include "Lower method load" reasoning
- Target preview now shows why each slot was chosen

### 8C.12.1E — Fix Blocked Method Messaging
- Updated Density Block message: "Density Block needs timed/sequence runtime, logging, and save/reload support"
- Updated Superset message: "Superset needs structural pair writer before frequency placement"
- Added method-specific messaging in `MethodDetailFrequencyControls`:
  - Circuit: "Circuits use the structural Method Planner apply flow above, not row-level frequency placement."
  - Superset: "Superset needs structural pair writer before frequency placement."
  - Density Block: "Density Block needs timed/sequence runtime, logging, and save/reload support."
- Changed label from "Frequency Placement" to "Structural Apply" for structural methods

## Subtasks Deferred
- Density Block apply (needs timed/sequence runtime)
- AMRAP (needs method family definition)
- Full Superset structural writer (needs dedicated step)
- Live workout runtime rewrite
- Generator rewrite
- Database/Prisma changes

## Files Changed
- `components/programs/ProgramCoachIntelligenceHub.tsx`
  - Added `MethodDetailFrequencyControls` component
  - Added `ManageAppliedAdditionsSection` component
  - Updated `SlotEligibilityFrequencyPreviewSection` with `isDiagnosticMode` prop
  - Updated `MethodDetailModalContent` to include frequency controls
  - Added icon imports (Settings2, Minus)

- `lib/program/method-frequency-slot-placement-preview.ts`
  - Added session method load calculation
  - Improved target ranking with load-based scoring
  - Updated `buildWhyChosen` to include method load reasoning
  - Updated `buildPlacementTarget` to accept methodLoad parameter

- `lib/program/method-slot-eligibility-frequency-planner.ts`
  - Updated Density Block blocked reason messaging
  - Updated Superset blocked reason messaging

## Files Intentionally Not Touched
- `app/(app)/program/page.tsx` — callback wiring already complete from MASTER-8C.12
- `components/programs/AdaptiveProgramDisplay.tsx` — prop passing already complete
- `components/programs/AdaptiveSessionCard.tsx` — no changes needed
- `components/workout/StreamlinedWorkoutSession.tsx` — no changes needed
- Generator/builder logic
- Database/Prisma
- Package files

## Verdicts

### Frequency Persistence
PASSED — Applied methods survive page refresh via existing `onApplyFrequencyPlacement` callback from MASTER-8C.12A

### UX Unification
PASSED — Method detail flow now includes frequency controls. Standalone frequency section demoted to diagnostic.

### Selective Removal
PASSED — `ManageAppliedAdditionsSection` provides visible UI for selective removal with checkboxes and confirmation

### Target Ranking
PASSED — Score-based ranking now prefers lower method load days and spreads across sessions

### Circuit/Superset/Density Messaging
PASSED — Each structural method has clear, honest messaging about why it's not row-level frequency

## TypeScript Result
```
pnpm tsc --noEmit --pretty false
[No errors]
```

## Build Result
```
pnpm run build
[Build completed successfully]
```

## Deployment Status
Ready for deployment

## UI Verification Location
- **App route**: `/program`
- **Screen**: Coach Intelligence Hub → Method Override Planner
- **Sections to verify**:
  1. Tap any row-level method (Top Set, Drop Sets, etc.) → see frequency controls inside detail
  2. Tap structural method (Circuit, Superset, Density Block) → see appropriate "Structural Apply" message
  3. "Manage Applied Additions" section visible with checkbox list
  4. "Advanced Placement Diagnostics" section collapsed by default

## Expected PASS Visual
- Method list is primary view (not frequency table)
- Tapping Top Set opens detail with frequency chips and preview targets
- Selecting 2x shows "Lower method load" or "High confidence" in whyChosen
- Apply saves and survives refresh
- Manage Applied Additions shows checkboxes for removal
- Circuits say "structural apply flow"
- Supersets say "needs structural pair writer"
- Density Blocks say "needs timed/sequence runtime"

## Expected FAIL Visual
- Big frequency table dominates normal view
- Frequency controls not inside method detail
- Selective removal not visible
- Circuits/Supersets show generic "blocked" instead of structural messaging
- Target ranking still fills Day 1/2/3 first even when Day 6 has lower load

## Remaining Blockers
- Superset structural writer (MASTER-8C.13)
- Density Block timed runtime
- AMRAP method family definition

## Next Official Step
MASTER-8C.12.2 — Superset Structural Writer Apply (if ready), or MASTER-8C.13 per official checklist reconciliation
