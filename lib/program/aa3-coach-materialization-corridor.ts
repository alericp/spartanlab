// =============================================================================
// PHASE AA3 — COACH MATERIALIZATION CORRIDOR
//
// Read this header first. AA3 is the third phase in the locked doctrine
// sequence:
//
//   AA1R: structure first, wording second  (truth reconciliation)
//   AA2 : doctrine utilization map         (read-only audit/classification)
//   AA3 : THIS FILE                        (coach plan + narrow row mutations)
//   Step 4: final UI polish                (not yet)
//
// AA3 RUNS PER SESSION, between the row-level prescription mutator and the
// final method-truth reconciler. The reconciler runs AFTER AA3 and validates
// every method claim against the final executable structure, so AA3 cannot
// produce an applied claim that outruns the body. AA1R protections remain
// fully intact.
//
// =============================================================================
// WHAT AA3 DOES
// -----------------------------------------------------------------------------
// 1) PER-METHOD VERDICT + COACH REASON
//    For every method family the system supports — superset, circuit,
//    density_block, top_set, drop_set, cluster, rest_pause, straight_sets —
//    AA3 records ONE verdict and ONE specific coach-like reason for the
//    session, derived from existing artifacts: session.exercises,
//    session.styleMetadata.styledGroups, session.methodDecision,
//    program.weeklyMethodBudgetPlan, profileSnapshot, weeklyRole,
//    currentWeekNumber. Verdicts use this taxonomy:
//
//      APPLIED_BY_PRIOR_PIPELINE
//        Existing structure already proves the method (styledGroup with
//        members, or row.setExecutionMethod set by the doctrine corridor /
//        row mutator). AA3 does not duplicate or override — it just records
//        the proof location.
//
//      APPLIED_BY_AA3
//        AA3 itself materialized the method on a single safe row (top_set
//        or drop_set only). Never used for grouped methods.
//
//      CONSIDERED_NOT_OPTIMAL
//        Doctrine eligible, runtime supported, but a higher-priority signal
//        wins (skill-priority day, technical quality protection, joint
//        caution, recovery overlap, intensity cap). The reason names the
//        winning constraint.
//
//      BLOCKED_BY_RUNTIME
//        Doctrine valid but the live workout reducer cannot safely express
//        the method yet (currently only `cluster`). Honest classification —
//        never silently reclassified as "no target."
//
//      NO_TARGET
//        Doctrine valid but no compatible exercise/session role/weekly
//        budget exists in this generated program. The reason names which
//        target dimension was missing.
//
//      SUPPRESSED_BY_VOLUME_GUARD
//        Method is fatigue-heavy (drop_set, density_block) and the session
//        is already at or above the AA3 volume cap.
//
//      SUPPRESSED_BY_SKILL_PRIORITY
//        Method would degrade technical quality on a primary-skill day.
//
//      NOT_PREFERRED
//        User onboarding did not select this method family (and doctrine
//        does not force it). Recorded so the UI can say so honestly rather
//        than implying it was applied or blocked.
//
//      DEFAULT_STRAIGHT_SETS_INTENTIONAL
//        Only used for the `straight_sets` family. Says: "straight sets
//        chosen on purpose for skill quality / first-week protection /
//        recovery budget" — not "fallback because nothing else fired."
//
// 2) NARROW ADDITIVE ROW MUTATION (top_set + drop_set ONLY)
//    AA3 may set ONE row's `setExecutionMethod` to `'top_set'` or
//    `'drop_set'` if and only if every safety gate passes:
//
//      - the method is currently UNAPPLIED on the session (no styledGroup,
//        no exercise carries this setExecutionMethod already)
//      - a safe target row exists (loaded anchor for top_set / safe
//        accessory for drop_set)
//      - week >= 2 (skip first-week conservative ramp protection)
//      - session role is appropriate (no top_set on a pure capacity day,
//        no drop_set on a primary-skill day)
//      - volume guard passes (total scheduled sets below the cap)
//      - user preference includes the method OR doctrine eligibility
//        explicitly earns it (top_set is doctrine-earned, drop_set
//        usually requires preference)
//      - weekly method budget allows
//      - no other AA3 mutation has fired on this session
//
//    AA3 NEVER touches styledGroups, exercise selection, set/rep counts,
//    rest, RPE, finishers, warm-ups, or cooldown. It NEVER adds grouped
//    methods (superset/circuit/density_block) — those require reshuffling
//    structure that the existing structural-method-materialization-corridor
//    already owns end-to-end. AA3 is additive on a single row only.
//
// 3) STAMPS RESULT ON `session.aa3CoachPlan`
//    A small structured object the AdaptiveSessionCard can read to surface
//    specific verdicts and coach reasons in the "Method decisions" expander.
//
// =============================================================================
// WHAT AA3 DOES NOT DO
// -----------------------------------------------------------------------------
// - Does not invent doctrine.
// - Does not bypass AA1R / AA2.
// - Does not force methods for visual variety.
// - Does not change exercise selection.
// - Does not change session role / intent / volume / intensity targets.
// - Does not add or remove finishers, warm-ups, or cooldown.
// - Does not touch styledGroups (grouped method ownership stays with the
//   existing structural-method-materialization-corridor).
// - Does not produce any UI string. Reasons are stored as structured data;
//   the UI is responsible for rendering them.
// - Does not modify Prisma / DB schema / billing / auth / unrelated routes.
// =============================================================================

// -----------------------------------------------------------------------------
// METHOD FAMILY TAXONOMY
// Single source of truth used by AA3. Mirrors the families AA2 classifies
// and the families AdaptiveSessionCard / Start Workout already render.
// -----------------------------------------------------------------------------
export type AA3MethodFamily =
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'top_set'
  | 'drop_set'
  | 'cluster'
  | 'rest_pause'
  | 'straight_sets'

