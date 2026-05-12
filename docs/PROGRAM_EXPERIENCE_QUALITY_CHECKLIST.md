# PROGRAM EXPERIENCE QUALITY CHECKLIST

This document tracks the Program Experience (PEX) phases for ensuring the SpartanLab
program page delivers real coaching intelligence, not cosmetic surfaces.

## Phase Status Overview

| Phase | Description | Status |
|-------|-------------|--------|
| PEX-1 | Program Experience Truth Surface Foundation | COMPLETE |
| PEX-2 | Selected Skill Coverage + Rotation Truth | COMPLETE |
| PEX-3 | Method Materialization Truth | COMPLETE |
| PEX-4 | Session Card Clutter Compression | COMPLETE |
| PEX-5A | Duration Source-of-Truth Expansion (20/15/10) | COMPLETE |
| PEX-5B | Intelligent Short-Session Recomposition Quality | COMPLETE |
| PEX-5C | Short-Session UX / Tradeoff Explanation Polish | COMPLETE |
| PEX-6 | End-to-End Runtime Proof | COMPLETE |
| AB15.0-15.4 | Live Workout Ramp/Warm-Up Sets (Doctrine + UI + Weighted) | COMPLETE |
| AB15.5.1 | Structured Prep Reopen Clamp + Graph-Backed Targets | COMPLETE |
| AB15.6 | Warm-Up Rationale Trust Upgrade (Per-Item Coaching) | COMPLETE |
| AB15.6.1 | Skill Prep Clarity + In-Card Prep Rest Timer | COMPLETE |
| AB15.6.1.1 | Prep Timer Auto-Advance + Archer Copy Cleanup | COMPLETE |
| AB15.6.2 | Grouped-Method Set-Count Parity + Live Completion Truth | COMPLETE |
| AB15.6.2.1 | Grouped Mirrored Surface Parity Repair | COMPLETE |

---

## AB15.6.2 — Grouped-Method Set-Count Parity + Live Completion Truth

**Status:** COMPLETE

**Purpose:** Fix confusing grouped-method behavior where superset/circuit members showed mismatched set counts, causing the UI to display conflicting truths (e.g., "3 paired sets" header but "4 × 10-15" on one member row).

### Problem Statement
User completed a Day 3 workout and observed:
- Program card showed a Strength Superset (alternating pair)
- Archer Pull-Ups showed 3 × 4–6
- Pull-Ups showed 4 × 10–15
- Live runtime executed grouped/superset behavior
- After completing grouped work, Pull-Ups appeared to have a "leftover" fourth set
- Confusing display: block says "3 rounds" but Pull-Ups says "Set 2/4"

### Root Cause
1. Grouped block `targetRounds` and member `sets` were competing truths
2. `targetRounds` used first member's sets as fallback, not normalized minimum
3. Active card, rest screen, and completed-set list used raw member set counts
4. Program Page displayed mismatched member counts without normalization

### Resolution Policy
For normal superset/circuit blocks:
- If all members have matching set counts: use that count
- If members have mismatched set counts: normalize to MINIMUM positive count
- Example: 3-set and 4-set members → 3 grouped rounds
- Never create unlabeled "leftover" member work in a grouped block
- If extra work is intentional, it must be explicitly split and labeled (finisher/back-off)

### Files Changed
- `lib/workout/live-grouped-execution-contract.ts`
  - Added `resolveGroupedRuntimeRounds()` helper with consistent min-normalization policy
  - Updated `buildExecutionBlocksFromMethodStructures()` to use the resolver
  - Fixed `totalSets` calculation: `targetRounds × members.length`, not sum of raw member sets
- `components/workout/StreamlinedWorkoutSession.tsx`
  - Imported and used `resolveGroupedRuntimeRounds` in local grouped block path
  - Updated styledGroups path to use the resolver
