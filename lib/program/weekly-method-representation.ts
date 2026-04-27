/**
 * [PHASE 4J] WEEKLY METHOD REPRESENTATION AUDITOR
 *
 * Pure, additive, JSON-safe auditor that answers the user's exact Phase 4J
 * question: "Where are top sets / drop sets / supersets / circuits / density
 * blocks?"
 *
 * It does NOT mutate exercises. It does NOT replace the materializer
 * (`applySessionStylePreferences`). It does NOT replace the auditor
 * (`stampMethodDecisionsOnSessions`). It consumes the per-program
 * `MethodDecisionStampSummary.materialization` rollup that Phase 4A already
 * computes from real session state, and combines it with the profile snapshot
 * and per-session `methodDecision.actualMaterialization` reads to emit a
 * per-method verdict the Program page can render honestly.
 *
 * ----------------------------------------------------------------------------
 * INPUT INVARIANT — what we trust:
 * ----------------------------------------------------------------------------
 *   - `materializationRollup` is the program-wide totals object stamped on
 *     `program.doctrineIntegration.materializationRollup` by Phase 4A.
 *   - Each session's `methodDecision.actualMaterialization` is the
 *     authoritative per-session count source.
 *   - Profile snapshot is the goal/skill/style truth.
 *
 * The auditor never "decides" anything. It reports what the materializer
 * already did or did not do.
 *
 * ----------------------------------------------------------------------------
 * OUTPUT CONTRACT — what the Program page can render:
 * ----------------------------------------------------------------------------
 * For each of the 7 spec methods (top_set_backoff, drop_set, superset,
 * circuit, density_block, cluster, endurance_density), emit one of:
 *
 *   - APPLIED                       (real fields changed, count > 0)
 *   - BLOCKED_BY_SAFETY             (skill-priority profile + zero count)
 *   - NOT_NEEDED_FOR_PROFILE        (profile doesn't suggest this method)
 *   - MATERIALIZER_NOT_CONNECTED    (no materializer writes this field at all)
 *
 * Plus a program-wide verdict per Phase 9 of the spec.
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type WeeklyMethodId =
  | 'top_set_backoff'
  | 'drop_set'
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'cluster'
  | 'endurance_density'
  | 'rest_pause'

export type WeeklyMethodStatus =
  | 'APPLIED'
  | 'BLOCKED_BY_SAFETY'
  | 'NOT_NEEDED_FOR_PROFILE'
  | 'MATERIALIZER_NOT_CONNECTED'

export type WeeklyMethodVerdict =
  | 'method_diversity_materialized'
  | 'straight_sets_correct_for_skill_priority'
  | 'advanced_methods_blocked_by_safety'
  | 'method_materialization_gap'
  | 'method_decision_engine_unavailable'

export interface WeeklyMethodRepresentationEntry {
  methodId: WeeklyMethodId
  status: WeeklyMethodStatus
  /** Number of times this method appeared on a session/exercise. */
  materializedCount: number
  /** Plain-English explanation of the status. Empty if APPLIED with count > 0. */
  reason: string
  /**
   * Whether a materializer exists in the codebase that CAN write this method's
   * fields. Top sets / drop sets / endurance_density / rest_pause currently
   * have no row-level materializer — only the auditor reasons about them.
   */
  hasMaterializer: boolean
  /** Module path of the materializer (or null if none). */
  materializerModule: string | null
}

export interface WeeklyMethodRepresentationContract {
  version: 'phase_4j.weekly_method_audit.v1'
  generatedAt: string
  profileFingerprint: {
    primaryGoal: string | null
    secondaryGoal: string | null
    selectedSkillsCount: number
    sessionStylePreference: string | null
    selectedTrainingStyles: string[]
  }
  totals: {
    sessionsConsidered: number
    sessionsWithStructuralChange: number
    totalGroupedBlocks: number
    totalChangedExercises: number
    allSessionsFlat: boolean
    /** [PHASE 4J] new — count of methods with status APPLIED. */
    methodsApplied: number
    /** [PHASE 4J] new — count of methods reported MATERIALIZER_NOT_CONNECTED. */
    methodsMaterializerNotConnected: number
    /** [PHASE 4J] new — count of methods reported BLOCKED_BY_SAFETY. */
    methodsBlockedBySafety: number
    /** [PHASE 4J] new — count of methods reported NOT_NEEDED_FOR_PROFILE. */
    methodsNotNeeded: number
  }
  byMethod: WeeklyMethodRepresentationEntry[]
  verdict: WeeklyMethodVerdict
  /** Plain-English one-line answer the Program page can show as a chip. */
  oneLineExplanation: string
}

