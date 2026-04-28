/**
 * =============================================================================
 * [PHASE AA1 OF 3] WEEKLY METHOD MATERIALIZATION PLAN
 *
 * Pure read-only summarizer. Runs ONCE per program after the builder, the
 * row-level mutator, and the structural materialization corridor have all
 * stamped their truth. Reads:
 *
 *   - `program.trainingIntentVector`           (Phase AA1 — explicit method
 *                                                preferences + intent scores)
 *   - `program.weeklyMethodBudgetPlan`         (Phase 4N — per-family verdict)
 *   - `program.weeklyMethodRepresentation`     (Phase 4J — what materialized)
 *   - `program.sessions[i].methodStructures[]` (Phase 4P — per-session canonical)
 *   - `program.sessions[i].styleMetadata.styledGroups[]`
 *   - `program.sessions[i].exercises[].setExecutionMethod`
 *
 * Produces ONE compact `WeeklyMethodMaterializationPlan` object that answers
 * the user's question:
 *
 *   "Which methods did I pick? Which days got each method? If a method I
 *    picked didn't show up, exactly why?"
 *
 * The plan is JSON-safe and stamped onto `program.weeklyMethodMaterializationPlan`.
 * It is consumed by existing trust-accordion / influence-map components — this
 * phase does NOT add new UI surfaces.
 *
 * NOT a materializer. NOT a decision layer. NOT a re-applier. Pure summary.
 * =============================================================================
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type WeeklyPlanMethodId =
  | 'straight_sets'
  | 'supersets'
  | 'circuits'
  | 'density_blocks'
  | 'cluster_sets'
  | 'top_sets'
  | 'drop_sets'
  | 'rest_pause'
  | 'ladder_sets'

/** What the day actually shows for this method on the rendered Program page. */
export type DayMethodOutcome =
  | 'applied'         // Real visible structure (grouped block OR row method)
  | 'planned'         // Budget says apply but session has no safe target
  | 'blocked_safety'  // Safety gate vetoed
  | 'not_needed'      // Doctrine + user preference don't earn it for this day
  | 'not_attempted'   // Day did not consider this method (e.g. cluster on a
                      //   conditioning day where the method doesn't fit)

export interface WeeklyPlanDayAssignment {
  dayNumber: number
  dayLabel: string | null
  /** Methods that have a visible block / row method on this specific day. */
  appliedMethods: WeeklyPlanMethodId[]
  /** Methods explicitly blocked on this day with a reason. */
  blockedMethods: Array<{ method: WeeklyPlanMethodId; reason: string }>
  /** Plain-English description of the day's primary method spine. */
  primarySpine: string
}

export interface WeeklyPlanMethodVerdict {
  method: WeeklyPlanMethodId
  /** User explicitly checked this method in onboarding/settings. */
  userPreferred: boolean
  /** Doctrine intent earned this method independent of user choice. */
  doctrineEarned: boolean
  /** Final budget verdict (already computed in Phase 4N). */
  budgetVerdict:
    | 'SHOULD_APPLY' | 'MAY_APPLY' | 'NOT_NEEDED'
    | 'BLOCKED_BY_SAFETY' | 'NO_SAFE_TARGET' | 'NOT_CONNECTED'
  /** How many days this method actually materialized on. */
  materializedDays: number[]
  /** How many days the budget allowed it but the session had no safe target. */
  noSafeTargetDays: number[]
  /** Compact human reason — single line. */
  reason: string
}

export interface WeeklyMethodMaterializationPlan {
  version: 'phase-aa1.weekly-mat-plan.v1'
  generatedAt: string
  /** Methods the user explicitly picked (canonical, normalized). */
  userPreferredMethods: WeeklyPlanMethodId[]
  /** Methods doctrine intent earned independent of user pick. */
  doctrineEarnedMethods: WeeklyPlanMethodId[]
  /** Per-method verdict + materialization counts. */
  byMethod: WeeklyPlanMethodVerdict[]
  /** Per-day method assignments derived from final session truth. */
  dayAssignments: WeeklyPlanDayAssignment[]
  /** Roll-up totals. */
  totals: {
    sessionsConsidered: number
    sessionsWithAppliedMethod: number
    methodsUserPickedAndApplied: number
    methodsUserPickedNotApplied: number
    methodsDoctrineEarnedAndApplied: number
  }
  /**
   * Single-line answer the trust accordion can render. Falls into one of:
   *  - "Method spine matches your preferences"
   *  - "Some preferred methods have no safe target this cycle"
   *  - "Methods are doctrine-earned beyond your selections"
   *  - "Method spine is straight-sets correct for skill priority"
   *  - "Method materialization gap"
   */
  oneLineExplanation: string
}