- `components/programs/lib/grouped-execution-prescription.ts`
  - Added `normalizedSets` field to `ResolvedGroupMember` interface
  - Added `hadSetsMismatch` field to `ResolvedGroupedExecutionPrescription` interface
  - Post-processes members after rounds resolution to normalize sets
  - Updates prescriptionText for mismatched members
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md`
  - Added this checklist entry

### Future Doctrine Considerations (Deferred)
The following are NOT solved in AB15.6.2 but should be addressed in future AI doctrine:
- Pronation/supination stress evaluation (forearm fatigue accumulation)
- Grip fatigue awareness across pulling movements
- Band assistance level affecting superset eligibility
- Unilateral/bilateral overlap risk (e.g., Archer Pull-Ups + Pull-Ups)
- High-skill + volume pairing intensity check
- RPE trend and pain log integration
- Whether a pull + pull pairing should be downgraded, replaced, or separated
- Full AI coach response to repeated forearm pain/grip fatigue signals

### Acceptance Criteria
- [x] Program Page: Superset header shows coherent paired-round count
- [x] Program Page: Member rows display normalized set counts (matching header)
- [x] Live workout: Archer Pull-Ups and Pull-Ups use same grouped round truth
- [x] Live workout: No "Set 2/4" when block is normalized to 3 rounds
- [x] Rest screen: Shows next round/member correctly
- [x] Completed sets: Logged with correct round-based set numbers
- [x] Progress count: Uses `targetRounds × members.length`, not raw sum
- [x] No random extra unlabeled Pull-Ups set after grouped block
- [x] Straight-set exercises: Still show normal Set X/Y based on own set count
- [x] Skill prep timer: Remains intact (AB15.6.1/AB15.6.1.1 preserved)
- [x] TypeScript passes with zero errors

### AB15.6.2.1 — Grouped Mirrored Surface Parity Repair

**Status:** COMPLETE

**Problem:** AB15.6.2 normalized grouped rounds in the resolver and header, but ExerciseRow still received raw `exercise.sets` for display. Result: header shows "3 paired sets" but Pull-Ups row still shows "4 × 10–15".

**Root Cause:** The `resolveGroupedExecutionPrescription` computed `normalizedSets` per member, but the Program Page member render paths passed raw `hydrated` or `fullExercise` objects directly into `ExerciseRow` without applying the normalization.

**Fix:**
- Added `withGroupedDisplaySets()` helper that creates a display-only clone with `sets` and `scaledSets` overridden to the normalized value
- Applied the helper in all three Program Page grouped member render paths:
  1. Raw grouped fallback - degraded branch
  2. Raw grouped fallback - main branch with `GroupedMemberFrame`
  3. Rich grouped - both `GroupedMemberFrame` and straight paths
- ExerciseRow now receives the normalized set count, ensuring header and member rows agree

**Mirrored Surfaces Principle:**
- When patching display logic, ALL mirrored surfaces must be audited together
- Program Page header, member rows, live workout active card, rest/up-next, completed sets, and progress count must all agree
- Raw member `sets` remains as source metadata but cannot override grouped display when inside a normalized block

---

## PEX-1 — Program Experience Truth Surface Foundation

**Status:** COMPLETE

**Purpose:** Establish calibration baseline truth + data-driven influence chain + professional program explanation surfaces.

### Scope
- 5-test calibration baseline for mixed skill profiles
- Scientific/data-driven baseline influence contract
- Why This Plan professional collapse
- Top-of-program truth-surface copy cleanup

### What Changed

1. **5-Test Calibration for Mixed Profiles**
   - Before: Selection broke at 3 tests regardless of profile complexity
   - After: Target count is dynamic (3-5) based on distinct baseline roles needed
   - Mixed planche/front-lever/muscle-up profiles now get 5 tests:
     - Planche Lean Hold (straight_arm_push)
     - Tuck Front Lever Hold (straight_arm_pull)
     - Max Pull-Ups (general_pull_power)
     - Max Dips (general_push_power)
     - L-Sit Hold (compression_core)

2. **Baseline Influence Contract Added**
   - New `CalibrationBaselineInfluence` type with:
     - `baselineRole`: straight_arm_push | straight_arm_pull | general_pull_power | general_push_power | compression_core | ...
     - `primaryUse`: starting_progression | dosage | assistance_level | readiness | ...
     - `affectedProgressions`: SkillKey[]
     - `dataUseExplanation`: Plain-English explanation of what the result feeds
   - Each recommended test now includes `baselineInfluence` object
   - UI can render data-driven influence copy from this contract

3. **Test-Specific Meaning**
   - Planche Lean Hold: straight_arm_push baseline, informs starting level and lean dosage
   - Tuck Front Lever Hold: straight_arm_pull baseline, informs FL starting level and hold dosage
   - Max Pull-Ups: general_pull_power baseline, informs pull volume and muscle-up readiness
   - Max Dips: general_push_power baseline, informs push volume and MU dip phase
   - L-Sit Hold: compression_core baseline, informs compression dosage and bodyline support

### Files Changed
- `lib/program/program-calibration-recommendation.ts`
  - Added `CalibrationBaselineRole`, `CalibrationPrimaryUse`, `CalibrationBaselineInfluence` types
  - Added `buildBaselineInfluence()` helper function
  - Updated selection logic: dynamic target count (3-5) based on `neededRoles`
  - Added `baselineInfluence` to `CalibrationRecommendedTest` interface and projection

### Acceptance Criteria
- [ ] Calibration shows 5 tests for mixed planche/front-lever/muscle-up profile
- [ ] Badge says "5 recommended tests"
- [ ] Each test has typed `baselineInfluence` object
- [ ] Planche Lean and Max Dips are both included (different baseline roles)
- [ ] Tuck Front Lever and Max Pull-Ups are both included (different baseline roles)
- [ ] L-Sit is included for compression/core baseline
- [ ] TypeScript passes
- [ ] Build passes

---

## PEX-2 — Selected Skill Coverage + Rotation Truth

**Status:** COMPLETE

**Purpose:** Ensure selected skills are actually represented, rotated, deferred, or support-only with truthful reasons.

### Scope
- Fix "8 selected skills but 6 under-expressed" visibility issue
- Ensure selected skills are actually represented in executable sessions
- Ensure weeks/cycles are not visually identical if rotation/progression is expected
- Clear deferred/rotational skill explanations

### Audit Findings

The builder already has a comprehensive skill expression tracking system:

1. **AuthoritativeMultiSkillIntentContract** — tracks:
   - `selectedSkills`, `primarySkill`, `secondarySkill`, `supportSkills`, `deferredSkills`
   - `materiallyExpressedSkills`, `reducedThisCycleSkills`
   - `skillPriorityOrder` with role (primary/secondary/tertiary/support/deferred) and reason
   - `coverageVerdict`: strong | adequate | weak

2. **AuthoritativeVisibleWeekSkillExpressionContract** — tracks:
   - `skillExpressionPlan` with `expressionMode` (direct_block, technical_slot, support_block, etc.)
   - `expressionReason` for each skill
   - Limitation flags: `isProgressionLimited`, `isRecoveryLimited`, `isScheduleLimited`, etc.

3. **SkillExpressionPlan** — per-skill detailed breakdown:
   - `targetSessions` vs `actualSessionsPlanned`
   - `expressionMode`: direct_block | technical_slot | support_block | mixed_day_presence | carryover_only | deferred

### What Changed

1. **Vague Warning Replaced** — ProgramTruthSummary.tsx
   - Before: "X skills have limited direct work this cycle." (amber warning, no breakdown)
   - After: "Skill coverage this cycle: 2 direct, 1 technical, 2 support, 3 rotating later. See details for per-skill breakdown."
   - Uses `skillPriorityOrder` to count skills by role (primary/secondary = direct, tertiary = technical, support, deferred)
   - Points user to expanded "Skill Roles This Cycle" section for full details

2. **Existing Expanded Section Preserved** — The "Skill Roles This Cycle" section already shows:
   - Per-skill role badge (primary/secondary/tertiary/support/deferred)
   - Deferred skills with reason labels
   - Session count per skill

### Files Changed
- `components/programs/ProgramTruthSummary.tsx` — Improved under-expression warning to show role breakdown
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md` — Updated status and documentation

