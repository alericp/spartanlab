# Step 24 / V.V3 — Protect Recovery Spacing Preview

## Scope

V.V3 implements a **preview-only** UI for the `protect_recovery_spacing` missed-workout advisory action. This provides users with truthful recovery spacing guidance derived from advisory evidence without mutating the program, saved state, or live workout.

## Current Advisory Action Audited

- **Action**: `protect_recovery_spacing`
- **Location**: `lib/program/missed-workout-recomposition-advisory.ts` (lines 379-395, 591-601)
- **Trigger conditions**:
  - High fatigue detected before a demanding (high-stress) next session
  - High-stress session stacking scenario
- **Current state**: Advisory-only, no mutation

## Files Inspected

1. `lib/program/missed-workout-recomposition-advisory.ts` — Existing action definition
2. `components/programs/AdaptiveProgramDisplay.tsx` — Missed workout advisory display
3. `lib/program/master-truth-connection-blueprint.ts` — V.V3 checklist entry

## Files Changed

1. **lib/program/missed-workout-recomposition-advisory.ts**
   - Added `RecoverySpacingPreview` interface
   - Added `buildRecoverySpacingPreview()` pure helper function

2. **components/programs/AdaptiveProgramDisplay.tsx**
   - Added import for `RecoverySpacingPreview` and `buildRecoverySpacingPreview`
   - Added dedicated V.V3 preview UI for `protect_recovery_spacing` action
   - Modified generic missed-workout card to exclude `protect_recovery_spacing`

3. **lib/program/master-truth-connection-blueprint.ts**
   - Updated V.V3 status to COMPLETE
   - Added evidence items
   - Updated Phase V nextAction to point to V.V4

4. **docs/STEP_24_VV3_PROTECT_RECOVERY_SPACING_PREVIEW.md** — This file

## What the Preview UI Displays

When `missedWorkoutAdvisory.action === 'protect_recovery_spacing'`:

1. **Header**: "Recovery Preview" badge + advisory title
2. **Summary**: Recovery spacing summary from advisory
3. **Why This Matters**: Expandable section showing advisory reasoning
4. **Suggested Actions**: Actionable guidance derived from advisory:
   - Add extra rest before demanding sessions
   - Avoid stacking high-stress sessions
   - Review weekly schedule for recovery windows
5. **Limitation Note**: Explains exact session-shift preview requires V.V5
6. **User Recommendation**: Advisory's `userFacingRecommendation`
7. **Action Buttons**: "Got It" and dismiss — both non-mutating

## What It Refuses To Do

- **No program mutation**: Does not modify any session or exercise
- **No saved-program mutation**: Does not call `saveAdaptiveProgram`
- **No live workout mutation**: Does not affect current workout state
- **No storage mutation**: Does not write to localStorage/sessionStorage
- **No route/API mutation**: Makes no network calls
- **No schema mutation**: No database changes
- **No exact session identification**: Does not claim specific sessions will shift (requires V.V5)

## Mutation Boundary Table

| Property | Value |
|----------|-------|
| `canAutoApplyNow` | `false` |
| `savedProgramMutationAllowed` | `false` |
| `liveWorkoutMutationAllowed` | `false` |
| `saveAdaptiveProgram` called | NO |
| `onConfirmMissedWorkoutPushForward` called | NO |
| Route/API mutation | NO |
| Schema mutation | NO |
| localStorage/sessionStorage mutation | NO |

## Truth-to-UI Proof Table

| Stage | Status | Evidence |
|-------|--------|----------|
| Advisory action exists | PASS | `protect_recovery_spacing` in action union |
| Helper derives from truth | PASS | `buildRecoverySpacingPreview` reads advisory.reasoning, evidence, summary |
| Program Page renders preview | PASS | Dedicated V.V3 card with `data-step-24-vv3-recovery-spacing-preview` |
| Generic card excludes action | PASS | `action !== 'protect_recovery_spacing'` condition added |
| No saved-program mutation | PASS | No mutation callbacks, all flags false |
| No live-workout mutation | PASS | No workout state changes |

## Data Markers

The V.V3 preview UI includes these markers for verification:

- `data-step-24-vv3-recovery-spacing-preview="true"`
- `data-advisory-action="protect_recovery_spacing"`
- `data-preview-only="true"`
- `data-no-saved-program-mutation="true"`
- `data-no-live-workout-mutation="true"`

## Final Verdict

**V.V3 COMPLETE**

- Preview-only UI implemented for `protect_recovery_spacing`
- All content derived from advisory truth (no fabrication)
- All mutation flags remain false
- Honest limitation note about exact session preview
- No saved-program, live-workout, or storage mutations
- TypeScript passes
- Build passes

## Next Item

**V.V4 — User-confirmed reduce-intensity mutation corridor**

Phase V remains PARTIAL with V.V4-V.V7 pending.
