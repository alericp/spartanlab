/**
 * =============================================================================
 * weekly-method-decision-summary.ts
 * -----------------------------------------------------------------------------
 * GUARDED SCAFFOLD — added under the AB5 add-on prompt for future user-agency UI.
 *
 * STATUS: scaffold only. NOT wired into any UI in this commit. AB5 remains the
 * primary deliverable and OWNS the executable corridor (grouped rounds, member
 * doses, orphan-row guard, Start Workout parity). This file does not touch the
 * program body, prescriptions, variants, or runtime — it is a pure derivation
 * over `WeeklyMethodRepresentationContract` that future phases (AB6+, override
 * UI) can consume without re-deriving.
 *
 * AGENCY DOCTRINE
 *   The AI coach should explain what it used, what it did not use, why those
 *   choices were made, whether a safe override is even possible under the
 *   current method-decision layer, and what tradeoff an override would create.
 *   This file expresses that doctrine as a typed view — but ONLY using fields
 *   that already exist in `WeeklyMethodRepresentationContract`. Nothing here
 *   invents a new method-selection decision.
 *
 * STRICT RULES (mirror the AB5 add-on prompt)
 *   - Source of truth: `WeeklyMethodRepresentationContract.byMethod[]`. We do
 *     NOT re-evaluate methods. We do NOT introduce a second selection engine.
 *   - When the engine cannot truly answer a dimension (recovery, fatigue,
 *     progression-week, joint/tendon caution, dosage recompute, session-length
 *     tradeoff), we mark it `not_yet_evaluated_by_current_method_decision_layer`
 *     rather than inventing copy.
 *   - Override eligibility is derived from the existing `status` enum only:
 *       APPLIED                       -> n/a (already used)
 *       NOT_NEEDED_FOR_PROFILE        -> safe_to_offer_with_tradeoff
 *       BLOCKED_BY_SAFETY             -> unsafe_to_offer
 *       MATERIALIZER_NOT_CONNECTED    -> engine_gap
 *   - Tradeoff text is small, static, honest, and refers ONLY to what the
 *     existing reason already says. We never claim recovery / fatigue / dosage
 *     reasoning that the engine has not produced.
 *
 * NOT IMPLEMENTED HERE (deferred)
 *   - The accordion UI ("Weekly Method Decisions" / "AI Coach Method Reasoning")
 *   - Any override action that mutates the program
 *   - Any dosage / frequency / intensity recompute layer
 *   - Joint/tendon-caution reasoning surface (engine does not yet produce it)
 *
 * If a future phase wires this into UI, the renderer MUST treat
 * `not_yet_evaluated` markers as "not yet evaluated by current method decision
 * layer" — not as "no reason" and not as "the AI considered it" filler.
 * =============================================================================
 */

import type {
  WeeklyMethodId,
  WeeklyMethodRepresentationContract,
  WeeklyMethodRepresentationEntry,
  WeeklyMethodStatus,
} from './weekly-method-representation'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Why a preferred-but-not-used method was not used. Derived ONLY from the
 * existing `status` value in `WeeklyMethodRepresentationContract`. Anything
 * the engine cannot truly classify lands in `not_yet_evaluated`.
 */
export type WeeklyMethodReasonCategory =
  | 'skill_quality_protection'   // BLOCKED_BY_SAFETY under skill-priority profile
  | 'strength_specificity'        // NOT_NEEDED_FOR_PROFILE for top_set_backoff w/o loaded primary-strength pillar
  | 'goal_priority_mismatch'      // NOT_NEEDED_FOR_PROFILE — method does not match primary/secondary goal
  | 'engine_gap_no_writer'        // MATERIALIZER_NOT_CONNECTED — no row-level writer exists yet
  | 'profile_did_not_request'     // user did not select this style/preference
  | 'not_yet_evaluated'           // catch-all when status doesn't map cleanly

export type WeeklyMethodOverrideEligibility =
  /** User CAN safely force this method, but a dosage tradeoff applies. */
  | 'safe_to_offer_with_tradeoff'
  /** Unsafe under the current decision layer (skill-priority protection). */
  | 'unsafe_to_offer'
  /** Engine gap — no materializer exists, override cannot be honored yet. */
  | 'engine_gap'
  /** Decision layer hasn't evaluated this dimension yet. */
  | 'not_yet_evaluated'