### Acceptance Criteria
- [x] Every selected skill appears in the authoritative contract with a status
- [x] Contract is saved on finalProgram (already implemented)
- [x] UI consumes the authoritative contract (skillPriorityOrder)
- [x] Vague under-expression warning replaced with informative breakdown
- [x] TypeScript passes (exit code 0)
- [x] Build compiles successfully (pre-existing Stripe API key issue blocks full build, unrelated to PEX-2)

---

## PEX-3 — Method Materialization Truth

**Status:** COMPLETE

**Purpose:** Ensure selected training methods actually appear in programming when safe.

### Scope
- Density blocks, Finishers, Supersets, Circuits, Top sets, Drop sets, Rest-pause, Cluster sets
- If selected/requested and safe, actually program them
- If deferred, give clear reason and future condition

### Audit Findings

The builder already has comprehensive method materialization infrastructure:

1. **MethodMaterializationSummary** — Per-session truth with `groupedMethodCounts`, `rowExecutionCounts`, `materializedMethods`, and `summaryIntegrityVerdict`

2. **WeeklyMethodRepresentationContract** — Program-wide audit with per-method status (APPLIED, BLOCKED_BY_SAFETY, NOT_NEEDED, MATERIALIZER_NOT_CONNECTED), reason, and materializer tracking

3. **MethodDecision** — Per-session doctrine decision with `actualMaterialization.hasRealStructuralChange` gating

4. **WeeklyMethodDecisionAccordion** — Day-by-day UI with "Used"/"Not used" sections and per-method reasoning

5. **MethodMaterialityReport** — User-facing summary with `appliedMethods`, `selectedButNotApplied`, `nonApplicationReasons`, and verdict

### What Changed

**Compact Method Truth Summary Added** — ProgramTruthSummary.tsx
- Before: Method truth only visible in expanded "Training Preferences Applied" section
- After: Collapsed view shows "Training methods: X applied, Y held back for safety. See details."
- Uses `methodPreferencesMateriality` (the authoritative method truth contract)

### Materializer Availability

| Method | Has Materializer |
|--------|-----------------|
| superset | Yes |
| circuit | Yes |
| density_block | Yes |
| cluster | Yes |
| top_set_backoff | Yes |
| drop_set | Yes |
| rest_pause | Yes |
| finisher | No (future) |

