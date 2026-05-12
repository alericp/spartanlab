# PROGRAM INTELLIGENCE + COACHING QUALITY CHECKLIST

## Overview

This checklist tracks the Program Intelligence Quality Acceptance Audit — the phase that follows the Program UI Cleanup. The goal is to determine whether the generated program is truly intelligent, coherent, doctrine-aligned, athletic, and useful — not just visually cleaner.

**Phase Context:**
- Program UI Cleanup (P1-P5) is COMPLETE
- UI is now cleaner with proof demoted behind toggles
- This audit answers: "Is the actual generated program quality strong enough, or is explanation masking weak decisions?"

---

## Intelligence Quality Phases

### IQ1 — Read-Only Program Intelligence Audit

**Status:** COMPLETE

**Purpose:** Before changing any logic, perform a comprehensive read-only audit to identify the real quality weaknesses now that the UI is readable.

**Audit Scope:**
- Trace the full corridor from onboarding truth → builder → visible UI → Start Workout handoff
- Identify whether program decisions are actually coherent or just cosmetically explained
- Separate stable+correct from stable+misleading from visually-clean+logic-weak

**Files Inspected:**
- `components/programs/ProgramTruthSummary.tsx`
- `components/programs/CalibrationCheckpointCard.tsx`
- `components/programs/FeedbackLoopProofCard.tsx`
- `components/programs/WeeklyMethodDecisionAccordion.tsx`
- `components/programs/AdaptiveSessionCard.tsx`
- `lib/program/program-calibration-recommendation.ts`
- `lib/benchmark-testing-engine.ts`
- `lib/program/weekly-skill-expression-allocator.ts`
- `lib/adaptive-program-builder.ts`
- `app/(app)/program/page.tsx`

**Audit Findings:**

1. **Calibration Test Intelligence: PARTIALLY STRONG**
   - The `buildProgramCalibrationRecommendation()` engine is real and goal-aligned
   - Tests are scored based on skill alignment, priority, and movement family
   - L-Sit Hold correctly maps to `compression_core` and affects `['l_sit', 'front_lever', 'planche']`
   - HOWEVER: L-Sit Hold as "calibrates compression core as primary indicator for front lever work" is questionable coaching copy — front lever is more about straight-arm pull strength than compression
   - Tests are deduped by movement family (good — prevents redundancy)
   - Max Dips/Max Push-Ups are correctly mapped to planche/hspu skills

2. **Weekly Skill Expression Allocation: STRONG**
   - `buildWeeklyExpressionAllocationContract()` has real doctrine logic
   - Primary skills get 60% direct exposure, secondary gets 40%
   - Tissue overlap matrix is computed and high-overlap pairs are tracked
   - Back lever + planche are correctly flagged as high overlap (straight-arm elbow/shoulder stress)
   - "No silent disappearances" rule forces minimum carryover visibility
   - Readiness gating can lower intensity but not raise it
   - Method permissions respect readiness contracts

3. **Method Decision Logic: STRONG**
   - `WeeklyMethodDecisionAccordion` reads from `buildPerWeekMethodCoachSummary()`
   - Per-day decisions show methods used/not-used with real reasons
   - Override eligibility (safe_with_tradeoff, unsafe_skill_protection, etc.) is computed
   - Training style influence is extracted and displayed
   - Method decisions are contract-based, not cosmetic

4. **Feedback Loop: HONEST BUT PASSIVE**
   - `FeedbackLoopProofCard` shows benchmark/workout signal count honestly
   - When no evidence exists, it says "baseline" not "optimized"
   - Calibration plan from `buildEvidenceAwareCalibrationPlan()` is computed
   - HOWEVER: The feedback loop is currently read-only — it shows evidence that was considered but does not yet PROVE that future generations are different as a result
   - This is honest but the closed-loop mutation is not fully demonstrated in UI

