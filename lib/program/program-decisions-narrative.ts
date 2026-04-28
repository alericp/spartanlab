/**
 * =============================================================================
 * [PHASE Y3 OF 3] PROGRAM DECISIONS NARRATIVE
 * =============================================================================
 *
 * Pure TypeScript, JSON-safe, side-effect-free.
 *
 * The Program page's top "Program Decisions" block was rendering a flat global
 * label like `Intensity: Conservative`, derived from
 * `program.unifiedDoctrineDecision.dosageRules.intensityBias`. That value
 * captures the *intent* before generation — it never sees the actual lived
 * weekly truth Phase Y2 produces in
 * `program.trainingDifferentiationCalibration`.
 *
 * Y3's job is NOT to rewrite the engine. It's to derive a coach-facing label
 * from the Y2 truth that already exists, so the top chip matches what the day
 * cards already show.
 *
 * This helper:
 *   - Reads ONLY fields stamped on the program by Y1/Y2 (no DB, no fetch).
 *   - Returns null/`available:false` when Y2 is absent, so legacy programs
 *     keep their existing chip layout.
 *   - Adds a `consistencyNote` when the legacy `intensityBias` would be
 *     misleading vs the actual session-level wave.
 *   - Never invents claims (e.g. won't call a week "Density-supported" unless
 *     `densityBlocksMaterialized > 0`).
 *
 * Intentionally NOT exported as React. UI consumes the plain object.
 * -------------------------------------------------------------------------- */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export interface ProgramDecisionsNarrative {
  /** True when Y2 calibration is present and we can produce coach copy. */
  available: boolean

  /**
   * Short coach-facing strategy label (replaces the flat "Conservative" chip).
   * E.g. "Controlled skill-strength wave", "Skill-protected wave",
   * "Mixed skill + capacity week", "Primary skill-strength with support".
   */
  topLevelStrategyLabel: string | null

  /**
   * Single-sentence athlete-facing rationale. Reads like a coach explaining
   * the week, not a debug log.
   */
  supportingSentence: string | null

  /** "2 high · 3 moderate · 1 low" or null when Y2 absent. */
  perDayStressBreakdown: string | null

  /** "RPE 7–8 wave with skill protection at 6.5–7" or null. */
  rpeWaveSummary: string | null

  /**
   * Density-honest verdict.
   *   - "real_density"          – at least one materialized density block
   *   - "capacity_supportive"   – density honestly demoted to capacity
   *   - "no_density"            – no density planned
   */
  densityVerdict: 'real_density' | 'capacity_supportive' | 'no_density'

  /** Athlete-facing density description (only present when meaningful). */
  densityVisibleLine: string | null

  /** "Skill-protected week" / "Tendon-protected week" / null. */
  safetyTag: string | null

  /**
   * Optional consistency note when the legacy global label would mislead.
   * Belongs in proof/details, NOT the main visible chip strip.
   */
  consistencyNote: string | null

  /**
   * Internal correction log — present when Y3 overrode the legacy label.
   * Used by Phase X / proof accordion. Never user-facing.
   */
  internalCorrections: string[]

  /**
   * The legacy `intensityBias` we read for cross-check, so the proof layer
   * can surface "Summary corrected from legacy ‘Conservative’ to
   * session-derived ‘Controlled wave’".
   */
  legacyIntensityBias: string | null
}

// =============================================================================
// INPUT-SHAPE GUARDS (defensive — every field is `unknown` until proven)
// =============================================================================

interface Y2WeeklyRoleRow {
  dayNumber: number
  roleId: string
  roleLabel: string
  intendedStressLevel: 'low' | 'moderate' | 'high'
  intendedRPEBand: string
  primaryAdaptation: string
  secondaryAdaptation: string
  methodBudget: string
  densityAllowed: boolean
  heavyPairingAllowed: boolean
  reason: string
}

interface Y2CalibrationLite {
  protectedWeek: boolean
  protectionReason: string | null
  totals: {
    rpeRowsLifted: number
    rpeRowsHeld: number
    densityBlocksMaterialized: number
    densityBlocksHonestlyDemoted: number
    pairingsMitigated: number
    pairingsDemotedToStraight: number
    skinTheCatPlusC2BHandled: boolean
  }
  weeklyRoleSummary: Y2WeeklyRoleRow[]
}