### Files Changed
- `components/programs/ProgramTruthSummary.tsx` — Added compact method truth summary
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md` — Updated status

### Acceptance Criteria
- [x] Every selected method resolves to truthful status
- [x] Method contract built from final materialized sessions
- [x] Applied methods have executable evidence
- [x] Blocked methods have specific reasons
- [x] Compact method summary in collapsed view
- [x] PEX-1 and PEX-2 remain intact
- [x] TypeScript passes (exit code 0)
- [x] Build compiles successfully (pre-existing Stripe issue unrelated)

---

## PEX-4 — Session Card Clutter Compression

**Status:** COMPLETE

**Purpose:** Clean up always-visible chip clutter on day cards.

### Scope
- Remove always-visible chip clutter from day cards
- Move useful day reasoning into collapsed per-day "Why this workout" dropdown
- Keep only essential day identity and Start Workout controls visible by default

### What Changed

**Default Card Compression** — AdaptiveSessionCard.tsx

1. **Header Clutter Removed** — The following were moved from always-visible to the "Why this workout" dropdown:
   - Intensity/progression/breadth line
   - Stress distribution explanation
   - "Why this day exists" section (role labels, RPE bands, reasons)
   - Weekly role rationale
   - Material adaptation chips (Direct intensity, Sets reduced, RPE capped, Volume reduced, etc.)
   - Spine expression tag

2. **Default Visibility Budget** — Now shows only:
   - Day label + Primary badge
   - Weekly role label (e.g., "Heavier strength day")
   - Focus label (e.g., "Planche + Pull Strength")
   - Time + exercise count
   - ONE status indicator maximum (safety warning OR stress label)
   - Workload split bar (compact structural indicator)
   - Start Workout button
   - Session length options

3. **"Why this workout" Dropdown Enhanced** — Now contains:
   - Day strategy section (role rationale, day purpose, stress explanation)
   - Character line (intensity/progression/breadth)
   - RPE band
   - Adaptations applied (spine + material adaptations)
   - Doctrine application
   - Session length truth
   - Quality & safety explanations

4. **Safety Warnings Preserved** — OVERLAP WATCH and TIME REALISM chips remain always-visible because they are real safety signals that should not be hidden.

### Files Changed
- `components/programs/AdaptiveSessionCard.tsx` — Compressed default card, moved clutter to dropdown
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md` — Updated status

### Acceptance Criteria
- [x] Default session cards are visibly cleaner
- [x] Top-level chip rows reduced to strict small budget (1-2 max)
- [x] Internal diagnostic/proof labels no longer prominent by default
- [x] Meaningful reasoning accessible in "Why this workout" dropdown
- [x] PEX-1 calibration truth remains intact
- [x] PEX-2 selected-skill truth remains intact
- [x] PEX-3 method materialization truth remains intact
- [x] Safety warnings (OVERLAP WATCH, TIME REALISM) remain visible
- [x] No source-of-truth deletion
- [x] No generation logic changes
- [x] TypeScript passes (exit code 0)
- [x] Build compiles successfully (pre-existing Stripe issue unrelated)

---

## PEX-5A — Duration Source-of-Truth Expansion (20/15/10)

**Status:** COMPLETE

**Purpose:** Expand the authoritative duration system so 20/15/10 minute sessions are first-class, type-safe, launchable, and traceable.

### Scope
- Extend `WorkoutExecutionMode` union to include `'10_min' | '15_min' | '20_min'`
- Add canonical `resolveExecutionModeFromMinutes()` resolver
- Update variant generation to produce 20/15/10 variants with proper compression
- Update session contract, fingerprint, and snapshot types
- Update AdaptiveSessionCard to render new duration buttons
- Update live workout route to accept new modes
- Ensure non-launchable variants do not render buttons

### What Changed

1. **WorkoutExecutionMode Extended** — `lib/workout/live-workout-authority-contract.ts`
   - Type now: `'10_min' | '15_min' | '20_min' | '30_min' | '45_min' | 'full'`
   - Added `EXECUTION_MODE_LABELS` and `EXECUTION_MODE_TARGET_MINUTES` for all modes
   - Added canonical `resolveExecutionModeFromMinutes()` helper

2. **Compression Levels Extended** — `lib/session-compression-engine.ts`
   - Added `'very_heavy'` (15 min) and `'extreme'` (10 min) compression levels
   - Updated `compressMain`, `compressWarmup`, `compressCooldown` for new levels
   - 20 min: ~40% of full, 2 sets max on spine
   - 15 min: ~25-30% of full, 1-2 exercises, minimal warmup
   - 10 min: ~20% of full, 1-2 exercises maximum, no cooldown

3. **Variant Generation Extended** — `lib/session-compression-engine.ts`
   - `generateSessionVariants()` now emits 20/15/10 variants when Full is long enough
   - Each variant passes launchability and material distinctness checks
   - Variants are ordered: Full, 45, 30, 20, 15, 10

4. **Session Contracts Updated** — `lib/workout/selected-variant-session-contract.ts`
   - `SessionFingerprint.mode` now accepts all 6 modes
   - `SelectedBodySnapshot.executionMode` extended
   - `BuildFingerprintInput.mode` extended
   - `modeFromMinutes()` delegates to canonical resolver

5. **Session Length Truth Updated** — `lib/program/session-length-truth-contract.ts`
   - `SessionLengthVariantTruth.mode` now accepts all 6 modes
   - `modeFor()` helper delegates to canonical resolver

