# Official Checklist of May 14th, 2026

This is the active SpartanLab roadmap/checklist as of May 14th, 2026. Unless the user explicitly asks for an older historical checklist, future checklist additions should append to this dated roadmap.

This checklist supersedes ambiguous older checklist references. Do not invent new checklist numbers. Do not advance unless the current step passes TypeScript, build/deploy or environment-gate classification, runtime behavior proof, and visible UI proof.

---

## CURRENT ACTIVE POSITION (Updated after MASTER-8C.41)

**Current active completed step:** MASTER-8C.41 / AB20.4.34  
**Current protected corridor:** Method Planner + Superset structural + Set/Volume + Prehab/Rehab Safeguards + Recovery/Readiness + Exercise Knowledge Coverage + Progression/Periodization + Coach Recs + Plan Logic (mutation-readiness corridor complete, controlled dry-run writer active, bounded apply eligibility gate active, marker-only confirmation boundary preview active)  
**Current active step:** MASTER-8C.42 / AB20.4.35 — Marker-only saved permission artifact or first controlled marker save (only if explicitly authorized and future targets exist with cautions cleared)  
**Stale historical checklists:** PROGRAM_INTELLIGENCE_QUALITY_CHECKLIST.md is historical/context only

### Marker-Only Confirmation Boundary Preview (MASTER-8C.41)
- MASTER-8C.41 continues controlled future-session mutation writer corridor (Step 3 of 5)
- New pure helper: marker-only-confirmation-boundary-preview.ts (478 lines)
- 9 statuses: unavailable_missing_upstream, blocked_active_caution, blocked_no_future_targets, blocked_apply_gate_locked, blocked_dry_run_not_ready, blocked_permission_gate_locked, marker_preview_locked, marker_preview_ready_future_step, future_marker_save_step_locked
- All marker control/action flags locked false: canEnableMarkerConfirmationControl, canSaveMarker, canWriteMarker, canApplyMutation, canWriteSessions, canPersistProgram, canChangeProgramCards, canChangeStartWorkout, canChangeLiveWorkout
- All safety flags true: noMarkerSaved, noMarkerWriteAttempted, noProgramChangesApplied, noWorkoutChangesApplied, completedSessionsProtected, futureTargetsRequired
- canRenderMarkerConfirmationPreview may be true when ready, but controls remain locked
- Priority order: missing upstream > active caution > no future targets > apply gate locked > dry-run not ready > permission gate locked
- Plan Logic card: "Marker-Only Confirmation Boundary" (orange border)
- AI Foundation Map: Plan Logic row shows "Marker: [status]" chip
- Non-interactive "marker save locked" pill visible
- Programs/exercises/sets changed: NO

### Bounded Mutation Apply Eligibility Gate (MASTER-8C.40)
- MASTER-8C.40 continues controlled future-session mutation writer corridor (Step 2 of 5)
- New pure helper: bounded-mutation-apply-eligibility-gate.ts (482 lines)
- 8 statuses: unavailable_missing_upstream, blocked_active_caution, blocked_no_future_targets, blocked_permission_locked, blocked_pre_mutation_lock, blocked_dry_run_not_ready, eligible_confirmation_preview_only, eligible_apply_future_step_locked
- All UI flags locked: confirmationUiAllowed: false, applyButtonAllowed: false, applyButtonDisabled: true
- All write flags locked false: canWriteSessions, canPersistProgram, canSaveMarker, canChangeProgramCards, canChangeStartWorkout, canChangeLiveWorkout
- All safety flags true: noProgramChangesApplied, noMarkerSaved, noWorkoutChangesApplied, completedSessionsProtected, futureTargetsRequired
- Priority order: active caution > no future targets > permission locked > pre-mutation lock > dry-run not ready
- Plan Logic card: "Bounded Mutation Apply Gate" (violet border)
- AI Foundation Map: Plan Logic row shows "Apply: [status]" chip
- Programs/exercises/sets changed: NO

### Controlled Future-Session Mutation Writer Dry-Run (MASTER-8C.39)
- MASTER-8C.39 begins controlled future-session mutation writer corridor (Step 1 of 5)
- New pure helper: controlled-future-session-mutation-writer-dry-run.ts (604 lines)
- 8 statuses: unavailable_missing_upstream, blocked_active_caution, blocked_no_future_targets, blocked_permission_locked, blocked_pre_mutation_lock, blocked_writer_boundary, dry_run_ready_preview_only, dry_run_empty_preview_only
- All action flags locked false: canWriteSessions, canPersistProgram, canSaveMarker, canChangeProgramCards, canChangeStartWorkout, canChangeLiveWorkout, canApplyStructuralMutation
- All safety flags true: dryRunOnly, completedSessionsProtected, futureSessionsPreviewOnly, noProgramChangesApplied, noMarkerSaved, noLiveWorkoutChangesApplied
- Dry-run operations built from structural preview candidates only (no fabrication)
- Plan Logic card: "Controlled Mutation Writer — Dry Run" (cyan border)
- AI Foundation Map: Plan Logic row shows "Dry-Run: [status]" chip
- Programs/exercises/sets changed: NO

### Pre-Mutation Lock / Bundle Closure (MASTER-8C.38)
- MASTER-8C.38 closes the mutation-readiness corridor (Step 7 of 7)
- New pure helper: pre-mutation-lock-bundle-closure.ts (545 lines)
- 8 statuses: unavailable_missing_upstream, locked_active_caution, locked_no_future_targets, locked_permission, locked_structural_preview, locked_writer_boundary, bundle_closed_future_locked, bundle_closed_preview_ready_read_only
- All action flags locked false: canMutateFutureSessions, canSaveMarker, canInstantiateWriter, canApplyProgramChanges, canChangeProgramCards, canChangeStartWorkout, canChangeLiveWorkout, canPersistMutation
- All safety flags true: completedSessionsProtected, futureSessionsLocked, markerLocked, programCardsUnchanged, startWorkoutUnchanged, liveWorkoutUnchanged, persistenceUnchanged
- Plan Logic card: "Pre-Mutation Lock / Bundle Closure" (fuchsia border) with gate summary and protected invariants
- AI Foundation Map: Plan Logic row shows "Bundle: [status]" chip
- Programs/exercises/sets changed: NO

### Future-session Mutation Writer Readiness Boundary (MASTER-8C.37)
- MASTER-8C.37 added a read-only future-session mutation writer readiness boundary determining writer-readiness
- New pure helper: future-session-mutation-writer-readiness-boundary.ts (632 lines)
- 10 statuses: unavailable_missing_upstream, blocked_active_caution, blocked_no_future_targets, blocked_completed_only, blocked_confirmation_permission_locked, blocked_structural_preview_not_ready, blocked_writer_not_authorized, writer_boundary_locked, writer_boundary_preview_ready_read_only, future_locked
- All action flags locked: canInstantiateWriter, canWriteFutureSessions, canSaveMutationMarker, canApplyMutation, canChangeCompletedSessions, canChangeProgramCards, canChangeStartWorkout, canChangeLiveWorkout, canPersistMutation
- All safety flags true: completedSessionsProtected, futureSessionsNotWritten, noMarkerSaved, noProgramChangesApplied, noProgramCardChangesApplied, noStartWorkoutChangesApplied, noLiveWorkoutChangesApplied, noPersistenceChangesApplied
- Plan Logic card: "Future-session Mutation Writer Readiness Boundary" (rose border) with protected invariants
- AI Foundation Map: Plan Logic row shows "Writer: [status]" chip
- Programs/exercises/sets changed: NO

### User Confirmation / Marker Permission Preview Gate (MASTER-8C.36)
- MASTER-8C.36 added a read-only user confirmation/marker permission preview gate determining permission-readiness
- New pure helper: user-confirmation-marker-permission-preview-gate.ts (488 lines)
- 10 statuses: unavailable_missing_upstream, blocked_active_caution, blocked_no_future_targets, blocked_completed_only, blocked_structural_preview_unavailable, blocked_structural_preview_not_ready, blocked_confirmation_contract_unavailable, marker_permission_preview_locked, permission_preview_ready_read_only, future_locked
- All permission flags locked: canShowConfirmationUi, canSaveMarker, canWriteMarker, canApplyMutation, canChangeProgramCards, canBridgeStartWorkout, canBridgeLiveWorkout
- All safety flags true: noConfirmationUiRendered, noMarkerSaved, noMarkerWriteAttempted, noProgramChangesApplied, noProgramCardChangesApplied, noStartWorkoutChangesApplied, noLiveWorkoutChangesApplied
- Plan Logic card: "User Confirmation / Marker Permission Preview Gate" (indigo border)
- AI Foundation Map: Plan Logic row shows "Confirm: [status]" chip
- Programs/exercises/sets changed: NO

