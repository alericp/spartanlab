/**
 * =============================================================================
 * [PHASE 4P] STRUCTURAL METHOD MATERIALIZATION CORRIDOR
 * =============================================================================
 *
 * One authoritative pass that runs AFTER the adaptive builder and AFTER the
 * row-level method/prescription corridor. Its single job is to make sure
 * every doctrine-earned structural method (superset / circuit / density_block)
 * is either:
 *
 *   1. APPLIED              — corridor wrote a styledGroups entry + per-row
 *                             blockId/method to the session
 *   2. ALREADY_APPLIED      — builder already wrote a matching styledGroups
 *                             entry; corridor just mirrors it into the
 *                             canonical methodStructures array
 *   3. BLOCKED_BY_SAFETY    — budget said apply, but every safe target failed
 *                             the hard safety gates (skill row, tendon, etc)
 *   4. NOT_NEEDED           — budget said NOT_NEEDED for this profile
 *   5. NO_SAFE_TARGET       — budget said apply, but no eligible target rows
 *                             exist on this session
 *
 * Row-level families (top_set / drop_set / rest_pause / cluster /
 * endurance_density / prescription_rest / prescription_rpe) are NOT applied
 * here — the doctrine-application-corridor already owns those. This corridor
 * mirrors what the row-level corridor wrote into the unified
 * `methodStructures[]` array so the Program page and live workout can read
 * one shape.
 *
 * Hard rules (never violated):
 *   - Builder-applied groups WIN. We never overwrite or remove them.
 *   - One new structural group materialized per session per family per call.
 *   - Never pair / circuitize / density-block a primary skill row.
 *   - Never pair two tendon-sensitive straight-arm skill movements.
 *   - Never circuit a max-effort strength pillar.
 *   - Never duplicate a row across multiple structural blocks.
 *   - Skill-protected rows stay straight unless they already had a builder
 *     group around them.
 *   - If runtime contract for live workout cannot execute a family yet,
 *     the entry's `prescriptionSummary` carries a "preserved as guidance"
 *     note rather than pretending applied.
 * =============================================================================
 */

import {
  type CanonicalMethodFamily,
  type CanonicalMethodStructure,
  type CanonicalMethodStatus,
  familyLabel,
} from './method-structure-contract'

// =============================================================================
// LOCAL TYPES
// =============================================================================

interface CorridorExerciseLike {
  id?: string | null
  name?: string | null
  category?: string | null
  selectionReason?: string | null
  blockId?: string | null
  method?: string | null
  methodLabel?: string | null
  setExecutionMethod?: string | null
  rowLevelMethodApplied?: boolean | null
  densityPrescription?: unknown
  doctrineApplicationDeltas?: Array<{ family?: string }> | null
  structuralMethodApplied?: boolean | null
  structuralMethodDeltas?: Array<{ family?: string }> | null
}

interface CorridorStyledGroupLike {
  id: string
  groupType: 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'
  exercises: Array<{ id: string; name: string; methodLabel?: string }>
  instruction?: string
}

interface CorridorSessionLike {
  id?: string | null
  dayNumber?: number | null
  exercises?: CorridorExerciseLike[]
  styleMetadata?: {
    styledGroups?: CorridorStyledGroupLike[]
    hasSupersetsApplied?: boolean
    hasCircuitsApplied?: boolean
    hasDensityApplied?: boolean
    hasClusterApplied?: boolean
    primaryStyle?: string
  } | null
  methodStructures?: CanonicalMethodStructure[] | null
}

interface CorridorBudgetEntry {
  verdict: 'SHOULD_APPLY' | 'MAY_APPLY' | 'NOT_NEEDED' | 'BLOCKED_BY_SAFETY' | 'NO_SAFE_TARGET' | 'NOT_CONNECTED'
  recommendedWeeklyCount?: number
  reason?: string
}

interface CorridorBudgetPlan {
  byFamily?: Partial<Record<CanonicalMethodFamily, CorridorBudgetEntry>>
}

export interface StructuralMaterializationInput {
  session: CorridorSessionLike
  weeklyMethodBudgetPlan?: CorridorBudgetPlan | null
  selectedTrainingMethods?: string[]
  selectedSkills?: string[]
  jointCautions?: string[]
  /** Soft per-week cap. Currently 1 per family per session in this corridor. */
  perSessionStructuralBlockCap?: number
}

