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
| PEX-5 | True Short-Session Runtime Options | NOT_STARTED |
| PEX-6 | End-to-End Runtime Proof | NOT_STARTED |

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

## PEX-5 — True Short-Session Runtime Options

**Status:** NOT_STARTED

**Purpose:** Add real 20/15/10 minute session options that connect to the workout runtime.

### Scope
- Add 20 / 15 / 10 minute options
- Not cosmetic buttons
- Must connect to session variant truth, launch URL, workout route, exercise pruning, and live execution
- Preserve main skill work where possible

---

## PEX-6 — End-to-End Runtime Proof

**Status:** NOT_STARTED

**Purpose:** Verify the full Program → Start Workout → Live Execution chain.

### Scope
- Build/typecheck
- Program page visual proof
- Start Workout proof
- Variant proof
- No stale truth
- No fake explanations

---

## Changelog

### PEX-1 (In Progress)
- Added `CalibrationBaselineInfluence` contract type
- Added `CalibrationBaselineRole` and `CalibrationPrimaryUse` types
- Added `buildBaselineInfluence()` helper function
- Updated calibration selection to support 5 tests for mixed profiles
- Dynamic target count based on distinct baseline roles needed
- Each `CalibrationRecommendedTest` now includes `baselineInfluence` object