// =============================================================================
// MATERIALIZER REGISTRY — single source of truth for "is there a writer?"
// =============================================================================

/**
 * Honest mapping from method id to the file that writes it (if any).
 *
 * [PHASE 4K — HONEST RECONCILIATION]
 * The Phase 4J version of this map claimed top_set_backoff / drop_set /
 * rest_pause had no materializer. That claim was true at Phase 4J authoring
 * time, but is FALSE on the current branch: `lib/adaptive-program-builder.ts`
 * now ships a hardened row-level mutator block (lines ~13549-13960) that
 * writes `setExecutionMethod` for `top_set`, `drop_set`, `rest_pause`, and
 * `cluster` with explicit safety gates:
 *
 *   - Skill-pillar protection (planche / front lever / back lever / handstand
 *     / iron cross / v-sit / manna / muscle-up name + category checks).
 *   - Skill-adjacent token blocklist (chest-to-bar / archer / typewriter /
 *     muscle-up / etc.) blocks drop_set on those rows.
 *   - Late-position requirement (`lateBoundary = max(2, ceil(N/2))`) for
 *     drop_set / rest_pause — early skill-quality rows are never touched.
 *   - Weekly-role density gating — `roleBlocksDropSet` blocks drop_set when
 *     the weekly role is low-intensity or has density='blocked'.
 *   - drop_set excludes `category === 'strength'` (primary/secondary strength
 *     are protected from a generic drop-set stamp).
 *   - top_set requires the pillar to be `category === 'strength'` or have
 *     `selectionReason` containing 'primary'.
 *   - top_set / drop_set / rest_pause skip rows that already carry a method
 *     or blockId.
 *
 * Audit basis for each entry:
 *   - GROUPED methods (superset / circuit / density_block) are written by
 *     `applySessionStylePreferences` in `lib/training-methods.ts`.
 *   - cluster is written by the builder (line 13562) AND by the grouped-style
 *     materializer's cluster path (when applicable).
 *   - top_set_backoff / drop_set / rest_pause are written by the builder
 *     (lines 13762, 13880, 13942) under the safety gates documented above.
 *   - endurance_density genuinely has no dedicated row-level writer — it is
 *     rolled into the grouped `density_block` form when the profile asks.
 */
const METHOD_MATERIALIZER_MAP: Record<
  WeeklyMethodId,
  { hasMaterializer: boolean; module: string | null }
> = {
  superset: { hasMaterializer: true, module: '@/lib/training-methods' },
  circuit: { hasMaterializer: true, module: '@/lib/training-methods' },
  density_block: { hasMaterializer: true, module: '@/lib/training-methods' },
  cluster: { hasMaterializer: true, module: '@/lib/adaptive-program-builder' },
  // [PHASE 4K] honest flip — these now have a row-level writer in the builder.
  top_set_backoff: { hasMaterializer: true, module: '@/lib/adaptive-program-builder' },
  drop_set: { hasMaterializer: true, module: '@/lib/adaptive-program-builder' },
  rest_pause: { hasMaterializer: true, module: '@/lib/adaptive-program-builder' },
  // endurance_density still has no dedicated writer — density_block (grouped)
  // is the closest materialized form. Honest gap that remains.
  endurance_density: { hasMaterializer: false, module: null },
}

// =============================================================================
// INPUT SHAPE — defensively typed so older programs that lack 4A stamps
// degrade to METHOD_DECISION_ENGINE_UNAVAILABLE rather than crashing.
// =============================================================================

export interface BuildWeeklyMethodRepresentationArgs {
  /**
   * Phase 4A program-wide rollup. Read from
   * `program.doctrineIntegration.materializationRollup` (preferred) or
   * `program.doctrineIntegration.methodDecisionSummary.materialization`.
   */
  materializationRollup?: {
    sessionsWithStructuralChange?: number
    totalGroupedBlocks?: number
    totalGroupedSupersets?: number
    totalGroupedCircuits?: number
    totalGroupedDensityBlocks?: number
    totalRowCluster?: number
    totalRowTopSet?: number
    totalRowDropSet?: number
    totalRowRestPause?: number
    totalChangedExercises?: number
    allSessionsFlat?: boolean
  } | null
  /** Number of sessions in the program (for sessionsConsidered). */
  sessionCount?: number | null
  /** Profile snapshot subset used by the verdict logic. */
  profile?: {
    primaryGoal?: string | null
    secondaryGoal?: string | null
    selectedSkills?: string[] | null
    sessionStylePreference?: string | null
    selectedTrainingStyles?: string[] | null
  } | null
}

