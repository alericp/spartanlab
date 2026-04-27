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

  return {
    id: 'F',
    title: 'Canonical Program Object Lock',
    purpose: 'One final canonical program/session object beats stale, fallback, and projection sources.',
    status: 'PARTIAL',
    nextAction: 'Round-trip a saved program through getProgramState() and assert methodStructures + doctrineBlockResolution + doctrineParticipation survive. Add a hydration verifier that fails loudly if any field is dropped.',
    subtasks: [
      { id: 'F.F1', title: 'Authoritative program object identified', status: 'COMPLETE', evidence: ['runAuthoritativeProgramGeneration output'], remainingWork: [] },
      { id: 'F.F2', title: 'Authoritative session object identified', status: 'COMPLETE', evidence: ['program.sessions[]'], remainingWork: [] },
      { id: 'F.F3', title: 'Save/load/normalize preserves all method/doctrine fields', status: 'PARTIAL', evidence: sourceMapHealthy ? ['authoritativeSourceMap healthy on this program'] : ['live workout normalizer fixed in 4Q'], remainingWork: ['Re-audit getProgramState hydration', 'Add round-trip verifier for methodStructures + doctrineBlockResolution + doctrineParticipation'] },
      { id: 'F.F4', title: 'Fresh successful generation beats stale stored truth', status: 'PARTIAL', evidence: ['evaluateUnifiedProgramStaleness'], remainingWork: ['Cross-tab race not formally tested'] },
      { id: 'F.F5', title: 'Fallback objects cannot override healthy canonical truth', status: 'PARTIAL', evidence: ['createGuaranteedFallback gated'], remainingWork: ['Source-map verifier that flags fallback-controls-display'] },
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
    nextAction: 'Make canonical session.methodStructures the dominant body-render source for grouped blocks (currently styledGroups drives visibleMethodTally / body rendering, while methodStructures drives the new classified summary line).',
    subtasks: [
      { id: 'G.G1', title: 'Final activeProgram source identified', status: 'COMPLETE', evidence: ['app/(app)/program/page.tsx:authoritativeActiveProgram memo'], remainingWork: [] },
      { id: 'G.G2', title: 'Display projection is pure formatting', status: 'COMPLETE', evidence: ['buildProgramDisplayProjection does not pick exercises/methods'], remainingWork: [] },
      { id: 'G.G3', title: 'Old fallback/baby sources demoted', status: 'PARTIAL', evidence: ['lib/program/authoritative-program-source-map.ts demotes doctrineCausalChallenge to compatibility-only'], remainingWork: ['Add a runtime guard that rejects display projections containing exercise selections older than canonical session'] },
      { id: 'G.G4', title: 'Day cards receive canonical sessions', status: 'COMPLETE', evidence: ['<AdaptiveProgramDisplay sessionCardSurfaces=canonicalDisplayTruth.visibleSessionCards />'], remainingWork: [] },
      // [PHASE 4S] G5 evidence updated: SessionCardSurface now carries
      // canonical methodStructures and AdaptiveSessionCard renders them via a
      // classified summary line. Status stays PARTIAL because styledGroups is
      // still the primary source for grouped body rendering / visibleMethodTally
      // chips — methodStructures is now a parallel authoritative source, not
      // yet the dominant body-render source.
      { id: 'G.G5', title: 'Visible method blocks match canonical truth', status: 'PARTIAL', evidence: ['SessionCardSurface.methodStructures field added (Phase 4S)', 'buildSessionCardSurface copies session.methodStructures pass-through (Phase 4S)', 'AdaptiveSessionCard renders Phase 4S canonical delivery line via hasRenderableMethodStructure / readMethodStructuresFromSession'], remainingWork: ['Make session.methodStructures the dominant source for visibleMethodTally/MainExercisesRenderer grouped headers (styledGroups currently still drives body rendering)'] },
      // [PHASE 4S] G6 evidence updated: SessionCardSurface now carries
      // canonical doctrineBlockResolution[] and AdaptiveSessionCard renders
      // classified statuses (Applied / Already reflected / Blocked for safety
      // / No matching target / Not for this day / Needs audit) plus a
      // diagnostic line for BUG_* classifications. The runtime g6Status
      // gate still requires the program-level rollup to confirm 0 bugs.
      { id: 'G.G6', title: 'Yellow blocked labels map to true classifications', status: g6Status, evidence: blockResolutionRollup ? ['program.doctrineBlockResolutionRollup present', 'SessionCardSurface.doctrineBlockResolution field added (Phase 4S)', 'AdaptiveSessionCard renders classified statuses + bug diagnostic line via normalizeDoctrineBlockStatus (Phase 4S)'] : ['SessionCardSurface.doctrineBlockResolution field added (Phase 4S)', 'AdaptiveSessionCard renders classified statuses + bug diagnostic line via normalizeDoctrineBlockStatus (Phase 4S)'], remainingWork: g6Status === 'COMPLETE' ? [] : ['Resolve remaining BUG_* entries in program.doctrineBlockResolutionRollup'] },
    ],
  }
}

