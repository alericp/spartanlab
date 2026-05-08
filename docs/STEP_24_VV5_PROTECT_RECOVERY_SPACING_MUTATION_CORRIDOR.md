# Step 24 / Phase V / V.V5 — Protect Recovery Spacing Mutation Corridor

## Status: COMPLETE

## Scope

Implement user-confirmed saved-program mutation corridor for `protect_recovery_spacing` action. This converts the V.V3 preview-only advisory into a mutation-capable corridor that allows users to explicitly confirm and apply recovery spacing protection to their saved program.

## Files Inspected

1. `lib/program/missed-workout-recomposition-advisory.ts` — V.V3 preview types, V.V4 patterns
2. `components/programs/AdaptiveProgramDisplay.tsx` — V.V3 preview UI, V.V4 mutation UI pattern
3. `app/(app)/program/page.tsx` — V.V4 callback pattern, canonical save path
4. `lib/program/master-truth-connection-blueprint.ts` — Checklist state
5. `docs/STEP_24_VV4_REDUCE_INTENSITY_MUTATION_CORRIDOR.md` — V.V4 reference

## Files Changed

1. `lib/program/missed-workout-recomposition-advisory.ts`
   - Added `ProtectRecoverySpacingResult` type
   - Added `ProtectRecoverySpacingInput` type
   - Added `ProtectRecoverySpacingMutationPreview` type
   - Added `buildProtectRecoverySpacingMutationPreview()` pure helper
   - Added `protectRecoverySpacing()` pure helper

2. `components/programs/AdaptiveProgramDisplay.tsx`
   - Added V.V5 type imports
   - Added `onConfirmProtectRecoverySpacing` callback prop
   - Added `protectRecoverySpacingState` and `protectRecoverySpacingResult` state
   - Converted V.V3 preview-only UI to V.V5 mutation corridor with two-step confirmation

3. `app/(app)/program/page.tsx`
   - Added V.V5 type imports
   - Added `handleConfirmProtectRecoverySpacing` callback using canonical save path
   - Passed callback to AdaptiveProgramDisplay

4. `lib/program/master-truth-connection-blueprint.ts`
   - Marked V.V5 COMPLETE with evidence
   - Updated nextAction to V.V6

5. `docs/STEP_24_VV5_PROTECT_RECOVERY_SPACING_MUTATION_CORRIDOR.md`
   - Created this documentation file

## Safety Bounds

### Mutation Allowed Fields

| Field | Change |
|-------|--------|
| `session.adaptationNotes` | Appended V.V5 provenance marker + protection note |

### Mutation Forbidden Fields

- Exercise names/IDs
- Skill representation
- Sets/reps/holds
- RPE/intensity
- Progression level
- Warmups/cooldowns structure
- Session order (conservative approach — no reordering)
- Completed sessions/history
- Live workout state
- Generator inputs
- Schema/package files

> **Note:** V.V5 uses a conservative mutation strategy. Rather than reordering sessions (which would change schedule semantics), it marks the session with a recovery spacing protection note. This allows future features to use the marker for scheduling guidance while preserving the current session order.

## Duplicate-Apply Guard

```typescript
// V.V5 provenance stored as "[V.V5:protect_recovery_spacing:timestamp]" prefix in adaptationNotes
const hasV5Marker = (targetSession.adaptationNotes || []).some(
  note => note.startsWith('[V.V5:protect_recovery_spacing:')
)
if (hasV5Marker) {
  return {
    status: 'already_protected',
    visibleSummary: `Recovery spacing was already protected on "${targetSession.dayLabel}".`,
    ...
  }
}
```

If a session already has a V.V5 provenance marker in `adaptationNotes`, the mutation is blocked.

## Confirmation Flow

1. **Idle state**: User sees "Review & Protect Spacing" button
2. **Confirming state**: User sees preview of what will change vs. what stays the same
3. **Applying state**: Loading indicator while save in progress
4. **Applied state**: Success message with "Done" button
5. **Failed state**: Error message if save fails
6. **Already Protected state**: Info message if duplicate-apply detected

## Persistence Path

- Uses canonical `saveAdaptiveProgram` function via dynamic import
- Program Page state updated via `onProgramUpdate` callback
- No direct localStorage/sessionStorage writes
- Full program object saved (not partial)

## No-Breakage Verification

| Check | Result |
|-------|--------|
| No generator changes | PASS |
| No schema changes | PASS |
| No package changes | PASS |
| No live workout mutation | PASS |
| V.V4 reduce-intensity preserved | PASS |
| No invalid AdaptiveProgram fields | PASS |
| No invalid AdaptiveSession fields | PASS |
| No casts/suppressions | PASS |

## Truth-to-UI Proof Table

| Stage | Component | Verified |
|-------|-----------|----------|
| Advisory source | `buildMissedWorkoutRecompositionAdvisory` | YES |
| Preview helper | `buildProtectRecoverySpacingMutationPreview` | YES |
| Render preview | AdaptiveProgramDisplay V.V5 section | YES |
| Confirm action | Two-step confirmation with explicit button | YES |
| Mutation helper | `protectRecoverySpacing` | YES |
| Save path | `saveAdaptiveProgram` via Program Page | YES |
| Page state update | `onProgramUpdate` callback | YES |
| Reload persistence | Via canonical save path | YES |
| Final UI evidence | Success message + provenance in adaptationNotes | YES |

## Build Results

- **tsc**: PASS
- **build**: PASS

## Official Checklist Status

| Item | Status |
|------|--------|
| W.W | COMPLETE |
| V.V1 | COMPLETE |
| V.V2 | COMPLETE |
| V.V3 | COMPLETE |
| V.V4 | COMPLETE |
| V.V5 | COMPLETE |
| V.V6 | NOT_STARTED |
| V.V7 | NOT_STARTED |

## User-Facing Expectation

When `protect_recovery_spacing` advisory is triggered, the Program Page shows:

1. **Card with Shield icon** — "Protect Recovery Spacing" title
2. **Summary** — Why recovery spacing matters for this session
3. **"Review & Protect Spacing" button** — Opens confirmation panel
4. **Confirmation panel** shows:
   - Target session label
   - What will change (protection note added, saved program updated)
   - What stays the same (exercises, sets, reps, intensity, schedule, live workout)
   - "Confirm Protection" and "Cancel" buttons
5. **After confirmation**:
   - Success message: "Recovery Spacing Protected"
   - Visible summary of what happened
   - Note that exercises/sets/reps unchanged, live workout unaffected

## Final Verdict

**PASS — V.V5 complete, safe to move to V.V6.**