// =============================================================================
// INPUT TYPES (defensive — every field optional, fail-soft on partials)
// =============================================================================

interface PlanInputProgram {
  sessions?: Array<{
    dayNumber?: number | null
    dayLabel?: string | null
    focus?: string | null
    methodStructures?: Array<{
      family?: string
      status?: string
      reason?: string
      exerciseNames?: string[]
    }> | null
    styleMetadata?: {
      styledGroups?: Array<{ groupType?: string; exercises?: unknown[] }>
    } | null
    exercises?: Array<{
      method?: string | null
      setExecutionMethod?: string | null
      blockId?: string | null
    }> | null
  }>
  trainingIntentVector?: {
    explicitMethodPreferences?: string[]
    densityIntent?: number
    enduranceIntent?: number
    hypertrophyIntent?: number
    strengthIntent?: number
  } | null
  weeklyMethodBudgetPlan?: {
    byFamily?: Record<string, {
      verdict?: string
      reason?: string
      verdictSource?: string
    }>
  } | null
}

// =============================================================================
// HELPERS
// =============================================================================

const ALL_METHODS: WeeklyPlanMethodId[] = [
  'straight_sets',
  'supersets',
  'circuits',
  'density_blocks',
  'cluster_sets',
  'top_sets',
  'drop_sets',
  'rest_pause',
  'ladder_sets',
]

/**
 * Map the budget plan's family ids (top_set_backoff, drop_set, ...) into the
 * canonical preference vocabulary the user picks in onboarding (top_sets,
 * drop_sets, ...). One-to-one for everything except `endurance_density` which
 * has no direct user-facing preference — we exclude it here because the user
 * never saw a checkbox for it.
 */
const BUDGET_FAMILY_TO_PLAN_METHOD: Record<string, WeeklyPlanMethodId | null> = {
  top_set_backoff: 'top_sets',
  drop_set: 'drop_sets',
  rest_pause: 'rest_pause',
  cluster: 'cluster_sets',
  superset: 'supersets',
  circuit: 'circuits',
  density_block: 'density_blocks',
  endurance_density: null, // not in user vocabulary
  straight_sets: 'straight_sets',
}

/**
 * Map a per-session styled-group / row method id into the plan vocabulary.
 */
function classifySessionMethodToken(token: string | null | undefined): WeeklyPlanMethodId | null {
  if (!token) return null
  const t = token.toLowerCase()
  if (t === 'superset') return 'supersets'
  if (t === 'circuit') return 'circuits'
  if (t === 'density_block' || t === 'density') return 'density_blocks'
  if (t === 'cluster' || t === 'cluster_set') return 'cluster_sets'
  if (t === 'top_set' || t === 'top_sets') return 'top_sets'
  if (t === 'drop_set' || t === 'drop_sets') return 'drop_sets'
  if (t === 'rest_pause') return 'rest_pause'
  if (t === 'ladder_set' || t === 'ladder_sets') return 'ladder_sets'
  return null
}

/**
 * Read every signal a session can carry about which methods materialized on
 * it: styledGroups (grouped methods), per-exercise setExecutionMethod (row
 * methods), and the canonical methodStructures[] (corridor mirror).
 */
function appliedMethodsForSession(session: NonNullable<PlanInputProgram['sessions']>[number]): Set<WeeklyPlanMethodId> {
  const applied = new Set<WeeklyPlanMethodId>()

  // 1. Grouped blocks via styledGroups
  const groups = session.styleMetadata?.styledGroups ?? []
  for (const g of groups) {
    const m = classifySessionMethodToken(g?.groupType)
    if (m) applied.add(m)
  }

  // 2. Row-level set-execution methods
  const exs = session.exercises ?? []
  for (const ex of exs) {
    const fromSetExec = classifySessionMethodToken(ex.setExecutionMethod)
    if (fromSetExec) applied.add(fromSetExec)
    // Only count `method` when there is no blockId — otherwise the method is
    // already covered by the grouped block above.
    if (!ex.blockId) {
      const fromMethod = classifySessionMethodToken(ex.method)
      if (fromMethod) applied.add(fromMethod)
    }
  }

  // 3. Mirror via methodStructures (corridor's canonical) — pick up
  //    `applied` and `already_applied` only.
  const structs = session.methodStructures ?? []
  for (const s of structs) {
    if (s.status !== 'applied' && s.status !== 'already_applied') continue
    const m = classifySessionMethodToken(s.family)
    if (m) applied.add(m)
  }

  return applied
}

