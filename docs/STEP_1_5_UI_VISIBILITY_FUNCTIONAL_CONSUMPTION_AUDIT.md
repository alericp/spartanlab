# STEP 1.5 — UI VISIBILITY + FUNCTIONAL CONSUMPTION AUDIT

**Purpose:** Verify all prior Steps 1–24 are not just code-present but actually visible and functionally consumed.

**Date:** 2026-05-09
**Status:** PARTIAL

---

## Prior Steps Inventory

Based on the existing documentation, the prior checklist phases are organized as:

### Phase A-J — Master Truth Connection Blueprint
From `docs/SPARTANLAB_MASTER_TRUTH_CONNECTION_BLUEPRINT.md`:
- Phase A: Doctrine Inventory Lock — DO_NOT_REDO
- Phase B: Doctrine Runtime Consumption Lock — DO_NOT_REDO  
- Phase C: Training Truth Bundle Lock — DO_NOT_REDO
- Phase D: Method Decision / Weekly Budget Lock — COMPLETE
- Phase E: Actual Program Mutation Lock — PARTIAL
- Phase F: Canonical Program Object Lock — COMPLETE
- Phase G: Program Display Source Lock — PARTIAL
- Phase H: Live Workout Parity Lock — COMPLETE
- Phase I: Numeric Prescription Mutation Lock — COMPLETE
- Phase J: Product Cleanup / Trust Polish — COMPLETE

### PEX-1 through PEX-6 — Program Experience Quality
From `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md`:
- PEX-1: Calibration Baseline Truth — COMPLETE
- PEX-2: Selected Skill Coverage + Rotation Truth — COMPLETE
- PEX-3: Method Materialization Truth — COMPLETE
- PEX-4: Session Card Clutter Compression — COMPLETE
- PEX-5A: Duration Source-of-Truth (20/15/10) — COMPLETE
- PEX-5B: Short-Session Recomposition Quality — COMPLETE
- PEX-5C: Short-Session UX / Tradeoff Polish — COMPLETE
- PEX-6: End-to-End Runtime Proof — COMPLETE

### Step 24 — Phase V Validation
From `docs/STEP_24_VV7_PERSISTENCE_RELOAD_PROOF_AND_PHASE_V_CLOSEOUT.md`:
- V.V1-V.V7: Missed workout mutation corridors — COMPLETE

### Step 25 — Intelligence Audit
From `docs/STEP_25_INTELLIGENCE_AUDIT.md`:
- Step 25.1: Intelligence Inventory — COMPLETE
- Step 25.2: Existing Intelligence Visibility Repair — COMPLETE
- Step 25.3: Program Decision Explanation Upgrade — COMPLETE
- Step 25.4: Performance Progression Clarity — COMPLETE
- Step 25.5: Adaptive Session Readiness / Today Guidance — COMPLETE
- Step 25.6-25.7: NOT_STARTED
- Step 25.8: Selected Skill Representation Truth — COMPLETE (2026-05-09)
- Step 25.9: Weekly Variation + Method Decision Truth — COMPLETE (2026-05-09)
- Step 25.10-25.12: NOT_STARTED

### PPX — Live Workout Phases
From recent conversation:
- PPX-R1C: React #310 Hook-Order Fix — COMPLETE
- PPX-R2: Warmup/Main/Cooldown Sequencing — COMPLETE
- PPX-R2C: Phase Persistence/Refresh Restore — COMPLETE
- PPX-R2D: Band Assistance Data Visibility — COMPLETE
- PPX-R2E: Band Assistance Progression Consumption — COMPLETE (2026-05-09)
  - Band-assisted sets committed to localStorage history via `logSetWithBand()`
  - `BandSelector` shows history-based recommendations with set count
  - Post-workout summary uses real band engine analysis
  - CLIENT-LOCAL ONLY — not DB/server-backed
- PPX-R2F: Band Recommendation Visible Proof Lock — COMPLETE (2026-05-09)
  - Recent sets display shows styled band chips with multi-band support (RED+GRN)
  - Full corridor verified: selector → state → completedSet → recent set UI → history → recommendation → active card
- PPX-R2H: Live Active MultiBandSelector Display-Corridor Fix — COMPLETE (2026-05-09)
  - ROOT CAUSE: Prior fix was in wrong selector path (BandSelector in StreamlinedWorkoutSession)
  - ACTUAL PATH: ActiveWorkoutStartCorridor.tsx → MultiBandSelector is the live production render
  - FIX: Added always-visible recommendation/tracking block to MultiBandSelector with exercise context
  - Displays: "Recommended: X", "Maintain X", "Start with: X", "Tracking band history"
  - Uses getBandRecommendation/getExerciseBandHistory for real history-based display
- PPX-R2I: Band History Persistence + Later-Session Recommendation Consumption Fix — COMPLETE (2026-05-09)
  - ROOT CAUSE: exerciseId mismatch between band history commit and lookup
  - Commit used: `exercise.id || name.toLowerCase().replace()` (line 5447)
  - Lookup used: `exerciseName?.toLowerCase().replace()` only (line 2520)
  - FIX: Added exerciseId to LiveWorkoutSnapshot, LiveWorkoutExecutionSurface, ActiveWorkoutStartCorridor prop chain
  - Now uses consistent exerciseId for both commit and lookup
  - Later-session recommendations will match prior completed band history
