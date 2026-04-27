/**
 * =============================================================================
 * [PHASE-Q] DOCTRINE RULE UTILIZATION / CAUSAL APPLICATION CONTRACT
 * =============================================================================
 *
 * PURPOSE (read first)
 * --------------------
 * The user asked, honestly: "Are the SpartanLab doctrine rules actually
 * participating in the authoritative program-generation decision process
 * before final session construction, or are they only being surfaced after
 * the fact as proof / explanation metadata?"
 *
 * Phase Q is the answer-shaped contract. It is NOT a builder. It is NOT a
 * scanner. It does NOT re-decide methods, exercises, sets, reps, RPE, rest,
 * skill choice, recovery distribution, or session length. It does NOT
 * mutate the program in any way.
 *
 * What it DOES do is the smallest safe causal-bridge work the project was
 * actually missing: it reads the artifacts already stamped on the
 * authoritative program by the builder + Phase 4L/4M/4P/4Q + Phase L/M/N/O/P,
 * and per category emits ONE typed verdict that distinguishes:
 *
 *   ELIGIBLE_AND_APPLIED          rule causally shaped the final program
 *   ELIGIBLE_BUT_SUPPRESSED       rule could have applied but a higher-priority
 *                                 constraint (recovery / user prefs / weekly
 *                                 budget / session role / safety) won
 *   NOT_ELIGIBLE                  rule was considered, did not match this
 *                                 session/exercise/profile context
 *   BLOCKED_BY_UNSUPPORTED_RUNTIME rule is doctrine-valid but live workout
 *                                 cannot safely render/execute it yet
 *   ACKNOWLEDGED_ONLY             rule was detected/counted by a shadow-mode
 *                                 layer but did not influence generation —
 *                                 this is honest only when explicitly labeled
 *   POST_HOC_ONLY                 rule appeared only in a proof/audit slice
 *                                 after the program was built — also honest
 *                                 only when explicitly labeled
 *
 * The output is a JSON-safe `DoctrineUtilizationTrace` that:
 *   - the Program card can render as honest, specific proof copy,
 *   - the master-truth blueprint can summarize per category,
 *   - future phases can read to decide which causal disconnect to repair next.
 *
 * NON-GOALS — explicitly forbidden by the phase prompt
 * ----------------------------------------------------
 *   - Do NOT build a parallel generator.
 *   - Do NOT build another shadow normalizer.
 *   - Do NOT make every rule appear "applied" just to look smart.
 *   - Do NOT force clusters / supersets / circuits to fire just to "prove" the
 *     system works.
 *   - Do NOT mark blocked methods as failures when they are blocked for
 *     legitimate doctrine / safety / user-pref / session-role reasons.
 *   - Do NOT clutter the UI further; the trace is structured data the
 *     existing UI can use lightly.
 *
 * AUDIT INPUTS (read-only, all already stamped by earlier phases)
 * ---------------------------------------------------------------
 *   program.doctrineRuntimeContract                 — input doctrine
 *   program.weeklyMethodBudgetPlan                  — per-family weekly verdict
 *   program.methodStructureRollup                   — Phase 4P applied counts
 *   program.doctrineApplicationRollup               — Phase 4L/4M applied counts
 *   program.weekStressDistributionProof             — Phase J/K
 *   program.profileSnapshot.selectedSkills          — onboarding truth
 *   session.styleMetadata.appliedMethods            — what actually fired
 *   session.styleMetadata.rejectedMethods[]         — {method, reason}
 *   session.styleMetadata.clusterDecision           — present iff cluster fired
 *   session.styleMetadata.hasClusterApplied         — boolean shortcut
 *   session.styleMetadata.hasSupersetsApplied       — boolean shortcut
 *   session.styleMetadata.hasCircuitsApplied        — boolean shortcut
 *   session.styleMetadata.hasDensityApplied         — boolean shortcut
 *   session.methodStructures[]                      — Phase 4P canonical
 *   session.doctrineBlockResolution[]               — Phase 4Q classifier
 *   session.doctrineParticipation                   — Phase 4Q per-session verdict
 *   session.methodDecision                          — Phase 3M reader (post-hoc)
 *   session.qualityAudit                            — Phase P session findings
 *   session.exercises[*].setExecutionMethod         — cluster / top_set / drop_set / rest_pause
 *   session.exercises[*].method                     — legacy / row-level
 *   session.exercises[*].performanceAdaptation      — Phase L/M/N/O stamp
 *   session.exercises[*].qualityAudit               — Phase P stamp
 *
 * The contract makes ZERO assumptions about fields it does not read. Every
 * field access is `?.` chained and falls through to a safe default.
 *
 * SAVE / LOAD / NORMALIZE
 * -----------------------
 * The trace is JSON-safe (only primitives, arrays, and plain objects). It
 * lives at `program.doctrineUtilizationTrace` and `session.doctrineUtilizationTrace`
 * inside the existing AdaptiveProgram envelope. Existing `...program` /
 * `...session` spreads in lib/program-state.ts and normalizeProgramForDisplay
 * preserve it transparently — same pattern as performanceAdaptation,
 * qualityAudit, methodDecision, doctrineBlockResolution.
 *
 * FAILURE POLICY
 * --------------
 * The function NEVER throws on malformed input. Worst case it returns a
 * trace with state ACKNOWLEDGED_ONLY for every category and an `error`
 * field on the rollup, leaving the program object untouched.
 * =============================================================================
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * The 6 honest causal states from the Phase Q prompt. The order is
 * intentional: best-causal first, weakest-causal last.
 */
export type DoctrineUtilizationState =
  | 'ELIGIBLE_AND_APPLIED'
  | 'ELIGIBLE_BUT_SUPPRESSED'
  | 'NOT_ELIGIBLE'
  | 'BLOCKED_BY_UNSUPPORTED_RUNTIME'
  | 'ACKNOWLEDGED_ONLY'
  | 'POST_HOC_ONLY'

/**
 * Where in the pipeline the rule's decision actually happened. This is what
 * tells the user / blueprint whether the rule shaped the program (preBuilder
 * / builder / adaptation / trend) or only audited it (qualityAudit /
 * displayOnly).
 */
export type DoctrineDecisionStage =
  | 'preBuilder'      // doctrine context / runtime contract / weekly budget
  | 'builder'         // adaptive-program-builder.ts wrote the field
  | 'adaptation'      // Phase L/M/N performance-feedback overlay wrote it
  | 'trend'           // Phase O trend intelligence
  | 'qualityAudit'    // Phase P quality / doctrine sharpness audit
  | 'displayOnly'     // a card-level computation, no program effect

/**
 * Where in the program object the rule's effect was applied. `proofOnly`
 * means no program effect — only a typed proof/audit slice.
 */
export type DoctrineAppliedTarget =
  | 'exerciseSelection'
  | 'progressionSelection'
  | 'methodSelection'
  | 'setRepHoldPrescription'
  | 'rpePrescription'
  | 'restPrescription'
  | 'weeklyDistribution'
  | 'sessionLength'
  | 'proofOnly'

