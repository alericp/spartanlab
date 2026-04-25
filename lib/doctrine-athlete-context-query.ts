// =============================================================================
// DOCTRINE ATHLETE-CONTEXT QUERY — V2 BUILDER-READABLE RETRIEVAL
// =============================================================================
//
// PURPOSE
// -------
// This is the SINGLE typed retrieval entry point the future builder will
// call to ask "given THIS athlete + THIS day-role + THIS phase, what
// doctrine should I follow?" — and get back a structured, conflict-resolved
// `BuilderReadableDoctrineResult` with hard constraints, soft preferences,
// blocked methods, eligible methods, dosage hints, and source-tagged
// evidence.
//
// IT IS *NOT* A SHADOW BUILDER
// ----------------------------
// The existing `lib/doctrine-query-service.ts` is the read surface for
// LEGACY/v1 atoms (the 153 rows currently in the database from prior
// passes). This module is the read surface for V2 atoms — atoms that
// have been authored through the typed `validateDoctrineAtomCandidate`
// gate and therefore have `applies_when_json`, `priority_type`,
// `intelligence_tier`, and `confidence_weight` populated.
//
// Both surfaces query the SAME tables. There is no parallel data path.
// The split is on data shape, not on data location: V2 atoms have
// V2 columns populated, V1 atoms do not. As V1 atoms are upgraded over
// time, they migrate from the legacy surface to this one without any
// schema fork.
//
// HONEST CURRENT STATE
// --------------------
// At the time this module ships, ZERO atoms have been written through
// the V2 ingestion contract — the 8 PDF sources are seeded but inert
// (`is_active=false`, `ingestion_status='awaiting_extraction'`). So
// every query against this module currently returns
// `{ atomsTotal: 0, status: 'no_v2_atoms_yet', ... }`. That is correct.
// It is the honest signal to the builder that V2 doctrine is the
// architecture layer ready to receive content, not the content itself.
// =============================================================================

import { sql } from './doctrine-db'
import type {
  DoctrineDomain,
  DoctrinePriorityType,
  DoctrineIntelligenceTier,
  DoctrineAppliesWhen,
} from './doctrine-ingestion-contract'

// -----------------------------------------------------------------------------
// SECTION 1 — ATHLETE CONTEXT (Layer 7 input)
// -----------------------------------------------------------------------------

export interface AthleteContext {
  /** Training age — calibrates which sources defer to which. */
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  /** Active training goals (multi-select). */
  goals: Array<
    | 'general_strength'
    | 'weighted_calisthenics_strength'
    | 'bodyweight_skill'
    | 'front_lever'
    | 'planche'
    | 'one_arm_pull_up'
    | 'muscle_up'
    | 'handstand_push_up'
    | 'hypertrophy'
    | 'tendon_resilience'
    | 'recovery'
    | 'general_conditioning'
  >
  /** Current phase of the macrocycle. */
  phase: 'acclimation' | 'build' | 'peak' | 'deload' | 'maintenance'
  /** The role the requesting day plays in the week. */
  dayRole:
    | 'primary_strength_emphasis'
    | 'skill_quality_emphasis'
    | 'broad_mixed_volume'
    | 'secondary_support'
    | 'density_capacity'
    | 'recovery_supportive'
  /** Sessions per week available. */
  sessionsPerWeek: number
  /** Equipment the athlete has. */
  equipment: Array<'pull_up_bar' | 'rings' | 'dip_bars' | 'belt_for_load' | 'bands' | 'parallettes'>
  /** Fatigue/recovery state. */
  recoveryState: 'fresh' | 'normal' | 'fatigued' | 'recovering_from_injury'
  /** Optional injury / pain modifiers (free-form, lowercase keys). */
  jointCautions?: string[]
  /** Optional exercise families the athlete prioritizes (e.g. ['weighted_pull_up']). */
  prioritizedExerciseFamilies?: string[]
  /** Optional skill targets (e.g. ['front_lever']). */
  prioritizedSkillTargets?: string[]
}

