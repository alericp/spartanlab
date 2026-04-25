// =============================================================================
// [METHOD-MATERIALIZATION-SUMMARY-LOCK]
// SINGLE CANONICAL SESSION-LEVEL METHOD VERDICT
//
// PURPOSE
// Pre-summary, three independent visible-program owners each reconstructed
// session-level method truth from scattered raw fields:
//
//   1. app/(app)/program/page.tsx     -> runtimeParity per-method counters
//   2. components/program/GroupedProgramScannerStrip.tsx -> summarizeSession
//   3. components/programs/AdaptiveSessionCard.tsx       -> isGroupedBlocks /
//                                                           isMethodOnly status
//
// All three read the SAME inputs (styleMetadata.styledGroups, exercises[].
// {blockId, method, setExecutionMethod}, styleMetadata.clusterDecision) and
// applied NEARLY identical -- but independently maintained -- rules:
//   - "non-straight" filter
//   - min-members >= 2 gate for grouped blocks
//   - cluster-as-set-execution-not-grouped taxonomy split
//   - grouped-frame-owns-row-identity de-duplication
//
// Result: small drift between owners (e.g. scanner counts cluster as a
// method-only token; page counts clusterDecision sidecar as clusterSessions;
// card body uses variant-narrowed truth) and no single source of verdict.
// Future method intelligence improvements had to fight three reinterpreters.
//
// THIS MODULE
// Defines the ONE canonical session-level summary object the builder stamps
// onto session.styleMetadata.methodMaterializationSummary AFTER final
// method/group materialization has completed. Every visible consumer reads
// this summary FIRST, falling back to legacy derivation only when the
// summary is absent (older saved programs).
//
// MATERIALIZED ONLY -- NOT ELIGIBILITY
// The summary reflects only what actually materialized:
//   - styledGroups that survived the visible adapter's min-members + cluster-
//     strip rules
//   - exercises whose .method or .setExecutionMethod field was actually
//     written by the materialization passes
//   - the clusterDecision sidecar the builder writes only when cluster was
//     actually applied
//
// It is NOT populated from preferences, eligibility, intent contract, or
// "blueprint allowed" flags. Those signals already live elsewhere and stay
// there for evidence/audit purposes; this object is strictly the visible
// outcome.
// =============================================================================

export type MaterializedRenderMode = 'grouped' | 'flat_with_method_cues' | 'flat'

export type MaterializedGroupedMethod =
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'cluster'

export type MaterializedRowExecutionMethod =
  | 'superset'
  | 'circuit'
  | 'density'
  | 'cluster'
  | 'top_set'
  | 'drop_set'
  | 'rest_pause'

export interface MethodMaterializationSummary {
  /** True iff at least one renderable grouped block survived materialization. */
  groupedStructurePresent: boolean
  /** True iff any non-straight row-level method/set-execution cue exists outside a grouped block. */
  rowLevelMethodCuesPresent: boolean
  /** Single session-level mode the user actually sees. */
  dominantRenderMode: MaterializedRenderMode
  /** Renderable grouped blocks (superset + circuit + density_block; cluster excluded by taxonomy). */
  groupedBlockCount: number
  /** Per-method grouped block counts. Cluster is intentionally always 0 (set-execution method, not grouped). */
  groupedMethodCounts: {
    superset: number
    circuit: number
    density_block: number
    cluster: number
  }
  /** Per-method row-level execution counts (rows OUTSIDE renderable grouped blocks). */
  rowExecutionCounts: {
    superset: number
    circuit: number
    density: number
    cluster: number
    top_set: number
    drop_set: number
    rest_pause: number
  }
  /** Stable string union of every method that actually materialized somewhere in the session. */
  materializedMethods: string[]
  /**
   * Single dominant verdict the visible session expresses. Either a grouped
   * method ('superset'|'circuit'|'density_block'), a 'method_only_<method>'
   * tag for flat-with-method-cues sessions, or null for genuinely flat.
   */
  primaryPackagingOutcome: string | null
  sourceOfTruth: 'builder_materialized_session_summary'
  generatedAtBuildTime: true
}