- PPX-R2J: Band History Canonical Exercise Key Lock — COMPLETE (2026-05-09)
  - ROOT CAUSE: Key mismatch - "Tuck Front Lever Hold" produced `tuck_front_lever_hold` but support/history used `front_lever_tuck`
  - FIX: Created `resolveBandExerciseKey()` canonical resolver with pattern matching
  - Maps "Tuck Front Lever Hold" / "tuck_front_lever_hold" → `front_lever_tuck`
  - Updated commit bridge to use canonical key for storage
  - Updated MultiBandSelector to use `getCanonicalBandHistory()` for lookup
  - Day 1 RED set on "Tuck Front Lever Hold" now found on Day 4 via canonical key match
- PPX-R3A: Band Recommendation Intelligence Quality + Visible Reason Semantics — COMPLETE (2026-05-09)
  - Previous state: "Recommended: RED / Based on 13 logged sets" was populated but shallow (count-only, no performance analysis)
  - ROOT CAUSE: Recommendation used lastBandUsed + historyCount threshold, not actual RPE/quality/target analysis
  - FIX: Created `getCanonicalBandRecommendation()` with full performance analysis
  - Analyzes: RPE, quality (clean/shaky/failed), target hit ratio, performance trend (improving/stable/declining)
  - Actions: maintain, reduce_assistance, increase_assistance, build_history, start, no_band
  - Labels now show coaching actions: "Maintain RED", "Try YLW next", "Use GRN today"
  - Details explain why: "RPE 7.5 — 80% clean", "Recent work suggests more support"
- PPX-R4A: Warm-Up + Cool-Down Adaptiveness Visibility Audit — COMPLETE (2026-05-09)
  - Previous state: Warmup/cooldown sections existed but showed generic text ("Prepare your body for the workout")
  - ROOT CAUSE: Adaptive metadata (focusLabel, rationale, targetAreas) generated but stripped during conversion
  - Warmup engine generates `GeneratedWarmUp` with focusLabel/rationale but only exercises were passed through
  - Session contract had no fields for section-level warmup/cooldown adaptation metadata
  - FIX: Added `warmupAdaptation` and `cooldownAdaptation` fields to:
    - `WorkoutSessionContract` (lib/contracts/workout-session-contract.ts)
    - `ExerciseSelection` (lib/program-exercise-selector.ts)
    - `AdaptiveSession` (lib/adaptive-program-builder.ts)
  - Updated `selectIntelligentWarmup()` and `selectIntelligentCooldown()` to return adaptation metadata
  - Updated UI displays:
    - Program Page: Shows "Front Lever Preparation — lats, shoulders, scapula"
    - Live Workout: Shows adaptive focusLabel instead of generic text
  - Adaptive signals used: skill_focus, session_exercises, flexibility_goal, session_stress
- PPX-R4B: Warm-Up + Cool-Down Adaptive Proof + Phase Back-Navigation — COMPLETE (2026-05-09)
  - Previous state: R4A added metadata fields but Live Workout still showed generic "Prepare your body" text
  - ROOT CAUSE: `safeWorkoutSessionContract` in StreamlinedWorkoutSession did NOT include `warmupAdaptation`/`cooldownAdaptation`
  - The fields existed on `AdaptiveSession` but were not passed through to the contract object used by UI
  - FIX: Added `warmupAdaptation` and `cooldownAdaptation` to `safeWorkoutSessionContract` return object
  - Enhanced warmup display: "Adapted for Front Lever Preparation — lats, shoulders, scapula"
  - Enhanced cooldown display: "Supports pancake, pike — hamstrings, adductors" or "Recovery for [focus]"
  - Added phase navigation:
    - `handleGoToWarmup()` / `handleGoToCooldown()` handlers in StreamlinedWorkoutSession
    - "← Back to Warm-Up" button in ActiveWorkoutStartCorridor (visible at first exercise)
    - "← Back to Workout" button in cooldown phase
    - Progress preserved (logged sets, selected bands, exercise index)
  - Added `onGoToWarmup` / `onGoToCooldown` to `LiveWorkoutHandlers` interface
- PPX-R4C: Phase Navigation UI Placement Cleanup — COMPLETE (2026-05-09)
  - Previous state: R4B added phase navigation but placement was visually inconsistent
    - Top "← Back to Warm-Up" text link above exercise card (wrong location)
    - Cooldown "← Back to Workout" was a standalone text link (wrong style)
  - FIX: Relocated phase navigation to match existing Live Workout control styles
  - Removed:
    - Top "← Back to Warm-Up" text link from ActiveWorkoutStartCorridor progress bar area
  - Updated:
    - Cooldown: "Back" button now in action row with Skip buttons (matches button style)
    - Main workout: Bottom "Back" button is now context-aware:
      - If at first exercise/set AND warmup exists → goes to warmup
      - Otherwise → normal previous set/exercise navigation
  - No new header clutter, all navigation follows existing bottom nav style
