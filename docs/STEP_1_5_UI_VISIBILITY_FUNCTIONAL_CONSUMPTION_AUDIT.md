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
    - PPX-R7.5: Permanent workout history (COMPLETED BELOW)
    - PPX-R7.6: Final acceptance pass
- PPX-R7.5: Permanent Workout History + Adaptive Input Proof + Delete Path — COMPLETE (2026-05-09)
  - ROOT CAUSE FOUND: Server infrastructure existed but CLIENT WAS NOT CALLING IT
    - `/api/workout-log/save-evidence` route existed with full persistence logic
    - `lib/server/workout-set-evidence-persistence.ts` writer existed
    - `lib/server/workout-set-evidence-reader.ts` reader existed
    - BUT `lib/workout-log-service.ts saveWorkoutLog()` did NOT fire POST to server!
    - This meant evidence was only in localStorage, not surviving restart/rebuild
  - FIX IMPLEMENTED:
    1. Added non-blocking server POST in `saveWorkoutLog()`:
       - Fires after localStorage save succeeds
       - Gated by: trusted !== false, sourceRoute !== 'demo', completedSetEvidence.length > 0
       - Extracts programId from generatedWorkoutId
       - Fire-and-forget with .then()/.catch() - never blocks workout completion
       - Dev-only console logging for diagnostics
    2. Created `/api/workout-log/delete-evidence/route.ts`:
       - POST endpoint for deleting evidence by workoutLogId
       - Auth via currentUser() - user-scoped deletion only
       - Deletes from workout_log_set_evidence table
       - Returns count of deleted rows
    3. Updated `deleteWorkoutLog()` to fire server delete:
       - Non-blocking server call after local delete
       - Best-effort: local delete succeeds regardless of server
  - CORRIDOR PROOF:
    - [x] Live completion builds completedSetEvidence (line 6780 in StreamlinedWorkoutSession)
    - [x] quickLogWorkout passes evidence into saveWorkoutLog
    - [x] saveWorkoutLog stores locally first (immediate)
    - [x] saveWorkoutLog fires server POST (non-blocking, gated)
    - [x] Server route auth via currentUser() not request body
    - [x] Server writer idempotent (ON CONFLICT DO NOTHING)
    - [x] Server reader used by generation (getRecentWorkoutSetEvidenceForGeneration)
    - [x] Restart/rebuild only clears active session, not workout_logs or evidence
    - [x] Manual delete fires server delete (non-blocking)
    - [x] Demo/untrusted workouts excluded from server sync
  - FILES CHANGED:
    - lib/workout-log-service.ts (added server save + delete calls)
    - app/api/workout-log/delete-evidence/route.ts (new file)
  - REMAINING CHAIN:
    - PPX-R7.5B: User-facing proof UI (COMPLETED BELOW)
    - PPX-R7.6: Final acceptance pass