// -----------------------------------------------------------------------------
// VERDICT ENUM
// See header for full semantics. Order is significant only for documentation.
// -----------------------------------------------------------------------------
export type AA3MethodVerdict =
  | 'APPLIED_BY_PRIOR_PIPELINE'
  | 'APPLIED_BY_AA3'
  | 'CONSIDERED_NOT_OPTIMAL'
  | 'BLOCKED_BY_RUNTIME'
  | 'NO_TARGET'
  | 'SUPPRESSED_BY_VOLUME_GUARD'
  | 'SUPPRESSED_BY_SKILL_PRIORITY'
  | 'NOT_PREFERRED'
  | 'DEFAULT_STRAIGHT_SETS_INTENTIONAL'

// -----------------------------------------------------------------------------
// PER-METHOD ENTRY shape
// `verdict` answers WHAT happened. `reason` answers WHY in coach voice.
// `proofPath` is the single executable-truth field a downstream reader
// (UI, Start Workout, audits) can consult to verify the verdict. `target`
// names the specific exercise the verdict applies to when one exists.
// -----------------------------------------------------------------------------
export interface AA3PerMethodEntry {
  family: AA3MethodFamily
  verdict: AA3MethodVerdict
  reason: string
  /**
   * Where the verdict can be verified in the final program data. Examples:
   *   "session.styleMetadata.styledGroups[0]"
   *   "session.exercises[3].setExecutionMethod"
   *   null (when verdict is NO_TARGET / NOT_PREFERRED / DEFAULT_*)
   * AA1R / reconciler validates these post-AA3.
   */
  proofPath: string | null
  /** Exercise display name when the verdict targets a specific row. */
  target: string | null
}

// -----------------------------------------------------------------------------
// AA3 SESSION COACH PLAN — the single object stamped on each session.
// -----------------------------------------------------------------------------
export interface AA3CoachPlan {
  /** Internal versioning so future AA3 changes can be detected. */
  contractVersion: 'AA3-COACH-MATERIALIZATION-CORRIDOR-v1'
  /** Per-family verdicts. Always populated for every family in the taxonomy. */
  perMethod: Record<AA3MethodFamily, AA3PerMethodEntry>
  /**
   * Methods AA3 itself materialized on this session (subset of {'top_set',
   * 'drop_set'}). Empty array when AA3 made no structural change.
   */
  appliedByAA3: AA3MethodFamily[]
  /**
   * Compact one-line summary for headers. Derived from perMethod; safe to
   * surface in UI without re-computation. Example:
   *   "Applied: top_set on Weighted Pull-up. Considered: superset, circuit."
   */
  summary: string
  /** Volume-guard signal so UI can show "Volume cap held." when relevant. */
  volumeGuard: {
    totalScheduledSets: number
    exerciseCount: number
    triggered: boolean
    cap: number
  }
}

// -----------------------------------------------------------------------------
// VOLUME GUARD CAP
// Heuristic threshold for "this session is already loaded enough." Crossed
// only when total scheduled sets across all exercises >= cap. This is a
// SAFETY signal, not a tuning knob — AA3 only uses it to suppress
// fatigue-heavy additions (drop_set, density_block).
// -----------------------------------------------------------------------------
const AA3_VOLUME_CAP_TOTAL_SETS = 22
const AA3_VOLUME_CAP_EXERCISE_COUNT = 7

// -----------------------------------------------------------------------------
// LOADED-ANCHOR HEURISTIC
// Names that strongly imply a loadable strength anchor suitable for top_set.
// Conservative on purpose — false positives risk top-setting a skill hold.
// -----------------------------------------------------------------------------
const TOP_SET_NAME_HINTS = [
  'weighted pull-up',
  'weighted pull up',
  'weighted pullup',
  'weighted dip',
  'weighted chin-up',
  'weighted chin up',
  'weighted chinup',
  'weighted row',
  'weighted push-up',
  'weighted push up',
  'weighted pushup',
  'barbell row',
  'pendlay row',
  'bent-over row',
  'deadlift',
  'squat',
  'overhead press',
  'bench press',
]

// -----------------------------------------------------------------------------
// DROP-SET-SAFE NAME HINTS
// Movements where drop sets are doctrinally appropriate as the LAST
// accessory. Skill holds and high-tendon straight-arm work are excluded.
// -----------------------------------------------------------------------------
const DROP_SET_SAFE_NAME_HINTS = [
  'curl',
  'tricep extension',
  'pushdown',
  'lateral raise',
  'rear delt',
  'face pull',
  'cable row',
  'machine row',
  'leg extension',
  'leg curl',
  'calf raise',
  'shrug',
]

// -----------------------------------------------------------------------------
// SKILL-PRIORITY NAME HINTS
// Exercises whose technical quality must be protected from fatigue methods.
// -----------------------------------------------------------------------------
const SKILL_PRIORITY_NAME_HINTS = [
  'planche',
  'front lever',
  'back lever',
  'iron cross',
  'maltese',
  'manna',
  'one-arm',
  'one arm',
  'handstand',
  'human flag',
  'press to handstand',
]

// -----------------------------------------------------------------------------
// MINIMAL TYPES — duck-typed against the live program shape so this corridor
// does not depend on the heavy `lib/types` re-exports. Every field used is
// guarded with an existence check.
// -----------------------------------------------------------------------------
interface AA3ExerciseLike {
  id?: string | number
  name?: string
  setExecutionMethod?: string | null
  /** Some shapes use `sets` as a number, others as an array of set objects. */
  sets?: number | unknown[]
  /** Common alternate field names — checked defensively. */
  setCount?: number
  targetSets?: number
  isPrimary?: boolean
  isAccessory?: boolean
  category?: string
  movementCategory?: string
  intensityClass?: string
  blockId?: string
}

interface AA3StyledGroupLike {
  blockId?: string
  groupType?: string
  members?: Array<{ exerciseId?: string | number } | string>
}

interface AA3StyleMetadataLike {
  styledGroups?: AA3StyledGroupLike[]
  appliedMethods?: string[]
}

interface AA3WeeklyRoleLike {
  roleId?: string
  intensityClass?: string
  /** Some sessions use `goal`, some use `intent`. Both are read defensively. */
  goal?: string
  intent?: string
}

