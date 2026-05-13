# PROGRAM INTELLIGENCE + COACHING QUALITY CHECKLIST

## Overview

This checklist tracks the Program Intelligence Quality Acceptance Audit — the phase that follows the Program UI Cleanup. The goal is to determine whether the generated program is truly intelligent, coherent, doctrine-aligned, athletic, and useful — not just visually cleaner.

**Phase Context:**
- Program UI Cleanup (P1-P5) is COMPLETE
- UI is now cleaner with proof demoted behind toggles
- This audit answers: "Is the actual generated program quality strong enough, or is explanation masking weak decisions?"

**User-Facing AB Step Mapping:**
- AB15 covered live workout/runtime grouped-method parity (COMPLETE)
- AB16 maps to IQ6.x — Method Decision Usefulness and Survival
- AB17 will map to IQ7 — Feedback Loop Closure
- AB18+ will map to subsequent IQ steps as needed

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

**Status:** COMPLETE

**User-facing AB alias:** AB16.0 / AB16.2.1

**Purpose:** Ensure methods are selected/blocked for real doctrine reasons and survive to visible/live workout where relevant.

**IQ6.1 Implementation Summary (AB16.0-A through AB16.0-F):**

1. **Delivery Sync Gate (AB16.0-A):** Short-session debug ledger row (`applied=`, `mut=`, `vis=`, etc.) now gated behind `probeActive` flag in `AdaptiveSessionCard.tsx`. Normal users see clean coaching copy only.

2. **Best-Reason Resolver (AB16.0-B):** Added `resolveBestMethodDisplayReason()` function in `ProgramCoachIntelligenceHub.tsx` that:
   - Prioritizes real reasons from program truth when available
   - Falls back to state-based honest explanations (applied/blocked/deferred/not_materialized)
   - Removes generic "Detailed decision reason not yet available from final method truth" text
   - Provides method-specific reasoning for each state

3. **Method Override Planner (AB16.0-C):** Updated all three method extraction sources to use the resolver:
   - `weeklyMethodRepresentation.byMethod` entries
   - `weeklyMethodDecisionSummary.decisions` entries
   - `weeklyMethodMaterializationPlan.methodSlots` entries
   - Removed "Planner display corridor: active" debug marker

4. **AI Method Decisions Modal (AB16.0-D):** `WeeklyMethodDecisionAccordion` already renders day-by-day method reasoning with:
   - Per-day cards showing methods used/not used
   - Real reasons from `buildPerWeekMethodCoachSummary()`
   - Override readiness and tradeoff information
   - Training style coaching when applicable

5. **Method Survival (AB16.0-E):** Verified that:
   - Program Page session cards display method decisions from actual session truth
   - Grouped method labels (Strength Superset, paired sets) survive from AB15
   - Start Workout receives same session structure and method/group labels

**IQ6.2 Implementation Summary (AB16.2 / AB16.2.1):**

Enhanced `MethodOverridePreview` with structured diff fields for visible Current vs Proposed preview:
1. Added `currentStructure` field showing what the program has now
2. Added `proposedStructure` field showing what the preview would add
3. Added `impactSummary` field for user understanding
4. Added `riskSummary` field derived from safety and risk notes
5. Added `visibleProofLines` array for display
6. Added `savedProgramUnchanged: true` explicit flag
7. Updated Method Planner detail modal to display structured preview with:
   - "Current Structure" section
   - "Proposed Preview" section
   - "Impact" section
   - "Risk Assessment" section
   - "Preview only — saved program unchanged" proof

**IQ6.3 Implementation Summary (AB16.2.1):**

Added live workout "Method active" label for method survival proof:
1. Added `methodActiveLabel` to `activeEntryContract` in `StreamlinedWorkoutSession.tsx`
2. Derives label from `groupType`: Superset, Circuit, Cluster, Density Block
3. Renders compact emerald chip next to exercise category badge: "Method: Superset"
4. Only shows when grouped method truth exists (non-null groupType)
5. Includes `data-iq6-3-method-survival="true"` data attribute for testing

**Files Changed:**
- `lib/program/requested-method-override-planner.ts` — Enhanced `MethodOverridePreview` interface and `saveMethodOverridePreview()` with structured diff fields
- `components/programs/ProgramCoachIntelligenceHub.tsx` — Updated Method Planner detail modal to display Current vs Proposed preview
- `components/workout/StreamlinedWorkoutSession.tsx` — Added `methodActiveLabel` to contract and rendered "Method: X" label in exercise card