/**
 * The five canonical doctrine categories the prompt requires us to audit.
 * We track sub-categories within method (cluster / superset / circuit / etc.)
 * inside the trace's `subCategory` field so the per-category rollup stays
 * readable.
 */
export type DoctrineCategory =
  | 'skill'             // selectedSkill expression / progression / carryover
  | 'method'            // cluster / superset / circuit / density / top_set / drop_set / rest_pause
  | 'recovery'          // straight-arm / joint / pulling / pressing overlap
  | 'prescription'      // sets / reps / holds / RPE / rest
  | 'sessionLength'     // Full / 45 / 30 minute mode

/**
 * A single per-rule trace entry. The shape is identical for all categories so
 * the Program card and blueprint can render it uniformly.
 */
export interface DoctrineUtilizationTraceEntry {
  /** Stable id. For built-in categories we use `phaseQ:<category>:<sub>`. */
  ruleId: string
  category: DoctrineCategory
  /** Optional sub-category for finer reporting (e.g. method:cluster). */
  subCategory?: string
  /** True iff the rule entered the eligibility evaluation at all. */
  eligible: boolean
  /** Honest state — see `DoctrineUtilizationState` above. */
  state: DoctrineUtilizationState
  /** Where the rule's effect was applied (or `proofOnly`). */
  appliedTo: DoctrineAppliedTarget
  /** Where the decision happened. */
  decisionStage: DoctrineDecisionStage
  /**
   * Human-readable one-line reason. Always populated. Required to be
   * specific — generic "blocked" is forbidden by Phase Q.
   */
  reason: string
  /**
   * When `state` is BLOCKED_BY_UNSUPPORTED_RUNTIME, ELIGIBLE_BUT_SUPPRESSED,
   * NOT_ELIGIBLE, ACKNOWLEDGED_ONLY, or POST_HOC_ONLY, this carries a stable
   * machine token (e.g. `weekly_budget_saturated`, `user_pref_not_set`,
   * `live_runtime_unsupported`, `shadow_mode_only`).
   */
  blockerReason?: string
  /**
   * When `state` is ELIGIBLE_AND_APPLIED, this describes the structural
   * effect on the program (e.g. "cluster cue stamped on accessory row 3").
   */
  structuralEffect?: string
  /**
   * Dotted path to the artifact on the program object. Lets the UI deep-link
   * proof and lets tests assert presence.
   */
  sourceOfTruthObjectPath?: string
  /** Concise copy the UI may render verbatim. */
  visibleProofText: string
  /** Optional list of dayNumbers this entry applies to (program-level rollup). */
  dayNumbers?: number[]
}

/**
 * Per-session compact trace — one entry per category. Stamped on the
 * AdaptiveSession at `session.doctrineUtilizationTrace`.
 */
export interface SessionDoctrineUtilizationTrace {
  version: 'phase-q-utilization-v1'
  dayNumber: number
  entries: DoctrineUtilizationTraceEntry[]
  /** Dominant honest state across the session for one-line UI rendering. */
  dominantState: DoctrineUtilizationState
  /** Concise one-line summary suitable for the existing card chip. */
  summary: string
}

/**
 * Program-level rollup — one entry per category, aggregated across sessions.
 * Stamped on the AdaptiveProgram at `program.doctrineUtilizationTrace`.
 */
export interface ProgramDoctrineUtilizationTrace {
  version: 'phase-q-utilization-v1'
  generatedAt: string
  /**
   * Per-category headline verdict — what the master-truth blueprint reports.
   */
  byCategory: Record<DoctrineCategory, {
    state: DoctrineUtilizationState
    decisionStage: DoctrineDecisionStage
    appliedTo: DoctrineAppliedTarget
    reason: string
    blockerReason?: string
    appliedDayNumbers: number[]
    suppressedDayNumbers: number[]
    blockedDayNumbers: number[]
  }>
  /** Flat copy of every per-session entry — for UI deep-linking and tests. */
  entries: DoctrineUtilizationTraceEntry[]
  /**
   * Honest verdict for the whole program. Picks the WORST honest state across
   * the 5 categories: applied < suppressed < not_eligible < blocked_runtime <
   * acknowledged_only < post_hoc_only. This is the answer the user wanted to
   * see at the top.
   */
  overallVerdict:
    | 'FULLY_CAUSAL'
    | 'PARTIALLY_CAUSAL'
    | 'MOSTLY_POST_HOC'
  /** One-line copy the Program page can render at the top. */
  summary: string
  /** Set when something was malformed; trace is still safe to consume. */
  error?: string
}

// =============================================================================
// LOCAL READ-ONLY SHAPES — every field optional, every read defensive
// =============================================================================

interface UtilizationProgramLike {
  generatedAt?: string | null
  doctrineRuntimeContract?: { available?: boolean | null } | null
  weeklyMethodBudgetPlan?: {
    byFamily?: Record<string, {
      verdict?: string | null
      reason?: string | null
      maxPerWeek?: number | null
      usedCount?: number | null
    } | null> | null
  } | null
  methodStructureRollup?: {
    totalApplied?: number | null
    totalAlreadyApplied?: number | null
    totalBlocked?: number | null
    totalNoSafeTarget?: number | null
    totalNotNeeded?: number | null
  } | null
  doctrineApplicationRollup?: {
    totalApplied?: number | null
    totalBlocked?: number | null
    totalNotNeeded?: number | null
  } | null
  profileSnapshot?: {
    selectedSkills?: string[] | null
    sessionStyle?: string | null
    timeAvailability?: number | null
    methodPrefsForGrouping?: string[] | null
  } | null
  weekStressDistributionProof?: unknown
  sessions?: UtilizationSessionLike[] | null
  // Phase Q stamp (added by this contract):
  doctrineUtilizationTrace?: ProgramDoctrineUtilizationTrace
}