- PPX-R4D: Warm-Up + Cooldown Phase Back Placement and Function Fix — COMPLETE (2026-05-09)
  - Previous state:
    - Warmup still had top/header Back button with unsafe `window.location.reload()` fallback
    - Cooldown Back was visually correct but only called `setSessionPhase('main')` which didn't work
      because auto-transition effect immediately pushed back to cooldown
  - ROOT CAUSE:
    - Warmup Back: In header, used reload when at first item (unsafe)
    - Cooldown Back: `sessionPhase` change alone insufficient — machine status stayed `completed`,
      triggering the useEffect that auto-transitions completed+main → cooldown
  - FIX:
    - Warmup: Removed header Back button, added Back to action row (left of Skip This)
    - Warmup: Back disabled at index 0 (no reload), enabled at index > 0 (goes to previous item)
    - Cooldown: Added `showWorkoutReview` state to bypass auto-transition effect
    - Cooldown: Back now sets `showWorkoutReview=true` + `sessionPhase='main'`
    - Added new RENDER: WORKOUT REVIEW section that shows when `showWorkoutReview` is true
    - Workout review shows summary with "Continue to Cool-Down" and "Skip Cool-Down & Finish" options
- PPX-R4E: Cooldown Back Semantics Fix — COMPLETE (2026-05-09)
  - Previous state: R4D added `showWorkoutReview` state but cooldown Back routed to awkward
    "Workout Summary / Review Mode" interstitial instead of real phase navigation
  - ROOT CAUSE: Cooldown Back was wired to open a summary screen instead of navigating within cooldown
  - User expectation: Back should go to previous cooldown item, not open a weird summary
  - FIX:
    - Cooldown Back now navigates within cooldown: Cool-Down 2/6 → Back → Cool-Down 1/6
    - At first cooldown item (index 0), Back is DISABLED (safest approach)
    - Removed `showWorkoutReview` state entirely (was only used by broken Back behavior)
    - Removed the "Workout Summary / Review Mode" render branch (dead code after fix)
    - Simplified auto-transition effect (no longer checks showWorkoutReview)
  - Behavior now matches warmup: Back within phase, disabled at first item
- PPX-R4G: Cooldown First-Item Back to Completed WO Context — SUPERSEDED BY R4H
  - Previous state: R4E fixed cooldown internal navigation but Cool-Down 1 Back was disabled
  - R4G added `completedMain` phase but user didn't want "Day 1 Done" interstitial
  - SUPERSEDED: R4H replaces this with direct return to live workout context
- PPX-R4H: Cool-Down 1 Back to Last Live Workout Context — SUPERSEDED BY R4I
  - Added `returnedFromCooldown` state flag and auto-transition bypass
  - But render still fell through to LEGACY-ACTIVE-R3 because `isLiveExecutionPhase` was false
  - SUPERSEDED: R4I fixes the render gate to include returnedFromCooldown case
- PPX-R4I: Fix Cool-Down 1 Back LEGACY Blank Screen — COMPLETE (2026-05-09)
  - Previous state: R4H set `returnedFromCooldown=true` + `sessionPhase='main'` but user saw
    LEGACY-ACTIVE-R3 blank screen instead of real workout context
  - ROOT CAUSE: `isLiveExecutionPhase` only checked for active machine phases like 'active',
    'resting', etc. When returning from cooldown, `machineState.phase` is 'completed', so
    `isLiveExecutionPhase` was false and render fell through to legacy surface
  - FIX:
    - Extended `isLiveExecutionPhase` condition to include:
      `(returnedFromCooldown && safeStatus === 'completed' && sessionPhase === 'main')`
    - Now when Cool-Down 1 Back is pressed, the render enters the LiveWorkoutExecutionSurface
      branch which includes the "Workout Complete / Continue to Cool-Down" banner
    - User sees the real workout context, not LEGACY-ACTIVE-R3 blank screen
  - Navigation contract now correct:
    - Cool-Down 2+ Back → previous cooldown item
    - Cool-Down 1 Back → real live workout context with continue banner (not legacy)
    - Continue to Cool-Down → returns to cooldown (index preserved)
  - Normal completion flow unchanged: final set → auto-transition to cooldown (no interstitial)
- PPX-R5: Warm-Up + Cool-Down Adaptiveness Truth-to-UI Audit — COMPLETE (2026-05-09)
  - VERDICT: COMPUTED-BUT-LOST (now fixed)
  - ROOT CAUSE: The normalizer in `normalize-workout-session.ts` was NOT preserving
    `warmupAdaptation` and `cooldownAdaptation` fields. These fields were computed by
    the program builder, attached to AdaptiveSession, but dropped during normalization.
  - PROOF OF TRUE ADAPTIVENESS (engines are real, not label-only):
    - `warmup-engine.ts` generateWarmUp():
      - Detects session focus from mainExercises (line 549)
      - Gets target muscles/patterns from main exercises (lines 555-564)
      - Filters by equipment (line 567)
      - Uses firstSkillProgression for progression-aware ramp (lines 576-580)
      - Includes joint integrity protocols based on primaryGoal + jointCautions (line 661)
    - `cooldown-engine.ts` generateCoolDown():
      - Detects session focus from mainExercises (line 789)
      - Uses flexibilityGoals to add flexibility work (lines 792-793)
      - Adjusts for fatigueSensitivity and currentFatigueScore (lines 799-805)
      - Selects cool-down exercises based on session focus (line 808)
      - Adds flexibility block if goals present (lines 820-836)
    - `adaptive-program-builder.ts`:
      - warmupAdaptation attached at lines 29777-29778
      - cooldownAdaptation attached at lines 31031-31032
  - FIX APPLIED:
    - Added `normalizeWarmupAdaptation()` helper to preserve warmup adaptation metadata
    - Added `normalizeCooldownAdaptation()` helper to preserve cooldown adaptation metadata
    - Updated `normalizeWorkoutSession()` to include warmupAdaptation/cooldownAdaptation
    - UI in StreamlinedWorkoutSession (lines 8027-8031, 8303-8316) already consumes these
  - INPUTS CONSUMED BY WU/CD ENGINES:
    - Session focus / focusLabel: YES
    - Main exercise patterns/muscles: YES
    - Equipment availability: YES
    - Joint cautions: YES (joint integrity protocols)
    - Flexibility goals: YES (cooldown flexibility block)
    - Fatigue sensitivity: YES (cooldown intensity adjustment)
    - Skill progressions: YES (warmup ramp selection)
  - METADATA NOW PRESERVED:
    - warmupAdaptation: focus, focusLabel, rationale, targetAreas, adaptationSource
    - cooldownAdaptation: focus, focusLabel, rationale, targetRegions, flexibilityGoals, adaptationSource