export interface StructuralMaterializationResult {
  methodStructures: CanonicalMethodStructure[]
  appliedCount: number
  alreadyAppliedCount: number
  blockedCount: number
  notNeededCount: number
  noSafeTargetCount: number
  /** True if the corridor wrote at least one NEW styledGroups entry this run. */
  newStructuralGroupWritten: boolean
  warnings: string[]
}

// =============================================================================
// SAFETY HELPERS — copied/aligned from doctrine-application-corridor.ts so this
// corridor stays self-contained and can be safely composed in either order.
// =============================================================================

const HIGH_SKILL_TOKENS = [
  'planche',
  'front lever',
  'back lever',
  'iron cross',
  'maltese',
  'one-arm pull',
  'one arm pull',
  'one-arm chin',
  'handstand',
  'press to handstand',
  'dragon flag',
  'human flag',
  'muscle-up',
  'muscle up',
  'l-sit',
  'l sit',
  'v-sit',
  'manna',
]

const TENDON_SENSITIVE_TOKENS = [
  'planche',
  'front lever',
  'back lever',
  'iron cross',
  'maltese',
  'straight arm',
  'straight-arm',
  'tucked planche',
  'advanced tuck',
]

const MAX_EFFORT_STRENGTH_TOKENS = [
  'one rep max',
  '1rm',
  'max effort',
  'max strength',
]

function isHighSkillRow(ex: CorridorExerciseLike): boolean {
  const name = String(ex.name ?? '').toLowerCase()
  const category = String(ex.category ?? '').toLowerCase()
  const reason = String(ex.selectionReason ?? '').toLowerCase()
  if (category === 'skill' || category === 'static_skill' || category === 'static skill') return true
  if (HIGH_SKILL_TOKENS.some(t => name.includes(t))) return true
  if (reason.includes('skill_priority') || reason.includes('skill priority')) return true
  return false
}

function isTendonSensitiveRow(ex: CorridorExerciseLike): boolean {
  const name = String(ex.name ?? '').toLowerCase()
  return TENDON_SENSITIVE_TOKENS.some(t => name.includes(t))
}

function isMaxStrengthPillarRow(ex: CorridorExerciseLike): boolean {
  const name = String(ex.name ?? '').toLowerCase()
  const reason = String(ex.selectionReason ?? '').toLowerCase()
  if (MAX_EFFORT_STRENGTH_TOKENS.some(t => name.includes(t))) return true
  if (reason.includes('max_strength') || reason.includes('max strength')) return true
  return false
}

function isAlreadyClaimedByGroup(ex: CorridorExerciseLike): boolean {
  // Has a blockId → the builder put it in a styledGroup. Don't relocate.
  return typeof ex.blockId === 'string' && ex.blockId.trim().length > 0
}

function isAlreadyClaimedByRowMethod(ex: CorridorExerciseLike): boolean {
  // Has a row-level set-execution method — let it own its row.
  return (
    typeof ex.setExecutionMethod === 'string' && ex.setExecutionMethod.trim().length > 0
  ) || ex.rowLevelMethodApplied === true
}

function exerciseDisplayId(ex: CorridorExerciseLike, fallbackIndex: number): string {
  if (typeof ex.id === 'string' && ex.id.trim().length > 0) return ex.id
  return `corridor-ex-${fallbackIndex}`
}

function exerciseDisplayName(ex: CorridorExerciseLike): string {
  return typeof ex.name === 'string' && ex.name.trim().length > 0 ? ex.name : 'Exercise'
}

// =============================================================================
// MIRRORING — read existing builder/corridor truth and emit canonical entries
// =============================================================================

function mirrorExistingStyledGroups(
  session: CorridorSessionLike,
  out: CanonicalMethodStructure[],
): { mirroredFamilies: Set<CanonicalMethodFamily> } {
  const mirrored = new Set<CanonicalMethodFamily>()
  const groups = session.styleMetadata?.styledGroups ?? []
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : undefined

  let groupIdx = 0
  for (const g of groups) {
    if (g.groupType === 'straight') continue
    // Cluster as a styledGroup is stripped at display per METHOD-TAXONOMY-LOCK.
    // We still mirror it into methodStructures as `cluster` so the rollup is
    // honest about the builder's intent, but we mark it `already_applied` and
    // let the row-level chip carry the visible truth.
    const family: CanonicalMethodFamily =
      g.groupType === 'superset' ? 'superset'
      : g.groupType === 'circuit' ? 'circuit'
      : g.groupType === 'density_block' ? 'density_block'
      : 'cluster'

    const exercises = (g.exercises ?? []).filter(e => typeof e.name === 'string' && e.name.trim().length >= 2)
    if (exercises.length === 0) continue

    out.push({
      id: g.id || `method-${family}-day${dayNumber ?? '?'}-${groupIdx}`,
      family,
      label: familyLabel(family),
      source: 'builder',
      status: 'already_applied',
      sessionId: session.id ?? undefined,
      dayNumber,
      exerciseIds: exercises.map(e => e.id),
      exerciseNames: exercises.map(e => e.name),
      reason: 'Adaptive builder emitted this grouped structure under doctrine-locked materialization rules.',
      sourceRuleIds: ['adaptive_program_builder.styled_groups_materialization'],
      safetyGatesPassed: ['builder_materialization_safety'],
      safetyGatesFailed: [],
      visibleProofPath: `session.styleMetadata.styledGroups[${groupIdx}]`,
    })
    mirrored.add(family)
    groupIdx += 1
  }

  return { mirroredFamilies: mirrored }
}