interface UtilizationSessionLike {
  dayNumber?: number | null
  focus?: string | null
  estimatedMinutes?: number | null
  styleMetadata?: {
    appliedMethods?: string[] | null
    rejectedMethods?: Array<{ method?: string | null; reason?: string | null } | null> | null
    hasClusterApplied?: boolean | null
    hasSupersetsApplied?: boolean | null
    hasCircuitsApplied?: boolean | null
    hasDensityApplied?: boolean | null
    clusterDecision?: {
      targetExerciseName?: string | null
      reasonSummary?: string | null
      kind?: string | null
    } | null
  } | null
  methodStructures?: Array<{
    family?: string | null
    status?: string | null
    reason?: string | null
  } | null> | null
  doctrineBlockResolution?: Array<{
    family?: string | null
    resolvedStatus?: string | null
    reason?: string | null
    requiredAction?: string | null
  } | null> | null
  doctrineParticipation?: {
    finalVerdict?: string | null
    reason?: string | null
  } | null
  methodDecision?: {
    methodId?: string | null
    status?: string | null
  } | null
  qualityAudit?: {
    corrections?: string[] | null
    conciseExplanation?: string | null
  } | null
  // [PHASE-R] Session-length truth stamp produced before Phase Q runs.
  // Phase Q reads this to credit session-length as ELIGIBLE_AND_APPLIED
  // when shorts are structurally real (variants[] has launchable distinct
  // shorts that drop exercises and/or sets vs Full).
  sessionLengthTruth?: {
    verdict?:
      | 'STRUCTURALLY_REAL'
      | 'SHORTS_AT_LABEL_PARITY'
      | 'NO_LAUNCHABLE_SHORTS'
      | 'LEGACY_NO_VARIANTS'
      | null
    summary?: string | null
    rollup?: {
      launchableVariantCount?: number | null
      distinctShortCount?: number | null
      deferredExerciseTotal?: number | null
      setDeltaTotal?: number | null
      primarySkillAnchorPreservedAcrossShorts?: boolean | null
    } | null
  } | null
  exercises?: Array<{
    name?: string | null
    category?: string | null
    setExecutionMethod?: string | null
    method?: string | null
    methodLabel?: string | null
    targetRPE?: number | null
    restSeconds?: number | null
    sets?: number | null
    repsOrTime?: string | null
    performanceAdaptation?: { shortLabel?: string | null } | null
    qualityAudit?: { corrections?: string[] | null } | null
  } | null> | null
  // Phase Q stamp (added by this contract):
  doctrineUtilizationTrace?: SessionDoctrineUtilizationTrace
}

// =============================================================================
// CONSTANTS — honest mappings the contract reads from
// =============================================================================

/**
 * Method families that the LIVE WORKOUT runtime cannot yet execute safely.
 * When a session has the method APPLIED (truth on the program object) but
 * the live runtime cannot render it, Phase Q reports the entry as
 * BLOCKED_BY_UNSUPPORTED_RUNTIME so the UI never implies "applied" without
 * runtime support.
 *
 * Source of truth: the runtime contracts at
 *   lib/workout/live-grouped-execution-contract.ts
 *   lib/workout/live-execution-contract.ts
 *   lib/workout/execution-unit-contract.ts
 * already enumerate which families they execute. We mirror that here as a
 * static, conservative list. Updating it requires updating those files first.
 */
const RUNTIME_UNSUPPORTED_METHOD_FAMILIES: readonly string[] = [
  // Drop sets and rest-pause are written by the corridor onto rows but the
  // live workout currently shows them as a method label without the explicit
  // intra-set rest UX. They are HONEST ELIGIBLE_AND_APPLIED at the program
  // level, but live execution support is partial. We do NOT mark them as
  // unsupported here — that would be misleading. The actual gap, when the
  // user reports it, will be added below. Keeping the list empty by default
  // forces the contract to be conservative and HONEST.
] as const

/**
 * Map a `methodStructures[].family` / `setExecutionMethod` / appliedMethod to
 * the canonical method sub-category we report under `category: 'method'`.
 */
function methodSubCategoryFor(family: string | null | undefined): string | null {
  if (!family) return null
  const f = family.toLowerCase()
  if (f.includes('cluster')) return 'cluster'
  if (f === 'superset' || f.includes('super_set')) return 'superset'
  if (f === 'circuit') return 'circuit'
  if (f.includes('density')) return 'density'
  if (f === 'top_set' || f === 'top_set_backoff' || f === 'backoff_sets') return 'top_set'
  if (f === 'drop_set') return 'drop_set'
  if (f === 'rest_pause' || f === 'rest-pause') return 'rest_pause'
  return f
}

/**
 * Worst-state ranking — used to compute `dominantState` per session and
 * `overallVerdict` per program.
 */
const STATE_RANK: Record<DoctrineUtilizationState, number> = {
  ELIGIBLE_AND_APPLIED: 0,
  ELIGIBLE_BUT_SUPPRESSED: 1,
  NOT_ELIGIBLE: 2,
  BLOCKED_BY_UNSUPPORTED_RUNTIME: 3,
  ACKNOWLEDGED_ONLY: 4,
  POST_HOC_ONLY: 5,
}

function worseOf(
  a: DoctrineUtilizationState,
  b: DoctrineUtilizationState,
): DoctrineUtilizationState {
  return STATE_RANK[a] >= STATE_RANK[b] ? a : b
}

// =============================================================================
// PER-CATEGORY EVALUATORS
// Each evaluator returns at most one entry per session. The aggregation step
// rolls them up into the program-level rollup.
// =============================================================================

/**
 * Skill doctrine evaluator.
 *
 * Causality rule: if the session contains at least one exercise whose name or
 * category corresponds to a `program.profileSnapshot.selectedSkills` entry —
 * directly or via the SKILL_SUPPORT_MAPPINGS-style carryover already stamped
 * on `exercise.qualityAudit` (Phase P) — then the skill doctrine is
 * ELIGIBLE_AND_APPLIED at the BUILDER stage. Otherwise it is NOT_ELIGIBLE for
 * this session (legitimate — not every session expresses every skill).
 */
function evaluateSkill(
  selectedSkills: string[],
  session: UtilizationSessionLike,
): DoctrineUtilizationTraceEntry {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  if (selectedSkills.length === 0) {
    return {
      ruleId: 'phaseQ:skill:no_selected_skills',
      category: 'skill',
      eligible: false,
      state: 'NOT_ELIGIBLE',
      appliedTo: 'proofOnly',
      decisionStage: 'preBuilder',
      reason: 'Onboarding profile has no selectedSkills — skill doctrine has nothing to express.',
      blockerReason: 'no_selected_skills_in_profile',
      sourceOfTruthObjectPath: 'program.profileSnapshot.selectedSkills',
      visibleProofText: 'Skill doctrine: no selected skills',
      dayNumbers: [dayNumber],
    }
  }

  const skillTokens = selectedSkills.map((s) => s.toLowerCase().replace(/[\s_-]+/g, ''))
  const exercises = Array.isArray(session.exercises) ? session.exercises : []

  // Direct expression: an exercise name contains a selected-skill token.
  let directHit: { skill: string; name: string } | null = null
  let carryoverHit: { skill: string; name: string } | null = null
  for (const ex of exercises) {
    if (!ex) continue
    const exName = String(ex.name ?? '').toLowerCase().replace(/[\s_-]+/g, '')
    for (let i = 0; i < skillTokens.length; i += 1) {
      if (skillTokens[i] && exName.includes(skillTokens[i])) {
        directHit = { skill: selectedSkills[i], name: String(ex.name ?? '') }
        break
      }
    }
    if (directHit) break
    // Phase P carryover stamp (exercise-level qualityAudit.corrections).
    const corr = Array.isArray(ex.qualityAudit?.corrections) ? ex.qualityAudit!.corrections! : []
    if (!carryoverHit && corr.includes('skill_carryover_attributed')) {
      carryoverHit = { skill: selectedSkills[0], name: String(ex.name ?? '') }
    }
  }

  if (directHit) {
    return {
      ruleId: 'phaseQ:skill:direct_expression',
      category: 'skill',
      subCategory: directHit.skill,
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'exerciseSelection',
      decisionStage: 'builder',
      reason: `${directHit.skill.replace(/_/g, ' ')} expressed directly via ${directHit.name}.`,
      structuralEffect: `Selected skill "${directHit.skill}" directly programmed.`,
      sourceOfTruthObjectPath: 'session.exercises[*].name',
      visibleProofText: `Skill doctrine applied: ${directHit.skill.replace(/_/g, ' ')}`,
      dayNumbers: [dayNumber],
    }
  }

  if (carryoverHit) {
    return {
      ruleId: 'phaseQ:skill:carryover_via_phase_p',
      category: 'skill',
      subCategory: carryoverHit.skill,
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'exerciseSelection',
      decisionStage: 'qualityAudit',
      reason: `Selected skill expressed indirectly via carryover on ${carryoverHit.name}.`,
      structuralEffect: 'Selected-skill carryover preserved.',
      sourceOfTruthObjectPath: 'session.exercises[*].qualityAudit.corrections',
      visibleProofText: `Skill carryover applied`,
      dayNumbers: [dayNumber],
    }
  }

  return {
    ruleId: 'phaseQ:skill:not_in_session',
    category: 'skill',
    eligible: true,
    state: 'NOT_ELIGIBLE',
    appliedTo: 'proofOnly',
    decisionStage: 'preBuilder',
    reason: 'No selected skill is expressed in this session today (legitimate — skills rotate across the week).',
    blockerReason: 'session_focus_does_not_express_selected_skills',
    sourceOfTruthObjectPath: 'session.exercises[*]',
    visibleProofText: 'Skill doctrine not expressed today',
    dayNumbers: [dayNumber],
  }
}