interface AA3MethodDecisionLike {
  selectedMethods?: string[]
  rejectedMethods?: Array<{ method?: string; reason?: string }>
}

interface AA3SessionLike {
  dayNumber?: number
  exercises?: AA3ExerciseLike[]
  styleMetadata?: AA3StyleMetadataLike | null
  methodDecision?: AA3MethodDecisionLike | null
  weeklyRole?: AA3WeeklyRoleLike | null
  /** Set by AA3 itself. */
  aa3CoachPlan?: AA3CoachPlan
}

interface AA3ProfileSnapshotLike {
  /** Onboarding method preferences feed eligibility for grouped methods. */
  methodPrefsForGrouping?: string[] | null
  selectedTrainingMethods?: string[] | null
  selectedSkills?: string[] | null
  jointCautions?: string[] | null
}

interface AA3WeeklyBudgetLike {
  /** Map of method -> sessions remaining in the week's budget. */
  perMethodSessionsRemaining?: Partial<Record<AA3MethodFamily, number>>
}

export interface AA3CorridorInput {
  session: AA3SessionLike
  profileSnapshot: AA3ProfileSnapshotLike | null
  weeklyMethodBudgetPlan: AA3WeeklyBudgetLike | null
  currentWeekNumber: number | null
}

// -----------------------------------------------------------------------------
// SHARED HELPERS
// -----------------------------------------------------------------------------
function lower(s: string | null | undefined): string {
  return (s ?? '').toLowerCase()
}

function nameMatchesAny(name: string | undefined, hints: string[]): boolean {
  const n = lower(name)
  if (!n) return false
  for (const h of hints) {
    if (n.includes(h)) return true
  }
  return false
}

/**
 * Extract a normalized scheduled-sets count for one exercise. Handles all
 * three shapes the codebase has used historically: `sets: number`,
 * `sets: SetObject[]`, or one of the alternate fields. Returns 0 when the
 * count is unknown so the volume guard is conservative (under-counts), not
 * over-counts.
 */
function scheduledSetsFor(ex: AA3ExerciseLike): number {
  if (typeof ex.sets === 'number' && Number.isFinite(ex.sets)) return Math.max(0, ex.sets)
  if (Array.isArray(ex.sets)) return ex.sets.length
  if (typeof ex.setCount === 'number' && Number.isFinite(ex.setCount)) return Math.max(0, ex.setCount)
  if (typeof ex.targetSets === 'number' && Number.isFinite(ex.targetSets)) return Math.max(0, ex.targetSets)
  return 0
}

/**
 * Detects whether ANY exercise on the session already carries this row-level
 * execution method. Used both to find "applied by prior pipeline" and to
 * prevent AA3 from double-applying.
 */
function findRowMethodIndex(
  exercises: AA3ExerciseLike[],
  method: string,
): number {
  for (let i = 0; i < exercises.length; i++) {
    if (lower(exercises[i]?.setExecutionMethod ?? null) === lower(method)) return i
  }
  return -1
}

/**
 * Detects whether the session already has a styledGroup of this groupType
 * with at least 2 bound members. Mirrors the AA1R reconciler's grouped-row
 * binding rule so AA3's verdict cannot disagree with the reconciler.
 */
function findStyledGroupOfType(
  styledGroups: AA3StyledGroupLike[] | undefined,
  groupType: 'superset' | 'circuit' | 'density_block',
): { index: number; group: AA3StyledGroupLike } | null {
  if (!styledGroups || !Array.isArray(styledGroups)) return null
  for (let i = 0; i < styledGroups.length; i++) {
    const g = styledGroups[i]
    if (lower(g?.groupType) !== groupType) continue
    const members = Array.isArray(g?.members) ? g!.members! : []
    if (members.length < 2) continue
    return { index: i, group: g }
  }
  return null
}

/**
 * "Skill-priority day?" — true when ANY exercise name matches a skill-quality
 * progression. AA3 uses this to suppress fatigue-heavy methods on technical
 * days even if doctrine eligibility says otherwise.
 */
function isSkillPriorityDay(exercises: AA3ExerciseLike[]): boolean {
  for (const ex of exercises) {
    if (nameMatchesAny(ex.name, SKILL_PRIORITY_NAME_HINTS)) return true
  }
  return false
}

/**
 * "Capacity / conditioning day?" — true when the weekly role marks this
 * session as a capacity / conditioning slot. Used to gate circuit / density
 * materialization (those are the right targets there).
 */
function isCapacityDay(weeklyRole: AA3WeeklyRoleLike | null | undefined): boolean {
  if (!weeklyRole) return false
  const tag = lower(weeklyRole.roleId) + ' ' + lower(weeklyRole.intensityClass) + ' ' + lower(weeklyRole.goal) + ' ' + lower(weeklyRole.intent)
  return /capacity|conditioning|endurance|metcon/.test(tag)
}

/**
 * User onboarding preference signal for a grouped-method family. AA3 uses
 * this only to gate "would the user welcome this if it were applied?" —
 * never as a sole reason to apply.
 */
function userPrefersMethod(
  profileSnapshot: AA3ProfileSnapshotLike | null,
  family: AA3MethodFamily,
): boolean {
  if (!profileSnapshot) return false
  const prefs = [
    ...(profileSnapshot.methodPrefsForGrouping ?? []),
    ...(profileSnapshot.selectedTrainingMethods ?? []),
  ].map(lower)
  // Pluralized aliases the onboarding form uses.
  const tokens: Record<AA3MethodFamily, string[]> = {
    superset: ['superset', 'supersets'],
    circuit: ['circuit', 'circuits'],
    density_block: ['density', 'density_block', 'density_blocks', 'density block'],
    top_set: ['top_set', 'top set', 'top sets'],
    drop_set: ['drop_set', 'drop set', 'drop sets'],
    cluster: ['cluster', 'clusters', 'cluster_sets', 'cluster sets'],
    rest_pause: ['rest_pause', 'rest pause', 'rest-pause'],
    straight_sets: ['straight_sets', 'straight sets'],
  }
  for (const t of tokens[family]) {
    if (prefs.includes(t)) return true
  }
  return false
}