export interface WeeklyMethodUsedEntry {
  methodId: WeeklyMethodId
  materializedCount: number
  isUserPreference: boolean
}

export interface WeeklyMethodPreferredButNotUsedEntry {
  methodId: WeeklyMethodId
  /** Pass-through from the representation contract — never invented here. */
  status: WeeklyMethodStatus
  /** Pass-through reason text. Already authored by the decision layer. */
  reason: string
  /** Mapped from `status` only. */
  reasonCategory: WeeklyMethodReasonCategory
  /** Mapped from `status` only. */
  overrideEligibility: WeeklyMethodOverrideEligibility
  /**
   * Static, honest tradeoff note keyed off `overrideEligibility`. UI may
   * use this verbatim. It refers only to what the engine already knows
   * (skill protection / engine-gap / dosage reshape). It never claims
   * specific recovery, fatigue, or progression-week math that doesn't
   * exist in the current decision layer.
   */
  overrideTradeoffNote: string
  /**
   * The current decision layer does NOT have a dosage-recompute engine. If
   * a user later forces this method, dosage adjustment is required but is
   * not yet derivable here — every override path must therefore route
   * through a future dosage-recompute service that does not exist today.
   */
  dosageChangeRequired: 'not_yet_evaluated_by_current_method_decision_layer'
}

export interface WeeklyMethodNotPreferredEntry {
  methodId: WeeklyMethodId
  status: WeeklyMethodStatus
  reason: string
}

export interface WeeklyMethodEngineGap {
  methodId: WeeklyMethodId
  note: string
}

/**
 * Compact summary the future "Weekly Method Decisions" accordion can read
 * from. All fields derive from a single `WeeklyMethodRepresentationContract`
 * — no new selection logic, no second engine.
 */
export interface WeeklyMethodDecisionSummary {
  version: 'ab5_scaffold.weekly_method_decision_summary.v1'
  generatedAt: string
  source: {
    /** Pass-through of the upstream contract version so a future UI can
     * gracefully degrade if the contract shape changes. */
    representationContractVersion: WeeklyMethodRepresentationContract['version']
    /** True iff a `materializationRollup` was actually present upstream. */
    derivedFromMaterializationRollup: boolean
  }
  methodsUsed: WeeklyMethodUsedEntry[]
  preferredButNotUsed: WeeklyMethodPreferredButNotUsedEntry[]
  notPreferredAndNotUsed: WeeklyMethodNotPreferredEntry[]
  engineGaps: WeeklyMethodEngineGap[]
  /**
   * Dimensions the current decision layer cannot honestly evaluate. The
   * future UI MUST render these as "not yet evaluated by current method
   * decision layer" — never as "the AI considered it".
   */
  notYetEvaluated: {
    recoveryWindowReasoning: boolean
    fatigueLoadReasoning: boolean
    progressionWeekReasoning: boolean
    jointTendonCautionReasoning: boolean
    sessionLengthTradeoffReasoning: boolean
    dosageRecompute: boolean
    exerciseCompatibilityRecompute: boolean
  }
}

// =============================================================================
// USER PREFERENCE -> METHOD ID MAPPING (conservative; reuses existing tokens)
// =============================================================================

/**
 * Token-level mapping from `selectedTrainingStyles` / `sessionStylePreference`
 * strings to `WeeklyMethodId`. Conservative: only methods the engine actually
 * knows about land here. Anything else is silently ignored — we never invent
 * a synthetic method id from a free-form preference string.
 *
 * Synonyms include the natural-language tokens users see in onboarding ("HIIT"
 * for circuit/density, "supersets" for superset, etc). When the upstream
 * preference vocabulary changes, extend this map — do NOT add a fallback that
 * guesses, since that would cause `preferredButNotUsed` to claim the user
 * selected something they didn't.
 */