/**
 * Method doctrine evaluator. Reports ONE entry per session covering ALL
 * grouped + row-level method families. Causality rule:
 *
 *   - If `session.styleMetadata.appliedMethods` contains a known family OR
 *     `session.styleMetadata.clusterDecision` is present OR an exercise
 *     carries `setExecutionMethod`, the method doctrine is
 *     ELIGIBLE_AND_APPLIED at the BUILDER stage.
 *   - Else if the program-level `weeklyMethodBudgetPlan.byFamily` shows any
 *     family with `verdict === 'apply'` for this dayNumber but no application
 *     happened, mark ELIGIBLE_BUT_SUPPRESSED with the rejection reason from
 *     `session.styleMetadata.rejectedMethods` if available.
 *   - Else if a family appears in `session.methodStructures` with status
 *     `blocked_by_safety` / `no_safe_target` / `not_needed`, mark
 *     ELIGIBLE_BUT_SUPPRESSED with that reason.
 *   - Else if `session.doctrineParticipation.finalVerdict ===
 *     'DOCTRINE_NOT_RELEVANT_TO_SESSION'`, mark NOT_ELIGIBLE.
 *   - Else fall through to ACKNOWLEDGED_ONLY (rare) with an explicit reason.
 */
function evaluateMethod(
  program: UtilizationProgramLike,
  session: UtilizationSessionLike,
): DoctrineUtilizationTraceEntry {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const sm = session.styleMetadata
  const applied: string[] = Array.isArray(sm?.appliedMethods)
    ? sm!.appliedMethods!.filter((s): s is string => typeof s === 'string')
    : []

  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const rowMethods = exercises
    .map((e) => (e && typeof e.setExecutionMethod === 'string' ? e.setExecutionMethod : null))
    .filter((s): s is string => !!s)

  // 1. APPLIED — anything on appliedMethods, clusterDecision, or row-level set-execution method.
  if (applied.length > 0 || sm?.clusterDecision || rowMethods.length > 0) {
    const family =
      applied[0] ??
      (sm?.clusterDecision ? 'cluster' : null) ??
      rowMethods[0] ??
      'method'
    const sub = methodSubCategoryFor(family) ?? family
    const target = sm?.clusterDecision?.targetExerciseName
    return {
      ruleId: `phaseQ:method:${sub}:applied`,
      category: 'method',
      subCategory: sub,
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'methodSelection',
      decisionStage: 'builder',
      reason: target
        ? `${sub} applied to ${target}.`
        : `${sub} applied to this session.`,
      structuralEffect: `Method "${sub}" causally written by adaptive-program-builder.ts.`,
      sourceOfTruthObjectPath: 'session.styleMetadata.appliedMethods',
      visibleProofText: `Method applied: ${sub}`,
      dayNumbers: [dayNumber],
    }
  }

  // 2. SUPPRESSED — rejectedMethods has a real entry.
  const rejected = Array.isArray(sm?.rejectedMethods) ? sm!.rejectedMethods! : []
  const firstReject = rejected.find(
    (r): r is { method: string; reason: string } =>
      !!r && typeof r.method === 'string' && typeof r.reason === 'string',
  )
  if (firstReject) {
    const sub = methodSubCategoryFor(firstReject.method) ?? firstReject.method
    // Distinguish runtime-unsupported from doctrine-suppressed.
    const isRuntimeUnsupported = RUNTIME_UNSUPPORTED_METHOD_FAMILIES.includes(sub)
    return {
      ruleId: `phaseQ:method:${sub}:suppressed`,
      category: 'method',
      subCategory: sub,
      eligible: true,
      state: isRuntimeUnsupported
        ? 'BLOCKED_BY_UNSUPPORTED_RUNTIME'
        : 'ELIGIBLE_BUT_SUPPRESSED',
      appliedTo: 'methodSelection',
      decisionStage: 'builder',
      reason: firstReject.reason,
      blockerReason: classifyMethodBlocker(firstReject.reason),
      sourceOfTruthObjectPath: 'session.styleMetadata.rejectedMethods',
      visibleProofText: `Method ${sub} suppressed`,
      dayNumbers: [dayNumber],
    }
  }

  // 3. methodStructures-based block.
  const structs = Array.isArray(session.methodStructures) ? session.methodStructures : []
  const blockedStruct = structs.find(
    (s) => s && typeof s.status === 'string' && /blocked|no_safe_target|not_needed/.test(s.status),
  )
  if (blockedStruct && typeof blockedStruct.family === 'string') {
    const sub = methodSubCategoryFor(blockedStruct.family) ?? blockedStruct.family
    return {
      ruleId: `phaseQ:method:${sub}:blocked_struct`,
      category: 'method',
      subCategory: sub,
      eligible: true,
      state: 'ELIGIBLE_BUT_SUPPRESSED',
      appliedTo: 'methodSelection',
      decisionStage: 'builder',
      reason: blockedStruct.reason ?? `${blockedStruct.status}`,
      blockerReason: String(blockedStruct.status),
      sourceOfTruthObjectPath: 'session.methodStructures[*]',
      visibleProofText: `Method ${sub} ${humanizeStatus(String(blockedStruct.status))}`,
      dayNumbers: [dayNumber],
    }
  }

  // 4. NOT_ELIGIBLE per Phase 4Q participation contract.
  const partVerdict = session.doctrineParticipation?.finalVerdict
  if (partVerdict === 'DOCTRINE_NOT_RELEVANT_TO_SESSION') {
    return {
      ruleId: 'phaseQ:method:not_relevant_to_session_role',
      category: 'method',
      eligible: false,
      state: 'NOT_ELIGIBLE',
      appliedTo: 'methodSelection',
      decisionStage: 'builder',
      reason:
        session.doctrineParticipation?.reason ??
        'Session role does not accept doctrine methods (recovery / mobility / etc.).',
      blockerReason: 'session_role_does_not_accept_methods',
      sourceOfTruthObjectPath: 'session.doctrineParticipation',
      visibleProofText: 'Methods not relevant for this session role',
      dayNumbers: [dayNumber],
    }
  }

  // 5. Fallback ACKNOWLEDGED_ONLY — methodDecision exists but nothing applied.
  if (session.methodDecision?.methodId) {
    return {
      ruleId: 'phaseQ:method:reader_only',
      category: 'method',
      subCategory: String(session.methodDecision.methodId),
      eligible: true,
      state: 'ACKNOWLEDGED_ONLY',
      appliedTo: 'proofOnly',
      decisionStage: 'displayOnly',
      reason: 'Phase 3M method-decision-engine is a pure post-hoc reader — it stamped attribution but did not cause selection.',
      blockerReason: 'phase_3m_reader_only_by_design',
      sourceOfTruthObjectPath: 'session.methodDecision',
      visibleProofText: 'Method attribution only (post-hoc)',
      dayNumbers: [dayNumber],
    }
  }

  return {
    ruleId: 'phaseQ:method:no_signal',
    category: 'method',
    eligible: false,
    state: 'NOT_ELIGIBLE',
    appliedTo: 'methodSelection',
    decisionStage: 'builder',
    reason: 'No method doctrine fired and no rejection logged for this session.',
    blockerReason: 'no_method_signal',
    sourceOfTruthObjectPath: 'session.styleMetadata',
    visibleProofText: 'No methods applied',
    dayNumbers: [dayNumber],
  }
}