/**
 * Doctrine-earned signal for a method. Currently `top_set` is doctrine-earned
 * for any session that contains a loaded anchor — onboarding does not have
 * to opt in. All other families default to preference-driven.
 */
function doctrineEarnedMethod(
  family: AA3MethodFamily,
  hasLoadedAnchor: boolean,
): boolean {
  if (family === 'top_set') return hasLoadedAnchor
  return false
}

/**
 * Index of the safest row to attach top_set to. Returns -1 when no
 * suitable anchor exists. "Safest" = first exercise whose name matches a
 * loaded-anchor hint AND does not match a skill-priority hint AND does not
 * already carry a setExecutionMethod.
 */
function pickTopSetTargetIndex(exercises: AA3ExerciseLike[]): number {
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (!ex) continue
    if (ex.setExecutionMethod && lower(ex.setExecutionMethod) !== 'straight_sets' && lower(ex.setExecutionMethod) !== '') continue
    if (nameMatchesAny(ex.name, SKILL_PRIORITY_NAME_HINTS)) continue
    if (nameMatchesAny(ex.name, TOP_SET_NAME_HINTS)) return i
  }
  return -1
}

/**
 * Index of the safest row to attach drop_set to. Returns -1 when none.
 * Picks the LAST safe accessory (drop sets belong at the end of work).
 */
function pickDropSetTargetIndex(exercises: AA3ExerciseLike[]): number {
  for (let i = exercises.length - 1; i >= 0; i--) {
    const ex = exercises[i]
    if (!ex) continue
    if (ex.setExecutionMethod && lower(ex.setExecutionMethod) !== 'straight_sets' && lower(ex.setExecutionMethod) !== '') continue
    if (nameMatchesAny(ex.name, SKILL_PRIORITY_NAME_HINTS)) continue
    if (nameMatchesAny(ex.name, DROP_SET_SAFE_NAME_HINTS)) return i
  }
  return -1
}

/**
 * Weekly budget remaining for a method. Returns Infinity when the budget
 * plan does not specify the method (treated as "no cap" rather than "zero").
 */
function budgetRemaining(
  budget: AA3WeeklyBudgetLike | null,
  family: AA3MethodFamily,
): number {
  if (!budget?.perMethodSessionsRemaining) return Number.POSITIVE_INFINITY
  const v = budget.perMethodSessionsRemaining[family]
  return typeof v === 'number' && Number.isFinite(v) ? v : Number.POSITIVE_INFINITY
}

// -----------------------------------------------------------------------------
// PER-METHOD CLASSIFIERS
// Each returns an AA3PerMethodEntry. Pure functions — no mutation. The
// corridor's main loop calls these, then ONLY the top_set / drop_set
// branches optionally mutate a single exercise row.
// -----------------------------------------------------------------------------

function classifySuperset(
  ctx: AA3CorridorInput,
  exercises: AA3ExerciseLike[],
  styleMeta: AA3StyleMetadataLike,
): AA3PerMethodEntry {
  // 1) Already applied by the existing structural-method-materialization-corridor?
  const found = findStyledGroupOfType(styleMeta.styledGroups, 'superset')
  if (found) {
    return {
      family: 'superset',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: 'Compatible accessory pair grouped back-to-back to save time without compromising the main quality exposure.',
      proofPath: `session.styleMetadata.styledGroups[${found.index}]`,
      target: null,
    }
  }
  // 2) Skill-priority day with no accessories long enough to pair safely?
  if (isSkillPriorityDay(exercises)) {
    return {
      family: 'superset',
      verdict: 'SUPPRESSED_BY_SKILL_PRIORITY',
      reason: 'Today is a high-skill technical day. Pairing exercises back-to-back would degrade execution quality on the primary skill work.',
      proofPath: null,
      target: null,
    }
  }
  // 3) Not enough non-skill rows to form a pair?
  const accessoryCount = exercises.filter(ex => !nameMatchesAny(ex.name, SKILL_PRIORITY_NAME_HINTS)).length
  if (accessoryCount < 2) {
    return {
      family: 'superset',
      verdict: 'NO_TARGET',
      reason: 'No compatible accessory pair available on this session — not enough non-skill movements to bracket together safely.',
      proofPath: null,
      target: null,
    }
  }
  // 4) User did not opt into supersets — record honestly without overriding.
  if (!userPrefersMethod(ctx.profileSnapshot, 'superset')) {
    return {
      family: 'superset',
      verdict: 'NOT_PREFERRED',
      reason: 'Onboarding did not select supersets as a preferred style. The pipeline can still choose them when efficiency clearly outweighs other goals.',
      proofPath: null,
      target: null,
    }
  }
  // 5) Eligible but the structural corridor declined this week — name the
  //    most likely doctrinal reason without inventing a new one.
  return {
    family: 'superset',
    verdict: 'CONSIDERED_NOT_OPTIMAL',
    reason: 'Considered: a safe accessory pair exists. Not used today because the weekly method budget already placed grouped efficiency on a different session.',
    proofPath: null,
    target: null,
  }
}