const PREFERENCE_TOKEN_TO_METHOD_ID: Record<string, WeeklyMethodId> = {
  superset: 'superset',
  supersets: 'superset',
  circuit: 'circuit',
  circuits: 'circuit',
  hiit: 'circuit',
  density: 'density_block',
  density_block: 'density_block',
  density_blocks: 'density_block',
  emom: 'density_block',
  amrap: 'density_block',
  cluster: 'cluster',
  clusters: 'cluster',
  cluster_set: 'cluster',
  cluster_sets: 'cluster',
  rest_pause: 'rest_pause',
  'rest-pause': 'rest_pause',
  myorep: 'rest_pause',
  myo_rep: 'rest_pause',
  drop_set: 'drop_set',
  'drop-set': 'drop_set',
  drop_sets: 'drop_set',
  top_set: 'top_set_backoff',
  top_sets: 'top_set_backoff',
  top_set_backoff: 'top_set_backoff',
  endurance_density: 'endurance_density',
  conditioning: 'endurance_density',
  work_capacity: 'endurance_density',
}

function buildPreferredMethodSet(
  fingerprint: WeeklyMethodRepresentationContract['profileFingerprint'],
): Set<WeeklyMethodId> {
  const preferred = new Set<WeeklyMethodId>()
  const tokens: string[] = []
  if (Array.isArray(fingerprint.selectedTrainingStyles)) {
    for (const s of fingerprint.selectedTrainingStyles) {
      if (typeof s === 'string' && s.trim()) tokens.push(s.trim().toLowerCase())
    }
  }
  if (typeof fingerprint.sessionStylePreference === 'string' && fingerprint.sessionStylePreference.trim()) {
    tokens.push(fingerprint.sessionStylePreference.trim().toLowerCase())
  }
  for (const tok of tokens) {
    const mapped = PREFERENCE_TOKEN_TO_METHOD_ID[tok]
    if (mapped) preferred.add(mapped)
  }
  return preferred
}

// =============================================================================
// STATUS -> REASON CATEGORY / OVERRIDE ELIGIBILITY MAPS
// =============================================================================

function classifyReasonCategory(
  entry: WeeklyMethodRepresentationEntry,
  isUserPreference: boolean,
): WeeklyMethodReasonCategory {
  switch (entry.status) {
    case 'APPLIED':
      return 'not_yet_evaluated' // unused — APPLIED entries don't land here
    case 'BLOCKED_BY_SAFETY':
      return 'skill_quality_protection'
    case 'MATERIALIZER_NOT_CONNECTED':
      return 'engine_gap_no_writer'
    case 'NOT_NEEDED_FOR_PROFILE':
      // top_set_backoff is the strength-specificity gate; everything else in
      // this status bucket reads as "user did not request OR goal mismatch".
      if (entry.methodId === 'top_set_backoff') return 'strength_specificity'
      if (isUserPreference) return 'goal_priority_mismatch'
      return 'profile_did_not_request'
    default:
      return 'not_yet_evaluated'
  }
}

function classifyOverrideEligibility(
  status: WeeklyMethodStatus,
): WeeklyMethodOverrideEligibility {
  switch (status) {
    case 'BLOCKED_BY_SAFETY':
      return 'unsafe_to_offer'
    case 'MATERIALIZER_NOT_CONNECTED':
      return 'engine_gap'
    case 'NOT_NEEDED_FOR_PROFILE':
      return 'safe_to_offer_with_tradeoff'
    case 'APPLIED':
      return 'not_yet_evaluated' // unused — APPLIED entries don't land here
    default:
      return 'not_yet_evaluated'
  }
}

function tradeoffNoteFor(
  eligibility: WeeklyMethodOverrideEligibility,
  methodId: WeeklyMethodId,
): string {
  switch (eligibility) {
    case 'unsafe_to_offer':
      return (
        `Forcing ${methodId.replace(/_/g, ' ')} on this profile would conflict with ` +
        `skill-priority protection (technical quality + tendon safety). The current ` +
        `decision layer does not expose a safe-override path for this method.`
      )
    case 'engine_gap':
      return (
        `No row-level writer exists for ${methodId.replace(/_/g, ' ')} yet. An override ` +
        `cannot be honored until a materializer is connected.`
      )
    case 'safe_to_offer_with_tradeoff':
      return (
        `An override could be honored, but dosage (sets / reps / rest / placement) ` +
        `would need to be reshaped to protect recovery and progression. Dosage ` +
        `recompute is not yet evaluated by the current method decision layer.`
      )
    case 'not_yet_evaluated':
    default:
      return 'Not yet evaluated by current method decision layer.'
  }
}