### Structural Mutation Preview Contract (MASTER-8C.35)
- MASTER-8C.35 added a read-only structural mutation preview contract determining preview-readiness
- New pure helper: structural-mutation-preview-contract.ts (594 lines)
- 8 statuses: unavailable, blocked_active_caution, blocked_no_future_targets, blocked_completed_only, blocked_target_unresolved, waiting_for_confirmation_contract, preview_contract_ready_read_only, future_locked
- All permission flags locked: canBuildStructuralPreview, canShowConfirmationUi, canWriteMarker, canApplyStructuralMutation, canChangeProgramCards, canBridgeLiveWorkout
- All safety flags true: noProgramChangesApplied, noMarkerSaved, noFutureSessionChangesApplied, noProgramCardChangesApplied, noLiveWorkoutChangesApplied
- Plan Logic card: "Structural Mutation Preview Contract" (cyan border) with status chip, preview counts, safety notes
- AI Foundation Map: Plan Logic row shows "Struct: [status]" chip
- Programs/exercises/sets changed: NO

### Caution Clearance Gate (MASTER-8C.34)
**Current active step:** MASTER-8C.35 / AB20.4.28 — to be verified from checklist (likely structural mutation preview contract, still read-only, no writer yet)  
**Stale historical checklists:** PROGRAM_INTELLIGENCE_QUALITY_CHECKLIST.md is historical/context only

### Caution Clearance Gate (MASTER-8C.34)
- MASTER-8C.34 added a read-only caution clearance gate consolidating all mutation unlock preconditions
- New pure helper: mutation-caution-clearance-gate.ts (531 lines)
- 8 clearance statuses: unavailable, blocked_active_caution, blocked_no_future_targets, blocked_completed_only, clearance_waiting_for_evidence, clearance_review_only, clearance_preview_ready, future_locked
- Extracts caution signals from upstream: evidence trend, review gate, pathway map, target resolution, confirmation contract
- Derives: activeCautionCount, clearedConditionCount, missingProofCount, completedSessionCount, futureSessionCount
- All permission flags locked: canProceedToPreview, canShowConfirmationUi, canWriteMarker, canApplyStructuralMutation, canChangeProgramCards, canBridgeLiveWorkout
- All safety flags true: noProgramChangesApplied, noMarkerSaved, noFutureSessionChangesApplied, noProgramCardChangesApplied, noLiveWorkoutChangesApplied
- Plan Logic card: "Caution Clearance Gate" (amber border) with status chip, caution count, session counts, next safe gate
- AI Foundation Map: Plan Logic row shows "Caution: [status]" chip
- Programs/exercises/sets changed: NO

### Confirmation Contract Preview (MASTER-8C.33)
- MASTER-8C.33 added a read-only confirmation contract preview layer between target resolution and future confirmation UI
- New pure helper: mutation-confirmation-contract-preview.ts (431 lines)
- 8 confirmation contract statuses: unavailable, blocked_no_future_targets, blocked_completed_only, blocked_by_caution, blocked_target_unresolved, waiting_for_review_candidate, preview_eligible_marker_only, future_locked
- 6 candidate statuses: blocked, target_unresolved, completed_protected, no_future_target, review_only, marker_preview_eligible
- Always-false: canShowConfirmationUi, canWriteMarker, canApplyStructuralMutation, canChangeProgramCards, canBridgeLiveWorkout
- Always-true: noMarkerSaved, noProgramChangesApplied, noFutureSessionChangesApplied
- Plan Logic card: "Confirmation Contract Preview" with status chip, counts, safety notes
- AI Foundation Map: Plan Logic row shows "Confirm: [status]" chip + "No marker saved."
- Programs/exercises/sets changed: NO

### Completed/Future Session Identity Resolution (MASTER-8C.32)
- MASTER-8C.32 repaired the target-resolution fragility where completedDays was hardcoded empty
- New pure helper: workout-log-session-identity-readonly-bridge.ts (293 lines)
- 4 identity statuses: no_logs, identity_unavailable, partially_resolved, resolved
- Conservative day extraction from generatedWorkoutId using regex /day[-_\s]?(\d+)/i
- Validates against program session day numbers (no array-index guessing)
- Target resolution now consumes read-only completed-session identity from trusted workout logs
- Reports unavailable/partial identity honestly instead of claiming "0 completed"
- Extended MutationTargetSessionResolutionPreviewModel with identity fields
- Plan Logic card: session identity proof chip + completed protected label + unmapped count
- AI Foundation Map: plan_logic row shows identity status chip
- Reuses existing getRecentWorkoutLogsForGenerationRequest() — no duplicate storage read
- Programs/exercises/sets changed: NO

### Target Session Resolution Preview (MASTER-8C.31)
- New pure helper: mutation-target-session-resolution-preview.ts (622 lines)
- 6 target-resolution statuses: unavailable, blocked_by_caution, no_future_targets, targets_unresolved, targets_resolved_read_only, future_locked
- 5 candidate target statuses: blocked, unresolved, review_only, future_locked, resolved_read_only
- Local session adapter (TargetResolutionSessionInput) avoids importing AdaptiveProgram
- Consumes MutationReadinessReviewGateModel + MutationPathwayReadinessMapModel + program sessions
- canMutateNow always false, mutationAllowed always false, no confirmed plan, no marker
- Plan Logic sheet: compact teal-bordered target resolution card with session counts + candidate target rows
- AI Foundation Map: plan_logic row shows target resolution status + future session count
- No writer/apply/confirm functions called, no storage writes, no apply/approve/confirm UI
- Programs/exercises/sets changed: NO

### Mutation Pathway Readiness Map (MASTER-8C.30)
- New pure helper: mutation-pathway-readiness-map.ts (547 lines)
- 10 pathway gates: 4 active (evidence_connected, trend_classified, candidate_resolution, caution_cleared) + 6 future_locked
- 6 gate statuses: ready, blocked, collect_evidence, review_required, future_locked, not_started
- Consumes MutationReadinessReviewGateModel only (no new storage reads)
- canMutateNow always false, mutationAllowed always false
- Plan Logic sheet: compact indigo-bordered pathway map card with gate counts + gate rows
- AI Foundation Map: plan_logic row shows pathway status + next safe gate + controlled mutation locked
- No writer/apply functions called, no storage writes, no apply/approve/confirm UI
- Programs/exercises/sets changed: NO

### Mutation-Readiness Review Gate (MASTER-8C.29)
- New pure helper: mutation-readiness-review-gate.ts (552 lines)
- 4 gate statuses: collect_evidence, review_candidates_read_only, blocked_by_caution, monitor_only
- 5 candidate resolutions: blocked_caution, review_candidate, collect_more_evidence, monitor, not_ready
- Consumes CoachRecommendationCandidateReadonlyModel + PlanEvidenceReadonlyHookModel + PlanEvidenceTrendReadinessModel
- No new storage reads, no mutation writer, mutationAllowed always false
- Plan Logic sheet: compact rose-bordered review gate card with status, counts, top review/blocker
- Coach Recs footer: review gate summary line
- AI Foundation Map: plan_logic row shows gate status + readiness label + mutation lock
- Programs/exercises/sets changed: NO

### Evidence Trend Classification / Readiness Scoring (MASTER-8C.28)
- New pure helper: plan-evidence-trend-readiness.ts (390 lines)
- 7 trend classifications: insufficient_evidence, evidence_connected, monitoring_pattern, caution_pattern_detected, recovery_pressure_detected, progression_signal_detected, ready_for_review_not_mutation
- 5 readiness postures: collect_more_evidence, monitor_only, review_recommended, caution_review, future_mutation_blocked_readonly
- Consumes PlanEvidenceReadonlyHookModel + CoachRecsWorkoutEvidenceSummary (no duplicate reads)
- Lifted workoutEvidenceSummary to separate useMemo to avoid duplicate localStorage access
- Plan Logic sheet: compact violet trend/readiness card with classification, confidence, signals, posture
- AI Foundation Map: plan_logic row shows trend classification + readiness posture + mutation lock
- Programs/exercises/sets changed: NO

### Plan Evidence Read-Only Hook (MASTER-8C.27)
- New pure helper: plan-evidence-readonly-hook.ts (162 lines)
- New types: PlanEvidenceHookStatus, PlanEvidenceHookConfidence, PlanEvidenceReadonlyHookModel
- Derives from Coach Recs candidate model (no duplicate localStorage reads)
- Three states: read_only_connected, waiting_for_evidence, unavailable
- Plan Logic sheet: compact evidence hook card above ProgramTruthSummary
- AI Foundation Map: plan_logic row now shows dynamic evidence proof
- Branch map: plan_logic upgraded from partial to read_only
- Programs/exercises/sets changed: NO

### Workout Evidence Read-Only Bridge (MASTER-8C.24)
- New pure helper: coach-recommendation-workout-evidence-readonly-bridge.ts (299 lines)
- New types: CoachRecsWorkoutEvidenceAvailability, CoachRecsWorkoutEvidenceQuality, CoachRecsWorkoutEvidenceSummary
- Analyzer extended: workoutEvidenceSummary input, structured evidence-tier decisions, evidence-aware quality summaries
- Local trusted logs consumed via getRecentWorkoutLogsForGenerationRequest() (client-safe, returns [] on server)
- Evidence signals: RPE, pain/tension, readiness/fatigue, under-target performance, high-effort
- Evidence collection candidate splits: no-evidence vs weak-evidence messaging
- UI: Compact emerald evidence proof line when evidence exists; Foundation Map evidence label
- Server evidence reader touched: NO
- Programs/exercises/sets changed: NO