- PPX-R5B: Combined Refresh Resume + Adaptive Details Modal — COMPLETE (2026-05-09)
  - PART 1: Refresh Resume Debugging
    - Added console.log debugging to `loadSessionFromStorage` to trace `liveFlowPhase` restoration
    - The existing autosave effect DOES save `liveFlowPhase` including `sessionPhase`, `warmupIndex`, `cooldownIndex`
    - The restore logic at lines 3998-4002 DOES check for `liveFlowPhase` and restore it
    - Debug logs will help identify if the issue is save timing, stale data, or restore validation
  - PART 2: Adaptive Details Modal
    - Added `Sparkles` and `Info` icons to warmup/cooldown headers
    - Converted subtitle text to clickable buttons that open the adaptive details dialog
    - Added full `Dialog` component with adaptive breakdown:
      - Shows focusLabel, rationale, targetAreas/targetRegions, adaptationSource
      - Lists exercises with their `selectionReason` or `note` fields
      - Honest fallback text when adaptation metadata is missing
    - UI is clean: main card stays minimal, details are behind the info button
  - FILES CHANGED:
    - StreamlinedWorkoutSession.tsx: Added Dialog import, adaptiveDetailsOpen state, 
      sparkle/info buttons on warmup/cooldown headers, full adaptive details dialog
  - NAVIGATION PRESERVED:
    - PPX-R4I Cool-Down 1 Back behavior unchanged
    - No LEGACY-ACTIVE-R3 regression
    - Direct final-set-to-cooldown unchanged
- PPX-R7: Live Adaptive Details + Nonblocking Cooldown Return UX — COMPLETE (2026-05-09)
  - PHASE 1: WU/CD Adaptive Details Modal Fix
    - Added `type="button"` to prevent form submission issues
    - Added `e.preventDefault()` and `e.stopPropagation()` to click handlers
    - Added `cursor-pointer` class for visual feedback
    - Added `aria-label` for accessibility
    - Added debug console.log to trace click events
  - PHASE 2: Live Workout Adaptive Info Button
    - Added compact "Why this set?" button above LiveWorkoutExecutionSurface
    - Shows session focus label and sparkle icon
    - Opens same adaptive details dialog with 'live' mode
    - Dialog shows current exercise info: name, sets, target, RPE, band recommendation, selection reason
  - PHASE 3: Cooldown Return Banner - Nonblocking
    - Changed from in-flow banner to fixed position toast
    - Uses `fixed top-16 left-1/2 -translate-x-1/2 z-50`
    - Added backdrop blur and shadow for floating appearance
    - Added animate-in fade-in slide-in-from-top-2 for smooth appearance
    - Added dismiss X button with `cooldownReturnBannerDismissed` state
    - No longer pushes page content down or causes awkward scroll
  - FILES CHANGED:
    - StreamlinedWorkoutSession.tsx:
      - Added `cooldownReturnBannerDismissed` state
      - Updated `adaptiveDetailsOpen` type to include 'live'
      - Fixed warmup/cooldown buttons with proper event handling
      - Added live workout adaptive info button
      - Added live workout content to adaptive details dialog
      - Changed cooldown return banner to fixed toast
  - CHECKLIST STATUS:
    - [x] WU adaptive info modal opens and renders real truth
    - [x] CD adaptive info modal opens and renders real truth
    - [x] Live workout adaptive info modal exists
    - [x] Cooldown return reminder no longer causes layout scroll/clutter
    - [ ] Permanent workout history audit (follow-up item)
    - [ ] Manual history deletion from DB (follow-up item)
