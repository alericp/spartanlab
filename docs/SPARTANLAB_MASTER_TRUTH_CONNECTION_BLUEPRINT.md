# SpartanLab Master Truth-Connection Blueprint

**Status owner:** `lib/program/master-truth-connection-blueprint.ts` (typed,
pure, JSON-safe).
**Visible owner:** `components/programs/MaterializationStatusLine.tsx` (one
compact line, hidden when fully locked).
**Versioning:** `phase-4r-master-truth-connection-blueprint-v1`.

This file is the durable end-to-end checklist for moving SpartanLab from
"doctrine is mostly visible" to "doctrine is decisive, preserved, and parity-
locked across program display and live workout." It is not a roadmap. It is
not a marketing doc. It is the source of truth for "what is connected and what
is not." Future prompts walk this checklist in order. Side bugs may be
addressed without erasing the blueprint.

Status markers used throughout:

- `COMPLETE` — function exists, is imported, is called in the runtime path,
  output is preserved, and the final consumer reads it.
- `PARTIAL` — code exists but at least one of {imported, called, preserved,
  consumed} is unproven.
- `NOT_STARTED` — file/function does not exist.
- `BLOCKED` — depends on an earlier phase or external decision.
- `DO_NOT_REDO` — structurally complete enough; rebuilding will regress.

---

## Phase A — Doctrine Inventory Lock — `DO_NOT_REDO`

**Purpose:** every doctrine batch the runtime should see is registered,
reachable, and structurally usable.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| A1 | All source batches exported from authoritative index | `DO_NOT_REDO` | `lib/doctrine/source-batches/index.ts` |
| A2 | No batch file exists but is unreachable | `DO_NOT_REDO` | covered by A1 export check |
| A3 | Each piece has a structured purpose/category | `DO_NOT_REDO` | `lib/doctrine/method-profile-registry.ts`, batch-10 |
| A4 | Each piece is consumable by runtime logic, not display text | `DO_NOT_REDO` | runtime contract |
| A5 | Doctrine foundation is structurally complete | `DO_NOT_REDO` | — |

**Why DO_NOT_REDO:** doctrine batches are written, registered, and structured
for runtime consumption. Adding more doctrine is a content task, not a
connection task. The connection issues are downstream.

---

## Phase B — Doctrine Runtime Consumption Lock — `DO_NOT_REDO`

**Purpose:** doctrine can be queried at runtime and returned as usable decision
data, not as label strings.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| B1 | Doctrine query service reads source batches | `DO_NOT_REDO` | `lib/doctrine-query-service.ts` |
| B2 | Runtime contract returns structured decision objects | `DO_NOT_REDO` | `lib/doctrine-runtime-contract.ts` |
| B3 | Runtime failures do not silently fall back to generic output | `DO_NOT_REDO` | `lib/doctrine-runtime-readiness.ts` |
| B4 | Doctrine runtime is used during generation | `DO_NOT_REDO` | `lib/server/authoritative-program-generation.ts` |
| B5 | Doctrine is not just creating proof/audit labels | `DO_NOT_REDO` | row-level mutator + structural corridor |

**Why DO_NOT_REDO:** doctrine flows through `authoritative-program-generation`
into the row-level mutator and structural corridor. Failure modes are surfaced
honestly instead of swallowed.

---

## Phase C — Training Truth Bundle Lock — `DO_NOT_REDO`

**Purpose:** every onboarding/profile/settings input that should influence
generation actually feeds the builder.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| C1 | Canonical profile truth exists | `DO_NOT_REDO` | `getCanonicalProfile` in `lib/canonical-profile-service.ts` |
| C2 | Programming truth bundle exists | `DO_NOT_REDO` | `composeCanonicalPlannerInput` |
| C3 | Builder/generator consumes the bundle | `DO_NOT_REDO` | adaptive builder + authoritative generation |
| C4 | Older default/fallback inputs do not override | `DO_NOT_REDO` | `auditCanonicalPrecedence`, `detectSplitBrain` |
| C5 | All selected skills can influence design | `DO_NOT_REDO` | weekly representation policies |

**Why DO_NOT_REDO:** profile precedence is enforced. No further work needed
unless audit logs show drift.

---

## Phase D — Method Decision / Weekly Budget Lock — `COMPLETE`

