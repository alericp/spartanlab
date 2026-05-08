# STEP 24 V.V2 — REDUCE INTENSITY READINESS AUDIT

> **Status:** COMPLETE  
> **Date:** 2026-05-08  
> **Step:** 24.2 (V.V2)  
> **Purpose:** Audit existing reduce_next_session_intensity advisory path, document mutation requirements, define safety bounds

---

## A. EXISTING ADVISORY PATH AUDIT

### 1. Location and Definition

**Source File:** `lib/program/missed-workout-recomposition-advisory.ts`

**Action Type:** `reduce_next_session_intensity` (lines 84, 402-418, 428-445)

**Type Definition (line 81-88):**
```typescript
export type MissedWorkoutRecompositionAction =
  | 'continue_as_planned'
  | 'push_session_forward'
  | 'reduce_next_session_intensity'  // <-- THIS ACTION
  | 'protect_recovery_spacing'
  | 'recommend_regeneration'
  | 'recommend_full_rest'
  | 'insufficient_context'
```

### 2. Trigger Conditions

The `reduce_next_session_intensity` action is returned by `buildMissedWorkoutRecompositionAdvisory()` in two scenarios:

**Scenario A — High Fatigue (lines 398-418):**
- `hasHighFatigue === true` (from `input.hasHighFatigueSignal` or `reason === 'fatigue'`)
- AND next session is NOT high-stress (otherwise `protect_recovery_spacing` is returned)
- Severity: `'caution'`
- Title: "Consider reduced intensity"
- Summary: "Fatigue detected. The next session could be performed at reduced intensity."

**Scenario B — Soreness (lines 423-445):**
- `reason === 'soreness'`
- Severity: `'caution'`
- Title: "Soreness noted"
- Summary: "Soreness was reported. A lighter session may be appropriate when you return."

### 3. Advisory-Only Status

**Current behavior is ADVISORY-ONLY:**
- `canAutoApplyNow: false` (always)
- `savedProgramMutationAllowed: false` (always)
- `liveWorkoutMutationAllowed: false` (always)
- `requiresUserConfirmation: true` (always)
- `nonBlocking: true`

**No mutation occurs.** The advisory is displayed to inform the user, but no program data is changed.

### 4. Display Status

**Displayed:** YES — via AdaptiveProgramDisplay missed workout advisory card (Step 23.2/23.3)

**UI Location:** Program Page → Missed Workout Advisory section

**Display File:** `components/programs/AdaptiveProgramDisplay.tsx` (lines ~1900-2000)

**Display Label:** "Continue with caution" / "Resume with care" (nextStepLabel)

**Related Modal:** `components/programs/ProgramAdjustmentModal.tsx` (line 103: "Reduce Intensity" label exists but is NOT currently actionable for this specific advisory)

### 5. Persistence Status

**Persisted:** NO — The advisory is computed fresh on each page load from:
- `spartanlab_program_state` localStorage
- Session status checks
- Recovery/fatigue signals

**No mutation is persisted** because `savedProgramMutationAllowed: false`.

---

## B. FUTURE MUTATION REQUIREMENTS (FOR V.V4)

If user confirmation is implemented in V.V4, the following requirements must be met:

### 1. Authoritative Source Program Object

- **Source:** `AdaptiveProgram` from `lib/adaptive-program-builder.ts`
- **Storage:** `spartanlab_program_state` localStorage key
- **Loader:** `getProgramState()` from page consumer

### 2. Target Session Selection Rule

- **Primary target:** The next incomplete session after the missed session
- **Selection logic:** `program.sessions.find(s => s.status !== 'completed' && s.sessionIndex > missedSessionIndex)`
- **Validation:** Must exist and must not be a recovery/deload session already

### 3. Intensity Fields That MAY Be Safely Reduced

The following fields can be reduced without breaking program integrity:

| Field | Reduction Strategy | Minimum Safe Value |
|-------|-------------------|-------------------|
| `exercise.targetRPE` | Reduce by 0.5-1.0 | 6.0 |
| `exercise.sets` | Reduce by 1 | 2 sets |
| `exercise.reps` | Reduce by 1-2 | Context-dependent |
| `exercise.load` | Reduce by 5-10% | Bodyweight minimum |
| `session.totalVolume` | Computed (not directly editable) | N/A |
| `session.estimatedDuration` | Computed (not directly editable) | N/A |

### 4. Fields That MUST NOT Be Touched

| Field | Reason |
|-------|--------|
| `exercise.name` | Exercise identity must be preserved |
| `exercise.category` | Training category integrity |
| `exercise.skillId` | Skill exposure tracking |
| `session.sessionIndex` | Session ordering |
| `session.weekNumber` | Program structure |
| `session.dayOfWeek` | Schedule integrity |
| `program.goalSkillIds` | User's selected skills |
| `program.profileSnapshot` | Onboarding truth |
| `program.weeklyRepresentationPolicies` | Skill representation logic |