function classifyCircuit(
  ctx: AA3CorridorInput,
  exercises: AA3ExerciseLike[],
  styleMeta: AA3StyleMetadataLike,
): AA3PerMethodEntry {
  const found = findStyledGroupOfType(styleMeta.styledGroups, 'circuit')
  if (found) {
    return {
      family: 'circuit',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: 'Conditioning rotation through low-technical-risk movements builds capacity without compromising primary skill quality.',
      proofPath: `session.styleMetadata.styledGroups[${found.index}]`,
      target: null,
    }
  }
  if (isSkillPriorityDay(exercises)) {
    return {
      family: 'circuit',
      verdict: 'SUPPRESSED_BY_SKILL_PRIORITY',
      reason: 'Circuit not used: today is a high-skill / tendon-aware session. Fatigue from rotation would degrade technical quality on planche / lever / handstand work.',
      proofPath: null,
      target: null,
    }
  }
  if (!isCapacityDay(ctx.session.weeklyRole) && !userPrefersMethod(ctx.profileSnapshot, 'circuit')) {
    return {
      family: 'circuit',
      verdict: 'NOT_PREFERRED',
      reason: 'Circuit not used: this session is not assigned a capacity / conditioning role and your onboarding did not request circuits.',
      proofPath: null,
      target: null,
    }
  }
  if (exercises.length < 3) {
    return {
      family: 'circuit',
      verdict: 'NO_TARGET',
      reason: 'Circuit not used: a true rotation needs at least three compatible movements; this session does not have enough accessory targets.',
      proofPath: null,
      target: null,
    }
  }
  return {
    family: 'circuit',
    verdict: 'CONSIDERED_NOT_OPTIMAL',
    reason: 'Circuit considered, but blocked: rotating through these movements would push fatigue past the session\u2019s intensity target.',
    proofPath: null,
    target: null,
  }
}

function classifyDensityBlock(
  ctx: AA3CorridorInput,
  exercises: AA3ExerciseLike[],
  styleMeta: AA3StyleMetadataLike,
  volumeGuardTriggered: boolean,
): AA3PerMethodEntry {
  const found = findStyledGroupOfType(styleMeta.styledGroups, 'density_block')
  if (found) {
    return {
      family: 'density_block',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: 'Time-capped block on the accessory tail builds work capacity inside the session\u2019s intensity envelope.',
      proofPath: `session.styleMetadata.styledGroups[${found.index}]`,
      target: null,
    }
  }
  if (volumeGuardTriggered) {
    return {
      family: 'density_block',
      verdict: 'SUPPRESSED_BY_VOLUME_GUARD',
      reason: 'Density reduced: session volume is already high for the recovery budget. Adding a density block would push fatigue beyond the stated RPE cap.',
      proofPath: null,
      target: null,
    }
  }
  if (isSkillPriorityDay(exercises)) {
    return {
      family: 'density_block',
      verdict: 'SUPPRESSED_BY_SKILL_PRIORITY',
      reason: 'Density limited: today is a skill-priority day. A timed density block would compete with technical quality on the main movements.',
      proofPath: null,
      target: null,
    }
  }
  if (!isCapacityDay(ctx.session.weeklyRole) && !userPrefersMethod(ctx.profileSnapshot, 'density_block')) {
    return {
      family: 'density_block',
      verdict: 'NOT_PREFERRED',
      reason: 'Density block not used: the session is not a capacity day and density was not requested in onboarding.',
      proofPath: null,
      target: null,
    }
  }
  return {
    family: 'density_block',
    verdict: 'CONSIDERED_NOT_OPTIMAL',
    reason: 'Density considered, but limited: time-capped work would extend fatigue past the recovery window for this week.',
    proofPath: null,
    target: null,
  }
}

function classifyTopSet(
  exercises: AA3ExerciseLike[],
  weekNumber: number,
  hasLoadedAnchor: boolean,
  budget: AA3WeeklyBudgetLike | null,
  alreadyAppliedByPrior: boolean,
  alreadyAppliedByAA3: boolean,
  appliedTargetName: string | null,
): AA3PerMethodEntry {
  if (alreadyAppliedByAA3) {
    return {
      family: 'top_set',
      verdict: 'APPLIED_BY_AA3',
      reason: `Top set selected for ${appliedTargetName ?? 'today\u2019s loaded anchor'}: doctrine earns it (loaded movement, post-acclimation week) and no other intensity method conflicts.`,
      proofPath: 'session.exercises[i].setExecutionMethod = "top_set"',
      target: appliedTargetName,
    }
  }
  if (alreadyAppliedByPrior) {
    return {
      family: 'top_set',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: `Top set placed on ${appliedTargetName ?? 'a loaded anchor'} by the doctrine application corridor.`,
      proofPath: 'session.exercises[i].setExecutionMethod = "top_set"',
      target: appliedTargetName,
    }
  }
  if (!hasLoadedAnchor) {
    return {
      family: 'top_set',
      verdict: 'NO_TARGET',
      reason: 'Top set not used: no loadable strength anchor on this session (no weighted / barbell / dumbbell movement detected).',
      proofPath: null,
      target: null,
    }
  }
  if (weekNumber < 2) {
    return {
      family: 'top_set',
      verdict: 'CONSIDERED_NOT_OPTIMAL',
      reason: 'Top set held back: first-week protection caps single-set peak intensity until the program has at least one week of baseline data.',
      proofPath: null,
      target: null,
    }
  }
  if (budgetRemaining(budget, 'top_set') <= 0) {
    return {
      family: 'top_set',
      verdict: 'CONSIDERED_NOT_OPTIMAL',
      reason: 'Top set considered, not used today: this week\u2019s top-set budget was already placed on a different session to preserve recovery.',
      proofPath: null,
      target: null,
    }
  }
  if (isSkillPriorityDay(exercises)) {
    return {
      family: 'top_set',
      verdict: 'SUPPRESSED_BY_SKILL_PRIORITY',
      reason: 'Top set held back: a peak intensity row on a skill-priority day would compete with technical quality on the primary movement.',
      proofPath: null,
      target: null,
    }
  }
  // Should not reach here when AA3.B mutation logic is correct, but kept as
  // an honest fallback rather than silently going to NO_TARGET.
  return {
    family: 'top_set',
    verdict: 'CONSIDERED_NOT_OPTIMAL',
    reason: 'Top set considered: a loadable anchor exists, but another intensity method already owns this session\u2019s peak slot.',
    proofPath: null,
    target: null,
  }
}

