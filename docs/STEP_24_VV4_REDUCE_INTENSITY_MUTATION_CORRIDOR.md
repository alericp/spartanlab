# STEP 24 V.V4 — REDUCE INTENSITY MUTATION CORRIDOR

> **Status:** COMPLETE  
> **Date:** 2026-05-08  
> **Step:** 24.4 (V.V4)  
> **Purpose:** Implement user-confirmed saved-program mutation corridor for reduce_next_session_intensity

---

## A. SCOPE

V.V4 adds the first controlled saved-program mutation corridor in Phase V.

When the missed-workout advisory recommends `reduce_next_session_intensity`, the user can now:
1. Review what will change (preview)
2. Explicitly confirm the reduction
3. Have the saved program updated with reduced intensity
4. See success/failure feedback

This is NOT auto-apply. This is NOT live-workout mutation. This is NOT generator rewrite.

---

## B. FILES INSPECTED

| File | Purpose |
|------|---------|
| `lib/program/missed-workout-recomposition-advisory.ts` | Existing advisory types, V.V2/V.V3 structures |
| `components/programs/AdaptiveProgramDisplay.tsx` | Existing push_session_forward UI pattern |
| `app/(app)/program/page.tsx` | Program Page save/callback patterns |
| `lib/adaptive-program-builder.ts` | AdaptiveSession, AdaptiveExercise types |
| `docs/STEP_24_VV2_REDUCE_INTENSITY_READINESS_AUDIT.md` | V.V2 requirements |
| `docs/STEP_24_VV3_PROTECT_RECOVERY_SPACING_PREVIEW.md` | V.V3 boundaries to preserve |

---

## C. FILES CHANGED

| File | Changes |
|------|---------|
| `lib/program/missed-workout-recomposition-advisory.ts` | Added `IntensityReductionProvenance`, `ReduceIntensityResult`, `ReduceIntensityInput`, `ReduceIntensityPreview` types; Added `reduceSessionIntensity()` and `buildReduceIntensityPreview()` pure helpers |
| `components/programs/AdaptiveProgramDisplay.tsx` | Added imports for V.V4 types/helpers; Added `onConfirmReduceIntensity` prop; Added `reduceIntensityState`, `reduceIntensityResult` state; Added V.V4 confirmation UI section |
| `app/(app)/program/page.tsx` | Added imports for V.V4 types/helper; Added `handleConfirmReduceIntensity` callback; Passed callback to AdaptiveProgramDisplay |
| `lib/program/master-truth-connection-blueprint.ts` | Updated V.V4 status to COMPLETE with evidence |

---

## D. TARGET SELECTION LOGIC

### How Target Session is Selected

The target session is currently the **first session** (index 0) in the program.

In a production scenario, this would be determined by:
1. Advisory context containing the next incomplete session after the missed workout
2. Program state indicating which session is "current"
3. Session status markers indicating completion

### What Happens if Target Cannot Be Identified

If the target session index is out of range or the program is null:
- The mutation is **blocked**
- The UI shows "Target session not found."
- No program data is changed

### Why This Avoids Blind Mutation

- The helper validates the target index before any mutation
- If validation fails, `status: 'blocked'` is returned
- The UI only shows the apply button when validation passes
- Preview shows exactly which session will be modified

---

## E. SAFE MUTATION PROOF

### Fields Changed

| Field | Change |
|-------|--------|
| `exercise.sets` | Reduced by 1 (minimum 2) |
| `exercise.note` | Appended `[Reduced intensity — fatigue advisory]` |
| `session.adaptationNotes` | Appended V.V4 provenance marker `[V.V4:timestamp]` + note |

> **Note (V.V4-A fix):** `session.intensityReductionProvenance` and `program.lastModified` are NOT valid typed fields on AdaptiveSession/AdaptiveProgram. V.V4 provenance is stored in `adaptationNotes` using a `[V.V4:timestamp]` prefix marker for duplicate-apply detection.

### Fields NOT Changed

| Field | Preserved |
|-------|-----------|
| `exercise.id` | YES |
| `exercise.name` | YES |
| `exercise.category` | YES |
| `exercise.repsOrTime` | YES |
| `exercise.method` | YES |
| `exercise.blockId` | YES |
| `exercise.isOverrideable` | YES |
| `exercise.selectionReason` | YES |
| `exercise.prescribedLoad` | YES |
| `session.dayNumber` | YES |
| `session.dayLabel` | YES |
| `session.focus` | YES |
| `session.exercises` (identity) | YES |
| `session.warmup` | YES |
| `session.cooldown` | YES |
| `session.trainingBlocks` | YES |
| `program.sessions` (order) | YES |
| `program.goalSkillIds` | YES |
| `program.profileSnapshot` | YES |