### 5. Confirmation UI Requirements

- **Step 1:** Display preview showing what will change
- **Step 2:** Explicit "Confirm Reduction" button
- **Cancel:** Must be available at both steps
- **Preview content:** Show affected exercises, before/after values
- **Warning:** "This will modify your saved program"

### 6. Persistence Requirements

- Call `saveAdaptiveProgram(mutatedProgram)` only after user confirmation
- Update `spartanlab_program_state` localStorage
- Refresh Program Page state to reflect changes
- Add provenance marker: `{ mutatedBy: 'reduce_intensity_v4', mutatedAt: ISO_DATE, previousValues: {...} }`

### 7. Reload Proof Requirements

- After mutation, page refresh must show the reduced intensity values
- Computed displays must reflect new values
- No stale cache can override saved mutation

### 8. Rollback/Cancel Behavior

- **Before confirmation:** No mutation — cancel is trivial
- **After confirmation:** Provenance marker allows manual undo if needed
- **No auto-rollback:** User must manually regenerate if they want original values

### 9. Audit/Provenance Fields

Add to session or program metadata:
```typescript
interface IntensityReductionProvenance {
  mutatedBy: 'reduce_intensity_v4'
  mutatedAt: string // ISO date
  reason: MissedWorkoutReason
  affectedSessionIndex: number
  affectedExercises: Array<{
    exerciseId: string
    fieldChanged: string
    previousValue: number
    newValue: number
  }>
}
```

### 10. Safeguards Against Stale Data

- Read fresh program state from localStorage before mutation
- Validate program version/lastModified matches expected
- Reject mutation if stale (force refresh)
- Clear any session-level cache after mutation

---

## C. SAFETY BOUNDS FOR INTENSITY REDUCTION

### Absolute Rules

1. **Never reduce skill exposure to zero silently**
   - If reducing sets would eliminate a skill's exposure, block or warn

2. **Never remove selected-skill representation**
   - weeklyRepresentationPolicies must remain intact
   - Direct/Indirect/Not represented status must survive

3. **Never alter onboarding/profile truth**
   - `program.profileSnapshot` is immutable after generation
   - `canonicalProfile` localStorage is never touched by this action

4. **Never mutate completed history**
   - Only future/incomplete sessions are targets
   - `workoutHistory` is read-only

5. **Never mutate unrelated sessions**
   - Only the specifically targeted next session is modified
   - Multi-session reduction requires V.V6 guardrails

6. **Never reduce below safe minimum useful dosage**
   - Sets: minimum 2
   - RPE: minimum 6.0
   - Load: minimum bodyweight or empty bar

7. **Preserve exercise identity unless substitution logic explicitly owns it**
   - Reduce intensity, not exercise selection
   - Exercise swap is a separate flow (injury-substitution-advisory)

8. **Prefer reducing RPE/load/density/rest pressure before deleting exercises**
   - Reduction hierarchy:
     1. Reduce target RPE
     2. Reduce load percentage
     3. Reduce sets
     4. Reduce reps
     5. (Last resort) Skip exercise — requires additional confirmation

9. **Maintain truth-to-UI explanation when a reduction is applied**
   - Display must show "Intensity reduced due to fatigue" or similar
   - Provenance must be queryable

10. **Require two-step user confirmation before any saved-program mutation**
    - Step 1: Preview
    - Step 2: Confirm
    - No silent mutations

11. **Saved/reloaded program must reflect the same changed truth after mutation**
    - No divergence between saved state and displayed state

12. **Failure must not silently fall back to stale program truth**
    - If mutation fails, display error
    - Do not show old data as if mutation succeeded

---

## D. V.V2 COMPLETION VERDICT

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Audit existing reduce_next_session_intensity advisory path | COMPLETE | Lines 398-418, 423-445 in missed-workout-recomposition-advisory.ts |
| Identify mutation requirements if user confirms | COMPLETE | Section B above (10 requirements documented) |
| Document safety bounds for intensity reduction | COMPLETE | Section C above (12 absolute rules documented) |
| No mutation implemented | VERIFIED | canAutoApplyNow/savedProgramMutationAllowed always false |
| V.V3-V.V7 remain pending | VERIFIED | Not touched by this audit |

---

## E. NEXT OFFICIAL ITEM

**V.V3 — Protect recovery spacing preview-only action**

V.V3 will audit and document the `protect_recovery_spacing` action path using the same structure as this V.V2 audit.

---

## F. FILES REFERENCED

- `lib/program/missed-workout-recomposition-advisory.ts`
- `lib/program/master-truth-connection-blueprint.ts`
- `components/programs/AdaptiveProgramDisplay.tsx`
- `components/programs/ProgramAdjustmentModal.tsx`
- `lib/adaptive-program-builder.ts` (AdaptiveProgram type)