5. **Session Role Label Truth: SUSPECTED ISSUE**
   - Session cards show `focusLabel`, `roleLabel`, `weeklyRoleLabel`
   - These are computed from session exercise composition
   - SUSPECTED: A session labeled "Pull Strength" could still contain planche progressions if the builder's session-role derivation is based on dominant movement family, not skill identity
   - This was NOT observed as broken in code — but the potential for label/content drift exists

6. **Exercise Prescription Units: STRONG**
   - `resolveExercisePrescriptionUnitTruth()` repairs reps/seconds mismatches at render time
   - Hold-based exercises get time prescriptions
   - Strength movements get rep prescriptions
   - This is a real safety net, not cosmetic

7. **Grouped Method Rendering: STRONG**
   - `buildGroupedDisplayModel()` + `resolveGroupedExecutionPrescription()` produce real group contracts
   - Supersets, circuits, clusters render with proper member doses
   - Method semantics from `GROUPED_METHOD_SEMANTICS` are authoritative
   - Canonical body render resolution is verified via `resolveCanonicalMethodBodyRender()`

8. **Start Workout Parity: STRONG (GUARDED)**
   - `stampLaunchFingerprint()` + `stampAB10LaunchProof()` ensure the Program card stamps expected fingerprint before router.push
   - Live workout can verify it booted the correct body
   - This parity mechanism is real and deliberate

**Audit Verdict:** PARTIAL

The program intelligence is fundamentally strong in:
- Weekly skill allocation logic
- Method decision contracts
- Grouped rendering
- Prescription unit truth
- Start Workout parity

The intelligence is questionable or unverified in:
- Calibration test relevance to specific goals (L-Sit for front lever is debatable)
- Session role label derivation vs actual exercise content
- Feedback loop closure (evidence is shown but mutation proof is not visible)

---

### IQ2 — Session Role / Label Truth Hardening

**Status:** COMPLETE

**Purpose:** Ensure visible day type, role, primary/secondary focus, and exercise content agree.

**Implementation Summary:**

1. **Created `SessionRoleTruthVerification` interface** in `lib/program/program-display-contract.ts`
   - Tracks `focusLabelMatchesContent` and `weeklyRoleConsistent` flags
   - Computes `actualDominantFamily` from exercise name patterns
   - Detects cross-family skill work (push skills in pull sessions, vice versa)
   - Generates `displayExplanation` when labels don't match content
   - Includes `shouldShowInDetails` flag to control when explanation appears

2. **Added `resolveSessionRoleTruth()` pure resolver** — no side effects, no mutations
   - Analyzes exercise names/categories to determine movement family distribution
   - Compares visible `focusLabel` and `weeklyRoleLabel` against actual content
   - Surfaces user concern: push/planche work in pull-labeled sessions (and vice versa)
   - Confidence scoring based on exercise count

3. **Updated `buildSessionCardSurface()`** to include role truth verification
   - Added `exercises` to session input type
   - Computes verification and includes in `SessionCardSurface.roleTruthVerification`

4. **Updated `AdaptiveSessionCard`** to display role verification
   - Added "Role verification" section in "Why this workout" dropdown
   - Only shows when `shouldShowInDetails` is true and explanation exists
   - Displays pull/push/skill breakdown when cross-family skill work detected

**IQ9 Same-Corridor Slice:** The role truth explanation derives from the same resolved role truth object used by visible labels, ensuring explanation and header labels cannot contradict each other.

**Root Cause Found:** Labels were coming from builder-level role contracts (`weeklyRole.roleLabel`) which describe stress character, not verified content. The focus labels (`focusLabel`) describe movement family but were not verified against actual exercises. Now a display-level verification layer validates labels against content and surfaces explanations when needed.

**Files Changed:**
- `lib/program/program-display-contract.ts` — Added `SessionRoleTruthVerification` type, `resolveSessionRoleTruth()` function, `roleTruthVerification` field in `SessionCardSurface`
- `components/programs/AdaptiveSessionCard.tsx` — Added "Role verification" section in "Why this workout" dropdown