**IQ6.4 Implementation Summary (AB17.2):**

Added concrete day-specific workout preview for method override visualization:

1. **Exercise Validity Guard:** Fixed "Elevated Pseudo Planche Push-Ups" selection priority
   - Changed `FAMILY_PREFERRED_CANDIDATE_IDS` in `goal-family-balance-guard.ts` to prefer `pppu` (intermediate) over `elevated_pppu` (advanced)
   - Updated `resolveCanonicalExerciseName()` in `execution-unit-contract.ts` to be more conservative with "Elevated" naming — now defaults to "Pseudo Planche Push-Ups" unless explicit advanced prerequisite proof exists
   - When elevation is explicitly warranted, renamed to clearer "Feet-Elevated Pseudo Planche Push-Ups"

2. **Concrete Workout Preview Types:** Added new interfaces in `requested-method-override-planner.ts`:
   - `WorkoutPreviewBlock` — labeled exercise block with change type (unchanged/inserted/modified/warning)
   - `MethodOverrideWorkoutPreview` — full day-specific preview with current/proposed workout structures
   - Added `workoutPreview?: MethodOverrideWorkoutPreview` to `MethodOverridePreview` interface

3. **buildMethodOverrideWorkoutPreview():** New function that:
   - Extracts session exercises and categorizes them into Skill Work / Strength / Accessory blocks
   - Builds current workout structure preview
   - Inserts method block at appropriate position (after_primary, late_accessory, finisher)
   - Generates method-specific candidate exercises (circuits, drop sets, clusters, etc.)
   - Produces coach caution and preview limitations
   - Marks whether preview is concrete (has real exercises) or generic

4. **Updated saveMethodOverridePreview():** Now accepts optional `sessionExercises` and `sessionTitle` parameters to build concrete preview

5. **Updated ProgramCoachIntelligenceHub.tsx:**
   - `handleCreatePreview()` now extracts affected session exercises and title from program
   - Preview card UI now displays concrete workout blocks with:
     - Affected day label (e.g., "Day 1 — Heavier strength day")
     - Current workout structure (Skill Work / Strength / Accessory)
     - Proposed workout structure with inserted method block highlighted in emerald
     - Coach caution note
     - Preview limitations note when not concrete

**Files Changed (IQ6.4):**
- `lib/program/goal-family-balance-guard.ts` — Fixed PPPU selection priority (pppu first, elevated_pppu second)
- `lib/workout/execution-unit-contract.ts` — Made exercise naming more conservative, defaults to standard PPPU
- `lib/program/requested-method-override-planner.ts` — Added WorkoutPreviewBlock and MethodOverrideWorkoutPreview types, buildMethodOverrideWorkoutPreview() function
- `components/programs/ProgramCoachIntelligenceHub.tsx` — Updated handleCreatePreview and preview card UI

**IQ6.4.1 Implementation Summary (AB17.2.1):**

1. **HARD BAN: Feet-Elevated PPPU** — Exercise is now NEVER generated or displayed:
   - Removed `elevated_pppu` from `FAMILY_PREFERRED_CANDIDATE_IDS` entirely
   - Updated `resolveCanonicalExerciseName()` to ALWAYS return "Pseudo Planche Push-Ups" for any elevated PPPU ID/name
   - Updated exercise pool entry name to "Pseudo Planche Push-Ups" and marked as deprecated
   - Valid alternatives: "Pseudo Planche Push-Ups", "Planche Lean", "Feet-Elevated Planche Lean Hold"

2. **Circuit Preview Doctrine** — Circuits now require 3+ exercises:
   - Added `CIRCUIT_MINIMUM_EXERCISES = 3` constant
   - Added `classifyMovementPattern()` to categorize exercises
   - Added `findCircuitCompatibleExercises()` to select non-conflicting patterns
   - Added `scoreSessionForCircuit()` to evaluate session suitability
   - Added `findBestCircuitPreviewCandidate()` to find best day across program
   - 2 exercises = superset (shown with warning), not circuit
   - No safe circuit shown when fewer than 3 compatible exercises exist

3. **Real Exercise Display in Circuit Preview**:
   - Circuit preview now shows actual selected exercises from the session
   - Skips high-skill isometric holds (not suitable for circuits)
   - Avoids same-pattern overload (max 1 push, 1 pull, etc. per circuit)
   - Shows warning styling when circuit isn't viable

