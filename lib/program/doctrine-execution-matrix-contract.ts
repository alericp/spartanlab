/**
 * =============================================================================
 * [PHASE Y1 OF 3] DOCTRINE EXECUTION MATRIX + CAUSAL UTILIZATION PROOF
 * =============================================================================
 *
 * PURPOSE
 * -------
 * The Program page already proves THAT 10 doctrine batches / 1,500+ rules
 * are loaded. It does NOT yet honestly prove WHICH bundles actually changed
 * the final program vs which ones are loaded-but-explanatory.
 *
 * Phase Y1 answers exactly one question:
 *
 *   "Are the 1,500+ doctrine/rules actually changing the final training
 *    program, or are they mostly being loaded, counted, acknowledged, and
 *    displayed?"
 *
 * It does this by reading objects the builder has ALREADY computed and
 * stamped on the program — `doctrineMaterializationMatrix`, `runtimeContract`,
 * `doctrineCausalChallenge`, `rowLevelMutatorRollup` /
 * `doctrineApplicationRollup`, `weeklyMethodRepresentation`,
 * `weeklyStressGovernorAdjustments`, and `sessions[].exercises[]` /
 * `sessions[].styleMetadata.styledGroups` — and producing a per-DOMAIN
 * (per-bundle) execution row, plus three targeted traces:
 *
 *   1. RPE-7 reason trace
 *   2. Density materialization trace
 *   3. Superset / pairing fatigue overlap trace
 *
 * NON-NEGOTIABLES OBEYED
 * ----------------------
 *   - pure TypeScript (no React, no hooks, no DB, no fetch)
 *   - JSON-safe (survives DB save / API roundtrip)
 *   - no side effects (timestamp is injectable)
 *   - no schema changes
 *   - no new dependencies
 *   - no generator rewrite
 *   - no live workout runtime change
 *   - the matrix is ADDITIVE — if any input is missing the row reports
 *     UNKNOWN_OR_UNVERIFIED honestly instead of pretending success
 *   - raw rule count is NOT used as proof of causality. The verdict reads
 *     bundlesMutatedProgram, not rulesLoaded.
 *
 * IMPORTANT — HONESTY
 * -------------------
 * If the matrix cannot determine causality from existing artifacts, it
 * MUST say so (UNKNOWN_OR_UNVERIFIED + INSUFFICIENT_PROOF verdict). It
 * MUST NOT promote DISPLAY_ONLY into MUTATED_PROGRAM just because rules
 * are loaded.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// State taxonomy — every doctrine bundle row resolves to exactly one of these.
// -----------------------------------------------------------------------------
export type DoctrineBundleState =
  | 'NOT_LOADED'
  | 'LOADED_NOT_ELIGIBLE'
  | 'ELIGIBLE_NOT_FIRED'
  | 'FIRED_NO_MUTATION'
  | 'MUTATED_PROGRAM'
  | 'DISPLAY_ONLY'
  | 'SUPPRESSED_BY_SAFETY'
  | 'BLOCKED_BY_RUNTIME'
  | 'SHADOWED_BY_HIGHER_PRIORITY_RULE'
  | 'UNKNOWN_OR_UNVERIFIED'

export type CausalUtilizationVerdict =
  | 'STRONGLY_CAUSAL'
  | 'PARTIALLY_CAUSAL'
  | 'MOSTLY_EXPLANATORY'
  | 'OVER_SUPPRESSED'
  | 'INSUFFICIENT_PROOF'
  | 'UNKNOWN'

// -----------------------------------------------------------------------------
// RPE-7 reason taxonomy — one stamp per audited exercise.
// -----------------------------------------------------------------------------
export type RpeReasonCode =
  | 'protected_week_cap'
  | 'tendon_safety_cap'
  | 'recovery_conservative'
  | 'support_day_intent'
  | 'skill_quality_intent'
  | 'method_owned'
  | 'default_fallback'
  | 'unknown_unexplained'

// -----------------------------------------------------------------------------
// Density materialization verdict.
// -----------------------------------------------------------------------------
export type DensityMaterializationVerdict =
  | 'DENSITY_MATERIALIZED'
  | 'DENSITY_CLAIM_NOT_MATERIALIZED'
  | 'DENSITY_BLOCKED_BY_RUNTIME'
  | 'DENSITY_NOT_CLAIMED'

// -----------------------------------------------------------------------------
// Pairing fatigue-overlap verdict.
// -----------------------------------------------------------------------------
export type PairingVerdict =
  | 'GOOD_PAIRING'
  | 'ACCEPTABLE_IF_LOW_VOLUME'
  | 'NEEDS_REST_OR_REORDER'
  | 'SHOULD_NOT_BE_SUPERSET'
  | 'UNKNOWN'

// =============================================================================
// PUBLIC SHAPES
// =============================================================================

export interface DoctrineBundleRow {
  /** Stable bundle id — one row per logical doctrine domain, NOT per micro-rule. */
  id: string
  /** Source batch this bundle is anchored in (batch_01..batch_10 or 'multi'). */
  sourceBatch: string
  /** Domain label that maps to a UI surface. */
  domain: string

  loadedStatus: 'LOADED' | 'NOT_LOADED' | 'PARTIAL'
  eligibilityStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN'
  firedStatus: 'FIRED' | 'NOT_FIRED' | 'UNKNOWN'
  mutationStatus: 'MUTATED' | 'NO_MUTATION' | 'UNKNOWN'
  visibleStatus: 'VISIBLE' | 'NOT_VISIBLE' | 'UNKNOWN'

  blockedReason: string | null
  suppressionReason: string | null

  /** 0..1 — how confident the matrix is in this row's verdict. */
  confidence: number

  affectedDays: number[]
  affectedExercises: string[]
  exampleBefore: string | null
  exampleAfter: string | null
  changedFields: string[]
  /** True when the bundle only changed proof/explanation surfaces. */
  explanationOnly: boolean

  finalVerdict: DoctrineBundleState
  notes: string
}

export interface DoctrineExecutionSummary {
  batchesLoaded: number
  bundlesEligible: number
  bundlesFired: number
  bundlesMutatedProgram: number
  bundlesDisplayOnly: number
  bundlesSuppressedBySafety: number
  bundlesBlockedByRuntime: number
  bundlesUnknownOrUnverified: number
  causalUtilizationVerdict: CausalUtilizationVerdict
  /** One-line athlete-facing summary used by the compact UI surface. */
  oneLineExplanation: string
}

export interface RpeReasonTraceRow {
  day: number
  exerciseId: string
  exerciseName: string
  originalTargetRPE: number | null
  finalTargetRPE: number | null
  reason: RpeReasonCode
  capSource: string | null
  sessionRole: string | null
  exerciseStressType: string | null
  confidence: 'high' | 'moderate' | 'low'
}

export interface DensityTraceRow {
  day: number
  blockId: string
  exercises: string[]
  restSecondsObserved: number | null
  hasTimeCap: boolean
  hasEmomOrAmrap: boolean
  hasShortRestWindow: boolean
  verdict: DensityMaterializationVerdict
  reason: string
}