// -----------------------------------------------------------------------------
// SECTION 2 — BUILDER-READABLE RESULT SHAPE (Layer 10 output)
// -----------------------------------------------------------------------------

/** A single atom as the builder consumes it — flattened, typed. */
export interface BuilderReadableAtom {
  doctrineAtomId: string
  sourceId: string
  sourceTitle: string
  sourceAuthor: string | null
  doctrineDomain: DoctrineDomain
  doctrineCategory: string
  title: string
  plainLanguageRule: string
  computationFriendlyRule: Record<string, unknown>
  priorityType: DoctrinePriorityType
  intelligenceTier: DoctrineIntelligenceTier
  effectiveScore: number
  confidenceWeight: number
  conflictGroupId: string | null
  evidenceSnippet: string | null
  appliesWhen: DoctrineAppliesWhen | null
}

/** Final builder-facing result. Stable shape — the contract the builder reads. */
export interface BuilderReadableDoctrineResult {
  /** Echo of the input context (so the builder can log what it asked for). */
  context: AthleteContext
  /** Total atoms that matched (pre-conflict-resolution). */
  atomsMatchedRaw: number
  /** Total atoms after conflict resolution. */
  atomsTotal: number
  /** Hard constraints the builder MUST respect. */
  hardConstraints: BuilderReadableAtom[]
  /** Strong preferences (override soft preferences, respect hard constraints). */
  strongPreferences: BuilderReadableAtom[]
  /** Soft preferences (advisory ranking). */
  softPreferences: BuilderReadableAtom[]
  /** Informational atoms (evidence/notes only). */
  informational: BuilderReadableAtom[]
  /** Method names that are explicitly BLOCKED for this context. */
  blockedMethods: string[]
  /** Method names that are explicitly ELIGIBLE for this context. */
  eligibleMethods: string[]
  /** Exercise families that are explicitly contraindicated for this context. */
  contraindicatedExerciseFamilies: string[]
  /** Atoms scoped to the BASE-WEEK intelligence tier only. */
  baseWeekAtoms: BuilderReadableAtom[]
  /** Atoms scoped to the PHASE-WEEK modulation tier only. */
  phaseModulationAtoms: BuilderReadableAtom[]
  /** Per-source counts so the builder/UI can show "doctrine derived from X". */
  perSourceContribution: Array<{ sourceId: string; sourceTitle: string; atomCount: number }>
  /** Conflict groups that fired in this query and how they were resolved. */
  conflictsResolved: Array<{
    conflictGroupId: string
    winningSourceId: string
    losingSourceIds: string[]
    rationale: string
  }>
  /**
   * Status flag for the builder. When zero V2 atoms exist (current state),
   * this is `no_v2_atoms_yet` and the builder should fall back to the
   * existing v1 query service. Once PDFs are extracted, this becomes `ok`.
   */
  status: 'ok' | 'no_v2_atoms_yet' | 'partial_extraction'
  /** Human-readable summary of what was returned (for admin/debug logs). */
  summary: string
}

// -----------------------------------------------------------------------------
// SECTION 3 — V2 ATOM ROW SHAPE (DB read) — internal
// -----------------------------------------------------------------------------

interface V2AtomRow {
  id: string
  source_id: string
  source_title: string
  source_author: string | null
  source_default_weight: number | null
  doctrine_domain: string
  doctrine_category: string
  title: string
  plain_language_rule: string
  computation_friendly_rule_json: Record<string, unknown> | null
  applies_when_json: DoctrineAppliesWhen | null
  does_not_apply_when_json: DoctrineAppliesWhen | null
  priority_type: string
  intelligence_tier: string
  confidence_weight: number | null
  conflict_group_id: string | null
  evidence_snippet: string | null
  table_origin: string
  contraindicated_exercise_families: string[] | null
  blocked_methods: string[] | null
  eligible_methods: string[] | null
}