/**
 * Find the per-day blocked-reason for a method by looking at the corridor's
 * stamped methodStructures[] entries with status `blocked` / `not_needed` /
 * `no_safe_target`. The reason text is the corridor's plain-English string.
 */
function blockedReasonForSessionMethod(
  session: NonNullable<PlanInputProgram['sessions']>[number],
  method: WeeklyPlanMethodId,
): string | null {
  const structs = session.methodStructures ?? []
  for (const s of structs) {
    const familyAsMethod = classifySessionMethodToken(s.family)
    if (familyAsMethod !== method) continue
    if (s.status === 'blocked' || s.status === 'not_needed' || s.status === 'no_safe_target') {
      return typeof s.reason === 'string' && s.reason.length > 0 ? s.reason : `${s.status.replace(/_/g, ' ')}`
    }
  }
  return null
}

function describeDaySpine(applied: Set<WeeklyPlanMethodId>, focus: string | null): string {
  if (applied.size === 0) return 'Straight sets (skill / strength quality preserved)'
  const ordered: WeeklyPlanMethodId[] = []
  // Order: structural first, then row-level. This gives a stable readable
  // sentence regardless of materialization order.
  const structural: WeeklyPlanMethodId[] = ['supersets', 'circuits', 'density_blocks']
  const rowLevel: WeeklyPlanMethodId[] = ['top_sets', 'drop_sets', 'rest_pause', 'cluster_sets']
  for (const m of structural) if (applied.has(m)) ordered.push(m)
  for (const m of rowLevel) if (applied.has(m)) ordered.push(m)
  const labelMap: Record<WeeklyPlanMethodId, string> = {
    straight_sets: 'Straight sets',
    supersets: 'Superset',
    circuits: 'Circuit',
    density_blocks: 'Density block',
    cluster_sets: 'Cluster',
    top_sets: 'Top set + back-off',
    drop_sets: 'Drop set',
    rest_pause: 'Rest-pause',
    ladder_sets: 'Ladder set',
  }
  const labels = ordered.map(m => labelMap[m]).join(' + ')
  return focus ? `${labels} on ${focus.toLowerCase()} spine` : labels
}

// =============================================================================
// PUBLIC ENTRY
// =============================================================================