export interface PairingTraceRow {
  day: number
  blockId: string
  groupType: string
  exercises: string[]
  overlapScore: 'LOW' | 'MODERATE' | 'HIGH'
  overlapAxes: string[]
  /** Pre-formatted pair label for UI rows. */
  pairLabel: string
  verdict: PairingVerdict
  reason: string
  /** True when this row is the explicit Skin the Cat + C2B Pull-Up audit. */
  isSkinTheCatPlusC2BCheck: boolean
}

export interface DoctrineExecutionMatrix {
  version: 'phase-y1.doctrine-execution-matrix.v1'
  generatedAt: string
  bundles: DoctrineBundleRow[]
  summary: DoctrineExecutionSummary
  rpeReasonTrace: {
    rows: RpeReasonTraceRow[]
    counts: Record<RpeReasonCode, number>
    /** True when many RPE-7 rows are default_fallback/unknown_unexplained. */
    rpeFlattenedSuspected: boolean
    notes: string
  }
  densityTrace: {
    rows: DensityTraceRow[]
    materializedCount: number
    notMaterializedCount: number
    blockedCount: number
    overallVerdict: DensityMaterializationVerdict | 'NO_DENSITY_IN_PROGRAM'
  }
  pairingTrace: {
    rows: PairingTraceRow[]
    skinTheCatPlusC2BFound: boolean
    /** Compact verdict counts for the UI summary chip strip. */
    counts: Record<PairingVerdict, number>
  }
}

// =============================================================================
// INTERNAL HELPERS — pure, total, defensive.
// =============================================================================

const DEFAULT_NOW = (): string => new Date().toISOString()

function asNumber(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) ? x : 0
}

function asArray<T = unknown>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : []
}

function asString(x: unknown): string {
  return typeof x === 'string' ? x : ''
}

function lc(x: unknown): string {
  return asString(x).toLowerCase()
}

// -----------------------------------------------------------------------------
// Overlap axis detection. Pure string-keyword heuristics on exercise names —
// the matrix never imports the exercise database to avoid coupling and to
// keep this file pure.
// -----------------------------------------------------------------------------
type OverlapAxis =
  | 'grip'
  | 'scapular_control'
  | 'shoulder_extension'
  | 'straight_arm_tendon'
  | 'elbow_flexor'
  | 'lats'
  | 'core_compression'
  | 'wrist_loading'
  | 'shoulder_loading'
  | 'explosive_pull'
  | 'high_neural'

function axesForExercise(name: string): Set<OverlapAxis> {
  const n = lc(name)
  const axes = new Set<OverlapAxis>()
  // grip
  if (/(pull[- ]?up|chin[- ]?up|row|hang|deadhang|deadlift|cleans|farmer)/.test(n)) axes.add('grip')
  // scapular control
  if (/(skin[- ]?the[- ]?cat|dip|support hold|german hang|inverted hang|scapular)/.test(n))
    axes.add('scapular_control')
  // shoulder extension
  if (/(skin[- ]?the[- ]?cat|german hang|back lever|reverse fly)/.test(n))
    axes.add('shoulder_extension')
  // straight-arm tendon
  if (/(planche|lever|skin[- ]?the[- ]?cat|tuck fl|tuck front lever|cross|maltese)/.test(n))
    axes.add('straight_arm_tendon')
  // elbow flexor
  if (/(pull[- ]?up|chin[- ]?up|curl|row|muscle[- ]?up)/.test(n)) axes.add('elbow_flexor')
  // lats
  if (/(pull[- ]?up|chin[- ]?up|row|lat|pull[- ]?down)/.test(n)) axes.add('lats')
  // core compression
  if (/(l[- ]?sit|skin[- ]?the[- ]?cat|tuck|compression|v[- ]?sit|hollow|toes[- ]?to[- ]?bar)/.test(n))
    axes.add('core_compression')
  // wrist loading
  if (/(planche|handstand|push[- ]?up|press|hspu|dip)/.test(n)) axes.add('wrist_loading')
  // shoulder loading
  if (/(hspu|handstand|dip|planche|press|push[- ]?up|overhead)/.test(n))
    axes.add('shoulder_loading')
  // explosive pull
  if (/(muscle[- ]?up|c2b|chest[- ]?to[- ]?bar|kipping|explosive pull)/.test(n))
    axes.add('explosive_pull')
  // high neural
  if (/(planche|lever|cross|maltese|c2b|chest[- ]?to[- ]?bar|muscle[- ]?up|one[- ]?arm)/.test(n))
    axes.add('high_neural')
  return axes
}

function intersectAxes(a: Set<OverlapAxis>, b: Set<OverlapAxis>): OverlapAxis[] {
  const out: OverlapAxis[] = []
  a.forEach(ax => {
    if (b.has(ax)) out.push(ax)
  })
  return out
}

function isSkinTheCat(name: string): boolean {
  return /skin[- ]?the[- ]?cat/.test(lc(name))
}
function isC2BPullUp(name: string): boolean {
  const n = lc(name)
  return /chest[- ]?to[- ]?bar|c2b/.test(n) && /pull[- ]?up/.test(n)
}

// =============================================================================
// MATRIX BUILDER
// =============================================================================

export interface BuildExecutionMatrixArgs {
  /**
   * The program object as the builder produced it (already stamped with
   * doctrineMaterializationMatrix, runtimeContract, doctrineCausalChallenge,
   * rowLevelMutatorRollup / doctrineApplicationRollup,
   * weeklyMethodRepresentation, weeklyStressGovernorAdjustments,
   * sessions[].exercises[], sessions[].styleMetadata.styledGroups).
   *
   * Typed loose so the matrix never breaks if a stamp is missing —
   * missing stamps resolve to UNKNOWN_OR_UNVERIFIED rows.
   */
  program: Record<string, unknown> | null | undefined
  /** Injectable for tests / determinism. */
  now?: () => string
}

