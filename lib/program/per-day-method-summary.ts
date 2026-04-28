/**
 * =============================================================================
 * per-day-method-summary.ts
 * -----------------------------------------------------------------------------
 * AB6 RECOVERY — DAY-BY-DAY METHOD COACH SUMMARY DERIVATION
 *
 * The previous Weekly Method Decisions surface only summarized week-level
 * counts ("1 used · 0 preferred not used · 1 engine gap"). The user could not
 * tell, on a per-day basis, what the AI coach used, why it used it, what it
 * did not use, and why it didn't. This module is the pure derivation that
 * powers the new day-by-day surface.
 *
 * STRICT DOCTRINE
 *   - Pure: no React, no DOM, no module-level state, JSON-safe output.
 *   - Read-only: never mutates sessions, never re-decides methods.
 *   - Source of truth (per session, in priority order):
 *       1. session.methodDecision.actualMaterialization (counts of grouped
 *          blocks + row-level set-execution methods that ACTUALLY shipped)
 *       2. session.styleMetadata.appliedMethods + rejectedMethods + the
 *          methodMaterializationSummary rollup
 *       3. session.compositionMetadata.methodEligibility (per-method
 *          'earned' / 'allowed' / 'discouraged' / 'blocked' verdict)
 *       4. session.compositionMetadata.weeklyRole.methodAllowance (the
 *          coaching-language allowance string for the role)
 *       5. session.exercises[].setExecutionMethod (last-resort row count)
 *   - When evidence is genuinely absent we say "Not yet evaluated by current
 *     method decision layer" — never invent reasoning.
 *
 * NOT IMPLEMENTED HERE (deferred — see future override phase)
 *   - Override mutation. The summary marks override readiness; the dosage
 *     recompute that an override would require is honestly stamped as
 *     `not_yet_evaluated_by_current_method_decision_layer` until it ships.
 * =============================================================================
 */

import type { AdaptiveProgram, AdaptiveSession } from '@/lib/adaptive-program-builder'
import type {
  WeeklyMethodId,
  WeeklyMethodRepresentationContract,
} from './weekly-method-representation'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/** Override readiness per absent method on a given day. Mirrors the
 * weekly summary's vocabulary so a single override UI can read both. */
export type DayOverrideEligibility =
  | 'safe_with_tradeoff'
  | 'unsafe_skill_protection'
  | 'unsafe_role_mismatch'
  | 'engine_gap_no_writer'
  | 'not_yet_evaluated'

export type DayMethodReasonCategory =
  | 'role_skill_priority'           // skill-priority day — protect static / technical anchors
  | 'role_strength_priority'        // strength-emphasis day — straight sets / top set focused
  | 'role_recovery_or_light'        // low-intensity / recovery day — methods would be overkill
  | 'role_acclimation_week'         // first-week protection capped intensity
  | 'role_density_or_conditioning'  // density / conditioning day — methods used by design
  | 'goal_priority_mismatch'        // method does not match primary/secondary goal
  | 'engine_gap_no_writer'          // no row-level writer exists yet
  | 'profile_did_not_request'       // user did not select this style
  | 'not_yet_evaluated'             // honest fallback

export interface DayMethodUsedEntry {
  methodId: WeeklyMethodId
  label: string
  /** Raw materialization count (grouped block count or row count). */
  count: number
  /** True iff the user marked this style as preferred during onboarding. */
  isUserPreference: boolean
  /** One-line coach explanation of why this method was used today. */
  reason: string
}

export interface DayMethodNotUsedEntry {
  methodId: WeeklyMethodId
  label: string
  /** True iff the user marked this style as preferred during onboarding. */
  isUserPreference: boolean
  reasonCategory: DayMethodReasonCategory
  /** One-line coach explanation of why this method was NOT used today. */
  reason: string
  overrideEligibility: DayOverrideEligibility
  /** Plain-English tradeoff if the user later overrides for this day. */
  overrideTradeoff: string
}