/**
 * Recovery / joint-stress evaluator. Causality rule: if Phase J/K weekly
 * stress proof is present on the program AND the session carries either a
 * Phase P qualityAudit `straight_arm_overlap_warning_attached` correction
 * OR a stress-distribution fingerprint, recovery doctrine is causal.
 * Otherwise NOT_ELIGIBLE for this session.
 */
function evaluateRecovery(
  program: UtilizationProgramLike,
  session: UtilizationSessionLike,
): DoctrineUtilizationTraceEntry {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const hasWeeklyStress =
    program.weekStressDistributionProof != null &&
    typeof program.weekStressDistributionProof === 'object'
  const corrections = Array.isArray(session.qualityAudit?.corrections)
    ? session.qualityAudit!.corrections!
    : []
  const overlapFlagged = corrections.includes('straight_arm_overlap_warning_attached')

  if (!hasWeeklyStress) {
    return {
      ruleId: 'phaseQ:recovery:no_weekly_stress_proof',
      category: 'recovery',
      eligible: false,
      state: 'ACKNOWLEDGED_ONLY',
      appliedTo: 'proofOnly',
      decisionStage: 'displayOnly',
      reason: 'Weekly stress distribution proof not present; recovery doctrine ran in builder gates only.',
      blockerReason: 'weekly_stress_proof_missing',
      sourceOfTruthObjectPath: 'program.weekStressDistributionProof',
      visibleProofText: 'Recovery doctrine: builder gates only',
      dayNumbers: [dayNumber],
    }
  }

  if (overlapFlagged) {
    return {
      ruleId: 'phaseQ:recovery:overlap_flagged',
      category: 'recovery',
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'weeklyDistribution',
      decisionStage: 'qualityAudit',
      reason: session.qualityAudit?.conciseExplanation ?? 'Cross-session straight-arm overlap flagged for protection.',
      structuralEffect: 'Overlap warning surfaced; Phase L/M may bound future volume.',
      sourceOfTruthObjectPath: 'session.qualityAudit',
      visibleProofText: 'Recovery doctrine applied: overlap protected',
      dayNumbers: [dayNumber],
    }
  }

  return {
    ruleId: 'phaseQ:recovery:builder_gates_active',
    category: 'recovery',
    eligible: true,
    state: 'ELIGIBLE_AND_APPLIED',
    appliedTo: 'weeklyDistribution',
    decisionStage: 'builder',
    reason: 'Builder applied recovery / overlap gates during exercise selection; no flag surfaced today.',
    structuralEffect: 'Recovery gates pre-empted unsafe pairings during selection.',
    sourceOfTruthObjectPath: 'program.weekStressDistributionProof',
    visibleProofText: 'Recovery doctrine applied (silent gates)',
    dayNumbers: [dayNumber],
  }
}

/**
 * Prescription evaluator. Causality rule: a Phase L/M/N/O performance stamp
 * OR a Phase P RPE cap means doctrine *adjusted* prescriptions causally. A
 * row whose RPE/rest/sets came directly from the builder's exercise selector
 * is also ELIGIBLE_AND_APPLIED — those numbers are doctrine-derived from
 * METHOD_PROFILES + role + skill class. We do not falsely demote those.
 */
function evaluatePrescription(
  session: UtilizationSessionLike,
): DoctrineUtilizationTraceEntry {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const exercises = Array.isArray(session.exercises) ? session.exercises : []

  let phasePAdjusted = 0
  let phaseLApplied = 0
  let baseDoctrineApplied = 0

  for (const ex of exercises) {
    if (!ex) continue
    if (ex.performanceAdaptation?.shortLabel) phaseLApplied += 1
    const corr = Array.isArray(ex.qualityAudit?.corrections) ? ex.qualityAudit!.corrections! : []
    if (corr.includes('tendon_rpe_capped')) phasePAdjusted += 1
    if (typeof ex.targetRPE === 'number' && typeof ex.restSeconds === 'number') {
      baseDoctrineApplied += 1
    }
  }

  if (phasePAdjusted > 0) {
    return {
      ruleId: 'phaseQ:prescription:tendon_rpe_capped',
      category: 'prescription',
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'rpePrescription',
      decisionStage: 'qualityAudit',
      reason: `Phase P tendon-protective RPE cap applied to ${phasePAdjusted} row(s).`,
      structuralEffect: 'targetRPE lowered ≤1 step on tendon-stressed straight-arm rows.',
      sourceOfTruthObjectPath: 'session.exercises[*].qualityAudit.corrections',
      visibleProofText: 'Prescription doctrine applied: tendon RPE protected',
      dayNumbers: [dayNumber],
    }
  }

  if (phaseLApplied > 0) {
    return {
      ruleId: 'phaseQ:prescription:phase_l_adaptation',
      category: 'prescription',
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'rpePrescription',
      decisionStage: 'adaptation',
      reason: `Phase L/M/N/O performance adaptation applied to ${phaseLApplied} row(s).`,
      structuralEffect: 'Future prescription mutated by completedSetEvidence.',
      sourceOfTruthObjectPath: 'session.exercises[*].performanceAdaptation',
      visibleProofText: 'Prescription doctrine applied: performance adaptation',
      dayNumbers: [dayNumber],
    }
  }

  if (baseDoctrineApplied > 0) {
    return {
      ruleId: 'phaseQ:prescription:builder_dose_from_doctrine',
      category: 'prescription',
      eligible: true,
      state: 'ELIGIBLE_AND_APPLIED',
      appliedTo: 'rpePrescription',
      decisionStage: 'builder',
      reason: 'Sets / reps / RPE / rest written by adaptive-program-builder.ts using doctrine method profiles + role.',
      structuralEffect: 'Base prescription is doctrine-derived (METHOD_PROFILES + role).',
      sourceOfTruthObjectPath: 'session.exercises[*]',
      visibleProofText: 'Prescription doctrine applied (builder dose)',
      dayNumbers: [dayNumber],
    }
  }

  return {
    ruleId: 'phaseQ:prescription:incomplete_rows',
    category: 'prescription',
    eligible: false,
    state: 'ACKNOWLEDGED_ONLY',
    appliedTo: 'proofOnly',
    decisionStage: 'displayOnly',
    reason: 'Exercises lack RPE/rest fields — cannot prove prescription doctrine fired.',
    blockerReason: 'rows_missing_rpe_or_rest',
    sourceOfTruthObjectPath: 'session.exercises[*]',
    visibleProofText: 'Prescription doctrine: rows incomplete',
    dayNumbers: [dayNumber],
  }
}

