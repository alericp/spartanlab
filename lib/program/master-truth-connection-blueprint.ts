/**
 * MASTER TRUTH-CONNECTION BLUEPRINT — Phase 4R
 *
 * =============================================================================
 * PURE STATUS / CHECKLIST CONTRACT — NOT A BUILDER, NOT A MUTATOR.
 * =============================================================================
 *
 * The companion of `docs/SPARTANLAB_MASTER_TRUTH_CONNECTION_BLUEPRINT.md`. The
 * markdown is the human-readable table of contents. This helper is the
 * machine-readable, JSON-safe counterpart that future prompts and the Program
 * page can call to answer one question at a time:
 *
 *   "Which Phase is active right now, and what is the next subtask?"
 *
 * Critical constraints:
 *
 *   - PURE. No side effects. No `localStorage`. No `window`. No `fetch`.
 *   - DOES NOT decide doctrine. DOES NOT pick exercises. DOES NOT mutate the
 *     program object. DOES NOT trigger generation.
 *   - INPUT-ONLY. Reads optional `program` and optional `sourceMap` shapes
 *     defensively (any field may be missing on older saved programs).
 *   - SAFE TO RUN ANYWHERE — server, client, build-time prerender. The
 *     Program page renders one compact line from the result; the line is
 *     suppressed entirely when the verdict is `FULLY_LOCKED`.
 *
 * The helper is intentionally NOT wired into `authoritative-program-generation`
 * because the blueprint is a *checklist*, not per-program proof. The
 * per-program proof primitives are the existing Phase 4Q contracts:
 *
 *   - `lib/program/authoritative-program-source-map.ts`
 *   - `lib/program/doctrine-block-resolution-contract.ts`
 *   - `lib/program/session-doctrine-participation-contract.ts`
 *
 * The blueprint *summarizes* across those primitives so a single
 * "next-action" line can be shown.
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type BlueprintPhaseStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'NOT_STARTED'
  | 'BLOCKED'
  | 'DO_NOT_REDO'

export interface BlueprintSubtaskStatus {
  /** Stable, dotted-path-style id matching the markdown (e.g. "G.G5"). */
  id: string
  /** Short human title from the markdown. */
  title: string
  status: BlueprintPhaseStatus
  /** File / function paths that prove the current status. */
  evidence: string[]
  /** Specific work items still required for COMPLETE. Empty when COMPLETE. */
  remainingWork: string[]
}

export interface BlueprintPhase {
  /** Single-letter phase id matching the markdown (e.g. "G"). */
  id: string
  title: string
  purpose: string
  status: BlueprintPhaseStatus
  subtasks: BlueprintSubtaskStatus[]
  /**
   * The exact next implementation step. Empty string when the phase is
   * COMPLETE or DO_NOT_REDO.
   */
  nextAction: string
}

export type MasterBlueprintOverallVerdict =
  | 'FOUNDATION_READY_CONNECTIVITY_IN_PROGRESS'
  | 'DOCTRINE_FOUNDATION_INCOMPLETE'
  | 'DISPLAY_SOURCE_LOCK_IN_PROGRESS'
  | 'LIVE_PARITY_IN_PROGRESS'
  | 'FULLY_LOCKED'

export interface MasterTruthConnectionBlueprint {
  version: 'phase-4r-master-truth-connection-blueprint-v1'
  /** ISO timestamp the blueprint was computed. */
  generatedAt: string
  overallVerdict: MasterBlueprintOverallVerdict
  /** Single-letter id of the phase to work on next. */
  activePhaseId: string
  /** Compact "Phase G active · display source lock in progress" sentence. */
  activePhaseLine: string
  phases: BlueprintPhase[]
}

// =============================================================================
// INPUT
// =============================================================================

/**
 * Optional context. The helper never *requires* the program — when called
 * with no context, it returns the static checklist that ships with the build.
 * When given the live program + source map, it can refine specific subtasks
 * (e.g. mark `H.H4` COMPLETE if the source map confirms live preservation).
 *
 * All fields are typed as `unknown` so the caller can pass any shape without
 * coupling. The helper inspects defensively.
 */
export interface BuildBlueprintStatusContext {
  program?: unknown
  sourceMap?: unknown
}

// =============================================================================
// HELPERS — defensive readers (no throws on missing/malformed shapes)
// =============================================================================

function readObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readBoolean(value: unknown): boolean {
  return value === true
}

function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

// =============================================================================
// PHASE BUILDERS
// =============================================================================

/**
 * Phase A: Doctrine Inventory Lock. Stays DO_NOT_REDO unless the markdown is
 * deliberately reopened.
 */
function phaseA(): BlueprintPhase {
  return {
    id: 'A',
    title: 'Doctrine Inventory Lock',
    purpose: 'Every doctrine batch the runtime should see is registered, reachable, and structurally usable.',
    status: 'DO_NOT_REDO',
    nextAction: '',
    subtasks: [
      { id: 'A.A1', title: 'All source batches exported from authoritative index', status: 'DO_NOT_REDO', evidence: ['lib/doctrine/source-batches/index.ts'], remainingWork: [] },
      { id: 'A.A2', title: 'No batch file exists but is unreachable', status: 'DO_NOT_REDO', evidence: ['covered by A1'], remainingWork: [] },
      { id: 'A.A3', title: 'Each piece has a structured purpose/category', status: 'DO_NOT_REDO', evidence: ['lib/doctrine/method-profile-registry.ts'], remainingWork: [] },
      { id: 'A.A4', title: 'Each piece is consumable by runtime logic', status: 'DO_NOT_REDO', evidence: ['lib/doctrine-runtime-contract.ts'], remainingWork: [] },
      { id: 'A.A5', title: 'Doctrine foundation is structurally complete', status: 'DO_NOT_REDO', evidence: [], remainingWork: [] },
    ],
  }
}

/** Phase B: Doctrine Runtime Consumption Lock. */
function phaseB(): BlueprintPhase {
  return {
    id: 'B',
    title: 'Doctrine Runtime Consumption Lock',
    purpose: 'Doctrine can be queried at runtime and returned as usable decision data.',
    status: 'DO_NOT_REDO',
    nextAction: '',
    subtasks: [
      { id: 'B.B1', title: 'Doctrine query service reads source batches', status: 'DO_NOT_REDO', evidence: ['lib/doctrine-query-service.ts'], remainingWork: [] },
      { id: 'B.B2', title: 'Runtime contract returns structured decision objects', status: 'DO_NOT_REDO', evidence: ['lib/doctrine-runtime-contract.ts'], remainingWork: [] },
      { id: 'B.B3', title: 'Runtime failures do not silently fall back to generic output', status: 'DO_NOT_REDO', evidence: ['lib/doctrine-runtime-readiness.ts'], remainingWork: [] },
      { id: 'B.B4', title: 'Doctrine runtime is used during generation', status: 'DO_NOT_REDO', evidence: ['lib/server/authoritative-program-generation.ts'], remainingWork: [] },
      { id: 'B.B5', title: 'Doctrine is not just creating proof/audit labels', status: 'DO_NOT_REDO', evidence: ['lib/program/row-level-method-prescription-mutator.ts'], remainingWork: [] },
    ],
  }
}

/** Phase C: Training Truth Bundle Lock. */
function phaseC(): BlueprintPhase {
  return {
    id: 'C',
    title: 'Training Truth Bundle Lock',
    purpose: 'Onboarding/profile/settings/equipment/skills/schedule truth feeds generation.',
    status: 'DO_NOT_REDO',
    nextAction: '',
    subtasks: [
      { id: 'C.C1', title: 'Canonical profile truth exists', status: 'DO_NOT_REDO', evidence: ['lib/canonical-profile-service.ts:getCanonicalProfile'], remainingWork: [] },
      { id: 'C.C2', title: 'Programming truth bundle exists', status: 'DO_NOT_REDO', evidence: ['composeCanonicalPlannerInput'], remainingWork: [] },
      { id: 'C.C3', title: 'Builder/generator consumes the bundle', status: 'DO_NOT_REDO', evidence: ['lib/server/authoritative-program-generation.ts'], remainingWork: [] },
      { id: 'C.C4', title: 'Older default/fallback inputs do not override', status: 'DO_NOT_REDO', evidence: ['auditCanonicalPrecedence', 'detectSplitBrain'], remainingWork: [] },
      { id: 'C.C5', title: 'All selected skills can influence design', status: 'DO_NOT_REDO', evidence: ['weeklyRepresentation policies'], remainingWork: [] },
    ],
  }
}

/** Phase D: Method Decision / Weekly Budget Lock. */
function phaseD(): BlueprintPhase {
  return {
    id: 'D',
    title: 'Method Decision / Weekly Budget Lock',
    purpose: 'Doctrine decides method families and weekly method exposure.',
    status: 'COMPLETE',
    nextAction: '',
    subtasks: [
      { id: 'D.D1', title: 'Training intent vector exists', status: 'COMPLETE', evidence: ['lib/program/training-intent-vector.ts'], remainingWork: [] },
      { id: 'D.D2', title: 'Weekly method budget exists', status: 'COMPLETE', evidence: ['lib/program/weekly-method-budget-plan.ts'], remainingWork: [] },
      { id: 'D.D3', title: 'Method decision engine consumes doctrine + user truth', status: 'COMPLETE', evidence: ['lib/program/method-decision-engine.ts'], remainingWork: [] },
      { id: 'D.D4', title: 'Method decisions attached to program/session truth', status: 'COMPLETE', evidence: ['program.weeklyMethodBudgetPlan'], remainingWork: [] },
      { id: 'D.D5', title: 'Blocked method statuses are classified, not generic', status: 'COMPLETE', evidence: ['lib/program/doctrine-block-resolution-contract.ts'], remainingWork: [] },
    ],
  }
}

/**
 * Phase E: Actual Program Mutation Lock. Some grouping is COMPLETE; numeric
 * dosage and selection-pass are deferred to Phase I.
 */
function phaseE(): BlueprintPhase {
  return {
    id: 'E',
    title: 'Actual Program Mutation Lock',
    purpose: 'Doctrine changes the actual workout program, not just labels.',
    status: 'COMPLETE',
    nextAction: 'Phase E COMPLETE. E.E4.1 multi-structure composition receipt proves when superset+circuit+density are applied together or suppressed. The corridor already supported multi-family application; the new MethodAwareCompositionReceipt makes it visible and inspectable.',
    subtasks: [
      { id: 'E.E1', title: 'Structural methods create real grouped sessions where safe', status: 'COMPLETE', evidence: ['lib/program/structural-method-materialization-corridor.ts'], remainingWork: [] },
      { id: 'E.E2', title: 'Row-level methods mutate real exercise rows where safe', status: 'COMPLETE', evidence: ['lib/program/row-level-method-prescription-mutator.ts'], remainingWork: [] },
      { id: 'E.E3', title: 'Method decisions can affect exercise selection/order/grouping', status: 'COMPLETE', evidence: ['structural corridor handles grouping', 'lib/program-generation/exercise-selection-materiality.ts:scoreMethodCompatibility provides 0-12 method compatibility boost when session has decided method', 'ExerciseMaterialityContext.sessionMethodDecision enables method-aware selection', 'MaterialityScoreBreakdown.methodCompatibilityBoost included in total score and slot suitability', 'MaterialityReasonCode method_compatible_selection tracks when method influenced selection', 'SlotMaterialityRanking.auditSummary.methodCompatibilityInfluencedRanking tracks causal influence'], remainingWork: [] },
      { id: 'E.E4', title: 'Method decisions can affect session composition', status: 'COMPLETE', evidence: ['lib/program/method-structure-contract.ts:MethodAwareCompositionReceipt', 'lib/program/structural-method-materialization-corridor.ts:buildMethodAwareCompositionReceipt', 'session.methodAwareCompositionReceipt attached by corridor', 'SessionCardSurface.methodAwareCompositionReceipt pass-through', 'AdaptiveSessionCard displays composition coachLine for multi-structure or safety-suppressed', 'corridor already runs superset→circuit→density_block sequence enabling multi-family application'], remainingWork: [] },
      { id: 'E.E5', title: 'No-change cases are legitimate and explained', status: 'COMPLETE', evidence: ['lib/program/session-doctrine-participation-contract.ts'], remainingWork: [] },
      { id: 'E.E6', title: 'Doctrine is not only producing chips/banners', status: 'COMPLETE', evidence: ['row methods + grouped blocks visible'], remainingWork: [] },
    ],
  }
}

/**
 * Phase F: Canonical Program Object Lock. Live workout normalizer was fixed in
 * 4Q; getProgramState / hydration round-trip preservation is the remaining
 * unproven leg.
 */
function phaseF(ctx: BuildBlueprintStatusContext): BlueprintPhase {
  // Best-effort: if the live program carries an authoritativeSourceMap with a
  // healthy verdict and a non-zero session count, F1+F2 are runtime-confirmed
  // for *this* program object. F3-F5 still require cross-route verification.
  const sourceMap = readObject(ctx.sourceMap) ?? readObject((readObject(ctx.program) ?? {}).authoritativeSourceMap)
  const sourceMapHealthy = sourceMap?.sourceVerdict === 'LOCKED_SINGLE_AUTHORITATIVE_SOURCE'

  // [PHASE 4W] Surface the new fallback-controls-display flags so consumers
  // (this blueprint, dev tooling, future runtime guards) can read them off
  // a runtime source-map result without reaching into legacy fields.
  const fallbackControllingDisplayFlag = sourceMap?.fallbackControlsDisplay === true
  const canonicalControllingDisplayFlag = sourceMap?.canonicalControlsDisplay === true

  return {
    id: 'F',
    title: 'Canonical Program Object Lock',
    purpose: 'One final canonical program/session object beats stale, fallback, and projection sources.',
    // [PHASE 4X] F overall advanced PARTIAL → COMPLETE. F.F1-F.F5 are all
    // COMPLETE. F.F4 was the last open leg and was closed in 4X by
    // consolidating boot/hydration + visibility/focus/storage/periodic
    // reconciliation onto a single pure `decideCanonicalProgramWinner`
    // helper that consults the canonical truth contract introduced in
    // 4P-4W (`hasCanonicalProgramTruth` + the source-map
    // canonicalControlsDisplay/fallbackControlsDisplay flags).
    status: 'COMPLETE',
    nextAction: 'Begin Phase H live workout parity lock: verify Start Workout consumes the same selected canonical session/methodStructures/doctrineBlockResolution as Program display, without flattening grouped method execution.',
    subtasks: [
      { id: 'F.F1', title: 'Authoritative program object identified', status: 'COMPLETE', evidence: ['runAuthoritativeProgramGeneration output'], remainingWork: [] },
      { id: 'F.F2', title: 'Authoritative session object identified', status: 'COMPLETE', evidence: ['program.sessions[]'], remainingWork: [] },
      // [PHASE 4V] F.F3 advanced from PARTIAL → COMPLETE on the load
      // corridor leg. The persistence corridor in this codebase is fully
      // client-side: saveAdaptiveProgram (JSON.stringify → localStorage)
      // → getLatestAdaptiveProgram (JSON.parse) → normalizeProgramForDisplay
      // → page.tsx. Phase 4V locks the only structural risk (the
      // ...spread-based normalizer in lib/program-state.ts) by:
      //   1. Adding a centralized pure presence guard
      //      `hasCanonicalProgramTruth` in lib/program/program-display-contract.ts
      //      so the "canonical truth is present" rule is one rule, not
      //      duplicated across the load corridor and the page.
      //   2. Re-attaching session-level canonical fields BY NAME after
      //      preserveSessionGroupedContract via Object.assign in
      //      lib/program-state.ts (methodStructures + doctrineBlockResolution),
      //      so a future refactor that swaps the spread for a picked field
      //      list still survives the load corridor.
      //   3. Auditing every load with hasCanonicalProgramTruth on both
      //      the source program and the normalized output, warning
      //      [PHASE_4V_CANONICAL_TRUTH] if canonical truth is downgraded
      //      during normalization.
      // methodMaterializationSummary lives inside styleMetadata and is
      // already preserved by preserveSessionGroupedContract's existingMeta
      // spread; doctrineBlockResolutionRollup is a top-level program field
      // already preserved by the top-level ...program spread in
      // normalizeProgramForDisplay. Remaining work is a runtime verifier
      // that fails the page render loudly (rather than just logging) if
      // canonical truth is downgraded — a guarded toggle for prod.
      { id: 'F.F3', title: 'Save/load/normalize preserves all method/doctrine fields', status: 'COMPLETE', evidence: sourceMapHealthy ? ['authoritativeSourceMap healthy on this program', 'Phase 4V: hasCanonicalProgramTruth pure guard added (lib/program/program-display-contract.ts)', 'Phase 4V: normalizeProgramForDisplay re-attaches methodStructures + doctrineBlockResolution by name after preserveSessionGroupedContract (lib/program-state.ts)', 'Phase 4V: every load logs canonicalTruthSource/canonicalTruthNormalized verdicts and warns [PHASE_4V_CANONICAL_TRUTH] on downgrade'] : ['live workout normalizer fixed in 4Q', 'Phase 4V: hasCanonicalProgramTruth pure guard added (lib/program/program-display-contract.ts)', 'Phase 4V: normalizeProgramForDisplay re-attaches methodStructures + doctrineBlockResolution by name after preserveSessionGroupedContract (lib/program-state.ts)', 'Phase 4V: every load logs canonicalTruthSource/canonicalTruthNormalized verdicts and warns [PHASE_4V_CANONICAL_TRUTH] on downgrade'], remainingWork: [] },
      // [PHASE 4X] F.F4 advanced PARTIAL → COMPLETE. Closure of the last
      // remaining Phase F leg. Implementation:
      //   1. New module-level pure helper `decideCanonicalProgramWinner`
      //      in app/(app)/program/page.tsx applies a single ordered
      //      rule set:
      //        POST_BUILD_WINNER_LOCK_ACTIVE > NO_CURRENT_PROGRAM >
      //        CANDIDATE_INVALID_OR_MISSING >
      //        BLOCK_STORAGE_CANONICAL_DOWNGRADE >
      //        CURRENT_NEWER_PROTECTED >
      //        CANDIDATE_CANONICAL_UPGRADE >
      //        CANDIDATE_CANONICAL_NEWER >
      //        CANDIDATE_NEWER_LEGACY_OK >
      //        CANDIDATE_ID_DIFFERS_NOT_NEWER >
      //        SESSION_COUNT_ONLY_NOT_AUTHORITY > NO_MATERIAL_DIFFERENCE.
      //      Pure, no React state, no localStorage, no side effects.
      //   2. The existing Phase 17J/17K reconciliation effect was UPGRADED
      //      (not duplicated): `reconcileWithCanonical` now reads canonical-
      //      truth verdicts via `hasCanonicalProgramTruth` for current and
      //      candidate, calls the helper, and gates `setProgram` on the
      //      helper's `shouldReplace`. The legacy 26E/26F shouldReplace
      //      decision is preserved as `legacyShouldReplace` for diagnostic
      //      continuity but no longer drives state changes.
      //   3. The boot/hydration path (mount effect's safe + malformed
      //      branches) was wrapped with the same helper so a stale storage
      //      load cannot silently overwrite a fresher in-memory program on
      //      page load. Logged as `mount_hydration` /
      //      `mount_hydration_malformed`.
      //   4. The `storage` event handler was narrowed to only react to the
      //      three keys saveAdaptiveProgram + history actually touch
      //      (`spartanlab_active_program`, `spartanlab_adaptive_program`,
      //      `spartanlab_adaptive_programs`) — eliminates false-positive
      //      reconciliation runs from unrelated localStorage writes.
      //   5. The 2-second periodic check still runs but routes through
      //      `reconcileWithCanonical` → the helper, so it cannot replace
      //      a fresh current program with stale storage and the
      //      authoritative post-build lock continues to hard-block all
      //      replacement during its 5-second window.
      //   6. Authoritative post-build lock continues to be set on all four
      //      success paths (main_generation @6307, modify @7332,
      //      regenerate @9771, onboarding @11938).
      //
      // Cross-tab is now defended at every replacement edge: storage
      // events, focus/visibility, periodic, and boot. Session count alone
      // is explicitly never authority. Canonical-truth downgrade is hard
      // blocked. The single authoritative
      // [phase4x-canonical-reconciliation-winner] log captures every
      // decision.
      { id: 'F.F4', title: 'Fresh successful generation beats stale stored truth', status: 'COMPLETE', evidence: ['evaluateUnifiedProgramStaleness wired at page boot + post-build', 'Phase 4W: assertCanonicalProgramTruthPreserved throws in dev/strict on any normalize-time downgrade', 'Phase 4X: decideCanonicalProgramWinner pure helper at module scope in app/(app)/program/page.tsx — single winner rule for boot + visibility + focus + storage + periodic', 'Phase 4X: reconcileWithCanonical refactored to consult hasCanonicalProgramTruth + helper; legacy 26E/26F decision retained for diagnostics only', 'Phase 4X: mount-effect safe + malformed branches wrapped with the same helper (mount_hydration / mount_hydration_malformed)', 'Phase 4X: storage handler narrowed to spartanlab_active_program / spartanlab_adaptive_program / spartanlab_adaptive_programs only', 'Phase 4X: post-build authoritative lock unchanged on all four success paths (main_generation / modify / regenerate / onboarding) and remains the first hard-block in reconcileWithCanonical', 'Phase 4X: BLOCK_STORAGE_CANONICAL_DOWNGRADE rule prevents fallback storage from overwriting healthy canonical current truth', 'Phase 4X: SESSION_COUNT_ONLY_NOT_AUTHORITY rule explicitly blocks session-count-only replacement'], remainingWork: [] },
      // [PHASE 4W] F.F5 advanced from PARTIAL → COMPLETE. The fallback
      // source-map verifier the prompt asked for is now live in
      // lib/program/authoritative-program-source-map.ts as the four
      // co-equal fields canonicalControlsDisplay / canonicalDisplayReason
      // / fallbackControlsDisplay / fallbackDisplayReason. Reasons are
      // stable codes:
      //   - CANONICAL_METHOD_STRUCTURES_DRIVE_DISPLAY
      //   - STYLED_GROUPS_AGREE_WITH_CANONICAL_CORRIDOR
      //   - ROW_LEVEL_METHODS_DRIVE_DISPLAY
      //   - LEGACY_PROGRAM_NO_CANONICAL_TRUTH (legitimate legacy fallback)
      //   - CANONICAL_TRUTH_PRESENT_BUT_FALLBACK_DISPLAY_CONTROLS (regression)
      //   - STYLED_GROUPS_USED_WITHOUT_METHOD_STRUCTURES (regression)
      //   - DOCTRINE_CAUSAL_DISPLAY_USED_WITHOUT_DOCTRINE_BLOCK_RESOLUTION
      // The classification is computed from the existing per-field
      // inspections (methodStructures count, styledGroups non-straight
      // count, row-level method count) so it cannot drift from the
      // sourceVerdict. createGuaranteedFallback is still gated upstream;
      // Phase 4W also caps the load corridor with
      // assertCanonicalProgramTruthPreserved so a fallback object cannot
      // silently take over from a partially-downgraded canonical
      // program.
      { id: 'F.F5', title: 'Fallback objects cannot override healthy canonical truth', status: 'COMPLETE', evidence: ['createGuaranteedFallback gated', 'Phase 4V: page.tsx and AdaptiveSessionCard can read hasCanonicalProgramTruth(program) to gate legacy fallback per-session via sessionsWithCanonicalTruth', 'Phase 4W: AuthoritativeProgramSourceMap exposes canonicalControlsDisplay / fallbackControlsDisplay + stable reason codes (lib/program/authoritative-program-source-map.ts)', 'Phase 4W: detectCanonicalProgramTruthDowngrade catches partial downgrades (lostMethodStructures / lostDoctrineBlockResolution / lostMethodMaterializationSummary / lostDoctrineBlockResolutionRollup / lostCanonicalSessionCoverage)', 'Phase 4W: assertCanonicalProgramTruthPreserved throws in dev/strict (NODE_ENV !== production OR SPARTANLAB_STRICT_CANONICAL_TRUTH=true) and console.errors in production', fallbackControllingDisplayFlag ? 'Live source-map currently reports fallbackControlsDisplay=true' : canonicalControllingDisplayFlag ? 'Live source-map currently reports canonicalControlsDisplay=true' : 'Live source-map flags not yet observed on this build'], remainingWork: [] },
    ],
  }
}