// -----------------------------------------------------------------------------
// SECTION 4 — V2 UNION QUERY
// -----------------------------------------------------------------------------
// Pulls only atoms with V2 fields populated, across all 8 doctrine atom
// tables. Joins source for title/author. Filters out inert sources
// (is_active = false / ingestion_status != 'ingested') so seeded-but-not-yet-
// extracted PDFs cannot influence builder output.
// -----------------------------------------------------------------------------

async function fetchAllV2Atoms(): Promise<V2AtomRow[]> {
  // We pull from all 8 atom tables that received V2 columns in migration 015.
  // Each SELECT projects to the same column shape, then UNION ALL.
  // [V2 GATE] Three filters per row:
  //   1. priority_type IS NOT NULL    (atom was authored under V2)
  //   2. applies_when_json IS NOT NULL (atom is retrievable)
  //   3. s.is_active = TRUE AND s.ingestion_status = 'ingested'
  //      (source is fully through the gate, not awaiting extraction)
  const rows = (await sql`
    WITH v2_atoms AS (
      SELECT
        m.id::text AS id,
        m.source_id,
        m.method_name AS title,
        m.description AS plain_language_rule,
        m.applies_when_json,
        m.does_not_apply_when_json,
        m.computation_friendly_rule_json,
        m.priority_type,
        m.intelligence_tier,
        m.confidence_weight,
        m.conflict_group_id,
        m.evidence_snippet,
        ('method:' || m.method_name) AS doctrine_category,
        CASE m.method_name
          WHEN 'top_set' THEN 'top_set_logic'
          WHEN 'cluster' THEN 'top_set_logic'
          WHEN 'drop_set' THEN 'drop_set_logic'
          WHEN 'superset' THEN 'superset_logic'
          WHEN 'circuit' THEN 'circuit_logic'
          WHEN 'finisher' THEN 'density_logic'
          ELSE 'exercise_selection_logic'
        END AS doctrine_domain,
        'method_rules'::text AS table_origin,
        NULL::text[] AS contraindicated_exercise_families,
        NULL::text[] AS blocked_methods,
        NULL::text[] AS eligible_methods
      FROM method_rules m
      WHERE m.priority_type IS NOT NULL AND m.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        p.id::text,
        p.source_id,
        p.role_target AS title,
        p.notes AS plain_language_rule,
        p.applies_when_json,
        p.does_not_apply_when_json,
        p.computation_friendly_rule_json,
        p.priority_type,
        p.intelligence_tier,
        p.confidence_weight,
        p.conflict_group_id,
        p.evidence_snippet,
        ('prescription:' || p.role_target || ':' || COALESCE(p.athlete_level, 'any')) AS doctrine_category,
        'set_count_logic' AS doctrine_domain,
        'prescription_rules'::text,
        NULL::text[], NULL::text[], NULL::text[]
      FROM prescription_rules p
      WHERE p.priority_type IS NOT NULL AND p.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        e.id::text,
        e.source_id,
        e.rule_type AS title,
        e.notes AS plain_language_rule,
        e.applies_when_json,
        e.does_not_apply_when_json,
        e.computation_friendly_rule_json,
        e.priority_type,
        e.intelligence_tier,
        e.confidence_weight,
        e.conflict_group_id,
        e.evidence_snippet,
        ('selection:' || e.rule_type) AS doctrine_category,
        'exercise_selection_logic' AS doctrine_domain,
        'exercise_selection_rules'::text,
        NULL::text[], NULL::text[], NULL::text[]
      FROM exercise_selection_rules e
      WHERE e.priority_type IS NOT NULL AND e.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        c.id::text,
        c.source_id,
        c.exercise_name AS title,
        c.notes AS plain_language_rule,
        c.applies_when_json,
        c.does_not_apply_when_json,
        c.computation_friendly_rule_json,
        c.priority_type,
        c.intelligence_tier,
        c.confidence_weight,
        c.conflict_group_id,
        c.evidence_snippet,
        ('contraindication:' || c.exercise_name) AS doctrine_category,
        'pain_modification_logic' AS doctrine_domain,
        'exercise_contraindication_rules'::text,
        ARRAY[c.exercise_name]::text[] AS contraindicated_exercise_families,
        NULL::text[], NULL::text[]
      FROM exercise_contraindication_rules c
      WHERE c.priority_type IS NOT NULL AND c.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        pr.id::text,
        pr.source_id,
        pr.exercise_name AS title,
        pr.notes AS plain_language_rule,
        pr.applies_when_json,
        pr.does_not_apply_when_json,
        pr.computation_friendly_rule_json,
        pr.priority_type,
        pr.intelligence_tier,
        pr.confidence_weight,
        pr.conflict_group_id,
        pr.evidence_snippet,
        ('prerequisite:' || pr.exercise_name) AS doctrine_category,
        'athlete_prerequisites' AS doctrine_domain,
        'exercise_prerequisite_rules'::text,
        NULL::text[], NULL::text[], NULL::text[]
      FROM exercise_prerequisite_rules pr
      WHERE pr.priority_type IS NOT NULL AND pr.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        pg.id::text,
        pg.source_id,
        pg.exercise_name AS title,
        pg.notes AS plain_language_rule,
        pg.applies_when_json,
        pg.does_not_apply_when_json,
        pg.computation_friendly_rule_json,
        pg.priority_type,
        pg.intelligence_tier,
        pg.confidence_weight,
        pg.conflict_group_id,
        pg.evidence_snippet,
        ('progression:' || pg.exercise_name) AS doctrine_category,
        'progression_selection_logic' AS doctrine_domain,
        'progression_rules'::text,
        NULL::text[], NULL::text[], NULL::text[]
      FROM progression_rules pg
      WHERE pg.priority_type IS NOT NULL AND pg.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        sc.id::text,
        sc.source_id,
        (sc.from_exercise || '_to_' || sc.to_exercise) AS title,
        sc.notes AS plain_language_rule,
        sc.applies_when_json,
        sc.does_not_apply_when_json,
        sc.computation_friendly_rule_json,
        sc.priority_type,
        sc.intelligence_tier,
        sc.confidence_weight,
        sc.conflict_group_id,
        sc.evidence_snippet,
        'carryover' AS doctrine_category,
        'skill_progression_logic' AS doctrine_domain,
        'skill_carryover_rules'::text,
        NULL::text[], NULL::text[], NULL::text[]
      FROM skill_carryover_rules sc
      WHERE sc.priority_type IS NOT NULL AND sc.applies_when_json IS NOT NULL

      UNION ALL

      SELECT
        tp.id::text,
        tp.source_id,
        tp.principle_name AS title,
        tp.description AS plain_language_rule,
        tp.applies_when_json,
        tp.does_not_apply_when_json,
        tp.computation_friendly_rule_json,
        tp.priority_type,
        tp.intelligence_tier,
        tp.confidence_weight,
        tp.conflict_group_id,
        tp.evidence_snippet,
        'principle' AS doctrine_category,
        'movement_pattern_logic' AS doctrine_domain,
        'training_doctrine_principles'::text,
        NULL::text[], NULL::text[], NULL::text[]
      FROM training_doctrine_principles tp
      WHERE tp.priority_type IS NOT NULL AND tp.applies_when_json IS NOT NULL
    )
    SELECT
      a.id,
      a.source_id,
      s.title AS source_title,
      s.author AS source_author,
      s.confidence_weight_default AS source_default_weight,
      a.doctrine_domain,
      a.doctrine_category,
      a.title,
      a.plain_language_rule,
      a.computation_friendly_rule_json,
      a.applies_when_json,
      a.does_not_apply_when_json,
      a.priority_type,
      a.intelligence_tier,
      a.confidence_weight,
      a.conflict_group_id,
      a.evidence_snippet,
      a.table_origin,
      a.contraindicated_exercise_families,
      a.blocked_methods,
      a.eligible_methods
    FROM v2_atoms a
    INNER JOIN training_doctrine_sources s ON s.id = a.source_id
    WHERE s.is_active = TRUE AND s.ingestion_status = 'ingested'
  `) as unknown as V2AtomRow[]

  return rows
}