### Coach Recs Priority + Source Quality Refinement (MASTER-8C.23)
- Analyzer rewritten: 453 -> 609 lines with source-quality layer
- New types: CoachRecommendationEvidenceTier, CoachRecommendationActionReadiness
- Per-candidate fields: evidenceTier, actionReadiness, sourceQualityLabel, sourceQualityExplanation, shouldAvoidScaryLanguage
- Model-level fields: evidenceTierSummary, sourceQualitySummary, appliedRecommendationReadiness
- Priority refinement: "high" shows as "structural caution" in UI; confidence downgraded without logged evidence
- Wording refinement: Plan-structure inference vs logged evidence clearly separated; no scary language from inference alone
- UI: Evidence-tier chips on cards, source-quality explanations, Foundation Map evidence-tier line
- Old evidence path preserved: YES
- Programs/exercises/sets changed: NO

### Coach Recs Evidence Bridge (MASTER-8C.22)
- Read-only candidate analyzer: CREATED (453 lines)
- Old evidence path preserved: YES (EvidenceCoachRecommendationBundle untouched)
- Inputs consumed: Recovery/Readiness, Prehab/Tendon, Progression/Periodization, Program Balance, Exercise Knowledge, Adaptive Foundation
- Categories: prehab_tendon, recovery, progression_periodization, program_balance, exercise_knowledge, evidence_collection, set_volume
- Every candidate: appliedToProgram: false, mutationStatus: read_only_not_applied
- UI surfaces: Coach Recs tile (Preview badge), sheet (candidate cards), Foundation Map (dynamic row)
- Branch status: read_only (mutation_locked)
- Programs/exercises/sets changed: NO
- Plan Logic updated: YES (dynamic coach_recs row + candidate sheet)

### Progression / Periodization (MASTER-8C.21)
- Read-only analyzer: CREATED (664 lines)
- Inputs consumed: program structure, recovery/readiness, safeguards, exercise knowledge, program balance, workout evidence
- Classifies: posture (acclimation/buildup/accumulation/intensification/skill_practice/recovery_protective/maintenance/mixed/unclear)
- Classifies: direction (conservative/normal/aggressive/blocked/unknown)
- Classifies: confidence (high/medium/low/insufficient)
- Dynamic UI proof: YES (headline, posture, direction, confidence, signals, sources, missing, mutation lock)
- Branch map: Added progression_periodization branch (order 5, 14 total branches)
- Branch status: read_only (mutation_locked)
- Future sessions changed: NO
- Plan Logic updated: YES (dynamic row content)

### Exercise Knowledge Coverage (MASTER-8C.20)
- Coverage analyzer: CREATED (257 lines, thin adapter wrapping existing resolver)
- Existing resolver reused: summarizeExerciseIdentityCoverage() from program-balance-exercise-identity-coverage.ts
- Seed entries added: NO (existing 80+ entries already cover priority exercises)
- Categories: full_science_known, alias_resolved, basic_identity_known, enhanced_partial_known, truly_unknown
- Dynamic UI proof: YES (headline, summary counts, basic/partial exercises, unknown exercises, sources)
- Branch status: read_only (mutation_locked)
- Exercises changed: NO
- Plan Logic updated: YES (dynamic row content)

### Recovery / Readiness (MASTER-8C.19)
- Read-only analyzer: CREATED (541 lines)
- Sources consumed: program structure, adaptive foundation, program balance, safeguard intelligence
- Detection: protected week, intensity capped, volume reduced, high recovery demand, tendon stress escalation
- Honest missing-source reporting: YES
- Deterministic IDs: YES (no Date.now)
- Dynamic UI proof: YES (readiness headline, confidence, signals, sources, missing sources)
- Branch status: read_only (mutation_locked)
- Future sessions changed: NO
- Plan Logic updated: YES (dynamic row content)

### Prehab/Rehab/Tendon Safeguards (MASTER-8C.18 + 8C.18.1 Repair)
- Read-only analyzer: CREATED (695 lines)
- Date.now() removed: YES (deterministic IDs now)
- Analyzer wired to UI: YES (useMemo + prop passing)
- Dynamic UI proof: YES (risk/confidence/signals rendered)
- Detection: wrist, elbow/biceps tendon, shoulder, grip/forearm, core/hip flexor
- Branch status: read_only (mutation_locked)
- Substitutions changed: NO
- Exercises changed: NO
- Plan Logic updated: YES (dynamic row content)

### Set/Volume Prescription Rationale (MASTER-8C.17)
- Read-only analyzer: CREATED
- Verdict logic: well_justified, reasonable_but_watch, weakly_justified, missing_source_context
- Branch status: partial (was missing_foundation)
- Set counts changed: NO
- Plan Logic updated: YES

### Superset Structural Corridor Accepted (MASTER-8C.13 through MASTER-8C.15.2)
- Superset structural apply: WORKING
- Superset persistence via saveAdaptiveProgram: WORKING
- Program Card grouped render (Day 4 A/B pairs): WORKING
- Manage Applied Additions for Superset: WORKING
- Native vs user-applied provenance detection: WORKING
- Native Superset protected from removal: WORKING
- User-applied Superset removable/resettable: WORKING
- Reset preserves native, removes user-applied: WORKING
- Native additive frequency controls unlocked: WORKING
- Live Workout Superset runtime: VISUALLY ACCEPTED

### Protected Method Planner State (MASTER-8C.12.1 through 8C.15.2 Verified)
- Row-level frequency placement is working and protected
- **UX UNIFIED:** Frequency controls now inside method detail view (8C.12.1A)
- **Standalone frequency section DEMOTED:** Collapsed under "Advanced Placement Diagnostics" (8C.12.1B)
- **Selective removal UI VISIBLE:** ManageAppliedAdditionsSection with checkboxes (8C.12.1C)
- **Target ranking IMPROVED:** Score-based with method load preference (8C.12.1D)
- **Blocked messaging FIXED:** Clear reasons for structural methods (8C.12.1E)
- Persistence: PASSED (via saveAdaptiveProgram)
- Selective removal: PASSED
- Live workout render: PASSED
- Circuits: Route through structural apply flow (messaging updated)
- Supersets: Blocked with clear "needs structural pair writer" message
- Density Blocks: Blocked with clear "needs timed/sequence runtime" message

### Currently Blocked Methods (Honest Reasons)
- **Supersets:** Structural override writer not enabled yet (needs grouped method infrastructure)
- **Density Blocks:** Timed-window logging/runtime model not implemented (doctrine documented)
- **AMRAP:** Needs doctrine definition — may be separate method family (doctrine documented)
- **Endurance/Conditioning:** Real modality/exercise prescription not implemented

---

## Max-Intent Build Bracket — Required Under Every Future Step

Every future step in this roadmap must satisfy these checks before claiming PASS:

### 1. Max Intent Knowledge Base Check
- The implementation must avoid cheap/generic logic.
- If programming is touched, consider exercise science, skill priority, muscle balance, movement families, tendon/joint stress, recovery, progression, method compatibility, and user-specific profile truth.

### 2. Source-of-Truth Check
- Identify the authoritative source.
- Identify which branches consume it.
- Prevent duplicate or conflicting truth.

### 3. Truth-to-UI Survival Check
- Any computed intelligence must survive to visible UI proof if the user should see it.

### 4. User-Specific Doctrine Alignment Check
- The user's selected skills, equipment, strength anchors, recovery profile, joint cautions, and preferences must be considered.

### 5. Branch-Impact Review
Every future step must state whether it affects:
- Skill Map
- Method Planner
- Adaptive Foundation
- Calibration
- Coach Recs
- Plan Logic
- Recovery/Readiness
- Prehab/Rehab/Tendon Safeguards
- Program Balance
- Exercise Knowledge Base
- Evidence/Workout History
- Live Workout Runtime
- Program Cards
- Saved Program Persistence

### 6. No Mutation Before Read-Only Proof
- Future-session mutation cannot be enabled until the relevant read-only source proves correct.

### 7. Method Planner Protection
- Current green `Applied 6` behavior is protected.
- Method Planner may only be changed at safe insertion points when the new foundation contracts reach that corridor.
- Do not destroy working Method Planner behavior.

### 8. Disabled/Partial Hub Tile Accounting
- Coach Recs, Calibration, Plan Logic, or any disabled/partial AI Hub tile must not be forgotten.
- If a future foundation branch should feed them, document that dependency before building.

### 9. TypeScript/Build Proof
```bash
pnpm tsc --noEmit --pretty false
pnpm run build
```

### 10. Exact Visible Proof
- Every step must specify route, tile/card, modal/sheet, exact text/chip, and PASS/FAIL visual.

---

## Official Step Order

Use this exact sequence unless a build gate or repair gate blocks it.

### MASTER-8B.0 — True-Source Roadmap Inventory + Hub Contract Freeze