/** Phase H: Live Workout Parity Lock. */
function phaseH(): BlueprintPhase {
  return {
    id: 'H',
    title: 'Live Workout Parity Lock',
    purpose: 'Start Workout launches the same truth Program page shows.',
    status: 'PARTIAL',
    nextAction: 'Render grouped methodStructures (superset/circuit/density block) as interactive sequences inside LiveWorkoutExecutionSurface, not just preserved-as-guidance.',
    subtasks: [
      { id: 'H.H1', title: 'Selected variant Full/45/30 uses canonical selected session', status: 'COMPLETE', evidence: ['lib/workout/selected-variant-session-contract.ts'], remainingWork: [] },
      { id: 'H.H2', title: 'Live workout loader preserves methodStructures', status: 'COMPLETE', evidence: ['lib/workout/load-authoritative-session.ts (Phase 4Q fix)'], remainingWork: [] },
      { id: 'H.H3', title: 'Normalizer preserves styledGroups', status: 'COMPLETE', evidence: ['lib/workout/normalize-workout-session.ts'], remainingWork: [] },
      { id: 'H.H4', title: 'Live workout preserves row-level method fields', status: 'COMPLETE', evidence: ['setExecutionMethod', 'densityPrescription', 'doctrineApplicationDeltas', 'structuralMethodDeltas', 'targetWeightedRPE'], remainingWork: [] },
      { id: 'H.H5', title: 'Live workout does not silently flatten grouped methods', status: 'PARTIAL', evidence: ['data preserved as guidance'], remainingWork: ['Interactive grouped runtime'] },
      { id: 'H.H6', title: 'Honest partial parity reported when execution incomplete', status: 'COMPLETE', evidence: ['LIVE_GUIDANCE_PRESERVED_ONLY verdict'], remainingWork: [] },
    ],
  }
}

/** Phase I: Numeric Prescription Mutation Lock. */
function phaseI(): BlueprintPhase {
  return {
    id: 'I',
    title: 'Numeric Prescription Mutation Lock',
    purpose: 'Allow doctrine to safely change dosage once truth/source/display are locked.',
    status: 'NOT_STARTED',
    nextAction: 'Define safe mutation bounds for sets/reps/holds/rest/RPE in a new lib/program/numeric-prescription-mutation-contract.ts.',
    subtasks: [
      { id: 'I.I1', title: 'Define safe mutation bounds', status: 'NOT_STARTED', evidence: [], remainingWork: ['Write the contract'] },
      { id: 'I.I2', title: 'Protect skill-priority work from unsafe fatigue methods', status: 'NOT_STARTED', evidence: [], remainingWork: ['Use doctrineApplicationCorridor safety scan'] },
      { id: 'I.I3', title: 'Mutate only eligible rows', status: 'NOT_STARTED', evidence: [], remainingWork: ['Eligibility filter'] },
      { id: 'I.I4', title: 'Preserve conservative safety gates', status: 'NOT_STARTED', evidence: [], remainingWork: [] },
      { id: 'I.I5', title: 'Surface before/after dosage changes clearly', status: 'NOT_STARTED', evidence: [], remainingWork: ['Reuse doctrineApplicationDeltas[]'] },
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