function readCalibration(program: unknown): Y2CalibrationLite | null {
  if (!program || typeof program !== 'object') return null
  const cal = (program as { trainingDifferentiationCalibration?: unknown })
    .trainingDifferentiationCalibration
  if (!cal || typeof cal !== 'object') return null
  const c = cal as Record<string, unknown>

  const totals = c.totals && typeof c.totals === 'object' ? (c.totals as Record<string, unknown>) : null
  const wrs = Array.isArray(c.weeklyRoleSummary) ? (c.weeklyRoleSummary as unknown[]) : []

  const cleanWrs: Y2WeeklyRoleRow[] = []
  for (const r of wrs) {
    if (!r || typeof r !== 'object') continue
    const row = r as Record<string, unknown>
    const stress = row.intendedStressLevel
    if (stress !== 'low' && stress !== 'moderate' && stress !== 'high') continue
    cleanWrs.push({
      dayNumber: typeof row.dayNumber === 'number' ? row.dayNumber : 0,
      roleId: typeof row.roleId === 'string' ? row.roleId : 'unknown',
      roleLabel: typeof row.roleLabel === 'string' ? row.roleLabel : 'Day',
      intendedStressLevel: stress,
      intendedRPEBand: typeof row.intendedRPEBand === 'string' ? row.intendedRPEBand : '',
      primaryAdaptation: typeof row.primaryAdaptation === 'string' ? row.primaryAdaptation : '',
      secondaryAdaptation: typeof row.secondaryAdaptation === 'string' ? row.secondaryAdaptation : '',
      methodBudget: typeof row.methodBudget === 'string' ? row.methodBudget : '',
      densityAllowed: row.densityAllowed === true,
      heavyPairingAllowed: row.heavyPairingAllowed === true,
      reason: typeof row.reason === 'string' ? row.reason : '',
    })
  }

  return {
    protectedWeek: c.protectedWeek === true,
    protectionReason: typeof c.protectionReason === 'string' ? c.protectionReason : null,
    totals: {
      rpeRowsLifted: numOr(totals?.rpeRowsLifted, 0),
      rpeRowsHeld: numOr(totals?.rpeRowsHeld, 0),
      densityBlocksMaterialized: numOr(totals?.densityBlocksMaterialized, 0),
      densityBlocksHonestlyDemoted: numOr(totals?.densityBlocksHonestlyDemoted, 0),
      pairingsMitigated: numOr(totals?.pairingsMitigated, 0),
      pairingsDemotedToStraight: numOr(totals?.pairingsDemotedToStraight, 0),
      skinTheCatPlusC2BHandled: totals?.skinTheCatPlusC2BHandled === true,
    },
    weeklyRoleSummary: cleanWrs,
  }
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function readLegacyIntensityBias(program: unknown): string | null {
  if (!program || typeof program !== 'object') return null
  const ud = (program as { unifiedDoctrineDecision?: unknown }).unifiedDoctrineDecision
  if (!ud || typeof ud !== 'object') return null
  const dr = (ud as { dosageRules?: unknown }).dosageRules
  if (!dr || typeof dr !== 'object') return null
  const ib = (dr as { intensityBias?: unknown }).intensityBias
  return typeof ib === 'string' ? ib.toLowerCase() : null
}

function readPrimaryGoal(program: unknown): string | null {
  if (!program || typeof program !== 'object') return null
  const pg = (program as { primaryGoal?: unknown }).primaryGoal
  return typeof pg === 'string' ? pg : null
}

// =============================================================================
// DERIVATION
// =============================================================================

interface StressTally {
  high: number
  moderate: number
  low: number
}

function tallyStress(rows: Y2WeeklyRoleRow[]): StressTally {
  const out: StressTally = { high: 0, moderate: 0, low: 0 }
  for (const r of rows) out[r.intendedStressLevel] += 1
  return out
}

/**
 * Decides the top-level strategy label from the lived weekly truth.
 *
 * Rules (priority order):
 *   1. If protected week + skill-protected role count is dominant
 *      -> "Skill-protected wave"
 *   2. If a single primary skill-strength role appears AND there are
 *      density/capacity days AND moderate RPE wave
 *      -> "Primary skill-strength with capacity support"
 *   3. If high stress days exist AND low stress days exist (true wave)
 *      -> "Controlled skill-strength wave"
 *   4. If only moderate days
 *      -> "Even moderate skill-strength week"
 *   5. If predominantly low stress
 *      -> "Recovery-emphasis week"
 *   6. Otherwise fall back to "Mixed skill week".
 */
function deriveStrategyLabel(
  rows: Y2WeeklyRoleRow[],
  tally: StressTally,
  cal: Y2CalibrationLite,
): string {
  const total = rows.length || 1
  const hasPrimaryStrength = rows.some(
    (r) => r.roleId === 'primary_strength_emphasis',
  )
  const hasSecondarySupport = rows.some((r) => r.roleId === 'secondary_support')
  const hasDensityCapacity = rows.some((r) => r.roleId === 'density_capacity')
  const hasSkillQuality = rows.some(
    (r) => r.roleId === 'skill_quality_emphasis',
  )
  const hasRecovery = rows.some((r) => r.roleId === 'recovery_supportive')
  const hasBroadMixed = rows.some((r) => r.roleId === 'broad_mixed_volume')

  // 1) Protected week with multiple skill-quality / recovery days dominant
  if (
    cal.protectedWeek &&
    (hasSkillQuality || hasRecovery) &&
    tally.high === 0
  ) {
    return 'Skill-protected wave'
  }

  // 2) Primary strength + capacity support + at least one skill-quality day
  if (hasPrimaryStrength && hasDensityCapacity && (hasSkillQuality || hasSecondarySupport)) {
    return 'Primary skill-strength with capacity support'
  }

  // 3) Real wave (high + low both present)
  if (tally.high > 0 && tally.low > 0) {
    return 'Controlled skill-strength wave'
  }

  // 3b) Strength-leaning wave (high present, no low — modest wave)
  if (tally.high > 0 && tally.moderate > 0) {
    return 'Strength-biased skill week'
  }

  // 4) Even moderate
  if (tally.moderate >= total * 0.7 && tally.high === 0 && tally.low === 0) {
    return 'Even moderate skill-strength week'
  }

  // 5) Recovery dominant
  if (tally.low >= total * 0.6) {
    return 'Recovery-emphasis week'
  }

  // 6) Broad mixed dominant
  if (hasBroadMixed && hasSecondarySupport) {
    return 'Balanced expression week'
  }

  return 'Mixed skill week'
}

/**
 * Builds a one-sentence athlete-facing supporting line.
 */
function deriveSupportingSentence(
  rows: Y2WeeklyRoleRow[],
  tally: StressTally,
  cal: Y2CalibrationLite,
  primaryGoal: string | null,
): string {
  const goalText =
    primaryGoal && primaryGoal.trim().length > 0
      ? `${primaryGoal} skill quality`
      : 'main skill quality'

  // Identify intent fragments
  const fragments: string[] = []

  if (cal.protectedWeek && cal.protectionReason) {
    fragments.push(
      `${cal.protectionReason.toLowerCase().includes('week 1') || cal.protectionReason.toLowerCase().includes('first') ? 'Acclimation week' : 'Protected week'} — caps trimmed by 0.5 RPE so straight-arm and skill positions stay clean`,
    )
  }

  if (tally.high > 0 && tally.low > 0) {
    fragments.push(
      `${tally.high} higher-stress strength day${tally.high === 1 ? '' : 's'} alternates with ${tally.low} lower-stress skill-quality day${tally.low === 1 ? '' : 's'} so frequency stays high without overloading tendons`,
    )
  } else if (tally.high > 0) {
    fragments.push(
      `${tally.high} strength-biased day${tally.high === 1 ? '' : 's'} carries the bent-arm work while ${tally.moderate} support day${tally.moderate === 1 ? '' : 's'} build${tally.moderate === 1 ? 's' : ''} pattern volume`,
    )
  } else if (tally.moderate >= rows.length * 0.7) {
    fragments.push(
      `Every day stays in the controlled-effort window to protect ${goalText} while building pattern exposure`,
    )
  } else if (tally.low >= rows.length * 0.6) {
    fragments.push(
      `Lower-stress sessions preserve frequency while joints and tendons recover from straight-arm and pulling work`,
    )
  }

  if (cal.totals.densityBlocksMaterialized > 0) {
    fragments.push(
      `${cal.totals.densityBlocksMaterialized === 1 ? 'one capacity block uses' : `${cal.totals.densityBlocksMaterialized} capacity blocks use`} tightened rest to build work tolerance without stealing skill quality`,
    )
  } else if (cal.totals.densityBlocksHonestlyDemoted > 0) {
    fragments.push(
      `density was demoted to capacity-supportive pairings rather than faked — skill quality wins the tiebreak`,
    )
  }

  if (cal.totals.pairingsMitigated + cal.totals.pairingsDemotedToStraight > 0) {
    fragments.push(
      `${cal.totals.pairingsDemotedToStraight + cal.totals.pairingsMitigated} high-overlap pairing${cal.totals.pairingsDemotedToStraight + cal.totals.pairingsMitigated === 1 ? ' was' : 's were'} rest-separated or demoted to straight sets so fatigue overlap doesn't compromise position quality`,
    )
  }

  if (fragments.length === 0) {
    return `Each session has a defined role to balance ${goalText} with support work and recovery.`
  }

  // Capitalize first fragment, join with semicolons for compactness
  const head = fragments[0]
  const headOut = head.charAt(0).toUpperCase() + head.slice(1)
  const tailOut = fragments.slice(1).join('; ')
  return tailOut.length > 0 ? `${headOut}; ${tailOut}.` : `${headOut}.`
}

/**
 * Builds the "2 high · 3 moderate · 1 low" breakdown.
 */
function deriveStressBreakdown(tally: StressTally): string | null {
  const total = tally.high + tally.moderate + tally.low
  if (total === 0) return null
  const parts: string[] = []
  if (tally.high > 0) parts.push(`${tally.high} high`)
  if (tally.moderate > 0) parts.push(`${tally.moderate} moderate`)
  if (tally.low > 0) parts.push(`${tally.low} low`)
  return parts.join(' \u00B7 ')
}

/**
 * Builds the RPE wave summary by collapsing all per-day intendedRPEBand
 * strings into a "min–max" with skill-protected callout.
 *
 * intendedRPEBand looks like "RPE 7.5–8.5", "RPE 6.5–7", etc. We parse the
 * numeric range, take overall min/max, and call out the protection case.
 */
function deriveRpeWaveSummary(rows: Y2WeeklyRoleRow[]): string | null {
  if (rows.length === 0) return null
  const numRe = /(\d+(?:\.\d+)?)/g
  let overallMin = Infinity
  let overallMax = -Infinity
  let protectedMin = Infinity
  let protectedMax = -Infinity
  let strengthMin = Infinity
  let strengthMax = -Infinity
  for (const r of rows) {
    const matches = r.intendedRPEBand.match(numRe)
    if (!matches || matches.length === 0) continue
    const nums = matches.map((m) => parseFloat(m)).filter((n) => Number.isFinite(n))
    if (nums.length === 0) continue
    const lo = Math.min(...nums)
    const hi = Math.max(...nums)
    overallMin = Math.min(overallMin, lo)
    overallMax = Math.max(overallMax, hi)
    if (
      r.roleId === 'skill_quality_emphasis' ||
      r.roleId === 'recovery_supportive' ||
      r.roleId === 'density_capacity'
    ) {
      protectedMin = Math.min(protectedMin, lo)
      protectedMax = Math.max(protectedMax, hi)
    }
    if (
      r.roleId === 'primary_strength_emphasis' ||
      r.roleId === 'secondary_support'
    ) {
      strengthMin = Math.min(strengthMin, lo)
      strengthMax = Math.max(strengthMax, hi)
    }
  }
  if (!Number.isFinite(overallMin) || !Number.isFinite(overallMax)) return null

  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(/\.0$/, ''))
  const overall = `RPE ${fmt(overallMin)}\u2013${fmt(overallMax)}`

  const hasProtected = Number.isFinite(protectedMin) && Number.isFinite(protectedMax)
  const hasStrength = Number.isFinite(strengthMin) && Number.isFinite(strengthMax)

  if (hasProtected && hasStrength && protectedMax < strengthMin + 0.4) {
    return `${overall} wave \u2014 strength rows ${fmt(strengthMin)}\u2013${fmt(strengthMax)}, skill rows protected at ${fmt(protectedMin)}\u2013${fmt(protectedMax)}`
  }
  if (hasProtected && !hasStrength) {
    return `${overall} \u2014 skill-protected window`
  }
  return overall
}