**Purpose:** doctrine decides which method families are even eligible for the
program-week and per-session.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| D1 | Training intent vector exists | `COMPLETE` | `lib/program/training-intent-vector.ts` |
| D2 | Weekly method budget exists | `COMPLETE` | `lib/program/weekly-method-budget-plan.ts` |
| D3 | Method decision engine consumes doctrine + user truth | `COMPLETE` | `lib/program/method-decision-engine.ts` |
| D4 | Method decisions are attached to program/session truth | `COMPLETE` | `program.weeklyMethodBudgetPlan`, `session.methodDecision` |
| D5 | Blocked method statuses are classified, not generic | `COMPLETE` | `lib/program/doctrine-block-resolution-contract.ts` |

---

## Phase E — Actual Program Mutation Lock — `PARTIAL`

**Purpose:** doctrine changes the actual program (grouped sessions, row
methods, eventually dosage), not just labels.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| E1 | Structural methods create real grouped sessions where safe | `COMPLETE` | `lib/program/structural-method-materialization-corridor.ts` |
| E2 | Row-level methods mutate real exercise rows where safe | `COMPLETE` | `lib/program/row-level-method-prescription-mutator.ts` + `doctrine-application-corridor.ts` |
| E3 | Method decisions can affect exercise selection/order/grouping | `PARTIAL` | grouping covered; selection deferred |
| E4 | Method decisions can affect session composition | `PARTIAL` | structural corridor handles superset/circuit/density; max one new structural group per session |
| E5 | No-change cases are legitimate and explained | `COMPLETE` | `session.doctrineParticipation` |
| E6 | Doctrine is not only producing chips/banners | `COMPLETE` | row methods + grouped blocks visible |

**Remaining work:** E3 selection-pass and numeric dosage mutation move to
Phase I (Phase 4S in the original sequence).

---

## Phase F — Canonical Program Object Lock — `COMPLETE`

**Purpose:** declare one final canonical program/session object and prove it
beats stale, fallback, and projection sources.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| F1 | Authoritative program object identified | `COMPLETE` | output of `runAuthoritativeProgramGeneration` |
| F2 | Authoritative session object identified | `COMPLETE` | `program.sessions[]` |
| F3 | Save/load/normalize preserves all method/doctrine fields | `COMPLETE` | live workout normalizer fixed in 4Q (`lib/workout/load-authoritative-session.ts`). **Phase 4V**: `hasCanonicalProgramTruth` pure guard added (`lib/program/program-display-contract.ts`); `normalizeProgramForDisplay` re-attaches `methodStructures` + `doctrineBlockResolution` by name after `preserveSessionGroupedContract` (`lib/program-state.ts`); every load logs canonical-truth source/normalized verdicts. **Phase 4W**: `detectCanonicalProgramTruthDowngrade` reports granular per-signal loss (methodStructures / doctrineBlockResolution / methodMaterializationSummary / doctrineBlockResolutionRollup / per-session coverage); `assertCanonicalProgramTruthPreserved` throws `PHASE_4W_CANONICAL_TRUTH_DOWNGRADE` in dev / test / `SPARTANLAB_STRICT_CANONICAL_TRUTH=true`, structured `console.error` in production — silent downgrades can no longer ship. |
| F4 | Fresh successful generation beats stale stored truth | `COMPLETE` | `evaluateUnifiedProgramStaleness` runs at page boot + post-build; **Phase 4W** strict-mode throw catches partial canonical downgrades during normalize. **Phase 4X**: new module-level pure helper `decideCanonicalProgramWinner` in `app/(app)/program/page.tsx` is the single winner rule for boot/visibility/focus/storage/periodic. Reasons in priority order: `POST_BUILD_WINNER_LOCK_ACTIVE` → `NO_CURRENT_PROGRAM` → `CANDIDATE_INVALID_OR_MISSING` → `BLOCK_STORAGE_CANONICAL_DOWNGRADE` → `CURRENT_NEWER_PROTECTED` → `CANDIDATE_CANONICAL_UPGRADE` → `CANDIDATE_CANONICAL_NEWER` → `CANDIDATE_NEWER_LEGACY_OK` → `CANDIDATE_ID_DIFFERS_NOT_NEWER` → `SESSION_COUNT_ONLY_NOT_AUTHORITY` → `NO_MATERIAL_DIFFERENCE`. Existing Phase 17J/17K reconciliation effect was upgraded (not duplicated) to consult `hasCanonicalProgramTruth` + the helper before any `setProgram`; storage handler narrowed to the three keys `saveAdaptiveProgram` actually touches; mount-effect safe + malformed branches wrapped with the same helper so a stale boot load cannot overwrite a fresher in-memory program. Authoritative post-build lock unchanged on all four success paths and remains the first hard-block. Single authoritative log: `[phase4x-canonical-reconciliation-winner]`. |
| F5 | Fallback objects cannot override healthy canonical truth | `COMPLETE` | `createGuaranteedFallback` gated upstream. **Phase 4W**: `AuthoritativeProgramSourceMap` exposes `canonicalControlsDisplay` / `canonicalDisplayReason` and `fallbackControlsDisplay` / `fallbackDisplayReason` with stable codes (`CANONICAL_METHOD_STRUCTURES_DRIVE_DISPLAY` / `STYLED_GROUPS_AGREE_WITH_CANONICAL_CORRIDOR` / `ROW_LEVEL_METHODS_DRIVE_DISPLAY` / `LEGACY_PROGRAM_NO_CANONICAL_TRUTH` / `CANONICAL_TRUTH_PRESENT_BUT_FALLBACK_DISPLAY_CONTROLS` / `STYLED_GROUPS_USED_WITHOUT_METHOD_STRUCTURES` / `DOCTRINE_CAUSAL_DISPLAY_USED_WITHOUT_DOCTRINE_BLOCK_RESOLUTION`). Computed from the same per-field inspections as `sourceVerdict`, so the two cannot drift. Combined with the 4W normalize-time throw, fallback can no longer masquerade as canonical truth. |