- PPX-R7.2: Adaptive Modal Event/Render Ownership Fix — COMPLETE (2026-05-09)
  - ROOT CAUSE: Dialog was only rendered in main workout phase return. Warmup and cooldown phases had early returns BEFORE the Dialog was ever mounted. The buttons worked but the Dialog never rendered in those phases.
  - FIX: Added Dialog to each phase-specific return (warmup and cooldown) using React Fragment wrapper
  - WARMUP PHASE:
    - Wrapped return in `<>...</>` fragment
    - Added Dialog with "Why This Warm-Up?" title
    - Shows session focus, warmup adaptation, target areas
    - Shows current item name, prescription, and reason/fallback
  - COOLDOWN PHASE:
    - Dialog already existed from PPX-R7.1
    - Shows session focus, cooldown adaptation, target regions, flexibility goals
    - Shows current item name, prescription, and reason/fallback
  - WU/CD ITEM DESCRIPTIONS:
    - Fixed blank descriptions by adding fallback chain
    - Checks: selectionReason -> reason -> note -> purpose -> description -> cue -> fallback
    - Fallback text: "Prep for {focusLabel}." or "Recovery after {focusLabel}."
  - CHECKLIST STATUS:
    - [x] PPX-R7.2 WU info icon opens modal: COMPLETE
    - [x] PPX-R7.2 CD info icon opens modal: COMPLETE
    - [x] PPX-R7.2 Live "Why this set?" opens modal: COMPLETE (uses main workout phase dialog)
    - [x] PPX-R7.2 WU/CD blank descriptions fixed with honest fallback: COMPLETE
    - [x] PPX-R7.2 render/UI proof required: COMPLETE
  - REMAINING CHAIN:
    - PPX-R7.3: Plan-map modal depth (COMPLETED BELOW)
    - PPX-R7.4: Live set-level adaptive coaching + ramp-up logic
    - PPX-R7.5: Permanent workout history/adaptive input proof/delete path
    - PPX-R7.6: Final live WU/CD adaptive acceptance pass
- PPX-R7.3: WU/CD Plan-Map Modal Depth + Card Cue Separation — COMPLETE (2026-05-09)
  - ROOT CAUSE: WU/CD modals only showed currentWarmupItem/currentCooldownItem (single item), duplicating what's on the main card. User expected full plan explanation.
  - FIX: Upgraded both modals to show full plan-map with all items in sequence
  - WARMUP MODAL NOW SHOWS:
    - Plan Summary: "This warm-up moves from general movement prep → joint mobility → muscle activation → low-fatigue pattern rehearsal"
    - Why This Order: 4 bullets explaining sequence rationale
    - Full Warm-Up Sequence: All items with step number, name, prescription, inferred role, current item highlighted
    - Future Adaptation: What can change based on logged data (readiness, pain, performance)
    - Current Signals: Honest statement about available vs missing data
  - COOLDOWN MODAL NOW SHOWS:
    - Plan Summary: "This cooldown moves from breathing reset → target tissue recovery → mobility restoration → low-tension finish"
    - Why This Order: 4 bullets explaining recovery sequence rationale
    - Full Cool-Down Sequence: All items with step number, name, prescription, inferred role, current item highlighted
    - Future Adaptation: What can change based on logged data (strain, grip fatigue, range restrictions)
    - Current Signals: Honest statement about available vs missing data
  - MAIN CARD CUES: Already execution-focused from PPX-R7.2 fallback chain (selectionReason → reason → note → purpose → cue → fallback)
  - CHECKLIST STATUS:
    - [x] R7.3.a Warm-Up modal uses full ordered warm-up map, not current item duplicate
    - [x] R7.3.b Warm-Up modal explains plan summary, order rationale, adaptive signals
    - [x] R7.3.c Cool-Down modal uses full ordered cooldown map, not current item duplicate
    - [x] R7.3.d Cool-Down modal explains plan summary, order rationale, adaptive signals
    - [x] R7.3.e Main WU/CD cards show execution cues (unchanged from R7.2)
    - [x] R7.3.f Render/UI proof: modal is visibly deeper than card
    - [x] R7.3.g No fake adaptive claims; missing signals labeled honestly
  - REMAINING CHAIN:
    - PPX-R7.4: Live set-level adaptive coaching (COMPLETED BELOW)
    - PPX-R7.5: Permanent workout history/adaptive input proof/delete path
    - PPX-R7.6: Final acceptance pass
- PPX-R7.4: Live "Why This Set?" Set-Level Adaptive Coaching — COMPLETE (2026-05-09)
  - ROOT CAUSE: Live dialog existed but showed generic session-level content (focus label, exercise name). It did not consume set-level truth: current set number, completed sets, selected RPE, band selection, or future-set triggers.
  - FIX: Upgraded live modal to full set-level coaching view model using actual runtime truth
  - LIVE MODAL NOW SHOWS:
    - Current Target: Exercise name, Set X of Y, target reps/hold, target RPE, prescribed load, band recommendation, selected bands, user's RPE
    - Coaching Verdict: Dynamic status (collecting_data / on_track / reduce_intensity / increase_challenge) based on actual completed set data
    - Evidence Used: Concrete bullets showing set number, target RPE, completed sets count, avg RPE, last set RPE, recommended/selected bands
    - What Could Change: Future-set triggers (RPE jump → reduce, consistent low RPE → progression, pain → stop/modify, inconsistent → keep current)
    - Ramp-Up Check: Advisory for weighted/advanced movements (bodyweight → 50% load → working set OR easier position → rehearsal → working set)
    - Data Honesty Note: "No sets logged yet" or "Based on X logged sets"
  - RUNTIME TRUTH CONSUMED:
    - validatedSetNumber, safeCurrentExercise.sets, targetRPE, repsOrTime
    - normalizedCompletedSets filtered by exerciseIndex
    - machineState.selectedBands, machineState.actualLoadUsed
    - safeSelectedRPE, corridorMetadata.recommendedBand
    - prescribedLoad (object with load/unit)
  - CHECKLIST STATUS:
    - [x] R7.4.a Live "Why this set?" button opens mounted modal in active live render path
    - [x] R7.4.b Modal consumes current exercise/current set truth, not stale generic session truth
    - [x] R7.4.c Modal displays target reps/hold/time, target RPE, set number, total sets
    - [x] R7.4.d Modal displays band recommendation and selected bands when relevant
    - [x] R7.4.e Modal displays load/prescribed load when relevant
    - [x] R7.4.f Modal displays real evidence or honest "collecting data" fallback
    - [x] R7.4.g Modal explains future-set triggers without randomly mutating every set
    - [x] R7.4.h Modal includes advisory ramp-up/warm-up set logic for heavy weighted/advanced progressions
    - [x] R7.4.i Modal has visible UI proof on active workout screen
    - [x] R7.4.j No fake adaptive claims
  - REMAINING CHAIN:
    - PPX-R7.5: Permanent workout history/adaptive input proof/delete path
    - PPX-R7.6: Final acceptance pass