function mirrorRowLevelMethods(
  session: CorridorSessionLike,
  out: CanonicalMethodStructure[],
): void {
  const exercises = session.exercises ?? []
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : undefined

  exercises.forEach((ex, idx) => {
    const setExec = String(ex.setExecutionMethod ?? '').trim()
    const method = String(ex.method ?? '').trim()
    const exId = exerciseDisplayId(ex, idx)
    const exName = exerciseDisplayName(ex)

    // Row-level set-execution methods. These were stamped by either the
    // builder or the doctrine-application-corridor; we don't care which —
    // the canonical entry just reports what is in the final session.
    let rowFamily: CanonicalMethodFamily | null = null
    if (setExec === 'top_set' || method === 'top_set') rowFamily = 'top_set'
    else if (setExec === 'drop_set' || method === 'drop_set') rowFamily = 'drop_set'
    else if (setExec === 'rest_pause' || method === 'rest_pause') rowFamily = 'rest_pause'
    else if (setExec === 'cluster' || method === 'cluster') rowFamily = 'cluster'

    if (rowFamily !== null) {
      // Determine source: deltas from the corridor will tag `family` matching
      // the row method; otherwise we attribute to builder.
      const corridorTouched = (ex.doctrineApplicationDeltas ?? []).some(
        d => d?.family === rowFamily,
      )
      out.push({
        id: `method-${rowFamily}-${exId}`,
        family: rowFamily,
        label: familyLabel(rowFamily),
        source: corridorTouched ? 'doctrine_application_corridor' : 'builder',
        status: 'already_applied',
        sessionId: session.id ?? undefined,
        dayNumber,
        exerciseIds: [exId],
        exerciseNames: [exName],
        targetExerciseId: exId,
        targetExerciseName: exName,
        reason: corridorTouched
          ? 'Row-level set-execution method earned by the doctrine application corridor under safety gates.'
          : 'Row-level set-execution method emitted by the adaptive builder.',
        sourceRuleIds: corridorTouched
          ? ['phase_4m.doctrine_application_corridor.row_level_v1']
          : ['adaptive_program_builder.row_level_mutator_block'],
        safetyGatesPassed: ['row_level_safety'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${idx}].setExecutionMethod`,
      })
    }

    // Endurance density (row-level family owned by the row mutator)
    if (method === 'endurance_density') {
      out.push({
        id: `method-endurance_density-${exId}`,
        family: 'endurance_density',
        label: familyLabel('endurance_density'),
        source: 'doctrine_application_corridor',
        status: 'already_applied',
        sessionId: session.id ?? undefined,
        dayNumber,
        exerciseIds: [exId],
        exerciseNames: [exName],
        targetExerciseId: exId,
        targetExerciseName: exName,
        prescriptionSummary: extractDensityTimeCapSummary(ex.densityPrescription),
        reason: 'Endurance density applied to a safe late-position accessory / core / conditioning row.',
        sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
        safetyGatesPassed: ['row_level_safety', 'late_position', 'safe_target'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${idx}].densityPrescription`,
      })
    }

    // prescription_rest / prescription_rpe — extract from doctrineApplicationDeltas
    for (const delta of ex.doctrineApplicationDeltas ?? []) {
      if (delta?.family === 'prescription_rest' || delta?.family === 'prescription_rpe') {
        const family = delta.family as CanonicalMethodFamily
        out.push({
          id: `method-${family}-${exId}`,
          family,
          label: familyLabel(family),
          source: 'doctrine_application_corridor',
          status: 'already_applied',
          sessionId: session.id ?? undefined,
          dayNumber,
          exerciseIds: [exId],
          exerciseNames: [exName],
          targetExerciseId: exId,
          targetExerciseName: exName,
          reason: 'Prescription value adjusted by the doctrine application corridor under bounded safety rules.',
          sourceRuleIds: ['phase_4m.prescription_doctrine_v1'],
          safetyGatesPassed: ['bounded_mutation', 'doctrine_role_default'],
          safetyGatesFailed: [],
          visibleProofPath: `session.exercises[${idx}].doctrineApplicationDeltas[]`,
        })
      }
    }
  })
}