// --- Pure-consumer minimal types ---------------------------------------------
// Declared here so the helper has zero coupling to AdaptiveSession's full type
// graph. Every visible consumer can pass its own narrow shape.
type ExerciseLike = {
  blockId?: string | null
  method?: string | null
  setExecutionMethod?: string | null
  name?: string | null
}
type StyledMemberLike = { name?: string | null }
type StyledGroupLike = {
  id?: string | null
  groupType?: string | null
  exercises?: StyledMemberLike[] | null
}
type ClusterDecisionLike = {
  targetExerciseId?: string | null
  kind?: string | null
}
export type MaterializedSessionLike = {
  exercises?: ExerciseLike[] | null
  styleMetadata?: {
    styledGroups?: StyledGroupLike[] | null
    clusterDecision?: ClusterDecisionLike | null
    methodMaterializationSummary?: MethodMaterializationSummary | null
  } | null
}

// --- Internal normalizers ----------------------------------------------------
// MIN_MEMBERS mirrors the visible adapter's `minMembersFor`: every grouped
// method requires >= 2 usable members to render as a framed block. Cluster is
// also gated at >= 2 in the adapter but is additionally STRIPPED from grouped
// rendering by the taxonomy lock, so the summary never counts cluster as a
// grouped block (groupedMethodCounts.cluster stays 0 by construction).
const MIN_MEMBERS_FOR_GROUPED_BLOCK = 2

function hasUsableName(n: string | null | undefined): boolean {
  return typeof n === 'string' && n.trim().length >= 2
}

function normalizeGrouped(
  raw: string | null | undefined,
): MaterializedGroupedMethod | null {
  if (!raw) return null
  const m = raw.toLowerCase().trim()
  if (m === 'superset') return 'superset'
  if (m === 'circuit') return 'circuit'
  if (m === 'density' || m === 'density_block') return 'density_block'
  if (m === 'cluster' || m === 'cluster_set' || m === 'cluster_sets') return 'cluster'
  return null
}

function normalizeRowExec(
  raw: string | null | undefined,
): MaterializedRowExecutionMethod | null {
  if (!raw) return null
  const m = raw.toLowerCase().trim()
  if (m === 'superset') return 'superset'
  if (m === 'circuit' || m === 'circuits') return 'circuit'
  if (m === 'density' || m === 'density_block') return 'density'
  if (m === 'cluster' || m === 'cluster_set' || m === 'cluster_sets') return 'cluster'
  if (m === 'top_set' || m === 'top-set') return 'top_set'
  if (m === 'drop_set' || m === 'drop-set') return 'drop_set'
  if (m === 'rest_pause' || m === 'rest-pause') return 'rest_pause'
  if (m === 'straight' || m === 'straight_sets') return null
  return null
}

// --- Builder-owned derivation ------------------------------------------------
/**
 * [BUILDER OWNER] Derive the canonical method materialization summary from a
 * session that has FINISHED method materialization. Call from the builder
 * AFTER finalStyledGroups + appliedMethods + clusterDecision are locked.
 *
 * Pure function. Does not mutate the session.
 */