**Files NOT Touched:**
- `lib/adaptive-program-builder.ts` — Builder logic unchanged; verification is display-only
- Database schema — No migrations
- Live workout runtime — AB15 grouped runtime preserved

---

### IQ3 — Selected Skill Coverage and Rotation Truth

**Status:** COMPLETE

**Purpose:** Ensure all selected skills are intentionally expressed, rotated, suppressed, or explained.

**Audit Findings:**
The infrastructure for skill coverage tracking is already strong:
- `authoritativeMultiSkillIntentContract` tracks: `materiallyExpressedSkills`, `reducedThisCycleSkills`, `deferredSkills`, `skillPriorityOrder`
- `WeeklyExpressionAllocationContract` has disposition states: `direct_priority`, `direct_limited`, `carryover_only`, `temporary_defer`
- `materializationVerdict.normalizedExpression` tracks: `directlyExpressed`, `technicallyExpressed`, `supportExpressed`, `carryoverOnly`, `deferredSkills`
- The "Skill Roles This Cycle" expanded section already shows deferred skills with reasons

**What Changed:**
1. **Enhanced Skills Chip** — Now shows breakdown instead of just count:
   - Before: "Skills: 2/8 expressed this cycle"
   - After: "Skills: 2 direct, 3 support, 3 rotating" (example)
   - The chip now distinguishes direct expression, support work, and rotating/deferred skills

2. **Added Rotation Explanation Line** — When skills are deferred, a compact explanation appears in the collapsed view:
   - "3 skills rotate into future cycles based on priority and recovery. See details for breakdown."
   - This makes the rotation intentional and explained, not mysterious

**Files Changed:**
- `components/programs/ProgramTruthSummary.tsx` — Updated skill chip to show breakdown, added rotation explanation line

**Acceptance Tests:**
- Multi-skill user sees accurate breakdown (direct/support/rotating) not just a count
- Deferred skills are explained in collapsed view
- Expanded view still shows full "Skill Roles This Cycle" with per-skill reasons
- Support skills are tracked separately from direct expression
- "Skills: 2/8 expressed" replaced with more informative breakdown
- No generator, schema, or method engine changes

---

### IQ4 — Calibration Test Recommendation Intelligence

**Status:** COMPLETE

**Purpose:** Ensure recommended tests map to selected goals, limiters, and progression decisions.

**What Changed:**

1. **Added Relationship Strength Classifier**
   - New `CalibrationRelationshipStrength` type: `direct` | `strong_support` | `general_support` | `baseline`
   - `getSkillTestRelationship()` function determines how directly a test measures a specific skill
   - `getBestRelationship()` finds the strongest relationship across all user's selected skills

2. **Updated Scoring Logic**
   - Direct tests get +30 score bonus
   - Strong support tests get +15 score bonus
   - General support tests get no bonus
   - This ensures Tuck Front Lever Hold outranks L-Sit Hold for front_lever primary goal

3. **Relationship-Aware Reason Text**
   - Direct: "Directly calibrates X strength for your Y progression."
   - Strong support: "Calibrates X capacity that supports your Y progression."
   - General support: "Provides supporting X baseline for Y assistance work."
   - No longer claims L-Sit is a "primary indicator" for front lever

4. **Relationship-Aware Program Influence Notes**
   - Direct: "Result directly influences progression level, dosage, and readiness for X."
   - Strong support: "Result influences capacity-based dosage decisions for X."
   - General support: "Result provides baseline for support and assistance work related to X."

5. **Added Planche Lean Hold Test**
   - New test in `BASELINE_TESTS` catalog
   - `movementFamily: 'straight_arm_push'` (direct for planche)
   - `skillsAffected: ['planche']`
   - `priority: 'recommended'`
   - `testUnit: 'seconds'`

**Relationship Rules:**