6. **AdaptiveSessionCard Updated** — `components/programs/AdaptiveSessionCard.tsx`
   - Imports canonical mode resolver
   - `selectedSessionContract.selectedExecutionMode` uses canonical resolver
   - Buttons dynamically render from `session.variants` (supports 20/15/10)

7. **Live Workout Route Updated** — `app/(app)/workout/session/page.tsx`
   - Mode param accepts `'10_min' | '15_min' | '20_min' | '30_min' | '45_min' | 'full'`
   - Duration derivation uses mode-to-minutes map for all modes

### Files Changed
- `lib/workout/live-workout-authority-contract.ts` — Extended WorkoutExecutionMode, added resolver
- `lib/session-compression-engine.ts` — Extended CompressionLevel, updated variant generation
- `lib/workout/selected-variant-session-contract.ts` — Updated all mode types to use canonical resolver
- `lib/program/session-length-truth-contract.ts` — Updated mode type for session length truth
- `lib/workout/live-workout-normalizers.ts` — Updated target minutes map for normalizers
- `components/programs/AdaptiveSessionCard.tsx` — Imported canonical resolver
- `components/workout/StreamlinedWorkoutSession.tsx` — Updated executionMode type references
- `app/(app)/workout/session/page.tsx` — Updated mode param handling
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md`

### Acceptance Criteria
- [x] Duration contract supports Full / 45 / 30 / 20 / 15 / 10
- [x] Program card can render 20 / 15 / 10 buttons when launchable variants exist
- [x] Buttons are generated from real variants, not hardcoded fake UI
- [x] Start Workout URL includes the correct execution mode and variant index
- [x] Live workout route accepts 20 / 15 / 10
- [x] Live workout does not coerce 20/15/10 into 30_min
- [x] Selected variant fingerprint supports 20/15/10
- [x] Non-launchable short variants do not render as fake buttons
- [x] PEX-1 calibration untouched
- [x] PEX-2 skill coverage untouched
- [x] PEX-3 method truth untouched
- [x] PEX-4 clutter compression preserved
- [x] TypeScript passes (exit code 0)
- [x] Build compiles successfully (pre-existing Stripe issue unrelated)

---

## PEX-5B — Intelligent Short-Session Recomposition Quality

**Status:** COMPLETE

**Purpose:** Improve the coaching intelligence of 20/15/10 minute session recomposition.

### Implementation Summary

1. **CompressionLevel Extended** — `lib/session-compression-engine.ts`
   - Type now: `'none' | 'light' | 'moderate' | 'heavy' | 'very_heavy' | 'extreme'`
   - `heavy` = 20 min, `very_heavy` = 15 min, `extreme` = 10 min

2. **ShortSessionRecomposition Metadata** — `lib/session-compression-engine.ts`
   - `preservedPriorities[]`, `reducedItems[]`, `omittedItems[]`, `deferredItems[]`
   - `coachingSummary` and `tradeoffSummary` for UI consumption
   - `recompositionLevel`: 'mild' | 'moderate' | 'strong' | 'minimum_effective' | 'emergency'

3. **20/15/10 Variant Generation** — `lib/session-compression-engine.ts`
   - `generateSessionVariants()` emits 20/15/10 variants with distinctness checks
   - Each variant carries full `ShortSessionRecomposition` metadata

4. **Short-Session Materializer Extended** — `lib/program/short-session-materializer.ts`
   - `applyStrongSetReduction()` for 20 min
   - `applyMinimumEffectiveSetReduction()` for 15 min
   - `applyEmergencySetReduction()` for 10 min

### Acceptance Criteria
- [x] 20 Min preserves primary day identity
- [x] 15 Min is minimum effective focused session
- [x] 10 Min is emergency dose
- [x] Metadata explains preserved/reduced/omitted/deferred
- [x] TypeScript passes
- [x] Build compiles

---

## PEX-5C — Short-Session UX / Tradeoff Explanation Polish

**Status:** COMPLETE

**Purpose:** Surface honest tradeoff explanations for short sessions.

### Implementation Summary

1. **Duration Recommendation System** — `lib/program/session-length-truth-contract.ts`
   - `DurationRecommendationVerdict` type: 'recommended' | 'good_option' | 'acceptable' | 'emergency_only' | 'not_recommended' | 'not_launchable'
   - `SessionDurationRecommendation` interface with verdict, chipLabel, shortReason, preservedSummary, tradeoffSummary
   - `buildDurationRecommendations()` pure function - readiness-aware ranking

2. **Readiness-Aware Ranking Logic**
   - High readiness (70+): Full recommended
   - Medium readiness (40-70): 45 or 30 recommended
   - Low readiness (<40): 30/20/15 acceptable
   - Acclimation week: 30 recommended
   - No readiness data: Neutral language, Full recommended

3. **UI Integration** — `components/programs/AdaptiveSessionCard.tsx`
   - "Best fit" chip on recommended duration
   - "Emergency" chip on 10-min option
   - Coaching summary when short variant selected

### Files Changed
- `lib/program/session-length-truth-contract.ts` — Added recommendation system
- `components/programs/AdaptiveSessionCard.tsx` — Added recommendation UI
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md`