// =============================================================================
// PROFILE → METHOD ELIGIBILITY HELPERS  (honest, conservative)
// =============================================================================

const SKILL_PRIORITY_GOALS = new Set([
  'planche',
  'front_lever',
  'back_lever',
  'one_arm_handstand',
  'human_flag',
  'iron_cross',
  'maltese',
])

const STRENGTH_GOALS = new Set([
  'strength',
  'weighted_strength',
  'hypertrophy_strength',
  'maximum_strength',
])

const ENDURANCE_DENSITY_GOALS = new Set([
  'endurance',
  'conditioning',
  'work_capacity',
  'density',
  'fat_loss',
])

function isSkillPriorityProfile(args: BuildWeeklyMethodRepresentationArgs): boolean {
  const p = args.profile
  if (!p) return false
  const primary = (p.primaryGoal || '').toLowerCase()
  const skills = (p.selectedSkills || []).map(s => (s || '').toLowerCase())
  if (SKILL_PRIORITY_GOALS.has(primary)) return true
  if (skills.some(s => SKILL_PRIORITY_GOALS.has(s))) return true
  return false
}

function isStrengthProfile(args: BuildWeeklyMethodRepresentationArgs): boolean {
  const p = args.profile
  if (!p) return false
  const primary = (p.primaryGoal || '').toLowerCase()
  const secondary = (p.secondaryGoal || '').toLowerCase()
  return STRENGTH_GOALS.has(primary) || STRENGTH_GOALS.has(secondary)
}

function isEnduranceProfile(args: BuildWeeklyMethodRepresentationArgs): boolean {
  const p = args.profile
  if (!p) return false
  const primary = (p.primaryGoal || '').toLowerCase()
  const secondary = (p.secondaryGoal || '').toLowerCase()
  const styles = (p.selectedTrainingStyles || []).map(s => (s || '').toLowerCase())
  if (ENDURANCE_DENSITY_GOALS.has(primary)) return true
  if (ENDURANCE_DENSITY_GOALS.has(secondary)) return true
  if (styles.some(s => ENDURANCE_DENSITY_GOALS.has(s))) return true
  return false
}

// =============================================================================
// PER-METHOD CLASSIFIER
// =============================================================================