function classifyDropSet(
  ctx: AA3CorridorInput,
  exercises: AA3ExerciseLike[],
  weekNumber: number,
  budget: AA3WeeklyBudgetLike | null,
  volumeGuardTriggered: boolean,
  alreadyAppliedByPrior: boolean,
  alreadyAppliedByAA3: boolean,
  appliedTargetName: string | null,
  hasDropSetSafeRow: boolean,
): AA3PerMethodEntry {
  if (alreadyAppliedByAA3) {
    return {
      family: 'drop_set',
      verdict: 'APPLIED_BY_AA3',
      reason: `Drop set placed on ${appliedTargetName ?? 'the last accessory'}: hypertrophy slot, low technical interference, volume budget allows.`,
      proofPath: 'session.exercises[i].setExecutionMethod = "drop_set"',
      target: appliedTargetName,
    }
  }
  if (alreadyAppliedByPrior) {
    return {
      family: 'drop_set',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: `Drop set placed on ${appliedTargetName ?? 'an accessory row'} by the doctrine application corridor.`,
      proofPath: 'session.exercises[i].setExecutionMethod = "drop_set"',
      target: appliedTargetName,
    }
  }
  if (volumeGuardTriggered) {
    return {
      family: 'drop_set',
      verdict: 'SUPPRESSED_BY_VOLUME_GUARD',
      reason: 'Drop set skipped: accessory fatigue cost conflicts with this session\u2019s volume budget — adding it would push recovery past the weekly target.',
      proofPath: null,
      target: null,
    }
  }
  if (isSkillPriorityDay(exercises)) {
    return {
      family: 'drop_set',
      verdict: 'SUPPRESSED_BY_SKILL_PRIORITY',
      reason: 'Drop set skipped: today is skill-priority. Hypertrophy fatigue would compete with technical quality on planche / lever / handstand work.',
      proofPath: null,
      target: null,
    }
  }
  if (!hasDropSetSafeRow) {
    return {
      family: 'drop_set',
      verdict: 'NO_TARGET',
      reason: 'Drop set not used: no safe hypertrophy accessory row on this session (skill holds and tendon-sensitive straight-arm work are excluded).',
      proofPath: null,
      target: null,
    }
  }
  if (weekNumber < 2) {
    return {
      family: 'drop_set',
      verdict: 'CONSIDERED_NOT_OPTIMAL',
      reason: 'Drop set held back: first-week protection avoids high-fatigue methods until the program has baseline performance data.',
      proofPath: null,
      target: null,
    }
  }
  if (!userPrefersMethod(ctx.profileSnapshot, 'drop_set')) {
    return {
      family: 'drop_set',
      verdict: 'NOT_PREFERRED',
      reason: 'Drop set not used: onboarding did not request drop sets, and doctrine does not require them for the selected skills today.',
      proofPath: null,
      target: null,
    }
  }
  if (budgetRemaining(budget, 'drop_set') <= 0) {
    return {
      family: 'drop_set',
      verdict: 'CONSIDERED_NOT_OPTIMAL',
      reason: 'Drop set considered, not used today: this week\u2019s drop-set budget already placed on a different session to manage fatigue distribution.',
      proofPath: null,
      target: null,
    }
  }
  return {
    family: 'drop_set',
    verdict: 'CONSIDERED_NOT_OPTIMAL',
    reason: 'Drop set considered: a safe accessory exists, but the session\u2019s overall stress score is already at the comfortable cap for this week.',
    proofPath: null,
    target: null,
  }
}

function classifyCluster(
  exercises: AA3ExerciseLike[],
): AA3PerMethodEntry {
  // Cluster live execution is BLOCKED_BY_RUNTIME by AA2's runtime registry.
  // AA3 honors that classification literally — no fake clusters.
  const idx = findRowMethodIndex(exercises, 'cluster')
  if (idx >= 0) {
    return {
      family: 'cluster',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: `Cluster cue placed on ${exercises[idx]?.name ?? 'a heavy strength row'}: doctrine earns it and the row supports clustered output.`,
      proofPath: `session.exercises[${idx}].setExecutionMethod`,
      target: exercises[idx]?.name ?? null,
    }
  }
  return {
    family: 'cluster',
    verdict: 'BLOCKED_BY_RUNTIME',
    reason: 'Cluster sets remain blocked: the live workout reducer cannot yet safely express intra-set rest semantics. Doctrine valid; runtime not yet ready.',
    proofPath: null,
    target: null,
  }
}

function classifyRestPause(
  ctx: AA3CorridorInput,
  exercises: AA3ExerciseLike[],
): AA3PerMethodEntry {
  const idx = findRowMethodIndex(exercises, 'rest_pause')
  if (idx >= 0) {
    return {
      family: 'rest_pause',
      verdict: 'APPLIED_BY_PRIOR_PIPELINE',
      reason: `Rest-pause placed on ${exercises[idx]?.name ?? 'a safe accessory row'} for hypertrophy density without skill-quality risk.`,
      proofPath: `session.exercises[${idx}].setExecutionMethod`,
      target: exercises[idx]?.name ?? null,
    }
  }
  if (isSkillPriorityDay(exercises)) {
    return {
      family: 'rest_pause',
      verdict: 'SUPPRESSED_BY_SKILL_PRIORITY',
      reason: 'Rest-pause not used: too fatiguing on skill-priority days; the technical movement needs full neural quality.',
      proofPath: null,
      target: null,
    }
  }
  if (!userPrefersMethod(ctx.profileSnapshot, 'rest_pause')) {
    return {
      family: 'rest_pause',
      verdict: 'NOT_PREFERRED',
      reason: 'Rest-pause not used: onboarding did not request it and doctrine does not require it for the selected accessories today.',
      proofPath: null,
      target: null,
    }
  }
  return {
    family: 'rest_pause',
    verdict: 'CONSIDERED_NOT_OPTIMAL',
    reason: 'Rest-pause considered: a safe accessory exists, but the doctrine application corridor placed an alternative intensity method on this session instead.',
    proofPath: null,
    target: null,
  }
}