/**
 * Density verdict from Y2 totals.
 */
function deriveDensity(cal: Y2CalibrationLite): {
  verdict: 'real_density' | 'capacity_supportive' | 'no_density'
  visibleLine: string | null
} {
  if (cal.totals.densityBlocksMaterialized > 0) {
    return {
      verdict: 'real_density',
      visibleLine:
        cal.totals.densityBlocksMaterialized === 1
          ? 'One capacity block uses tightened rest and a real time cap'
          : `${cal.totals.densityBlocksMaterialized} capacity blocks use tightened rest and real time caps`,
    }
  }
  if (cal.totals.densityBlocksHonestlyDemoted > 0) {
    return {
      verdict: 'capacity_supportive',
      visibleLine:
        'Density demoted to capacity-supportive pairings — skill quality wins the tiebreak this week',
    }
  }
  return { verdict: 'no_density', visibleLine: null }
}

/**
 * Safety tag.
 */
function deriveSafetyTag(cal: Y2CalibrationLite, rows: Y2WeeklyRoleRow[]): string | null {
  if (cal.protectedWeek) {
    if (cal.protectionReason && /tendon|skill/i.test(cal.protectionReason)) {
      return 'Tendon-protected week'
    }
    return 'Acclimation week'
  }
  // Heuristic: if every day has a low or moderate stress level and at least
  // one role is skill_quality_emphasis, surface "Skill-protected" softly.
  const allCool = rows.every((r) => r.intendedStressLevel !== 'high')
  const hasSkillQuality = rows.some((r) => r.roleId === 'skill_quality_emphasis')
  if (allCool && hasSkillQuality) {
    return 'Skill-protected week'
  }
  return null
}