**Files Changed (IQ6.4.1):**
- `lib/workout/execution-unit-contract.ts` — Hard-banned all elevated PPPU display, always returns "Pseudo Planche Push-Ups"
- `lib/adaptive-exercise-pool.ts` — Changed elevated_pppu entry name to "Pseudo Planche Push-Ups", deprecated
- `lib/program/goal-family-balance-guard.ts` — Removed elevated_pppu from FAMILY_PREFERRED_CANDIDATE_IDS entirely
- `lib/program/requested-method-override-planner.ts` — Added circuit doctrine constants, pattern classification, circuit-compatible exercise finder, session scoring, best-day circuit finder
- `components/programs/ProgramCoachIntelligenceHub.tsx` — Added warning styling for circuit preview blocks

**IQ6.4.2 Implementation Summary (AB17.2.2):**

1. **Circuit Truth-to-UI Delivery:** Added `circuitCandidate?: CircuitPreviewCandidate` to `MethodOverridePreview` interface so circuit-specific truth reaches the UI.

2. **Fixed Movement Pattern Classification:** Updated `classifyMovementPattern()` to check dynamic movements (push-up, pull-up) BEFORE skill holds to avoid misclassifying "Pseudo Planche Push-Ups" as a skill hold.

3. **Circuit Candidate Creation in saveMethodOverridePreview:** For circuits, now creates a proper `CircuitPreviewCandidate` with:
   - `selectedExercises` — real exercises that pass circuit compatibility
   - `skippedExercises` — exercises excluded (skill holds, same-pattern)
   - `isSafeCircuitCandidate` — true only when 3+ compatible exercises exist
   - `candidateReason` — human-readable explanation
   - `riskNotes` — session-specific risk warnings

4. **Circuit-Specific UI in Method Planner:**
   - "Circuit Insertion Analysis" section replaces generic "Best Safe Insertion Point" for circuits
   - Shows circuit size status badge (e.g., "3-exercise circuit available" or "2 exercises = superset only")
   - Lists selected exercises and skipped exercises separately
   - Displays candidate reason and risk notes

5. **Honest Safety Badge:** For circuits:
   - Overrides "Safe to Preview" to "Would Be Superset" or "No Safe Circuit" when circuit candidate is unsafe
   - Uses amber warning styling instead of green success

6. **Circuit Preview Card:**
   - Shows full circuit candidate details when `circuitCandidate` exists
   - Lists numbered selected exercises
   - Shows skipped exercises with reasons
   - Displays risk notes in amber warning box

**Files Changed (IQ6.4.2):**
- `lib/program/requested-method-override-planner.ts`:
  - Fixed `classifyMovementPattern()` — checks dynamic movements before skill holds
  - Added `circuitCandidate` field to `MethodOverridePreview` interface
  - Updated `saveMethodOverridePreview()` to create `CircuitPreviewCandidate` for circuits
- `components/programs/ProgramCoachIntelligenceHub.tsx`:
  - Added `isCircuitMethod`, `circuitCandidate`, `isUnsafeCircuit` variables
  - Added `effectiveSafety` and `effectiveSafetyLabel` for circuit safety override
  - Added circuit-specific "Circuit Insertion Analysis" section
  - Added circuit-specific preview card rendering

**IQ6.4.3 Implementation Summary (AB17.2.2.1):**

1. **Authoritative Circuit Candidate Wiring:** `saveMethodOverridePreview()` now calls `findBestCircuitPreviewCandidate(programSessions)` when full program sessions are available, instead of building circuit candidate from only a single session's exercises.

2. **Full Program Sessions Context:** Added `PreviewCreationContext` interface with `programSessions` field. `handleCreatePreview()` in the UI now passes full `program.sessions` for circuit methods so all program days can be scanned.

3. **Honest Pre-Preview Guidance:** Updated `planCircuit()` to use `safety: 'not_enough_truth'` before preview, with headline "Create preview to scan all program days for circuit candidates" — no longer falsely claims "Safe to Preview" or shows specific day as final truth before scan.

4. **Circuit Safety Badge Updates:**
   - Before preview: "Scan Required" (not "Safe to Preview" or "Insufficient Data")
   - After preview with 3+ exercises: "Safe to Preview"
   - After preview with 2 exercises: "Would Be Superset"
   - After preview with no safe candidate: "No Safe Circuit"