function classifyStraightSets(
  exercises: AA3ExerciseLike[],
  appliedFamilies: Set<AA3MethodFamily>,
  weekNumber: number,
): AA3PerMethodEntry {
  // Honest classification: straight sets are CHOSEN, not "the leftover."
  if (appliedFamilies.size === 0) {
    if (weekNumber < 2) {
      return {
        family: 'straight_sets',
        verdict: 'DEFAULT_STRAIGHT_SETS_INTENTIONAL',
        reason: 'Straight sets today on purpose: first-week conservative ramp protects technical quality and gives the program clean baseline data before adding intensity methods.',
        proofPath: null,
        target: null,
      }
    }
    if (isSkillPriorityDay(exercises)) {
      return {
        family: 'straight_sets',
        verdict: 'DEFAULT_STRAIGHT_SETS_INTENTIONAL',
        reason: 'Straight sets today on purpose: this is a skill-priority day, and clean straight sets preserve technical quality on planche / lever / handstand work.',
        proofPath: null,
        target: null,
      }
    }
    return {
      family: 'straight_sets',
      verdict: 'DEFAULT_STRAIGHT_SETS_INTENTIONAL',
      reason: 'Straight sets today on purpose: today\u2019s composition favors focused quality over grouping. Other methods were considered and ruled out by specific doctrine reasons (see below).',
      proofPath: null,
      target: null,
    }
  }
  return {
    family: 'straight_sets',
    verdict: 'APPLIED_BY_PRIOR_PIPELINE',
    reason: 'Straight sets remain the default for any row not carrying a row-level execution method.',
    proofPath: null,
    target: null,
  }
}

// -----------------------------------------------------------------------------
// MAIN ENTRY — runAA3CoachMaterializationCorridor
// Pure function over a single session. Mutates only:
//   - session.aa3CoachPlan         (always written)
//   - session.exercises[i].setExecutionMethod  (only for top_set/drop_set
//                                                 in the narrow safe path)
// Never throws. Caller wraps in try/catch for absolute safety, but the
// internal logic is total over the duck-typed inputs.
// -----------------------------------------------------------------------------
export interface AA3CorridorResult {
  /** Compact result for the per-program rollup. */
  diagnostic: {
    dayNumber: number | null
    appliedByAA3: AA3MethodFamily[]
    perMethodVerdict: Record<AA3MethodFamily, AA3MethodVerdict>
    volumeGuardTriggered: boolean
  }
}