export interface PerDayMethodInfluence {
  /** Total method families considered (8 — the WeeklyMethodId set). */
  considered: number
  /** Methods that actually materialized on this day. */
  applied: number
  /** Methods this day's role/eligibility blocks for safety. */
  blocked: number
  /** Methods with no row-level writer yet (engine gap). */
  runtimeGap: number
  /** Methods the user's profile did not request (and role didn't earn). */
  notRequested: number
}

export interface PerDayMethodSummary {
  dayNumber: number
  dayLabel: string
  focusLabel: string
  /** Coach-facing role name (e.g. "Skill quality emphasis"). May be null
   * for older saved programs that lack the weekly role contract. */
  roleLabel: string | null
  /** 1-2 sentence "why this day looks the way it does" intro. */
  strategy: string
  methodsUsed: DayMethodUsedEntry[]
  methodsNotUsed: DayMethodNotUsedEntry[]
  influence: PerDayMethodInfluence
  /** User-preferred methods that WERE honored on this day. */
  preferredHonored: WeeklyMethodId[]
  /** User-preferred methods that were NOT honored on this day. */
  preferredNotHonored: WeeklyMethodId[]
}

export interface PerWeekMethodCoachSummary {
  version: 'ab6_recovery.per_week_method_coach.v1'
  generatedAt: string
  /** 2-3 sentence "this week's method strategy" intro. */
  weekStrategy: string
  days: PerDayMethodSummary[]
  totals: {
    daysWithAnyMethod: number
    daysFullyStraight: number
    methodsUsedAcrossWeek: WeeklyMethodId[]
    preferredHonoredAtLeastOnce: WeeklyMethodId[]
    preferredNeverHonored: WeeklyMethodId[]
  }
  /** True when the underlying contract was missing — the UI should render
   * an honest fallback instead of confident reasoning. */
  fallbackUsed: boolean
}

// =============================================================================
// METHOD METADATA
// =============================================================================

const METHOD_LABEL: Record<WeeklyMethodId, string> = {
  superset: 'Supersets',
  circuit: 'Circuits',
  density_block: 'Density blocks',
  cluster: 'Cluster sets',
  top_set_backoff: 'Top set + backoff',
  drop_set: 'Drop sets',
  rest_pause: 'Rest-pause',
  endurance_density: 'Endurance / conditioning blocks',
}

/** Methods we evaluate on every day. Order matters for UI consistency. */
const ALL_METHODS: WeeklyMethodId[] = [
  'superset',
  'circuit',
  'density_block',
  'cluster',
  'top_set_backoff',
  'drop_set',
  'rest_pause',
  'endurance_density',
]

/** Methods with no row-level writer in runtime today. Mirrors the registry
 * in `weekly-method-representation.ts`. */
const ENGINE_GAP_METHODS: ReadonlySet<WeeklyMethodId> = new Set(['endurance_density'])

// =============================================================================
// USER PREFERENCE TOKEN MAPPING
// =============================================================================

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
  endurance: 'endurance_density',
  metabolic: 'endurance_density',
}