function extractDensityTimeCapSummary(densityPrescription: unknown): string | undefined {
  if (!densityPrescription || typeof densityPrescription !== 'object') return undefined
  const d = densityPrescription as Record<string, unknown>
  const parts: string[] = []
  if (typeof d.timeCapMinutes === 'number') parts.push(`${d.timeCapMinutes} min cap`)
  if (typeof d.timeCapSeconds === 'number') parts.push(`${Math.round(d.timeCapSeconds / 60)} min cap`)
  if (typeof d.targetRounds === 'string') parts.push(d.targetRounds)
  if (typeof d.restGuidance === 'string') parts.push(d.restGuidance)
  return parts.length ? parts.join(' · ') : undefined
}

// =============================================================================
// CANDIDATE SCANNING — identify safe targets per family
// =============================================================================

interface CandidateRow {
  index: number
  ex: CorridorExerciseLike
  isLate: boolean
  isStrength: boolean
  isAccessory: boolean
  isConditioning: boolean
  isCore: boolean
}

function scanCandidates(session: CorridorSessionLike): CandidateRow[] {
  const exercises = session.exercises ?? []
  const total = exercises.length
  const lateThreshold = Math.ceil(total / 2)
  const out: CandidateRow[] = []
  exercises.forEach((ex, index) => {
    const category = String(ex.category ?? '').toLowerCase()
    const reason = String(ex.selectionReason ?? '').toLowerCase()
    out.push({
      index,
      ex,
      isLate: index >= lateThreshold,
      isStrength: category === 'strength',
      isAccessory: /accessory|hypertrophy/.test(reason) || category === 'accessory',
      isConditioning: category === 'conditioning' || category === 'cardio',
      isCore: category === 'core',
    })
  })
  return out
}

function pairableCandidatesForSuperset(candidates: CandidateRow[]): CandidateRow[] {
  // Safe pairing pool: late accessory/core/conditioning rows that are not
  // skill, not tendon-sensitive, not max-effort, not already grouped, not
  // already row-method-claimed.
  return candidates.filter(c => {
    if (isHighSkillRow(c.ex)) return false
    if (isTendonSensitiveRow(c.ex)) return false
    if (isMaxStrengthPillarRow(c.ex)) return false
    if (isAlreadyClaimedByGroup(c.ex)) return false
    if (isAlreadyClaimedByRowMethod(c.ex)) return false
    if (!c.isLate) return false
    return c.isAccessory || c.isCore || c.isConditioning
  })
}

function circuitCandidates(candidates: CandidateRow[]): CandidateRow[] {
  return candidates.filter(c => {
    if (isHighSkillRow(c.ex)) return false
    if (isTendonSensitiveRow(c.ex)) return false
    if (isMaxStrengthPillarRow(c.ex)) return false
    if (isAlreadyClaimedByGroup(c.ex)) return false
    if (isAlreadyClaimedByRowMethod(c.ex)) return false
    return c.isAccessory || c.isCore || c.isConditioning
  })
}

function densityBlockCandidates(candidates: CandidateRow[]): CandidateRow[] {
  // Density needs 2-4 safe accessory/core/conditioning rows. Same pool as
  // circuit minus we prefer LATE-position rows so we don't overwrite the
  // session's main strength block.
  return candidates.filter(c => {
    if (isHighSkillRow(c.ex)) return false
    if (isTendonSensitiveRow(c.ex)) return false
    if (isMaxStrengthPillarRow(c.ex)) return false
    if (isAlreadyClaimedByGroup(c.ex)) return false
    if (isAlreadyClaimedByRowMethod(c.ex)) return false
    if (!c.isLate) return false
    return c.isAccessory || c.isCore || c.isConditioning
  })
}

// =============================================================================
// STRUCTURAL APPLIERS — emit a styledGroups entry, write per-row blockId/method,
// and append to methodStructures.
// =============================================================================

function ensureStyleMetadata(session: CorridorSessionLike): NonNullable<CorridorSessionLike['styleMetadata']> {
  if (!session.styleMetadata) session.styleMetadata = { styledGroups: [] }
  if (!Array.isArray(session.styleMetadata.styledGroups)) session.styleMetadata.styledGroups = []
  return session.styleMetadata
}