**Status:** COMPLETE

**Purpose:** Inventory all true-source branches before building more logic.

**What This Step Delivered:**
- Created this dated roadmap document
- Defined the Max-Intent Build Bracket
- Created the True-Source Branch Inventory
- Froze Method Planner current working behavior as protected
- Classified all Coach Intelligence hub tiles
- Defined the official step order through MASTER-8D

---

### MASTER-8B.1 — Cross-Branch True-Source Foundation Registry / Contracts

**Status:** COMPLETE

**Purpose:** Create typed contracts/registry describing all true-source branches and their ownership boundaries without changing program behavior.

**What This Step Delivered:**
- Created `lib/program/true-source-registry.ts` (998 lines)
- Defined 16 true-source branches with complete ownership contracts
- Defined 7 Coach Intelligence tile contracts
- Method Planner protected as `protected_active` with existing_writer_only mutation authority
- Active-week mutation service classified as `primitive_placeholder` (NOT the final adaptation writer)
- Adaptive Foundation remains `read_only_active`
- No runtime behavior changed
- Report: `docs/MASTER_8B_1_TRUE_SOURCE_FOUNDATION_REGISTRY_REPORT.md`

**Branches Registered:**
- Skill Map / selected skill representation
- Method Planner / requested method override truth
- Adaptive Foundation / athlete model
- Calibration / evidence lifecycle
- Coach Recs / recommendation bundle
- Plan Logic / construction rationale
- Recovery/Readiness
- Prehab/Rehab/Tendon/Joint Safeguards
- Program Balance / skill and movement distribution (missing_needed)
- Exercise Knowledge Base
- Evidence / workout history / logged sets / RPE / band usage / discomfort notes
- Program Cards
- Live Workout Runtime (protected)
- Saved Program Persistence
- Active Week Mutation Placeholder (primitive_placeholder)

**Files Changed:**
- Created `lib/program/true-source-registry.ts`
- Created `docs/MASTER_8B_1_TRUE_SOURCE_FOUNDATION_REGISTRY_REPORT.md`
- Updated `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md`

**Files NOT Touched:**
- Live workout runtime
- Method Planner apply/revert/reset writers
- Generator logic
- Database schema
- Any UI components

---

### MASTER-8B.2 — Max-Intent Exercise + Skill Knowledge Base Seed Schema

**Status:** COMPLETE

**Purpose:** Create a structured app-readable knowledge contract for exercise/skill science:
- Movement families
- Skill transfer relationships
- Tendon/joint stress mapping
- Frequency tolerance
- Intensity cost / volume cost / failure cost
- Warm-up needs
- Cooldown/mobility needs
- Method compatibility
- Progression/regression paths
- Equipment needs
- User ability gating

**What This Step Delivered:**
- Created `lib/program/exercise-skill-knowledge-contract.ts` (568 lines) - typed contract
- Created `lib/program/exercise-skill-knowledge-seed.ts` (1206 lines) - seed data
- Created `lib/program/exercise-skill-knowledge-validation.ts` (521 lines) - validation helpers
- Created `docs/MASTER_8B_2_EXERCISE_SKILL_KNOWLEDGE_SCHEMA_REPORT.md` (288 lines) - report
- Updated `lib/program/true-source-registry.ts` - knowledge base entry updated to `read_only_active`

**Seeded Coverage:**
- **13 representative exercises** with full profiles (movement families, skill transfer, tissue stress, method compatibility, warm-up/cooldown, progression paths)
- 8 skills with balance requirements (planche, FL, BL, HSPU, MU, OAPU, L-sit, V-sit)
- Weighted Pull-Up and Weighted Dip marked as strength anchors
- Planche Lean (seconds/hold) vs Tuck Planche Push-Up (reps/dynamic) taxonomy correctly separated
- **Note:** This is a representative schema-validation seed, NOT the complete SpartanLab exercise database. Full expansion deferred to MASTER-8C / MASTER-8C+.

**Files NOT Touched:**
- Program Page, Workout Session page, Generator, Method Planner, Adaptive Foundation
- Live workout runtime, database schema, package.json

**Constraint:** No generator wiring yet. Knowledge is read-only foundation.

---

### MASTER-8B.3 — Program Balance / Future Adaptation Readiness Read-Only Intelligence

**Status:** COMPLETE

**Purpose:** Detect (read-only, no mutation):
- Planche under-expression
- Push/pull imbalance
- Pull dominance
- Repeated same-family days
- Missing weighted pull-up/dip anchors
- Poor skill spacing
- Tissue stress risk
- Future-session adaptation candidates

**What This Step Delivered:**
- Created `lib/program/program-balance-intelligence-contract.ts` (435 lines) - typed contract
- Created `lib/program/program-balance-readonly-analyzer.ts` (918 lines) - read-only analyzer
- Created `lib/program/program-balance-validation.ts` (401 lines) - validation/fixture helpers
- Created `docs/MASTER_8B_3_PROGRAM_BALANCE_READONLY_INTELLIGENCE_REPORT.md` - report
- Updated `lib/program/true-source-registry.ts` - program_balance branch to `read_only_active`

**B2 Intake Repair:**
- Fixed B2 report: "14 exercises" → "13 exercises" (actual count)
- Added explicit notes that B2 seed is representative only

**Analyzer Capabilities:**
- Consumes B2 representative knowledge seed (13 exercises, 8 skills)
- Detects skill underexpression, pull dominance, push underrepresentation
- Detects weighted anchor gaps, tissue stress accumulation
- Identifies future-session adaptation candidates (read-only classification)
- Reports knowledge coverage gaps honestly
- Always returns `mutationAllowedNow: false`
- Always returns `fullKnowledgeBaseComplete: false`

**Full Database Expansion:** Deferred to MASTER-8C / MASTER-8C+

**Constraint:** No mutation. No generator wiring. No UI wiring yet.

---

### MASTER-8B.4 — Coach Intelligence Hub Tile Contract Wiring

**Status:** COMPLETE

**Purpose:** Wire the B3 Program Balance read-only analyzer into the Coach Intelligence Hub as an honest read-only tile/sheet.

**What This Step Delivered:**
- Program Balance tile added to Coach Intelligence Hub grid
- Program Balance sheet rendering full B3 read-only result
- Severity-ranked balance findings with visual chips
- Selected-skill expression status and counts
- Movement-family balance summary
- Weighted-anchor (pull-up/dip) presence status
- Tissue-stress summary per region
- Future-session candidates shown as "Not applied" / "Read-only candidate"
- Coverage summary showing known/unknown exercises
- Clear "Read-only" and "Representative seed only" messaging
- No mutation applied — `mutationAllowedNow: false`
- No generator change
- No Program Card change
- No live workout runtime change

**Tiles Preserved:**
- Skill Map — unchanged
- Method Decisions — unchanged
- Adaptive Foundation — unchanged
- Calibration — unchanged
- Coach Recs — unchanged
- Method Planner — unchanged (still green "Applied 6")
- Plan Logic — unchanged

**Files Changed:**
- `lib/program/program-balance-ui-adapter.ts` (new — 265 lines)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (added tile, sheet, imports)
- `docs/MASTER_8B_4_COACH_INTELLIGENCE_HUB_TILE_CONTRACT_WIRING_REPORT.md` (new)

**Constraint:** No fake claims. No mutation. No generator wiring. Read-only only.

---

### MASTER-8B.5 — Method Planner Safe Integration With Foundation Sources

**Status:** COMPLETE

**Purpose:** Only after the foundation registry exists, safely decide whether Method Planner should consume new branch context.

**What This Step Delivered:**
- Foundation context panel added to Method Planner sheet (read-only)
- Panel shows Program Balance link status and finding counts
- Panel clearly states "Read-only" and "No method changes"
- Panel shows representative seed status when applicable
- Panel shows warnings for high/moderate balance findings
- Improved foundation-source extraction in `program-balance-ui-adapter.ts`:
  - Now reads `adaptiveFoundationModel` (preferred) with fallback to `adaptiveFoundation`
  - Now reads `recoveryReadiness` with fallback to `weeklyStressDistributionPlan` and `weeklyStressGovernorAdjustments`
  - Now reads `methodMaterializationSummary` as additional method source fallback
- Created `lib/program/method-planner-foundation-context.ts` pure helper
- All Method Planner writer behavior unchanged
- Applied 6 count unchanged
- Apply/revert/reset behavior unchanged
- No mutation through foundation context

**Files Changed:**
- `lib/program/program-balance-ui-adapter.ts` (improved extraction)
- `lib/program/method-planner-foundation-context.ts` (new - 178 lines)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (foundation context panel)
- `lib/program/true-source-registry.ts` (updated method_planner entry)

**Constraint Preserved:** Applied 6 / native Supersets / Cluster Sets caution behavior unchanged.

---

### MASTER-8B.6 — Controlled Future Session Candidate Planning Foundation

**Status:** COMPLETE

**Purpose:** Create a read-only future-session planning foundation that turns Program Balance findings into structured adaptation plans without applying them.