function buildPreferredMethodSet(args: {
  representation: WeeklyMethodRepresentationContract | null
  programInputs?: AdaptiveProgram | null | undefined
}): Set<WeeklyMethodId> {
  const preferred = new Set<WeeklyMethodId>()
  const tokens: string[] = []

  // Source 1: Phase 4J profile fingerprint (richest source).
  if (args.representation?.profileFingerprint) {
    const fp = args.representation.profileFingerprint
    if (Array.isArray(fp.selectedTrainingStyles)) {
      for (const s of fp.selectedTrainingStyles) {
        if (typeof s === 'string' && s.trim()) tokens.push(s.trim().toLowerCase())
      }
    }
    if (typeof fp.sessionStylePreference === 'string' && fp.sessionStylePreference.trim()) {
      tokens.push(fp.sessionStylePreference.trim().toLowerCase())
    }
  }

  // Source 2: any selectedTrainingStyles directly on the program (older shape).
  const prog = args.programInputs as unknown as {
    selectedTrainingStyles?: unknown
    sessionStylePreference?: unknown
    profileSnapshot?: {
      selectedTrainingStyles?: unknown
      sessionStylePreference?: unknown
    }
  } | null
  if (prog) {
    const candidates: unknown[] = [
      prog.selectedTrainingStyles,
      prog.sessionStylePreference,
      prog.profileSnapshot?.selectedTrainingStyles,
      prog.profileSnapshot?.sessionStylePreference,
    ]
    for (const c of candidates) {
      if (Array.isArray(c)) {
        for (const s of c) {
          if (typeof s === 'string' && s.trim()) tokens.push(s.trim().toLowerCase())
        }
      } else if (typeof c === 'string' && c.trim()) {
        tokens.push(c.trim().toLowerCase())
      }
    }
  }

  for (const tok of tokens) {
    const normalized = tok.replace(/\s+/g, '_')
    const mapped =
      PREFERENCE_TOKEN_TO_METHOD_ID[normalized] ||
      PREFERENCE_TOKEN_TO_METHOD_ID[tok]
    if (mapped) preferred.add(mapped)
  }

  return preferred
}

// =============================================================================
// PER-SESSION SHAPE (defensive duck-typed reads)
// =============================================================================

interface SessionMethodEvidence {
  /** Per-method materialization counts on this exact session. */
  counts: Record<WeeklyMethodId, number>
  /** Per-method eligibility, when the role contract is present. */
  eligibility: Partial<Record<WeeklyMethodId, 'earned' | 'allowed' | 'discouraged' | 'blocked'>>
  /** Per-method human-language allowance string from weeklyRole, when present. */
  allowance: Partial<Record<WeeklyMethodId, string>>
  /** Rejected methods stamped by the materializer (method -> reason). */
  rejected: Map<string, string>
  /** Stable role identifier (e.g. 'skill_quality_emphasis'). May be null. */
  roleId: string | null
  /** Coach-facing role label ('Skill quality emphasis'). May be null. */
  roleLabel: string | null
  /** Spine session type, when present. */
  spineSessionType: string | null
  /** Acclimation / first-week protection flag, when stamped upstream. */
  acclimationActive: boolean
  /** True when the session has any non-straight-set materialization. */
  hasAnyMethod: boolean
}

