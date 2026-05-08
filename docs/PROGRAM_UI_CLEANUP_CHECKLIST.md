# PROGRAM UI CLEANUP CHECKLIST

## Overview

The Program page has become functionally strong and intelligence-rich, but visually and cognitively overloaded. This cleanup phase focuses on UI hierarchy and presentation — not removing intelligence, weakening AI logic, or changing training decisions.

**Goals:**
- Keep real computed truth
- Keep useful coaching
- Demote noisy proof/audit/internal details
- Make the Program page feel premium, clean, precise, and smart
- Let normal users understand what matters quickly
- Keep advanced proof available behind accordions/details

---

## UI Hierarchy Classification

### PRIMARY USER SURFACES
- Schedule Status
- Program up-to-date state
- Clean Why This Plan summary
- Day/session cards
- Start Workout
- Session length selection
- Warm-up/cool-down blocks when relevant

### SECONDARY COACHING SURFACES
- Calibration Checkpoint
- Coaching Feedback Loop
- Training preferences applied
- Equipment used
- Readiness/recovery notes
- Progression clarity
- Session readiness

### ADVANCED DETAILS / COLLAPSED BY DEFAULT
- Rule population
- Doctrine execution counts
- Audit-only labels
- Runtime gaps
- Suppressed/blocked method reasons
- Day-by-day method tradeoff paragraphs
- Internal proof maps

### SHOULD NOT BE NORMAL USER DEFAULT
- Raw proof/debug language
- Long audit ledgers
- Repeated duplicate chips
- Diagnostic taxonomies without user-facing explanation
- Internal PASS/FAIL language

---

## Cleanup Phases

### P1 — UI Hierarchy Audit + Collapse Proof/Calibration Surfaces

**Status:** COMPLETE

**Purpose:** Make CalibrationCheckpointCard and FeedbackLoopProofCard compact/collapsed by default. Users see a clean summary; expanding reveals full details.

**Files Changed:**
- `components/programs/CalibrationCheckpointCard.tsx`
- `components/programs/FeedbackLoopProofCard.tsx`

**Acceptance Criteria:**
- [x] CalibrationCheckpointCard collapsed by default with test count badge
- [x] FeedbackLoopProofCard collapsed by default with signal summary badge
- [x] Expanding reveals all existing content (tests, proof lines, actions)
- [x] Renamed "Feedback Loop Proof" → "Coaching Feedback Loop" (user-facing)
- [x] Collapsed headers show coaching-friendly summary copy
- [x] No training data removed
- [x] No actions removed (Log result still available when expanded)
- [x] TypeScript compiles
- [x] Production build passes

**No-Breakage Constraints:**
- No generator changes
- No schema changes
- No live workout changes
- No saved-program mutation changes
- No AI doctrine logic changes

---

### P2 — Why This Plan Cleanup

**Status:** COMPLETE

**Purpose:** Keep the strong summary visible, move rule population/doctrine/audit taxonomy behind details, rewrite default copy into smarter AI-coach language.

**Files Changed:**
- `components/programs/ProgramTruthSummary.tsx`

**What Changed:**
- Renamed "Rule Population" section to "How This Was Built" with coach-friendly language
- Added secondary toggle (`showAdvancedDetails`) to hide technical rule details by default
- Top-level summary now shows: "X coaching rules actively shaped this program, while Y more are monitored for future adjustments"
- Simplified chips: "shaping workouts", "visible in plan", "monitored" instead of "executable", "audit only", "influenced scoring"
- Technical details (full breakdown with executable/audit-only/blocked/no-target chips) now hidden behind "View details" toggle
- Preserved all AB9 proof attributes on the advanced details container for QA/testing

**Acceptance Criteria:**
- [x] Why This Plan summary remains visible at top
- [x] Rule population/doctrine counts collapsed by default
- [x] "Audit-only", "executable", "influenced scoring" terms demoted to advanced details
- [x] Default copy reads like coaching, not diagnostic output
- [x] No data loss — all technical details preserved behind toggle
- [x] No training decision changes

**No-Breakage Constraints:**
- No generator changes
- No schema changes
- No doctrine engine changes
- No method decision logic changes

---

### P3 — Weekly Method Decisions Cleanup

**Status:** COMPLETE

**Purpose:** Keep strategy visible, collapse verbose day-by-day method reasoning. Rename internal terms for normal users.

**Files Changed:**
- `components/programs/WeeklyMethodDecisionAccordion.tsx`

**What Changed:**
- Renamed "Weekly Method Decisions" to "Weekly Method Strategy"
- Header chips: "active" instead of "applied", "held back" instead of "preferred not used", "tracked" instead of "runtime gap"
- Day-by-day breakdown now collapsed by default using nested `<details>` with "view X days" / "hide details" toggle
- DayCard influence chips: "active" instead of "applied", "held back" instead of "blocked", "tracked" instead of "runtime gap"
- Override labels updated: "Possible with tradeoff", "Not recommended today", "Not a fit for this day", "Not yet available", "Pending review"
- Coaching footnote rewritten to be premium and coach-focused
- Preserved all data attributes, proof, and method decision truth

