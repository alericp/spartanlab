# STEP 24 / V.V6 — Multi-Session Push-Forward Mutation Guardrail

## 1. PROGRESS BRIEF

- **Previous prompt:** V.V5 completed protect-recovery-spacing mutation corridor
- **What changed:** V.V6 implements multi-session push-forward mutation guardrail with user-confirmed two-step workflow
- **Are we good to move to V.V7:** YES — V.V6 is complete with typecheck/build passing
- **Exact next issue:** V.V7 — Persistence/reload proof and Phase V closeout

## 2. OFFICIAL CHECKLIST STATUS

| Item | Status |
|------|--------|
| W.W / Step 25 | COMPLETE |
| V.V1 | COMPLETE |
| V.V2 | COMPLETE |
| V.V3 | COMPLETE |
| V.V4 | COMPLETE |
| V.V5 | COMPLETE |
| V.V6 | COMPLETE |
| V.V7 | NOT_STARTED |

## 3. V.V6 ROOT-CAUSE / RISK VERDICT

### What was missing before
- Multi-session push-forward existed only as advisory intent
- No typed mutation helper for multiple sessions simultaneously
- No two-step confirmation UI for multi-session scenarios
- No duplicate-apply guard for V.V6 markers
- No Program Page callback for multi-session push

### What was implemented
- `MultiSessionPushForwardResult` type with status/evidence/session tracking
- `MultiSessionPushForwardInput` type with program/advisory/targetIndices contract
- `MultiSessionPushForwardMutationPreview` type for confirmation UI
- `buildMultiSessionPushForwardMutationPreview()` pure preview builder
- `pushForwardMultiSessionSchedule()` pure mutation helper
- V.V6 UI card in AdaptiveProgramDisplay with full state machine
- `handleConfirmMultiSessionPushForward` callback in Program Page
- Canonical save path through `saveAdaptiveProgram`

### What was intentionally not changed
- No session reordering (conservative approach)
- No date/schedule mutation (uses adaptationNotes markers)
- No exercise changes
- No sets/reps/intensity changes
- No skill representation changes
- No live workout mutation
- No completed history mutation
- No generator changes
- No schema changes

### Implementation approach
**Conservative adaptationNotes marking** was used instead of true session shifting because:
1. AdaptiveSession type safely supports `adaptationNotes: string[]`
2. True schedule shifting would require unsafe field additions
3. Markers provide visible guidance without structural risk
4. Preserves session order and exercise identity
5. Allows future safe expansion if typed schedule fields are added

## 4. FILES INSPECTED

- `lib/program/missed-workout-recomposition-advisory.ts`
- `components/programs/AdaptiveProgramDisplay.tsx`
- `app/(app)/program/page.tsx`
- `lib/program/master-truth-connection-blueprint.ts`
- `lib/adaptive-program-builder.ts` (type verification)
- `docs/STEP_24_VV5_PROTECT_RECOVERY_SPACING_MUTATION_CORRIDOR.md`

## 5. FILES CHANGED

- `lib/program/missed-workout-recomposition-advisory.ts` — Added V.V6 types and helpers
- `components/programs/AdaptiveProgramDisplay.tsx` — Added V.V6 imports, props, state, UI card
- `app/(app)/program/page.tsx` — Added V.V6 import, handler, prop passing
- `lib/program/master-truth-connection-blueprint.ts` — Updated V.V6 status to COMPLETE
- `app/(public)/how-it-works/page.tsx` — Added data-truth explanation feature card
- `docs/STEP_24_VV6_MULTI_SESSION_PUSH_FORWARD_MUTATION_GUARDRAIL.md` — Created

## 6. IMPLEMENTATION SUMMARY

### Helper Names
- `buildMultiSessionPushForwardMutationPreview()` — Pure preview builder
- `pushForwardMultiSessionSchedule()` — Pure mutation helper

### Preview Builder
Returns `MultiSessionPushForwardMutationPreview` with:
- `canShow`, `canConfirm` flags
- `targetSessions` with index, label, alreadyMarked
- `whatWillChange[]`, `whatWillNotChange[]`, `safetyNotes[]`
- `unavailableReason` if blocked

### Mutation Helper
- Input: `{ program, advisory, targetSessionIndices }`
- Output: `MultiSessionPushForwardResult` with updatedProgram
- Requires minimum 2 targets (multi-session threshold)
- Uses `[V.V6:multi_session_push_forward:<timestamp>]` marker prefix
- Returns `already_applied` if all targets have markers

### UI State Machine
States: `idle | confirming | applying | applied | failed | already_applied`

### Program Page Callback
`handleConfirmMultiSessionPushForward(advisory, targetSessionIndices)`
- Calls `pushForwardMultiSessionSchedule()` pure helper
- Early returns if blocked/already_applied/no_change
- Saves via `saveAdaptiveProgram` (canonical path)
- Updates state via `onProgramUpdate`

### Save Path
Single canonical path: `saveAdaptiveProgram` from `@/lib/adaptive-program-builder`

### Duplicate Guard
- Checks `adaptationNotes` for `[V.V6:multi_session_push_forward:` prefix
- If all targets marked: returns `already_applied`
- If some marked: applies only to unmarked, returns `partial_already_applied`

### No-Live-Workout-Mutation Proof
- `liveWorkoutMutationAllowed: false` in all result types
- `data-no-live-workout-mutation="true"` on UI card
- No workout reducer touched
- No current session modified

## 7. TRUTH-TO-UI PROOF TABLE

| Requirement | Status |
|-------------|--------|
| Advisory detected | YES — triggers on `push_session_forward` or `recommend_regeneration` |
| Preview built | YES — `buildMultiSessionPushForwardMutationPreview()` |
| Confirmation shown | YES — confirming state shows preview with targets/changes |
| Mutation applied only after confirmation | YES — requires two clicks |
| Saved through canonical path | YES — `saveAdaptiveProgram` |
| Program Page state updated | YES — `onProgramUpdate(savedProgram)` |
| Reload expectation preserved | YES — markers persist in adaptationNotes |
| UI visible proof | YES — applied state shows success summary |
| V.V4/V.V5 preserved | YES — separate UI cards, no conflict |

## 8. NO-BREAKAGE TABLE

| Check | Result |
|-------|--------|
| No generator changes | PASS |
| No schema changes | PASS |
| No package changes | PASS |
| No live workout mutation | PASS |
| No completed history mutation | PASS |
| No selected-skill representation loss | PASS |
| No warm-up/cool-down deletion | PASS |
| No untyped AdaptiveProgram fields | PASS |
| No untyped AdaptiveSession fields | PASS |
| No TypeScript suppressions | PASS |

## 9. BUILD RESULTS

- **tsc:** PASS
- **build:** PASS

## 10. FINAL VERDICT

**PASS** — V.V6 complete. Multi-session push-forward mutation guardrail implemented with:
- Pure helpers for preview and mutation
- Two-step user confirmation UI
- Canonical save path through saveAdaptiveProgram
- Duplicate-apply guard via adaptationNotes markers
- Conservative approach preserving session structure
- No live workout mutation
- V.V4/V.V5 corridors preserved

Safe to move to V.V7 — Persistence/reload proof and Phase V closeout.