function readSessionEvidence(session: AdaptiveSession): SessionMethodEvidence {
  const counts: Record<WeeklyMethodId, number> = {
    superset: 0,
    circuit: 0,
    density_block: 0,
    cluster: 0,
    top_set_backoff: 0,
    drop_set: 0,
    rest_pause: 0,
    endurance_density: 0,
  }

  // Source 1: actualMaterialization (most authoritative, written by Phase 4A).
  const am = session.methodDecision?.actualMaterialization
  if (am) {
    if (am.groupedMethodCounts) {
      counts.superset += am.groupedMethodCounts.superset || 0
      counts.circuit += am.groupedMethodCounts.circuit || 0
      counts.density_block += am.groupedMethodCounts.density_block || 0
    }
    if (am.rowExecutionCounts) {
      counts.cluster += am.rowExecutionCounts.cluster || 0
      counts.top_set_backoff += am.rowExecutionCounts.top_set || 0
      counts.drop_set += am.rowExecutionCounts.drop_set || 0
      counts.rest_pause += am.rowExecutionCounts.rest_pause || 0
    }
  }

  // Source 2: row scan as a fallback when actualMaterialization is missing.
  if (!am) {
    for (const ex of session.exercises || []) {
      const sx = (ex as { setExecutionMethod?: string | null }).setExecutionMethod
      if (sx === 'cluster') counts.cluster += 1
      else if (sx === 'top_set') counts.top_set_backoff += 1
      else if (sx === 'drop_set') counts.drop_set += 1
      else if (sx === 'rest_pause') counts.rest_pause += 1
    }
  }

  const eligibility: SessionMethodEvidence['eligibility'] = {}
  const allowance: SessionMethodEvidence['allowance'] = {}
  const cm = session.compositionMetadata
  if (cm?.methodEligibility) {
    eligibility.superset = cm.methodEligibility.supersets
    eligibility.circuit = cm.methodEligibility.circuits
    eligibility.density_block = cm.methodEligibility.density
  }
  if (cm?.weeklyRole?.methodAllowance) {
    const ma = cm.weeklyRole.methodAllowance
    if (typeof ma.supersets === 'string') allowance.superset = ma.supersets
    if (typeof ma.circuits === 'string') allowance.circuit = ma.circuits
    if (typeof ma.density === 'string') allowance.density_block = ma.density
    if (typeof ma.cluster === 'string') allowance.cluster = ma.cluster
  }

  const rejected = new Map<string, string>()
  const rejectedList = session.styleMetadata?.rejectedMethods
  if (Array.isArray(rejectedList)) {
    for (const r of rejectedList) {
      if (r && typeof r.method === 'string' && typeof r.reason === 'string') {
        rejected.set(r.method.toLowerCase(), r.reason)
      }
    }
  }

  const roleId = cm?.weeklyRole?.roleId ?? null
  const roleLabel = cm?.weeklyRole?.roleLabel ?? null
  const spineSessionType = cm?.spineSessionType ?? null
  const acclimationActive = Boolean(
    session.prescriptionPropagationAudit?.firstWeekProtectionActive,
  )

  let hasAnyMethod = false
  for (const m of ALL_METHODS) {
    if (counts[m] > 0) {
      hasAnyMethod = true
      break
    }
  }

  return {
    counts,
    eligibility,
    allowance,
    rejected,
    roleId,
    roleLabel,
    spineSessionType,
    acclimationActive,
    hasAnyMethod,
  }
}

// =============================================================================
// REASON TEXT BUILDERS
// =============================================================================

function buildUsedReason(args: {
  methodId: WeeklyMethodId
  count: number
  evidence: SessionMethodEvidence
}): string {
  const { methodId, count, evidence } = args
  // If the materializer left an explicit allowance message for the role, use it.
  const allowance = evidence.allowance[methodId]
  if (allowance && allowance.trim().length > 0 && allowance.length < 140) {
    return allowance
  }
  // Otherwise, build a coach-voice line from method id + role.
  const role = evidence.roleId
  switch (methodId) {
    case 'superset':
      return `Used (${count} block${count === 1 ? '' : 's'}) — paired compatible accessories for time efficiency without compromising primary work.`
    case 'circuit':
      return `Used (${count} block${count === 1 ? '' : 's'}) — rotation of accessory exercises to build work capacity within the session window.`
    case 'density_block':
      return `Used (${count} block${count === 1 ? '' : 's'}) — time-capped accessory rotation to add density without lengthening the session.`
    case 'cluster':
      return `Used (${count}× row) — short intra-set rest preserves output on a position where quality matters more than continuous reps.`
    case 'top_set_backoff':
      return `Used (${count}× row) — single heavy top set followed by lower-intensity backoff to express strength without long ramp-ups.`
    case 'drop_set':
      return `Used (${count}× row) — late accessory drop to add hypertrophy stimulus after the primary work is in.`
    case 'rest_pause':
      return `Used (${count}× row) — short rest extensions on a late accessory to extend stimulus without a second exercise.`
    case 'endurance_density':
      return `Used (${count} block${count === 1 ? '' : 's'}) — endurance/density rotation${role ? ` aligned with the ${role.replace(/_/g, ' ')} role` : ''}.`
    default:
      return `Used (${count}).`
  }
}