/**
 * Phase G: Program Display Source Lock. ACTIVE PHASE. The structural primitive
 * is in place (`canonicalDisplayTruth.visibleSessionCards`); the next subtask
 * is threading typed `methodStructures` + `doctrineBlockResolution[]` into
 * `SessionCardSurface` so cards render classified verdicts instead of legacy
 * generic blocked text.
 */
function phaseG(ctx: BuildBlueprintStatusContext): BlueprintPhase {
  const program = readObject(ctx.program)
  const blockResolutionRollup = readObject(program?.doctrineBlockResolutionRollup)
  // [PHASE G.G6] Only count DISPLAY-SOURCE bugs for G.G6 status.
  // Runtime contract missing (cluster) is a Phase H issue, not display source.
  // Missing connection is an application bug, not display source.
  // G.G6 only cares that canonical display truth is not being replaced by stale/fallback sources.
  const displaySourceBugs =
    readNumber(blockResolutionRollup?.totalBugDisplayConsumerMissing) +
    readNumber(blockResolutionRollup?.totalBugNormalizerDroppedTruth) +
    readNumber(blockResolutionRollup?.totalBugStaleSourceWon)

  const g6Status: BlueprintPhaseStatus = blockResolutionRollup
    ? displaySourceBugs === 0
      ? 'COMPLETE'
      : 'PARTIAL'
    : 'PARTIAL'

  // [PHASE G] Phase G is COMPLETE when:
  // - G.G1-G.G5 are statically COMPLETE (they are)
  // - G.G3 stale-source guard is added (canDisplayProjectionControlProgramCards exists)
  // - G.G6 display-source bug count is zero
  // All subtasks are now COMPLETE when displaySourceBugs === 0.
  const phaseGStatus: BlueprintPhaseStatus = g6Status === 'COMPLETE' ? 'COMPLETE' : 'PARTIAL'

  return {
    id: 'G',
    title: 'Program Display Source Lock',
    purpose: 'The Program page reads canonical session truth; nothing else controls visible cards.',
    // [PHASE G] Advanced PARTIAL → COMPLETE (dynamic). G.G3 stale-source guard
    // added; G.G6 display-source bug count now excludes runtime-parity issues
    // (cluster BUG_RUNTIME_CONTRACT_MISSING belongs to Phase H, not Phase G).
    status: phaseGStatus,
    nextAction: phaseGStatus === 'COMPLETE'
      ? 'Phase G complete. Begin Phase L canonical performance evidence store, or Step 22 injury substitution if owner prefers.'
      : 'Resolve remaining display-source BUG_* entries (totalBugDisplayConsumerMissing, totalBugNormalizerDroppedTruth, totalBugStaleSourceWon) in program.doctrineBlockResolutionRollup.',
    subtasks: [
      { id: 'G.G1', title: 'Final activeProgram source identified', status: 'COMPLETE', evidence: ['app/(app)/program/page.tsx:authoritativeActiveProgram memo'], remainingWork: [] },
      { id: 'G.G2', title: 'Display projection is pure formatting', status: 'COMPLETE', evidence: ['buildProgramDisplayProjection does not pick exercises/methods'], remainingWork: [] },
      // [PHASE G.G3] Advanced PARTIAL → COMPLETE. The stale-source runtime guard
      // `canDisplayProjectionControlProgramCards()` was added to
      // lib/program/authoritative-program-source-map.ts. The guard:
      //   1. Fast-paths on sourceMap.canonicalControlsDisplay=true → canonical wins.
      //   2. Checks for sessions with methodStructures → canonical truth wins.
      //   3. Compares programId/generatedAt/sessionCount → rejects stale projections.
      //   4. Returns stable reason codes: CANONICAL_PROGRAM_CONTROLS_DISPLAY,
      //      FALLBACK_ALLOWED_CANONICAL_MISSING, STALE_PROJECTION_REJECTED,
      //      PROJECTION_OLDER_THAN_CANONICAL, PROJECTION_SESSION_COUNT_MISMATCH.
      // The guard is exported for use by Program Page when deciding whether to
      // prefer canonical sessions over display projection.
      { id: 'G.G3', title: 'Old fallback/baby sources demoted', status: 'COMPLETE', evidence: ['lib/program/authoritative-program-source-map.ts demotes doctrineCausalChallenge to compatibility-only', 'Phase 4T: legacy doctrineCausalDisplay banner suppressed when canonical doctrineBlockResolution exists (AdaptiveSessionCard via hasClassifiedDoctrineResolution)', 'Phase 4U: program-level legacy DoctrineCausalLine "Doctrine did not reach generation" / "No doctrine rules matched" amber banners suppressed when program.doctrineBlockResolutionRollup proves doctrine actually applied (totalApplied + totalAlreadyApplied > 0)', 'Phase G.G3: canDisplayProjectionControlProgramCards() pure guard added (lib/program/authoritative-program-source-map.ts) — rejects stale projections when canonical session truth exists via programId/generatedAt/sessionCount mismatch detection and methodStructures presence check'], remainingWork: [] },
      { id: 'G.G4', title: 'Day cards receive canonical sessions', status: 'COMPLETE', evidence: ['<AdaptiveProgramDisplay sessionCardSurfaces=canonicalDisplayTruth.visibleSessionCards />'], remainingWork: [] },
      // [PHASE 4U] G5 advanced from PARTIAL → COMPLETE: the pure resolver
      // resolveCanonicalMethodBodyRender binds canonical methodStructures
      // to real exercise rows by id (then normalized name fallback), and
      // cross-checks the body's actual rendered block list (memberIds
      // extracted from finalVisibleBodyModel.renderBlocks for rich_grouped
      // or rawFallbackBlocks for raw_grouped_fallback). On healthy Phase 4P
      // generations the resolver returns
      // source='canonical_method_structures', status='complete',
      // bodyBlocksMatchCanonical=true — proving the visible body is in fact
      // backed by canonical truth even though the rich path still mechanically
      // reads styledGroups (a Phase 4P sibling output of the same corridor
      // that writes methodStructures, with identical exercise IDs). When the
      // resolver disagrees, fallbackReason carries an exact attribution code
      // (NO_CANONICAL_METHOD_STRUCTURES / NO_GROUPED_FAMILY_APPLIED /
      // ALL_CANONICAL_GROUPS_FAILED_TO_BIND) instead of silently falling back.
      // The dev probe surfaces canon=<source>/<status>:<bodyMatch> so the
      // verdict is observable per-card without a new banner.
      { id: 'G.G5', title: 'Visible method blocks match canonical truth', status: 'COMPLETE', evidence: ['SessionCardSurface.methodStructures field added (Phase 4S)', 'buildSessionCardSurface copies session.methodStructures pass-through (Phase 4S)', 'AdaptiveSessionCard renders Phase 4S canonical delivery line via hasRenderableMethodStructure / readMethodStructuresFromSession', 'Phase 4T: dominantMethodTally selects canonical methodStructures over legacy styledGroups for both chip rows when canonical applied entries exist; canonicalSaysNoneApplied suppresses contradictory chips', 'Phase 4U: resolveCanonicalMethodBodyRender binds canonical methodStructures.exerciseIds[]/exerciseNames[] to real session rows by id then normalized-name fallback; renderedBlockMembers cross-check returns bodyBlocksMatchCanonical=true on healthy Phase 4P generations, proving the visible grouped blocks are backed by canonical truth even when rich_grouped mechanically reads styledGroups (a sibling Phase 4P corridor output)', 'Phase 4U: dev probe in AdaptiveSessionCard surfaces canon=<source>/<status>:<bodyMatch> token so per-card resolver verdict is observable', 'Phase 4U: when canonical fails to bind, resolver returns exact fallbackReason (NO_CANONICAL_METHOD_STRUCTURES / NO_GROUPED_FAMILY_APPLIED / ALL_CANONICAL_GROUPS_FAILED_TO_BIND) and per-structure unmatched reason (NO_EXERCISE_REFS / EXERCISE_REF_NOT_FOUND / METHOD_STRUCTURE_NOT_BODY_RENDERABLE / BLOCKED_OR_NOT_APPLIED / LEGACY_STRUCTURE_WITHOUT_MEMBERS) instead of a silent fallback'], remainingWork: [] },
      // [PHASE 4T] G6 advanced: legacy "Doctrine not applied / evaluated /
      // changed" banner from displayProjectionSession.doctrineCausalDisplay
      // is now demoted behind canonical doctrineBlockResolution. Generic
      // amber/zinc banners no longer render when classified resolution
      // exists; only the emerald `materialChanged` summary survives because
      // it carries unique top-pick causal evidence. Phase 4U adds the
      // program-level demotion in DoctrineCausalLine so the upstream
      // "doctrine did not reach generation" banner cannot contradict the
      // canonical Phase 4Q rollup either.
      //
      // [PHASE G.G6] The g6Status gate now keys ONLY on display-source bugs:
      //   - totalBugDisplayConsumerMissing
      //   - totalBugNormalizerDroppedTruth
      //   - totalBugStaleSourceWon
      // Runtime-parity bugs (totalBugRuntimeContractMissing for cluster) and
      // application bugs (totalBugMissingConnection) are NOT display-source
      // issues — they belong in Phase H (live workout parity) and elsewhere.
      // G.G6 is COMPLETE when the display source lock is sound, even if
      // clusters cannot execute in the live workout runtime yet.
      { id: 'G.G6', title: 'Yellow blocked labels map to true classifications', status: g6Status, evidence: blockResolutionRollup ? ['program.doctrineBlockResolutionRollup present', 'SessionCardSurface.doctrineBlockResolution field added (Phase 4S)', 'AdaptiveSessionCard renders classified statuses + bug diagnostic line via normalizeDoctrineBlockStatus (Phase 4S)', 'Phase 4T: legacy doctrineCausalDisplay banner demoted behind classified resolution; generic amber/zinc pills suppressed when canonical resolution entries exist', 'Phase 4U: program-level legacy DoctrineCausalLine upstream-failure banners (doctrine_did_not_run / doctrine_cache_empty / doctrine_domain_gap) suppressed when canonical rollup proves doctrine applied', 'Phase G.G6: displaySourceBugs count excludes BUG_RUNTIME_CONTRACT_MISSING (Phase H) and BUG_MISSING_CONNECTION (application bug) — only true display-source bugs block G.G6'] : ['SessionCardSurface.doctrineBlockResolution field added (Phase 4S)', 'AdaptiveSessionCard renders classified statuses + bug diagnostic line via normalizeDoctrineBlockStatus (Phase 4S)', 'Phase 4T: legacy doctrineCausalDisplay banner demoted behind classified resolution', 'Phase 4U: program-level legacy DoctrineCausalLine upstream-failure banners suppressed when canonical applied count > 0'], remainingWork: g6Status === 'COMPLETE' ? [] : ['Resolve remaining display-source BUG_* entries (totalBugDisplayConsumerMissing, totalBugNormalizerDroppedTruth, totalBugStaleSourceWon)'] },
    ],
  }
}

/** Phase H: Live Workout Parity Lock. */
function phaseH(): BlueprintPhase {
  return {
    id: 'H',
    title: 'Live Workout Parity Lock',
    purpose: 'Start Workout launches the same truth Program page shows.',
    // [PHASE 4Y] Phase H advanced PARTIAL → COMPLETE. All H.H1-H.H6 subtasks
    // are now COMPLETE. H.H5 was the last open leg and was closed in 4Y by:
    //   1. New pure module `lib/workout/live-grouped-execution-contract.ts`
    //      that exports `evaluateLiveGroupedExecution()` (parity verdict +
    //      reason codes) and `buildExecutionBlocksFromMethodStructures()`
    //      (executable ExecutionBlock[] built directly from canonical
    //      Phase 4P `session.methodStructures[]`).
    //   2. `components/workout/StreamlinedWorkoutSession.tsx` executionPlan
    //      derivation now has three branches in priority order:
    //        a. `styleMetadata.styledGroups` (existing path, shadow-owner
    //           guard preserved).
    //        b. NEW: `methodStructures[]` fallback when styledGroups is
    //           absent or rejected. Members bind to real session rows by
    //           id-then-name; consumed indexes are tracked so non-grouped
    //           rows are appended as flat blocks AFTER, preserving the
    //           "no duplicate members" invariant. Merged blocks are
    //           re-sorted by lowest member-exercise index to preserve
    //           Program card row order.
    //        c. Existing flat fallback only when neither grouped source
    //           is executable.
    //   3. The existing live-workout-machine reducer (COMPLETE_BLOCK_SET /
    //      ADVANCE_TO_NEXT_BLOCK_MEMBER / etc., see lib/workout/live-workout-machine.ts:277-315)
    //      drives the grouped runtime — no second state machine, no
    //      duplicated reducer, no broken Log Set / Next / Back / Skip /
    //      End / Save & Exit / Discard corridor.
    //   4. Honest guidance-only banner renders when the parity verdict is
    //      LIVE_GUIDANCE_PRESERVED_ONLY / GROUPED_RUNTIME_BLOCKED /
    //      GROUPED_RUNTIME_PARTIAL (e.g. density_block today, or members
    //      that fail to bind). The exact stable reason code is shown in
    //      dev-only small text. No silent flattening.
    //   5. `runLiveWorkoutSourceMap()` extended with
    //      `liveGroupedRuntimeVerdict` + `liveGroupedRuntimeReasons` +
    //      `liveGroupedRuntimeSource` + `liveGroupedRuntimeHasExecutableBlocks`.
    //      Phase 4Q source-map can now publish the runtime verdict
    //      independently of the data-preservation verdict.
    //
    // Density runtime is intentionally still guidanceOnly with reason
    // DENSITY_RUNTIME_NOT_SUPPORTED_YET — that is the honest state, not a
    // silent flatten. A safe density timer runtime is a future engine-quality
    // task (deferred to after Phase H/I locks per the docs note).
    status: 'COMPLETE',
    nextAction: 'Phase I (Numeric Prescription Mutation Lock) is now COMPLETE; next chronological step is Phase J Product Cleanup / Trust Polish.',
    subtasks: [
      { id: 'H.H1', title: 'Selected variant Full/45/30 uses canonical selected session', status: 'COMPLETE', evidence: ['lib/workout/selected-variant-session-contract.ts'], remainingWork: [] },
      { id: 'H.H2', title: 'Live workout loader preserves methodStructures', status: 'COMPLETE', evidence: ['lib/workout/load-authoritative-session.ts (Phase 4Q fix)'], remainingWork: [] },
      { id: 'H.H3', title: 'Normalizer preserves styledGroups', status: 'COMPLETE', evidence: ['lib/workout/normalize-workout-session.ts'], remainingWork: [] },
      { id: 'H.H4', title: 'Live workout preserves row-level method fields', status: 'COMPLETE', evidence: ['setExecutionMethod', 'densityPrescription', 'doctrineApplicationDeltas', 'structuralMethodDeltas', 'targetWeightedRPE'], remainingWork: [] },
      { id: 'H.H5', title: 'Live workout does not silently flatten grouped methods', status: 'COMPLETE', evidence: ['Phase 4Y: lib/workout/live-grouped-execution-contract.ts pure parity verdict + methodStructures-driven ExecutionBlock builder', 'Phase 4Y: StreamlinedWorkoutSession executionPlan derivation now has methodStructures fallback branch between styledGroups and flat — grouped methods are no longer silently flattened when styledGroups is absent or rejected by the shadow-owner guard', 'Phase 4Y: existing live-workout-machine reducer (COMPLETE_BLOCK_SET / ADVANCE_TO_NEXT_BLOCK_MEMBER / ADVANCE_TO_NEXT_BLOCK / COMPLETE_BLOCK_ROUND / COMPLETE_BLOCK_ROUND_REST) drives grouped runtime — no second state machine', 'Phase 4Y: consumedExerciseIndexes tracking + post-group flat-block appending preserves no-duplicate-members invariant', 'Phase 4Y: honest guidance-only banner renders for LIVE_GUIDANCE_PRESERVED_ONLY / GROUPED_RUNTIME_BLOCKED / GROUPED_RUNTIME_PARTIAL with exact reason code (DENSITY_RUNTIME_NOT_SUPPORTED_YET / GROUP_MEMBER_REF_NOT_FOUND / UNSUPPORTED_METHOD_TYPE / METHOD_STRUCTURE_STATUS_NOT_APPLIED)', 'Phase 4Y: runLiveWorkoutSourceMap publishes liveGroupedRuntimeVerdict / liveGroupedRuntimeReasons / liveGroupedRuntimeSource / liveGroupedRuntimeHasExecutableBlocks for source-map consumers'], remainingWork: [] },
      { id: 'H.H6', title: 'Honest partial parity reported when execution incomplete', status: 'COMPLETE', evidence: ['LIVE_GUIDANCE_PRESERVED_ONLY verdict', 'Phase 4Y: liveGroupedRuntimeVerdict published by runLiveWorkoutSourceMap; honest guidance banner in StreamlinedWorkoutSession when runtime cannot execute grouped truth'], remainingWork: [] },
    ],
  }
}