// -----------------------------------------------------------------------------
// SECTION 5 — APPLIES-WHEN MATCHING
// -----------------------------------------------------------------------------
// Deterministic match. An empty/absent field on the atom = "any." A populated
// field MUST contain the context value, otherwise the atom is filtered out.
// -----------------------------------------------------------------------------

function arrayMatchesAny<T>(atomList: T[] | undefined, contextValue: T): boolean {
  if (!atomList || atomList.length === 0) return true
  return atomList.includes(contextValue)
}

function arrayHasAnyOverlap<T>(atomList: T[] | undefined, contextList: T[]): boolean {
  if (!atomList || atomList.length === 0) return true
  if (!contextList || contextList.length === 0) return false
  return atomList.some((v) => contextList.includes(v))
}

function appliesToContext(atom: V2AtomRow, ctx: AthleteContext): boolean {
  const aw = atom.applies_when_json
  if (!aw) return false // V2 atoms must have applies_when_json
  // Hard exclusions first
  const not = atom.does_not_apply_when_json
  if (not) {
    if (not.athleteLevels && not.athleteLevels.includes(ctx.level)) return false
    if (not.phases && not.phases.includes(ctx.phase)) return false
    if (not.dayRoles && not.dayRoles.includes(ctx.dayRole)) return false
    if (not.recoveryStates && not.recoveryStates.includes(ctx.recoveryState)) return false
    if (not.goals && not.goals.some((g) => ctx.goals.includes(g))) return false
  }
  // Positive matches
  if (!arrayMatchesAny(aw.athleteLevels, ctx.level)) return false
  if (!arrayMatchesAny(aw.phases, ctx.phase)) return false
  if (!arrayMatchesAny(aw.dayRoles, ctx.dayRole)) return false
  if (!arrayMatchesAny(aw.recoveryStates, ctx.recoveryState)) return false
  if (aw.goals && !aw.goals.some((g) => ctx.goals.includes(g))) return false
  if (!arrayHasAnyOverlap(aw.equipment, ctx.equipment)) return false
  if (aw.sessionsPerWeek) {
    if (typeof aw.sessionsPerWeek.min === 'number' && ctx.sessionsPerWeek < aw.sessionsPerWeek.min) return false
    if (typeof aw.sessionsPerWeek.max === 'number' && ctx.sessionsPerWeek > aw.sessionsPerWeek.max) return false
  }
  if (aw.exerciseFamilies && ctx.prioritizedExerciseFamilies) {
    if (!aw.exerciseFamilies.some((f) => ctx.prioritizedExerciseFamilies!.includes(f))) return false
  }
  return true
}