function buildNotUsedReason(args: {
  methodId: WeeklyMethodId
  evidence: SessionMethodEvidence
  isUserPreference: boolean
}): { category: DayMethodReasonCategory; reason: string } {
  const { methodId, evidence, isUserPreference } = args

  // Engine gap takes precedence — there is no row-level writer at all.
  if (ENGINE_GAP_METHODS.has(methodId)) {
    return {
      category: 'engine_gap_no_writer',
      reason: 'Not used — no runtime writer for this method exists yet, so the materializer cannot ship it.',
    }
  }

  // Materializer left an explicit rejection reason for this exact method.
  // We map a few common method ids to the rejected-method vocabulary.
  const rejectKeys: string[] = (() => {
    switch (methodId) {
      case 'superset': return ['superset', 'supersets']
      case 'circuit': return ['circuit', 'circuits']
      case 'density_block': return ['density', 'density_block']
      case 'cluster': return ['cluster']
      case 'top_set_backoff': return ['top_set', 'top_set_backoff']
      case 'drop_set': return ['drop_set']
      case 'rest_pause': return ['rest_pause']
      default: return []
    }
  })()
  for (const key of rejectKeys) {
    const reason = evidence.rejected.get(key)
    if (reason && reason.trim().length > 0) {
      // Heuristic categorization from the reason text.
      const lower = reason.toLowerCase()
      let category: DayMethodReasonCategory = 'role_strength_priority'
      if (lower.includes('skill') || lower.includes('quality') || lower.includes('static')) {
        category = 'role_skill_priority'
      } else if (lower.includes('recovery') || lower.includes('light') || lower.includes('low')) {
        category = 'role_recovery_or_light'
      } else if (lower.includes('strength')) {
        category = 'role_strength_priority'
      } else if (lower.includes('density') || lower.includes('conditioning')) {
        category = 'role_density_or_conditioning'
      } else if (lower.includes('goal') || lower.includes('priority')) {
        category = 'goal_priority_mismatch'
      }
      return { category, reason }
    }
  }

  // Eligibility-driven reason.
  const elig = evidence.eligibility[methodId]
  if (elig === 'blocked') {
    const isSkill = (evidence.roleId || '').toLowerCase().includes('skill')
    return {
      category: isSkill ? 'role_skill_priority' : 'role_strength_priority',
      reason: isSkill
        ? `Blocked — this is a skill-quality day; ${METHOD_LABEL[methodId].toLowerCase()} would compromise technical quality and tendon load management.`
        : `Blocked — this day's role does not permit ${METHOD_LABEL[methodId].toLowerCase()}; structural priority is on quality straight sets.`,
    }
  }

  // Acclimation week protection.
  if (evidence.acclimationActive && (methodId === 'top_set_backoff' || methodId === 'drop_set' || methodId === 'rest_pause')) {
    return {
      category: 'role_acclimation_week',
      reason: `Skipped this week — acclimation/first-week protection capped intensity. ${METHOD_LABEL[methodId]} returns once the program leaves the protection window.`,
    }
  }

  // Role-driven absence (no explicit block, just role didn't call for it).
  const role = (evidence.roleId || '').toLowerCase()
  if (role.includes('skill')) {
    return {
      category: 'role_skill_priority',
      reason: `Not used — this day prioritizes skill quality on primary anchors; ${METHOD_LABEL[methodId].toLowerCase()} would dilute focus.`,
    }
  }
  if (role.includes('strength') || role.includes('primary')) {
    if (methodId === 'circuit' || methodId === 'density_block' || methodId === 'endurance_density') {
      return {
        category: 'role_strength_priority',
        reason: `Not used — strength-emphasis day; ${METHOD_LABEL[methodId].toLowerCase()} would conflict with the heavier strength focus.`,
      }
    }
  }
  if (role.includes('recovery') || role.includes('light') || role.includes('low')) {
    return {
      category: 'role_recovery_or_light',
      reason: `Not used — low-intensity / recovery day; methods are deliberately omitted to keep this session genuinely restorative.`,
    }
  }

  // User-preferred but not honored — make that explicit.
  if (isUserPreference) {
    return {
      category: 'goal_priority_mismatch',
      reason: `Not used today — your profile prefers this style, but today's role and exercise mix did not earn it. Other days in the week may include it.`,
    }
  }

  // Fallback honest reason.
  return {
    category: 'profile_did_not_request',
    reason: `Not used — this day's role and your training priorities did not call for ${METHOD_LABEL[methodId].toLowerCase()}.`,
  }
}