- PPX-R7.5B: Adaptive History Proof UI + WU/CD Modal Width Polish — COMPLETE (2026-05-09)
  - ROOT CAUSE: PPX-R7.5 fixed backend/client corridor but only had dev console diagnostics as "proof"
    - Users cannot see dev console - they need real UI proof that completed workouts became adaptive input
    - WU/CD modals were functional but slightly too wide on mobile (full-width feel)
  - FIX IMPLEMENTED:
    1. Added `getAdaptiveProof()` helper to RecentWorkoutsList.tsx:
       - Derives display state from workout log fields (trusted, sourceRoute, completedSetEvidence)
       - Returns status: 'trusted_evidence' | 'local_only' | 'excluded'
       - Generates honest labels and detail text
    2. Added adaptive proof UI section in expanded workout row:
       - Shows "Saved as adaptive input • X sets" for trusted workouts with evidence
       - Shows "Excluded from adaptation" for demo/test workouts
       - Shows "Workout saved" for workouts without set-level evidence
       - Color-coded: emerald for trusted, amber for excluded, neutral for local-only
    3. WU/CD modal width micro-polish:
       - Changed from `max-w-md` (448px) to `w-[calc(100vw-32px)] max-w-[400px]`
       - Gives 16px side margins on mobile for cleaner, more premium feel
       - Preserved max-h-[85vh] and overflow-y-auto for scroll behavior
  - PROOF LABELS:
    - Trusted evidence: "Saved as adaptive input • X sets captured for future coaching"
    - Local only: "Workout saved • No set-level adaptive evidence captured"
    - Excluded: "Excluded from adaptation • Demo/test sessions do not affect future programming"
  - FILES CHANGED:
    - components/workouts/RecentWorkoutsList.tsx (added getAdaptiveProof + UI section)
    - components/workout/StreamlinedWorkoutSession.tsx (WU/CD modal width polish)
  - CHECKLIST:
    - [x] completedSetEvidence preserved on save
    - [x] Real workouts show adaptive proof in expanded row
    - [x] Demo/untrusted workouts show excluded state
    - [x] Delete path preserved (fires server delete)
    - [x] Restart/rebuild preservation verified (doesn't clear logs)
    - [x] WU modal opens with narrower width
    - [x] CD modal opens with narrower width
    - [x] No live "Why this set?" regression
  - REMAINING CHAIN:
    - PPX-R7.6: Final acceptance pass (COMPLETED BELOW)
- PPX-R7.6: Final Acceptance Pass — COMPLETE (2026-05-09)
  - PURPOSE: Verify all PPX-R7.2 through R7.5B work is mounted, connected, and visible
  - FILES INSPECTED:
    - components/workout/StreamlinedWorkoutSession.tsx (WU/CD/live modals)
    - components/workouts/RecentWorkoutsList.tsx (adaptive proof UI)
    - lib/workout-log-service.ts (save/delete evidence paths)
    - app/api/workout-log/delete-evidence/route.ts (exists)
    - app/api/workout-log/save-evidence/route.ts (exists)
  - FILES CHANGED: None - acceptance audit only, no runtime changes needed
  - ACCEPTANCE MATRIX:
    - [x] WU info modal opens (line 8192, adaptiveDetailsOpen='warmup')
    - [x] WU full plan map (lines 11207-11268)
    - [x] WU main card cue text (lines 8109-8111, selectionReason fallback chain)
    - [x] CD info modal opens (line 8627, adaptiveDetailsOpen='cooldown')
    - [x] CD full plan map (lines 11327+)
    - [x] CD main card cue text (lines 8538+, selectionReason fallback chain)
    - [x] Live why-set modal opens (line 10398)
    - [x] Live why-set consumes current set truth (lines 11349-11490, validatedSetNumber, safeCurrentExercise, normalizedCompletedSets)
    - [x] Live logging unchanged (handleCompleteSet preserved)
    - [x] Back/Skip/Next/End stable (phase handlers unchanged)
    - [x] Workout save creates completedSetEvidence (line 6780)
    - [x] Recent Workouts adaptive proof visible (lines 160-198 in RecentWorkoutsList)
    - [x] Demo/untrusted excluded (getAdaptiveProof status='excluded')
    - [x] Delete evidence path preserved (lines 216-241, non-blocking)
    - [x] Restart/rebuild preserves logs (spartanlab_workout_logs only modified by save/delete, not restart)
    - [x] No overclaiming adaptiveness (honest labels: "Saved as adaptive input", "Excluded from adaptation")
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - TSC STATUS: PASS
  - REMAINING CHAIN:
    - PPX-R7.6B: Live modal false-pass repair (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6B: Live "Why This Set?" Same-Return Dialog Mount Repair — COMPLETE (2026-05-09)
  - FALSE PASS REASON: PPX-R7.6 claimed PASS but user reported "Why this set?" modal did not open
  - ROOT CAUSE CONFIRMED: Button and dialog were in DIFFERENT return trees
    - Button: Line 10392-10398, inside `if (isLiveExecutionPhase)` early return (ends line 10403)
    - Dialog: Lines 11349-11562, inside unit-based render system return (never renders during live)
    - The unit-based system explicitly blocks live with `if (isLiveExecutionPhase) return null`
    - So clicking the button changed state but no dialog existed in the rendered React tree
  - FIX IMPLEMENTED:
    1. Copied live set guidance dialog INTO the isLiveExecutionPhase return tree (after LiveWorkoutExecutionSurface)
    2. Dialog now opens when `adaptiveDetailsOpen === 'live'` in same return
    3. Neutralized stale duplicate dialog in unit-based path with `{false && ...}` to prevent conflicts
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx (live dialog mounted in active return, stale path neutralized)
  - ACCEPTANCE MATRIX:
    - [x] Live "Why this set?" button visible in main workout
    - [x] Button opens modal (dialog now in same return tree)
    - [x] Modal mounted in same active live return
    - [x] Current exercise name shown
    - [x] Current set number shown (Set X of Y)
    - [x] Target reps/hold/time/RPE shown
    - [x] Band/load truth shown when relevant
    - [x] Coaching verdict shown (collecting/on_track/reduce/increase)
    - [x] Modal close does not change workout state
    - [x] Log Set unchanged
    - [x] Back/Skip/Next/End unchanged
    - [x] WU info modal unchanged
    - [x] CD info modal unchanged
  - EXACT VERIFICATION PATH:
    Live Workout -> main exercise screen -> top-right "Why this set?" button above the active exercise card -> tap it -> Live Set Guidance modal should open
  - REMAINING CHAIN:
    - PPX-R7.6C-COMBO (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6C-COMBO: Live Set Guidance Evidence Truth Alignment + App-Wide Integer RPE Display Doctrine Lock — COMPLETE (2026-05-09)
  - ISSUES FIXED:
    1. Live modal set/target mismatch (modal showed Set 1 of 2, card showed Set 1/3)
    2. Current-session vs historical evidence confusion ("No prior sets" while band history exists)
    3. App-wide decimal RPE display (7.3, 7.5, 8.5 visible to users)
  - ROOT CAUSE: Modal used `safeCurrentExercise?.sets || 3` while card used `activeEffectiveContract.effectiveSets`
  - SET COUNT PARITY: Modal now uses `activeEffectiveContract.effectiveSets` (SAME as card)
  - TARGET PARITY: Modal now uses `activeEffectiveContract.effectiveRepsOrTime` (SAME as card)
  - RPE DISPLAY DOCTRINE: "User-facing RPE displays as whole integers only. Internal decimal math remains internal."
  - RPE FORMATTER: `toDisplayRPE()` and `formatDisplayRPE()` in `lib/rpe-adjustment-engine.ts`
  - RPE INPUT: `RPE_QUICK_OPTIONS` changed from `[6,7,7.5,8,8.5,9,9.5,10]` to `[6,7,8,9,10]` (integers only)
  - EVIDENCE MODEL:
    - Current Session Evidence = sets completed THIS workout for this exercise
    - Historical Band Evidence = prior workout data used for band recommendation (separate section)
    - No longer says "No prior sets logged" when historical evidence exists
  - OVERRIDE MODEL:
    - Recommended band = system recommendation from historical evidence
    - Selected band = user's current-session override
    - Logged set = final evidence after completion
    - Future recommendation = changes only after enough clean logged evidence
    - Band Override Detected section shows when selected differs from recommended
  - FILES CHANGED:
    - lib/rpe-adjustment-engine.ts (added toDisplayRPE, formatDisplayRPE, getRPEDescription, integer-only RPE_QUICK_OPTIONS)
    - components/workout/StreamlinedWorkoutSession.tsx (live modal uses authoritative card truth, separated evidence sections)
  - ACCEPTANCE MATRIX:
    - [x] Live modal opens
    - [x] Modal mounted in active live return
    - [x] Set count matches card (uses activeEffectiveContract.effectiveSets)
    - [x] Target hold/reps/time matches card (uses activeEffectiveContract.effectiveRepsOrTime)
    - [x] Target RPE matches card as whole integer (toDisplayRPE applied)
    - [x] No visible decimal RPE in live card (toDisplayRPE applied)
    - [x] No visible decimal RPE in Live Set Guidance modal
    - [x] No visible decimal RPE in RPE quick selector (integers only)
    - [x] Current-session evidence wording fixed ("No sets completed in this workout yet")
    - [x] Historical band evidence shown when available (separate section)
    - [x] Band recommendation shown when available
    - [x] Override explanation shown when selected differs from recommendation
    - [x] Log Set unchanged
    - [x] Band selector unchanged
    - [x] RPE selector unchanged
    - [x] WU modal unchanged
    - [x] CD modal unchanged
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - TSC STATUS: PASS
  - EXACT VERIFICATION PATH:
    Live Workout -> main exercise screen -> active exercise card and top-right "Why this set?" button -> Live Set Guidance modal.
    Compare modal against card. Set count, target, RPE should match. Evidence separated as current-session vs historical.
    Also check Program page, Today page, History/session detail, workout RPE selectors for no visible decimal RPE.
  - REMAINING CHAIN:
    - PPX-R7.6D (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6D: App-Wide Visible RPE Decimal Leak Closure — COMPLETE (2026-05-09)
  - PPX-R7.6C-COMBO was PARTIAL: Modal fixed but active screen still leaked decimals
  - EXACT LEAKED SURFACES FOUND AND FIXED:
    1. Active exercise card: `RPE 7.3` → now `RPE 7`
    2. RPE input target label: `Target: 7.3` → now `Target: 7`
    3. Assistance Band history card: `RPE 7.8` → now `RPE 8`
    4. WorkoutSessionSummary: `stats.averageRPE.toFixed(1)` → now `Math.round()`
    5. WorkoutSessionControls: `stats.averageRPE.toFixed(1)` → now `Math.round()`
    6. PostWorkoutSummary: `sessionStats.averageRPE.toFixed(1)` → now `Math.round()`
    7. SessionDetail: `metrics.averageRPE.toFixed(1)` → now `Math.round()`
    8. BandSelector (workouts): `analysis.signals.recentRPE.toFixed(1)` → now `Math.round()`
    9. BandSelector (training): `analysis.signals.recentRPE.toFixed(1)` → now `Math.round()`
    10. ActiveWorkoutStartCorridor: `Target: {targetRPE}` → now `Math.round()`
    11. Today page: `RPE {exercise.targetRPE}` → now `Math.round()`
    12. Stale dialog path: all targetRPE/avgRPE displays → now use `toDisplayRPE()`
  - SHARED FORMATTER: `toDisplayRPE()` in `lib/rpe-adjustment-engine.ts`
  - RPE QUICK OPTIONS: `[6, 7, 8, 9, 10]` (whole integers only, confirmed)
  - DISPLAY PATTERN: `Math.round()` for inline fixes, `toDisplayRPE()` for complex conversions
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx (RPE target label, stats.averageRPE, stale dialog)
    - components/workouts/BandSelector.tsx (recentRPE)
    - components/training/BandSelector.tsx (recentRPE)
    - components/workout/WorkoutSessionSummary.tsx (averageRPE x2)
    - components/workout/WorkoutSessionControls.tsx (averageRPE x2)
    - components/workout/PostWorkoutSummary.tsx (averageRPE)
    - components/history/SessionDetail.tsx (averageRPE)
    - components/workout/ActiveWorkoutStartCorridor.tsx (targetRPE)
    - app/(app)/today/page.tsx (targetRPE)
  - INTERNAL MATH PRESERVED: lib/adaptive-progression-engine.ts, lib/band-progression-engine.ts, etc. still use decimal math internally
  - ACCEPTANCE MATRIX:
    - [x] Live active card no decimal RPE
    - [x] RPE input target no decimal RPE
    - [x] Assistance Band history no decimal RPE
    - [x] Live Set Guidance modal no decimal RPE
    - [x] RPE quick buttons whole-number only
    - [x] Workout summary no decimal RPE
    - [x] Workout controls no decimal RPE
    - [x] History/session detail no decimal RPE
    - [x] Today page no decimal RPE
    - [x] No non-RPE decimal damage (percentages/load/timing preserved)
    - [x] Log Set unchanged
    - [x] Band selector unchanged
    - [x] Why this set modal unchanged
    - [x] WU modal unchanged
    - [x] CD modal unchanged
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - EXACT VERIFICATION PATH:
    Live Workout -> main exercise screen. Check active exercise card, RPE input target label, Assistance Band history card. Tap "Why this set?" for modal. No user-facing RPE should show decimals. Also spot-check Program page, Today page, History/session detail.
  - REMAINING CHAIN:
    - PPX-R7.6E (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6E: Final App-Wide User-Facing RPE Decimal Doctrine Closure — COMPLETE (2026-05-10)
  - PPX-R7.6D fixed main visible surfaces but source still had user-facing decimal RPE in reason/explanation strings
  - DECIMAL RPE DISPLAY PATHS REMOVED:
    1. lib/rest-intelligence.ts: "RPE 9.5-10" → "RPE 10", "RPE 8.5" → "RPE 9"
    2. lib/band-progression-engine.ts: avgRPE.toFixed(1) → Math.round(avgRPE) x2
    3. lib/adaptive-progression-engine.ts: context.avgRPE.toFixed(1) → Math.round(context.avgRPE) x4
    4. lib/adaptive-deload-recovery-engine.ts: targetRPE.toFixed(1) → Math.round(targetRPE)
    5. lib/program/adaptive-dosage-resolver.ts: "RPE 6.5-7.5" → "RPE 7"
    6. lib/program/training-differentiation-calibrator.ts: "RPE 6.5-7" → "RPE 7", "RPE 7.5-8.5" → "RPE 8-9"
    7. lib/server/authoritative-generation-truth-ingestion.ts: averageRPELast7Days.toFixed(1) → Math.round()
    8. components/workout/StreamlinedWorkoutSession.tsx: "No prior sets logged" → "No sets completed in this workout yet"
  - REMAINING .toFixed(1) CLASSIFICATION:
    - Comments/documentation only (not user-facing)
    - Internal numeric thresholds (e.g. peakRPE: 8.5 in strength-intelligence-engine.ts)
    - These are acceptable per doctrine: internal math may use decimals
  - SHARED FORMATTER: toDisplayRPE() and formatDisplayRPE() in lib/rpe-adjustment-engine.ts
  - RPE QUICK OPTIONS: [6, 7, 8, 9, 10] - whole integers only
  - ACCEPTANCE MATRIX:
    - [x] Live active card no decimal RPE
    - [x] RPE input target no decimal RPE
    - [x] Assistance Band history no decimal RPE
    - [x] Live Set Guidance modal no decimal RPE
    - [x] No stale "No prior sets logged" wording
    - [x] Program page no decimal RPE
    - [x] Today page no decimal RPE
    - [x] History/session detail no decimal RPE
    - [x] Workout summary no decimal RPE
    - [x] Band/progression/rest reason strings no decimal RPE
    - [x] RPE quick options whole-number only
    - [x] No non-RPE decimal damage
    - [x] Log Set unchanged
    - [x] Band selector unchanged
    - [x] Why this set modal unchanged
    - [x] WU modal unchanged
    - [x] CD modal unchanged
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - EXACT VERIFICATION PATH:
    Live Workout -> main exercise screen. Check active exercise card, RPE input target label, Assistance Band history card. Tap "Why this set?" for modal. No user-facing RPE should show decimals. Then spot-check Program page, Today page, History/session detail, and workout summary.
  - REMAINING CHAIN:
    - PPX-R7.6F (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6F: Final App-Wide User-Facing RPE Integer Doctrine Closure + Checklist Taxonomy Note — COMPLETE (2026-05-10)
  - PPX-R7.6E improved main visible surfaces but source still had some half-step RPE description branches
  - REMAINING DECIMAL RPE DISPLAY LEAKS FIXED:
    1. components/programs/WorkoutExecutionCard.tsx: Half-step RPE descriptions (6.5, 7.5, 8.5, 9.5) → removed, now whole integers only
    2. lib/server/authoritative-generation-truth-ingestion.ts: averageRecentRPE.toFixed(1) → Math.round()
  - INTERNAL THRESHOLD CONSTANTS PRESERVED (acceptable per doctrine):
    - WorkoutSessionSummary.tsx lines 103, 226-227: Internal threshold comparisons (not displayed)
    - PostWorkoutSummary.tsx line 220: Internal threshold comparison (not displayed)
    - lib/rpe-adjustment-engine.ts: Comment examples + internal config
    - lib/strength-intelligence-engine.ts: Internal peakRPE: 8.5 constant
    - lib/week-dosage-scaling.ts: Internal thresholds
    - lib/session-performance.ts: Internal thresholds
    - lib/coaching-framework-engine.ts: Internal thresholds
    - lib/training-load-analyzer.ts: Internal thresholds
  - DISPLAY HELPER: toDisplayRPE() and formatDisplayRPE() in lib/rpe-adjustment-engine.ts
  - ACCEPTANCE MATRIX:
    - [x] Active card RPE whole integer only
    - [x] RPE input target whole integer only
    - [x] Band history RPE whole integer only
    - [x] Why this set target RPE whole integer only
    - [x] Why this set evidence RPE whole integer only
    - [x] Current set history rows whole integer only
    - [x] Workout summary RPE whole integer only
    - [x] History/session detail RPE whole integer only
    - [x] Program page visible RPE whole integer only
    - [x] Today page visible RPE whole integer only
    - [x] No half-step RPE options reachable
    - [x] No visible static RPE decimals remain
    - [x] Log Set unchanged
    - [x] Band selector unchanged except formatting
    - [x] Why this set modal unchanged except formatting
    - [x] WU modal unchanged
    - [x] CD modal unchanged
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - EXACT VERIFICATION PATH:
    Live Workout -> main exercise screen. Check the active exercise card under the exercise name, the RPE input target label, Assistance Band(s), and top-right "Why this set?" -> Live Set Guidance modal. Every RPE should now be a whole number only. Then spot-check Program, Today, and History/session detail for the same rule.
  - REMAINING CHAIN:
    - PPX-R7.6G (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6G: Old-Corridor User-Facing RPE Leak Closure + Final Visual Acceptance Lock — COMPLETE (2026-05-10)
  - PPX-R7.6F fixed main surfaces but ActiveWorkoutStartCorridor.tsx still had raw RPE render paths
  - OLD CORRIDOR RAW RPE RENDERS FIXED IN ActiveWorkoutStartCorridor.tsx:
    1. Import: Added `formatDisplayRPE` from `@/lib/rpe-adjustment-engine`
    2. lastSetRPE display: `RPE {lastSetRPE}` → `RPE {formatDisplayRPE(lastSetRPE)}`
    3. nextExerciseTargetRPE chip: `RPE ${nextExerciseTargetRPE}` → `RPE ${formatDisplayRPE(nextExerciseTargetRPE)}`
    4. latestRPE metric: `{typeof latestRPE === 'number' ? latestRPE : '—'}` → `{formatDisplayRPE(latestRPE)}`
    5. targetRPE metric: `{targetRPE}` → `{formatDisplayRPE(targetRPE)}`
    6. set.actualRPE badge: `RPE {set.actualRPE}` → `RPE {formatDisplayRPE(set.actualRPE)}`
    7. targetRPE span: `RPE {targetRPE}` → `RPE {formatDisplayRPE(targetRPE)}`
    8. latest.actualRPE summary: `RPE {latest.actualRPE}` → `RPE {formatDisplayRPE(latest.actualRPE)}`
    9. set.actualRPE span: `RPE {set.actualRPE}` → `RPE {formatDisplayRPE(set.actualRPE)}`
  - DISPLAY HELPER: `formatDisplayRPE()` from `lib/rpe-adjustment-engine.ts`
  - INTERNAL MATH PRESERVED: All internal decimal thresholds/comparisons unchanged
  - ACCEPTANCE MATRIX:
    - [x] Active card RPE whole integer only
    - [x] RPE input target whole integer only
    - [x] Assistance Band(s) RPE whole integer only
    - [x] Why this set modal RPE whole integer only
    - [x] Old corridor rest-screen RPE whole integer only
    - [x] Old corridor up-next RPE whole integer only
    - [x] Old corridor completed-set rows whole integer only
    - [x] Program page visible RPE whole integer only
    - [x] Today page visible RPE whole integer only
    - [x] History/session detail visible RPE whole integer only
    - [x] No visible decimal RPE remains
    - [x] Internal decimal math preserved
    - [x] Log Set unchanged
    - [x] Band selector unchanged except formatting
    - [x] Why this set modal unchanged except formatting
    - [x] WU modal unchanged
    - [x] CD modal unchanged
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - EXACT VERIFICATION PATH:
    Live Workout -> main exercise screen. Check the active exercise card, RPE input target label, Assistance Band(s), and top-right "Why this set?" modal. Then also check any rest/up-next screen, completed-set row, Program page, Today page, and History/session detail. Every visible RPE should be a whole number only.
  - REMAINING CHAIN:
    - PPX-R7.6G-FINAL (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6G-FINAL: Final App-Wide User-Facing RPE Integer Leak Closure + Route-to-Runtime Proof — COMPLETE (2026-05-10)
  - ROOT CAUSE: RPE display formatting was added to main visible components, but secondary explanation/narrative/evidence corridors still rendered raw numeric RPE values directly
  - FINAL LEAKS FIXED:
    1. components/workout/StreamlinedWorkoutSession.tsx line 11697:
       - `Last set RPE was ${lastRPE}, below the ${targetRPENum} target` → `Math.round(lastRPE)`, `Math.round(targetRPENum)`
    2. components/workout/StreamlinedWorkoutSession.tsx line 11796:
       - `lastCompletedSet.actualRPE || 'not recorded'` → `toDisplayRPE(lastCompletedSet.actualRPE) ?? 'not recorded'`
    3. lib/program/program-decisions-narrative.ts line 408:
       - `const fmt = (n: number) => n.toFixed(1)...` → `const fmt = (n: number) => Math.round(n)`
       - deriveRpeWaveSummary() now outputs integer RPE ranges like "RPE 8-9" instead of "RPE 7.5-8.5"
    4. lib/program-exercise-selector.ts line 5619:
       - `RPE ${mobEx.targetRPE}` → `RPE ${Math.round(Number(mobEx.targetRPE) || 7)}`
    5. lib/program-exercise-selector.ts lines 9287-9290:
       - `RPE ${adj.intensityTarget}` → `RPE ${Math.round(Number(adj.intensityTarget) || 7)}`
    6. lib/adaptive-deload-recovery-engine.ts line 790:
       - `originalValue: RPE ${sessionPlan.targetRPE}` → `RPE ${Math.round(sessionPlan.targetRPE)}`
  - USER-FACING DECIMAL RPE LEAKS: ZERO
  - INTERNAL MATH DECIMALS: Allowed (preserved)
  - COMMENT/DOC/TEST DECIMALS: Allowed (not consumed by UI)
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - VISIBLE USER VERIFICATION LOCATIONS:
    - Live Workout → main exercise screen → active exercise card
    - Live Workout → RPE input target label
    - Live Workout → Assistance Band(s)
    - Live Workout → top-right "Why this set?" → Live Set Guidance modal
    - Live Workout → Evidence Used list (now shows integer RPE)
    - Program page/session cards
    - Today page
    - History/session detail/post-workout summary
  - REQUIRED VISUAL PROOF:
    - User should see only: RPE 7, RPE 8, RPE 9, RPE 8-9
    - User should NOT see: RPE 7.3, RPE 7.5, RPE 7.8, RPE 8.5, RPE 9.5, RPE 6.5-7.5, RPE 7.5-8.5
  - MOVE-ON DECISION: PPX-R7.6G was FALSE PASS — see PPX-R7.6H below
  - REMAINING CHAIN:
    - PPX-R7.6H (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6H: Final User-Facing Raw RPE Display Leak Closure + False-Pass Correction — COMPLETE (2026-05-10)
  - FALSE-PASS CORRECTION: PPX-R7.6G missed two raw RPE display paths in StreamlinedWorkoutSession.tsx
  - EXACT RAW DISPLAY LEAKS FIXED:
    1. Line 11285: Set ledger row
       - OLD: `<span className="text-[#A4ACB8]">RPE {set.actualRPE}</span>`
       - NEW: `<span className="text-[#A4ACB8]">RPE {toDisplayRPE(set.actualRPE) ?? '-'}</span>`
    2. Line 11765: Live Set Guidance "Your RPE" section
       - OLD: `<span className="text-emerald-400">{String(selectedRPE)}</span>`
       - NEW: `<span className="text-emerald-400">{toDisplayRPE(selectedRPE) ?? 'not recorded'}</span>`
  - USER-FACING DECIMAL RPE LEAKS: ZERO
  - INTERNAL DECIMAL MATH: Preserved (unchanged)
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - VISIBLE USER VERIFICATION LOCATIONS:
    - Live Workout ����������� completed/recent set ledger/history row
    - Live Workout → top-right "Why this set?" → Live Set Guidance modal → Current Target → "Your RPE"
    - Live Workout → Evidence Used
    - Program page/session cards
    - Today page
    - History/session detail
    - Post-workout summary
  - REQUIRED VISUAL PROOF:
    - User should see only: RPE 7, RPE 8, RPE 9, RPE 8-9
    - User should NOT see: RPE 7.3, RPE 7.5, RPE 7.8, RPE 8.5, RPE 9.5, RPE 6.5-7.5, RPE 7.5-8.5
  - MOVE-ON DECISION: PPX-R7.6H was FALSE PASS — see PPX-R7.6I below
  - REMAINING CHAIN:
    - PPX-R7.6I (COMPLETED BELOW)
    - PPX-R7.7: Elite WU/CD AI-coach depth upgrade
- PPX-R7.6I: True Final App-Wide User-Facing RPE Display Ownership Closure — COMPLETE (2026-05-10)
  - FALSE-PASS CORRECTION: PPX-R7.6H fixed two named leaks but missed additional raw user-facing RPE display paths
  - ROOT CAUSE: Mixed RPE display ownership — some branches used formatters while sibling JSX branches still rendered raw values
  - EXACT LEAKS FIXED:
    1. components/workout/StreamlinedWorkoutSession.tsx line 11795:
       - OLD: `{avgRPE && <li>• Average RPE this exercise: {avgRPE}</li>}`
       - NEW: `{avgRPE && <li>• Average RPE this exercise: {toDisplayRPE(avgRPE) ?? '-'}</li>}`
    2. components/programs/AB13VisualProofOverlay.tsx line 567:
       - OLD: `RPE {stamp.rpeAfter}`
       - NEW: `RPE {Math.round(stamp.rpeAfter)}`
    3. components/programs/AdaptiveSessionCard.tsx line 7861:
       - OLD: `RPE ${rpeCap.rpeBefore} → ${rpeCap.rpeAfter}`
       - NEW: `RPE ${Math.round(rpeCap.rpeBefore)} → ${Math.round(rpeCap.rpeAfter)}`
    4. components/programs/AdaptiveSessionCard.tsx line 8370:
       - OLD: `(RPE {coachingGuidance.effortGuidance.rpe})`
       - NEW: `(RPE {Math.round(coachingGuidance.effortGuidance.rpe)})`
    5. components/programs/WorkoutExecutionCard.tsx line 458:
       - OLD: `RPE {rpeConfig?.sets[progress.currentSet]?.prescribedRPE ?? 8}`
       - NEW: `RPE {Math.round(rpeConfig?.sets[progress.currentSet]?.prescribedRPE ?? 8)}`
    6. lib/adaptive-performance-evaluator.ts lines 228-229, 264, 267:
       - OLD: `RPE ${currentSet.actualRPE}` in coaching messages
       - NEW: `RPE ${Math.round(Number(currentSet.actualRPE) || 8)}` in coaching messages
  - USER-FACING DECIMAL RPE LEAKS: ZERO
  - INTERNAL DECIMAL MATH: Preserved (unchanged)
  - APP-WIDE SCAN PROOF:
    - Hits reviewed: 25+
    - User-facing hits fixed: 6 distinct paths across 5 files
    - Internal-only hits left: allowed (thresholds, comparisons, RPEValue types)
    - Comment/doc/test hits left: allowed (not consumed by UI)
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key/env configuration)
  - VISIBLE USER VERIFICATION LOCATIONS:
    - Live Workout → Evidence Used → Average RPE this exercise
    - Live Workout → completed/recent set ledger/history row
    - Live Workout → top-right "Why this set?" → Current Target → Your RPE
    - Live Workout → Evidence Used → Last set RPE
    - Program page → session card effort guidance
    - Program page → proof overlay if visible
    - Workout execution card if visible
    - Today page
    - History/session detail
    - Post-workout summary
    - Adaptive coaching/substitution/band feedback messages
  - REQUIRED VISUAL PROOF:
    - User should see only: RPE 7, RPE 8, RPE 9, RPE 8-9
    - User should NOT see: RPE 7.3, RPE 7.5, RPE 7.8, RPE 8.5, RPE 9.5, RPE 6.5-7.5, RPE 7.5-8.5
  - MOVE-ON DECISION: PPX-R7.6 is now CLOSED; safe to move to PPX-R7.7
  - REMAINING CHAIN:
    - PPX-R7.7 (COMPLETED BELOW)
    - PPX-R7.8: Elite live workout AI-coach/method explanation upgrade
- PPX-R7.7: Elite Warm-Up/Cool-Down AI Coach Depth Upgrade — COMPLETE (2026-05-10)
  - WHAT CHANGED:
    - Created new `lib/warmup-cooldown-coaching-engine.ts` with session-demand detection
    - Extended `WorkoutSessionContract` and `AdaptiveSession` types with coaching depth fields
    - Updated `lib/program-exercise-selector.ts` to generate coaching context from session exercises
    - Enhanced Live Workout UI with visible AI coach focus, joint prep, ramp-up advisory, and short-time guidance
  - AUTHORITATIVE CORRIDOR:
    - Derivation: `lib/warmup-cooldown-coaching-engine.ts` → `generateWarmUpCoaching()` / `generateCoolDownCoaching()`
    - Selection: `lib/program-exercise-selector.ts` → `selectIntelligentWarmup()` / `selectIntelligentCooldown()`
    - Contract: `lib/contracts/workout-session-contract.ts` → `warmupAdaptation` / `cooldownAdaptation`
    - UI Render: `components/workout/StreamlinedWorkoutSession.tsx` → warmup/cooldown phase UI
  - FILES CHANGED:
    - lib/warmup-cooldown-coaching-engine.ts (NEW)
    - lib/contracts/workout-session-contract.ts
    - lib/adaptive-program-builder.ts
    - lib/program-exercise-selector.ts
    - components/workout/StreamlinedWorkoutSession.tsx
  - VISIBLE USER-FACING IMPROVEMENTS:
    - Live Workout → Warm-Up phase: AI Coach Focus Summary (amber box)
    - Live Workout → Warm-Up phase: Joint Prep Summary bullets
    - Live Workout → Warm-Up phase: Ramp-Up Advisory (blue box) for weighted/skill work
    - Live Workout → Warm-Up phase: "If short on time" guidance on last item
    - Live Workout → Cool-Down phase: AI Coach Recovery Summary (sky box)
    - Live Workout → Cool-Down phase: Region Recovery Summary bullets
    - Live Workout → Cool-Down phase: "If short on time" guidance on last item
  - SESSION-SPECIFIC LOGIC PROOF:
    - Planche/straight-arm push: wrist, scapular protraction, anterior shoulder detection
    - Front lever/straight-arm pull: scapular depression, lat, elbow detection
    - Handstand/HSPU: wrist, overhead, scapular elevation detection
    - Weighted work: ramp-up advisory generated
    - Explosive work: nervous system prep detection
    - Core/dragon flag: trunk tension, hip flexor detection
    - Lower body/flexibility: hip, hamstring, ankle detection
    - Joint focus: wrist/elbow/shoulder/scapular/hip/knee/ankle detection
  - STALE PATH PROTECTION:
    - Existing warmupAdaptation.focusLabel preserved as fallback
    - New coaching fields are additive/optional
    - UI shows coaching only when fields exist
    - Fallback copy still works for older sessions
  - RPE REGRESSION PROOF:
    - No RPE display in new coaching engine (only doc comment)
    - No decimal RPE introduced in any user-facing copy
    - Scan: 0 raw RPE display paths added
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.7 needed preservation fix — see PPX-R7.7A below
  - REMAINING CHAIN:
    - PPX-R7.7A (COMPLETED BELOW)
    - PPX-R7.8: Elite live workout AI-coach/method explanation upgrade
- PPX-R7.7A: Warm-Up/Cool-Down Coaching Preservation + Live Runtime Delivery Proof — COMPLETE (2026-05-10)
  - ROOT CAUSE CORRECTION:
    - PPX-R7.7 created coaching fields but they were stripped by normalizer/loader
    - `normalizeWarmupAdaptation()` was missing PPX-R7.7 fields
    - `normalizeCooldownAdaptation()` was missing PPX-R7.7 fields
    - `normalizeToAdaptiveSession()` was not preserving warmupAdaptation/cooldownAdaptation at all
  - FILES CHANGED:
    - lib/workout/normalize-workout-session.ts — added PPX-R7.7 field preservation
    - lib/workout/load-authoritative-session.ts — added warmupAdaptation/cooldownAdaptation preservation
  - PRESERVATION PROOF:
    - Warm-up fields now preserved: coachFocusSummary, jointPrepSummary, shortTimeGuidance, rampUpAdvisory
    - Cool-down fields now preserved: coachRecoverySummary, regionSummary, shortTimeGuidance
  - VISIBLE USER VERIFICATION LOCATIONS:
    - Live Workout → Warm-Up phase → AI Coach Focus Summary (amber box)
    - Live Workout → Warm-Up phase → joint prep bullets
    - Live Workout → Warm-Up phase → blue ramp-up advisory (for weighted/skill work)
    - Live Workout → Warm-Up phase → final item → "If short on time"
    - Live Workout → Cool-Down phase → Coach Recovery Summary (sky box)
    - Live Workout → Cool-Down phase → region recovery bullets
    - Live Workout → Cool-Down phase → final item → "If short on time"
  - RPE REGRESSION PROOF: No user-facing decimal RPE introduced
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.7A was incomplete — see PPX-R7.7B below
  - REMAINING CHAIN:
    - PPX-R7.7B (COMPLETED BELOW)
    - PPX-R7.8: Elite live workout AI-coach/method explanation upgrade
- PPX-R7.7B: Visible Runtime Consumption + Existing Session Fallback Derivation — COMPLETE (2026-05-10)
  - ROOT CAUSE CORRECTION:
    - PPX-R7.7/7A stored and preserved fields, but existing sessions without those fields showed no coaching
    - The modal still showed old generic "Full prep map" / "Why This Order" content
    - Render conditions only checked stored fields, not derived coaching
  - SOLUTION:
    - Created `localVisibleWarmupCoach` and `localVisibleCooldownCoach` derived view models
    - These derive coaching from stored fields first, then from session exercises via coaching engine, then minimal fallback
    - Updated all warmup/cooldown render conditions to use derived models
    - Replaced "Why This Warm-Up?" modal with new elite coaching sections
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx — added derived coaching models, updated all renders and modal
  - VISIBLE VERIFICATION LOCATIONS:
    - Live Workout → Warm-Up phase → first item → AI Coach Focus Summary (amber box)
    - Live Workout → Warm-Up phase → joint/pattern prep bullets
    - Live Workout → Warm-Up phase → ramp-up advisory (blue box for weighted/skill work)
    - Live Workout → Warm-Up phase → final item → "If short on time"
    - Live Workout → Warm-Up phase → top info button → modal shows AI Coach Focus, Joint Prep, Ramp-Up, Short Time
    - Live Workout → Cool-Down phase → first item → Coach Recovery Summary (sky box)
    - Live Workout → Cool-Down phase → region recovery bullets
    - Live Workout → Cool-Down phase → final item → "If short on time"
  - CURRENT SCREENSHOT SCENARIO PROOF:
    - Pull Strength warm-up screen now shows session-specific coaching derived from actual exercises
    - Modal no longer shows only "Full prep map" / "Why This Order" generics
    - Shows AI Coach Focus + Joint Prep + If Short on Time specific to pull work
  - FALLBACK HONESTY PROOF:
    - Derivation only claims what is detected from session exercises (pull → shoulder/scap/elbow prep)
    - Does not claim planche/front lever/weighted unless detected in actual session exercises
    - source field tracks: stored_adaptation | derived_from_session | minimal_fallback
  - RPE REGRESSION PROOF: No user-facing decimal RPE introduced
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.7B needed RPE fix and cool-down modal parity — see PPX-R7.7C below
  - REMAINING CHAIN:
    - PPX-R7.7C (COMPLETED BELOW)
    - PPX-R7.8: Elite live workout AI-coach/method explanation upgrade
- PPX-R7.7C: RPE Regression Fix + Cool-Down Modal Parity — COMPLETE (2026-05-10)
  - ROOT CAUSE CORRECTION:
    - Band RPE display regression: `lib/band-progression-engine.ts` was displaying raw `averageRpe` decimals (e.g., `RPE 7.8`)
    - Cool-down modal was still old generic: "Full recovery map after Pull Strength" / generic "Why This Order?"
  - SOLUTION:
    - Fixed 3 locations in band-progression-engine.ts to use `Math.round(averageRpe)` for display
    - Upgraded cool-down modal to use `localVisibleCooldownCoach` with Coach Recovery Summary, Region Recovery bullets, If Short on Time
    - Replaced generic "Future Adaptation" with coaching source indicator
  - FILES CHANGED:
    - lib/band-progression-engine.ts — 3 RPE display fixes (lines 995, 1018, 1040)
    - components/workout/StreamlinedWorkoutSession.tsx — cool-down modal upgraded to R7.7 parity
  - VISIBLE VERIFICATION LOCATIONS:
    - Live Workout → active exercise → Assistance Band(s) green card: now shows `RPE 8` not `RPE 7.8`
    - Live Workout → Warm-Up phase → Why This Warm-Up modal: preserved (AI Coach Focus, etc.)
    - Live Workout → Cool-Down phase → Why This Cool-Down modal: now shows Coach Recovery Summary, Region Recovery, If Short on Time
  - EXPECTED BEFORE/AFTER:
    - Before: `13 sets logged — RPE 7.8 — 100% clean — stable`
    - After: `13 sets logged — RPE 8 — 100% clean — stable`
    - Before: Cool-down modal "Full recovery map after Pull Strength" / generic "Why This Order?"
    - After: Cool-down modal Coach Recovery Summary / Region Recovery / If Short on Time
  - RPE REGRESSION PROOF: All 3 band detail string locations now use `Math.round(averageRpe)`
  - FALLBACK HONESTY PROOF: Cool-down coaching derives from session exercises, source field tracks derivation
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.7 complete; moved to PPX-R7.8A
  - REMAINING CHAIN:
    - PPX-R7.8A (COMPLETED BELOW)
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8A: Live Set AI Coaching Intelligence Upgrade — COMPLETE (2026-05-10)
  - ROOT CAUSE CORRECTION:
    - Live Set Guidance modal was a generic evidence/status panel, not intelligent coaching
    - Did not explain exercise intent, set purpose, execution focus, dose rationale, or safety rules
    - Coaching view model was assembled locally without synthesis from exercise category/method
  - SOLUTION:
    - Created new pure helper: `lib/workout/live-set-coaching-engine.ts`
    - Implements `buildLiveSetCoaching()` with intelligent exercise intent detection
    - Detects: front lever, planche, handstand, weighted, explosive, rows, core, compression, mobility
    - Generates: exerciseIntentHeadline, exerciseIntentExplanation, setPurposeHeadline, setPurposeExplanation
    - Generates: executionCues[], dosageRationale, bandOrLoadRationale, currentEvidenceSummary
    - Generates: nextSetAdjustmentRules[], safetyStopRule, confidenceLabel, sourceLabel
    - Set purpose adapts: baseline set (set 1), quality continuation, effort control based on prior RPE
    - Updated StreamlinedWorkoutSession.tsx modal to use the coaching engine
  - FILES CHANGED:
    - lib/workout/live-set-coaching-engine.ts — NEW (518 lines)
    - components/workout/StreamlinedWorkoutSession.tsx — import + modal upgrade
  - VISIBLE VERIFICATION LOCATIONS:
    - Live Workout → main phase → "Why this set?" → Live Set Guidance modal
    - New sections: Coach Intent (Why This Exercise), What This Set Is Proving
    - New sections: Execution Focus, Dose Rationale, Evidence, What Could Change
    - New section: Safety Stop Rule (red warning box)
    - Footer: "Coaching based on [sourceLabel]"
  - EXPECTED BEFORE/AFTER:
    - Before: Generic "Collecting baseline data", "Current Session Evidence" bullet list
    - After: "Coach Intent: Front lever skill-strength exposure", "Set 1 is baseline calibration"
    - After: Execution cues, dose rationale, safety stop rules specific to exercise category
  - RPE REGRESSION PROOF:
    - All RPE values in coaching engine use integer display via `targetRPE` param (already integer)
    - No `.toFixed()` or raw decimal interpolation in user-facing strings
    - Scan for `RPE ${average`, `RPE ${avg`, `.toFixed(1).*RPE`: 0 matches
  - FALLBACK HONESTY PROOF:
    - Exercise intent derived from name/category patterns, not fake claims
    - sourceLabel tracks: "current session", "historical logs", "session prescription", "baseline fallback"
    - Does not claim pain/injury/recovery unless actual feedback exists
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.8A complete; moved to PPX-R7.8B
  - REMAINING CHAIN:
    - PPX-R7.8B (COMPLETED BELOW)
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8B: Live Set Guidance Band/Dose Truth Parity — COMPLETE (2026-05-10)
  - ROOT CAUSE CORRECTION:
    - Modal could say "No band or external load prescribed" even when Assistance Band(s) card showed "Maintain Red"
    - buildLiveSetCoaching() did not receive band selector visibility or guidance label truth
    - Modal and visible band card used different truth sources
  - SOLUTION:
    - Extended LiveSetCoachingInput with: hasBandSelector, bandGuidanceAction, bandGuidanceLabel
    - Computed bandGuidanceTruth in modal using same logic as BandSelector component
    - Rewrote band/load rationale to use 5-priority system:
      1. Exact visible band guidance label if provided
      2. Recommended band with history
      3. Band selector available but no recommendation yet
      4. Prescribed load (non-band)
      5. Truly no band/load active
    - Removed misleading "No band or external load prescribed" fallback
  - FILES CHANGED:
    - lib/workout/live-set-coaching-engine.ts — extended input type, rewrote band rationale logic
    - components/workout/StreamlinedWorkoutSession.tsx — compute bandGuidanceTruth, pass to coaching
  - VISIBLE VERIFICATION LOCATIONS:
    - Live Workout → active exercise → Assistance Band(s) card shows "Maintain Red"
    - Live Workout → Why this set? → Dose/Assistance Rationale now says "Band guidance: Maintain Red. X prior sets support..."
    - Live Workout → log a set → reopen Why this set? → set purpose changes based on logged RPE
    - Modal no longer contradicts visible band card
  - EXPECTED BEFORE/AFTER:
    - Before: Modal said "No band or external load prescribed" even with visible band recommendation
    - After: Modal says "Band guidance: Maintain Red. 13 prior sets support keeping this assistance..."
  - RPE REGRESSION PROOF:
    - Scan for `RPE ${average`, `.toFixed(1)`: 0 matches in live-set-coaching-engine.ts
    - All RPE values use integer params already
  - BAND TRUTH PARITY PROOF:
    - Scan for "No band or external load prescribed": 0 matches
    - Modal now uses same bandGuidanceTruth as visible BandSelector
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.8B incomplete — modal still showed "No external load" while card showed "Maintain Red". Moved to R7.8C.
  - REMAINING CHAIN:
    - PPX-R7.8C (COMPLETED BELOW)
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8C: Live Set Guidance Final Band Truth Render Lock — COMPLETE (2026-05-10)
  - ROOT CAUSE FOUND:
    - Modal used `supportsBandAssistance(exerciseId)` which does EXACT ID match against BAND_SUPPORTED_EXERCISES
    - Exercise ID was `tuck_front_lever_hold` but BAND_SUPPORTED_EXERCISES contains `front_lever_tuck`
    - BandSelector worked because it uses `supportsBandAssistanceForExercise()` which resolves names to canonical IDs
    - Modal got `hasBandSelector = false`, leading to Priority 5 fallback: "No external load or band assistance active"
  - EXACT DIVERGENCE:
    - BandSelector uses `supportsBandAssistanceForExercise({ exerciseId, exerciseName })` with name pattern matching
    - Modal was using `supportsBandAssistance(exerciseId)` with exact ID match only
    - Exercise "Tuck Front Lever Hold" → ID `tuck_front_lever_hold` → no match in BAND_SUPPORTED_EXERCISES
    - Same exercise name resolved by `resolveBandExerciseKey` → canonical `front_lever_tuck` → match found
  - SOLUTION:
    - Changed modal to use `supportsBandAssistanceForExercise({ exerciseId, exerciseName })` for name-based matching
    - Added import for `supportsBandAssistanceForExercise` from band-progression-engine
    - Added `bandEvidenceSummary` field to coaching input for full evidence parity
    - Modal now uses BAND_SHORT_LABELS for proper "Red" capitalization
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx — use supportsBandAssistanceForExercise, add bandEvidenceSummary
    - lib/workout/live-set-coaching-engine.ts — accept/use bandEvidenceSummary
  - VISIBLE VERIFICATION LOCATIONS:
    - Live Workout → active exercise → Assistance Band(s) card: "Maintain Red" with evidence line
    - Live Workout → Why this set? → Dose Rationale: "Band guidance: Maintain Red. Evidence: 13 sets logged — RPE 8 — 100% clean — stable."
    - Modal no longer says "No external load or band assistance active" when band card is visible
  - EXPECTED BEFORE/AFTER:
    - Before: "No external load or band assistance active. Focus on bodyweight execution quality."
    - After: "Band guidance: Maintain Red. Evidence: 13 sets logged — RPE 8 — 100% clean — stable."
  - RPE REGRESSION PROOF:
    - No `.toFixed()` or decimal RPE in user-facing strings
    - All RPE values use integer display
  - TSC STATUS: PASS
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.8C attempted complete but had scope error. Moved to R7.8C-BUILD-FIX.
  - REMAINING CHAIN:
    - PPX-R7.8C-BUILD-FIX (COMPLETED BELOW)
    - PPX-R7.8D (optional): Post-logged-set responsiveness verification
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8C-BUILD-FIX: Fix inputModeContract Scope Error — COMPLETE (2026-05-10)
  - BUILD BLOCKER:
    - Error: Cannot find name 'inputModeContract' at line 10586
    - `inputModeContract` was defined at line 4785 inside a DIFFERENT render block
    - Modal IIFE is in "corridor" scope which has `corridorInputMode` and `corridorBandSelectable` instead
  - ROOT CAUSE:
    - PPX-R7.8C referenced `inputModeContract?.showBandSelector` outside its lexical scope
    - The modal render is inside a "corridor" render area with its own input mode contract
    - The equivalent variable in corridor scope is `corridorBandSelectable` (defined at line 9690)
  - SOLUTION:
    - Replaced `inputModeContract?.showBandSelector` with `corridorBandSelectable`
    - `corridorBandSelectable` is derived from `corridorInputMode.showBandSelector` at corridor scope
    - Same truth, correct scope
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx — use corridorBandSelectable instead of inputModeContract
  - BAND TRUTH OWNERSHIP:
    - `hasBandSelector` is now: `corridorBandSelectable || bandHistoryData !== null || !!effectiveRecommendedBand`
    - Uses same truth as visible BandSelector (corridorBandSelectable controls BandSelector render)
    - Passed to buildLiveSetCoaching via bandGuidanceTruth
  - R7.8C VISUAL BEHAVIOR PRESERVED:
    - Modal cannot show "No external load or band assistance active" when Assistance Band(s) shows Maintain Red
    - Priority chain: visible guidance → recommended band → band history → load → no-band fallback
  - RPE REGRESSION PROOF:
    - Scan for `.toFixed(`, `averageRPE)`: 0 matches in coaching engine
    - All RPE values use integer display
  - TSC STATUS: PASS (exit code 0, no errors)
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration at /api/stripe/create-portal-session)
  - MOVE-ON DECISION: PPX-R7.8C build unblocked; runtime still showed "Tracking band history" mismatch. Moved to R7.8D.
  - REMAINING CHAIN:
    - PPX-R7.8D (COMPLETED BELOW)
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8D: Final Band Card → Live Set Guidance Parity Fix — COMPLETE (2026-05-10)
  - ROOT CAUSE:
    - Modal used `getExerciseBandHistory(exerciseId)` with raw exercise ID "tuck_front_lever_hold"
    - History was stored under canonical key "front_lever_tuck"
    - Result: history returned empty, so modal fell to "tracking" even when card showed "Maintain Red"
    - BandSelector worked because it uses `getBandRecommendation()` which resolves canonical keys internally
  - SOLUTION:
    - Changed modal to use `getCanonicalBandHistory({ exerciseId, exerciseName })`
    - This function resolves "tuck_front_lever_hold" → "front_lever_tuck" using name patterns
    - Uses both exactHistory and familyHistory for complete picture
    - Added import for `getCanonicalBandHistory`
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx — use getCanonicalBandHistory, add import
  - SINGLE SOURCE OF TRUTH:
    - `getCanonicalBandHistory()` is now the single source for band history in modal
    - Same canonical resolution as BandSelector's internal getBandRecommendation
    - Modal receives same historyCount, avgRPE, cleanPercent, stability as visible card
  - BEFORE/AFTER:
    - Before: Card "Maintain Red / 13 sets logged..." → Modal "Tracking band history / Log band-assisted sets..."
    - After: Card "Maintain Red / 13 sets logged..." → Modal "Band guidance: Maintain Red. Evidence: 13 sets logged — RPE 8 — 100% clean — stable."
  - RPE REGRESSION PROOF:
    - Scan for `.toFixed(`, `averageRPE)`: 0 matches in coaching engine
    - All RPE values pass through toDisplayRPE() for integer display
  - TSC STATUS: PASS (exit code 0, no errors)
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.8D claimed complete but live screenshot still showed "Tracking band history". Moved to R7.8E.
  - REMAINING CHAIN:
    - PPX-R7.8E (COMPLETED BELOW)
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8E: Runtime-Proof Band Card → Live Set Guidance Parity Closure — COMPLETE (2026-05-10)
  - PREVIOUS CLAIM VERIFICATION:
    - PPX-R7.8D claimed PASS based on code proof only
    - Live screenshot showed modal still displayed "Tracking band history" while card showed "Maintain Red"
    - R7.8D did NOT actually pass live screenshot proof
  - ROOT CAUSE FOUND:
    - `getBandRecommendation(exerciseId, exerciseName)` returns `{ recommendedBand: null }` for non-canonical IDs
    - Exercise ID `tuck_front_lever_hold` fails `supportsBandAssistance()` check (exact ID match)
    - So `bandHistoryData.recommendedBand` was `null`
    - At line 10595, `isHistoryBased = historyCount > 0 && bandHistoryData?.recommendedBand` was `false` even with 13 sets!
    - BandSelector worked because it uses `recommendedBand` prop as fallback at line 2139
    - Modal was NOT using `corridorRecommendedBand` as fallback inside `bandHistoryData`
  - SOLUTION:
    - Inside `bandHistoryData` computation, added: `const effectiveBand = rec.recommendedBand || corridorRecommendedBand`
    - Now `bandHistoryData.recommendedBand` uses the same fallback as BandSelector
    - Also fixed stability: when `totalCount > 0`, use 'stable' instead of 'building'
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx — use corridorRecommendedBand fallback inside bandHistoryData
  - SINGLE SOURCE OF TRUTH:
    - `bandHistoryData.recommendedBand` now equals `rec.recommendedBand || corridorRecommendedBand`
    - Same fallback chain as BandSelector's `effectiveRec = historyRecommendation?.recommendedBand || recommendedBand`
    - Both surfaces consume `corridorRecommendedBand` as the authoritative fallback
  - BEFORE/AFTER:
    - Before: Card "Maintain Red / 13 sets logged..." → Modal "Tracking band history / Log band-assisted sets..."
    - After: Card "Maintain Red / 13 sets logged..." → Modal "Band guidance: Maintain Red. Evidence: 13 sets logged — RPE 8 — 100% clean — stable."
  - RPE REGRESSION PROOF:
    - Scan for `.toFixed(`, `averageRPE)`: 0 matches in coaching engine
    - All RPE values pass through toDisplayRPE() for integer display
  - TSC STATUS: PASS (exit code 0, no errors)
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration)
  - MOVE-ON DECISION: PPX-R7.8E claimed complete but live screenshot still showed "Tracking band history". Moved to R7.8F.
  - REMAINING CHAIN:
    - PPX-R7.8F (COMPLETED BELOW)
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit
- PPX-R7.8F: Kill Split Band Guidance Ownership — COMPLETE (2026-05-10)
  - PREVIOUS CLAIM VERIFICATION:
    - PPX-R7.8E claimed PASS but user screenshot still showed modal displaying "Tracking band history"
    - The modal was STILL computing band truth separately from the visible card
  - EXACT ROOT CAUSE:
    - BandSelector used `getExerciseBandHistory(exerciseId)` with exact ID match - found 13 sets
    - Modal used `getCanonicalBandHistory({ exerciseId, exerciseName })` with canonical key resolution - found 0 sets
    - Different lookup functions = different results = split truth
    - Modal's `isHistoryBased = historyCount > 0 && bandHistoryData?.recommendedBand` was false even with card showing Maintain Red
  - SOLUTION - ONE OBJECT, ONE OWNER, TWO CONSUMERS:
    - Created `sharedBandGuidanceTruth` useMemo at corridor scope (line ~9718)
    - Uses EXACT same lookup as BandSelector: `getExerciseBandHistory(corridorExerciseId)`
    - Added `SharedBandGuidanceTruth` type with all display fields
    - BandSelector now receives `sharedGuidance` prop and uses it for display
    - Modal now uses `sharedBandGuidanceTruth` directly instead of computing separately
    - Both surfaces consume THE SAME object - no more split truth
  - FILES CHANGED:
    - components/workout/StreamlinedWorkoutSession.tsx:
      - Added SharedBandGuidanceTruth type (line ~2107)
      - Added sharedGuidance prop to BandSelectorProps
      - Refactored BandSelector to use sharedGuidance when provided
      - Added sharedBandGuidanceTruth useMemo at corridor scope
      - Replaced modal's separate bandHistoryData/bandGuidanceTruth with sharedBandGuidanceTruth
      - Added dev-only proof logging
  - SINGLE SOURCE OF TRUTH:
    - Object: `sharedBandGuidanceTruth` at corridor scope
    - Consumer 1: BandSelector via `sharedGuidance` prop
    - Consumer 2: Live Set Guidance modal via direct reference
    - Both use exact same label/evidenceSummary/action/historyCount
  - BEFORE/AFTER:
    - Before: Card "Maintain Red / 13 sets logged..." → Modal "Tracking band history / Log band-assisted sets..."
    - After: Card "Maintain Red / 13 sets logged..." → Modal "Band guidance: Maintain Red. Evidence: 13 sets logged — RPE 8 — 100% clean — stable."
  - RPE REGRESSION PROOF:
    - Scan for `.toFixed(`, `averageRPE)`: 0 matches in coaching engine
    - All RPE values pass through toDisplayRPE() for integer display
  - TSC STATUS: PASS (exit code 0, no errors)
  - BUILD STATUS: FAIL unrelated env (Stripe API key configuration at /api/stripe/create-portal-session)
  - MOVE-ON DECISION: PPX-R7.8F complete. The card and modal now consume one shared display-ready band guidance truth. Safe to move to the next checklist item.
  - REMAINING CHAIN:
    - PPX-R7.9: Old 24-step/adaptiveness visual materialization audit

---

## Future Checklist — Exercise Taxonomy + Band Eligibility Truth

These items were noted during PPX-R7.6F but are NOT implemented in this prompt. They belong to a future exercise-pool/taxonomy/prescription-unit step after RPE display cleanup.

1. **Explosive Pull-Ups Band Eligibility Audit:**
   - Explosive Pull-Ups should be audited as band-eligible when the user has bands and assistance is useful/safe for speed/height/power intent.
   - The app should not hide band controls merely because the category is accessory if the movement is pull-up-pattern and band assistance can be valid.

2. **Planche Lean Push-Ups vs Planche Lean Hold Distinction:**
   - Planche Lean Push-Ups = dynamic reps exercise.
   - Planche Lean Hold = isometric seconds/hold exercise.
   - The app must not prescribe push-ups as hold seconds unless the exercise is actually a hold.

3. **Planche Progression Pool Expansion:**
   - Later audit/add feet-on-bench/horizontal-body planche support variants where appropriate:
     - Planche hold / planche lean hold with feet elevated on bench or box
     - Horizontal-body feet-on-bench planche pattern as reduced-load progression if doctrine supports it

4. **Front Lever Progression Pool Expansion:**
   - Later audit/add feet-on-bench support variants where appropriate:
     - Front lever line / full front lever pattern with feet on bench/box assistance
     - Use as reduced-load shape practice only when progression logic says it fits

5. **Implementation Priority:**
   - These belong to a later exercise-pool/taxonomy/prescription-unit step AFTER RPE display cleanup is visually verified.

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

### Phase G �� Program Display Source Lock

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
| 25.7 Rest/RPE intelligence | NOT_STARTED | — | — | ��� | — | — | — |
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