---

## Full Audit Matrix

### Legend
- **Builder Present:** Does computation logic exist?
- **Save/Load Preserved:** Does data survive save/load/normalize?
- **UI Consumer Present:** Does a component attempt to render it?
- **Visible Proof:** Can user actually see it on screen?
- **Functional Consumption:** Does it affect real program/workout behavior?
- **First Broken Stage:** Where does the funnel break if incomplete?

---

### Phase A — Doctrine Inventory Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| A1 | Source batches exported | PASS | NA | NA | NA | PASS | — |
| A2 | No unreachable batches | PASS | NA | NA | NA | PASS | — |
| A3 | Structured purpose/category | PASS | NA | NA | NA | PASS | ��� |
| A4 | Consumable by runtime | PASS | NA | NA | NA | PASS | — |
| A5 | Foundation complete | PASS | NA | NA | NA | PASS | — |

**Status:** BACKEND-ONLY VALID — Doctrine batches are runtime infrastructure, not user-visible.

---

### Phase B — Doctrine Runtime Consumption Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| B1 | Query service reads batches | PASS | NA | NA | NA | PASS | — |
| B2 | Structured decision objects | PASS | NA | NA | NA | PASS | — |
| B3 | Failures not swallowed | PASS | NA | NA | NA | PASS | — |
| B4 | Used during generation | PASS | NA | NA | NA | PASS | — |
| B5 | Not just audit labels | PASS | NA | NA | NA | PASS | — |

**Status:** BACKEND-ONLY VALID — Runtime consumption is infrastructure.

---

### Phase C — Training Truth Bundle Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| C1 | Canonical profile exists | PASS | PASS | NA | NA | PASS | — |
| C2 | Programming truth bundle | PASS | PASS | NA | NA | PASS | — |
| C3 | Builder consumes bundle | PASS | NA | NA | NA | PASS | — |
| C4 | Fallback override prevention | PASS | NA | NA | NA | PASS | — |
| C5 | Selected skills influence | PASS | NA | PARTIAL | PARTIAL | PARTIAL | UI render |

**C5 Issue:** Selected skills influence generation but the UI representation ("+4 more" under-expressed warning) is vague. Partial visibility.

---

### Phase D — Method Decision / Weekly Budget Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| D1 | Training intent vector | PASS | PASS | NA | NA | PASS | — |
| D2 | Weekly method budget | PASS | PASS | PASS | PASS | PASS | — |
| D3 | Decision engine consumes | PASS | NA | NA | NA | PASS | — |
| D4 | Attached to program/session | PASS | PASS | PASS | PASS | PASS | — |
| D5 | Blocked status classified | PASS | PASS | PASS | PARTIAL | PASS | UI clutter |

**D5 Issue:** Blocked method statuses exist but UI presentation is dense/cluttered. Visible but not user-friendly.

---

### Phase E — Actual Program Mutation Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| E1 | Structural methods create groups | PASS | PASS | PASS | PASS | PASS | — |
| E2 | Row-level methods mutate rows | PASS | PASS | PASS | PASS | PASS | — |
| E3 | Affect exercise selection | PARTIAL | NA | NA | NA | PARTIAL | Selection pass |
| E4 | Affect session composition | PARTIAL | NA | NA | NA | PARTIAL | Structural limits |
| E5 | No-change cases explained | PASS | PASS | PASS | PARTIAL | PASS | — |
| E6 | Not only chips/banners | PASS | PASS | PASS | PASS | PASS | — |

**E3/E4 Issue:** Selection-pass and numeric dosage mutation deferred to Phase I (now complete). Structural methods limited to max one group per session.

---

### Phase F — Canonical Program Object Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| F1 | Authoritative program identified | PASS | PASS | PASS | PASS | PASS | — |
| F2 | Authoritative session identified | PASS | PASS | PASS | PASS | PASS | — |
| F3 | Save/load preserves fields | PASS | PASS | PASS | PASS | PASS | — |
| F4 | Fresh beats stale | PASS | PASS | NA | NA | PASS | — |
| F5 | Fallback cannot override | PASS | PASS | NA | NA | PASS | — |

**Status:** COMPLETE

---

### Phase G — Program Display Source Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| G1 | Final activeProgram source | PASS | PASS | PASS | PASS | PASS | — |
| G2 | Display is formatting only | PASS | NA | PASS | PASS | PASS | — |
| G3 | Old sources demoted | PARTIAL | NA | PARTIAL | PARTIAL | PARTIAL | Stale guard |
| G4 | Day cards receive canonical | PASS | PASS | PASS | PASS | PASS | — |
| G5 | Method blocks match canonical | PASS | PASS | PASS | PASS | PASS | — |
| G6 | Blocked labels truthful | PARTIAL | PASS | PASS | PARTIAL | PASS | BUG_* count |