function buildOverrideReadiness(args: {
  methodId: WeeklyMethodId
  evidence: SessionMethodEvidence
  reasonCategory: DayMethodReasonCategory
}): { eligibility: DayOverrideEligibility; tradeoff: string } {
  const { methodId, evidence, reasonCategory } = args

  if (ENGINE_GAP_METHODS.has(methodId)) {
    return {
      eligibility: 'engine_gap_no_writer',
      tradeoff:
        `No row-level writer for ${METHOD_LABEL[methodId].toLowerCase()} exists yet — an override cannot be honored until a materializer ships.`,
    }
  }

  // Skill protection is the firmest "no". An override on a skill-priority day
  // would degrade exactly the work this day is designed to protect.
  if (reasonCategory === 'role_skill_priority' || evidence.eligibility[methodId] === 'blocked') {
    if ((evidence.roleId || '').toLowerCase().includes('skill')) {
      return {
        eligibility: 'unsafe_skill_protection',
        tradeoff:
          `Forcing ${METHOD_LABEL[methodId].toLowerCase()} on this day would reduce technical quality on the skill anchor and increase joint/tendon load. The coach would not recommend this override.`,
      }
    }
    return {
      eligibility: 'unsafe_role_mismatch',
      tradeoff:
        `Forcing ${METHOD_LABEL[methodId].toLowerCase()} on this day conflicts with the role's structural priority. A safer override target is a different day with a less protected role.`,
    }
  }

  // Strength-priority day with a hypertrophy/conditioning method — possible
  // with tradeoff. Acclimation is also reversible once the protection lifts.
  if (
    reasonCategory === 'role_strength_priority' ||
    reasonCategory === 'role_density_or_conditioning' ||
    reasonCategory === 'role_acclimation_week' ||
    reasonCategory === 'role_recovery_or_light' ||
    reasonCategory === 'profile_did_not_request' ||
    reasonCategory === 'goal_priority_mismatch'
  ) {
    return {
      eligibility: 'safe_with_tradeoff',
      tradeoff:
        `Override possible on accessory work, not on the primary anchor. Dosage (sets / reps / rest) would need to be reshaped — that recompute is not yet evaluated by the current method decision layer.`,
    }
  }

  return {
    eligibility: 'not_yet_evaluated',
    tradeoff: 'Override evaluation is not yet built for this method/day combination.',
  }
}

// =============================================================================
// ROLE LABEL FALLBACK
// =============================================================================

const ROLE_ID_TO_LABEL: Record<string, string> = {
  primary_strength_emphasis: 'Primary strength emphasis',
  skill_quality_emphasis: 'Skill quality emphasis',
  technical_focus: 'Technical focus',
  hypertrophy_emphasis: 'Hypertrophy emphasis',
  density_emphasis: 'Density / conditioning emphasis',
  recovery_or_light: 'Recovery / light',
  rotation_light: 'Rotation / light',
  mixed_balanced: 'Mixed / balanced',
}

function deriveRoleLabel(evidence: SessionMethodEvidence): string | null {
  if (evidence.roleLabel && evidence.roleLabel.trim().length > 0) {
    return evidence.roleLabel
  }
  if (evidence.roleId) {
    return ROLE_ID_TO_LABEL[evidence.roleId] ?? evidence.roleId.replace(/_/g, ' ')
  }
  if (evidence.spineSessionType) {
    return evidence.spineSessionType.replace(/_/g, ' ')
  }
  return null
}

