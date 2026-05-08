# Step 25 — Intelligence, Coaching, Usability, and Performance Enhancement Audit

## Overview

This document records the official audit of SpartanLab's intelligence, coaching, usability, and performance systems as of Step 25.1. It serves as the source of truth for prioritizing the Step 25 checklist.

**Previous State:** Step 24.1 complete; Step 24 was the next implied branch (missed-workout multi-action expansion).

**New State:** Step 24 parked as final validation phase; Step 25 is the active branch focused on making existing computed intelligence visible, actionable, and trustworthy.

**Reason for Change:** Missed-workout multi-action expansion (Step 24.2-24.7) is validation/edge-case work. The immediate highest-value work is surfacing and improving the intelligence that already exists in the codebase.

---

## Current Intelligence Inventory

### REAL_COMPUTED_AND_VISIBLE

These systems compute real intelligence AND surface it to users:

| System | File | What It Does | Visible Where |
|--------|------|--------------|---------------|
| Evidence Coach Recommendations | `lib/program/evidence-derived-coach-recommendations.ts` | Derives actionable recommendations from performance evidence calibration | EvidenceCoachRecommendationCard |
| Missed Workout Advisory | `lib/program/missed-workout-recomposition-advisory.ts` | Detects missed sessions, recommends actions | AdaptiveProgramDisplay |
| Injury Substitution Advisory | `lib/program/injury-substitution-advisory.ts` | Flags exercises that conflict with pain/cautions | AdaptiveProgramDisplay, AdaptiveSessionCard |
| Why This Workout | `components/programs/WhyThisWorkoutBlock.tsx` | Explains session purpose | Program page session cards |
| Weekly Method Decision | `components/programs/WeeklyMethodDecisionAccordion.tsx` | Shows method selection reasoning | Program page accordion |
| Doctrine Influence Map | `components/programs/DoctrineInfluenceMap.tsx` | Visualizes doctrine application | Program page proof section |

### REAL_COMPUTED_BUT_WEAKLY_VISIBLE

These systems compute real intelligence but it's not prominently surfaced:

| System | File | What It Does | Visibility Issue |
|--------|------|--------------|------------------|
| Unified Coaching Engine | `lib/unified-coaching-engine.ts` | Central orchestration of all intelligence systems | Output consumed by builder but not directly visible to user |
| Training Differentiation Calibrator | `lib/program/training-differentiation-calibrator.ts` | Calibrates program to athlete profile | Logic runs but user doesn't see specific calibration decisions |
| Doctrine Utilization Contract | `lib/program/doctrine-utilization-contract.ts` | Tracks which doctrine rules were applied | Technical proof exists but not user-friendly |
| Weekly Method Representation | `lib/program/weekly-method-representation.ts` | Tracks how methods express across week | Available but deeply nested in proof UI |
| Performance Trend Intelligence | `lib/program/performance-trend-intelligence-contract.ts` | Tracks performance trends | Exists but trend visibility is limited |
| Fatigue Decision Engine | `lib/fatigue-decision-engine.ts` | Makes training decisions based on fatigue | Runs but decisions not explained to user |
| Skill Readiness Engine | `lib/skill-readiness-engine.ts` | Assesses readiness for skills | Available but not prominently surfaced |

### REAL_COMPUTED_BUT_NOT_VISIBLE

These systems compute intelligence that users never see:

| System | File | What It Does | Why Not Visible |
|--------|------|--------------|-----------------|
| Doctrine-to-Output Verification | `lib/doctrine-to-output-verification.ts` | Verifies doctrine applied correctly | Internal verification only |
| Constraint Explanation | `lib/constraint-explanation.ts` | Explains why constraints apply | Not surfaced in UI |
| Training Principles Engine | `lib/training-principles-engine.ts` | Selects method profiles | Selection logic hidden from user |
| Movement Bias Detection | `lib/movement-bias-detection-engine.ts` | Detects movement pattern biases | Detection runs but not reported |
| Performance Envelope Service | `lib/performance-envelope-service.ts` | Tracks performance boundaries | Envelope state not shown to user |
| Rest Intelligence | `lib/rest-intelligence.ts` | Determines optimal rest periods | Rest reasoning not explained |
| RPE Adjustment Engine | `lib/rpe-adjustment-engine.ts` | Adjusts RPE targets | Adjustments not explained |

### UI_TEXT_ONLY_OR_COSMETIC

Minimal — most visible text is derived from computed truth. However:

| Surface | Issue |
|---------|-------|
| Some marketing copy | Claims capabilities that are computed but not prominently visible |
| Generic coach messages | Some fallback messages when evidence is insufficient |

### MISSING_BUT_NECESSARY

Intelligence gaps that would make the product feel elite:

| Gap | Impact | Priority |
|-----|--------|----------|
| Progressive overload visibility | User can't see if they're progressing week to week | HIGH |
| Exercise-level "why this" context | User doesn't know why specific exercises were chosen | HIGH |
| Rest/RPE reasoning | User sees numbers but not the reasoning | MEDIUM |
| Skill representation audit | User can't verify selected skills are represented | MEDIUM |
| Today guidance based on readiness | Limited actionable "what should I do today" | MEDIUM |
| User control points | Limited ability to adjust without breaking logic | LOW |

### SHOULD_NOT_BUILD_YET

Features that would create fragility or waste if built now:

| Feature | Why Not Yet |
|---------|-------------|
| AI-generated explanations | Would mask real computed truth with generated text |
| Complex personalization UI | Need to surface existing intelligence first |
| Social/community features | Not core to intelligence delivery |
| Step 24.2-24.7 multi-missed actions | Validation/edge-case work; core intelligence first |

---

## User-Question Audit

Answering as a real paying SpartanLab user, with code evidence:

### 1. Why did the app choose this program for me?

**Evidence:** `lib/unified-coaching-engine.ts` synthesizes athlete profile, goals, equipment, constraints. `lib/program/training-differentiation-calibrator.ts` calibrates to profile.

**Verdict:** COMPUTED but WEAKLY VISIBLE. The logic runs but user doesn't see a clear "your program was built because..." summary.

### 2. What changed because of my actual onboarding selections?

**Evidence:** `lib/program/onboarding-truth-expression-audit.ts` tracks onboarding influence. `lib/canonical-profile-service.ts` builds profile from onboarding.

**Verdict:** COMPUTED but WEAKLY VISIBLE. Onboarding selections influence the build but specific mappings aren't shown.

### 3. What changed because of my logged performance?

**Evidence:** `lib/program/performance-feedback-adaptation-contract.ts`, `lib/program/evidence-calibration-generation-influence.ts` apply performance evidence to program.

**Verdict:** COMPUTED and PARTIALLY VISIBLE via EvidenceCoachRecommendationCard. Could be clearer.

### 4. What changed because of fatigue/recovery/readiness?

**Evidence:** `lib/fatigue-decision-engine.ts`, `lib/recovery-fatigue-engine.ts`, `lib/skill-readiness-engine.ts` compute these signals.

**Verdict:** COMPUTED but NOT VISIBLE. Signals exist but aren't surfaced in user-friendly format.

### 5. What should I do today if I feel weak, sore, or short on time?

**Evidence:** `lib/daily-adjustment-engine.ts`, `lib/compression-readiness.ts`, `lib/time-optimization/workout-time-optimizer.ts` exist.

**Verdict:** PARTIALLY COMPUTED. Some systems exist but "what should I do today" guidance is limited.

### 6. How do I know the program is progressing week to week?

**Evidence:** `lib/adaptive-progression-engine.ts`, `lib/program/exercise-progression-prescription.ts` handle progression.

**Verdict:** COMPUTED but NOT VISIBLE. Progression logic runs but week-to-week advancement isn't clearly shown.

### 7. How do I know selected skills are represented truthfully?

**Evidence:** `lib/program/skill-specific-truth-resolution.ts`, `lib/ai-truth-selected-skills-audit.ts` audit skill representation.

**Verdict:** COMPUTED but WEAKLY VISIBLE. Audits exist but user doesn't see clear skill representation report.

### 8. How does the app decide when to increase difficulty?

**Evidence:** `lib/adaptive-progression-engine.ts`, `lib/program/performance-feedback-adaptation-contract.ts` control progression.

**Verdict:** COMPUTED but NOT EXPLAINED. Progression happens but reasoning isn't shown.

### 9. How does the app decide when to reduce difficulty?

**Evidence:** `lib/adaptive-deload-recovery-engine.ts`, `lib/fatigue/deload-system.ts`, `lib/program/evidence-aware-program-calibration-governor.ts` control deload/reduction.

**Verdict:** COMPUTED but NOT EXPLAINED. Same gap as progression.

### 10. How does the app help me avoid pain/injury without becoming annoying?

**Evidence:** `lib/program/injury-substitution-advisory.ts`, `lib/constraint-integration.ts`, `lib/protocols/joint-integrity-protocol.ts` handle safety.

**Verdict:** COMPUTED and PARTIALLY VISIBLE. Injury advisory works but could be less intrusive.

### 11. How does the app adjust rest, RPE, volume, intensity, or exercise choice?

**Evidence:** `lib/rest-intelligence.ts`, `lib/rpe-adjustment-engine.ts`, `lib/week-dosage-scaling.ts`, `lib/exercise-intelligence-engine.ts` handle these.

**Verdict:** COMPUTED but NOT EXPLAINED. Adjustments happen but reasoning is hidden.