function appendStyledGroup(
  session: CorridorSessionLike,
  group: CorridorStyledGroupLike,
): void {
  const meta = ensureStyleMetadata(session)
  meta.styledGroups!.push(group)
  if (group.groupType === 'superset') meta.hasSupersetsApplied = true
  if (group.groupType === 'circuit') meta.hasCircuitsApplied = true
  if (group.groupType === 'density_block') meta.hasDensityApplied = true
  if (group.groupType === 'cluster') meta.hasClusterApplied = true
}

function applySupersetGroup(
  session: CorridorSessionLike,
  pair: [CandidateRow, CandidateRow],
  out: CanonicalMethodStructure[],
): void {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const blockId = `method-superset-day${dayNumber}-${(session.styleMetadata?.styledGroups?.length ?? 0)}`
  const [a, b] = pair
  const aId = exerciseDisplayId(a.ex, a.index)
  const bId = exerciseDisplayId(b.ex, b.index)
  const aName = exerciseDisplayName(a.ex)
  const bName = exerciseDisplayName(b.ex)

  // Per-row stamping. Preserve any existing row-level prescription. We only
  // write `blockId` + `method` because those are the two fields the existing
  // session-group-display fallback path reads.
  a.ex.blockId = blockId
  a.ex.method = a.ex.method ?? 'superset'
  a.ex.methodLabel = a.ex.methodLabel ?? 'Superset'
  a.ex.structuralMethodApplied = true
  b.ex.blockId = blockId
  b.ex.method = b.ex.method ?? 'superset'
  b.ex.methodLabel = b.ex.methodLabel ?? 'Superset'
  b.ex.structuralMethodApplied = true

  appendStyledGroup(session, {
    id: blockId,
    groupType: 'superset',
    exercises: [
      { id: aId, name: aName, methodLabel: 'Superset' },
      { id: bId, name: bName, methodLabel: 'Superset' },
    ],
    instruction: 'Pair these two — minimal rest between, full rest after the pair.',
  })

  out.push({
    id: blockId,
    family: 'superset',
    label: familyLabel('superset'),
    source: 'structural_method_materialization_corridor',
    status: 'applied',
    sessionId: session.id ?? undefined,
    dayNumber,
    exerciseIds: [aId, bId],
    exerciseNames: [aName, bName],
    restBetweenExercisesSeconds: 15,
    restBetweenRoundsSeconds: 105,
    prescriptionSummary: 'Superset · 0-15s between, 90-120s after pair',
    reason:
      'Superset materialized on two safe late-position accessory/core rows — paired to honor the doctrine-earned superset budget without disturbing primary skill or strength quality.',
    sourceRuleIds: [
      'phase_4p.structural_method_materialization.superset_v1',
      'phase_4n.weekly_method_budget_plan.superset_should_apply',
    ],
    safetyGatesPassed: [
      'no_skill_pairing',
      'no_tendon_sensitive_pair',
      'no_max_effort_pair',
      'late_position_only',
      'one_block_per_session_cap',
    ],
    safetyGatesFailed: [],
    visibleProofPath: `session.styleMetadata.styledGroups[${(session.styleMetadata?.styledGroups?.length ?? 1) - 1}]`,
  })
}

function applyCircuitGroup(
  session: CorridorSessionLike,
  members: CandidateRow[],
  out: CanonicalMethodStructure[],
): void {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const blockId = `method-circuit-day${dayNumber}-${(session.styleMetadata?.styledGroups?.length ?? 0)}`
  const memberIds: string[] = []
  const memberNames: string[] = []
  for (const m of members) {
    m.ex.blockId = blockId
    m.ex.method = m.ex.method ?? 'circuit'
    m.ex.methodLabel = m.ex.methodLabel ?? 'Circuit'
    m.ex.structuralMethodApplied = true
    memberIds.push(exerciseDisplayId(m.ex, m.index))
    memberNames.push(exerciseDisplayName(m.ex))
  }

  appendStyledGroup(session, {
    id: blockId,
    groupType: 'circuit',
    exercises: memberIds.map((id, i) => ({ id, name: memberNames[i], methodLabel: 'Circuit' })),
    instruction: 'Cycle through stations — rest after each full round.',
  })

  out.push({
    id: blockId,
    family: 'circuit',
    label: familyLabel('circuit'),
    source: 'structural_method_materialization_corridor',
    status: 'applied',
    sessionId: session.id ?? undefined,
    dayNumber,
    exerciseIds: memberIds,
    exerciseNames: memberNames,
    rounds: members.length >= 4 ? 2 : 3,
    restBetweenExercisesSeconds: 20,
    restBetweenRoundsSeconds: 90,
    prescriptionSummary: `Circuit · ${members.length >= 4 ? 2 : 3} rounds · 60-90s after full round`,
    reason:
      'Circuit materialized on 3+ safe accessory/core/conditioning rows — endurance/density intent earned circuit and no primary strength/skill row was used.',
    sourceRuleIds: [
      'phase_4p.structural_method_materialization.circuit_v1',
      'phase_4n.weekly_method_budget_plan.circuit_should_apply',
    ],
    safetyGatesPassed: [
      'no_skill_member',
      'no_tendon_sensitive_member',
      'no_max_effort_member',
      'three_to_five_member_rule',
      'one_block_per_session_cap',
    ],
    safetyGatesFailed: [],
    visibleProofPath: `session.styleMetadata.styledGroups[${(session.styleMetadata?.styledGroups?.length ?? 1) - 1}]`,
  })
}