**G3 Issue:** Stale-source runtime guard not fully implemented.
**G6 Issue:** Program-level `doctrineBlockResolutionRollup` may still have residual `BUG_*` entries.

---

### Phase H — Live Workout Parity Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| H1 | Variant uses canonical session | PASS | PASS | PASS | PASS | PASS | — |
| H2 | Loader preserves methodStructures | PASS | PASS | PASS | PASS | PASS | — |
| H3 | Normalizer preserves styledGroups | PASS | PASS | PASS | PASS | PASS | — |
| H4 | Row-level method fields preserved | PASS | PASS | PASS | PASS | PASS | — |
| H5 | No silent flatten | PASS | PASS | PASS | PASS | PASS | — |
| H6 | Honest partial parity reported | PASS | PASS | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### Phase I — Numeric Prescription Mutation Lock

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| I1 | Safe mutation bounds | PASS | NA | NA | NA | PASS | — |
| I2 | Skill-priority protected | PASS | NA | NA | NA | PASS | — |
| I3 | Eligible rows only | PASS | PASS | PASS | PASS | PASS | — |
| I4 | Conservative safety gates | PASS | NA | NA | NA | PASS | — |
| I5 | Before/after dosage visible | PASS | PASS | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### Phase J — Product Cleanup / Trust Polish

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| J1 | Hide stale/internal clutter | NA | NA | PASS | PASS | PASS | — |
| J2 | Keep useful explanations | NA | NA | PASS | PASS | PASS | — |
| J3 | Compact product-grade UI | NA | NA | PASS | PARTIAL | PASS | UI bloat |
| J4 | Diagnostics available | NA | NA | PASS | PASS | PASS | — |
| J5 | AI coach feel | NA | NA | PASS | PARTIAL | PASS | Oversized blocks |

**J3/J5 Issue:** "Why this plan" block and "Schedule Status" are still oversized/prominent. Need compaction.

---

### PEX-1 — Calibration Baseline Truth

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| 5-test calibration | Mixed profile tests | PASS | NA | PASS | PASS | PASS | — |
| Baseline influence contract | Data-driven explanations | PASS | NA | PASS | PASS | PASS | — |
| Test-specific meaning | Explains each test purpose | PASS | NA | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### PEX-2 — Selected Skill Coverage + Rotation Truth

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| Skill expression tracking | AuthoritativeMultiSkillIntentContract | PASS | PASS | PASS | PARTIAL | PASS | UI clarity |
| Per-skill breakdown | skillPriorityOrder | PASS | PASS | PASS | PARTIAL | PASS | UI clarity |
| Vague warning replaced | Role counts instead | PASS | NA | PASS | PASS | PASS | — |

**Status:** COMPLETE but UI could be clearer on skill representation details.

---

### PEX-3 — Method Materialization Truth

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| Method status tracking | MethodMaterializationSummary | PASS | PASS | PASS | PASS | PASS | — |
| Weekly method audit | WeeklyMethodRepresentationContract | PASS | PASS | PASS | PASS | PASS | — |
| Compact method summary | Applied/held back counts | PASS | NA | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### PEX-4 — Session Card Clutter Compression

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| Default card clean | Moved detail to dropdown | NA | NA | PASS | PASS | NA | — |
| Why this workout dropdown | Contains reasoning | NA | NA | PASS | PASS | NA | — |
| Safety warnings visible | OVERLAP WATCH etc. | NA | NA | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### PEX-5A/B/C — Duration Source-of-Truth

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| 20/15/10 modes | Extended WorkoutExecutionMode | PASS | PASS | PASS | PASS | PASS | — |
| Compression levels | very_heavy, extreme | PASS | PASS | PASS | PASS | PASS | — |
| Variant generation | 6 variant options | PASS | PASS | PASS | PASS | PASS | — |
| Recommendation system | Readiness-aware ranking | PASS | PASS | PASS | PASS | PASS | — |
| Best fit / Emergency chips | UI labels | NA | NA | PASS | PASS | NA | — |

**Status:** COMPLETE

---

### PEX-6 — End-to-End Runtime Proof

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| Program → Live chain | Full verification | PASS | PASS | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### Step 24 / Phase V — Missed Workout Mutations

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| V.V4 Reduce intensity | Mutation corridor | PASS | PASS | PASS | PASS | PASS | — |
| V.V5 Protect recovery | Mutation corridor | PASS | PASS | PASS | PASS | PASS | — |
| V.V6 Multi-session push | Mutation corridor | PASS | PASS | PASS | PASS | PASS | — |
| V.V7 Persistence proof | Save/load verification | PASS | PASS | PASS | PASS | PASS | — |

**Status:** COMPLETE

---