export function deriveMethodMaterializationSummary(
  session: MaterializedSessionLike,
): MethodMaterializationSummary {
  const exercises: ExerciseLike[] = Array.isArray(session.exercises)
    ? (session.exercises as ExerciseLike[])
    : []
  const styled: StyledGroupLike[] = Array.isArray(session.styleMetadata?.styledGroups)
    ? (session.styleMetadata!.styledGroups as StyledGroupLike[])
    : []
  const clusterDecision = session.styleMetadata?.clusterDecision || null

  // -------------------------------------------------------------------------
  // GROUPED BLOCK COUNTS -- mirrors visible adapter (Priority 1: styledGroups,
  // Priority 2: exercise blockId+method fallback). Cluster styledGroups are
  // explicitly excluded per the taxonomy lock (set-execution method, not
  // grouped structure).
  // -------------------------------------------------------------------------
  const groupedMethodCounts: MethodMaterializationSummary['groupedMethodCounts'] = {
    superset: 0,
    circuit: 0,
    density_block: 0,
    cluster: 0, // intentionally always 0 by taxonomy
  }

  // Priority 1: styledGroups -> non-straight + non-cluster + usable members + >= MIN
  let priority1Hit = false
  for (const g of styled) {
    const t = normalizeGrouped(g?.groupType)
    if (!t) continue
    if (t === 'cluster') continue // taxonomy lock: cluster is set-execution, not grouped
    const members = Array.isArray(g?.exercises) ? g!.exercises! : []
    const usable = members.filter(m => hasUsableName(m?.name))
    if (usable.length < MIN_MEMBERS_FOR_GROUPED_BLOCK) continue
    groupedMethodCounts[t] += 1
    priority1Hit = true
  }

  // Priority 2 (fallback): exercises sharing blockId + non-straight method
  if (!priority1Hit) {
    type BlockEntry = { method: MaterializedGroupedMethod; usableMembers: number }
    const blockMap = new Map<string, BlockEntry>()
    for (const ex of exercises) {
      if (!ex?.blockId) continue
      const t = normalizeGrouped(ex?.method)
      if (!t || t === 'cluster') continue
      const e = blockMap.get(ex.blockId) || { method: t, usableMembers: 0 }
      if (hasUsableName(ex?.name)) e.usableMembers += 1
      blockMap.set(ex.blockId, e)
    }
    for (const [, info] of blockMap) {
      if (info.usableMembers < MIN_MEMBERS_FOR_GROUPED_BLOCK) continue
      groupedMethodCounts[info.method] += 1
    }
  }

  const groupedBlockCount =
    groupedMethodCounts.superset +
    groupedMethodCounts.circuit +
    groupedMethodCounts.density_block

  // -------------------------------------------------------------------------
  // RENDERABLE BLOCK IDS -- so row-level cue counting below skips members
  // that are visibly OWNED by a renderable grouped block. Mirrors the
  // scanner's "consumedByGroupBlockIds" rule.
  // -------------------------------------------------------------------------
  const renderableBlockIds = new Set<string>()
  // Build per-blockId usable-member counts from exercises (works for both
  // priority paths since exercise blockId is the ground truth for membership).
  const blockUsable = new Map<string, number>()
  for (const ex of exercises) {
    if (!ex?.blockId) continue
    const t = normalizeGrouped(ex?.method)
    if (!t || t === 'cluster') continue
    blockUsable.set(ex.blockId, (blockUsable.get(ex.blockId) || 0) + (hasUsableName(ex?.name) ? 1 : 0))
  }
  for (const [bId, n] of blockUsable) {
    if (n >= MIN_MEMBERS_FOR_GROUPED_BLOCK) renderableBlockIds.add(bId)
  }

  // -------------------------------------------------------------------------
  // ROW-LEVEL EXECUTION COUNTS -- rows that DO NOT belong to a renderable
  // grouped block. setExecutionMethod takes priority (cluster, rest_pause,
  // top_set, drop_set live there per METHOD-TAXONOMY-LOCK), then legacy
  // .method as fallback.
  // -------------------------------------------------------------------------
  const rowExecutionCounts: MethodMaterializationSummary['rowExecutionCounts'] = {
    superset: 0,
    circuit: 0,
    density: 0,
    cluster: 0,
    top_set: 0,
    drop_set: 0,
    rest_pause: 0,
  }
  for (const ex of exercises) {
    const inRenderableGroupedBlock =
      typeof ex?.blockId === 'string' &&
      ex.blockId.length > 0 &&
      renderableBlockIds.has(ex.blockId)
    if (inRenderableGroupedBlock) continue
    const resolved = normalizeRowExec(ex?.setExecutionMethod) || normalizeRowExec(ex?.method)
    if (!resolved) continue
    rowExecutionCounts[resolved] += 1
  }

  // Session-level cluster sidecar evidence: builder writes `clusterDecision`
  // only when cluster was actually materialized for this session. If per-row
  // tags survived save, this is already counted above; if a downstream
  // whitelist stripped them, the sidecar still proves cluster materialized.
  if (
    clusterDecision &&
    typeof clusterDecision.targetExerciseId === 'string' &&
    clusterDecision.targetExerciseId.length > 0 &&
    rowExecutionCounts.cluster === 0
  ) {
    rowExecutionCounts.cluster = 1
  }

  // -------------------------------------------------------------------------
  // DERIVED FLAGS + DOMINANT RENDER MODE
  // -------------------------------------------------------------------------
  const groupedStructurePresent = groupedBlockCount > 0
  const rowLevelMethodCuesPresent =
    rowExecutionCounts.superset > 0 ||
    rowExecutionCounts.circuit > 0 ||
    rowExecutionCounts.density > 0 ||
    rowExecutionCounts.cluster > 0 ||
    rowExecutionCounts.top_set > 0 ||
    rowExecutionCounts.drop_set > 0 ||
    rowExecutionCounts.rest_pause > 0

  const dominantRenderMode: MaterializedRenderMode = groupedStructurePresent
    ? 'grouped'
    : rowLevelMethodCuesPresent
      ? 'flat_with_method_cues'
      : 'flat'

  // -------------------------------------------------------------------------
  // MATERIALIZED METHODS UNION + PRIMARY PACKAGING OUTCOME
  // -------------------------------------------------------------------------
  const materializedMethodsSet = new Set<string>()
  if (groupedMethodCounts.superset > 0) materializedMethodsSet.add('superset')
  if (groupedMethodCounts.circuit > 0) materializedMethodsSet.add('circuit')
  if (groupedMethodCounts.density_block > 0) materializedMethodsSet.add('density_block')
  if (rowExecutionCounts.superset > 0) materializedMethodsSet.add('superset')
  if (rowExecutionCounts.circuit > 0) materializedMethodsSet.add('circuit')
  if (rowExecutionCounts.density > 0) materializedMethodsSet.add('density_block')
  if (rowExecutionCounts.cluster > 0) materializedMethodsSet.add('cluster')
  if (rowExecutionCounts.top_set > 0) materializedMethodsSet.add('top_set')
  if (rowExecutionCounts.drop_set > 0) materializedMethodsSet.add('drop_set')
  if (rowExecutionCounts.rest_pause > 0) materializedMethodsSet.add('rest_pause')

  let primaryPackagingOutcome: string | null = null
  if (groupedStructurePresent) {
    const order: MaterializedGroupedMethod[] = ['superset', 'circuit', 'density_block']
    let best: MaterializedGroupedMethod | null = null
    let bestCount = 0
    for (const m of order) {
      if (groupedMethodCounts[m] > bestCount) {
        best = m
        bestCount = groupedMethodCounts[m]
      }
    }
    if (best) primaryPackagingOutcome = best
  } else if (rowLevelMethodCuesPresent) {
    const order: MaterializedRowExecutionMethod[] = [
      'cluster',
      'top_set',
      'rest_pause',
      'drop_set',
      'superset',
      'circuit',
      'density',
    ]
    let best: MaterializedRowExecutionMethod | null = null
    let bestCount = 0
    for (const m of order) {
      if (rowExecutionCounts[m] > bestCount) {
        best = m
        bestCount = rowExecutionCounts[m]
      }
    }
    if (best) primaryPackagingOutcome = `method_only_${best}`
  }

  return {
    groupedStructurePresent,
    rowLevelMethodCuesPresent,
    dominantRenderMode,
    groupedBlockCount,
    groupedMethodCounts,
    rowExecutionCounts,
    materializedMethods: Array.from(materializedMethodsSet),
    primaryPackagingOutcome,
    sourceOfTruth: 'builder_materialized_session_summary',
    generatedAtBuildTime: true,
  }
}

// --- Pure consumer accessor --------------------------------------------------
/**
 * [PRIMARY-CONSUMER-READ] Returns the canonical summary if the builder stamped
 * one onto this session, otherwise null. Visible-program owners use this as
 * their PRIMARY truth source and only fall back to scattered-field derivation
 * when this returns null (older saved programs / load-corridor strip cases).
 */
export function readMethodMaterializationSummary(
  session: MaterializedSessionLike | null | undefined,
): MethodMaterializationSummary | null {
  return session?.styleMetadata?.methodMaterializationSummary ?? null
}