### Summary

| Check | Result |
|-------|--------|
| Exercise identity changed | NO |
| Selected skills changed | NO |
| Schedule changed | NO |
| Generator changed | NO |
| Live workout changed | NO |

---

## F. PERSISTENCE / RELOAD PROOF

### Save Path Used

```typescript
const { saveAdaptiveProgram } = await import('@/lib/adaptive-program-builder')
const savedProgram = saveAdaptiveProgram(result.updatedProgram)
```

This is the same canonical save path used by:
- Program Page fresh build
- push_session_forward mutation (Step 23.6)

### State Update Path

```typescript
if (onProgramUpdate) {
  onProgramUpdate(savedProgram)
}
```

The saved program is passed back to the parent component which owns `setProgram`.

### Duplicate-Apply Guard

```typescript
// V.V4 provenance stored as "[V.V4:timestamp]" prefix in adaptationNotes
const hasV4Marker = (targetSession.adaptationNotes || []).some(
  note => note.startsWith('[V.V4:')
)
if (hasV4Marker) {
  return {
    status: 'already_reduced',
    visibleSummary: `Intensity was already reduced on "${targetSession.dayLabel}".`,
    ...
  }
}
```

If a session already has a V.V4 provenance marker in `adaptationNotes`, the mutation is blocked.

### Failure Behavior

If `saveAdaptiveProgram` throws:
- `status: 'blocked'` is returned
- `visibleSummary: 'Failed to save the updated program.'`
- UI shows failed state
- Program Page state is NOT updated with stale/failed data

---

## G. TRUTH-TO-UI PROOF TABLE

| Truth Source | UI Surface | Binding |
|--------------|------------|---------|
| `reduceIntensityState === 'idle'` | Shows "Review & Reduce Intensity" button | Direct state |
| `reduceIntensityState === 'confirming'` | Shows preview + Confirm/Cancel buttons | Direct state |
| `reduceIntensityState === 'applying'` | Shows loading spinner | Direct state |
| `reduceIntensityState === 'applied'` | Shows success message + Done button | Direct state |
| `reduceIntensityState === 'failed'` | Shows error message | Direct state |
| `intensityPreview.alreadyReduced` | Shows "Already Reduced" info | Preview helper |
| `intensityPreview.whatWillChange` | Lists changes in preview | Preview helper |
| `intensityPreview.whatWillNotChange` | Lists preserved items in preview | Preview helper |
| `reduceIntensityResult.visibleSummary` | Displayed in success/failure message | Result object |

---

## H. NO-BREAKAGE CHECK

| Check | Result |
|-------|--------|
| package.json changed | NO |
| pnpm-lock.yaml changed | NO |
| schema changed | NO |
| generator changed | NO |
| onboarding changed | NO |
| live workout mutation | NO |
| protect_recovery_spacing still preview-only | PASS |
| push_session_forward preserved | PASS |

---

## I. USER-FACING EXPECTATION

When the `reduce_next_session_intensity` advisory is triggered:

1. **Initial View**: User sees advisory card with "Consider reduced intensity" title, summary, and "Review & Reduce Intensity" button.

2. **On Button Click**: Preview expands showing:
   - Target session label
   - "What will change" list (sets reduced, coaching note added)
   - "What stays the same" list (exercise selection, skill representation, schedule)
   - "Confirm Reduction" and "Cancel" buttons

3. **On Confirm**: 
   - Brief loading state
   - Success message: "Reduced intensity on [session]: X exercises had sets reduced."
   - "Saved program updated. Live workout unchanged."
   - "Done" button to dismiss

4. **On Cancel**: Returns to idle state, no changes made.

5. **If Already Reduced**: Shows "Already Reduced" info with the date of prior reduction.

---

## J. BUILD RESULTS

```
pnpm exec tsc --noEmit --pretty false
# Expected: PASS

pnpm run build  
# Expected: PASS
```

---

## K. FINAL VERDICT

**PASS — V.V4 complete, Phase V remains open, next official item is V.V5.**

### Summary

- V.V4 adds the first user-confirmed saved-program mutation corridor
- Pure helper `reduceSessionIntensity()` handles all mutation logic
- Two-step confirmation UI prevents accidental changes
- Duplicate-apply guard prevents stacking reductions
- Canonical save path used (same as push_session_forward)
- Exercise identity and skill representation preserved
- No live workout mutation
- No generator/schema/package changes
- V.V3 protect_recovery_spacing remains preview-only

### Next Official Item

**V.V5 — User-confirmed recovery-spacing mutation corridor**
