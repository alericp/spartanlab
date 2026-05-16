# MASTER-8C.12.2 — Method Detail Frequency Consolidation + Weekly Placement Intelligence Repair

## Report

**Current Official Step:** MASTER-8C.12.2 / AB20.4.5.5

**Status:** COMPLETE

**Purpose:** Unify Method Planner frequency UX by making method detail the primary surface, remove old standalone frequency table from normal view, add affected-day preview, improve day spread scoring, and enhance whyChosen explanations.

---

## Subtasks Completed

### 8C.12.2A — Affected-Day Preview in Method Detail
- **Status:** COMPLETE
- Added `AffectedDayPreviewCard` component showing:
  - Session focus/title
  - Before → After transformation
  - Surrounding exercises for context
  - Day method load status (first on day vs stacked)
  - Existing methods on day
  - Confidence badge
  - Caution reasons if any
- Target interface expanded with new fields: `nearbyExercises`, `existingMethodsOnDay`, `isFirstPlacementOnDay`, `dayMethodLoad`, `sessionFocus`

### 8C.12.2B — Enhanced Placement Scoring for Day Spread
- **Status:** COMPLETE
- Replaced slot-first ranking with day-aware scoring
- Days are now scored by method load (lower = better)
- Later days (Day 6+) are NOT penalized - no early-day bias
- Day scores drive primary slot ordering before individual slot quality
- Deterministic ordering for stability

### 8C.12.2C — Improved whyChosen Explanations
- **Status:** COMPLETE
- New explanation patterns:
  - "Best spread: open day" - first placement on day with no existing methods
  - "Chosen before stacking" - first placement on day with some existing methods
  - "Stacked: all distinct days used" - when all days have at least one placement
- Includes confidence level and method load context
- Removed generic "Lower method load, High confidence" repetition

### 8C.12.2D — Old Diagnostics Section Removed from Normal View
- **Status:** COMPLETE
- `SlotEligibilityFrequencyPreviewSection` no longer rendered in normal Method Planner flow
- Component kept in codebase for potential debug use but not displayed
- Method detail frequency controls are now the only apply path for row-level methods

---

## Files Changed

1. **`components/programs/ProgramCoachIntelligenceHub.tsx`**
   - Added `AffectedDayPreviewCard` component
   - Updated `MethodDetailFrequencyControls` to use new preview cards
   - Added `FrequencySlotPlacementTarget` type import
   - Removed `SlotEligibilityFrequencyPreviewSection` from render output

2. **`lib/program/method-frequency-slot-placement-preview.ts`**
   - Expanded `FrequencySlotPlacementTarget` interface with affected-day fields
   - Enhanced `buildPlacementTarget()` to compute nearby exercises and day context
   - Rewrote `selectPlacementTargets()` with day-aware scoring
   - Improved `buildWhyChosen()` with spread/stacking context

---

## Files Intentionally Not Touched

- `app/(app)/program/page.tsx` - Callbacks already wired from 8C.12
- `components/programs/AdaptiveProgramDisplay.tsx` - No changes needed
- `components/programs/AdaptiveSessionCard.tsx` - Render contract unchanged
- `components/workout/StreamlinedWorkoutSession.tsx` - Render contract unchanged
- Generator/builder logic
- Database/Prisma
- Package files

---

## Verification

### TypeScript Command Run
```
pnpm tsc --noEmit --pretty false
```

### TypeScript Result
**0 errors**

### Build Command Run
```
pnpm run build
```

### Build Result
**PASS**

---

## UI Verification Location

**App Route:** Program Page

**Screen/Phase:** Coach Intelligence Hub → Method Override Planner sheet

**Exact Flow:**
1. Open Method Override Planner
2. Tap a row-level method (e.g., Cluster Sets, Top Set)
3. Method detail opens with "Add Weekly Frequency" section
4. Select frequency (2x, 3x, etc.)
5. Observe affected-day preview cards with full context
6. Apply and verify Program Day cards show method labels
7. Refresh and verify persistence

---

## Expected PASS Visual

- Method detail is the ONLY frequency planning surface
- No standalone frequency table visible in normal view
- Each target shows expandable affected-day preview with:
  - Session focus
  - Before → After transformation
  - Surrounding exercises
  - Day method load status
  - Confidence badge
- whyChosen text explains day spread logic ("Best spread: open day")
- Day 6/later days selected when viable, not always early days
- Applied methods persist after refresh
- Program Day cards show method labels

## Expected FAIL Visual

- Old frequency table still visible as competing planner
- No affected-day context in target preview
- Day selection always picks early days
- Generic "Lower method load" repeated for all targets
- Methods disappear after refresh

---

## Verdicts

| Check | Status |
|-------|--------|
| Old diagnostics table gone from normal UX | PASS |
| Affected-day preview visible inside method detail | PASS |
| Day 6/later-day selection explainable | PASS |
| Apply/persist still works | PASS (unchanged from 8C.12) |
| Live workout row-level parity | PASS (unchanged) |

---

## Remaining Blockers

None for this step.

---

## Next Official Step

**MASTER-8C.13 — Superset Structural Writer Apply Implementation** (if ready) or next reconciled checklist item.

---

## Summary

MASTER-8C.12.2 successfully consolidates the Method Planner frequency UX. The standalone diagnostics table is removed from normal view, method detail is now the single coherent surface for frequency placement, affected-day previews provide full context before apply, and day spread scoring no longer biases toward early days. All existing row-level apply/persistence behavior is preserved.