**What This Step Delivered:**
- Extended `FutureSessionCandidate` contract with `FutureSessionPlanningDetail` interface
- Added typed planning types: `FutureSessionPlanStatus`, `FutureSessionPlanScope`, `FutureSessionPlanAction`
- Created pure helper `lib/program/program-balance-future-planning.ts` (410 lines)
- Future Candidates UI now shows coach-readable planning:
  - Coach title / problem detected
  - Proposed future action
  - Preservation guardrails
  - Blocked reason
  - Data needed
  - Target scope (or honest unknown target wording)
  - Status chips: "Not applied", "No saved-program change", "Needs full DB", "Needs writer"
- Removed stale "Not applied in B4" wording
- Updated `sourceStep` to `MASTER_8B_6` and `nextAllowedStep` to `MASTER_8B_7`

**Files Changed:**
- `lib/program/program-balance-intelligence-contract.ts` (added planning types)
- `lib/program/program-balance-readonly-analyzer.ts` (enriched candidate builder)
- `lib/program/program-balance-future-planning.ts` (new - 410 lines)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (enhanced Future Candidates UI)
- `lib/program/true-source-registry.ts` (updated program_balance entry)

**Constraints Preserved:**
- No mutation: `mutationAllowedNow: false`
- Completed sessions unchanged
- Program Cards unchanged
- Start Workout unchanged
- Live Workout unchanged
- Method Planner Applied 6 unchanged

---

### MASTER-8B.6.1 — Coach Intelligence Hub Contract Inventory + Disabled Tile Empty-State Stabilization

**Status:** COMPLETE

**Purpose:** Stabilize the 8-tile Coach Intelligence Hub architecture before mutation writer design.

**What This Step Delivered:**
- Froze hub at exactly 8 top-level tiles (no additions/removals)
- Added tile contract inventory comment documenting each tile's responsibility
- Made Calibration, Coach Recs, and Plan Logic tiles tappable with honest empty states
- Added `sourceUnavailable` prop to HubButton for muted-but-clickable styling
- Fixed stale Program Balance roadmap copy referencing B4/B5
- Clarified Adaptive Foundation missing-data wording in analyzer
- Documented outside surface inventory (keep near action path vs later consolidate)

**Files Changed:**
- `components/programs/ProgramCoachIntelligenceHub.tsx` (tile contract, HubButton prop, stale copy fix)
- `lib/program/program-balance-readonly-analyzer.ts` (Adaptive Foundation wording)

**Constraints Preserved:**
- Hub still has exactly 8 tiles
- No mutation
- Method Planner Applied 6 unchanged
- Program Cards unchanged
- Start Workout unchanged
- Outside proof/action cards not deleted

**Outside Surface Inventory:**
- Keep near action path: Start Workout, Today Guidance, injury/substitution warnings
- Later consolidate into hub: FeedbackLoopProofCard, EvidenceCoachRecommendationCard, CalibrationCheckpointCard, large proof boxes

---

### MASTER-8B.7 — Guarded User-Confirmed Future-Session Mutation Writer Design

**Status:** DESIGN GATE COMPLETE (Apply Gate Pending)

**Purpose:** Create typed mutation writer contract before enabling any actual mutation. Quarantine legacy auto-mutation.

**What This Step Delivered (Design Gate):**
- Quarantined legacy `lib/active-week-mutation-service.ts` behind `LEGACY_PHASE13_AUTO_MUTATION_ENABLED = false`
- Created typed `lib/program/future-session-mutation-writer-contract.ts` (215 lines)
- Created `lib/program/program-balance-mutation-writer-design.ts` adapter (208 lines)
- Future Candidates now show MASTER-8B.7 design proof chips:
  - "8B.7 design"
  - "User-confirmed only"
  - "Future sessions only"
  - "No saved change"
  - "Program cards unchanged · Live workout later (8B.8)"
- Program Balance status line updated to reflect design gate
- Legacy stale schedule notices blocked from surfacing

**Files Changed:**
- `lib/active-week-mutation-service.ts` (quarantine + gate)
- `lib/program/future-session-mutation-writer-contract.ts` (new - 215 lines)
- `lib/program/program-balance-mutation-writer-design.ts` (new - 208 lines)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (8B.7 proof chips)
- `lib/program/true-source-registry.ts` (updated program_balance entry)

**Constraints Preserved:**
- No actual mutation enabled
- Completed sessions protected
- Saved program unchanged
- Program Cards unchanged
- Live Workout unchanged
- Method Planner Applied 6 unchanged
- User confirmation required before any future mutation

**Next Phase:** MASTER-8B.7.1 Apply Gate — user-confirmed preview/apply writer implementation

---

### MASTER-8B.7.1 — User-Confirmed Future-Session Mutation Preview/Apply Corridor (Marker Only)

**Status:** COMPLETE

**Purpose:** First official user-confirmed apply corridor for Program Balance Future Candidates. Saves marker-only mutation plans without structural workout changes.

**What This Step Delivered:**
- Created `lib/program/future-session-mutation-apply-contract.ts` (328 lines) with:
  - `ConfirmedFutureSessionMutationPlan` type
  - `FutureSessionMutationPlanBundle` type
  - `createConfirmedPlan()` helper
  - `loadMutationPlans()` and `addConfirmedPlan()` storage helpers
  - Safety invariants enforcing marker-only behavior
- Added "Preview mutation plan" button to Future Candidates in Program Balance
- Added confirmation modal with safety guarantees display:
  - Completed sessions protected
  - Future sessions only
  - Program Card marker only — no exercise changes yet
  - Live Workout bridge pending (8B.8)
  - Start Workout unchanged
- Added Program Card mutation markers in `AdaptiveProgramDisplay.tsx`
- Updated Program Balance status line to reflect apply gate ready state

**Files Changed:**
- `lib/program/future-session-mutation-apply-contract.ts` (new - 328 lines)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (preview button + confirmation modal + state)
- `components/programs/AdaptiveProgramDisplay.tsx` (mutation plan marker display)

**Constraints Preserved:**
- Structural workout mutation NOT applied (marker only)
- Completed sessions protected
- Program Card exercise lists unchanged
- Live Workout unchanged
- Start Workout unchanged
- Method Planner Applied 6 unchanged
- User confirmation required for every plan
- Legacy Phase 13 remains disabled

**Next Phase:** MASTER-8B.7.2 — first bounded structural future-session mutation type

---

### MASTER-8B.7.1.1 — Repair: Visible Confirmation Persistence in Future Candidate Rows

**Status:** COMPLETE

**Purpose:** Repair the visible confirmation persistence/display corridor so confirmed/queued mutation plans visibly persist in Future Candidate rows after modal close.

**What This Step Repaired:**
- Added `getConfirmedPlanForCandidate(idx)` helper to resolve confirmed plans by candidate index
- Updated Future Candidates section header to show "{n} queued" when plans exist
- Updated individual row headers to show "Queued" or "Confirmed" instead of "Read-only" when confirmed
- Updated row background to cyan highlight when confirmed
- Replaced "No saved change" chips with "8B.7.1 queued" + "User confirmed" + "Marker only" when confirmed
- Added visible confirmation notice inside row showing honest queued state
- Changed button from "Preview mutation plan" to "Review queued plan" when confirmed
- Pre-populated modal with existing confirmation state when reviewing already-confirmed plans
- Updated footer status to show "{n} mutation plan(s) queued — marker-only, workout structure unchanged"

**Files Changed:**
- `components/programs/ProgramCoachIntelligenceHub.tsx` (row-level confirmation display + helper + button text + modal pre-populate)

**Constraints Preserved:**
- No structural workout mutation
- Completed sessions protected
- Program Cards unchanged
- Live Workout unchanged
- Start Workout unchanged
- Method Planner Applied 6 unchanged
- localStorage persistence unchanged

**Next Phase:** MASTER-8B.7.2 — structural eligibility gate

---

### MASTER-8B.7.2 — Structural Mutation Eligibility + Target Resolution Gate

**Status:** COMPLETE

**Purpose:** Create typed eligibility/resolution gate for user-confirmed future-session mutation plans. Determine whether each confirmed plan is structurally eligible, blocked by full DB, blocked by unresolved target, or still marker-only.

**What This Step Delivered:**
- Added typed eligibility status contracts to `future-session-mutation-apply-contract.ts`:
  - `FutureSessionMutationEligibilityStatus` union type
  - `FutureSessionMutationNextGate` union type
  - `FutureSessionMutationEligibilityResult` interface
  - `EligibilityResolverOptions` interface
- Added pure resolver functions:
  - `resolveFutureSessionMutationEligibility()` — resolves eligibility for a confirmed plan
  - `getEligibilitySummary()` — computes summary across all confirmed plans
- Updated Program Balance UI to show eligibility:
  - Section header shows "{n} queued · 0 structurally eligible · full DB gate pending"
  - Each confirmed row shows "Structural eligibility: Blocked" with reasons
  - Shows blocked reasons: "Full exercise DB required (MASTER-8C)", "Target future session not resolved", etc.
  - Shows next gate: "MASTER 8C FULL EXERCISE DB" or "MASTER 8B 7 3 STRUCTURAL PREVIEW"
  - Modal shows eligibility line when reviewing confirmed plans
  - Footer shows eligibility summary