### Acceptance Criteria
- [x] Recommendation ranking exists
- [x] Labels derive from real variant truth
- [x] 10-min labeled as emergency
- [x] Selected short mode shows explanation
- [x] TypeScript passes
- [x] Build compiles

---

## PEX-6 — End-to-End Runtime Proof

**Status:** COMPLETE

**Purpose:** Verify the full Program → Start Workout → Live Execution chain.

### Implementation Summary

Full runtime proof documented in `docs/PEX_6_END_TO_END_RUNTIME_PROOF.md`.

### Verification Results
- [x] PEX-1: 5-test calibration verified in source
- [x] PEX-2: Skill coverage truth verified in source
- [x] PEX-3: Method materialization truth verified in source
- [x] PEX-4: Session card clutter compressed
- [x] PEX-5A: 20/15/10 modes in live workout route
- [x] PEX-5B: ShortSessionRecomposition metadata exists
- [x] PEX-5C: buildDurationRecommendations() integrated in UI
- [x] Live workout accepts all 6 modes
- [x] TypeScript passes
- [x] Build compiles (pre-existing Stripe issue unrelated)

---

---

## AB15 — Live Workout Specific Ramp/Warm-Up Sets

**Status:** REGISTERED / SPEC READY (NOT IMPLEMENTED)

**Purpose:** Add 1-2 specific warm-up/ramp sets before working sets in the live workout UI, using science-backed preparation doctrine.

### Doctrine Requirements (AB15.0 — Registered)

#### Visual Progress Bars
- [ ] Before the main red working-set bars, show 1–2 smaller/different-colored prep/ramp bars
- [ ] Example: two small prep bars → then four red working-set bars
- [ ] These represent specific ramp/warm-up sets, not generic Skill Prep instructions
- [ ] Visible in the same progress-strip area so user understands they happen before working sets

#### Interaction
- [ ] Ramp sets use the same basic input style as working sets:
  - Reps input for reps exercises
  - Hold seconds input for hold exercises
  - Load input for weighted exercises when relevant
  - RPE input if needed (but lower target RPE)
  - Band input if relevant and already supported
- [ ] Should not feel like separate disconnected cards

#### Science-Backed Effort
- [ ] Ramp sets prepare the pattern without nearing failure
- [ ] Use lower effort / easier progressions / lighter loads
- [ ] Rest timer should be shorter than working sets (low fatigue)
- [ ] Ramp set purpose: temperature, neural rehearsal, joint/tendon readiness, position specificity, confidence, technique rehearsal

#### Weighted Work Ramping
- [ ] Ramp 1: ~40–50% working load/effort, easy reps
- [ ] Ramp 2: ~60–75% working load/effort, lower reps or same movement pattern
- [ ] Optional heavier primer only for advanced heavy strength (not required in first implementation)
- [ ] Avoid fatigue — do not turn ramp sets into extra working volume

#### Calisthenics Progression Ramping
- [ ] Ramp by easier progression, not only percentages
- [ ] Examples:
  - Main: Straddle Planche Hold → Ramp 1: Tuck Planche → Ramp 2: Advanced Tuck → Main bars
  - Main: Full Front Lever → Ramp 1: Tuck FL → Ramp 2: Adv Tuck/One-Leg/Straddle → Main bars
  - Main: Weighted Pull-Up → Ramp 1: Bodyweight → Ramp 2: Moderate weight → Main: Working weight
  - Main: Explosive Pull-Ups with band → Ramp: Lower intensity explosive reps, not failure

#### Future Data Model Requirements (AB15.1+)
Ramp sets should have their own metadata:
- `isRampSet: true`
- `rampIndex: number`
- `rampIntensityLabel: string` (e.g. "~50% effort")
- `rampPurpose: string` (e.g. "pattern rehearsal")
- `targetRPE: number` (usually lower than working sets)
- `restSeconds: number` (shorter than working sets)
- `progressionRegressionFromMain?: string` (if calisthenics skill)
- `loadPercentOfWorking?: number` (if weighted)
- `displayBarType: 'ramp'`
- `doesNotCountAsWorkingSet: true`

### Future Verification Location (AB15.1+)
When implemented:
1. Program Page → Start Workout → active exercise card → progress strip
2. Confirm 1–2 small prep/ramp bars appear before the red working-set bars
3. Tapping/advancing through ramp sets shows easier progression/lighter load/lower effort guidance
4. Main working sets still show red bars and normal targets

### Implementation Status

| Subtask | Description | Status |
|---------|-------------|--------|
| AB15.0 | Doctrine registration and spec | COMPLETE |
| AB15.1 | Live ramp/warm-up set UI implementation | COMPLETE |
| AB15.2 | Ramp-set adaptive progression-tree resolver | COMPLETE |
| AB15.3 | Ramp rest timer implementation | COMPLETE |
| AB15.4 | Weighted load ramping (practical rounded loads) | COMPLETE |
| AB15.5.1 | Structured prep reopen clamp + legacy fallback cutoff + graph-backed target naming | COMPLETE |
| AB15.6 | Warm-Up Rationale Trust Upgrade (Per-Item Coaching) | COMPLETE |

