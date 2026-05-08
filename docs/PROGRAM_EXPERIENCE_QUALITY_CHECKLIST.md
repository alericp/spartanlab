# PROGRAM EXPERIENCE QUALITY CHECKLIST

This document tracks the Program Experience (PEX) phases for ensuring the SpartanLab
program page delivers real coaching intelligence, not cosmetic surfaces.

## Phase Status Overview

| Phase | Description | Status |
|-------|-------------|--------|
| PEX-1 | Program Experience Truth Surface Foundation | IN_PROGRESS |
| PEX-2 | Selected Skill Coverage + Rotation Truth | NOT_STARTED |
| PEX-3 | Method Materialization Truth | NOT_STARTED |
| PEX-4 | Session Card Clutter Compression | NOT_STARTED |
| PEX-5 | True Short-Session Runtime Options | NOT_STARTED |
| PEX-6 | End-to-End Runtime Proof | NOT_STARTED |

---

## PEX-1 — Program Experience Truth Surface Foundation

**Status:** IN_PROGRESS

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

**Status:** NOT_STARTED

**Purpose:** Ensure selected skills are actually represented, rotated, deferred, or support-only with truthful reasons.

### Scope
- Fix "8 selected skills but 6 under-expressed" visibility issue
- Ensure selected skills are actually represented in executable sessions
- Ensure weeks/cycles are not visually identical if rotation/progression is expected
- Clear deferred/rotational skill explanations

---

## PEX-3 — Method Materialization Truth

**Status:** NOT_STARTED

**Purpose:** Ensure selected training methods actually appear in programming when safe.

### Scope
- Density blocks
- Finishers
- Supersets
- Circuits
- Top sets
- Drop sets
- Rest-pause
- If selected/requested and safe, actually program them
- If deferred, give clear reason and future condition
- Do not hide behind "acclimation week" if weeks 2-4 do not change

---

## PEX-4 — Session Card Clutter Compression

**Status:** NOT_STARTED

**Purpose:** Clean up always-visible chip clutter on day cards.

### Scope
- Remove always-visible chip clutter from day cards
- Move useful day reasoning into collapsed per-day "Why this workout" / "Day strategy"
- Keep only essential day identity and Start Workout controls visible by default

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