**Files Changed:**
- `lib/program/future-session-mutation-apply-contract.ts` (eligibility types + resolver functions)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (eligibility display in rows, modal, header, footer)

**Constraints Preserved:**
- canApplyStructuralMutation ALWAYS false in this gate
- No structural workout mutation
- Completed sessions protected
- Program Cards unchanged
- Live Workout unchanged
- Start Workout unchanged
- Method Planner Applied 6 unchanged
- Full exercise DB NOT added (deferred to MASTER-8C)

**Next Phase:** MASTER-8C full exercise DB foundation (if DB is main blocker) or MASTER-8B.7.3 structural preview (if safe candidate exists)

---

### MASTER-8C.1 — Current Program Exercise Knowledge Coverage Foundation + Gate Wiring

**Status:** COMPLETE

**Purpose:** Expand the exercise/skill knowledge seed to cover exercises in the current analyzed program, wire eligibility gates to use computed coverage truth instead of hardcoded false, and distinguish current-program coverage from global DB completeness.

**What This Step Delivered:**
- Added 15 new exercise entries to the knowledge seed covering common program exercises:
  - pppu (Pseudo Planche Push-Up)
  - elevated_pppu (Elevated PPPU)
  - adv_tuck_planche (Advanced Tuck Planche)
  - adv_tuck_fl (Advanced Tuck Front Lever)
  - chest_to_bar_pull_up
  - ring_dip
  - straight_bar_dip
  - explosive_pull_up
  - high_pulls
  - tuck_front_lever_pull
  - support_hold
  - pike_pushup_elevated
  - chin_up
  - archer_pull_up
- Added `currentProgramCoverageComplete` field to `ProgramBalanceKnowledgeCoverageSummary`
- Added `currentProgramKnowledgeCoverageComplete` field to `ProgramBalanceProof`
- Updated `summarizeProgramBalanceKnowledgeCoverage()` to compute current-program coverage
- Replaced all hardcoded `knownExerciseCoverageComplete: false` in ProgramCoachIntelligenceHub with computed coverage truth
- Eligibility gates now derive from actual Program Balance result instead of hardcoded false
- Expanded critical exercise concepts in validation to cover new entries

**Files Changed:**
- `lib/program/exercise-skill-knowledge-seed.ts` (added 15 exercise entries, ~900 lines)
- `lib/program/program-balance-intelligence-contract.ts` (added coverage fields)
- `lib/program/program-balance-readonly-analyzer.ts` (compute coverage, update proof)
- `lib/program/exercise-skill-knowledge-validation.ts` (expanded critical concepts)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (replaced hardcoded false with computed truth)
- `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` (this update)

**Constraints Preserved:**
- canApplyStructuralMutation remains false (MASTER-8B.7.3+ not enabled)
- No structural workout mutation
- Completed sessions protected
- Program Cards structurally unchanged
- Live Workout unchanged
- Start Workout unchanged
- Method Planner Applied 6 unchanged
- Global full DB still deferred (seedIsRepresentativeOnly: true)

**Next Phase:** 
- If remaining truly unknown exercises: MASTER-8C.2 continue knowledge expansion
- If current program coverage complete and target resolution blocked: MASTER-8B.7.2.1 target resolution
- If both coverage and target ready: MASTER-8B.7.3 bounded structural preview

---

### MASTER-8C.1.2 — Program Balance Exercise Source Truth + Stale Copy Repair + Identity Coverage Adapter

**Status:** COMPLETE

**Purpose:** Fix stale "13-entry representative seed" copy after MASTER-8C.1 expanded the seed. Separate "basic exercise exists in app pool" from "full Program Balance science entry exists." Add read-only identity coverage adapter.

**What This Step Delivered:**
- Created `lib/program/program-balance-exercise-identity-coverage.ts` identity coverage adapter
- Distinguishes coverage status: full_science_known, basic_identity_known, alias_resolved, truly_unknown
- Added identity coverage fields to `ProgramBalanceKnowledgeCoverageSummary`:
  - fullScienceKnownCount, basicIdentityKnownCount, aliasResolvedCount, trulyUnknownCount
  - trulyUnknownIds, trulyUnknownNames
  - fullScienceCoverageComplete, basicIdentityCoverageComplete
  - sourceCounts (fullScienceSeedTotal, adaptivePoolTotal)
- Updated `summarizeProgramBalanceKnowledgeCoverage()` to compute identity breakdown
- Removed all stale "13-entry representative seed" copy from UI
- Updated Program Balance UI to show honest coverage breakdown:
  - Shows truly unknown vs basic identity vs full science counts
  - Shows source counts (27 science entries, ~130 pool exercises)
- Structural eligibility still requires full science coverage (not just basic identity)

**Source Counts Found:**
- Full science seed: 27 exercises
- Adaptive exercise pool: 131 exercises
- Enhanced exercise profiles: 17 exercises
- Exercise classification registry: 3 exercises (minimal)

**Files Changed:**
- `lib/program/program-balance-exercise-identity-coverage.ts` (NEW - identity coverage adapter)
- `lib/program/program-balance-intelligence-contract.ts` (added identity coverage fields)
- `lib/program/program-balance-readonly-analyzer.ts` (compute identity breakdown, fix copy)
- `lib/program/true-source-registry.ts` (updated source summary)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (replaced stale copy with honest breakdown)
- `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` (this update)

**Constraints Preserved:**
- canApplyStructuralMutation remains false
- Structural eligibility requires fullScienceCoverageComplete (not basicIdentityCoverageComplete)
- No structural workout mutation
- Completed sessions protected
- Program Cards unchanged
- Live Workout unchanged
- Method Planner Applied 6 unchanged

**Next Phase:** MASTER-8C.2 (if truly unknown exercises remain) or MASTER-8B.7.2.1 (target resolution)

---

### MASTER-8C.2 — Current Program Full Science Coverage Completion + Source Truth Hardening

**Status:** COMPLETE

**Purpose:** Finish full Program Balance science coverage for current-program exercises. Resolve remaining unknown/truly-unknown items. Expand alias maps. Improve UI copy to distinguish app pool from science DB.

**What This Step Delivered:**
- Added 12 new full science entries to `exercise-skill-knowledge-seed.ts`:
  - `tuck_l_sit` - L-sit progression
  - `ring_push_up` - Ring stability pushing
  - `wall_hs_hold` - Handstand foundation
  - `scap_pull_up` - Activation/prehab
  - `hanging_knee_raise` - Core progression
  - `hanging_leg_raise` - Core progression
  - `banded_planche_hold` - Assisted planche training
  - `banded_fl_hold` - Assisted front lever training
  - `fl_rows` - Dynamic FL exercise
  - `muscle_up_negative` - MU progression
  - `compression_work` - Compression skill drill
- Expanded alias map in `program-balance-exercise-identity-coverage.ts`:
  - Added 18+ new alias mappings for commonly generated exercise variants
  - `l_sit_core` → `l_sit_skill`
  - `wall_handstand_hold` → `wall_hs_hold`
  - `ring_pushup` → `ring_push_up`
  - And more...
- Improved UI copy in `ProgramCoachIntelligenceHub.tsx`:
  - Header now shows: "Full coaching science: X exercises | App pool: Y exercises"
  - Coverage labels changed from "Known/Unknown" to "Full Science/Need Science"
  - Clearer messaging about what exercises need science entries

**Source Counts After Update:**
- Full science seed: 38 exercises (up from 27)
- Adaptive exercise pool: 131 exercises (unchanged)
- Enhanced exercise profiles: 17 exercises (unchanged)

**Current Program Coverage Status:**
- Before: 12 known / 9 unknown / 1 truly unknown
- After: Expected to improve significantly with new entries + aliases

**Files Changed:**
- `lib/program/exercise-skill-knowledge-seed.ts` (added 12 new full science entries)
- `lib/program/program-balance-exercise-identity-coverage.ts` (expanded alias map)
- `components/programs/ProgramCoachIntelligenceHub.tsx` (improved UI copy)
- `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` (this update)

**Constraints Preserved:**
- canApplyStructuralMutation remains false
- No structural workout mutation
- Completed sessions protected
- Program Cards unchanged
- Live Workout unchanged
- Method Planner unchanged

**Next Phase:** 
- If current-program full science coverage complete: MASTER-8B.7.2.1 (target resolution)
- If more exercises still need science entries: Continue with batched expansion

---

### MASTER-8B.8 — Live Workout Runtime Adaptation Bridge

**Status:** NOT STARTED

**Purpose:** Ensure Start Workout consumes the mutated future-session truth exactly.

**Constraint:** Live workout must not boot stale pre-mutation data.

---

### MASTER-8C.3 — Method Contract Slot Frequency Inventory

**Status:** COMPLETE

**Purpose:** Build typed inventory of method families with slot frequency semantics.