**Acceptance Criteria:**
- [x] Strategy summary remains visible
- [x] Day-by-day reasoning collapsed by default
- [x] "Runtime gap", "blocked", "audit-only", "not eligible" terms renamed or demoted
- [x] Tradeoff paragraphs available on expand, not default
- [x] No training decision changes

**No-Breakage Constraints:**
- No method decision engine changes
- No generator changes
- No schema changes

---

### P4 — Session Card Chip Density Cleanup

**Status:** COMPLETE

**Purpose:** Reduce visual noise from session chips. Keep primary coaching chips visible, demote technical/audit chips to expanded "View session details" area.

**Files Changed:**
- `components/programs/AdaptiveSessionCard.tsx`

**What Changed:**
- Added `showSessionDetails` state to control visibility of heavy proof sections
- Doctrine Materialization panel now collapsed by default behind "View session details" toggle
- Material Composition Truth Lock (adaptation chips) now collapsed by default
- Method decisions line now collapsed by default
- Visible method chips now collapsed by default
- Multi-structure composition coach line now collapsed by default
- "View session details" / "Hide session details" toggle added below meta line
- Primary coaching signals remain visible: day label, role, intensity, stress proof, RPE band, time/exercise count
- All demoted content preserved and accessible when expanded
- All data attributes preserved for QA/testing

**Acceptance Criteria:**
- [x] Primary coaching chips visible by default (day role, intensity, stress label)
- [x] Technical chips demoted (Finisher blocked, RPE capped, Secondary trimmed, etc.)
- [x] "View session details" expansion shows all chips
- [x] No duplicate chips
- [x] No data loss

**No-Breakage Constraints:**
- No generator changes
- No session structure changes
- No warm-up/cool-down changes
- No Start Workout behavior changes
- No live workout changes

---

### P5 — Final Program UI Acceptance Pass

**Status:** NOT_STARTED

**Purpose:** Final visual audit, copy polish, and acceptance testing across all cleanup phases.

**Files Likely Involved:**
- All Program UI components
- docs/PROGRAM_UI_CLEANUP_CHECKLIST.md

**Acceptance Criteria:**
- [ ] All P1-P4 items complete
- [ ] Program page feels premium, clean, precise
- [ ] Normal users can understand what matters quickly
- [ ] Advanced proof available behind accordions
- [ ] No internal/debug language in default view
- [ ] TypeScript compiles
- [ ] Production build passes

**No-Breakage Constraints:**
- No logic changes
- No training decision changes
- No schema changes

---

## Phase Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| P1 | Collapse proof/calibration surfaces | COMPLETE |
| P2 | Why This Plan cleanup | COMPLETE |
| P3 | Weekly Method Decisions cleanup | COMPLETE |
| P4 | Session card chip density cleanup | COMPLETE |
| P5 | Final acceptance pass | NOT_STARTED |

---

## Changelog

### P1 (Complete)
- CalibrationCheckpointCard: Added Collapsible wrapper, default collapsed state, compact header with test count badge, coaching-friendly summary copy
- FeedbackLoopProofCard: Added Collapsible wrapper, default collapsed state (via `defaultCollapsed` prop), renamed title to "Coaching Feedback Loop", compact header with signal summary badge, coaching-friendly collapsed copy
- Both cards preserve all existing content and actions when expanded
- No generator, schema, or training logic changes

### P2 (Complete)
- ProgramTruthSummary: Renamed "Rule Population" to "How This Was Built" with coaching-friendly default summary
- Added `showAdvancedDetails` toggle to hide technical rule breakdown by default
- Top-level summary: "X coaching rules actively shaped this program, while Y more are monitored for future adjustments"
- Simplified chips: "shaping workouts", "visible in plan", "monitored" instead of "executable", "audit only", "influenced scoring"
- Technical details (executable/audit-only/blocked/no-target) now hidden behind "View details" button
- Preserved all AB9 proof attributes for QA/testing in the advanced details container
- No generator, schema, doctrine, or training logic changes

### P3 (Complete)
- WeeklyMethodDecisionAccordion: Renamed "Weekly Method Decisions" to "Weekly Method Strategy"
- Header chips: "active" instead of "applied", "held back" instead of "preferred not used", "tracked" instead of "runtime gap"
- Day-by-day breakdown now collapsed by default using nested `<details>` with "view X days" / "hide details" toggle
- DayCard influence chips: "active" instead of "applied", "held back" instead of "blocked", "tracked" instead of "runtime gap"
- Override labels: "Possible with tradeoff", "Not recommended today", "Not a fit for this day", "Not yet available", "Pending review"
- Coaching footnote rewritten for premium coach voice
- All data attributes and method decision truth preserved
- No method engine, generator, schema, or training logic changes

### P4 (Complete)
- AdaptiveSessionCard: Added `showSessionDetails` state to collapse heavy proof sections by default
- Demoted to "View session details": Doctrine Materialization panel, Material Composition Truth Lock (adaptation chips), Method decisions line, Visible method chips, Multi-structure composition line
- Kept visible by default: Day label, role label, intensity class, stress distribution proof, RPE band, weekly day purpose, quality/safety warnings, time/exercise meta line
- "View session details" / "Hide session details" toggle button added below meta line
- All demoted content preserved and accessible when expanded
- All data attributes preserved for QA/testing
- No generator, session structure, warm-up/cool-down, Start Workout, or live workout changes