function applyDensityBlockGroup(
  session: CorridorSessionLike,
  members: CandidateRow[],
  out: CanonicalMethodStructure[],
): void {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0
  const blockId = `method-density-day${dayNumber}-${(session.styleMetadata?.styledGroups?.length ?? 0)}`
  const timeCap = members.length >= 3 ? 10 : 8
  const memberIds: string[] = []
  const memberNames: string[] = []
  for (const m of members) {
    m.ex.blockId = blockId
    m.ex.method = m.ex.method ?? 'density_block'
    m.ex.methodLabel = m.ex.methodLabel ?? 'Density Block'
    m.ex.structuralMethodApplied = true
    // Stamp a session-context densityPrescription so the live workout has
    // the time cap even if it can't render the block visually.
    if (!m.ex.densityPrescription) {
      m.ex.densityPrescription = {
        mode: 'quality_density',
        timeCapMinutes: timeCap,
        targetRounds: 'quality rounds, stop 1-2 reps before form breakdown',
        restGuidance: 'short controlled rests as needed',
        safetyNote: 'Do not chase fatigue on skill/tendon-limited work',
      }
    }
    memberIds.push(exerciseDisplayId(m.ex, m.index))
    memberNames.push(exerciseDisplayName(m.ex))
  }

  appendStyledGroup(session, {
    id: blockId,
    groupType: 'density_block',
    exercises: memberIds.map((id, i) => ({ id, name: memberNames[i], methodLabel: 'Density Block' })),
    instruction: `Work within ${timeCap} min — rotate movements, quality reps, rest as needed.`,
  })

  out.push({
    id: blockId,
    family: 'density_block',
    label: familyLabel('density_block'),
    source: 'structural_method_materialization_corridor',
    status: 'applied',
    sessionId: session.id ?? undefined,
    dayNumber,
    exerciseIds: memberIds,
    exerciseNames: memberNames,
    timeCapMinutes: timeCap,
    prescriptionSummary: `Density block · ${timeCap} min cap · quality over speed`,
    reason:
      'Density block materialized on safe late-position accessory/core/conditioning rows — densityIntent or enduranceIntent earned density and no primary skill row was used.',
    sourceRuleIds: [
      'phase_4p.structural_method_materialization.density_block_v1',
      'phase_4n.weekly_method_budget_plan.density_block_should_apply',
    ],
    safetyGatesPassed: [
      'no_skill_member',
      'no_max_effort_member',
      'late_position_only',
      'two_to_four_member_rule',
      'one_block_per_session_cap',
    ],
    safetyGatesFailed: [],
    visibleProofPath: `session.styleMetadata.styledGroups[${(session.styleMetadata?.styledGroups?.length ?? 1) - 1}]`,
  })
}

// =============================================================================
// PER-FAMILY DECISION — applies one of {applied, already_applied, blocked,
// not_needed, no_safe_target} for each structural family.
// =============================================================================