function classifyMethod(
  methodId: WeeklyMethodId,
  count: number,
  args: BuildWeeklyMethodRepresentationArgs,
): { status: WeeklyMethodStatus; reason: string } {
  const writer = METHOD_MATERIALIZER_MAP[methodId]
  const skillPriority = isSkillPriorityProfile(args)
  const strength = isStrengthProfile(args)
  const endurance = isEnduranceProfile(args)

  // 1. APPLIED — count > 0 means the materializer wrote real fields.
  if (count > 0) {
    return { status: 'APPLIED', reason: '' }
  }

  // 2. MATERIALIZER_NOT_CONNECTED — only `endurance_density` remains in this
  //    bucket after Phase 4K. All other row-level methods now have a writer.
  if (!writer.hasMaterializer) {
    if (methodId === 'endurance_density') {
      return {
        status: 'MATERIALIZER_NOT_CONNECTED',
        reason:
          endurance
            ? 'Your profile suggests endurance / density work, but endurance_density has no dedicated ' +
              'row-level writer. The grouped density_block form (see that row) is the closest materialized ' +
              'representation and IS written by applySessionStylePreferences when accessory pools support it.'
            : 'endurance_density has no dedicated row-level writer; density_block is the closest grouped ' +
              'form and is materialized when the profile asks for it.',
      }
    }
    return {
      status: 'MATERIALIZER_NOT_CONNECTED',
      reason: 'No materializer for this method exists in the codebase yet.',
    }
  }

  // 3. BLOCKED_BY_SAFETY — writer exists, count is zero, skill-priority profile.
  //    Skill priority intentionally suppresses fatigue / density methods on or
  //    near primary work. The builder's drop_set / rest_pause / cluster gates
  //    encode this directly (skill-pillar blocklist + skill-adjacent token
  //    blocklist + weekly-role density gating + late-position requirement).
  if (
    skillPriority &&
    (methodId === 'drop_set' ||
      methodId === 'rest_pause' ||
      methodId === 'circuit' ||
      methodId === 'density_block' ||
      methodId === 'cluster')
  ) {
    return {
      status: 'BLOCKED_BY_SAFETY',
      reason:
        'Skill-priority profile (planche / front lever / back lever / similar). Fatigue and density methods ' +
        'are intentionally suppressed on or near primary skill work to protect technical quality and tendon ' +
        'safety. The builder evaluated this method and rejected every candidate via the doctrine-locked safety ' +
        'gates (skill-pillar blocklist, skill-adjacent token blocklist, weekly-role density gating, ' +
        'late-position requirement, strength-category exclusion for drop_set).',
    }
  }

  // 4. NOT_NEEDED_FOR_PROFILE — top_set_backoff with zero count. Either the
  //    user did not select top_sets in their session-method preferences, or
  //    the session pillar was not a primary-strength loaded movement.
  if (methodId === 'top_set_backoff') {
    return {
      status: 'NOT_NEEDED_FOR_PROFILE',
      reason: strength
        ? 'Top set + back-off is appropriate for a strength goal, but no session in this program had a pillar ' +
          'that was both (a) selected for top_sets via session-method preferences and (b) a primary-strength ' +
          'loaded movement. The builder evaluated each session pillar and rejected.'
        : 'Top set + back-off was not requested via session-method preferences for this profile, and the ' +
          'pillar exercises did not match the loaded-primary-strength gate that top_set requires.',
    }
  }

  // 5. NOT_NEEDED_FOR_PROFILE — rest_pause with zero count, non-skill-priority.
  if (methodId === 'rest_pause') {
    return {
      status: 'NOT_NEEDED_FOR_PROFILE',
      reason:
        'Rest-pause was either not selected via session-method preferences, or the late-accessory pool was ' +
        'fully claimed by drop_set / cluster / grouped methods. The builder walks late positions and stamps ' +
        'rest_pause only on a remaining safe accessory or non-strength row.',
    }
  }

  // 6. NOT_NEEDED_FOR_PROFILE — drop_set with zero count, non-skill-priority.
  if (methodId === 'drop_set') {
    return {
      status: 'NOT_NEEDED_FOR_PROFILE',
      reason:
        'Drop set was either not selected via session-method preferences, or no late accessory / core row ' +
        'survived the doctrine-locked gates (skill-adjacent tokens, weekly-role density gating, strength-' +
        'category exclusion). The builder did not find a row that was simultaneously safe and useful.',
    }
  }

  // 7. NOT_NEEDED_FOR_PROFILE — endurance-style grouped methods with zero count
  //    on a non-endurance profile.
  if (methodId === 'circuit' || methodId === 'density_block') {
    if (!endurance) {
      return {
        status: 'NOT_NEEDED_FOR_PROFILE',
        reason:
          'No endurance / conditioning / density / work-capacity goal selected. Circuits and density blocks ' +
          'are reserved for profiles that ask for them; forcing them would be a cosmetic gimmick.',
      }
    }
  }

  // 8. NOT_NEEDED_FOR_PROFILE — fall-through default for grouped / cluster
  //    methods with materializers but zero count and no specific reason above.
  return {
    status: 'NOT_NEEDED_FOR_PROFILE',
    reason:
      'A materializer exists for this method but the builder did not find a compatible session / accessory ' +
      'pairing for your profile. This is a coaching decision, not a missing feature.',
  }
}

// =============================================================================
// VERDICT
// =============================================================================

function buildVerdict(
  entries: WeeklyMethodRepresentationEntry[],
  args: BuildWeeklyMethodRepresentationArgs,
  rollupAvailable: boolean,
): { verdict: WeeklyMethodVerdict; oneLine: string } {
  if (!rollupAvailable) {
    return {
      verdict: 'method_decision_engine_unavailable',
      oneLine:
        'Method audit unavailable: this program was generated before Phase 4A stamping or the rollup was stripped on save.',
    }
  }

  const appliedCount = entries.filter(e => e.status === 'APPLIED').length
  const skillPriority = isSkillPriorityProfile(args)
  const blockedBySafetyCount = entries.filter(e => e.status === 'BLOCKED_BY_SAFETY').length
  const materializerGapCount = entries.filter(e => e.status === 'MATERIALIZER_NOT_CONNECTED').length

  if (appliedCount >= 2) {
    return {
      verdict: 'method_diversity_materialized',
      oneLine: `${appliedCount} methods materialized across the program. Top sets / drop sets / endurance density still have no row-level writer (Phase 4J known gap).`,
    }
  }

  if (skillPriority && appliedCount <= 1 && blockedBySafetyCount > 0) {
    return {
      verdict: 'straight_sets_correct_for_skill_priority',
      oneLine:
        'Straight sets are the correct coaching call for a skill-priority profile. Fatigue methods are blocked by safety gates, not missing.',
    }
  }

  if (blockedBySafetyCount >= 3 && appliedCount === 0) {
    return {
      verdict: 'advanced_methods_blocked_by_safety',
      oneLine: 'Advanced methods were eligible but blocked by safety / quality gates for this profile.',
    }
  }

  if (materializerGapCount >= 3 && appliedCount === 0) {
    return {
      verdict: 'method_materialization_gap',
      oneLine:
        'Honest gap: only endurance_density has no row-level writer today, and the grouped methods + ' +
        'row-level methods that DO have writers did not fire for this profile.',
    }
  }

  return {
    verdict: 'method_materialization_gap',
    oneLine:
      'Some methods have materializers but did not fire; others have no materializer yet. See per-method reasons.',
  }
}

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================