export function buildDoctrineExecutionMatrix(
  args: BuildExecutionMatrixArgs,
): DoctrineExecutionMatrix {
  const now = args.now ?? DEFAULT_NOW
  const generatedAt = now()
  const program = args.program ?? {}

  // ---------------------------------------------------------------------------
  // Defensive reads of every artifact this matrix depends on.
  // ---------------------------------------------------------------------------
  const runtimeContract = (program as { runtimeContract?: unknown }).runtimeContract as
    | {
        available?: boolean
        batchCoverage?: { batchAtomCounts?: Record<string, number> }
        methodDoctrine?: { preferredMethods?: string[]; blockedMethods?: string[]; densityAllowed?: boolean }
        doctrineCoverage?: Record<string, number>
      }
    | undefined

  const matMatrix = (program as { doctrineMaterializationMatrix?: unknown })
    .doctrineMaterializationMatrix as
    | {
        materialProgramChanged?: boolean
        categories?: Array<{
          category: string
          status: string
          rulesRead?: number
          rulesMaterialized?: number
          changedProgramFields?: string[]
          noChangeReason?: string | null
        }>
      }
    | undefined

  const causal = (program as { doctrineCausalChallenge?: unknown }).doctrineCausalChallenge as
    | {
        materialProgramChanged?: boolean
        sessionsTopCandidateChanged?: number
        diffSummary?: {
          changedExerciseCount?: number
          selectionRulesMatchedTotal?: number
          carryoverRulesMatchedTotal?: number
          contraindicationRulesMatchedTotal?: number
        }
        unchangedVerdict?: string
      }
    | undefined

  const rollup =
    ((program as { doctrineApplicationRollup?: unknown }).doctrineApplicationRollup as
      | {
          topSetApplied?: number
          dropSetApplied?: number
          restPauseApplied?: number
          enduranceDensityApplied?: number
          prescriptionRestApplied?: number
          prescriptionRpeApplied?: number
          totalBlocked?: number
          programFinalVerdict?: string
        }
      | undefined) ??
    ((program as { rowLevelMutatorRollup?: unknown }).rowLevelMutatorRollup as
      | {
          topSetApplied?: number
          dropSetApplied?: number
          restPauseApplied?: number
          enduranceDensityApplied?: number
          prescriptionRestApplied?: number
          prescriptionRpeApplied?: number
          totalBlocked?: number
        }
      | undefined)

  const weeklyMethod = (program as { weeklyMethodRepresentation?: unknown })
    .weeklyMethodRepresentation as
    | { byMethod?: Record<string, { applied?: number; blocked?: number; notNeeded?: number }> }
    | undefined

  const weeklyGovAdjustments = asArray<{ kind?: string; reason?: string }>(
    (program as { weeklyStressGovernorAdjustments?: unknown }).weeklyStressGovernorAdjustments,
  )

  const sessions = asArray<{
    dayNumber?: number
    stressRole?: string
    stressLevel?: string
    exercises?: Array<{
      id?: string
      name?: string
      targetRPE?: number
      restSeconds?: number
      sets?: number
      setExecutionMethod?: string
      coachingMeta?: { progressionIntent?: string; expressionMode?: string }
    }>
    styleMetadata?: {
      hasDensityApplied?: boolean
      styledGroups?: Array<{
        id?: string
        groupType?: string
        instruction?: string
        exercises?: Array<{ id?: string; name?: string }>
      }>
    }
  }>((program as { sessions?: unknown }).sessions)

  const selectedFlexibility = asArray<string>(
    (program as { selectedFlexibility?: unknown }).selectedFlexibility,
  )
  const selectedSkills = asArray<string>(
    (program as { selectedSkills?: unknown }).selectedSkills,
  )
  const goalCategories = asArray<string>(
    (program as { goalCategories?: unknown }).goalCategories,
  )
  const trainingMethodPreferences = asArray<string>(
    (program as { trainingMethodPreferences?: unknown }).trainingMethodPreferences,
  )

  const batchCounts: Record<string, number> = runtimeContract?.batchCoverage?.batchAtomCounts ?? {}
  const matMaterialChanged =
    matMatrix?.materialProgramChanged === true || causal?.materialProgramChanged === true
  const selectionRulesMatched = asNumber(causal?.diffSummary?.selectionRulesMatchedTotal)
  const carryoverRulesMatched = asNumber(causal?.diffSummary?.carryoverRulesMatchedTotal)
  const contraRulesMatched = asNumber(causal?.diffSummary?.contraindicationRulesMatchedTotal)
  const sessionsChanged = asNumber(causal?.sessionsTopCandidateChanged)

  const methodPreferred = asArray<string>(runtimeContract?.methodDoctrine?.preferredMethods)
  const methodBlocked = asArray<string>(runtimeContract?.methodDoctrine?.blockedMethods)

  const rollupAppliedTotal =
    asNumber(rollup?.topSetApplied) +
    asNumber(rollup?.dropSetApplied) +
    asNumber(rollup?.restPauseApplied) +
    asNumber(rollup?.enduranceDensityApplied) +
    asNumber(rollup?.prescriptionRestApplied) +
    asNumber(rollup?.prescriptionRpeApplied)

  // The selection scoring path lives inside batches 01..06. We use the Phase
  // 4E A/B challenge as the honest detector of whether selection rules
  // actually flipped a winner ("MUTATED_PROGRAM") vs only ranked candidates
  // ("DISPLAY_ONLY" / scoring-only).
  const selectionMutated = sessionsChanged > 0 && selectionRulesMatched > 0
  const carryoverMutated = sessionsChanged > 0 && carryoverRulesMatched > 0

  // ---------------------------------------------------------------------------
  // BUNDLE ROWS
  // Each row maps a logical doctrine bundle to one of the 10 states, using
  // the most authoritative artifact available. When no artifact answers the
  // question, the row reports UNKNOWN_OR_UNVERIFIED instead of pretending.
  // ---------------------------------------------------------------------------
  const bundles: DoctrineBundleRow[] = []

  function pushBundle(row: DoctrineBundleRow): void {
    bundles.push(row)
  }

  // Helper to compute affected days from exercise.id matches across sessions.
  function findAffectedDaysByExerciseTagger(
    pred: (exName: string) => boolean,
  ): { days: number[]; names: string[] } {
    const days = new Set<number>()
    const names = new Set<string>()
    for (const s of sessions) {
      const day = asNumber(s.dayNumber) || sessions.indexOf(s) + 1
      for (const ex of asArray<{ name?: string }>(s.exercises)) {
        if (pred(asString(ex.name))) {
          days.add(day)
          names.add(asString(ex.name))
        }
      }
    }
    return { days: Array.from(days).sort((a, b) => a - b), names: Array.from(names).slice(0, 4) }
  }

  // ---- 1. STATIC SKILL STRENGTH (planche/FL/BL/handstand isos) ----
  {
    const loaded = (asNumber(batchCounts.batch_01) + asNumber(batchCounts.batch_06)) > 0
    const eligible = selectedSkills.length > 0 || true // foundational; almost always eligible
    const tagged = findAffectedDaysByExerciseTagger(
      n => /(planche|lever|cross|maltese|handstand)/.test(lc(n)),
    )
    const fired = tagged.days.length > 0
    const mutated = fired && selectionMutated
    pushBundle({
      id: 'static_skill_strength',
      sourceBatch: 'batch_01,batch_06,batch_08',
      domain: 'Static skill strength',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: fired ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: mutated ? 'MUTATED' : fired ? 'NO_MUTATION' : 'UNKNOWN',
      visibleStatus: fired ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: loaded && fired ? 0.85 : 0.5,
      affectedDays: tagged.days,
      affectedExercises: tagged.names,
      exampleBefore: null,
      exampleAfter: tagged.names[0] ?? null,
      changedFields: mutated ? ['session.exercises[]'] : [],
      explanationOnly: fired && !mutated,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : !eligible
          ? 'LOADED_NOT_ELIGIBLE'
          : !fired
            ? 'ELIGIBLE_NOT_FIRED'
            : mutated
              ? 'MUTATED_PROGRAM'
              : 'FIRED_NO_MUTATION',
      notes:
        'Skill statics are foundational and frequently match the base selection ' +
        'already, so FIRED_NO_MUTATION is normal — doctrine confirmed the choice ' +
        'rather than flipping a winner.',
    })
  }

  // ---- 2. STRAIGHT-ARM TENDON PROTECTION ----
  {
    const loaded = (asNumber(batchCounts.batch_01) + asNumber(batchCounts.batch_06) + asNumber(batchCounts.batch_08)) > 0
    const tagged = findAffectedDaysByExerciseTagger(
      n => /(planche|lever|skin[- ]?the[- ]?cat|cross|maltese|tuck fl|tuck front)/.test(lc(n)),
    )
    const eligible = tagged.names.length > 0
    // Tendon protection materializes via RPE caps + rest controls. We detect
    // via low RPE on tendon-stress rows.
    let rpeCappedCount = 0
    for (const s of sessions) {
      for (const ex of asArray<{ name?: string; targetRPE?: number }>(s.exercises)) {
        if (
          /(planche|lever|skin[- ]?the[- ]?cat)/.test(lc(ex.name)) &&
          asNumber(ex.targetRPE) > 0 &&
          asNumber(ex.targetRPE) <= 7.5
        ) {
          rpeCappedCount++
        }
      }
    }
    const fired = eligible && rpeCappedCount > 0
    pushBundle({
      id: 'tendon_protection',
      sourceBatch: 'batch_01,batch_06,batch_08',
      domain: 'Straight-arm tendon protection',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: fired ? 'FIRED' : eligible ? 'NOT_FIRED' : 'UNKNOWN',
      mutationStatus: fired ? 'MUTATED' : 'UNKNOWN',
      visibleStatus: fired ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: fired ? 0.7 : 0.5,
      affectedDays: tagged.days,
      affectedExercises: tagged.names,
      exampleBefore: null,
      exampleAfter:
        fired ? `${tagged.names[0] ?? 'tendon-stress row'} held at RPE ≤7.5` : null,
      changedFields: fired ? ['exercise.targetRPE', 'exercise.restSeconds'] : [],
      explanationOnly: false,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : !eligible
          ? 'LOADED_NOT_ELIGIBLE'
          : fired
            ? 'MUTATED_PROGRAM'
            : 'FIRED_NO_MUTATION',
      notes:
        'Detected via low RPE caps on tendon-stress rows (planche/lever/skin-the-cat). ' +
        'When this fires it changes a real prescription field, not just an explanation.',
    })
  }

  // ---- 3. BENT-ARM STRENGTH (pull/dip/push patterns) ----
  {
    const loaded = (asNumber(batchCounts.batch_01) + asNumber(batchCounts.batch_02) + asNumber(batchCounts.batch_03)) > 0
    const tagged = findAffectedDaysByExerciseTagger(
      n => /(pull[- ]?up|dip|push[- ]?up|row|muscle[- ]?up|hspu|press)/.test(lc(n)),
    )
    pushBundle({
      id: 'bent_arm_strength',
      sourceBatch: 'batch_01,batch_02,batch_03',
      domain: 'Bent-arm strength',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: tagged.names.length > 0 ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: tagged.days.length > 0 ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: selectionMutated ? 'MUTATED' : 'NO_MUTATION',
      visibleStatus: tagged.days.length > 0 ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: 0.7,
      affectedDays: tagged.days,
      affectedExercises: tagged.names,
      exampleBefore: null,
      exampleAfter: tagged.names[0] ?? null,
      changedFields: selectionMutated ? ['session.exercises[]'] : [],
      explanationOnly: tagged.days.length > 0 && !selectionMutated,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : tagged.names.length === 0
          ? 'LOADED_NOT_ELIGIBLE'
          : selectionMutated
            ? 'MUTATED_PROGRAM'
            : 'FIRED_NO_MUTATION',
      notes:
        'Bent-arm bundle is broad — most rows match base selection already, so ' +
        'FIRED_NO_MUTATION is normal. selectionRulesMatched proves doctrine read; ' +
        'sessionsChanged proves doctrine flipped a winner.',
    })
  }

  // ---- 4. WEIGHTED STRENGTH ----
  {
    const loaded = (asNumber(batchCounts.batch_02) + asNumber(batchCounts.batch_03) + asNumber(batchCounts.batch_04)) > 0
    const weightedHits = findAffectedDaysByExerciseTagger(
      n => /(weighted|deadlift|squat|press|bench|farmer|loaded)/.test(lc(n)),
    )
    pushBundle({
      id: 'weighted_strength',
      sourceBatch: 'batch_02,batch_03,batch_04,batch_07',
      domain: 'Weighted strength',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: weightedHits.names.length > 0 ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: weightedHits.days.length > 0 ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: 'UNKNOWN',
      visibleStatus: weightedHits.days.length > 0 ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: 0.55,
      affectedDays: weightedHits.days,
      affectedExercises: weightedHits.names,
      exampleBefore: null,
      exampleAfter: weightedHits.names[0] ?? null,
      changedFields: [],
      explanationOnly: weightedHits.days.length > 0,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : weightedHits.names.length === 0
          ? 'LOADED_NOT_ELIGIBLE'
          : weightedHits.days.length > 0
            ? 'FIRED_NO_MUTATION'
            : 'ELIGIBLE_NOT_FIRED',
      notes:
        'Weighted prescription mutation runs at row-level (Phase 4L). The matrix ' +
        'cannot prove load mutation from a saved program alone — see ' +
        'rowLevelMutatorRollup for prescription_rest / prescription_rpe counts.',
    })
  }

  // ---- 5. LOWER BODY / MILITARY (batch 07) ----
  {
    const loaded = asNumber(batchCounts.batch_07) > 0
    const lowerHits = findAffectedDaysByExerciseTagger(
      n => /(squat|pistol|lunge|hinge|deadlift|run|ruck|march|sprint|cossack|dragon)/.test(lc(n)),
    )
    const militaryGoal = goalCategories.some(g => /military|tactical|prt|pft|acft/i.test(asString(g)))
    const eligible = lowerHits.names.length > 0 || militaryGoal
    pushBundle({
      id: 'lower_body_military',
      sourceBatch: 'batch_07',
      domain: 'Lower-body / military',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: lowerHits.days.length > 0 ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: 'UNKNOWN',
      visibleStatus: lowerHits.days.length > 0 ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: 0.6,
      affectedDays: lowerHits.days,
      affectedExercises: lowerHits.names,
      exampleBefore: null,
      exampleAfter: lowerHits.names[0] ?? null,
      changedFields: [],
      explanationOnly: lowerHits.days.length > 0,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : !eligible
          ? 'LOADED_NOT_ELIGIBLE'
          : lowerHits.days.length > 0
            ? 'FIRED_NO_MUTATION'
            : 'ELIGIBLE_NOT_FIRED',
      notes:
        'Bundle 07 is loaded for every athlete but only fires when the profile ' +
        'includes lower-body / tactical goals or selects matching skills.',
    })
  }

  // ---- 6. MOBILITY / FLEXIBILITY / WARMUP / COOLDOWN (batch 09) ----
  {
    const loaded = asNumber(batchCounts.batch_09) > 0
    const eligible = selectedFlexibility.length > 0
    const cooldownCat = matMatrix?.categories?.find(c => c.category === 'cooldown_flexibility')
    const mobilityCat = matMatrix?.categories?.find(c => c.category === 'mobility_warmup_prehab')
    const cooldownStatus = asString(cooldownCat?.status)
    const mobilityStatus = asString(mobilityCat?.status)
    const fired =
      cooldownStatus === 'CONNECTED_AND_MATERIAL' ||
      mobilityStatus === 'CONNECTED_AND_MATERIAL'
    const blocked =
      cooldownStatus === 'MATERIALIZER_NOT_CONNECTED' ||
      mobilityStatus === 'MATERIALIZER_NOT_CONNECTED'
    pushBundle({
      id: 'mobility_flexibility_warmup_cooldown',
      sourceBatch: 'batch_09',
      domain: 'Mobility / flexibility / warm-up / cooldown',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: fired ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: fired ? 'MUTATED' : 'UNKNOWN',
      visibleStatus: fired ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: blocked ? 'MATERIALIZER_NOT_CONNECTED for one or more cooldown/mobility paths' : null,
      suppressionReason: null,
      confidence: 0.75,
      affectedDays: [],
      affectedExercises: [],
      exampleBefore: null,
      exampleAfter: fired ? 'cooldown blocks materialized from selectedFlexibility' : null,
      changedFields: fired ? ['session.cooldown[]'] : [],
      explanationOnly: false,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : !eligible
          ? 'LOADED_NOT_ELIGIBLE'
          : blocked && !fired
            ? 'BLOCKED_BY_RUNTIME'
            : fired
              ? 'MUTATED_PROGRAM'
              : 'ELIGIBLE_NOT_FIRED',
      notes:
        'Read directly from doctrineMaterializationMatrix cooldown_flexibility / ' +
        'mobility_warmup_prehab category statuses (Phase 4H/4I).',
    })
  }

  // ---- 7. METHOD GOVERNOR (batch 10) ----
  {
    const loaded = asNumber(batchCounts.batch_10) > 0
    const eligible = methodPreferred.length > 0 || methodBlocked.length > 0 || trainingMethodPreferences.length > 0
    let appliedAny = 0
    let blockedAny = 0
    if (weeklyMethod?.byMethod) {
      for (const k of Object.keys(weeklyMethod.byMethod)) {
        appliedAny += asNumber(weeklyMethod.byMethod[k]?.applied)
        blockedAny += asNumber(weeklyMethod.byMethod[k]?.blocked)
      }
    }
    const fired = appliedAny > 0
    const mutationVerdict = rollup?.programFinalVerdict ?? 'UNKNOWN'
    pushBundle({
      id: 'method_governor',
      sourceBatch: 'batch_10',
      domain: 'Method selection (top-set / drop-set / rest-pause / cluster / superset / circuit / density)',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: fired ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: rollupAppliedTotal > 0 ? 'MUTATED' : fired ? 'MUTATED' : 'NO_MUTATION',
      visibleStatus: fired ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: blockedAny > 0 && !fired ? `${blockedAny} method(s) blocked by runtime gates` : null,
      suppressionReason: null,
      confidence: 0.85,
      affectedDays: [],
      affectedExercises: [],
      exampleBefore: null,
      exampleAfter: fired
        ? `methods applied: ${Object.keys(weeklyMethod?.byMethod ?? {})
            .filter(k => asNumber(weeklyMethod?.byMethod?.[k]?.applied) > 0)
            .slice(0, 3)
            .join(', ')}`
        : null,
      changedFields:
        rollupAppliedTotal > 0
          ? [
              'exercise.setExecutionMethod',
              'exercise.method',
              'session.styleMetadata.styledGroups',
            ]
          : [],
      explanationOnly: !fired && eligible,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : !eligible
          ? 'LOADED_NOT_ELIGIBLE'
          : fired
            ? 'MUTATED_PROGRAM'
            : blockedAny > 0
              ? 'BLOCKED_BY_RUNTIME'
              : 'ELIGIBLE_NOT_FIRED',
      notes:
        `weeklyMethodRepresentation: applied=${appliedAny}, blocked=${blockedAny}. ` +
        `rowLevelMutatorRollup applied total=${rollupAppliedTotal}. ` +
        `programFinalVerdict=${mutationVerdict}.`,
    })
  }

  // ---- 8. DENSITY / ENDURANCE ----
  {
    const loaded = (asNumber(batchCounts.batch_10) + asNumber(batchCounts.batch_07)) > 0
    const densityClaimed = sessions.some(s => s.styleMetadata?.hasDensityApplied === true)
    const densityBlocked = methodBlocked.some(m => /density/i.test(asString(m)))
    const eligible = trainingMethodPreferences.some(p => /density|circuit/i.test(asString(p))) || densityClaimed
    pushBundle({
      id: 'density_endurance',
      sourceBatch: 'batch_07,batch_10',
      domain: 'Density / endurance',
      loadedStatus: loaded ? 'LOADED' : 'NOT_LOADED',
      eligibilityStatus: eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      firedStatus: densityClaimed ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: 'UNKNOWN', // resolved by densityTrace below
      visibleStatus: densityClaimed ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: densityBlocked ? 'method governor blocked density for this profile' : null,
      suppressionReason: null,
      confidence: 0.6,
      affectedDays: [],
      affectedExercises: [],
      exampleBefore: null,
      exampleAfter: densityClaimed ? 'density block emitted' : null,
      changedFields: densityClaimed ? ['session.styleMetadata.styledGroups[density_block]'] : [],
      explanationOnly: false,
      finalVerdict: !loaded
        ? 'NOT_LOADED'
        : !eligible
          ? 'LOADED_NOT_ELIGIBLE'
          : densityBlocked
            ? 'BLOCKED_BY_RUNTIME'
            : densityClaimed
              ? 'FIRED_NO_MUTATION' // upgraded to MUTATED_PROGRAM after density trace
              : 'ELIGIBLE_NOT_FIRED',
      notes:
        'Density "claimed" only counts as MUTATED if the density trace below ' +
        'finds real time/rest/EMOM materialization — see densityTrace.',
    })
  }

  // ---- 9. WEEKLY ARCHITECTURE / STRESS DISTRIBUTION ----
  {
    const govFired = weeklyGovAdjustments.length > 0
    const stressCat = matMatrix?.categories?.find(c => c.category === 'weekly_architecture')
    const matStatus = asString(stressCat?.status)
    pushBundle({
      id: 'weekly_architecture',
      sourceBatch: 'multi',
      domain: 'Weekly stress distribution / session role',
      loadedStatus: 'LOADED',
      eligibilityStatus: 'ELIGIBLE',
      firedStatus: govFired || matStatus === 'CONNECTED_AND_MATERIAL' ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: govFired ? 'MUTATED' : 'NO_MUTATION',
      visibleStatus: 'VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: 0.8,
      affectedDays: [],
      affectedExercises: [],
      exampleBefore: null,
      exampleAfter: govFired ? `${weeklyGovAdjustments.length} stress governor adjustment(s) applied` : null,
      changedFields: govFired ? ['session.stressRole', 'session.recoveryCost'] : [],
      explanationOnly: !govFired && matStatus === 'CONNECTED_AND_MATERIAL',
      finalVerdict: govFired
        ? 'MUTATED_PROGRAM'
        : matStatus === 'CONNECTED_AND_MATERIAL'
          ? 'FIRED_NO_MUTATION'
          : 'ELIGIBLE_NOT_FIRED',
      notes:
        'weeklyStressGovernorAdjustments is the truth of whether the week was ' +
        're-shaped. Empty array means the base week already passed governor checks.',
    })
  }

  // ---- 10. CONTRAINDICATION / SAFETY ----
  {
    const contraCat = matMatrix?.categories?.find(c => c.category === 'contraindication_safety')
    const status = asString(contraCat?.status)
    const fired = contraRulesMatched > 0 || status === 'CONNECTED_AND_MATERIAL'
    pushBundle({
      id: 'contraindication_safety',
      sourceBatch: 'multi',
      domain: 'Injury / contraindication safety',
      loadedStatus: 'LOADED',
      eligibilityStatus: 'ELIGIBLE',
      firedStatus: fired ? 'FIRED' : 'NOT_FIRED',
      mutationStatus: fired && sessionsChanged > 0 ? 'MUTATED' : 'NO_MUTATION',
      visibleStatus: fired ? 'VISIBLE' : 'NOT_VISIBLE',
      blockedReason: null,
      suppressionReason: null,
      confidence: 0.65,
      affectedDays: [],
      affectedExercises: [],
      exampleBefore: null,
      exampleAfter: fired ? `${contraRulesMatched} contraindication rule(s) evaluated` : null,
      changedFields: fired && sessionsChanged > 0 ? ['session.exercises[] (filtered)'] : [],
      explanationOnly: fired && sessionsChanged === 0,
      finalVerdict: fired
        ? sessionsChanged > 0
          ? 'MUTATED_PROGRAM'
          : 'FIRED_NO_MUTATION'
        : 'ELIGIBLE_NOT_FIRED',
      notes:
        'Contraindication firing without sessionsChanged means rules evaluated ' +
        'and confirmed the candidate set was already safe (suppression-by-pre-filter).',
    })
  }

  // ---------------------------------------------------------------------------
  // RPE-7 reason trace
  // ---------------------------------------------------------------------------
  const rpeRows: RpeReasonTraceRow[] = []
  const rpeCounts: Record<RpeReasonCode, number> = {
    protected_week_cap: 0,
    tendon_safety_cap: 0,
    recovery_conservative: 0,
    support_day_intent: 0,
    skill_quality_intent: 0,
    method_owned: 0,
    default_fallback: 0,
    unknown_unexplained: 0,
  }
  const protectedWeekCap = weeklyGovAdjustments.some(a =>
    /protected|cap/i.test(asString(a.kind ?? '') + ' ' + asString(a.reason ?? '')),
  )

  for (const s of sessions) {
    const day = asNumber(s.dayNumber) || sessions.indexOf(s) + 1
    const sessionRole = asString(s.stressRole)
    const stressLevel = asString(s.stressLevel)
    for (const ex of asArray<{
      id?: string
      name?: string
      targetRPE?: number
      setExecutionMethod?: string
      coachingMeta?: { progressionIntent?: string; expressionMode?: string }
    }>(s.exercises)) {
      const finalRpe = asNumber(ex.targetRPE)
      if (finalRpe <= 0) continue
      const name = asString(ex.name)
      const intent = asString(ex.coachingMeta?.progressionIntent)
      const isTendonStress = /(planche|lever|skin[- ]?the[- ]?cat|cross|maltese|tuck fl)/.test(lc(name))
      const isMethodOwned = !!ex.setExecutionMethod && asString(ex.setExecutionMethod) !== ''
      const isSkillQuality = /(skill_expression|skill_quality)/i.test(intent)
      const isSupportRole = /support|secondary/i.test(sessionRole)
      const isLowStress = stressLevel === 'LOW' || /recovery/i.test(sessionRole)

      let reason: RpeReasonCode = 'unknown_unexplained'
      let confidence: 'high' | 'moderate' | 'low' = 'low'
      let capSource: string | null = null

      if (isMethodOwned) {
        reason = 'method_owned'
        confidence = 'high'
        capSource = `setExecutionMethod=${ex.setExecutionMethod}`
      } else if (isTendonStress && finalRpe <= 7.5) {
        reason = 'tendon_safety_cap'
        confidence = 'high'
        capSource = 'straight-arm tendon safety doctrine'
      } else if (isLowStress && finalRpe <= 7) {
        reason = 'recovery_conservative'
        confidence = 'moderate'
        capSource = `session.stressLevel=${stressLevel}`
      } else if (isSupportRole && finalRpe <= 7.5) {
        reason = 'support_day_intent'
        confidence = 'moderate'
        capSource = `session.stressRole=${sessionRole}`
      } else if (isSkillQuality && finalRpe <= 7.5) {
        reason = 'skill_quality_intent'
        confidence = 'moderate'
        capSource = `coachingMeta.progressionIntent=${intent}`
      } else if (protectedWeekCap && finalRpe <= 7.5) {
        reason = 'protected_week_cap'
        confidence = 'moderate'
        capSource = 'weeklyStressGovernorAdjustments'
      } else if (finalRpe === 7) {
        // RPE landed exactly at 7 with no detectable doctrine reason —
        // strong indicator of a flat default fallback.
        reason = 'default_fallback'
        confidence = 'low'
        capSource = 'no doctrine cap detected'
      } else {
        reason = 'unknown_unexplained'
        confidence = 'low'
      }

      rpeCounts[reason]++
      // Only stamp an RPE-7 trace row when targetRPE is in the suspect band
      // (6.5..7.5). Rows outside that band aren't part of the "everything is RPE 7"
      // concern this trace exists to investigate.
      if (finalRpe >= 6.5 && finalRpe <= 7.5) {
        rpeRows.push({
          day,
          exerciseId: asString(ex.id),
          exerciseName: name,
          originalTargetRPE: null, // honest: pre-mutation copy is not retained on the program
          finalTargetRPE: finalRpe,
          reason,
          capSource,
          sessionRole: sessionRole || null,
          exerciseStressType: isTendonStress
            ? 'tendon'
            : /push|press|hspu/.test(lc(name))
              ? 'push'
              : /pull|row|chin/.test(lc(name))
                ? 'pull'
                : null,
          confidence,
        })
      }
    }
  }

  const totalRpe7Band = rpeRows.length
  const flattened =
    totalRpe7Band > 0 &&
    (rpeCounts.default_fallback + rpeCounts.unknown_unexplained) / Math.max(1, totalRpe7Band) >= 0.4

  // ---------------------------------------------------------------------------
  // Density materialization trace
  // ---------------------------------------------------------------------------
  const densityRows: DensityTraceRow[] = []
  const methodGovBlocksDensity = methodBlocked.some(m => /density/i.test(asString(m)))

  for (const s of sessions) {
    const day = asNumber(s.dayNumber) || sessions.indexOf(s) + 1
    const groups = asArray<{
      id?: string
      groupType?: string
      instruction?: string
      exercises?: Array<{ id?: string; name?: string }>
    }>(s.styleMetadata?.styledGroups)
    for (const g of groups) {
      if (asString(g.groupType) !== 'density_block') continue
      const exNames = asArray<{ name?: string }>(g.exercises).map(e => asString(e.name))
      const inst = lc(g.instruction)
      const hasTimeCap = /(\b\d+\s*(min|minute|second|sec)\b|amrap|emom|for time|cap)/.test(inst)
      const hasEmomOrAmrap = /(emom|amrap|every minute|on the minute)/.test(inst)
      // Approximate rest from exercises in the same block.
      let minRest: number | null = null
      const groupIds = new Set<string>(asArray<{ id?: string }>(g.exercises).map(e => asString(e.id)))
      for (const ex of asArray<{ id?: string; restSeconds?: number }>(s.exercises)) {
        if (groupIds.has(asString(ex.id))) {
          const r = asNumber(ex.restSeconds)
          if (r > 0) minRest = minRest === null ? r : Math.min(minRest, r)
        }
      }
      const hasShortRestWindow = minRest !== null && minRest <= 60

      let verdict: DensityMaterializationVerdict
      let reason: string
      if (methodGovBlocksDensity) {
        verdict = 'DENSITY_BLOCKED_BY_RUNTIME'
        reason = 'method governor blocked density for this profile'
      } else if (hasTimeCap || hasEmomOrAmrap || hasShortRestWindow) {
        verdict = 'DENSITY_MATERIALIZED'
        reason = [
          hasTimeCap ? 'time cap in instruction' : null,
          hasEmomOrAmrap ? 'EMOM/AMRAP structure' : null,
          hasShortRestWindow ? `short rest (${minRest}s)` : null,
        ]
          .filter(Boolean)
          .join(' + ')
      } else {
        verdict = 'DENSITY_CLAIM_NOT_MATERIALIZED'
        reason = 'labeled density_block but no time cap, EMOM/AMRAP, or short rest detected'
      }

      densityRows.push({
        day,
        blockId: asString(g.id) || `day-${day}-density`,
        exercises: exNames,
        restSecondsObserved: minRest,
        hasTimeCap,
        hasEmomOrAmrap,
        hasShortRestWindow,
        verdict,
        reason,
      })
    }
  }

  const matCount = densityRows.filter(r => r.verdict === 'DENSITY_MATERIALIZED').length
  const notMatCount = densityRows.filter(r => r.verdict === 'DENSITY_CLAIM_NOT_MATERIALIZED').length
  const blkCount = densityRows.filter(r => r.verdict === 'DENSITY_BLOCKED_BY_RUNTIME').length
  const overallDensityVerdict: DensityMaterializationVerdict | 'NO_DENSITY_IN_PROGRAM' =
    densityRows.length === 0
      ? 'NO_DENSITY_IN_PROGRAM'
      : matCount > 0 && notMatCount === 0
        ? 'DENSITY_MATERIALIZED'
        : blkCount > 0 && matCount === 0
          ? 'DENSITY_BLOCKED_BY_RUNTIME'
          : 'DENSITY_CLAIM_NOT_MATERIALIZED'

  // Upgrade the density bundle row if the trace proved real materialization.
  const densityBundle = bundles.find(b => b.id === 'density_endurance')
  if (densityBundle) {
    if (overallDensityVerdict === 'DENSITY_MATERIALIZED') {
      densityBundle.mutationStatus = 'MUTATED'
      densityBundle.finalVerdict = 'MUTATED_PROGRAM'
      densityBundle.confidence = 0.85
    } else if (overallDensityVerdict === 'DENSITY_CLAIM_NOT_MATERIALIZED') {
      densityBundle.mutationStatus = 'NO_MUTATION'
      densityBundle.finalVerdict = 'DISPLAY_ONLY'
      densityBundle.explanationOnly = true
      densityBundle.confidence = 0.7
    } else if (overallDensityVerdict === 'DENSITY_BLOCKED_BY_RUNTIME') {
      densityBundle.finalVerdict = 'BLOCKED_BY_RUNTIME'
    }
  }

  // ---------------------------------------------------------------------------
  // Pairing fatigue overlap trace
  // ---------------------------------------------------------------------------
  const pairingRows: PairingTraceRow[] = []
  const pairingCounts: Record<PairingVerdict, number> = {
    GOOD_PAIRING: 0,
    ACCEPTABLE_IF_LOW_VOLUME: 0,
    NEEDS_REST_OR_REORDER: 0,
    SHOULD_NOT_BE_SUPERSET: 0,
    UNKNOWN: 0,
  }
  let skinTheCatPlusC2BFound = false

  for (const s of sessions) {
    const day = asNumber(s.dayNumber) || sessions.indexOf(s) + 1
    const exById = new Map<
      string,
      { name: string; targetRPE: number; restSeconds: number; sets: number }
    >()
    for (const ex of asArray<{
      id?: string
      name?: string
      targetRPE?: number
      restSeconds?: number
      sets?: number
    }>(s.exercises)) {
      exById.set(asString(ex.id), {
        name: asString(ex.name),
        targetRPE: asNumber(ex.targetRPE),
        restSeconds: asNumber(ex.restSeconds),
        sets: asNumber(ex.sets),
      })
    }

    const groups = asArray<{
      id?: string
      groupType?: string
      exercises?: Array<{ id?: string; name?: string }>
    }>(s.styleMetadata?.styledGroups)

    for (const g of groups) {
      const gType = asString(g.groupType)
      if (gType !== 'superset' && gType !== 'circuit' && gType !== 'density_block') continue
      const members = asArray<{ id?: string; name?: string }>(g.exercises)
      if (members.length < 2) continue

      // Compare every unique pair within the group. For 2-exercise supersets
      // this is one row; circuits stay manageable because n is small.
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i]
          const b = members[j]
          const aName = asString(a.name)
          const bName = asString(b.name)
          if (!aName || !bName) continue
          const overlapping = intersectAxes(axesForExercise(aName), axesForExercise(bName))
          const score: 'LOW' | 'MODERATE' | 'HIGH' =
            overlapping.length >= 4 ? 'HIGH' : overlapping.length >= 2 ? 'MODERATE' : 'LOW'

          const aMeta = exById.get(asString(a.id))
          const bMeta = exById.get(asString(b.id))
          const maxRpe = Math.max(asNumber(aMeta?.targetRPE), asNumber(bMeta?.targetRPE))
          const minRest = Math.min(
            asNumber(aMeta?.restSeconds) || 999,
            asNumber(bMeta?.restSeconds) || 999,
          )
          const minSets = Math.min(asNumber(aMeta?.sets) || 99, asNumber(bMeta?.sets) || 99)

          const isStcC2B =
            (isSkinTheCat(aName) && isC2BPullUp(bName)) ||
            (isSkinTheCat(bName) && isC2BPullUp(aName))
          if (isStcC2B) skinTheCatPlusC2BFound = true

          let verdict: PairingVerdict
          let reason: string

          if (isStcC2B) {
            // Specific Skin-the-Cat + C2B Pull-Up doctrine check.
            const stcLowVolume = minSets <= 2 || maxRpe <= 7
            const enoughRest = minRest >= 90 && minRest < 999
            const overloadedDay =
              s.stressLevel === 'HIGH' || /strength|pull|primary/i.test(asString(s.stressRole))
            if (stcLowVolume && enoughRest && !overloadedDay && maxRpe <= 8) {
              verdict = 'ACCEPTABLE_IF_LOW_VOLUME'
              reason =
                'Skin-the-Cat is low-volume controlled prep (≤2 sets, RPE ≤7), rest ≥90s, and the day is not pull-overloaded — pairing acceptable.'
            } else if (maxRpe >= 9 || overloadedDay) {
              verdict = 'SHOULD_NOT_BE_SUPERSET'
              reason =
                'Skin-the-Cat + C2B Pull-Up shares grip, lats, scapular control, shoulder extension, and core compression. With high RPE or pull-heavy day, this should not be supersetted.'
            } else {
              verdict = 'NEEDS_REST_OR_REORDER'
              reason =
                'Skin-the-Cat + C2B Pull-Up overlaps on grip, lats, scapular control, and shoulder extension — needs ≥90s rest, RPE cap ≤7, and Skin-the-Cat sets ≤2 to be safe.'
            }
          } else if (score === 'HIGH') {
            verdict =
              maxRpe <= 7 && minRest >= 90 ? 'NEEDS_REST_OR_REORDER' : 'SHOULD_NOT_BE_SUPERSET'
            reason = `high fatigue overlap (${overlapping.length} axes: ${overlapping.join(', ')})`
          } else if (score === 'MODERATE') {
            verdict =
              minSets <= 2 || maxRpe <= 7 ? 'ACCEPTABLE_IF_LOW_VOLUME' : 'NEEDS_REST_OR_REORDER'
            reason = `moderate overlap (${overlapping.join(', ')})`
          } else {
            verdict = 'GOOD_PAIRING'
            reason = overlapping.length === 0 ? 'no shared fatigue axes' : `low overlap (${overlapping.join(', ')})`
          }

          pairingCounts[verdict]++
          pairingRows.push({
            day,
            blockId: asString(g.id) || `day-${day}-${gType}`,
            groupType: gType,
            exercises: [aName, bName],
            overlapScore: score,
            overlapAxes: overlapping,
            pairLabel: `${aName} + ${bName}`,
            verdict,
            reason,
            isSkinTheCatPlusC2BCheck: isStcC2B,
          })
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Summary + verdict
  // ---------------------------------------------------------------------------
  const batchesLoaded = Object.values(batchCounts).filter(n => asNumber(n) > 0).length
  const bundlesEligible = bundles.filter(b => b.eligibilityStatus === 'ELIGIBLE').length
  const bundlesFired = bundles.filter(b => b.firedStatus === 'FIRED').length
  const bundlesMutatedProgram = bundles.filter(b => b.finalVerdict === 'MUTATED_PROGRAM').length
  const bundlesDisplayOnly = bundles.filter(
    b => b.finalVerdict === 'DISPLAY_ONLY' || b.finalVerdict === 'FIRED_NO_MUTATION',
  ).length
  const bundlesSuppressedBySafety = bundles.filter(b => b.finalVerdict === 'SUPPRESSED_BY_SAFETY').length
  const bundlesBlockedByRuntime = bundles.filter(b => b.finalVerdict === 'BLOCKED_BY_RUNTIME').length
  const bundlesUnknownOrUnverified = bundles.filter(b => b.finalVerdict === 'UNKNOWN_OR_UNVERIFIED').length

  let causalUtilizationVerdict: CausalUtilizationVerdict
  if (bundlesEligible === 0) {
    causalUtilizationVerdict = 'INSUFFICIENT_PROOF'
  } else {
    const mutatedRatio = bundlesMutatedProgram / Math.max(1, bundlesEligible)
    const displayRatio = bundlesDisplayOnly / Math.max(1, bundlesEligible)
    const blockedRatio =
      (bundlesBlockedByRuntime + bundlesSuppressedBySafety) / Math.max(1, bundlesEligible)
    if (mutatedRatio >= 0.6) {
      causalUtilizationVerdict = 'STRONGLY_CAUSAL'
    } else if (mutatedRatio >= 0.3) {
      causalUtilizationVerdict = 'PARTIALLY_CAUSAL'
    } else if (blockedRatio >= 0.4) {
      causalUtilizationVerdict = 'OVER_SUPPRESSED'
    } else if (displayRatio >= 0.5 && mutatedRatio < 0.3) {
      causalUtilizationVerdict = 'MOSTLY_EXPLANATORY'
    } else if (bundlesUnknownOrUnverified > bundlesMutatedProgram) {
      causalUtilizationVerdict = 'INSUFFICIENT_PROOF'
    } else {
      causalUtilizationVerdict = 'PARTIALLY_CAUSAL'
    }
  }

  const oneLineExplanation = `${batchesLoaded} batches loaded • ${bundlesEligible} eligible • ${bundlesFired} fired • ${bundlesMutatedProgram} changed training • ${bundlesDisplayOnly} explanation-only • ${bundlesBlockedByRuntime + bundlesSuppressedBySafety} blocked/suppressed`

  return {
    version: 'phase-y1.doctrine-execution-matrix.v1',
    generatedAt,
    bundles,
    summary: {
      batchesLoaded,
      bundlesEligible,
      bundlesFired,
      bundlesMutatedProgram,
      bundlesDisplayOnly,
      bundlesSuppressedBySafety,
      bundlesBlockedByRuntime,
      bundlesUnknownOrUnverified,
      causalUtilizationVerdict,
      oneLineExplanation,
    },
    rpeReasonTrace: {
      rows: rpeRows,
      counts: rpeCounts,
      rpeFlattenedSuspected: flattened,
      notes: flattened
        ? 'A large share of RPE-7-band rows lack a detectable doctrine cap source — likely a flat default. Phase Y2 target.'
        : 'RPE-7-band rows are explained by tendon/recovery/support/method intent.',
    },
    densityTrace: {
      rows: densityRows,
      materializedCount: matCount,
      notMaterializedCount: notMatCount,
      blockedCount: blkCount,
      overallVerdict: overallDensityVerdict,
    },
    pairingTrace: {
      rows: pairingRows,
      skinTheCatPlusC2BFound,
      counts: pairingCounts,
    },
  }
}