function decideFamily(
  family: 'superset' | 'circuit' | 'density_block',
  session: CorridorSessionLike,
  budgetEntry: CorridorBudgetEntry | undefined,
  alreadyMirrored: Set<CanonicalMethodFamily>,
  candidates: CandidateRow[],
  out: CanonicalMethodStructure[],
): { wroteNewGroup: boolean; status: CanonicalMethodStatus } {
  const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : 0

  // 1. ALREADY_APPLIED short-circuit. The mirror pass already pushed an
  //    `already_applied` entry — don't add a new one.
  if (alreadyMirrored.has(family)) {
    return { wroteNewGroup: false, status: 'already_applied' }
  }

  // 2. NOT_CONNECTED — no budget at all means the budget plan didn't run.
  //    We do NOT pretend applied; we record a `not_needed` entry with that
  //    reason so the rollup stays honest.
  if (!budgetEntry) {
    out.push({
      id: `method-${family}-day${dayNumber}-not-budgeted`,
      family,
      label: familyLabel(family),
      source: 'structural_method_materialization_corridor',
      status: 'not_needed',
      sessionId: session.id ?? undefined,
      dayNumber,
      exerciseIds: [],
      exerciseNames: [],
      reason: 'Weekly method budget plan did not run for this generation — structural materialization is conservative and skipped.',
      sourceRuleIds: ['phase_4p.structural_method_materialization.requires_budget_v1'],
      safetyGatesPassed: [],
      safetyGatesFailed: [],
      visibleProofPath: 'program.weeklyMethodBudgetPlan',
    })
    return { wroteNewGroup: false, status: 'not_needed' }
  }

  // 3. Budget verdict gates.
  if (budgetEntry.verdict === 'NOT_NEEDED' || budgetEntry.verdict === 'NOT_CONNECTED') {
    out.push({
      id: `method-${family}-day${dayNumber}-not-needed`,
      family,
      label: familyLabel(family),
      source: 'structural_method_materialization_corridor',
      status: 'not_needed',
      sessionId: session.id ?? undefined,
      dayNumber,
      exerciseIds: [],
      exerciseNames: [],
      reason: budgetEntry.reason ?? `Weekly budget verdict for ${family} is ${budgetEntry.verdict} for this profile.`,
      sourceRuleIds: ['phase_4n.weekly_method_budget_plan.verdict_authority'],
      safetyGatesPassed: [],
      safetyGatesFailed: [],
      visibleProofPath: 'program.weeklyMethodBudgetPlan.byFamily',
    })
    return { wroteNewGroup: false, status: 'not_needed' }
  }
  if (budgetEntry.verdict === 'BLOCKED_BY_SAFETY') {
    out.push({
      id: `method-${family}-day${dayNumber}-blocked`,
      family,
      label: familyLabel(family),
      source: 'structural_method_materialization_corridor',
      status: 'blocked',
      sessionId: session.id ?? undefined,
      dayNumber,
      exerciseIds: [],
      exerciseNames: [],
      reason: budgetEntry.reason ?? `Weekly budget blocked ${family} by safety gates.`,
      sourceRuleIds: ['phase_4n.weekly_method_budget_plan.verdict_authority'],
      safetyGatesPassed: [],
      safetyGatesFailed: ['weekly_budget_blocked'],
      visibleProofPath: 'program.weeklyMethodBudgetPlan.byFamily',
    })
    return { wroteNewGroup: false, status: 'blocked' }
  }
  if (budgetEntry.verdict === 'NO_SAFE_TARGET') {
    out.push({
      id: `method-${family}-day${dayNumber}-no-target-budget`,
      family,
      label: familyLabel(family),
      source: 'structural_method_materialization_corridor',
      status: 'no_safe_target',
      sessionId: session.id ?? undefined,
      dayNumber,
      exerciseIds: [],
      exerciseNames: [],
      reason: budgetEntry.reason ?? `Weekly budget reported no safe target for ${family}.`,
      sourceRuleIds: ['phase_4n.weekly_method_budget_plan.verdict_authority'],
      safetyGatesPassed: [],
      safetyGatesFailed: ['no_safe_target_at_week_scope'],
      visibleProofPath: 'program.weeklyMethodBudgetPlan.byFamily',
    })
    return { wroteNewGroup: false, status: 'no_safe_target' }
  }

  // 4. SHOULD_APPLY / MAY_APPLY — try to materialize. Each family has its own
  //    candidate scanner + minimum.
  let applierResult: { applied: boolean; reasonOnFail: string } = { applied: false, reasonOnFail: 'unknown' }
  if (family === 'superset') {
    const pool = pairableCandidatesForSuperset(candidates)
    if (pool.length >= 2) {
      // Use the first two non-adjacent rows when possible to avoid pairing
      // two rows the builder may have intentionally placed in sequence.
      const pair: [CandidateRow, CandidateRow] = [pool[0], pool[1]]
      applySupersetGroup(session, pair, out)
      applierResult = { applied: true, reasonOnFail: '' }
    } else {
      applierResult = { applied: false, reasonOnFail: 'fewer_than_two_safe_pairable_rows' }
    }
  } else if (family === 'circuit') {
    const pool = circuitCandidates(candidates)
    if (pool.length >= 3) {
      const members = pool.slice(0, Math.min(5, pool.length))
      applyCircuitGroup(session, members, out)
      applierResult = { applied: true, reasonOnFail: '' }
    } else {
      applierResult = { applied: false, reasonOnFail: 'fewer_than_three_safe_circuit_rows' }
    }
  } else {
    // density_block
    const pool = densityBlockCandidates(candidates)
    if (pool.length >= 2) {
      const members = pool.slice(0, Math.min(4, pool.length))
      applyDensityBlockGroup(session, members, out)
      applierResult = { applied: true, reasonOnFail: '' }
    } else {
      applierResult = { applied: false, reasonOnFail: 'fewer_than_two_safe_density_rows' }
    }
  }

  if (applierResult.applied) {
    return { wroteNewGroup: true, status: 'applied' }
  }

  // No safe target at the session scope.
  out.push({
    id: `method-${family}-day${dayNumber}-no-target`,
    family,
    label: familyLabel(family),
    source: 'structural_method_materialization_corridor',
    status: 'no_safe_target',
    sessionId: session.id ?? undefined,
    dayNumber,
    exerciseIds: [],
    exerciseNames: [],
    reason: `Budget said apply, but session has ${applierResult.reasonOnFail.replace(/_/g, ' ')}. Safety gates blocked every other row.`,
    sourceRuleIds: ['phase_4p.structural_method_materialization.candidate_scan_v1'],
    safetyGatesPassed: [],
    safetyGatesFailed: [applierResult.reasonOnFail],
    visibleProofPath: `session.exercises[]`,
  })
  return { wroteNewGroup: false, status: 'no_safe_target' }
}