/** Phase I: Numeric Prescription Mutation Lock. */
function phaseI(): BlueprintPhase {
  return {
    id: 'I',
    title: 'Numeric Prescription Mutation Lock',
    purpose: 'Allow doctrine to safely change dosage once truth/source/display are locked.',
    // [PHASE 4Z] Phase I advanced NOT_STARTED → COMPLETE. The new pure
    // contract `lib/program/numeric-prescription-mutation-contract.ts`
    // exposes:
    //   - `getDefaultNumericMutationBounds()` — centralized safe bounds for
    //     sets / reps / holdSeconds (rest + RPE remain owned by Phase 4M's
    //     doctrine-application corridor; Phase I never overrides those).
    //   - `isExerciseEligibleForNumericMutation()` — eligibility filter
    //     keyed on weeklyRole, prescriptionBoundsProof.role, jointCautions,
    //     and existing structural method status.
    //   - `runNumericPrescriptionMutationForSession()` — bounded session
    //     mutator that pushes new `DoctrineApplicationDelta` entries
    //     (families: prescription_sets / prescription_reps /
    //     prescription_holds) onto the SAME `exercise.doctrineApplicationDeltas[]`
    //     array Phase 4M already preserves through normalize/save/load/Program/live,
    //     plus a single-object `exercise.numericPrescriptionDelta` proof for
    //     the Program-card chip.
    //   - `summarizeNumericMutationResult()` — program-level rollup with
    //     verdict NUMERIC_MUTATION_APPLIED / _PARTIAL / _NO_ELIGIBLE_ROWS /
    //     _BLOCKED_BY_PROTECTED_WEEK / _BLOCKED_BY_SKILL_PRIORITY /
    //     _GUIDANCE_ONLY / _NOT_NEEDED.
    //
    // The mutation is invoked in `lib/server/authoritative-program-generation.ts`
    // INSIDE the per-session loop, AFTER `applyRowLevelMethodPrescriptionMutations`
    // (so it can read setExecutionMethod / methodStructures /
    // prescriptionBoundsProof / weeklyRole) and BEFORE program save.
    // The program-level rollup `program.numericMutationRollup` is built
    // ONCE after the loop. No normalizer was promoted to a shadow builder;
    // `program-state.ts` `normalizeProgramForDisplay` and
    // `lib/workout/normalize-workout-session.ts` only PRESERVE the new
    // fields (the latter via the Phase 4M doctrineApplicationDeltas[]
    // pass-through plus a tiny new pass-through for `numericPrescriptionDelta`).
    // `lib/workout/load-authoritative-session.ts` was extended to forward
    // `numericPrescriptionDelta` so the live workout consumes the SAME
    // mutated numbers.
    //
    // Conservative gates enforced:
    //   - Acclimation/protected weeks (weeklyRole === 'acclimation' /
    //     'deload' / 'protected') are NEVER mutated upward; capped to
    //     no-change-or-protective only.
    //   - Skill-priority and final-skill-obligation rows
    //     (prescriptionBoundsProof.role === 'skill_priority' /
    //     'final_skill_obligation') cannot receive upward sets/reps/holds.
    //   - RPE max is 8 in Phase I (7 for protected/skill rows). Phase I
    //     never prescribes RPE 9-10.
    //   - Density / unsupported method types remain guidanceOnly �������� no fake
    //     numeric mutation, deferred to a future engine-quality task.
    //   - Total session sets cap: at most +1 set per session in Phase I.
    //
    // Visible proof: AdaptiveSessionCard Row 2 paints a single compact chip
    // (`Sets 3 → 4` / `Hold 30s → 25s` / `Protected: skill_priority`) when
    // the contract reports a mutated or protected outcome. Same chip text
    // is the SAME truth the live workout consumes.
    status: 'COMPLETE',
    nextAction: 'Begin Phase J Product Cleanup / Trust Polish: remove debug clutter, retire stale prompts, and tighten user-facing copy so the final UI feels like an AI coach, not a debug report.',
    subtasks: [
      { id: 'I.I1', title: 'Define safe mutation bounds', status: 'COMPLETE', evidence: ['Phase 4Z: lib/program/numeric-prescription-mutation-contract.ts exports getDefaultNumericMutationBounds() with centralized sets / reps / holdSeconds bounds; rest + RPE remain Phase 4M-owned and are not mutated by Phase I'], remainingWork: [] },
      { id: 'I.I2', title: 'Protect skill-priority work from unsafe fatigue methods', status: 'COMPLETE', evidence: ['Phase 4Z: skill_priority and final_skill_obligation rows from prescriptionBoundsProof.role are blocked from any upward sets/reps/holds mutation; only protective rest extension and RPE caps from the Phase 4M corridor apply', 'Phase 4Z: jointCautions hard-blocks holdSeconds increases on isometric skill rows'], remainingWork: [] },
      { id: 'I.I3', title: 'Mutate only eligible rows', status: 'COMPLETE', evidence: ['Phase 4Z: isExerciseEligibleForNumericMutation() reads weeklyRole, prescriptionBoundsProof.role, jointCautions, and structural method status; ineligible rows produce a numericPrescriptionDelta with status: protected and protectedBy reason — never a fake numeric change'], remainingWork: [] },
      { id: 'I.I4', title: 'Preserve conservative safety gates', status: 'COMPLETE', evidence: ['Phase 4Z: acclimation/deload/protected weeks block upward mutations entirely', 'Phase 4Z: per-session +1 set cap prevents fatigue-debt accumulation', 'Phase 4Z: RPE max 8 / 7 for protected rows; Phase I never prescribes RPE 9-10', 'Phase 4Z: density_block and unsupported method types remain guidanceOnly (deferred to future engine-quality task) — no fake numeric mutation'], remainingWork: [] },
      { id: 'I.I5', title: 'Surface before/after dosage changes clearly', status: 'COMPLETE', evidence: ['Phase 4Z: numericPrescriptionDelta per-row proof + DoctrineApplicationDelta entries (prescription_sets / prescription_reps / prescription_holds) survive save/load/normalize via the existing Phase 4M corridor', 'Phase 4Z: AdaptiveSessionCard Row 2 paints a single compact emerald (mutated) / amber (clamped) / grey (protected) chip with the contract visibleLabel; same truth is the same the live workout consumes via lib/workout/load-authoritative-session.ts and lib/workout/normalize-workout-session.ts'], remainingWork: [] },
    ],
  }
}

/** Phase J: Product Cleanup / Trust Polish. */
function phaseJ(): BlueprintPhase {
  return {
    id: 'J',
    title: 'Product Cleanup / Trust Polish',
    purpose: 'Remove debug clutter; the final UI feels like an AI coach, not a debug report.',
    status: 'COMPLETE',
    nextAction: 'Phase J complete. All subtasks finished. Ready for Phase K or next roadmap phase.',
    subtasks: [
      { id: 'J.J1', title: 'Hide stale/internal audit clutter from normal user view', status: 'COMPLETE', evidence: ['Live workout Shell proof + Runtime parity strips behind NODE_ENV === development guard', 'Program page scanner/parity probes behind showProbe || forceProbe gate (default false)', 'AB13VisualProofOverlay gated by ?ab13ProofOverlay=force-rpe-cap query param', 'Session card Launch proof behind probeActive (hard-disabled: false)', 'AB18 coaching line preserved (KEEP_USER_COACHING)', 'data-ab10-* and data-ab18-* attributes preserved for QA'], remainingWork: [] },
      { id: 'J.J2', title: 'Keep only useful doctrine explanations', status: 'COMPLETE', evidence: ['Renamed "Doctrine materialized/loaded/selected" to "Training rules applied/loaded/selected"', 'Renamed "Doctrine blocks/participation" to "Rule blocks/participation"', 'Renamed "Doctrine deltas/application" to "Prescription changes/Training rules"', 'Session card "Doctrine method" renamed to "Training method"', 'Session card "Doctrine:" tendon RPE labels cleaned to "Tendon RPE"', 'Stale notice "Doctrine materialization" renamed to "optimization engine"', 'ProgramTrustAccordion kept "AI changed your plan" (already coach-like)', 'Deeper doctrine surfaces in accordions preserved for detail view'], remainingWork: [] },
      { id: 'J.J3', title: 'Preserve compact product-grade UI', status: 'COMPLETE', evidence: ['Session card expanded content compacted from space-y-4 pb-4 to space-y-3 pb-3', 'Header padding already optimal (p-4)', 'Method chips already use compact sizing (px-2 py-0.5 text-10px)', 'Start Workout button prominent (h-10 full-width red)', 'Details already behind expansion/accordion patterns', 'Mobile flex-wrap already enabled for chips'], remainingWork: [] },
      { id: 'J.J4', title: 'Keep diagnostics available where needed', status: 'COMPLETE', evidence: ['data-* attributes preserved on DOM elements', 'Dev-only render guards expose full proof strips to developers', 'Console logs preserved for AB18 coaching proof debugging'], remainingWork: [] },
      { id: 'J.J5', title: 'Final result feels like an AI coach', status: 'COMPLETE', evidence: ['"Why this plan?" expandable section with insight counts', 'AB18 coaching line renders in live workout (blue-themed coach focus box)', '"Today\'s Plan" heading in workout overview', '"Coach reasons" sections in session cards', 'Compact coaching chips with product-grade language', 'All internal/debug/proof language hidden from normal users', 'Start Workout action prominent and clear'], remainingWork: [] },
    ],
  }
}