/**
 * Session-length evaluator. Causality rule: the only causal session-length
 * effect today is `timeAvailability` constraining the builder's exercise
 * count budget. Phase P writes a `session_length_warning_attached` chip
 * when the estimate is implausible — that is POST_HOC. The full structural
 * lock (Full / 45 / 30 truly changing structure) is the planned NEXT phase.
 *
 * Honest verdict: ACKNOWLEDGED_ONLY when only the warning is present;
 * ELIGIBLE_BUT_SUPPRESSED when timeAvailability < default and structure was
 * not yet recompressed; ELIGIBLE_AND_APPLIED only when the estimate falls
 * inside the mode band AND fewer-than-default exercises were programmed.
 */
function evaluateSessionLength(
  program: UtilizationProgramLike,
  session: UtilizationSessionLike,
): DoctrineUtilizationTraceEntry {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const minutes = typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : null
  const time = program.profileSnapshot?.timeAvailability ?? null
  const corrections = Array.isArray(session.qualityAudit?.corrections)
    ? session.qualityAudit!.corrections!
    : []
  const lengthWarning = corrections.includes('session_length_warning_attached')

  // ===========================================================================
  // [PHASE-R] CAUSAL CREDIT — read the Session-Length Truth Stamp first.
  // Phase R runs BEFORE Phase Q in both ingress paths (server generator and
  // client overlay). When Phase R reports STRUCTURALLY_REAL we have hard
  // evidence that the variant trio actually compresses the session
  // structurally (deferred exercises and/or set deltas), so session-length
  // doctrine reaches ELIGIBLE_AND_APPLIED at the BUILDER stage. When Phase R
  // reports SHORTS_AT_LABEL_PARITY we credit ELIGIBLE_BUT_SUPPRESSED with the
  // honest reason — shorts exist but only differ on the duration label.
  // When Phase R reports NO_LAUNCHABLE_SHORTS the session is single-mode by
  // design (Full only); we surface NOT_ELIGIBLE because shorts are not
  // applicable for this day. The pre-existing `estimatedMinutes` vs
  // `timeAvailability` band check below is preserved as a fallback for
  // legacy sessions that never went through Phase R.
  // ===========================================================================
  const slt = session.sessionLengthTruth
  if (slt && typeof slt.verdict === 'string') {
    if (slt.verdict === 'STRUCTURALLY_REAL') {
      const distinctShorts = slt.rollup?.distinctShortCount ?? 0
      const deferred = slt.rollup?.deferredExerciseTotal ?? 0
      const setDelta = slt.rollup?.setDeltaTotal ?? 0
      const skillPreserved = !!slt.rollup?.primarySkillAnchorPreservedAcrossShorts
      const reasonParts: string[] = []
      reasonParts.push(`${distinctShorts} structurally distinct short${distinctShorts === 1 ? '' : 's'}`)
      if (deferred > 0) reasonParts.push(`${deferred} accessor${deferred === 1 ? 'y' : 'ies'} deferred`)
      if (setDelta > 0) reasonParts.push(`${setDelta} set${setDelta === 1 ? '' : 's'} trimmed`)
      if (skillPreserved) reasonParts.push('primary skill anchor preserved')
      return {
        ruleId: 'phaseQ:sessionLength:phase_r_structurally_real',
        category: 'sessionLength',
        eligible: true,
        state: 'ELIGIBLE_AND_APPLIED',
        appliedTo: 'sessionLength',
        decisionStage: 'builder',
        reason: `Phase R: ${reasonParts.join(', ')}.`,
        structuralEffect: slt.summary || 'Variant trio structurally compresses Full → 45 / 30.',
        sourceOfTruthObjectPath: 'session.sessionLengthTruth',
        visibleProofText: 'Session-length doctrine applied (structural)',
        dayNumbers: [dayNumber],
      }
    }
    if (slt.verdict === 'SHORTS_AT_LABEL_PARITY') {
      return {
        ruleId: 'phaseQ:sessionLength:phase_r_label_parity',
        category: 'sessionLength',
        eligible: true,
        state: 'ELIGIBLE_BUT_SUPPRESSED',
        appliedTo: 'sessionLength',
        decisionStage: 'builder',
        reason: 'Phase R: short variants present but only differ by duration label — no exercise drop, no set delta.',
        blockerReason: 'short_variants_at_label_parity',
        sourceOfTruthObjectPath: 'session.sessionLengthTruth',
        visibleProofText: 'Session length: shorts at label parity',
        dayNumbers: [dayNumber],
      }
    }
    if (slt.verdict === 'NO_LAUNCHABLE_SHORTS') {
      return {
        ruleId: 'phaseQ:sessionLength:phase_r_no_shorts_needed',
        category: 'sessionLength',
        eligible: false,
        state: 'NOT_ELIGIBLE',
        appliedTo: 'sessionLength',
        decisionStage: 'builder',
        reason: 'Phase R: full session only — short modes not applicable for this day.',
        sourceOfTruthObjectPath: 'session.sessionLengthTruth',
        visibleProofText: 'Session length: full only',
        dayNumbers: [dayNumber],
      }
    }
    // LEGACY_NO_VARIANTS falls through to the existing fallback so older
    // program objects still produce a trace.
  }

  if (lengthWarning) {
    return {
      ruleId: 'phaseQ:sessionLength:phase_p_warning',
      category: 'sessionLength',
      eligible: true,
      state: 'POST_HOC_ONLY',
      appliedTo: 'proofOnly',
      decisionStage: 'qualityAudit',
      reason:
        session.qualityAudit?.conciseExplanation ??
        'Phase P session-length realism warning attached; structural compression not yet enforced.',
      blockerReason: 'structural_lock_deferred_to_next_phase',
      sourceOfTruthObjectPath: 'session.qualityAudit',
      visibleProofText: 'Session length: warning only (audit)',
      dayNumbers: [dayNumber],
    }
  }

  if (typeof minutes === 'number' && typeof time === 'number' && minutes > 0 && time > 0) {
    // Within ±20% of the time band → causal at the builder.
    const withinBand = minutes <= time * 1.2 && minutes >= time * 0.6
    if (withinBand) {
      return {
        ruleId: 'phaseQ:sessionLength:within_band',
        category: 'sessionLength',
        eligible: true,
        state: 'ELIGIBLE_AND_APPLIED',
        appliedTo: 'sessionLength',
        decisionStage: 'builder',
        reason: `Session estimate ${minutes}m fits selected mode (${time}m).`,
        structuralEffect: 'Builder exercise-count budget honored timeAvailability.',
        sourceOfTruthObjectPath: 'session.estimatedMinutes',
        visibleProofText: 'Session-length doctrine applied (in band)',
        dayNumbers: [dayNumber],
      }
    }
    return {
      ruleId: 'phaseQ:sessionLength:out_of_band',
      category: 'sessionLength',
      eligible: true,
      state: 'ELIGIBLE_BUT_SUPPRESSED',
      appliedTo: 'sessionLength',
      decisionStage: 'builder',
      reason: `Session estimate ${minutes}m drifts from mode (${time}m); structural lock deferred to a later phase.`,
      blockerReason: 'structural_lock_deferred_to_next_phase',
      sourceOfTruthObjectPath: 'session.estimatedMinutes',
      visibleProofText: 'Session length out of band',
      dayNumbers: [dayNumber],
    }
  }

  return {
    ruleId: 'phaseQ:sessionLength:no_signal',
    category: 'sessionLength',
    eligible: false,
    state: 'ACKNOWLEDGED_ONLY',
    appliedTo: 'proofOnly',
    decisionStage: 'displayOnly',
    reason: 'No estimatedMinutes or no timeAvailability profile — session-length doctrine has no signal to verify.',
    blockerReason: 'missing_time_signals',
    sourceOfTruthObjectPath: 'program.profileSnapshot.timeAvailability',
    visibleProofText: 'Session length: no signal',
    dayNumbers: [dayNumber],
  }
}