**What This Step Delivered:**
- Created `lib/program/method-structure-contract.ts` with canonical method families
- Defined slot frequency semantics for each method category
- Established row-level vs grouped-structural method classification

---

### MASTER-8C.4 — Method Planner Foundation Repair

**Status:** COMPLETE

**Purpose:** Repair Method Planner foundation for frequency-aware planning.

---

### MASTER-8C.5 — Generator Restart DB Consumption Gate

**Status:** COMPLETE

**Purpose:** Ensure generator properly consumes exercise knowledge base.

---

### MASTER-8C.6 — Parity Gate

**Status:** COMPLETE

**Purpose:** Verify parity between generator output and runtime consumption.

---

### MASTER-8C.7 — Method Contract Slot Frequency Inventory

**Status:** COMPLETE

**Purpose:** Establish method contract inventory with slot frequency semantics.

---

### MASTER-8C.8 — Slot Eligibility Frequency Preview

**Status:** COMPLETE

**Purpose:** Build slot eligibility and frequency preview system.

---

### MASTER-8C.9 — Frequency Slot Placement Preview

**Status:** COMPLETE

**Purpose:** Create frequency slot placement preview for method targeting.

---

### MASTER-8C.10 — Controlled Frequency Placement Confirmation

**Status:** COMPLETE

**Purpose:** Build controlled frequency placement confirmation flow.

---

### MASTER-8C.10.1 — Method Collision and Placement Ranking Repair

**Status:** COMPLETE

**Purpose:** Repair method collision detection and placement ranking logic.

---

### MASTER-8C.10.2 — Method Capacity Slot Ledger Repair

**Status:** COMPLETE

**Purpose:** Repair method capacity slot ledger accuracy.

---

### MASTER-8C.10.3 — Method Ledger Semantics Repair

**Status:** COMPLETE

**Purpose:** Fix false row-method ownership detection in method slot occupancy ledger.

**What This Step Delivered:**
- Created strict row-level method ownership predicate
- Only `methodOverrideApplied`, supported `setExecutionMethod`, or `methodOverrideMethodKey` count as row ownership
- Generic `trainingMethod`, `methodFamily`, `appliedMethod` no longer falsely occupy rows
- Added invalid overlap detection for row-method inside grouped structure

---

### MASTER-8C.10.4 — Eligibility Scorer Must Consume Authoritative Ledger

**Status:** COMPLETE

**Purpose:** Make eligibility scoring consume the authoritative method slot occupancy ledger.

**What This Step Delivered:**
- Created `deriveRowLevelSlotsFromLedger()` for ledger-based row-level targeting
- Created `deriveCircuitSlotsFromLedger()` for ledger-based circuit targeting
- Replaced stale local ownership helpers with ledger-based scoring
- Day 1 circuit rows no longer falsely targeted by row-level methods

---

### MASTER-8C.10.5 — Repair Ledger Ownership Classification

**Status:** COMPLETE

**Purpose:** Separate grouped structure ownership from row-level method ownership.

**What This Step Delivered:**
- Added method family classification constants (GROUPED_STRUCTURE_METHOD_FAMILIES, ROW_LEVEL_METHOD_FAMILIES)
- Added status filtering (OCCUPYING_METHOD_STATUSES: applied, already_applied)
- Only circuit/superset/density_block with applied status populate grouped ownership
- Row-level methods (top_set, drop_set, rest_pause, cluster, backoff_sets) populate separate row ownership
- Blocked/not_needed/no_safe_target/error methodStructures no longer occupy slots
- Fixed false "20 in grouped structures" overblocking

---

### MASTER-8C.11 — Controlled Multi-Placement Audit / Revert Parity / Live Workout Render Verification

**Status:** COMPLETE

**Purpose:** Verification gate for end-to-end method placement corridor.

**Verification Results:**
- Multi-apply no stacking: PASS
- Capacity count reduction: PASS
- Program Day render: PASS
- Refresh persistence/honesty: PASS
- Reset/revert parity: PASS
- Live workout render: PASS
- Unsupported methods still blocked: PASS

**Files Changed:** None - verification passed without requiring code changes.

**TypeScript/Build:** PASS

---

### MASTER-8C.11.1 — Checklist Source-of-Truth Reconciliation + Next-Step Lock Gate

**Status:** COMPLETE

**Purpose:** Reconcile official checklist with actual completed MASTER-8C sequence.

**What This Step Delivered:**
- Updated OFFICIAL_CHECKLIST_MAY_14_2026.md with complete MASTER-8C.3 through MASTER-8C.11 sequence
- Added Current Active Position section
- Added Protected Method Planner State documentation
- Added Currently Blocked Methods with honest reasons
- Identified next implementation candidate: Superset Structural Override Apply Readiness

---

### MASTER-8C.12 — Method Planner Persistence Repair + Selective Removal + Superset Readiness

**Status:** PARTIAL COMPLETE (8C.12A + 8C.12B + 8C.12D complete, 8C.12C deferred)

**Purpose:** Fix row-level frequency placement persistence bug, add selective removal, prepare Superset infrastructure.

**Subtasks Completed:**
- **8C.12A — Persistence Repair:** COMPLETE
  - Root cause: frequency placement used state-only callback instead of `saveAdaptiveProgram`
  - Fix: Added `onApplyFrequencyPlacement` callback that saves through canonical persistence path
  - Applied methods now survive page refresh
  
- **8C.12B — Selective Removal:** COMPLETE
  - Added `extractAppliedMethodPlacements` and `removeSelectedMethodPlacements` helpers
  - Added `SelectiveMethodRemovalSection` UI component
  - Users can now remove specific applied methods without reset-all
  
- **8C.12D — Density/AMRAP Doctrine:** COMPLETE
  - Documented that Density Block should not require pre-existing timed window
  - Documented AMRAP may need its own method family with subtypes
  - Documented future work required for timed/sequence runtime

**Subtask Deferred:**
- **8C.12C — Superset Structural Apply:** DEFERRED
  - Needs grouped method writer infrastructure
  - Needs superset candidate scoring logic
  - Needs safe pairing validation
  - Should be its own dedicated step

**Files Changed:**
- `app/(app)/program/page.tsx` — added frequency apply and selective removal callbacks
- `components/programs/AdaptiveProgramDisplay.tsx` — wired new callbacks
- `components/programs/ProgramCoachIntelligenceHub.tsx` — added SelectiveMethodRemovalSection, wired callbacks
- `lib/program/method-frequency-placement-apply-contract.ts` — added selective removal helpers

**Report:** See `docs/MASTER_8C_12_METHOD_PLANNER_PERSISTENCE_SELECTIVE_REMOVAL_SUPERSET_READINESS_REPORT.md`

---

### MASTER-8C.12.1 — Method Planner UX Unification

**Status:** COMPLETE

**Purpose:** Unify Method Planner UX — move frequency controls into method detail, demote standalone frequency section, make selective removal visible, improve target ranking, fix blocked method messaging.

**Subtasks Completed:**
- **8C.12.1A — Method-Detail Frequency Controls:** COMPLETE
  - Added `MethodDetailFrequencyControls` component inside method detail view
  - Row-level methods show frequency chips and preview targets
  - Structural methods show appropriate "Structural Apply" messaging
  
- **8C.12.1B — Demote Standalone Frequency Section:** COMPLETE
  - `SlotEligibilityFrequencyPreviewSection` now accepts `isDiagnosticMode` prop
  - Collapsed by default, labeled "Advanced Placement Diagnostics"
  - Method list is now the primary user workflow
  
- **8C.12.1C — Visible Selective Removal UI:** COMPLETE
  - Added `ManageAppliedAdditionsSection` component
  - Checkboxes for each user-applied placement
  - Select all, remove selected with confirmation
  
- **8C.12.1D — Target Ranking Improvement:** COMPLETE
  - Score-based ranking prefers sessions with lower method load
  - Spreads placements across week instead of earliest-day-first
  - "whyChosen" now includes "Lower method load" reasoning
  
- **8C.12.1E — Fix Blocked Method Messaging:** COMPLETE
  - Circuit: "uses structural Method Planner apply flow"
  - Superset: "needs structural pair writer before frequency placement"
  - Density Block: "needs timed/sequence runtime, logging, and save/reload support"

**Files Changed:**
- `components/programs/ProgramCoachIntelligenceHub.tsx`
- `lib/program/method-frequency-slot-placement-preview.ts`
- `lib/program/method-slot-eligibility-frequency-planner.ts`

**Report:** See `docs/MASTER_8C_12_1_METHOD_PLANNER_UX_UNIFICATION_REPORT.md`

---

### MASTER-8C.13 — Superset Structural Override Apply Implementation (NEXT CANDIDATE)

**Status:** NOT STARTED

**Purpose:** Enable requested override apply for Supersets through real grouped structural writer.

**Prerequisites:**
- MASTER-8C.12A persistence verified
- MASTER-8C.12B selective removal verified
- Native superset structural materialization exists
- Grouped live workout runtime already supports supersets