> **Later engine-quality audit (deferred until Phase H/I locks):** verify
> recovery / intensity / adaptiveness doctrine materially influences weekly
> stress distribution, high / moderate / low day structure,
> progression / load / volume / density variation, and sustainable
> six-session scheduling across Full / 45 / 30 variants. Tracking note only —
> not in scope for Phase F.

> **Next chronological step:** Phase H — live workout parity lock. Verify
> Start Workout consumes the same selected canonical session /
> `methodStructures` / `doctrineBlockResolution` as Program display, without
> flattening grouped method execution.

---

## Phase G — Program Display Source Lock — `ACTIVE` / `PARTIAL`

**Purpose:** the Program page reads canonical session truth and nothing else
controls visible cards.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| G1 | Final activeProgram source identified | `COMPLETE` | `app/(app)/program/page.tsx` `authoritativeActiveProgram` memo |
| G2 | Display projection is pure formatting, not rebuilding | `COMPLETE` | `buildProgramDisplayProjection` does not pick exercises/methods |
| G3 | Old fallback/baby sources demoted | `PARTIAL` | older `doctrineCausalChallenge` proof remains compatibility-only — verified by `authoritative-program-source-map.ts`. Phase 4T: legacy `doctrineCausalDisplay` "Doctrine not applied / evaluated / changed" amber/zinc banner is demoted behind canonical `doctrineBlockResolution` (`hasClassifiedDoctrineResolution` guard in `AdaptiveSessionCard`); only the emerald `materialChanged` summary survives because it carries unique top-pick causal evidence. **Phase 4U: program-level legacy `DoctrineCausalLine` upstream-failure banners ("Doctrine did not reach generation" / "No doctrine rules matched") suppressed when canonical `program.doctrineBlockResolutionRollup` proves doctrine actually applied (`totalApplied + totalAlreadyApplied > 0`).** Remaining: stale-source runtime guard rejecting display projections with exercise selections older than canonical session truth. |
| G4 | Day cards receive canonical sessions | `COMPLETE` | `<AdaptiveProgramDisplay sessionCardSurfaces=...>` from `buildCanonicalProgramDisplayTruth` |
| G5 | Visible method blocks match canonical methodStructures/styledGroups | `COMPLETE` | Phase 4S: `SessionCardSurface.methodStructures` field added; `AdaptiveSessionCard` renders canonical delivery line. Phase 4T: canonical `methodStructures` is the *dominant* chip-row source via `deriveCanonicalMethodTallyFromSurface` / `dominantMethodTally`. **Phase 4U: pure `resolveCanonicalMethodBodyRender` binds canonical `methodStructures.exerciseIds[]` / `exerciseNames[]` to real session rows by id then normalized-name fallback, and cross-checks the body's actual rendered block list (member ids extracted from `finalVisibleBodyModel.renderBlocks` for `rich_grouped` or `rawFallbackBlocks` for `raw_grouped_fallback`).** On healthy Phase 4P generations the resolver returns `source='canonical_method_structures'` / `status='complete'` / `bodyBlocksMatchCanonical=true` — proving the visible grouped blocks are backed by canonical truth even when the rich path mechanically reads `styledGroups` (a sibling Phase 4P corridor output with identical exercise IDs). When the resolver disagrees, `fallbackReason` carries an exact attribution code (`NO_CANONICAL_METHOD_STRUCTURES` / `NO_GROUPED_FAMILY_APPLIED` / `ALL_CANONICAL_GROUPS_FAILED_TO_BIND`) and per-structure `unmatchedStructures[].reason` codes (`NO_EXERCISE_REFS_ON_METHOD_STRUCTURE` / `EXERCISE_REF_NOT_FOUND_IN_SESSION_ROWS` / `METHOD_STRUCTURE_NOT_BODY_RENDERABLE` / `BLOCKED_OR_NOT_APPLIED` / `LEGACY_STRUCTURE_WITHOUT_MEMBERS`) instead of a silent fallback. The dev probe surfaces `canon=<source>/<status>:<bodyMatch>` so the per-card verdict is observable. |
| G6 | Yellow blocked labels map to true block classifications | `PARTIAL` | Phase 4S: `SessionCardSurface.doctrineBlockResolution` field added; `AdaptiveSessionCard` renders classified statuses (Applied / Already reflected / Blocked for safety / No matching target / Not for this day / Needs audit) plus a red diagnostic line for `BUG_*` classifications via `normalizeDoctrineBlockStatus`. Phase 4T: legacy `doctrineCausalDisplay` "Doctrine not applied to this session" / "Doctrine evaluated this session" generic banners suppressed when classified `doctrineBlockResolution` exists. **Phase 4U: program-level legacy `DoctrineCausalLine` upstream-failure banners (`doctrine_did_not_run` / `doctrine_cache_empty` / `doctrine_domain_gap`) suppressed when canonical rollup says doctrine actually applied — the Phase 4Q `Phase4QDoctrineBlockResolutionLine` owns the program-level narrative when present.** Remaining: program-level `doctrineBlockResolutionRollup` may still report residual `BUG_*` entries — `COMPLETE` only when that count is `0`. |