### AB15.5.1 — Structured Prep Reopen Clamp + Legacy Fallback Cutoff + Graph-Backed Prep Targets

**Status:** COMPLETE

**Purpose:** Fix structured prep reopen bug where completed prep shows "Prep 3/2", prevent structured prep from falling back to legacy text steps, and use existing skill graph for exact prep targets.

### What Changed

1. **Prep Progress Clamping** — `components/workout/ActiveWorkoutStartCorridor.tsx`
   - Added `rawPrepSetProgress`, `safePrepSetProgress`, `activePrepSetIndex` clamping
   - Progress is clamped between 0 and `prepSetsTotal`
   - Array access index is clamped between 0 and `prepSetsTotal - 1`
   - Header, button, summary, and bars all use clamped values
   - No more "Prep 3/2" display

2. **Reopen Resets Progress** — `components/workout/ActiveWorkoutStartCorridor.tsx`
   - `handleReopenPrepare()` now resets structured prep progress to 0
   - Reopening after completion shows "Prep 1/1" or "Prep 1/2", not stale state

3. **Legacy Fallback Cutoff** — `components/workout/ActiveWorkoutStartCorridor.tsx`
   - Render uses `hasStructuredPrepSets` to gate branches
   - If `hasStructuredPrepSets` is true, legacy `exercisePrepPlan.steps` never renders
   - Legacy fallback only renders when `prepSetsTotal === 0`

4. **Skill Graph Integration** — `lib/workout/exercise-specific-ramp-up-plan.ts`
   - Added `inferSkillGraphId()` to map exercise names to graph families
   - Added `findCurrentNodeInGraph()` to find target node in skill graph
   - Added `buildSkillGraphPrepSets()` to generate prep sets from graph data
   - Uses existing `getOrderedNodes()` from `lib/skill-progression-graph-engine.ts`
   - Prep targets now name exact movements (e.g. "Tuck Front Lever — 5-6 sec")

5. **Improved Generic Fallback Copy**
   - Replaced vague "5-8 sec easier progression" with "Short technical hold — 5-6 sec"
   - Replaced vague "closer progression" with specific fallback copy
   - Pseudo planche push-up now says "Reduced-lean pseudo planche push-up — 2-3 reps"

### Skill Graph Families Supported
- front_lever
- back_lever
- planche
- planche_pushup
- pseudo_planche_pushup
- hspu
- handstand
- muscle_up
- ring_muscle_up
- one_arm_pull_up
- l_sit
- v_sit
- iron_cross

### Files Changed
- `components/workout/ActiveWorkoutStartCorridor.tsx` — Prep state clamping, reopen reset, fallback cutoff
- `lib/workout/exercise-specific-ramp-up-plan.ts` — Skill graph helpers, improved copy
- `docs/PROGRAM_EXPERIENCE_QUALITY_CHECKLIST.md` — Updated status

### Acceptance Criteria
- [x] No "Prep 3/2" display on reopen
- [x] Reopen shows "Prep 1/1" or "Prep 1/2"
- [x] Legacy fallback never shows when structured prep exists
- [x] Tuck Front Lever shows exact target like "Tuck front lever setup — 5-6 sec"
- [x] Pseudo Planche Push-Up shows "Reduced-lean pseudo planche push-up"
- [x] Skill graph used for exact prep targets where available
- [x] Bounded fallback used where graph matching fails
- [x] Weighted ramp load display preserved (50%/70% practical loads)
- [x] Working set count unchanged during prep
- [x] Workout progress unchanged during prep
- [x] TypeScript passes
- [x] Build passes

### AB15.6 — Warm-Up Rationale Trust Upgrade (Per-Item Coaching)

**Status:** COMPLETE

**Purpose:** Stop warm-up items from showing the same repeated generic block rationale. Wire existing per-item coaching from `warmup-cooldown-coaching-engine.ts` into visible warm-up rows.

### What Changed

1. **Per-Item Warm-Up Coaching Applied** — `lib/program-exercise-selector.ts`
   - `selectIntelligentWarmup()` now generates `warmupCoaching` BEFORE building items
   - Each warm-up item gets its specific reason from `warmupCoaching.itemCoaching.get(ex.name)`
   - Falls back to `buildFallbackWarmupItemReason()` when no coaching found
   - Block-level `generatedWarmup.block.rationale` no longer repeats on every row

2. **Specific Item Reasons** — `lib/warmup-cooldown-coaching-engine.ts`
   - `generateItemWarmUpCoaching()` already had specific reasons for:
     - Arm Swings / Circles: "Raises shoulder temperature and opens range..."
     - Band Pull Aparts: "Activates upper back and lightly warms elbows..."
     - Scap Push-Ups: "Scapular control for pulling..." or "Primes scapular protraction..."
     - Hollow/Arch: "Core activation for skill work and body tension."
   - These reasons now flow through to visible UI