**Blockers to Address:**
- Define superset candidate scoring logic (compatible exercise pairs)
- Define safe pairing validation rules
- Enable structural writer that matches native materialization shape
- Extend selective removal for grouped structures
- Verify Program Day cards and live workout consume the grouped truth

---

### MASTER-8D — Full Runtime Parity + Final UI Cleanup

**Status:** NOT STARTED

**Purpose:** Final polish after logic and truth corridors are stable.

---

## True-Source Branch Inventory

| Branch | Current Owner File(s) | Current Status | Future Role | Mutation Authority | UI Surfaces | Risk If Ignored | Safe Insertion Point |
|--------|----------------------|----------------|-------------|-------------------|-------------|-----------------|---------------------|
| **Skill Map / Selected Skill Representation** | `ProgramCoachIntelligenceHub.tsx`, skill helpers | Active/Partial | Skill exposure truth and selected-skill coverage | No direct mutation | Skill Map tile/sheet, program cards | Selected skills disappear or are under-expressed | After MASTER-8B.1 |
| **Method Decisions** | `per-day-method-summary.ts`, `WeeklyMethodDecisionAccordion` | Active | Explain AI-selected methods | No direct mutation | Method Decisions tile/sheet | Method explanation diverges from real methods | After MASTER-8B.1 |
| **Method Planner** | `ProgramCoachIntelligenceHub.tsx`, `requested-method-override-planner.ts`, `method-override-artifacts.ts` | **Active, recently repaired (PROTECTED)** | User-requested method additions/overrides | Only through existing apply/revert/reset writer | Method Planner tile/sheet | Counts drift or applied/native/preview rows disagree | After MASTER-8B.1 registry and MASTER-8B.5 integration |
| **Adaptive Foundation** | `adaptive-foundation-model.ts`, `ProgramCoachIntelligenceHub.tsx` | Active read-only | Athlete model, evidence state, constraints, safeguards | None yet | Adaptive Foundation tile/sheet | Looks intelligent but does not drive future changes | After MASTER-8B.1 |
| **Calibration** | `CalibrationCheckpointCard.tsx`, calibration helpers | Active/Partial depending on evidence | Baseline and performance calibration | No direct mutation until generator/writer consumes it | Calibration tile/sheet | Baseline claims not used | After MASTER-8B.1 |
| **Coach Recs** | `EvidenceCoachRecommendationCard.tsx`, recommendation helpers | Partial/empty if no evidence | Actionable advice and next-step coaching | No direct mutation | Coach Recs tile/sheet | Dead tile or cosmetic recommendations | After MASTER-8B.1 and MASTER-8B.4 |
| **Plan Logic** | `ProgramTruthSummary.tsx`, `program-display-contract.ts` | Active/Partial | Construction rationale and proof | No direct mutation | Plan Logic tile/sheet | Explanations mask weak programming | After MASTER-8B.1 |
| **Recovery / Readiness** | Workout feedback/readiness helpers, `active-week-mutation-service.ts` | Partial | Guide future-session adjustments | Future writer only | Adaptive Foundation, program cards, live workout | Recovery data displayed but not used | After MASTER-8B.3 |
| **Prehab / Rehab / Tendon / Joint Safeguards** | `adaptive-foundation-model.ts`, constraint/safeguard helpers | Read-only active | Adjust exercise choice, warm-ups, cooldowns, intensity | Future writer only | Adaptive Foundation, workout cards, live runtime eventually | Safeguards are decorative | After MASTER-8B.3 |
| **Program Balance / Skill Distribution** | **Currently missing as formal source** | Missing/Needed | Detect planche under-expression, pull dominance, push/pull imbalance, weighted anchor absence, repetition | Future writer only | Adaptive Foundation, Plan Logic, Program Cards | The app creates boring or imbalanced programs | MASTER-8B.3 creates this |
| **Exercise / Skill Knowledge Base** | Doctrine DB foundation exists but not generator-wired | Foundation exists, not fully consumed | Science-guided programming decisions | Indirect through generator/writer | Explanations, knowledge bubbles, plan logic | Generic cheap decisions | After MASTER-8B.2 and MASTER-8C |
| **Evidence / Workout History / RPE / Bands / Discomfort** | `workout-log-service.ts`, feedback loop helpers | Partial | Drive adaptation confidence and future changes | Future writer only | Adaptive Foundation, Coach Recs, Program Cards, Live Workout | Logged data does not change anything | After MASTER-8B.1 |
| **Program Cards** | `AdaptiveProgramDisplay.tsx`, `AdaptiveSessionCard.tsx` | Active | Final visible proof of adapted sessions | None; display consumer only | Program page session cards | Backend changes not visible | After MASTER-8B.7 |
| **Live Workout Runtime** | Live workout components/pages | **Active, protected** | Consume adapted session truth | None; runtime consumer unless same-day adjustment later | Start Workout / live workout | Program page says changed, live workout boots old session | After MASTER-8B.8 |
| **Saved Program Persistence** | Program page/save/load helpers | Active, fragile if shape changes | Preserve source truth and mutated future sessions | Future writer must update safely | Reloaded Program page | Fresh truth lost after reload | After MASTER-8B.6 |

---

## Current Coach Intelligence Hub Tile Status

| Tile | Status | Source | Notes |
|------|--------|--------|-------|
| **Skill Map** | Active | Program skill representation | Shows selected skills and expression |
| **Method Decisions** | Active | `per-day-method-summary.ts` | AI-selected method explanations |
| **Method Planner** | **Active (PROTECTED)** | `requested-method-override-planner.ts`, artifact truth | Green Applied 6 behavior is working and frozen |
| **Adaptive Foundation** | Active (read-only) | `adaptive-foundation-model.ts` | Evidence sources, safeguards, guarded preview |
| **Calibration** | Partial | `CalibrationCheckpointCard.tsx` | Active when evidence exists |
| **Coach Recs** | Partial/Empty | `EvidenceCoachRecommendationCard.tsx` | Empty when no evidence |
| **Plan Logic** | Active/Partial | `ProgramTruthSummary.tsx` | Construction rationale |

---

## Current Active-Week Mutation Classification

**File:** `lib/active-week-mutation-service.ts`

**Current Status:** Primitive/frequency-level, NOT the final deep adaptation writer.

**What It Does:**
- `evaluateActiveWeekMutation()` exists
- `consumePendingScheduleNotice()` exists
- Connected from `AdaptiveProgramDisplay.tsx`

**What It Does NOT Do:**
- Does not rebalance exercises
- Does not adjust warm-ups or cooldowns
- Does not modify weighted strength anchors
- Does not redistribute planche exposure
- Does not correct push/pull imbalance
- Does not adapt tissue stress at the session level

**Classification:** This is a placeholder service, not a production-grade adaptation writer. The final adaptation writer will be created in MASTER-8B.6.

---

## Method Planner Protected Behavior (As of May 14, 2026)

**Current Visible State:**
- Coach Intelligence tile: Method Planner shows green `Applied 6`
- Method Planner sheet proof line: `Planner truth: 6 saved · 0 preview · 1 not applied`
- Applied rows (6):
  - Circuits
  - Density Blocks
  - Drop Sets
  - Endurance/Conditioning
  - Rest-Pause
  - Top Set + Backoff
- Native/Original row: Supersets
- Caution/Not-applied row: Cluster Sets

**Protection Rule:** This behavior must not be broken unless a later step (MASTER-8B.5 or later) proves a safe insertion point for new foundation sources.

---

## Verification After Deploy

**Route:** `/program`

**Expected PASS:**
- Program page loads without error
- Coach Intelligence hub appears
- Method Planner tile shows `Applied 6` green
- Opening Method Planner shows 6 saved method additions + 1 not-applied
- Adaptive Foundation opens and shows evidence sources, safeguards, guarded preview
- Start Workout button works
- No visible runtime behavior changes

**Expected FAIL:**
- Method Planner count changes
- Adaptive Foundation content disappears
- Coach Intelligence tile layout breaks
- Start Workout breaks
- Program page fails to load
- Any runtime mutation occurs that was not present before this step

---

## Appendix: File Reference

### Primary Documentation Files
- `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` (this file)
- `docs/PROGRAM_INTELLIGENCE_QUALITY_CHECKLIST.md` (historical context)
- `docs/MASTER_8B_0_TRUE_SOURCE_ROADMAP_INVENTORY_REPORT.md` (step report)

### Key Source Files (Read-Only Audit)
- `components/programs/ProgramCoachIntelligenceHub.tsx` — Coach Intelligence hub tiles and sheets
- `lib/program/adaptive-foundation-model.ts` — Typed read-only Adaptive Foundation model
- `lib/program/requested-method-override-planner.ts` — Method Planner logic
- `lib/program/method-override-artifacts.ts` — Artifact collection
- `lib/active-week-mutation-service.ts` — Primitive mutation service (placeholder)
- `components/programs/AdaptiveProgramDisplay.tsx` — Program display and mutation hooks
- `lib/adaptive-program-builder.ts` — Program generation
- `lib/program/per-day-method-summary.ts` — Method decision summaries
- `lib/program/program-display-contract.ts` — Display contracts