// -----------------------------------------------------------------------------
// SECTION 6 — SCORING & CONFLICT RESOLUTION
// -----------------------------------------------------------------------------
// Effective score = priorityWeight * confidenceWeight * sourceWeight.
// Conflict groups: the highest-effective-score atom wins; losing atoms
// are filtered out and recorded in `conflictsResolved`.
// -----------------------------------------------------------------------------

const PRIORITY_WEIGHT: Record<DoctrinePriorityType, number> = {
  hard_constraint: 4.0,
  strong_preference: 2.5,
  soft_preference: 1.5,
  informational: 0.5,
}

function effectiveScoreOf(atom: V2AtomRow): number {
  const pw = PRIORITY_WEIGHT[atom.priority_type as DoctrinePriorityType] ?? 1.0
  const cw = atom.confidence_weight ?? 1.0
  const sw = atom.source_default_weight ?? 1.0
  return pw * cw * sw
}

function toBuilderReadable(atom: V2AtomRow): BuilderReadableAtom {
  return {
    doctrineAtomId: atom.id,
    sourceId: atom.source_id,
    sourceTitle: atom.source_title,
    sourceAuthor: atom.source_author,
    doctrineDomain: atom.doctrine_domain as DoctrineDomain,
    doctrineCategory: atom.doctrine_category,
    title: atom.title,
    plainLanguageRule: atom.plain_language_rule,
    computationFriendlyRule: atom.computation_friendly_rule_json ?? {},
    priorityType: atom.priority_type as DoctrinePriorityType,
    intelligenceTier: atom.intelligence_tier as DoctrineIntelligenceTier,
    effectiveScore: effectiveScoreOf(atom),
    confidenceWeight: atom.confidence_weight ?? 1.0,
    conflictGroupId: atom.conflict_group_id,
    evidenceSnippet: atom.evidence_snippet,
    appliesWhen: atom.applies_when_json,
  }
}