**Remaining work:** Phase 4U closed G.G5 by adding the pure
`resolveCanonicalMethodBodyRender` resolver that binds canonical
`methodStructures` to real exercise rows and cross-checks the body's actual
rendered block list, proving the visible grouped blocks ARE canonical truth
on healthy generations and producing exact attribution codes when they
diverge. Phase 4U also added the program-level legacy-banner demotion so the
upstream "Doctrine did not reach generation" amber pill cannot contradict
canonical applied counts. The remaining Phase G work is the **G.G3 stale-source
runtime guard** that rejects display projections carrying exercise selections
older than canonical session truth, and driving the program-level
`doctrineBlockResolutionRollup` `BUG_*` counts to zero so G.G6 can flip to
`COMPLETE`.

---

## Phase H — Live Workout Parity Lock — `COMPLETE`

**Purpose:** Start Workout launches the same truth Program page shows.

| ID | Subtask | Status | Evidence |
|----|---------|--------|----------|
| H1 | Selected variant Full/45/30 uses canonical selected session | `COMPLETE` | `lib/workout/selected-variant-session-contract.ts` |
| H2 | Live workout loader preserves methodStructures | `COMPLETE` (4Q) | `lib/workout/load-authoritative-session.ts` (Phase 4Q fix) |
| H3 | Normalizer preserves styledGroups | `COMPLETE` (4Q) | `lib/workout/normalize-workout-session.ts` |
| H4 | Live workout preserves row-level method fields | `COMPLETE` (4Q) | `setExecutionMethod`, `densityPrescription`, `doctrineApplicationDeltas`, `structuralMethodDeltas`, `targetWeightedRPE` |
| H5 | Live workout does not silently flatten grouped methods | `COMPLETE` (4Y) | New pure module `lib/workout/live-grouped-execution-contract.ts` (`evaluateLiveGroupedExecution()` + `buildExecutionBlocksFromMethodStructures()`). `StreamlinedWorkoutSession` executionPlan derivation now has a methodStructures fallback branch between styledGroups and the flat fallback — grouped methods are no longer silently flattened when styledGroups is absent or rejected by the shadow-owner guard. The existing `live-workout-machine` reducer (`COMPLETE_BLOCK_SET` / `ADVANCE_TO_NEXT_BLOCK_MEMBER` / `ADVANCE_TO_NEXT_BLOCK` / `COMPLETE_BLOCK_ROUND` / `COMPLETE_BLOCK_ROUND_REST`) drives the grouped runtime — no second state machine. `consumedExerciseIndexes` tracking + post-group flat-block appending preserves the no-duplicate-members invariant. Honest guidance-only banner with exact reason code (`DENSITY_RUNTIME_NOT_SUPPORTED_YET` / `GROUP_MEMBER_REF_NOT_FOUND` / `UNSUPPORTED_METHOD_TYPE` / `METHOD_STRUCTURE_STATUS_NOT_APPLIED`) renders for `LIVE_GUIDANCE_PRESERVED_ONLY` / `GROUPED_RUNTIME_BLOCKED` / `GROUPED_RUNTIME_PARTIAL`. |
| H6 | Honest partial parity reported when execution is incomplete | `COMPLETE` | `LIVE_GUIDANCE_PRESERVED_ONLY` verdict in source map; Phase 4Y: `liveGroupedRuntimeVerdict` / `liveGroupedRuntimeReasons` / `liveGroupedRuntimeSource` / `liveGroupedRuntimeHasExecutableBlocks` published by `runLiveWorkoutSourceMap` |