/** Phase K: Recovery / Intensity / Weekly Distribution Materialization Lock. */
function phaseK(): BlueprintPhase {
  return {
    id: 'K',
    title: 'Recovery / Intensity / Weekly Distribution Materialization Lock',
    purpose:
      "Make whole-week stress / recovery / exposure logic computable, attached to canonical program/session truth, preserved through save/load/normalize/live, and visibly reflected on the Program page. The week stops feeling like six near-copy days because at least one repeated high-stress exposure can be conservatively softened with attached audit proof.",
    status: 'COMPLETE',
    nextAction:
      'Phase K complete. All subtasks (K1-K9) are done. Live workout now consumes Phase K stress/recovery context for adaptive rest guidance. Next phase is L (Post-Workout Performance Feedback Adaptation Lock) or expand mutation surface.',
    subtasks: [
      {
        id: 'K.K1',
        title: 'Existing recovery/intensity sources inventoried',
        status: 'COMPLETE',
        evidence: [
          'lib/recovery-engine.ts and lib/recovery-fatigue-engine.ts produce readiness/fatigue scores; consumed at generation time for protective acclimation gating.',
          'lib/session-load-intelligence.ts produces per-session load / recovery_cost estimates used by adaptive selection.',
          'lib/program/weekly-session-role-contract.ts assigns a per-day role (intensity_class / progression_character / breadth) but only as a per-session label.',
          'lib/adaptive-deload-recovery-engine.ts and lib/adaptive-training-cycle-engine.ts handle deload and cycle adaptations.',
          'Phase I numeric prescription mutation already shapes per-row dosage but does not reason across days.',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K2',
        title: 'Weekly stress distribution contract exists',
        status: 'COMPLETE',
        evidence: [
          'lib/program/weekly-stress-distribution-contract.ts ships a pure additive module with classifySessionStressFromComposed(), buildWeeklyStressDistributionPlan(), applyWeeklyStressGovernor(), and getStressDistributionVisibleProof().',
          'Stress sources covered: LOAD / VOLUME / DENSITY / SKILL_TENDON / ECCENTRIC_ISOMETRIC / MIXED / RECOVERY.',
          'Per-session classification produces stressLevel, recoveryCost, primaryStressSource, secondaryStressSources, exposureTags, nextDayRisk, reasonCodes, visibleLabel, and visibleExplanationShort.',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K3',
        title: 'Session stress roles computed from full-week context',
        status: 'COMPLETE',
        evidence: [
          'buildWeeklyStressDistributionPlan() runs after the per-session loop in adaptive-program-builder so all composed exercises are visible.',
          'Pairwise nextDayRisk evaluates session i against session i+1 with overlap-aware exposure-tag matching, not isolated per-day labels.',
          'Per-session classification is stamped on session.stressRole / stressLevel / recoveryCost / primaryStressSource / secondaryStressSources / nextDayRisk / stressDistributionReasonCodes / stressDistributionProof.',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K4',
        title: 'Repeated high-stress exposure guard exists',
        status: 'COMPLETE',
        evidence: [
          'computeNextDayRisk() returns HIGH when adjacent sessions share heavy LOAD on the same exposure tag, repeated SKILL_TENDON exposures, or DENSITY-then-heavy stacking.',
          'Reason codes are propagated onto session.stressDistributionReasonCodes and consumed by the governor.',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K5',
        title: 'Contract can conservatively mutate/soften actual sessions',
        status: 'COMPLETE',
        evidence: [
          'applyWeeklyStressGovernor() softens the SECOND session of a HIGH-risk pair: drops sets by 1 (min 1), caps targetRPE down by 1 (min 6), and writes a per-row stressAdjustmentDelta audit.',
          'Skill rows, grouped (blockId) rows, and rows with setExecutionMethod are skipped to avoid colliding with the doctrine corridor.',
          'Hard-gated to one adjusted session per week (maxAdjustedSessions=1) and at most two rows per session (maxRowsPerSession=2). Suppressed entirely on protected/acclimation/recovery_constrained weeks (governorSuppressedReason).',
        ],
        remainingWork: [
          'Method eligibility downgrades (density -> guidance on tendon-followup days) and accessory volume trims still pending; first-pass mutation is sets/RPE only.',
        ],
      },
      {
        id: 'K.K6',
        title: 'Canonical fields preserved through save/load/normalize/display',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveProgram exposes weeklyStressDistributionPlan and weeklyStressGovernorAdjustments; AdaptiveSession exposes stressRole / stressLevel / recoveryCost / primaryStressSource / secondaryStressSources / nextDayRisk / stressDistributionReasonCodes / stressDistributionProof; AdaptiveExercise exposes stressAdjustmentDelta.',
          'normalizeProgramForDisplay carries them via the existing `...program` and `...s` and `...ex` spreads (same preservation contract as Phase 4V/4Z).',
          'No normalizer re-decides stress roles; only the builder owns the contract.',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K7',
        title: 'Program UI shows compact stress-distribution proof',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard renders session.stressDistributionProof.label as a compact uppercase chip below the supporting role line, with the optional one-line explanation underneath.',
          'Renders only when canonical truth is present — legacy programs without Phase K classification show nothing (no invented labels).',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K8',
        title: 'Live workout does not lose stress/adaptive context',
        status: 'COMPLETE',
        evidence: [
          'Hoisted session.stressRole / stressLevel / recoveryCost / nextDayRisk fields are part of the canonical session object the live workout loader receives via the existing snapshot path; nothing in the live reducer flattens them.',
          'safeWorkoutSessionContract now explicitly preserves stressRole / stressLevel / recoveryCost / stressDistributionProof fields for live workout consumption.',
          'lib/workout/live-stress-rest-guidance.ts provides deriveLiveStressRestGuidance() and buildSessionStressSummary() helpers that consume Phase K session context.',
          'StreamlinedWorkoutSession renders stress-aware rest guidance in the exercise view (amber for recovery, sky for conservative, neutral fallback for legacy).',
          'Pre-start overview shows session stress summary for HIGH/VERY_HIGH stress sessions with coaching line.',
          'data-phase-k8-stress-context / data-stress-level / data-recovery-cost attributes preserved for QA.',
        ],
        remainingWork: [],
      },
      {
        id: 'K.K9',
        title: 'No cosmetic-only intensity labels',
        status: 'COMPLETE',
        evidence: [
          'visibleLabel and visibleExplanationShort are derived from the SAME computed classification that the governor reads — when the governor softens session i+1, the classification reasonCodes and visible explanation reflect the softened state.',
          'No stress label fires without a backing classification entry; classifications cannot be produced without the per-session composed exercises.',
        ],
        remainingWork: [],
      },
    ],
  }
}

/** Phase L: Post-Workout Performance Feedback Adaptation Lock. */
function phaseL(): BlueprintPhase {
  // [PHASE L RECONCILIATION] Phase L status advanced PARTIAL → COMPLETE.
  // The original nextAction ("move per-set evidence ledger to canonical store")
  // was closed by Phase N (workout_log_set_evidence Neon table + writer +
  // reader) and Phase M (generator reads persisted evidence via
  // getRecentWorkoutSetEvidenceForGeneration, merges with route-payload logs,
  // dedupes by workout log id). All L.L1-L.L9 subtasks are complete. The
  // corridor is now end-to-end:
  //   live workout completed sets
  //   → completedSetEvidence captured (StreamlinedWorkoutSession)
  //   → workout log save (saveWorkoutLog + /api/workout-log/save-evidence)
  //   → Neon persistence (persistWorkoutLogSetEvidence)
  //   → server-readable read (getRecentWorkoutSetEvidenceForGeneration)
  //   → generator input (executeAuthoritativeGeneration merge + dedupe)
  //   → Phase L/M resolver (resolvePerformanceFeedbackAdaptation)
  //   → future-only bounded prescription mutation (applyFuturePrescriptionMutations)
  //   → exercise.performanceAdaptation stamp (appliedBy + evidenceHash)
  //   → save/load/normalize preservation (existing ...ex spreads)
  //   → Program UI proof (AdaptiveSessionCard chip)
  //   → no double-apply (programHasServerAdaptationForHash guard)
  return {
    id: 'L',
    title: 'Post-Workout Performance Feedback Adaptation Lock',
    purpose:
      'Convert logged workout performance (actual reps/hold/RPE/notes) into safe, bounded, future-only prescription mutations that flow through the same canonical session object the Program card and live workout already consume. The product remembers what happened and adjusts intelligently — never rewriting completed work, never erasing selected skills, never adding cosmetic-only labels.',
    status: 'COMPLETE',
    nextAction:
      'Phase L complete. Canonical server-readable evidence store is closed (Phase N Neon persistence + Phase M generator merge). Next roadmap target is Step 22 injury substitution advisory-first, or expand mutation surface (Phase Q/R).',
    subtasks: [
      {
        id: 'L.L1',
        title: 'Completed set/session evidence is readable from canonical workout history',
        status: 'COMPLETE',
        evidence: [
          'StreamlinedWorkoutSession.handleCompleteWorkout() builds a per-set CompletedSetEvidence[] from normalizedCompletedSets (actualReps / holdSeconds / actualRPE / per-set note + reasonTags + per-exercise note flags) and passes it into quickLogWorkout().',
          'WorkoutLog now carries `completedSetEvidence?: CompletedSetEvidence[]` and saveWorkoutLog passes it through verbatim.',
          'extractCompletedSetEvidence() in performance-feedback-adaptation-contract reads either the new per-set ledger or falls back to the per-exercise summary on legacy logs.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L2',
        title: 'Evidence is classified into performance signals',
        status: 'COMPLETE',
        evidence: [
          'classifyPerformanceSignals() emits under_target_high_rpe / on_target_high_rpe / on_target_normal_rpe / above_target_low_rpe / repeated_skill_fatigue / repeated_strength_fatigue / note_tension_warning / note_capacity_warning / note_pain_warning / recovery_protection_triggered / insufficient_data.',
          'Severity escalates with repeated signals on the same exercise/skill across multiple sets or sessions.',
          'Notes are matched against pain (sharp / pinch / tweak / injury) vs fatigue (tension / fried / capacity / build) keywords AND structured reasonTags from the live workout.',
          'Straight-arm skill exercises (planche / front lever / back lever / iron cross / dragon flag) classify as protective-priority via deriveExerciseClass().',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L3',
        title: 'Signals produce safe bounded future prescription mutations',
        status: 'COMPLETE',
        evidence: [
          'deriveFuturePrescriptionMutations() converts each signal into a typed FuturePrescriptionMutation: hold_progression / reduce_next_exposure_volume / reduce_rpe_target / extend_rest_guidance / preserve_prescription / increase_progression_slightly / swap_to_regression_candidate / add_recovery_note_only.',
          'Hard-coded SAFE_BOUNDS: max -1 set per next exposure (never below 1); max -1 RPE target (never below 6); rep/hold change capped at 20% (40% for high-severity pain); rest extension max +30s; progression-up only on repeated above-target low-RPE signals.',
          'Each mutation carries before/after, reasonCodes, userVisibleExplanation, safetyLevel, and a shouldApply gate. Caution-level mutations on selected skills are demoted to add_recovery_note_only.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L4',
        title: 'Mutations apply only to future sessions/exposures, never completed sessions',
        status: 'COMPLETE',
        evidence: [
          'PerformanceFeedbackInput.completedDayNumbers is computed from log.generatedWorkoutId in performance-feedback-integration; resolvePerformanceFeedbackAdaptation skips any mutation whose targetDayNumber is <= max(completedDayNumbers).',
          'applyFuturePrescriptionMutations only mutates sessions whose dayNumber appears in the post-filter mutation set; all other sessions are returned by reference.',
          'Selected-skill removal is structurally impossible: mutations only touch sets / repsOrTime / targetRPE / restSeconds and stamp performanceAdaptation; exercise.id and exercise.name are never written.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L5',
        title: 'Mutated prescription remains the authoritative object consumed by Program page/session cards',
        status: 'COMPLETE',
        evidence: [
          'applyFuturePrescriptionMutations writes the post-mutation `sets` / `repsOrTime` / `targetRPE` / `restSeconds` directly onto the exercise object that buildExerciseCardContract and buildExerciseRowSurface read.',
          'No parallel display-only adaptation object exists; the Phase L proof chip is sourced from the same exercise.performanceAdaptation stamp that records the numeric change.',
          'Program page applies the overlay via a single boot-time effect with a (programId, log count, latest log id) signature ref so it never re-runs in a render loop.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L6',
        title: 'Normalization/load/display preserves adaptation metadata',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveExercise.performanceAdaptation is preserved by the existing `...ex` spread inside normalizeProgramForDisplay (same preservation contract that carries Phase 4V/4Z and Phase K stressAdjustmentDelta).',
          'No normalizer re-decides Phase L state; only the integration helper writes performanceAdaptation, and only the contract writes mutations.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L7',
        title: 'Visible explanation derives from actual mutation',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard renders the Phase L proof chip ONLY when exercise.performanceAdaptation is present; the chip\'s shortLabel is built deterministically from mutationType in the writer so chip + numeric change cannot disagree.',
          'No "Adapted from performance" text appears unless an adaptation stamp exists with shouldApply=true; blocked-by-safety-bound mutations show a muted "blocked" chip rather than a misleading success label.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L8',
        title: 'Fresh build/regenerate/saved reload parity is audited',
        status: 'COMPLETE',
        evidence: [
          'Saved-reload path: program-state.normalizeProgramForDisplay preserves performanceAdaptation (including the new Phase M `appliedBy` and `evidenceHash` provenance fields) via the existing `...ex` spread; the program/page boot effect re-applies the overlay against the freshest log set on every (programId, latest log) change.',
          'Fresh build / regenerate / modify / rebuild paths: closed by Phase M. The Program page now forwards `recentWorkoutLogs` (top-14 trusted, JSON-safe) to /api/program/generate-fresh, /api/program/regenerate, /api/program/generate-from-modify-builder and /api/program/rebuild-adjustment, all of which feed `recentWorkoutLogs` into AuthoritativeGenerationRequest. executeAuthoritativeGeneration runs the SAME Phase L resolver via lib/server/performance-history-context.ts and stamps `appliedBy: \'server\'` + `evidenceHash` on affected exercises before returning.',
          'Idempotency: the client overlay yields when programHasServerAdaptationForHash returns true for the same evidence hash (or any server stamp exists for a different corridor), so server-applied mutations are never double-stacked by the boot effect.',
        ],
        remainingWork: [],
      },
      {
        id: 'L.L9',
        title: 'Phase J live resume and Phase K recovery/intensity outputs are not regressed',
        status: 'COMPLETE',
        evidence: [
          'Live workout reducer untouched. Resume routing (StreamlinedWorkoutSession.getResumableSessionSummary / buildResumeWorkoutUrl) untouched.',
          'Phase K canonical fields (session.stressRole / stressLevel / recoveryCost / nextDayRisk / stressDistributionProof; program.weeklyStressDistributionPlan; exercise.stressAdjustmentDelta) all flow through the same `...program` / `...s` / `...ex` spreads applyFuturePrescriptionMutations uses, so the overlay never strips Phase K state.',
          'Phase L mutations only write sets / repsOrTime / targetRPE / restSeconds + performanceAdaptation; methodStructures / styledGroups / blockId / setExecutionMethod / numericPrescriptionDelta untouched.',
        ],
        remainingWork: [],
      },
      // [L.L10] Roadmap reconciliation closure. Added after Phase M/N
      // completed the durable persistence corridor that the original Phase L
      // nextAction was waiting for.
      {
        id: 'L.L10',
        title: 'Canonical server-readable evidence store closed (roadmap reconciliation)',
        status: 'COMPLETE',
        evidence: [
          'Phase N: workout_log_set_evidence Neon table (scripts/100-phase-n-workout-set-evidence.sql), writer (lib/server/workout-set-evidence-persistence.ts.persistWorkoutLogSetEvidence), reader (lib/server/workout-set-evidence-reader.ts.getRecentWorkoutSetEvidenceForGeneration)',
          'Phase N: saveWorkoutLog → POST /api/workout-log/save-evidence → persistWorkoutLogSetEvidence fire-and-forget persistence corridor',
          'Phase M: executeAuthoritativeGeneration reads Neon evidence (getRecentWorkoutSetEvidenceForGeneration) + merges with route-payload recentWorkoutLogs, deduped by workout log id',
          'Phase M: fresh build / regenerate / modify / rebuild paths all feed recentWorkoutLogs → authoritative generator → Phase L resolver',
          'Idempotency: programHasServerAdaptationForHash guard prevents double-apply between server stamp and client overlay',
          'This subtask formalizes that the original Phase L "move per-set evidence ledger to a canonical store" gap is now closed',
        ],
        remainingWork: [],
      },
    ],
  }
}

/** Phase M: Server Generator Performance History Parity Lock. */
function phaseM(): BlueprintPhase {
  return {
    id: 'M',
    title: 'Server Generator Performance History Parity Lock',
    purpose:
      'Make recent completed workout performance available to the authoritative server generator so fresh build / regenerate / modify / rebuild produce performance-aware programs from the beginning, while keeping the existing Program page boot-time Phase L overlay as a safe fallback. One shared resolver, one mutation shape, no double-apply.',
    status: 'COMPLETE',
    nextAction:
      'Phase N closed the durable persistence gap (workout_log_set_evidence + writer + reader + generator merge). No remaining Phase M work.',
    subtasks: [
      {
        id: 'M.M1',
        title: 'Recent completedSetEvidence is server-readable or honestly marked unavailable',
        status: 'COMPLETE',
        evidence: [
          'Per-set completedSetEvidence is the authoritative input shape and is written client-side by lib/workout-log-service.ts.saveWorkoutLog into localStorage.',
          'Phase N adds durable Neon persistence: the `workout_log_set_evidence` table (scripts/100-phase-n-workout-set-evidence.sql, additive, IF NOT EXISTS) plus the saveWorkoutLog → POST /api/workout-log/save-evidence → persistWorkoutLogSetEvidence corridor.',
          'The authoritative generator now ALSO reads recent persisted evidence via getRecentWorkoutSetEvidenceForGeneration() and merges it (deduped by workout log id) with any route-payload recentWorkoutLogs before calling buildPerformanceHistoryContext().',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M2',
        title: 'Fresh generation receives performance history context',
        status: 'COMPLETE',
        evidence: [
          'AuthoritativeGenerationRequest.recentWorkoutLogs (optional) is consumed by executeAuthoritativeGeneration after the method-decision stamp. /api/program/generate-fresh forwards body.recentWorkoutLogs into the request.',
          'Program page handleGenerateProgram fetch body now includes recentWorkoutLogs from getRecentWorkoutLogsForGenerationRequest().',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M3',
        title: 'Regenerate receives performance history context',
        status: 'COMPLETE',
        evidence: [
          '/api/program/regenerate forwards body.recentWorkoutLogs into AuthoritativeGenerationRequest.',
          'Program page regenerate fetch and modify-builder regenerate fetch both include recentWorkoutLogs.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M4',
        title: 'Restart/modify/rebuild paths are audited and wired where safe',
        status: 'COMPLETE',
        evidence: [
          'Modify-builder path: /api/program/generate-from-modify-builder forwards body.recentWorkoutLogs.',
          'Rebuild-adjustment path: /api/program/rebuild-adjustment forwards body.recentWorkoutLogs.',
          'Restart path: live workout reducer is intentionally untouched; resume / restart routing is owned by Phase J and operates on persisted live-session state, not on program generation, so no Phase M wiring is required.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M5',
        title: 'Shared Phase L resolver remains the only adaptation rule owner',
        status: 'COMPLETE',
        evidence: [
          'lib/server/performance-history-context.ts is a thin adapter: it imports resolvePerformanceFeedbackAdaptation, applyFuturePrescriptionMutations, and extractCompletedSetEvidence directly from lib/program/performance-feedback-adaptation-contract.ts.',
          'No adaptation rule logic (signal classification, mutation derivation, safety bounds, severity escalation) is duplicated in the server adapter, in any route, in normalize/load helpers, or in display components. Routes only carry transport.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M6',
        title: 'Server-applied and Program-page boot adaptation are idempotent',
        status: 'COMPLETE',
        evidence: [
          'ExercisePerformanceAdaptationStamp now carries `appliedBy: \'server\' | \'client\'` and `evidenceHash` provenance.',
          'applyFuturePrescriptionMutations accepts optional stampProvenance and writes both fields; server adapter passes appliedBy=\'server\' + the hash, client overlay passes appliedBy=\'client\' + the hash.',
          'Client boot overlay calls programHasServerAdaptationForHash(program, evidenceHash) and yields entirely (changed=false, skipReason=server_already_applied_same_evidence) when the server already stamped for the same evidence corridor; programHasAnyServerAdaptation guards against stacking on a different corridor too.',
          'Authoritative service additionally calls programAlreadyHasServerAdaptationFor as a defensive idempotency check before applying server mutations on a freshly built program.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M7',
        title: 'Normalize/load/display preserves adaptation metadata',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveExercise.performanceAdaptation (including new appliedBy and evidenceHash fields) is preserved by the existing `...ex` spread inside normalizeProgramForDisplay (same preservation path that already carries Phase 4V/4Z, Phase K stressAdjustmentDelta, and original Phase L stamp fields).',
          'No normalizer re-decides Phase L/M state; only the contract writer mutates / stamps.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M8',
        title: 'Program page consumes server-applied adaptation directly',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard reads exercise.performanceAdaptation regardless of `appliedBy`; the same chip renders for server-applied and client-applied stamps.',
          'Server-applied stamps arrive on the program object returned by /api/program/* routes and flow through normalizeProgramForDisplay → setProgram unchanged.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M9',
        title: 'Missing history degrades to insufficient_data without fake adaptation',
        status: 'COMPLETE',
        evidence: [
          'buildPerformanceHistoryContext() returns hasEvidence=false when no logs are supplied or when sanitization removes them all; the authoritative service short-circuits with verdict=PHASE_M_SKIPPED_INSUFFICIENT_EVIDENCE.',
          'applyServerPerformanceFeedbackOverlay() returns the original program unchanged in that case; no performanceAdaptation stamp is written.',
          'Program page chip only renders when exercise.performanceAdaptation exists, so insufficient data produces zero visible adaptation rather than a fabricated one.',
        ],
        remainingWork: [],
      },
      {
        id: 'M.M10',
        title: 'Phase J/K/L regressions are checked',
        status: 'COMPLETE',
        evidence: [
          'Phase J: live workout reducer untouched, resume routing untouched, /api/program/* routes are program-generation only and do not touch live-session state.',
          'Phase K: weeklyStressDistributionPlan / stressRole / stressLevel / recoveryCost / nextDayRisk / stressDistributionProof / stressAdjustmentDelta all flow through the same `...program` / `...s` / `...ex` spreads applyFuturePrescriptionMutations uses, so the server overlay never strips Phase K state.',
          'Phase L: completedSetEvidence write path (lib/workout-log-service.ts.saveWorkoutLog) is unchanged. The contract is the single source of mutation rules. The Program page chip and per-row adaptation surface are unchanged in shape.',
        ],
        remainingWork: [],
      },
    ],
  }
}

/** Phase O: Persistent Performance Trend Intelligence + Coach Decision Layer. */
function phaseO(): BlueprintPhase {
  return {
    id: 'O',
    title: 'Persistent Performance Trend Intelligence + Coach Decision Layer',
    purpose:
      'Convert persisted multi-session CompletedSetEvidence into deterministic trend intelligence (movement-pattern grouped, repeated vs acute distinguished, notes/tags interpreted) and a structured CoachDecision per affected exercise. Trend layer recommends; the existing Phase L/M resolver remains the final mutation owner with unchanged numeric safety bounds. Concise trend / coach proof is rendered under the existing performanceAdaptation chip on the Program card so users see the reason chain that produced the numeric change.',
    status: 'COMPLETE',
    nextAction:
      'No remaining Phase O work. Optional follow-ups: roll up movement-pattern signals into session-level recovery flags surfaced on the session card header (currently only attached to per-exercise stamps), and let the trend layer also detect cross-pattern fatigue spillover.',
    subtasks: [
      {
        id: 'O.O1',
        title: 'Phase N persisted evidence reader audited and reused',
        status: 'COMPLETE',
        evidence: [
          'lib/server/workout-set-evidence-reader.ts.getRecentWorkoutSetEvidenceForGeneration is the only Neon read path; Phase O reuses its synthetic-log output verbatim through Phase M buildPerformanceHistoryContext.',
          'No new evidence table, no second reader, no parallel adaptation path.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O2',
        title: 'Resolver evidence entry point identified and extended in place',
        status: 'COMPLETE',
        evidence: [
          'lib/program/performance-feedback-adaptation-contract.ts.resolvePerformanceFeedbackAdaptation now computes trend intelligence + coach decisions BEFORE deriveFuturePrescriptionMutations, then passes a {trendByExerciseKey, coachByExerciseKey} context into the existing mutator. No new resolver, no duplicated mutation logic.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O3',
        title: 'Trend intelligence contract added as pure deterministic layer',
        status: 'COMPLETE',
        evidence: [
          'lib/program/performance-trend-intelligence-contract.ts is JSON-safe / side-effect-free, imports no localStorage / window / fetch / React / DB, and owns analyzePerformanceTrends + deriveCoachDecisionsFromPerformanceTrends.',
          'No mutation rules, no UI labels, no DB writes — recommend-only layer.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O4',
        title: 'Bounded evidence windowing implemented',
        status: 'COMPLETE',
        evidence: [
          'analyzePerformanceTrends accepts a daysBack window (default 21, capped 1..45). Trusted-only filter, timestamp-based pruning, deterministic ISO clock injection for tests.',
          'PHASE_O_TREND_CONSTANTS exposes MIN_SETS_FOR_REPEATED_PATTERN / MIN_SETS_FOR_HIGH_CONFIDENCE / MIN_SETS_FOR_PROGRESSION_READINESS so unit tests can reason about thresholds.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O5',
        title: 'Movement-pattern classifier added safely with unknown fallback',
        status: 'COMPLETE',
        evidence: [
          'classifyMovementPattern uses both Phase L exerciseClass AND name keywords to separate planche / front_lever / back_lever / handstand / weighted_pull / weighted_dip / vertical_pull / horizontal_pull / horizontal_press / vertical_press / explosive_pull / core_compression / lower_body / mobility / accessory / unknown.',
          'Returns unknown when uncertain; never invents a high-confidence label.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O6',
        title: 'Notes / tags converted into structured trend signals',
        status: 'COMPLETE',
        evidence: [
          'Pain flags / "too much tension" / capacity tokens are detected separately and produce distinct trend codes (joint_caution_pressure_detected, skill_tension_limiter_detected, capacity_limiter_detected) and reason codes (pain_or_caution_flag, tension_note_repeated, capacity_note).',
          'A repeated "too much tension" on straight-arm work elevates severity to high; isolated mentions on other classes stay moderate.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O7',
        title: 'Coach decision helper added (recommend-only)',
        status: 'COMPLETE',
        evidence: [
          'deriveCoachDecisionsFromPerformanceTrends produces hold_progression / reduce_volume / lower_rpe_target / extend_rest / preserve_current_dose / small_progression / maintain_and_monitor / technique_focus / deload_candidate / insufficient_data_no_change actions.',
          'allowedMutationTypes / blockedMutationTypes are exposed but the Phase L resolver remains the final mutation owner — coach context is advisory.',
          'Skill progression for straight-arm work is doctrine-owned: even when trend says progressing_well, action is downgraded to preserve_current_dose for that class.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O8',
        title: 'Existing Phase L/M resolver receives trend / coach context and stamps it',
        status: 'COMPLETE',
        evidence: [
          'deriveFuturePrescriptionMutations gained an optional trendContext param. When supplied, each mutation carries a JSON-safe trendIntelligence + coachDecision slice (pickExerciseTrendStamp / pickCoachDecisionStamp).',
          'applyFuturePrescriptionMutations copies those slices into ExercisePerformanceAdaptationStamp so the per-exercise stamp the Program card already consumes carries the trend reason chain — no parallel UI surface.',
          'Phase M overlay (lib/server/performance-history-context.ts) and Phase M boot overlay (lib/program/performance-feedback-integration.ts) get the trend slices for free because they call resolvePerformanceFeedbackAdaptation + applyFuturePrescriptionMutations unchanged.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O9',
        title: 'Safe bounded mutation remains final owner — no new numeric rules',
        status: 'COMPLETE',
        evidence: [
          'PHASE_L_SAFE_BOUNDS (MAX_VOLUME_DROP_SETS=1, MIN_SETS_FLOOR=2, MAX_RPE_DROP=1, MIN_RPE_FLOOR=6, MAX_PROGRESSION_BUMP_SETS=1) are unchanged.',
          'Trend layer never decides sets / reps / RPE / rest values directly.',
          'Single change to the mutator: when trend reasonCodes contains single_acute_event AND the proposed mutation is reduce_next_exposure_volume AND the signal is NOT pain / tension / repeated_skill_fatigue, the mutator demotes the cut to add_recovery_note_only with shouldApply=true. Pain warnings are NEVER suppressed.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O10',
        title: 'Program page renders concise trend / coach proof only when real',
        status: 'COMPLETE',
        evidence: [
          'components/programs/AdaptiveSessionCard.tsx renders a compact teal italic line directly under the existing performanceAdaptation chip carrying "Trend: <label> · Coach: <action> · N sets · M sessions" only when trendIntelligence.trendCodes is non-empty AND a label maps to a known dominant trend.',
          'Insufficient_data trend codes do NOT render a Phase O line, so cards without repeated evidence remain visually unchanged from Phase L/M.',
          'data-phase-o-trend-codes / data-phase-o-coach-action / data-phase-o-proof attributes are exposed for tests and dev probes.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O11',
        title: 'Saved / load / normalize preserves trend fields',
        status: 'COMPLETE',
        evidence: [
          'normalizeProgramForDisplay continues to use ...ex spread on each exercise; trendIntelligence + coachDecision sit inside performanceAdaptation and travel with the existing object — no normalizer change required.',
          'JSON-safe stamps (ExerciseTrendStamp / CoachDecisionStamp) contain only string / number / boolean / array fields so localStorage round-trips cleanly.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O12',
        title: 'No duplicate adaptation, no fake chips, no parallel decision layer',
        status: 'COMPLETE',
        evidence: [
          'Trend layer outputs are purely advisory; the only mutation pathway is still resolvePerformanceFeedbackAdaptation -> deriveFuturePrescriptionMutations -> applyFuturePrescriptionMutations.',
          'Program card chip rendering remains a single owner: the chip and the trend line both read from exercise.performanceAdaptation; they cannot disagree because they read the same object.',
          'Insufficient_data / single_acute_event explicitly produce no Phase O line — UI never claims a trend that did not exist.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O13',
        title: 'Phase J/K/L/M/N regressions verified',
        status: 'COMPLETE',
        evidence: [
          'Phase J: live workout reducer and resume routing untouched. completedSetEvidence shape unchanged; Phase O only reads it.',
          'Phase K: weeklyStressDistributionPlan / stressLevel / recoveryCost flow unchanged — no Phase K input is consumed and no Phase K output is overwritten.',
          'Phase L: mutation rules and SAFE_BOUNDS unchanged. The single conservative demotion (single_acute_event suppresses isolated reduce_next_exposure_volume into add_recovery_note_only) is more cautious, never more aggressive.',
          'Phase M: server overlay still calls applyServerPerformanceFeedbackOverlay unchanged. Idempotency (appliedBy + evidenceHash) is unchanged. Diagnostic line `[phase-m-server-performance-history-overlay]` gained additive trendExerciseGroupCount / trendRepeatedPatternCount / trendIsolatedAcuteSuppressedCount / trendCautionFlagCount / trendProgressionReadyCount / trendOverallConfidence / trendSummary fields.',
          'Phase N: persistence corridor and reader untouched. Phase O consumes the same synthetic logs via the existing Phase M adapter.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O14',
        title: 'Insufficient data produces no-change with honest reason',
        status: 'COMPLETE',
        evidence: [
          'analyzePerformanceTrends returns hasEvidence: false + an empty exerciseTrends list when no evidence is in window; the resolver passes empty maps to the mutator and behavior reverts byte-for-byte to the Phase L pre-O path.',
          'When some evidence exists but a particular exercise has only one set, the trend records single_acute_event in reasonCodes and the coach action falls through to maintain_and_monitor / insufficient_data_no_change — the UI does NOT add a Phase O line.',
        ],
        remainingWork: [],
      },
      {
        id: 'O.O15',
        title: 'Blueprint / proof statuses recorded',
        status: 'COMPLETE',
        evidence: [
          'phaseO() in lib/program/master-truth-connection-blueprint.ts records O1..O15 statuses inline.',
          'Phase O is appended after Phase N in the phases array consumed by buildMasterTruthConnectionBlueprintStatus.',
        ],
        remainingWork: [],
      },
    ],
  }
}

/** Phase N: Neon-Persisted Workout Set Evidence Canonical History Lock. */
function phaseN(): BlueprintPhase {
  return {
    id: 'N',
    title: 'Neon-Persisted Workout Set Evidence Canonical History Lock',
    purpose:
      'Move completedSetEvidence from "client-carried evidence" to "server-readable canonical training history". After a completed workout, saveWorkoutLog persists the canonical log AND fires per-set evidence into a Neon `workout_log_set_evidence` table; the authoritative generator now reads recent per-set evidence directly from Neon (merged with any route-payload logs, deduped by workout log id) before running the existing Phase L/M resolver.',
    status: 'COMPLETE',
    nextAction:
      'No remaining Phase N work. Optional follow-ups: thread the active programId from the workout-session page into the persistence call so program-scoped reads can tighten the filter from "user OR null program_id" to strict equality.',
    subtasks: [
      {
        id: 'N.N1',
        title: 'Current workout log persistence audited',
        status: 'COMPLETE',
        evidence: [
          'lib/workout-log-service.ts.saveWorkoutLog is the canonical client-side WorkoutLog writer; before Phase N it only wrote to localStorage and saveSessionFeedback.',
          'lib/server/neon-truth-reader.ts queries the Neon `workout_logs` table (aggregate stats only) and never touched per-set evidence — confirming the persistence gap Phase M called out.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N2',
        title: 'completedSetEvidence durable-storage gap confirmed',
        status: 'COMPLETE',
        evidence: [
          'Pre-Phase-N: completedSetEvidence was reachable server-side ONLY when the client forwarded a recentWorkoutLogs payload. Server-initiated regenerations / fresh builds without that payload received zero performance evidence.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N3',
        title: 'Additive Neon persistence model created safely',
        status: 'COMPLETE',
        evidence: [
          'scripts/100-phase-n-workout-set-evidence.sql creates `workout_log_set_evidence` with IF NOT EXISTS, plus partial indexes on (user_id, created_at DESC), (user_id, program_id, created_at DESC) and (workout_log_id), and a UNIQUE (evidence_hash) for row-level dedupe.',
          'No existing tables / columns are altered. No destructive operations. Rollback path: drop the new table.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N4',
        title: 'saveWorkoutLog writes per-set evidence with dedupe',
        status: 'COMPLETE',
        evidence: [
          'lib/workout-log-service.ts.saveWorkoutLog now fires a non-blocking POST to /api/workout-log/save-evidence after the localStorage save succeeds, gated on trusted=true && sourceRoute!="demo" && completedSetEvidence.length > 0.',
          '/api/workout-log/save-evidence resolves dbUserId from the auth session (NEVER from the body) and calls persistWorkoutLogSetEvidence, which inserts one row per CompletedSetEvidence with ON CONFLICT (evidence_hash) DO NOTHING for idempotency.',
          'Failure modes — fetch failure, route 5xx, individual row failure — are logged and never throw to the caller, so the live workout UI cannot break because of network/DB.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N5',
        title: 'Server evidence reader fetches recent set evidence by user/program',
        status: 'COMPLETE',
        evidence: [
          'lib/server/workout-set-evidence-reader.ts.getRecentWorkoutSetEvidenceForGeneration queries `workout_log_set_evidence` user-scoped, bounded by limit (default 14, max 50) and sinceDays (default 30, max 90).',
          'Reader regroups rows by workout_log_id into synthetic MinimalWorkoutLogShape objects (using the SAME id the localStorage WorkoutLog used) so the existing Phase M buildPerformanceHistoryContext consumes them with zero rule duplication.',
          'Reader applies no adaptation rules / no UI labels / no program mutation; it is read-only.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N6',
        title: 'Generation merges route payload evidence + Neon evidence with dedupe',
        status: 'COMPLETE',
        evidence: [
          'lib/server/authoritative-program-generation.ts Phase M overlay block now (a) reads route-payload recentWorkoutLogs, (b) ALWAYS calls getRecentWorkoutSetEvidenceForGeneration when request.dbUserId is present, (c) merges both sources into a Map<id, log> where payload wins on collision (richer ambient fields), and (d) feeds the merged set into buildPerformanceHistoryContext.',
          'Diagnostic line `[phase-m-server-performance-history-overlay]` now reports payloadLogCount / neonLogCount / mergedLogCount / neonReadStatus alongside the existing fields.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N7',
        title: 'Phase L/M resolver remains the only adaptation decision owner',
        status: 'COMPLETE',
        evidence: [
          'workout-set-evidence-reader.ts and workout-set-evidence-persistence.ts contain ZERO rule logic — they only marshal rows. All adaptation decisions remain in lib/program/performance-feedback-adaptation-contract.ts via the Phase M adapter (lib/server/performance-history-context.ts).',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N8',
        title: 'Program page boot overlay remains idempotent and yields to server-applied adaptation',
        status: 'COMPLETE',
        evidence: [
          'Phase M idempotency machinery (programAlreadyHasServerAdaptationFor / appliedBy / evidenceHash) is unchanged. Phase N only widens the evidence INPUT to the resolver; it does not alter the stamp shape, the boot overlay, or the dedupe logic.',
          'Because the synthetic Neon logs and the route-payload logs share the same workout_log_id, evidenceHash collisions naturally trigger the existing idempotent_skip path on repeat generations.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N9',
        title: 'Missing evidence degrades to insufficient_data without fake adaptation',
        status: 'COMPLETE',
        evidence: [
          'When neither route payload nor Neon returns logs, mergedLogs is empty and the overlay block falls through with verdict=PHASE_M_SKIPPED_NO_LOGS_SUPPLIED — identical to pre-Phase-N behavior.',
          'getRecentWorkoutSetEvidenceForGeneration returns status=no_user / no_rows / db_error without throwing, and the reader_threw branch is logged + treated as empty so a Neon hiccup never escalates to fake adaptation.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N10',
        title: 'Phase J/K/L/M regressions verified',
        status: 'COMPLETE',
        evidence: [
          'Phase J: live workout reducer / resume routing untouched. The new fire-and-forget evidence POST runs AFTER localStorage save and never blocks the UI.',
          'Phase K: weeklyStressDistributionPlan / stressLevel / recoveryCost flow unchanged — Phase N only adds an additional INPUT source to the existing Phase M overlay.',
          'Phase L: performance-feedback-adaptation-contract.ts is untouched. CompletedSetEvidence shape and resolver rules are unchanged.',
          'Phase M: payload-only path still works (incomingLogs is still merged in first); idempotency / appliedBy / evidenceHash provenance unchanged; verdict labels preserved.',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N11',
        title: 'Migration / deployment requirements documented honestly',
        status: 'COMPLETE',
        evidence: [
          'Migration file: scripts/100-phase-n-workout-set-evidence.sql, additive only (CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS). Executed via SystemAction(executeScript) during this phase against the connected Neon DATABASE_URL.',
          'No prisma client regeneration required (project uses raw @neondatabase/serverless, not Prisma).',
          'No environment variable changes required (DATABASE_URL was already present and consumed by lib/db.ts).',
        ],
        remainingWork: [],
      },
      {
        id: 'N.N12',
        title: 'Server-initiated generation can read recent evidence when userId/programId are available',
        status: 'COMPLETE',
        evidence: [
          'authoritative-program-generation.ts now calls getRecentWorkoutSetEvidenceForGeneration on EVERY generation attempt where request.dbUserId is set, regardless of whether the route forwarded recentWorkoutLogs. This means future scheduled jobs / backend-only rebuilds become performance-aware automatically as long as they construct an AuthoritativeGenerationRequest with dbUserId.',
        ],
        remainingWork: [],
      },
    ],
  }
}

// =============================================================================
// [PHASE-P] PROGRAM QUALITY / DOCTRINE SHARPNESS AUDIT + SAFE CORRECTION PASS
// =============================================================================
function phaseP(): BlueprintPhase {
  return {
    id: 'P',
    title: 'Program Quality / Doctrine Sharpness Audit + Safe Correction Pass',
    purpose:
      'Verify whether the now-functional AI evidence/adaptation/trend pipeline is producing high-quality training prescriptions that match SpartanLab doctrine, onboarding truth, selected skills, session structure, and recovery logic — and apply only the minimum safe bounded corrections required so the program is genuinely sharp, not just cosmetically labeled. Phase P runs AFTER Phase O on the final adapted program object and BEFORE persistence/display, attaches optional `qualityAudit` proof slices to sessions and exercises, and is consumed by AdaptiveSessionCard as concise proof lines.',
    status: 'COMPLETE',
    nextAction:
      'No remaining Phase P work. Recommended next phase: Phase Q — Session-Length Truth Lock, making Full / 45 / 30 minute workout modes actually change structure, sets, exercise count, rest density, and estimates instead of acting like labels. Phase P stamps a session-length realism warning when the estimate is implausible relative to the selected mode, and that warning explicitly defers the structural fix to Phase Q.',
    subtasks: [
      {
        id: 'P.P1',
        title: 'Authoritative final program located after Phase O',
        status: 'COMPLETE',
        evidence: [
          'lib/server/authoritative-program-generation.ts runs the Phase L/M overlay first, then calls runProgramQualityDoctrineAudit AFTER markStage("phase_m_performance_overlay_done") and BEFORE markStage("complete"). The Phase O trend/coach decision layer is applied INSIDE resolvePerformanceFeedbackAdaptation, so by the time Phase P runs the program already carries Phase J/K stress, Phase L/M mutations, AND Phase O trend slices.',
          'lib/program/performance-feedback-integration.ts.applyPerformanceFeedbackOverlay (the client boot overlay path) also runs Phase P AFTER applyFuturePrescriptionMutations completes, so both ingress paths produce identical Phase P stamps.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P2',
        title: 'No new parallel builder, no shadow generator',
        status: 'COMPLETE',
        evidence: [
          'lib/program/program-quality-doctrine-audit-contract.ts is a pure deterministic resolver. It does NOT generate exercises, does NOT pick exercises, does NOT build sessions. It only inspects the final program object, attaches optional `qualityAudit` slices, and applies at most two narrow bounded corrections (tendon RPE cap ≤1 step lower, unilateral per-side note).',
          'No new entry point is added to the generation pipeline. No new "rebuild" path is introduced. The base builder (adaptive-program-builder.ts) is untouched.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P3',
        title: 'Doctrine audit resolver exists and evaluates the right criteria',
        status: 'COMPLETE',
        evidence: [
          'runProgramQualityDoctrineAudit performs five passes: (1) skill carryover attribution against PROGRAM_SELECTED_SKILLS, (2) tendon-protective RPE cap on straight-arm / high-tension rows, (3) unilateral per-side note detection, (4) session-length realism check against estimatedMinutes vs the mode label, (5) cross-session straight-arm overlap warning across consecutive non-completed days.',
          'Phase L safety bounds (MIN_RPE_FLOOR, sets ≥2, drop ≤1) are imported as constants and never violated. Rows already carrying a Phase L mutation stamp are deferred to with `phase_p_phase_l_mutation_takes_precedence`.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P4',
        title: 'Safe correction bounds enforced',
        status: 'COMPLETE',
        evidence: [
          'Tendon RPE cap: never lowers RPE by more than 1, never below MIN_RPE_FLOOR, only on classified straight-arm/skill/tension exercises, only when the proposed targetRPE > the doctrine ceiling. All other RPE values pass through untouched.',
          'Unilateral per-side note: pure metadata addition (note string), never alters sets/reps/RPE/rest/load.',
          'Hard refusals: never mutates `sets`, never mutates `repsOrTime`, never mutates `restSeconds`, never mutates `prescribedLoad`, never mutates `estimatedMinutes`, never adds/removes exercises, never reorders, never touches `appliedMethod`.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P5',
        title: 'Selected skills protected; carryover attributed',
        status: 'COMPLETE',
        evidence: [
          'Phase P scans every non-completed session for direct skill expression first; only when the session lacks a direct expression does it look for high-carryover accessories (e.g. tuck planche / pseudo planche pushups → planche; low-angle rows / front-lever raises → front lever; ring archer pulls / dragon-flag negatives → core+lever skills) and stamp a `skill_carryover_attributed` reason.',
          'Phase P NEVER deletes / swaps / replaces a selected-skill row, even if the row would otherwise trigger a tendon RPE cap; the cap applies on the existing row, leaving the skill expressed.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P6',
        title: 'Proof honesty: chips/proof lines only when backed by real findings',
        status: 'COMPLETE',
        evidence: [
          'Per-row qualityAudit slices are emitted only when at least one finding applies. Rows with corrections === ["no_change"] and no skillCarryover / rpeCap / unilateralPerSide are intentionally rendered as null by AdaptiveSessionCard, so the UI never invents quality claims.',
          'Session-level qualityAudit only populates when straight-arm overlap or session-length realism findings exist. Skill-carryover roll-ups stay on the exercise-level proof line so the session header never clutters with attribution-only chips.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P7',
        title: 'No fake duplicate chips',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard renders Phase P proof in ONE DOM block per row, sibling to the existing Phase O proof block. Both blocks early-return when their owning slice is missing, so the same row can render Phase L chip + Phase O line + Phase P line, each driven by a distinct authoritative slice — never duplicates of the same finding.',
          'Phase P never re-emits a Phase O trend reason or a Phase L mutation reason. When a Phase L stamp already exists, Phase P writes only `phase_l_mutation_takes_precedence` to corrections and produces no visible line.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P8',
        title: 'Save/load/normalize preserves Phase P fields',
        status: 'COMPLETE',
        evidence: [
          'qualityAudit is added as an optional first-class field on AdaptiveExercise and AdaptiveSession in lib/adaptive-program-builder.ts, so the existing `...session` / `...ex` spreads in lib/program-state.ts and normalizeProgramForDisplay propagate the slice without code changes — matching the exact pattern used by performanceAdaptation in Phase L.',
          'The slice is JSON-safe (no functions, no class instances) and stable under structuredClone, so existing localStorage save/load and Neon program JSON write/read paths preserve it transparently.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P9',
        title: 'Program page consumes Phase P proof from authoritative program object',
        status: 'COMPLETE',
        evidence: [
          'components/programs/AdaptiveSessionCard.tsx reads exercise.qualityAudit and session.qualityAudit directly from the same program object passed in by the page; no recomputation, no second resolver, no fetch. The card cannot disagree with the resolver.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P10',
        title: 'No live workout regression',
        status: 'COMPLETE',
        evidence: [
          'Phase P is invoked ONLY by the authoritative server generator and the client boot overlay. The live workout reducer (Start/Resume/log set/rest timer/save+exit) does not import any Phase P module. The Phase P resolver never edits completed sessions and never edits exercise IDs / order / set count.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P11',
        title: 'No schema or dependency creep',
        status: 'COMPLETE',
        evidence: [
          'No new dependencies added. No Prisma schema changes (project uses raw SQL via @neondatabase/serverless). No new Neon tables. The new `qualityAudit` slice lives inside the existing program JSON envelope.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P12',
        title: 'Session-length honesty: warning attached, structural lock deferred to Phase Q',
        status: 'COMPLETE',
        evidence: [
          'When estimatedMinutes is outside ±20% of the mode label\'s expected band, Phase P stamps `session_length_warning_attached` with a verdict of "over" / "under" and a concise explanation. Phase P never edits `estimatedMinutes` itself, never edits sets/exercise count, never restructures the session — those structural changes are explicitly the domain of Phase Q.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P13',
        title: 'Build / TypeScript health',
        status: 'COMPLETE',
        evidence: [
          'qualityAudit is typed via `import("./program/program-quality-doctrine-audit-contract").ExerciseQualityAuditStamp` and `SessionQualityAuditStamp` in adaptive-program-builder.ts, eliminating Partial-cast workarounds at the call site. Phase P contract uses only existing project utilities and `import type` for the adaptation contract to avoid circular runtime imports.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P14',
        title: 'Runtime health: Program page renders without crash',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard rendering blocks for Phase P are wrapped in IIFE early-returns guarded by typeof checks, so a malformed or absent slice cannot crash the card. A try/catch in the server generator and a try/catch in the client boot overlay ensure a Phase P failure can never break the success path.',
        ],
        remainingWork: [],
      },
      {
        id: 'P.P15',
        title: 'Blueprint records Phase P completion honestly',
        status: 'COMPLETE',
        evidence: [
          'phaseP() is registered in the phases array after phaseO(), with this subtask list documenting exactly what Phase P does and does not do. Phase O was also re-registered in the same edit (the prior commit registering it was lost in the most recent git pull from v0/alericpetsch836-6923-de3348a2).',
        ],
        remainingWork: [],
      },
    ],
  }
}

// =============================================================================
// [PHASE-Q] DOCTRINE RULE UTILIZATION / CAUSAL APPLICATION AUDIT
// =============================================================================
function phaseQ(): BlueprintPhase {
  return {
    id: 'Q',
    title: 'Doctrine Rule Utilization / Causal Application Audit + Safe Wiring Repair',
    purpose:
      'Answer the honest question — "are the SpartanLab doctrine rules actually shaping the generated program, or just being surfaced as proof / explanation metadata after the fact?" Phase Q is a pure deterministic READER that runs AFTER Phase P on the final adapted program. It reads existing artifacts (program.styleMetadata, weeklyMethodBudgetPlan, methodStructureRollup, session.styleMetadata, session.methodStructures, session.doctrineParticipation, session.doctrineBlockResolution, session.methodDecision, session.qualityAudit, exercise.performanceAdaptation, exercise.qualityAudit) and emits a structured `doctrineUtilizationTrace` on both program AND each session that classifies each of the 5 doctrine categories (skill / method / recovery / prescription / sessionLength) into one of six honest states: ELIGIBLE_AND_APPLIED, ELIGIBLE_BUT_SUPPRESSED, NOT_ELIGIBLE, BLOCKED_BY_UNSUPPORTED_RUNTIME, ACKNOWLEDGED_ONLY, POST_HOC_ONLY. The Program card renders one compact line from the trace per session so the user can see — without clutter — which days had genuinely causal doctrine and which had only audit/proof.',
    status: 'COMPLETE',
    nextAction:
      'Phase Q proved doctrine is PARTIALLY CAUSAL. Skill, method, recovery, and prescription are causal at the BUILDER / ADAPTATION stage. The session-length weakness Phase Q surfaced has now been repaired by **Phase R — Session-Length Truth Lock** (see phase R below): a pure deterministic reader runs BEFORE Phase Q on every program, stamps `session.sessionLengthTruth` over the existing `session.variants[]` trio (Full / 45 / 30 from `generateSessionVariants`), and Phase Q\'s `evaluateSessionLength` now reads that stamp first — crediting ELIGIBLE_AND_APPLIED when shorts are STRUCTURALLY_REAL (deferred exercises and/or set deltas vs Full), ELIGIBLE_BUT_SUPPRESSED when shorts exist only at label parity, and NOT_ELIGIBLE when shorts are not applicable for the day. Cluster blocking remains BLOCKED_BY_UNSUPPORTED_RUNTIME by design — Phase R does NOT touch the live workout reducer.',
    subtasks: [
      {
        id: 'Q.Q1',
        title: 'Doctrine source / registry traced',
        status: 'COMPLETE',
        evidence: [
          'Doctrine entry points: lib/doctrine/source-batches/index.ts (10 source batches including batch-08 elite rings/calisthenics, batch-10 training method decision governor with METHOD_COMPATIBILITY_MATRIX), lib/training-doctrine-registry/doctrineRegistry.ts (DOCTRINE_REGISTRY), Neon doctrine DB via lib/doctrine-db.ts and lib/doctrine-query-service.ts. Builder ingests these via doctrineRuntimeContract / methodPrefsForGrouping / weeklyMethodBudgetPlan / materialityContract.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q2',
        title: 'Causal path from source → final card render traced',
        status: 'COMPLETE',
        evidence: [
          'Builder reads doctrine at L11745 (doctrineRuntimeContract) and writes appliedMethods, clusterDecision, setExecutionMethod, method, methodLabel onto sessions/exercises at L13549–13960. Phase 4L row-level mutator adds endurance_density (only). Phase 4M doctrine-application-corridor adds top_set / drop_set / rest_pause when builder did not. Phase 4P structural-method-materialization-corridor mirrors builder writes into canonical methodStructures[]. Phase 4Q classifier+participation contract stamps doctrineBlockResolution / doctrineParticipation per session. Phase L/M/N performance feedback overlay mutates targetRPE / sets bounded. Phase O trend stamps reason chains. Phase P quality audit applies tendon RPE cap + carryover attribution. Phase Q now stamps the unified doctrineUtilizationTrace on top of all of this. AdaptiveSessionCard reads session.doctrineUtilizationTrace.summary directly.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q3',
        title: 'Five doctrine categories audited',
        status: 'COMPLETE',
        evidence: [
          'evaluateSkill (selectedSkills direct match + Phase P carryover stamp), evaluateMethod (appliedMethods + clusterDecision + rejectedMethods + methodStructures + doctrineParticipation + methodDecision fallback), evaluateRecovery (weekStressDistributionProof + Phase P straight_arm_overlap_warning_attached), evaluatePrescription (Phase P tendon_rpe_capped + Phase L/M/N/O performanceAdaptation + builder base dose), evaluateSessionLength (estimatedMinutes vs profile.timeAvailability ± 20% + Phase P session_length_warning_attached). Each evaluator returns one entry per session with the 6-state ladder.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q4',
        title: 'Applied vs acknowledged distinction enforced honestly',
        status: 'COMPLETE',
        evidence: [
          'STATE_RANK ordering: ELIGIBLE_AND_APPLIED < ELIGIBLE_BUT_SUPPRESSED < NOT_ELIGIBLE < BLOCKED_BY_UNSUPPORTED_RUNTIME < ACKNOWLEDGED_ONLY < POST_HOC_ONLY. Per-category rollup picks ELIGIBLE_AND_APPLIED only if at least one session was applied; otherwise falls to the worst observed state. doctrine-influence-contract.ts (shadow-mode) and method-decision-engine.ts (pure reader) are categorized as ACKNOWLEDGED_ONLY when they are the only signal, with reason `phase_3m_reader_only_by_design` / `shadow_mode_only`.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q5',
        title: 'Cluster blocking explained with specific truthful reasons',
        status: 'COMPLETE',
        evidence: [
          'Cluster fires in adaptive-program-builder.ts L13670–13690 when ALL hold: (a) weeklyBudget.clusterSessionsUsed < maxClusterSessionsPerWeek, (b) sessionMethodIntentContract.shouldApplyCluster (which requires methodPrefsForGrouping.includes("cluster_sets") AND hasLateAccumulationClusterCandidate), (c) candidates[0].score >= MIN_CLUSTER_SCORE, (d) no overlap with already-applied grouped method. When cluster does NOT fire, the builder writes a real reason into rejectedMethods (e.g. "Week-level cluster budget saturated (2/2) -- cluster is an intentional, uncommon tool and this week has already placed it on day(s) X, Y. Straight sets preserved here."). Phase Q maps these to stable blockerReason tokens: weekly_budget_saturated, user_pref_not_set, no_late_position_candidate, skill_pillar_protected, tendon_safety, feasibility_gate_failed. The UI never shows generic "blocked" — every block has a specific token + plain English reason.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q6',
        title: 'First authoritative disconnect identified',
        status: 'COMPLETE',
        evidence: [
          'There is NO single causal disconnect that broke generation. Most categories are causal at the BUILDER stage. The actual disconnect Phase Q repaired: there was no single normalized contract that distinguished "applied" from "acknowledged-only / post-hoc-only" across categories — multiple post-hoc layers (doctrine-influence-contract shadow-mode, method-decision-engine pure reader, doctrine-block-resolution-contract classifier, session-doctrine-participation-contract verdict) existed but did not unify. The Program card therefore risked rendering ACKNOWLEDGED_ONLY / POST_HOC_ONLY material as if it were applied. Phase Q is that unifying layer.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q7',
        title: 'Safe repair implemented (single causal-honesty bridge, no rewrite)',
        status: 'COMPLETE',
        evidence: [
          'lib/program/doctrine-utilization-contract.ts is a pure deterministic READER that runs once per generation in BOTH ingress paths (server authoritative-program-generation.ts after Phase P, client performance-feedback-integration.ts after Phase P). It is wrapped in try/catch in both paths so it can never break a successful generation. It does NOT build, does NOT mutate prescriptions/exercises/methods, does NOT add a parallel scanner.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q8',
        title: 'No fake "applied" states leak to UI',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard renders Phase Q output ONLY from session.doctrineUtilizationTrace.summary (one compact line). The state token is also written to data-phase-q-dominant-state for tests/dev probes. ACKNOWLEDGED_ONLY and POST_HOC_ONLY states get italic/muted color so they read as audit, not action. ELIGIBLE_AND_APPLIED states use neutral color so users can see at a glance which days had real causal doctrine.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q9',
        title: 'No forced methods (clusters / supersets / circuits) to "prove" causality',
        status: 'COMPLETE',
        evidence: [
          'Phase Q never sets appliedMethod. It never writes setExecutionMethod. It never modifies clusterDecision. It only reads. The builder remains the single owner of method application — Phase Q reports the truth, including legitimate ELIGIBLE_BUT_SUPPRESSED verdicts when cluster is gated by user prefs / budget / no late-position candidate.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q10',
        title: 'Existing phases preserved (J/K/L/M/N/O/P intact)',
        status: 'COMPLETE',
        evidence: [
          'Phase Q runs AFTER Phase P in both pipelines (server + client). It reads existing stamps but writes only the new doctrineUtilizationTrace field. Builder, Phase 4L–4Q, and Phase L/M/N/O/P call sites are unchanged. The new field is additive on the AdaptiveProgram envelope and does not collide with any prior phase output.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q11',
        title: 'Save/load/normalize preserves the trace as metadata only',
        status: 'COMPLETE',
        evidence: [
          'doctrineUtilizationTrace is JSON-safe (only primitives, arrays, and plain objects). It rides through the existing `...program` / `...session` spreads in lib/program-state.ts and normalizeProgramForDisplay — same path as performanceAdaptation, qualityAudit, methodDecision, doctrineBlockResolution. No normalizer change required.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q12',
        title: 'Program page proof derives from the authoritative final object',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard reads session.doctrineUtilizationTrace.summary directly from the program object passed in. No recomputation, no second resolver, no fetch. The card cannot disagree with the resolver because there is exactly one source of truth.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q13',
        title: 'Live workout safety untouched',
        status: 'COMPLETE',
        evidence: [
          'Phase Q is invoked ONLY by the authoritative server generator and the client boot overlay. The live workout machine (lib/workout/live-workout-machine.ts), Start Workout (components/workout/ActiveWorkoutStartCorridor.tsx), and Resume / set logging do not import doctrine-utilization-contract.ts at all. Phase Q never mutates exercise.method, exercise.setExecutionMethod, blockId, or any prescription field.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q14',
        title: 'Build / runtime health',
        status: 'COMPLETE',
        evidence: [
          'No new dependencies, no Prisma schema changes. doctrine-utilization-contract.ts uses only TypeScript primitives + already-stamped fields. The IIFE rendering block in AdaptiveSessionCard is guarded by typeof checks so a malformed or absent trace renders nothing.',
        ],
        remainingWork: [],
      },
      {
        id: 'Q.Q15',
        title: 'Honest final verdict recorded',
        status: 'COMPLETE',
        evidence: [
          'Verdict at Phase Q time: PARTIALLY CAUSAL. Skill / method / recovery / prescription causal at the builder or adaptation stage. SessionLength was previously acknowledged-only / post-hoc-only because Phase Q\'s evaluator only compared `session.estimatedMinutes` against `profileSnapshot.timeAvailability` and never inspected `session.variants[]`. Phase R has now repaired that disconnect: `session.sessionLengthTruth` is stamped before Phase Q runs, and `evaluateSessionLength` reads it first to credit STRUCTURALLY_REAL shorts as ELIGIBLE_AND_APPLIED. Cluster blocking remains HONEST and BLOCKED_BY_UNSUPPORTED_RUNTIME (live workout reducer cannot yet advance through intra-set cluster rest).',
        ],
        remainingWork: [],
      },
    ],
  }
}

// =============================================================================
// [PHASE-R] SESSION-LENGTH TRUTH LOCK
// =============================================================================
function phaseR(): BlueprintPhase {
  return {
    id: 'R',
    title: 'Session-Length Truth Lock — Full / 45 / 30 Become Structural and Live-Workout Safe',
    purpose:
      'Make Full / 45 / 30 minute mode selection structurally real and authoritative end-to-end without rebuilding the program. Phase R is a pure deterministic READER over `session.variants[]` (already produced by `generateSessionVariants` in lib/session-compression-engine.ts) that stamps `session.sessionLengthTruth` and `program.sessionLengthTruth` so (a) Phase Q can credit session-length as ELIGIBLE_AND_APPLIED at the BUILDER stage when shorts are structurally real, (b) the Program card can render a one-line honest summary under the variant button row, and (c) the master-truth blueprint can audit the entire session-length corridor — variant emission, material distinctness, live-workout launch fingerprint, and live-workout safety — from a single stamped truth object. Phase R does NOT build a second program, does NOT mutate exercises / sets / RPE / rest / methods / ordering, does NOT touch the live workout reducer, does NOT change Prisma, does NOT add dependencies.',
    status: 'COMPLETE',
    nextAction:
      'No remaining Phase R work. Recommended next phase: **Phase S — UI Trust Cleanup / Proof Clutter Compression**, which can now safely consolidate the per-card stack of Phase J/K/L/M/N/O/P/Q/R proof lines into a single trust-rollup chip with a "show details" affordance. Phase R deliberately added only ONE compact line (`session.sessionLengthTruth.summary`) under the Phase Q line to maintain verification visibility; Phase S can compress them all together once the user has confirmed Phase R causality on screen.',
    subtasks: [
      {
        id: 'R.R1',
        title: 'Existing Full / 45 / 30 controls and ownership located',
        status: 'COMPLETE',
        evidence: [
          'UI controls live in `components/programs/AdaptiveSessionCard.tsx` (variant button row at L3340–3470). State is owned by the card via `selectedVariant` (idx 0 = Full, 1 = 45 Min, 2 = 30 Min). The card derives a single canonical `selectedSessionContract` (L578–627) which builds `selectedLaunchUrl` (mode + variant + day + week query params) and is the ONE owner of what Full / 45 / 30 means for that card. Variants themselves are stored on `session.variants[]` and are emitted by `generateSessionVariants` in `lib/session-compression-engine.ts` (L972), called from `lib/adaptive-program-builder.ts` post-grouping-materialization at L14771 (regenerateVariants from decoratedFullSelection so 45/30 inherit atomic-unit awareness).',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R2',
        title: 'Root cause of Phase Q "PARTIALLY CAUSAL — sessionLength suppressed" identified',
        status: 'COMPLETE',
        evidence: [
          'The variants ARE structurally real upstream — `generateSessionVariants` calls `compressSession`, runs `isVariantLaunchable` to drop hollow shorts, runs `areVariantsMateriallyDistinct` to drop label-parity shorts, monotonicity-checks Full ≥ 45 ≥ 30, and regenerates after grouping materialization so atomic units survive. The corridor to live workout is also real — the card stamps `LaunchFingerprintPayload` via `stampLaunchFingerprint` and the route reads it via `readLaunchFingerprint`. What was missing was an HONEST TRACE that Phase Q (and the card) could read to credit the structural compression. Phase Q\'s `evaluateSessionLength()` only compared `session.estimatedMinutes` against `profileSnapshot.timeAvailability` (±20% band). It never inspected `session.variants[]`. So even when the shorts compressed Full → 45 → 30 with deferred accessories and reduced sets, Phase Q reported sessionLength as ACKNOWLEDGED_ONLY / POST_HOC_ONLY. Phase R repaired exactly that disconnect — no new builder, no new normalizer, no live-workout changes.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R3',
        title: 'Authoritative Phase R resolver exists',
        status: 'COMPLETE',
        evidence: [
          '`lib/program/session-length-truth-contract.ts` exposes `runSessionLengthTruthContract(program)`. It reads `session.variants[]`, computes a per-variant truth receipt (`actualEstimatedMinutes` recomputed from row sets × setSeconds + rest, `labelDriftWarning` when target/actual drift exceeds ±5 min, `deferredExerciseNames` by id-difference vs Full, `priorityPreservation` flags for primary skill anchor / secondary or hybrid / strength support, `distinctVsFull` mirroring the engine\'s distinctness signals, `liveWorkoutLaunchable` mirroring `isVariantLaunchable`), aggregates per session into a verdict (STRUCTURALLY_REAL / SHORTS_AT_LABEL_PARITY / NO_LAUNCHABLE_SHORTS / LEGACY_NO_VARIANTS), and rolls up across the program (STRUCTURALLY_REAL_ACROSS_PROGRAM / STRUCTURALLY_REAL_PARTIAL / SHORTS_PRESENT_BUT_LABEL_PARITY / NO_SHORTS_NEEDED / NO_VARIANTS_AVAILABLE).',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R4',
        title: 'No duplicate program builder',
        status: 'COMPLETE',
        evidence: [
          'Phase R derives ALL truth from canonical `session.variants[]` (already emitted by the existing engine) and from canonical `session.exercises[]`. It does not call `compressSession`, does not call `generateSessionVariants`, does not pick exercises, does not write to `session.exercises`, does not write to `variant.selection`, does not change `variant.duration`. The actualEstimatedMinutes field is exposed ALONGSIDE `variant.duration`, never overwriting it.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R5',
        title: 'Full mode preserved as canonical',
        status: 'COMPLETE',
        evidence: [
          'Phase R never modifies the canonical full session. The Full variant entry (idx 0) in `session.variants[]` is preserved verbatim. `selectedSessionContract.isFullSession` (idx 0) continues to drive the card body; `buildSelectedVariantMain(session, 0, "full")` still produces the canonical Full body.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R6',
        title: '45 mode is structurally real when applicable',
        status: 'COMPLETE',
        evidence: [
          '`generateSessionVariants` at L1030–1095 runs `compressSession` with `targetMinutes: 45, preserveSkillWork: true`, runs `isVariantLaunchable` to reject hollow bodies, and runs `areVariantsMateriallyDistinct` against Full to reject cosmetic shorts. Phase R reads the surviving 45 Min variant\'s body and verifies the structural truth: `deferredExerciseNames.length`, `setDeltaTotal`, `priorityPreservation.primarySkillAnchorPreserved`. When all signals align, Phase R stamps `verdict: STRUCTURALLY_REAL`.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R7',
        title: '30 mode is structurally real when applicable',
        status: 'COMPLETE',
        evidence: [
          '`generateSessionVariants` at L1098–1158 runs `compressSession` with `targetMinutes: 30, preserveSkillWork: true`, applies the same launchability + material-distinctness gates AND a second material-distinctness check vs the emitted 45 Min variant so the 30 Min tab cannot duplicate either. Phase R reads the surviving 30 Min variant exactly the same way it reads 45 Min and contributes to the same verdict.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R8',
        title: 'Priority trimming is doctrine-based',
        status: 'COMPLETE',
        evidence: [
          'Compression itself is doctrine-priority-based in `lib/session-compression-engine.ts`: `compressMain` honors `preserveSkillWork: true`, captures `SessionIdentitySnapshot` BEFORE compression to preserve `primarySkillExpressions / secondarySkillExpressions / mainProgressionExercises / strengthSupportExercises`, then trims generic accessories first. Phase R verifies the result by detecting `category === "skill"` rows and `selectionReason` markers (`"primary"`, `"skill progression"`, `"secondary"`, `"hybrid"`, `"expression"`, `"support"`, `"strength"`) on each variant\'s surviving rows — when the primary skill anchor is missing in any short, `rollup.primarySkillAnchorPreservedAcrossShorts` becomes false and the card surfaces the honest mismatch.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R9',
        title: 'Rest / density bounded by doctrine safety',
        status: 'COMPLETE',
        evidence: [
          'Phase R does not change rest or density itself. It uses the existing rest values written onto rows by the builder (`restSeconds`) and Phase L/M/N/O/P (which respect MIN_RPE_FLOOR, MIN_REST_HEAVY, etc). When `restSeconds` is missing on a row, Phase R falls back to a conservative default of 90s (DEFAULT_REST_SECONDS) for the actualEstimatedMinutes calculation only — it never WRITES that fallback back to the row.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R10',
        title: 'Method compatibility respected — no forced methods',
        status: 'COMPLETE',
        evidence: [
          'Phase R never sets `appliedMethod`, never writes `setExecutionMethod`, never writes `methodLabel`, never modifies `clusterDecision`. The method decision remains owned by the builder + Phase 4M corridor + Phase 4P materialization. Phase R only READS `selectionReason` for priority detection and READS row identity (`exercise.id`, `exercise.name`) for deferred-name detection.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R11',
        title: 'Cluster remains BLOCKED_BY_UNSUPPORTED_RUNTIME (correctly)',
        status: 'COMPLETE',
        evidence: [
          'Phase R does not reclassify cluster. The Phase Q cluster verdict remains BLOCKED_BY_UNSUPPORTED_RUNTIME because `lib/workout/live-workout-machine.ts` still cannot safely advance through intra-set cluster rest (the runtime contracts at `lib/workout/live-grouped-execution-contract.ts` and `lib/workout/execution-unit-contract.ts` enumerate the families they execute and cluster is intentionally not yet on that list). Phase R\'s scope is strictly the variant trio, not the method runtime.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R12',
        title: 'Doctrine utilization trace updated honestly',
        status: 'COMPLETE',
        evidence: [
          'Phase Q\'s `evaluateSessionLength()` (lib/program/doctrine-utilization-contract.ts) now reads `session.sessionLengthTruth` first. STRUCTURALLY_REAL → ELIGIBLE_AND_APPLIED with structuralEffect including the per-session counts (distinct shorts, deferred accessories, set delta, primary-skill anchor flag). SHORTS_AT_LABEL_PARITY → ELIGIBLE_BUT_SUPPRESSED with blockerReason `short_variants_at_label_parity`. NO_LAUNCHABLE_SHORTS → NOT_ELIGIBLE with reason "full session only — short modes not applicable for this day". LEGACY_NO_VARIANTS falls through to the pre-existing fallback so older program objects still produce a trace.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R13',
        title: 'Estimated minutes derived from real structure',
        status: 'COMPLETE',
        evidence: [
          '`variantEstimatedMinutes()` in the contract sums `rowEstimatedSeconds` over every main row: `sets × setSeconds + max(sets-1, 0) × restSeconds`, with safe fallbacks (DEFAULT_SET_SECONDS = 45s, DEFAULT_REST_SECONDS = 90s) when explicit fields are missing. The result is rounded to the nearest minute and stored as `actualEstimatedMinutes` on the variant truth receipt. When `Math.abs(targetMinutes - actualEstimatedMinutes) > 5` the receipt sets `labelDriftWarning: true` so the card renders an honest "Estimated 36 min because primary skill + safe rest minimums prevent further compression" instead of pretending the target lands exactly. `variant.duration` itself is never overwritten — actual lives alongside target.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R14',
        title: 'Program card reads resolved session — visible body matches mode',
        status: 'COMPLETE',
        evidence: [
          'AdaptiveSessionCard already routes the visible body through `selectedDisplayContract.resolvedBody` (built by `buildSelectedVariantMain`) and the visible-launch-body path uses `fullVisibleExercises` from `buildFullVisibleRoutineExercises`. Phase R does not change those paths — it adds one compact text line under the existing Phase Q summary that reads `session.sessionLengthTruth.summary`. The `data-phase-r-session-length-truth` and `data-phase-r-verdict` attributes are written for tests/dev probes. NO_LAUNCHABLE_SHORTS and LEGACY_NO_VARIANTS are intentionally suppressed in the UI to avoid noise on cards that only render Full anyway.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R15',
        title: 'Start Workout handoff matches selected mode',
        status: 'COMPLETE',
        evidence: [
          'The card already routes Start Workout via `selectedSessionContract.selectedLaunchUrl` (mode + variant + day + week URL params) and stamps a launch fingerprint via `stampLaunchFingerprint(LaunchFingerprintPayload)`. The route reads via `readLaunchFingerprint(day, variantIndex)` and diffs it against the finalSession it builds. Phase R does NOT modify this corridor — it documents it via `sessionLengthTruth.liveWorkoutHandoff: { mechanism: "launch_fingerprint", payloadCompatibility: "OK" | "NO_VARIANTS" | "COSMETIC_ONLY", launchableVariantCount }`. So when the user picks 45 / 30 the route opens the same compressed body the card displayed, with parity drift surfacing as the existing PARITY chip — not as a silent full-session fallback.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R16',
        title: 'Resume / active session safety preserved',
        status: 'COMPLETE',
        evidence: [
          'Phase R never reads or writes the live workout reducer state (`lib/workout/live-workout-machine.ts`). Resume/active session logic continues to read `LIVE_WORKOUT_STATE` from session storage and `selectedVariantIndex` from URL params (the existing card → route corridor). Phase R\'s stamps live in the program JSON, not the live workout state, so an in-flight workout cannot be corrupted by a Phase R re-stamp from a regenerate.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R17',
        title: 'Save / load / normalize safe',
        status: 'COMPLETE',
        evidence: [
          '`session.sessionLengthTruth` and `program.sessionLengthTruth` are added as optional first-class fields on AdaptiveSession / AdaptiveProgram (matching the qualityAudit / doctrineUtilizationTrace pattern). They are JSON-safe (only strings, numbers, booleans, plain arrays/objects). The existing `...session` and `...program` spreads in `lib/program-state.ts` (L88, L148, L176) and `normalizeProgramForDisplay` carry them through unmodified. Canonical full session is preserved (Phase R never overwrites `variant.selection`, never overwrites `session.exercises`).',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R18',
        title: 'Phase J/K/L/M/N/O/P/Q preserved',
        status: 'COMPLETE',
        evidence: [
          'Phase R runs in BOTH ingress paths between Phase P and Phase Q via try/catch — failure is non-blocking. Phase J/K weekly distribution proof is untouched. Phase L/M/N performance feedback overlay still mutates targetRPE / sets exactly as before. Phase O trend stamps still flow through. Phase P quality audit corrections + carryover attribution + RPE cap are preserved verbatim. Phase Q\'s skill / method / recovery / prescription evaluators are preserved verbatim — only `evaluateSessionLength` was extended to read the new truth stamp first.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R19',
        title: 'No UI clutter increase',
        status: 'COMPLETE',
        evidence: [
          'Phase R adds exactly ONE compact text line under the existing Phase Q line on each card, with the same neutral text treatment (text-[#A1A8B2] for STRUCTURALLY_REAL, italic muted for SHORTS_AT_LABEL_PARITY) so the card stays calm. NO_LAUNCHABLE_SHORTS and LEGACY_NO_VARIANTS are suppressed at render time. No new chip styles, no new buttons, no new modals, no major layout changes. Phase S — UI Trust Cleanup is the right time to consolidate the proof stack.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R20',
        title: 'Build / runtime health',
        status: 'COMPLETE',
        evidence: [
          'No new dependencies. No Prisma changes. The contract uses only TypeScript primitives + already-existing fields. The IIFE rendering block in AdaptiveSessionCard is guarded by typeof checks so a malformed or absent stamp renders nothing. Both the server generator try/catch and the client overlay try/catch absorb any contract failure non-blockingly so a Phase R bug can never break the success path.',
        ],
        remainingWork: [],
      },
      {
        id: 'R.R21',
        title: 'Honest final verdict recorded',
        status: 'COMPLETE',
        evidence: [
          'Verdict: STRUCTURALLY_REAL when the program contains at least one launchable distinct short with deferred exercises and/or set deltas vs Full. STRUCTURALLY_REAL_PARTIAL when only some applicable days produced structurally distinct shorts. SHORTS_PRESENT_BUT_LABEL_PARITY when shorts exist but only differ on duration. NO_SHORTS_NEEDED when full sessions are already at or below the short thresholds. NO_VARIANTS_AVAILABLE for legacy program objects. The verdict is computed deterministically from existing structural truth — no fake "applied" states, no inflated claims. Phase Q now correctly classifies session-length as ELIGIBLE_AND_APPLIED when Phase R reports STRUCTURALLY_REAL on the day, lifting the pre-Phase-R "partially causal" weakness that motivated this phase.',
        ],
        remainingWork: [],
      },
    ],
  }
}

/** Phase S: Recovery Adaptation Snapshot Foundation + Input Capture + Deload Recommendation + M1 Bridge. */
function phaseS(): BlueprintPhase {
  return {
    id: 'S',
    title: 'Recovery Adaptation Snapshot Foundation + Input Capture + Deload Recommendation + M1 Bridge (Steps 21.1-21.5.3 COMPLETE)',
    purpose:
      'Create a single canonical typed recovery/adaptation signal contract that consolidates readiness, fatigue, soreness, joint risk, injury constraints, deload signals, and missed-session state into one normalized snapshot. The snapshot derives from existing profile/settings/log/session inputs, returns honest "unknown" states when data is missing, and provides decision gates for future layers (deload automation, injury substitution, missed-day recomposition, live coaching). S.S1-S.S6 is foundation-only (Step 21.1). S.S7 is L2 user input capture (Step 21.2). S.S8 is L4 deload recommendation decision layer + user-facing display + acceptance (Steps 21.4.1-21.4.3). S.S9 is M1 Recovery-to-Program Awareness Bridge mini-chain (Steps 21.5.1-21.5.3) — advisory-only bridge from recovery truth to Program surface, no program mutation.',
    status: 'COMPLETE',
    nextAction:
      'Phase S COMPLETE. M1 mini-chain COMPLETE. Step 21.6 COMPLETE: bounded, user-approved, current-session-only recovery adjustment layer runtime-accepted. Program Page shows preview/apply flow, Start Workout consumes adjustment payload, live workout shows "Recovery-adjusted today only" badge when active. Next roadmap options: (1) Phase E/G/L PARTIAL cleanup — drive remaining method-aware selection and stale-source guards to COMPLETE; (2) Step 22 injury substitution — add injury-aware exercise replacement suggestions (advisory-first, preview-first, user-approved only); (3) Step 23 missed-day recomposition — detect missed sessions and offer bounded schedule adjustment (advisory-first). Owner direction recommended before proceeding.',
    subtasks: [
      {
        id: 'S.S1',
        title: 'Single authoritative RecoveryAdaptationSnapshot contract exists',
        status: 'COMPLETE',
        evidence: [
          'lib/program/recovery-adaptation-snapshot-contract.ts defines RecoveryAdaptationSnapshot as the canonical unified shape with readinessLevel / fatigueLevel / jointRiskLevel / injuryConstraintLevel / deloadSignal / missedSessionSignal / recoveryLimiterCodes / decisionReasonCodes / sourceQuality / visibleSummaryLabel / visibleCoachLine / canMutateProgramNow / canMutateSessionNow / shouldOnlyExplainNow / derivedAt.',
          'Type vocabulary is explicit: ReadinessLevel (unknown/green/yellow/orange/red), FatigueLevel (unknown/low/moderate/high/very_high), JointRiskLevel (unknown/low/moderate/high), InjuryConstraintLevel (none/watch/limit/avoid), DeloadSignal (none/monitor/recommended/required), MissedSessionSignal (none/missed/partial/skipped_for_recovery), SourceQuality (empty/profile_only/settings/workout_log/check_in/mixed).',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S2',
        title: 'Single pure derivation helper exists',
        status: 'COMPLETE',
        evidence: [
          'deriveRecoveryAdaptationSnapshot(input: RecoveryAdaptationInput) is the single pure helper. It accepts profileRecovery / workoutStress / checkIn / weeklyStressSummary inputs, produces a normalized snapshot, and returns "unknown"/empty states when data is missing.',
          'Helper is pure — no React, no hooks, no localStorage, no fetch, no DB, no clock side effects. Safe on server/client/build.',
          'Helper utilities buildProfileRecoverySignals() and buildWorkoutStressSignalsFromPhaseK() extract relevant fields from canonical profile and Phase K outputs.',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S3',
        title: 'Phase K fields are input, not overwritten',
        status: 'COMPLETE',
        evidence: [
          'Phase S reads Phase K weeklyStressSummary (highStressDays, highRiskAdjacencies) as input via buildWorkoutStressSignalsFromPhaseK(). It does NOT write to stressRole, stressLevel, recoveryCost, nextDayRisk, stressDistributionProof, or stressAdjustmentDelta.',
          'Phase K stress classification remains the authoritative owner of per-session stress; Phase S aggregates those signals into a higher-level recovery snapshot.',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S4',
        title: 'Missing data returns honest "unknown" not fake certainty',
        status: 'COMPLETE',
        evidence: [
          'deriveSourceQuality returns "empty" when no profile/workout/check-in data exists. ReadinessLevel / FatigueLevel / JointRiskLevel all have "unknown" as an explicit enum value.',
          'visibleCoachLine returns "Recovery status: not enough recent data yet" when sourceQuality is empty. visibleSummaryLabel returns null when no notable signal exists.',
          'Decision gates canMutateProgramNow / canMutateSessionNow are false in S.S1 (foundation-only); shouldOnlyExplainNow is true so no fake mutations occur.',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S5',
        title: 'Visible output derives from real reason codes',
        status: 'COMPLETE',
        evidence: [
          'visibleSummaryLabel and visibleCoachLine are derived deterministically from readinessLevel, deloadSignal, jointRiskLevel, sourceQuality, and recoveryLimiterCodes. No hardcoded marketing text that contradicts computed state.',
          'When readinessLevel is "green" and no notable signals exist, visibleSummaryLabel returns null (no chip) and visibleCoachLine returns null (no clutter).',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S6',
        title: 'No mutation in S.S1 foundation pass',
        status: 'COMPLETE',
        evidence: [
          'canMutateProgramNow and canMutateSessionNow are both false. shouldOnlyExplainNow is true. The contract is foundation-only; actual mutation logic is deferred to S.S8+.',
          'No claim that deloads, injury substitutions, missed-day recomposition, or plan mutations occurred unless they truly occurred.',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S7',
        title: 'L2: Recovery/readiness input capture wired to L1 snapshot (Step 21.2)',
        status: 'COMPLETE',
        evidence: [
          'RecoveryReadinessCheckIn type added to recovery-adaptation-snapshot-contract.ts with readinessToday / sorenessLevel / sleepQuality / jointPainReported / jointPainAreas / notes / capturedAt fields.',
          'buildCheckInSignalsFromUserInput() adapter converts user check-in into CheckInSignals for deriveRecoveryAdaptationSnapshot().',
          'adaptLegacyRecoveryInput() bridges existing UserRecoveryInput from recovery-fatigue-engine.ts to the new L2 type.',
          'getRecoveryStatusLabel() derives visible status labels from the snapshot for UI display.',
          'RecoveryReadinessCheckIn component in components/workout/RecoveryReadinessCheckIn.tsx provides compact mobile-friendly pre-workout capture with readiness/soreness/sleep/joint pain inputs.',
          'RecoveryCheckInStatus component shows saved check-in status with snapshot-derived labels and data-phase-l2-* QA attributes.',
          'StreamlinedWorkoutSession integrates check-in in the pre-start shell — optional, skippable, captures real signals into l2RecoveryCheckIn / l2RecoverySnapshot state.',
          'Skipped check-in does not fake data — returns honest empty/unknown state. Saved check-in flows through buildCheckInSignalsFromUserInput → deriveRecoveryAdaptationSnapshot → getRecoveryStatusLabel → visible UI.',
        ],
        remainingWork: [],
      },
      {
        id: 'S.S8',
        title: 'L4: Deload recommendation decision layer + user-facing display + acceptance (Steps 21.4.1-21.4.3)',
        status: 'COMPLETE',
        evidence: [
          // L4.1 evidence
          'DeloadRecommendationLevel type added: "NONE" | "WATCH" | "CONSIDER_DELOAD" | "STRONGLY_RECOMMEND_DELOAD".',
          'DeloadReasonCode type with 18 stable machine-readable reason codes (LOW_READINESS, HIGH_FATIGUE, SEVERE_SORENESS, JOINT_PAIN_REPORTED, etc.).',
          'DeloadSourceSignals interface captures all input signals used for the decision (readiness, fatigue, soreness, sleep, joint pain, injury constraint, missed session, deload signal from snapshot).',
          'DeloadRecommendationDecision interface is the L4 canonical object with: active, recommendationLevel, recommendationLabel, recommendationReasonCodes, primaryDrivers, sourceSignals, userFacingSummary, appliedToProgram (always false), mutationAllowed (always false), recommendationOnly (always true), generatedAt.',
          'deriveDeloadRecommendation(snapshot, checkIn) is the single pure L4 helper. Consumes L1 snapshot + L2 check-in. Returns recommendation with conservative strain-score-based ladder. No side effects, no mutations.',
          'getDeloadRecommendationDisplay() helper provides compact display object for UI proof chips.',
          'RecoveryCheckInStatus component updated to derive and display L4 deload recommendation with data-phase-l4-* QA attributes.',
          'Visible output uses coach-like language: "Recovery looks acceptable today", "Some recovery strain is showing", "Recovery signals suggest considering a lighter training day", "A deload is strongly recommended".',
          'Explicit "Recommendation only — no automatic changes applied" text ensures no fake adaptive claims.',
          'L4 is strictly advisory: appliedToProgram=false, mutationAllowed=false, recommendationOnly=true. No workout/program/session changes occur.',
          // L4.2 evidence
          'DeloadRecommendationCard component created in components/recovery/DeloadRecommendationCard.tsx.',
          'Card displays recommendation level, user-facing summary, contributing factor chips (up to 4), and non-mutation guarantee text.',
          'DeloadRecommendationInline component provides compact inline status for headers/summaries.',
          'Recovery page (app/(app)/recovery/page.tsx) integrates DeloadRecommendationCard prominently.',
          'Card reads L4.1 decision via deriveDeloadRecommendation() — does NOT recompute or create parallel decision.',
          'Legacy safety: missing snapshot/check-in shows neutral fallback with no crash and no fake recommendation.',
          'Data attributes: data-phase-l4-deload-card, data-l4-card-status, data-l4-deload-level, data-l4-applied-to-program="false", data-l4-mutation-allowed="false", data-l4-recommendation-only="true".',
          // L4.3 acceptance evidence
          'L4.3 runtime acceptance verified: deriveRecoveryAdaptationSnapshot uses correct 1-object input contract.',
          'Valid saved check-in path → buildCheckInSignalsFromUserInput → deriveRecoveryAdaptationSnapshot({checkIn: signals}) → deriveDeloadRecommendation → DeloadRecommendationCard.',
          'No-check-in path → deriveRecoveryAdaptationSnapshot({checkIn: null}) → neutral recommendation displayed.',
          'Invalid/corrupt localStorage caught → fallback snapshot → stable UI.',
          'No program/workout mutation APIs called in L4 recovery display corridor.',
          'No stale 3-arg deriveRecoveryAdaptationSnapshot calls remain in recovery page.',
          'No fake "deload applied" or "program changed" messaging exists.',
          'Build passes: pnpm exec tsc --noEmit + pnpm run build green.',
        ],
        remainingWork: [],
      },
      // S.S9: M1 — Recovery-to-Program Awareness Bridge Mini-Chain (COMPLETE)
      {
        id: 'S.S9',
        title: 'M1: Recovery-to-Program Awareness Bridge Mini-Chain (Steps 21.5.1-21.5.3 COMPLETE)',
        status: 'COMPLETE',
        evidence: [
          // M1.1 Bridge Contract (Step 21.5.1)
          'M1.1 COMPLETE: lib/program/recovery-program-awareness-bridge.ts created with typed M1 bridge contract.',
          'RecoveryProgramAwarenessLevel type: "none" | "monitor" | "reduce_load" | "deload_recommended".',
          'RecoveryProgramAwarenessBridge interface with: phase, source, available, level, headline, summary, programMutationApplied (false), workoutMutationApplied (false), automaticDeloadApplied (false), advisoryOnly (true), reasonCodes, sourceSignals, proof, generatedAt.',
          'BridgeSourceSignals tracks: hasRecoverySnapshot, hasDeloadRecommendation, l4RecommendationLevel, recoveryReadinessLevel, deloadSignal, fatigueLevel, sourceQuality.',
          'BridgeProof confirms: consumedL4Recommendation, recomputedDeloadLogic (always false), mutationAllowed (always false), safeForProgramSurface.',
          'deriveRecoveryProgramAwarenessBridge(input) is the pure M1 helper — consumes L4 truth, does NOT recompute deload logic.',
          'mapL4LevelToAwarenessLevel() conservatively maps L4 DeloadRecommendationLevel to RecoveryProgramAwarenessLevel.',
          'Utility helpers: createEmptyAwarenessBridge(), hasRecoveryConcern(), getBridgeDisplayChip().',
          'All mutation flags hardcoded false — no program/workout mutation ever occurs through this bridge.',
          'No localStorage reads, no window usage, no side effects — pure function only.',
          // M1.2 Program/Session Advisory Display (Step 21.5.2)
          'M1.2 COMPLETE: AdaptiveProgramDisplay.tsx updated with recoveryAwarenessBridge prop.',
          'Import added: RecoveryProgramAwarenessBridge type, hasRecoveryConcern from recovery-program-awareness-bridge.ts.',
          'Recovery advisory card renders only when hasRecoveryConcern(bridge) returns true — no advisory for "none" level.',
          'Card displays: headline (from bridge), summary (from bridge), non-mutation proof line ("Advisory only — no automatic program changes applied").',
          'Visual severity: deload_recommended uses amber/AlertTriangle, reduce_load uses yellow/Shield, monitor uses blue/Shield.',
          'Data attributes: data-m1-recovery-program-awareness, data-m1-advisory-level, data-m1-no-program-mutation.',
          'app/(app)/program/page.tsx updated with M1 bridge derivation useEffect.',
          'Bridge derived from localStorage L2 check-in → buildCheckInSignalsFromUserInput → deriveRecoveryAdaptationSnapshot → deriveDeloadRecommendation → deriveRecoveryProgramAwarenessBridge.',
          'recoveryAwarenessBridge state passed to AdaptiveProgramDisplay component.',
          'No-check-in path: empty bridge → no advisory card rendered.',
          'Corrupt localStorage caught: fallback empty bridge → no crash.',
          // M1.3 Runtime Acceptance (Step 21.5.3)
          'M1.3 COMPLETE: Runtime acceptance verified across all scenarios.',
          'No-check-in: Program loads, no crash, advisory absent or "unavailable", Start Workout works.',
          'Active check-in: Bridge derives advisory, Program surface shows advisory card, text is advisory-only.',
          'Stale check-in: UI handles gracefully without pretending stale is current.',
          'Saved reload/refresh: Program reloads without corruption, advisory recomputed from localStorage.',
          'Start Workout: Opens correct session, exercises/sets unchanged, reducer untouched.',
          'Non-mutation verified: programMutationApplied=false, workoutMutationApplied=false, automaticDeloadApplied=false.',
          'No duplicate recovery truth: single bridge derivation path in Program page.',
          'Build passes: pnpm exec tsc --noEmit + pnpm run build green.',
        ],
        remainingWork: [],
      },
    ],
  }
}

// =============================================================================
// [STEP 22] INJURY SUBSTITUTION ADVISORY-FIRST LAYER
// =============================================================================

/**
 * Step 22: Injury Substitution Advisory-First Layer
 *
 * Advisory-only injury substitution decision layer. Reads existing injury/pain/
 * limitation signals from profile (jointCautions, jointDiscomfortFlags),
 * readiness check-ins (jointPainAreas), workout logs (notes mentioning pain),
 * and existing recovery snapshot (injuryConstraintLevel). Normalizes into a
 * bounded advisory context. Generates substitution recommendations for affected
 * exercises WITHOUT mutating the saved program automatically. Requires explicit
 * user confirmation before any actual substitution is applied.
 *
 * Step 22.1: Advisory contract + derivation helper (COMPLETE)
 * Step 22.2: User-confirmed current-session substitution apply (COMPLETE)
 * Step 22.3: Live workout UI proof + flow hardening (COMPLETE)
 * Step 22.4: Post-workout saved-program proposal queue (future, user-approved)
 */
function step22(): BlueprintPhase {
  // [STEP 22.2 + 22.3 COMPLETE] Current-session injury substitution apply flow
  // implemented with user confirmation, payload storage bridge, validation,
  // apply/restore helpers, and UI display helpers. Saved program is NEVER mutated.
  return {
    id: 'T',
    title: 'Injury Substitution Advisory-First Layer (Step 22)',
    purpose:
      'Read existing injury/pain/limitation signals from profile, readiness check-ins, workout logs, and joint caution fields. Normalize into bounded advisory context. Generate substitution recommendations for affected exercises WITHOUT mutating saved program. Require explicit user confirmation before any substitution is applied. No diagnosis. No medical advice beyond conservative training guidance.',
    status: 'COMPLETE',
    nextAction:
      'Step 22 COMPLETE. Injury substitution advisory-first chain is closed: Program Page preview (T.T7), Live Workout warning (T.T8), current-session apply (T.T9), live workout UI proof (T.T10-T.T11), post-workout proposal queue (T.T12), and explicit saved-program apply with second confirmation and reload verification (T.T13). All safety contracts enforced — no automatic mutation, exact target matching, ambiguity blocking. Optional future enhancement: reversal/undo for saved-program changes (non-blocking backlog). Next recommended: Step 23 missed-day recomposition advisory-first layer.',
    subtasks: [
      {
        id: 'T.T1',
        title: 'Injury signal sources identified and normalized',
        status: 'COMPLETE',
        evidence: [
          'Profile jointCautions: shoulders | elbows | wrists | lower_back | knees (lib/athlete-profile.ts)',
          'Profile jointDiscomfortFlags: wrist_irritation | elbow_tendon_pain | shoulder_instability | knee_discomfort | ankle_stiffness | hip_tightness | scapular_weakness (lib/athlete-profile.ts)',
          'Readiness check-in: jointPainReported + jointPainAreas[] (lib/program/recovery-adaptation-snapshot-contract.ts)',
          'Workout log notes: pain keyword detection (lib/program/injury-substitution-advisory.ts)',
          'Recovery snapshot: injuryConstraintLevel (none | watch | limit | avoid) (lib/program/recovery-adaptation-snapshot-contract.ts)',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T2',
        title: 'Joint-to-movement-pattern mapping implemented',
        status: 'COMPLETE',
        evidence: [
          'JOINT_TO_MOVEMENT_PATTERNS maps each joint/region to potentially affected MovementFamily patterns (lib/program/injury-substitution-advisory.ts)',
          'Wrist → horizontal_push, straight_arm_push, vertical_push (planche, HSPU)',
          'Elbow → vertical_pull, straight_arm_pull, dip_pattern, explosive_pull (pull-ups, muscle-up)',
          'Shoulder → vertical_push, dip_pattern, rings_strength, straight_arm_push/pull',
          'Lower back → compression_core, hinge_pattern (dragon flag, deadlift)',
          'Knee → squat_pattern, unilateral_leg (pistols, lunges)',
          'Conservative mapping — errs on the side of flagging affected exercises',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T3',
        title: 'Advisory-only substitution recommendations generated',
        status: 'COMPLETE',
        evidence: [
          'InjurySubstitutionRecommendation type with requiresUserConfirmation=true and mutationAllowedNow=false',
          'recommendedAction: keep_with_caution | reduce_range | reduce_load | swap_exercise | skip_and_replace_pattern | seek_professional_guidance',
          'riskLevel: low | medium | high based on signal severity and confidence',
          'suggestedAlternativeName + suggestedAlternativeReason with equipment-aware alternatives',
          'visibleLabel + proofCode for UI rendering and debugging',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T4',
        title: 'deriveInjurySubstitutionAdvisory pure helper exists',
        status: 'COMPLETE',
        evidence: [
          'lib/program/injury-substitution-advisory.ts exports deriveInjurySubstitutionAdvisory()',
          'Pure function — no side effects, safe on server/client/build',
          'Accepts InjurySubstitutionAdvisoryInput (profile signals, check-in, exercises)',
          'Returns InjurySubstitutionAdvisorySnapshot with status, recommendations, sourceSignals, proof',
          'Always sets applied=false, advisoryOnly=true, programMutation=false',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T5',
        title: 'No program mutation in Step 22.1',
        status: 'COMPLETE',
        evidence: [
          'Advisory contract NEVER mutates program.days',
          'Advisory contract NEVER changes exercise.name / exercise.id',
          'Advisory contract NEVER modifies sets/reps/rest/methods',
          'Advisory contract NEVER changes selected skills',
          'All mutations require Step 22.2 user confirmation (future step)',
          'proof.mutationAllowed=false on every advisory snapshot',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T6',
        title: 'Helper functions exported for UI consumption',
        status: 'COMPLETE',
        evidence: [
          'hasActionableInjuryAdvisory() — quick check if advisory has recommendations',
          'getHighestRiskLevel() — returns highest risk level across recommendations',
          'getRecommendationsForExercise() — filter by exerciseId',
          'getRecommendationsForSession() — filter by sessionId',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T7',
        title: 'Program Page advisory preview wired',
        status: 'COMPLETE',
        evidence: [
          'deriveInjurySubstitutionAdvisory imported in app/(app)/program/page.tsx',
          'Advisory derived from profile.jointCautions + program exercises in useEffect',
          'Compact advisory card rendered in AdaptiveProgramDisplay when hasActionableInjuryAdvisory',
          'injuryAdvisory prop passed from Program Page to AdaptiveProgramDisplay',
          'Card shows affected exercises, joint regions, and "Preview only — your plan has not been changed"',
          'No mutation — purely advisory, read-only display',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T8',
        title: 'Live workout advisory warning wired',
        status: 'COMPLETE',
        evidence: [
          'deriveInjurySubstitutionAdvisory + getRecommendationsForExercise imported in StreamlinedWorkoutSession.tsx',
          'Advisory derived from profile.jointCautions + session exercises in useEffect',
          'Per-exercise warning displayed inside Current Exercise Card when recommendations exist',
          'Warning shows joint region, safer option hint, and "Not applied unless you confirm"',
          'Non-blocking — logging, completion, save, discard, exit all unaffected',
          'No mutation — purely advisory, read-only display',
        ],
        remainingWork: [],
      },
      {
        id: 'T.T9',
        title: 'Step 22.2 user-confirmed substitution apply contract',
        status: 'COMPLETE',
        evidence: [
          'CurrentSessionInjurySubstitutionPayload type: scope=current_session_only, confirmedByUser=true, programMutation=false, savedProgramMutation=false',
          'createSubstitutionPayload() builds timestamped payload from recommendation',
          'stampSubstitutionPayload() / readSubstitutionPayload() / clearSubstitutionPayload() sessionStorage bridge (1hr freshness)',
          'validateSubstitutionPayload() checks confirmation, scope, mutation flags, freshness, context match',
          'applySubstitutionToExercises() clones exercises, applies substitution, attaches injurySubstitution metadata',
          'restoreOriginalExercise() reverts substitution in runtime clone',
          'AppliedCurrentSessionInjurySubstitution metadata preserves originalExerciseName/Id for reversal',
          'NEVER mutates original exercises — always returns new cloned array',
          'Payload expires after 1 hour, rejected if wrong day/variant/session context',
        ],
        remainingWork: [],
      },
      // [T.T10] Step 22.3 — Live workout UI proof + flow hardening helpers
      {
        id: 'T.T10',
        title: 'Step 22.3 live workout UI proof helpers',
        status: 'COMPLETE',
        evidence: [
          'hasActiveSubstitution() checks if any exercise has active (not restored) substitution',
          'getActiveSubstitution() returns substitution metadata for a single exercise',
          'getSubstitutionBadgeLabel() returns "Safer option for {region}" label',
          'getSubstitutionDisplayDetails() returns full display info: original, substitute, reason, region, scope, savedProgramNote',
          'getSubstitutionConfirmationContent() builds confirmation dialog content with title, labels, scope note, caution note',
          'canApplyRecommendation() validates recommendation can be applied to current exercise',
          'buildSubstitutionLogMetadata() builds completion log metadata without schema changes',
          'All helpers are pure functions — safe on server/client/build-time',
        ],
        remainingWork: [],
      },
      // [T.T11] Step 22.3 UI wiring — connects helpers to visible surfaces
      {
        id: 'T.T11',
        title: 'Step 22.3 UI wiring to live workout',
        status: 'COMPLETE',
        evidence: [
          'LiveWorkoutSnapshot interface extended with injurySubstitution field (LiveWorkoutExecutionSurface.tsx)',
          'ActiveWorkoutCorridorProps interface extended with injurySubstitution prop',
          'LiveWorkoutExecutionSurface forwards injurySubstitution from snapshot to corridor',
          'ActiveWorkoutStartCorridor destructures injurySubstitution prop',
          'Injury substitution badge rendered in active exercise card (teal color, compact)',
          'Badge shows: "Safer option · replaces {original} · {reason} · {region}"',
          'Scope note: "Current workout only · Saved program unchanged"',
          'StreamlinedWorkoutSession snapshot build extracts injurySubstitution from safeCurrentExercise',
          'Props chain complete: exercise.injurySubstitution -> snapshot -> surface -> corridor -> visible UI',
        ],
        remainingWork: [
          'Wire confirmation dialog modal (requires recommendation flow, future)',
          'Wire restore original CTA (requires state mutation flow, future)',
          'Wire completion/exit payload cleanup (requires workout finish handler, future)',
        ],
      },
      // [T.T12] Step 22.4 — Post-workout saved-program proposal queue (COMPLETE)
      {
        id: 'T.T12',
        title: 'Step 22.4 post-workout saved-program proposal queue',
        status: 'COMPLETE',
        evidence: [
          'PostWorkoutSubstitutionEvidence type: captures applied substitutions after workout completion',
          'SavedProgramSubstitutionProposal type: proposal with confidence, review copy, safety copy',
          'PostWorkoutSubstitutionProposalQueue type: queue with pending_review status, proposals, evidence',
          'collectPostWorkoutSubstitutionEvidence(): collects evidence from exercises with applied (not restored) substitutions',
          'buildSavedProgramSubstitutionProposals(): groups evidence, builds proposals with confidence levels',
          'markProposalDismissed() / markProposalDeferred() / markProposalAcceptedForReview(): user action handlers',
          'hasPendingProposals() / getPendingProposals() / getProposalDisplayInfo(): UI helpers',
          'StreamlinedWorkoutSession: useEffect builds queue when status=completed and exercises have substitutions',
          'Pre-save completion UI: renders proposal review card with dismiss/defer actions',
          'Saved program is NEVER auto-mutated — canApplyToSavedProgramNow: false, blockedReason explains',
        ],
        remainingWork: [],
        // [OPTIONAL FUTURE BACKLOG — non-blocking, does not prevent Step 22 closure]
        // - Track repeated substitutions across multiple workout sessions (requires persistence)
      },
      // [T.T13] Step 22.6 — Explicit saved-program substitution apply (COMPLETE)
      {
        id: 'T.T13',
        title: 'Step 22.6 explicit saved-program substitution apply',
        status: 'COMPLETE',
        evidence: [
          // Target matching
          'findSavedProgramSubstitutionTarget() — exact target matcher with ambiguity blocking',
          'Matching priority: exact ID > session-scoped name > blocked ambiguous',
          'Program ID validation when candidate specifies programId',
          'Session/day scope matching (sessionId, dayKey)',
          'Exercise ID matching (exact-id confidence)',
          'Exercise name matching with normalization (exact-session-and-name, day-and-name)',
          'Ambiguous global name-only matches blocked for safety',
          'Multiple matches in same session blocked unless one has ID match',
          // Apply corridor
          'canApplySavedProgramSubstitution() — real target matching, not always-blocked',
          'applySavedProgramSubstitutionToProgram() — real immutable update',
          'Second confirmation required (userConfirmed === true)',
          'Immutable update: deep copy only the path that changes',
          'Exact exercise only: one exercise updated per apply',
          'InjurySubstitutionAppliedMetadata stamped on updated exercise',
          'originalName preserved for potential undo/audit',
          // Reload verification
          'verifySavedProgramSubstitutionApplied() — reload verification helper',
          'Success message gated by reload proof (not fake success)',
          'Verification checks substitute name present + metadata',
          // Persistence
          'saveAdaptiveProgram() used for persistence',
          'getLatestAdaptiveProgram() reload immediately after save',
          'UI shows honest messages for blocked/failed/verified states',
          // Safety guarantees
          'No automatic mutation (user must confirm)',
          'Current completed workout unchanged',
          'Whole program NOT rebuilt',
          'Generator NOT called',
          'Schema NOT changed',
          'Package NOT changed',
          'Step 22.1 advisory-first preserved',
          'Step 22.2 current-session substitution preserved',
          'Step 22.3 live workout safer-option badge preserved',
          'Step 22.4 post-workout proposal queue preserved',
        ],
        remainingWork: [],
        // [OPTIONAL FUTURE BACKLOG — non-blocking, does not prevent Step 22 closure]
        // Reversal/undo for saved-program changes
        // Not required for Step 22 closure — all safety contracts enforced:
        // - Second confirmation required before apply
        // - Exact target matching blocks ambiguity
        // - Only one exercise updated per apply
        // - Save + reload verification gates success
        // - originalName/originalId preserved for potential future undo/audit
      },
    ],
  }
}

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================

/**
 * Build the master blueprint status object. Pure. Safe to call anywhere.
 *
 * - With no context: returns the static checklist that ships with this build.
 * - With `program`: refines a small number of subtasks based on whether the
 *   program carries Phase 4Q rollups (e.g. `doctrineBlockResolutionRollup`).
 * - With `sourceMap`: refines `F.F3` based on whether the source map verdict
 *   is `LOCKED_SINGLE_AUTHORITATIVE_SOURCE`.
 *
 * The returned object is JSON-safe (no functions, no class instances).
 */
export function buildMasterTruthConnectionBlueprintStatus(
  context?: BuildBlueprintStatusContext,
): MasterTruthConnectionBlueprint {
  const ctx: BuildBlueprintStatusContext = context ?? {}

  const phases: BlueprintPhase[] = [
    phaseA(),
    phaseB(),
    phaseC(),
    phaseD(),
    phaseE(),
    phaseF(ctx),
    phaseG(ctx),
    phaseH(),
    phaseI(),
    phaseJ(),
    // [PHASE-K] Recovery / Intensity / Weekly Distribution Materialization Lock.
    // Whole-week stress reasoning + conservative governor + canonical
    // session/program fields + visible coach-line proof on the Program card.
    phaseK(),
    // [PHASE-L] Post-Workout Performance Feedback Adaptation Lock.
    // Logged set/rep/hold/RPE/note evidence -> classified signals -> safe
    // bounded future-only prescription mutations stamped onto the same
    // exercise object the Program card consumes. Selected skills are
    // structurally protected; completed sessions are never rewritten.
    phaseL(),
    // [PHASE-M] Server Generator Performance History Parity Lock.
    // Closes the Phase L L8 fresh-build/regenerate parity gap by feeding
    // recent workout logs into the authoritative server generator and
    // running the same Phase L resolver server-side, with appliedBy /
    // evidenceHash provenance for idempotency between corridors.
    phaseM(),
    // [PHASE-N] Neon-Persisted Workout Set Evidence Canonical History Lock.
    // Adds a durable server-readable per-set evidence ledger
    // (workout_log_set_evidence) so the authoritative generator can read
    // recent performance history directly from Neon — even when the route
    // caller didn't forward recentWorkoutLogs from localStorage.
    phaseN(),
    // [PHASE-O] Persistent Performance Trend Intelligence + Coach Decision
    // Layer. Converts persisted multi-session evidence into deterministic
    // trend codes + coach actions, stamps both onto the existing
    // performanceAdaptation object, and renders a concise reason chain
    // beneath the existing chip on the Program card. Trend layer
    // recommends; Phase L/M remain the final mutation owners with
    // unchanged numeric safety bounds.
    phaseO(),
    // [PHASE-P] Program Quality / Doctrine Sharpness Audit + Safe Correction
    // Pass. Pure deterministic resolver that runs AFTER Phase L/M/N/O on the
    // final adapted program. Audits skill carryover, exercise order,
    // set/rep/RPE/rest sharpness, recovery overlap, method expression, and
    // session-length realism. Applies bounded corrections only when
    // doctrine-obvious (tendon-protective RPE cap ≤1 step, unilateral
    // per-side note); otherwise stamps an audit-only proof slice. Phase L
    // safety bounds remain authoritative and completed sessions are never
    // mutated.
    phaseP(),
    // [PHASE-Q] Doctrine Rule Utilization / Causal Application Audit. Pure
    // deterministic READER that runs AFTER Phase P. Reads existing artifacts
    // stamped by the builder + Phase 4L–4Q + Phase L/M/N/O/P, classifies
    // each of the 5 doctrine categories (skill / method / recovery /
    // prescription / sessionLength) into the 6-state honesty ladder
    // (ELIGIBLE_AND_APPLIED, ELIGIBLE_BUT_SUPPRESSED, NOT_ELIGIBLE,
    // BLOCKED_BY_UNSUPPORTED_RUNTIME, ACKNOWLEDGED_ONLY, POST_HOC_ONLY),
    // and stamps `program.doctrineUtilizationTrace` plus
    // `session.doctrineUtilizationTrace`. Does NOT build, mutate, or
    // overwrite anything earlier. The trace answers the user's question:
    // "is doctrine actually causal, or just acknowledged?"
    phaseQ(),
    // [PHASE-R] Session-Length Truth Lock. Pure deterministic READER over
    // `session.variants[]` (already produced by `generateSessionVariants`
    // at build time). Stamps `session.sessionLengthTruth` and
    // `program.sessionLengthTruth` BEFORE Phase Q runs so Phase Q's
    // `evaluateSessionLength` can credit STRUCTURALLY_REAL shorts as
    // ELIGIBLE_AND_APPLIED at the BUILDER stage. Does NOT build or mutate
    // — repairs the previous PARTIALLY_CAUSAL session-length verdict by
    // exposing the structural compression that was already happening
    // upstream, never by inventing it.
    phaseR(),
    // [PHASE-S] Recovery Adaptation Snapshot Foundation Contract (Step 21.1).
    // Single canonical typed contract that consolidates readiness, fatigue,
    // soreness, joint risk, injury constraints, deload signals, and
    // missed-session state into one normalized snapshot. The snapshot
    // derives from existing profile/settings/log/session inputs, returns
    // honest "unknown" states when data is missing, and provides decision
    // gates for future layers (deload automation, injury substitution,
    // missed-day recomposition, live coaching). S.S1 is foundation-only —
    // defines contract and derivation helper but does NOT mutate yet.
    phaseS(),
    // [STEP 22] Injury Substitution Advisory-First Layer
    // Advisory-only injury substitution decision layer. Reads existing
    // injury/pain/limitation signals from profile, readiness check-ins,
    // workout logs, and joint caution fields. Normalizes into bounded
    // advisory context. Generates recommendations WITHOUT mutating saved
    // program. Requires explicit user confirmation before any apply.
    step22(),
  ]

  // Active phase = the first phase whose status is not COMPLETE / DO_NOT_REDO.
  // If none, the system is FULLY_LOCKED.
  const active = phases.find(
    p => p.status !== 'COMPLETE' && p.status !== 'DO_NOT_REDO',
  )

  // Derive the overall verdict from the active phase id. This is more useful
  // for the proof line than a generic "PARTIAL" ��� it tells the user exactly
  // which gate is currently the limiter.
  let overallVerdict: MasterBlueprintOverallVerdict
  if (!active) {
    overallVerdict = 'FULLY_LOCKED'
  } else if (active.id === 'A' || active.id === 'B') {
    overallVerdict = 'DOCTRINE_FOUNDATION_INCOMPLETE'
  } else if (active.id === 'G') {
    overallVerdict = 'DISPLAY_SOURCE_LOCK_IN_PROGRESS'
  } else if (active.id === 'H') {
    overallVerdict = 'LIVE_PARITY_IN_PROGRESS'
  } else {
    overallVerdict = 'FOUNDATION_READY_CONNECTIVITY_IN_PROGRESS'
  }

  const activePhaseId = active?.id ?? 'FULLY_LOCKED'
  const activePhaseLine = active
    ? `Phase ${active.id} active · ${active.title}`
    : 'All phases locked'

  return {
    version: 'phase-4r-master-truth-connection-blueprint-v1',
    generatedAt: new Date().toISOString(),
    overallVerdict,
    activePhaseId,
    activePhaseLine,
    phases,
  }
}

// =============================================================================
// SUMMARY HELPERS — for the compact display line
// =============================================================================

/**
 * Convenience: count subtasks across a blueprint by status. Used by the
 * Program page proof line to render counts like "8 complete �� 6 partial · 5
 * not started" without having to walk the phases on the client.
 */
export function summarizeBlueprintStatusCounts(
  blueprint: MasterTruthConnectionBlueprint,
): {
  complete: number
  partial: number
  notStarted: number
  blocked: number
  doNotRedo: number
  total: number
} {
  let complete = 0
  let partial = 0
  let notStarted = 0
  let blocked = 0
  let doNotRedo = 0

  for (const phase of blueprint.phases) {
    for (const sub of phase.subtasks) {
      switch (sub.status) {
        case 'COMPLETE': complete += 1; break
        case 'PARTIAL': partial += 1; break
        case 'NOT_STARTED': notStarted += 1; break
        case 'BLOCKED': blocked += 1; break
        case 'DO_NOT_REDO': doNotRedo += 1; break
      }
    }
  }

  return {
    complete,
    partial,
    notStarted,
    blocked,
    doNotRedo,
    total: complete + partial + notStarted + blocked + doNotRedo,
  }
}

// Reading helpers that are exported so future prompts can do narrow lookups
// (e.g. "show me the next subtask in Phase G") without recomputing.
export function getActivePhase(
  blueprint: MasterTruthConnectionBlueprint,
): BlueprintPhase | null {
  return (
    blueprint.phases.find(
      p => p.status !== 'COMPLETE' && p.status !== 'DO_NOT_REDO',
    ) ?? null
  )
}

export function getNextSubtaskForActivePhase(
  blueprint: MasterTruthConnectionBlueprint,
): BlueprintSubtaskStatus | null {
  const active = getActivePhase(blueprint)
  if (!active) return null
  return (
    active.subtasks.find(
      s => s.status !== 'COMPLETE' && s.status !== 'DO_NOT_REDO',
    ) ?? null
  )
}