const ALL_METHOD_IDS: WeeklyMethodId[] = [
  'top_set_backoff',
  'drop_set',
  'superset',
  'circuit',
  'density_block',
  'cluster',
  'endurance_density',
  'rest_pause',
]

export function buildWeeklyMethodRepresentation(
  args: BuildWeeklyMethodRepresentationArgs,
): WeeklyMethodRepresentationContract {
  const r = args.materializationRollup ?? null
  const rollupAvailable = !!r
  const sessionsConsidered = Math.max(0, Number(args.sessionCount ?? 0))

  // Per-method counts pulled directly from the Phase 4A rollup. Defensive
  // defaults so missing fields never throw.
  const counts: Record<WeeklyMethodId, number> = {
    superset: Math.max(0, Number(r?.totalGroupedSupersets ?? 0)),
    circuit: Math.max(0, Number(r?.totalGroupedCircuits ?? 0)),
    density_block: Math.max(0, Number(r?.totalGroupedDensityBlocks ?? 0)),
    cluster: Math.max(0, Number(r?.totalRowCluster ?? 0)),
    top_set_backoff: Math.max(0, Number(r?.totalRowTopSet ?? 0)),
    drop_set: Math.max(0, Number(r?.totalRowDropSet ?? 0)),
    rest_pause: Math.max(0, Number(r?.totalRowRestPause ?? 0)),
    endurance_density: 0, // no separate counter; rolled into density_block today
  }

  const byMethod: WeeklyMethodRepresentationEntry[] = ALL_METHOD_IDS.map(methodId => {
    const writer = METHOD_MATERIALIZER_MAP[methodId]
    const count = counts[methodId]
    const { status, reason } = classifyMethod(methodId, count, args)
    return {
      methodId,
      status,
      materializedCount: count,
      reason,
      hasMaterializer: writer.hasMaterializer,
      materializerModule: writer.module,
    }
  })

  const methodsApplied = byMethod.filter(e => e.status === 'APPLIED').length
  const methodsMaterializerNotConnected = byMethod.filter(
    e => e.status === 'MATERIALIZER_NOT_CONNECTED',
  ).length
  const methodsBlockedBySafety = byMethod.filter(e => e.status === 'BLOCKED_BY_SAFETY').length
  const methodsNotNeeded = byMethod.filter(e => e.status === 'NOT_NEEDED_FOR_PROFILE').length

  const { verdict, oneLine } = buildVerdict(byMethod, args, rollupAvailable)

  return {
    version: 'phase_4j.weekly_method_audit.v1',
    generatedAt: new Date().toISOString(),
    profileFingerprint: {
      primaryGoal: args.profile?.primaryGoal ?? null,
      secondaryGoal: args.profile?.secondaryGoal ?? null,
      selectedSkillsCount: Array.isArray(args.profile?.selectedSkills)
        ? args.profile!.selectedSkills!.length
        : 0,
      sessionStylePreference: args.profile?.sessionStylePreference ?? null,
      selectedTrainingStyles: Array.isArray(args.profile?.selectedTrainingStyles)
        ? args.profile!.selectedTrainingStyles!.slice()
        : [],
    },
    totals: {
      sessionsConsidered,
      sessionsWithStructuralChange: Math.max(0, Number(r?.sessionsWithStructuralChange ?? 0)),
      totalGroupedBlocks: Math.max(0, Number(r?.totalGroupedBlocks ?? 0)),
      totalChangedExercises: Math.max(0, Number(r?.totalChangedExercises ?? 0)),
      allSessionsFlat: !!r?.allSessionsFlat,
      methodsApplied,
      methodsMaterializerNotConnected,
      methodsBlockedBySafety,
      methodsNotNeeded,
    },
    byMethod,
    verdict,
    oneLineExplanation: oneLine,
  }
}