export function buildWeeklyMethodMaterializationPlan(
  program: PlanInputProgram,
): WeeklyMethodMaterializationPlan {
  const generatedAt = new Date().toISOString()
  const sessions = Array.isArray(program.sessions) ? program.sessions : []

  // ---------------------------------------------------------------------------
  // 1. User preferred methods (from intent vector — Phase AA1 wired this).
  // ---------------------------------------------------------------------------
  const explicitPrefs = (program.trainingIntentVector?.explicitMethodPreferences ?? [])
    .filter((p): p is WeeklyPlanMethodId => (ALL_METHODS as string[]).includes(p))

  // Doctrine-earned methods come from the budget plan's verdictSource = doctrine_*
  const byFamily = program.weeklyMethodBudgetPlan?.byFamily ?? {}
  const doctrineEarned: WeeklyPlanMethodId[] = []
  for (const [familyId, entry] of Object.entries(byFamily)) {
    const m = BUDGET_FAMILY_TO_PLAN_METHOD[familyId]
    if (!m) continue
    if (entry?.verdictSource === 'doctrine_earned' || entry?.verdictSource === 'doctrine_and_user') {
      if (!doctrineEarned.includes(m)) doctrineEarned.push(m)
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Per-day assignments — read final session truth.
  // ---------------------------------------------------------------------------
  const dayAssignments: WeeklyPlanDayAssignment[] = sessions.map((sess, idx) => {
    const dayNumber = typeof sess.dayNumber === 'number' ? sess.dayNumber : idx + 1
    const dayLabel = typeof sess.dayLabel === 'string' ? sess.dayLabel : null
    const focus = typeof sess.focus === 'string' ? sess.focus : null
    const applied = Array.from(appliedMethodsForSession(sess))
    const blocked: Array<{ method: WeeklyPlanMethodId; reason: string }> = []
    // Only enumerate user-preferred methods that did NOT apply — blocking
    // every method the user did not pick would clutter the trace.
    for (const pref of explicitPrefs) {
      if (applied.includes(pref)) continue
      const reason = blockedReasonForSessionMethod(sess, pref)
      if (reason) blocked.push({ method: pref, reason })
    }
    return {
      dayNumber,
      dayLabel,
      appliedMethods: applied,
      blockedMethods: blocked,
      primarySpine: describeDaySpine(new Set(applied), focus),
    }
  })

  // ---------------------------------------------------------------------------
  // 3. Per-method roll-up — combine budget verdict + per-day materialization.
  // ---------------------------------------------------------------------------
  const byMethod: WeeklyPlanMethodVerdict[] = ALL_METHODS.map(method => {
    const familyId = Object.entries(BUDGET_FAMILY_TO_PLAN_METHOD)
      .find(([, m]) => m === method)?.[0]
    const budgetEntry = familyId ? byFamily[familyId] : undefined

    const userPreferred = explicitPrefs.includes(method)
    const doctrineEarnedHere = doctrineEarned.includes(method)
    const materializedDays: number[] = []
    const noSafeTargetDays: number[] = []
    for (const day of dayAssignments) {
      if (day.appliedMethods.includes(method)) materializedDays.push(day.dayNumber)
      else if (day.blockedMethods.some(b => b.method === method)) noSafeTargetDays.push(day.dayNumber)
    }

    // Compose a one-line reason that prefers truth from the most specific
    // surface available: budget reason > generic verdict description.
    let reason = budgetEntry?.reason ?? ''
    if (!reason) {
      if (materializedDays.length > 0) {
        reason = `Materialized on day(s) ${materializedDays.join(', ')}.`
      } else if (userPreferred) {
        reason = 'You picked this method, but no safe target session was found this cycle.'
      } else if (doctrineEarnedHere) {
        reason = 'Doctrine earned this method but no safe target was available.'
      } else {
        reason = 'Not earned by doctrine and not picked in your preferences.'
      }
    }

    return {
      method,
      userPreferred,
      doctrineEarned: doctrineEarnedHere,
      budgetVerdict: ((budgetEntry?.verdict as WeeklyPlanMethodVerdict['budgetVerdict']) ?? 'NOT_NEEDED'),
      materializedDays,
      noSafeTargetDays,
      reason,
    }
  })

  // ---------------------------------------------------------------------------
  // 4. Totals + one-line explanation.
  // ---------------------------------------------------------------------------
  const sessionsWithAppliedMethod = dayAssignments.filter(d => d.appliedMethods.length > 0).length
  const methodsUserPickedAndApplied = byMethod.filter(m => m.userPreferred && m.materializedDays.length > 0).length
  const methodsUserPickedNotApplied = byMethod.filter(m => m.userPreferred && m.materializedDays.length === 0).length
  const methodsDoctrineEarnedAndApplied = byMethod.filter(m => m.doctrineEarned && m.materializedDays.length > 0).length

  let oneLine = 'Method spine is straight-sets correct for skill priority'
  if (methodsUserPickedAndApplied > 0 && methodsUserPickedNotApplied === 0) {
    oneLine = 'Method spine matches your preferences'
  } else if (methodsUserPickedAndApplied > 0 && methodsUserPickedNotApplied > 0) {
    oneLine = `${methodsUserPickedAndApplied} of your selected methods materialized; ${methodsUserPickedNotApplied} had no safe target this cycle`
  } else if (methodsUserPickedNotApplied > 0 && methodsUserPickedAndApplied === 0) {
    oneLine = 'Your selected methods had no safe target this cycle'
  } else if (methodsDoctrineEarnedAndApplied > 0) {
    oneLine = 'Methods are doctrine-earned beyond your selections'
  } else if (sessionsWithAppliedMethod === 0) {
    oneLine = 'Method spine is straight-sets correct for skill priority'
  }

  return {
    version: 'phase-aa1.weekly-mat-plan.v1',
    generatedAt,
    userPreferredMethods: explicitPrefs,
    doctrineEarnedMethods: doctrineEarned,
    byMethod,
    dayAssignments,
    totals: {
      sessionsConsidered: sessions.length,
      sessionsWithAppliedMethod,
      methodsUserPickedAndApplied,
      methodsUserPickedNotApplied,
      methodsDoctrineEarnedAndApplied,
    },
    oneLineExplanation: oneLine,
  }
}