| Skill | Direct | Strong Support | General Support |
|-------|--------|----------------|-----------------|
| front_lever | straight_arm_pull | vertical_pull | compression_core |
| planche | straight_arm_push | dip_pattern, vertical_push | compression_core |
| l_sit | compression_core | - | - |
| hspu | handstand | dip_pattern, vertical_push | - |
| muscle_up | explosive_pull, ring_support | vertical_pull, dip_pattern | - |
| back_lever | straight_arm_pull | vertical_pull | compression_core |

**Files Changed:**
- `lib/program/program-calibration-recommendation.ts` — Added relationship classifier, updated scoring with +30/+15 bonus for direct/strong_support, updated reason text and influence note builders
- `lib/benchmark-testing-engine.ts` — Added Planche Lean Hold test to BASELINE_TESTS catalog

**Acceptance Tests:**
- Front lever primary + pull_up_bar equipment → Tuck Front Lever Hold ranks above L-Sit Hold
- Planche primary + floor equipment → Planche Lean Hold appears as direct test
- L-Sit primary → L-Sit Hold remains direct, high-priority recommendation
- Existing benchmark data compatibility preserved (testName values unchanged)
- Log Result button payloads unchanged
- No schema/API changes

---

### IQ5 — Exercise Prescription Unit/Type Truth

**Status:** VERIFIED STRONG

**Purpose:** Verify seconds/reps/load/RPE/progression type correctness.

**Findings:**
- `resolveExercisePrescriptionUnitTruth()` handles hold vs rep detection
- This is working correctly based on code inspection
- No action needed unless bugs surface

---

### IQ6 — Method Decision Usefulness and Survival

**Status:** TODO

**Purpose:** Ensure methods are selected/blocked for real doctrine reasons and survive to visible/live workout where relevant.

**Investigation Required:**
- Verify method decisions survive from builder → session → Start Workout
- Ensure "straight sets are deliberate" reflects actual reasoning
- Check if methods are over-blocked due to conservative gating

**Files Likely in Scope:**
- `lib/program/method-decision-engine.ts`
- `lib/program/per-day-method-summary.ts`

---

### IQ7 — Feedback Loop Closure

**Status:** TODO

**Purpose:** Prove benchmark/workout evidence changes future programming, not just proof cards.

**Investigation Required:**
- Trace where benchmark evidence is consumed in generation
- Verify generation actually differs when evidence exists vs baseline
- Add visible proof that next generation used logged evidence

**Files Likely in Scope:**
- `lib/program/program-evidence-feedback-loop.ts`
- `lib/program/evidence-aware-program-calibration-governor.ts`
- `lib/adaptive-program-builder.ts` (evidence consumption)

---

### IQ8 — Weekly Structure and Recovery Realism

**Status:** TODO

**Purpose:** Audit frequency, spacing, tendon stress, deload/protection, and first-week ramp logic.

**Investigation Required:**
- Verify 6-session flexible week is justified for the athlete
- Check if tendon-stress days are spaced appropriately
- Verify first-week protection logic is sensible
- Check if "low recent volume 0 sessions +1" makes sense or inflates frequency

**Files Likely in Scope:**
- `lib/flexible-schedule-engine.ts`
- `lib/program-structure-engine.ts`
- `lib/adaptive-program-builder.ts` (week character logic)

---

### IQ9 — Explanation Parity

**Status:** TODO

**Purpose:** Ensure chips/explanations are derived from actual program truth.

**Investigation Required:**
- Verify every visible chip corresponds to computed truth
- Identify any cosmetic-only explanations
- Ensure explanation surfaces don't claim more than logic delivered

**Files Likely in Scope:**
- `components/programs/*.tsx` (all explanation renders)
- `lib/coaching-explanation-contract.ts`

---

### IQ10 — Start Workout Parity Risk Audit

**Status:** VERIFIED STRONG

**Purpose:** Ensure Program page session truth is what Start Workout receives.

**Findings:**
- `stampLaunchFingerprint()` and `AB10LaunchProof` mechanism ensures parity
- Live workout can verify fingerprint matches expected body
- This is working correctly based on code inspection
- No action needed unless bugs surface