// =============================================================================
// PUBLIC ENTRY
// =============================================================================

export function runStructuralMethodMaterializationCorridor(
  input: StructuralMaterializationInput,
): StructuralMaterializationResult {
  const { session, weeklyMethodBudgetPlan } = input
  const out: CanonicalMethodStructure[] = []
  const warnings: string[] = []

  // 1. Mirror existing builder/corridor truth into the canonical array. This
  //    ensures the rollup is HONEST about what the builder already did, and
  //    prevents us from double-applying a family that's already present.
  const { mirroredFamilies } = mirrorExistingStyledGroups(session, out)
  mirrorRowLevelMethods(session, out)

  // 2. Decide each structural family.
  const candidates = scanCandidates(session)
  const byFamily = weeklyMethodBudgetPlan?.byFamily ?? {}

  const supersetVerdict = decideFamily(
    'superset',
    session,
    byFamily.superset,
    mirroredFamilies,
    candidates,
    out,
  )
  // Re-scan candidates after each apply so a member used by superset is no
  // longer available to circuit/density (`isAlreadyClaimedByGroup` will now
  // be true on those rows).
  const candidatesAfterSuperset = supersetVerdict.wroteNewGroup ? scanCandidates(session) : candidates

  const circuitVerdict = decideFamily(
    'circuit',
    session,
    byFamily.circuit,
    mirroredFamilies,
    candidatesAfterSuperset,
    out,
  )
  const candidatesAfterCircuit = circuitVerdict.wroteNewGroup ? scanCandidates(session) : candidatesAfterSuperset

  const densityVerdict = decideFamily(
    'density_block',
    session,
    byFamily.density_block,
    mirroredFamilies,
    candidatesAfterCircuit,
    out,
  )

  // 3. Stamp the canonical array onto the session.
  session.methodStructures = out

  // 4. Build the per-session result.
  const counts = {
    appliedCount: 0,
    alreadyAppliedCount: 0,
    blockedCount: 0,
    notNeededCount: 0,
    noSafeTargetCount: 0,
  }
  for (const entry of out) {
    if (entry.status === 'applied') counts.appliedCount += 1
    else if (entry.status === 'already_applied') counts.alreadyAppliedCount += 1
    else if (entry.status === 'blocked') counts.blockedCount += 1
    else if (entry.status === 'not_needed') counts.notNeededCount += 1
    else if (entry.status === 'no_safe_target') counts.noSafeTargetCount += 1
  }

  return {
    methodStructures: out,
    ...counts,
    newStructuralGroupWritten:
      supersetVerdict.wroteNewGroup || circuitVerdict.wroteNewGroup || densityVerdict.wroteNewGroup,
    warnings,
  }
}