function resolveConflicts(matched: V2AtomRow[]): {
  kept: V2AtomRow[]
  resolved: BuilderReadableDoctrineResult['conflictsResolved']
} {
  const groups = new Map<string, V2AtomRow[]>()
  const ungrouped: V2AtomRow[] = []
  for (const a of matched) {
    if (a.conflict_group_id) {
      const arr = groups.get(a.conflict_group_id) ?? []
      arr.push(a)
      groups.set(a.conflict_group_id, arr)
    } else {
      ungrouped.push(a)
    }
  }
  const kept: V2AtomRow[] = [...ungrouped]
  const resolved: BuilderReadableDoctrineResult['conflictsResolved'] = []
  for (const [gid, atoms] of groups.entries()) {
    if (atoms.length === 1) {
      kept.push(atoms[0])
      continue
    }
    const sorted = [...atoms].sort((a, b) => effectiveScoreOf(b) - effectiveScoreOf(a))
    const winner = sorted[0]
    const losers = sorted.slice(1)
    kept.push(winner)
    resolved.push({
      conflictGroupId: gid,
      winningSourceId: winner.source_id,
      losingSourceIds: losers.map((l) => l.source_id),
      rationale: `Highest effective score (${effectiveScoreOf(winner).toFixed(2)}) — priority=${winner.priority_type}, confidence=${winner.confidence_weight ?? 1}, sourceWeight=${winner.source_default_weight ?? 1}.`,
    })
  }
  return { kept, resolved }
}

// -----------------------------------------------------------------------------
// SECTION 7 — PUBLIC ENTRY POINT
// -----------------------------------------------------------------------------

/**
 * SINGLE V2 retrieval entry point. Returns a stable, typed
 * BuilderReadableDoctrineResult. The future builder consumes this. UI
 * surfaces consume this. Logs/audits consume this. There is no other
 * V2 retrieval path.
 *
 * Fail-closed semantics: if ZERO V2 atoms exist (current state), returns
 * `status: 'no_v2_atoms_yet'` with empty arrays. Builder falls back to
 * existing v1 query service. That keeps the system honest.
 */