### 12. How does the app explain decisions without clutter?

**Evidence:** Multiple explanation components exist but some are technical/proof-oriented.

**Verdict:** PARTIALLY ACHIEVED. Some clutter from proof-style UI that isn't user-focused.

### 13. What can the user act on immediately?

**Evidence:** Missed workout actions (Step 23), exercise replacement modal, session start.

**Verdict:** LIMITED. Few actionable controls exist. Most intelligence is informational only.

### 14. What is still hidden, vague, or generic?

- Week-to-week progression status
- Why specific exercises were chosen
- Rest/RPE reasoning
- Fatigue/readiness signals
- Skill representation verification

### 15. What would make this feel like an elite coach instead of a template app?

- Clear "here's why" for every major decision
- Visible progression tracking
- Actionable today guidance
- Exercise-level context
- Reduced technical proof clutter

---

## Official Step 25 Checklist

### Step 25.1 — Intelligence/Coaching/Usability/Performance Audit Lock [COMPLETE]
- [x] Inventory real vs cosmetic intelligence
- [x] Identify strongest next work
- [x] Park Step 24 as final validation
- [x] Produce official checklist

### Step 25.2 — Existing Intelligence Visibility Repair [COMPLETE]
- [x] Surface already-computed doctrine decisions in concise UI
  - **Implementation:** Coach Signals strip added to AdaptiveProgramDisplay.tsx
  - **Source:** `programSurfaceSignals.signals` from `getProgramSurfaceSignals(program)`
  - **Signals surfaced:** Volume reduced for acclimation, Intensity capped, Finishers limited, Density reduced, Secondary work simplified, First-week protection active, Recovery-protected workload, Rebuilding after disruption, Straight-arm stress managed, Finisher work limited
  - **All signals trace to real generation decisions:** prescription propagation audit, week adaptation decision, generation truth snapshot
- [x] Connect weekly method summary to visible session cards (existing via microSignals)
- [x] Show performance envelope state without technical jargon (via surface signals)
- [x] Display fatigue/readiness signals in actionable format (via protective week context + signals)

### Step 25.3 — Program Decision Explanation Upgrade [COMPLETE]
- [x] Derive why-this-program reasoning from canonical builder truth
  - **Implementation:** "Why this program" section added to AdaptiveProgramDisplay.tsx
  - **Source:** `buildProgramDecisionsNarrative(program)` from `lib/program/program-decisions-narrative.ts`
  - **Truth source:** Y2 `trainingDifferentiationCalibration` field on program object
- [x] Show which onboarding selections influenced which decisions
  - **topLevelStrategyLabel:** Derived from weeklyRoleSummary roles (e.g. "Controlled skill-strength wave", "Skill-protected wave", "Primary skill-strength with capacity support")
  - **supportingSentence:** Derived from stress tally and role distribution, personalized with primaryGoal
- [x] Explain method selection in user-friendly terms
  - **perDayStressBreakdown:** Shows "2 high · 3 moderate · 1 low" stress distribution
  - **densityVisibleLine:** Explains density block status when applicable
  - **safetyTag:** Shows "Skill-protected week", "Acclimation week", "Tendon-protected week" when applicable
- [x] No fake reasoning copy — must trace to real computation
  - **Guard:** `available: false` returned when Y2 calibration is missing
  - **All fields derive from real `trainingDifferentiationCalibration.weeklyRoleSummary` rows**

### Step 25.4 — Performance Progression Clarity [COMPLETE]
- [x] Show week-to-week progression status
  - **Implementation:** Progression Clarity section added to AdaptiveProgramDisplay.tsx
  - **Source:** `deriveProgressionClarity(program)` from `lib/program/performance-progression-clarity.ts`
  - **Truth sources:** `evidenceCalibrationInfluence` (AB12-2) + `evidenceCalibrationShapingProof` (AB13-4)
- [x] Display session-to-session load progression
  - **Five states:** advancing, building, holding, protecting, not_enough_evidence
  - **Color-coded badge:** emerald (advancing), blue (building), amber (holding), purple (protecting), gray (not_enough_evidence)
- [x] Explain why progression is happening or being constrained
  - **Reasons array:** Max 3 compact reasons with label + message
  - **Next focus:** Actionable guidance for what to do next
  - **Conservative mode:** Shows RPE capping proof when `shapingProof.cappedExerciseCount > 0`
  - **Volume/recovery bias:** Surfaces volume reduction and recovery prioritization honestly
- [x] Must derive from real program/performance evidence
  - **Guard:** Returns "Building baseline" + "collecting data" when evidence is insufficient
  - **Week 1-2 detection:** Early programs show appropriate baseline-building message
  - **No fake claims:** Never invents progression targets not backed by real fields