function buildDayStrategy(args: {
  evidence: SessionMethodEvidence
  usedCount: number
  focusLabel: string
}): string {
  const { evidence, usedCount, focusLabel } = args
  const role = deriveRoleLabel(evidence)
  const focus = focusLabel || 'training'

  if (usedCount === 0) {
    if ((evidence.roleId || '').toLowerCase().includes('skill')) {
      return `Straight sets only. Skill anchors get clean sets to protect technical quality and tendon load — methods would dilute the focus.`
    }
    if (evidence.acclimationActive) {
      return `Straight sets only. Acclimation week caps intensity, so methods are intentionally held back until the protection window lifts.`
    }
    return `Straight sets only — today's ${focus.toLowerCase()} role did not earn additional method overlay.`
  }

  if (role) {
    return `${role}. ${usedCount === 1 ? '1 method overlay' : `${usedCount} method overlays`} added where they fit the role without compromising the primary work.`
  }
  return `${usedCount === 1 ? 'One method overlay' : `${usedCount} method overlays`} applied on top of straight-set work for this ${focus.toLowerCase()}.`
}

// =============================================================================
// PER-DAY BUILDER
// =============================================================================

function buildPerDaySummary(args: {
  session: AdaptiveSession
  preferred: Set<WeeklyMethodId>
}): PerDayMethodSummary {
  const { session, preferred } = args
  const evidence = readSessionEvidence(session)

  const methodsUsed: DayMethodUsedEntry[] = []
  const methodsNotUsed: DayMethodNotUsedEntry[] = []
  const preferredHonored: WeeklyMethodId[] = []
  const preferredNotHonored: WeeklyMethodId[] = []

  let blockedCount = 0
  let runtimeGapCount = 0
  let notRequestedCount = 0

  for (const methodId of ALL_METHODS) {
    const count = evidence.counts[methodId]
    const isUserPreference = preferred.has(methodId)

    if (count > 0) {
      methodsUsed.push({
        methodId,
        label: METHOD_LABEL[methodId],
        count,
        isUserPreference,
        reason: buildUsedReason({ methodId, count, evidence }),
      })
      if (isUserPreference) preferredHonored.push(methodId)
      continue
    }

    const { category, reason } = buildNotUsedReason({
      methodId,
      evidence,
      isUserPreference,
    })
    const { eligibility, tradeoff } = buildOverrideReadiness({
      methodId,
      evidence,
      reasonCategory: category,
    })
    methodsNotUsed.push({
      methodId,
      label: METHOD_LABEL[methodId],
      isUserPreference,
      reasonCategory: category,
      reason,
      overrideEligibility: eligibility,
      overrideTradeoff: tradeoff,
    })

    if (category === 'engine_gap_no_writer') runtimeGapCount += 1
    else if (
      category === 'role_skill_priority' ||
      category === 'role_strength_priority' ||
      category === 'role_recovery_or_light' ||
      category === 'role_acclimation_week'
    ) blockedCount += 1
    else notRequestedCount += 1

    if (isUserPreference) preferredNotHonored.push(methodId)
  }

  return {
    dayNumber: session.dayNumber,
    dayLabel: session.dayLabel,
    focusLabel: session.focusLabel || session.focus || '',
    roleLabel: deriveRoleLabel(evidence),
    strategy: buildDayStrategy({
      evidence,
      usedCount: methodsUsed.length,
      focusLabel: session.focusLabel || session.focus || '',
    }),
    methodsUsed,
    methodsNotUsed,
    influence: {
      considered: ALL_METHODS.length,
      applied: methodsUsed.length,
      blocked: blockedCount,
      runtimeGap: runtimeGapCount,
      notRequested: notRequestedCount,
    },
    preferredHonored,
    preferredNotHonored,
  }
}

// =============================================================================
// PUBLIC: BUILD PER-WEEK COACH SUMMARY
// =============================================================================

export interface BuildPerWeekMethodCoachSummaryArgs {
  program: AdaptiveProgram | null | undefined
  representation: WeeklyMethodRepresentationContract | null | undefined
}