/**
 * Detects whether the legacy global label disagrees with the lived wave.
 */
function deriveConsistency(
  legacy: string | null,
  rows: Y2WeeklyRoleRow[],
  tally: StressTally,
  topLevelStrategyLabel: string,
): { note: string | null; corrections: string[] } {
  const corrections: string[] = []
  if (!legacy) return { note: null, corrections }

  const total = rows.length || 1
  // Legacy says "conservative" but week has true contrast or any high day
  if (legacy === 'conservative' && (tally.high > 0 || (tally.high === 0 && tally.moderate >= total * 0.6))) {
    corrections.push(
      `legacy_intensityBias=conservative; session-derived label=${topLevelStrategyLabel}; reason=tally_high=${tally.high} tally_moderate=${tally.moderate}`,
    )
    return {
      note: `Top label corrected from legacy "Conservative" to session-derived "${topLevelStrategyLabel}".`,
      corrections,
    }
  }
  // Legacy says "aggressive" but no high stress day exists
  if (legacy === 'aggressive' && tally.high === 0) {
    corrections.push(
      `legacy_intensityBias=aggressive; session-derived label=${topLevelStrategyLabel}; reason=no_high_stress_day`,
    )
    return {
      note: `Top label corrected from legacy "Aggressive" to session-derived "${topLevelStrategyLabel}".`,
      corrections,
    }
  }
  return { note: null, corrections }
}