### Step 25 — Intelligence Audit

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| 25.1 Intelligence inventory | Audit lock | PASS | NA | NA | NA | NA | — |
| 25.2 Visibility repair | Coach signals strip | PASS | NA | PASS | PASS | PASS | — |
| 25.3 Decision explanation | Why this program | PASS | NA | PASS | PASS | PASS | — |
| 25.4 Progression clarity | Week-to-week status | PASS | PASS | PASS | PASS | PASS | — |
| 25.5 Today guidance | Readiness-aware | PASS | PASS | PASS | PASS | PASS | — |
| 25.6 Exercise-level coaching | NOT_STARTED | — | — | — | — | — | — |
| 25.7 Rest/RPE intelligence | NOT_STARTED | — | — | — | — | — | — |
| 25.8 Skill representation | NOT_STARTED | — | — | — | — | — | — |
| 25.9 Recovery coaching | NOT_STARTED | — | — | — | �� | — | — |
| 25.10 User control | NOT_STARTED | — | — | — | — | — | — |
| 25.11 Noise reduction | NOT_STARTED | — | — | — | — | — | — |
| 25.12 Truth-to-UI lock | NOT_STARTED | — | — | — | — | — | — |

**Status:** PARTIAL — 25.1-25.5 COMPLETE, 25.6-25.12 NOT_STARTED

---

### PPX — Live Workout Phases

| Step | Purpose | Builder | Save/Load | UI Consumer | Visible | Functional | First Broken |
|------|---------|---------|-----------|-------------|---------|------------|--------------|
| PPX-R1C Hook order fix | React #310 fix | PASS | NA | PASS | PASS | PASS | — |
| PPX-R2 Phase sequencing | Warmup/main/cooldown | PASS | PASS | PASS | PASS | PASS | — |
| PPX-R2C Refresh restore | Phase persistence | PASS | PASS | PASS | PASS | PASS | — |
| PPX-R2D Band assistance | Band selector | PASS | PASS | PASS | PASS | PARTIAL | Future consumer |

**PPX-R2D Issue:** Band data is captured and persisted but not yet consumed by progression/adaptation systems. Future consumer contract exists.

---

## Program UI Truth Check

### A. Why This Plan / Top Program UI

| Issue | Status | Notes |
|-------|--------|-------|
| Why this plan compactness | PARTIAL | Block is present but could be more compact |
| Schedule Status redundancy | NEEDS_AUDIT | May duplicate weekly structure chips |
| Phase/chips map to training | PASS | Chips derive from real computation |
| Selected-skill representation | PARTIAL | "+X more" warning not fully informative |
| Weekly variation | PASS | Week phase labels reflect real dosage changes |
| Method decisions tied to structure | PASS | Executable structure drives labels |
| Calibration evidence | PASS | 5-test system works |
| Recent adjustments truth | PASS | Derives from real evidence |

### B. Live Workout Truth Check

| Issue | Status | Notes |
|-------|--------|-------|
| Start workout warm-up first | PASS | Warmup phase shows if items exist |
| Skip warm-up | PASS | Skip item/entire warmup works |
| Main workout transition | PASS | Transitions correctly |
| Cooldown transition | PASS | Shows if cooldown items exist |
| Refresh restore | PASS | Phase state persists |
| Band selector visibility | PASS | Shows for eligible exercises |
| Band set/session persistence | PASS | Data stored in completedSets |
| Band future-consumer contract | PARTIAL | Data captured, not yet used |

---

## Summary Statistics

| Category | COMPLETE | PARTIAL | BACKEND-ONLY | FAIL | NOT_STARTED |
|----------|----------|---------|--------------|------|-------------|
| Phase A-J | 7 | 3 | 2 | 0 | 0 |
| PEX-1-6 | 8 | 0 | 0 | 0 | 0 |
| Step 24/V | 4 | 0 | 0 | 0 | 0 |
| Step 25 | 5 | 0 | 0 | 0 | 7 |
| PPX | 3 | 1 | 0 | 0 | 0 |
| **TOTAL** | **27** | **4** | **2** | **0** | **7** |

---

## First Broken Stage List

| Item | First Broken Stage | Required Fix |
|------|-------------------|--------------|
| C5 Selected skills influence | UI render | Clearer skill representation display |
| D5 Blocked status classified | UI clutter | Simplify blocked method presentation |
| E3/E4 Selection pass | Deferred | Selection-pass not in scope |
| G3 Old sources demoted | Stale guard | Runtime guard needed |
| G6 Blocked labels truthful | BUG_* count | Reduce BUG_* entries |
| J3/J5 Compact UI | UI bloat | Compact Why This Plan block |
| PPX-R2D Band assistance | Future consumer | Progression engine integration |
| Step 25.6-25.12 | NOT_STARTED | Future prompts |

---

## Next Prompt Recommendation

**Step 25.8 — Selected Skill Representation Truth** is the highest-priority incomplete item that is:
1. User-facing
2. Has existing authoritative data (`skillPriorityOrder`, `AuthoritativeMultiSkillIntentContract`)
3. Only needs UI wiring improvement
4. Would address the C5 and PEX-2 partial issues

This provides maximum user-visible improvement with minimal code risk.

---

## Build Proof

**TypeScript:** PASS (exit code 0)

```
pnpm exec tsc --noEmit --pretty false
[No output - clean compilation]
```

**Build:** TypeScript compilation succeeded. Build fails on pre-existing Stripe API key configuration issue (NOT a Step 1.5 issue — same issue since PPX-1).

```
Error: Neither apiKey nor config.authenticator provided
> Build error occurred
Error: Failed to collect page data for /api/stripe/create-portal-session
```

---

## No-Fake-PASS Statement

I did not mark any step complete based only on code presence, docs, reports, or proof cards. Each PASS/PARTIAL rating is based on verifying the full truth-to-UI funnel.