---

## Phase Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| IQ1 | Read-only program intelligence audit | COMPLETE |
| IQ2 | Session role / label truth hardening | TODO |
| IQ3 | Selected skill coverage and rotation truth | COMPLETE |
| IQ4 | Calibration test recommendation intelligence | COMPLETE |
| IQ5 | Exercise prescription unit/type truth | VERIFIED STRONG |
| IQ6 | Method decision usefulness and survival | TODO |
| IQ7 | Feedback loop closure | TODO |
| IQ8 | Weekly structure and recovery realism | TODO |
| IQ9 | Explanation parity | TODO |
| IQ10 | Start Workout parity risk audit | VERIFIED STRONG |

---

## Root Cause Ranking (from IQ1 Audit)

### 1. Most Likely Root Weakness: Calibration Test Mapping Too Generic

**Evidence:**
- L-Sit Hold is recommended for front lever work with reason "calibrates compression core as primary indicator for front lever work"
- Front lever is primarily a straight-arm pulling skill, not compression
- Test catalog maps by `skillsAffected` array which is correct, but the reason text misrepresents the training relationship

**Files/Corridor:**
- `lib/benchmark-testing-engine.ts` (BASELINE_TESTS skillsAffected mapping)
- `lib/program/program-calibration-recommendation.ts` (reasonTextFor function)

**Why It Matters:**
- Athletes may do irrelevant tests thinking they calibrate their goal
- Coaching copy loses credibility when test-to-goal mapping is inaccurate

**Fix Priority:** MEDIUM-HIGH

### 2. Feedback Loop Not Visibly Closed

**Evidence:**
- FeedbackLoopProofCard shows evidence count and "considered" status
- No visible proof that next generation was different because of evidence
- The loop shows INPUT but not OUTPUT proof

**Files/Corridor:**
- `lib/program/program-evidence-feedback-loop.ts`
- `components/programs/FeedbackLoopProofCard.tsx`

**Why It Matters:**
- Users cannot trust that logging tests actually changes their program
- "Feedback loop" claim is partially hollow until mutation is proven

**Fix Priority:** HIGH

### 3. SUSPECTED: Session Role Label May Drift From Content

**Evidence:**
- Code shows session.focusLabel is consumed but derivation path is complex
- A session could theoretically be labeled "Pull" while containing push-skill dominant exercises
- Not proven broken — needs targeted investigation

**Files/Corridor:**
- Session focus derivation in `lib/adaptive-program-builder.ts`
- Role projection in `lib/program/program-display-contract.ts`

**Why It Matters:**
- Role labels are prominent in the UI
- If labels don't match content, the entire program feels untrustworthy

**Fix Priority:** HIGH if proven, MEDIUM if not observed

### 4. "Skills 2/8 Expressed" May Be Confusing Without Explanation

**Evidence:**
- ProgramTruthSummary shows skill expression ratio
- Deferred skills are tracked but the "why" may not be obvious to users
- Users may interpret low expression as a bug rather than intentional allocation

**Files/Corridor:**
- `components/programs/ProgramTruthSummary.tsx`
- `lib/program/weekly-skill-expression-allocator.ts`

**Why It Matters:**
- Users selecting 8 skills expect to see 8 skills expressed
- If only 2 are expressed, the reasoning must be crystal clear

**Fix Priority:** MEDIUM

### 5. Method Decision Over-Conservatism (Suspected)

**Evidence:**
- "Straight sets are deliberate" appears frequently
- User may have selected supersets/circuits but see none applied
- Could be correct doctrine or could be overly conservative gating

**Files/Corridor:**
- `lib/program/method-decision-engine.ts`
- `lib/program/weekly-skill-expression-allocator.ts` (method permission)

**Why It Matters:**
- If users' method preferences are ignored without clear reason, trust erodes
- Need to verify blocking reasons are real, not just safety defaults