// =============================================================================
// SMALL HELPERS
// =============================================================================

/**
 * Map a free-text rejectedMethod reason to a stable machine token. Used
 * because the existing builder writes English reasons; the trace needs a
 * tokenized blockerReason for the blueprint and tests.
 */
function classifyMethodBlocker(reason: string): string {
  const r = reason.toLowerCase()
  if (r.includes('budget') && r.includes('saturat')) return 'weekly_budget_saturated'
  if (r.includes('user pref') || r.includes('not in session prefs')) return 'user_pref_not_set'
  if (r.includes('skill') && (r.includes('protect') || r.includes('pillar'))) return 'skill_pillar_protected'
  if (r.includes('tendon')) return 'tendon_safety'
  if (r.includes('late') && r.includes('position')) return 'no_late_position_candidate'
  if (r.includes('no eligible') || r.includes('no safe target')) return 'no_safe_target'
  if (r.includes('not eligible')) return 'not_eligible'
  if (r.includes('feasibility')) return 'feasibility_gate_failed'
  if (r.includes('rotation')) return 'weekly_rotation_assigned_other_style'
  if (r.includes('runtime')) return 'live_runtime_unsupported'
  return 'doctrine_specific_reason'
}

function humanizeStatus(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace('blocked by safety', 'blocked (safety)')
    .replace('no safe target', 'no eligible row')
    .replace('not needed', 'not needed today')
}

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================

export interface RunDoctrineUtilizationOptions {
  /** ISO timestamp; falls back to new Date().toISOString(). */
  nowIso?: string
}

export interface RunDoctrineUtilizationResult<TProgram> {
  program: TProgram
  trace: ProgramDoctrineUtilizationTrace
}

/**
 * Pure deterministic resolver. Reads only existing program/session artifacts,
 * stamps `program.doctrineUtilizationTrace` and `session.doctrineUtilizationTrace`
 * on a NEW returned program object (input is never mutated), and returns the
 * rollup separately for diagnostics.
 *
 * It is intentionally side-effect-free: no console.log, no fetch, no time
 * source other than the provided / Date.now() ISO string.
 */