// =============================================================================
// MAIN ENTRYPOINT
// =============================================================================

/**
 * Build the Y3 narrative from the program object. Pure, defensive, never
 * throws. Returns `available: false` when Y2 calibration is missing so the
 * Program page falls back to its legacy chip strip.
 */
export function buildProgramDecisionsNarrative(
  program: unknown,
): ProgramDecisionsNarrative {
  const empty: ProgramDecisionsNarrative = {
    available: false,
    topLevelStrategyLabel: null,
    supportingSentence: null,
    perDayStressBreakdown: null,
    rpeWaveSummary: null,
    densityVerdict: 'no_density',
    densityVisibleLine: null,
    safetyTag: null,
    consistencyNote: null,
    internalCorrections: [],
    legacyIntensityBias: readLegacyIntensityBias(program),
  }

  const cal = readCalibration(program)
  if (!cal || cal.weeklyRoleSummary.length === 0) {
    return empty
  }

  const rows = cal.weeklyRoleSummary
  const tally = tallyStress(rows)
  const primaryGoal = readPrimaryGoal(program)

  const topLevelStrategyLabel = deriveStrategyLabel(rows, tally, cal)
  const supportingSentence = deriveSupportingSentence(rows, tally, cal, primaryGoal)
  const perDayStressBreakdown = deriveStressBreakdown(tally)
  const rpeWaveSummary = deriveRpeWaveSummary(rows)
  const density = deriveDensity(cal)
  const safetyTag = deriveSafetyTag(cal, rows)

  const legacyIntensityBias = readLegacyIntensityBias(program)
  const consistency = deriveConsistency(
    legacyIntensityBias,
    rows,
    tally,
    topLevelStrategyLabel,
  )

  return {
    available: true,
    topLevelStrategyLabel,
    supportingSentence,
    perDayStressBreakdown,
    rpeWaveSummary,
    densityVerdict: density.verdict,
    densityVisibleLine: density.visibleLine,
    safetyTag,
    consistencyNote: consistency.note,
    internalCorrections: consistency.corrections,
    legacyIntensityBias,
  }
}