**Fix Priority:** MEDIUM

---

## What Is Proven

1. Weekly skill allocation logic is real and doctrine-based
2. Method decisions are contract-based with real reasons
3. Grouped rendering matches canonical method structures
4. Prescription unit truth has repair mechanism
5. Start Workout parity has fingerprint verification

---

## What Is Suspected

1. Calibration test-to-goal reason text may misrepresent relationships
2. Session role labels may drift from exercise content
3. Method preferences may be over-blocked without user-visible justification
4. Feedback loop may show evidence without proving mutation

---

## What Is NOT A Problem

1. CalibrationCheckpointCard badge count — FIXED in P5
2. Exercise prescription units — repair mechanism exists
3. Start Workout session parity — fingerprint stamping protects this
4. Method decision visibility — UI shows used/not-used with reasons
5. Skill allocation enforcement — "no silent disappearances" rule exists

---

## Next Single Implementation Target

**Recommended Next Prompt:** IQ4 — Calibration Test Recommendation Intelligence

**Why This Is First:**
- Calibration is the first coaching surface most users see
- Test-to-goal accuracy directly affects user trust
- The fix is contained (test catalog + reason text) without touching generator logic
- Can be done without breaking existing programs

**Files Likely in Scope:**
- `lib/benchmark-testing-engine.ts` (BASELINE_TESTS)
- `lib/program/program-calibration-recommendation.ts` (reasonTextFor)

**Expected Visible Change:**
- L-Sit Hold will have more accurate reason text for front lever work
- May add tuck front lever hold as a more direct front lever test
- Reason text will reflect actual training relationships, not just movement family mapping

---

## Changelog

### IQ1 (Complete)
- Performed comprehensive read-only audit of program intelligence
- Inspected 10+ files across UI components and lib modules
- Identified 5 ranked root causes of potential quality issues
- Verified IQ5 (prescription units) and IQ10 (Start Workout parity) are strong
- Created this checklist with TODO phases for remaining work
- No code changes — audit only

### IQ3 (Complete)
- Audited existing skill coverage infrastructure — found it already strong
- `authoritativeMultiSkillIntentContract` already tracks direct, support, deferred skills with reasons
- `WeeklyExpressionAllocationContract` already has disposition states with reasoning
- Updated Skills chip in `ProgramTruthSummary.tsx` to show breakdown instead of just count
- Before: "Skills: 2/8 expressed this cycle" — confusing for users who selected 8 skills
- After: "Skills: 2 direct, 3 support, 3 rotating" — clear breakdown showing rotation is intentional
- Added compact rotation explanation line in collapsed view: "3 skills rotate into future cycles based on priority and recovery"
- Expanded "Skill Roles This Cycle" section already shows per-skill roles and deferral reasons
- No generator, schema, or method engine changes — UI truth display only

### IQ4 (Complete)
- Added `CalibrationRelationshipStrength` type to classify direct vs support tests
- Added `getSkillTestRelationship()` function with skill-specific rules for front_lever, planche, l_sit, hspu, muscle_up, back_lever
- Added `getBestRelationship()` helper to find strongest relationship across user's skills
- Updated scoring: direct tests +30, strong_support +15, general_support +0
- Updated `reasonTextFor()` to generate relationship-aware reason text
- Updated `programInfluenceNoteFor()` to generate relationship-aware influence notes
- Added `planche_lean_hold` test to BASELINE_TESTS catalog with movementFamily: 'straight_arm_push'
- Before: L-Sit Hold could rank above Tuck Front Lever Hold for front_lever due to essential priority boost
- After: Tuck Front Lever Hold outranks L-Sit Hold for front_lever due to +30 direct relationship bonus
- Before: Reason text said "calibrates compression core as primary indicator for front lever work"
- After: Reason text says "Provides supporting compression core baseline for front lever assistance work"
- All existing testName values unchanged (backward compatible)
- Log Result buttons unchanged
- No schema or API changes