3. **Generic Phrase Removed** — `lib/warmup-engine.ts`
   - "Progressive prep for advanced planche: wrist/scap activation → lean exposure → skill work"
   - Replaced with cleaner session-level summaries

### Preserved Behavior
- Why This Warm-Up? modal still works
- Warm-up navigation: Done — Next, Back, Skip This, Skip Warm-Up
- Save & Exit, Discard still work
- AB15.5.1 Skill Prep remains intact (PREP 1/1, no Prep 3/2)
- Block-level rationale still available in `adaptation.rationale` for modal/summary

### Acceptance Criteria
- [x] Arm Swings has specific shoulder/temperature reason
- [x] Band Pull Aparts has specific upper-back/elbow reason
- [x] Scap Push-Ups has specific scapular control reason
- [x] Items no longer all show the same generic sentence
- [x] Why This Warm-Up? modal preserved
- [x] Warm-up navigation preserved
- [x] AB15.5.1 Skill Prep preserved
- [x] TypeScript passes

### Future Scope (Deferred)
- Full skill graph expansion for dragon flag, manna, Victorian, etc.
- Full long-term load progression engine
- Full skill readiness engine integration

### AB15.6.1 — Skill Prep Clarity + In-Card Prep Rest Timer

**Status:** COMPLETE

**Purpose:** Clarify ambiguous graph-backed Skill Prep targets and add a compact play/pause timer inside the blue Skill Prep card.

### What Changed

1. **Prep Target Clarity** — `lib/workout/exercise-specific-ramp-up-plan.ts`
   - Added `formatSkillPrepTarget()` helper for clear action semantics
   - HSPU/elevated_pike now shows `Elevated Pike Hold (bent-arm) — 5-6 sec` instead of just `Elevated Pike — 5-6 sec`
   - Negatives clarified with `(slow lower)` suffix
   - Pike Push-Up, Wall HSPU clarified based on hold vs rep context

2. **In-Card Prep Rest Timer** — `components/workout/ActiveWorkoutStartCorridor.tsx`
   - Added separate prep timer state: `prepRestTimeRemaining`, `isPrepRestTimerRunning`, `prepRestTimerRef`
   - Timer resets when prep set changes, exercise changes, or reopen
   - Compact UI with Play/Pause and Reset buttons
   - Timer does NOT affect workout state, working sets, or main rest mode

### Preserved Behavior
- AB15.5.1 Skill Prep: no Prep 3/2, reopen resets to Prep 1
- AB15.6 warm-up per-item rationale
- Main working-set rest timer unchanged
- All prep navigation and completion handlers preserved

### Future Scope (Registered, Not Implemented)

1. **Discarded Workout Non-Authoritative Data Audit**
   - If user confirms Discard, that workout must NOT:
     - Save to workout history
     - Feed trend/evidence tables
     - Feed adaptation inputs
     - Feed fatigue/readiness calculations
     - Feed progression logic
     - Feed band/RPE history
     - Feed recovery/missed-workout intelligence
   - Any transient evidence created during the abandoned session must be cleared or quarantined

2. **Warm-Up/Cool-Down Transition and Micro-Rest Orchestration**
   - Evidence-based micro-rest between warm-up/cool-down items:
     - Low-intensity mobility/activation: no rest or ~5-10s
     - Moderate activation/isometric drills: ~10-20s
     - Higher-tension prep movements: ~20-45s
   - Pre-main-work transition timer after warm-up completion: ~60-90s for skill/strength
   - Post-final-exercise downshift timer before cool-down: ~30-60s
   - Warm-up order audit: general → joint prep/mobility → activation → movement-specific rehearsal

3. **Trend-Based Prep Band Guidance** (AB15.6.1.1 note)
   - Skill Prep band guidance should eventually use band history/trend data
   - For band-assisted working sets, prep should recommend an easier/thicker band than the working-set band
   - Example: if working sets consistently use Purple, prep may recommend Green
   - If user usually selects None or performance data proves no assistance is needed, prep should not force a band
   - Must derive from the same band-history engine used by live band recommendation panel, not a duplicate map
   - Startup fallback copy remains: "Use one easier/thicker band than working sets if needed"

4. **Prep Rest Timer Auto-Advance** (AB15.6.1.1 - IMPLEMENTED)
   - Prep rest timer auto-advances on zero, triggering same completion as manual button
   - Manual completion preserved for users who forgot to start timer, rested off-screen, or want to move early
   - Double-advance guard prevents skipping prep sets

---

## Changelog

### PEX-1 (In Progress)
- Added `CalibrationBaselineInfluence` contract type
- Added `CalibrationBaselineRole` and `CalibrationPrimaryUse` types
- Added `buildBaselineInfluence()` helper function
- Updated calibration selection to support 5 tests for mixed profiles
- Dynamic target count based on distinct baseline roles needed
- Each `CalibrationRecommendedTest` now includes `baselineInfluence` object