5. **All-Program Day Scan Proof:** When circuit candidate is created via `findBestCircuitPreviewCandidate()`, a risk note "Scanned all N program days" is added to prove the preview checked all days, not just the stale suggested insertion day.

6. **Generic Circuit Strings Removed from Final Truth:**
   - `planCircuit()` no longer shows `Circuit can be previewed on ${bestSession?.title}` as final pre-preview truth
   - Summary changed to "Preview will scan all days for 3+ compatible exercises"
   - Risk notes now explain circuit doctrine (3+ exercises required, 2 = superset)

**Files Changed (IQ6.4.3):**
- `lib/program/requested-method-override-planner.ts`:
  - Added `PreviewCreationContext` interface
  - Updated `saveMethodOverridePreview()` signature to accept optional `context` parameter
  - Updated circuit candidate creation to use `findBestCircuitPreviewCandidate(context.programSessions)` when available
  - Updated `findBestCircuitPreviewCandidate()` to accept sessions with optional exercises array
  - Updated `planCircuit()` to use `not_enough_truth` safety and honest headline
- `components/programs/ProgramCoachIntelligenceHub.tsx`:
  - Updated `handleCreatePreview()` to pass full `program.sessions` in context for circuit methods
  - Updated safety label logic to show "Scan Required" for circuits before preview

**IQ6.4.4 Implementation Summary (AB17.2.2.2):**

1. **Circuit Preview Gate Unblock:** Updated `planMethodOverride()` to allow circuits to create previews even when safety is `not_enough_truth`. Circuits now use `canPreview = hasProgramExerciseTruth` instead of requiring `safe_preview` or `needs_caution`.

2. **Circuit-Specific canPreview Logic:**
   - Added `isCircuitLikeMethod` check for methodKey containing 'circuit' or 'density'
   - Added `hasProgramExerciseTruth` check for sessions with exercises
   - Circuits can preview when program has exercises — scan is the diagnostic gate

3. **Candidate Status Types:** Added `CircuitCandidateStatus` type with four clear states:
   - `safe_circuit` — 3+ exercises with good score
   - `override_with_caution` — 3+ exercises but risky (score <= 0)
   - `would_be_superset` — exactly 2 exercises
   - `no_candidate` — fewer than 2 exercises

4. **Extended CircuitPreviewCandidate Interface:**
   - Added `isOverrideCandidate: boolean` — true when 3+ exercises exist
   - Added `candidateStatus: CircuitCandidateStatus`
   - Added `statusLabel: string` — human-readable status

5. **Best Override Candidate with Caution:** `findBestCircuitPreviewCandidate()` now returns best available candidate with priority:
   1. Safe circuit (3+ exercises, good score)
   2. Override with caution (3+ exercises, risky)
   3. Superset (2 exercises)
   4. null (no candidate)

6. **UI Updates for Candidate States:**
   - Circuit status header now uses `candidateStatus` for clear visual states
   - "Override candidate with caution" shows amber styling with exercise count
   - Exercise list labels differentiate between safe, caution, and available exercises

**Files Changed (IQ6.4.4):**
- `lib/program/requested-method-override-planner.ts`:
  - Updated `planMethodOverride()` to allow circuit previews when program has exercises
  - Added `CircuitCandidateStatus` type
  - Extended `CircuitPreviewCandidate` interface with status fields
  - Updated `findBestCircuitPreviewCandidate()` to track and return best available candidate
  - Updated fallback circuit path to populate new status fields
- `components/programs/ProgramCoachIntelligenceHub.tsx`:
  - Updated circuit preview card to use `candidateStatus` for rendering
  - Updated exercise list labels for different candidate states

---

### IQ7 — Feedback Loop Closure

**Status:** COMPLETE (including IQ7.1 visible identity repair, IQ7.2 preserved in AB17.2)

**User-facing AB alias:** AB17 / AB17.1 / AB17.2

**Purpose:** Prove benchmark/workout evidence changes future programming, not just proof cards. Make the evidence → generation → mutation/proof → UI chain visible and honest.

**Implementation Summary (AB17 / IQ7):**

1. **Feedback Loop Closure State Resolver:** Added `resolveFeedbackLoopClosureDisplay()` in `FeedbackLoopProofCard.tsx` that derives one of four honest closure states from existing typed stamps:
   - `baseline` — No evidence logged yet
   - `evidence_reviewed` — Evidence exists but no safe mutation was needed/made
   - `program_adjusted` — Evidence actually mutated the program (RPE caps, volume reductions)
   - `safe_hold` — Evidence suggested changes but they were suppressed for safety