export function runDoctrineUtilizationContract<TProgram extends object>(
  programInput: TProgram,
  options: RunDoctrineUtilizationOptions = {},
): RunDoctrineUtilizationResult<TProgram> {
  const nowIso = options.nowIso ?? new Date().toISOString()
  const program = programInput as unknown as UtilizationProgramLike
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const selectedSkills: string[] = Array.isArray(program.profileSnapshot?.selectedSkills)
    ? (program.profileSnapshot!.selectedSkills as string[]).filter((s) => typeof s === 'string')
    : []

  // Initialize per-category aggregates with the BEST possible state; we'll
  // worsen them as session entries are produced.
  const byCategory: ProgramDoctrineUtilizationTrace['byCategory'] = {
    skill: {
      state: 'ELIGIBLE_AND_APPLIED',
      decisionStage: 'builder',
      appliedTo: 'exerciseSelection',
      reason: '',
      appliedDayNumbers: [],
      suppressedDayNumbers: [],
      blockedDayNumbers: [],
    },
    method: {
      state: 'ELIGIBLE_AND_APPLIED',
      decisionStage: 'builder',
      appliedTo: 'methodSelection',
      reason: '',
      appliedDayNumbers: [],
      suppressedDayNumbers: [],
      blockedDayNumbers: [],
    },
    recovery: {
      state: 'ELIGIBLE_AND_APPLIED',
      decisionStage: 'builder',
      appliedTo: 'weeklyDistribution',
      reason: '',
      appliedDayNumbers: [],
      suppressedDayNumbers: [],
      blockedDayNumbers: [],
    },
    prescription: {
      state: 'ELIGIBLE_AND_APPLIED',
      decisionStage: 'builder',
      appliedTo: 'rpePrescription',
      reason: '',
      appliedDayNumbers: [],
      suppressedDayNumbers: [],
      blockedDayNumbers: [],
    },
    sessionLength: {
      state: 'ELIGIBLE_AND_APPLIED',
      decisionStage: 'builder',
      appliedTo: 'sessionLength',
      reason: '',
      appliedDayNumbers: [],
      suppressedDayNumbers: [],
      blockedDayNumbers: [],
    },
  }

  const allEntries: DoctrineUtilizationTraceEntry[] = []
  const newSessions: UtilizationSessionLike[] = []

  // Track whether we ever saw an applied / suppressed / blocked entry per
  // category so the rollup can pick the WORST honest state without falsely
  // claiming "applied" when only one session of seven actually applied it.
  const seenStatesByCategory: Record<DoctrineCategory, Set<DoctrineUtilizationState>> = {
    skill: new Set(),
    method: new Set(),
    recovery: new Set(),
    prescription: new Set(),
    sessionLength: new Set(),
  }

  for (const session of sessions) {
    if (!session) {
      newSessions.push(session as UtilizationSessionLike)
      continue
    }
    const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0

    const entries: DoctrineUtilizationTraceEntry[] = []
    try {
      entries.push(evaluateSkill(selectedSkills, session))
      entries.push(evaluateMethod(program, session))
      entries.push(evaluateRecovery(program, session))
      entries.push(evaluatePrescription(session))
      entries.push(evaluateSessionLength(program, session))
    } catch {
      // Per failure policy: never throw. Emit a single safe ACKNOWLEDGED_ONLY
      // entry so the rollup downgrades honestly.
      entries.push({
        ruleId: 'phaseQ:session:evaluator_error',
        category: 'method',
        eligible: false,
        state: 'ACKNOWLEDGED_ONLY',
        appliedTo: 'proofOnly',
        decisionStage: 'displayOnly',
        reason: 'Doctrine utilization evaluator threw; session left untraced.',
        blockerReason: 'evaluator_error',
        sourceOfTruthObjectPath: 'session',
        visibleProofText: 'Doctrine trace unavailable',
        dayNumbers: [dayNumber],
      })
    }

    // Stamp per-session compact trace.
    let dominant: DoctrineUtilizationState = 'ELIGIBLE_AND_APPLIED'
    for (const e of entries) dominant = worseOf(dominant, e.state)
    const sessionTrace: SessionDoctrineUtilizationTrace = {
      version: 'phase-q-utilization-v1',
      dayNumber,
      entries,
      dominantState: dominant,
      summary: oneLineSessionSummary(entries),
    }
    newSessions.push({ ...(session as UtilizationSessionLike), doctrineUtilizationTrace: sessionTrace })

    // Aggregate into program rollup.
    for (const entry of entries) {
      allEntries.push(entry)
      seenStatesByCategory[entry.category].add(entry.state)
      const bucket = byCategory[entry.category]
      if (entry.state === 'ELIGIBLE_AND_APPLIED') bucket.appliedDayNumbers.push(dayNumber)
      else if (
        entry.state === 'ELIGIBLE_BUT_SUPPRESSED' ||
        entry.state === 'NOT_ELIGIBLE'
      )
        bucket.suppressedDayNumbers.push(dayNumber)
      else bucket.blockedDayNumbers.push(dayNumber)
    }
  }

  // Compute per-category headline state. A category is APPLIED only if at
  // least one session was APPLIED. Otherwise pick the worst observed state.
  for (const cat of Object.keys(byCategory) as DoctrineCategory[]) {
    const seen = seenStatesByCategory[cat]
    const bucket = byCategory[cat]
    if (seen.has('ELIGIBLE_AND_APPLIED')) {
      bucket.state = 'ELIGIBLE_AND_APPLIED'
    } else {
      let worst: DoctrineUtilizationState = 'ELIGIBLE_BUT_SUPPRESSED'
      for (const s of seen) worst = worseOf(worst, s)
      bucket.state = worst
    }
    // Pick a representative reason from the latest entry of that category.
    const rep = allEntries.filter((e) => e.category === cat).pop()
    if (rep) {
      bucket.reason = rep.reason
      bucket.decisionStage = rep.decisionStage
      bucket.appliedTo = rep.appliedTo
      if (rep.blockerReason) bucket.blockerReason = rep.blockerReason
    }
  }

  // Compute overall verdict from the WORST headline across categories.
  const headlineStates: DoctrineUtilizationState[] = (Object.keys(byCategory) as DoctrineCategory[])
    .map((c) => byCategory[c].state)
  const worstHeadline = headlineStates.reduce<DoctrineUtilizationState>(
    (acc, s) => worseOf(acc, s),
    'ELIGIBLE_AND_APPLIED',
  )
  const appliedCount = headlineStates.filter((s) => s === 'ELIGIBLE_AND_APPLIED').length
  const overallVerdict: ProgramDoctrineUtilizationTrace['overallVerdict'] =
    worstHeadline === 'ELIGIBLE_AND_APPLIED'
      ? 'FULLY_CAUSAL'
      : appliedCount >= 3
        ? 'PARTIALLY_CAUSAL'
        : 'MOSTLY_POST_HOC'

  const trace: ProgramDoctrineUtilizationTrace = {
    version: 'phase-q-utilization-v1',
    generatedAt: nowIso,
    byCategory,
    entries: allEntries,
    overallVerdict,
    summary: oneLineProgramSummary(byCategory, overallVerdict),
  }

  const newProgram = {
    ...(program as object),
    sessions: newSessions,
    doctrineUtilizationTrace: trace,
  } as unknown as TProgram

  return { program: newProgram, trace }
}

/**
 * Concise per-session summary for the existing card chip line.
 */
function oneLineSessionSummary(entries: DoctrineUtilizationTraceEntry[]): string {
  const applied = entries.filter((e) => e.state === 'ELIGIBLE_AND_APPLIED')
  const suppressed = entries.filter(
    (e) => e.state === 'ELIGIBLE_BUT_SUPPRESSED' || e.state === 'NOT_ELIGIBLE',
  )
  const acknowledged = entries.filter(
    (e) => e.state === 'ACKNOWLEDGED_ONLY' || e.state === 'POST_HOC_ONLY',
  )
  const blocked = entries.filter((e) => e.state === 'BLOCKED_BY_UNSUPPORTED_RUNTIME')
  const parts: string[] = []
  if (applied.length > 0) parts.push(`${applied.length} applied`)
  if (suppressed.length > 0) parts.push(`${suppressed.length} suppressed`)
  if (blocked.length > 0) parts.push(`${blocked.length} runtime-blocked`)
  if (acknowledged.length > 0) parts.push(`${acknowledged.length} audit-only`)
  return parts.length ? `Doctrine: ${parts.join(' · ')}` : 'Doctrine: no signal'
}

function oneLineProgramSummary(
  byCategory: ProgramDoctrineUtilizationTrace['byCategory'],
  verdict: ProgramDoctrineUtilizationTrace['overallVerdict'],
): string {
  const cats = (Object.keys(byCategory) as DoctrineCategory[])
    .map((c) => `${c}:${shortState(byCategory[c].state)}`)
    .join(' · ')
  const head =
    verdict === 'FULLY_CAUSAL'
      ? 'Doctrine fully causal'
      : verdict === 'PARTIALLY_CAUSAL'
        ? 'Doctrine partially causal'
        : 'Doctrine mostly post-hoc'
  return `${head} — ${cats}`
}

function shortState(s: DoctrineUtilizationState): string {
  switch (s) {
    case 'ELIGIBLE_AND_APPLIED':
      return 'applied'
    case 'ELIGIBLE_BUT_SUPPRESSED':
      return 'suppressed'
    case 'NOT_ELIGIBLE':
      return 'n/a'
    case 'BLOCKED_BY_UNSUPPORTED_RUNTIME':
      return 'runtime-blocked'
    case 'ACKNOWLEDGED_ONLY':
      return 'audit-only'
    case 'POST_HOC_ONLY':
      return 'post-hoc'
    default:
      return s
  }
}