> **Density runtime note:** `density_block` method type is intentionally
> `guidanceOnly` with reason `DENSITY_RUNTIME_NOT_SUPPORTED_YET` — that is
> the honest state, not a silent flatten. A safe density timer runtime is a
> future engine-quality task and is not in scope for Phase H.

> **Next chronological step:** Phase I — Numeric Prescription Mutation Lock.
> Define safe mutation bounds for doctrine-driven sets / reps / holds / rest /
> RPE changes in a new `lib/program/numeric-prescription-mutation-contract.ts`.

---

## Phase I — Numeric Prescription Mutation Lock — `NOT_STARTED`

**Purpose:** allow doctrine to safely change dosage (sets/reps/holds/rest/RPE)
once truth, source, and display are locked.

| ID | Subtask | Status |
|----|---------|--------|
| I1 | Define safe mutation bounds | `NOT_STARTED` |
| I2 | Protect skill-priority work from unsafe fatigue methods | `NOT_STARTED` |
| I3 | Mutate only eligible rows | `NOT_STARTED` |
| I4 | Preserve conservative safety gates | `NOT_STARTED` |
| I5 | Surface before/after dosage changes clearly | `NOT_STARTED` |

---

## Phase J — Product Cleanup / Trust Polish — `NOT_STARTED`

**Purpose:** strip debug clutter; the final UI feels like an AI coach, not a
debug report.

| ID | Subtask | Status |
|----|---------|--------|
| J1 | Hide stale/internal audit clutter from normal user view | `NOT_STARTED` |
| J2 | Keep only useful doctrine explanations | `NOT_STARTED` |
| J3 | Preserve compact product-grade UI | `NOT_STARTED` |
| J4 | Keep diagnostics available where needed | `NOT_STARTED` |
| J5 | Final result feels like an AI coach | `NOT_STARTED` |

---

## Active Phase

**Phase G — Program Display Source Lock.** The structural primitive
(`canonicalDisplayTruth.visibleSessionCards`) is in place and proven to read
from `program.sessions`. Phase 4S threaded typed `methodStructures[]` and
`doctrineBlockResolution[]` into `SessionCardSurface`, and
`AdaptiveSessionCard` now renders a classified Phase 4S delivery line. G5/G6
remain `PARTIAL` only because `styledGroups` still drives the in-body grouped
headers and the program-level `doctrineBlockResolutionRollup` may still
report residual `BUG_*` entries. After G is fully `COMPLETE`, the next active
phase is **Phase F.F3** (re-audit `getProgramState` / hydration
preservation), then Phase H.H5 (live grouped runtime), then Phase I.

## How to use this file in a future prompt

1. Read `master-truth-connection-blueprint.ts` to get the current status
   verdict from the live program object.
2. Compare to this markdown to confirm the active phase did not change.
3. Implement only the next subtask. Do not jump phases.
4. Update both this markdown and the helper when a subtask transitions
   `PARTIAL → COMPLETE` or `NOT_STARTED → PARTIAL`.
5. If a side bug is found, fix it without erasing this blueprint. The
   blueprint stays active across side bugs.

## What this blueprint does NOT replace

- It does not replace `lib/program/authoritative-program-source-map.ts` —
  that helper still runs at generation time and at display time to detect
  split sources.
- It does not replace `lib/program/doctrine-block-resolution-contract.ts` —
  that classifier still runs per-session and is still the source of typed
  block verdicts.
- It does not replace `lib/program/session-doctrine-participation-contract.ts`
  — that remains the per-session "did doctrine participate?" answer.
- The blueprint is the table of contents; those three contracts are the
  per-program runtime evidence.