2. **Visible Closure Status in Collapsed Header:** `FeedbackLoopProofCard` now shows:
   - Clear chip label indicating closure state ("Baseline", "Adjusted", "Safe hold", or signal count)
   - One-line collapsed summary explaining what the state means
   - Chip variant changes based on state (default for adjusted, secondary for reviewed, outline for safe hold)

3. **Mutation Proof Lines:** When evidence actually changed the program, a "What changed" section appears with concrete proof:
   - "RPE capped on N exercises (max RPE 7)"
   - "N sets removed for recovery protection"
   - "Conservative progression held (no exercises required capping)"

4. **Suppression Explanation:** When evidence was considered but not applied, a "Why no change was made" section appears with honest reason:
   - "Shaping pass skipped: no active influence from evidence"
   - "Shaping pass skipped: insufficient confidence for structural changes"
   - "N constraints considered but suppressed"

5. **Truth Sources Used:** The resolver derives display state from:
   - `ProgramEvidenceFeedbackSummary` (signal counts)
   - `EvidenceCalibrationGenerationInfluence` (influence status, constraints)
   - `EvidenceCalibrationShapingProof` (mutation proof, RPE caps, volume adjustments)

**Files Changed:**
- `components/programs/FeedbackLoopProofCard.tsx` — Added closure state resolver, updated all three render paths to use derived closure display, added mutation proof and suppression note sections, added `shapingProof` prop
- `app/(app)/program/page.tsx` — Added `shapingProof={generationShapingProof}` prop to FeedbackLoopProofCard

**Files NOT Touched:**
- Database schema/migrations
- Evidence generation corridor (`lib/program/evidence-calibration-generation-influence.ts`, `lib/program/evidence-calibration-program-shaping.ts`)
- Method override planner from AB16
- Live workout reducer/state machine
- Superset/grouped execution contracts from AB15

**Acceptance Tests:**
- No evidence: Card shows "Baseline" chip with "Using onboarding baseline until you log tests or workouts"
- Evidence exists but no mutation: Card shows signal count with "Evidence reviewed, no changes needed"
- Evidence with mutation: Card shows "Adjusted" chip with "Program adjusted — your logged data shaped this program" and concrete mutation proof
- Suppressed constraints: Card shows "Safe hold" chip with honest suppression explanation
- Old programs without shaping proof: Card renders safely with summary-based display
- TypeScript: PASS (zero errors)
- Build: PASS

**IQ7.1 Visible Identity Repair (AB17.1):**

After UI consolidation, the feedback-loop closure surface was hidden under the generic title "Recent adjustments." Users could not recognize where the feedback loop status lived.

1. **Explicit Title:** Changed card title from "Recent adjustments" to "Feedback Loop Status" in Program Page render
2. **Strengthened Collapsed Summaries:** Updated all four closure states to include explicit status prefix:
   - `baseline` → "Baseline — no logged workout evidence yet"
   - `program_adjusted` → "Program adjusted — your logged data shaped this program"
   - `safe_hold` → "Safe hold — evidence reviewed, program unchanged"
   - `evidence_reviewed` → "Evidence reviewed — no changes needed yet" or "Evidence reviewed — your logged data shaped this program"
3. **Bridge to Coach Recommendation:** The existing `EvidenceCoachRecommendationCard` already shows `programShapingProofLabel` and `programShapingProofDetail` via `ProgramShapingProofLine` component — no additional bridge needed

**Files Changed (IQ7.1):**
- `app/(app)/program/page.tsx` — Changed FeedbackLoopProofCard title from "Recent adjustments" to "Feedback Loop Status"
- `components/programs/FeedbackLoopProofCard.tsx` — Updated all four `collapsedSummary` values to include explicit status prefix

**Preserved:**
- AB16 Method Override Planner intact
- Coach Intelligence disabled tiles remain disabled (Calibration, Coach Recs, Plan Logic) — their truth inputs are absent
- No new clutter or duplicate cards added

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
| IQ2 | Session role / label truth hardening | COMPLETE |
| IQ3 | Selected skill coverage and rotation truth | COMPLETE |
| IQ4 | Calibration test recommendation intelligence | COMPLETE |
| IQ5 | Exercise prescription unit/type truth | VERIFIED STRONG |
| IQ6 | Method decision usefulness and survival | COMPLETE |
| IQ7 | Feedback loop closure | COMPLETE |
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