export function runAA3CoachMaterializationCorridor(
  input: AA3CorridorInput,
): AA3CorridorResult {
  const session = input.session
  const exercises: AA3ExerciseLike[] = Array.isArray(session.exercises) ? session.exercises : []
  const styleMeta: AA3StyleMetadataLike = session.styleMetadata ?? {}
  const weekNumber = typeof input.currentWeekNumber === 'number' ? input.currentWeekNumber : 1

  // --- Volume guard ---------------------------------------------------------
  let totalScheduledSets = 0
  for (const ex of exercises) totalScheduledSets += scheduledSetsFor(ex)
  const volumeGuardTriggered =
    totalScheduledSets >= AA3_VOLUME_CAP_TOTAL_SETS ||
    exercises.length >= AA3_VOLUME_CAP_EXERCISE_COUNT

  // --- Detect prior-pipeline applications ----------------------------------
  const priorTopSetIdx = findRowMethodIndex(exercises, 'top_set')
  const priorDropSetIdx = findRowMethodIndex(exercises, 'drop_set')
  const hasLoadedAnchor = exercises.some(ex => nameMatchesAny(ex.name, TOP_SET_NAME_HINTS))
  const hasDropSetSafeRow = exercises.some(ex => nameMatchesAny(ex.name, DROP_SET_SAFE_NAME_HINTS) && !nameMatchesAny(ex.name, SKILL_PRIORITY_NAME_HINTS))

  // --- AA3.B: NARROW ADDITIVE ROW MUTATION ---------------------------------
  // Only fires when ALL safety gates pass. At most ONE mutation per session
  // (top_set is preferred over drop_set when both are eligible, because
  // top_set is doctrine-earned and lower-fatigue).
  const appliedByAA3: AA3MethodFamily[] = []
  let aa3TopSetTargetName: string | null = null
  let aa3DropSetTargetName: string | null = null

  if (priorTopSetIdx < 0 && hasLoadedAnchor && weekNumber >= 2 && !isSkillPriorityDay(exercises)) {
    if (budgetRemaining(input.weeklyMethodBudgetPlan, 'top_set') > 0 && doctrineEarnedMethod('top_set', hasLoadedAnchor)) {
      // Pick the safest target row.
      const targetIdx = pickTopSetTargetIndex(exercises)
      if (targetIdx >= 0) {
        const ex = exercises[targetIdx]
        if (ex) {
          ex.setExecutionMethod = 'top_set'
          aa3TopSetTargetName = ex.name ?? null
          appliedByAA3.push('top_set')
        }
      }
    }
  }

  // Drop_set mutation only fires when AA3 did NOT just apply top_set on
  // the same session. AA3 keeps its footprint to one row per session.
  if (
    appliedByAA3.length === 0 &&
    priorDropSetIdx < 0 &&
    !volumeGuardTriggered &&
    !isSkillPriorityDay(exercises) &&
    weekNumber >= 2 &&
    userPrefersMethod(input.profileSnapshot, 'drop_set') &&
    budgetRemaining(input.weeklyMethodBudgetPlan, 'drop_set') > 0
  ) {
    const targetIdx = pickDropSetTargetIndex(exercises)
    if (targetIdx >= 0) {
      const ex = exercises[targetIdx]
      if (ex) {
        ex.setExecutionMethod = 'drop_set'
        aa3DropSetTargetName = ex.name ?? null
        appliedByAA3.push('drop_set')
      }
    }
  }

  // --- Per-method classification -------------------------------------------
  const supersetEntry = classifySuperset(input, exercises, styleMeta)
  const circuitEntry = classifyCircuit(input, exercises, styleMeta)
  const densityEntry = classifyDensityBlock(input, exercises, styleMeta, volumeGuardTriggered)

  const topSetEntry = classifyTopSet(
    exercises,
    weekNumber,
    hasLoadedAnchor,
    input.weeklyMethodBudgetPlan,
    priorTopSetIdx >= 0,
    appliedByAA3.includes('top_set'),
    aa3TopSetTargetName ?? exercises[priorTopSetIdx]?.name ?? null,
  )
  const dropSetEntry = classifyDropSet(
    input,
    exercises,
    weekNumber,
    input.weeklyMethodBudgetPlan,
    volumeGuardTriggered,
    priorDropSetIdx >= 0,
    appliedByAA3.includes('drop_set'),
    aa3DropSetTargetName ?? exercises[priorDropSetIdx]?.name ?? null,
    hasDropSetSafeRow,
  )
  const clusterEntry = classifyCluster(exercises)
  const restPauseEntry = classifyRestPause(input, exercises)

  // Apply set is now stable; compute applied family set for straight_sets
  // honesty classifier.
  const appliedFamilies = new Set<AA3MethodFamily>()
  for (const e of [supersetEntry, circuitEntry, densityEntry, topSetEntry, dropSetEntry, clusterEntry, restPauseEntry]) {
    if (e.verdict === 'APPLIED_BY_PRIOR_PIPELINE' || e.verdict === 'APPLIED_BY_AA3') {
      appliedFamilies.add(e.family)
    }
  }
  const straightSetsEntry = classifyStraightSets(exercises, appliedFamilies, weekNumber)

  const perMethod: Record<AA3MethodFamily, AA3PerMethodEntry> = {
    superset: supersetEntry,
    circuit: circuitEntry,
    density_block: densityEntry,
    top_set: topSetEntry,
    drop_set: dropSetEntry,
    cluster: clusterEntry,
    rest_pause: restPauseEntry,
    straight_sets: straightSetsEntry,
  }

  // --- Summary line --------------------------------------------------------
  // Compact, honest, derived purely from perMethod. UI can render directly
  // without any string manipulation. Examples:
  //   "Applied: top_set on Weighted Pull-up. Considered: superset, circuit."
  //   "Straight sets today on purpose. Considered: superset, top_set, density."
  const appliedLines: string[] = []
  const consideredFamilies: string[] = []
  for (const family of Object.keys(perMethod) as AA3MethodFamily[]) {
    const e = perMethod[family]
    if (e.verdict === 'APPLIED_BY_AA3' || e.verdict === 'APPLIED_BY_PRIOR_PIPELINE') {
      if (e.target) appliedLines.push(`${family} on ${e.target}`)
      else if (family !== 'straight_sets') appliedLines.push(family)
    } else if (e.verdict === 'CONSIDERED_NOT_OPTIMAL') {
      consideredFamilies.push(family)
    }
  }
  const summaryParts: string[] = []
  if (appliedLines.length > 0) summaryParts.push(`Applied: ${appliedLines.join(', ')}.`)
  else if (perMethod.straight_sets.verdict === 'DEFAULT_STRAIGHT_SETS_INTENTIONAL') {
    summaryParts.push('Straight sets today on purpose.')
  }
  if (consideredFamilies.length > 0) summaryParts.push(`Considered: ${consideredFamilies.join(', ')}.`)
  const summary = summaryParts.join(' ')

  // --- Stamp on session ----------------------------------------------------
  const plan: AA3CoachPlan = {
    contractVersion: 'AA3-COACH-MATERIALIZATION-CORRIDOR-v1',
    perMethod,
    appliedByAA3,
    summary,
    volumeGuard: {
      totalScheduledSets,
      exerciseCount: exercises.length,
      triggered: volumeGuardTriggered,
      cap: AA3_VOLUME_CAP_TOTAL_SETS,
    },
  }
  session.aa3CoachPlan = plan

  // --- Diagnostic ----------------------------------------------------------
  const perMethodVerdict: Record<AA3MethodFamily, AA3MethodVerdict> = {
    superset: supersetEntry.verdict,
    circuit: circuitEntry.verdict,
    density_block: densityEntry.verdict,
    top_set: topSetEntry.verdict,
    drop_set: dropSetEntry.verdict,
    cluster: clusterEntry.verdict,
    rest_pause: restPauseEntry.verdict,
    straight_sets: straightSetsEntry.verdict,
  }

  return {
    diagnostic: {
      dayNumber: typeof session.dayNumber === 'number' ? session.dayNumber : null,
      appliedByAA3,
      perMethodVerdict,
      volumeGuardTriggered,
    },
  }
}

// -----------------------------------------------------------------------------
// PROGRAM-LEVEL ROLLUP
// Aggregates per-session diagnostics for the generator's structured log.
// -----------------------------------------------------------------------------
export interface AA3ProgramRollup {
  sessionsProcessed: number
  sessionsWithAA3Mutation: number
  perMethodApplicationCount: Record<AA3MethodFamily, number>
  volumeGuardTriggeredSessions: number
}

export function buildAA3ProgramRollup(diagnostics: AA3CorridorResult['diagnostic'][]): AA3ProgramRollup {
  const rollup: AA3ProgramRollup = {
    sessionsProcessed: diagnostics.length,
    sessionsWithAA3Mutation: 0,
    perMethodApplicationCount: {
      superset: 0,
      circuit: 0,
      density_block: 0,
      top_set: 0,
      drop_set: 0,
      cluster: 0,
      rest_pause: 0,
      straight_sets: 0,
    },
    volumeGuardTriggeredSessions: 0,
  }
  for (const d of diagnostics) {
    if (d.appliedByAA3.length > 0) rollup.sessionsWithAA3Mutation += 1
    if (d.volumeGuardTriggered) rollup.volumeGuardTriggeredSessions += 1
    for (const family of d.appliedByAA3) rollup.perMethodApplicationCount[family] += 1
    // Also count prior-pipeline applications so the rollup is honest.
    for (const family of Object.keys(d.perMethodVerdict) as AA3MethodFamily[]) {
      if (d.perMethodVerdict[family] === 'APPLIED_BY_PRIOR_PIPELINE' && !d.appliedByAA3.includes(family)) {
        rollup.perMethodApplicationCount[family] += 1
      }
    }
  }
  return rollup
}