// =============================================================================
// PUBLIC: pure derivation
// =============================================================================

export interface BuildWeeklyMethodDecisionSummaryArgs {
  representation: WeeklyMethodRepresentationContract | null | undefined
  /** Flag forwarded from upstream so the summary knows whether the rollup
   * was real or synthetic. Defaults to `false`. */
  derivedFromMaterializationRollup?: boolean
}

/**
 * Pure JSON-safe derivation. Returns `null` when no representation contract is
 * available (older programs, or generation paths that haven't run the audit).
 * Callers MUST handle the `null` case rather than rendering a confident
 * "we evaluated everything" UI on top of nothing.
 */
export function buildWeeklyMethodDecisionSummary(
  args: BuildWeeklyMethodDecisionSummaryArgs,
): WeeklyMethodDecisionSummary | null {
  const rep = args.representation
  if (!rep || !Array.isArray(rep.byMethod)) return null

  const preferred = buildPreferredMethodSet(rep.profileFingerprint)

  const methodsUsed: WeeklyMethodUsedEntry[] = []
  const preferredButNotUsed: WeeklyMethodPreferredButNotUsedEntry[] = []
  const notPreferredAndNotUsed: WeeklyMethodNotPreferredEntry[] = []
  const engineGaps: WeeklyMethodEngineGap[] = []

  for (const entry of rep.byMethod) {
    const isUserPreference = preferred.has(entry.methodId)

    if (entry.status === 'APPLIED' && entry.materializedCount > 0) {
      methodsUsed.push({
        methodId: entry.methodId,
        materializedCount: entry.materializedCount,
        isUserPreference,
      })
      continue
    }

    // Engine gap is recorded separately so future UI can group "the engine
    // cannot do this yet" distinctly from "the engine considered and rejected".
    if (entry.status === 'MATERIALIZER_NOT_CONNECTED') {
      engineGaps.push({
        methodId: entry.methodId,
        note: entry.reason || 'No materializer connected.',
      })
    }

    if (isUserPreference) {
      const overrideEligibility = classifyOverrideEligibility(entry.status)
      preferredButNotUsed.push({
        methodId: entry.methodId,
        status: entry.status,
        reason: entry.reason,
        reasonCategory: classifyReasonCategory(entry, true),
        overrideEligibility,
        overrideTradeoffNote: tradeoffNoteFor(overrideEligibility, entry.methodId),
        dosageChangeRequired: 'not_yet_evaluated_by_current_method_decision_layer',
      })
    } else {
      notPreferredAndNotUsed.push({
        methodId: entry.methodId,
        status: entry.status,
        reason: entry.reason,
      })
    }
  }

  return {
    version: 'ab5_scaffold.weekly_method_decision_summary.v1',
    generatedAt: new Date().toISOString(),
    source: {
      representationContractVersion: rep.version,
      derivedFromMaterializationRollup:
        args.derivedFromMaterializationRollup === true,
    },
    methodsUsed,
    preferredButNotUsed,
    notPreferredAndNotUsed,
    engineGaps,
    // Honest gaps. The future UI must render these as "not yet evaluated by
    // current method decision layer" rather than inventing copy. None of
    // these dimensions has a producer in the current corridor — flipping
    // any of these to `false` requires an upstream engine that actually
    // emits the corresponding reasoning, NOT a UI tweak.
    notYetEvaluated: {
      recoveryWindowReasoning: true,
      fatigueLoadReasoning: true,
      progressionWeekReasoning: true,
      jointTendonCautionReasoning: true,
      sessionLengthTradeoffReasoning: true,
      dosageRecompute: true,
      exerciseCompatibilityRecompute: true,
    },
  }
}

/**
 * Type-narrowing helper for the future UI. Returns true iff the summary has
 * at least one preferred-but-not-used method that could be safely overridden
 * with a dosage tradeoff. Useful for deciding whether to show an "Adjust
 * preferences" affordance at all.
 */
export function summaryHasSafeOverrideCandidate(
  summary: WeeklyMethodDecisionSummary | null,
): boolean {
  if (!summary) return false
  return summary.preferredButNotUsed.some(
    e => e.overrideEligibility === 'safe_to_offer_with_tradeoff',
  )
}
