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
    status: 'PARTIAL',
    nextAction: 'Selection-pass for method-aware exercise picking and multi-structure composition rules (deferred to Phase I; Phase 4S already wired methodStructures + doctrineBlockResolution through SessionCardSurface into AdaptiveSessionCard).',
    subtasks: [
      { id: 'E.E1', title: 'Structural methods create real grouped sessions where safe', status: 'COMPLETE', evidence: ['lib/program/structural-method-materialization-corridor.ts'], remainingWork: [] },
      { id: 'E.E2', title: 'Row-level methods mutate real exercise rows where safe', status: 'COMPLETE', evidence: ['lib/program/row-level-method-prescription-mutator.ts'], remainingWork: [] },
      { id: 'E.E3', title: 'Method decisions can affect exercise selection/order/grouping', status: 'PARTIAL', evidence: ['structural corridor handles grouping'], remainingWork: ['Selection-pass for method-aware exercise picking (deferred to Phase I)'] },
      { id: 'E.E4', title: 'Method decisions can affect session composition', status: 'PARTIAL', evidence: ['max one new structural group per session'], remainingWork: ['Multi-structure composition rules'] },
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
  const totalBugs =
    readNumber(blockResolutionRollup?.totalBugMissingConnection) +
    readNumber(blockResolutionRollup?.totalBugRuntimeContractMissing) +
    readNumber(blockResolutionRollup?.totalBugDisplayConsumerMissing) +
    readNumber(blockResolutionRollup?.totalBugNormalizerDroppedTruth) +
    readNumber(blockResolutionRollup?.totalBugStaleSourceWon)

  const g6Status: BlueprintPhaseStatus = blockResolutionRollup
    ? totalBugs === 0
      ? 'COMPLETE'
      : 'PARTIAL'
    : 'PARTIAL'

  return {
    id: 'G',
    title: 'Program Display Source Lock',
    purpose: 'The Program page reads canonical session truth; nothing else controls visible cards.',
    status: 'PARTIAL',
    nextAction: 'Drive program-level doctrineBlockResolutionRollup BUG_* counts to zero so G.G6 can flip to COMPLETE; then add the G.G3 stale-source runtime guard that rejects display projections carrying exercise selections older than canonical session truth.',
    subtasks: [
      { id: 'G.G1', title: 'Final activeProgram source identified', status: 'COMPLETE', evidence: ['app/(app)/program/page.tsx:authoritativeActiveProgram memo'], remainingWork: [] },
      { id: 'G.G2', title: 'Display projection is pure formatting', status: 'COMPLETE', evidence: ['buildProgramDisplayProjection does not pick exercises/methods'], remainingWork: [] },
      { id: 'G.G3', title: 'Old fallback/baby sources demoted', status: 'PARTIAL', evidence: ['lib/program/authoritative-program-source-map.ts demotes doctrineCausalChallenge to compatibility-only', 'Phase 4T: legacy doctrineCausalDisplay banner suppressed when canonical doctrineBlockResolution exists (AdaptiveSessionCard via hasClassifiedDoctrineResolution)', 'Phase 4U: program-level legacy DoctrineCausalLine "Doctrine did not reach generation" / "No doctrine rules matched" amber banners suppressed when program.doctrineBlockResolutionRollup proves doctrine actually applied (totalApplied + totalAlreadyApplied > 0)'], remainingWork: ['Add a runtime guard that rejects display projections containing exercise selections older than canonical session'] },
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
      // canonical Phase 4Q rollup either. The runtime g6Status gate still
      // keys on program.doctrineBlockResolutionRollup having 0 BUG_* entries.
      { id: 'G.G6', title: 'Yellow blocked labels map to true classifications', status: g6Status, evidence: blockResolutionRollup ? ['program.doctrineBlockResolutionRollup present', 'SessionCardSurface.doctrineBlockResolution field added (Phase 4S)', 'AdaptiveSessionCard renders classified statuses + bug diagnostic line via normalizeDoctrineBlockStatus (Phase 4S)', 'Phase 4T: legacy doctrineCausalDisplay banner demoted behind classified resolution; generic amber/zinc pills suppressed when canonical resolution entries exist', 'Phase 4U: program-level legacy DoctrineCausalLine upstream-failure banners (doctrine_did_not_run / doctrine_cache_empty / doctrine_domain_gap) suppressed when canonical rollup proves doctrine applied'] : ['SessionCardSurface.doctrineBlockResolution field added (Phase 4S)', 'AdaptiveSessionCard renders classified statuses + bug diagnostic line via normalizeDoctrineBlockStatus (Phase 4S)', 'Phase 4T: legacy doctrineCausalDisplay banner demoted behind classified resolution', 'Phase 4U: program-level legacy DoctrineCausalLine upstream-failure banners suppressed when canonical applied count > 0'], remainingWork: g6Status === 'COMPLETE' ? [] : ['Resolve remaining BUG_* entries in program.doctrineBlockResolutionRollup'] },
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
    //   - Density / unsupported method types remain guidanceOnly ��� no fake
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
    status: 'NOT_STARTED',
    nextAction: 'After Phases F.F3, G.G5, H.H5, and I are COMPLETE, audit the proof strip and demote internal-only lines behind a debug flag.',
    subtasks: [
      { id: 'J.J1', title: 'Hide stale/internal audit clutter from normal user view', status: 'NOT_STARTED', evidence: [], remainingWork: [] },
      { id: 'J.J2', title: 'Keep only useful doctrine explanations', status: 'NOT_STARTED', evidence: [], remainingWork: [] },
      { id: 'J.J3', title: 'Preserve compact product-grade UI', status: 'NOT_STARTED', evidence: [], remainingWork: [] },
      { id: 'J.J4', title: 'Keep diagnostics available where needed', status: 'NOT_STARTED', evidence: [], remainingWork: [] },
      { id: 'J.J5', title: 'Final result feels like an AI coach', status: 'NOT_STARTED', evidence: [], remainingWork: [] },
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
    status: 'PARTIAL',
    nextAction:
      'Expand mutation surface beyond sets/RPE on adjacent (i, i+1) pairs once acceptance signal is confirmed (method eligibility downgrades, accessory volume trims, density block on tendon-followups). Until then the contract is conservative-by-design.',
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
        status: 'PARTIAL',
        evidence: [
          'Hoisted session.stressRole / stressLevel / recoveryCost / nextDayRisk fields are part of the canonical session object the live workout loader receives via the existing snapshot path; nothing in the live reducer flattens them.',
        ],
        remainingWork: [
          'Live reducer does not yet consume stressLevel / recoveryCost for adaptive rest beyond the existing RPE-driven path. Hookup is intentionally deferred until Phase K mutation surface stabilises.',
        ],
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
  return {
    id: 'L',
    title: 'Post-Workout Performance Feedback Adaptation Lock',
    purpose:
      'Convert logged workout performance (actual reps/hold/RPE/notes) into safe, bounded, future-only prescription mutations that flow through the same canonical session object the Program card and live workout already consume. The product remembers what happened and adjusts intelligently — never rewriting completed work, never erasing selected skills, never adding cosmetic-only labels.',
    status: 'PARTIAL',
    nextAction:
      'Move per-set evidence ledger from completion-time client-side capture to a canonical store accessible to the server generator so fresh regenerate paths can also read recent performance, not only the in-memory display overlay.',
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
    status: 'PARTIAL',
    nextAction:
      'Persist a server-readable per-set evidence ledger (server-side workout_log_set_evidence) so the authoritative generator can read recent performance history without depending on the client forwarding logs from localStorage.',
    subtasks: [
      {
        id: 'M.M1',
        title: 'Recent completedSetEvidence is server-readable or honestly marked unavailable',
        status: 'PARTIAL',
        evidence: [
          'Per-set completedSetEvidence is the authoritative input shape and is written client-side by lib/workout-log-service.ts.saveWorkoutLog into localStorage.',
          'The Neon `workout_logs` table only persists aggregate stats (id / sessionDate / focusArea / duration). Per-set evidence is NOT yet stored server-side.',
          'Bridge: the Program page forwards a JSON-safe top-14 trusted slice via getRecentWorkoutLogsForGenerationRequest() into the generation route body; the server-safe adapter (lib/server/performance-history-context.ts) sanitizes / caps (≤14 logs, ≤300 sets) / hashes and feeds the existing Phase L resolver.',
        ],
        remainingWork: [
          'Add a server-side workout_log_set_evidence table + writer so the authoritative generator can read per-set evidence directly without depending on the client transport.',
        ],
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
  ]

  // Active phase = the first phase whose status is not COMPLETE / DO_NOT_REDO.
  // If none, the system is FULLY_LOCKED.
  const active = phases.find(
    p => p.status !== 'COMPLETE' && p.status !== 'DO_NOT_REDO',
  )

  // Derive the overall verdict from the active phase id. This is more useful
  // for the proof line than a generic "PARTIAL" — it tells the user exactly
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
 * Program page proof line to render counts like "8 complete · 6 partial · 5
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