export async function queryDoctrineForAthleteContext(
  ctx: AthleteContext,
): Promise<BuilderReadableDoctrineResult> {
  let allAtoms: V2AtomRow[] = []
  try {
    allAtoms = await fetchAllV2Atoms()
  } catch (err) {
    // DB unavailable: return empty result with honest status.
    return emptyResult(ctx, 'no_v2_atoms_yet', `Doctrine read failed: ${(err as Error).message}`)
  }

  if (allAtoms.length === 0) {
    return emptyResult(
      ctx,
      'no_v2_atoms_yet',
      'No V2 doctrine atoms exist yet. Source registry is seeded but PDFs are awaiting extraction. Builder should fall back to v1 doctrine query service.',
    )
  }

  // Filter to atoms whose appliesWhen matches the athlete context.
  const matched = allAtoms.filter((a) => appliesToContext(a, ctx))

  // Conflict-resolve grouped atoms.
  const { kept, resolved } = resolveConflicts(matched)

  // Sort each lane by effective score, descending.
  const sortedKept = [...kept].sort((a, b) => effectiveScoreOf(b) - effectiveScoreOf(a))

  const hardConstraints: BuilderReadableAtom[] = []
  const strongPreferences: BuilderReadableAtom[] = []
  const softPreferences: BuilderReadableAtom[] = []
  const informational: BuilderReadableAtom[] = []
  const baseWeekAtoms: BuilderReadableAtom[] = []
  const phaseModulationAtoms: BuilderReadableAtom[] = []
  const blockedMethodsSet = new Set<string>()
  const eligibleMethodsSet = new Set<string>()
  const contraindicatedFamiliesSet = new Set<string>()
  const perSource = new Map<string, { sourceId: string; sourceTitle: string; atomCount: number }>()

  for (const a of sortedKept) {
    const br = toBuilderReadable(a)
    switch (a.priority_type) {
      case 'hard_constraint':
        hardConstraints.push(br)
        break
      case 'strong_preference':
        strongPreferences.push(br)
        break
      case 'soft_preference':
        softPreferences.push(br)
        break
      case 'informational':
        informational.push(br)
        break
    }
    if (a.intelligence_tier === 'base_week_intelligence') baseWeekAtoms.push(br)
    if (a.intelligence_tier === 'phase_week_modulation') phaseModulationAtoms.push(br)
    if (a.blocked_methods) for (const m of a.blocked_methods) blockedMethodsSet.add(m)
    if (a.eligible_methods) for (const m of a.eligible_methods) eligibleMethodsSet.add(m)
    if (a.contraindicated_exercise_families)
      for (const f of a.contraindicated_exercise_families) contraindicatedFamiliesSet.add(f)
    const entry = perSource.get(a.source_id) ?? { sourceId: a.source_id, sourceTitle: a.source_title, atomCount: 0 }
    entry.atomCount += 1
    perSource.set(a.source_id, entry)
  }

  return {
    context: ctx,
    atomsMatchedRaw: matched.length,
    atomsTotal: sortedKept.length,
    hardConstraints,
    strongPreferences,
    softPreferences,
    informational,
    blockedMethods: [...blockedMethodsSet],
    eligibleMethods: [...eligibleMethodsSet],
    contraindicatedExerciseFamilies: [...contraindicatedFamiliesSet],
    baseWeekAtoms,
    phaseModulationAtoms,
    perSourceContribution: [...perSource.values()].sort((a, b) => b.atomCount - a.atomCount),
    conflictsResolved: resolved,
    status: 'ok',
    summary: `Returned ${sortedKept.length} V2 atom(s) (${hardConstraints.length} hard, ${strongPreferences.length} strong, ${softPreferences.length} soft, ${informational.length} info) from ${perSource.size} source(s); ${resolved.length} conflict group(s) resolved.`,
  }
}

function emptyResult(
  ctx: AthleteContext,
  status: BuilderReadableDoctrineResult['status'],
  summary: string,
): BuilderReadableDoctrineResult {
  return {
    context: ctx,
    atomsMatchedRaw: 0,
    atomsTotal: 0,
    hardConstraints: [],
    strongPreferences: [],
    softPreferences: [],
    informational: [],
    blockedMethods: [],
    eligibleMethods: [],
    contraindicatedExerciseFamilies: [],
    baseWeekAtoms: [],
    phaseModulationAtoms: [],
    perSourceContribution: [],
    conflictsResolved: [],
    status,
    summary,
  }
}