export function buildPerWeekMethodCoachSummary(
  args: BuildPerWeekMethodCoachSummaryArgs,
): PerWeekMethodCoachSummary | null {
  const { program } = args
  if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
    return null
  }

  const preferred = buildPreferredMethodSet({
    representation: args.representation ?? null,
    programInputs: program,
  })

  const days: PerDayMethodSummary[] = program.sessions
    .slice()
    .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
    .map(session => buildPerDaySummary({ session, preferred }))

  // Aggregate week-level totals.
  const methodsUsedAcrossWeek = new Set<WeeklyMethodId>()
  const preferredHonoredAtLeastOnce = new Set<WeeklyMethodId>()
  let daysWithAnyMethod = 0
  let daysFullyStraight = 0
  for (const d of days) {
    if (d.methodsUsed.length > 0) {
      daysWithAnyMethod += 1
      for (const m of d.methodsUsed) {
        methodsUsedAcrossWeek.add(m.methodId)
        if (m.isUserPreference) preferredHonoredAtLeastOnce.add(m.methodId)
      }
    } else {
      daysFullyStraight += 1
    }
  }

  const preferredNeverHonored: WeeklyMethodId[] = []
  for (const m of preferred) {
    if (!preferredHonoredAtLeastOnce.has(m)) preferredNeverHonored.push(m)
  }

  // Week-level strategy intro.
  const weekStrategy = buildWeekStrategy({
    days,
    daysWithAnyMethod,
    daysFullyStraight,
    preferredCount: preferred.size,
    preferredNeverHonoredCount: preferredNeverHonored.length,
  })

  return {
    version: 'ab6_recovery.per_week_method_coach.v1',
    generatedAt: new Date().toISOString(),
    weekStrategy,
    days,
    totals: {
      daysWithAnyMethod,
      daysFullyStraight,
      methodsUsedAcrossWeek: Array.from(methodsUsedAcrossWeek),
      preferredHonoredAtLeastOnce: Array.from(preferredHonoredAtLeastOnce),
      preferredNeverHonored,
    },
    fallbackUsed: false,
  }
}

function buildWeekStrategy(args: {
  days: PerDayMethodSummary[]
  daysWithAnyMethod: number
  daysFullyStraight: number
  preferredCount: number
  preferredNeverHonoredCount: number
}): string {
  const { days, daysWithAnyMethod, daysFullyStraight, preferredCount, preferredNeverHonoredCount } = args
  const total = days.length
  const skillProtectedDays = days.filter(d =>
    (d.roleLabel || '').toLowerCase().includes('skill') ||
    d.methodsNotUsed.some(m => m.reasonCategory === 'role_skill_priority'),
  ).length

  const parts: string[] = []
  if (skillProtectedDays > 0) {
    parts.push(
      `Skill quality is protected on ${skillProtectedDays} of ${total} days — straight sets are deliberate on those days, not a default.`,
    )
  }
  if (daysWithAnyMethod > 0) {
    parts.push(
      `${daysWithAnyMethod} day${daysWithAnyMethod === 1 ? '' : 's'} include method overlays where the role and exercise mix earned them.`,
    )
  } else {
    parts.push(
      `All ${total} days run as straight sets this week — methods would dilute focus or conflict with role priorities.`,
    )
  }
  if (preferredCount > 0) {
    if (preferredNeverHonoredCount === 0) {
      parts.push(`Every method style your profile prefers appears at least once this week.`)
    } else {
      parts.push(
        `${preferredNeverHonoredCount} of your preferred method style${preferredNeverHonoredCount === 1 ? '' : 's'} did not appear this week — the per-day breakdown explains why.`,
      )
    }
  }
  if (daysFullyStraight > 0 && daysWithAnyMethod > 0) {
    parts.push(`Days that look "flat" are intentional, not missed work.`)
  }

  return parts.join(' ')
}
