# LIVE WORKOUT RUNTIME AUDIT REPORT - PHASE 5 (FUNCTIONAL STATE UPDATE FIX)

## Route Version Stamps
- `WORKOUT_SESSION_ROUTE_VERSION = 'phase_live_session_lock_v2'`
- `STREAMLINED_WORKOUT_VERSION = 'phase_live_session_lock_v2'`

## Root Cause Summary

### CRITICAL ROOT CAUSE FOUND (Phase 5)

**The `advanceToNextExercise` function had a deeper stale closure bug:**

Even though the function was "unified", it still read `state.currentExerciseIndex` from the outer scope and included it in dependencies. When called from timer callbacks (like `handleInterExerciseRestComplete`), this value was stale.

```typescript
// BROKEN: Reads state.currentExerciseIndex from outer scope
const advanceToNextExercise = useCallback((reason) => {
  const nextIndex = state.currentExerciseIndex + 1  // STALE VALUE!
  // ...
}, [state.currentExerciseIndex, exercises])  // Dependency doesn't help - callback already captured
```

### THE FIX: Functional State Updates

Changed to use `setState(prev => ...)` pattern where ALL state reads happen INSIDE the functional update callback:

```typescript
// FIXED: All state reads happen inside functional update
const advanceToNextExercise = useCallback((reason) => {
  setState(prev => {
    const currentIndex = prev.currentExerciseIndex  // FRESH VALUE!
    const nextIndex = currentIndex + 1
    // All logic now uses fresh state values
    // ...
    return { ...prev, status: 'active', currentExerciseIndex: nextIndex, currentSetNumber: 1 }
  })
}, [exercises]) // Only depends on exercises, not state
```

## Files Changed

| File | Changes |
|------|---------|
| `components/workout/StreamlinedWorkoutSession.tsx` | Rewrote `advanceToNextExercise` to use functional state updates |

## Technical Details

### Why the Bug Existed

1. `useCallback` captures values at creation time
2. `state.currentExerciseIndex` was captured when callback was created
3. Dependencies array only triggers re-creation of callback, but timer callbacks hold reference to OLD callback
4. When timer fires → OLD callback runs → OLD `state.currentExerciseIndex` value is used

### Why the Fix Works

1. `setState(prev => ...)` receives FRESH state as `prev` parameter
2. ALL state-dependent logic moved INSIDE the functional update
3. Dependencies array now only includes `exercises` (which is stable)
4. Timer callbacks can hold any version of the callback - state reads are always fresh

### Side Effects Scheduling

Input resets (`setRepsValue`, `setHoldValue`, etc.) are scheduled via `setTimeout` to ensure they run AFTER the state update completes:

```typescript
setTimeout(() => {
  setSelectedRPE(null)
  setRepsValue(nextTargetValue)
  setHoldValue(nextTargetValue)
  setBandUsed(nextBand)
  setShowInterExerciseRest(false)
}, 0)
```

## Transition Corridor - Now Truly Unified

All transition paths use the SAME functional state update pattern:

| Path | Handler | Uses Fresh State |
|------|---------|------------------|
| Inter-exercise timer completes | `handleInterExerciseRestComplete` | YES |
| Skip inter-exercise rest | `handleSkipInterExerciseRest` | YES |
| Skip exercise | `handleSkipExercise` | YES |
| Workout completion | (inside `advanceToNextExercise`) | YES |

## Verification Checklist

- [x] Fresh workout start loads correctly
- [x] First exercise displays
- [x] Complete set advances correctly
- [x] Rest timer works
- [x] Completing final set of exercise shows inter-exercise rest (if enabled)
- [x] Timer completion advances to CORRECT next exercise
- [x] Skip inter-exercise rest advances to CORRECT next exercise
- [x] Timer completion and skip produce IDENTICAL next state
- [x] Inputs show correct target values for new exercise
- [x] Band selection respects new exercise's executionTruth
- [x] Final exercise completion marks workout complete
- [x] No boundary crash on any transition path

## Systems Untouched

- Program generation logic
- 6-session flexible/adaptive logic
- Modify/rebuild/restart semantics
- Onboarding persistence
- Program page truth display
- Pricing/billing/auth
- Database schema
- AI truth/doctrine systems
- Session restore logic

## Final Verdict

**LIVE_WORKOUT_RUNTIME_CONTRACT_FIX_COMPLETE**

The stale closure bug has been eliminated by using functional state updates that read state values INSIDE the update callback, ensuring fresh values are always used regardless of when the callback was created or how long it was held by timers.

---
*Report generated: Functional State Update Fix*
*Route Version: phase_live_session_lock_v2*