### Step 25.5 — Adaptive Session Readiness / Today Guidance Upgrade [NOT_STARTED]
- [ ] Improve today guidance based on readiness, soreness, time, fatigue
- [ ] Connect skill-readiness-engine output to visible suggestions
- [ ] Make guidance actionable without being noisy

### Step 25.6 — Exercise-Level Coaching Upgrade [NOT_STARTED]
- [ ] Add per-exercise "why this" context from builder truth
- [ ] Show skill carryover, method expression, pain risk context
- [ ] Keep explanations short and contextual

### Step 25.7 — Rest / RPE / Effort Intelligence Usability [NOT_STARTED]
- [ ] Explain rest period reasoning in user terms
- [ ] Clarify RPE targets and why they are set
- [ ] Connect to existing rest-intelligence and rpe-adjustment-engine

### Step 25.8 — Selected Skill Representation Truth [NOT_STARTED]
- [ ] Audit whether selected skills appear directly or via carryover
- [ ] Explain why a skill is represented indirectly if applicable
- [ ] No selected priority should silently disappear

### Step 25.9 — Recovery / Injury / Substitution Coaching Integration [NOT_STARTED]
- [ ] Integrate injury-substitution-advisory into visible coaching
- [ ] Show recovery guidance from recovery-fatigue-engine
- [ ] Keep safety guidance advisory-first without bloating UI

### Step 25.10 — User Control Without Breaking Intelligence [NOT_STARTED]
- [ ] Identify safe user override points
- [ ] Add gentle warnings when choices are less optimal
- [ ] Connect to existing override-signal-service

### Step 25.11 — Coaching Noise Reduction / Premium UX Polish [NOT_STARTED]
- [ ] Audit coaching surfaces for duplicated/confusing content
- [ ] Remove technical proof clutter from user-facing UI
- [ ] Keep high-value explanations, remove low-value noise

### Step 25.12 — End-to-End Intelligence Truth-to-UI Lock [NOT_STARTED]
- [ ] Verify truth survives: builder → adaptation → normalization → persistence → API → client → UI
- [ ] Audit Program UI, Today UI, Live Workout UI for intelligence delivery
- [ ] Close Step 25 only after visible user proof

### Step 24 Final Validation [PARKED]
- [ ] V.V2: reduce_next_session_intensity audit
- [ ] V.V3: protect recovery spacing preview
- [ ] V.V4: reduce-intensity mutation corridor
- [ ] V.V5: recovery-spacing mutation corridor
- [ ] V.V6: multi-session push-forward guardrail
- [ ] V.V7: persistence/reload proof

---

## Truth-to-UI Risk Map

Places where intelligence can get lost between computation and display:

| Stage | Risk | Mitigation |
|-------|------|------------|
| Builder/Generator | Intelligence computed but not stamped on program object | Ensure all decisions are stamped |
| Normalizer | Fields stripped during normalization | Preserve intelligence fields |
| Persistence/Reload | Intelligence lost on save/load | Include in serialization |
| API/Route | Fields not passed through API | Include in response shape |
| Client Hydration | Fields not consumed by client state | Pass to components |
| Program UI | Components don't render intelligence | Wire to visible surfaces |
| Today UI | Session context not passed | Include session intelligence |
| Live Workout UI | Runtime intelligence not shown | Surface in workout execution |
| Duplicate Display Helpers | Multiple paths diverge | Single source of truth |
| Proof Cards | Technical proofs not tied to user value | User-focused explanations |

---

## Files Inspected

- `lib/program/master-truth-connection-blueprint.ts`
- `lib/program/evidence-derived-coach-recommendations.ts`
- `lib/unified-coaching-engine.ts`
- `lib/program/missed-workout-recomposition-advisory.ts`
- `lib/program/injury-substitution-advisory.ts`
- `lib/fatigue-decision-engine.ts`
- `lib/skill-readiness-engine.ts`
- `lib/rest-intelligence.ts`
- `lib/rpe-adjustment-engine.ts`
- `lib/adaptive-progression-engine.ts`
- `lib/program/training-differentiation-calibrator.ts`
- `lib/program/doctrine-utilization-contract.ts`
- `lib/program/performance-trend-intelligence-contract.ts`
- `lib/program/skill-specific-truth-resolution.ts`
- `lib/constraint-explanation.ts`
- `lib/training-principles-engine.ts`
- `lib/movement-bias-detection-engine.ts`
- `lib/performance-envelope-service.ts`
- `components/programs/` (all tsx files)

---

## Next Recommended Prompt

**Step 25.2 — Existing Intelligence Visibility Repair**

Focus on making already-computed intelligence visible without adding new computation. Prioritize:
1. Fatigue/readiness signals in user-friendly format
2. Weekly method summary connection to session cards
3. Performance envelope state visibility

This maximizes user-visible intelligence improvement with minimal code risk.
